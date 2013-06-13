module('ometa.tests.OmetaTests').requires('lively.TestFramework', 'lively.Helper', 'lively.Ometa').toRun(function() {

TestCase.subclass('ometa.tests.OmetaTests.TextTest', {
    shouldRun: false,
    styleOfIncludes: function(spec, style) {
        var names = Object.keys(spec).select(function(ea) { return spec.hasOwnProperty(ea) });
        return names.all(function(ea) { return style[ea] == spec[ea]});
    },

    assertTextStyle: function(text, spec, beginPos, length, msg) {
        var endPos = length ? beginPos + length - 1: beginPos;
        Array.range(beginPos, endPos).each(function(i) {
            if (this.styleOfIncludes(spec, text.emphasisAt(i))) return;
            this.assert(false, 'TextStyle of ' + text.string + ' has not '
                                + JSON.serialize(spec) + ' at position ' + i
                                + ' character: ' + text.string[i] + ' -- ' + msg);
        }, this);
    },

    // to test assertion
    testThisTest: function() {
        var style = {style: 'bold', fontSize: 4, color: Color.red};
        var text = new lively.Text.Text('Hello', style);
        this.assert(text instanceof lively.Text.Text, 'not text');
        this.assertTextStyle(text, {color: Color.red}, 0, text.string.length);
    }
});


TestCase.subclass('ometa.tests.OmetaTests.OmetaTest', {
    testBSOMetaJSParser: function() {
        var s = "3+ 4";
        var tree = BSOMetaJSParser.matchAll(s, "topLevel");
        this.assert(tree, " is defined");
        this.assertEqualState(tree, ["begin",["binop","+",["number",3],["number",4]]]);
    },

    testBSOMetaJSTranslator: function() {
        var s = "3+ 4";
        var tree = BSOMetaJSParser.matchAll(s, "topLevel");
        var result= BSOMetaJSTranslator.match(tree, "trans");
        this.assertEquals(String(result), "((3) + (4))");
    },

    testOmetaSampleInterpreter: function() {
        var calcSrc = BSOMetaJSParser.matchAll(ometa.tests.OmetaTests.ometaSampleInterpeter, "topLevel");
        var result = eval(BSOMetaJSTranslator.match(calcSrc, "trans"));
        this.assertEquals(result, 42);
    },

    testEvalOmeta: function() {
        this.assertEquals(OMetaSupport.ometaEval(ometa.tests.OmetaTests.ometaSampleInterpeter), 42)
    },

	testOMetaUnderstandsNewExpr: function() {
		var src = 'ometa Test { foo { new lively.Text() } }';
		this.assert(OMetaSupport.matchAllWithGrammar(BSOMetaJSParser, "topLevel", src));
	}
});

Object.extend(ometa.tests.OmetaTests, {
    ometaSampleInterpeter: "        ometa Calc {  \n\
  digit    = super(#digit):d          -> d.digitValue(),\n\
  number   = number:n digit:d         -> (n * 10 + d) \n\
           | digit,\n\
  addExpr  = addExpr:x '+' mulExpr:y  -> (x + y) \n\
           | addExpr:x '-' mulExpr:y  -> (x - y) \n\
           | mulExpr,\n\
  mulExpr  = mulExpr:x '*' primExpr:y -> (x * y)\n\
           | mulExpr:x '/' primExpr:y -> (x / y)\n\
           | primExpr,\n\
  primExpr = '(' expr:x ')'           -> x\n\
           | number,\n\
  expr     = addExpr\n\
}\n\
\n\
Calc.matchAll('6*(4+3)', 'expr')"

});

});
