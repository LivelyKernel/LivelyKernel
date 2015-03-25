module('lively.ide.codeeditor.modes.R').requires('lively.ide.codeeditor.ace').requiresLib({loadTest: function() { return ace.require('ace/mode/r') || ace.config.loadModule(["mode", "ace/mode/r"]); }}).toRun(function() {

var RMode = ace.require('ace/mode/r').Mode

RMode.addMethods({

    morphMenuItems: function(items, editor) {
        var mode = this,
            livelyREvaluateEnabled = mode.livelyEvalMethod === 'lively-R-evaluate',
            s = editor.getSession();
        items.push(['R',
            [[Strings.format('[%s] lively-R-evaluate', livelyREvaluateEnabled ? 'x' : ' '),
             function() {
                 mode.livelyEvalMethod = livelyREvaluateEnabled ? 'simple' : 'lively-R-evaluate';
             }]]]);
        return items;
    },

    doEval: function(codeEditor, insertResult) {
        // FIXME: Cleanup really needed!
        if (!module('apps.RInterface').isLoaded()) module('apps.RInterface').load(true);
        var sourceString = codeEditor.getSelectionOrLineString();
        if (this.livelyEvalMethod == 'lively-R-evaluate') {
            apps.RInterface.livelyREvaluate_startEval(sourceString, function(err, result) {
                if (!insertResult && !err) addOverlay(err, result);
                else printResult(err, result);
            });
        } else {
            apps.RInterface.evalSync(sourceString, function(err, result) {
                if (!insertResult && !err) return;
                else printResult(err, result);
            });
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function addOverlay(err, result) {
            module("lively.ide.codeeditor.TextOverlay").load(true);
            var range = codeEditor.getSelection().getRange();
            var lines = codeEditor.getSession().getLines(range.start.row, range.end.row)
            lines.forEach(function(line, i) {
                var out = result.output[i];
                if (!out) return;
                var pos = {row: range.start.row + i, column: line.length + 1},
                    text = [out.error, out.waning, out.message, out.value].compact().join(' ');
                codeEditor.addTextOverlay({start: pos, text: text});
            });

            (function() {
                function removeOverlay() {
                    codeEditor.removeTextOverlay();
                    codeEditor.aceEditor.removeEventListener('change', removeOverlay);
                }
                codeEditor.aceEditor.addEventListener('change', removeOverlay);
            }).delay(0.8);

        }

        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
        }
    }
});

}) // end of module
