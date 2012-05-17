module('lively.ide.SystemCodeBrowser').requires('lively.ide.BrowserFramework', 'lively.ide.SystemBrowserNodes', 'lively.ide.BrowserCommands', 'lively.ide.SourceDatabase', 'lively.ide.LocalBrowser'/*for local code*/, 'lively.ide.SyntaxHighlighting').toRun(function() {

// ===========================================================================
// Browsing js files and OMeta
// ===========================================================================
lively.ide.BasicBrowser.subclass('lively.ide.SystemBrowser', {

    documentation: 'Browser for source code parsed from js files',
    viewTitle: "SystemBrowser",
    isSystemBrowser: true,

    initialize: function($super) {
        $super();
        this.installFilter(lively.ide.NodeTypeFilter.defaultInstance(), 'Pane1');
        this.evaluate = true;
        this.targetURL = null;
    },

    onrestore: function() {
        if (this.panel) this.panel.onDeserialize.bind(this.panel).delay(0);
    },

    setupLocationInput: function($super) {
        $super();

        connect(this, 'targetURL', this.locationInput(), 'setTextString',
            {updater: function($upd, value) { value && $upd(String(value)) }});

        connect(this.locationInput(), 'savedTextString', this, 'setTargetURL',
            {converter: function(value) { return new URL(value) }});
        this.targetURL = this.targetURL // hrmpf
        this.locationInput().applyStyle({fontSize: 8, textColor: Color.darkGray, borderWidth: 0})

        this.panel.codeBaseDirBtn.setLabel('codebase');
        connect(this.panel.codeBaseDirBtn, 'fire', this, 'setTargetURL',
            {converter: function() { return URL.codeBase.withFilename('lively/')} })
        this.panel.codeBaseDirBtn.applyStyle({scaleProportional: true, label: {fontSize: 8}, padding: Rectangle.inset(2)})

        this.panel.localDirBtn.setLabel('local');
        connect(this.panel.localDirBtn, 'fire', this, 'setTargetURL',
            {converter: function() { return URL.source.getDirectory() }});
        this.panel.localDirBtn.applyStyle({scaleProportional: true, label: {fontSize: 8}, padding: Rectangle.inset(2)})
    },

    getTargetURL: function() {
        if (!this.targetURL) this.targetURL = this.sourceDatabase().codeBaseURL;
        return this.targetURL;
    },

    setTargetURL: function(url) {
        url = url.withRelativePartsResolved();
        this.selectNothing();
        this.ensureSourceNotAccidentlyDeleted(function() {
            var prevURL = this.targetURL;
            if (!url.toString().endsWith('/'))
                url = new URL(url.toString() + '/');
            try {
                this.targetURL = url;
                this.rootNode().locationChanged();
                this.allChanged();
            } catch(e) {
                console.log('couldn\'t set new URL ' + url + ' because ' + e);
                this.targetURL = prevURL;
                this.locationInput().setTextString(prevURL.toString());
                return
            }
            this.panel.targetURL = url; // FIXME for persistence
            console.log('new url: ' + url);
        });
    },

    rootNode: function() {
        var srcCtrl = lively.ide.startSourceControl();
        if (!this._rootNode)
            this._rootNode = new lively.ide.SourceControlNode(srcCtrl, this, null);
        return this._rootNode;
    },

    commands: function() {
        // lively.ide.BrowserCommand.allSubclasses().collect(function(ea) { return ea.type}).join(',\n')
        return [
            // lively.ide.BrowseWorldCommand,
            lively.ide.AddNewFileCommand,
            lively.ide.AllModulesLoadCommand,
            lively.ide.ShowLineNumbersCommand,
            // lively.ide.RefreshCommand,
            lively.ide.ParserDebugCommand,
            lively.ide.EvaluateCommand,
            lively.ide.SortCommand,
            lively.ide.ViewSourceCommand,
            lively.ide.ClassHierarchyViewCommand,
            lively.ide.AddClassToFileFragmentCommand,
            lively.ide.AddObjectExtendToFileFragmentCommand,
            lively.ide.AddLayerToFileFragmentCommand,
            lively.ide.AddMethodToFileFragmentCommand,
            lively.ide.RunTestMethodCommand,
            lively.ide.OpenInFileEditorCommand,
            lively.ide.OpenVersionsOfFile,
            lively.ide.OpenDiffViewerCommand,
            lively.ide.OpenModulePartCommand]
    },


    sourceDatabase: function() {
        return this.rootNode().target;
    },

});

Object.extend(lively.ide.SystemBrowser, {
    // lively.ide.SystemBrowser.browse('lively.Examples')
    browse: function(moduleName, klassName, methodName) {
        var browser = new lively.ide.SystemBrowser();
        browser.openIn(lively.morphic.World.current());

        var targetModule = module(moduleName),
            moduleURL = new URL(targetModule.uri()),
            dir = moduleURL.getDirectory(),
            fileName  = moduleURL.filename();

        var srcCtrl = lively.ide.startSourceControl();
        srcCtrl.addModule(targetModule.relativePath());

        browser.setTargetURL(dir);
        fileName && browser.inPaneSelectNodeNamed('Pane1', fileName);
        klassName && browser.inPaneSelectNodeNamed('Pane2', klassName);
        methodName && browser.inPaneSelectNodeNamed('Pane4', methodName);

        return browser;
    },
});

Object.extend(lively.ide, {
    browse: function(objectName, methodName, moduleNameOrSpec) {
        // Browse a method in a object (class, layer, etc)
        // See MethodFinder for original implementation
        // Example:
        // objectName = "lively.morphic.Morph"
        // methodName = "onMouseDown"
        // moduleNameOrSpec = "lively.morphic.Events"
        //    || {name: "lively.ast.LivelyJSParser", type: 'ometa'};

        var promise = {}, moduleName, moduleType;
        if (Object.isString(moduleNameOrSpec)) {
            moduleName = moduleNameOrSpec;
        } else if (moduleNameOrSpec.name) {
            moduleName = moduleNameOrSpec.name;
            moduleType = moduleNameOrSpec.type || moduleType;
        }

        if (objectName) {
            objectName = objectName.replace(/^Global\./,"");
        }

        var relative = module(moduleName).relativePath(moduleType),
            moduleNode = lively.ide.startSourceControl().addModule(relative),
            rootNode = moduleNode.ast(),
            fileFragments = rootNode.subElements(10).select(function(ea) {
                var path = ea.getOwnerNamePath();
                return path.include(objectName) && (!methodName || path.include(methodName));
            });

        if (fileFragments.length > 0) {
            return fileFragments[0].browseIt()
        } else {
            alert("could not browse " + methodName + " in " + objectName);
            rootNode.browseIt();
            return false;
        }

        return promise;
    },
    browseURL: function(url) {
        var browser = this.openSystemCodeBrowser();
        if (url.isLeaf()) {
            var dir = url.getDirectory(),
                fileName = url.filename();
            browser.setTargetURL(dir);
        } else {
            browser.setTargetURL(url);
        }
        
    },
    openSystemCodeBrowser: function() {
        var browser = new lively.ide.SystemBrowser();
        browser.openIn(lively.morphic.World.current());
        return browser;
    },


});
}) // end of module