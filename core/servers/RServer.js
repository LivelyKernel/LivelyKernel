var util  = require('util');
var i     = util.inspect
var spawn = require("child_process").spawn;
var fs    = require('fs');
var path  = require('path');

var domain = require('domain').create();
domain.on('error', function(er) {
    console.error('RServer2 error %s\n%s', er, er.stack);
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var state = {};
var debug = false;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
function evalAtStartup(rState, thenDo) {

    console.log('initializing R process...');
    var initCode = ".libPaths(paste(getwd(), '/R-libraries', sep=''))\n"
             + "options(repos=structure(c(CRAN=\"http://cran.us.r-project.org\")), keep.source=TRUE, error=quote(dump.frames(\"lively_R_dump\", TRUE)))\n"
             + "pkgTest <- function(x) {\n"
             + "    if (!require(x,character.only = TRUE)) {\n"
             + "        install.packages(x,dep=TRUE)\n"
             + "        if (!require(x,character.only = TRUE)) stop(\"Package not found\")\n"
             + "    }\n"
             + "}\n"
             + "pkgTest('LivelyREvaluate')\n";

    evalRExpression(rState, {timeout: 10*1000}, initCode,
        function(err, result) {
            console.log('initializing R process done');
            thenDo(err) });

}

function runR(rState, args, thenDo) {

    if (rState.process) { thenDo(null, rState); return }

    var cmd = "R", dir = process.env.WORKSPACE_LK,
        options = {cwd: dir, stdio: 'pipe', env: process.env};

    if (debug) process.stdout.write('[RServer] Running command: ' + [cmd].concat(args));

    rState.process = spawn(cmd, args, options);
    domain.add(rState.process);

    debug && rState.process.stdout.on('data', function (data) {
        process.stdout.write('[RServer] STDOUT: ' + data); });
    debug && rState.process.stderr.on('data', function (data) {
        process.stdout.write('[RServer] STDERR: ' + data); });

    rState.process.on('close', function (code) {
        debug && process.stdout.write('[RServer] process exited with code ' + code);
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

    attach();
    setTimeout(function() { if (!done) detach('timeout'); }, timeout);
    var resultPoll = setInterval(function() {
        var endMarkerPos = output.indexOf(endMarker);
        if (endMarkerPos === -1) return;
        output = output.slice(0, endMarkerPos);
        //done = true;  duplication
        detach(null);
    }, 40);

    var transformed = util.format('%s\nwrite("%s", stderr())\n', expr.trim(), endMarker);
    p.stdin.write(transformed);

    if (debug) console.log('R evaluates: %s', expr);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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

}

function withLivelyREvaluateDo(rState, options, expr, thenDo) {
    // var template = "if (\"package:LivelyREvaluate\" %in% search()) {\n"
    //             + "    %s\n"
    //             + "} else {\n"
    //             + "    warning(\"package LivelyREvaluate not installed\")\n"
    //             + "}\n",
    //    code = util.format(template, expr);
    evalRExpression(rState, options, expr, thenDo);
}

function startEvalInSubprocess(rState, options, id, expr, thenDo) {

    var code = util.format("LivelyREvaluate::evaluate('%s', '%s', exit=%s, debug=%s)",
        id, expr.trim().replace(/\'/g, '\\\''), (options.exit ? 'TRUE' : 'FALSE'), (options.debug ? 'TRUE' : 'FALSE'));

    withLivelyREvaluateDo(rState, options, code, thenDo);

    //getSubprocessResult(rState, options, id, thenDo);         ael - wait for client to send explicitly
}

function getSubprocessResult(rState, options, id, thenDo) {

    var tempFile = path.join(process.env.WORKSPACE_LK, id + ".json"),
        code = util.format("LivelyREvaluate::getEvalResult('%s',mergeEnvs=%s, format='JSON',file='%s')", id, ((options.merge===false) ? 'FALSE' : 'TRUE'), tempFile);

    withLivelyREvaluateDo(rState, options, code, function(errOrNull) {
        // on normal completion errOrNull will be null; it can also be 'timeout'
        // if (errOrNull) console.log("**** Error from withLivelyREvaluate: ", errOrNull)
        fs.exists(tempFile, function(exists) {

            if (!exists) {
                if (errOrNull == 'timeout')
                    thenDo(null, {processState: 'PENDING', result: null}); // assume R's just busy
                else thenDo('R produced no file');      // something actually went wrong
                return;
            }

            fs.readFile(tempFile, function(err, content) {
                if (err) { thenDo(err); return; }
                try {
                    fs.unlink(tempFile);
                    thenDo(null, JSON.parse(content));
                } catch(err) {
                    thenDo(String(err));
                }
            });
            
        });
    });

}

function stopSubprocess(rState, options, id, thenDo) {
    var code = util.format("LivelyREvaluate::stopEvaluation('%s')", id);
    withLivelyREvaluateDo(rState, options, code, thenDo);
}

function cleanup(subserver) {
    console.log('RServer is shutting down...');
    if (state.process) state.process.kill();
    subserver && subserver.removeAllListeners();
    state = {};
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

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
            timeout = req.body && req.body.timeout,
            exit = req.body && req.body.exit,
            debug = req.body && req.body.debug;
        if (!expr || !id) {
            var msg = {error: 'Cannot deal with request', message: 'No expression or id'};
            res.status(400).json(msg).end();
            return;
        }
        startEvalInSubprocess(state, {timeout: timeout, exit: exit, debug: debug}, id, expr, function(err, result) {
            if (err) { res.status(500).json({error: String(err)}).end(); return; }
            res.json(result).end();
        });
    });

    app.get(route + 'evalAsync', function(req,res) {
        var query = require('url').parse(req.url, true).query;  // var query = req.query;
        var id = query.id,
            timeout = query.timeout,
            merge = query.merge==='true';

        if (!id) {
            res.status(400); res.json({error: 'error', message: 'No id'}); return;
        }

        getSubprocessResult(state, {timeout: timeout, merge: merge}, id, function(err, result) {
            if (err) { res.status(500).json({error: String(err)}).end(); return; }
            res.json(result).end();
        });

    });

    app.del(route + 'evalAsync', function(req,res) {
        var query = require('url').parse(req.url, true).query;
        var id = query.id,
            timeout = query.timeout;
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
        res.json({message: 'R process reset'}).end();
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

module.exports.rState = state;
module.exports.reset = cleanup;
