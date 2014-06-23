module('lively.lang.tests.VM').requires('lively.TestFramework').toRun(function() {

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

})

}) // end of module
