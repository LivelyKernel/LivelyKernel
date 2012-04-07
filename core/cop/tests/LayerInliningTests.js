module('cop.tests.LayerInliningTests').requires('lively.TestFramework', 'cop.Flatten').toRun(function() {

Object.subclass('cop.tests.LayerInliningTests.Dummy', {

    m1: function() { return 23 },

    m2: function(arg) { return arg + 2 },

    m3: function(arg) { return arg + 9 },

    m4: function(arg) {
        var result = arg * 3;
        return result + 9
    },

    printLayers: function() { return 'BaseLayer'},

});

Object.extend(cop.tests.LayerInliningTests.Dummy, {
    classMethod1: function() { return 49 },
});

cop.create('cop.tests.LayerInliningTests.FlattenTestLayer')
.refineClass(cop.tests.LayerInliningTests.Dummy, {

    get x() { return 4 },

    m1: function() { return 42 },

    m2: function(arg) { return arg + 3 },

    m3: function(arg) {
        cop.proceed(arg);
        return arg + 10;
    },

    m4: function(arg) {
        var x = cop.proceed(arg);
        return  x + 9;
    },

    printLayers: function() { return 'FlattenTestLayer-' + cop.proceed() },
})
.refineObject(cop.tests.LayerInliningTests.Dummy, {
    classMethod1: Functions.Null
})
.refineObject(cop.tests.LayerInliningTests, {
    get foo() { return 3 },
})

cop.create('cop.tests.LayerInliningTests.FlattenTestLayer2')
.refineClass(cop.tests.LayerInliningTests.Dummy, {

    m1: function() { return 43 },

    m4: function(arg) {
        return cop.proceed(arg) + 1;
    },

    printLayers: function() { return 'FlattenTestLayer2-' + cop.proceed() },
});
TestCase.subclass('cop.tests.LayerInliningTests.MethodManipulatorTest', {

    setUp: function() {
        this.sut = new MethodManipulator();
        this.dummyClass = cop.tests.LayerInliningTests.Dummy;
    },

    test01ExtractFirstParameter: function() {
        var src = 'function() { return 42 },';
        var result = this.sut.firstParameter(src);
        this.assertEquals(null, result)

        src = 'function($super, arg) {\n\t\tcop.proceed(arg);\n\t\treturn arg + 10;\n\t    },';
        result = this.sut.firstParameter(src);
        this.assertEquals('$super', result)
    },

    test02ExtractMethodBody: function() {
        var src = 'function() { return 42 },';
        var result = this.sut.methodBody(src);
        var expected = 'return 42'
        this.assertEquals(expected, result, 'm1');

        src = 'function(arg) {\n\t\tcop.proceed(arg);\n\t\treturn arg + 10;\n\t},'
        result = this.sut.methodBody(src);
        expected = 'cop.proceed(arg);\n\t\treturn arg + 10;';
        this.assertEquals(expected, result, 'm3');
    },

    test03RemoveFirstParameter: function() {
        var src = 'function(arg1, arg2) { this.foo(); },';
        var expected = 'function(arg2) { this.foo(); },';
        var result = this.sut.removeFirstParameter(src);
        this.assertEquals(expected, result);
    },

    test04InlineProceed: function() {
        var proceedName = 'cop.proceed';
        var data = [
            {
                layer: 'function() { this.foo(); },',
                original: 'function(arg1, arg2) { this.bar() },',
                expected: 'function() { this.foo(); },'
            },
            {
                layer: 'function(arg1) { this.foo(); },',
                original: 'function(arg1) { this.bar() },',
                expected: 'function(arg1) { this.foo(); },'
            },
            {
                layer: 'function() {\ncop.proceed()\nthis.foo(); },',
                original: 'function() { this.bar() },',
                expected: 'function() {\n(function() { this.bar() }).call(this)\nthis.foo(); },'
            },
            {
                layer: 'function() { cop.proceed() + 1 },',
                original: 'function($super) { $super(23) },',
                expected: 'function($super) { (function() { $super(23) }).call(this) + 1 },'
            },
        ]
        for (var i = 0; i < data.length; i++) {
            var spec = data[i],
                layerSrc = spec.layer,
                originalSrc = spec.original,
                expected = spec.expected,
                result = this.sut.inlineProceed(layerSrc, originalSrc, proceedName);
            this.assertEquals(expected, result, 'at ' + i);
        }
    },
    test05DontInlineWhenCommentedOut: function() {
        var src =
'function() {\n\
    // var test = cop.proceed(arg1, arg2)\n\
}'
        var result = this.sut.inlineProceed(src, 'foo', 'cop.proceed')
        this.assertEquals(src, result)
    },
    test06AddFirstLine: function() {
        var src = 'function test(arg1, arg2) { this.foo(); },',
            expected = 'function test(arg1, arg2) { this.bar(); this.foo(); },',
            result = this.sut.addFirstLine(src, ' this.bar()');
        this.assertEquals(expected, result);
    },
    test07RemoveOuterFunction: function() {
        var src = 'function test(arg1, arg2) { this.foo(); },',
            expected = 'this.foo();',
            result = this.sut.removeOuterFunction(src);
        this.assertEquals(expected, result);
    },




});


TestCase.subclass('cop.tests.LayerInliningTests.FlattenTest', {

    setUp: function() {
        this.sut = cop.tests.LayerInliningTests.FlattenTestLayer;
        this.dummyClass = cop.tests.LayerInliningTests.Dummy;
    },

    test01aFindLayeredMethods: function() {
        var result = this.sut.namesOfLayeredMethods(this.dummyClass.prototype),
            expected = ['m1', 'm2', 'm3' ,'m4'];

        result = this.sut.namesOfLayeredMethods(this.dummyClass);
        expected = ['classMethod1'];
        this.assertEqualState(expected, result);
    },
    test01bFindLayeredProperties: function() {
        var result = this.sut.namesOfLayeredProperties(this.dummyClass.prototype),
            expected = ['x'];
        this.assertEqualState(expected, result);

        result = this.sut.namesOfLayeredProperties(this.dummyClass);
        expected = [];
        this.assertEqualState(expected, result);
    },

    test01cFindAllLayeredObjects: function() {
        var result = this.sut.layeredObjects(),
            expected = [this.dummyClass.prototype, this.dummyClass, cop.tests.LayerInliningTests];
        this.assertEquals(expected[0], result[0]);
        this.assertEquals(expected[1], result[1]);
        this.assertEquals(expected[2], result[2]);
    },


    test02GenerateReplaceMethod: function() {
        var result = this.sut.generateMethodReplacement(this.dummyClass.prototype, 'm1'),
            expected = 'm1: function() { return 42 },'
        this.assertEquals(expected, result);
    },

    test03GenerateReplaceMethodWhenProceedIsThereButNotUsed: function() {
        var result = this.sut.generateMethodReplacement(this.dummyClass.prototype, 'm2'),
            expected = 'm2: function(arg) { return arg + 3 },'
        this.assertEquals(expected, result);
    },
    test04GenerateReplaceMethod: function() {
        var result = this.sut.generateMethodReplacement(this.dummyClass.prototype, 'm4'),
            expected = 'm4: function(arg) {\n\
        var x = (function(arg) {\n\
            var result = arg * 3;\n\
            return result + 9\n\
        }).call(this, arg);\n\
        return  x + 9;\n\
    },'
        this.assertEquals(expected.replace(/    /g, '\t'), result.replace(/    /g, '\t'));
    },

    test05GenerateReplaceProperty: function() {
        var result = this.sut.generatePropertyReplacement(this.dummyClass.prototype, 'x', 'getter'),
            expected = 'get x() { return 4 },'
        this.assertEquals(expected, result);
    },
    test06FlattenLayer: function() {
        var blacklist = [{object: cop.tests.LayerInliningTests.Dummy.prototype, name: 'm2'}],
            result = this.sut.flattened(blacklist),
            expected =
'cop.tests.LayerInliningTests.Dummy.addMethods({\n\n\
    get x() { return 4 },\n\n\
    m1: function() { return 42 },\n\n\
    m3: function(arg) {\n\
        (function(arg) { return arg + 9 }).call(this, arg);\n\
        return arg + 10;\n\
    },\n\n\
    m4: function(arg) {\n\
        var x = (function(arg) {\n\
            var result = arg * 3;\n\
            return result + 9\n\
        }).call(this, arg);\n\
        return  x + 9;\n\
    },\n\n\
    printLayers: function() { return \'FlattenTestLayer-\' + (function() { return \'BaseLayer\'}).call(this) },\n\n\
});\n\n\
Object.extend(cop.tests.LayerInliningTests.Dummy, {\n\n\
    classMethod1: function Functions$Null() { return null; },\n\n\
});\n\n\
Object.extend(Global.cop.tests.LayerInliningTests, {\n\n\
    get foo() { return 3 },\n\n\
});'
        this.assertEquals(expected.replace(/    /g, '\t'), result.replace(/    /g, '\t'));
    },





});
TestCase.subclass('cop.tests.LayerInliningTests.InlinerTest',
'running', {
    setUp: function($super) {
        $super();
        this.dummyClass = cop.tests.LayerInliningTests.Dummy;
        this.layer1 = cop.tests.LayerInliningTests.FlattenTestLayer;
        this.layer2 = cop.tests.LayerInliningTests.FlattenTestLayer2;
cop.recompileLayers([this.layer1, this.layer2])
        cop.invalidateInlineMethodCache();
    },
    tearDown: function($super) {
        $super();
cop.recompileLayers([this.layer1, this.layer2])
        if (!this.methodsToRestore) return;
        this.methodsToRestore.forEach(function(spec) {
            spec.obj[spec.name] = spec.value;
        })
        cop.invalidateInlineMethodCache();
    },
    restoreMethodAfterwards: function(obj, methodName) {
        if (!this.methodsToRestore) this.methodsToRestore = []
        this.methodsToRestore.push({obj: obj, name: methodName, value: obj[methodName]})
    },


},
'tests', {
    test01GetInlinedMethodForOneLayer: function() {
        var inliner = new cop.LayerInliner(),
            mName = 'printLayers',
            partialMethods = cop.findPartialMethodsForObject(
                [this.layer1], this.dummyClass.prototype, mName),
            method = inliner.inlinePartialMethods(
                this.dummyClass.prototype, mName, null, partialMethods),
            expected = [this.layer1.getName(), 'BaseLayer'].join('-');
        this.assertEquals(expected, method.call());
    },
    test02GetInlinedMethodForTwoLayers: function() {
        var inliner = new cop.LayerInliner(),
            mName = 'printLayers',
            partialMethods = cop.findPartialMethodsForObject(
                [this.layer2, this.layer1], this.dummyClass.prototype, mName),
            method = inliner.inlinePartialMethods(
                this.dummyClass.prototype, mName, null, partialMethods),
            expected = [this.layer1.getName(), this.layer2.getName(), 'BaseLayer'].join('-');
        this.assertEquals(expected, method.call());
    },
    test03aDynamicallyCreateInlinedMethod: function() {
        this.restoreMethodAfterwards(this.dummyClass.prototype, 'printLayers')

        var result,
            expected = this.layer1.getName() + '-' + 'BaseLayer',
            test = this,
            obj = new this.dummyClass();
debugger
        cop.withLayers([this.layer1], function() {
            result = obj.printLayers();
            test.assert(obj.printLayers.isInlinedByCop, 'method not inlined');
        })
        this.assertEquals(expected, result, 'inlined method has not the correct layers');

        // test if inlined method gets uninstalled when necessary...
        this.assertEquals('BaseLayer', obj.printLayers(), 'not uninstalled')
    },
    test03bDynamicallyCreateInlinedMethodWhenLayersChange: function() {
        this.restoreMethodAfterwards(this.dummyClass.prototype, 'printLayers')

        var result,
            expected = this.layer1.getName() + '-' + 'BaseLayer',
            test = this,
            obj = new this.dummyClass();
        cop.withLayers([this.layer1], function() { result = obj.printLayers() })
        this.assertEquals(expected, result, 'inlined method has not the correct layers 1');

        expected = this.layer2.getName() + '-' + this.layer1.getName() + '-' + 'BaseLayer';
        cop.withLayers([this.layer1, this.layer2], function() { result = obj.printLayers() })
        this.assertEquals(expected, result, 'inlined method has not the correct layers 2');

        expected = this.layer1.getName() + '-' + this.layer2.getName() + '-' + 'BaseLayer';
        cop.withLayers([this.layer2, this.layer1], function() { result = obj.printLayers() });
        this.assertEquals(expected, result, 'inlined method has not the correct layers 3');

        this.assertEquals('BaseLayer', obj.printLayers(), 'not uninstalled')
    },

    test04OnLayerChangeCompiledMethodIsOnvalidated: function() {
        this.restoreMethodAfterwards(this.dummyClass.prototype, 'printLayers')
        var layer = cop.create('cop.tests.LayerInliningTests.FlattenTestLayer3')
        .refineClass(this.dummyClass, {
            printLayers: function() { return 'FlattenTestLayer3-' + cop.proceed() },
        })

        var obj = new this.dummyClass();
        // first do it so that compiled method is installed
        cop.withLayers([layer], function() { obj.printLayers() })

        // now change layer
        layer.refineClass(this.dummyClass, {
            printLayers: function() { return 'FlattenTestLayer3Changed-' + cop.proceed() },
        })

        var result, expected = layer.getName() + 'Changed-' + 'BaseLayer';
        cop.withLayers([layer], function() { result = obj.printLayers() })
        this.assertEquals(expected, result, 'inlined method was not invalidated when layer changed');
    },
    test05DynamicallyCreateInlinedMethodWhenLayersChange: function() {
        this.restoreMethodAfterwards(this.dummyClass.prototype, 'printLayers')

        var result,
            expected = this.layer1.getName() + '-' + 'BaseLayer',
            test = this,
            obj = new this.dummyClass();
        cop.withLayers([this.layer1], function() { result = obj.printLayers() })
        this.assertEquals(expected, result, 'inlined method has not the correct layers 1');

        expected = this.layer2 + '-' + expected;
        cop.withLayers([this.layer1, this.layer2], function() { result = obj.printLayers() })
        this.assertEquals(expected, result, 'inlined method has not the correct layers 2');

        this.assertEquals('BaseLayer', obj.printLayers(), 'not uninstalled')
    },


    test06LayerWithSetter: function() {
        if (Global.Test06LayerWithSetterClass) Global.Test06LayerWithSetterClass.remove();
        var klass = Object.subclass('Test06LayerWithSetterClass', {y: 2}),
            obj = new klass();

        var layer = cop.basicCreate('test06').refineClass(klass, {
            get y() { return 23 }
        })
        this.assertEquals(2, obj.y, 'cannot access  prop before layering')

        cop.withLayers([layer], function() {
            this.assertEquals(23, obj.y, 'not correctly layered getter')
        }.bind(this))
        this.assertEquals(2, obj.y, 'cannot correctly access prop after layering')
    },
    test07PartialMethodsCanBindClosureValues: function() {
        if (Global.Test07PartialMethodsCanBindClosureValues)
            Global.Test07PartialMethodsCanBindClosureValues.remove();
        var klass = Object.subclass('Test07PartialMethodsCanBindClosureValues', {
                m: function() { return x }.binds({x: 3})
            }),
            obj = new klass();

        this.assertEquals(3, obj.m(), 'explicit closure not working');

        var layer = cop.basicCreate('test07').refineClass(klass, {
            m: function() { return cop.proceed() + y }.binds({y: 5})
        })

        this.assertEquals(3, obj.m(), 'closure not working after making it layer aware');
        cop.withLayers([layer], function() {
            this.assertEquals(8, obj.m(), 'closures in layer not working')
        }.bind(this))
    },
    test08aInliningAndSuper: function() {
        if (Global.ClassA) ClassA.remove()
        if (Global.ClassB) ClassB.remove()
        if (Global.TestSuperLayer) TestSuperLayer.remove();
        Object.subclass('ClassA', {
            m1: function() { this.result += this},
            toString: function() { return 'A'},
        })
        ClassA.subclass('ClassB', {
            m1: function($super) { $super() },
            toString: function() { return 'B'},
        })
        var l = cop.create('TestSuperLayer')
        l.refineClass(ClassA, { m1: function() { cop.proceed() } })

        var obj = new ClassB();
        obj.result = '';
        obj.m1();
        this.assertEquals('B', obj.result);
    },
    test09InlinedLayersAreCached: function() {
        var obj = new this.dummyClass();

        this.assert(!cop.inlinedMethodCache[obj._layer_object_id], 'cache already exists');
        obj.m1();
        cop.withLayers([this.layer1], function() { obj.m1() });
        var cache = cop.inlinedMethodCache[obj._layer_object_id];
        this.assert(cache, 'cache not created');
        this.assert(cache[cop.hashForCurrentComposition(obj)], 'method not cached');
        this.assertEquals(23, cache[cop.hashForCurrentComposition(obj)](), 'not corectly cached method');
    },






});
TestCase.subclass('cop.tests.LayerInliningTests.LayerHashingTest',
'running', {
    setUp: function($super) {
        $super();
        this.klass = Object.subclass('cop.tests.LayerInliningTests.LayerHashingTestDummy', {
            m1: function() { return 3 }
        });
        this.layer = cop.create('LayerHashingTest').refineClass(this.klass, {
            m1: function() { return 4 }
        })
    },
    tearDown: function($super) {
        $super();
        this.klass.remove();
        this.layer.remove();
    },
},
'tests', {
   test01LayerHasHash: function() {
        var expected = this.layer.fullName() + ':' + Date.now();
        this.layer.ensureHash()
        this.assertEquals(expected, this.layer.hash);
    },
    newMethod: function() {
        // enter comment here
    },

});

}) // end of module