/*global Buffer, module, require, setTimeout*/

var debug = true;
var exec  = require("child_process").exec;
var async = require("async");
var path  = require("path");
var fs  = require("fs");

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/*
con = require("./ClojureServer").clientConnectionState.connection

con.interrupt("36B0531A-DDA0-4498-85A8-A7E414BD2B90", function() { console.log(arguments); })
con.interrupt(undefined, function() { console.log(arguments); })
con.address()
con.end()

delete require.cache[require.resolve("nrepl-client")]
require("./ClojureServer").clientConnectionState.connection = null


con.eval("(+ 2 3)", function(err, result) { console.log(err || result); })
con.eval("", function(err, result) { console.log(err || result); })
Global.nreplConnection = con;

b=require("/home/lively/clojure-om/node-nrepl-client/node_modules/bencode")
b.
*/

var clientConnectionState = module.exports.clientConnectionState || {
    connection: null
}

function ensureNreplModule(thenDo) {
    try {
        var nreplClient = require("nrepl-client");
        process.nextTick(function() { thenDo(null, nreplClient); });
    } catch (e) {
        console.log("Installing nodejs module nrepl-client");
        var path = require('path'),
            fs = require('fs'),
            node_modules = path.join(process.env.WORKSPACE_LK, 'node_modules');
        exec("git clone https://github.com/rksm/node-nrepl-client nrepl-client; cd nrepl-client; npm install;",
            {cwd: path.join(process.env.WORKSPACE_LK, 'node_modules')},
            function(code, out, err) {
                try { nreplClient = require("nrepl-client"); } catch (e) { thenDo(e, null); return; }
                console.log("nrepl-client installed");
                thenDo(null, nreplClient);
            });
    }
}


function findNreplServerPort(thenDo) {
    var cmdString = "lsof -i tcp | "
                  + "grep LISTEN | "
                  + "grep TCP | grep :7888 | "
                  + "sed -E 's/[^:]+:([0-9]+).*/\\1/' | "
                  + "head -n 1";
    // var cmdString = "lsof -i tcp | "
    //               + "grep LISTEN | "
    //               + "grep TCP | grep -v :9080 | grep -v :9081 | "
    //               + "sed -E 's/[^:]+:([0-9]+).*/\\1/' | "
    //               + "head -n 1";
    exec(cmdString, function(code, out, err) {
        var port = parseInt(out);
        thenDo(isNaN(port) ? new Error("no nREPL server listening") : null, port);
    });
}

function ensureNreplConnection(thenDo) {
    if (clientConnectionState.connection) {
        thenDo(null, clientConnectionState.connection);
        return;
    }
    async.waterfall([
        findNreplServerPort,
        function(port, next) {
            console.log("Found nREPL server on port %s", port);
            ensureNreplModule(function(err, nreplClient) {
                next(err, port, nreplClient); });
        },
        function(port, nreplClient, next) {
            clientConnectionState.connection = nreplClient.connect({
                host: "127.0.0.1",
                port: port,
                verbose: true});
            clientConnectionState.connection.once("connect", function() {
                next(null, clientConnectionState.connection); });
            clientConnectionState.connection.once("close", function() {
                clientConnectionState.connection = null; });
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
