module('lively.ast.DebugExamples').requires('lively.ast.Debugging').toRun(function() {

// Just a shortcut to test debugging

Object.extend(lively.ast.DebugExamples, {
    changeWorldFill: function(fill) {
        debugger;
        $world.setFill(fill);
    },

    runChangeWorldFill: function(fill) {
        try {
            this.changeWorldFill(fill);
        } catch (e) { lively.ast.halt(e.top); }
    },
});

}) // end of module
