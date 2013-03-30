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
    }
});

AsyncTestCase.subclass('lively.morphic.tests.MorphAddons.TransitionTests',
'running', {
    setUp: function($super) {
        this.morph = new lively.morphic.Box(new Rectangle(0, 0, 100, 100));
        this.morph.applyStyle({fill: Color.green});
        this.morph.openInWorld();
        $super();
    },
    tearDown: function($super) {
        this.morph.remove();
        $super();
    }
},
'testing', {
    testMoveByAnimated: function() {
        // FIXME the animation done callback is never invoked without alert...
        alert(this.selector);
        var m = this.morph,
            test = this,
            startTime = Date.now(),
            realDuration,
            duration = 100/*ms*/;
        m.moveByAnimated(pt(30,20), duration, function() {
            realDuration = Date.now() - startTime;
        });
        this.delay(function() {
            this.epsilon = 40;
            this.assertEqualsEpsilon(duration, realDuration, 'CSS transistion timing');
            this.assertEquals(pt(30, 20), m.getPosition(), 'pos');
            this.done();
        }, 150);
    }
});

}) // end of module
