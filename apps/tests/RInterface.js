module('apps.tests.RInterface').requires('apps.RInterface', 'lively.TestFramework').toRun(function() {

AsyncTestCase.subclass("RInterfaceTest",
"running", {
    setUp: function()  {},
    tearDown: function()  {}
},
'testing', {
    testEvalSimpleExpression: function() {
        var test = this;
        apps.RInterface.doEval('1+2', function(err, result) {
            test.assertEquals("[1] 3", result);
            test.done();
        });
    }
});

}) // end of module