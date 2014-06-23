module('lively.lang.VM').requires().toRun(function() {

Object.extend(lively.lang.VM, {

    getGlobal: function() {
        return (function() { return this; })();
    },

    _eval: function(__lvEvalStatement) {
        try {
            return eval('(' + __lvEvalStatement + ')');
        } catch (e) { return eval(__lvEvalStatement); }
    },

    runEval: function (code, options, thenDo) {
        if (typeof options === 'function' && arguments.length === 2) {
            thenDo = options; options = {};
        } else if (!options) options = {};
        
        var vm = lively.lang.VM, result, err;
        try {
            result = vm._eval.call(options.context || vm.getGlobal(), code);
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
