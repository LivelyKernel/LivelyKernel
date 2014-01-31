var fs           = require("fs"),
    path         = require("path"),
    zlib         = require('zlib'),
    ffuser       = require('file-fuser'),
    directory    = process.env.WORKSPACE_LK || path.resolve(__dirname, '../..'),
    combinedFile = "combined.js",
    fuser;

function determineCoreFiles() {
    // bootstrap.js - libsFile
    var libsFile = 'lib/lively-libs-debug.js';
    // bootstrap.js - bootstrapFiles
    var bootstrapFiles = [
        'lively/Migration.js', 'lively/JSON.js', 'lively/lang/Object.js',
        'lively/lang/Function.js', 'lively/lang/String.js', 'lively/lang/Array.js',
        'lively/lang/Number.js', 'lively/lang/Date.js', 'lively/lang/Worker.js',
        'lively/lang/LocalStorage.js', 'lively/defaultconfig.js', 'lively/Base.js',
        'lively/ModuleSystem.js'
    ];
    // bootstrap.js - bootstrapModules
    var bootstrapModules = ['lively.ChangeSets', 'lively.lang.Closure', 'lively.lang.UUID', 'lively.bindings', 'lively.Main'];
    // defaultconfig.js - modulesBeforeWorldLoad
    bootstrapModules.push('lively.morphic.HTML');
    // defaultconfig.js - modulesOnWorldLoad
    bootstrapModules.push('lively.ide', 'lively.IPad', 'lively.net.SessionTracker', 'lively.net.Wiki', 'lively.ChangeSets');

    function moduleToFile(module) {
        var relFile = module.replace(/\./g, '/') + '.js';
        var absFile = path.join(directory, relFile);
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

(function setup() {
    // if the combined file exists when we are starting then delete it. This
    // way we make sure that we pick up changes that happended while the server
    // wasn't running
    var combinedFilePath = path.join(directory, combinedFile);
    if (fs.existsSync(combinedFilePath)) fs.unlinkSync(combinedFilePath);

    // FIXME!!! Currently some coreFiles have absolute paths, make them relative here
    var coreFiles = determineCoreFiles().map(function(fn) {
        return fn.indexOf(directory) === 0 ?
            fn.replace(new RegExp(directory + '[\/\\\\]?'), '') : fn;
    });

    // Start the file fuser that takes care of watching the core files,
    // generating the combinedFile from them and provides a hash for it
    ffuser({
        baseDirectory: directory,
        files: coreFiles,
        combinedFile: combinedFile
    }, function(err, _fuser) { global.fuser = fuser = _fuser; });
})();

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

    app.get('/generated/:hash/combinedModules.js', function(req, res) {
        if (!fuser) {
            res.status(500).end(String('file-fuser could not be started'));
            return;
        }
        // FIXME get hash and file stream together, getting those seperately
        // requires two file reads
        fuser.withHashDo(function(err, hash) {
            if (err) { res.status(500).end(String(err)); return; }
            if (req.headers['if-none-match'] === hash) {
                res.status(304); res.end(); return;
            }
            fuser.withCombinedFileStreamDo(function(err, stream) {
                if (err) { res.status(500).end(String(err)); return; }
                var oneYear = 1000*60*60*24*30*12;
                var acceptEncoding = req.headers['accept-encoding'] || '',
                    header = {
                        'Content-Type': 'application/javascript',
                        'Expires': new Date(Date.now() + oneYear).toGMTString(),
                        "Cache-Control": "public",
                        'ETag': hash
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
    });
}
