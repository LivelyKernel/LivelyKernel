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


RegExp.prototype.match = RegExp.prototype.test;