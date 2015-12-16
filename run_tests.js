/*global alertOK, require, TestSuite, unescape, $, JSON*/

// some helpers
function exit() {
    window.open('', '_self', '');
    window.close();
}

function prepareConfig() {
    lively.Config.set("computeCodeEditorCompletionsOnStartup", false);
    // For closing the browser
    lively.Config.set("askBeforeQuit", false);
    // for network tests
    lively.Config.set("serverInvokedTest", true);
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

function serverLog(msg) {
    URL.nodejsBase.withFilename("NodeJSEvalServer/").asWebResource().post(msg).content;
}

// some preparation

serverLog("Automatic test process started.");

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


// running the actual tests
var baseTests = [
    // core
    "lively.tests.BaseTests",
    "lively.tests.ClassTests",
    "lively.tests.ModuleSystemTests",
    "lively.tests.NetworkTests",
    "lively.tests.ObjectTests",
    "lively.tests.PartsTestFrameworkTests",
    "lively.tests.TestFrameworkTests",
    "lively.tests.TracingTests",
    "lively.tests.TraitTests",

    // AST / OMeta
    "ometa.tests.OmetaTests",
    "lively.ast.tests.AcornTests",
    "lively.ast.tests.InterpreterTests",
    "lively.ast.tests.RewriterTests",

    // persistence
    "lively.persistence.tests.BuildSpec",
    "lively.persistence.tests.PersistenceTests",
    "lively.persistence.tests.TraitPersistenceTests",

    //bindings
    "lively.bindings.tests.BindingTests"
];

var browserTests = [
    // core
    "lively.tests.BootstrapTests",
    "lively.tests.CoreTests",
    "lively.tests.HelperTests",

    // network
    "lively.net.tests.SessionTracker",
    "lively.net.tests.Wiki",

    // lang support
    "lively.lang.tests.ExtensionTests",
    "lively.lang.tests.VM",
    
    // 2014-11-01 rk: the worker interface has changed since switching to
    // lively.lang, so these tests are more or less not needed anymore. I wanna
    // check them for useful stuff before removing them, however.
    // "lively.lang.tests.WorkerTests",

    // persistence
    "lively.persistence.tests.MassMorphCreation",
    'lively.persistence.tests.MorphicState',
    'lively.persistence.tests.MorphicProperties',

    // presentation
    "lively.presentation.tests.Builds",

    // data import/export
    "lively.data.tests.ODFImport",

    //bindings
    "lively.bindings.tests.FRPCoreTests",
    "lively.bindings.tests.FRPSerialization",
    "lively.bindings.tests.GeometryBindingTests",

    // serialization / storage
    "lively.persistence.tests.MassMorphCreation",
    "lively.persistence.tests.TraitPersistenceTests",
    "lively.store.tests.Interface",

    // ide / SCB
    "lively.ide.tests.ASTEditingSupport",
    'lively.ide.tests.BrowserAddonTests',
    "lively.ide.tests.CodeEditor",
    // rk 2015-09-02: travis seems to have issues with maintining the l2l
    // connection needed for the shell tests and the shell environment itself
    // 'lively.ide.tests.CommandLineInterface',
    "lively.ide.codeeditor.tests.JumpChar",
    "lively.ide.codeeditor.tests.DraggableCode",
    "lively.ide.codeeditor.tests.MorphicOverlays",
    "lively.ide.codeeditor.tests.TextOverlays",
    'lively.ide.codeeditor.tests.DiffMode',
    'lively.ide.codeeditor.tests.TreeMode',
    'lively.ide.git.tests.Interface',
    "lively.ide.tests.FileParserTests",
    "lively.ide.tests.FileSystem",
    "lively.ide.tests.ModuleLookup",
    "lively.ide.tests.SCBTests",
    "lively.ide.tests.SyntaxHighlighting",
    "lively.ide.tests.WindowNavigation",
    "lively.ide.tools.tests.CommandLine",

    // PartsBin
    "lively.tests.PartsBinTests",

    // morphic
    "lively.morphic.tests.Canvas",
    "lively.morphic.tests.Connectors",
    "lively.morphic.tests.CoreToolsTests",
    "lively.morphic.tests.DataGridTests",
    "lively.morphic.tests.DraggableJavaScript",
    "lively.morphic.tests.DiffMerge",
    "lively.morphic.tests.EventTests",
    "lively.morphic.tests.Graphics",
    "lively.morphic.tests.HTML",
    "lively.morphic.tests.HTMLText",
    "lively.morphic.tests.Layout",
    "lively.morphic.tests.Lists",
    "lively.morphic.tests.Morphic",
    "lively.morphic.tests.Morphic2",
    "lively.morphic.tests.MorphAddons",
    "lively.morphic.tests.PathTests",
    "lively.morphic.tests.Scrubbing",
    "lively.morphic.tests.Serialization",
    "lively.morphic.tests.ShapeTests",
    "lively.morphic.tests.StyleSheets",
    "lively.morphic.tests.StyleSheetsHTML",
    "lively.morphic.tests.TabTests",
    "lively.morphic.tests.Text",
    "lively.morphic.tests.TextUndoTests",
    "lively.morphic.tests.Tree",

    "lively.users.tests.Tests",

    // cop
    "cop.tests.LayerTests"
];

var testList = baseTests;
if (!Global.testRun || !testRun.isNodeJS) {
    testList.pushAll(browserTests);
}

var additionalModules = getURLParam('additionalModules');
if (additionalModules) {
    var moduleNames = additionalModules.split(',');
    testList.pushAll(moduleNames);
}

// filter is something like "lively.morphic.*|.*Origin.*|test03"
var filter = getURLParam('testFilter'), suiteFilter;
if (filter) {
    var parts = filter.split('|'),
        modulePart = parts[0],
        moduleFilterRegexp = new RegExp(modulePart, "i");
    testList = testList.select(function(name) {
        return moduleFilterRegexp.test(name) });
    suiteFilter = parts.slice(1).join('|'); // last 2
}

prepareConfig();

(function setUserName() {
    lively.morphic.World.current().setCurrentUser("run_tests-" + testRunId);
})();

serverLog("Automatic test process configuration done.");

if (lively.Config.get("serverTestDebug")) {
    // So we can connect to the test server via l2l
    function sendLogMessage() {
        var code = "console.log('debugging the tests in progress');";
        URL.nodejsBase.withFilename("NodeJSEvalServer/").asWebResource().post(code).content;
    }
    Global.travisDebugLogInterval = setInterval(sendLogMessage, 10*1000);
} else {
    serverLog("Automatic test process will run " + testList.length + " tests.");
    require(['lively.TestFramework'].concat(testList)).toRun(function() {
        var suite = TestSuite.forAllAvailableTests(suiteFilter);
        suite.runFinished = function() {
            if (Global.testRun) {
                testRun.onTestResult(suite.result.asJSON());
            } else {
                var result = suite.result.asJSONString();
                postResult(result);
                if (!getURLParam('stayOpen')) { exit.delay(0.5); }
            }
        };
        suite.runAll();
    });
}
