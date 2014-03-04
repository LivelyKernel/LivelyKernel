module('lively.ast.tests.RewriterTests').requires('lively.ast.Rewriting', 'lively.ast.StackReification', 'lively.ast.AstHelper', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ast.tests.RewriterTests.AcornRewrite',
'running', {

    setUp: function($super) {
        $super();
        this.parser = lively.ast.acorn;
        this.rewrite = function(node) { return lively.ast.Rewriting.rewrite(node, astRegistry); };
        this.oldAstRegistry = lively.ast.Rewriting.getCurrentASTRegistry();
        var astRegistry = this.astRegistry = [];
        lively.ast.Rewriting.setCurrentASTRegistry(astRegistry);
    },

    tearDown: function($super) {
        $super();
        lively.ast.Rewriting.setCurrentASTRegistry(this.oldAstRegistry);
    }

},
'matching code', {

    tryCatch: function(level, varMapping, inner) {
        level = level || 0;
        return Strings.format("try {\n"
            + "var _ = {}, lastNode = undefined, debugging = false, __%s = [], _%s = %s;\n"
            + "__%s.push(_, _%s, %s);\n"
            + "%s"
            + "} catch (e) {\n"
            + "    var ex = e.isUnwindException ? e : new UnwindException(e);\n"
            + "    ex.createAndShiftFrame(this, arguments, __%s, lastNode, %s);\n"
            + "    throw ex;\n"
            + "}\n",
            level, level, generateVarMappingString(), level, level,
            level-1 < 0 ? 'Global' : '__' + (level-1),
            inner, level, "__/[0-9]+/__");
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function generateVarMappingString() {
            if (!varMapping) return '{}';
            var ast = {
                type: "ObjectExpression",
                properties: Object.keys(varMapping).map(function(k) {
                    return {
                        kind: "init",
                        key: {type: "Literal",value: k},
                        value: {name: varMapping[k],type: "Identifier"}
                    }
                })
            };
            return escodegen.generate(ast);
        }
    },

    catchIntro: function(level, catchVar, storeResult) {
        storeResult = storeResult == null ? true : !!storeResult;
        return Strings.format("var _%s = { '%s': %s.isUnwindException ? %s.error : %s };\n"
            + "if (_%s['%s'].toString() == 'Debugger')\n"
            + "    throw %s;\n"
            + (storeResult ? this.pcAdvance() + ";\n"
                + "__%s = [\n"
                + "    _,\n"
                + "    _%s,\n"
                + "    __%s\n"
                + "];\n" : ""),
            level, catchVar, catchVar, catchVar, catchVar,
            level, catchVar, catchVar, level - 1, level, level - 1);
    },

    catchOutro: function(level) {
        return "__" + (level - 1) + " = __" + (level - 1) + "[2];\n";
    },

    finallyWrapper: function(stmts) {
        return 'if (!debugging) {\n' +
            stmts +
            '}\n';
    },

    debuggerThrow: function() {
        return "{\n" +
            "debugging = true;\n" +
            this.intermediateResult('undefined;\n') +
            "throw {\n" +
            "toString: function () {\n" +
            "return 'Debugger';\n" +
            "},\n" +
            "astIndex: __/[0-9]+/__\n" +
            "};\n" +
            "}\n";
    },

    closureWrapper: function(level, name, args, innerVarDecl, inner) {
        // something like:
        // __createClosure(333, __0, function () {
        //     try {
        //         var _ = {}, _1 = {}, __1 = [_,_1,__0];
        //     ___ DO INNER HERE ___
        //     } catch (e) {...}
        // })
        var argDecl = innerVarDecl || {};
        args.forEach(function(argName) { argDecl[argName] = argName; });
        return Strings.format(
            "__createClosure(__/[0-9]+/__, __%s, function %s(%s) {\n"
          + this.tryCatch(level+1, argDecl, inner)
          + "})", level, name, args.join(', '));
    },

    intermediateResult: function(expression, optionalAstIndex) {
        // like _[lastNode = 7] = 42; <-- the value stored in lastNode and the _ object is the AST index
        return "_[" + this.pcAdvance(optionalAstIndex) + "] = " + expression;
    },

    intermediateReference: function(optionalAstIndex) {
        // like _[7] <-- the value stored in the _ object is the AST index
        var astIndexMatcher = optionalAstIndex || "__/[0-9]+/__";
        return "_[" + astIndexMatcher + "]";
    },

    pcAdvance: function(optionalAstIndex) {
        // like lastNode = 7 <-- the value stored in lastNode is the AST index
        var astIndexMatcher = optionalAstIndex || "__/[0-9]+/__";
        return "lastNode = " + astIndexMatcher;
    },

    setVar: function(level, varName, inner) {
        return Strings.format("_%s.%s = %s", level, varName, inner);
    },

    getVar: function(level, varName) {
        return Strings.format("_%s.%s", level, varName);
    }

},
'helping', {

    assertASTMatchesCode: function(ast, code, msg) {
        var genCode = escodegen.generate(ast);
        var match = Strings.stringMatch(genCode.trim(), code.trim(), {ignoreIndent: true});
        if (match.matched) return;
        this.assert(false,
            'ast does not match code:\n  '
           + (msg ? msg + '\n' : '')
           + '\npattern:\n  ' + Strings.print(match.pattern) + '\nerror:\n  ' + Strings.print(match.error));
    },

    assertAstNodesEqual: function(node1, node2, msg) {
        var notEqual = lively.ast.acorn.compareAst(node1, node2);
        if (!notEqual) return;
        this.assert(false, 'nodes not equal: ' + (msg ? '\n  ' + msg : '') + '\n  ' + notEqual.join('\n  '));
    },

    assertAstReference: function(entry, msg) {
        var isReference = entry.hasOwnProperty('registryRef') && entry.hasOwnProperty('indexRef');
        this.assert(isReference, msg || 'registry entry is no reference');
    }

},
'testing', {

    test01WrapperTest: function() {
        var ast = this.parser.parse('12345;'),
            result = this.rewrite(ast);
        this.assertASTMatchesCode(result, this.tryCatch(0, null, '12345;\n'))
    },

    test02LocalVarTest: function() {
        var src = 'var i = 0; i;',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {'i': 'undefined'},
                        this.intermediateResult(
                            this.setVar(0, 'i', '0;\n')
                          + this.getVar(0, 'i')
                          + ';\n', 3/*astIndex of "var i = 0"*/));
        this.assertASTMatchesCode(result, expected);
    },

    test03GlobalVarTest: function() {
        var src = 'i;',
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertASTMatchesCode(result, this.tryCatch(0, null, 'i;\n'));
    },

    test04MultiVarDeclarationTest: function() {
        var src = 'var i = 0, j;',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {'i': 'undefined', 'j': 'undefined'},
                this.intermediateResult(this.setVar(0, 'i', '0, ')) +
                this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test05FunctionDeclarationTest: function() {
        var src = 'function fn(k, l) {}',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {'fn': this.closureWrapper(0, 'fn', ['k', 'l'], {}, "")},
                this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test06ScopedVariableTest: function() {
        var src = 'var i = 0; function fn() {var i = 1;}',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {
                'i': 'undefined',
                'fn': this.closureWrapper(0, 'fn', [], {i: 'undefined'},
                    this.intermediateResult(this.setVar(1, 'i', '1;\n')))
            }, this.intermediateResult(this.setVar(0, 'i', '0;\n')) + this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test07UpperScopedVariableTest: function() {
        var src = 'var i = 0; function fn() {i;}',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {
                'i': 'undefined',
                'fn': this.closureWrapper(0, 'fn', [], {}, this.getVar(0, 'i') + ';\n')
            }, this.intermediateResult(this.setVar(0, 'i', '0;\n')) + this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test08ForWithVarDeclarationTest: function() {
        var src = 'for (var i = 0; i < 10; i++) {}',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {'i': 'undefined'},
                "for ("
              + this.intermediateResult(this.setVar(0, 'i', "0; "))
              + this.getVar(0, 'i') + ' < 10; '
              + this.intermediateResult(this.getVar(0, 'i') + '++')
              + ") {\n}\n");
        this.assertASTMatchesCode(result, expected);
    },

    test09aForInWithVarDeclarationTest: function() {
        var src = 'for (var key in obj) {}',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {'key': 'undefined'},
                "for ("
              + this.getVar(0, 'key') + ' in obj'
              + ") {\n"
              + this.intermediateResult(this.intermediateReference() + ' || Object.keys(obj);\n')
              + this.intermediateReference() + '.shift();\n'
              + "}\n");
        this.assertASTMatchesCode(result, expected);
    },

    test09bForInWithoutCurlys: function() {
        var src = "for (var key in obj) 1;\n",
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {'key': 'undefined'},
                "for ("
              + this.getVar(0, 'key') + ' in obj'
              + ") {\n"
              + this.intermediateResult(this.intermediateReference() + ' || Object.keys(obj);\n')
              + "1;\n"
              + this.intermediateReference() + '.shift();\n'
              + "}\n");
        this.assertASTMatchesCode(result, expected);
    },

    test10EmptyForTest: function() {
        var src = 'for (;;) {}',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {}, "for (;;) {\n}\n");
        this.assertASTMatchesCode(result, expected);
    },

    test11FunctionAssignmentTest: function() {
        var src = 'var foo = function bar() {}',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {'foo': 'undefined'},
                this.intermediateResult(
                    this.setVar(0, 'foo', 
                        this.intermediateResult(
                            this.closureWrapper(0, 'bar', [], {}, "")))) + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test12FunctionAsParameterTest: function() {
        var src = 'fn(function () {});',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {},
                this.intermediateResult(
                    "fn("
                  + this.intermediateResult(
                      this.closureWrapper(0, '', [], {}, "") + ');\n')));
        this.assertASTMatchesCode(result, expected);
    },

    test13FunctionAsPropertyTest: function() {
        var src = '({fn: function () {}});',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {},
                "({\nfn: "
                + this.intermediateResult(
                      this.closureWrapper(0, '', [], {}, "") + '\n')
                + "});\n");
        this.assertASTMatchesCode(result, expected);
    },

    test14FunctionAsSetterGetterTest: function() {
        var src = '({get foo() {}, set bar(val) {val++;}});',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {},
                "({\n"
                + "get foo() {\n" + this.tryCatch(1, {}, "") + "},\n"
                + "set bar(val) {\n" + this.tryCatch(1, {val: 'val'},
                        this.intermediateResult(
                            this.getVar(1, 'val') + '++;\n')) + '}\n'
                + "});\n");
        this.assertASTMatchesCode(result, expected);
    },

    test15FunctionAsReturnArgumentTest: function() {
        var src = '(function () {return function() {};});',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {},
                this.intermediateResult(
                      this.closureWrapper(0, '', [], {},
                      "return " + this.intermediateResult(
                          this.closureWrapper(1, '', [], {}, "") + ';\n')) + ';\n'));
        this.assertASTMatchesCode(result, expected);
    },

    test16FunctionInConditionalTest: function() {
        var src = 'true ? function() {} : 23;',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {},
                "true ? "
              + this.intermediateResult(
                  this.closureWrapper(0, '', [], {},"") + ' : 23;\n'));
        this.assertASTMatchesCode(result, expected);
    },

    test17ClosureCallTest: function() {
        var src = '(function() {})();',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {},
                this.intermediateResult(
                    '('
                    + this.intermediateResult(
                        this.closureWrapper(0, '', [], {},""))
                    + ")();\n"));
        this.assertASTMatchesCode(result, expected);
    },

    test18MemberChainSolvingTest: function() {
        var src = 'var lively, ast, morphic; lively.ast.morphic;',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {lively: 'undefined', ast: 'undefined', morphic: 'undefined'},
                this.pcAdvance() + ', ' +   // for lively
                this.pcAdvance() + ', ' +   // for ast
                this.pcAdvance() + ';\n' +  // for morphic
                // FIXME: shouldn't there be a pc advance for lively.ast.morphic?
                this.getVar(0, 'lively') + '.ast.morphic;\n');
        this.assertASTMatchesCode(result, expected);
    },

    test19FunctionInMemberChainTest: function() {
        var src = '(function() {}).toString();',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {},
              this.intermediateResult(
                    "("
                  + this.intermediateResult(
                        this.closureWrapper(0, '', [], {}, "")))
                  + ").toString();\n");
        this.assertASTMatchesCode(result, expected);
    },

    test20ObjectPropertyNamingTest: function() {
        var src = 'var foo; ({foo: foo});',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {foo: 'undefined'},
                this.pcAdvance() + ';\n' +
                "({ foo: " + this.getVar(0, 'foo') + ' });\n');
        this.assertASTMatchesCode(result, expected);
    },

    test21FunctionAsArrayElementTest: function() {
        var src = '[function() {}];',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {},
                "[" + this.intermediateResult(this.closureWrapper(0, '', [], {}, "")) + '];\n');
        this.assertASTMatchesCode(result, expected);
    },

    test22aLocalFunctionCall: function() {
        // test if the "return g();" is translated to "return _0["g"].call();"
        var func = function() { function g() {}; return g(); }, returnStmt;
        func.stackCaptureMode();
        acorn.walk.simple(func.asRewrittenClosure().ast, {ReturnStatement: function(n) { returnStmt = n; }})
        var expected = "return " + this.intermediateResult(this.getVar(0, 'g')) + '.call(Global);';
        this.assertASTMatchesCode(returnStmt, expected);
    },

    test22bGlobalFunctionCall: function() {
        var func = function() { return g(); }, returnStmt;
        func.stackCaptureMode();
        acorn.walk.simple(func.asRewrittenClosure().ast, {ReturnStatement: function(n) { returnStmt = n; }})
        var expected = "return " + this.intermediateResult('g') + '();';
        this.assertASTMatchesCode(returnStmt, expected);
    },

    test23FunctionDeclarationAfterUse: function() {
        var src = 'foo(); function foo() { }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { 'foo': this.closureWrapper(0, 'foo', [], {}, "") },
                this.intermediateResult(this.getVar(0, 'foo') + '.call(Global);\n') +
                this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test24FunctionReDeclaration: function() {
        var src = 'function foo() { 1; } foo(); function foo() { 2; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { 'foo': this.closureWrapper(0, 'foo', [], {}, "2;\n") },
                this.pcAdvance() + ';\n' +
                this.intermediateResult(this.getVar(0, 'foo') + '.call(Global);\n') +
                this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test25aNoRewritePrefixFunctionDecl: function() {
        var src = 'var a, b; function _NO_REWRITE_foo(a, b) { return a + b; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, {
                'a': 'undefined',
                'b': 'undefined',
                '_NO_REWRITE_foo': 'function _NO_REWRITE_foo(a, b) {\nreturn a + b;\n}'
            }, this.pcAdvance() + ', ' + this.pcAdvance() + ';\n' + this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test25bNoRewritePrefixFunctionExpr: function() {
        var src = 'var bar = function _NO_REWRITE_foo(a, b) { return a + b; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { 'bar': 'undefined' },
                this.intermediateResult(
                    this.setVar(0, 'bar',
                        this.intermediateResult('function _NO_REWRITE_foo(a, b) {\nreturn a + b;\n};\n'))));
        this.assertASTMatchesCode(result, expected);
    },

    test26CompressedAstRegistryRewrite: function() {
        var registry = lively.ast.Rewriting.getCurrentASTRegistry();
        this.assertEquals(0, registry.length, 'registry not empty at the beginning');

        var src = 'function foo() { 2; } var bar = function() { 1; };',
            ast = this.parser.parse(src);
        this.rewrite(ast);
        this.assertEquals(3, registry.length, 'registry has wrong size after rewrite');
        this.assertAstReference(registry[1], 'FunctionDeclaration is no reference');
        this.assertAstReference(registry[2], 'FunctionExpression is no reference');

        var refAst = registry[registry[1].registryRef],
            refAstIndex = registry[1].indexRef,
            result = acorn.walk.findNodeByAstIndex(refAst, refAstIndex),
            expected = registry[0].body[0];
        this.assertEquals(result, expected, 'FunctionDeclaration reference not correct');

        refAst = registry[registry[2].registryRef];
        refAstIndex = registry[2].indexRef;
        result = acorn.walk.findNodeByAstIndex(refAst, refAstIndex);
        expected = registry[0].body[1].declarations[0].init;
        this.assertEquals(result, expected, 'FunctionExpression reference not correct');
    },

    test27aReferencingArguments: function() {
        var src = 'function foo() { arguments; arguments[0]; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { 'foo': this.closureWrapper(0, 'foo', [], {},
                'arguments;\n' +
                'arguments[0];\n'
            ) }, this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test27bRedeclaringArguments: function() {
        var src = 'function foo() { var arguments; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { 'foo': this.closureWrapper(0, 'foo', [], {},
                this.pcAdvance() + ';\n'
            ) }, this.pcAdvance() + ';\n');
        this.assertASTMatchesCode(result, expected);
    },

    test28TryAndCatchErrorRecovery: function() {
        var src = 'try { } catch (e) { }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { },
                'try {\n' +
                '} catch (e) {\n' +
                this.catchIntro(1, 'e') +
                this.catchOutro(1) +
                '}\n'
            );
        this.assertASTMatchesCode(result, expected);
    },

    test29aTryFinallyAndDebugger: function() {
        var src = 'try { debugger; } finally { 1; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { },
                'try {\n' +
                this.debuggerThrow() +
                '} catch (e) {\n' +
                this.catchIntro(1,'e', false) +
                '} finally {\n' +
                this.finallyWrapper('1;\n') +
                '}\n'
            );
        this.assertASTMatchesCode(result, expected);
    },

    test29bTryCatchFinallyAndDebugger: function() {
        var src = 'try { debugger; } catch (e) { 1; } finally { 2; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { },
                'try {\n' +
                this.debuggerThrow() +
                '} catch (e) {\n' +
                this.catchIntro(1, 'e') +
                '1;\n' +
                this.catchOutro(1) +
                '} finally {\n' +
                this.finallyWrapper('2;\n') +
                '}\n'
            );
        this.assertASTMatchesCode(result, expected);
    },

    test30aWithStatement: function() {
        var src = 'var a = 1; with ({ a: 2 }) { a; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { 'a': 'undefined' },
                this.intermediateResult(this.setVar(0, 'a', "1;\n")) +
                "{\n" +
                "var _1 = { a: 2 };\n" +
                "__0 = [\n" +
                "    _,\n" +
                "    _1,\n" +
                "    __0\n" +
                "];\n" +
                "('a' in _1 ? _1 : _0).a;\n" +
                "__0 = __0[2];\n" +
                "}\n"
            );
        this.assertASTMatchesCode(result, expected);
    },

    test30bNestedWithStatements: function() {
        var src = 'var a = 1; with ({ a: 2 }) { with ({ b: 3 }) { a; } }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { 'a': 'undefined' },
                this.intermediateResult(this.setVar(0, 'a', "1;\n")) +
                "{\n" +
                "var _1 = { a: 2 };\n" +
                "__0 = [\n" +
                "    _,\n" +
                "    _1,\n" +
                "    __0\n" +
                "];\n" +
                "{\n" +
                "var _2 = { b: 3 };\n" +
                "__0 = [\n" +
                "    _,\n" +
                "    _2,\n" +
                "    __0\n" +
                "];\n" +
                "('a' in _2 ? _2 : 'a' in _1 ? _1 : _0).a;\n" +
                "__0 = __0[2];\n" +
                "}\n" +
                "__0 = __0[2];\n" +
                "}\n"
            );
        this.assertASTMatchesCode(result, expected);
    },

    test30cWithStatementWithoutDeclaredVar: function() {
        var src = 'with ({ a: 1 }) { a; }',
            ast = this.parser.parse(src),
            result = this.rewrite(ast),
            expected = this.tryCatch(0, { },
                "{\n" +
                "var _1 = { a: 1 };\n" +
                "__0 = [\n" +
                "    _,\n" +
                "    _1,\n" +
                "    __0\n" +
                "];\n" +
                "('a' in _1 ? _1 : { 'a': a }).a;\n" +
                "__0 = __0[2];\n" +
                "}\n"
            );
        console.log(escodegen.generate(result));
        this.assertASTMatchesCode(result, expected);
    }

});

TestCase.subclass('lively.ast.tests.RewriterTests.AcornRewriteExecution',
// checks that rewritten code doesn't introduce semantic changes
'running', {

    setUp: function($super) {
        $super();
        this.parser = lively.ast.acorn;
        this.rewrite = function(node) { return lively.ast.Rewriting.rewrite(node, astRegistry); };
        this.oldAstRegistry = lively.ast.Rewriting.getCurrentASTRegistry();
        var astRegistry = this.astRegistry = [];
        lively.ast.Rewriting.setCurrentASTRegistry(astRegistry);
    },

    tearDown: function($super) {
        $super();
        lively.ast.Rewriting.setCurrentASTRegistry(this.oldAstRegistry);
    }

},
'testing', {

    test01LoopResult: function() {
        function code() {
            var result = 0;
            for (var i = 0; i < 10; i++) result += i;
            return result;
        }
        var src = Strings.format('(%s)();', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test02aFunctionArguments: function() {
        function code(a) {
            return a;
        }
        var src = Strings.format('(%s)(1);', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test02bFunctionArgumentsAndVar: function() {
        function code(a) {
            var a = 3;
            return a;
        }
        var src = Strings.format('(%s)(1);', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test02cFunctionArgumentsAndUndefinedVar: function() {
        function code(a) {
            var a;
            return a;
        }
        var src = Strings.format('(%s)(1);', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test02dFunctionArgumentsAndLateVarDef: function() {
        function code(a) {
            var b = a;
            var a = 3;
            return b + a;
        }
        var src = Strings.format('(%s)(1);', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test03ThrowOverFunctionBoundaries: function() {
        function code() {
            function thrower() {
                throw new Error('123');
            }
            try {
                thrower();
            } catch (e) {
                return e.message;
            }
            return '321';
        }
        var src = Strings.format('(%s)();', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test04aWithStatementScope: function() {
        function code() {
            var x = 1, y = 2, z, obj = { x: 3 };
            with (obj) {
                z = x + y;
            }
            return z;
        }
        var src = Strings.format('(%s)();', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test04bNestedWithStatementScope: function() {
        function code() {
            var x = 1, y = 2, z, obj1 = { x: 3 }, obj2 = { y: 4 };
            with (obj1) {
                with (obj2) {
                    z = x + y;
                }
                z += x + y;
            }
            return z;
        }
        var src = Strings.format('(%s)();', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test04cWithStatementFunctionExpression: function() {
        function code() {
            var x = 1;
            with ({ x: 2 }) {
                return (function foo() {
                    return x;
                })();
            }
        }
        var src = Strings.format('(%s)();', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    },

    test04dWithStatementPrototypeProperty: function() {
        function code() {
            var klass = function() {};
            klass.prototype.x = 2;
            var obj = new klass(), x = 1;
            with (obj) {
                return x;
            }
        }
        var src = Strings.format('(%s)();', code),
            src2 = escodegen.generate(this.rewrite(this.parser.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    }

});

TestCase.subclass('lively.ast.tests.RewriterTests.ContinuationTest',
'running', {

    setUp: function($super) {
        $super();
        this.oldAstRegistry = lively.ast.Rewriting.getCurrentASTRegistry();
        lively.ast.Rewriting.setCurrentASTRegistry(this.astRegistry = []);
    },

    tearDown: function($super) {
        $super();
        lively.ast.Rewriting.setCurrentASTRegistry(this.oldAstRegistry);
    }

},
'assertion', {

    assertAstNodesEqual: lively.ast.tests.RewriterTests.AcornRewrite.prototype.assertAstNodesEqual

},
'testing', {

    test01RunWithNoBreak: function() {
        function code() {
            var x = 2;
            return x + 4;
        }
        var expected = {
            isContinuation: false,
            returnValue: 6
        }

        var runResult = lively.ast.StackReification.run(code);
        this.assertEqualState(expected, runResult)
    },

    test02SimpleBreak: function() {
        // Program(12,"function code() { var x = 2; debu...")
        // \---.body[0]:FunctionDeclaration(11,"function code() { var x = 2; debu...")
        //     |---.id:Identifier(0,"code")
        //     \---.body:BlockStatement(10,"{ var x = 2; debugger; ...")
        //         |---.body[0]:VariableDeclaration(4,"var x = 2;")
        //         |   \---.declarations[0]:VariableDeclarator(3,"x = 2")
        //         |       |---.id:Identifier(1,"x")
        //         |       \---.init:Literal(2,"2")
        //         |---.body[1]:DebuggerStatement(5,"debugger;")
        //         \---.body[2]:ReturnStatement(9,"return x + 4;")
        //             \---.argument:BinaryExpression(8,"x + 4")
        //                 |---.left:Identifier(6,"x")
        //                 \---.right:Literal(7,"4")
        function code() {
            var x = 2;
            debugger;
            return x + 4;
        }

        var expected = { isContinuation: true },
            runResult = lively.ast.StackReification.run(code, this.astRegistry),
            frame = runResult.frames().first();
        this.assert(runResult.isContinuation, 'no continuation');

        // can we access the original ast, needed for resuming?
        var capturedAst = frame.getOriginalAst();
        this.assertAstNodesEqual(lively.ast.acorn.parseFunction(String(code)), capturedAst);

        // where did the execution stop?
        // this.assertIdentity(5, frame.getPC(), 'pc');
        this.assertIdentity(capturedAst.body.body[1], frame.getPC(), 'pc');
    },

    test03SimpleBreakInNestedFunction: function() {
        function code() {
            var x = 1;
            var f = function() {
                debugger;
                return x * 2;
            };
            var y = x + f();
            return y;
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            frame1 = continuation.frames()[0],
            frame2 = continuation.frames()[1];
        // frame state
        this.assertEquals(2, continuation.frames().length, 'number of captured frames');
        this.assertEquals(1, continuation.currentFrame.lookup('x'), 'val of x');
        this.assertEquals(undefined, continuation.currentFrame.lookup('y'), 'val of y');
        this.assertEquals(Global, continuation.currentFrame.getThis(), 'val of this');

        // captured asts
        var expectedAst = lively.ast.acorn.parseFunction('function() { debugger; return x * 2; }'),
            actualAst = frame1.getOriginalAst();
        this.assertAstNodesEqual(expectedAst, actualAst);
        this.assertAstNodesEqual(lively.ast.acorn.parseFunction(String(code)), frame2.getOriginalAst());

        // access the node where execution stopped
        var resumeNode = frame1.getPC(),
            debuggerNode = actualAst.body.body[0];
        this.assertAstNodesEqual(debuggerNode, resumeNode, 'resumeNode');
    },

    test04BreakAndContinue: function() {
        function code() {
            var x = 1;
            debugger;
            return x + 3;
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(4, result, 'resume not working');
    },

    test05BreakAndContinueWithForLoop: function() {
        function code() {
            var x = 1;
            for (var i = 0; i < 5; i++) {
                if (i == 3) debugger;
                x += i;
            }
            return x + 3;
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(14, result, 'resume not working');
    },

    test06BreakAndContinueWithWhileLoop: function() {
        function code() {
            var x = 1, i = 0;
            while (i < 5) {
                if (i == 3) debugger;
                x += i;
                i++;
            }
            return x + 3;
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(14, result, 'resume not working');
    },

    test07aBreakAndContinueWithForInLoop: function() {
        function code() {
            var x = 1,
                obj = { a: 1, b: 2, c: 3 };
            for (var i in obj) {
                if (i == 'b') debugger;
                x += obj[i];
            }
            return x + 3;
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(10, result, 'resume not working');
    },

    test07bBreakAndContinueWithForInWithMemberExprLoop: function() {
        function code() {
            var x = 1,
                obj = { a: 1, b: 2, c: 3 },
                obj2 = {};
            for (obj2.foo in obj) {
                if (obj2.foo == 'b') debugger;
                x += obj[obj2.foo];
            }
            return x + 3;
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(10, result, 'resume not working');
    },

    test08BreakAndContinueWithInnerFunction: function() {
        function code() {
            var x = 1;
            var f = function() {
                debugger;
                return x * 2;
            };
            var y = x + f();
            return y;
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(3, result, 'resume not working');
    },

    test09ReturnFunctionThatBreaksAndContinues: function() {
        function code() {
            var x = 3;
            return function() {
                debugger;
                return x * 2;
            };
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            func = continuation.returnValue;
        var continuation2 = lively.ast.StackReification.run(func, this.astRegistry),
            result = continuation2.resume();
        this.assertEquals(6, result, 'resume not working');
    },

    test10BreakAndContinueOfInnerFunction: function() {
        function code() {
            var x = 1;
            function f() { debugger; return x; }
            return (function() { var x = 2; return f(); })();
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(1, result, 'resume not working');
    },

    test11BreakAndContinueWithMultipleFramesAndScopes: function() {
        function code() {
            var x = 1, y = 2;
            function g() { debugger; return x; }
            function f() { var x = 3; return y + g(); }
            return (function() { var x = 2; return f(); })();
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry);
        var result = continuation.resume();
        this.assertEquals(3, result, 'resume not working');
    },

    test11ForEach: function() {
        function code() {
            var sum = 0;
            [1,2,3].forEach(function(ea) { sum += ea; if (ea === 2) debugger; });
            return sum;
        }
        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(6, result, 'resume not working');
    },

    test12IndependentFunctions: function() {
        var f1 = (function(x) { if (x === 1) debugger; return x + 1; }).stackCaptureMode(null, this.astRegistry),
            f2 = function() { return f1(0) + f1(1) + f1(2); };

        var continuation = lively.ast.StackReification.run(f2, this.astRegistry, null, { f1: f1 });
        continuation.frames().last().scope.set('f1', f1);
        var result = continuation.resume();
        this.assertEquals(6, result, 'resume not working');
    },

    test13aDebuggerInInterpretation: function() {
        function code() {
            var sum = 1; debugger; sum += 2; debugger; sum += 3; return sum;
        }
        var continuation1 = lively.ast.StackReification.run(code, this.astRegistry),
            continuation2 = continuation1.resume(),
            result = continuation2.resume();
        this.assertEquals(6, result, '2x resume not working');
    },

    test13bNestedDebuggerInInterpretation: function() {
        function code() {
            var sum = 1; debugger; (function() { sum += 2; debugger; })(); sum += 3; return sum;
        }

        var continuation1 = lively.ast.StackReification.run(code, this.astRegistry),
            continuation2 = continuation1.resume();
        this.assert(continuation2.currentFrame.getParentFrame() != null, 'nested frame was not created');
        var result = continuation2.resume();
        this.assertEquals(6, result, 'second resume not working');
    },

    test14ArgumentsInInterpretation: function() {
        function code() {
            var a = arguments[0]; debugger; return a + arguments[1];
        }
        var continuation = lively.ast.StackReification.run(code, this.astRegistry, [2, 3]),
            result = continuation.resume();
        this.assertEquals(5, result, 'accessing arguments not working');
    },

    test15TryFinallyExecution: function() {
        function code() {
            var a = 1;
            try {
                debugger;
            } catch (e) {
                a += 2;
            } finally {
                a += 3;
            }
            return a;
        }
        var continuation = lively.ast.StackReification.run(code, this.astRegistry);
        this.assertEquals(1, continuation.currentFrame.lookup('a'), 'execution of finally block was not prevented');
        var result = continuation.resume();
        this.assertEquals(4, result, 'try-finally was not resumed correctly');
    },

    test16aBreakAndContinueWithinCatch: function() {
        function code() {
            var a = 1;
            try {
                throw { b: 2 };
            } catch (e) {
                e.b = 3;
                debugger;
                a += e.b;
            } finally {
                a += 10;
            }
            return a;
        }
        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(14, result, 'try-catch did not resume correctly in catch');
    },

    test16bBreakAndContinueWithinFinally: function() {
        function code() {
            var a = 1;
            try {
                throw { b: 2 };
            } catch (e) {
                a += e.b;
            } finally {
                debugger;
                a += 3;
            }
            return a;
        }
        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(6, result, 'try-catch did not resume in finally');
    },

    test16cBreakAndContinueWithinCatchAfterVarReset: function() {
        function code() {
            var a = 1;
            try {
                throw 2;
            } catch (e) {
                e = 3;
                debugger;
                a += e;
            }
            return a;
        }
        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            result = continuation.resume();
        this.assertEquals(4, result, 'catch variable was not captured correctly');
    },

    test16dBreakAndContinueWithinCatchWithOverride: function() {
        function code() {
            var e = 1;
            try {
                throw 2;
            } catch (e) {
                debugger;
                e = 3;
            }
            return e;
        }
        var continuation = lively.ast.StackReification.run(code, this.astRegistry);
        this.assertEquals(2, continuation.currentFrame.lookup('e'), 'catch variable was not captured correctly');
        var result = continuation.resume();
        this.assertEquals(1, result, 'overridden catch variable was not restored correctly');
    },

    test17FrameStateAttachmentToFuncDecl: function() {
        function code() {
            function f() {}
            debugger;
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            frame = continuation.currentFrame,
            func = frame.lookup('f');
        this.assert(func, 'FunctionDeclaration f could not be found');
        this.assert(func._cachedScopeObject, 'parentFrameState was not attached correctly');
    },

    test18SteppingAfterContinuation: function() {
        function code() {
            var x = 2, y = 3;
            function f() {
                var x = 5;
                return x;
            }
            debugger;
            return x + f();
        }

        var continuation = lively.ast.StackReification.run(code, this.astRegistry),
            frame = continuation.currentFrame,
            interpreter = new lively.ast.AcornInterpreter.Interpreter(),
            ast = frame.getOriginalAst(),
            result;
        this.assertEquals(2, frame.lookup('x'), 'did not initialize x correctly');
        this.assertEquals(3, frame.lookup('y'), 'did not initialize y correctly');

        result = interpreter.stepToNextStatement(frame); // step over debugger statement
        this.assertEquals('Break', result.toString(), 'did not stop after debugger');
        this.assertEquals(ast.body.body[3], result.topFrame.getPC(), 'did not stop before return');
        result = interpreter.stepToNextCallOrStatement(frame);
        this.assertEquals('Break', result.toString(), 'did not stop at call');
        this.assertEquals(ast.body.body[1].body.body[0], result.topFrame.getPC(), 'did not step into f()');
        this.assertEquals(undefined, result.topFrame.lookup('x'), 'no new scope was created');
    }

});

}) // end of module
