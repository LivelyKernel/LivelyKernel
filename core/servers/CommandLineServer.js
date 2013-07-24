var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    util = require('util'),
    i = util.inspect,
    dir = process.env.WORKSPACE_LK,
    debug = true;

// [{process: null, stdout: '', stderr: '', lastExitCode: null}]
var shellCommands = global.shellCommands = [];

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
    var shellCommand = {process: null, stdout: '', stderr: '', lastExitCode: null};
    shellCommands.push(shellCommand);
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

    shellCommand.process.on('error', function (err) {
        debug && console.log('shell command errored ' + err);
        shellCommand.process = null;
        shellCommand.stderr += err.stack;
        shellCommand.lastExitCode = 1;
    });

    return shellCommand;
}

runShellCommandExec = function(cmdInstructions) {
    var cmd = cmdInstructions.command,
        callback = cmdInstructions.callback;
    if (!cmd) return;

    var options = {cwd: cmdInstructions.cwd || dir, stdio: 'pipe'};
    if (debug) console.log('Running command: %s', cmd);
    var shellCommand = {process: null, stdout: '', stderr: '', lastExitCode: null};
    shellCommands.push(shellCommand);
    shellCommand.process = exec(cmd, options, function(code, out, err) {
        shellCommand.process = null;
        shellCommand.lastExitCode = code;
        shellCommand.stdout = out;
        shellCommand.stderr = err;
        callback && callback(code, out, err);
    });

    return shellCommand;
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
        var pid = req.body && req.body.pid,
            commandsToKill = pid ? shellCommands.filter(function(cmd) { return cmd.process && cmd.process.pid === pid; }) : shellCommands,
            pids = [];
        commandsToKill.forEach(function(cmd) {
            if (!cmd.process) return;
            var pid = cmd.process.pid;
            pids.push(pid);
            console.log('Killing CommandLineServer command process with pid ' + pid);
            cmd.process && cmd.process.kill('SIGKILL');
        });
        res.end(JSON.stringify({message: 'processes with pids ' + pids + ' killed'}));
    });

    app.post(route + 'exec', function(req, res) {
        var command = req.body && req.body.command,
            dir = req.body && req.body.cwd;
        if (!command) { res.status(400).end(); return; }
        try {
            runShellCommandExec({command: command, cwd: dir, callback: function(code, out, err) {
                res.end(JSON.stringify({code: code, out: out, err: err}));
            }});
        } catch(e) {
            var msg = 'Error invoking shell: ' + e + '\n' + e.stack;
            console.error(msg);
            res.status(500).json({error: msg}).end(); return;
        }
    });

    app.post(route, function(req, res) {
        var command = req.body && req.body.command,
            stdin = req.body && req.body.stdin,
            dir = req.body && req.body.cwd;
        if (!command) { res.status(400).end(); return; }
        var commandAndArgs = [];
        if (typeof command === 'string') {
            commandAndArgs = command.split(' ');
        } else if (util.isArray(command)) {
            commandAndArgs = command;
        }
        var cmd;
        try {
            cmd = runShellCommand({commandAndArgs: commandAndArgs, stdin: stdin, cwd: dir});
        } catch(e) {
            var msg = 'Error invoking shell: ' + e + '\n' + e.stack;
            console.error(msg);
            res.status(500).json({error: msg}).end(); return;
        }
        if (!cmd || !cmd.process) { res.status(400).json({error: 'Could not run ' + commandAndArgs}).end(); return; }

        // make ir a streaming response:
        res.removeHeader('Content-Length');
        res.set({
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked'
        });

        cmd.process.stdout.on('data', function (data) {
            res.write(formattedResponseText('STDOUT', data));
        });

        cmd.process.stderr.on('data', function (data) {
            res.write(formattedResponseText('STDERR', data));
        });

        cmd.process.on('close', function(code) {
            res.write(formattedResponseText('CODE', cmd.lastExitCode));
            res.end();
        });
    });

}

module.exports.shellCommands = shellCommands;
module.exports.runShellCommand = runShellCommand;
module.exports.runShellCommandExec = runShellCommandExec;
