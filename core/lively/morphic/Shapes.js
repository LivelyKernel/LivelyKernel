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
    getExtent: function() { return this.shapeGetter('Extent') || pt(0,0)},
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
        if(fill && typeof fill.a === "number") {
            return fill.a
        } else {
            return 1;
        }
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
},
'comparing', {
    equals: function (otherShape) {
        var diffsArray = this.getDiffsTo(otherShape)
        if(diffsArray.length > 0) return false;
        return true;
    },
    getDiffsTo: function (otherShape) {
        var self = this;
        var blacklist = ["get"];
        var diffsArray = Functions.all(this).withoutAll(blacklist).select(function (ea) {
            if ( ea.startsWith("get") && otherShape[ea]) {
                try {
                    if ( self[ea]() && typeof(self[ea]()) == 'object') {
                        return !self[ea]().equals(otherShape[ea]());
                    }
                    else {
                        return (self[ea]() != otherShape[ea]())
                    }
                }
                catch (ex) {
                    return false
                }
            }
        });
        if(!this.name == otherShape.name) {diffsArray.push("constructor")};
        return diffsArray;        
    },

});

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.Rectangle');

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.Ellipse');

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.Image',
'initializing', {
    initialize: function($super, bounds) {
        $super(bounds);
        this.isLoaded = false; // will be set to true as soon as image is really loaded
    },
},
'accessing', {
    setImageURL: function(url) { return this.shapeSetter('ImageURL', String(url)) },
    getImageURL: function() { return this.shapeGetter('ImageURL') },
    getNativeExtent: function() { return this.renderContextDispatch('getNativeExtent') },

});


lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.External',
'documentation', {
    documentation: 'a shape that wraps an arbitrary HTML element',
},
'initializing', {
    initialize: function($super, element) {
        this.shapeNode = document.importNode(element, true);
    },
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
        var element;
        if (this.stringifiedShapeNode) {
            element = stringToXML(this.stringifiedShapeNode);
            element.parentNode && element.parentNode.removeChild(element);
        }
        if (!element) {
            element = XHTMLNS.create('div');
            element.style.backgroundColor = Color.red.toCSSString();
        }
        if (element.style) { 
            element.style.width = ((this.extent && this.extent.x) || 200) + 'px'
            element.style.height = ((this.extent && this.extent.y) || 200) + 'px'
        }
        this.shapeNode = element
    },
},
'accessing', {
    getExtent: function() { 
        
        // FIXME: this does not work in Firefox
        return this.renderContextDispatch('getExtent') || pt(0,0) 
    },
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
        return this.stops.collect(function(ea) { return {offset: ea.offset, color: ea.color.lighter(n)} })
    },
    getStopsDarker: function(n) {
        return this.stops.collect(function(ea) { return {offset: ea.offset, color: ea.color.darker(n)} })
    },
},
'comparing', {
    equals: function(otherGradient) {
        var i;
        if (this.vector && !this.vector.equals(otherGradient.vector)) return false;
        for (i=0;i<this.stops.length;i++) {
            if (
                !this.stops[i].color.equals(otherGradient.stops[i].color) 
                || !this.stops[i].offset == otherGradient.stops[i].offset 
            ) return false
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
        this.vector = Object.isString(vector) ?
            this.vectors[vector.toLowerCase()] : this.vectors.northsouth;
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

}) // end of module