module('lively.morphic.tests.StyleSheetsHTML').requires('lively.morphic.tests.Helper', 'lively.morphic.HTML', 'lively.morphic.StyleSheets', 'lively.morphic.StyleSheetsHTML').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheetsHTML.Helpers',

'running', {

    setUp: function($super) {
        $super();
        this.sizzle = new lively.morphic.Sizzle();
        this.createSomeMorphs();
    },

},

'testing', {

    test01SplitGroupedSelector: function() {

        this.assertEqualState(

            ['.test test'],

            this.morph.splitGroupedSelector('.test test'),

            'Splitting did not produce the same selector for non grouped selector');

        this.assertEqualState(

            ['.test test', 'test', '*#test > test', '.test'],

            this.morph.splitGroupedSelector('.test test, test,*#test > test   ,.test'),

            'Splitting did not work alright');

    },

    test02AddSelectorPrefixes: function() {

        this.assertEquals(

            '*[morphid="'+this.morph.id+'"] .test test, *[morphid="'+this.morph.id+'"].test test',

            this.morph.addSelectorPrefixes('.test test'),

            'Prefix were not added correctly');

        this.assertEquals(

            '*[morphid="'+this.morph.id+'"] test, test[morphid="'+this.morph.id+'"]',

            this.morph.addSelectorPrefixes('test'),

            'Tagname did not go first when the selector prefixes are added');



    },

    test03CompileStyleSheet: function() {

        var css = '.test {'+

                'color: purple;'+

                '}'+

                'test, *#test, #test-two.test3 {'+

                'border: 1px solid red;'+

                '}',



            rules = apps.cssParser.parse(css).getRules(),

            comp = this.morph.compileStyleSheet(rules),

            decomp = apps.cssParser.parse(comp).getRules();



        this.assert((comp && comp.length > 0),

            'Compiled style sheet has to be longer than 0');

        this.assertEquals(2, decomp.length,

            'Decompiled style sheet has to have 2 rules');

    },

    test04AppendStyleNode: function() {

        var appendStyleNode = function(morph){

                    var ctx = morph.renderContext();

                    $(ctx.styleNode).remove();

                    ctx.styleNode = $('<style id="' + morph.id + '"></style>').get(0);

                    morph.appendStyleNodeHTML(

                        ctx,

                        ctx.styleNode);



                },



            morph1Level1 = lively.morphic.Morph.makeRectangle(0,0, 300, 300),

            morph2Level1 = lively.morphic.Morph.makeRectangle(0,0, 300, 300),

            morph1Level2 = lively.morphic.Morph.makeRectangle(0,0, 300, 300),

            morph2Level2 = lively.morphic.Morph.makeRectangle(0,0, 300, 300),

            morph3Level2 = lively.morphic.Morph.makeRectangle(0,0, 300, 300),

            morph1Level3 = lively.morphic.Morph.makeRectangle(0,0, 300, 300),

            morph2Level3 = lively.morphic.Morph.makeRectangle(0,0, 300, 300),

            morph3Level3 = lively.morphic.Morph.makeRectangle(0,0, 300, 300);



        /*

                11            21

              /    \          |

            12      22        32

            |      /  \

            13    23  33

        */



        morph1Level1.addMorph(morph1Level2);

        morph1Level1.addMorph(morph2Level2);

        morph2Level1.addMorph(morph3Level2);



        morph1Level2.addMorph(morph1Level3);

        morph2Level2.addMorph(morph2Level3);

        morph2Level2.addMorph(morph3Level3);



        morph1Level1.openInWorld();

        appendStyleNode(morph3Level3);

        appendStyleNode(morph1Level1);

        this.assertStyleNode(morph1Level1, morph3Level3,

            'Style node of 11 is not before 33');

        appendStyleNode(morph2Level2);



        this.assertStyleNode(morph2Level2, morph3Level3,

             'Style node of 22 is not before 33');

        this.assertStyleNode(morph1Level1, morph2Level2,

             'Style node of 11 is not before 22');







        // TODO: more asserts?



    },
    test05GetIdsForSelector: function() {
        this.assertArray([this.blueRectangle1.id, this.blueRectangle2.id],
            this.yellowRectangle.world().getIdsForSelector('.blue'),
            'Blue rectangles IDs do not match with selected ones');
        this.assertArray([this.yellowRectangle.id,
                this.redRectangle.id,
                this.blueRectangle1.id, this.blueRectangle2.id],
            this.yellowRectangle.world().getIdsForSelector('.Box'),
            'All box IDs do not match with selected ones');
        this.assertArray([this.redRectangle.id],
            this.yellowRectangle.getIdsForSelector('.red'),
            'RedRectangle ID does not match with selected ones when called from yellowRectangle');
        this.assertArray([this.redRectangle.id],
            this.redRectangle.getIdsForSelector('.red'),
            'RedRectangle ID does not match with selected ones when called from itself');
    },
    test06GenerateCombinedIdSelector: function() {
        var ids = this.yellowRectangle.world().getIdsForSelector('.Box'),
            combinedIdSelector = ids.reduce(function(prev, val) {
                    return prev + (prev.length > 0 ? ', ' : '')
                        + '[morphid="'+ val + '"]';
                }, '');
        this.assert(combinedIdSelector
            === this.yellowRectangle.world().generateCombinedIdSelector('.Box'),
            'Generated combined id does not match the anticipated one');
    },
    test07ReplaceChildOp: function() {
        // One op --> 3 selectors
        var input = '.test-class > div#test-id',
            output = '.test-class > div#test-id, '
                + '.test-class > [node-type="origin-node"] > div#test-id, '
                + '.test-class > [node-type="origin-node"] '
                + '> [node-type="morph-node"] > div#test-id';

        this.assertEquals(output, this.morph.replaceChildOp(input),
            'Output and Input for one child op do not match');

        // Two ops --> 9 selectors
        input = 'a > b > c',

            output = 'a > b > c, a > [node-type="origin-node"] > b > c, a > [node-type="origin-node"] > [node-type="morph-node"] > b > c, a > b > [node-type="origin-node"] > c, a > [node-type="origin-node"] > b > [node-type="origin-node"] > c, a > [node-type="origin-node"] > [node-type="morph-node"] > b > [node-type="origin-node"] > c, a > b > [node-type="origin-node"] > [node-type="morph-node"] > c, a > [node-type="origin-node"] > b > [node-type="origin-node"] > [node-type="morph-node"] > c, a > [node-type="origin-node"] > [node-type="morph-node"] > b > [node-type="origin-node"] > [node-type="morph-node"] > c';

        this.assertEquals(output, this.morph.replaceChildOp(input),
            'Output and Input for two child ops do not match');


    },


    assertArray: function(anticipated, actual, msg) {
        this.assertArrayIsSubset(anticipated, actual, msg);
        this.assertArrayIsSubset(actual, anticipated, msg);
    },
    assertArrayIsSubset: function(outerArray, innerArray, msg) {
        var outer = outerArray.uniq(),
            inner = innerArray.uniq();
        return this.assert(inner.select(function(x) {
                return outer.find(function(y) {return x === y;}) != undefined;
            }).length === inner.length,
            msg+'  -  '+ outerArray+' vs. '+innerArray);
    },





    assertStyleNode: function(higherMorph, lowerMorph, msg) {

                var hCtx = higherMorph.renderContext(),

                        hStyleNode = hCtx.styleNode,

                        lCtx = lowerMorph.renderContext(),

                        lStyleNode = lCtx.styleNode;

                    this.assertEquals(

                        hStyleNode,

                        lStyleNode.previousSibling,

                        msg);





    },
    createSomeMorphs: function() {
        // this method creates 4 morphs: yellowRectange is the ouyter parent
        // redRectangle its embedded submorph, blueRectangle1, blueRectangle1
        // are its submorphs
        var yellowRectangle = lively.morphic.Morph.makeRectangle(0,0, 300, 300);
        yellowRectangle.applyStyle({fill: Color.yellow});
        yellowRectangle.tagName = 'YellowRectangle';
        yellowRectangle.testAttribute = 'theYellowRectangle';
        yellowRectangle.openInWorld();


        var redRectangle = lively.morphic.Morph.makeRectangle(25, 25, 250, 250);
        redRectangle.applyStyle({fill: Color.red});
        redRectangle.addStyleClassName('red');
        redRectangle.setStyleId('the-red-rectangle');
        redRectangle.testAttribute = 'theRedRectangle';
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addStyleClassName('blue');
        blueRectangle1.setStyleId('b1');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addStyleClassName('blue');
        blueRectangle2.setStyleId('b2');
        blueRectangle2.tagName = 'blueRectangleTag';
        redRectangle.addMorph(blueRectangle2);

        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;

    },




});






lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheetsHTML.StyleSheets',

'running', {

    setUp: function($super) {

        $super();
        this.createSomeMorphs();
    },

},

'testing', {



    assertDOMMorphNodeAttribute: function(targetValue, attributeName, morph, msg) {

        var shapeNode= morph.renderContext().shapeNode;

        return this.assertEquals(targetValue, $(shapeNode).attr(attributeName), msg);

    },



    test01SetStyleClassNames: function() {

        this.morph.addStyleClassName('test-class');

        this.assertDOMMorphNodeAttribute('Morph test-class', 'class',

            this.morph,

            'Morph has not class names "Morph test-class"');

        this.morph.removeStyleClassName('test-class');

        this.assertDOMMorphNodeAttribute('Morph', 'class',

            this.morph,

            'Morph has not class name "Morph" after removal');

        this.morph.setStyleClassNames(['test-class']);

        this.assertDOMMorphNodeAttribute('Morph test-class', 'class',

            this.morph,

            'Morph has not class names "Morph test-class" after re-set');

    },



    test02SetStyleId: function() {

        this.morph.setStyleId('test-id');

        this.assertDOMMorphNodeAttribute('test-id', 'id',

            this.morph,

            'Morph has not id "test-id"');

    },
    createSomeMorphs: function() {
        // this method creates 4 morphs: yellowRectange is the ouyter parent
        // redRectangle its embedded submorph, blueRectangle1, blueRectangle1
        // are its submorphs
        var yellowRectangle = lively.morphic.Morph.makeRectangle(0,0, 300, 300);
        yellowRectangle.applyStyle({fill: Color.yellow});
        yellowRectangle.tagName = 'YellowRectangle';
        yellowRectangle.testAttribute = 'theYellowRectangle';
        yellowRectangle.openInWorld();
        yellowRectangle.addStyleClassName('yellow');


        var redRectangle = lively.morphic.Morph.makeRectangle(25, 25, 250, 250);
        redRectangle.applyStyle({fill: Color.red});
        redRectangle.addStyleClassName('red');
        redRectangle.setStyleId('the-red-rectangle');
        redRectangle.testAttribute = 'theRedRectangle';
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addStyleClassName('blue');
        blueRectangle1.setStyleId('b1');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addStyleClassName('blue');
        blueRectangle2.setStyleId('b2');
        blueRectangle2.tagName = 'blueRectangleTag';
        redRectangle.addMorph(blueRectangle2);

        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;

    },




    test03SetStyleSheet: function() {

        this.morph.setStyleSheet('.test-class { color: black;}');

        var styleNode = this.morph.renderContext().styleNode;

        this.assert(styleNode, 'There is no style node in the render context');

        this.assertEquals('style-for-'+this.morph.id, $(styleNode).attr('id'),

            'id of style node is wrong');

        var styleNodeContent = $(styleNode).html()

        this.assert(styleNodeContent.indexOf('[morphid="'+this.morph.id.toUpperCase()+'"]') >= 0,

            'Style node content has no ref to morph');

        this.assert(styleNodeContent.indexOf('.test-class') >= 0,

            'Style node content is missing the selector');

        this.assert(styleNodeContent.indexOf('color') >= 0,

            'Style node content is missing the declaration');

    },
    test04Remove: function() {
        // is stylenode removed when morph is removed?

        this.morph.setStyleSheet('.test-class { color: black;}');
        var styleNode = this.morph.renderContext().styleNode;

        this.morph.remove();

        this.assert(!styleNode.parentNode,
            'Morph has been remove, but its stylenode is still in document.')
    }


});


AsyncTestCase.subclass('lively.morphic.tests.StyleSheetsHTML.Selectors',
'running', {
    setUp: function($super) {
        $super();
        this.sizzle = new lively.morphic.Sizzle();
this.createSomeMorphs();
    },

 tearDown: function() {
        this.yellowRectangle.remove();
    },

},
'testing', {
    test01ClassSelector: function() {
        this.assertSelector([this.redRectangle],
            [this.yellowRectangle, this.blueRectangle1, this.blueRectangle2],
            this.yellowRectangle, '.red',
            'Could not select red rectangle via ".red"');

    },
    test02IdSelector: function() {
        this.assertSelector([this.blueRectangle2],
            [this.yellowRectangle, this.blueRectangle1, this.redRectangle],
            this.yellowRectangle, '#b2', 'Could not select blue 2 via "#b2"');
    },
    test03DescendantOf: function() {
        this.assertSelector([this.blueRectangle2, this.blueRectangle1],
            [this.yellowRectangle, this.redRectangle],
            this.yellowRectangle, '.red .blue',
            'Could not select blue 1 & 2 via ".red .blue"');
    },

    test04LevelOneChildSelector: function() {
        this.assertSelector([this.redRectangle],
            [this.yellowRectangle, this.blueRectangle1, this.blueRectangle2],
            this.yellowRectangle,
            '.yellow > .red', 'Could not select red via ".yellow > .red"');
    },
    test05LevelTwoChildSelector: function() {
        this.assertSelector([this.blueRectangle1],
            [this.yellowRectangle, this.blueRectangle2, this.redRectangle],
            this.yellowRectangle,
            '.yellow > .red > #b1',
            'Could not select b1 via ".yellow > .red > #b1"');
    },
    test06Empty: function() {
        this.assertSelector([this.blueRectangle1, this.blueRectangle2],
            [this.yellowRectangle, this.redRectangle],
            this.yellowRectangle,
            ':empty', 'Could not select b1 and b2 via ":empty"');
    },
    test07FirstChild: function() {
        this.done()
        /*
         *  ":first-child" not supported yet
         *

        this.assertSelector([this.blueRectangle1],
            [this.yellowRectangle, this.redRectangle, this.blueRectangle2],
            this.yellowRectangle,
            '.red :first-child', 'Could not select b1 via ".red :first-child"');

        */
    },
    test08NthChild: function() {
        this.done()
        /*
         *  ":nth-child" not supported yet
         *

        this.assertSelector([this.blueRectangle2],
            [this.yellowRectangle, this.redRectangle, this.blueRectangle1],
            this.yellowRectangle,
            '.red :nth-child(2)', 'Could not select b2 via ".red :nth-child(2)"');

        */

    },
    test09LastChild: function() {
        this.done()
        /*
         *  ":last-child" not supported yet
         *

        this.assertSelector([this.blueRectangle2],
            [this.yellowRectangle, this.redRectangle, this.blueRectangle1],
            this.yellowRectangle,
            '.red :last-child', 'Could not select b2 via ".red :last-child"');

        */

    },
    test10ImmediatleyPrecededBy: function() {
        this.done()
        /*
         *  "+" not supported yet
         *

        this.assertSelector([this.blueRectangle2],
            [this.yellowRectangle, this.redRectangle, this.blueRectangle1],
            this.yellowRectangle,
            '.blue + .blue', 'Could not select b2 via ".blue + .blue"');

        */

    },
    test11PrecededBy: function() {
        this.done()
        /*
         *  "~" not supported yet
         *

        this.assertSelector([this.blueRectangle2],
            [this.yellowRectangle, this.redRectangle, this.blueRectangle1],
            this.yellowRectangle,
            '.blue ~ .blue', 'Could not select b2 via ".blue ~ .blue"');

        */

    },
    test12Not: function() {
        this.assertSelector([this.blueRectangle2],
            [this.yellowRectangle, this.redRectangle, this.blueRectangle1],
            this.yellowRectangle,
            '.blue:not(.the-first-blue-rect)',
            'Could not select b2 via ".blue:not(.the-first-blue-rect)"');
    },










    assertSelector: function(selectedMorphs, nonSelectedMorphs, context, selector, msg) {
        var test = this;

        var selection = this.sizzle.select(selector, context);
        this.assertArray(selection, selectedMorphs, msg+': Sizzle select did fail');

        context.setStyleSheet(selector+' {outline: 12px solid purple;}');

        this.delay(function() {
            selectedMorphs.each(function(m) {
                    var shapeNode = m.renderContext().shapeNode;
                    this.assert(shapeNode,
                        msg+': No shapeNode! Whats going on here?');
                    this.assertEquals('12px',
                        window.getComputedStyle(shapeNode)['outline-width'],
                         msg+': Style was not applied on a node');
                }, this);
            nonSelectedMorphs.each(function(m) {
                    var shapeNode = m.renderContext().shapeNode;
                    this.assert(shapeNode,
                        msg+': No shapeNode! Whats going on here?');
                    this.assertEquals('0px',
                        window.getComputedStyle(shapeNode)['outline-width'],
                         msg+': Style was mistakenly applied on a node');
                }, this);

            test.done();
        }, 0.1);

    },

    createSomeMorphs: function() {
        // this method creates 4 morphs: yellowRectange is the ouyter parent
        // redRectangle its embedded submorph, blueRectangle1, blueRectangle1
        // are its submorphs
        var yellowRectangle = lively.morphic.Morph.makeRectangle(0,0, 300, 300);
        yellowRectangle.applyStyle({fill: Color.yellow});
        yellowRectangle.tagName = 'YellowRectangle';
        yellowRectangle.testAttribute = 'theYellowRectangle';
        yellowRectangle.openInWorld();
        yellowRectangle.addStyleClassName('yellow');

        var redRectangle = lively.morphic.Morph.makeRectangle(25, 25, 250, 250);
        redRectangle.applyStyle({fill: Color.red});
        redRectangle.addStyleClassName('red');
        redRectangle.setStyleId('the-red-rectangle');
        redRectangle.testAttribute = 'theRedRectangle';
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addStyleClassName('blue');
        blueRectangle1.addStyleClassName('the-first-blue-rect');
        blueRectangle1.setStyleId('b1');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addStyleClassName('blue');
        blueRectangle2.setStyleId('b2');
        blueRectangle2.tagName = 'blueRectangleTag';
        redRectangle.addMorph(blueRectangle2);

        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;

    },
    assertArray: function(anticipated, actual, msg) {
        this.assertArrayIsSubset(anticipated, actual, msg);
        this.assertArrayIsSubset(actual, anticipated, msg);
    },
    assertArrayIsSubset: function(outerArray, innerArray, msg) {
        var outer = outerArray.uniq(),
            inner = innerArray.uniq();
        return this.assert(inner.select(function(x) {
                return outer.find(function(y) {return x === y;}) != undefined;
            }).length === inner.length,
            msg+'  -  '+ outerArray+' vs. '+innerArray);
    },

});

})// end of module