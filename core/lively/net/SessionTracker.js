module('lively.net.SessionTracker').requires('lively.Network').toRun(function() {

Object.extend(lively.net.SessionTracker, {
    // basic networking
    baseURL: URL.create(Config.nodeJSURL + '/').withFilename('SessionTracker/'),
    getWebResource: function(subServiceName) {
        var url = this.baseURL;
        if (subServiceName) url = url.withFilename(subServiceName);
        return url.asWebResource();
    },

    getWebSocket: function() {
        if (this.webSocket) return this.webSocket;
        var url = this.baseURL.withFilename('connect');
        this.webSocket = new lively.net.WebSocket(url, {protocol: "lively-json"});
        lively.bindings.connect(this.webSocket, 'opened', {opened: function() {
            if (!this.webSocket) return;
            lively.bindings.connect(this.webSocket, 'closed', this, 'registerCurrentSession', {
                updater: function($upd) { if (tracker.sessionId) { $upd(); } },
                varMapping: {tracker: this},
                removeAfterUpdate: true
            });
        }.bind(this)}, 'opened');

        return this.webSocket;
    },

    send: function(action, jso) {
        if (!this.sessionId) { throw new Error('Need sessionId to interact with SessionTracker!') };
        this.getWebSocket().send({
            sender: this.sessionId,
            action: action,
            data: jso || {}
        });
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // test support. Since the session tracker has global state
    // we put it into a sandbox mode when running the tests
    useSandbox: function() {
        var webR = this.getWebResource('sandbox').beSync();
        webR.post(JSON.stringify({start: true}), 'application/json');
        lively.assert(webR.status.isSuccess(), 'Could not set lively.net.SessionTracker into sandbox mode?');
    },
    removeSandbox: function() {
        var webR = this.getWebResource('sandbox').beSync();
        webR.post(JSON.stringify({stop: true}), 'application/json');
        lively.assert(webR.status.isSuccess(), 'Could not release lively.net.SessionTracker sandbox mode?');
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // server management
    resetServer: function() {
        return this.getWebResource('reset').beSync().post('reset').content;
    },

    getSessions: function() {
        return this.getWebResource('sessions').beSync().get().getJSON();
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // simple session logic
    registerCurrentSession: function() {
        if (!this.sessionId) this.sessionId = Strings.newUUID();
        this.send('register', {
            id: this.sessionId,
            worldURL: URL.source.toString(),
            user: $world.getUserName(true)
        });
    },

    unregisterCurrentSession: function() {
        if (this.sessionId) this.send('unregister', {id: this.sessionId});
        this.resetConnection();
        this.sessionId = null;
    },

    resetConnection: function() {
        this.webSocket && this.webSocket.close();
        this.webSocket = null;
    },

    openForRemoteEvalRequests: function() {
        lively.bindings.connect(this.getWebSocket(), 'remoteEvalRequest', this, 'doRemoteEval');
    },

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
    }
});

(function setupSessionTrackerConnection() {
    lively.whenLoaded(function() {
        lively.net.SessionTracker.registerCurrentSession();
        lively.net.SessionTracker.openForRemoteEvalRequests();
        Global.addEventListener('beforeunload', function(evt) {
            lively.net.SessionTracker.unregisterCurrentSession();
        }, true);

    });
})();

}) // end of module