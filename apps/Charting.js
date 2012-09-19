module('apps.Charting').requires('apps.d3', 'lively.morphic.AdditionalMorphs').toRun(function() {

Object.subclass('apps.Charting.ChartData',
'init',
{
    initialize: function() {
        this.setImplicitDimension(this.implicitDimensionDefault);
        this.series = {};
        this.dimensions = {};
    }
},
'dimensions', {
    /*
    A dimension is defined as follows:

    {
        id: unique identifier used to relate data to dimensions (no default),
        description: a string to describe the dimension(default: null),
        title: the title of the dimension (default: null),
        unit: the unit of the dimension (default: null),
        implicitTick: a function that returns the value of a tick on
            the implicit axis (default: function(t) {return t;}),
    }

    The implicit dimension results from the order in the data array.
    A line graph, for instance, can interpret the values in the data array
    as y-coordinates whereas their order in the array determines their
    x-coordinates. The implicitTick(t) function then calculates the
    x-coordinate value for a certain position in the array.
    If the data set already has two (or more) explicit dimensions,
    the implicit dimension is ignored.
    */
    implicitDimensionDefault: {
        title: 'x',
        implicitTick: function(t) {return t;}
    },
	addDimension: function(id, title, unit, optDescription){
        this.dimensions[id] = {
				id: id, // hope this stays consistent with the key ;)
                title: title,
				description: optDescription,
                unit: unit,
            }
        return this;
    },
    setDimensions: function(dimensions) {
        // Sets the dimensions of the data
        this.dimensions = dimensions;
        return this;
    },
	getDimension: function(id) {
		return this.dimensions[id];
	},

    getDimensions: function() {
       var result = [];
        for (var x in this.dimensions) {
            var dimensions = this.dimensions[x];
            result.push(dimensions);
        }
        return result;
    },
    setImplicitDimension: function(dimension) {
        this.implicitDimension = dimension;
        return this;
    }

},
'series',{
    /*
    A series represents a data set to be displayed in context
    (i.e. stock value over time).

    A series is defined as follows:

    {
        title: title of the series,
        values: array of numbers or key-value-pair objects
            (i.e. [1, 45, 3, 10, -0.5] or
            [{x: 1, y: -3.7}, {x: 20, y: 13}]),
    }
    */
    addSeries: function(id, title, values, optClassName){
        this.series[id] = {
				id: id, // hope this stays consistent with the key ;)
                title: title,
                values: values,
                className: optClassName
            }
        return this;
    },
    setSeries: function(series) {
        // i.e. {'a': {title: 'Series A', values: [1,2,3,4]}}
        this.series = series;
        return this;
    },
    getSeries: function() {
        var result = [];
        for (var x in this.series) {
            var series = this.series[x];
            result.push(series);
        }
        return result;
    },
	getASeries: function(id) {
        return this.series[id];
    },
    getSeriesById: function(seriesId) {
        return this.series[seriesId];
    },
    setValuesForSeries: function(seriesId, values) {
        // Adds one or multiple data entries to a series.
        if (!this.series[seriesId]) {
            console.warn('There were no series "'+seriesId
                +'" to add the values, so a series with this ID was created.');
            this.series[seriesId] = {};
        }
        this.series[seriesId].values = [].concat(values);
        return this;
    },
    addValues: function(seriesId, values) {
        // Adds one or multiple data entries to a series.
        if (!this.series[seriesId]) {
            console.warn('There were no series "'+seriesId
                +'" to add the values, so a series with this ID was created.');
            this.series[seriesId] = {};
        }
        if (this.series[seriesId].values
            && Array.isArray(this.series[seriesId].values)) {

            this.series[seriesId].values =
                this.series[seriesId].values.concat(values);
        } else {
            this.series[seriesId].values = [].concat(values);
        }
        return this;
    }

});

Object.subclass('apps.Charting.ChartRenderer',
'rendering', {
    render: function(data, context, optDisableStyling) {
        // Interface for the ChartRenderer strategy
        //
        // data: a Charting.ChartData instance,
        // context: the render base of the chart
        // (i.e. an HTML node),
        // optDisableStyling: set true if you want to use style sheets
    },
});

lively.morphic.HtmlWrapperMorph.subclass('apps.Charting.ChartMorph',
'init', {
    initialize: function($super, bounds, chartRenderer, optChartData) {
        $super(bounds);
        this.chartRenderer = chartRenderer;
        this.chartData = optChartData || new apps.Charting.ChartData();
        this.redrawOnResize = true;
    }
},
'chart renderer', {
    setChartRenderer: function(chartRenderer) {
        this.chartRenderer = chartRenderer;
    },
    getChartRenderer: function() {
        return this.chartRenderer;
    }
},
'chart data', {
    setChartData: function(chartData) {
        this.chartData = chartData;
    },
    getChartData: function() {
        return this.chartData;
    },
    setValuesForSeries: function(seriesId, values) {
        this.chartData.setValuesForSeries(seriesId, values);
    },
    addValues: function(seriesId, values) {
        this.chartData.addValues(seriesId, values);
    },
},
'drawing', {
    draw: function() {
        var chartContext = this.renderContext().shapeNode;
        this.chartRenderer.render(this.getChartData(), chartContext);
    },
    setExtent: function($super, extent) {
        $super(extent);
        if (this.redrawOnResize) {
            this.draw();
        }
    }
});

lively.morphic.HtmlWrapperMorph.subclass('apps.Charting.D3ChartMorph',

// ChartMorph with explicit D3 hooks

'init', {
    initialize: function($super, bounds, optChartData) {
        $super(bounds);
        this.chartData = optChartData || new apps.Charting.ChartData();
        this.redrawOnResize = true;
    }
},
'chart data', {
    setChartData: function(chartData) {
        this.chartData = chartData;
    },
    getChartData: function() {
        return this.chartData;
    },
    setValuesForSeries: function(seriesId, values) {
        this.chartData.setValuesForSeries(seriesId, values);
    },
    addValues: function(seriesId, values) {
        this.chartData.addValues(seriesId, values);
    },
},

'template methods', {
	makeContentPane: function(context) {
		// Override to create a custom surface to be used as a
		// drawing context for the chart content.
		// Per default an svg group element with a clippath is returned.

		var clipId = 'clip-' + Math.floor(Math.random()*0x10000).toString(16);

		// clip path
        context.append("svg:clipPath")
            .attr("id", clipId)
			.attr('class', 'chart-content')
            .append("svg:rect");

		return context.append("svg:g")
            .attr("clip-path", "url(#"+clipId+")");
	},
	drawDimensions: function(context, dimensions) {
		// Override this method to set up and draw your chart's axes
		//
		// context: a d3 node to draw your axes onto,
		// dimensions: an array of simple dimension representations
		// (i.e. [{id: 'x', title: 'X Axis', unit: 'Time'}])

	},
	drawSeries: function(context, series) {
		// Override to draw the information contained by the dataset's series
		// onto a drawing context (in general the content pane
		// generated by the 'makeContentPane' method).
	}
},
'drawing', {
    draw: function() {
        var context = this.renderContext().shapeNode,
			data = this.getChartData(),
			dimensions = data.getDimensions(),
			series = data.getSeries(),
			ctxH = $(context).height(),
            ctxW = $(context).width(),
			contentPane;

		$(context).empty();

		this.drawingPane = d3.select(context).append("svg:svg")
            .attr("width", ctxW)
            .attr("height", ctxH)
            .append("svg:g");

		contentPane = this.makeContentPane(this.drawingPane);

		this.drawDimensions(this.drawingPane, dimensions);

		this.drawSeries(contentPane, series);
    }
});

apps.Charting.ChartRenderer.subclass('apps.Charting.D3ChartRenderer',
'rendering', {
    setRenderOption: function(option, value) {
        this.renderOptions = this.renderOptions || {};
        this.renderOptions[option] = value;
        return this;
    },
    setRenderOptions: function(options) {
        /*
        Options is an object that can have the following
        parameters (with following defaults):
        {
            interpolation: 'linear'
        }
        */
        this.renderOptions = options;
        return this;
    },
    setAxisOptions: function(options) {
        /*
        Options is an object that can have the following
        parameters (with following defaults):
        {
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            yOrient: 'right',
            xOrient: 'bottom',
            xTickSize: 5,
            yTickSize: 5,
            xTickSubdivide: false,
            yTickSubdivide: false
        }
        */
        this.axisOptions = options;
        return this;
    },
    createAxes: function(data, context, options) {
        options = options || this.axisOptions || {};

        var dimensions = data.getDimensions(),
            ctxH = $(context).height(),
            ctxW = $(context).width(),
            paddingTop = options.paddingTop || 0,
            paddingRight = options.paddingRight || 0,
            paddingBottom = options.paddingBottom || 0,
            paddingLeft = options.paddingLeft || 0,
            yOrient = options.yOrient || 'right',
            xOrient = options.xOrient || 'bottom',
            yTickSize = options.yTickSize || 5,
            xTickSize = options.xTickSize || 5,
            xMin = this.xMin || 0,
            xMax = this.xMax || 10,
            yMin = this.yMin || 0,
            yMax = this.yMax || 10,
            yTickSubdivide = options.yTickSubdivide,
            xTickSubdivide = options.xTickSubdivide,
            w = ctxW - paddingLeft - paddingRight,
            h = ctxH - paddingTop - paddingBottom,
            d3 = apps.d3.d3,

            // generate an id for the clip path so multiple charts do
            // not cross reference their clip paths
            clipId = 'clip-' + Math.floor(Math.random()*0x10000).toString(16);

        this.xScale = d3.scale.linear().range([0, w]).domain([xMin, xMax]);
        this.yScale = d3.scale.linear().range([h, 0]).domain([yMin, yMax]);
        this.xAxis = d3.svg.axis()
            .scale(this.xScale)
            .tickSize(xTickSize)
            .tickSubdivide(xTickSubdivide)
            .orient(xOrient);
        //this.yAxis = d3.svg.axis().scale(this.yScale).ticks(4).orient("right");
        this.yAxis = d3.svg.axis()
            .scale(this.yScale)
            .tickSize(yTickSize)
            .tickSubdivide(yTickSubdivide)
            .orient(yOrient);

		this.drawingPane = d3.select(context).append("svg:svg")
            .attr("width", ctxW)
            .attr("height", ctxH)
            .append("svg:g")
            .attr("transform", "translate(" + paddingLeft + "," + paddingTop + ")");

        // Add the clip path.
        this.drawingPane.append("svg:clipPath")
            .attr("id", clipId)
            .append("svg:rect")
            .attr("width", w)
            .attr("height", h);

          // Add the x-axis.
        this.drawingPane.append("svg:g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + h + ")")
            .call(this.xAxis);

        // Add the y-axis.
        this.drawingPane.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + w + ",0)")
            .call(this.yAxis);

        return this.drawingPane.append("svg:g")
            .attr("clip-path", "url(#"+clipId+")");
    },

    setXAxisRange: function(min, max, optDuration) {
        var duration = (optDuration >=0) ? optDuration : 750,
            t = this.drawingPane.transition().duration(duration);
        this.xScale.domain([min, max]);
        this.xMin = min;
        this.xMax = max;
        t.select(".x.axis").call(this.xAxis);
        this.redraw(t);
    }
});
apps.Charting.ChartRenderer.subclass('apps.Charting.D3BarChartRenderer',
'rendering', {
    render: function(data, context) {
        var chart = d3.select(context),
            series = data.getSeries().first(),
            dimensions = data.getDimensions(),
            chartHeight = $(context).height(),
            chartWidth = $(context).width();

        if (!series || !series.values || !Array.isArray(series.values)) {
            console.warn('No chart data to draw!');
            return;
        }
        this.data = series.values;

        this.xUnit = (dimensions['x'] && dimensions['x'].unit) || 'x';
        this.yUnit = (dimensions['y'] && dimensions['y'].unit) || 'y';

        if (!this.data || this.data.length === 0) {
            chart.selectAll(".chartElement").remove(); return; }

        // define the properties used in the viz
        var barsBounds = {
            left: 12, top: chartHeight - 25,
            right: chartWidth - 40, bottom: 25};

        // x scale is based on indexes of data, has a 0.1 padding
        var xValues = this.data.pluck('x'),
            xScale = d3.scale.ordinal()
                         .domain(xValues)
                         .range([barsBounds.left, barsBounds.right])
                         .rangeBands([barsBounds.left, barsBounds.right], 0.1);

        // y scale is just linear
        var yValues = this.data.pluck('y'),
            yScale = d3.scale.linear()
                        .domain([d3.min(yValues), d3.max(yValues)])
                        .range([barsBounds.bottom + 'px', barsBounds.top + 'px']);

        // update / add / remove bars and rules
        this.drawChart(chart, xScale, yScale);
        this.drawHorizontalRules(chart, xScale, yScale);
        this.drawVerticalRules(chart, xScale, yScale);
    },
    drawChart: function(chart, xScale, yScale) {
        chart.selectAll(".chartElement").remove()

        var chartElements = chart.selectAll(".chartElement")
                            .data(this.data)

        chartElements.enter()
            .append("div")
            .attr('class', 'chartElement')
            //.style('background-color', Color.darkGray.toCSSString())

        chartElements
            .style("height", yScale.wrap(function($p, d, i) { return $p(d.y) }))
            .style("left", xScale.wrap(function($p, d, i) { return $p(d.x) + 'px' }))
            .style('width', xScale.rangeBand.wrap(function($p, d, i) { return $p(d.x) + 'px' }))
            .style("bottom",  yScale.range()[0])
            .style('text-align', 'center')
            .style('position', 'absolute')
            // .text(function(d) { return d; });

        chartElements.exit()
           .remove();
    },

    drawHorizontalRules: function(chart, xScale, yScale) {
        chart.selectAll(".horizontal-rule").remove();

        var yUnit = this.yUnit;

        var hrules = chart.selectAll(".horizontal-rule").data(yScale.ticks(3));

        hrules.enter()
            .append("div")
            .attr("class", "horizontal-rule")
            .append('div') // label at the right
            .style('float', 'right')
            .style('position', 'relative')
            .style('margin-top', '-1em')
            .style('font', '0.6em Tahoma')
            .style('left', 35 + 'px')
            .text(function(d) { return d + ' ' + yUnit});

        hrules
            .style('border-top', '1px dashed silver')
            .style('vertical-align', 'top')
            .style("bottom", yScale)
            .style("left", xScale.rangeExtent()[0] + 'px')
            .style("height", '1px')
            .style('width', xScale.rangeExtent()[1] - xScale.rangeExtent()[0] + 'px')
            .style('position', 'absolute')

        hrules.exit()
            .remove()
    },

    drawVerticalRules: function(chart, xScale, yScale) {
        chart.selectAll(".vertical-rule").remove();

        var xUnit = this.xUnit,
            tickScale = d3.scale.linear()
                            .domain([d3.min(xScale.domain()), d3.max(xScale.domain())])
                            .range([xScale.rangeExtent()[0] + 5 + 'px', xScale.rangeExtent()[1] - 5 + 'px']);

        var hrules = chart.selectAll(".vertical-rule").data(tickScale.ticks(5));

        hrules.enter()
            .append("div")
            .attr("class", "vertical-rule")
            .append('div') // label at the right
            .style('position', 'relative')
            .style('top', '2px')
            .style('text-align', 'center')
            .style('width', '20px')
            .style('left', '-10px')
            .style('font', '0.4em Tahoma')
            .text(function(d) { return d + ' ' + xUnit });

        hrules
            .style('position', 'absolute')
            .style("top", yScale.range()[1])
            .style('left', tickScale)
            .style('margin-left', '-5px')

        hrules.exit()
            .remove()
    }
});

apps.Charting.D3ChartRenderer.subclass('apps.Charting.D3LineChartRenderer',
'rendering', {
    render: function(data, context) {
        $(context).empty();
        var options = this.renderOptions || {},
            pane = this.createAxes(data, context, this.axisOptions ||
                {paddingRight: 60, paddingBottom: 60, paddingTop: 20, paddingLeft: 20}),
           x = this.xScale,
        y = this.yScale,
            series = data.getSeries();
        this.lineFunction = d3.svg.line()
                .interpolate(options.interpolation || 'linear')
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d.y); });

        series.each(function(s) {
            pane.append("svg:path")
                .datum(s.values)
                .attr("class", 'line'+ (s.className ? ' '+ s.className : ''))
                .attr("d", this.lineFunction);
            }, this);
    },
    redraw: function(context) {
         context.selectAll(".line").attr("d", this.lineFunction);
    },
});

apps.Charting.D3ChartRenderer.subclass('apps.Charting.D3MapChartRenderer',
'rendering', {
    render: function(data, context) {
        $(context).empty();



        // var options = this.renderOptions || {},
        //     pane = this.createAxes(data, context, this.axisOptions ||
        //         {paddingRight: 60, paddingBottom: 60, paddingTop: 20, paddingLeft: 20}),
        //     x = this.xScale,
        //     y = this.yScale,
        //     d3 = apps.d3.d3,
        //     line = d3.svg.line()
        //         .interpolate(options.interpolation || 'linear')
        //         .x(function(d) { return x(d.x); })
        //         .y(function(d) { return y(d.y); }),
        //     series = data.getSeries();
        // series.each(function(s) {
        //     pane.append("svg:path")
        //         .datum(s.values)
        //         .attr("class", 'line'+ (s.className ? ' '+ s.className : ''))
        //         .attr("d", line)
        //         .attr("fill", 'red');
        //        //debugger
        //     //console.log(line(s.values));
        //     }, this);
    }
});

}); // end of module
