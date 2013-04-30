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
        this.sut.removeSandbox();
        this.sut.resetConnection();
        this.sut.unregisterCurrentSession();
        $world.setCurrentUser(this.origUsername);
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
        }, 300);
    },

    testUnregister: function() {
        this.sut.registerCurrentSession();
        this.delay(function(sessions) {
            this.sut.unregisterCurrentSession();
            this.delay(function(sessions) {
                var sessions = this.sut.getSessions();
                var expected = [];
                this.assertEqualState(expected, sessions);
                this.done();
            }, 50);
        }, 50);
    },

    testRemoteEval: function() {
        this.sut.registerCurrentSession();
        this.sut.openForRemoteEvalRequests();
        Global.remoteEvalHappened = false;
        var expr = 'Global.remoteEvalHappened = true; 1 + 3';
        this.sut.remoteEval(this.sut.sessionId, expr, function(msg) {
            this.assertEquals('4', msg.data.result);
            this.assert(Global.remoteEvalHappened, 'remoteEvalHappened no set');
            delete Global.remoteEvalHappened;
            this.done();
        }.bind(this));
    }

});

AsyncTestCase.subclass('lively.net.tests.SessionTracker.SessionFederation',
'running', {
    setUp: function($super) {
        $super();
        this.origUsername = $world.getUserName(true);
        $world.setCurrentUser('SessionTrackerTestUser');
        this.tracker = lively.net.SessionTracker;
        this.tracker.useSandbox();
    },

    tearDown: function($super) {
        $super();
        this.tracker.removeSandbox();
        this.tracker.unregisterCurrentSession();
        this.tracker.resetConnection();
        $world.setCurrentUser(this.origUsername);
    }
},
'testing', {
    testRegisterCurrentWorld: function() {
        this.tracker.registerCurrentSession();
        this.delay(function(sessions) {
            var sessions = this.tracker.getSessions();
            var expected = [{id: this.tracker.sessionId, worldURL: URL.source.toString(), user: $world.getUserName()}];
            this.assertEqualState(expected, sessions);
            this.done();
        }, 60);
    }

})



}) // end of module