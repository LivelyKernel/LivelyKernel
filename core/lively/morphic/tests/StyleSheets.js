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
        redRectangle.addClassName('red');
        redRectangle.setNewId('the-red-rectangle');
        redRectangle.testAttribute = 'theRedRectangle';
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addClassName('blue');
        blueRectangle1.setNewId('b1');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addClassName('blue');
        blueRectangle2.setNewId('b2');
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
            this.redRectangle.getSubmorphsByClassName('red'),
            'selection by class only should include Red Rectangle'
        );
        
        this.assertEqualState(this.redRectangle, 
            this.redRectangle.getSubmorphById('the-red-rectangle'),
            'selection by id only should include Red Rectangle'
        );


    },


    
    
    testSelectMorphById: function() {
        this.assertEqualState(this.redRectangle, this.world.getSubmorphById('the-red-rectangle'),
            'selection by id should only include red rectangle morph');

    },
    testSelectMorphByClassName: function() {

        this.assertEqualState([this.blueRectangle1, this.blueRectangle2], 
            this.world.getSubmorphsByClassName('blue'),
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
            this.morph.getClassNames(),
            'Morph does not have class name "morph"'
        );
    },
    test02MorphAddClassNames: function() {
        this.morph.classNames = [];
        this.morph.addClassName('test');

        this.assertEquals(1, this.morph.classNames.length,
            'Class names array in morph is not 1');
        this.assertEquals('test', this.morph.classNames.first(),
            'Class names array should contain "test"');
        this.assertEquals(2, this.morph.getClassNames().length,
            'Class names getter does not return 2');
        this.assertEqualState(['Morph', 'test'], this.morph.getClassNames(),
            'Class names array should contain "Morph" and "test"');

        this.morph.addClassName('test');

        this.assertEquals(1, this.morph.classNames.length,
            'Class names array in morph is not 1');
        this.assertEquals('test', this.morph.classNames.first(),
            'Class names array should contain "test"');
        this.assertEquals(2, this.morph.getClassNames().length,
            'Class names getter does not return 2');
        this.assertEqualState(['Morph', 'test'], this.morph.getClassNames(),
            'Class names array should contain "Morph" and "test"');

        this.morph.addClassName('morph');

        this.assertEquals(2, this.morph.classNames.length,
            'Class names array in morph is not 2');
        this.assertEqualState(['test', 'morph'], this.morph.classNames,
            'Class names array should contain "test" and "morph"');
        this.assertEquals(2, this.morph.getClassNames().length,
            'Class names getter does not return 2');
        this.assertEqualState(['Morph', 'test'], this.morph.getClassNames(),
            'Class names array should contain "morph" and "test"');
        
    },
    test03MorphSetClassNames: function() {
        this.morph.classNames = [];
        this.morph.setClassNames(['test']);

        this.assertEquals(1, this.morph.classNames.length,
            'Class names array in morph is not 1');
        this.assertEquals('test', this.morph.classNames.first(),
            'Class names array should contain "test"');
        this.assertEquals(2, this.morph.getClassNames().length,
            'Class names getter does not return 2');
        this.assertEqualState(['Morph', 'test'], this.morph.getClassNames(),
            'Class names array should contain "morph" and "test"');

        this.morph.setClassNames(['test', 'morph', 'tEsT']);

        this.assertEquals(2, this.morph.classNames.length,
            'Class names array in morph is not 2 after adding "morph"');
        this.assertEqualState(['test', 'morph'], this.morph.classNames,
            'Class names array should contain "test" and "morph" after adding "morph"');
        this.assertEquals(2, this.morph.getClassNames().length,
            'Class names getter does not return 2 after adding "morph"');
        this.assertEqualState(['Morph', 'test'], this.morph.getClassNames(),
            'Class names array should contain "morph" and "test" after adding "morph"');
        
        this.morph.setClassNames();
        this.assert(!this.morph.classNames,
            'Morph shouldn\'t have a classNames attribute after resetting');
        this.assertEquals(1, this.morph.getClassNames().length,
            'Class names getter does not return 1 after resetting');
        this.assertEqualState(['Morph'], this.morph.getClassNames(),
            'Class names array should only contain "morph" after resetting');
    },
    test04MorphIsOfClass: function() {
        this.morph.setClassNames(['test', 'CrAzYmOrPh']);

        this.assert(this.morph.isOfClass('morph'),
            'Morph should be of class "morph"');
        this.assert(!this.morph.isOfClass('orph'),
            'Morph should NOT be of class "orph"');
        this.assert(this.morph.isOfClass('test'),
            'Morph should be of class "test"');
        this.assert(this.morph.isOfClass('Test'),
            'Morph should be of class "Test"');
        this.assert(this.morph.isOfClass('crazymorph'),
            'Morph should be of class "crazymorph"');
        this.assert(this.morph.isOfClass('morph test crazymorph'),
            'Morph should be of class "morph test crazymorph"');
        this.assert(this.morph.isOfClass('crazymorph test morph'),
            'Morph should be of class "crazymorph test morph"');
    },
    test05MorphRemoveClassName: function() {
        this.morph.setClassNames(['test', 'CrAzYmOrPh']);

        this.morph.removeClassName('Test');
        this.assert(!this.morph.isOfClass('test'),
            'Morph should NOT be of class "test"');
        this.assert(this.morph.isOfClass('crazymorph'),
            'Morph should be of class "crazymorph"');

        this.morph.removeClassName('morph');
        this.assert(this.morph.isOfClass('crazymorph'),
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
        yellowRectangle.addClassName('yellow');
        yellowRectangle.openInWorld();
        

        var redRectangle = lively.morphic.Morph.makeRectangle(25, 25, 250, 250);
        redRectangle.applyStyle({fill: Color.red});
        redRectangle.addClassName('red');
        redRectangle.setNewId('the-red-rectangle');
        redRectangle.testAttribute = 'theRedRectangle';
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addClassName('blue');
        blueRectangle1.setNewId('b1');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addClassName('blue');
        blueRectangle2.setNewId('b2');
        redRectangle.addMorph(blueRectangle2);
        
        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;
        
    },

},
'testing', {

    
    
    testMorphSelectsItself: function() {
        debugger
        
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
        /*
        var selection = this.sizzle.select('#the-red-rectangle', this.world);
        this.assertEqualState([this.redRectangle], selection,
            'selection by id should include red rectangle morph');
        */
    },
    testSelectMorphByClassName: function() {
        debugger
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
        debugger
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
        redRectangle.addClassName('red');
        redRectangle.setNewId('the-red-rectangle');
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addClassName('blue');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addClassName('blue');
        blueRectangle2.setNewId('blue2');
        redRectangle.addMorph(blueRectangle2);
        
        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;
        
    },
    
},
'testing', {
    test01ProcessStyleSheet: function() {
        //this.openMorphsInRealWorld();
        var css = ".some-class { color: red; }";
        this.morph.addStyleClassName('some-class');
        this.world.addMorph(this.morph);
        this.world.processStyleSheet(css);

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
        this.morph.addClassName('some-class');

        this.morph.processStyleSheet(css);
        var rules = this.morph.getMatchingStyleSheetRules;
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

        this.yellowRectangle.processStyleSheet(css);
        
        this.assert(this.blueRectangle1.styleSheetRules, 'Blue Rectangle 1 has no rule attribute');
        var b1css = this.blueRectangle1.styleSheetRules;
        this.assertEquals(1, b1css.length, 'Blue Rectangle 1 has not exactly 1 rule');
        this.assertEquals('.blue:nth-child(1)', b1css [0].selectorText(), 'Selector of first rule in blueRectangle2 is not .blue:nth-child(1)');
        
        this.assert(this.blueRectangle2.styleSheetRules, 'Blue Rectangle 2 has no rule attribute');
        var b2css = this.blueRectangle2.styleSheetRules;
        this.assertEquals(1, b2css.length, 'Blue Rectangle 2 has not exactly 1 rule');
        this.assertEquals('.blue:nth-child(2)', b2css[0].selectorText(), 'Selector of first rule in blueRectangle2 is not .blue:nth-child(2)');

        this.assert(this.redRectangle.styleSheetRules, 'Red Rectangle has no rule attribute');
        var rcss = this.redRectangle.styleSheetRules;
        this.assertEquals(1, rcss.length, 'RedRectangle has not exactly 1 rule');
        this.assertEquals('.red', rcss[0].selectorText(), 'Selector of first rule in RedRectangle is not .red');
        
    },
    test05MorphsHaveOnlyCurrentCSSRules: function() {
        this.createSomeMorphs(); // sets up a hierarchy of morphs
        var firstCSS = ".red { color: red; }",
            secondCSS = "#the-red-rectangle { color: green; }",
            worldCSS = "#the-red-rectangle { color: black; }";

        this.yellowRectangle.processStyleSheet(firstCSS);
        this.world.processStyleSheet(worldCSS );


        this.assert(this.redRectangle.styleSheetRules, 'Red Rectangle has no rule attribute');
        var rcss = this.redRectangle.styleSheetRules;
        this.assertEquals(2, rcss.length,
            'RedRectangle has not exactly 2 rules before 2nd processing');

        this.yellowRectangle.processStyleSheet(secondCSS);
        rcss = this.redRectangle.styleSheetRules;
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

        this.world.processStyleSheet(worldCss);
        this.yellowRectangle.processStyleSheet(yellowCss);
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

        this.world.processStyleSheet(css);

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