module('lively.morphic.tests.ShapeTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.morphic.tests.ShapeTests.ExternalShapeTest',
'testing', {

    test01InitExternalShapeSetsExtent: function() {
        var elem = document.createElement('input'),
            shape = new lively.morphic.Shapes.External(elem);
        shape.stringifiedShapeNode = '<input xmlns="http://www.w3.org/1999/xhtml" type="checkbox" style="width: 3px; height: 15px; " />';
debugger
        shape.initFromStringifiedShapeNode();
        this.assertEquals(pt(3, 15), shape.getExtent());
    },
})


}) // end of module