module('lively.morphic.tests.EventTests').requires('lively.morphic.tests.Morphic').toRun(function() {

// this testcase was migrated from lively.morphic.tests.Morphic
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.OldEventTests',
'testing', {
    xtest05DropMorph: function() {
        var morph1 = new lively.morphic.Morph(),
            morph2 = new lively.morphic.Morph();
        // this.world.addHandMorph();
        this.world.addMorph(morph1);
        this.world.addMorph(morph2);
        morph1.setBounds(new Rectangle(0,0, 100, 100));
        morph2.setBounds(new Rectangle(0,0, 80, 80));
        morph1.applyStyle({fill: Color.red});
        morph2.applyStyle({fill: Color.green});

        // is already done by style settings
        // this.world.enableDropping();
        // morph1.enableDropping();
        // morph1.enableGrabbing();
        // morph2.enableDropping();
        // morph2.enableGrabbing();

        this.doMouseEvent({type: 'mousedown', pos: pt(20,20), target: morph2.renderContext().getMorphNode(), button: 0});

        this.assert(this.world.firstHand().submorphs.include(morph2), 'morph not grabbed');

        this.doMouseEvent({type: 'mouseup', pos: pt(20,20), target: this.world.renderContext().getMorphNode()});

        this.assert(morph1.submorphs.include(morph2), 'morph not dropped on morph2');
    },
    test01DragMorph: function() {
        var dragStarted = false,
            dragMoved = false,
            dragEnded = false,
            morph = new lively.morphic.Morph(),
            morphNode = morph.renderContext().getMorphNode();
        this.world.addMorph(morph);
        morph.setBounds(new Rectangle(0,0, 100, 100));
        morph.applyStyle({fill: Color.red, enableDragging: true});

        morph.onDragStart = function() { dragStarted = true }
        morph.onDrag = function() { dragMoved = true }
        morph.onDragEnd = function() { dragEnded = true }

        this.doMouseEvent({type: 'mousedown', pos: pt(20,20), target: morphNode, button: 0});
        this.assert(!dragStarted, 'drag already started after mousedown');

        this.doMouseEvent({type: 'mousemove', pos: pt(25,25), target: morphNode, button: 0});
        this.assert(dragStarted, 'drag not started after mousedown and mousemove');
        this.assert(!dragMoved, 'drag already moved at dragStart');

        this.doMouseEvent({type: 'mousemove', pos: pt(30,30), target: morphNode, button: 0});
        this.assert(dragMoved, 'drag not moved after mousemove');

        this.doMouseEvent({type: 'mouseup', pos: pt(30,30), target: morphNode, button: 0});
        this.assert(dragEnded, 'dragEnd not called');
    },
    test02RelayMouseEventsToMorphBeneath: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0,0,100,100),
            morph2 = lively.morphic.Morph.makeRectangle(0,0,100,100);

        this.world.addMorph(morph1);
        this.world.addMorph(morph2);

        morph2.relayMouseEventsToMorphBeneath();

        lively.morphic.EventSimulator.doMouseEvent(
            {type: 'mousedown', pos: pt(20,20), target: morph2, button: 0});
        this.assertIdentity(morph1, this.world.clickedOnMorph);
    },

});

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