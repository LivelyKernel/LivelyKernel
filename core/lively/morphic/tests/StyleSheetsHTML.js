module('lively.morphic.tests.StyleSheetsHTML').requires('lively.morphic.tests.Helper', 'lively.morphic.HTML', 'lively.morphic.StyleSheets', 'lively.morphic.StyleSheetsHTML').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheetsHTML.Helpers',
'running', {
    setUp: function($super) {
        $super();
        this.sizzle = new lively.morphic.Sizzle();
        this.createSomeMorphs();
    }
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
            '*[data-lively-morphid="'+this.morph.id+'"] .test test, *[data-lively-morphid="'+this.morph.id+'"].test test',
            this.morph.addSelectorPrefixes('.test test'),
            'Prefix were not added correctly');

        this.assertEquals(
            '',
            this.morph.addSelectorPrefixes(''),
            'Empty selector is returned empty again');

        this.assertEquals(
            '*[data-lively-morphid="'+this.morph.id+'"] test, test[data-lively-morphid="'+this.morph.id+'"]',
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
        this.assertArray([
            this.yellowRectangle.id, this.redRectangle.id,
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
                        + '[data-lively-morphid="'+ val + '"]';
                }, '');
        this.assert(combinedIdSelector
            === this.yellowRectangle.world().generateCombinedIdSelector('.Box'),
            'Generated combined id does not match the anticipated one');
    },
    test07ReplaceChildOp: function() {
        // One op --> 3 selectors
        var input = '.test-class > div#test-id',
            output = '.test-class > div#test-id, '
                + '.test-class > [data-lively-node-type="origin-node"] > div#test-id, '
                + '.test-class > [data-lively-node-type="origin-node"] '
                + '> [data-lively-node-type="morph-node"] > div#test-id';

        this.assertEquals(output, this.morph.replaceChildOp(input),
            'Output and Input for one child op do not match');

        // Two ops --> 9 selectors
        input = 'a > b > c',

            output = 'a > b > c, a > [data-lively-node-type="origin-node"] > b > c, a > [data-lively-node-type="origin-node"] > [data-lively-node-type="morph-node"] > b > c, a > b > [data-lively-node-type="origin-node"] > c, a > [data-lively-node-type="origin-node"] > b > [data-lively-node-type="origin-node"] > c, a > [data-lively-node-type="origin-node"] > [data-lively-node-type="morph-node"] > b > [data-lively-node-type="origin-node"] > c, a > b > [data-lively-node-type="origin-node"] > [data-lively-node-type="morph-node"] > c, a > [data-lively-node-type="origin-node"] > b > [data-lively-node-type="origin-node"] > [data-lively-node-type="morph-node"] > c, a > [data-lively-node-type="origin-node"] > [data-lively-node-type="morph-node"] > b > [data-lively-node-type="origin-node"] > [data-lively-node-type="morph-node"] > c';

        this.assertEquals(output, this.morph.replaceChildOp(input),
            'Output and Input for two child ops do not match');


    },
    test08SetNewMorphId: function() {
        var shapeNode = this.morph.renderContext().shapeNode,
            oldId = $(shapeNode).attr('data-lively-morphid');
        this.morph.setNewId();
        this.assert(oldId !== $(shapeNode).attr('data-lively-morphid'),
            'morphid in node should not be the old id');
        this.assertEquals(this.morph.id, $(shapeNode).attr('data-lively-morphid'),
            'morphid in node should be the new morph id');
    },
    test09SetNodeTypeAttributes: function() {
        var ctx = this.redRectangle.renderContext();

        this.assertEquals('morph-node', $(ctx.morphNode).attr('data-lively-node-type'),
            'Node-type of morphNode should be "morph-node"');
        this.assertEquals('origin-node', $(ctx.originNode).attr('data-lively-node-type'),
            'Node-type of originNode should be "origin-node"');
    },
    test09ReplaceWildcardSelector: function() {
        this.assertEquals('*[data-lively-morphid]', this.morph.replaceWildcardSelector('*'),
            'Simple wildcard was not replaced correctly');
        this.assertEquals('*[data-lively-morphid].class *[data-lively-morphid].another-class', this.morph.replaceWildcardSelector('*.class *.another-class'),
            'Combined wildcards were not replaced correctly');
    },
    test10ReplaceRootPseudo: function() {
        var morphId = this.morph.id;
        this.assertEquals('[data-lively-morphid="'+morphId+'"]', this.morph.replaceRootPseudo(':root'),
            'Simple root pseudo was not replaced correctly');
        this.assertEquals('[data-lively-morphid="'+morphId+'"].class, [data-lively-morphid="'+morphId+'"].another-class', this.morph.replaceRootPseudo(':root.class, :root.another-class'),
            'Grouped root pseudos were not replaced correctly');
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
        yellowRectangle.name = "yellowRectangle";
        yellowRectangle.applyStyle({fill: Color.yellow});
        yellowRectangle.tagName = 'YellowRectangle';
        yellowRectangle.testAttribute = 'theYellowRectangle';
        yellowRectangle.openInWorld();

        var redRectangle = lively.morphic.Morph.makeRectangle(25, 25, 250, 250);
        redRectangle.name = "redRectangle";
        redRectangle.applyStyle({fill: Color.red});
        redRectangle.addStyleClassName('red');
        redRectangle.setStyleId('the-red-rectangle');
        redRectangle.testAttribute = 'theRedRectangle';
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.name = "blueRectangle1";
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addStyleClassName('blue');
        blueRectangle1.setStyleId('b1');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.name = "blueRectangle2";
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addStyleClassName('blue');
        blueRectangle2.setStyleId('b2');
        blueRectangle2.tagName = 'blueRectangleTag';
        redRectangle.addMorph(blueRectangle2);

        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;
    }
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
        var shapeNode = morph.renderContext().shapeNode;
        return this.assertEquals(targetValue, lively.$(shapeNode).attr(attributeName), msg);
    },
    test01SetStyleClassNames: function() {
        this.morph.addStyleClassName('test-class');
        this.assertDOMMorphNodeAttribute('Morph test-class', 'class', this.morph,
            'Morph has not class names "Morph test-class"');
        this.morph.removeStyleClassName('test-class');
        this.assertDOMMorphNodeAttribute('Morph', 'class', this.morph,
            'Morph has not class name "Morph" after removal');
        this.morph.setStyleClassNames(['test-class']);
        this.assertDOMMorphNodeAttribute('Morph test-class', 'class', this.morph,
            'Morph has not class names "Morph test-class" after re-set');
    },

    test02SetStyleId: function() {
        this.morph.setStyleId('test-id');
        this.assertDOMMorphNodeAttribute('test-id', 'id',
            this.morph,
            'Morph has not id "test-id"');
    },
    test02aSetNodeMorphId: function() {
        var shapeNode = this.morph.renderContext().shapeNode;
        $(shapeNode).attr('data-lively-morphid', '');
        this.morph.setNodeMorphIdHTML(this.morph.renderContext());
        this.assertEquals(this.morph.id, $(shapeNode).attr('data-lively-morphid'),
            'Morphid node attribute should be the morph id');
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
        this.assert(styleNodeContent.indexOf('[data-lively-morphid="'+this.morph.id.toUpperCase()+'"]') >= 0,
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
    },
    test05SetBaseThemeStyleSheet: function() {
        this.morph.setBaseThemeStyleSheet('.test-class { color: black;}');
        var baseThemeNode = this.morph.renderContext().baseThemeNode;
        this.assert(baseThemeNode, 'There is no base theme node in the render context');
        this.assertEquals('base-theme-for-' + this.morph.id, $(baseThemeNode).attr('id'),
                          'id of base theme node is wrong');
        var styleNodeContent = $(baseThemeNode).html(),
            morphIdSel = '[data-lively-morphid="' + this.morph.id.toUpperCase()+'"]';
        this.assert(styleNodeContent.include(morphIdSel),
                    'Base theme node content has no ref to morph');
        this.morph.setStyleSheet('.test-class { color: black;}');
        var styleNode = this.morph.renderContext().styleNode;

        this.assertEquals(2, styleNode.compareDocumentPosition(baseThemeNode),
            'Style node has to follow the base theme node in the DOM');
    },

    test06SetStyleSheetRemovesDuplicates: function() {
        var morph1 = this.morph,
            morph2 = lively.morphic.Morph.makeRectangle(0,0, 10,10);
        this.world.addMorph(morph2);
        morph2.id = morph1.id; // force same id for test
        morph1.setStyleSheet('.test-class { color: black;}');
        morph2.setStyleSheet('.test-class { color: green;}');
        var styleId = 'style-for-' + morph1.id;
        this.assertEquals(1, $('head #' + styleId).length);
    },
    test07ClassnameDOMModificationsArePickedUpInMorphic: function() {
        this.morph.addStyleClassName('test-class');
        this.morph.renderContext().shapeNode.className += ' foo';
        this.assertDOMMorphNodeAttribute('Morph test-class foo', 'class', this.morph,
            'classname DOM change not picked up');
        this.morph.renderContext().shapeNode.className = 
        this.morph.renderContext().shapeNode.className.replace(/test-class/, '');
        this.assertDOMMorphNodeAttribute('Morph  foo', 'class', this.morph,
            'classname removal in DOM not picked up');
        this.assertEquals(['Morph', 'foo'], this.morph.getStyleClassNames());
    },
    test08AddClassNameWithDOMModification: function() {
        this.morph.renderContext().shapeNode.className += ' foo';
        this.morph.addStyleClassName('test-class');
        this.assertDOMMorphNodeAttribute('Morph foo test-class', 'class', this.morph,
            'classname DOM change not picked up');
    }
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheetsHTML.Borders',
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
    test01SwitchBorderStylingMode: function() {
        //this.redRectangle.setStyleSheet('.red {border: 10px solid black;}');
        this.redRectangle.setBorderWidth(20);
        var oldShapeNodeSize = $(this.redRectangle.renderContext().shapeNode).outerWidth();
        this.redRectangle.setBorderStylingMode(true);
        this.assertEquals(oldShapeNodeSize,
            $(this.redRectangle.renderContext().shapeNode).outerWidth(),
            'Shapenode should be the same size after switching on CSS styling');
        this.redRectangle.setBorderStylingMode(false);
        this.assertEquals(oldShapeNodeSize,
            $(this.redRectangle.renderContext().shapeNode).outerWidth(),
            'Shapenode should be the same size after switching off CSS styling');
    },
    test02AddCSSBorder: function() {
        this.redRectangle.setBorderWidth(0);
        var oldShapeNodeOuterSize = $(this.redRectangle.renderContext().shapeNode).outerWidth(),
            oldShapeNodeInnerSize = $(this.redRectangle.renderContext().shapeNode).width(),
            oldBluePosition = $(this.blueRectangle1.renderContext().shapeNode).position();

        this.redRectangle.setBorderStylingMode(true);
        this.redRectangle.setStyleSheet('.red {border: 10px solid black;}');

        var newShapeNodeOuterSize = $(this.redRectangle.renderContext().shapeNode).outerWidth(),
            newShapeNodeInnerSize = $(this.redRectangle.renderContext().shapeNode).width(),
            newBluePosition = $(this.blueRectangle1.renderContext().shapeNode).position();

        this.assertEquals(oldShapeNodeOuterSize, newShapeNodeOuterSize ,
            'Shape node should be the same outer size than before adding the 10px border');
        this.assertEquals(oldShapeNodeInnerSize- 20, newShapeNodeInnerSize ,
            'Shape node itself should be 20px less wide than before adding the 10px border');
        this.assertEquals(oldBluePosition.top, newBluePosition.top,
            'Blue shape node should be in the position as before adding the border to red');
    },
    test03BorderIsResetWhenSwitchingBackAndForth: function() {
        this.redRectangle.setBorderWidth(20);

        this.redRectangle.setStyleSheet('.red {border: 10px solid black;}');

        this.assertEquals(20, this.redRectangle.getBorderWidth(),
            'Border width should be 20 before switch');

        this.redRectangle.setBorderStylingMode(true);

        this.assertEquals(10, this.redRectangle.getBorderWidth(),
            'Border width should be 10 after switch');

        this.redRectangle.setBorderStylingMode(false);

        this.assertEquals(20, this.redRectangle.getBorderWidth(),
            'Border width should be 20 again after switching back');

        this.redRectangle.setBorderStylingMode(true);

        this.assertEquals(10, this.redRectangle.getBorderWidth(),
            'Border width should be 10 again after rereswitch');
    },
    test04BorderIsAdaptedWhenClassNamesChanged: function() {
        var css = '.Box {'
            +'border-width: 5px;'
            +'}\n'+'.test-box, .test-box .Box {'
            +'border-width: 13px;'
            +'}';
        this.yellowRectangle.setBorderStylingMode(true);
        this.redRectangle.setBorderStylingMode(true);
        this.blueRectangle1.setBorderStylingMode(true);
        this.yellowRectangle.setStyleSheet(css);

        this.assertEquals(5, this.yellowRectangle.getBorderWidth(),
            'Border width of yellow should be 5 before changing class names');
        this.assertEquals(5, this.redRectangle.getBorderWidth(),
            'Border width of red should be 5 before changing class names');
        this.assertEquals(5, this.blueRectangle1.getBorderWidth(),
            'Border width of blue should be 5 before changing class names');

        this.yellowRectangle.addStyleClassName('test-box');


        this.assertEquals(13, this.yellowRectangle.getBorderWidth(),
            'Border width of yellow should be 13 after changing class names');
        this.assertEquals(13, this.redRectangle.getBorderWidth(),
            'Border width of red should be 13 after changing class names');
        this.assertEquals(13, this.blueRectangle1.getBorderWidth(),
            'Border width of blue should be 13 after changing class names');

    },
    test05BorderIsAdaptedWhenStyleIdChanged: function() {
        var css = '.Box {'
            +'border-width: 5px;'
            +'}'+'#test-box, #test-box .Box {'
            +'border-width: 13px;'
            +'}';
        this.yellowRectangle.setBorderStylingMode(true);
        this.redRectangle.setBorderStylingMode(true);
        this.blueRectangle1.setBorderStylingMode(true);
        this.yellowRectangle.setStyleSheet(css);

        this.assertEquals(5, this.redRectangle.getBorderWidth(),
            'Border width of red should be 5 before changing ID');

        this.assertEquals(5, this.yellowRectangle.getBorderWidth(),
            'Border width of yellow should be 5 before changing ID');

        this.assertEquals(5, this.blueRectangle1.getBorderWidth(),
            'Border width of blue should be 5 before changing ID');
        this.yellowRectangle.setStyleId('test-box');
        this.assertEquals(13, this.redRectangle.getBorderWidth(),
            'Border width of red should be 13 after changing ID');

        this.assertEquals(13, this.yellowRectangle.getBorderWidth(),
            'Border width of yellow should be 13 after changing ID');

        this.assertEquals(13, this.blueRectangle1.getBorderWidth(),
            'Border width of blue should be 13 after changing ID');

    },





    createSomeMorphs: function() {
        // this method creates 4 morphs: yellowRectange is the outer parent
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
    }

},
'testing', {
    test00WildcardSelector: function() {
        this.assertSelector([this.redRectangle, this.yellowRectangle, this.blueRectangle1, this.blueRectangle2],
            [],
            this.yellowRectangle, '*',
            'Could not select all rectangles via "*"');
    },
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
    test13Root: function() {
       this.assertSelector([this.yellowRectangle],
            [this.blueRectangle2, this.redRectangle, this.blueRectangle1],
            this.yellowRectangle,
            ':root',
            'Could not select yellow via ":root"');
    },



    assertSelector: function(selectedMorphs, nonSelectedMorphs, context, selector, msg) {
        var test = this;

        var selection = this.sizzle.select(selector, context);
        this.assertArray(selection, selectedMorphs, msg+': Sizzle select did fail');

        context.setStyleSheet(selector+' {outline: 12px solid purple;}');

        this.delay(function() {
            selectedMorphs.each(function(m) {
                    var shapeNode = m.renderContext().shapeNode,
                        morphNode = m.renderContext().morphNode,
                        originNode = m.renderContext().originNode;
                    this.assert(shapeNode,
                        msg+': No shapeNode! Whats going on here?');
                    this.assert(morphNode,
                        msg+': No morphNode! Whats going on here?');
                    this.assertEquals('12px',
                        window.getComputedStyle(shapeNode)['outline-width'],
                         msg+': Style was not applied on a node');
                    this.assertEquals('0px',
                        window.getComputedStyle(morphNode)['outline-width'],
                         msg+': Style was mistakenly applied on morphNode');
                    if (originNode) {
                        this.assertEquals('0px',
                            window.getComputedStyle(originNode)['outline-width'],
                            msg+': Style was mistakenly applied on originNode');
                    }
                }, this);
            nonSelectedMorphs.each(function(m) {
                    var shapeNode = m.renderContext().shapeNode,
                        morphNode = m.renderContext().morphNode,
                        originNode = m.renderContext().originNode;
                    this.assert(shapeNode,
                        msg+': No shapeNode! Whats going on here?');
                    this.assertEquals('0px',
                        window.getComputedStyle(shapeNode)['outline-width'],
                         msg+': Style was mistakenly applied on a node');
                     this.assertEquals('0px',
                        window.getComputedStyle(morphNode)['outline-width'],
                         msg+': Style was mistakenly applied on morphNode');
                    if (originNode) {
                        this.assertEquals('0px',
                            window.getComputedStyle(originNode)['outline-width'],
                            msg+': Style was mistakenly applied on originNode');
                    }
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
AsyncTestCase.subclass('lively.morphic.tests.StyleSheetsHTML.Text',
'running', {
    setUp: function($super) {
        var css = '#test-text {'+
                'text-align: right;' +
                'font-family: Arial;' +
                'font-size: 13px;' +
                'font-style: italic;' +
                'font-weight: bold;' +
                'color: rgb(128, 0, 128);' +
                'vertical-align: top;' +
                'text-decoration: underline;'+
                '}';
        $super();
        this.textMorph = new lively.morphic.Text(new Rectangle(0,0,100,100));
        this.textMorph.setStyleId('test-text');
        this.textMorph.openInWorld();

        this.textMorph.setAlign('center');
        this.textMorph.setFontFamily('Times');
        this.textMorph.setFontSize(20);
        this.textMorph.setFontStyle('normal');
        this.textMorph.setFontWeight(300);
        this.textMorph.setTextColor(Color.black);
        this.textMorph.setTextDecoration('none');
        this.textMorph.setVerticalAlign('bottom');
        this.textMorph.setWordBreak('normal');

        this.textMorph.setStyleSheet(css);
    },

 tearDown: function() {
        this.textMorph.remove();
    },

},
'testing', {
    test01SwitchToStyleSheetStyling: function() {
        var textNode = this.textMorph.renderContext().textNode;
        this.textMorph.setTextStylingMode(true);
        this.assert(this.textMorph.getTextStylingMode(), 'Text styling mode should be on');

        this.delay(function() {
            this.assertEquals('right', $(textNode).css('text-align'),
                'Text align was not properly set via CSS');
            this.assertEquals('Arial', $(textNode).css('font-family'),
                'font-family was not properly set via CSS');
            this.assertEquals('13px', $(textNode).css('font-size'),
                'font-size was not properly set via CSS');
            this.assertEquals('italic', $(textNode).css('font-style'),
                'font-style was not properly set via CSS');
            this.assertEquals('bold', $(textNode).css('font-weight'),
                'font-weight was not properly set via CSS');
            this.assertEquals('rgb(128, 0, 128)', $(textNode).css('color'),
                'color was not properly set via CSS');
            this.assert($(textNode).css('text-decoration').include('underline'),
                'text-decoration was not properly set via CSS: ' + $(textNode).css('text-decoration'));
            this.assertEquals('top', $(textNode).css('vertical-align'),
                'vertial-align was not properly set via CSS');
            this.done();
        }, 0.1);
    },
    test02SwitchBackFromStyleSheetStyling: function() {
        var textNode = this.textMorph.renderContext().textNode;
        this.textMorph.setTextStylingMode(true);
        this.textMorph.setTextStylingMode(false);
        this.assert(!this.textMorph.getTextStylingMode(), 'Text styling mode should be off');

        this.delay(function() {
            this.assertEquals('center', $(textNode).css('text-align'),
                'Text align was not properly reset after switching back from CSS text styling');
            this.assertEquals('Times', $(textNode).css('font-family'),
                'font-family was not properly reset after switching back from CSS text styling');
            this.assertEquals('normal', $(textNode).css('font-style'),
                'font-style was not properly reset after switching back from CSS text styling');
            this.assertEquals('300', $(textNode).css('font-weight'),
                'font-weight was not properly reset after switching back from CSS text styling');
            this.assertEquals('rgb(0, 0, 0)', $(textNode).css('color'),
                'color was not properly reset after switching back from CSS text styling');
            this.assert($(textNode).css('text-decoration').include('none'),
                'text-decoration was not properly reset after switching back from CSS text styling: ' + $(textNode).css('text-decoration'));
            this.assertEquals('bottom', $(textNode).css('vertical-align'),
                'vertial-align was not properly reset after switching back from CSS text styling');
            this.done();
        }, 0.1);
    },
});
})// end of module
