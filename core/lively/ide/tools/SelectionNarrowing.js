module('lively.ide.tools.SelectionNarrowing').requires('lively.persistence.BuildSpec', 'lively.ide.tools.CommandLine').toRun(function() {

lively.BuildSpec('lively.ide.tools.NarrowingList', {
    _ClipMode: "hidden",
    _Extent: lively.pt(900.0,288.0),
    _Position: lively.pt(93.0,2132.0),
    _StyleClassNames: ["Box","Morph","tab-list"],
    _StyleSheet: ".tab-list {\n\
    background-color: rgba(1,1,1,0.5);\n\
    border-radius: 5px;\n\
}\n\
\n\
.tab-list-item span {\n\
    font-family: Verdana;\n\
	font-size: 14pt;\n\
	color: white !important;\n\
	font-width: bold !important;\n\
	text-shadow: none          !important;\n\
}\n\
\n\
.tab-list-item.selected {\n\
	font-weight: normal;\n\
	background-color: rgba(1,1,1,0.4);\n\
	border-radius: 5px !important;\n\
	border: 0px white solid !important;\n\
}",
    _Visible: true,
    _ZIndex: 1000,
    className: "lively.morphic.Box",
    connections: {
        confirmedSelection: {}
    },
    currentSel: 0,
    doNotSerialize: ["state","settings"],
    isEpiMorph: true,
    droppingEnabled: true,
    initialSelection: 1,
    name: "NarrowList",
    settings: {
        inputLineHeight: 18,
        listItemHeight: 30,
        maxExtent: lively.pt(900.0,500.0),
        padding: 20
    },
    showDelay: 700,
    sourceModule: "lively.morphic.Core",
    submorphs: [],
    filter: function filter(filter) {
    // this.filter('tjZ');
    // this.filter(null);

    var container = this,
        unfiltered = this.state.unfilteredListItems || (this.state.unfilteredListItems = this.getVisibleListItems().pluck('realItem')),
        filtered = unfiltered;
    if (filter && filter.length > 0) {
        var regexps = filter.split(' ').map(function(part) {
            return new RegExp(part, 'ig'); });
        filtered = unfiltered
            .select(function(ea) {
                return regexps.all(function(re) {
                    var string = container.realItemToString(ea);
                    return string.match(re); }); });
    }
    this.renderList(filtered, this.settings);
    this.selectN(0);
},
    getListItems: function getListItems() {
    return this.submorphs.select(function(ea, i) {
        return ea.isListItemMorph; })
},
    getVisibleListItems: function getVisibleListItems() {
    return this.getListItems().select(function(ea, i) {
        return ea.textString !== ''; })
},
    initSettings: function initSettings() {
    var visibleBounds = lively.morphic.World.current().visibleBounds();
    this.settings = {};
    this.settings.listItemHeight = 30;
    this.settings.inputLineHeight = 18;
    this.settings.padding = 20;
    this.settings.maxExtent = lively.pt(
        Math.min(visibleBounds.extent().x - 2*this.settings.padding, 900),
        500/*visibleBounds.extent().y - 2*padding*/);
    return this.settings;
},
    onKeyDown: function onKeyDown(evt) {
    var modifierPressed = evt.isCtrlDown() || evt.isCommandKey();
    if (modifierPressed && evt.keyCode === 192) { // \"`\" key
        if (evt.isShiftDown())  this.selectPrev();
        else this.selectNext(); evt.stop(); return true;
    } else if (evt.keyCode === Event.KEY_DOWN) {
        this.selectNext(); evt.stop(); return true;
    } else if (evt.keyCode === Event.KEY_UP) {
        this.selectPrev(); evt.stop(); return true;
    }  else if (evt.keyCode === Event.KEY_ESC) {
        lively.bindings.signal(this, 'escapePressed', this);
        evt.stop(); return true;
    }
    return false;
},
    onKeyUp: function onKeyUp(evt) {
        //alert(Strings.format('code: %s cmd: %s ctrl: %s',
        //    evt.keyCode, evt.isCommandKey(), evt.isCtrlDown()));
    // var startEvt = this.state && this.state.openedWithEvt;
    // if (!startEvt) return false;
    // if (!startEvt.isCtrlDown() && !startEvt.isCommandKey()) return false;
    // var sameModifier = startEvt.isCtrlDown() === evt.isCtrlDown()
    //                 || startEvt.isCommandKey() === evt.isCommandKey();
    // if (!sameModifier) return false;
    // this.closeAndPromoteWindow();
    // return true;
},
    onFocus: function() {
        this.get('inputLine').focus();
    },
    onSelectionConfirmed: function onSelectionConfirmed(item) {
    lively.bindings.signal(this, 'confirmedSelection', item && item.value ? item.value : item);
},
    open: function open(list, settings) {
    var settings = this.initSettings(settings);
    this.state = {};
    this.renderContainer(list, settings);
    this.renderList(list, settings);
    this.renderInputline(settings);
    this.selectN(0);
    this.focus();
},
    realItemToString: function realItemToString(realItem) {
    var string;
    if (!realItem || Object.isString(realItem)) {
        string = String(realItem);
    } else if (realItem.isListItem) {
        string = realItem.string;
    } else {
        string = 'Cannot render ' + realItem;
    }
    return string;
},
    renderContainer: function renderContainer(list, settings) {
    this.setVisible(true);
    if (!this.owner) this.openInWorld();
    var visibleBounds = lively.morphic.World.current().visibleBounds();
    this.setExtent(visibleBounds.extent()
        .withY(settings.listItemHeight*list.length+settings.inputLineHeight)
        .minPt(settings.maxExtent));
    this.align(this.bounds().bottomCenter(), visibleBounds.bottomCenter().addXY(0, -this.settings.padding));
},
    renderInputline: function renderInputline(settings) {
    var inputLine = this.get('inputLine');
    if (!inputLine) {
        inputLine = lively.BuildSpec('lively.ide.tools.CommandLine').createMorph();
        inputLine.name = 'inputLine';
        this.addMorph(inputLine);
        inputLine.setExtent(pt(this.getExtent().x, settings.inputLineHeight));
        inputLine.setTheme('ambiance');
        inputLine.jQuery('.ace-scroller').css({'background-color': 'rgba(32, 32, 32, 0.3)'});
        lively.bindings.connect(inputLine, 'textString', this, 'filter');
        lively.bindings.connect(inputLine, 'input', this, 'onSelectionConfirmed', {converter: function() {
            var selected = this.targetObj.getVisibleListItems()[this.targetObj.currentSel];
            return selected && selected.realItem; }});
        inputLine.clearOnInput = false;
    }
    inputLine.setPosition(pt(0, this.getExtent().y-settings.inputLineHeight));
},
    renderList: function renderList(list, settings) {
    var container = this,
        listItemHeight = settings.listItemHeight || 30,
        inputLineHeight = settings.inputLineHeight || 30,
        maxExtent = settings.maxExtent,
        maxListItems = Math.floor((maxExtent.y-inputLineHeight) / listItemHeight);

    function createListItem(string, i) {
        var text = lively.morphic.Text.makeLabel(string, {
            position: pt(0, i*listItemHeight),
            extent: pt(maxExtent.x, listItemHeight),
            fixedHeight: true, fixedWidth: false
        });
        container.addMorph(text);
        text.addStyleClassName('tab-list-item');
        text.fit();
        text.isListItemMorph = true;
        text.name = String(i);
        text.index = i;
        return text;
    }

    function ensureItems(length) {
        var listItems = container.getListItems();
        if (listItems.length > length) {
            listItems.slice(length).invoke('remove');
            listItems.length = length;
        } else if (listItems.length < length) {
            var newItems = Array.range(listItems.length, length).collect(function(i) { return createListItem('', i); });
            listItems = listItems.concat(newItems);
        }
        return listItems;
    }

    var items = ensureItems(maxListItems)
    items.forEach(function(item, i) {
        if (!(i in list)) {
            delete item.realItem; item.textString = ''; return; }
        var realItem = list[i], string = this.realItemToString(realItem);
        item.realItem = realItem || string;
        item.textString = string;
    }, this);
},
    reset: function reset() {
    // this.reset();
    this.connections = {confirmedSelection: {}, selection: {}, escapePressed: {}};
    this.getPartsBinMetaInfo().addRequiredModule('lively.ide.tools.CommandLine');
    this.removeAllMorphs();
    this.initialSelection = 1; // index to select
    this.showDelay = 700; // ms
    this.doNotSerialize = ['timeOpened', 'state', 'settings'];
    this.state = null;
    this.applyStyle({clipMode: 'hidden'});
    this.setZIndex(1000);
},
    selectCurrent: function selectCurrent() {
    this.currentSel = (this.currentSel || 0);
    if (!this.submorphs[this.currentSel]) this.currentSel = 0;
    if (this.submorphs[this.currentSel]) this.selectN(this.currentSel, true);
},
    selectN: function selectN(n, suppressSelfPromote) {
    var listItems = this.getVisibleListItems(),
        item = listItems[n];
    if (!item) return;
    listItems.invoke("removeStyleClassName", "selected");
    item.addStyleClassName('selected');
    this.currentSel = n;
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    var selection = this.getVisibleListItems()[n].realItem;
    selection && selection.value && (selection = selection.value);
    lively.bindings.signal(this, 'selection', selection);
},
    selectNext: function selectNext() {
    this.currentSel = (this.currentSel || 0) + 1;
    if (!this.getVisibleListItems()[this.currentSel]) this.currentSel = 0;
    this.selectN(this.currentSel);
},
    selectPrev: function selectPrev() {
    this.currentSel = (this.currentSel || 0) - 1;
    if (!this.getVisibleListItems()[this.currentSel]) this.currentSel = this.getVisibleListItems().length - 1;
    this.selectN(this.currentSel);
},
    test: function test() {
    // this.test();
    // this.removeAllMorphs()
    // this.openInWorld()
    // this.setVisible(true);

    function randomString(length) {
        return Array.range(0, length).map(function() {
            return String.fromCharCode(Numbers.random(65, 120));
        }).join('')
    }
    var list = Array.range(1,Numbers.random(5,10)).map(function(i) {
        return {
            isListItem: true,
            string: randomString(Numbers.random(30, 100)),
            value: i
        };
    });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    var settings = this.initSettings();
    this.state = {};
    this.renderContainer(list, settings);
    this.renderList(list, settings);
    this.renderInputline(settings);
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.reset();
    }
});

}) // end of module
