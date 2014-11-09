module('lively.ide.codeeditor.modes.Python').requires('lively.ide.codeeditor.ace').toRun(function() {

var PythonMode = lively.ide.ace.require('ace/mode/python').Mode;

PythonMode.addMethods({

    evalAndPrint: function(codeEditor, insertResult, prettyPrint, prettyPrintLevel) {

        var code = codeEditor.getSelectionOrLineString();
        Global.URL.nodejsBase.withFilename('PythonSubserver/eval').asWebResource().beAsync()
            .post(JSON.stringify({expr: code}), 'application/json')
            .withJSONWhenDone(function(json, status) { dealWithResult(json); });
    
        function dealWithResult(json) {
            var stdout = json.stdout.trim();
            var stderr = json.stderr.replace(/>>>/g, '').trim();
            var string = json.error ? String(json.error) + '\n' + stderr : stdout;
            if (!string.length && stderr.length) string = stderr;
            if (insertResult) { codeEditor.printObject(codeEditor.aceEditor, string); return; }
            if (json.error && lively.Config.get('showDoitErrorMessages') && codeEditor.world()) {
                codeEditor.world().alert(string);
            }
            var sel = codeEditor.getSelection();
            if (sel && sel.isEmpty()) sel.selectLine();
        }
    },

    doEval: function(codeEditor, insertResult) {
        return this.evalAndPrint(codeEditor, insertResult, false);
    },
    
    printInspect: function(codeEditor, options) {
        return this.evalAndPrint(codeEditor, true, true, options.depth || 4);
    }
});

}) // end of module
