module('apps.tests.Charting').requires('lively.TestFramework', 'apps.Charting').toRun(function() {

TestCase.subclass('apps.tests.Charting.ChartDataTests',
'running', {
    setUp: function($super) {
        this.chartData = this.createChartData();
        $super();
    },
    createChartData: function() {
        return new apps.Charting.ChartData();
    }
},
'testing', {
    test01DefaultValues: function() {
        var c = this.createChartData();
        this.assert(c.implicitDimension, 'No implicit dimension is set');
    },
    test02SetDimensions: function() {
        var c = this.createChartData(),
            d = { 'x': {} };
        c.setDimensions(d);
        this.assertEqualState(d, c.getDimensions(),
            'The set dimension is not the actual dimension'
            );
        // TODO: test for error msg when no id is submitted
    },
    test03SetSeries: function() {
        var c = this.createChartData();
        c.addSeries('test', 'Test', [1,2,3,4]);
        this.assertEqualState([{title: 'Test', values: [1,2,3,4]}],
            c.getSeries(), 'Series state not as expected');
        this.assertEqualState({title: 'Test', values: [1,2,3,4]},
            c.getSeriesById('test'), 'Cannot correctly get series by ID');
    },
    test04SetValues: function() {
        var c = this.createChartData(),
            values = [{x:1, y:2},{x:1111, y:3},{x:10, y:-1},{x:6, y:2.6}],
            moreValues = [{x:1576, y:-23}, {x:198, y: 'a String should also work'}];
        c.setValuesForSeries(111, values);
        this.assertEqualState([{values: values}], c.getSeries(),
            'Series state not as expected after setValuesForSeries()');
        c.addValues(111, moreValues);
        this.assertEqualState([{values: values.concat(moreValues)}], c.getSeries(),
            'Series state not as expected after adding more values');
    }
});

}) // end of module