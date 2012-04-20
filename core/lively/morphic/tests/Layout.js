module('lively.morphic.tests.Layout').requires('lively.morphic.tests.Helper', 'lively.morphic.Layout').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.LayoutTests',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
    }
},
'testing', {
    test01DropJournalLayoutOnMorph: function() {
        var container = new lively.morphic.Morph();
        container.setExtent(new lively.Point(200,200));
        container.setFill(Color.red);
        container.setLayouter(new lively.morphic.Layout.JournalLayout());
        this.world.addMorph(container);

        var text = new lively.morphic.Text();
        text.setExtent(new lively.Point(300, text.getExtent().y));
        text.setTextString('hello world');
        text.openInWorld();

        text.growOrShrinkToFit();
        container.addMorph(text);

        this.assertEquals(container.getExtent().y, 2*container.getLayouter().getBorderSize() + text.getExtent().y, "expected morph's extent to be 200");
    },
    test02ApplyHBoxLayout: function() {
        var container = new lively.morphic.Morph();
        container.setExtent(new lively.Point(200,200));
        container.setFill(Color.red);
        container.setLayouter(new lively.morphic.Layout.HorizontalLayout());
        this.world.addMorph(container);

        var child = new lively.morphic.Morph();
        child.setExtent(new lively.Point(200, 200));
        child.layout = {};
        child.layout.resizeWidth = true;
        child.openInWorld();

        container.addMorph(child);

        this.assertEquals(child.getExtent().x, container.getExtent().x - 2*container.getLayouter().getBorderSize(), "expected child to fit into container");
    },
    test03TileLayoutMovesFirstMorphToTopLeft: function() {
        var container = new lively.morphic.Morph();
        container.setExtent(new lively.Point(200,200));
        container.setFill(Color.red);
        var l = new lively.morphic.Layout.TileLayout();
        container.setLayouter(l);
        this.world.addMorph(container);

        var m = new lively.morphic.Morph();

        container.addMorph(m);

        this.assertEquals(m.getPosition(), pt(l.getSpacing(), l.getSpacing()), 'TileLayout did not set correct position of first submorph');
    }
});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.Layout.GridTest',
'testing', {
    testScaleVertically: function() {
        var container = lively.morphic.Morph.makeRectangle(0,0, 100, 100),
            submorph = lively.morphic.Morph.makeRectangle(0,0, 50, 50);
        container.addMorph(submorph);
        container.applyStyle({adjustForNewBounds: true});
        submorph.applyStyle({scaleVertical: true});
        container.setExtent(pt(110, 110));
        this.epsilon = 0.01;
        this.assertEquals(new Rectangle(0,0, 50, 55), submorph.bounds());
    }
});

// merge with existing Grid tests!
lively.morphic.tests.TestCase.subclass('lively.morphic.tests.Layout.GridTest',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
    }
},
'testing', {
    test01GridLayoutDefaultSizes: function() {
        var container = new lively.morphic.Morph();
        container.setExtent(new lively.Point(200,200));
        container.setFill(Color.red);
        var grid = new lively.morphic.Layout.GridLayout();
        container.setLayouter(grid);
        this.world.addMorph(container);

        for (var x = 0; x < grid.numCols; x++) {
            this.assertEquals(grid.defaultColWidth, grid.getMinColWidth(x),
                              'col width should be same as default');
        }
        for (var y = 0; y < grid.numRows; y++) {
            this.assertEquals(grid.defaultRowHeight, grid.getMinRowHeight(y),
                              'row height should be same as default');
        }
    }
});

});