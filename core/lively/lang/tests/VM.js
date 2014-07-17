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

    testEvalSingleExpressions: function() {
        var result = lively.lang.VM.syncEval('function() {}');
        this.assert(typeof result === 'function');
        var result = lively.lang.VM.syncEval('{x: 3}');
        this.assert(typeof result === 'object');
        this.assertEquals(3, result.x);
        this.done();
    },

    testEvalCapturedVarsReplaceVarRefs: function() {
        var varMapper = {};
        var code = "var x = 3; var y = foo() + x; function foo() { return x++ }; y";
        var result = lively.lang.VM.syncEval(code, {topLevelVarRecorder: varMapper});

        this.assertEquals(7, result);
        this.assertEquals(4, varMapper.x);
        this.assertEquals(7, varMapper.y);

        this.done();
    },

    testOnlyCaptureWhitelistedGlobals: function() {
        var varMapper = {y: undefined};
        var code = "var x = 3; y = 5; z = 4;";
        var result = lively.lang.VM.syncEval(code, {topLevelVarRecorder: varMapper});

        this.assertEquals(3, varMapper.x);
        this.assertEquals(5, varMapper.y);

        this.assert(!varMapper.hasOwnProperty('z'), 'Global "z" was recorded');
        this.done();
    }

})

}) // end of module
