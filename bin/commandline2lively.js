/*
 * This script conforms to and can be used as SSH_ASKPASS / GIT_ASKPASS tool.
 * It will be called by ssh/git with a query string as process.argv[2]. This
 * script will then connect to a Lively session via websocket/lively-json
 * protocol and prompt the query. The prompt input will be written to stdout.
 */

if (!process.env.WORKSPACE_LK) process.env.WORKSPACE_LK = __dirname;

var path = require("path");
var util = require('util');
var ws = require(path.join(process.env.WORKSPACE_LK, 'core/servers/support/websockets'));
var debug = false;

function log(/*args*/) {
    if (!debug) return;
    var args = Array.prototype.slice.call(arguments);
    args[0] = '[cmdline2lv] ' + args[0];
    console.log.apply(console, arguments);
}

function createWebSocketConnection(thenDo) {
    var sessionTrackerURL = process.env.L2L_SESSIONTRACKER_URL
                        || 'http://lively-web.org:8080/nodejs/SessionTracker/connect',
        url = sessionTrackerURL.replace(/^http/, 'ws'),
        secure = url.match(/wss:/),
        options = {protocol: 'lively-json', sender: 'askpass', debugLevel: 10};

    if (!secure) {
        log("Creating websocket connection to %s", url);
        thenDo(null, new ws.WebSocketClient(url, options));
        return;
    }

    // SSL requires to pass in certificates to establish the L2L session
    var fs = require("fs"),
        async = require("async"),
        caFile = process.env.L2L_ASKPASS_SSL_CA_FILE,
        keyFile = process.env.L2L_ASKPASS_SSL_KEY_FILE,
        certFile = process.env.L2L_ASKPASS_SSL_CERT_FILE;

    async.map([caFile, keyFile, certFile], function(path, next) {
        if (path) fs.readFile(path, next); else next(null, undefined);
    }, function(err, results) {
        if (err) { thenDo(err); return; }
        options.tlsOptions = {rejectUnauthorized: false};
        if (caFile) options.tlsOptions.ca = fs.readFileSync(caFile);
        if (keyFile) options.tlsOptions.key = fs.readFileSync(keyFile);
        if (certFile) options.tlsOptions.cert = fs.readFileSync(certFile);
        log("Creating secure websocket connection to %s", url);
        thenDo(null, new ws.WebSocketClient(url, options));
    });
}

function queryLively(msg, thenDo) {
    // lively-2-lively session id to be used to ask for password:
    var clientSessionId = process.env.L2L_EDITOR_SESSIONID;
    if (clientSessionId && !msg.target) msg.target = clientSessionId;

    log("Sending ", msg);

    createWebSocketConnection(function(err, wsClient) {
        if (err || !wsClient) {
            thenDo("Lively askpass: unable to create Websocket connection " + err);
            wsClient && wsClient.close();
            return;
        }

        wsClient.on('connect', function() {
            log("Connected");
            wsClient.send(msg, function(answer) {
                debug && console.error("[cmdline2lv] got answer", answer);
                wsClient && wsClient.close();
                thenDo(null, answer);
            });
        });

        wsClient.on('error', function(err) {
            debug && console.error("[cmdline2lv] ", err);
            thenDo("Error in askpass websocket client:\n" + util.inspect(err));
        });

        wsClient.connect();
    });

}

module.exports = queryLively;
