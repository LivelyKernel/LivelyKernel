module('apps.tests.paperjs').requires('lively.morphic.tests.Helper', 'apps.paperjs').toRun(function() {

lively.morphic.tests.MorphTests.subclass('apps.tests.paperjs.Paths',
'testing', {
    test01CreateSimplePathMorph: function() {
        var path = new apps.paperjs.Path([pt(0,0), pt(100,50)]);
        path.setStrokeWidth(6);
        this.assertEquals(rect(-3,-3, 103, 53), path.bounds());
        this.assertEquals([pt(3,3), pt(103,53)], path.getVertices());
    },

    test02NormalizeVertices: function() {
        var path = new apps.paperjs.Path([pt(0,0)]);
        path.setPosition(pt(10,10));
        path.setVertices([pt(0,0), pt(20,-10), pt(40,0)])
        path.setStrokeWidth(6);
        this.assertEquals(rect(7,-3, 43, 13), path.bounds());
        this.assertEquals([pt(3,13), pt(23,3), pt(43,13)], path.getVertices());
        this.assertEquals(pt(7,-3), path.getPosition());
    },

    test03SimpleCopy: function() {
        var path = new apps.paperjs.Path([pt(0,0)]);
        path.setVertices([pt(0,0), pt(10,10)]);
        var copy = path.copy();
        this.assertEquals(copy.getVertices(), path.getVertices());
    }

});

}); // end of module
