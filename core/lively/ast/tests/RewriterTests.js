module('lively.ast.tests.RewriterTests').requires('lively.ast.Rewriting', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ast.tests.RewriterTests.AcornRewrite',
'running', {

    setUp: function($super) {
        $super();
        this.parser = lively.ast.acorn;
        this.rewrite = Global.rewrite;
    }

},
'helping', {

    assertTryWrapper: function(ast, level, vars) {
        if (level == undefined)
            level = 0;
        var prevLevel = (level > 0) ? '__' + (level - 1) : 'Global';
        var expected = {
                type: 'TryStatement',
                block: {
                    type: 'BlockStatement',
                    body: [{
                        type: 'VariableDeclaration',
                        declarations: [{
                            type: 'VariableDeclarator',
                            id: {type: 'Identifier', name: '_'},
                            init: {type: 'ObjectExpression', properties: []}
                        }, {
                            type: 'VariableDeclarator',
                            id: {type: 'Identifier', name: '_' + level},
                            init: {
                                type: 'ObjectExpression',
                                properties: vars ?
                                vars.map(function(ea) {
                                    return {
                                        key: {type: 'Literal', value: ea},
                                        kind: 'init',
                                        value: {type: 'Identifier', name: 'undefined'}
                                    };
                                }) : []
                            }
                        }, {
                            type: 'VariableDeclarator',
                            id: {type: 'Identifier', name: '__' + level},
                            init: {
                                type: 'ArrayExpression',
                                elements: [
                                    {type: 'Identifier', name: '_'},
                                    {type: 'Identifier', name: '_' + level},
                                    {type: 'Identifier', name: prevLevel}]
                            }
                        }]
                    }]
                },
                handler: {
                    type: 'CatchClause',
                    param: {type: 'Identifier', name: 'e'},
                    body: {
                        type: 'BlockStatement',
                        body: [{
                            type: 'VariableDeclaration',
                            declarations: [{
                                type: 'VariableDeclarator',
                                id: {type: 'Identifier', name: 'ex'},
                                init: {
                                    type: 'ConditionalExpression',
                                    test: {
                                        type: 'MemberExpression',
                                        object: {type: 'Identifier', name: 'e'},
                                        property: {type: 'Identifier', name: 'isUnwindException'},
                                    },
                                    consequent: {type: 'Identifier', name: 'e'},
                                    alternate: {
                                        type: 'NewExpression',
                                        arguments: [{type: 'Identifier', name: 'e'}],
                                        callee: {
                                            type: 'MemberExpression',
                                            object: {
                                                type: 'MemberExpression',
                                                object: {
                                                    type: 'MemberExpression',
                                                    object: {type: 'Identifier', name: 'lively'},
                                                    property: {type: 'Identifier', name: 'ast'}
                                                },
                                                property: {type: 'Identifier', name: 'Rewriting'}
                                            },
                                            property: {type: 'Identifier', name: 'UnwindException'},
                                        },
                                    }
                                }
                            }]
                        }, {
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'MemberExpression',
                                    object: {type: 'Identifier', name: 'ex'},
                                    property: {type: 'Identifier', name: 'shiftFrame'},
                                },
                                arguments: [
                                    {type: 'Identifier', name: 'this'},
                                    {type: 'Identifier', name: '__' + level}]
                            }
                        }, {type: 'ThrowStatement',
                            argument: {type: 'Identifier', name: 'ex'}
                        }]
                    }
                },
                finalizer: null
        };
        this.assertMatches(expected, ast);
    },

    storedValue: function(range) {
        var expr = {
            type: 'MemberExpression',
            object: {type: 'Identifier', name: '_'},
            property: {type: 'Literal'},
            computed: true
        };
        if (range) expr.property.value = range;
        return expr;
    },

    localVarRef: function(name, level) {
        level = level || 0;
        return {
            type: 'MemberExpression',
            object: {type: 'Identifier', name: '_' + level},
            property: {type: 'Literal', value: name},
            computed: true
        };
    },

    closureWrapper: function(functionAST, level) {
        functionAST = functionAST || {};
        if (level == undefined) level = 0;
        return {
            type: 'CallExpression',
            callee: {type: 'Identifier', name: '__createClosure'},
            arguments: [
                {type: 'Literal'}, // a AST number
                {type: 'Identifier', name: '__' + level},
                functionAST]
        };
    }
},
'testing', {

    test01WrapperTest: function() {
        var expected1 = {type: 'Program', body: []}, // body checked by assertTryWrapper
            expected2 = {type: 'ExpressionStatement', expression: {type: 'Literal', value: '12345'}},
            ast = this.parser.parse('12345;'),
            result = this.rewrite(ast);
        this.assertMatches(expected1, result);
        this.assertTryWrapper(result.body[0]);
        this.assertMatches(expected2, result.body[0].block.body[1]);
    },

    test02LocalVarTest: function() {
        var src = 'var i = 0; i;',
            expected = [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    left: this.storedValue('4-9'),
                    operator: '=',
                    right: {
                        type: 'AssignmentExpression',
                        left: this.localVarRef('i'),
                        operator: '=',
                        right: {type: 'Literal', value: 0}
                    }
                }
            }, {type: 'ExpressionStatement', expression: this.localVarRef('i')}],
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected[0], result.body[0].block.body.slice(1)[0]);
    },

    test03GlobalVarTest: function() {
        var src = 'i;',
            expected = [{type: 'ExpressionStatement', expression: {type: 'Identifier', name: 'i'}}],
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body.slice(1));
    },

    test04MultiVarDeclarationTest: function() {
        var src = 'var i = 0, j;',
            expected = [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'SequenceExpression',
                    expressions: [{
                        type: 'AssignmentExpression',
                        left: this.storedValue(),
                        operator: '=',
                        right: {
                            type: 'AssignmentExpression',
                            left: this.localVarRef('i'),
                            operator: '=',
                            right: {type: 'Literal', value: 0}
                        }
                    }, {
                        type: 'AssignmentExpression',
                        left: this.storedValue(),
                        operator: '=',
                        right: {
                            type: 'AssignmentExpression',
                            left: this.localVarRef('j'),
                            operator: '=',
                            right: {type: 'Identifier', name: 'undefined'}
                        }
                    }]
                }
            }],
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body.slice(1));
    },

    test05FunctionDeclarationTest: function() {
        var src = 'function fn(k, l) {}',
            expected = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {
                        type: 'AssignmentExpression',
                        left: this.localVarRef('fn'),
                        operator: '=',
                        right: this.closureWrapper({
                            type: 'FunctionExpression', id: {type: "Identifier", name: 'fn'},
                            params: [
                                {type: 'Identifier', name: 'k'},
                                {type: 'Identifier', name: 'l'}
                            ],
                            body: {}  // body checked by assertTryWrapper
                        })
                    }
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
        this.assertTryWrapper(
            result.body[0].block.body[1].   // body statement
            expression.right.right.         // closure wrapper
            arguments[2].                   // rewritten function
            body.body[0], 1);
    },

    test06ScopedVariableTest: function() {
        var src = 'var i = 0; function fn() {var i = 1;}',
            expected1 = {type: 'ExpressionStatement',
                expression: {type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {type: 'AssignmentExpression',
                        left: this.localVarRef('i'),
                        operator: '=',
                        right: {type: 'Literal', value: 0}
                }
            }
        },
            expected2 = {type: 'ExpressionStatement',
                expression: {type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {type: 'AssignmentExpression',
                        left: this.localVarRef('i', 1),
                        operator: '=',
                        right: {type: 'Literal', value: 1}
                }
            }
        },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected1, result.body[0].block.body[1]);
        this.assertMatches(expected2,
            result.body[0].block.body[2].   // second body statement
            expression.right.right.         // closure wrapper
            arguments[2].                   // rewritten function
            body.body[0].block.body[1]);
    },

    test07UpperScopedVariableTest: function() {
        var src = 'var i = 0; function fn() {i;}',
            expected1 = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {
                        type: 'AssignmentExpression',
                        left: this.localVarRef('i'),
                        operator: '=',
                        right: {type: 'Literal', value: 0}
                    }
                }
            },
            expected2 = {type: 'ExpressionStatement', expression: this.localVarRef('i')},
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected1, result.body[0].block.body[1]);
        this.assertMatches(expected2,
            result.body[0].block.body[2].   // second body statement
            expression.right.right.         // closure wrapper
            arguments[2].                   // rewritten function
            body.body[0].block.body[1]);
    },

    test08ForWithVarDeclarationTest: function() {
        var src = 'for (var i = 0; i < 10; i++) {}',
            expected = {
                type: 'ForStatement',
                init: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {
                        type: 'AssignmentExpression',
                        left: this.localVarRef('i'),
                        operator: '=',
                        right: {type: 'Literal', value: 0}
                    }
                },
                test: {
                    type: 'BinaryExpression',
                    left: this.localVarRef('i'),
                    operator: '<',
                    right: {type: 'Literal', value: 10}
                },
                update: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {type: 'UpdateExpression', argument: this.localVarRef('i')}
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    },

    test09ForInWithVarDeclarationTest: function() {
        var src = 'for (var key in obj) {}',
            expected = {type: 'ForInStatement',
                left: this.localVarRef('key'),
                right: {type: 'Identifier', name: 'obj'}
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    },

    test10EmptyForTest: function() {
        var src = 'for (;;) {}',
            expected = {type: 'ForStatement', init: null, test: null, update: null},
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    },

    test11FunctionAssignmentTest: function() {
        var src = 'var foo = function bar() {}',
            expected = {type: 'ExpressionStatement',
                expression: {type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {
                        type: 'AssignmentExpression',
                        left: this.localVarRef('foo'),
                        operator: '=',
                        right: {
                            type: 'AssignmentExpression',
                            left: this.storedValue(),
                            operator: '=',
                            right: this.closureWrapper({
                                type: 'FunctionExpression',
                                id: {type: "Identifier", name: "bar"},
                                params: [], body: {}})
                        }
                    }
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    },

    test12FunctionAsParameterTest: function() {
        var src = 'fn(function () {});',
            expected = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {type: 'CallExpression',
                        callee: {type: 'Identifier', name: 'fn'},
                        arguments: [{
                            type: 'AssignmentExpression',
                            left: this.storedValue(),
                            operator: '=',
                            right: this.closureWrapper({
                                type: 'FunctionExpression', id: null,
                                params: [], body: {}})
                        }]
                    }
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    },

    test13FunctionAsPropertyTest: function() {
        var src = '({fn: function () {}});',
            expected = {type: 'ExpressionStatement',
                expression: {type: 'ObjectExpression',
                    properties: [{
                        key: {type: 'Identifier', name: 'fn'},
                        kind: 'init',
                        value: {
                            type: 'AssignmentExpression',
                            left: this.storedValue(),
                            operator: '=',
                            right: this.closureWrapper({
                                type: 'FunctionExpression', id: null,
                                params: [], body: {}})
                        }
                    }]
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    },

    test14FunctionAsSetterGetterTest: function() {
        var src = '({get foo() {}, set bar(val) {val++;}});',
            expected = {type: 'ExpressionStatement',
                expression: {type: 'ObjectExpression',
                    properties: [{
                        key: {type: 'Identifier', name: 'foo'},
                        kind: 'get',
                        value: {
                            type: 'FunctionExpression',
                            id: null, params: [],
                            body: {type: 'BlockStatement', body: [] /*original body wrapped in try*/}
                        }
                    }, {
                        key: {type: 'Identifier', name: 'bar'},
                        kind: 'set',
                        value: {
                            type: 'FunctionExpression',
                            id: null, params: [{type: 'Identifier', name: 'val'}],
                            body: {type: 'BlockStatement', body: [] /*original body wrapped in try*/}
                        }
                    }]
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
        this.assertTryWrapper(
            result.body[0].block.body[1].   // body statement
            expression.properties[0].       // getter
            value.body.body[0], 1);
        this.assertTryWrapper(
            result.body[0].block.body[1].   // body statement
            expression.properties[1].       // setter
            value.body.body[0], 1);
    },

    test15FunctionAsReturnArgumentTest: function() {
        var src = '(function () {return function() {};});',
            expected = {
                type: 'ReturnStatement',
                argument: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: this.closureWrapper({
                        type: 'FunctionExpression', id: null,
                        params: [], body: {}}, 1)
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected,
            result.body[0].block.body[1].expression.right.arguments[2]. // outer function
            body.body[0].                                               // try wrapper
            block.body[1]);
    },

    test16FunctionInConditionalTest: function() {
        var src = 'true ? function() {} : 23;',
            expected = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'ConditionalExpression',
                    test: {
                        type: 'Literal', value: true},
                    consequent: {
                        type: 'AssignmentExpression',
                        left: this.storedValue(),
                        operator: '=',
                        right: this.closureWrapper({
                            type: 'FunctionExpression', id: null,
                            params: [], body: {}})
                    },
                    alternate: {type: 'Literal', value: 23}
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    },

    test17ClosureCallTest: function() {
        var src = '(function() {})();',
            expected = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {
                        type: 'CallExpression',
                        arguments: [],
                        callee: {
                            type: 'AssignmentExpression',
                            left: this.storedValue(),
                            operator: '=',
                            right: this.closureWrapper({
                                type: 'FunctionExpression', id: null,
                                params: [], body: {}})
                        }
                    }
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
        this.assertTryWrapper(
            result.body[0].block.body[1].   // body statement
            expression.right.               // call
            callee.right.                   // closure wrapper
            arguments[2].body.body[0], 1);
    },

    test18MemberChainSolvingTest: function() {
        var src = 'var lively, ast, morphic; lively.ast.morphic;',
            expected = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'MemberExpression',
                    property: {type: 'Identifier', name: 'morphic'},
                    object: {
                        type: 'MemberExpression',
                        object: this.localVarRef('lively'),
                        property: {type: 'Identifier', name: 'ast'} 
                    }
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[2]);
    },

    test19FunctionInMemberChainTest: function() {
        var src = '(function() {}).toString();',
            expected = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    right: {
                        type: 'CallExpression',
                        arguments: [],
                        callee: {
                            type: 'MemberExpression',
                            property: {type: 'Identifier', name: 'toString'},
                            object: {
                                type: 'AssignmentExpression',
                                left: this.storedValue(),
                                operator: '=',
                                right: this.closureWrapper({
                                    type: 'FunctionExpression', id: null,
                                    params: [], body: {}})
                            }
                        }
                    }
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    },

    test20ObjectPropertyNamingTest: function() {
        var src = 'var foo; ({foo: foo});',
            expected = [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    left: this.storedValue(),
                    operator: '=',
                    right: {
                        type: 'AssignmentExpression',
                        left: this.localVarRef('foo'),
                        operator: '=',
                        right: {type: 'Identifier', value: undefined}
                    }
                }
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {type: 'Identifier', name: 'foo'},
                        kind: 'init',
                        value: this.localVarRef('foo')
                    }]
                }
            }],
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body.slice(1));
    },

    test21FunctionAsArrayElementTest: function() {
        var src = '[function() {}];',
            expected = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'ArrayExpression',
                    elements: [{
                        type: 'AssignmentExpression',
                        left: this.storedValue(),
                        operator: '=',
                        right: this.closureWrapper({
                            type: 'FunctionExpression', id: null,
                            params: [], body: {}
                        })
                    }]
                }
            },
            ast = this.parser.parse(src),
            result = this.rewrite(ast);
        this.assertMatches(expected, result.body[0].block.body[1]);
    }
});

TestCase.subclass('lively.ast.tests.RewriterTests.AcornRewriteExecution',
'testing', {

    test01LoopResult: function() {
        function code() {
            var result = 0;
            for (var i = 0; i < 10; i++) result += i;
            return result;
        }
        var src = Strings.format('(%s)();', code),
            src2 = escodegen.generate(rewrite(lively.ast.acorn.parse(src)));
        this.assertEquals(eval(src), eval(src2), code + ' not identically rewritten');
    }

});

TestCase.subclass('lively.ast.tests.ContinuationTest',
'testing', {

    test01LinearFlow: function() {
        function code() {
            var x = 1;
            debugger;
            var y = 2;
            return x + y;
        }
        var continuation = lively.ast.StackReification.run(code);
        this.assertEquals(1, continuation.frames()[0].varMapping.x, 'val of x');
        this.assertEquals(undefined, continuation.frames()[0].varMapping.y, 'val of y');
        // var result = continuation.resume();
        // this.assertEquals(3, result, 'result when resuming continuation');
    }

});

}) // end of module
