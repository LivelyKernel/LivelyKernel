module('lively.ide.codeeditor.modes.JavaScript').requires('lively.ide.codeeditor.ace', 'lively.ast.acorn').toRun(function() {

var jsMode = lively.ide.ace.require('ace/mode/javascript').Mode

jsMode.addMethods({

    morphMenuItems: function(items, editor) {
        var mode = this,
            livelyREvaluateEnabled = mode.livelyEvalMethod === 'lively-R-evaluate',
            s = editor.getSession();
        items.push(['js',
            [["open AST editor",
             function() {
                 lively.ide.commands.exec("lively.ide.openASTEditor", editor);
             }]]]);
        return items;
    }

});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


Object.subclass('lively.ide.codeeditor.modes.JavaScript.Navigator',
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

Object.subclass('lively.ide.codeeditor.modes.JavaScript.RangeExpander',
'interface', {
    expandRegion: function(src, ast, expandState) {
        ast = ast || (new lively.ide.codeeditor.modes.JavaScript.Navigator()).ensureAST(src);
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

// Used as a plugin for the lively.ide.CodeEditor.DocumentChangeHandler, will
// trigger attach/detach actions for modes that require those
lively.ide.codeeditor.ModeChangeHandler.subclass('lively.ide.codeeditor.modes.JavaScript.ChangeHandler',
"settings", {
    targetMode: "ace/mode/javascript"
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
        } catch(e) { ast = session.$ast = e; }

        // 2. update lively codemarker
        var marker = this.ensureLivelyCodeMarker(session);
        marker.modeId = this.targetMode;
        marker.markerRanges.length = 0;

        if (codeEditor.getShowWarnings()) {
            marker.markerRanges.pushAll(
                lively.ast.query.findGlobalVarRefs(ast, {jslintGlobalComment: true}).map(function(ea) {
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
        lively.ide.CodeEditor.DocumentChangeHandler.registerModeHandler(lively.ide.codeeditor.modes.JavaScript.ChangeHandler);
    });
})();

}) // end of module
