module('lively.morphic.tests.StyleSheet').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheet.CSSForMorphs',
'running', {
    setUp: function($super) {
        $super();
        this.createSomeMorphs();
    },
    createSomeMorphs: function() {
        yellowRectangle = lively.morphic.Morph.makeRectangle(0,0, 300, 300);
yellowRectangle.applyStyle({fill: Color.yellow});
yellowRectangle.openInWorld();

redRectangle = lively.morphic.Morph.makeRectangle(25, 25, 250, 250);
redRectangle.applyStyle({fill: Color.red});
yellowRectangle.addMorph(redRectangle);

blueRectangle1 = lively.morphic.Morph.makeRectangle(10, 10, 150, 100);
blueRectangle1 .applyStyle({fill: Color.blue});
redRectangle.addMorph(blueRectangle1);

blueRectangle2 = lively.morphic.Morph.makeRectangle(10, 160, 150, 80);
blueRectangle2 .applyStyle({fill: Color.blue});
redRectangle.addMorph(blueRectangle2);
    },
},
'testing', {
    
    test01FindCSSRulesForMorph: function() {
        this.assert(false, 'something went wrong');
    }
});

}) // end of module