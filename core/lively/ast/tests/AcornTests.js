module('lively.ast.tests.AcornTests').requires('lively.ast.Parser', 'lively.ast.StackReification', 'lively.TestFramework').toRun(function() {

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

}) // end of module
