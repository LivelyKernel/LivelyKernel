module('lively.ide.tests.ModuleLookup').requires('lively.ide', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ide.tests.ModuleLookup.URLMappingTest',
'tests', {
    testModuleOutsideCoreIsFound: function() {
        var url = URL.root.withFilename('apps/foo.js'),
            result = lively.ide.sourceDB().mapURLsToRelativeModulePaths([url]),
            expected = ['apps/foo.js'];
        this.assertEqualState(expected, result);
    },

    testModuleInsideCoreIsFound: function() {
        var url = URL.root.withFilename('core/lively/foo.js'),
            result = lively.ide.sourceDB().mapURLsToRelativeModulePaths([url]),
            expected = ['lively/foo.js'];
        this.assertEqualState(expected, result);
    }
});


}) // end of module
