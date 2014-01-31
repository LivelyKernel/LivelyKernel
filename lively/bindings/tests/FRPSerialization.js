module('lively.bindings.tests.FRPSerialization').requires('lively.TestFramework', 'lively.bindings.FRP').toRun(function() {

TestCase.subclass('lively.bindings.tests.FRPSerialization.SerializationTests',
'tests', {
    testSerialization: function() {
        var src = {};
        new lively.bindings.FRPCore.Evaluator().installTo(src);
        var strm = lively.bindings.FRPCore.EventStream.fromString("a+b");
        strm.installTo(src, "adder");

        var s = lively.persistence.Serializer.createObjectGraphLinearizer();
        s.addPlugin(new lively.bindings.FRP.EventStreamPlugin());
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
        src.__evaluator.evaluate();
        var strm = lively.bindings.FRPCore.EventStream.fromString("a+b");
        strm.installTo(src, "adder");
        var a = lively.bindings.FRPCore.EventStream.fromString("3");
        var b = lively.bindings.FRPCore.EventStream.fromString("4");
        a.installTo(src, "a");
        b.installTo(src, "b");
        src.__evaluator.evaluate();
        this.assertEquals(src.adder.currentValue, 7, "a");

        var s = lively.persistence.Serializer.createObjectGraphLinearizer();
        s.addPlugin(new lively.bindings.FRP.EventStreamPlugin());
        var out = s.serialize(src), result = s.deserialize(out);

        result.__evaluator.evaluate();

        this.assertEquals(result.adder.currentValue, 7, "b");
        this.assertEquals(result.a.type, "value", "c");
        this.assertEquals(result.a.currentValue, "3", "d");
        this.assertEquals(result.b.currentValue, "4", "e");
    }

});

});
