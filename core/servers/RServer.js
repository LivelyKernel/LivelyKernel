var util = require('util');
var i = util.inspect
var spawn = require("child_process").spawn;
var fs = require('fs');
var path = require('path');
var async = require('async');

var domain = require('domain').create();
domain.on('error', function(er) {
    console.error('RServer2 error %s\n%s', er, er.stack);
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var state = {};
var debug = true;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function evalAtStartup(rState, thenDo) {
    // thenDo()
    var initCode = ".libPaths(paste(getwd(), '/R-libraries', sep=''))\n"
             + "options(repos=structure(c(CRAN=\"http://cran.us.r-project.org\")))\n"
             + "pkgTest <- function(x) {\n"
             + "    if (!require(x,character.only = TRUE)) {\n"
             + "        install.packages(x,dep=TRUE)\n"
             + "        if (!require(x,character.only = TRUE)) stop(\"Package not found\")\n"
             + "    }\n"
             + "}\n"
             + "pkgTest('LivelyREvaluate')\n";
    evalRExpression(rState, {timeout: 10*1000}, initCode,
        function(err, result) { thenDo(err) })
}

function runR(rState, args, thenDo) {
    if (rState.process) { thenDo(null, rState); return }
    var cmd = "R", dir = process.env.WORKSPACE_LK;
    var options = {cwd: dir, stdio: 'pipe', env: process.env};
    if (debug) console.log('Running command: %s', [cmd].concat(args));
    rState.process = spawn(cmd, args, options);

    domain.add(rState.process);

    debug && rState.process.stdout.on('data', function (data) {
        console.log('STDOUT: ' + data); });
    debug && rState.process.stderr.on('data', function (data) {
        console.log('STDERR: ' + data); });

    rState.process.on('close', function (code) {
        debug && console.log('R process exited with code ' + code);
        rState.process.stdout.removeAllListeners();
        rState.process.stderr.removeAllListeners();
        rState.process.removeAllListeners();
        rState.process = null;
    });

    evalAtStartup(rState, function(err) { thenDo(err, rState); });
}

function evalRExpression(rState, options, expr, thenDo) {
    // listen to Rrrrrr and send the expression to the R process
    // options = {timeout: MILLISECONDS}
    if (!rState.process) {
        runR(rState, ['--no-readline', '--quiet', '--slave'], function(err, rState) {
            if (err || !rState.process) thenDo(err || 'Error: R process could not be started.');
            else evalRExpression(rState, options, expr, thenDo);
        });
        return;
    }
    var startTime = Date.now(),
        endMarker = startTime + ' is done',
        output = '',
        done = false,
        timeout = options.timeout || 1000,
        p = rState.process;
    function capture(data) { output += data.toString(); }
    function attach() {
        p.stdout.on('data', capture);
        p.stderr.on('data', capture);
        p.on("close", detach);
    }
    function detach(err) {
        p.stdout.removeListener('data', capture);
        p.stderr.removeListener('data', capture);
        p.removeListener('close', detach);
        clearInterval(resultPoll);
        done = true;
        thenDo(err, output);
    }
    attach();
    setTimeout(function() { if (!done) detach('timeout'); }, timeout);
    var resultPoll = setInterval(function() {
        var endMarkerPos = output.indexOf(endMarker);
        if (endMarkerPos === -1) return;
        output = output.slice(0, endMarkerPos);
        done = true;
        detach(null);
    }, 40);
    expr = util.format('%s\nwrite("%s", stderr())\n', expr.trim(), endMarker);
    p.stdin.write(expr);
    if (debug) console.log('R evaluates: %s', expr);
}

function withLivelyREvaluateDo(rState, options, expr, thenDo) {
    var template = "if (\"package:LivelyREvaluate\" %in% search()) {\n"
                 + "    %s\n"
                 + "} else {\n"
                 + "    warning(\"package LivelyREvaluate not installed\")\n"
                 + "}\n",
        code = util.format(template, expr);
    evalRExpression(rState, options, code, thenDo);
}

function startEvalInSubprocess(rState, options, id, expr, thenDo) {
    var code = util.format("LivelyREvaluate::evaluate('%s', '%s')",
        id, expr.trim().replace(/\'/g, '\\\''));
    withLivelyREvaluateDo(rState, options, code, function(err) {
        getSubprocessResult(rState, options, id, thenDo);
    });
}

function getSubprocessResult(rState, options, id, thenDo) {
    var tempFile = path.join(process.env.WORKSPACE_LK, id + ".json"),
        code = util.format("LivelyREvaluate::getEvalResult('%s',format='JSON',file='%s')", id, tempFile);
    withLivelyREvaluateDo(rState, options, code, function(err) {
        fs.exists(tempFile, function(exists) {
            if (!exists) { thenDo('R produced no file'); return; }
            fs.readFile(tempFile, function(err, content) {
                if (err) { thenDo(err); return; }
                try {
                    fs.unlink(tempFile);
                    thenDo(null, JSON.parse(content));
                } catch(err) {
                    thenDo(String(err));
                }
            })
            
        })
    })
}

function stopSubprocess(rState, options, id, thenDo) {
    var code = util.format("LivelyREvaluate::stopEvaluation('%s')", id);
    withLivelyREvaluateDo(rState, options, code, thenDo);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function cleanup(subserver) {
    console.log('RServer is shutting down...');
    if (state.process) state.process.kill();
    subserver && subserver.removeAllListeners();
}

module.exports = domain.bind(function(route, app, subserver) {

    subserver.on('close', cleanup.bind(null, subserver));

    app.post(route+'eval', function(req, res) {
        var expr = req.body && req.body.expr,
            timeout = req.body && req.body.timeout;
        if (!expr) {
            var msg = {error: 'Cannot deal with request', message: 'No expression'};
            res.status(400).json(msg).end();
            return;
        }
        evalRExpression(state, {timeout: timeout}, expr, function(err, output) {
            if (err) { res.status(500).json({error: String(err)}).end(); return; }
            res.json({result: output}).end();
        });
    });

    app.post(route+'evalAsync', function(req, res) {
        var expr = req.body && req.body.expr,
            id = req.body && req.body.id,
            timeout = req.body && req.body.timeout;
        if (!expr || !id) {
            var msg = {error: 'Cannot deal with request', message: 'No expression or id'};
            res.status(400).json(msg).end();
            return;
        }
        startEvalInSubprocess(state, {timeout: timeout}, id, expr, function(err, result) {
            if (err) { res.status(500).json({error: String(err)}).end(); return; }
            res.json(result).end();
        });
    });

    app.get(route + 'evalAsync', function(req,res) {
        var id = req.query.id, timeout = req.query.timeout;
        if (!id) {
            res.status(400); res.json({error: 'error', message: 'No id'}); return;
        }
        getSubprocessResult(state, {timeout: timeout}, id, function(err, result) {
            if (err) { res.status(500).json({error: String(err)}).end(); return; }
            res.json(result).end();
        });
    });

    app.del(route + 'evalAsync', function(req,res) {
        var id = req.query.id, timeout = req.query.timeout;
        if (!id) {
            res.status(400); res.json({error: 'error', message: 'No id'}); return;
        }
        stopSubprocess(state, {timeout: timeout}, id, function(err, result) {
            if (err) { res.status(500).json({error: String(err)}).end(); return; }
            res.json(result).end();
        });
    });

    app.post(route + 'reset', function(req, res) {
        console.log('Resetting R process');
        cleanup();
        res.json({message: 'R process resetted'}).end();
    });

    app.post(route + 'setDebug', function(req, res) {
        debug = req.body.value || false;
        console.log('Setting RServer debug mode to ', debug);
        res.end();
    });

    app.get(route, function(req, res) {
        res.end("RServer is running!");
    });
});
