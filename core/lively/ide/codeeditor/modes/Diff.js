module('lively.ide.codeeditor.modes.Diff').requires('lively.ide.codeeditor.ace', 'lively.ide.git.Interface').toRun(function() {

var git = lively.ide.git.Interface;
var Mode = lively.ide.ace.require('ace/mode/diff').Mode;

Mode.addMethods({

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
          insideHunk = line.match(/^(@@|\s|\+|\-|$)/) && !line.match(/^(--- |\+\+\+ )/),
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
