Object.extend(lively, {

    lookup: function(spec, context, createMissing) {
        function createNamespaceObject(spec, context) {
            spec = spec.valueOf();
            if (typeof spec !== 'string') throw new TypeError();
            var topParts = spec.split(/[\[\]]/);
            var parts = topParts[0].split('.');
            for (var i = 0, len = parts.length; i < len; i++) {
                spec = parts[i];
                if (!context[spec]) {
                    if (!createMissing) return null;
                    if (!lively.Class.isValidIdentifier(spec))
                        throw new Error('"' + spec + '" is not a valid name for a module.');
                    context[spec] =  new lively.Module(context, spec);
                }
                context = context[spec];
            }
            for(i = 1; i < topParts.length; i = i + 2) {
                spec = JSON.parse(topParts[i]);
                if (!context)
                    return null;
                context = context[spec];
                parts = topParts[i + 1].split('.');
                for (var j = 1, len = parts.length; j < len; j++) {
                    spec = parts[j];
					if (!context)
						return null;
                    context = context[spec];
                }
            }
            return context;
        }
        context = context || Global;
        if(spec.indexOf('.') == -1)
			if (!context[spec]) {
				if (!createMissing) return null;
			} else return context[spec];
        var codeDB;
        if (spec[0] == '$') {
            codeDB = spec.substring(1, spec.indexOf('.'));
            spec = spec.substring(spec.indexOf('.') + 1);
        }
        var ret = createNamespaceObject(spec, context);
        if (codeDB) { ret.fromDB = codeDB; }
        return ret;
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
            // support modulenames as array and parameterlist
            var args = Array.from(arguments),
                module = args.shift(),
                preReqModuleNames = Object.isArray(args[0]) ? args[0] : args,
                requiredModules = [];
            for (var i = 0; i < preReqModuleNames.length; i++) {
                var name = LivelyMigrationSupport.fixModuleName(preReqModuleNames[i]),
                    reqModule = createNamespaceModule(name);
                module.addRequiredModule(reqModule);
                requiredModules.push(reqModule);
            }

            function requiresLib(libSpec) {
                if (libSpec) module.addRequiredLib(libSpec);
                return toRunOrRequiresLibObj;
            }

            function moduleExecute(code) {
                var debugCode = code;
                 // pass in own module name for nested requirements
                code = code.curry(module);
                 // run code with namespace modules as additional parameters
                function codeWrapper() {
                    try {
                        module.activate();
                        code.apply(this, requiredModules);
                        module._isLoaded = true;
                    } catch(e) {
                        module.logError(e, debugCode);
                    } finally {
                        module.deactivate();
                    }
                }
                module.addOnloadCallback(codeWrapper, 0/*add as first callback*/);
                // wasDefined: module body and module requirements encountered but
                // body not necessarily executed or requirements loaded
                module.wasDefined = true;
                module.load();
            }

            var toRunOrRequiresLibObj = {
                toRun: moduleExecute,
                requiresLib: requiresLib
            };

            return toRunOrRequiresLibObj;
        };

        var module = createNamespaceModule(moduleName);
        module.requires = basicRequire.curry(module);
        return module;
    },

    require: function require(/*requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
        var getUniqueName = function() { return 'anonymous_module_' + require.counter },
            args = Array.from(arguments);
        require.counter !== undefined ? require.counter++ : require.counter = 0;
        var m = module(getUniqueName()).beAnonymous();
        if (lively.Config.showModuleDefStack)
            try { throw new Error() } catch(e) { m.defStack = e.stack }
        return m.requires(Object.isArray(args[0]) ? args[0] : args);
    }
});

Object.extend(Global, {
    module: lively.module,
    require: lively.require
});

Object.subclass('lively.Module',
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
        var result = Object.values(this).select(function(ea) {
            return condition.call(this, ea) }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns[selector](true)) });
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
                    && Object.isFunction(ea)
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
        if (this.pendingRequirements && !this.pendingRequirements.include(requiredModule)) {
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
            return m.privateRequirements && m.privateRequirements.include(this);
        }, this);
    }
},
'load callbacks', {
    addOnloadCallback: function(cb, idx) {
        if (!this.callbacks) this.callbacks = [];
        if (Object.isNumber(idx)) this.callbacks.splice(idx,0,cb);
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
        if (this.uri().include('anonymous')) return true;
        return JSLoader.scriptInDOM(this.uri());
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
            throw new Error('Wrong module: ' + this.namespaceIdentifier
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
        if (optCode) msg += ("code:\n" + optCode).truncate(1000);
        if (world && world.logError) {
            world.logError(e);
        } else {
            console.error(msg);
        }
        dbgOn(true);
    }
});

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
                    return sortedModules.include(requirement) })
            })
            sortedModules = sortedModules.concat(canBeLoaded);
            modules = modules.withoutAll(canBeLoaded);
        }
        if (modules.length > 0) {
            throw new Error('Cannot find dependencies for all modules!');
        }

        return sortedModules;
    },

    bootstrapModules: function() {
        // return a string to include in bootstrap.js
        var moduleFiles = this.topologicalSortLoadedModules()
            .collect(function(ea) { return new URL(ea.uri()).relativePathFrom(URL.codeBase) })
            // omit modules outside of core
            .reject(function(path) { return path.startsWith('..') });
        return LivelyLoader.bootstrapFiles.concat(moduleFiles);
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

(function createLivelyNamespace(Global) {
    Object.extend(Global, {namespaceIdentifier: 'Global'});
    // let Global act like a namespace itself
    Object.extend(Global, Global.lively.Module.prototype);
    Global.isLoaded = Functions.True;
    // make "lively" a proper lively.Module
    var helper = Global.lively,
        lively = new Global.lively.Module(Global, 'lively');
    // FIXME this is just a hack to get properties of a potentially
    // predefined "lively" object over to the namespace lively object
    // namespaces should deal with this in general
    for (var name in helper) {
        lively[name] = helper[name];
    }
    Global.lively = lively;
})(Global);

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
    if (Config.changesetsExperiment
     && Global.localStorage
     && localStorage.getItem("LivelyChangesets:" + location.pathname)) {
            require('lively.ChangeSets').toRun(function() {
                ChangeSet.loadAndcheckVsSystem(); })
    }
    lively.Module.checkModuleLoadStates();
}).delay((Global.location && location.hostname === "localhost") ? 3 : 14);
