var http = require('http');

var verbose = false;
function log(msg) {
    if (verbose) console.log(msg);
}

function post(path, data, callback) {
    var options = {
        host: 'localhost',
        port: 9001,
        path: path,
        method: 'POST',
        headers: {'Content-Type':  'application/json'}
    };

    var req = http.request(options, function(res) {
        log('STATUS: ' + res.statusCode);
        log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            log('BODY: ' + chunk);
            var body = JSON.parse(chunk);
            callback && callback(body && body.result);
        });
    });

    req.on('error', function(e) {
        log('problem with request: ' + e.message);
    });

    req.write(JSON.stringify(data));
    req.end();
}

function startTests() {
    post('/test-request', {
        testWorldPath: 'testing/run_tests.xhtml',
        loadScript: "run_tests.js"
    }, tryToGetReport);
}

// poll
var maxRequests = 20, currentRequests = 0;
function tryToGetReport(data) {
    if (currentRequests >= maxRequests) {
        console.log('Time out!')
        return;
    }
    if (data.state !== 'done') {
        console.log('waiting for tests to finish, test run id: ' + data.testRunId);
        currentRequests++;
        setTimeout(function() {
            post('/test-report', {testRunId: data.testRunId}, tryToGetReport);
        }, 1000);
        return;
    }
    console.log('\n===== test result =====\n\n' + data.result);
}

startTests();