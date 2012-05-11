module('lively.ast.StaticAnalysis').requires('lively.ast.Parser').toRun(function() {

lively.ast.Visitor.subclass('lively.ast.DFAVisitor',
'analyzing helper', {
    knownGlobals: ["true", "false", "null", "undefined",
                   "Object", "Function", "String", "Date", "Math", "parseFloat", "isNaN",
                   "eval", "window", "document", "Node",
                   "HTMLCanvasElement", "Image"],
    newScope: function() {
        return this.current = this.current
            ? this.current.newScope()
            : new lively.ast.DFAScope();
    },
},
'analyzing', {

    analyze: function(ast) {
        this.current = null;
        this.root = this.newScope();
        this.visit(ast);
    },

    globalVariables: function() {
        return this.root.global_uses;
    },

},
'visiting', {
    visitVariable: function(node) {
        if (this.knownGlobals.include(node.name)) return;
        if (node._parent.isFunction) {
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
    visitTryCatchFinally: function(node) { this.visitParts(node, ['trySeq', 'catchSeq', 'finallySeq']) },
    visitFunction: function(node) {
        var funcScope = this.newScope();
        this.visitParts(node, ['body']);
        this.current = this.current.parent;
    },
    visitObjProperty: function(node) { this.visitParts(node, ['property']) },
    visitSwitch: function(node) { this.visitParts(node, ['expr']) },
    visitCase: function(node) { this.visitParts(node, ['condExpr', 'thenExpr']) },
    visitDefault: function(node) { this.visitParts(node, ['defaultExpr']) },
});
Object.subclass('lively.ast.DFAScope',
'initializing', {
    initialize: function() {
        this.mapping = {};
        this.def_uses = [];
        this.global_uses = [];
        this.scopes = [];
        this.parent = null;
    },
},
'acessing', {
    newScope: function() {
        var s = new lively.ast.DFAScope();
        this.scopes.push(s);
        s.parent = this;
        return s;
    },
    define: function(varnode) {
        var chain = [varnode];
        this.def_uses.push(chain);
        this.mapping[varnode.name] = chain;
    },
    lookup: function(name) {
        var chain = this.mapping[name];
        if (!chain && this.parent) {
            return this.parent.lookup(name);
        }
        return chain;
    },
    use: function(varnode) {
        var chain = this.lookup(varnode.name);
        if (chain) {
            chain.push(varnode);
        } else {
            this.global_uses.push(varnode);
        }
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
    },
});

}) // end of module