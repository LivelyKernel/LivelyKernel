module('lively.morphic.SAPUI5').requires('lively.morphic.HTMLExperiments').toRun(function() {


lively.morphic.HTMLMorph.subclass('lively.morphic.SAPUI5.Control',
'',{
    
setExtent: function($super, extent) {
    if (this.fixedHeight) {
        $super(extent.withY(-1));
    }
    else {
        $super(extent);    
    }    
        
}    
    
}
);

lively.morphic.HTMLMorph.subclass('lively.morphic.SAPUI5.TableRow',
'',{
    
}
);

lively.morphic.HTMLMorph.subclass('lively.morphic.SAPUI5.TableCell',
'placeholder',{
    
    defaultPlaceholderHeight: 22,
    defaultPlaceholderWidth: 60,
    
    htmlDispatchTable: {
        addPlaceholder: 'addPlaceholderHTML',
        removePlaceholder: 'removePlaceholderHTML',
     },
     initialize: function($super) {
            $super('td');
         
     },
     appendHTML: function($super, ctx) {
         $super(ctx);
            this.addPlaceholder();
     },
    addPlaceholder: function(width, height){
        if (this.submorphs.length ==0) {
            var size = pt (width || this.defaultPlaceholderWidth, height|| this.defaultPlaceholderHeight);
            this.renderContextDispatch('addPlaceholder', size);        
        }
    },
    addPlaceholderHTML: function(ctx, size){
        if (!ctx.placeholderNode) ctx.placeholderNode = XHTMLNS.create('div');
        //$(ctx.placeholderNode).width(size.x);
        //$(ctx.placeholderNode).height(size.y);
        $(ctx.placeholderNode).attr('style', 'width: '+size.x+'px; height: '+size.y+'px; background-color: gray;');
        if (!ctx.placeholderNode.parentNode) ctx.shapeNode.appendChild(ctx.placeholderNode);
    }, 
    removePlaceholder: function(){
        this.renderContextDispatch('removePlaceholder');        
    },
    removePlaceholderHTML: function(ctx){
        console.log('remove placeholder!');
        if (ctx.placeholderNode && ctx.placeholderNode.parentNode) {
                console.log('placeholder will be removed!');
                $(ctx.placeholderNode).remove();
            }
    },
    
    removeRow: function() {
        this.owner.remove();    
    },
     
    addMorph: function($super, morph) {
        this.removePlaceholder();
        return $super(morph);    
    },
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'Remove Placeholder', function(evt) {
            self.removePlaceholder()
        }]);
         items.push([
            'Remove row', function(evt) {
            self.removeRow()
        }]);
        return items;
    },
        
}
);

lively.morphic.SAPUI5.Control.subclass('lively.morphic.SAPUI5.Button',

'settings',{
    classes: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnStd',    
    activeClasses: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnAct',
    disabledClasses: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnDsbl',
    label: "Button",
    tagName: 'button',
    fixedHeight: true
},

'initializing', {
    initialize: function($super, optLabel, optBounds) {
        $super(this.tagName, optBounds);
        if (optLabel) this.setLabel(optLabel);
        this.value = false;
        this.toggle = false;
        this.isActive = true;
    }
},
'accessing', {
    setActive: function(active) {
        this.isActive = active;
        if (active) this.pressed = false;
        this.changeAppearanceFor(false);
    },
    setLabel: function(label) {
        this.setContent(label);    
    },
    getLabel: function(){
        this.getContent();    
    }
    
},
'event handling', {
    changeAppearanceFor: function(pressed) {
        if (pressed) {
            this.setNodeClass(this.activeClasses);
        } else {
            this.setNodeClass(this.isActive?this.classes:this.disabledClasses);
        }
  
    },

    onMouseOut: function (evt) {
        this.isPressed && this.changeAppearanceFor(false);
    },

    onMouseOver: function (evt) {
        if (evt.isLeftMouseButtonDown()) {
            this.isPressed && this.changeAppearanceFor(true);
        } else {
            this.isPressed = false;
        }
    },

    onMouseDown: function (evt) {
        if (this.isValidClick (evt)) {
                this.isPressed = true;
                this.changeAppearanceFor(true);
        }
        return false;
    },

    onMouseUp: function(evt) {
        if (this.isValidClick (evt) && this.isPressed) {
            var newValue = this.toggle ? !this.value : false;
            this.setValue(newValue);
            this.changeAppearanceFor(false);
            this.isPressed = false;
        }
        return false;
    },
    isValidClick: function(evt) {
        return this.isActive && evt.isLeftMouseButtonDown() && !evt.isCommandKey();
    },
    setValue: function(bool) {
        this.value = bool;
        // buttons should fire on mouse up
        if (!bool || this.toggle) lively.bindings.signal(this, 'fire', bool);
    },

}
);
lively.morphic.SAPUI5.Control.subclass('lively.morphic.SAPUI5.TextField',

'settings',{
    baseClasses: 'sapUiTf sapUiTfBrd',
    normalClass: 'sapUiTfStd',
    readOnlyClass: 'sapUiTfRo',
    focusClass: 'sapUiTfFoc',
    disabledClass: 'sapUiTfDsbl',
    warningClass: 'sapUiTfWarn',
    errorClass: 'sapUiTfErr', 
    successClass: 'sapUiTfSucc',
    defaultValue: "",
    fixedHeight: true,
    tagName: 'input'
},
'HTML render settings', {
    htmlDispatchTable: {
        getValue: 'getValueHTML',        
        setValue: 'setValueHTML',        
        setMaxLength: 'setMaxLengthHTML',
        getMaxLength: 'getMaxLengthHTML',
        updateAppearance: 'updateAppearanceHTML'
    },
},
'initializing', {
    initialize: function($super, bounds, optValue) {
        $super(this.tagName, bounds);
        this.hasFocus = false;
        this.active = true;
        this.value = optValue || this.defaultValue;
    }
},

'rendering', {
    initHTML: function($super, ctx) {
        $super(ctx);
        if (this.shape) this.setValueHTML(ctx, (this.value || this.defaultValue));
    },

    getValueHTML: function(ctx) {
        if (ctx.shapeNode) return ctx.shapeNode.value;
        else return "";  
    },
    setValueHTML: function(ctx, value) {
        if (ctx.shapeNode) ctx.shapeNode.value = value;
    },
    getMaxLengthHTML: function(ctx) {
        if (ctx.shapeNode) {
            var m = ctx.shapeNode.getAttribute('maxlength');
            if (m && m !="") return m;
        }
        return null;  
    },
    setMaxLengthHTML: function(ctx, value) {
        if (ctx.shapeNode) {
            if (value) ctx.shapeNode.maxLength = value;
            else ctx.shapeNode.removeAttribute('maxlength');
        }
    },
    updateAppearanceHTML: function(ctx) {
        var classNames = this.baseClasses;
        
        if (!this.active){
            ctx.shapeNode.disabled = true;
            classNames+=' '+this.disabledClass;
        } else {
            classNames+=' '+this.normalClass;
            ctx.shapeNode.disabled = false;            
        }
        
        if (this.warning) {
            classNames+=' '+this.warningClass;
        }
        if (this.error) {
            classNames+=' '+this.errorClass;
        }    
        if (this.success) {
            classNames+=' '+this.successClass;
        } 
        
        if (this.readOnly) {
            ctx.shapeNode.readOnly= true;  
            classNames+=' '+this.readOnlyClass;  
        } else {
            ctx.shapeNode.readOnly=false;        
        }    
        
        if (this.hasFocus ) {
            classNames+=' '+this.focusClass;
        }
        this.setNodeClass(classNames ); 
        
    }
    
},

'accessing', {
    setFixedHeight: function(f) {
        this.fixedHeight = f;
        this.resizeComponent();
    },
    getValue: function() {
        return this.renderContextDispatch('getValue');
    },
    setValue: function(value) {
        return this.renderContextDispatch('setValue', value);
    },
    clearState: function(){
        this.warning = false;
        this.error = false;
        this.success = false;    
    },
    setReadOnly: function(value) {
        this.readOnly = value;
        this.updateAppearance();
    },
    setWarning: function(value) {
        this.clearState();
        this.warning= value;
        this.updateAppearance();
    },
    setError: function(value) {
        this.clearState();
        this.error= value;
        this.updateAppearance();
    },
    setSuccess: function(value) {
        this.clearState();
        this.success= value;
        this.updateAppearance();
    },
    
    getMaxLength: function() {
        return this.renderContextDispatch('getMaxLength');
    },
    setMaxLength: function(value) {
        return this.renderContextDispatch('setMaxLength', value);
    },
    setActive: function(active) {
        this.active = active;
        if (!active) this.focus= false;
        this.updateAppearance();
    },

    
},
'event handling', {
   
    onFocus: function($super, evt) {
        this.hasFocus = true;
        this.updateAppearance();
        $super(evt);
    },
    onBlur: function($super, evt) {
        this.hasFocus = false;
        this.updateAppearance();
        $super(evt);        
    },
    
    updateAppearance: function() {
        return this.renderContextDispatch('updateAppearance');
    },
 

}
);

lively.morphic.SAPUI5.TextField.subclass('lively.morphic.SAPUI5.TextArea',
'settings',{
    baseClasses: 'sapUiTf sapUiTfBack sapUiTfBrd sapUiTxtA',
    fixedHeight: false,
    tagName: 'textarea'
}
);

lively.morphic.SAPUI5.Control.subclass('lively.morphic.SAPUI5.Label',

'settings',{
    baseClass: 'sapUiLbl sapUiLblNowrap',    
    boldClass: 'sapUiLblEmph',
    requiredClass: 'sapUiLblReq',
    label: "Label",
    fixedHeight: true
},
'initializing', {
    initialize: function($super, optLabel) {
        $super('label');
        if (optLabel) this.setContent(optLabel);
        this.bold = false;
        this.required = false;        
        if (this.htmlFor) this.setFor(this.htmlFor);
        this.updateAppearance();
    }
},

'accessing', {
    updateAppearance: function() {
        var classNames = this.baseClass;
        if (this.bold){
            classNames+=' '+this.boldClass;
        }
        if(this.required) {
            classNames+=' '+this.requiredClass;
        }
        this.setNodeClass(classNames);              
    },
    setBold: function(b) {
        this.bold = b;
        this.changeAppearance();        
    },
    setRequired: function(b) {
        this.required = b;
        this.changeAppearance();        
    },
    
    setFor: function(morph) {
        if (morph && morph.getNodeId){
            var id = (morph.targetNodeId && morph.targetNodeId()) || morph.getNodeId();
            this.htmlFor = id;
            return this.setAttribute('for', id);
        }
    },

/*    
    setFixedHeight: function(f) {
        this.fixedHeight = f;
        this.resizeComponent();
    },
*/

    
}
);


lively.morphic.SAPUI5.Control.subclass('lively.morphic.SAPUI5.CheckBox',

'settings',{
    baseClass:'sapUiCb',
    activeClass: 'sapUiCbInteractive sapUiCbStd', 
    checkedClass: 'sapUiCbChk',
    disabledClass: 'sapUiCbDis',
    readOnlyClass: 'sapUiCbRo',
    label: "Checkbox"
},
'initializing', {
    initialize: function($super, label, optBounds) {
        $super("span", optBounds);
        this.checkBoxMorph = this.addMorph(new lively.morphic.HTMLMorph('input'));
        this.checkBoxMorph.setAttribute('type', 'checkbox');
        //this.checkBoxMorph.setAttribute('id', checkboxId);    
        this.setupSubmorph(this.checkBoxMorph);
        this.labelMorph = this.addMorph(new lively.morphic.HTMLMorph('label')); 

        this.setupSubmorph(this.labelMorph);
        if (label) this.setLabel(label);
        this.readOnly = false;
        this.checked = false;
        this.active = true;
        this.updateAppearance();
    },
    appendHTML : function($super, ctx) {
        $super(ctx);
        this.labelMorph.setAttribute('for', this.checkBoxMorph.getNodeId());    
    },
    
    setupSubmorph: function(morph) {
        morph.disableGrabbing();
        morph.disableDragging();
        morph.disableEvents();        
        morph.disableHalos();        
    
        return morph;    
    }
    
},

'accessing', {
    setLabel: function(label) {
        this.labelMorph.setContent(label);    
    },
    getLabel: function() {
        return this.labelMorph.getContent();        
    },
    setContent: function(label) {
        this.setLabel(label);    
    },
    getContent: function() {
       return this.getLabel();         
    },
    
    setChecked: function(checked){ 
        this.checkBoxMorph.setProp("checked", checked);
        this.updateAppearance();
    },
    isChecked: function(){
        return this.checkBoxMorph.getProp("checked");
    },
    
    setActive: function(active) {
        this.active = active;
        this.updateAppearance();
    },
    setReadOnly: function(readOnly ) {
        this.readOnly = readOnly ;
        this.updateAppearance();
    },
    updateInputTag: function(idx) {
        this.checkBoxMorph.setProp("disabled", (this.active)?null:"disabled");
        this.checkBoxMorph.setProp("readonly", (this.readOnly)?"readOnly":null);
    },
    targetNodeId: function(){
        return this.checkBoxMorph.getNodeId();    
    }
    
},
'event handling', {
    updateAppearance: function() {

        var classNames = this.baseClass;
        
        if (this.isChecked()) { classNames+=' '+this.checkedClass}
        if (this.readOnly) {classNames+=' '+this.readOnlyClass}
            else if (this.active) {classNames+=' '+this.activeClass}
            else {classNames+=' '+this.disabledClass}
        this.setNodeClass(classNames);
        this.updateInputTag();
        this.checked = this.isChecked();
    },

    onChange: function(evt){
           if (this.active && !this.readOnly) {
                lively.bindings.signal(this, 'fire', true);
            } 
            this.updateAppearance();
    },

    onClick: function(evt) {
         if (!this.active || this.readOnly) evt.stop();
  
    },

}
);


lively.morphic.SAPUI5.Control.subclass('lively.morphic.SAPUI5.MatrixLayout',
'settings', {
   classes: 'sapUiMlt',
   cellClasses: 'sapUiMltCell sapUiMltPadRight',
   cols: 2,
   rows: 3
},
'initializing', {
    initialize: function($super, cols, rows) {
        $super('table');
        if (cols) this.cols = cols;
        if (rows) this.rows = rows;
        
                
        this.colgroupMorph = this.addMorph(new lively.morphic.HTMLMorph('colgroup'));
        
        for (var i = 0; i < this.cols; i++) {
           this.colgroupMorph.addMorph(new lively.morphic.HTMLMorph('col'));    
        }
        
        this.tbodyMorph = this.addMorph(new lively.morphic.HTMLMorph('tbody'));
        this.tbodyMorph.setAttribute('style', 'width: 100%; height: 100%;');
        for (var r = 0; r < this.rows; r++) {
            
            var row = new lively.morphic.SAPUI5.TableRow('tr');
            this.tbodyMorph.addMorph(row);
            
            for (var c = 0; c < this.cols; c++) {
                var cell = new lively.morphic.SAPUI5.TableCell();
                cell.addPlaceholder(80, 30);
                cell.setNodeClass(this.cellClasses);
                row.addMorph(cell);
                
            }
            
        }
        
        this.setNodeClass(this.classes);
        
    },
    addPlaceholders: function(size) {
        var placeholderSize = size || pt(60, 24);
        this.tbodyMorph.submorphs.each(function(tr){
            tr.submorphs.each(function(td){
                td.addPlaceholder(placeholderSize.x, placeholderSize.y);
            });
        });
    },
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'Add placeholders', function(evt) {
            self.addPlaceholders()
        }]);
     
        return items;
    },
}

);

lively.morphic.SAPUI5.Control.subclass('lively.morphic.SAPUI5.Slider',
'settings',{
    normalClasses: 'sapUiSli sapUiSliStd',    
    readOnlyClasses: 'sapUiSli sapUiSliRo',
    fixedHeight: true,
    minValue: 0,
    maxValue: 100,
    tickCount: 0,
    tickPxCorrection: -1,
    gripPxCorrection: -5,
    hasLabels: true,
    value: 0
},
'HTML render settings', {
    htmlDispatchTable: {
        generateTicks: 'generateTicksHTML',
        updateTicks: 'updateTicksHTML' ,    
        getSliderWidth: 'getSliderWidthHTML',
        setSliderPos: 'setSliderPosHTML'         
    },
},
'initializing', {
    initialize: function($super, width) {
        $super('div');
        
        this.readOnly = false;
        this.disableGrabbing();
        
        this.sliderRight = this.addMorph(this.createNodeWithClass('sapUiSliR'));
        this.sliderLeft = this.sliderRight.addMorph(this.createNodeWithClass('sapUiSliL'));
        this.sliderBar = this.sliderLeft.addMorph(this.createNodeWithClass('sapUiSliBar'));                
        this.sliderHilite = this.sliderBar.addMorph(this.createNodeWithClass('sapUiSliHiLi')); 
        this.sliderGrip = this.sliderBar.addMorph(new lively.morphic.SAPUI5.SliderGrip(this));

        this.setExtent(pt(width,0));
        //this.setSliderPos(this.val2pos(this.value));
        this.ticks = [];
        this.labels = [];        

        this.generateTicks();

        this.updateAppearance();

    },
    createNodeWithClass: function(className){
        var r = new lively.morphic.HTMLMorph();
        r.setNodeClass(className);
        return r;
    }
    
},

'rendering', {
    setExtent: function($super, extent) {
        $super(extent);
        this.setSliderPos(this.val2pos(this.value));
        this.updateTicks();    
    },
    generateTicks: function(){
        this.ticks.each(function(n){n.remove();});
        this.labels.each(function(n){n.remove();});
        this.ticks = [];
        this.labels = [];
        
        var range = this.maxValue - this.minValue;
        for (var i = 0; i < this.tickCount; i++) {
            this.ticks[i] = this.sliderBar.addMorph(this.createNodeWithClass('sapUiSliTick'));
            if  (this.hasLabels) {

                ctx.labels[i] = XHTMLNS.create('div');
                var labelClass = 'sapUiSliText';
                if (i == 0) { 
                    labelClass +=' sapUiSliTextLeft';
                }
                else if (i == this.tickCount-1) {
                    labelClass +=' sapUiSliTextRight';
                }
               

                var value = range/(this.tickCount-1);
                value *= i;
                value += this.minValue;

               this.labels[i] = this.createNodeWithClass(labelClass);
                this.labels[i],setContent(value);
                this.sliderBar.addMorph(this.labels[i]);
                
                // TODO: set position of the labels to the left so they are in the middle
                
            }
        }

        
        this.sliderHilite.bringToFront()
        this.sliderGrip.bringToFront()
        
        this.updateTicks();
        
        
    },
    
    updateTicks: function(){
        var c = this.ticks.length;
        if (this.tickCount != c || (this.hasLabels && this.labels.length != c)) {
            throw new Error("Slider: Tick count is not synchronized!");
        }
        var w = this.getSliderWidth();
        for (var i = 0; i < c; i++){
             var s = w / (c-1);
             var pos = s * i;
             this.ticks[i].setPosition(this.ticks[i].getPosition().withX(pos+this.tickPxCorrection));
             if (i > 0 && i < c-1) {
                 var o = this.labels[i].pxCorrection || 0;
                this.labels[i].setPosition(this.labels[i].getPosition().withX(pos+o));
             }
        }
    },
       
    getSliderWidth: function(){
       return this.sliderBar.getExtent().x;
    },
    updateComputedStyles: function($super) {
        this.generateTicks();
        this.setValue(this.getValue());
        $super();    
    }
    
    
},
'internal calculations',{
    
    pos2val: function(pos){
        var w = this.getSliderWidth();
        var range = this.maxValue - this.minValue;
        var s = range / w ;
        s *= pos;
        s += this.minValue;
        return s;
    },
    val2pos: function(val) {
        var w = this.getSliderWidth();
        var range = this.maxValue - this.minValue;
        var s = w/ range;
        s *= (val - this.minValue);
        return s;
    }    
},

'accessing',{
    setTickCount: function(tickCount){
        this.tickCount = (tickCount<2) ? 0 : tickCount; // either no ticks or more than one
        this.generateTicks();
    },
    setValueRange: function(min, max) {
        if (min && max && (min < max)) {
            this.minValue = min;
            this.maxValue = max;
        } else {throw new Error("Please assign both min and max of the slider.")}
    },
    setValue: function(value) {
        this.value = value;
        this.setSliderPos(this.val2pos(this.value));
    },
    getValue: function() {
        return this.value;
    },
    setSliderPos: function(px) {
        var newPos = px;
        var maxPos = this.getSliderWidth();
        if (newPos > maxPos) newPos = maxPos;
        if (newPos < 0) newPos = 0;
        this.sliderPos = newPos;
        this.sliderGrip.setLeft(this.sliderPos);
        this.sliderHilite.setWidth(this.sliderPos);
    },
    getSliderPos: function(){
        return this.sliderPos;
    }
},
'events',{
    updateAppearance: function(){
        if (this.readOnly) this.setComponentNodeClass(this.readOnlyClasses);
        else this.setComponentNodeClass(this.normalClasses);
    },
    

}
);

lively.morphic.HTMLMorph.subclass('lively.morphic.SAPUI5.SliderGrip',
'',{
    
    initialize: function($super, slider) {
        $super();
        this.slider = slider;
        this.setNodeClass('sapUiSliGrip');
    },
    
    onMouseDown: function($super, evt) {
            var slider = this.slider;
            slider.startCoords = {
                sliderX: slider.getSliderPos(),
                mouseX: evt.screenX    
            };
            $(document).mousemove(function (evt) {

                if (slider.startCoords) { // drag

                    var s = slider.startCoords.sliderX;
                    var dx = evt.screenX - slider.startCoords.mouseX;
                    slider.setSliderPos(s + dx);
                    slider.value = slider.pos2val(slider.getSliderPos());
                }
            }).mouseup(function () {
                slider.startCoords = null;
                $(document).unbind("mousemove mouseup");
            });
        return true;
    },
    
}
);


}) // end of module
