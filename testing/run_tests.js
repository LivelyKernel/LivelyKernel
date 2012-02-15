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
    "tests.TestFrameworkTests",
    "tests.BaseTests",
    "tests.HelperTests",
    "tests.MiniPrototypeTests",
    "tests.ObjectTests",
    "tests.ModuleSystemTests",
    "tests.OmetaTests",
    "tests.ClassTests",
    "tests.TraitTests",
    "tests.TracingTests",
    "lively.persistence.tests.PersistenceTests",
    "lively.bindings.tests.BindingTests",
    "lively.ast.tests.AstTests",
    "lively.morphic.tests.Morphic",
    "lively.morphic.tests.Morphic2",
    "lively.morphic.tests.TabTests",
    "lively.morphic.tests.DataGridTests",
    "lively.morphic.tests.Connectors",
    "cop.LayersTest",
    // "lively.bindings.tests.GeometryBindingsTests",       // broken right now
    // "lively.morphic.tests.PathTests",                    // 3 red tests
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
