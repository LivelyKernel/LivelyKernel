var spawn = require("child_process").spawn;
var exec = require("child_process").exec;
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
var async = require("async");
var debug = true;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// helper
function withTempFileDo(options, func) {
    var tempDir = options.path || path.join(process.env.TEMP_DIR, 'lv-hs');
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

function log(/*args*/) {
    process.stdout.write('HaskellServer: ');
    console.log.apply(console, arguments);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// haskell process + eval
// haskellState.processes[0]
// haskellState.processes[0].proc.kill()
var haskellState = global.haskellState || (global.haskellState = {processes: []});

function resetHaskellState(thenDo) {
    debug && console.log("Resetting Haskell processes and states...");
    if (haskellState.processes) {
        haskellState.processes.forEach(stopProcess);
        haskellState.processes = [];
    }
    thenDo && thenDo(null);
}

resetHaskellState();

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
    }
    haskellState.processes.push(procState);
    return procState;
}

function getProcess(procState) { return procState.proc; }
function setProcess(procState, proc) { return procState.proc = proc; }
function removeProcess(procState) { procState.proc = null; }
function stopProcess(procState, thenDo) {
    if (!procState.proc) return;
    exec('kill -9 ' + procState.proc.pid, thenDo);
}
function haskellProcessIsRunning(procState) { return procState.proc && !!procState.proc._handle; }

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// eval state
function addNewEvalState(procState, options, callback) {
    var evalId = options.evalId;
    var s = getEvalState(procState, evalId);
    if (s) return s;
    var s = {
        id: evalId,
        options: options,
        startTime: Date.now(),
        result: '',
        callback: callback
    };
    procState.evalQueue.push(s);
    return s;
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
function isIdle(procState) { return procState.evalQueue.length === 0; }

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// haskell interaction
function initHaskellProcess(procState, thenDo) {
    log('initing haskell process...');
    var statements = [
        ":set prompt " + procState.prompt,
        ":cd " + procState.baseDirectory,
        // 
        ":def ghc-pkg (\\l->return $ \":!\"++GHC.Paths.ghc_pkg++\" \"++l)",
        ":def browser (\\l->return $ \":!open file://\"++l)",
        "let doc p = return $ \":browser \"++GHC.Paths.docdir++relative where { relative | p==\"\" = \"/index.html\" | otherwise = p }",
        ":def doc doc",
        // "GHCi on Acid" http://www.haskell.org/haskellwiki/GHC/GHCi
        "import qualified GOA",
        "GOA.setLambdabotHome \"" + process.env.HOME + "/.cabal/bin\"",
        ":def bs        GOA.lambdabot \"botsnack\"",
        ":def pl        GOA.lambdabot \"pl\"",
        ":def unpl      GOA.lambdabot \"unpl\"",
        ":def redo      GOA.lambdabot \"redo\"",
        ":def undo      GOA.lambdabot \"undo\"",
        ":def index     GOA.lambdabot \"index\"",
        ":def docs      GOA.lambdabot \"docs\"",
        ":def instances GOA.lambdabot \"instances\"",
        ":def hoogle    GOA.lambdabot \"hoogle\"",
        ":def source    GOA.lambdabot \"fptools\"",
        ":def where     GOA.lambdabot \"where\"",
        ":def version   GOA.lambdabot \"version\"",
        ":def src       GOA.lambdabot \"src\"",
        ":def pretty    GOA.lambdabot \"pretty\"",
        "import qualified Debug.HTrace",
        "trace = Debug.HTrace.htrace . unwords"
    ].join('\n') + '\n';
    haskellEval({
        sessionId: procState.id,
        evalId: 'initial',
        expr: statements
    }, function(err, out) {
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
        thenDo(null, procState, uninstall);
    });
}

function haskellEval(options, thenDo) {
    var prompt = options.prompt || '';
    var expr = options.expr || "error \"Lively Haskell received no expression\"";
    var output = new Buffer(''), sentinel, error, uninstallListeners;
    var timeout = 30*1000; // ms
    var startTime = Date.now();
    var haskellProcState;
    log('Haskell eval %s', expr);
    function checkForOutputAndClose() {
        var stringified = String(output);
        if (stringified.indexOf(prompt) === -1
         && Date.now()-startTime < timeout) return;
        clearTimeout(sentinel);
        uninstallListeners && uninstallListeners();
        log('eval %s done', stringified);
        thenDo(error, stringified);
    }
    function onError(err) {
        console.log('Haskell error: ', err);
        error = err;
        checkForOutputAndClose();
    }
    function onData(data) {
        output = Buffer.concat([output, data]);
        sentinel && clearTimeout(sentinel);
        sentinel = setTimeout(checkForOutputAndClose, 200);
    }
    ensureHaskellWithListeners(options, onData, onError, function(err, procState, uninstall) {
        uninstallListeners = uninstall;
        if (err) { thenDo(err); return; }
        if (!expr[expr.length-1] === '\n') expr += '\n';
        haskellProcState = procState;
        getProcess(procState).stdin.write(expr);
    });
}

function haskellEvalQueuedNext(procState) {
    var evalState = procState.evalQueue[0];
    if (!evalState) return;
    log('Resuming eval %s', evalState.expr);
    var thenDo = evalState.callback;
    delete evalState.callback;
    haskellEval(evalState.options, thenDo);
}

function haskellEvalQueued(options, thenDo) {
    function addEvalResultToEvalState(err, stringifiedResult) {
        evalState.result = stringifiedResult;
        // log('Haskell output %s: %s', options.expr, stringifiedResult);
        removeEvalState(procState, evalState.id);
        thenDo(err, evalState);
        haskellEvalQueuedNext(procState);
    }
    var procState = ensureProcessState(options);
    var idle = isIdle(procState);
    var evalState = addNewEvalState(procState, options, addEvalResultToEvalState);
    if (idle) haskellEval(options, addEvalResultToEvalState);
    else {
        log(procState.evalQueue);
        log('Queuing eval %s', options.expr);
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// haskell tasks
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

// haskellTasks
// haskellTasks
// s = 'main :: IO()\nmain = print "test"'
// syntaxCheck({id: 'test', source: s}, function(err, output) { console.log('', err, output); })
function syntaxCheck(options, thenDo) {
    if (hasRunningTask(id)) {
        log('task for %s already exist, scheduling for later...', id);
        cancelRunningTask(id);
        setTimeout(syntaxCheck.bind(null, options, thenDo), 40);
        return;
    }
    var source = options.source;
    var id = options.id;
    var procState = ensureProcessState({sessionId: id});
    var path = procState.baseDirectory;
    // 1. create temp file with source, 2. run ghc for type errors, 3. run hlint
    // 4. cleanup temp files
    var task = createTask(id, thenDo);
    var cleanupTempFilesFunc, tempFileName, result = {ghc: {}, hlint: {}};
    async.series([
        function(next) {
            withTempFileDo({path: path}, function(err, fn, cleanup) {
                tempFileName = fn;
                cleanupTempFilesFunc = cleanup;
                next(err);
            });
        },
        function(next) { fs.writeFile(tempFileName, source, next); },
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
        cleanupTempFilesFunc && cleanupTempFilesFunc();
        finishTask(id, err, result);
    });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// exports / interface
var evalCount = 0;
module.exports = function(route, app) {

    app.post(route + 'eval', function(req, res) {
        var options = {
            expr: req.body && req.body.expr,
            baseDirectory: req.body && req.body.baseDirectory || '',
            prompt: req.body && req.body.prompt,
            sessionId: (req.body && req.body.sessionId) || 'default',
            evalId: ++evalCount
        }
        if (!options.expr) {
            var msg = {error: 'Cannot deal with request', message: 'No expression'};
            res.status(400).json(msg).end(); return;
        }
        haskellEvalQueued(options, function(err, result) {
            res.json({error: err ? String(err) : undefined, result: result});
        });
    });

    app.post(route + 'check', function(req, res) {
        var code = req.body && req.body.code,
            id = req.body && req.body.id,
            sessionId = (req.body && req.body.sessionId) || 'default';
        if (!code) {
            var msg = {error: 'Cannot deal with request', message: 'No codeession'};
            res.status(400).json(msg).end(); return;
        }
        syntaxCheck({
            id: sessionId,
            source: code
        }, function(err, result) {
            res.json({error: err ? String(err) : undefined, result: result});
        });
    });

    app.post(route + 'reset', function(req, res) {
        console.log("resetting...");
        resetHaskellState(function(err) {
            if (err) res.status(500);
            res.json({status: err ? String(err) : "OK"});
        });
    });

    app.get(route + 'processes', function(req, res) {
        var status = haskellState.processes.map(function(procState) {
            return {
                id: procState.id,
                baseDirectory: procState.baseDirectory,
                isRunning: haskellProcessIsRunning(procState),
                evalQueue: procState.evalQueue.map(function(queued) {
                    return {
                        id: queued.id,
                        options: queued.options,
                        startTime: queued.startTime,
                        result: queued.result
                    }
                })
            }
        });
        console.log(status);
        res.json(status);
    });
}
