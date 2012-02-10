module('lively.ide.LocalBrowser').requires('lively.ChangeSet', 'lively.ide.BrowserFramework', 'lively.ide.BrowserCommands').toRun(function() {

// ===========================================================================
// Browsing ChangeSets
// ===========================================================================
lively.ide.BasicBrowser.subclass('lively.ide.LocalCodeBrowser', {

    documentation: 'Browser for the local ChangeSet',
    viewTitle: "LocalCodeBrowser",
    allPaneNames: ['Pane1', 'Pane2', 'Pane3'],

    panelSpec: [
        //['locationPane', newTextPane, new Rectangle(0, 0, 1, 0.05)],
        ['Pane1', newDragnDropListPane, new Rectangle(0,   0, 0.4, 0.5)],
        ['Pane2', newDragnDropListPane, new Rectangle(0.4, 0, 0.3, 0.5)],
        ['Pane3', newDragnDropListPane, new Rectangle(0.7, 0, 0.3, 0.5)],
        ['midResizer', function(b) { return new HorizontalDivider(b) }, new Rectangle(0, 0.44, 1, 0.01)],
        ['sourcePane', newTextPane, new Rectangle(0, 0.45, 1, 0.49)],
        ['bottomResizer', function(b) { return new HorizontalDivider(b) }, new Rectangle(0, 0.94, 1, 0.01)],
        ['commentPane', newTextPane, new Rectangle(0, 0.95, 1, 0.05)]
    ],

    initialize: function($super, optWorldProxy) {
        $super();
        this.worldProxy = optWorldProxy;
        this.changeSet = (optWorldProxy && optWorldProxy.getChangeSet()) || ChangeSet.current();
        this.evaluate = true;
    },

    rootNode: function() {
        // lively.ide.startSourceControl();
        if (!this._rootNode)
            this._rootNode = this.changeSet.asNode(this);
        return this._rootNode;
    },

    commands: function() {
        return [lively.ide.BrowseWorldCommand,
        lively.ide.SaveChangesCommand,
        lively.ide.RefreshCommand,
        lively.ide.EvaluateCommand,
        lively.ide.SortCommand,
        lively.ide.ChangeSetMenuCommand,
        lively.ide.ClassChangeMenuCommand,
        lively.ide.RunTestMethodCommand]
    },

});

lively.ide.BrowserNode.subclass('lively.ide.ChangeNode', {

    documentation: 'Abstract node for Changes/ChangeSet nodes',

    isChangeNode: true,

    asString: function() {
        return this.target.getName() + (this.target.automaticEvalEnabled() ? '' : ' (disabled)');
    },

    menuSpec: function() {
        var spec = [];
        var n = this;
        var t = n.target;
        spec.push(['remove', function() {
            t.remove();
            n.browser.allChanged() }]);
        if (t.automaticEvalEnabled())    
            spec.push(['disable evaluation at startup', function() {
                t.disableAutomaticEval(); n.signalChange(); }]);
        else
            spec.push(['enable evaluation at startup', function() {
                t.enableAutomaticEval(); n.signalChange(); }]);
        return spec;
    },
    
    sourceString: function() {
        return this.target.asJs();
    },

    saveSource: function(newSource) {
        var change = Change.fromJS(newSource);
        this.target.setXMLElement(change.getXMLElement());
        this.savedSource = this.target.asJs();
        return true;
    },
    
    evalSource: function(newSource) {
        if (!this.browser.evaluate) return false;
        /*if (this.target.getDefinition() !== newSource)
        throw dbgOn(new Error('Inconsistency while evaluating and saving?'));*/
        this.target.evaluate();
        return true
    },
    
    onDrop: function(other) {
        if (!other) return;
        console.log(' Moving ' + this.target + ' to ' + other.target);
        this.target.remove();
        other.handleDrop(this);
        this.signalChange();
    },
    
    onDrag: function() {
        // onDrop does all the work
    },
    
    handleDrop: function(nodeDroppedOntoMe) {
        if (!(nodeDroppedOntoMe instanceof lively.ide.ChangeNode))
            return false;
        this.target.addSubElement(nodeDroppedOntoMe.target);
        return true;
    },

});


lively.ide.ChangeNode.subclass('lively.ide.ChangeSetNode', {

    childNodes: function() {
        return this.target.subElements().collect(function(ea) { return ea.asNode(this.browser)}, this);
    },
    
    sourceString: function($super) {
        return '';
    },
    
    asString: function() {
        return this.target.name;
    },

    onSelect: function() { this.browser.currentModuleName = undefined },
});

lively.ide.ChangeNode.subclass('lively.ide.ChangeSetClassNode', {

    isClassNode: true,
    
    childNodes: function() {
        return this.target.getCategories().collect(function(ea) {debugger; return ea.asNode(this.browser) }, this);
    }, 
    
    asString: function($super) {
        return $super() + ' [class]';
    },
});
lively.ide.ChangeNode.subclass('lively.ide.ChangeSetMethodCategoryNode', {

    isMethodCategoryNode: true,
    
    childNodes: function() {
        return this.target.subElements().collect(function(ea) { return ea.asNode(this.browser)}, this);
    }, 

    saveSource: function(newSource) {
        this.target.setDefinition(newSource);
        this.savedSource = this.target.asJs();
        return true;
    },
});

lively.ide.ChangeNode.subclass('lively.ide.ChangeSetClassElemNode', {
    isMemberNode: true,

    handleDrop: function(nodeDroppedOntoMe) {
        if (!(nodeDroppedOntoMe instanceof lively.ide.ChangeSetClassElemNode))
            return false;
        this.target.parent().addSubElement(nodeDroppedOntoMe.target, this.target);
        return true;
    },

    asString: function() {
        return this.target.getName() + (this.target.isStaticChange ? ' [static]' : ' [proto]');
    },

});

lively.ide.ChangeNode.subclass('lively.ide.ChangeSetDoitNode', {

    sourceString: function() {
        return this.target.getDefinition();
    },

    saveSource: function(newSource) {
        this.target.setDefinition(newSource);
        this.savedSource = this.target.getDefinition();
        return true;
    },

    menuSpec: function($super) {
        var spec = $super();
        var n = this;
        var t = n.target;
        spec.unshift(['set name', function() {
            lively.morphic.World.current().prompt(
                'Set doit name',
                function(input) { t.setName(input);    n.signalChange(); },
                t.getName())
             }]);
        return spec;
    },

    asString: function($super) {
        return $super() + ' [doit]';
    },
    
    evalSource: function($super, source) {
        var result = $super(source);
        // FIXME move elsewhere....!!!! own subclass?
        if (result && this.target.isWorldRequirementsList) {
            var list = this.target.evaluate();
            if (!Object.isArray(list)) return result;
            list.forEach(function(moduleName) {
                module(moduleName).load();
                console.log('loading ' + moduleName);
            })
        }
        return result;
    },
    
});
lively.ide.ChangeSetNode.subclass('lively.ide.RemoteChangeSetNode', {

    initialize: function($super, target, browser, parent, worldProxy) {
        // target will become a ChangeSet when world is loaded but can now be undefined
        $super(target, browser, parent);
        this.worldProxy = worldProxy;
    },

    childNodes: function($super) {
        if (!this.target)
            this.worldProxyFetchChangeSet();
        return $super();
    },

    sourceString: function($super) {
        if (!this.target)
            this.worldProxyFetchChangeSet();
        return $super();
    },
    
    asString: function() {
        return this.worldProxy.localName() + (this.target == null ? ' (not loaded)' :  '');
    },

    menuSpec: function($super) {
        var spec = [];
        var node = this;
        spec.push(['push changes back', function() {
            node.pushChangesBack();
        }]);
        return $super().concat(spec);
    },

    worldProxyFetchChangeSet: function() {
        this.target = this.worldProxy.getChangeSet();
        this.signalChange();
    },

    pushChangesBack: function() {
        this.worldProxy.writeChangeSet(this.target);
    },

});
Change.addMethods({
    isStatic: Functions.True,
});

/* Double dispatch Change classes to browser nodes */
ChangeSet.addMethods({
    asNode: function(browser, parent) { return new lively.ide.ChangeSetNode(this, browser, parent) }
});
ClassChange.addMethods({
    asNode: function(browser, parent) { return new lively.ide.ChangeSetClassNode(this, browser, parent) }
});
MethodCategoryChange.addMethods({
    asNode: function(browser, parent) { return new lively.ide.ChangeSetMethodCategoryNode(this, browser, parent) }
});
ProtoChange.addMethods({
    isStatic: Functions.False,
    asNode: function(browser, parent) { return new lively.ide.ChangeSetClassElemNode(this, browser, parent) },
});
StaticChange.addMethods({
    asNode: function(browser, parent) { return new lively.ide.ChangeSetClassElemNode(this, browser, parent) }
});
DoitChange.addMethods({
    asNode: function(browser, parent) { return new lively.ide.ChangeSetDoitNode(this, browser, parent) }
});


// ===========================================================================
// Browsing Remote ChangeSets
// ===========================================================================
lively.ide.BasicBrowser.subclass('lively.ide.WikiCodeBrowser', {

    documentation: 'Browser for the local ChangeSet',
    viewTitle: "WikiCodeBrowser",

    panelSpec: [
        ['Pane1', newDragnDropListPane, new Rectangle(0, 0, 0.3, 0.45)],
        ['Pane2', newDragnDropListPane, new Rectangle(0.3, 0, 0.35, 0.45)],
        ['Pane3', newDragnDropListPane, new Rectangle(0.65, 0, 0.35, 0.45)],
        ['sourcePane', newTextPane, new Rectangle(0, 0.5, 1, 0.5)],
    ],

    initialize: function($super, wikiUrl) {
        $super();
        this.wikiUrl = wikiUrl;
        this.evaluate = true;
    },

    rootNode: function() {
        lively.ide.startSourceControl();
        if (!this._rootNode)
            this._rootNode = new lively.ide.WikiCodeNode(WikiNetworkAnalyzer.forRepo(this.wikiUrl), this, null);
        return this._rootNode;
    },

    commands: function() {
        return [lively.ide.BrowseWorldCommand,
        lively.ide.RefreshCommand,
        lively.ide.EvaluateCommand,
        lively.ide.SortCommand,
        lively.ide.ChangeSetMenuCommand,
        lively.ide.ClassChangeMenuCommand]
    },

});
 

lively.ide.BrowserNode.subclass('lively.ide.WikiCodeNode', {
    
    documentation: 'The rootNode which gets the code from worlds of a wiki',

    initialize: function($super, target, browser, parent) {
        "console.assert(target instanceof WikiNetworkAnalyzer);"
        $super(target, browser, parent);
        this.worldsWereFetched = false;
    },
    childNodes: function() {
        if (this._childNodes)
            return this._childNodes;
        if (!this.worldsWereFetched)
            this.updateWithWorlds();
        var nodes = [];
        nodes.push(ChangeSet.current().asNode(this.browser));
        var proxies = this.target.getWorldProxies().select(function(ea) {
            return ea.localName().endsWith('xhtml')
        });
        nodes = nodes.concat(
            proxies.collect(function(ea) {
                return new lively.ide.RemoteChangeSetNode(null, this.browser, this, ea);
        }, this));
        this._childNodes = nodes;
        return nodes;
    },

    updateWithWorlds: function(fileList) {
        this.worldsWereFetched = true;
        this._childNodes = null;
        this.target.fetchFileList(function() {
            this._childNodes = null;
            this.signalChange();
        }.bind(this));
    },    
});

}) // end of module