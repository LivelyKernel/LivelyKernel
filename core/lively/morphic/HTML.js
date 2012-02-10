module('lively.morphic.HTML').requires('lively.morphic.Rendering', 'lively.morphic.PathShapes', 'lively.Traits').toRun(function() {

Color.addMethods(
'HTML rendering', {
    toCSSString: Color.prototype.toRGBAString,
});

Trait('LinearGradientCSSTrait',
'HTML rendering', {
    toCSSStringFirefoxAndOpera: function(bounds, cssPrefix) {
        var str = Strings.format(cssPrefix + 'linear-gradient(%sdeg',
            this.vector.bottomRight().subPt(this.vector.topLeft()).theta().toDegrees());
        for (var i = 0; i < this.stops.length; i++)
            str += ', ' + this.stops[i].color + ' ' + (this.stops[i].offset*100) + '%'
        str += ')';
        return str;
    },
    toCSSStringIE: function(bounds, cssPrefix) {
        module('apps.Base64').load(true);
        var str = [];
        str.push('<?xml version="1.0" encoding="utf-8"?>');
        str.push('<svg version="1.1" xmlns="http://www.w3.org/2000/svg">');
        str.push('<defs>');
        str.push('<linearGradient id="grad" x1="' + (this.vector.x * 100.0) + '%" y1="' + (this.vector.y * 100.0) + '%" x2="' + (this.vector.maxX() * 100.0) + '%" y2="' + (this.vector.maxY() * 100.0) + '%">');
        for (var i = 0; i < this.stops.length; i++)
        str.push('<stop offset="' + this.stops[i].offset + '" stop-color="' + this.stops[i].color + '" />');
        str.push('</linearGradient>');
        str.push('</defs>');
        str.push('<rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />');
        str.push('</svg>');
        return "url('data:image/svg+xml;base64," + Base64.encode(str.join(' ') + ' ') + "') no-repeat;";
    },
    toCSSStringWebkit: function(bounds, cssPrefix) {
        // default webkit way of defining gradients
        var str = Strings.format('%sgradient(linear, %s\% %s\%, %s\% %s\%',
            cssPrefix,
            this.vector.x * 100.0,
            this.vector.y * 100.0,
            this.vector.maxX() * 100.0,
            this.vector.maxY() * 100.0);
        for (var i = 0; i < this.stops.length; i++)
            str += ',color-stop(' + this.stops[i].offset + ', ' + this.stops[i].color + ')';
        str += ')';
        return str;
    },
    toCSSStringUnknown: function() {
        console.warn('Trying to detect how CSS gradients are rendered but wasn\'t able to recognize browser');
        return '';
    },
})
.applyTo(lively.morphic.LinearGradient, {
    alias: (function() {
        if (UserAgent.fireFoxVersion || UserAgent.isOpera) return {toCSSStringFirefoxAndOpera: 'toCSSString'};
        if (UserAgent.isIE) return {toCSSStringIE: 'toCSSString'};
        if (UserAgent.webKitVersion) return {toCSSStringWebkit: 'toCSSString'};
        return {toCSSStringUnknown: 'toCSSString'};
    })(),
})

Trait('RadialGradientCSSTrait',
'HTML rendering', {
    toCSSStringFirefoxAndOpera: function(bounds, cssPrefix) {
        var str = Strings.format('-moz-radial-gradient(50% 50%, circle cover');
        for (var i = 0; i < this.stops.length; i++)
            str += ', ' + this.stops[i].color + ' ' + (this.stops[i].offset*100) + '%'
        str += ')';
        return str;
    },
    toCSSStringIE: function(bounds, cssPrefix) {
      module('apps.Base64').load(true);
      var str = [];
      str.push('<?xml version="1.0" encoding="utf-8"?>');
      str.push('<svg version="1.1" xmlns="http://www.w3.org/2000/svg">');
      str.push('<defs>');
      str.push('<radialGradient id="grad" fx="' + (this.focus.x * 100.0) + '%" fy="' + (this.focus.y * 100.0) + '%">');
      for (var i = 0; i < this.stops.length; i++)
        str.push('<stop offset="' + this.stops[i].offset + '" stop-color="' + this.stops[i].color + '" />');
      str.push('</radialGradient>');
      str.push('</defs>');
      str.push('<rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />');
      str.push('</svg>');
      return "url('data:image/svg+xml;base64," + Base64.encode(str.join(' ') + ' ') + "') no-repeat;";
    },
    toCSSStringWebkit: function(bounds, cssPrefix) {
        bounds = bounds || new Rectangle(0,0, 20, 20);
        var str = Strings.format('%sgradient(radial, %s\% %s\%, %s, %s\% %s\%, %s',
            cssPrefix,
            this.focus.x * 100.0,    // inner circle x coordinate
            this.focus.y * 100.0,    // inner circle y coordinate
            0.0,                                        // inner circle radius
            50.0,                                        // outer circle x coordinate
            50.0,                                        // outer circle y coordinate
            bounds.width/2);                                // outer circle radius
        for (var i = 0; i < this.stops.length; i++)
            str += Strings.format(',color-stop(%s, %s)', this.stops[i].offset, this.stops[i].color.toRGBAString());
        str += ')';
        return str;
    },
    toCSSStringUnknown: function() {
        console.warn('Trying to detect how CSS gradients are rendered but wasn\'t able to recognize browser');
        return '';
    },
})
.applyTo(lively.morphic.RadialGradient, {
    alias: (function() {
        if (UserAgent.fireFoxVersion || UserAgent.isOpera) return {toCSSStringFirefoxAndOpera: 'toCSSString'};
        if (UserAgent.isIE) return {toCSSStringIE: 'toCSSString'};
        if (UserAgent.webKitVersion) return {toCSSStringWebkit: 'toCSSString'};
        return {toCSSStringUnknown: 'toCSSString'};
    })(),
})

lively.morphic.Rendering.RenderContext.subclass('lively.morphic.HTML.RenderContext',
'settings', {
    renderContextTableName: 'htmlDispatchTable',
});

lively.morphic.Morph.addMethods(
'HTML render settings', {
    htmlDispatchTable: {
        replaceRenderContext: 'replaceRenderContextHTML',
        init: 'initHTML',
        append: 'appendHTML',
        remove: 'removeHTML',
        triggerEvent: 'triggerEventHTML',
        setTransform: 'setTransformHTML',
        setPosition: 'setPositionHTML',
        setRotation: 'setRotationHTML',
        setExtent: 'setExtentHTML',
        setScale: 'setScaleHTML',
        setVisible: 'setVisibleHTML',
        adjustOrigin: 'adjustOriginHTML',
        setPivotPoint: 'setPivotPointHTML',
        setClipMode: 'setClipModeHTML',
        showsVerticalScrollBar: 'showsVerticalScrollBarHTML',
        showsHorizontalScrollBar: 'showsHorizontalScrollBarHTML',
        getScrollBarExtent: 'getScrollBarExtentHTML',
        setHandStyle: 'setHandStyleHTML',
        setPointerEvents: 'setPointerEventsHTML',
        setToolTip: 'setToolTipHTML',
        focus: 'focusHTML',
        blur: 'blurHTML',
        setFocusable: 'setFocusableHTML',
    },
},
'udpating', {
    setTransformHTML: function(ctx, value) {
    },
    setPositionHTML: function(ctx, value) {
        if (ctx.morphNode)
            ctx.domInterface.setPosition(ctx.morphNode, value);
    },
    setRotationHTML: function(ctx, rad) {
        if (ctx.morphNode)
            ctx.domInterface.setHTMLTransform(ctx.morphNode, rad, this.getScale(), this.getPivotPoint());
    },
    setExtentHTML: function(ctx, value) {
        if (ctx.morphNode)
            ctx.domInterface.setExtent(ctx.morphNode, value);
    },
    setScaleHTML: function(ctx, scale) {
        if (ctx.morphNode)
            ctx.domInterface.setHTMLTransform(ctx.morphNode, this.getRotation(), scale, this.getPivotPoint());
    },
    setVisibleHTML: function(ctx, bool) {
        if (ctx.morphNode)
            ctx.morphNode.style.visibility = bool ? '' : 'hidden';
    },
    adjustOriginHTML: function(ctx, value) {
    },
    setPivotPointHTML: function(ctx, value) {
        ctx.domInterface.setHTMLTransform(ctx.morphNode, this.getRotation(), this.getScale(), value);
    },
    setClipModeHTML: function(ctx, modeString) {
        this.shape && this.shape.setClipMode(modeString);
    },
    showsHorizontalScrollBarHTML: function(ctx) {
        if (!ctx.shapeNode) return false;
        var fullHeight = ctx.shapeNode.offsetHeight - this.getBorderWidth()*2,
            innerHeight = ctx.shapeNode.clientHeight;
        return innerHeight > 0 && fullHeight !== innerHeight;
    },
    showsVerticalScrollBarHTML: function(ctx) {
        if (!ctx.shapeNode) return false;
        var fullWidth = ctx.shapeNode.offsetWidth - this.getBorderWidth()*2,
            innerWidth = ctx.shapeNode.clientWidth;
        return innerWidth > 0 && fullWidth !== innerWidth;
    },
    getScrollBarExtentHTML: function(ctx) {
        if (!this.constructor.prototype._cachedScrollBarExtent)
            this.constructor.prototype._cachedScrollBarExtent =
                ctx.domInterface.computeScrollBarExtentHTML();
        return this.constructor.prototype._cachedScrollBarExtent;
    },
    setHandStyleHTML: function(ctx, styleName) {
        if (!ctx.morphNode) return;
        if (!styleName || styleName == '') ctx.morphNode.style.cursor = null;
        else ctx.morphNode.style.cursor = styleName;
    },
    setToolTipHTML: function(ctxt, string) {
        if (ctxt.morphNode)
            ctxt.morphNode.setAttribute('title', string)
    },
},
'rendering', {
    renderWithHTML: function() {
        this.replaceRenderContextCompletely(new lively.morphic.HTML.RenderContext());
    },
    initHTML: function(ctx) {
        if (!ctx.morphNode) ctx.morphNode = ctx.domInterface.htmlRect();
        this.setFocusableHTML(ctx, this.isFocusable());
        this.setPivotPointHTML(ctx, this.getPivotPoint())
        ctx.domInterface.setHTMLTransformOrigin(ctx.morphNode, pt(0,0));
        this.setPositionHTML(ctx, this.getPosition());
        this.setRotationHTML(ctx, this.getRotation());
        this.setScaleHTML(ctx, this.getScale());
        this.setClipModeHTML(ctx, this.getClipMode());
        this.setHandStyleHTML(ctx, this.getHandStyle());
        this.setPointerEventsHTML(ctx, this.getPointerEvents());
        if (this.morphicGetter('Visible') === false)
            this.setVisibleHTML(ctx, false);
        var tooltip = this.morphicGetter('ToolTip');
        tooltip && this.setToolTipHTML(ctx, tooltip);
        if (UserAgent.fireFoxVersion)
            ctx.morphNode['-moz-user-modify'] = 'read-only'
    },
    appendHTML: function(ctx, optMorphAfter) {
        if (!ctx.morphNode) throw dbgOn(new Error('no ctx.morphNode!'));
        var parentNode = ctx.morphNode.parentNode;
        if (!parentNode) {
            var ownerCtx = this.owner && this.owner.renderContext();
            parentNode = (ownerCtx && ownerCtx.shapeNode) || ctx.parentNode;

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
        this.insertMorphNodeInHTML(ctx, ctx.morphNode, parentNode, afterNode, ctx.shapeNode);

        this.getShape().renderUsing(ctx);
    },
    insertMorphNodeInHTML: function(ctx, morphNode, parentNode, optAfterNode) {
        if (!optAfterNode || !$A(parentNode.childNodes).include(optAfterNode)) {
            if (morphNode.parentNode === parentNode) return;
            ctx.domInterface.append(parentNode, morphNode);
            return
        }
        if (morphNode.nextSibling === optAfterNode) return;
        parentNode.insertBefore(morphNode, optAfterNode);
    },
    replaceRenderContextHTML: function(oldCtx, newCtx) {
        oldCtx.removeNode(oldCtx.morphNode);
    },
},
'removing', {
    removeHTML: function(ctx) {
        this.owner && this.owner.removeMorph(this);
        ctx.removeNode(ctx.morphNode);
    },
},
'events', {
    triggerEventHTML: function(ctx, evt) {
        return ctx.morphNode ? ctx.morphNode.dispatchEvent(evt) : null;
    },
    setPointerEventsHTML: function(ctx, value) {
        if (ctx.morphNode) ctx.morphNode.style.pointerEvents = value;
    },
    focusHTML: function(ctx) {
        var node = ctx.morphNode;
        if (node && !this.isFocused() && node.tabIndex !== undefined) node.focus();
    },
    blurHTML: function(ctx) {
        var node = ctx.morphNode;
        if (node && this.isFocused()) node.blur();
    },
    setFocusableHTML: function(ctx, bool) {
        if (!ctx.morphNode) return;
        if (bool) ctx.morphNode.tabIndex = -1;
        else delete ctx.morphNode.tabIndex
    },
});

lively.morphic.World.addMethods(
'HTML render settings', {
    htmlDispatchTable: {
        setScroll: 'setScrollHTML',
    },
},
'scrolling', {
    setScrollHTML: function(ctx, value) {
        var x = value[0], // array conforms to setScroll/getScroll interface
            y = value[1], // of the Scrollable trait
            xDiff = x - window.scrollX,
            yDiff = y - window.scrollY;
        window.scrollBy(xDiff, yDiff);
    }
});

lively.morphic.Text.addMethods(
'HTML render settings', {
    htmlDispatchTable: {
        updateText: 'updateTextHTML',
        setTextExtent: 'setTextExtentHTML',
        setMaxTextWidth: 'setMaxTextWidthHTML',
        setMaxTextHeight: 'setMaxTextHeightHTML',
        setMinTextWidth: 'setMinTextWidthHTML',
        setMinTextHeight: 'setMinTextHeightHTML',
        getTextExtent: 'getTextExtentHTML',
        getTextString: 'getTextStringHTML',
        ignoreTextEvents: 'ignoreTextEventsHTML',
        unignoreTextEvents: 'unignoreTextEventsHTML',
        enableTextEvents: 'enableTextEventsHTML',
        setFontFamily: 'setFontFamilyHTML',
        setFontSize: 'setFontSizeHTML',
        setTextColor: 'setTextColorHTML',
        setPadding: 'setPaddingHTML',
        setAlign: 'setAlignHTML',
        setVerticalAlign: 'setVerticalAlignHTML',
        setDisplay: 'setDisplayHTML',
        setWhiteSpaceHandling: 'setWhiteSpaceHandlingHTML',
        focusMorph: 'focusMorphHTML'
    },
},
'rendering', {
    initHTML: function($super, ctx) {
        if (!ctx.textNode) ctx.textNode = this.createTextNodeHTML();
        $super(ctx);
        this.setFontSizeHTML(ctx, this.getFontSize());
        this.setFontFamilyHTML(ctx, this.getFontFamily());
        this.setAlignHTML(ctx, this.getAlign());
        this.setVerticalAlignHTML(ctx, this.getVerticalAlign());
        this.setDisplayHTML(ctx, this.getDisplay());
        this.setTextColorHTML(ctx, this.getTextColor());
        this.setWhiteSpaceHandlingHTML(ctx, this.getWhiteSpaceHandling());
        this.fit();
        if (this.textChunks)
            this.textChunks.forEach(function(chunk) { chunk.addTo(this) }, this)
        else
            this.updateTextHTML(ctx, this.textString);
    },
    appendHTML: function($super, ctx, optMorphAfter) {
        $super(ctx, optMorphAfter);
        this.appendTextHTML(ctx);
        this.fit();
    },
    appendTextHTML: function(ctx) {
        if (!ctx.morphNode) throw dbgOn(new Error('appendText: no morphNode!'))
        if (!ctx.shapeNode) throw dbgOn(new Error('appendText: no shapeNode!'))
        if (!ctx.textNode) throw dbgOn(new Error('appendText: no textNode!'))
        ctx.shapeNode.appendChild(ctx.textNode);
    },
    updateTextHTML: function(ctx, string) {
        this.firstTextChunk().textString = string;
    },
},
'accessing', {
    getTextExtentHTML: function(ctx) {
        if (!ctx.textNode) return pt(0,0);
        return ctx.textNode.scrollHeight != 0 ?
            pt(ctx.textNode.scrollWidth, ctx.textNode.scrollHeight) : this.getExtent();
    },
    setTextExtentHTML: function(ctx, value) {
        if (ctx.textNode)
            ctx.domInterface.setExtent(ctx.textNode, value);
    },

    setMaxTextWidthHTML: function(ctx, value) {
        if (ctx.textNode)
            ctx.domInterface.setMaxWidth(ctx.textNode, value);
    },
    setMaxTextHeightHTML: function(ctx, value) {
        if (ctx.textNode)
            ctx.domInterface.setMaxHeight(ctx.textNode, value);
    },
    setMinTextHeightHTML: function(ctx, value) {
        if (ctx.textNode)
            ctx.domInterface.setMinHeight(ctx.textNode, value);
    },
    setMinTextWidthHTML: function(ctx, value) {
        if (ctx.textNode)
            ctx.domInterface.setMinWidth(ctx.textNode, value);
    },
    getTextStringHTML: function(ctx) { return ctx.textNode ? ctx.textNode.textContent : '' },
    setFontSizeHTML: function(ctx, size) {
        if (ctx.textNode)
            ctx.textNode.style.fontSize = size + 'pt'
    },
    setFontFamilyHTML: function(ctx, fontName) {
        if (ctx.textNode)
            ctx.textNode.style.fontFamily = fontName
    },
    setTextColorHTML: function(ctx, color) {
        if (ctx.textNode) {
            if (color && color.toCSSString) color = color.toCSSString();
            ctx.textNode.style.color = color
        }
    },
    setPaddingHTML: function(ctx, r) {
        // TODO Deprecated, to be removed
        console.warn('lively.morphic.Text>>setPaddingHTML should not be called anymore!!!')
    },
    setAlignHTML: function(ctx, alignMode) {
        if (!ctx.textNode) return;
        ctx.textNode.style.textAlign = alignMode;
        this.setWhiteSpaceHandling(alignMode === 'justify' ? 'pre-line' : 'pre-wrap');
    },
    setVerticalAlignHTML: function(ctx, valignMode) {
        if (ctx.textNode)
            ctx.textNode.style.verticalAlign = valignMode;
    },
    setDisplayHTML: function(ctx, mode) {
        if (ctx.textNode)
            ctx.textNode.style.display = mode;
    },
    setWhiteSpaceHandlingHTML: function(ctx, modeString) {
        if (ctx.textNode)
            ctx.textNode.style.whiteSpace = modeString || 'normal';
    },
    getWhiteSpaceHandlingHTML: function(ctx) {
        return ctx.textNode ? (ctx.textNode.style.whiteSpace || 'normal') : 'normal';
    },
},
'event management', {
    ignoreTextEventsHTML: function(ctx) {
        if (ctx.textNode)
            ctx.textNode.contentEditable = false;
    },
    unignoreTextEventsHTML: function(ctx) {
        if (ctx.textNode)
            ctx.textNode.contentEditable = true;
    },

    enableTextEventsHTML: function(ctx) {
        if (ctx.textNode)
            ctx.textNode.contentEditable = true;
    },
    focusHTML: function(ctx) {
        var node = ctx.textNode;
        if (node && !this.isFocused() && node.tabIndex !== undefined) node.focus();
    },
    focusMorphHTML: function(ctx) {
        var node = ctx.morphNode;
        if (node && !this.isFocused() && node.tabIndex !== undefined) node.focus();
    },
    blurHTML: function(ctx) {
        var node = ctx.textNode;
        if (node && this.isFocused()) node.blur();
    },
},
'node creation', {
    createTextNodeHTML: function() {
        var node = XHTMLNS.create('div');
        node.contentEditable = true;
        node.className = 'visibleSelection';
        node.style.cssText = 'position: absolute;' + // needed for text extent calculation
                             'word-wrap: break-word;';
        return node;
    },
});

lively.morphic.List.addMethods(
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
        if (!ctx.listNode)
            ctx.listNode = this.createListNodeHTML();
        ctx.subNodes = [];
        $super(ctx);
        if (this.shape) // FIXME should also be done when no shape exists...?
            this.updateList(this.itemList || [])
        if (this.isDropDownList) this.renderAsDropDownListHTML(ctx);
        if (this.isMultipleSelectionList) this.enableMultipleSelectionsHTML(ctx);
        this.setFontSizeHTML(ctx, this.getFontSize())
        this.setFontFamilyHTML(ctx, this.getFontFamily())
    },
    appendHTML: function($super, ctx, optMorphAfter) {
        $super(ctx, optMorphAfter);
        this.appendListHTML(ctx);
    },
    appendListHTML: function(ctx) {
        ctx.shapeNode.appendChild(ctx.listNode);
        this.resizeListHTML(ctx);
    },
    setClipModeHTML: function(ctx, modeString) {
        ctx.listNode.style.overflow = modeString || 'auto';
    },
    setSizeHTML: function(ctx, size) {
        if (ctx.listNode) ctx.listNode.size = size;
    },
    setSize: function(size) {
        this.renderContextDispatch('setSize', size);
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
    updateListContentHTML: function(ctx, itemStrings) {
        if (!itemStrings) itemStrings = [];
        var scroll = this.getScroll();
        if(!ctx || !ctx.subNodes) return;
        if (ctx.subNodes.length > 0) this.removeListContentHTML(ctx);
        var extent = this.getExtent();
        for (var i = 0; i < itemStrings.length; i++) {
            var option = XHTMLNS.create('option');
            option.textContent = itemStrings[i];
            ctx.listNode.appendChild(option);
            ctx.subNodes.push(option);
        }
        this.resizeListHTML(ctx);
        this.selectAllAtHTML(ctx, [this.selectedLineNo]);
    },
    resizeListHTML: function(ctx) {
        var borderWidth = this.getBorderWidth(),
            extent = this.getExtent().subPt(pt(2*borderWidth, 2*borderWidth)),
            listNode = ctx.listNode;
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
        ctx.subNodes.forEach(function(ea) { ea.selected = false })
    },
},
'drop down support HTML', {
    renderAsDropDownListHTML: function(ctx) {
        if (ctx.listNode) ctx.listNode.size = 1
    },
},
'multiple selection support HTML', {
    enableMultipleSelectionsHTML: function(ctx) {
        if (ctx.listNode) ctx.listNode.multiple = true;
    },
    getSelectedIndexesHTML: function(ctx) {
        var indexes = ctx.subNodes
            .collect(function(ea, i) { return ea.selected && i })
            .select(function(idxOrNull) { return idxOrNull || idxOrNull === 0 })
        return indexes;
    },
    deselectAtHTML: function(ctx, idx) {
        if (!ctx.listNode) return;
        if (idx < 0 || idx >= this.itemList.length) reurn;
        var node = ctx.subNodes[idx];
        if (node) node.selected = false;
    },
    selectAllAtHTML: function(ctx, indexes) {
        if (!ctx.listNode) return;
        for (var i = 0; i < indexes.length; i++) {
            var idx = indexes[i];
            if (idx < 0 || idx >= this.itemList.length) continue;
            var node = ctx.subNodes[idx];
            if (!node) continue;
            node.selected = true;
            if (node.scrollIntoViewIfNeeded) // no Firefox support
                node.scrollIntoViewIfNeeded();
        }
    },
    clearSelectionsHTML: function(ctx) { this.deselectNodesHTML(ctx) },
},
'node creation', {
    createListNodeHTML: function() {
        var node = XHTMLNS.create('select');
        node.size = 2; // hmm 1 is drop downlist, any value hight is normal list
        node.style.cssText = 'white-space: pre';
        node.className = 'visibleSelection';
        return node;
    },
    getListExtentHTML: function(ctx) {
        return ctx.listNode.scrollHeight != 0 ? pt(ctx.listNode.scrollWidth, ctx.listNode.scrollHeight) : this.getExtent()
    },
},
'styling', {
    setFontSizeHTML: function(ctx, value) {
        if (ctx.listNode) ctx.listNode.style.fontSize = value + 'pt'
    },
    setFontFamilyHTML: function(ctx, value) {
        if (ctx.listNode) ctx.listNode.style.fontFamily = value
    },
});

lively.morphic.Shapes.Shape.addMethods(
'HTML render settings', {
    htmlDispatchTable: {
        init: 'initHTML',
        appendShape: 'renderHTML',
        setPosition: 'setPositionHTML',
        setExtent: 'setExtentHTML',
        setPadding: 'setPaddingHTML',
        setFill: 'setFillHTML',
        setBorderColor: 'setBorderColorHTML',
        setBorderWidth: 'setBorderWidthHTML',
        setStrokeOpacity: 'setStrokeOpacityHTML',
        setBorderRadius: 'setBorderRadiusHTML',
        setBorderStyle: 'setBorderStyleHTML',
        setOpacity: 'setOpacityHTML',
        setClipMode: 'setClipModeHTML',
    },
},
'initializing', {
    initHTML: function(ctx) {
        if (!ctx.shapeNode)
            throw new Error('Cannot call Shape>>initHTML because no shapeNode exists')
        this.setPositionHTML(ctx, this.getPosition());
        this.setExtentHTML(ctx, this.getExtent());
        this.setFillHTML(ctx, this.getFill());
        this.setFillOpacity(this.getFillOpacity())
        this.setOpacityHTML(ctx, this.getOpacity());
        this.setBorderWidthHTML(ctx, this.getBorderWidth()); // The other border props are initialized there as well
        this.setBorderStyleHTML(ctx, this.getBorderStyle());
        this.setClipModeHTML(ctx, this.getClipMode());
        this.setPaddingHTML(ctx, this.getPadding()); // also sets extent
        if (UserAgent.fireFoxVersion)
            ctx.shapeNode['-moz-user-modify'] = 'read-only'
    },
    renderHTML: function(ctx) {
        if (ctx.shapeNode.parentNode) return;
        var child = ctx.morphNode.childNodes[0];
        if (!child) ctx.morphNode.appendChild(ctx.shapeNode)
        else ctx.morphNode.insertBefore(ctx.shapeNode, child)
    },
},
'updating', {
    setPositionHTML: function(ctx, value) {
        if (!ctx.shapeNode) return;
        ctx.domInterface.setPosition(ctx.shapeNode, value);
        if (ctx.originNode) {
            this.compensateShapeNode(ctx);
        }
    },
    setExtentHTML: function(ctx, value) {
        if (!ctx.shapeNode) return;
        var padding = this.getPadding(),
            paddingWidth = padding.left() + padding.right(),
            paddingHeight = padding.top() + padding.bottom(),
            // HTML isn't using fractions for pixels, rounds internally,
            // this has to be reflected to compensate HTML's box model
            borderWidth = Math.floor(this.getBorderWidth()),
            realExtent = value
                         .addXY(-2 * borderWidth, -2 * borderWidth)
                         .addXY(-paddingWidth, -paddingHeight);
        ctx.domInterface.setExtent(ctx.shapeNode, realExtent);
    },
    setFillHTML: function(ctx, value) {
        if (!ctx.shapeNode) return;
        ctx.domInterface.setFill(ctx.shapeNode, value, this.getBounds());
    },
    setBorderColorHTML: function(ctx, fill) {
        return this.setBorderHTML(ctx, this.getBorderWidth(), fill, this.getStrokeOpacity())
    },
    setBorderStyleHTML: function(ctx, value) {
        if (ctx.shapeNode) ctx.shapeNode.style.borderStyle = value;
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
        if ((fill instanceof Color) && opacity) fill = fill.withA(opacity);
        if (!fill) fill = Color.rgba(0,0,0,0);
        ctx.shapeNode.style['border'] = this.getBorderStyle() + ' ' + width + 'px ' +
            fill.toCSSString(this.getBounds(), ctx.domInterface.html5CssPrefix);
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
        ctx.shapeNode.style.opacity = value;
    },
    setClipModeHTML: function(ctx, modeString) {
        if (ctx.shapeNode) ctx.shapeNode.style.overflow = modeString || 'auto';
    },
    setPaddingHTML: function(ctx, r) {
        if (r === undefined || !ctx.shapeNode) return r;
        // Rectangle.inset(left, top, right, bottom) ==>
        // CSS padding: [padding-top] [padding-right] [padding-bottom] [padding-left]
        var s = r.top() + "px " + r.right() + "px " + r.bottom() + "px " + r.left() + "px";
        ctx.shapeNode.style.padding = s;
        return r;
    },
});

lively.morphic.Shapes.Rectangle.addMethods(
'rendering', {
    initHTML: function($super, ctx) {
        if (!ctx.shapeNode)
            ctx.shapeNode = ctx.domInterface.htmlRect();
        $super(ctx);
        this.setBorderRadiusHTML(ctx, this.getBorderRadius());
    },
},
'updating', {
    setBorderRadiusHTML: function(ctx, value) {
        if (Object.isString(value)) {
            // irregular border radius for windows e.g.
            ctx.getShapeNode().style.borderRadius = value
        } else {
             ctx.domInterface.setHTMLBorderRadius(ctx.getShapeNode(), value, value)
        }
    },
});

lively.morphic.Shapes.Ellipse.addMethods(
'rendering', {
    initHTML: function($super, ctx) {
        // border radius is used to make a rectangle into an ellipse
        if (!ctx.shapeNode)
            ctx.shapeNode = ctx.domInterface.htmlRect();
        $super(ctx);
    },
},
'updating', {
    setExtentHTML: function($super, ctx, value) {
        $super(ctx, value);
        if (ctx.shapeNode)
            ctx.domInterface.setHTMLBorderRadiusPoint(ctx.shapeNode, value);
    },
    setBorderRadiusHTML: function(ctx, value) {
        // ellipses border radius are the radius of the ellipse itself
        return;
    },
});

lively.morphic.Shapes.Image.addMethods(
'HTML render settings', {
    htmlDispatchTable: {
        setImageURL: 'setImageURLHTML',
        getNativeExtent: 'getNativeExtentHTML',
    },
},
'rendering', {
    initHTML: function($super, ctx) {
        if (!ctx.shapeNode) {
            ctx.shapeNode = XHTMLNS.create('div');
            ctx.imgNode = ctx.domInterface.htmlImg();
            ctx.shapeNode.appendChild(ctx.imgNode);
            ctx.imgNode.draggable = false;
        }
        $super(ctx);
        this.setImageURLHTML(ctx, this.getImageURL());
    },
},
'updating', {
    setImageURLHTML: function(ctx, urlString) {
        if (!ctx.imgNode) return;
        var shape = this;
        ctx.imgNode.onload = function(evt) { shape.isLoaded = true }
        ctx.imgNode.src = urlString;
    },
},
'accessing', {
    getNativeExtentHTML: function(ctx) {
        return pt(ctx.imgNode.naturalWidth, ctx.imgNode.naturalHeight)
    },
    setExtentHTML: function($super, ctx, value) {
        $super(ctx, value);
        var extentWithoutBorder = value.addXY(-2*this.getBorderWidth(), -2*this.getBorderWidth());
        if (ctx.imgNode)
            ctx.domInterface.setExtent(ctx.imgNode, extentWithoutBorder);
    },

});

lively.morphic.Shapes.External.addMethods(
'HTML render settings', {
    htmlDispatchTable: {
        getExtent: 'getExtentHTML',
    },
},
'rendering', {
    initHTML: function($super, ctx) {
        ctx.shapeNode = this.shapeNode;
    },
},
'accessing', {
    getExtentHTML: function(ctx) {
        var node = ctx.shapeNode;
        return node ? pt(node.offsetWidth, node.offsetHeight) : pt(0,0);
    },
    setOpacityHTML: function(ctx, value) { if (ctx.shapeNode.style) ctx.shapeNode.style.opacity = value; },

});

lively.morphic.Shapes.Path.addMethods(
'HTML render settings', {
    htmlDispatchTable: {
        getPathNode: 'getPathNodeHTML',
        setPathElements: 'setPathElementsHTML',
        getPathBounds: 'getPathBoundsHTML',
        getTotalLength: 'getTotalLengthHTML',
        getPointAtTotalLength: 'getPointAtTotalLengthHTML',
    },
},
'HTML rendering', {
    initHTML: function(ctx) {
        if (!ctx.shapeNode) {
            ctx.shapeNode = XHTMLNS.create('div');
            ctx.svgNode = NodeFactory.create('svg', {style: 'position: absolute'}); // otherwise there can be a line offset
            ctx.shapeNode.appendChild(ctx.svgNode);
            ctx.pathNode = NodeFactory.create('path');
            ctx.svgNode.appendChild(ctx.pathNode);
        }
        lively.morphic.Shapes.Shape.prototype.initHTML.call(this, ctx); //$super(ctx);
        this.setBorderColorHTML(ctx, this.getBorderColor());
        this.setPathElementsHTML(ctx, this.getPathElements());
    },
},
'accessing', {
    setPathElementsHTML: function(ctx, elements) {
        var pathNode = this.getPathNodeHTML(ctx);
        if (!pathNode) return;
        pathNode.setAttributeNS(null, "d", this.createSVGDataFromElements(elements));
        var bounds = this.getBounds();

        this.setBounds(bounds);
        ctx.domInterface.setSVGViewbox(ctx.svgNode, bounds);
    },

    setExtentHTML: function(ctx, value) {
        ctx.domInterface.setExtent(ctx.svgNode, value);
    },
    setFillHTML: function(ctx, value) {
        if (ctx.svgNode)
            ctx.domInterface.setFill(ctx.svgNode, value, this.getBounds());
    },
    setBorderStyleHTML: function(ctx, value) {
        if (value == 'dashed')
            ctx.svgNode.setAttribute('stroke-dasharray', '7 4')
        else if (value == 'dotted')
            ctx.svgNode.setAttribute('stroke-dasharray', '2 2')
        else
            ctx.svgNode.removeAttribute('stroke-dasharray')
    },
    setBorderColorHTML: function(ctx, fill) {
        ctx.domInterface.setSVGFillOrStrokePaint(this.getPathNodeHTML(ctx), 'stroke', fill)
    },
    setBorderWidthHTML: function(ctx, value) {
        var node = this.getPathNodeHTML(ctx);
        node && node.setAttribute('stroke-width', String(value));

        // borderWidth affects the bounds and the svg viewBox to extend the path equally into all directions
        var bounds = this.getBounds();
        this.setBounds(bounds);
        ctx.domInterface.setSVGViewbox(ctx.svgNode, bounds);
    },
},
'svg specific', {
    setElementsFromSVGData: function(data) {
        var elements = lively.morphic.Shapes.PathElement.parse(data);
        this.setPathElements(elements);
    },
    getPathNodeHTML: function(ctx) { return ctx.pathNode },
    getDefsNodeHTML: function(ctx) {
        var defNode = ctx.svgNode.getElementsByTagName('defs')[0];
        if (!defNode) {
            defNode = NodeFactory.create('defs');
            ctx.svgNode.insertBefore(defNode, ctx.svgNode.childNodes[0]);
        }
        return defNode;
    },

getPathBoundsHTML: function (ctx) {
        var pathNode = this.getPathNodeHTML(ctx),
            bb = ctx.domInterface.isInDOM(ctx.morphNode) && pathNode && Rectangle.ensure(pathNode.getBBox()),
            offset = pt(0,0);

        // svg.getBBox() doesn't work for horizontal and vertical lines: it doesn't reflects widths
        if (!bb) bb = Rectangle.unionPts(this.vertices());

        // adapt bounds so that lines are extented in all directions and
        // the viewBox always shows complete rectangular lines
        var strokeWidth = this.getBorderWidth();
        bb.width = bb.width + strokeWidth;
        bb.x = bb.x - strokeWidth / 2 + offset.x;
        bb.height = bb.height + strokeWidth;
        bb.y = bb.y - strokeWidth / 2 + offset.y;

        // HTML height and width need integers, the viewbox accepts floats, but both should start at the same point
        bb.x = Math.floor(bb.x);
        bb.y = Math.floor(bb.y);

        // HTML height and width of the element can't be fractions, we round up to leave enough space for the viewbox
        bb.width = Math.ceil(bb.width);
        bb.height = Math.ceil(bb.height);

        return bb;
    },

    getTotalLengthHTML: function(ctx) {
        var pathNode = this.getPathNodeHTML(ctx);
        return pathNode && pathNode.getTotalLength()
    },
    getPointAtTotalLengthHTML: function(ctx, totalLength) {
        var pathNode = this.getPathNodeHTML(ctx);
        return pathNode && lively.Point.ensure(pathNode.getPointAtLength(totalLength));
    },
});

}) // end of module
