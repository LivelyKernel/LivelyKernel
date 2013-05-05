module('lively.net.tests.SessionTracker').requires('lively.TestFramework', 'lively.net.SessionTracker').toRun(function() {

AsyncTestCase.subclass('lively.net.tests.SessionTracker.Register',
'running', {
    setUp: function($super) {
        $super();
        this.sut = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: lively.net.SessionTracker.localSessionTrackerURL,
            username: 'SessionTrackerTestUser'
        });
        this.sut.useSandbox();
    },

    tearDown: function($super) {
        $super();
        this.sut.unregisterCurrentSession();
        this.sut.removeSandbox();
        this.sut.resetConnection();
    }
},
'testing', {
    testRegisterCurrentWorld: function() {
        this.sut.registerCurrentSession();
        this.delay(function() {
            var sessions = this.sut.getSessions();
            var expected = [{
                id: this.sut.sessionId,
                worldURL: URL.source.toString(),
                user: "SessionTrackerTestUser"
            }];
            this.assertEqualState(expected, sessions);
            this.done();
        },700);
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

lively.net.tests.SessionTracker.Register.subclass('lively.net.tests.SessionTracker.SessionFederation',
'testing', {
    testRegisterCurrentWorld: function() {
        // this.tracker.registerCurrentSession();
        // this.delay(function(sessions) {
        //     var sessions = this.tracker.getSessions();
        //     var expected = [{id: this.tracker.sessionId, worldURL: URL.source.toString(), user: $world.getUserName()}];
        //     this.assertEqualState(expected, sessions);
        // }, 60);
            this.done();
    }

});

}) // end of module