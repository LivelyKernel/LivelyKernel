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

var Properties = {
    documentation: "convenience property access functions",

    all: function Properties$all(object, predicate) {
        var a = [];
        for (var name in object) {
            if ((object.__lookupGetter__(name) || !Object.isFunction(object[name])) && (predicate ? predicate(name, object) : true))
                a.push(name);
        }
        return a;
    },

    own: function Properties$own(object) {
        var a = [];
        for (var name in object) {
            if (object.hasOwnProperty(name) && (object.__lookupGetter__(name) || !Object.isFunction(object[name])))
                a.push(name);
        }
        return a;
    },

    forEachOwn: function Properties$forEachOwn(object, func, context) {
        for (var name in object) {
            if (!object.hasOwnProperty(name)) continue;
            var value = object[name];
            if (!(value instanceof Function))
                var result = func.call(context || this, name, value);
        }
    },

    nameFor: function Properties$nameFor(object, value) {
        for (var name in object)
            if (object[name] === value) return name;
        return undefined
    },
    values: function Properties$values(obj) {
        var values = [];
        for (var name in obj) values.push(obj[name]);
        return values;
    },
    ownValues: function Properties$ownValues(obj) {
        var values = [];
        for (var name in obj) if (obj.hasOwnProperty(name)) values.push(obj[name]);
        return values;
    },
    printObjectSize: function(obj) {
        return Numbers.humanReadableByteSize(JSON.stringify(obj).length)
    }
};

// bootstrap namespaces
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

/**
  * Charset
  */
Object.subclass('CharSet', {
    documentation: "limited support for charsets"
});

Object.extend(CharSet, {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789",
    underscore: "_",
    nonAlpha: "`1234567890-=[]\;',./",
    shiftedNonAlpha: '~!@#$%^&*()_+{}:"<>?|',
    leftBrackets: "*({[<'" + '"',
    rightBrackets: "*)}]>'" + '"'
});

Object.extend(CharSet, {
    // select word, brackets
    alphaNum: CharSet.lowercase + CharSet.uppercase + CharSet.digits + CharSet.underscore,
    charsAsTyped: CharSet.uppercase + CharSet.nonAlpha,
    charsUnshifted: CharSet.lowercase + CharSet.nonAlpha,
    charsShifted: CharSet.uppercase + CharSet.shiftedNonAlpha,

    nonBlank: function(cc) {
        return " \n\r\t".include(cc) == false;
    }

});



namespace('lively');
Global.console && Global.console.log("loaded basic library");


// ===========================================================================
// Portable graphics foundations
// ===========================================================================

Object.subclass("Point", {
    documentation: "2D Point",

    initialize: function(x, y) {
        this.x = x;
        this.y = y;
        return this;
    },
    toFixed: function(val) { return new lively.Point(this.x.toFixed(val), this.y.toFixed(val)) },


    deserialize: function(importer, string) { // reverse of toString
        var array = string.slice(3, -1).split(',');
        this.x = lively.data.Coordinate.parse(array[0]);
        this.y = lively.data.Coordinate.parse(array[1]);
    },

    addPt: function(p) {
        if (arguments.length != 1)
            throw('addPt() only takes 1 parameter.');

        return new lively.Point(this.x + p.x, this.y + p.y);
    },
    addXY: function(dx,dy) { return new lively.Point(this.x + dx, this.y + dy); },
    midPt: function(p) { return new lively.Point((this.x + p.x)/2, (this.y + p.y)/2); },
    subPt: function(p) {
        if (arguments.length != 1)
            throw('subPt() only takes 1 parameter.');

        return new lively.Point(this.x - p.x, this.y - p.y);
    },
    subXY: function(dx,dy) { return new lively.Point(this.x - dx, this.y - dy); },
    negated: function() { return new lively.Point(-this.x, -this.y); },
    inverted: function() { return new lively.Point(1.0/this.x, 1.0/this.y); },
    invertedSafely: function() { return new lively.Point(this.x && 1.0/this.x, this.y && 1.0/this.y); },
    scaleBy: function(scale) { return new lively.Point(this.x*scale,this.y*scale); },
    scaleByPt: function(scalePt) { return new lively.Point(this.x*scalePt.x,this.y*scalePt.y); },
    lessPt: function(p) { return this.x < p.x && this.y < p.y; },
    leqPt: function(p) { return this.x <= p.x && this.y <= p.y; },
    eqPt: function(p) { return this.x == p.x && this.y == p.y; },
    equals: function(p) { return this.eqPt(p); },
    withX: function(x) { return pt(x, this.y); },
    withY: function(y) { return pt(this.x, y); },

    normalized: function() {
        var r = this.r();
        return pt(this.x / r, this.y / r);
    },

    dotProduct: function(p) { return this.x * p.x + this.y * p.y },

    minPt: function(p, acc) {
        if (!acc) acc = new lively.Point(0, 0);
        acc.x = Math.min(this.x, p.x);
        acc.y = Math.min(this.y, p.y);
        return acc;
    },

    maxPt: function(p, acc) {
        if (!acc) acc = new lively.Point(0, 0);
        acc.x = Math.max(this.x, p.x);
        acc.y = Math.max(this.y, p.y);
        return acc;
    },

    roundTo: function(quantum) { return new lively.Point(this.x.roundTo(quantum), this.y.roundTo(quantum)); },

    random: function() {  return new lively.Point(this.x*Math.random(), this.y*Math.random());     },

    dist: function(p) {
        var dx = this.x - p.x;
        var dy = this.y - p.y;
        return Math.sqrt(dx*dx + dy*dy);
    },

    nearestPointOnLineBetween: function(p1, p2) { // fasten seat belts...
        if (p1.x == p2.x) return pt(p1.x, this.y);
        if (p1.y == p2.y) return pt(this.x, p1.y);
        var x1 = p1.x;
        var y1 = p1.y;
        var x21 = p2.x - x1;
        var y21 = p2.y - y1;
        var t = (((this.y - y1) / x21) + ((this.x - x1) / y21)) / ((x21 / y21) + (y21 / x21));
        return pt(x1 + (t * x21) , y1 + (t * y21));
    },

    asRectangle: function() { return new Rectangle(this.x, this.y, 0, 0); },
    extent: function(ext) { return new Rectangle(this.x, this.y, ext.x, ext.y); },
    extentAsRectangle: function() { return new Rectangle(0, 0, this.x, this.y) },

    toString: function() {
        return Strings.format("pt(%1.f,%1.f)", this.x, this.y);
    },

    toTuple: function() {
        return [ this.x, this.y ];
    },

    toLiteral: function() { return {x: this.x, y: this.y}; },

    inspect: function() {
        return JSON.serialize(this);
    },

    matrixTransform: function(mx, acc) {
        if (!acc) acc = pt(0, 0); // if no accumulator passed, allocate a fresh one
        acc.x = mx.a * this.x + mx.c * this.y + mx.e;
        acc.y = mx.b * this.x + mx.d * this.y + mx.f;
        return acc;
    },

    matrixTransformDirection: function(mx, acc) {
        if (!acc) acc = pt(0, 0); // if no accumulator passed, allocate a fresh one
        acc.x = mx.a * this.x + mx.c * this.y ;
        acc.y = mx.b * this.x + mx.d * this.y ;
        return acc;
    },

    // Polar coordinates (theta=0 is East on screen, and increases in CCW direction
    r: function() { return this.dist(pt(0,0)); },
    theta: function() { return Math.atan2(this.y,this.x); },

    copy: function() { return new lively.Point(this.x, this.y); }
});

lively.Point = Point;

lively.Point.addMethods({

    fastR: function() {
        var a = this.x*this.x+this.y*this.y;
        var x = 17;
        for (var i = 0; i < 6; i++)
        x = (x+a/x)/2;
        return x;
    },

    fastNormalized: function() {
        var r = this.fastR();
        return pt(this.x / r, this.y / r);
    },

        griddedBy: function(grid) {
            return pt(this.x - (this.x % grid.x),this.y - (this.y % grid.y))
        }
});

Object.extend(lively.Point, {

    ensure: function(duck) { // make sure we have a Lively point
        if (duck instanceof lively.Point) {
            return duck;
        } else {
            return new lively.Point(duck.x, duck.y);
        }
    },

    // Note: theta=0 is East on the screen, and increases in counter-clockwise direction
    polar: function(r, theta) { return new lively.Point(r*Math.cos(theta), r*Math.sin(theta)); },
    random: function(scalePt) { return new lively.Point(scalePt.x.randomSmallerInteger(), scalePt.y.randomSmallerInteger()); },

    fromLiteral: function(literal) {
        return pt(literal.x, literal.y);
    }

});

// Shorthand for creating point objects
function pt(x, y) {
    return new lively.Point(x, y);
}

Object.subclass("Rectangle", {

    documentation: "primitive rectangle",
    // structually equivalent to SVGRect

    initialize: function(x, y, w, h) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = w || 0;
        this.height = h || 0;
    },

    copy: function() { return new Rectangle(this.x, this.y, this.width, this.height);  },
    toFixed: function(val) {
        return new Rectangle(this.x.toFixed(val), this.y.toFixed(val), this.width.toFixed(val), this.height.toFixed(val));
    },

    maxX: function() { return this.x + this.width; },
    maxY: function() { return this.y + this.height; },


    withWidth: function(w) { return new Rectangle(this.x, this.y, w, this.height)},
    withHeight: function(h) { return new Rectangle(this.x, this.y, this.width, h)},
    withX: function(x) { return new Rectangle(x, this.y, this.width, this.height)},
    withY: function(y) { return new Rectangle(this.x, y, this.width, this.height)},
    extent: function() { return new lively.Point(this.width,this.height); },
    withExtent: function(ext) { return new Rectangle(this.x, this.y, ext.x, ext.y); },
    center: function() { return new lively.Point(this.x+(this.width/2),this.y+(this.height/2))},
    //Control point readers and writers
    topLeft: function() { return new lively.Point(this.x, this.y)},
    topRight: function() { return new lively.Point(this.maxX(), this.y)},
    bottomRight: function() { return new lively.Point(this.maxX(), this.maxY())},
    bottomLeft: function() { return new lively.Point(this.x, this.maxY())},
    leftCenter: function() { return new lively.Point(this.x, this.center().y)},
    rightCenter: function() { return new lively.Point(this.maxX(), this.center().y)},
    topCenter: function() { return new lively.Point(this.center().x, this.y)},
    bottomCenter: function() { return new lively.Point(this.center().x, this.maxY())},
    withTopLeft: function(p) { return Rectangle.fromAny(p, this.bottomRight()) },
    withTopRight: function(p) { return Rectangle.fromAny(p, this.bottomLeft()) },
    withBottomRight: function(p) { return Rectangle.fromAny(p, this.topLeft()) },
    withBottomLeft: function(p) { return Rectangle.fromAny(p, this.topRight()) },
    withLeftCenter: function(p) { return new Rectangle(p.x, this.y, this.width + (this.x - p.x), this.height)},
    withRightCenter: function(p) { return new Rectangle(this.x, this.y, p.x - this.x, this.height)},
    withTopCenter: function(p) { return new Rectangle(this.x, p.y, this.width, this.height + (this.y - p.y))},
    withBottomCenter: function(p) { return new Rectangle(this.x, this.y, this.width, p.y - this.y)}
});

Rectangle.addMethods({

    equals: function(other) {
        if (!other) return false;
        return     this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height;
    },

    containsPoint: function(p) {
        return this.x <= p.x && p.x <= this.x + this.width && this.y<= p.y && p.y <= this.y + this.height;
    },

    containsRect: function(r) {
        return this.x <= r.x && this.y<= r.y && r.maxX()<=this.maxX() && r.maxY()<=this.maxY();
    },

    constrainPt: function(pt) { return pt.maxPt(this.topLeft()).minPt(this.bottomRight()); },
    realWidth: function() { return this.x < 0 ? -this.x + this.width : this.width },
    realHeight: function() { return this.y < 0 ? -this.y + this.height : this.height },


    relativeToAbsPoint: function(relPt) {
        return new lively.Point(
            this.x + this.width * relPt.x,
            this.y + this.height * relPt.y)
    },


    intersection: function(r) {
        // return rect(this.topLeft().maxPt(r.topLeft()),this.bottomRight().minPt(r.bottomRight()));
        var nx = Math.max(this.x, r.x);
        var ny = Math.max(this.y, r.y);
        var nw = Math.min(this.x + this.width, r.x + r.width) - nx;
        var nh = Math.min(this.y + this.height, r.y + r.height) - ny;
        return new Rectangle(nx, ny, nw, nh);
    },

    intersects: function(r) { return this.intersection(r).isNonEmpty(); },    // not the fastest

    union: function(r) {
        return rect(this.topLeft().minPt(r.topLeft()),this.bottomRight().maxPt(r.bottomRight()));
    },

    isNonEmpty: function(rect) { return this.width > 0 && this.height > 0; },

    dist: function(r) { // dist between two rects
        var p1 = this.closestPointToPt(r.center());
        var p2 = r.closestPointToPt(p1);
        return p1.dist(p2);
    },

    closestPointToPt: function(p) { // Assume p lies outside me; return a point on my perimeter
        return pt(Math.min(Math.max(this.x, p.x), this.maxX()),
        Math.min(Math.max(this.y, p.y), this.maxY()));
    },

    randomPoint: function() { // return a some point from inside me
        return lively.Point.random(pt(this.width, this.height)).addPt(this.topLeft());
    },

    translatedBy: function(d) {
        return new Rectangle(this.x+d.x, this.y+d.y, this.width, this.height);
    },

    scaleByRect: function(r) { // r is a relative rect, as a pane spec in a window
        return new Rectangle (
            this.x + (r.x*this.width),
            this.y + (r.y*this.height),
            r.width * this.width,
            r.height * this.height );
    },

    scaleRectIn: function(fullRect) { // return a relative rect for this as a part of fullRect
        return new Rectangle (
            (this.x - fullRect.x) / fullRect.width,
            (this.y - fullRect.y) / fullRect.height,
            this.width    / fullRect.width,
            this.height / fullRect.height );
    },

    insetBy: function(d) {
        return new Rectangle(this.x+d, this.y+d, this.width-(d*2), this.height-(d*2));
    },

    insetByPt: function(p) {
        return new Rectangle(this.x+p.x, this.y+p.y, this.width-(p.x*2), this.height-(p.y*2));
    },

    expandBy: function(delta) { return this.insetBy(0 - delta); },

    transformRectForInclusion: function(other) {
        var topLeft = this.topLeft().maxPt(other.topLeft()),
            newBottomRight = topLeft.addPt(other.extent()),
            innerBottomRight = this.bottomRight().minPt(newBottomRight);
// alert('this.bottomRight' + this.bottomRight())
// alert('newBottomRight' + newBottomRight)
// alert('innerBottomRight' + innerBottomRight)
        return rect(topLeft, innerBottomRight);
        return topLeft.extent(bottomRight);
    },
});

Object.extend(Rectangle, {
    corners: ["topLeft","topRight","bottomRight","bottomLeft"],
    sides: ["leftCenter","rightCenter","topCenter","bottomCenter"]
});

Rectangle.addMethods({

    partNamed: function(partName) {
        return this[partName].call(this);
    },

    withPartNamed: function(partName,newValue) {
        return this[this.setterName(partName)].call(this, newValue);
    },

    setterName: function(partName) {
        return "with" + partName[0].toUpperCase() + partName.slice(1);
    },

    partNameNear: function(partNames,p,dist) {
        var partName = this.partNameNearest(partNames,p);
        return (p.dist(this.partNamed(partName)) < dist) ? partName : null;
    },

    partNameNearest: function(partNames, p) {
        var dist = 1.0e99,
            partName = partNames[0];

        for (var i=0; i<partNames.length; i++) {
            var partName = partNames[i],
                pDist = p.dist(this.partNamed(partName));
            if (pDist < dist) {var nearest = partName; dist = pDist}
        }

        return nearest;
    },

    toString: function() {
        return Strings.format("rect(%s,%s)", this.topLeft(), this.bottomRight());
    },

    toTuple: function() {
        return [this.x, this.y, this.width, this.height];
    },

    inspect: function() {
        return JSON.serialize(this);
    }
});

Rectangle.addMethods({
    // These methods enable using rectangles as insets, modeled after
    // the CSS box model, see http://www.w3.org/TR/REC-CSS2/box.html
    // note topLeft() bottomRight() etc, return the intuitively
    // correct values for Rectangles used as insets.

    left: function() {
        return this.x;
    },

    right: function() {
        return this.maxX();
    },

    top: function() {
        return this.y;
    },

    bottom: function() {
        return this.maxY();
    },

    toInsetTuple: function() {
        return [this.left(), this.top(), this.right(), this.bottom()];
    },

    toAttributeValue: function(d) {
        var d = 0.01,
            result = [this.left()];
        if (this.top() === this.bottom() && this.left() === this.right()) {
            if (this.top() === this.left()) result.push(this.top());
            } else result = result.concat([this.top(), this.right(), this.bottom()]);
            return result.invoke('roundTo', d || 0.01);
    },

    insetByRect: function(r) {
        return new Rectangle(this.x + r.left(), this.y + r.top(), this.width - (r.left() + r.right()), this.height - (r.top() + r.bottom()));
    },

    outsetByRect: function(r) {
        return new Rectangle(this.x - r.left(), this.y - r.top(), this.width + (r.left() + r.right()), this.height + (r.top() + r.bottom()));
    },

    toLiteral: function() { return {x: this.x, y: this.y, width: this.width, height: this.height}; },

});



Object.extend(Rectangle, {

    fromAny: function(ptA, ptB) {
        return rect(ptA.minPt(ptB), ptA.maxPt(ptB));
    },

    fromLiteral: function(literal) {
        return new Rectangle(literal.x, literal.y, literal.width, literal.height);
    },

    unionPts: function(points) {
        var min = points[0],
            max = points[0];

        // AT: Loop starts from 1 intentionally
        for (var i = 1; i < points.length; i++) {
            min = min.minPt(points[i]);
            max = max.maxPt(points[i]);
        }

        return rect(min, max);
    },

    ensure: function(duck) {
        if (duck instanceof Rectangle) {
            return duck;
        } else {
            return new Rectangle(duck.x, duck.y, duck.width, duck.height);
        }
    },

    fromElement: function(element) {
        // FIXME
        if (element.namespaceURI == Namespace.XHTML) {
            var x = lively.data.Length.parse(element.style.left || 0),
                y = lively.data.Length.parse(element.style.top || 0),
                width = lively.data.Length.parse(element.style.width || 0),
                height = lively.data.Length.parse(element.style.hieght || 0);
            return new Rectangle(x, y, width, height);
        }
        if (element.namespaceURI == Namespace.SVG) {
            return new Rectangle(element.x.baseVal.value, element.y.baseVal.value,
                element.width.baseVal.value, element.height.baseVal.value);
        }
        throw new Error('Cannot create Rectangle from ' + element);
    },

    inset: function(left, top, right, bottom) {
        if (top === undefined) top = left;
        if (right === undefined) right = left;
        if (bottom === undefined) bottom = top;
        return new Rectangle(left, top, right - left, bottom - top);
    }

});

// Shorthand for creating rectangle objects
function rect(location, corner) {
    return new Rectangle(location.x, location.y, corner.x - location.x, corner.y - location.y);
};

// ===========================================================================
// Color support
// ===========================================================================

Object.subclass("Color", {

    documentation: "Fully portable support for RGB colors. A bit of rgba support is also included.",

    isColor: true,

    initialize: function(r, g, b, a) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a || (a === 0 ? 0 : 1);
    },

    // Mix with another color -- 1.0 is all this, 0.0 is all other
    mixedWith: function(other, proportion) {
        var p = proportion,
            q = 1.0 - p;
        return new Color(this.r*p + other.r*q, this.g*p + other.g*q, this.b*p + other.b*q, this.a*p + other.a*q);
    },

    darker: function(recursion) {
        var result = this.mixedWith(Color.black, 0.5);
        return recursion > 1  ? result.darker(recursion - 1) : result;
    },

    lighter: function(recursion) {
        if (recursion == 0)
            return this;
        var result = this.mixedWith(Color.white, 0.5);
        return recursion > 1 ? result.lighter(recursion - 1) : result;
    },

    toString: function() {
        function floor(x) { return Math.floor(x*255.99) };
        // 06/10/10 currently no rgba support for SVG - http://code.google.com/p/chromium/issues/detail?id=45435
        // return "rgba(" + floor(this.r) + "," + floor(this.g) + "," + floor(this.b) + "," + this.a + ")";
        return "rgb(" + floor(this.r) + "," + floor(this.g) + "," + floor(this.b) + ")";
    },

    toRGBAString: function() {
        function floor(x) { return Math.floor(x*255.99) };
        return "rgba(" + floor(this.r) + "," + floor(this.g) + "," + floor(this.b) + "," + this.a + ")";
    },

    toTuple: function() {
        return [this.r, this.g, this.b, this.a];
    },

    deserialize: function(importer, colorStringOrTuple) {
        if (!colorStringOrTuple) return null;
        // dbgOn(!str.match);
        var color;
        if (colorStringOrTuple instanceof Color) color = colorStringOrTuple;
        else if (colorStringOrTuple instanceof String) color = Color.fromString(colorStringOrTuple)
        else color = Color.fromTuple(colorStringOrTuple);
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
        if (!color.a && color.a !== 0) color.a = 1;
        this.a = color.a;
    },

    grayValue: function() {
        return (this.r + this.g + this.b) / 3
    },

    withA: function(a) { return new Color(this.r, this.g, this.b, a) },

    equals: function(other) {
        if(!other) return false;
        return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
    },
    invert: function() { return Color.rgb(255 * (1 - this.r), 255 * (1 - this.g), 255 * (1 - this.b)) },


});

Object.extend(Color, {

    black: new Color(0,0,0),
    white: new Color(1,1,1),
    gray: new Color(0.8,0.8,0.8),
    red: new Color(0.8,0,0),
    green: new Color(0,0.8,0),
    yellow: new Color(0.8,0.8,0),
    blue:  new Color(0,0,0.8),
    purple: new Color(1,0,1),
    magenta: new Color(1,0,1),


    random: function() {
        return new Color(Math.random(),Math.random(),Math.random());
    },

    hsb: function(hue,sat,brt) {
        var s = sat;
        var b = brt;
        // zero saturation yields gray with the given brightness
        if (sat == 0) return new Color(b,b,b);
        var h = hue % 360;
        var h60 = h / 60;
        var i = Math.floor(h60); // integer part of hue
        var f = h60 - i; // fractional part of hue
        var p = (1.0 - s) * b;
        var q = (1.0 - (s * f)) * b;
        var t = (1.0 - (s * (1.0 - f))) * b;

        switch (i) {
            case 0:     return new Color(b,t,p);
            case 1:     return new Color(q,b,p);
            case 2:     return new Color(p,b,t);
            case 3:     return new Color(p,q,b);
            case 4:     return new Color(t,p,b);
            case 5:     return new Color(b,p,q);
            default: return new Color(0,0,0);
        }
    },

    wheel: function(n) {
        return Color.wheelHsb(n,0.0,0.9,0.7);
    },

    // Return an array of n colors of varying hue
    wheelHsb: function(n,hue,sat,brt) {
        var a = new Array(n);
        var step = 360.0 / (Math.max(n,1));

        for (var i = 0; i < n; i++)
        a[i] = Color.hsb(hue + i*step, sat, brt);

        return a;
    },

    rgb: function(r, g, b) {
        return new Color(r/255, g/255, b/255);
    },

    rgba: function(r, g, b, a) {
        return new Color(r/255, g/255, b/255, a);
    },

    fromLiteral: function(spec) {
        return new Color(spec.r, spec.g, spec.b, spec.a);
    },

    fromTuple: function(tuple) {
        return new Color(tuple[0], tuple[1], tuple[2], tuple[3]);
    },

    fromString: function(str) {
        var tuple = Color.parse(str);
        return tuple && Color.fromTuple(tuple);
    },

    rgbaRegex: new RegExp('\\s*rgba?\\s*\\(\\s*(\\d+)(%?)\\s*,\\s*(\\d+)(%?)\\s*,\\s*(\\d+)(%?)\\s*(?:,\\s*([0-9\\.]+)\\s*)?\\)\\s*'),

    parse: function(str) {
        // FIXME handle keywords
        if (!str || str == 'none') return null;
        return str.startsWith('#') ? this.parseHex(str) : this.parseRGB(str);
    },

    parseRGB: function(str) {
        // match string of the form rgb([r],[g],[b]) or rgb([r%],[g%],[b%]), allowing whitespace between all components
        var match = str.match(this.rgbaRegex);
        if (match) {
            var r = parseInt(match[1]) / (match[2] ? 100 : 255);
            var g = parseInt(match[3]) / (match[4] ? 100 : 255);
            var b = parseInt(match[5]) / (match[6] ? 100 : 255);
            var a = match[7] ? parseFloat(match[7]) : 1.0;
            return [r, g, b, a];
        }
        return null;
    },

    parseHex: function(str) {
        var rHex, gHex, bHex;
        if (str.length == 7) { // like #CC0000
            rHex = str.substring(1,3);
            gHex = str.substring(3,5);
            bHex = str.substring(5,7);
        } else if (str.length == 4) { // short form like #C00
            rHex = str.substring(1,2);
            rHex += rHex;
            gHex = str.substring(2,3);
            gHex += gHex;
            bHex = str.substring(3,4);
            bHex += bHex;
        } else {
            return null
        }
        var r = parseInt(rHex, 16)/255;
        var g = parseInt(gHex, 16)/255;
        var b = parseInt(bHex, 16)/255;
        return [r, g, b];
    },
});

Object.extend(Color, {
    darkGray: Color.gray.darker(),
    lightGray: Color.gray.lighter(),
    veryLightGray: Color.gray.lighter().lighter(),
    turquoise: Color.rgb(0, 240, 255),
    //      brown: Color.rgb(182, 67, 0),
    //      red: Color.rgb(255, 0, 0),
    orange: Color.rgb(255, 153, 0),
    //      yellow: Color.rgb(204, 255, 0),
    //      limeGreen: Color.rgb(51, 255, 0),
    //      green: Color.rgb(0, 255, 102),
    //      cyan: Color.rgb(0, 255, 255),
    //      blue: Color.rgb(0, 102, 255),
    //      purple: Color.rgb(131, 0, 201),
    //      magenta: Color.rgb(204, 0, 255),
    //      pink: Color.rgb(255, 30, 153),

    tangerine: Color.rgb(242, 133, 0),

    primary: {
        // Sun palette
        blue: Color.rgb(0x53, 0x82, 0xA1),
        orange: Color.rgb(0xef, 0x6f, 0x00),
        green: Color.rgb(0xb2, 0xbc, 00),
        yellow: Color.rgb(0xff, 0xc7, 0x26)
    },

    secondary: {
        blue: Color.rgb(0x35, 0x55, 0x6b),
        orange: Color.rgb(0xc0, 0x66, 0x00),
        green: Color.rgb(0x7f, 0x79, 0x00),
        yellow: Color.rgb(0xc6, 0x92, 0x00)
    },

    neutral: {
        lightGray: Color.rgb(0xbd, 0xbe, 0xc0),
        gray: Color.rgb(0x80, 0x72, 0x77)
    }

});

Function.addMethods(
'serialization', {
    toLiteral: function() { // DEPRECATED!!!
        return {source: String(this)}
    },
    unbind: function() {
        // for serializing functions
        return Function.fromString(this.toString());
    },
},
'scripting', {
    asScript: function(optVarMapping) {
        return lively.Closure.fromFunction(this, optVarMapping).recreateFunc();
    },
    asScriptOf: function(obj, optName, optMapping) {
        var name = optName || this.name;
        if (!name) {
            throw Error("Function that wants to be a script needs a name: " + this);
        }
        var constructor = obj.constructor, mapping = {"this": obj};
        if (optMapping) mapping = Object.merge([mapping, optMapping]);
        if (constructor && constructor.prototype && constructor.prototype[name]) {
            var superFunc = function() {
                try {
                    return obj.constructor.prototype[name].apply(obj, arguments)
                } catch(e) {
                    alert('Error in $super call: ' + e + '\n' + e.stack);
                    return null;
                }
            };
            mapping["$super"] = lively.Closure.fromFunction(superFunc, {"obj": obj, name: name}).recreateFunc();
        }
        return this.asScript(mapping).addToObject(obj, name);
    },

    addToObject: function(obj, name) {
        this.name = name;
        obj[name] = this;
        // suppport for tracing
        if (lively.Tracing && lively.Tracing.stackTracingEnabled) {
            lively.Tracing.instrumentMethod(obj, name, {declaredObject: Objects.safeToString(obj)});
        }
        return this;
    },

    binds: function(varMapping) {
        // convenience function
        return lively.Closure.fromFunction(this, varMapping || {}).recreateFunc()
    },

    setProperty: function(name, value) {
        this[name] = value;
        if (this.hasLivelyClosure)
            this.livelyClosure.funcProperties[name] = value
    },

    getVarMapping: function() {
        if (this.hasLivelyClosure) return this.livelyClosure.varMapping;
        if (this.isWrapper) return this.originalFunction.varMapping;
        if (this.varMapping) return this.varMapping;
        return {}
    },
});

Global.console && Global.console.log("Loaded platform-independent graphics primitives");

Object.subclass('lively.Closure',
// represents a function and its bound values
'initializing', {
    isLivelyClosure: true,
    initialize: function(func, varMapping, source, funcProperties) {
        this.originalFunc = func;
        this.varMapping = varMapping || {};
        this.source = source;
        this.setFuncProperties(func || funcProperties);
    },
    setFuncSource: function(src) { this.source = src },
    hasFuncSource: function() { return this.source && true }

},
'accessing', {
    getFuncSource: function() { return this.source || String(this.originalFunc) },
    getFunc: function() { return this.originalFunc || this.recreateFunc() },
    getFuncProperties: function() {
        // a function may have state attached
        if (!this.funcProperties)
            this.funcProperties = {};
        return this.funcProperties;
    },
    setFuncProperties: function(obj) {
        var props = this.getFuncProperties();
        for (var name in obj)
            if (obj.hasOwnProperty(name))  props[name] = obj[name];
    },


    lookup: function(name) { return this.varMapping[name] },
    parameterNames: function(methodString) {
        var parameterRegex = /function\s*\(([^\)]*)\)/,
            regexResult = parameterRegex.exec(methodString);
        if (!regexResult || !regexResult[1]) return [];
        var parameterString = regexResult[1];
        if (parameterString.length == 0) return [];
        var parameters = parameterString.split(',').collect(function(str) {
            return Strings.removeSurroundingWhitespaces(str)
        }, this);
        return parameters;
    },
    firstParameter: function(src) { return this.parameterNames(src)[0] || null },
},
'function creation', {
    addClosureInformation: function(f) {
        f.hasLivelyClosure = true;
        f.livelyClosure = this;
        return f;
    },
    recreateFunc: function() { return this.recreateFuncFromSource(this.getFuncSource()) },
    recreateFuncFromSource: function(funcSource) {
        // what about objects that are copied by value, e.g. numbers?
        // when those are modified after the originalFunc we captured varMapping then we will
        // have divergent state
        var closureVars = [],
            thisFound = false,
            specificSuperHandling = this.firstParameter(funcSource) === '$super';
        for (var name in this.varMapping) {
            if (!this.varMapping.hasOwnProperty(name)) continue;
            if (name == 'this') { thisFound = true; continue };
            closureVars.push(name + '=this.varMapping["' + name + '"]');
        }
        var src = closureVars.length > 0 ? 'var ' + closureVars.join(',') + ';\n' : '';
        if (specificSuperHandling)
            src += '(function superWrapperForClosure() { return '
        src += '(' + funcSource + ')';
        // if (thisFound) src += '.bind(this)';

        if (specificSuperHandling)
            src += '.apply(this, [$super.bind(this)].concat($A(arguments))) })'

        try {
            var func = eval(src) || this.couldNotCreateFunc(src);
            this.addFuncProperties(func);
            // func.evalSrc = src; // For debugging
            return func;
        } catch(e) { alert('Cannot create function ' + e + ' src: ' + src); throw e };
    },
    addFuncProperties: function(func) {
        var props = this.getFuncProperties();
        for (var name in props)
            if (props.hasOwnProperty(name)) func[name] = props[name];
        this.addClosureInformation(func);
    },
    couldNotCreateFunc: function(src) {
        var msg = 'Could not recreate closure from source: \n' + src;
        console.error(msg);
        alert(msg);
        debugger;
        return function() { alert(msg) };
    },
},
'conversion', {
    asFunction: function() { return this.recreateFunc() }
});

Object.extend(lively.Closure, {
    fromFunction: function(func, varMapping) { return new this(func, varMapping || {}) },
    fromSource: function(source, varMapping) { return new this(null, varMapping || {}, source) },
});

Object.subclass('UUID',
'generation', {

	initialize: function() {
		this.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		}).toUpperCase();
	}

});
lively.LocalStorage = {
    isAvailable: function() { return Global.localStorage != undefined },
    get: function(propName) {
        if (!this.isAvailable) return null;
        return localStorage['lively' + propName];
    },
    set: function(propName, value) {
        if (!this.isAvailable) return null;
        return localStorage['lively' + propName] = value;
    }
}