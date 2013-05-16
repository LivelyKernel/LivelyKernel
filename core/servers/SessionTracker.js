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
        var sessions = sessionServer.getLocalSessions(),
            session = sessions[msg.sender] = sessions[msg.sender] || {};
        util._extend(session, msg.data);
        util._extend(session, {remoteAddress: connection.remoteAddress});
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
        connection.send({
            action: msg.action + 'Result',
            inResponseTo: msg.messageId,
            data: {success: true, tracker: {id: sessionServer.id()}}
        });
    },

    unregisterClient: function(sessionServer, connection, msg) {
        var sessions = sessionServer.getLocalSessions();
        delete sessions[msg.sender];
        sessionServer.websocketServer.removeConnection(msg.sender);
        connection.close();
    },

    getSessions: function(sessionServer, connection, msg) {
        sessionServer.getSessionList(msg.data.options, function(sessions) {
            connection.send({
                action: msg.action,
                inResponseTo: msg.messageId,
                data: sessions
            });
        })
    },

    remoteEvalRequest: function(sessionServer, connection, msg) {
        var sessions = sessionServer.getLocalSessions(),
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
         var sessions = sessionServer.getLocalSessions(),
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
    },

    reportSessions: function(sessionServer, connection, msg) {
        // another tracker is reporting its sessions to sessionServer.
        // sessionServer is acting as a "lively2lively central"
        if (!msg.data || !msg.data.trackerId) {
            console.error('%s got reportSession request without id: ', this, msg);
            return;
        }
        var id = connection.id = msg.data.trackerId;
        sessionServer.trackerData[id] = msg.data.local;
        console.log('%s got reportSessions request, session reported: ', this, sessionServer.trackerData[id]);
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
    this.trackerId = uuid();
    this.websocketServer = new WebSocketServer({id: this.trackerId});
    this.serverToServerConnections = {}; // for connections to other servers
    this.inactiveSessionRemovalTime = options.inactiveSessionRemovalTime || 60*1000;
    this.server2serverReconnectTimeout = options.server2serverReconnectTimeout || 60*1000;
    this.initTrackerData();
}

(function() {

    this.id = function() { return this.trackerId }

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
        this.stopServerToServerSessionReport();
    }

    this.initTrackerData = function() {
        // this is where the session data gets stored
        this.trackerData = {};
        this.trackerData[this.id()] = {
            isLocal: true,
            hostname: require('os').hostname(),
            sessions: {}
        }
    }

    this.resetTrackerData = function() {
        // cleanup and restart
        this.shutdown();
        this.initTrackerData();
    }

    this.getSessionList = function(options, thenDo) {
        // session list of both local and remote sessions
        // will invoke getSessionList of server-to-server connections unless
        // explicitly stated otherwise in options
        options = options || {};
        var tasks = [this.getLocalSessionList.bind(this, options)];
        if (!options.onlyLocal) tasks.push(this.getServerToServerSessionList.bind(this, options));
        var tracker = this;
        async.parallel(tasks, function(err, sessions) {
            if (err) {
                console.error('%s getSessionList: ', this, err);
            }
            var result = sessions[0];
            if (!options.onlyLocal) util._extend(result, sessions[1]);
            thenDo(result);
        });
    }

    this.getLocalSessions = function(options) {
        return (this.trackerData[this.id()] && this.trackerData[this.id()].sessions) || [];
    }

    this.getLocalSessionList = function(options, thenDo) {
        var sessions = this.getLocalSessions(),
            list = Object.keys(sessions).map(function(id) { return sessions[id]; }),
            result = {};
        result[this.trackerId] = list;
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
                {action: 'getSessions', data: {options: {onlyLocal: true}}},
                function(msg) {
                    con.id = msg.sender; // FIXME we are recording the remote tracker id here because we
                                         // want to send requests to the tracker just based on the id.
                                         // This should actually got into the connect-to-remote-tracker
                                         // logic
                    var sessions = msg.data,
                        result = {remoteTrackerId: msg.sender, sessions: sessions && sessions[msg.sender]};
                    next(null, result); });
        }, function(err, serverToServerSessions) {
            if (err) { console.error('%s getServerToServerSessionList: ', this, err);
            }
            var result = {};
            Object.keys(serverToServerSessions).forEach(function(url) {
                var ea = serverToServerSessions[url];
                result[ea.remoteTrackerId] = ea.sessions;
            });
            thenDo(err, result);
        });
    }

    this.findConnection = function(id, thenDo) {
        // looks up 1) local 2) remote connections with id
        var con = this.websocketServer.getConnection(id);
        if (con) { thenDo(null, con); return }
        this.debug && console.log('%s trying to find connection %s on remote tracker...', this, id);
        // FIXME finding remote connections currently only works because ids to
        // remote tracker connections are assigned #getServerToServerSessionList
        // see comment in #getServerToServerSessionList for more detail
        this.getServerToServerSessionList({}, function(err, remotes) {
            if (err) { thenDo(err, null); return; }
            for (var remoteTrackerId in remotes) {
                var sessions = remotes[remoteTrackerId];
                for (var i = 0; i < sessions.length; i++) {
                    if (sessions[i].id !== id) continue;
                    var webS = this.getServerToServerConnectionById(remoteTrackerId);
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
        if (!client) { client = this.serverToServerConnections[url] = new WebSocketClient(url, {protocol: 'lively-json', id: this.trackerId}); }
        if (client.isOpen()) { thenDo(null, client); return }
        function initReconnect() {
            if (client._trackerIsReconnecting) return;
            client._trackerIsReconnecting = true;
            var registeredClient = tracker.getServerToServerConnection(url);
            tracker.removeServerToServerConnection(url, registeredClient);
            if (Object.keys(tracker.serverToServerConnections).length) tracker.stopServerToServerSessionReport();
            if (!registeredClient) return;
            tracker.startServerToServerConnectAttempt(url);            
        }
        try {
            client.once('connect', function() { tracker.startServerToServerSessionReport(); thenDo(null, client); });
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

    this.getServerToServerConnectionById = function(id) {
        for (var url in this.serverToServerConnections) {
            var con = this.serverToServerConnections[url];
            if (con.id === id) return con;
        }
        return null;
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
        var tracker = this;
        function reportSessions(next, url, con) {
            tracker.getLocalSessionList(null, function(err, sessions) {
                if (!con.isOpen()) { next(null, {error: 'not connected'}); return; }
                if (err) { next(null, {error: err}); return; }
                con.send(
                    {action: 'reportSessions', data: util._extend(sessions, {trackerId: tracker.id()})},
                    function(msg) { next(null, msg.data); });
            });
        }
        function whenDone(err, reportResult) {
            console.log("%s sending session reports: ", reportResult);
            var delay = tracker.serverToServerSessionReportDelay || 5 * 60 * 1000;
            tracker._serverToServerSessionReportLoop = setTimeout(tracker.startServerToServerSessionReport.bind(tracker), delay);
        }
        tracker.withServerToServerConnectionsDo(reportSessions, whenDone);
    }

    this.stopServerToServerSessionReport = function() {
        clearTimeout(this._serverToServerSessionReportLoop);
        delete this._serverToServerSessionReportLoop;
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
