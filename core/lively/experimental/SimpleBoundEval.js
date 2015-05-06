module('lively.experimental.SimpleBoundEval').requires('cop.Layers', 'lively.ide.CodeEditor').toRun(function() {

// This new bound eval makes scripting objects really ugly, due to the rewriting of variable access
// Example: this.addScript(function testFoo() {new URL}); -> this.addScript(function testFoo() {new Global.URL});
// The SimpleBoundEvalLayer provides a plain bound eval, that does not uses this feature

cop.create("SimpleBoundEvalLayer").refineClass(lively.morphic.CodeEditor, {
    boundEval: function(str) {
        var ctx = this.getDoitContext() || this,
            interactiveEval = function(text) { return eval(text) };
        return interactiveEval.call(ctx, str);
    }
}).beGlobal()

}) // end of module
