module('apps.tests.ChartBuildingBlocks').requires('lively.morphic.tests.Helper','apps.ChartBuildingBlocks').toRun(function() {

lively.morphic.tests.MorphTests.subclass('apps.tests.ChartBuildingBlocks.ChartRendererTests',
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

}) // end of module