module('lively.ast.Debugging').requires('lively.ast.Rewriting').toRun(function() {

cop.create('DebugGlobalErrorHandlerLayer')
.beGlobal()
.refineClass(lively.morphic.World, {
    logError: function(err, optName) {
        if (err.isUnwindException) {
            var msg = 'Caught UnwindingException!';
            this.setStatusMessage(msg, Color.purple.darker(), 10);
            return false;
        } else {
            return cop.proceed(err, optName);
        }
    }
});

}) // end of module
