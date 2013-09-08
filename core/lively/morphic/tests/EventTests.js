module('lively.morphic.tests.EventTests').requires('lively.morphic.tests.Morphic').toRun(function() {

// this testcase was migrated from lively.morphic.tests.Morphic
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.EventTests.DragAndDropTests',
'helping', {
    grabAt: function(pos) {
        this.world.firstHand().setPosition(pos);
        var morphs = this.world.morphsContainingPoint(pos);
        if (morphs.length > 1) this.world.firstHand().grabMorph(morphs.first());
    },
    dropAt: function(pos) {
        this.world.firstHand().setPosition(pos);
        var evt = {hand: this.world.firstHand(), getPosition: function() { return pos; }, stop: Functions.Null};
        this.world.dispatchDrop(evt);
    }
},
'testing', {
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
    test03DropMorph: function() {
        var morph1 = new lively.morphic.Box(new Rectangle(0, 0, 100, 100)),
            morph2 = new lively.morphic.Box(new Rectangle(100, 0, 80, 80));
        this.world.addMorph(morph1);
        this.world.addMorph(morph2);
        morph1.setFill(Color.red);
        morph2.setFill(Color.green);

        this.grabAt(pt(110, 10));
        this.assert(this.world.firstHand().submorphs.include(morph2), 'morph2 not grabbed');
        this.dropAt(pt(10, 10));
        this.assert(morph1.submorphs.include(morph2), 'morph2 not dropped on morph1');
    },
    test04RestrictMorphsToDrop: function() {
        var morph1 = new lively.morphic.Box(new Rectangle(0, 0, 100, 100)),
            morph2 = new lively.morphic.Box(new Rectangle(100, 0, 80, 80)),
            morph3 = new lively.morphic.Box(new Rectangle(200, 0, 80, 80));
        this.world.addMorph(morph1);
        this.world.addMorph(morph2);
        this.world.addMorph(morph3);
        morph1.setFill(Color.red);
        morph2.setFill(Color.green);
        morph3.setFill(Color.blue);

        morph1.addScript(function wantsDroppedMorph(morph) {
            // accept only blue morphs for dropping
            return morph.getFill().equals(Color.blue);
        });

        this.grabAt(pt(110, 10));
        this.assert(this.world.firstHand().submorphs.include(morph2), 'morph2 not grabbed');
        this.dropAt(pt(10, 10));
        this.assert(!morph1.submorphs.include(morph2), 'morph2 dropped on morph1');
        morph2.remove();
        this.grabAt(pt(210, 10));
        this.assert(this.world.firstHand().submorphs.include(morph3), 'morph3 not grabbed');
        this.dropAt(pt(10, 10));
        this.assert(morph1.submorphs.include(morph3), 'morph3 not dropped on morph1');
    },
    test05RestrictDropTarget: function() {
        var morph1 = new lively.morphic.Box(new Rectangle(0, 0, 100, 100)),
            morph2 = new lively.morphic.Box(new Rectangle(100, 0, 100, 100)),
            morph3 = new lively.morphic.Box(new Rectangle(200, 0, 80, 80));
        this.world.addMorph(morph1);
        this.world.addMorph(morph2);
        this.world.addMorph(morph3);
        morph1.setFill(Color.red);
        morph2.setFill(Color.green);
        morph3.setFill(Color.blue);

        morph3.addScript(function wantsToBeDroppedInto(dropTaget) {
            // accept only green morphs as drop targets
            return dropTaget.getFill().equals(Color.green);
        });

        var h = this.world.firstHand();
        this.grabAt(pt(210, 10));
        this.assert(this.world.firstHand().submorphs.include(morph3), 'morph3 not grabbed');
        this.dropAt(pt(10, 10));
        this.assert(!morph1.submorphs.include(morph3), 'morph3 dropped on morph1');
        this.grabAt(pt(10, 10));
        this.assert(this.world.firstHand().submorphs.include(morph3), 'morph3 not grabbed');
        this.dropAt(pt(110, 10));
        this.assert(morph2.submorphs.include(morph3), 'morph3 not dropped on morph2');
    }
});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.EventTests.LockingTests',
'helper', {
    dragFromTo: function(morph, startMousePos, endMousePos) {
        var dragTriggerOffset = pt(10,0)
        // grab morph
        this.doMouseEvent({type: 'mousedown', pos: startMousePos, target: morph});
        this.doMouseEvent({type: 'mousemove', pos: startMousePos.addPt(dragTriggerOffset), target: morph});
        this.doMouseEvent({type: 'mousemove', pos: startMousePos, target: morph});
        // move
        this.doMouseEvent({type: 'mousemove', pos: endMousePos, target: morph});
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

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.EventTests.ShadowTests',
'testing', {
    testAddingShadowMorphKeepsConnections: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20);
        var shadow = morph.getGrabShadow();
        this.world.addMorph(morph);
        this.world.addMorph(shadow);
        morph.rotateBy(1);
        this.assertEquals(1, shadow.getRotation());
        this.world.addMorph(shadow); // adding morph again should have no effect
        morph.rotateBy(1);           // on the connections
        this.assertEquals(2, shadow.getRotation());
    },
    testAddingShadowMorphKeepsSubmorphs: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 20, 20);
        morph.addMorph(lively.morphic.Morph.makeRectangle(0, 0, 4, 4));
        var shadow = morph.getGrabShadow();
        this.world.addMorph(morph);
        this.world.addMorph(shadow);
        this.assertEquals(morph.submorphs.length, shadow.submorphs.length, 'before addMorph again');
        this.world.addMorph(shadow); // adding morph again should have no effect
                                     // on the submorphs of the shadow
        this.assertEquals(morph.submorphs.length, shadow.submorphs.length, 'after addMorph again');
    }
});

TestCase.subclass('lively.morphic.tests.EventTests.KeyDispatcher',
"running", {
    setUp: function($super) {
        this.sut = new lively.morphic.KeyboardDispatcher();
    }
},
'testing', {
    testNormalizeModifier: function() {
        var tests = [
            "Ctrl", "c",
            "controL", "c",
            "Control", "c",
            "C", "c",
            "option", "m",
            "M", "m",
            "meta", "m",
            "Alt", "m",
            "s", "s",
            "Shift", "s",
            "Command", "cmd"
        ]
        for (var i = 0; i < tests.length; i+=2) {
            this.assertEquals(tests[i+1], this.sut.normalizeModifier(tests[i]));
        }
    },

    testAddKeyCombos: function() {
        this.sut.addKeyCombo("Control-c control-k", 'test');
        this.assertEquals('prefix', this.sut.bindings['c-c'], 1);
        this.assertEquals('test', this.sut.bindings['c-c c-k'], 2);
        this.sut.addKeyCombo("ctrl-c shift-k", 'test2');
        this.assertEquals('prefix', this.sut.bindings['c-c'], 3);
        this.assertEquals('test2', this.sut.bindings['c-c s-k'], 4);
        this.sut.addKeyCombo("C-c", 'test3');
        this.assertEquals(undefined, this.sut.bindings['c-c c-k'], 5);
        this.assertEquals(undefined, this.sut.bindings['c-c s-k'], 6);
        this.sut.addKeyCombo("Shift-Alt-c", 'test4');
        this.assertEquals('test4', this.sut.bindings['s-m-c'], 7);
    },

    testLookupCombos: function() {
        this.assertEquals(null, this.sut.lookup("Control-C"), 1);
        this.sut.addKeyCombo("C-c C-k", 'test');
        this.assertEquals('prefix', this.sut.lookup("Control-C"), 2);
    },

    testFindCommandForEvents: function() {
        this.sut.addKeyCombo("C-c C-d", 'test');
        var evt1 = {getKeyString: function() { return 'Control-C'}},
            evt2 = {getKeyString: function() { return 'Control-D'}},
            keyInputState = {prevKeys: []};
        keyInputState = this.sut.updateInputStateFromEvent(evt1, keyInputState);
        this.assertEquals('prefix', keyInputState.commandName, 1);
        this.assertEquals(1, keyInputState.prevKeys.length, 2);
        keyInputState = this.sut.updateInputStateFromEvent(evt2, keyInputState);
        this.assertEquals('test', keyInputState.commandName, 3);
        this.assertEquals(0, keyInputState.prevKeys.length, 4);
    },

    testAddTempBindings: function() {
        function evt(key) { return {getKeyString: function() { return key; }}}
        var keyInputState = {prevKeys: []}, cmd;

        this.sut.addTempKeyCombo("y", 'test', 'testGroup');
        cmd = this.sut.updateInputStateFromEvent(evt('y'), keyInputState).commandName;
        this.assertEquals('test', keyInputState.commandName, '1');

        this.sut.removeTempKeyCombo("y");
        cmd = this.sut.updateInputStateFromEvent(evt('y'), keyInputState).commandName;
        this.assert(!cmd, '2 ' + cmd);
    },

    testAddTempBindingsWithOverwrite: function() {
        function evt(key) { return {getKeyString: function() { return key; }}}
        var keyInputState = {prevKeys: []}, cmd;

        this.sut.addKeyCombo("x", 'test');
        cmd = this.sut.updateInputStateFromEvent(evt('x'), keyInputState).commandName;
        this.assertEquals('test', keyInputState.commandName, '1');

        this.sut.addTempKeyCombo("x", 'test2', 'testGroup');
        // add it multiple times, just for fun
        this.sut.addTempKeyCombo("x", 'test2', 'testGroup');
        cmd = this.sut.updateInputStateFromEvent(evt('x'), keyInputState).commandName;
        this.assertEquals('test2', keyInputState.commandName, '2');

        this.sut.removeTempKeyCombo("x");
        cmd = this.sut.updateInputStateFromEvent(evt('x'), keyInputState).commandName;
        this.assertEquals('test', keyInputState.commandName, '3');
    }

});

}) // end of moduledule
