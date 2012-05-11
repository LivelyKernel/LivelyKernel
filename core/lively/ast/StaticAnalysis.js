module('lively.ast.StaticAnalysis').requires('lively.ast.Parser').toRun(function() {

lively.ast.Visitor.subclass('lively.ast.DFAVisitor',
'analyzing helper', {
    knownGlobals: ["true", "false", "null", "undefined",
                   "Object", "Function", "String", "Date", "Math", "parseFloat", "isNaN",
                   "eval", "window", "document", "Node",
                   "HTMLCanvasElement", "Image"],
    newScope: function() {
        var s = {
            mapping: {},
            def_uses: {},
            global_uses: [],
            scopes: []
        };
        if (this.current) {
            this.current.scopes.push(s);
            s.parent = this.current;
        }
        this.current = s;
        return s;
    },
},
'analyzing', {

    analyze: function(ast) {
        this.current = null;
        this.root = this.newScope();
        this.visit(ast);
        // this.createChains();
    },

},
'visiting', {
    visitVariable: function(node) {
        if (this.knownGlobals.include(node.name)) return;
        if (node._parent.isFunction) {
            this.current.def_uses.push(node);
        }
    },
    visitVarDeclaration: function(node) {
        this.current.defs.push(node);
        this.visitParts(node, ['val']);
    },
    visitParts: function(node, parts) {
        for (var i = 0; i < parts.length; i++)
            node[parts[i]].accept(this)
    },
    visitSequence: function(node) { node.children.invoke('accept', this) },
    visitArrayLiteral: function(node) { node.elements.invoke('accept', this) },
    visitObjectLiteral: function(node) { node.properties.invoke('accept', this) },
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
    visitSend: function(node) { this.visitParts(node, ['recv']) },
    visitCall: function(node) { this.visitParts(node, ['fn']) },
    visitNew: function(node) { this.visitParts(node, ['clsExpr']) },
    visitThrow: function(node) { this.visitParts(node, ['expr']) },
    visitTryCatchFinally: function(node) { this.visitParts(node, ['trySeq', 'catchSeq', 'finallySeq']) },
    visitFunction: function(node) {
        if (this.topLevel) return;
        var funcScope = this.newScope();
        funcScope.boundVars.pushAll(node.args);
        this.scopes.push(funcScope);
        this.visitParts(node, ['body']);
        this.scopes.pop();
        this.scopes.last().unboundVars.pushAll(funcScope.getUnboundVars());
    },
    visitObjProperty: function(node) { this.visitParts(node, ['property']) },
    visitSwitch: function(node) { this.visitParts(node, ['expr']) },
    visitCase: function(node) { this.visitParts(node, ['condExpr', 'thenExpr']) },
    visitDefault: function(node) { this.visitParts(node, ['defaultExpr']) },
});
Object.subclass('MyClass',
'default category', {
    m1: function() {},
});

}) // end of module