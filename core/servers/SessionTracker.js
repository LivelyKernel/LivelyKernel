util=require('util')

global.i=function(obj, depth, showAll) { return util.inspect(obj, showAll, typeof depth === 'number' ? depth : 1); };

function uuid() {
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8); return v.toString(16); }).toUpperCase();
    return id;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// session actions, when messages come in they specify in
// their "action" parameter what they want to do. This is
// the table that defines what functions are behind those
// actions.
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var sessionActions = {

    registerClient: function(sessionServer, connection, sender, req) {
        var sessions = sessionServer.trackerData.local.sessions,
            session = sessions[req.sender] = sessions[req.sender] || {};
        util._extend(session, req.data);
        connection.id = req.data.id;
        connection.send({action: req.action, data: {message: 'OK'}});
    },

    unregisterClient: function(sessionServer, connection, sender, req) {
        var sessions = sessionServer.trackerData.local.sessions;
        delete sessions[req.sender];
        sessionServer.websocketServer.removeConnection(req.sender);
        connection.close();
    },

    getSessions: function(sessionServer, connection, sender, req) {
        connection.send({action: req.action, data: sessionServer.getSessionList()});
    },

    remoteEval: function(sessionServer, connection, sender, req) {
        var sessions = sessionServer.trackerData.local.sessions || {},
            target = req.data.target;
        var targetConnection = sessionServer.websocketServer.getConnection(target);
        if (!targetConnection) {
            connection.send({action: req.action, data: {error: 'Target connection not found', target: req.data.target}});
            return;
        }
        targetConnection.send({action: 'remoteEvalRequest', data: {origin: req.sender, expr: req.data.expr}});
    },

    remoteEvalRequest: function(sessionServer, connection, sender, req) {
        var originConnection = sessionServer.websocketServer.getConnection(req.data.origin);
        if (!originConnection) return;
        originConnection.send({action: 'remoteEval', data: req.data});
    }
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// SessionTracker
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var WebSocketServer = require('./support/websockets').WebSocketServer

function SessionTracker(options) {
    // options = {route: STRING, subserver: OBJECT || websocketImpl: OBJECT}
    options = options || {};
    this.route = options.route + 'connect';
    this.subserver = options.subserver;
    this.websocketImpl = this.subserver ?
        this.subserver.handler.server.websocketHandler :
        options.websocketImpl;
    this.websocketServer = new WebSocketServer();
    this.initTrackerData();
}

(function() {

    this.listen = function() {
        var sessionTracker = this,
            actions = Object.keys(sessionActions).reduce(function(actions, name) { 
            actions[name] = sessionActions[name].bind(null, sessionTracker);
            return actions;
        }, {});
        this.websocketServer.listen({
            route: this.route,
            actions: actions, 
            subserver: this.subserver,
            websocketImpl: this.websocketImpl
        });
    }

    this.shutdown = function() {
        this.websocketServer && this.websocketServer.close();
    }

    this.initTrackerData = function() {
        this.trackerData = {
            local: {
                id: uuid(),
                hostname: require('os').hostname(),
                sessions: {}
            }
        }
    }

    this.resetTrackerData = function() {
        this.shutdown();
        this.initTrackerData();
    }
    
    this.getSessionList = function() {
        var sessions = this.trackerData.local.sessions || {};
        return Object.keys(sessions).map(function(id) { return sessions[id]; });
    }
 
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // sandboxing for testing
    this.sandboxSetup = function() {
        if (this.trackerData.isSandbox) return;
        console.log('Creating sandbox');
        this.initTrackerData();
        this.trackerData.isSandbox = true;
    }
    
    this.sandboxTearDown = function() {
        if (!this.trackerData.isSandbox) return;
        console.log('Removing sandbox');
        this.resetTrackerData();
    }

}).call(SessionTracker.prototype);

SessionTracker.servers = {}

SessionTracker.createServer = function(options) {
    options = options || {};
    if (!options.route) {
        console.error('Cannot create session tracker server without route!')
        return null;
    }
    if (this.servers[options.route]) {
        console.warn('Not creating new session tracker on route %s -- tracker already existing!', options.route)
        return this.servers[options.route];
    }
    if (!options.subserver && !options.websocketImpl) {
        console.error('To create a SessionTracker either a subserver or a websocketImpl is needed!')
        return null;
    }
    var tracker = new this(options);
    SessionTracker.servers[options.route] = tracker;
    tracker.listen();
    console.log('Session tracker on route %s created', options.route)
    return tracker;
}

SessionTracker.removeServer = function(route) {
    var tracker = this.servers[route];
    if (!tracker) {
        console.warn('Trying to shutdown session tracker on ' + route + ' but found no tracker!');
        return false;
    }
    tracker.shutdown();
    delete this.servers[route];
    console.log('Session tracker route ' + route + ' shutdown');
    return true;
}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// setup HTTP / websocket interface
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = function(route, app, subserver) {
    SessionTracker.createServer({route: route, subserver: subserver});

    app.post(route + 'server-manager', function(req, res) {
        if (!req.body) {res.status(400).end(); return; }
        var servers = global.sessionTrackerTestServers;
        var route = req.body.route;
        if (req.body.action === 'createServer') {
            SessionTracker.createServer({route: route, subserver: subserver});
            res.end();
        } else if (req.body.action === 'removeServer') {
            SessionTracker.removeServer(route);
            res.end();
        } else {
            res.status(400).json({error: 'Cannot deal with server-manager request'}).end();
        }
    });

    app.post(route + 'reset', function(req, res) {
        global.tracker.resetTrackerData();
        res.json({message: 'OK'}).end();
    });

    app.get(route + 'sessions', function(req, res) {
        res.json(global.tracker.getSessionList()).end();
    });

    app.get(route, function(req, res) {
        res.json({tracker: global.tracker.toString(), sessions: global.tracker.getSessionList()}).end();
    });
}

module.exports.SessionTracker = SessionTracker;

