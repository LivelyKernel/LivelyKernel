/*global require, process*/
var args = require('./helper/args'),
    shell = require('./helper/shell'),
    path = require('path'),
    env = process.env,
// FIXME best to refactor run_lively_tests_cli.js and its use of config
// so we don't have to duplicate stuff here
    config = require(env.LK_TEST_SCRIPT_DIR + '/config');

// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-

var platformConf = config.platformConfigs[process.platform],
    supportedBrowsers = Object.keys(platformConf),
    defaultBrowser = '"' + config.defaultBrowser + '"',
    options = args.options([
        ['-h', '--help', 'show this help'],
        ['-w', '--watch', 'Run with nodemon and watch for file changes'],
        ['-v', '--verbose', "Print progress and debug information."],
        ['-b', '--browser NAME', "Which browser to use. Options are \""
                               + supportedBrowsers.join('", "')
                               + "\". If not specified then "
                               + defaultBrowser + " is used."],
        ['-n', '--notifier NAME', "Use a system notifier to output results. "
                                + "Currently \"" + config.defaultNotifier
                                + "\" is supported."],
        ['-d', '--display NUMBER', 'Secify a display id for running chrome with xvfb'],
        ['-f', '--focus FILTER', "A filter is a string that can have three"
                               + "parts separated by \"|\". All parts define"
                               + " JS regexps.\n\t\t\t\tThe first is for "
                               + "matching test modules to load, the second "
                               + "matches test classes, the third test method"
                               + "names.\n\t\t\t\tExample: "
                               + "\"testframework|.*|filter\" will only run "
                               + "those tests that are in modules matching "
                               + "'testframework' and are\n\t\t\t\tdefined in"
                               + "those test methods that match 'filter'."],
        ['--test-script FILE', "Script file that is sent to the browser and "
                             + "runs the tests. If not specified then \""
                             + config.defaultTestScript + "\" is used."]]);

var cmd = options.defined('watch') ? env.NODEMON : 'node',
    argList = [];

argList.push([path.relative(env.LK_SCRIPTS_ROOT, env.LK_TEST_STARTER)]);
['verbose', 'browser', 'notfier', 'display', 'focus', 'testScript'].forEach(function(option) {
if (!options.defined(option)) return;
argList.push(options.dasherize(option));
if (options.hasValue(option)) {
    argList.push(options[option]);
}
});
shell.redirectedSpawn(cmd, argList, null, null, true);