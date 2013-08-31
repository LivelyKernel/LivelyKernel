var util = require('util');
var i = util.inspect
var spawn = require("child_process").spawn;
var fs = require('fs');
var path = require('path');

var domain = require('domain').create();
domain.on('error', function(er) {
    console.error('RServer error %s\n%s©', er, er.stack);
});

var debug = true;
var WebSocketServer = require('./support/websockets').WebSocketServer;

// call func until it answers true or timeout is reached
function waitMax(timeout, func, optTimeoutFunc) {
    var startTime = Date.now();
    var processPoll = setInterval(function() {
        if (func()) { clearInterval(processPoll); }
        else if (Date.now() - startTime > timeout) {
            clearInterval(processPoll);
            optTimeoutFunc && optTimeoutFunc();
        }
    }, 100);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
global.R = global.R || {process: null, stdout: '', stderr: '', lastExitCode: null}
// global.R.process.stdin.write('\x1b')

function runR(args) {
    var cmd = "R", dir = process.env.WORKSPACE_LK;
    var options = {cwd: dir, stdio: 'pipe'};
    if (debug) console.log('Running command: %s', [cmd].concat(args));
    R.process = spawn(cmd, args, options);

    domain.add(R.process);

    R.process.stdout.on('data', function (data) {
        debug && console.log('STDOUT: ' + data);
        R.stdout += data;
    });

    R.process.stderr.on('data', function (data) {
        debug && console.log('STDERR: ' + data);
        R.stderr += data;
    });

    R.process.on('close', function (code) {
        debug && console.log('R process exited with code ' + code);
        R.process = null;
        R.lastExitCode = code;
    });
    
}

/*
runR(['--no-readline', '--quiet', '--slave'])
i(R, null, 1)
a
R.process
R.process.stdin.write('heights = rnorm(10, mean = 180, sd = 3)\n')
R.process.stdin.write(
"message(sprintf(\"%s \nvs\n %s\",\n"
+ "                paste(round(heights, 2), collapse=\", \"),\n"
+ "                paste(c(1,2,3,4), collapse=\", \")))\n")

R.process.stdin.write('1+2\n3+4\n')
R.process.stdin.write('heights\n')
R.process.stdin.end('heights')
R.process.stdin.end('q()')
*/

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function evalAtStartup(R, thenDo) {
    // thenDo()
    evalRExpression(
        R,
        ".libPaths(paste(getwd(), '/R-libraries', sep=''))\n"
      + "options(repos=structure(c(CRAN=\"http://cran.us.r-project.org\")))\n"
      + "pkgTest <- function(x) {\n"
      + "    if (!require(x,character.only = TRUE)) {\n"
      + "        install.packages(x,dep=TRUE)\n"
      + "        if (!require(x,character.only = TRUE)) stop(\"Package not found\")\n"
      + "    }\n"
      + "}\n"
      + "pkgTest('LivelyREvaluate')\n",
        function(result) {  thenDo() })
}

function ensureRIsRunning(thenDo, options) {
    options = options || {};
    function saveThenDo() {
        try { thenDo && thenDo(R) } catch(e) { console.error('%s\n%s', e, e.stack); }
    }
    if (R.process) { saveThenDo(R); return; }
    runR(['--no-readline', '--quiet', '--slave']);
    waitMax(options.timeout || 500, function() {
        if (R.process) { evalAtStartup(R, saveThenDo.bind(null,R)); return true; }
        else { return false; }
    }, function() { console.error('Could not start R process'); saveThenDo(null); });
}

function evalRExpression(R, expr, thenDo, options) {
    if (debug) console.log('R evaluates: %s', expr);
    options = options || {};
    var result = {out: '', err: '', code: ''}, gotResult = false;
    function cleanup() {
        var data;
        if (result.err.length > 0) data = {result: result.err, type: 'stderr'}
        else data = {result: result.out, type: 'stdout'}
        return data;
    }
    function capture(type, data) { result[type] += data; gotResult = true; }
    var onOut, onErr, onClose;
    function attach() {
        var p = R.process;
        if (!p) return;
        onOut = capture.bind(null, 'out'); p.stdout.on('data', onOut);
        onErr = capture.bind(null, 'err'); p.stderr.on('data', onErr);
        onClose = capture.bind(null, 'code'); p.on('close', onClose);
    }
    function detach() {
        var p = R.process;
        if (!p) return;
        onOut && p.stdout.removeListener('data', onOut);
        onOut && p.stderr.removeListener('data', onErr);
        onOut && p.removeListener('close', onClose);
    }

    // listen to Rrrrrr and send the expression to the R process
    if (!R.process) {
        result.err = 'Error: R process could not be started.'
        thenDo && thenDo(cleanup());
    }
    attach();
    waitMax(options.timeout || 1000, function() {
            if (!gotResult) return false;
            detach();
            thenDo && thenDo(cleanup());
            return true;
        }, function() {
            // if (!gotResult) result.err = 'Error: R process did not answer.';
            thenDo && thenDo(cleanup());
    });
    R.process.stdin.write(expr);
}

var actions = {
    doEval: function(c, req) {
        try {
            ensureRIsRunning(function(R) {
                var expr = req.data.expr.trim() + '\n';
                evalRExpression(R, expr, function(evalResult) {
                    c.send({action: 'evalResult', data: evalResult, inResponseTo: req.messageId});
                }, {timeout: req.data.evalTimeout});
            }, {timeout: req.data.processStartTimeout, timoutCallback: function() {
                c.send({action: 'timeout', data: {message: 'R could not be started'}, inResponseTo: req.messageId});
            }});
        } catch(e) {
            c.send({action: 'error', data: {message: String(e) + ' \n' + e.stack}, inResponseTo: req.messageId});
        }
    },
    doEvalAsync: function(id, expr, thenDo) {
        ensureRIsRunning(function(R) {
            var cmd = util.format("LivelyREvaluate::evaluate('%s', '%s')\n", id, expr.trim().replace(/\'/g, '\\\''));
            evalRExpression(R, cmd, function(evalResult) { thenDo(null); }, {timeout: 100});
        }, {timeout: 2*1000, timoutCallback: function() {
            thenDo({error: 'timeout', message: 'R could not be started'});
        }});
    },
    getEvalResult: function(id, thenDo) {
        ensureRIsRunning(function(R) {
            var tempFile = path.join(process.env.WORKSPACE_LK, id + ".json"),
                cmd = util.format("LivelyREvaluate::getEvalResult('%s',format='JSON',file='%s')\n", id, tempFile);
            evalRExpression(R, cmd, function(evalResult) {
                if (!fs.existsSync(tempFile)) { thenDo({error: 'R produced no file'}); return; }
                var result = String(fs.readFileSync(tempFile));
                try {
                    fs.unlinkSync(tempFile);
                    thenDo(null, JSON.parse(result));
                } catch(err) {
                    thenDo('parse error:' + String(err));
                }
            }, {timeout: 300});
        }, {timeout: 2*1000, timoutCallback: function() {
            thenDo({error: 'timeout', message: 'R could not be started'});
        }});
    }
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function startRWebSocketServer(route, subserver, thenDo) {
     var webSocketRHandler = global.webSocketRHandler = global.webSocketRHandler || new WebSocketServer();
     domain.add(webSocketRHandler);
     webSocketRHandler.debug = debug;
     webSocketRHandler.listen({
        route: route + 'connect',
        subserver: subserver
    });
    webSocketRHandler.on('lively-message', function(msg, connection) {
        if (!actions[msg.action]) {
            console.warn('R subserver cannot handle message ', msg);
            return;
        }
        try {
            actions[msg.action](connection, msg);
        } catch(e) {
            console.error('R subserver error when handlinglin', msg, e);
        }
    });
    thenDo(null, webSocketRHandler);
}

function resetRWebSocketServer(route, subserver, thenDo) {
    if (global.webSocketRHandler) global.webSocketRHandler.close();
    setTimeout(function() {
        startRWebSocketServer(subserver, thenDo);
    }, 300);
}

module.exports = domain.bind(function(route, app, subserver) {
    startRWebSocketServer(route, subserver, function(err, websocketRHandler) {
        console.log('WebSocket R Handler ready to rumble...');
    });

    app.get(route, function(req, res) {
        res.end("RServer is running!");
    });

    app.post(route + 'asyncEval', function(req,res) {
        var expr = req.body && req.body.expr,
            id = req.body && req.body.id;
        if (!expr || !id) {
            res.status(400);
            res.json({
                error: 'Cannot deal with request',
                message: 'No expression or id ' + JSON.stringify(req.body)
            }).end(); return;
        }
        actions.doEvalAsync(id, expr, function(err) {
            res.json(err);
        });
    });
    app.get(route + 'asyncEval', function(req,res) {
        var id = req.query.id;
        if (!id) {
            res.status(400); res.json({error: 'error', message: 'No id'});
            return;
        }
        actions.getEvalResult(id, function(err, result) {
            if (err) {
                res.status(400); res.json({error: 'error', message: err});
            } else {
                res.json(result);
            }
        })
    });

    app.post(route + 'eval', function(req,res) {
        var expr = req.body && req.body.expr,
            evalTimeout = req.body && req.body.evalTimeout || 1*1000;
        if (!expr) {
            res.status(400);
            res.json({
                error: 'Cannot deal request',
                message: 'No expression ' + JSON.stringify(req.body)
            }).end();
            return;
        }
        try {
            ensureRIsRunning(function(R) {
                evalRExpression(R, expr.trim() + '\n', function(evalResult) {
                    res.json(evalResult).end();
                }, {timeout: evalTimeout});
            }, {timeout: 2*1000, timoutCallback: function() {
                res.status(400); res.json({error: 'timeout', message: 'R could not be started'});
            }});
        } catch(e) {
            console.error(e.stack);
            res.status(400); res.json({error: 'error', message: String(e)});
        }
    });

    app.post(route + 'reset', function(req, res) {
        console.log('Resetting R process');
        if (!R.process) { console.log("R process not running") }
        else R.process.kill('SIGKILL');
        // resetRWebSocketServer(route, subserver, function(err, websocketRHandler) {
        //     res.json({message: 'R process resetted'}).end();
        // });
        res.json({message: 'R process resetted'}).end();
    });
});
