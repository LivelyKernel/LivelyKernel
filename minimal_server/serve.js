var express = require('express'),
    spawn = require('child_process').spawn;

// start with "nodemon minimal_server/serve.js" for development

var args = process.argv.slice(2),
    port = args[0] && new Number(args[0]);

/*
 * http interface
 */
function setupServer(testHandler) {
  var app = express.createServer();
  app.use(express.logger());
  app.use("/", express.static(__dirname + '/../'));
  app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
  app.use(express.bodyParser());

  app.post('/test-request', function(req, res) {
    var result;
    try {
       result = testHandler.handleTestRequest(req);
    } catch(e) {
      result = {result: String(e), error: true};
    }
    res.send({result: result});
  });
  return app;
};

/*
 * handling requests
 */
function TestHandler(spawnFunc) { this.spawn = spawnFunc || spawn };

TestHandler.prototype.urlForBrowser = function(req) {
  var host = req.headers.host,
      worldPath = req.body.testWorldPath;
  return worldPath && host ? "http://" + host + '/' + worldPath : null;
}

TestHandler.prototype.openBrowser = function(url) {
  if (!url) throw new Error('no url for browsing');
  this.spawn('open', [url]);
}

TestHandler.prototype.handleTestRequest = function(req) {
  var url = this.urlForBrowser(req);
  this.openBrowser(url);
  return {result: 'browser started with ' + url};
}


/*
 * startup or export
 */
if (port && !isNaN(port)) {
  setupServer(new TestHandler()).listen(port);
} else {
  exports.TestHandler = TestHandler;
}