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
        var outer = this.getExtent();
        var inner = pt($(ctx.morphNode).width(), $(ctx.morphNode).height());
        var delta = outer.subPt(inner);
        ctx.domInterface.setExtent(ctx.morphNode, value.subPt(delta));
        return value;
    },
    getExtent: function(){
        var ctx = this.renderContext();
        var w = $(ctx.morphNode).outerWidth(true);
        var h = $(ctx.morphNode).outerHeight(true);
        return pt(w, h);
    },
    
    setFillHTML: function(ctx, value) {
        
    },

    setBorderStyleHTML: function(ctx, value) {

    },
    setBorderWidthHTML: function(ctx, width) {
        this.setBorderHTML(ctx, width, this.getBorderColor(), this.getStrokeOpacity());
        // since border influences width/height in HTML, see this.setExtentHTML
        this.setExtentHTML(ctx, this.getExtent());
        return width;
    },


    setBorderHTML: function(ctx, width, fill, opacity) {

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

    },
    setPaddingHTML: function(ctx, r) {

    },
    setNodeIdHTML: function(ctx, value) {
        //console.log("HTML.js, setStyleIdHTML(): Ok, got it, setting shape HTML id to "+value);
        ctx.morphNode.id = value;
    },
    setNodeClassHTML: function(ctx, value) {
        var a = value;
        if (value instanceof Array) {
            a = value.join(" ");
        }
        ctx.morphNode.className = a;
    },
    setStyleSheetHTML: function(ctx, value) {
        var morphId = ctx.morphNode.id;
        if (!morphId) {
            alert("Cannot set morph specific style sheet. Morph node was not assigned any id.");
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
        
        if (!ctx.morphNode) return;
        var style = window.getComputedStyle(ctx.morphNode),
            borderWidth = parseInt(style["borderWidth"].replace("px",""));
        this.shapeSetter('ComputedBorderWidth', borderWidth );

        if (ctx.originNode) {
            this.compensateShapeNode(ctx);
        }
        this.setExtentHTML(ctx, this.getExtent());
        
    },
    


}
);

}) // end of module