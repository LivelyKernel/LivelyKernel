module("lively.ide.tools.JavaScriptWorkspace").requires("lively.ide.CodeEditor", "lively.persistence.BuildSpec", "lively.lang.VM").toRun(function() {

lively.BuildSpec("lively.ide.tools.JavaScriptWorkspace", {
    _BorderColor: null,
    _BorderWidth: 1,
    _Extent: lively.pt(735.0,358.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    highlighted: false,
    layout: {
        adjustForNewBounds: true
    },
    state: "expanded",
    submorphs: [{
        _AutocompletionEnabled: true,
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(464.0,333.0),
        _FontSize: 12,
        _Position: lively.pt(3.0,22.0),
        _ShowGutter: false,
        className: "lively.morphic.CodeEditor",
        layout: { resizeHeight: true, resizeWidth: true },
        name: "workspace",
        state: {
            depth: 1,
            doNotSerialize: ["workspaceVars"],
            workspaceVars: {}
        },

        textString: (function() {
            var cmd = navigator.userAgent.indexOf('Mac OS X') === 0 ? 'Control' : 'Command';
            return Strings.format(
                "// Enter JavaScript code in this text\n"
              + "// Use %s-d to evaluate and %s-p to print\n"
              + "// the selected text or current line\n",
              cmd, cmd);
            
        })(),

        textMode: "javascript",
        boundEval: function boundEval(__evalStatement) {
        // Evaluate the string argument in a context in which "this" is
        // determined by the reuslt of #getDoitContext
        var ctx = this.getDoitContext() || this,
            result;
    
        if (!this.state.workspaceVars) this.state.workspaceVars = {};
    
        lively.lang.VM.runEval(__evalStatement, {
            context: ctx,
            topLevelVarRecorder: this.state.workspaceVars
        }, function(err, _result) { result = err || _result; })
        return result;
    },
        rerender: function rerender() {
        var obs = this.get('workspaceVarObserver');
        obs.setList([]);
        this.showVars();
    },
        reset: function reset() {
        this.getPartsBinMetaInfo().addRequiredModule('lively.lang.VM');
        this.setStyleSheet('.list-item { font-size: 9pt; }')
        this.state = {
            doNotSerialize: ['workspaceVars'],
            workspaceVars: {},
            depth: 1
        };
        this.showVars();
        this.textString = '';
    },
        resetState: function resetState() {
            this.state = {
            depth: 1,
            doNotSerialize: ["workspaceVars"],
            workspaceVars: {}
        }
        this.showVars();
    },
        showVars: function showVars() {
        // this.startStepping(1000, 'showVars')
        // obs.setList([]);
    
        var style = {
            allowInput: false,
            fixedHeight: false, fixedWidth: true,
            whiteSpaceHandling: 'pre',
            cssStylingMode: true
        };
    
        var s = this.state;
        var vars = s.workspaceVars || {};
        var keys = Object.keys(vars);
    
        var obs = this.get('workspaceVarObserver');
        var list = obs.getList() || [];
    
        var preexistingItems = list.filter(function(item) {
                return keys.include(item.value.key); })
            .map(function(ea) {
                ea.value = {key: ea.value.key, value: vars[ea.value.key]};
                ea.morph = render(ea.value.key, ea.value.value, ea.morph);
                return ea
            });
    
        var newItems = keys
            .withoutAll(preexistingItems.pluck('value').pluck('key'))
            .map(function(k) {
                var morph = render(k, vars[k]),
                    item = {morph: morph, isListItem: true, string: 'foo', value: {key: k, value: vars[k]}};
                morph.item = item;
                return item; });
    
        var items = preexistingItems.concat(newItems);
    
        obs.setList(items);
        obs.applyLayout();
    
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    
        function render(key, val, optListItemMorph) {
            var morph = optListItemMorph || createListItemMorph();
    
            var valString = stringifyObj(val);
            var string = key + ': ' + valString;
            if (morph.textString !== string) {
                morph.setClipMode('visible');
                morph.textString = string;
                morph.fitThenDo(function() { morph.setClipMode("hidden"); });
            };
    
            return morph;
        }
    
        function createListItemMorph() {
            var morph = new lively.morphic.Text(
                obs.getExtent()
                    .addXY(-2 * obs.layout.layouter.borderSize, 0)
                    .extentAsRectangle(), '');
    
            morph.applyStyle(style);
    
            morph.addStyleClassName('list-item');
    
            morph.addScript(function showControls() {
                var resetButton = new lively.morphic.Button(this.innerBounds());
                resetButton.align(resetButton.getPosition(), this.innerBounds().bottomLeft());
                this.controls = [
                    this.addMorph(resetButton)
                ];
                this.cachedBounds = null;
                this.owner.applyLayout();
            });
    
            morph.addScript(function hideControls() {
                this.controls.invoke('remove');
                this.controls.length = 0;
                this.owner.applyLayout();
            })
    
            morph.addScript(function onHoverIn(evt) {
                this.showControls();
            });
    
            morph.addScript(function onHoverOut(evt) {
                this.hideControls();
            });
    
            morph.addScript(function onMouseMove(evt) {
                if (this.thereIsAHandInMe) return false;
                this.thereIsAHandInMe = true;
                this.onHoverIn(evt);
            });
    
            morph.addScript(function onMouseOut(evt) {
                var wasHovered = !!this.thereIsAHandInMe;
                var hoverInMorph = evt.relatedTarget && lively.$(evt.relatedTarget).parents('.morphNode').data('morph');
                if (hoverInMorph && (hoverInMorph === this || hoverInMorph.ownerChain().include(this))) return;
                this.thereIsAHandInMe = false;
                wasHovered && this.onHoverOut(evt);
            });
    
            return morph;
        }
    
        function stringifyObj(obj) {
            var string;
            if (obj && obj.isMorph) {
                string = obj.toString();
            } else {
                 string = Objects.inspect(obj, {maxDepth: s.depth});
            }
            return string.truncate(250);
        }
    },
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.getPartsBinMetaInfo().addRequiredModule('lively.lang.VM');
        this.resetState();
        this.startStepping(1000, 'showVars');
    }
    },{
        _Extent: lively.pt(262.0,333.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(469.0,22.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            adjustForNewBounds: true,
            moveHorizontal: true,
            resizeHeight: true,
            resizeWidth: false
        },
        name: "listContainer",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _ClipMode: "auto",
            _Extent: lively.pt(253.0,298.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(4.0,29.0),
            _StyleSheet: ".list-item {\n\
        	font-size: 9pt;\n\
        	font-family: sans-serif;\n\
        	white-space: nowrap;\n\
        	border: #AAA 1px solid !important;\n\
        	background-color: transparent !important;\n\
        }",
            allowDeselectClick: false,
            className: "lively.morphic.MorphList",
            droppingEnabled: true,
            isMultipleSelectionList: true,
            itemList: [],
            layout: {
                adjustForNewBounds: true,
                borderSize: 2,
                extentWithoutPlaceholder: lively.pt(305.0,244.0),
                resizeHeight: true,
                resizeWidth: true,
                spacing: 6,
                type: "lively.morphic.Layout.VerticalLayout"
            },
            name: "workspaceVarObserver",
            sourceModule: "lively.morphic.Lists"
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(60.0,20.0),
            _Position: lively.pt(129.0,4.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            label: "depth: 1",
            name: "depthButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            var obs = this.get('workspaceVarObserver');
            var workspace = this.get('workspace');
            var self = this;
            Global.$world.prompt("print depth of objects", function(input) {
                var n = parseInt(input);
                if (isNaN(n) || n < 0) {
                    Global.show('not a valid input:\n' + input);
                    return;
                }
                self.setLabel('depth: ' + n);
                workspace.state.depth = n;
                workspace.rerender();
            }, workspace.state.depth);
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(60.0,20.0),
            _Position: lively.pt(195.0,4.0),
            className: "lively.morphic.Button",
            label: "reset",
            name: "resetButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            this.get('workspace').resetState();
        }
        }]
    }],
    titleBar: "JavaScript Workspace"
});

}) // end of module
