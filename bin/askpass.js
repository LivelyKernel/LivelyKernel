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

if (!process.env.WORKSPACE_LK) process.env.WORKSPACE_LK = require("path").join(__dirname, "..");

require("./commandline2lively")({
    action: 'askFor',
    data: {
        query: process.argv[2] || 'No query from ASKPASS invocation',
        requiredUser: process.env.L2L_ASKPASS_USER
    },
}, function(err, answer) {
    if (err) {
        stderrWrite.call(process.stderr, String(err));
        process.exit(1);
    } else {
        stdoutWrite.call(
            process.stdout, 
            answer && answer.data.answer ? answer.data.answer + '\n' : '');
        process.exit(0)
    }
});
