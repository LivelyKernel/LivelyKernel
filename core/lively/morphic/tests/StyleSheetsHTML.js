module('lively.morphic.tests.StyleSheetsHTML').requires('lively.morphic.tests.Helper', 'lively.morphic.HTML', 'lively.morphic.StyleSheetsHTML').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheetsHTML.StyleSheets',
'running', {
    setUp: function($super) {
        $super();
    },
},
'testing', {

    assertDOMMorphNodeAttribute: function(targetValue, actualValue, attributeName, msg) {
        var morphNode = this.renderContext().morphNode;
        return this.assertEqual(targetValue, $(morphNode).attr(attributeName), msg);
    },
    
    test01AddStyleClass: function() {
        
        this.morph.addStyleClass('test-class');
        
        
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

}) // end of module