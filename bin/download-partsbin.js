var http = require("http"),
    fs = require("fs"),
    path = require("path"),
    util = require("util"),
    async = require("async"),
    exec = require("child_process").exec,
    shelljs = require('shelljs');

var lkDir = process.env.WORKSPACE_LK;
var partsBinCopyURL = "http://lively-web.org/nodejs/PartsBinCopy/";
var zipFile = path.join(lkDir, 'PartsBinCopy.zip');
var partsBinFolder = path.join(lkDir, 'PartsBin')
var partsBinExtractionFolder = path.join(lkDir, 'PartsBin_extracted')

function partsBinExists() {
    return fs.existsSync(partsBinFolder);
}

function downloadPartsBin(next) {
    http.get(partsBinCopyURL, function(res) {
        console.log('Please wait, downloading PartsBin...');
        var writeS = fs.createWriteStream(zipFile);
        res.pipe(writeS);
        writeS.on('close', function() { next(null); });
        writeS.on('error', function(error) { next(error); });
    }).on('error', function(e) { next(e); });
}

function extractPartsBin(next) {
    var unzipDir = partsBinExtractionFolder;
    var proc = exec(util.format("unzip -q %s -d %s", zipFile, unzipDir),
        {cwd: lkDir, stdio: 'inherit'},
        function(code) { console.log('PartsBin extracted'); next(code); })
    proc.stdout.pipe(process.stdout);
}

function movePartsBinExtracted(next) {
    console.log('moving partsbin into place');
    shelljs.mv(path.join(partsBinExtractionFolder, 'PartsBin'), partsBinFolder);
    next();
}

function cleanup(next) {
    console.log('cleaning up PartsBin download files');
    shelljs.rm('-f', zipFile);
    shelljs.rm('-rf', partsBinExtractionFolder);
    next();
}

function downloadPartsBinIfNecessary(thenDo) {
    console.log('Checking if PartsBin exists...');
    var exists = partsBinExists();
    console.log('...' + (exists ? 'yes' : 'no'));
    if (exists) { thenDo && thenDo(null); return; }
    async.series([
        downloadPartsBin,
        extractPartsBin,
        movePartsBinExtracted,
        cleanup
    ], function(err) {
        err && console.error(err);
        thenDo && thenDo(err);
    });
}

module.exports = downloadPartsBinIfNecessary;
