module('lively.ide.tests.ASTEditingSupport').requires("lively.ide.tests.CodeEditor", "lively.ide.codeeditor.JS").toRun(function() {

TestCase.subclass('lively.ide.tests.ASTEditingSupport.NodeWalker',
'testing', {

    testFindNodesIncluding: function() {
        var src = "this.foo.bar;",
            ast = acorn.parse(src),
            nodes = acorn.walk.findNodesIncluding(ast, 6);
        this.assertEquals(5, nodes.length);
    },

    testMatchNodes: function() {
        // body[]:Program<0-11,"Foo.bar = 1">
        //   body[]:Statement<0-11,"Foo.bar = 1">
        //     body[]:ExpressionStatement<0-11,"Foo.bar = 1">
        //       expression:Expression<0-11,"Foo.bar = 1">
        //         expression:AssignmentExpression<0-11,"Foo.bar = 1">
        //           left:Expression<0-7,"Foo.bar">
        //             left:MemberExpression<0-7,"Foo.bar">
        //               object:Expression<0-3,"Foo">
        //                 object:Identifier<0-3,"Foo">
        //               property:Expression<4-7,"bar">
        //                 property:Identifier<4-7,"bar">
        //           right:Expression<10-11,"1">
        //             right:Literal<10-11,"1">
        var src = "Foo.bar = 1", nodes = [], state = {counter: 0};
        acorn.walk.matchNodes(acorn.parse(src), {
            MemberExpression: function(node, state, depth, type) { nodes.pushIfNotIncluded(node); state.counter++; },
            Identifier: function(node, state, depth, type) { nodes.pushIfNotIncluded(node); state.counter++; }
        }, state);
        this.assert(state.counter >= 3, 'counter: ' + state.counter);
        this.assertMatches([
            {type: "MemberExpression"},
            {type: "Identifier", start: 0},
            {type: "Identifier", start: 4}], nodes, Objects.inspect(nodes, {maxDepth: 1}));
    },
});

TestCase.subclass('lively.ide.tests.ASTEditingSupport.Navigation',
'running', {
    setUp: function() {
        this.sut = new lively.ide.codeeditor.JS.Navigator();
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
    }
});

TestCase.subclass('lively.ide.tests.ASTEditingSupport.ExpandingRanges',
'running', {
    setUp: function() {
        this.sut = new lively.ide.codeeditor.JS.RangeExpander();
    }
},
'testing', {

    testExpandRegion: function() {
        var src = "a + 'foo bar'";
        var nav = this.sut;
        this.assertMatches({range: [4, 13]}, nav.expandRegion(src, null, {range: [10,10]}));
        this.assertMatches({range: [0, 13]}, nav.expandRegion(src, null, {range: [4, 13]}));
        this.assertMatches({range: [4, 13]}, nav.contractRegion(src, null, {range: [9, 13], prev: {range: [4,13]}}));

        src = "a.b.c";
        this.assertMatches({range: [4, 5]}, nav.expandRegion(src, null, {range: [4,4]}));
        // this.assertMatches({range: [2, 5]}, nav.expandRegion(src, {range: [4,5]}));
    }

});

TestCase.subclass('lively.ide.tests.ASTEditingSupport.ScopeAnalyzer',
'testing', {
    testFindGlobalVar: function() {
        var src = "var x = 3; (function() { var foo = 3, baz = 5; x = 99; bar = 2; bar; Object.bar = 3; })",
            sut = new lively.ide.codeeditor.JS.ScopeAnalyzer(),
            result = sut.findGlobalVarReferences(src);
        this.assertEquals(2, result.length, 'global ref not found');
        this.assertMatches(
            {end: 58, start: 55, name: 'bar', type: "Identifier"},
            result[0], ""+Objects.inspect(result[0], {maxDepth: 1}));
    },

    testFindGlobalStuff: function() {
        var tests = [
            "bar", ["bar"],
            "bar()", ["bar"],
            "bar = 3", ["bar"],
            "bar = foo", ["bar", "foo"],
            "bar++", ["bar"],
            "baz + bar", ["baz", "bar"],
            "if (foo) bar", ["foo", "bar"],
            "while (foo) bar", ["foo", "bar"],
            "do {bar} while (foo)", ["foo", "bar"],
            "for (var i =0; foo < 1; i++) 1;", ["foo"],
            "function foo(baz) { baz; bar }; foo", ["bar"]
        ];
        var sut = new lively.ide.codeeditor.JS.ScopeAnalyzer(),
            result = sut.findGlobalVarReferences(src);
        for (var i = 0; i < tests.length; i+=2) {
            var src = tests[i], expected = tests[i+1], result = sut.findGlobalVarReferences(src);
            this.assertEquals(
                result.pluck('name'), expected,
                'global ref not found for ' + src + '\n' + Strings.print(result.pluck('name')));
        }
    }
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