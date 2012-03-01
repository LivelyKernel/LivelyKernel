/*global require, exports, process, console*/

// interactive shell commands
// see http://groups.google.com/group/nodejs/browse_thread/thread/6fd25d16b250aa7d
var spawn = require('child_process').spawn,
    tty = require('tty');

function runInteractively(cmd, opts, callback) {
    process.stdin.pause();
    tty.setRawMode(false);
    var  p = spawn(cmd, opts, {
        customFds: [0, 1, 2]
    });
    return p.on('exit', function() {
        tty.setRawMode(true);
        process.stdin.resume();
        return callback();
    });
}

exports.runInteractively = runInteractively;


// ---------------------------------------------
// stuff below is still WIP

var exec = require('child_process').exec,
    Seq = require('seq');

function run(cmd, cb, options, verbose) {
    exec(cmd, options, function(code, out, err) {
        if (verbose) {
            var msg = cmd;
            if (code) { msg += '\ncode: ' + code };
            if (out) { msg += '\nout: ' + out };
            if (err) { msg += '\nerr: ' + err };
            console.log(msg);
        }
        cb && cb(out, code, err); });
}

function runVerbose(cmd, cb, options) {
    run(cmd, cb, options, true);
}

function pipe(cmds) {
    var value;
    var seq = Seq();
    // cmds.forEach(function(cmd) {
    //     if (typeof cmd == 'function') {
    //         var returned = cmd(value);
    //         if (returned) { value = returned; return }
    //     }
    // });
    return cmds;
}

exports.run = run;
exports.runV = runVerbose;
exports.runAll = runVerbose;
exports.pipe = pipe;