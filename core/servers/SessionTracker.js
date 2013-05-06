util=require('util')
path=require('path')
var j = require('path').join
var async = require(j(process.env.LK_SCRIPTS_ROOT, 'node_modules/async'));

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
        connection.send({action: req.action + 'Result', data: {success: true}});
    },

    unregisterClient: function(sessionServer, connection, sender, req) {
        var sessions = sessionServer.trackerData.local.sessions;
        delete sessions[req.sender];
        sessionServer.websocketServer.removeConnection(req.sender);
        connection.close();
    },

    getSessions: function(sessionServer, connection, sender, req) {
        sessionServer.getSessionList({}, function(sessions) {
            connection.send({action: req.action, data: sessions});
        })
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
    },

    initServerToServerConnect: function(sessionServer, connection, sender, req) {
        var url = req.data.url;
        sessionServer.serverToServerConnect(url, function(err, remoteClient) {
            if (err) console.error(err);
            connection.send({action: 'initServerToServerConnectResult', data: {success: !err}});
        });
    }
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// SessionTracker
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var WebSocketServer = require('./support/websockets').WebSocketServer;
var WebSocketClient = require('./support/websockets').WebSocketClient;

function SessionTracker(options) {
    // options = {route: STRING, subserver: OBJECT || websocketImpl: OBJECT}
    options = options || {};
    this.route = options.route + 'connect';
    this.subserver = options.subserver;
    this.websocketImpl = this.subserver ?
        this.subserver.handler.server.websocketHandler :
        options.websocketImpl;
    this.websocketServer = new WebSocketServer();
    this.websocketClients = {}; // for connections to other servers
    this.initTrackerData();
}

(function() {

    this.id = function() { return this.trackerData && this.trackerData.local.id; }

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
        this.removeRemoteClients();
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
    
    this.getSessionList = function(options, thenDo) {
        var sessions = this.trackerData.local.sessions || {},
            list = Object.keys(sessions).map(function(id) { return sessions[id]; }),
            result = {local: list};
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var s2sConnections = this.websocketClients, id = this.id;
        var tasks = Object.keys(s2sConnections).reduce(function(tasks, url) {
            tasks[url] = function(callback) {
                var connection = s2sConnections[url];
                connection.send({action: 'getSessions', data: {id: id}});
                connection.on('getSessions', function(sessions) {
                    callback(null, sessions && sessions.local);
                });
            }
            return tasks;
        }, {});
        async.parallel(tasks, function(err, serverToServerSessions) {
            if (err) {
                console.error('%s getSessionList: ', this, err);
            }
            if (serverToServerSessions) result = util._extend(result, serverToServerSessions);
            thenDo(result);
        });
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

    this.fixRemoteServerURL = function(url) {
        // ensure that it ends with "/connect"
        return url.replace(/(\/)?(connect)?$/, '') + '/connect';
    }

    this.serverToServerConnect = function(url, thenDo) {
        // creates a connection to another lively session tracker
        url = this.fixRemoteServerURL(url) ;
        var client = this.websocketClients[url];
        if (client) { if (!client.isOpen()) client.connect(); thenDo(null, client); return; }
        try {
            client = this.websocketClients[url] = new WebSocketClient(url, 'lively-json');
            client.once('connect', function() { thenDo(null, client); });
            client.on('close', function() { this.removeRemoteClient(url, client); }.bind(this));
            client.connect();
        } catch(e) {
            console.error('serverToServerConnect ', e);
            thenDo(e);
        }
    }

    this.removeRemoteClient = function(url, client) {
        var myClient = this.websocketClients[url];
        if (myClient && client && myClient !== client) {
            console.warn('%s discovered inconsistency in removeRemoteClient: removed client does not match specified client', this)
            client && client.close();
        }
        myClient && myClient.close();
        delete this.websocketClients[url];
    }

     this.removeRemoteClients = function() {
        Object.keys(this.websocketClients).forEach(function(url) {
            this.removeRemoteClient(url, this.websocketClients[url]); }, this);
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
    global.tracker = SessionTracker.createServer({route: route, subserver: subserver});

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
        global.tracker.getSessionList({}, function(sessions) {
            res.json(sessions).end();
        });
    });

    app.get(route, function(req, res) {
        global.tracker.getSessionList({}, function(sessions) {
            res.json({tracker: global.tracker.toString(), sessions: sessions}).end();
        });
    });
}

module.exports.SessionTracker = SessionTracker;

