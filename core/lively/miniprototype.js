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

/*--------------------------------------------------------------------------*/

Object.extend(String.prototype, {

  truncate: function(length, truncation) {
    length = length || 30;
    truncation = truncation === undefined ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
  },

  strip: function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  },

  toQueryParams: function(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    return match[1].split(separator || '&').inject({ }, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
      return hash;
    });
  },

  toArray: function() {
    return this.split('');
  },

  succ: function() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  },

  times: function(count) {
    return count < 1 ? '' : new Array(count + 1).join(this);
  },

  camelize: function() {
    var parts = this.split('-'), len = parts.length;
    if (len == 1) return parts[0];

    var camelized = this.charAt(0) == '-'
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];

    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

    return camelized;
  },

  capitalize: function() {
    if(this.length <1)
        return this;
    return this.charAt(0).toUpperCase() + this.slice(1);// + this.substring(1).toLowerCase();
  },

  include: function(pattern) {
    return this.indexOf(pattern) > -1;
  },

  startsWith: function(pattern) {
    return this.indexOf(pattern) === 0;
  },

  endsWith: function(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.lastIndexOf(pattern) === d;
  },

  empty: function() {
    return this == '';
  },

  blank: function() {
    return /^\s*$/.test(this);
  }

});

var $break = { };

var Enumerable = {
  each: function each(iterator, context) {
    var index = 0;
    iterator = iterator.bind(context);
    try {
      this._each(function(value) {
        iterator(value, index++);
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  },

  all: function all(iterator, context) {
    var result = true;
    for (var i = 0; i < this.length; i++) {
        result = result && !!iterator.call(context || Global, this[i], i);
        if (!result) break;
    }
    return result;
  },

  any: function any(iterator, context) {
    return this.detect(iterator, context) !== undefined
  },

  collect: (Array.prototype.map || (function collect(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var results = [];
    this.each(function(value, index) {
      results.push(iterator(value, index));
    });
    return results;
  })),

  detect: function detect(iterator, context) {
	for (var i = 0; i < this.length; i++) {
		var value = this[i];
		if (iterator.call(context, value, i))
			return value;
	}
  },

  findAll: function findAll(iterator, context) {
    var results = [];
    for (var i = 0; i < this.length; i++) {
        var value = this[i];
        if (iterator.call(context, value, i))
            results.push(value);        
    }
    return results;
  },

  grep: function grep(filter, iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var results = [];

    if (Object.isString(filter))
      filter = new RegExp(filter);

    this.each(function(value, index) {
      if (filter.match(value))
        results.push(iterator(value, index));
    });
    return results;
  },

  include: function include(object) {
    if (typeof this.indexOf == 'function')
      return this.indexOf(object) != -1;

    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  },


  inject: function inject(memo, iterator, context) {
      iterator = iterator.bind(context);
    this.each(function(value, index) {
      memo = iterator(memo, value, index);
    });
    return memo;
  },

	invoke: function invoke(method) {
		var args = $A(arguments).slice(1), result = new Array(this.length);
		for (var i = 0; i < this.length; i++) {
			var value = this[i];
			result[i] = value[method].apply(value, args);
		}
		return result;
	},

  max: function max(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator(value, index);
      if (result == undefined || value >= result)
        result = value;
    });
    return result;
  },

  min: function min(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var result;
    this.each(function(value, index) {
      value = iterator(value, index);
      if (result == undefined || value < result)
        result = value;
    });
    return result;
  },

  partition: function partition(iterator, context) {
    iterator = iterator ? iterator.bind(context) : Prototype.K;
    var trues = [], falses = [];
    this.each(function(value, index) {
      (iterator(value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  },

    pluck: function pluck(property) {
        var result = new Array(this.length);
        for (var i = 0; i < this.length; i++)
            result[i] = this[i][property];
        return result;
    },

  reject: function reject(iterator, context) {
    iterator = iterator.bind(context);
    var results = [];
    this.each(function(value, index) {
      if (!iterator(value, index))
        results.push(value);
    });
    return results;
  },

  sortBy: function sortBy(iterator, context) {
    iterator = iterator.bind(context);
    return this.map(function(value, index) {
      return {value: value, criteria: iterator(value, index)};
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  },

  toArray: function toArray() {
    return this.map();
  },

  zip: function zip() {
    var iterator = Prototype.K, args = $A(arguments);
    if (Object.isFunction(args.last()))
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  },

  size: function size() {
    return this.toArray().length;
  },

  inspect: function inspect() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }
};

Object.extend(Enumerable, {
  find:    Enumerable.detect,
  select:  Enumerable.findAll,
  filter:  Enumerable.findAll,
  member:  Enumerable.include,
  entries: Enumerable.toArray,

});

function $A(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  var length = iterable.length, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}

Array.from = $A;

Object.extend(Array.prototype, Enumerable);

Object.extend(Enumerable, { 
    // Lively:  we add these functions after Array is extended with Enumerable, b/c JS Arrays already have these natively
    map:     Enumerable.collect, 
    every:   Enumerable.all, 
    some:    Enumerable.any 
});


if (!Array.prototype._reverse) Array.prototype._reverse = Array.prototype.reverse;

Object.extend(Array.prototype, {
  _each: function(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  },

  clear: function() {
    this.length = 0;
    return this;
  },

  first: function() {
    return this[0];
  },

  last: function() {
    return this[this.length - 1];
  },

  compact: function() {
    return this.select(function(value) {
      return value != null;
    });
  },

  flatten: function() {
    return this.inject([], function(array, value) {
      return array.concat(Object.isArray(value) ?
        value.flatten() : [value]);
    });
  },

  without: function() {
    var values = $A(arguments);
    return this.select(function(value) {
      return !values.include(value);
    });
  },
  withoutAll: function(otherArr) {
	return this.without.apply(this, otherArr);
  },

  reverse: function(inline) {
    return (inline !== false ? this : this.toArray())._reverse();
  },

  uniq: function(sorted) {
    return this.inject([], function(array, value, index) {
      if (0 == index || (sorted ? array.last() != value : !array.include(value)))
        array.push(value);
      return array;
    });
  },

  uniqueElements: function() {
      return this.uniq();
  },
  
  equals: function(otherArray) {
    if (this.length != otherArray.length) return false;
    for (var i = 0; i < otherArray.length; i++) {
        if (this[i].equals && otherArray[i].equals) { 
            if (!this[i].equals(otherArray[i])) {
                return false; 
            } else {
                continue;
            }
        }
        if (this[i] != otherArray[i]) return false;
    }
    return true;
  },

  intersect: function(array) {
    return this.uniq().findAll(function(item) {
      return array.detect(function(value) { return item === value });
    });
  },

  clone: function() {
    return [].concat(this);
  },

  size: function() {
    return this.length;
  },

  inspect: function() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  },

  pushAt: function(item, index) {
    this.splice(index, 0, item);
  },
  removeAt: function(index) {
    this.splice(index, 1);
  },

	pushAll: function(items) {
		for (var i = 0; i < items.length; i++)
			this.push(items[i]);
		return this;
	},
	pushAllAt: function(items, idx) {
            this.splice.apply(this, [idx, 0].concat(items))
	},


    pushIfNotIncluded: function(item) {
      if (!this.include(item)) this.push(item);
    },
    replaceAt: function(item, index) {
          this.splice(index, 1, item);
    },


	nestedDelay: function(iterator, waitSecs, endFunc, context, optSynchronChunks) {
		endFunc = endFunc || function() {};
		return this.reverse().inject(endFunc, function(nextFunc, ea, idx) {
			return function() {
				iterator.call(context || Global, ea, idx);
				// only really delay every n'th call optionally
				if (optSynchronChunks && (idx % optSynchronChunks  != 0)) {
					nextFunc()
				} else {
					nextFunc.delay(waitSecs);
				}
			}
		})();
	},
	doAndContinue: function(iterator, endFunc, context) {
		endFunc = endFunc || function() {};
		return this.reverse().inject(endFunc, function(nextFunc, ea, idx) {
			return function() {
				iterator.call(context || Global, nextFunc, ea, idx);
			}
		})();
	},
	forEachShowingProgress: function(progressBar, iterator, labelFunc, whenDoneFunc, context) {
		progressBar.setValue(0);
		var steps = this.length;
		context = context || Global;
		(this.reverse().inject(
			function() { progressBar.setValue(1); if (whenDoneFunc) whenDoneFunc.call(context) },
			function(nextFunc, item, idx) {
				return function() {
					try {
						progressBar.setValue((steps-idx) / steps);
						if (labelFunc)
							progressBar.setLabel(labelFunc.call(context, item, idx));
						iterator.call(context, item, idx);
					} catch(e) {
						alert(Strings.format('Error in forEachShowingProgress at %s (%s)\n%s\n%s',
							idx, item, e, e.stack))
					}
					nextFunc.delay(0);
				}
			}
		))();
	},
    sum: function() {
        var sum = 0;
        for (var i=0; i < this.length; i++) sum+=this[i];
        return sum;
    },

});
Object.extend(Array, {
	range: function(begin, end, step) {
		step = step || 1
		var result = [];
		for (var i = begin; i <= end; i += step)
			result.push(i);
		return result;
	},
});

// use native browser JS 1.6 implementation if available
if (Object.isFunction(Array.prototype.forEach))
  Array.prototype._each = Array.prototype.forEach;

if (!Array.prototype.indexOf) Array.prototype.indexOf = function(item, i) {
  i || (i = 0);
  var length = this.length;
  if (i < 0) i = length + i;
  for (; i < length; i++)
    if (this[i] === item) return i;
  return -1;
};

if (!Array.prototype.lastIndexOf) Array.prototype.lastIndexOf = function(item, i) {
  i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
  var n = this.slice(0, i).reverse().indexOf(item);
  return (n < 0) ? n : i - n - 1;
};

Array.prototype.toArray = Array.prototype.clone;

