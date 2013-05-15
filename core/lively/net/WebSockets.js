module('lively.net.WebSockets').requires().toRun(function() {

Object.subclass('lively.net.WebSocket',
'documentation', {
    example: function() {
        // This is a very simple wrapper for the native WebSocket object.
        // It will internally use a WebSocket object and manage (re)opening
        // connections on its own
        // For the server code see the WebSocketExample subserver
        var url = new URL(Config.nodeJSURL + '/WebSocketExample/connect');
        var ws = new lively.net.WebSocket(url, {protocol: 'lively-json'});
        connect(ws, 'closed', Global, 'show', {converter: function() { return 'websocket closed'; }});
        connect(ws, 'helloWorldReply', Global, 'show');
        ws.send({action: 'helloWorld', data: 'message from Lively'});
    }
},
'properties', {
    CONNECTING:   0,
    OPEN:         1,
    CLOSING:      2,
    CLOSED:       3,
    doNotSerialize: ['socket', 'callbacks']
},
'initializing', {
    initialize: function(uri, options) {
        options = options || {};
        uri = uri.isURL ? uri.toString() : uri;
        uri = uri.replace(/^http/, 'ws');
        this.uri = uri;
        this._erroredCount = 0;
        this._openedCount = 0;
        this._closedCount = 0;
        this._messageOutCounter = 0;
        this._messageInCounter = 0;
        this._lastMessagesOut = [];
        this._lastMessagesIn = [];
        this._lastErrors = [];
        this.socket = null;
        this.reopenClosedConnection = options.enableReconnect || false;
        this._open = false;
        this.sendTimeout = options.timeout || 3 * 1000; // when to stop trying to send
        this.messageQueue = [];
        this.callbacks = {};
        this.protocol = options.protocol ? options.protocol : null;
    },

    onrestore: function() {
        this.callbacks = {};
        this._open = false;
    },

    enableReconnect: function() { this.reopenClosedConnection = true; },
    disableReconnect: function() { this.reopenClosedConnection = false; }
},
'events', {
    onError: function(evt) {
        this._erroredCount++;
        this._lastErrors = this._lastErrors.concat(evt.message || evt).slice(-3);
        console.log('%s got error %s', this, evt.data ? evt.data : evt);
        lively.bindings.signal(this, 'error', evt);
    },
    onOpen: function(evt) {
        this._openedCount++;
        this._open = true;
        this.deliverMessageQueue();
        lively.bindings.signal(this, 'opened', evt);
    },
    onClose: function(evt) {
        this._closedCount++;
        lively.bindings.signal(this, 'closed', evt);
        // reopen makes only sense if connection was open before
        if (this._open && this.reopenClosedConnection) this.connect();
        else this._open = false;
    },

    onMessage: function(evt) {
        this._messageInCounter++;
        this._lastMessagesIn = this._lastMessagesIn.concat(evt.data).slice(-3);
        lively.bindings.signal(this, 'message', evt.data);
        if (this.protocol !== 'lively-json') return;
        var msg;
        try {
            msg = JSON.parse(evt.data);
        } catch(e) {
            console.warn(show('%s failed to JSON parse message and dispatch %s: %s', this, evt.data, e));
            return;
        }
        msg && this.onLivelyJSONMessage(msg);
    },

    onLivelyJSONMessage: function(msg) {
        // the lively-json protocol. Messages should be valid JSON in the form:
        // msg = {
        //   [messageId: NUMBER|STRING,] // optional identifier of the message
        //   [inResponseTo: NUMBER|STRING,] // optional identifier of a message
        //                                  // that this message answers
        //   [messageIndex: NUMBER,] // Optional, might go away Really Soon,
        //                           // currently used for debugging
        //   action: STRING, // will specify what the receiver should do with
        //                   // the message. Might be used as the key/name for
        //                   // signaling data bindings or emitting events
        //   data: OBJECT // the payload of the message
        // }
        var expectMore = !!msg.expectMoreResponses,
            responseId = msg.inResponseTo,
            callbacks = responseId && this.callbacks[responseId];
        // delete msg.expectMoreResponses;
        // delete msg.inResponseTo;
        if (msg.action) lively.bindings.signal(this, msg.action, msg);
        if (!callbacks) return;
        callbacks.forEach(function(cb) { 
            try {
                cb(msg, expectMore);
            } catch(e) {
                console.error(show('Error in websocket message callback\n%s', e.stack || e));
            }
        });
        if (!expectMore) callbacks.clear();
    }

},
'network', {

    isOpen: function() { return this.socket && this.socket.readyState === this.OPEN; },
    isConnecting: function() { return this.socket && this.socket.readyState === this.CONNECTING; },
    isClosed: function() { return !this.socket || this.socket.readyState >= this.CLOSING; },

    connect: function() {
        if (this.isOpen() || this.isConnecting()) return this;
        if (this.socket) this.socket.close();
        var self = this;
        this.socket = Object.extend(new WebSocket(this.uri, this.protocol), {
            onerror: function(evt) { return self.onError(evt); },
            onopen: function(evt) { return self.onOpen(evt); },
            onclose: function(evt) { return self.onClose(evt); },
            onmessage: function(evt) { return self.onMessage(evt); }
        });
    },

    send: function(data, options, callback) {
        callback = Object.isFunction(options) ? options : callback;
        options = Object.isFunction(options) ? {} : options;
        var msg = this.queue(data, callback);
        this.deliverMessageQueue(options);
        return msg;
    },

    queue: function(data, callback) {
        var msgString;
        if (typeof data !== 'string') {
            data.messageIndex = ++this._messageOutCounter;
            // hmm messageIndex is not really an id
            data.messageId = data.messageId || data.messageIndex;
            if (callback) {
                var callbacks = this.callbacks[data.messageId] = this.callbacks[data.messageId] || [];
                callbacks.push(callback);
            }
            msgString = JSON.stringify(data);
        } else {
            if (callback) {
                console.warn(show('Websocket message callbacks are only supported for JSON messages!'));
            }
            msgString = data;
        }
        this.messageQueue.push(msgString);
        return data;
    },

    deliverMessageQueue: function(options) {
        if (this._sendInProgress) return;
        if (this.isClosed()) {
            // just reconnect, send will be triggered from onOpen
            this.connect(); return; }

        // send logic
        this._sendInProgress = true; 
        var ws = this;
        function doSend() {
            try {
                var msg;
                while ((msg = ws.messageQueue.shift())) {
                    ws.socket.send(msg);
                    ws._messageOutCounter++;
                    ws._lastMessagesOut = ws._lastMessagesOut.concat(msg).slice(-3);
                }
            } finally {
                delete ws._sendInProgress;
            }
        }

        // delay and try again
        options = options || {};
        options.startTime = options.startTime || Date.now();
        options.retryDelay = options.retryDelay || 100;
        (function testConnectionAndTriggerSend() {
            if (ws.isOpen()) { doSend(); return; }
            if (ws.sendTimeout && Date.now() - options.startTime > ws.sendTimeout) {
                ws.onError({error: 'send attempt timed out', type: 'timeout'}); return;
            }
            Global.setTimeout(testConnectionAndTriggerSend, options.retryDelay);
        })();
    },

    close: function() {
        this.reopenClosedConnection = false;
        if (!this.isClosed()) this.socket.close();
    }

},
'debugging', {
    toString: function() {
        return Strings.format('lively.net.WebSocket(%s, connection: %s, %s received messages,  %s sent messages, ',
            this.uri, this.isOpen() ? 'open' : 'closed', this._messageInCounter, this._messageOutCounter);
    }
});

}) // end of module