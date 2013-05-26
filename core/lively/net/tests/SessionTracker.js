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
            var expected = {
                id: this.sut.sessionId,
                worldURL: URL.source.toString(),
                user: "SessionTrackerTestUser"
            };
            var localSessions = sessions[this.sut.trackerId];
            this.assert(1, Object.keys(localSessions).length, 'more than one local session?')
            this.assertMatches(expected, localSessions[this.sut.sessionId]);
            this.assert(!!localSessions[this.sut.sessionId].remoteAddress, 'ip not included');
            this.done();
        }.bind(this));
    },

    testUnregister: function() {
        var cameOnline = false, trackerId;
        this.sut.register();
        this.sut.whenOnline(function() {
            cameOnline = true;
            trackerId = this.sut.trackerId;
            this.sut.unregister();
        }.bind(this));
        this.waitFor(function() { return cameOnline; }, 100, function() {
            var sessions = lively.net.SessionTracker.getServerStatus()[this.serverURL.pathname],
                expected = {}; expected[trackerId] = {};
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
            this.assertEquals(1, Object.keys(sessions[id]).length, 'session removed to early?');
            this.delay(function() {
                var sessions = lively.net.SessionTracker.getServerStatus()[this.serverURL.pathname];
                this.assertEquals(0, Object.keys(sessions[id]).length, 'session not removed');
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
                this.assertEquals(1, Object.keys(sessions[this.sut.trackerId]).length, 'session not re-registered');
                this.done();
            }.bind(this));
        }, 700);
    },

    testRemoteEval: function() {
        this.sut.register();
        this.sut.openForRequests();
        Global.remoteEvalHappened = false;
        var expr = 'Global.remoteEvalHappened = true; 1 + 3';
        this.sut.remoteEval(this.sut.sessionId, expr, function(result) {
            this.assertMatches({data: {result: '4'}}, result);
            this.assert(Global.remoteEvalHappened, 'remoteEvalHappened no set');
            delete Global.remoteEvalHappened;
            this.done();
        }.bind(this));
    },
    testCopy: function() {
        this.sut.register();
        this.sut.openForRequests();
        var morph = lively.newMorph();
        this.sut.sendObjectTo(this.sut.sessionId, morph, {withObjectDo: function(copy) { copy.name = 'remoteCopy'; copy.openInWorldCenter(); }}, function(result) {
            var w = lively.morphic.World.current();
            try {
                this.assert(w.get('remoteCopy'));
            } finally {
                w.get('remoteCopy').remove();
            }
            this.done();
        }.bind(this));
    },


    testSendAndAnswerMessage: function() {
        var receivedMsg, received = 0, answered = 0, answerAnswered = 0;
        this.sut.register({
            hello: function(msg) {
                received++; receivedMsg = msg;
                this.sut.answer(msg, {bar: 'hehe'});
            }.bind(this)
        });
        this.sut.sendTo(this.sut.sessionId, 'hello', {foo: 1}, function(result) {
            answerMsg = result; answered++; });
        this.waitFor(function() { return answered > 0; }, 100, function() {
            this.assert(received, 'no message received');
            this.assertMatches({action: 'hello', data: {foo: 1}}, receivedMsg, "receivedMessage");
            this.assertMatches({action: 'helloResult', data: {bar: 'hehe'}}, answerMsg, "receivedMessage");
            this.done();
        });
    },

    testReportsLastActivity: function() {
        this.sut.activityTimeReportDelay = 50; // ms
        Global.LastEvent = {timeStamp: Date.now()}
        this.sut.register();
        var activity1, activity2;
        this.sut.getSessions(function(sessions) {
            activity1 = sessions[this.sut.trackerId][this.sut.sessionId].lastActivity;
            Global.LastEvent.timeStamp++;
        }.bind(this));
        this.delay(function() {
            this.sut.getSessions(function(sessions) {
                activity2 = sessions[this.sut.trackerId][this.sut.sessionId].lastActivity;
            }.bind(this));
        }, 200);
        this.delay(function() {
            this.assert(activity1 < activity2, 'Activity not updated ' + activity1 + ' vs ' + activity2);
            this.done();
        }, 300);
    },
    testMessageRouting: function() {
        var sendDone = false, receivedData;
        this.sut.register({'self-send': function(msg) { receivedData = msg; sendDone = true; }});
        this.sut.sendTo(this.sut.sessionId, 'self-send', 'foo')
        this.waitFor(function() { return !!sendDone; }, 20, function() {
            this.assertEquals('foo', receivedData.data);
            this.done()
        });
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
            inactiveSessionRemovalTime: 200, server2serverReconnectTimeout: 200});
        lively.net.SessionTracker.createSessionTrackerServer(this.serverURL2, {
            inactiveSessionRemovalTime: 200, server2serverReconnectTimeout: 200});
        lively.net.SessionTracker.createSessionTrackerServer(this.serverURL3, {
            inactiveSessionRemovalTime: 200, server2serverReconnectTimeout: 200});
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
        var c1 = this.client1, c2 = this.client2,
            serverToServerConnectDone = false;
        c1.register(); c2.register();
        this.waitFor(function() { return c1.isConnected() && c2.isConnected(); }, 50, function() {
            c1.initServerToServerConnect(this.serverURL2, null, function(response) {
                serverToServerConnectDone = true; });
        });
        this.waitFor(function() { return !!serverToServerConnectDone; }, 100, function() {
            c1.getSessions(function(sessions) {
                var remoteSessions = sessions[c2.trackerId],
                    expected = {id: c2.sessionId, worldURL: URL.source.toString(), user: 'SessionTrackerTestUser2'};
                this.assertEquals(1, Object.keys(remoteSessions).length, 'more than one session registered?');
                this.assertMatches(expected, remoteSessions[c2.sessionId]);
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
            this.delay(function() { this.server2Shutdown = true; }, 100);
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
        var c1 = this.client1, c2 = this.client2,
            serverToServerConnectDone = false;
        c1.register(); c2.register();
        c2.openForRequests();
        this.waitFor(function() { return c1.isConnected() && c2.isConnected(); }, 50, function() {
            c1.initServerToServerConnect(this.serverURL2, null, function() { serverToServerConnectDone = true; });
        });
        this.waitFor(function() { return serverToServerConnectDone; }, 100, function() {
            c1.remoteEval(c2.sessionId, '1+2', function(result) {
                this.assertMatches({data: {result: "3"}}, result, 'remote eval result: ' + Objects.inspect(result));
                this.done();
            }.bind(this));
        });
    },
    testConnect3Servers: function() {
        // one server is the "central" ther others clients
        var c1 = this.client1, c2 = this.client2, c3 = this.client3,
            sessionTestsRun = 0, remoteEvalRun = 0,
            serverToServerConnectDone1 = false, serverToServerConnectDone2 = false;
        c1.register(); c2.register(); c3.register();
        this.waitFor(function() { return c1.isConnected() && c2.isConnected() && c3.isConnected(); }, 50, function() {
            c1.initServerToServerConnect(this.serverURL3, null, function() { serverToServerConnectDone1 = true; });
            c2.initServerToServerConnect(this.serverURL3, null, function() { serverToServerConnectDone2 = true; });
        });
        this.waitFor(function() { return !!serverToServerConnectDone1 && !!serverToServerConnectDone2; }, 100, function() {
            // test session state
            var expected = {};
            expected[c1.trackerId] = {}; expected[c1.trackerId][c1.sessionId] = {
                id: c1.sessionId, worldURL: URL.source.toString(), user: 'SessionTrackerTestUser1'};
            expected[c2.trackerId] = {}; expected[c2.trackerId][c2.sessionId] = {
                id: c2.sessionId, worldURL: URL.source.toString(), user: 'SessionTrackerTestUser2'};
            expected[c3.trackerId] = {}; expected[c3.trackerId][c3.sessionId] = {
                id: c3.sessionId, worldURL: URL.source.toString(), user: 'SessionTrackerTestUser3'};
            c3.getSessions(function(sessions) {
                this.assertMatches(expected, sessions, 'sessions c3');
                sessionTestsRun++;
            }.bind(this));
            c2.getSessions(function(sessions) {
                this.assertMatches(expected, sessions, 'sessions c2');
                sessionTestsRun++;
            }.bind(this));
            c1.getSessions(function(sessions) {
                this.assertMatches(expected, sessions, 'sessions c1');
                sessionTestsRun++;
            }.bind(this));
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            // test messaging
            c1.openForRequests(); c2.openForRequests(); c3.openForRequests();
            c1.remoteEval(c3.sessionId, '1+2;', function(msg) {
                this.assertEqualState({result: '3'}, msg.data, Objects.inspect(msg));
                remoteEvalRun++;
            }.bind(this));
            // TODO make central -> local messages work
            c3.remoteEval(c1.sessionId, '1+2;', function(msg) {
                this.assertEqualState({result: '3'}, msg.data, Objects.inspect(msg));
                remoteEvalRun++;
            }.bind(this));
            // TODO make local -> central -> local messages work
            c1.remoteEval(c2.sessionId, '1+2;', function(msg) {
                this.assertEqualState({result: '3'}, msg.data, Objects.inspect(msg));
                remoteEvalRun++;
            }.bind(this));
        });
        this.waitFor(function() { return remoteEvalRun === 3; sessionTestsRun === 3; }, 100, function() {
            this.done();
        });
    },
    testReportedSessionCleanup: function() {
        var c1 = this.client1, c2 = this.client2, serverToServerConnectDone1 = false;
        c1.register(); c2.register();
        this.waitFor(function() { return c1.isConnected() && c2.isConnected(); }, 50, function() {
            c1.initServerToServerConnect(this.serverURL2, null, function() { serverToServerConnectDone1 = true; });
        });
        this.waitFor(function() { return serverToServerConnectDone1; }, 100, function() {
            lively.net.SessionTracker.removeSessionTrackerServer(this.serverURL1);
            this.delay(function() {
                c2.getSessions(function(sessions) {
                    this.assertEquals(1, Object.keys(sessions).length, 'Dead session not removed?');
                    this.done();
                }.bind(this));            
            }, 400);
        });
    },});

}) // end of module