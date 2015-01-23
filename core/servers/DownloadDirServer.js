var fs = require("fs");
var exec = require("child_process").exec;

var cmd = 'path="%s";'
        + 'cd $path;'
        + 'name="`basename $path`";'
        + 'zip --quiet -r $name .;'
        + "mv $name.zip $TEMP_DIR;"
        + 'zip="$TEMP_DIR/$name.zip";'
        + 'echo $zip;'

function createZip(path, thenDo) {
  exec(lively.lang.string.format(cmd, path), function(code, out, err) {
    thenDo(code ? new Error(out + "\n" + err) : null, out.trim());
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
