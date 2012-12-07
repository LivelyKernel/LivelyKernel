lively.module = function module(moduleName) {

    moduleName = LivelyMigrationSupport.fixModuleName(moduleName);

    function namespace(spec, context) {
        function createNamespaceObject(spec, context) {
            context = context || Global;
            spec = spec.valueOf();
            if (typeof spec === 'string') {
                (function() {
                    var parts = spec.split('.');
                    for (var i = 0, len = parts.length; i < len; i++) {
                        spec = parts[i];
                        if (!Class.isValidIdentifier(spec)) {
                            throw new Error('"' + spec + '" is not a valid name for a module.');
                        }
                        context[spec] = context[spec] || new lively.Module(context, spec);
                        context = context[spec];
                    }
                })();
                return context;
            } else {
                throw new TypeError();
            }
        }
        var codeDB;
        if (spec[0] == '$') {
            codeDB = spec.substring(1, spec.indexOf('.'));
            spec = spec.substring(spec.indexOf('.') + 1);
        }
        var ret = createNamespaceObject(spec, context);
        if (codeDB) { ret.fromDB = codeDB; }
        return ret;
    }

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
        return namespace(isNamespaceAwareModule(moduleName) ?
                         moduleName : convertUrlToNSIdentifier(moduleName));
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

        return {
            toRun: function(code) {
                var debugCode = code;
                 // pass in own module name for nested requirements
                code = code.curry(module);
                 // run code with namespace modules as additional parameters
                var codeWrapper = function() {
                    try {
                        module.activate();
                        code.apply(this, requiredModules);
                        module._isLoaded = true;
                    } catch(e) {
                        module.logError(module + '>>basicRequire: ' + e, debugCode);
                    } finally {
                        module.deactivate();
                    }
                }
                module.addOnloadCallback(codeWrapper);
                module.load();
            }
        };
    };

    var module = createNamespaceModule(moduleName);
    module.wasDefined = true;
    module.requires = basicRequire.curry(module);
    return module;
};

lively.require = function require(/*requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
    var getUniqueName = function() { return 'anonymous_module_' + require.counter },
        args = $A(arguments);
    require.counter !== undefined ? require.counter++ : require.counter = 0;
    var m = module(getUniqueName()).beAnonymous();
    if (lively.Config.showModuleDefStack)
        try { throw new Error() } catch(e) { m.defStack = e.stack }
    return m.requires(Object.isArray(args[0]) ? args[0] : args);
};


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
            recursive);
    },

    classes: function(recursive) {
        var normalClasses = this.gather(
            'classes',
            function(ea) { return ea && ea !== this.constructor && Class.isClass(ea) },
            recursive);
        return this === Global ?
            [Array, Number, String, Function].concat(normalClasses) : normalClasses;
    },

    functions: function(recursive) {
        return this.gather(
            'functions',
            function(ea) {
                return ea
                    && !Class.isClass(ea)
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
            throw dbgOn(new Error('unknown namespaceIdentifier'));
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
                throw dbgOn(new Error('unknown namespaceIdentifier'));
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
            else throw dbgOn(new Error('unknown namespaceIdentifier'));
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
        return this.pendingRequirements && this.pendingRequirements.length > 0;
    },

    loadRequirementsFirst: function() {
        this.pendingRequirements && this.pendingRequirements.invoke('load');
    },

    wasRequiredBy: function() {
        return Global.subNamespaces(true).select(function(m) {
            return m.privateRequirements && m.privateRequirements.include(this);
        }, this);
    }
},
'load callbacks', {
    addOnloadCallback: function(cb) {
        if (!this.callbacks) this.callbacks = [];
        this.callbacks.push(cb);
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

    isAnonymous: function() {
        return this._isAnonymous;
    }

},
'testing', {
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
        if (loadSync) {
            var prevWasSync = this.constructor.loadSync;
            this.constructor.loadSync = true;
        }
        if (this.isLoaded()) {
            this.runOnloadCallbacks();
            return;
        }
        if (this.isLoading() && this.wasDefined && !this.hasPendingRequirements()) {
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
        if (this.isLoading()) {
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
        var ownerNamespace = Class.namespaceFor(this.namespaceIdentifier),
            ownName = Class.unqualifiedNameFor(this.namespaceIdentifier);
        JSLoader.removeAllScriptsThatLinkTo(this.uri());
        delete ownerNamespace[ownName];
    },
    removeScriptNode: function() {
        var node = document.getElementById(this.uri());
        if (node) node.parentNode.removeChild(node);
    }
},
'debugging', {
    toString: function() { return 'module(' + this.namespaceIdentifier + ')' },
    inspect: function() { return this.toString() + ' defined at ' + this.defStack; },
    logError: function(e, optCode) {
        var list = this.traceDependendModules(),
            msg = 'Error while loading ' + this.moduleName + ': ' + e
                + '\ndependencies: ' + Strings.printNested(list),
            world = Global.lively && lively.morphic
                 && lively.morphic.World && lively.morphic.World.current();
        if (e.stack) msg = msg + e.stack;
        if (optCode) msg += "code:\n" + optCode;
        if (world.logError) world.logError(e);
        else console.error(msg);
        dbgOn(true);
    }
});

Object.extend(lively.Module, {

    namespaceStack: [Global],

    current: function() { return this.namespaceStack.last() },

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
        var modules = Global.subNamespaces(true)
                      .reject(function(ea) { return ea.isAnonymous(); })
                      .select(function(ea) {
                          return ea.isLoaded() && new WebResource(ea.uri()).exists() });

        // topological sort modules according to their requirements
        var sortedModules = [], i = 0;
        while (i < 1000 && modules.length > 0) {
            i++;
            var canBeLoaded = modules.select(function(module) {
                if (!module.privateRequirements) return true;
                return lively.module.privateRequirements.all(function(requirement) {
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
    findAllInThenDo: function(url, callback) {
        var dir = new URL(url).getDirectory();
        if (url.isLeaf()) {
            throw new Error(url + ' is not a directory!');
        }
        var webR = dir.asWebResource();
        lively.bindings.connect(webR, 'subDocuments', {onLoad: function(files) {
            var moduleNames = files.invoke('getURL') .invoke('asModuleName'),
                modules = moduleNames.collect(function(name) { return lively.module(name); })
            callback(modules);
        }}, 'onLoad');
        webR.getSubElements();
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
                ea.pendingRequirements = [];
                ea.load();
                lively.Module.checkModuleLoadStates.delay(6);
            }
	    });
        console.log('Module load check done. ' + modules.length + ' modules loaded.');
    }
});

(function createLivelyNamespace(Global) {
    // let Glabal act like a namespace itself
    Object.extend(Global, Global.lively.Module.prototype);
    Object.extend(Global, {
        namespaceIdentifier: 'Global',
        isLoaded: Functions.True
    });
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
    lively.lang.let = function(/** **/) {
        // lively.lang.let(y, function(x) { body }) is equivalent to { let y = x; body; }
        return arguments[arguments.length - 1].apply(this, arguments);
    }
})(lively);

(function testModuleLoad() {
    lively.Module.checkModuleLoadStates();
}).delay(10);