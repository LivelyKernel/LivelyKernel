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
        this.sut.unregisterCurrentSession();
    }
},
'testing', {
    testRegisterCurrentWorld: function() {
        this.sut.registerCurrentSession();
        this.delay(function(sessions) {
            var sessions = this.sut.getSessions();
            var expected = [{id: this.sut.sessionId, worldURL: URL.source.toString(), user: $world.getUserName()}];
            this.assertEqualState(expected, sessions);
            this.done();
        }, 120);
    },
    testRemoteEval: function() {
        this.sut.registerCurrentSession();
        this.sut.openForRemoteEvalRequests();
        Global.remoteEvalHappened = false;
        var expr = 'Global.remoteEvalHappened = true; 1 + 3';
        this.sut.remoteEval(this.sut.sessionId, expr, function(data) {
            this.assertEquals('4', data.result);
            this.assert(Global.remoteEvalHappened, 'remoteEvalHappened no set');
            delete Global.remoteEvalHappened;
            this.done();
        }.bind(this));
    }

})

}) // end of module