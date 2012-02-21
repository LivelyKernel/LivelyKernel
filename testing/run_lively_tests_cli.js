/*global require, console, process, JSON, setTimeout*/
var http = require('http'),
    colorize = require('colorize'),
    config = require('./config'),
    optparse = require('optparse'),
    spawn = require('child_process').spawn;


////////////////////////////////////////////////////////
// Parse the command line options and merge them with //
// config settings                                    //
////////////////////////////////////////////////////////

// for option parser help see https://github.com/jfd/optparse-js
var platformConf = config.platformConfigs[process.platform],
    supportedBrowsers = Object.keys(platformConf),
    defaultBrowser = '"' + config.defaultBrowser + '"',
    switches = [
        ['-h', '--help', "Shows this help section."],
        ['-v', '--verbose', "Print progress and debug information."],
        ['-b', '--browser NAME', "Which browser to use. Options are \""
                               + supportedBrowsers.join('", "')
                               + "\". If not specified then "
                               + defaultBrowser + " is used."],
        ['-n', '--notifier NAME', "Use a system notifier to output results. "
                                + "Currently \"" + config.defaultNotifier
                                + "\" is supported."],
        ['-f', '--focus FILTER', "A filter is a string that can have three"
                               + "parts separated by \"|\". All parts define"
                               + " JS regexps.\n\t\t\t\tThe first is for "
                               + "matching test modules to load, the second "
                               + "matches test classes, the third test method"
                               + "names.\n\t\t\t\tExample: "
                               + "\"testframework|.*|filter\" will only run "
                               + "those tests that are in modules matching "
                               + "'testframework' and are\n\t\t\t\tdefined in"
                               + "those test methods that match 'filter'."],
        ['--test-script FILE', "Script file that is sent to the browser and "
                             + "runs the tests. If not specified then \""
                             + config.defaultTestScript + "\" is used."]],
    parser = new optparse.OptionParser(switches);


// Internal variable to store options.
var options = {
    browserName: config.defaultBrowser,
    browserConf: platformConf[config.defaultBrowser],
    notifier: null,
    testScript: config.defaultTestScript,
    testWorld: config.defaultTestWorld,
    verbose: false,
    maxRequests: config.timeout,
    testFilter: null
};

parser.on("help", function() {
    console.log(parser.toString());
    process.exit(0);
});

parser.on("verbose", function() { options.verbose = true; });

parser.on("browser", function(name, value) {
    console.assert(supportedBrowsers.indexOf(value) >= 0,
                  "Unsupported browser: " + value);
    options.browserName = value;
    options.browserConf = platformConf[value];
});

parser.on("notifier", function(name, value) {
    console.assert(config.defaultNotifier === value,
                  "Unsupported notifier: " + value);
    options.notifier = value;
});

parser.on("test-script", function(name, value) {
    options.testScript = value;
});

parser.on("focus", function(name, value) {
    options.testFilter = value;
});

parser.parse(process.argv);

function log(msg) {
    if (options.verbose) console.log(msg);
}

log(options);


///////////////////////////////////////////////////////////
// Define functions for server interaction and reporting //
///////////////////////////////////////////////////////////

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

function printResult(testRunId, data) {
    console.log('\n=== test result for test run %s in %s ===',
                testRunId, options.browserName);
    console.log('\nexecution time per test case:');
    data.runtimes.forEach(function(ea) {
       console.log(ea.time + '\t' + ea.module);
    });
    console.log('\n');
    console.log('tests run: ' + data.runs);
    if (data.fails > 0) {
        console.log(colorize.ansify('#red[FAILED]'));
        data.messages.forEach(function(ea) { console.log(ea); });
        console.log(colorize.ansify('#red[' + data.messages.length + ' FAILED]'));
    } else {
        console.log(colorize.ansify('#green[PASSED]'));
    }
}

function notifyResult(testRunId, data) {
    if (!options.notifier) return;
    var msg = (data.fails ? "FAILURE" : 'SUCCCESS') + "\n"
            + data.runs + " tests run, " + data.fails + " failures"
            + "\n" + data.failedTestNames.join("\n");
    spawn(options.notifier, ["--message", msg,
                             "--identifier", "LivelyCoreTests" + options.testScript,
                             "--image", "core/media/lively_logo.png"]);
}

// poll
var maxRequests = options.maxRequests, currentRequests = 0;

function tryToGetReport(data) {
    if (currentRequests >= maxRequests) {
        console.log(colorize.ansify('#red[TIMEOUT]'));
        return;
    }
    if (data.state !== 'done') {
        process.stdout.write('.');
        currentRequests++;
        setTimeout(function() {
            post('/test-report', {testRunId: data.testRunId}, tryToGetReport);
        }, 1000);
        return;
    }
    printResult(data.testRunId, JSON.parse(data.result));
    notifyResult(data.testRunId, JSON.parse(data.result));
    process.exit(0);
}

function startTests() {
    post('/test-request', {
        browser: options.browserConf.path,
        browserArgs: options.browserConf.args,
        testWorldPath: options.testWorld,
        loadScript: options.testScript,
        testFilter: options.testFilter
    }, tryToGetReport);
}

startTests();
