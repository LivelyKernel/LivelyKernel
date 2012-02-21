module('lively.morphic.tests.Morphic').requires('lively.TestFramework', 'lively.morphic.Complete', 'lively.morphic.Layout').toRun(function() {

namespace('lively.morphic.Tests'); // FIXME to be removed

TestCase.subclass('lively.morphic.tests.TestCase',
'running', {
    tearDown: function($super) {
        $super();
        this.removeTestWorld();
    },
},
'helper', {
    removeTestWorld: function() {
        if (this.world) {
            this.world.remove();
            this.world = null;
        }
        if (this.oldAlert)
            Global.alert = this.oldAlert;
        if (this.existingWorld) {
            this.existingWorld.displayOnCanvas(document.getElementsByTagName('body')[0]);
            lively.morphic.World.currentWorld = this.existingWorld;
            this.existingWorld = null;
        }
    },
    openMorphsInRealWorld: function() {
        this.removeTestWorld();
    },
    createWorld: function() {
        if (this.world) return; // already created
        this.existingWorld = lively.morphic.World.current();
        this.world = lively.morphic.World.createOn(document.body, new Rectangle(0,0,300,300));
        this.oldAlert = Global.alert;
        Global.alert = function (msg) { this.existingWorld.alert(String(msg)) }.bind(this)
    },
    serializeAndDeserializeWorld: function() {
        if (!this.world) {
            alert('No test world created');
            return
        }
        var json = this.world.serializeToJSON();
        this.world.remove();
        this.world = lively.morphic.World.createFromJSONOn(json, document.body);
    },

},
'assertion', {
    assertNodeMatches: function(expected, node) {
        var self = this,
            fail = function fail(msg) { self.assert(false, msg) };
        if (!expected) fail('expected is null');
        if (!node) fail('node is null but should be ' + expected.tagName);
        if (expected.tagName != node.tagName) fail(expected.tagName + '!=' + node.tagName);
        if (expected.parentNode && (expected.parentNode !== node.parentNode))
            fail('parent is ' + node.parentNode + ' but should be ' + expected.parentNode);

        if (expected.textContent) {
            if (expected.textContent != node.textContent)
                fail('textContent ' + expected.textContent + ' != ' + node.textContent);
        }

        if (expected.attributes)
            Properties.forEachOwn(expected.attributes, function(key, expectedValue) {
                var actualValue = node.getAttribute(key);
                if (expectedValue instanceof RegExp) {
                    if (!expectedValue.test(actualValue))
                        fail('attribute ' + key + ' was ' + actualValue + ' and didn\'t match ' + expectedValue);
                    return
                }
                if (expectedValue != actualValue) {
                    fail('attribute ' + key + ' not ' + expectedValue + ' but ' + actualValue);
                }
            });
        if (expected.style)
            Properties.forEachOwn(expected.style, function(key, expected) {
                if (!node.style[key]) {
                    alert("Warning: " + key + " is falsy in " + node + ".style"); 
                }
                var actualValue = node.style[key].replace(/ /g, '');
                if (Object.isFunction(expected)) {
                    self.assert(expected.call(self, actualValue), 'value ' + actualValue + ' did no match')
                    return
                }
                if (expected != actualValue)
                    fail('style ' + key + ' not ' + expected + ' but ' + actualValue);
            });
        if (expected.childNodeLength)
            this.assertEquals(expected.childNodeLength, node.childNodes.length, 'childNode.length of ' + node)
        if (expected.childNodes)
            for (var i = 0; i < expected.childNodes.length; i++)
                this.assertNodeMatches(expected.childNodes[i], node.childNodes[i]);
    },
});

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
    },
});


lively.morphic.tests.TestCase.subclass('lively.morphic.tests.MorphTests',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
    },
},
'testing', {
    test01AddMorph: function() {
        var m = new lively.morphic.Morph()
        this.world.addMorph(m);
        this.assert(this.world.submorphs.include(m), 'not in submorphs');
        this.assertIdentity(this.world, m.owner, 'owner');

        var expected = {
            tagName: 'div', // world morph
            childNodes: [
                {tagName: 'div', childNodes: [ // world shape
                    {tagName: 'div', childNodes: [{tagName: 'div'}]} // m and its shape
                ]}, 
            ]};
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
                        childNodes: [{tagName: 'g', childNodes: [{tagName: 'rect'}]}]},
                ]}, // world's shape
            ]
        };
console.log(Exporter.stringify(this.world.renderContext().getMorphNode()));
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

    testMorphBounds: function() {
        var morph1 = new lively.morphic.Morph(),
            morph2 = new lively.morphic.Morph();
        this.world.addMorph(morph1);
        morph1.addMorph(morph2);
        morph1.setBounds(new Rectangle(100, 100, 40, 40));
        morph2.setBounds(new Rectangle(20, 10, 40, 40));
        this.assertEquals(new Rectangle(100, 100, 60, 50), morph1.getBounds());
    },
    test07MorphBoundsOnCreation: function() {
        var bounds = new Rectangle(30, 90, 30, 60),
            shape = new lively.morphic.Shapes.Rectangle(bounds);
        this.assertEquals(bounds, shape.getBounds(), 'shape bounds');
        var morph = new lively.morphic.Morph(shape);
        this.assertEquals(bounds, morph.getBounds(), 'morph bounds');
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
    test16MorphsContainingPoint: function() {
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
    test17MorphsContainingPointWithAddMorphFront: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0, 0, 100, 100),
            morph2 = lively.morphic.Morph.makeRectangle(0, 0, 100, 100);

        this.world.addMorph(morph1);
        this.world.addMorphBack(morph2);

        var result = this.world.morphsContainingPoint(pt(1,1));
this. openMorphsInRealWorld()
// inspect(result)
        this.assertEquals(3, result.length);
        // this.assertEquals(this.world.firstHand(), result[0], 'for ' + pt(1,1));

        this.assertEquals(morph1, result[0], 'for ' + pt(1,1));
        this.assertEquals(morph2, result[1], 'for ' + pt(1,1));
    },
    test18OrderOfMorphsOnScrennAndInSubmorphArrayMatches: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0, 0, 100, 100),
            morph2 = lively.morphic.Morph.makeRectangle(0, 0, 100, 100);

        this.world.addMorph(morph1);
        this.world.addMorphBack(morph2);

        this.assertIdentity(this.world.submorphs[0], morph2, 'morph2 not @0')
        this.assertIdentity(this.world.submorphs[1], morph1, 'morph1 not @1')
    },
    test19MorphsContainingPointDosNotIncludeOffsetedOwner: function() {
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
    }
});


lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.EventTests',
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




});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.TextMorphTests',
'testing', {
    test01TextMorphHTML: function() {
        var m = new lively.morphic.Text()
        this.world.addMorph(m);
        m.setTextString('Foo');
        var expected = {
            tagName: 'div',
            childNodes: [
                {tagName: 'div', childNodes: [ // shape
                    {tagName: 'div', textContent: 'Foo'}] // text node
                }, 
            ]};
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
    },
    test02TextMorphSVG: function() {
        var m = new lively.morphic.Text()
        this.world.addMorph(m);
        m.renderUsing(new lively.morphic.SVG.RenderContext())
        m.setTextString('Foo');
        var expected = {
            tagName: 'g',
            childNodes: [
                {tagName: 'rect'}, // shape
                {tagName: 'text', textContent: 'Foo'} // text node
            ]};
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
    },
    test03TextStringIsConnectable: function() {
        var m = new lively.morphic.Text()
        this.world.addMorph(m);
        var resultObj = {result: null};
        connect(m, 'textString', resultObj, 'result');
        m.setTextString('Foo');
        this.assertEquals('Foo', resultObj.result);
    },
    test04GrowToFit: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 10, 20));
        this.world.addMorph(m);
        m.setTextString('a really long string longer than 10px')
        m.applyStyle({fixedWidth: false});
        this.assert(m.getExtent().x > 10, 'did not grow to fit text ' + m.bounds().width);
    },
    test04bFitReallyShrinksMorphinHTML: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 200));
        this.world.addMorph(m);
        m.setTextString('short')
        m.applyStyle({fixedWidth: false});
        m.fit();
        this.assert(m.getExtent().x < 100, 'did not shrink to fit text');
    },


    test05SetSelectionRange: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('123\t567\n9');
        m.focus();
        m.setSelectionRange(0,1);
        this.assertEquals('1', m.selectionString());
        m.setSelectionRange(0,3);
        this.assertEquals('123', m.selectionString());
        m.setSelectionRange(-99,m.textString.length+10);
        this.assertEquals('123\t567\n9', m.selectionString());
    },
    test05bSetSelectionRangeRightToLeft: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('123\t567\n9');
        m.focus();
        m.setSelectionRange(3, 0);
        this.assertEquals('123', m.selectionString());
        this.assertEqualState([3,0], m.getSelectionRange());
    },
    test05cCorrectNewlinesInSelection: function() {
        // added 2012-01-06. Firefox Selection>>toString replaces \n with ' '
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('This\nis\na\ntest');
        m.setSelectionRange(0,9);
        this.assert(m.textString.indexOf(m.selectionString()) != -1);
    },


    test06ModifySelectedLinesInsertsAtCorrectPosition: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('This\nis\na\ntest');
        m.setSelectionRange(0,9);
        this.assertEquals('This\nis\na', m.selectionString())
        m.modifySelectedLines(function(ea) { return '+' + ea });
        this.assertEquals('+This\n+is\n+a\ntest', m.textString);
    },
    test07aSplitText: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('This is a test');
        m.setSelectionRange(10,10);

        m.splitText();

        var newText = this.world.submorphs[this.world.submorphs.indexOf(m)+1]
        this.assert(newText.isText && newText !== m, 'no text created');
        this.assertEquals(m, newText.splittedFrom, 'spittedFrom field no correct');
        this.assertEquals('test', newText.textString, 'spittedFrom string');
        this.assertEquals('This is a ', m.textString, 'former text string not OK');
        this.assert(newText.bounds().top() > m.bounds().bottom(), 'not below old text');
    },
    test07bMergeText: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('This is a test');
        m.setSelectionRange(10,10);
        var splitted = m.splitText();
        splitted.emphasizeAll({fontWeight: 'bold'});
        splitted.mergeText();
        
        this.assert(!splitted.owner, 'splitted not removed');
        this.assertEquals('This is a test', m.textString, 'spittedFrom string');
        this.assertMatches({fontWeight: 'bold'}, m.getEmphasisAt(11))
    },
    test08CopyTextWithConnection: function() {
        // issue 285
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20), "");
        connect(m, 'textString', m, 'someOtherField')
        var copy = m.duplicate()
        this.assert(copy.textString == '', 'copy is broken')    
    },



    test09TextStringOfTextOutsideSceneGraphIsSerialized: function() {
        var m = new lively.morphic.Morph(),
            s,
            d;
        m.hiddenTextMorph = new lively.morphic.Text();
        m.hiddenTextMorph.textString = 'Hello';

        s = lively.persistence.Serializer.serialize(m);
        d = lively.persistence.Serializer.deserialize(s);
        this.assertEquals(d.hiddenTextMorph.textString, 'Hello', 'serialization of removed text should preserve its contents');
    },
    test10PasteIntoEmptyTextEnsuresSelection: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.textString = '';
        m.onPaste({
            clipboardData: {
                getData: function(type) { 
                        if (type === "text/plain") {
                            return "foo";
                        } 
                        return false;
                    }
                }, 
            stop: function() {}
            });
        this.assertEquals(m.textString, "foo", "string was not pasted into empty text");
    },


});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.TextMorphRichTextTests',
'running', {
    setUp: function($super) {
        $super();
        this.text = new lively.morphic.Text(new Rectangle(0,0, 400, 200));
        // cop.withLayers([TextDevLayer], function() {
            // return new lively.morphic.Text(new Rectangle(0,0, 400, 200));
        // })
        // this.text.setWithLayers([TextDevLayer]);
        this.world.addMorph(this.text);
    },
    checkRunArray: function(expectedRunArray) {
        this.assertMatches(expectedRunArray.asArray(), this.text.textStyle.asArray());
    },
    checkChunks: function(expectedChunks, optTextChunkOwner) {
        var textChunkOwner = optTextChunkOwner || this.text;
        this.assertMatches(expectedChunks, textChunkOwner.getTextChunks());
    },

    checkDOM: function(expectedTextNodes) {
        // check what was actually rendered
        var expected = {
            tagName: 'div',
            childNodeLength: expectedTextNodes.length,
            childNodes: expectedTextNodes
        };
        this.assertNodeMatches(expected, this.text.renderContext().textNode);
    },


},
'testing', {
    test01MorphHasTextChunk: function() {
// this. openMorphsInRealWorld()
// inspect(this.text)
        var chunks = this.text.getTextChunks();
        this.assertEquals(1, chunks.length);
        this.assertEquals('', chunks[0].textString);
        chunks[0].textString = 'foo';
        this.assertEquals('foo', this.text.textString);
        this.checkDOM([{tagName: 'span', textContent: 'foo'}])
    },
    test02MorphHasTextChunkWhenTextStringIsSet: function() {
        this.text.textString = 'foo'
        var chunks = this.text.getTextChunks();
        this.assertEquals(1, chunks.length);
        this.assertEquals('foo', chunks[0].textString);
        this.checkDOM([{tagName: 'span', textContent: 'foo'}])
    },
    test03SplitAndJoinTextChunks: function() {
        this.text.setTextString('eintest');
        var chunk = this.text.firstTextChunk();
        var after = chunk.splitAfter(3);
        this.assertEquals('test', after.textString, 'after string');
        this.assertEquals('ein', chunk.textString, 'chunk string');
        this.assertEquals(2, this.text.getTextChunks().length);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'test'}])

        chunk.joinWithNext();
        this.assertEquals('eintest', chunk.textString);
        this.assertEquals(1, this.text.getTextChunks().length);
        this.checkDOM([{tagName: 'span', textContent: 'eintest'}]);

        var before = chunk.splitBefore(3);
        this.assertEquals('ein', before.textString, 'before string');
        this.assertEquals(2, this.text.getTextChunks().length);
    },
    test03bCoalesceChunks: function() {
        this.text.setTextString('test');
        this.text.firstTextChunk().splitAfter(2);
        this.text.coalesceChunks()
        this.assertEquals(1, this.text.getTextChunks().length);
        this.checkDOM([{tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },
    test03cSplitAtFrontAndBack: function() {
        this.text.setTextString('a');
        var after = this.text.firstTextChunk().splitAfter(1);
        this.assertEquals('', after.textString, 'splitAfter');
        var before = this.text.firstTextChunk().splitBefore(0);
        this.assertEquals('', before.textString, 'splitBefore');
        this.assertEquals(3, this.text.getTextChunks().length);
    },
    test03cSplittedChunkGetsStyle: function() {
        this.text.setTextString('abcdef');
        var chunk = this.text.firstTextChunk();
        chunk.style.setFontWeight('bold');
        var after = this.text.firstTextChunk().splitAfter(3);
        this.assertEquals('bold', after.style.getFontWeight());
    },



    test04SliceTextChunksSimple: function() {
        this.text.setTextString('eintest');
        var sliced = this.text.sliceTextChunks(0,3);
        this.assertEquals(1, sliced.length, 'sliced not oke');
        this.assertEquals(2, this.text.getTextChunks().length);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'test'}])
    },

    test04SliceTextChunks: function() {
        this.text.setTextString('eintest');
        var chunk = this.text.firstTextChunk();
        chunk.splitAfter(3);
        var sliced = this.text.sliceTextChunks(2,6);
        this.assertEquals(4, this.text.getTextChunks().length);
        this.checkDOM([
            {tagName: 'span', textContent: 'ei'},
            {tagName: 'span', textContent: 'n'},
            {tagName: 'span', textContent: 'tes'},
            {tagName: 'span', textContent: 't'}])
    },
    test04SliceTextChunksAgain: function() {
        this.text.setTextString('abc');
        var sliced = this.text.sliceTextChunks(1,2);
        this.assertEquals(1, sliced.length, 'first');
        sliced = this.text.sliceTextChunks(1,2);
        this.assertEquals(1, sliced.length, 'second');
    },

    test05StyleChunk: function() {
        this.text.setTextString('test');
        var chunk = this.text.firstTextChunk();
        chunk.styleText({fontWeight: 'bold'});
        this.checkDOM([{tagName: 'span', style: {fontWeight: 'bold'}}]);
    },
    test06MakeTextBold: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0, 3);
        this.checkChunks(
            [{textString: 'ein'},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },



    test07MakeTextBoldThenUnbold: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0, 2);
        this.text.emphasize({fontWeight: 'normal'}, 0, 2);
        this.checkDOM([{tagName: 'span', textContent: 'eintest'}])
    },
    test08ToggleBoldnessComplete: function() {
        this.text.setTextString('eintest');
        this.text.toggleBoldness(1, 6);
        this.checkDOM([
            {tagName: 'span', textContent: 'e'},
            {tagName: 'span', textContent: 'intes'},
            {tagName: 'span', textContent: 't'}])
        this.text.toggleBoldness(1, 6);
        this.checkDOM([{tagName: 'span', textContent: 'eintest'}])
    },
    test09ChunksAreSerializable: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0, 3);
        this.text.name = 'testText';
        this.serializeAndDeserializeWorld();
        this.text = this.world.get('testText');
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])

    },
    test10ConvertSelectionRangeForEmphasis: function() {
        // the indexes used by text selection are currently different
        // to those used for emphasizing the text
        var testValues = [
            {sel: [0,0], emph: [0,0]},
            {sel: [0,7], emph: [0,7]},
            {sel: [1,1], emph: [1,1]},
            {sel: [2,0], emph: [0,2]},
            {sel: [8,0], emph: [0, 8]},
            {sel: [4,7], emph: [4,7]}];
        testValues.forEach(function(selAndEmph) {
            this.assertEqualState(
                selAndEmph.emph,
                this.text.convertSelectionRangeForEmphasis(selAndEmph.sel),
                'sel conversion of ' + selAndEmph.sel);
        }, this)
    },
    test11ToggleBoldnessWithChunkWithMultipleTextNodes: function() {
        this.text.setTextString('eintest');
        this.text.setNullSelectionAt(3);
        this.text.insertAtCursor('foo');
        this.assertEquals('einfootest', this.text.textString, 'insert')
        this.checkDOM([
            {tagName: 'span', textContent: 'einfootest', childNodes: [
                {tagName: undefined, textContent: 'ein'},
                {tagName: undefined, textContent: 'foo'},
                {tagName: undefined, textContent: 'test'}
            ]},
        ])

        this.text.toggleBoldness(1, 9);
        this.checkDOM([
            {tagName: 'span', textContent: 'e', childNodes: [{textContent: 'e'}]},
            {tagName: 'span', textContent: 'infootes', childNodes: [{textContent: 'infootes'}]},
            {tagName: 'span', textContent: 't', childNodes: [{textContent: 't'}]},
        ])
    },
    test11FixChunksShouldKeepSlection: function() {
        this.text.setTextString('eintest');
        // add a text outside of chunks manually
        this.text.renderContext().textNode.appendChild(document.createTextNode('test'))
        this.text.setSelectionRange(2,5)
        this.text.fixChunks()
        this.checkDOM([
            {tagName: 'span', textContent: 'eintesttest', childNodes: [
                {tagName: undefined, textContent: 'eintesttest'},
            ]},
        ])
        var range = this.text.getSelectionRange()
        this.assert(range, 'no selection range after fixChunks!')
        this.assertMatches([2, 5], range) // Inconsistency with selection ranges?
    },
    test12GetAndSetSelectionRangeHaveEqualValues: function() {
        this.text.setTextString('eintest');
        this.text.setSelectionRange(1, 6)
        this.assertEquals('intes', this.text.selectionString());
        this.assertMatches([1,6], this.text.getSelectionRange());
    },
    test13InsertedTextBetweenChunksIsAssimilated: function() {
        // certain actions like native spell checking can add text and other DOM elements
        // between our chunk elements (spans)
        // this should be recognized and additional text appended to some chunk
        this.text.setTextString('abcdef');
        this.text.emphasize({fontWeight: 'bold'}, 0, 3);

        var chunks = this.text.getTextChunks();
        this.assertEquals(2, chunks.length, 'test preparation: chunks not OK')

        var newNode = XHTMLNS.create('b')
        newNode.textContent = 'foo';

        this.text.renderContext().textNode.insertBefore(newNode, chunks[1].getChunkNode());

        this.text.fixChunks();

        this.checkDOM([
            {tagName: 'span', textContent: 'abcfoo'},
            {tagName: 'span', textContent: 'def'},
        ])
    },
    test14GetEmphasisAt: function() {
        // certain actions like native spell checking can add text and other DOM elements
        // between our chunk elements (spans)
        // this should be recognized and additional text appended to some chunk
        this.text.setTextString('abcdef');
        this.text.emphasize({fontWeight: 'bold'}, 1, 3);

        var emph, expected = ['normal', 'bold', 'bold', 'normal']
        expected.forEach(function(expectedFontWeight, i) {
            var emph = this.text.getEmphasisAt(i)
            this.assertEquals(expectedFontWeight, emph.getFontWeight(), i);
        },this)
    },

    test15GetChunkAndLocalIndex: function() {
        this.text.setTextString('abcdef');
        this.text.sliceTextChunks(1,3);
        this.checkDOM([
            {tagName: 'span', textContent: 'a'},
            {tagName: 'span', textContent: 'bc'},
            {tagName: 'span', textContent: 'def'},
        ]);

        var chunks = this.text.getTextChunks(), result;
        
        result = this.text.getChunkAndLocalIndex(0);
        this.assertEquals(chunks[0], result[0]); // test for chunk
        this.assertEquals(0, result[1]); // test for local index

        result = this.text.getChunkAndLocalIndex(1); // if chunks ends at idx we extend it
        this.assertEquals(chunks[0], result[0])
        this.assertEquals(1, result[1])

        result = this.text.getChunkAndLocalIndex(2);
        this.assertEquals(chunks[1], result[0])
        this.assertEquals(1, result[1])

        result = this.text.getChunkAndLocalIndex(1, true);
        this.assertEquals(chunks[1], result[0])
        this.assertEquals(0, result[1])
    },
    test16AddLink: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({uri: 'http://foo.com'}, 0, 3);
        this.checkChunks(
            [{textString: 'ein', style: {uri: 'http://foo.com'}},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {textDecoration: 'underline'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },
    test17AddLinkMakeBoldThenUnbold: function() {
        this.text.setTextString('eintest');

        this.text.emphasize({uri: 'test'}, 3, 7)
        this.text.emphasize({fontWeight: 'bold'}, 0, 4)
        this.text.emphasize({fontWeight: 'normal'}, 0, 4)

        this.checkChunks(
            [{textString: 'ein'},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'test', style: {textDecoration: 'underline'}}])
    },
    test18LinkifiedChunkShouldKeepLinkWhenTextStringChanges: function() {
        this.text.setTextString('foo');
        this.text.emphasize({uri: 'test'}, 0, 3);

        this.text.firstTextChunk().textString = 'bar'

        this.checkChunks([{textString: 'bar', style: {uri: 'test'}}])

        this.checkDOM([{
            tagName: 'span',
            textContent: 'bar',
            style: {textDecoration: 'underline'}
        }])
    },
    test19FixChunksShouldRemoveElements: function() {
        this.text.setTextString('eintest');

        // this happens when pasting rich text on windows, for now remove RT attributes
        var elem = XHTMLNS.create('a');
        elem.href = 'http://foo.com';
        elem.textContent = 'test';

        this.text.firstTextChunk().getChunkNode().appendChild(elem);

        this.text.fixChunks()
        this.checkDOM([
            {tagName: 'span', textContent: 'eintesttest',
                // childNodes: [{tagName: undefined, textContent: 'eintesttest'}]
            },
        ])
    },
    test20HandleSplittedSpanNodes: function() {
        // this happens when pasting normal text on windows
        // the span node of a chunk is splitted in two parts and the pasted text
        // is inserted inbetween
        var textNode = this.text.renderContext().textNode;
        this.text.setTextString('ac');

        var span = XHTMLNS.create('span');
        span.textContent = 'a';
        textNode.insertBefore(span, this.text.firstTextChunk().getChunkNode());

        var text = NodeFactory.createText('b');
        textNode.insertBefore(text, this.text.firstTextChunk().getChunkNode());

        this.text.firstTextChunk().textString = 'c';

        this.text.fixChunks();

        this.checkDOM([{tagName: 'span', textContent: 'abc'}]);
    },
    test21HandleSplittedSpanNodesAndTextAttributes: function() {
        // this happens when pasting normal text on windows
        // the span node of a chunk is splitted in two parts and the pasted text
        // is inserted inbetween
        var textNode = this.text.renderContext().textNode;
        this.text.setTextString('abc');

        this.text.emphasize({fontWeight: 'bold'}, 1,3);
        var chunks = this.text.getTextChunks();

        var span = XHTMLNS.create('span');
        span.textContent = 'b';
        textNode.insertBefore(span, chunks.last().getChunkNode());
        // abbc

        var text = NodeFactory.createText('x');
        textNode.insertBefore(text, chunks.last().getChunkNode());
        // abxbc

        chunks.last().textString = 'c';
        // abxc

        this.text.fixChunks();

        this.checkDOM([
            {tagName: 'span', textContent: 'abx'},
            {tagName: 'span', textContent: 'c', style: {fontWeight: 'bold'}}]);
    },
    test22ReclaimRemovedSpanNodesOnPaste: function() {
        // this happens when pasting normal text on Mac OS after a chunk
        // the span node of the chunk that is pasted into is removed and the chunkNode
        // has no parent anymore. The abandoned chunkNode should reclaim its old text + the isnerted

        // add new content
        var textNode = this.text.renderContext().textNode;
        this.text.setTextString('foo\n\nbar\n\nbaz');

        this.text.emphasize({fontWeight: 'bold'}, 0,3);
        this.text.emphasize({fontWeight: 'bold'}, 10,13);
        var chunks = this.text.getTextChunks();

        // remove middle chunk node
        var n = chunks[1].getChunkNode();
        n.parentNode.removeChild(n);

        var text = NodeFactory.createText('\n\nbar zurp\n\n');
        textNode.insertBefore(text, chunks[2].getChunkNode());

        this.assertEquals('foo\n\nbar zurp\n\nbaz',textNode.textContent, 'setup not successful')

        this.text.fixChunks();

        this.checkDOM([
            {tagName: 'span', textContent: 'foo', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: '\n\nbar zurp\n\n', style: {fontWeight: ''}},
            {tagName: 'span', textContent: 'baz', style: {fontWeight: 'bold'}}]);

    },
    test23ReclaimRemovedChunkNodeAndReapplyTextAttributes: function() {
        // this happens when pasting normal text on Mac OS in attributed text (e.g. bold)
        // Chrome tries to complete render the span itself, e.g. using <b>
        // the chunkNode is removed but the chunk still exists
        // this tests if the chunk can reclaim the text and set it's attributes again
        var textNode = this.text.renderContext().textNode;
        this.text.setTextString('foo\nbar');

        this.text.emphasize({fontWeight: 'bold'}, 4,7);
        var chunks = this.text.getTextChunks();

        // remove last chunk node
        var n = chunks[1].getChunkNode();
        n.parentNode.removeChild(n);

        var b = XHTMLNS.create('b');
        b.textContent = 'morebar'
        textNode.appendChild(b);

        this.assertEquals('foo\nmorebar', textNode.textContent, 'setup not successful')

        this.text.fixChunks();

        this.checkDOM([
            {tagName: 'span', textContent: 'foo\n', style: {fontWeight: ''}},
            {tagName: 'span', textContent: 'morebar', style: {fontWeight: 'bold'}}]);
    }, 

    test22EmphasizeRegex: function() {
        this.text.setTextString("a1b2c");
        this.text.emphasizeRegex(/[0-9]/g, {color: Color.red});
        this.checkChunks([
            {textString: 'a', style: {color: null}},
            {textString: '1', style: {color: Color.red}},
            {textString: 'b', style: {color: null}},
            {textString: '2', style: {color: Color.red}},
            {textString: 'c', style: {color: null}},
        ])
    },
    richTextPasteData: '<meta charset=\'utf-8\'><span class=\"Apple-style-span\" style=\"border-collapse: separate; color: rgb(0, 0, 0); font-family: Times; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: normal; orphans: 2; text-align: -webkit-auto; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-border-horizontal-spacing: 0px; -webkit-border-vertical-spacing: 0px; -webkit-text-decorations-in-effect: none; -webkit-text-size-adjust: auto; -webkit-text-stroke-width: 0px; font-size: medium; \"><span class=\"Apple-style-span\" style=\"font-family: Arial, sans-serif; font-size: 19px; white-space: pre-wrap; \"><span style=\"text-decoration: none; \">ein </span><span style=\"text-decoration: none; font-weight: bold; \">test</span></span></span>',

    test23aRichTextPaste: function() {
        var pastedText = this.richTextPasteData,
            rt = lively.morphic.HTMLParser.pastedHTMLToRichText(pastedText);
        this.assertEquals(2, rt.textChunks.length);
        this.assertEquals('ein ', rt.textChunks[0].textString);
        this.assertEquals('test', rt.textChunks[1].textString);
        this.assertEquals('normal', rt.textChunks[0].style.getFontWeight());
        this.assertEquals('bold', rt.textChunks[1].style.getFontWeight());
        
    },
    test24aInsertTextChunks: function() {
        this.text.setTextString('ein');
        this.text.setNullSelectionAt(3);
        var chunk = new lively.morphic.TextChunk('test')

        this.text.insertTextChunksAtCursor([chunk], true, true);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'test'},
        ])
    },
    test24bInsertTextChunks: function() {
        this.text.setTextString('eintest');
        this.text.setNullSelectionAt(3);
        var chunk = new lively.morphic.TextChunk('foo')

        this.text.insertTextChunksAtCursor([chunk], true, true);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'foo'},
            {tagName: 'span', textContent: 'test'},
        ])
    },

    test25SlicingTextChunksWithRangeWithLengthZero: function() {
        this.text.setTextString('ein');
        var newChunk = this.text.sliceTextChunks(3,3);
        this.assertEquals(2, this.text.textChunks.length)
        this.assertIdentity(newChunk[0], this.text.textChunks.last())
    },
    test26aUnEmphasize: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0,3)
        this.text.unEmphasize(0,7);
        this.checkChunks(
            [{textString: 'eintest'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'eintest', style: {fontWeight: ''}}])
    },
    test26bUnEmphasizePart: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0,3)
        this.text.setSelectionRange(1,3);
        this.text.unEmphasizeSelection();
        var selRange = this.text.getSelectionRange();
        this.assertMatches([1,3], selRange)
        this.checkChunks(
            [{textString: 'e'},
            {textString: 'intest'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'e', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'intest', style: {fontWeight: ''}}])
    },





});
lively.morphic.tests.TextMorphRichTextTests.subclass('lively.morphic.tests.RichTextTests',
'testing', {
    test01CreateRichText: function() {
        var rt = new lively.morphic.RichText('test');
        this.text.setRichText(rt);
        this.assertEquals('test', this.text.textString)
    },
    test02GetRichText: function() {
        this.text.textString = 'test';
        var rt = this.text.getRichText();
        this.assertEquals('test', rt.textString)
    },
    test03EmphasizeRichText: function() {
        var rt = new lively.morphic.RichText('eintest');
        rt.emphasize({fontWeight: 'bold'}, 0,3);
        this.assertEquals(2, rt.textChunks.length, 'chunks not created in rich text')
        this.text.setRichText(rt);
        this.checkChunks(
            [{textString: 'ein'},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },
    test04InsertInText: function() {
        var rt = new lively.morphic.RichText('foo');
        rt.emphasize({fontWeight: 'bold'}, 0,3);
        this.text.setTextString('einxtest');
        this.text.setSelectionRange(3,4);
        rt.replaceSelectionInMorph(this.text)
        this.checkChunks(
            [{textString: 'ein'},
            {textString: 'foo'},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {fontWeight: ''}},
            {tagName: 'span', textContent: 'foo', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },
    test05GetRichText: function() {
        this.text.textString = 'test';
        this.text.emphasizeAll({fontWeight: 'bold'});
        var rt = this.text.getRichText();
        this.checkChunks([{textString: 'test', style: {fontWeight: 'bold'}}], rt)
    },
    test05bGetRichTextFromTo: function() {
        this.text.textString = 'test';
        this.text.emphasizeAll({fontWeight: 'bold'});
        var rt = this.text.getRichTextFromTo(2, 4);
        this.checkChunks([{textString: 'te', style: {fontWeight: 'bold'}}], this.text)
        this.checkChunks([{textString: 'st', style: {fontWeight: 'bold'}}], rt)
    },











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

AsyncTestCase.subclass('lively.morphic.tests.ScriptTests',
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
            }],
        };
        this.assertNodeMatches(expected, morph.renderContext().getMorphNode());        
    },
});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MenuTests',
'testing', {
    testWrongSubMenuItems: function() {
        var menu = lively.morphic.Menu.openAt(pt(0,0), 'test', [['foo', ['bar']], ['foo2', ['bar2']]]),
            item = menu.submorphs[1]; // 0 is title, 1 is first item
        this.doMouseEvent({type: 'mouseover', pos: pt(5,5), target: item.renderContext().getMorphNode()});
        this.assertEquals('bar', menu.subMenu.items[0].string, 'sub menu is wrong')
    },
    testTransformMenuBoundsForVisibility: function() {
        var ownerBounds = new Rectangle(0,0, 300, 100),
            menuBounds, result, expected;

        // nothing to do when rect opens in visible range
        menuBounds = new Rectangle(0,0, 30, 20);
        expected = menuBounds;
        var result = lively.morphic.Menu.prototype.moveBoundsForVisibility(menuBounds, ownerBounds)
        this.assertEquals(expected, result, 1);

        // move bounds left besides opening point (hand) so that no accidental clicks occur
        menuBounds = new Rectangle(290,0, 30, 20);
        expected = new Rectangle(260,0, 30, 20);
        var result = lively.morphic.Menu.prototype.moveBoundsForVisibility(menuBounds, ownerBounds)
        this.assertEquals(expected, result, 2);

        // if bottom of menu would be lower than bottom of visble bounds, translate it
        menuBounds = new Rectangle(0,90, 30, 20);
        expected = menuBounds.translatedBy(pt(0,-10));
        var result = lively.morphic.Menu.prototype.moveBoundsForVisibility(menuBounds, ownerBounds)
        this.assertEquals(expected, result, 3);
    },
    testTransformSubMenuBoundsForVisibility: function() {
        var ownerBounds = new Rectangle(0,0, 300, 100),
            mainMenuItemBounds, subMenuBounds, result, expected;

        // move rect so that it is next to menu item
        mainMenuItemBounds = new Rectangle(0,0, 10, 10);
        subMenuBounds = new Rectangle(0,0, 30, 20);
        expected = new Rectangle(10,0, 30, 20);
        var result = lively.morphic.Menu.prototype.moveSubMenuBoundsForVisibility(
            subMenuBounds, mainMenuItemBounds, ownerBounds);
        this.assertEquals(expected, result, 1);

        // when too far right, move the submenu to the left
        mainMenuItemBounds = new Rectangle(290,0, 10, 10);
        subMenuBounds = new Rectangle(0,0, 30, 20);
        expected = new Rectangle(290-30,0, 30, 20);
        var result = lively.morphic.Menu.prototype.moveSubMenuBoundsForVisibility(
            subMenuBounds, mainMenuItemBounds, ownerBounds);
        this.assertEquals(expected, result, 2);

        // when too far below move the submenu up
        mainMenuItemBounds = new Rectangle(0,90, 10, 10);
        subMenuBounds = new Rectangle(0,0, 30, 20);
        expected = new Rectangle(10,90-10, 30, 20);
        var result = lively.morphic.Menu.prototype.moveSubMenuBoundsForVisibility(
            subMenuBounds, mainMenuItemBounds, ownerBounds);
        this.assertEquals(expected, result, 3);

        // when owner bounds to small align at top
        mainMenuItemBounds = new Rectangle(0,0, 10, 10);
        subMenuBounds = new Rectangle(0,0, 10, 200);
        expected = new Rectangle(10,0, 10, 200);
        var result = lively.morphic.Menu.prototype.moveSubMenuBoundsForVisibility(
            subMenuBounds, mainMenuItemBounds, ownerBounds);
        this.assertEquals(expected, result, 4);
    },
    testTransformMenuBoundsForVisibility: function() {
        var ownerBounds = new Rectangle(0,0, 20, 20),
            menuBounds = new Rectangle(10,10, 30, 30),
            // move 1px to right so hand is out of bounds
            expected = new Rectangle(1,0, 30, 30);
        var result = lively.morphic.Menu.prototype.moveBoundsForVisibility(menuBounds, ownerBounds)
        this.assertEquals(expected, result, 'transformed when onerBounds smaller');
    },



});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ExternalShapesTests',
'testing', {
    test01AddADivShape: function() {
        //var div = stringToXML('<div style="width: 100px;">a test</div>');
        var div = document.createElement('div');
        div.innerHTML = "a test";
        var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(div));
        this.world.addMorph(morph);
        this.assert(morph.getExtent().x > 0, 'width of morph not bigger than 0');
        this.assert(morph.getExtent().y > 0, 'height of morph not bigger than 0');
    },
});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.LayoutTests',
'testing', {
    test01DropJournalLayoutOnMorph: function() {
        var container = new lively.morphic.Morph();
        container.setExtent(new lively.Point(200,200));
        container.setFill(Color.red);
        container.setLayouter(new lively.morphic.Layout.JournalLayout());
        this.world.addMorph(container);

        var text = new lively.morphic.Text();
        text.setExtent(new lively.Point(300, text.getExtent().y));
        text.setTextString('hello world');
        text.openInWorld();

        text.growOrShrinkToFit();
        container.addMorph(text);

        this.assertEquals(container.getExtent().y, 2*container.getLayouter().getBorderSize() + text.getExtent().y, "expected morph's extent to be 200");
    },
    test02ApplyHBoxLayout: function() {
        var container = new lively.morphic.Morph();
        container.setExtent(new lively.Point(200,200));
        container.setFill(Color.red);
        container.setLayouter(new lively.morphic.Layout.HorizontalLayout());
        this.world.addMorph(container);

        var child = new lively.morphic.Morph();
        child.setExtent(new lively.Point(200, 200));
        child.layout = {};
        child.layout.resizeWidth = true;
        child.openInWorld();

        container.addMorph(child);

        this.assertEquals(child.getExtent().x, container.getExtent().x - 2*container.getLayouter().getBorderSize(), "expected child to fit into container");
    },
    test03GridLayoutDefaultSizes: function() {
        var container = new lively.morphic.Morph();
        container.setExtent(new lively.Point(200,200));
        container.setFill(Color.red);
        var grid = new lively.morphic.Layout.GridLayout();
        container.setLayouter(grid);
        this.world.addMorph(container);

        for (var x = 0; x < grid.numCols; x++) {
            assertEquals(grid.defaultColWidth, grid.getMinColWidth(x), 'col width should be same as default');
        }
        for (var y = 0; y < grid.numRows; y++) {
            assertEquals(grid.defaultRowHeight, grid.getMinRowHeight(y), 'row height should be same as default');
        }
    },
    test04TileLayoutMovesFirstMorphToTopLeft: function() {
        var container = new lively.morphic.Morph();
        container.setExtent(new lively.Point(200,200));
        container.setFill(Color.red);
        var l = new lively.morphic.Layout.TileLayout();
        container.setLayouter(l);
        this.world.addMorph(container);

        var m = new lively.morphic.Morph();

        container.addMorph(m);

        this.assertEquals(m.getPosition(), pt(l.getSpacing(), l.getSpacing()), 'TileLayout did not set correct position of first submorph');
    },



});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.SelectionTest',
'testing', {
    testGrabByHand: function() {
        LastWorld = this.world;

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
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.RenderingTest',
'testing', {
    test01NodeIsInDOM: function() {
        var m1 = lively.morphic.Morph.makeRectangle(0,0,100,100),
            m2 = lively.morphic.Morph.makeRectangle(0,0,100,100);
        m1.addMorph(m2);
        var domInterface = m1.renderContext().domInterface;
        this.assert(!domInterface.isInDOM(m1.renderContext().morphNode), 'm1 node in DOM?')
        this.assert(!domInterface.isInDOM(m2.renderContext().morphNode), 'm2 node in DOM?')
        this.world.addMorph(m1)
        this.assert(domInterface.isInDOM(m1.renderContext().morphNode), 'm1 node not in DOM?')        
        this.assert(domInterface.isInDOM(m2.renderContext().morphNode), 'm2 node not in DOM?')
    },
    test02RenderCrossBrowserLinearGradient: function() {
        var gradient = new lively.morphic.LinearGradient(
            [{offset: 0, color: Color.red}, {offset: 0.8, color: Color.green}], "northSouth");
            expectedWebkit = '-webkit-gradient(linear, 0% 0%, 0% 100%,color-stop(0, rgb(204,0,0)),color-stop(0.8, rgb(0,204,0)))',
            expectedFirefox = '-moz-linear-gradient(90deg, rgb(204,0,0) 0%, rgb(0,204,0) 80%)';
            webkitResult = gradient.toCSSString(new Rectangle(0,0,100,100), '-webkit-'),
            firefoxResult = gradient.toCSSString(new Rectangle(0,0,100,100), '-moz-');
        this.assert(expectedWebkit == webkitResult || expectedFirefox == firefoxResult, 'browser does not render gradients correctly');
    },
    test02bRenderCrossBrowserRadialGradient: function() {
        var gradient = new lively.morphic.RadialGradient(
            [{offset: 0, color: Color.red}, {offset: 0.8, color: Color.green}], pt(0.5,0.3));
            expectedWebkit = "-webkit-gradient(radial,50%30%,0,50%50%,50,color-stop(0,rgba(204,0,0,1)),color-stop(0.8,rgba(0,204,0,1)))",
            expectedFirefox = '-moz-radial-gradient(50% 50%, circle cover, rgb(204,0,0) 0%, rgb(0,204,0) 80%)'
            webkitResult = gradient.toCSSString(new Rectangle(0,0,100,100), '-webkit-'),
            firefoxResult = gradient.toCSSString(new Rectangle(0,0,100,100), '-moz-');
        this.assert(expectedWebkit == webkitResult.replace(/\s/g, '') || expectedFirefox == firefoxResult, 'browser does not render gradients correctly');
    },


});


}) // end of module
