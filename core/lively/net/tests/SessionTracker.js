module('lively.net.tests.SessionTracker').requires('lively.TestFramework', 'lively.net.SessionTracker').toRun(function() {

AsyncTestCase.subclass('lively.net.tests.SessionTracker.Register',
'running', {
    setUp: function($super) {
        $super();
        this.setMaxWaitDelay(1*1000);
        this.serverURL = URL.create(Config.nodeJSURL+'/SessionTrackerUnitTest/');
        lively.net.SessionTracker.createSessionTrackerServer(this.serverURL, {inactiveSessionRemovalTime: 1*500});
        this.sut = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: this.serverURL,
            username: 'SessionTrackerTestUser'
        });
    },

    tearDown: function($super) {
        $super();
        this.sut.unregister();
        this.sut.resetConnection();
        lively.net.SessionTracker.removeSessionTrackerServer(this.serverURL);
    }
},
'testing', {
    testRegisterCurrentWorld: function() {
        this.sut.register();
        this.sut.whenOnline(function() {
            this.assert(!!this.sut.trackerId, 'tracker id not in session tracker client');
        }.bind(this));
        this.sut.getSessions(function(sessions) {
            var expected = [{
                id: this.sut.sessionId,
                worldURL: URL.source.toString(),
                user: "SessionTrackerTestUser"
            }];
            var sessionList = sessions[this.sut.trackerId];
            this.assertMatches(expected, sessionList);
            this.assert(!!sessionList[0].remoteAddress, 'ip not included');
            this.done();
        }.bind(this));
    },

    testUnregister: function() {
        var cameOnline = false, id;
        this.sut.register();
        this.sut.whenOnline(function() {
            cameOnline = true;
            id = this.sut.trackerId;
            this.sut.unregister();
        }.bind(this));
        this.waitFor(function() { return cameOnline; }, 100, function() {
            var sessions = lively.net.SessionTracker.getServerStatus()[this.serverURL.pathname],
                expected = {}; expected[id] = [];
            this.assertEqualState(expected, sessions);
            this.assert(!this.sut.trackerId, 'tracker id not removed');
            this.assert(!this.sut.sessionId, 'session id not removed');
            this.done();
        });
},

    testLostConnectionIsRemoved: function() {
        var cameOnline = false, id;
        this.sut.register();
        this.sut.whenOnline(function() {
            cameOnline = true;
            disconnectAll(this.sut.webSocket); // so that close does not trigger reconnect
            id = this.sut.trackerId;
            this.sut.webSocket.close();
        }.bind(this));
        this.waitFor(function() { return cameOnline; }, 100, function() {
            var sessions = lively.net.SessionTracker.getServerStatus()[this.serverURL.pathname];
            this.assertEquals(1, sessions[id].length, 'session removed to early?');
            this.delay(function() {
                var sessions = lively.net.SessionTracker.getServerStatus()[this.serverURL.pathname];
                this.assertEquals(0, sessions[id].length, 'session not removed');
                this.done();
            }, 600);
        });
    },

    testAutoReconnectToRestartedServer: function() {
        var serverDown = false, serverRestarted = false;
        this.assertEquals('disconnected', this.sut.status());
        this.sut.register();
        this.sut.whenOnline(function() {
            this.assert(this.sut.isConnected(), 'session not connected')
            this.assertEquals('connected', this.sut.status());
            lively.net.SessionTracker.removeSessionTrackerServer(this.serverURL);
            serverDown = true;
        }.bind(this));
        this.waitFor(function() { return serverDown; }, 100, function() {
            this.delay(function() {
                this.assertEquals('connecting', this.sut.status());
                lively.net.SessionTracker.createSessionTrackerServer(this.serverURL, {inactiveSessionRemovalTime: 1*500});
                serverRestarted = true;
            }, 200);
        });
        this.waitFor(function() { return serverRestarted; }, 100, function() {
            this.sut.whenOnline(function() {
                var sessions = lively.net.SessionTracker.getServerStatus()[this.serverURL.pathname];
                // this.assertEquals('connected', this.sut.status());
                this.assertEquals(1, sessions[this.sut.trackerId].length, 'session not re-registered');
                this.done();
            }.bind(this));
        }, 700);
    },

    testRemoteEval: function() {
        this.sut.register();
        this.sut.openForRemoteEvalRequests();
        Global.remoteEvalHappened = false;
        var expr = 'Global.remoteEvalHappened = true; 1 + 3';
        this.sut.remoteEval(this.sut.sessionId, expr, function(result) {
            this.assertMatches({data: {result: '4'}}, result);
            this.assert(Global.remoteEvalHappened, 'remoteEvalHappened no set');
            delete Global.remoteEvalHappened;
            this.done();
        }.bind(this));
    },
    testReportsLastActivity: function() {
        this.sut.activityTimeReportDelay = 50; // ms
        Global.LastEvent = {timeStamp: Date.now()}
        this.sut.register();
        var activity1, activity2;
        this.sut.getSessions(function(sessions) {
            activity1 = sessions[this.sut.trackerId][0].lastActivity;
            Global.LastEvent.timeStamp++;
        }.bind(this));
        this.delay(function() {
            this.sut.getSessions(function(sessions) {
                activity2 = sessions[this.sut.trackerId][0].lastActivity;
            }.bind(this));
        }, 200);
        this.delay(function() {
            this.assert(activity1 < activity2, 'Activity not updated ' + activity1 + ' vs ' + activity2);
            this.done();
        }, 300);
    }

});

AsyncTestCase.subclass('lively.net.tests.SessionTracker.SessionFederation',
'running', {
    setUp: function($super) {
        $super();
        this.setMaxWaitDelay(5*1000);
        this.serverURL1 = URL.create(Config.nodeJSURL+'/SessionTrackerFederationTest1/');
        this.serverURL2 = URL.create(Config.nodeJSURL+'/SessionTrackerFederationTest2/');
        this.serverURL3 = URL.create(Config.nodeJSURL+'/SessionTrackerFederationTest3/');
        lively.net.SessionTracker.createSessionTrackerServer(this.serverURL1, {
            server2serverReconnectTimeout: 300
        });
        lively.net.SessionTracker.createSessionTrackerServer(this.serverURL2, {
            server2serverReconnectTimeout: 300
        });
        lively.net.SessionTracker.createSessionTrackerServer(this.serverURL3, {
            server2serverReconnectTimeout: 300
        });
        this.client1 = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: this.serverURL1, username: 'SessionTrackerTestUser1'});
        this.client2 = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: this.serverURL2, username: 'SessionTrackerTestUser2'});
        this.client3 = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: this.serverURL3, username: 'SessionTrackerTestUser3'});
    },

    tearDown: function($super) {
        $super();
        this.client1.unregister();
        this.client2.unregister();
        this.client3.unregister();
        lively.net.SessionTracker.removeSessionTrackerServer(this.serverURL1);
        lively.net.SessionTracker.removeSessionTrackerServer(this.serverURL2);
        lively.net.SessionTracker.removeSessionTrackerServer(this.serverURL3);
    }
},
'testing', {
    testConnect2Servers: function() {
        var c1 = this.client1, c2 = this.client2;
        c1.register(); c2.register();
        this.waitFor(function() { return c1.isConnected() && c2.isConnected(); }, 50, function() {
            c1.initServerToServerConnect(this.serverURL2);
            connect(c1.webSocket, 'initServerToServerConnectResult', this, 'serverToServerConnectDone');
        });
        this.waitFor(function() { return !!this.serverToServerConnectDone; }, 100, function() {
            c1.getSessions(function(sessions) {
                var remoteSessions = sessions[c2.trackerId],
                    expected = [{id: c2.sessionId, worldURL: URL.source.toString(), user: 'SessionTrackerTestUser2'}];
                this.assertMatches(expected, remoteSessions);
                this.done();
            }.bind(this));            
        });
    },
    testReconnectServerToServerConnection: function() {
        var c1 = this.client1, c2 = this.client2;
        c1.register(); c2.register();
        this.waitFor(function() { return c1.isConnected() && c2.isConnected(); }, 50, function() {
            c1.initServerToServerConnect(this.serverURL2);
            connect(c1.webSocket, 'initServerToServerConnectResult', this, 'serverToServerConnectDone');
        });
        this.waitFor(function() { return !!this.serverToServerConnectDone; }, 100, function() {
            lively.net.SessionTracker.removeSessionTrackerServer(this.serverURL2);
            this.delay(function() { this.server2Shutdown = true; }, 200);
        });
        this.waitFor(function() { return !!this.server2Shutdown; }, 100, function() {
            lively.net.SessionTracker.createSessionTrackerServer(this.serverURL2);
        });
        this.delay(function() {
            c1.getSessions(function(sessions) {
                var s = sessions[c2.trackerId];
                this.assert(!!s, 'Not connected to server 2?');
                this.assert(!s.error, 'session response got error: ' + s.error);
                this.done();
            }.bind(this));            
        }, 700);
    },


    testRemoteEvalWith2Servers: function() {
        var c1 = this.client1, c2 = this.client2;
        c1.register(); c2.register();
        c2.openForRemoteEvalRequests();
        this.waitFor(function() { return c1.isConnected() && c2.isConnected(); }, 50, function() {
            c1.initServerToServerConnect(this.serverURL2);
            connect(c1.webSocket, 'initServerToServerConnectResult', this, 'serverToServerConnectDone');
        });
        this.waitFor(function() { return !!this.serverToServerConnectDone; }, 100, function() {
            c1.remoteEval(c2.sessionId, '1+2', function(result) {
                this.assertMatches({data: {result: "3"}}, result, 'remote eval result: ' + Objects.inspect(result));
                this.done();
            }.bind(this));
        });
    },
    testConnect3Servers: function() {
        this.done();
        return;
        // one server is the "central" ther others clients
        var c1 = this.client1, c2 = this.client2, c3 = this.client3;
        c1.register(); c2.register(); c3.register();
        this.waitFor(function() { return c1.isConnected() && c2.isConnected() && c3.isConnected(); }, 50, function() {
            c1.initServerToServerConnect(this.serverURL3);
            c2.initServerToServerConnect(this.serverURL3);
            connect(c1.webSocket, 'initServerToServerConnectResult', this, 'serverToServerConnectDone1');
            connect(c2.webSocket, 'initServerToServerConnectResult', this, 'serverToServerConnectDone2');
        });
        this.waitFor(function() { return !!this.serverToServerConnectDone1 && !!this.serverToServerConnectDone2; }, 100, function() {
            c3.getSessions(function(sessions) {
                var expected = {};
                expected[this.serverURL1.toString().replace(/^http/, 'ws') + 'connect'] = {
                    id: c1.sessionId, worldURL: URL.source.toString(), user: 'SessionTrackerTestUser2'
                }
                expected[this.serverURL2.toString().replace(/^http/, 'ws') + 'connect'] = {
                    id: c2.sessionId, worldURL: URL.source.toString(), user: 'SessionTrackerTestUser2'
                }
                show(sessions);
                this.assertMatches(expected, sessions);
                this.done();
            }.bind(this));
        });
    },});

}) // end of module