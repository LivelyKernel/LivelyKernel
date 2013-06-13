module('apps.d3Interface').requires('lively.morphic.Widgets').requiresLib({url: Config.codeBase + 'lib/d3/d3.v3.js', loadTest: function() { return typeof d3 !== 'undefined'; }}).toRun(function() {

Trait('apps.d3Interface.d3WrapperTrait', {
    drawChart: function(chart, xScale, yScale) {
        chart.selectAll(".chartElement").remove()

        var chartElements = chart.selectAll(".chartElement")
                            .data(this.data)

        chartElements.enter()
            .append("div")
            .attr('class', 'chartElement')
            .style('background-color', Color.darkGray.toCSSString())

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
    },

    ond3Load: function(d3) {
        // this.startStepping(1000, 'update');
    },

    onLoad: function() {
        if (Global.d3) { return };
        lively.bindings.callWhenNotNull(Global, 'd3', this, 'ond3Load');
        JSLoader.loadJs('http://d3js.org/d3.v2.js');
    },

    reset: function() {
        // this.submorphs.invoke('remove');
        this.data = [{x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y:3}];
        this.startStepping(1000, 'update');
        this.xUnit = 'words';
        this.yUnit = 'ms';
        // this.stopStepping()
        this.doNotSerialize = ['updateRequested'];
        connect(this, 'extent', this, 'updateDelayed');
    },

    update: function() {
        // this.update();
        if (!Global.d3) { this.stopStepping(); return };

        // chart is the shapeNode
        var chart = d3.select(this.renderContext().shapeNode);

        if (!this.data || this.data.length === 0) {
            chart.selectAll(".chartElement").remove(); return; }

        // define the properties used in the viz
        var barsBounds = {
            left: 12, top: this.getExtent().y - 25,
            right: this.getExtent().x - 40, bottom: 25};

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

    updateDelayed: function(secs) {
        if (this.updateRequested) return;
        this.updateRequested = true;
        var self = this;
        (function() {
            delete self.updateRequested;
            self.update();
        }).delay(0.2);
    }
});

}) // end of module
