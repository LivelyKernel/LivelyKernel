module('lively.net.SessionTracker').requires().toRun(function() {

Object.extend(lively.net.SessionTracker, {
    // basic networking
    baseURL: URL.create(Config.nodeJSURL + '/').withFilename('SessionTracker/'),
    getWebResource: function(subServiceName) {
        var url = this.baseURL;
        if (subServiceName) url = url.withFilename(subServiceName);
        return url.asWebResource();
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
        this.connection && this.connection.close();
        this.sessionId = null;
    },

    remoteEval: function(targetId, expression, thenDo) {
        var con = this.getConnection();
        lively.bindings.connect(con, 'messageReceived', {cb: thenDo}, 'cb', {
            updater: function($upd, data) { if (data.action === 'remoteEval') $upd(data); },
            converter: function(data) { return data.data },
            removeAfterUpdate: true});
        this.send('remoteEval', {target: targetId, expr: expression});
    },
    openForRemoteEvalRequests: function() {
        var con = this.getConnection();
        lively.bindings.connect(con, 'messageReceived', this, 'doRemoteEval', {
            updater: function($upd, data) { if (data.action === 'remoteEvalRequest') $upd(data); },
            converter: function(data) { return data.data },
            removeAfterUpdate: false});
    },
    doRemoteEval: function(data) {
        // show('doRemoteEval %o', data);
        var result;
        try {
            result = eval(data.expr);
        } catch(e) {
            result = e + '\n' + e.stack;
        }
        this.send('remoteEvalRequest', {result: result, origin: data.origin})
    },
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // websocket interaction
    send: function(action, jso) {
        if (!this.sessionId) { throw new Error('Need sessionId to interact with SessionTracker!') };
        this.getConnection().send({
            sender: this.sessionId,
            action: action,
            data: jso || {}
        });
    },
    getConnection: function() {
        if (this.connection) return this.connection;
        return this.connection = {
            uri: this.baseURL.withFilename('connect').toString().replace(/^http/, 'ws'),
            tracker: this,
            open: false,
            messages: [],
            socket: null,
            send: function(data) {
                if (!this.socket || this.socket.isClosed()) { this.openSocket(); }
                if (!this.socket.isOpen()) { this.retrySendIn(data, 20); return; }
                if (typeof data !== 'string') data = JSON.stringify(data);
                return this.socket.send(data);
            },
            close: function() { if (this.socket && !this.socket.isClosed()) this.socket.close() },
            retrySendIn: function(data, time) {
                Global.setTimeout(this.send.bind(this, data), time);
            },
            openSocket: function() {
                var self = this;
                this.socket = Object.extend(new WebSocket(this.uri, 'lively-session-tracker'), {
                    // readystate
                    CONNECTING:   0,    // The connection is not yet open.
                    OPEN:         1,    // The connection is open and ready to communicate.
                    CLOSING:      2,    // The connection is in the process of closing.
                    CLOSED:       3,    // The connection is closed or couldn't be opened.
                    onerror: function(evt) { lively.bindings.signal(self, 'error', evt); },
                    onopen: function(evt) { this.opened = true; },
                    onclose: function(evt) {
                        this.opened = false;
                        self.tracker.sessionId && self.tracker.registerCurrentSession();
                    },
                    onmessage: function(evt) {
                        var data = JSON.parse(evt.data);
                        self.messages.push(data);
                        lively.bindings.signal(self, 'messageReceived', data);
                    },
                    isOpen: function() { return this.readyState === this.OPEN; },
                    isClosed: function() { return this.readyState >= this.CLOSING; }
                });
            }
        }
    },
    resetConnection: function() {
        this.connection = null;
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