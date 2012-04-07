module('lively.morphic.tests.CoreToolsTests').requires('lively.morphic.tests.Morphic').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.CoreToolsTests.PartsBinTests',
'running', {
    shouldRun: URL.source.toString().include('webwerkstatt/'),

    tearDown: function($super) {
        if (this.publishDialog) {
            this.publishDialog.remove();
        }
    },
},
'testing', {
    test01OpenPublishDialog: function() {
        var morph = new lively.morphic.Morph();
        morph.openInWorld();
        morph.copyToPartsBinWithUserRequest();
        this.publishDialog = $world.get('PublishPartDialog');
        this.assert(this.publishDialog && this.publishDialog.isMorph, 
                'publish part dialog was expected to be in $world');
    },
});

}) // end of module