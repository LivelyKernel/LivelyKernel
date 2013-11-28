module('lively.versions.tests.IntegrationTests').requires('lively.TestFramework', 'lively.versions.ObjectVersioning', 'lively.versions.tests.ObjectVersioningTests').toRun(function() {
    
TestCase.subclass('lively.versions.tests.IntegrationTests.ActivationTests',
'testing', {
    test01WrappedEvalTest: function() {
        var originalEval = eval;
    
        try {
            lively.versions.ObjectVersioning.wrapEval();
        
            this.assertEquals(eval('15 + 12'), 27);
            this.assert(Object.isProxy(eval('a = {}')));
        
        } finally {
            eval = originalEval;
        }
    }
});
    
});
