module('lively.ide.codeeditor.modes.Shell').requires('lively.ide.codeeditor.ace').toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Shell-mode
lively.ide.ace.require('ace/mode/sh').Mode.addMethods({
    doEval: function(codeEditor, insertResult) {
        lively.ide.commands.exec('lively.ide.execShellCommand', codeEditor, {
            insert: insertResult,
            count: 4,
            shellCommand: codeEditor.getSelectionOrLineString()
        });
    }
});

}) // end of module