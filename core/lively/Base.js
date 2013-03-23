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

        var args = Array.from(arguments),
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
            if (Global.lively && lively.Module && lively.Module.current)
                klass.sourceModule = lively.Module.current();
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
        for (i = 0; i < traits.length; i++) {
            traits[i].applyTo(this);
        }
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
                if (Global.lively && lively.Module && lively.Module.current)
                    value.sourceModule = lively.Module.current();

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
        for (var categoryName in this.categories) {
            if (this.categories[categoryName].include(propName)) {
                return categoryName;
            }
        }
        return null;
    },

    remove: function() {
        var ownerNamespace = Class.namespaceFor(this.type),
            ownName = Class.unqualifiedNameFor(this.type);
        delete ownerNamespace[ownName];
    }

});

Global.Class = {

    anonymousCounter: 0,

    initializerTemplate: (function CLASS(){ Class.initializer.apply(this, arguments) }).toString(),

    newInitializer: function(name) {
        // this hack ensures that class instances have a name
        return eval(Class.initializerTemplate.replace(/CLASS/g, name) + ";" + name);
    },

    initializer: function initializer() {
        var firstArg = arguments[0];
        if (firstArg && firstArg.isInstanceRestorer) {
            // for deserializing instances just do nothing
        } else {
            // automatically call the initialize method
            this.initialize.apply(this, arguments);
        }
    },

    isValidIdentifier: function(str) {
        return /^(?:[a-zA-Z_][\w\-]*[.])*[a-zA-Z_][\w\-]*$/.test(str);
    },

    isClass: function Class$isClass(object) {
        if (object === Object
          || object === Array
          || object === Function
          || object === String
          || object === Number) {
            return true;
        }
        return (object instanceof Function) && (object.superclass !== undefined);
    },

    className: function Class$className(cl) {
        if (cl === Object) return "Object"
        if (cl === Array) return "Array"
        if (cl === Function) return "Function"
        if (cl === String) return "String"
        if (cl === Number) return "Number"
        return cl.type;
    },

    forName: function forName(name) {
        // lookup the class object given the qualified name
        var ns = Class.namespaceFor(name),
            shortName = Class.unqualifiedNameFor(name);
        return ns[shortName];
    },

    deleteObjectNamed: function Class$deleteObjectNamed(name) {
        var ns = Class.namespaceFor(name),
            shortName = Class.unqualifiedNameFor(name);
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
        var lastDot = className ? className.lastIndexOf('.') : -1;
        if (lastDot < 0) return Global;
        else return lively.module(className.substring(0, lastDot));
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
    }

};

(function setupjQuery(Global) {
    var lively = Global.lively,
        jQuery = Global.jQuery;
    // we still are adding jQuery to Global but this is DEPRECATED
    // We need to be able to run with libraries requiring different jQuery versions
    // so we will restrict "our" to lively.$ in the future
    Global.$ = lively.$ = jQuery.noConflict(/*true -- really removes $*/);
})(Global);

Object.extend(Global, {
    dbgOn: function dbgOn(cond, optMessage) {
        if (optMessage) console.log(optMessage);
        if (cond) debugger; // note that rhino has issues with this keyword
        // also call as: throw dbgOn(new Error(....))
        return cond;
    },

    assert: function assert(value, message) {
        if (value) { return; }
        // capture the stack
        var stack;
        try { throw new Error() } catch(e) { stack = e.stack || '' };
        alert('Assertion failed' + (message ? ': ' + message : '!') + '\n' + stack);
    }
});
