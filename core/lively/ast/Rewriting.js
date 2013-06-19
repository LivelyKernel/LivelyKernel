module('lively.ast.Rewriting').requires('lively.ast.Parser').toRun(function() {

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
    }
},
'scoping', {
    enterScope: function() {
        this.scopes.push({vars:[],tmps:[]});
    },
    registerVar: function(name) {
        if (this.scopes.length == 0) return;
        this.scopes.last().vars.push(name);
    },
    registerTemp: function(pos) {
        if (this.scopes.length == 0) return;
        var name = "_" + pos[0] + "_" + pos[1];
        this.scopes.last().tmps.push(name);
        return name;
    },
    referenceVar: function(name) {
        for (var i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].vars.include(name)) return i + 1;
        }
        return undefined;
    },
    exitScope: function() {
        this.scopes.pop();
    },
},
'helping', {
    localFrame: function(i) {
        return new lively.ast.Variable([0,0], "_" + i);
    },
    frame: function(i) {
        if (i <= 0) return new lively.ast.Variable([0,0], "Global");
        return new lively.ast.Variable([0,0], "__" + i);
    },
    storeComputationResult: function(node) {
        if (this.scopes.length == 0) return node; // dont store if there is no frame
        var name = this.registerTemp(node.pos);
        var target = new lively.ast.Variable(node.pos, name);
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
        var stmts = [];
        stmts.push(new lively.ast.VarDeclaration(p, "_"+level, this.argsInitObj(args)));
        var undef = new lively.ast.Variable(p, "__UNDEF");
        for (var i = 0; i < this.scopes.last().tmps.length; i++) {
            var name = this.scopes.last().tmps[i];
            stmts.push(new lively.ast.VarDeclaration(p, name , undef));
        }
        stmts.push(body);
        return new lively.ast.Sequence(p, stmts);
    },
    captureTemps: function(p) {
        var result = [];
        var recv = new lively.ast.Variable(p, "e");
        var prop = new lively.ast.String(p, "addTemp");
        var tmps = this.scopes.last().tmps;
        for (var i = 0; i < tmps.length; i++) {
            var args = [
                new lively.ast.String(p, tmps[i]),
                new lively.ast.Variable(p, tmps[i])
            ];
            result.push(new lively.ast.Send(p, prop, recv, args));
        }
        return result;
    },
    catchExceptions: function(astIdx, body) {
        var p = body.pos;
        var val = function(name) {
            return new lively.ast.Variable(p, name);
        };
        var level = this.scopes.length;
        var args = [new lively.ast.This(p), this.localFrame(level),
                    new lively.ast.Number(p, astIdx), val("e")];
        var shiftFrame = new lively.ast.Call(p, val("__shiftFrame"), args);
        var seq = [];
        seq.push(new lively.ast.Set(p, val("e"), shiftFrame));
        seq.pushAll(this.captureTemps(p));
        seq.push(new lively.ast.Throw(p, val("e")));
        var catchSeq = new lively.ast.Sequence(p, seq);
        return new lively.ast.TryCatchFinally(
            p, body, val("e"), catchSeq, val("undefined"));
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
        lively.ast.Rewriting.table.push(node);
        var idx = lively.ast.Rewriting.table.length - 1;
        rewritten.body = this.wrapFunctionBody(idx, rewritten.body, rewritten.args);
        this.exitScope();
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
    shiftFrame: function(astIndex, thiz) {
        var computationFrame = {};
        var localFrame = {};
        var stackFrame = {
            "this": thiz,
            tmps: computationFrame,
            vars: localFrame,
            ast: astIndex,
            caller: Global,
        };
        if (!this.top) {
            this.top = this.last = stackFrame;
            return;
        }
        this.last.caller = stackFrame;
        this.last = stackFrame;
    },
    addTemp: function(pos, value) {
        if (value === __UNDEF) return;
        var position = pos.substring(1).replace('_', '-');
        this.last.tmps[position] = value;
    },
    addVar: function(name, value) {
        this.last.vars[name] = value;
    },
    setMapping: function(mapping) {
        this.last.vars = mapping;
    }
});

Object.extend(Global, {
    __UNDEF: {},
    __createClosure: function(idx, scope, f) {
        f._cachedAst = lively.ast.Rewriting.table[idx];
        f._cachedScope = scope;
        return f;
    },
    __shiftFrame: function(thiz, vars, astIndex, exception) {
        if (!exception.isUnwindException) {
            exception = new lively.ast.Rewriting.UnwindException(exception);
        }
        exception.shiftFrame(astIndex, thiz);
        exception.setMapping(vars);
        return exception;
    },
    eval2: function(src) {
        var ast = lively.ast.Parser.parse(src, 'topLevel');
        if (ast.isSequence) {
            var last = ast.children.last();
            var ret = new lively.ast.Return(last.pos, last);
            ast.children[ast.children.length - 1] = ret;
        }
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

}) // end of module
