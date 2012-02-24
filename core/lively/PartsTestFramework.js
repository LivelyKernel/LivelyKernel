module('lively.PartsTestFramework').requires('lively.morphic', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.PartTestCase', 'accessing', {
    allTestSelectors: function() {
        var that = this;
        return Functions.own(that).select(function(selector) {
                return selector.startsWith('test');
            }); 
    },
    createTests: function() {
        var that = this;
        return this.allTestSelectors().collect(function(sel) {
                debugger;
                var testCase = new that.constructor(that.result, sel);
                testCase.addScript(that[sel]);
                return testCase;
            });
    },

});

lively.morphic.Morph.addMethods('parts testing', {
    ensurePartTestsObject: function() {
        if (!this.partTests) {
            this.partTests = {};
        }
        return this.partTests;
    },
    getTestsObject: function() {
        return this.partTests;
    },
    addPartTest: function(aFunction) {
        aFunction.asScriptOf(this.ensurePartTestsObject(), aFunction.name);
    }, 
    runPartTests: function() {
        var testCase = new lively.PartTestCase(),
            tests = this.ensurePartTestsObject();
        for (funcName in tests) {
            testCase.addScript(tests[funcName], funcName);
        }
        testCase.runAll();
        return testCase;
    },

});

}) // end of module