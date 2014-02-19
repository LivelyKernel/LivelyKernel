module('lively.ide.tools.Debugger').requires('lively.persistence.BuildSpec', 'lively.ast.StackReification').toRun(function() {

lively.BuildSpec('lively.ide.tools.Debugger', {
    _BorderColor: Color.rgb(204,0,0),
    _BorderRadius: 3,
    _Extent: lively.pt(698.0,488.0),
    _Position: lively.pt(605.0,90.0),
    _StyleClassNames: ["Morph","Window"],
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(4.0,22.0),
    doNotSerialize: ["cameForward"],
    draggingEnabled: true,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "Debugger",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [lively.BuildSpec({
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(690.0,462.0),
        _Fill: Color.rgb(242,242,242),
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        doNotSerialize: ["topFrame","currentFrame"],
        droppingEnabled: true,
        isCopyMorphRef: true,
        layout: {
            borderSize: 4.7,
            extentWithoutPlaceholder: lively.pt(667.0,504.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 5.99,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        morphRefId: 2,
        name: "Debugger",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(230,230,230),
            _BorderWidth: 1,
            _ClipMode: "auto",
            _Extent: lively.pt(680.6,106.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(4.7,4.7),
            changeTriggered: true,
            className: "lively.morphic.List",
            doNotSerialize: ["selection"],
            droppingEnabled: true,
            layout: {
                adjustForNewBounds: true,
                resizeWidth: true
            },
            name: "FrameList",
            sourceModule: "lively.morphic.Lists",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("Debugger"), "setCurrentFrame", {});
        },
            reset: function reset() {
            this.doNotSerialize = ["selection"];
        }
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(680.6,23.0),
            _Position: lively.pt(4.7,116.7),
            className: "lively.morphic.Box",
            droppingEnabled: true,
            layout: {
                borderSize: 1.59,
                extentWithoutPlaceholder: lively.pt(684.1,29.0),
                resizeWidth: true,
                spacing: 4.670000000000001,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 3,
                _BorderWidth: 1,
                _Extent: lively.pt(131.7,19.8),
                _Position: lively.pt(1.6,1.6),
                className: "lively.morphic.Button",
                isCopyMorphRef: true,
                isPressed: false,
                label: "continue",
                layout: {
                    resizeHeight: true,
                    resizeWidth: true
                },
                morphRefId: 1,
                name: "ContinueButton",
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("Debugger"), "resume", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 3,
                _BorderWidth: 1,
                _Extent: lively.pt(131.7,19.8),
                _Position: lively.pt(138.0,1.6),
                className: "lively.morphic.Button",
                isPressed: false,
                label: "step into",
                layout: {
                    resizeHeight: true,
                    resizeWidth: true
                },
                name: "StepIntoButton",
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("Debugger"), "stepInto", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 3,
                _BorderWidth: 1,
                _Extent: lively.pt(131.7,19.8),
                _Position: lively.pt(274.4,1.6),
                className: "lively.morphic.Button",
                isCopyMorphRef: true,
                isPressed: false,
                label: "step over",
                layout: {
                    resizeHeight: true,
                    resizeWidth: true
                },
                morphRefId: 1,
                name: "StepOverButton",
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("Debugger"), "stepOver", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 3,
                _BorderWidth: 1,
                _Extent: lively.pt(131.7,19.8),
                _Position: lively.pt(410.8,1.6),
                className: "lively.morphic.Button",
                isCopyMorphRef: true,
                isPressed: false,
                label: "restart",
                layout: {
                    resizeHeight: true,
                    resizeWidth: true
                },
                morphRefId: 1,
                name: "RestartButton",
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("Debugger"), "restart", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 3,
                _BorderWidth: 1,
                _Extent: lively.pt(131.7,19.8),
                _Position: lively.pt(547.3,1.6),
                className: "lively.morphic.Button",
                isCopyMorphRef: true,
                isPressed: false,
                label: "browse",
                layout: {
                    resizeHeight: true,
                    resizeWidth: true
                },
                morphRefId: 1,
                name: "BrowseButton",
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("Debugger"), "browse", {});
            }
            }]
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(680.6,311.6),
            _Fill: Color.rgb(242,242,242),
            _Position: lively.pt(4.7,145.7),
            className: "lively.morphic.Box",
            droppingEnabled: true,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(657.6,353.6),
                resizeHeight: true,
                resizeWidth: true,
                spacing: 6.795,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _AutocompletionEnabled: true,
                _BorderColor: Color.rgb(230,230,230),
                _BorderRadius: 0,
                _BorderWidth: 1,
                _Extent: lively.pt(489.5,311.6),
                _FontSize: 12,
                _LineWrapping: true,
                _InputAllowed: true,
                _Position: lively.pt(1.0,1.1),
                _ShowActiveLine: false,
                _ShowErrors: true,
                _ShowGutter: true,
                _ShowIndents: true,
                _ShowInvisibles: false,
                _ShowPrintMargin: false,
                _ShowWarnings: true,
                _SoftTabs: true,
                _TextMode: "javascript",
                _Theme: lively.Config.get("aceWorkspaceTheme"),
                _aceInitialized: true,
                accessibleInInactiveWindow: true,
                allowInput: true,
                className: "lively.morphic.CodeEditor",
                evalEnabled: false,
                fixedHeight: true,
                name: "FrameSource",
                lastSaveSource: '',
                sourceModule: "lively.ide.CodeEditor",
                boundEval: function boundEval(str) {
              var frame = this.get("Debugger").currentFrame;
              if (!frame) return;
              var str = "function(){\n" + str + "\n}";
              var fun = Function.fromString(str).forInterpretation();
              fun.lexicalScope = frame;
              fun.basicApply = function(f) {
                f.mapping = frame.mapping;
                return lively.ast.Function.prototype.basicApply.call(this, f);
              };
              try {
                return fun.call(frame.getThis());
              } finally {
                this.get("FrameScope").updateList(
                    frame.listItemsForIntrospection()
                );
              }
            },
                connectionRebuilder: function connectionRebuilder() {
            },
                debugSelection: function debugSelection() {
              var frame = this.get("Debugger").currentFrame;
              if (!frame) return;
              var str = "function(){\n" + this.getSelectionOrLineString() + "\n}";
              var fun = Function.fromString(str).forInterpretation();
              fun.lexicalScope = frame;
              try {
                return fun.apply(frame.getThis(), [], {breakAtCalls:true});
              } catch(e) {
                if (e.isUnwindException) {
                  lively.ast.openDebugger(e.topFrame);
                } else {
                  this.showError(e);
                }
              } finally {
                this.get("FrameScope").updateList(
                    frame.listItemsForIntrospection()
                );
              }
            },
                highlightPC: function highlightPC(target) {
                var frame = this.get("Debugger").currentFrame;
                if (frame && frame.pc !== null) {
                    var style = { backgroundColor: Color.rgb(255,255,127) };
                    target.emphasize(style, frame.pc.pos[0], frame.pc.pos[1]);
                }
            },
                reset: function reset() {
                lively.bindings.disconnectAll(this);
                this.textString = '';
                this.savedTextString = '';
                this.submorphs[0].textString = '';
                this.setExtent(pt(100,100));
            },
                showSource: function showSource(frame) {
                this.textString = frame.func ? frame.func.getSource() : '';
            }
            },{
                _BorderColor: Color.rgb(230,230,230),
                _BorderRadius: 0,
                _BorderWidth: 1,
                _ClipMode: {
                    x: "hidden",
                    y: "auto"
                },
                _Extent: lively.pt(184.3,311.6),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(496.3,0.0),
                className: "lively.morphic.Box",
                droppingEnabled: true,
                layout: {
                    borderSize: 1.325,
                    extentWithoutPlaceholder: lively.pt(657.6,94.3),
                    resizeHeight: true,
                    resizeWidth: false,
                    spacing: 0,
                    type: "lively.morphic.Layout.VerticalLayout"
                },
                name: "FrameScope",
                sourceModule: "lively.morphic.Core",
                submorphs: [{
                    _Extent: lively.pt(181.7,0.0),
                    _Fill: Color.rgb(255,255,255),
                    _Position: lively.pt(1.3,1.3),
                    className: "lively.morphic.Tree",
                    depth: 0,
                    isInLayoutCycle: false,
                    showMoreNode: null,
                    sourceModule: "lively.morphic.Widgets"
                }],
                tree: {
                    isMorphRef: true,
                    path: "submorphs.0"
                },
                createItem: function createItem(obj, property) {
                var value = obj[property];
                var item = {name: property, data: value, inspector: this, parent: obj};
                item.description = this.describe(value);
                if (!this.isPrimitive(value)) {
                    item.children = [];
                    Object.addScript(item, function onExpand() { this.inspector.expand(this); });
                    Object.addScript(item, function onUpdateChildren() { this.inspector.expand(this); });
                }
                Object.addScript(item, function onUpdate() {
                    this.description = this.inspector.describe(this.data);
                });
                return item;
            },
                describe: function describe(obj) {
                var str;
                if (obj && obj.name) {
                    str = Object.isFunction(obj.name) ? obj.name() : obj.name;
                }
                if (!str) str = Objects.shortPrintStringOf(obj);
                if (str.length > 32) str = str.substring(0, 36) + '...';
                return str;
            },
                expand: function expand(item) {
                var props = Properties.own(item.data);
                if (!Object.isArray(item.data)) props = props.sort();
                var newChildren = [];
                var lookup = {};
                item.children.each(function(i) { lookup[i.name] = i; });
                props.each(function(prop) {
                    var existing = lookup[prop];
                    if (existing) {
                        existing.data = item.data[prop];
                        newChildren.push(existing);
                    } else {
                        newChildren.push(this.createItem(item.data, prop));
                    }
                }, this);
                item.children = newChildren;
            },
                isPrimitive: function isPrimitive(value) {
                return value === null ||
                       value === undefined ||
                       Object.isString(value) ||
                       Object.isNumber(value) ||
                       Object.isBoolean(value);
            },
                reset: function reset() {
                this.tree.stopStepping();
                this.tree.setItem({name: '', children: []});
                this.tree.startStepping(500, 'update');
            },
                updateScope: function updateScope(item) {
                var scope = item.data;
                if (scope.getMapping() === Global) {
                    delete item.children;
                    return;
                }
                var props = Properties.own(scope.getMapping()).sort();
                var lookup = {};
                if (item.children) item.children.each(function(i) { lookup[i.name] = i; });
                item.children = [];
                props.each(function(prop) {
                    var existing = lookup[prop];
                    if (existing) {
                        existing.data = scope.get(prop);
                        item.children.push(existing);
                    } else {
                        item.children.push(this.createItem(scope.getMapping(), prop));
                    }
                }, this);
                if (scope = scope.getParentScope()) {
                    var sname = scope.getMapping() === Global
                              ? 'Global'
                              : 'containing scope'
                    var scopeItem = {
                        name: '<' + sname + '>',
                        data: scope
                    };
                    this.updateScope(scopeItem);
                    item.children.push(scopeItem);
                }
            },
                updateList: function updateList(frame) {
                this.tree.item = {
                    name: '<current scope>',
                    data: frame.getScope()
                };
                this.updateScope(this.tree.item);
                this.tree.expand();
                this.tree.update();
            }
            }]
        }],
        browse: function browse() {
        this.currentFrame && this.currentFrame.func.browse();
    },
        reset: function reset() {
        this.doNotSerialize = ['topFrame', 'currentFrame'];
        this.get("FrameList").setList([]);
        this.get("FrameSource").reset();
        this.get("FrameScope").reset();
    },
        restart: function restart() {
        var frame = this.currentFrame;
        lively.ast.doWithHalt(function() {
            frame.restart();
        }, this.setTopFrame.bind(this));
    },
        resume: function resume() {
        var cont = new lively.ast.Continuation(this.topFrame);
        cont = cont.resume();
        if (cont.isContinuation)
            this.setTopFrame(cont.currentFrame);
        else
            this.owner.remove();
    },
        setCurrentFrame: function setCurrentFrame(frame) {
        this.currentFrame = frame;
        this.get("FrameSource").showSource(frame);
        this.get("FrameScope").updateList(frame);
        if (frame.isResuming()) {
            this.get("ContinueButton").isActive = true;
            this.get("StepIntoButton").isActive = true;
            this.get("StepOverButton").isActive = true;
            this.get("RestartButton").isActive = true;
        } else {
            this.get("ContinueButton").isActive = false;
            this.get("StepIntoButton").isActive = false;
            this.get("StepOverButton").isActive = false;
            this.get("RestartButton").isActive = false;
        }
    },
        setTopFrame: function setTopFrame(topFrame) {
        this.topFrame = topFrame;
        var frames = [];
        var frame = topFrame;
        do {
            var name = frame.func.name();
            frames.push({
                isListItem: true,
                string: frame.isResuming() ? name : name + " [native]",
                value: frame
            });
        } while (frame = frame.getParentFrame());
        this.get("FrameList").updateList(frames);
        this.get("FrameList").setSelection(topFrame);
        return true;
    },
        stepInto: function stepInto() {
        var frame = this.currentFrame;
        lively.ast.doWithHalt(function() {
            frame.stepToNextStatement(true);
        }, this.setTopFrame.bind(this));
    },
        stepOver: function stepOver() {
        var frame = this.currentFrame;
        lively.ast.doWithHalt(function() {
            frame.stepToNextStatement();
        }, this.setTopFrame.bind(this));
    }
    })],
    titleBar: "Debugger",
    withoutLayers: "[GrabbingLayer]"
});

}) // end of module
