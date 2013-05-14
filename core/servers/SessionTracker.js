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

    registerClient: function(sessionServer, connection, msg) {
        var sessions = sessionServer.trackerData.local.sessions,
            session = sessions[msg.sender] = sessions[msg.sender] || {};
        util._extend(session, msg.data);
        connection.id = msg.data.id;
        connection.on('close', function() {
            // remove the session registration after the connection closes
            // give it some time because the connection might be just flaky and
            // the client might come back
            if (!sessions[msg.sender]) return; // unregistered
            if (!sessionServer.inactiveSessionRemovalTime) return;
            setTimeout(function() {
                var newConnection = sessionServer.websocketServer.getConnection(msg.sender);
                if (!newConnection) delete sessions[msg.sender];
            }, sessionServer.inactiveSessionRemovalTime);
            console.log('need to invalidate session');
        })
        connection.send({action: msg.action + 'Result', inResponseTo: msg.messageId, data: {success: true}});
    },

    unregisterClient: function(sessionServer, connection, msg) {
        var sessions = sessionServer.trackerData.local.sessions;
        delete sessions[msg.sender];
        sessionServer.websocketServer.removeConnection(msg.sender);
        connection.close();
    },

    getSessions: function(sessionServer, connection, msg) {
        sessionServer.getSessionList({}, function(sessions) {
            connection.send({
                action: msg.action,
                inResponseTo: msg.messageId,
                data: sessions
            });
        })
    },

    remoteEvalRequest: function(sessionServer, connection, msg) {
        var sessions = sessionServer.trackerData.local.sessions || {},
            target = msg.data.target;
        sessionServer.findConnection(target, function(err, targetConnection) {
            if (err || !targetConnection) {
                connection.send({
                    action: msg.action + 'Result',
                    inResponseTo: msg.messageId,
                    data: {error: 'Failure finding target connection: ' + err, target: msg.data.target}
                });
                return;
            }
            targetConnection.send(
                {action: msg.action, data: msg.data},
                function(answer) { connection.send({
                    action: msg.action + 'Result',
                    inResponseTo: msg.messageId,
                    data: answer.data
                });
            });
        })
    },

    initServerToServerConnect: function(sessionServer, connection, msg) {
        var url = msg.data.url;
        sessionServer.serverToServerConnect(url, function(err, remoteClient) {
            if (err) console.error(err);
            connection.send({action: 'initServerToServerConnectResult', inResponseTo: msg.messageId, data: {success: !err}});
        });
    },

    initServerToServerDisconnect: function(sessionServer, connection, msg) {
        var remoteURLs = Object.keys(sessionServer.websocketClients);
        sessionServer.removeRemoteClients();
        connection.send({action: msg.action + 'Result', inResponseTo: msg.messageId, data: {success: true, message: 'Connections to ' + remoteURLs.join(', ') + ' closed'}});
    }
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// SessionTracker
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var websockets = require('./support/websockets');
var WebSocketServer = websockets.WebSocketServer;
var WebSocketClient = websockets.WebSocketClient;

function SessionTracker(options) {
    // options = {route: STRING, subserver: OBJECT}
    this.debug = true;
    options = options || {};
    this.route = options.route + 'connect';
    this.subserver = options.subserver;
    this.websocketServer = new WebSocketServer();
    this.websocketClients = {}; // for connections to other servers
    this.inactiveSessionRemovalTime = options.inactiveSessionRemovalTime || 60*1000;
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
            subserver: this.subserver
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
        async.parallel([
            this.getLocalSessionList.bind(this, options),
            this.getRemoteSessionList.bind(this, options),
        ], function(err, sessions) {
            if (err) {
                console.error('%s getSessionList: ', this, err);
            }
            var result = sessions[0]
            util._extend(result, sessions[1]);
            thenDo(result);
        });
    }

    this.getLocalSessionList = function(options, thenDo) {
        var sessions = this.trackerData.local.sessions || {},
            list = Object.keys(sessions).map(function(id) { return sessions[id]; }),
            result = {local: list};
        thenDo(null, result);
    }

    this.getRemoteSessionList = function(options, thenDo) {
        // returns something like
        // {'ws://localhost:9001/nodejs/SessionTrackerFederationTest2/connect': [
        //     {user: 'SessionTrackerTestUser2',
        //     worldURL: 'http://localhost:9001/lively2lively2.html',
        //     id: 'E447959D-93DE-4CB3-81E7-7BBA91CDE6CD' }]}
        var s2sConnections = this.websocketClients, id = this.id();
        var tasks = Object.keys(s2sConnections).reduce(function(tasks, url) {
            tasks[url] = function(callback) {
                s2sConnections[url].send({action: 'getSessions', data: {id: id}}, function(msg) {
                    var sessions = msg.data;
                    callback(null, sessions && sessions.local);
                });
            }
            return tasks;
        }, {});
        async.parallel(tasks, function(err, serverToServerSessions) {
            if (err) {
                console.error('%s getRemoteSessionList: ', this, err);
            }
            thenDo(null, serverToServerSessions);
        }.bind(this));
    }

    this.findConnection = function(id, thenDo) {
        // 1) Local lookup:
        var con = this.websocketServer.getConnection(id);
        if (con) { thenDo(null, con); return }
        this.debug && console.log('%s trying to find connection %s on remote tracker...', this, id);
        this.getRemoteSessionList({}, function(err, remotes) {
            if (err) { thenDo(err, null); return; }

            this.debug && console.log('...got remote remotes: ', util.inspect(remotes));
            for (var url in remotes) {
                var sessions = remotes[url];
                for (var i = 0; i < sessions.length; i++) {
                    if (sessions[i].id !== id) continue;
                    var webS = this.websocketClients[url];
                    thenDo(!webS && 'connection not established', webS);
                    return;
                }
            }
            thenDo('not found', null);
        }.bind(this));
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

SessionTracker.servers = SessionTracker.servers || {}

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
    if (!options.subserver) {
        console.warn('SessionTracker without subserver created!')
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
        var servers = global.sessionTrackerTestServers,
            options = req.body.options,
            route = (options && options.route) || req.body.route;
        if (req.body.action === 'createServer') {
            options = options || {};
            options.route = route; options.subserver = subserver;
            SessionTracker.createServer(options);
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
        // gather sessions from trackers on all routes
        var tasks = Object.keys(SessionTracker.servers).reduce(function(tasks, route) {
            var tracker = SessionTracker.servers[route];
            tasks[route] = function(next) { tracker.getSessionList({}, function(sessions) { next(null, sessions); }); }
            return tasks;
        }, {});
        async.parallel(tasks, function(err, trackerSessions) {
            res.json(trackerSessions).end();
        });
    });
}

module.exports.SessionTracker = SessionTracker;
