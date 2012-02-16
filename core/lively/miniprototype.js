/*  Prototype JavaScript framework, version 1.6.0_rc1
 *  (c) 2005-2007 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://www.prototypejs.org/
 *
 *--------------------------------------------------------------------------*/
// Note this version is heavily trimmed from its original form.

var Prototype = {
  Version: '1.6.0_rc1_LK_Mini',
  K: function(x) { return x }
};

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
            if ((!sourceObj.name || (sourceObj.name.length == 0)) &&
		!sourceObj.displayName)
			sourceObj.displayName = property;
            // remember the module that contains the class def
            if (window.lively && lively.lang && lively.lang.Namespace)
                 sourceObj.sourceModule = lively.lang.Namespace.current();
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
    return Object.extend({ }, object);
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
  },
})
};

Object.extend(Function.prototype, {
  argumentNames: function() {
    //var names = this.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(",").invoke("strip");
      var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');

    return names.length == 1 && !names[0] ? [] : names;
  },

	curry: function curry() {
		if (!arguments.length) return this;
		var __method = this, args = $A(arguments),
			wrappedFunc = function curried() {
				return __method.apply(this, args.concat($A(arguments)));
			}
		wrappedFunc.isWrapper = true;
		wrappedFunc.originalFunction = __method;
		return wrappedFunc;
	},

  delay: function delay() {
    var __method = this, args = $A(arguments), timeout = args.shift() * 1000;
    return window.setTimeout(function delayed() {
      return __method.apply(__method, args);
    }, timeout);
  },

  wrap: function wrap(wrapper) {
    var __method = this;
    var wrappedFunc = function wrapped() {
      var wrapperArgs = wrapper.isWrapper ? $A(arguments) : [__method.bind(this)].concat($A(arguments));
      return wrapper.apply(this, wrapperArgs);
    }
	wrappedFunc.isWrapper = true;
	wrappedFunc.originalFunction = __method;
	return wrappedFunc;
  }

});


RegExp.prototype.match = RegExp.prototype.test;