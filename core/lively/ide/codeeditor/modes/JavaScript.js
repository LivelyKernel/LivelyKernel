module('lively.ide.codeeditor.modes.JavaScript').requires('lively.ide.codeeditor.ace', 'lively.ast.acorn').toRun(function() {

var jsMode = lively.ide.ace.require('ace/mode/javascript').Mode

jsMode.addMethods({

    morphMenuItems: function(items, editor) {
        var mode = this,
            s = editor.getSession(),
            cmds = lively.ide.commands.getCommands({editor: editor}),
            settingsIndex = items;

        items.push({isMenuItem: true, isDivider: true});
        items.push(editor.menuItemForCommand('property completion', cmds['list protocol']));
        items.push(editor.menuItemForCommand('inspect', cmds['doInspect']));
        items.push(editor.menuItemForCommand('printit', cmds['printit']));
        items.push(editor.menuItemForCommand('doit', cmds['doit']));

        var jsItems = [
          ["open AST editor", function() { lively.ide.commands.exec("lively.ide.openASTEditor", editor); }]
        ];

        var acceptedIdentifierTokens = ["variable.parameter", "identifier", "entity.name.function"],
            tokensAtCursor = [editor.tokenAtPoint(), editor.tokenAfterPoint()].compact(),
            cursorOverIdentifier = tokensAtCursor.any(function(t) { return acceptedIdentifierTokens.include(t.type) });

        if (cursorOverIdentifier) {
          items.push(["jump to definition (Alt-.)", function() { editor.aceEditor.execCommand("selectDefinition"); editor.focus(); }]);
          items.push(["select all occurrences in scope (Ctrl-Shift-')", function() { editor.aceEditor.execCommand("selectSymbolReferenceOrDeclaration"); editor.focus(); }]);
        }

        items.push(['more...', jsItems]);

        if (lively.Config.evalMarkersEnabled && module("lively.ide.codeeditor.EvalMarker").isLoaded()) {
          items.push(['eval marker...', lively.morphic.CodeEditorEvalMarker.menuItemsFor(editor)]);
        }

        return items;
    },

    getCodeNavigator: function() {
      return new lively.ide.codeeditor.modes.JavaScript.Navigator();
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Object.subclass('lively.ide.codeeditor.modes.JavaScript.Navigator',
'helper', {
    ensureAST: function(astOrSource) {
        return Object.isString(astOrSource) ? lively.ast.fuzzyParse(astOrSource) : astOrSource;
    },

    move: function(selector, ed) {
      var select = ed.emacsMark && ed.emacsMark(),
          codeEditor = ed.$morph,
          sel = codeEditor.getSelection(),
          pos = sel.lead,
          idx = codeEditor.positionToIndex(pos),
          newIdx = this[selector](codeEditor.textString, idx),
          newPos = codeEditor.indexToPosition(newIdx),
          isBackward = sel.isBackwards(),
          range = sel.getRange();
      range[isBackward ? "setStart" : "setEnd"](newPos.row, newPos.column);
      if (!select) range[isBackward ? "setEnd" : "setStart"](newPos.row, newPos.column);
      sel.setRange(range, isBackward);
      ed.renderer.scrollCursorIntoView();
    }

},
'movement', {
    forwardSexp: function(ed) { this.move("_forwardSexp", ed); },
    backwardSexp: function(ed) { this.move("_backwardSexp", ed); },
    backwardUpSexp: function(ed) { this.move("_backwardUpSexp", ed); },
    forwardDownSexp: function(ed) { this.move("_forwardDownSexp", ed); },

    _forwardSexp: function(src, pos) {
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

    _backwardSexp: function(src, pos) {
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

    _backwardUpSexp: function(src, pos) {
        var ast = this.ensureAST(src),
            nodes = acorn.walk.findNodesIncluding(ast, pos),
            containingNode = nodes.reverse().detect(function(n) { return n.start !== pos; });
        return containingNode ? containingNode.start : pos;
    },

    _forwardDownSexp: function(src, pos) {
        var ast = this.ensureAST(src),
            found = acorn.walk.findNodeAfter(ast, pos, function(type, node) { return node.start > pos; });
        return found ? found.node.start : pos;
    }
},
'selection', {
    markDefun: function(ed) {
      var range = this.rangeForFunctionOrDefinition(
        ed.getValue(), ed.$morph.getSelectionRange());
      if (range) ed.execCommand('expandRegion', {start: range[0], end: range[1]});
    },

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
},
'expansion', {

    expandRegion: function(ed, src, ast, expandState) {
        // use token if no selection
        var hasSelection = expandState.range[0] !== expandState.range[1],
            p = ed.session.doc.indexToPosition(expandState.range[0]),
            token = ed.session.getTokenAt(p.row, p.column);

        if (!hasSelection && token && ["keyword", "identifier"].include(token.type)) {
          return expandOnToken(token)
        }

        ast = ast || (new lively.ide.codeeditor.modes.JavaScript.Navigator()).ensureAST(src);
        var pos = expandState.range[0],
            nodes = lively.ast.query.nodesAtIndex(ast, pos),
            containingNode = nodes.reverse().find(function(node) {
                return node.start < expandState.range[0]
                    || node.end > expandState.range[1]; });

        if (!containingNode) return expandState;

        var start = containingNode.start,
            end = containingNode.end;

        if (containingNode.type === "Literal" && (containingNode.raw || "").match(/^['"`]/)
         && (expandState.range[0] !== containingNode.start && expandState.range[1] !== containingNode.end)
         && (containingNode.start+1 < expandState.range[0]
          || containingNode.end-1 > expandState.range[1])) {
          return {range: [start+1, end-1],prev: expandState}
        }

        return {range: [start, end],prev: expandState}

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function expandOnToken(t) {
          var tokenPos = tokenPosition(t || token);
          return {range: [tokenPos.tokenStart, tokenPos.tokenEnd], prev: expandState}
        }

        function tokenPosition() {
          var offset = posToIdx({column: 0, row: p.row});
          return {
            tokenStart: offset + token.start,
            tokenEnd: offset + token.start + token.value.length
          }
        }

        function posToIdx(pos) { return ed.session.doc.positionToIndex(pos); }
        function idxToPos(idx) { return ed.session.doc.indexToPosition(idx); }
    },

    contractRegion: function(ed, src, ast, expandState) {
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
        var options = {withComments: true, allowReturnOutsideFunction: true};
        options.type = session.$astType;
        return lively.ast.fuzzyParse(src, options);
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
