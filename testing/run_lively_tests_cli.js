var http = require('http'),
    colorize = require('colorize'),
    config = require('./config');

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
            if (callback) callback(body && body.result);
        });
    });

    req.on('error', function(e) {
        log('problem with request: ' + e.message);
    });

    req.write(JSON.stringify(data));
    req.end();
}

function printResult(data) {
    console.log('--- run times ---\n\n');
    data.runtimes.forEach(function(ea) {
       console.log(ea.time + '\t' + ea.module);
    });
    console.log('\n\n\n');
    console.log('tests run: ' + data.runs);
    if (data.fails > 0) {
        console.log(colorize.ansify('#red[FAILED]'));
        data.messages.forEach(function(ea) {
           console.log(ea);
        });
        console.log(colorize.ansify('#red[' + data.messages.length + 
            ' FAILED]'));
    } else {
        console.log(colorize.ansify('#green[PASSED]'));
    }    
}

// poll
var maxRequests = config.timeout, currentRequests = 0;
function tryToGetReport(data) {
    if (currentRequests >= maxRequests) {
        console.log('Time out!');
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
    console.log('\n===== test result =====\n\n');
    printResult(JSON.parse(data.result));
}

function startTests() {
    var browser = config.browsers[config.os][config.browser];
    post('/test-request', {
        browser: browser.path,
        browserArgs: browser.args,
        testWorldPath: 'testing/run_tests.xhtml',
        loadScript: "run_tests.js"
    }, tryToGetReport);
}
startTests();
