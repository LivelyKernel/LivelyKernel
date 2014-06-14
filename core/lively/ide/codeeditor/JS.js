module('lively.ide.codeeditor.JS').requires('lively.ast.acorn', 'lively.ide.codeeditor.DocumentChange').toRun(function() {

Object.subclass('lively.ide.codeeditor.JS.Navigator',
'parsing', {
    ensureAST: function(astOrSource) {
        return Object.isString(astOrSource) ? lively.ast.acorn.fuzzyParse(astOrSource) : astOrSource;
    }
},
'movement', {
    forwardSexp: function(src, pos) {
        var ast = this.ensureAST(src),
            nodes = acorn.walk.findNodesIncluding(ast, pos),
            containingNode = nodes.reverse().detect(function(n) { return n.end !== pos; });
        if (!containingNode) return pos;
        if (containingNode.type === 'BlockStatement') {
            var sibling = containingNode.body.detect(function(node) { return node.start > pos; });
            if (sibling) return sibling.start;
        }
        return containingNode.end;
    },

    backwardSexp: function(src, pos) {
        var ast = this.ensureAST(src),
            nodes = acorn.walk.findNodesIncluding(ast, pos),
            containingNode = nodes.reverse().detect(function(n) { return n.start !== pos; });
        if (!containingNode) return pos;
        if (containingNode.type === 'BlockStatement') {
            var sibling = containingNode.body.clone().reverse().detect(function(node) { return node.end < pos; });
            if (sibling) return sibling.end;
        }
        return containingNode ? containingNode.start : pos;
    },

    backwardUpSexp: function(src, pos) {
        var ast = this.ensureAST(src),
            nodes = acorn.walk.findNodesIncluding(ast, pos),
            containingNode = nodes.reverse().detect(function(n) { return n.start !== pos; });
        return containingNode ? containingNode.start : pos;
    },

    forwardDownSexp: function(src, pos) {
        var ast = this.ensureAST(src),
            found = acorn.walk.findNodeAfter(ast, pos, function(type, node) { return node.start > pos; });
        return found ? found.node.start : pos;
    }
},
'selection', {
    rangeForNodesMatching: function(src, pos, func) {
        // if the cursor is at a position that has a containing node matching func
        // return start/end index of that node
        var ast = this.ensureAST(src),
            nodes = acorn.walk.findNodesIncluding(ast, pos),
            containingNode = nodes.reverse().detect(func);
        return containingNode ? [containingNode.start, containingNode.end] : null;
    },

    rangeForFunctionOrDefinition: function(src, currentRange) {
        var isNullSelection = currentRange[0] === currentRange[1];
        return this.rangeForNodesMatching(src, currentRange[1], function(node) {
            var typeOK = ['AssignmentExpression', 'FunctionDeclaration', 'FunctionExpression'].include(node.type);
            if (typeOK &&
                ((isNullSelection && node.end !== currentRange[1])
             || (!isNullSelection && node.start < currentRange[0]))) return true;
            return false;
        });
    }
});

Object.subclass('lively.ide.codeeditor.JS.RangeExpander',
'interface', {
    expandRegion: function(src, ast, expandState) {
        ast = ast || (new lively.ide.codeeditor.JS.Navigator()).ensureAST(src);
        var pos = expandState.range[0],
            nodes = acorn.walk.findNodesIncluding(ast, pos),
            containingNode = nodes.reverse().detect(function(node) {
                return node.start < expandState.range[0] || node.end > expandState.range[1];
            });
        return containingNode ?
            {range: [containingNode.start, containingNode.end], prev: expandState} :
            expandState;
    },

    contractRegion: function(src, ast, expandState) {
        return expandState.prev || expandState;
    }
});

Object.subclass('lively.ide.codeeditor.JS.ScopeAnalyzer',
'AST analyzing', {

    knownGlobals: ["true", "false", "null", "undefined", "arguments",
                   "Object", "Function", "String", "Array", "Date", "Boolean", "Number", "RegExp", 
                   "Error", "EvalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError",
                   "Math", "NaN", "Infinity", "Intl", "JSON",
                   "parseFloat", "parseInt", "isNaN", "isFinite", "eval", "alert",
                   "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", 
                   "window", "document", "console",
                   "Node", "HTMLCanvasElement", "Image", "Class",
                   "Global", "Functions", "Objects", "Strings",
                   "module", "lively", "pt", "rect", "rgb"],

    scopeVisitor: (function() {

        function findJsLintGlobalDeclarations(node) {
            // node.body
            if (!node || !node.comments) return [];
            return node.comments
                .filter(function(ea) { return ea.text.trim().startsWith('global') })
                .map(function(ea) {
                    return ea.text.replace(/^\s*global\s*/, '')
                        .split(',').invoke('trim')
                        .map(function(name) { return {type: 'jsLintGlobal', node: ea, name: name}; });
                }).flatten();
        }

        return acorn.walk.make({
            Identifier: function(node, scope, c) {
                scope.identifiers.push(node);
            },
            Program: function(node, scope, c) {
                findJsLintGlobalDeclarations(node).forEach(function(g) {
                    scope.vars[g.name] = g; });
                for (var i = 0; i < node.body.length; ++i)
                  c(node.body[i], scope, "Statement");
            },
            Function: function(node, scope, c) {
                var inner = {vars: {}, identifiers: [], containingScopes: []};
                scope && (scope.containingScopes.push(inner));
                for (var i = 0; i < node.params.length; ++i)
                    inner.vars[node.params[i].name] = {type: "argument", node: node.params[i]};
                if (node.id) {
                    var decl = node.type == "FunctionDeclaration";
                    (decl ? scope : inner).vars[node.id.name] =
                        {type: decl ? "function" : "function name", node: node.id};
                }
                findJsLintGlobalDeclarations(node.body).forEach(function(g) {
                    inner.vars[g.name] = g; });
                c(node.body, inner, "ScopeBody");
            },
            TryStatement: function(node, scope, c) {
                c(node.block, scope, "Statement");
                if (node.handler) {
                    var inner = {vars: {}, identifiers: [], containingScopes: []};
                    scope && (scope.containingScopes.push(inner));
                    inner.vars[node.handler.param.name] = {type: "catch clause", node: node.handler.param};
                    c(node.handler.body, inner, "ScopeBody");
                }
                if (node.finalizer) c(node.finalizer, scope, "Statement");
            },
            VariableDeclaration: function(node, scope, c) {
                for (var i = 0; i < node.declarations.length; ++i) {
                    var decl = node.declarations[i];
                    scope.vars[decl.id.name] = {type: "var", node: decl.id};
                    if (decl.init) c(decl.init, scope, "Expression");
                }
            }
        })
    })(),

    findGlobalVarReferences: function(src) {
        var ast = Object.isString(src) ? null : src,
            rootScope = {vars: {}, identifiers: [], containingScopes: []};
        if (!ast) {
            try { ast = lively.ast.acorn.parse(src, {withComments: true});
            } catch(e) { ast = e; }
        }
        if (ast instanceof Error) return [];
        try {
            acorn.walk.recursive(ast, rootScope, this.scopeVisitor);
        } catch (e) {
            show('ast scope analyzation error: ' + e + '\n' + e.stack);
            return [];
        }
        return this.findGlobalVarReferencesIn(rootScope);
    },

    findGlobalVarReferencesIn: function(scope, declaredVarNames) {
        declaredVarNames = (declaredVarNames || []).concat(Object.keys(scope.vars));
        var globals = scope.identifiers.reject(function(identifier) {
            return this.knownGlobals.include(identifier.name) || declaredVarNames.include(identifier.name);
        }, this);
        var result = scope.containingScopes.inject(globals, function(globals, scope) {
            return globals.concat(this.findGlobalVarReferencesIn(scope, declaredVarNames));
        }, this).uniq();
        return result;
    }

});

// Used as a plugin for the lively.ide.CodeEditor.DocumentChangeHandler, will
// trigger attach/detach actions for modes that require those
lively.ide.codeeditor.ModeChangeHandler.subclass('lively.ide.codeeditor.JS.ChangeHandler',
"settings", {
    targetMode: "ace/mode/javascript"
},
"initializing", {
    initialize: function() {
        this.scopeAnalyzer = new lively.ide.codeeditor.JS.ScopeAnalyzer();
    }
},
"parsing", {
    parse: function(src, session) {
        var options = {withComments: true};
        options.type = session.$astType;
        return lively.ast.acorn.fuzzyParse(src, options);
    }
},
'rendering', {
    onDocumentChange: function(evt) {
        this.updateAST(evt)
    },

    updateAST: function(evt) {
        var codeEditor = evt.codeEditor,
            session = evt.session,
            src = evt.codeEditor.textString,
            ast;
        // 1. parse
        try {
            ast = session.$ast = this.parse(src, session);
        } catch(e) {
            ast = session.$ast = e;
        }

        // 2. update lively codemarker
        var marker = this.ensureLivelyCodeMarker(session);
        marker.modeId = this.targetMode;
        marker.markerRanges.length = 0;
        if (this.scopeAnalyzer && codeEditor.getShowWarnings()) {
            marker.markerRanges.pushAll(
                this.scopeAnalyzer.findGlobalVarReferences(ast).map(function(ea) {
                    ea.cssClassName = "ace-global-var"; return ea; }));
        }
        if (ast.parseError && codeEditor.getShowErrors()) {
            ast.parseError.cssClassName = "ace-syntax-error";
            marker.markerRanges.push(ast.parseError);
        }
        marker.redraw(session);

        // 3. emit session astChange event
        var astChange = {ast: ast, docChange: evt.data, codeEditor: codeEditor};
        session._signal('astChange', astChange);
    }
});

(function registerModeHandler() {
    lively.module('lively.ide.codeeditor.DocumentChange').runWhenLoaded(function() {
        lively.ide.CodeEditor.DocumentChangeHandler.registerModeHandler(lively.ide.codeeditor.JS.ChangeHandler);
    });
})();

}) // end of module
