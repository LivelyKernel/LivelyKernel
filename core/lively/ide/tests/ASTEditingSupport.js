module('lively.ide.tests.ASTEditingSupport').requires("lively.ide.tests.CodeEditor", "lively.ast.acorn").toRun(function() {

TestCase.subclass('lively.ide.tests.ASTEditingSupport.NodeWalker',
'testing', {

    testFindNodesIncluding: function() {
        var src = "this.foo.bar;",
            ast = acorn.parse(src),
            nodes = acorn.walk.findNodesIncluding(ast, 6);
        this.assertEquals(5, nodes.length);
    }});

TestCase.subclass('lively.ide.tests.ASTEditingSupport.Navigation',
'running', {
    setUp: function() {
        this.sut = new lively.ide.CodeEditor.JS.Navigator();
    }
},
'testing', {

    testForwardSexp: function() {
        var src = "this.foo(bar, 23);";
        var nav = this.sut;
        this.assertEquals(4, nav.forwardSexp(src, 0)); // "|this" -> "this|"
        this.assertEquals(8, nav.forwardSexp(src, 4)); // "|.foo" -> ".foo|"
        this.assertEquals(17, nav.forwardSexp(src, 8)); // "|(bar, 23)" -> "(bar, 23)|"
        this.assertEquals(12, nav.forwardSexp(src, 9));
        this.assertEquals(18, nav.forwardSexp(src, 17));
        this.assertEquals(18, nav.forwardSexp(src, 18));
    },

    testBackwardSexp: function() {
        var src = "this.foo(bar, 23);";
        // this.foo(bar, 23);
        // lively.ast.acorn.nodeSource(src, lively.ast.acorn.nodesAt(5, src).last())
        // acorn.walk.print(acorn.walk.findNodesIncluding(ast, 8))
        // acorn.walk.findNodesIncluding(ast, 8)
        var nav = this.sut;
        this.assertEquals(0, nav.backwardSexp(src, 18));
        this.assertEquals(5, nav.backwardSexp(src, 8));
        this.assertEquals(0, nav.backwardSexp(src, 4));
        this.assertEquals(0, nav.backwardSexp(src, 17));
        // this.assertEquals(12, nav.backwardSexp(src, 14));
    },

    testForwardDownSexp: function() {
        var src = "var x = function() { return function(foo) {}; }";
        var nav = this.sut;
        this.assertEquals(8, nav.forwardDownSexp(src, 0));
    },

    testContainingFunctionRange: function() {
        var src = "x = function() { return function(foo) {}; };";
        var nav = this.sut;
        this.assertEquals([4, 43], nav.rangeForFunctionOrDefinition(src, [10, 10]));
        this.assertEquals([24, 40], nav.rangeForFunctionOrDefinition(src, [28, 28]));
        this.assertEquals(null, nav.rangeForFunctionOrDefinition(src,[43, 43]));
        this.assertEquals([0, 43], nav.rangeForFunctionOrDefinition(src,[4,43]));
        this.assertEquals(null, nav.rangeForFunctionOrDefinition(src,[0,43]));
    },

    testExpandRegion: function() {
        var src = "a + 'foo bar'";
        var nav = this.sut;
        this.assertMatches({range: [4, 13]}, nav.expandRegion(src, {range: [10,10]}));
        this.assertMatches({range: [0, 13]}, nav.expandRegion(src, {range: [4, 13]}));
        this.assertMatches({range: [4, 13]}, nav.contractRegion(src, {range: [9, 13], prev: {range: [4,13]}}));

        src = "a.b.c";
        this.assertMatches({range: [4, 5]}, nav.expandRegion(src, {range: [4,4]}));
        // this.assertMatches({range: [2, 5]}, nav.expandRegion(src, {range: [4,5]}));
    }
});

TestCase.subclass('lively.ide.tests.ASTEditingSupport.ScopeAnalyzer',
'testing', {
    testFindGlobalVar: function() {
        var src = "var x = 3; (function() { var foo = 3; foo = 5, bar = 2; x = 99; Object.foo = 3 })",
            sut = new lively.ide.CodeEditor.JS.ScopeAnalyzer(),
            result = sut.findGlobalVarReferences(src);
        this.assertMatches(1, result.length, 'global ref not found');
        this.assertMatches({end: 50, start: 47, name: 'bar', type: "Identifier"}, result[0]);
    },
});
TestCase.subclass('lively.ide.tests.ASTEditingSupport.MethodParser',
'testing', {
    testParsingMethodSourceWithoutParseError: function() {
        var src = "foo: function() {},",
            result = lively.ast.acorn.fuzzyParse(src, {type: 'LabeledStatement', verbose: true, addSource: true});
        this.assert(!result.parseError, 'result has parse error ' + Objects.inspect(result));
        this.assertEquals(src.length, result.end, 'end index not ok');
    },
    testParseMethodSourceErrorWithCorrectIndex: function() {
        var src = "foo: function() { a a },",
            result = lively.ast.acorn.fuzzyParse(src, {type: 'LabeledStatement'});
        this.assert(result.parseError, 'result has no parse error');
        this.assertEquals(20, result.parseError.pos, 'error pos');
    }
});

});