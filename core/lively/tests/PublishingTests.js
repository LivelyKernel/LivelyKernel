module('lively.tests.PublishingTests').requires('lively.PartsTestFramework').toRun(function() {

TestCase.subclass('lively.tests.PartsTestFrameworkTests.PublishingTests', 'testing', {
    testIsCurrentPartsBinVersion: function() {
        var m1 = $world.loadPartItem("Rectangle", "PartsBin/Basic");
        this.assert(m1.isCurrentPartsBinVersion(), "Morph should be current PartsBin version."); 
        var m2 = m1.copy();
        this.assert(m1.isCurrentPartsBinVersion(), "Copy of morph should be current PartsBin version."); 
        var m3 = m1.getPartItem().loadPart(false, null, m1.getPartItem().loadPartVersions().partVersions.last().rev).part
        this.assert(!m3.isCurrentPartsBinVersion(), "Old PartsBin version should not be current PartsBin version.");
    },
    testIsInPartsBin: function() {
        var m1 = Morph.makeRectangle(0,0,100,100);
        this.assert(!m1.getPartItem().isInPartsBin(), 'This morph should not have a PartsBin');
        var m2 = $world.loadPartItem("Rectangle", "/PartsBin/Basic")
        this.assert(m2.getPartItem().isInPartsBin(), 'This morph should have a PartsBin representation');
    },
});

}) // end of module