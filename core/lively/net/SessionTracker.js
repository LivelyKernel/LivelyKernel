module('lively.net.SessionTracker').requires('lively.Network').toRun(function() {

Object.subclass('lively.net.SessionTrackerConnection',
'initializing', {
    initialize: function(options) {
        this.sessionId = null; // id of this session, defined when connected
        this.trackerId = null; // id of the tracker endpoint on the server, defined when connected
        this.sessionTrackerURL = options.sessionTrackerURL;
        this.username = options.username;
        this._status = 'disconnected';
        this._heartbeatProcess = null;
        this.registerTimeout = options.registerTimeout || 60*1000; // ms
        this.activityTimeReportDelay = options.activityTimeReportDelay || 20*1000; // ms
        // a value other than null will enable session caching, i.e.
        // this.getSessions will only do a request at most as specified by timeout
        this.getSessionsCacheInvalidationTimeout = options.getSessionsCacheInvalidationTimeout || null;
        this.timeOfCreation = Date.now(); // UNIX timestamp
    }
},
'l2l state storage', {
    getL2lStore: function(path) {
        return lively.LocalStorage.get('lively2lively' + path);
    },
    setL2lStore: function(path, val) {
        return lively.LocalStorage.set('lively2lively'+path, val);
    }
},
'net accessors', {

    getWebResource: function(subServiceName) {
        var url = this.sessionTrackerURL;
        if (subServiceName) url = url.withFilename(subServiceName);
        return url.asWebResource();
    },

    getWebSocket: function() {
        if (this.webSocket) return this.webSocket;
        var url = this.sessionTrackerURL.withFilename('connect');
        this.webSocket = new lively.net.WebSocket(url, {protocol: "lively-json", enableReconnect: true});
        lively.bindings.connect(this.webSocket, 'error', this, 'connectionError');
        this.listen();
        return this.webSocket;
    },

    resetConnection: function() {
        this.stopHeartbeat();
        this._status = 'disconnected';
        var ws = this.webSocket;
        if (!ws) return;
        // in case connection wasn't established yet
        lively.bindings.disconnect(ws, 'error', this, 'connectionError');
        ws.close();
        this.webSocket = null;
    },

    restart: function(cb) {
        this.resetConnection();
        cb && this.whenOnline(function() { cb(); });
        this.register();
    },

    send: function(action, jso, callback) {
        if (!this.sessionId) { throw new Error('Need sessionId to interact with SessionTracker!') }
        var msg;
        if (arguments.length === 1) {
            var options = arguments[0];
            callback = options.callback;
            msg = {
                sender: this.sessionId,
                action: options.action,
                data: options.data || {}
            }
            if (options.inResponseTo) msg.inResponseTo = options.inResponseTo;
            if (options.target) msg.target = options.target;
        } else {
            msg = {
                sender: this.sessionId,
                action: action,
                data: jso
            }
        }
        return this.getWebSocket().send(msg, {}, callback);
    },

    sendTo: function(targetId, action, data, callback) {
        return this.send({action: action, data: data, target: targetId, callback: callback});
    },

    answer: function(msg, data, callback) {
        if (!msg.messageId) { throw new Error('Cannot answer message without messageId!'); }
        if (!msg.sender) { throw new Error('Cannot answer message without sender!'); }
        return this.send({inResponseTo: msg.messageId, action: msg.action+'Result', data: data, target: msg.sender, callback: callback});
    },

    listen: function() {
        var ws = this.webSocket;
        lively.bindings.connect(ws, 'lively-message', this, 'dispatchLivelyMessage', {
            updater: function($upd, msg) { $upd(msg, session); },
            varMapping: {session: this}});
    },

    isConnected: function() {
        return this._status === 'connected' && !!this.sessionId;
    }

},
'server management', {

    resetServer: function() {
        return this.getWebResource('reset').beSync().post('reset').content;
    },

    getSessions: function(cb, forceFresh) {
        var getSessionsTimeout = 3000;
        var to = this.getSessionsCacheInvalidationTimeout;
        var session = this;
    
        if (!forceFresh && to && this._getSessionsCachedResult) {
            cb && cb(this._getSessionsCachedResult); return; }
    
        function sendSessionsQuery(thenDo) {
            session.sendTo(session.trackerId, 'getSessions', {}, function(msg) {
                var sessions = msg && msg.data; cb;
                if (to) {
                    session._getSessionsCachedResult = sessions;
                    (function() { session._getSessionsCachedResult = null; }).delay(to/1000);
                }
                thenDo(null, sessions);
            });
        }
    
        var proc = Functions.workerWithCallbackQueue(
            session.sessionId + '-getSessions',
            sendSessionsQuery, getSessionsTimeout);

        proc.whenDone(function(err, sessions) { cb(sessions || {}); });
    },

    setUserName: function(username) {
        this.username = username;
        this.whenOnline(function() { this.register(); }.bind(this));
    },

    getUserInfo: function(thenDo) {
        // flatten the session data and group by user so that it becomes
        // easier to consume
        this.getSessions(function(sessions) {
            var result = {};
            for (var trackerId in sessions) {
                for (var sessionId in sessions[trackerId]) {
                    if (!sessions[trackerId]) { continue; }
                    var session = sessions[trackerId][sessionId];
                    var sessionList = result[session.user] || (result[session.user] = []);
                    sessionList.push({
                        id: sessionId,
                        tracker: trackerId,
                        worldURL: session.worldURL,
                        lastActivity: session.lastActivity,
                        remoteAddress: session.remoteAddress
                    });
                }
            }
            thenDo(result);
        });
    },

    stopHeartbeat: function() {
        if (this._heartbeatProcess) Global.clearInterval(this._heartbeatProcess);
    },

    ensureHeartbeatProcess: function() {
        var interval = lively.Config.get("lively2livelyTrackerHeartbeatInterval");
        if (!interval) return;
        this.stopHeartbeat();
        var session = this;
        this._heartbeatProcess = Global.setInterval(function() {
            session.sendHeartbeat(function(err, roundtripTime) {
                if (err) console.error("%s heartbeat error: %s", session, err);
                lively.Config.get("lively2livelyLogHeartbeatRoundtripTime") && console.log("l2l heartbeat roundtrip time %s ms", roundtripTime);
            });
        }, interval);
    },

    sendHeartbeat: function(thenDo) {
        var session = this;
        var heartbeatTimeout = 3000;

        function sendHeartbeat(thenDo) {
            var startTime = Date.now();
            session.sendTo(session.trackerId, 'heartbeat', {}, function(msg) {
                thenDo(msg.data.error ? msg.data.error : null, Date.now() - startTime);
            });
        }

        var proc = Functions.workerWithCallbackQueue(
            session.sessionId + '-heartbeat',
            sendHeartbeat, heartbeatTimeout);

        proc.whenDone(function(err, responseTime) {
            if (err && err.message === 'timeout') session.restart(function() {
                session.sendHeartbeat(thenDo); })
            else if (err) thenDo(err, null);
            else thenDo(null, responseTime);
        });

    }

},
'session management', {

    whenOnline: function(thenDo) {
        if (this.isConnected()) { thenDo(); return; }
        lively.bindings.connect(this, 'established', thenDo, 'call', {
            removeAfterUpdate: true});
    },

    connectionEstablished: function(msg) {
        // In case we have removed the connection already
        if (!this.webSocket || !this.sessionId) return;
        this._status = 'connected';
        this.trackerId = msg.data && msg.data.tracker && msg.data.tracker.id;
        lively.bindings.connect(this.webSocket, 'closed', this, 'connectionClosed', {
            removeAfterUpdate: true});
        lively.bindings.signal(this, 'established', this);
        this.startReportingActivities();
        console.log('%s established', this.toString(true));
    },

    connectionClosed: function() {
        if (this.sessionId && this.status() === 'connected') { this._status = 'connecting'; this.register(); }
        else { this._status = 'disconnected'; this.stopHeartbeat(); lively.bindings.signal(this, 'closed', this); }
        console.log('%s closed', this.toString(true));
    },

    connectionError: function(err) {
        console.log('connection error in %s:\n%o', this.toString(true),
            err && err.message ? err.message : err);
    },

    register: function(actions) {
        // sends a request to the session tracker to register a connection
        // pointing to this session connection/id
        if (!this.sessionId) this.sessionId = 'client-session:' + Strings.newUUID();
        var timeoutCheckPeriod = this.registerTimeout / 1000; // seconds
        var session = this;
        (function timeoutCheck() {
            if (session.isConnected() || !session.sessionId) return;
            session.resetConnection();
            session.register();
        }).delay(Numbers.random(timeoutCheckPeriod-5, timeoutCheckPeriod+5)); // to balance server load
        actions && (this.actions = actions);
        this.whenOnline(this.listen.bind(this));
        this.whenOnline(this.ensureServerToServerConnection.bind(this));
        this.whenOnline(this.ensureHeartbeatProcess.bind(this));
        this.send('registerClient', {
            id: this.sessionId,
            worldURL: URL.source.toString(),
            user: this.username || 'anonymous',
            lastActivity: Global.LastEvent && Global.LastEvent.timeStamp,
            timeOfCreation: this.timeOfCreation,
        }, this.connectionEstablished.bind(this));
    },

    unregister: function() {
        if (this.sessionId) this.sendTo(this.trackerId, 'unregisterClient', {});
        this.resetConnection();
        this.sessionId = null;
        this.trackerId = null;
        this.stopReportingActivities();
    },

    ensureServerToServerConnection: function() {
        var livelyCentral = Config.get('lively2livelyCentral');
        if (!livelyCentral) return;
        var now = Date.now(), last = this.getL2lStore('serverToServerConnect.'+livelyCentral);
        if (last && (now-last < 5*1000)) return;
        this.setL2lStore('serverToServerConnect.'+livelyCentral, now);
        this.initServerToServerConnect(livelyCentral);
    },

    initServerToServerConnect: function(serverURL, options, cb) {
        options = options || {}
        var url = serverURL.toString().replace(/^http/, 'ws')
        this.sendTo(this.trackerId, 'initServerToServerConnect', {url: url, options: options}, cb);
    },

    initServerToServerDisconnect: function(cb) {
        this.sendTo(this.trackerId, 'initServerToServerDisconnect', {}, cb);
    }

},
'specific messages', {

    dispatchLivelyMessage: function(msg, session) {
        var actions = this.getActions(),
            action = actions[msg.action];
        lively.bindings.signal(session, 'message', {message: msg, session: session});
        if (action) action(msg, session);
        else if (actions.messageNotUnderstood) actions.messageNotUnderstood(msg, session);
    },

    getActions: function() {
        return Object.extend(Object.extend({}, lively.net.SessionTracker.defaultActions), this.actions);
    },

    addActions: function(actions) {
        return Object.extend(this.actions, actions);
    },

    remoteEval: function(targetId, expression, thenDo) {
        this.sendTo(targetId, 'remoteEvalRequest', {expr: expression}, thenDo);
    },

    openForRequests: function() {
        if (!this.actions) this.actions = {};
        this.listen();
    },

    sendObjectTo: function(targetId, obj, options, callback) {
        if (!Object.isFunction(obj.copy)) { throw new Error('object needs to support #copy for being send'); }
        var stringifiedCopy = obj.copy(true/*stringify*/);
        if (!Object.isString(stringifiedCopy)) { throw new Error('object needs to return a string to copy(true)'); }
        withObjectDo = options.withObjectDo;
        if (Object.isFunction(withObjectDo)) withObjectDo = '(' + String(withObjectDo) + ')';
        this.sendTo(targetId, 'copyObject', {object: stringifiedCopy, withObjectDo: withObjectDo}, callback);
    }

},
'reporting', {
    startReportingActivities: function() {
        var session = this;
        function report() {
            function next() { session._reportActivitiesTimer = report.delay(session.activityTimeReportDelay/1000); }
            if (!session.isConnected()) return;
            var timeStamp = Global.LastEvent && Global.LastEvent.timeStamp;
            if (!timeStamp || timeStamp === session._lastReportedActivity) { next(); return; }
            session._lastReportedActivity = timeStamp;
            session.sendTo(session.trackerId, 'reportActivity', {lastActivity: timeStamp}, next);
        }
        report();
    },

    stopReportingActivities: function() {
        clearTimeout(this._reportActivitiesTimer);
        delete this._reportActivitiesTimer;
    }
},
'debugging', {
    status: function() { return this._status; },
    toString: function(shortForm) {
        if (!this.webSocket || !this.webSocket.isOpen() || shortForm) {
            return Strings.format("Session connection to %s", this.sessionTrackerURL);
        }
        return Strings.format("Session %s to %s\n  id: %s\n  user: %s",
            this.status(), this.sessionTrackerURL, this.sessionId, this.username);
    }
});

Object.extend(lively.net.SessionTracker, {

    connections: {sessionCreated: {}, sessionClosed: {}},

    localSessionTrackerURL: (function() {
        var trackerBaseURL = Config.nodeJSWebSocketURL || Config.nodeJSURL;
        return URL.create(trackerBaseURL + '/').withFilename('SessionTracker/');
    })(),

    _sessions: lively.net.SessionTracker._sessions || {},

    defaultActions: {

        reportServices: function(msg, session) {
            session.answer(msg, {services: Object.keys(session.getActions())});
        },

        remoteEvalRequest: function(msg, session) {
            var result;
            if (!Config.get('lively2livelyAllowRemoteEval')) {
                result = 'remote eval disabled';
            } else {
                // show('doRemoteEval %o', msg);
                try {
                    result = eval(msg.data.expr);
                } catch(e) {
                    result = e + '\n' + e.stack;
                }
            }
            session.answer(msg, {result: String(result)});
        },

        completions: function(msg, session) {
            lively.require('lively.ide.codeeditor.Completions').toRun(function() {
                var lister = new lively.ide.codeeditor.Completions.ProtocolLister();
                var completions = lister.getCompletions(
                    msg.data.expr,
                    function(string) { return eval(string); });
                session.answer(msg, completions);
            });
        },

        copyObject: function(msg, session) {
            var obj, result = '', error = null, withObjectDo = msg.data.withObjectDo;
            try {
                obj = lively.persistence.Serializer.deserialize(msg.data.object)
                if (Object.isString(withObjectDo)) {
                    withObjectDo = eval(withObjectDo);
                    withObjectDo && withObjectDo(obj);
                }
                result = "Object successfully received";
            } catch(e) {
                error = e + '\n' + e.stack;
            }
            session.answer(msg, {result: String(result), error: error});
        },

        askFor: function(msg, session) {
            var query = msg.data.query,
                promptMethod = query.match(/password|sudo/i) ? 'passwordPrompt' : 'prompt';
            $world[promptMethod](query, function(input) {
                session.answer(msg, {answer: input});
            });
        },

        openEditor: function(msg, session) {
            var args = msg.data.args;
            if (!args.length) {
                session.answer(msg, {error: 'no file specified'});
                return;
            }

            lively.ide.openFileAsEDITOR(args[0], function(err, status) {
                session.answer(msg, err ? {error: String(err)} : {status: status});
            });

        },

        chatMessage: function(msg, session) {
            lively.log('Got chat message from %s: %s', msg.data.user, msg.data.message);
            var chat = $morph('Lively2LivelyChat');
            if (!chat) {
                var spec = lively.BuildSpec('lively.net.tools.Lively2LivelyChat');
                if (spec) {
                    chat = spec.createMorph().openInWorldCenter().comeForward().targetMorph;
                    chat.selectUser(msg.data.user);
                }
            }
            if (chat) {
                chat = chat.targetMorph || chat;
                chat.addText(msg.data.user + ': ' + msg.data.message);
            }
            session.answer(msg, {message: 'chat message received', error: null});
        },

        messageNotUnderstood: function(msg, session) {
            show('Lively2Lively message not understood:\n%o', msg);
            session.answer(msg, {error: 'messageNotUnderstood'});
        }

    },

    registerActions: function(actions) {
        return Object.extend(this.defaultActions, actions);
    },

    getSession: function(optURL) {
        return this._sessions[optURL || this.localSessionTrackerURL];
    },

    createSession: function(optURL) {
        var url = optURL || this.localSessionTrackerURL;
        var s = this.getSession(url);
        if (s) return s;
        var user = lively.morphic.World.current().getUserName(true) || 'unknown';
        if (!user) {
            console.warn('Cannot register lively session because no user is logged in');
            return;
        }
        this._sessions[url] = s = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: url,
            username: user,
            getSessionsCacheInvalidationTimeout: 10*1000
        });
        s.register();
        s.openForRequests();
        if (!this._onBrowserShutdown) {
            this._onBrowserShutdown = Global.addEventListener('beforeunload', function(evt) {
                lively.net.SessionTracker.closeSessions();
                // since this is also called when the user is just asked if she
                // wants to navigate to another page, we might stay after all...
                // re-establish the connection in those cases after a few seconds:
                (function() {
                    lively.net.SessionTracker.createSession();
                }).bind(this).delay(10);
            }, true);
        }
        lively.bindings.signal(this, 'sessionCreated', s);
        return s;
    },

    closeSession: function(optURL) {
        var url = optURL || this.localSessionTrackerURL,
            session = this._sessions[url];
        if (!session) return;
        session.unregister();
        delete this._sessions[url];
        lively.bindings.signal(this, 'sessionClosed', session);
    },

    closeSessions: function() {
        Object.keys(this._sessions).forEach(function(url) {
            this.closeSession(url); }, this)
    },

    createSessionTrackerServer: function(url, options) {
        options = Object.extend(options || {}, {route: url.pathname});
        var msg = JSON.stringify({action: 'createServer', options: options});
        this.localSessionTrackerURL.withFilename('server-manager').asWebResource().beSync().post(msg, 'application/json');
    },

    removeSessionTrackerServer: function(url) {
        var msg = JSON.stringify({action: 'removeServer', route: url.pathname});
        this.localSessionTrackerURL.withFilename('server-manager').asWebResource().beSync().post(msg, 'application/json');
    },

    getServerStatus: function() {
        return this.localSessionTrackerURL.withFilename('sessions/all').asWebResource().get().getJSON();
    },

    resetSession: function() {
        // s=lively.net.SessionTracker.resetSession()
        var s = this.getSession();
        s && s.isConnected() && s.initServerToServerDisconnect();
        this.closeSessions();
        s = this.createSession();
        s.ensureServerToServerConnection();
        return s;
    },

    isConnected: function() {
        var s = this.getSession();
        return s && s.isConnected();
    }

});

Object.extend(lively.net.SessionTracker, {
    serverLogin: function(thenDo) {
        var data = {
            username: $world.getUserName(true),
            email: null,
            currentWorld: String(URL.source)
        };
        URL.root.withFilename('login').asWebResource()
            .beAsync().post(JSON.stringify(data), 'application/json')
            .withJSONWhenDone(function(creds, status) {
                if (creds) {
                    creds.username && lively.Config.set("UserName", creds.username);
                    creds.group && lively.Config.set("UserGroup", creds.group);
                    creds.email && lively.Config.set("UserEmail", creds.email);
                    if (data.username !== creds.username) lively.Config.loadUserConfigModule();
                }
                thenDo && thenDo(status.isSuccess() ? null : status); });
    },

    setupSessionTrackerConnection: function(thenDo) {
        if (UserAgent.isNodejs || UserAgent.isWorker) return;
        if (!lively.Config.get('lively2livelyAutoStart')) return;
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // 1) connect to tracker
        console.log('setupSessionTrackerConnection');
        lively.net.SessionTracker.resetSession();
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // start UI
        if (lively.Config.get('lively2livelyEnableConnectionIndicator')) {
            lively.require('lively.net.tools.Lively2Lively').toRun(function() {
                if ($world.get('Lively2LivelyStatus')) $world.get('Lively2LivelyStatus').remove();
                lively.BuildSpec('lively.net.tools.ConnectionIndicator').createMorph();
            });
        }
        thenDo && thenDo();
    }
});

Object.extend(lively.net.SessionTracker, {
    sessionLister: {
        withSessionListDo: function(session, doFunc, forceFresh) {
            if (!session || !session.isConnected()) { doFunc(new Error('Not connected'), []); return; }
            session.getSessions(function(remotes) {
                var list = Object.keys(remotes).map(function(trackerId) {
                    return Object.keys(remotes[trackerId]).map(function(sessionId) {
                        return remotes[trackerId][sessionId]; });
                }).flatten();
                doFunc(null, list);
            }, forceFresh);
        }
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// initialization, at load time
(function serverLogin() {
    lively.whenLoaded(function(world) {
        Functions.composeAsync(
            lively.net.SessionTracker.serverLogin,
            lively.net.SessionTracker.setupSessionTrackerConnection
        )(function(err) { console.log("lively.set.SessionTracker setup done"); });
    });
})();

}) // end of module
