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
    },

    testDontCaptureBlacklisted: function() {
        var varMapper = {},
            code = "var x = 3, y = 5;",
            result = lively.lang.VM.syncEval(code, {
                topLevelVarRecorder: varMapper,
                dontTransform: ['y']
            });

        this.assertEquals(3, varMapper.x);
        this.assert(!varMapper.hasOwnProperty('y'), 'y recorded?');
        this.done();
    },
  
    testDontTransformVarDeclsInForLoop: function() {
      var code = "var sum = 0;\n"
               + "for (var i = 0; i < 5; i ++) { sum += i; }\n"
               + "sum"
      var recorder = {};
      var result = lively.lang.VM.syncEval(code, {topLevelVarRecorder: recorder});
      this.assertEquals(10, recorder.sum);
      this.done();
    },

    testDontTransformCatchClause: function() {
      var code = 'try { throw new Error("foo") } catch (e) { e.message }'
      var result = lively.lang.VM.syncEval(code, {topLevelVarRecorder: {}});
      this.assertEquals('foo', result);
      this.done();
    },


    testDontUndefineVars: function() {
        var code = "var x; var y = x + 3;";
        var rec = {x: 23};
        lively.lang.VM.syncEval(code, {topLevelVarRecorder: rec});
        this.assertEquals(26, rec.y);
        this.done();
    }
});

AsyncTestCase.subclass('lively.lang.tests.VM.LivelyCompatTests',
'tests', {

    testAddScriptWithVarMapping: function() {
        var src = "var obj = {c: 3};\n"
                + "(function(a) { return a + b + this.c; }).asScriptOf(obj, 'm', {b: 2});\n"
                + "obj.m(1);\n";

        var result1 = lively.lang.VM.syncEval(src);
        this.assertEquals(6, result1, 'simple eval not working');

        var result2 = lively.lang.VM.syncEval(src, {topLevelVarRecorder: varMapper});
        var varMapper = {};
        this.assertEquals(6, result2, 'capturing eval not working');

        this.assertEquals(0, Object.keys(varMapper), 'varMApper captured stuff');
        this.done();
    }

});

}) // end of module
