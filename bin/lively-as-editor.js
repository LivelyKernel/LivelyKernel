/*
 * For usage as EDITOR env variable.
 */

if (!process.env.WORKSPACE_LK) process.env.WORKSPACE_LK = __dirname;

var path = require("path");
var util = require('util');

// lively-2-lively session id to be used to ask for password:
var clientSessionId = process.env.L2L_EDITOR_SESSIONID;

console.log(process.env.WORKSPACE_LK);

var sessionTrackerURL = process.env.L2L_SESSIONTRACKER_URL || 'http://lively-web.org:8080/nodejs/SessionTracker/connect',
    ws = require(path.join(process.env.WORKSPACE_LK, 'core/servers/support/websockets')),
    wsClient = new ws.WebSocketClient(sessionTrackerURL, {protocol: 'lively-json', sender: 'askpass', debugLevel: 10});

function startEditor(args, thenDo) {
    wsClient.send({
        action: 'openEditor',
        data: {args: args},
        target: clientSessionId
    }, processAnswer);
}

function processAnswer(answerMsg) {
    console.log("Lively EDITOR session done, result: %s", answerMsg.data.status);
    wsClient.close();
}

wsClient.on('connect', function() {
    startEditor(process.argv.slice(2));
});

wsClient.on('error', function(err) {
    console.error("Error in L2L_EDITOR websocket client:\n" + util.inspect(err));
    process.exit(1);
});

wsClient.on('close', function() { process.exit(0); });

wsClient.connect();
