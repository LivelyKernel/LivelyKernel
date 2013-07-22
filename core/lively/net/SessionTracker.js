module('lively.net.SessionTracker').requires('lively.Network').toRun(function() {

Object.subclass('lively.net.SessionTrackerConnection',
'initializing', {
    initialize: function(options) {
        this.sessionId = null; // id of this session, defined when connected
        this.trackerId = null; // id of the tracker endpoint on the server, defined when connected
        this.sessionTrackerURL = options.sessionTrackerURL;
        this.username = options.username;
        this._status = 'disconnected';
        this.registerTimeout = options.registerTimeout || 60*1000; // ms
        this.activityTimeReportDelay = options.activityTimeReportDelay || 20*1000; // ms
        // a value other than null will enable session caching, i.e.
        // this.getSessions will only do a request at most as specified by timeout
        this.getSessionsCacheInvalidationTimeout = options.getSessionsCacheInvalidationTimeout || null;
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
        this._status = 'disconnected';
        var ws = this.webSocket;
        if (!ws) return;
        // in case connection wasn't established yet
        lively.bindings.disconnect(ws, 'error', this, 'connectionError');
        ws.close();
        this.webSocket = null;
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

    getSessions: function(cb) {
        // if timeout specified throttle requests so that they happen at most
        // timeout-often
        var to = this.getSessionsCacheInvalidationTimeout;
        if (to && this._getSessionsCachedResult) {
            cb && cb(this._getSessionsCachedResult); return; }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // queue requests
        var self = this;
        if (!this._getSessionsQueue) this._getSessionsQueue = [];
        this._getSessionsQueue.push(cb);
        if (this._getSessionsInProgress) return;
        // start request if currently no one ongoing
        this._getSessionsInProgress = true;
        this.sendTo(this.trackerId, 'getSessions', {}, function(msg) {
            self._getSessionsInProgress = false;
            var sessions = msg && msg.data; cb;
            if (to) {
                self._getSessionsCachedResult = sessions;
                (function() { self._getSessionsCachedResult = null; }).delay(to/1000);
            }
            while ((cb = self._getSessionsQueue.shift())) cb && cb(sessions);
        });
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
        lively.bindings.signal(this, 'established');
        this.startReportingActivities();
        console.log('%s established', this.toString(true));
    },

    connectionClosed: function() {
        if (this.sessionId && this.status() === 'connected') { this._status = 'connecting'; this.register(); }
        else { this._status = 'disconnected'; lively.bindings.signal(this, 'closed'); }
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
        this.send('registerClient', {
            id: this.sessionId,
            worldURL: URL.source.toString(),
            user: this.username || 'anonymous',
            lastActivity: Global.LastEvent && Global.LastEvent.timeStamp
        }, this.connectionEstablished.bind(this));
    },

    unregister: function() {
        if (this.sessionId) this.sendTo(this.trackerId, 'unregisterClient', {});
        this.resetConnection();
        this.sessionId = null;
        this.trackerId = null;
        this.stopReportingActivities();
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
        if (action) action(msg, session);
        else if (actions.messageNotUnderstood) actions.messageNotUnderstood(msg, session);
    },

    getActions: function() {
        return Object.extend(Object.extend({}, this.constructor.defaultActions), this.actions);
    },

    remoteEval: function(targetId, expression, thenDo) {
        this.sendTo(targetId, 'remoteEvalRequest', {expr: expression}, thenDo);
    },

    openForRequests: function() {
        if (!this.actions) this.actions = Object.extend({}, lively.net.SessionTracker.defaultActions);
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

    localSessionTrackerURL: URL.create((Config.nodeJSWebSocketURL || Config.nodeJSURL) + '/').withFilename('SessionTracker/'),
    _sessions: lively.net.SessionTracker._sessions || {},

    defaultActions: {
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
        chatMessage: function(msg, session) {
            lively.log('Got chat message from %s: %s', msg.data.user, msg.data.message);
            session.answer(msg, {message: 'chat message received', error: null});
        },
        messageNotUnderstood: function(msg, session) {
            show('Lively2Lively message not understood:\n%o', msg);
        }
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
        s = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: url,
            username: user,
            getSessionsCacheInvalidationTimeout: 10*1000
        });
        s.register();
        s.openForRequests();
        if (!this._onBrowserShutdown) {
            this._onBrowserShutdown = Global.addEventListener('beforeunload', function(evt) {
                lively.net.SessionTracker.closeSessions();
            }, true);
        }
        return this._sessions[url] = s;
    },

    closeSession: function(optURL) {
        var url = optURL || this.localSessionTrackerURL;
        if (!this._sessions[url]) return;
        this._sessions[url].unregister();
        delete this._sessions[url];
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
        return this.localSessionTrackerURL.asWebResource().get().getJSON();
    },

    resetSession: function() {
        // s=lively.net.SessionTracker.resetSession()
        var s = this.getSession();
        s && s.isConnected() && s.initServerToServerDisconnect();
        this.closeSessions();
        s = this.createSession();
        livelyCentral = Config.get('lively2livelyCentral');
        livelyCentral && s.initServerToServerConnect(livelyCentral);
        return s;
    }
});

(function setupSessionTrackerConnection() {
    if (UserAgent.isNodejs) return;
    lively.whenLoaded(function(world) {
        if (!Config.get('lively2livelyAutoStart')) return;
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // 1) connect to tracker
        var session = lively.net.SessionTracker.resetSession();
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // start UI
        if (Config.get('lively2livelyEnableConnectionIndicator')) {
            require('lively.net.tools.Lively2Lively').toRun(function() {
                if (world.get('Lively2LivelyStatus')) world.get('Lively2LivelyStatus').remove();
                lively.BuildSpec('lively.net.tools.ConnectionIndicator').createMorph();
            });
        }
    });
})();

}) // end of module