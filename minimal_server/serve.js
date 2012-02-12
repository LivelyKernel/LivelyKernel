var express = require('express'),
    spawn = require('child_process').spawn;

// start with "nodemon minimal_server/serve.js" for development

var args = process.argv.slice(2),
    port = args[0] && parseInt(args[0], 10);

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
}

/*
 * handling requests
 */


function TestHandler(spawnFunc) { this.spawn = spawnFunc || spawn }

var currentTestId, testResults;
TestHandler.resetTestData = function() {
    currentTestId = 0;
    testResults = {};
};
TestHandler.resetTestData();

TestHandler.prototype.newId = function() { return ++currentTestId; };

TestHandler.prototype.urlForBrowser = function(req) {
    var host = req.headers.host,
        worldPath = req.body.testWorldPath,
        scriptPath = req.body.loadScript;
    if (!host || !worldPath) return null;
    var url = "http://" + host + '/' + worldPath + '?testRunId=' + this.newId();
    url += scriptPath ? "&loadScript=" + scriptPath : '';
    return url;
};

TestHandler.prototype.openBrowser = function(url) {
    if (!url) throw new Error('no url for browsing');
    this.spawn('open', [url]);
};

TestHandler.prototype.handleTestRequest = function(req) {
    var url = this.urlForBrowser(req);
    this.openBrowser(url);
    return {result: 'browser started with ' + url};
};

// results

TestHandler.prototype.handleResultRequest = function(req) {
    var id = req.body.testRunId;
    testResults[id] = {id: id, state: 'done', result: req.body.testResults};
    return {result: 'ok'};
};

TestHandler.prototype.handleReportRequest = function(req) {
    var id = req.body.testRunId;
    return testResults[id];
};

/*
 * startup or export
 */
if (port && !isNaN(port)) {
    setupServer(new TestHandler()).listen(port);
} else {
    exports.TestHandler = TestHandler;
}