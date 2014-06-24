module('lively.lang.VM').requires().toRun(function() {

Object.extend(lively.lang.VM, {

    transformForVarRecord: function(code, varRecorderName) {
        var ast = lively.ast.acorn.parse(code);
        var subst = {name: varRecorderName, type: "Identifier"};
        var transformed = lively.ast.transform.replaceTopLevelVarDeclsWithAssignment(ast, subst);
        return lively.ast.acorn.stringify(transformed);
    },

    getGlobal: function() {
        return (function() { return this; })();
    },

    _eval: function(__lvEvalStatement, __lvVarRecorder) {
        try {
            return eval('(' + __lvEvalStatement + ')');
        } catch (e) { return eval(__lvEvalStatement); }
    },

    runEval: function (code, options, thenDo) {
        if (typeof options === 'function' && arguments.length === 2) {
            thenDo = options; options = {};
        } else if (!options) options = {};
        
        var vm = lively.lang.VM, result, err,
            context = options.context || vm.getGlobal(),
            recorder = options.topLevelVarRecorder;

        if (recorder) code = vm.transformForVarRecord(code, '__lvVarRecorder');
        if (recorder) show(code)

        try {
            result = vm._eval.call(context, code, recorder);
        } catch (e) { err = e;
        } finally { thenDo(err, result); }
    },

    syncEval: function(string, options) {
        var result;
        lively.lang.VM.runEval(string, options, function(e, r) {
            result = e || r; });
        return result;
    }

});

}); // end of module
