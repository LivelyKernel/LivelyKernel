module('apps.tests.RInterface').requires('apps.RInterface', 'lively.TestFramework').toRun(function() {

AsyncTestCase.subclass("RInterfaceTest",
"running", {
    setUp: function()  {},
    tearDown: function()  {}
},
'testing', {
    testEvalSync: function() {
        var test = this;
        apps.RInterface.evalSync('1+2', function(err, result) {
            test.assertEquals("[1] 3", result);
            test.done();
        });
    },
    testAsyncEval: function() {
        var test = this;
        test.setMaxWaitDelay(3000);
        var expected1 = {
          "state": "DONE",
          "output": [{"source": "x=1+2\n","value": null,"text": null,"graphics": null,"message": null,"warning": null,"error": null}]
        }
        var expected2 = {
          "state": "DONE",
          "output": [{"source": "x\n","value": "3","text": null,"graphics": null,"message": null,"warning": null,"error": null}]
        }
        apps.RInterface.livelyREvalute_startEval('x=1+2', function(err, result) {
            test.assertEqualState(expected1, result);
            apps.RInterface.livelyREvalute_startEval('x', function(err, result) {
                test.assertEqualState(expected2, result);
                test.done();
            });
        })
    },
    testKillProcess: function() {
        var test = this;
        test.setMaxWaitDelay(3000);
        var expected = {
          "state": "INTERRUPTED",
          "output": [{"source": "Sys.sleep(3)\n","value": null,"text": null,"graphics": null,"message": null,"warning": null,"error": null}]
        }
        apps.RInterface.livelyREvalute_startEval('Sys.sleep(3)', function(err, result) {
            test.assertMatches({error: "timeout"}, result);
            apps.RInterface.killEvalProcess(result.id, function(err, result) {
                test.assertEqualState(expected, result);
                test.done();
            });
        })
    }
});

}) // end of module