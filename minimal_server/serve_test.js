// continously run with:
// nodemon --exec qunit --code ./minimal_server/serve.js --tests ./minimal_server/serve_test.js

var handler, request, spawn;
QUnit.module('test request handler', {
    setup: function() {
        spawn = function(method, args) { spawn.calls.push(method, args) };
        spawn.calls = [];
        handler = new TestHandler(spawn);
        request = {
            body: {testWorldPath: 'foo/bar.xhtml'},
            headers: {host: 'localhost:9001'}
        }
    },
    teardown: function() {}
})

test("should construct test url for browser", function () {
    var url = handler.urlForBrowser(request);
    equal(url, 'http://localhost:9001/foo/bar.xhtml');
})

test('should open browser', function() {
    var result = handler.handleTestRequest(request),
        expectedURL = 'http://localhost:9001/foo/bar.xhtml';
    same(spawn.calls, ['open', [expectedURL]]);
    same(result, {result: 'browser started with ' + expectedURL});
})

test('should not open browser on invalid request', function() {
    request.body = {};
    raises(function() { handler.handleTestRequest(request) });
    equal(spawn.calls, 0, 'spawn was called ' + spawn.calls);
});