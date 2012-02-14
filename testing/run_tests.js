/*globals alertOK, require, TestSuite*/

// some helpers
function exit() {
    window.open('', '_self', '');
    window.close();
}

function alertForever(msg) {
    alert(msg, 99999);
}

function getURLParam(name) {
    var queryRegex = new RegExp(name + '=([^\\&]+)'),
        match = document.URL.split('?').last().match(queryRegex);
    return match && match[1];
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
    $.post('/test-result', {testRunId: testRunId, testResults: message});
}

// currently only used for interactive testing
function getResult(id) {
    // getResult(1)
    $.post('/test-report', {testRunId: id}, function(data) { alert(JSON.stringify(data)) });
}


// running the actual tests
var testList = [
    "Tests.TestFrameworkTests",
    "Tests.BaseTest",
    "Tests.HelperTest",
    "Tests.MiniPrototypeTest",
    "Tests.ObjectTests",
    "Tests.ModuleSystemTests",
    "Tests.OmetaTest",
    "Tests.ClassTest",
    "Tests.TraitTests",
    "Tests.TracingTests",
    "lively.persistence.Tests",
    "lively.bindings.Tests",
    "lively.ast.Tests",
    "cop.LayersTest",
    // "lively.morphic.Tests",
    // "lively.bindings.GeometryBindingsTest",
];

require(['lively.TestFramework'].concat(testList)).toRun(function() {
    var suite = TestSuite.forAllAvailableTests();
    suite.runFinished = function() {
        var result = suite.result.getJsonResult();
        postResult(result);
        if (!getURLParam('stayOpen')) {
            exit.delay(0.5);
        }
    };
    suite.runAll();
});
