/*
 * This script conforms to and can be used as SSH_ASKPASS / GIT_ASKPASS tool.
 * It will be called by ssh/git with a query string as process.argv[2]. This
 * script will then connect to a Lively session via websocket/lively-json
 * protocol and prompt the query. The prompt input will be written to stdout.
 */

// control stdout/err output, silence the node process:
var stdoutWrite = process.stdout.write;
var stderrWrite = process.stderr.write;
process.stderr.write = function() {};
process.stdout.write = function() {};

if (!process.env.WORKSPACE_LK) process.env.WORKSPACE_LK = __dirname;

var path = require("path");
var util = require('util');

// lively-2-lively session id to be used to ask for password:
var clientSessionId = process.env.ASKPASS_SESSIONID;

if (!clientSessionId) {
    stderrWrite.call(process.stderr, "No lively-2-lively session id given to askpass program! Askpass failure.");
    process.exit(1);
}

var sessionTrackerURL = process.env.ASKPASS_SESSIONTRACKER_URL || 'http://lively-web.org:8080/nodejs/SessionTracker/connect',
    ws = require(path.join(process.env.WORKSPACE_LK, 'core/servers/support/websockets')),
    wsClient = new ws.WebSocketClient(sessionTrackerURL, {protocol: 'lively-json', sender: 'askpass', debugLevel: 10});

function sendQuery(query, thenDo) {
    wsClient.send({
        action: 'askFor',
        data: {query: query},
        target: clientSessionId
    }, processAnswer);
}

function processAnswer(answerMsg) {
    wsClient && wsClient.close();
    stdoutWrite.call(process.stdout, answerMsg.data.answer ?
        answerMsg.data.answer + '\n' : '');
}

wsClient.on('connect', function() {
    sendQuery(process.argv[2] || 'No query from ASKPASS invocation');
});

wsClient.on('error', function(err) {
    stderrWrite.call(process.stderr, "Error in askpass websocket client:\n" + util.inspect(err));
});

wsClient.connect();
