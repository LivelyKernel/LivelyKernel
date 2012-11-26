module('lively.morphic.tests.Morphic').requires('lively.morphic.tests.Helper', 'lively.morphic.Layout').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.WorldTests',
'testing', {
    testAddWorldToDoc: function() {
        var canvasNode = document.body, bounds = new Rectangle(0, 0, 100, 100),
            world = new lively.morphic.World();
        try {
            world.setBounds(bounds);
            world.displayOnCanvas(canvasNode);

            var expected = {tagName: 'div', parentNode: canvasNode, childNodes: [{tagName: 'div'}]};
            this.assertNodeMatches(expected, world.renderContext().getMorphNode());
        } finally {
            world.remove();
        }
    }
});


lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.Morphic.BasicFunctionality',
'testing', {
    test01AddMorph: function() {
        var m = new lively.morphic.Morph()
        this.world.addMorph(m);
        this.assert(this.world.submorphs.include(m), 'not in submorphs');
        this.assertIdentity(this.world, m.owner, 'owner');
        var expected = {
            tagName: 'div', // world morph
            childNodes: [{tagName: 'div', childNodes: [ // origin node
                {tagName: 'div', childNodes: [ // world shape
                    {tagName: 'div', childNodes: [{tagName: 'div'}]}, // m and its shape
                    {tagName: 'div', childNodes: [{tagName: 'div'}]}  // hand and its shape
                ]}
            ]}]};
        this.assertNodeMatches(expected, this.world.renderContext().getMorphNode());
    },

    test02aUseSVGRenderer: function() {
        var m = new lively.morphic.Morph()
        this.world.addMorph(m);
        m.renderUsing(new lively.morphic.SVG.RenderContext());

        var expected = {
            tagName: 'div', // world
            childNodes: [
                {tagName: 'div', childNodes: [ // shape
                    {tagName: 'div'}, // hand
                    {tagName: 'svg', // submorph
                        childNodes: [{tagName: 'g', childNodes: [{tagName: 'rect'}]}]}
                ]} // world's shape
            ]
        };
        this.assertNodeMatches(expected, this.world.renderContext().getMorphNode());
    },

    test03MorphWithSVGEllipse: function() {
        var m = new lively.morphic.Morph()
        this.world.addMorph(m);
        m.renderUsing(new lively.morphic.SVG.RenderContext())
        m.setShape(new lively.morphic.Shapes.Ellipse(new Rectangle(0,0, 30, 30)));
        var expected = {
            tagName: 'div',
            childNodes: [
                {tagName: 'div', childNodes: [ // shape
                    {tagName: 'div'}, // hand
                    {tagName: 'svg',
                        childNodes: [{tagName: 'g', childNodes: [{tagName: 'ellipse'}]}]}
                ]},
            ]
        };
        this.assertNodeMatches(expected, this.world.renderContext().getMorphNode());
    },


    test04MorphLocalize: function() {
        var morph1 = new lively.morphic.Morph(),
            morph2 = new lively.morphic.Morph();
        this.world.addMorph(morph1);
        morph1.addMorph(morph2);
        morph2.setPosition(pt(10,10));
        this.assertEquals(pt(0,0), morph2.localize(pt(10,10)));
    },

    test04AddMorphBefore: function() {
        var morph1 = new lively.morphic.Morph(),
            morph2 = new lively.morphic.Morph(),
            morph3 = new lively.morphic.Morph();
        // Colors to identify the morphs are in correct order
        morph1.setFill(Color.green);
        morph2.setFill(Color.blue);
        morph3.setFill(Color.yellow);
        this.world.addMorph(morph1);
        this.world.addMorph(morph2);
        this.world.addMorph(morph3, morph2);

        morph1.setExtent(pt(200, 200))
        morph2.setExtent(pt(100, 150))
        morph3.setExtent(pt(150, 100))

        // order back to front: morph1, morph3, morph2
        /*var expected = {
            tagName: 'div', // morphNode
            childNodes: [{tagName: 'div', childNodes: [ // shape
                {tagName: 'div', childNodes: [ // submorphNode
                    {tagName: 'div', childNodes: [{tagName: 'div', style: {'backgroundColor': morph1.getFill().toString()}}]},
                    {tagName: 'div', childNodes: [{tagName: 'div', style: {'backgroundColor': morph3.getFill().toString()}}]},
                    {tagName: 'div', childNodes: [{tagName: 'div', style: {'backgroundColor': morph2.getFill().toString()}}]},
                    {tagName: 'div'} // hand
                ]}
            ]}]
        }

        this.assertNodeMatches(expected, this.world.renderContext().getMorphNode());*/
    },

    test08aCreateMorphWithLinearGradient: function() {
        var morph = new lively.morphic.Morph();
        this.world.addMorph(morph);
        morph.setFill(new lively.morphic.LinearGradient(
            [{offset: 0, color: Color.red}, {offset: 0.8, color: Color.green}], "northSouth"));
        var expected = {
            tagName: 'div',
            childNodes: [{
                tagName: 'div', // morph's shape
                style: {'background': "-webkit-gradient(linear,0%0%,0%100%,from(rgb(204,0,0)),color-stop(0.8,rgb(0,204,0)))"}
            }]
        }
        if (jQuery.browser.mozilla) {
            expected = {
            tagName: 'div',
            childNodes: [{
                    tagName: 'div', // morph's shape
                    style: {'background': "-moz-linear-gradient(90deg,rgb(204,0,0)0%,rgb(0,204,0)80%)repeatscroll0%0%transparent"}

                }]}
        }
        this.assertNodeMatches(expected, morph.renderContext().getMorphNode());
    },

    test08bCreateMorphWithradialGradient: function() {
        var morph = new lively.morphic.Morph.makeRectangle(0,0,50,50);
        this.world.addMorph(morph);
        morph.setFill(new lively.morphic.RadialGradient(
            [{offset: 0, color: Color.red}, {offset: 0.8, color: Color.green}], pt(0.5,0.3)));
        var expected = {
            tagName: 'div',
            childNodes: [{
                tagName: 'div', // morph's shape
                style: {'background': "-webkit-gradient(radial,50%30%,0,50%50%,25,from(rgb(204,0,0)),color-stop(0.8,rgb(0,204,0)))"}
            }]
        }
        if (jQuery.browser.mozilla) {
            expected = {
            tagName: 'div',
            childNodes: [{
                tagName: 'div', // morph's shape
                style: {'background': "-moz-radial-gradient(50%50%,circlefarthest-corner,rgb(204,0,0)0%,rgb(0,204,0)80%)repeatscroll0%0%transparent"}
            }]
            }
        }
        this.assertNodeMatches(expected, morph.renderContext().getMorphNode());
    },

    test09BorderColorAndWidth: function() {
        var morph = new lively.morphic.Morph.makeRectangle(0,0,50,50);
        this.world.addMorph(morph);
        morph.setBorderColor(Color.green);
        morph.setBorderWidth(2.5);
        morph.setStrokeOpacity(0.5);
        var expected = {
            tagName: 'div',
            childNodes: [{
                tagName: 'div', // morph's shape
                style: {
                    // FIXME float conversion in style makes it hard to test directly
                    'border': function(result) {  // "2.5px solid rgba(0,204,0,0.5)"
                        return result.include('2.5px') && result.include('solid') && result.include('rgba(0,204')
                    }
                }
            }]
        }
        this.assertNodeMatches(expected, morph.renderContext().getMorphNode());
    },

    test10BorderRadiusHTML: function() {
        var morph = new lively.morphic.Morph.makeRectangle(0,0,50,50);
        this.world.addMorph(morph);
        morph.setBorderRadius(3.5);
        var expected = {
            tagName: 'div',
            childNodes: [{
                tagName: 'div', // morph's shape
                style: {    'border-top-left-radius': '3.5px3.5px'}
            }]
        }
        if (jQuery.browser.mozilla) {
            expected = {
                tagName: 'div',
                childNodes: [{tagName: 'div',
                            style: {"borderRadius": "3.5px3.5px3.5px3.5px"}}]
            }
        }
        this.assertNodeMatches(expected, morph.renderContext().getMorphNode());
    },

    test18OrderOfMorphsOnScrennAndInSubmorphArrayMatches: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0, 0, 100, 100),
            morph2 = lively.morphic.Morph.makeRectangle(0, 0, 100, 100);

        this.world.addMorph(morph1);
        this.world.addMorphBack(morph2);

        this.assertIdentity(this.world.submorphs[0], morph2, 'morph2 not @0')
        this.assertIdentity(this.world.submorphs[1], morph1, 'morph1 not @1')
    },

    test20setScalePointHTML: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 10, 10);
        morph.setScale(pt(2,3));
        this.assertEquals(pt(2,3), morph.getScale());
        this.assertEquals(pt(2,3), morph.getTransform().getScalePoint());
        var ctxt = morph.renderContext(),
            transformProp = ctxt.domInterface.html5TransformProperty;
        this.assert(/scale.+2.+3/, ctxt.morphNode.style[transformProp],
                    'css transform prop does not match');
    },

    test21addMorphSameOwner: function() {
        var m = lively.morphic.Morph.makeRectangle(rect(0,0,3,3));
        var o = lively.morphic.Morph.makeRectangle(rect(0,0,10,10));
        o.rotateBy(1);
        o.addMorph(m);
        this.assert(!m.hasOwnProperty("_Rotation"), 'new morph has no rotation initially');
        this.assertEquals(0, m.getRotation(), 'new morph has no rotation initially');
        o.addMorph(m); // same owner
        this.assert(!m.hasOwnProperty("_Rotation"), 'has still no rotation after adding');
        this.assertEquals(0, m.getRotation(), 'has still no rotation after adding');
    },

    test22addMorphDifferentOwner: function() {
        var m = lively.morphic.Morph.makeRectangle(rect(0,0,3,3));
        var o = lively.morphic.Morph.makeRectangle(rect(0,0,10,10));
        o.rotateBy(1);
        this.world.addMorph(m);
        o.addMorph(m); // different owner
        this.assert(m.hasOwnProperty("_Rotation"), 'morph has a rotation after adding');
        this.assertEquals(-1, m.getRotation(), 'morph has inverse rotation after adding');
    }

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MorphicBounds',
"testing", {

    testMorphBounds: function() {
        var morph1 = new lively.morphic.Morph(),
            morph2 = new lively.morphic.Morph();
        this.world.addMorph(morph1);
        morph1.addMorph(morph2);
        morph1.setBounds(rect(100, 100, 40, 40));
        morph2.setBounds(rect(20, 10, 40, 40));
        this.assertEquals(rect(100, 100, 60, 50), morph1.getBounds());
    },

    testMorphBoundsOnCreation: function() {
        var bounds = rect(30, 90, 30, 60),
            shape = new lively.morphic.Shapes.Rectangle(bounds);
        this.assertEquals(bounds, shape.getBounds(), 'shape bounds');
        var morph = new lively.morphic.Morph(shape);
        this.assertEquals(bounds, morph.getBounds(), 'morph bounds');
    },

    testMorphBoundsChangeOnExtentPositionScaleRotationTransformChanges: function() {
        this.epsilon = 0.01;
        var morph = new lively.morphic.Morph();
        morph.setBounds(rect(100, 100, 40, 40));
        this.assertEquals(rect(100, 100, 40, 40), morph.getBounds(), "setBounds");
        morph.setExtent(pt(50,50));
        this.assertEquals(rect(100, 100, 50, 50), morph.getBounds(), "setExtent");
        morph.setPosition(pt(150,50));
        this.assertEquals(rect(150, 50, 50, 50), morph.getBounds(), "setPosition");
        morph.setScale(2);
        this.assertEquals(rect(150, 50, 100, 100), morph.getBounds(), "setScale");
        morph.setTransform(new lively.morphic.Similitude(pt(0,0)));
        this.assertEquals(rect(0,0 , 50, 50), morph.getBounds(), "setTransform");
        morph.rotateBy((45).toRadians());
        this.assertEquals(rect(-35.36, 0, 70.71, 70.71), morph.getBounds(), "setRotation");
    },

    testBorderWidthDoesNotAffectsBounds: function() {
        var morph = new lively.morphic.Morph();
        morph.setBounds(rect(100, 100, 40, 40));
        morph.setBorderWidth(4);
        this.assertEquals(rect(100, 100, 40, 40), morph.getBounds());
    },

    testSubmorphsAffectBounds: function() {
        var morph1 = new lively.morphic.Morph(),
            morph2 = new lively.morphic.Morph();
        morph1.setBounds(rect(100, 100, 40, 40));
        this.assertEquals(rect(100, 100, 40, 40), morph1.getBounds());
        morph2.setBounds(rect(-10,0, 20, 50));
        morph1.addMorph(morph2);
        this.assertEquals(rect(90, 100, 50, 50), morph1.getBounds());
        morph2.remove();
        this.assertEquals(rect(100, 100, 40, 40), morph1.getBounds());
    }

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MorphsContainingPoint',
"testing", {
    testMorphsContainingPoint: function() {
        var morph = lively.morphic.Morph.makeRectangle(0, 0, 100, 100),
            submorph = lively.morphic.Morph.makeRectangle(20, 20, 30, 30),
            subsubmorph = lively.morphic.Morph.makeRectangle(25, 25, 5, 5),
            morph2 = lively.morphic.Morph.makeRectangle(48, 48, 100, 100);
        this.world.addMorph(morph)
        morph.addMorph(submorph)
        submorph.addMorph(subsubmorph)
        this.world.addMorph(morph2)

        var result, expected;

        result = morph.morphsContainingPoint(pt(-1,-1));
        this.assertEquals(0, result.length, 'for ' + pt(-1,-1));

        result = morph.morphsContainingPoint(pt(1,1));
        this.assertEquals(1, result.length, 'for ' + pt(1,1));
        this.assertEquals(morph, result[0], 'for ' + pt(1,1));

        result = morph.morphsContainingPoint(pt(40,40));
        this.assertEquals(2, result.length, 'for ' + pt(40,40));
        this.assertEquals(submorph, result[0]);
        this.assertEquals(morph, result[1]);

        result = morph.morphsContainingPoint(pt(45,45));
        this.assertEquals(3, result.length, 'for ' + pt(45,45));
        this.assertEquals(subsubmorph, result[0]);
        this.assertEquals(submorph, result[1]);
        this.assertEquals(morph, result[2]);

        result = this.world.morphsContainingPoint(pt(48,48));
        this.assertEquals(5, result.length, 'for ' + pt(48,48));
        this.assertEquals(morph2, result[0]);
        this.assertEquals(subsubmorph, result[1]);
        this.assertEquals(submorph, result[2]);
        this.assertEquals(morph, result[3]);
        this.assertEquals(this.world, result[4]);
    },

    testMorphsContainingPointWithAddMorphFront: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0, 0, 100, 100),
            morph2 = lively.morphic.Morph.makeRectangle(0, 0, 100, 100);

        this.world.addMorph(morph1);
        this.world.addMorphBack(morph2);

        var result = this.world.morphsContainingPoint(pt(1,1));
        this.assertEquals(3, result.length);

        this.assertEquals(morph1, result[0], 'for ' + pt(1,1));
        this.assertEquals(morph2, result[1], 'for ' + pt(1,1));
    },

    testMorphsContainingPointDoesNotIncludeOffsetedOwner: function() {
        var owner = lively.morphic.Morph.makeRectangle(0, 0, 100, 100),
            submorph = lively.morphic.Morph.makeRectangle(110, 10, 90, 90),
            other = lively.morphic.Morph.makeRectangle(100, 0, 100, 100);

        owner.name = 'owner'; submorph.name = 'submorph'; other.name = 'other';
        this.world.addMorph(owner)
        owner.addMorph(submorph)
        this.world.addMorphBack(other)

        var result = this.world.morphsContainingPoint(pt(150,50));
        this.assertEquals(3, result.length, 'for ' + pt(150,50));
        this.assertEquals(this.world, result[2], 'for 2');
        this.assertEquals(other, result[1], 'for 1');
        this.assertEquals(submorph, result[0], 'for 0');
    }

});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.MorphInterfaceTests',
'testing', {
    testWithAllSubmorphsDetect: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph(),
            m3 = new lively.morphic.Morph(),
            m4 = new lively.morphic.Morph();
        m1.addMorph(m2);
        m2.addMorph(m3);
        m2.addMorph(m4);
        m3.shouldBeFound = true;
        var result = m1.withAllSubmorphsDetect(function(m) { return m.shouldBeFound });
        this.assertIdentity(m3, result);
    },

    testSelectSubmorphs: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph(),
            m3 = new lively.morphic.Morph(),
            m4 = new lively.morphic.Morph();
        m1.addMorph(m2);
        m2.addMorph(m3);
        m2.addMorph(m4);
        m3.shouldBeFound = true;
        var result = m1.selectSubmorphs({shouldBeFound: true});
        this.assertEquals([m3], result);
    }
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.CopyMorphTests',
'testing', {
    test01CopySimpleMorph: function() {
        var m = new lively.morphic.Morph()
        m.setBounds(new Rectangle(100, 100, 40, 40));
        var m2 = m.copy();
        this.assert(m !== m2, 'copied morph is identical to original morph')
        this.assertEquals(new Rectangle(100, 100, 40, 40), m2.getBounds());
    },

    test02ReferencedMorphThatIsNotASubmorphIsNotCopied: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph(),
            m3 = new lively.morphic.Morph();
        m1.addMorph(m2)
        m1.other = m3;
        this.world.addMorph(m3);
        var copy = m1.copy();
        this.assert(copy !== m1, 'copied morph is identical to original morph');
        this.assert(copy.submorphs[0] instanceof lively.morphic.Morph, 'submorph not copied');
        this.assert(copy.submorphs[0] !== m2, 'copied submorph is identical to original submorph');
        this.assert(copy.other === m3, 'referenced morph that is not a submorph is not identical')
    },

    test02bReferencedMorphThatIsNotASubmorphButIsNotInTheWorldIsCopied: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph(),
            m3 = new lively.morphic.Morph();
        this.world.addMorph(m1);
        m2.addMorph(m3);
        m1.ref = m2;
        var copy = m1.copy();
        this.assert(copy.ref instanceof lively.morphic.Morph, 'ref not copied');
        this.assert(copy.ref !== m2, 'copied submorph is identical to original submorph');
        this.assert(copy.ref.submorphs[0] instanceof lively.morphic.Morph, 'm3 not copied');
        this.assert(copy.ref.submorphs[0] !== m3, 'm3 copied is identical to m3');
    },

    test03OwnerIsNotCopied: function() {
        var m = new lively.morphic.Morph();
        this.world.addMorph(m);
        var copy = m.copy();
        this.assert(!copy.owner, 'owner was copied');
    },

    test04CopyMorphTreeWithEventHandlers: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph(),
            m3 = new lively.morphic.Morph();
        m1.enableGrabbing();
        m2.enableGrabbing();
        m3.enableGrabbing();
        m1.addMorph(m2)
        m2.addMorph(m3)
        this.world.addMorph(m1);
        var copy = m1.copy();
        this.world.addMorph(copy);
        this.assertEquals(2+1, this.world.submorphs.length); // +1 for hand
        this.assertEquals(1, copy.submorphs.length);
        this.assertEquals(1, copy.submorphs[0].submorphs.length);
    },

    test05CopySetsNewTargetForScripts: function() {
        var m1 = new lively.morphic.Morph();
        m1.startStepping(20, 'rotateBy', 0.1);
        var copy = m1.copy();

        this.assertIdentity(m1, m1.scripts[0].target, 'original target changed');
        this.assertIdentity(copy, copy.scripts[0].target, 'copy target changed');
    },
    test06KeepReferenceToOtherMorphs: function() {
        var m = new lively.morphic.Morph();
        var m2 = new lively.morphic.Morph();
        connect(m, 'a', m2, 'b');
        m2.addMorph(m);
        this.world.addMorph(m2);
        m.a = 23;
        this.assertEquals(23, m2.b);
        var copy = m.copy();
        copy.a = 42;
        this.assertEquals(42, m2.b);
    },
    test07MorphHasNoOwnerAfterCopy: function() {
        var m = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph();
        m.addMorph(m2);
        var copy = m2.copy();
        this.assert(!copy.owner, 'copy.owner is ' + copy.owner);
    }
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ButtonMorphTests',
'testing', {
    test01MorphBoundsOnCreation: function() {
        var bounds = new Rectangle(30, 90, 30, 60),
            morph = new lively.morphic.Button(bounds);
        this.assertEquals(bounds, morph.getBounds(), 'morph bounds');
    },
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ListMorphTests',
'testing', {
    test01SetAndRetrieveStringItems: function() {
        var list = new lively.morphic.List(new Rectangle(0, 0, 100, 100), ['1', '2', '3']);
        this.assertEqualState(['1', '2', '3'], list.itemList);
        list.updateList(['foo']);
        this.assertEqualState(['foo'], list.itemList);
    },

    test02SelectAt: function() {
        var morph = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['first']);
        this.world.addMorph(morph);
        morph.selectAt(0);

        this.assertEquals('first', morph.selection);
        // var morphNode = morph.renderContext().getMorphNode();
        // this.doMouseEvent({type: 'mousedown', pos: pt(10,8), target: morphNode, button: 0});
    },

    test03SelectListItem: function() {
        var morph = new lively.morphic.List(new Rectangle (0, 0, 100, 100));
        this.world.addMorph(morph);
        morph.updateList([
            {isListItem: true, string: 'foo', value: 23},
            {isListItem: true, string: 'bar', value: 24}])
        morph.selectAt(1);
        this.assertEquals(24, morph.selection);
    },

    test04ListMorphBoundsOnCreationInHTML: function() {
        var owner = lively.morphic.Morph.makeRectangle(0,0,10,10),
            list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['1', '2', '3']);

        owner.addMorph(list)
        this.world.addMorph(owner);

        // FIXME depends on HTML
        this.assert(list.renderContext().listNode.clientHeight > 0, 'list node height is wrong')
    },

    test05ListMorphKeepsSelectionHighlightOnUpdateList: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100));
        this.world.addMorph(list);

        list.updateList([1,2,3]);
        list.setSelection(2);
        list.updateList([1,2,3]);

        var expected = {
            tagName: 'option',
            // attributes: {selected: true} // for some reason this does not work..
        };
        this.assertNodeMatches(expected, list.renderContext().subNodes[1]);
        this.assert(list.renderContext().subNodes[1].selected, 'not selected');
    },

    test06SetSelectionWithListItems: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
            items = [{isListItem: true, string: 'foo', value: 23}];
        this.world.addMorph(list);

        list.updateList(items);
        list.setSelection(23);

        this.assertEquals(0, list.selectedLineNo);
    },

    testAddMorphDuplicatesListsBug: function() {
        var list = new lively.morphic.List(new Rectangle(0,0,100,100), [1,2,3]),
            rect = lively.morphic.Morph.makeRectangle(0,0,100,100);

        this.world.addMorph(list);
        this.world.addMorph(rect);
        rect.addMorph(list);

        this.assert(!this.world.submorphs.include(list), 'list in world submorphs')
        this.assert(rect.submorphs.include(list), 'list not in rect submorphs')
    },

    testUpdateListOnSelectionHighlightsSelectionCorrectly: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
            items = [1, 2, 3];
        this.world.addMorph(list);

        list.updateList(items);
        list.setSelection(2);
        this.assertEquals(1, list.selectedLineNo);

        connect(list, 'selection', list, 'onSelect')
        list.addScript(function onSelect(sel) { this.updateList(this.getList()) });

        list.setSelection(3);
        this.assertEquals(2, list.selectedLineNo);
        // FIXME implementation & HTML specific
        var isSelected = list.renderContext().subNodes[2].selected;
        this.assert(isSelected !== '', 'highlight wrong')
    },

    testNoDoubleSelectionWhenClickedInList: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
            counter = {count: 0, selected: function() { this.count++ }},
            items = [1, 2, 3];
        this.world.addMorph(list);
        list.updateList(items);
        list.setSelection(2);

        lively.bindings.connect(list, 'selection', counter, 'selected')
        list.onMouseUp({isLeftMouseButtonDown: Functions.True,
                        target: list.renderContext().subNodes[2]})
        list.onChange({});
        this.assertEquals(1, counter.count, 'selection triggered too often');
    }

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MultipleSelectionListTests',
'testing', {
    test01GetSelections: function() {
        var list = new lively.morphic.List(new Rectangle(0, 0, 100, 100), ['1', '2', '3']);
        this.world.addMorph(list)
        list.setSelection('2');
        this.assertEqualState(['2'], list.getSelections());
    },

    test02TurnOnMultipleSelectionMode: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['1', '2', '3']);
        this.world.addMorph(list)
        list.enableMultipleSelections();
        list.setSelections(['1','3'])
        this.assertEqualState(['1', '3'], list.getSelections());
    },

    test03SetSelection: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['1', '2', '3']);
        list.enableMultipleSelections();
        list.setSelection('1')
        list.setSelection('3')
        list.setSelection(null)
        this.assertEqualState(['1', '3'], list.getSelections());
        list.clearSelections();
        this.assertEqualState([], list.getSelections());
    },

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.AppTests',
'testing', {
    test01ConfirmDialog: function() {
        var answer = false,
            dialog = this.world.confirm('Foo?', function(bool) { answer = bool });
        dialog.cancelButton.simulateButtonClick();
        this.assert(!answer, 'no button does not work')
        dialog.okButton.simulateButtonClick();
        this.assert(answer, 'yes button does not work')
    },

    test02PromptDialog: function() {
        var answer = 'nothing',
            dialog = this.world.prompt('Foo?', function(input) { answer = input });
        dialog.cancelButton.simulateButtonClick();
        this.assert(!answer, 'cancel button does not work')
        dialog.inputText.setTextString('test input')
        dialog.okButton.simulateButtonClick();
        this.assertEquals('test input', answer, 'ok button does not work')
    },
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.CanvasRenderingTests',
'testing', {
    test01UseCanvasRendererForSimpleMorph: function() {
        var m = new lively.morphic.Morph()
        this.world.addMorph(m);
        m.renderUsing(new lively.morphic.Canvas.RenderContext())

        var expected = {
            tagName: 'div',
            childNodes: [
                {tagName: 'div', childNodes: [ // shape
                    {tagName: 'div'}, // hand
                    {tagName: 'canvas'}
                ]}
            ]};
        this.assertNodeMatches(expected, this.world.renderContext().getMorphNode());
    },


    test02MorphAndSubmorphWithCanvas: function() {
        var m1 = new lively.morphic.Morph(),
            m2 = new lively.morphic.Morph()
        this.world.addMorph(m1);
        m1.renderUsing(new lively.morphic.Canvas.RenderContext())
        m1.addMorph(m2);

        var expected = {
            tagName: 'div',
            childNodes: [
                {tagName: 'div', childNodes: [  // shape
                    {tagName: 'div'}, // hand
                    {tagName: 'canvas'}
                ]}
            ]
        };
        this.assertNodeMatches(expected, this.world.renderContext().getMorphNode());
    },
});

TestCase.subclass('lively.morphic.tests.SimilitudeTests',
'testing', {
    test01PointTransform: function() {
        var globalPoint = pt(20,10),
            globalTransform = new lively.morphic.Similitude(pt(0,0), 0, pt(1,1)),
            localTransform = new lively.morphic.Similitude(pt(5,10), 0, pt(1,1)),
            globalizedInvertedLocal = localTransform.preConcatenate(globalTransform).inverse(),
            matrix = globalTransform.preConcatenate(globalizedInvertedLocal);
        this.assertEquals(pt(15, 0), globalPoint.matrixTransform(matrix))
    },
});

AsyncTestCase.subclass('lively.morphic.tests.SteppingScriptTests',
'testing', {
    test01StartAndStopTicking: function() {
        var n = 0, script = new lively.morphic.FunctionScript(function() { script.stop(); n++; });
        script.startTicking(10);
        this.delay(function() {
            this.assertEquals(1, n, 'Script not run once');
            this.done();
        }, 40);
    },

    test02SuspendAndContinue: function() {
        var n = 0,
            script = lively.morphic.Script.forFunction(function() { n++; });
        script.startTicking(10);
        this.delay(function() { this.assertEquals(1, n, 'Script not run once'); script.suspend() }, 15);
        this.delay(function() { this.assertEquals(1, n, 'Script not suspended'); script.resume() }, 25);
        this.delay(function() {
            script.stop();
            this.assertEquals(2, n, 'Script not continued');
            this.done();
        }, 40);
    },

    test03MorphStartStepping: function() {
        var m = new lively.morphic.Morph(),
            arg = {callCount: 0};
        m.someFunction = function(arg) { arg.callCount++ };

        m.startStepping(10, 'someFunction', arg);
        this.delay(function() {
            m.remove();
            this.assertEquals(1, arg.callCount, 'someFunction not run once');
        }, 15);
        this.delay(function() {
            this.assertEquals(1, arg.callCount, 'arg call count changed although morph was removed');
            this.done();
        }, 30);
    },

    test04ScriptEquals: function() {
        var cb = function() { return 23 },
            script1 = new lively.morphic.FunctionScript(cb);
            script2 = new lively.morphic.FunctionScript(cb);
        this.assert(script1.equals(script1), 'identity not working');
        this.assert(script1.equals(script2), 'FunctionScript equals');

        script1 = new lively.morphic.TargetScript(this, 'foo', 33);
        script2 = new lively.morphic.TargetScript(this, 'foo', 44);
        this.assert(script1.equals(script1), 'identity not working Target');
        this.assert(script1.equals(script2), 'TargetScript equals');

        this.done()
    },

    test05StartSteppingChecksIfScriptIsThere: function() {
        var m = new lively.morphic.Morph();
        m.someFunction = function(arg) { return 33 };

        m.startStepping(10, 'someFunction');
        m.startStepping(20, 'someFunction');

        this.assertEquals(1, m.scripts.length, 'script added twice');
        this.assertEquals(20, m.scripts[0].tickTime, 'tickTime not OK');

        this.done();
    },

    test06FunctionScriptOnce: function() {
        var n = 0, cb = function() { n++; };
        lively.morphic.FunctionScript.once(cb, 10);
        this.delay(function() {
            this.assertEquals(1, n, 'Script not run once');
            this.done();
        }, 40);
    },

    test07MorphicDelayWorksLikeNormalDelay: function() {
        Global.test07MorphicDelayWorksLikeNormalDelayTriggered = false;
        var f = function() { Global.test07MorphicDelayWorksLikeNormalDelayTriggered = true }
        f.morphicDelay(20);
        this.delay(function() {
            this.assert(!Global.test07MorphicDelayWorksLikeNormalDelayTriggered, 'morphicDelay was triggered too early');
        }, 10);
        this.delay(function() {
            this.assert(Global.test07MorphicDelayWorksLikeNormalDelayTriggered, 'morphicDelay was not triggered');
            this.done();
        }, 30);
    }
});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.SerializationTests',
'testing', {
    test01SerializeSimpleWorld: function() {
        this.createWorld();
        var m1 = lively.morphic.Morph.makeRectangle(0,0, 100, 100);
        this.world.addMorph(m1);
        m1.setName('SomeMorph');
        var json = lively.persistence.Serializer.serialize(this.world)
        this.world.remove();
        this.world = lively.morphic.World.createFromJSONOn(json, document.body);
        this.assertEquals(2, this.world.submorphs.length) // m1 and hand;
        this.assert(this.world.get('SomeMorph'), 'does not find morph with name from m1');
        this.assert(m1 !== this.world.submorphs[1], 'morphs are identical!!!');
    },
});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.HaloTests',
'testing', {
    test01ShowHalosForMorph: function() {
        this.createWorld();
        var m1 = lively.morphic.Morph.makeRectangle(50,50, 100, 100);
        this.world.addMorph(m1);
        m1.showHalos();
        this.assertIdentity(m1, this.world.currentHaloTarget, 'halo target');
        this.assert(m1.halos.length > 0, 'morph has no halos?');
    },

    test02HalosStayInVisibleBounds: function() {
        this.createWorld();
        var m1 = lively.morphic.Morph.makeRectangle(0,0, 100, 100);
        m1.align(m1.bounds().topRight(), this.world.bounds().topRight());
        this.world.addMorph(m1);
        m1.showHalos();
        m1.halos.forEach(function(ea) {
            if (ea.constructor == lively.morphic.OriginHalo) return;
            if (ea.constructor == lively.morphic.RenameHalo) return;
            if (ea.constructor == lively.morphic.BoundsHalo) return;
            this.assert(this.world.visibleBounds().containsRect(ea.bounds()), 'halo ' + ea + ' not  in visibleBounds')
        }, this)
    },

    testChangeExtentOfRectSoThatItFitsInOuter: function() {
        var outer, r, result;

        outer = new Rectangle(20,30, 100, 100);
        r = new Rectangle(0,0, 10, 20);
        result = outer.transformRectForInclusion(r);
        this.assertEquals(new Rectangle(20,30, 10, 20), result);

        outer = new Rectangle(20,30, 100, 100);
        r = new Rectangle(40,40, 10, 12);
        result = outer.transformRectForInclusion(r);
        this.assertEquals(r, result);

        outer = new Rectangle(20,30, 80, 70);
        r = new Rectangle(90,90, 20, 20);
        result = outer.transformRectForInclusion(r);
        this.assertEquals(new Rectangle(90,90, 10, 10), result);
    },

});


lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ImageTests',
'testing', {
    testImageMorphHTML: function() {
        var url = 'http://lively-kernel.org/repository/webwerkstatt/media/hpi_logo.png',
            morph = new lively.morphic.Image(new Rectangle(0,0,100,100), url)
        this.world.addMorph(morph);
        var expected = {
            tagName: 'div',
            childNodes: [{
                tagName: 'div',
                childNodes: [{tagName: 'img', attributes: {src: url}}]
            }]
        };
        this.assertNodeMatches(expected, morph.renderContext().getMorphNode());
    }
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MenuTests',
'testing', {
    testWrongSubMenuItems: function() {
        var menu = lively.morphic.Menu.openAt(pt(0,0), 'test', [['foo', ['bar']], ['foo2', ['bar2']]]),
            item = menu.submorphs[1]; // 0 is title, 1 is first item
        this.doMouseEvent({type: 'mouseover', pos: pt(5,5), target: item.renderContext().getMorphNode()});
        this.assertEquals('bar', menu.subMenu.items[0].string, 'sub menu is wrong');
    },

    testTransformMenuBoundsForVisibility: function() {
        var ownerBounds = new Rectangle(0,0, 300, 100),
            menuBounds, result, expected;

        // nothing to do when rect opens in visible range
        menuBounds = new Rectangle(0,0, 30, 20);
        expected = menuBounds;
        result = lively.morphic.Menu.prototype.moveBoundsForVisibility(menuBounds, ownerBounds)
        this.assertEquals(expected, result, 1);

        // move bounds left besides opening point (hand) so that no accidental clicks occur
        menuBounds = new Rectangle(290,0, 30, 20);
        expected = new Rectangle(260,0, 30, 20);
        result = lively.morphic.Menu.prototype.moveBoundsForVisibility(menuBounds, ownerBounds)
        this.assertEquals(expected, result, 2);

        // if bottom of menu would be lower than bottom of visble bounds, translate it
        menuBounds = new Rectangle(0,90, 30, 20);
        expected = menuBounds.translatedBy(pt(0,-10));
        result = lively.morphic.Menu.prototype.moveBoundsForVisibility(menuBounds, ownerBounds)
        this.assertEquals(expected, result, 3);
    },

    testTransformSubMenuBoundsForVisibility: function() {
        var ownerBounds = new Rectangle(0,0, 300, 100),
            mainMenuItemBounds, subMenuBounds, result, expected;

        // move rect so that it is next to menu item
        mainMenuItemBounds = new Rectangle(0,0, 10, 10);
        subMenuBounds = new Rectangle(0,0, 30, 20);
        expected = new Rectangle(10,0, 30, 20);
        result = lively.morphic.Menu.prototype.moveSubMenuBoundsForVisibility(
            subMenuBounds, mainMenuItemBounds, ownerBounds);
        this.assertEquals(expected, result, 1);

        // when too far right, move the submenu to the left
        mainMenuItemBounds = new Rectangle(290,0, 10, 10);
        subMenuBounds = new Rectangle(0,0, 30, 20);
        expected = new Rectangle(290-30,0, 30, 20);
        result = lively.morphic.Menu.prototype.moveSubMenuBoundsForVisibility(
            subMenuBounds, mainMenuItemBounds, ownerBounds);
        this.assertEquals(expected, result, 2);

        // when too far below move the submenu up
        mainMenuItemBounds = new Rectangle(0,90, 10, 10);
        subMenuBounds = new Rectangle(0,0, 30, 20);
        expected = new Rectangle(10,90-10, 30, 20);
        result = lively.morphic.Menu.prototype.moveSubMenuBoundsForVisibility(
            subMenuBounds, mainMenuItemBounds, ownerBounds);
        this.assertEquals(expected, result, 3);

        // when owner bounds to small align at top
        mainMenuItemBounds = new Rectangle(0,0, 10, 10);
        subMenuBounds = new Rectangle(0,0, 10, 200);
        expected = new Rectangle(10,0, 10, 200);
        result = lively.morphic.Menu.prototype.moveSubMenuBoundsForVisibility(
            subMenuBounds, mainMenuItemBounds, ownerBounds);
        this.assertEquals(expected, result, 4);
    },

    testTransformMenuBoundsForVisibility: function() {
        var ownerBounds = new Rectangle(0,0, 20, 20),
            menuBounds = new Rectangle(10,10, 30, 30),
            // move 1px to right so hand is out of bounds
            expected = new Rectangle(1,0, 30, 30),
            result = lively.morphic.Menu.prototype.moveBoundsForVisibility(menuBounds, ownerBounds);
        this.assertEquals(expected, result, 'transformed when onerBounds smaller');
    },

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.SelectionTest',
'testing', {
    testGrabByHand: function() {
        var hand = this.world.hands.first();
        hand.setPosition(pt(10,10))
        this.world.resetSelection()
        this.world.addMorph(this.world.selectionMorph)

        var morph1 = lively.morphic.Morph.makeRectangle(0,0,50,50);
        morph1.setPosition(pt(20,20))
        this.world.addMorph(morph1)
        var morph2 = lively.morphic.Morph.makeRectangle(0,0,50,50);
        morph2.setPosition(pt(100,20))
        this.world.addMorph(morph2);

        var oldPos = this.world.selectionMorph.worldPoint(pt(0,0))
        var oldMorph1Pos = morph1.worldPoint(pt(0,0))

        this.world.selectionMorph.selectMorphs([morph1, morph2]);
        this.world.selectionMorph.grabByHand(hand);

        var newPos = this.world.selectionMorph.worldPoint(pt(0,0))
        var newMorph1Pos = morph1.worldPoint(pt(0,0))

        this.assertEquals(oldPos, newPos, 'selection pos changed')
        this.assertEquals(oldMorph1Pos, newMorph1Pos, 'oldMorph1Pos changed')

    },

    testDropOn: function() {
        LastWorld = this.world;

        this.world.resetSelection()
        this.world.addMorph(this.world.selectionMorph)

        var morph1 = lively.morphic.Morph.makeRectangle(0,0,50,50);
        morph1.setPosition(pt(20,20))
        this.world.addMorph(morph1)

        var oldMorph1Pos = morph1.worldPoint(pt(0,0))


        var morph2 = lively.morphic.Morph.makeRectangle(0,0,50,50);
        morph2.setPosition(pt(40,40))
        this.world.addMorph(morph2)

        this.world.selectionMorph.addMorph(morph1);
        this.world.selectionMorph.dropOn(morph2);

        var newMorph1Pos = morph1.worldPoint(pt(0,0))
        this.assertEquals(oldMorph1Pos, newMorph1Pos, 'oldMorph1Pos changed')

    },


    testAddMorph: function() {
        LastWorld = this.world;

        this.world.resetSelection()
        this.world.addMorph(this.world.selectionMorph)

        var morph1 = lively.morphic.Morph.makeRectangle(0,0,50,50);
        morph1.setPosition(pt(20,20))
        this.world.addMorph(morph1)

        var oldMorph1Pos = morph1.worldPoint(pt(0,0))
        this.world.selectionMorph.addMorph(morph1)
        var newMorph1Pos = morph1.worldPoint(pt(0,0))
        this.assertEquals(oldMorph1Pos, newMorph1Pos, 'oldMorph1Pos changed')

    },

    testAddMorphWithSelectionInHand: function() {
        LastWorld = this.world;

        this.world.resetSelection()
        this.world.hands.first().addMorph(this.world.selectionMorph)

        var morph1 = lively.morphic.Morph.makeRectangle(0,0,50,50);
        morph1.setPosition(pt(20,20))
        this.world.addMorph(morph1)

        var oldMorph1Pos = morph1.worldPoint(pt(0,0))
        this.world.selectionMorph.addMorph(morph1)
        var newMorph1Pos = morph1.worldPoint(pt(0,0))
        this.assertEquals(oldMorph1Pos, newMorph1Pos, 'oldMorph1Pos changed')
    },
    testAlignToGrid: function() {
        var selection = new lively.morphic.Selection(new Rectangle(0,0,0,0));
        var container = lively.morphic.Morph.makeRectangle(0,0,1000,1000);
        var m1 = lively.morphic.Morph.makeRectangle(0,0,100,100)
        var m2 = lively.morphic.Morph.makeRectangle(0,0,100,100)
        container.addMorph(m1);
        container.addMorph(m2);
        m1.setPosition(pt(54,54));
        m2.setPosition(pt(58,58));
        selection.selectedMorphs = [m1, m2];
        selection.alignToGrid();
        this.assertEquals(m1.getPosition(), pt(50,50), "round down broken");
        this.assertEquals(m2.getPosition(), pt(60,60), "round up broken");
  },

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.RenderingTest',
'testing', {
    test01MorphKnowsAboutBeingRendered: function() {
        var renderCalls = 0, test = this,
            spy = function() {
                renderCalls++;
                test.assert(!this.isRendered(), "rendered too early?");
            },
            mock = this.mockClass(lively.morphic.Morph, 'prepareForNewRenderContext', spy).callsThrough(),
            morph = new lively.morphic.Morph();
        this.assertEquals(1, renderCalls);
        this.assert(morph.isRendered(), "morph not rendered?");
    },

    test02MorphNotRenderedAfterDeserialization: function() {
        var morph = new lively.morphic.Morph(),
            renderCalls = 0, test = this,
            spy = function() {
                renderCalls++;
                test.assert(!this.isRendered(), "copy rendered too early?");
            },
            mock = this.mockClass(lively.morphic.Morph, 'prepareForNewRenderContext', spy).callsThrough(),
            copy = morph.copy();
        this.assertEquals(1, renderCalls);
        this.assert(copy.isRendered(), "copy not rendered?");
    }
});


}) // end of module
