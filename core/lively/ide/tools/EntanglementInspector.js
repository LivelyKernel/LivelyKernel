module('lively.ide.tools.EntanglementInspector').requires('lively.morphic.ColorChooserDraft').toRun(function(){

lively.BuildSpec('lively.ide.tools.EntanglementInspector', {
    _BorderColor: Color.rgb(204,0,0),
    _BorderRadius: 6.29,
    _Extent: lively.pt(764.0,560.0),
    _Fill: Color.rgb(255,255,255),
    _Position: lively.pt(150.0,173.0),
    _StyleClassNames: ["Morph","Window"],
    cameForward: false,
    className: "lively.morphic.Window",
    collapsedExtent: lively.pt(248.0,22.0),
    collapsedPosition: lively.pt(1149.5,39.5),
    collapsedTransform: {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 1149.5,
        f: 39.5
    },
    contentOffset: lively.pt(3.0,22.0),
    doNotCopyProperties: [],
    doNotSerialize: [],
    draggingEnabled: true,
    droppingEnabled: false,
    entanglement: "[object Object]",
    expandedExtent: lively.pt(667.0,554.0),
    expandedPosition: lively.pt(1149.5,39.5),
    expandedTransform: {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 1149.5,
        f: 39.5
    },
    helperMorphs: "[<lively.morphic.ReframeHandle#D13D2...>,<lively.morphic.ReframeHandle#319CA...>,<lively.morphic.ReframeHandle#013DB...>]",
    highlighted: false,
    ignoreEventsOnExpand: false,
    isCopyMorphRef: true,
    layout: {
        adjustForNewBounds: true
    },
    listListener: "AttributeConnection([object Object].createEntangledMorph --> <lively.morphic.List#0531B... - EntangledMorphsList>.addItem)",
    marshalledEntanglement: "[object Object]",
    marshalledMethods: "[object Object]",
    methodTree: {
        isMorphRef: true,
        name: "method-tree-view"
    },
    morphList: {
        isMorphRef: true,
        name: "EntangledMorphsList"
    },
    morphRefId: 1,
    name: "Entanglement Inspector",
    searchActive: true,
    sourceModule: "lively.morphic.Widgets",
    state: "expanded",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderStyle: "hidden",
        _BorderWidth: 1,
        _Extent: lively.pt(755.0,531.0),
        _Fill: Color.rgba(204,204,204,0),
        _Position: lively.pt(5.0,24.0),
        className: "lively.morphic.Panel",
        doNotCopyProperties: [],
        doNotSerialize: [],
        droppingEnabled: true,
        isCopyMorphRef: true,
        lastFocused: null,
        layout: {
            adjustForNewBounds: true,
            borderSize: 10,
            extentWithoutPlaceholder: lively.pt(617.0,424.0),
            grid: lively.pt(37.8,26.6),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 15,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        morphRefId: 1,
        ownerApp: "[object Object]",
        ownerWidget: "[object Object]",
        sourceModule: "lively.morphic.MorphAddons",
        submorphs: [{
            _BorderStyle: "hidden",
            _Extent: lively.pt(735.0,49.8),
            _Fill: Color.rgba(0,0,204,0),
            _Opacity: 0.9777,
            _Position: lively.pt(10.0,10.0),
            className: "lively.morphic.Box",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            layout: {
                adjustForNewBounds: true,
                borderSize: 10,
                resizeWidth: true,
                spacing: 15,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "source-url-panel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(122,122,122),
                _BorderRadius: 4.81,
                _BorderWidth: 1.924,
                _Extent: lively.pt(600.0,27.8),
                _Fill: Color.rgb(255,255,255),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 12,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 120.695652,
                _MinTextWidth: 120.695652,
                _Padding: lively.rect(4,2,0,0),
                _Position: lively.pt(10.0,10.0),
                _TextColor: Color.rgb(64,64,64),
                allowInput: true,
                className: "lively.morphic.Text",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: false,
                emphasis: [[0,38,{}]],
                fixedWidth: true,
                grabbingEnabled: false,
                layout: {
                    resizeWidth: true
                },
                name: "spec-url-field",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "lively.ide.tools.EntanglementInspector"
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(100.0,20.0),
                _Position: lively.pt(625.0,10.0),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                label: "Open",
                name: "OpenButton",
                pinSpecs: [{
                    accessor: "fire",
                    location: 1.5,
                    modality: "output",
                    pinName: "fire",
                    type: "Boolean"
                }],
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "doAction", {});
                lively.bindings.connect(this, "fire", this.get("Entanglement Inspector"), "openBuildSpecFile", {});
            },
                doAction: function doAction() {
                            
                        }
            }]
        },{
            _BorderStyle: "hidden",
            _BorderWidth: 1,
            _Extent: lively.pt(735.0,188.1),
            _Fill: Color.rgba(0,0,204,0),
            _Position: lively.pt(10.0,74.8),
            className: "lively.morphic.Box",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            layout: {
                borderSize: 10,
                extentWithoutPlaceholder: lively.pt(598.0,347.0),
                resizeHeight: true,
                resizeWidth: true,
                spacing: 15,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "upper-panel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(153,153,153),
                _BorderStyle: "dashed",
                _ClipMode: "scroll",
                _Extent: lively.pt(547.0,168.1),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(10.0,10.0),
                className: "lively.morphic.Box",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    resizeHeight: true,
                    resizeWidth: true
                },
                name: "EntanglementAttributeVisualizer",
                sourceModule: "lively.morphic.Core",
                submorphs: [{
                    _Extent: lively.pt(547.0,20.0),
                    _Fill: Color.rgb(255,255,255),
                    _Visible: true,
                    className: "lively.morphic.Tree",
                    depth: 0,
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    draggingEnabled: false,
                    droppingEnabled: false,
                    grabbingEnabled: false,
                    isInLayoutCycle: false,
                    name: "attribute-tree-view",
                    searchActive: false,
                    searchBar: null,
                    showMoreNode: null,
                    sourceModule: "lively.morphic.Widgets",
                    submorphs: [{
                        _BorderColor: null,
                        _Extent: lively.pt(547.0,20.0),
                        className: "lively.morphic.Box",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
                        droppingEnabled: true,
                        eventsAreIgnored: true,
                        layout: {
                            borderSize: 0,
                            resizeWidth: true,
                            spacing: 5,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _Align: "right",
                            _Extent: lively.pt(10.0,20.0),
                            _FontFamily: "Helvetica",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _Padding: lively.rect(4,2,0,0),
                            _TextColor: Color.rgb(64,64,64),
                            allowInput: false,
                            className: "lively.morphic.Text",
                            doNotCopyProperties: [],
                            doNotSerialize: [],
                            draggingEnabled: false,
                            droppingEnabled: false,
                            emphasis: [[0,1,{}]],
                            evalEnabled: false,
                            fixedHeight: true,
                            fixedWidth: true,
                            grabbingEnabled: false,
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "►",
                            onMouseDown: function onMouseDown(evt) {
                                    if (this.owner.owner.item.children && evt.isLeftMouseButtonDown()) {
                                        this.owner.owner.toggle();
                                    }
                                }
                        },{
                            _Extent: lively.pt(219.0,20.0),
                            _FontFamily: "Helvetica",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(15.0,0.0),
                            _TextColor: Color.rgb(64,64,64),
                            _WhiteSpaceHandling: "pre",
                            allowInput: false,
                            className: "lively.morphic.Text",
                            doNotCopyProperties: [],
                            doNotSerialize: [],
                            draggingEnabled: false,
                            droppingEnabled: false,
                            emphasis: [[0,36,{}]],
                            evalEnabled: false,
                            fixedHeight: true,
                            grabbingEnabled: false,
                            oldStyle: {},
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Entanglement Inspector's Attributes:",
                            onMouseDown: function onMouseDown(evt) {
                                    if (evt.isLeftMouseButtonDown() && this.owner.owner.item.onSelect) {
                                        this.owner.owner.getRootTree().select(this.owner.owner);
                                    }
                                }
                        }]
                    }],
                    target: "[object Object]"
                }],
                tree: {
                    isMorphRef: true,
                    name: "attribute-tree-view"
                }
            },{
                _BorderColor: Color.rgb(230,230,230),
                _BorderStyle: "dashed",
                _BorderWidth: 4.256,
                _ClipMode: {
                    x: "hidden",
                    y: "scroll"
                },
                _Extent: lively.pt(153.0,168.1),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(572.0,10.0),
                allowDeselectClick: false,
                className: "lively.morphic.List",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: true,
                isCopyMorphRef: true,
                isMultipleSelectionList: false,
                itemMorphs: [],
                layout: {
                    adjustForNewBounds: true,
                    extent: lively.pt(153.0,168.1),
                    listItemHeight: 19,
                    maxExtent: lively.pt(153.0,168.1),
                    maxListItems: 9,
                    noOfCandidatesShown: 1,
                    padding: 0,
                    resizeHeight: true,
                    resizeWidth: false,
                    scaleHorizontal: false,
                    scaleVertical: false
                },
                morphRefId: 3,
                multipleSelectionMode: "none",
                name: "EntangledMorphsList",
                noSingleSelectionIfMultipleSelected: false,
                plug: {
                    menuItems: "output",
                    selection: "output",
                    setList: "input"
                },
                sourceModule: "lively.morphic.Lists",
                submorphs: [{
                    _BorderColor: null,
                    _Extent: lively.pt(153.0,4.0),
                    className: "lively.morphic.Box",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
                    halosEnabled: false,
                    layout: {
                        adjustForNewBounds: true,
                        resizeWidth: true
                    },
                    sourceModule: "lively.morphic.Core",
                    submorphs: []
                }]
            }]
        },{
            _BorderStyle: "hidden",
            _BorderWidth: 1,
            _Extent: lively.pt(735.0,188.1),
            _Fill: Color.rgba(0,0,204,0),
            _Position: lively.pt(10.0,277.9),
            className: "lively.morphic.Box",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            layout: {
                adjustForNewBounds: true,
                resizeHeight: true,
                resizeWidth: true
            },
            name: "lower-panel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(153,153,153),
                _BorderStyle: "double",
                _ClipMode: "scroll",
                _Extent: lively.pt(710.0,199.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(11.0,7.5),
                className: "lively.morphic.Box",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    resizeHeight: true,
                    resizeWidth: true
                },
                name: "EntanglementMethodVisualizer",
                sourceModule: "lively.morphic.Core",
                submorphs: [{
                    _Extent: lively.pt(710.0,20.0),
                    _Fill: Color.rgb(255,255,255),
                    _Visible: true,
                    className: "lively.morphic.Tree",
                    depth: 0,
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    draggingEnabled: false,
                    droppingEnabled: false,
                    grabbingEnabled: false,
                    isInLayoutCycle: false,
                    name: "method-tree-view",
                    searchActive: false,
                    searchBar: null,
                    showMoreNode: null,
                    sourceModule: "lively.morphic.Widgets",
                    submorphs: [{
                        _BorderColor: null,
                        _Extent: lively.pt(710.0,20.0),
                        className: "lively.morphic.Box",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
                        droppingEnabled: true,
                        eventsAreIgnored: true,
                        layout: {
                            borderSize: 0,
                            resizeWidth: true,
                            spacing: 5,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _Align: "right",
                            _Extent: lively.pt(10.0,20.0),
                            _FontFamily: "Helvetica",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _Padding: lively.rect(4,2,0,0),
                            _TextColor: Color.rgb(64,64,64),
                            allowInput: false,
                            className: "lively.morphic.Text",
                            doNotCopyProperties: [],
                            doNotSerialize: [],
                            draggingEnabled: false,
                            droppingEnabled: false,
                            emphasis: [[0,1,{}]],
                            evalEnabled: false,
                            fixedHeight: true,
                            fixedWidth: true,
                            grabbingEnabled: false,
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "►",
                            onMouseDown: function onMouseDown(evt) {
                                    if (this.owner.owner.item.children && evt.isLeftMouseButtonDown()) {
                                        this.owner.owner.toggle();
                                    }
                                }
                        },{
                            _Extent: lively.pt(213.0,20.0),
                            _FontFamily: "Helvetica",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(15.0,0.0),
                            _TextColor: Color.rgb(64,64,64),
                            _WhiteSpaceHandling: "pre",
                            allowInput: false,
                            className: "lively.morphic.Text",
                            doNotCopyProperties: [],
                            doNotSerialize: [],
                            draggingEnabled: false,
                            droppingEnabled: false,
                            emphasis: [[0,33,{}]],
                            evalEnabled: false,
                            fixedHeight: true,
                            grabbingEnabled: false,
                            oldStyle: {},
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Entanglement Inspector's Methods:",
                            onMouseDown: function onMouseDown(evt) {
                                    if (evt.isLeftMouseButtonDown() && this.owner.owner.item.onSelect) {
                                        this.owner.owner.getRootTree().select(this.owner.owner);
                                    }
                                }
                        }]
                    }],
                    target: "[object Object]"
                }],
                tree: {
                    isMorphRef: true,
                    name: "method-tree-view"
                }
            }]
        },{
            _BorderStyle: "hidden",
            _Extent: lively.pt(735.0,40.0),
            _Fill: Color.rgba(0,0,204,0),
            _Opacity: 0.9777,
            _Position: lively.pt(10.0,481.0),
            className: "lively.morphic.Box",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            layout: {
                adjustForNewBounds: true,
                borderSize: 10,
                resizeWidth: true,
                spacing: 15,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "button-panel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(100.0,20.0),
                _Position: lively.pt(10.0,10.0),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                label: "New Morph!",
                layout: {
                    moveHorizontal: true
                },
                name: "CreationButton",
                pinSpecs: [{
                    accessor: "fire",
                    location: 1.5,
                    modality: "output",
                    pinName: "fire",
                    type: "Boolean"
                }],
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "doAction", {});
                lively.bindings.connect(this, "fire", this.get("Entanglement Inspector"), "createEntangledObj", {});
            },
                doAction: function doAction() {
                                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                        }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(100.0,20.0),
                _Position: lively.pt(125.0,10.0),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                label: "Search Attributes",
                layout: {
                    moveHorizontal: true
                },
                name: "CreationButton1",
                pinSpecs: [{
                    accessor: "fire",
                    location: 1.5,
                    modality: "output",
                    pinName: "fire",
                    type: "Boolean"
                }],
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "doAction", {});
            },
                doAction: function doAction() {
                                                                                                                                                                                                        this.get('Entanglement Inspector').toggleSearch('attribute-tree-view');
                                                                                                                                                                                                    }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(100.0,20.0),
                _Position: lively.pt(240.0,10.0),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                label: "Search Methods",
                layout: {
                    moveHorizontal: true
                },
                name: "CreationButton2",
                pinSpecs: [{
                    accessor: "fire",
                    location: 1.5,
                    modality: "output",
                    pinName: "fire",
                    type: "Boolean"
                }],
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "doAction", {});
            },
                doAction: function doAction() {
                                                                                                                                                                                                        this.get('Entanglement Inspector').toggleSearch('method-tree-view');
                                                                                                                                                                                                    }
            }]
        }],
        aboutMe: function aboutMe() {
                                                                                                                        //  This is an experiment in drag-and-drop construction of
                                                                                                                        //  paned window apps. 
                                                                                                                        // 
                                                                                                                        //  The idea is that each widget will have a "plug" reminiscent
                                                                                                                        //  of Squeak's pluggable views.  From the plug, this panel
                                                                                                                        //  will strive to create all the necessary connections and 
                                                                                                                        //  stubbed methods appropriate to operation of that widget.
                                                                                                                        //  Gridding assistance and other style defauts will facilitate
                                                                                                                        //  rapid construction of pleasing practical apps.
                                                                                                                        //
                                                                                                                        //  Renaming of the widgets will be supported, but this clearly
                                                                                                                        //  becomes more difficult as construction progresses, since the 
                                                                                                                        //  stubbed methods, etc will be synchronized with the widget names.
                                                                                                                        // 
                                                                                                                        //  A further aspiration of this experiment is to automatically
                                                                                                                        //  generate a buildView method correponding to the concretely
                                                                                                                        //  constructed app.
                                                                                                                    },
        addMorph: function addMorph(widget) {
                                                                                                                        // Override addMorph to provide gridding and docking of plugs
                                                                                                                        $super(widget);  // momentarily install to get local bounds
                                                                                                                        var bnds = widget.getBounds();
                                                                                                                        var name = widget.getName();
                                                                                                                        if (!name) return widget;
                                                                                                                        
                                                                                                                        if (widget.isList) {
                                                                                                                            widget.remove();  // replace by our special version
                                                                                                                            var m = this.newListPane(bnds); }
                                                                                                                        else if (widget.isText) {
                                                                                                                            widget.remove();  // replace by our special version
                                                                                                                            var m = this.newCodePane(bnds); }
                                                                                                                        else return widget;
                                                                                                                        
                                                                                                                        m.setName(name);
                                                                                                                        $super(m);
                                                                                                                        this.plugIn(m);
                                                                                                                        return m;
                                                                                                                    },
        buildView: function buildView(extent) {  // this.buildView()
                                                                                                                        // Disassemble prior view if present and set extent if not null
                                                                                                                        this.restart(extent);
                                                                                                                    
                                                                                                                        // Lay out new widgets
                                                                                                                        lively.morphic.Panel.makePanedPanel(extent, [
                                                                                                                    		['classPane', this.newListPane, new Rectangle(0, 0, 0.5, 0.6)],
                                                                                                                    		['methodPane', this.newListPane, new Rectangle(0.5, 0, 0.5, 0.6)],
                                                                                                                    		['codePane', this.newCodePane, new Rectangle(0, 0.6, 1, 0.4)],
                                                                                                                    	], this);
                                                                                                                    
                                                                                                                        // Connect widgets to this panel as model
                                                                                                                        connect(this.classPane, "selection", this, "setSelectedClass", {});
                                                                                                                        connect(this.methodPane, "selection", this, "setMethodName", {});
                                                                                                                    
                                                                                                                        // Initialize this panel as model
                                                                                                                        this.onLoad();
                                                                                                                    },
        methodStubFor: function methodStubFor(widget, propName) {
                                                                                                                        // returns {methodName: 'nnn', methodString: 'sss'}
                                                                                                                        var mode = widget.plug[propName];
                                                                                                                        var widgetName = this.uncapitalize(widget.getName());
                                                                                                                        var methodName = widgetName + propName.capitalize();
                                                                                                                        var methodString = 'function ' + methodName + '(' + propName + ') {\n'
                                                                                                                        if (mode == 'input') methodString +=
                                                                                                                            '\tthis.' + widgetName + '.' + propName + '(' + propName + ');\n';
                                                                                                                        methodString += '}';
                                                                                                                        return {widgetName: widgetName, methodName: methodName, methodString: methodString};
                                                                                                                    },
        newCodePane: function newCodePane(bnds, morphorNull) {
                                                                                                                        // This method should be inherited for all apps
                                                                                                                        var codePane = morphorNull || newTextPane(bnds);
                                                                                                                        codePane.enableSyntaxHighlighting();
                                                                                                                        codePane.evalEnabled = true;
                                                                                                                        codePane.doSave = function() {
                                                                                                                            this.cachedTextString = null;
                                                                                                                            this.savedTextString = this.textString;
                                                                                                                            if (this.methodPane.selection) {
                                                                                                                                alertOK('eval'); 
                                                                                                                                this.tryBoundEval('this.' + panel.methodPane.selection + ' = ' + this.savedTextString)
                                                                                                                            }
                                                                                                                        }
                                                                                                                        codePane.applyStyle({scaleProportional: true});
                                                                                                                        codePane.plug = {setTextString: 'input', getTextString: 'output', menuItems: 'output'}
                                                                                                                        this.wrapWidget(codePane);  // Override remove to clean up stubs
                                                                                                                        return codePane
                                                                                                                    },
        newListPane: function newListPane(bnds, morphorNull) {
                                                                                                                        // This method should be inherited for all apps
                                                                                                                        var list = morphorNull || new lively.morphic.List(bnds);
                                                                                                                        list.applyStyle({scaleProportional: true});
                                                                                                                        list.plug = {setList: 'input', selection: 'output', menuItems: 'output'}
                                                                                                                        this.wrapWidget(list);  // Override remove to clean up stubs
                                                                                                                        return list;
                                                                                                                    },
        onLoad: function onLoad() {  // this.onLoad()
                                                                                                                        // Call a method here to initialize state upon loading
                                                                                                                    },
        plugIn: function plugIn(widget) {
                                                                                                                        // set up connect and stub methods based on widget.plug
                                                                                                                        if (!widget.plug) return;
                                                                                                                        var plug = widget.plug;
                                                                                                                        ownPropertyNames(plug).forEach(function (prop) {
                                                                                                                            var stub = this.methodStubFor(widget, prop);
                                                                                                                            //  Add method stub
                                                                                                                            var script = this.addScript(eval('(' + stub.methodString + ')'));
                                                                                                                            script.setProperty("tags", ["app methods"]);
                                                                                                                            //  Add connection for outputs
                                                                                                                            if (plug[prop] == 'output')
                                                                                                                                connect(widget, prop, this, stub.methodName)
                                                                                                                            //  Add own variable for each widget
                                                                                                                            this[stub.widgetName] = widget;
                                                                                                                            }, this)
                                                                                                                    },
        renamePart: function renamePart(part, oldName, newName) {
                                                                                                                        // setName must be wrapped to call this
                                                                                                                        console.log('Renaming ' + oldName + ' to ' + newName)
                                                                                                                        // We will simply remove all old stubs (safely) and then install again
                                                                                                                    },
        reset: function reset() {  // this.reset()
                                                                                                                        //  Call a method to clear state for saving in parts bin
                                                                                                                    },
        restart: function restart(extent) {  // this.restart()
                                                                                                                        // Use new frame if supplied
                                                                                                                        extent = extent || this.getExtent();
                                                                                                                        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
                                                                                                                        this.layout.grid = this.innerBounds().extent().scaleBy(1/20);
                                                                                                                    
                                                                                                                        // Disassemble prior view and connections
                                                                                                                        this.removeAllMorphs();  // this should handle disconnect and unplug
                                                                                                                    },
        setExtent: function setExtent(newExt) {
                                                                                                                        var result = $super(newExt);
                                                                                                                        this.layout.grid = this.innerBounds().extent().scaleBy(1/20);
                                                                                                                        return result;
                                                                                                                    },
        unPlug: function unPlug(widget) {
                                                                                                                        // remove stub methods based on widget.plug
                                                                                                                        if (!widget.plug) return;
                                                                                                                        var plug = widget.plug;
                                                                                                                        ownPropertyNames(plug).forEach(function (prop) {
                                                                                                                            var stub = this.methodStubFor(widget, prop);
                                                                                                                            // remove method stubs that have not been edited
                                                                                                                            if (this[stub.methodName]
                                                                                                                                && this[stub.methodName].toString() == stub.methodString)
                                                                                                                                delete this[stub.methodName];
                                                                                                                            // remove connection for outputs
                                                                                                                            if (plug[prop] == 'output')
                                                                                                                                disconnect(widget, prop, this, stub.methodName)
                                                                                                                            // remove own variable for widget
                                                                                                                            if (this[stub.widgetName]) console.log('deleting ' + stub.widgetName);
                                                                                                                            if (this[stub.widgetName]) delete this[stub.widgetName];
                                                                                                                            }, this)
                                                                                                                    },
        uncapitalize: function uncapitalize(name) {
                                                                                                                        // By symmetry with <string>.capitalize()
                                                                                                                        return name.charAt(0).toLowerCase() + name.slice(1);
                                                                                                                    },
        wrapWidget: function wrapWidget(widget) {
                                                                                                                        // Clean up stubs when a widget is removed or renamed
                                                                                                                        var self = this;
                                                                                                                        widget.remove = widget.remove.wrap(
                                                                                                                            function(wrapped) {
                                                                                                                                var args = $A(arguments); args.shift();
                                                                                                                                if (this.owner !== self)
                                                                                                                                    return wrapped.apply(this, args);
                                                                                                                                self.unPlug(this);
                                                                                                                                this.remove = wrapped;  // restore remove
                                                                                                                                return wrapped.apply(this, args);
                                                                                                                            });
                                                                                                                        widget.setName = widget.setName.wrap(
                                                                                                                            function(wrapped) {
                                                                                                                                var args = $A(arguments); args.shift();
                                                                                                                                if (this.owner !== self || !this.getName())
                                                                                                                                    return wrapped.apply(this, args);
                                                                                                                                self.unPlug(this);
                                                                                                                                var result = wrapped.apply(this, args);
                                                                                                                                self.plugIn(this);
                                                                                                                                return result;
                                                                                                                            });
                                                                                                                    },
        yetToDo: function yetToDo() {
                                                                                                                    //  [X] Write code to intercept addMorph()
                                                                                                                    //  [X]     gridding
                                                                                                                    //  [X]     other defaults such as layout, borders, etc
                                                                                                                    //  [X]     define plugs for, eg, list and text
                                                                                                                    //  [X]     add stub methods for plugs
                                                                                                                    //  [X]     add connections for outputs
                                                                                                                    //  [X] Remove stubs when remove parts
                                                                                                                    //  [X] Make safeRemove that checks for unchanged stubs
                                                                                                                    //  [X] Remove connections when remove parts
                                                                                                                    //  [X] Support renaming of parts by safeRemove, followed by add
                                                                                                                    //  [X] Add and remove own variable refs
                                                                                                                    //  [X] Test by building a browser
                                                                                                                    //  [ ] Write code that will generate buildView method
                                                                                                                    }
    }],
    titleBar: "Entanglement Inspector",
    tree: {
        isMorphRef: true,
        name: "attribute-tree-view"
    },
    withoutLayers: "[GrabbingLayer]",
    addMethodToTree: function addMethodToTree(treeItem, entanglement, name, method, itemAfter) {
        var self = this;
        var source = method.toString();
        var loc = source.split(/\r\n|\r|\n/).length;
        var editor = new lively.ide.newCodeEditor(pt(0).extent(pt(400,loc * 19)), source );
        editor.savedTextString = source;
        editor.isScrollable = function() {  return false }
        editor.setBorderWidth(3);
        editor.initializeAce();
        editor.setTheme("tomorrow");
        editor.aceEditor.setOptions({
            maxLines: Infinity
        });
        
        var removeButton = this.getDeleteButtonSpec().createMorph();
        var item = {name: '↠', submorphs: [removeButton, editor]};

        removeButton.addScript(remove, 'onClick', {editor: editor,
                                                    entanglement: entanglement,
                                                    treeItem: treeItem,
                                                    self: self
                                                    });
        removeButton.setExtent(pt(22,22));
        
        editor.enableGutter();
        editor.aceEditor.getSession().toggleFoldWidget();
        editor.aceEditor.getSession().on('changeFold', onFold);
        editor.addScript(doSave, 'doSave', {editor: editor, 
                                            self: self,
                                            item: item,
                                            oldMethod: method, 
                                            entanglement: entanglement,
                                            treeItem: treeItem});
        
        
        function onFold(fold) {
            var expanding = fold.action == 'remove';
            var height = expanding ? (fold.data.end.row - fold.data.start.row) * 19 + 10: 22;
            var width = fold.data.start.column * 15;
            editor.setExtent(pt(width, height));
            editor.owner.setExtent(pt(width, height));
            editor.owner.applyLayout()
        }
        
        function doSave() {
            $super();
            var f = Function.fromString(editor.savedTextString);
            if(!entanglement.get(f.name)) {
                // this function is a new addition, so we have to update the visualization
                // by adding a new entry that shows the old method
                self.addMethodToTree(treeItem, entanglement, oldMethod.name, oldMethod, item);
                var methodNode =  self.methodTree.withAllTreesDetect(function(t) {
                   return t.item === treeItem;
                });
                if(methodNode){
                    methodNode.updateChildren();
                    methodNode.collapse();
                    methodNode.expand();
                }
            }
            entanglement.addMethod(f.name, f);
            editor.withCSSTransitionDo(function() { 
                this.setBorderColor(Color.green) }, 100, 
                function() { 
                    editor.withCSSTransitionDo(function() { 
                        this.setBorderColor(Color.white) }, 500);
                    });
        }
        
        function remove() {
            var name = Function.fromString(editor.savedTextString).name;
            var item = treeItem.children.find(function(i) { 
                return i.submorphs.include(editor) 
            });
            entanglement.deleteMethod(name);
            treeItem.children.remove(item);
            var methodNode =  self.methodTree.withAllTreesDetect(function(t) {
                   return t.item === treeItem;
                });
            if(methodNode){
                methodNode.updateChildren();
                methodNode.collapse();
                methodNode.expand();
            }
        }
    
        if(itemAfter) {
            var i = treeItem.children.indexOf(itemAfter);
            treeItem.children.splice(i, 0, item); 
        } else {
            treeItem.children.push(item)
        }
    },
    createEntangledObj: function createEntangledObj() {
    // Something to think about: How to supply the user with an interface for
    // excluding specific interfaces?
    var m = this.entanglement.createEntangledMorph({excludes: this.getCurrentExclusions()});
    m.setPosition(pt(0));
    m.openInHand();
},
    createExcludeMarkFor: function createExcludeMarkFor(item) {
    var checkBox = new lively.morphic.CheckBox(true);
    checkBox.setExtent(pt(22,22))
    item.checkBox = checkBox;
    if(item.submorphs) 
        item.submorphs.push(checkBox);
    else
        item.submorphs = [checkBox];
},
    createMethodTree: function createMethodTree(entanglement, name) {
    var self = this;
    var methodTree = {name: name || entanglement.get('name') || 'Entanglement', 
                     style: {}, 
                     children: []};
                     
    // first entry is the node ot create a new function
    
    for ( var m in entanglement.entangledAttributes ) {
        var method = entanglement.entangledAttributes[m];
        if(Object.isFunction(method)){
            this.addMethodToTree(methodTree, entanglement, m, method);
        }
    }
    
    var subEntanglements = {name: 'Subentanglements', children: []};
    
    entanglement.subEntanglements.forEach(function(e) {
        methodTree.children.push(this.createMethodTree(e));   
    }, this);

    return methodTree;
},
    getCurrentExclusions: function getCurrentExclusions(marshalledEntanglement) {
     var ex = [];
     if(!marshalledEntanglement) {
         ex = ['setPosition'];
        marshalledEntanglement = this.marshalledEntanglement;
     }
     marshalledEntanglement.children.forEach(function(item){
         if(item.children) {
            var subEx = {};
            subEx[item.name] = this.getCurrentExclusions(item);
            subEx[item.name] && ex.push(subEx);
        } else {
            !item.checkBox.isChecked() && ex.push(item.name);
         }
     }, this);
     return ex.length ? ex : undefined;
},
    getDeleteButtonSpec: function getDeleteButtonSpec() {
    return lively.BuildSpec({
    _BorderColor: null,
    _Extent: lively.pt(34.0,34.0),
    _Position: lively.pt(424.5,446.5),
    className: "lively.morphic.Image",
    doNotCopyProperties: [],
    doNotSerialize: [],
    droppingEnabled: true,
    name: "delete.png",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [],
    url: "data:image/png;base64,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/GMzLdsAAEHZaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjUtYzAxNCA3OS4xNTE0ODEsIDIwMTMvMDMvMTMtMTI6MDk6MTUgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICAgICAgICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgICAgICAgICB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIgogICAgICAgICAgICB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCk8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHhtcDpDcmVhdGVEYXRlPjIwMTAtMTAtMjJUMTk6NTE6NTAtMDQ6MDA8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1ldGFkYXRhRGF0ZT4yMDE0LTA3LTE0VDExOjIxOjQ1LTA3OjAwPC94bXA6TWV0YWRhdGFEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxNC0wNy0xNFQxMToyMTo0NS0wNzowMDwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICAgIDxwaG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+CiAgICAgICAgICAgIDxyZGY6QmFnPgogICAgICAgICAgICAgICA8cmRmOmxpPnhtcC5kaWQ6MDk4MDExNzQwNzIwNjgxMTgxRTNFODdDOTZFM0Q3MDQ8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6QmFnPgogICAgICAgICA8L3Bob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4KICAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9wbmc8L2RjOmZvcm1hdD4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDo0ODJiMDViOC1jMmUxLTQ0MjktOTEwMS00N2Q2NGZhN2VhMTE8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPnhtcC5kaWQ6RUVCRjY4RDI5QzIzNjgxMUE2RERCMDk1QjAxRTBCMzk8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDpFRUJGNjhEMjlDMjM2ODExQTZEREIwOTVCMDFFMEIzOTwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDpFRUJGNjhEMjlDMjM2ODExQTZEREIwOTVCMDFFMEIzOTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxMC0xMC0yMlQxOTo1MTo1MC0wNDowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2g8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOkVEOTFENzM3MjcyMDY4MTE4RjYyOUFGRjU2Q0QwNzgxPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDEwLTEwLTIzVDAyOjA1OjM1KzAyOjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaDwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6MDJlMDljMmMtOGI5My00MjMwLTk0NzMtYTNhZWY5YTgwOTFmPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE0LTA3LTE0VDExOjIxOjQ1LTA3OjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jb252ZXJ0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+ZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZzwvc3RFdnQ6cGFyYW1ldGVycz4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmRlcml2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnBhcmFtZXRlcnM+Y29udmVydGVkIGZyb20gYXBwbGljYXRpb24vdm5kLmFkb2JlLnBob3Rvc2hvcCB0byBpbWFnZS9wbmc8L3N0RXZ0OnBhcmFtZXRlcnM+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjQ4MmIwNWI4LWMyZTEtNDQyOS05MTAxLTQ3ZDY0ZmE3ZWExMTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNC0wNy0xNFQxMToyMTo0NS0wNzowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtcC5paWQ6MDJlMDljMmMtOGI5My00MjMwLTk0NzMtYTNhZWY5YTgwOTFmPC9zdFJlZjppbnN0YW5jZUlEPgogICAgICAgICAgICA8c3RSZWY6ZG9jdW1lbnRJRD54bXAuZGlkOkVFQkY2OEQyOUMyMzY4MTFBNkREQjA5NUIwMUUwQjM5PC9zdFJlZjpkb2N1bWVudElEPgogICAgICAgICAgICA8c3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6RUVCRjY4RDI5QzIzNjgxMUE2RERCMDk1QjAxRTBCMzk8L3N0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPC94bXBNTTpEZXJpdmVkRnJvbT4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzIwMDkwLzEwMDAwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjAwOTAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+Mzc8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+Mzc8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/Pqf6NR8AAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAB15JREFUeNrMmF1sVMcVx/9z537trr0f/sBfONhdYxLHUEKoqU1AkZK2EqhSXyI1CVGl9qGoASvBIVYSh7RVEFIlS1GlCFU8NG2gVOpD1TxUTWxaFBIMOGklStt4Marx7hK78We9e/d+zUwfcndZr+8aG/rAlY5kaTwzv3Pmf2bPHCKEwP32SbgPv/sSSs7/QQhZ6xziOUOLrNg5DoAVGQewJo3kpSSvM6oUgPpsa2vTI7HY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"
})
},
    marshallEntanglement: function marshallEntanglement(entanglement, name) {
    var treeItems = {name: name || entanglement.get('name') || 'Entanglement', 
                     style: {}, 
                     children: [],
                     mapsTo: function(obj) { return entanglement == obj }};

    // the tree should be structured as follows:
    // 1. primitive properties
    // 2. directly referenced subEntnaglements -> 
    // 3. in a visually differentiated entry we store all the subEntanglements
    //    that are not referenced directly
    
    // we first include the special Subentanglements attribute that we add just pro forma:
    
    var subEntanglementsItem =  {name: 'Subentanglements', 
                                 style: '', 
                                 children: [], 
                                 description: '', 
                                 mapsTo: function() { return false }};
    var alreadyTraversed = [];
    
    function addTreeItemFor(attr) {
        var value = entanglement.get(attr);
        if(Object.isFunction(value) 
            || attr.startsWith('$$')
            || $.inArray(attr, ['submorphs','attributeConnections', 'doNotSerialize', 'doNotCopyProperties']) > -1)
            return;
        if(!value || !value.isEntanglement) {
            // if this is just a primitive object, we add it to the current entanglement
            var item = {name: attr, 
                        value: value,
                        submorphs: [],
                        description: value && value.toString(),
                        mapsTo: function(obj) { return item == obj; }}
            // as this is a primitive object, we connect it and the variable inside the entanglement,
            // to monitor all changes that happen and update this on the fly inside the view
            connect(entanglement.entangledAttributes, attr, this , 'updateLabel', 
                    {updater: function($proceed, newValue, oldValue) {
                        $proceed(item, newValue);
                    }, varMapping: {item: item}
                });
            if(value && value.isColor) {
                var pickerButton = new lively.morphic.AwesomeColorField()
                pickerButton.setColor(value);
                connect(pickerButton, 'color', entanglement, 'set', 
                        {updater: function($proceed, newValue, oldValue) {
                            $proceed(attr, newValue);
                            }, varMapping: {attr: attr}});
                item.submorphs.push(pickerButton);
            } else {
                item.isEditable = true;
                item.onEdit = function(newValue) {
                    entanglement.set(attr, eval(newValue));
                }
            }
            this.createExcludeMarkFor(item);
            treeItems.children.push(item);
        } else {
            // in the other case, we traverse it further
            alreadyTraversed.push(value);
            treeItems.children.push(this.marshallEntanglement(value, attr));
        }
    }
    
    for ( var attr in entanglement.entangledAttributes ) {
        addTreeItemFor.call(this, attr);
    }
    
    entanglement.subEntanglements.withoutAll(alreadyTraversed).forEach(function(subEnt) {
       subEntanglementsItem.children.push(this.marshallEntanglement(subEnt)); 
    }, this);
    
    if(entanglement.get('submorphs')) {
    connect(entanglement.get('submorphs'), 'push', 
            this, 'subEntanglementsChanged',
            {updater: function($proceed) { return $proceed(e) }, varMapping: {e: entanglement}});
    connect(entanglement.get('submorphs'), 'remove', 
            this, 'subEntanglementsChanged',
            {updater: function($proceed) { return $proceed(e) }, varMapping: {e: entanglement}});
    }

    if(subEntanglementsItem.children.length > 0)
        treeItems.children.push(subEntanglementsItem);
    
    return treeItems;
},
    openBuildSpecFile: function openBuildSpecFile() {
    var specUrl = this.get('spec-url-field').getTextString();
    var spec = lively.BuildSpec(specUrl);
    if(spec)
        this.visualize(spec.createEntanglement())
    else
        alert('Spec "' + specUrl + '" could not be found!')
},
    subEntanglementsChanged: function subEntanglementsChanged(entanglement) {
    var newSubEntItem = this.marshallEntanglement(entanglement);
    this.tree.withAllItemsDo(
        function(item) { if(item.mapsTo(entanglement)) {
            item.children = newSubEntItem.children;
        }
    }, this);
    // in case the node visualizing the affected item is visible,
    // we tell it to update
    this.tree.withAllTreesDo(function(t) {
      if(t.item.mapsTo(entanglement) && t.childNodes) 
      {   
          t.updateChildren();
          t.childNodes.last().expand(); 
        }
    });
},
    toggleSearch: function toggleSearch(treeName) {
    if(this.get(treeName).searchActive) {
        this.get(treeName).exitSearch();
        this.get(treeName).searchActive = false;
    } else {
        if(treeName == 'attribute-tree-view')
            this.get(treeName).createSearchBar(this.marshalledEntanglement, 'Searching...');
        else
            this.get(treeName).createSearchBar(this.marshalledMethods, 'Searching...');
        this.get(treeName).searchActive = true;
    }
},
    updateLabel: function updateLabel(item, value) {
        // the tree generates and removes nodes dynamically with respect
        // to the user interaction. We therfore need to fetch the corresponding node
        // manually for this item every time something changes:
        var node = this.tree.withAllTreesDetect(function(t) { return t.item.mapsTo(item) });
        // the user might not have expanded the tree such that the item is visible
        // in that case we do not have to update the entry, obviously
        if(node) {
            node.item.description = value && value.toString();
            node.updateLabel(item);
        }
},
    visualize: function visualize(entanglement) {
    this.marshalledEntanglement = this.marshallEntanglement(entanglement, entanglement.get('name') + "'s Attributes:");
    this.entanglement = entanglement;
    this.tree.setItem(this.marshalledEntanglement);
    this.marshalledMethods = this.createMethodTree(entanglement, entanglement.get('name') + "'s Methods:")
    this.methodTree.setItem(this.marshalledMethods);
    this.ListListener && this.listListener.disconnect();
    this.morphList.getList().forEach(
        function(i) { this.morphList.removeItemOrValue(i); }, 
        this);
    entanglement.entangledMorphs.forEach(
        function(morph) { this.morphList.addItem(morph) }, this );
        
    // also setup a connection with the list of entangled morphs,
    // so that we always find out about new morphs that are added
    this.listListener = connect(this.entanglement, 'createEntangledMorph', this.morphList, 'addItem', {updater: function($proceed, newV, oldV) { $proceed(newV); return newV; }});
    connect(this.entanglement.entangledMorphs, 'remove', this.morphList, 'removeItem');
}
})

})
