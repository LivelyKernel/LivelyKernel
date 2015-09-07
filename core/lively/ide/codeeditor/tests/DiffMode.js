module('lively.ide.codeeditor.tests.DiffMode').requires('lively.ide.codeeditor.modes.Diff', 'lively.TestFramework').toRun(function() {

var git = lively.ide.git.Interface;

AsyncTestCase.subclass('lively.ide.tests.DiffMode.Test',
'helper', {
  range: function(rangeString) {
    var match = rangeString
      .replace(/^Range:\s*/, "")
      .match(/\[([0-9]+)\/([0-9]+)\][^\[]*\[([0-9]+)\/([0-9]+)\]/);
    if (!match) throw new Error("Cannot parse range " + rangeString);
    return new (ace.require("ace/range").Range)(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]));
  },
},
'running', {

    setUp: function($super, run) {
        var self = this;
        this.origFileStatus = git.fileStatus;
        this.fileStatus = [];
        this.onTearDown(function() { git.fileStatus = self.origFileStatus; });
        git.fileStatus = function(dir, options, thenDo) {
          if (typeof dir === "function") { thenDo = dir; }
          else if (typeof options === "function") { thenDo = options; }
          thenDo(null, self.fileStatus);
        };

        this.patchString = "diff --git a/test.txt b/test.txt\n"
                         + "index e42fd89..581f1fd 100644\n"
                         + "--- a/test.txt\n"
                         + "+++ b/test.txt\n"
                         + "@@ -2,3 +2,3 @@\n"
                         + " a\n"
                         + "-b\n"
                         + "+c\n"
                         + " d\n"
                         + "@@ -2,3 +2,3 @@\n"
                         + " a\n"
                         + "-b\n"
                         + "+c\n"
                         + " d\n"
                         + "diff --git a/test2.txt b/test2.txt\n"
                         + "index e42fd89..581f1fd 100644\n"
                         + "--- a/test2.txt\n"
                         + "+++ b/test2.txt\n"
                         + "@@ -2,3 +2,3 @@\n"
                         + " a\n"
                         + "-b\n"
                         + "+c\n"
                         + " d\n"
                         + "diff --git a/test3.txt b/test3.txt\n"
                         + "index e42fd89..581f1fd 100644\n"
                         + "--- a/test3.txt\n"
                         + "+++ b/test3.txt\n"
                         + "@@ -2,3 +2,3 @@\n"
                         + " u\n"
                         + "-v\n"
                         + "+w\n"
                         + " x\n";
        this.editor = $world.addCodeEditor({
          content: this.patchString,
          textMode: "diff"
        });

        this.editor.withAceDo(function(ed) {
          lively.lang.fun.waitFor(3000,
            function() { return !!ed.commands.commands["lively.ide.git.stageAll"]; },
            run);
        });

        this.focusedMorph = lively.morphic.Morph.focusedMorph();
    },

    tearDown: function(whenDone) {
      this.editor.getWindow().remove();
      if (this.focusedMorph) this.focusedMorph.focus();
    },

    assertCommandsMatch: function(specs, commands) {
      if (specs.length !== commands.length) this.assert(false, lively.lang.string.format("Unequal number of epxected and real commands: %s vs %s"), specs.length, commands.length);
      specs.forEach(function(spec, i) {
        var cmd = commands[i];
        if (!cmd.command) this.assert(false, lively.lang.string.format("Command has no cmd property: %o"), cmd);
        if (Object.isFunction(spec)) spec.call(this, cmd, i);
        else {
          var match = cmd.command.match(spec);
          if (!match) this.assert(false, lively.lang.string.format("Command %s %s does not match %s", i, cmd.command, spec));
        }
      }, this);
    },
},
'testing', {

    testStageAll: function() {
        var err, commands;

        this.fileStatus = [
          {fileName: "test.txt", status: "unstaged", change: "modified"},
          {fileName: "test2.txt", status: "unstaged", change: "modified"},
          {fileName: "test3.txt", status: "staged", change: "modified"}];

        this.editor.aceEditor.execCommand("lively.ide.git.stageAll", {
          dryRun: true,
          thenDo: function(_err, fileObjects, _commands) { err = _err; commands = _commands; }
        });

        this.waitFor(function() { return !!err || !!commands; }, 10, function() {
          this.assertCommandsMatch([/git.*add -- test.txt\s+test2.txt\s*$/], commands);
          this.done();
        });
    },

    testUnstageAll: function() {
        var err, commands;

        this.fileStatus = [
          {fileName: "test.txt", status: "staged", change: "modified"},
          {fileName: "test.txt", status: "unstaged", change: "modified"}];

        this.editor.aceEditor.execCommand("lively.ide.git.unstageAll", {
          dryRun: true,
          thenDo: function(_err, fileObjects, _commands) { err = _err; commands = _commands; }
        });

        this.waitFor(function() { return !!err || !!commands; }, 10, function() {
          this.assertCommandsMatch([/git.*reset -- test.txt\s*$/], commands);
          this.done();
        });
    },

    testDiscardAll: function() {
        var err, commands;

        this.fileStatus = [
          {fileName: "test.txt", status: "staged", change: "modified"},
          {fileName: "test2.txt", status: "unstaged", change: "modified"}];

        this.editor.aceEditor.execCommand("lively.ide.git.discardAll", {
          dryRun: true,
          thenDo: function(_err, fileObjects, _commands) { err = _err; commands = _commands; }
        });

        this.waitFor(function() { return !!err || !!commands; }, 10, function() {
          this.assertCommandsMatch([
            /git.*reset -- test.txt\s+test2.txt\s*$/,
            /git.*checkout -- test.txt\s+test2.txt\s*$/], commands);
          this.done();
        });
    },

    testDiscardAll: function() {
        var err, commands;

        this.fileStatus = [
          {fileName: "test.txt", status: "staged", change: "modified"},
          {fileName: "test2.txt", status: "unstaged", change: "modified"}];

        this.editor.aceEditor.execCommand("lively.ide.git.discardAll", {
          dryRun: true,
          thenDo: function(_err, fileObjects, _commands) { err = _err; commands = _commands; }
        });

        this.waitFor(function() { return !!err || !!commands; }, 10, function() {
          this.assertCommandsMatch([
            /git.*reset -- test.txt\s+test2.txt\s*$/,
            /git.*checkout -- test.txt\s+test2.txt\s*$/], commands);
          this.done();
        });
    },

    testApplyPatches: function() {
        var test = this, testData = [{
          exec: "stageSelection",
          selection: {start: {row: 6, column: 0}, end: {row: 7, column: 2}},
          expectedCommands: ["git apply --cached -"],
          expectedPatches: ["diff --git a/test.txt b/test.txt\n"
                          + "--- a/test.txt\n"
                          + "+++ b/test.txt\n"
                          + "@@ -2,3 +2,3 @@\n"
                          + " a\n"
                          + "-b\n"
                          + "+c\n"
                          + " d\n"]
        }, {
          exec: "unstageSelection",
          selection: {end: {column: 2,row: 21},start: {column: 0,row: 11}},
          expectedCommands: ["git apply --reverse --cached -"],
          expectedPatches: ["diff --git a/test.txt b/test.txt\n"
                          + "--- a/test.txt\n"
                          + "+++ b/test.txt\n"
                          + "@@ -2,3 +2,3 @@\n"
                          + " a\n"
                          + "-b\n"
                          + "+c\n"
                          + " d\n"
                          + "\n"
                          + "diff --git a/test2.txt b/test2.txt\n"
                          + "--- a/test2.txt\n"
                          + "+++ b/test2.txt\n"
                          + "@@ -2,3 +2,3 @@\n"
                          + " a\n"
                          + "-b\n"
                          + "+c\n"
                          + " d\n"]
        },
        {
          exec: "discardSelection",
          selection: {start: {row: 6, column: 0}, end: {row: 7, column: 2}},
          expectedCommands: ["git apply --reverse --cached -", "git apply --reverse -"],
          expectedPatches: ["diff --git a/test.txt b/test.txt\n"
                          + "--- a/test.txt\n"
                          + "+++ b/test.txt\n"
                          + "@@ -2,3 +2,3 @@\n"
                          + " a\n"
                          + "-b\n"
                          + "+c\n"
                          + " d\n",
                          "diff --git a/test.txt b/test.txt\n"
                          + "--- a/test.txt\n"
                          + "+++ b/test.txt\n"
                          + "@@ -2,3 +2,3 @@\n"
                          + " a\n"
                          + "-b\n"
                          + "+c\n"
                          + " d\n"]
        }
        ];

        var done = false;
        lively.lang.arr.mapAsyncSeries(testData,
          function(data, _, n) {
            var err, commands;

            test.editor.setSelectionRangeAce(data.selection);

            test.editor.aceEditor.execCommand("lively.ide.git." + data.exec, {
              dryRun: true,
              thenDo: function(_err, fileObjects, _commands) { err = _err; commands = _commands; }
            });

            test.waitFor(function() { return !!err || !!commands; }, 10, function() {
              err && this.assert(false, String(err.stack));
              var expected = data.expectedCommands.map(function(_, i) {
                return function(cmd) {
                  this.assertEquals(data.expectedCommands[i], cmd.command);
                  this.assertEquals(data.expectedPatches[i], cmd.options.stdin);
                }
              })
              this.assertCommandsMatch(expected, commands);
              n(null);
            });
          }, function(err, results) { done = true; });

        this.waitFor(function() { return !!done; }, 10, function() { this.done(); });
    }

});

lively.ide.tests.DiffMode.Test.subclass('lively.ide.tests.DiffMode.NavigatorTest',
"testing", {

    testFindHunkStartEnd: function() {
      var r = this.range;
      var ed = this.editor.aceEditor;
      var Navigator = lively.ide.codeeditor.modes.Diff.Navigator;
      var Range = ace.require("ace/range").Range;
      var result;

      // Null selection
      result = Navigator.findContainingHunkOrPatchRange(ed, r("[0/0] -> [0/0]"));
      this.assertEqualState(r("[0/0] -> [14/0]"), result);
      result = Navigator.findContainingHunkOrPatchRange(ed, r("[11/0] -> [11/0]"));
      this.assertEqualState(r("[9/0] -> [14/0]"), result);
      result = Navigator.findContainingHunkOrPatchRange(ed, r("[4/0] -> [4/0]"));
      this.assertEqualState(r("[4/0] -> [9/0]"), result);
      result = Navigator.findContainingHunkOrPatchRange(ed, r("[4/0] -> [4/0]"));
      this.assertEqualState(r("[4/0] -> [9/0]"), result);

      // ranges
      result = Navigator.findContainingHunkOrPatchRange(ed, r("[6/0] -> [8/0]"));
      this.assertEqualState(r("[4/0] -> [9/0]"), result);
      result = Navigator.findContainingHunkOrPatchRange(ed, r("[7/2] -> [11/2]"));
      this.assertEqualState(r("[0/0] -> [14/0]"), result);
      result = Navigator.findContainingHunkOrPatchRange(ed, r("[9/0] -> [14/0]"));
      this.assertEqualState(r("[0/0] -> [14/0]"), result);
      result = Navigator.findContainingHunkOrPatchRange(ed, r("[15/0] -> [17/0]"));
      this.assertEqualState(r("[14/0] -> [23/0]"), result);
      
      this.done();
    }

});


}) // end of module
