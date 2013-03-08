module('lively.persistence.tests.BuildSpec').requires('lively.persistence.BuildSpec', 'lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.persistence.tests.BuildSpec.Morphic',
'testing', {
    test01CreateSimpleSpec: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100)),
            spec = m.buildSpec(),
            expected = {
                className: 'lively.morphic.Box',
                sourceModule: 'lively.morphic.Core',
                _Position: lively.pt(0,0)
            };
        this.assertMatches(expected, spec);
    },

    test02Recreate: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.foo = 23;
        var spec = m.buildSpec(),
            recreated = lively.morphic.Morph.fromSpec(spec);
        this.assertEquals(lively.morphic.Box, recreated.constructor);
        this.assertEquals(23, recreated.foo);
        this.assertEquals(lively.rect(0,0,100,100), recreated.bounds());
    },
    test03RecreateWithScript: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.addScript(function foo() { return 23; });
        var spec = m.buildSpec(),
            recreated = lively.morphic.Morph.fromSpec(spec);
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
                _Position: lively.pt(0,0),
                submorphs: [{_Position: lively.pt(25,25)}]
            };
        this.assertMatches(expected, spec);
    },
    test05RecreateWithSubmorphs: function() {
        var m1 = new lively.morphic.Box(lively.rect(0,0,100,100)),
            m2 = new lively.morphic.Box(lively.rect(25,25,50,50));
        m1.addMorph(m2);
        var spec = m1.buildSpec(),
            recreated = lively.morphic.Morph.fromSpec(spec);
        this.assertEquals(1, recreated.submorphs.length, 'submorphs?');
    },
    test06BuildSpecWithConnection: function() {
        var m1 = new lively.morphic.Box(lively.rect(0,0,100,100)),
            m2 = new lively.morphic.Box(lively.rect(25,25,50,50));
        m1.addMorph(m2);
        lively.bindings.connect(m2, 'foo', m1, 'bar');
        m2.foo = 3;
        var spec = m1.buildSpec(),
            recreated = lively.morphic.Morph.fromSpec(spec),
            expected = {
                bar: 3,
                submorphs: [{foo: 3}]
            };
        this.assertMatches(expected, spec);
        this.assert(!spec.submorphs[0].$$foo, 'connection meta attribute was serialized');
        this.assert(!spec.submorphs[0].attributeConnections, 'attributeConnections prop was serialized');
        recreated.submorphs[0].foo = 4;
        this.assertEquals(4, recreated.bar, 'm2.foo -> m1.bar connection not working');
    },
    test07GenerateConnectionRebuilder: function() {
        var sut = new lively.persistence.SpecBuilder(),
            obj = {},
            c = lively.bindings.connect(obj, 'foo', obj, 'bar'),
            result = sut.generateConnectionRebuilder(obj, obj.attributeConnections),
            expected = 'function connectionRebuilder() {\n'
                     + '    lively.bindings.connect(this, "foo", this, "bar", {});\n'
                     + '}';
        this.assertEquals(expected, result.toString());
    },
    test08SpecialRecreationHandler: function() {
        lively.morphic.Box.subclass('lively.persistence.tests.SpecialBox', {
            buildSpecIncludeProperties: {
                foo: {recreate: function(instance, spec) { return spec.foo + 1; }}
            }
        });
        var m = new lively.persistence.tests.SpecialBox(lively.rect(0,0,100,100));
        m.foo = 2;
        var spec = m.buildSpec(),
            recreated = lively.morphic.Morph.fromSpec(spec);
        this.assertEquals(3, recreated.foo);
    }


});

lively.morphic.tests.MorphTests.subclass('lively.persistence.tests.BuildSpec.PrintSpec',
'testing', {
    test01CreateSimpleSpec: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.addScript(function foo() { return 123; });
        var spec = m.printBuildSpec(),
            expected = "{\n"
                     + "  _BorderColor: Color.rgb(204,0,0),\n"
                     + "  _BorderStyle: \"solid\",\n"
                     + "  _BorderWidth: 0,\n"
                     + "  _ClipMode: \"visible\",\n"
                     + "  _Extent: lively.pt(100.0,100.0),\n"
                     + "  _Fill: null,\n"
                     + "  _Position: lively.pt(0.0,0.0),\n"
                     + "  _StyleSheet: undefined,\n"
                     + "  className: \"lively.morphic.Box\",\n"
                     + "  doNotCopyProperties: undefined,\n"
                     + "  doNotSerialize: [\n"
                     + "    \"_renderContext\",\n"
                     + "    \"halos\",\n"
                     + "    \"_isRendered\",\n"
                     + "    \"priorExtent\",\n"
                     + "    \"cachedBounds\"\n"
                     + "  ],\n"
                     + "  droppingEnabled: true,\n"
                     + "  halosEnabled: true,\n"
                     + "  sourceModule: \"lively.morphic.Core\",\n"
                     + "  submorphs: [],\n"
                     + "  foo: function foo() { return 123; }\n"
                     + "}"
        this.assertEquals(expected, spec);
    }

});


}) // end of module