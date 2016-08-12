module('lively.ide.tests.ASTEditingSupport').requires("lively.ide.tests.CodeEditor", "lively.ide.codeeditor.modes.JavaScript").toRun(function() {

TestCase.subclass('lively.ide.tests.ASTEditingSupport.NodeWalker',
'testing', {

    testFindNodesIncluding: function() {
        var src = "this.foo.bar;",
            ast = lively.ast.acorn.parse(src),
            nodes = lively.ast.acorn.walk.findNodesIncluding(ast, 6);
        this.assertEquals(4, nodes.length);
    },

    testFindNodesIncludingInObjectLiteral: function() {
        var src = "var x = {foo: 34};",
            ast = acorn.parse(src),
            nodes = acorn.walk.findNodesIncluding(ast, 10);
        this.assertEquals(
            ["Program","VariableDeclaration", "VariableDeclarator", "ObjectExpression","Property","Identifier"],
            nodes.pluck("type"));
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

        lively.ast.acorn.walk.matchNodes(lively.ast.parse(src), {
            MemberExpression: function(node, state, depth, type) { nodes.pushIfNotIncluded(node); state.counter++; },
            Identifier: function(node, state, depth, type) { nodes.pushIfNotIncluded(node); state.counter++; }
        }, state);

        this.assert(state.counter >= 3, 'counter: ' + state.counter);
        this.assertMatches([
            {type: "MemberExpression"},
            {type: "Identifier", start: 0},
            {type: "Identifier", start: 4}], nodes, lively.lang.obj.inspect(nodes, {maxDepth: 1}));
    },
});

TestCase.subclass('lively.ide.tests.ASTEditingSupport.Navigation',
'running', {
    setUp: function() {
        this.sut = new lively.ide.codeeditor.modes.JavaScript.Navigator();
    }
},
'testing', {

    testForwardSexp: function() {
        var src = "this.foo(bar, 23);";
        var nav = this.sut;
        this.assertEquals(4, nav._forwardSexp(src, 0)); // "|this" -> "this|"
        this.assertEquals(8, nav._forwardSexp(src, 4)); // "|.foo" -> ".foo|"
        this.assertEquals(17, nav._forwardSexp(src, 8)); // "|(bar, 23)" -> "(bar, 23)|"
        this.assertEquals(12, nav._forwardSexp(src, 9));
        this.assertEquals(18, nav._forwardSexp(src, 17));
        this.assertEquals(18, nav._forwardSexp(src, 18));
    },

    testForwardSexpInlcudesSiblings: function() {
        var src = "function foo() {\nvar x;\nvar y;\n}\n";
        var nav = this.sut;
        this.assertEquals(23, nav._forwardSexp(src, 18)); // "function foo() {\n|var x;\nvar y;\n}\n" -> "function foo() {\nvar x;|\nvar y;\n}\n"
        this.assertEquals(24, nav._forwardSexp(src, 23)); // "function foo() {\nvar x;|\nvar y;\n}\n" -> "function foo() {\nvar x;\n|var y;\n}\n"
    },

    testBackwardSexp: function() {
        var src = "this.foo(bar, 23);";
        // this.foo(bar, 23);
        // lively.ast.stringify(lively.ast.query.nodesAt(5, src).last())
        // lively.ast.printAst(src)
        // lively.ast.acorn.walk.findNodesIncluding(lively.ast.parse(src), 8)
        var nav = this.sut;
        this.assertEquals(0, nav._backwardSexp(src, 18));
        this.assertEquals(5, nav._backwardSexp(src, 8));
        this.assertEquals(0, nav._backwardSexp(src, 4));
        this.assertEquals(0, nav._backwardSexp(src, 17));
        // this.assertEquals(12, nav._backwardSexp(src, 14));
    },

    testBackwardSexpIncludesSiblings: function() {
        var src = "function foo() {\nvar x;\nvar y;\n}\n";
        var nav = this.sut;
        this.assertEquals(23, nav._backwardSexp(src, 24)); // "function foo() {\nvar x;|\nvar y;\n}\n" -> "function foo() {\nvar x;\n|var y;\n}\n"
    },

    testForwardDownSexp: function() {
        var src = "var x = function() { return function(foo) {}; }";
        var nav = this.sut;
        this.assertEquals(4, nav._forwardDownSexp(src, 0));
        this.assertEquals(8, nav._forwardDownSexp(src, 4));
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

AsyncTestCase.subclass('lively.ide.tests.ASTEditingSupport.ExpandingRanges',
'running', {
    setUp: function($super, run) {
        this.sut = new lively.ide.codeeditor.modes.JavaScript.Navigator();
        this.editor = new lively.morphic.CodeEditor(lively.rect(0,0, 300, 100), '');
        var inited = false;
        this.editor.withAceDo(function() { inited = true; });
        this.waitFor(function() { return !!inited }, 10, run);
    }
},
'testing', {

    testExpandRegion: function() {
        var src = this.editor.textString = "a + 'foo bar'";
        this.assertMatches({range: [9, 12]}, this.sut.expandRegion(this.editor.aceEditor, src, null, {range: [10,10]}));
        this.assertMatches({range: [0, 13]}, this.sut.expandRegion(this.editor.aceEditor, src, null, {range: [4, 13]}));
        this.assertMatches({range: [4, 13]}, this.sut.contractRegion(this.editor.aceEditor, src, null, {range: [9, 13], prev: {range: [4,13]}}));

        // src = this.editor.textString = "a.b.c";
        this.assertMatches({range: [4, 13]}, this.sut.expandRegion(this.editor.aceEditor, src, null, {range: [4,4]}));
        this.assertMatches({range: [4, 13]}, this.sut.expandRegion(this.editor.aceEditor, src, null, {range: [4,5]}));
        this.done();
    },

    testExpandOnKeyStringLiteral: function() {
        var src = this.editor.textString = "var x = {foo: 234}";
        this.assertMatches({range: [9, 12]}, this.sut.expandRegion(this.editor.aceEditor, src, null, {range: [10,10]})); // first "o"
        this.done();
    },

    testExpandOnString: function() {
        var src = this.editor.textString = "var x = 'hello world'";
        this.sut = new lively.ide.codeeditor.modes.JavaScript.Navigator();
        this.assertMatches({range: [9,14]}, this.sut.expandRegion(this.editor.aceEditor, src, null, {range: [12,12]})); // sec "l"
        this.done();
    }

});

TestCase.subclass('lively.ide.tests.ASTEditingSupport.ScopeAnalyzer',
'testing', {

    testFindGlobalVar: function() {
        var src = "var x = 3; (function() { var foo = 3, baz = 5; x = 99; bar = 2; bar; Object.bar = 3; })",
            result = lively.ast.query.findGlobalVarRefs(src);
        this.assertEquals(2, result.length, 'global ref not found');
        this.assertMatches(
            {end: 58, start: 55, name: 'bar', type: "Identifier"},
            result[0], ""+Objects.inspect(result[0], {maxDepth: 1}));
    },

    testJSLintStyleGlobalDeclaration: function() {
        var src = "/*global bar, zork*/\nx = 3; (function() { /*global x, foo*/\nfoo = 3; var baz = 5; x = 98; y = 99; bar = 2; Object.bar = 3; })",
            result = lively.ast.query.findGlobalVarRefs(src, {jslintGlobalComment: true});

        var expected = [{end: 22, name: "x", start: 21, type: "Identifier"},
                        {end: 91, name: "y", start: 90, type: "Identifier"}];

        this.assertEquals(2, result.length, 'global ref not found');
        this.assertMatches(expected,
            result, ""+Objects.inspect(result, {maxDepth: 1}));
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
            "do {bar} while (foo)", ["bar", "foo"],
            "for (var i =0; foo < 1; i++) 1;", ["foo"],
            "function foo(baz) { baz; bar }; foo", ["bar"]
        ];

        for (var i = 0; i < tests.length; i+=2) {
            var src = tests[i], expected = tests[i+1], result = lively.ast.query.findGlobalVarRefs(src);
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
            result = lively.ast.fuzzyParse(src, {type: 'LabeledStatement', verbose: true, addSource: true});
        this.assert(!result.parseError, 'result has parse error ' + Objects.inspect(result));
        this.assertEquals(src.length, result.end, 'end index not ok');
    },
    testParseMethodSourceErrorWithCorrectIndex: function() {
        var src = "foo: function() { a a },",
            result = lively.ast.fuzzyParse(src, {type: 'LabeledStatement'});
        this.assert(result.parseError, 'result has no parse error');
        this.assertEquals(20, result.parseError.pos, 'error pos');
    }
});

});
