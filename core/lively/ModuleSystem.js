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
            context = context[key] || (createMissing && (context[key] = new lively.Module(context, key)));
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
        module.requires = basicRequire.curry(module);
        return module;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function isNamespaceAwareModule(moduleName) {
            return moduleName && !moduleName.endsWith('.js');
        }

        function convertUrlToNSIdentifier(url) {
            // foo/bar/baz.js -> foo.bar.baz
            var result = url;
            result = result.replace(/\//g, '.');
            // get rid of '.js'
            if (result.endsWith('.js')) result = result.substring(0, result.lastIndexOf('.'));
            return result;
        }

        function createNamespaceModule(moduleName) {
            return lively.lookup(
                isNamespaceAwareModule(moduleName) ? moduleName : convertUrlToNSIdentifier(moduleName),
                Global,true);
        }

        function basicRequire(/*module, requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
            // support module names as array and parameterlist

            var args = Array.from(arguments),
                thisModule = args.shift(),
                preReqModuleNames = Object.isArray(args[0]) ? args[0] : args,
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
                code = code.curry(thisModule);
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
            args = Array.from(arguments);
        lively.require.counter !== undefined ? lively.require.counter++ : lively.require.counter = 0;
        var m = lively.module(getUniqueName()).beAnonymous();
        if (lively.Config.showModuleDefStack)
            try { throw new Error() } catch(e) { m.defStack = e.stack }
        return m.requires(Object.isArray(args[0]) ? args[0] : args);
    }

});

var Module = Object.subclass('lively.Module',
'properties', {
    isLivelyModule: true
},
'initializing', {
    initialize: function(context, nsName) {
        this.namespaceIdentifier = context.namespaceIdentifier + '.' + nsName;
        this.createTime = new Date();
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
        return this.gather(
            'subNamespaces',
            function(ea) { return (ea instanceof lively.Module || ea === Global) && ea !== this },
            recursive).uniq();
    },

    classes: function(recursive) {
        var normalClasses = this.gather(
            'classes',
            function(ea) { return ea && ea !== this.constructor && lively.Class.isClass(ea) },
            recursive).uniq();
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
        if (identifier.startsWith(globalIdStart)) {
            identifier = identifier.substring(globalIdStart.length);
        }
        return identifier;
    },

    findUri: function(optFileType) {
        var fileType = optFileType || 'js',
            fileExtension = '.' + fileType,
            namespacePrefix;
        if (this.namespaceIdentifier.startsWith('Global.')) {
            namespacePrefix = 'Global.';
        } else {
            throw dbgOn(new Error('unknown namespaceIdentifier "' + this.namespaceIdentifier + '"'));
        }
        var relativePath = this.namespaceIdentifier
                           .substr(namespacePrefix.length)
                           .replace(/\./g, '/');
        if (!relativePath.match(/\.js$/)) {
            relativePath += fileExtension;
        }
        var uri = '';
        lively.Config.modulePaths.forEach(function(ea) {
            if (relativePath.substring(0, ea.length) == ea) {
                uri = lively.Config.rootPath + relativePath;
            }
        });
        if (uri == '') {
            uri = lively.Config.codeBase + relativePath;
        }
        return uri;
    },

    uri: function(optType) { // FIXME cleanup necessary
        if (this.__cachedUri && !optType) { return this.__cachedUri; }
        if (this.fromDB) {
            var id = this.namespaceIdentifier, // something like lively.Core
                namespacePrefix;
            if (id.startsWith('Global.')) {
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
            if (id.startsWith('Global.')) namespacePrefix = 'Global.';
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

    lastPart: function() {
        return this.name().match(/[^.]+$/)[0];
    }

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
        var deps = this.dependendModules.uniq();
        this.dependendModules = [];
        deps.forEach(function(ea) { ea.removeRequiredModule(this) }, this);
    },

    traceDependendModules: function(visited) {
        visited = visited || [];
        var deps =  this.debugDependendModules || [];
        deps = deps.withoutAll(visited);
        visited.push(this);
        return [this.namespaceIdentifier, deps.collect(function(ea) {
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
        }.bind(this), 50);
    },

    removeRequiredModule: function(requiredModule) {
        if (this.pendingRequirements && this.pendingRequirements.indexOf(requiredModule) === -1) {
            throw dbgOn(new Error('requiredModule not there'));
        }
        this.pendingRequirements = this.pendingRequirements.without(requiredModule);
        if (!this.hasPendingRequirements()) { this.load(); }
    },

    pendingRequirementNames: function() {
        if (!this.pendingRequirements) return [];
        return this.pendingRequirements.collect(function(ea) { return ea.uri() });
    },

    hasPendingRequirements: function() {
        if (this.pendingRequirements && this.pendingRequirements.length > 0) return true;
        if (this.requiredLibs && this.requiredLibs.any(function(libSpec) { return !libSpec.loadTest(); })) return true;
        return false;
    },

    loadRequirementsFirst: function() {
        this.pendingRequirements && this.pendingRequirements.invoke('load');
        this.requiredLibs && this.requiredLibs.invoke('load');
    },

    wasRequiredBy: function() {
        return Global.subNamespaces(true).select(function(m) {
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

    isLoaded: function() {
        return this._isLoaded;
    },

    isLoading: function() {
        if (this.isLoaded()) return false;
        if (this.uri().match(/anonymous/)) return true;
        return JSLoader.isLoading(this.uri());
    },

    isAnonymous: function() {
        return this._isAnonymous;
    }

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
            console.log(this.uri() + ' loaded in ' + time + ' ms');
            this.informDependendModules();
            return;
        }
        if (this.isLoading() || this.wasDefined) {
            this.loadRequirementsFirst();
            return;
        }
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
    }
},
'removing', {
    remove: function() {
        var ownerNamespace = lively.Class.namespaceFor(this.namespaceIdentifier),
            ownName = lively.Class.unqualifiedNameFor(this.namespaceIdentifier);
        JSLoader.removeAllScriptsThatLinkTo(this.uri());
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
        var list = this.traceDependendModules(),
            msg = 'Error while loading ' + (this.moduleName || this) + ': ' + e
                + '\ndependencies: ' + Strings.printNested(list),
            world = Global.lively && lively.morphic
                 && lively.morphic.World && lively.morphic.World.current();
        if (e.stack) msg += e.stack;
        if (false && optCode) msg += ("code:\n" + optCode).truncate(1000);
        if (world && world.logError) world.logError(e);
        else console.error(msg);
        dbgOn(true);
    }
});

(function createLivelyNamespace(Global) {
    // let Global act like a namespace itself
    Object.extend(Global, {namespaceIdentifier: 'Global'});
    Object.extend(Global, Module.prototype);
    Global.isLoaded = Functions.True;

    // make "lively" a proper lively.Module and get the properties of a
    // potentially predefined "lively" object over to the namespace lively object
    var helper = Global.lively,
        lively = new Module(Global, 'lively');
    for (var name in helper) lively[name] = helper[name];
    lively.Module = Module;
    Global.module = lively.module;
    Global.require = lively.require;
    Global.lively = lively;
})(Global);

Object.extend(lively.Module, {

    namespaceStack: [Global],

    current: function() { return this.namespaceStack.last() },
    getLoadedModules: function() {
        return Global.subNamespaces(true)
			.reject(function(ea) { return ea.isAnonymous(); })
			.select(function(ea) {
				return ea.isLoaded() && new WebResource(ea.uri()).exists(); });
    },

    topologicalSortLoadedModules: function() {
        if (lively.Config.standAlone) {
            var scripIds = [];
            $('body script').each(function() { scripIds.push($(this).attr('id')); });
            return scripIds.collect(function(id) {
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
            var canBeLoaded = modules.select(function(module) {
                if (!module.privateRequirements) return true;
                return module.privateRequirements.all(function(requirement) {
                    return sortedModules.indexOf(requirement) > -1 }); });
            var modulesAndLibs = canBeLoaded.reduce(function(modulesAndLibs, module) {
                if (module.requiredLibs)
                    modulesAndLibs.pushAll(module.requiredLibs.map(function(libSpec) {
                        return libSpec.url || libSpec.urls || []; }).flatten());
                modulesAndLibs.push(module);
                return modulesAndLibs; }, []);
            sortedModules = sortedModules.concat(modulesAndLibs);
            modules = modules.withoutAll(canBeLoaded);
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
                if (ea.startsWith('lively/')) {
                    uris.push("core/" + ea);
                } else if (ea.startsWith(baseURL.toString())) {
                    uris.push(new URL(ea).relativePathFrom(baseURL));
                } else { uris.push(ea); }
                return uris;
            }
            var path = new URL(ea.uri()).relativePathFrom(baseURL);
            // omit modules outside of core
            if (!path.startsWith('..')) uris.push(path);
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
            callback(files.invoke('getURL').reject(function(url) {
                return url.filename().startsWith('.'); }));
        }}, 'onLoad');
        webR.getSubElements();
    },

    findAllInThenDo: function(url, callback, beSync) {
        this.withURLsInDo(url, function(urls) {
            callback(urls.invoke('asModuleName').map(lively.module));
        }, beSync);
    },

    checkModuleLoadStates: function() {
        var modules = Global.subNamespaces(true).select(function(ea) { return ea.wasDefined });
        modules
        .select(function(ea) { return ea.hasPendingRequirements() })
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
    lively.assert = Global.assert;
})(Global, lively);

(function setupLivelyLang(lively) {
    lively.lang = new lively.Module(lively, 'lang');
    lively.lang.Execution = {
        showStack: Functions.Null,
        resetDebuggingStack: Functions.Null,
        installStackTracers: Functions.Null
    };
})(lively);

(function testModuleLoad() {
    // note that with slow network connections it is possible that the module load
    // test will fail although the modules will load eventually
    lively.Module.checkModuleLoadStates();
}).delay(10);
