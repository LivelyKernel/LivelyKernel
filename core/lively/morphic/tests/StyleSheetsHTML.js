module('lively.morphic.tests.StyleSheetsHTML').requires('lively.morphic.tests.Helper', 'lively.morphic.HTML', 'lively.morphic.StyleSheetsHTML').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.StyleSheetsHTML.StyleSheets',
'running', {
    setUp: function($super) {
        $super();
    },
},
'testing', {

    assertDOMMorphNodeAttribute: function(targetValue, attributeName, msg) {
        var morphNode = this.renderContext().morphNode;
        return this.assertEqual(targetValue, $(morphNode).attr(attributeName), msg);
    },
    
    test01SetStyleClassNames: function() {
        
        this.morph.addStyleClassName('test-class');
        this.assertDOMMorphNodeAttribute('Morph test-class', 'class',
            'Morph has not class names "Morph test-class"');
        this.morph.removeStyleClassName('test-class');
        this.assertDOMMorphNodeAttribute('Morph', 'class',
            'Morph has not class name "Morph" after removal');
        this.morph.setStyleClassName('test-class');
        this.assertDOMMorphNodeAttribute('Morph test-class', 'class',
            'Morph has not class names "Morph test-class" after re-set');
    },


    
    
    
    

    
});

}) // end of module