module('lively.tests.PublishingTests').requires('lively.PartsTestFramework').toRun(function() {

TestCase.subclass('lively.tests.PublishingTests.PartsBinLocation',
"testing", {
    testGetPartItemLocalAndRemote: function() {
        var m1 = lively.morphic.Morph.makeRectangle(0,0,100,100);
        m1.getPartsBinMetaInfo().setPartsSpaceName('PartsBin/Foo');
        var url = m1.getPartItem().getPartsSpace().getURL();
        this.assertEquals(URL.root.withFilename('PartsBin/Foo/'), url);
        m1.getPartsBinMetaInfo().setPartsSpaceName('http://foo.bar.com/PartsBin/Foo');
        url = m1.getPartItem().getPartsSpace().getURL();
        this.assertEquals(new URL('http://foo.bar.com/').withFilename('PartsBin/Foo/'), url);
        // hack to make multiple partsbin urls work
        this.assertEquals('PartsBin/Foo', m1.getPartItem().getPartsSpace().getName());
    }
});

TestCase.subclass('lively.tests.PublishingTests.PublishingTests',
'testing', {

    testIsCurrentPartsBinVersion: function() {
        var m1 = lively.morphic.World.current().loadPartItem("Rectangle", "PartsBin/Basic");
        this.assert(m1.getPartItem().hasLatestPartVersion(),
                    "Morph should be current PartsBin version.");
        var m2 = m1.copy();
        this.assert(m2.getPartItem().hasLatestPartVersion(),
                    "Copy of morph should be current PartsBin version.");
        var rev = m1.getPartItem().loadPartVersions().partVersions.last().rev,
            m3 = m1.getPartItem().loadPart(false, null, rev).part;
        this.assert(!m3.getPartItem().hasLatestPartVersion(),
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
