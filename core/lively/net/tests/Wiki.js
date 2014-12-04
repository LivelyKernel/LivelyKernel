module('lively.net.tests.Wiki').requires('lively.TestFramework', 'lively.net.Wiki').toRun(function() {

AsyncTestCase.subclass('lively.net.tests.Wiki.ResourceListing',
'running', {

    setUp: function($super) {
    },

    tearDown: function($super) {
    }

},
'testing', {

    testShowWikiResources: function() {
        var test = this;
        var resources = ['PartsBin/Basic/Rectangle.json', 'blank.html'];
        lively.net.Wiki.openResourceList(resources, function(err, listWindow) {
            test.assert(!err, "Error! " + err);
            test.assertEquals(1, listWindow.get("partsList") && listWindow.get("partsList").getList().length, "no parts list?");
            test.assertEquals(1, listWindow.get("worldsList") && listWindow.get("worldsList").getList().length, "no worlds list?");
            listWindow.remove();
            test.done();
        });
    }
});

}) // end of module
