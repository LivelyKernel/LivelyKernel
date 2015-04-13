module('lively.morphic.tools.PartsBin').requires('lively.persistence.BuildSpec', 'lively.PartsBin').toRun(function() {

lively.BuildSpec('lively.morphic.tools.PartsBin', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(838.0,520.2),
    _Position: lively.pt(251.0,241.4),
    _StyleClassNames: ["Morph","Window"],
    cameForward: false,
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    highlighted: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "PartsBinBrowser",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(830.2,494.2),
        _Fill: Color.rgba(245,245,245,0),
        _Position: lively.pt(4.0,22.0),
        _StyleClassNames: ["Morph","Box"],
        _StyleSheet: ".MorphList {\n\
    	overflow-y: scroll;\n\
    	overflow-x: hidden;\n\
    }\n\
    \n\
    .MorphList .selected {\n\
    	outline: 0px;\n\
    	background-color: rgb(42, 87, 192) !important;\n\
    }\n\
    \n\
    .MorphList .selected span {\n\
    	color: white !important;\n\
    }",
        allItemURLS: [],
        allURLs: [],
        borderWidth: 1,
        className: "lively.morphic.Box",
        connections: {
            toggleMorePane: {}
        },
        doNotSerialize: ["categories"],
        isCopyMorphRef: true,
        layout: {
            adjustForNewBounds: true,
            borderSize: 6.615,
            resizeHeight: true,
            resizeWidth: true,
            spacing: 3,
            type: "lively.morphic.Layout.HorizontalLayout"
        },
        minExtent: lively.pt(474.0,244.2),
        moreToggled: false,
        morphRefId: 1,
        name: "PartsBinBrowser",
        selectedPartItem: null,
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderWidth: 0.74,
            _Extent: lively.pt(151.3,481.0),
            _Fill: Color.rgba(255,255,255,0),
            _Position: lively.pt(6.6,6.6),
            className: "lively.morphic.Box",
            droppingEnabled: false,
            isCopyMorphRef: true,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(200.3,748.0),
                resizeHeight: true,
                resizeWidth: false,
                spacing: 9.26,
                type: "lively.morphic.Layout.VerticalLayout"
            },
            morphRefId: 1,
            name: "LeftSideContainer",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _Extent: lively.pt(151.3,27.0),
                _Fill: Color.rgba(0,0,204,0),
                className: "lively.morphic.Box",
                droppingEnabled: false,
                layout: {
                    adjustForNewBounds: true,
                    centeredHorizontal: false,
                    centeredVertical: false,
                    layouter: undefined,
                    resizeWidth: true
                },
                name: "CategoryChooserContainer",
                sourceModule: "lively.morphic.Core",
                submorphs: [{
                    _ClipMode: "auto",
                    _Extent: lively.pt(151.3,17.0),
                    _Fill: Color.rgba(243,243,243,0),
                    _FontFamily: "Helvetica",
                    _FontSize: 10,
                    _Position: lively.pt(0.5,5.0),
                    _StyleClassNames: ["Morph","Box","OldList","DropDownList"],
                    changeTriggered: false,
                    className: "lively.morphic.DropDownList",
                    droppingEnabled: false,
                    layout: {
                        centeredHorizontal: true,
                        centeredVertical: true,
                        moveHorizontal: false,
                        resizeWidth: true
                    },
                    name: "PartsBinURLChooser",
                    selectOnMove: false,
                    selectedLineNo: -1,
                    sourceModule: "lively.morphic.Lists",
                    submorphs: [],
                    withoutLayers: [],
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "selection", this.get("PartsBinBrowser"), "setPartsBinURL", {});
                },
                    reset: function reset() {
                                        this.name = "PartsBinURLChooser";
                                    }
                }]
            },{
                _BorderWidth: 0.14800000000000002,
                _Extent: lively.pt(151.3,444.7),
                _Fill: Color.rgba(255,255,255,0),
                _Position: lively.pt(0.0,36.3),
                className: "lively.morphic.Box",
                droppingEnabled: false,
                layout: {
                    borderSize: 0,
                    resizeHeight: true,
                    resizeWidth: true,
                    spacing: 0,
                    type: "lively.morphic.Layout.VerticalLayout"
                },
                name: "CategoryListContainer",
                sourceModule: "lively.morphic.Core",
                submorphs: [{
                    _BorderColor: Color.rgb(210,210,210),
                    _Extent: lively.pt(151.3,27.0),
                    _Fill: Color.rgba(255,255,255,0),
                    className: "lively.morphic.Morph",
                    droppingEnabled: true,
                    layout: {
                        adjustForNewBounds: true,
                        resizeWidth: true
                    },
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _BorderColor: Color.rgb(210,210,210),
                        _Extent: lively.pt(28.0,28.0),
                        _Fill: Color.rgb(204,204,204),
                        _Position: lively.pt(123.3,0.0),
                        _StyleClassNames: ["Morph","Button"],
                        className: "lively.morphic.Button",
                        isPressed: false,
                        label: "-",
                        layout: {
                            moveHorizontal: true
                        },
                        name: "removeCategoryButton",
                        sourceModule: "lively.morphic.Widgets",
                        style: {
                            borderRadius: 0,
                            padding: lively.rect(4,3,0,0)
                        },
                        toggle: false,
                        value: false,
                        withoutLayers: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "fire", this, "onFire", {});
                    },
                        onFire: function onFire() {
                                                this.get('PartsBinBrowser').removeCategoryInteractively();
                                            }
                    },{
                        _BorderColor: Color.rgb(210,210,210),
                        _Extent: lively.pt(28.0,28.0),
                        _Fill: Color.rgb(204,204,204),
                        _Position: lively.pt(91.3,0.0),
                        _StyleClassNames: ["Morph","Button"],
                        className: "lively.morphic.Button",
                        isPressed: false,
                        label: "+",
                        layout: {
                            moveHorizontal: true
                        },
                        name: "addCategoryButton",
                        sourceModule: "lively.morphic.Widgets",
                        style: {
                            borderRadius: 0,
                            padding: lively.rect(4,3,0,0)
                        },
                        toggle: false,
                        value: false,
                        withoutLayers: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "fire", this, "onFire", {});
                    },
                        onFire: function onFire() {
                                                this.get('PartsBinBrowser').addCategoryInteractively()
                                            }
                    },{
                        _BorderColor: Color.rgb(210,210,210),
                        _Extent: lively.pt(28.0,28.0),
                        _Fill: Color.rgb(204,204,204),
                        _StyleClassNames: ["Morph","Button","RectButton"],
                        className: "lively.morphic.Button",
                        isPressed: false,
                        label: "⟳",
                        name: "reloadButton",
                        sourceModule: "lively.morphic.Widgets",
                        style: {
                            borderRadius: 0,
                            padding: lively.rect(4,3,0,0)
                        },
                        value: false,
                        withoutLayers: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "reloadEverything", {});
                    }
                    }],
                    withoutLayers: []
                },{
                    _BorderColor: Color.rgb(210,210,210),
                    _ClipMode: {
                        x: "hidden",
                        y: "scroll"
                    },
                    _Extent: lively.pt(151.3,417.7),
                    _Fill: Color.rgb(255,255,255),
                    _Position: lively.pt(0.0,27.0),
                    _StyleClassNames: ["Morph","Box","List"],
                    _StyleSheet: ".List {\n\
                	border-width: 1px;\n\
                }",
                    className: "lively.morphic.List",
                    layout: {
                        adjustForNewBounds: true,
                        extent: lively.pt(151.3,417.7),
                        listItemHeight: 19,
                        maxExtent: lively.pt(151.3,417.7),
                        maxListItems: 22,
                        noOfCandidatesShown: 1,
                        padding: 0,
                        resizeHeight: true,
                        resizeWidth: true
                    },
                    name: "categoryList",
                    sourceModule: "lively.morphic.Lists",
                    submorphs: [{
                        _BorderColor: null,
                        _Extent: lively.pt(151.3,4.0),
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        halosEnabled: false,
                        layout: {
                            adjustForNewBounds: true,
                            resizeWidth: true
                        },
                        sourceModule: "lively.morphic.Core",
                        submorphs: [],
                        withoutLayers: []
                    }],
                    withoutLayers: [],
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "selection", this.get("PartsBinBrowser"), "categoryName", {});
                }
                }],
                withoutLayers: []
            }],
            withoutLayers: []
        },{
            _BorderColor: null,
            _Extent: lively.pt(2.0,481.0),
            _Fill: Color.rgb(204,204,204),
            _Position: lively.pt(160.9,6.6),
            className: "lively.morphic.VerticalDivider",
            draggingEnabled: true,
            droppingEnabled: true,
            fixed: [],
            layout: {
                resizeHeight: true
            },
            minWidth: 92,
            name: "LeftRightDivider",
            oldPoint: lively.pt(767.0,279.0),
            pointerConnection: null,
            scalingLeft: "[<lively.morphic.Box#CDAB7... - LeftSideContainer>]",
            scalingRight: "[<lively.morphic.Box#518E8... - CategorieContainer>]",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            withoutLayers: []
        },{
            _Extent: lively.pt(657.7,481.0),
            _Fill: Color.rgba(255,255,255,0),
            _Position: lively.pt(165.9,6.6),
            className: "lively.morphic.Box",
            droppingEnabled: false,
            isCopyMorphRef: true,
            layout: {
                adjustForNewBounds: true,
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(1365.0,460.0),
                resizeHeight: true,
                resizeWidth: true,
                spacing: 3,
                type: "lively.morphic.Layout.VerticalLayout"
            },
            morphRefId: 2,
            name: "CategorieContainer",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _Extent: lively.pt(657.7,473.0),
                _Fill: Color.rgba(255,255,255,0),
                className: "lively.morphic.Box",
                droppingEnabled: false,
                layout: {
                    borderSize: 0,
                    extentWithoutPlaceholder: lively.pt(1400.3,159.0),
                    resizeHeight: true,
                    resizeWidth: true,
                    spacing: 7.670000000000001,
                    type: "lively.morphic.Layout.VerticalLayout"
                },
                name: "CategoryContentContainer",
                sourceModule: "lively.morphic.Core",
                submorphs: [{
                    _BorderColor: Color.rgb(190,190,190),
                    _Extent: lively.pt(657.7,27.0),
                    _Fill: Color.rgb(255,255,255),
                    _FontFamily: "Helvetica",
                    _HandStyle: null,
                    _InputAllowed: true,
                    _IsSelectable: true,
                    _Padding: lively.rect(25,7,0,0),
                    _TextColor: Color.rgb(64,64,64),
                    _VerticalAlign: "bottom",
                    allowInput: true,
                    className: "lively.morphic.Text",
                    draggingEnabled: true,
                    droppingEnabled: false,
                    emphasis: [[0,0,{}]],
                    fixedHeight: true,
                    fixedWidth: true,
                    grabbingEnabled: false,
                    isInputLine: true,
                    layout: {
                        adjustForNewBounds: true,
                        resizeHeight: false,
                        resizeWidth: true
                    },
                    name: "searchText",
                    sourceModule: "lively.morphic.TextCore",
                    style: {
                        allowInput: true,
                        borderColor: Color.rgb(190,190,190),
                        borderRadius: 0,
                        borderWidth: 0,
                        clipMode: "visible",
                        enableDragging: true,
                        enableDropping: false,
                        enableGrabbing: false,
                        fill: Color.rgb(255,255,255),
                        fixedHeight: true,
                        fixedWidth: true,
                        fontFamily: "Helvetica",
                        fontSize: 10,
                        padding: lively.rect(25,7,0,0),
                        textColor: Color.rgb(64,64,64)
                    },
                    onFocus: function onFocus(evt) {
                        delete this.priorSelectionRange;
                        $super(evt);
                        // do not restore the previous selection range, just select everything
                        this.selectAll()
                    },
                    submorphs: [{
                        _BorderColor: Color.rgb(204,0,0),
                        _Extent: lively.pt(13.0,15.0),
                        _Position: lively.pt(6.4,6.0),
                        className: "lively.morphic.Image",
                        doNotSerialize: ["_whenLoadedCallbacks"],
                        droppingEnabled: true,
                        layout: {
                            centeredVertical: true
                        },
                        sourceModule: "lively.morphic.Widgets",
                        submorphs: [],
                        url: "http://lively-web.org/core/media/halos/info.svg",
                        withoutLayers: []
                    }],
                    withoutLayers: [],
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "savedTextString", this.get("PartsBinBrowser"), "search", {});
                }
                },{
                    _BorderColor: Color.rgb(210,210,210),
                    _ClipMode: "auto",
                    _Extent: lively.pt(657.7,438.3),
                    _Fill: Color.rgb(255,255,255),
                    _Position: lively.pt(0.0,34.7),
                    className: "lively.morphic.Box",
                    droppingEnabled: false,
                    layout: {
                        resizeHeight: true,
                        resizeWidth: true
                    },
                    name: "partsBinContents",
                    selectedItem: "PartsItem(RhythmWheel,PartsSpace(PartsBin/Fun/))",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [],
                    withoutLayers: [],
                    addPartItemAsync: function addPartItemAsync() {
                                        if (!this.partItemsToBeAdded || this.partItemsToBeAdded.length == 0) {
                                            this.stopAddingPartItemsAsync();
                                            return;
                                        }
                            
                                        var partItem = this.partItemsToBeAdded.shift();
                                        var morph = partItem.asPartsBinItem();
                                        this.addMorph(morph);
                                        this.adjustForNewBounds()
                                    },
                    adjustForNewBounds: function adjustForNewBounds() {
                                        /*
                                            this.adjustForNewBounds()
                                        */
                                        $super();
                                        var bounds = this.innerBounds(),
                                            delta = 8,
                                            left = bounds.x + delta,
                                            top = bounds.y + delta,
                                            x = left, y = top,
                                            width = bounds.width;
                                        this.submorphs.forEach(function(morph) {
                                            var extent = morph.getExtent();
                                            if (extent.x + x + delta > width) {
                                                x = left;
                                                y += extent.y + delta;
                                            }
                                            morph.setPosition(pt(x,y));
                                            x += extent.x + delta;
                                        });
                                    },
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "selectedItem", this.get("PartsBinBrowser"), "setSelectedPartItem", {});
                },
                    selectPartItem: function selectPartItem(item) {
                                        this.selectedItem = item && item.partItem;
                                        this.submorphs.without(item).invoke('showAsNotSelected');
                                    },
                    setExtent: function setExtent(point) {
                                        $super(point)
                                        this.adjustForNewBounds()
                                    },
                    startAddingPartItems: function startAddingPartItems(partItems) {
                                        this.partItemsToBeAdded = partItems.clone();
                                        this.startStepping(0, 'addPartItemAsync')
                                    },
                    stopAddingPartItemsAsync: function stopAddingPartItemsAsync() {
                                        this.stopStepping();
                                        delete this.partItemsToBeAdded;
                                    },
                    unselectAll: function unselectAll() {
                                        this.submorphs.invoke('showAsNotSelected');
                                    }
                }],
                withoutLayers: []
            },{
                _BorderColor: null,
                _Extent: lively.pt(657.7,2.0),
                _Fill: Color.rgb(204,204,204),
                _Position: lively.pt(0.0,476.0),
                className: "lively.morphic.HorizontalDivider",
                draggingEnabled: true,
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    moveVertical: true,
                    resizeWidth: true
                },
                minHeight: -10,
                name: "MoreDivider",
                oldPoint: lively.pt(1685.0,977.0),
                pointerConnection: null,
                sourceModule: "lively.morphic.Widgets",
                submorphs: [{
                    _BorderColor: Color.rgb(204,204,204),
                    _Extent: lively.pt(59.8,30.0),
                    _Fill: Color.rgb(204,204,204),
                    _Position: lively.pt(590.2,-28.6),
                    _StyleClassNames: ["Morph","Button"],
                    className: "lively.morphic.Button",
                    droppingEnabled: false,
                    grabbingEnabled: false,
                    isPressed: false,
                    label: "more",
                    layout: {
                        moveHorizontal: true
                    },
                    name: "moreButton",
                    padding: lively.rect(5,0,0,0),
                    showsMorphMenu: true,
                    sourceModule: "lively.morphic.Widgets",
                    style: {
                        borderRadius: 0
                    },
                    value: false,
                    withoutLayers: [],
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "toggleMorePane", {});
                }
                }],
                withoutLayers: [],
                movedVerticallyBy: function movedVerticallyBy(delta) {
                                $super(delta);
                                // toggle auto
                                if (this.bounds().bottomRight().y < this.get('CategorieContainer').getExtent().y) {
                                    this.get('PartsBinBrowser').moreToggled = true
                                } else {
                                    this.get('PartsBinBrowser').moreToggled = false
                                }
                            }
            },{
                _BorderColor: Color.rgb(204,204,204),
                _ClipMode: "hidden",
                _Extent: lively.pt(657.7,0.0),
                _Fill: Color.rgba(204,204,204,0),
                _Position: lively.pt(0.0,481.0),
                _StyleClassNames: ["Morph","Box"],
                _StyleSheet: " {\n\
            	border-width: 9px;\n\
            }",
                _Visible: true,
                className: "lively.morphic.Box",
                droppingEnabled: false,
                layout: {
                    adjustForNewBounds: true,
                    borderSize: 0,
                    extentWithoutPlaceholder: lively.pt(990.5,411.0),
                    moveHorizontal: false,
                    moveVertical: true,
                    resizeHeight: false,
                    resizeWidth: true,
                    spacing: 7.145,
                    type: "lively.morphic.Layout.VerticalLayout"
                },
                name: "MoreContainer",
                sourceModule: "lively.morphic.Core",
                submorphs: [{
                    _Extent: lively.pt(657.7,27.0),
                    _Fill: Color.rgba(255,255,255,0),
                    className: "lively.morphic.Box",
                    droppingEnabled: false,
                    layout: {
                        adjustForNewBounds: true,
                        borderSize: 0,
                        resizeHeight: false,
                        resizeWidth: true,
                        spacing: 6.615,
                        type: "lively.morphic.Layout.HorizontalLayout"
                    },
                    name: "MoreTitleContainer",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _ClipMode: "hidden",
                        _Extent: lively.pt(574.4,27.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 14,
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _MaxTextWidth: 258,
                        _MinTextWidth: 258,
                        _Padding: lively.rect(0,2,0,0),
                        _Position: lively.pt(9.6,0.0),
                        _TextColor: Color.rgb(64,64,64),
                        allowInput: false,
                        className: "lively.morphic.Text",
                        emphasis: [[0,0,{}]],
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        layout: {
                            centeredVertical: true,
                            resizeHeight: true,
                            resizeWidth: true
                        },
                        name: "selectedPartName",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        withoutLayers: []
                    },{
                        _Extent: lively.pt(67.0,15.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 9,
                        _HandStyle: null,
                        _InputAllowed: true,
                        _IsSelectable: true,
                        _MaxTextWidth: 67,
                        _MinTextWidth: 67,
                        _Position: lively.pt(590.7,6.0),
                        _TextColor: Color.rgb(64,64,64),
                        allowInput: true,
                        className: "lively.morphic.Text",
                        emphasis: [[0,10,{
                            uri: "http://lively-web.org/viral.html?part=RhythmWheel&path=PartsBin%2FFun%2F"
                        }]],
                        fixedWidth: true,
                        layout: {
                            centeredVertical: true,
                            moveHorizontal: true,
                            moveVertical: false,
                            resizeHeight: false
                        },
                        name: "shareLink",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Share Link",
                        withoutLayers: []
                    },{
                        _Align: "left",
                        _Extent: lively.pt(3.0,25.0),
                        _FontFamily: "Arial, sans-serif",
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _MaxTextWidth: 265,
                        _MinTextWidth: 265,
                        _Padding: lively.rect(5,7,0,0),
                        _TextColor: Color.rgb(64,64,64),
                        allowInput: false,
                        className: "lively.morphic.Text",
                        emphasis: [[0,0,{}]],
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        name: "selectedPartSpaceName",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        withoutLayers: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "textString", this, "refineBounds", {});
                    },
                        refineBounds: function refineBounds() {
                                                this.selectAll()
                                                var bounds = this.getSelectionBounds()
                                                this.setSelectionRange(0,0)
                                                this.blur();
                                                this.setExtent(pt(bounds.width + 3, this.getExtent().y))
                                                this.owner.adjustForNewBounds();
                                            }
                    }],
                    withoutLayers: []
                },{
                    _Extent: lively.pt(657.7,28.0),
                    _Fill: Color.rgba(255,255,255,0),
                    _Position: lively.pt(0.0,34.1),
                    className: "lively.morphic.Box",
                    droppingEnabled: false,
                    layout: {
                        borderSize: 0,
                        extentWithoutPlaceholder: lively.pt(1380.3,420.0),
                        resizeHeight: true,
                        resizeWidth: true,
                        spacing: 3,
                        type: "lively.morphic.Layout.HorizontalLayout"
                    },
                    name: "MoreContentContainer",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(127.2,28.0),
                        _Fill: Color.rgba(255,255,255,0),
                        className: "lively.morphic.Box",
                        droppingEnabled: false,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(437.3,136.0),
                            resizeHeight: true,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.VerticalLayout"
                        },
                        name: "InfoContainer",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _BorderColor: Color.rgba(255,255,255,0),
                            _BorderWidth: 8,
                            _ClipMode: "auto",
                            _Extent: lively.pt(127.2,0.0),
                            _Fill: Color.rgb(255,255,255),
                            _FontFamily: "Arial, sans-serif",
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _MaxTextWidth: 315.04,
                            _MinTextWidth: 315.04,
                            _TextColor: Color.rgb(64,64,64),
                            allowInput: true,
                            className: "lively.morphic.Text",
                            emphasis: [[0,0,{}]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            layout: {
                                resizeHeight: true,
                                resizeWidth: true
                            },
                            name: "selectedPartComment",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            withoutLayers: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "savedTextString", this.get("PartsBinBrowser"), "saveCommentForSelectedPartItem", {});
                            lively.bindings.connect(this, "textString", this.get("ButtonLineMorph"), "activateButtons", {converter: 
                        function (text) {
                                                                return text && text.length > 0
                                                            }});
                        }
                        },{
                            _Extent: lively.pt(127.2,28.0),
                            _Fill: Color.rgba(255,255,255,0),
                            className: "lively.morphic.Box",
                            droppingEnabled: false,
                            item: "[object Object]",
                            layout: {
                                borderSize: 0,
                                resizeHeight: false,
                                resizeWidth: true,
                                spacing: 4,
                                type: "lively.morphic.Layout.HorizontalLayout"
                            },
                            name: "ButtonLineMorph",
                            sourceModule: "lively.morphic.Core",
                            submorphs: [{
                                _BorderColor: Color.rgb(255,255,255),
                                _Extent: lively.pt(39.7,28.0),
                                _Fill: Color.rgb(204,204,204),
                                _StyleClassNames: ["Morph","Button","disabled"],
                                className: "lively.morphic.Button",
                                droppingEnabled: false,
                                grabbingEnabled: false,
                                isActive: false,
                                isPressed: false,
                                label: "remove",
                                layout: {
                                    moveVertical: true,
                                    resizeWidth: true
                                },
                                name: "removePartButton",
                                padding: lively.rect(5,0,0,0),
                                showsMorphMenu: true,
                                sourceModule: "lively.morphic.Widgets",
                                style: {
                                    borderRadius: 0
                                },
                                withoutLayers: [],
                                connectionRebuilder: function connectionRebuilder() {
                                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyRemoveSelectedPartItem", {});
                            }
                            },{
                                _BorderColor: Color.rgb(255,255,255),
                                _Extent: lively.pt(39.7,28.0),
                                _Fill: Color.rgb(204,204,204),
                                _Position: lively.pt(87.4,0.0),
                                _StyleClassNames: ["Morph","Button","disabled"],
                                className: "lively.morphic.Button",
                                droppingEnabled: false,
                                grabbingEnabled: false,
                                isActive: false,
                                isPressed: false,
                                label: "move",
                                layout: {
                                    moveVertical: true,
                                    resizeWidth: true
                                },
                                name: "movePartButton",
                                padding: lively.rect(5,0,0,0),
                                sourceModule: "lively.morphic.Widgets",
                                style: {
                                    borderRadius: 0
                                },
                                withoutLayers: [],
                                connectionRebuilder: function connectionRebuilder() {
                                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyMoveSelectedPartItem", {});
                            }
                            },{
                                _BorderColor: Color.rgb(255,255,255),
                                _Extent: lively.pt(39.7,28.0),
                                _Fill: Color.rgb(204,204,204),
                                _Position: lively.pt(43.7,0.0),
                                _StyleClassNames: ["Morph","Button","disabled"],
                                className: "lively.morphic.Button",
                                droppingEnabled: false,
                                grabbingEnabled: false,
                                isActive: false,
                                isPressed: false,
                                label: "copy",
                                layout: {
                                    moveVertical: true,
                                    resizeWidth: true
                                },
                                name: "copyPartButton",
                                padding: lively.rect(5,0,0,0),
                                showsMorphMenu: true,
                                sourceModule: "lively.morphic.Widgets",
                                style: {
                                    borderRadius: 0
                                },
                                withoutLayers: [],
                                connectionRebuilder: function connectionRebuilder() {
                                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyCopySelectedPartItem", {});
                            }
                            }],
                            withoutLayers: [],
                            activateButtons: function activateButtons(bool) {
                                                        this.submorphs.invoke('setActive', !!bool)
                                                    }
                        }],
                        withoutLayers: []
                    },{
                        _Extent: lively.pt(522.5,28.0),
                        _Fill: Color.rgba(255,255,255,0),
                        _Position: lively.pt(135.2,0.0),
                        className: "lively.morphic.Box",
                        droppingEnabled: false,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(528.3,145.0),
                            resizeHeight: true,
                            resizeWidth: false,
                            spacing: 0,
                            type: "lively.morphic.Layout.VerticalLayout"
                        },
                        name: "CommitContainer",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _BorderColor: Color.rgba(255,255,255,0),
                            _ClipMode: "auto",
                            _Extent: lively.pt(522.5,0.0),
                            _Fill: Color.rgb(255,255,255),
                            _StyleClassNames: ["Morph","Box","MorphList"],
                            _StyleSheet: ".MorphList {\n\
                        	overflow-y: scroll;\n\
                        	overflow-x: hidden;\n\
                        }\n\
                        \n\
                        .MorphList .selected {\n\
                        	outline: 0px;\n\
                        	background-color: rgb(42, 87, 192) !important;\n\
                        }\n\
                        \n\
                        .MorphList .selected span {\n\
                        	color: white !important;\n\
                        }\n\
                        \n\
                        .Text {\n\
                        	box-shadow: 0px 2px 0px rgb(244, 244, 244);\n\
                        }",
                            allowDeselectClick: false,
                            className: "lively.morphic.MorphList",
                            droppingEnabled: false,
                            isAdding: false,
                            isCopyMorphRef: true,
                            isMultipleSelectionList: true,
                            itemList: [],
                            itemMorphs: [],
                            layout: {
                                adjustForNewBounds: true,
                                borderSize: 0,
                                extentWithoutPlaceholder: lively.pt(315.9,161.3),
                                resizeHeight: true,
                                resizeWidth: true,
                                spacing: 1,
                                type: "lively.morphic.Layout.TileLayout"
                            },
                            morphRefId: 2,
                            name: "selectedPartVersions",
                            selectedLineNo: null,
                            sourceModule: "lively.morphic.Lists",
                            submorphs: [],
                            withoutLayers: [],
                            adjustForNewBounds: function adjustForNewBounds() {
                                                        if (this.isAdding) { return }
                                                        this.submorphs.each(function(ea) {
                                                            ea.setExtent(pt(this.getExtent().x-1, ea.getExtent().y));
                                                        }, this)
                                                        $super();
                                                        this.submorphs.invoke.bind(this.submorphs, 'fit').delay(0);
                                                    },
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "selection", this.get("ButtonLineVersions"), "activateButtons", {converter: 
                        function (sel) {
                                                        	    return sel && typeof sel.item.value.version !== 'undefined'
                                                        	}});
                        },
                            renderFunction: function renderFunction(listItem) {
                                                        var morph = $super(listItem);
                                                        morph.applyStyle({
                                                            fixedWidth: true,
                                                            textColor: (listItem.value && typeof listItem.value.version==='undefined') ?
                                                                Global.Color.gray : Global.Color.black,
                                                            borderWidth: 0,
                                                            padding: rect(4,5,0,0),
                                                            fill: Global.Color.white
                                                        });
                                                        morph.setExtent(pt(this.getExtent().x-2, morph.getExtent().y));
                                                        morph.emphasize({fontWeight: 'bold'}, 0, morph.getTextString().indexOf('\n'));
                                                        return morph;
                                                    },
                            updateList: function updateList(items) {
                                                        this.isAdding = true;
                                                        $super(items)
                                                        this.isAdding = false;
                                                        this.adjustForNewBounds();
                                                    }
                        },{
                            _Extent: lively.pt(522.5,28.0),
                            _Fill: Color.rgba(255,255,255,0),
                            className: "lively.morphic.Box",
                            droppingEnabled: false,
                            item: "[object Object]",
                            layout: {
                                borderSize: 0,
                                resizeHeight: false,
                                resizeWidth: true,
                                spacing: 4,
                                type: "lively.morphic.Layout.HorizontalLayout"
                            },
                            name: "ButtonLineVersions",
                            sourceModule: "lively.morphic.Core",
                            submorphs: [{
                                _BorderColor: Color.rgb(255,255,255),
                                _Extent: lively.pt(259.3,28.0),
                                _Fill: Color.rgb(204,204,204),
                                _StyleClassNames: ["Morph","Button","disabled"],
                                className: "lively.morphic.Button",
                                droppingEnabled: false,
                                grabbingEnabled: false,
                                isActive: false,
                                isPressed: false,
                                label: "load",
                                layout: {
                                    moveVertical: true,
                                    resizeWidth: true
                                },
                                name: "loadPartButton",
                                padding: lively.rect(5,0,0,0),
                                showsMorphMenu: true,
                                sourceModule: "lively.morphic.Widgets",
                                style: {
                                    borderRadius: 0
                                },
                                value: false,
                                withoutLayers: [],
                                connectionRebuilder: function connectionRebuilder() {
                                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "loadAndOpenSelectedPartItem", {});
                            }
                            },{
                                _BorderColor: Color.rgb(255,255,255),
                                _Extent: lively.pt(259.3,28.0),
                                _Fill: Color.rgb(204,204,204),
                                _Position: lively.pt(263.3,0.0),
                                _StyleClassNames: ["Morph","Button","disabled"],
                                className: "lively.morphic.Button",
                                droppingEnabled: false,
                                grabbingEnabled: false,
                                isActive: false,
                                isPressed: false,
                                label: "revert",
                                layout: {
                                    moveVertical: true,
                                    resizeWidth: true
                                },
                                name: "revertButton",
                                padding: lively.rect(5,0,0,0),
                                sourceModule: "lively.morphic.Widgets",
                                style: {
                                    borderRadius: 0
                                },
                                value: false,
                                withoutLayers: [],
                                connectionRebuilder: function connectionRebuilder() {
                                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyRevertSelectedPart", {});
                            }
                            }],
                            withoutLayers: [],
                            activateButtons: function activateButtons(bool) {
                                                        this.submorphs.invoke('setActive', !!bool)
                                                    }
                        }],
                        withoutLayers: []
                    },{
                        _BorderColor: null,
                        _Extent: lively.pt(2.0,28.0),
                        _Fill: Color.rgb(204,204,204),
                        _Position: lively.pt(130.2,0.0),
                        className: "lively.morphic.VerticalDivider",
                        draggingEnabled: true,
                        droppingEnabled: true,
                        fixed: [],
                        layout: {
                            resizeHeight: true
                        },
                        minWidth: 59,
                        name: "VersionDivider",
                        oldPoint: lively.pt(1234.0,865.0),
                        pointerConnection: null,
                        scalingLeft: "[<lively.morphic.Box#71E27... - InfoContainer>]",
                        scalingRight: "[<lively.morphic.Box#8CFAA... - CommitContainer>]",
                        sourceModule: "lively.morphic.Widgets",
                        submorphs: [],
                        withoutLayers: []
                    }],
                    withoutLayers: []
                }],
                withoutLayers: []
            }],
            withoutLayers: []
        }],
        url: null,
        withLayers: "[GrabbingLayer]",
        withoutLayers: [],
        addCategory: function addCategory(categoryName, doNotUpdate) {
        if (!categoryName.startsWith("*")) {
            var url = this.partsBinURL().withFilename(categoryName);
            this.addExternalCategory(categoryName, url, true);
        } else {
            this.categories[categoryName] = {isSpecialCategory: true};
            this.updateCategoryList(categoryName, doNotUpdate);
        }
    },
        addCategoryInteractively: function addCategoryInteractively() {
        var partsBin = this, world = this.world();
        world.prompt('Name of new category?', function(categoryName) {
            if (!categoryName || categoryName == '') {
           alert('no category created!')
           return;
        }
            partsBin.addCategory(categoryName)
        });
    },
        addExternalCategory: function addExternalCategory(categoryName, url, createPath) {
        url = url.asDirectory();
        this.categories[categoryName] = url;
        if (createPath) {
            this.getPartsSpaceForCategory(categoryName).ensureExistance();
        }
        this.updateCategoryList(categoryName);
    },
        addMorphsForPartItems: function addMorphsForPartItems(partItems, doNotSort) {
        this.removeParts();
        if (!doNotSort) {
            partItems = partItems.sortBy(function(ea) {
                return ea.name.toLowerCase()
            });
        }
        var pContents = this.get('partsBinContents');
        pContents.stopAddingPartItemsAsync();
        pContents.startAddingPartItems(partItems);
    },
        addPartsFromURLs: function addPartsFromURLs(urls) {
        var partsBin = this, partItems = [];
        urls.forEach(function(ea) {
            var partPath = ea.saveRelativePathFrom(Global.URL.root),
                match = partPath.match(/(.*\/)(.*).json/);
            if (match)
                partItems.push(lively.PartsBin.getPartItem(match[2], match[1]));
        });
        partsBin.addMorphsForPartItems(partItems, true);
    },
        addPartsOfCategory: function addPartsOfCategory(categoryName) {
        var partsSpace = this.getPartsSpaceForCategory(categoryName);
        Global.connect(partsSpace, 'partItems', this, 'addMorphsForPartItems', {
            converter: function(partItemObj) { return Global.Properties.ownValues(partItemObj) }})
        partsSpace.load(true);
    },
        collectAllPartItemURLs: function collectAllPartItemURLs(spec) {
        var newURLs = spec.newURLs,
            targetCount = spec.targetCount;
        this.allItemURLs.pushAll(newURLs);
    },
        commitLogString: function commitLogString(metaInfo) {
        if (!metaInfo || !metaInfo.changes) return "";
        return metaInfo.changes
            .reverse()
            .collect(function(ea) {
                return Strings.format("%s %s: \n    %s\n\n",
                    ea.date.format("yyyy-mm-dd HH:MM") ,
                    ea.author, (ea.message || "no comment"));
            })
            .join('');
    },
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "categoryName", this, "loadPartsOfCategory", {});
        lively.bindings.connect(this, "moreToggled", this.get("moreButton"), "setLabel", {converter: 
    function (bool) {
                        return bool ? 'less' : 'more';
                    }});
    },
        defaultPartsBinURL: function defaultPartsBinURL() {
        return new Global.URL(Global.Config.rootPath).withFilename('PartsBin/');
    },
        doSearch: function doSearch() {
        if (Global.URL.root.hostname !== this.partsBinURL().hostname) {
            show('Search not available.'); return; }
    
        this.showMsg("searching...");
        var pb = this;
        var searchString = this.get('searchText').textString;
        if (!searchString || searchString.length === 0) return;
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // find parts via cmdline
        var partsBinPath = this.partsBinURL().relativePathFrom(Global.URL.root),
            findPath = "$WORKSPACE_LK/" + partsBinPath.replace(/\/\//g, '\/');
        doCommandLineSearch(processResult.curry(listPartItems), searchString);
    
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    
        function doCommandLineSearch(next, searchString) {
                var cmdTemplate = "find %s "
                                + "\\( -name node_modules -o -name '.svn' -o -name '.git' \\) -type d -prune "
                                + "-o -type f -iname '*%s*.json*' -print",
                cmd = Strings.format(cmdTemplate, findPath, searchString);
            lively.require('lively.ide.CommandLineInterface').toRun(function() {
                lively.shell.exec(cmd, next);
            });
        }
        function processResult(next, err, searchCmd) {
            if (searchCmd.getCode()) {
                pb.showMsg('Search failure:\n' + searchCmd.getStderr);
                next([]);
                return;
            }
            var lines = Strings.lines(searchCmd.getStdout());
            var partItemURLs = lines.map(function(line) {
                line = line.replace(/\/\//g, '\/') // double path slashes
                var partPath = line.split(partsBinPath).last();
                return pb.partsBinURL().withFilename(partPath);
            });
            next(partItemURLs)
        }
    
        function listPartItems(partItemURLs) { pb.addPartsFromURLs(partItemURLs); }
    },
        ensureCategories: function ensureCategories() {
        if (!this.categories)
            this.categories = {uncategorized: 'PartsBin/'};
    },
        formatVersionEntry: function formatVersionEntry(entry) {
        // date
        var formattedDate = entry.date;
        if (!formattedDate.format) {
            formattedDate = new Date(Date.parse(formattedDate));
        }
        formattedDate = formattedDate.format("yyyy-mm-dd HH:MM")
        // author
        var string = formattedDate + " " + entry.author;
        // version
        if (typeof entry.version !== 'undefined') {
            string += " (version " + entry.version + ")"
        }
        // comment
        string += '\n' + (entry.message || 'no comment')
        return {    string: string,
                    value: entry, isListItem: true};
    },
        getPartsSpaceForCategory: function getPartsSpaceForCategory(categoryName) {
        var url = this.getURLForCategoryNamed(categoryName);
        return lively.PartsBin.partsSpaceWithURL(url);
    },
        getURLForCategoryNamed: function getURLForCategoryNamed(categoryName) {
        this.ensureCategories()
    
        var relative = this.categories[categoryName];
        if (!relative) return null;
        return Global.URL.ensureAbsoluteCodeBaseURL(relative).withRelativePartsResolved()
    },
        interactivelyCopySelectedPartItem: function interactivelyCopySelectedPartItem(partMorph) {
        // FIXME duplication with interactivelyMoveSelectedPartItem
        var partItem = this.selectedPartItem, categories = this.categories, self = this;
        if (!partItem) { alert('no item selected'); return }
        var items = Global.Properties.own(categories).sort()
                .reject(function(ea) { return ea.startsWith("*") || ea === self. categoryName})
                .collect(function(catName) {
            return [catName, function() {
                var url = new Global.URL(categories[catName]);
                var partsSpace = lively.PartsBin.partsSpaceWithURL(url)
                partItem.copyToPartsSpace(partsSpace);
                Global.alertOK('Copied ' + partItem.name + ' to ' + url);
            }]
        })
        lively.morphic.Menu.openAtHand('Select category', items);
    },
        interactivelyMoveSelectedPartItem: function interactivelyMoveSelectedPartItem(partMorph) {
        var partItem = this.selectedPartItem, categories = this.categories, self = this;
        if (!partItem) { alert('no item selected'); return }
        var items = Global.Properties.own(categories).sort()
                .reject(function(ea) { return ea.startsWith("*") || ea === self. categoryName})
                .collect(function(catName) {
            return [catName, function() {
                var url = new Global.URL(categories[catName]);
                var partsSpace = lively.PartsBin.partsSpaceWithURL(url)
                partItem.moveToPartsSpace(partsSpace);
                self.reloadEverything();
                Global.alertOK('Moved ' + partItem.name + ' to ' + url);
            }]
        })
        lively.morphic.Menu.openAtHand('Select category', items);
    },
        interactivelyRemoveSelectedPartItem: function interactivelyRemoveSelectedPartItem(partMorph) {
        var item = this.selectedPartItem;
        if (!item) return;
        this.world().confirm("really delete " + item.name + " in PartsBin?", function(answer) {
        if (!answer) return;
        item.del();
        this.reloadEverything();
        Global.alertOK("deleted " + item.name);
        }.bind(this))
    },
        interactivelyRevertSelectedPart: function interactivelyRevertSelectedPart(partMorph) {
        var version = this.get("selectedPartVersions").getSelectedItem();
        if (!version) return $world.alert("No version selected!");
        var item = this.selectedPartItem;
        if (!item) return $world.alert("No part selected!");
    
        var urls = [item.getFileURL(),
                    item.getHTMLLogoURL(),
                    item.getMetaInfoURL()];
    
        var prompt = 'Do you really want to revert \n'
                    + item.anem
                    + '\nto its version from\n'
                    + new Date(version.value.date).format('yy/mm/dd hh:MM:ss') + '?';
    
        $world.confirm(prompt, function(input) {
            if (!input) { $world.alertOK('Revert aborted.'); return; }
            lively.net.Wiki.revertResources(urls, version.value, function(err) {
                err ? $world.alert('Revert failed:\n' + (err.stack || err)) :
                      $world.alertOK(item.name + ' successfully reverted.');
                lively.bindings.connect(item, 'partVersions', self, 'setSelectedPartItem', {
                  removeAfterUpdate: true,
                  converter: function() { return this.sourceObj; },
                });
                item.loadPartVersions(true);
            });
        });
    },
        loadAndOpenSelectedPartItem: function loadAndOpenSelectedPartItem(partMorph) {
        var item = this.selectedPartItem;
        if (!item) return;
        Global.connect(item, 'part', this, 'openPart', {removeAfterUpdate: true});
        var selectedVersion = this.get('selectedPartVersions').getSelectedItem(),
            rev = selectedVersion ? selectedVersion.value.version : null;
        item.loadPart(true, null, rev);
        Global.alertOK('loading ' + item.name + '...');
    },
        loadPartsOfCategories: function loadPartsOfCategories(categoryResources) {
        categoryResources.mapAsync(function(webR, i, callback) {
            webR.beAsync();
            var answerObject = {
                answer: function (subDocuments) {
                    callback(null, subDocuments.invoke('getURL')
                        .select(function(ea) {return ea.filename().endsWith(".json")})
                        .sortBy(function(ea) {return ea.filename()}))
                }
            }
            Global.connect(webR, 'subDocuments', answerObject, 'answer');
            webR.getSubElements(1);
        }, function(err, list) {
                var urls = list.flatten();
                var partsBin = this, partItems = [];
                urls.forEach(function(ea) {
                    var partPath = ea.saveRelativePathFrom(Global.URL.root),
                        match = partPath.match(/(.*\/)(.*).json/);
                    if (match)
                        partItems.push(lively.PartsBin.getPartItem(match[2], match[1]));
                });
                partsBin.addMorphsForPartItems(partItems);
            }.bind(this));
    },
        loadPartsOfCategory: function loadPartsOfCategory(categoryName) {
        this.removeParts();
        this.setSelectedPartItem(null);
        if (!categoryName) return;
        var webR;
        if (categoryName == "*all*") {
            this.showMsg("loading all...");
            webR = new Global.WebResource(this.partsBinURL()).noProxy().beAsync();
            lively.bindings.connect(webR, 'subCollections', this, 'loadPartsOfCategories');
            webR.getSubElements(1)
        } else if (categoryName == "*latest*") {
            this.showMsg("loading latest...");
            var partsbinDir = this.partsBinURL().saveRelativePathFrom(URL.root);
            lively.ide.CommandLineSearch.findFiles('*.json', {rootDirectory: partsbinDir}, function(err, result) {
              result = result.sortByKey('lastModified').reverse().slice(0,20);
              this.onLoadLatest(result);
            }.bind(this));
        } else if (categoryName == "*search*") {
            this.doSearch();
        } else {
            this.addPartsOfCategory(categoryName);
        }
    },
        makeUpPartNameFor: function makeUpPartNameFor(name) {
        if (!$morph(name)) return name;
        var i = 2;
        while($morph(name + i)) { i++ }
        return name + i;
    },
        onLoad: function onLoad() {
        this.updatePartsBinURLChooser();
        this.get("PartsBinURLChooser").selectAt(0);
    },
        onLoadAll: function onLoadAll(subDocuments) {
        // alertOK("load all " + subDocuments.length)
        var all = subDocuments.invoke('getURL')
        .select(function(ea) {return ea.filename().endsWith(".json")})
        .sortBy(function(ea) {return ea.filename()});
    
        this.addPartsFromURLs(all)
    },
        onLoadLatest: function onLoadLatest(latestFiles) {
        var latestURLs = latestFiles.pluck('path').map(function(path) { return Global.URL.root.withFilename(path); });
        this.addPartsFromURLs(latestURLs);
    },
        openPart: function openPart(partMorph) {
        partMorph.setName(this.makeUpPartNameFor(partMorph.getName()));
        lively.morphic.World.current().firstHand().grabMorph(partMorph, null);
        if(partMorph.onCreateFromPartsBin) partMorph.onCreateFromPartsBin();
        partMorph.setPosition(pt(0,0));
    },
        partsBinURL: function partsBinURL() {
        if (this.url) { return this.url; }
        return this.defaultPartsBinURL();
    },
        reloadEverything: function reloadEverything() {
        this.get('categoryList').updateList([]);
        this.get('partsBinContents').removeAllMorphs();
        this.setSelectedPartItem(null);
        this.updateCategoriesDictFromPartsBin(function() {
            this.addCategory("*latest*", true);
            this.addCategory("*all*", true);
            this.addCategory("*search*", true);
            this.get('categoryList').setSelection('Basic');
        });
    },
        removeCategory: function removeCategory(categoryName) {
        var url = this.getURLForCategoryNamed(categoryName);
        if (!url) {
            alert('No category ' + categoryName + ' exists! Doing nothing')
        return;
        }
        var webR = new Global.WebResource(url);
        if (!webR.exists()) {
            alert('Does not exist: ' + url);
        delete this.categories[categoryName];
        lively.PartsBin.removePartsSpace(name);
        this.updateCategoryList();
        return
        }
        webR.getSubElements()
        if (!webR.subDocuments || webR.subDocuments.length > 0 ||
            !webR.subCollections || webR.subCollections.length > 0) {
            alert('Will not remove directory ' + url + ' because it is not empty')
        } else {
            webR.del();
            Global.alertOK('Removed ' + categoryName + ' url ' + url);
        }
        delete this.categories[categoryName];
        lively.PartsBin.removePartsSpace(name);
        this.updateCategoryList();
    },
        removeCategoryInteractively: function removeCategoryInteractively() {
        var partsBin = this, world = this.world();
        world.confirm('Really remove ' + this.categoryName + '?', function(result) {
        if (!result) {
           alert('no category removed!')
           return;
        }
        partsBin.removeCategory(partsBin.categoryName)
        });
    },
        removeParts: function removeParts() {
        this.get('partsBinContents').submorphs.clone().invoke('remove');
    },
        reset: function reset() {
        // this.get("PartsBinURLChooser").showHalos()
        lively.bindings.disconnect(this.get("PartsBinURLChooser"), 'selection', this, 'setPartsBinURL');
        this.connections = {toggleMorePane: {}};
        this.setSelectedPartItem(null);
        delete this.categories;
        this.getPartsBinMetaInfo().requiredModules = ['lively.PartsBin'];
        this.get('categoryList').updateList([]);
        this.get('partsBinContents').removeAllMorphs();
        this.get('searchText').setTextString("");
        this.get("PartsBinURLChooser").setList([]);
        lively.bindings.connect(this.get("PartsBinURLChooser"), 'selection', this, 'setPartsBinURL');
        this.url = null;
    },
        saveCommentForSelectedPartItem: function saveCommentForSelectedPartItem(comment) {
        if (!this.selectedPartItem) {
        alert('no part item selected!')
        return;
        }
        var metaInfo = this.selectedPartItem.getMetaInfo();
        metaInfo.setComment(comment);
        this.selectedPartItem.uploadMetaInfoOnly();
    },
        search: function search(searchString) {
        // triggers search in this.loadPartsOfCategory through connection
        var list = this.get('categoryList');
        list.deselectAll();
        list.setSelection("*search*");
    },
        setMetaInfoOfSelectedItem: function setMetaInfoOfSelectedItem(metaInfo) {
        var comment = (metaInfo && metaInfo.getComment()) ||
            'No comment yet';
        // this.get('CommitLog').setTextString(this.commitLogString(metaInfo))
        this.setSelectedPartVersions(metaInfo.changes)
        this.get('selectedPartComment').textString = comment;
    },
        setPartsBinURL: function setPartsBinURL(url) {
        lively.PartsBin.partSpaces = {};
        this.url = url;
        this.reloadEverything();
    },
        setSelectedPartItem: function setSelectedPartItem(item) {
        this.selectedPartItem = item;
        this.get('selectedPartComment').textString = '';
        // this.get('CommitLog').textString = '';
        this.get('selectedPartVersions').updateList(item ? ['Loading versions...']: []);
        this.get('selectedPartVersions').setSelection(null);
        if (!item) {
            this.get('selectedPartName').textString = ''
            this.get('selectedPartSpaceName').textString = this.categoryName ? (
                this.categoryName.startsWith('*') ? this.categoryName : 
                this.getPartsSpaceForCategory(this.categoryName).getName()) : '';
            return;
        }
        this.get('selectedPartName').textString = item.name
        this.get('selectedPartSpaceName').textString = item.partsSpaceName
    
        // load versions
        Global.connect(item, 'partVersions', this, 'setSelectedPartVersions');
        item.loadPartVersions(true);
    
        // load meta info
        Global.connect(item, 'loadedMetaInfo', this, 'setMetaInfoOfSelectedItem');
    
        this.setShareLink(item);
    
        item.loadPartMetaInfo(true);
    },
        setSelectedPartVersions: function setSelectedPartVersions(versions) {
        var listMorph = this.get('selectedPartVersions');
        var list = listMorph.itemList.length !== 1 ||
                !listMorph.itemList.include('Loading versions...') ? listMorph.itemList : [];
        // merge lists
        (versions || []).each(function(newItem) {
            var oldDuplicate = list.find(function(oldItem) { 
                // 2 items considered same with 2sec time diff and same author
                return Math.abs(Date.parse(oldItem.value.date) -
                        Date.parse(newItem.date)) <=10000 &&
                    oldItem.value.author === newItem.author
            })
            if (oldDuplicate) { // merge entries if redundant
                var oldFormatted = this.formatVersionEntry(Object.merge([newItem, oldDuplicate.value]));
                
                oldDuplicate.value = oldFormatted.value;
                oldDuplicate.string = oldFormatted.string;
            } else { // add new entry if not
                // here
                list.push(this.formatVersionEntry(newItem));
            }
        },this)
        list.sort(function(a, b) {
            return Date.parse(a.value.date) - Date.parse(b.value.date)
        })
        listMorph.updateList(list)
    },
        setShareLink: function setShareLink(partItem) {
        var linkText = this.get('shareLink');
        linkText.setTextString('Share Link');
        var url = Global.URL.root + 'viral.html?part='
            + partItem.name + '&path=' + partItem.partsSpaceName.replace(/\//g, '%2F');
        linkText.emphasizeAll({uri: url});
    },
        setupConnections: function setupConnections() {
        Global.connect(this.closeButton, 'fire', this, 'remove')
        Global.connect(this.addCategoryButton, 'fire', this, 'addCategoryInteractively')
        Global.connect(this.get('removeCategoryButton'), 'fire', this, 'removeCategoryInteractively')
        Global.connect(this.get('categoryList'), 'selection', this, 'categoryName')
        Global.connect(this, 'categoryName', this, 'loadPartsOfCategory')
    
        Global.connect(this.get('partsBinContents'), 'selectedItem', this, 'setSelectedPartItem')
    
        Global.connect(this.get('reloadButton'), "fire", this, "reloadEverything")
    
        Global.connect(this.get('loadPartButton'), "fire", this, "loadAndOpenSelectedPartItem")
    
        Global.connect(this.get('removePartButton'), "fire", this, "interactivelyRemoveSelectedPartItem")
    
        Global.connect(this.get('movePartButton'), "fire", this, "interactivelyMoveSelectedPartItem")
        Global.connect(this.get('copyPartButton'), "fire", this, "interactivelyCopySelectedPartItem")
    
        Global.connect(this.get('selectedPartComment'), "savedTextString", this, "saveCommentForSelectedPartItem")
    },
        showCommits: function showCommits() {
        if (!this.selectedPartItem) {
            alert('nothing selected');
            return;
        }
        var metaInfo = this.selectedPartItem.loadedMetaInfo;
        this.world().addTextWindow({
            title: 'Commits of ' + metaInfo.partName,
            content: this.commitLogString(metaInfo)
        });
    },
        showMsg: function showMsg(string) {
        var label = new lively.morphic.Text(new Global.Rectangle(0,0,200,30), string);
        label.applyStyle({fill: null, borderWidth: 0})
        this.get('partsBinContents').addMorph(label)
    },
        toggleMorePane: function toggleMorePane() {
        this.withCSSTransitionForAllSubmorphsDo(function () {
            var pane = this.get('MoreContainer'),
                title = this.get('MoreTitleContainer'),
                minY = this.get('CategorieContainer').getExtent().y - 250,
                maxY = this.get('CategorieContainer').getExtent().y + 3;
            this.get('MoreDivider').movedVerticallyBy(this.moreToggled ?
            maxY - pane.getPosition().y + this.get('MoreDivider').getExtent().y - 2: minY - pane.getPosition().y)
        }.bind(this), 350, function() {
            // this is set by MoreDivider
            // this.moreToggled = !this.moreToggled;
        }.bind(this))
    },
        updateCategoriesDictFromPartsBin: function updateCategoriesDictFromPartsBin(thenDo) {
        delete this.categories;
        this.ensureCategories();
        var webR = new Global.WebResource(this.partsBinURL()).noProxy().beAsync().getSubElements();
    
        var callback = function(collections) {
            collections.forEach(function(dir) {
                var unescape = Global.urlUnescape || Global.unescape,
                    unescaped = unescape(dir.getURL().filename()),
                    name = unescaped.replace(/\/$/,"");
                if (name.startsWith('.')) return;
                this.categories[name] = this.partsBinURL().withFilename(unescaped);
            }, this);
            this.updateCategoryList(this.categoryName);
            thenDo && thenDo.call(this);
        }.bind(this);
    
        lively.bindings.connect(webR, 'subCollections', {cb: callback}, 'cb', {
            updater: function($upd, value) {
                if (!(this.sourceObj.status && this.sourceObj.status.isDone())) return;
                if (!value) return;
                $upd(value);
            }
        });
    },
        updateCategoryList: function updateCategoryList(optCategoryName, doNotUpdate) {
        this.get('categoryList').updateList(
        Global.Properties.own(this.categories).sortBy(function(name) { return name.toLowerCase()}));
        if (!doNotUpdate)
            this.get('categoryList').setSelection(optCategoryName)
    },
        updatePartsBinURLChooser: function updatePartsBinURLChooser() {
        // this.updatePartsBinURLChooser();
        this.get("PartsBinURLChooser").setList(lively.PartsBin.getPartsBinURLs());
    }
    }],
    titleBar: "PartsBinBrowser",
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.targetMorph.onLoad();
        this.get('MoreDivider').scalingAbove = [this.get('CategoryContentContainer')];
        this.get('MoreDivider').scalingBelow = [this.get('MoreContainer')];
        this.get('MoreDivider').fixed = [];
        this.get('LeftRightDivider').scalingLeft = [this.get('LeftSideContainer')];
        this.get('LeftRightDivider').scalingRight = [this.get('CategorieContainer')];
        this.get('LeftRightDivider').fixed = [];
        this.get('VersionDivider').scalingLeft = [this.get('InfoContainer')];
        this.get('VersionDivider').scalingRight = [this.get('CommitContainer')];
        this.get('searchText').setTextString('enter search term');
        // this.get('PartsBinBrowser').lock();
    },
    onLoadFromPartsBin: function onLoadFromPartsBin() {
        $super();
        this.targetMorph.reloadEverything();
    },
    reset: function reset() {
        // this.partsBinMetaInfo = x.getPartsBinMetaInfo()
    }
});

}) // end of module
