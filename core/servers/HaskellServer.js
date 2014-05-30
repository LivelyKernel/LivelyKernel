var spawn  = require("child_process").spawn;
var exec   = require("child_process").exec;
var util   = require("util");
var crypto = require("crypto");
var path   = require("path");
var fs     = require("fs");
var async  = require("async");

var debug = true;

function log(/*args*/) {
    process.stdout.write('HaskellServer: ');
    console.log.apply(console, arguments);
}

function softAssert(bool, message) {
    if (bool) return;
    console.trace('Haskell assertion failure' + (message ? ': ' + message : ''));
}

function censorJSON(jso) {
    return JSON.stringify(jso, function(key, val) {
        return (key[0] === '_') ? undefined : val; });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-
// haskell process management
// -=-=-=-=-=-=-=-=-=-=-=-=-=-

var haskellState = global.haskellState || (global.haskellState = {processes: []});

global.printHaskellServerState = function printHaskellServerState(thenDo) {
    
    function printEvalState(evalState, i) {
        return util.format(
            "%s: id: %s, expr: %s, enqueueTime: %s, startTime: %s, endTime: %s, hasCallback: %s, result %s",
            i,
            evalState.id,
            evalState._options.expr.replace(/\n/g, '').slice(0,40),
            new Date(evalState.enqueueTime),
            new Date(evalState.startTime),
            new Date(evalState.endTime),
            !!evalState._callback,
            JSON.stringify(evalState.result));
    }

    function printProcState(procState) {
        return [
            util.format(
                'process %s (prompt: %s, cwd: %s, running: %s)',
                procState.id,
                procState.prompt,
                procState.baseDirectory,
                procState.proc && !!procState.proc._handle)
        ].concat(procState.evalQueue.map(printEvalState)).join('\n  ');
    }

    var output = haskellState.processes.length ?
        haskellState.processes.map(printProcState).join('\n\n')
        : 'no haskell processes running';
    log(output);
    thenDo && thenDo(null, output);
}

global.resetHaskellState = function resetHaskellState(thenDo) {
    debug && log("Resetting Haskell processes and states...");
    if (haskellState.processes) {
        haskellState.processes.forEach(cancelAllQueuedEvals);
        haskellState.processes.forEach(stopProcess);
        haskellState.processes = [];
    }
    thenDo && thenDo(null);
}

// process.kill(process.pid, 'SIGUSR1')
// global.printHaskellServerState()
// haskellState.processes
// haskellState.processes[0].evalQueue[1]._options
// resetHaskellState();

function ensureProcessState(options) {
    for (var i = 0; i < haskellState.processes.length; i++) {
        var procState = haskellState.processes[i];
        if (procState.id === options.sessionId) return procState;
    }

    var procState = {
        id: options.sessionId,
        prompt: options.prompt || '>>',
        baseDirectory: options.baseDirectory || process.cwd(),
        proc: null,
        evalQueue: []
    };

    haskellState.processes.push(procState);
    return procState;
}

function getProcess(procState) { return procState.proc; }
function setProcess(procState, proc) { return procState.proc = proc; }
function removeProcess(procState) { procState.proc = null; }
function stopProcess(procState) { procState.proc && procState.proc.kill('SIGKILL'); }
function haskellProcessIsRunning(procState) { return procState.proc && !!procState.proc._handle; }

function initHaskellProcess(procState, thenDo) {

    log('initing haskell process...');

    var statements = [
        ":set prompt " + procState.prompt,
        ":cd " + procState.baseDirectory,
        //
        // ":def ghc-pkg (\\l->return $ \":!\"++GHC.Paths.ghc_pkg++\" \"++l)",
        // ":def browser (\\l->return $ \":!open file://\"++l)",
        // "let doc p = return $ \":browser \"++GHC.Paths.docdir++relative where { relative | p==\"\" = \"/index.html\" | otherwise = p }",
        // ":def doc doc",
        // "GHCi on Acid" http://www.haskell.org/haskellwiki/GHC/GHCi
        // "import qualified GOA",
        // "GOA.setLambdabotHome \"" + process.env.HOME + "/.cabal/bin\"",
        // ":def bs        GOA.lambdabot \"botsnack\"",
        // ":def pl        GOA.lambdabot \"pl\"",
        // ":def unpl      GOA.lambdabot \"unpl\"",
        // ":def redo      GOA.lambdabot \"redo\"",
        // ":def undo      GOA.lambdabot \"undo\"",
        // ":def index     GOA.lambdabot \"index\"",
        // ":def docs      GOA.lambdabot \"docs\"",
        // ":def instances GOA.lambdabot \"instances\"",
        // ":def hoogle    GOA.lambdabot \"hoogle\"",
        // ":def source    GOA.lambdabot \"fptools\"",
        // ":def where     GOA.lambdabot \"where\"",
        // ":def version   GOA.lambdabot \"version\"",
        // ":def src       GOA.lambdabot \"src\"",
        // ":def pretty    GOA.lambdabot \"pretty\"",
        // "import qualified Debug.HTrace",
        // "trace = Debug.HTrace.htrace . unwords"
    ].join('\n') + '\n';

    haskellEval({
        id: 'initial',
        _options: {
            sessionId: procState.id,
            evalId: 'initial',
            expr: statements
        }}, function(err, evalState) {
            log('haskell init done');
            thenDo(err, procState); });
}

function ensureHaskell(options, thenDo) {
    var procState = ensureProcessState(options);
    var proc = getProcess(procState);
    if (haskellProcessIsRunning(procState)) { thenDo(null, procState); return; }
    var proc = setProcess(procState, spawn("ghci", [], {}));
    proc.on('exit', function() { removeProcess(procState); });
    // debug && proc.stdout.pipe(process.stdout)
    // debug && proc.stderr.pipe(process.stdout)
    initHaskellProcess(procState, thenDo);
}

function ensureHaskellWithListeners(options, onData, onError, thenDo) {
    ensureHaskell(options, function(err, procState) {
        if (err) { thenDo(err, proc); return; }
        var proc = getProcess(procState);
        // log('attaching listeners for ', options);
        proc.stdout.on('data', onData);
        proc.stderr.on('data', onData);
        proc.on('error', onError);
        proc.on('exit', onError);
        function uninstall() {
            // log('detaching listeners for ', options);
            proc.stdout.removeListener('data', onData);
            proc.stderr.removeListener('data', onData);
            proc.removeListener('exit', onError);
            proc.removeListener('error', onError);
        }
        thenDo(null, proc, uninstall);
    })
}


// -=-=-=-=-=-=-=-=-=-
// haskell evaluation
// -=-=-=-=-=-=-=-=-=-

function addNewEvalState(procState, options, callback) {
    var evalId = options.evalId,
        s = getEvalState(procState, evalId);
    if (s) return s;
    var s = {
        id: evalId,
        enqueueTime: Date.now(),
        startTime: null,
        endTime: null,
        result: '',
        _options: options, // transient
        _callback: callback // transient
    };
    procState.evalQueue.push(s);
    return s;
}

function cancelAllQueuedEvals(procState) {
    log('cancelAllQueuedEvals for %s', procState.sessionId);
    var q = procState.evalQueue;
    procState.evalQueue = [];
    q.forEach(function(evalState) {
        if (evalState.startTime) {
            log("cancelAllQueuedEvals: stopping evalState that is already started?!", evalState);
        }
        var thenDo = evalState._callback;
        delete evalState._callback;
        thenDo && thenDo(new Error('eval interrupted', evalState));
    });
}

function getEvalState(procState, evalId) {
    for (var i = 0; i < procState.evalQueue.length; i++) {
        if (procState.evalQueue[i].id === evalId) return procState.evalQueue[i];
    }
}

function removeEvalState(procState, evalId) {
    var idx = procState.evalQueue.indexOf(getEvalState(procState, evalId));
    if (idx > -1) procState.evalQueue.splice(idx, 1);
}

global.haskellEval = function haskellEval(evalState, thenDo) {

    // softAssert(!evalState.startTime, 'calling haskell eval for same task twice?' + util.inspect(evalState));
    // softAssert(!!evalState._options, 'calling haskell eval with no eval options?' + util.inspect(evalState));
    
    var prompt    = evalState._options.prompt || '',
        expr      = evalState._options.expr || "error \"Lively Haskell received no expression\"",
        output    = new Buffer(''),
        timeout   = 30*1000, // ms
        startTime = evalState.startTime = Date.now(),
        sentinel, error,
        uninstallListeners,
        haskellProcState;

    log('Haskell eval %s', expr);

    function checkForOutputAndClose() {
        var stringified = String(output),
            time = Date.now();
        if (stringified.indexOf(prompt) === -1
         && time - startTime < timeout) return;
        clearTimeout(sentinel);
        uninstallListeners && uninstallListeners();
        log('eval %s done', stringified);
        evalState.endTime = time;
        printHaskellServerState();
        thenDo && thenDo(error, stringified);
    }

    function onError(err) {
        log('Error: ', err);
        error = err;
        checkForOutputAndClose();
    }

    function onData(data) {
        // debug && console.log('Haskell output %s', expr);
        output = Buffer.concat([output, data]);
        if (sentinel) clearTimeout(sentinel);
        sentinel = setTimeout(checkForOutputAndClose, 200);
    }

    ensureHaskellWithListeners(evalState._options, onData, onError, function(err, haskellProc, uninstall) {
        uninstallListeners = uninstall;
        if (err) { thenDo(err); return; }
        if (!expr[expr.length-1] === '\n') expr += '\n';
        haskellProc.stdin.write(expr);
    });
}

function haskellEvalQueuedNext(procState) {
    var evalState = procState.evalQueue[0];
    if (!evalState) return;

    softAssert(!evalState.startTime, "haskellEvalQueuedNext starting eval that is already running?");

    log('Resuming eval %s', evalState._options.expr);
    var thenDo = evalState._callback;
    delete evalState._callback;
    haskellEval(evalState, thenDo);
}

function haskellEvalQueued(options, thenDo) {

    var procState = ensureProcessState(options),
        idle      = isIdle(procState),
        evalState = addNewEvalState(procState, options, addEvalResultToEvalState);

    if (idle) haskellEvalQueuedNext(procState);
    else log('Queuing eval %s at position %s', options.expr, procState.evalQueue.length);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function addEvalResultToEvalState(err, resultString) {
        // log('Haskell output %s: %s', evalState._options.expr, resultString);
        evalState.result = resultString;
        removeEvalState(procState, evalState.id);
        thenDo(err, evalState);
        haskellEvalQueuedNext(procState);
    }

    function isIdle(procState) { return procState.evalQueue.length === 0; }
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// haskell related task that don't directly use haskell eval processes and need to
// start their own tools
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var haskellTasks = {}; // id - {proc: PROCESS, callback: FUNCTION, killInitialized: BOOL}

function getTask(id) { return haskellTasks[id]; }

function createTask(id, callback) {
    return haskellTasks[id] = {
        proc: null,
        killInitialized: false,
        callback: callback
    }
}

function hasRunningTask(id) {
    var task = getTask(id);
    return task && task.proc;
}

function cancelRunningTask(id) {
    if (!hasRunningTask(id)) return;
    var task = getTask(id);
    if (!task || task.killInitialized) return;
    log("cancel running task %s", id);
    task.killInitialized = true;
    task.proc.kill('SIGKILL');
}

function finishTask(id, err, result) {
    var task = getTask(id);
    log('finish task ', id)
    task && (task.proc = null);
    if (!task || !task.callback) return false;
    var wasKilled = task.killInitialized;
    log('... was killed: %s', wasKilled)
    task.callback(err, result);
    return true;
}


// -=-=-=-=-=-=-
// haskellTasks
// -=-=-=-=-=-=-

function withTempFileDo(options, func) {
    var tempDir = options.path || path.join(process.env.TEMP_DIR || '/tmp', 'lv-hs');
    if (!tempDir) { func(new Error('No temp dir!')); return; }
    fs.exists(tempDir, function(exists) {
        !exists && fs.mkdirSync(tempDir);
        var randName = crypto.randomBytes(8).toString('base64').replace(/[\\\/]/g, 'x'),
            name = "syntax-check." + randName + ".hs",
            tempFile = path.join(tempDir, name);
        function cleanup() {
            fs.unlinkSync(tempFile);
            log('tempfile %s removed', tempFile);
        }
        log('tempfile %s created', tempFile);
        func(null, tempFile, cleanup);
    });
}

// s = 'main :: IO()\nmain = print "test"'
// syntaxCheck({id: 'test', source: s}, function(err, output) { console.log('', err, output); })
function syntaxCheck(options, thenDo) {
    // 1. create temp file with source
    // 2. run ghc for type errors
    // 3. run hlint
    // 4. cleanup temp files

    if (hasRunningTask(id)) {
        log('task for %s already exist, scheduling for later...', id);
        cancelRunningTask(id);
        setTimeout(syntaxCheck.bind(null, options, thenDo), 40);
        return;
    }

    var source    = options.source,
        id        = options.id,
        procState = ensureProcessState({sessionId: id}),
        path      = procState.baseDirectory,
        task      = createTask(id, thenDo),
        result    = {ghc: {}, hlint: {}},
        cleanupTempFilesFunc, tempFileName;

    async.series([
        function(next) {
            withTempFileDo({path: path}, function(err, fn, cleanup) {
                tempFileName = fn;
                cleanupTempFilesFunc = cleanup;
                next(err);
            });
        },
        function(next) { fs.writeFile(tempFileName, source, next); },
        function(next) { console.log(source); next(); },
        function(next) {
            log('running ghc...');
            task.proc = exec("ghc -Wall -fno-code -fno-warn-unused-binds -fno-warn-type-defaults -fno-warn-name-shadowing -fno-warn-missing-signatures " + tempFileName, {cwd: path}, function(code, out, err) {
            // task.proc = exec("ghc -v0 " + tempFileName, function(code, out, err) {
            // task.proc = exec("ghc -c --make " + tempFileName, function(code, out, err) {
                result.ghc.code = code; result.ghc.out = out; result.ghc.err = err;
                next(task.killInitialized && 'killed');
            });
        },
        function(next) {
            log('running hlint...');
            task.proc = exec("hlint " + tempFileName, function(code, out, err) {
                result.hlint.code = code; result.hlint.out = out; result.hlint.err = err;
                log('done:', result);
                next(err || (task.killInitialized && 'killed'));
            });
        }
    ], function(err) {
        // cleanupTempFilesFunc && cleanupTempFilesFunc();
        finishTask(id, err, result);
    });

}

module.exports = function(route, app) {

    app.post(route + 'eval', function(req, res) {
        var expr = req.body && req.body.expr;
        if (!expr) {
            var msg = {error: 'Cannot deal with request', message: 'No expression'};
            res.status(400).json(msg).end(); return;
        }
        debugger;
        haskellEvalQueued(req.body, function(err, result) {
            res.end(censorJSON({error: err && String(err), result: result}));
        });
    });

    app.post(route + 'check', function(req, res) {
        var code = req.body && req.body.code;
        if (!code) {
            var msg = {error: 'Cannot deal with request', message: 'No codeession'};
            res.status(400).json(msg).end(); return;
        }
        syntaxCheck({source: code, id: req.body.id}, function(err, result) {
            res.json({error: err && String(err), result: result});
        });
    });

    app.post(route + 'reset', function(req, res) {
        resetHaskellState(function(err) {
            if (err) res.status(500).end(String(err)); else res.end('OK');
        })
    });

    app.get(route + 'info', function(req, res) {
        printHaskellServerState(function(err, report) {
            if (err) res.status(500).end(String(err)); else res.end(report);
        })
    });
}
