var spawn = require("child_process").spawn;
var exec = require("child_process").exec;
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");

var haskellState = global.haskellState || (global.haskellState = {process: null});

if (haskellState.process) {
    haskellState.process.kill('SIGKILL');
}

function ensureHaskell(thenDo) {
    if (haskellState.process && haskellState.process._handle) {
        thenDo(null, haskellState.process);
        return;
    }
    var proc = haskellState.process = spawn("ghci", [], {});
    proc.on('exit', function() { haskellState.process = null; });
// haskellState.process.stdout.pipe(process.stdout)
// haskellState.process.stderr.pipe(process.stdout)
    ensureHaskellWithListeners(function(data) {console.log("%s", data);}, function(err) {}, function(err, proc, uninstall) {
        if (err) { thenDo(err); uninstall && uninstall(); return }
        proc.stdin.write(":set prompt >>>\n");
        setTimeout(function() { uninstall && uninstall(); thenDo(null, proc); }, 400);
    });
}

function ensureHaskellWithListeners(onData, onError, thenDo) {
    ensureHaskell(function(err, proc) {
        if (err) { thenDo(err, proc); return; }
        proc.stdout.on('data', onData);
        proc.stderr.on('data', onData);
        proc.on('error', onError);
        proc.on('exit', onError);
        function uninstall() {
            proc.stdout.removeListener('data', onData);
            proc.stderr.removeListener('data', onData);
            proc.removeListener('exit', onError);
            proc.removeListener('error', onError);
        }
        thenDo(null, proc, uninstall);
    })
}

function haskellEval(expr, thenDo) {
    var output = new Buffer(''), sentinel, error, uninstallListeners;
    function checkForOutputAndClose() {
        clearTimeout(sentinel);
        uninstallListeners && uninstallListeners();
        thenDo(error, output.toString());
    }
    function onError(err) {
        console.log('Haskell error: ', err);
        error = err;
        checkForOutputAndClose();
    }
    function onData(data) {
        output = Buffer.concat([output, data]);
        if (sentinel) clearTimeout(sentinel);
        sentinel = setTimeout(checkForOutputAndClose, 200);
    }
    ensureHaskellWithListeners(onData, onError, function(err, haskellProc, uninstall) {
        uninstallListeners = uninstall;
        if (err) { thenDo(err); return; }
        if (!expr[expr.length-1] === '\n') expr += '\n';
        haskellProc.stdin.write(expr);
    });
}

function withTempFileDo(func) {
    var tempDir = process.env.TEMP_DIR;
    if (!tempDir) { func(new Error('No temp dir!')); return; }
    var hsTempDir = path.join(tempDir, 'lv-hs');
    if (!fs.existsSync(hsTempDir)) { fs.mkdirSync(hsTempDir); }
    // var randName = crypto.randomBytes(20).toString('base64').replace(/[\\\/]/g, 'x');
    var name = "syntax-check.hs";
    var tempFile = path.join(hsTempDir, name);
    function cleanup() { fs.unlinkSync(tempFile); }
    func(null, tempFile, cleanup);
}

// s = 'main = print "test" + 1'
// syntaxCheck(s, function(err, output) {})
syntaxCheck = function syntaxCheck(source, thenDo) {
    withTempFileDo(function(err, fn, cleanup) {
        fs.writeFileSync(fn, source);
        exec("ghc -fno-code " + fn, function(code, out, err) {
            console.log(arguments);
            exec("hlint " + fn, function(code, out, err) {
                console.log(arguments);
                cleanup();
                thenDo(null);
            });
        });
    });
}

module.exports = function(route, app) {

    app.post(route + 'eval', function(req, res) {
        var expr = req.body && req.body.expr;
        if (!expr) {
            var msg = {error: 'Cannot deal with request', message: 'No expression'};
            res.status(400).json(msg).end(); return;
        }
        haskellEval(expr, function(err, result) {
            res.json({error: err && String(err), result: String(result)});
        });
    });

    app.post(route + 'check', function(req, res) {
        var code = req.body && req.body.code;
        if (!code) {
            var msg = {error: 'Cannot deal with request', message: 'No codeession'};
            res.status(400).json(msg).end(); return;
        }
        haskellEval(code, function(err, result) {
            res.json({error: err && String(err), result: String(result)});
        });
    });

}
