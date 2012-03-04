/*global require, process*/
var args = require('./helper/args'),
    shell = require('./helper/shell'),
    path = require('path');


// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-
var env = process.env,
    options = args.options([
        ['-h', '--help', 'Show this help.'],
        ['-i', '--install DIR', 'Install the PartsBin from ' + env.PARTSBIN_SVN_URL
             + 'into DIR or ' + env.PARTSBIN_DIR + ' if no DIR given'],
        ['-u', '--update', 'Update the PartsBin']]);


// -=-=-=-=-=-=-=-=-=-=-
// the real thing
// -=-=-=-=-=-=-=-=-=-=-
var argList = [];
if (options.defined('install')) {
    var dir = options.install || env.PARTSBIN_DIR;
    argList.push('co', env.PARTSBIN_SVN_URL, dir);
} else if (options.defined('update')) {
    argList.push('up', env.PARTSBIN_SVN_URL);
} else {
    options.showHelpAndExit();
}

shell.redirectedSpawn('svn', argList,
                      function(code) { process.exit(code); }, null, true);