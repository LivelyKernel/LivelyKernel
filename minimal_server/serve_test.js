/*global QUnit, TestHandler, test, equal, same, raises*/

// continously run with:
// nodemon --exec qunit --code ./minimal_server/serve.js --tests ./minimal_server/serve_test.js

var handler, request, spawn;

/*
 * requesting test run
 */

QUnit.module('test request handler', {
    setup: function() {
        spawn = function(method, args) { spawn.calls.push(method, args); };
        spawn.calls = [];
        handler = new TestHandler(spawn);
        request = {
            body: {testWorldPath: 'foo/bar.xhtml'},
            headers: {host: 'localhost:9001'}
        };
    },
    teardown: function() { TestHandler.resetTestData(); }
});

test("should construct test url for browser", function () {
    var url = handler.urlForBrowser(request);
    equal(url, 'http://localhost:9001/foo/bar.xhtml?testRunId=1', url);
});

test("should construct test url for loading script", function () {
    request.body.loadScript = "run_tests.js";
    var url = handler.urlForBrowser(request);
    equal(url, 'http://localhost:9001/foo/bar.xhtml?testRunId=1&loadScript=run_tests.js');
});

test('should open browser', function() {
    var result = handler.handleTestRequest(request),
        expectedURL = 'http://localhost:9001/foo/bar.xhtml?testRunId=1';
    same(spawn.calls, ['open', [expectedURL]], spawn.calls);
    same(result, {result: 'browser started with ' + expectedURL}, result);
});

test('should not open browser on invalid request', function() {
    request.body = {};
    raises(function() { handler.handleTestRequest(request) }, 'no error raisd');
    equal(spawn.calls, 0, 'spawn was called ' + spawn.calls, spawn.calls);
});


/*
 * posting test run status, results
 */

var reportRequest;
QUnit.module('test status handling', {
    setup: function() {
        handler = new TestHandler();
        request = {
            body: {testRunId: 1, testResults: "all ok"}
        };
        reportRequest = {
            body: {testRunId: 1}
        };
    },
    teardown: function() { TestHandler.resetTestData(); }
});

test('handle result request', function() {
    var result = handler.handleResultRequest(request);
    same(result, {result: 'ok'}, 'result');
    var report = handler.handleReportRequest(reportRequest);
    same(report, {id: 1, state: 'done', result: "all ok"}, JSON.stringify(report));
});

test('handle result request', function() {
    var result = handler.handleResultRequest(request);
    same(result, {result: 'ok'}, 'result');
    var report = handler.handleReportRequest(reportRequest);
    same(report, {id: 1, state: 'done', result: "all ok"}, JSON.stringify(report));
});
