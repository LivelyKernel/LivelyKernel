module('lively.morphic.HTMLExperiments').requires('lively.morphic.HTML').toRun(function() {

cop.create('lively.morphic.HTMLTableRowPositionFix').refineClass(lively.morphic.Morph, {
getPosition: function() {
    var ctx = this.renderContext();
    var pos = $(ctx.shapeNode).position();
    console.log('Position with RowFix: '+pos.left+'   '+pos.top);
    return pt(pos.left, pos.top);
}
});

cop.create('lively.morphic.HTMLTableCellPositionFix').refineClass(lively.morphic.Morph, {
getPosition: function() {
    var ctx = this.renderContext();
    var pos = $(ctx.shapeNode).offset();
    return pt(pos.left, pos.top);
}
});

cop.create('lively.morphic.RelativeLayer').refineClass(lively.morphic.Morph, {
    adjustOrigin: function() {},
    
    triggerEventHTML: function(ctx, evt) {
        return ctx.shapeNode ? ctx.shapeNode.dispatchEvent(evt) : null;
    },
    
    appendHTML: function(ctx, optMorphAfter) {
        if (!ctx.morphNode) throw dbgOn(new Error('no ctx.morphNode!'));
        console.log("Adding a relative morph!");
        var parentNode = false;//ctx.morphNode.parentNode;
        if (!parentNode) {
            var ownerCtx = this.owner && this.owner.renderContext();
            parentNode = (ownerCtx && ownerCtx.shapeNode) || ctx.parentNode;
            
            if (this.owner.getShape().constructor.name === "HTMLShape") {
                this.getShape().renderUsing(ctx);                 
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
                this.getShape().renderUsing(ctx);
            }
        }

        
    },
    remove: function() {
        this.suspendSteppingAll();
        if (this.showsHalos) this.removeHalos();
        this.renderContextDispatch('remove');
        this.removeWithLayer(lively.morphic.RelativeLayer);
    },
    removeHTML: function(ctx) {
        this.owner && this.owner.removeMorph(this);
        ctx.removeNode(ctx.shapeNode);
    },
getBounds: function() {
    var p = this.getPosition();
    var e = this.getExtent();
    return new Rectangle(p.x, p.y, e.x, e.y);
},

getPosition: function() {
    var ctx = this.renderContext();
    var ownerPos = (this.owner && this.owner.getPosition()) || pt(0,0);
    var o = (ctx.shapeNode && $(ctx.shapeNode).offset()) || pt(0,0);
    console.log("RelativeLayer getPosition() says: "+pt(o.left, o.top).subPt(ownerPos));
    return pt(o.left, o.top).subPt(ownerPos);
},

getRotation: function() {
    return 0;
},
getScale: function() {
    return 1;
},
/*
setExtent: function(value) {
    this.extentOverride = value;
    return cop.proceed(value);
},
*/
setPositionHTML: function(ctx) {},

setRotationHTML: function(ctx) {},

setScaleHTML: function(ctx) {},

   
    
 }
);

lively.morphic.Morph.subclass('lively.morphic.HTMLMorph',
'settings', {
    tagName: 'div',
    isRelative: true
},
'HTML render settings', {
    htmlDispatchTable: {
        setContent: 'setContentHTML',
        setAttribute: 'setAttributeHTML',
        getAttribute: 'getAttributeHTML',
        setProp: 'setPropHTML',
        getProp: 'getPropHTML',
     },
},
'initializing', {
    initialize: function($super, tagName, optBounds) {
            if (tagName) this.tagName = tagName;
            $super(new lively.morphic.Shapes.HTMLShape(this.tagName, optBounds));
    },
    appendHTML: function($super, ctx) {
        $super(ctx);
        if (this.content) this.setContentHTML(ctx, this.content);
        if (this.attributes) for (var x in this.attributes) {
            this.setAttribute(x, this.attributes[x]);    
        }
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
        if (ctx.contentNode) $(ctx.contentNode).remove();
            ctx.contentNode = document.createTextNode(content);
            ctx.shapeNode.appendChild(ctx.contentNode);
    },
    getContent: function(){
        return this.content || "";    
    },
    getBounds: function() {
        return this.getPosition().extent(this.getExtent());
    },
    addMorph: function($super, morph, optMorphBefore) {

         if (morph.isAncestorOf(this)) {
            alert('addMorph: Circular relationships between morphs not allowed');
            alert('tried to drop ' + morph + ' on ' + this);
            return;
        }

        if (morph.owner) {
            var tfm = morph.transformForNewOwner(this);
            morph.remove();
        }
        
        // enable Relative Layout Layer (between removing and adding)
        morph.addWithLayer(lively.morphic.RelativeLayer);
        
        
        if (morph.owner !== this) morph.owner = this;

        var indexToInsert = optMorphBefore && this.submorphs.indexOf(optMorphBefore);
        if (indexToInsert === undefined || indexToInsert < 0)
            indexToInsert = this.submorphs.length;
        this.submorphs.pushAt(morph, indexToInsert);

        // actually this should be done below so that geometry connects works correctly
        // but for the current Chrome stable (12.0.7) this leads to a render bug (morph is offseted)
        if (tfm) {
            morph.setTransform(tfm);
        }

        var parentRenderCtxt = this.renderContext(),
            subRenderCtxt = morph.renderContext(),
            ctx = parentRenderCtxt.constructor !== subRenderCtxt.constructor ?
                parentRenderCtxt.newForChild() : subRenderCtxt;
        morph.renderAfterUsing(ctx, optMorphBefore);

        morph.resumeSteppingAll();

        if (this.getLayouter()) {
            this.getLayouter().onSubmorphAdded(this, morph, this.submorphs);
        }
        if (morph.owner.owner) { // Is owner owner a stack?
            if (morph.owner.owner.pageArray) {
                morph.pageSpecific = true; // dropped morph is only on this page
                    // call Stack.beInBackground to place in background
            }
        }
        return morph

    },
    
    getAttribute: function(attribute) {
        this.renderContextDispatch('getAttribute', attribute);  
    },
    getAttributeHTML: function(ctx, attribute) {
        return $(ctx.shapeNode).attr(attribute);
    },    
    setAttribute: function(attribute, value) {
        if (!this.attributes) this.attributes = [];
        this.attributes.push({attr: attribute, val: value}); // FIXME! Need a key value list here
        this.renderContextDispatch('setAttribute', {attr: attribute, val: value});  
    },
    setAttributeHTML: function(ctx, attrVal) {
    
        if (attrVal.val) $(ctx.shapeNode).attr(attrVal.attr, attrVal.val);
        else ctx.shapeNode.removeAttribute(attrVal.attr);
    },
    
    
    getProp: function(prop) {
        return this.renderContextDispatch('getProp', prop);  
    },
    getPropHTML: function(ctx, prop) {
        return $(ctx.shapeNode).prop(prop);
    },    
    setProp: function(prop, value) {
        if (!this.prop) this.props= [];
        this.props.push({prop: prop, val: value}); // FIXME! Need a key value list here
        this.renderContextDispatch('setProp', {prop: prop, val: value});  
    },
    setPropHTML: function(ctx, propVal) {
        $(ctx.shapeNode).prop(propVal.prop, propVal.val);
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
    },
    addEventHandler: function() {
        if (this.eventHandler) throw new Error('Morph ' + this + ' already has an event handler!');
        var handler = new lively.morphic.ShapeEventHandler(this);
        this.eventHandler = handler;
        return handler;
    },
    


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
    /*var ownerPos = this.owner.getPosition();
    var o = $(ctx.morphNode).offset();
    return pt(o.left, o.top).subPt(ownerPos);*/
    var o = $(ctx.morphNode).position();
    return pt(o.left, o.top);

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
        if (this.extentOverride) {
            ctx.domInterface.setExtent(ctx.shapeNode, this.extentOverride);
        }
        this.getNodeClass() && this.setNodeClassHTML(ctx, this.getNodeClass());
        if (this.getNodeId()) {
            this.setNodeIdHTML(ctx, this.getNodeId());
            this.getStyleSheet && this.setStyleSheetHTML(ctx, this.getStyleSheet());
        }
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
            return pt(0,0);
    },
    setPositionHTML: function(ctx, value) {
        if (!ctx.shapeNode) return undefined;
        ctx.domInterface.setPosition(ctx.shapeNode, value);
    },
    setExtentHTML: function(ctx, value) {
        if (!ctx.shapeNode) return undefined;
        var newExtent = value;
        
        var n = ctx.shapeNode.nodeName;
        
        if (n != "button" && n != "input" && n != "textarea") { 
        // some nodetypes adhere to the standard box model, some don't ...
            var outer = this.getExtent();
            var inner = pt($(ctx.shapeNode).width(), $(ctx.shapeNode).height());
            var delta = outer.subPt(inner);
            newExtent = newExtent.subPt(delta);
        }
        ctx.domInterface.setExtent(ctx.shapeNode, newExtent);
        this.extentOverride = newExtent;
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

lively.morphic.EventHandler.subclass('lively.morphic.ShapeEventHandler',
    '.', {
    registerHTMLAndSVG: function(eventSpec) {
        var handler = this;
        eventSpec.node = eventSpec.node || this.morph.renderContext().shapeNode;
        if (!eventSpec.node) {
            throw new Error('Cannot register Event handler because cannot find '
                            + 'HTML/SVG morphNode');
        }
        eventSpec.doNotSerialize = ['node'];
        // bind is too expensive here
        eventSpec.handlerFunc = function(evt) { handler.handleEvent(evt); };
        eventSpec.unregisterMethodName = 'unregisterHTMLAndSVGAndCANVAS';
        eventSpec.node.addEventListener(
            eventSpec.type, eventSpec.handlerFunc, eventSpec.handleOnCapture);
        this.register(eventSpec);
    },
});


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