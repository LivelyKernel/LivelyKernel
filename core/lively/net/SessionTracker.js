module('lively.net.SessionTracker').requires('lively.Network').toRun(function() {

Object.subclass('lively.net.SessionTrackerConnection',
'initializing', {
    initialize: function(options) {
        this.sessionTrackerURL = options.sessionTrackerURL;
        this.username = options.username;
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
        this.webSocket = new lively.net.WebSocket(url, {protocol: "lively-json"});
        lively.bindings.connect(this.webSocket, 'opened', this, 'connectionEstablished');
        lively.bindings.connect(this.webSocket, 'error', this, 'connectionError');
        return this.webSocket;
    },

    resetConnection: function() {
        var ws = this.webSocket;
        if (!ws) return;
        // in case connection wasn't established yet
        lively.bindings.disconnect(ws, 'opened', this, 'connectionEstablished');
        ws.close();
        this.webSocket = null;
    },

    send: function(action, jso) {
        if (!this.sessionId) { throw new Error('Need sessionId to interact with SessionTracker!') }
        this.getWebSocket().send({
            sender: this.sessionId,
            action: action,
            data: jso || {}
        });
    }

},
'server management', {
    resetServer: function() {
        return this.getWebResource('reset').beSync().post('reset').content;
    },

    getSessions: function() {
        return this.getWebResource('sessions').beSync().get().getJSON();
    },
},
'session management', {

    connectionEstablished: function() {
        // In case we have removed the connection already
        if (!this.webSocket || !this.sessionId) return;
        lively.bindings.connect(this.webSocket, 'closed', this, 'connectionClosed', {
            removeAfterUpdate: true
        });
        console.log('%s established', this.toString(true));
        lively.bindings.signal(this, 'established');
    },

    connectionClosed: function() {
        console.log('%s closed', this.toString(true));
        if (this.sessionId) this.registerCurrentSession();
        else lively.bindings.signal(this, 'closed');
    },

    connectionError: function(err) {
        console.log('connection error in %s:\n%o', this.toString(true), err);
    },

    registerCurrentSession: function() {
        if (!this.sessionId) this.sessionId = Strings.newUUID();
        this.send('register', {
            id: this.sessionId,
            worldURL: URL.source.toString(),
            user: this.username || 'anonymous'
        });
    },

    unregisterCurrentSession: function() {
        if (this.sessionId) this.send('unregister', {id: this.sessionId});
        this.resetConnection();
        this.sessionId = null;
    }

},
'remote eval', {

    remoteEval: function(targetId, expression, thenDo) {
        // we send a remote eval request
        lively.bindings.connect(this.getWebSocket(), 'remoteEval', {cb: thenDo}, 'cb', {removeAfterUpdate: true});
        this.send('remoteEval', {target: targetId, expr: expression});
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
        this.send('remoteEvalRequest', {result: result, origin: msg.data.origin})
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
    toString: function(shortForm) {
        if (!this.webSocket || !this.webSocket.isOpen() || shortForm) {
            return Strings.format("Session connection to %s", this.sessionTrackerURL);
        }
        return Strings.format("Open session connection to %s\n  id: %s\n  user: %s",
            this.sessionTrackerURL, this.sessionId, this.username);
    }
});

Object.extend(lively.net.SessionTracker, {

    localSessionTrackerURL: URL.create(Config.nodeJSURL + '/').withFilename('SessionTracker/'),

    getSession: function() {
        return this._session;
    },

    createSession: function() {
        if (this._session) return this._session;
        var user = lively.morphic.World.current().getUserName(true);
        if (!user) {
            console.warn('Cannot register lively session because no user is logged in');
            return;
        }
        var s = new lively.net.SessionTrackerConnection({
            sessionTrackerURL: this.localSessionTrackerURL,
            username: lively.morphic.World.current().getUserName(true)
        });
        s.registerCurrentSession();
        s.openForRemoteEvalRequests();
        this._onBrowserShutdown = Global.addEventListener('beforeunload', function(evt) {
            lively.net.SessionTracker.closeSession();
        }, true);
        return this._session = s;
    },

    closeSession: function() {
        if (this._onBrowserShutdown) {
            Global.removeEventListener('beforeunload', this._onBrowserShutdown);
            delete this._onBrowserShutdown;
        }
        if (!this._session) return;
        this._session.unregisterCurrentSession();
        delete this._session;
    }
});

(function setupSessionTrackerConnection() {
    lively.whenLoaded(function() {
        false && lively.net.SessionTracker.closeSession();
    });
})();

}) // end of module