dmodule('lively.morphic.Canvas').requires('lively.morphic.Rendering').toRun(function() {

lively.morphic.Rendering.RenderContext.subclass('lively.morphic.Canvas.RenderContext',
'settings', {
    renderContextTableName: 'canvasDispatchTable',
},
'creation', {
    newForChild: function() {
        // when submorph should be rendered using the same render system this method is used
        // to supply it with a new RenderContext
        var renderContext = new this.constructor();
        renderContext.canvas = this.getCanvas();
        renderContext._graphicContext = this._graphicContext;
        return renderContext;
    },
},
'accessing', {
    getCanvas: function() { return this.canvas },
    getGraphicContext: function() {        
        if (this._graphicContext) return this._graphicContext;
        var canvas = this.getCanvas();
        if (!canvas || !canvas.getContext) throw new Error('Cannot access canvas or drawing context');
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = 'black'; ctx.fillRect (10, 10, 10, 10);
        ctx.font = "bold italic 9pt Helvetica";  // our current default
        if (ctx.fillText) ctx.fillText("Canvas Test", 30, 20);  // test
        ctx.strokeStyle = 'black';
        this._graphicContext = ctx;
        return ctx;
    },
},
'drawing', {
    drawMorph: function(morph) {
        // if (!morph.isVisible() /*|| !clipRect.intersects(morph.bounds())*/) return;

        var graphicContext = this.getGraphicContext(), bounds = morph.getBounds();
        graphicContext.save();
        graphicContext.translate(bounds.x, bounds.y);
        // if (this.rotation != 0) graphicContext.rotate(this.rotation);
        // var s = this.scalePoint;
        // if (s.x != 1 || s.y != 1) graphicContext.scale(s.x, s.y);

        // basic draw
        // if (this.isClipMorph) {  // Check for clipping behavior
            // this.shape.setPath(graphicContext, bounds);
            // graphicContext.clip();
        // }
        morph.getShape().renderUsing(this);

        // this.drawSubmorphs(graphicContext, clipRect)
        graphicContext.restore();
    },
    canvasFillFor: function(ourFill, graphicContext, bnds) {
        if (ourFill == null) return null;
        if (ourFill instanceof Color) return ourFill.toString();
        var grad = null;
        if (ourFill.isLinearGradient) {
            cv = bnds.scaleByRect(ourFill.vector ||  rect(pt(0.0,0.0),pt(0.0,1.0))/*lively.paint.LinearGradient.NorthSouth*/);
            grad = graphicContext.createLinearGradient(cv.x, cv.y, cv.maxX(), cv.maxY());
        }
        if (ourFill.isRadialGradient) {
            var c = bnds.center();
            var c0 = c.scaleBy(0.7).addPt(bnds.topLeft().scaleBy(0.3));
            grad = graphicContext.createRadialGradient(c0.x, c0.y, 0, c.x, c.y, bnds.width/2);
        }
        if (grad) {
            var stops = ourFill.stops;
            for (var i=0; i<stops.length; i++)
                grad.addColorStop(stops[i].offset(), this.canvasFillFor(stops[i].color()));
            return grad;
        }
        return null;
    },
},
'removal', {
    shapeRemoved: function(morph) {
        // FIXME
    },
});
lively.morphic.Morph.addMethods(
'canvas render settings', {
    canvasDispatchTable: {
        init: 'initCANVAS',
        append: 'appendCANVAS',
        remove: 'removeCANVAS',
        setPosition: 'attributeChangedCANVAS',
    },
},
'updating', {
    attributeChangedCANVAS: function(ctx, value) {
        if (!this.world()) return;
        ctx.getCanvas().width = ctx.getCanvas().width; // erase canvas
        this.world().drawOnCANVAS(ctx);
    },
},
'rendering', {
    renderWithCANVAS: function() {
        this.replaceRenderContextCompletely(new lively.morphic.Canvas.RenderContext());
    },
    initCANVAS: function(ctx) {
        if (!ctx.canvas)
            ctx.canvas = ctx.domInterface.htmlCanvas();
    },
    appendCANVAS: function(ctx, optMorphAfter) {
        if (!ctx.getCanvas().parentNode) {
            var parentNode = (this.owner && this.owner.renderContext().shapeNode) || ctx.parentNode;
            if (!parentNode) {
                alert('Cannot render ' + this + ' without pareNode')
                return;
            }
            ctx.domInterface.append(parentNode, ctx.getCanvas());
        }

        this.drawOnCANVAS(ctx);
    },

    replaceRenderContextCANVAS: function(morph, oldCtx, newCtx) {},


},
'drawing', {
    drawOnCANVAS: function(ctx) {
        // if (!morph.isVisible() /*|| !clipRect.intersects(morph.bounds())*/) return;

        var graphicContext = ctx.getGraphicContext(), bounds = this.getBounds();
        graphicContext.save();
        graphicContext.translate(bounds.x, bounds.y);
        // if (ctx.rotation != 0) graphicContext.rotate(ctx.rotation);
        // var s = ctx.scalePoint;
        // if (s.x != 1 || s.y != 1) graphicContext.scale(s.x, s.y);

        // basic draw
        // if (ctx.isClipMorph) {  // Check for clipping behavior
            // ctx.shape.setPath(graphicContext, bounds);
            // graphicContext.clip();
        // }
        this.getShape().renderCANVAS(ctx);

        this.drawSubmorphsOnCANVAS(ctx);
        
        graphicContext.restore();
    },
    drawSubmorphsOnCANVAS: function(ctx) {
        this.submorphs.forEach(function(morph) {
            morph.renderUsing(morph.renderContext());
        })
    },
},
'removing', {
    removeCANVAS: function(ctx) {
        this.owner && this.owner.removeMorph(this);
        // FIXME
    },
});
lively.morphic.World.addMethods(
'drawing', {
    drawOnCANVAS: function($super, ctx) {
        var extent =  this.getExtent(), canvasNode = ctx.getCanvas();
        ctx.domInterface.setExtent(canvasNode, extent)
        canvasNode.width = extent.x;
        canvasNode.height = extent.y;
        $super(ctx);
    },
},
'removing', {
    removeCANVAS: function($super, ctx) {
        $super(ctx);
        ctx.removeNode(ctx.getCanvas());
    },
});
lively.morphic.Text.addMethods(
'canvas render settings', {
    canvasDispatchTable: {
        updateText: 'attributeChangedCANVAS',
    },
},
'drawing', {
    drawTextOnCANVAS: function(ctx) {
        var graphicContext = ctx.getGraphicContext(), bounds = this.getBounds();

        graphicContext.textBaseline = 'top';
        graphicContext.fillStyle = ctx.canvasFillFor(this.textColor);
        graphicContext.font = '11pt Helvetica';
        graphicContext.fillText(this.textString, 0, 0);
/*        if (!graphicContext.fillText) return;
        if (this.lines == null) return;

        var bnds = this.shape.bounds();
        graphicContext.textBaseline = 'top';
        graphicContext.fillStyle = ctx.canvasFillFor(this.textColor);


        var currentFont = this.font;
        graphicContext.font = this.fontString(this.font);

        // Only display lines in the damage region
        // DI: this loop should be TextLine.drawOn(graphicContext, clipRect)
        var firstLine = this.lineNumberForY(clipRect.y);
        if (firstLine < 0) firstLine = 0;
        var lastLine = this.lineNumberForY(clipRect.maxY());
        if (lastLine < 0) lastLine = this.lines.length - 1;
        for (var i = firstLine; i <= lastLine; i++) {
            var line = this.lines[i];
            var str = line.textString;
            for (var j = 0; j < line.chunks.length; j++) {
                var word = line.chunks[j];
                var slice = str.slice(word.startIndex,word.stopIndex + 1);
                if (!word.isWhite) {
                    if (word.font && word.font !== currentFont) {
                        currentFont = word.font;
                        graphicContext.font = this.fontString(currentFont);
                    }
                    graphicContext.fillText(slice, word.bounds.x, word.bounds.y - 2);  // *** why -2? Fix me
                }
            }
        }*/
    },
    drawSubmorphsOnCANVAS: function($super, ctx) {
        $super(ctx);
        this.drawTextOnCANVAS(ctx);
    },
});

lively.morphic.Shapes.Shape.addMethods(
'canvas render settings', {
    canvasDispatchTable: {
        init: 'initCANVAS',
        append: 'appendCANVAS',
        remove: 'removeCANVAS',
        setPosition: 'attributeChangedCANVAS',
        appendShape: 'renderCANVAS',
    },
},
'updating', {
    attributeChangedCANVAS: function(ctx, value) {
        ctx.getCanvas().width = ctx.getCanvas().width; // erase canvas;
        this.renderCANVAS(ctx)
    },
},
'rendering', {
    initCANVAS: function() {},
    renderCANVAS: function(ctx) {
        var graphicContext = ctx.getGraphicContext(),
            pathSet = false,
            bounds = this.getBounds(),
            fill = this.getFill();
        if (fill) { // Fill first, then stroke
            var alpha = this.getFillOpacity();
            if (alpha != 1) graphicContext.globalAlpha = alpha;
            graphicContext.fillStyle = ctx.canvasFillFor(fill, graphicContext, bounds);
            this.setPath(graphicContext, bounds);
            graphicContext.fill();
            pathSet = true;
        }
        // if (this.getStroke() && this.getStrokeWidth() > 0) {
            // var alpha = this.getStrokeOpacity();
            // if (alpha != 1) graphicContext.globalAlpha = alpha;
            // graphicContext.strokeStyle = this.canvasFillFor(this.getStroke(), graphicContext, bounds);
            // graphicContext.lineWidth = this.getStrokeWidth();
            // this.drawStrokeOn(graphicContext, bounds, pathSet);
        // }
    },
});

lively.morphic.Shapes.Rectangle.addMethods(
'rendering', {
    setPath: function(graphicContext, bnds) { // Rectangular default my be overridden
        graphicContext.beginPath();
        graphicContext.moveTo(bnds.x, bnds.y);
        graphicContext.lineTo(bnds.maxX(), bnds.y);
        graphicContext.lineTo(bnds.maxX(), bnds.maxY());
        graphicContext.lineTo(bnds.x, bnds.maxY());
        graphicContext.closePath();
    },
});

lively.morphic.Shapes.Ellipse.addMethods(
'rendering', {
    setPath: function(graphicContext, bnds) {
        var aX = bnds.x, aY = bnds.y,
            hB = (bnds.width / 2) * .5522848,
            vB = (bnds.height / 2) * .5522848,
            eX = aX + bnds.width,
            eY = aY + bnds.height,
            mX = aX + bnds.width / 2,
            mY = aY + bnds.height / 2;
        graphicContext.beginPath();
        graphicContext.moveTo(aX, mY);
        graphicContext.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
        graphicContext.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
        graphicContext.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
        graphicContext.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
        graphicContext.closePath();
    },
});


}) // end of module