var util = require('util'),
    async = require('async'),
    nreplClient = require('/Users/robert/Dropbox/Projects/js/node-nrepl-client'),
    d = require("domain").create();

d.on('error', function(err) {
    console.error('ClojureServer error:', err);
});

var con = global.ClojureServerNreplConnection;
if (con) {
    con.end()
    global.ClojureServerNreplConnection = null;
}

var nreplConnectOptions = {port: 7888};
var ensureConnection = d.bind(function(thenDo) {
    var con = global.ClojureServerNreplConnection;
    if (con) { thenDo(null, con); return; }
    con = nreplClient.connect(nreplConnectOptions, function() {
        thenDo(null, con); });
    con.on('error', thenDo);
    global.ClojureServerNreplConnection = con;
});

var clojureServices = {
    clojureNreplSend: function(sessionServer, connection, msg) {
        function answer(data) {
            connection.send({action: msg.action + 'Result',
                inResponseTo: msg.messageId, data: data});
        }
        async.waterfall([
            ensureConnection,
            function(con, next) {
                console.log("Clojure: nrepl send ", msg.data);
                con.send(msg.data, next);
            },
            function(result, next) {
                console.log("Clojure: got %s", result);
                answer({success: true, result: result});
            }
        ], function(err) {
            err && answer({success: false, result: '', error: err});
        });
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// register routes
module.exports = function(route, app, subserver) {
    app.get(route, function(req, res) {
        res.end("ClojureServer is running!");
    });
}

var services = require("./LivelyServices").services;
util._extend(services, clojureServices);
