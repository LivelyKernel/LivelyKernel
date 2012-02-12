
var testList = [
    "Tests.TestFrameworkTests",
    // "Tests.BaseTest",
    // "Tests.HelperTest",
    // "Tests.MiniPrototypeTest",
    // "Tests.ObjectTests",
    // "Tests.OmetaTest",
    // "Tests.TraitTests",
    // "Tests.TracingTests",
    // "lively.persistence.Tests",
    // "lively.morphic.Tests",
    // "lively.bindings.Tests",
    // "lively.bindings.GeometryBindingsTest"
];

require(['lively.TestFramework'].concat(testList)).toRun(function() {
    suite = TestSuite.forAllAvailableTests();
    suite.runFinished = function() {
        var result = suite.result.printResult();
        alert(result);
    }
    suite.runAll();
});