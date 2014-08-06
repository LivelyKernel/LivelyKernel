/*global Buffer, module, require, setTimeout*/

var spawn = require("child_process").spawn
var debug = true;

if (module.exports.pythonState) {
    stopProcess(module.exports.pythonState);
}

var pythonState = {/*
    proc: a ChildProcess object
    stdout: a Buffer,
    stderr: a Buffer,
    status: "not started"|"closed"|"started"|"errored",
    error: null or Error
*/}

function isRunning(pythonState) {
    return !!pythonState && !!pythonState.proc;
}

function ensurePythonProcess(state, thenDo) {
    if (isRunning(state)) { thenDo(null, state); return; }

    debug && console.log('Initializing python process');

    module.exports.pythonState = pythonState = {
        proc: spawn('python', ['-i', '-']),
        stdout: new Buffer(""),
        stderr: new Buffer(""),
        status: "not started",
        error: null
    }

    pythonState.proc.stdout.on("data", function(d) { pythonState.stdout = Buffer.concat([pythonState.stdout, d]); });
    pythonState.proc.stderr.on("data", function(d) { pythonState.stderr = Buffer.concat([pythonState.stderr, d]); });

    pythonState.proc.on("error", function(err) {
        pythonState.error = err;
        pythonState.status = 'errored';
    });

    pythonState.proc.on("close", function() {
        try {
            pythonState.proc.removeAllListeners();
            pythonState.proc.stdout.removeAllListeners();
            pythonState.proc.stderr.removeAllListeners();
        } catch (e) { console.error("error in PythSubserver / proc on close: %s", e); }
        pythonState.proc = null;
        pythonState.status = 'closed';
    });

    // FIXME we currently poll stderr/out for known string... that's not good
    waitForOutput(pythonState, '>>>', 'stderr', 10, function(err) {
        debug && console.log(err ? err : 'Python process started');
        thenDo(err, pythonState);
    });
}

function waitForOutput(procState, expectedOutput, stdoutOrError, attempts, thenDo) {
    attempts = attempts || 10;
    stdoutOrError = stdoutOrError || 'stdout';
    var bufferPos = procState[stdoutOrError].length;
    wait();

    function wait() {
        attempts--;
        if (attempts <= 0) {
            thenDo(new Error('waitForOutput timed out'));
        } else if (outputSeen()) {
            thenDo(null, procState);
        } else setTimeout(wait, 120);
    }

    function outputSeen() {
        debug && console.log('waiting.... %s', procState[stdoutOrError].slice(bufferPos));
        return String(procState[stdoutOrError].slice(bufferPos)).indexOf(expectedOutput) > -1;
    }

}

function stopProcess(procState, thenDo) {
    if (!isRunning(procState)) { thenDo(null); return; }
    debug && console.log('Python process closing');
    pythonState.proc.once("close", function() {
        debug && console.log('Python process closed');
        thenDo();
    });
    pythonState.proc.kill("SIGTERM");
}

function sendToProcess(procState, pythonCode, thenDo) {
    if (pythonCode.slice(-2) !== '\n\n') pythonCode += '\n\n';
    ensurePythonProcess(procState, function(err, procState) {
        if (!err) procState.proc.stdin.write(pythonCode);
        debug && console.log('Python eval write');
        thenDo(err, procState);
    });
}

function pythonEval(procState, pythonCode, thenDo) {
    debug && console.log('Python eval');
    sendToProcess(procState, pythonCode, function(err, procState) {
        if (err) { thenDo(err, null); return; }
        var stdoutPos = procState.stdout.length;
        var stderrPos = procState.stderr.length;
        debug && console.log('Python eval wait');
        waitForOutput(procState, '>>>', 'stderr', 10, function(err) {
            debug && console.log('Python eval done');
            if (err) thenDo(err, null);
            else thenDo(null, procState.stdout.slice(stdoutPos).toString(), procState.stderr.slice(stderrPos).toString());
        });
    });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports = function(route, app) {
    app.get(route + "output", function(req, res) {
        module.exports.ensurePythonProcess(function(err, procState) {
            if (err) { res.status(500).json({error: String(err)}); return; }
            res.json({
                stdout: String(procState.stdout),
                stderr: String(procState.stderr)
            });
        });
    });

    app.post(route + 'stop', function(req, res) {
        module.exports.stopProcess(function(err) {
            if (err) { res.status(500).json({error: String(err)}); return; }
            res.json({status: 'ok'});
        });
    });

    app.post(route + 'eval', function(req, res) {
        var expr = req.body && req.body.expr;
        if (!expr) {
            var msg = {error: 'Cannot deal with request', message: 'No expression'};
            res.status(400).json(msg).end(); return;
        }
        module.exports.pythonEval(expr, function(err, stdout, stderr) {
            if (err) res.status(500);
            res.json({
                error: err ? String(err) : null,
                status: err ? 'errored' : 'ok',
                stdout: stdout, stderr: stderr
            });
        });
    });

    app.get(route, function(req, res) {
        res.json({
            stdout: pythonState.stdout ? pythonState.stdout.toString().slice(-1000): '',
            stderr: pythonState.stderr ? pythonState.stderr.toString().slice(-1000): '',
            status: pythonState.status + ' (running: ' + isRunning(pythonState) + ')',
            error: pythonState.error
        });
    });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

module.exports.pythonState = pythonState;

module.exports.isRunning = function() { return isRunning(pythonState); };
module.exports.ensurePythonProcess = function(thenDo) { return ensurePythonProcess(pythonState, thenDo); };
module.exports.stopProcess = function(thenDo) { return stopProcess(pythonState, thenDo); };
module.exports.pythonEval = function(pythonCode, thenDo) {
    return ensurePythonProcess(pythonState, function(err, state) {
        if (err) thenDo(err);
        else pythonEval(state, pythonCode, thenDo);
    }); 
};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/*
PythonSubserver = require("./PythonSubserver");
PythonSubserver.isRunning()
PythonSubserver.stopProcess(function(err, state) { console.log("stopped"); })
PythonSubserver.pythonEval("1 + 2", function(err, stdout, stderr) { console.log(stdout + '\n' + stderr); })
*/
