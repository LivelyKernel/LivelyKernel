/*global require, console, process, JSON, setTimeout*/
var http     = require('http'),
    config   = require('./test-config'),
    optparse = require('optparse'),
    fs       = require('fs'),
    env      = require('./env'),
    shelljs  = require('shelljs'),
    spawn    = require('child_process').spawn;

var colorize = lazyRequire("colorize");
if (!colorize) colorize = {ansify: function(string) { return string }};

////////////////////////////////////////////////////////
// Parse the command line options and merge them with //
// config settings                                    //
////////////////////////////////////////////////////////

// for option parser help see https://github.com/jfd/optparse-js
var platformConf = config.platformConfigs[process.platform],
    supportedBrowsers = Object.keys(platformConf),
    defaultBrowser = env.LK_TEST_BROWSER,
    switches = [
        ['-h', '--help', "Shows this help section."],
        ['-v', '--verbose', "Print progress and debug information."],
        ['-b', '--browser NAME', "Which browser to use. Options are \""
                               + supportedBrowsers.join('", "')
                               + "\". If not specified then \""
                               + defaultBrowser + "\" is used."],
        ['-n', '--notifier NAME', "Use a system notifier to output results. "
                                + "Currently \"" + env.LK_TEST_NOTIFIER
                                + "\" is supported."],
        ['-m', '--modules NAMES', "Additional modules to load, comma separated"],
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
        ['-q', '--query QUERY', "Additional query parameters to the test page"],
        ['--test-script FILE', "Script file that is sent to the browser and "
                             + "runs the tests. If not specified then \""
                             + env.LK_TEST_WORLD_SCRIPT + "\" is used."],
        ['--nodejs', "Runs the nodejs test suite instead of the browser tests"]],
    parser = new optparse.OptionParser(switches);


// Internal variable to store options.
var options = {
    browserName: defaultBrowser,
    browserConf: platformConf[defaultBrowser],
    notifier: null,
    testScript: env.LK_TEST_WORLD_SCRIPT,
    testWorld: env.LK_TEST_WORLD_NAME,
    verbose: false,
    maxRequests: env.LK_TEST_TIMEOUT,
    testFilter: null,
    query: process.env.npm_package_config_testQuery || ''
};

var testWorldURL;

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
    console.assert(env.LK_TEST_NOTIFIER === value,
                  "Unsupported notifier: " + value);
    options.notifier = value;
});

parser.on("test-script", function(name, value) {
    options.testScript = value;
});

parser.on("query", function(name, value) {
    options.query = value;
});

parser.on("focus", function(name, value) {
    options.testFilter = value;
});

parser.on("modules", function(name, value) {
    options.modules = value;
});

parser.on("nodejs", function() {
    options.browserName = 'nodejs';
    options.nodejs = true;
});

parser.parse(process.argv);

function log(msg) {
    if (options.verbose) console.log(msg);
}

log(options);

///////////////////////////////////////////////////////////
// Start/stop browser                                    //
///////////////////////////////////////////////////////////

var browserInterface = {

    open: function(url, options) {
        var browserPath = options.browserConf.path,
            browserArgs = options.browserConf.args;

        if (this.process) {
            this.close();
            setTimeout(function() {
                browserInterface.open(url, options);
            }, 200);
            return;
        }

        if (options.browserConf.tmpDir && fs.existsSync(options.browserConf.tmpDir)) {
    	    shelljs.rm('-rf', options.browserConf.tmpDir);
            console.log('Browser temp dir removed');
        }

        // browserPath = browserPath.replace(/\ /g, '\\ ');
        console.log('open ' + browserPath + ' on ' + url);
        var proc = this.process = spawn(browserPath, browserArgs.concat([url]), options);
        proc.on('close', function() { console.log("Browser closed"); })
        if (options.verbose) {
            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stdout);
        }
    },

    close: function() {
        var self = this;
        // give the browser some time to finish requests
        setTimeout(function() {
            if (self.process) { // sometimes process is already gone?!
                self.process.kill('SIGKILL');
            }
            self.process = null;
        }, 100);
    }

};


///////////////////////////////////////////////////////////
// Define functions for server interaction and reporting //
///////////////////////////////////////////////////////////

function getJson(path, callback) {
    var options = {
        host: env.LIFE_STAR_HOST,
        port: env.LIFE_STAR_PORT,
        path: path,
        method: 'GET'
    };
    log('GET ' + path);
    var req = http.request(options, function(res) {
        var data = '';
        log('STATUS: ' + res.statusCode);
        log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) { data += chunk; });
        res.on('end', function () {
            try {
                var body = JSON.parse(data);
                if (callback) callback(body);
            } catch (e) {
                log('getJson on ' + path);
                log('parse error: ' + data + '\n\n' + e);
                setTimeout(function() { getJson(path, callback) }, 1000);
            }
        });
    });

    req.on('error', function(e) {
        log('problem with request: ' + e.message);
    });

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
        data.messages.forEach(function(ea) {
            var i = ea.indexOf('\n');
            var firstLine = colorize.ansify('#bold[' + ea.substring(0, i) + ']');
            console.log(firstLine + ea.substring(i, ea.length - 1));
	});
        console.log(colorize.ansify('#red[' + data.messages.length + ' FAILED]'));
    } else {
        console.log(colorize.ansify('#green[PASSED]'));
    }
    if (!options.nodejs) {
        console.log("Repeat this test with: %s&stayOpen=true", testWorldURL);
    }
}

function notifyResult(testRunId, data) {
    if (!options.notifier) return;
    var msg = (data.fails ? "FAILURE" : 'SUCCCESS') + "\n"
            + data.runs + " tests run, " + data.fails + " failures"
            + "\n" + data.failedTestNames.join("\n");
    shelljs.exec([options.notifier.replace(/\s/g, '\\ ')].concat(
        ["--message", msg,
         "--identifier", "LivelyCoreTests" + options.testScript,
         "--image", "core/media/lively_logo.png"]).join(' '));
}

// poll
var maxRequests = options.maxRequests, currentRequests = 0;

function pollReport(data) {
    if (currentRequests >= maxRequests) {
        console.log(colorize.ansify('#red[TIMEOUT]'));
        process.exit(2);
        return;
    }
    if (data.state !== 'done') {
        process.stdout.write('.');
        currentRequests++;
        setTimeout(function() {
            getJson('/test-result/' + data.testRunId, pollReport);
        }, 1000);
        return;
    }
    var result = JSON.parse(data.result);
    printResult(data.testRunId, result);
    notifyResult(data.testRunId, result);
    browserInterface.close();
    setTimeout(function() {
        process.exit(result.fails ? 1 : 0);
    }, 200); // 200ms to send SIGKILL to browser
}

function randomId() {
    return Math.floor(Math.random() * 1000);
}

function buildTestWorldURL(testWorldName, id) {
    return 'http://'
         + env.LIFE_STAR_HOST + ':' + env.LIFE_STAR_PORT
         + testWorldName
         + '?testRunId=' + id
         + (options.testScript ? "&loadScript=" + escape(options.testScript) : '')
         + (options.testFilter ? "&testFilter=" + escape(options.testFilter) : '')
         + (options.modules ? "&additionalModules=" + escape(options.modules) : '')
         + (options.query && options.query != '' ? "&" + options.query : '');
}


function startTests() {
    var id = randomId();
    testWorldURL = buildTestWorldURL('/' + options.testWorld + '.html', id);
    browserInterface.open(testWorldURL, options);
    pollReport({testRunId: id});
}

function startNodeJSTests() {
    var lively = require(env.WORKSPACE_LK + '/core/lively/bootstrap');
    lively.testRun = {testRunId: randomId(),isNodeJS: true};
    if (options.testFilter) lively.testRun.testFilter = options.testFilter;
    if (options.modules) lively.testRun.additionalModules = options.modules;
    lively.testRun.onTestResult = function(result) {
        printResult(lively.testRun.testRunId, result);
        notifyResult(lively.testRun.testRunId, result);
        process.exit(result.fails > 0 ? 1 : 0);
    };
    if (options.testScript[0] !== '/') {
        options.testScript = env.WORKSPACE_LK + '/' + options.testScript;
    }
    lively.JSLoader.require(options.testScript);
}

if (options.nodejs) {
    startNodeJSTests();
} else {
    startTests();
}
