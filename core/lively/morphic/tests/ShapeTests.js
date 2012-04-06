module('lively.morphic.tests.ShapeTests').requires('lively.morphic.tests.Morphic').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ShapeTests.ExternalShapeTest',
'testing', {

    test01InitExternalShapeSetsExtent: function() {
        var elem = document.createElement('input'),
            shape = new lively.morphic.Shapes.External(elem);
        shape.setRenderContext(new lively.morphic.HTML.RenderContext());
        shape.stringifiedShapeNode = '<input'
                                     + ' xmlns="http://www.w3.org/1999/xhtml"'
                                     + ' type="checkbox"'
                                     + ' style="width: 3px; height: 15px;"'
                                     + ' />';
        shape.initFromStringifiedShapeNode();
        this.assertEquals(pt(3, 15), shape.getExtent());
    },

    test02AddASpanShapeThatAutomaticallyDefinesExtent: function() {
        var span = document.createElement('span');
        span.textContent = "a test";
        var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(span));
        this.world.addMorph(morph);
        var extent = morph.getExtent();
        this.assert(extent.x > 0, 'width of morph not bigger than 0');
        this.assert(extent.y > 0, 'height of morph not bigger than 0');
    },

});


}) // end of module