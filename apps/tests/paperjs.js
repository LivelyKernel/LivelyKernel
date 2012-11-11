module('apps.tests.paperjs').requires('lively.morphic.tests.Helper', 'apps.paperjs').toRun(function() {

lively.morphic.tests.MorphTests.subclass('apps.tests.paperjs.Paths',
'testing', {
    test01CreateSimplePathMorph: function() {
        var path = new apps.paperjs.Path([pt(0,0), pt(100,50)]);
        this.assertEquals(rect(0,0, 100, 50), path.bounds());
        this.assertEquals([pt(0,0), pt(100,50)], path.getVertices());

        // m=new apps.paperjs.Morph()
        // // m.openInWorld()
        // m.drawSomething()
        // path = m.renderContext().path
        // this.assertEquals(rect(0,0, 100, 50), path.bounds);

    },

    test02OffsetWhenVerticesCrossBorder: function() {
        var path = new apps.paperjs.Path([pt(0,0)]);
        path.setPosition(pt(10,10));
        path.setVertices([pt(0,0), pt(20,-10), pt(40,0)])
        this.assertEquals(rect(10,10, 40, 10), path.bounds());
        path.normalizePath();
        this.assertEquals([pt(0,10), pt(20,0), pt(40,10)], path.getVertices());
        this.assertEquals(pt(10,0), path.getPosition());

        // m=new apps.paperjs.Morph()
        // // m.openInWorld()
        // m.drawSomething()
        // path = m.renderContext().path
        // this.assertEquals(rect(0,0, 100, 50), path.bounds);

    }
});

}); // end of module
