module('lively.ide.tools.SelectionNarrowing').requires("lively.ide.tools.CommandLine").toRun(function() {

lively.ide.tools.SelectionNarrowing.lastActiveList = null;

lively.BuildSpec('lively.ide.tools.NarrowingList', {
    _ClipMode: "hidden",
    _Extent: lively.pt(900.0,138.0),
    _Position: lively.pt(510.0,801.0),
    _StyleClassNames: ["Box","Morph","tab-list"],
    _StyleSheet: ".tab-list {\n"
+ "    background-color: rgba(1,1,1,0.7);\n"
+ "	border-radius: 5px !important;\n"
+ "	box-shadow: 0 0 4px white, inset 0 0 5px white;\n"
+ "}\n"
+ ".tab-list-item span {\n"
+ "	font-family: Verdana;\n"
+ "	font-size: 14pt;\n"
+ "	color: white !important;\n"
+ "	font-width: bold !important;\n"
+ "	text-shadow: none !important;\n"
+ "}\n"
+ ".tab-list-item.selected {\n"
+ "	font-weight: normal;\n"
+ "	background-color: rgba(1,1,1,0.3);\n"
+ "	border-radius: 5px !important;\n"
+ "	box-shadow: 0 0 3px white, inset 0 0 5px white;\n"
+ "	border: 0px white solid !important;\n"
+ "}\n",
    _Visible: true,
    _ZIndex: 1000,
    className: "lively.morphic.Box",
    connections: {
        confirmedSelection: {},
        escapePressed: {},
        selection: {}
    },
    currentSel: 0,
    doNotSerialize: ["timeOpened","state"],
    droppingEnabled: false,
    initialSelection: 1,
    isEpiMorph: true,
    name: "NarrowList",
    settings: {
        inputLineHeight: 18,
        listItemHeight: 30,
        maxExtent: lively.pt(900.0,919.0),
        maxListItems: 30,
        padding: 20
    },
    showDelay: 700,
    sourceModule: "lively.morphic.Core",
    state: null,
    submorphs: [],
    candidateToString: function candidateToString(candidate) {
    var string;
    if (!candidate || Object.isString(candidate)) {
        string = String(candidate);
    } else if (candidate.isListItem) {
        string = candidate.string;
    } else {
        string = 'Cannot render ' + candidate;
    }
    return string;
},
    ensureItems: function ensureItems(length, layout) {
    var container = this;
    function createListItem(string, i) {
        var height = layout.listItemHeight,
            width = layout.maxExtent.x,
                text = lively.morphic.Text.makeLabel(string, {
                position: pt(0, i*height),
                extent: pt(width, height),
                fixedHeight: true, fixedWidth: false,
                whiteSpaceHandling: 'pre'
            });
        container.addMorph(text);
        text.addStyleClassName('tab-list-item');
        text.isListItemMorph = true;
        text.name = String(i);
        text.index = i;
        return text;
    }

    var listItems = container.getListItems();
    if (listItems.length > length) {
        listItems.slice(length).forEach(function(text) { 
            text.setTextString('');
            text.removeStyleClassName("selected");
            text.setHandStyle("default");
        });
        listItems = listItems.slice(0,length);
    } else if (listItems.length < length) {
        var newItems = Array.range(listItems.length, length-1).collect(function(i) {
            return createListItem('', i); });
        listItems = listItems.concat(newItems);
    }
    return listItems;
},
    filter: function filter(input) {
    var state = this.state, container = this;
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // leave updating the candidates list to user func
    if (state.candidatesUpdater) {
        if (state.candidatesUpdaterMinLength && input.length < state.candidatesUpdaterMinLength) return;
        state.candidatesUpdater(input, function(candidates) {
            // FIXME duplication with below...!
            var prevFiltered = state.filteredCandidates;
            if (prevFiltered.equals(candidates)) return;
            state.previousCandidateProjection = null;
            state.filteredCandidates = candidates;
            container.selectN(0);
        });
        return;
    }
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // do filter operation
    var list = state.allCandidates,
        // split input by spaces and turn each string ino a regexp
        regexps = state.filters = input.split(' ')
            .map(function(part) { try { return new RegExp(part, 'i'); } catch(e) { return null } })
            .compact(),
        filteredList = list.select(function(ea) {
            return regexps.all(function(re) {
                var string = container.candidateToString(ea);
                return string.match(re); }); });
    var prevFiltered = state.filteredCandidates;
    if (prevFiltered.equals(filteredList)) return;
    state.previousCandidateProjection = null;
    state.filteredCandidates = filteredList;
    this.selectN(0);
},
    getListItems: function getListItems() {
    // this.getListItems().invoke('getStyleClassNames').join('\n')
    return this.submorphs.select(function(ea, i) {
        return ea.isListItemMorph; })
},
    initLayout: function initLayout(noOfCandidates) {
    var visibleBounds = lively.morphic.World.current().visibleBounds(),
        layout = {
            listItemHeight: 30,
            inputLineHeight: 18,
            padding: 20,
            // computed below:
            maxExtent: null,
            maxListItems: null,
            noOfCandidatesShown: null
        };
    layout.maxExtent = lively.pt(
        Math.min(visibleBounds.extent().x - 2*layout.padding, 900),
        visibleBounds.extent().y - 2*layout.padding);
    layout.maxListItems = Math.floor(
        (layout.maxExtent.y-layout.inputLineHeight) / layout.listItemHeight);
    layout.noOfCandidatesShown = Math.min(layout.maxListItems, noOfCandidates);
    return layout;
},
    onFocus: function onFocus() {
    this.get('inputLine').focus();
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.reset();
    },

    getListItemIndexFromMouseEvent: function getListItemIndexFromMouseEvent(evt) {
        var target = evt.getTargetMorph(),
            candidates = this.state.filteredCandidates,
            idx = candidates.indexOf(target.candidate);
        return idx;
    },
    onMouseMove: function onMouseMove(evt) {
    var idx = this.getListItemIndexFromMouseEvent(evt);
    if (idx === -1 || this.currentSel === idx) return $super(evt);
    this.selectN(idx);
    return $super(evt);
},

    onMouseUp: function onMouseUp(evt) {
    var idx = this.getListItemIndexFromMouseEvent(evt);
    if (idx === -1) return $super(evt);
    this.onSelectionConfirmed();
    evt.stop(); return true;
    },

    onKeyDown: function onKeyDown(evt) {
    var modifierPressed = evt.isCtrlDown() || evt.isCommandKey();
    if (modifierPressed && evt.keyCode === 192) { // \"`\" key
        if (evt.isShiftDown())  this.selectPrev();
        else this.selectNext(); evt.stop(); return true;
    }  else if (evt.keyCode === Event.KEY_ESC) {
        lively.bindings.signal(this, 'escapePressed', this);
        evt.stop(); return true;
    }
    return false;
},
    onSelectionConfirmed: function onSelectionConfirmed() {
    var item = this.state.filteredCandidates[this.currentSel],
        val = item && typeof item.value !== "undefined" ? item.value : item;
    lively.bindings.signal(this, 'confirmedSelection', val);
    if (this.state.spec.actions && this.state.spec.actions[0]) this.state.spec.actions[0](val);
},
    open: function open(spec) {
    //  spec can be:
    //     narrowSpec = {
    //         init: function(whenDone) {},
    //         candidates: /*list ||*/function(func) {},
    //         candidatesUpdater: function(input, callback) {}, /*called when called when input changed, callback should get new list*/
    //         prompt: 'string',
    //         input: 'string', /*initial input*/
    //         preselect: 0,/*index || candidate*/
    //         ?keymap: {/*maps keyStrings to actions*/},
    //         ?history: [/*previous inputs*/],
    //         actions [/*list of functions receiving selected candidate*/],
    //         close: function() {},
    //         ?test: function(filter, candidate) {/**/},
    //         ?sort
    //     }
    var narrower = this;
    function run() {
        var candidates = (Object.isArray(spec.candidates) ?
                spec.candidates : spec.candidates()) || [];
        spec.actions = spec.actions || [Functions.Null];
        var s = narrower.state = {
            spec: spec,
            prompt: spec.prompt,
            layout: narrower.initLayout(spec.maxItems || candidates.length),
            allCandidates: candidates,
            filteredCandidates: candidates,
            previousCandidateProjection: null,
            candidatesUpdater: spec.candidatesUpdater,
            candidatesUpdaterMinLength: spec.candidatesUpdaterMinLength,
            filters: []
        };
        narrower.renderContainer(s.layout);
        narrower.renderInputline(s.prompt, s.layout);
        narrower.selectN(spec.preselect || 0);
        narrower.focus();
        if (spec.input) {
            (function() { narrower.setInput(spec.input); }).delay(0);
        }
    }
    if (spec.init) spec.init(run); else run();
},
    activate: function activate() {
        this.renderContainer(this.state.layout);
        this.get('inputLine').focus();
    },
    deactivate: function activate() {
        lively.ide.tools.SelectionNarrowing.lastActive = this;
        $world.activateTopMostWindow();
        this.setVisible(false);
    },
    renderContainer: function renderContainer(layout) {
    lively.ide.tools.SelectionNarrowing.lastActive = null;
    if (!this.owner) this.openInWorld();
    if (!this.isVisible()) this.setVisible(true);
    var visibleBounds = lively.morphic.World.current().visibleBounds();
    this.setExtent(visibleBounds.extent()
        .withY(layout.listItemHeight*layout.noOfCandidatesShown+layout.inputLineHeight)
        .minPt(layout.maxExtent));
    this.align(
        this.bounds().bottomCenter(),
        visibleBounds.bottomCenter().addXY(0, -layout.padding));
},
    renderInputline: function renderInputline(prompt, layout) {
    var inputLine = this.getMorphNamed('inputLine');
    if (!inputLine) {
        inputLine = lively.BuildSpec('lively.ide.tools.CommandLine').createMorph();
        inputLine.name = 'inputLine';
        prompt && inputLine.setLabel(prompt);
        this.addMorph(inputLine);
        inputLine.setExtent(pt(this.getExtent().x, layout.inputLineHeight));
        inputLine.setTheme('ambiance');
        inputLine.jQuery('.ace-scroller').css({'background-color': 'rgba(32, 32, 32, 0.3)'});
        lively.bindings.connect(inputLine, 'inputChanged', this, 'filter');
        lively.bindings.connect(inputLine, 'input', this, 'onSelectionConfirmed');
        inputLine.clearOnInput = false;
        // also look at the key commands of the inputLine
        inputLine.addScript(function onKeyDown(evt) {
            var sig = evt.getKeyString();
            switch(sig) {
                case 'Enter': this.commandLineInput(this.getInput()); evt.stop(); return true;
                case 'Esc': case 'Control-C': case 'Control-G': this.clear(); evt.stop(); return true;
                default: return $super(evt);        
            }
        });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // redefine exec code of commands locally so we dan't have to fiddle with keybindings
        inputLine.modifyCommand('golinedown', {exec: function (ed,args) { ed.$morph.owner.selectNext(); }});
        inputLine.modifyCommand('golineup', {exec: function (ed) { ed.$morph.owner.selectPrev(); }});
        inputLine.modifyCommand('gotopageup', {
            exec: function (ed) {
                var narrower = ed.$morph.owner;
                narrower.selectN(narrower.currentSel - narrower.state.layout.noOfCandidatesShown);
            }
        });
        inputLine.modifyCommand('gotopagedown', {
            exec: function (ed) {
                var narrower = ed.$morph.owner;
                narrower.selectN(narrower.currentSel + narrower.state.layout.noOfCandidatesShown);
            }
        });
    }
    inputLine.setPosition(pt(0, this.getExtent().y-layout.inputLineHeight));
},
    withInputLineDo: function(func) {
        var inputLine = this.get('inputLine');
        if (inputLine) func.call(this, inputLine);
        else this.withInputLineDo.bind(this, func).delay(0.1);
    },
    selectInput: function selectInput() {
        this.withInputLineDo(function(inputLine) { inputLine.selectAll(); });
    },
    setInput: function(string) {
        this.withInputLineDo(function(inputLine) {
            inputLine.setInput(string);
            inputLine.withAceDo(function(ed) { ed.selection.moveCursorLineEnd(); });
        });
    },
    renderList: function renderList(candidates, prevSel, currentSel, layout) {
    prevSel = prevSel || 0; currentSel = currentSel || 0;

    if (candidates.length === 0) {
        this.ensureItems(0, layout);
        return;
    }

    var container = this,
        prevProj = this.state.previousCandidateProjection || lively.ArrayProjection.create(candidates, Math.min(candidates.length, layout.noOfCandidatesShown), prevSel),
        proj = lively.ArrayProjection.transformToIncludeIndex(prevProj, currentSel);
    this.state.previousCandidateProjection = proj;

    var projectedCandidates = lively.ArrayProjection.toArray(proj),
        projectedCurrentSelection = lively.ArrayProjection.originalToProjectedIndex(proj, currentSel);
    this.ensureItems(projectedCandidates.length, layout).forEach(function(item, i) {
        var candidate = projectedCandidates[i], string = this.candidateToString(candidate);
        item.candidate = candidate || string;
        item.textString = string;
        item.setHandStyle("pointer");
        if (i === projectedCurrentSelection) {
            item.addStyleClassName('selected');
        } else {
            item.removeStyleClassName("selected");
        }
    }, this);
},
    reset: function reset() {
    this.connections = {confirmedSelection: {}, selection: {}, escapePressed: {}};
    this.getPartsBinMetaInfo().addRequiredModule('lively.ide.tools.CommandLine');
    this.removeAllMorphs();
    this.currentSel = 0;
    this.initialSelection = 1; // index to select
    this.showDelay = 700; // ms
    this.doNotSerialize = ['timeOpened', 'state'];
    this.state = null;
    this.applyStyle({clipMode: 'hidden'});
    this.setZIndex(1000);
    
".tab-list {\n"
+ "    background-color: rgba(1,1,1,0.5);\n"
+ "	border-radius: 5px;\n"
+ "}\n"
+ 
+ ".tab-list-item span {\n"
+ "	font-family: Verdana;\n"
+ "	font-size: 14pt;\n"
+ "	color: white !important;\n"
+ "	font-width: bold !important;\n"
+ "	text-shadow: none           !important;\n"
+ "}\n"
+ 
+ ".tab-list-item.selected {\n"
+ "	font-weight: normal;\n"
+ "	background-color: rgba(1,1,1,0.4);\n"
+ "	border-radius: 5px !important;\n"
+ "	border: 0px white solid !important;\n"
+ "}"
},
    selectCurrent: function selectCurrent() {
    this.currentSel = (this.currentSel || 0);
    if (!this.submorphs[this.currentSel]) this.currentSel = 0;
    if (this.submorphs[this.currentSel]) this.selectN(this.currentSel);
},
    selectN: function selectN(n) {
    var candidates = this.state.filteredCandidates;
    n = Math.min(Math.max(n, 0), candidates.length-1);
    var item = candidates[n];
    this.renderList(candidates, this.currentSel, n, this.state.layout);
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    this.currentSel = n;
    if (item && item.value) item = item.value;
    lively.bindings.signal(this, 'selection', item);
},
    selectNext: function selectNext() {
    var idx = (this.currentSel || 0) + 1;
    var candidates = this.state.filteredCandidates;
    if (!candidates[idx]) idx = 0;
    this.selectN(idx);
},
    selectPrev: function selectPrev() {
    var idx = (this.currentSel || 0) - 1;
    var candidates = this.state.filteredCandidates;
    if (!candidates[idx]) idx = candidates.length-1;
    this.selectN(idx);
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
    var list = Array.range(1,20000).map(function(i) {
        return {
            isListItem: true,
            string: i + ' ' + randomString(Numbers.random(30, 100)),
            value: i
        };
    });

    var spec = {
        init: function(run) { show('init done!'); run(); },
        candidates: list,
        preselect: 3,
        actions: [function(candidate) { show('selected ' + candidate); }],
        close: function() { show('narrower closed'); }
    }

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    this.open(spec);
}
})

}) // end of module
