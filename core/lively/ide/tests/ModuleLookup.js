module('lively.ide.tests.ModuleLookup').requires('lively.ide', 'lively.TestFramework').toRun(function() {

TestCase.subclass('lively.ide.tests.ModuleLookup.URLMappingTest',
'tests', {
    testModuleOutsideCoreIsFound: function() {
        var url = URL.root.withFilename('apps/foo.js'),
            result = lively.ide.sourceDB().mapURLToRelativeModulePaths(url),
            expected = '../apps/foo.js';
        this.assertEqualState(expected, result);
    },
    testSupportModulesWithDotInNames: function() {
        var url = URL.root.withFilename('apps/foo.bar.js'),
            result = lively.ide.sourceDB().mapURLToRelativeModulePaths(url),
            expected = '../apps/foo.bar.js';
        this.assertEqualState(expected, result);
    },

    testModuleInsideCoreIsFound: function() {
        var url = URL.root.withFilename('core/lively/foo.js'),
            result = lively.ide.sourceDB().mapURLToRelativeModulePaths(url),
            expected = 'lively/foo.js';
        this.assertEqualState(expected, result);
    }
});



TestCase.subclass('lively.ide.tests.ModuleLookup.ModuleWrapperNameHandling',
'tests', {
    testCorrectlyConvertFromFileNameWithDotToModuleNameAndBack: function() {
        var wrapper = lively.ide.ModuleWrapper.forFile("node_modules/lively.lang/lib/collection.js");
        this.assertEquals("node_modules.lively\\.lang.lib.collection", wrapper.moduleName())
        this.assertEquals("../node_modules/lively.lang/lib/collection.js", wrapper.fileName())
    }
});

}) // end of module
