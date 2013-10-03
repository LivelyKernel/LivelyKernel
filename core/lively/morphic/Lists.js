module('lively.morphic.Lists').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.morphic.TextCore', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Box.subclass('lively.morphic.OldList', Trait('ScrollableTrait'),
'documentation', {
    connections: {
        selection: {},
        itemList: {},
        selectedLineNo: {}
    }
},
'settings', {
    style: {
        borderColor: Color.black,
        borderWidth: 0,
        fill: Color.gray.lighter().lighter(),
        clipMode: 'auto',
        fontFamily: 'Helvetica',
        fontSize: 10,
        enableGrabbing: false
    },
    selectionColor: Color.green.lighter(),
    isList: true
},
'initializing', {
    initialize: function($super, bounds, optItems) {
        $super(bounds);
        this.itemList = [];
        this.selection = null;
        this.selectedLineNo = -1;
        if (optItems) this.updateList(optItems);
    },
},
'accessing', {
    setExtent: function($super, extent) {
        $super(extent);
        this.resizeList();
    },
    getListExtent: function() { return this.renderContextDispatch('getListExtent') }
},
'list interface', {
    getMenu: function() { /*FIXME actually menu items*/ return [] },
    updateList: function(items) {
        this.clearSelections();
        this.itemList = items || [];
        var itemStrings = items.collect(function(ea) {
            return this.renderFunction(ea); }, this);
        this.renderContextDispatch('updateListContent', itemStrings);
        if (!this.selection)  return
        var newIndexForOldSelection = this.find(this.selection);
        if (!Object.isNumber(newIndexForOldSelection))
            this.selectAt(-1);
        else if (this.selectedLineNo !== newIndexForOldSelection)
            lively.bindings.noUpdate(this.selectAt.bind(this,newIndexForOldSelection));
    },
    addItem: function(item) {
        this.updateList(this.itemList.concat([item]));
    },

    selectAt: function(idx) {
        if (!this.isMultipleSelectionList) this.clearSelections();
        this.renderContextDispatch('selectAllAt', [idx]);
        this.updateSelectionAndLineNoProperties(idx);
    },

    saveSelectAt: function(idx) {
        this.selectAt(Math.max(0, Math.min(this.itemList.length-1, idx)));
    },

    deselectAt: function(idx) { this.renderContextDispatch('deselectAt', idx) },

    updateSelectionAndLineNoProperties: function(selectionIdx) {
        var item = this.itemList[selectionIdx];
        this.selectedLineNo = Object.isNumber(selectionIdx) ? selectionIdx : -1;
        this.selection = item && (item.value !== undefined) ? item.value : item;
    },

    setList: function(items) { return this.updateList(items) },
    getList: function() { return this.itemList },
    getValues: function() {
        return this.getList().collect(function(ea) { return ea.isListItem ? ea. value : ea})
    },

    setSelection: function(sel) {
        this.selectAt(this.find(sel));
    },
    getSelection: function() { return this.selection },
    getItem: function(value) {
        return this.itemList[this.find(value)];
    },
    removeItemOrValue: function(itemOrValue) {
        var idx = this.find(itemOrValue), item = this.itemList[idx];
        this.updateList(this.itemList.without(item));
        return item;
    },

    getSelectedItem: function() {
        return this.selection && this.selection.isListItem ?
            this.selection : this.itemList[this.selectedLineNo];
    },
    moveUpInList: function(itemOrValue) {
        if (!itemOrValue) return;
        var idx = this.find(itemOrValue);
        if (idx === undefined) return;
        this.changeListPosition(idx, idx-1);
    },
    moveDownInList: function(itemOrValue) {
        if (!itemOrValue) return;
        var idx = this.find(itemOrValue);
        if (idx === undefined) return;
        this.changeListPosition(idx, idx+1);
    },
    clearSelections: function() { this.renderContextDispatch('clearSelections') }

},
'private list functions', {
    changeListPosition: function(oldIdx, newIdx) {
        var item = this.itemList[oldIdx];
        this.itemList.removeAt(oldIdx);
        this.itemList.pushAt(item, newIdx);
        this.updateList(this.itemList);
        this.selectAt(newIdx);
    },
    resizeList: function(idx) {
        return this.renderContextDispatch('resizeList');
    },
    find: function(itemOrValue) {
        // returns the index in this.itemList
        for (var i = 0, len = this.itemList.length; i < len; i++) {
            var val = this.itemList[i];
            if (val === itemOrValue
             || (val && val.isListItem
              && val.value === itemOrValue)) return i;
        }
        // return -1?
        return undefined;
    }

},
'styling', {
    applyStyle: function($super, spec) {
        if (spec.fontFamily !== undefined) this.setFontFamily(spec.fontFamily);
        if (spec.fontSize !== undefined) this.setFontSize(spec.fontSize);
        return $super(spec);
    },
    setFontSize: function(fontSize) { return  this.morphicSetter('FontSize', fontSize) },
    getFontSize: function() { return  this.morphicGetter('FontSize') || 10 },
    setFontFamily: function(fontFamily) { return  this.morphicSetter('FontFamily', fontFamily) },
    getFontFamily: function() { return this.morphicSetter('FontFamily') || 'Helvetica' }
},
'multiple selection support', {
    enableMultipleSelections: function() {
        this.isMultipleSelectionList = true;
        this.renderContextDispatch('enableMultipleSelections');
    },
    getSelectedItems: function() {
        var items = this.itemList;
        return this.getSelectedIndexes().collect(function(i) { return items[i] });
    },

    getSelectedIndexes: function() { return this.renderContextDispatch('getSelectedIndexes'); },

    getSelections: function() {
        return this.getSelectedItems().collect(function(ea) { return ea.isListItem ? ea.value : ea; })
    },
    setSelections: function(arr) {
        var indexes = arr.collect(function(ea) { return this.find(ea) }, this);
        this.selectAllAt(indexes);
    },
    setSelectionMatching: function(string) {
        for (var i = 0; i < this.itemList.length; i++) {
            var itemString = this.itemList[i].string || String(this.itemList[i]);
            if (string == itemString) this.selectAt(i);
        }
    },
    selectAllAt: function(indexes) {
        this.renderContextDispatch('selectAllAt', indexes)
    },

    renderFunction: function(anObject) {
        return anObject.string || String(anObject);
    }
},
'change event handling', {
    inputEventTriggeredChange: function() {
        // this is to ensure that the selection is only set once
        this.selectionTriggeredInInputEvent = true;
        var self = this;
        (function() { delete self.selectionTriggeredInInputEvent }).delay(0);
    }
},
'mouse events', {
    disableList: function() {
        this.renderContextDispatch('disableList');
    },
    enableList: function() {
        this.renderContextDispatch('enableList');
    },
    onMouseDownEntry: function($super, evt) {
        if (evt.isCommandKey()) {
            this.disableList();
            this.enableList.bind(this).delay(0);
        }
        return $super(evt);
    },
    onMouseDown: function(evt) {
        if (evt.isCommandKey()) {
            evt.preventDefault()
            return false;
        }

        if (evt.isRightMouseButtonDown()) {
            // delayed because when owner is a window and comes forward the window
            // would be also in front of the new menu
            var sel = this.selection ? this.selection.string : this.selection;
            lively.morphic.Menu.openAt.curry(evt.getPosition(), sel, this.getMenu()).delay(0.1);
            evt.stop();
            return true;
        }

        return false;
    },
    onMouseUp: function (evt) {
        if (evt.isLeftMouseButtonDown()) {
            var idx = this.renderContextDispatch('getItemIndexFromEvent', evt);
            // don't update when selection can't be found
            // this happens e.g. when clicked on a scrollbar
            if (idx >= 0) {
                this.inputEventTriggeredChange();
                this.updateSelectionAndLineNoProperties(idx);
            }

            if (idx >= 0 && this.isMultipleSelectionList && evt.isShiftDown()) {
                if (this.getSelectedIndexes().include(idx))
                    this.deselectAt(idx)
                else
                    this.selectAt(idx);
            }
        }
        return true;
    },
    onMouseUpEntry: function ($super, evt) {
        var completeClick = evt.world && evt.world.clickedOnMorph === this;

        if (completeClick && evt.isRightMouseButtonDown()) {
            return false;
        }
        return $super(evt)
    },
    onMouseOver: function(evt) {
        /*if (this.selectOnMove) {
            var idx = this.selectItemFromEvt(evt);
            evt.stopPropagation();
            return idx > -1;
        }*/
        return false;
    },
    onMouseMove: function(evt) {
        evt.stop();
        return true;
    },

    selectItemFromEvt: function(evt) {
        var idx = this.renderContextDispatch('getItemIndexFromEvent', evt);
        this.selectAt(idx);
        return idx;
    },
},
'keyboard events', {
    onUpPressed: function($super, evt) {
        if (evt.isCommandKey()) return $super(evt);
        evt.stop();
        this.selectAt(Math.max(0, Math.min(this.itemList.length-1, this.selectedLineNo-1)));
        return true;
    },
    onDownPressed: function($super, evt) {
        if (evt.isCommandKey()) return $super(evt);
        evt.stop();
        this.selectAt(Math.max(0, Math.min(this.itemList.length-1, this.selectedLineNo+1)));
        return true;
    },

},
'scrolling', {

    basicGetScrollableNode: function(evt) {
        return this.renderContext().listNode;
    },

    onMouseWheel: function(evt) {
        this.stopScrollWhenBordersAreReached(evt);
        return false;
    },

    correctForDragOffset: function(evt) {
        return false;
    },

    onChange: function(evt) {
        if (this.selectionTriggeredInInputEvent) {
            delete this.selectionTriggeredInInputEvent;
            return false;
        }
        var idx = this.renderContextDispatch('getSelectedIndexes').first();
        this.updateSelectionAndLineNoProperties(idx);
        this.changeTriggered = true; // see onBlur
        return false;
    }

});

lively.morphic.OldList.subclass('lively.morphic.DropDownList',
'properties', {
    // triggers correct rendering
    isDropDownList: 'true'
},
'initializing', {
    initialize: function($super, bounds, optItems) {
        $super(bounds, optItems);
    }
},
'mouse events', {
    onMouseDown: function(evt) {
        this.changeTriggered = false; // see onBlur
        if (!evt.isCommandKey()) return true;
        evt.preventDefault()
        return false;
     },

    onChange: function (evt) {
        // FIXME duplication with List
        var idx = this.renderContextDispatch('getSelectedIndexes').first();
        this.updateSelectionAndLineNoProperties(idx);
        this.changeTriggered = true; // see onBlur
        return false;
    },

    onBlur: function(evt) {
        // drop down lists are stupid
        // onChange is not triggered when the same selection is choosen again
        // however, we want to now about any selection
        // kludge for now: set selection anew when element is blurred...
        if (this.changeTriggered) return;
        var idx = this.renderContextDispatch('getSelectedIndexes').first();
        this.updateSelectionAndLineNoProperties(idx);
    },

    isGrabbable: function(evt) {
        return false; //!this.changeTriggered;
    },

    registerForOtherEvents: function($super, handleOnCapture) {
        $super(handleOnCapture)
        if (this.onBlur) this.registerForEvent('blur', this, 'onBlur', handleOnCapture);
    }

});

lively.morphic.Box.subclass('lively.morphic.MorphList',
// Example:
// list = new lively.morphic.MorphList([1,2,3]).openInWorldCenter()
// list.initializeLayout({type: "vertical",spacing: 5, border: 3});
'settings', {
    style: {
        fill: Color.gray.lighter(3),
        borderColor: Color.gray.lighter(),
        borderWidth: 1,
        borderStyle: 'outset',
        grabbingEnabled: false, draggingEnabled: false
    },
    listItemStyle: {
        fill: null,
        borderColor: Color.gray,
        borderWidth: 1,
        fixedHeight: false,
        fixedWidth: false,
        allowInput: false
    },
    isList: true
},
'initializing', {
    initialize: function($super) {
        var args = Array.from(arguments);
        $super = args.shift();
        var bounds = args[0] && args[0] instanceof lively.Rectangle ?
            args.shift() : lively.rect(0,0, 100,100);
        var items = args[0] && Object.isArray(args[0]) ? args.shift() : [];
        $super(bounds);
        this.itemMorphs = [];
        this.setList(items);
        this.initializeLayout();
    },
    initializeLayout: function(layoutStyle) {
        // layoutStyle: {
        //   type: "tiling"|"horizontal"|"vertical",
        //   spacing: NUMBER,
        //   border: NUMBER
        // }
        var defaultLayout = {
            type: 'tiling',
            border: 0, spacing: 20
        }
        layoutStyle = Object.extend(defaultLayout, layoutStyle || {});
        this.applyStyle({
            fill: Color.white, borderWidth: 0,
            borderColor: Color.black, clipMode: 'auto',
            resizeWidth: true, resizeHeight: true
        })
        var klass;
        switch (layoutStyle.type) {
            case 'vertical': klass = lively.morphic.Layout.VerticalLayout; break;
            case 'horizontal': klass = lively.morphic.Layout.HorizontalLayout; break;
            case 'tiling': klass = lively.morphic.Layout.TileLayout; break;
            default: klass = lively.morphic.Layout.TileLayout; break;
        }
        var layouter = new klass(this);
        layouter.setBorderSize(layoutStyle.border);
        layouter.setSpacing(layoutStyle.spacing);
        this.setLayouter(layouter);
    }
},
"styling", {
    setListItemStyle: function(style) {
        this.listItemStyle = style;
        this.itemMorphs.forEach(function(itemMorph) {
            itemMorph.applyStyle(style);
        });
    },
},
'morphic', {
    addMorph: function($super, morph, optMorphBefore) {
        if (morph.isPlaceholder || morph.isEpiMorph || this.itemMorphs.include(morph)) {
            return $super(morph, optMorphBefore);
        }
        morph.remove();
        var item = morph.item;
        if (!item) {
            var string = morph.isText && morph.textString || morph.toString();
            item = morph.item = {
                isListItem: true,
                string: string,
                value: morph,
                morph: morph
            }
        } else if (!item.morph) {
            item.morph = morph;
        }
        this.addItem(item);
        return morph;
    },
    removeMorph: function($super, morph) {
        if (this.itemMorphs.include(morph)) {
            morph.item && this.removeItemOrValue(morph.item);
        }
        return $super(morph);
    }
},
'morph menu', {
    getMenu: function() { /*FIXME actually menu items*/ return [] }
},
'list interface', {
    renderFunction: function(listItem) {
        if (!listItem) listItem = {isListItem: true, string: 'invalid list item: ' + listItem};
        if (listItem.morph) return listItem.morph;
        var string = listItem.string || String(listItem);
        var listItemMorph = new lively.morphic.Text(lively.rect(0,0,100,20), string);
        listItemMorph.item = listItem;
        listItemMorph.applyStyle(this.listItemStyle);
        return listItemMorph;
    },
    updateList: function(items) {
        if (!items) items = [];
        this.itemList = items;
        var oldItemMorphs = this.itemMorphs;
        this.itemMorphs = items.collect(function(ea) { return this.renderFunction(ea); }, this);
        oldItemMorphs.withoutAll(this.itemMorphs).invoke('remove');
        this.itemMorphs.forEach(function(ea) { this.submorphs.include(ea) || this.addMorph(ea); }, this);
    },

    getItemMorphs: function() { return this.itemMorphs; },

    getItemMorphForListItem: function(listItem) {
        return listItem ?
            this.itemMorphs.detect(function(itemMorph) { return itemMorph.item === listItem; }) :
            null;
    },

    addItem: function(item) {
        this.updateList(this.itemList.concat([item]));
    },

    find: function (itemOrValue) {
        if (!itemOrValue) return undefined;
        // if we hand in a itemListMorph:
        if (itemOrValue.isMorph && itemOrValue.item) itemOrValue = itemOrValue.item;
        // returns the index in this.itemList
        for (var i = 0, len = this.itemList.length; i < len; i++) {
            var val = this.itemList[i];
            if (val === itemOrValue || (val && val.isListItem && val.value === itemOrValue)) {
                return i;
            }
        }
        return undefined;
    },

    selectAt: function(idx) {
        this.selectListItemMorph(this.itemMorphs[idx]);
        this.updateSelectionAndLineNoProperties(idx);
    },
    
    saveSelectAt: function(idx) {
        this.selectAt(Math.max(0, Math.min(this.itemList.length-1, idx)));
    },

    deselectAt: function(idx) {
        // this.renderContextDispatch('deselectAt', idx)
    },

    updateSelectionAndLineNoProperties: function(selectionIdx) {
        var item = this.itemList[selectionIdx];
        this.selectedLineNo = Object.isNumber(selectionIdx) && selectionIdx >= 0 ? selectionIdx : null;
        this.selection = item && (item.value !== undefined) ? item.value : item;
    },

    setList: function(items) { return this.updateList(items); },
    getList: function() { return this.itemList; },
    getValues: function() {
        return this.getList().collect(function(ea) { return ea.isListItem ? ea. value : ea});
    },

    setSelection: function(sel) { return this.selectAt(this.find(sel)); },
    getSelection: function() { return this.selection },
    getItem: function(value) { return this.itemList[this.find(value)]; },
    removeItemOrValue: function(itemOrValue) {
        var idx = this.find(itemOrValue), item = this.itemList[idx];
        this.updateList(this.itemList.without(item));
        return item;
    },

    getSelectedItem: function() {
        var idx = this.find(this.selection);
        if (idx === undefined) return undefined;
        return this.itemList[idx];
    },

    moveItemToIndex: function(itemOrValue, toIndex) {
        if (toIndex < 0 || toIndex >= this.itemList.length) return;
        // update listItems, submorphs and listMorphs order, morph positions
        var fromIndex = this.find(itemOrValue),
            fromItem = this.itemList[fromIndex],
            toItem = this.itemList[toIndex],
            fromMorph = this.getItemMorphForListItem(fromItem),
            toMorph = this.getItemMorphForListItem(toItem),
            fromPos = fromMorph.getPosition(),
            toPos = toMorph.getPosition(),
            fromMorphicIndex = this.submorphs.indexOf(fromMorph),
            toMorphicIndex = this.submorphs.indexOf(toMorph);
        fromMorph.setPosition(toPos);
        toMorph.setPosition(fromPos);
        this.submorphs.swap(fromMorphicIndex, toMorphicIndex);
        this.itemMorphs.swap(fromIndex, toIndex);
        this.itemList.swap(fromIndex, toIndex);
        this.applyLayout();
    },
    moveItemBy: function(itemOrValue, delta) {
        if (!itemOrValue) return;
        var idx = this.find(itemOrValue),
            item = this.itemList[idx];
        if (idx === undefined) return;
        this.moveItemToIndex(item, idx+delta);
    },
    moveUpInList: function(itemOrValue) {
        this.moveItemBy(itemOrValue, +1);
    },
    moveDownInList: function(itemOrValue) {
        this.moveItemBy(itemOrValue, -1);
    },
    clearSelections: function() {
        // this.renderContextDispatch('clearSelections');
    }
},
'multiple selection support', {
    enableMultipleSelections: function() {
        // this.isMultipleSelectionList = true;
        // this.renderContextDispatch('enableMultipleSelections');
    },
    getSelectedItems: function() {
        // var items = this.itemList;
        // return this.getSelectedIndexes().collect(function(i) { return items[i] });
    },

    getSelectedIndexes: function() {
        //return this.renderContextDispatch('getSelectedIndexes');
    },

    getSelections: function() {
        // return this.getSelectedItems().collect(function(ea) { return ea.isListItem ? ea.value : ea; })
    },
    setSelections: function(arr) {
        // var indexes = arr.collect(function(ea) { return this.find(ea) }, this);
        // this.selectAllAt(indexes);
    },
    setSelectionMatching: function(string) {
        // for (var i = 0; i < this.itemList.length; i++) {
        //     var itemString = this.itemList[i].string || String(this.itemList[i]);
        //     if (string == itemString) this.selectAt(i);
        // }
    },
    selectAllAt: function(indexes) {
        // this.renderContextDispatch('selectAllAt', indexes)
    },

    selectListItemMorph: function(itemMorph, doMultiSelect) {
        var selectionCSSClass = 'selected';
        if (!doMultiSelect) {
            this.itemMorphs.forEach(function(ea) {
                if (ea === itemMorph) return;
                ea.removeStyleClassName(selectionCSSClass); }, this);
        }
        if (!itemMorph) { this.selection = null; return; }
        if (itemMorph.hasStyleClassName(selectionCSSClass)) {
            itemMorph.removeStyleClassName(selectionCSSClass);
            this.selection = null;
        } else {
            itemMorph.addStyleClassName(selectionCSSClass);
            this.selection = itemMorph.isListItem ? itemMorph.value : itemMorph;
        }
    },

    getSelectedItemMorphs: function() {
        return this.itemMorphs.select(function(ea) {
            return ea.hasStyleClassName('selected'); });
    }

},
'event handling', {
    getListItemFromEvent: function(evt) {
        var morph = evt.getTargetMorph();
        if (morph.hasOwnListItemBehavior) return null;
        if (this.itemMorphs.include(morph)) return morph;
        var owners = morph.ownerChain();
        if (!owners.include(this)) return null;
        return owners.detect(function(ea) {
            return this.itemMorphs.include(ea); }, this);
    },

    onMouseDown: function onMouseDown(evt) {
        if (evt.isCommandKey()) return false;
        var item = this.getListItemFromEvent(evt);
        if (!item) return false;
        this._mouseDownOn = item.id;
        evt.stop(); return true;
    },
    onMouseUp: function onMouseUp(evt) {
        if (evt.isCommandKey()) return false;
        var item = this.getListItemFromEvent(evt);
        if (!item) return false;
        var clickedDownId = this._mouseDownOn;
        delete this._mouseDownOn;
        if (clickedDownId === item.id) {
            this.selectListItemMorph(item, evt.isShiftDown());
        }
        evt.stop(); return true;
    }
});

lively.morphic.Box.subclass('lively.morphic.List', Trait('ScrollableTrait'),
'settings', {
    style: {
        fill: Color.white,
        borderColor: Color.gray.lighter(),
        adjustForNewBounds: true,
        borderWidth: 1,
        borderStyle: 'outset',
        grabbingEnabled: false, draggingEnabled: false
    },
    isList: true
},
'initializing', {
    initialize: function($super) {
        var args = Array.from(arguments);
        $super = args.shift();
        var bounds = args[0] && args[0] instanceof lively.Rectangle ?
            args.shift() : lively.rect(0,0, 100,100),
            items = args[0] && Object.isArray(args[0]) ? args.shift() : [];
        $super(bounds);
        this.isMultipleSelectionList = false;
        this.allowDeselectClick = false;
        this.selectedIndexes = [];
        this.itemMorphs = [];
        this.setList(items);
        this.initializeLayout();
    },

    onrestore: function($super) {
        if (!this.selectedIndexes) this.selectedIndexes = [];
        this.applyStyle({adjustForNewBounds: true});
        var listItemContainer = this.submorphs[0];
        if (listItemContainer) {
            listItemContainer.applyStyle({adjustForNewBounds: true, resizeWidth: true});
            listItemContainer.submorphs.forEach(function(ea) { ea.applyStyle({resizeWidth: true})})
        }
        $super();
    },

    initializeLayout: function(layoutStyle) {
        // // layoutStyle: {
        // //   type: "tiling"|"horizontal"|"vertical",
        // //   spacing: NUMBER,
        // //   border: NUMBER
        // // }
        // var defaultLayout = {
        //     type: 'tiling',
        //     border: 0, spacing: 20
        // }
        // layoutStyle = Object.extend(defaultLayout, layoutStyle || {});
        // this.applyStyle({
        //     fill: Color.white, borderWidth: 0,
        //     borderColor: Color.black, clipMode: 'auto',
        //     resizeWidth: true, resizeHeight: true
        // })
        // var klass;
        // switch (layoutStyle.type) {
        //     case 'vertical': klass = lively.morphic.Layout.VerticalLayout; break;
        //     case 'horizontal': klass = lively.morphic.Layout.HorizontalLayout; break;
        //     case 'tiling': klass = lively.morphic.Layout.TileLayout; break;
        //     default: klass = lively.morphic.Layout.TileLayout; break;
        // }
        // var layouter = new klass(this);
        // layouter.setBorderSize(layoutStyle.border);
        // layouter.setSpacing(layoutStyle.spacing);
        // this.setLayouter(layouter);
    },

    initLayout: function(noOfCandidates, existingLayout) {
        var layout = existingLayout || {};
        layout.listItemHeight = layout.listItemHeight || 19;
        layout.padding = layout.padding || 0/*20*/;
        layout.extent = this.getExtent();
        layout.maxExtent = lively.pt(layout.extent.x - 2*layout.padding,layout.extent.y - 2*layout.padding);
        layout.maxListItems = Math.ceil(layout.maxExtent.y / layout.listItemHeight);
        layout.noOfCandidatesShown = Math.min(layout.maxListItems, noOfCandidates)+1;
        layout.adjustForNewBounds = true;
        return layout;
    },

    setupScroll: function(noOfItems, layout) {
        var clip = this, scroll = this.listItemContainer;
        clip.setClipMode({x: 'hidden', y: 'scroll'});
        var scrollbarExtent = clip.getScrollBarExtent();
        scroll.setBounds(lively.rect(0,0,
            this.getExtent().x-scrollbarExtent.x,
            layout.listItemHeight*noOfItems+4));
    }

},
'accessing', {
    get selectedLineNo() {
        return this.selectedIndexes.last();
    },
    set selectedLineNo(idx) {
        return this.addSelectedIndex(idx);
    },
    get selection() {
        var idx = this.selectedLineNo;
        if (typeof idx !== 'number') return undefined;
        var item = this.itemList[idx];
        return item && (item.value !== undefined) ? item.value : item;
    },
    set selection(val) {
        this.setSelection(val);
    }
    
},
'morph menu', {
    getMenu: function() { /*FIXME actually menu items*/ return [] }
},
'list interface', {

    addItem: function(item) {
        this.updateList(this.itemList.concat([item]));
    },

    find: function (itemOrValue) {
        // returns the index in this.itemList
        for (var i = 0, len = this.itemList.length; i < len; i++) {
            var val = this.itemList[i];
            if (val === itemOrValue) return i;
            if (val && val.isListItem && val.value === itemOrValue) return i;
        }
        return undefined;
    },

    setList: function(items) {
        var oldSelection = this.selection;
        if (!items) items = [];
        this.itemList = items;
        this.layout = this.initLayout(items.length, this.layout);
        this.setupScroll(items.length, this.layout);

        var newIndexForOldSelection;
        if (this.isMultipleSelectionList || oldSelection === undefined ||
            (newIndexForOldSelection = this.find(oldSelection)) === undefined) {
                this.selectedIndexes.length = 0;
                if(oldSelection !== undefined) {
                    lively.bindings.signal(this, 'selection', this.selection);
                    lively.bindings.signal(this, 'selectedLineNo', this.selectedLineNo);
                }
                this.updateView();
                this.setScroll(0,0);
                return;
        }
        if (this.selectedLineNo !== newIndexForOldSelection) {
            lively.bindings.noUpdate(this.updateSelectionAndLineNo.bind(this,newIndexForOldSelection));
        }
        this.updateView();
    },

    updateList: function(items) { return this.setList(items); },

    getList: function() { return this.itemList; },
    getValues: function() {
        return this.getList().collect(function(ea) {
            return ea.isListItem ? ea. value : ea});
    },

    getItem: function(value) {
        return this.itemList[this.find(value)];
    },
    removeItemOrValue: function(itemOrValue) {
        var idx = this.find(itemOrValue), item = this.itemList[idx];
        this.updateList(this.itemList.without(item));
        return item;
    },

    moveUpInList: function(itemOrValue) {
        // if (!itemOrValue) return;
        // var idx = this.find(itemOrValue);
        // if (idx === undefined) return;
        // this.changeListPosition(idx, idx-1);
    },
    moveDownInList: function(itemOrValue) {
        // if (!itemOrValue) return;
        // var idx = this.find(itemOrValue);
        // if (idx === undefined) return;
        // this.changeListPosition(idx, idx+1);
    }
},
"selection", {
    selectAt: function(idx) {
        if (!Object.isNumber(idx)) return;
        this.updateSelectionAndLineNo(idx);
        this.updateView();
    },
    
    saveSelectAt: function(idx) {
        this.selectAt(Math.max(0, Math.min(this.itemList.length-1, idx)));
    },

    selectNext: function() {
        this.saveSelectAt(Object.isNumber(this.selectedLineNo) ? this.selectedLineNo+1 : 0);
    },

    selectPrev: function() {
        this.saveSelectAt(Object.isNumber(this.selectedLineNo) ? this.selectedLineNo-1 : 0);
    },

    updateSelectionAndLineNo: function(selectionIdx) {
        this.addSelectedIndex(selectionIdx);
        this.scrollIndexIntoView.bind(this,selectionIdx).delay(0);
    },

    setSelection: function(sel) {
        if (!this.selectedIndexes) {
            lively.bindings.connect(this, 'selectedIndexes', this, 'setSelection', {
                varMapping: {sel: sel}, removeAfterUpdate: true,
                converter: function() { return sel; }});
            return sel;
        }
        var idx = this.find(sel);
        if (this.selectedLineNo !== idx) this.selectAt(idx);
        return sel;
    },

    getSelection: function() { return this.selection; },

    getSelectedItem: function() {
        var idx = this.selectedIndexes.last();
        return typeof idx === 'number' ? this.itemList[idx] : undefined;
    },

    deselectAt: function(idx) {
        this.selectedIndexes.remove(idx);
        this.updateView();
    },

    clearSelections: function() {
        this.selectedIndexes.length = 0;
        this.updateView();
    },

    selectionChanged: function(idx, isSelected) {
        if (isSelected) {
            this.selectAt(idx);
        } else {
            this.deselectAt(idx);
        }
    }

},
'multiple selection support', {
    enableMultipleSelections: function() { this.isMultipleSelectionList = true; },
    addSelectedIndex: function(idx) {
        if (!this.selectedIndexes) this.selectedIndexes = [];
        if (typeof idx !== 'number') return null;
        if (!this.isMultipleSelectionList) this.selectedIndexes.length = 0;
        var found = this.selectedIndexes.indexOf(idx);
        if (found > -1) this.selectedIndexes.splice(found, 1);
        this.selectedIndexes.push(idx);
        lively.bindings.signal(this, 'selection', this.selection);
        lively.bindings.signal(this, 'selectedLineNo', this.selectedLineNo);
        return idx;
    },
    getSelectedItems: function() {
        var items = this.itemList;
        return this.getSelectedIndexes().collect(function(i) { return items[i]; });
    },

    getSelectedIndexes: function() { return this.selectedIndexes; },

    getSelections: function() {
        return this.getSelectedItems().collect(function(ea) { return ea && ea.isListItem ? ea.value : ea; })
    },
    setSelections: function(arr) {
        var indexes = arr.collect(function(ea) { return this.find(ea) }, this);
        this.selectAllAt(indexes);
    },
    setSelectionMatching: function(string) {
        // for (var i = 0; i < this.itemList.length; i++) {
        //     var itemString = this.itemList[i].string || String(this.itemList[i]);
        //     if (string == itemString) this.selectAt(i);
        // }
    },
    selectAllAt: function(indexes) {
        indexes.forEach(function(idx) {
            Object.isNumber(idx) && this.updateSelectionAndLineNo(idx); }, this);
        this.updateView();
    }

},
'event handling', {

    onScroll: function(evt) {
        Functions.throttleNamed(
            'onScroll-' + this.id, 60, this.updateView.bind(this))();
    },

    onMouseWheel: function(evt) {
        this.stopScrollWhenBordersAreReached(evt);
        return false;
    },

    onMouseDown: function(evt) {
        if (!evt.isRightMouseButtonDown()) return false;
        // delayed because when owner is a window and comes forward the window
        // would be also in front of the new menu
        var items = this.getMenu();
        if (items.length > 0) lively.morphic.Menu.openAt.curry(
            evt.getPosition(), null, items).delay(0.1);
        evt.stop(); return true;
    },

    onUpPressed: function($super, evt) {
        if (evt.isCommandKey()) return $super(evt);
        this.selectPrev();
        evt.stop(); return true;
    },

    onDownPressed: function($super, evt) {
        if (evt.isCommandKey()) return $super(evt);
        this.selectNext();
        evt.stop(); return true;
    }

},
'scrolling', {
    scrollIndexIntoView: function(idx) {
        var scroll = this.getScroll(),
            bnds = this.innerBounds().translatedBy(pt(scroll[0], scroll[1])),
            itemTop = this.layout.listItemHeight * idx,
            itemBottom = this.layout.listItemHeight * (idx+1);
        if (bnds.bottom() < itemBottom) {
            this.setScroll(scroll[0], itemBottom-bnds.height);
        } else if (bnds.top() > itemTop) {
            this.setScroll(scroll[0], itemTop);
        }
    }
},
'rendering', {
    get listItemContainer() {
        // `this` is the outer morph with a fixed bounds and the official list
        // interface. `this.listItemContainer` is a morph whose size will grow
        // shrink according to the number of items that need to be displayed.
        // It's size will define how much scroll space is there which will give
        // users feedback about how many items are in the list when scrolling
        var m = this.submorphs[0];
        if (m) return m;
        return this.addMorph(lively.newMorph({
            style: {fill: null, adjustForNewBounds: true, resizeWidth: true}}));
    },
    set listItemContainer(morph) {
        if (this.submorphs[0] && this.submorphs[0] !== morph) this.submorphs[0].remove();
        if (morph.owner !== this) this.addMorph(morph);
    },

    getItemMorphs: function(alsoGetInactive) {
        // for just getting the morphs that are used to render the current list
        // items simple call getItemMorphs. For internal rendering purposes
        // itemMorphs might be kept around when the list shortens. Those "inactive"
        // itemMorphs have an undefined index field but might can be reused when
        // the list grows. They are included in the return value if this method is
        // called with true
        return this.listItemContainer.submorphs.select(function(ea) {
            return (alsoGetInactive || ea.index !== undefined) && ea.isListItemMorph; });
    },

    renderFunction: function(item) {
        if (item !== 0 && !item) item = {isitem: true, string: 'invalid list item: ' + item};
        var string = item.string || String(item);
        return string;
    
    },

    renderItems: function(items, from, to, selectedIndexes, renderBounds, layout) {
        this.ensureItemMorphs(to-from+1, layout).forEach(function(itemMorph, i) {
            var listIndex = from+i,
                selected = selectedIndexes.include(listIndex);
            itemMorph.setPointerEvents('auto');
            itemMorph.setPosition(pt(0, listIndex*layout.listItemHeight));
            itemMorph.index = listIndex;
            itemMorph.name = String(itemMorph.index);
            itemMorph.textString = items.length == 0 ? '' : this.renderFunction(items[listIndex]);
            if (selected !== itemMorph.selected) {
                itemMorph.setIsSelected(selected, true/*suppress update*/);
            }
        }, this);
    },

    createListItemMorph: function(string, i, layout) {
        var height = layout.listItemHeight,
            width = layout.maxExtent.x,
            text = lively.morphic.Text.makeLabel(string, {
                position: pt(0, i*height),
                extent: pt(width, height),
                fixedHeight: true, fixedWidth: false,
                resizeWidth: true,
                whiteSpaceHandling: 'pre'
            });
        text.addScript(function setIsSelected(bool, suppressUpdate) {
            if (!bool && this.selected) {
                this.removeStyleClassName('selected');
            } else if (bool && !this.selected){
                this.addStyleClassName('selected');
            }
            var self = this;
            function setState() { self.selected = bool; }
            if (suppressUpdate) lively.bindings.noUpdate(setState); else setState();
        });
        text.addScript(function onMouseDown(evt) {
            if (this.owner.allowDeselectClick) {
                this.setIsSelected(!this.selected);
            } else if (!this.isSelected) {
                this.setIsSelected(true);
            }
            evt.stop(); return true;
        });
        // text.disableEvents();
        text.unignoreEvents();
        text.setInputAllowed.bind(text, false).delay(1);
        text.addStyleClassName('list-item');
        text.setTextStylingMode(true);
        text.isListItemMorph = true;
        text.name = String(i);
        text.index = i;
        lively.bindings.connect(text, 'selected', this, 'selectionChanged', {
            updater: function($upd, selected) { $upd(this.sourceObj.index, selected); },
        });
        return text;
    },

    ensureItemMorphs: function(requiredLength, layout) {
        var itemMorphs = this.getItemMorphs(true);
        requiredLength = Math.min(layout.noOfCandidatesShown, requiredLength);
        if (itemMorphs.length > requiredLength) {
            lively.bindings.noUpdate(function() {
                itemMorphs.slice(requiredLength).forEach(function(text) {
                    text.setPointerEvents('none');
                    text.index = undefined;
                    text.setTextString('');
                    text.removeStyleClassName("selected");
                    text.selected = false;
                    text.setHandStyle("default");
                });
                itemMorphs = itemMorphs.slice(0,requiredLength);
            });
        } else if (itemMorphs.length < requiredLength) {
            var c = this.listItemContainer,
                newItems = Array.range(itemMorphs.length, requiredLength-1).collect(function(i) {
                    return c.addMorph(this.createListItemMorph('', i, layout)); }, this);
            itemMorphs = itemMorphs.concat(newItems);
        }
        return itemMorphs;
    },

    visibleIndexes: function(scrollBounds, items, layout) {
        var scrollTop = scrollBounds.top(),
            scrollBottom = scrollBounds.bottom() + layout.listItemHeight,
            sliceStart = Math.floor(scrollTop / layout.listItemHeight),
            sliceEnd = Math.ceil(scrollBottom / layout.listItemHeight);
        sliceStart = Math.min(Math.max(sliceStart, 0), items.length-1);
        sliceEnd = Math.min(Math.max(sliceEnd, 0), items.length-1);
        return [sliceStart, sliceEnd];
    },

    updateView: function(items, layout, selectedIdxs) {
        items = items || this.itemList;
        layout = layout || this.layout;
        selectedIdxs = selectedIdxs || this.selectedIndexes;
        if (!layout) return;
        var scrollBounds = this.world() ? this.getScrollBounds() : this.innerBounds(),
            startEnd = this.visibleIndexes(scrollBounds, items, layout);
        this.renderItems(items, startEnd[0], startEnd[1], selectedIdxs, scrollBounds, layout);
    }
},
'compatibility', {
    innerMorph: function() { return this; },
    addMenuButton: function() { return this },
    clearFilter: function() {}
});

Object.extend(Array.prototype, {
    asListItemArray: function() {
        return this.collect(function(ea) {
            return {isListItem: true, string: String(ea), value: ea};
        });
    }
});

}) // end of module
