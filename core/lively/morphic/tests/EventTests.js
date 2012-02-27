module('lively.morphic.tests.EventTests').requires('lively.morphic.tests.Morphic').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.EventTests.LockingTests',
'helper', {
    dragFromTo: function(morph, startMousePos, endMousePos) {
        var dragTriggerOffset = pt(10,0)
        // grab morph
        this.doMouseEvent({type: 'mousedown', pos: startMousePos, target: morph});
        this.doMouseEvent({type: 'mousemove', pos: startMousePos.addPt(dragTriggerOffset), target: morph});
        // this.doMouseEvent({type: 'mousemove', pos: startMousePos, target: morph});
        // this.doMouseEvent({type: 'mousemove', pos: endMousePos, target: morph});
        // move
        this.doMouseEvent({type: 'mousemove', pos: endMousePos.addPt(dragTriggerOffset), target: morph});
        // drop
        this.doMouseEvent({type: 'mouseup', pos: endMousePos, target: morph.world()});
    },
},
'testing', {

    test01MorphsAreUnlockedByDefault: function() {
        var m = new lively.morphic.Morph();
        this.assert(!m.isLocked(), 'morph is locked');
    },
    test02MorphsCanBeLocked: function() {
        var m = new lively.morphic.Morph();
        m.lock()
        this.assert(m.isLocked(), 'morph is unlocked');
    },
    test03SubmorphsGetLockedWhenOwnersAreLocked: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph();
        m1.addMorph(m2);
        m1.lock()
        this.assert(m2.isLocked(), 'submorph is unlocked');
    },
    test04SubmorphsCanOverwriteLocking: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph();
        m1.addMorph(m2);
        m1.lock()
        m2.unlock();
        this.assert(!m2.isLocked(), 'submorph is locked');
    },
    test05OwnerForcesLockingForSubmorphs: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph();
        m1.addMorph(m2);
        m1.lock()
        m2.unlock();
        m1.lock()
        this.assert(m2.isLocked(), 'submorph is unlocked');
    },
    test06LockOwnerIsDraggableButNotItsSubmorphs: function() {
        var m1 = lively.morphic.Morph.makeRectangle(0,0,100,100),
            m2 = lively.morphic.Morph.makeRectangle(50,50,50,50);
        this.createWorld();
        this.world.addMorph(m1);
        m1.addMorph(m2);
        m1.lock()

        this.dragFromTo(m1, pt(5,5), pt(15,5));
        this.assertEquals(pt(10,0), m1.getPosition(), 'pos');

        this.dragFromTo(m2, pt(55,55), pt(65,55));
        this.assertEquals(pt(50,50), m2.getPosition(), 'pos 2');
        this.assertEquals(pt(20,0), m1.getPosition(), 'pos of 1 when 2 is dragged');
    },
    test07WhenOwnerIsLockedAndSubmorphUnlockedTheSubmorphShouldBeDragged: function() {
        var m1 = lively.morphic.Morph.makeRectangle(0,0,100,100),
            m2 = lively.morphic.Morph.makeRectangle(50,50,50,50);
        this.createWorld();
        this.world.addMorph(m1);
        m1.addMorph(m2);
        m1.lock()
        m2.unlock();

        this.dragFromTo(m2, pt(55,55), pt(65,55));
        this.assertEquals(pt(0,0), m1.getPosition(), 'owner dragged');
        this.assertEquals(pt(60,50), m2.getPosition(), 'submorph not dragged');
    }
});

}) // end of moduledule