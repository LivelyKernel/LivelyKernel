/*global exports, require, console*/

var fs = require('fs'),
    path = require('path'),
    Seq = require('seq'),
    env = process.env;

/*
 * general stuff
 */
env.LK_SCRIPTS_ROOT = __dirname + '/..';
env.NODEMODULES     = env.NODEMODULES || env.LK_SCRIPTS_ROOT + "/node_modules";
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
env.LK_TEST_SCRIPT_DIR    = env.LK_SCRIPTS_ROOT + '/testing/';


/*
 * jshint
 */
// for some reason NODEMON has a problem whe jshint is referenced with a absolute path
// like env.NODEMODULES + "/jshint/bin/hint", so we use a reative path here although
// this makes the script more brittle
env.JSHINT        = env.JSHINT        || "../node_modules/jshint/bin/hint";
env.JSHINT_CONFIG = env.JSHINT_CONFIG || env.LK_SCRIPTS_ROOT + "/jshint.config";
