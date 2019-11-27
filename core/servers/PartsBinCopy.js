var fs = require('fs');
var execSync = require("child_process").execSync;

module.exports = function(route, app) {
  app.get(route, function(req, res) {
    try {
      execSync("zip -r PartsBinCopy.zip PartsBin");
    } catch (e) {
      res.status(500).end(String(e));
      return
    }
    var readStream = fs.createReadStream('PartsBinCopy.zip')
    readStream.on('close', function() { res.end(); });
    readStream.pipe(res);
  });
}
