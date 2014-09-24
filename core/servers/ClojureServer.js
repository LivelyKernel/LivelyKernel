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

function doEval(code, inform, thenDo) {
    debug && console.log("Clojure eval: ", code);
    async.waterfall([
        ensureNreplConnection,
        function(con, next) {
            con.messageStream.on("error", function(err) { con.end(); next(err, null); })
            con.messageStream.once("messageSequence", function(messages) { next(null, messages); })
            var id = con.eval(code, function(err, result) {/*currently ignored*/});
            inform && inform({"eval-id": id});
        }
    ], thenDo);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function answer(conn, msg, more, data) {
    conn.send({expectMoreResponses: more,
        action: msg.action + 'Result',
        inResponseTo: msg.messageId, data: data});
}

require("./LivelyServices").services.clojureEval = function (sessionServer, c, msg) {
    doEval(msg.data.code,
        function(note) { answer(c, msg, true, note);  },
        function(err, result) { answer(c, msg, false, {result: err ? String(err) : result}); });
}

require("./LivelyServices").services.clojureEvalInterrupt = function (sessionServer, c, msg) {
    debug && console.log("Clojure interrupt: ", msg.data['eval-id']);
    async.waterfall([
        ensureNreplConnection,
        function(con, next) { con.interrupt(msg.data['eval-id'], next); }
    ], function(err, result) {
         answer(c, msg, false, {result: err ? String(err) : result}); 
    });
}


module.exports = function(route, app) {

    app.post(route + "reset", function(req, res) {
        var con = module.exports.clientConnectionState.connection
        con && con.end();
        module.exports.clientConnectionState.connection = null;
        delete require.cache[require.resolve("nrepl-client")];
        res.end("OK");
    });

    app.get(route, function(req, res) {
        res.end("ClojureServer is running!");
    });
}

module.exports.clientConnectionState = clientConnectionState;
