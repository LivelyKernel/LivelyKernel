var fs = require("fs");
var path = require("path");
var zlib = require('zlib');
var ffuser = require('file-fuser');

var coreFiles = determineCoreFiles();
var dir = process.env.WORKSPACE_LK;
var combinedFile = "combined.js"
var fuser;

function determineCoreFiles() {
    // bootstrap.js - libsFile
    var libsFile = 'core/lib/lively-libs-debug.js';
    // bootstrap.js - bootstrapFiles
    var bootstrapFiles = [
        'core/lively/Migration.js', 'core/lively/JSON.js', 'core/lively/lang/Object.js',
        'core/lively/lang/Function.js', 'core/lively/lang/String.js', 'core/lively/lang/Array.js',
        'core/lively/lang/Number.js', 'core/lively/lang/Date.js', 'core/lively/lang/Worker.js',
        'core/lively/lang/LocalStorage.js', 'core/lively/defaultconfig.js', 'core/lively/Base.js',
        'core/lively/ModuleSystem.js'
    ];
    // bootstrap.js - bootstrapModules
    var bootstrapModules = ['lively.ChangeSets', 'lively.lang.Closure', 'lively.lang.UUID', 'lively.bindings', 'lively.Main'];
    // defaultconfig.js - modulesBeforeWorldLoad
    bootstrapModules.push('lively.morphic.HTML');
    // defaultconfig.js - modulesOnWorldLoad
    bootstrapModules.push('lively.ide', 'lively.IPad', 'lively.net.SessionTracker', 'lively.net.Wiki', 'lively.ChangeSets');

    function moduleToFile(module) {
        // TODO: Adapt module load logic
        var absDir = dir || './';
        var relFile = 'core/' + module.replace(/\./g, '/') + '.js';
        var absFile = path.join(absDir, relFile);
        if (fs.existsSync(absFile))
            return absFile;
        relFile = module.replace(/\./g, '/') + '.js';
        absFile = path.join(absDir, relFile);
        return absFile;
    }

    var coreFiles = bootstrapModules.map(moduleToFile).reverse();

    var i = 0;
    var dependencies = {};
    while (i < coreFiles.length) {
        var filename = coreFiles[i];
        if (dependencies[filename]) {
            dependencies[filename].forEach(function(dep) {
                coreFiles.splice(i + 1, 0, dep);
            });
            i++;
            continue;
        }
        dependencies[filename] = [];
        try {
            var content = fs.readFileSync(filename).toString();
            // FIXME: do real parsing, evil eval
            var modRegEx = /module\((.*?)\)\.requires\((.*?)\)./g;
            var moduleDefs = modRegEx.exec(content);
            if (moduleDefs) {
                var req = eval('[' + moduleDefs[2] + ']');
                var deps = dependencies[filename];
                req.forEach(function(module) {
                    var filename = moduleToFile(module);
                    coreFiles.splice(i + 1, 0, filename);
                    deps.push(filename);
                });
            }
        } catch (e) {
            console.log('Problems processing: ' + filename);
        }
        i++;
    }

    // remove duplicates
    coreFiles = coreFiles.reverse().reduce(function(res, file) {
        if (res.indexOf(file) == -1) res.push(file);
        return res;
    }, []);

    coreFiles = [libsFile].concat(bootstrapFiles).concat(coreFiles);
    return coreFiles;
}

ffuser({
    baseDirectory: dir,
    files: coreFiles,
    combinedFile: combinedFile
}, function(err, _fuser) { global.fuser = fuser = _fuser; });

module.exports = function(route, app) {

    app.get('/generated/combinedModulesHash.txt', function(req, res) {
        if (!fuser) {
            res.status(500).end(String('file-fuser could not be started'));
            return;
        }
        fuser.withHashDo(function(err, hash) {
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(hash);
        });
    });

    app.get('/generated/combinedModules.js', function(req, res) {
        if (!fuser) {
            res.status(500).end(String('file-fuser could not be started'));
            return;
        }
        fuser.withCombinedFileStreamDo(function(err, stream) {
            if (err) { res.status(500).end(String(err)); return; }
            var acceptEncoding = req.headers['accept-encoding'] || '',
                header = {
                    // indefinitely?
                    "Cache-Control": "max-age=" + 60/*secs*/*60/*mins*/*24/*h*/*30/*days*/
                }
            if (acceptEncoding.match(/\bdeflate\b/)) {
                header['content-encoding'] = 'deflate';
                stream = stream.pipe(zlib.createDeflate());
            } else if (acceptEncoding.match(/\bgzip\b/)) {
                header['content-encoding'] = 'gzip';
                stream = stream.pipe(zlib.createGzip());
            }
            res.writeHead(200, header);
            stream.pipe(res);
        });
    });
}
