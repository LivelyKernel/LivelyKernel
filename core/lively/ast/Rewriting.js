module('lively.ast.Rewriting').requires('lively.ast.Parser').toRun(function() {

Object.extend(lively.ast, {
    oldEval: eval
});

Object.extend(lively.ast.Rewriting, {
    table: []
});

Object.subclass('lively.ast.Rewriting.UnwindException',
'settings', {
    isUnwindException: true
},
'initializing', {
    initialize: function(error) {
        this.error = error;
    }
},
'printing', {
    toString: function() {
        return this.error.toString();
    }
},
'frames', {
    shiftFrame: function(thiz, frame) {
        var computationFrame = frame[0];
        var localFrame = frame[1];
        localFrame["this"] = thiz;
        var astIndex = frame[2];
        var scope = frame[3];
        var stackFrame = [computationFrame, localFrame, astIndex, Global, scope];
        if (!this.top) {
            this.top = this.last = stackFrame;
            return;
        }
        this.last[3] = stackFrame;
        this.last = stackFrame;
    }
});

Object.extend(Global, {
    __createClosure: function(idx, scope, f) {
        f._cachedAst = lively.ast.Rewriting.table[idx];
        f._cachedScope = scope;
        return f;
    }
});

Object.extend(JSLoader, {
    loadJs2: function (url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
        var exactUrl = url;
        if ((exactUrl.indexOf('!svn') <= 0) && !okToUseCache) {
            exactUrl = this.makeUncached(exactUrl, cacheQuery);
        }
        $.ajax(exactUrl, {
            success: lively.ast.Rewriting.loadJS.bind(lively.ast.Rewriting, onLoadCb)
        });
    }
});

Object.extend(lively.ast.Rewriting, {
    loadJS: function(cb, src) {
        if (!src) { src = cb; cb = null; }
        eval(src);
        if (cb) cb();
    }
});

(function extendAcorn() {
    /*
    // reimplementation of lively.ast.Rewriting.Rewriter for Parser API
    // (without astIdx, so astIdx is always 1)
    */
    acorn.walk.rewrite = function(node) {
        var scopes = [];

        function newNode(type, node) {
            node.type = type;
            node.start = 0;
            node.end = 0;
            return node;
        }

        function enterScope() {
            scopes.push([]);
        }
        function exitScope() {
            scopes.pop();
        }
        function registerVars(vars) {
            if (scopes.length == 0) return;
            var scope = scopes.last();
            return vars.map(function(varName) {
                scope.push(varName);
                return newNode('Identifier', { name: varName });
            });
        }
        function wrapSequence(node, args) {
            function newVariable(name, value) {
                if (value == '{}') {
                    value = newNode('ObjectExpression', { properties: [] });
                } else if (Object.isArray(value)) {
                    value = newNode('ArrayExpression', {
                        elements: value.map(function(val) {
                            if (Object.isNumber(val)) {
                                return newNode('Literal', { value: val });
                            } else if (Object.isString(val)) {
                                return newNode('Identifier', { name: val });
                            } else {
                                throw new Error('Cannot interpret value in array.');
                            }
                        })
                    });
                } else if (Object.isObject(value) && (value.type != null)) {
                    // expected to be valid Parser API object
                } else
                    throw new Error('Cannot interpret value for newVariable: ' + value + '!');

                return newNode('VariableDeclarator', {
                    id: newNode('Identifier', { name: name }),
                    init: value
                });
            }
            function newMemberExp(str) {
                var parts = str.split('.');
                parts = parts.map(function(part) {
                    return newNode('Identifier', { name: part });
                });
                return parts.reduce(function(object, property) {
                    return newNode('MemberExpression', {
                        object: object,
                        property: property
                    });
                });
            }
            function wrapArgs(args) {
                return newNode('ObjectExpression', {
                    properties: args.map(function(arg) {
                        return {
                            key: newNode('Literal', { value: arg.name }),
                            kind: 'init',
                            value: arg
                        }
                    })
                });
            }

            var level = scopes.length;

            // add preamble
            node.body.unshift(newNode('VariableDeclaration', {
                kind: 'var',
                declarations: [
                    newVariable('_', '{}'),
                    newVariable('_' + level, (args && args.length > 0) ? wrapArgs(args) : '{}'),
                    newVariable('__' + level,
                        ['_', '_' + level, 1, (level - 1) < 0 ? 'Global' : '__' + (level - 1)])
                ]
            }));

            // add catch for UnwindException
            node = newNode('TryStatement', {
                block: newNode('BlockStatement', { body: node.body }),
                handler: newNode('CatchClause', { guard: null,
                    param: newNode('Identifier', { name: 'e' }),
                    body: newNode('BlockStatement', { body: [
                        newNode('VariableDeclaration', {
                            kind: 'var',
                            declarations: [
                                newVariable('ex', newNode('ConditionalExpression', {
                                    test: newMemberExp('e.isUnwindException'),
                                    consequent: newNode('Identifier', { name: 'e' }),
                                    alternate: newNode('NewExpression', {
                                        arguments: [ newNode('Identifier', { name: 'e' }) ],
                                        callee: newMemberExp('lively.ast.Rewriting.UnwindException')
                                    })
                                }))
                            ]
                        }),
                        newNode('ExpressionStatement', {
                            expression: newNode('CallExpression', {
                                callee: newMemberExp('ex.shiftFrame'),
                                arguments: [
                                    newNode('Identifier', { name: 'this' }),
                                    newNode('Identifier', { name: '__' + level })
                                ]
                            })
                        }),
                        newNode('ThrowStatement', { argument: newNode('Identifier', { name: 'ex' }) })
                    ]}),
                }),
                guardedHandlers: [],
                finalizer: null
            });

            return node;
        }
        function wrapVar(name) {
            var scope;
            for (var i = scopes.length - 1; i >= 0; i--) {
                if (scopes[i].include(name)) {
                    scope = i;
                    break;
                }
            }
            if (scope == undefined) {
                return newNode('Identifier', { name: name });
            } else {
                return newNode('MemberExpression', {
                    object: newNode('Identifier', { name: '_' + scope }),
                    property: newNode('Literal', { value: name }),
                    computed: true
                });
            }
        }
        function wrapClosure(node, idx) {
            return newNode('CallExpression', {
                callee: newNode('Identifier', { name: '__createClosure' }),
                arguments: [
                    newNode('Literal', { value: idx }),
                    newNode('Identifier', { name: '__' + (scopes.length - 1) }),
                    node
                ]
            });
        }
        function storeComputationResult(node, start, end) {
            function position(node) {
                return (node.start || start || 0) + '-' + (node.end || end || 0);
            }

            if (scopes.length == 0) return node;

            return newNode('AssignmentExpression', {
                    left: newNode('MemberExpression', {
                        object: newNode('Identifier', { name: '_' }),
                        property: newNode('Literal', { value: position(node) }),
                        computed: true
                    }),
                    operator: '=',
                    right: node
            });
        }

        function findLocalVariables(ast) {
            var locals = [];
            acorn.walk.matchNodes(ast, {
                'VariableDeclaration': function(node, state, depth, type) {
                    if ((type == 'Statement') || (type == 'Expression')) return;
                    node.declarations.each(function(n) {
                        state.push(n.id.name);
                    });
                },
                'FunctionDeclaration': function(node, state, depth, type) {
                    if ((type == 'Statement') || (type == 'Expression') || (type == 'Function')) return;
                    state.push(node.id.name);
                }
            }, locals, { visitors: acorn.walk.make({
                'Function': function() { /* stop descent */ }
            })});
            return locals;
        }

        var rewriteRules = {
            FunctionDeclaration: function(node, c) { // Function
                enterScope();
                var args = registerVars(node.params.pluck('name')); // arguments
                registerVars(findLocalVariables(node.body)); // locals
                var rewritten = acorn.walk.copy(node.body, rewriteRules);
                exitScope();
                // FIXME: old rewriting reference
                lively.ast.Rewriting.table.push(node);
                var idx = lively.ast.Rewriting.table.length - 1;
                // END FIXME
                var wrapped = wrapClosure({
                    start: node.start, end: node.end, type: 'FunctionExpression',
                    body: newNode('BlockStatement', { body: [ wrapSequence(rewritten, args) ] }),
                    id: null, params: args
                }, idx);
                if (node.id && node.type == 'FunctionDeclaration') {
                    wrapped = newNode('AssignmentExpression', {
                        left: c(node.id),
                        operator: '=',
                        right: wrapped
                    });
                }
                return newNode('ExpressionStatement', {
                    expression: storeComputationResult(wrapped, node.start, node.end)
                });
            },
            ReturnStatement: function(n, c) {
                var arg = c(n.argument);
                if ((arg != null) && (arg.type == 'ExpressionStatement'))
                    arg = arg.expression; // unwrap
                return {
                    start: n.start, end: n.end, type: 'ReturnStatement',
                    argument: arg
                };
            },
            VariableDeclaration: function(n, c) { // VarDeclaration
                var decls = n.declarations.map(function(decl) {
                    var value = c(decl.init);
                    value = newNode('AssignmentExpression', {
                        left: c(decl.id),
                        operator: '=',
                        right: (decl.init && decl.init.type == 'FunctionExpression') ?
                            value.expression : // unwrap
                            value
                    });
                    if (value.right == null) { // could be ignored
                        value.right = newNode('Identifier', { name: 'undefined' });
                    }
                    return storeComputationResult(value, decl.start, decl.end);
                });

                if (decls.length == 1) {
                    return newNode('ExpressionStatement', {
                        expression: decls[0]
                    });
                } else {
                    return newNode('ExpressionStatement', {
                        expression: newNode('SequenceExpression', {
                            expressions: decls
                        })
                    })
                }
            },
            ForStatement: function(n, c) {
                var init = c(n.init);
                if ((init != null) && (init.type == 'ExpressionStatement')) // was VariableDefinition
                    init = init.expression;
                return {
                    start: n.start, end: n.end, type: 'ForStatement',
                    init: init, test: c(n.test), update: c(n.update),
                    body: c(n.body)
                };
            },
            ForInStatement: function(n, c) {
                var left;
                if (n.left.type == 'VariableDeclaration')
                    left = c(n.left.declarations[0].id);
                else
                    left = c(n.left);
                // TODO: push storeComputationResult for loop assignment into body
                return {
                    start: n.start, end: n.end, type: 'ForInStatement',
                    left: left, right: c(n.right), body: c(n.body)
                };
            },
            ConditionalExpression: function(n, c) {
                var consequent = c(n.consequent);
                if (consequent.type == 'ExpressionStatement')
                    consequent = consequent.expression; // unwrap;
                var alternate = c(n.alternate);
                if (alternate.type == 'ExpressionStatement')
                    alternate = alternate.expression; // unwrap;
                return {
                    start: n.start, end: n.end, type: 'ConditionalExpression',
                    test: c(n.test), consequent: consequent,
                    alternate: alternate
                };
            },
            MemberExpression: function(n, c) {
                var property;
                if (n.computed)
                    property = c(n.property);
                else {
                    property = { // original identifier rule
                        start: n.property.start, end: n.property.end, type: 'Identifier',
                        name: n.property.name
                    };
                }
                var object = c(n.object);
                if (object.type == 'ExpressionStatement')
                    object = object.expression;
                return {
                    start: n.start, end: n.end, type: 'MemberExpression',
                    object: object, property: property, computed: n.computed
                };
            },
            CallExpression: function(n, c) { // Call
                var callee = c(n.callee);
                if (callee.type == 'ExpressionStatement')
                    callee = callee.expression; // unwrap
                return storeComputationResult({
                    start: n.start, end: n.end, type: 'CallExpression',
                    callee: callee, arguments: n.arguments.map(function(n) {
                        var n = c(n);
                        return (n.type == 'ExpressionStatement') ?
                            n.expression : // unwrap
                            n;
                    })
                });
            },
            NewExpression: function(n, c) { // New
                var callee = c(n.callee);
                return storeComputationResult({
                    start: n.start, end: n.end, type: 'NewExpression',
                    callee: callee, arguments: n.arguments.map(function(n) {
                        var n = c(n);
                        return (n.type == 'ExpressionStatement') ?
                            n.expression : // unwrap
                            n;
                    })
                });
            },
            AssignmentExpression: function(n, c) { // Set, ModifyingSet
                var right = c(n.right);
                if (right.type == 'ExpressionStatement')
                    right = right.expression; // unwrap
                return storeComputationResult({
                    start: n.start, end: n.end, type: 'AssignmentExpression',
                    left: c(n.left), operator: n.operator, right: right
                });
            },
            ExpressionStatement: function(n, c) {
                var expr = c(n.expression);
                if (expr.type == 'ExpressionStatement')
                    expr = expr.expression; // unwrap
                return {
                    start: n.start, end: n.end, type: 'ExpressionStatement',
                    expression: expr
                };
            },
            LogicalExpression: function(n, c) {
                var left = c(n.left);
                if (left.type == 'ExpressionStatement')
                    left = left.expression; // unwrap
                var right = c(n.right);
                if (right.type == 'ExpressionStatement')
                    right = right.expression; //unwrap
                return {
                    start: n.start, end: n.end, type: 'LogicalExpression',
                    left: left, operator: n.operator, right: right
                };
            },
            UpdateExpression: function(n, c) { // PreOp, PostOp
                return storeComputationResult({
                    start: n.start, end: n.end, type: 'UpdateExpression',
                    argument: c(n.argument), operator: n.operator, prefix: n.prefix
                });
            },
            Identifier: function(n, c) { // Var
                return wrapVar(n.name);
            },
            CatchClause: function(n, c) { // TryCatchFinally (catch)
                var body = c(n.body);
                var param = c(n.param);
                if (body != null) {
                    body.body.unshift(newNode('ExpressionStatement', {
                        expression: storeComputationResult(param, n.param.start, n.param.end)
                    }));
                }
                return {
                    start: n.start, end: n.end, type: 'CatchClause',
                    param: param, guard: c(n.guard), body: body
                };
            },
            ObjectExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ObjectExpression',
                    properties: n.properties.map(function(prop) {
                        var value = c(prop.value);
                        if (prop.kind != 'init') { // set or get
                            // function cannot be replace by a closure directly
                            value = value.expression.right.arguments[2]; // unwrap
                        }
                        var key;
                        if (prop.key.type == 'Identifier') {
                            key = { // original identifier rule
                                start: prop.key.start, end: prop.key.end, type: 'Identifier',
                                name: prop.key.name
                            };
                        } else
                            key = c(prop.key);
                        return {
                            key: key,
                            value: (value.type == 'ExpressionStatement') ?
                                value.expression : // unwrap
                                value,
                            kind: prop.kind
                        };
                    })
                };
            },
            ArrayExpression: function(n, c) {
                return {
                    start: n.start, end: n.end, type: 'ArrayExpression',
                    elements: n.elements.map(function(element) {
                        var elem = c(element);
                        if (elem.type == 'ExpressionStatement')
                            elem = elem.expression; // unwrap
                        return elem;
                    })
                };
            },
            DebuggerStatement: function(n, c) { // Debugger
                // do something to trigger the debugger
                var fn = newNode('FunctionExpression', {
                    body: newNode('BlockStatement', {
                        body: [newNode('ReturnStatement', {
                            argument: newNode('Literal', { value: 'Debugger' })
                        })]
                    }), id: null, params: []
                });
                fn.start = n.start;
                fn.end = n.end;
                // FIXME: storeComputationResult(fn) is not possible for value
                return newNode('ThrowStatement', {
                    argument: newNode('ObjectExpression', {
                        properties: [{
                            key: newNode('Identifier', { name: 'toString' }),
                            kind: 'init', value: fn
                        }]
                    })
                });
            }
        };
        rewriteRules.FunctionExpression = rewriteRules.FunctionDeclaration;

        enterScope();
        if (node.type == 'FunctionDeclaration') {
            var args = registerVars(node.params.pluck('name')); // arguments
        }
        registerVars(findLocalVariables(node)); // locals
        var rewritten = acorn.walk.copy(node, rewriteRules);
        exitScope();
        var wrapped = wrapSequence(rewritten, args);
        // storeComputationResult ?
        return newNode('Program', { body: [ wrapped ] });
    }
})();

}) // end of module
