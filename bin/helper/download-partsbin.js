var http    = require("http"),
    fs      = require("fs"),
    path    = require("path"),
    util    = require("util"),
    async   = require("async"),
    exec    = require("child_process").exec,
    shelljs = require('shelljs');

var lkDir = process.env.WORKSPACE_LK,
    partsBinCopyURL = "http://lively-web.org/nodejs/PartsBinCopy/",
    zipFile = path.join(lkDir, 'PartsBinCopy.zip'),
    partsBinFolder = path.join(lkDir, 'PartsBin'),
    partsBinExtractionFolder = path.join(lkDir, 'PartsBin_extracted');

function partsBinExists() {
    return fs.existsSync(partsBinFolder);
}

function downloadPartsBin(next) {
    http.get(partsBinCopyURL, function(res) {
        var writeS = fs.createWriteStream(zipFile);
        res.pipe(writeS);
        writeS.on('close', function() { next(null); });
        writeS.on('error', function(e) { console.error(e); next(e); });
    }).on('error', function(e) { next(e); });
}

function extractPartsBin(next) {
    var unzipDir = partsBinExtractionFolder;
    var proc = exec(util.format("unzip -o -q %s -d %s", zipFile, unzipDir),
        {cwd: lkDir, stdio: 'inherit'},
        function(code) { console.log('PartsBin extracted'); next(code); })
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stdout);
}

function movePartsBinExtracted(next) {
    shelljs.mv(path.join(partsBinExtractionFolder, 'PartsBin'), partsBinFolder);
    next();
}

function cleanup(next) {
    shelljs.rm('-f', zipFile);
    shelljs.rm('-rf', partsBinExtractionFolder);
    next();
}

function msg(/*args*/) {
    return function(next) {
        console.log.apply(console, arguments);
        next();
    }
}

function downloadPartsBinIfNecessary(thenDo) {
    console.log('Checking if PartsBin exists...');
    var exists = partsBinExists();
    console.log('...' + (exists ? 'yes' : 'no'));
    if (exists) { thenDo && thenDo(null); return; }
    async.series([
        msg('Please wait, downloading PartsBin...'),
        downloadPartsBin,
        msg('Extracting PartsBin...'),
        extractPartsBin,
        movePartsBinExtracted,
        msg('Cleaning up PartsBin download files...'),
        cleanup,
        msg('PartsBin installed into %s', partsBinFolder)
    ], function(err) {
        err && console.error(err);
        thenDo && thenDo(err);
    });
}

module.exports = downloadPartsBinIfNecessary;
