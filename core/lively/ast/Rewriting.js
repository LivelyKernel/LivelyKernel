module('lively.ast.Rewriting').requires('lively.ast.Parser').toRun(function() {

lively.ast.Node.addMethods('interpretation', {
    position: function() {
        return this.pos[0] + "-" + this.pos[1];
    },
});

Object.extend(lively.ast, {
    oldEval: eval
});

Object.extend(lively.ast.Rewriting, {
    table: []
});

lively.ast.Visitor.subclass('lively.ast.Rewriting.Transformation',
'helping', {
    visitNodes: function(nodes) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            var res = this.visit(nodes[i]);
            if (res) result.push(res);
        }
        return result;
    }
},
'visiting', {
    visitSequence: function(node) {
        return new lively.ast.Sequence(node.pos, this.visitNodes(node.children));
    },
    visitNumber: function(node) {
        return new lively.ast.Number(node.pos, node.value);
    },
    visitString: function(node) {
        return new lively.ast.String(node.pos, node.value);
    },
    visitCond: function(node) {
        return new lively.ast.Cond(node.pos,
                                   this.visit(node.condExpr),
                                   this.visit(node.trueExpr),
                                   this.visit(node.falseExpr));
    },
    visitIf: function(node) {
        return new lively.ast.If(node.pos,
                                 this.visit(node.condExpr),
                                 this.visit(node.trueExpr),
                                 this.visit(node.falseExpr));
    },
    visitWhile: function(node) {
        return new lively.ast.While(node.pos,
                                    this.visit(node.condExpr),
                                    this.visit(node.body));
    },
    visitDoWhile: function(node) {
        return new lively.ast.DoWhile(node.pos,
                                      this.visit(node.body),
                                      this.visit(node.condExpr));
    },
    visitFor: function(node) {
        return new lively.ast.For(node.pos,
                                  this.visit(node.init),
                                  this.visit(node.condExpr),
                                  this.visit(node.body),
                                  this.visit(node.upd));
    },
    visitForIn: function(node) {
        return new lively.ast.ForIn(node.pos,
                                    this.visit(node.name),
                                    this.visit(node.obj),
                                    this.visit(node.body));
    },
    visitSet: function(node) {
        return new lively.ast.Set(node.pos,
                                  this.visit(node.left),
                                  this.visit(node.right));
    },
    visitModifyingSet: function(node) {
        return new lively.ast.ModifyingSet(node.pos,
                                           this.visit(node.left),
                                           node.name,
                                           this.visit(node.right));
    },
    visitBinaryOp: function(node) {
        return new lively.ast.BinaryOp(node.pos,
                                       node.name,
                                       this.visit(node.left),
                                       this.visit(node.right));
    },
    visitUnaryOp: function(node) {
        return new lively.ast.UnaryOp(node.pos,
                                      node.name,
                                      this.visit(node.expr));
    },
    visitPreOp: function(node) {
        return new lively.ast.PreOp(node.pos,
                                    node.name,
                                    this.visit(node.expr));
    },
    visitPostOp: function(node) {
        return new lively.ast.PostOp(node.pos,
                                     node.name,
                                     this.visit(node.expr));
    },
    visitThis: function(node) {
        return new lively.ast.This(node.pos);
    },
    visitVariable: function(node) {
        return new lively.ast.Variable(node.pos, node.name);
    },
    visitGetSlot: function(node) {
        return new lively.ast.GetSlot(node.pos,
                                      this.visit(node.slotName),
                                      this.visit(node.obj));
    },
    visitBreak: function(node) {
        return new lively.ast.Break(node.pos);
    },
    visitDebugger: function(node) {
        return new lively.ast.Debugger(node.pos);
    },
    visitContinue: function(node) {
        return new lively.ast.Continue(node.pos);
    },
    visitArrayLiteral: function(node) {
        return new lively.ast.ArrayLiteral(node.pos, this.visitNodes(node.elements));
    },
    visitReturn: function(node) {
        return new lively.ast.Return(node.pos,this.visit(node.expr));
    },
    visitWith: function(node) {
        throw new Error('with statement not supported');
    },
    visitSend: function(node) {
        return new lively.ast.Send(node.pos,
                                   this.visit(node.property),
                                   this.visit(node.recv),
                                   this.visitNodes(node.args));
    },
    visitCall: function(node) {
        return new lively.ast.Call(node.pos,
                                   this.visit(node.fn),
                                   this.visitNodes(node.args));
    },
    visitNew: function(node) {
        return new lively.ast.New(node.pos, this.visit(node.clsExpr));
    },
    visitVarDeclaration: function(node) {
        return new lively.ast.VarDeclaration(node.pos, node.name, this.visit(node.val));
    },
    visitThrow: function(node) {
        return new lively.ast.Throw(node.pos, this.visit(node.expr));
    },
    visitTryCatchFinally: function(node) {
        return new lively.ast.TryCatchFinally(node.pos,
                                              this.visit(node.trySeq),
                                              node.err,
                                              this.visit(node.catchSeq),
                                              this.visit(node.finallySeq));
    },
    visitFunction: function(node) {
        return new lively.ast.Function(node.pos,
                                       this.visit(node.body),
                                       this.visitNodes(node.args));
    },
    visitObjectLiteral: function(node) {
        return new lively.ast.ObjectLiteral(node.pos, this.visitNodes(node.properties));
    },
    visitObjProperty: function(node) {
        return new lively.ast.ObjProperty(node.pos, node.name, this.visit(node.property));
    },
    visitSwitch: function(node) {
        return new lively.ast.Switch(node.pos,
                                     this.visit(node.expr),
                                     this.visitNodes(node.cases));
    },
    visitCase: function(node) {
        return new lively.ast.Case(node.pos,
                                   this.visit(node.condExpr),
                                   this.visit(node.thenExpr));
    },
    visitDefault: function(node) {
        return new lively.ast.Case(node.pos, this.visit(node.defaultExpr));
    },
    visitRegex: function(node) {
        return new lively.ast.Regex(node.pos, node.exprString, node.flags);
    },
    visitObjPropertyGet: function(node) {
        return new lively.ast.ObjPropertyGet(node.pos, node.name, this.visit(node.body));
    },
    visitObjPropertySet: function(node) {
        return new lively.ast.ObjPropertySet(node.pos,
                                             node.name,
                                             this.visit(node.body),
                                             node.arg);
    }
});

lively.ast.Rewriting.Transformation.subclass('lively.ast.Rewriting.RemoveDebugger',
'visiting', {
    visitDebugger: function(node) {
        return undefined;
    }
});

lively.ast.Rewriting.Transformation.subclass('lively.ast.Rewriting.Rewriter',
'initializing', {
    initialize: function($super) {
        $super();
        this.scopes = [];
    },
},
'scoping', {
    enterScope: function() {
        this.scopes.push([]);
    },
    registerVar: function(name) {
        if (this.scopes.length == 0) return;
        this.scopes.last().push(name);
    },
    referenceVar: function(name) {
        for (var i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].include(name)) return i;
        }
        return undefined;
    },
    exitScope: function() {
        this.scopes.pop();
    },
},
'helping', {
    computationFrame: function() {
        return new lively.ast.Variable([0,0], "_");
    },
    localFrame: function(i) {
        return new lively.ast.Variable([0,0], "_" + i);
    },
    frame: function(i) {
        if (i < 0) return new lively.ast.Variable([0,0], "Global");
        return new lively.ast.Variable([0,0], "__" + i);
    },
    storeComputationResult: function(node) {
        if (this.scopes.length == 0) return node; // dont store if there is no frame
        var name = new lively.ast.String(node.pos, node.position());
        var target = new lively.ast.GetSlot(node.pos, name, this.computationFrame());
        return new lively.ast.Set(node.pos, target, node);
    },
    registerArguments: function(func) {
        var args = [];
        for (var i = 0; i < func.args.length; i++) {
            var arg = func.args[i];
            this.registerVar(arg.name);
            args.push(new lively.ast.Variable(arg.pos, arg.name));
        }
        return args;
    },
    registerLocals: function(func) {
        var that = this;
        func.body.withAllChildNodesDo(function(node) {
            if (node.isFunction) return false;
            if (node.isVarDeclaration) that.registerVar(node.name);
            return true;
        });
    }
},
'rewriting', {
    wrapVar: function(pos, name) {
        var scope = this.referenceVar(name);
        if (scope === undefined) return new lively.ast.Variable(pos, name);
        return new lively.ast.GetSlot(pos,
                                      new lively.ast.String(pos, name),
                                      this.localFrame(scope));
    },
    rewriteVarDeclaration: function(pos, name, expr) {
        return new lively.ast.Set(pos, this.wrapVar(pos, name), expr);
    },
    emptyObj: function() {
        return new lively.ast.ObjectLiteral([0,0], []);
    },
    argsInitObj: function(args) {
        var properties = [];
        for (var i = 0; i < args.length; i++) {
            var arg = args[i].name;
            var argVal = new lively.ast.Variable([0,0], arg);
            properties.push(new lively.ast.ObjProperty([0,0], arg, argVal));
        }
        return new lively.ast.ObjectLiteral([0,0], properties);
    },
    addPreamble: function(astIdx, body, args) {
        var p = body.pos;
        var level = this.scopes.length;
        var initComputationFrame = new lively.ast.VarDeclaration(p, "_", this.emptyObj());
        var initLocalFrame = new lively.ast.VarDeclaration(p, "_"+level, this.argsInitObj(args));
        var frame = new lively.ast.ArrayLiteral(p, [this.computationFrame(),
                                                    this.localFrame(level),
                                                    new lively.ast.Number(p, astIdx),
                                                    this.frame(level - 1)]);
        var initFrame = new lively.ast.VarDeclaration(p, "__" + level, frame);
        return new lively.ast.Sequence(p, [initComputationFrame, initLocalFrame, initFrame, body]);
    },
    catchExceptions: function(astIdx, body) {
        var p = body.pos;
        var level = this.scopes.length;
        var parent = level == 0 ? "Global" : "__" + (level - 1);
        var throwStmt = new lively.ast.Throw(p, new lively.ast.Variable(p, "ex"));
        var shiftStmt = new lively.ast.Send(p,
            new lively.ast.String(p,"shiftFrame"),
            new lively.ast.Variable(p,"ex"),
            [new lively.ast.This(p), new lively.ast.Variable(p, "__" + level)]);
        var isUnwind = new lively.ast.GetSlot(p,
            new lively.ast.String(p, "isUnwindException"),
            new lively.ast.Variable(p, "e"));
        var classExpr = new lively.ast.GetSlot(p,
            new lively.ast.String(p,"UnwindException"),
            new lively.ast.GetSlot(p,
                new lively.ast.String(p,"Rewriting"),
                new lively.ast.GetSlot(p,
                    new lively.ast.String(p,"ast"),
                    new lively.ast.Variable(p,"lively"))));
        var newUnwind = new lively.ast.New(p,
            new lively.ast.Call(p, classExpr, [new lively.ast.Variable(p,"e")]));
        var cond = new lively.ast.Cond(p, isUnwind,
                                          new lively.ast.Variable(p, "e"),
                                          newUnwind);
        var catchSeq = new lively.ast.Sequence(p, [
            new lively.ast.VarDeclaration(p,"ex",cond), shiftStmt, throwStmt])
        var noop = new lively.ast.Variable(body.pos, "undefined");
        var error = new lively.ast.Variable(body.pos, "e");
        return new lively.ast.TryCatchFinally(body.pos, body, error, catchSeq, noop);
    },
    wrapFunctionBody: function(astIdx, body, args) {
        return this.catchExceptions(astIdx, this.addPreamble(astIdx, body, args));
    },
    wrapClosure: function(idx, node) {
        var fn = new lively.ast.Variable(node.pos, "__createClosure");
        var scope = this.frame(this.scopes.length - 1);
        var astIdx = new lively.ast.Number([0,0], idx);
        return new lively.ast.Call(node.pos, fn, [astIdx, scope, node]);
    }
},
'visiting', {
    visitVarDeclaration: function(node) {
        this.registerVar(node.name.value);
        return this.storeComputationResult(
            this.rewriteVarDeclaration(node.pos, node.name, this.visit(node.val)));
    },
    visitVariable: function(node) {
        return this.wrapVar(node.pos, node.name);
    },
    visitDebugger: function(node) {
        var ret = new lively.ast.Return(node.pos, new lively.ast.String(node.pos, "Debuggger"));
        var returnDebugger = new lively.ast.Function(node.pos,
            new lively.ast.Sequence(node.pos, [ret]), []);
        var ast = this.storeComputationResult(returnDebugger);
        var toString = new lively.ast.ObjProperty(node.pos, "toString", ast);
        return new lively.ast.Throw(node.pos, new lively.ast.ObjectLiteral(node.pos, [toString]));
    },
    visitSet: function($super, node) {
        return this.storeComputationResult($super(node));
    },
    visitCall: function($super, node) {
        return this.storeComputationResult($super(node));
        //return this.storeComputationResult(new lively.ast.Call(node.pos,
        //   this.storeComputationResult(this.visit(node.fn)),
        //   this.visitNodes(node.args)));
    },
    visitSend: function($super, node) {
        return this.storeComputationResult($super(node));
    },
    visitModifyingSet: function($super, node) {
        return this.storeComputationResult($super(node));
    },

    visitPreOp: function($super, node) {
        return this.storeComputationResult($super(node));
    },
    visitPostOp: function($super, node) {
        return this.storeComputationResult($super(node));
    },
    visitNew: function(node) {
        var clsExpr = this.visit(node.clsExpr);
        if (clsExpr.isSet) clsExpr = clsExpr.right;
        return this.storeComputationResult(new lively.ast.New(node.pos, clsExpr));
    },
    visitFunction: function($super, node) {
        this.enterScope();
        var args = this.registerArguments(node);
        this.registerLocals(node);
        var rewritten = new lively.ast.Function(node.pos, this.visit(node.body), args);
        this.exitScope();
        lively.ast.Rewriting.table.push(node);
        var idx = lively.ast.Rewriting.table.length - 1;
        rewritten.body = this.wrapFunctionBody(idx, rewritten.body, rewritten.args);
        return this.storeComputationResult(this.wrapClosure(idx, rewritten));
    }
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
    },
    eval2: function(src) {
        var ast = lively.ast.Parser.parse(src, 'topLevel');
        var wrapped = new lively.ast.Function([0,0], ast, []);
        wrapped.source = src;
        var rewriter = new lively.ast.Rewriting.Rewriter();
        var rewrittenAst = rewriter.visit(wrapped);
        return lively.ast.oldEval(rewrittenAst.asJS())();
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
                registerVars(findLocalVariables(node)); // locals
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
