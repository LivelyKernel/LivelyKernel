/*global require, process*/
var args = require('./helper/args'),
    shell = require('./helper/shell'),
    path = require('path');


// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-
var env = process.env,
    options = args.options([
    ['-h', '--help', 'show this help'],
    ['-c', '--continuous', 'Run with nodemon and watch for file changes']]);

var filesToCheck = shell.files(env.MINISERVER_DIR)
                   .concat(shell.files(env.LK_TEST_SCRIPT_DIR, /js$/)),
    cmdAndArgs   = [env.JSHINT]
                   .concat(filesToCheck)
                   .concat(['--config', env.JSHINT_CONFIG]);

if (options.defined('continuous')) {
  cmdAndArgs = [env.NODEMON, '--exec'].concat(cmdAndArgs);
}

var cmd = cmdAndArgs[0],
    cmdArgs = cmdAndArgs.slice(1);

shell.redirectedSpawn(cmd, cmdArgs,
                      function(code) { process.exit(code); });