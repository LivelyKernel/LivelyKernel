module('lively.AST.TestFramework').requires('lively.TestFramework', 'lively.AST.Morphic').toRun(function() {
cop.create('DebugTestsLayer')
.refineClass(TestCase, {
    runTest: function(aSelector) {
        var sel = aSelector || this.currentSelector;
        var old = this[sel];
        try {
            if (Config.debugScripts === true) {
                this[sel] = old.forDebugging("lively.morphic.Morph.openDebugger");
            }
            return cop.proceed(aSelector);
        } finally {
            this[sel] = old;
        }
    },
});


}) // end of module