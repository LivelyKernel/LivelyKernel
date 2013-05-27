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

var debugLevel = 1;

var debugThreshold = 1;
function log(/*level, msg, arguments*/) {
    // the smaller logLevel the more important the message
    var args = Array.prototype.slice.call(arguments);
    var logLevel = typeof args[0] === 'number' ? args.shift() : 1;
    if (logLevel > debugThreshold) return;
    console.log.apply(console, args);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// session actions, when messages come in they specify in
// their "action" parameter what they want to do. This is
// the table that defines what functions are behind those
// actions.
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var sessionActions = {

    registerClient: function(sessionServer, connection, msg) {
        var sessions = sessionServer.getLocalSessions()[sessionServer.id()],
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
                if (!newConnection) {
                    log(2, '%s removes local session of %s', sessionServer, msg.sender);
                    delete sessions[msg.sender];
                }
            }, sessionServer.inactiveSessionRemovalTime);
        });
        connection.send({
            action: msg.action + 'Result',
            inResponseTo: msg.messageId,
            data: {success: true, tracker: {id: sessionServer.id()}}
        });
    },

    unregisterClient: function(sessionServer, connection, msg) {
        sessionServer.removeLocalSessionOf(msg.sender);
        connection.send({
            action: msg.action + 'Result',
            inResponseTo: msg.messageId, data: {success: true}});
        connection.close();
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

    getSessions: function(sessionServer, connection, msg) {
        // send the sessions accessible from this tracker. includes local sessions,
        // reported sessions
        sessionServer.getSessionList(msg.data.options, function(sessions) {
            connection.send({
                action: msg.action,
                inResponseTo: msg.messageId,
                data: sessions
            });
        })
    },

    reportSessions: function(sessionServer, connection, msg) {
        // another tracker is reporting its sessions to sessionServer.
        // sessionServer is acting as a "lively2lively central"
        if (!msg.data || !msg.data.trackerId) {
            console.error('%s got reportSession request without id: ', sessionServer, msg);
            return;
        }
        var id = connection.id = msg.data.trackerId;
        connection.on('close', function() {
            if (!sessionServer.inactiveSessionRemovalTime) return;
            setTimeout(function() {
                var newConnection = sessionServer.websocketServer.getConnection(msg.sender);
                if (!newConnection) {
                    log(2, '%s removes reported session of %s', sessionServer, id);
                    delete sessionServer.trackerData[id];
                }
            }, sessionServer.inactiveSessionRemovalTime);
        });
        sessionServer.trackerData[id] = {sessions: msg.data[id]};
        connection.send({action: msg.action + 'Result', inResponseTo: msg.messageId, data: {success: true, message: 'Sessions added to ' + sessionServer}});
    },

    reportActivity: function(sessionServer, connection, msg) {
        // lively session sends infos about last user activity from time to time
         var sessions = sessionServer.getLocalSessions()[sessionServer.id()],
            session = sessions[msg.sender] = sessions[msg.sender] || {};
        session.lastActivity = msg.data.lastActivity;
        connection.send({action: msg.action + 'Result', inResponseTo: msg.messageId, data: {success: true}});
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
var websockets = require(path.join(process.env.WORKSPACE_LK, 'core/servers/support/websockets'));
var WebSocketServer = websockets.WebSocketServer;
var WebSocketClient = websockets.WebSocketClient;

function SessionTracker(options) {
    // options = {route: STRING, subserver: OBJECT}
    this.debug = debugLevel;
    options = options || {};
    this.route = options.route + 'connect';
    this.subserver = options.subserver;
    this.trackerId = 'tracker-' + uuid();
    this.websocketServer = new WebSocketServer({sender: this.trackerId, debugLevel: this.debug});
    this.serverToServerConnections = {}; // for connections to other servers
    this.inactiveSessionRemovalTime = options.inactiveSessionRemovalTime || 60*1000;
    this.server2serverReconnectTimeout = options.server2serverReconnectTimeout || 60*1000;
    this.initTrackerData();
}

(function() {

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // initialization
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    this.id = function() { return this.trackerId }

    this.getActions = function(informFunc) {
        var sessionTracker = this;
        return Object.keys(sessionActions).reduce(function(actions, name) {
            if (informFunc) {
                actions[name] = function(con, msg) { informFunc(sessionTracker, con, msg); sessionActions[name](sessionTracker, con, msg) };
            } else {
                actions[name] = sessionActions[name].bind(null, sessionTracker);
            }
            return actions;
        }, {});
    }

    this.listen = function() {
        // accepting/connecting with local or server-to-server socket requests
        // this.websocketServer holds a list of those connections
        this._dispatchLivelyMessageFromServer = this._dispatchLivelyMessageFromServer
                                             || this.dispatchLivelyMessageFromServer.bind(this);
        this.websocketServer.on('lively-message', this._dispatchLivelyMessageFromServer);
        this.websocketServer.listen({
            route: this.route,
            actions: this.getActions(),
            subserver: this.subserver
        });
    }

    this.shutdown = function() {
        // really close the tracker, ensures that the tracker will not
        // attempt reconnects of closed sockets
        if (this._dispatchLivelyMessageFromServer)
            tracker.websocketServer.removeListener('lively-message', this._dispatchLivelyMessageFromServer);
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

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // message dispatch
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    this.dispatchLivelyMessage = function(msg, connection) {
        if (msg.target && msg.target !== this.trackerId) {
            this.routeMessage(msg, connection); return; }
        var actions = this.getActions(),
            action = actions[msg.action];
        if (action) action(connection, msg);
        else if (actions.messageNotUnderstood) actions.messageNotUnderstood(connection, msg);
        else connection.send({
            action: msg.action + 'Result',
            inResponseTo: msg.messageId,
            data: {error: 'cannot dispatch message'},
            target: msg.sender,
            messageId: response.messageId
        });
    }

    this.dispatchLivelyMessageFromServer = function(msg, connection) {
        this.dispatchLivelyMessage(msg, connection);
    }

    this.dispatchLivelyMessageFromServerToServerConnection = function(msg, connection) {
        this.dispatchLivelyMessage(msg, connection);
    }

    this.routeMessage = function(msg, connection) {
        log(3, '%s routing %s to %s', this, msg.action, msg.target);
        function answer(response) {
            log(3, '%s got answer from routed message %s: ', tracker, msg.messageId, response);
            connection.send({
                action: msg.action + 'Result',
                inResponseTo: msg.messageId,
                data: response.data,
                target: msg.sender,
                messageId: response.messageId
            });
        }
        var tracker = this, target = msg.target || msg.data.target;
        if (!target) { answer({data: {error: 'Message does not specify target'}}); return; }
        this.findConnection(target, function(err, targetConnection) {
            if (err || !targetConnection) {
                console.warn('%s failed to route message: Failure finding target connection: ', tracker, err);
                answer({data: {error: 'Failure finding target connection: ' + err, target: target}})
                return; }
            targetConnection.send({
                action: msg.action,
                data: msg.data,
                sender: msg.sender,
                target: target,
                messageId: msg.messageId
            }, answer);
        });
    }
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    this.getSessionList = function(options, thenDo) {
        // session list of both local and remote sessions
        // will invoke getSessionList of server-to-server connections unless
        // explicitly stated otherwise in options
        options = options || {};
        var tasks = [this.getLocalSessions.bind(this, options)];
        if (!options.onlyLocal) tasks.push(this.getServerToServerSessionList.bind(this, options));
        var tracker = this;
        async.parallel(tasks, function(err, sessions) {
            if (err) {
                console.error('%s getSessionList: ', this, err);
            }
            var result = sessions[0];
            if (options.onlyLocal) { thenDo(result); return; }
            // sessions[1] looks like [{
            //  url: {
            //    connection: WEBSOCKET_CONNECTION,
            //    remoteTrackerId: ID,
            //    trackersWithSessions: {trackerId: {sessionId: {session_spec}}}
            //  }}]
            // flatten it so that {trackerId: {sessionId: {sess spec}*}}
            Object.keys(sessions[1]).forEach(function(url) {
                var remote = sessions[1][url];
                util._extend(result, remote.trackersWithSessions)
            });
            thenDo(result);
        });
    }

    this.getLocalSessions = function(options, thenDo) {
        var result = {};
        Object.keys(this.trackerData).forEach(function(trackerId) {
            result[trackerId] = this.trackerData[trackerId].sessions;
        }, this);
        if (!result[this.id()]) result[this.id()] = {};
        thenDo && thenDo(null, result);
        return result;
    }

    this.removeLocalSessionOf = function(sessionId) {
        var sessions = this.getLocalSessions()[this.id()];
        delete sessions[sessionId];
        this.websocketServer.removeConnection(sessionId);
    }

    this.getServerToServerSessionList = function(options, thenDo) {
        // returns something like
        // {'ws://localhost:9001/nodejs/SessionTrackerFederationTest2/connect': [
        //     {user: 'SessionTrackerTestUser2',
        //     worldURL: 'http://localhost:9001/lively2lively2.html',
        //     id: 'E447959D-93DE-4CB3-81E7-7BBA91CDE6CD' }]}
        var tracker = this;
        this.withServerToServerConnectionsDo(function(next, url, con) {
            if (!con.isOpen()) { next(null, {error: 'not connected'}); return; }
            con.send(
                {action: 'getSessions', data: {options: {onlyLocal: true}}},
                function(msg) {
                    // get sessions gives us a map like {
                    //   trackerId1: {sessionId1: {/*sessiondata*/}, sessionId2: {...}},
                    //   trackerId2: {sessionId3: {/*sessiondata*/}, sessionId4: {...}},
                    //   ... }
                    // note that the onlyLocal flag will still gives us sessions of
                    // other trackers that were added by those trackers themselves
                    // via reportSessions. To get the sessions of the tracker we are
                    // directly talking to use
                    //   sessions = msg.data;
                    //   trackerSessions = sessions[msg.sender];
                    con.id = msg.sender; // FIXME we are recording the remote tracker id here because we
                                         // want to send requests to the tracker just based on the id.
                                         // This should actually got into the connect-to-remote-tracker
                                         // logic
                    next(null, {remoteTrackerId: msg.sender, trackersWithSessions: msg.data, connection: con}); });
        }, function(err, serverToServerSessions) {
            if (err) { console.error('%s getServerToServerSessionList: ', this, err); }
            // sanity check
            Object.keys(serverToServerSessions || {}).forEach(function(url) {
                if (serverToServerSessions[url].error) {
                    console.warn('%s cannot get server2server sessions from %s because of %s', tracker, url, serverToServerSessions[url].error);
                    delete serverToServerSessions[url];
                }
            });
            thenDo(err, serverToServerSessions);
        });
    }

    this.findConnection = function(id, thenDo) {
        // looks up 1) local 2) remote connections with id
        var tracker = this;
        log(3, '%s trying to find connection %s...', tracker, id);
        var con = tracker.websocketServer.getConnection(id);
        if (con) {
            log(3, '... found connection in websocketServer, %s -> %s', tracker.id(), con.id);
            thenDo(null, con); return; }
        log(3, '... searching among reported sessions...');
        var trackerIdsAndSessions = tracker.getLocalSessions({});
        for (var trackerId in trackerIdsAndSessions) {
            if (id === trackerId) {
                var con = tracker.getServerToServerConnectionById(trackerId);
                thenDo(!con && 'not found', con);
                return;
            }
            var sessions = trackerIdsAndSessions[trackerId];
            for (var sessionId in sessions) {
                if (sessionId !== id) continue;
                tracker.findConnection(trackerId, thenDo);
                return;
            }
        }
        log(3, '%s trying to find connection %s on remote tracker...', tracker, id);
        // FIXME finding remote connections currently only works because ids to
        // remote tracker connections are assigned #getServerToServerSessionList
        // see comment in #getServerToServerSessionList for more detail
        tracker.getServerToServerSessionList({}, function(err, remotes) {
            if (err) { thenDo(err, null); return; }
            for (var url in remotes) {
                var remote = remotes[url];
                for (var remoteTrackerId in remote.trackersWithSessions) {
                    var sessions = remote.trackersWithSessions[remoteTrackerId];
                    for (var sessionId in sessions) {
                        if (sessionId !== id) continue;
                        var connection = remote.connection || tracker.getServerToServerConnectionById(remoteTrackerId);
                        thenDo(!connection && 'connection not established', connection);
                        return;
                    }
                }
            }
            thenDo('not found', null);
        });
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
        log(2, 'Connecting server2server: %s -> %s', this, url);
        // creates a connection to another lively session tracker
        url = this.fixRemoteServerURL(url) ;
        var tracker = this, client = this.getServerToServerConnection(url) 
                                  || new WebSocketClient(url, {
                                        protocol: 'lively-json',
                                        sender: this.trackerId,
                                        debugLevel: this.debug
                                    });
        this.serverToServerConnections[url] = client;
        if (client.isOpen()) { log(2, 'Server to server connection to %s already open', url); thenDo(null, client); return }
        function initReconnect() {
            if (client._trackerIsReconnecting) return;
            if (tracker.getServerToServerConnection(url)) { // accidental close, we will reconnect
                client._trackerIsReconnecting = true;
                tracker.startServerToServerConnectAttempt(url);            
            } else { // close ok with us, cleanup
                log(2, '%s removes server2server connection %s', tracker, url);
                tracker.removeServerToServerConnection(url, client);
            }
            if (Object.keys(tracker.serverToServerConnections).length === 0) tracker.stopServerToServerSessionReport();
        }
        try {
            client.once('connect', function(connection) {
                client._trackerIsReconnecting = false; tracker.startServerToServerSessionReport(); thenDo(null, client); });
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
            tracker._dispatchLivelyMessageFromServerToServerConnection = tracker._dispatchLivelyMessageFromServerToServerConnection
                                                                      || tracker.dispatchLivelyMessageFromServerToServerConnection.bind(tracker);
            client.on('lively-message', tracker._dispatchLivelyMessageFromServerToServerConnection);
            client.connect();
        } catch(e) {
            console.error('server2server connection error (%s -> %s): ',this , url, e);
            thenDo(e);
        }
    }

    this.startServerToServerConnectAttempt = function(url) {
        log(3, '%s attempting server2server connect with %s', this, url);
        var tracker = this, timeout = this.server2serverReconnectTimeout || 60 * 1000;
        setTimeout(function() {
            tracker.serverToServerConnect(url, function(err, con) {
                if (err) tracker.startServerToServerConnectAttempt(url);
                else log(1, 'server2server connection between %s and %s established', tracker, url);
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

    this.removeServerToServerConnection = function(url, client) {
        var myClient = this.getServerToServerConnection(url);
        delete this.serverToServerConnections[url];
        if (myClient && client && myClient !== client) {
            console.warn('%s discovered inconsistency in removeServerToServerConnection: removed client does not match specified client', this)
            client && client.removeAllListeners('error').removeAllListeners('close').close();
        }
        myClient && myClient.removeAllListeners('error').removeAllListeners('close').close();
    }

    this.removeServerToServerConnections = function() {
        var tracker = this;
        Object.keys(this.serverToServerConnections).forEach(function(url) {
            tracker.removeServerToServerConnection(url, tracker.getServerToServerConnection(url)); });
    }

    this.startServerToServerSessionReport = function() {
        log(3, '%s initiaing serverToServerSessionReport', this);
        var tracker = this;
        function reportSessions(next, url, con) {
            if (!con.isOpen()) { next(null, {error: 'not connected'}); return; }
            var sessions = tracker.getLocalSessions();
            log(3, '%s sending serverToServerSessionReport to %s', tracker, url, sessions);
            con.send({
                action: 'reportSessions', 
                target: con.connection && con.connection.id,
                data: util._extend(sessions, {trackerId: tracker.id()})
            },function(msg) { next(null, msg.data); });
        }
        function whenDone(err, reportResult) {
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

SessionTracker.servers = (global.tracker && global.tracker.constructor.servers) || {}
Object.keys(SessionTracker.servers).forEach(function(route) {
    var tracker = SessionTracker.servers[route];
    tracker.shutdown(); tracker.listen();
});

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
    log(1, 'Session tracker on route %s created', options.route)
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
    log(1, 'Session tracker route ' + route + ' shutdown');
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
