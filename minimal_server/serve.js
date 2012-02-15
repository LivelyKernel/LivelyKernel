var express = require('express'),
    spawn = require('child_process').spawn,
    defaultBrowser = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", 
    defaultArgs =  ["--no-process-singleton-dialog", 
                    "--user-data-dir=/tmp/", "--no-first-run",
                    "--disable-default-apps", 
                    //"--no-startup-window",
                    "--disable-history-quick-provider", 
                    "--disable-history-url-provider",
                    "--disable-breakpad", 
                    "--disable-background-mode",
                    "--disable-background-networking", 
                    "--disable-preconnect", "--disabled"];

// start with "nodemon minimal_server/serve.js" for development

var args = process.argv.slice(2),
    port = args[0] && parseInt(args[0], 10);

/*
 * http interface
 */
function setupServer(testHandler) {
    var app = express.createServer();
    // app.use(express.logger());
    app.use("/", express.static(__dirname + '/../'));
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
    app.use(express.bodyParser());

    function postHandler(path, handlerName) {
        app.post(path, function(req, res) {
            var result;
            try {
                result = testHandler[handlerName](req);
            } catch(e) {
                result = {result: String(e), error: true, requestedData: req.body};
            }
            res.send({result: result});
        });
    }

    postHandler('/test-request', 'handleTestRequest');
    postHandler('/test-result', 'handleResultRequest');
    postHandler('/test-report', 'handleReportRequest');

    postHandler('/debug-openbrowser', 'handleOpenBrowserRequest');
    postHandler('/debug-results', 'handleListResultRequest');

    return app;
}

/*
 * handling requests
 */

var browserInterface = {

    open: function(url, browserPath, browserArgs) {
        if (!browserPath) {
            browserPath = defaultBrowser;
        }
        if (!browserArgs) {
            browserArgs = defaultArgs;
        }
        if (this.process) {
            this.closeBrowser();
            setTimeout(function() { 
                    browserInterface.open(url, browserPath, 
                        browserArgs);
                }, 200);
            return;
        }
        console.log('open ' + browserPath + ' on ' + url);
        this.process = spawn(browserPath, browserArgs.concat([url]));
    },

    closeBrowser: function(id) {
        if (!this.process) return;
        var self = this;
        // give the browser some time to finish requests
        setTimeout(function() {
            if (self.process) { // sometimes process is already gone?!
                self.process.kill("SIGTERM");
            }
            self.process = null;
        }, 100);
    }

};


function TestHandler(browserInterface) { this.browserInterface = browserInterface; }

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

TestHandler.prototype.handleTestRequest = function(req) {
    var url = this.urlForBrowser(req),
        browser = req.body.browser,
        args = req.body.browserArgs;
    if (!url) throw new Error('no url for browsing');
    this.browserInterface.open(url, browser, args);
    return {result: 'browser started with ' + url, testRunId: currentTestId};
};

// results

TestHandler.prototype.handleResultRequest = function(req) {
    var id = req.body.testRunId,
        result = req.body.testResults;
    console.log('Getting result for test run ' + id);
    testResults[id] = {testRunId: id, state: 'done', result: result};
    this.browserInterface.closeBrowser(id);
    return {result: 'ok', testRunId: id};
};

TestHandler.prototype.handleReportRequest = function(req) {
    var id = req.body.testRunId;
    return testResults[id] || {testRunId: id, state: 'no result'};
};

TestHandler.prototype.handleOpenBrowserRequest = function(req) {
    this.browserInterface.open('htttp://google.com');
    return {result: 'ok'};
};

TestHandler.prototype.handleListResultRequest = function(req) {
    return {result: JSON.stringify(testResults)};
};

/*
 * startup or export
 */
if (port && !isNaN(port)) {
    setupServer(new TestHandler(browserInterface)).listen(port);
} else {
    exports.TestHandler = TestHandler;
}
