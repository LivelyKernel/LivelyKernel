/*global require, process, __dirname*/

var path     = require("path"),
    util     = require("util"),
    fs       = require("fs"),
    zlib         = require('zlib'),
    url      = require("url"),
    crypto   = require("crypto"),
    concat = require("/home/lively/lively-web.org/data/LivelyKernel/node_modules/file-fuser/node_modules/source-map-concat"),
    babel = require("babel-core"),
    lang = require("lively.lang"),
    rootDir = process.env.WORKSPACE_LK || path.resolve(__dirname, '../..'),
    relWorkDir = ".optimized-loading-cache",
    workDir = path.join(rootDir, relWorkDir),
    combinedFile = path.join(workDir, "combined.js"),
    combinedHashFile = path.join(workDir, "combined.js.hash");


var _combinedFileAndHashCached = null;
function combinedFileAndHashCached() {
  // combinedFileAndHashCached().then(x => console.log(x)).catch(err => console.error(err))
  return _combinedFileAndHashCached ?
    Promise.resolve(_combinedFileAndHashCached) : 
    combinedFileAndHash().then(result => {
      _combinedFileAndHashCached = result;
      setTimeout(() => _combinedFileAndHashCached = null, 500);
      return result;
    });
}

function combinedFileAndHash() {
  // require("child_process").exec("rm " + workDir + "/*")
  // require("child_process").exec("rm -rf /home/lively/lively-web.org/data/LivelyKernel/.optimized-loading-cache/node_modules_lively.lang_lib_promise.js*")
  // require("child_process").exec("rm -rf /home/lively/lively-web.org/data/LivelyKernel/.optimized-loading-cache/combined.js*")
  // require("child_process").exec("rm -rf /home/lively/lively-web.org/data/LivelyKernel/.optimized-loading-cache/*")
  // combinedFileAndHash().then(x => console.log(x)).catch(err => console.error(err))
  var files = coreFiles(process.env.WORKSPACE_LK);
  return lang.promise.chain([
    () => lang.promise(fs.mkdir)(workDir).catch(x => {}),
    () => concatAndWrite(files, rootDir, workDir, combinedFile, new Date()),
    (concatResult) => concatResult.wasChanged ?
                        computeHash(combinedFile) :
                        String(fs.readFileSync(combinedHashFile)),
    (hash) => ({hash: hash, file: combinedFile})
  ]);
}


function prepareFileForConcat(rootDir, cacheDir, file) {
  // var x = prepareFileForConcat(rootDir, workDir, files[1])
  // x.then((arg) => console.log(arg))
  
  return new Promise((resolve, reject) => {
    var babelExceptions = ['core/lib/lively-libs-debug.js'];
    var cacheFile = path.join(cacheDir, file.replace(/\//g, "_"));
    var mtimeFile = cacheFile + ".mtime";
    
    var mtime = String(fs.statSync(file).mtime),
        needsUpdate = !fs.existsSync(cacheFile)
                   || !fs.existsSync(mtimeFile)
                   || mtime !== String(fs.readFileSync(mtimeFile));
    var source;

    if (needsUpdate) {
      console.log(file + " needs update");
      source = babelExceptions.indexOf(file) > -1 ?
        fs.readFileSync(file) :
        babel.transformFileSync(file, {"presets": ["es2015"]}).code;
      fs.writeFileSync(cacheFile, source);
      fs.writeFileSync(mtimeFile, mtime);
    }
    
    // return Promise.resolve({file: file, cacheFile: cacheFile, mtime: mtime});
    resolve({source: file, code: source && String(source), sourcesRelativeTo: rootDir.replace(/\/$/, "/"), cacheFile: cacheFile, wasChanged: !!source});
  });
}

function concatAndWrite(files, rootDir, workDir, targetFilePath, time) {
  // files - list of files to concat
  // rootDir - dir to start to look for files from
  // targetFilePath like combined.js
  // jsmFilePath like combined.js.jsm

  // concat needs spec per file like
  // {source: pathToFile, code: STRING, sourcesRelativeTo: STRING}

  return Promise.all(files.map(f => prepareFileForConcat(rootDir, workDir, f)))
    .then((filesForConcat) => {
      var changed = filesForConcat.some(ea => ea.wasChanged);
      if (!changed && fs.existsSync(combinedFile) && fs.existsSync(combinedHashFile)) {
        return {file: combinedFile, wasChanged: false};
      }
      
      return lang.promise.chain([
        () => Promise.all(filesForConcat.map(ea => ea.code ? ea : lang.obj.merge(ea, {code: String(fs.readFileSync(ea.cacheFile))}))),
        (filesForConcat) => concat(filesForConcat, {delimiter: "\n", mapPath: targetFilePath + ".jsm"}),
        (concatenated) => {
          concatenated.prepend(createHeader(time, files));
          var result = concatenated.toStringWithSourceMap({file: path.basename(targetFilePath)});
          return lang.promise(fs.writeFile)(targetFilePath, result.code);
        },
        // () => console.log(targetFilePath + " written"),
        () => ({file: targetFilePath, wasChanged: true})
      ]);
    });
}

function createHeader(timestamp, files) {
  return util.format('// This file was generated on %s\n\n'
                   + 'JSLoader.expectToLoadModules([%s]);\n\n',
                     timestamp.toGMTString(),
                     files.map(function(fn) { return "'" + fn + "'" }));
}


function computeHash(combinedFile) {
  return new Promise((resolve, reject) => {
    var md5sum = crypto.createHash('md5'), hash;
    md5sum.setEncoding('hex');
    md5sum.on('data', (d) => hash = String(d));
    md5sum.on('error', (err) => reject(err));
    md5sum.on('end', () => resolve(hash));
    fs.createReadStream(combinedFile).pipe(md5sum);
  }).then(hash => {
    fs.writeFileSync(combinedHashFile, hash);
    return hash;
  })
}

function coreFiles(baseDir) {
  var cfg = lively.Config,
      libsFile = 'core/lib/lively-libs-debug.js',
      bootstrapFiles = cfg.get("bootstrapFiles"),
      modulesToInclude = cfg.get("bootstrapModules")
        .concat(cfg.get("modulesBeforeWorldLoad"))
        .concat(cfg.get("modulesOnWorldLoad"));

  var coreFiles = spliceInDependencies(modulesToInclude.map(moduleToFile).reverse());
  coreFiles = [libsFile].concat(bootstrapFiles).concat(coreFiles);
  return coreFiles;

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function moduleToFile(module) {
    // TODO: Adapt module load logic
    var relFile = 'core/' + module.replace(/\./g, '/') + '.js';
    var absFile = path.join(baseDir, relFile);
    if (fs.existsSync(absFile))
        return absFile;
    relFile = module.replace(/\./g, '/') + '.js';
    absFile = path.join(baseDir, relFile);
    return absFile;
  }

  function spliceInDependencies(files) {
    // rk 2014-10-25: Uuhhh ha, this looks like an ad-hoc parsing adventure...
    var i = 0;
    var dependencies = {};
    while (i < files.length) {
        var filename = files[i];
        if (dependencies[filename]) {
            dependencies[filename].forEach(function(dep) { files.splice(i + 1, 0, dep); });
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
                    files.splice(i + 1, 0, filename);
                    deps.push(filename);
                });
            }
        } catch (e) { console.log('Problems processing: ' + filename); }
        i++;
    }

    // remove duplicates
    return lang.arr.uniq(files).map(ea => ea[0] === "/" ? path.relative(baseDir, ea) : ea);
  }
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


module.exports = function(route, app) {

    app.get('/generated/combinedModulesHash.txt', function(req, res) {
      combinedFileAndHashCached()
        .then(hashAndFile => {
          res.writeHead(200, {
              'Content-Type': 'text/plain',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
          });
          res.end(hashAndFile.hash);
        })
        .catch(err => {
          res.status(500).end(String('optimized loading error ' + err.stack || err));
        });
    });

    app.get('/generated/:hash/combinedModules.js', function(req, res) {
      
      combinedFileAndHashCached()
        .then(hashAndFile => {

          if (req.headers['if-none-match'] === hashAndFile.hash) {
              res.status(304); res.end(); return;
          }

          var stream = fs.createReadStream(hashAndFile.file);

          var oneYear = 1000*60*60*24*30*12;
          var acceptEncoding = req.headers['accept-encoding'] || '',
              header = {
                  'Content-Type': 'application/javascript',
                  'Expires': new Date(Date.now() + oneYear).toGMTString(),
                  "Cache-Control": "public",
                  'ETag': hashAndFile.hash
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
          })
          .catch(err => {
            res.status(500).end(String('optimized loading error ' + err.stack || err));
          });
    });
}
