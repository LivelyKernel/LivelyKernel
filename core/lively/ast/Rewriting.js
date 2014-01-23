module('lively.ast.Rewriting').requires('lively.ast.acorn').toRun(function() {

(function DEPRECATED() {

Object.extend(lively.ast, {
    oldEval: eval
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

})();

(function rewritingStuffToBeCleanedUp() {
// module('lively.ast.StackReification').load();
// module('lively.AST.AstHelper').load()

newNode = function newNode(type, node) {
    node.type = type;
    node.start = 0;
    node.end = 0;
    return node;
}

enterScope = function enterScope() {
    scopes.push([]);
}

exitScope = function exitScope() {
    scopes.pop();
}

registerVars = function registerVars(vars) {
    if (!scopes.length) return;
    var scope = scopes.last();
    return vars.map(function(varName) {
        scope.push(varName);
        return newNode('Identifier', { name: varName });
    });
}

wrapSequence = function wrapSequence(node, args, vars) {
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
    function wrapArgsAndVars(args, vars) {
        if ((!args || !args.length) && (!vars || !vars.length)) return '{}';
        var wArgs = args ? args.map(function(ea) {
                    return {
                        key: newNode('Literal', {value: ea.name}),
                        kind: 'init', value: ea
                    }
                }) : [],
            wVars = vars ? vars.map(function(ea) {
                    return {
                        key: newNode('Literal', {value: ea.name}),
                        kind: 'init',
                        value: newNode('Identifier', {name: 'undefined'})
                    }
                }) : [];
        return newNode('ObjectExpression', {properties: wArgs.concat(wVars)});
    }

    var level = scopes.length;

    // add preamble
    node.body.unshift(newNode('VariableDeclaration', {
        kind: 'var',
        declarations: [
            newVariable('_', '{}'),
            newVariable('_' + level, wrapArgsAndVars(args, vars)),
            newVariable('__' + level,
                ['_', '_' + level, (level - 1) < 0 ? 'Global' : '__' + (level - 1)])
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

wrapVar = function wrapVar(name) {
    var scope;
    for (var i = scopes.length - 1; i >= 0; i--) {
        if (scopes[i].include(name)) { scope = i; break; }
    }
    if (scope === undefined) return newNode('Identifier', { name: name });
    return newNode('MemberExpression', {
        object: newNode('Identifier', { name: '_' + scope }),
        property: newNode('Literal', { value: name }),
        computed: true
    });
}

wrapClosure = function wrapClosure(node, idx) {
    var scopeId = scopes.length - 1,
        scopeIdentifier = scopeId < 0 ?
            newNode('Literal', {value: null}) :
            newNode('Identifier', { name: '__' + (scopes.length - 1) });
    return newNode('CallExpression', {
        callee: newNode('Identifier', {name: '__createClosure'}),
        arguments: [newNode('Literal', {value: idx}), scopeIdentifier, node]
    });
}

storeComputationResult = function storeComputationResult(node, start, end) {
    if (scopes.length == 0) return node;
    var pos = (node.start || start || 0) + '-' + (node.end || end || 0);
    return newNode('AssignmentExpression', {
        operator: '=', right: node,
        left: newNode('MemberExpression', {
            object: newNode('Identifier', {name: '_'}),
            property: newNode('Literal', {value: pos}),
            computed: true
        }),
    });
}

findLocalVariables = function findLocalVariables(ast) {
    var locals = [];
    acorn.walk.matchNodes(ast, {
        'VariableDeclaration': function(node, state, depth, type) {
            if ((type == 'Statement') || (type == 'Expression')) return;
            node.declarations.each(function(n) { state.push(n.id.name); });
        },
        'FunctionDeclaration': function(node, state, depth, type) {
            if ((type == 'Statement') || (type == 'Expression') || (type == 'Function')) return;
            state.push(node.id.name);
        }
    }, locals, {
        visitors: acorn.walk.make({'Function': function() { /* stop descent */ }})
    });
    return locals;
}

var scopes = Global.scopes = [];
// lively.ast.Rewriting.table
Object.extend(lively.ast.Rewriting, {
    table: []
});

Object.extend(Global, {
    __createClosure: function(idx, scope, f) {
        f._cachedAst = lively.ast.Rewriting.table[idx];
        f._cachedScope = scope;
        return f;
    }
});

Global.rewrite = function rewrite(node) {
    // FIXME!
    lively.ast.Rewriting.RewriteVisitor.prototype.visitFunctionExpression = lively.ast.Rewriting.RewriteVisitor.prototype.visitFunctionDeclaration;
    enterScope();
    if (node.type == 'FunctionDeclaration') {
        var args = registerVars(node.params.pluck('name')); // arguments
    }
    var vars = registerVars(findLocalVariables(node)); // locals
    var rewritten = (new lively.ast.Rewriting.RewriteVisitor()).accept(node);
    exitScope();
    var wrapped = wrapSequence(rewritten, args, vars);
    return newNode('Program', {body: [wrapped]});
}

Global.rewriteFunction = function(node) {
    // for now this is a shorthand to just rewrite functions: A function
    // expression itself is not a valid parsable thing so we evaluate it as
    // "(function ()...)" which gives us a program with one statement which is the
    // function expression. Here we transform it into a FunctionStatement and
    // process it further
    if (node.type !== "Program"
     || node.body.length !== 1
     || node.body[0].type !== "ExpressionStatement"
     || node.body[0].expression.type !== "FunctionExpression")
        throw new Error('no a valid function expression/statement? ' + lively.ast.acorn.printAst(node));
    

    node = node.body[0].expression;
    var rewritten = acorn.walk.copy(node);
    rewritten.type = 'FunctionDeclaration';
    if (!rewritten.id) rewritten.id = newNode("Identifier", {name: ""});

    return rewrite(newNode('Program', {body: [node]}))
    // rewritten.body = rewrite(newNode('Program', {body: node.body}))
    // ...

    return rewritten;
}

})();

Object.subclass("lively.ast.Rewriting.BaseVisitor",
// This code was generated with:
// lively.ast.MozillaAST.createVisitorCode({openWindow: true, asLivelyClass: true, parameters: ["state"], useReturn: true, name: "Visitor"});
"visiting", {
    accept: function(node, state) {
        return node ? this['visit' + node.type](node, state) : null;
    },

    visitProgram: function(node, state) {
        node.body = node.body.map(function(ea) {
            // ea is of type Statement
            return this.accept(ea, state);
        }, this);
        return node;
    },

    visitStatement: function(node, state) {
        return node;
    },

    visitEmptyStatement: function(node, state) {
        return node;
    },

    visitBlockStatement: function(node, state) {
        node.body = node.body.map(function(ea) {
            // ea is of type Statement
            return this.accept(ea, state);
        }, this);
        return node;
    },

    visitIfStatement: function(node, state) {
        // test is a node of type Expression
        node.test = this.accept(node.test, state);

        // consequent is a node of type Statement
        node.consequent = this.accept(node.consequent, state);

        if (node.alternate) {
            // alternate is a node of type Statement
            node.alternate = this.accept(node.alternate, state);
        }
        return node;
    },

    visitLabeledStatement: function(node, state) {
        // label is a node of type Identifier
        node.label = this.accept(node.label, state);

        // body is a node of type Statement
        node.body = this.accept(node.body, state);
        return node;
    },

    visitBreakStatement: function(node, state) {
        if (node.label) {
            // label is a node of type Identifier
            node.label = this.accept(node.label, state);
        }
        return node;
    },

    visitContinueStatement: function(node, state) {
        if (node.label) {
            // label is a node of type Identifier
            node.label = this.accept(node.label, state);
        }
        return node;
    },

    visitWithStatement: function(node, state) {
        // object is a node of type Expression
        node.object = this.accept(node.object, state);

        // body is a node of type Statement
        node.body = this.accept(node.body, state);
        return node;
    },

    visitSwitchStatement: function(node, state) {
        // discriminant is a node of type Expression
        node.discriminant = this.accept(node.discriminant, state);

        node.cases = node.cases.map(function(ea) {
            // ea is of type SwitchCase
            return this.accept(ea, state);
        }, this);

        // node.lexical has a specific type that is boolean
        if (node.lexical) {/*do stuff*/}
        return node;
    },

    visitThrowStatement: function(node, state) {
        // argument is a node of type Expression
        node.argument = this.accept(node.argument, state);
        return node;
    },

    visitTryStatement: function(node, state) {
        // block is a node of type BlockStatement
        node.block = this.accept(node.block, state);

        if (node.handler) {
            // handler is a node of type CatchClause
            node.handler = this.accept(node.handler, state);
        }

        node.guardedHandlers = node.guardedHandlers.map(function(ea) {
            // ea is of type CatchClause
            return this.accept(ea, state);
        }, this);

        if (node.finalizer) {
            // finalizer is a node of type BlockStatement
            node.finalizer = this.accept(node.finalizer, state);
        }
        return node;
    },

    visitWhileStatement: function(node, state) {
        // test is a node of type Expression
        node.test = this.accept(node.test, state);

        // body is a node of type Statement
        node.body = this.accept(node.body, state);
        return node;
    },

    visitDoWhileStatement: function(node, state) {
        // body is a node of type Statement
        node.body = this.accept(node.body, state);

        // test is a node of type Expression
        node.test = this.accept(node.test, state);
        return node;
    },

    visitForOfStatement: function(node, state) {
        // left is a node of type VariableDeclaration
        node.left = this.accept(node.left, state);

        // right is a node of type Expression
        node.right = this.accept(node.right, state);

        // body is a node of type Statement
        node.body = this.accept(node.body, state);
        return node;
    },

    visitLetStatement: function(node, state) {
        node.head = node.head.map(function(ea) {
            // ea.id is of type node
            ea.id = this.accept(ea.id, state);
            if (ea.init) {
                // ea.init can be of type node
                ea.init = this.accept(ea.init, state);
            }
            return ea;
        }, this);

        // body is a node of type Statement
        node.body = this.accept(node.body, state);
        return node;
    },

    visitDeclaration: function(node, state) {
        return node;
    },

    visitVariableDeclarator: function(node, state) {
        // id is a node of type Pattern
        node.id = this.accept(node.id, state);

        if (node.init) {
            // init is a node of type Expression
            node.init = this.accept(node.init, state);
        }
        return node;
    },

    visitExpression: function(node, state) {
        return node;
    },

    visitThisExpression: function(node, state) {
        return node;
    },

    visitArrowExpression: function(node, state) {
        node.params = node.params.map(function(ea) {
            // ea is of type Pattern
            return this.accept(ea, state);
        }, this);

        if (node.defaults) {
            node.defaults = node.defaults.map(function(ea) {
                // ea is of type Expression
                return this.accept(ea, state);
            }, this);
        }

        if (node.rest) {
            // rest is a node of type Identifier
            node.rest = this.accept(node.rest, state);
        }

        // body is a node of type BlockStatement
        node.body = this.accept(node.body, state);

        // node.generator has a specific type that is boolean
        if (node.generator) {/*do stuff*/}

        // node.expression has a specific type that is boolean
        if (node.expression) {/*do stuff*/}
        return node;
    },

    visitSequenceExpression: function(node, state) {
        node.expressions = node.expressions.map(function(ea) {
            // ea is of type Expression
            return this.accept(ea, state);
        }, this);
        return node;
    },

    visitUnaryExpression: function(node, state) {
        // node.operator is an UnaryOperator enum:
        // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"

        // node.prefix has a specific type that is boolean
        if (node.prefix) {/*do stuff*/}

        // argument is a node of type Expression
        node.argument = this.accept(node.argument, state);
        return node;
    },

    visitBinaryExpression: function(node, state) {
        // node.operator is an BinaryOperator enum:
        // "==" | "!=" | "===" | "!==" | | "<" | "<=" | ">" | ">=" | | "<<" | ">>" | ">>>" | | "+" | "-" | "*" | "/" | "%" | | "|" | "^" | "&" | "in" | | "instanceof" | ".."

        // left is a node of type Expression
        node.left = this.accept(node.left, state);

        // right is a node of type Expression
        node.right = this.accept(node.right, state);
        return node;
    },

    visitYieldExpression: function(node, state) {
        if (node.argument) {
            // argument is a node of type Expression
            node.argument = this.accept(node.argument, state);
        }
        return node;
    },

    visitComprehensionExpression: function(node, state) {
        // body is a node of type Expression
        node.body = this.accept(node.body, state);

        node.blocks = node.blocks.map(function(ea) {
            // ea is of type ComprehensionBlock
            return this.accept(ea, state);
        }, this);

        if (node.filter) {
            // filter is a node of type Expression
            node.filter = this.accept(node.filter, state);
        }
        return node;
    },

    visitGeneratorExpression: function(node, state) {
        // body is a node of type Expression
        node.body = this.accept(node.body, state);

        node.blocks = node.blocks.map(function(ea) {
            // ea is of type ComprehensionBlock
            return this.accept(ea, state);
        }, this);

        if (node.filter) {
            // filter is a node of type Expression
            node.filter = this.accept(node.filter, state);
        }
        return node;
    },

    visitLetExpression: function(node, state) {
        node.head = node.head.map(function(ea) {
            // ea.id is of type node
            ea.id = this.accept(ea.id, state);
            if (ea.init) {
                // ea.init can be of type node
                ea.init = this.accept(ea.init, state);
            }
            return ea;
        }, this);

        // body is a node of type Expression
        node.body = this.accept(node.body, state);
        return node;
    },

    visitPattern: function(node, state) {
        return node;
    },

    visitObjectPattern: function(node, state) {
        node.properties = node.properties.map(function(ea) {
            // ea.key is of type node
            ea.key = this.accept(ea.key, state);
            // ea.value is of type node
            ea.value = this.accept(ea.value, state);
            return ea;
        }, this);
        return node;
    },

    visitArrayPattern: function(node, state) {
        node.elements = node.elements.map(function(ea) {
            return this.accept(ea, state);
        }, this);
        return node;
    },

    visitSwitchCase: function(node, state) {
        if (node.test) {
            // test is a node of type Expression
            node.test = this.accept(node.test, state);
        }

        node.consequent = node.consequent.map(function(ea) {
            // ea is of type Statement
            return this.accept(ea, state);
        }, this);
        return node;
    },

    visitComprehensionBlock: function(node, state) {
        // left is a node of type Pattern
        node.left = this.accept(node.left, state);

        // right is a node of type Expression
        node.right = this.accept(node.right, state);

        // node.each has a specific type that is boolean
        if (node.each) {/*do stuff*/}
        return node;
    },

    visitLiteral: function(node, state) {
        if (node.value) {
            // node.value has a specific type that is string or boolean or number or RegExp
        }
        return node;
    }
});

lively.ast.Rewriting.BaseVisitor.subclass("lively.ast.Rewriting.RewriteVisitor", {

    visitExpressionStatement: function(n, st) {
        // expression is a node of type Expression
        var expr = this.accept(n.expression, st);;
        if (expr.type == 'ExpressionStatement')
            expr = expr.expression; // unwrap
        return {
            start: n.start, end: n.end, type: 'ExpressionStatement',
            expression: expr
        };
    
    },

    visitReturnStatement: function(n, st) {
        // argument is a node of type Expression
        var arg = n.argument ?
            this.accept(n.argument, st) : null;
        if (arg && arg.type == 'ExpressionStatement')
            arg = arg.expression; // unwrap
        return {
            start: n.start, end: n.end, type: 'ReturnStatement',
            argument: arg
        };
    },

    visitForStatement: function(n, st) {
        // init is a node of type VariableDeclaration
        var init = n.init ? this.accept(n.init, st) : null;
        if (init && init.type == 'ExpressionStatement')
            init = init.expression;
        return {
            start: n.start, end: n.end, type: 'ForStatement',
            init: init,
            // test is a node of type Expression
            test: n.test ? this.accept(n.test, st) : null,
            // update is a node of type Expression
            update: n.update ? this.accept(n.update, st) : null,
            // body is a node of type Statement
            body: this.accept(n.body, st)
        };
    },

    visitForInStatement: function(n, st) {
        // left is a node of type VariableDeclaration
        // right is a node of type Expression
        // body is a node of type Statement
        // n.each has a specific type that is boolean
        var left = this.accept(
            n.left.type == 'VariableDeclaration' ?
            n.left.declarations[0].id : n.left, st);
        // TODO: push storeComputationResult for loop assignment into body
        return {
            start: n.start, end: n.end, type: 'ForInStatement',
            left: left, right: this.accept(n.right, st),
            body: this.accept(n.body, st),
            each: n.each
        };
    },

    visitDebuggerStatement: function(n, st) {
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
        // TODO: storeComputationResult(fn) is not possible for value
        return newNode('ThrowStatement', {
            argument: newNode('ObjectExpression', {
                properties: [{
                    key: newNode('Identifier', { name: 'toString' }),
                    kind: 'init', value: fn
                }]
            })
        });
    },

    visitFunctionDeclaration: function(n, st) {
        // id is a node of type Identifier
        // each of n.params is of type Pattern
        // each of n.defaults is of type Expression (optional)
        // rest is a node of type Identifier (optional)
        // body is a node of type BlockStatement
        // n.generator has a specific type that is boolean
        // n.expression has a specific type that is boolean
        enterScope();
        // TODO: old rewriting reference
        lively.ast.Rewriting.table.push(acorn.walk.copy(n));
        var idx = lively.ast.Rewriting.table.length - 1;
        // END FIXME
        var args = registerVars(n.params.pluck('name')); // arguments
        var vars = registerVars(findLocalVariables(n.body)); // locals
        var rewritten = this.accept(n.body, st);
        exitScope();
        var wrapped = wrapClosure({
            start: n.start, end: n.end, type: 'FunctionExpression',
            body: newNode('BlockStatement', {body: [wrapSequence(rewritten, args, vars)]}),
            id: n.id || null, params: args
        }, idx);
        if (n.id && n.type == 'FunctionDeclaration') {
            wrapped = newNode('AssignmentExpression', {
                left: this.accept(n.id, st),
                operator: '=',
                right: wrapped
            });
        }
        return newNode('ExpressionStatement', {
            expression: storeComputationResult(wrapped, n.start, n.end),
            id: n.id
        });
    
    },

    visitVariableDeclaration: function(n, st) {
        // each of n.declarations is of type VariableDeclarator
        // n.kind is "var" or "let" or "const"
        var decls = n.declarations.map(function(decl) {
            var value = this.accept(decl.init, st);
            value = newNode('AssignmentExpression', {
                left: this.accept(decl.id, st),
                operator: '=',
                right: (decl.init && decl.init.type == 'FunctionExpression') ?
                    value.expression : // unwrap
                    value
            });
            if (value.right == null) { // could be ignored
                value.right = newNode('Identifier', { name: 'undefined' });
            }
            return storeComputationResult(value, decl.start, decl.end);
        }, this);
    
        return decls.length == 1 ?
            newNode('ExpressionStatement', {expression: decls[0]}) :
            newNode('ExpressionStatement', {
                expression: newNode('SequenceExpression', {expressions: decls})
            });
    },

    visitArrayExpression: function(n, st) {
        // each of n.elements can be of type Expression
        return {
            start: n.start, end: n.end, type: 'ArrayExpression',
            elements: n.elements.map(function(element) {
                var elem = this.accept(element, st);
                if (elem.type == 'ExpressionStatement')
                    elem = elem.expression; // unwrap
                return elem;
            }, this)
        };
    },

    visitObjectExpression: function(n, st) {
        // each.key of n.properties is of type node
        // each.value of n.properties is of type node
        // each.kind of n.properties is "init" or "get" or "set"
        return {
            start: n.start, end: n.end, type: 'ObjectExpression',
            properties: n.properties.map(function(prop) {
                var value = this.accept(prop.value, st);
                if (prop.kind != 'init') { // set or get
                    // function cannot be replace by a closure directly
                    value = value.expression.right.arguments[2]; // unwrap
                }
                var key = prop.key.type == 'Identifier' ?
                    { // original identifier rule
                        start: prop.key.start, end: prop.key.end, type: 'Identifier',
                        name: prop.key.name
                    } : this.accept(prop.key, st);
                return {
                    key: key,
                    value: (value.type == 'ExpressionStatement') ?
                        value.expression : // unwrap
                        value,
                    kind: prop.kind
                };
            }, this)
        };
    },

    visitAssignmentExpression: function(n, st) {  // Set, ModifyingSet
        // n.operator is an AssignmentOperator enum:
        // "=" | "+=" | "-=" | "*=" | "/=" | "%=" | | "<<=" | ">>=" | ">>>=" | | "|=" | "^=" | "&="
        // left is a node of type Expression
        // right is a node of type Expression
        var right = this.accept(n.right, st);
        if (right.type == 'ExpressionStatement')
            right = right.expression; // unwrap
        return storeComputationResult({
            start: n.start, end: n.end, type: 'AssignmentExpression',
            operator: n.operator,
            left: this.accept(n.left, st),
            right: right
        });
    },

    visitUpdateExpression: function(n, st) {
        // n.operator is an UpdateOperator enum:
        // "++" | "--"
        // argument is a node of type Expression
        // n.prefix has a specific type that is boolean
        return storeComputationResult({
            start: n.start, end: n.end, type: 'UpdateExpression',
            argument: this.accept(n.argument, st),
            operator: n.operator, prefix: n.prefix
        });
    },

    visitLogicalExpression: function(n, st) {
        // n.operator is an LogicalOperator enum:
        // "||" | "&&"
        // left is a node of type Expression
        // right is a node of type Expression
        var left = this.accept(n.left, st);
        if (left.type == 'ExpressionStatement')
            left = left.expression; // unwrap
        var right = this.accept(n.right, st);
        if (right.type == 'ExpressionStatement')
            right = right.expression; // unwrap
        return {
            start: n.start, end: n.end, type: 'LogicalExpression',
            left: left, operator: n.operator, right: right
        };
    },

    visitConditionalExpression: function(n, st) {
        // test is a node of type Expression
        // alternate is a node of type Expression
        // consequent is a node of type Expression
        var consequent = this.accept(n.consequent, st);
        if (consequent.type == 'ExpressionStatement')
            consequent = consequent.expression; // unwrap;
        var alternate = this.accept(n.alternate, st);
        if (alternate.type == 'ExpressionStatement')
            alternate = alternate.expression; // unwrap;
        return {
            start: n.start, end: n.end, type: 'ConditionalExpression',
            test: this.accept(n.test, st), consequent: consequent,
            alternate: alternate
        };
    },

    visitNewExpression: function(n, st) {
        // callee is a node of type Expression
        // each of n.arguments is of type Expression
        return storeComputationResult({
            start: n.start, end: n.end, type: 'NewExpression',
            callee: this.accept(n.callee, st),
            arguments: n.arguments.map(function(n) {
                var n = this.accept(n, st);
                return (n.type == 'ExpressionStatement') ?
                    n.expression : // unwrap
                    n;
            }, this)
        });
    },

    visitCallExpression: function(n, st) {
        // callee is a node of type Expression
        // each of n.arguments is of type Expression
        var thisIsBound = n.callee.type == 'MemberExpression'; // like foo.bar();
        var callee = this.accept(n.callee, st);
        if (callee.type == 'ExpressionStatement') callee = callee.expression; // unwrap
        var args = n.arguments.map(function(n) {
            var n = this.accept(n, st);
            return n.type == 'ExpressionStatement' ? n.expression : /*unwrap*/ n;
        }, this);
        if (!thisIsBound) {
            // something like "foo();". we can't just rewrite it as _123['foo']()
            // as this would bind this to the scope object. Instead we ensure
            // that .call is used for invocation
            callee = {
                type: 'MemberExpression',
                computed: false,
                property: {name: "call", type: "Identifier"},
                object: callee
            }
            args.unshift({type: 'Identifier', name: 'Global'});
        }
        return storeComputationResult({
            start: n.start, end: n.end,
            type: 'CallExpression', callee: callee,
            arguments: args
        });
    },

    visitMemberExpression: function(n, st) {
        // object is a node of type Expression
        // property is a node of type Identifier
        // n.computed has a specific type that is boolean
        var object = this.accept(n.object, st),
            property = n.computed ?
                this.accept(n.property, st) :
                { // original identifier rule
                    start: n.property.start, end: n.property.end, type: 'Identifier',
                    name: n.property.name
                };
        if (object.type == 'ExpressionStatement')
            object = object.expression;
        return {
            start: n.start, end: n.end, type: 'MemberExpression',
            object: object, property: property, computed: n.computed
        };
    },

    visitCatchClause: function(n, st) {
        // param is a node of type Pattern
        // guard is a node of type Expression (optional)
        // body is a node of type BlockStatement
        var param = this.accept(n.param, st),
            body = this.accept(n.body, st),
            guard = n.guard ?  this.accept(n.guard, st) : guard;
        body.body.unshift(newNode('ExpressionStatement', {
            expression: storeComputationResult(param, n.param.start, n.param.end)
        }));
        return {
            start: n.start, end: n.end, type: 'CatchClause',
            param: param, guard: guard, body: body
        };
    },

    visitIdentifier: function(n, st) {
        // n.name has a specific type that is string
        return wrapVar(n.name);
    }

});

(function RewriteVisitorFIXME() {
    lively.ast.Rewriting.RewriteVisitor.prototype.visitFunctionExpression = lively.ast.Rewriting.RewriteVisitor.prototype.visitFunctionDeclaration;
})();

}) // end of module
