function checkNPMPackages() {
    var path = require("path");
    var exec = require("child_process").exec;
    var fs = require("fs");
    var lkDir = path.join(__dirname, '..')

    function findMissingNPMPackages() {
        var packageJson = path.join(lkDir, "package.json");
        var packageJsonContent = fs.readFileSync(packageJson);
        var packageJso = JSON.parse(packageJsonContent);
        var requiredDepNames = Object.keys(packageJso.dependencies);

        var nodeModulesDir = path.join(lkDir, "node_modules");
        var actualDepNames = fs.readdirSync(nodeModulesDir);

        var uninstalled = requiredDepNames.reduce(function(reqDeps, name) {
            if (actualDepNames.indexOf(name) == -1) reqDeps.push(name);
            return reqDeps;
        }, []);

        return uninstalled;
    }

    function installAll(pkgNames, thenDo) {
        if (!pkgNames.length) { thenDo(null); return; }
        var pkgName = pkgNames.pop();
        console.log("Installing package %s...", pkgName);
        install(pkgName, function(code, out, err) {
            if (code) {
                console.warn('Problem installing npm package %s:\n%s\n%s', pkgName, out, err);
            } else {
                console.log("Package %s successfully installed.", pkgName);
            }
            installAll(pkgNames, thenDo);
        });
    }

    function install(pkgName, thenDo) {
        exec("npm install " + pkgName, {cwd: lkDir}, thenDo);
    }


    var missingPackages = findMissingNPMPackages();
    if (!missingPackages || !missingPackages.length) return true;
    console.log('Not all required npm packages are installed! Installing packages %s', missingPackages);
    console.log('Please wait until the packages are installed and then restart the server.');
    installAll(missingPackages, function(err) { process.exit(0); });
    return false;
}

if (checkNPMPackages()) {

/*global require, process*/
var args = require('./helper/args'),
    async = require('async'),
    spawn = require('child_process').spawn,
    shelljs = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    env = require('./env'),
    life_star = require('life_star'),
    cmdAndArgs = [];

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
    options.lkDir = env.WORKSPACE_LK;
} else {
    env.WORKSPACE_LK = options.lkDir;
}

if (!options.defined('lkDir')) {
    console.log("Cannot find the Lively core repository. "
               + "Please start the server with --lk-dir PATH/TO/LK-REPO")
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
    try { fs.unlink(pidFile) } catch(e) {}
}

function writePid(proc, callback) {
    shelljs.mkdir('-p', env.SERVER_PID_DIR);
    if (proc.pid) { fs.writeFileSync(pidFile, String(proc.pid)); }
    callback();
}

function readPid(callback) {
    fs.readFile(pidFile, function(err, data) { callback(null, data); });
}

function isPidInOutput(pid, out, callback) {
    var lines = out.split('\n'),
        regexp = new RegExp(pid),
        result = lines.some(function(line) { return regexp.test(line) });
    callback(null, result, pid);
}

function processExists(pid, callback) {
    if (!pid || !pid.length) { callback({err: 'No pid'}); return; }
    var isWindows = /^win/i.test(process.platform),
        cmd = isWindows ? 'tasklist.exe' : 'ps -A';
    shelljs.exec(cmd, {async: true, silent: true}, function(err, data) {
        isPidInOutput(pid, data || '', callback);
    });
}

function getServerInfo(callback) {
    async.waterfall([
        readPid,
        processExists
    ], function(err, isAlive, pid) {
        if (err) isAlive = false;
        var info = {alive: isAlive, pid: String(pid)};
        callback(null, info);
    });
}

function killOldServer(infoAboutOldServer, callback) {
    if (infoAboutOldServer.alive) {
        console.log('Stopping lk server process with pid ' + infoAboutOldServer.pid);
        try { process.kill(infoAboutOldServer.pid) } catch(e) {}
    }
    callback();
}

function startServer(callback) {
    life_star({
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
    async.waterfall([getServerInfo, killOldServer]);
} else {
    // let it fly!
    async.waterfall([
        getServerInfo,
        killOldServer, // Ensure that only one server for the given port is running
        startServer,
        writePid
    ]);
}

}
