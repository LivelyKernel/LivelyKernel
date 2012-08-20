module('lively.morphic.tests.StyleSheet').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheet.CSSForMorphs',
'running', {
    setUp: function($super) {
        $super();
        this.createSomeMorphs();
    }
},
'testing', {
    
    test01FindCSSRulesForMorph: function() {
        this.assert(false, 'something went wrong');
    }
});

}) // end of module