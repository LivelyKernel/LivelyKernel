/*global require, process*/
var args = require('./helper/args'),
    shell = require('./helper/shell'),
    path = require('path');


// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-

var options = args.options([
    ['-h', '--help', 'show this help'],
    ['-w', '--watch', 'Run with nodemon and watch for file changes'],
    ['-f', '--forever', 'Run with forever and restart server on a crash'],
    ['-p', '--port NUMBER', "On which port to run"],
    ['-m', '--mini-server', 'Start the minimal server (this is the default)']]);

// use the mini server by default, extend this check when new
// server options are added
if (!options.miniServer) {
  options.miniServer = true;
}

if (!options.defined('miniServer')) options.showHelpAndExit();


// -=-=-=-=-=-=-=-=-=-=-
// Start the mini server & how to do that
// -=-=-=-=-=-=-=-=-=-=-
var env = process.env,
    cmdAndArgs = [];

// TODO add logfile param for forever
// TODO add forever stop since forever automatically starts daemonized
if (options.defined('forever')) {
  cmdAndArgs = [env.FOREVER, 'start', '--spinSleepTime', '800'/*ms*/];
}

if (options.defined('watch')) {
  cmdAndArgs.push(env.NODEMON);
  if (options.defined('forever')) {
    cmdAndArgs.push('--exitcrash');
  }
  cmdAndArgs.push('--watch');
  cmdAndArgs.push(env.MINISERVER_DIR);
}

if (!options.defined('forever') && !options.defined('watch')) {
  cmdAndArgs.push('node');
}

cmdAndArgs.push(path.relative(env.LK_SCRIPTS_ROOT, env.MINISERVER));
cmdAndArgs.push(options.port || env.MINISERVER_PORT);

shell.redirectedSpawn(cmdAndArgs[0], cmdAndArgs.slice(1), null, null, true);