module('lively.ast.Rewriting').requires('lively.ast.acorn', 'lively.ast.StackReification').toRun(function() {

Object.extend(lively.ast.Rewriting, {

    _currentASTRegistry: (function() {
        return typeof LivelyDebuggingASTRegistry !== 'undefined'?
            LivelyDebuggingASTRegistry : [];
    })(),

    getCurrentASTRegistry: function() {
        if (this._currentASTRegistry) return this._currentASTRegistry;
        return [];
    },

    setCurrentASTRegistry: function(astRegistry) {
        return this._currentASTRegistry = astRegistry;
    },

    rewrite: function(node, astRegistry) {
        var r = new lively.ast.Rewriting.Rewriter(astRegistry);
        return r.rewrite(node);
    },

    rewriteFunction: function(node, astRegistry) {
        var r = new lively.ast.Rewriting.Rewriter(astRegistry);
        return r.rewriteFunction(node);
    },

    rewriteLivelyCode: function() {
        var modules = lively.Module.bootstrapModules(),
            pBar = $world.addProgressBar(),
            astReg = lively.ast.Rewriting.setCurrentASTRegistry([]);

        // Ignore the libs for now
        modules = modules.reject(function(ea) { return /lib\//.test(ea); });

        // 1. Rewrite Lively code and put it into DBG_* files
        modules.forEachShowingProgress(pBar, function(modulePath, i) {
            // FIXME: manually wrap code in function so that async load will not temper with _0, etc.
            putRewritten(modulePath, '(function() {' + escodegen.generate(rewrite(get(modulePath))) + '})();');
        }, Functions.K, function() {
            pBar.remove();
            // 2. Create bootstrap code needed to run rewritten code
            put("core/lively/ast/BootstrapDebugger.js", [
                lively.ast.Rewriting.createClosureBaseDef,
                lively.ast.Rewriting.UnwindExceptionBaseDef,
                // FIXME: should use JSON.stringify(astReg) but its hundreds of MBs
                // Idea: virtual registry with references to file, version, segment (character range)
                //       makes individual ast indexes necessary (or addition ast index offset for
                //         reparsing and indexing)
                "window.LivelyDebuggingASTRegistry=[];"
            ].join('\n'));
        });


        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // helper
        function get(path) {
            return URL.root.withFilename(path).asWebResource().get().content;
        };
        
        function putRewritten(path, rewrittenSource) {
            var idx = path.lastIndexOf('/') + 1,
                debugPath = path.slice(0,idx) + 'DBG_' + path.slice(idx);
            put(debugPath, rewrittenSource);
        };

        function put(path, source) {
            URL.root.withFilename(path).asWebResource().put(source);
        };

        function rewrite(source) {
            var ast = lively.ast.acorn.parse(source);
            return lively.ast.Rewriting.rewrite(ast, astReg);
        };
    }

});

Object.subclass("lively.ast.Rewriting.Rewriter",
"initializing", {

    initialize: function(astRegistry)  {
        // scopes is used for keeping track of local vars and computationProgress state
        // while rewriting. Whenever a local var or an intermediate computation result
        // is encoutered we store it in the scope. Then, when we create the actual
        // "scope wrapper" where the stack reification state gets initialized we use
        // this information to create the necessary declarations
        this.scopes = [];
        // module('lively.ast.StackReification').load();
        // module('lively.AST.AstHelper').load()
        
        // Right now astRegistry is where the original ASTs for each
        // scope/function are stored
        // FIXME we need a more consistent storage/interface that might be integrated
        // with the source control?
        this.astRegistry = astRegistry || [];

        this.astIndex = 0;
    }

},
'ast helpers', {

    newNode: function(type, node) {
        node.type = type;
        node.start = 0;
        node.end = 0;
        return node;
    },

    newVariable: function(name, value) {
        if (value == '{}') {
            value = this.newNode('ObjectExpression', { properties: [] });
        } else if (Object.isArray(value)) {
            value = this.newNode('ArrayExpression', {
                elements: value.map(function(val) {
                    if (Object.isNumber(val)) {
                        return this.newNode('Literal', { value: val });
                    } else if (Object.isString(val)) {
                        return this.newNode('Identifier', { name: val });
                    } else {
                        throw new Error('Cannot interpret value in array.');
                    }
                }, this)
            }, this);
        } else if (Object.isObject(value) && (value.type != null)) {
            // expected to be valid Parser API object
        } else
            throw new Error('Cannot interpret value for newVariable: ' + value + '!');

        return this.newNode('VariableDeclarator', {
            id: this.newNode('Identifier', { name: name }),
            init: value
        });
    },

    newMemberExp: function(str) {
        var parts = str.split('.');
        parts = parts.map(function(part) {
            return this.newNode('Identifier', { name: part });
        }, this);
        var newNode = this.newNode.bind(this);
        return parts.reduce(function(object, property) {
            return newNode('MemberExpression', {
                object: object,
                property: property
            });
        });
    },

    wrapArgsAndDecls: function(args, decls) {
        if ((!args || !args.length) && (!decls || !decls.length)) return '{}';
        var wArgs = args ? args.map(function(ea) {
                return {
                    key: this.newNode('Literal', {value: ea.name}),
                    kind: 'init', value: ea
                }
            }, this) : [],
            wDecls = decls || [];
        return this.newNode('ObjectExpression', {properties: wArgs.concat(wDecls)});
    }

},
'scoping', {

    enterScope: function() {
        this.scopes.push({localVars: [], computationProgress: []});
    },

    exitScope: function() {
        this.scopes.pop();
    },

    registerVars: function(vars) {
        if (!this.scopes.length) return;
        var scope = this.scopes.last(),
            that = this;
        return vars.reduce(function(res, varName) {
            if (scope.localVars.indexOf(varName) == -1) {
                scope.localVars.push(varName);
            }
            res.push(that.newNode('Identifier', { name: varName }));
            return res;
        }, []);
    },

    registerDeclarations: function(ast, visitor) {
        if (!this.scopes.length) return;
        var scope = this.scopes.last(),
            that = this,
            decls = {};
        acorn.walk.matchNodes(ast, {
            'VariableDeclaration': function(node, state, depth, type) {
                if (node.type != type) return; // skip Expression, Statement, etc.
                node.declarations.each(function(n) {
                    // only if it has not been defined before (as variable or argument!)
                    if (scope.localVars.indexOf(n.id.name) == -1) {
                        state[n.id.name] = {
                            key: that.newNode('Literal', {value: n.id.name}),
                            kind: 'init',
                            value: that.newNode('Identifier', {name: 'undefined'})
                        };
                        scope.localVars.push(n.id.name);
                    }
                });
            },
            'FunctionDeclaration': function(node, state, depth, type) {
                if (node.type != type) return; // skip Expression, Statement, etc.
                state[node.id.name] = node; // rewrite is done below (to know all local vars first)
                if (scope.localVars.indexOf(node.id.name) == -1)
                    scope.localVars.push(node.id.name);
            }
        }, decls, {
            visitors: acorn.walk.make({'Function': function() { /* stop descent */ }})
        });

        return Object.getOwnPropertyNames(decls).map(function(decl) {
            var node = decls[decl];
            if (node.type == 'FunctionDeclaration') {
                node = {
                    key: that.newNode('Literal', {value: node.id.name}),
                    kind: 'init',
                    value: that.rewriteFunctionDeclaration(node)
                }
            }
            return node;
        });
    }

},
'rewriting', {

    createPreamble: function(args, decls, level) {
        return this.newNode('VariableDeclaration', {
            kind: 'var',
            declarations: [
                this.newVariable('_', '{}'),
                this.newVariable('lastNode', this.newNode('Identifier', {name: 'undefined'})),
                this.newVariable('_' + level, this.wrapArgsAndDecls(args, decls)),
                this.newVariable('__' + level,
                    ['_', '_' + level, (level - 1) < 0 ? 'Global' : '__' + (level - 1)])
            ]
        })
    },

    createCatchForUnwind: function(node, originalFunctionIdx, level) {
        return this.newNode('TryStatement', {
            block: this.newNode('BlockStatement', {body: node.body}),
            handler: this.newNode('CatchClause', {guard: null,
                param: this.newNode('Identifier', {name: 'e'}),
                body: this.newNode('BlockStatement', {body: [
                    this.newNode('VariableDeclaration', {
                        kind: 'var',
                        declarations: [
                            this.newVariable('ex', this.newNode('ConditionalExpression', {
                                test: this.newMemberExp('e.isUnwindException'),
                                consequent: this.newNode('Identifier', {name: 'e'}),
                                alternate: this.newNode('NewExpression', {
                                    arguments: [this.newNode('Identifier', {name: 'e'})],
                                    callee: this.newMemberExp('UnwindException')
                                })
                            }))]
                        }),
                    this.newNode('ExpressionStatement', {
                        expression: this.newNode('CallExpression', {
                            callee: this.newMemberExp('ex.createAndShiftFrame'),
                            arguments: [
                                this.newNode('Identifier', {name: 'this'}),
                                this.newNode('Identifier', {name: '__' + level}),
                                this.newNode('Identifier', {name: "lastNode"}),
                                this.newNode('Identifier', {name: String(originalFunctionIdx)})]
                        })
                    }),
                    this.newNode('ThrowStatement', {argument: this.newNode('Identifier', {name: 'ex'})})
                ]}),
            }),
            guardedHandlers: [], finalizer: null
        });
    },

    wrapSequence: function(node, args, decls, originalFunctionIdx) {
        var level = this.scopes.length;
        node.body.unshift(this.createPreamble(args, decls, level));
        return this.createCatchForUnwind(node, originalFunctionIdx, level);
    },

    wrapVar: function(name) {
        var scopeIdx;
        for (var i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].localVars.include(name)) { scopeIdx = i; break; }
        }
        // mr 2014-02-05: if true, the reference is a global one - should throw error?
        if (scopeIdx === undefined) return this.newNode('Identifier', { name: name });
        return this.newNode('MemberExpression', {
            object: this.newNode('Identifier', { name: '_' + scopeIdx }),
            property: this.newNode('Literal', { value: name }),
            computed: true
        });
    },

    isWrappedVar: function(node) {
        return node.type == 'MemberExpression' && node.object.type == 'Identifier' &&
               node.object.name[0] == '_' && !isNaN(node.object.name.substr(1));
    },

    wrapClosure: function(node, idx) {
        return this.newNode('CallExpression', {
            callee: this.newNode('Identifier', {name: '__createClosure'}),
            arguments: [this.newNode('Literal', {value: idx}), node]
        });
    },

    storeComputationResult: function(node, start, end, astIndex) {
        if (this.scopes.length == 0) return node;
        var pos = (node.start || start || 0) + '-' + (node.end || end || 0);
        this.scopes.last().computationProgress.push(pos);
        return this.newNode('AssignmentExpression', {
            operator: '=',
            left: this.newNode('MemberExpression', {
                object: this.newNode('Identifier', {name: '_'}),
                property: this.lastNodeExpression(astIndex),
                computed: true
            }),
            right: node
        });
    },

    lastNodeExpression: function(astIndex) {
        return this.newNode('AssignmentExpression', {
            operator: '=',
            left: this.newNode('Identifier', {name: 'lastNode'}),
            right: this.newNode('Literal', {value: astIndex})
        });
    },

    rewrite: function(node) {
        this.enterScope();
        var astToRewrite = acorn.walk.copy(node);
        this.astRegistry.push(astToRewrite);
        var astRegistryIndex = this.astRegistry.length - 1;
        acorn.walk.addAstIndex(astToRewrite);
        if (astToRewrite.type == 'FunctionDeclaration') {
            var args = this.registerVars(astToRewrite.params.pluck('name')); // arguments
        }
        var rewriteVisitor = new lively.ast.Rewriting.RewriteVisitor();
        var decls = this.registerDeclarations(astToRewrite, rewriteVisitor); // locals
        var rewritten = rewriteVisitor.accept(astToRewrite, this);
        this.exitScope();
        var wrapped = this.wrapSequence(rewritten, args, decls, astRegistryIndex);
        this.astRegistry[astRegistryIndex].rewritten = wrapped; // FIXME just for debugging
        return this.newNode('Program', {body: [wrapped]});
    },

    rewriteFunction: function(node) {
        if (node.type !== "FunctionExpression")
            throw new Error('no a valid function expression/statement? ' + lively.ast.acorn.printAst(node));
        if (!node.id) node.id = this.newNode("Identifier", {name: ""});

        // this.enterScope();
        var astToRewrite = acorn.walk.copy(node);
        this.astRegistry.push(astToRewrite);
        var astRegistryIndex = this.astRegistry.length - 1;
        acorn.walk.addAstIndex(astToRewrite);
        if (astToRewrite.type == 'FunctionDeclaration') {
            var args = this.registerVars(astToRewrite.params.pluck('name')); // arguments
        }
        var decls = this.registerDeclarations(astToRewrite); // locals
        var rewriteVisitor = new lively.ast.Rewriting.RewriteVisitor();
        var rewritten = rewriteVisitor.accept(astToRewrite, this);
        // this.exitScope();
        // FIXME!
        rewritten = rewritten.expression.arguments[1];
        this.astRegistry[astRegistryIndex].rewritten = rewritten; // FIXME just for debugging
        return rewritten;
    },

    rewriteFunctionDeclaration: function(node) {
        this.enterScope();
        var astToRewrite = acorn.walk.copy(node);
        this.astRegistry.push(astToRewrite);
        var astRegistryIndex = this.astRegistry.length - 1;
        var start = node.start, end = node.end, astIndex = node.astIndex;
        // FIXME: sub-ast should have there own node indices
        // acorn.walk.addAstIndex(astToRewrite);
        var args = this.registerVars(node.params.pluck('name')); // arguments
        var decls = this.registerDeclarations(node.body); // locals
        var rewriteVisitor = new lively.ast.Rewriting.RewriteVisitor();
        var rewritten = rewriteVisitor.accept(node.body, this);
        this.exitScope();
        var wrapped = this.wrapClosure({
            start: node.start, end: node.end, type: 'FunctionExpression',
            body: this.newNode('BlockStatement', {
                body: [this.wrapSequence(rewritten, args, decls, astRegistryIndex)]}),
            id: node.id || null, params: args
        }, astRegistryIndex);
        this.astRegistry[astRegistryIndex].rewritten = wrapped;
        return wrapped;
    }

});

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

    visitExpressionStatement: function(n, rewriter) {
        // expression is a node of type Expression
        var expr = this.accept(n.expression, rewriter);
        if (expr.type == 'ExpressionStatement')
            expr = expr.expression; // unwrap
        return {
            start: n.start, end: n.end, type: 'ExpressionStatement',
            expression: expr
        };
    },

    visitReturnStatement: function(n, rewriter) {
        // argument is a node of type Expression
        var arg = n.argument ?
            this.accept(n.argument, rewriter) : null;
        if (arg && arg.type == 'ExpressionStatement')
            arg = arg.expression; // unwrap
        return {
            start: n.start, end: n.end, type: 'ReturnStatement',
            argument: arg
        };
    },

    visitForStatement: function(n, rewriter) {
        // init is a node of type VariableDeclaration or Expression or null
        var init = n.init ? this.accept(n.init, rewriter) : null;
        if (init && init.type == 'ExpressionStatement')
            init = init.expression;
        return {
            start: n.start, end: n.end, type: 'ForStatement',
            init: init,
            // test is a node of type Expression
            test: n.test ? this.accept(n.test, rewriter) : null,
            // update is a node of type Expression
            update: n.update ? this.accept(n.update, rewriter) : null,
            // body is a node of type Statement
            body: this.accept(n.body, rewriter)
        };
    },

    visitForInStatement: function(n, rewriter) {
        // left is a node of type VariableDeclaration
        // right is a node of type Expression
        // body is a node of type Statement
        // n.each has a specific type that is boolean
        var left = this.accept(n.left.type == 'VariableDeclaration' ?
                n.left.declarations[0].id :
                n.left, rewriter),
            right = this.accept(n.right, rewriter),
            body = this.accept(n.body, rewriter),
            start = n.start, end = n.end, astIndex = n.right.astIndex;
        if (body.type !== 'BlockStatement') {
            body = rewriter.newNode('BlockStatement', {body: [body]})
        }
        // add expression like _[lastNode = x] = _[x] || Object.keys(b); to the top of the loop body
        body.body.unshift({
            type: 'ExpressionStatement',
            expression: rewriter.storeComputationResult({
                type: 'LogicalExpression',
                operator: '||',
                left: {
                    type: 'MemberExpression',
                    object: { type: 'Identifier', name: '_' },
                    property: { type: 'Literal', value: astIndex },
                    computed: true
                },
                right: {
                    type: 'CallExpression',
                    callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'Object' },
                        property: { type: 'Identifier', name: 'keys' },
                        computed: false
                    },
                    arguments: [ right ]
                }
            }, start, end, astIndex)
        });
        // add expression like _[x].shift(); to the bottom of the loop body
        body.body.push({
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    object: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: '_' },
                        property: { type: 'Literal', value: astIndex },
                        computed: true
                    },
                    property: { type: 'Identifier', name: 'shift' },
                    computed: false
                },
                arguments: [ ]
            }
        });
        return {
            start: n.start, end: n.end, type: 'ForInStatement',
            left: left, right: right, body: body,
            each: n.each
        };
    },

    visitDebuggerStatement: function(n, rewriter) {
        // do something to trigger the debugger
        var start = n.start, end = n.end, astIndex = n.astIndex;
        var fn = rewriter.newNode('FunctionExpression', {
            body: rewriter.newNode('BlockStatement', {
                body: [rewriter.newNode('ReturnStatement', {
                    argument: rewriter.newNode('Literal', { value: 'Debugger' })
                })]
            }), id: null, params: []
        });

        // TODO: storeComputationResult(fn) is not possible for value
        return rewriter.newNode('ThrowStatement', {
            argument: rewriter.newNode('ObjectExpression', {
                properties: [{
                    key: rewriter.newNode('Identifier', { name: 'toString' }),
                    kind: 'init', value: fn
                }, {
                    key: rewriter.newNode('Identifier', { name: 'astIndex' }),
                    kind: 'init', value: rewriter.newNode('Literal', {value: astIndex})
                }]
            })
        });
    },

    visitFunctionDeclaration: function(n, rewriter) {
        // FunctionDeclarations are handled in registerDeclarations
        // only advance the pc
        return {
            type: 'ExpressionStatement',
            expression: rewriter.lastNodeExpression(n.astIndex)
        };
    },

    visitFunctionExpression: function(n, rewriter) {
        // id is a node of type Identifier
        // each of n.params is of type Pattern
        // each of n.defaults is of type Expression (optional)
        // rest is a node of type Identifier (optional)
        // body is a node of type BlockStatement
        // n.generator has a specific type that is boolean
        // n.expression has a specific type that is boolean
        rewriter.enterScope();
        var astToRewrite = acorn.walk.copy(n);
        rewriter.astRegistry.push(astToRewrite);
        var astRegistryIndex = rewriter.astRegistry.length - 1;
        var start = n.start, end = n.end, astIndex = n.astIndex;
        var args = rewriter.registerVars(n.params.pluck('name')); // arguments
        var decls = rewriter.registerDeclarations(n.body); // locals
        var rewritten = this.accept(n.body, rewriter);
        rewriter.exitScope();
        var wrapped = rewriter.wrapClosure({
            start: n.start, end: n.end, type: 'FunctionExpression',
            body: rewriter.newNode('BlockStatement', {
                body: [rewriter.wrapSequence(rewritten, args, decls, astRegistryIndex)]}),
            id: n.id || null, params: args
        }, astRegistryIndex);
        return rewriter.astRegistry[astRegistryIndex].rewritten = rewriter.newNode('ExpressionStatement', {
            expression: rewriter.storeComputationResult(wrapped, start, end, astIndex),
            id: n.id
        });
    },

    visitVariableDeclaration: function(n, rewriter) {
        // each of n.declarations is of type VariableDeclarator
        // n.kind is "var" or "let" or "const"
        var start = n.start, end = n.end, astIndex = n.astIndex;
        var decls = n.declarations.map(function(decl) {
            if (decl.init == null) { // no initialization, e.g. var x;
                // only advance the pc
                return rewriter.lastNodeExpression(n.astIndex);
            }

            var value = this.accept(decl.init, rewriter);
            value = rewriter.newNode('AssignmentExpression', {
                left: this.accept(decl.id, rewriter),
                operator: '=',
                right: (decl.init && decl.init.type == 'FunctionExpression') ?
                    value.expression : // unwrap
                    value
            });
            return rewriter.storeComputationResult(value, start, end, astIndex);
        }, this);

        return decls.length == 1 ?
            rewriter.newNode('ExpressionStatement', {expression: decls[0]}) :
            rewriter.newNode('ExpressionStatement', {
                expression: rewriter.newNode('SequenceExpression', {expressions: decls})
            });
    },

    visitArrayExpression: function(n, rewriter) {
        // each of n.elements can be of type Expression
        return {
            start: n.start, end: n.end, type: 'ArrayExpression',
            elements: n.elements.map(function(element) {
                var elem = this.accept(element, rewriter);
                if (elem.type == 'ExpressionStatement')
                    elem = elem.expression; // unwrap
                return elem;
            }, this)
        };
    },

    visitObjectExpression: function(n, rewriter) {
        // each.key of n.properties is of type node
        // each.value of n.properties is of type node
        // each.kind of n.properties is "init" or "get" or "set"
        return {
            start: n.start, end: n.end, type: 'ObjectExpression',
            properties: n.properties.map(function(prop) {
                var value = this.accept(prop.value, rewriter);
                if (prop.kind != 'init') { // set or get
                    // function cannot be replace by a closure directly
                    value = value.expression.right.arguments[1]; // unwrap
                }
                var key = prop.key.type == 'Identifier' ?
                    { // original identifier rule
                        start: prop.key.start, end: prop.key.end, type: 'Identifier',
                        name: prop.key.name
                    } : this.accept(prop.key, rewriter);
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

    visitAssignmentExpression: function(n, rewriter) {  // Set, ModifyingSet
        // n.operator is an AssignmentOperator enum:
        // "=" | "+=" | "-=" | "*=" | "/=" | "%=" | | "<<=" | ">>=" | ">>>=" | | "|=" | "^=" | "&="
        // left is a node of type Expression
        // right is a node of type Expression
        var start = n.start, end = n.end, astIndex = n.astIndex;
        var right = this.accept(n.right, rewriter);
        if (right.type == 'ExpressionStatement')
            right = right.expression; // unwrap
        return rewriter.storeComputationResult({
            type: 'AssignmentExpression',
            operator: n.operator,
            left: this.accept(n.left, rewriter),
            right: right
        }, start, end, astIndex);
    },

    visitUpdateExpression: function(n, rewriter) {
        // n.operator is an UpdateOperator enum:
        // "++" | "--"
        // argument is a node of type Expression
        // n.prefix has a specific type that is boolean
        var start = n.start, end = n.end, astIndex = n.astIndex;
        return rewriter.storeComputationResult({
            type: 'UpdateExpression',
            argument: this.accept(n.argument, rewriter),
            operator: n.operator, prefix: n.prefix
        }, start, end, astIndex);
    },

    visitLogicalExpression: function(n, rewriter) {
        // n.operator is an LogicalOperator enum:
        // "||" | "&&"
        // left is a node of type Expression
        // right is a node of type Expression
        var left = this.accept(n.left, rewriter);
        if (left.type == 'ExpressionStatement')
            left = left.expression; // unwrap
        var right = this.accept(n.right, rewriter);
        if (right.type == 'ExpressionStatement')
            right = right.expression; // unwrap
        return {
            start: n.start, end: n.end, type: 'LogicalExpression',
            left: left, operator: n.operator, right: right
        };
    },

    visitConditionalExpression: function(n, rewriter) {
        // test is a node of type Expression
        // alternate is a node of type Expression
        // consequent is a node of type Expression
        var consequent = this.accept(n.consequent, rewriter);
        if (consequent.type == 'ExpressionStatement')
            consequent = consequent.expression; // unwrap;
        var alternate = this.accept(n.alternate, rewriter);
        if (alternate.type == 'ExpressionStatement')
            alternate = alternate.expression; // unwrap;
        return {
            start: n.start, end: n.end, type: 'ConditionalExpression',
            test: this.accept(n.test, rewriter), consequent: consequent,
            alternate: alternate
        };
    },

    visitNewExpression: function(n, rewriter) {
        // callee is a node of type Expression
        // each of n.arguments is of type Expression
        var start = n.start, end = n.end, astIndex = n.astIndex;
        return rewriter.storeComputationResult({
            type: 'NewExpression',
            callee: this.accept(n.callee, rewriter),
            arguments: n.arguments.map(function(n) {
                var n = this.accept(n, rewriter);
                return (n.type == 'ExpressionStatement') ?
                    n.expression : // unwrap
                    n;
            }, this)
        }, start, end, astIndex);
    },

    visitCallExpression: function(n, rewriter) {
        // callee is a node of type Expression
        // each of n.arguments is of type Expression
        var start = n.start, end = n.end, astIndex = n.astIndex;
        var thisIsBound = n.callee.type == 'MemberExpression'; // like foo.bar();
        var callee = this.accept(n.callee, rewriter);
        if (callee.type == 'ExpressionStatement') callee = callee.expression; // unwrap
        var args = n.arguments.map(function(n) {
            var n = this.accept(n, rewriter);
            return n.type == 'ExpressionStatement' ? n.expression : /*unwrap*/ n;
        }, this);
        if (!thisIsBound && rewriter.isWrappedVar(callee)) {
            // something like "foo();" when foo is in rewrite scope.
            // we can't just rewrite it as _123['foo']()
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
        return rewriter.storeComputationResult({
            type: 'CallExpression', callee: callee,
            arguments: args
        }, start, end, astIndex);
    },

    visitMemberExpression: function(n, rewriter) {
        // object is a node of type Expression
        // property is a node of type Identifier
        // n.computed has a specific type that is boolean
        var object = this.accept(n.object, rewriter),
            property = n.computed ?
                this.accept(n.property, rewriter) :
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

    visitCatchClause: function(n, rewriter) {
        // param is a node of type Pattern
        // guard is a node of type Expression (optional)
        // body is a node of type BlockStatement
        var start = n.param.start, end = n.param.end, astIndex = n.astIndex,
            param = this.accept(n.param, rewriter),
            body = this.accept(n.body, rewriter),
            guard = n.guard ?  this.accept(n.guard, rewriter) : guard;
        body.body.unshift(rewriter.newNode('ExpressionStatement', {
            expression: rewriter.storeComputationResult(param, start, end, astIndex)
        }));
        return {
            start: n.start, end: n.end, type: 'CatchClause',
            param: param, guard: guard, body: body
        };
    },

    visitIdentifier: function(n, rewriter) {
        // n.name has a specific type that is string
        return rewriter.wrapVar(n.name);
    }

});

}) // end of module
