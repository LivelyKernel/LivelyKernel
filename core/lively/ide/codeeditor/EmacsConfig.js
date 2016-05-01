module('lively.ide.codeeditor.EmacsConfig').requires().toRun(function() {

Object.extend(lively.ide.codeeditor.EmacsConfig, {

  enable: function(editor, thenDo) {
    var hasEmacs = editor.keyBinding.$handlers.some(function(ea) { return !!ea.isEmacs; });
    if (hasEmacs) return;

    editor.session.$useEmacsStyleLineStart = false;

    ace.config.loadModule(["keybinding", 'ace/keyboard/emacs'], function(emacsKeys) {
      editor.keyBinding.addKeyboardHandler(emacsKeys.handler);
    });    
  },
  
  disable: function(editor, thenDo) {
    var handler = editor.keyBinding.$handlers.detect(function(ea) { return !!ea.isEmacs; });
    if (!handler) return;

    editor.keyBinding.setKeyboardHandler(editor.commands);
    // lively.ide.CodeEditor.KeyboardShortcuts.defaultInstance().attach(_codeEditor);
  }

});

(function loadEmacsHandler() {
  // ace.require('ace/keyboard/emacs').handler
  ace.config.loadModule(["keybinding", 'ace/keyboard/emacs'], function(emacsKeys) {
    var handler = emacsKeys.handler;
    handler.platform = UserAgent.isLinux || UserAgent.isWindows ? 'win' : 'mac';
    setupEmacsSpecificCommands(handler)
  });
})();

function setupEmacsSpecificCommands(kbd) {

  // we have our own alt-x
  delete kbd.commandKeyBinding['m-x'];

  // ------------------
  // key command setup
  // ------------------
  kbd.addCommands([{
      name: 'markword',
      exec: function(ed) {
          var sel = ed.selection;
          var range = sel.getRange();
          ed.moveCursorToPosition(range.end);
          sel.moveCursorWordRight();
          range.setEnd(sel.lead.row, sel.lead.column);
          // sel.selectToPosition(range.start);
          sel.setRange(range, true);
          // sel.setRange(ace.require('ace/range').Range.fromPoints(range.start, sel.lead), true);
      },
      multiSelectAction: 'forEach',
      readOnly: false
  }, {
      name: 'jumpToMark',
      exec: function(ed) {
          var sel = ed.selection;
          var p = sel.isEmpty() ? ed.getLastEmacsMark() : sel.anchor;
          p && ed.moveCursorToPosition(p);
      },
      readOnly: true
  }, {
      name: 'pushMark',
      exec: function(ed) {
          ed.pushEmacsMark(ed.getCursorPosition());
      },
      readOnly: true
  }, {
     name: "dividercomment",
     exec: function(editor) {
         editor.insert("-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-");
         editor.toggleCommentLines();
      }
  }, {
      name: "toogleSCBSizing",
      exec: function(ed) {
          // hack: get currently active system browser and do "run test command"
          var win = $world.getActiveWindow(),
              focus = $world.focusedMorph(),
              browser = win && win.targetMorph && win.targetMorph.ownerWidget;
          // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
          // FIXME
          if (focus.owner && focus.owner.name === "ObjectInspector") {
              var div = focus.owner.submorphs.grep('divider').first();
              if (!div) return;
              var ratio = div.getRelativeDivide(),
                  newRatio = ratio <= 0.35 ? 0.7 : 0.35;
              div.divideRelativeToParent(newRatio);
              return;
          }
          // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
          if (!browser || !browser.isSystemBrowser) {
              alert('Currently not in a SCB!'); return; }
          var div = win.targetMorph.midResizer,
              ratio = div.getRelativeDivide(),
              newRatio = ratio <= 0.2 ? 0.45 : 0.2;
          div.divideRelativeToParent(newRatio);
      }
  }, {
      name: 'fixTextScale',
      exec: function(ed, args) {
          var m = codeEditor();
          m.setScale(1/m.world().getScale());
          var ext = m.origExtent || (m.origExtent = m.getExtent());
          m.setExtent(ext.scaleBy(m.world().getScale()));
      },
      handlesCount: true
  },
  // todo
  {
      name: "toggleTodoMarker",
      exec: function(ed) {
          var range = ed.session.selection.getRange();
          if (range.isEmpty()) {
              ed.$morph.selectCurrentLine();
              range = ed.session.selection.getRange();
          }
          var text = ed.session.getTextRange(range),
              undoneRe = /\[\s*\]/g,
              doneRe = /\[X\]/g,
              replacement = text;
          if (undoneRe.test(text)) {
              replacement = text.replace(undoneRe, '[X]');
          } else if (doneRe.test(text)) {
              replacement = text.replace(doneRe, '[ ]');
          } else { return; }
          ed.session.replace(range, replacement);
      }
  }, {
      name: "addOrRemoveTodoMarker",
      exec: function(ed) {
          ed.$morph.selectCurrentLine();
          var range = ed.session.selection.getRange(),
              text = ed.session.getTextRange(range),
              todoInFrontRe = /^(\s*)\[.?\]\s*(.*)/,
              replacement = text;
          if (todoInFrontRe.test(text)) {
              replacement = text.replace(todoInFrontRe, '$1$2');
          } else {
              replacement = text.replace(todoInFrontRe = /^(\s*)(.*)/, '$1[ ] $2');
          }
          ed.session.replace(range, replacement);
      }
  },
  // commandline
  {
      name: 'returnorcommandlineinput',
      exec: function(ed) {
          if (!codeEditor().isCommandLine) { ed.insert("\n"); return; }
          codeEditor().commandLineInput && codeEditor().commandLineInput(ed.getValue());
      }
  }]);

  var shiftCmdPrefix = kbd.platform === 'mac' ? 'S-CMD-' : 'S-C-',
      cmdLPrefix = shiftCmdPrefix + 'l ';
  function bind(keys, command) { var binding = {}; binding[keys] = command; return binding; };

  kbd.bindKeys({"C-_": 'undo'});
  kbd.bindKeys({"C-S--": 'undo'});
  kbd.bindKeys({"C-x u": 'undo'});
  kbd.bindKeys({"C-x C-s": 'doSave'});

  kbd.bindKeys({"C-Up": 'gotoPrevParagraph'});
  kbd.bindKeys({"C-Down": 'gotoNextParagraph'});

  kbd.bindKeys({"M-g": 'null'});
  kbd.bindKeys({"M-g g": 'gotoline'});
  kbd.bindKeys({"M-g n": 'gotoNextErrorOrWarning'});
  kbd.bindKeys({"M-g p": 'gotoPrevErrorOrWarning'});

  kbd.bindKeys({"CMD-2": "pushMark"});
  kbd.bindKeys({"CMD-3": "jumpToMark"});
  kbd.bindKeys({"S-M-2": "markword"});

  kbd.bindKeys({"C-x C-u": "touppercase"});
  kbd.bindKeys({"C-x C-l": "tolowercase"});

  kbd.bindKeys({"C-s-s": "iSearchForSelection"});

  // lines
  kbd.bindKeys({"C-M-P": "addCursorAbove"});
  kbd.bindKeys({"C-M-N": "addCursorBelow"});
  kbd.bindKeys({"C-CMD-Up": "movelinesup"});
  kbd.bindKeys({"C-CMD-P": "movelinesup"});
  kbd.bindKeys({"C-CMD-Down": "movelinesdown"});
  kbd.bindKeys({"C-CMD-N": "movelinesdown"});
  kbd.bindKeys({"C-c j": "joinLineAbove"});
  kbd.bindKeys({"C-c S-j": "joinLineBelow"});
  kbd.bindKeys({'C-c p': "duplicateLine"});
  kbd.bindKeys({'C-c CMD-j': "curlyBlockOneLine"});
  kbd.bindKeys(bind(cmdLPrefix + "c a r", "alignSelection"));

  kbd.bindKeys(bind(cmdLPrefix + "j s s t r", "stringifySelection"));
  kbd.bindKeys(bind(cmdLPrefix + "d i f f", "openDiffer"));
  kbd.bindKeys(bind(cmdLPrefix + "m o d e", "changeTextMode"));

  // SCb
  kbd.bindKeys({'C-c C-t': "runtests"});
  kbd.bindKeys({'S-F6': "toogleSCBSizing"});

  kbd.bindKeys(bind(cmdLPrefix + "l t", "toggleLineWrapping"));

  kbd.bindKeys(bind(cmdLPrefix + "/ d", "dividercomment"));
  kbd.bindKeys(bind(cmdLPrefix + "/ b", "commentBox"));

  // evaluation
  kbd.bindKeys({"C-x C-e": "printit"});
  kbd.bindKeys(bind(cmdLPrefix + "x b", {command: "evalAll", args: {confirm: true}}));
  kbd.bindKeys({"CMD-i": "printInspect"}); // re-apply to be able to use count arg
  kbd.bindKeys({"CMD-g": "doAutoEvalPrintItComments"});

  kbd.bindKeys({"C-c tab": "prettyPrintJS"});

  kbd.bindKeys({"C-h k": "describeKey"});

  kbd.bindKeys({"C-x h": "selectall"});
  kbd.bindKeys({"C-c C-S-,": "selectAllLikeThis"});
  kbd.bindKeys({"CMD-f": 'moveForwardToMatching'});
  kbd.bindKeys({"CMD-b": 'moveBackwardToMatching'});
  // conflict with invoke search...
  // kbd.bindKeys({"S-CMD-f": 'selectToMatchingForward'});
  // kbd.bindKeys({"S-CMD-b": 'selectToMatchingBackward'});

  kbd.bindKeys(bind(cmdLPrefix + "f i x", 'fixTextScale'));

  kbd.bindKeys(bind(cmdLPrefix + "d a t e", 'insertDate'));

  // kbd.bindKeys({"Return": 'returnorcommandlineinput'});

  kbd.bindKeys(bind(cmdLPrefix + "b r o w s e", 'browseURLOrPathInWebBrowser'));
  kbd.bindKeys(bind(cmdLPrefix + "d a t e", 'insertDate'));
  kbd.bindKeys(bind(cmdLPrefix + "o p e n", 'doBrowseAtPointOrRegion'));

  kbd.bindKeys(bind(cmdLPrefix + "s n i p", 'browseSnippets'));
  // kbd.bindKeys(bind("S-CMD-c", 'browseSnippets'));

  kbd.bindKeys({"M-q": 'fitTextToColumn'});
  kbd.bindKeys(bind(cmdLPrefix + "w t", 'cleanupWhitespace'));
  kbd.bindKeys(bind(cmdLPrefix + "x m l p", 'prettyPrintHTMLAndXML'));

  kbd.bindKeys(bind(cmdLPrefix + "t d", 'toggleTodoMarker'));
  kbd.bindKeys(bind(cmdLPrefix + "t n", 'addOrRemoveTodoMarker'));
  kbd.bindKeys(bind("C-x C-k C-i", 'multiSelectCounter'));
  kbd.bindKeys(bind(cmdLPrefix + "c o u n t e r", 'multiSelectCounter'));

  function codeEditor() {
      var focused = lively.morphic.Morph.focusedMorph();
      return focused && focused.isCodeEditor && focused;
  }
  
}

}) // end of module
