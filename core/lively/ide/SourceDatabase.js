module('lively.ide.SourceDatabase').requires('lively.ide.FileParsing').toRun(function() {

// ===========================================================================
// Keeps track of parsed sources
// ===========================================================================
Object.subclass('lively.ide.ModuleWrapper',
'documentation', {
    documentation: 'Compatibility layer around normal modules for SourceCodeDatabase and other tools. Will probably merged with normal modules in the future.'
},
'settings', {
    forceUncached: true,
    doNotSerialize: ['_cachedSource'],
    isModuleWrapper: true
},
'initialization', {

    initialize: function(moduleName, type, source, isVirtual) {
        if (!moduleName || !type) {
            throw new Error('Cannot create ModuleWrapper without moduleName or type!');
        }
        if (!['js', 'ometa', 'st'].include(type)) {
            throw new Error('Unknown type ' + type + ' for ModuleWrapper ' + moduleName);
        }
        this._moduleName = moduleName;
        this._type = type; // can be js, ometa, st
        this._ast = null;
        this._cachedSource = source || null;
        this._isVirtual = isVirtual; // isVirtual means that there is no file for this module
        this.lastModifiedDate = null;
    }

},
'accessing', {

    type: function() { return this._type; },
    ast: function() { return this._ast; },
    isVirtual: function() { return this._isVirtual; },
    moduleName: function() { return this._moduleName; },

    fileURL: function() {
        //    works for core modules only:
        //    return URL.codeBase.withFilename(this.fileName())
        //    works for non-core modules only:
        //    return new URL(Config.rootPath).withFilename(this.fileName());
        //    might work for both, but slower
        return new URL(this.module().findUri(this.type()));
    },

    module: function() { return lively.module(this._moduleName); },
    fileName: function() { return this.module().relativePath(this.type()); },

    exists: function() { return this.isVirtual() || this.getSource() !== this.couldNodeGetSourceWarning(); },

    couldNodeGetSourceWarning: function() {
        return "could not retrieve source for " + this.fileURL();
    },

    getSourceUncached: function() {
        if (this.isVirtual()) return this._cachedSource;
        var webR = new WebResource(this.fileURL());
        if (this.forceUncached) webR.forceUncached();
        webR.beSync().get();
        if (!webR.status.isSuccess()) return this.couldNodeGetSourceWarning();
        this._cachedSource = webR.content || '';
        this.lastModifiedDate = webR.lastModified;
        return this._cachedSource;
    }
,

    setCachedSource: function(source) { this._cachedSource = source },

    getSource: function() {
        return this._cachedSource ? this._cachedSource : this.getSourceUncached();
    },

    getSourceFragment: function(startIdx, endIdx) { return this.getSource().slice(startIdx, endIdx); }

},
'parsing', {

    retrieveSourceAndParse: function(optSourceDB) {
        return this._ast = this.parse(this.getSource(), optSourceDB);
    },

    parserMethodMapping: {
        "js": 'parseJs',
        "ometa": 'parseOmeta'
    },

    parse: function(source, optSourceDB) {
        if (source === undefined) {
            throw dbgOn(new Error('ModuleWrapper ' + this.moduleName() + ' needs source to parse!'));
        }
        var parseMethodSelector = this.parserMethodMapping[this.type()];
        if (!parseMethodSelector) {
            throw dbgOn(new Error('Don\'t know how to parse ' + this.type() + ' of ' + this.moduleName()))
        }
        var root = this[parseMethodSelector](source);
        root.flattened().forEach(function(ea) { ea.sourceControl = optSourceDB });
        return root;
    },

    parseJs: function(source) {
        var fileFragments = new JsParser().parseSource(source, {fileName: this.fileName()}),
            root,
            firstRealFragment = fileFragments.detect(function(ea) { return ea.type !== 'comment' });
        if (firstRealFragment && firstRealFragment.type === 'moduleDef' && fileFragments.length == 1) {
            root = firstRealFragment;
        } else {
            root = new lively.ide.FileFragment(
                this.fileName(), 'completeFileDef', 0, source ? source.length-1 : 0,
                this.fileName(), fileFragments, this);
        }
        return root;
    },

    parseOmeta: function(source) {
        var fileFragments = new OMetaParser().parseSource(source, {fileName: this.fileName()}),
            root = new lively.ide.FileFragment(
                this.fileName(), 'ometaGrammar', 0, source.length-1, this.fileName(), fileFragments, this);
        return root;
    }

},
'saving', {

    queueSetSource: function(source, beSync, checkForOverwrites) {
        if (!this.queuedRequests) this.queuedRequests = [];
        this.queuedRequests.push(this.setSource.curry(source, beSync, checkForOverwrites));
    },

    removeQueuedRequests: function() { this.queuedRequests = []; },

    runQueuedRequest: function() {
        if (this.queuedRequests && this.queuedRequests.length > 0) {
            this.queuedRequests.shift().call(this);
        }
    },

    setSource: function(source, beSync, checkForOverwrites) {
        this.setCachedSource(source);
        if (this.isVirtual()) return;

        if (this.networkRequestInProgress) {
            this.queueSetSource(source, beSync, checkForOverwrites);
            return;
        }

        var webR = new WebResource(this.fileURL());
        this.networkRequestInProgress = true;
        lively.bindings.connect(webR, 'status', this, 'handleSaveStatus', {
            converter: function() { return this.sourceObj; }});

        var putOptions = {};
        if (checkForOverwrites) {
            putOptions.ifUnmodifiedSince = this.lastModifiedDate;
        }
        webR.beAsync().put(source, null, putOptions);
    },

    handleSaveStatus: function(webR) {
        var status = webR.status,
            world = lively.morphic.World.current();
        if (status.isDone()) {
            this.networkRequestInProgress = false;
            if (status.code() === 412) {
                this.askToOverwrite(status.url);
            } else if (status.isSuccess()) {
                this.lastModifiedDate = webR.lastModified;
                this.runQueuedRequest();
            } else if (status.isForbidden()) {
                world.createStatusMessage('Saving to:\n' + status.url + '\nis not allowed!', {
                    openAt: 'center', fill: Color.red, extent: pt(400, 75),
                    removeAfter: 5000 //, textStyle: { align: 'center' }
                });
            }
        }
        return webR;
    },

    askToOverwrite: function(url) {
        var world = lively.morphic.World.current(),
            moduleWrapper = this;
        world.confirm(
            String(url) + ' was changed since loading it. Overwrite?',
            function(input) {
                moduleWrapper.removeQueuedRequests();
                if (input) {
                    moduleWrapper.setSource(moduleWrapper.getSource(), false, false);
                }
            });
    }

},
'removing', {

    remove: function() {
        if (this.isVirtual()) return;
        new WebResource(this.fileURL()).del();
    }

},
'browsing', {
    browseIt: function() {
        show(String(this.fileURL()))
        debugger;
        lively.ide.browse("http://localhost:9001/core/lively/config.json")
        lively.ide.browse(String(this.fileURL()));
    }
});
lively.ide.ModuleWrapper.subclass('lively.ide.FileWrapper',
'documentation', {
    documentation: 'Similar to a module wrapper but for plain files if unsupported types. Allows reading/writing them but no parsing support.'
},
'initialization', {

    initialize: function(fileName, source, isVirtual) {
        if (!fileName) {
            throw new Error('Cannot create FileWrapper without fileName!');
        }
        this._fileName = fileName;
        this._cachedSource = source || null;
        this._isVirtual = isVirtual; // isVirtual means that there is no file for this module
        this.lastModifiedDate = null;
    }

},
'accessing', {
    type: function() { return this._fileName.split('.').last(); },
    ast: function() { return this; },
    isVirtual: function() { return this._isVirtual },
    moduleName: function() { return this._fileName },
    fileName: function() { return this._fileName },
    fileURL: function() { return URL.codeBase.withFilename(this.fileName()); },
},
'parsing', {
    retrieveSourceAndParse: function(optSourceDB) { return this.ast(); }
},
'file fragment compatibility', {
    getFileString: function() {
        return this.getSource();
    },
    getSourceCode: function() { return this.getSource(); },

    getName: function() { return this.fileName(); },
    putSourceCode: function(source) {
        this.setSource(source, true/*sync*/, true);
    }
});

Object.extend(lively.ide.ModuleWrapper, {

    forFile: function(fn, isVirtual) {
        var type = fn.substring(fn.lastIndexOf('.') + 1, fn.length),
            moduleName = fn;
        // FIXME this is WW-specific!
        // TODO Implement reverse module lookup that takes
        //   Config.modulePaths into consideration
        // FIXME FIXME FIXME
        while (moduleName.substring(0, 3) === '../') moduleName = moduleName.substring(3); // remove relative parts
        moduleName = moduleName.substring(0, moduleName.lastIndexOf('.')); // remove file extension like .js
        moduleName = moduleName.replace(/\./g, "\\.");
        moduleName = moduleName.replace(/\//g, '.'); // "/" -> "."
        try {
            return new lively.ide.ModuleWrapper(moduleName, type, null, isVirtual);
        } catch(e) {
            console.warn('Cannot create ModuleWrapper for ' + fn);
            return new lively.ide.FileWrapper(fn, null, isVirtual);
        }
    },

    newVirtualModuleId: function() { return "virtual_module.x" + Strings.newUUID().replace(/-/g, '_'); }

});

Object.subclass('AnotherSourceDatabase', {
    codeBaseURL: URL.codeBase,

    doNotSerialize: ['registeredBrowsers', 'modules'],

    initialize: function() {
        this.modules = {};
        this.registeredBrowsers = [];
    },

    ensureRealModuleName: function(moduleName) { // for migration to new module names
        if (moduleName.endsWith('.js')) {
            throw dbgOn(new Error('Old module name usage: ' + moduleName));
        }
    },

    rootFragmentForModule: function(fileName) {
        if (!Object.isString(fileName)) {
            throw dbgOn(new Error('Don\'t know what to do with ' + fileName));
        }
        var moduleWrapper = this.findModuleWrapperForFileName(fileName),
            root = moduleWrapper && moduleWrapper.ast();
        // if (!root)
        //     throw dbgOn(new Error('Cannot find parsed source for ' + fileName));
        return root;
    },

    allModules: function() {
        return Object.values(this.modules).select(function(ea) {
            return ea.isModuleWrapper;
        });
    },

    findModuleWrapperForFileName: function(fileName) {
        // support for Config.modulePaths == [users/, projects/]
        // FIXME this is a hack
        var m = fileName.match(/\.\.\/([A-Za-z0-9]+\/)(.*)/);
        if (m && Config.modulePaths.include(m[1])) {
            fileName = m[1] + m[2];
        }
        return this.allModules().detect(function(ea) { return ea.fileName() == fileName });
    },

    createModuleWrapperForFileName: function(fileName, isVirtual) {
        return lively.ide.ModuleWrapper.forFile(fileName, isVirtual);
    },

    addVirtualModule: function(moduleId, source, type) {
        moduleId = moduleId || lively.ide.ModuleWrapper.newVirtualModuleId();
        return this.addModuleWithId(moduleId, source, type, true);
    },

    addModule: function(fileName, source, isVirtual) {
        var moduleWrapper = this.findModuleWrapperForFileName(fileName);
        if (moduleWrapper) return moduleWrapper;
        moduleWrapper = this.createModuleWrapperForFileName(fileName, isVirtual);
        if (source) moduleWrapper.setCachedSource(source);
        moduleWrapper.retrieveSourceAndParse(this);
        return this.modules[fileName] = moduleWrapper;
    },

    addModuleWithId: function(moduleId, source, type, isVirtual) {
        var fileName = module(moduleId).relativePath(type);
        return this.addModule(fileName, source, isVirtual);
    },

    reparseModule: function(fileName, readAgain) {
        if (readAgain) {
            delete this.modules[fileName];
        }
        var moduleWrapper = this.findModuleWrapperForFileName(fileName);
        if (moduleWrapper) {
            moduleWrapper.retrieveSourceAndParse(this);
            return moduleWrapper;
        }
        return this.addModule(fileName);
    },

    reloadModule: function(fileName) {
        return this.reparseModule(fileName, true);
    },

    reloadAllModules: function(showProgress) {
        var mods = Object.keys(lively.ide.sourceDB().modules);
        if (showProgress)
            mods.forEachShowingProgress({
                iterator: this.reloadModule.bind(this),
                whenDoneFunc: function() {}
            });
        else
            mods.forEach(this.reloadModule.bind(this));
    },

    parseCompleteFile: function(fileName, newFileString) {
        var moduleWrapper = this.findModuleWrapperForFileName(fileName)
        if (!moduleWrapper) {
            throw dbgOn(new Error('Cannot parse for ' + fileName + ' because module is not in SourceControl'));
        }
        var root = newFileString ?
            moduleWrapper.parse(newFileString, this) :
            moduleWrapper.retrieveSourceAndParse(this);
        return root;
    },

    putSourceCodeFor: function(fileFragment, newFileString) {
        this.putSourceCodeForFile(fileFragment.fileName, newFileString);
    },

    putSourceCodeForFile: function(fileName, content) {
        if (!fileName) {
            throw dbgOn(new Error('No filename when trying to put source'));
        }
        var moduleWrapper = this.findModuleWrapperForFileName(fileName)
                         || this.createModuleWrapperForFileName(fileName);
        content = content.replace(/\r/gi, '\n');  // change all CRs to LFs
        console.log("Saving " + fileName + "...");
        moduleWrapper.setSource(content, false, true);
        console.log("... " + content.length + " bytes saved.");
    },

    getCachedText: function(fileName) { // Return full text of the named file
        var moduleWrapper = this.findModuleWrapperForFileName(fileName);
        if (!moduleWrapper) {
            // throw dbgOn(new Error('Cannot retrieve source code for '
            //                      + fileName + ' because module is not in SourceControl'));
            return '';
        }
        return moduleWrapper.getSource();
    },

    searchFor: function(str) {
        // search modules
        var roots = Object.values(lively.ide.SourceControl.modules).collect(function(ea) { return ea.ast() }),
            allFragments = roots.inject([], function(all, ea) { return all.concat(ea.flattened().uniq()) });

        return allFragments.select(function(ea) {
            return ea.getSourceCodeWithoutSubElements().include(str);
        });

    },

    scanLKFiles: function(beSync) {
        var ms = new Date().getTime();
        this.interestingLKFileNames(URL.codeBase.withFilename('lively/')).forEach(function(fileName) {
            this.addModule(fileName);
        }, this);
        console.log('Altogether: ' + (new Date().getTime()-ms)/1000 + 's');
    },

    allFiles: function() {
        this._allFiles = this._allFiles || this.interestingLKFileNames(this.codeBaseURL).uniq();
        return this._allFiles;
    },

    // browser stuff
    registerBrowser: function(browser) {
        if (this.registeredBrowsers.include(browser)) return;
        this.registeredBrowsers.push(browser);
    },

    unregisterBrowser: function(browser) {
        this.registeredBrowsers = this.registeredBrowsers.without(browser);
    },

    updateBrowsers: function(changedBrowser, changedNode) {
        var msStart = new Date().getTime();
        this.registeredBrowsers.without(changedBrowser).forEach(function(ea) { ea.allChanged(true, changedNode) });
        console.log('updated ' + this.registeredBrowsers.length + ' browsers in ' + (new Date().getTime()-msStart)/1000 + 's')
    },

    update: function() {
        this._allFiles = null;
    },

    addFile: function(filename) {
        this._allFiles.push(filename);
    },

    removeFile: function(fileName) {
        var moduleWrapper = this.findModuleWrapperForFileName(fileName);
        if (!moduleWrapper) {
            console.log('Trying to remove ' + fileName + ' bot no module found?');
            return;
        }
        moduleWrapper.remove();
    },

    switchCodeBase: function(newCodeBaseURL) {
        this.codeBaseURL = new URL(newCodeBaseURL.withRelativePartsResolved());
        try {
            this._allFiles = new WebResource(newCodeBaseURL).getSubElements().subDocuments.collect(function(ea) { return ea.getName() });
        } catch(e) {
            alert('Cannot switch to ' + newCodeBaseURL + ' because of ' + e);
            this._allFiles = [];
        }
    },

    prepareForMockModule: function(fileName, src) { // This is just used for testing!!!
        // DEPRECATED!
        this.modules[fileName] = lively.ide.ModuleWrapper.forFile(fileName);
        this.modules[fileName].setCachedSource(src);
        this.putSourceCodeFor = function(fileFragment, newFileString) {
            this.modules[fileName].setCachedSource(newFileString);
        }.bind(this);
        var root = this.reparseModule(fileName).ast();
        root.flattened().forEach(function(ea) { ea.sourceControl = this }, this);
        return root;
    },

    interestingLKFileNames: function(url) {
        var webR = new WebResource(url).beSync().getSubElements(),
            fileURLs = webR.subDocuments.concat(webR.subCollections).invoke("getURL");
        return fileURLs.map(this.mapURLToRelativeModulePaths.bind(this))
                       .filter(this.canBeDisplayedInSCB.bind(this)).uniq();
    },

    canBeDisplayedInSCB: function(url) {
        var matcher = /.*\.(st|js|ometa|css|snippets?|tmsnippets?)|(\/)$/;
        return matcher.test(String(url));
    },

    mapURLToRelativeModulePaths: function(url) {
        var path = url.withRelativePartsResolved().relativePathFrom(URL.root);
        if (path.startsWith('core/')) {
            path = path.slice('core/'.length);
        } else {
            if (!path.startsWith('/')) path = '/' + path;
            path = '..' + path;
        }
        return path;
    }


});

AnotherSourceDatabase.addMethods(
'FROM OLD SourceDatabase', {
    browseReferencesTo: function(str) {
        var searchFunc = function() {
            var fullList = this.searchFor(str);
            if (fullList.length > 300) {
                lively.morphic.World.current().alert(fullList.length.toString() + " references abbreviated to 300.");
                fullList = fullList.slice(0,299);
            }
            return fullList;
        }.bind(this);
        var refs = new ChangeList("References to " + str, null, searchFunc(), str, searchFunc);
        refs.openIn(lively.morphic.World.current());

    },

    searchFor: function(str) {
        var fullList = [];
        Properties.forEachOwn(this.cachedFullText, function(fileName, fileString) {
            var refs = new FileParser().parseFile(fileName, this.currentVersion(fileName), fileString, this, "search", str);
            fullList = fullList.concat(refs);
        }, this);
        return fullList;
    },

    getViewTitle: function() {
        return "Source Control for " + this.fileName;
    }
});

AnotherSourceDatabase.addMethods(
'code completion support', {
    createSymbolList: function() {
        // FIXME this needs cleanup!!!

        // is a list of names of classes, proto and static methods, objects, and functions defined
        // in all currently loaded namespaces

        var allClasses = Global.classes(true),
            allClassNames = allClasses.collect(function(klass) { return klass.name /*local name*/ }),
            namespaces = [Global].concat(Global.subNamespaces(true)),
            namespaceNames = namespaces.pluck('namespaceIdentifier');

        // both proto and static
        var allMethodNames = allClasses
            .collect(function(klass) { return klass.localFunctionNames().concat(Functions.own(klass)) })
            .flatten()

        var functionAndObjectNames = namespaces
            .collect(function(ns) {
                var propNames = [];
                for (var name in ns) {
                    var value = ns[name];
                    if (!value || lively.Class.isClass(value) || value.namespaceIdentifier) continue;
                    propNames.push(name)
                }
                return propNames })
            .flatten();

        var symbolList = allClassNames.concat(namespaceNames).concat(allMethodNames).concat(functionAndObjectNames);

        return symbolList;
    }

});

Object.extend(lively.ide, {
    sourceDB: function() {
        return this.startSourceControl();
    },

    debugFileParsingEnabled: function() {
        return this._debugFileParsingEnabled;
    },

    enableDebugFileParsing: function(bool) {
        return this._debugFileParsingEnabled = bool;
    },

    startSourceControl: function() {
        // creates or fetches
        return lively.ide.SourceControl = lively.ide.SourceControl || new AnotherSourceDatabase();
    }
});

lively.Module.addMethods(
"source database", {
    getSource: function() {
        if (this.isAnonymous()) return '';
        var fn = this.relativePath();
        var wrapper = lively.ide.sourceDB().addModule(fn);
        return wrapper.getSource();
        lively.ide.getSource();
    }
});

}) // end of module
