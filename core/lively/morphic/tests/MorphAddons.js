module('lively.morphic.tests.MorphAddons').requires('lively.morphic.MorphAddons', 'lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MorphAddons.MorphAddonsTests',
'testing', {
    testRemoveAndDropSubmorphs: function() {
        var box = new lively.morphic.Box(new Rectangle(100, 100, 100, 100)),
            eins = box.addMorph(new lively.morphic.Box(new Rectangle(10, 10, 20, 20))),
            zwei = box.addMorph(new lively.morphic.Box(new Rectangle(40, 40, 20, 20)));

        this.assertRaises(function() {box.removeAndDropSubmorphs()},
            'RemoveAndDropSubmorphs without owner did not throw an error');

        this.world.addMorph(box);

        box.removeAndDropSubmorphs();

        this.assert(!box.owner, 'Box still has an owner after removal');
        this.assertEquals(this.world, eins.owner,
            'Eins is not child of world after owner removal');
        this.assertEquals(this.world, zwei.owner,
            'Zwei is not child of world after owner removal');

        this.assertEquals(pt(110, 110), eins.getPosition(),
            'Position of eins not correctly set after owner removal and drop');
        this.assertEquals(pt(140, 140), zwei.getPosition(),
            'Position of zwei not correctly set after owner removal and drop');
    },
});

}) // end of module