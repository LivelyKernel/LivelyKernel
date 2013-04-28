module('lively.net.tests.SessionTracker').requires('lively.TestFramework', 'lively.net.SessionTracker').toRun(function() {

AsyncTestCase.subclass('lively.net.tests.SessionTracker.Register',
'running', {
    setUp: function($super) {
        $super();
        lively.net.SessionTracker.useSandbox();
    },

    tearDown: function($super) {
        $super();
        lively.net.SessionTracker.removeSandbox();
    }
},
'testing', {
    testRegisterCurrentWorld: function() {
        this.done();
    }
})

}) // end of module