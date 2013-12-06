var util = require('util'),
    i = util.inspect,
    f = util.format,
    j = require('path').join,
    EventEmitter = require('events').EventEmitter,
    lifeStarDir = j(process.env.LK_CORE_DIR, 'node_modules/life_star'),
    websocket = require("websocket"),
    lifeStar = require(lifeStarDir);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// helper
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function uuid() { // helper
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); }).toUpperCase();
    return id;
}

var debugThreshold = 1;
function log(/*level, msg, arguments*/) {
    // the smaller logLevel the more important the message
    var args = Array.prototype.slice.call(arguments);
    var logLevel = typeof args[0] === 'number' ? args.shift() : 1;
    if (logLevel > debugThreshold) return;
    console.log.apply(console, args);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// lively-json callback support
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function addCallback(sender, msg, callback) {
    if (!callback) return;
    if (typeof msg === 'string') {
        console.warn('Websocket message callbacks are only supported for JSON messages!');
        return;
    }
    if (!sender._messageOutCounter) sender._messageOutCounter = 0;
    if (!sender.callbacks) sender.callbacks = {};
    msg.messageIndex = ++sender._messageOutCounter;
    msg.messageId = msg.messageId || 'lively-msg:' + uuid();
    var callbacks = sender.callbacks[msg.messageId] = sender.callbacks[msg.messageId] || [];
    callbacks.push(callback);
    // log(this.debugLevel, 'adding callback %s for sender %s. Message:', callback, sender, msg);
}

function triggerActions(receiver, connection, msg) {
    if (!receiver) {
        console.warn('no receiver for msg ', msg);
        return;
    }
    try {
        receiver.emit && receiver.emit('lively-message', msg, connection);
    } catch(e) {
        console.error('Error when dealing with %s requested from %s:\n%s',
            msg.action, msg.sender, e.stack);
    }
}

function triggerCallbacks(receiver, msg) {
    var expectMore = !!msg.expectMoreResponses,
        responseId = msg.inResponseTo,
        callbacks = responseId && receiver.callbacks && receiver.callbacks[responseId];
    // log(this.debugLevel, 'triggering callbacks for message:', receiver.callbacks, msg);
    if (!callbacks) return;
    callbacks.forEach(function(cb) { 
        try { cb(msg, expectMore); } catch(e) { console.error('Error in websocket message callback:\n', e); }
    });
    if (!expectMore) callbacks.length = 0;
}

function onLivelyJSONMessage(receiver, connection, msg) {
    if (typeof msg === 'string') { try { msg = JSON.parse(msg) } catch(e) { return } }
    var action = msg.action, sender = msg.sender;
    if (!action) return;
    log(receiver.debugLevel+1, '\n%s received %s from %s %s\n',
        receiver, action, sender,
        msg.messageIndex ? '('+msg.messageIndex+')':'',
        msg);
    if (receiver.requiresSender && !sender) { console.error('%s could not extract sender from incoming message %s', receiver, i(msg)); return; }
    if (!action) { console.warn('%s could not extract action from incoming message %s', receiver, i(msg)); }
    if (msg.inResponseTo) triggerCallbacks(receiver, msg);
    else triggerActions(receiver, connection, msg);
}

function sendLivelyMessage(sender, connection, msg, callback) {
    try {
        addCallback(sender, msg, callback);
        msg.action && log(sender.debugLevel+1, '\n%s sending: %s to %s\n', sender, msg.action, connection.id || 'unknown', msg);
        if (typeof msg !== 'string') {
            if (sender.sender && !msg.sender) msg.sender = sender.sender;
            if (!msg.messageId) msg.messageId = 'lively-msg:' + uuid();
            msg = JSON.stringify(msg);
        }
        var sendMethod;
        if (connection._send) sendMethod = '_send'; // we wrapped it
        else if (connection.sendUTF) sendMethod = 'sendUTF';
        else sendMethod = 'send';
        return connection[sendMethod](msg);
    } catch(e) {
        console.error('Send with %s failed: %s', sender, e);
    }
    return false;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// client
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var WebSocketClientImpl = websocket.client;

function WebSocketClient(url, options) {
    options = options || {}
    EventEmitter.call(this);
    this.url = url;
    this.protocol = options.protocol;
    this.sender = options.sender || null;
    this.setupClient();
    this.debugLevel = options.debugLevel !== undefined ?  options.debugLevel : 1;
}

util.inherits(WebSocketClient, EventEmitter);

(function() {

    this.setupClient = function() {
        var self = this;
        var c = this._client = new WebSocketClientImpl();

        c.on('connectFailed', function(e) { self.onConnectionFailed(e); });
        
        c.on('connect', function(connection) {
            connection.on('error', function(e) { self.onError(e); });
            connection.on('close', function() { self.onClose() });
            connection.on('message', function(message) { self.onMessage(message, connection); });
            connection._send = connection.send;
            connection.send = function(msg, callback) {
                return sendLivelyMessage(self, connection, msg, callback);
            }
            self.onConnect(connection);
        });
    }

    this.onConnect = function(connection) {
        log(this.debugLevel, 'Connected %s', this.toString());
        if (this.connection) this.connection.close();
        this.connection = connection;
        this.emit('connect', connection);
    }

    this.onConnectionFailed = function(err) {
        console.warn('Could not connect %s:\n%s', this.toString(), err.toString());
        this.emit("error", {message: 'connection failed', error: err});
    }
    
    this.onError = function(err) {
        console.warn('%s connection error %s', this.toString(), err);
        this.emit("error", err);
    }
    
    this.onClose = function() {
        log(this.debugLevel, '%s closed', this.toString());
        this.emit("close");
    }

    this.onMessage = function(msg, connection) {
        var json;
        try {
            json = JSON.parse(msg.utf8Data)
        } catch(e) {
            this.onError(f('%s could not parse message %s', this, e));
            return;
        }
        this.lastMessage = json;
        this.emit("message", json);
        onLivelyJSONMessage(this, connection, json);
    }

    this.connect = function() {
        log(this.debugLevel, 'Connecting %s', this);
        try {
            return this._client.connect(this.url, this.protocol);
        } catch(e) {
            console.error(e);
            this.onConnectionFailed(e);
        }
    }

    this.close = function() { return this.connection && this.connection.close(); }

    this.send = function(data, callback) {
        sendLivelyMessage(this, this.connection, data, callback);
    }

    this.toString = function() {
        return f('<WebSocketClient %s, sender %s>', this.url, this.sender);
    }

    this.isOpen = function() {
        return this.connection && this.connection.state === 'open';
    }

}).call(WebSocketClient.prototype);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Server
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function WebSocketListener(options) {
    options = options || {
        autoAcceptConnections: false, // origin check
        // FIXME better use Infinity
        maxReceivedFrameSize: NaN, // default: 0x10000 64KiB // we don't want to care for now...
        maxReceivedMessageSize: NaN // default: 0x100000 1MiB
    }
    var init = this.init.bind(this, options);
    var server = lifeStar.getServer();
    if (server) init(server);
    else lifeStar.on('start', init);
    lifeStar.on('close', this.shutDown.bind(this));
    this.requestHandler = {};
}

util.inherits(WebSocketListener, websocket.server);

(function() {
    
    this.init = function(options, server) {
        options = options || {};
        if (this._started) this.shutDown();
        var existingListener = server.websocketHandler;
        if (existingListener) { server.removeAllListeners('upgrade'); }
        options.httpServer = server;
        websocket.server.call(this, options); // super call
        this.on('request', this.dispatchRequest.bind(this));
        this._started = true;
    }

    this.registerSubhandler = function(options) {
      this.requestHandler[options.path] = options.handler;
    }

    this.unregisterSubhandler = function(options) {
      if (options.path) {
        delete this.requestHandler[options.path];
      }
    }

    this.originIsAllowed = function(origin) { return true }
    
    this.findHandler = function(request) {
        var path = request.resourceURL.path,
            handler = this.requestHandler[path];
        if (handler) return handler;
        request.reject();
        console.warn('Got websocket request to %s but found no handler for responding\n%s', path, i(request, null, 0));
        return null;
    }

    this.shutDown = function(request) {
        log(this.debugLevel, 'Stopping websocket listener');
        Object.keys(this.requestHandler).forEach(function(path) {
            this.unregisterSubhandler(path); }, this);
        websocket.server.prototype.shutDown.call(this);
    }

    this.dispatchRequest = function(request) {
        if (!this.originIsAllowed(request.origin)) {
            request.reject();
            log(this.debugLevel, 'Connection from origin %s rejected.', request.origin);
            return;
        }
        var handler = this.findHandler(request);
        try {
            handler && handler(request);
        } catch(e) {
            console.warn('Error handling websocket request: %s', e);
        }
    }

}).call(WebSocketListener.prototype);

WebSocketListener.forLively = function() {
    return this._instance = this._instance ?
        this._instance : new WebSocketListener();
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function WebSocketServer(options) {
    options = options || {};
    EventEmitter.call(this);
    this.sender = options.sender || null;
    this.connections = [];
    this.debugLevel = options.debugLevel !== undefined ?  options.debugLevel : 1;
    this.route = '';
    this.subserver = null;
    this.requiresSender = false;
}

util.inherits(WebSocketServer, EventEmitter);

(function() {

    this.listen = function(options) {
        // options: {route: STRING, subserver: OBJECT, websocketImpl: OBJECT}
        // protocol and the actions automatically extracted from messages send
        // in this protocol
        var webSocketServer = this;
        this.route = options.route;
        this.subserver = options.subserver;
        this.websocketImpl = WebSocketListener.forLively();
        this.websocketImpl.registerSubhandler({
            path: options.route,
            handler: webSocketServer.accept.bind(webSocketServer)
        });
        this.subserver && this.subserver.on('close', function() { webSocketServer.close(); });
        return webSocketServer;
    }

    this.close = function() {
        this.removeConnections();
        if (!this.websocketImpl) return;
        this.websocketImpl.unregisterSubhandler({path: this.route});
    }

    this.accept = function(request) {
        var c = request.accept('lively-json', request.origin), server = this;
        c.request = request;

        c.on('close', function(msg) {
            if (c.id) log(this.debugLevel, 'websocket %s closed', c.id)
            else log(this.debugLevel, 'a websocket connection was closed');
            server.removeConnection(c);
        });

        // a msg object should be valid JSON and follow the format:
        // {sender: ID, action: STRING, data: OBJECT}
        c.on('message', function(msg) {
            var data;
            server.emit('message', data);
            try {
                data = JSON.parse(msg.utf8Data);
            } catch(e) {
                console.warn('%s could not read incoming message %s', server, i(msg));
                return;
            }
            onLivelyJSONMessage(server, c, data);
        });

        c.send = function(msg, callback) { return sendLivelyMessage(server, c, msg, callback); }

        this.addConnection(c, request);

        return c;
    }

    this.removeConnection = function(c) {
        if (!c) return;
        var id = typeof c === 'string' && c;
        if (id) {
            this.getConnections(id).forEach(function(c) { this.removeConnection(c); }, this);
            return;
        }
        c && c.close();
        var idx = this.connections.indexOf(c);
        if (idx === -1) return;
        this.connections.splice(idx, 1);
    }

    this.removeConnections = function() {
        [].concat(this.connections).forEach(function(c) { this.removeConnection(c); }, this);
    }

    this.getConnection = function(id) {
        return this.getConnections(id)[0];
    }

    this.getConnections = function(id) {
        if (!id) return [].concat(this.connections);
        return this.connections.filter(function(c) { return c.id === id; })
    }

    this.addConnection = function(c) {
        if (c.id) {
            var existing = this.getConnections(c.id);
            existing.forEach(function(ea) { this.removeConnection(ea); }, this);
        }
        this.connections.push(c);
        return c;
    }

    this.toString = function() {
        return f('WebSocketServer(%s, %s connections)', this.route, this.connections.length);
    }

}).call(WebSocketServer.prototype);


// -=-=-=-
// exports
// -=-=-=-

module.exports = {
    WebSocketServer: WebSocketServer,
    WebSocketClient: WebSocketClient
};
