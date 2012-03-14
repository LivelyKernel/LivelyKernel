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
                var testCase = new that.constructor(that.result, sel, that.getPartUnderTest());
                testCase.addScript(that[sel]);
                // add helper functions
                Functions.own(this).forEach(function(ea) {
                    if (! ea.startsWith("test")) {
                        testCase.addScript(that[ea]);
                    }
                });
                return testCase;
            });
    },
    initialize: function($super, testResult, optTestSelector, partUnderTest) {
        $super(testResult, optTestSelector);
        this.setPartUnderTest(partUnderTest);
    },
    setPartUnderTest: function(partUnderTest) {
        this.partUnderTest = partUnderTest;
    },
    getPartUnderTest: function() {
        return this.partUnderTest;
    },
    runTest: function(aSelector) {
        if (!this.shouldRun) return;
        this.currentSelector = aSelector || this.currentSelector;

        this.running();
        try {
            this.setUp();
            // copy the part so a test can't break the original one
            this[this.currentSelector](this.getPartUnderTest().copy());
            this.addAndSignalSuccess();
        } catch (e) {
            this.addAndSignalFailure(e);
         } finally {
            try {
                this.tearDown();
            } catch(e) {
                this.log('Couldn\'t run tearDown for ' + this.id() + ' ' + e);
            }
        }
        return this.result;
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
    removePartTest: function(aSelector) {
        var testsObject = this.getTestsObject();
        if (!testsObject) {
            return;
        }
        delete testsObject[aSelector];
    },
 
    runPartTests: function() {
        var testCase = this.createPartTestCase();
        testCase.runAll();
        return testCase.result;
    },
    createPartTestCase: function() {
        var testCase = new lively.PartTestCase(null, null, this),
            tests = this.ensurePartTestsObject();
        for (funcName in tests) {
            testCase.addScript(tests[funcName], funcName);
        }
        return testCase;
    },


});
TestSuite.addMethods('parts tests', {

    addTestCasesFromPart: function(aPart) {
        this.addTestCases([aPart.createPartTestCase()]);
    },

});
}) // end of module
