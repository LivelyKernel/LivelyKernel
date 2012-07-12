module('lively.morphic.SAPUI5').requires('lively.morphic.HTMLExperiments').toRun(function() {


lively.morphic.HTMLMorph.subclass('lively.morphic.SAPUI5.Control',
'',{}
);

lively.morphic.HTMLMorph.subclass('lively.morphic.SAPUI5.MatrixLayout.TableCell',
'placeholder',{
    htmlDispatchTable: {
        addPlaceholder: 'addPlaceholderHTML',
        removePlaceholder: 'removePlaceholderHTML',
     },
    addPlaceholder: function(width, height){
        this.renderContextDispatch('addPlaceholder', pt(width, height));        
    },
    addPlaceholderHTML: function(ctx, size){
        if (!ctx.placeholderNode) ctx.placeholderNode = XHTMLNS.create('div');
        $(ctx.placeholderNode).width(size.x);
        $(ctx.placeholderNode).height(size.y);
        if (!ctx.placeholderNode.parentNode) ctx.shapeNode.appendChild(ctx.placeholderNode);
    }, 
    removePlaceholder: function(){
        this.renderContextDispatch('removePlaceholder');        
    },
    removePlaceholderHTML: function(ctx){
        if (ctx.placeholderNode && ctx.placeholderNode.parent) 
            $(ctx.placeholderNode).remove()
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
    initialize: function($super, bounds, optLabel) {
        $super(bounds, this.tagName);
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
        $super(bounds, this.tagName);
        this.hasFocus = false;
        this.active = true;
        this.value = optValue || this.defaultValue();
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


lively.morphic.SAPUI5.Control.subclass('lively.morphic.SAPUI5.CheckBox',

'settings',{
    baseClass:'sapUiCb',
    activeClass: 'sapUiCbInteractive sapUiCbStd', 
    checkedClass: 'sapUiCbChk',
    disabledClass: 'sapUiCbDis',
    readOnlyClass: 'sapUiCbRo',
    label: "Checkbox"
},
'HTML render settings', {
    htmlDispatchTable: {
        updateInputTag: 'updateInputTagHTML',
        isChecked: 'isCheckedHTML',
        setChecked: 'setCheckedHTML'
    },
},
'initializing', {
    initialize: function($super, label, optBounds) {
        $super("span", optBounds);
        var checkboxId = 'checkbox-'+this.id;
        this.checkBoxMorph = this.addMorph(new lively.morphic.HTMLMorph('input'));
        this.checkBoxMorph.setAttribute('type', 'checkbox');
        this.checkBoxMorph.setAttribute('id', checkboxId);    
        this.checkBoxMorph.disableGrabbing();
        
        this.labelMorph = this.addMorph(new lively.morphic.HTMLMorph('label')); 
        this.labelMorph.setAttribute('for', checkboxId);
        this.labelMorph.disableGrabbing();
        this.labelMorph.showHalos = this.showHalos;
        
        if (label) this.setLabel(label);
        this.readOnly = false;
        this.checked = false;
        this.active = true;
        this.updateAppearance();
    }
},

'accessing', {
    setLabel: function(label) {
        this.labelMorph.setContent(label);    
    },
    getLabel: function() {
        this.labelMorph.getContent();        
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
        this.tbodyMorph.setAttribute('style', 'width: 100%; height: 100%');
        for (var r = 0; r < this.rows; r++) {
            var row = new lively.morphic.HTMLMorph('tr');
            this.tbodyMorph.addMorph(row);
            for (var c = 0; c < this.cols; c++) {
                var cell = new lively.morphic.HTMLMorph('td');
                cell.setNodeClass(this.cellClasses);
                row.addMorph(cell);
            }
            
        }
        
        this.setNodeClass(this.classes);
        
    },

}

);



}) // end of module
