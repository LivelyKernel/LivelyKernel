module('lively.morphic.tests.StyleSheet').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheet.CSSForMorphs',
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

        this.assertEquals('.some-class', rules[0].selectorText, 'Selector of first rule is not .blue');
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
        this.assertEquals('.some-class', rules[0].selectorText, 'Selector of first rule is not .blue');
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
        this.assertEquals('.blue:nth-child(1)', b1css [0].selectorText, 'Selector of first rule in blueRectangle2 is not .blue:nth-child(1)');
        
        this.assert(this.blueRectangle2.styleSheetRules, 'Blue Rectangle 2 has no rule attribute');
        var b2css = this.blueRectangle2.styleSheetRules;
        this.assertEquals(1, b2css.length, 'Blue Rectangle 2 has not exactly 1 rule');
        this.assertEquals('.blue:nth-child(2)', b2css[0].selectorText, 'Selector of first rule in blueRectangle2 is not .blue:nth-child(2)');

        this.assert(this.redRectangle.styleSheetRules, 'Red Rectangle has no rule attribute');
        var rcss = this.redRectangle.styleSheetRules;
        this.assertEquals(1, rcss.length, 'RedRectangle has not exactly 1 rule');
        this.assertEquals('.red', rcss[0].selectorText, 'Selector of first rule in RedRectangle is not .red');
        
    }
});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheet.SizzleMorphicSelection',
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
        redRectangle.addMorph(blueRectangle2);
        
        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;
        
    },

},
'testing', {
    testWorldFindsMorphByClassName: function() {
        this.morph.addClassName('some-class');
        this.world.addMorph(this.morph);
        var selection = this.sizzle.select('.some-class', this.world);
        this.assertMatches([this.morph], selection, 'selection should include morph');
    },
    testMorphSelectsItself: function() {
        this.morph.addClassName('some-class');
        var selection = this.sizzle.select('.some-class', this.morph);
        this.assertEqualState([this.morph], selection, 'selection should include morph');
    },
    testMorphSelectById: function() {
        var selection = this.sizzle.select('#the-red-rectangle', this.world);
        this.assertEqualState([this.redRectangle], selection, 'selection by id should include red rectangle morph');
    },
    testMorphSelectByClassName: function() {
        var selection = this.sizzle.select('.blue', this.world);
        this.assertEqualState([this.blueRectangle1, this.blueRectangle2], selection, 'selection by class should include both blue rectangle morphs');
    },
    testMorphSelectBySiblingRelation: function() {
        var selection = this.sizzle.select('.blue:nth-child(1)', this.redRectangle);
        this.assertEqualState([this.blueRectangle1], selection, 'selection by sibling relation should include only blue rectangle 1');
        
        selection = this.sizzle.select('.blue:nth-child(2)', this.redRectangle);
        this.assertEqualState([this.blueRectangle2], selection, 'selection by sibling relation should include only blue rectangle 2');
    }});
TestCase.subclass('lively.morphic.tests.StyleSheet.CSSRuleInterface',
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