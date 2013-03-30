module('lively.morphic.tests.Morphic2').requires('lively.morphic.tests.Morphic').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.PivotPointTests',
'running', {
    shouldRun: false,
    setUp: function($super) {
        $super();
        this.epsilon = 0.0001;
        lively.morphic.TransformRefactoringLayer.beGlobal();
        lively.morphic.TransformAggregationLayer.beGlobal();
    },
    tearDown: function($super) {
        $super();
        lively.morphic.TransformAggregationLayer.beNotGlobal();
    },
},
'testing', {
    test01PivotPointDoesNotAffectInnerBoundsNorBounds: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.bounds(), 'bounds before')
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.innerBounds(), 'innerbounds before');
        morph.setPivotPoint(pt(50,10));
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.bounds(), 'bounds after')
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.innerBounds(), 'innerbounds after');
    },
    test02PivotPointDoesNotAffectLocalCoordinates: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        morph.setPivotPoint(pt(50,10));
        this.assertEquals(pt(0,0), morph.getTransform().transformPoint(pt(0,0)));
    },
    test03aRotationUsesPivot: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.world.addMorph(morph);

        morph.setPivotPoint(pt(50, 10));
        morph.rotateBy((90).toRadians());

        this.assertEquals(rect(pt(40, -40), pt(60, 60)), morph.bounds());
    },
    test03bRotateSetPivotRotateAgain: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.world.addMorph(morph);

        morph.setRotation((90).toRadians()); // apply some transformation
        morph.setPivotPoint(pt(50, 10)); // coordinates local to morph
        this.assertEquals(rect(pt(-20, 0), pt(0, 100)), morph.bounds(), 'setPivotPoint wrong')

        morph.setRotation(0);

        this.assertEquals(pt(-60, 40).extent(pt(100,20)), morph.bounds());
    },
    test03cRotateWithPivotWorks: function() {
        function $t(translation, rotation, scale) { // helper
            return new lively.morphic.Similitude(translation, rotation && rotation.toRadians(), scale && pt(scale,scale))
        }

        // first calculate what is expected
        // rotate 45 degrees
        var t1 = $t(pt(0,0)),
            t2 = $t(pt(0,0), 45),
            t3 = t1.copy().inverse(),
            tStep1 = t3.preConcatenate(t2.preConcatenate(t1)), // t1 x t2 x t3
            bounds1 = [pt(0,0),pt(100,0),pt(0,20), pt(100,20)].invoke('matrixTransform', tStep1);;

        // rotate -45 degrees using pt(50,10) as pivot
        var t1 = $t(pt(50,10)).preConcatenate(tStep1), // pivot + remember transf from step 1!!!
            t2 = $t(pt(0,0), -45),
            t3 = $t(pt(-50,-10)),
            tStep2 = t3.preConcatenate(t2.preConcatenate(t1)),
            bounds2 = [pt(0,0),pt(100,0),pt(0,20), pt(100,20)].invoke('matrixTransform', tStep2);

        // now do the same with a morph and see if its bounds matches
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.world.addMorph(morph);
        morph.setRotation((45).toRadians());
        this.assertEquals(Rectangle.unionPts(bounds1), morph.bounds(), 'bounds wrong, step1');

        morph.setPivotPoint(pt(50,10));
        morph.setRotation((0).toRadians());
        this.assertEquals(Rectangle.unionPts(bounds2), morph.bounds(), 'bounds wrong, step2');
    },

    xtest12ModifyOrigin: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.world.addMorph(morph);

        morph.adjustOrigin(pt(50, 10));
        morph.rotateBy((90).toRadians());

        this.assertEqualsEpsilon(rect(pt(40, -40), pt(60, 60)), morph.getBounds());
    },
    xtest13ModifyOriginWithTransformation: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.world.addMorph(morph);

        morph.setRotation((90).toRadians()); // apply some transformation
        morph.adjustOrigin(pt(50, 10)); // coordinates local to morph
        this.assertEquals(rect(pt(-20, 0), pt(0, 100)), morph.bounds(), 'adjustOrigin wrong')

        morph.setRotation(0);

        this.assertEquals(pt(-60, 40).extent(pt(100,20)), morph.bounds());
    },
    xtest14ModifyOriginWithScale: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 50, 10);
        this.world.addMorph(morph);

        morph.setScale(2)
        morph.adjustOrigin(pt(25, 5)); // set origin is in local shape coordinates
        morph.rotateBy((90).toRadians());

        this.assertEquals(rect(pt(40, -40), pt(60, 60)), morph.getBounds());
    },
    xtest15ModifyOriginWithSubmorphs: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.world.addMorph(morph);

        var submorph = lively.morphic.Morph.makeRectangle(0, 0, 10, 10);
        morph.addMorph(submorph)
        submorph.setPosition(pt(30,30))


        morph.adjustOrigin(pt(20, 20));

        this.assertEquals(pt(10,10), submorph.getPosition(), "submorph pos did not adjust");
    },
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.OriginTests',
'running', {
    setUp: function($super) {
        $super();
        this.epsilon = 0.0001;

        // we run each test method twice passing in a boolean for signaling origin with or
        // without clipping
        var realSelector = this.currentSelector.replace(/\$.*/, ''),
            useClipping = this.currentSelector.endsWith('WITH_CLIPPING');

        this[this.currentSelector] = this[realSelector].curry(useClipping);
    },
    tearDown: function($super) {
        $super();
        delete this[this.currentSelector];
    },
    allTestSelectors: function($super) {
        var methodNames = $super();
        return []
            .concat(methodNames.collect(function(ea) { return ea + '$WITHOUT_CLIPPING'}))
            .concat(methodNames.collect(function(ea) { return ea + '$WITH_CLIPPING'}));
    },
},
'testing', {
    test01OriginAffectsInnerBoundsButNotBounds: function(useClipping) {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.bounds(), 'bounds before')
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.innerBounds(), 'innerbounds before');

        if (useClipping)
            morph.applyStyle({clipMode : 'hidden'})

        morph.adjustOrigin(pt(10,10));
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.bounds(), 'bounds after')
        this.assertEquals(new Rectangle(-10, -10, 100, 20), morph.innerBounds(), 'innerbounds after');
    },
    test02OriginAffectsTransform: function(useClipping) {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);

        if (useClipping)
            morph.applyStyle({clipMode : 'hidden'})

        morph.adjustOrigin(pt(50,10));
        this.assertEquals(pt(50,10), morph.getTransform().transformPoint(pt(0,0)));
    },
    test02bOriginDoesNotAffectGlobalPositionOfSubmorphs: function(useClipping) {
        var morph1 = lively.morphic.Morph.makeRectangle(10, 10, 100, 20),
            morph2 = lively.morphic.Morph.makeRectangle(10, 10, 10, 10);
        this.world.addMorph(morph1);
        morph1.addMorph(morph2);
        this.assertEquals(pt(10,10), morph1.worldPoint(pt(0,0)));
        this.assertEquals(pt(20,20), morph2.worldPoint(pt(0,0)));

        if (useClipping)
            morph1.applyStyle({clipMode : 'hidden'})

        morph1.adjustOrigin(pt(50,10));
        // pos of morph with origin is affected
        this.assertEquals(pt(60,20), morph1.worldPoint(pt(0,0)), 'owner global pos');
        // submorph pos stays where it was
        this.assertEquals(pt(20,20), morph2.worldPoint(pt(0,0)), 'sub global pos');
    },

    test03aRotationUsesOrigin: function(useClipping) {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.world.addMorph(morph);

        if (useClipping)
            morph.applyStyle({clipMode : 'hidden'});

        morph.adjustOrigin(pt(50, 10));
        morph.rotateBy((90).toRadians());

        this.assertEquals(rect(pt(40, -40), pt(60, 60)), morph.bounds());
    },
    test03bRotateadjustOriginRotateAgain: function(useClipping) {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.world.addMorph(morph);

        if (useClipping)
            morph.applyStyle({clipMode : 'hidden'});

        morph.setRotation((90).toRadians()); // apply some transformation
        morph.adjustOrigin(pt(50, 10)); // coordinates local to morph
        this.assertEqualsEpsilon(rect(pt(-20, 0), pt(0, 100)), morph.bounds(), 'adjustOrigin wrong');

        morph.setRotation(0);

        this.assertEquals(pt(-60, 40).extent(pt(100,20)), morph.bounds());
    },
    test04ModifyOriginWithScale: function(useClipping) {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 50, 10);
        this.world.addMorph(morph);

        if (useClipping)
            morph.applyStyle({clipMode : 'hidden'});

        morph.setScale(2)
        morph.adjustOrigin(pt(25, 5)); // set origin is in local shape coordinates
        morph.rotateBy((90).toRadians());

        this.assertEquals(rect(pt(40, -40), pt(60, 60)), morph.getBounds());
    },
    test05aAddMorphWithModifiedOrigin: function(useClipping) {
        var m1 = new lively.morphic.Morph.makeRectangle(0,0,50,50),
            m2 = new lively.morphic.Morph.makeRectangle(10,10,40,40);
        this.world.addMorph(m1);
        this.world.addMorph(m2);

        m1.adjustOrigin(pt(25,25));
        if (useClipping)
            m1.setClipMode('hidden');

        // tets if transformForNewOwner works correctly
        m1.addMorph(m2);

        // new spec by Dan: if you add m2 to m1, it should keep its position relative to $world
        this.assertEquals(pt(-15,-15), m2.getPosition(), 'submorph should not have been moved');
    },
    test06addRectangleToEllipse: function(useClipping) {
        var ellipse = new lively.morphic.Morph.makeEllipse(new Rectangle(0,0,100,100));
        var rectangle = new lively.morphic.Morph.makeRectangle(new Rectangle(0,0,100,100));
        ellipse.addMorph(rectangle);
        rectangle.setPosition(pt(0,0));

        var rPos = rectangle.getPositionInWorld();
        var ePos = ellipse.getPositionInWorld().addPt(ellipse.getOrigin());
        this.assertEquals(rPos.x, ePos.x);
        this.assertEquals(rPos.y, ePos.y);
    }

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ScrollTests',
'running', {
    setUp: function($super) {
        $super();
        this.text = new lively.morphic.Text(new Rectangle(0,0, 60, 200));
        this.world.addMorph(this.text);
        this.text.applyStyle({clipMode: 'scroll', fixedHeight: true})

        // 10x test, 9x \n\n\n
        var str = Array.range(1,10).collect(function(i) { return 'test'+i }).join('\n\n\n')
        this.text.setTextString(str);
    },
},
'testing', {

    test01ScrollSelectionAtBottomIntoView: function() {
        var m = this.text;
        m.setBorderWidth(0);

        // scroll down to be in scroll bounds
        m.setScroll(0, 0) // scroll to top
        m.setSelectionRange(m.textString.length-6,m.textString.length) // select"test10"
        m.scrollSelectionIntoView()
        // FIXME we might not want this test to make any assumptions about font sizes etc?!
        this.assert(m.getScroll()[1] > 180, 'does not scroll down');
        //this.assertMatches([0, 239], m.getScroll(), 'does not scroll down');

        // scroll up to be in scroll bounds
        m.setSelectionRange(0,5) // select "test1"

        m.scrollSelectionIntoView()
        this.epsilon = 5;
        this.assertEquals(0, m.getScroll()[1], 'does not scroll up');
    },
    test02ScrollWorld: function() {
        this.world.setExtent(pt(10000, 10000));
        this.world.setScroll(0, 0);
        this.world.setScroll(0, 10);
        this.world.setScroll(0, 10)

        this.assertMatches([0,10], this.world.getScroll())
    },

});


lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ClipMorphTest',
'testing', {
    test01ClipModeHTML: function() {
        var m1 = new lively.morphic.Morph.makeRectangle(0,0,50,50);
        m1.setFill(Color.red);
        m1.setClipMode('hidden');
        var expected = {
            tagName: 'div',
            childNodes: [{
                tagName: 'div', // m1's shape
                style: {overflow: 'hidden', backgroundColor: Color.red.toString()}
            }]
        }
        this.assertNodeMatches(expected, m1.renderContext().getMorphNode());
    },
    test02DisableClipModeRemovesElement: function() {
        var m1 = new lively.morphic.Morph.makeRectangle(0,0,50,50);
        m1.setFill(Color.red);
        m1.setClipMode('hidden');
        m1.setClipMode('visible');
        var expected = {
            tagName: 'div',
            childNodes: [{
                tagName: 'div', // m1's shape node
                style: {backgroundColor: Color.red.toString()}
            }]
        }
        this.assertNodeMatches(expected, m1.renderContext().getMorphNode());
    },
    test03NewMorphsAreAppendedToClipNode: function() {
        var m1 = new lively.morphic.Morph.makeRectangle(0,0,50,50),
            m2 = new lively.morphic.Morph.makeRectangle(0,0,50,50);
        m2.setFill(Color.red);
        m1.setClipMode('hidden');
        m1.addMorph(m2);
        var expected = {
            tagName: 'div', // m1
            childNodes: [{
                tagName: 'div', // m1's shape
                style: {overflow: 'hidden'},
                childNodes: [
                    {tagName: 'div', /* m1's submorphNode */ childNodes: [
                        {tagName: 'div', /* m2 */ childNodes: [{
                            tagName: 'div', // m2's shape
                            style: {backgroundColor: Color.red.toString()}
                        }]
                    }]
                }]
            }]
        }
        this.assertNodeMatches(expected, m1.renderContext().getMorphNode());
    },
    test04aBoundsWithClipModeAndOrigin: function() {
        var m1 = new lively.morphic.Morph.makeRectangle(0,0,50,50);
        this.world.addMorph(m1);

        m1.setClipMode('hidden');
        m1.adjustOrigin(pt(25,25));
        this.assertEquals(pt(25,25), m1.getPosition(), 'pos');
        this.assertEquals(new Rectangle(0,0,50,50), m1.bounds(), 'bounds');
    },
    test04bBoundsWithoutClipModeAndWithOrigin: function() {
        var m1 = new lively.morphic.Morph.makeRectangle(0,0,50,50);
        this.world.addMorph(m1);

        m1.adjustOrigin(pt(25,25));
        this.assertEquals(pt(25,25), m1.getPosition(), 'pos');
        this.assertEquals(new Rectangle(0,0,50,50), m1.bounds(), 'bounds');
    },
    test04cBoundsWithClipModeAndOriginAndSubmorph: function() {
        var m1 = new lively.morphic.Morph.makeRectangle(0,0,50,50),
            m2 = new lively.morphic.Morph.makeRectangle(10,10,40,40);;
        this.world.addMorph(m1);
        m1.addMorph(m2);

        m1.setClipMode('hidden');
        m1.adjustOrigin(pt(25,25));
        this.assertEquals(pt(25,25), m1.getPosition(), 'pos');
        this.assertEquals(new Rectangle(0,0,50,50), m1.bounds(), 'bounds');
    },
    test05aadjustOriginAndEnableClipping: function() {
        var m1 = new lively.morphic.Morph.makeRectangle(0,0,50,50),
            m2 = new lively.morphic.Morph.makeRectangle(10,10,40,40);
        this.world.addMorph(m1);
        m1.addMorph(m2);

        m1.adjustOrigin(pt(25,25));
        m1.setClipMode('hidden');
        this.assertEquals(pt(25,25), m1.getPosition(), 'pos');
        this.assertEquals(new Rectangle(0,0,50,50), m1.bounds(), 'bounds');
        this.assertEquals(pt(-15,-15), m2.getPosition(), 'pos sub');
    },

    test06OriginAffectsInnerBoundsButNotBounds: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 20);
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.bounds(), 'bounds before')
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.innerBounds(), 'innerbounds before');
        morph.applyStyle({clipMode : 'hidden'});
        morph.adjustOrigin(pt(10,10));
        this.assertEquals(new Rectangle(0, 0, 100, 20), morph.bounds(), 'bounds after')
        this.assertEquals(new Rectangle(-10, -10, 100, 20), morph.innerBounds(), 'innerbounds after');
    },

    test07TransformIncludesScrolling: function() {
        var m1 = new lively.morphic.Morph.makeRectangle(10,10,40,40),
            m2 = new lively.morphic.Morph.makeRectangle(10,10,60,60);
        this.world.addMorph(m1);
        m1.setClipMode('scroll');
        m1.addMorph(m2);
        this.assertEquals(pt(10,10), m2.localize(pt(30, 30)));
        m1.setScroll(10, 0);
        this.assertEquals(pt(20,10), m2.localize(pt(30, 30)));
    }

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.AccordionTests',
'running', {
    setUp: function($super) {
        $super();
        this.accordion = new lively.morphic.Accordion();
        this.accordion.openInWorld();
    },
    tearDown: function($super) {
        $super();
        this.accordion.remove();
    },
},
'testing', {
    testAddSection: function() {
        var foo = this.accordion.addSection('Foo');
        this.assertEquals(2, this.accordion.submorphs.length);
        this.assert(this.accordion.submorphs[0] instanceof lively.morphic.Text);
        this.assertEquals('▼ Foo', this.accordion.submorphs[0].textString);
        this.assertIdentity(foo, this.accordion.submorphs[1]);
        this.assertIdentity(this.accordion.activeSection, this.accordion.submorphs[0]);
    },
    testSwitchSections: function() {
        this.accordion.addSection('Foo');
        this.accordion.addSection('Bar');
        var foo = this.accordion.submorphs[0];
        var bar = this.accordion.submorphs[2];
        this.assertEquals(4, this.accordion.submorphs.length);
        this.assertEquals('▼ Foo', foo.textString);
        this.assertEquals('► Bar', bar.textString);
        this.assertIdentity(foo, this.accordion.activeSection);
        this.accordion.activateSection(bar);
        this.assertIdentity(bar, this.accordion.activeSection);
    }
});

}) // end of module
