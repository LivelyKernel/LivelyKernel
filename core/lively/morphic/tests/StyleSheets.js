module('lively.morphic.tests.StyleSheets').requires('lively.morphic.tests.Helper', 'lively.morphic.StyleSheets').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheets.MorphSelection',
'running', {
    setUp: function($super) {
        $super();
        this.createSomeMorphs();
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
},
'testing', {
    testMorphSelectsItself: function() {
        this.assertEqualState([this.redRectangle],
            this.redRectangle.getSubmorphsByStyleClassName('red'),
            'selection by class only should include Red Rectangle'
        );

        this.assertEqualState(this.redRectangle,
            this.redRectangle.getSubmorphByStyleId('the-red-rectangle'),
            'selection by id only should include Red Rectangle'
        );
    },
    testSelectMorphById: function() {
        this.assertEqualState(this.redRectangle, this.world.getSubmorphByStyleId('the-red-rectangle'),
            'selection by id should only include red rectangle morph');
        this.assertEquals(null, this.world.getSubmorphByStyleId('the-Red-rectangle'),
            'selection by other case id should return null');
    },
    testMorphHasStyleId: function() {
        this.assert(this.redRectangle.hasStyleId('the-red-rectangle'),
            'Red rect should have style id the-red-rectangle');
        this.assert(!this.redRectangle.hasStyleId('the-Red-rectangle'),
            'Red rect should NOT have style id the-Red-rectangle');
    },
    testSelectMorphByClassName: function() {

        this.assertEqualState([this.blueRectangle1, this.blueRectangle2],
            this.world.getSubmorphsByStyleClassName('blue'),
            'selection by class should include both blue rectangle morphs');
    },
    testSelectMorphByTagName: function() {

        this.assertEqualState([this.blueRectangle2],
            this.world.getSubmorphsByTagName('blueRectangleTag'),
            'selection by tag should include the 2nd blue rectangle morph only');
    },
    testSelectMorphByAttributes: function() {
        this.assertEqualState([this.yellowRectangle, this.redRectangle],
            this.world.getSubmorphsByAttribute('testAttribute'),
            'selection by attribute should include the yellow and the red morph');

        this.assertEqualState([this.yellowRectangle],
            this.world.getSubmorphsByAttribute('testAttribute', 'theYellowRectangle'),
            'selection by attribute should include the yellow morph');

        this.assertEqualState([this.yellowRectangle],
            this.world.getSubmorphsByAttribute('testAttribute', 'tHeYellOwRectAnglE', true),
            'selection by attribute should include the yellow morph (case insensitive)');
    },
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheets.MorphClassNames',
'running', {
    setUp: function($super) {
        $super();
    },
},
'testing', {

    test01MorphGetObjectSpecificClassNames: function() {
        this.morph.classNames = [];
        this.assertEqualState(['Morph'],
            this.morph.getStyleClassNames(),
            'Morph does not have class name "morph"'
        );
    },
    test02MorphAddClassNames: function() {
        this.morph.setStyleClassNames([]);
        this.morph.addStyleClassName('test');

        this.assertEquals(1, this.morph._StyleClassNames.length,
            'Class names array in morph is not 1 after first add');
        this.assertEquals('test', this.morph._StyleClassNames.first(),
            'Class names array should contain "test" after first add');
        this.assertEquals(2, this.morph.getStyleClassNames().length,
            'Class names getter does not return 2 after first add');
        this.assertEqualState(['Morph', 'test'], this.morph.getStyleClassNames(),
            'Class names array should contain "Morph" and "test" after first add');

        this.morph.addStyleClassName('test');

        this.assertEquals(1, this.morph._StyleClassNames.length,
            'Class names array in morph is not 1 after second add');
        this.assertEquals('test', this.morph._StyleClassNames.first(),
            'Class names array should contain "test" after second add');
        this.assertEquals(2, this.morph.getStyleClassNames().length,
            'Class names getter does not return 2 after second add');
        this.assertEqualState(['Morph', 'test'], this.morph.getStyleClassNames(),
            'Class names array should contain "Morph" and "test" after second add');

        this.morph.addStyleClassName('morph');

        this.assertEquals(2, this.morph._StyleClassNames.length,
            'Class names array in morph is not 2 after third add');
        this.assertEqualState(['test', 'morph'], this.morph._StyleClassNames,
            'Class names array should contain "test" and "morph" after third add');
        this.assertEquals(3, this.morph.getStyleClassNames().length,
            'Class names getter does not return 3 after third add');
        this.assertEqualState(['Morph', 'test', 'morph'], this.morph.getStyleClassNames(),
            'Class names array should contain "Morph", "morph" and "test" after third add');

    },
    test03MorphSetClassNames: function() {
        this.morph.classNames = [];
        this.morph.setStyleClassNames(['test']);

        this.assertEquals(1, this.morph._StyleClassNames.length,
            'Class names array in morph is not 1');
        this.assertEquals('test', this.morph._StyleClassNames.first(),
            'Class names array should contain "test"');
        this.assertEquals(2, this.morph.getStyleClassNames().length,
            'Class names getter does not return 2');
        this.assertEqualState(['Morph', 'test'], this.morph.getStyleClassNames(),
            'Class names array should contain "morph" and "test"');

        this.morph.setStyleClassNames(['test', 'morph', 'tEsT']);

        this.assertEquals(3, this.morph._StyleClassNames.length,
            'Class names array in morph is not 3 after adding "morph"');
        this.assertEqualState(['test', 'morph', "tEsT"], this.morph._StyleClassNames,
            'Class names array should contain "test" "tEsT" and "morph" after adding "morph"');
        this.assertEquals(4, this.morph.getStyleClassNames().length,
            'Class names getter does not return 4 after adding "morph"');
        this.assertEqualState(['Morph', 'test', 'morph', "tEsT"], this.morph.getStyleClassNames(),
            'Class names array should contain "Morph", "morph" and "test" after adding "morph"');

        this.morph.setStyleClassNames();
        this.assert(!this.morph._StyleClassNames,
            'Morph shouldn\'t have a classNames attribute after resetting');
        this.assertEquals(1, this.morph.getStyleClassNames().length,
            'Class names getter does not return 1 after resetting');
        this.assertEqualState(['Morph'], this.morph.getStyleClassNames(),
            'Class names array should only contain "morph" after resetting');
    },
    test04MorphIsOfClass: function() {
        this.morph.setStyleClassNames(['test', 'CrAzYmOrPh']);

        this.assert(this.morph.isOfStyleClass('Morph'),
            'Morph should be of class "Morph"');
        this.assert(!this.morph.isOfStyleClass('orph'),
            'Morph should NOT be of class "orph"');
        this.assert(this.morph.isOfStyleClass('test'),
            'Morph should be of class "test"');
        this.assert(!this.morph.isOfStyleClass('Test'),
            'Morph should not be of class "Test"');
        this.assert(!this.morph.isOfStyleClass('crazymorph'),
            'Morph should not be of class "crazymorph"');
        this.assert(this.morph.isOfStyleClass('Morph test CrAzYmOrPh'),
            'Morph should be of class "morph test crazymorph"');
        this.assert(this.morph.isOfStyleClass('CrAzYmOrPh test Morph'),
            'Morph should be of class "crazymorph test morph"');
    },
    test05MorphRemoveClassName: function() {
        this.morph.setStyleClassNames(['test', 'CrAzYmOrPh']);

        this.morph.removeStyleClassName('test');
        this.assert(!this.morph.isOfStyleClass('test'),
            'Morph should NOT be of class "test"');
        this.assert(this.morph.isOfStyleClass('CrAzYmOrPh'),
            'Morph should be of class "CrAzYmOrPh"');

        this.morph.removeStyleClassName('Morph');
        this.assert(this.morph.isOfStyleClass('Morph'),
            'Morph should still be of class "Morph"');
    }
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheets.SizzleMorphicSelection',
'running', {
    setUp: function($super) {
        $super();
        this.sizzle = new lively.morphic.Sizzle();
        this.createSomeMorphs();
    },
    createSomeMorphs: function() {
        // this method creates 4 morphs: yellowRectange is the ouyter parent
        // redRectangle its embedded submorph, blueRectangle1, blueRectangle1
        // are its submorphs
        var yellowRectangle = lively.morphic.Morph.makeRectangle(0,0, 300, 300);
        yellowRectangle.applyStyle({fill: Color.yellow});
        yellowRectangle.tagName = 'YellowRectangle';
        yellowRectangle.testAttribute = 'theYellowRectangle';
        yellowRectangle.addStyleClassName('yellow');
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
        redRectangle.addMorph(blueRectangle2);

        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;
    },
},
'testing', {
    testMorphSelectsItself: function() {
        this.assertSizzleSelect(
            [this.blueRectangle1],
            '*',
            this.blueRectangle1,
            'selection by asterisk should include only Blue Rectangle 1'
        );

        this.assertSizzleSelect(
            [this.redRectangle],
            '.red',
            this.redRectangle,
            'selection by class only should include Red Rectangle'
        );

        this.assertSizzleSelect(
            [this.redRectangle],
            '*.red',
            this.redRectangle,
            'selection by combined selector only should include Red Rectangle'
        );
    },
    assertSizzleSelect: function(expected, selector, context, msg) {
        var selection = this.sizzle.select(selector, context),
            sizeEquals = (expected.length === selection.length);

        this.assert(sizeEquals && expected.all(function(ea) {
                return selection.include(ea);
            }), msg);
    },
    testSelectMorphById: function() {

        this.assertSizzleSelect([this.redRectangle],
            '#the-red-rectangle',
            this.world,
            'selection by id should include red rectangle morph');
    },
    testSelectMorphByClassName: function() {

        this.assertSizzleSelect([this.blueRectangle1, this.blueRectangle2],
            '.blue',
            this.world,
            'selection by class should include both blue rectangle morphs');
        this.assertSizzleSelect([],
            '.bLuE',
            this.world,
            'selection by class should BE case sensitive and '+
                'include no morphs');
        this.assertSizzleSelect([this.blueRectangle1, this.blueRectangle2],
            '.red .blue',
            this.world,
            'selection by class should include both blue rectangle morphs');
        this.assertSizzleSelect([],
            '.Red .BLuE',
            this.world,
            'selection by class should BE case sensitive and '+
                'include no morphs');
    },
    testSelectMorphByClassWithSeed: function() {
        var selection = this.sizzle.select('.blue', this.world, null, [this.blueRectangle1]),
            sizeEquals = (1 === selection.length);

        this.assert(sizeEquals && [this.blueRectangle1].all(function(ea) {
                return selection.include(ea);
            }), 'selection by with seed should include only blueRectangle1');
    },

    testSelectMorphBySiblingRelation: function() {
        this.assertSizzleSelect([this.redRectangle, this.blueRectangle1],
            ':nth-child(1)',
            this.redRectangle,
            'selection by sibling relation should include red rectangle and blue rectangle 1');

        this.assertSizzleSelect([this.blueRectangle2],
            ':nth-child(2)',
            this.redRectangle,
            'selection by sibling relation should include only blue rectangle 2');

        this.assertSizzleSelect([this.redRectangle],
            ':only-child',
            this.yellowRectangle,
            'selection by sibling relation should include only red rectangle');

        this.assertSizzleSelect([this.blueRectangle1, this.blueRectangle2],
            ':empty',
            this.yellowRectangle,
            'selection by only-child relation should include both blue rectangles');
    },
    testSelectMorphByAttributes: function() {
        this.assertSizzleSelect([this.yellowRectangle, this.redRectangle],
            '[testAttribute]',
            this.world,
            'selection for attribute "testAttribute" should return yellow rectangle and red rectangle');

        this.assertSizzleSelect([this.yellowRectangle],
            '[testAttribute="theYellowRectangle"]',
            this.world,
            'selection for attribute "testAttribute=theYellowRectangle" should return yellow rectangle');

        this.assertSizzleSelect([this.yellowRectangle, this.redRectangle],
            '[testAttribute^="the"]',
            this.world,
            'selection for attribute "testAttribute^=the" should return yellow and red rectangles');

        this.assertSizzleSelect([this.yellowRectangle, this.redRectangle],
            '[testAttribute*="ectan"]',
            this.world,
            'selection for attribute "testAttribute*=ectan" should return yellow and red rectangles');

        this.assertSizzleSelect([this.yellowRectangle, this.redRectangle],
            '[testAttribute$="Rectangle"]',
            this.world,
            'selection for attribute "testAttribute$=Rectangle" should return yellow and red rectangles');
    },

    testDoNotSelectMorphByClass: function() {
        this.assertSizzleSelect([this.yellowRectangle, this.redRectangle],
            ':not(.blue)',
            this.yellowRectangle,
            'selection by not-class should return yellow and red rectangles');
    },
    testSelectMorphByOwnership: function() {
        this.assertSizzleSelect([this.blueRectangle1,this.blueRectangle2],
            '.red .blue',
            this.world,
            'selection for ".red .blue" should return both blue rectangles');
        this.assertSizzleSelect([this.blueRectangle1,this.blueRectangle2],
            '.red .Box',
            this.world,
            'selection for ".red .Box" should only return the blue rectangles');
        this.assertSizzleSelect([],
            '.red .Box .Box',
            this.world,
            'selection for ".red .Box .Box" should return nothing');
        this.assertSizzleSelect([this.blueRectangle1,this.blueRectangle2],
            '.red > .blue',
            this.world,
            'selection for ".red > .blue" should return both blue rectangles');

        this.assertSizzleSelect([this.redRectangle],
            '.yellow > .Box',
            this.world,
            'selection for ".yellow > .Box" should return only the red rect');
    },
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheets.CSSForMorphs',
'running', {
    setUp: function($super) {
        $super();
        this.createSomeMorphs(); // sets up a hierarchy of morphs
    },
    createSomeMorphs: function() {
        // this method creates 4 morphs: yellowRectange is the ouyter parent
        // redRectangle its embedded submorph, blueRectangle1, blueRectangle1
        // are its submorphs
        var yellowRectangle = lively.morphic.Morph.makeRectangle(0,0, 300, 300);
        yellowRectangle.applyStyle({fill: Color.yellow});
        yellowRectangle.openInWorld();
        yellowRectangle.addStyleClassName('yellow');

        var redRectangle = lively.morphic.Morph.makeRectangle(25, 25, 250, 250);
        redRectangle.applyStyle({fill: Color.red});
        redRectangle.addStyleClassName('red');
        redRectangle.setStyleId('the-red-rectangle');
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addStyleClassName('blue');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addStyleClassName('blue');
        blueRectangle2.setStyleId('blue2');
        redRectangle.addMorph(blueRectangle2);

        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;

    },
},
'testing', {
    test01SetStyleSheet: function() {
        //this.openMorphsInRealWorld();
        var css = ".some-class { color: red; }";
        this.morph.addStyleClassName('some-class');
        this.world.addMorph(this.morph);
        this.world.setStyleSheet(css);

        var rules = this.morph.getMatchingStyleSheetRules();
        this.assert( 0 < rules.length, 'no rule assigned');

        this.assertEquals('.some-class', rules[0].getSelector(), 'Selector of first rule is not .blue');
        this.assertEquals('color', rules[0].getDeclarations()[0].getProperty(),
            'First declaration in rule is not for color');
        var decl = rules[0].getDeclarations()[0];
        this.assertEquals('red', decl.getValues().first(),
            'First declaration in rule is not color red');
    },
    test01aGetStyleSheet: function() {
        this.assertEquals(null, this.world.getStyleSheet(),
            'GetStyleSheet should return null by default');
        var css = ".some-class { color: red; }";
        this.world.setStyleSheet(css);
        this.assertEquals(".some-class {\n\tcolor: red;\n}", this.world.getStyleSheet(),
            'GetStyleSheet should return style sheet');
    },
    test02FindCSSRulesForMorphWithStyleSheetDefinedInItself: function() {
        var css = ".some-class { color: red; }";
        this.morph.addStyleClassName('some-class');

        this.morph.setStyleSheet(css);
        var rules = this.morph.getMatchingStyleSheetRules();
        this.assertEquals(1, rules.length, 'There has to be exactly one matching rule');
        this.assertEquals('.some-class', rules[0].getSelector(), 'Selector of first rule is not .some-class');

        css = ".blue{color: purple;}";
        this.yellowRectangle.setStyleSheet(css);

        rules = this.blueRectangle1.getMatchingStyleSheetRules();
        this.assertEquals(1, rules.length, 'Blue1: There has to be exactly one matching rule');
        this.assertEquals('.blue', rules[0].getSelector(), 'Blue1: Selector of first rule is not .blue');

        css = ".red .blue{color: purple;}";
        this.yellowRectangle.setStyleSheet(css);

        rules = this.blueRectangle1.getMatchingStyleSheetRules();
        this.assertEquals(1, rules.length, 'Blue2: There has to be exactly one matching rule');
        this.assertEquals('.red .blue', rules[0].getSelector(),
            'Blue2: Selector of first rule is not .red .blue');

        css = ".yellow .red .blue{color: purple;}";
        this.yellowRectangle.setStyleSheet(css);

        rules = this.blueRectangle1.getMatchingStyleSheetRules();
        this.assertEquals(1, rules.length, 'Blue3: There has to be exactly one matching rule');
        this.assertEquals('.yellow .red .blue', rules[0].getSelector(),
            'Blue3: Selector of first rule is not .yellow .red .blue');

    },
    test03MorphsHaveOnlyMatchingCSSRules: function() {
        var css = ".red {"+
            "    border: 1px solid red;"+
            "}"+
            ".blue:nth-child(1) {"+
            "    border: 1px solid black;    "+
            "}"+
            ".blue:nth-child(2) {"+
            "    border: 1px solid yellow;    "+
            "}";

        this.yellowRectangle.setStyleSheet(css);

        this.assert(this.blueRectangle1.getMatchingStyleSheetRules(), 'Blue Rectangle 1 has no rule attribute');
        var b1css = this.blueRectangle1.getMatchingStyleSheetRules();
        this.assertEquals(1, b1css.length, 'Blue Rectangle 1 has not exactly 1 rule');
        this.assertEquals('.blue:nth-child(1)', b1css [0].getSelector(),
            'Selector of first rule in blueRectangle2 is not .blue:nth-child(1)');

        this.assert(this.blueRectangle2.getMatchingStyleSheetRules(), 'Blue Rectangle 2 has no rule attribute');
        var b2css = this.blueRectangle2.getMatchingStyleSheetRules();
        this.assertEquals(1, b2css.length, 'Blue Rectangle 2 has not exactly 1 rule');
        this.assertEquals('.blue:nth-child(2)', b2css[0].getSelector(),
            'Selector of first rule in blueRectangle2 is not .blue:nth-child(2)');

        this.assert(this.redRectangle.getMatchingStyleSheetRules(), 'Red Rectangle has no rule attribute');
        var rcss = this.redRectangle.getMatchingStyleSheetRules();
        this.assertEquals(1, rcss.length, 'RedRectangle has not exactly 1 rule');
        this.assertEquals('.red', rcss[0].getSelector(), 'Selector of first rule in RedRectangle is not .red');

    },
    test04GetRuleSpecificityOnMorph: function() {
        var css = ".blue, #the-red-rectangle.red, #the-red-rectangle, .red { color: red; }",
            rules = apps.cssParser.parse(css).getRules();

        this.assertEquals(10,
            this.blueRectangle1.getStyleSheetRuleSpecificity(rules.first()),
            'rule specificity on blue rect has to be 10');
        this.assertEquals(110,
            this.redRectangle.getStyleSheetRuleSpecificity(rules.first()),
            'rule specificity on red rect has to be 110');
    },
    test05MorphsHaveOnlyCurrentCSSRules: function() {
        var firstCSS = ".red { color: red; }",
            secondCSS = "#the-red-rectangle { color: green; }",
            worldCSS = "#the-red-rectangle { color: black; }";

        this.yellowRectangle.setStyleSheet(firstCSS);
        this.world.setStyleSheet(worldCSS );

        var rcss = this.redRectangle.getMatchingStyleSheetRules();
        this.assert(rcss, 'Red Rectangle has no rule attribute');
        this.assertEquals(2, rcss.length,
            'RedRectangle has not exactly 2 rules before 2nd processing');

        this.yellowRectangle.setStyleSheet(secondCSS);
        rcss = this.redRectangle.getMatchingStyleSheetRules();
        this.assertEquals(2, rcss.length,
           'RedRectangle has not exactly 2 rules after 2nd processing');
        this.assertEquals('#the-red-rectangle', rcss[0].getSelector(),
            'Selector of first rule in RedRectangle is not #the-red-rectangle');
        this.assertEquals('#the-red-rectangle', rcss[1].getSelector(),
            'Selector of 2nd rule in RedRectangle is not #the-red-rectangle');
    },
    test06GetSortedRules: function() {
        var worldCss = '.red { color: red;}'+ //1
                '.red.Box { color: purple;}'+ //3
                '.red.Box { color: yellow;}'+ //4
                '#the-red-rectangle.red {color: blue;}' + //6
                '#the-red-rectangle, #the-blue-rectangle, #the-blue-rectangle { color: green; }', //5
            yellowCss = '.red { color: black;}', //2
            getVal = function(rule) {
                    return rule.declarations.first().values.first();
                },
            sortedRules;
        this.world.setStyleSheet(worldCss);
        this.yellowRectangle.setStyleSheet(yellowCss);
        sortedRules = this.redRectangle.getMatchingStyleSheetRules();

        this.assertEquals(6, sortedRules.length, 'redRectangle should have 5 rules');

        this.assertEquals('red', getVal(sortedRules[0]),
            'rule 0 should have color red');
        this.assertEquals('black', getVal(sortedRules[1]),
            'rule 1 should have color black');
        this.assertEquals('purple', getVal(sortedRules[2]),
            'rule 2 should have color purple');
        this.assertEquals('yellow', getVal(sortedRules[3]),
            'rule 3 should have color yellow');
        this.assertEquals('green', getVal(sortedRules[4]),
            'rule 3 should have color green ');
        this.assertEquals('blue', getVal(sortedRules[5]),
            'rule 4 should have color blue');

    },
    test07GetAggregatedMatchingStyleSheetDeclarations: function() {
        var css = '.blue{ border-top-color: blue; }'+
                '#blue2.blue { border-top-color: black; }'+
                '.blue:nth-child(2) { border-top-color: yellow!important; }'+
                '.red { color: red; border-top-color: green;}'+
                '#the-red-rectangle { border: 1px solid red; }',
            getDecl = function(decls, property){
                    return decls.filter(function(d){
                            return (d.getProperty() === property)
                        }).first().getValues().first();
                };
        this.world.setStyleSheet(css);

        var blue1Styles = this.blueRectangle1.getAggregatedMatchingStyleSheetDeclarations(),
            blueStyles1BackgroundColorValue = getDecl(blue1Styles, 'border-top-color');
        this.assertEquals('blue', blueStyles1BackgroundColorValue,
            'border-top-color of blue1 should be blue');

        var blue2Styles = this.blueRectangle2.getAggregatedMatchingStyleSheetDeclarations(),
            blueStyles2BackgroundColorValue = getDecl(blue2Styles, 'border-top-color');

        this.assertEquals('yellow', blueStyles2BackgroundColorValue,
            'border-top-color of blue2 should be yellow');

        var redStyles = this.redRectangle.getAggregatedMatchingStyleSheetDeclarations(),
            redBackgroundColorValue = getDecl(redStyles, 'border-top-color'),
            redTextColorValue = getDecl(redStyles, 'color');

        this.assertEquals('red', redBackgroundColorValue ,
            'border-top-color of red should be red');
        this.assertEquals('red', redTextColorValue ,
            'color of red should be red');
    },
    test08EnhancePropList: function() {
        var propList = {
                'background-color': {
                    shorthand: 'background',
                    values: [ // only one value for this property
                    [3]]
                },
                'border': {
                    values: [
                    // either one value ...
                    [3],
                    // ... or four
                    [3, 3, 3, 3]]
                },
                'border-color': {
                    shorthand: 'border',
                    values: [
                    // either one value ...
                    [3],
                    // ... or four
                    [3, 3, 3, 3]]
                },
                'border-top-color': {
                    shorthand: 'border-color',
                    values: [ // only one value for this property
                    [3]]
                },
                'border-bottom-color': {
                    shorthand: 'border-color',
                    values: [ // only one value for this property
                    [3]]
                },
            },
        enhancedPropList = apps.cssParser.enhancePropList(propList);
        this.assertEquals(0, enhancedPropList['background-color'].shorthands.length,
            'background-color should have no defined shorthands');
        this.assertEquals(0, enhancedPropList['background-color'].shorthandFor.length,
            'background-color should be no shorthand for any prop');

        this.assertEquals(0, enhancedPropList['border'].shorthands.length,
            'border should have no defined shorthands');
        this.assertEquals(3, enhancedPropList['border'].shorthandFor.length,
            'border should be shorthand for 3 props');
        this.assert(enhancedPropList['border'].shorthandFor.find(function(x) {
                return x === 'border-bottom-color';
            }),
            'border should be shorthand for border-bottom-color');
        this.assert(enhancedPropList['border'].shorthandFor.find(function(x) {
                return x === 'border-top-color';
            }),
            'border should be shorthand for border-top-color');
        this.assert(enhancedPropList['border'].shorthandFor.find(function(x) {
                return x === 'border-color';
            }),
            'border should be shorthand for border-color');


        this.assertEquals(2, enhancedPropList['border-bottom-color'].shorthands.length,
            'border-bottom-color should have 2 defined shorthands');
        this.assertEquals(0, enhancedPropList['border-bottom-color'].shorthandFor.length,
            'border-bottom-color should be no shorthand for any prop');
        this.assert(enhancedPropList['border-bottom-color'].shorthands.find(function(x) {
                return x === 'border-color';
            }),
            'border-bottom-color should have shorthand border-color');
        this.assert(enhancedPropList['border-bottom-color'].shorthands.find(function(x) {
                return x === 'border';
            }),
            'border-bottom-color should have shorthand border');

        this.assertEquals(2, enhancedPropList['border-top-color'].shorthands.length,
            'border-bottom-color should have 2 defined shorthands');
        this.assertEquals(0, enhancedPropList['border-top-color'].shorthandFor.length,
            'border-bottom-color should be no shorthand for any prop');
        this.assert(enhancedPropList['border-top-color'].shorthands.find(function(x) {
                return x === 'border-color';
            }),
            'border-top-color should have shorthand border-color');
        this.assert(enhancedPropList['border-top-color'].shorthands.find(function(x) {
                return x === 'border';
            }),
            'border-top-color should have shorthand border');

        this.assertEquals(1, enhancedPropList['border-color'].shorthands.length,
            'border-color should have 1 defined shorthands');
        this.assertEquals('border', enhancedPropList['border-color'].shorthands.first(),
            'border-color should have shorthand border');
        this.assertEquals(2, enhancedPropList['border-color'].shorthandFor.length,
            'border-bottom-color should be shorthand for 2 props');
        this.assert(enhancedPropList['border-color'].shorthandFor.find(function(x) {
                return x === 'border-top-color';
            }),
            'border-color should be shorthand for border-top-color');
        this.assert(enhancedPropList['border-color'].shorthandFor.find(function(x) {
                return x === 'border-bottom-color';
            }),
            'border-color should be shorthand for border-bottom-color');

    },
    test09GenerateStyleSheetDeclarationOverrideList: function() {
        var css = '.blue{ border-color: orange; }'+
                '.blue.Box{ border-color: blue; }'+
                '#blue2.blue { border: 1px solid black; }'+
                '.blue.Box:nth-child(2) { border-color: yellow!important; }'+
                '.red { color: red; border-color: green;}'+
                '#the-red-rectangle { border-color: red; }',
            getDecl = function(decls, property){
                    return decls.filter(function(d){
                            return (d.getProperty() === property)
                        }).first().getValues().first();
                };
        this.world.setStyleSheet(css);

        var blue1Styles = this.blueRectangle1.getMatchingStyleSheetDeclarations(),
            blue1StyleOverrideList =
                this.blueRectangle1.generateStyleSheetDeclarationOverrideList(blue1Styles);
        this.assertEqualState([1, -1], blue1StyleOverrideList,
            'Override list for blue1 should be [1, -1]');

        var blue2Styles = this.blueRectangle2.getMatchingStyleSheetDeclarations(),
            blue2StyleOverrideList =
                this.blueRectangle2.generateStyleSheetDeclarationOverrideList(blue2Styles);
         this.assertEqualState([1, 2, -1, 2], blue2StyleOverrideList,
            'Override list for blue2 should be [1, 2, -1, 2]');

    },
    test10GetStyleSheetDeclarationValue: function() {
        var css = '.blue{ border-color-left: blue; }'+
                '#blue2.blue { border-left-color: black; }'+
                '.blue:nth-child(2) { border-left-color: yellow!important; }'+
                '.red { color: red; border-left-color: green;}'+
                '#the-red-rectangle { border: 1px solid red; }';
        this.yellowRectangle.setStyleSheet(css);
        this.assertEquals('yellow',
            this.blueRectangle2.getStyleSheetDeclarationValue('border-left-color'),
            'Border color of blue2 should be yellow.');
        this.assertEquals('red',
            this.redRectangle.getStyleSheetDeclarationValue('border-left-color'),
            'Border color of red set through shorthand border and should be red.');
    },
    test11ConvertLengthToPx: function() {
        var morph = this.morph;
        this.assertEquals(19, morph.convertLengthToPx('19px'),
            '"19px" should convert to 19');
        this.assertEquals(0, morph.convertLengthToPx('19pt'),
            '"19pt" should convert to 0');
        this.assertEquals(0, morph.convertLengthToPx('19em'),
            '"19em" should convert to 0');
        this.assertEquals(0, morph.convertLengthToPx('19ex'),
            '"19ex" should convert to 0');
        this.assertEquals(0, morph.convertLengthToPx('19cm'),
            '"19cm" should convert to 0');
        this.assertEquals(0, morph.convertLengthToPx('19'),
            '"19" should convert to 0');
    }
});

TestCase.subclass('lively.morphic.tests.StyleSheets.CSSRuleInterface',
'testing', {
    test01RuleOfCSSClassDef: function() {
        var css = ".some-class { color: red; }",
            rules = apps.cssParser.parse(css).getRules();
        this.assertEquals(1, rules.length, 'no rule parsed');
        var expected = {
            selector: '.some-class',
            declarations: [{property: 'color', values: ['red']}]
        };
        this.assertMatches(expected, rules[0], 'rules don\'t match');
    },
    test02GetRuleSpecificity: function() {
        this.assertEquals(100,
            apps.cssParser.calculateCSSRuleSpecificity('#test'),
            '#test should be specificity 100');
        this.assertEquals(10,
            apps.cssParser.calculateCSSRuleSpecificity('.test'),
            '.test should be specificity 10');
        this.assertEquals(1,
            apps.cssParser.calculateCSSRuleSpecificity('test'),
            '"test" should be specificity 1');
        this.assertEquals(111,
            apps.cssParser.calculateCSSRuleSpecificity('test.test#test'),
            'test.test#test should be specificity 111');
        this.assertEquals(110,
            apps.cssParser.calculateCSSRuleSpecificity('.test#test'),
            '.test#test should be specificity 110');
        this.assertEquals(222,
            apps.cssParser.calculateCSSRuleSpecificity('test.test#test asdf.asdf#asdf'),
            'test.test#test asdf.asdf#asdf should be specificity 222');
    },
    test03ParseStyleSheet: function() {
        var styleSheet =
                '.Morph {\n'+
                '\tbackground: white !important;\n'+
                '\tborder: 10px solid purple;\n'+
                '}\n\n'+
                '/* test */',
            parsedStyleSheet = apps.cssParser.parse(styleSheet);
        this.assert(parsedStyleSheet.isStyleSheet,
            'Parsed style sheet is no lively style sheet object');
        this.assertEquals(2, parsedStyleSheet.getRules().length,
            'Parsed style sheet does not have exactly two rules');

        this.assert(parsedStyleSheet.getRules().first().isStyleSheetRule,
            'First rule is no lively style sheet rule');
        this.assert(parsedStyleSheet.getRules().last().isStyleSheetRule,
            'Last rule is no lively style sheet rule');
        this.assert(parsedStyleSheet.getRules().last().isStyleSheetComment,
            'Last rule is no lively style sheet comment');

        this.assertEquals(2,
            parsedStyleSheet.getRules().first().getDeclarations().length,
            'First style sheet rule does not have exactly two declarations');

        this.assertEquals(styleSheet, parsedStyleSheet.getText(),
            'CSS text output not as expected');
    },
    test04RepeatedParsing: function() {
        var styleSheet =
                '.Morph{\n'+
                '\tbackground: white !important;\n'+
                '\tborder: 10px solid purple;\n'+
                '}\n\n'+
                '/* test */',
            parsedStyleSheet = apps.cssParser.parse(styleSheet),
            doubleparsedStyleSheet
                = apps.cssParser.parse(parsedStyleSheet.getText());
        this.assertEquals(parsedStyleSheet.getText(),
            doubleparsedStyleSheet.getText(),
            'Style sheet output is not the same after repeated parsing');
    },
    test05ParseFontFaceRule: function() {
        var ffRule = '@font-face {\n'+
            'font-family: Gentium;\n'+
            'src: url(http://example.com/fonts/Gentium.ttf);\n}',

            parsedCss = apps.cssParser.parse(ffRule);

        this.assertEquals(1, parsedCss.getRules().length,
            'Parsed font face rule sheet has not exactly one rule');

        var f = parsedCss.getRules().first();

        this.assert(f.isStyleSheetFontFaceRule,
            'First rule is not a lively font face rule');

        this.assertEquals('', f.getSelector(),
            'Selector of FF rule is not ""');
    },
    test06ParseShorthand: function() {
        var shorthandDecl = new lively.morphic.StyleSheetShorthandDeclaration(
                'border', ['1px', 'solid', 'black']),
            decls = shorthandDecl.getDeclarations();
        this.assertEquals(12, decls.length,
            'Border shorthand should produce 12 atomar declarations');
        decls.each(function(decl) {
                var p = decl.getProperty();
                if (p.indexOf('color') >=0) {
                    this.assertEquals('black', decl.getValues().first(),
                        'Value of '+p+' should be black');
                } else  if (p.indexOf('style') >=0) {
                    this.assertEquals('solid', decl.getValues().first(),
                        'Value of '+p+' should be solid');
                } else if (p.indexOf('width') >=0) {
                    this.assertEquals('1px', decl.getValues().first(),
                        'Value of '+p+' should be 1pxa');
                } else {
                    this.assert(false,
                        'There should be no declarations having neither of color'+
                        ', style or width in their property string');
                }
            }, this);
    }
});

}) // end of module