/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module('lively.ast.tests.AstTests').requires('lively.ast.Parser', 'lively.ast.StackReification', 'lively.TestFramework', 'lively.ast.StaticAnalysis').toRun(function() {

TestCase.subclass('lively.ast.tests.AstTests.ParserTest',
'running', {
    setUp: function($super) {
        $super()
    },
},
'helper', {
    parseJS: function(src, rule) {
        return OMetaSupport.matchAllWithGrammar(LivelyJSParser, rule || 'topLevel', src)
    },
},
'testing', {
    test01ParseRegex: function() {
        var src = '/aaa/gi',
            expected = ['regex', [0, 7], 'aaa', 'gi'],
            result = this.parseJS(src, 'expr');
        this.assertMatches(expected, result);
    },
    test02ParseFloatWithoutIntegerPart: function() {
        var src = '.8',
            expected = ['number', [0, 2], 0.8],
            result = this.parseJS(src, 'number');
        this.assertMatches(expected, result);
    },
    test03SingleLineCommentWithoutSemicolon: function() {
        var src = '23 // comment\n42',
            expected = ['begin', [0, 16],
                ['number', [0, 2], 23],
                ['number', [14, 16], 42]
            ],
             result = this.parseJS(src);
        this.assertMatches(expected, result,
            'single line comment without semicolon cannot be parsed');
    },
    // test04AssignmentOperators: function() {
    //     // FIXME, not implemented yet
    //     var src1 = 'a >>= 12',
    //         src2 = 'a <<= 12',
    //         src3 = 'a >>>= 12',
    //         expected1 = ['mset', [0, 8], ['get', [0, 1], 'a'], '>>', ['number', [5, 8], 12]],
    //         expected2 = ['mset', [0, 8], ['get', [0, 1], 'a'], '<<', ['number', [5, 8], 12]],
    //         expected3 = ['mset', [0, 9], ['get', [0, 1], 'a'], '>>>', ['number', [6, 9], 12]],
    //         result;
    //
    //     result = this.parseJS(src1, 'expr');
    //     this.assertMatches(expected1, result, 'signed right shift assignment operator cannot be parsed');
    //     result = this.parseJS(src2, 'expr');
    //     this.assertMatches(expected2, result, 'left shift assignment operator cannot be parsed');
    //     result = this.parseJS(src3, 'expr');
    //     this.assertMatches(expected3, result, 'unsigned right shift assignment operator cannot be parsed');
    // },
    test05BinaryBitwiseOperators: function() {
        var src1 = '5 & 3', // = 1
            src2 = '5 | 3', // = 7
            src3 = '5 ^ 3', // = 6
            expected1 = ['binop', [0, 5], '&', ['number', [0, 1], '5'], ['number', [4, 5], 3]],
            expected2 = ['binop', [0, 5], '|', ['number', [0, 1], '5'], ['number', [4, 5], 3]],
            expected3 = ['binop', [0, 5], '^', ['number', [0, 1], '5'], ['number', [4, 5], 3]],
            result;

        result = this.parseJS(src1, 'expr');
        this.assertMatches(expected1, result, 'binary and (&) operator cannot be parsed');
        result = this.parseJS(src2, 'expr');
        this.assertMatches(expected2, result, 'binary or (|) operator cannot be parsed');
        result = this.parseJS(src3, 'expr');
        this.assertMatches(expected3, result, 'binary xor (^) operator cannot be parsed');
    },
    test06ExponentialNumber: function() {
        var src1 = '2e6',
            src2 = '2e+6',
            src3 = '2e-6',
            expected1 = ['number', [0, 3], 2000000],
            expected2 = ['number', [0, 4], 2000000],
            expected3 = ['number', [0, 4], 0.000002],
            result;

        result = this.parseJS(src1, 'number');
        this.assertMatches(expected1, result, 'exponential number could not be parsed');
        result = this.parseJS(src2, 'number');
        this.assertMatches(expected2, result, 'positive exponential number could not be parsed');
        result = this.parseJS(src3, 'number');
        this.assertMatches(expected3, result, 'negative exponential number could not be parsed');
    },
    test07ParseInOperator: function() {
        var src = 'a in {a: 4}',
            expected = ['binop'],
            result = this.parseJS(src, 'expr');
        this.assertMatches(expected, result);
    },
    test08ParseForInWithoutDecl: function() {
        var src = 'for (name in obj) name',
            expected = ["forIn",
                        [0, 22],
                        ["get", [5, 9], "name"],
                        ["get", [13, 16], "obj"]],
            result = this.parseJS(src, 'stmt');
        this.assertMatches(expected, result);
    },
    test09ParseMemberFragment: function() {
        var src1 = 'method: 23',
            src2 = 'method: 23,',
            expected = ["binding", [0, 10], "method", ["number", [8, 10]]],
            result1 = this.parseJS(src1, 'memberFragment'),
            result2 = this.parseJS(src2, 'memberFragment');
        this.assertMatches(expected, result1);
        this.assertMatches(expected, result2);
    },
    test10ParseCategoryFragment: function() {
        var src1 = '"accessing", { method: 23 }',
            src2 = '"accessing", { method: 23 },',
            expected = ["arr", [0, 27], ["string", [0, 11], "accessing"],
                     ["json", [12, 27], ["binding", [14, 25], "method", ["number", [23, 25]]]]],
            result1 = this.parseJS(src1, 'categoryFragment'),
            result2 = this.parseJS(src2, 'categoryFragment');
        this.assertMatches(expected, result1);
        this.assertMatches(expected, result2);
    },
    test11ParseVarDecl: function() {
        var src = 'var /*bla*/s = 23;',
            expected = ["begin", [3, 17], ["var", [3, 17], "s", ["number", [15, 17], 23]]],
            result = this.parseJS(src, 'stmt');
        this.assertMatches(expected, result);
    },
    test12ParseSet: function() {
        var src = 'v = /*bla*/s;',
            expected = ["set", [0, 12], ["get", [0, 1], "v"], ["get", [11, 12], "s"]],
            result = this.parseJS(src, 'stmt');
        this.assertMatches(expected, result);
    },
    test13ParseBinary: function() {
        var src = '1&1|1',
            expected = ['binop', [0, 5], '|',
                ['binop', [0, 3], '&', ['number', [0, 1], 1], ['number', [2, 3], 1]],
                ['number', [4, 5], 1]],
            result = this.parseJS(src, 'expr');
        this.assertMatches(expected, result);
    },
    test14ParseQuotes: function() {
        var src1 = "'\\'''",
            expected1 = ['string', [0, 4], "'"],
            result1 = this.parseJS(src1, 'expr'),
            src2 = '"\\""',
            expected2 = ['string', [0, 4], '"'],
            result2 = this.parseJS(src2, 'expr');
        this.assertMatches(expected1, result1);
        this.assertMatches(expected2, result2);
    },
    test15StatementAfterCatchBlock: function() {
        var src = 'try{} catch(e) {}a.b',
            expected = ["begin", [0, 20],
                ["try", [0, 17],
                    ["begin", [4, 4]], ["get", [12, 13], "e"], ["begin", [16, 16]],
                    ["get", [17, 17], "undefined"]],
                ["getp", [17, 20], ["string", [19, 20], "b"], ["get", [17, 18], "a"]]],
            result = this.parseJS(src, 'topLevel');
        this.assertMatches(expected, result);
    },
    test16ParseGetterAndSetter: function() {
        var src = '{get foo() { return this.x }, set foo(x) { return this.x = x }}',
            expected = ['json', [0, 63],
                ['jsonGetter', [1, 28], 'foo', ['begin', [12, 27]]],
                ['jsonSetter', [30, 62], 'foo', ['begin', [42, 61]], 'x']],
            result = this.parseJS(src, 'json');
        this.assertMatches(expected, result);
    },


});


TestCase.subclass('lively.ast.tests.AstTests.JSToAstTest',
'helper', {
    parseJS: function(src, rule) { return lively.ast.Parser.parse(src, rule) },
},
'testing', {
    test01SimpleExpression: function() {
        var src = '1+2;',
            r = this.parseJS(src),
            expected = {
                isSequence: true,
                children: [{
                    isBinaryOp: true,
                    name: '+',
                    left: {isNumber: true, value: 1},
                    right: {isNumber: true, value: 2},
                }],
            };
        this.assertMatches(expected, r);
    },
    test02SimpleFunction: function() {
        var src = '(function (a) { return a++ })',
            r = this.parseJS(src),
            expected = {
                isFunction: true,
                args: [{isVariable: true, name: 'a'}],
                body: {
                    isSequence: true,
                    children: [{
                        isReturn: true,
                        expr: {
                            isPostOp: true,
                            name: '++',
                            expr: {isVariable: true, name: 'a'}
                        }
                    }]
                },
            };
        this.assertMatches(expected, r.children[0]);
    },
    test03TryCatch: function() {
        var src = 'try { this.foo(1) } catch(e) { log(e) }',
            r = this.parseJS(src),
            expected = {
                isTryCatchFinally: true,
                trySeq: {},
                catchSeq: {},
                finallySeq: {}
            };
        this.assertMatches(expected, r.children[0]);
    },
    test04GetParentFunction: function() {
        var funcAst = function(a) { if (a) return 1 + m(); foo() }.ast();
        this.assertIdentity(funcAst,
            funcAst.body.children[0]
                .trueExpr.children[0]
                .expr
                .right.parentFunction());
    },

    test05aEnumerateASTNodes: function() {
        var funcAst = function(a) { if (a) return 1 + m(); foo() }.ast();
        // funcAst.printTree(true) gives a tree in post order, just enumerate it
        // 0     Variable(condExpr)
        // 1        Number(left)
        // 2         Variable(fn)
        // 3        Call(right)
        // 4       BinaryOp(expr)
        // 5      Return(children)
        // 6     Sequence(trueExpr)
        // 7     Variable(falseExpr)
        // 8    If(children)
        // 9    Variable(fn)
        // 10   Call(children)
        // 11  Sequence(body)
        // 12  Variable(arguments)
        // 13 Function
        this.assertEquals(0, funcAst.body.children[0].condExpr.astIndex());
        this.assertEquals(1, funcAst.body.children[0].trueExpr.children[0].expr.left.astIndex());
        this.assertEquals(2, funcAst.body.children[0].trueExpr.children[0].expr.right.fn.astIndex());
        this.assertEquals(3, funcAst.body.children[0].trueExpr.children[0].expr.right.astIndex());
        this.assertEquals(4, funcAst.body.children[0].trueExpr.children[0].expr.astIndex());
        this.assertEquals(5, funcAst.body.children[0].trueExpr.children[0].astIndex());
        this.assertEquals(6, funcAst.body.children[0].trueExpr.astIndex());
        this.assertEquals(7, funcAst.body.children[0].falseExpr.astIndex());
        this.assertEquals(8, funcAst.body.children[0].astIndex());
        this.assertEquals(9, funcAst.body.children[1].fn.astIndex());
        this.assertEquals(10, funcAst.body.children[1].astIndex());
        this.assertEquals(11, funcAst.body.astIndex());
        this.assertEquals(12, funcAst.args[0].astIndex());
        this.assertEquals(13, funcAst.astIndex());
    },
    test05bEnumerateASTNodesButNotNestedFunctions: function() {
        var funcAst = function() { function f() { return 3 } foo() }.ast();
        // funcAst.printTree(true) gives a tree in post order, just enumerate it
        // x      Number(expr)
        // x     Return(children)
        // x    Sequence(body)
        // x   Function(children)
        // 0    Variable(fn)
        // 1   Call(children)
        // 2  Sequence(body)
        // 3 Function(undefined)
        this.assertEquals(4, funcAst.astIndex());
        this.assertEquals(3, funcAst.body.astIndex());
        this.assertEquals(2, funcAst.body.children[1].astIndex());
        this.assertEquals(1, funcAst.body.children[1].fn.astIndex());
        this.assertEquals(0, funcAst.body.children[0].astIndex());
    },
    test06ParseObjWithGetter: function() {
        var src = '({get x() { return 3 }})',
            r = this.parseJS(src),
            expected = {
                isObjectLiteral: true,
                properties: [{
                    isObjPropertyGet: true,
                    body: {
                        isSequence: true,
                        children: [{
                            isReturn: true,
                            expr: {
                                isNumber: true,
                                value: 3
                            }
                        }]
                    }
                }]
            };
        this.assertMatches(expected, r.children[0]);
    },
})


TestCase.subclass('lively.ast.tests.AstTests.ReplaceTest',
'helper', {
    parseJS: function(src, rule) { return lively.ast.Parser.parse(src, rule) },
},
'testing', {
    test01ReplaceWith: function() {
        var ast = this.parseJS('this.baz(this.foo()) + this.foo()', 'expr'),
            nodes = ast.nodesMatching(function(node) { return node.isSend && node.property.value == 'foo' }),
            node = nodes[0],
            replacement = this.parseJS('this.bar()', 'expr'),
            expected = {
                left: {property: {value: 'baz'}, args: [{property: {value: 'bar'}}]},
                right: {property: {value: 'foo'}}
            };

        this.assertEquals(2, nodes.length);
        node.replaceWith(replacement);
        this.assertMatches(expected, ast);
    },
    test02ReplaceNodesMatching: function() {
        var astToReplace = this.parseJS('this.baz(this.foo()) + this.foo()', 'stmt'),
            expected = {
                left: {property: {value: 'baz'}, args: [{property: {value: 'bar'}}]},
                right: {property: {value: 'bar'}}
            };
        astToReplace.replaceNodesMatching(
            function(node) { return node.isSend && node.property.value == 'foo' },
            function() { return this.parseJS('this.bar()', 'expr') }.bind(this));

        this.assertMatches(expected, astToReplace);
    },
});


TestCase.subclass('lively.ast.tests.AstTests.InterpreterTest',
'helper', {
    parseJS: function(src, rule) { return lively.ast.Parser.parse(src, rule) },
},
'testing', {
    test01Number: function() {
        var node = this.parseJS('1', 'expr');
        this.assertEquals(1, node.startInterpretation());
    },
    test02AddNumbers: function() {
        var node = this.parseJS('1 + 2', 'expr');
        this.assertEquals(3, node.startInterpretation());
    },
    test03LookupVar: function() {
        var node = this.parseJS('a + 2', 'expr');
        this.assertEquals(3, node.startInterpretation({a: 1}));
    },
    test04If: function() {
        var node = this.parseJS('if (false) { 1 } else { 2 }', 'stmt');
        this.assertEquals(2, node.startInterpretation());
    },
    test05FunctionInvocation: function() {
        var node = this.parseJS('(function() { return 1 })()', 'expr');
        this.assertEquals(1, node.startInterpretation());
    },
    test06FunctionInvocationWithArgs: function() {
        var node = this.parseJS('(function(a) { return a + 1 })(2)', 'expr');
        this.assertEquals(3, node.startInterpretation());
    },
    test07Closue: function() {
        var node = this.parseJS('var a = 6; (function(b) { return a / b })(3)');
        this.assertEquals(2, node.startInterpretation());
    },
    test08RealClosue: function() {
        var node = this.parseJS('var foo = function(){var a = 1; return function() {return a}}; foo()()');
        this.assertEquals(1, node.startInterpretation());
    },
    test09aEarlyReturn: function() {
        var node = this.parseJS('(function() { return 1; 2; })()');
        this.assertEquals(1, node.startInterpretation());
    },
    test09bEarlyReturnInFor: function() {
        var node = this.parseJS('(function() { for (var i=0;i<10;i++) if (i==5) return i; })()');
        this.assertEquals(5, node.startInterpretation());
    },
    test09cEarlyReturnInWhile: function() {
        var node = this.parseJS('(function() { var i = 0; while (i<10) { i++; if (i==5) return i; } })()');
        this.assertEquals(5, node.startInterpretation());
    },
    test10Recursion: function() {
        var node = this.parseJS('function foo(n) { return n == 1 ? 1 : foo(n - 1)}; foo(10)');
        this.assertEquals(1, node.startInterpretation());
    },
    test11MethodCall: function() {
        var node = this.parseJS('var obj = {foo: function() {return 3}}; obj.foo()');
        this.assertEquals(3, node.startInterpretation());
    },
    test12UsingThis: function() {
        var node = this.parseJS('var obj = {foo: function() {this.x=3}}; obj.foo(); obj.x');
        this.assertEquals(3, node.startInterpretation());
    },
    test13ModifyingVar: function() {
        var node = this.parseJS('var x = 1; x = 3; x');
        this.assertEquals(3, node.startInterpretation());
    },
    test14NoDynamicScop: function() {
        var ast = this.parseJS('var a = 1; ' +
            'function bar () { return a }; ' +
            'function foo() { var a = 2; return bar() }; ' +
            'foo()')
            result  = ast.startInterpretation();
        this.assertIdentity(1, result, 'function barr can access dynamic scope of foo');
    },
    test15ForLoop: function() {
        var ast = this.parseJS('var arr = []; for (var i = 0; i < 5; i++) arr[i] = i; arr'),
            result  = ast.startInterpretation();
        this.assertEqualState([0, 1, 2, 3, 4], result);
    },
    test16aWhile: function() {
        var ast = this.parseJS('var i = 0; while(i < 3) i++; i'),
            result  = ast.startInterpretation();
        this.assertEqualState(3, result);
    },
    test16bWhileReturnValue: function() {
        // actually a test for pre/post op
        var exprStr = 'var i = 0; while(i<3) {++i}',
            ast = this.parseJS(exprStr),
            result  = ast.startInterpretation();
        this.assertEqualState(eval(exprStr), result);

        var exprStr = 'var i = 0; while(i<3) {i++}',
            ast = this.parseJS(exprStr),
            result  = ast.startInterpretation();
        this.assertEqualState(eval(exprStr), result);
    },
    test17DoWhile: function() {
        var ast = this.parseJS('var i = 0; do { ++i } while (i == 0); i'),
            result  = ast.startInterpretation();
        this.assertEqualState(1, result);
    },
    test18ForIn: function() {
        var ast = this.parseJS('var obj = {a: 1, b:2}, result = []; ' +
                'for (var name in obj) result.push(name); result'),
            result  = ast.startInterpretation();
        this.assertEqualState(['a', 'b'], result);
    },
    test18bForInNoVarDecl: function() {
      var ast = this.parseJS('var obj = {a: 1, b:2}, result = [], name; ' +
              'for (name in obj) result.push(name); result'),
          result  = ast.startInterpretation();
      this.assertEqualState(['a', 'b'], result);
  },
    test19ModifyingSet: function() {
        var ast = this.parseJS('a += 2'),
            mapping = {a: 3},
            result  = ast.startInterpretation(mapping);
        this.assertEquals(5, result);
        this.assertEquals(5, mapping.a);
    },
    test20UnaryOp: function() {
        var ast = this.parseJS('var a = 4; -a'),
            result  = ast.startInterpretation();
        this.assertEquals(-4, result);
    },
    test20aBreakInFor: function() {
        var ast = this.parseJS('for (var i = 0; i < 10; i++) { if (i == 2) break }; i'),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test20bBreakInCase: function() {
        var ast = this.parseJS('var a = 2, b; switch(a) { case 1: b=1; case 2: b=2; break; case 3: b=3 }; b'),
            result = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test21aSwitch: function() {
        var ast = this.parseJS('switch(2) { case 1: a++; case 2: a++; case 3: a++; break; case 4: a++ }; a'),
            result = ast.startInterpretation({a: 0});
        this.assertEquals(2, result);
    },
    test21bSwitchDefault: function() {
        var ast = this.parseJS('switch(3) { case 1: a=1; case 2: a=2; default: a=3 }; a'),
            result = ast.startInterpretation({a: 0});
        this.assertEquals(3, result);
    },
    test22aContinueInFor: function() {
        var ast = this.parseJS('for (var i = 0; i < 10; i++) { if (i > 2) continue; a=i }; a'),
            result  = ast.startInterpretation({a: 0});
        this.assertEquals(2, result);
    },
    test23aSimpleTryCatch: function() {
        var ast = this.parseJS('try { throw {a: 1} } catch(e) { e.a }'),
            result  = ast.startInterpretation();
        this.assertEquals(1, result, 'wrong catch result');
    },
    test23bSimpleTryCatchFinally: function() {
        var ast = this.parseJS('try { throw {a: 1} } catch(e) { e.a } finally { 2 }'),
            result  = ast.startInterpretation();
        this.assertEquals(2, result, 'wrong finally result');
    },
    test23cTryCatchMultipleLevels: function() {
        var src = 'function m1() { for (var i = 0; i < 10; i++) if (i == 3) throw i }; ' +
                'function m2() { m1(); return 2 }; try { m2() } catch(e) { e }',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(3, result, 'wrong result');
    },
    test23dTryFinally: function() {
        var src = 'try { 1 } finally { 2 }',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },

    test24aNewWithFunc: function() {
        var src = 'function m() { this.a = 2 }; var obj = new m(); obj.a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test24bNewThenObjAccess: function() {
        var src = 'function m() { this.a = 2 }; new m().a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test24cNewPrototypeInheritence: function() {
        var src = 'function m() { this.a = 1 }; m.prototype.b = 2; new m().b',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test24dFunctionPrototypeNotChanged: function() {
        var src = 'function m() { this.a = 1 }; m.prototype.a = 2; new m(); m.prototype.a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(2, result);
    },
    test24eObjReallyInherits: function() {
        var src = 'function m() {}; m.prototype.a = 2; var obj = new m(); m.prototype.a = 1; obj.a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(1, result);
    },
    test24eFuncCallInNewExpr: function() {
        var src = 'function m() { this.a = (function() { return 1 })() }; new m().a',
            ast = this.parseJS(src),
            result  = ast.startInterpretation();
        this.assertEquals(1, result);
    },
    test25InstantiateClass: function() {
        Config.deepInterpretation = true
        var className = 'Dummy_test25InstantiateClass';
        try {
        var klass = Object.subclass(className, { a: 1 }),
            src = Strings.format('var obj = new %s(); obj.a', className),
            ast = this.parseJS(src),
            mapping = {Dummy_test25InstantiateClass: klass},
            result  = ast.startInterpretation(mapping);
        this.assertEquals(1, result);
        this.assert(lively.Class.isClass(Global[className]), 'Class changed!')
        } finally {
            delete Global[className];
        }
    },
    test26ArgumentsOfConstructorAreUsed: function() {
        try {
            Object.subclass('Dummy_test26ArgumentsOfConstructorAreUsed', { initialize: function(n) { this.n = n }})
            var src = 'var obj = new Dummy_test26ArgumentsOfConstructorAreUsed(1); obj.n',
                ast = this.parseJS(src),
                result  = ast.startInterpretation(Global);
            this.assertEquals(1, result);
        } finally {
            delete Global.Dummy_test26ArgumentsOfConstructorAreUsed
        }
    },
    test27SpecialVarArguments: function() {
        var src = 'function x() { return arguments[0] }; x(1)',
            ast = this.parseJS(src),
            result  = ast.startInterpretation(Global);
        this.assertEquals(1, result);
    },
    test27NullisNull: function() {
        var src = 'null',
            ast = this.parseJS(src, 'expr'),
            result  = ast.startInterpretation();
        this.assertIdentity(null, result);
    },
    test28SimpleRegex: function() {
        var src = '/aaa/.test("aaa")',
            ast = this.parseJS(src, 'expr'),
            result  = ast.startInterpretation();
        this.assertIdentity(true, result);
    },
    test29FunctionReturnsRealFunction: function() {
        var src = 'function m() {}',
            ast = this.parseJS(src, 'expr'),
            result  = ast.startInterpretation();
        this.assert(Object.isFunction(result), 'not a real function');
    },
    test30InstanceOf: function() {
        var src = 'pt(0,0) instanceof lively.Point',
            ast = this.parseJS(src, 'expr'),
            result  = ast.startInterpretation(Global);
        this.assert(result, 'instanceof not working');
    },
    test31ForWithMultipleExpr: function() {
        var src = 'var i, j; for (i = 0, j = 1; i < 10; i++, j*=2) { }; [i, j]',
            ast = this.parseJS(src, 'srcElems'),
            result = ast.startInterpretation();
        this.assertEqualState([10, 1024], result, 'multiple expressions in for header not working');
    },
    test32AttrNameInObject: function() {
        var src = '"a" in ({ a: 23 })',
            ast = this.parseJS(src, 'expr'),
            result  = ast.startInterpretation();
        this.assertIdentity(result, true, 'attribute name in object check not working');
    },
    test33WhileTrue: function() {
        var src = '(function() { while(true) return 23; return 24; })()',
            ast = this.parseJS(src, 'topLevel'),
            result  = ast.startInterpretation();
        this.assertIdentity(result, 23, 'while(true) not working');
    },
    test34IfMultipleExpr: function() {
        var src = 'if (2,3,4) 5;',
            ast = this.parseJS(src, 'stmt'),
            result = ast.startInterpretation();
        this.assertEqualState(5, result, 'multiple expressions in if not working');
    },
    test35AssignVarsOfOuterScope: function() {
        var func = function m(){var a=2;(function(){a++})(); return a};
        var result = func.forInterpretation().call();
        this.assertEquals(3, result);
    },
    test36AlternativeMethodSend: function() {
        var func = function(){var obj = {a:23,foo:function(){return this.a}};return obj["foo"]()};
        var result = func.forInterpretation().call();
        this.assertEquals(23, result);
    },
    test37NativeConstructor: function() {
        var func = function(){return typeof new Date()};
        var result = func.forInterpretation().call();
        this.assertEquals("object", result);
    },
});

TestCase.subclass('lively.ast.tests.AstTests.ExecutionStateReifierTest',
'running', {
    setUp: function($super) {
        this.sut = new lively.ast.StackReification.Rewriter();
    },
},
'helper', {
    funcAst: function(funcSrc) {
        var func = eval('(' + funcSrc + ')');
        return func.ast();
    },
    catsch: function(funcName, idx, optRecv, varNames) {
        varNames = varNames || [];
        var call = Strings.format('var result%s_%s = %s%s();',
            idx, funcName, optRecv ? optRecv + '.' : '', funcName),
            varRecorder = varNames.collect(function(name) { return name + ':' + name }).join(','),
            src = Strings.format('try {\n%s\n} catch(e) {\n' +
                'if (e.isUnwindException) {\n' +
                '    e.lastFrame = e.lastFrame.addCallingFrame({%s}, %s, arguments.callee.livelyClosure.getOriginalFunc())\n' +
                '}\nthrow e\n};', call, varRecorder, idx);
        return src;
    },
},
'testing', {
    /*test01RewriteSimpleFunction: function() {
        var func = function() { return bar() },
            expectedSrc = Strings.format('function(){ %s return result1_bar; }', this.catsch('bar', 1)),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');
        this.assertEquals(expectedAST.asJS(), result.asJS());
    },
    test02RewriteTwoCalls: function() {
        var func = function() { return this.foo() + bar() },
            expectedSrc = Strings.format('function(){ %s %s return result1_foo + result3_bar; }',
                this.catsch('foo', 1, 'this'), this.catsch('bar', 3, null, ['result1_foo'])),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');
        this.assertEquals(expectedAST.asJS(), result.asJS());
    },
    test03RewriteCallsInIf: function() {
        if (!Config.suppressRobertsWarnings)
        // FIXME: test03RewriteCallsInIf: lazy evaluation of or expressions and cond exprs'
        var func = function() { if (this.foo() || bar()) { 1 } },
            expectedSrc = Strings.format('function(){ %s %s if (result1_foo || result3_bar) { 1 } }',
                this.catsch('foo', 1, 'this'), this.catsch('bar', 3, null, ['result1_foo'])),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');

        this.assertEquals(expectedAST.asJS(), result.asJS());
    },
    test04aRewriteCallsInIfBody: function() {
        var func = function() { if (true) { return this.foo() } },
            expectedSrc = Strings.format('function(){ if (true) { %s return result2_foo } }',
                this.catsch('foo', 2, 'this')),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');

        this.assertEquals(expectedAST.asJS(), result.asJS());
    },
    test04bRewriteCallsInIfBody: function() {
        var func = function() { if (true) foo() },
            expectedSrc = Strings.format('function(){ if (true) { %s result2_foo } }',
                this.catsch('foo', 2)),
            expectedAST = this.funcAst(expectedSrc),
            result = this.sut.rewrite(func.ast(), 'isolateAndCatchCall');

        this.assertEquals(expectedAST.asJS(), result.asJS());
    },

    test05aFindAllVarsAndArgsInScope: function() {
        var func = function(a) { var b = 2; if (a) { var c = b + 1 }; return bar() },
            expected = ['a', 'b', 'c'],
            result = this.sut.findVarAndArgNamesInScope(func.ast());
        this.assertEqualState(expected, result);
    },
    test05bFindAllVarsAndArgsInScope: function() {
        var func = function() { var a; function foo() { var b = 3 } },
            expected = ['a', 'foo'],
            result = this.sut.findVarAndArgNamesInScope(func.ast());
        this.assertEqualState(expected, result);
    },
    testCaptureSimpleStack: function() {
        var unwindException = null,
            halt = lively.ast.StackReification.halt,
            func = function() { var b = 2; halt() }.stackCaptureMode();
        try { func() } catch(e) { if (e.isUnwindException) { unwindException = e } else { throw e }}
        this.assert(unwindException, 'no unwindException')
        this.assertEquals(2, unwindException.lastFrame.lookup('b'));
    },*/


});
TestCase.subclass('lively.ast.tests.AstTests.ContinuationTest',
'running', {
    shouldRun: false,
    setUp: function($super) {
        this.rewriter = new lively.ast.StackReification.Rewriter();
        Global.currentTest = this;
    },
    tearDown: function($super) {
        $super();
        delete Global.currentTest;
    },

},
'testing', {
    test01RestartSimpleFunction: function() {
        var state = {before: 0, after: 0},
            func = function() {
                state.before++;
                lively.ast.StackReification.halt();
                state.after++;
            }.stackCaptureMode({state: state}),
            continuation = lively.ast.StackReification.run(func);
        this.assertEquals(1, state.before, 'before not run');
        this.assertEquals(0, state.after, 'after run');
        continuation.resume();
        this.assertEquals(1, state.before, 'before run again');
        this.assertEquals(1, state.after, 'after not run');
    },
    test02RestartFunctions: function() {
        var t = Global.currentTest;
        Object.extend(t, {
            a_before: 0, a_after: 0, b_before: 0, b_after: 0,
            b: function(arg) {
                arg++
                Global.currentTest.b_before++;
                halt();
                Global.currentTest.b_after++;
            }.stackCaptureMode(),
            a: function() {
                var x = 3;
                Global.currentTest.a_before++
                Global.currentTest.b(x)
                Global.currentTest.a_after++
            }.stackCaptureMode(),
        })
        var continuation = lively.ast.StackReification.run(t.a);
        this.assertEquals(1, t.a_before, 'a_before not run');
        this.assertEquals(1, t.b_before, 'b_before not run');
        this.assertEquals(0, t.a_after, 'a_after did run');
        this.assertEquals(0, t.b_after, 'b_after did run');
        continuation.resume();
        this.assertEquals(1, t.a_before, 'a_before run again');
        this.assertEquals(1, t.b_before, 'b_before run again');
        this.assertEquals(1, t.a_after, 'a_after not run');
        this.assertEquals(1, t.b_after, 'b_after not run');
    },
    test03ResumedFunctionHasNoNextStatement: function() {
        var func = function() {
                lively.ast.StackReification.halt();
            }.stackCaptureMode(),
            continuation = lively.ast.StackReification.run(func);
        continuation.resume();
    },
});

TestCase.subclass('lively.ast.tests.AstTests.VariableAnalyzerTest',
'assertion', {
    assertVarsFound: function(code, expected, actual) {
        this.assertEquals(expected.length, actual.length,
                          'did not found correct number of variables: ' +
                          expected + ' vs ' + actual +
                          ' code: ' + code);
        for (var i = 0; i < expected.length; i++) {
            var expectedVarName = expected[i][0],
                actualVarName = actual[i].name;
            this.assertEquals(expectedVarName, actualVarName,
                             expectedVarName + " (expected) does not match " +
                              actualVarName + ' code: ' + code);
            var expectedPosition = expected[i][1] + "-" + expected[i][2],
                actualPosition = actual[i].position();
            this.assertEquals(expectedPosition, actualPosition,
                             expectedPosition + " (expected) does not match " +
                              actualPosition + ' code: ' + code);
        }
    },
},
'testing', {
    test01FindFreeVariable: function() {
        var src = 'function f() { var x = 3; return x + y }',
            result = new lively.ast.VariableAnalyzer().findGlobalVariablesIn(src);
        this.assertVarsFound(eval(src), [['y', 37, 38]], result);
    },
    testFindSimpleGlobalRead: function() {
        var codeAndExpected = [
            ["Foo.bar()", [["Foo", 0, 3]]],
            ["var Foo = x(); Foo.bar()", [["x", 10, 11]]],
            ["Foo = false;", [["Foo", 0, 3]]],
            ["(function() { (function() { Foo = 3 }) })", [["Foo", 28, 31]]],
            ["(function(arg) { return arg + 1 })", []],
            ["(function() { (function(arg) {}); return arg })", [['arg', 41, 44]]]
        ];

        for (var i = 0; i < codeAndExpected.length; i++) {
            var code = codeAndExpected[i][0],
                expected = codeAndExpected[i][1],
                result = new lively.ast.VariableAnalyzer().findGlobalVariablesIn(code);
            this.assertVarsFound(code, expected, result);
        }
    },

});

TestCase.subclass('lively.ast.tests.AstTests.AcornToLKTest',
'running', {
    setUp: function($super) {
        $super();
        this.acornParser = lively.ast.acorn;
        this.acornToLK = acorn.walk.toLKObjects;
    },
},
'helping', {
    assertPositions: function(ast) {
        ast.withAllChildNodesDo(function(node, parent, nameInParent, depth) {
            if (!node.pos || (node.pos.length != 2) || isNaN(node.pos[0]) || isNaN(node.pos[1])) {
                throw new Error(node.constructor.name + ' has invalid pos: (' + node.pos + ')');
            }
            return true;
        });
    },
},
'testing', {
    test01UnaryExpression: function() {
        // also checks: Program, ExpressionStatement, Literal(boolean)
        var src = '!true;',
            expected = {
                isSequence: true,
                children: [{
                    isUnaryOp: true,
                    name: '!',
                    expr: { isVariable: true, name: 'true' }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test02BinaryExpression: function() {
        // also checks: Literal(number)
        var src = '1+2;',
            expected = {
                isSequence: true,
                children: [{
                    isBinaryOp: true,
                    name: '+',
                    left: { isNumber: true, value: 1 },
                    right: { isNumber: true, value: 2 }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test03LogicalExpression: function() {
        var src = 'true&&false;',
            expected = {
                isSequence: true,
                children: [{
                    isBinaryOp: true,
                    name: '&&',
                    left: { isVariable: true, name: 'true' },
                    right: { isVariable: true, name: 'false' }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test04UpdateExpression: function() {
        // also checks: Identifier

        // post op
        var src = 'a++;';
            expected = {
                isSequence: true,
                children: [{
                    isPostOp: true,
                    name: '++',
                    expr: { isVariable: true, name: 'a' }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        // pre op
        src = '--b;';
        expected = {
            isSequence: true,
            children: [{
                isPreOp: true,
                name: '--',
                expr: { isVariable: true, name: 'b' }
            }],
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test05AssignmentExpression: function() {
        // set
        var src = 'ten = 10;';
            expected = {
                isSequence: true,
                children: [{
                    isSet: true,
                    left: { isVariable: true, name: 'ten' },
                    right: { isNumber: true, value: 10 }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        // modifying set
        src = 'ten += 0;';
        expected = {
            isSequence: true,
            children: [{
                isModifyingSet: true,
                name: '+',
                left: { isVariable: true, name: 'ten' },
                right: { isNumber: true, value: 0 }
            }]
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test06FunctionDeclaration: function() {
        // also checks: BlockStatement, ReturnStatement
        var src = 'function fn(a) { return 23; }';
            expected = {
                isSequence: true,
                children: [{
                    isVarDeclaration: true,
                    name: 'fn',
                    val: {
                        isFunction: true,
                        args: [{ isVariable: true, name: 'a' }],
                        body: {
                            isSequence: true,
                            children: [{
                                isReturn: true,
                                expr: {
                                    isNumber: true,
                                    value: 23
                                }
                            }]
                        }
                    }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test07VariableDeclaration: function() {
        // also checks: Literal(string)
        var src = 'var a = 23, b = "fortytwo", c;';
            expected = {
                isSequence: true,
                children: [{
                    isSequence: true,
                    children: [
                        { isVarDeclaration: true, name: 'a', val: { isNumber: true, value: 23 } },
                        { isVarDeclaration: true, name: 'b', val: { isString: true, value: 'fortytwo' } },
                        { isVarDeclaration: true, name: 'c', val: { isVariable: true, name: 'undefined' } }
                    ]
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test08ObjectExpression: function() {
        var src = '({ a: "b", 23: 42, "foo": "bar", get x() { return 3; }, set y(val) { bar = val; } });';
            expected = {
                isSequence: true,
                children: [{
                    isObjectLiteral: true,
                    properties: [
                        { isObjProperty: true, name: 'a', property: { isString: true, value: 'b' } },
                        { isObjProperty: true, name: 23, property: { isNumber: true, value: 42 } },
                        { isObjProperty: true, name: 'foo', property: { isString: true, value: 'bar' } },
                        { isObjPropertyGet: true, name: 'x', body: {
                            isSequence: true,
                            children: [{ isReturn: true, expr: { isNumber: true, value: 3 } }]
                        } },
                        { isObjPropertySet: true, name: 'y', arg: { isVariable: true, name: 'val' },
                            body: {
                                isSequence: true,
                                children: [{
                                    isSet: true,
                                    left: { isVariable: true, name: 'bar' },
                                    right: { isVariable: true, name: 'val' }
                                }]
                            }
                        }
                    ]
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test09ArrayExpression: function() {
        var src = '[1, 2, 3];',
            expected = {
                isSequence: true,
                children: [{
                    isArrayLiteral: true,
                    elements: [
                        { isNumber: true, value: 1 },
                        { isNumber: true, value: 2 },
                        { isNumber: true, value: 3 }
                    ]
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test10EmptyStatement: function() {
        var src = ';',
            expected = {
                isSequence: true,
                children: [{ isVariable: true, name: 'undefined' }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test11IfStatement: function() {
        var src = 'if (a == b) { flag = true; } else { flag = false; }',
            expected = {
                isSequence: true,
                children: [{
                    isIf: true,
                    condExpr: {
                        isBinaryOp: true, name: '==',
                        left: { isVariable: true, name: 'a' },
                        right: { isVariable: true, name: 'b' }
                    },
                    trueExpr: {
                        isSequence: true,
                        children: [{
                            isSet: true,
                            left: { isVariable: true, name: 'flag' },
                            right: { isVariable: true, name: 'true' }
                        }]
                    },
                    falseExpr: {
                        isSequence: true,
                        children: [{
                            isSet: true,
                            left: { isVariable: true, name: 'flag' },
                            right: { isVariable: true, name: 'false' }
                        }]
                    }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test12SwitchStatement: function() {
        // also checks: SwitchCase, BreakStatement
        var src = 'switch (val) { case 1: 1; break; case 2: case 3: 23; break; default: x; break; }',
            expected = {
                isSequence: true,
                children: [{
                    isSwitch: true,
                    expr: { isVariable: true, name: 'val'},
                    cases: [
                        { isCase: true, condExpr: { isNumber: true, value: 1 }, thenExpr: {
                            isSequence: true,
                            children: [{ isNumber: true, value: 1 }, { isBreak: true }]
                        }},
                        { isCase: true, condExpr: { isNumber: true, value: 2 }, thenExpr: {
                            isSequence: true,
                            children: []
                        }},
                        { isCase: true, condExpr: { isNumber: true, value: 3 }, thenExpr: {
                            isSequence: true,
                            children: [{ isNumber: true, value: 23 }, { isBreak: true }]
                        }},
                        { isDefault: true, defaultExpr: {
                            isSequence: true,
                            children: [{ isVariable: true, name: 'x' }]
                        }}
                    ]
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test13TryStatement: function() {
        // also checks: ThrowStatement
        // try - catch - finally
        var src = 'try { throw e; } catch (err) { err; } finally { "final"; }',
            expected = {
                isSequence: true,
                children: [{
                    isTryCatchFinally: true,
                    trySeq: {
                        isSequence: true,
                        children: [{ isThrow: true, expr: { isVariable: true, name: 'e' } }]
                    },
                    err: { isVariable: true, name: 'err' },
                    catchSeq: {
                        isSequence: true,
                        children: [{ isVariable: true, name: 'err' }]
                    },
                    finallySeq: {
                        isSequence: true,
                        children: [{ isString: true, value: 'final' }]
                    }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        // try - catch
        src = 'try { true; } catch (err) { err; }';
        expected = {
            isSequence: true,
            children: [{
                isTryCatchFinally: true,
                trySeq: {
                    isSequence: true,
                    children: [{ isVariable: true, name: 'true' }]
                },
                err: { isVariable: true, name: 'err' },
                catchSeq: {
                    isSequence: true,
                    children: [{ isVariable: true, name: 'err' }]
                },
                finallySeq: { isVariable: true, name: 'undefined' }
            }]
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        // try - finally
        src = 'try { true; } finally { "final"; }';
        expected = {
            isSequence: true,
            children: [{
                isTryCatchFinally: true,
                trySeq: {
                    isSequence: true,
                    children: [{ isVariable: true, name: 'true' }]
                },
                err: { isVariable: true, name: 'undefined' },
                catchSeq: { isVariable: true, name: 'undefined' },
                finallySeq: {
                    isSequence: true,
                    children: [{ isString: true, value: 'final' }]
                }
            }]
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test14ForStatement: function() {
        // also checks: ContinueStatement
        var src = 'for (i = 1; i < 10; i++) { continue; }',
            expected = {
                isSequence: true,
                children: [{
                    isFor: true,
                    init: {
                        isSet: true,
                        left: { isVariable: true, name: 'i' },
                        right: { isNumber: true, value: 1 }
                    },
                    condExpr: {
                        isBinaryOp: true,
                        left: { isVariable: true, name: 'i' },
                        name: '<',
                        right: { isNumber: true, value: 10 }
                    },
                    upd: {
                        isPostOp: true,
                        expr: { isVariable: true, name: 'i' },
                        name: '++'
                    },
                    body: {
                        isSequence: true,
                        children: [{
                            isContinue: true
                        }]
                    }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        src = 'for (;;) { j = i; }';
        expected = {
            isSequence: true,
            children: [{
                isFor: true,
                init: { isVariable: true, name: 'undefined' },
                condExpr: { isVariable: true, name: 'undefined' },
                upd: { isVariable: true, name: 'undefined' },
                body: {
                    isSequence: true,
                    children: [{
                        isSet: true,
                        left: { isVariable: true, name: 'j' },
                        right: { isVariable: true, name: 'i' }
                    }]
                }
            }]
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test15ForInStatement: function() {
        var src = 'for (elem in obj) { }',
            expected = {
                isSequence: true,
                children: [{
                    isForIn: true,
                    name: { isVariable: true, name: 'elem' },
                    obj: { isVariable: true, name: 'obj' },
                    body: { isSequence: true }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        src = 'for (var elem in obj) { }';
        expected = {
            isSequence: true,
            children: [{
                isForIn: true,
                name: {
                    isVarDeclaration: true,
                    name: 'elem',
                    val: { isVariable: true, name: 'undefined' }
                },
                obj: { isVariable: true, name: 'obj' },
                body: { isSequence: true }
            }]
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test16WhileStatement: function() {
        var src = 'while (true) { false; }',
            expected = {
                isSequence: true,
                children: [{
                    isWhile: true,
                    condExpr: { isVariable: true, name: 'true' },
                    body: {
                        isSequence: true,
                        children: [{ isVariable: true, name: 'false' }]
                    }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test17DoWhileStatement: function() {
        var src = 'do { false; } while (true);',
            expected = {
                isSequence: true,
                children: [{
                    isDoWhile: true,
                    condExpr: { isVariable: true, name: 'true' },
                    body: {
                        isSequence: true,
                        children: [{ isVariable: true, name: 'false' }]
                    }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test18ThisExpression: function() {
        var src = 'this;',
            expected = {
                isSequence: true,
                children: [{
                    isThis: true
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test19DebuggerStatement: function() {
        var src = 'debugger;',
            expected = {
                isSequence: true,
                children: [{
                    isDebugger: true
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test20WithStatement: function() {
        var src = 'with (obj) { prop; }',
            expected = {
                isSequence: true,
                children: [{
                    isWith: true,
                    obj: { isVariable: true, name: 'obj' },
                    body: {
                        isSequence: true,
                        children: [{ isVariable: true, name: 'prop' }]
                    }
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test21ConditionalExpression: function() {
        var src = 'flag ? true : false;',
            expected = {
                isSequence: true,
                children: [{
                    isCond: true,
                    condExpr: { isVariable: true, name: 'flag' },
                    trueExpr: { isVariable: true, name: 'true' },
                    falseExpr: { isVariable: true, name: 'false' }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test22SequenceExpression: function() {
        var src = 'i--, ++j;',
            expected = {
                isSequence: true,
                children: [{
                    isSequence: true,
                    children: [
                        { isPostOp: true, name: '--', expr: { isVariable: true, name: 'i' } },
                        { isPreOp: true, name: '++', expr: { isVariable: true, name: 'j' } }
                    ]
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test23CallExpression: function() {
        var src = 'fn(a, b);',
            expected = {
                isSequence: true,
                children: [{
                    isCall: true,
                    fn: { isVariable: true, name: 'fn' },
                    args: [
                        { isVariable: true, name: 'a' },
                        { isVariable: true, name: 'b' }
                    ]
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test24MemberExpression: function() {
        var src = 'obj.prop;',
            expected = {
                isSequence: true,
                children: [{
                    isGetSlot: true,
                    obj: { isVariable: true, name: 'obj' },
                    slotName: { isString: true, value: 'prop' },
                }]
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        src = 'obj["prop"];';
        expected = {
            isSequence: true,
            children: [{
                isGetSlot: true,
                obj: { isVariable: true, name: 'obj' },
                slotName: { isString: true, value: 'prop' },
            }]
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        src = 'arr[123];';
        expected = {
            isSequence: true,
            children: [{
                isGetSlot: true,
                obj: { isVariable: true, name: 'arr' },
                slotName: { isNumber: true, value: 123 },
            }]
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test25NewExpression: function() {
        var src = 'new Object();',
            expected = {
                isSequence: true,
                children: [{
                    isNew: true,
                    clsExpr: {
                        isCall: true,
                        fn: { isVariable: true, name: 'Object' }
                    }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        src = 'new lively.Class();',
        expected = {
            isSequence: true,
            children: [{
                isNew: true,
                clsExpr: {
                    isCall: true,
                    fn: {
                        isGetSlot: true,
                        obj: { isVariable: true, name: 'lively' },
                        slotName: { isString: true, value: 'Class' }
                    }
                }
            }],
        },
        aAST = this.acornParser.parse(src),
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test26RegexLiteral: function() {
        var src = '/foo/',
            expected = {
                isSequence: true,
                children: [{
                    isRegex: true,
                    exprString: 'foo',
                    flags: ''
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        src = '/foo/img';
        expected = {
            isSequence: true,
            children: [{
                isRegex: true,
                exprString: 'foo',
                flags: 'img'
            }],
        };
        aAST = this.acornParser.parse(src);
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test27LabeledExpression: function() {
        var src = 'label: true;',
            expected = {
                isSequence: true,
                children: [{
                    isLabelDeclaration: true,
                    name: 'label',
                    expr: { isVariable: true, name: 'true' }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test28FunctionExpression: function() {
        var src = '(function fn(a) { return 23; })';
            expected = {
                isSequence: true,
                children: [{
                    isFunction: true,
                    args: [{ isVariable: true, name: 'a' }],
                    body: {
                        isSequence: true,
                        children: [{
                            isReturn: true,
                            expr: {
                                isNumber: true,
                                value: 23
                            }
                        }]
                    }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test29NullLiteral: function() {
        var src = 'null;',
            expected = {
                isSequence: true,
                children: [{ isVariable: true, name: 'null' }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },

    test30LabeledStatements: function() {
        var src = 'label: break label;',
            expected = {
                isSequence: true,
                children: [{
                    isLabelDeclaration: true,
                    name: 'label',
                    expr: { isBreak: true, label: { isLabel: true, name: 'label' } }
                }],
            },
            aAST = this.acornParser.parse(src),
            result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);

        src = 'label: for (;;) { continue label; }',
        expected = {
            isSequence: true,
            children: [{
                isLabelDeclaration: true,
                name: 'label',
                expr: {
                    isFor: true,
                    body: {
                        isSequence: true,
                        children: [
                            { isContinue: true, label: { isLabel: true, name: 'label' } }
                        ]
                    }
                }
            }],
        },
        aAST = this.acornParser.parse(src),
        result = this.acornToLK(aAST);
        this.assertMatches(expected, result);
        this.assertPositions(result);
    },
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
    },
});

Object.subclass('lively.ast.tests.AstTests.Examples',
'initialization', {
    initialize: function() {
        this.val = 0;
    },
},
'subjects', {
    nodebugger: function() {
        var i = 23;
        return i;
    },
    factorial: function(n) {
        if (n == 1) {
            return 1;
        } else {
            return n * this.factorial(n - 1);
        }
    },
    miniExample: function() {
        debugger;
    },
    simpleLocalVariable: function() {
        var a = 23;
        debugger;
    },
    simpleArgument: function(a) {
        debugger;
    },
    stopAtFive: function() {
        for (var i = 0; i < 10; i++) {
            if (i == 5) {
                debugger;
            }
        }
    },
    nestedFunction: function() {
        var a = 23;
        var fun = function() {
            var b = 42;
            debugger;
        };
        fun();
    },
    forEach: function() {
        var a = [1,2,3,4,5,6];
        a.forEach(function(i) {
            if (i == 5) {
                debugger;
            }
        });
    },
    method: function() {
        var obj = {
            hello: function() {
                debugger;
            }
        };
        obj.hello();
    },
    withinComputation: function() {
        var i = 1;
        var j = i + 2;
        debugger;
        i += j;
        i += 2;
        return i;
    },
    callAnotherDebugger: function() {
        var i = 23;
        debugger;
        this.simpleArgument(i);
    },
    callNoDebugger: function() {
        var a = 65;
        debugger;
        this.nodebugger();
    },
    returnNoDebugger: function() {
        var j = 23;
        debugger;
        var k = this.nodebugger() + j;
        return k;
    },
    ifthenelse: function(i) {
        debugger;
        if (i == 1) {
            i = 23;
        } else {
            i = 24;
        }
    },
    forloop: function(i) {
        debugger;
        var a = 0;
        for (var i = 0; i < 4; i++) {
            a += i;
        }
        var b = 2;
        return a;
    },
    whileloop: function(i) {
        var a = 4;
        debugger;
        while (a > 1) {
            a--;
        }
        var b = a + 4;
        return b;
    },
    dowhileloop: function() {
        var a = 3;
        debugger;
        do {
            a--;
        } while (a > 0);
        var b = a + 2;
        return b;
    },

    restart: function() {
        var i = 0;
        i++;
        debugger;
        i++;
        return i;
    },
    restartSideEffect: function() {
        var i = this.val + 1;
        debugger;
    }
});

TestCase.subclass('lively.ast.tests.AstTests.ContainsDebuggerTest',
'running', {
    setUp: function($super) {
        $super();
        this.examples = new lively.ast.tests.AstTests.Examples();
    },
},
'testing', {
    testItself: function() {
        var a = 1;
        var b = 2;
        var c = a + b;
        this.assertEquals(3, c);
        this.assert(this.testItself.containsDebugger() == false);
    },
    testMiniExample: function() {
        this.assert(this.examples.miniExample.containsDebugger());
    },
    testSimpleLocalVariable: function() {
        this.assert(this.examples.simpleLocalVariable.containsDebugger());
    },
    testSimpleArgument: function(a) {
        this.assert(this.examples.simpleArgument.containsDebugger());
    },
    testStopAtFive: function() {
        this.assert(this.examples.stopAtFive.containsDebugger());
    },
    testForEach: function() {
        this.assert(this.examples.forEach.containsDebugger());
    },
    testMethod: function() {
        this.assert(this.examples.method.containsDebugger());
    }
});

TestCase.subclass('lively.ast.tests.AstTests.BreakpointTest',
'running', {
    setUp: function($super) {
        $super();
        this.examples = new lively.ast.tests.AstTests.Examples();
        this.oldHalt = lively.ast.halt;
        lively.ast.halt = Functions.True;
    },
    tearDown: function($super) {
        $super();
        lively.ast.halt = this.oldHalt;
    }
},
'helping', {
    assertBreaks: function(cb) {
        try {
            cb();
            this.assert(false, "function did not break");
        } catch (e) {
            if (e.isUnwindException) return e.topFrame;
            throw e;
        }
        return undefined;
    },
    assertBreaksWhenInterpretated: function(fun, arg) {
        var examples = this.examples;
        return this.assertBreaks(function() {
            fun.forInterpretation().call(examples, arg);
        });
    },
    assertStep: function(frame, expectedMapping) {
        this.assertBreaks(function() { frame.stepToNextStatement(); });
        for (var name in expectedMapping) {
            this.assertEquals(frame.mapping[name], expectedMapping[name]);
        }
    }
},
'testing', {
    testMiniExample: function() {
        this.assertBreaksWhenInterpretated(this.examples.miniExample);
    },
    testSimpleLocalVariable: function() {
        this.assertBreaksWhenInterpretated(this.examples.simpleLocalVariable);
    },
    testSimpleArgument: function(a) {
        var frame = this.assertBreaksWhenInterpretated(this.examples.simpleArgument, 23);
        this.assertEquals(frame.mapping["a"], 23);
    },
    testStopAtFive: function() {
        this.assertBreaksWhenInterpretated(this.examples.stopAtFive);
    },
    testNestedFunction: function() {
        var inner = this.assertBreaksWhenInterpretated(this.examples.nestedFunction);
        this.assertEquals(inner.mapping["b"], 42);
        var outer = inner.getContainingScope();
        this.assertEquals(outer.mapping["a"], 23);
        this.assertEqualState(["this", "a", "fun"], Object.keys(outer.mapping));
    },
    testForEach: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.forEach);
        this.assertEquals(frame.mapping["i"], 5);
    },
    testMethod: function() {
        this.assertBreaksWhenInterpretated(this.examples.method);
    },
    testComputation: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.withinComputation);
        var mapping = frame.mapping;
        this.assertEquals(mapping["i"], 1);
        this.assertEquals(mapping["j"], 3);
    },
    testResume: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.withinComputation);
        var result = frame.resume();
        this.assertEquals(result, 6);
    },
    testStep: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.withinComputation);
        var frame2 = this.assertBreaks(function() { frame.stepToNextStatement() });
        this.assertEquals(frame, frame2);
        var mapping = frame.mapping;
        this.assertEquals(mapping["i"], 1);
        this.assertEquals(mapping["j"], 3);
    },
    testStepTwice: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.withinComputation);
        var frame2 = this.assertBreaks(function() { frame.stepToNextStatement() });
        var frame3 = this.assertBreaks(function() { frame.stepToNextStatement() });
        this.assertEquals(frame, frame3);
        this.assertEquals(frame2, frame3);
        var mapping = frame.mapping;
        this.assertEquals(mapping["i"], 4);
        this.assertEquals(mapping["j"], 3);
    },
    testStepThreeTimes: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.withinComputation);
        var frame2 = this.assertBreaks(function() { frame.stepToNextStatement() });
        var frame3 = this.assertBreaks(function() { frame.stepToNextStatement() });
        var frame4 = this.assertBreaks(function() { frame.stepToNextStatement() });
        this.assertEquals(frame, frame3);
        this.assertEquals(frame2, frame3);
        this.assertEquals(frame3, frame4);
        var mapping = frame.mapping;
        this.assertEquals(mapping["i"], 6);
        this.assertEquals(mapping["j"], 3);
    },
    testStartsHalted: function() {
        var that = this;
        var fun = (function() {var i=23}).forInterpretation();
        var frame = this.assertBreaks(fun.startHalted());
        this.assertEquals(frame.mapping["i"], null);
        this.assertBreaks(function() {
            that.assert(frame.stepToNextStatement());
        });
        this.assertEquals(frame.mapping["i"], 23);
        frame.stepToNextStatement();
    },
    testStepOverAnotherDebugger: function() {
        var that = this;
        var outer = this.assertBreaksWhenInterpretated(this.examples.callAnotherDebugger);
        this.assertBreaks(function() { outer.stepToNextStatement(); });
        var inner = this.assertBreaks(function() {
            that.assert(outer.stepToNextStatement());
        });
        this.assertEquals(outer, inner.getCaller());
        this.assertEquals(inner.mapping["a"], 23);
        this.assertEquals(outer.mapping["i"], 23);
        this.assertEquals(inner,
            this.assertBreaks(function() { inner.stepToNextStatement(); })
        );
        this.assertEquals(outer,
            this.assertBreaks(function() { inner.stepToNextStatement(); })
        );
        outer.stepToNextStatement();
    },
    testStepInto: function() {
        var that = this;
        var outer = this.assertBreaksWhenInterpretated(this.examples.callNoDebugger);
        this.assertEquals(outer.mapping["a"], 65);
        this.assertBreaks(function() { that.assert(outer.stepToNextStatement()); });
        var inner = this.assertBreaks(function() {
            that.assert(outer.stepToNextStatement(true));
        });
        this.assertBreaks(function() { that.assert(inner.stepToNextStatement()); });
        this.assertEquals(inner.mapping["i"], 23);
        this.assertEquals(outer, inner.getCaller());
    },
    testResumeReturn: function() {
        var outer = this.assertBreaksWhenInterpretated(this.examples.returnNoDebugger);
        this.assertEquals(outer.mapping["j"], 23);
        this.assertEquals(outer.resume(), 46);
    },
    testResumeReturnAfterStepInto: function() {
        var that = this;
        var outer = this.assertBreaksWhenInterpretated(this.examples.returnNoDebugger);
        this.assertEquals(outer.mapping["j"], 23);
        this.assertBreaks(function() { that.assert(outer.stepToNextStatement()); });
        var inner = this.assertBreaks(function() {
            that.assert(outer.stepToNextStatement(true));
        });
        this.assertBreaks(function() { that.assert(inner.stepToNextStatement()); });
        this.assertEquals(inner.mapping["i"], 23);
        this.assertEquals(inner.resume(), 46);
    },
    testStepOutAfterReturnStepInto: function() {
        var that = this;
        var outer = this.assertBreaksWhenInterpretated(this.examples.returnNoDebugger);
        this.assertBreaks(function() { that.assert(outer.stepToNextStatement()); });
        var inner = this.assertBreaks(function() {
            that.assert(outer.stepToNextStatement(true));
        });
        this.assertBreaks(function() { that.assert(inner.stepToNextStatement()); });
        this.assertEquals(inner,
            this.assertBreaks(function() { that.assert(inner.stepToNextStatement()); })
        );
        this.assertEquals(outer,
            this.assertBreaks(function() { that.assert(inner.stepToNextStatement()); })
        );
        this.assertEquals(outer.mapping["k"], 46);
    },
    testStepOverIfThen: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.ifthenelse, 1);
        this.assertEquals(frame.mapping.i, 1);
        this.assertBreaks(function() { frame.stepToNextStatement(); });
        this.assertEquals(frame.mapping.i, 1);
        this.assertBreaks(function() { frame.stepToNextStatement(); });
        this.assertEquals(frame.mapping.i, 1);
        this.assertBreaks(function() { frame.stepToNextStatement(); });
        this.assertEquals(frame.mapping.i, 23);
    },
    testStepOverIfElse: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.ifthenelse, 2);
        this.assertEquals(frame.mapping.i, 2);
        this.assertBreaks(function() { frame.stepToNextStatement(); });
        this.assertEquals(frame.mapping.i, 2);
        this.assertBreaks(function() { frame.stepToNextStatement(); });
        this.assertEquals(frame.mapping.i, 2);
        this.assertBreaks(function() { frame.stepToNextStatement(); });
        this.assertEquals(frame.mapping.i, 24);
    },
    testFactorial: function() {
        var that = this;
        var fun = this.examples.factorial.forInterpretation();
        var fac3 = this.assertBreaks(function() {
           fun.startHalted().apply(that.examples, [3]);
        });
        this.assertEquals(fac3.mapping.n, 3);
        this.assertBreaks(function() {
            that.assert(fac3.stepToNextStatement());
        });
        var fac2 = this.assertBreaks(function() {
            that.assert(fac3.stepToNextStatement(true));
        });
        this.assert(fac3 !== fac2);
        this.assertEquals(fac2.mapping.n, 2);
        this.assertBreaks(function() {
            that.assert(fac2.stepToNextStatement());
        });
        var fac1 = this.assertBreaks(function() {
            that.assert(fac2.stepToNextStatement(true));
        });
        this.assert(fac1 !== fac2);
        this.assert(fac1 !== fac3);
        this.assertEquals(fac1.mapping.n, 1);
        this.assertBreaks(function() {
            that.assert(fac1.stepToNextStatement());
        });
        this.assertBreaks(function() {
            that.assert(fac1.stepToNextStatement());
        });
        this.assertEquals(fac2, this.assertBreaks(function() {
            that.assert(fac1.stepToNextStatement(true));
        }));
        this.assertEquals(6, fac2.resume());
    },
    testForLoop: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.forloop);
        this.assertStep(frame,{});
        this.assertStep(frame,{a:0});
        this.assertStep(frame,{a:0,i:0});
        this.assertStep(frame,{a:0,i:0});
        this.assertStep(frame,{a:0,i:0});
        this.assertStep(frame,{a:0,i:1});
        this.assertStep(frame,{a:0,i:1});
        this.assertStep(frame,{a:1,i:1});
        this.assertStep(frame,{a:1,i:2});
        this.assertStep(frame,{a:1,i:2});
        this.assertStep(frame,{a:3,i:2});
        this.assertStep(frame,{a:3,i:3});
        this.assertStep(frame,{a:3,i:3});
        this.assertStep(frame,{a:6,i:3});
        this.assertStep(frame,{a:6,i:4});
        this.assertStep(frame,{a:6,i:4});
        this.assertStep(frame,{a:6,b:2,i:4});
        this.assertEquals(frame.resume(),6);
    },
    testSimpleRestart: function() {
        var that = this;
        var frame = this.assertBreaksWhenInterpretated(this.examples.restart);
        this.assertEquals(frame.mapping.i, 1);
        this.assertBreaks(function() {
            frame.restart();
        });
        this.assertBreaks(function() {
            that.assert(frame.resume());
        });
        this.assertEquals(frame.mapping.i, 1);
    },
    testSideEffectRestart: function() {
        var that = this;
        var frame = this.assertBreaksWhenInterpretated(this.examples.restartSideEffect);
        this.assertEquals(frame.mapping.i, 1);
        this.assertBreaks(function() {
            that.assert(frame.restart());
        });
        this.examples.val = 2;
        this.assertBreaks(function() {
            that.assert(frame.resume());
        });
        this.assertEquals(frame.mapping.i, 3);
    },
    testWhileLoop: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.whileloop);
        this.assertStep(frame,{a:4});
        this.assertStep(frame,{a:4});
        this.assertStep(frame,{a:3});
        this.assertStep(frame,{a:3});
        this.assertStep(frame,{a:2});
        this.assertStep(frame,{a:2});
        this.assertStep(frame,{a:1});
        this.assertStep(frame,{a:1});
        this.assertStep(frame,{a:1,b:5});
        this.assertEquals(frame.resume(),5);
    },
    testDoWhileLoop: function() {
        var frame = this.assertBreaksWhenInterpretated(this.examples.dowhileloop);
        this.assertStep(frame,{a:3});
        this.assertStep(frame,{a:2});
        this.assertStep(frame,{a:2});
        this.assertStep(frame,{a:1});
        this.assertStep(frame,{a:1});
        this.assertStep(frame,{a:0});
        this.assertStep(frame,{a:0});
        this.assertStep(frame,{a:0,b:2});
        this.assertEquals(frame.resume(),2);
    }
});

TestCase.subclass('lively.ast.tests.AstTests.SteppingAstTest',
'running', {
    setUp: function() {}
},
'testing', {
    testSimpleStatements: function() {
        var fun = function() { var a = 1; var b = 2; alert(b); };
        var ast = fun.ast();
        var node = ast.firstStatement();
        this.assert(node.isVarDeclaration);
        node = node.nextStatement();
        this.assert(node.isVarDeclaration);
        node = node.nextStatement();
        this.assert(node.isCall);
    },
    testIf: function() {
        var fun = function() { if (2 == 1+1) alert(3) ; var a = 1};
        var ast = fun.ast();
        var node = ast.firstStatement();
        this.assert(node.isBinaryOp);
        node = node.nextStatement();
        this.assert(node.isCall);
        node = node.nextStatement();
        this.assert(node.isVarDeclaration);
    },
    testIfBlock: function() {
        var fun = function() { if (2 == 1+1) { a(3); a(4) } var a = 1};
        var ast = fun.ast();
        var node = ast.firstStatement();
        this.assert(node.isBinaryOp);
        node = node.nextStatement();
        this.assert(node.isCall);
        node = node.nextStatement();
        this.assert(node.isCall);
        node = node.nextStatement();
        this.assert(node.isVarDeclaration);
    },
    testIfThenElseBlock: function() {
        var fun = function() {if(2>1){a(3);a(4)}else{c=3;c=4}var a=1};
        var ast = fun.ast();
        var node = ast.firstStatement();
        this.assert(node.isBinaryOp, "2>1");
        node = node.nextStatement();
        this.assert(node.isCall, "a(3)");
        node = node.nextStatement();
        this.assert(node.isCall, "a(4)");
        node = node.nextStatement();
        this.assert(node.isVarDeclaration, "var a=1");
        node = ast.nodeForAstIndex(12);
        this.assert(node.isSet, "c=3");
        node = node.nextStatement();
        this.assert(node.isSet, "c=4");
        node = node.nextStatement();
        this.assert(node.isVarDeclaration, "var a=1");
    },
    testForLoop: function() {
        var fun = function() {var a=0;for(var i=1;i<4;i++){a=i}};
        var ast = fun.ast();
        var node = ast.firstStatement(); //var a=0
        this.assert(node.isVarDeclaration);
        node = node.nextStatement(); //var i=1
        this.assert(node.isVarDeclaration);
        node = node.nextStatement(); //i<4
        this.assert(node.isBinaryOp);
        node = node.nextStatement(); //a=i
        this.assert(node.isSet);
        node = node.nextStatement(); //i++
        this.assert(node.isPostOp);
        node = node.nextStatement(); //i<4
        this.assert(node.isBinaryOp);
    },
    testWhileLoop: function() {
        var fun = function() {var i=4;while(i>1){i--};var b=2};
        var ast = fun.ast();
        var node = ast.firstStatement(); //var i=4
        this.assert(node.isVarDeclaration);
        node = node.nextStatement(); //i>1
        this.assert(node.isBinaryOp);
        node = node.nextStatement(); //i--
        this.assert(node.isPostOp);
        node = node.nextStatement(); //i>1
        this.assert(node.isBinaryOp);
    },
    testDoWhileLoop: function() {
        var fun = function() {var a=3;do{a--}while(a>0);var b=2};
        var ast = fun.ast();
        var node = ast.firstStatement(); //var a=3
        this.assert(node.isVarDeclaration);
        node = node.nextStatement(); //a--
        this.assert(node.isPostOp);
        node = node.nextStatement(); //a>0
        this.assert(node.isBinaryOp);
        node = node.nextStatement(); //a--
        this.assert(node.isPostOp);
    },
    testForLoopIsAfter: function() {
        var fun = function() {var a=0;for(var i=1;i<4;i++){a=i;}var b;return b;};
        var ast = fun.ast();
        var node = ast.firstStatement().nextStatement(); //var i=1
        var set = node._parent._parent.body.children[0];
        var decl = ast.body.children[2].children[0];
        this.assert(decl.isVarDeclaration);
        this.assert(decl.isAfter(set), "declaration should be after set");
    },
    testPostOpStatements: function() {
        var src = "i++;a++";
        var ast = lively.ast.Parser.parse(src, "topLevel");
        this.assert(ast.children[0].isPostOp);
        this.assert(ast.children[0].nextStatement().isPostOp);
        this.assert(ast.children[0].expr.nextStatement().isPostOp);
    }
});

}) // end of module
