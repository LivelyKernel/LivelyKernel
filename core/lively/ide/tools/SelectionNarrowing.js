module('lively.ide.tools.SelectionNarrowing').requires("lively.morphic.tools.LargeFilterableList").toRun(function() {
    
lively.persistence.BuildSpec.Registry.set('lively.ide.tools.NarrowingList', lively.BuildSpec("lively.morphic.tools.LargeFilterableList").customize({
    isNarrowingList: true,
    _Extent: lively.pt(900.0,138.0),
    _StyleSheet: ".tab-list {\n"
+ "    background-color: rgba(1,1,1,0.7);\n"
+ "	border-radius: 5px !important;\n"
+ "	box-shadow: 0 0 4px white, inset 0 0 5px white;\n"
+ "}\n"
+ ".tab-list-item span {\n"
+ "	font-family: Monaco, Consolas, monospace;\n"
+ "	font-size: 11pt;\n"
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
    currentSel: 0,
    initialSelection: 1,
    isEpiMorph: true,
    name: "NarrowList",
    showDelay: 700,
    state: null,

    initLayout: function initLayout(noOfCandidates) {
        var visibleBounds = lively.morphic.World.current().visibleBounds(),
            layout = {
                listItemHeight: 22,
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
        this.ignoreMouseInput();
    }

}));

Object.extend(lively.ide.tools.SelectionNarrowing, {

    lastActiveList: null,
    cachedNarrowers: {},

    resetCache: function() {
        Object.keys(this.cachedNarrowers).forEach(function(name) {
            show('resetting narrower %s', name);
            var n = this.cachedNarrowers[name];
            n && n.remove();
            delete this.cachedNarrowers[name];
        }, this);
    },

    getNarrower: function(options) {
        var name = options.name,
            spec = options.spec || {candidates: [], actions: []},
            setup = options.setup,
            reactivateWithoutInit = options.reactivateWithoutInit,
            narrower = name && this.cachedNarrowers[name];
        if (narrower && narrower.state && spec.actions) { // update the actions, they might have changed
            var s = narrower.state.showsActions ? narrower.state.originalState : narrower.state;
            s.actions = spec.actions;
        }
        if (narrower && reactivateWithoutInit) { narrower.activate(); return narrower; }
        if (!narrower) {
            narrower = lively.BuildSpec('lively.ide.tools.NarrowingList').createMorph();
            if (name) {
                this.cachedNarrowers[name] = narrower;
                narrower.name = "NarrowList - " + name;
            }
            lively.bindings.connect(narrower, 'confirmedSelection', narrower, 'deactivate');
            lively.bindings.connect(narrower, 'escapePressed', narrower, 'deactivate');
            setup && setup(narrower);
        }
        return narrower.open(spec);
    },

    chooseOne: function(list, thenDo, options) {
        options = options || {};
        var remove = !options.hasOwnProperty('remove') || options.remove;
        var thenDoCalled = false;
        lively.ide.tools.SelectionNarrowing.getNarrower({
            name: options.name,
            setup: function(narrower) {
                remove && lively.bindings.connect(narrower, 'deactivate', narrower, 'remove');
                thenDo && lively.bindings.connect(narrower, 'escapePressed', thenDo, 'call', {removeAfterUpdate: true});
            },
            spec: {
                prompt: options.prompt || 'select item: ',
                candidates: list.asListItemArray(),
                actions: options.actions || [
                    {name: 'with item do', exec: function(candidate) {
                        thenDoCalled = true;
                        thenDo(null, candidate); }},
                ]
            }
        });
    },

    example: function() {
        // lively.ide.tools.SelectionNarrowing.example();
        lively.ide.tools.SelectionNarrowing.getNarrower({
            setup: function(narrower) {
                lively.bindings.connect(narrower, 'confirmedSelection', narrower, 'remove');
                lively.bindings.connect(narrower, 'escapePressed', narrower, 'remove');
            },
            spec: {
                prompt: 'foo: ',
                candidates: Array.range(0,144).asListItemArray(),
                actions: [
                    {name: 'action 1', exec: function(candidate) { show("action 1 on " + candidate) }},
                    {name: 'action 2', exec: function(candidate) { show("action 2 on " + candidate) }},
                    {name: 'action 3', exec: function(candidate) { show("action 3 on " + candidate) }}
                ]
            }
        })
    }
});

}) // end of module
