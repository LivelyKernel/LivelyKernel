module('lively.bindings.tests.FRPSerialization').requires('lively.TestFramework', 'lively.bindings.FRPCore').toRun(function() {

TestCase.subclass('lively.bindings.tests.FRPSerialization.SerializationTests',
'tests', {
    testSerialization: function() {
        var src = {};
        new lively.bindings.FRPCore.Evaluator().installTo(src);
        var strm = lively.bindings.FRPCore.EventStream.fromString("a+b");
        strm.installTo(src, "adder");

        var s = lively.persistence.Serializer.createObjectGraphLinearizer();
        s.addPlugin(new lively.bindings.FRPCore.EventStreamPlugin());
        var out = s.serialize(src), result = s.deserialize(out);

        this.assertEquals(result.adder.constructor, lively.bindings.FRPCore.EventStream);
        this.assertEquals(result.adder.sources.length, 2);
        this.assert(result.adder.owner === result);
        this.assertEquals(result.adder.code, "a+b");
        this.assertEquals(result.adder.currentValue, undefined);
    },

    testEvalationResults: function() {
        var src = {};
        new lively.bindings.FRPCore.Evaluator().installTo(src);
        var strm = lively.bindings.FRPCore.EventStream.fromString("a+b");
        strm.installTo(src, "adder");
        var a = lively.bindings.FRPCore.EventStream.fromString("3");
        debugger;
        var b = lively.bindings.FRPCore.EventStream.fromString("4");
        a.installTo(src, "a");
        b.installTo(src, "b");
        src.__evaluator.evaluate();
        this.assertEquals(src.adder.currentValue, 7);
        strm.beContinuous(7);

        var s = lively.persistence.Serializer.createObjectGraphLinearizer();
        s.addPlugin(new lively.bindings.FRPCore.EventStreamPlugin());
        var out = s.serialize(src), result = s.deserialize(out);

        this.assertEquals(result.adder.currentValue, 7);
        this.assertEquals(result.a.type, "value");
        this.assertEquals(result.a.currentValue, "3");
        this.assertEquals(result.b.currentValue, "4");
    }

});

});
