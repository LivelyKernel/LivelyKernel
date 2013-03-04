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
    }});

lively.morphic.tests.MorphTests.subclass('lively.persistence.tests.BuildSpec.PrintSpec',
'testing', {
    test01CreateSimpleSpec: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.addScript(function foo() { return 123; });
        var spec = m.printBuildSpec(),
            expected = '{\n'
                     + '  _ClipMode: "visible",\n'
                     + '  _Extent: lively.pt(100.0,100.0),\n'
                     + '  _Position: lively.pt(0.0,0.0),\n'
                     + '  className: "lively.morphic.Box",\n'
                     + '  droppingEnabled: true,\n'
                     + '  halosEnabled: true,\n'
                     + '  sourceModule: "lively.morphic.Core",\n'
                     + '  submorphs: [],\n'
                     + '  foo: function foo() { return 123; }\n'
                     + '}'
        this.assertEquals(expected, spec);
    }

});


}) // end of module