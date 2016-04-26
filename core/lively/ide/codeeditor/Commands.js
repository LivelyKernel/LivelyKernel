module('lively.ide.codeeditor.Commands').requires().toRun(function() {

var JavaScriptCommandHelper = {

  withIdentifierAtPointOrSelection: function(codeEditorMorph) {
      var ast = codeEditorMorph.withASTDo(function(ast) { return ast; })
             || lively.ast.parse(codeEditorMorph.textString, {}),
          token = codeEditorMorph.tokenAfterPoint();
      var identfierTypes = ["identifier", "entity.name.function", "variable.parameter"];
      if (token && !identfierTypes.include(token.type)) token = codeEditorMorph.tokenAtPoint();
      if (token && !identfierTypes.include(token.type)) token = null;

      var refName = codeEditorMorph.getSelection().isEmpty() ?
        token && token.value : codeEditorMorph.getTextRange();
      return {ast: ast, name: refName}
  }

}

var JavaScriptCommands = {

  selectDefinition: {
    readOnly: true,
    bindKey: {win: "Alt-.", mac: "Alt-."},
    exec: function(ed, options) {
      var args = (options && options.args) || null,
          codeEditor = ed.$morph,
          idInfo = JavaScriptCommandHelper.withIdentifierAtPointOrSelection(codeEditor);

      if (!idInfo.name) { show("No symbol identifier selected"); return; }

      var pos = codeEditor.getCursorPositionAce(),
          cursorIndex = codeEditor.positionToIndex(pos),
          declIdNode = lively.ast.query.findDeclarationClosestToIndex(idInfo.ast, idInfo.name, cursorIndex);
      if (!declIdNode) return;
      ed.pushEmacsMark && ed.pushEmacsMark(pos, false);
      if (declIdNode) {
        codeEditor.setSelectionRange(declIdNode.start, declIdNode.end);
        ed.renderer.scrollSelectionIntoView();
      }
    }
  },

  selectSymbolReferenceOrDeclarationNext: {
    readOnly: true, exec: function(ed) { ed.execCommand('selectSymbolReferenceOrDeclaration', {args: 'next'}); }
  },

  selectSymbolReferenceOrDeclarationPrev: {
    readOnly: true, exec: function(ed) { ed.execCommand('selectSymbolReferenceOrDeclaration', {args: 'prev'}); }
  },

  selectSymbolReferenceOrDeclaration: {
    readOnly: true,
    exec: function(ed, options) {
      // finds the name of the currently selected symbol and will use the JS
      // ast to select references and declarations whose name matches the symbol
      // in the current scope
      // 1. get the token / identifier info of what is currently selected
      var args = (options && options.args) || null,
          codeEditor = ed.$morph,
          idInfo = JavaScriptCommandHelper.withIdentifierAtPointOrSelection(codeEditor);
    
      if (!idInfo.name) { show("No symbol identifier selected"); return; }
    
      // 2. find reference and declaration nodes of the selected token / identifier
      var cursorPos = codeEditor.getCursorPositionAce(),
          cursorindex = codeEditor.positionToIndex(cursorPos),
          scope = lively.ast.query.scopeAtIndex(idInfo.ast, cursorindex),
          refs = lively.ast.query.findReferencesAndDeclsInScope(scope, idInfo.name);

      // 3. map the AST ref / decl nodes to actual text ranges
      var Range = lively.ide.ace.require('ace/range').Range,
          sel = codeEditor.getSelection(),
          // selectionRanges = sel.getAllRanges(),
          ranges = refs
          .map(function(ref) {
            return Range.fromPoints(
              codeEditor.indexToPosition(ref.start),
              codeEditor.indexToPosition(ref.end)); })
          // .filter(function(range) { // only those ranges currently NOT selected
          //   return selectionRanges.every(function(selRange) {
          //     return !selRange.isEqual(range); }); });
    
      if (!ranges.length) return;
    
      // do we want to select all ranges or jsut the next/prev one? 
      if (args === 'next' || args === 'prev') {
        var currentRangeIdx = ranges.map(String).indexOf(String(sel.getRange()));
        if (currentRangeIdx === -1 && ranges.length) ranges = [ranges[0]];
        else {
          var nextIdx = currentRangeIdx + (args === 'next' ? 1 : -1);
          if (nextIdx < 0) nextIdx = ranges.length-1;
          else if (nextIdx >= ranges.length) nextIdx = 0;
          ranges = [ranges[nextIdx]];
        }
      } /*else: select all ranges*/
    
      // do the actual selection
      ranges.forEach(sel.addRange.bind(sel));
    
    }
  },

  prettyPrintJS: {
    readOnly: false,
    exec: function(ed, options) {
      var selectedCode = ed.$morph.getSelectionOrLineString();
      module("lively.ide.CommandLineInterface").load()
        .then(() =>
          new Promise((resolve, reject) =>
            lively.shell.run("js-beautify -f -", {stdin: selectedCode},
              (err, cmd) => err ? reject(err) : resolve(cmd.getStdout()))))
        .then(prettyPrinted => {
          var range = ed.$morph.getSelectionRangeAce();
          ed.$morph.replace(range, prettyPrinted)
        })
        .catch(err => ed.$morph.showError(err));
      
    }
  }

};

Object.extend(lively.ide.codeeditor.Commands, {

  allCommands: function() {
    return lively.lang.obj.merge({}, JavaScriptCommands);
  },

  attach: function(codeEditorMorph) {
    var cmds = lively.ide.codeeditor.Commands.allCommands();
    codeEditorMorph.withAceDo(function(ed) {
      ed.commands.addCommands(cmds); });
  }

});

}) // end of module
