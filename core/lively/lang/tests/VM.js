module('lively.lang.tests.VM').requires('lively.TestFramework', 'lively.lang.VM').toRun(function() {

AsyncTestCase.subclass('lively.lang.tests.VM.Test',
'tests', {

    testSimpleEval: function() {
        this.assertEquals(3, lively.lang.VM.syncEval('1 + 2'));
        this.assertEquals(5, lively.lang.VM.syncEval('this.foo + 2;', {context: {foo: 3}}));
        this.assertMatches({message: "foo"}, lively.lang.VM.syncEval('throw new Error("foo");'));
        
        var result = null;
        lively.lang.VM.runEval('1+2', function(_, r) { result = r; })
        this.assertMatches(3, result);
        
        var result = null;
        lively.lang.VM.runEval('throw new Error("foo");', function(err, _e) { result = err; })
        this.assertMatches({message: 'foo'}, result);

        this.done();
    },

    testEvalAndCaptureTopLevelVars: function() {
        var varMapper = {};
        var code = "var x = 3 + 2";
        var result = lively.lang.VM.syncEval(code, {topLevelVarRecorder: varMapper});

        this.assertEquals(5, result);
        this.assertEquals(5, varMapper.x);

        this.done();
    },

    testECapturedVarsReplaceVarRefs: function() {
        var varMapper = {};
        var code = "var x = 3; var y = foo() + x; function foo() { return x++ }";
        var result = lively.lang.VM.syncEval(code, {topLevelVarRecorder: varMapper});

        this.assertEquals(7, result);
        this.assertEquals(4, varMapper.x);
        this.assertEquals(7, varMapper.y);

        this.done();
    },

})

}) // end of module
