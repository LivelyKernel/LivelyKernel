var fs = require("fs");
var execFile = require("child_process").execFile;

function createZip(dirPath, thenDo) {
  var Path = require("path"),
      dir = dirPath.replace(/\/+$/, ""),            
      name = Path.basename(dir),
      zipName = name + ".zip",
      zipPath = Path.join(process.env.TEMP_DIR, zipName);

  execFile("zip", ["--quiet", "-r", zipName, "."], { cwd: dir }, function(code, out, err) {
    if (code) { thenDo(new Error(out + "\n" + err)); return; }
    execFile("mv", [Path.join(dir, zipName), zipPath], function(code2, out2, err2) {
      thenDo(code2 ? new Error(out2 + "\n" + err2) : null, zipPath);
    });
  });
}

module.exports = function(route, app) {

// createZip("/home/lively/clojure/test", function(err, zipfile) {
//   console.log(err);
//   console.log(zipfile);
// })

    app.get(route, function(req, res) {
        var q = require("url").parse(req.url, true).query,
            path = q.path;
        if (!path) { res.status(400); res.end("path expected"); return; }
        path = path.replace(/\/$/, "") + "/";
        console.log("zipping + shipping %s", path);
        createZip(path, function(err, zipfile) {
          if (err) { res.status(400); res.end(String(err)); return; }

          res.set("Content-Disposition", "attachment; filename='" + lively.lang.arr.last(zipfile.split("/")) + "';");
          res.set("Content-Type", "application/octet-stream");
          fs.createReadStream(zipfile).pipe(res);
        })
    });

}
