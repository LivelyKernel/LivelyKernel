/*global alertOK, require, TestSuite, unescape, $, JSON*/

// some helpers
function exit() {
    window.open('', '_self', '');
    window.close();
}

function prepareConfig() {
    // For closing the browser
    Config.askBeforeQuit = false;
    // for network tests
    Config.serverInvokedTest = true;
}

function alertForever(msg) {
    alert(msg, 99999);
}

function getURLParam(name) {
    if (Global.testRun && testRun.hasOwnProperty(name)) {
        return testRun[name];
    }
    var queryRegex = new RegExp(name + '=([^\\&]+)'),
        match = document.URL.split('?').last().match(queryRegex),
        // FIXME OMeta overwrite unescape
        unescape = window._unescape || window.unescape;
    return match && unescape(match[1]);
}


// some preparation
var testRunId = getURLParam("testRunId");

if (!testRunId) {
    var msg = 'no id for test run, cannot execute tests';
    alertForever(msg);
    throw msg;
}


// result processing
function postResult(message) {
    alertOK("Result: \n" + message);
    $.post('/test-result/' + testRunId, {testRunId: testRunId, testResults: message});
}

prepareConfig();

// everything above is an unmodified copy from run_tests.js

require(['lively.TestFramework', 'lively.versions.tests.Benchmarks']).
toRun(function() {
    var suite = TestSuite.forAllAvailableTests();
    suite.runFinished = function() {
        // filter out test classes as we're only interested in single tests
        var finishedTests = Properties.own(suite.result.timeToRun);
        testClasses = finishedTests.reject(function (ea) {
            return ea.include(':');
        });
        testClasses.forEach(function (ea) {
            delete suite.result.timeToRun[ea];
        });
        var sortByName = function (testCaseName) {
            return testCaseName;
        }
        var result = suite.result.asJSONString(sortByName);
        postResult(result);        
        exit.delay(0.5);
    };
    suite.runAll();
});
