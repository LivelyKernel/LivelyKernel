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

function initTrackerData(server) {
    if (trackerData) return trackerData;
    return trackerData = global.sessionTrackerData = {
        local: {
            id: uuid(),
            server: server,
            sessions: {}
        }
    }
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
        local: {
            id: uuid(),
            server: server,
            sessions: []
        }
    }
}
function sandboxTearDown() {
    if (!trackerData.isSandbox) return;
    console.log('Removing sandbox');
    trackerData = global.sessionTrackerData = origTrackerData;
    origTrackerData = null;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var webSocketHandler = {
    register: function(connection, sender, req) {
        var sessions = trackerData.local.sessions,
            session = sessions[req.sessionId] = sessions[req.sessionId] || {};
        util._extend(session, req.data);
    },
    getSessions: function(connection, sender, req) {
        var sessions = trackerData.local.sessions || {},
            sessionList = Object.keys(sessions).map(function(id) { return sessions[id]; });
        connection.send({action: req.action, data: sessionList});
    }
}

function setupWebsocketHandler(baseRoute, subserver) {
    var websockets = subserver.handler.server.websocketHandler,
        route = baseRoute + 'connect',
        connections = {}; // we allow only one connection for this route

    function removeConnection(c) {
        if (!c) return;
        var id = typeof c === 'string' ? c : c.id;
        c = connections[id];
        c.close();
        delete connections[id];
    }

    function removeConnections() {
        Object.keys(connections).forEach(function(c) { removeConnection(c); });
    }

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
        setTimeout(c.close.bind(c), 5000);
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

    app.get(route, function(req, res) {
        res.end("SessionTracker is running!");
    });
}
