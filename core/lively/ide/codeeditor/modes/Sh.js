module('lively.ide.codeeditor.modes.Sh').requires('lively.ide.codeeditor.ace').toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Shell-mode
lively.ide.ace.require('ace/mode/sh').Mode.addMethods({

    commands: {
        "lively.shell.Workspace.openRunningCommand": {
            exec: function(ed) {
              var mode = ed.session.getMode();
              var cmd = (mode.getRunningProcessesOf(ed.$morph) || []).last();
              if (cmd) mode.openProcessOf(ed.$morph, cmd);
              else if (ed.$morph._statusMorph) ed.$morph._statusMorph.expand();
              else ed.$morph.setStatusMessage("No process running");
            }
        }
    },

    keybindings: {
        "lively.shell.Workspace.openRunningCommand": {mac: "Command-Shift-o", win: "Ctrl-Shift-o"}
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
        this.initKeyHandler();
        ed.keyBinding.addKeyboardHandler(this.keyhandler);
    },

    detach: function(ed) {
        this.keyhandler = null;
        ed.keyBinding.removeKeyboardHandler(this.keyhandler);
    },

    groupNameForCommand: function(editor) {
      return "shell-doit-" + editor.id;
    },

    getRunningProcessesOf: function(editor) {
        var group = this.groupNameForCommand(editor);
        return lively.shell.getGroupCommandQueue(group);
    },

    openProcessOf: function(editor, cmd, thenDo) {
      lively.lang.fun.composeAsync(
        function(n) {
          var m = module("lively.ide.tools.ShellCommandRunner");
          if (m.isLoaded()) n();
          else require("lively.ide.tools.ShellCommandRunner").toRun(function() { n(); });
        },
        function(n) {
          lively.ide.tools.ShellCommandRunner.forCommand(cmd).openInWorldCenter().comeForward();
          n();
        }
      )(thenDo);
    },

    doEval: function(codeEditor, insertResult) {
        var mode = this;
        lively.ide.commands.exec('lively.ide.execShellCommand', codeEditor, {
            insert: insertResult,
            showProgress: true,
            count: 4,
            addToHistory: true,
            group: mode.groupNameForCommand(codeEditor),
            shellCommand: codeEditor.getSelectionOrLineString()
        });
    },

    morphMenuItems: function(items, editor) {
        var mode = this,
            s = editor.getSession(),
            processes = mode.getRunningProcessesOf(editor);

        items.push([
          "running processes",
          processes.length ?
            processes.map(function(cmd) {
              return [String(cmd), [
                ["kill", function() {
                  lively.shell.run("ls").kill("SIGKILL", function() {
                    editor.setStatusMessage(cmd + " was killed");
                  })
                }],
                ["open ", function() { mode.openProcessOf(editor, cmd); }]
              ]]
            }) : [["no process running", function() {}]]
        ]);
        return items;
    },

});

}) // end of module
