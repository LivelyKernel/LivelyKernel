module('lively.ide.SystemCodeBrowser').requires('lively.ide.BrowserFramework', 'lively.ide.SystemBrowserNodes', 'lively.ide.BrowserCommands', 'lively.ide.SourceDatabase', 'lively.ide.SyntaxHighlighting').toRun(function() {

// ===========================================================================
// Browsing js files and OMeta
// ===========================================================================
lively.ide.BasicBrowser.subclass('lively.ide.SystemBrowser',
'settings', {

    documentation: 'Browser for source code parsed from js files',
    viewTitle: "SystemBrowser",
    isSystemBrowser: true,
},
'initializing', {

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
        var locInput = this.locationInput();
        if (!locInput) return;
        
        locInput.addScript(function onMouseDown(evt) {
            var wasHandled = $super(evt);
            if (wasHandled || !evt.isRightMouseButtonDown()) { return false; }
            
            var menu = [
                ['Codebase', self.switchToLivelyCodebase.bind(self)], 
                ['Local', self.switchToLocalCodebase.bind(self) ]];
            lively.morphic.Menu.openAtHand(null, menu);
            evt.stop();
            return true;   
        }, undefined, {self: this});
        
        connect(this, 'targetURL', this, 'setLocationInputFromURL');
        connect(this.locationInput(), 'savedTextString', this, 'setTargetUrlFromString');
        this.locationInput().applyStyle({fontSize: 8, textColor: Color.darkGray, borderWidth: 0});
    },
    switchToLocalCodebase: function() {
        this.setTargetURL(
            $world.getUserName() ? 
                $world.getUserDir() : 
                URL.source.getDirectory());
    },

    switchToLivelyCodebase: function() {
        this.setTargetURL(URL.codeBase.withFilename('lively/'));        
    },

    setLocationInputFromURL: function(targetUrl) {
        var codeBaseString = String(this.sourceDatabase().codeBaseURL);
        var targetString = String(targetUrl);
        var locationInputString = targetString.replace(codeBaseString, '');
        this.locationInput().setTextString(locationInputString);
    },
    setTargetUrlFromString: function(aString) {
        var targetUrlString = aString; 
        
        if (aString.indexOf('.') > -1) {
            var module = lively.module(urlOrString);
            lively.ide.browse(null, null, {name: module.name()}, this);
            return;
        }
        if (! aString.startsWith('http://')) {
            targetUrlString = String(this.sourceDatabase().codeBaseURL).concat(aString);
        }
        this.setTargetURL(new URL(targetUrlString))
    },



},
'accessing', {
    getTargetURL: function() {
        if (!this.targetURL) this.targetURL = this.sourceDatabase().codeBaseURL;
        return this.targetURL;
    },

    setTargetURL: function(urlOrString) {
        var url = urlOrString || URL.root;
        if (Object.isString(urlOrString) ) {
            try {
                
                if (urlOrString.startsWith('http://')) {
                    url = new URL(urlOrString);
                } else {
                    var module = lively.module(urlOrString);
                    lively.ide.browse(null, null, {name: module.name()}, this);
                    return;
                }
            } catch(e) {
                console.warn('SCB>>setTargetURL:' + e);
            }
        }
        url = url.withRelativePartsResolved();
        this.selectNothing();
        this.ensureSourceNotAccidentlyDeleted(function() {
            var prevURL = this.targetURL;
            // if (url.isLeaf())
            //     url = new URL(url.toString() + '/');
            try {
                this.targetURL = url;
                this.rootNode().locationChanged();
                this.allChanged();
            } catch(e) {
                show.log('couldn\'t set new URL ' + url + ' because ' + e);
                this.targetURL = prevURL;
                this.locationInput().setTextString(prevURL.toString());
                return
            }
            this.panel.targetURL = url; // FIXME for persistence
            console.log('new url: ' + url);
        });
    },

    setLocation: function() {},

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
            lively.ide.UnloadClassCommand,
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
    }
},
'browser actions', {
    getSelectedModule: function() {
        var currentModule, moduleName = this.currentModuleName;
        if (!moduleName || moduleName.include('undefined')) return null;
        var isFilePath = /^\/?([^\/\.]+(\/|\.js$))+/.test(moduleName);
        if (isFilePath) moduleName = moduleName.replace(/\..*$/, '').replace(/\//g, '.');
        return lively.lookup(moduleName);
    },

    withCurrentModuleActiveDo: function(func) {
        var currentModule = this.getSelectedModule();
        try {
            currentModule && currentModule.activate();
            return func.call(this);
        } catch (er) {
            throw(er);
        } finally {
            currentModule && currentModule.deactivate();
        }
    }
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

    browse: function(/*args*/) {
        // args can be:
        // 1. objectName, methodName, moduleNameOrSpec, optional browser instance
        //   Browse a method in a object (class, layer, etc)
        //   See MethodFinder for original implementation
        //   Example:
        //   objectName = "lively.morphic.Morph"
        //   methodName = "onMouseDown"
        //   moduleNameOrSpec = "lively.morphic.Events"
        //     || {name: "lively.ast.LivelyJSParser", type: 'ometa'};
        // 2. URL (URL object or string), optional browser instance
        // 3. path (String) relative to URL.root, optional browser instance

        var args = Array.from(arguments);
        if (args.length === 0) { this.openSystemCodeBrowser(); return }
        if (args.length <= 2) { // url or path or options object
            var url = args[0].toString().startsWith('http:') ?
                new URL(args[0]) : URL.root.withFilename(args[0]);
            this.browseURL(url, args[1]/*optional browser*/);
        } else {
            var objectName = args[0],
                methodName = args[1],
                moduleNameOrSpec = args[2],
                browser = args[3];

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
                return fileFragments[0].browseIt({browser: browser});
            } else {
                alert("could not browse " + methodName + " in " + objectName);
                rootNode.browseIt({browser: browser});
                return false;
            }

            return promise;
        }
    },

    browseURL: function(url, browser) {
        browser = browser || this.openSystemCodeBrowser();
        if (url.isLeaf()) {
            var dir = url.getDirectory(),
                fileName = url.filename();
            browser.setTargetURL(dir);
            browser.selectNodeMatching(function(node) {
                return node && node.url && node.url().filename() == fileName;
            })
        } else {
            browser.setTargetURL(url);
        }
        browser.panel.getWindow().comeForward();
        return browser;
    },

    openSystemCodeBrowser: function() {
        var browser = new lively.ide.SystemBrowser();
        browser.openIn(lively.morphic.World.current());
        return browser;
    }

});

}) // end of module
