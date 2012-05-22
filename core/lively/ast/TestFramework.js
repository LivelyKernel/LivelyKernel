module('lively.ast.TestFramework').requires('lively.TestFramework', 'lively.ast.Morphic').toRun(function() {
cop.create('DebugTestsLayer')
.refineClass(TestCase, {
    runTest: function(aSelector) {
        if (!this.shouldRun) return;
        this.currentSelector = aSelector || this.currentSelector;
        this.running();
        var runTearDown = true;
        try {
            this.setUp();
            this[this.currentSelector].forInterpretation().call(this);
            this.addAndSignalSuccess();
        } catch (e) {
            if (e.isUnwindException) {
                runTearDown = false;
                lively.morphic.Morph.openDebugger(e.topFrame, e.toString())
            } else {
                this.addAndSignalFailure(e);
            }
        } finally {
            try {
                if (runTearDown) this.tearDown();
            } catch(e) {
                this.log('Couldn\'t run tearDown for ' + this.id() + ' ' + e);
            }
        }
        return this.result;
    },
})
.refineClass(lively.ast.FunctionCaller, {
    shouldInterpret: function(frame, func) {
        return !this.isNative(func);
    }
});

}) // end of module
