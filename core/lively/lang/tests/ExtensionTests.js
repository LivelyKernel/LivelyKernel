module('lively.lang.tests.ExtensionTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.lang.tests.ExtensionTests.ObjectTest',
'testing', {
    testExtendSetsDisplayName: function() {
        var obj = {};
        Object.extend(obj, {foo: function() {return "bar"}})
        this.assertEquals(obj.foo.displayName, "foo")
    },

    testExtendDoesNotOverrideExistingName: function() {
        var obj = {};
        Object.extend(obj, {foo: function myFoo() {return "bar"}})
        this.assertEquals(obj.foo.name, "myFoo", "name changed")
        this.assert(!obj.foo.displayName, "displayName is set")
    },

    testExtendDoesNotOverrideExistingDisplayName: function() {
        var obj = {};
        var f = function() {return "bar"};
        f.displayName = "myDisplayFoo"
        Object.extend(obj, {foo: f})
        this.assertEquals(obj.foo.name, "", "function has a name")
        this.assertEquals(obj.foo.displayName, "myDisplayFoo", "displayName was overridden")
    },

    testExtendDoesSourceModule: function() {
        var obj = {};
        var f = function() {return "bar"};
        f.displayName = "myDisplayFoo"
        Object.extend(obj, {foo: f})
        this.assert(obj.foo.sourceModule, "source module not set")
    },
    testIsEmpty: function() {
        var obj1 = {}, obj2 = {a:3}, obj3 = Object.create(obj2);
        this.assertEquals(Object.isEmpty(obj1), true);
        this.assertEquals(Object.isEmpty(obj2), false);
        this.assertEquals(Object.isEmpty(obj3), true);
    },
    testDeepCopy: function() {
        var obj = {a: 3, b: {c: [{}],d: undefined}, e: null, f: function(){}, g: "string"};
        var copy = Object.deepCopy(obj);
        this.assertMatches(obj, copy);
        this.assertMatches(copy, obj);
        this.assert(obj !== copy);
        this.assert(obj.b !== copy.b);
        this.assert(obj.b.c !== copy.b.c);
        this.assert(obj.b.c[0] !== copy.b.c[0]);
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.ObjectsTest',
'testing', {
    testTypeStringOf: function() {
        this.assertEquals(Objects.typeStringOf('some string'), 'String');
        this.assertEquals(Objects.typeStringOf(0), 'Number');
        this.assertEquals(Objects.typeStringOf(null), 'null');
        this.assertEquals(Objects.typeStringOf(undefined), 'undefined');
        this.assertEquals(Objects.typeStringOf([]), 'Array');
        this.assertEquals(Objects.typeStringOf({a: 2}), 'Object');
        this.assertEquals(Objects.typeStringOf(new lively.morphic.Morph()), 'Morph');
    },
    testShortPrintStringOf: function() {
        this.assertEquals(Objects.shortPrintStringOf([1,2]), '[...]', 'filled arrays should be displayed as [...]');
        this.assertEquals(Objects.shortPrintStringOf([]), '[]', 'empty arrays should be displayed as []');
        this.assertEquals(Objects.shortPrintStringOf(0), '0', 'numbers should be displayed as values');
        this.assertEquals(Objects.shortPrintStringOf(new lively.morphic.Morph()), 'Morph', 'short typestring of a morph is still Morph');
    },
    testIsMutableType: function() {
        this.assert(Objects.isMutableType([1,2]), 'arrays are mutable');
        this.assert(Objects.isMutableType({}), 'empty objects are mutable');
        this.assert(Objects.isMutableType(new lively.morphic.Morph()), 'complex objects are mutable');
        this.assert(!Objects.isMutableType(2), 'numbers are immutable');
    },
    testSafeToString: function() {
        this.assertEquals(Objects.safeToString(null), 'null');
        this.assertEquals(Objects.safeToString(undefined), 'undefined');
        this.assertEquals(Objects.safeToString(2), '2');
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.PropertiesTest',
'running', {
    setUp: function() {
        var Foo = function() {
            this.a = 1;
            this.aa = 1;
            this.b = Functions.True;
        };
        Foo.prototype.c = 2;
        Foo.prototype.cc = 2;
        Foo.prototype.d = Functions.False;
        this.sut = new Foo();
    }
},
'testing', {
    testAll: function() {
        var expected, result;
        expected = ["a", "c"];
        result = Properties.all(this.sut, function (name, object) {
            return name.length == 1;
        });
        this.assertMatches(expected, result);
        expected = ["aa", "cc"];
        result = Properties.all(this.sut, function (name, object) {
            return name.length == 2;
        });
        this.assertMatches(expected, result);
    },
    testOwn: function() {
        var expected = ["a", "aa"];
        var result = Properties.own(this.sut);
        this.assertMatches(expected, result);
    },
    testAllProperties: function() {
        var expected, result;
        expected = ["a", "b", "c", "d"];
        result = Properties.allProperties(this.sut, function (object, name) {
            return name.length == 1;
        });
        this.assertMatches(expected, result);
        expected = ["aa", "cc"];
        result = Properties.allProperties(this.sut, function (object, name) {
            return name.length == 2;
        });
        this.assertMatches(expected, result);
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.PropertyPath',
// todo:
// - listen? wrap? watch?
'testing', {
    testParsePath: function() {
        this.assertEquals([], lively.PropertyPath(undefined).parts());
        this.assertEquals([], lively.PropertyPath('').parts());
        this.assertEquals([], lively.PropertyPath('.').parts());
        this.assertEquals(['foo'], lively.PropertyPath('foo').parts());
        this.assertEquals(['foo', 'bar'], lively.PropertyPath('foo.bar').parts());
    },
    testPathAccesor: function() {
        var obj = {foo: {bar: 42}, baz: {zork: {'x y z z y': 23}}};
        this.assertEquals(obj, lively.PropertyPath('').get(obj));
        this.assertEquals(42, lively.PropertyPath('foo.bar').get(obj));
        this.assertEquals(obj.baz.zork, lively.PropertyPath('baz.zork').get(obj));
        this.assertEquals(23, lively.PropertyPath('baz.zork.x y z z y').get(obj));
        this.assertEquals(undefined, lively.PropertyPath('non.ex.is.tan.t').get(obj));
    },
    testPathIncludes: function() {
        var base = lively.PropertyPath('foo.bar');
        this.assert(base.isParentPathOf('foo.bar'), 'equal paths should be "parents"');
        this.assert(base.isParentPathOf(base), 'equal paths should be "parents" 2');
        this.assert(base.isParentPathOf('foo.bar.baz'), 'foo.bar.baz');
        this.assert(!base.isParentPathOf('foo.baz'), 'foo.baz');
        this.assert(!base.isParentPathOf('.'), '.');
        this.assert(!base.isParentPathOf(''), 'empty string');
        this.assert(!base.isParentPathOf(), 'undefined');
    },
    testRelativePath: function() {
        var base = lively.PropertyPath('foo.bar');
        this.assertEquals([], base.relativePathTo('foo.bar').parts(), 'foo.bar');
        this.assertEquals(['baz', 'zork'], base.relativePathTo('foo.bar.baz.zork').parts(), 'foo.bar.baz.zork');
    },
    testConcat: function() {
        var p1 = lively.PropertyPath('foo.bar'),
            p2 = lively.PropertyPath('baz.zork');
        this.assertEquals('baz.zork.foo.bar', p2.concat(p1));
        this.assertEquals('foo.bar.baz.zork', p1.concat(p2));
    },
    testSet: function() {
        var obj = {foo:[{},{bar:{}}]}, p = lively.PropertyPath('foo.1.bar.baz');
        p.set(obj, 3);
        this.assertEquals(3, obj.foo[1].bar.baz);
    },
    testEnsure: function() {
        var obj = {}, p = lively.PropertyPath('foo.bar.baz');
        p.set(obj, 3, true);
        this.assertEquals(3, obj.foo.bar.baz);
    },
    testSplitter: function() {
        var obj = {}, p = lively.PropertyPath('foo/bar/baz', '/');
        p.set(obj, 3, true);
        this.assertEquals(3, obj.foo.bar.baz);
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.IntervalTest', {

    testIsInterval: function() {
        this.assert(Interval.isInterval([1,2]));
        this.assert(Interval.isInterval([1,2,'some addition']));
        this.assert(Interval.isInterval([1,1]));
        this.assert(!Interval.isInterval([1,0]));
    },

    testCompareInterval: function() {
        var inputAndExpected = [
            [1,2], [3,4], -3,
            // less and at border
            [1,2], [2,3], -2,
            // less and overlapping
            [1,3], [2,4], -1,
            [1,5], [2,4], -1,
            [1,5], [2,4], -1,
            [1,5], [1,6], -1,
            // // equal
            [1,1], [1,1], 0,
            // // greater and pverlapping
            [2,4], [1,3], 1,
            // // greater and at border
            [3,4], [1,3], 2,
            // // greater and non-overlapping
            [2,4], [0,1], 3];

        for (var i = 0; i < inputAndExpected.length; i += 3) {
            var expected = inputAndExpected[i+2],
                a = inputAndExpected[i+0],
                b = inputAndExpected[i+1];
            this.assertEquals(
                expected, Interval.compare(a, b),
                expected + ' not result of cmp ' + a + ' vs ' + b);
        }

        // // less and non-overlapping
        // this.assertEquals(-2, Interval.compare([1,2], [3,4]), '< n-o');
        // // less and overlapping
        // this.assertEquals(-1, Interval.compare([1,2], [2,3]), '< o');
        // this.assertEquals(-1, Interval.compare([1,3], [2,4]), '< o');
        // this.assertEquals(-1, Interval.compare([1,5], [2,4]), '< o');
        // this.assertEquals(-1, Interval.compare([1,5], [2,4]), '< o');
        // this.assertEquals(-1, Interval.compare([1,5], [1,6]), '< o');
        // // // equal
        // this.assertEquals(0, Interval.compare([1,1], [1,1]), '=');
        // // // greater and overlapping
        // this.assertEquals(1, Interval.compare([3,4], [1,3]), '> o');
        // this.assertEquals(1, Interval.compare([2,4], [1,3]), '> o');
        // // // greater and non-overlapping
        // this.assertEquals(2, Interval.compare([2,4], [0,1]), '> n-o');

    },

    testSortIntervals: function() {
        this.assertEqualState([], Interval.sort([]));
        this.assertEqualState([[1,2], [2,3]], Interval.sort([[1, 2], [2, 3]]));
        this.assertEqualState([[1,2], [1,3]], Interval.sort([[1, 3], [1, 2]]));
        this.assertEqualState(
            [[1,2], [4,6], [5,9]],
            Interval.sort([[4,6], [1,2], [5,9]]));
    },

    testCoalesceTwoOverlappingIntervals: function() {
        this.assertEqualState(null, Interval.coalesce([1,4], [5,7]));
        this.assertEqualState([1, 5], Interval.coalesce([1,3], [2, 5]));
        this.assertEqualState([1, 5], Interval.coalesce([3, 5], [1,3]));
        // this.assertEqualState([1, 5], Interval.coalesce([1, 5], [2,3]));
        // this.assertEqualState([3,6], Interval.coalesce([3,6], [4,5]));

        // var callbackArgs;
        // Interval.coalesce([3,6], [4,5], function() { callbackArgs = Array.from(arguments); })
        // this.assertEqualState([[3,6], [4,5], [3,6]], callbackArgs, 'callback');
    },

    testCoalesceOverlappingIntervalsTest: function() {
        this.assertEqualState([], Interval.coalesceOverlapping([]));
        this.assertEqualState([[1, 5]], Interval.coalesceOverlapping([[1,3], [2, 4], [2, 5]]));
        this.assertEqualState(
            [[1, 3], [5, 10]],
            Interval.coalesceOverlapping([[1,3], [5,9 ], [6, 10]]));
        this.assertEqualState(
            [[1, 8], [9, 10], [14, 21]],
            Interval.coalesceOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]]));

        // with merge func
        var result = Interval.coalesceOverlapping(
            [[3,5, 'b'], [1,4, 'a'], [8, 10, 'c']],
            function(a, b, merged) { merged.push(a[2] + b[2]) });
        this.assertEqualState([[1,5, 'ab'], [8, 10, 'c']], result);
    },

    testCoalesceIdenticalIntervalsTest: function() {
        this.assertEqualState([[1,3]], Interval.coalesceOverlapping([[1,3], [1, 3]]));
    },

    testFindFreeIntervalsInbetween: function() {
        this.assertEqualState([[0,10]], Interval.intervalsInbetween(0, 10, []));
        this.assertEqualState([[5,10]], Interval.intervalsInbetween(0, 10, [[0, 5]]));
        this.assertEqualState([[0,3], [5,10]], Interval.intervalsInbetween(0, 10, [[3, 5]]));
        this.assertEqualState([[1,3], [5,8]], Interval.intervalsInbetween(0, 10, [[0, 1], [3, 5], [8, 10]]));
        this.assertEqualState([[5,8]], Interval.intervalsInbetween(0, 10, [[0, 1], [1, 5], [8, 10]]));
        this.assertEqualState([[0,5]], Interval.intervalsInbetween(0, 5, [[8, 10]]));
        this.assertEqualState([[0,3]], Interval.intervalsInbetween(0, 5, [[3, 10]]));
        this.assertEqualState([], Interval.intervalsInbetween(0, 5, [[0, 6]]));
    },

    testWithIntervalsInRangeDo: function() {
        this.assertEqualState(
            [[0,2, false], [2,3, true], [3,5, false], [5,8, true], [8,10, false]],
            Interval.intervalsInRangeDo(
                0, 10, [[8, 10], [0, 2], [3, 5]],
                function(interval, isNew) { interval.push(isNew); return interval; }));

        this.assertEqualState(
            [[0,3, true], [3,5, 'x', false]],
            Interval.intervalsInRangeDo(
                0, 5, [[3, 6, 'x'], [6, 20, 'y']],
                function(interval, isNew) { interval.push(isNew); return interval; }),
            "slice interval in back");

        this.assertEqualState(
            [[1,2, 'x', false], [2,5, true]],
            Interval.intervalsInRangeDo(
                1, 5, [[-4,0, 'y'], [0, 2, 'x']],
                function(interval, isNew) { interval.push(isNew); return interval; }),
            "slice interval in front");

        this.assertEqualState(
            [[0,1, 'ab'], [1,2, 'c']],
            Interval.intervalsInRangeDo(
                0, 2, [[0,1, 'a'], [0,1, 'b'], [1,2, 'c']],
                function(interval, isNew) { return interval; },
                function(a, b, merged) { merged[2] = a[2] + b[2] }),
            "identical intervals not merged");
    },

    testFindMatchingIntervalsDo: function() {
        var existingIntervals = [[1,4], [4,5], [5,8], [9,20]];
        var test = this, testTable = [
            {expected: [[0]],               input: [[1,4]]},
            {expected: [[0], [0]],          input: [[1,4], [1,4]]},
            {expected: [[]],                input: [[2,4]]},
            {expected: [[]],                input: [[4,6]]},
            {expected: [[1,2], [2,3], []],  input: [[4,8], [5,20], [10,20]]}
        ]

        testTable.forEach(function(ea) {
            test.assertEqualState(
                ea.expected,
                Interval.mapToMatchingIndexes(existingIntervals, ea.input),
                'On input: ' + Strings.print(ea.input));
        });
    },

    testMergeOverlappingIntervals: function() {
        return; // WIP
        var inputsAndExpected = [
            {a: [[1,6, 'a'], [7,9, 'b']],
             b: [],
             expected: [[1,6, 'a'], [7,9, 'b']]},
            {a: [[1,6, 'a'], [6,9, 'b']],
             b: [[1,3, 'c']],
             expected: [[1,3, 'ac'], [3,6, 'a'], [7,9, 'b']]},
            // {a: [[1,3, 'a'], [6,9, 'b']],
            //  b: [[1,6, 'c']],
            //  expected: [[1,3, 'ac'], [3,6, 'c'], [6,9, 'b']]},
            // {a: [[1,3, 'a'], [3,8, 'b']],
            // b: [[1,6, 'c']],
            //  expected: [[1,3, 'ac'], [3,8, 'bc'], [6,8, 'b']]},
            // {a: [[1,3, 'a'], [3,4, 'b']],
            //  b: [[1,2, 'c'], [1,5, 'd']],
            //  expected: [[1,2, 'acd'], [2,3, 'ad'], [3,4, 'bd'], [4,5, 'd']]}
        ];

        function merge(a,b) {
            return [Math.min(a[0], b[0]), Math.max(a[1], b[1]), a[2] + b[2]]
        }
        for (var i = 0; i < inputsAndExpected.length; i++) {
            var expected = inputsAndExpected[i].expected,
                a = inputsAndExpected[i].a,
                b = inputsAndExpected[i].b;
            this.assertEqualState(
                expected, Interval.mergeOverlapping(a, b, merge),
                expected + ' not result of merge ' + a + ' vs ' + b);
        }


        // nothing happens without a merge func
        // this.assertEqualState([], Interval.mergeOverlapping([]));
        // this.assertEqualState([[1,2, 'a'], [1,2, 'b']],
        //                       Interval.mergeOverlapping([[1,2, 'a'], [1,2, 'b']]));

        // this.assertEqualState(
        //     [[1,2, 'ab']],
        //     Interval.mergeOverlapping(
        //         [[1,2, 'a'], [1,2, 'b']],
        //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

        // this.assertEqualState(
        //     [[1,2, 'abc']],
        //     Interval.mergeOverlapping(
        //         [[1,2, 'a'], [1,2, 'b'], [1,2, 'c']],
        //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

        // this.assertEqualState(
        //     [[1,3, 'ab'], [3,6, 'b']],
        //     Interval.mergeOverlapping(
        //         [[1,3, 'a'], [1,6, 'b']],
        //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

        // this.assertEqualState(
        //     [[1,2, 'ac'], [2,3, 'abc'], [3, 4, 'bc'], [4, 6, 'c']],
        //     Interval.mergeOverlapping(
        //         [[1,3, 'a'], [2,4, 'b'], [1,6, 'c']],
        //         function(a, b) { return [[a[0], a[1], a[2] + b[2]]]; }));

        // this.assertEqualState([[1, 5]], Interval.mergeOverlapping([[1,3], [2, 4], [2, 5]]));
        // this.assertEqualState(
        //     [[1, 3], [5, 10]],
        //     Interval.mergeOverlapping([[1,3], [5,9 ], [6, 10]]));
        // this.assertEqualState(
        //     [[1, 8], [9, 10], [14, 21]],
        //     Interval.mergeOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]]));

        // // with merge func
        // var result = Interval.mergeOverlapping(
        //     [[3,5, 'b'], [1,4, 'a'], [8, 10, 'c']],
        //     function(a, b, merged) { merged.push(a[2] + b[2]) });
        // this.assertEqualState([[1,5, 'ab'], [8, 10, 'c']], result);
    }

});

TestCase.subclass('lively.lang.tests.ExtensionTests.ArrayTest', {
    testWithout: function() {
        var arr = ["a"];
        this.assertEqualState([], arr.without("a"));
        this.assertEqualState(["a"], arr.without("c"));
        delete arr[0];
        this.assertEqualState([], arr.without("a"));
    },
    testMutableCompact: function() {
        var arr = ["a", "b", "c", undefined];
        delete arr[1];
        arr.mutableCompact();
        this.assertEqualState(["a", "c", undefined], arr);
    },
    testMin: function() {
        var arr = [{x:2,y:12},{x:5,y:6},{x:9,y:4}];
        this.assertEquals(2, arr.pluck('x').min());
        this.assertEquals(4, arr.pluck('y').min());
        this.assertEqualState({x:2,y:12}, arr.min(function(ea) { return ea.x }));
        this.assertEqualState({x:9,y:4}, arr.min(function(ea) { return ea.y }));
    },
    testMax: function() {
        var arr = [{x:2,y:12},{x:5,y:6},{x:9,y:4}];
        this.assertEquals(9, arr.pluck('x').max());
        this.assertEquals(12, arr.pluck('y').max());
        this.assertEqualState({x:9,y:4}, arr.max(function(ea) { return ea.x }));
        this.assertEqualState({x:2,y:12}, arr.max(function(ea) { return ea.y }));
    },
    testInspect: function() {
        var obj = {a: 23, inspect: function() { return "<" + this.a + ">"; }};
        var arr = ["foo", obj, 42];
        this.assertEquals('[foo, <23>, 42]', arr.inspect());
    },
    testSwap: function() {
        var arr = ['a', 'b', 'c', 'd', 'e'];
        arr.swap(1,4);
        this.assertEquals(arr, ['a', 'e', 'c', 'd', 'b']);
        arr.swap(0, -1)
        this.assertEquals(arr, ['b', 'e', 'c', 'd', 'a']);
    },
    testRotate: function() {
        var arr = ['a', 'b', 'c', 'd', 'e'];
        arr = arr.rotate();
        this.assertEquals(arr, ['b', 'c', 'd', 'e', 'a']);
        arr = arr.rotate(2);
        this.assertEquals(arr, ['d', 'e', 'a', 'b', 'c']);
    },
    testGroupBy: function() {
        var elts = [{a: 'foo', b: 1},
                    {a: 'bar', b: 2},
                    {a: 'foo', b: 3},
                    {a: 'baz', b: 4},
                    {a: 'foo', b: 5},
                    {a: 'bar',b:6}];
        var group = elts.groupBy(function(ea) { return ea.a; });
        var expected = {foo:[elts[0],elts[2],elts[4]],bar:[elts[1],elts[5]],baz:[elts[3]]};
        this.assertEqualState(expected, group);
        this.assertEqualState(
            [[elts[0],elts[2],elts[4]],[elts[1],elts[5]],[elts[3]]],
            group.toArray(), 'toArray');
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        this.assertEquals(['foo', 'bar', 'baz'], group.keys(), 'groupNames');
        this.assertEqualState({foo: 3, bar: 2, baz: 1}, group.count(), 'coount');
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var mapGroupsResult = group.mapGroups(function(groupName, group) { return group.pluck('b').sum(); });
        this.assertEqualState({foo: 9, bar: 8, baz: 4}, mapGroupsResult, 'mapGroupsResult');
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var mapGroupResult = group.map(function(groupName, groupEl) { return groupEl.b; });
        this.assertEqualState({foo: [1,3,5], bar: [2,6], baz: [4]}, mapGroupResult, 'mapGroupResult');
    },
    testUniqBy: function() {
        var arr = [{x:33}, {x: 1}, {x: 2}, {x: 3}, {x: 99}, {x: 1}, {x: 2}, {x:1}, {x: 1}],
            result = arr.uniqBy(function(a,b) { return a.x === b.x; }).pluck('x'),
            expected = [33, 1,2,3,99];
        this.assertEquals(expected, result);
    },
    testMask: function() {
        var arr = Array.range(1,4),
            mask = [false, true, false, true];
        this.assertEquals([2,4], arr.mask(mask), 'mask');
    },

    testReMatches: function() {
        var arr = ['foo', 'bar', 'zork'],
            result = arr.reMatches(/.r.?/i);
        this.assertEquals([undefined, 'ar', 'ork'], result);
    }

});

TestCase.subclass('lively.lang.tests.ExtensionTests.GridTest', {
    testCreateGrid: function() {
        var result = Grid.create(2, 3, 'foo'),
            expected = [
                ['foo', 'foo', 'foo'],
                ['foo', 'foo', 'foo']];
        this.assertEqualState(expected, result);
    },

    testCreateGridReturnsDistinctColumns: function() {
        var result = Grid.create(2, 3, 'foo'),
            expected = [
                ['foo', 'bar', 'foo'],
                ['foo', 'foo', 'foo']];
        result[0][1] = 'bar';
        this.assertEqualState(expected, result);
    },

    testGridForEach: function() {
        var result = [],
            expected = [[0,0], [0,1], [0,2],
                        [1,0], [1,1], [1,2]];
        Grid.forEach(Grid.create(2, 3), function(_, row, col) {
            result.push([row, col]); });
        this.assertEqualState(expected, result);
    },

    testGridMap: function() {
        var result = Grid.map(Grid.create(2, 3), function(_, row, col) {
            return row + col; }),
            expected = [[0, 1, 2],
                        [1, 2, 3]];
        this.assertEqualState(expected, result);
    },

    testGridMapCreate: function() {
        var result = Grid.mapCreate(2, 3, function(row, col) {
            return row + col; }),
            expected = [[0, 1, 2],
                        [1, 2, 3]];
        this.assertEqualState(expected, result);
    },

    testToObjects: function() {
        this.assertEqualState(
            [{a:1,b:2},{a:3,b:4}],
            Grid.toObjects([['a', 'b'],[1,2],[3,4]]));
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.DateTest', {
    testRelativeTime: function() {
        var d1 = new Date('Tue May 14 2013 14:00:00 GMT-0700 (PDT)'), d2;
        this.assertEquals('now', d1.relativeTo(d1));
        d2 = new Date(d1 - (2 * 1000));
        this.assertEquals('2 secs', d2.relativeTo(d1));
        d2 = new Date(d1 - (60 * 1000 + 2*1000));
        this.assertEquals('1 min 2 secs', d2.relativeTo(d1));
        d2 = new Date(d1 - (3 * 60 * 1000 + 2 * 1000));
        this.assertEquals('3 mins', d2.relativeTo(d1));
        d2 = new Date(d1 - (60 * 60 * 1000 + 2 * 60 * 1000 + 2 * 1000));
        this.assertEquals('1 hour 2 mins', d2.relativeTo(d1));
        d2 = new Date(d1 - (4 *60 * 60 * 1000 + 2 * 60 * 1000 + 2 * 1000));
        this.assertEquals('4 hours', d2.relativeTo(d1));
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.Strings', {
    testTableize: function() {
        this.assertEqualState([["a", "b", "c"], ["d", "e", "f"]], Strings.tableize('a b c\nd e f'));
        this.assertEqualState([["a", 1, "c"], ["d", 2, "f"]], Strings.tableize('a 1 c\nd 2 f'));
        this.assertEqualState([["Date"], [new Date('06/11/2013')]], Strings.tableize('Date\n06/11/2013'));
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.ArrayProjection', {

    testCreateProjection: function() {
        var sut = lively.ArrayProjection;
        // array = ["A","B","C","D","E","F","G","H","I","J"]
        var array = Array.range(65,74).map(function(i) { return String.fromCharCode(i); });
        this.assertEqualState({array: array, from: 0, to: 3}, sut.create(array, 3));
        this.assertEqualState({array: array, from: 2, to: 5}, sut.create(array, 3, 2));
        this.assertEqualState({array: array, from: 7, to: 10}, sut.create(array, 3, 9));
    },

    testGetProjection: function() {
        var sut = lively.ArrayProjection;
        // array = ["A","B","C","D","E","F","G","H","I","J"]
        var array = Array.range(65,74).map(function(i) { return String.fromCharCode(i); }),
            projection = {array: array, from: 5, to: 8},
            result = sut.toArray(projection);
        this.assertEquals(["F","G","H"], result);
    },

    testProjectionIndices: function() {
        var sut = lively.ArrayProjection;
        var array = Array.range(65,74).map(function(i) { return String.fromCharCode(i); }),
            projection = {array: array, from: 5, to: 8},
            result = sut.toArray(projection);
        this.assertEquals(null, sut.originalToProjectedIndex(projection, 2), 'orig index to projected 2');
        this.assertEquals(0, sut.originalToProjectedIndex(projection, 5), 'orig index to projected 5');
        this.assertEquals(2, sut.originalToProjectedIndex(projection, 7), 'orig index to projected 7');
        this.assertEquals(null, sut.originalToProjectedIndex(projection, 9), 'orig index to projected 9');
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        this.assertEquals(7, sut.projectedToOriginalIndex(projection, 2), 'orig index to projected 2');
        this.assertEquals(5, sut.projectedToOriginalIndex(projection, 0), 'orig index to projected 0');
        this.assertEquals(null, sut.projectedToOriginalIndex(projection, 4), 'orig index to projected 4');
    },

    testMoveProjectionToIncludeIndex: function() {
        var sut = lively.ArrayProjection;
        var array = Array.range(65,74).map(function(i) { return String.fromCharCode(i); }),
            projection = sut.create(array, 3, 2);
        this.assertEqualState(projection, sut.transformToIncludeIndex(projection, 3));
        this.assertEqualState({array: array, from: 1, to: 4}, sut.transformToIncludeIndex(projection, 1));
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var array = [1,2,3,4,5], projection = sut.create(array, 3);
        this.assertEquals(array[3], sut.toArray(sut.transformToIncludeIndex(projection, 3)).last());
    }
});

AsyncTestCase.subclass('lively.lang.tests.ExtensionTests.Function',
"running", {
    setUp: function()  {
        this._queues = Functions._queues;
        Functions._queues = {};
        this._debouncedByName = Functions._debouncedByName;
        Functions._debouncedByName = {};
    },
    tearDown: function()  {
        Functions._queues = this._queues;
        Functions._debouncedByName = this._debouncedByName;
    }
},
"testing", {
    testDebouncedCommand: function() {
        var called = 0, result;
        Array.range(1,10).doAndContinue(function(next, i) {
            Functions.debounceNamed('testDebouncedCommand', 20, function(i) {
                result = i; called++; }, false)(i);
            setTimeout(next, 0);
        });
        this.waitFor(function() { return typeof result !== 'undefined'; }, 10, function() {
            this.assertEquals(1, called, 'debounce call cound');
            this.assertEquals(10, result, 'debounce result');
            this.done();
        });
    },

    testQueue: function() {
        var test = this,
            drainRun = false, finishedTasks = [],
            q = Functions.createQueue('testQueue-queue', function(task, callback) {
                finishedTasks.push(task); callback.delay(0); }),
            q2 =  Functions.createQueue('testQueue-queue', function(task, callback) {
                test.assert(false, "redefining worker should not work"); });
        this.assertIdentity(q,q2, 'id queues not identical');
        q.pushAll([1,2,3,4]);
        this.assertEquals(1, finishedTasks.length, "tasks prematurely finished?");
        q.drain = function() { drainRun = true }
        this.waitFor(function() { return !!drainRun; }, 10, function() {
            this.assertEquals([1,2,3,4], finishedTasks, "tasks not ok");
            this.assert(!Functions._queues.hasOwnProperty('testQueue-queue'), 'queue store not cleaned up');
            this.done();
        });
    },
    testThrottleCommand: function() {
        var called = 0, result = [];
        Array.range(1,4).forEach(function(i) {
            Functions.throttleNamed('testThrottleCommand', 20, function(i) { result.push(i); called++; })(i);
        });
        this.delay(function() {
            Functions.throttleNamed('testThrottleCommand', 20, function(i) { result.push(i); called++; })(5);
        }, 80);
        this.delay(function() {
            // call 1 immediatelly in the loop,
            // call 2 after waiting for timeout with arg from last (fourth) invocation
            // call 3 invocation after first throttle
            this.assertEquals(3, called, 'throttle call count');
            this.assertEquals([1,4,5], result, 'throttle result');
            this.done();
        }, 120);
    },
    testCompose: function() {
        function mult(a,b) { return a * b; }
        function add1(a) { return a + 1; }
        var composed = Functions.compose(mult, add1, String),
            result = composed(11, 2);
        this.assert("23" === result, 'compose not OK: ' + Strings.print(result));
        this.done();
    },
    testFlip: function() {
        function foo(a,b,c) { return '' + a + b + c; }
        this.assertEquals('213', Functions.flip(foo)(1,2,3));
        this.done();
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.NumbersTest',
'testing', {
    testLengthConversion: function() {
        this.epsilon = 0.01;
        this.assertEqualsEpsilon(75.59, Numbers.convertLength(2, 'cm', 'px'));
        this.assertEqualsEpsilon(2, Numbers.convertLength(75.59, 'px', 'cm'));
        this.assertEqualsEpsilon(75.59, Numbers.parseLength('2cm'));
        this.assertEqualsEpsilon(15, Numbers.parseLength('20px', 'pt'));
    }
});

}) // end of module
