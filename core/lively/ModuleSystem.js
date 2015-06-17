Object.extend(lively, {

    parsePath: function(string) {
        // STRING -> [STRING]
        // ex: 'foo["bar"].x[0] -> ['foo', 'bar', x, '0']'
        // optimized version of https://gist.github.com/rksm/9774371
        var parts = [], index = 0, term = '.';
        while (true) {
            if (string.length === 0) break;
            if (string[index] === '\\') { index += 2; continue; }
            if (index >= string.length) { if (string.length > 0) parts.push(string); break; }
            var newTerm, skip = 0;
            if (string.slice(index, index+term.length) === term) newTerm = '.';
            else if (string[index] === '[') {
                if (string[index+1] === '\'') { newTerm = '\']'; skip = 1; }
                else if (string[index+1] === '"') { newTerm = '"]'; skip = 1; }
                else { newTerm = ']'; skip = 0; }
            }
            if (!newTerm) { index++; continue; }
            if (index > 0) parts.push(string.slice(0, index));
            string = string.slice(index + term.length + skip);
            index = 0;
            term = newTerm;
            newTerm = null;
        }
        return parts;
    },

    lookup: function(string, context, createMissing) {
        // Takes a string an tries to interpret as it a path into a JS object
        // Example: lively.lookup('foo.bar', {foo: {bar: 3}}) returns 3
        context = context || Global;
        for (var i = 0, keys = lively.parsePath(string), len = keys.length; i < len; i++) {
            if (!context) return null;
            var key = keys[i];
            if (!context[key] && createMissing) {
              context[key] = new lively.Module(context, key);
            }
            context = context[key];
        }
        return context;
    },

    assignObjectToPath: function(obj, path, context) {
        var sepIdx = path.lastIndexOf('.'),
            contextPath = path.substring(0, sepIdx),
            nameInContext = path.substring(sepIdx + 1);
        context = contextPath === '' ?
            (context || Global) :
            lively.lookup(contextPath, context, true);
        return context[nameInContext] = obj;
    },

    module: function module(moduleName) {
        moduleName = LivelyMigrationSupport.fixModuleName(moduleName);
        var module = createNamespaceModule(moduleName);
        module.requires = lively.lang.fun.curry(basicRequire, module);
        return module;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function isNamespaceAwareModule(moduleName) {
            return moduleName && !lively.lang.string.endsWith(moduleName, '.js');
        }

        function convertUrlToNSIdentifier(url) {
            // foo/bar/baz.js -> foo.bar.baz
            var result = url;
            // get rid of '.js'
            if (lively.lang.string.endsWith(result,'.js')) result = result.slice(0, result.lastIndexOf('.'));
            result = result.replace(/\./g, '\\.').replace(/([^\\])\//g, '$1.');
            return result;
        }

        function createNamespaceModule(moduleName) {
            return lively.lookup(
                isNamespaceAwareModule(moduleName) ?
                    moduleName :
                    convertUrlToNSIdentifier(moduleName),
                Global, true);
        }

        function basicRequire(/*module, requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
            // support module names as array and parameterlist

            var args = lively.lang.arr.from(arguments),
                thisModule = args.shift(),
                preReqModuleNames = lively.lang.arr.isArray(args[0]) ? args[0] : args,
                requiredModules = [];

            preReqModuleNames
                .map(LivelyMigrationSupport.fixModuleName)
                .map(createNamespaceModule)
                .forEach(function(reqModule) {
                    thisModule.addRequiredModule(reqModule);
                    requiredModules.push(reqModule);
                });

            function requiresLib(libSpec) {
                if (libSpec) thisModule.addRequiredLib(libSpec);
                return toRunOrRequiresLibObj;
            }

            function moduleExecute(code) {
                var debugCode = code;
                 // pass in own module name for nested requirements
                code = lively.lang.fun.curry(code, thisModule);
                 // run code with namespace modules as additional parameters
                function codeWrapper() {
                    try {
                        thisModule.activate();
                        code.apply(this, requiredModules);
                        thisModule._isLoaded = true;
                    } catch(e) {
                        thisModule.logError(e, debugCode);
                    } finally {
                        thisModule.deactivate();
                    }
                }
                thisModule.addOnloadCallback(codeWrapper, 0/*add as first callback*/);
                // wasDefined: module body and module requirements encountered but
                // body not necessarily executed or requirements loaded
                thisModule.wasDefined = true;
                thisModule.load();
            }

            var toRunOrRequiresLibObj = {
                toRun: moduleExecute,
                requiresLib: requiresLib
            };

            return toRunOrRequiresLibObj;
        };

    },

    require: function require(/*requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
        var getUniqueName = function() { return 'anonymous_module_' + lively.require.counter },
            args = lively.lang.arr.from(arguments);
        lively.require.counter !== undefined ? lively.require.counter++ : lively.require.counter = 0;
        var m = lively.module(getUniqueName()).beAnonymous();
        if (lively.Config.showModuleDefStack) m.defStack = new Error().stack;
        return m.requires(lively.lang.arr.isArray(args[0]) ? args[0] : args);
    }

});

var Module = Object.subclass('lively.Module',
'properties', {
    isLivelyModule: true,
    networkTimeout: 60*1000,
},
'initializing', {
    initialize: function(context, nsName) {
        this.namespaceIdentifier = context.namespaceIdentifier + '.' + nsName;
        this.createTime = new Date();
        this.errors = [];
        this.loadAttempts = 0;
    },
    beAnonymous: function() {
        this._isAnonymous = true;
        this.sourceModuleName = lively.Module.current().namespaceIdentifier;
        return this;
    }
},
'accessing nested objects', {
    gather: function(selector, condition, recursive) {
        var result = [];
        for (var key in this)
            if (condition.call(this, this[key]))
                result.push(this[key]);
        if (!recursive) return result;
        return this.subNamespaces().reduce(function(result, ns) {
            return result.concat(ns[selector](true)) }, result);
    },

    subNamespaces: function(recursive) {
        return lively.lang.arr.uniq(this.gather(
            'subNamespaces',
            function(ea) { return (ea instanceof lively.Module || ea === Global) && ea !== this },
            recursive));
    },

    classes: function(recursive) {
        var normalClasses = lively.lang.arr.uniq(this.gather(
            'classes',
            function(ea) { return ea && ea !== this.constructor && lively.Class.isClass(ea) },
            recursive));
        if(this === lively.morphic && recursive && lively.morphic.CSS && lively.morphic.CSS.Fill)
            normalClasses.push(lively.morphic.CSS.Fill);
        return this === Global ?
            [Array, Boolean, Date, RegExp, Number, String, Function].concat(normalClasses) : normalClasses;
    },

    functions: function(recursive) {
        return this.gather(
            'functions',
            function(ea) {
                return ea
                    && !lively.Class.isClass(ea)
                    && typeof ea === 'function'
                    && !ea.declaredClass
                    && this.requires !== ea
                    && ea.getOriginal() === ea; },
            recursive);
    }
},
'accessing', { // module specific, should be a subclass?

    name: function() {
        var identifier = this.namespaceIdentifier, globalIdStart = 'Global.';
        if (lively.lang.string.startsWith(identifier, globalIdStart)) {
            identifier = identifier.substring(globalIdStart.length);
        }
        return identifier;
    },

    findUri: function(optFileType) {
        var fileType = optFileType || 'js',
            fileExtension = '.' + fileType,
            namespacePrefix = lively.lang.string.startsWith(this.namespaceIdentifier, 'Global.') ? 'Global.' : '',
            relativePath = this.namespaceIdentifier
                .substr(namespacePrefix.length)
                .replace(/([^\\])\./g, '$1/')
                .replace(/\\\./g, '.');

        if (!relativePath.match(/\.js$/)) relativePath += fileExtension;

        // FIXME modulePaths are super magic special directories in URL.root.
        // Instead of mapping the module to URL.codeBase, modules belonging to
        // these special directories are mapped to URL.root. FIXME! remove this
        // special core/ handling!!!
        var firstPartOfFilename = relativePath.split("/")[0],
            isSpecialModule = lively.lang.arr.include(lively.Config.modulePaths, firstPartOfFilename),
            uri = (isSpecialModule ? lively.Config.rootPath : lively.Config.codeBase) + relativePath;

        return uri;
    },

    uri: function(optType) { // FIXME cleanup necessary
        if (this.__cachedUri && !optType) { return this.__cachedUri; }
        if (this.fromDB) {
            var id = this.namespaceIdentifier, // something like lively.Core
                namespacePrefix;
            if (lively.lang.string.startsWith(id, 'Global.')) {
                namespacePrefix = 'Global.';
                id = id.substring(7);
            } else {
                throw dbgOn(new Error('unknown namespaceIdentifier "' + id + '"'));
            }
            // FIXME: extract to lively.Config.codeBaseDB
            var url = lively.Config.couchDBURL
                + '/' + this.fromDB
                + '/_design/raw_data/_list/javascript/for-module?module='
                + id;
            this.__cachedUri = url;
            return url;
        }
        var id = this.namespaceIdentifier, // something like lively.Core
            namespacePrefix, url;
        if (!this.isAnonymous()) {
            url = this.findUri(optType);
        } else {
            if (lively.lang.string.startsWith(id, 'Global.')) namespacePrefix = 'Global.';
            else throw dbgOn(new Error('unknown namespaceIdentifier "' + id + '"'));
            url = lively.Config.codeBase
                + this.namespaceIdentifier.substr(namespacePrefix.length).replace(/\./g, '/');
        }
        this.__cachedUri = url;
        return url;
    },
    relativePath: function(optType) {
        return new URL(this.uri(optType)).relativePathFrom(URL.codeBase);
    },

    lastPart: function() { return this.name().match(/[^.]+$/)[0]; },

    getErrors: function() { return this.errors; }

},
'module dependencies', {
    addDependendModule: function(depModule) {
        if (!this.dependendModules) this.dependendModules = [];
        this.dependendModules.push(depModule);

        // keep a copy of the dependencies for debugging
        if (!this.debugDependendModules) this.debugDependendModules = [];
        this.debugDependendModules.push(depModule);
    },

    informDependendModules: function() {
        if (!this.dependendModules) return;
        var deps = lively.lang.arr.uniq(this.dependendModules);
        this.dependendModules = [];
        deps.forEach(function(ea) { ea.removeRequiredModule(this) }, this);
    },

    traceDependendModules: function(visited) {
        visited = visited || [];
        var deps =  this.debugDependendModules || [];
        deps = lively.lang.arr.withoutAll(deps, visited);
        visited.push(this);
        return [this.namespaceIdentifier, deps.map(function(ea) {
            return ea.traceDependendModules(visited);
        })]
    },

    addRequiredModule: function(requiredModule) {
        // privateRequirements is just for keeping track later on
        if (!this.privateRequirements) this.privateRequirements = [];
        this.privateRequirements.push(requiredModule);

        if (requiredModule.isLoaded()) return;
        if (!this.pendingRequirements) this.pendingRequirements = [];
        this.pendingRequirements.push(requiredModule);
        requiredModule.addDependendModule(this);
    },

    addRequiredLib: function(libSpec) {
        // libSpec should match {url: [URL|STRING], loadTest: FUNCTION}
        // loadTest is a function that might be called multiple times
        // to determine the load status if the lib. If it returns ar truthy
        // value it means the lib is loaded
        if (typeof libSpec.loadTest !== 'function') {
            throw new Error('libSpec.loadTest is not a function!');
        }
        if (!this.requiredLibs) this.requiredLibs = [];
        if (!libSpec.load) {
            var mod = this;
            libSpec.load = function() {
                if (this.loadTest()) { mod.load(); return; }// already loaded
                var url = this.url || this.uri;
                url && JSLoader.loadJs(String(url), null, !!this.sync);
                if (!this.sync) mod.initLibLoadTester();
                else if (!mod.hasPendingRequirements()) mod.load();
            }
        }
        this.requiredLibs.push(libSpec);
    },

    initLibLoadTester: function() {
        if (this.loadTestPolling) return;
        this.loadTestPolling = Global.setInterval(function() {
            if (this.hasPendingRequirements()) return;
            Global.clearInterval(this.loadTestPolling);
            this.load();
        }.bind(this), 20);
    },

    removeRequiredModule: function(requiredModule) {
        if (this.pendingRequirements && this.pendingRequirements.indexOf(requiredModule) === -1) {
            throw dbgOn(new Error('requiredModule not there'));
        }
        this.pendingRequirements = lively.lang.arr.without(this.pendingRequirements, requiredModule);
        if (!this.hasPendingRequirements()) { this.load(); }
    },

    pendingRequirementNames: function() {
        if (!this.pendingRequirements) return [];
        return this.pendingRequirements.map(function(ea) { return ea.uri() });
    },

    hasPendingRequirements: function() {
        if (this.pendingRequirements && this.pendingRequirements.length > 0) return true;
        if (this.requiredLibs && lively.lang.arr.any(this.requiredLibs, function(libSpec) { return !libSpec.loadTest(); })) return true;
        return false;
    },

    loadRequirementsFirst: function() {
        this.pendingRequirements && lively.lang.arr.invoke(this.pendingRequirements, 'load');
        this.requiredLibs && lively.lang.chain(this.requiredLibs)
                                .filter(function(libSpec) { return !libSpec.loadTest(); })
                                .invoke('load').value();
    },

    wasRequiredBy: function() {
        return Global.subNamespaces(true).filter(function(m) {
            return m.privateRequirements && m.privateRequirements.indexOf(this) > -1;
        }, this);
    }
},
'load callbacks', {
    addOnloadCallback: function(cb, idx) {
        if (!this.callbacks) this.callbacks = [];
        if (typeof idx === 'number') this.callbacks.splice(idx,0,cb);
        else this.callbacks.push(cb);
    },

    runOnloadCallbacks: function() {
        if (!this.callbacks) return;
        var cb;
        while ((cb = this.callbacks.shift())) {
            try {
                cb();
            } catch(e) {
                this.logError('runOnloadCallbacks: ' + cb.name + ': ' + e);
                throw e;
            }
        };
    },

    runWhenLoaded: function(callback) {
        // when module is already loaded just run callback
        // otherwise schedule callback to run when module is loaded
        // BUT don't trigger load (this makes it unlike requires.toRun!)
        if (this.isLoaded()) callback();
        else this.addOnloadCallback(callback);
    }
},
'testing', {
    isAnonymous: function() { return this._isAnonymous; },

    isLoaded: function() { return this._isLoaded; },

    isLoading: function() {
        if (this.isLoaded()) return false;
        if (this.uri().match(/anonymous/)) return true;
        return JSLoader.isLoading(this.uri());
    },

    isAnonymous: function() { return this._isAnonymous; },

    hasErrored: function() { return !!this.errors.length; }

},
'loading', {
    load: function(loadSync) {
        var prevWasSync = false;
        if (loadSync) {
            prevWasSync = this.constructor.loadSync;
            this.constructor.loadSync = true;
        }
        if (this.isLoaded()) {
            this.runOnloadCallbacks();
            return;
        }
        if (this.wasDefined && !this.hasPendingRequirements()) {
            this.runOnloadCallbacks();
            // time is not only the time needed for the request and code
            // evaluation but the complete time span from the creation of the
            // module (when the module is first encountered) to evaluation the
            // evaluation of its code, including load time of all requirements
            var time = this.createTime ? new Date() - this.createTime : 'na';
            if (this.hasErrored()) {
                console.warn(this.uri() + ' encountered errors while loading, took ' + time + ' ms');
            } else {
                this.informDependendModules();
                console.log(this.uri() + ' loaded in ' + time + ' ms');
            }
            return;
        }
        if (this.isLoading() || this.wasDefined) {
            if (this.loadStartTime && (Date.now() - this.loadStartTime) > this.networkTimeout) {
              this.timeoutLoad();
              return;
            }
            this.loadRequirementsFirst();
            return;
        }
        this.loadAttempts++;
        this.loadStartTime = Date.now();
        this.timeoutProcess = setTimeout(
            this.timeoutLoad.bind(this),
            this.networkTimeout);
        JSLoader.loadJs(this.uri(), null, this.constructor.loadSync);
        if (loadSync) this.constructor.loadSync = prevWasSync;
    },

    activate: function() {
        this.constructor.namespaceStack.push(this);
    },

    deactivate: function() {
        var m = this.constructor.namespaceStack.pop();
        if (m !== this) { // sanity check
            throw new Error(
                'Module>>deactivate: Wrong module: '
              + this.namespaceIdentifier
              + ' instead of expected ' + m.namespaceIdentifier);
        }
    },

    timeoutLoad: function() {
      if (this.timeoutProcess) clearTimeout(this.timeoutProcess);
      if (this.isLoaded()) return;
      if (typeof $world === "undefined") { // error loading world, abort
        var err = new Error('Could not load world dependency ' + this.namespaceIdentifier);
        Global.LivelyLoader.handleStartupError(err);
        return;
      }
      if (this.loadAttempts > 3) {
          console.warn("Tried to load %s %s times but failed. Giving up loading.",
              this.namespaceIdentifier, this.loadAttempts);
          return;
      }
      console.warn("loading module %s timed out, trying again...", this.namespaceIdentifier);
      delete this.loadStartTime;
      this.timeoutProcess = setTimeout(this.timeoutLoad.bind(this), this.networkTimeout);
      JSLoader.forget(this.uri());
      this.load();
    }
},
'removing', {

    remove: function() {
        var ownerNamespace = lively.Class.namespaceFor(this.namespaceIdentifier),
            ownName = lively.Class.unqualifiedNameFor(this.namespaceIdentifier);
        JSLoader.removeAllScriptsThatLinkTo(this.uri());
        JSLoader.loadedURLs && JSLoader.loadedURLs.remove(this.uri());
        delete ownerNamespace[ownName];
    },

    removeScriptNode: function() {
        var node = document.getElementById(this.uri());
        if (node) node.parentNode.removeChild(node);
    }

},
'debugging', {
    toString: function() { return 'lively.module("' + this.namespaceIdentifier + '")' },
    serializeExpr: function() { return this.toString(); },

    logError: function(e, optCode) {
        this.errors.push(e);
        var list = this.traceDependendModules(),
            msg = 'Error while loading ' + (this.moduleName || this) + ': ' + e
                + '\ndependencies: ' + lively.lang.string.printNested(list),
            world = Global.lively && lively.morphic
                 && lively.morphic.World && lively.morphic.World.current();
        if (e.stack) msg += e.stack;
        if (false && optCode) msg += lively.lang.string.truncate("code:\n" + optCode, 1000);
        if (world && world.logError) world.logError(e);
        else console.error(msg);
        dbgOn(true);
    }
});

(function createLivelyNamespace(Global) {
    // let Global act like a namespace itself
    var Glob = new Module(Global, 'Global');
    lively.lang.obj.extend(Global, Glob);
    Global.namespaceIdentifier = 'Global';
    Global.isLoaded = lively.lang.fun.True;

    // make "lively" a proper lively.Module and get the properties of a
    // potentially predefined "lively" object over to the namespace lively object
    var lv = new Module(Global, 'lively');
    lively.lang.obj.extend(lv, lively);
    Global.lively = lv;
    lively.Module = Module;
    delete Global.Module;

    // FIXME get rid of globals
    lively.lang.obj.extend(Global, {
        module: lively.module,
        require: lively.require,
        lively: lively
    });

    // also make lively.lang a proper namespace
    var livelyLang = lively.lang;
    lively.lang = new lively.Module(lively, 'lang');
    livelyLang.obj.extend(lively.lang, livelyLang);
    
    // FIXME!
    lively.lang.Execution = {
        showStack: lively.lang.fun.Null,
        resetDebuggingStack: lively.lang.fun.Null,
        installStackTracers: lively.lang.fun.Null
    };
})(Global);

lively.lang.obj.extend(lively.Module, {

    namespaceStack: [Global],

    current: function() { return lively.lang.arr.last(this.namespaceStack); },
    getLoadedModules: function() {
        return Global.subNamespaces(true)
			.filter(function(ea) { return !ea.isAnonymous(); })
			.filter(function(ea) {
				return ea.isLoaded() && new WebResource(ea.uri()).exists(); });
    },

    topologicalSortLoadedModules: function() {
        if (lively.Config.standAlone) {
            var scripIds = [];
            lively.$('body script').each(function() {
                scripIds.push(lively.$(this).attr('id')); });
            return scripIds.map(function(id) {
                var name = id.replace(/^..\//, '');
                return lively.module(name);
            });
        }

        // get currently loaded modules that really are js files
        var modules = this.getLoadedModules();

        // topological sort modules according to their requirements
        var sortedModules = [], i = 0;
        while (i < 1000 && modules.length > 0) {
            i++;
            var canBeLoaded = modules.filter(function(module) {
                if (!module.privateRequirements) return true;
                return module.privateRequirements.all(function(requirement) {
                    return sortedModules.indexOf(requirement) > -1 }); });
            var modulesAndLibs = canBeLoaded.reduce(function(modulesAndLibs, module) {
                if (module.requiredLibs)
                    lively.lang.arr.pushAll(modulesAndLibs,
                        lively.lang.chain(module.requiredLibs)
                            .map(function(libSpec) { return libSpec.url || libSpec.urls || []; })
                            .flatten().value());
                modulesAndLibs.push(module);
                return modulesAndLibs; }, []);
            sortedModules = sortedModules.concat(modulesAndLibs);
            modules = lively.lang.arr.withoutAll(modules, canBeLoaded);
        }
        if (modules.length > 0) {
            throw new Error('Cannot find dependencies for all modules!');
        }

        return sortedModules;
    },

    bootstrapModules: function() {
        // return a string to include in bootstrap.js
        var baseURL = URL.root;
        return LivelyLoader.libsFiles.concat(LivelyLoader.bootstrapFiles).concat(this.topologicalSortLoadedModules()).reduce(function(uris, ea) {
            if (typeof ea === 'string') {
                if (lively.lang.string.startsWith(ea, 'lively/')) {
                    uris.push("core/" + ea);
                } else if (lively.lang.string.startsWith(ea, baseURL.toString())) {
                    uris.push(new URL(ea).relativePathFrom(baseURL));
                } else { uris.push(ea); }
                return uris;
            }
            var path = new URL(ea.uri()).relativePathFrom(baseURL);
            // omit modules outside of core
            if (!lively.lang.string.startsWith(path, '..')) uris.push(path);
            return uris;
        }, []);
    },

    bootstrapModulesString: function() {
        var urls = this.bootstrapModules();
        return '[\'' + urls.join('\', \'') + '\']';
    }
});

Object.extend(lively.Module, {

    withURLsInDo: function(url, callback, beSync) {
        if (url.isLeaf()) throw new Error(url + ' is not a directory!');
        var webR = url.asWebResource();
        if (beSync) webR.beSync(); else webR.beAsync();
        lively.bindings.connect(webR, 'subDocuments', {onLoad: function(files) {
            callback(lively.lang.chain(files)
                        .invoke('getURL')
                        .filter(function(url) { return !lively.lang.string.startsWith(url.filename(), '.'); })
                        .value());
        }}, 'onLoad');
        webR.getSubElements();
    },

    findAllInThenDo: function(url, callback, beSync) {
        this.withURLsInDo(url, function(urls) {
            callback(lively.lang.chain(urls).invoke('asModuleName').map(lively.module).value());
        }, beSync);
    },

    checkModuleLoadStates: function() {
        var modules = Global.subNamespaces(true).filter(function(ea) { return ea.wasDefined });
        modules
        .filter(function(ea) { return ea.hasPendingRequirements() })
        .forEach(function(ea) {
		    var msg = Strings.format('%s has unloaded requirements: %s',
			                         ea.uri(), ea.pendingRequirementNames());
		    console.warn(msg);

            if (lively.Config.ignoreMissingModules) {
                var msg = Strings.format(
                    "Since Config.ignoreMissingModules is enabled we will try to load the module\n"
                  + "  %s\n"
                  + "although its requirements\n"
                  + "  %s\n"
                  + "are missing", ea, ea.pendingRequirementNames().join('\n  '));
                console.error(msg);
                ea.pendingRequirements = [];
                ea.load();
                lively.Module.checkModuleLoadStates.delay(6);
            }
	    });
        console.log('Module load check done. ' + modules.length + ' modules loaded.');
    }
});


(function addUsefulStuffToLivelyNS(Global, lively) {
    // hmmmm... FIXME!
    lively.assert = Global.assert;
})(Global, lively);
