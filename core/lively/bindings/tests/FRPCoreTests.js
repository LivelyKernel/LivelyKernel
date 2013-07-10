module('lively.bindings.tests.FRPCoreTests').requires('lively.TestFramework', 'lively.bindings.FRPCore').toRun(function() {

TestCase.subclass('lively.bindings.tests.FRPCoreTests.FRPTests',

'tests', {
    testTimer: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);
        var timer = this.newStream().timerE(1000).setCode("timerE(1000)").finalize([]);
        timer.installTo(obj, "timer");
        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        var result = evaluator.sort();
        evaluator.detectContinuity();
        evaluator.evaluateAt(500);
        this.assertEquals(timer.currentValue, undefined);
        evaluator.evaluateAt(1000);
        this.assertEquals(timer.currentValue, 1000);
        evaluator.evaluateAt(1999);
        this.assertEquals(timer.currentValue, 1000);
        evaluator.evaluateAt(2001);
        this.assertEquals(timer.currentValue, 2000);
    },
    testSorter: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);
        var timer = this.newStream().timerE(1000).setCode("timerE(1000)").finalize([]);
        var expr1 = this.newStream().expr([this.ref("timer")],
function(t) {return 0 - t}).setCode("0 - timer").finalize([]);
        timer.installTo(obj, "timer");
        expr1.installTo(obj, "expr1");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        var result = evaluator.sort();
        evaluator.detectContinuity();

        evaluator.evaluateAt(3500);
        this.assertEquals(expr1.currentValue, -3000);
        evaluator.evaluateAt(4000);
        this.assertEquals(expr1.currentValue, -4000);
    },
    testSorter2: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);

        var timer = this.newStream().timerE(1000).setCode("timerE(1000)").finalize([]);
        timer.installTo(obj, "timer");

        var expr1 = this.newStream().expr(
            [this.ref("timer")],
            function(t) {return 0 - t}).setCode("0 - timer").finalize([]);
        expr1.installTo(obj, "expr1");

        var expr2 = this.newStream().expr(
            [this.ref("timer")],
            function(t) {return t * 3}).setCode("timer * 3").finalize([]);
        expr2.installTo(obj, "expr2");

        var expr3 = this.newStream().expr(
            [this.ref("expr1"), this.ref("expr2")],
            function(x, y) {return x + y}).setCode("expr1 + expr2").finalize([]);
        expr3.installTo(obj, "expr3");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();

        evaluator.evaluateAt(3500);
        this.assertEquals(expr3.currentValue, 6000);
        evaluator.evaluateAt(4000);
        this.assertEquals(expr3.currentValue, 8000);
    },

    testSubExpressions: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);

        var timer = this.newStream().timerE(1000).setCode("timerE(1000)").finalize([]);
        timer.installTo(obj, "timer");

        var expr1 = this.newStream().expr(
            [this.ref("_t1")],
            function(t) {return 0 - t}).setCode("0 - (timer * 3)").finalize([this.ref("timer")]);
        expr1.installTo(obj, "expr1");

        var expr2 = this.newStream().expr(
            [this.ref("timer")],
            function(t) {return t * 3}).finalize([]);
        expr1.addSubExpression("_t1", expr2);

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();

        evaluator.evaluateAt(3500);
        this.assertEquals(expr1.currentValue, -9000);
        evaluator.evaluateAt(4000);
        this.assertEquals(expr1.currentValue, -12000);
    },
    testConstant: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);

        var timer = this.newStream().timerE(1000).setCode("timerE(1000)").finalize([]);
        timer.installTo(obj, "timer");

        var expr1 = this.newStream().expr(
            [100, this.ref("_t1")],
            function(c, t) {return c - t}).setCode("100 - (timer * 3)").finalize([this.ref("timer")]);
        expr1.installTo(obj, "expr1");

        var expr2 = this.newStream().expr(
            [this.ref("timer")],
            function(t) {return t * 3}).finalize([]);
        expr1.addSubExpression("_t1", expr2);

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();

        evaluator.evaluateAt(3500);
        this.assertEquals(expr1.currentValue, -8900);
        evaluator.evaluateAt(4000);
        this.assertEquals(expr1.currentValue, -11900);
    },
    testCollect: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);

        var timer = this.newStream().timerE(1000).setCode("timerE(1000)").finalize([]);
        timer.installTo(obj, "timer");

        var collector = this.newStream().collectE("timer", {now: 1, prev: 0},
            function(newVal, oldVal) {return {now: oldVal.now + oldVal.prev, prev: oldVal.now}}).setCode("timer.collectE({now: 1, prev: 0}, function(newVal, oldVal) {return {now: oldVal.now + oldVal.prev, prev: oldVal.now}}").finalize([]);
        collector.installTo(obj, "collector");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();

        evaluator.evaluateAt(1000);
        this.assertEquals(collector.currentValue.now, 1);
        evaluator.evaluateAt(2000);
        this.assertEquals(collector.currentValue.now, 2);
        evaluator.evaluateAt(3000);
        this.assertEquals(collector.currentValue.now, 3);
        evaluator.evaluateAt(4000);
        this.assertEquals(collector.currentValue.now, 5);
    },
    testDuration: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);

        var timer = this.newStream().durationE(1000, 10000).setCode("durationE(1000, 10000)").finalize([]);
        timer.installTo(obj, "timer");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();

        evaluator.evaluateAt(1000);
        this.assertEquals(timer.currentValue, 0);
        evaluator.evaluateAt(2000);
        this.assertEquals(timer.currentValue, 1000);
        evaluator.evaluateAt(9000);
        this.assertEquals(timer.currentValue, 8000);
        evaluator.evaluateAt(10001);
        this.assertEquals(timer.currentValue, 9000);
        this.assertEquals(timer.done, false);
        evaluator.evaluateAt(11000);
        this.assertEquals(timer.currentValue, 10000);
        this.assertEquals(timer.done, true);
        evaluator.evaluateAt(12000);
        this.assertEquals(timer.currentValue, 10000);
    },

    testDelay: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);

        var timer = this.newStream().durationE(1000, 10000).setCode("durationE(1000, 10000)").finalize([]);
        timer.installTo(obj, "timer");
        var delayer = this.newStream().delayE(this.ref("timer"), 3000).setCode("timer.delayE(3000)").finalize([]);
        delayer.installTo(obj, "delayer");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();
        var i;
        for (i = 1000; i <= 3000; i += 1000) {
            evaluator.evaluateAt(i);
            this.assertEquals(timer.currentValue, i - 1000);
            this.assertEquals(delayer.currentValue, undefined);
        }
        for (i = 4000; i <= 11000; i += 1000) {
            evaluator.evaluateAt(i);
            this.assertEquals(timer.currentValue, i - 1000);
            this.assertEquals(delayer.currentValue, i - 4000);
        }
        this.assertEquals(timer.done, true);
        for (i = 12000; i <= 15000; i += 1000) {
            evaluator.evaluateAt(i);
            this.assertEquals(timer.currentValue, 10000);
            this.assertEquals(delayer.currentValue, (i - 4000 < 10000 ? i - 4000 : 10000));
        }
    },
    testNat: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);
        evaluator.evaluate();

        var timer = this.newStream().durationE(1000, 10000).setCode("durationE(1000, 10000)").finalize([]);
        timer.installTo(obj, "timer");
        var nat = this.newStream().expr([],
            function() {return this.owner.nat.lastValue + 1}, true, 0).finalize([this.ref("timer")]);
        nat.installTo(obj, "nat");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();
        var i;
        for (i = 1000; i <= 10000; i += 1000) {
            evaluator.evaluateAt(i);
            this.assertEquals(timer.currentValue, i - 1000);
            this.assertEquals(nat.currentValue, i / 1000);
        }
    },
    testEvenOdd: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);
        evaluator.evaluate();

        var timer = this.newStream().durationE(1000, 10000).setCode("durationE(1000, 10000)").finalize([]);
        timer.installTo(obj, "timer");
        var nat = this.newStream().expr([],
            function() {return this.owner.nat.lastValue + 1}, true, 0).finalize([this.ref("timer")]);
        nat.installTo(obj, "nat");

        var even = this.newStream().expr([this.ref("nat")],
            function(n) {return n % 2 === 0}).finalize([]);
        even.installTo(obj, "even");

        var evenInner = this.newStream().expr([this.ref("nat")],
            function(n) {return n % 2 === 0}).finalize([]);

        var odd = this.newStream().expr([this.ref("_t1")],
            function(e) {return !e}).finalize([this.ref("nat")]);
        odd.addSubExpression("_t1", evenInner);
        odd.installTo(obj, "odd");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();
        var i;
        for (i = 1000; i <= 10000; i += 1000) {
            evaluator.evaluateAt(i);
            this.assertEquals(timer.currentValue, i - 1000);
            this.assertEquals(even.currentValue, (i / 1000) % 2 === 0);
            this.assertEquals(odd.currentValue, ((i / 1000) % 2 !== 0));
        }
    },
    testMergeE: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);

        var timer1 = this.newStream().durationE(1000, 10000).setCode("durationE(1000, 10000)").finalize([]);
        timer1.installTo(obj, "timer1");
        var timer2 = this.newStream().durationE(500, 10000).setCode("durationE(500, 2000)").finalize([]);
        timer2.installTo(obj, "timer12");
        var mergeE = this.newStream().mergeE(this.ref("timer1"), this.ref("timer2")).finalize([]);
        mergeE.installTo(obj, "mergeE");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();

        evaluator.evaluateAt(500);
        this.assertEquals(mergeE.currentValue, 0);
        evaluator.evaluateAt(1000);
        this.assert(mergeE.currentValue === 500 || mergeE.currentValue === 1000);
    },
    testObject: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);
        evaluator.evaluate();

        var timer = this.newStream().durationE(1000, 10000).setCode("durationE(1000, 10000)").finalize([]);
        timer.installTo(obj, "timer");
        var fib = this.newStream().expr([null], function(a) {
            return {now: this.getLast('fib').now + this.getLast('fib').prev, prev: this.getLast('fib').now}}, true, {now: 1, prev: 0}).setCode("{now: 1, prev: 0} fby {now: fib'.now + fib'.prev, prev: fib'.now} on timer").finalize([this.ref("timer")]);
        fib.installTo(obj, "fib");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();

        evaluator.evaluateAt(1000);
        this.assertEquals(fib.currentValue.now, 1);
        evaluator.evaluateAt(2000);
        this.assertEquals(fib.currentValue.now, 2);
    },
    testSimultaneous: function() {
        var obj = {};
        var evaluator = this.newEvaluator();
        evaluator.installTo(obj);
        evaluator.evaluate();

        var timer = this.newStream().durationE(1000, 10000).setCode("durationE(1000, 10000)").finalize([]);
        timer.installTo(obj, "timer");

        var a = this.newStream().value(1.0).finalize([]);
        a.installTo(obj, "a");
        var d = this.newStream().value(1.0).finalize([]);
        d.installTo(obj, "d");
        var b = this.newStream().expr([null], function() {
            return (this.getLast('a') + this.getLast('c')) / 2.0;},
            true, 0.0).finalize([this.ref("timer")]);
        b.installTo(obj, "b");
        var c = this.newStream().expr([null], function() {
            return (this.getLast('b') + this.getLast('d')) / 2.0;},
            true, 0.0).finalize([this.ref("timer")]);
        c.installTo(obj, "c");

        evaluator.reset();
        evaluator.addStreamsFrom(obj);
        evaluator.sort();
        evaluator.detectContinuity();
        evaluator.evaluateAt(1000);
        this.assertEquals(b.currentValue, 0.5);
        this.assertEquals(c.currentValue, 0.5);
        evaluator.evaluateAt(2000);
        this.assertEquals(b.currentValue, 0.75);
        this.assertEquals(c.currentValue, 0.75);
    },
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
},
'support', {
    newEvaluator: function() {
        return new lively.bindings.FRPCore.Evaluator();
    },
    newStream: function() {
        return new lively.bindings.FRPCore.EventStream();
    },
    ref: function(aName) {
        return new lively.bindings.FRPCore.StreamRef(aName);
    }

});

}); // end of module