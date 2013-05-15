var util = require('util'),
    path = require('path'),
    j = require('path').join,
    i = function(obj, depth, showAll) { return util.inspect(obj, showAll, typeof depth === 'number' ? depth : 1); },
    async = require(j(process.env.LK_SCRIPTS_ROOT, 'node_modules/async'));

function uuid() { // helper
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

    reportActivity: function(sessionServer, connection, msg) {
         var sessions = sessionServer.trackerData.local.sessions,
            session = sessions[msg.sender] = sessions[msg.sender] || {};
        session.lastActivity = msg.data.lastActivity;
        connection.send({action: msg.action + 'Result', inResponseTo: msg.messageId, data: {success: true}});
    },

    initServerToServerConnect: function(sessionServer, connection, msg) {
        var url = msg.data.url;
        sessionServer.serverToServerConnect(url, function(err, remoteClient) {
            if (err) console.error(err);
            connection.send({action: 'initServerToServerConnectResult', inResponseTo: msg.messageId, data: {success: !err}});
        });
    },

    initServerToServerDisconnect: function(sessionServer, connection, msg) {
        var remoteURLs = Object.keys(sessionServer.serverToServerConnections);
        sessionServer.removeServerToServerConnections();
        connection.send({action: msg.action + 'Result', inResponseTo: msg.messageId, data: {success: true, message: 'Connections to ' + remoteURLs.join(', ') + ' closed'}});
    }
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// SessionTracker
// The main server component for managing sessions. A
// session represents a onlinr connection of a lively
// world that can be used to communicate to/from that world
// The SessionTracker will manage the connections to Lively
// worlds and connections to other Lively servers (server-
// to-server connections). Those connections are used to
// a) route messages from one session to another (local
// seends as well as remote sends requiring server-to-server
// routing are supported).
// Also, certain actions (getSessions, reportActivity) are
// directly processed by the tracker and do not require
// connections to other sessions.
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
    this.serverToServerConnections = {}; // for connections to other servers
    this.inactiveSessionRemovalTime = options.inactiveSessionRemovalTime || 60*1000;
    this.server2serverReconnectTimeout = options.server2serverReconnectTimeout || 60*1000;
    this.initTrackerData();
}

(function() {

    this.id = function() { return this.trackerData && this.trackerData.local.id; }

    this.listen = function() {
        // accepting/connecting with local or server-to-server socket requests
        // this.websocketServer holds a list of those connections
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
        // really close the tracker, ensures that the tracker will not
        // attempt reconnects of closed sockets
        this.websocketServer && this.websocketServer.close();
        this.removeServerToServerConnections();
    }

    this.initTrackerData = function() {
        // this is where the session data gets stored
        this.trackerData = {
            local: {
                id: uuid(),
                hostname: require('os').hostname(),
                sessions: {}
            }
        }
    }

    this.resetTrackerData = function() {
        // cleanup and restart
        this.shutdown();
        this.initTrackerData();
    }

    this.getSessionList = function(options, thenDo) {
        // session list of both local and remote sessions
        // will invoke getSessionList of server-to-server connections
        async.parallel([
            this.getLocalSessionList.bind(this, options),
            this.getServerToServerSessionList.bind(this, options),
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

    this.getServerToServerSessionList = function(options, thenDo) {
        // returns something like
        // {'ws://localhost:9001/nodejs/SessionTrackerFederationTest2/connect': [
        //     {user: 'SessionTrackerTestUser2',
        //     worldURL: 'http://localhost:9001/lively2lively2.html',
        //     id: 'E447959D-93DE-4CB3-81E7-7BBA91CDE6CD' }]}
        var tracker = this;
        this.withServerToServerConnectionsDo(function(next, url, con) {
            if (!con.isOpen()) { callback(null, {error: 'not connected'}); return; }
            con.send(
                {action: 'getSessions', data: {id: tracker.id}},
                function(msg) {
                    var sessions = msg.data;
                    next(null, sessions && sessions.local); });
        }, function(err, serverToServerSessions) {
            if (err) { console.error('%s getServerToServerSessionList: ', this, err);
            }
            thenDo(err, serverToServerSessions);
        });
    }

    this.findConnection = function(id, thenDo) {
        // looks up 1) local 2) remote connections with id
        var con = this.websocketServer.getConnection(id);
        if (con) { thenDo(null, con); return }
        this.debug && console.log('%s trying to find connection %s on remote tracker...', this, id);
        this.getServerToServerSessionList({}, function(err, remotes) {
            if (err) { thenDo(err, null); return; }
            this.debug && console.log('...got remote remotes: ', util.inspect(remotes));
            for (var url in remotes) {
                var sessions = remotes[url];
                for (var i = 0; i < sessions.length; i++) {
                    if (sessions[i].id !== id) continue;
                    var webS = this.serverToServerConnections[url];
                    thenDo(!webS && 'connection not established', webS);
                    return;
                }
            }
            thenDo('not found', null);
        }.bind(this));
    }

    this.fixRemoteServerURL = function(url) {
        // ensure that it ends with "/connect"
        return url.replace(/(\/)?(connect)?$/, '') + '/connect';
    }

    this.serverToServerConnect = function(url, thenDo) {
        // creates a websocket client and tries to connect to another
        // lively tracker at url. The other lively tracker will add this
        // connection simply as another client connection into his
        // websocketServer object
        console.log('Connecting server2server: %s -> %s', this, url);
        // creates a connection to another lively session tracker
        url = this.fixRemoteServerURL(url) ;
        var tracker = this, client = this.getServerToServerConnection(url);
        if (!client) { client = this.serverToServerConnections[url] = new WebSocketClient(url, 'lively-json'); }
        if (client.isOpen()) { thenDo(null, client); return }
        function initReconnect() {
            if (client._trackerIsReconnecting) return;
            client._trackerIsReconnecting = true;
            var registeredClient = tracker.getServerToServerConnection(url);
            tracker.removeServerToServerConnection(url, registeredClient);
            if (!registeredClient) return;
            tracker.startServerToServerConnectAttempt(url);            
        }
        try {
            client.once('connect', function() { thenDo(null, client); });
            client.on('close', function() {
                console.warn('Server to server connection from %s to %s closed', tracker, url);
                // if we haven't initiated the close, we will reconnect
                // otherwise we are ok with the close and do nothing
                initReconnect();
            });
            client.on('error', function(err) {
                console.error('ServerToServer connection %s got error: ', url, err); 
                initReconnect();
            });
            client.connect();
        } catch(e) {
            console.error('server2server connection error (%s -> %s): ',this , url, e);
            thenDo(e);
        }
    }

    this.removeServerToServerConnection = function(url, client) {
        var myClient = this.getServerToServerConnection(url);
        delete this.serverToServerConnections[url];
        if (myClient && client && myClient !== client) {
            console.warn('%s discovered inconsistency in removeServerToServerConnection: removed client does not match specified client', this)
            client && client.close();
        }
        myClient && myClient.close();
    }

    this.startServerToServerConnectAttempt = function(url) {
        console.log('%s attempting server2server connect with %s', this, url);
        var tracker = this, timeout = this.server2serverReconnectTimeout || 60 * 1000;
        setTimeout(function() {
            tracker.serverToServerConnect(url, function(err, con) {
                if (err) tracker.startServerToServerConnectAttempt(url);
                else console.log('server2server connection between %s and %s established', tracker, url);
            });
        }, timeout);
    }

    this.getServerToServerConnection = function(url) {
        return this.serverToServerConnections[url];
    }

    this.withServerToServerConnectionsDo = function(eachDo, thenDo) {
        // run function eachDo in parralel for each server, when actions are
        // done for all servers call thenDo with results (results are a JS
        // map: {URL: eachDo-result})
        var s2sConnections = this.serverToServerConnections,
            tracker = this,
            tasks = Object.keys(s2sConnections).reduce(function(tasks, url) {
                tasks[url] = function(next) { eachDo(next, url, s2sConnections[url]); }
                return tasks;
            }, {});
        async.parallel(tasks, function(err, results/*{URL: eachDo-result}*/) {
            if (err) {
                console.error('%s withServerToServerConnectionsDo: ', tracker, err.stack);
            }
            thenDo(null, results);
        });
    }

    this.removeServerToServerConnections = function() {
        Object.keys(this.serverToServerConnections).forEach(function(url) {
            this.removeServerToServerConnection(url, this.serverToServerConnections[url]); }, this);
    }

    this.startServerToServerSessionReport = function() {
        this._serverToServerSessionReportLoop = setTimeout(function() {
            
        })
    }

    this.toString = function() {
        return util.format('SessionTracker(%s)', this.websocketServer);
    }

}).call(SessionTracker.prototype);

SessionTracker.servers = SessionTracker.servers || {}

SessionTracker.createServer = function(options) {
    // for creating session trackers. One Lively server can host multiple
    // session trackers under different routes
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
    // shuting down session trackers
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

    // will register a default session tracker, route is usually
    // Config.nodeJSURL + '/SessionTracker/'
    global.tracker = SessionTracker.createServer({route: route, subserver: subserver});

    // for creating / removing session trackers from Lively. For experimenting
    // and testing
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

    // json list of sessions of the default tracker
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

// we also export the session tracker class so that we can inspect/modify
// it from Lively:
// SessionTracker = require("./SessionTracker").SessionTracker
// SessionTracker.servers // <-- list of all trackers
// t1 = SessionTracker.servers['/nodejs/SessionTrackerExperiment1/'] // <-- specific server
module.exports.SessionTracker = SessionTracker;
