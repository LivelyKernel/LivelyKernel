/*global Buffer, module, require, setTimeout*/

var debug = true;
var exec  = require("child_process").exec;
var async = require("async");
var path  = require("path");
var util  = require("util");
var fs    = require("fs");

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/*
require("./ClojureServer").clientConnectionState

require("./ClojureServer").clientConnectionState["7888"].lsSessions(function(err, sessions) { console.log(JSON.stringify(sessions)); })

delete require.cache[require.resolve("nrepl-client")]
var ports = require("./ClojureServer").clientConnectionState
Object.keys(ports).forEach(function(port) { ports[port] && ports[port].end(); });
delete require("./ClojureServer").clientConnectionState;

con.interrupt("36B0531A-DDA0-4498-85A8-A7E414BD2B90", function() { console.log(arguments); })
con.interrupt(undefined, function() { console.log(arguments); })
con.address()
con.end()


Strings.newUUID()
con.eval("E1599EDF-2B44-4E4A-BB31-EB00D8F04AE6", "(+ 2 3)", function(err, result) { console.log(err || result); })
con.eval("", function(err, result) { console.log(err || result); })
Global.nreplConnection = con;

b=require("/home/lively/clojure-om/node-nrepl-client/node_modules/bencode")
b.
*/

var clientConnectionState = module.exports.clientConnectionState || {}

var requiredVersion = "0.2.1";
function isNREPLVersionOK(thenDo) {
    async.waterfall([
        function(next) { next(null, path.join(require.resolve("nrepl-client"), '../../package.json')); },
        fs.readFile,
        function(content, next) {
            try { next(null, JSON.parse(content)); } catch (e) { next(e); }
        },
        function(json, next) { next(null, json && json.version); }
    ], function(err, version) {
        if (err) console.error("Cannot find nrepl version:", err);
        thenDo(null, err ? false : version === requiredVersion);
    });
}

function installNREPLModule(thenDo) {
    console.log("Installing nodejs module nrepl-client");
    var path = require('path'),
        fs = require('fs'),
        node_modules = path.join(process.env.WORKSPACE_LK, 'node_modules');
    exec("if [[ -d nrepl-client ]] then; cd nrepl-client; git pull; else git clone https://github.com/rksm/node-nrepl-client nrepl-client; fi; cd nrepl-client; npm install;",
        {cwd: path.join(process.env.WORKSPACE_LK, 'node_modules')},
        function(code, out, err) {
            try { var nreplClient = require("nrepl-client"); } catch (e) { thenDo(e, null); return; }
            console.log("nrepl-client installed");
            thenDo(null, nreplClient);
        });

}
function ensureNreplModule(thenDo) {
    try {
        var nreplClient = require("nrepl-client");
        process.nextTick(function() { thenDo(null, nreplClient); });
    } catch (e) { installNREPLModule(thenDo); return; }
    isNREPLVersionOK(function(err, isOK) {
        console.log("ClojureServer: nREPL version is %sOK", isOK ? "" : "not ");
        if (isOK) thenDo(null, nreplClient);
        else installNREPLModule(thenDo);
    })
}

function ensureNreplConnection(options, thenDo) {
    options = options || {};
    var port = options.port || 7888;
    var host = options.host || "0.0.0.0";
    var name = host + ":" + port

    if (clientConnectionState[name]) {
        thenDo(null, clientConnectionState[name]);
        return;
    }

    debug && console.log("ClojureServer has no nREPL connection yet. Looking for nREPL server");
    async.waterfall([
        ensureNreplModule,
        function(nreplClient, next) {
            var nreplOpts = {host: host, port: port, verbose: debug};
            var c = clientConnectionState[name] = nreplClient.connect(nreplOpts);
            c.on("error", function(err) { next(err); });
            c.once("connect", function() { next(null, c); });
            c.once("close", function() { clientConnectionState[name] = null; });
        }
    ], function(err, con) {
        if (err) console.error("Error in ensureNreplConnection: ", err);
        thenDo(err, con);
    });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Lively2Lively clojure interface
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function l2lAnswer(conn, msg, more, data) {
    conn.send({expectMoreResponses: more,
        action: msg.action + 'Result',
        inResponseTo: msg.messageId, data: data});
}

function l2lActionWithNREPLConnection(l2lConnection, msg, nreplConFunc) {
    var nreplOptions = msg.data.nreplOptions || {};
    async.waterfall(
        [ensureNreplConnection.bind(null, nreplOptions), nreplConFunc],
        function(err, result) {
            var data = err ? {error: String(err)} : result;
            l2lAnswer(l2lConnection, msg, false, data);
        });
}

util._extend(require("./LivelyServices").services, {

    clojureClone: function(sessionServer, c, msg) {
        l2lActionWithNREPLConnection(c, msg, function(con, whenDone) { con.clone(msg.data.session, whenDone); });
    },

    clojureClose: function(sessionServer, c, msg) {
        l2lActionWithNREPLConnection(c, msg, function(con, whenDone) { con.close(msg.data.session, whenDone); });
    },

    clojureDescribe: function(sessionServer, c, msg) {
        l2lActionWithNREPLConnection(c, msg, function(con, whenDone) { con.describe(msg.data.session, msg.data.verbose, whenDone); });
    },

    clojureEval: function(sessionServer, c, msg) {
        var code = msg.data.code;
        var session = msg.data.session;
        var sendResult, nreplCon;
        debug && console.log("Clojure eval: ", code);

        async.waterfall([
            function(next) {
                l2lActionWithNREPLConnection(c, msg, function(_nreplCon, _sendResult) {
                    nreplCon = _nreplCon; sendResult = _sendResult;
                    next(null);
                })
            },
            function findSession(next) {
                if (!session || nreplCon.sessions.indexOf(session) > -1) next(null, nreplCon.sessions)
                else nreplCon.lsSessions(function(err, result) {
                    if (err) next(err, null);
                    else next(null, (result && result[0] && result[0].sessions) || []);
                }); 
            },
            function testIfSessionIsAvailable(sessions, next) {
                if (!session || sessions.indexOf(session) > -1) next(null);
                else next(new Error("No session " + session));
            },

            function createSessionIfNeeded(next) {
                if (session) return next(null);
                nreplCon.clone(function(err, msg) {
                    if (err || !msg[0]['new-session']) next(err || new Error("Could not create new nREPL session"));
                    else {
                        session = msg[0]['new-session'];
                        next(null);
                    }
                });
            },

            function doEval(next) {
                var evalMsg = nreplCon.eval(code, session, function(err, result) {/*currently ignored*/}),
                    id = evalMsg.id,
                    messageSequenceListenerName = "messageSequence-"+evalMsg.id;
                l2lAnswer(c, msg, true, {"eval-id": evalMsg.id, session: session});
                nreplCon.messageStream.once("error", onError);
                nreplCon.messageStream.on(messageSequenceListenerName, onMessageSequence);
    
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-            
    
                function cleanup() {
                    nreplCon.messageStream.removeListener(messageSequenceListenerName, onMessageSequence);
                    nreplCon.messageStream.removeListener("onError", onError);
                }

                function onMessageSequence(messages) {
                    var done = util.isArray(messages) && messages.any(function(msg) {
                        return msg.status && msg.status.indexOf("done") > -1; });
                    if (!done) l2lAnswer(c, msg, true, messages);
                    else { cleanup(); next(null, messages); }
                }
                function onError(err) { cleanup(); nreplCon.end(); next(err, null); }
            }
        ], function(err, result) {
            if (err) console.error("Error in clojureEval l2l handler: ", err);
            if (!sendResult) sendResult = function(err, result) {
                l2lAnswer(c, msg, false, err ? {error: String(err)} : result); };
            sendResult(err, result);
        });
    },

    clojureEvalInterrupt: function(sessionServer, c, msg) {
        debug && console.log("Clojure interrupt: ", msg.data['eval-id']);
        l2lActionWithNREPLConnection(c, msg, function(con, whenDone) {
            con.interrupt(msg.data.session, msg.data['eval-id'], whenDone);
        });
    },

    clojureLoadFile: function(sessionServer, c, msg) { l2lAnswer(c, msg, false, {"error": "clojureLoadFile not yet implemented"}); },

    clojureLsSessions: function(sessionServer, c, msg) {
        l2lActionWithNREPLConnection(c, msg, function(con, whenDone) { con.lsSessions(whenDone); });
    },

    clojureStdin: function(sessionServer, c, msg) { l2lAnswer(c, msg, false, {"error": "clojureStdin not yet implemented"}); },
});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// HTTP
// -=-=-

module.exports = function(route, app) {

    app.post(route + "reset", function(req, res) {
        var ports = clientConnectionState.ports;
        Object.keys(ports).forEach(function(hostname) {
            ports[hostname].end();
            ports[hostname] = null;
        });
        delete require.cache[require.resolve("nrepl-client")];
        res.end("OK");
    });

    app.get(route, function(req, res) {
        res.end("ClojureServer is running!");
    });
}

module.exports.clientConnectionState = clientConnectionState;
