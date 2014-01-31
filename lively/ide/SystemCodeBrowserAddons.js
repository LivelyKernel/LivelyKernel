module('lively.ide.SystemCodeBrowserAddons').requires('lively.ide.SystemCodeBrowser').toRun(function() {

lively.Config.addOption({name: 'historyBrowserMaxLength', value: 15, docString: 'Upper bound for navigating back in a browser with history addon.', group: 'lively.ide.tools', type: 'number'});

Object.subclass('lively.ide.SCBAddons.History',
'settings', {
    documentation: 'Modification of the SCB to add History Browsing',
    isSystemBrowser: true,
    readme: function() {
        // var scb = new lively.ide.SystemBrowser(),
        //     hist = new lively.ide.SCBAddons.History(scb);
        // hist.history
        // hist.backInTime(1);
        
        // Issues:
        //   - switching url does not switch to a new rootNode in SCB. Therefore, we have 
        //     to specialize to it, and are not compatible with other BasicBrowser-subclasses.
        return 'I am an addon to the Source Code Browser, adding two buttons and allowing history navigation.'
    },
},
'initializing', {
    initialize: function($super, browser) {
        this.history = [];
        if (browser) {
            this.latchOnTo(browser);
        }
    },
},
'history management', {
    paneNSelectionOf: function(switchedTo) {
        // The pane are set to unselected (null) frequently.
        if(!switchedTo.node  || (this.history.length > 0 && switchedTo.node === this.history[this.history.length - 1].node))
            return;
        this.history.push(switchedTo)
        if( this.history.length > (Config.get('historyBrowserMaxLength') || 15)){
            this.history.shift();
        };
        // Possible Improvement: detect whether switchedTo was a step into the future and only remove that from the future...
        this.future = [];
    },
    backInTime: function(n) {
        this.assertLatchedOn();
        var steps = n || 1,
            switchTo;

        if(this.history.length <= steps) {
            alert('Not enough history recorded to go back further. You can configure the number of steps by setting "Config.historyBrowserMaxLength" to the number of steps.');
            return;
        }
        var history = this.history.slice(0, -steps), // copy the array part that should be kept
            future = this.history.slice(-steps).concat(this.future);
        if (history.length == 0) alert('something"s wrong');
        switchTo = history[ history.length - 1];
        // alertOK('switching to node ' 
        //                 + String(switchTo.node) + ' in pane ' 
        //                 + switchTo.pane + '(' + this.history.length + ' left)');

        this.switchTo(switchTo.node, switchTo.pane)
        this.history = history;
        this.future = future;
    },
    forwardInTime: function(n) {
        this.assertLatchedOn();
        var steps = n || 1,
            switchTo;

        if(this.future.length < steps) {
            return;
        }
        var history = this.history.concat(this.future.slice(0, steps)),
            future = this.future.slice(steps);
        if (history.length == 0) alert('something"s wrong');
        switchTo = history[ history.length - 1];

        this.switchTo(switchTo.node, switchTo.pane)
        this.history = history;
        this.future = future;
    },
    assertLatchedOn: function() {
        if(!this.browser) {
            throw(new Error("Can not go back in time when there is no browser attached."))
        }
    },
},
'browser modification',{
    switchTo: function(node, paneNr) {
        this.assertLatchedOn();
        if (paneNr > 1 && this.browser['getPane' + (paneNr - 1) + 'Selection']() != node.parent){
            this.switchTo(node.parent, paneNr - 1)
        } else {
            if (paneNr == 1 && this.browser.rootNode() !== node.parent) {
                // this is not supported, because the rootNode is not switched out when switching 
                // between folders in the SCB
                throw new Error("this should not happen...")
            };
            if (paneNr == 1)
                if(node.url) { 
                    if (!node.url().getDirectory().eq(this.browser.targetURL))
                        this.browser.setTargetURL(node.url().getDirectory())
                } else if (node.completeURL) {
                    this.browser.setTargetURL(node.completeURL());
                    return;
                } else {
                    if (this.browser.constructor === lively.ide.SystemBrowser)
                        throw new Error('This case should not arrise in the SCB');
                }
        }
        // At least for javascript, the tree of nodes is not cached, but recreated whenever 
        // needed for display. As a result, we need to find the newly created node with the 
        // same name, for reshowing, in case our parent was switched away from in the meantime.
        var nodeName = node.asString(),
            newNodes = this.browser['getPane' + paneNr + 'Content'](),
            replacementNode = newNodes.find(function(listItem) { 
                return listItem.value === node || listItem.value.asString() == nodeName});
        if (!replacementNode) throw new Error('Error finding recreated node.');
        this.browser['setPane' + paneNr + 'Selection'](replacementNode.value)
    },


    latchOnTo: function(browser) {
        if(browser.panel.backInHistoryButton || browser.history) {
            alert('That browser already can go back.');
            return;
        }
        if(this.browser) {
            alert('This object already tracks changes for a browser.')
            return;
        }
        this.browser = browser
        connect(browser, 'pane1Selection', this, 'paneNSelectionOf', 
                {converter: function(newNode) { return {pane: 1, node: newNode}}});
        connect(browser, 'pane2Selection', this, 'paneNSelectionOf', 
                {converter: function(newNode) { return {pane: 2, node: newNode}}});
        connect(browser, 'pane3Selection', this, 'paneNSelectionOf', 
                {converter: function(newNode) { return {pane: 3, node: newNode}}});
        connect(browser, 'pane4Selection', this, 'paneNSelectionOf', 
                {converter: function(newNode) { return {pane: 4, node: newNode}}});
        
        var forwardButton = this.addForwardButtonTo(browser);
        var backButton = this.addBackButtonTo(browser);

        browser.history = this;
        this.buttons = [backButton, forwardButton];
    },
    addButtonToSCB: function(browser, label) {
        var panel = browser.panel,
            buttonExtent = panel.locationPaneMenuButton.getExtent(),
            newLocationPaneExtent = panel.locationPane.getExtent().subXY(buttonExtent.x, 0);
        panel.locationPane.setExtent(newLocationPaneExtent);

        var pos = panel.locationPaneMenuButton.getPosition(),
            bounds = new lively.Rectangle(pos.x, pos.y, buttonExtent.x, buttonExtent.y),
            button = new lively.morphic.Button(bounds, label);
        panel.addMorph(button);
        // line copied from SCB
        button.label.setPosition(button.label.getPosition().subPt(pt(0, 2)));
        panel.locationPaneMenuButton.setPosition(panel.locationPaneMenuButton.getPosition().subXY(buttonExtent.x, 0));
        panel.backInHistoryButton = button;
        
        button.history = this;
        button.applyStyle({
          scaleHorizontal: true,
          scaleVertical: true
        })
        
        return button
    },
    addBackButtonTo: function(browser) {
        var backButton = this.addButtonToSCB(browser, '<');

        connect(backButton, 'fire', this, 'backInTime');
        backButton.setName('Step back')

        backButton.enableMorphMenu();
        backButton.morphMenuItems = function() { return this.history.backMenuItems(); };

        return backButton;
    },
    addForwardButtonTo: function(browser) {
        var button = this.addButtonToSCB(browser, '>');

        connect(button, 'fire', this, 'forwardInTime');
        button.setName('Step forward')

        button.enableMorphMenu();
        button.morphMenuItems = function() { return this.history.forwardMenuItems(); };

        return button;
    },
},
'menus', {
    backMenuItems: function() {
        var self = this,
            historyLength = this.history.length;
        return this.history.slice(0, -1).collect(function(record, index) {
            return [self.getNameFor(record), function() {self.backInTime(historyLength - 1 - index)}]
        }).reverse()
    },
    forwardMenuItems: function() {
        var self = this;
        return this.future.collect(function(record, index) {
            return [self.getNameFor(record), function() {self.forwardInTime(index + 1)}]
        })
    },
    getNameFor: function(record) {
        var descriptor = '',
            nodeString;
        // parallel iteration over the parent chain and the panel numbers, 
        // in order to stop when either there is no parent or we reached 
        // the 0th panel, i.e. the root node.
        for(var node = record.node,
                max = record.pane; 
            max >= 1 && node; 
            max--, node = node.parent){
                if ((record.pane > 3 && max == 3) || record.pane > 1 && max == 1) 
                    continue;
                nodeString = max == 1 ? node.asString() : node.getName();
                if (record.pane == 3 && max == 2)
                    descriptor = nodeString + ' (' + descriptor.slice(0, -3) + ') : '
                else if (record.pane == 4 && max == 2)
                    descriptor = nodeString + ' >> ' + descriptor;
                else
                    descriptor = nodeString + ' : ' + descriptor;
        };
        // remove final delimiter
        return descriptor.slice(0, -3);
    },
}); // end of class

Object.extend(lively.ide.SCBAddons.History, {
    install: function() {
        var browserPrototype = lively.ide.BasicBrowser.prototype,
            setupFn = browserPrototype.setupLocationInput;
        if (setupFn.oldSetup) { return; }
        browserPrototype.setupLocationInput = function() {
            var value = setupFn.apply(this, arguments);
            new lively.ide.SCBAddons.History(this);
            return value
        };
        browserPrototype.setupLocationInput.oldSetup = setupFn;
    },
    deinstall: function() {
        var browserPrototype = lively.ide.BasicBrowser.prototype,
            setupFn = browserPrototype.setupLocationInput;
        if (!setupFn.oldSetup) { return; }
        browserPrototype.setupLocationInput = setupFn.oldSetup
    },
});

if (lively.Config.get('useHistoryTracking', true) === undefined) {
    lively.Config.addOption({
        name: 'useHistoryTracking', 
        value: false, 
        docString: 'When loading lively.ide.SystemCodeBrowserAddons, install history browsing for all future browsers, or not.', 
        group: 'lively.ide.tools', 
        type: 'boolean', 
        get: function() {
            return !!lively.ide.BasicBrowser.prototype.setupLocationInput.oldSetup
        }, 
        set: function(value) {
            if(value){
                lively.ide.SCBAddons.History.install();
            } else {
                lively.ide.SCBAddons.History.deinstall();
            }
        },});
} else if (lively.Config.get('useHistoryTracking') === true){
    lively.ide.SCBAddons.History.install();
}

}) // end of module
