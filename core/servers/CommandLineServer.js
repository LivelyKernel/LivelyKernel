var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    util = require('util'),
    i = util.inspect,
    dir = process.env.WORKSPACE_LK,
    debug = false,
    d = require("domain").create();

d.on('error', function(err) {
    console.error('CommandLinerServer error:', err);
});

/*
 * default env settings for spawning new commands
 */
var env = {
    __proto__: process.env,
    SHELL: '/bin/bash',
    PAGER:'ul | cat -s',
    MANPAGER:'ul | cat -s',
    TERM:"xterm"
}

/*
 * this is the state that holds on to running shell commands
 * [{process: null, stdout: '', stderr: '', lastExitCode: null}]
 */
var shellCommands = global.shellCommands = [];
function findShellCommand(pid) {
    for (var i = 0; i < shellCommands.length; i++) {
        var proc = shellCommands[i] && shellCommands[i].process;
        if (proc && proc.pid === pid) return shellCommands[i];
    }
    return null;
}

/*
 * determine the kill command at startup. if pkill is available then use that
 * to do a full process tree kill
 */
function defaultKill(pid, cmd, signal, thenDo) {
    // signal = "SIGKILL"|"SIGQUIT"|"SIGINT"|...
    debug && console.log('signal pid %s with', pid, signal);
    signal = signal.toUpperCase().replace(/^SIG/, '');
    exec('kill -s ' + signal + " " + pid, function(code, out, err) {
        debug && console.log('signl result: ', out, err);
        thenDo(code, out, err);
    });
}

function pkillKill(pid, cmd, signal, thenDo) {
    // signal = "SIGKILL"|"SIGQUIT"|"SIGINT"|...
    debug && console.log('signal pid %s with', pid, signal);
    signal = signal.toUpperCase().replace(/^SIG/, '');
    exec(util.format('pkill -%s -P %s; kill -s %s %s', signal, pid, signal, pid), function(code, out, err) {
        debug && console.log('signal result: ', out, err);
        thenDo(code, out, err);
    });
}

var doKill = defaultKill;
(function determineKillCommand() {
    exec('which pkill', function(code) { if (!code) doKill = pkillKill; });
})();

/*
 * the server both supports starting shell commands via child_process spawn and
 * exec. Exec has a fixed buffer size but does command/argument parsing. Spawn is
 * more suited for long running processes but requires the executable and
 * arguments to be handed in separately. We mostly use it via bash -c "..."
 */
function startSpawn(cmdInstructions) {
    var commandEnv = cmdInstructions.env || {};
    commandEnv.__proto__ = env;
    var options = {env: commandEnv, cwd: cmdInstructions.cwd || dir, stdio: 'pipe'},
        command = cmdInstructions.command, args = [],
        stdin = cmdInstructions.stdin;
    if (typeof command === 'string') {
        args = command.split(' ');
    } else if (util.isArray(command)) {
        args = command;
    }

    // hmm (variable) expansion seems not to work with spawn
    // as a quick hack do it manually here
    args = args.map(function(arg) {
        return arg.replace(/\$[a-zA-Z0-9_]+/g, function(match) {
            return process.env[match.slice(1,match.length)] || match; }); });
    command = args.shift();

    if (debug) console.log('Running command: %s', [command].concat(args));
    var proc = spawn(command, args, options);
    d.add(proc);
    if (stdin) {
        debug && console.log('setting stdin to: %s', stdin);
        proc.stdin.end(stdin);
    }
    return proc;
}

function startExec(cmdInstructions) {
    var commandEnv = cmdInstructions.env || {};
    commandEnv.__proto__ = env;
    var cmd = cmdInstructions.command,
        callback = cmdInstructions.callback,
        options = {env: commandEnv, cwd: cmdInstructions.cwd || dir, stdio: 'pipe'};
    if (debug) console.log('Running command: %s', cmd);
    return exec(cmd, options, function(code, out, err) {
        callback && callback(code, out, err);
    });
}

/*
 * interface for starting commands, will call spawn or exec and install listeners
 */
function runShellCommand(cmdInstructions) {
    var callback = cmdInstructions.callback,
        shellCommand = {
            process: cmdInstructions.isExec ? startExec(cmdInstructions) : startSpawn(cmdInstructions),
            stdout: '', stderr: '',
            lastExitCode: null};
    shellCommands.push(shellCommand);
    util._extend(shellCommand, require('events').EventEmitter.prototype);

    shellCommand.process.stdout.on('data', function (data) {
        debug && console.log('STDOUT: ' + data);
        shellCommand.stdout += data;
        shellCommand.emit('output', {stdout: String(data)});
    });

    shellCommand.process.stderr.on('data', function (data) {
        debug && console.log('STDERR: ' + data);
        shellCommand.stderr += data;
        shellCommand.emit('output', {stderr: String(data)});
    });

    shellCommand.process.on('close', function(code) {
        debug && console.log('shell command exited with code ' + code);
        shellCommand.process = null;
        shellCommand.lastExitCode = code;
        shellCommand.emit('close', code);
        callback && callback(code, shellCommand.stdout, shellCommand.stdout);
    });

    shellCommand.process.on('error', function (err) {
        debug && console.log('shell command errored ' + err);
        shellCommand.process = null;
        shellCommand.stderr += err.stack;
        shellCommand.emit('output', {stderr: String(err.stack)});
        shellCommand.lastExitCode = 1;
    });

    return shellCommand;
}

function formattedResponseText(type, data) {
    var s = String(data);
    return '<SHELLCOMMAND$' + type.toUpperCase() + s.length + '>' + s;
}

/*
 * Lively2Lively services
 */
var shellServices = {
    runShellCommand: function(sessionServer, connection, msg) {
        // spawn/exec
        function answer(hasMore, data) {
            connection.send({
                expectMoreResponses: hasMore,
                action: msg.action + 'Result',
                inResponseTo: msg.messageId, data: data});
        }
        var cmdInstructions = msg.data;
        var cmd = runShellCommand(cmdInstructions);
        var pid = cmd.process.pid
        answer(true, {pid: pid});
        cmd.on('output', function(out) { answer(true, out); });
        cmd.on('close', function(exit) {
            debug && console.log('Shell command %s exited %s', pid, exit);
            answer(false, exit); });
    },
    stopShellCommand: function(sessionServer, connection, msg) {
        // kill
        function answer(data) {
            connection.send({action: msg.action + 'Result',
                inResponseTo: msg.messageId, data: data});
        }
        var pid = msg.data.pid, signal = msg.data.signal || "SIGKILL";
        if (!pid) { answer({commandIsRunning: false, error: 'no pid'}); return; }
        var cmd = findShellCommand(pid);
        if (!cmd) { answer({commandIsRunning: false, error: 'command not found'}); return; }
        debug && console.log('signal pid %s with', pid, signal);
        signal = signal.toUpperCase().replace(/^SIG/, '');
        doKill(pid, cmd, signal, function(code, out, err) {
            answer({
                commandIsRunning: !!code,
                message: 'signal send',
                out: String(out), err: String(err)});
        });
    },
    writeToShellCommand: function(sessionServer, connection, msg) {
        // sends input (stdin) to running processes
        function answer(data) {
            connection.send({action: msg.action + 'Result',
                inResponseTo: msg.messageId, data: data});
        }
        var pid = msg.data.pid, input = msg.data.input;
        if (!pid) { answer({error: 'no pid'}); return; }
        if (!input) { answer({error: 'no input'}); return; }
        var cmd = findShellCommand(pid);
        if (!cmd) { answer({error: 'command not found'}); return; }
        if (!cmd.process) { answer({error: 'command not running'}); return; }
        debug && console.log('writing to shell command %s: %s', pid, input);
        cmd.process.stdin.write(input);
        answer({message: 'OK'});
    }
}

var services = require("./LivelyServices").services;
util._extend(services, shellServices);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = d.bind(function(route, app) {

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
            cmd.process && cmd.process.kill();
        });
        res.end(JSON.stringify({
            message: !pids || !pids.length ?
                'no process were running' :
                'processes with pids ' + pids + ' killed'}));
    });

    app.post(route, function(req, res) {
        var command = req.body && req.body.command,
            stdin = req.body && req.body.stdin,
            env = req.body && req.body.env,
            dir = req.body && req.body.cwd,
            isExec = req.body && req.body.isExec;
        if (!command) { res.status(400).end(); return; }
        var cmd, cmdInstructions = {
            command: command,
            cwd: dir,
            env: env,
            isExec: isExec,
            stdin: stdin
        };
        try {
            cmd = runShellCommand(cmdInstructions);
        } catch(e) {
            var msg = 'Error invoking shell: ' + e + '\n' + e.stack;
            console.error(msg);
            res.status(500).json({error: msg}).end(); return;
        }
        if (!cmd || !cmd.process) {
            res.status(400).json({error: 'Could not run ' + command}).end();
            return;
        }

        // make it a streaming response:
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

});

module.exports.shellCommands = shellCommands;
module.exports.runShellCommand = runShellCommand;
