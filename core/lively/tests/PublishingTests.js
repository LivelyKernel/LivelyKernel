module('lively.tests.PublishingTests').requires('lively.PartsTestFramework').toRun(function() {

TestCase.subclass('lively.tests.PublishingTests.PublishingTests',
'testing', {

    testIsCurrentPartsBinVersion: function() {
        var m1 = lively.morphic.World.current().loadPartItem("Rectangle", "PartsBin/Basic"),
            partItem = m1.getPartItem();
        this.assert(partItem.hasLatestPartVersion(),
                    "Morph should be current PartsBin version.");
        var m2 = m1.copy();
        this.assert(m1.hasLatestPartVersion(),
                    "Copy of morph should be current PartsBin version.");
        var rev = m1.getPartItem().loadPartVersions().partVersions.last().rev,
            m3 = m1.getPartItem().loadPart(false, null, rev).part;
        this.assert(!m3.hasLatestPartVersion(),
                    "Old PartsBin version should not be current PartsBin version.");
    },

    testIsInPartsBin: function() {
        var m1 = lively.morphic.Morph.makeRectangle(0,0,100,100);
        this.assert(!m1.getPartItem().isInPartsBin(), 'This morph should not have a PartsBin');
        var m2 = lively.morphic.World.current().loadPartItem("Rectangle", "/PartsBin/Basic");
        this.assert(m2.getPartItem().isInPartsBin(),
                    'This morph should have a PartsBin representation');
    }
});

}) // end of module