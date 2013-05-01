util=require('util')
i=function(obj, depth, showAll) { return util.inspect(obj, showAll, typeof depth === 'number' ? depth : 1); };

function uuid() {
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); }).toUpperCase();
    return id;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
global.sessionTrackerData


var trackerData = global.sessionTrackerData;

function initTrackerData(server) {
    if (trackerData) return trackerData;
    trackerData = global.sessionTrackerData = {
        local: {
            id: uuid(),
            hostname: require('os').hostname(),
            server: server,
            sessions: {}
        }
    }
}

function resetTrackerData(server) {
    webSocketHandler && webSocketHandler.removeConnections();
    global.sessionTrackerData = trackerData = null;
    initTrackerData(server);
}

function getSessionList() {
    var sessions = trackerData.local.sessions || {};
    return Object.keys(sessions).map(function(id) { return sessions[id]; });
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
            hostname: require('os').hostname(),
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
// webSocketHandler.removeConnections()

WebSocketServer = require('./support/websockets').WebSocketServer;
var webSocketHandler = global.webSocketHandler = global.webSocketHandler ||new WebSocketServer();
util._extend(global.webSocketHandler, {

    debug: true,

    register: function(connection, sender, req) {
        var sessions = trackerData.local.sessions,
            session = sessions[req.sender] = sessions[req.sender] || {};
        util._extend(session, req.data);
        connection.id = req.data.id;
        connection.send({action: req.action, data: {message: 'OK'}});
    },

    unregister: function(connection, sender, req) {
        var sessions = trackerData.local.sessions;
        delete sessions[req.sender];
        this.removeConnection(req.sender);
        connection.close();
    },

    getSessions: function(connection, sender, req) {
        connection.send({action: req.action, data: getSessionList()});
    },

    remoteEval: function(connection, sender, req) {
        var sessions = trackerData.local.sessions || {},
            target = req.data.target;
        var targetConnection = this.getConnection(target);
        if (!targetConnection) {
            connection.send({action: req.action, data: {error: 'Target connection not found', target: req.data.target}});
            return;
        }
        targetConnection.send({action: 'remoteEvalRequest', data: {origin: req.sender, expr: req.data.expr}});
    },

    remoteEvalRequest: function(connection, sender, req) {
        var originConnection = this.getConnection(req.data.origin);
        if (!originConnection) return;
        originConnection.send({action: 'remoteEval', data: req.data});
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
/*
global.sessionTrackerData.currentServer.sessions = []
*/

module.exports = function(route, app, subserver) {
    initTrackerData(subserver.handler.server);
    webSocketHandler.listen(route + 'connect', subserver);

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
        res.json({message: 'OK'}).end();
    });

    app.get(route + 'sessions', function(req, res) {
        res.json(getSessionList()).end();
    });

    app.get(route, function(req, res) {
        res.json({webSocketHandler: webSocketHandler.toString(), sessions: getSessionList()}).end();
    });
}
