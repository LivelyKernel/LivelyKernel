///////////////////////////////////////////////////////////////////////////////
// Extensions to Array instances
///////////////////////////////////////////////////////////////////////////////
var $break = {};

// FIXME: Array's interface is way too big.

// FIXME: Is Enumerable used somewhere else? Can Array be extended directly?
var Enumerable = {
    each: Array.prototype.forEach || function(iterator, context) {
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
        for (var i = 0, len = this.length; i < len; i++) {
            result = result && !! iterator.call(context || Global, this[i], i);
            if (!result) break;
        }
        return result;
    },

    any: function(iterator, context) {
        return this.detect(iterator, context) !== undefined;
    },

    collect: Array.prototype.map || (function(iterator, context) {
        iterator = iterator ? iterator.bind(context) : Prototype.K;
        var results = [];
        this.each(function(value, index) {
            results.push(iterator(value, index));
        });
        return results;
    }),

    detect: function(iterator, context) {
        for (var value, i = 0, len = this.length; i < len; i++) {
            value = this[i];
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

    include: Array.prototype.indexOf ?
        function(object) { return this.indexOf(object) != -1 } :
        function(object) {
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
        if (context) iterator = iterator.bind(context);
        this.each(function(value, index) {
            memo = iterator(memo, value, index);
        });
        return memo;
    },

    invoke: function(method) {
        var args = Array.from(arguments).slice(1),
            result = new Array(this.length);
        for (var value, i = 0, len = this.length; i < len; i++) {
            value = this[i];
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
        iterator = iterator ? (context ? iterator.bind(context) : iterator) : Prototype.K;
        var trues = [],
            falses = [];
        this.each(function(value, index) {
            (iterator(value, index) ? trues : falses).push(value);
        });
        return [trues, falses];
    },

    pluck: function(property) {
        var result = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
            result[i] = this[i][property];
        }
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

    remove: function(item) {
        var index = this.indexOf(item);
        if (index >= 0) this.removeAt(index);
        return item;
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
    },

    groupBy: function(iterator, context) {
        iterator = context ? iterator.bind(context) : iterator;
        var groups = {};
        for (var i = 0, len = this.length; i < len; i++) {
            var hash = iterator(this[i], i);
            if (!groups[hash]) groups[hash] = [];
            groups[hash].push(this[i]);
        }
        return groups;
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

// Intervals are arrays whose first two elements are numbers and the
// first element should be less or equal the second element, see
// #isInterval
var Interval = {

    isInterval: function(object) {
        return Object.isArray(object) && object.length >= 2 && object[0] <= object[1];
    },

    compare: function(a, b) {
        // we assume that a[0] <= a[1] and b[0] <= b[1]
        // -2: a < b and non-overlapping, e.g [1,2] and [3,4]
        // -1: a < b and overlapping, e.g, [1,2] and [2,3]
        //  0: a = b, e.g. [1,2] and [1,2]
        //  1: a > b and overlapping, e.g. [2,4] and [1,3]
        //  2: a > b and non-overlapping, e.g [2,4] and [0,1]
        if (a[0] < b[0] && a[1] < b[0])     return -2;
        if (a[0] < b[0] && a[1] >= b[0])    return -1;
        if (a[0] === b[0] && a[1] === b[1]) return  0;
        // we know a[0] > b[0]
        if (a[0] <= b[1])                   return  1;
        return                                      2;
    },

    sort: function(intervals) { return intervals.sort(Interval.compare); },

    merge: function(interval1, interval2, optMergeCallback) {
        // [1,4], [5,7] => null
        // [1,4], [3,6] => [1,6]
        // [3,6], [4,5] => [3, 6]
        switch (this.compare(interval1, interval2)) {
            case -2:
            case  2: return null;
            case  0:
                optMergeCallback && optMergeCallback(interval1, interval2, interval1);
                return interval1;
            case  1: var temp = interval1; interval1 = interval2; interval2 = temp; // swap
            case -1:
                var merged = [interval1[0], Math.max(interval1[1], interval2[1])];
                optMergeCallback && optMergeCallback(interval1, interval2, merged);
                return merged;
            default: throw new Error("Interval compare failed");
        }
    },

    mergeOverlapping: function(intervals, mergeFunc) {
        // accepts an array of intervals
        // [[9,10], [1,8], [3, 7], [15, 20], [14, 21]] => [[1, 8], [9, 10], [14, 21]]
        var condensed = [], len = intervals.length;
        while (len > 0) {
            var interval = intervals.shift(); len--;
            for (var i = 0; i < len; i++) {
                var otherInterval = intervals[i],
                    merged = Interval.merge(interval, otherInterval, mergeFunc);
                if (merged) {
                    interval = merged;
                    intervals.splice(i, 1);
                    len--; i--;
                }
            }
            condensed.push(interval);
        }
        return this.sort(condensed);
    },

    intervalsInRangeDo: function(start, end, intervals, iterator, context) {
        /*
         * merges and iterates through sorted intervals. Will "fill up" intervals, example:
           Strings.print(Interval.intervalsInRangeDo(
                         2, 10, [[0, 1], [5,8], [2,4]],
                         function(i, isNew) { i.push(isNew); return i; }));
         *  => "[[2,4,false],[4,5,true],[5,8,false],[8,10,true]]"
         * this is currently used for computing text chunks in lively.morphic.TextCore
         */
        context = context || Global;
        intervals = this.sort(intervals); // need to be sorted for the algorithm below
        var free = [], nextInterval, collected = [];
        // merged intervals are already sorted, simply "negate" the interval array;
        while ((nextInterval = intervals.shift())) {
            if (nextInterval[1] < start) continue;
            if (nextInterval[0] < start) {
                nextInterval = nextInterval.clone();
                nextInterval[0] = start;
            };
            var nextStart = end < nextInterval[0] ? end : nextInterval[0];
            if (start < nextStart) {
                collected.push(iterator.call(context, [start, nextStart], true));
            };
            if (end < nextInterval[1]) {
                nextInterval = nextInterval.clone();
                nextInterval[1] = end;
            }
            collected.push(iterator.call(context, nextInterval, false));
            start = nextInterval[1];
            if (start >= end) break;
        }
        if (start < end) collected.push(iterator.call(context, [start, end], true));
        return collected;
    },

    intervalsInbetween: function(start, end, intervals) {
        // computes "free" intervals between the intervals given in range start - end
        // currently used for computing text chunks in lively.morphic.TextCore
        // start = 0, end = 10, intervals = [[1,4], [5,8]]
        // => [[0,1], [4, 5], [8, 10]]
        //
        var merged = Interval.mergeOverlapping(intervals.clone());
        return this.intervalsInRangeDo(start, end, merged, function(intervall, isNew) {
            return isNew ? intervall : null
        }).select(function(ea) { return !!ea });

        // var result = [], merged = Interval.mergeOverlapping(intervals.clone());
        // return this.intervalsInRangeDo(start, end, merged, function(intervall, isNew) {
        //     if (isNew) result.push(intervall);
        // }).select(function(ea) { return !!ea });
        // return result;
    },

    benchmark: function() {
        // Used for developing the code above. If you change the code, please
        // make sure that you don't worsen the performance!
        // See also lively.lang.tests.ExtensionTests.IntervallTest
        function benchmarkFunc(name, args, n) {
            return Strings.format(
                '%s: %sms',
                name,
                Functions.timeToRunN(function() { Interval[name].apply(Interval, args, 100000) }, n));
        }
        return [
            "Friday, 20. July 2012:\n mergeOverlapping: 0.00032ms\nintervalsInbetween: 0.00231ms",
            'vs.\n' + new Date() + ":",
            benchmarkFunc("mergeOverlapping", [[[9,10], [1,8], [3, 7], [15, 20], [14, 21]]], 100000),
            benchmarkFunc("intervalsInbetween", [0, 10, [[8, 10], [0, 2], [3, 5]]], 100000)
        ].join('\n');
    }
}


///////////////////////////////////////////////////////////////////////////////
// Global
///////////////////////////////////////////////////////////////////////////////

// DEPRECATED!
var $A = Array.from;