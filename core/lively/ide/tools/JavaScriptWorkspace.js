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
    layout: { adjustForNewBounds: true },
    name: "JavaScript workspace",
    submorphs: [{
        _Extent: lively.pt(220.0,333.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(512.0,22.0),
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
            _Extent: lively.pt(211.0,298.0),
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
            name: "workspaceVarObserver"
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(60.0,20.0),
            _Position: lively.pt(94.0,4.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            label: "depth: 1",
            layout: { moveHorizontal: true },
            name: "depthButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
                    var obs = this.get('workspaceVarObserver');
                    var workspace = this.get('workspace');
                    var self = this;
                    $world.prompt("print depth of objects", function(input) {
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
            _Position: lively.pt(156.0,4.0),
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            label: "reset",
            layout: { moveHorizontal: true },
            name: "resetButton",
            sourceModule: "lively.morphic.Widgets",
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
                    this.get('workspace').resetState();
                }
        }]
    },{
        _AutocompletionEnabled: true,
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(729.0,333.0),
        _FontSize: 12,
        _LineWrapping: false,
        _Position: lively.pt(3.0,22.0),
        _ShowActiveLine: false,
        _ShowErrors: true,
        _ShowGutter: false,
        _ShowIndents: true,
        _ShowInvisibles: false,
        _ShowPrintMargin: false,
        _ShowWarnings: true,
        _SoftTabs: true,
        _TextMode: "javascript",
        _aceInitialized: true,
        allowInput: true,
        evalEnabled: true,
        className: "lively.morphic.CodeEditor",
        layout: { resizeHeight: true, resizeWidth: true },
        name: "workspace",
        state: {depth: 1,doNotSerialize: ["workspaceVars"],workspaceVars: {}},
        storedString: "// Enter JavaScript code in this text\n\
    // Use Command-d to evaluate and Command-p to print\n\
    // the selected text or current line\n\
    ",
        textMode: "javascript",
        onWindowGetsFocus: function onWindowGetsFocus() { this.focus(); },
        animatedSetBounds: function animatedSetBounds(morph, bounds) {
        // this.setBounds(newEditorBounds);
        // this.animatedSetBounds(this, this.bounds().withExtent(this.getExtent().addXY(10,0)));
        var morphBounds = morph.bounds();
        var posDiff = bounds.topLeft().subPt(morphBounds.topLeft());
        var extentDiff = bounds.extent().subPt(morphBounds.extent());

        var time = 400; // ms
        var steps = 10;
        var stepMove = posDiff.scaleBy(1/steps);
        var stepResize = extentDiff.scaleBy(1/steps);
        animatedScale(steps);

        function animatedScale(step) {
            if (step === 0) { morph.setBounds(bounds); return; }
            morph.moveBy(stepMove);
            morph.resizeBy(stepResize);
            animatedScale.curry(step-1).delay(time/steps / 1000);
        }

    },
      sourceNameForEval: function sourceNameForEval() {
      return (this.getWindow() ? this.getWindow().getTitle() : "JS-workspace") + "-" + Date.now();
    },
        boundEval: function boundEval(__evalStatement, __evalOptions) {
        // Evaluate the string argument in a context in which "this" is
        // determined by the reuslt of #getDoitContext
        var ctx = this.getDoitContext() || this, result;
        __evalOptions = __evalOptions || {};
    
        if (!this.state.workspaceVars) this.state.workspaceVars = {};
        if (!this.state.defRanges) this.state.defRanges = {};
        var defRanges = {};
    
        lively.lang.VM.runEval(__evalStatement, {
            context: ctx,
            topLevelVarRecorder: this.state.workspaceVars,
            topLevelDefRangeRecorder: __evalOptions.range ? defRanges : null,
            sourceURL: __evalOptions.sourceURL
        }, function(err, _result) { result = err || _result; });
    
        __evalOptions.range && Object.keys(defRanges).forEach(function(key) {
            var defRangesForVar = defRanges[key];
            defRangesForVar.forEach(function(range) {
                range.start += __evalOptions.range.start.index;
                range.end += __evalOptions.range.start.index;
            });
        });
    
        this.state.defRanges = Object.merge([this.state.defRanges, defRanges]);
    
        return result;
    },
        getVarValue: function getVarValue(varName) {
        return !this.state.workspaceVars ?
          undefined : this.state.workspaceVars[varName];
    },
        getVarValue: function setVarValue(varName, val) {
        if (!this.state.workspaceVars) this.state.workspaceVars = {};
        return this.state.workspaceVars[varName] = val;
    },
        hideVariableArea: function hideVariableArea() {
        var newEditorBounds = rect(pt(3,22), this.get("listContainer").bounds().bottomRight());
        // this.setBounds(newEditorBounds);
        this.updateToggleVarsButton(newEditorBounds);
        this.animatedSetBounds(this, newEditorBounds);
        this.stopStepping();
    },

        onLoad: function onLoad() {
            $super();
            // FIXME...
            this.getWindow().addMorphBack(this.get("listContainer"));
        },

        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
            $super();
            this.getWindow().addMorphBack(this.get("listContainer"));
            this.resetState();
        },
        rerender: function rerender() {
            var obs = this.get('workspaceVarObserver');
            obs.setList([]);
            this.showVars();
        },
        reset: function reset() {
        this.setStyleSheet('.list-item { font-size: 9pt; }')
        this.state = {
            doNotSerialize: ['workspaceVars'],
            workspaceVars: {},
            depth: 1
        };
        this.showVars();
        this.textString = '';
        lively.bindings.connect(this.get("toggleVarsButton"), 'fire', this, 'toggleVarArea');
    },
        resetState: function resetState() {
        this.owner.targetMorph = this;
        this.state = {
            depth: 1,
            doNotSerialize: ["workspaceVars"],
            workspaceVars: {},
            defRanges: {}
        }
        this.showVars();
        lively.bindings.connect(this.get("workspaceVarObserver"), "selection", this, "selectVarDef");
    },
        selectVarDef: function selectVarDef(selection) {
        if (!selection) return;
        var name = selection.item.value.key
        var defRanges = this.state.defRanges[name];
        if (!defRanges || !defRanges.length) return;
        var range = defRanges.last();
        this.setSelectionRange(range.start, range.end, true);
    },
        showVariableArea: function showVariableArea() {
        var border = 2,
            varAreaWidth = 220,
            varList = this.get("listContainer"),
            newEditorBounds = rect(
                pt(3,22),
                varList.bounds().bottomRight().addXY(-3 - varAreaWidth - border, 0));
    
        varList.setExtent(varList.getExtent().withX(varAreaWidth));
        varList.align(varList.bounds().topRight(), this.getWindow().innerBounds().topRight().addXY(-3,22));
    
        this.updateToggleVarsButton(newEditorBounds);
    
        this.animatedSetBounds(this, newEditorBounds);
        this.startStepping(1000, "showVars");
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
                var string = String(obj);
                return string.truncate(250);
                var string;
                if (obj && obj.isMorph) {
                    string = obj.toString();
                } else {
                     string = Objects.inspect(obj, {maxDepth: s.depth});
                }
                return string.truncate(250);
            }
        },
        toggleVarArea: function toggleVarArea() {
        this[this.varAreaIsHidden() ? "showVariableArea" : "hideVariableArea"]();
    },
        updateToggleVarsButton: function updateToggleVarsButton(bnds) {
        var btn = this.get("toggleVarsButton");
        bnds = bnds || this.bounds();

        var newButtonBounds = btn.bounds().withTopRight(bnds.topRight().addXY(-4,4))
        this.animatedSetBounds(btn, newButtonBounds);

        var hidden = this.varAreaIsHidden();
        var label = hidden ? "hide vars" : "show vars";
        btn.setLabel(label);
        if (this.owner.submorphs.indexOf(btn) < this.owner.submorphs.indexOf(this))
            this.owner.addMorph(this, btn);
    },
        varAreaIsHidden: function varAreaIsHidden() {
        this.cachedBounds = null;
        this.aceEditor.resize(true)
        var varsAreVisible = this.getWindow().getExtent().x - this.bounds().width > 30;
        return !varsAreVisible
    },
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this.get("workspaceVarObserver"), "selection", this, "selectVarDef");
    }
    },{
        _BorderColor: Color.rgb(189,190,192),
        _BorderRadius: 5,
        _BorderWidth: 1,
        _Extent: lively.pt(64.0,20.0),
        _Position: lively.pt(664.0,26.0),
        layout: {moveHorizontal: true},
        className: "lively.morphic.Button",
        droppingEnabled: false,
        grabbingEnabled: false,
        label: "show vars",
        name: "toggleVarsButton",
        sourceModule: "lively.morphic.Widgets",
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this.get("workspace"), "toggleVarArea", {});
    }
    }],
    titleBar: "JavaScript Workspace",
    onKeyDown: function onKeyDown(evt) {
        var keys = evt.getKeyString();
        if (keys === "Control-Shift-V" || keys === "Command-Shift-V") {
            this.targetMorph.toggleVarArea();
            evt.stop(); return true;
        }
        $super(evt);
    }
});

Object.extend(lively.ide.tools.JavaScriptWorkspace, {
    open: function() {
        return lively.BuildSpec('lively.ide.tools.JavaScriptWorkspace')
            .createMorph().openInWorld($world.positionForNewMorph()).comeForward();
    }
});

}) // end of module
