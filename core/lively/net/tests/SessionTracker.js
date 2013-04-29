module('lively.net.tests.SessionTracker').requires('lively.TestFramework', 'lively.net.SessionTracker').toRun(function() {

AsyncTestCase.subclass('lively.net.tests.SessionTracker.Register',
'running', {
    setUp: function($super) {
        $super();
        this.origUsername = $world.getUserName(true);
        $world.setCurrentUser('SessionTrackerTestUser');
        this.sut = lively.net.SessionTracker;
        this.sut.useSandbox();
    },

    tearDown: function($super) {
        $super();
        $world.setCurrentUser(this.origUsername);
        this.sut.removeSandbox();
        this.sut.resetConnection();
    }
},
'testing', {
    testRegisterCurrentWorld: function() {
        this.sut.registerCurrentSession();
        this.sut.withSessionsDo(function(sessions) {
            var expected = [
                {id: this.sut.sessionId, worldURL: URL.source.toString(), user: $world.getUserName()}];
            this.assertEqualState(expected, sessions);
            this.done();
        }.bind(this));
    }
})

}) // end of module