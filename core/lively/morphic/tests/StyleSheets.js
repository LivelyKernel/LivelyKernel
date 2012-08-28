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
        this.morph.classNames = [];
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
        
        this.morph.removeStyleClassName('Test');
        this.assert(!this.morph.isOfStyleClass('test'),
            'Morph should NOT be of class "test"');
        this.assert(this.morph.isOfStyleClass('crazymorph'),
            'Morph should be of class "crazymorph"');

        this.morph.removeStyleClassName('morph');
        this.assert(this.morph.isOfStyleClass('crazymorph'),
            'Morph should still be of class "morph"');
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
        this.assertSizzleSelect([this.blueRectangle1, this.blueRectangle2],
            '.bLuE',
            this.world,
            'selection by class should not be case sensitive and '+
                'include both blue rectangle morphs');
        this.assertSizzleSelect([this.blueRectangle1, this.blueRectangle2],
            '.red .blue',
            this.world,
            'selection by class should include both blue rectangle morphs');
        this.assertSizzleSelect([this.blueRectangle1, this.blueRectangle2],
            '.Red .BLuE',
            this.world,
            'selection by class should not be case sensitive and '+
                'include both blue rectangle morphs');
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
            '.red .box',
            this.world,
            'selection for ".red .box" should only return the blue rectangles');
        this.assertSizzleSelect([],
            '.red .box .box',
            this.world,
            'selection for ".red .box .box" should return nothing');
        this.assertSizzleSelect([this.blueRectangle1,this.blueRectangle2],
            '.red > .blue',
            this.world,
            'selection for ".red > .blue" should return both blue rectangles');
        
        this.assertSizzleSelect([this.redRectangle],
            '.yellow > .box',
            this.world,
            'selection for ".yellow > .box" should return only the red rect');

    },
});



lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheets.CSSForMorphs',
'running', {
    setUp: function($super) {
        $super();
    },
    createSomeMorphs: function() {
        // this method creates 4 morphs: yellowRectange is the ouyter parent
        // redRectangle its embedded submorph, blueRectangle1, blueRectangle1
        // are its submorphs
        var yellowRectangle = lively.morphic.Morph.makeRectangle(0,0, 300, 300);
        yellowRectangle.applyStyle({fill: Color.yellow});
        yellowRectangle.openInWorld();

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

        this.assertEquals('.some-class', rules[0].selectorText(), 'Selector of first rule is not .blue');
        this.assertEquals('color', rules[0].declarations[0].property,
            'First declaration in rule is not for color');
        var decl = rules[0].declarations[0];
        this.assertEquals('red', decl.valueText,
            'First declaration in rule is not color red but ' + Strings.print(decl.valueText));
    },
    test02FindCSSRulesForMorphWithMorphItselfAsSizzleContext: function() {
        var css = ".some-class { color: red; }";
        this.morph.addStyleClassName('some-class');

        this.morph.setStyleSheet(css);
        var rules = this.morph.getMatchingStyleSheetRules();
        this.assertEquals('.some-class', rules[0].selectorText(), 'Selector of first rule is not .some-class');
    },
    test03MorphsHaveOnlyMatchingCSSRules: function() {
        this.createSomeMorphs(); // sets up a hierarchy of morphs
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
        this.assertEquals('.blue:nth-child(1)', b1css [0].selectorText(), 'Selector of first rule in blueRectangle2 is not .blue:nth-child(1)');
        
        this.assert(this.blueRectangle2.getMatchingStyleSheetRules(), 'Blue Rectangle 2 has no rule attribute');
        var b2css = this.blueRectangle2.getMatchingStyleSheetRules();
        this.assertEquals(1, b2css.length, 'Blue Rectangle 2 has not exactly 1 rule');
        this.assertEquals('.blue:nth-child(2)', b2css[0].selectorText(), 'Selector of first rule in blueRectangle2 is not .blue:nth-child(2)');

        this.assert(this.redRectangle.getMatchingStyleSheetRules(), 'Red Rectangle has no rule attribute');
        var rcss = this.redRectangle.getMatchingStyleSheetRules();
        this.assertEquals(1, rcss.length, 'RedRectangle has not exactly 1 rule');
        this.assertEquals('.red', rcss[0].selectorText(), 'Selector of first rule in RedRectangle is not .red');
        
    },
    test05MorphsHaveOnlyCurrentCSSRules: function() {
        this.createSomeMorphs(); // sets up a hierarchy of morphs
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
        this.assertEquals('#the-red-rectangle', rcss[0].selectorText(),
            'Selector of first rule in RedRectangle is not #the-red-rectangle');
        this.assertEquals('#the-red-rectangle', rcss[1].selectorText(),
            'Selector of 2nd rule in RedRectangle is not #the-red-rectangle');
    },

    test06GetSortedRules: function() {
        
        var worldCss = '.red { color: red;}'+ //1
                '#the-red-rectangle.red {color: blue;}' + //3
                '#the-red-rectangle, #the-blue-rectangle, #the-blue-rectangle { color: green }', //2
            yellowCss = '.red { color: black;}', //4
            getVal = function(rule) {
                    return rule.declarations.first().values.first().value;
                },
            sortedRules;
        this.createSomeMorphs(); // sets up a hierarchy of morphs

        this.world.setStyleSheet(worldCss);
        this.yellowRectangle.setStyleSheet(yellowCss);
        sortedRules = this.redRectangle.sortStyleSheetRules();

        this.assertEquals(4, sortedRules.length, 'redRectangle should have 4 rules');

        this.assertEquals('red', getVal(sortedRules[0]),
            'rule 0 should have color red');
        this.assertEquals('green', getVal(sortedRules[1]),
            'rule 1 should have color green');
        this.assertEquals('blue', getVal(sortedRules[2]),
            'rule 2 should have color blue');
        this.assertEquals('black', getVal(sortedRules[3]),
            'rule 3 should have color black');
    },
    test04GetRuleSpecificityOnMorph: function() {
        var css = ".blue, #the-red-rectangle.red, #the-red-rectangle, .red { color: red; }",
            rules = apps.cssParser.parse(css);
        this.createSomeMorphs(); // sets up a hierarchy of morphs
        
        this.assertEquals(10,
            this.blueRectangle1.getStyleSheetRuleSpecificity(rules.first()),
            'rule specificity on blue rect has to be 10');
        this.assertEquals(110,
            this.redRectangle.getStyleSheetRuleSpecificity(rules.first()),
            'rule specificity on red rect has to be 110');
    },

    test07GetStyleSheetDeclarations: function() {

        var css = '.blue{ background-color: blue; }'+
                '#blue2.blue { background-color: black; }'+
                '.blue:nth-child(2) { background-color: yellow!important; }'+
                '.red { color: red; background-color: green;}'+
                '#the-red-rectangle { background-color: red; }',
            getDecl = function(decls, property){
                    return decls.filter(function(d){
                            return (d.property === property)
                        }).first().values.first().value;
                };
        this.createSomeMorphs(); // sets up a hierarchy of morphs

        this.world.setStyleSheet(css);

        var blue1Styles = this.blueRectangle1.getStyleSheetDeclarations(),
            blueStyles1BackgroundColorValue = getDecl(blue1Styles, 'background-color');
        this.assertEquals('blue', blueStyles1BackgroundColorValue,
            'background-color of blue1 should be blue');

        var blue2Styles = this.blueRectangle2.getStyleSheetDeclarations(),
            blueStyles2BackgroundColorValue = getDecl(blue2Styles, 'background-color');

        this.assertEquals('yellow', blueStyles2BackgroundColorValue,
            'background-color of blue2 should be yellow');

        var redStyles = this.redRectangle.getStyleSheetDeclarations(),
            redBackgroundColorValue = getDecl(redStyles, 'background-color'),
            redTextColorValue = getDecl(redStyles, 'color');

        this.assertEquals('red', redBackgroundColorValue ,
            'background-color of red should be red');
        this.assertEquals('red', redTextColorValue ,
            'color of red should be red');
    },});

TestCase.subclass('lively.morphic.tests.StyleSheets.CSSRuleInterface',
'testing', {
    test01RuleOfCSSClassDef: function() {
        var css = ".some-class { color: red; }",
            rules = apps.cssParser.parse(css);
        this.assertEquals(1, rules.length, 'no rule parsed');
        var expected = {
            mSelectorText: '.some-class',
            declarations: [{property: 'color', valueText: 'red'}]
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

});

}) // end of module