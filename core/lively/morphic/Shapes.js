module('lively.morphic.Shapes').requires('lively.morphic.Graphics').toRun(function() {
Object.subclass('lively.morphic.Shapes.Shape',
'initializing', {
    initialize: function(bounds) {
        if (bounds) this.setBounds(bounds);
    },
},
'accessing', {
    setPosition: function(position) { return this.shapeSetter('Position', position) },
    getPosition: function() { return this.shapeGetter('Position') || pt(0,0) },
    setExtent: function(extent, scrollBarExtent) { return this.shapeSetter('Extent', extent) },
    getExtent: function() { return this.shapeGetter('Extent') || pt(0,0); },
	setClipMode: function (modeString) { return this.shapeSetter('ClipMode', modeString) },
    getClipMode: function () { return this.shapeGetter('ClipMode') || 'visible' },
    setBounds: function(bounds) {
        this.setPosition(bounds.topLeft());
        this.setExtent(bounds.extent());
        return bounds
    },
    getBounds: function() { return this.getPosition().extent(this.getExtent()) },
    bounds: function() { return this.getBounds() },
    setFill: function(fill) { return this.shapeSetter('Fill', fill) },
    getFill: function() { return this.shapeGetter('Fill') || null },
    setFillOpacity: function(opacity) {
        var fill = this.getFill()
        if (fill && fill.withA)
            this.setFill(fill.withA(opacity))
    },
    getFillOpacity: function() {
        var fill = this.getFill();
        return (fill && typeof fill.a === "number") ? fill.a : 1;
    },
    setBorderWidth: function(width) { return this.shapeSetter('BorderWidth', width) },
    getBorderWidth: function() {
        return this.shapeGetter('BorderWidth')  || 0;
    },
    setBorderColor: function(fill) { return this.shapeSetter('BorderColor', fill) },
    getBorderColor: function() {
        var fill = this.shapeGetter('BorderColor');
        return fill === undefined ? Color.red : fill;
    },
    setStrokeOpacity: function(opacity) { return this.shapeSetter('StrokeOpacity', opacity) },
    getStrokeOpacity: function() {
        var op = this.shapeGetter('StrokeOpacity');
        return op === undefined ? 1 : op;
    },
    setBorderRadius: function(value) { this.shapeSetter('BorderRadius', value) },
    getBorderRadius: function() { return this.shapeGetter('BorderRadius')  || 0 },
    setBorderStyle: function(value) {
        // style can be hidden dotted dashed solid double groove ridge	inset outset inherit
        return this.shapeSetter('BorderStyle', value);
    },
    getBorderStyle: function() { return this.shapeGetter('BorderStyle') || 'solid' },
    setOpacity: function(opacity) { return this.shapeSetter('Opacity', opacity) },
    getOpacity: function() {
        var op = this.shapeGetter('Opacity');
        return op === undefined ? 1 : Number(op);
    },
    vertices: function() {
        var b = this.bounds();
        return [pt(b.x, b.y), pt(b.width, b.height)]
    },
    setVertices: function() {
        // This does nothing for non path shapes
    },

    setPadding: function(rect) { return this.shapeSetter('Padding', rect) },
    getPadding: function() {
        return this.shapeGetter('Padding') || this.setPadding(new Rectangle(0,0,0,0));
    },

    setNodeClass: function(value) {
        return this.shapeSetter('NodeClass', value);
    },

    getNodeClass: function() {
        return this.shapeGetter('NodeClass') || [];
    },

    setNodeId: function(value) {
        return this.shapeSetter('NodeId', value);
    },

    getNodeId: function() {
        return this.shapeGetter('NodeId')
    }

});

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.Rectangle');
lively.morphic.Shapes.Rectangle.subclass('lively.morphic.Shapes.ReactShape');
lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.Ellipse');

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.Image',
'initializing', {
    initialize: function($super, bounds, url) {
        $super(bounds);
        this.isLoaded = false; // will be set to true as soon as image is really loaded
        if (url) this.setImageURL(url);
    },
},
'accessing', {
    setImageURL: function(url) { return this.shapeSetter('ImageURL', String(url)) },
    getImageURL: function() { return this.shapeGetter('ImageURL') },
    getNativeExtent: function() { return this.renderContextDispatch('getNativeExtent') },

});


lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.External',
'documentation', {
    documentation: 'a shape that wraps an arbitrary HTML element'
},
'initializing', {
    initialize: function($super, element) {
        this.shapeNode = document.importNode(element, true);
    },
    initFromStringifiedShapeNode: function() {
        return this.renderContextDispatch('initFromStringifiedShapeNode');
    }
},
'serialization', {
    doNotSerialize: ['shapeNode'],
    onstore: function() {
        if (this.shapeNode) {
            this.stringifiedShapeNode = Exporter.stringify(this.shapeNode);
            this.extent = this.getExtent();
        }
    },
    onrestore: function() {
        // FIXME this directly depends on HTML
        this.initFromStringifiedShapeNodeHTML(null);
    }
},
'accessing', {
    getExtent: function() {
        var baseVal = this.renderContextDispatch('getExtent') || pt(0,0), // FIXME: this does not work in Firefox
            ctx = this.renderContext();
        if (!ctx) return baseVal;
        var borderW = this.getBorderWidth(),
            hasScrollBarH = ctx.domInterface.showsVerticalScrollBarHTML(ctx.shapeNode, borderW),
            hasScrollBarV = ctx.domInterface.showsHorizontalScrollBarHTML(ctx.shapeNode, borderW);
        if (hasScrollBarV || hasScrollBarH) {
            var scrollbarExt = $world.getScrollBarExtent();
            baseVal = baseVal.addXY(hasScrollBarH ? scrollbarExt.x : 0, hasScrollBarV ? scrollbarExt.y : 0);
        }
        return baseVal.addXY(borderW*2, borderW*2);
    }
});

Object.subclass('lively.morphic.Gradient',
'properties', {
    isGradient: true,
},
'initializing', {
    initialize: function(stops) {
        this.setStops(stops);
    },
},
'accessing', {
    setStops: function(stops) {
        this.stops = stops || [];
    },
    getStopsLighter: function(n) {
        return this.stops.collect(function(ea) {
            return {offset: ea.offset, color: ea.color.lighter(n)};
        });
    },
    getStopsDarker: function(n) {
        return this.stops.collect(function(ea) {
            return {offset: ea.offset, color: ea.color.darker(n)};
        });
    },
},
'comparing', {
    equals: function(otherGradient) {
        if (this.vector && !this.vector.equals(otherGradient.vector)) return false;
        for (var i = 0; i < this.stops.length; i++) {
            if (!this.stops[i].color.equals(otherGradient.stops[i].color)
                || !this.stops[i].offset == otherGradient.stops[i].offset) return false;
        }
        return true;
    },

});


lively.morphic.Gradient.subclass('lively.morphic.LinearGradient',
'properties', {
    vectors: {
        northsouth: rect(pt(0, 0), pt(0, 1)),
        southnorth: rect(pt(0, 1), pt(0, 0)),
        eastwest:    rect(pt(0, 0), pt(1, 0)),
        westeast:    rect(pt(1, 0), pt(0, 0)),
        southwest:    rect(pt(1, 0), pt(0, 1)),  // Down and to the left
        southeast:    rect(pt(0, 0), pt(1, 1)),
        northeast:    rect(pt(0, 1), pt(1, 0)),
        northwest:    rect(pt(1, 1), pt(0, 0))
    },
},
'initializing', {
    initialize: function($super, stops, vector) {
        $super(stops);
        this.setVector(vector);
    },
},
'accessing', {
    setVector: function(vector) {
        if (!vector) this.vector = this.vectors.northsouth;
        else if (Object.isString(vector)) this.vector = this.vectors[vector.toLowerCase()]
        else this.vector = vector;
    },
},
'convenience', {
    lighter: function(n) { return new this.constructor(this.getStopsLighter(n), this.vector) },
    darker: function() { return new this.constructor(this.getStopsDarker(), this.vector) },
});


lively.morphic.Gradient.subclass('lively.morphic.RadialGradient',
'initializing', {
    initialize: function($super, stops, focus) {
        $super(stops);
        this.focus = focus || pt(0.5,0.5);
    },
},
'convenience', {
    lighter: function(n) { return new this.constructor(this.getStopsLighter(n), this.focus) },
    darker: function() { return new this.constructor(this.getStopsDarker(), this.focus) },
});
Object.extend(lively.morphic.Gradient, {
    create: function(spec) {
        if (!spec) return null;
        if (spec.type === 'linear') {
            return new lively.morphic.LinearGradient(spec.stops, spec.vector);
        } else if (spec.type === 'radial') {
            return new lively.morphic.RadialGradient(spec.stops, spec.focus);
        }
        return null;
    },
});

}) // end of module
