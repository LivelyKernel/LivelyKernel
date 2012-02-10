var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    url = require('url');

var port = 9001,
    root = ".",
    extensionAndTypes = [
      {ext: '.js', type: 'text/javascript'},
      {ext: '.xhtml', type: 'application/xhtml+xml'}];


function getType(filePath) {
  var ext = path.extname(filePath.split('?')[0]);
  for (var i = 0; i < extensionAndTypes.length; i++) {
    var ea = extensionAndTypes[i];
    if (ea.ext === ext) return ea.type;
  }
  return null;
}

function sendError(response, code, msg) {
  msg = msg || 'unknown';
  response.writeHead(code, {'Content-Type': 'text/plain'});
  response.end(msg);
  console.log("error: " + msg);
}

function serveFile(response, url) {
  var filePath = path.join(root, url),
      type = getType(filePath);

  if (!type) {
    sendError(response, 415, 'unsupported file type of ' + filePath);
    return;
  }

  path.exists(filePath, function(exists) {
    if (!exists) {
      sendError(response, 404, 'file ' + filePath + ' does not exist');
      return;
    }

    fs.readFile(filePath, function(err, data) {
      if (err) {
        sendError(response, 404, err);
        return;
      }

      console.log('Serving ' + filePath + ' with type ' + type);
      response.writeHead(200, {
        'Content-Type': type,
        'Content-Length': data.length});
      response.end(data);

    });
  });
}

http.createServer(function (request, response) {
  var filePath = request.url.split('?')[0];
  serveFile(response, filePath);
}).listen(port, "127.0.0.1");

console.log('Server running at http://127.0.0.1:' + port + '/');