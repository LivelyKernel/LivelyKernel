module('lively.morphic.tests.CoreToolsTests').requires('lively.morphic.tests.Morphic').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.CoreToolsTests.PartsBinTests',
'running', {
    setUp: function($super) {
    },
    tearDown: function($super) {
    },
},
'testing', {
    test01OpenPublishDialog: function() {
        var morph = new lively.morphic.Morph(),
            publishDialog;
        morph.openInWorld();
        morph.copyToPartsBinWithUserRequest();
        publishDialog = $world.get('PublishPartDialog');
        this.assert(publishPartDialog && publishDialog.isMorph, 'publish part dialog was expected to be in $world');
    },
});

}) // end of module