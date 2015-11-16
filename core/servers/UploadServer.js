var lang  = require("lively.lang");
var fs  = require("fs");
var util  = require("util");
var async = require("async");
var path  = require("path");
var exec = require("child_process").exec;


var numberFileRe = /^(.*\/)?([^\.]+)(\.[^\/]+)?$/

function numberFileReplacer(match, path, baseName, ext) {
  // adds a -1, -2, ... to the filename before the extension
  var i = 1;
  var noMatch = baseName.match(/-([0-9]+)$/);
  if (noMatch) {
    baseName = baseName.slice(0, -noMatch[0].length);
    i = Number(noMatch[1]) + 1;
  }
  return (path || "") + baseName + "-" + i + (ext || "");
}


function findUnusedFileName(filePath) {
  if (!fs.existsSync(filePath)) return filePath;
  do {
    filePath = filePath.replace(numberFileRe, numberFileReplacer);
  } while (fs.existsSync(filePath));
  return filePath;
}

function gatherFormFiles(formFiles, location) {
  var files = Object.keys(formFiles).reduce(function(allFiles, key) {
      var files = formFiles[key];
      if (!util.isArray(files)) files = [files];
      return allFiles.concat(files);
  }, []);
  files.forEach(function(file) {
    var fname = file.originalFilename || file.name || file.type.replace(/\//, "."),
        targetPath = path.join(location, fname).replace(/\s/g, '_');
    file.targetPath = findUnusedFileName(targetPath);
  });
  return files;
}

function uploadFiles(location, formFiles, thenDo) {

    var report = {uploadedFiles: []};
    // gather all files in the form

    lang.fun.composeAsync(
      function ensureLocation(n) { exec("mkdir -p " + location, function(err, stdout, stderr) { n(err); }); },
      function(n) {
        var files = gatherFormFiles(formFiles, location),
            lkDir = lang.Path("lv.server.lifeStar.tree.basePath").get(global)
                 || process.env.WORKSPACE_LK
                 || process.cwd();

        async.forEach(files, function(file, next) {
          var to = file.targetPath,
              reported = {
                originalName: file.originalFilename || file.name,
                size: file.size,
                type: file.type,
                path: to,
                relativePath: path.relative(lkDir, to),
                name: path.basename(to)
              };
          report.uploadedFiles.push(reported);
          // by default files get uploaded via bodyParser to /tmp/... location. Move
          // them to the specified location
          exec(['mv', file.path, to].join(' '), next);
        }, function(err) { n(err); });
      }
    )(function(err) { thenDo(err, report); });
}

module.exports = function(route, app) {

    app.post('/upload', function(req, res) {
        var additionalData = req.body || {};
        uploadFiles(additionalData.location || process.cwd(), req.files, function(err, uploadReport) {
            if (err) res.status(500).json({error: String(err.stack || err)});
            else res.json(uploadReport)
        });
    });

}
