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
    },
    test04CalcActualLength: function() {
        var length = 100,
            minimumLength = 150,
            clipPolicy = {hidden: 'scroll', visible: 'visible'};
        this.assertEquals(
            lively.morphic.Layout.calcActualLength(length, minimumLength, clipPolicy.hidden),
            100,
            'a morph with hidden clip policy was kept at a minimum size')
        this.assertEquals(
            lively.morphic.Layout.calcActualLength(length, minimumLength, clipPolicy.visible),
            150,
            'a morph with visible clip policy was resized under its minimum size')
    },
    test05GetInheritedClipMode: function() {
        var m = new lively.morphic.Morph(),
            n = m.copy(),
            policy_hidden = 'hidden',
            policy_complex = {x:'visible', y:'hidden'};
        m.addMorph(n);
        m.setClipMode(policy_hidden);
        n.setClipMode('inherit');
        this.assertEquals(n.getInheritedClipMode(),policy_hidden, 'wrong simple inherited clip mode found')
        n.setClipMode({x: 'visible', y: 'inherit'}),
        this.assertEquals(n.getInheritedClipMode().y,policy_complex.y, 'wrong complex inherited clip mode found')
    }


});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.Layout.BasicTest',
'testing', {
    testScaleVertically: function() {
        var container = lively.morphic.Morph.makeRectangle(0, 0,  100, 100),
            submorph = lively.morphic.Morph.makeRectangle(10, 10, 50,  50);
        container.addMorph(submorph);
        container.applyStyle({adjustForNewBounds: true});
        submorph.applyStyle({scaleVertical: true});
        container.setExtent(pt(110, 110));
        this.epsilon = 0.001;
        this.assertEquals(new Rectangle(10, 11, 50, 55), submorph.bounds());
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