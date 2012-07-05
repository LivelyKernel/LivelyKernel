module('lively.morphic.HTMLExperiments').requires('lively.morphic.HTML').toRun(function() {

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.NullShape',
'documentation', {
    documentation: 'a shape that does not get rendered and acts as a proxy to the morph itself',
},
'initializing', {
    initHTML: function(ctx) {
        ctx.shapeNode = XHTMLNS.create('div');
        /*
        this.setPositionHTML(ctx, this.getPosition());
        this.setExtentHTML(ctx, this.getExtent());
        this.setFillHTML(ctx, this.getFill());
        this.setFillOpacity(this.getFillOpacity())
        this.setOpacityHTML(ctx, this.getOpacity());
        this.setBorderWidthHTML(ctx, this.getBorderWidth()); // The other border props are initialized there as well
        this.setBorderStyleHTML(ctx, this.getBorderStyle());
        this.setPaddingHTML(ctx, this.getPadding()); // also sets extent

        this.getNodeClass() && this.setNodeClassHTML(ctx, this.getNodeClass());
        if (this.getNodeId()) {
            this.setNodeIdHTML(ctx, this.getNodeId());
            /this.getStyleSheet && this.setStyleSheetHTML(ctx, this.getStyleSheet());
        }

        if (UserAgent.fireFoxVersion)
            ctx.shapeNode['-moz-user-modify'] = 'read-only'
            */
    },
    renderHTML: function(ctx) {
        /*
        if (ctx.shapeNode.parentNode) return;
        var child = ctx.morphNode.childNodes[0];
        if (!child) ctx.morphNode.appendChild(ctx.shapeNode)
        else ctx.morphNode.insertBefore(ctx.shapeNode, child)
        */
    },
},
'updating', {
    setPositionHTML: function(ctx, value) {
        if (!ctx.morphNode) return undefined;
        ctx.domInterface.setPosition(ctx.morphNode, value);
    },
    setExtentHTML: function(ctx, value) {
        if (!ctx.morphNode) return undefined;
        var padding = this.getPadding(),
            paddingWidth = padding.left() + padding.right(),
            paddingHeight = padding.top() + padding.bottom(),
            // HTML isn't using fractions for pixels, rounds internally,
            // this has to be reflected to compensate HTML's box model
            borderWidth = Math.floor(this.getBorderWidth()),
            realExtent = value
                         .addXY(-2 * borderWidth, -2 * borderWidth)
                         .addXY(-paddingWidth, -paddingHeight);
            realExtent = realExtent.maxPt(pt(0,0));
        ctx.domInterface.setExtent(ctx.morphNode, realExtent);
        return realExtent;
    },
    setFillHTML: function(ctx, value) {
        if (!ctx.shapeNode) return;
        if (this.isStyleSheetAppearance) {
            ctx.domInterface.setFill(ctx.shapeNode, null, this.getBounds());
        } else {
            ctx.domInterface.setFill(ctx.shapeNode, value, this.getBounds());
        }
    },
    setBorderColorHTML: function(ctx, fill) {
        var alpha;
        if (this.getStrokeOpacity() != 1) {
            alpha = this.getStrokeOpacity();
        } else {
            alpha = fill === null ? 0 : fill.a;
        }
        return this.setBorderHTML(ctx, this.getBorderWidth(), fill, alpha)
    },
    setBorderStyleHTML: function(ctx, value) {
        if (ctx.shapeNode) {
            var style = this.isStyleSheetBorder ? null : value;
            ctx.shapeNode.style.borderStyle = style;
        }
    },
    setBorderWidthHTML: function(ctx, width) {
        this.setBorderHTML(ctx, width, this.getBorderColor(), this.getStrokeOpacity());
        // since border influences width/height in HTML, see this.setExtentHTML
        this.setExtentHTML(ctx, this.getExtent());
        return width;
    },
    setBorderRadiusHTML: function(ctx, value) {
        // does not make sense for morphs in general
    },
    setStrokeOpacityHTML: function(ctx, opacity) {
        return this.setBorderHTML(ctx, this.getBorderWidth(), this.getBorderColor(), opacity)
    },
    setBorderHTML: function(ctx, width, fill, opacity) {
        if (!ctx.shapeNode) return;
        if (this.isStyleSheetBorder) {
             ctx.shapeNode.style['border'] = null;
        } else {
            if ((fill instanceof Color) && opacity) fill = fill.withA(opacity);
            if (!fill) fill = Color.rgba(0,0,0,0);
            ctx.shapeNode.style['border'] = this.getBorderStyle() + ' ' + width + 'px ' +
                fill.toCSSString(this.getBounds(), ctx.domInterface.html5CssPrefix);
        }
        if (ctx.originNode) {
            this.compensateShapeNode(ctx);
        }
    },
    compensateShapeNode: function(ctx) {
        // compensates the shapeNode's position for childmorphs,
        // positions childmorphs against morphNodes (origin!)
        ctx.originNode.style.setProperty('top', -this.getPosition().y + 'px', 'important');
        ctx.originNode.style.setProperty('left', -this.getPosition().x + 'px', 'important');
        ctx.originNode.style.setProperty('position', 'absolute', 'important');

        // FIXME: hack, necessary until the style editor knows
        // about stroke widths of svg lines instead of using borderWidth...
        if (ctx.pathNode) return;

        // compensates the shapeNode's borderWidth for childmorphs, borders don't affect submorphs
        ctx.originNode.style.setProperty('margin-top', -this.getBorderWidth() + 'px', 'important');
        ctx.originNode.style.setProperty('margin-left', -this.getBorderWidth() + 'px', 'important');
    },
    setOpacityHTML: function(ctx, value) {
        if (ctx.shapeNode) ctx.shapeNode.style.opacity = this.isStyleSheetAppearance ? null : value;
    },
    setPaddingHTML: function(ctx, r) {
        if (r === undefined || !ctx.shapeNode) return r;
        // Rectangle.inset(left, top, right, bottom) ==>
        // CSS padding: [padding-top] [padding-right] [padding-bottom] [padding-left]
        var s = r.top() + "px " + r.right() + "px " + r.bottom() + "px " + r.left() + "px";
        ctx.shapeNode.style.padding = s;
        return r;
    },

    setNodeClassHTML: function(ctx, value) {
        var a = value;
        if (value instanceof Array) {
            a = value.join(" ");
        }
        ctx.shapeNode.className = a;
    },

    setNodeIdHTML: function(ctx, value) {
        //console.log("HTML.js, setStyleIdHTML(): Ok, got it, setting shape HTML id to "+value);
        ctx.shapeNode.id = value;
    },

    setStyleSheetHTML: function(ctx, value) {
        var morphId = ctx.shapeNode.id;
        if (!morphId) {
            alert("Cannot set morph specific style sheet. Shape node was not assigned any id.");
            return;
        }

        var styleTagId = "style-for-"+morphId;

	    var css = $('#' + styleTagId);
	    css.remove();

        if (value && value.length > 1) {
            
    	    //console.log("Setting CSS for shape "+morphId+" to "+value);
            var specificCss = "#"+morphId+" { "+value+" }";
            
            // syntax fixes for the sap gold reflection css
            specificCss = specificCss.replace(/[\s]*=[\s]*/g,"=");
            specificCss = specificCss.replace(/alpha[\s]*\([\s]*opacity[\s]*\:/g,"alpha(opacity=");
            specificCss = specificCss.replace(".dev-datepicker/jQuery",".dev-datepicker.jQuery");
                            

            if (less) {
                new less.Parser().parse(specificCss, function(e, tree) {
                    console.log(e);
                    specificCss = tree.toCSS();
                });
                console.log(specificCss);
            }


	        css = $('<style type="text/css" id="' + styleTagId + '"></style>');
	        css.text(specificCss);
	        css.appendTo(document.head);
        }

    },

    setComputedStylesHTML: function(ctx) {
        
        if (!ctx.shapeNode) return;
        var style = window.getComputedStyle(ctx.shapeNode),
            borderWidth = parseInt(style["borderWidth"].replace("px",""));
        this.shapeSetter('ComputedBorderWidth', borderWidth );

        if (ctx.originNode) {
            this.compensateShapeNode(ctx);
        }
        this.setExtentHTML(ctx, this.getExtent());
        
    },

    setComputedBorderWidthHTML: function(ctx, width) {},

    setAppearanceStylingModeHTML: function(ctx, value) {
        this.isStyleSheetAppearance = value;
        this.setFillHTML(ctx, this.shapeGetter("Fill"));
        this.setOpacityHTML(ctx, this.shapeGetter("Opacity"));
    },

    setBorderStylingModeHTML: function(ctx, value) {
        this.isStyleSheetBorder = value;
        this.setBorderHTML(ctx, this.getBorderWidth(), this.getBorderColor(), this.getStrokeOpacity());
        this.setBorderRadiusHTML(ctx, this.getBorderRadius());
    }

}
);

}) // end of module