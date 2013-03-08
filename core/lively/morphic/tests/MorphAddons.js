module('lively.morphic.tests.MorphAddons').requires('lively.morphic.MorphAddons', 'lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MorphAddons.MorphAddonsTests',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
    }
},
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
    testSetFixed: function () {
        var m = lively.morphic.Morph.makeRectangle(rect(100,100,100,100)).openInWorld();
        m.setFixed(true);
        this.assert(m.fixedPosition, 'fixedPosition property not found');
        this.assert(m.fixedScale, 'fixedScale property not found');
        this.assert(m.isFixed, 'isFixed property not found')
        m.setFixed(false);
        this.assertEquals(m.fixedPosition, undefined, 'fixedPosition property still found after unfixing');
        this.assertEquals(m.fixedScale, undefined, 'fixedScale property still found after unfixing');
        this.assertEquals(m.isFixed, undefined, 'isFixed property still found after unfixing')        
    },
    testSetFixedInPosition: function() {
        var m = lively.morphic.Morph.makeRectangle(rect(100,100,100,100)).openInWorld();
        /*window.scrollTo(50,50);
        m.setFixedInPosition(true);
        window.scrollTo(100,100);
        this.assert(m.fixedPosition, 'fixedPosition property not found');
        this.assertEquals(m.getPosition(), lively.pt(150,150), 'wrong getPosition');
        this.assertEquals(m.getBounds().topLeft(), lively.pt(150,150), 'wrong topLeft in getBounds');*/
        m.setFixedInPosition(true);
        this.assert(m.fixedPosition, 'fixedPosition property not found');
        this.assertEquals(m.getPosition(), lively.pt(100,100), 'wrong getPosition');
        this.assertEquals(m.getBounds().topLeft(), lively.pt(100,100), 'wrong topLeft in getBounds');
    },
    testUpdatePositionStyleAttribtues: function() {
        var m = lively.morphic.Morph.makeRectangle(rect(100,100,100,100)).openInWorld();
        m.updatePositionStyleAttribtues(true, pt(150,40));
        var style = m.renderContext().morphNode.getAttribute('style');
        this.assert(style.indexOf('position: fixed;') >= 0, 'CSS attribute "position: fixed;" was not set');
        this.assert(style.indexOf('top: 40px') >= 0, 'CSS top attribute was not set correctly');
        this.assert(style.indexOf('left: 150px') >= 0, 'CSS left attribute was not set correctly');
        this.assert(m.world().renderContext().morphNode.getAttribute('style').indexOf() < 0, '#D transform render context still exists on world - not compatible with position: fixed in webkit')
    },
    testAddFlapWithMorph: function() {
        var m = lively.morphic.Morph.makeRectangle(rect(100,100,100,100)).openInWorld();
        var flap = m.world().addFlapWithMorph(m, 'left');
        this.assert(m.world().submorphs.find(function (ea) {return ea.isFlap}), 'no flap added')
        this.assert(flap.submorphs.find(function (ea) {return ea.submorphs.first() === m}), 'morph is not in flap')
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