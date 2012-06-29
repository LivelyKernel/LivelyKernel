module('lively.morphic.SAPUI5').requires('lively.morphic.HTML').toRun(function() {

lively.morphic.Box.subclass('lively.morphic.SAPUI5.Component',
'rendering', {
    htmlDispatchTable: {
        resizeComponent: 'resizeComponentHTML',
        getComponentExtent: 'getComponentExtentHTML',
        setComponentNodeClass:'setComponentNodeClassHTML',
        getComponentNodeId: 'getComponentNodeIdHTML',
        setComponentNodeId: 'setComponentNodeIdHTML'
    },
    
    resizeComponentHTML: function(ctx) {
        var borderWidth = this.getBorderWidth(),
            extent = this.getExtent().subPt(pt(2*borderWidth, 2*borderWidth)),
            componentNode= ctx.componentNode;
        componentNode.style.left = this.shape.getPosition().x /*+ this.padding.left()*/ + 'px';
        componentNode.style.top = this.shape.getPosition().y /*+ this.padding.top()*/ + 'px';
        componentNode.style.width = extent.x /*- this.padding.right() - this.padding.left())*/ + 'px';
        if (!this.fixedHeight) componentNode.style.height = extent.y /*- this.padding.bottom() - this.padding.top()*/ + 'px';
    },
    setExtent: function($super, extent) {
        $super(extent);
        this.resizeComponent();
    },
    getComponentExtent: function() { return this.renderContextDispatch('getComponentExtent') },
    getComponentExtentHTML: function(ctx) {
        return ctx.componentNode.scrollHeight != 0 ? pt(ctx.componentNode.scrollWidth, ctx.componentNode.scrollHeight) : this.getExtent()
    },
    getComponentNodeId: function() {
        return this.renderContextDispatch('getComponentNodeId');
    },
    getComponentNodeIdHTML: function(ctx) {
        return ctx.componentNode.id;
    },
    setComponentNodeId: function() {
        return this.renderContextDispatch('setComponentNodeId');
    },
    setComponentNodeIdHTML: function(ctx) {
        ctx.componentNode.id = 'component-'+this.id;
    },
    resizeComponent: function(idx) {
        return this.renderContextDispatch('resizeComponent');
    },
    
    setComponentNodeClassHTML: function(ctx, className) {
        ctx.componentNode.className = className;
    },
    setComponentNodeClass: function(className) {
        this.renderContextDispatch('setComponentNodeClass', className);     
    },
    appendHTML: function($super, ctx, optMorphAfter) {
        $super(ctx, optMorphAfter);
        ctx.shapeNode.appendChild(ctx.componentNode);
        this.resizeComponentHTML(ctx);
    },
    setClipModeHTML: function(ctx, clipMode) {
        // FIXME duplication wiht super, delay logic
        // can be extracted
        if (!ctx.wrapperNode|| this.delayedClipMode) {
            this.delayedClipMode = clipMode;
            return;
        }
        this.setClipModeHTMLForNode(ctx, ctx.componentNode, clipMode);
    },
    
    
}
);

lively.morphic.SAPUI5.Component.subclass('lively.morphic.SAPUI5.LabelComponent',
'HTML', {
    htmlDispatchTable: {
        updateLabel: 'updateLabelHTML',
    },
    updateLabel: function(label) {
        if (label) this.label = label;
        this.renderContextDispatch('updateLabel', label);
    },
    updateLabelHTML: function(ctx, label) {
        ctx.componentNode.innerHTML = label;
    },
    setLabel: function(label) {
        this.updateLabel(label);
    },
    getLabel: function() {
        return this.label;    
    },
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'Set label', function(evt) {
            $world.prompt('Set label', function(input) {
                if (input !== null)
                    self.setLabel(input || '');
            }, self.getLabel());
        }])
        return items;
    },
}
);


lively.morphic.SAPUI5.LabelComponent.subclass('lively.morphic.SAPUI5.Button',

'settings',{
    classes: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnStd',    
    activeClasses: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnAct',
    disabledClasses: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnDsbl',
    label: "Button",
    fixedHeight: true
},

'initializing', {
    initialize: function($super, bounds, optLabel) {
        $super(bounds);
        if (optLabel) this.setLabel(optLabel);
        this.value = false;
        this.toggle = false;
        this.isActive = true;
        
    }
},

'rendering', {
    initHTML: function($super, ctx) {
        if (!ctx.componentNode)
            ctx.componentNode= this.createButtonNodeHTML();
        this.setComponentNodeClass(this.isActive?this.classes:this.disabledClasses);
         this.setComponentNodeId();        
        $super(ctx);
        if (this.shape) this.updateLabel(this.label || "Button")
    },


},

'node creation', {
    createButtonNodeHTML: function() {
        var node = XHTMLNS.create('button');
        return node;
    },
},

'accessing', {
    setActive: function(active) {
        this.isActive = active;
        if (active) this.pressed = false;
        this.changeAppearanceFor(false);
    },
    setExtent: function($super, extent) {
        $super(extent);
        this.resizeComponent();
    },
 


    
},
'event handling', {
    changeAppearanceFor: function(pressed) {
        if (pressed) {
            this.setComponentNodeClass(this.activeClasses);
        } else {
            this.setComponentNodeClass(this.isActive?this.classes:this.disabledClasses);
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

lively.morphic.SAPUI5.Component.subclass('lively.morphic.SAPUI5.TextField',

'settings',{
    classes: 'sapUiTf sapUiTfBrd sapUiTfStd',    
    focusClass: 'sapUiTfFoc',
    disabledClass: 'sapUiTfDsbl',
    defaultValue: "",
    fixedHeight: true
},
'HTML render settings', {
    htmlDispatchTable: {
        getValue: 'getValueHTML',        
        setValue: 'setValueHTML',        
        setMaxLength: 'setMaxLengthHTML',
        getMaxLength: 'getMaxLengthHTML',
    },
},
'initializing', {
    initialize: function($super, bounds) {
        $super(bounds);
        this.hasFocus = false;
        this.active = true;
    }
},

'rendering', {
    initHTML: function($super, ctx, optValue) {
        if (!ctx.componentNode)
            ctx.componentNode= XHTMLNS.create('input');
         this.setComponentNodeClass(this.classes);
         this.setComponentNodeId();
        $super(ctx);
        if (this.shape) this.setValueHTML(ctx, (optValue || this.defaultValue));
    },

    getValueHTML: function(ctx) {
        if (ctx.componentNode) return ctx.componentNode.value;
        else return "";  
    },
    setValueHTML: function(ctx, value) {
        if (ctx.componentNode) ctx.componentNode.value = value;
    },
    getMaxLengthHTML: function(ctx) {
        if (ctx.componentNode) {
            var m = ctx.componentNode.getAttribute('maxlength');
            if (m && m !="") return m;
        }
        return null;  
    },
    setMaxLengthHTML: function(ctx, value) {
        if (ctx.componentNode) {
            if (value) ctx.componentNode.maxLength = value;
            else ctx.componentNode.removeAttribute('maxlength');
        }
    },
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
    getMaxLength: function() {
        return this.renderContextDispatch('getMaxLength');
    },
    setMaxLength: function(value) {
        return this.renderContextDispatch('setMaxLength', value);
    },
    setActive: function(active) {
        this.active = active;
        if (!active) this.focus= false;
        this.changeAppearance();
    },

    
},
'event handling', {
   
    onFocus: function($super, evt) {
        this.hasFocus = true;
        this.changeAppearance();
        $super(evt);
    },
    onBlur: function($super, evt) {
        this.hasFocus = false;
        this.changeAppearance();
        $super(evt);        
    },
    
    changeAppearance: function() {
        var classNames = this.classes;
        if (!this.active){
            classNames+=' '+this.disabledClass;
        }
        else if(this.hasFocus ) {
            classNames+=' '+this.focusClass;
        }
        this.setComponentNodeClass(classNames );              
    },
 

}
);

lively.morphic.SAPUI5.LabelComponent.subclass('lively.morphic.SAPUI5.CheckBox',

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
        updateInputTag: 'updateInputTagHTML'
    },
},
'initializing', {
    initialize: function($super, bounds, optLabel) {
        $super(bounds);
        if (optLabel) this.setLabel(optLabel);
        this.readOnly = false;
        this.checked = false;
        this.active = true;
        this.updateAppearance();
    }
},

'rendering', {
    initHTML: function($super, ctx) {
        if (!ctx.componentNode) ctx.componentNode= XHTMLNS.create('span');
        if (!ctx.checkBoxNode) this.setupCheckBoxNodeHTML(ctx);
        if (!ctx.labelNode) this.setupLabelNodeHTML(ctx);
        
        this.updateAppearance();        

        ctx.subNodes = [];
        $super(ctx);
        if (this.shape) this.updateLabel(this.label || "Button")
    },
    setupCheckBoxNodeHTML: function(ctx){
        var c = XHTMLNS.create('input');
        c.type = "checkbox";
        c.id = 'checkbox-'+this.id;
        ctx.checkBoxNode = c;
    },    
    setupLabelNodeHTML: function(ctx){
        var l = XHTMLNS.create('label');
        l.htmlFor = 'checkbox-'+this.id;
        ctx.labelNode = l;
    },
    appendHTML: function($super, ctx, optMorphAfter) {
        ctx.componentNode.appendChild(ctx.checkBoxNode);
        ctx.componentNode.appendChild(ctx.labelNode);
        $super(ctx, optMorphAfter);
        //this.setWrapperNodeClass(this.active?this.classes:this.disabledClasses);        
    },

    updateLabelHTML: function(ctx, label) {
        ctx.labelNode.innerHTML = label;
        ctx.checkBoxNode.title = label;
    },

    getComponentNodeIdHTML: function(ctx) {
        return ctx.checkBoxNode.id;
    },
    
    updateInputTagHTML: function(ctx) {
        ctx.checkBoxNode.checked = (this.checked)?"checked":null;
        ctx.checkBoxNode.disabled= (this.active)?null:"disabled";        
        ctx.checkBoxNode.readOnly= (this.readOnly)?"readOnly":null;   
    }
    
},

'accessing', {
    setChecked: function(checked){ 
        this.checked = checked;
        this.updateAppearance();
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
        return this.renderContextDispatch('updateInputTag');
    },
    
},
'event handling', {
    updateAppearance: function() {

        var classNames = this.baseClass;
        
        if (this.checked) { classNames+=' '+this.checkedClass}
        if (this.readOnly) {classNames+=' '+this.readOnlyClass}
            else if (this.active) {classNames+=' '+this.activeClass}
            else {classNames+=' '+this.disabledClass}
        this.setComponentNodeClass(classNames);
        this.updateInputTag();
    },
    
    onChange: function(evt) {

        if (this.active && !this.readOnly) {
            
            lively.bindings.signal(this, 'fire', true);
            this.setChecked(!this.checked);
        }
         return true;
     },

}
);

lively.morphic.List.subclass('lively.morphic.SAPUI5.ListBox',
'settings',{
    style: null,
    selectionColor: null,
    wrapperClasses: 'sapUiLbx sapUiLbxStd' ,
    itemClass: 'sapUiLbxI',
    selectedItemClass: 'sapUiLbxISel',
    itemSpanClass: 'sapUiLbxITxt',
},
'HTML render settings', {
    htmlDispatchTable: {
        updateListContent: 'updateListContentHTML',
        resizeList: 'resizeListHTML',
        getItemIndexFromEvent: 'getItemIndexFromEventHTML',
        getListExtent: 'getListExtentHTML',
        setSize: 'setSizeHTML',
        renderAsDropDownList: 'renderAsDropDownListHTML',
        setFontSize: 'setFontSizeHTML',
        setFontFamily: 'setFontFamilyHTML',
        getSelectedIndexes: 'getSelectedIndexesHTML',
        enableMultipleSelections: 'enableMultipleSelectionsHTML',
        selectAllAt: 'selectAllAtHTML',
        clearSelections: 'clearSelectionsHTML',
        deselectAt: 'deselectAtHTML',
    },
},

'rendering', {
    initHTML: function($super, ctx) {
        
        if (!ctx.wrapperNode) this.setupWrapperNodeHTML(ctx);
        if (!ctx.listNode) this.setupListNodeHTML(ctx);
            
            
        ctx.subNodes = [];
        $super(ctx);
        if (this.shape) // FIXME should also be done when no shape exists...?
            this.updateList(this.itemList || [])

        if (this.isMultipleSelectionList) this.enableMultipleSelectionsHTML(ctx); 
        
    },
    
     setupWrapperNodeHTML: function(ctx){
        var c = XHTMLNS.create('div');
        c.className = this.wrapperClasses;
        /*
        c.onmouseup = function(evt){
            console.log('MouseUP! Right?');
            console.log(evt.isRightMouseButtonDown());
            };
            */
        ctx.wrapperNode = c;
    },    
    setupListNodeHTML: function(ctx){
        var l = XHTMLNS.create('ul');
        ctx.listNode = l;
    },
    
    appendHTML: function($super, ctx, optMorphAfter) {
        $super(ctx, optMorphAfter);
        ctx.wrapperNode.appendChild(ctx.listNode );
        ctx.shapeNode.appendChild(ctx.wrapperNode );
        this.resizeListHTML(ctx);
    },


    setClipModeHTML: function(ctx, clipMode) {
        // FIXME duplication wiht super, delay logic
        // can be extracted
        if (!ctx.wrapperNode|| this.delayedClipMode) {
            this.delayedClipMode = clipMode;
            return;
        }
        this.setClipModeHTMLForNode(ctx, ctx.wrapperNode, clipMode);
    },

},
'events', {
    onClick: function(evt) {
        var t = evt.target.parentNode;
        if (t.nodeName == 'li') {
            this.selectOnlyNodeHTML(t, true);    
        }
    },
    onMouseUp: function(evt) {
        //console.log(evt);
        if (evt.isRightMouseButtonDown()) this.showHalos();
        return false;   
    },
    onMouseUpEntry: function(evt) {
        return this.onMouseUp(evt);   
    },
    onMouseDown: function(evt) {
        return false;   
    },
    onMouseDownEntry: function(evt) {
        return this.onMouseDown(evt);   
    },
    onMouseOver: function(evt) {
        return false;   
    },
    onMouseMove: function(evt) {
        return false;   
    }
},
'list specific', {
    removeListContentHTML: function(ctx) {
        ctx.subNodes = [];
        while(ctx.listNode.childNodes.length > 0) {
            var node = ctx.listNode.childNodes[0];
            node.parentNode.removeChild(node);
        }
    },
    createItemNodeHTML: function(title) { 
        // create the li
        var l = XHTMLNS.create('li');
        l.className = this.itemClass;
        l.title = title;
        
        // create the span inside the li
        var s = XHTMLNS.create('span');
        s.innerHTML = title;
        s.className = this.itemSpanClass;
        s.style = "text-align:left"; // its in the SAPUI5 html, but is it really necessary?
        l.appendChild(s);
        
        return l;
    },
    updateListContentHTML: function(ctx, itemStrings) {
        if (!itemStrings) itemStrings = [];
        var scroll = this.getScroll();
        if(!ctx || !ctx.subNodes) return;
        if (ctx.subNodes.length > 0) this.removeListContentHTML(ctx);
        var extent = this.getExtent();
        for (var i = 0; i < itemStrings.length; i++) {
            var option = this.createItemNodeHTML(itemStrings[i]);
            ctx.listNode.appendChild(option);
            ctx.subNodes.push(option);
        }
        this.resizeListHTML(ctx);
        this.selectAllAtHTML(ctx, [this.selectedLineNo]);
    },
    resizeListHTML: function(ctx) {
        var borderWidth = this.getBorderWidth(),
            extent = this.getExtent().subPt(pt(2*borderWidth, 2*borderWidth)),
            listNode = ctx.wrapperNode;
        listNode.style.left = this.shape.getPosition().x /*+ this.padding.left()*/ + 'px';
        listNode.style.top = this.shape.getPosition().y /*+ this.padding.top()*/ + 'px';
        listNode.style.width = extent.x /*- this.padding.right() - this.padding.left())*/ + 'px';
        listNode.style.height = extent.y /*- this.padding.bottom() - this.padding.top()*/ + 'px';
    },
    getItemIndexFromEventHTML: function(ctx, evt) {
        var target = evt.target,
            idx = ctx.subNodes.indexOf(target);
        return idx;
    },
    deselectNodesHTML: function(ctx) {
        if (ctx.subNodes) {
            var self = this;
            ctx.subNodes.forEach(function(ea) { self.selectNodeHTML(ea, false); })
        }
    },
},
'multiple selection support HTML', {
    enableMultipleSelectionsHTML: function(ctx) {
        
    },
    getSelectedIndexesHTML: function(ctx) {
        var indexes = ctx.subNodes
            .collect(function(ea, i) { return ea.selected && i })
            .select(function(idxOrNull) { return idxOrNull || idxOrNull === 0 })
        return indexes;
    },
    selectNodeHTML: function(node, select){
        if (select) {
            node.className = this.itemClass +' '+ this.selectedItemClass;
        } else {
            node.className = this.itemClass;
        }
        node.selected = select;
    },
    selectOnlyNodeHTML: function(node, select){
       this.clearSelections();
       this.selectNodeHTML(node, select);
    },
    deselectAtHTML: function(ctx, idx) {
        if (!ctx.listNode) return;
        if (idx < 0 || idx >= this.itemList.length) return;
        var node = ctx.subNodes[idx];
        if (node) this.selectNodeHTML(node, false);
    },
    selectAllAtHTML: function(ctx, indexes) {
        if (!ctx.listNode) return;
        for (var i = 0; i < indexes.length; i++) {
            var idx = indexes[i];
            if (idx < 0 || idx >= this.itemList.length) continue;
            var node = ctx.subNodes[idx];
            if (!node) continue;
            this.selectNodeHTML(node, true);
            if (node.scrollIntoViewIfNeeded) // no Firefox support
                node.scrollIntoViewIfNeeded();
        }
    },
    clearSelectionsHTML: function(ctx) { this.deselectNodesHTML(ctx) },
},
'node creation', {

    getListExtentHTML: function(ctx) {
        return ctx.listNode.scrollHeight != 0 ? pt(ctx.listNode.scrollWidth, ctx.listNode.scrollHeight) : this.getExtent()
    },
},
'styling', {
    setFontSizeHTML: function(ctx, value) {},
    setFontFamilyHTML: function(ctx, value) {},
}
);

lively.morphic.SAPUI5.CheckBox.subclass('lively.morphic.SAPUI5.RadioButton',
'settings',{
    baseClass:'sapUiRb',
    activeClass: 'sapUiRbInteractive sapUiRbStd', 
    checkedClass: 'sapUiRbSel',
    disabledClass: 'sapUiRbDis',
    readOnlyClass: 'sapUiRbRo',
    label: "Radio button",
    htmlName: "radio"
},
'HTML render settings', {
    htmlDispatchTable: {
        setHtmlName:'setHtmlNameHTML',
        getHtmlName:'getHtmlNameHTML',
        isChecked: 'isCheckedHTML',
        setChecked: 'setCheckedHTML'
    },
},
'initializing', {
    initialize: function($super, bounds, optLabel) {
        this.htmlName = this.htmlName;
        $super(bounds, optLabel);
    }
},

'rendering', {
    setupCheckBoxNodeHTML: function(ctx){
        var c = XHTMLNS.create('input');
        c.name = this.htmlName;
        c.type = "radio";
        c.id = 'radio-'+this.id;
        ctx.checkBoxNode = c;
    },    
    setupLabelNodeHTML: function(ctx){
        var l = XHTMLNS.create('label');
        l.htmlFor = 'radio-'+this.id;
        ctx.labelNode = l;
    },

    isCheckedHTML: function(ctx){
        return ctx.checkBoxNode.checked;    
    },
    setCheckedHTML: function(ctx, checked) {
        ctx.checkBoxNode.checked = checked;
    },
    setHtmlNameHTML: function(ctx, name){
        ctx.checkBoxNode.name = name;    
    },
    getHtmlNameHTML: function(ctx){
        return ctx.checkBoxNode.name;    
    },
},
'accessing', {
    setChecked: function(checked){ 
        this.checked = checked;
        this.updateAppearance();
    },
    
    isChecked: function(){
        return this.renderContextDispatch('isChecked');
    },
    setHtmlName: function(name){
        this.renderContextDispatch('setHtmlName', name);
    },
    getHtmlName: function(){
        return this.renderContextDispatch('getHtmlName');
    },
    setActive: function(active) {
        this.active = active;
        this.updateAppearance();
    },
    setReadOnly: function(readOnly ) {
        this.readOnly = readOnly ;
        this.updateAppearance();
    },
    setExtent: function($super, extent) {
        $super(extent);
        this.resizeCheckBox();
    },
    updateInputTag: function(idx) {
        return this.renderContextDispatch('updateInputTag');
    },
    resizeCheckBox: function(idx) {
        return this.renderContextDispatch('resizeCheckBox');
    },
    
},
'event handling', {
    updateAppearance: function() {

        var classNames = this.baseClass;
        
        if (this.isChecked()) { classNames+=' '+this.checkedClass}
        if (this.readOnly) {classNames+=' '+this.readOnlyClass}
            else if (this.active) {classNames+=' '+this.activeClass}
            else {classNames+=' '+this.disabledClass}
        this.setComponentNodeClass(classNames);
        this.updateInputTag();
    },
    
    updateRadioGroup: function() {
        var cons = this.constructor.name;
        var name = this.getHtmlName();
        this.owner.submorphs.each(function(ea){
            if (ea.constructor.name === cons && ea.getHtmlName()===name) 
                ea.updateAppearance();
            });
    },
    
    onClick: function(evt) {
        if (this.readOnly) evt.stop();  
    },
    
    onChange: function(evt) {
        
        if (this.active && !this.readOnly) {
            lively.bindings.signal(this, 'fire', true);
        }
           //this.setChecked(!this.checked);
       this.updateRadioGroup();
         return true;
     },

}
);

lively.morphic.SAPUI5.LabelComponent.subclass('lively.morphic.SAPUI5.Label',

'settings',{
    baseClass: 'sapUiLbl sapUiLblNowrap',    
    boldClass: 'sapUiLblEmph',
    requiredClass: 'sapUiLblReq',
    label: "Label",
    fixedHeight: true
},
'HTML render settings', {
    htmlDispatchTable: {
        setFor: 'setForHTML',        
    },
},
'initializing', {
    initialize: function($super, bounds, optLabel) {
        $super(bounds);
        if (optLabel) this.setLabel(optLabel);
        this.bold = false;
        this.required = false;        
    }
},

'rendering', {
    initHTML: function($super, ctx) {
        if (!ctx.componentNode)
            ctx.componentNode= XHTMLNS.create('label');
        $super(ctx);
        if (this.htmlFor) this.setForHTML(ctx,this.htmlFor);
        if (this.shape) this.updateLabel(this.label || "Label")
        this.changeAppearance();
    },



},


'accessing', {
    changeAppearance: function() {
        var classNames = this.baseClass;
        if (this.bold){
            classNames+=' '+this.boldClass;
        }
        if(this.required) {
            classNames+=' '+this.requiredClass;
        }
        this.setComponentNodeClass(classNames);              
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
        if (morph && morph.getComponentNodeId){
            var id = morph.getComponentNodeId();
            this.htmlFor = id;
            return this.renderContextDispatch('setFor', id);    
        }  
    },
    setForHTML: function(ctx, id){
        ctx.componentNode.htmlFor = id;
    },
    
    setFixedHeight: function(f) {
        this.fixedHeight = f;
        this.resizeComponent();
    },


    
}
);

lively.morphic.SAPUI5.Component.subclass('lively.morphic.SAPUI5.Slider',
'settings',{
    normalClasses: 'sapUiSli sapUiSliStd',    
    readOnlyClasses: 'sapUiSli sapUiSliRo',
    fixedHeight: true,
    minValue: 0,
    maxValue: 100,
    tickCount: 0,
    tickPxCorrection: -1,
    gripPxCorrection: -5,
    hasLabels: true
},
'HTML render settings', {
    htmlDispatchTable: {
        generateTicks: 'generateTicksHTML',
        updateTicks: 'updateTicksHTML' ,    
        getSliderWidth: 'getSliderWidthHTML'          
    },
},
'initializing', {
    initialize: function($super, bounds) {
        $super(bounds);
        this.readOnly = false;
        this.updateAppearance();

    }
},

'rendering', {
    initHTML: function($super, ctx) {
        if (!ctx.componentNode) { 
            ctx.componentNode= XHTMLNS.create('div');
        }
        this.updateAppearance(); 
        
        if (!ctx.sliderRight) { 
            ctx.sliderRight= XHTMLNS.create('div');
            ctx.sliderRight.className = 'sapUiSliR';
        }
        if (!ctx.sliderLeft) { 
            ctx.sliderLeft= XHTMLNS.create('div');
            ctx.sliderLeft.className = 'sapUiSliL';
        }
        if (!ctx.sliderBar) { 
            ctx.sliderBar= XHTMLNS.create('div');
            ctx.sliderBar.className = 'sapUiSliBar';
        }
        if (!ctx.sliderHilite) { 
            ctx.sliderHilite= XHTMLNS.create('div');
            ctx.sliderHilite.className = 'sapUiSliHiLi';
        }
        if (!ctx.sliderGrip) { 
            ctx.sliderGrip= XHTMLNS.create('div');
            ctx.sliderGrip.className = 'sapUiSliGrip';
        }
        ctx.ticks = [];
        ctx.labels= [];
        this.generateTicksHTML(ctx);

        $super(ctx);
    },
    
    appendHTML: function($super, ctx, optMorphAfter) {
        ctx.componentNode.appendChild(ctx.sliderRight);
        ctx.sliderRight.appendChild(ctx.sliderLeft);
        ctx.sliderLeft.appendChild(ctx.sliderBar);
        ctx.sliderBar.appendChild(ctx.sliderHilite);
        ctx.sliderBar.appendChild(ctx.sliderGrip); 
        $super(ctx, optMorphAfter);
        this.addSliderEventsHTML(ctx, ctx.sliderGrip);        
        this.generateTicksHTML(ctx);
    },
    resizeComponentHTML: function($super, ctx) {
        $super(ctx);
        this.updateTicks();
    },
    generateTicks: function(){
        return this.renderContextDispatch('generateTicks');
    },
    generateTicksHTML: function(ctx) {
        ctx.ticks.each(function(n){n.parentNode.removeChild(n);});
        ctx.ticks = [];
        ctx.labels.each(function(n){n.parentNode.removeChild(n);});
        ctx.labels = [];
        
        // create ticks and labels
        var range = this.maxValue - this.minValue;
        for (var i = 0; i < this.tickCount; i++) {
            ctx.ticks[i] = XHTMLNS.create('div');
            ctx.ticks[i].className = 'sapUiSliTick';
            ctx.sliderBar.appendChild(ctx.ticks[i]);
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
                
                ctx.labels[i].className = labelClass;
                ctx.labels[i].innerHTML = value;
                
                ctx.sliderBar.appendChild(ctx.labels[i]);
                
                var s = window.getComputedStyle(ctx.labels[i]);
                var w = parseInt(s["width"].replace("px",""));
                ctx.labels[i].pxCorrection = -(w/2);
                
            }
        }
        this.updateTicksHTML(ctx);
        
    },
    
    updateTicks: function(){
         return this.renderContextDispatch('updateTicks');
    },
    updateTicksHTML: function(ctx){
        var c = ctx.ticks.length;
        if (this.tickCount != c || (this.hasLabels && ctx.labels.length != c)) {
            throw new Error("Slider: Tick count is not synchronized!");
        }
        var w = this.getSliderWidthHTML(ctx);
        for (var i = 0; i < c; i++){
             var s = w / (c-1);
             var pos = s * i;
             ctx.ticks[i].style.left = (pos+this.tickPxCorrection)+"px";
             console.log("Setting left of tick "+i+" to "+pos);
             if (i > 0 && i < c-1) {
                 var o = ctx.labels[i].pxCorrection || 0;
                ctx.labels[i].style.left = (pos+o)+"px";
             }
             
        }
        
    },
    
    getSliderWidth: function(){
       return this.renderContextDispatch('getSliderWidth');
    },
    getSliderWidthHTML: function(ctx){
       var s = window.getComputedStyle(ctx.sliderBar);
       return parseInt(s["width"].replace("px",""));
    },
    
    
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
        
    }
},
'events',{
    updateAppearance: function(){
        if (this.readOnly) this.setComponentNodeClass(this.readOnlyClasses);
        else this.setComponentNodeClass(this.normalClasses);
    },
    addSliderEventsHTML: function(ctx, sliderNode){
        sliderNode.onmousedown = this.onSliderMouseDown;    
        //sliderNode.onmouseup = this.onSliderMouseUp;
        //sliderNode.onmousemove = this.onSliderMouseMove;                
    },

    onSliderMouseDown: function(evt){
                console.log(evt);

		var doc = window.document;
                
                var sliderNode = this;
                
                $(document).mousemove(function(){
                        console.log(sliderNode);

		      if (Slider._sliderDragData) {	// drag
			var s = Slider._sliderDragData.slider;

			var boundSize = s.getMaximum() - s.getMinimum();
			var size, pos, reset;

			if (s._orientation == "horizontal") {
				size = s.element.offsetWidth - s.handle.offsetWidth;
				pos = e.screenX - Slider._sliderDragData.dx;
				reset = Math.abs(e.screenY - Slider._sliderDragData.screenY) > 100;
			}
			else {
				size = s.element.offsetHeight - s.handle.offsetHeight;
				pos = s.element.offsetHeight - s.handle.offsetHeight -
					(e.screenY - Slider._sliderDragData.dy);
				reset = Math.abs(e.screenX - Slider._sliderDragData.screenX) > 100;
			}
			s.setValue(reset ? Slider._sliderDragData.startValue :
						s.getMinimum() + boundSize * pos / size);
			return false;
		  }
		  else {
			var s = Slider._currentInstance;
			if (s != null) {
				var lineEl = Slider.eventHandlers.getLine(e);
				s._mouseX = e.offsetX + (lineEl ? s.line.offsetLeft : 0);
				s._mouseY = e.offsetY + (lineEl ? s.line.offsetTop : 0);
			}
		  }
                }).mouseup(function() {
                    e = Slider.eventHandlers.getEvent(e, this);
		  var s = Slider._currentInstance;
		  var doc = s.document;
		  if (doc.removeEventListener) {
			doc.removeEventListener("mousemove", Slider.eventHandlers.onmousemove, true);
			doc.removeEventListener("mouseup", Slider.eventHandlers.onmouseup, true);
		  }
		  else if (doc.detachEvent) {
			doc.detachEvent("onmousemove", Slider.eventHandlers.onmousemove);
			doc.detachEvent("onmouseup", Slider.eventHandlers.onmouseup);
			doc.detachEvent("onlosecapture", Slider.eventHandlers.onmouseup);
			s.element.releaseCapture();
		  }

		  if (Slider._sliderDragData) {	// end drag
			Slider._sliderDragData = null;
		  }
		  else {
			s._timer.stop();
			s._increasing = null;
		  }
		      Slider._currentInstance = null;
                    $(document).unbind("mousemove mouseup");
                });
                
                asdf = {
				screenX:	e.screenX,
				screenY:	e.screenY,
				dx:			e.screenX - s.handle.offsetLeft,
				dy:			e.screenY - s.handle.offsetTop,
				startValue:	s.getValue(),
				slider:		s
			};

		if (Slider.eventHandlers.getHandle(e)) {	// start drag
			
		}
		else {
			var lineEl = Slider.eventHandlers.getLine(e);
			s._mouseX = e.offsetX + (lineEl ? s.line.offsetLeft : 0);
			s._mouseY = e.offsetY + (lineEl ? s.line.offsetTop : 0);
			s._increasing = null;
			s.ontimer();
		}
		
            },
}
);


}) // end of module