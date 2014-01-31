module('lively.ide.codeeditor.modes.Clojure').requires('lively.ide.codeeditor.ace').toRun(function() {

lively.ide.ace.require('ace/mode/clojure').Mode.addMethods({
     doEval: function(codeEditor, insertResult) {
        function printResult(err, result) {
            if (err && !Object.isString(err)) err = Objects.inspect(err, {maxDepth: 3});
            if (!insertResult && err) { codeEditor.world().alert(err); return;}
            if (result && !Object.isString(result)) result = Objects.inspect(result, {maxDepth: 3});
            codeEditor.printObject(codeEditor.aceEditor, err ? err : result);
        }
        function prepareRawResult(rawResult) {
            if (!Object.isArray(rawResult) || !rawResult.length) return rawResult;
            var isError = !!rawResult[0].ex;
            return isError ?
                [rawResult.pluck('ex'), rawResult.pluck('root-ex'), rawResult.pluck('err')].flatten().compact().join('\n') :
                rawResult.pluck('value').concat(rawResult.pluck('out')).compact().join('\n');
        }
         if (!module('lively.net.SessionTracker').isLoaded()) {
             printResult('Lively2Lively not loaded, cannot connect to Clojure nREPL server!');
             return;
         }
        var sourceString = codeEditor.getSelectionOrLineString(),
            sess = lively.net.SessionTracker.getSession()
        sess.send('clojureEval', {code: sourceString}, function(answer) {
            printResult(answer.data.error, prepareRawResult(answer.data.result)); });
    }
});

}) // end of module