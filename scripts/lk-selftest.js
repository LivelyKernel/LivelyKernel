/*global require, process*/
var args = require('./helper/args'),
    shell = require('./helper/shell'),
    path = require('path'),
    async = require('async'),
    env = process.env;

// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-

var options = args.options([
        ['-h', '--help', 'show this help']], {},
        "lk selftest: Run the script and server tests.");

function qunitRun(spec, callback) {
    var args = ['--code', (spec.scope ? spec.scope : "") + spec.code, '--tests', spec.test];
    shell.redirectedSpawn(env.QUNIT, args, callback, null, true);
}

// -=-=-=-=-=-=-=-=-=-=-
// run tests with quint
// -=-=-=-=-=-=-=-=-=-=-
// FIXME best to use something else then qunit
// tests are complicated to run and output is ugly
async.series([
    qunitRun.bind(null, {
        code: env.MINISERVER,
        test:env.MINISERVER_DIR + '/serve_test.js'}),
    qunitRun.bind(null, {
        code: path.join(env.LK_SCRIPTS_ROOT, '/scripts/lk.js'),
        test: path.join(env.LK_SCRIPTS_ROOT, '/scripts/lkTest.js'),
        scope: 'lk:'}),
    qunitRun.bind(null, {
        code: path.join(env.LK_SCRIPTS_ROOT, "/webwerkstatt_integration/diffReporter.js"),
        test: path.join(env.LK_SCRIPTS_ROOT, "/webwerkstatt_integration/diffReporterTest.js")})
]);
