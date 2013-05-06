var util = require('util');
var i = util.inspect;
var f = util.format;
var EventEmitter = require('events').EventEmitter;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// client
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var j = require('path').join;
var lifeStarDir = j(process.env.LK_SCRIPTS_ROOT, 'node_modules/life_star');
var websocket = require(j(lifeStarDir, 'node_modules/websocket'));
var Client = websocket.client;

function WebSocketClient(url, protocol) {
    EventEmitter.call(this);
    this.setupClient();
    this.url = url;
    this.protocol = protocol;
}

util.inherits(WebSocketClient, EventEmitter);

(function() {

    this.setupClient = function() {
        var self = this;
        var c = this._client = new Client();

        c.on('connectFailed', function(e) {
            self.onConnectionFailed(e);
        });
        
        c.on('connect', function(connection) {
            connection.on('error', function(e) { self.onError(e); });
            connection.on('close', function() { self.onClose() });
            connection.on('message', function(message) { self.onMessage(message); });
            self.onConnect(connection);
        });
    }

    this.onConnect = function(connection) {
        console.log('Connected %s', this.toString());
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
        console.log('%s closed', this.toString());
        this.emit("close");
    }

    this.onMessage = function(msg) {
        var json;
        try {
            json = JSON.parse(msg.utf8Data)
        } catch(e) {
            this.onError(f('%s could not parse message %s', this, e));
            return;
        }
        this.lastMessage = json;
        this.emit("message", json);
        console.log('...... emitting %s ', json.action, json.data)
        json.action && json.data && this.emit(json.action, json.data);
    }

    this.connect = function() {
        console.log('Connecting %s', this);
        try {
            return this._client.connect(this.url, this.protocol);
        } catch(e) {
            console.error(e);
            this.onConnectionFailed(e);
        }
    }

    this.close = function() {
        return this.connection && this.connection.close();
    }

    this.send = function(data) {
        try {
            if (typeof data !== 'string') data = JSON.stringify(data);
            return this.connection.send(data);
        } catch(e) {
            console.error('Send with %s failed: %s', this, e);
        }
        return false;
    }

    this.toString = function() {
        return f('<WebSocketClient %s, %s>', this.url, this.connection);
    }

}).call(WebSocketClient.prototype);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Server
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function WebSocketServer() {
    this.connections = [];
    this.debug = true;
    this.route = '';
    this.subserver = null;
    this.actions = {};
    this.requiresSender = false;
}

util._extend(WebSocketServer.prototype, {

    listen: function(options) {
        // options: {route: STRING, subserver: OBJECT, websocketImpl: OBJECT, action: [OBJECT]}
        // actions: key - func mapping to determine callbacks for lively-json
        // protocol and the actions automatically extracted from messages send
        // in this protocol
        var webSocketServer = this;
        this.actions = options.actions;
        this.route = options.route;
        this.subserver = options.subserver;
        this.websocketImpl = options.websocketImpl || this.subserver.handler.server.websocketHandler;
        this.websocketImpl.registerSubhandler({
            path: options.route,
            handler: webSocketServer.accept.bind(webSocketServer)
        });
        this.subserver && this.subserver.on('close', function() { webSocketServer.close(); });
        return webSocketServer;
    },

    close: function() {
        this.removeConnections();
        if (!this.websocketImpl) return;
        this.websocketImpl.unregisterSubhandler({path: this.route});
    },

    accept: function(request) {
        var c = request.accept('lively-json', request.origin), server = this;

        c.on('close', function(msg) {
            server.debug && console.log('a websocket connection was closed');
            server.removeConnection(c);
        });

        // a msg object should be valid JSON and follow the format:
        // {sender: ID, action: STRING, data: OBJECT}
        c.on('message', function(msg) {
            var data;
            try {
                data = JSON.parse(msg.utf8Data);
            } catch(e) {
                console.warn('%s could not read incoming message %s', server, i(msg));
                return;
            }
            var action = data.action, sender = data.sender;
            server.debug && console.log('\n%s received %s from %s %s\n',
                server, action, sender,
                data.messageIndex ? '('+data.messageIndex+')':'',
                data.data);
            if (this.requiresSender && !sender) { console.warn('%s could not extract sender from incoming message %s', server, i(msg)); return; }
            if (!action) { console.warn('%s could not extract action from incoming message %s', server, i(msg)); return; }
            if (!server.actions[action]) { console.warn('%s could not handle %s from message %s', server, action, i(msg)); return; }
            try {
                server.actions[action](c, sender, data);
            } catch(e) {
                console.error('Error when dealing with %s requested from %s:\n%s: %s',
                    action, sender, e, e.stack);
            }
        });
        c.send = function(data) {
            server.debug && data.action && console.log('\n%s sending: %s to %s\n', server, data.action, c.id || 'unknown', data.data);
            if (typeof data !== 'string') data = JSON.stringify(data);
            this.sendUTF(data);
        }

        this.addConnection(c);

        return c;
    },

    removeConnection: function(c) {
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
    },

    removeConnections: function() {
        this.connections.forEach(function(c) { this.removeConnection(c); }, this);
    },

    getConnection: function(id) {
        return this.getConnections(id)[0];
    },

    getConnections: function(id) {
        if (!id) return [].concat(this.connections);
        return this.connections.filter(function(c) { return c.id === id; })
    },

    addConnection: function(c) {
        if (c.id) {
            var existing = this.getConnections(c.id);
            existing.forEach(function(ea) { this.removeConnection(ea); }, ea);
        }
        this.connections.push(c);
        return c;
    },

    toString: function() {
        return f('WebSocketServer(%s, %s connections)', this.route, this.connections.length);
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = {WebSocketServer: WebSocketServer, WebSocketClient: WebSocketClient};