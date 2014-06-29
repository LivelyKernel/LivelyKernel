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

    testReplaceNode: function() {
        var code = 'var x = 3 + foo();',
            ast = lively.ast.acorn.parse(code),
            toReplace = ast.body[0].declarations[0].init.left,
            replacement = {type: "Literal", value: "baz"},
            result = lively.ast.transform.replaceNode(ast, toReplace, replacement),
            transformedString = lively.ast.acorn.stringify(result.ast),
            expected = 'var x = \'baz\' + foo();'

        this.assertEquals(expected, transformedString);
    },

    testReplaceNodeKeepsSourceFormatting: function() {
        var code              = 'var x = 3\n+ foo();',
            ast               = lively.ast.acorn.parse(code, {addSource: true}),
            toReplace         = ast.body[0].declarations[0].init.left,
            replacement       = {type: "Literal", value: "baz"},
            result            = lively.ast.transform.replaceNode(ast, toReplace, replacement, {source: code}),
            expected          = 'var x = \'baz\'\n+ foo();';

        this.assertEquals(expected, result.source);
    },

    testReplaceNodeWithMany: function() {
        var code = 'var x = 3, y = 2;',
            ast = lively.ast.acorn.parse(code),
            toReplace = ast.body[0],
            replacement1 = lively.ast.acorn.parse("Global.x = 3").body[0],
            replacement2 = lively.ast.acorn.parse("Global.y = 2").body[0],
            replacement = [replacement1, replacement2],
            result = lively.ast.transform.replaceNodeWithMany(ast, toReplace, replacement),
            transformedString = lively.ast.acorn.stringify(result.ast),
            expected = 'Global.x = 3;\nGlobal.y = 2;'

        this.assertEquals(expected, transformedString);
    },

    testReplaceNodeWithManyKeepsSource: function() {
        var code = '/*bla\nbla*/\n  var x = 3,\n      y = 2;',
            ast = lively.ast.acorn.parse(code),
            toReplace = ast.body[0],
            replacement = [lively.ast.acorn.parse("Global.x = 3").body[0],
                           lively.ast.acorn.parse("Global.y = 2").body[0]],
            result = lively.ast.transform.replaceNodeWithMany(ast, toReplace, replacement, {source: code}),
            expected = '/*bla\nbla*/\n  Global.x = 3;\n  Global.y = 2;'

        this.assertEquals(expected, result.source);
    },

    testOneVarDeclaratorPerDeclaration: function() {
        var code = '/*test*/var x = 3, y = 2;',
            ast = lively.ast.acorn.parse(code),
            result = lively.ast.transform.oneDeclaratorPerVarDecl(ast, {source: code}),
            expected = '/*test*/var x = 3;\nvar y = 2;'

        this.assertEquals(expected, result.source);
    },

    testTransformToReturnLastStatement: function() {
        var code = "var z = foo + bar; baz.foo(z, 3)",
            expected = "var z = foo + bar; return baz.foo(z, 3)",
            transformed = lively.ast.transform.returnLastStatement(code);
        this.assertEquals(expected, transformed);
    },

    testTransformTopLevelVarDeclsForCapturing: function() {
        var ast               = lively.ast.acorn.parse("var y, z = foo + bar; baz.foo(z, 3)"),
            expected          = "Global.y = undefined;\nGlobal.z = foo + bar;\nbaz.foo(z, 3);",
            result            = lively.ast.transform.replaceTopLevelVarDeclsWithAssignment(ast, {name: "Global", type: "Identifier"}),
            transformedString = lively.ast.acorn.stringify(result.ast);
        this.assertEquals(expected, transformedString);
    },

    testTransformTopLevelVarDeclsAndVarUsageForCapturing: function() {
        var ast               = lively.ast.acorn.parse("var z = 3, y = 4; function foo(y) { var x = 5 + z + y; }"),
            expected          = "Global.foo = foo;\nGlobal.z = 3;\nGlobal.y = 4;\nfunction foo(y) {\n    var x = 5 +Global.z + y;\n}",
            recorder          = {name: "Global", type: "Identifier"},
            result            = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(ast, recorder),
            transformedString = lively.ast.acorn.stringify(result.ast);

        this.assertEquals(expected, transformedString);
    },

    testTransformTopLevelVarAndFuncDeclsForCapturing: function() {
        var ast               = lively.ast.acorn.parse("var z = 3, y = 4; function foo() { var x = 5; }"),
            expected          = "Global.foo = foo;\nGlobal.z = 3;\nGlobal.y = 4;\nfunction foo() {\n    var x = 5;\n}",
            recorder          = {name: "Global", type: "Identifier"},
            result            = lively.ast.transform.replaceTopLevelVarDeclsWithAssignment(ast, recorder),
            transformedString = lively.ast.acorn.stringify(result.ast);
        this.assertEquals(expected, transformedString);
    }

})

TestCase.subclass('lively.ast.tests.Querying',
'testing', {

    testFindVarDeclarationsInScopes: function() {

        var code = "var decl1 = {prop: 23};\n"
                 + "function foo(arg1, arg2) {\n"
                 + "    var decl2;\n"
                 + "    var decl3 = 23, decl4 = 42;\n"
                 + "    return decl3 + decl4;\n"
                 + "    function xxx() { return this.yyy }\n"
                 + "}\n";

        var ast = acorn.walk.addSource(code, null, null, true);

        var result = lively.ast.query.declsAt(0, ast);
        var expected = [{declarations: [{id: {name: "decl1"}}]}, {id: {name: "foo"}}];
        this.assertMatches(expected, result, "1");
        this.assertEquals(2, result.length, '1 length');

        var result = lively.ast.query.declsAt(65, ast);
        var expected = ["decl1", "foo", "decl2", "xxx"];
        var expected = [{declarations: [{id: {name: "decl1"}}]}, {id: {name: "foo"}},
                        {declarations: [{id: {name: "decl2"}}]},
                        {declarations: [{id: {name: "decl3"}}, {id: {name: "decl4"}}]},
                        {id: {name: "xxx"}}];
        this.assertMatches(expected, result, "2");
    },

    testFindTopLevelDeclarations: function() {
        var code = "var x = 3;\n function baz() { var zork; return xxx; }\nvar y = 4, z;\nbar = 'foo';"
        var ast = lively.ast.acorn.parse(code);
        var decls = lively.ast.query.topLevelDecls(ast);
        var ids = decls.map(function(ea) {
            return ea.type === 'FunctionDeclaration' ?
                ea.id.name :
                ea.declarations.map(function(ea) { return ea.id.name; });
        }).flatten();
        var expected = ["x", "baz", "y", "z"];
        this.assertEquals(expected, ids, "1");
    }

});

TestCase.subclass('lively.ast.tests.AstTests.ClosureTest',
'testing', {

    test02RecreateClosure: function() {
        var f = function() { var x = 3; return x + y },
            closure = lively.Closure.fromFunction(f, {y: 2}),
            f2 = closure.recreateFunc();
        this.assertEquals(f.toString(), f2.toString());
        this.assertEquals(5, f2());
    },

    test03ClosureCanBindThis: function() {
        var obj = {},
            closure = lively.Closure.fromFunction(function() { this.testCalled = true }, {'this': obj});
        obj.foo = closure.recreateFunc();
        obj.foo();
        this.assert(obj.testCalled, 'this not bound');
    },

    test04LateBoundThis: function() {
        var obj = {name: 'obj1'},
            closure = lively.Closure.fromFunction(function() { return this.name }, {'this': obj});
        obj.foo = closure.recreateFunc();
        this.assertEquals('obj1', obj.foo());
        var obj2 = Object.inherit(obj);
        obj2.name = 'obj2';
        this.assertEquals('obj2', obj2.foo());
    },

    test05ThisBoundInSuper: function() {
        var obj1 = {bar: function bar() { this.foo = 1 }.asScript()},
            obj2 = Object.inherit(obj1);
        obj2.bar = function bar() { $super() }.asScriptOf(obj2);
        obj2.bar();
        this.assertEquals(1, obj2.foo);
        this.assert(!obj1.foo, 'foo was set in obj1');
        this.assert(obj2.hasOwnProperty('foo'), 'foo not set in obj2')
    },

    test06SuperBoundStatically: function() {
        var obj1 = {bar: function bar() { this.foo = 1 }.asScript()},
            obj2 = Object.inherit(obj1),
            obj3 = Object.inherit(obj2);
        obj2.bar = function bar() { $super() }.asScriptOf(obj2);
        obj3.bar();
        this.assertEquals(1, obj3.foo);
        this.assert(!obj1.foo, 'foo was set in obj1');
        this.assert(obj2.hasOwnProperty('foo'), 'foo was not set in obj2');
        this.assert(!obj3.hasOwnProperty('foo'), 'foo was set in obj3');
    },

    test07StoreFunctionProperties: function() {
        var func = function() { return 99 };
        func.someProperty = 'foo';
        var closure = lively.Closure.fromFunction(func),
            recreated = closure.recreateFunc();
        this.assertEquals('foo', recreated.someProperty);
    },

    test08SuperBoundAndAsArgument: function() {
        var obj = {
            m: function($super) {
                this.mWasCalled = true;
                $super();
            }.binds({$super: function() { this.superWasCalled = true }})
        }
        obj.m();
        this.assert(obj.mWasCalled, 'm not called');
        if (Global.superWasCalled) {
            delete Global.superWasCalled;
            this.assert(false, 'this not bound in super');
        }
        this.assert(obj.superWasCalled, 'super was not called');
    }

});

}) // end of module
