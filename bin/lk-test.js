/*global require, process*/
var args    = require('./helper/args'),
    shelljs = require('shelljs'),
    path    = require('path'),
    env     = require('./env'),
    spawn   = require('child_process').spawn,
    // FIXME best to refactor run_lively_tests_cli.js and its use of config
    // so we don't have to duplicate stuff here
    config  = require('./testing/config');

// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-

var platformConf      = config.platformConfigs[process.platform],
    supportedBrowsers = Object.keys(platformConf),
    defaultBrowser    = env.LK_TEST_BROWSER,
    options           = args.options([
        ['-h', '--help', 'show this help'],
        ['-w', '--watch [DIR]', 'Run with nodemon and watch for file changes'],
        ['-v', '--verbose', "Print progress and debug information."],
        ['-b', '--browser NAME', "Which browser to use. Options are \""
                               + supportedBrowsers.join('", "')
                               + "\". If not specified then \""
                               + defaultBrowser + "\" is used."],
        ['-n', '--notifier NAME', "Use a system notifier to output results. "
                                + "Currently \"" + env.LK_TEST_NOTIFIER
                                + "\" is supported."],
        ['-m', '--modules NAMES', "Additional modules to load, comma separated"],
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
                             + env.LK_TEST_WORLD_SCRIPT + "\" is used."],
        ['--nodejs', "Runs the nodejs test suite instead of the browser tests"]],
        {},
        "Run the core tests.");

var cmd, argList = [];
if (options.defined("watch")) {
    if (!global.lkDevDependencyExist(env.NODEMON)) process.exit(1);
    cmd = env.NODE_BIN;
    argList.push(env.NODEMON);
    argList.push('--watch');
    var watchDir = typeof options.watch === "string" ? options.watch : env.WORKSPACE_LK;
    console.log("Watching " + watchDir);
    argList.push(watchDir);
} else {
    cmd = env.NODE_BIN;
}

// nodemon needs it relative...
console.log(path.relative(env.PWD || process.cwd(), env.LK_TEST_STARTER));
argList.push([path.relative(env.PWD || process.cwd(), env.LK_TEST_STARTER)]);

['verbose', 'browser', 'notfier', 'display', 'focus', 'testScript', 'modules', 'nodejs'].forEach(function(option) {
    if (!options.defined(option)) return;
    argList.push(options.dasherize(option));
    if (options.hasValue(option)) {
        argList.push(options[option]);
    }
});

var proc = spawn(cmd, argList);
proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stdout);
proc.on('close', function(code) { process.exit(code); })