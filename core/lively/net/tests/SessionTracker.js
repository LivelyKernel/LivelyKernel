module('lively.net.tests.SessionTracker').requires('lively.TestFramework', 'lively.net.SessionTracker').toRun(function() {

AsyncTestCase.subclass('lively.net.tests.SessionTracker.Register',
'running', {
    setUp: function($super) {
        $super();
        this.serverURL = URL.create(Config.nodeJSURL+'/SessionTrackerUnitTest/')
        lively.net.SessionTracker.createSessionTrackerServer(this.serverURL);
        this.sut = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: this.serverURL,
            username: 'SessionTrackerTestUser'
        });
    },

    tearDown: function($super) {
        $super();
        this.sut.unregisterCurrentSession();
        this.sut.resetConnection();
        lively.net.SessionTracker.removeSessionTrackerServer(this.serverURL);
    }
},
'testing', {
    testRegisterCurrentWorld: function() {
        this.sut.registerCurrentSession();
        this.sut.getSessions(function(sessions) {
            var expected = [{
                id: this.sut.sessionId,
                worldURL: URL.source.toString(),
                user: "SessionTrackerTestUser"
            }];
            this.assertEqualState(expected, sessions);
            this.done();
        }.bind(this));
    },

    testUnregister: function() {
        // second Connection for getting sessions
        var secondSession = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: this.serverURL,
            username: 'SessionTrackerTestUser2'
        });
        this.sut.registerCurrentSession();
        this.delay(function() {
            secondSession.registerCurrentSession();
            this.sut.unregisterCurrentSession();
            secondSession.getSessions(function(sessions) { 
                var expected = [{
                    id: secondSession.sessionId,
                    worldURL: URL.source.toString(),
                    user: "SessionTrackerTestUser2"
                }];
                secondSession.unregisterCurrentSession();
                this.assertEqualState(expected, sessions);
                this.done();
            }.bind(this));
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