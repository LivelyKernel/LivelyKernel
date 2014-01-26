module('lively.ast.tests.DeprecatedJSParserTests').requires('lively.ast.Parser', 'lively.ast.StackReification', 'lively.TestFramework').toRun(function() {

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
});


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

}) // end of module
