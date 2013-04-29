util=require('util')
i=util.inspect;

function uuid() {
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); }).toUpperCase();
    return id;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
i(global.sessionTrackerData);

var trackerData = global.sessionTrackerData;
var connections = trackerData && trackerData.connections;

function initTrackerData(server) {
    if (trackerData) return trackerData;
    trackerData = global.sessionTrackerData = {
        connections: {},
        local: {
            id: uuid(),
            server: server,
            sessions: {}
        }
    }
    connections = trackerData && trackerData.connections;
}

function resetTrackerData(server) {
    removeConnections();
    global.sessionTrackerData = trackerData = null;
    initTrackerData(server);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// sandboxing for testing
var origTrackerData;
function sandboxSetup(server) {
    if (trackerData.isSandbox) return;
    console.log('Creating sandbox');
    origTrackerData = trackerData;
    trackerData = global.sessionTrackerData = {
        isSandbox: true,
        connections: {},
        local: {
            id: uuid(),
            server: server,
            sessions: []
        }
    }
    connections = trackerData.connections;
}
function sandboxTearDown() {
    if (!trackerData.isSandbox) return;
    console.log('Removing sandbox');
    trackerData = global.sessionTrackerData = origTrackerData;
    connections = trackerData.connections;
    origTrackerData = null;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function removeConnection(c) {
    if (!c) return;
    var id = typeof c === 'string' ? c : c.id;
    c = connections[id];
    delete connections[id];
    if (!c) return;
    c.close();
}

function removeConnections() {
    Object.keys(connections).forEach(function(c) { removeConnection(c); });
}

function getConnection(id) {
    return connections[id];
}

function addConnection(id, c) {
    if (connections[id] && connections[id] !== c)
        removeConnection(connections[id]);
    return connections[id] = c;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var webSocketHandler = {

    register: function(connection, sender, req) {
        var sessions = trackerData.local.sessions,
            session = sessions[req.sender] = sessions[req.sender] || {};
        util._extend(session, req.data);
        addConnection(req.data.id, connection);
        connection.send({action: req.action, data: {message: 'OK'}});
    },

    unregister: function(connection, sender, req) {
        var sessions = trackerData.local.sessions;
        delete sessions[req.sender];
        removeConnection(req.sender);
        connection.close();
    },

    getSessions: function(connection, sender, req) {
        var sessions = trackerData.local.sessions || {},
            sessionList = Object.keys(sessions).map(function(id) { return sessions[id]; });
        connection.send({action: req.action, data: sessionList});
    },

    remoteEval: function(connection, sender, req) {
        var sessions = trackerData.local.sessions || {},
            target = req.data.target;
        var targetConnection = getConnection(target);
        if (!targetConnection) {
            console.log('%s connections: %s', target, i(connections, false, 1));
            connection.send({action: req.action, data: {error: 'Target connection not found', target: req.data.target}});
            return;
        }
        targetConnection.send({action: 'remoteEvalRequest', data: {origin: req.sender, expr: req.data.expr}});
    },

    remoteEvalRequest: function(connection, sender, req) {
        var originConnection = getConnection(req.data.origin);
        if (!originConnection) return;
        originConnection.send({action: 'remoteEval', data: req.data});
    }
}

function setupWebsocketHandler(baseRoute, subserver) {
    var websockets = subserver.handler.server.websocketHandler,
        route = baseRoute + 'connect';

    function newConnection(request) {
        // removeConnection();
        var c = request.accept();
        c.on('close', function(msg) { console.log('closed'); });
        c.on('message', function(msg) {
            console.log('got message %s', i(msg));
            var data;
            try {
                data = JSON.parse(msg.utf8Data);
            } catch(e) {
                console.log('Could not read incomin message %s', i(msg));
                return;
            }
            var action = data.action, sender = data.sender;
            if (!action) { console.log('Could not extract action from incoming message %s', i(msg)); return; }
            if (!sender) { console.log('Could not extract sender from incoming message %s', i(msg)); return; }
            if (!webSocketHandler[action]) { console.log('Could not handle %s from message %s', action, i(msg)); return; }
            try {
                webSocketHandler[action](c, sender, data);
            } catch(e) {
                console.error('Error when dealing with %s requested from %s:\n%s: %s',
                    action, sender, e, e.stack);
            }
        });
        c.send = function(data) {
            if (typeof data !== 'string') data = JSON.stringify(data);
            this.sendUTF(data);
        }
        setTimeout(c.close.bind(c), 20 * 1000);
        return c;
    }

    websockets.registerSubhandler({path: route, handler: function(req) {
        var c = newConnection(req);
        c.on('message', function(evt) {
            c.send('server received "' + evt.utf8Data + '"');
        });
        return !!c;
    }});

    subserver.on('close', function() {
        removeConnections();
        websockets.unregisterSubhandler({path: route});
    });

}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
/*
global.sessionTrackerData.currentServer.sessions = []
*/

module.exports = function(route, app, subserver) {
    initTrackerData(subserver.handler.server);
    setupWebsocketHandler(route, subserver);

    app.post(route + 'sandbox', function(req, res) {
        if (req.body.start) {
            sandboxSetup(subserver.handler.server);
            res.json({message: 'Sandbox created'}).end();
        } else if (req.body.stop) {
            sandboxTearDown();
            res.json({message: 'Sandbox removed'}).end();
        } else {
            res.status(400).json({error: 'Cannot deal with sandbox request'}).end();
        }
    });

    app.post(route + 'reset', function(req, res) {
        resetTrackerData(subserver.handler.server);
        res.status(200).json({message: 'OK'}).end();
    });

    app.get(route + 'sessions', function(req, res) {
        var sessions = trackerData.local.sessions,
            list = Object.keys(sessions).map(function(id) { return sessions[id]; });
        res.status(200).json(list).end();
    });

    app.get(route, function(req, res) {
        res.end("SessionTracker is running!");
    });
}
