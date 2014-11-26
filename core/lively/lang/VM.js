module('lively.lang.VM').requires("lively.ast.AstHelper").toRun(function() {

Object.extend(lively.lang.VM, {

    transformForVarRecord: function(code, varRecorder, varRecorderName, blacklist, defRangeRecorder) {
        // variable declaration and references in the the source code get
        // transformed so that they are bound to `varRecorderName` aren't local
        // state. THis makes it possible to capture eval results, e.g. for
        // inspection, watching and recording changes, workspace vars, and
        // incrementally evaluating var declarations and having values bound later.
        blacklist = blacklist || [];
        try {
            var undeclaredToTransform = Object.keys(varRecorder).withoutAll(blacklist),
                transformed = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(
                    code, {name: varRecorderName, type: "Identifier"},
                    {ignoreUndeclaredExcept: undeclaredToTransform,
                     exclude: blacklist, recordDefRanges: !!defRangeRecorder});
            code = transformed.source;
            if (defRangeRecorder) Object.extend(defRangeRecorder, transformed.defRanges);
        } catch(e) {
            if (lively.Config.showImprovedJavaScriptEvalErrors) $world.logError(e)
            else console.error("Eval preprocess error: %s", e.stack || e);
        }
        return code;
    },

    transformSingleExpression: function(code) {
        // evaling certain expressions such as single functions or object
        // literals will fail or not work as intended. When the code being
        // evaluated consists just out of a single expression we will wrap it in
        // parens to allow for those cases
        try {
            var ast = lively.ast.acorn.fuzzyParse(code);
            if (ast.body.length === 1 &&
               (ast.body[0].type === 'FunctionDeclaration'
             || ast.body[0].type === 'BlockStatement')) {
                code = '(' + code.replace(/;\s*$/, '') + ')';
            }
        } catch(e) {
            if (lively.Config.showImprovedJavaScriptEvalErrors) $world.logError(e)
            else console.error("Eval preprocess error: %s", e.stack || e);
        }
        return code;
    },

    evalCodeTransform: function(code, options) {
        var vm = lively.lang.VM,
            recorder = options.topLevelVarRecorder,
            varRecorderName = options.varRecorderName || '__lvVarRecorder';

        if (recorder) code = vm.transformForVarRecord(
            code, recorder, varRecorderName,
            options.dontTransform, options.topLevelDefRangeRecorder);
        code = vm.transformSingleExpression(code);

        if (options.sourceURL) code += "\n//# sourceURL=" + options.sourceURL.replace(/\s/g, "_"); 

        return code;
    },

    getGlobal: function() {
        return (function() { return this; })();
    },

    _eval: function(__lvEvalStatement, __lvVarRecorder/*needed as arg for capturing*/) {
        return eval(__lvEvalStatement);
    },

    runEval: function (code, options, thenDo) {
        // The main function where all eval options are configured.
        // options can include {
        //   varRecorderName: STRING, // default is '__lvVarRecorder'
        //   topLevelVarRecorder: OBJECT,
        //   context: OBJECT,
        //   sourceURL: STRING
        // }
        if (typeof options === 'function' && arguments.length === 2) {
            thenDo = options; options = {};
        } else if (!options) options = {};

        var vm = lively.lang.VM, result, err,
            context = options.context || vm.getGlobal(),
            recorder = options.topLevelVarRecorder;
        code = vm.evalCodeTransform(code, options);

        $morph('log') && ($morph('log').textString = code);

        try {
            result = vm._eval.call(context, code, recorder);
        } catch (e) { err = e; } finally { thenDo(err, result); }
    },

    syncEval: function(string, options) {
        // See #runEval for options.
        // Although the defaul eval is synchronous we assume that the general
        // evaluation might not return immediatelly. This makes is possible to
        // change the evaluation backend, e.g. to be a remotely attached runtime
        var result;
        lively.lang.VM.runEval(string, options, function(e, r) { result = e || r; });
        return result;
    }

});

}); // end of module
