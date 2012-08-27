module('lively.morphic.tests.StyleSheetsHTML').requires('lively.morphic.tests.Helper', 'lively.morphic.HTML', 'lively.morphic.StyleSheetsHTML').toRun(function() {

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
            'Class names array in morph is not 1');
        this.assertEquals('test', this.morph._StyleClassNames.first(),
            'Class names array should contain "test"');
        this.assertEquals(2, this.morph.getStyleClassNames().length,
            'Class names getter does not return 2');
        this.assertEqualState(['Morph', 'test'], this.morph.getStyleClassNames(),
            'Class names array should contain "Morph" and "test"');

        this.morph.addStyleClassName('test');

        this.assertEquals(1, this.morph._StyleClassNames.length,
            'Class names array in morph is not 1');
        this.assertEquals('test', this.morph._StyleClassNames.first(),
            'Class names array should contain "test"');
        this.assertEquals(2, this.morph.getStyleClassNames().length,
            'Class names getter does not return 2');
        this.assertEqualState(['Morph', 'test'], this.morph.getStyleClassNames(),
            'Class names array should contain "Morph" and "test"');

        this.morph.addStyleClassName('morph');

        this.assertEquals(2, this.morph._StyleClassNames.length,
            'Class names array in morph is not 2');
        this.assertEqualState(['test', 'morph'], this.morph._StyleClassNames,
            'Class names array should contain "test" and "morph"');
        this.assertEquals(2, this.morph.getStyleClassNames().length,
            'Class names getter does not return 2');
        this.assertEqualState(['Morph', 'test'], this.morph.getStyleClassNames(),
            'Class names array should contain "morph" and "test"');
        
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

        this.assertEquals(2, this.morph._StyleClassNames.length,
            'Class names array in morph is not 2 after adding "morph"');
        this.assertEqualState(['test', 'morph'], this.morph._StyleClassNames,
            'Class names array should contain "test" and "morph" after adding "morph"');
        this.assertEquals(2, this.morph.getStyleClassNames().length,
            'Class names getter does not return 2 after adding "morph"');
        this.assertEqualState(['Morph', 'test'], this.morph.getStyleClassNames(),
            'Class names array should contain "morph" and "test" after adding "morph"');
        
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

        this.assert(this.morph.isOfStyleClass('morph'),
            'Morph should be of class "morph"');
        this.assert(!this.morph.isOfStyleClass('orph'),
            'Morph should NOT be of class "orph"');
        this.assert(this.morph.isOfStyleClass('test'),
            'Morph should be of class "test"');
        this.assert(this.morph.isOfStyleClass('Test'),
            'Morph should be of class "Test"');
        this.assert(this.morph.isOfStyleClass('crazymorph'),
            'Morph should be of class "crazymorph"');
        this.assert(this.morph.isOfStyleClass('morph test crazymorph'),
            'Morph should be of class "morph test crazymorph"');
        this.assert(this.morph.isOfStyleClass('crazymorph test morph'),
            'Morph should be of class "crazymorph test morph"');
    },
    test05MorphRemoveClassName: function() {
        this.morph.setStyleClassNames(['test', 'CrAzYmOrPh']);
        debugger
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

}) // end of module