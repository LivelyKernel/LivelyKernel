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
        var src = 'var x = 3; // comment1\n// comment1\nfunction foo() { var y = 3; /*comment2*/ return y }; x + foo();',
            ast = lively.ast.acorn.parse(src, {withComments: true}),
            comments = ast.comments,
            expectedTopLevelComments = [{
              start: 11, end: 22,
              isBlock: false, text: " comment1"
            },{
              start: 23, end: 34,
              isBlock: false, text: " comment1"
            }],
            expectedScopedComments = [{
              start: 63, end: 75,
              isBlock: true, text: "comment2"
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
        var ast               = lively.ast.acorn.parse("var y, z = foo + bar; baz.foo(z, 3)"),
            expected          = "Global.y = undefined;\nGlobal.z = foo + bar;\nbaz.foo(z, 3);",
            result            = lively.ast.transform.replaceTopLevelVarDeclsWithAssignment(ast, {name: "Global", type: "Identifier"});

        this.assertEquals(expected, result.source);
    },

    testTransformTopLevelVarAndFuncDeclsForCapturing: function() {
        var ast               = lively.ast.acorn.parse("var z = 3, y = 4; function foo() { var x = 5; }"),
            expected          = "Global.foo = foo;\nGlobal.z = 3;\nGlobal.y = 4;\nfunction foo() {\n    var x = 5;\n}",
            recorder          = {name: "Global", type: "Identifier"},
            result            = lively.ast.transform.replaceTopLevelVarDeclsWithAssignment(ast, recorder);
        this.assertEquals(expected, result.source);
    },

    testTransformTopLevelVarDeclsAndVarUsageForCapturing: function() {
        var code              = "var z = 3, y = 4; function foo(y) { var x = 5 + z + y; }",
            ast               = lively.ast.acorn.parse(code, {addSource: true}),
            expected          = "Global.foo = foo;\nGlobal.z = 3;\nGlobal.y = 4; function foo(y) { var x = 5 + Global.z + y; }",
            recorder          = {name: "Global", type: "Identifier"},
            result            = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(code, recorder);

        this.assertEquals(expected, result.source);
    },

    testTransformToReturnLastStatement: function() {
        var code = "var z = foo + bar; baz.foo(z, 3)",
            expected = "var z = foo + bar; return baz.foo(z, 3)",
            transformed = lively.ast.transform.returnLastStatement(code);
        this.assertEquals(expected, transformed);
    }

})

TestCase.subclass('lively.ast.tests.Querying',
'testing', {

    testTopLevelDeclarations: function() {
        var code = "var x = 3;\n function baz() { var zork; return xxx; }\nvar y = 4, z;\nbar = 'foo';"
        var ast = lively.ast.acorn.parse(code);
        var decls = lively.ast.query.topLevelDecls(ast);
        var ids = decls.map(function(ea) {
            return ea.type === 'FunctionDeclaration' ?
                ea.id.name :
                ea.declarations.map(function(ea) { return ea.id.name; });
        }).flatten();
        var expected = ["x", "y", "z", "baz"];
        this.assertEquals(expected, ids, "1");
    },

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
        this.assertEquals(["bar", "x"], refIds, "ref ids");
    },

    testScopes: function() {
        var code = "var x = 3; function foo(y) { var foo = 3, baz = 5; x = 99; bar = 2; bar; Object.bar = 3; }";
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
    }

});

}); // end of module
