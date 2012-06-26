module('lively.morphic.SAPUI5').requires('lively.morphic.HTML').toRun(function() {

lively.morphic.Box.subclass('lively.morphic.SAPUI5.Button',

'settings',{
    classes: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnStd',    
    activeClasses: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnAct',
    disabledClasses: 'sapUiBtn sapUiBtnNorm sapUiBtnS sapUiBtnDsbl',
    label: "Button"
},
'HTML render settings', {
    htmlDispatchTable: {
        updateLabel: 'updateLabelHTML',
        resizeButton: 'resizeButtonHTML',
        getButtonExtent: 'getButtonExtentHTML',
        setButtonNodeClass: 'setButtonNodeClassHTML',
    },
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
        if (!ctx.buttonNode)
            ctx.buttonNode= this.createButtonNodeHTML();
        this.setButtonNodeClass(this.isActive?this.classes:this.disabledClasses);
        ctx.subNodes = [];
        $super(ctx);
        if (this.shape) this.updateLabel(this.label || "Button")
    },
    appendHTML: function($super, ctx, optMorphAfter) {
        $super(ctx, optMorphAfter);
        this.appendButtonHTML(ctx);
    },
    appendButtonHTML: function(ctx) {
        ctx.shapeNode.appendChild(ctx.buttonNode);
        this.resizeButtonHTML(ctx);
    },

    setClipModeHTML: function(ctx, clipMode) {
        // FIXME duplication wiht super, delay logic
        // can be extracted
        if (!ctx.buttonNode || this.delayedClipMode) {
            this.delayedClipMode = clipMode;
            return;
        }
        this.setClipModeHTMLForNode(ctx, ctx.buttonNode, clipMode);
    },
    resizeButtonHTML: function(ctx) {
        var borderWidth = this.getBorderWidth(),
            extent = this.getExtent().subPt(pt(2*borderWidth, 2*borderWidth)),
            buttonNode= ctx.buttonNode;
        buttonNode.style.left = this.shape.getPosition().x /*+ this.padding.left()*/ + 'px';
        buttonNode.style.top = this.shape.getPosition().y /*+ this.padding.top()*/ + 'px';
        buttonNode.style.width = extent.x /*- this.padding.right() - this.padding.left())*/ + 'px';
        buttonNode.style.height = extent.y /*- this.padding.bottom() - this.padding.top()*/ + 'px';
    },
    updateLabelHTML: function(ctx, label) {
        ctx.buttonNode.innerHTML = label;
    },
    setButtonNodeClassHTML: function(ctx, className) {
        ctx.buttonNode.className = className;
    }
},

'node creation', {
    createButtonNodeHTML: function() {
        var node = XHTMLNS.create('button');
        return node;
    },
    getButtonExtentHTML: function(ctx) {
        return ctx.buttonNode.scrollHeight != 0 ? pt(ctx.buttonNode.scrollWidth, ctx.buttonNode.scrollHeight) : this.getExtent()
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
        this.resizeButton();
    },
    resizeButton: function(idx) {
        return this.renderContextDispatch('resizeButton');
    },
    getButtonExtent: function() { return this.renderContextDispatch('getButtonExtent') },
    updateLabel: function(label) {
        this.label = label;
        this.renderContextDispatch('updateLabel', label);
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
    setButtonNodeClass: function(className) {
        this.renderContextDispatch('setButtonNodeClass', className);     
    }
    
},
'event handling', {
    changeAppearanceFor: function(pressed) {
        if (pressed) {
            this.setButtonNodeClass(this.activeClasses);
        } else {
            this.setButtonNodeClass(this.isActive?this.classes:this.disabledClasses);
        }
  
    },
    /*
    onClick: function(evt) {
         if (evt.isCommandKey() || !evt.isLeftMouseButtonDown()) {
            evt.stop()
            return true;
        }
        lively.bindings.signal(this, 'fire', true);
         return true;
     },
*/
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

lively.morphic.Box.subclass('lively.morphic.SAPUI5.CheckBox',

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
        updateLabel: 'updateLabelHTML',
        resizeCheckBox: 'resizeCheckBoxHTML',
        getCheckBoxExtent: 'getCheckBoxExtentHTML',
        setWrapperNodeClass: 'setWrapperNodeClassHTML',
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
        if (!ctx.wrapperNode) ctx.wrapperNode= XHTMLNS.create('div');
        if (!ctx.checkBoxNode) this.setupCheckBoxNodeHTML(ctx);
        if (!ctx.labelNode) this.setupLabelNodeHTML(ctx);
        
        this.setWrapperNodeClass(this.active?this.classes:this.disabledClasses);
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
        $super(ctx, optMorphAfter);
        ctx.wrapperNode.appendChild(ctx.checkBoxNode);
        ctx.wrapperNode.appendChild(ctx.labelNode);
        ctx.shapeNode.appendChild(ctx.wrapperNode);
        this.resizeCheckBoxHTML(ctx);
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
    resizeCheckBoxHTML: function(ctx) {
        var borderWidth = this.getBorderWidth(),
            extent = this.getExtent().subPt(pt(2*borderWidth, 2*borderWidth)),
            wrapperNode= ctx.wrapperNode;
        wrapperNode.style.left = this.shape.getPosition().x /*+ this.padding.left()*/ + 'px';
        wrapperNode.style.top = this.shape.getPosition().y /*+ this.padding.top()*/ + 'px';
        wrapperNode.style.width = extent.x /*- this.padding.right() - this.padding.left())*/ + 'px';
        wrapperNode.style.height = extent.y /*- this.padding.bottom() - this.padding.top()*/ + 'px';
    },
    updateLabelHTML: function(ctx, label) {
        ctx.labelNode.innerHTML = label;
        ctx.checkBoxNode.title = label;
    },
    setWrapperNodeClassHTML: function(ctx, className) {
        ctx.wrapperNode.className = className;
    },
    
    
    updateInputTagHTML: function(ctx) {
        ctx.checkBoxNode.checked = (this.checked)?"checked":null;
        ctx.checkBoxNode.disabled= (this.active)?null:"disabled";        
        ctx.checkBoxNode.readOnly= (this.readOnly)?"readOnly":null;   
    }
    
},

'node creation', {

    getWrapperExtentHTML: function(ctx) {
        return ctx.wrapperNode.scrollHeight != 0 ? pt(ctx.wrapperNode.scrollWidth, ctx.wrapperNode.scrollHeight) : this.getExtent()
    },
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
    getWrapperExtent: function() { return this.renderContextDispatch('getWrapperExtent') },
    updateLabel: function(label) {
        this.label = label;
        this.renderContextDispatch('updateLabel', label);
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
    setWrapperNodeClass: function(className) {
        this.renderContextDispatch('setWrapperNodeClass', className);     
    }
    
},
'event handling', {
    updateAppearance: function() {

        var classNames = this.baseClass;
        
        if (this.checked) { classNames+=' '+this.checkedClass}
        if (this.readOnly) {classNames+=' '+this.readOnlyClass}
            else if (this.active) {classNames+=' '+this.activeClass}
            else {classNames+=' '+this.disabledClass}
        this.setWrapperNodeClass(classNames);
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
    /*
    setSizeHTML: function(ctx, size) {
        if (ctx.wrapperNode) ctx.wrapperNode.size = size;
    },
    setSize: function(size) {
        this.renderContextDispatch('setSize', size);
    },
    */
},
'events', {
    onClick: function(evt) {
        var t = evt.target.parentNode;
        if (t.nodeName == 'li') {
            this.selectNodeHTML(t, true);    
        }
    },
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




}) // end of module