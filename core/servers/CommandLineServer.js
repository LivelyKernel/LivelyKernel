spawn = require('child_process').spawn;
exec = require('child_process').exec;
util = require('util');
i = util.inspect;
dir = process.env.WORKSPACE_LK;
debug = true;

shellCommand = {process: null, stdout: '', stderr: '', lastExitCode: null}

runShellCommand = function(cmdInstructions) {
    var args = cmdInstructions.commandAndArgs,
        stdin = cmdInstructions.stdin;

// hmm (variable) expansion seems not to work with spawn
    // as a quick hack do it manually here
    args = args.map(function(arg) {
        return arg.replace(/\$[a-zA-Z_]+/g, function(match) {
            return process.env[match.slice(1,match.length)] || ''; }); });

    var cmd = args.shift();
    if (!cmd) return;

    var options = {cwd: cmdInstructions.cwd || dir, stdio: 'pipe'};
    if (debug) console.log('Running command: %s', [cmd].concat(args));
    shellCommand.process = spawn(cmd, args, options);
    if (stdin) {
        console.log('setting stdin to: %s', stdin);
        shellCommand.process.stdin.end(stdin);
    }
    shellCommand.process.stdout.on('data', function (data) {
        debug && console.log('STDOUT: ' + data);
        shellCommand.stdout += data;
    });

    shellCommand.process.stderr.on('data', function (data) {
        debug && console.log('STDERR: ' + data);
        shellCommand.stderr += data;
    });

    shellCommand.process.on('close', function (code) {
        debug && console.log('shell command exited with code ' + code);
        shellCommand.process = null;
        shellCommand.lastExitCode = code;
    });

}

runShellCommandExec = function(cmdInstructions) {
    var cmd = cmdInstructions.command,
        callback = cmdInstructions.callback;
    if (!cmd) return;

    var options = {cwd: cmdInstructions.cwd || dir, stdio: 'pipe'};
    if (debug) console.log('Running command: %s', cmd);
    shellCommand.process = exec(cmd, options, function(code, out, err) {
        shellCommand.process = null;
        shellCommand.lastExitCode = code;
        shellCommand.stdout = out;
        shellCommand.stderr = err;
        callback && callback(code, out, err);
    });
}

function formattedResponseText(type, data) {
    var s = String(data);
    return '<SHELLCOMMAND$' + type.toUpperCase() + s.length + '>' + s;
}

module.exports = function(route, app) {

    app.get(route, function(req, res) {
        res.json({cwd: dir});
    });

    app.delete(route, function(req, res) {
        if (!shellCommand.process) { res.end(JSON.stringify({message: "process not running"})); return }
        var pid = shellCommand.process.pid;
        console.log('Killing CommandLineServer command process with pid ' + pid);
        shellCommand.process.kill('SIGKILL');
        res.end(JSON.stringify({message: 'process with pid ' + pid + ' killed'}));
    });

    app.post(route + 'exec', function(req, res) {
        var command = req.body && req.body.command,
            dir = req.body && req.body.cwd;
        if (!command) { res.status(400).end(); return; }
        if (shellCommand.process) { res.status(400).end((JSON.stringify({error: 'Shell command process still running!'}))); return; }
        try {
            runShellCommandExec({command: command, cwd: dir, callback: function(code, out, err) {
                res.end(JSON.stringify({code: code, out: out, err: err}));
            }});
        } catch(e) {
             res.status(500).end(JSON.stringify({error: 'Error invoking shell: ' + e + '\n' + e.stack})); return;
        }
        if (!shellCommand.process) { res.status(400).end(JSON.stringify({error: 'Could not run ' + commandAndArgs})); return; }
    });

    app.post(route, function(req, res) {
        var command = req.body && req.body.command,
            stdin = req.body && req.body.stdin,
            dir = req.body && req.body.cwd;
        if (!command) { res.status(400).end(); return; }
        if (shellCommand.process) { res.status(400).end(JSON.stringify({error: 'Shell command process still running!'})); return; }
        var commandAndArgs = [];
        if (typeof command === 'string') {
            commandAndArgs = command.split(' ');
        } else if (util.isArray(command)) {
            commandAndArgs = command;
        }
        try {
            runShellCommand({commandAndArgs: commandAndArgs, stdin: stdin, cwd: dir});
        } catch(e) {
             res.status(500).end(JSON.stringify({error: 'Error invoking shell: ' + e + '\n' + e.stack})); return;
        }
        if (!shellCommand.process) { res.status(400).end(JSON.stringify({error: 'Could not run ' + commandAndArgs})); return; }

        // make ir a streaming response:
        res.removeHeader('Content-Length');
        res.set({
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked'
        });

        shellCommand.process.stdout.on('data', function (data) {
            res.write(formattedResponseText('STDOUT', data));
        });

        shellCommand.process.stderr.on('data', function (data) {
            res.write(formattedResponseText('STDERR', data));
        });

        shellCommand.process.on('close', function(code) {
            res.write(formattedResponseText('CODE', shellCommand.lastExitCode));
            res.end();
        });
    });

}
