module('lively.bindings.tests.FRPLanguageTests').requires('lively.TestFramework', 'lively.bindings.FRPCore').toRun(function() {

TestCase.subclass('lively.bindings.tests.FRPLanguageTests.LanguageTests',
'tests', {
    testConstantExp: function() {
        var result = lively.bindings.FRPCore.EventStream.fromString("pt(3, 4)");
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream);
        this.assertEquals(result.type, "value");
        this.assertEquals(result.currentValue, pt(3, 4));
        this.assertEquals(result.dependencies.length, 0);
    },
    testHalfConstantExp: function() {
        var result = lively.bindings.FRPCore.EventStream.fromString("pt(3, a)");
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.currentValue, undefined, "currentValue");
        this.assertEquals(result.dependencies.length, 1, "dep");
        var string = result.expression.toString();
        this.assert(string.match('\\(arg0, arg1\\)') !== null);
        this.assert(string.match('return pt\\(3, arg1\\)') !== null, "hmm");
    },
    testDuration: function() {
        var result = lively.bindings.FRPCore.EventStream.fromString("durationE(100, 10000)");
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "durationE", "type");
        this.assertEquals(result.currentValue, undefined, "currentValue");
        this.assertEquals(result.dependencies.length, 0, "dep");
    },
    testUnop: function() {
        var result = lively.bindings.FRPCore.EventStream.fromString("-(a+b)");
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.currentValue, undefined, "currentValue");
        this.assertEquals(result.dependencies.length, 3, "dep");
        var string = result.expression.toString();
        this.assert(string.match('\\(arg0\\)') !== null);
        this.assert(string.match('return -arg0') !== null, "hmm");

        var result = result._t0;
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.dependencies.length, 2, "dep");
    },
    testNested: function() {
        var result = lively.bindings.FRPCore.EventStream.fromString("a + b * 3");
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.currentValue, undefined, "currentValue");
        this.assertEquals(result.dependencies.length, 3, "dep");

        var result = result._t0;
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.currentValue, undefined, "currentValue");
        this.assertEquals(result.dependencies.length, 1, "dep");
        this.assertEquals(result.dependencies[0].ref, "b", "dep");
    },
    testNested2: function() {
        var result = lively.bindings.FRPCore.EventStream.fromString("a + 2 * 3");
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.currentValue, undefined, "currentValue");
        this.assertEquals(result.dependencies.length, 1, "dep");
    },
    testLastValue: function() {
        var result = lively.bindings.FRPCore.EventStream.fromString("a' + b");
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.currentValue, undefined, "currentValue");
        this.assertEquals(result.dependencies.length, 1, "dep");
        var string = result.expression.toString();
        this.assert(string.match('\\(arg0, arg1\\)') !== null);
        this.assert(string.match("return this.getLast\\('a'\\) \\+ arg1") !== null, "hmm");
    },
    testFby: function() {
        var result = lively.bindings.FRPCore.EventStream.fromString("(3 + 4) fby a' + b on timer");
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.currentValue, 7, "currentValue");
        this.assertEquals(result.dependencies.length, 3, "dep");
        var string = result.expression.toString();
        this.assert(string.match('\\(arg0\\)') !== null);
        this.assert(string.match('return arg0') !== null);

        result = result._t0;
        this.assertEquals(result.constructor, lively.bindings.FRPCore.EventStream, "constructor");
        this.assertEquals(result.type, "exprE", "type");
        this.assertEquals(result.currentValue, undefined, "currentValue");
        this.assertEquals(result.dependencies.length, 2, "dep");
        string = result.expression.toString();
        this.assert(string.match('\\(arg0, arg1, arg2\\)') !== null);
        this.assert(string.match("return this.getLast\\('a'\\) \\+ arg1") !== null);
    },
});

});
