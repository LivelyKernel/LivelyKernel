module('lively.bindings.tests.FRPCoreAsyncTests').requires('lively.TestFramework', 'lively.bindings.FRPCore').toRun(function() {

AsyncTestCase.subclass('lively.bindings.tests.FRPCoreAsyncTests.FRPTests',
'tests', {
    testSend: function() {
        var m1 = {};
        var evaluator = new lively.bindings.FRPCore.Evaluator();
        evaluator.syncWithRealTime = true;
        evaluator.installTo(m1);
        evaluator.evaluate();
        
        var m2 = {};
        evaluator = new lively.bindings.FRPCore.Evaluator();
        evaluator.syncWithRealTime = true;
        evaluator.installTo(m2);
        evaluator.evaluate();
        
        m1.m2 = new lively.bindings.FRPCore.EventStream().value(m2).finalize([]);
        
        var strm = lively.bindings.FRPCore.EventStream.fromString("42");
        strm.installTo(m2, "a");
        
        strm = lively.bindings.FRPCore.EventStream.fromString("sendE(timer, m2.a)");
        strm.installTo(m1, "send");

        strm = lively.bindings.FRPCore.EventStream.fromString("durationE(600, 1500)");
        strm.installTo(m1, "timer");

        strm = lively.bindings.FRPCore.EventStream.fromString("0");
        strm.installTo(m1, "b");

        strm = lively.bindings.FRPCore.EventStream.fromString("b * 3");
        strm.installTo(m1, "c");

        this.waitFor(function() {return m1.timer.currentValue !== undefined}, 250, function () {
            this.assertEquals(m2.a.currentValue, 0);
        });
    }
});

}) // end of module