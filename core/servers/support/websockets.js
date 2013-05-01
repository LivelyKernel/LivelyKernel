var util = require('util');
var i = util.inspect;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function WebSocketServer() {
    this.connections = [];
    this.debug = true;
    this.route = '';
}

util._extend(WebSocketServer.prototype, {

    listen: function(route, subserver) {
        this.route = route;
        var webSocketServer = this,
            websockets = subserver.handler.server.websocketHandler;
        websockets.registerSubhandler({path: route, handler: webSocketServer.accept.bind(webSocketServer)});
        subserver.on('close', function() {
            webSocketServer.removeConnections();
            websockets.unregisterSubhandler({path: route});
        });
        return webSocketServer;
    },

    accept: function(request) {
        var c = request.accept(), server = this;

        c.on('close', function(msg) {
            server.debug && console.log('closed');
            server.removeConnection(c);
        });

        // a msg object should be valid JSON and follow the format:
        // {sender: ID, action: STRING, data: OBJECT}
        c.on('message', function(msg) {
            server.debug && console.log('got message %s', i(msg));
            var data;
            try {
                data = JSON.parse(msg.utf8Data);
            } catch(e) {
                console.log('%s could not read incoming message %s', server, i(msg));
                return;
            }
            var action = data.action, sender = data.sender;
            if (!action) { console.log('%s could not extract action from incoming message %s', server, i(msg)); return; }
            if (!sender) { console.log('%s could not extract sender from incoming message %s', server, i(msg)); return; }
            if (!server[action]) { console.log('%s could not handle %s from message %s', server, action, i(msg)); return; }
            try {
                server[action](c, sender, data);
            } catch(e) {
                console.error('Error when dealing with %s requested from %s:\n%s: %s',
                    action, sender, e, e.stack);
            }
        });
        c.send = function(data) {
            if (typeof data !== 'string') data = JSON.stringify(data);
            server.debug && console.log('%s sending %s', server, data);
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
        return util.format('WebSocketServer(%s, %s connections)', this.route, this.connections.length);
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = {WebSocketServer: WebSocketServer};