var util  = require("util");
var async = require("async");
var fs    = require("fs");
var path  = require("path");

function uploadFiles(location, formFiles, thenDo) {

    // gather all files in the form
    var files = Object.keys(formFiles).reduce(function(allFiles, key) {
        var files = formFiles[key];
        if (!util.isArray(files)) files = [files];
        return allFiles.concat(files);
    }, []);

    // by default files get uploaded via bodyParser to /tmp/... location. Move
    // them to the specified location
    var report = {uploadedFiles: []};
    async.forEach(files, function(file, next) {
        var to = path.join(location, file.originalFilename || file.name);
        report.uploadedFiles.push(to);
        fs.rename(file.path, to, next);
    }, function(err) { thenDo(err, report); });
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
