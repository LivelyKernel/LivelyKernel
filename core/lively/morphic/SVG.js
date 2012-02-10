module('lively.morphic.SVG').requires('lively.morphic.Rendering', 'lively.morphic.PathShapes').toRun(function() {

lively.morphic.Rendering.RenderContext.subclass('lively.morphic.SVG.RenderContext',
'settings', {
    renderContextTableName: 'svgDispatchTable',
});

lively.morphic.Morph.addMethods(
'SVG render settings', {
    svgDispatchTable: {
        replaceRenderContext: 'replaceRenderContextSVG',
        init: 'initSVG',
        append: 'appendSVG',
        remove: 'removeSVG',
        setPosition: 'setPositionSVG',
        setRotation: 'setRotationSVG',
        setPointerEvents: 'setPointerEventsSVG',
        setHandStyle: 'setHandStyleSVG',
    },
},
'updating', {
    setPositionSVG: function(ctx, value) {
        if (ctx.morphNode)
            ctx.domInterface.setSVGTransform(ctx.morphNode, value, this.getRotation(), 1);
    },
    setRotationSVG: function(ctx, value) {
        if (ctx.morphNode)
            ctx.domInterface.setSVGTransform(ctx.morphNode, this.getPosition(), value, 1);
    },

},
'rendering', {
    renderWithSVG: function() {
        this.replaceRenderContextCompletely(new lively.morphic.SVG.RenderContext());
    },
    initSVG: function(ctx) {
        if (!ctx.morphNode) ctx.morphNode = ctx.domInterface.svgGroup();
        this.setPositionSVG(ctx, this.getPosition());
    },
    appendSVG: function(ctx, optMorphAfter) {
        if (!ctx.morphNode) throw dbgOn(new Error('no ctx.morphNode!'));
        if (!ctx.morphNode.parentNode) {
            var parentNode = (this.owner && this.owner.renderContext().shapeNode) || ctx.parentNode;
            if (!parentNode) {
                alert('Cannot render ' + this + ' without parentNode')
                return;
            }

            if (ctx.domInterface.isHTML(parentNode)) {
                var svgNode = ctx.domInterface.svgNode()
                parentNode.appendChild(svgNode);
                parentNode = svgNode;
            }

            var afterNode = optMorphAfter && optMorphAfter.renderContext().getMorphNode();
            if (afterNode && $A(parentNode.childNodes).include(afterNode))
                parentNode.insertBefore(ctx.morphNode, afterNode);
            else
                ctx.domInterface.append(parentNode, ctx.morphNode);
        }
        this.getShape().renderUsing(ctx);
    },

    replaceRenderContextSVG: function(oldCtx, newCtx) {
        oldCtx.removeNode(oldCtx.morphNode);
    },


},
'removing', {
    removeSVG: function(ctx) {
        this.owner && this.owner.removeMorph(this);
        var node = ctx.morphNode;
        if (node && node.parentNode && node.parentNode.tagName == 'svg')
            node = node.parentNode;
        ctx.removeNode(node);
    },
},
'event specific SVG', {
    setPointerEventsSVG: function(ctx, value) {
        // if (ctx.morphNode) ctx.morphNode.style.pointerEvents = value;
    },
    setHandStyleSVG: function(ctx, styleName) {
    },

});

lively.morphic.Text.addMethods(
'SVG render settings', {
    svgDispatchTable: {
        renderText: 'renderTextSVG',
        updateText: 'updateTextSVG',
        setTextExtent: 'setTextExtentSVG',
        getTextExtent: 'getTextExtentSVG',
        setMaxTextWidth: 'setMaxTextWidthSVG',
        setMaxTextHeight: 'setMaxTextHeightSVG',
        getTextString: 'getTextStringSVG',
        ignoreTextEvents: 'ignoreTextEventsSVG',
    },
},
'rendering', {
    initSVG: function($super, ctx) {
        $super(ctx);
        if (!ctx.textNode) ctx.textNode = this.createTextNodeSVG();
        this.updateTextSVG(ctx, this.textString);
    },
    appendSVG: function($super, ctx, optMorphAfter) {
        $super(ctx, optMorphAfter);
        this.appendTextSVG(ctx);
    },
    appendTextSVG: function(ctx) {
        if (!ctx.morphNode) throw dbgOn(new Error('appendText: no morphNode!'))
        if (!ctx.textNode) throw dbgOn(new Error('appendText: no textNode!'))
        if (ctx.shapeNode && ctx.shapeNode.nextSibling)
            ctx.morphNode.insertBefore(ctx.textNode, ctx.shapeNode.nextSibling);
        else
            ctx.morphNode.appendChild(ctx.textNode);
    },
    updateTextSVG: function(ctx, str) {
        if (!str || !ctx.textNode) return;
        ctx.textNode.textContent = str;
    },
    setMaxTextHeightSVG: function(ctx, value) {
        // FIXME
    },
    setMaxTextWidthSVG: function(ctx, value) {
        // FIXME
    },

},
'node creation', {
    createTextNodeSVG: function() {
        var node = NodeFactory.create('text', {x: 0, y: 15, 'font-size': 15});
        this.textNode = node;
        return node;
    },
    getTextExtentSVG: function() {
        return this.getExtent(); // FIXME
    },

},
'accessing SVG', {
    getTextStringSVG: function(ctx) {
        return ctx.textNode.textContent;
    },
    ignoreTextEventsSVG: function(ctx) {
    },

});

lively.morphic.Shapes.Shape.addMethods(
'SVG render settings', {
    svgDispatchTable: {
        init: 'initSVG',
        appendShape: 'renderSVG',
        setPosition: 'setPositionSVG',
        setExtent: 'setExtentSVG',
        setFill: 'setFillSVG',
        setBorderColor: 'setBorderColorSVG',
        setBorderWidth: 'setBorderWidthSVG',
        setStrokeOpacity: 'setStrokeOpacitySVG',
        setBorderRadius: 'setBorderRadiusSVG',
        setBorderStyle: 'setBorderStyleSVG',
    },
},
'SVG rendering', {
    initSVG: function(ctx) {
        if (!ctx.shapeNode)
            ctx.shapeNode = this.createShapeNode(ctx);
        this.setPositionSVG(ctx, this.getPosition());
        this.setExtentSVG(ctx, this.getExtent());
        this.setFillSVG(ctx, this.getFill());
        this.setBorderWidthSVG(ctx, this.getBorderWidth());
        this.setBorderColorSVG(ctx, this.getBorderColor());
        this.setStrokeOpacitySVG(ctx, this.getStrokeOpacity());
    },
    renderSVG: function(ctx) {
        if (!ctx.shapeNode.parentNode)
            ctx.morphNode.insertBefore(ctx.shapeNode, ctx.morphNode.childNodes[0])
    },
},
'SVG updating', {
    setPositionSVG: function(ctx, value) {
        if (ctx.shapeNode)
            ctx.domInterface.setPosition(ctx.shapeNode, value);
    },
    setExtentSVG: function(ctx, value) {
        if (ctx.shapeNode)
            ctx.domInterface.setExtent(ctx.shapeNode, value);
        // update also parents so that shapes is not clipped... really necassary? FIXME
        // if (ctx.morphNode)
            // ctx.domInterface.setExtent(ctx.morphNode, value);
        // if (ctx.morphNode.parentNode.tagName == 'svg')
            // ctx.domInterface.setExtent(ctx.morphNode.parentNode, value);
    },
    setFillSVG: function(ctx, value) {
        if (ctx.shapeNode)
            ctx.domInterface.setFill(ctx.shapeNode, value);
    },
    setBorderColorSVG: function() {},
    setBorderWidthSVG: function(ctx, value) {
        // var node = this.getPathNodeHTML(ctx);
        // node && node.setAttribute('stroke-width', String(value))
    },
    setStrokeOpacitySVG: function() {},
    setBorderRadiusSVG: function() {},
    setBorderStyleSVG: function(ctx, value) {
        if (value == 'dashed')
            ctx.shapeNode.setAttribute('stroke-dasharray', '7 4')
        else if (value == 'dotted')
            ctx.shapeNode.setAttribute('stroke-dasharray', '2 2')
        else
            ctx.shapeNode.removeAttribute('stroke-dasharray')
    },

},
'SVG DOM elements', {
    createShapeNode: function(ctx) { throw new Error('subclass responsibility') },
})
lively.morphic.Shapes.Rectangle.addMethods(
'SVG DOM elements', {
    createShapeNode: function(ctx) { return ctx.domInterface.svgRect() },
});

lively.morphic.Shapes.Ellipse.addMethods(
'SVG specific manipulation', {
    setExtentSVG: function(ctx, extent) {
        var radiusPt = extent.scaleBy(0.5),
            center = this.getPosition().addPt(radiusPt);
        ctx.domInterface.setAttr(ctx.shapeNode, "cx", center.x);
        ctx.domInterface.setAttr(ctx.shapeNode, "cy", center.y);

        ctx.domInterface.setAttr(ctx.shapeNode, "rx", radiusPt.x);
        ctx.domInterface.setAttr(ctx.shapeNode, "ry", radiusPt.y);
    },
},
'SVG DOM elements', {
    createShapeNode: function(ctx) { return ctx.domInterface.svgEllipse() },
});
lively.morphic.Shapes.Image.addMethods(
'SVG rendering', {
    createShapeNode: function() {
        return NodeFactory.createNS(Namespace.SVG, "image");
    },
})

lively.morphic.Shapes.External.addMethods(
'rendering', {
    initSVG: function($super, ctx) {
        // FIXME more to do here!!!
        ctx.shapeNode = this.shapeNode;
    },
});

lively.morphic.Shapes.Path.addMethods(
'SVg render settings', {
    svgDispatchTable: {
        setPathElements: 'setPathElementsSVG',
        getPathBounds: 'getPathBoundsSVG',
        getTotalLength: 'getTotalLengthSVG',
        getPointAtTotalLength: 'getPointAtTotalLengthSVG',
    },
},
'SVG rendering', {
    initSVG: function($super, ctx) {
        if (!ctx.shapeNode)
            ctx.shapeNode = NodeFactory.create('path');
        $super(ctx);
        this.setPathElementsSVG(ctx, this.getPathElements());
        this.setBorderColorSVG(ctx, Color.black);
    },
},
'accessing', {
    setPathElementsSVG: function(ctx, elements) {
        var pathNode = this.getPathNodeSVG(ctx);
        if (!pathNode) return;
        pathNode.setAttributeNS(null, "d", this.createSVGDataFromElements(elements));
        var bounds = this.getBounds()
        this.setBounds(bounds);
        ctx.domInterface.setSVGViewbox(ctx.shapeNode, bounds);
    },




    setBorderColorSVG: function(ctx, fill) {
        ctx.domInterface.setSVGFillOrStrokePaint(ctx.shapeNode, 'stroke', fill)
    },
    setBorderWidthSVG: function(ctx, value) {
        var node = this.getPathNodeSVG(ctx);
        node && node.setAttribute('stroke-width', String(value))
    },


},
'svg specific', {
    setElementsFromSVGData: function(data) {
        var elements = lively.morphic.Shapes.PathElement.parse(data);
        this.setPathElements(elements);
    },
    getPathNodeSVG: function(ctx) {
        return ctx.shapeNode;
    },

    getPathBoundsSVG: function(ctx) {
       
        var pathNode = this.getPathNodeSVG(ctx),
            r = pathNode ? Rectangle.ensure(pathNode.getBBox()) : new Rectangle(0,0,0,0);
        // r = r.translatedBy(this.getPosition().negated());
        return r;
    },
    

    getTotalLengthSVG: function(ctx) {
        var pathNode = this.getPathNodeSVG(ctx);
        return pathNode && pathNode.getTotalLength()
    },
    getPointAtTotalLengthSVG: function(ctx, totalLength) {
        var pathNode = this.getPathNodeSVG(ctx);
        return pathNode && lively.Point.ensure(pathNode.getPointAtLength(totalLength));
    },


});

}) // end of module