module('lively.ast.tests.AstTests').requires('lively.ast.AstHelper', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ast.tests.AstTests.Acorn',
'testing', {

    testFindNodeByAstIndex: function() {
        var src = 'var x = 3; function foo() { var y = 3; return y }; x + foo();',
            ast = acorn.parse(src),
            expected = ast.body[1].body.body[1].argument, // the y in "return y"
            found = acorn.walk.findNodeByAstIndex(ast, 9);
        this.assertIdentity(expected, found, 'node not found');
    },

    testFindNodeByAstIndexNoReIndex: function() {
        var src = 'var x = 3; function foo() { var y = 3; return y }; x + foo();',
            ast = acorn.parse(src),
            found = acorn.walk.findNodeByAstIndex(ast, 9, false);
        this.assertIdentity(null, found, 'node found (but should not add index)');
    },

    testFindStatementOfNode: function() {
        var tests = [{
            src: 'var x = 3; function foo() { var y = 3; return y + 2 }; x + foo();',
            target: function(ast) { return ast.body[1].body.body[1].argument.left; },
            expected: function(ast) { return ast.body[1].body.body[1]; },
        }, {
            src: 'var x = 1; x;',
            target: function(ast) { return ast.body[1]; },
            expected: function(ast) { return ast.body[1]; },
        }, {
            src: 'switch (123) { case 123: debugger; }',
            target: function(ast) { return ast.body[0].cases[0].consequent[0]; },
            expected: function(ast) { return ast.body[0].cases[0].consequent[0]; },
        }]

        tests.forEach(function(test, i) {
            var ast = acorn.parse(test.src),
                found = acorn.walk.findStatementOfNode(ast, test.target(ast));
            this.assertIdentity(test.expected(ast), found, 'node not found ' + (i + 1));
        }, this);
    },

    testUpdateSourceCodePositions: function() {
        var src = 'var x = { z: 3 }; function foo() { var y = 3; return y; } x.z + foo();',
            prettySrc = 'var x = { z: 3 };\nfunction foo() {\n    var y = 3;\n    return y;\n}\nx.z + foo();',
            ast = acorn.parse(src),
            genSrc = escodegen.generate(ast),
            genAst = acorn.parse(genSrc);

        this.assertEquals(prettySrc, genSrc, 'pretty printed source and generated source do not match');
        lively.ast.acorn.rematchAstWithSource(ast, genSrc);
        this.assertMatches(genAst, ast, 'source code positions were not corrected');
    },

    testUpdateSourceCodePositionsInSubTree: function() {
        var src1 = 'function foo() { var y = 3; return y; }',
            src2 = 'var x = { z: 3 };\nfunction foo() {\n    var y = 3;\n    return y;\n}\nx.z + foo();',
            ast1 = acorn.parse(src1).body[0],
            ast2 = acorn.parse(src2),
            genSrc = escodegen.generate(ast2),
            genAst = acorn.parse(genSrc);

        lively.ast.acorn.rematchAstWithSource(ast1, genSrc, null, 'body.1');
        this.assertMatches(genAst.body[1], ast1, 'source code positions were not corrected');
    },

    testUpdateSourceCodeLocations: function() {
        var src = 'var x = { z: 3 }; function foo() { var y = 3; return y; } x.z + foo();',
            prettySrc = 'var x = { z: 3 };\nfunction foo() {\n    var y = 3;\n    return y;\n}\nx.z + foo();',
            ast = acorn.parse(src),
            genSrc = escodegen.generate(ast),
            genAst = acorn.parse(genSrc);

        this.assertEquals(prettySrc, genSrc, 'pretty printed source and generated source do not match');
        lively.ast.acorn.rematchAstWithSource(ast, genSrc, true);
        this.assertMatches(genAst, ast, 'source code positions were not corrected');

        // sample some locations
        var tests = [{  // var = x = { z: 3 };
            expected: { start: { line: 1, column: 0 }, end: { line: 1, column: 17 } },
            subject: ast.body[0].loc
        }, { // function foo() { ... }
            expected: { start: { line: 2, column: 0 }, end: { line: 5, column: 1 } },
            subject: ast.body[1].loc
        }, { // var y = 3;
            expected: { start: { line: 3, column: 4 }, end: { line: 3, column: 14 } },
            subject: ast.body[1].body.body[0].loc
        }, { // y  in  return y;
            expected: { start: { line: 4, column: 11 }, end: { line: 4, column: 12 } },
            subject: ast.body[1].body.body[1].argument.loc
        }, { // x.z + foo();
            expected: { start: { line: 6, column: 0 }, end: { line: 6, column: 12 } },
            subject: ast.body[2].loc
        }];

        tests.forEach(function(test, i) {
            this.assertMatches(test.expected, test.subject, 'incorrect location for test ' + (i+1));
        }, this);
    },

    testParseWithComments: function() {
        var src = '// comment1\n\n//comment2\nvar x = 3; // comment3\n// comment3\nfunction foo() { var y = 3; /*comment4*/ return y }; x + foo();',
            ast = lively.ast.acorn.parse(src, {withComments: true}),
            comments = ast.comments,
            expectedTopLevelComments = [{
              column: false, isBlock: false, line: false,
              start: 0, end: 11,
              node: null, text: " comment1"
            },{
              column: false, isBlock: false, line: false,
              start: 13, end: 23,
              node: null, text: "comment2"
            },{
              column: false, isBlock: false, line: false,
              start: 35, end: 58,
              node: null, text: " comment3\n comment3"
            }],
            expectedScopedComments = [{
              start: 87, end: 99,
              isBlock: true, text: "comment4"
            }];

        this.assertMatches(expectedTopLevelComments, ast.comments, 'topLevel');
        this.assertMatches(expectedScopedComments, ast.body[1].body.comments, 'scoped');
    }

});

TestCase.subclass('lively.ast.tests.Transforming',
'testing', {

    // helper tests

    testHelperReplaceNode: function() {
        var source = "var x = 3,\n"
                   + "    y = x + x;\n"
                   + "y + 2;\n";
        var ast = lively.ast.acorn.parse(source);
        var target = ast.body[0].declarations[0].init;
        var hist = lively.ast.transform.helper.replaceNode(
            target,
            function() { return {type: "Literal", value: "foo"}; },
            {changes: [], source: source});

        var expected = {
            changes: [{type: 'del', pos: 8, length: 1},
                      {type: 'add', pos: 8, string: "'foo'"}],
            source: source.replace('3', "'foo'")
        }

        this.assertEqualState(expected, hist);

    },

    testHelperReplaceNodesInformsAboutChangedNodes: function() {
        var source = "var x = 3;\n"
        var ast = lively.ast.acorn.parse(source);

        var replacement1 = {type: "Literal", value: 23},
            replacement2 = {type: "VariableDeclarator", id: {type: "Identifier", name: "zzz"}, init: {type: "Literal", value: 24}},
            wasChanged1, wasChanged2;

        var hist = lively.ast.transform.helper.replaceNodes([
            {target: ast.body[0].declarations[0].init, replacementFunc: function(node, source, wasChanged) { wasChanged1 = wasChanged; return replacement1; }},
            {target: ast.body[0].declarations[0], replacementFunc: function(node, source, wasChanged) { wasChanged2 = wasChanged; return replacement2; }}],
            {changes: [], source: source});

        this.assert(!wasChanged1, "wasChanged1");
        this.assert(wasChanged2, "wasChanged2");

        this.assertEqualState("var zzz = 24;\n", hist.source);
    },

    testHelperSortNodesForReplace: function() {
        var source = "var x = 3,\n"
                  + "    y = x + x;\n"
                  + "y + 2;\n";
        var ast = lively.ast.acorn.parse(source);
        var result = [
            ast.body[0],
            ast.body[0].declarations[1].init.right,
            ast.body[0].declarations[1].init.left,
            ast.body[1]].sort(lively.ast.transform.helper._compareNodesForReplacement);
        var expected = [
            ast.body[0].declarations[1].init.left,
            ast.body[0].declarations[1].init.right,
            ast.body[0],
            ast.body[1]];
        this.assertEqualState(expected, result, expected.pluck('type') + ' !== ' + result.pluck('type'))
    },

    testHelperReplaceNestedNodes: function() {
        var source = "var x = 3,\n"
                   + "    y = x + x;\n"
                   + "y + 2;\n";
        var ast = lively.ast.acorn.parse(source);
        var replaceSource1, replaceSource2;
        var hist = lively.ast.transform.helper.replaceNodes([
            {target: ast.body[0], replacementFunc: function(n, source) { replaceSource1 = source; return {type: "Literal", value: "foo"}; }},
            {target: ast.body[0].declarations[1].init.right, replacementFunc: function(n, source) { replaceSource2 = source; return {type: "Literal", value: "bar"}; }}],
            {changes: [], source: source});

        var expected = {
            changes: [{type: 'del', pos: 23, length: 1},
                      {type: 'add', pos: 23, string: "'bar'"},
                      {type: 'del', pos: 0, length: 29},
                      {type: 'add', pos: 0, string: "'foo'"}],
            source: "'foo'\ny + 2;\n"
        }

        this.assertEqualState(expected, hist);
        
        this.assertEquals(source.split(";")[0].replace('x + x', 'x + \'bar\'') + ';', replaceSource1);
        this.assertEquals("x", replaceSource2);

    },

    testHelperReplaceNestedAndSubsequentNodes: function() {
        var source = "var x = 3,\n"
                   + "    y = x + x;\n"
                   + "y + 2;\n";
        var ast = lively.ast.acorn.parse(source);
        var hist = lively.ast.transform.helper.replaceNodes([
            {target: ast.body[0], replacementFunc: function(node, source) { return {type: "Literal", value: "foo"}; }},
            {target: ast.body[0].declarations[1].init.right, replacementFunc: function() { return {type: "Literal", value: "bar"}; }}],
            {changes: [], source: source});

        var expected = {
            changes: [{type: 'del', pos: 23, length: 1},
                      {type: 'add', pos: 23, string: "'bar'"},
                      {type: 'del', pos: 0, length: 29},
                      {type: 'add', pos: 0, string: "'foo'"}],
            source: "'foo'\ny + 2;\n"
        }

        this.assertEqualState(expected, hist);

    },

    // interface tests
    testReplace: function() {

        var code              = 'var x = 3 + foo();',
            ast               = lively.ast.acorn.parse(code),
            toReplace         = ast.body[0].declarations[0].init.left,
            replacement       = function() { return {type: "Literal", value: "baz"}; },
            result            = lively.ast.transform.replace(ast, toReplace, replacement),
            transformedString = result.source,
            expected          = 'var x = \'baz\' + foo();'

        this.assertEquals(expected, transformedString);

        this.assertEqualState(
            [{length: 1, pos: 8, type: "del"},{pos: 8, string: "'baz'", type: "add"}],
            result.changes);
    },

    testReplaceNodeKeepsSourceFormatting: function() {
        var code              = 'var x = 3\n+ foo();',
            ast               = lively.ast.acorn.parse(code, {addSource: true}),
            toReplace         = ast.body[0].declarations[0].init.left,
            replacement       = function() { return {type: "Literal", value: "baz"}; },
            result            = lively.ast.transform.replace(ast, toReplace, replacement),
            expected          = 'var x = \'baz\'\n+ foo();';

        this.assertEquals(expected, result.source);
    },

    testReplaceNodeWithMany: function() {
        var code = 'var x = 3, y = 2;',
            ast = lively.ast.acorn.parse(code),
            toReplace = ast.body[0],
            replacement1 = lively.ast.acorn.parse("Global.x = 3").body[0],
            replacement2 = lively.ast.acorn.parse("Global.y = 2").body[0],
            replacement = function() { return [replacement1, replacement2]; },
            result = lively.ast.transform.replace(ast, toReplace, replacement),
            expected = 'Global.x = 3;\nGlobal.y = 2;'

        this.assertEquals(expected, result.source);
    },

    testReplaceNodeWithManyKeepsSource: function() {
        var code = '/*bla\nbla*/\n  var x = 3,\n      y = 2;',
            ast = lively.ast.acorn.parse(code, {}),
            toReplace = ast.body[0],
            replacement = function() {
                return [lively.ast.acorn.parse("Global.x = 3").body[0],
                        lively.ast.acorn.parse("Global.y = 2").body[0]];
            },
            result = lively.ast.transform.replace(code, toReplace, replacement),
            expected = '/*bla\nbla*/\n  Global.x = 3;\n  Global.y = 2;'

        this.assertEquals(expected, result.source);
    },

    testOneVarDeclaratorPerDeclaration: function() {
        var code = '/*test*/var x = 3, y = 2; function foo() { var z = 1, u = 0; }',
            result = lively.ast.transform.oneDeclaratorPerVarDecl(code),
            expected = '/*test*/var x = 3;\nvar y = 2; function foo() { var z = 1;\n var u = 0; }'
        this.assertEquals(expected, result.source);

        var code = "var x = 3, y = (function() { var y = 3, z = 2; })(); ",
            result = lively.ast.transform.oneDeclaratorPerVarDecl(code),
            expected = "var x = 3;\nvar y = function () {\n        var y = 3;\n        var z = 2;\n    }(); "
        this.assertEquals(expected, result.source);
    },

    testTransformTopLevelVarDeclsForCapturing: function() {
        var code     = "var y, z = foo + bar; baz.foo(z, 3)",
            expected = "Global.y = Global['y'] || undefined;\nGlobal.z = Global.foo + Global.bar; Global.baz.foo(Global.z, 3)",
            recorder = {name: "Global", type: "Identifier"},
            result   = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(code, recorder);
        this.assertEquals(expected, result.source);
    },

    testTransformTopLevelVarAndFuncDeclsForCapturing: function() {
        var code     = "var z = 3, y = 4; function foo() { var x = 5; }",
            expected = "Global.foo = foo;\nGlobal.z = 3;\nGlobal.y = 4; function foo() { var x = 5; }",
            recorder = {name: "Global", type: "Identifier"},
            result   = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(code, recorder);
        this.assertEquals(expected, result.source);
    },

    testTransformTopLevelVarDeclsAndVarUsageForCapturing: function() {
        var code              = "var z = 3, y = 42, obj = {a: '123', b: function b(n) { return 23 + n; }};\n"
                              + "function foo(y) { var x = 5 + y.b(z); }\n",
            ast               = lively.ast.acorn.parse(code, {addSource: true}),
            expected          = "Global.foo = foo;\n"
                              + "Global.z = 3;\n"
                              + "Global.y = 42;\n"
                              + "Global.obj = {\n"
                              + "    a: '123',\n"
                              + "    b: function b(n) {\n"
                              + "        return 23 + n;\n"
                              + "    }\n"
                              + "};\n"
                              + "function foo(y) { var x = 5 + y.b(Global.z); }\n",
            recorder          = {name: "Global", type: "Identifier"},
            result            = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(code, recorder);


        this.assertEquals(expected, result.source);
    },

    testTransformTopLevelVarDeclsAndVarUsageInCatch: function() {
        var code              = "try { throw {} } catch (e) { e }\n",
            ast               = lively.ast.acorn.parse(code, {addSource: true}),
            recorder          = {name: "Global", type: "Identifier"},
            result            = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(code, recorder);

        this.assertEquals(code, result.source);
    },

    testTransformTopLevelVarDeclsAndVarUsageInForLoop: function() {
        var code     = "for (var i = 0; i < 5; i ++) { i; }",
            ast      = lively.ast.acorn.parse(code, {addSource: true}),
            recorder = {name: "Global", type: "Identifier"},
            result   = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(code, recorder);

        this.assertEquals(code, result.source);
    },

    testTransformTopLevelVarDeclsForCapturingWithoutGlobals: function() {
        var code     = "var x = 2; y = 3; z = 4; baz(x, y, z)",
            expected = "foo.x = 2; foo.y = 3; z = 4; baz(foo.x, foo.y, z)",
            recorder = {name: "foo", type: "Identifier"},
            result   = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(
                code, recorder, {exclude: ['baz', 'z']});
        this.assertEquals(expected, result.source);
    },

    testTransformTopLevelVarDeclsAndCaptureDefRanges: function() {
        var code     = "var y = 1, x = 2;\nvar y = 3; z = 4; baz(x, y, z); function baz(a,b,c) {}",
            expected = {
              baz: [{end: 72, start: 50, type: "FunctionDeclaration"}],
              x: [{end: 16, start: 11, type: "VariableDeclarator"}],
              y: [{end: 9, start: 4, type: "VariableDeclarator"},
                  {end: 27, start: 22, type: "VariableDeclarator"}]},
            recorder = {name: "foo", type: "Identifier"},
            result   = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(
                code, recorder, {recordDefRanges: true});
        this.assertEqualState(expected, result.defRanges);
    },

    testTransformToReturnLastStatement: function() {
        var code = "var z = foo + bar; baz.foo(z, 3)",
            expected = "var z = foo + bar; return baz.foo(z, 3)",
            transformed = lively.ast.transform.returnLastStatement(code);
        this.assertEquals(expected, transformed);
    },

    testWrapInFunction: function() {
        var code = "var z = foo + bar; baz.foo(z, 3);",
            expected = "function() {\nvar z = foo + bar; return baz.foo(z, 3);\n}",
            transformed = lively.ast.transform.wrapInFunction(code);
        this.assertEquals(expected, transformed);
    }

})

TestCase.subclass('lively.ast.tests.Querying',
'testing', {

    testDeclsAndRefsInTopLevelScope: function() {
        var code = "var x = 3;\n function baz(y) { var zork; return xxx + zork + x + y; }\nvar y = 4, z;\nbar = 'foo';"
        var ast = lively.ast.acorn.parse(code);
        var declsAndRefs = lively.ast.query.topLevelDeclsAndRefs(ast);

        var varDecls = declsAndRefs.varDecls;
        var varIds = declsAndRefs.varDecls.pluck('declarations').flatten().pluck("id").pluck("name");
        this.assertEquals(["x", "y", "z"], varIds, "var ids");

        var funcIds = declsAndRefs.funcDecls.pluck('id').pluck('name');
        this.assertEquals(["baz"], funcIds, "func ids");

        var refs = declsAndRefs.refs;
        var refIds = refs.pluck('name')
        this.assertEquals(["bar", "xxx", "x"], refIds, "ref ids");
    },

    testScopes: function() {
        var code = "var x = {y: 3}; function foo(y) { var foo = 3, baz = 5; x = 99; bar = 2; bar; Object.bar = 3; }";
        var ast = lively.ast.acorn.parse(code);
        var scope = lively.ast.query.scopes(ast);
        var expected = {
            node: ast,
            varDecls: [{declarations: [{id: {name: 'x'}}]}],
            funcDecls: [{id: {name: 'foo'}}],
            params: [],
            refs: [],
            subScopes: [{
                node: ast.body[1],
                varDecls: [{declarations: [{id: {name: 'foo'}}, {id: {name: 'baz'}}]}],
                funcDecls: [],
                params: [{name: "y"}],
                refs: [{name: "x"}, {name: "bar"}, {name: "bar"}, {name: "Object"}],                
            }]
        }

        this.assertMatches(expected, scope);

        // top level scope
        var varNames = scope.varDecls.pluck('declarations').flatten();
        this.assertEquals(1, varNames.length, 'root scope vars');
        var funcNames = scope.funcDecls.pluck('id').pluck('name');
        this.assertEquals(1, scope.funcDecls.length, 'root scope funcs');
        this.assertEquals(0, scope.params.length, 'root scope params');
        this.assertEquals(0, scope.refs.length, 'root scope refs');

        // sub scope
        this.assertEquals(1, scope.subScopes.length, 'subscope length');
        var subScope = scope.subScopes[0];
        var varNames = subScope.varDecls.pluck('declarations').flatten();
        this.assertEquals(2, varNames.length, 'subscope vars');
        this.assertEquals(0, subScope.funcDecls, 'subscope funcs');
        this.assertEquals(4, subScope.refs.length, 'subscope refs');
        this.assertEquals(1, subScope.params.length, 'subscope params');
    },

    testFindGlobalVars: function() {
        var code = "var margin = {top: 20, right: 20, bottom: 30, left: 40},\n"
                 + "    width = 960 - margin.left - margin.right,\n"
                 + "    height = 500 - margin.top - margin.bottom;\n"
                 + "function blup() {}\n"
                 + "foo + String(baz) + foo + height;\n"
        var result = lively.ast.query.findGlobalVarRefs(code);

        var expected = [{start:169,end:172, name:"foo", type:"Identifier"},
                        {start:182,end:185, name:"baz", type:"Identifier"},
                        {start:189,end:192, name:"foo", type:"Identifier"}];

        this.assertEqualState(expected, result);
    },

    testRecognizeFunctionDeclaration: function() {
        var code = "this.addScript(function run(n) { if (n > 0) run(n-1); show('done'); });",
            result = lively.ast.query.topLevelDeclsAndRefs(code),
            expected = ["show"];
        this.assertEqualState(expected, result.undeclaredNames);
    },

    testRecognizeArrowFunctionDeclaration: function() {
        var code = "this.addScript((n, run) => { if (n > 0) run(n-1); show('done'); });",
            result = lively.ast.query.topLevelDeclsAndRefs(code),
            expected = ["show"];
        this.assertEqualState(expected, result.undeclaredNames);
    },

    testRecognizeClassDeclaration: function() {
        var code = "class Foo {\n" + "  constructor(name) { this.name = name; }\n" + "}\n"+ "new Foo();",
            result = lively.ast.query.topLevelDeclsAndRefs(code),
            expected = [];
        this.assertEqualState(expected, result.undeclaredNames);
    },

    testFindNodesIncludingLines: function() {
      var code = "var x = {\n  f: function(a) {\n    return 23;\n  }\n}\n";

      var expected1 = ["Program","VariableDeclaration","VariableDeclarator","ObjectExpression","FunctionExpression","BlockStatement","ReturnStatement","Literal"],
          nodes1 = lively.ast.query.findNodesIncludingLines(null, code, [3]);
      this.assertEqualState(expected1, nodes1.pluck("type"));

      var expected2 = ["Program","VariableDeclaration","VariableDeclarator","ObjectExpression"],
          nodes2 = lively.ast.query.findNodesIncludingLines(null, code, [3,5]);
      this.assertEqualState(expected2, nodes2.pluck("type"));
    }

});

}); // end of module
