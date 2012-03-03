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
    ['-w', '--watch', 'Run with nodemon and watch for file changes']]);


// -=-=-=-=-=-=-=-=-=-=-
// the real thing
// -=-=-=-=-=-=-=-=-=-=-
var filesToCheck = shell.files(env.MINISERVER_DIR)
                   .concat(shell.files(env.LK_TEST_SCRIPT_DIR, /js$/)),
    cmdAndArgs   = [path.relative(env.LK_SCRIPTS_ROOT, env.JSHINT)]
                   .concat(filesToCheck)
                   .concat(['--config', env.JSHINT_CONFIG]);

if (options.defined('watch')) {
  cmdAndArgs = [env.NODEMON, '--exec'].concat(cmdAndArgs);
}

var cmd = cmdAndArgs[0],
    cmdArgs = cmdAndArgs.slice(1);

shell.redirectedSpawn(cmd, cmdArgs,
                      function(code) { process.exit(code); }, null, true);
