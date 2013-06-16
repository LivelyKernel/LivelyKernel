module('apps.ChartBuildingBlocks').requires('lively.morphic.ScriptingSupport', 'lively.morphic.AdditionalMorphs', 'apps.d3Interface').toRun(function() {

lively.morphic.PartsBinItem.subclass('apps.ChartBuildingBlocks.ChartsBinItem',
'settings',{
    defaultExtent: pt(285,40),
},
'init', {
    initialize: function($super, partsBinURL, targetName, partItem){
        $super(partsBinURL, targetName, partItem);
        this.applyStyle({fill: null, borderColor: null, borderRadius: 0})
    },

    setupLogoLabel: function(){},

    setupHTMLLogo: function() {
        var url = this.partItem.getHTMLLogoURL(),
            item = this,
            morphSetup = {htmlSourceToMorph: function(source) {
                source = source.replace(/.*\<body\>/, "").replace(/\<\/body\>.*/, "");
                var node = XHTMLNS.create('div');
                try {
                    node.innerHTML = source;
                } catch(e) {
                    debugger;
                    node.innerHTML = '<span>' + item.name + '</span>';
                    throw e;
                }
                $(node).children().attr('style',''); // get rid of the scale-down
                var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(node));
                morph.ignoreEvents();

                //morph.setBounds(item.getBounds()); // set bounds to 285 x 40
                item.addMorphBack(morph);
            }};
        var webR = new WebResource(url).forceUncached();
        connect(webR, 'content', morphSetup, 'htmlSourceToMorph', {updater: function($upd, source) {            var status = this.sourceObj.status;
            if (status && status.isDone() && status.isSuccess()) $upd(source) }});
        webR.beAsync().get()
    },
});

lively.morphic.Box.subclass('apps.ChartBuildingBlocks.ChartRenderer',
'Hook dispatch', {
    getMorphsForHook: function(hookName) {
        var morphs = this.submorphs.sortBy(function(ea) { return ea.bounds().top(); }),
            hookMorphs = morphs.select(function(ea) { return typeof ea[hookName] === 'function'; })
        return hookMorphs;
    },


    dispatchHook: function(args) {
        // Dispatches a given hook function and returns its return value.
        // If hook is not found in a submorph a default implementation is
        // looked-up here. If no default implementation could be found, an
        // error is thrown.
        var hookName = args.callee.methodName;
        if (hookName) {
            var defaultHookName = hookName + 'Default',
                hookMorphs = this.getMorphsForHook(hookName),
                argArray = Array.from(args);

            if (hookMorphs.length > 0) {
                var hookMorph = hookMorphs.first();
                // If the hook was found implemented in a submorph, go for it
                return hookMorph[hookName].apply(hookMorph, argArray);

            } else if (this[defaultHookName] && typeof this[defaultHookName] === 'function') {
                // If not, than the go for the default implementation in this ChartRenderer
                return this[defaultHookName].apply(this, argArray);

            } else {
                // Throw an error if no implementation was found at all
                throw 'Cannot render chart because hook "' + hookName + ' was not implemented.';
            }
        }
    },
    dispatchHooks: function(args) {
        // Dispatches ALL given hook functions found in submorphs.
        // If hook is not found in submorphs a default implementation is
        // looked-up here. If no default implementation could be found, an
        // error is thrown.
        var hookName = args.callee.methodName;
        if (!hookName) return;
        var counter = 0,
            hookMorphs = this.getMorphsForHook(hookName),
            argArray = Array.from(args),
            defaultHookName = hookName + 'Default',
            resultArray = [];

        if (hookMorphs.length > 0) {
            // If the hook was found implemented in a submorph, go for it
                hookMorphs.each(function(hookMorph) {
                    resultArray.push(hookMorph[hookName].apply(hookMorph, argArray));
                });
        } else if (typeof this[defaultHookName] === 'function') {
            // If not, than the go for the default implementation in this ChartRenderer
            return [this[defaultHookName].apply(this, argArray)];

        } else {
            // Throw an error if no implementation was found at all
            throw 'Cannot render chart because hook "' + hookName + ' was not implemented.';
        }
        return resultArray;
    },

},
'Event Hooks', {
    onChartMouseWheel: function() {
        return this.dispatchHooks(arguments);
    },
    onChartMouseWheelDefault: function() {

    },
    //

    //
    onChartDragStart: function() {
        return this.dispatchHooks(arguments);
    },
    onChartDragStartDefault: function() {

    },
    //

    //
    onChartDrag: function() {
        return this.dispatchHooks(arguments);
    },
    onChartDragDefault: function() {

    },
    //

    //
    onChartDragEnd: function() {
        return this.dispatchHooks(arguments);
    },
    onChartDragEndDefault: function() {

    }

},

'Drawing Hooks', {
    prepareContext: function() {
        // Override to customize the DOM context of the chart.
        return this.dispatchHook(arguments);
    },
    prepareContextDefault: function(context) {
        // Returns an SVG node per default
        var ctxH = $(context).height(),
            ctxW = $(context).width(),
            svg = d3.select(context).selectAll("svg").data([1]);
        svg
            .enter()
            .append("svg:svg");
        svg
            .exit()
            .remove();
        svg
            .attr("width", ctxW)
            .attr("height", ctxH);

        return svg;
    },
    //

    //
    setupDrawingAreas: function() {
	// Override to ...
        return this.dispatchHook(arguments);
    },
    setupDrawingAreasDefault: function(data, bounds) {
        // Returns a default drawing area
        return [bounds];
    },
    //

    //
    setupScales: function() {
	// Override to ...
        var scales = this.dispatchHooks(arguments),
            aggregatedScales = {};
        scales.each(function(s) {
            for (var x in s) {
                aggregatedScales[x] = s[x];
            }
        });
        return aggregatedScales;
    },
    setupScalesDefault: function() {
        return {};
    },
    //

    //
    drawDimensions: function() {
        // Override this method to set up and draw your chart's axes
	//
	// context: a d3 node to draw your axes onto,
	// dimensions: an array of simple dimension representations
	// (i.e. [{id: 'x', title: 'X Axis', unit: 'Time'}]).
        //
        // Returns a context for the series to be drawn onto.
        return this.dispatchHook(arguments);
    },
    drawDimensionsDefault: function(context) {
        // Returns the context created in prepareContext
        return [context];
    },
    //

    //
    drawSeries: function() {
	// Override to draw the information contained by the dataset's series
	// onto a drawing context (in general the content pane
	// generated by the 'makeContentPane' method).
        return this.dispatchHooks(arguments);
    },
    drawSeriesDefault: function() {},
},

'Drawing', {
    draw: function(context, data, optPadding) {
        // Clear the visual indiciators about which
        // morphs are used and which ones are not
        // this.unmarkAllMorphs();
        var dimensions = data.getDimensions(),
            series = data.getSeries(),
            drawingBounds = this.prepareDrawingBounds(
                $(context).width(), $(context).height(), optPadding),
            // Creates an SVG context for the chart
            contextPane = this.prepareContext(context),
            // Setup the drawing areas
            areas = this.setupDrawingAreas(data, drawingBounds),
            // Create scales for the data's dimensions
            scales = this.setupScales(data, areas),
            // Template hook for drawing axes
            drawingPanes = this.drawDimensions(contextPane, data, scales, areas);

        // Template hook for drawing the series
        this.drawSeries(drawingPanes, data, scales, areas);
    },
},

'Helpers', {
    normalizePadding: function(padding) {
        if (padding >= 0) {
            return [padding,padding,padding,padding];
        } else if (Array.isArray(padding)) {
            return (padding.length === 4) ?
                padding : 
                [padding.first(), padding.first(),
                padding.first(), padding.first()];
        } else {
            return [0,0,0,0];
        }
    },
    prepareDrawingBounds: function(chartWidth, chartHeight, padding) {
        var p = this.normalizePadding(padding);
        return new Rectangle(p[3], p[0], chartWidth-p[3]-p[1], chartHeight-p[0]-p[2]);
    },

});



lively.morphic.HtmlWrapperMorph.subclass('apps.ChartBuildingBlocks.ChartDisplay',

'init', {
    initialize: function($super, bounds) {
        $super(bounds);
        this.redrawOnResize = true;
    }
},
'drawing', {
    draw: function(chartData, chartRenderer) {
        var context = this.renderContext().shapeNode;
        if (chartRenderer && chartRenderer.draw && chartData && chartData.getSeries) {
            chartRenderer.draw(context, chartData);
        } else {
            console.warn('Cannot draw, Chart Renderer or Chart Data are not valid.');
        }
        return this;
    },
    clear: function() {
        // Remove the content of the shape node
        $(this.renderContext().shapeNode).empty();
        return this;
    },
    redraw: function(chartData, chartRenderer) {
        // Does a fresh draw (clear + draw).
        return this.clear().draw(chartData, chartRenderer);
    }

});


}) // end of module