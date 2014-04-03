module('lively.morphic.tests.HTML').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.HTML.jQueryTests', {
    test01jQueryReturnsjQueryObject: function() {
        var m = new lively.morphic.Morph();
        this.assert(m.jQuery() instanceof jQuery);
    },
    test02jQueryReturnsWrappedShapeNode: function() {
        var m = new lively.morphic.Morph();
        this.assertEquals(m.jQuery()[0], m.renderContext().shapeNode);
    }
});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.HTML.RenderingTest',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
    }
},
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

    test03MorphSetsDataAttributeToBackpoint: function() {
        var m1 = lively.morphic.Morph.makeRectangle(0,0,100,100);
        this.world.addMorph(m1);
        this.assertIdentity(m1, $(m1.renderContext().morphNode).data('morph'));
        m1.remove();
        this.assertIdentity(undefined, $(m1.renderContext().morphNode).data('morph'));
    }

});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.HTML.ClipMode',
'testing', {
    test01ClipMode: function() {
        this.morph.setClipMode('hidden');
        this.assertDOMState({
            tagName: 'div',
            childNodes: [{tagName: 'div', style: {overflow: 'hidden'}}]
        }, this.morph);
    },

    test02ClipModeX: function() {
        this.morph.setClipMode({x: 'scroll'});
        this.assertDOMState({
            tagName: 'div',
            childNodes: [{tagName: 'div', style: {"overflow-x": 'scroll', overflow: ''}}]
        }, this.morph);
    },

    test03ClipModeXResetsPrevClipMode: function() {
        this.morph.setClipMode('scroll');
        this.morph.setClipMode({x: 'scroll'});
        this.assertDOMState({
            tagName: 'div',
            childNodes: [{tagName: 'div', style: {"overflow-x": 'scroll', overflow: ''}}]
        }, this.morph);
    },

    test04ClipModeXY: function() {
        this.morph.setClipMode({x: 'scroll', y: 'visible'});
        this.assertDOMState({
            tagName: 'div',
            childNodes: [{tagName: 'div', style: {"overflow-x": 'scroll', "overflow-y": 'visible'}}]
        }, this.morph);
    },

    test05RemoveOriginNodeAfterRemoveMorph: function() {
        var z = lively.morphic.Morph.makeRectangle(rect(0,0,10,10));
        this.morph.addMorph(z);
        var originNode = this.morph.renderContext().originNode,
            subMorphNode = z.renderContext().morphNode;
        this.assertIdentity(originNode, subMorphNode.parentNode,
            'originNode is not parent of submorph node');
        z.remove();
        this.assertDOMState({tagName: 'div', childNodes: [ // morphNode
            {tagName: 'div', childNodes: []}] // shapeNode
        }, this.morph);
        originNode = this.morph.renderContext().originNode;
        this.assert(!originNode, 'originNode not removed');
    }

});

AsyncTestCase.subclass('lively.morphic.tests.HTML.ClipModeAsyncRenderingTest',
'testing', {
    test01BUGAsyncRenderingOverwritesClipMode: function() {
        var test = this, morph = new lively.morphic.Morph();
        morph.setClipMode('scroll');
        var copy = morph.copy();
        copy.setClipMode('hidden');

        this.delay(function() {
            test.assertEquals('hidden', copy.renderContext().shapeNode.style.overflow);
            test.done();
        }, 0.2);
    }

});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.HTML.Fill',
'testing', {
    test01SetCSSFill: function() {
        this.morph.setFill(new lively.morphic.CSS.Fill('red'));
        this.assertDOMState({
            tagName: 'div',
            childNodes: [{tagName: 'div', style: {background: 'red'}}]
        }, this.morph);
    },

    test02CSSFillResetsPreviousFill: function() {
        this.morph.setFill(Color.green);
        this.morph.setFill(new lively.morphic.CSS.Fill('red'));
        this.assertDOMState({
            tagName: 'div',
            childNodes: [{tagName: 'div', style: {backgroundColor: 'red', background: 'red'}}]
        }, this.morph);
    }
});

AsyncTestCase.subclass('lively.morphic.tests.HTML.Positioning',
'running', {
    setUp: function(thenDo) {
        var world = lively.morphic.World.current();
        this.worldExtent = world.getExtent();
        this.worldScale = world.getScale();
        this.scroll = world.getScrollOffset();
        Global.scrollTo(pt(0,0));
        thenDo.delay(0);
    },
    tearDown: function() {
        var world = lively.morphic.World.current();
        world.setExtent(this.worldExtent);
        world.setScale(this.worldScale);
        Global.scrollTo(this.scroll.x, this.scroll.y);
    }
},
'testing', {
    testFixedPositing: function() {
        var m = lively.morphic.Morph.makeRectangle(lively.rect(0,0,20,30)),
            world = lively.morphic.World.current(),
            winBounds = world.windowBounds();
        this.onTearDown(function() { m.remove(); });
        Global.scrollTo(pt(0,0));
        world.setExtent(winBounds.extent().addXY(100,100));
        m.openInWorld(pt(5, 10));
        m.setFixed(true);
        // delays are needed so that the set scroll can take effect
        this.delay(function() {
            var expectedBounds = lively.rect(5,10,20,30);
            this.assertEquals(expectedBounds, m.bounds());
            Global.scrollTo(100,100);
            this.delay(function() {
                this.assertEquals(lively.rect(105,110,20,30), m.bounds());
                this.done();
            }, 0);
        }, 0);
    },
    testFixedPositingAlsoFixesScale: function() {
        var m = lively.morphic.Morph.makeRectangle(lively.rect(0,0,20,30)),
            world = lively.morphic.World.current(),
            winBounds = world.windowBounds();
        this.onTearDown(function() { m.remove(); });
        Global.scrollTo(pt(0,0));
        world.setExtent(winBounds.extent().addXY(100,100));
        world.setScale(1.2);
        m.openInWorld(pt(5, 10));
        m.setFixed(true);
        // delays are needed so that the set scroll can take effect
        this.delay(function() {
            var expectedBounds = pt(5,10).scaleBy(1/1.2).extent(pt(20,30).scaleBy(1/1.2));
            this.assertEquals(expectedBounds, m.bounds());
            this.done();
        }, 0);
    },
    testFixedPositingRemove: function() {
        var m = lively.morphic.Morph.makeRectangle(lively.rect(0,0,20,30)),
            world = lively.morphic.World.current(),
            winBounds = world.windowBounds();
        this.onTearDown(function() { m.remove(); });
        m.openInWorld(pt(5, 10));
        m.setFixed(true);
        this.assert(m.isSubmorphOf(world), 'fixed morph not submorph of world');
        m.remove();
        m.openInWorld();
        this.assert(!m.hasFixedPosition(), 'remove does not reset fixed positioning');
        this.done();
    }

});

});
