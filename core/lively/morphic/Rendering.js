module('lively.morphic.Rendering').requires('lively.morphic.Core', 'lively.morphic.TextCore', 'lively.morphic.Shapes').toRun(function() {

Trait('lively.morphic.Renderable',
'accessing', {
    renderAttributeSetter: function(propName, value) {
        this['_' + propName] = value;
        return this.renderContextDispatch('set' + propName, value);
    },
    renderAttributeGetter: function(propName) { return this['_' + propName] },
    renderContext: function() {
        if (!this._renderContext) this.setRenderContext(this.defaultRenderContext());
        return this._renderContext;
    },
    setRenderContext: function(newRenderContext) {
        this.renderContextTable = newRenderContext ?
            Object.mergePropertyInHierarchy(this, newRenderContext.renderContextTableName) : {};
        this._renderContext = newRenderContext
    },
    defaultRenderContext: function() {
        throw new Error('method defaultRenderContext should be overwritten');
    },
},
'renderContext dispatch', {
    renderContextDispatch: function(aspect, arg) {
        if (!this._renderContext) this.renderContext();
        // if we cannot lazy initialize the renderContext we just do nothing
        if (!this._renderContext) return;
        var renderSpecificAspect = this.renderContextTable[aspect];
        if (!renderSpecificAspect) {
            var msg = 'renderContextTable does no include: ' + aspect + ' in ' + this;
            debugger
            console.warn(msg)
            alert(msg);
            return
        }
        return this[renderSpecificAspect](this._renderContext, arg);
    },
})
.applyTo(lively.morphic.Morph, {
    override: ['setRenderContext', 'renderContext', 'renderContextDispatch'],
    alias: {renderAttributeSetter: 'morphicSetter', renderAttributeGetter: 'morphicGetter'},
})
.applyTo(lively.morphic.Shapes.Shape, {
    override: ['setRenderContext', 'renderContext', 'renderContextDispatch'],
    alias: {renderAttributeSetter: 'shapeSetter', renderAttributeGetter: 'shapeGetter'},
});

Object.subclass('lively.morphic.Rendering.DOMInterface',
'settings', {
    canvasId: 'lively.morphic.Dom.Canvas',
    html5CssPrefix: (function() {
        if (UserAgent.fireFoxVersion) return '-moz-';
        if (UserAgent.isIE) return '-ms-';
        if (UserAgent.isOpera) return '-o-';
        if (UserAgent.webKitVersion) return '-webkit-';
        return '';
    })(),
    html5TransformProperty: (function() {
        if (UserAgent.fireFoxVersion) return '-moz-transform';
        if (UserAgent.isIE) return '-ms-transform';
        if (UserAgent.isOpera) return 'OTransform';
        if (UserAgent.webKitVersion) return '-webkit-transform';
        return 'transform';
    })(),
    html5TransformOriginProperty: (function() {
        if (UserAgent.fireFoxVersion) return '-moz-transform-origin';
        if (UserAgent.isIE) return '-ms-transform-origin';
        if (UserAgent.isOpera) return 'OTransformOrigin';
        if (UserAgent.webKitVersion) return '-webkit-transform-origin';
        return 'transform-origin';
    })(),


},
'node creation', {
    canvasRawNode: function() {
        var node = this.htmlRect();
        node.setAttribute('id', this.canvasId);
        this.setPosition(node, pt(0,0));
        this.setExtent(node, pt(100, 100));
        this.setFill(node, Color.red);
        return node;
    },
    svgNode: function() {
        return NodeFactory.create('svg', {style: 'position: absolute; top: 0px; left: 0px;'});
    },
    svgRect: function() { return NodeFactory.create('rect') },
    svgEllipse: function() { return NodeFactory.create('ellipse')  },
    svgGroup: function() { return NodeFactory.create('g') },
    htmlRect: function() { return XHTMLNS.create('div') },
    htmlCanvas: function() {
        var canvas = XHTMLNS.create('canvas');
        canvas.style.left = '0px'
        canvas.style.top = '0px'
        canvas.style.position = 'absolute'
        return canvas
    },
    htmlImg: function() {
        var node = XHTMLNS.create('img');
        //node.style.left = '0px'
        //node.style.top = '0px'
        node.style.position = 'absolute'
        return node
    },

},
'testing', {
    isCanvasElement: function(element) {
        var id = element.getAttribute && element.getAttribute('id');
        return id === this.canvasId;
    },
    isSVG: function(node) {    return node && node.namespaceURI === Namespace.SVG },
    isHTML: function(node) { return node && node.namespaceURI === Namespace.XHTML },
    isInDOM: function(node) {
        do {
            if (node == Global.document) return true;
        } while (node = node.parentNode);
        return false
    },

},
'appending and removing', {
    append: function(parentNode, childNode) {
        if (this.isHTML(parentNode) && this.isSVG(childNode)) {
            var svgNode = NodeFactory.create('svg', {
                style: 'position: absolute; top: 0px; left: 0px;'});
            parentNode.appendChild(svgNode);
            return svgNode.appendChild(childNode);
        }
        return parentNode.appendChild(childNode);
    },
    remove: function(node) {
        if (!node.parentNode) return;
        node.parentNode.removeChild(node);
    },
},
'accessing -- DOM', {
    getPosition: function(node) {
        var x,y;
        if (this.isHTML(node)) {
            x = lively.data.Length.parse(node.style.left)
            y = lively.data.Length.parse(node.style.top);
        }
        if (this.isSVG(node)) {
            x = node.getAttributeNS(null, 'x')
            y = node.getAttributeNS(null, 'y')
        }
        return pt(x,y);
    },
    getExtent: function(node) {
        var width, height;
        if (this.isHTML(node)) {
            width = lively.data.Length.parse(node.style.width)
            height = lively.data.Length.parse(node.style.height);
        }
        if (this.isSVG(node)) {
            width = node.getAttributeNS(null, 'width')
            height = node.getAttributeNS(null, 'height')
        }
        return pt(width,height);
    },
},
'manipulating', {
    setAttr: function(node, name, value) {
        return node.setAttributeNS(null, name, String(value));
    },
    setFill: function(node, fill, shapeBounds) {
        if (fill === undefined) return;
        if (this.isHTML(node)) {
            if (fill == null) fill = Color.rgba(0,0,0,0);
            if (fill.isGradient) { this.setHTMLGradient(node, fill, shapeBounds); return };
            if (fill instanceof Color) {
                node.style.background = fill.toRGBAString()
                return;
            }
            alert('cannot deal with fill ' + fill);
            return;
        } else if (this.isSVG(node)) {
            this.setSVGFillOrStrokePaint(node, 'fill', fill);
        }

    },
    setSVGFillOrStrokePaint: function(node, propName, paint) {
        var cachedProperty = '_' + propName; // like _fill
        if (this[cachedProperty] && this[cachedProperty] !== paint && this[cachedProperty].isGradient)
            // FIXME
            // this[cachedProperty].dereference();
        this[cachedProperty] = paint;
        if (paint === undefined) {
            node.removeAttributeNS(null, propName);
        } else if (paint === null) {
            node.setAttributeNS(null, propName, "none");
        } else if (paint instanceof Color) {
            node.setAttributeNS(null, propName, String(paint));
        } else if (paint.isGradient) {
            // FIXME
            this.setSVGFillOrStrokePaint(node, propName, paint.stops[0].color)
            // paint.reference();
            // node.setAttributeNS(null, propName, paint.uri());
        } else {
            throw dbgOn(new TypeError('cannot deal with paint ' + paint));
        }
    },
    setHTMLGradient: function(node, gradient, shapeBounds) {
        node.style.background = gradient.toCSSString(shapeBounds, this.html5CssPrefix);
    },


    setPosition: function(node, pos) {
        if (this.isHTML(node)) {
            node.style['position'] = 'absolute';
            node.style['left'] = pos.x + 'px';
            node.style['top'] = pos.y + 'px';
        } else if (this.isSVG(node)) {
            var transform = new lively.morphic.Similitude(pos, 0, pt(1,1));
            transform.applyTo(node)
            // node.setAttributeNS(null, 'x', String(pos.x));
            // node.setAttributeNS(null, 'y', String(pos.y))
        }
    },
    setSVGViewbox: function(node, bounds) {
        var boundsString = "" + bounds.left() + " " + bounds.top() + " " + bounds.width + " " + bounds.height
        node.setAttribute('viewBox', boundsString);
    },

    setHTMLTransform: function(node, rotationInRad, scale, pivot) {
        var scaleX = 1, scaleY = 1;
        if (typeof scale == "number") {
            scaleX = scale;
            scaleY = scale;
        } else if (scale.x && scale.y) {
            scaleX = scale.x;
            scaleY = scale.y;
        }
        var transformString = 'rotate(' + rotationInRad.toDegrees() + 'deg) ';
        transformString += 'scale(' + scaleX + ',' + scaleY + ')';
        if (this.html5CssPrefix === '-moz-') {
            node.setAttribute('style', node.style.cssText + '-moz-transform: ' + transformString);
        } else {
            node.style[this.html5TransformProperty] = transformString;
        }
    },
    setHTMLTransformOrigin: function(node, origin) {
        var originString = origin.x + 'px ' + origin.y + 'px';
        if (this.html5CssPrefix === '-moz-') {
            node.setAttribute('style', node.style.cssText + '-moz-transform-origin: ' + originString);
        } else {
            node.style[this.html5TransformOriginProperty] = originString;
        }
    },
    setSVGTransform: function(node, pos, rot, scale) {
        var transform = new lively.morphic.Similitude(pos, rot, pt(scale,scale));
        transform.applyTo(node)
    },






    setExtent: function(node, extent) {
        if (this.isHTML(node)) {
            node.style.width = extent.x + 'px';
            node.style.height = extent.y + 'px';
        } else if (this.isSVG(node)) {
            node.setAttributeNS(null, 'width', String(extent.x));
            node.setAttributeNS(null, 'height', String(extent.y));
        }
    },
    setWidth: function(node, value) {
        if (this.isHTML(node)) {
            node.style['width'] = value ?  value + 'px' : value;
        }
        if (this.isSVG(node)) {
            node.setAttributeNS(null, 'width', String(value));
        }
    },
    setHeight: function(node, value) {
        if (this.isHTML(node)) {
            node.style['height'] = value ?  value + 'px' : value;
        }
        if (this.isSVG(node)) {
            node.setAttributeNS(null, 'height', String(value));
        }
    },

    setMaxWidth: function(node, value) {
        if (this.isHTML(node)) {
            var minWidth = this.getCssInt(node, 'min-width');
            if (minWidth && !isNaN(minWidth) && value && minWidth > value) {
                node.style.minWidth = value + 'px';
            }
            node.style.maxWidth = value === null ? 'none' : value + 'px';
            return;
        }
        throw new Error('Cannot set MaxWidth for node ' + node);
    },

    setMaxHeight: function(node, value) {
        if (this.isHTML(node)) {
            node.style.maxHeight = value === null ? 'none' : value + 'px';
            return;
        }
        throw new Error('Cannot set MaxHeight for node ' + node);
    },
    setMinHeight: function(node, value) {
        if (this.isHTML(node)) {
            node.style.minHeight = value === null ? '0px' : value + 'px';
            return;
        }
        throw new Error('Cannot set MinHeight for node ' + node);
    },

    setMinWidth: function(node, value) {
        if (this.isHTML(node)) {
            node.style.minWidth = value === null ? '0px' : value + 'px';
            return;
        }
        throw new Error('Cannot set MinWidth for node ' + node);
    },




    setHTMLBorderRadiusPoint: function(node, radiusPt) {
        this.setHTMLBorderRadius(node, radiusPt.x, radiusPt.y)
    },
    setHTMLBorderRadius: function(node, rx, ry) {
        var roundRectValue =  Math.max(0, rx) + 'px /' +  Math.max(0, ry) + 'px';
        node.style.borderRadius = roundRectValue;
    },
    computeScrollBarExtentHTML: function() {
        var body = document.getElementsByTagName('body')[0],
            div = XHTMLNS.create('div');
        body.appendChild(div);
        this.setWidth(div, 100);
        this.setHeight(div, 100);
        div.style.overflow = 'scroll';
        var noScrollbarWidth = div.offsetWidth,
            noScrollbarHeight = div.offsetHeight,
            scrollbarWidth = div.clientWidth,
            scrollbarHeight = div.clientHeight;
        body.removeChild(div);
        return pt(noScrollbarWidth-scrollbarWidth, noScrollbarHeight-scrollbarHeight);
    },

    getCssInt: function(node, key) {
        var result = parseInt(node.style[key]);
        if (isNaN(result)) {
            return 0;
        }
        return result;
    },


});

Object.subclass('lively.morphic.Rendering.RenderContext',
'settings', {
    domInterface: new lively.morphic.Rendering.DOMInterface(),
    shapeDispatchTable: {},
    morphDispatchTable: {},
},
'creation', {
    newInstance: function() {
        var renderContext = new this.constructor();
        return renderContext;
    },
    newForChild: function () {
        var renderContext = this.newInstance();
        renderContext.setParentNode(this.shapeNode);
        return renderContext;
    },


},
'accessing', {
    setParentNode: function(node) { this.parentNode = node },
    getMorphNode: function() { return this.morphNode },
    getShapeNode: function() { return this.shapeNode },
},
'rendering', {
    append: function(morph, optMorphAfter) { throw new Error('subclass responsibility') },
    appendShape: function(morph) { throw new Error('subclass responsibility') },
    replaceRenderContext: function(morph, newRenderContext) {
        throw new Error('subclass responsibility');
    },
},
'update', {
    shapeDispatch: function(aspect, shape, arg) {
        var updateFunc = this.shapeDispatchTable[aspect];
        if (!updateFunc) {
            var msg = 'shapeUpdateTable does no include: ' + aspect + ' for renderContext: ' + this;
            console.warn(msg)
            alert(msg);
            debugger
            return
        }
        return shape[updateFunc](this, arg);
    },
    morphDispatch: function(aspect, morph, arg) {
        var methodName = this.morphDispatchTable[aspect];
        if (!methodName) {
            var msg = 'morphDispatchTable does no include: ' + aspect + ' for renderContext: ' + this;
            console.warn(msg)
            alert(msg);
            debugger
            return
        }
        return morph[methodName](this, arg);
    },
},
'removal', {
    morphRemoved: function() {
        this.removeNode(this.morphNode);
        this.morphNode = null;
    },
    shapeRemoved: function() {
        this.removeNode(this.shapeNode);
        this.shapeNode = null;
    },
    removeNode: function(node) {
        try { node && node.parentNode && node.parentNode.removeChild(node) } catch(e) {};
    },
},
'testing', {
    isHTML: function(node) { return this.domInterface.isHTML(node) },
    isSVG: function(node) { return this.domInterface.isSVG(node) },
},
'debugging', {
    toString: function() { return 'a' + this.constructor.type },
});

lively.morphic.Morph.addMethods(
'rendering', {

    renderUsing: function(renderContext) {
        this.renderAfterUsing(renderContext, null);
    },

    renderAfterUsing: function(renderContext, morphBefore) {
        this.replaceRenderContextWith(renderContext);
        if (!renderContext.morphNode)
            this.prepareForNewRenderContext(renderContext)
        this.renderContextDispatch('append', morphBefore);
    },

    replaceRenderContextWith: function(newCtx) {
        var oldCtx = this.renderContext()
        if (oldCtx === newCtx) return;
        this.disableEventHandlerRecursively();
        this.renderContextDispatch('replaceRenderContext', newCtx);
        this.prepareForNewRenderContext(newCtx)
    },

    replaceRenderContextCompletely: function(newRenderContext) {
        this.remove()
        this.replaceRenderContextWith(newRenderContext);
        if (this.displayOnCanvas) this.displayOnCanvas(document.body);
    },

    prepareForNewRenderContext: function(newCtx) {
        this.setRenderContext(newCtx);
        this.getShape().setRenderContext(newCtx);
        this.renderContextDispatch('init');
        this.getShape().renderUsing(newCtx);
        if (this.owner) this.renderContextDispatch('append');
        for (var i = 0; i < this.submorphs.length; i++)
            this.submorphs[i].prepareForNewRenderContext(newCtx.newForChild());
        this.registerForEvents(Config.handleOnCapture);
        this.resumeStepping();
        if (this.onLoad) this.onLoad.bind(this).delay(0);
    },

});

lively.morphic.Shapes.Shape.addMethods(
'rendering', {
    defaultRenderContext: function() { return null },
    renderUsing: function(renderContext) {
        this.setRenderContext(renderContext);
        this.renderContextDispatch('init');
        this.renderContextDispatch('appendShape');
    },
});

}) // end of module
