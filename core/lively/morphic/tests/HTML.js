module('lively.morphic.tests.HTML').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.HTML.RenderingTest',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
    },
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

});