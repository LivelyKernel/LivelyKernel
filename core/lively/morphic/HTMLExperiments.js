module('lively.morphic.HTMLExperiments').requires('lively.morphic.HTML').toRun(function() {

cop.create('lively.morphic.RelativeLayer').refineClass(lively.morphic.Morph, {
    adjustOrigin: function() {},
    
    appendHTML: function(ctx, optMorphAfter) {
        if (!ctx.morphNode) throw dbgOn(new Error('no ctx.morphNode!'));

        var parentNode = false;//ctx.morphNode.parentNode;
        if (!parentNode) {
            var ownerCtx = this.owner && this.owner.renderContext();
            parentNode = (ownerCtx && ownerCtx.shapeNode) || ctx.parentNode;
            
            if (this.owner.getShape().constructor.name === "HTMLShape") {
             
                  parentNode = ownerCtx.shapeNode;
                  parentNode.appendChild(ctx.shapeNode);
                
            }
            else if (parentNode && ownerCtx && ownerCtx.shapeNode && parentNode === ownerCtx.shapeNode) {

                if (!ownerCtx.originNode) {
                    ownerCtx.originNode = ownerCtx.domInterface.htmlRect();
                    ownerCtx.shapeNode.appendChild(ownerCtx.originNode);
                }
                this.owner.shape.compensateShapeNode(ownerCtx);
                
                parentNode = ownerCtx.originNode;
                
                var afterNode = optMorphAfter && optMorphAfter.renderContext().getMorphNode();
                this.insertMorphNodeInHTML(ctx, ctx.morphNode, parentNode, afterNode);    
            
            }
        }

        this.getShape().renderUsing(ctx);
    },
    
getBounds: function() {
    var p = this.getPosition();
    var e = this.getExtent();
    return new Rectangle(p.x, p.y, e.x, e.y);
},

getPosition: function() {
    var ctx = this.renderContext();
    var ownerPos = this.owner.getPosition();
    var o = $(ctx.shapeNode).offset();
    return pt(o.left, o.top).subPt(ownerPos);
},

getRotation: function() {
    return 0;
},
getScale: function() {
    return 1;
},

setExtent: function(value) {
    this.extentOverride = value;
    return cop.proceed(value);
},

setPositionHTML: function(ctx) {},

setRotationHTML: function(ctx) {},

setScaleHTML: function(ctx) {},

   
    
 }
);

lively.morphic.Morph.subclass('lively.morphic.HTMLMorph',
'settings', {
    tagName: 'div'
},
'HTML render settings', {
    htmlDispatchTable: {
        setContent: 'setContentHTML',
        setAttribute: 'setAttributeHTML',
     },
},
'initializing', {
    initialize: function($super, bounds, tagName) {
            if (tagName) this.tagName = tagName;
            $super(new lively.morphic.Shapes.HTMLShape(this.tagName, bounds));
    }    
    
},

'accessing',{
    resetExtent: function() {
        this.shape.resetExtent();    
    },
    setContent: function(content){
        this.renderContextDispatch('setContent', content);
    },
    setContentHTML: function(ctx, content){
        this.content = content;
        var textNode = document.createTextNode(content);
        ctx.shapeNode.appendChild(textNode);
    },
    getContent: function(){
        return this.content || "";    
    },
    getBounds: function() {
        return this.getPosition().extent(this.getExtent());
    },
    addMorph: function($super, morph, optMorphBefore) {
        // enable Relative Layout Layer
        morph.addWithLayer(lively.morphic.RelativeLayer);
        $super(morph,optMorphBefore);
    },
    setAttribute: function(attribute, value) {
        this.renderContextDispatch('setAttribute', attribute, value);  
    },
    setAttributeHTML: function(ctx, attribute, value) {
        if (value) $(shapeNode).attr(attribute, value);
        else ctx.shapeNode.removeAttribute(attribute);
    },

    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'Set content', function(evt) {
            $world.prompt('Set content', function(input) {
                if (input !== null)
                    self.setContent(input || '');
            }, self.getContent());
        }]);
        items.push([
            'Reset extent', function(evt) {
                self.resetExtent();
        }]);
        return items;
    }
    


}


);



lively.morphic.Morph.subclass('lively.morphic.RelativeMorph',
'HTML render settings', {
    htmlDispatchTable: {
        setContent: 'setContentHTML',
        setAttribute: 'setAttributeHTML',
        resetExtent: 'resetExtentHTML',
     },
},
'properties', {
    
tagName: 'div',
    
adjustOrigin: function() {
    
},
initialize: function($super, tag, optContent) {
    if (tag) this.tagName = tag;
    if (optContent) this.content = optContent;
    $super(new lively.morphic.Shapes.NullShape());
},
appendHTML: function(ctx, optMorphAfter) {
        if (!ctx.morphNode) throw dbgOn(new Error('no ctx.morphNode!'));
        var parentNode = ctx.morphNode.parentNode;
        if (!parentNode) {
            var ownerCtx = this.owner && this.owner.renderContext();
            parentNode = (ownerCtx && ownerCtx.shapeNode) || ctx.parentNode;
            
            if (this.owner.getShape().constructor.name === "NullShape") {
             
                  parentNode = ownerCtx.morphNode; 
                
            }
            else
            if (parentNode && ownerCtx && ownerCtx.shapeNode && parentNode === ownerCtx.shapeNode) {

                if (!ownerCtx.originNode) {
                    ownerCtx.originNode = ownerCtx.domInterface.htmlRect();
                    ownerCtx.shapeNode.appendChild(ownerCtx.originNode);
                }
                this.owner.shape.compensateShapeNode(ownerCtx);
                
                parentNode = ownerCtx.originNode;
            }

            if (!parentNode) {
                if (Config.debugMissingParentNode) debugger
                alert('Cannot render ' + this + ' without parentNode')
                return;
            }
        }

        var afterNode = optMorphAfter && optMorphAfter.renderContext().getMorphNode();
        this.insertMorphNodeInHTML(ctx, ctx.morphNode, parentNode, afterNode);
        //if (this.originClass) this.setOriginClassHTML(ctx, this.originClass);
        this.getShape().renderUsing(ctx);
    },
    
getBounds: function() {
    var p = this.getPosition();
    var e = this.getExtent();
    return new Rectangle(p.x, p.y, e.x, e.y);
},

getPosition: function() {
    var ctx = this.renderContext();
    var ownerPos = this.owner.getPosition();
    var o = $(ctx.morphNode).offset();
    return pt(o.left, o.top).subPt(ownerPos);
},
getRotation: function() {
    return 0;
},
getScale: function() {
    return 1;
},


    
initHTML: function(ctx) {
        if (!ctx.morphNode) ctx.morphNode = XHTMLNS.create(this.tagName);;
        if (this.content) this.setContentHTML(ctx, this.content);
        if (this.extentOverride) this.setExtent(this.extentOverride);
        else this.resetExtent();
        this.setFocusableHTML(ctx, this.isFocusable());
        //this.setPivotPointHTML(ctx, this.getPivotPoint())
        //ctx.domInterface.setHTMLTransformOrigin(ctx.morphNode, pt(0,0));
        //this.setPositionHTML(ctx, this.getPosition());
        //this.setRotationHTML(ctx, this.getRotation());
        //this.setScaleHTML(ctx, this.getScale());
        //this.setClipModeHTML(ctx, this.getClipMode());
        //this.setHandStyleHTML(ctx, this.getHandStyle());
        this.setPointerEventsHTML(ctx, this.getPointerEvents());
        if (this.morphicGetter('Visible') === false)
            this.setVisibleHTML(ctx, false);
        var tooltip = this.morphicGetter('ToolTip');
        tooltip && this.setToolTipHTML(ctx, tooltip);
        if (UserAgent.fireFoxVersion)
            ctx.morphNode['-moz-user-modify'] = 'read-only'
    },
setContent: function(content){
    this.renderContextDispatch('setContent', content);    
},
setContentHTML: function(ctx, content){
    this.content = content;
    var textNode = document.createTextNode(content);
    ctx.morphNode.appendChild(textNode);
},
getContent: function(){
    return this.content || "";    
},

setAttribute: function(attribute, value) {
    this.renderContextDispatch('setAttribute', attribute, value);  
},
setAttributeHTML: function(ctx, attribute, value) {
    if (value) $(ctx.morphNode).attr(attribute, value);
    else ctx.morphNode.removeAttribute(attribute);
},
setPositionHTML: function(ctx) {
    
},
setExtent: function($super, value) {
    this.extentOverride = value;
    $super(value);
},

resetExtent: function() {
    this.renderContextDispatch('resetExtent');     

},

resetExtentHTML: function(ctx){
    this.extentOverride = null;
    ctx.morphNode.style.width = null;
    ctx.morphNode.style.height = null;         
},


setRotationHTML: function(ctx) {
    
},

setScaleHTML: function(ctx) {
    
},



    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'Set content', function(evt) {
            $world.prompt('Set content', function(input) {
                if (input !== null)
                    self.setContent(input || '');
            }, self.getContent());
        }]);
        items.push([
            'Reset extent', function(evt) {
                self.resetExtent();
        }]);
        return items;
    }
});


lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.HTMLShape',
'documentation', {
    documentation: 'an HTMLMorph shape',
},
'initializing', {

    htmlDispatchTable: {
        resetExtent: 'resetExtentHTML',
     },

    initialize: function($super, tagName, optBounds){
        this.tagName = tagName;
        $super(optBounds);
    },
    
    initHTML: function(ctx) {
        if (!ctx.shapeNode)
            ctx.shapeNode = XHTMLNS.create(this.tagName);
        if (this.extentOverride) this.setExtent(this.extentOverride);
    },

},
'updating', {
    resetExtent: function() {
        this.renderContextDispatch('resetExtent');     
    },
    resetExtentHTML: function(ctx){
        this.extentOverride = null;
        ctx.shapeNode.style.width = null;
        ctx.shapeNode.style.height = null;         
    },
    getBounds: function() {
        return pt(0,0).extent(this.getExtent())
    },
    getPosition: function() {
            var ctx = this.renderContext();
            var ownerPos = this.owner.getPosition();
            var o = $(ctx.shapeNode).offset();
            return pt(o.left, o.top).subPt(ownerPos);
    
    },
    setPositionHTML: function(ctx, value) {
        if (!ctx.shapeNode) return undefined;
        ctx.domInterface.setPosition(ctx.shapeNode, value);
    },
    setExtentHTML: function(ctx, value) {
        if (!ctx.shapeNode) return undefined;
            this.extentOverride = value;
            var outer = this.getExtent();
            var inner = pt($(ctx.shapeNode).width(), $(ctx.shapeNode).height());
            var delta = outer.subPt(inner);
            ctx.domInterface.setExtent(ctx.shapeNode, value.subPt(delta));

        return value;
    },
    getExtent: function(){
        var ctx = this.renderContext();
        var w = $(ctx.shapeNode).outerWidth(true);
        var h = $(ctx.shapeNode).outerHeight(true);
        return pt(w, h);
    },
/*
    setFillHTML: function(ctx, value) {},

    setBorderStyleHTML: function(ctx, value) {},
    setBorderWidthHTML: function(ctx, width) {},
    setBorderHTML: function(ctx, width, fill, opacity) {},

    setOpacityHTML: function(ctx, value) {},
    setPaddingHTML: function(ctx, r) {},
*/
    compensateShapeNode: function(ctx) {},
    


}
);


lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.NullShape',
'documentation', {
    documentation: 'a shape that does not get rendered and acts as a proxy to the morph itself',
},
'initializing', {
    initHTML: function(ctx) {
        ctx.shapeNode = XHTMLNS.create('div');
    },
    renderHTML: function(ctx) {

    },
},
'updating', {
    getBounds: function($super) {
        return pt(0,0).extent(this.getExtent())
    },
    getPosition: function() {
        var ctx = this.renderContext();
        var p = $(ctx.morphNode).position();
        return pt(p.left, p.top);
    },
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
        var w = $(ctx.morphNode).outerWidth();
        var h = $(ctx.morphNode).outerHeight();
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