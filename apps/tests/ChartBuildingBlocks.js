module('apps.tests.ChartBuildingBlocks').requires('lively.morphic.tests.Helper','apps.ChartBuildingBlocks').toRun(function() {

lively.morphic.tests.MorphTests.subclass('apps.tests.ChartBuildingBlocks.ChartRendererHooks',
'running', {
    setUp: function($super) {
        $super();
        var someRect = new Rectangle(100, 100, 100, 100);

        this.chartRenderer = new apps.ChartBuildingBlocks.ChartRenderer(someRect),
        this.chartSeriesRenderer = lively.morphic.Morph.makeRectangle(5, 5, 55, 55),
        this.chartDimensionRenderer = lively.morphic.Morph.makeRectangle(5, 5, 55, 55);

        this.chartSeriesRenderer.addScript(function drawSeries(context, series) {
            return context * 5;
        });

        this.chartDimensionRenderer.addScript(function drawDimensions(context, dimensions) {
            return context * 4;
        });
    },
},
'testing', {
    test01AddSubmorphsToRenderer: function() {

        this.chartRenderer.addMorph(this.chartSeriesRenderer);
        this.chartRenderer.addMorph(this.chartDimensionRenderer);
        this.assertEquals(5, this.chartRenderer.drawSeries(1),
            'series hook is not set up correctly');
        this.assertEquals(4, this.chartRenderer.drawDimensions(1),
            'dimensions hook is not set up correctly');
    },
});

lively.morphic.tests.MorphTests.subclass('apps.tests.ChartBuildingBlocks.ChartRendererDefaults',
'running', {
    setUp: function($super) {
        $super();
        var someRect = new Rectangle(100, 100, 100, 100);
        this.chartRenderer = new apps.ChartBuildingBlocks.ChartRenderer(someRect)
    }
},
'testing', {
    test01prepareContextDefault: function() {
        var shapeNode = this.morph.renderContext().shapeNode,
            context = this.chartRenderer.prepareContextDefault(shapeNode);
        this.assertEquals(1, context.length, 'There should be only one context');
        this.assertEquals(1, context.selectAll("svg").length,
            'Context is not an "SVGSVGElement"');
        this.assertEquals(shapeNode, context.first().parentNode,
            'Context parentnode is not the shapenode');
    },
    test02setupDrawingAreasDefault: function() {
        var areaArray
                = this.chartRenderer.setupDrawingAreasDefault(null, 100, 200, [10,5,10,5]);


        this.assert(Array.isArray(areaArray), 'areaArray should be array');
        this.assertEquals(1, areaArray.length, 'areaArray array should be of length 1');
        this.assertEquals(5, areaArray.first().x, 'areaArray left is not correct');
        this.assertEquals(10, areaArray.first().y, 'areaArray top is not correct');
        this.assertEquals(90, areaArray.first().width, 'areaArray width is not correct');
        this.assertEquals(180, areaArray.first().height, 'areaArray height is not correct');
    },

    test03setupScalesDefault: function() {
        this.assertEqualState({}, this.chartRenderer.setupScalesDefault(),
        'setupScalesDefault() does not return an empty object');
    },

    test04drawDimensionsDefault: function() {
        this.assertEquals(1234, this.chartRenderer.drawDimensionsDefault(1234),
            'drawDimensionsDefault() does not return its parameter');
    },

    test05drawSeriesDefault: function() {
        // Nothing should happen here anyways ...
    }

});




}) // end of module