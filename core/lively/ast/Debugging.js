module('lively.ast.Debugging').requires('lively.ast.Rewriting', 'lively.ide.tools.Debugger').toRun(function() {

Object.extend(lively.ast, {

    halt: function(frame) {
        (function() {
            lively.ast.openDebugger(frame, "Debugger");
        }).delay(0);
        return true;
    },

    openDebugger: function(frame, title) {
        var m = lively.BuildSpec("lively.ide.tools.Debugger").createMorph();
        m.targetMorph.setTopFrame(frame);
        if (title) m.setTitle(title);
        m.openInWorldCenter().comeForward();
    }
});

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
