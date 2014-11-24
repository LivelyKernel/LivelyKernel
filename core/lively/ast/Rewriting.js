module('lively.ast.Rewriting').requires('lively.ast.acorn', 'lively.ast.AstHelper').toRun(function() {

Object.extend(lively.ast.Rewriting, {

    _currentASTRegistry: (function() {
        return typeof LivelyDebuggingASTRegistry !== 'undefined' ? LivelyDebuggingASTRegistry : {};
    })(),

    getCurrentASTRegistry: function() {
        if (this._currentASTRegistry) return this._currentASTRegistry;
        return {};
    },

    setCurrentASTRegistry: function(astRegistry) {
        return this._currentASTRegistry = astRegistry;
    },

    rewrite: function(node, astRegistry, namespace) {
        var r = new lively.ast.Rewriting.Rewriter(astRegistry, namespace);
        return r.rewrite(node);
    },

    rewriteFunction: function(node, astRegistry, namespace) {
        var r = new lively.ast.Rewriting.Rewriter(astRegistry, namespace);
        return r.rewriteFunction(node);
    },

    rewriteLivelyCode: function(addSourceMaps) {
        addSourceMaps = !!addSourceMaps;

        // 1. Rewrite Lively code and put it into DBG_* files
        // 2. Create bootstrap code needed to run rewritten code
        var astReg = lively.ast.Rewriting.setCurrentASTRegistry({}),
            modules = lively.Module.bootstrapModules()
                .reject(function(ea) { return /lib\//.test(ea); })  // Ignore the libs
                // ignore rewriting code itself for now as it leads to self
                // encapsulated exceptions
                .withoutAll([
                    "core/lively/ast/Rewriting.js",
                    "core/lively/ast/StackReification.js"])
                .concat([
                    "core/lib/acorn/acorn.js",
                    "core/lib/acorn/acorn-walk.js",
                    "core/lib/acorn/acorn-loose.js",
                    "core/lively/ast/DebugExamples.js"]);

        lively.require('lively.ast.SourceMap').toRun(function() {
            removeExistingDebugFiles(function() {
                modules.forEachShowingProgress({
                    iterator: createRewrittenModule,
                    whenDone: createDebuggingBootstrap
                });
            });
        })

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // helper
        function createDebuggingBootstrap() {
            var code = [
                    lively.ast.Rewriting.createClosureBaseDef,
                    lively.ast.Rewriting.UnwindExceptionBaseDef
                ],
                flatRegistry = JSON.stringify(astReg, function(key, value) {
                    if (this.type == 'Literal' && this.value instanceof RegExp && key == 'value')
                        return { regexp: this.raw };
                    else
                        return value;
                }).replace(/\{"regexp":("\/.*?\/[gimy]*")\}/g, 'eval($1)');
            code.push("window.LivelyDebuggingASTRegistry=" + flatRegistry + ";");
            put("core/lively/ast/BootstrapDebugger.js", code.join('\n'));
        }

        function createRewrittenModule(modulePath) {
            // FIXME: manually wrap code in function so that async load will not temper with _0, etc.
            var originalAst = parse(get(modulePath)),
                rewrittenAst = rewrite(originalAst, modulePath),
                code = Strings.format('(function() {\n%s\n%s\n})();',
                    escodegen.generate(rewrittenAst),
                    declarationForGlobals(rewrittenAst)),
                fileName = modulePath.slice(modulePath.lastIndexOf('/') + 1);

            if (addSourceMaps) {
                lively.ast.acorn.rematchAstWithSource(rewrittenAst.body[0], code, true, 'body.0.expression.callee.body.body.0');
                var srcMap = lively.ast.SourceMap.Generator.mapForASTs(originalAst, rewrittenAst, fileName);
            }

            putRewritten(modulePath, code, srcMap);
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            function declarationForGlobals(rewrittenAst) {
                // _0 has all global variables
                var propAccess = lively.PropertyPath('body.0.block.body.0.declarations.4.init.properties'),
                    globalProps = propAccess.get(rewrittenAst);
                if (!globalProps) {
                    show('cannot access global declarations of %s ', modulePath);
                    return '\n';
                }
                var globalVars = globalProps.pluck('key').pluck('value');
                return globalVars.map(function(varName) {
                    return Strings.format('Global["%s"] = _0["%s"];', varName, varName);
                }).join('\n');;
            }
        }

        function get(path) {
            return URL.root.withFilename(path).asWebResource().get().content;
        }

        function putRewritten(path, rewrittenSource, sourceMap) {
            var idx = path.lastIndexOf('/') + 1,
                debugPath = path.slice(0,idx),
                debugFile = 'DBG_' + path.slice(idx);
            if (sourceMap) {
                put(debugPath + debugFile + 'm', sourceMap);
                rewrittenSource += '\n\n//# sourceMappingURL=' + debugFile + 'm';
            }
            put(debugPath + debugFile, rewrittenSource);
        }

        function put(path, source) {
            URL.root.withFilename(path).asWebResource().put(source);
        }

        function parse(source) {
            return lively.ast.acorn.parse(source, { locations: true });
        }

        function rewrite(ast, namespace) {
            return lively.ast.Rewriting.rewrite(ast, astReg, namespace);
        }

        function removeExistingDebugFiles(thenDo) {
            lively.ide.CommandLineSearch.findFiles('DBG_*.js*', {}, function(files) {
                lively.shell.exec('rm ' + files.join(' '), {}, thenDo);
            });
        }
    },

    recreateServerSideCode: function() {
        lively.require('lively.store.SQLiteInterface').toRun(function() {
            // 1. clear rewritten_objects table
            lively.store.SQLiteInterface.ensureDB('ObjectRepository', 'objects.sqlite', function() {
                lively.store.SQLiteInterface.query('ObjectRepository', ['DELETE FROM rewritten_objects;'],
                function(err, res) {
                    requestBootstrapFiles();
                });
            });

            // 2. request all the files that need to be rewritten in advance
            function requestBootstrapFiles() {

                // list of files taken from life_star config
                var bootstrapRewriteFiles = lively.Config.get("bootstrapFiles").concat([
                    'core/lively/Traits.js', 'core/lively/DOMAbstraction.js', 'core/lively/IPad.js',
                    'core/lively/LogHelper.js',
                    // bootstrap.js
                    'core/lively/bindings.js', 'core/lively/bindings/Core.js',
                    'core/lively/Main.js', 'core/lively/persistence/Serializer.js'
                    // directly necessary for debugging BUT excluded for now:
                    // 'core/lively/ast/Debugging.js', 'core/lively/ast/AcornInterpreter.js',
                    // 'core/lively/ast/Rewriting.js', 'core/lively/ast/AstHelper.js',
                    // 'core/lively/ast/acorn.js', 'core/lively/ast/StackReification.js'
                ]);

                bootstrapRewriteFiles.forEachShowingProgress({
                    iterator: function(filename) {
                        var file = URL.root.withFilename(filename);
                        file = file.withFilename('DBG_' + file.filename());
                        new WebResource(file).get(); // could be async but we have the progress bar
                    }
                });
            }
        });
    }

});

Object.subclass("lively.ast.Rewriting.Rewriter",
"initializing", {

    initialize: function(astRegistry, namespace)  {
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
        this.astRegistry = astRegistry || {};

        this.namespace = namespace;
        if (this.astRegistry[this.namespace] == undefined)
            this.astRegistry[this.namespace] = [];

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
                };
            }, this) : [],
            wDecls = decls || [];
        return this.newNode('ObjectExpression', {properties: wArgs.concat(wDecls)});
    }

},
'scoping', {

    enterScope: function(additionals) {
        additionals = additionals || {};
        return this.scopes.push(Object.extend(additionals, {localVars: [], computationProgress: []}));
    },

    exitScope: function() {
        this.scopes.pop();
    },

    lastFunctionScopeId: function() {
        return this.scopes.map(function(scope) {
            return !!(scope.isWithScope || scope.isCatchScope);
        }).lastIndexOf(false);
    },

    registerVars: function(varIdentifiers) {
        if (!this.scopes.length) return undefined;
        var scope = this.scopes.last(),
            that = this;
        return varIdentifiers.reduce(function(res, varIdentifier) {
            var varName = varIdentifier.name;
            if (scope.localVars.indexOf(varName) == -1) {
                scope.localVars.push(varName);
            }
            res.push(that.newNode('Identifier', { name: varName, astIndex: varIdentifier.astIndex }));
            return res;
        }, []);
    },

    registerDeclarations: function(ast, visitor) {
        if (!this.scopes.length) return;
        var scope = this.scopes.last(), that = this, decls = {};
        acorn.walk.matchNodes(ast, {
            'VariableDeclaration': function(node, state, depth, type) {
                if (node.type != type) return; // skip Expression, Statement, etc.
                node.declarations.forEach(function(n) {
                    // only if it has not been defined before (as variable or argument!)
                    if ((scope.localVars.indexOf(n.id.name) == -1) && (n.id.name != 'arguments')) {
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
        }, decls, { visitors: acorn.walk.visitors.stopAtFunctions });

        return Object.getOwnPropertyNames(decls).map(function(decl) {
            var node = decls[decl];
            if (node.type == 'FunctionDeclaration') {
                node = {
                    key: that.newNode('Literal', {value: node.id.name}),
                    kind: 'init',
                    value: that.rewriteFunctionDeclaration(node, visitor.registryIndex)
                }
            }
            return node;
        });
    }

},
'rewriting', {

    createPreamble: function(args, decls, level) {
        var lastFnLevel = this.lastFunctionScopeId();
        return [
            this.newNode('VariableDeclaration', {
                kind: 'var',
                declarations: [
                    this.newVariable('_', '{}'),
                    this.newVariable('lastNode', this.newNode('Identifier', {name: 'undefined'})),
                    this.newVariable('debugging', this.newNode('Literal', {value: false})),
                    this.newVariable('__' + level, []),
                    this.newVariable('_' + level, this.wrapArgsAndDecls(args, decls)),
                ]
            }),
            this.newNode('ExpressionStatement', {
                expression: this.newNode('CallExpression', {
                    callee: this.newNode('MemberExpression', {
                        object: this.newNode('Identifier', { name: '__' + level }),
                        property: this.newNode('Identifier', { name: 'push' }),
                        computed: false
                    }),
                    arguments: [
                        this.newNode('Identifier', { name: '_' }),
                        this.newNode('Identifier', { name: '_' + level }),
                        this.newNode('Identifier', { name: lastFnLevel < 0 ? 'Global' : '__' + lastFnLevel })
                    ]
                })
            })
        ];
    },

    createCatchForUnwind: function(node, originalFunctionIdx, level) {
        return this.newNode('TryStatement', {
            block: this.newNode('BlockStatement', {body: node.body, astIndex: node.astIndex}),
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
                            callee: this.newMemberExp('ex.storeFrameInfo'),
                            arguments: [
                                this.newNode('Identifier', {name: 'this'}),
                                this.newNode('Identifier', {name: 'arguments'}),
                                this.newNode('Identifier', {name: '__' + level}),
                                this.newNode('Identifier', {name: "lastNode"}),
                                this.newNode('Literal', {value: this.namespace}),
                                this.newNode('Literal', {value: originalFunctionIdx})]
                        })
                    }),
                    this.newNode('ThrowStatement', {argument: this.newNode('Identifier', {name: 'ex'})})
                ]}),
            }),
            guardedHandlers: [], finalizer: null
        });
    },

    createCatchScope: function(catchVar) {
        var scopeIdx = this.scopes.length - 1;
        return this.newNode('VariableDeclaration', {
            kind: 'var',
            declarations: [
                this.newVariable('_' + scopeIdx, this.newNode('ObjectExpression', {
                    properties: [{
                        key: this.newNode('Literal', {value: catchVar}),
                        kind: 'init', value: this.newNode('ConditionalExpression', {
                            test: this.newMemberExp(catchVar + '.isUnwindException'),
                            consequent: this.newMemberExp(catchVar + '.error'),
                            alternate: this.newNode('Identifier', {name: catchVar})
                        })
                    }]
                }))
            ]
        });
    },

    wrapSequence: function(node, args, decls, originalFunctionIdx) {
        var level = this.scopes.length;
        Array.prototype.unshift.apply(node.body, this.createPreamble(args, decls, level));
        return this.createCatchForUnwind(node, originalFunctionIdx, level);
    },

    wrapVar: function(name) {
        var scopeRef, withScopes = [], that = this;
        for (var i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].localVars.include(name)) {
                scopeRef = this.newNode('Identifier', { name: '_' + i });
                break;
            } else if (this.scopes[i].isWithScope)
                withScopes.push(i);
        }

        var result = this.newNode('Identifier', { name: name });
        if ((scopeRef === undefined) && (withScopes.length > 0)) {
            // mr 2014-02-05: the reference is a global one - should throw error?
            scopeRef = this.newNode('ObjectExpression', { properties: [{
                kind: 'init',
                key: this.newNode('Literal', { value: name }),
                value: this.newNode('Identifier', { name: name })
            }]}); // { name: name }
        }
        if (scopeRef !== undefined) {
            result = this.newNode('MemberExpression', {
                property: result,
                computed: false
            });
        }

        if (withScopes.length > 0) {
            result.object = withScopes.reverse().reduce(function(alternate, idx) {
                // (name in _xx ? _xx : ...)
                return that.newNode('ConditionalExpression', {
                    test: that.newNode('BinaryExpression', {
                        operator: 'in',
                        left: that.newNode('Literal', { value: name }),
                        right: that.newNode('Identifier', { name: '_' + idx })
                    }),
                    consequent: that.newNode('Identifier', { name: '_' + idx }),
                    alternate: alternate
                });
            }, scopeRef);
        } else
            result.object = scopeRef;
        return result;
    },

    isWrappedVar: function(node) {
        return node.type == 'MemberExpression' && node.object.type == 'Identifier' &&
               node.object.name[0] == '_' && !isNaN(node.object.name.substr(1));
    },

    wrapClosure: function(node, namespace, idx) {
        var scopeIdx = this.scopes.length - 1,
            scopeIdentifier = scopeIdx < 0 ?
                this.newNode('Literal', {value: null}) :
                this.newNode('Identifier', { name: '__' + this.lastFunctionScopeId() });
        return this.newNode('CallExpression', {
            callee: this.newNode('Identifier', {name: '__createClosure'}),
            arguments: [
                this.newNode('Literal', {value: namespace}),
                this.newNode('Literal', {value: idx}),
                scopeIdentifier,
                node
            ]
        });
    },

    simpleStoreComputationResult: function(node, astIndex) {
        return this.newNode('AssignmentExpression', {
            operator: '=',
            left: this.computationReference(astIndex),
            right: node,
            astIndex: astIndex,
            _prefixResult: true
        });
    },

    storeComputationResult: function(node, start, end, astIndex, postfix) {
        postfix = !!postfix;
        if (this.scopes.length == 0) return node;
        var pos = (node.start || start || 0) + '-' + (node.end || end || 0);
        this.scopes.last().computationProgress.push(pos);

        if (postfix) {
            // _[astIndex] = XX, lastNode = astIndex, _[astIndex]
            return this.newNode('SequenceExpression', {
                expressions: [
                    this.simpleStoreComputationResult(node, astIndex),
                    this.lastNodeExpression(astIndex),
                    this.computationReference(astIndex)
                ],
                _prefixResult: !postfix
            });
        } else {
            // _[lastNode = astIndex] = XX
            return this.newNode('AssignmentExpression', {
                operator: '=',
                left: this.computationReference(this.lastNodeExpression(astIndex)),
                right: node,
                _prefixResult: !postfix
            });
        }
    },

    isStoredComputationResult: function(node) {
        return this.isPrefixStored(node) || this.isPostfixStored(node);
    },

    isPrefixStored: function(node) {
        return node._prefixResult === true;
    },

    isPostfixStored: function(node) {
        return node._prefixResult === false;
    },

    inlineAdvancePC: function(node, astIndex) {
        return this.newNode('SequenceExpression', {
            expressions: [
                this.lastNodeExpression(astIndex),
                node
            ]
        });
    },

    lastNodeExpression: function(astIndex) {
        return this.newNode('AssignmentExpression', {
            operator: '=',
            left: this.newNode('Identifier', {name: 'lastNode'}),
            right: this.newNode('Literal', {value: astIndex}),
            astIndex: astIndex
        });
    },

    computationReference: function(astIndexOrNode) {
        return this.newNode('MemberExpression', {
            object: this.newNode('Identifier', { name: '_' }),
            property: isNaN(astIndexOrNode) ?
                astIndexOrNode : this.newNode('Literal', { value: astIndexOrNode }),
            computed: true
        });
    },

    rewrite: function(node) {
        this.enterScope();
        acorn.walk.addAstIndex(node);
        // FIXME: make astRegistry automatically use right namespace
        node.registryId = this.astRegistry[this.namespace].push(node) - 1;
        if (node.type == 'FunctionDeclaration')
            var args = this.registerVars(node.params); // arguments
        var rewriteVisitor = new lively.ast.Rewriting.RewriteVisitor(node.registryId),
            decls = this.registerDeclarations(node, rewriteVisitor), // locals
            rewritten = rewriteVisitor.accept(node, this);
        this.exitScope();
        var wrapped = this.wrapSequence(rewritten, args, decls, node.registryId);
        return this.newNode('Program', {body: [wrapped]});
    },

    rewriteFunction: function(node) {
        if (node.type !== "FunctionExpression")
            throw new Error('no a valid function expression/statement? ' + lively.ast.acorn.printAst(node));
        if (!node.id) node.id = this.newNode("Identifier", {name: ""});

        acorn.walk.addAstIndex(node);
        // FIXME: make astRegistry automatically use right namespace
        node.registryId = this.astRegistry[this.namespace].push(node) - 1;
        var rewriteVisitor = new lively.ast.Rewriting.RewriteVisitor(node.registryId),
            rewritten = rewriteVisitor.accept(node, this);
        // FIXME!
        rewritten = rewritten.expression.right.arguments[3];
        return rewritten;
    },

    rewriteFunctionDeclaration: function(node, originalRegistryIndex) {
        // FIXME: make astRegistry automatically use right namespace
        node.registryId = this.astRegistry[this.namespace].push(node) - 1;
        node._parentEntry = originalRegistryIndex;
        if (node.id.name.substr(0, 12) == '_NO_REWRITE_') {
            var astCopy = acorn.walk.copy(node);
            astCopy.type = 'FunctionExpression';
            return astCopy;
        }

        this.enterScope();
        var args = this.registerVars(node.params), // arguments
            rewriteVisitor = new lively.ast.Rewriting.RewriteVisitor(originalRegistryIndex),
            decls = this.registerDeclarations(node.body, rewriteVisitor), // locals
            rewritten = rewriteVisitor.accept(node.body, this);
        this.exitScope();
        var wrapped = this.wrapClosure({
            start: node.start, end: node.end, type: 'FunctionExpression',
            body: this.newNode('BlockStatement', {
                body: [this.wrapSequence(rewritten, args, decls, node.registryId)]}),
            id: node.id || null, params: args
        }, this.namespace, node.registryId);
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

lively.ast.Rewriting.BaseVisitor.subclass("lively.ast.Rewriting.RewriteVisitor",
'initializing', {

    initialize: function(registryIndex) {
        this.registryIndex = registryIndex;
    }

},
'visiting', {

    visitProgram: function(n, rewriter) {
        return {
            start: n.start, end: n.end, type: 'Program',
            body: n.body.map(function(node) {
                // node is of type Statement
                return this.accept(node, rewriter);
            }, this),
            astIndex: n.astIndex
        };
    },

    visitBlockStatement: function(n, rewriter) {
        return {
            start: n.start, end: n.end, type: 'BlockStatement',
            body: n.body.map(function(node) {
                // node is of type Statement
                return this.accept(node, rewriter);
            }, this),
            astIndex: n.astIndex
        };
    },

    visitSequenceExpression: function(n, rewriter) {
        return {
            start: n.start, end: n.end, type: 'SequenceExpression',
            expressions: n.expressions.map(function(node) {
                // node is of type Expression
                return this.accept(node, rewriter);
            }, this),
            astIndex: n.astIndex
        };
    },

    visitExpressionStatement: function(n, rewriter) {
        // expression is a node of type Expression
        var expr = this.accept(n.expression, rewriter);
        if (expr.type == 'ExpressionStatement')
            expr = expr.expression; // unwrap
        return {
            start: n.start, end: n.end, type: 'ExpressionStatement',
            expression: expr, astIndex: n.astIndex
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
            argument: arg, astIndex: n.astIndex
        };
    },

    visitForStatement: function(n, rewriter) {
        // init is a node of type VariableDeclaration or Expression or null
        var init = n.init ? this.accept(n.init, rewriter) : null;
        if (init && init.type == 'ExpressionStatement') {
            init.expression.astIndex = init.astIndex;
            init = init.expression;
        }
        return {
            start: n.start, end: n.end, type: 'ForStatement', astIndex: n.astIndex,
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
        var left, right = this.accept(n.right, rewriter),
            body = this.accept(n.body, rewriter),
            start = n.start, end = n.end, astIndex = n.right.astIndex;
        if (n.left.type == 'VariableDeclaration') {
            left = this.accept(n.left.declarations[0].id, rewriter);
            // fake astIndex for source mapping
            left.astIndex = n.left.astIndex;
            left.object.astIndex = n.left.declarations[0].astIndex;
            left.property.astIndex = n.left.declarations[0].id.astIndex;
        } else
            left = this.accept(n.left, rewriter);
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
            each: n.each, astIndex: n.astIndex
        };
    },

    visitDoWhileStatement: function(n, rewriter) {
        // body is a node of type Statement
        // test is a node of type Expression
        return {
            start: n.start, end: n.end, type: 'DoWhileStatement',
            test: this.accept(n.test, rewriter),
            body: this.accept(n.body, rewriter),
            astIndex: n.astIndex
        };
    },

    visitWhileStatement: function(n, rewriter) {
        // test is a node of type Expression
        // body is a node of type Statement
        return {
            start: n.start, end: n.end, type: 'WhileStatement',
            test: this.accept(n.test, rewriter),
            body: this.accept(n.body, rewriter),
            astIndex: n.astIndex
        };
    },

    visitIfStatement: function(n, rewriter) {
        // Since visitDebuggerStatement creates an if block,
        // make sure to wrap it in a block when it is the only statement
        var test = this.accept(n.test, rewriter),
            consequent = this.accept(n.consequent, rewriter),
            alternate = n.alternate;
        if (n.consequent.type == 'DebuggerStatement')
            consequent = rewriter.newNode('BlockStatement', { body: [consequent] });
        if (alternate) {
            alternate = this.accept(alternate, rewriter);
            if (n.alternate.type == 'DebuggerStatement')
                alternate = rewriter.newNode('BlockStatement', { body: [alternate] });
        }
        return {
            start: n.start, end: n.end, type: 'IfStatement',
            test: test, consequent: consequent, alternate: alternate,
            astIndex: n.astIndex
        };
    },

    visitSwitchStatement: function(n, rewriter) {
        // discriminant is a node of type Expression
        var discriminant = this.accept(n.discriminant, rewriter);
        if (!rewriter.isStoredComputationResult(discriminant)) {
            // definitely capture state because it can be changed in switch cases (resume in case)
            discriminant = rewriter.storeComputationResult(discriminant,
                n.discriminant.start, n.discriminant.end, n.discriminant.astIndex);
        }
        return {
            start: n.start, end: n.end, type: 'SwitchStatement',
            discriminant: discriminant,
            cases: n.cases.map(function(node) {
                // node is of type SwitchCase
                return this.accept(node, rewriter);
            }, this),
            astIndex: n.astIndex
        };
    },

    visitSwitchCase: function(n, rewriter) {
        // test is a node of type Expression
        var test = this.accept(n.test, rewriter);
        if (test != null && !rewriter.isStoredComputationResult(test) && test.type != 'Literal') {
            // definitely capture state because it can be changed in cases' bodies (resume in case)
            test = rewriter.storeComputationResult(test,
                n.test.start, n.test.end, n.test.astIndex);
        }
        return {
            start: n.start, end: n.end, type: 'SwitchCase',
            test: test,
            consequent: n.consequent.map(function(node) {
                // node is of type Statement
                return this.accept(node, rewriter);
            }, this),
            source: n.source, astIndex: n.astIndex
        };
    },

    visitBreakStatement: function(n, rewriter) {
        // label is a node of type Identifier
        return {
            start: n.start, end: n.end, type: 'BreakStatement',
            label: n.label,
            astIndex: n.astIndex
        };
    },

    visitContinueStatement: function(n, rewriter) {
        // label is a node of type Identifier
        return {
            start: n.start, end: n.end, type: 'ContinueStatement',
            label: n.label,
            astIndex: n.astIndex
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

        return rewriter.newNode('IfStatement', {
            // if (lively.Config.enableDebuggerStatements)
            test: rewriter.newNode('MemberExpression', {
                object: rewriter.newNode('MemberExpression', {
                    object: rewriter.newNode('Identifier', { name: 'lively' }),
                    property: rewriter.newNode('Identifier', { name: 'Config' }),
                    computed: false
                }),
                property: rewriter.newNode('Identifier', { name: 'enableDebuggerStatements' }),
                computed: false
            }),
            consequent: rewriter.newNode('BlockStatement', { body: [
                // debugging = true;
                rewriter.newNode('ExpressionStatement', {
                    expression: rewriter.newNode('AssignmentExpression', {
                        operator: '=',
                        left: rewriter.newNode('Identifier', { name: 'debugging' }),
                        right: rewriter.newNode('Literal', { value: true })
                    })
                }),
                // _[lastNode = xx] = undefined;
                rewriter.newNode('ExpressionStatement', {
                    expression: rewriter.storeComputationResult(
                        rewriter.newNode('Identifier', { name: 'undefined' }), n.start, n.end, astIndex)
                }),
                // throw { toString: function() { return 'Debugger'; }, astIndex: xx };
                rewriter.newNode('ThrowStatement', {
                    argument: rewriter.newNode('ObjectExpression', {
                        properties: [{
                            key: rewriter.newNode('Identifier', { name: 'toString' }),
                            kind: 'init', value: fn
                        }, {
                            key: rewriter.newNode('Identifier', { name: 'astIndex' }),
                            kind: 'init', value: rewriter.newNode('Literal', {value: astIndex})
                        }]
                    })
                })
            ]}),
            alternate: null
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

        // FIXME: make astRegistry automatically use right namespace
        n.registryId = rewriter.astRegistry[rewriter.namespace].push(n) - 1;
        n._parentEntry = this.registryIndex;

        var start = n.start, end = n.end, astIndex = n.astIndex;
        if (n.id && n.id.name.substr(0, 12) == '_NO_REWRITE_') {
            return rewriter.newNode('ExpressionStatement', {
                expression: rewriter.storeComputationResult(n, n.start, n.end, astIndex),
                id: n.id
            });
        }

        rewriter.enterScope();
        var args = rewriter.registerVars(n.params), // arguments
            decls = rewriter.registerDeclarations(n.body, this), // locals
            rewritten = this.accept(n.body, rewriter);
        rewriter.exitScope();
        var wrapped = rewriter.wrapClosure({
            start: n.start, end: n.end, type: 'FunctionExpression',
            body: rewriter.newNode('BlockStatement', {
                body: [rewriter.wrapSequence(rewritten, args, decls, n.registryId)]}),
            id: n.id || null, params: args, astIndex: n.astIndex
        }, rewriter.namespace, n.registryId);
        wrapped.astIndex = n.astIndex;
        wrapped = rewriter.newNode('ExpressionStatement', {
            expression: rewriter.simpleStoreComputationResult(wrapped, astIndex),
            id: n.id
        });
        return wrapped;
    },

    visitVariableDeclaration: function(n, rewriter) {
        // each of n.declarations is of type VariableDeclarator
        // n.kind is "var" or "let" or "const"
        var start = n.start, end = n.end, astIndex = n.astIndex;
        var decls = n.declarations.map(function(decl) {
            if (decl.init == null) { // no initialization, e.g. var x;
                // only advance the pc
                var node = rewriter.lastNodeExpression(decl.astIndex);
                node.right.astIndex = decl.id.astIndex; // fake astIndex for source mapping
                return node;
            }

            var value = this.accept(decl.init, rewriter);
            value = rewriter.newNode('AssignmentExpression', {
                left: this.accept(decl.id, rewriter),
                operator: '=',
                right: (decl.init && decl.init.type == 'FunctionExpression') ?
                    value.expression : // unwrap
                    value,
                astIndex: decl.astIndex
            });
            return rewriter.storeComputationResult(value, start, end, decl.astIndex, true);
        }, this);

        return rewriter.newNode('ExpressionStatement', {
            expression: decls.length == 1 ? decls[0] :
                rewriter.newNode('SequenceExpression', {expressions: decls}),
            astIndex: astIndex
        });
    },

    visitArrayExpression: function(n, rewriter) {
        // each of n.elements can be of type Expression
        return {
            start: n.start, end: n.end, type: 'ArrayExpression', astIndex: n.astIndex,
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
            start: n.start, end: n.end, type: 'ObjectExpression', astIndex: n.astIndex,
            properties: n.properties.map(function(prop) {
                var value = this.accept(prop.value, rewriter);
                if (prop.kind != 'init') { // set or get
                    // function cannot be replace by a closure directly
                    value = value.expression.right.arguments[3]; // unwrap
                }
                var key = prop.key.type == 'Identifier' ?
                    { // original identifier rule
                        start: prop.key.start, end: prop.key.end, type: 'Identifier',
                        name: prop.key.name, astIndex: prop.key.astIndex
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

    visitUnaryExpression: function(n, rewriter) {
        // node.operator is an UnaryOperator enum:
        // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
        // n.prefix has a specific type that is boolean
        // argument is a node of type Expression
        return {
            start: n.start, end: n.end, type: 'UnaryExpression',
            argument: this.accept(n.argument, rewriter),
            operator: n.operator, prefix: n.prefix,
            astIndex: n.astIndex
        };
    },

    visitBinaryExpression: function(n, rewriter) {
        // node.operator is an BinaryOperator enum:
        // "==" | "!=" | "===" | "!==" | | "<" | "<=" | ">" | ">=" | | "<<" | ">>" | ">>>" | | "+" | "-" | "*" | "/" | "%" | | "|" | "^" | "&" | "in" | | "instanceof" | ".."
        // left is a node of type Expression
        // right is a node of type Expression
        return {
            start: n.start, end: n.end, type: 'BinaryExpression',
            left: this.accept(n.left, rewriter),
            right: this.accept(n.right, rewriter),
            operator: n.operator, astIndex: n.astIndex
        };
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
            left: left, operator: n.operator, right: right, astIndex: n.astIndex
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
            alternate: alternate, astIndex: n.astIndex
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
        var start = n.start, end = n.end, astIndex = n.astIndex,
            thisIsBound = n.callee.type == 'MemberExpression', // like foo.bar();
            callee = this.accept(n.callee, rewriter);
        if (callee.type == 'ExpressionStatement') callee = callee.expression; // unwrap

        var args = n.arguments.map(function(n) {
                var n = this.accept(n, rewriter);
                return n.type == 'ExpressionStatement' ? n.expression : /*unwrap*/ n;
            }, this),
            lastArg = args.last();

        if (lastArg !== undefined) {
            if (rewriter.isPrefixStored(lastArg))
                lastArg = lastArg.right; // unwrap
            if (!rewriter.isPostfixStored(lastArg)) {
                lastArg = args[args.length - 1] = rewriter.storeComputationResult(lastArg, lastArg.start, lastArg.end, n.arguments.last().astIndex, true);
                // patch astIndex to calls astIndex
                lastArg.expressions[1] = rewriter.lastNodeExpression(astIndex);
            }
        }

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

        var callNode = {
            type: 'CallExpression', callee: callee,
            arguments: args, astIndex: astIndex
        };
        if (lastArg === undefined)
            return rewriter.storeComputationResult(callNode, start, end, astIndex);
        else
            return rewriter.simpleStoreComputationResult(callNode, astIndex);
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
                    name: n.property.name, astIndex: n.property.astIndex
                };
        if (object.type == 'ExpressionStatement')
            object = object.expression;
        return {
            start: n.start, end: n.end, type: 'MemberExpression',
            object: object, property: property, computed: n.computed, astIndex: n.astIndex
        };
    },

    visitTryStatement: function(n, rewriter) {
        // block is a node of type BlockStatement
        // handler is a node of type CatchClause or null
        // finalizer is a node of type BlockStatement null
        var block = this.accept(n.block, rewriter),
            handler = n.handler,
            finalizer = n.finalizer,
            guardedHandlers = n.guardedHandlers.map(function(node) {
                // node is of type CatchClause
                return this.accept(node, rewriter);
            }, this);
        if (!handler)
            handler = rewriter.newNode('CatchClause', {
                param: rewriter.newNode('Identifier', { name: 'e' }),
                body: rewriter.newNode('BlockStatement', { body: [] })
            });
        handler = this.accept(handler, rewriter);

        if (finalizer) {
            finalizer = rewriter.newNode('BlockStatement', { body: [
                rewriter.newNode('IfStatement', {
                    test: rewriter.newNode('UnaryExpression', {
                        operator: '!', prefix: true,
                        argument: rewriter.newNode('Identifier', { name: 'debugging' })
                    }),
                    consequent: this.accept(finalizer, rewriter),
                    alternate: null
                })
            ]});
        }

        return {
            start: n.start, end: n.end, type: 'TryStatement',
            block: block, handler: handler, finalizer: finalizer,
            guardedHandlers: guardedHandlers,
            astIndex: n.astIndex
        };
    },

    visitCatchClause: function(n, rewriter) {
        // param is a node of type Pattern
        // guard is a node of type Expression (optional)
        // body is a node of type BlockStatement
        var start = n.param.start, end = n.param.end,
            param = Object.extend({}, n.param), // manually copy param without wrapping
            paramIndex = n.param.astIndex,
            guard = n.guard ?  this.accept(n.guard, rewriter) : guard;

        var scopeIdx = rewriter.enterScope({ isCatchScope: true }) - 1,
            catchParam = rewriter.registerVars([n.param]),
            body = this.accept(n.body, rewriter);
        if (paramIndex) {
            body.body.unshift(
                // lastNode = xx;
                rewriter.newNode('ExpressionStatement', {
                    expression: rewriter.lastNodeExpression(paramIndex)
                }),
                // __xx-1 = [_, _xx, __xx-1];
                rewriter.newNode('ExpressionStatement', {
                    expression: rewriter.newNode('AssignmentExpression', {
                        operator: '=',
                        left: rewriter.newNode('Identifier', { name: '__' + (scopeIdx - 1) }),
                        right: rewriter.newNode('ArrayExpression', { elements: [
                            rewriter.newNode('Identifier', { name: '_' }),
                            rewriter.newNode('Identifier', { name: '_' + scopeIdx }),
                            rewriter.newNode('Identifier', { name: '__' + (scopeIdx - 1) })
                        ]})
                    })
                })
            );
            body.body.push(
                // __xx-1 = __xx-1[2];
                rewriter.newNode('ExpressionStatement', {
                    expression: rewriter.newNode('AssignmentExpression', {
                        operator: '=',
                        left: rewriter.newNode('Identifier', { name: '__' + (scopeIdx - 1) }),
                        right: rewriter.newNode('MemberExpression', {
                            object: rewriter.newNode('Identifier', { name: '__' + (scopeIdx - 1) }),
                            property: rewriter.newNode('Literal', { value: 2 }),
                            computed: true
                        })
                    })
                })
            );
        }
        body.body.unshift(
            // var _xx = { 'e': e.isUnwindExpression ? e.error : e };
            rewriter.createCatchScope(param.name),
            // if (_xx[x].toString() == 'Debugger' && !lively.Config.get('loadRewrittenCode'))
            //     throw e;
            rewriter.newNode('IfStatement', {
                test: rewriter.newNode('LogicalExpression', {
                    operator: '&&',
                    left: rewriter.newNode('BinaryExpression', {
                        operator: '==',
                        left: rewriter.newNode('CallExpression', {
                            callee: rewriter.newNode('MemberExpression', {
                                object: rewriter.newNode('MemberExpression', {
                                    object: rewriter.newNode('Identifier', { name: '_' + scopeIdx }),
                                    property: rewriter.newNode('Literal', { value: param.name }),
                                    computed: true
                                }),
                                property: rewriter.newNode('Identifier', { name: 'toString' }),
                                computed: false
                            }), arguments: []
                        }),
                        right: rewriter.newNode('Literal', { value: 'Debugger' })
                    }),
                    right: rewriter.newNode('UnaryExpression', {
                        operator: '!',
                        prefix: true,
                        argument: rewriter.newNode('CallExpression', {
                            callee: rewriter.newNode('MemberExpression', {
                                object: rewriter.newNode('MemberExpression', {
                                    object: rewriter.newNode('Identifier', { name: 'lively' }),
                                    property: rewriter.newNode('Identifier', { name: 'Config' }),
                                    computed: false
                                }),
                                property: rewriter.newNode('Identifier', { name: 'get' }),
                                computed: false
                            }),
                            arguments: [
                                rewriter.newNode('Literal', { value: 'loadRewrittenCode' })
                            ]
                        })
                    })
                }),
                consequent: rewriter.newNode('ThrowStatement', {
                    argument: rewriter.newNode('Identifier', { name: param.name })
                }),
                alternate: null
            })
        );
        rewriter.exitScope();
        return {
            start: n.start, end: n.end, type: 'CatchClause',
            param: param, guard: guard, body: body, astIndex: n.astIndex
        };
    },

    visitThrowStatement: function(n, rewriter) {
        // argument is a node of type Expression
        return {
            start: n.start, end: n.end, type: 'ThrowStatement',
            argument: rewriter.inlineAdvancePC(this.accept(n.argument, rewriter), n.astIndex),
            astIndex: n.astIndex
        };
    },

    visitIdentifier: function(n, rewriter) {
        // n.name has a specific type that is string
        var node = rewriter.wrapVar(n.name);
        node.astIndex = n.astIndex;
        return node;
    },

    visitWithStatement: function(n, rewriter) {
        // object is a node of type Expression
        // body is a node of type Statement
        var scopeIdx = rewriter.enterScope({ isWithScope: true }) - 1,
            lastFnScopeIdx = rewriter.lastFunctionScopeId(),
            block = this.accept(n.body, rewriter);
        rewriter.exitScope();
        if (block.type != 'BlockStatement')
            block = rewriter.newNode('BlockStatement', { body: [ block ] });

        block.body.unshift(
            // var _xx+1 = withObject;
            rewriter.newNode('VariableDeclaration', {
                kind: 'var',
                declarations: [
                    rewriter.newVariable('_' + scopeIdx, this.accept(n.object, rewriter))
                ]
            }),
            // __xx = [_, _xx+1, __xx];
            rewriter.newNode('ExpressionStatement', {
                expression: rewriter.newNode('AssignmentExpression', {
                    operator: '=',
                    left: rewriter.newNode('Identifier', { name: '__' + lastFnScopeIdx }),
                    right: rewriter.newNode('ArrayExpression', { elements: [
                        rewriter.newNode('Identifier', { name: '_' }),
                        rewriter.newNode('Identifier', { name: '_' + scopeIdx }),
                        rewriter.newNode('Identifier', { name: '__' + lastFnScopeIdx })
                    ]})
                })
            })
        );
        block.body.push(
            // __xx = __xx[2];
            rewriter.newNode('ExpressionStatement', {
                expression: rewriter.newNode('AssignmentExpression', {
                    operator: '=',
                    left: rewriter.newNode('Identifier', { name: '__' + lastFnScopeIdx }),
                    right: rewriter.newNode('MemberExpression', {
                        object: rewriter.newNode('Identifier', { name: '__' + lastFnScopeIdx }),
                        property: rewriter.newNode('Literal', { value: 2 }),
                        computed: true
                    })
                })
            })
        );

        return block;
    }

});

(function setupUnwindException() {

    lively.ast.Rewriting.createClosureBaseDef =
        "window.__createClosure = function __createClosure(namespace, idx, parentFrameState, f) {\n"
      + "    var ast = (LivelyDebuggingASTRegistry[namespace] != null ? LivelyDebuggingASTRegistry[namespace][idx] : null);\n"
      + "    if (ast == null)\n"
      + "        // THIS SHOULD NEVER HAPPEN! NEVER.\n"
      + "        throw new Error('Could not find AST index ' + idx + ' in registry.');\n"
      + "    else\n"
      + "        f._cachedAst = ast;\n"
      + "    // parentFrameState = [computedValues, varMapping, parentParentFrameState]\n"
      + "    f._cachedScopeObject = parentFrameState;\n"
      + "    f.livelyDebuggingEnabled = true;\n"
      + "    var realCode = f.toString();\n"
      + "    f.toStringRewritten = function() { return realCode; };\n"
      + "    f.toString = function toString() {\n"
      + "        var ast = this._cachedAst;\n"
      + "        var src = ast.source || escodegen.generate(ast); // FIXME: get rid of source generation\n"
      + "        return src;\n"
      + "    };\n"
      + "    return f;\n"
      + "}\n\n"
      + "window.__getClosure = function __getClosure(namespace, idx) {\n"
      + "    var subRegistry = LivelyDebuggingASTRegistry[namespace];"
      + "    return (subRegistry != null ? subRegistry[idx] : null);\n"
      + "}\n";

    lively.ast.Rewriting.UnwindExceptionBaseDef =
        "window.UnwindException = function UnwindException(error) { this.error = error; error.unwindException = this; this.frameInfo = []; }\n"
      + "UnwindException.prototype.isUnwindException = true;\n"
      + "UnwindException.prototype.toString = function() { return '[UNWIND] ' + this.error.toString(); }\n"
      + "UnwindException.prototype.storeFrameInfo = function(/*...*/) { this.frameInfo.push(arguments); }\n";

    // base definition for UnwindException
    if (typeof UnwindException === 'undefined') {
        eval(lively.ast.Rewriting.UnwindExceptionBaseDef)
    }

    // when debugging is enabled UnwindException can do more...
    UnwindException.addMethods({

        recreateFrames: function() {
            this.frameInfo.forEach(function(frameInfo) {
                this.createAndShiftFrame.apply(this, Array.from(frameInfo));
            }, this);
            this.frameInfo = [];
            return this;
        },

        createAndShiftFrame: function(thiz, args, frameState, lastNodeAstIndex, namespaceForOrigAst, pointerToOriginalAst) {
            var topScope = lively.ast.AcornInterpreter.Scope.recreateFromFrameState(frameState),
                alreadyComputed = frameState[0],
                func = new lively.ast.AcornInterpreter.Function(__getClosure(namespaceForOrigAst, pointerToOriginalAst), topScope),
                frame = lively.ast.AcornInterpreter.Frame.create(func /*, varMapping */),
                pc;
            frame.setThis(thiz);
            if (frame.func.node && frame.func.node.type != 'Program')
                frame.setArguments(args);
            frame.setAlreadyComputed(alreadyComputed);
            if (!this.top) {
                pc = this.error && acorn.walk.findNodeByAstIndex(frame.getOriginalAst(),
                    this.error.astIndex ? this.error.astIndex : lastNodeAstIndex);
            } else {
                if (frame.isAlreadyComputed(lastNodeAstIndex)) lastNodeAstIndex++;
                pc = acorn.walk.findNodeByAstIndex(frame.getOriginalAst(), lastNodeAstIndex);
            }
            frame.setPC(pc);
            frame.setScope(topScope);

            return this.shiftFrame(frame, true);
        },

        shiftFrame: function(frame, isRecreating) {
            if (!isRecreating)
                this.recreateFrames();
            if (!frame.isResuming()) console.log('Frame without PC found!', frame);
            if (!this.top) {
                this.top = this.last = frame;
            } else {
                this.last.setParentFrame(frame);
                this.last = frame;
            }
            return frame;
        },

        unshiftFrame: function() {
            this.recreateFrames();
            if (!this.top) return;

            var frame = this.top,
                prevFrame;
            while (frame.getParentFrame()) {
                prevFrame = frame;
                frame = frame.getParentFrame();
            }
            if (prevFrame) { // more then one frame
                prevFrame.setParentFrame(undefined);
                this.last = prevFrame;
            } else {
                this.top = this.last = undefined;
            }
            return frame;
        }

    });

})();

}) // end of module
