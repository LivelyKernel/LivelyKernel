/*global exports, require, console, process, __dirname*/

var fs = require('fs'),
    path = require('path'),
    Seq = require('seq'),
    env = process.env;

function relToRoot(dirInRoot) {
    return path.relative(env.LK_SCRIPTS_ROOT, env.LK_SCRIPTS_ROOT + dirInRoot);
}

/*
 * general stuff
 */
env.LK_SCRIPTS_ROOT = path.normalize(__dirname + '/..');
env.NODEMODULES     = env.NODEMODULES || relToRoot("/node_modules");
env.QUNIT           = env.QUNIT       || env.NODEMODULES + "/qunit/bin/cli.js";
env.NODEMON         = env.NODEMON     || env.NODEMODULES + "/nodemon/nodemon.js";
env.FOREVER         = env.FOREVER     || env.NODEMODULES + "/forever/bin/forever";

/*
 * server related stuff
 */
env.MINISERVER_DIR  = env.MINISERVER_DIR  || env.LK_SCRIPTS_ROOT + "/minimal_server";
env.MINISERVER_PORT = env.MINISERVER_PORT || 9001;
env.MINISERVER      = env.MINISERVER_DIR + "/serve.js";

/*
 * tests
 */
env.MINISERVER_TEST_FILES = env.MINISERVER_DIR + '/*_test.js';
env.LK_TEST_SCRIPT_DIR    = env.LK_SCRIPTS_ROOT + '/testing';
env.LK_TEST_STARTER       = env.LK_TEST_SCRIPT_DIR + '/run_lively_tests_cli.js';


/*
 * jshint
 */
env.JSHINT        = env.JSHINT        || env.LK_SCRIPTS_ROOT + "/node_modules/jshint/bin/hint";
env.JSHINT_CONFIG = env.JSHINT_CONFIG || env.LK_SCRIPTS_ROOT + "/jshint.config";
