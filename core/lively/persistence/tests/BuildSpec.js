module('lively.persistence.tests.BuildSpec').requires('lively.persistence.BuildSpec', 'lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.persistence.tests.BuildSpec.Morphic',
/*
Functions.timeToRun(function() {
    console.profile();
    t = new lively.persistence.tests.BuildSpec.Morphic();
    t.runAll();
    console.profileEnd();
});
*/
'assertion', {
    assertSpecMatches: function(expected, specObj, msg) {
        this.assert(
            specObj.isSpecObject,
            msg + ' (expected an instance of lively.morphic.SpecObject but got ' + specObj + ')');
        var submorphExpects = expected.submorphs;
        delete expected.submorphs;
        this.assertMatches(expected, specObj.attributeStore, msg);
        if (submorphExpects) {
            this.assert(!specObj.submorphs, msg + '(specObj ' + specObj + ' has no submorphs)');
            submorphExpects.forEach(function(submorphExpect, i) {
                this.assertSpecMatches(submorphExpect, specObj.attributeStore.submorphs[i]); }, this);
        }
    }
},
'testing', {
    test01CreateSimpleSpec: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100)),
            spec = m.buildSpec(),
            expected = {
                className: 'lively.morphic.Box',
                sourceModule: 'lively.morphic.Core'
            };
        this.assertSpecMatches(expected, spec);
    },

    test02Recreate: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.foo = 23;
        var recreated = m.buildSpec().createMorph();
        m.foo = 24;
        this.assertEquals(lively.morphic.Box, recreated.constructor);
        this.assertEquals(23, recreated.foo);
        this.assertEquals(lively.rect(0,0,100,100), recreated.bounds());
    },
    test03RecreateWithScript: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.addScript(function foo() { return 23; });
        var recreated = m.buildSpec().createMorph();
        this.assertEquals(lively.morphic.Box, recreated.constructor);
        this.assertEquals(23, recreated.foo());
        this.assertEquals(lively.rect(0,0,100,100), recreated.bounds());
    },
    test04CreateSimpleSpecWithSubmorphs: function() {
        var m1 = new lively.morphic.Box(lively.rect(0,0,100,100)),
            m2 = new lively.morphic.Box(lively.rect(25,25,50,50));
        m1.addMorph(m2);
        var spec = m1.buildSpec(),
            expected = {
                className: 'lively.morphic.Box',
                sourceModule: 'lively.morphic.Core',
                submorphs: [{_Position: lively.pt(25,25)}]
            };
        this.assertSpecMatches(expected, spec);
    },
    test05RecreateWithSubmorphs: function() {
        var m1 = new lively.morphic.Box(lively.rect(0,0,100,100)),
            m2 = new lively.morphic.Box(lively.rect(25,25,50,50));
        m1.addMorph(m2);
        var recreated = m1.buildSpec().createMorph();
        this.assert(m1 !== recreated, 'recreated identical to original object?');
        this.assertEquals(1, recreated.submorphs.length, 'submorphs?');
    },
    test06BuildSpecWithConnection: function() {
        var m1 = new lively.morphic.Box(lively.rect(0,0,100,100)),
            m2 = new lively.morphic.Box(lively.rect(25,25,50,50));
        m1.addMorph(m2);
        lively.bindings.connect(m2, 'foo', m1, 'bar');
        m2.foo = 3;
        var spec = m1.buildSpec(),
            recreated = spec.createMorph(),
            expected = {
                bar: 3,
                submorphs: [{foo: 3}]
            };
        this.assertSpecMatches(expected, spec);
        this.assert(!spec.attributeStore.submorphs[0].attributeStore.$$foo, 'connection meta attribute was serialized');
        this.assert(!spec.attributeStore.submorphs[0].attributeStore.attributeConnections, 'attributeConnections prop was serialized');
        recreated.submorphs[0].foo = 4;
        this.assertEquals(4, recreated.bar, 'm2.foo -> m1.bar connection not working');
    },
    test07GenerateConnectionRebuilder: function() {
        var sut = new lively.persistence.SpecObject(),
            obj = {},
            c = lively.bindings.connect(obj, 'foo', obj, 'bar'),
            result = sut.generateConnectionsRebuilder(obj, obj.attributeConnections),
            expected = 'function connectionRebuilder() {\n'
                     + '    lively.bindings.connect(this, "foo", this, "bar", {});\n'
                     + '}';
        this.assertEquals(expected, result.toString());
    },

    test08SpecialRecreationHandler: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.buildSpecProperties = {
            foo: {recreate: function(instance, spec) { instance.foo = spec.foo + 1; }}
        }
        m.foo = 2;
        var recreated = m.buildSpec().createMorph();
        this.assertEquals(3, recreated.foo);
    },

    test09SubmorphFilter: function() {
        var m1 = new lively.morphic.Box(lively.rect(0,0,100,100)),
            m2 = new lively.morphic.Box(lively.rect(20,20,10,10)),
            m3 = new lively.morphic.Box(lively.rect(20,20,10,10));
        m1.addMorph(m2);
        m1.addMorph(m3);
        m1.buildSpecProperties = {
            submorphs: {
                filter: function(morph, submorphs) { return submorphs.without(m2); }
            }
        }
        var spec = m1.buildSpec();
        this.assertEquals(1, spec.attributeStore.submorphs.length, 'submorph not filtered');
    },

    test10DefaultValues: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.buildSpecProperties = {foo: {defaultValue: 2}}
        m.foo = 2;
        var spec = m.buildSpec(), recreated = spec.createMorph();
        this.assert(!spec.attributeStore.hasOwnProperty('foo'), 'default foo in spec');
        this.assertEquals(2, recreated.foo);
    },
    test11OnBuildSpecCreated: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.addScript(function onBuildSpecCreated(buildSpec) {
            buildSpec.foo = 3; });
        var recreated = m.buildSpec().createMorph();
        this.assertEquals(3, recreated.foo);
    },

    test12BuildSpecForList: function() {
        var m = new lively.morphic.List(lively.rect(0,0,100,100), ['abc', 'def']);
        var recreated = m.buildSpec().createMorph();
        this.assertEqualState(['abc', 'def'], recreated.getList());
    },

    test13MorphRefWithName: function() {
        var m1 = lively.morphic.newMorph(), m2 = lively.morphic.newMorph();
        m1.name = 'BarMorph'; m2.name = 'FooMorph';
        m1.addMorph(m2);
        m1.foo = m2; m2.bar = m1;
        var recreated = m1.buildSpec().createMorph();
        this.assertIdentity(recreated.foo, recreated.submorphs[0]);
        this.assertIdentity(recreated.foo.bar, recreated);
    },

    test14MorphRefWithId: function() {
        var m1 = lively.morphic.newMorph(), m2 = lively.morphic.newMorph();
        m1.addMorph(m2);
        m1.foo = m2;
        var spec = m1.buildSpec();
        this.assertEqualState({isMorphRef: true, path: 'submorphs.0'}, spec.attributeStore.foo, 'buildspec');
        var recreated = spec.createMorph();
        this.assertIdentity(recreated.foo, recreated.submorphs[0], 'recreated');
    },

    test15MorphWithLayout: function() {
        var m = lively.morphic.newMorph(), l = new lively.morphic.Layout.TileLayout();
        l.setContainer(m);
        l.setSpacing(10);
        var buildSpec = m.buildSpec();
        this.assertMatches({type: "lively.morphic.Layout.TileLayout", spacing: 10}, buildSpec.attributeStore.layout);
        var recreated = buildSpec.createMorph();
        this.assertEquals("TileLayout", recreated.getLayouter().constructor.name);
        this.assertEquals(10, recreated.getLayouter().spacing);
    },
    test16PreservesShapeForEllipse: function() {
        // enter comment here
        var ellipse = lively.morphic.Morph.makeEllipse(new Rectangle(0,0,42,42));
        var spec = ellipse.buildSpec();
        this.assertEquals(spec.attributeStore.shape != undefined, true);
        this.assertEquals(spec.createMorph().getShape().constructor.name == 'Ellipse', true);        
    }

});

lively.morphic.tests.MorphTests.subclass('lively.persistence.tests.BuildSpec.Spec',
'testing', {
    test01CreateSimpleSpec: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.addScript(function foo() { return 123; });
        var spec = m.buildSpec().serializeExpr(),
            expected = "lively.BuildSpec({\n"
                     + "    _BorderColor: null,\n"
                     + "    _Extent: lively.pt(100.0,100.0),\n"
                     + "    className: \"lively.morphic.Box\",\n"
                     + "    droppingEnabled: true,\n"
                     + "    sourceModule: \"lively.morphic.Core\",\n"
                     + "    submorphs: [],\n"
                     + "    foo: function foo() { return 123; }\n"
                     + "})"
        this.assertEquals(expected, spec);
    },

    test02Customize: function() {
        lively.persistence.BuildSpec.Registry.remove(lively.BuildSpec('test02Customize'));
        var spec = lively.BuildSpec('test02Customize', {name: "bar"}),
            spec2 = spec.customize({}),
            spec3 = spec.customize({name: 'foo'});
        this.assertEquals('bar', spec.attributeStore.name, "spec");
        this.assertEquals('bar', spec2.attributeStore.name, "spec2");
        this.assertEquals('foo', spec3.attributeStore.name, "spec3");
    }

});

lively.morphic.tests.MorphTests.subclass('lively.persistence.tests.BuildSpec.Registry',
'running', {
    setUp: function($super) {
        $super();
        // setup empty registry
        this.oldRegistry = lively.persistence.BuildSpec.Registry;
        lively.persistence.BuildSpec.Registry = new lively.persistence.SpecObjectRegistry();
    },

    tearDown: function($super) {
        $super();
        // setup empty registry
        lively.persistence.BuildSpec.Registry = this.oldRegistry;
    }
},
'testing', {

    test01RegisterSpecObj: function() {
        var spec = lively.BuildSpec('foo', {className: 'lively.morphic.Box'});
        this.assert(spec && spec.isSpecObject, 'failed to create');
        this.assertIdentity(spec, lively.persistence.BuildSpec.Registry.foo, 'not Registry.foo');
        this.assertIdentity(spec, lively.BuildSpec('foo'), 'spec lookup');
        this.assert(lively.persistence.BuildSpec.Registry.has('foo'), '#has 1');
        this.assert(!lively.persistence.BuildSpec.Registry.has('bar'), '#has 2');
    },

    test02PrintRegisteredSpecObj: function() {
        var spec = lively.BuildSpec('foo', {className: 'lively.morphic.Box'}),
            expected = "lively.BuildSpec(\"foo\", {\n    className: \"lively.morphic.Box\"\n})";
        this.assertEquals(expected, spec.toString());
    }

});

}) // end of module
