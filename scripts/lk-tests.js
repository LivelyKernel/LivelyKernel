/*global require*/
var args = require('./helper/args'),
    spawn = require('child_process').spawn,
    path = require('path');


// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-

var options = args.options([
    ['-h', '--help', 'show this help'],
    ['-c', '--continuous', 'Run with nodemon and watch for file changes'],
    ['--core', 'run the core tests'],
    ['--server', 'run the server tests']]);

function redirectSpawn(cmd, args, options) {
    var spawned = spawn(cmd, args, options);

    // redirect fds
    spawned.stdout.on('data', function (data) {
        process.stdout.write(data);
    });

    spawned.stderr.on('data', function (data) {
        process.stdout.write(data);
    });

    spawned.on('exit', function (code) {
    });
}

if (options.defined('core')) {
    var cmd = options.defined('continuous') ?
        path.join(__dirname, '../node_modules/nodemon/nodemon.js') : 'node';
    redirectSpawn(cmd, ['run_lively_tests_cli.js'], {cwd: path.join(__dirname, '../testing/')});
}