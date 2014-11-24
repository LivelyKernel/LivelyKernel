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

// FM: patch do not replace existing globals
// JL: patch add displayName to functions
// possible problems with Traits / Mixin Usage
Object.extend = function(destination /* ... */) {
    var currentCategoryNames = null;
    for (var i = 1; i < arguments.length; i++) {
        if (typeof arguments[i] == "string") {
            var catName = arguments[i];
            if (!destination.categories) destination.categories = {};
            if (!destination.categories[catName]) destination.categories[catName] = [];
            currentCategoryNames = destination.categories[catName];
            continue;
        }
        var source = arguments[i];
        for (var property in source) {
            if (destination === Global && Global.hasOwnProperty(property)) {
                console.warn('Global already has a property "' + property + '". If needed, it should be set directly and explicitly, not through the use of extend()');
            }
            var getter = source.__lookupGetter__(property),
                setter = source.__lookupSetter__(property);
            if (getter) destination.__defineGetter__(property, getter);
            if (setter) destination.__defineSetter__(property, setter);
            if (getter || setter) continue;
            var sourceObj = source[property];
            destination[property] = sourceObj;
            if (currentCategoryNames) currentCategoryNames.push(property);
            if (sourceObj instanceof Function) {
                if ((!sourceObj.name || (sourceObj.name.length == 0)) && !sourceObj.displayName) sourceObj.displayName = property;
                // remember the module that contains the class def
                if (typeof lively !== 'undefined' && lively.Module && lively.Module.current)
                    sourceObj.sourceModule = lively.Module.current();
            }
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

    keys: Object.keys || function(object) {
        var keys = [];
        for (var property in object) keys.push(property);
        return keys;
    },

    values: function(object) {
        var values = [];
        for (var property in object) values.push(object[property]);
        return values;
    },

    clone: function(object) {
        var newObj;
        if (Array.isArray(object))
            newObj = object.clone();
        else {
            newObj = {};
            for (var attr in object)
                newObj[attr] = object[attr];
        }
        return newObj;
    },

    isElement: function(object) {
        return object && object.nodeType == 1;
    },

    isArray: function(object) {
        return object && Array.isArray(object);
    },

    isFunction: function(object) {
        return object instanceof Function;
    },

    isBoolean: function(object) {
        return typeof object == "boolean";
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

    isObject: function(object) {
        return typeof object == "object";
    },

    isEmpty: function(object) {
        for (var key in object)
            if (object.hasOwnProperty(key)) return false;
        return true;
    },

    inherit: function(obj) {
        var constructor = function ProtoConstructor() { return this }
        constructor.prototype = obj;
        var newInstance = new constructor();
        newInstance.constructor = constructor;
        return newInstance;
    },

    merge: function(objs) {
        // if objs are arrays just concat them
        // if objs are real objs then merge properties
        if (Object.isArray(objs[0])) { // test for all?
            return Array.prototype.concat.apply([], objs);
        }
        var result = {};
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    result[name] = obj[name];
                }
            }
        }
        return result;
    },

    valuesInPropertyHierarchy: function(obj, name) {
        // lookup all properties named name in the proto hierarchy of obj
        // also uses Lively's class structure
        var result = [], lookupObj = obj;
        while (lookupObj) {
            if (lookupObj.hasOwnProperty(name)) result.unshift(lookupObj[name])
            lookupObj = Object.getPrototypeOf(lookupObj);
        }
        return result;
    },

    mergePropertyInHierarchy: function(obj, propName) {
        return this.merge(this.valuesInPropertyHierarchy(obj, propName));
    },

    protoCopy: function(obj) {
        var protoCreator = function() { return this };
        protoCreator.prototype = obj;
        var protoObj = new protoCreator();
        return protoObj;
    },

    addScript: function (object, funcOrString, optName, optMapping) {
        var func = Function.fromString(funcOrString);
        return func.asScriptOf(object, optName, optMapping);
    },

    deepCopy: function (obj) {
        if (!obj || !Object.isObject(obj)) return obj;
        var result = Array.isArray(obj) ? Array(obj.length) : {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                result[key] = Object.deepCopy(obj[key]);
        }
        return result;
    }
});


if (this.window && window.navigator && window.navigator.userAgent.match(/Firefox|Minefield/)) {
    // fixing the bug:	"var property is not a function" bug in Firefox
    Object.extend(Object, {
        values: function(object) {
            var values = [];
            for (var property in object)
                if (object.hasOwnProperty(property))
                    values.push(object[property]);
            return values;
        }
    })
};


///////////////////////////////////////////////////////////////////////////////
// Global Helper - Objects and Properties
///////////////////////////////////////////////////////////////////////////////

Global.Objects = {

    inspect: function inspect(obj, options, depth) {
        options = options || {};
        depth = depth || 0;
        if (!obj) { return Strings.print(obj); }

        // print function
        if (typeof obj === 'function') {
            return options.printFunctionSource ? String(obj) :
                'function' + (obj.name ? ' ' + obj.name : '')
              + '(' + obj.argumentNames().join(',') + ') {/*...*/}';
        }

        // print "primitive"
        switch (obj.constructor) {
            case String:
            case Boolean:
            case RegExp:
            case Number: return Strings.print(obj);
        };

        if (typeof obj.serializeExpr === 'function') {
            return obj.serializeExpr();
        }

        var isArray = obj && Array.isArray(obj),
            openBr = isArray ? '[' : '{', closeBr = isArray ? ']' : '}';
        if (options.maxDepth && depth >= options.maxDepth) return openBr + '/*...*/' + closeBr;

        var printedProps = [];
        if (isArray) {
            printedProps = obj.map(function(ea) { return inspect(ea, options, depth); });
        } else {
            printedProps = Object.keys(obj)
               // .select(function(key) { return obj.hasOwnProperty(key); })
                .sort(function(a, b) {
                    var aIsFunc = typeof obj[a] === 'function', bIsFunc = typeof obj[b] === 'function';
                    if (aIsFunc === bIsFunc) {
                        if (a < b)  return -1;
                        if (a > b) return 1;
                        return 0;
                    };
                    return aIsFunc ? 1 : -1;
                })
                .map(function(key, i) {
                    if (isArray) inspect(obj[key], options, depth + 1);
                    var printedVal = inspect(obj[key], options, depth + 1);
                    return Strings.format('%s: %s',
                        options.escapeKeys ? Strings.print(key) : key, printedVal);
                });
        }

        if (printedProps.length === 0) { return openBr + closeBr; }

        var printedPropsJoined = printedProps.join(','),
            useNewLines = !isArray
                       && (!options.minLengthForNewLine
                        || printedPropsJoined.length >= options.minLengthForNewLine),
            indent = Strings.indent('', options.indent || '  ', depth),
            propIndent = Strings.indent('', options.indent || '  ', depth + 1),
            startBreak = useNewLines ? '\n' + propIndent: '',
            endBreak = useNewLines ? '\n' + indent : '';
        if (useNewLines) printedPropsJoined = printedProps.join(',' + startBreak);
        return openBr + startBreak + printedPropsJoined + endBreak + closeBr;
    },

    asObject: function(obj) {
        switch(typeof obj) {
            case 'string':
                return new String(obj);
            case 'boolean':
                return new Boolean(obj);
            case 'number':
                return new Number(obj);
            default:
                return obj;
        }
    },

    typeStringOf: function(obj) {
        if (obj === null) { return "null" }
        if (Object.isUndefined(obj)) { return "undefined" }
        return obj.constructor.name;
    },

    shortPrintStringOf: function(obj) {
        // primitive values
        if (!this.isMutableType(obj)) {
            return this.safeToString(obj);
        }

        // constructed objects
        if (obj.constructor.name != 'Object' && !Object.isArray(obj)) {
            if(obj.constructor.name) 
                return obj.constructor.name; 
            return Object.prototype.toString.call(obj).split(" ")[1].split("]")[0]; 
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
            return (obj ? obj.toString() : String(obj)).replace('\n','');
        } catch (e) {
            return '<error printing object>';
        }
    },

    equals: function(a, b) {
        if (!a && !b) return true;
        if (!a || !b) return false;
        switch (a.constructor) {
            case String:
            case Date:
            case Boolean:
            case Number: return a == b;
        };
        if (typeof a.isEqualNode === "function") return a.isEqualNode(b);
        if (typeof a.equals === "function") return a.equals(b);
        function cmp(left, right) {
            for (var name in left) {
                if (typeof left[name] === "function") continue;
          	    if (!Objects.equals(left[name], right[name])) return false;
            }
            return true;
        }
        return cmp(a, b) && cmp(b, a);
    }
};

Global.Properties = {
    all: function(object, predicate) {
        var a = [];
        for (var name in object) {
            if ((object.__lookupGetter__(name) || !Object.isFunction(object[name]))
              && (predicate ? predicate(name, object) : true))
              a.push(name);
        }
        return a;
    },

    allOwnPropertiesOrFunctions: function(obj, predicate) {
        var result = [];
        Object.getOwnPropertyNames(obj).forEach(function(name) {
            if (predicate ? predicate(obj, name) : true)
                result.push(name);
        });
        return result;
    },
    
    own: function(object) {
        var a = [];
        for (var name in object) {
            if (object.hasOwnProperty(name) && (object.__lookupGetter__(name)
                || !Object.isFunction(object[name])))
                a.push(name);
        }
        return a;
    },

    forEachOwn: function(object, func, context) {
        var result = [];
        for (var name in object) {
            if (!object.hasOwnProperty(name)) continue;
            var value = object[name];
            if (!Object.isFunction(value)) {
                result.push(func.call(context || this, name, value));
            }
        }
        return result;
    },

    nameFor: function(object, value) {
        for (var name in object) {
            if (object[name] === value)
                return name;
        }
        return undefined;
    },

    values: function(obj) {
        var values = [];
        for (var name in obj)
            values.push(obj[name]);
        return values;
    },

    ownValues: function(obj) {
        var values = [];
        for (var name in obj) {
            if (obj.hasOwnProperty(name))
                values.push(obj[name]);
        }
        return values;
    },

    printObjectSize: function(obj) {
        return Numbers.humanReadableByteSize(JSON.stringify(obj).length);
    },

    any: function(obj, predicate) {
        for (var name in obj) {
            if (predicate(obj, name))
                return true;
        }
        return false;
    },

    allProperties: function(obj, predicate) {
        var result = [];
        for (var name in obj) {
            if (predicate ? predicate(obj, name) : true)
                result.push(name);
        }
        return result;
    },

    hash: function(obj) {
        return Object.keys(obj).sort().join('').hashCode();
    }

};

Object.extend(lively, {
    PropertyPath: function PropertyPath(path, splitter) {
        if (path instanceof Global.lively.PropertyPath) return path;
        if (!(this instanceof Global.lively.PropertyPath)) return new Global.lively.PropertyPath(path, splitter);
        if (splitter) this.setSplitter(splitter);
        return this.fromPath(path);
    }
});

Object.extend(lively.PropertyPath, {
    superclass: Object,
    type: 'lively.PropertyPath',
    categories: {}
});

Object.extend(lively.PropertyPath.prototype, {

    isPathAccessor: true,
    splitter: '.',

    fromPath: function(path) {
        if (Object.isString(path) && path !== '' && path !== this.splitter) {
            this._parts = path.split(this.splitter);
            this._path = path;
        } else if (Object.isArray(path)) {
            this._parts = [].concat(path);
            this._path = path.join(this.splitter);
        } else {
            this._parts = [];
            this._path = '';
        }
        return this;
    },

    setSplitter: function(splitter) {
        if (splitter) this.splitter = splitter;
        return this;
    },

    parts: function() { return this._parts; },

    size: function() { return this._parts.length; },

    slice: function(n, m) { return lively.PropertyPath(this.parts().slice(n, m)); },

    normalizePath: function() {
        // FIXME: define normalization
        return this._path;
    },

    isRoot: function(obj) { return this._parts.length === 0; },

    isIn: function(obj) {
        if (this.isRoot()) return true;
        var parent = this.get(obj, -1);
        return parent && parent.hasOwnProperty(this._parts[this._parts.length-1]);
    },
    
    equals: function(obj) {
        return obj && obj.isPathAccessor && this.parts().equals(obj.parts());
    },

    isParentPathOf: function(otherPath) {
        otherPath = otherPath && otherPath.isPathAccessor ? otherPath : lively.PropertyPath(otherPath);
        var parts = this.parts(),
            otherParts = otherPath.parts();
        for(var i = 0; i < parts.length; i ++){
            if (parts[i] != otherParts[i]) return false
        }
        return true
    },

    relativePathTo: function(otherPath) {
        otherPath = lively.PropertyPath(otherPath);
        return this.isParentPathOf(otherPath) ? otherPath.slice(this.size(), otherPath.size()) : undefined;
    },

    set: function(obj, val, ensure) {
        if (this.isRoot()) return undefined;
        var parent = obj
        for (var i = 0; i < this._parts.length-1; i++) {
            var part = this._parts[i];
            if (parent.hasOwnProperty(part) && Object.isObject(parent[part]) || Object.isArray(parent[part])) {
                parent = parent[part];
            } else if (ensure) {
                parent = parent[part] = {};
            } else {
                return undefined;
            }
        }
        return parent[this._parts[this._parts.length-1]] = val;
    },

    get: function(obj, n) {
        var parts = n ? this._parts.slice(0, n) : this._parts;
        return parts.reduce(function(current, pathPart) {
            return current ? current[pathPart] : current; }, obj);
    },

    concat: function(path, splitter) {
        return lively.PropertyPath(this.parts().concat(lively.PropertyPath(path, splitter).parts()));
    },

    toString: function() { return this.normalizePath(); },

    serializeExpr: function() {
        return 'lively.PropertyPath(' + Objects.inspect(this.parts()) + ')';
    },

    watch: function(options) {
        // options: target, haltWhenChanged, uninstall, onGet, onSet, verbose
        if (!options || this.isRoot()) return;
        var target = options.target,
            parent = this.get(target, -1),
            propName = this.parts().last(),
            newPropName = 'livelyPropertyWatcher$' + propName,
            watcherIsInstalled = parent && parent.hasOwnProperty(newPropName),
            uninstall = options.uninstall,
            haltWhenChanged = options.haltWhenChanged,
            showStack = options.showStack,
            getter = parent.__lookupGetter__(propName),
            setter = parent.__lookupSetter__(propName);
        if (!target || !propName || !parent) return;
        if (uninstall) {
            if (!watcherIsInstalled) return;
            delete parent[propName];
            parent[propName] = parent[newPropName];
            delete parent[newPropName];
            var msg = Strings.format('Uninstalled watcher for %s.%s', parent, propName);
            show(msg);
            return;
        }
        if (watcherIsInstalled) {
            var msg = Strings.format('Watcher for %s.%s already installed.', parent, propName);
            show(msg);
            return;
        }
        if (getter || setter) {
            var msg = Strings.format('%s["%s"] is a getter/setter, watching not support', parent, propName);
            show(msg);
            return;
        }
        // observe slots, for debugging
        parent[newPropName] = parent[propName];
        parent.__defineSetter__(propName, function(v) {
            var oldValue = parent[newPropName];
            if (options.onSet) options.onSet(v, oldValue);
            var msg = Strings.format('%s.%s changed: %s -> %s',
                parent, propName, oldValue, v);
            if (showStack) msg += '\n' + lively.printStack();
            if (options.verbose) show(msg);
            if (haltWhenChanged) debugger;
            return parent[newPropName] = v;
        });
        parent.__defineGetter__(propName, function() {
            if (options.onGet) options.onGet(parent[newPropName]);
            return parent[newPropName];
        });
        var msg = Strings.format('Watcher for %s.%s installed', parent, propName);
        show(msg);
    },

    debugFunctionWrapper: function(options) {
        // options = {target, [haltWhenChanged, showStack, verbose, uninstall]}
        var target = options.target,
            parent = this.get(target, -1),
            funcName = this.parts().last(),
            uninstall = options.uninstall,
            haltWhenChanged = options.haltWhenChanged === undefined ? true : options.haltWhenChanged,
            showStack = options.showStack,
            func = parent && funcName && parent[funcName],
            debuggerInstalled = func && func.isDebugFunctionWrapper;
        if (!target || !funcName || !func || !parent) return;
        if (uninstall) {
            if (!debuggerInstalled) return;
            parent[funcName] = parent[funcName].debugTargetFunction;
            var msg = Strings.format('Uninstalled debugFunctionWrapper for %s.%s', parent, funcName);
            show(msg);
            return;
        }
        if (debuggerInstalled) {
            var msg = Strings.format('debugFunctionWrapper for %s.%s already installed.', parent, funcName);
            show(msg);
            return;
        }
        var debugFunc = parent[funcName] = func.wrap(function(proceed) {
            var args = Array.from(arguments);
            if (haltWhenChanged) debugger;
            if (showStack) show(lively.printStack());
            if (options.verbose) show(funcName + ' called');
            return args.shift().apply(parent, args);
        });
        debugFunc.isDebugFunctionWrapper = true;
        debugFunc.debugTargetFunction = func;
        var msg = Strings.format('debugFunctionWrapper for %s.%s installed', parent, funcName);
        show(msg);
    }

});

Object.extend(JSON, {
    prettyPrint: function(jsoOrJson, indent) {
        if (typeof jsoOrJson === 'string') jsoOrJson = JSON.parse(jsoOrJson);
        return JSON.stringify(jsoOrJson, null, typeof indent === 'string' ? indent.length : indent);
    }
});
