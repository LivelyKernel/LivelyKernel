/*global require*/
var args = require('./helper/args'),
    shell = require('./helper/shell'),
    path = require('path');


// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-

var options = args.options([
    ['-h', '--help', 'show this help'],
    ['-c', '--continuous', 'Run with nodemon and watch for file changes'],
    ['--core', 'run the core tests'],
    ['--server', 'run the server tests']]);

if (options.defined('core')) {
    var cmd = options.defined('continuous') ?
        path.join(__dirname, '../node_modules/nodemon/nodemon.js') : 'node';
    shell.redirectedSpawn(cmd, ['run_lively_tests_cli.js'], null, {cwd: path.join(__dirname, '../testing/')});
}