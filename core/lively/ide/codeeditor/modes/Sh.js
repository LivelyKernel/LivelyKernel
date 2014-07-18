module('lively.ide.codeeditor.modes.Sh').requires('lively.ide.codeeditor.ace').toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Shell-mode
lively.ide.ace.require('ace/mode/sh').Mode.addMethods({
    doEval: function(codeEditor, insertResult) {
        lively.ide.commands.exec('lively.ide.execShellCommand', codeEditor, {
            insert: insertResult,
            insertProgress: true,
            count: 4,
            addToHistory: true,
            group: "shell-doit-" - codeEditor.id,
            shellCommand: codeEditor.getSelectionOrLineString()
        });
    }
});

}) // end of module
