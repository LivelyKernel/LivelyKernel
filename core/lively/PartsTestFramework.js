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
            this[this.currentSelector](this.getPartUnderTest());
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
    runPartTests: function() {
        var testCase = new lively.PartTestCase(null, null, this),
            tests = this.ensurePartTestsObject();
        for (funcName in tests) {
            testCase.addScript(tests[funcName], funcName);
        }
        testCase.runAll();
        return testCase;
    },

});

}) // end of module