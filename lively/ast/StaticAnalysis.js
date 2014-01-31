module('lively.ast.StaticAnalysis').requires('lively.ast.Parser').toRun(function() {

lively.ast.Visitor.subclass('lively.ast.DFAVisitor',
'analyzing helper', {
    knownGlobals: ["true", "false", "null", "undefined",
                   "Object", "Function", "String", "Array", "Date", "Math", "Error",
                   "parseFloat", "isNaN", "eval", "alert",
                   "window", "document", "console",
                   "Node", "HTMLCanvasElement", "Image",
                   "lively", "pt", "rect", "rgb"],
    newScope: function() {
        return this.current = this.current ? this.current.newScope() : new lively.ast.DFAScope();
    }
},
'analyzing', {

    analyze: function(ast) {
        this.current = null;
        this.root = this.newScope();
        this.visit(ast);
    },

    globalVariables: function() {
        return this.root.allGlobalUses().pushAll(this.root.allGlobalDefs());
    },

},
'visiting', {
    visitVariable: function(node) {
        if (this.knownGlobals.include(node.name)) return;
        if (this.current.isDeclaration(node)) {
            this.current.define(node);
        } else if (node._parent.isSet) {
            this.current.define(node);
        } else {
            this.current.use(node);
        }
    },
    visitVarDeclaration: function(node) {
        this.current.define(node);
        this.visitParts(node, ['val']);
    },
    visitParts: function(node, parts) {
        var that = this;
        parts.each(function(p) {
            if (p.endsWith('*')) {
                node[p.substring(0, p.length-1)].invoke('accept', that);
            } else {
                node[p].accept(that);
            }
        });
    },
    visitSequence: function(node) { this.visitParts(node, ["children*"]) },
    visitArrayLiteral: function(node) { this.visitParts(node, ["elements*"]) },
    visitObjectLiteral: function(node) { this.visitParts(node, ["properties*"]) },
    visitCond: function(node) { this.visitParts(node, ['condExpr', 'trueExpr', 'falseExpr']) },
    visitIf: function(node) { this.visitCond(node) },
    visitWhile: function(node) { this.visitParts(node, ['condExpr', 'body']) },
    visitDoWhile: function(node) { this.visitParts(node, ['body', 'condExpr']) },
    visitFor: function(node) { this.visitParts(node, ['init', 'condExpr', 'upd', 'body']) },
    visitForIn: function(node) { this.visitParts(node, ['name', 'obj', 'body']) },
    visitSet: function(node) { this.visitParts(node, ['left', 'right']) },
    visitModifyingSet: function(node) { this.visitParts(node, ['left', 'right']) },
    visitBinaryOp: function(node) { this.visitParts(node, ['left', 'right']) },
    visitUnaryOp: function(node) { this.visitParts(node, ['expr']) },
    visitPreOp: function(node) { this.visitParts(node, ['expr']) },
    visitPostOp: function(node) { this.visitParts(node, ['expr']) },
    visitGetSlot: function(node) { this.visitParts(node, ['slotName', 'obj']) },
    visitReturn: function(node) { this.visitParts(node, ['expr']) },
    visitWith: function(node) { this.visitParts(node, ['obj', 'body']) },
    visitSend: function(node) { this.visitParts(node, ['recv', 'property', 'args*']) },
    visitCall: function(node) { this.visitParts(node, ['fn', 'args*']) },
    visitNew: function(node) { this.visitParts(node, ['clsExpr']) },
    visitThrow: function(node) { this.visitParts(node, ['expr']) },
    visitTryCatchFinally: function(node) {
        this.visitParts(node, ['trySeq']);
        this.current = this.newScope();
        this.visitParts(node, ['err', 'catchSeq']);
        this.current = this.current.parent;
        this.visitParts(node, ['finallySeq']);
    },
    visitFunction: function(node) {
        this.current = this.newScope();
        this.visitParts(node, ['args*', 'body']);
        this.current = this.current.parent;
    },
    visitObjProperty: function(node) { this.visitParts(node, ['property']) },
    visitSwitch: function(node) { this.visitParts(node, ['expr']) },
    visitCase: function(node) { this.visitParts(node, ['condExpr', 'thenExpr']) },
    visitDefault: function(node) { this.visitParts(node, ['defaultExpr']) }
});

Object.subclass('lively.ast.DFAScope',
'initializing', {
    initialize: function() {
        this.def_uses = [];
        this.global_uses = [];
        this.global_defs = [];
        this.scopes = [];
        this.parent = null;
    },
},
'helping', {
    isDeclaration: function(node) {
        return node.isVarDeclaration || node._parent.isFunction || node._parent.isTryCatchFinally;
    },
},
'accessing', {
    newScope: function() {
        var s = new lively.ast.DFAScope();
        this.scopes.push(s);
        s.parent = this;
        return s;
    },
    declaration: function(name) {
        for (var i = this.def_uses.length - 1; i >= 0; i--) {
            var def = this.def_uses[i][0];
            if (def.name == name && this.isDeclaration(def)) return this.def_uses[i];
        }
        return null;
    },
    definition: function(name) {
        for (var i = this.def_uses.length - 1; i >= 0; i--) {
            var def = this.def_uses[i][0];
            if (def.name == name) return this.def_uses[i];
        }
        return null;
    },
    lookup_decl: function(name) {
        var chain = this.declaration(name);
        if (!chain && this.parent) {
            return this.parent.lookup_decl(name);
        }
        return chain;
    },
    lookup_def: function(name) {
        var chain = this.definition(name);
        if (!chain && this.parent) {
            return this.parent.lookup_def(name);
        }
        return chain;
    },
    define: function(varnode) {
        if (!this.isDeclaration(varnode)) {
            var decl = this.lookup_decl(varnode.name);
            if (!decl) this.global_defs.push(varnode);
        }
        this.def_uses.push([varnode]);
    },
    use: function(varnode) {
        var chain = this.lookup_def(varnode.name);
        if (chain) {
            chain.push(varnode);
        }
        if (!this.lookup_decl(varnode.name)) {
            this.global_uses.push(varnode);
        }
    },
    allGlobalUses: function() {
        return [].concat(this.global_uses)
                 .concat(this.scopes.invoke('allGlobalUses').flatten());
    },
    allGlobalDefs: function() {
        var res = [];
        res.pushAll(this.global_defs);
        this.scopes.each(function(s) {
            res.pushAll(s.allGlobalDefs());
        });
        return res;
    }
});

Object.subclass('lively.ast.VariableAnalyzer',
'helping', {
    parse: function(source) {
        var ast = lively.ast.Parser.parse(source, 'topLevel');
        if (!ast || Object.isString(ast)) {
          throw new Error("cannot parse " + source);
        }
        return ast;
    },
    findGlobalVariablesInAST: function(ast) {
        var analyzer = new lively.ast.DFAVisitor();
        analyzer.analyze(ast);
        return analyzer.globalVariables();
    },
    findGlobalVariablesIn: function(source) {
        return this.findGlobalVariablesInAST(this.parse(source));
    }
});

});
