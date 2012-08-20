module('lively.morphic.tests.StyleSheet').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheet.CSSForMorphs',
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
        yellowRectangle.openInWorld();

        var redRectangle = lively.morphic.Morph.makeRectangle(25, 25, 250, 250);
        redRectangle.applyStyle({fill: Color.red});
        yellowRectangle.addMorph(redRectangle);

        var blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
        blueRectangle1 .applyStyle({fill: Color.blue});
        redRectangle.addMorph(blueRectangle1);

        var blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
        blueRectangle2 .applyStyle({fill: Color.blue});
        redRectangle.addMorph(blueRectangle2);
        
        this.yellowRectangle = yellowRectangle;
        this.redRectangle = redRectangle;
        this.blueRectangle1 = blueRectangle1;
        this.blueRectangle2 = blueRectangle2;
        
    },
    
    addStyleSheet: function() {
        var css = ".blue {"+
            "    border: 1px solid red;"+
            "}"+

            ".red > .blue {"+
            "    border: 1px solid green;"+
            "}"+

            ".blue:nth-child(2) {"+
            "    border: 1px solid yellow;    "+
            "}";
        this.yellowRectangle.setStyleSheet(css);
    }
    
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
    test02FindCSSRulesForMorph: function() {
        return;
        this.assert(this.blueRectangle2.styleSheetRules, 'Blue Rectangle has no rule attribute');
        var css = this.blueRectangle2.styleSheetRules;
        this.assertEquals(2, css.length, 'Blue Rectangle has not exactly 3 rules');
        this.assertEquals('.blue', css[0].selectorText, 'Selector of first rule is not .blue');

    },
    newMethod: function() {
        // enter comment here
    }


});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheet.SizzleMorphicSelection',
'running', {
    setUp: function($super) {
        $super();
        this.sizzle = new lively.morphic.Sizzle();
    }
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
    }
});

}) // end of module