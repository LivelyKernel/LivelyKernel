/*global exports, require, console, process, __dirname*/

var fs        = require('fs'),
    path      = require('path'),
    env       = process.env,
    isWindows = /^win/i.test(process.platform);

function which(command) {
    var _which;
    try {
        _which = require('shelljs').which;
    } catch(e) {
        // no shelljs available
        _which = function(command) {
            // find the full path to the argument command, e.g. which("node") ->
            // /usr/bin/node. This works synchronously by busy-waiting on a result
            // file. (The sleepfile trick below is taken from shelljs, apparently this
            // is as CPU-friendly as it gets)
            var util            = require("util"),
                exec            = require("child_process").exec,
                whichOutputFile = "which_output",
                sleepFile       = "which_sleep",
                output = '';
            try {
                if (fs.existsSync(whichOutputFile)) fs.unlinkSync(whichOutputFile);
                var execWhich = util.format("which %s > %s", command, whichOutputFile);
                exec(execWhich);
                while (!fs.existsSync(whichOutputFile))
                    fs.writeFileSync(sleepFile, 'sleeeeeep');
                output = String(fs.readFileSync(whichOutputFile)).trim();
            } finally {
                var timeout = 2*1000, start = Date.now();
                (function cleanup() {
                    try {
                        fs.existsSync(sleepFile) && fs.unlinkSync(sleepFile);
                        fs.existsSync(whichOutputFile) && fs.unlinkSync(whichOutputFile);
                    } catch(e) {
                        if (Date.now() - start < timeout) cleanup();
                        else console.error(e);
                    }
                })();
            }
            return output;
        };
    }
    return _which(command);
}

function join(pathA, pathB) {
    pathA = pathA || ''; pathB = pathB || '';
    return path.join(pathA, pathB);
}

function lkCoreDir(dirInRoot) {
    return path.normalize(join(env.LK_CORE_DIR, dirInRoot));
}

function set(varName, choices, options) {
    var isValid = options && options.notFs ? function(c) { return !!c; } : fs.existsSync;
    if (env[varName]) choices.unshift(env[varName]); // already set?
    for (var i = 0; i < choices.length; i++) {
        if (isValid(choices[i])) { return env[varName] = choices[i]; }
    }
    if (options && options.useLastIfNothingIsValid && choices.length > 0) {
        env[varName] = choices[choices.length-1];
    }
    return env[varName];
}

/*
 * general stuff
 */
set("LK_CORE_DIR",     [path.normalize(__dirname + '/..')]);
set("NODE_BIN",        [which('node'), which('nodejs'), which('node.exe'), process.execPath]);
set("NODEMODULES",     [lkCoreDir("/node_modules"), join(env.LK_CORE_DIR, '..')]);
set("TEMP_DIR",        [env.TMP, env.TEMP, env.TEMPDIR, '/tmp'], {useLastIfNothingIsValid: true});

/*
 * server related stuff
 */
set("LIFE_STAR_PORT",      [9001], {notFs: true});
set("LIFE_STAR_HOST",      ["localhost"], {notFs: true});
// replace with "notesting" to disable test runner interface on server
set("LIFE_STAR_TESTING",   ["testing"], {notFs: true});
// be very chatty about what is going on
set("LIFE_STAR_LOG_LEVEL", ["debug"], {notFs: true});

/*
 * tests
 */
set("LK_TEST_WORLD_NAME",    ["run_tests"], {notFs: true});
set("LK_TEST_WORLD_SCRIPT",  ["run_tests.js"], {notFs: true});
set("LK_TEST_BROWSER",       ["chrome"], {notFs: true});
set("LK_TEST_TIMEOUT",       [300], {notFs: true});
set("LK_TEST_NOTIFIER",      ["growlnotify"], {notFs: true});

/*
 * web-browser related
 */
set("CHROME_BIN",            [which('chrome'), which('chromium-browser'), which('google-chrome'),
                              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                              "/Applications/Chromium.app/Contents/MacOS/Chromium",
                              "/usr/bin/chromium-browser",
                              join(env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
                              join(env.ProgramFiles, 'Google/Chrome/Application/chrome.exe'),
                              join(env['ProgramFiles(x86)'], 'Google/Chrome/Application/chrome.exe')]);
set("FIREFOX_BIN",            [which('firefox'),
                              "/Applications/Firefox.app/Contents/MacOS/firefox",
                              "/usr/bin/firefox",
                               join(env['ProgramFiles(x86)'], 'Mozilla Firefox', 'firefox.exe'),
                               join(env.ProgramFiles, 'Mozilla Firefox', 'firefox.exe')]);

/*
 * workspace
 */
set("WORKSPACE_LK",  [env.LK_CORE_DIR], {useLastIfNothingIsValid: true});
set("WORKSPACE_LK_EXISTS", [fs.existsSync(env.WORKSPACE_LK)], {notFs: true});
set("SERVER_PID_DIR", [env.LK_CORE_DIR], {useLastIfNothingIsValid: true});

/*
 * PartsBin
 */
set("PARTSBIN_DIR", [join(env.LK_CORE_DIR, 'PartsBin/')], {useLastIfNothingIsValid: true});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/** <DEPRECATED> */
/**/function lkScriptDir(dirInRoot) {
/**/    return path.normalize(join(env.LK_SCRIPTS_ROOT, dirInRoot));
/**/}
/**/set("LK_SCRIPTS_ROOT", [env.LK_CORE_DIR]);
/**/set("LK_SCRIPTS_DIR",  [lkScriptDir("/scripts")]);
/**/set("NODEUNIT",        [join(env.NODEMODULES, "nodeunit/bin/nodeunit"),
/**/                            which('nodeunit')]);
/**/set("NODEMON",         [join(env.NODEMODULES, "nodemon/nodemon.js"),
/**/                            which('nodemon')]);
/**/set("FOREVER",         [join(env.NODEMODULES, "forever/bin/forever"),
/**/                            which('forever')]);
/**/set("LIFE_STAR",           [join(__dirname, "serve.js")]);
/**/set("LK_TEST_STARTER",       [join(__dirname, 'testing/lively_test.js')]);
/**/set("JSHINT",        [join(env.LK_SCRIPTS_ROOT, "node_modules/jshint/bin/hint"), which('jshint')]);
/**/set("JSHINT_CONFIG", [join(env.LK_SCRIPTS_ROOT, "jshint.config")]);
/**/set("WORKSPACE_DIR", [lkScriptDir('/workspace')], env.LK_SCRIPTS_ROOT, {useLastIfNothingIsValid: true});
/**/set("LK_BIN",          [join(env.LK_CORE_DIR, isWindows ? 'bin/lk.cmd' : 'bin/lk')]);
/** </DEPRECATED> */

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/*
 * This is used to test prerequisites and show warnings
 */
var installCmd = "cd " + env.LK_CORE_DIR + " && npm install";
global.lkDevDependencyExist = function(path) {
    if (fs.existsSync(path)) return true;
    console.warn("The dev dependency " + path + " was not found, please run\n\n" + installCmd);
    return false;
};

global.lazyRequire = function lazyRequire(path) {
    try {
        return require(path);
    } catch(e) {
        console.warn("module " + path + " not installed, install it by running\n\n" + installCmd);
        return null;
    }
};

module.exports = env;
