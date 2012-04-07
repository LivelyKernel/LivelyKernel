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
debugger
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
        this.assertEquals(rect(pt(-20, 0), pt(0, 100)), morph.bounds(), 'adjustOrigin wrong')

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


});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.TextLayoutTests',
'running', {
    setUp: function($super) {
        $super();
        this.text = new lively.morphic.Text(new Rectangle(0,0,100,100), '')
            .applyStyle({
                padding: new Rectangle(0,0,0,0),
                borderWidth: 0,
                fontSize: 10,
                fontFamily: 'monospace',
                fixedWidth: false, fixedHeight: false
            });
        this.world.addMorph(this.text);
    },
},
'testing', {
    test01ComputVisibleTextBounds: function() {
        this.assertEquals(this.text.innerBounds(), this.text.visibleTextBounds());
        this.text.applyStyle({padding: Rectangle.inset(2,2)});
        this.assertEquals(this.text.innerBounds().insetBy(2), this.text.visibleTextBounds());

        // FIXME: text bounds are not correct at the moment, not specified

        // IMO: in contrast to other morphs the border of a text should not grow inwards, i.e. should not decrease extent and font size of a text.
        // i especially don't want to resize text after i added a border.

        // this.text.applyStyle({borderWidth: 3});
        // this.assertEquals(this.text.innerBounds().insetBy(2+3), this.text.visibleTextBounds());
    },
    test02ExtentIsNotChangedWhenPaddingIsSet: function() {
        this.text.setPadding(Rectangle.inset(2,2));
        this.assertEquals(this.text.getExtent(), this.text.getScrollExtent(), 'visible extent not equal to logical extent');
    },

    test03FixedWidthForcesLineBreaks: function() {
        this.text.setTextString('aaa');
        this.epsilon = 4;
        this.assertEqualsEpsilon(pt(24, 15), this.text.getTextExtent(), 'setup does not work');
        this.text.applyStyle({fixedWidth: true, fixedHeight: false});
        this.text.setExtent(pt(20,15));
        // text's span is 16 then, but text itself 20
        this.assertEqualsEpsilon(pt(20, 30), this.text.getTextExtent(), 'no line break');
    },
    test03aFixedWidthCssProperties: function() {
        this.text.setTextString('aaa');
        this.text.applyStyle({fixedWidth: true, fixedHeight: false});
        this.text.setExtent(pt(20,15));
        var expected = {
            tagName: 'div', // world morph
            childNodes: [
                {tagName: 'div', childNodes: [ // world shape
                    {tagName: 'div',
                     childNodes: [{tagName: 'span'}],
                     style: {maxWidth: '20px'}} // m and its shape
                ]},
            ]};

        this.assertNodeMatches(expected, this.text.renderContext().getMorphNode());
    },

    test04FixedWidthIncreasesTextExtent: function() {
        this.epsilon = 2;
        this.text.setTextString('aaa');

        this.text.fit();

        this.assertEqualsEpsilon(pt(24, 15), this.text.getTextExtent(), 'hmm setup does not work');
        this.text.applyStyle({fixedWidth: true, fixedHeight: false});
        this.text.setExtent(pt(40,15))
        this.assertEqualsEpsilon(pt(40, 15), this.text.getTextExtent(), 'text extent didnt grow');
    },
    test05FillWithBigAndThenWithSmallTextResizesTextBounds: function() {
        this.text.applyStyle({fixedWidth: true, fixedHeight: true, clipMode: 'visible'});
        this.text.setExtent(pt(50,50)); // actually should not be neccessary, but this is the feature we want to implement...
        this.epsilon = 2;
        this.text.textString = 'aaa';
        this.assertEqualsEpsilon(pt(50,15), this.text.getTextExtent(), 'hmm setup does not work');

        // make text big, should grow vertically
        this.text.setTextString('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        //this.assertEquals(pt(50.0,75.0), this.text.getTextExtent(), 'hmm setup does not work 2');
        this.assertEquals(this.text.getTextExtent().x, 50.0, 'text should not have grown horizontally');
        this.assert(this.text.getTextExtent().y >= 75.0, 'text should have grown vertically (actual height: ' + this.text.getTextExtent().y + '), was expected to be at least 75.0');

        // make text small, vertical extent should shrink
        this.text.textString = 'aaa';
        this.assertEqualsEpsilon(pt(50,15), this.text.getTextExtent(), 'text extent did not shrink');
    },



});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.Morphic2.HtmlParserTests',
'running', {
    setUp: function($super) {
        $super();
        this.sut = lively.morphic.HTMLParser
    },
},
'testing', {
    testSanitizeHtml: function() {
        var s1 = "a<br>b"
        var r1 = this.sut.sanitizeHtml(s1)
        this.assertEquals(r1, "a<br />b")
    },
    testSanitizeHtmlReplaceAmp: function() {
        var s1 = "a&b"
        var r1 = this.sut.sanitizeHtml(s1)
        this.assertEquals(r1, "a&amp;b")
    },
    testSanitizeHtmlUnbalancedTags: function() {
        var s1 = "<span>abc",
            r1 = this.sut.sanitizeHtml(s1);
        this.assertEquals(r1, "abc");
    },

    testSourceCodeToNodeStrippedBRs: function() {
      var node = lively.morphic.HTMLParser.sourceToNode('a<br />b')
      lively.morphic.HTMLParser.sanitizeNode(node);
      this.assertEquals(node.textContent, "ab", "wrong node")

      richText = new lively.morphic.RichText(node.textContent);
      this.assertEquals(richText.textString, "ab", "wrong text string")
    },

    testSanitizeNode: function() {
        var s = "<html>\n<body>\n<!--StartFragment-->\n"
                + "<span>a\nb</span>\n"
                + "<!--EndFragment-->\n</body>\n</html>";
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "a\nb", "too many newlines");
    },
    testSanitizeNodeWithNewlineInSpan: function() {
        var s = '<span>a</span><span>\n</span><span>b</span>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "a\nb", "wrong newlines");
    },
    testSanitizeNodeWindowsChromeWithNewLine: function() {
        var s = '<html>\n<body>\n<!--StartFragment-->\n<span>hello\n</span><br class="Apple-interchange-newline">\n<!--EndFragment-->\n</body>\n</html>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "hello\n", "wrong newlines");
    },
    testSanitizeNodeLinuxWithMetaTag: function() {
        var s = '<meta ><span>bombs</span>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "bombs", "linux meta tag brakes it");
    },

    testSourceToNodeCallsAlert: function(data) {
        var orgAlert = Global.alert;
        try {
            var here=false;
            alert = function() { here=true}
            var s = 'hello<badtag>bla'
            var node = lively.morphic.HTMLParser.sourceToNode(s);
            this.assert(here,"alert did not get called")
        } finally {
            Global.alert = orgAlert
        }
    },
    testSanitizeNodeWithAmp: function() {
        var s = '<a href="http://host/p?a=1&b=2">bla</a>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "bla", "pasting with & is broken");
    },
    testSanitizeNodeWithAmp2: function() {
        var s = '<a href="http://host/p?a=1%26b=2">H&amp;M</a>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "H&M", "pasting with & is broken");
    },
    testSanitizeNodeWithLt: function() {
        var s = '1&lt;2';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "1<2", "pasting with & is broken");
    },

    testSanitizeNodeWithLt2: function() {
        var s = '<span>&lt;</span>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "<", "pasting with < is broken");
    },


});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.jQueryTests', {
    test01jQueryReturnsjQueryObject: function() {
        var m = new lively.morphic.Morph();
        this.assert(m.jQuery() instanceof jQuery);
    },
    test02jQueryReturnsWrappedShapeNode: function() {
        var m = new lively.morphic.Morph();
        this.assertEquals(m.jQuery()[0], m.renderContext().shapeNode)
    }
});

}) // end of module
