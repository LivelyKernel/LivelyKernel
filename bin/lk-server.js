/*global require, process, __dirname*/
var path             = require('path'),
    fs               = require('fs'),
    exec             = require('child_process').exec,
    checkNPMPackages = require("./helper/check-modules"),
    env              = require('./env'),
    args             = require('./helper/args'),
    cmdAndArgs       = [];

/*
 * This script starts up a node.js server for lively. The server itself is
 * implemented in the life_star module.
 * Note that we check node_module dependencies in this script (comparing the
 * package.json and node_modules folder). When you edit this script please keep
 * in mind that we cannot rely on external modules being available Until this
 * has happened!
 */

// -=-=-=-=-=-=-=-=-=-=-
// script options
// -=-=-=-=-=-=-=-=-=-=-
var options = args.options([
    ['-h', '--help', 'Show this help.'],
    ['-p', '--port NUMBER', "On which port to run."],
    [      '--log-level STRING', 'Log level, accepted values: error, warning, info, debug.'],
    [      '--lk-dir DIR', 'The directory of the Lively Kernel core repository (git).'],
    [      '--db-config JSON', 'Stringified JSON object that configures the object DB and lively-davfs\n'
    + "                                 like {\n"
    + '                                   includedFiles: [STRING],\n'
    + '                                   excludedDirectories: [STRING],\n'
    + '                                   excludedFiles: [STRING],\n'
    + '                                   dbFile: [STRING], -- path to db file\n'
    + '                                   resetDatabase: [BOOL]\n'
    + '                                 }'],
    [      '--behind-proxy', 'Add this option if requests going to the server are '
                           + 'proxied by another server, e.g. Apache'],
    [      '--enable-ssl', 'Enable https server.'],
    [      '--enable-ssl-client-auth', 'Whether to use authentication via SSL client certificate.'],
    [      '--ssl-server-key FILE', 'Where the server key is located.'],
    [      '--ssl-server-cert FILE', 'Where the server certificate is located.'],
    [      '--ssl-ca-cert FILE', 'Where the CA certificate is located.'],
    [      '--info', 'Print whether there is a running server on '
                   + 'the specified port or ' + env.LIFE_STAR_PORT
                   + ' and the process pid.'],
    [      '--kill', 'Stop the server process for the specified port or ' + env.LIFE_STAR_PORT
                   + ' if there exist one.'],
    [      '--no-subservers', 'By default servers in ' + env.WORKSPACE_LK
                            + ' are started with the core server. Setting this option'
                            + ' disables this behavior.'],
    [      '--subserver STRING', 'Add a subserver, expects filesystem path to js file like '
                               + '"foo/bar.js" to start subserver bar. Aliasing supported via '
                               + '"baz:foo/bar.js" to start subserver bar.js as baz.'],
    [      '--use-manifest', 'Enables the creation of manifest file for application cache.']],
    {},
    "Starts a Lively Kernel server.");

var port = options.port || env.LIFE_STAR_PORT,
    host = env.LIFE_STAR_HOST,
    subservers = {};

if (!options.lkDir && env.WORKSPACE_LK_EXISTS) {
    options.lkDir = env.WORKSPACE_LK || path.resolve(__dirname, "..");
} else {
    env.WORKSPACE_LK = options.lkDir;
}

if (!options.defined('lkDir')) {
    console.log("Cannot find the Lively core repository. "
               + "Please start the server with --lk-dir PATH/TO/LK-REPO");
}

var dbConfig;
if (options.defined('dbConfig')) {
    dbConfig = options.dbConfig;
}

if (!options.defined('noSubservers')) {
    var lkSubserverDir = path.join(options.lkDir, "core/servers");
    try {
        var fileList = fs.readdirSync(lkSubserverDir);
        fileList.forEach(function(name) {
            if (!name.match(/.js$/)) return;
            subservers[name.slice(0, -3)] = path.join(lkSubserverDir, name);
        });
    } catch(e) {
        console.warn('Problems finding subservers in %s: %s', lkSubserverDir, e);
    }
}

if (!options.defined('noSubservers') && options.defined('subserver')) {
    // read multiple --subserver STRING args
    // STRING can be name:path or just path
    for (var i = 0; i < process.argv.length; i++) {
        if (process.argv[i] !== '--subserver') continue;
        var spec = process.argv[i+1];
        if (!spec) continue;
        var nameAndPath = spec.split(':'), name, file;
        if (nameAndPath.length === 2) {
            name = nameAndPath[0];
            file = nameAndPath[1];
        } else {
            file = nameAndPath[0];
            name = file.substring(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
        }
        subservers[name] = file;
    }
}

// -=-=-=-=-=-=-=-=-=-=-=-
// Dealing with processes
// -=-=-=-=-=-=-=-=-=-=-=-
var pidFile = path.join(env.SERVER_PID_DIR, 'server.' + port + '.pid');

function removePidFile() {
    try { fs.unlink(pidFile); } catch(e) {}
}

function writePid(proc, callback) {
    if (!proc.pid) { callback(); return; }
    fs.exists(env.SERVER_PID_DIR, function(exists) {
        fs.mkdir(env.SERVER_PID_DIR, function(err) {
            if (err) callback(err);
            fs.writeFile(pidFile, String(proc.pid), callback);
        });
    });
}

function readPid(callback) {
    fs.readFile(pidFile, function(err, data) { callback(null, data); });
}

function isPidInOutput(pid, out, callback) {
    var lines = out.split('\n'),
        regexp = new RegExp(pid),
        result = lines.some(function(line) { return regexp.test(line); });
    callback(null, result, pid);
}

function processExists(pid, callback) {
    if (!pid || !pid.length) { callback({err: 'No pid'}); return; }
    var isWindows = /^win/i.test(process.platform),
        cmd = isWindows ? 'tasklist.exe' : 'ps -A';
    exec(cmd, {}, function(code, out, err) {
        isPidInOutput(pid, out || '', callback); });
}

function getServerInfo(callback) {
    readPid(function(err, pid) {
        if (err) { callback(err); return; }
        processExists(pid, function(err, isAlive) {
            callback(null, {alive: err ? false : isAlive, pid: String(pid)});
        });
    });
}

function killOldServer(infoAboutOldServer, callback) {
    if (infoAboutOldServer.alive) {
        console.log('Stopping lk server process with pid ' + infoAboutOldServer.pid);
        try { process.kill(infoAboutOldServer.pid); } catch(e) {}
    }
    callback();
}

function startServer(callback) {
    require("life_star")({
        host:                host,
        port:                port,
        fsNode:              options.lkDir, // LivelyKernel directory to serve from
        dbConf:              options.dbConfig, // lively-davfs
        enableTesting:       env.LIFE_STAR_TESTING  === 'testing',
        logLevel:            options.logLevel || env.LIFE_STAR_LOG_LEVEL, // log level for logger: error, warning, info, debug
        behindProxy:         options.defined('behindProxy'),
        subservers:          subservers || null,
        useManifestCaching:  options.defined('useManifest'),
        enableSSL:           options.defined('enableSsl'),
        enableSSLClientAuth: options.defined('enableSsl') ? options.defined('enableSslClientAuth') : false,
        sslServerKey:        options.defined('enableSsl') ? options.sslServerKey : null,
        sslServerCert:       options.defined('enableSsl') ? options.sslServerCert : null,
        sslCACert:           options.defined('enableSsl') ? options.sslCaCert : null
    });
    console.log("Server with pid %s is now running at %s://%s:%s",
                process.pid, options.defined('enableSsl') ? 'https' : 'http', host, port);
    console.log("Serving files from " + options.lkDir);
    callback(null, process);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-
// This is where we do stuff
// -=-=-=-=-=-=-=-=-=-=-=-=-

if (options.defined('info')) {
    getServerInfo(function(err, info) {
        console.log(info ? JSON.stringify(info) : '{}');
    });
} else if (options.defined('kill')) {
    var onError = function(err) {
        console.error('Error stopping server: %s', err);
    };
    getServerInfo(function(err, serverInfo) {
        if (err) onError(err);
        else killOldServer(serverInfo, function(err) {
            if (err) onError(err);
            else console.log('server stopped %s', serverInfo);
        });
    });
} else {
    // let it fly!
    checkNPMPackages(function(err) {
        if (err) { console.error('error on server start: %s', err); return; }
        require("async").waterfall([
            require("./helper/download-partsbin.js"),
            getServerInfo,
            killOldServer, // Ensure that only one server for the given port is running
            startServer,
            writePid
        ], function(err) {
            if (err) console.error('Error starting Lively server: %s', err);
            else console.log('Lively server starting...');
        });
    });
}
