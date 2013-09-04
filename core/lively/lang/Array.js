///////////////////////////////////////////////////////////////////////////////
// Extensions to Array instances
///////////////////////////////////////////////////////////////////////////////

Object.extend(Array.prototype, {

    each: Array.prototype.forEach || function(iterator, context) {
        for (var i = 0, len = this.length; i < len; i++) {
            iterator.call(context, this[i], i); }
        return this;
    },

    all: Array.prototype.every || function(iterator, context) {
        var result = true;
        for (var i = 0, len = this.length; i < len; i++) {
            result = result && !! iterator.call(context || Global, this[i], i);
            if (!result) break;
        }
        return result;
    },

    any: Array.prototype.some || function(iterator, context) {
        return this.detect(iterator, context) !== undefined;
    },

    collect: Array.prototype.map || (function(iterator, context) {
        iterator = iterator ? iterator.bind(context) : Prototype.K;
        var results = [];
        this.forEach(function(value, index) {
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

    findAll: Array.prototype.filter || function(iterator, context) {
        var results = [];
        for (var i = 0; i < this.length; i++) {
            if (!this.hasOwnProperty(i)) continue;
            var value = this[i];
            if (iterator.call(context, value, i)) results.push(value);
        }
        return results;
    },
    filterByKey: function(key) {
        return this.filter(function(ea) { return !!ea[key]; });
    },

    grep: function(filter, iterator, context) {
        iterator = iterator || Functions.K;
        var results = [];
        if (Object.isString(filter)) filter = new RegExp(filter, 'i');
        this.forEach(function(value, index) {
            if (filter.test(value)) results.push(iterator.call(context, value, index));
        });
        return results;
    },

    include: (function () {
        return Array.prototype.indexOf ?
            function(object) { return this.indexOf(object) !== -1 } :
            function(object) {
                for (var i = 0, len = this.length; i < len; i++) {
                    if (this[i] == object) return true; }
                return false; }
    })(),

    inject: (function () {
        return Array.prototype.reduce ?
            function(memo, iterator, context) {
                if (context) iterator = iterator.bind(context);
                return this.reduce(iterator, memo);
            } : function(memo, iterator, context) {
                this.forEach(function(value, index) {
                    memo = iterator.call(context, memo, value, index); });
                return memo;
            }
    })(),

    invoke: function(method, arg1, arg2, arg3, arg4, arg5, arg6) {
        var result = new Array(this.length);
        for (var i = 0, len = this.length; i < len; i++) {
            result[i] = this[i][method].call(this[i], arg1, arg2, arg3, arg4, arg5, arg6);
        }
        return result;
    },

    max: function(iterator, context) {
        iterator = iterator ? iterator.bind(context) : Functions.K;
        var value, result, resultValue;
        this.forEach(function(element, index) {
            value = iterator(element, index);
            if (!result || value >= resultValue) {
                result = element;
                resultValue = value;
            }
        });
        return result;
    },

    min: function(iterator, context) {
        iterator = iterator ? iterator.bind(context) : Functions.K;
        var value, result, resultValue;
        this.forEach(function(element, index) {
            value = iterator(element, index);
            if (!result || value < resultValue) {
                result = element;
                resultValue = value;
            }
        });
        return result;
    },

    partition: function(iterator, context) {
        iterator = iterator || Functions.K;
        var trues = [], falses = [];
        this.forEach(function(value, index) {
            (iterator.call(context, index) ? trues : falses).push(value);
        });
        return [trues, falses];
    },

    pluck: function(property) {
        var result = new Array(this.length);
        for (var i = 0; i < this.length; i++) {
            result[i] = this[i][property]; }
        return result;
    },

    reject: function(func, context) {
        function iterator(val, i) { return !func.call(context, val, i); }
        return this.filter(iterator);
    },

    rejectByKey: function(key) {
        return this.filter(function(ea) { return !ea[key]; });
    },

    sortBy: function(iterator, context) {
        return this.map(function(value, index) {
            return {
                value: value,
                criteria: iterator.call(context, value, index)
            };
        }).sort(function(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
    },

    sortByKey: function(key) {
        return this.sortBy(function(ea) { return ea[key]; });
    },

    toArray: function() { return this; },

    zip: function() {
        var iterator = Functions.K,
            args = Array.from(arguments);
        if (Object.isFunction(args.last())) iterator = args.pop();
        var collections = [this].concat(args).map(Array.from);
        return this.map(function(value, index) {
            return iterator(collections.pluck(index)); });
    },

    clear: function() { this.length = 0; return this; },

    first: function() { return this[0]; },

    last: function() { return this[this.length - 1]; },

    compact: function() {
        return this.select(Functions.K);
    },

    mutableCompact: function() {
        // fix gaps that were created with 'delete'
        var i = 0, j = 0, len = this.length;
        while (i < len) {
            if (this.hasOwnProperty(i)) {
                this[j++] = this[i];
            }
            i++;
        }
        while (j++ < len) this.pop();
        return this;
    },

    flatten: function() {
        return this.inject([], function(array, value) {
            return array.concat(Object.isArray(value) ? value.flatten() : [value]);
        });
    },

    without: function() {
        var values = Array.from(arguments);
        return this.select(function(value) {
            return !values.include(value); });
    },

    withoutAll: function(otherArr) {
        return this.without.apply(this, otherArr);
    },

    uniq: function(sorted) {
        return this.inject([], function(array, value, index) {
            if (0 === index || (sorted ? array.last() != value : !array.include(value))) array.push(value);
            return array;
        });
    },

    uniqueElements: function() { return this.uniq(); },

    uniqBy: function(comparator, context) {
        // comparator(a,b) returns BOOL. True if a and be should be regarded
        // equal, false otherwise
        var result = this.clone();
        for (var i = 0; i < result.length; i++) {
            var item = this[i];
            for (var j = i+1; j < result.length; j++) {
                if (comparator.call(context, item, result[j])) {
                    result.removeAt(j); j--;
                }
            }
        }
        return result;
    },

    equals: function(otherArray) {
        if (!otherArray || this.length !== otherArray.length) return false;
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

    clone: function() { return [].concat(this); },

    size: function() { return this.length; },

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

    replaceAt: function(item, index) { this.splice(index, 1, item); },

    nestedDelay: function(iterator, waitSecs, endFunc, context, optSynchronChunks) {
        // calls iterator for every element in this and waits between iterator
        // calls waitSecs. eventually endFunc is called. When passing a number n
        // as optSynchronChunks, only every nth iteration is delayed
        endFunc = endFunc || function() {};
        return this.reverse().inject(endFunc, function(nextFunc, ea, idx) {
            return function() {
                iterator.call(context || Global, ea, idx);
                // only really delay every n'th call optionally
                if (optSynchronChunks && (idx % optSynchronChunks !== 0)) {
                    nextFunc()
                } else {
                    nextFunc.delay(waitSecs);
                }
            }
        })();
    },

    doAndContinue: function(iterator, endFunc, context) {
        // iterates over this but instead of consecutively calling iterator,
        // iterator gets passed in the invocation for the next iteration step
        // as a function as first parameter. This allows to wait arbitrarily
        // between operation steps, great for synchronous dependent steps
        endFunc = endFunc || Functions.Null;
        conext = context || Global;
        iterator = iterator || function(next, ea, idx) { ea.call(context, next, idx); };
        return this.reverse().inject(endFunc, function(nextFunc, ea, idx) {
            return function() { iterator.call(context, nextFunc, ea, idx); }
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
                        console.error(Strings.format('Error in forEachShowingProgress at %s (%s)\n%s\n%s', idx, item, e, e.stack))
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

    swap: function(index1, index2) {
        if (index1 < 0) index1 = this.length + index1;
        if (index2 < 0) index2 = this.length + index2;
        var temp = this[index1];
        this[index1] = this[index2];
        this[index2] = temp;
        return this;
    },

    rotate: function(times) {
        times = times || 1;
        return this.slice(times).concat(this.slice(0,times));
    },

    groupBy: function(iterator, context) {
        return lively.Grouping.groupArray(this, iterator, context);
    },

    groupByKey: function(key) {
        return this.groupBy(function(ea) { return ea[key]; });
    }
});

Object.extend(Array.prototype, {
    find: Array.prototype.find || Array.prototype.detect,
    select: Array.prototype.filter || Array.prototype.findAll,
    filter: Array.prototype.filter || Array.prototype.findAll,
    member: Array.prototype.include,
    map: Array.prototype.map || Array.prototype.collect,
    every: Array.prototype.every || Array.prototype.all,
    some: Array.prototype.some || Array.prototype.any,
    entries: Array.prototype.toArray
});


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
    },
    withN: function(n, obj) {
        var result = new Array(n);
        while (n > 0) result[--n] = obj;
        return result;
    },
    genN: function(n, generator) {
        var result = new Array(n);
        while (n > 0) result[--n] = generator(n);
        return result;
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Grouping
// A Grouping is created by Array>>groupBy and maps keys
// to Arrays
lively.Grouping = function Grouping(arr, hashFunc, context) {}

Object.extend(lively.Grouping, {
    groupArray: function(arr, hashFunc, context) {
        var grouping = new this();
        for (var i = 0, len = arr.length; i < len; i++) {
            var hash = hashFunc.call(context, arr[i], i);
            if (!grouping[hash]) grouping[hash] = [];
            grouping[hash].push(arr[i]);
        }
        return grouping;
    }
});

Object.extend(lively.Grouping.prototype, {
    toArray: function() {
        return this.reduceGroups(function(all, _, group) { return all.concat([group]); }, []);
    },
    forEach: function(iterator, context) {
        var groups = this;
        Object.keys(groups).forEach(function(groupName) {
            groups[groupName].forEach(iterator.curry(groupName, context));
        });
        return groups;
    },
    forEachGroup: function(iterator, context) {
        var groups = this;
        Object.keys(groups).forEach(function(groupName) {
            iterator.call(context, groupName, groups[groupName]);
        });
        return groups;
    },
    map: function(iterator, context) {
        var result = new lively.Grouping();
        this.forEachGroup(function(groupName, group) {
            result[groupName] = group.map(iterator.curry(groupName), context);
        });
        return result;
    },
    mapGroups: function(iterator, context) {
        var result = new lively.Grouping();
        this.forEachGroup(function(groupName, group) {
            result[groupName] = iterator.call(context, groupName, group);
        });
        return result;
    },
    keys: function() { return Object.keys(this); },
    reduceGroups: function(iterator, carryOver, context) {
        this.forEachGroup(function(groupName, group) {
            carryOver = iterator.call(context, carryOver, groupName, group); });
        return carryOver;
    },
    count: function() {
        return this.reduceGroups(function(groupCount, groupName, group) {
            groupCount[groupName] = group.length;
            return groupCount;
        }, {});
    }
});

///////////////////////////////////////////////////////////////////////////////
// Global Helper - Arrays
///////////////////////////////////////////////////////////////////////////////

Global.Arrays = {
    equal: function(firstArray, secondArray) {
        // deprecated, use anArray.equals
        return firstArray.equals(secondArray);
    }
}

Global.Grid = {
    create: function(rows, columns, initialObj) {
        var result = new Array(rows);
        while (rows > 0) result[--rows] = Array.withN(columns, initialObj);
        return result;
    },

    mapCreate: function(rows, cols, func, context) {
        var result = new Array(rows);
        for (var i = 0; i < rows; i++) {
            result[i] = new Array(cols);
            for (var j = 0; j < cols; j ++) {
                result[i][j] = func.call(context || this, i, j);
            }
        }
        return result;
    },

    forEach: function(grid, func, context) {
        grid.forEach(function(row, i) {
            row.forEach(function(val, j) {
                func.call(context || this, val, i, j);
            });
        })
    },

    map: function(grid, func, context) {
        var result = new Array(grid.length);
        grid.forEach(function(row, i) {
            result[i] = new Array(row.length);
            row.forEach(function(val, j) {
                result[i][j] = func.call(context || this, val, i, j);
            });
        });
        return result;
    },

    toObjects: function(grid) {
        // the first row of the grid defines the propNames
        // for each following row create a new object with those porperties
        // mapped to the cells of the row as values
        // Grid.toObjects([['a', 'b'],[1,2],[3,4]])
        //   --> [{a:1,b:2},{a:3,b:4}]
        var props = grid[0], objects = new Array(grid.length-1);
        for (var i = 1; i < grid.length; i++) {
            var obj = objects[i-1] = {};
            for (var j = 0; j < props.length; j++) obj[props[j]] = grid[i][j];
        }
        return objects;
    },

    benchmark: function() {
        var results = [], t;

        var grid = Grid.create(1000, 200, 1),
            addNum = 0;
        t  = Functions.timeToRunN(function() {
            Grid.forEach(grid, function(n) { addNum += n; }) }, 10);
        results.push(Strings.format('Grid.forEach: %ims', t));


        var mapResult;
        t  = Functions.timeToRunN(function() {
            mapResult = Grid.map(grid, function(n, i, j) { return Numbers.random(i+j); });
        }, 10);
        results.push(Strings.format('Grid.map: %ims', t));

        var mapResult2 = Grid.create(1000, 2000);
        t  = Functions.timeToRunN(function() {
            mapResult2 = new Array(1000);
            for (var i = 0; i < 1000; i++) mapResult2[i] = new Array(2000);
            Grid.forEach(grid, function(n, i, j) { mapResult2[i][j] = Numbers.random(i+j); });
        }, 10);

        results.push(Strings.format('Grid.map with forEach: %ims', t));

        results.push('--= 2012-09-22 =--\n'
                    + "Grid.forEach: 14.9ms\n"
                    + "Grid.map: 19.8ms\n"
                    + "Grid.map with forEach: 38.7ms\n")
        return results.join('\n');
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
        // -3: a < b and non-overlapping, e.g [1,2] and [3,4]
        // -2: a < b and intervals border at each other, e.g [1,3] and [3,4]
        // -1: a < b and overlapping, e.g, [1,3] and [2,4] or [1,3] and [1,4]
        //  0: a = b, e.g. [1,2] and [1,2]
        //  1: a > b and overlapping, e.g. [2,4] and [1,3]
        //  2: a > b and share border, e.g [1,4] and [0,1]
        //  3: a > b and non-overlapping, e.g [2,4] and [0,1]
        if (a[0] < b[0]) { // -3 || -2 || -1
            if (a[1] < b[0]) return -3;
            if (a[1] === b[0]) return -2;
            return -1;
        }
        if (a[0] === b[0]) { // -1 || 0 || 1
            if (a[1] === b[1]) return 0;
            return a[1] < b[1] ? -1 : 1;
        }
        // we know a[0] > b[0], 1 || 2 || 3
        return -1 * Interval.compare(b, a);
    },

    sort: function(intervals) { return intervals.sort(Interval.compare); },

    coalesce: function(interval1, interval2, optMergeCallback) {
        // turns two arrays into one iff compare(interval1, interval2) ∈ [-2, -1,0,1, 2]
        // otherwise returns null
        // optionally uses merge function
        // [1,4], [5,7] => null
        // [1,2], [1,2] => [1,2]
        // [1,4], [3,6] => [1,6]
        // [3,6], [4,5] => [3,6]
        var cmpResult = this.compare(interval1, interval2);
        switch (cmpResult) {
            case -3:
            case  3: return null;
            case  0:
                optMergeCallback && optMergeCallback(interval1, interval2, interval1);
                return interval1;
            case  2:
            case  1: var temp = interval1; interval1 = interval2; interval2 = temp; // swap
            case -2:
            case -1:
                var coalesced = [interval1[0], Math.max(interval1[1], interval2[1])];
                optMergeCallback && optMergeCallback(interval1, interval2, coalesced);
                return coalesced;
            default: throw new Error("Interval compare failed");
        }
    },

    coalesceOverlapping: function(intervals, mergeFunc) {
        // accepts an array of intervals
        // [[9,10], [1,8], [3, 7], [15, 20], [14, 21]] => [[1, 8], [9, 10], [14, 21]]
        var condensed = [], len = intervals.length;
        while (len > 0) {
            var interval = intervals.shift(); len--;
            for (var i = 0; i < len; i++) {
                var otherInterval = intervals[i],
                    coalesced = Interval.coalesce(interval, otherInterval, mergeFunc);
                if (coalesced) {
                    interval = coalesced;
                    intervals.splice(i, 1);
                    len--; i--;
                }
            }
            condensed.push(interval);
        }
        return this.sort(condensed);
    },

    mergeOverlapping: function(intervalsA, intervalsB, mergeFunc) {
        var result = [];
        while (intervalsA.length > 0) {
            var intervalA = intervalsA.shift();

            var toMerge = intervalsB.collect(function(intervalB) {
                var cmp = Interval.compare(intervalA, intervalB);
                return cmp === -1 || cmp === 0 || cmp === 1;
            });

            result.push(mergeFunc(intervalA, toMerge[0]))

            result.push(intervalA);

        }
        return result;
        // intervalsB.forEach(function(intervalB) {
        //     var overlapping = intervalsA.select(function(intervalA) {
        //         var cmp = Interval.compare(intervalA, intervalB);
        //         if (cmp == -1 || cmp == 0 || cmp == 1) {

        //         }
        //     });
        // });

        return intervalsA;

        if (!mergeFunc) return intervals;
        // return intervals.collect(function);

        var condensed = [], len = intervals.length;
        while (len > 0) {
            var interval = intervals.shift(); len--;
            for (var i = 0; i < len; i++) {
                var otherInterval = intervals[i],
                    overlap = this.compare(otherInterval, interval),
                    merged;
                if (overlap === -1 || overlap === 1 || overlap === 0) {
                    merged = mergeFunc(interval, otherInterval);
                    // remove otherInterval and add merged
                    intervals.splice(i, 1, merged);
                    len += merged.length - 1;
                    i--;
                    interval = merged[i];
                } else {
                    // condensed.push(interval);
                }
                interval = otherInterval;
            }
        }
        return this.sort(condensed);

        // // accepts an array of intervals
        // // [[9,10], [1,8], [3, 7], [15, 20], [14, 21]] => [[1, 8], [9, 10], [14, 21]]
        var merged = [], len = intervals.length,
            unshiftAll = merged.splice.bind(merged, 0, 0);
        while (len > 0) {
            var interval = intervals.pop(); len--;
            for (var i = len-1; i >= 0; i--) {
                var otherInterval = intervals[i],
                    overlap = this.compare(otherInterval, interval);
                if (overlap === -1 || overlap === 1 || overlap === 0) {
                    unshiftAll(mergeFunc(otherInterval, interval));
                } else {
                    merged.unshift(interval);
                }
                if (coalesced) {
                    interval = coalesced;
                    intervals.splice(i, 1);
                    len--; i--;
                }
            }
            condensed.push(interval);
        }
        return this.sort(condensed);
    },

    intervalsInRangeDo: function(start, end, intervals, iterator, mergeFunc, context) {
        /*
         * merges and iterates through sorted intervals. Will "fill up" intervals, example:
           Strings.print(Interval.intervalsInRangeDo(
                         2, 10, [[0, 1], [5,8], [2,4]],
                         function(i, isNew) { i.push(isNew); return i; }));
         *  => "[[2,4,false],[4,5,true],[5,8,false],[8,10,true]]"
         * this is currently used for computing text chunks in lively.morphic.TextCore
         */
        context = context || Global;
        // need to be sorted for the algorithm below
        intervals = this.sort(intervals);
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
            // special case, the newly constructed interval has length 0,
            // happens when intervals contains doubles at the start
            if (nextInterval[0] === nextInterval[1]) {
                var prevInterval;
                if (mergeFunc && (prevInterval = collected.last())) {
                    // arguments: a, b, merged, like in the callback of #merge
                    mergeFunc.call(context, prevInterval, nextInterval, prevInterval);
                }
            } else {
                collected.push(iterator.call(context, nextInterval, false));
            }
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
        var merged = Interval.coalesceOverlapping(intervals.clone());
        return this.intervalsInRangeDo(start, end, merged, function(intervall, isNew) {
            return isNew ? intervall : null
        }).select(function(ea) { return !!ea });
    },

    mapToMatchingIndexes:  function(intervals, intervalsToFind) {
        // returns an array of indexes of the items in intervals that match
        // items in intervalsToFind
        // Note: we expect intervals and intervals to be sorted according to Interval.compare!
        // This is the optimized version of:
        // return intervalsToFind.collect(function findOne(toFind) {
        //     var startIdx, endIdx;
        //     var start = intervals.detect(function(ea, i) {
        //         startIdx = i; return ea[0] === toFind[0]; });
        //     if (start === undefined) return [];
        //     var end = intervals.detect(function(ea, i) {
        //         endIdx = i; return ea[1] === toFind[1]; });
        //     if (end === undefined) return [];
        //     return Array.range(startIdx, endIdx);
        // });

        var startIntervalIndex = 0, endIntervalIndex, currentInterval;
        return intervalsToFind.collect(function(toFind) {
            while ((currentInterval = intervals[startIntervalIndex])) {
                if (currentInterval[0] < toFind[0]) { startIntervalIndex++; continue };
                break;
            }
            if (currentInterval && currentInterval[0] === toFind[0]) {
                endIntervalIndex = startIntervalIndex;
                while ((currentInterval = intervals[endIntervalIndex])) {
                    if (currentInterval[1] < toFind[1]) { endIntervalIndex++; continue };
                    break;
                }
                if (currentInterval && currentInterval[1] === toFind[1]) {
                    return Array.range(startIntervalIndex, endIntervalIndex);
                }
            }
            return [];
        });
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
            "Friday, 20. July 2012:",
            "coalesceOverlapping: 0.0003ms",
            "intervalsInbetween: 0.002ms",
            "mapToMatchingIndexes: 0.02ms",
            'vs.\n' + new Date() + ":",
            benchmarkFunc("coalesceOverlapping", [[[9,10], [1,8], [3, 7], [15, 20], [14, 21]]], 100000),
            benchmarkFunc("intervalsInbetween", [0, 10, [[8, 10], [0, 2], [3, 5]]], 100000),
            benchmarkFunc("mapToMatchingIndexes", [Array.range(0, 1000).collect(function(n) { return [n, n+1] }), [[4,8], [500,504], [900,1004]]], 1000)
        ].join('\n');
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.ArrayProjection = {

    create: function(array, length, optStartIndex) {
        var startIndex = optStartIndex || 0
        if (startIndex + length > array.length)
            startIndex -= startIndex + length - array.length;
        return {array: array, from: startIndex, to: startIndex+length}
    },

    toArray: function(projection) {
        return projection.array.slice(projection.from, projection.to);
    },

    originalToProjectedIndex: function(projection, index) {
        if (index < projection.from || index >= projection.to) return null;
        return index - projection.from;
    },

    projectedToOriginalIndex: function(projection, index) {
        if (index < 0  || index > projection.to - projection.from) return null;
        return projection.from + index;
    },

    transformToIncludeIndex: function(projection, index) {
        if (!(index in projection.array)) return null;
        var delta = 0;
        if (index < projection.from) delta = -projection.from+index;
        if (index >= projection.to) delta = index-projection.to+1;
        if (delta === 0) return projection;
        return this.create(
            projection.array,
            projection.to-projection.from,
            projection.from+delta);
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Deperectaed Global
Global.$A = Array.from;
