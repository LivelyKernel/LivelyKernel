/*global Buffer, module, require, setTimeout*/

/*
con = require("./ClojureServer").clientConnectionState.connection
con.address()
con.end()

require("./ClojureServer").clientConnectionState.connection = null


con.eval("(+ 2 3)", function(err, result) { console.log(err || result); })
con.eval("", function(err, result) { console.log(err || result); })
Global.nreplConnection = con;

b=require("/home/lively/clojure-om/node-nrepl-client/node_modules/bencode")
b.
*/

var debug = true;
var exec = require("child_process").exec;
var nreplClient = require("/home/lively/clojure-om/node-nrepl-client/src/nrepl-client.js");
// delete require.cache["/home/lively/clojure-om/node-nrepl-client/src/nrepl-client.js"];

var clientConnectionState = module.exports.clientConnectionState || {
    connection: null
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

function ensureNREPLConnection(thenDo) {
    if (clientConnectionState.connection) {
        thenDo(null, clientConnectionState.connection);
        return;
    }
    findNreplServerPort(function(err, port) {
        console.log("Found nREPL server on port %s", port);
        if (err) { thenDo(err, null); return; }
        clientConnectionState.connection = nreplClient.connect({
            host: "127.0.0.1",
            port: port,
            verbose: true});
        clientConnectionState.connection.once("connect", function() {
            thenDo(null, clientConnectionState.connection);
        });
        clientConnectionState.connection.once("close", function() {
            clientConnectionState.connection = null;
        });
    });
}

function doEval(code, thenDo) {
    debug && console.log("Clojure eval: ", code);
    ensureNREPLConnection(function(err, con) {
        if (err) { thenDo(err, null); return; }
        con.messageStream.on("error", function(err) { con.end(); thenDo(err, null); })
        con.messageStream.once("messageSequence", function(messages) { thenDo(null, messages); })
        con.eval(code, function(err, result) {/*currently ignore*/});
    });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

require("./LivelyServices").services.clojureEval = function (sessionServer, connection, msg) {
    function answer(data) {
        connection.send({action: msg.action + 'Result',
            inResponseTo: msg.messageId, data: data});
    }
    doEval(msg.data.code, function(err, result) {
        answer({result: err ? String(err) : result});
    });
}


module.exports = function(route, app) {

    app.post(route + "reset", function(req, res) {
        var con = module.exports.clientConnectionState.connection
        con && con.end();
        module.exports.clientConnectionState.connection = null;
        delete require.cache["/home/lively/clojure-om/node-nrepl-client/src/nrepl-client.js"];
        res.end("OK");
    });

    app.get(route, function(req, res) {
        res.end("ClojureServer is running!");
    });
}

module.exports.clientConnectionState = clientConnectionState;
