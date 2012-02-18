/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// set to the context enclosing the SVG context.
// rk: replaced "this.window.top || this.window" with "this.window"
// rk: when is it necessary to use the parent context?
var Global = this.window || GLOBAL /*for Node.js*/;
function dbgOn(cond, optMessage) {
    if (optMessage) console.log(optMessage);
    if (cond) debugger; // note that rhino has issues with this keyword
    // also call as: throw dbgOn(new Error(....))
    return cond;
}

// namespace logic adapted from
// http://higher-order.blogspot.com/2008/02/designing-clientserver-web-applications.html
function assert(value, message) {
    if (value) return;
    // capture the stack
    var stack;
    try { throw new Error() } catch(e) { stack = e.stack || ''}
    alert('Assertion failed' + (message ? ': ' + message : '!') + '\n' + stack)
};
var using = (function() {

    function Util(args) {  // args is an escaping arguments array
        this.objects = Array.prototype.concat.apply([], args);
        //var ownArgs = this.objects = new Array(args.length);
        //for (var i = 0; i < args.length; i++) ownArgs[i] = args[i];
    };

    Util.prototype = {

        log: function(msg) {
            console.log(msg);
        },

        run: function(inner) {
            var args = this.objects;
            if (this.moduleName) {
                // little convenience,
                if (args.length > 0) this.log('using().module(): ignoring args ' + args);
                return module(this.moduleName).requires().toRun(inner);
            } else return inner.apply(args[0], args);
        },

        model: function(model) {
            // KP: interestingly, declaring the above as "model: function model(model)"
            // seems to bind model to to the function, not the formal parameter, at least in rhino!
            this.model = model;
            return this;
        },

        module: function(moduleName) {
            this.moduleName = moduleName;
            return this;
        },

        link: function link(literal, variableMap) {
            variableMap = variableMap || {};
            return new lively.data.Resolver().link(literal, [], undefined, variableMap, this.objects, this.model);
        },

        extend: function extend(base, extLiteral) {
            return this.link(Object.extend(Object.clone(base), extLiteral));
        },

        test: function(inner) {
            try {
                return this.run(inner);
            } catch (er) {
                alert('test failed: ' + er);
                return undefined;
            }
        }
    }

    return function using() {
        return new Util(arguments);
    }
})();


function namespace(spec, context) {
    var codeDB;
    if (spec[0] == '$') {
        codeDB = spec.substring(1, spec.indexOf('.'));
        spec = spec.substring(spec.indexOf('.') + 1);
    }
    var ret = __oldNamespace(spec, context);
    if (codeDB) {
        ret.fromDB = codeDB;
    }
    return ret;
};


function __oldNamespace(spec, context) {
    var     i,N;
    context = context || Global;
    spec = spec.valueOf();
    if (typeof spec === 'object') {
        if (typeof spec.length === 'number') {//assume an array-like object
            for (i = 0,N = spec.length; i < N; i++) {
                return namespace(spec[i], context);
            }
        } else {//spec is a specification object e.g, {com: {trifork: ['model,view']}}
            for (i in spec) if (spec.hasOwnProperty(i)) {
                context[i] = context[i] || new lively.lang.Namespace(context, i);
                    return namespace(spec[i], context[i]);//recursively descend tree
            }
        }
    } else if (typeof spec === 'string') {
        (function handleStringCase() {
            var parts;
            parts = spec.split('.');
            for (i = 0, N = parts.length; i<N; i++) {
                spec = parts[i];
                if (!Class.isValidIdentifier(spec)) {
                    throw new Error('"'+spec+'" is not a valid name for a package.');
                }
                context[spec] = context[spec] || new lively.lang.Namespace(context, spec);
                context = context[spec];
            }
        })();
        return context;
    } else {
        throw new TypeError();
    }
}


function module(moduleName) {
    moduleName = LivelyMigrationSupport.fixModuleName(moduleName);

    function isNamespaceAwareModule(moduleName) {
        return moduleName && !moduleName.endsWith('.js');
    }

    function convertUrlToNSIdentifier(url) {
        var result = url;
        result = result.replace(/\//, '.');
        // get rid of '.js'
        if (result.endsWith('.js')) result = result.substring(0, result.lastIndexOf('.'));
        return result;
    }

    function createNamespaceModule(moduleName) {
        return namespace(isNamespaceAwareModule(moduleName) ? moduleName : convertUrlToNSIdentifier(moduleName));
    }

    function basicRequire(/*module, requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
        // support modulenames as array and parameterlist
        var args = $A(arguments),
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
                code = code.curry(module); // pass in own module name for nested requirements
                var codeWrapper = function() { // run code with namespace modules as additional parameters
                    try {
                        module.activate();
                        code.apply(this, requiredModules);
                        module._isLoaded = true;
                    } catch(e) {
                        module.logError(module + '>>basicRequire: ' + e)
                    } finally {
                        module.deactivate();
                    }
                }
                module.addOnloadCallback(codeWrapper);
                module.load();
            }
        };
    };

    dbgOn(!Object.isString(moduleName));
    var module = createNamespaceModule(moduleName);
    module.wasDefined = true;
    module.requires = basicRequire.curry(module);
    return module;
};

function require(/*requiredModuleNameOrAnArray, anotherRequiredModuleName, ...*/) {
    var getUniqueName = function() { return 'anonymous_module_' + require.counter },
        args = $A(arguments);
    require.counter !== undefined ? require.counter++ : require.counter = 0;
    var m = module(getUniqueName()).beAnonymous();
    if (Config.showModuleDefStack)
        try { throw new Error() } catch(e) { m.defStack = e.stack }
    return m.requires(Object.isArray(args[0]) ? args[0] : args);
};


// ===========================================================================
// Our JS library extensions (JS 1.5, no particular browser or graphics engine)
// ===========================================================================

/**
  * LK class system.
  */

Object.extend(Function.prototype, {

    defaultCategoryName: 'default category',

    subclass: function(/*... */) {
        // Main method of the LK class system.

        // {className} is the name of the new class constructor which this method synthesizes
        // and binds to {className} in the Global namespace.
        // Remaining arguments are (inline) properties and methods to be copied into the prototype
        // of the newly created constructor.

        // modified from prototype.js

        var args = $A(arguments),
            className = args.shift(),
            targetScope = Global,
            shortName = null;

        if (className) {
            targetScope = Class.namespaceFor(className);
            shortName = Class.unqualifiedNameFor(className);
        }  else {
            shortName = "anonymous_" + (Class.anonymousCounter++);
            className = shortName;
        }

        var klass;
        if (className && targetScope[shortName] && (targetScope[shortName].superclass === this)) {
            // preserve the class to allow using the subclass construct in interactive development
            klass = targetScope[shortName];
        } else {
            klass = Class.newInitializer(shortName);
            klass.superclass = this;
            var protoclass = function() { }; // that's the constructor of the new prototype object
            protoclass.prototype = this.prototype;
            klass.prototype = new protoclass();
            klass.prototype.constructor = klass;
            klass.prototype.constructor.type = className; // KP: .name would be better but js ignores .name on anonymous functions
            klass.prototype.constructor.displayName = className; // for debugging, because name can not be assigned
            if (className) targetScope[shortName] = klass; // otherwise it's anonymous

            // remember the module that contains the class def
            if (Global.lively && lively.lang && lively.lang.Namespace)
                klass.sourceModule = lively.lang.Namespace.current();
        };

        // the remaining args should be category strings or source objects
        this.addMethods.apply(klass, args);

        if (!klass.prototype.initialize)
            klass.prototype.initialize = Functions.Empty;

        return klass;
    },

    addMethods: function(/*...*/) {
        var args = arguments,
            category = this.defaultCategoryName,
            traits = [];
        for (var i = 0; i < args.length; i++) {
            if (Object.isString(args[i])) {
                category = args[i];
            } else if (Global.RealTrait && args[i] instanceof RealTrait) {
                // FIXME Traits are optional and defined in lively.Traits
                // This should go somewhere into lively.Traits...
                // we apply traits afterwards because they can override behavior
                traits.push(args[i]);
            } else {
                this.addCategorizedMethods(category, args[i] instanceof Function ? (args[i])() : args[i]);
            }
        }
        for (var i = 0; i < traits.length; i++)
            traits[i].applyTo(this);
    },

    addCategorizedMethods: function(categoryName, source) {
        // first parameter is a category name
        // copy all the methods and properties from {source} into the
        // prototype property of the receiver, which is intended to be
        // a class constructor.     Method arguments named '$super' are treated
        // specially, see Prototype.js documentation for "Class.create()" for details.
        // derived from Class.Methods.addMethods() in prototype.js

        // prepare the categories
        if (!this.categories) this.categories = {};
        if (!this.categories[categoryName]) this.categories[categoryName] = [];
        var currentCategoryNames = this.categories[categoryName];

        if (!source)
            throw dbgOn(new Error('no source in addCategorizedMethods!'));

        var ancestor = this.superclass && this.superclass.prototype;

        var className = this.type || "Anonymous";

        for (var property in source) {

            if (property == 'constructor') continue;

            var getter = source.__lookupGetter__(property);
            if (getter) this.prototype.__defineGetter__(property, getter);
            var setter = source.__lookupSetter__(property);
            if (setter) this.prototype.__defineSetter__(property, setter);
            if (getter || setter) continue;

            currentCategoryNames.push(property);

            var value = source[property];
            // weirdly, RegExps are functions in Safari, so testing for
            // Object.isFunction on regexp field values will return true.
            // But they're not full-blown functions and don't
            // inherit argumentNames from Function.prototype

            var hasSuperCall = ancestor && Object.isFunction(value) &&
                value.argumentNames && value.argumentNames().first() == "$super";
            if (hasSuperCall) {
                // wrapped in a function to save the value of 'method' for advice
                (function() {
                    var method = value,
                        advice = (function(m) {
                          var cs = function callSuper() {
                            var method = ancestor[m];
                            if (!method) {
                                throw new Error(Strings.format('Trying to call super of' +
                                    '%s>>%s but super method non existing in %s',
                                    className, m, ancestor.constructor.type));
                            }
                            return method.apply(this, arguments);
                        };
                        cs.varMapping = {ancestor: ancestor, m: m};
                        cs.isSuperCall = true;
                        return cs;
                    })(property);

                    advice.methodName = "$super:" + (this.superclass ? this.superclass.type + ">>" : "") + property;

                    value = Object.extend(advice.wrap(method), {
                        valueOf:  function() { return method },
                        toString: function() { return method.toString() },
                        originalFunction: method,
                        methodName: advice.methodName,
                        isSuperWrapper: true
                    });
                    // for lively.Closures
                    method.varMapping = {$super: advice};
                })();
            }

            this.prototype[property] = value;

            if (property === "formals") { // rk FIXME remove this cruft
                // special property (used to be pins, but now called formals to disambiguate old and new style
                Class.addPins(this, value);
            } else if (Object.isFunction(value)) {
                // remember name for profiling in WebKit
                value.displayName = className + "$" + property;

                // remember where it was defined
                if (Global.lively && lively.lang && lively.lang.Namespace)
                    value.sourceModule = lively.lang.Namespace.current();

                for (; value; value = value.originalFunction) {
                    if (value.methodName) {
                        //console.log("class " + this.prototype.constructor.type
                        // + " borrowed " + value.qualifiedMethodName());
                    }
                    value.declaredClass = this.prototype.constructor.type;
                    value.methodName = property;
                }
            }
        } // end of for (var property in source)

        return this;
    },


    addProperties: function(spec, recordType) {
        Class.addMixin(this, recordType.prototype.create(spec).prototype);
    },

    isSubclassOf: function(aClass) {
        return this.superclasses().include(aClass);
    },

    allSubclasses: function() {
        var klass = this;
        return Global.classes(true).select(function(ea) { return ea.isSubclassOf(klass) });
    },
    withAllSubclasses: function() { return [this].concat(this.allSubclasses()) },


    directSubclasses: function() {
        var klass = this;
        return Global.classes(true).select(function(ea) { return ea.superclass === klass });
    },

    withAllSortedSubclassesDo: function(func) {
        // this method iterates func on all subclasses of klass (including klass)
        // it is ensured that the klasses are sorted by a) subclass relationship and b) name (not type!)
        // func gets as parameters: 1) the class 2) index in list 3) level of inheritance
        // compared to klass (1 for direct subclasses and so on)

        function createSortedSubclassList(klass, level) {
            var list = klass.directSubclasses()
                .sortBy(function(ea) { return ea.name.charCodeAt(0) })
                .collect(function(subclass) { return createSortedSubclassList(subclass, level + 1) })
                .flatten();
            return [{klass: klass, level: level}].concat(list)
        }

        return createSortedSubclassList(this, 0).collect(function(spec, idx) { return func(spec.klass, idx, spec.level) })
    },

    superclasses: function() {
        if (!this.superclass) return [];
        if (this.superclass === Object) return [Object];
        return this.superclass.superclasses().concat([this.superclass]);
    },

    categoryNameFor: function(propName) {
        for (var categoryName in this.categories)
            if (this.categories[categoryName].include(propName))
                return categoryName;
        return null;
    },
    remove: function() {
        var ownerNamespace = Class.namespaceFor(this.type),
            ownName = Class.unqualifiedNameFor(this.type);
        delete ownerNamespace[ownName];
    },

});

var Class = {

    anonymousCounter: 0,

    initializerTemplate: (function CLASS(){ Class.initializer.apply(this, arguments) }).toString(),

    newInitializer: function(name) {
        // this hack ensures that class instances have a name
        return eval(Class.initializerTemplate.replace(/CLASS/g, name) + ";" + name);
    },

    initializer: function initializer() {
        var firstArg = arguments[0];
        // maybe special initialization required
        if (firstArg && firstArg.isImporter) {
            this.deserialize.apply(this, arguments);
        } else if (firstArg && firstArg.isCopier) {
            this.copyFrom.apply(this, arguments);
        } else if (firstArg && firstArg.isInstanceRestorer) {
            // just do nothing
            // for WebCards and other JSON-based dersialization logic
        } else {
            // if this.initialize is undefined then prolly the constructor was called without 'new'
            this.initialize.apply(this, arguments);
        }
    },

    def: function Class$def(constr, superConstr, optProtos, optStatics) {
        // currently not used
        // Main method of the LK class system.

        // {className} is the name of the new class constructor which this method synthesizes
        // and binds to {className} in the Global namespace.
        // Remaining arguments are (inline) properties and methods to be copied into the prototype
        // of the newly created constructor.

        // modified from prototype.js

        var klass = Class.newInitializer("klass");
        klass.superclass = superConstr;

        var protoclass = function() { }; // that's the constructor of the new prototype object
        protoclass.prototype = superConstr.prototype;

        klass.prototype = new protoclass();

        // Object.extend(klass.prototype, constr.prototype);
        klass.prototype.constructor = klass;
        var className  = constr.name; // getName()
        klass.addMethods({initialize: constr});
        // KP: .name would be better but js ignores .name on anonymous functions
        klass.type = className;


        if (optProtos) klass.addMethods(optProtos);
        if (optStatics) Object.extend(klass, optStatics);

        Global[className] = klass;
        return klass;
    },

    isValidIdentifier: function(str) {
        return (/^(?:[a-zA-Z_][\w\-]*[.])*[a-zA-Z_][\w\-]*$/).test(str);
    },

    isClass: function Class$isClass(object) {
        if(object === Object
            || object === Array
            || object === Function
            || object === String
            || object === Number) {
                return true;
        }
        return (object instanceof Function) && (object.superclass !== undefined);
    },

    className: function Class$className(cl) {
        if(cl === Object) return "Object"
        if(cl === Array) return "Array"
        if(cl === Function) return "Function"
        if(cl === String) return "String"
        if(cl === Number) return "Number"
        return cl.type;
    },

    forName: function forName(name) {
        // lookup the class object given the qualified name
        var ns = Class.namespaceFor(name);
        var shortName = Class.unqualifiedNameFor(name);
        return ns[shortName];
    },

    deleteObjectNamed: function Class$delteObjectNamed(name) {
        var ns = Class.namespaceFor(name),
            shortName = Class.unqualifiedNameFor(name);
        if (!ns[shortName]) return;
        delete ns[shortName];
    },

    unqualifiedNameFor: function Class$unqualifiedNameFor(name) {
        var lastDot = name.lastIndexOf('.'), // lastDot may be -1
            unqualifiedName = name.substring(lastDot + 1);
        if (!Class.isValidIdentifier(unqualifiedName)) throw new Error('not a name ' + unqualifiedName);
        return unqualifiedName;
    },

    namespaceFor: function Class$namespaceFor(className) {
        // get the namespace object given the qualified name
        var lastDot = className.lastIndexOf('.');
        if (lastDot < 0) return Global;
        else return namespace(className.substring(0, lastDot));
    },

    withAllClassNames: function Class$withAllClassNames(scope, callback) {
        for (var name in scope) {
            try {
                if (Class.isClass(scope[name]))
                    callback(name);
            } catch (er) { // FF exceptions
            }
        }
        callback("Object");
        callback("Global");
    },

    makeEnum: function Class$makeEnum(strings) {
        // simple mechanism for making objecs with property values set to
        // property names, to be used as enums.

        var e = {};
        for (var i = 0; i < strings.length; i++) {
            e[strings[i]] = strings[i];
        }
        return e;
    },

    getConstructor: function Class$getConstructor(object) {
        var c = object.constructor;
        return (c && c.getOriginal) ? c.getOriginal() : c;
    },

    getPrototype: function Class$getPrototype(object) {
        return this.getConstructor(object).prototype;
    },

    applyPrototypeMethod: function Class$applyPrototypeMethod(methodName, target, args) {
        var method = this.getPrototype(target);
        if (!method) throw new Error("method " + methodName + " not found");
        return method.apply(this, args);
    },

    getSuperConstructor: function Class$getSuperConstructor(object) {
        return this.getConstructor(object).superclass;
    },

    getSuperPrototype: function Class$getSuperPrototype(object) {
        var sup = this.getSuperConstructor(object);
        return sup && sup.prototype;
    },

    addPins: function Class$addPins(cls, spec) {
        if (Global.Relay) {
            Class.addMixin(cls, Relay.newDelegationMixin(spec).prototype);
            return;
        }
        // this is for refactoring away from Relay and friends
        if (!Object.isArray(spec)) throw new Error('Cannot deal with non-Array spec in addPins');
        function unstripName(name) { return name.replace(/[\+|\-]?(.*)/, '$1') };
        function needsSetter(name) { return !name.startsWith('-') };
        function needsGetter(name) { return !name.startsWith('+') };
        var mixinSpec = {};
        spec.forEach(function(specString) {
            var name = unstripName(specString);
            if (needsSetter(specString))
                mixinSpec['set' + name] = function(value) { return this['_' + name] = value }
            if (needsGetter(specString))
                mixinSpec['get' + name] = function() { return this['_' + name] }
        })
        Class.addMixin(cls, mixinSpec);
    },

    addMixin: function Class$addMixin(cls, source) {
        var spec = {};
        for (var prop in source) {
            var value = source[prop];
            switch (prop) {
                case "constructor": case "initialize": case "deserialize": case "copyFrom":
                case "toString": case "definition": case "description":
                    break;
                default:
                    if (cls.prototype[prop] === undefined) // do not override existing values!
                        spec[prop] = value;
            }
        }
        cls.addMethods(spec);
    },

};

Object.subclass('Namespace',
'initializing', {

    initialize: function(context, nsName) {
        this.namespaceIdentifier = context.namespaceIdentifier + '.' + nsName;
        this.createTime = new Date();
    },
},
'accessing', {
    gather: function(selector, condition, recursive) {
        var result = Object.values(this).select(function(ea) { return condition.call(this, ea) }, this);
        if (!recursive) return result;
        return    this.subNamespaces().inject(result, function(result, ns) { return result.concat(ns[selector](true)) });
    },

    subNamespaces: function(recursive) {
        return this.gather(
            'subNamespaces',
            function(ea) { return (ea instanceof lively.lang.Namespace || ea === Global) && ea !== this },
            recursive);
    },

    classes: function(recursive) {
        var normalClasses = this.gather(
            'classes',
            function(ea) { return ea && ea !== this.constructor && Class.isClass(ea) },
            recursive);
        if (this === Global)
            return [Array, Number, String, Function].concat(normalClasses);
        return normalClasses;
    },

    functions: function(recursive) {
        return this.gather(
            'functions',
            function(ea) { return ea
                               && !Class.isClass(ea)
                               && Object.isFunction(ea)
                               && !ea.declaredClass
                               && this.requires !== ea
                               && ea.getOriginal() === ea },
            recursive);
    },

});

// let Glabal act like a namespace itself
Object.extend(Global, Namespace.prototype);
Object.extend(Global, {
    namespaceIdentifier: 'Global',
    isLoaded: Functions.True,
});

Namespace.addMethods(
'properties', {
    isLivelyModule: true,
},
'initializing', {
    beAnonymous: function() {
        this._isAnonymous = true;
        this.sourceModuleName = lively.lang.Namespace.current().namespaceIdentifier;
        return this;
    },
},
'accessing', { // module specific, should be a subclass?

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
        Config.modulePaths.forEach(function(ea) {
            if (relativePath.substring(0, ea.length) == ea) {
                uri = Config.rootPath + relativePath;
            }
        });
        if (uri == '') {
            uri = Config.codeBase + relativePath;
        }
        return uri;
    },

    uri: function(optType) { // FIXME cleanup necessary
        if (this.__cachedUri) { return this.__cachedUri; }
        if (this.fromDB) {
            var id = this.namespaceIdentifier; // something like lively.Core
            var namespacePrefix;
            if (id.startsWith('Global.')) {
                namespacePrefix = 'Global.';
                id = id.substring(7);
            } else
                throw dbgOn(new Error('unknown namespaceIdentifier'));

            // FIXME: extract to Config.codeBaseDB
            var url = Config.couchDBURL + '/' + this.fromDB + '/_design/raw_data/_list/javascript/for-module?module=' + id;
            this.__cachedUri = url;
            return url;
        } else {
            var id = this.namespaceIdentifier; // something like lively.Core
            var namespacePrefix;
            if (!this.isAnonymous()) {
                url = this.findUri(optType);
            } else {
                if (id.startsWith('Global.')) namespacePrefix = 'Global.';
                else throw dbgOn(new Error('unknown namespaceIdentifier'));
                url = Config.codeBase + this.namespaceIdentifier.substr(namespacePrefix.length).replace(/\./g, '/');
            }

            this.__cachedUri = url;
            return url;
        }
    },
    relativePath: function(optType) {
        return new URL(this.uri(optType)).relativePathFrom(URL.codeBase);
    },

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
        deps = deps.withoutAll(visited)
        visited.push(this);
        return [this.namespaceIdentifier, deps.collect(function(ea) {
            return ea.traceDependendModules(visited)
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
        if (this.pendingRequirements && !this.pendingRequirements.include(requiredModule))
            throw dbgOn(new Error('requiredModule not there'));
        this.pendingRequirements = this.pendingRequirements.without(requiredModule);
        if (!this.hasPendingRequirements()) {
            this.load();
        }
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
    },
},
'load callbacks', {
    addOnloadCallback: function(cb) {
        if (!this.callbacks) this.callbacks = [];
        this.callbacks.push(cb);
    },

    runOnloadCallbacks: function() {
        if (!this.callbacks) return;
        var cb;
        while (cb = this.callbacks.shift()) {
                    try {cb()} catch(e) {
                        this.logError('runOnloadCallbacks: ' + cb.name + ': ' + e);
                        throw e
                    }
                };
    },

    isAnonymous: function() {
        return this._isAnonymous
    },

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
        return this._isAnonymous
    },

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
            // time is not only the time needed for the request and code evaluation
            // but the complete time span from the creation of the module (when the module is first encountered)
            // to evaluation the evaluation of its code, including load time of all requirements
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
        if (m !== this)
            throw new Error('Wrong module: ' + this.namespaceIdentifier +
                ' instead of expected ' + m.namespaceIdentifier )
    },
},
'removing', {
    remove: function() {
        var ownerNamespace = Class.namespaceFor(this.namespaceIdentifier),
            ownName = Class.unqualifiedNameFor(this.namespaceIdentifier)
        JSLoader.removeAllScriptsThatLinkTo(this.uri());
        delete ownerNamespace[ownName];
    },
    removeScriptNode: function() {
        var node = document.getElementById(this.uri());
        if (!node) return
        node.parentNode.removeChild(node);
    },
},
'debugging', {
    toString: function() { return 'module(' + this.namespaceIdentifier + ')' },
    inspect: function() { this.toString() + ' defined at ' + this.defStack },
        logError: function(e) {
            var list = this.traceDependendModules();
            var msg = 'Error while loading ' + this.moduleName + ': ' + e;
            msg += '\ndependencies: ' + Strings.printNested(list)
            if (Global.lively && lively.morphic && lively.morphic.World && lively.morphic.World.current() && lively.morphic.World.current().logError)
                lively.morphic.World.current().logError(e)

            if (e.stack) msg = msg + e.stack;
            console.error(msg);
            dbgOn(true);
        }
});

Object.extend(Namespace, {
    namespaceStack: [Global],
    current: function() { return this.namespaceStack.last() },
    topologicalSortLoadedModules: function() {
        // get currently loaded modules that really are js files
        var modules = Global.subNamespaces(true).select(function(ea) {
            return ea.isLoaded() && new WebResource(ea.uri()).exists() });

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
        if (modules.length > 0)
            throw new Error('Cannot find dependencies for all modules!');

        return sortedModules;
    },

    bootstrapModules: function() {
        // return a string to include in bootstrap.js
        var urls = this.topologicalSortLoadedModules().collect(function(ea) {
            return new URL(ea.uri()).relativePathFrom(URL.codeBase)  });
        var manual = [LivelyLoader.jqueryPath, 'lively/miniprototype.js', 'lively/JSON.js', 'lively/defaultconfig.js', 'lively/localconfig.js', 'lively/Base.js'];

        urls = manual.concat(urls);
        return urls;
    },
    bootstrapModulesString: function() {
        var urls = this.bootstrapModules();
        return '[\'' + urls.join('\', \'') + '\']';
    },
});

(function moveNamespaceClassToLivelyLang() {
    // namespace('lively.lang');
    lively = new Namespace(Global, 'lively');
    lively.lang = new Namespace(lively, 'lang');
    lively.lang.Namespace = Namespace;
    delete Namespace;
})();

(function setupLivelyLang() {
    lively.lang.Execution = {
        showStack: Functions.Null,
        resetDebuggingStack: Functions.Null,
        installStackTracers: Functions.Null
    };
    lively.lang.let = function(/** **/) {
        // lively.lang.let(y, function(x) { body }) is equivalent to { let y = x; body; }
        return arguments[arguments.length - 1].apply(this, arguments);
    }
})();

/*
 * Stack Viewer when Dan's StackTracer is not available
 * FIXME rk: move this to Helper.js?
 */
function getStack() {
    var result = [];
    for(var caller = arguments.callee.caller; caller; caller = caller.caller) {
        if (result.indexOf(caller) != -1) {
           result.push({name: "recursive call can't be traced"});
           break;
        }
        result.push(caller);
    };
    return result;
};

function printStack() {
    function guessFunctionName(func) {
        var qName = func.qualifiedMethodName && func.qualifiedMethodName(),
            regExpRes = func.toString().match(/function (.+)\(/);
        return qName || (regExpRes && regExpRes[1]) || func;
    };

    var string = "== Stack ==\n",
        stack = getStack();
    stack.shift(); // for getStack
    stack.shift(); // for printStack (me)
    var indent = "";
    for (var i=0; i < stack.length; i++) {
        string += indent + i + ": " +guessFunctionName(stack[i]) + "\n";
        indent += " ";
    };
    return string;
};

function logStack() {
    this.console.log(printStack())
};

namespace('lively');