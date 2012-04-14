// The following is heavily inspired by the Prototype JavaScript framework
/*  Prototype JavaScript framework, version 1.6.0_rc1
 *  (c) 2005-2007 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/

///////////////////////////////////////////////////////////////////////////////
// Extensions to the Object object
///////////////////////////////////////////////////////////////////////////////

// JL: patch add displayName to functions
// possible problems with Traits / Mixin Usage
Object.extend = function(destination, source) {
    for (var property in source) {
        var getter = source.__lookupGetter__(property),
            setter = source.__lookupSetter__(property);
        if (getter) destination.__defineGetter__(property, getter);
        if (setter) destination.__defineSetter__(property, setter);
        if (getter || setter) continue;
        var sourceObj = source[property];
        destination[property] = sourceObj;
        if (sourceObj instanceof Function) {
            if ((!sourceObj.name || (sourceObj.name.length == 0)) && !sourceObj.displayName) sourceObj.displayName = property;
            // remember the module that contains the class def
            if (window.lively && lively.lang && lively.lang.Namespace) sourceObj.sourceModule = lively.lang.Namespace.current();
        }
    }
    return destination;
};

Object.extend(Object, {
    inspect: function(object) {
        try {
            if (object === undefined) return 'undefined';
            if (object === null) return 'null';
            return object.inspect ? object.inspect() : object.toString();
        } catch (e) {
            if (e instanceof RangeError) return '...';
            throw e;
        }
    },

    keys: function(object) {
        var keys = [];
        for (var property in object)
        keys.push(property);
        return keys;
    },

    values: function(object) {
        var values = [];
        for (var property in object)
        values.push(object[property]);
        return values;
    },

    clone: function(object) {
        return Object.extend({}, object);
    },

    isElement: function(object) {
        return object && object.nodeType == 1;
    },

    isArray: function(object) {
        return object && object.constructor === Array;
    },

    isFunction: function(object) {
        return typeof object == "function";
    },

    isString: function(object) {
        return typeof object == "string";
    },

    isNumber: function(object) {
        return typeof object == "number";
    },

    isUndefined: function(object) {
        return typeof object == "undefined";
    },

    isRegExp: function(object) {
        return object instanceof RegExp;
    },

    inherit: function(obj) {
        var constructor = function ProtoConstructor() {
                return this
            }
        constructor.prototype = obj;
        var newInstance = new constructor();
        newInstance.constructor = constructor;
        return newInstance;
    },

    merge: function(objs) {
        // if objs are arrays just concat them
        // if objs are real objs then merge properties
        if (Object.isArray(objs[0])) // test for all?
        return Array.prototype.concat.apply([], objs)
        var result = {};
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            for (var name in obj)
            if (obj.hasOwnProperty(name)) result[name] = obj[name]
        }
        return result;
    },

    valuesInPropertyHierarchy: function(obj, name) {
        // lookup all properties named name in the proto hierarchy of obj
        // also uses Lively's class structure
        var result = [],
            lookupObj = obj;
        while (true) {
            if (lookupObj.hasOwnProperty(name)) result.push(lookupObj[name])
            var proto = Class.getPrototype(lookupObj);
            if (!proto || proto === lookupObj) proto = Class.getSuperPrototype(lookupObj);
            if (!proto) return result.reverse();
            lookupObj = proto;
        }
    },

    mergePropertyInHierarchy: function(obj, propName) {
        return this.merge(this.valuesInPropertyHierarchy(obj, propName));
    },

    protoCopy: function(obj) {
        var protoCreator = function() {
                return this
            };
        protoCreator.prototype = obj;
        var protoObj = new protoCreator();
        return protoObj;
    }
});


if (this.window && window.navigator && window.navigator.userAgent.match(/Firefox|Minefield/)) {
    // fixing the bug:	"var property is not a function" bug in Firefox
    Object.extend(Object, {
        values: function(object) {
            var values = [];
            for (var property in object)
            if (object.hasOwnProperty(property)) values.push(object[property]);
            return values;
        },
    })
};


///////////////////////////////////////////////////////////////////////////////
// Global Helper - Objects and Properties
///////////////////////////////////////////////////////////////////////////////

Objects = {
    typeStringOf: function(obj) {
        if (obj === null) {
            return "null";
        }
        if (Object.isUndefined(obj)) {
            return "undefined";
        }
        return obj.constructor.name;
    },

    shortPrintStringOf: function(obj) {
        // primitive values
        if (!this.isMutableType(obj)) {
            return this.safeToString(obj);
        }

        // constructed objects
        if (obj.constructor.name != 'Object' && !Object.isArray(obj)) {
            return obj.constructor.name;
        }

        // arrays or plain objects
        var typeString = "";

        function displayTypeAndLength(obj, collectionType, firstBracket, secondBracket) {
            if (obj.constructor.name === collectionType) {
                typeString += firstBracket;
                if (Properties.own(obj).length > 0) typeString += "...";
                typeString += secondBracket;
            }
        }
        displayTypeAndLength(obj, "Object", "{", "}");
        displayTypeAndLength(obj, "Array", "[", "]");
        return typeString;
    },

    isMutableType: function(obj) {
        var immutableTypes = ["null", "undefined", "Boolean", "Number", "String"];
        return !immutableTypes.include(this.typeStringOf(obj));
    },

    safeToString: function(obj) {
        try {
            return obj ? obj.toString() : String(obj);
        } catch (e) {
            return '<error printing object>'
        }
    }
};

Properties = {
    all: function(object, predicate) {
        var a = [];
        for (var name in object) {
            if ((object.__lookupGetter__(name) || !Object.isFunction(object[name])) && (predicate ? predicate(name, object) : true)) a.push(name);
        }
        return a;
    },

    own: function(object) {
        var a = [];
        for (var name in object) {
            if (object.hasOwnProperty(name) && (object.__lookupGetter__(name) || !Object.isFunction(object[name]))) a.push(name);
        }
        return a;
    },

    forEachOwn: function(object, func, context) {
        for (var name in object) {
            if (!object.hasOwnProperty(name)) continue;
            var value = object[name];
            if (!(value instanceof Function)) var result = func.call(context || this, name, value);
        }
    },

    nameFor: function(object, value) {
        for (var name in object)
        if (object[name] === value) return name;
        return undefined
    },

    values: function(obj) {
        var values = [];
        for (var name in obj) values.push(obj[name]);
        return values;
    },

    ownValues: function(obj) {
        var values = [];
        for (var name in obj) if (obj.hasOwnProperty(name)) values.push(obj[name]);
        return values;
    },

    printObjectSize: function(obj) {
        return Numbers.humanReadableByteSize(JSON.stringify(obj).length)
    }
};
