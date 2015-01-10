module('lively.morphic.tools.FilterableList').requires("lively.ide.tools.CommandLine").toRun(function() {

/*
 * Generic filterable list (list with input line). See
 * lively.ide.tools.CodeSearch for how to use and customize it.
 * Provides various hooks, e.g. reimplement #applyFilter, #getItemActionsFor,
 * #parseInput
 *
 */
 
lively.BuildSpec('lively.morphic.tools.FilterableList', {
    _BorderColor: Color.rgb(95,94,95),
    _Extent: lively.pt(709.0,478.0),
    _Fill: Color.rgb(245,245,245),
    _Position: lively.pt(3.0,22.0),
    _StyleSheet: ".list-item {\n\
	font-family: Monaco, monospace      !important;\n\
	font-size: 9pt !important;\n\
}",
    className: "lively.morphic.Box",
    connections: {rendered: {}},
    droppingEnabled: true,
    filterState: {
        filterTimeout: 100,
        filters: [],
        items: [],
        sortKey: null
    },
    lastFocused: {
        isMorphRef: true,
        name: "filter"
    },
    layout: {
        adjustForNewBounds: true,
        resizeHeight: true,
        resizeWidth: true,
    },
    name: "FilterableList",
    prevClicked: null,
    submorphs: [lively.BuildSpec("lively.ide.tools.CommandLine").customize({
        labelString: 'search for: ',
        name: "filter",
        _Extent: lively.pt(701.6,20),
        style: {
            clipMode: "hidden",
            enableDragging: false,
            enableGrabbing: false,
            fontSize: 12,
            gutter: false,
            resizeWidth: true
        },

        connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "inputChange", this.get("FilterableList"), "inputChange", {});
        }
    }), {
        _BorderColor: Color.rgb(202,202,202),
        _BorderWidth: 1,
        _ClipMode: {x: "hidden", y: "scroll"},
        _Extent: lively.pt(697,450),
        _Fill: Color.rgb(243,243,243),
        _Position: lively.pt(4,23),
        className: "lively.morphic.List",
        droppingEnabled: true,
        itemMorphs: [],
        layout: {
            adjustForNewBounds: true,
            extent: lively.pt(701.6,431.5),
            padding: 0,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "list",
        selectedIndexes: [],
        sourceModule: "lively.morphic.Lists",

        ensureItemMorphs: function ensureItemMorphs(requiredLength, layout) {
            var itemMorphs = this.getItemMorphs(true);
            requiredLength = Math.min(layout.noOfCandidatesShown, requiredLength);
            if (itemMorphs.length > requiredLength) {
                lively.bindings.noUpdate(function() {
                    itemMorphs.slice(requiredLength).forEach(function(text) {
                        text.setPointerEvents('auto');
                        text.index = undefined;
                        text.setTextString('');
                        text.removeStyleClassName("selected");
                        text.selected = false;
                        text.setHandStyle("default");
                        var cssClasses = ["Morph","Text","list-item"];
                        text.setStyleClassNames(cssClasses);
    
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

        focus: function focus() {
            var win = this.getWindow();
            win && (win.targetMorph.lastFocused = this);
            return $super();
        },

        getMenu: function getMenu() {
            return this.owner.getMenuItemsFor(this.getSelection());
        },

        renderItems: function renderItems(items, from, to, selectedIndexes, renderBounds, layout) {
            this.ensureItemMorphs(to-from, layout).forEach(function(itemMorph, i) {
                var listIndex = from+i,
                    selected = selectedIndexes.include(listIndex);
                itemMorph.setPointerEvents('auto');
                itemMorph.setPosition(pt(0, listIndex*layout.listItemHeight));
                itemMorph.index = listIndex;
                itemMorph.name = String(itemMorph.index);
                var cssClasses = ["Morph","Text","list-item"];
                if (items[listIndex].cssClasses) cssClasses.pushAll(items[listIndex].cssClasses);
                if (selected) cssClasses.push('selected');
                itemMorph.setStyleClassNames(cssClasses);
                itemMorph.textString = this.renderFunction(items[listIndex]);
                if (selected !== itemMorph.selected) {
                    itemMorph.setIsSelected(selected, true/*suppress update*/);
                }
            }, this);
        },

        reset: function reset() {
            this.listItemStyle = {
              allowInput: false,
              borderColor: Color.rgb(204,204,204),
              borderWidth: 1,
              fill: null,
              fixedHeight: false,
              fixedWidth: true,
              clipMode: 'hidden',
              whiteSpaceHandling: 'pre'
            }
            this.setClipMode(this.getClipMode())
            this.cachedBounds=null
            this.listItemContainer.removeAllMorphs()
            this.connections = ['listItemDoubleClicked'];
            // this.itemList[0].value
        }
    }],

    applyFilter: function applyFilter(filters, thenDo) {
        var self = this;
        self.filterState.filters = filters;
        Functions.debounceNamed(self.id+'applyFilter', self.filterState.filterTimeout, function() {
            false && show('applying filter ' + filters);
            self.renderDebounced(thenDo);
        })();
    },

    applySort: function applySort() {
        var sortKeySel = this.get('sortBySelector');
        this.filterState.sortKey = (sortKeySel && sortKeySel.selection) || null;
        this.render();
    },

    connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "lastFocused", this, "focusChanged", {});
    },

    execItemAction: function execItemAction(item, n) {
        var action = this.getItemActionsFor(item)[n];
        if (!action) { show("no item action %s exists", n); return; }
        action.exec();
    },

    focusChanged: function focusChanged(newFocus) {},

    getCSSClassesForItem: function getCSSClassesForItem(item) {
        return item.value && item.value.matchedAs ? [item.value.matchedAs] : [];
    },

    getItemActionsFor: function getItemActionsFor(item) {
        return [];
    },

    getMenuItemsFor: function getMenuItemsFor(fileItem) {
        return this.getItemActionsFor(fileItem).map(function(ac) {
            return [ac.description, ac.exec]; })
    },

    inputChange: function inputChange() {
        var self = this,
            input = this.get('filter').getInput(),
            filters = this.parseInput(input);
        this.applyFilter(filters);
    },

    parseInput: function parseInput(input) {
        return input.split(' ').invoke("trim");
    },

    itemsFilter: function itemsFilter(filters, items) {
        filters = (filters || []).map(function(ea) {
            return ea.toLowerCase ? ea.toLowerCase() : ea; });
        var result = items.filter(function(item) {
            return filters.all(function(filter) {
                if (!filter || !filter.length) {
                    return true;
                } else if (Object.isString(filter)) {
                    return item.string.toLowerCase().include(filter);
                } else if (Object.isRegExp(filter)) {
                    return filter.test(item.string);
                } else { return true; }
            });
        });
        return result;
    },

    itemsForList: function itemsForList(items) {
        var self = this
        return items.map(function(ea) {
            var li = ea.isListItem ? ea : {
                isListItem: true,
                string: String(ea),
                value: ea
            }
            if (!li.cssClasses) li.cssClasses = self.getCSSClassesForItem(li)
            return li;
        });
    },

    itemsSort: function itemsSort(sortKey, items) {
        return items;
        // return items.sortBy(function(item) {
        //     if (sortKey === 'name') {
        //         return item.fileName;
        //     } else if (sortKey === 'time') {
        //         return -item.lastModified;
        //     } else if (sortKey === 'size') {
        //         return -item.size;
        //     } else {
        //         return item.fileName;
        //     }
        // });
    },

    listItemDoubleClicked: function listItemDoubleClicked(item) {
        this.execItemAction(item, 0);
    },

    listItemMorph: function listItemMorph(listItem, extent) {
        if (!listItem) listItem = {isListItem: true, string: 'invalid list item: ' + listItem};
        if (listItem.morph) return listItem.morph;
        var string = listItem.string || String(listItem);
        var listItemMorph = new lively.morphic.Text(lively.rect(0,0,extent.x,20), string);
        listItemMorph.item = listItem;
        listItemMorph.applyStyle({
          allowInput: false,
          borderColor: Color.rgb(204,204,204),
          borderWidth: 1,
          fill: null,
          fixedHeight: false,
          fixedWidth: true,
          clipMode: 'hidden',
          whiteSpaceHandling: 'pre'
        });
        return listItemMorph;
    },

    onKeyDown: function onKeyDown(evt) {
        var filter      = this.get('filter'),
            filterFocused = filter.isFocused(),
            wasHandled = this.onKeyDownActOnList(evt);

        if (!wasHandled) {
            return filterFocused ? false : $super(evt);
        } else {
            evt.stop(); return true;
        }
    },

    onKeyDownActOnList: function onKeyDownActOnList(evt) {
        var fl              = this.get('list'),
            filter          = this.get('filter'),
            listFocused = fl.isFocused(),
            filterFocused   = filter.isFocused(),
            keys            = evt.getKeyString(),
            wasHandled      = true;
    
        function ensureSelectionIsInView(topOrBottom) {
            var visible = fl.getVisibleIndexes();
            // if (visible.include(fl.selectedLineNo)) return;
            var newIdx = topOrBottom === 'top' ? visible.first() : visible.last()-1;
            fl.selectAt(newIdx);
        }
    
        switch (keys) {
            case 'Enter':
                var sel = fl.getSelection();
                // show(Objects.inspect(sel, {maxDepth: 1}))
                if (sel) this.execItemAction(sel, 0);
                else wasHandled = false;
                break;
            case 'Control-N': case 'Down': fl.selectNext(); break;
            case 'Control-P': case 'Up': fl.selectPrev(); break;
            case "Alt-V": case "PageUp": fl.scrollPage('up'); ensureSelectionIsInView('top'); break;
            case "Control-V": case "PageDown": fl.scrollPage('down'); ensureSelectionIsInView('bottom'); break;
            case "Alt-Shift->": case "End": fl.scrollToBottom(); ensureSelectionIsInView('bottom'); break;
            case "Alt-Shift-<": case "Home": fl.scrollToTop(); ensureSelectionIsInView('top'); break;
            case 'Alt-1': this.execItemAction(fl.selection, 0); break;
            case 'Alt-2': this.execItemAction(fl.selection, 1); break;
            case 'Alt-3': this.execItemAction(fl.selection, 2); break;
            case 'Alt-4': this.execItemAction(fl.selection, 3); break;
            case 'Alt-5': this.execItemAction(fl.selection, 4); break;
            default: wasHandled = false;
        }
    
        return wasHandled;
    },

    onMouseUp: function onMouseUp(evt) {
        var tgt = evt.getTargetMorph();
    
        if (tgt && tgt.isListItemMorph) {
            if (this.prevClicked === tgt) {
                this.prevClicked = null;
                this.listItemDoubleClicked(this.get('list').selection);
            } else {
                this.prevClicked = tgt;
                (function() { this.prevClicked = null; }).bind(this).delay(0.3);
            }
        }
    },

    onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('filter').focus();
    },

    render: function render(thenDo) {
        // console.profile(); this.render(); console.profileEnd();
        // this.render();
        this.renderListFiltered(thenDo);
    },

    renderDebounced: function renderDebounced(thenDo) {
        var self = this;
        Functions.debounceNamed(
            ('render-' + this.id), 40,
            function(doFunc) { self.render(doFunc); })(thenDo);
    },

    renderListFiltered: function renderListFiltered(thenDo) {
        var list = this.get('list'),
            filters = this.filterState.filters,
            sortKey = this.filterState.sortKey,
            items = this.filterState.items,
            processItems = lively.lang.fun.compose(
                this.itemsFilter.curry(filters),
                sortKey ? this.itemsSort.curry(sortKey) : lively.lang.fun.K,
                this.itemsForList.bind(this)),
            processedItems = processItems(items);
    
            // dirsAndFiles = items.groupBy(function(item) {
            //     return item.isDirectory ? 'directory' : 'file'}),
            // dirsAndFilesSorted = dirsAndFiles.mapGroups(function(_, group) {
            //     return processItems(group); });
        list.isInLayoutCycle = true;
        list.updateList(processedItems.toArray().flatten());
        if (!list.selection) list.selectAt(0);
        // this.get('resultText').textString = processedItems.length + ' matches';
        list.isInLayoutCycle = false;
        list.applyLayout();
        lively.bindings.signal(this, "rendered");
        thenDo && thenDo.call(this, null, processItems);
    },

    reset: function reset() {
        this.filterState = {
            filterTimeout: 100,
            items: [],
            // sortKey: 'name',
            sortKey: null,
            filters: []
        }
        this.get('list').withAllSubmorphsDo(function(ea) { return ea.applyStyle({cssStylingMode: true}); });
        lively.bindings.connect(this, 'lastFocused', this, 'focusChanged');
        this.get('filter').clearOnInput = false;
        this.get('list').addScript(function getMenu() {
            return this.owner.getMenuItemsFor(this.getSelection());
        });
        this.get('filter').setInput('')
        this.get('list').listItemContainer.removeAllMorphs();
    },

    setList: function setList(items) {
        this.filterState.items = items;
        this.renderDebounced();
    },

    setSelection: function setSelection (sel) {
        this.get('list').setSelection(sel);
    },

    getSelection: function getSelection () {
        return this.get('list').getSelection();
    },
    
    getSelectedItem: function() {
        return this.get('list').getSelectedItem();
    },

    userQueryForSort: function userQueryForSort() {
        var self = this;
        lively.ide.tools.SelectionNarrowing.chooseOne(['time', 'size', 'name'], function(err, selection) {
            self.get('sortBySelector').selection = selection;
            self.applySort();
        })
    }
})

}) // end of module
