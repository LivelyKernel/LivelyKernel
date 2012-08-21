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
        
        debugger
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
        
        this.assertSizzleSelect([this.blueRectangle1, this.blueRectangle2],
            '.blue',
            this.world,
            'selection by class should include both blue rectangle morphs');

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
            '.red > .blue',
            this.world,
            'selection for ".red > .blue" should return both blue rectangles');

    }
    
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
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1.applyStyle({fill: Color.blue});
        blueRectangle1.addClassName('blue');
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2.applyStyle({fill: Color.blue});
        blueRectangle2.addClassName('blue');
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
        this.morph.addClassName('some-class');
        this.world.addMorph(this.morph);
        this.world.processStyleSheet(css);

        var rules = this.morph.styleSheetRules;
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
        var rules = this.morph.styleSheetRules;
        this.assertEquals('.some-class', rules[0].selectorText(), 'Selector of first rule is not .blue');
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
    test04CalculateSpecificity: function() {
        this.assertEquals(100,
            this.morph.calculateCSSRuleSpecificity('#test'),
            '#test should be specificity 100');
        this.assertEquals(10,
            this.morph.calculateCSSRuleSpecificity('.test'),
            '.test should be specificity 10');
        this.assertEquals(1,
            this.morph.calculateCSSRuleSpecificity('test'),
            '"test" should be specificity 1');
        this.assertEquals(111,
            this.morph.calculateCSSRuleSpecificity('test.test#test'),
            'test.test#test should be specificity 111');
        this.assertEquals(110,
            this.morph.calculateCSSRuleSpecificity('.test#test'),
            '.test#test should be specificity 110');
        this.assertEquals(222,
            this.morph.calculateCSSRuleSpecificity('test.test#test asdf.asdf#asdf'),
            'test.test#test asdf.asdf#asdf should be specificity 222');
    },
    test05CompareSpecificity: function() {
        var css = '.some-class { color: red; }'+
            '#some-id.some-class { color: blue; }';
        this.morph.addClassName('some-class');
        this.morph.setNewId('some-id');
        this.world.addMorph(this.morph);
        this.world.processStyleSheet(css);

        var classOnlyRule = this.morph.styleSheetRules.filter(function(rule){
                return (rule.selectorText() === '.some-class');
            }).first(),
            classAndIdRule = this.morph.styleSheetRules.filter(function(rule){
                return (rule.selectorText() === '#some-id.some-class');
            }).first();

        this.assert(this.morph.isRuleMoreSpecific(classAndIdRule, classOnlyRule),
            '#some-id.some-class is more specific than .some-class');
        this.assert(!this.morph.isRuleMoreSpecific(classOnlyRule, classAndIdRule),
            '.some-class is not more specific than #some-id.some-class');
        this.assert(!this.morph.isRuleMoreSpecific(classOnlyRule, classOnlyRule),
            '.some-class is not more specific than .some-class');
    },
    test06GetStyleSheetDeclarations: function() {
        var css = '.blue { background-color: blue; }'+
                '.blue:nth-child(2) { background-color: yellow; }'+
                '.red { color: red; background-color: green;}'+
                '#the-red-rectangle { background-color: red; }';

        this.world.processStyleSheet(css);

        var classOnlyRule = this.morph.styleSheetRules.filter(function(rule){
                return (rule.selectorText() === '.some-class');
            }).first(),
            classAndIdRule = this.morph.styleSheetRules.filter(function(rule){
                return (rule.selectorText() === '#some-id.some-class');
            }).first();

        this.assert(this.morph.isRuleMoreSpecific(classAndIdRule, classOnlyRule),
            '#some-id.some-class is more specific than .some-class');
        this.assert(!this.morph.isRuleMoreSpecific(classOnlyRule, classAndIdRule),
            '.some-class is not more specific than #some-id.some-class');
        this.assert(!this.morph.isRuleMoreSpecific(classOnlyRule, classOnlyRule),
            '.some-class is not more specific than .some-class');
    },















});

TestCase.subclass('lively.morphic.tests.StyleSheets.CSSRuleInterface',
'testing', {
    test01RuleOfCSSClassDef: function() {
        var css = ".some-class { color: red; }",
            rules = apps.cssParser.parse(css);
        this.assertEquals(1, rules.length, 'no rule parsed');
        var expected = {
            selectorText: '.some-class',
            declarations: [{property: 'color', valueText: 'red'}]
        };
        this.assertMatches(expected, rules[0], 'rules don\'t match');
    },
});

}) // end of module