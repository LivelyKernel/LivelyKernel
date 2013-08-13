module('lively.bindings.tests.FRPConnectTests').requires('lively.TestFramework', 'lively.bindings.FRP').toRun(function() {


TestCase.subclass('lively.bindings.tests.FRPConnectTests.FRPTests',

'tests', {
    testSend: function() {
        var m1 = new lively.morphic.Morph();
        m1.setName("m1");
        var evaluator = new lively.bindings.FRPCore.Evaluator();
        evaluator.installTo(m1);
        evaluator.evaluate();

        var m2 = new lively.morphic.Morph();
        m2.setName("m2");
        evaluator = new lively.bindings.FRPCore.Evaluator();
        evaluator.installTo(m2);
        evaluator.evaluate();

        m1.m2 = new lively.bindings.FRPCore.EventStream().value(m2).finalize([]);
        
        var strm = lively.bindings.FRPCore.EventStream.fromString("-42");
        strm.installTo(m2, "a");

        strm = lively.bindings.FRPCore.EventStream.fromString("sendE(timer, m2.a)");
        strm.installTo(m1, "send");

        strm = lively.bindings.FRPCore.EventStream.fromString("durationE(200, 200)");
        strm.installTo(m1, "timer");

        strm = lively.bindings.FRPCore.EventStream.fromString("42");
        strm.installTo(m1, "b");

        strm = lively.bindings.FRPCore.EventStream.fromString("b * 3");
        strm.installTo(m1, "c");

        m2.frpConnect("a", m1, "b");
        m1.__evaluator.evaluateAt(200);
        this.assertEquals(m2.a.currentValue, 0, "1");
        this.assertEquals(m1.c.currentValue, 0, "2");

        m1.__evaluator.evaluateAt(400);
        this.assertEquals(m2.a.currentValue, 200, "3");
        this.assertEquals(m1.c.currentValue, 600, "4");
    }
})

// Enter your code here

}) // end of module