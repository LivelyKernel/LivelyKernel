module('lively.net.SessionTracker').requires('lively.Network').toRun(function() {

Object.subclass('lively.net.SessionTrackerConnection',
'initializing', {
    initialize: function(options) {
        this.sessionTrackerURL = options.sessionTrackerURL;
        this.username = options.username;
        this._status = 'disconnected';
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
        lively.bindings.connect(this.webSocket, 'registerClientResult', this, 'connectionEstablished');
        lively.bindings.connect(this.webSocket, 'error', this, 'connectionError');
        return this.webSocket;
    },

    resetConnection: function() {
        this._status = 'disconnected';
        var ws = this.webSocket;
        if (!ws) return;
        // in case connection wasn't established yet
        lively.bindings.disconnect(ws, 'registerClientResult', this, 'connectionEstablished');
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
        } else {
            msg = {
                sender: this.sessionId,
                action: action,
                data: jso
            }
        }
        this.getWebSocket().send(msg, {}, callback);
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
        // return this.getWebResource('sessions').beSync().get().getJSON();
        this.send('getSessions', {id: this.sessionId});
        lively.bindings.connect(this.getWebSocket(), 'getSessions', {callCb: cb}, 'callCb', {
            converter: function(msg) { return msg && msg.data; },
            removeAfterUpdate: true});
    }
},
'session management', {

    whenOnline: function(thenDo) {
        if (this.isConnected()) { thenDo(); return; }
        lively.bindings.connect(this, 'established', thenDo, 'call', {
            removeAfterUpdate: true});
    },

    connectionEstablished: function() {
        // In case we have removed the connection already
        if (!this.webSocket || !this.sessionId) return;
        this._status = 'connected';
        lively.bindings.connect(this.webSocket, 'closed', this, 'connectionClosed', {
            removeAfterUpdate: true});
        lively.bindings.signal(this, 'established');
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

    register: function() {
        if (!this.sessionId) this.sessionId = Strings.newUUID();
        this.send('registerClient', {
            id: this.sessionId,
            worldURL: URL.source.toString(),
            user: this.username || 'anonymous'
        });
    },

    unregister: function() {
        if (this.sessionId) this.send('unregisterClient', {id: this.sessionId});
        this.resetConnection();
        this.sessionId = null;
    },

    initServerToServerConnect: function(serverURL) {
        var url = serverURL.toString().replace(/^http/, 'ws')
        this.send('initServerToServerConnect', {url: url});
    }

},
'remote eval', {

    remoteEval: function(targetId, expression, thenDo) {
        // we send a remote eval request
        this.send('remoteEval', {target: targetId, expr: expression}, function(answer) {
            thenDo(answer && answer.data && answer.data.result); });
    },

    doRemoteEval: function(msg) {
        // we answer a remote eval request
        // show('doRemoteEval %o', msg);
        var result;
        try {
            result = eval(msg.data.expr);
        } catch(e) {
            result = e + '\n' + e.stack;
        }
        this.send({
            action: 'remoteEvalRequest',
            inResponseTo: msg.messageId,
            data: {result: String(result),origin: msg.data.origin}
        });
    },

    openForRemoteEvalRequests: function() {
        lively.bindings.connect(this.getWebSocket(), 'remoteEvalRequest', this, 'doRemoteEval');
    },
},
'sandbox', {
    useSandbox: function() {
        // test support. Since the session tracker has global state
        // we put it into a sandbox mode when running the tests
        var webR = this.getWebResource('sandbox').beSync();
        webR.post(JSON.stringify({start: true}), 'application/json');
        lively.assert(webR.status.isSuccess(), 'Could not set lively.net.SessionTracker into sandbox mode?');
    },
    removeSandbox: function() {
        var webR = this.getWebResource('sandbox').beSync();
        webR.post(JSON.stringify({stop: true}), 'application/json');
        lively.assert(webR.status.isSuccess(), 'Could not release lively.net.SessionTracker sandbox mode?');
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
        s = new lively.net.SessionTrackerConnection({sessionTrackerURL: url, username: user});
        s.register();
        s.openForRemoteEvalRequests();
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
    }

});

(function setupSessionTrackerConnection() {
    lively.whenLoaded(function() {
        lively.net.SessionTracker.createSession();
    });
})();

}) // end of module