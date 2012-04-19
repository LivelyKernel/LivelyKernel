///////////////////////////////////////////////////////////////////////////////
// Extensions to Array instances
///////////////////////////////////////////////////////////////////////////////
var $break = {};

// FIXME: Array's interface is way too big.

// FIXME: Is Enumerable used somewhere else? Can Array be extended directly?
var Enumerable = {
    each: function(iterator, context) {
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

    all: function(iterator, context) {
        var result = true;
        for (var i = 0; i < this.length; i++) {
            result = result && !! iterator.call(context || Global, this[i], i);
            if (!result) break;
        }
        return result;
    },

    any: function(iterator, context) {
        return this.detect(iterator, context) !== undefined
    },

    collect: (Array.prototype.map || (function(iterator, context) {
        iterator = iterator ? iterator.bind(context) : Prototype.K;
        var results = [];
        this.each(function(value, index) {
            results.push(iterator(value, index));
        });
        return results;
    })),

    detect: function(iterator, context) {
        for (var i = 0; i < this.length; i++) {
            var value = this[i];
            if (iterator.call(context, value, i)) return value;
        }
        return undefined;
    },

    findAll: function(iterator, context) {
        var results = [];
        for (var i = 0; i < this.length; i++) {
            var value = this[i];
            if (iterator.call(context, value, i)) results.push(value);
        }
        return results;
    },

    grep: function(filter, iterator, context) {
        iterator = iterator ? iterator.bind(context) : Prototype.K;
        var results = [];

        if (Object.isString(filter)) filter = new RegExp(filter);

        this.each(function(value, index) {
            if (filter.match(value)) results.push(iterator(value, index));
        });
        return results;
    },

    include: function(object) {
        if (typeof this.indexOf == 'function') return this.indexOf(object) != -1;

        var found = false;
        this.each(function(value) {
            if (value == object) {
                found = true;
                throw $break;
            }
        });
        return found;
    },


    inject: function(memo, iterator, context) {
        iterator = iterator.bind(context);
        this.each(function(value, index) {
            memo = iterator(memo, value, index);
        });
        return memo;
    },

    invoke: function(method) {
        var args = $A(arguments).slice(1),
            result = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
            var value = this[i];
            result[i] = value[method].apply(value, args);
        }
        return result;
    },

    max: function(iterator, context) {
        iterator = iterator ? iterator.bind(context) : Prototype.K;
        var result;
        this.each(function(value, index) {
            value = iterator(value, index);
            if (result == undefined || value >= result) result = value;
        });
        return result;
    },

    min: function(iterator, context) {
        iterator = iterator ? iterator.bind(context) : Prototype.K;
        var result;
        this.each(function(value, index) {
            value = iterator(value, index);
            if (result == undefined || value < result) result = value;
        });
        return result;
    },

    partition: function(iterator, context) {
        iterator = iterator ? iterator.bind(context) : Prototype.K;
        var trues = [],
            falses = [];
        this.each(function(value, index) {
            (iterator(value, index) ? trues : falses).push(value);
        });
        return [trues, falses];
    },

    pluck: function(property) {
        var result = new Array(this.length);
        for (var i = 0; i < this.length; i++)
        result[i] = this[i][property];
        return result;
    },

    reject: function(iterator, context) {
        iterator = iterator.bind(context);
        var results = [];
        this.each(function(value, index) {
            if (!iterator(value, index)) results.push(value);
        });
        return results;
    },

    sortBy: function(iterator, context) {
        iterator = iterator.bind(context);
        return this.map(function(value, index) {
            return {
                value: value,
                criteria: iterator(value, index)
            };
        }).sort(function(left, right) {
            var a = left.criteria,
                b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
    },

    toArray: function() {
        return this.map();
    },

    zip: function() {
        var iterator = Prototype.K,
            args = $A(arguments);
        if (Object.isFunction(args.last())) iterator = args.pop();

        var collections = [this].concat(args).map($A);
        return this.map(function(value, index) {
            return iterator(collections.pluck(index));
        });
    },

    size: function() {
        return this.toArray().length;
    },

    inspect: function() {
        return '#<Enumerable:' + this.toArray().inspect() + '>';
    }
};

Object.extend(Enumerable, {
    find: Enumerable.detect,
    select: Enumerable.findAll,
    filter: Enumerable.findAll,
    member: Enumerable.include,
    entries: Enumerable.toArray
});

Object.extend(Array.prototype, Enumerable);

Object.extend(Enumerable, {
    // We add these functions after Array is extended with Enumerable
    // because JavaScript's Array already has these natively
    map: Enumerable.collect,
    every: Enumerable.all,
    some: Enumerable.any
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
            return array.concat(Object.isArray(value) ? value.flatten() : [value]);
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
            if (0 == index || (sorted ? array.last() != value : !array.include(value))) array.push(value);
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
            return array.detect(function(value) {
                return item === value
            });
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
        endFunc = endFunc ||
        function() {};
        return this.reverse().inject(endFunc, function(nextFunc, ea, idx) {
            return function() {
                iterator.call(context || Global, ea, idx);
                // only really delay every n'th call optionally
                if (optSynchronChunks && (idx % optSynchronChunks != 0)) {
                    nextFunc()
                } else {
                    nextFunc.delay(waitSecs);
                }
            }
        })();
    },

    doAndContinue: function(iterator, endFunc, context) {
        endFunc = endFunc ||
        function() {};
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

        function() {
            progressBar.setValue(1);
            if (whenDoneFunc) whenDoneFunc.call(context)
        }, function(nextFunc, item, idx) {
            return function() {
                try {
                    progressBar.setValue((steps - idx) / steps);
                    if (labelFunc) progressBar.setLabel(labelFunc.call(context, item, idx));
                    iterator.call(context, item, idx);
                } catch (e) {
                    alert(Strings.format('Error in forEachShowingProgress at %s (%s)\n%s\n%s', idx, item, e, e.stack))
                }
                nextFunc.delay(0);
            }
        }))();
    },

    sum: function() {
        var sum = 0;
        for (var i = 0; i < this.length; i++) sum += this[i];
        return sum;
    }

});

// use native browser JS 1.6 implementation if available
if (Object.isFunction(Array.prototype.forEach)) {
    Array.prototype._each = Array.prototype.forEach;
}

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


///////////////////////////////////////////////////////////////////////////////
// Extensions to the Array object
///////////////////////////////////////////////////////////////////////////////

Object.extend(Array, {
    range: function(begin, end, step) {
        step = step || 1
        var result = [];
        for (var i = begin; i <= end; i += step)
        result.push(i);
        return result;
    },
    from: function(iterable) {
        if (!iterable) return [];
        if (iterable.toArray) return iterable.toArray();
        var length = iterable.length,
            results = new Array(length);
        while (length--) results[length] = iterable[length];
        return results;
    }
});


///////////////////////////////////////////////////////////////////////////////
// Global Helper - Arrays
///////////////////////////////////////////////////////////////////////////////

var Arrays = {
    equal: function(firstArray, secondArray) {
        // deprecated, use anArray.equals
        return firstArray.equals(secondArray);
    }
}


///////////////////////////////////////////////////////////////////////////////
// Global
///////////////////////////////////////////////////////////////////////////////

// DEPRECATED!
var $A = Array.from;