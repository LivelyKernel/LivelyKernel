module('lively.ide.codeeditor.modes.Diff').requires('lively.ide.codeeditor.ace', 'lively.ide.git.Interface').toRun(function() {

var git = lively.ide.git.Interface;
var Mode = lively.ide.ace.require('ace/mode/diff').Mode;

// forwardSexp
// backwardSexp
// backwardUpSexp
// forwardDownSexp
// markDefun
// expandRegion
// contractRegion

var Navigator = {

    isInPatchHeader: function(ed, pos) {
      var line = ed.session.getLine(pos.row);
      return !!line.match(/^(diff|index|---|\+\+\_)/);
    },

    findAny: function(ed, needles, backwards, startPos) {
      var merge = lively.lang.obj.merge;
      var opts = {wrap: false, preventScroll: true, backwards: backwards};
      var range = ed.saveExcursion(function(reset) {
        if (startPos) {
          ed.clearSelection();
          ed.moveCursorToPosition(startPos);
        }
        ed.selection.moveCursorLineEnd();
        var range;
        needles.detect(function(needle) {
          return range = ed.$morph.find(merge(opts, {needle: needle}));
        });
        reset();
        return range;
      });
      return range ? range.start : null;
    },
    
    findPatchStart: function(ed, startPos) { return this.findAny(ed, [/^diff --git/, /^index/, /^---/, /^\s*$/], true, startPos); },
    findPatchEnd: function(ed, startPos) {
      if (this.isInPatchHeader(ed, startPos)) {
        var patchStart = this.findAny(ed, [/^@@ /, /^\s*$/], false, startPos);
        startPos = patchStart || startPos
      }
      return this.findAny(ed, [/^diff --git/, /^index/, /^---/, /^\+\+\+/, /^\s*$/], false, patchStart);
    },
    findHunkStart: function(ed, startPos) {  return this.findAny(ed, [/^@@ /], true, startPos); },
    findHunkEnd: function(ed, startPos) {
      startPos = startPos || ed.getCursorPosition();
      var hunkEnd = this.findAny(ed, [/^@@ /], false, startPos);
      var patchEnd = this.findPatchEnd(ed, startPos);
      if (!hunkEnd) return patchEnd;
      if (!patchEnd) return hunkEnd;
      return hunkEnd.row < patchEnd.row ? hunkEnd : patchEnd;
    },

    backwardSexp: function(ed) {
      // nav = Navigator
      var nav = this,
          pos = ed.getCursorPosition(),
          hunkStart = nav.findHunkStart(ed),
          patchStart = nav.findPatchStart(ed);
      if (lively.lang.obj.equals(pos, hunkStart)) {
        ed.saveExcursion(function(reset) { ed.selection.moveCursorLeft(); hunkStart = nav.findHunkStart(ed); reset(); });
        if (lively.lang.obj.equals(pos, hunkStart)) hunkStart = null;
      }
      if (lively.lang.obj.equals(pos, patchStart)) {
        ed.saveExcursion(function(reset) { ed.selection.moveCursorLeft(); patchStart = nav.findPatchStart(ed); reset(); });
        if (lively.lang.obj.equals(pos, patchStart)) patchStart = null;
      }
      if (!hunkStart && !patchStart) return;
      var target;
      if (!hunkStart) target = patchStart;
      else if (!patchStart) target = hunkStart;
      else if (hunkStart.row > patchStart.row) target = hunkStart
      else target = patchStart;
      ed.moveCursorToPosition(target);
      ed.renderer.scrollCursorIntoView();      
    },

    forwardSexp: function(ed) {
      // nav = Navigator
      // ed = that.aceEditor
      var nav = this,
          pos = ed.getCursorPosition(),
          hunkEnd = nav.findHunkEnd(ed);
      if (lively.lang.obj.equals(pos, hunkEnd)) {
        ed.saveExcursion(function(reset) { ed.selection.moveCursorRight(); hunkEnd = nav.findHunkEnd(ed); reset(); });
        if (lively.lang.obj.equals(pos, hunkEnd)) hunkEnd = null;
      }
      if (!hunkEnd) return;
      ed.moveCursorToPosition(hunkEnd);
      ed.renderer.scrollCursorIntoView();      
    },

    backwardUpSexp: function(ed) {
      // nav = Navigator
      var nav = this,
          pos = ed.getCursorPosition(),
          patchStart = nav.findPatchStart(ed);
      if (!patchStart) return;
      ed.moveCursorToPosition(patchStart);
      ed.renderer.scrollCursorIntoView();      
    },

    forwardDownSexp: function(ed) { show("Not yet implemented"); },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // expansion
    
    findContainingHunkOrPatchRange: function(ed, startingRange) {
      startingRange = startingRange || ed.getSelectionRange();

      var newRange;
      var Range = lively.ide.ace.require("ace/range").Range;
      var hunkStart = this.findHunkStart(ed, startingRange.end);
      var hunkEnd = hunkStart && this.findHunkEnd(ed, hunkStart);
      var patchStart = this.findPatchStart(ed, startingRange.start);
      var patchEnd = patchStart && this.findPatchEnd(ed, patchStart);

      // patchStart && patchEnd && show("%o %o", patchStart.row, patchEnd.row);
      // hunkStart && hunkEnd && show("%o %o", hunkStart.row, hunkEnd.row);

      if (patchStart && patchEnd && startingRange.start.row == patchStart.row && startingRange.end.row == patchEnd.row)
        return null;
      if (hunkEnd && patchEnd && hunkEnd.row >= patchEnd.row && startingRange.start.row <= hunkStart.row)
        hunkEnd = null;

      if (hunkStart &&  hunkStart.row < patchStart.row) hunkStart = null;
      // if (hunkEnd.row < patchEnd.row) hunkEnd = null;

      if (!startingRange || (hunkStart && hunkEnd && startingRange.start.row >= hunkStart.row && startingRange.end.row <= hunkEnd.row)) {
        // show("1");
        newRange = Range.fromPoints(hunkStart, hunkEnd);
      } else if (patchStart && patchEnd && startingRange.start.row >= patchStart.row && startingRange.end.row <= patchEnd.row) {
        // show("2");
        newRange = Range.fromPoints(patchStart, patchEnd);
      } else {
        // show("3");
        newRange = null;
      }
      return newRange;
    },

    expandRegion: function(ed, src, ast, expandState) {

      var newRange = this.findContainingHunkOrPatchRange(ed, ed.getSelectionRange());
      if (!newRange) return expandState;

      return {
          range: [
            ed.posToIdx(newRange.start),
            ed.posToIdx(newRange.end)],
          prev: expandState
      }
      
      var startIdx = expandState.range[0];
      var endIdx = expandState.range[1];
      var start = ed.idxToPos(startIdx);
      var end = ed.idxToPos(endIdx);
      var newExpandRange = [];

      ed.saveExcursion(function(reset) {
        ed.clearSelection();
        ed.moveCursorToPosition(start);
        this.backwardSexp(ed);
        newExpandRange[0] = ed.posToIdx(ed.getCursorPosition());
        ed.moveCursorToPosition(end);
        this.forwardSexp(ed);
        newExpandRange[1] = ed.posToIdx(ed.getCursorPosition());
        reset();
      }.bind(this));

      if (startIdx === endIdx) {
        // ...
      } else {
        if (newExpandRange[0] < startIdx) newExpandRange[1] = endIdx;
        else if (newExpandRange[1] > endIdx) newExpandRange[0] = startIdx;
        else return expandState;
      }

      return {
          range: newExpandRange,
          prev: expandState
      }

    },

    contractRegion: function(ed, src, ast, expandState) {
        return expandState.prev || expandState;
    }

};

lively.ide.codeeditor.modes.Diff.Navigator = Navigator;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Mode.addMethods({

    getCodeNavigator: function() {
      return Navigator;
    },

    commands: {

        "lively.ide.patch.showSelectedPatch": {
          exec: function(ed) {
              var mode = ed.session.getMode(),
                  hasSelection = !ed.selection.isEmpty(),
                  patches;
  
              if (!hasSelection) {
                var patchInfo = mode.getPatchAtCursor(ed);
                patches = patchInfo.patch ? [patchInfo.patch] : null;
              } else {
                patches = mode.getPatchFromSelection(ed);
              }
  
              if (!patches || !patches.length) {
                ed.$morph.setStatusMessage("Cannot read patch");
              } else {
                var patchString = patches.invoke("createPatchString").join("\n");
                $world.addCodeEditor({
                  title: "patches for " + patches.pluck("fileNameA").join(", "),
                  textMode: "diff",
                  content: patchString,
                  extent: pt(700, 400)
                }).getWindow().comeForward();
              }
          }
        },

        "lively.ide.patch.openFileAtCursor": {
          exec: function(ed) {
              var patchInfo = ed.session.getMode().getPatchAtCursor(ed);
              if (!patchInfo || !patchInfo.selectedHunk) {
                ed.$morph.setStatusMessage("Cannot read patch");
                return;
              }
  
              var lineNo = patchInfo.selectedHunk.relativeOffsetToFileLine(patchInfo.cursorOffsetInHunk);
              var filePath = patchInfo.selectedHunk.fileNameB;
              if (!filePath.match(/^(\/|[a-z]:\\)/i)) { // not an absolute path
                filePath = lively.lang.string.joinPath(lively.shell.cwd(), filePath);
              }
              lively.ide.openFile(filePath + ":" + lineNo);
          }
        },

        "lively.ide.git.stageSelection": {
            exec: function(ed, args) { ed.session.getMode().patchApplySelection(ed, "stage", args, args && args.thenDo); }
        },

        "lively.ide.git.unstageSelection": {
            exec: function(ed, args) { ed.session.getMode().patchApplySelection(ed, "unstage", args, args && args.thenDo); }
        },

        "lively.ide.git.discardSelection": {
            exec: function(ed, args) { ed.session.getMode().patchApplySelection(ed, "discard", args, args && args.thenDo); }
        },

        "lively.ide.git.reverseApplySelection": {
            exec: function(ed, args) { ed.session.getMode().patchApplySelection(ed, "reverseApply", args, args && args.thenDo); }
        },

        "lively.ide.git.applySelection": {
            exec: function(ed, args) { ed.session.getMode().patchApplySelection(ed, "apply", args, args && args.thenDo); }
        },

        "lively.ide.git.stageAll": {
            exec: function(ed, args) { ed.session.getMode().stageOrUnstagedOrDiscardAll(ed, "stage", args, args && args.thenDo); }
        },

        "lively.ide.git.unstageAll": {
            exec: function(ed, args) { ed.session.getMode().stageOrUnstagedOrDiscardAll(ed, "unstage", args, args && args.thenDo); }
        },

        "lively.ide.git.discardAll": {
            exec: function(ed, args) { ed.session.getMode().stageOrUnstagedOrDiscardAll(ed, "discard", args, args && args.thenDo); }
        }
    },

    keybindings: {
        "lively.ide.patch.openFileAtCursor":    "alt-o",
        "lively.ide.patch.showSelectedPatch":   "alt-p",
        "lively.ide.git.stageSelection":        "alt-s",
        "lively.ide.git.stageAll":              "alt-shift-s",
        "lively.ide.git.unstageSelection":      "alt-u",
        "lively.ide.git.unstageAll":            "alt-shift-u",
        "lively.ide.git.discardSelection":      "alt-k",
        "lively.ide.git.discardAll":            "alt-shift-k",
        "lively.ide.git.applySelection":        "alt-a",
        "lively.ide.git.reverseApplySelection": "alt-r"
    },

    keyhandler: null,

    initKeyHandler: function() {
        Properties.forEachOwn(this.keybindings, function(commandName, key) {
            if (this.commands[commandName]) this.commands[commandName].bindKey = key;
        }, this);
        return this.keyhandler = lively.ide.ace.createKeyHandler({
            keyBindings: this.keybindings,
            commands: this.commands
        });
    },

    attach: function(ed) {
        ed.commands.addCommands(this.commands);
        this.initKeyHandler();
        ed.keyBinding.addKeyboardHandler(this.keyhandler);
    },

    detach: function(ed) {
        ed.commands.removeCommands(this.commands);
        this.keyhandler = null;
        ed.keyBinding.removeKeyboardHandler(this.keyhandler);
    },

    morphMenuItems: function(items, editor) {
        var mode = this;
        var hasSelection = !editor.getSelectionRangeAce().isEmpty();

        items.pushAll([
          {isMenuItem: true, isDivider: true},
          ["open file at patch", function() { editor.aceEditor.execCommand("lively.ide.patch.openFileAtCursor"); }],
          ["show selected patch", function() { editor.aceEditor.execCommand("lively.ide.patch.showSelectedPatch"); }],
          ["stage "   + (hasSelection ? "selection" : "everything"), function() { editor.aceEditor.execCommand("lively.ide.git.stage" + (hasSelection ? "Selection" : "All")); }],
          ["unstage " + (hasSelection ? "selection" : "everything"), function() { editor.aceEditor.execCommand("lively.ide.git.unstage"  + (hasSelection ? "Selection" : "All")); }],
          ["discard " + (hasSelection ? "selection" : "everything"), function() { editor.aceEditor.execCommand("lively.ide.git.discard"  + (hasSelection ? "Selection" : "All")); }],
          ["apply selection",                                        function() { editor.aceEditor.execCommand("lively.ide.diff.applySelection"); }]
          ["reverse apply selection",                                function() { editor.aceEditor.execCommand("lively.ide.diff.reverseApplySelection"); }]
        ]);

        return items;
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    stageOrUnstagedOrDiscardAll: function(ed, action, options, thenDo) {
      options = lively.lang.obj.merge({dryRun: false}, options);

      var mode = ed.session.getMode();
      var files = mode.getAllPatches(ed).pluck("fileNameA");
      var git;

      lively.lang.fun.composeAsync(
        function(n) {
          if (module('lively.ide.git.Interface').isLoaded()) n(null);
          else require('lively.ide.git.Interface').toRun(function() { n(null); });
        },
        function(n) { git = lively.ide.git.Interface; git.fileStatus(n); },
        function(fos, n) {
          var selectedFos = fos.select(function(fo) { return files.include(fo.fileName); });
          git.stageOrUnstageOrDiscardFiles(action, selectedFos, options, n);
        }
      )(function(err, fos, commands) {
        if (err) ed.$morph.showError(err);
        else ed.$morph.setStatusMessage(action.capitalize() + "\n" + fos.pluck("fileName").join("\n"));
        thenDo && thenDo(err, fos, commands);
      });
    },

    patchApplySelection: function(ed, action, options, thenDo) {
      // action = "stage" || "unstage"
      options = lively.lang.obj.merge({dryRun: false}, options);

      lively.lang.fun.composeAsync(
        function(n) {
          if (module('lively.ide.git.Interface').isLoaded()) n(null);
          else require('lively.ide.git.Interface').toRun(function() { n(null); });
        },
        function(n) {
          var git = lively.ide.git.Interface;
          git.gitApplyFromEditor(action, ed.$morph, options, n)
        }
      )(function(err, patches, commands) {
        if (err) ed.$morph.showError(err);
        else ed.$morph.setStatusMessage(action.capitalize() + "\n" + patches.invoke("createPatchString").join("\n"));
        thenDo && thenDo(err, patches, commands);
      });
    },

    getPatchFromSelection: function(ed) {
      var editor = ed.$morph,
          patches = this.getAllPatches(ed);
      if (!patches || !patches.length) return null;

      var range = editor && editor.getSelectionRange(),
          // FIXME what if status of other files differ?
          modifiedPatchString = null,
          startLine = editor.indexToPosition(range[0]).row-1,
          endLine = editor.indexToPosition(range[1]).row-1,
          offset = 0;

      return patches.map(function(ea, i) {
        var patchString = ea.createPatchStringFromRows(startLine-offset, endLine-offset);
        offset += ea.length();
        return patchString ? lively.ide.FilePatch.read(patchString) : null;
      }).compact();
    },

    getAllPatches: function(ed) {
      var editor = ed.$morph, patches;
      try {
        patches = lively.ide.FilePatch.readAll(editor.textString);
      } catch (e) {
        console.warn("diff mode is trying to getAllPatches but errored while parsing patch:\n", e);
      }
      return patches;
    },

    getPatchAtCursor: function(ed) {
      // ed = that.aceEditor
      var editor = ed.$morph,
          patches = this.getAllPatches(ed);
      if (!patches || !patches.length) return null;

      var patch, // the patch to find!
          row = editor.getCursorPositionAce().row,
          endOfCurrentLine = {column: editor.getSession().getLine(row).length, row: row},
          line = editor.getSession().getLine(row),
          // inside a thing marked with @@ ?
          insideHunk = line.match(/^(@@|\s|\+|\-|\\|$)/) && !line.match(/^(--- |\+\+\+ )/),
          selectedHunk, cursorOffsetInSelectedHunk;

      if (insideHunk) {
        // get the filename and modified line number...
        var lineNoRange = editor.find({start: endOfCurrentLine, backwards: true, preventScroll: true, needle: /^@@.*/}),
            lineNo = Number(editor.getTextRange(lineNoRange).match(/@@ -([0-9]+)/)[1]),
            fileNameRange = editor.find({start: endOfCurrentLine, backwards: true, preventScroll: true, needle: /^---.*/}),
            fileName = editor.getTextRange(fileNameRange).match(/--- (a\/)?(.+)/)[2];
        // ...so editor we can get the right patch for the hunk...
        patch = patches.detect(function(patch) { return patch.fileNameA === fileName; });
        // ...and modify it so editor it only has the selected hunk in it
        var hunk = patch.hunks.detect(function(hunk) { return hunk.originalLine === lineNo; });
        selectedHunk = hunk;
        cursorOffsetInSelectedHunk = row - lineNoRange.start.row;
        patch.hunks = [hunk];
      } else {
        // Where does the next hunk start?
        var hunkStartRange = editor.find({start: endOfCurrentLine, backwards: false, preventScroll: true, needle: /^@@.*/}),
            // Find the filename of the hunk...
            fileNameRange = editor.find({start: hunkStartRange.start, backwards: true, preventScroll: true, needle: /^---.*/}),
            fileName = editor.getTextRange(fileNameRange).match(/--- (a\/)?(.+)/)[2];
        // ...and use editor to find the right patch. We take all hunks the patch comes with
        patch = patches.detect(function(patch) { return patch.fileNameA === fileName; });
      }

      return {
        patch: patch,
        selectedHunk: selectedHunk,
        cursorOffsetInHunk: cursorOffsetInSelectedHunk
      };
    }
});

}) // end of module
