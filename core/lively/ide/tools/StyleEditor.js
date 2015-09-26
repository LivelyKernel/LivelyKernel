module('lively.ide.tools.StyleEditor').requires('lively.persistence.BuildSpec', 'lively.morphic.Widgets').toRun(function() {

lively.BuildSpec("lively.ide.tools.StyleEditor", {
    _Extent: lively.pt(301.0,483.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    layout: { adjustForNewBounds: true },
    name: "StyleEditorPane",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(293.0,458.0),
        _Fill: Color.rgba(255,255,255,0),
        _HandStyle: "auto",
        _Position: lively.pt(4.0,22.0),
        _StyleClassNames: ["Morph","Box"],
        _StyleSheet: ".Box.Headline {\n\
    	border-width: 0px 0px 1px 0px !important;\n\
    	border-color: gray !important;\n\
    }\n\
    \n\
    .Tab {\n\
    	border-width: 0px !important;\n\
    	border-color: rgb(204,204,204) !important;\n\
    	background-color: rgb(204,204,204);\n\
    }\n\
    \n\
    .Tab.active {\n\
    	background-color: white;\n\
    }\n\
    \n\
    .Tab .Text {\n\
    	text-align: center;\n\
    	margin: -1px 0px 0px 0px;\n\
    }\n\
    \n\
    .Tab .Text span {\n\
    	padding: 0px 0px 0px 0px;\n\
    }\n\
    \n\
    .Text {\n\
    	font-size: 11pt;\n\
    	color: rgb(64,64,64);\n\
    	font-family: Arial;\n\
    }\n\
    \n\
    .TabPane {\n\
    	border-width: 0px;\n\
    	border-color: white;\n\
    	background-color: white;\n\
    }\n\
    \n\
    .CheckBoxHover span {\n\
    	color: rgb(0,101,204) !important;\n\
    }\n\
    \n\
    .Button {\n\
    	background-color: rgb(204,204,204);\n\
    	border-radius: 0px;\n\
    	border-width: 0px;\n\
    }\n\
    \n\
    .Tree {\n\
    	background-color: rgba(0,0,0,0) !important;\n\
    }\n\
    \n\
    .DropDownList {\n\
    	background: none;\n\
    	border: none;\n\
    }\n\
    \n\
    .ClassEdit.Text {\n\
    	font-size: 10pt;\n\
    }\n\
    \n\
    .ClassEdit span {\n\
    	padding: 0px 4px 0px 0px;\n\
    }\n\
    \n\
    .Slider, .SliderKnob {\n\
    	border-width: 1px;\n\
    }",
        className: "lively.morphic.Box",
        customStyleButton: {
            isMorphRef: true,
            name: "CreateCustomStyleButton"
        },
        droppingEnabled: false,
        isCopyMorphRef: true,
        layout: {
            adjustForNewBounds: true,
            extentWithoutPlaceholder: lively.pt(302.0,426.0),
            resizeHeight: true,
            resizeWidth: true
        },
        layoutProps: ["adjustForNewBounds","resizeWidth","resizeHeight","moveVertical","moveHorizontal","centeredHorizontal","centeredVertical","scaleHorizontal","scaleVertical"],
        minExtent: lively.pt(293.0,457.0),
        morphRefId: 1,
        name: "StyleEditorPane",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(204,204,204),
            _Extent: lively.pt(286.0,1.0),
            _Position: lively.pt(3.0,30.6),
            className: "lively.morphic.TabContainer",
            layout: {
                adjustForNewBounds: true,
                resizeHeight: true,
                resizeWidth: true
            },
            name: "TabContainer",
            resizedPanes: ["46EE03CB-BAD8-49E2-88ED-93B7AE7DFF47","B27CD96B-5B45-444F-8FE9-C825CBAE1503","1A8FAB84-E9C9-4169-930D-BB11F46A53B6"],
            sourceModule: "lively.morphic.TabMorphs",
            submorphs: [{
                _BorderColor: Color.rgb(204,204,204),
                _Extent: lively.pt(286.8,25.0),
                adjustedTabSizes: true,
                className: "lively.morphic.TabBar",
                defaultHeight: 25,
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    resizeWidth: true
                },
                sourceModule: "lively.morphic.TabMorphs",
                submorphs: [{
                    _BorderColor: Color.rgb(230,230,230),
                    _Extent: lively.pt(85.3,25.0),
                    _Fill: Color.rgb(204,204,204),
                    _StyleClassNames: ["Morph","Tab"],
                    _ToolTip: "Appearance",
                    className: "lively.morphic.Tab",
                    droppingEnabled: true,
                    isActive: false,
                    name: "Appearance",
                    pane: 1,
                    sourceModule: "lively.morphic.TabMorphs",
                    submorphs: [{
                        _Align: "center",
                        _ClipMode: "hidden",
                        _Extent: lively.pt(83.3,21.0),
                        _FontFamily: "Helvetica",
                        _FontWeight: null,
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _Padding: lively.rect(4,2,0,0),
                        _PointerEvents: "none",
                        _Position: lively.pt(1.0,2.0),
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: true,
                        _WhiteSpaceHandling: "pre",
                        allowInput: false,
                        className: "lively.morphic.Text",
                        draggingEnabled: true,
                        droppingEnabled: false,
                        emphasis: [[0,4,{
                            color: null,
                            fontFamily: null,
                            fontSize: null,
                            fontWeight: "normal",
                            textDecoration: "inherit"
                        }]],
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        grabbingEnabled: false,
                        isLabel: true,
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "View"
                    }],
                    tabBarOffset: 0
                },{
                    _BorderColor: Color.rgb(230,230,230),
                    _Extent: lively.pt(85.3,25.0),
                    _Fill: Color.rgb(204,204,204),
                    _Position: lively.pt(87.3,0.0),
                    _StyleClassNames: ["Morph","Tab"],
                    _ToolTip: "CSS",
                    className: "lively.morphic.Tab",
                    droppingEnabled: true,
                    isActive: false,
                    name: "CSS",
                    pane: 2,
                    sourceModule: "lively.morphic.TabMorphs",
                    submorphs: [{
                        _Align: "center",
                        _ClipMode: "hidden",
                        _Extent: lively.pt(83.3,21.0),
                        _FontFamily: "Helvetica",
                        _FontWeight: null,
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _Padding: lively.rect(4,2,0,0),
                        _PointerEvents: "none",
                        _Position: lively.pt(1.0,2.0),
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: true,
                        _WhiteSpaceHandling: "pre",
                        allowInput: false,
                        className: "lively.morphic.Text",
                        draggingEnabled: true,
                        droppingEnabled: false,
                        emphasis: [[0,3,{
                            color: null,
                            fontFamily: null,
                            fontSize: null,
                            fontWeight: "normal",
                            textDecoration: "inherit"
                        }]],
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        grabbingEnabled: false,
                        isLabel: true,
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "CSS"
                    }],
                    tabBarOffset: 63.45
                },{
                    _BorderColor: Color.rgb(230,230,230),
                    _Extent: lively.pt(85.3,25.0),
                    _Fill: Color.rgb(255,255,255),
                    _Position: lively.pt(174.5,0.0),
                    _StyleClassNames: ["Morph","Tab","active"],
                    _ToolTip: "Layout",
                    className: "lively.morphic.Tab",
                    droppingEnabled: true,
                    isActive: true,
                    name: "Layout",
                    pane: 3,
                    sourceModule: "lively.morphic.TabMorphs",
                    submorphs: [{
                        _Align: "center",
                        _ClipMode: "hidden",
                        _Extent: lively.pt(83.3,21.0),
                        _FontFamily: "Helvetica",
                        _FontSize: 11,
                        _FontWeight: "bold",
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _Padding: lively.rect(4,2,0,0),
                        _PointerEvents: "none",
                        _Position: lively.pt(1.0,2.0),
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: true,
                        _WhiteSpaceHandling: "pre",
                        allowInput: false,
                        className: "lively.morphic.Text",
                        draggingEnabled: true,
                        droppingEnabled: false,
                        emphasis: [[0,6,{
                            color: null,
                            fontFamily: null,
                            fontSize: null,
                            fontWeight: "normal",
                            textDecoration: "inherit"
                        }]],
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        grabbingEnabled: false,
                        isLabel: true,
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Layout"
                    }],
                    tabBarOffset: 126.9
                },{
                    _BorderColor: Color.rgb(189,190,192),
                    _Extent: lively.pt(25.0,25.0),
                    _Position: lively.pt(261.8,0.0),
                    _StyleClassNames: ["Morph","Button"],
                    className: "lively.morphic.Button",
                    droppingEnabled: false,
                    grabbingEnabled: false,
                    isPressed: false,
                    label: "+",
                    layout: {
                        moveHorizontal: true,
                        moveVertical: true
                    },
                    name: "CreateCustomStyleButton",
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
                    this.get('StyleEditorPane').createCustomStylePane()
                },
                    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                    this.setBorderRadius(0)
                }
                }],
                activateTab: function activateTab(aTab) {
                this.tabContainer.activeTab().removeStyleClassName('active');
                $super(aTab);
                this.tabContainer.activeTab().addStyleClassName('active');
            },
                adjustTabExtends: function adjustTabExtends() {
                var offset = 2,
                    customButton = this.getMorphNamed('CreateCustomStyleButton'),
                    customButtonOffset = customButton ? customButton.getExtent().x + offset : 0,
                    available = this.getExtent().subPt(pt(customButtonOffset,0)), // plus button
                    tabExtent = available
                        .subPt(pt(offset * (this.tabs.length - 1)))
                        .scaleBy(1/(this.tabs.length), 1)
                this.tabs.each(function(tab, i) {
                    tab.setExtent(tabExtent);
                    tab.setPosition(pt((i * tabExtent.x) + (i*offset), 0));
                })
                // texts
                if (this.tabs.length === 4) { // I have no idea why that is. really.
                    this.tabs.slice(3).invoke('moveBy', pt(-1,-1));
                    this.tabs.slice(3).each(function(ea) {
                        ea.getPane().setExtent(ea.getPane().getExtent().addPt(pt(0,-2)))
                    })
                }
                var textOffset = pt(1,2);
                this.tabs.each(function(tab) {
                    var text = tab.submorphs.find(function(sub) { return sub.isText })
                    if (text) {
                        text.setExtent(tab.getExtent().subPt(textOffset.scaleBy(2)));
                        text.setPosition(textOffset);
                    }
                });
                if (this.tabs.length === 4) { // I have no idea why that is. really.
                    this.tabs.last().submorphs[0].moveBy(pt(1,1))
                }
                var btn = this.getMorphNamed('CreateCustomStyleButton');
                btn && btn.setPosition(this.bounds().bottomRight().subPt(btn.getExtent()))
            },
                setExtent: function setExtent(anExtent) {
                $super(anExtent);
                this.adjustTabExtends();
            }
            },{
                _BorderColor: Color.rgb(230,230,230),
                _Extent: lively.pt(286.0,400.6),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(0.0,24.0),
                className: "lively.morphic.TabPane",
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    borderSize: 14.285,
                    extentWithoutPlaceholder: lively.pt(286.0,400.6),
                    resizeHeight: true,
                    resizeWidth: true,
                    spacing: 0,
                    type: "lively.morphic.Layout.VerticalLayout"
                },
                name: "View - Pane",
                sourceModule: "lively.morphic.TabMorphs",
                submorphs: [{
                    _BorderWidth: 1,
                    _Extent: lively.pt(257.4,27.0),
                    _Fill: Color.rgb(255,255,255),
                    _Position: lively.pt(14.3,14.3),
                    _StyleClassNames: ["Morph","Box","Headline"],
                    _Visible: true,
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 0,
                        extentWithoutPlaceholder: lively.pt(573.0,39.0),
                        resizeHeight: false,
                        resizeWidth: true,
                        spacing: 15,
                        type: "lively.morphic.Layout.HorizontalLayout"
                    },
                    name: "FillModeDialog",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Align: "left",
                        _ClipMode: "hidden",
                        _Display: "inline",
                        _Extent: lively.pt(220.4,22.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _FontStyle: "normal",
                        _FontWeight: "bold",
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _LineHeight: 1,
                        _Padding: lively.rect(0,5,0,0),
                        _StyleClassNames: ["Morph","Text"],
                        _TextColor: Color.rgb(64,64,64),
                        _TextDecoration: "none",
                        _TextStylingMode: false,
                        _VerticalAlign: "top",
                        _Visible: true,
                        allowInput: false,
                        className: "lively.morphic.Text",
                        emphasis: [[0,4,{
                            backgroundColor: Color.rgba(255,255,255,0),
                            color: Color.rgb(64,64,64),
                            fontFamily: "Arial, sans-serif",
                            fontSize: 11,
                            fontWeight: "bold",
                            italics: "normal",
                            textDecoration: "none"
                        }]],
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        layout: {
                            resizeWidth: true
                        },
                        name: "FillLabel",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Fill"
                    },{
                        _BorderColor: Color.rgb(204,0,0),
                        _Extent: lively.pt(22.0,22.0),
                        _Position: lively.pt(235.4,0.0),
                        _Visible: true,
                        active: true,
                        checked: true,
                        className: "lively.morphic.CheckBox",
                        droppingEnabled: true,
                        name: "AppearanceCheckBox",
                        sourceModule: "lively.morphic.Widgets",
                        submorphs: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setAppearanceMode", {});
                    },
                        onMouseOut: function onMouseOut() {
                        this.get('FillLabel').removeStyleClassName('CheckBoxHover')
                    },
                        onMouseOver: function onMouseOver() {
                        this.get('FillLabel').addStyleClassName('CheckBoxHover')
                    }
                    }]
                },{
                    _BorderColor: Color.rgb(95,94,95),
                    _Extent: lively.pt(257.4,79.0),
                    _Position: lively.pt(14.3,41.3),
                    _Visible: true,
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 12,
                        extentWithoutPlaceholder: lively.pt(257.4,79.0),
                        resizeHeight: true,
                        resizeWidth: true,
                        spacing: 4,
                        type: "lively.morphic.Layout.VerticalLayout"
                    },
                    name: "Filldialog",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(233.4,20.0),
                        _Fill: Color.rgb(255,255,255),
                        _HandStyle: "default",
                        _PointerEvents: "auto",
                        _Position: lively.pt(12.0,12.0),
                        _StyleClassNames: ["Morph","Box","TranslucentMorph"],
                        _Visible: true,
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        eventsAreDisabled: false,
                        layout: {
                            adjustForNewBounds: true,
                            extentWithoutPlaceholder: lively.pt(259.0,58.0),
                            resizeHeight: false,
                            resizeWidth: true
                        },
                        name: "FillColorDialog",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(80.0,16.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,26,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            name: "StyleEditorFillColorLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Color\n\
                                            "
                        },{
                            _BorderColor: Color.rgb(189,190,192),
                            _Extent: lively.pt(16.0,16.0),
                            _Position: lively.pt(137.0,0.0),
                            _StyleClassNames: ["Morph","Button","SimpleColorField","AwesomeColorField"],
                            _Visible: true,
                            className: "lively.morphic.AwesomeColorField",
                            color: Color.rgb(255,255,255),
                            droppingEnabled: false,
                            grabbingEnabled: false,
                            isPressed: false,
                            layout: {
                                adjustForNewBounds: true,
                                moveHorizontal: false,
                                resizeWidth: false
                            },
                            name: "StyleFillColorField",
                            sourceModule: "lively.morphic.ColorChooserDraft",
                            submorphs: [{
                                _BorderColor: null,
                                _Extent: lively.pt(12.0,12.0),
                                _Fill: Color.rgb(255,255,255),
                                _HandStyle: "default",
                                _PointerEvents: "none",
                                _Position: lively.pt(2.0,2.0),
                                className: "lively.morphic.Box",
                                droppingEnabled: true,
                                eventsAreDisabled: true,
                                layout: {
                                    resizeHeight: true,
                                    resizeWidth: true
                                },
                                name: "",
                                sourceModule: "lively.morphic.Core",
                                submorphs: []
                            }],
                            toggle: false,
                            value: false,
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "color", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (fill) { return {fill: fill} }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorFillColorLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorFillColorLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _Extent: lively.pt(233.4,20.0),
                        _Fill: Color.rgb(255,255,255),
                        _HandStyle: "default",
                        _PointerEvents: "auto",
                        _Position: lively.pt(12.0,36.0),
                        _StyleClassNames: ["Morph","Box","TranslucentMorph"],
                        _Visible: true,
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        eventsAreDisabled: false,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(232.4,19.0),
                            resizeHeight: false,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        name: "FillOpacityDialog",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(80.0,18.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: "11",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,7,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: "11",
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            name: "StyleEditorOpacityLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Opacity"
                        },{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(130.4,12.0),
                            _Position: lively.pt(80.0,4.0),
                            _StyleClassNames: ["Morph","Box","Slider"],
                            _Visible: true,
                            className: "lively.morphic.Slider",
                            droppingEnabled: true,
                            layout: {
                                centeredVertical: true,
                                resizeWidth: true
                            },
                            name: "opacitySlider",
                            sliderExtent: 0.1,
                            sliderKnob: {
                                isMorphRef: true,
                                path: "submorphs.0"
                            },
                            sourceModule: "lively.morphic.Widgets",
                            styleClass: ["slider_background_horizontal"],
                            submorphs: [{
                                _BorderColor: Color.rgb(102,102,102),
                                _BorderRadius: 6,
                                _BorderWidth: 1,
                                _Extent: lively.pt(13.0,12.0),
                                _Position: lively.pt(117.0,0.0),
                                _Visible: true,
                                className: "lively.morphic.SliderKnob",
                                droppingEnabled: true,
                                hitPoint: lively.pt(126.2,-2.9),
                                slider: {
                                    isMorphRef: true,
                                    name: "opacitySlider"
                                },
                                sourceModule: "lively.morphic.Widgets",
                                styleClass: ["slider_horizontal"],
                                submorphs: []
                            }],
                            value: 1,
                            valueScale: 1,
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
                            lively.bindings.connect(this, "value", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (v) { return {opacity: v} }});
                            lively.bindings.connect(this, "value", this.get("OpacitySliderVisualizer"), "setTextString", {converter: 
                        function (val) {
                                return Math.round(val*100)/100
                            }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorOpacityLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorOpacityLabel').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _Align: "center",
                            _ClipMode: "hidden",
                            _Display: "inline",
                            _Extent: lively.pt(23.0,19.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _FontStyle: "normal",
                            _FontWeight: "normal",
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(210.4,0.0),
                            _StyleClassNames: ["Morph","Text","Icon"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextDecoration: "none",
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,1,{}]],
                            fixedHeight: true,
                            grabbingEnabled: false,
                            isCopyMorphRef: true,
                            isInputLine: true,
                            morphRefId: 2,
                            name: "OpacitySliderVisualizer",
                            setTtextString: 310,
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "1",
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "savedTextString", this.get("opacitySlider"), "setValue", {converter: 
                        function (value) {
                                return parseFloat(value)
                            }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorOpacityLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorOpacityLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _ClipMode: "hidden",
                        _Extent: lively.pt(219.1,38.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _Position: lively.pt(10.0,23.0),
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: false,
                        _Visible: false,
                        allowInput: false,
                        className: "lively.morphic.Text",
                        emphasis: [[0,52,{
                            color: Color.rgb(64,64,64),
                            fontFamily: "Arial, sans-serif",
                            fontSize: 11,
                            fontWeight: "normal",
                            italics: "normal",
                            textDecoration: null
                        }]],
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        isLayoutable: false,
                        name: "StyleEditorFillMsg",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Fill is styled through CSS only\n\
                                        "
                    }]
                },{
                    _Extent: lively.pt(257.4,28.0),
                    _Fill: Color.rgb(255,255,255),
                    _Position: lively.pt(14.3,120.3),
                    _StyleClassNames: ["Morph","Box","Headline"],
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 0,
                        extentWithoutPlaceholder: lively.pt(256.4,28.0),
                        resizeHeight: false,
                        resizeWidth: true,
                        spacing: 15,
                        type: "lively.morphic.Layout.HorizontalLayout"
                    },
                    name: "Rectangle6",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _ClipMode: "hidden",
                        _Extent: lively.pt(220.4,28.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _FontWeight: "bold",
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _Padding: lively.rect(0,5,0,0),
                        _StyleClassNames: ["Morph","Text"],
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: false,
                        allowInput: false,
                        className: "lively.morphic.Text",
                        emphasis: [[0,6,{
                            color: Color.rgb(64,64,64),
                            fontFamily: "Arial, sans-serif",
                            fontSize: 11,
                            fontWeight: "bold",
                            italics: "normal",
                            textDecoration: null
                        }]],
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        layout: {
                            resizeWidth: true
                        },
                        name: "BorderLabel",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Border"
                    },{
                        _BorderColor: Color.rgb(204,0,0),
                        _Extent: lively.pt(22.0,22.0),
                        _Position: lively.pt(235.4,0.0),
                        active: true,
                        checked: true,
                        className: "lively.morphic.CheckBox",
                        droppingEnabled: true,
                        name: "BorderCheckBox",
                        sourceModule: "lively.morphic.Widgets",
                        submorphs: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setBorderMode", {});
                    },
                        onMouseOut: function onMouseOut() {
                        this.get('BorderLabel').removeStyleClassName('CheckBoxHover')
                    },
                        onMouseOver: function onMouseOver() {
                        this.get('BorderLabel').addStyleClassName('CheckBoxHover')
                    }
                    }]
                },{
                    _BorderColor: Color.rgb(95,94,95),
                    _Extent: lively.pt(257.4,117.0),
                    _Position: lively.pt(14.3,148.3),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 12,
                        extentWithoutPlaceholder: lively.pt(257.4,117.0),
                        resizeHeight: true,
                        resizeWidth: true,
                        spacing: 4,
                        type: "lively.morphic.Layout.VerticalLayout"
                    },
                    name: "Borderdialog",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(233.4,20.0),
                        _Fill: Color.rgb(255,255,255),
                        _HandStyle: "default",
                        _PointerEvents: "auto",
                        _Position: lively.pt(12.0,12.0),
                        _StyleClassNames: ["Morph","Box"],
                        _Visible: true,
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        eventsAreDisabled: false,
                        layout: {
                            adjustForNewBounds: true,
                            extentWithoutPlaceholder: lively.pt(491.0,50.0),
                            resizeHeight: false,
                            resizeWidth: true
                        },
                        name: "BorderColorDialog",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(80.0,16.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: "11",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _Position: lively.pt(0.0,2.0),
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,5,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: "11",
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            layout: {
                                centeredVertical: true,
                                resizeWidth: false
                            },
                            name: "StyleEditorBorderColorLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Color"
                        },{
                            _BorderColor: Color.rgb(189,190,192),
                            _Extent: lively.pt(16.0,16.0),
                            _Position: lively.pt(137.0,0.0),
                            _StyleClassNames: ["Morph","Button","SimpleColorField","AwesomeColorField"],
                            _Visible: true,
                            className: "lively.morphic.AwesomeColorField",
                            color: Color.rgb(0,0,0),
                            droppingEnabled: false,
                            grabbingEnabled: false,
                            isPressed: false,
                            layout: {
                                adjustForNewBounds: true,
                                resizeWidth: false
                            },
                            name: "StyleBorderColorField",
                            sourceModule: "lively.morphic.ColorChooserDraft",
                            submorphs: [{
                                _BorderColor: null,
                                _Extent: lively.pt(12.0,12.0),
                                _Fill: Color.rgb(0,0,0),
                                _HandStyle: "default",
                                _PointerEvents: "none",
                                _Position: lively.pt(2.0,2.0),
                                className: "lively.morphic.Box",
                                droppingEnabled: true,
                                eventsAreDisabled: true,
                                layout: {
                                    resizeHeight: true,
                                    resizeWidth: true
                                },
                                sourceModule: "lively.morphic.Core",
                                submorphs: []
                            }],
                            toggle: false,
                            value: false,
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "color", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (fill) { return {borderColor: fill} }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorBorderColorLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorBorderColorLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _Extent: lively.pt(233.4,20.0),
                        _Fill: Color.rgb(255,255,255),
                        _HandStyle: "default",
                        _PointerEvents: "auto",
                        _Position: lively.pt(12.0,36.0),
                        _StyleClassNames: ["Morph","Box"],
                        _Visible: true,
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        eventsAreDisabled: false,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(232.4,18.0),
                            resizeHeight: false,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        name: "BoderWidthDialog",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(80.0,16.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: "11",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _Position: lively.pt(0.0,2.0),
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,5,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: "11",
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            layout: {
                                centeredVertical: true,
                                resizeWidth: false
                            },
                            name: "StyleEditorBorderWidthLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Width"
                        },{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(128.4,12.0),
                            _Position: lively.pt(80.0,4.0),
                            _StyleClassNames: ["Morph","Box","Slider"],
                            _Visible: true,
                            className: "lively.morphic.Slider",
                            droppingEnabled: true,
                            layout: {
                                centeredVertical: true,
                                resizeWidth: true
                            },
                            name: "borderWidthSlider",
                            sliderExtent: 0.1,
                            sliderKnob: {
                                isMorphRef: true,
                                path: "submorphs.0"
                            },
                            sourceModule: "lively.morphic.Widgets",
                            styleClass: ["slider_background_horizontal"],
                            submorphs: [{
                                _BorderColor: Color.rgb(102,102,102),
                                _BorderRadius: 6,
                                _BorderWidth: 1,
                                _Extent: lively.pt(12.8,12.0),
                                _Position: lively.pt(6.0,0.0),
                                className: "lively.morphic.SliderKnob",
                                droppingEnabled: true,
                                hitPoint: lively.pt(-14.8,-4.4),
                                slider: {
                                    isMorphRef: true,
                                    name: "borderWidthSlider"
                                },
                                sourceModule: "lively.morphic.Widgets",
                                styleClass: ["slider_horizontal"],
                                submorphs: []
                            }],
                            value: 1,
                            valueScale: 20,
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
                            lively.bindings.connect(this, "value", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (v) { return {borderWidth: v} }});
                            lively.bindings.connect(this, "value", this.get("WidthSliderVisualizer"), "setTextString", {converter: 
                        function (val) {
                                return Math.round(val)
                            }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorBorderWidthLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorBorderWidthLabel').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _Align: "center",
                            _ClipMode: "hidden",
                            _Extent: lively.pt(25.0,18.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _HandStyle: null,
                            _InputAllowed: true,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(208.4,0.0),
                            _StyleClassNames: ["Morph","Text","Icon"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,1,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal"
                            }]],
                            fixedHeight: true,
                            grabbingEnabled: false,
                            isInputLine: true,
                            name: "WidthSliderVisualizer",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "1",
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "savedTextString", this.get("borderWidthSlider"), "setValue", {converter: 
                        function (value) {
                                return parseFloat(value)
                            }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorBorderWidthLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorBorderWidthLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _Extent: lively.pt(233.4,20.0),
                        _Fill: Color.rgb(255,255,255),
                        _HandStyle: "default",
                        _PointerEvents: "auto",
                        _Position: lively.pt(12.0,60.0),
                        _StyleClassNames: ["Morph","Box"],
                        _Visible: true,
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        eventsAreDisabled: false,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(575.0,66.0),
                            resizeHeight: false,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        name: "BorderRadiusDialog",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(80.0,16.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: "11",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,6,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: "11",
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            name: "StyleEditorBorderRadiusLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Radius"
                        },{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(128.4,12.0),
                            _Position: lively.pt(80.0,4.0),
                            _StyleClassNames: ["Morph","Box","Slider"],
                            _Visible: true,
                            className: "lively.morphic.Slider",
                            droppingEnabled: true,
                            layout: {
                                centeredVertical: true,
                                resizeWidth: true
                            },
                            name: "borderRadiusSlider",
                            sliderExtent: 0.1,
                            sliderKnob: {
                                isMorphRef: true,
                                path: "submorphs.0"
                            },
                            sourceModule: "lively.morphic.Widgets",
                            styleClass: ["slider_background_horizontal"],
                            submorphs: [{
                                _BorderColor: Color.rgb(102,102,102),
                                _BorderRadius: 6,
                                _BorderWidth: 1,
                                _Extent: lively.pt(12.8,12.0),
                                className: "lively.morphic.SliderKnob",
                                droppingEnabled: true,
                                hitPoint: lively.pt(15.2,1.6),
                                slider: {
                                    isMorphRef: true,
                                    name: "borderRadiusSlider"
                                },
                                sourceModule: "lively.morphic.Widgets",
                                styleClass: ["slider_horizontal"],
                                submorphs: []
                            }],
                            value: 0,
                            valueScale: 50,
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
                            lively.bindings.connect(this, "value", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (v) { return {borderRadius: v} }});
                            lively.bindings.connect(this, "value", this.get("RadiusSliderVisualizer"), "setTextString", {converter: 
                        function (val) {
                                return Math.round(val)
                            }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorBorderRadiusLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorBorderRadiusLabel').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _Align: "center",
                            _ClipMode: "hidden",
                            _Extent: lively.pt(25.0,18.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _HandStyle: null,
                            _InputAllowed: true,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(208.4,0.0),
                            _StyleClassNames: ["Morph","Text","Icon"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,1,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal"
                            }]],
                            fixedHeight: true,
                            grabbingEnabled: false,
                            isInputLine: true,
                            name: "RadiusSliderVisualizer",
                            setTtextString: 310,
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "0",
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "savedTextString", this.get("borderRadiusSlider"), "setValue", {converter: 
                        function (value) {
                                return parseFloat(value)
                            }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorBorderRadiusLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorBorderRadiusLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _Extent: lively.pt(233.4,21.0),
                        _Fill: Color.rgb(255,255,255),
                        _HandStyle: "default",
                        _PointerEvents: "auto",
                        _Position: lively.pt(12.0,84.0),
                        _StyleClassNames: ["Morph","Box"],
                        _Visible: true,
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        eventsAreDisabled: false,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(343.0,41.0),
                            resizeHeight: false,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        name: "BorderStyleDialog",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "auto",
                            _Extent: lively.pt(153.4,21.0),
                            _Fill: Color.rgb(243,243,243),
                            _FontSize: 10,
                            _Position: lively.pt(80.0,0.0),
                            _Visible: true,
                            changeTriggered: false,
                            className: "lively.morphic.DropDownList",
                            droppingEnabled: true,
                            itemList: ["solid","hidden","dotted","dashed","double","groove","ridge","inset","outset"],
                            layout: {
                                resizeWidth: true
                            },
                            name: "borderStyleList",
                            selectOnMove: false,
                            selectedLineNo: 0,
                            selection: "solid",
                            sourceModule: "lively.morphic.Lists",
                            submorphs: [],
                            valueScale: 1,
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (v) { return {borderStyle: v} }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('StyleEditorBorderStyleLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('StyleEditorBorderStyleLabel').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(80.0,19.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: "11",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,5,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: "11",
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            name: "StyleEditorBorderStyleLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Style"
                        }]
                    },{
                        _ClipMode: "hidden",
                        _Extent: lively.pt(238.0,38.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _Position: lively.pt(9.0,46.0),
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: false,
                        _Visible: false,
                        allowInput: false,
                        className: "lively.morphic.Text",
                        emphasis: [[0,54,{
                            color: Color.rgb(64,64,64),
                            fontFamily: "Arial, sans-serif",
                            fontSize: 11,
                            fontWeight: "normal",
                            italics: "normal",
                            textDecoration: null
                        }]],
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        isLayoutable: false,
                        name: "StyleEditorBorderMsg",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Border is styled through CSS only\n\
                                        "
                    }]
                },{
                    _Extent: lively.pt(257.4,28.0),
                    _Fill: Color.rgb(255,255,255),
                    _Position: lively.pt(14.3,265.3),
                    _StyleClassNames: ["Morph","Box","Headline"],
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 0,
                        extentWithoutPlaceholder: lively.pt(256.4,27.0),
                        resizeHeight: false,
                        resizeWidth: true,
                        spacing: 15,
                        type: "lively.morphic.Layout.HorizontalLayout"
                    },
                    name: "Rectangle7",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _ClipMode: "hidden",
                        _Extent: lively.pt(138.0,28.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _FontWeight: "bold",
                        _HandStyle: "default",
                        _InputAllowed: false,
                        _IsSelectable: true,
                        _Padding: lively.rect(0,5,0,0),
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: false,
                        allowInput: false,
                        className: "lively.morphic.Text",
                        emphasis: [[0,4,{
                            color: Color.rgb(64,64,64),
                            fontFamily: "Arial, sans-serif",
                            fontSize: 11,
                            fontWeight: "bold",
                            italics: "normal",
                            textDecoration: null
                        }]],
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        name: "Text3",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Misc"
                    }]
                },{
                    _Extent: lively.pt(257.4,93.0),
                    _Fill: Color.rgba(255,255,255,0),
                    _Position: lively.pt(14.3,293.3),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 12,
                        extentWithoutPlaceholder: lively.pt(257.4,93.0),
                        resizeHeight: true,
                        resizeWidth: true,
                        spacing: 4,
                        type: "lively.morphic.Layout.VerticalLayout"
                    },
                    name: "Miscdialog",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(233.4,20.0),
                        _Fill: Color.rgb(255,255,255),
                        _Position: lively.pt(12.0,12.0),
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(279.0,41.0),
                            resizeHeight: false,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        name: "ClipModeDialog",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(81.0,19.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: "11",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,9,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: "11",
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            name: "ClipModeLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Clip mode"
                        },{
                            _ClipMode: "auto",
                            _Extent: lively.pt(152.4,20.0),
                            _Fill: Color.rgb(243,243,243),
                            _FontSize: 10,
                            _Position: lively.pt(81.0,0.0),
                            _Visible: true,
                            changeTriggered: false,
                            className: "lively.morphic.DropDownList",
                            droppingEnabled: true,
                            itemList: ["visible","hidden","scroll","auto","inherit"],
                            layout: {
                                resizeWidth: true
                            },
                            name: "ClipModeList",
                            selectOnMove: false,
                            selectedLineNo: 0,
                            selection: "visible",
                            sourceModule: "lively.morphic.Lists",
                            submorphs: [],
                            valueScale: 1,
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (v) { return {clipMode: v} }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('ClipModeLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('ClipModeLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _Extent: lively.pt(233.4,20.0),
                        _Fill: Color.rgb(255,255,255),
                        _Position: lively.pt(12.0,36.0),
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(279.0,41.0),
                            resizeHeight: false,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        name: "ClipModeDialog1",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(80.0,19.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: "11",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,10,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: "11",
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            name: "HandStyleLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Hand style"
                        },{
                            _ClipMode: "auto",
                            _Extent: lively.pt(153.4,20.0),
                            _Fill: Color.rgb(243,243,243),
                            _FontSize: 10,
                            _Position: lively.pt(80.0,0.0),
                            _Visible: true,
                            changeTriggered: false,
                            className: "lively.morphic.DropDownList",
                            droppingEnabled: true,
                            itemList: ["auto","default","crosshair","pointer","move","ne-resize","e-resize","se-resize","s-resize","sw-resize","w-resize","nw-resize","text","wait","help","progress"],
                            layout: {
                                resizeWidth: true
                            },
                            name: "HandStyleList",
                            selectOnMove: false,
                            selectedLineNo: 0,
                            selection: "auto",
                            sourceModule: "lively.morphic.Lists",
                            submorphs: [],
                            valueScale: 1,
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (text) {
                                return { handStyle: text }
                            }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('HandStyleLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('HandStyleLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _Extent: lively.pt(233.4,21.0),
                        _Fill: Color.rgb(255,255,255),
                        _Position: lively.pt(12.0,60.0),
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(232.4,21.0),
                            resizeHeight: false,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        name: "ClipModeDialog2",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _ClipMode: "hidden",
                            _Extent: lively.pt(80.0,16.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: "11",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _Visible: true,
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,7,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: "11",
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            name: "ToolTipLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "Tooltip"
                        },{
                            _Align: "left",
                            _ClipMode: "hidden",
                            _Display: "inline",
                            _Extent: lively.pt(153.0,20.0),
                            _Fill: Color.rgb(244,244,244),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _FontStyle: "normal",
                            _FontWeight: "normal",
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(80.0,0.0),
                            _StyleClassNames: ["Morph","Text","TextInput"],
                            _TextColor: Color.rgb(0,0,0),
                            _TextDecoration: "none",
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,0,{
                                color: Color.rgb(0,0,0),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal"
                            }]],
                            fixedHeight: true,
                            grabbingEnabled: false,
                            isInputLine: true,
                            layout: {
                                resizeWidth: true
                            },
                            name: "ToolTipInput",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "savedTextString", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (aString) {
                                return { toolTip: aString }
                            }});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('ToolTipLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('ToolTipLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    }]
                }],
                tab: 0,
                getTabContainer: function getTabContainer() {
                var t = this.getTab();
                return t && t.getTabContainer && t.getTabContainer();
            }
            },{
                _BorderColor: Color.rgb(230,230,230),
                _ClipMode: {
                    x: "visible",
                    y: "scroll"
                },
                _Extent: lively.pt(286.0,399.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(0.0,24.0),
                className: "lively.morphic.TabPane",
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    resizeHeight: true,
                    resizeWidth: true
                },
                name: "CSS - Pane",
                sourceModule: "lively.morphic.TabMorphs",
                submorphs: [{
                    _Align: "left",
                    _BorderColor: Color.rgb(204,204,204),
                    _BorderStyle: "double",
                    _ClipMode: "hidden",
                    _Display: "inline",
                    _Extent: lively.pt(171.0,20.0),
                    _Fill: Color.rgb(244,244,244),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 8,
                    _FontStyle: "normal",
                    _FontWeight: "normal",
                    _HandStyle: null,
                    _InputAllowed: true,
                    _IsSelectable: true,
                    _LineHeight: 1,
                    _Padding: lively.rect(4,3,0,0),
                    _Position: lively.pt(109.0,348.0),
                    _StyleClassNames: ["Morph","Text","ClassEdit","TextInput"],
                    _TextColor: Color.rgb(64,64,64),
                    _TextDecoration: "none",
                    _TextStylingMode: false,
                    _VerticalAlign: "top",
                    allowInput: true,
                    className: "lively.morphic.Text",
                    emphasis: [[0,0,{
                        color: Color.rgb(64,64,64),
                        fontFamily: "Arial, sans-serif",
                        fontSize: 8,
                        fontWeight: "normal"
                    }]],
                    fixedHeight: true,
                    isInputLine: true,
                    layout: {
                        moveHorizontal: false,
                        moveVertical: true,
                        resizeWidth: true
                    },
                    name: "ClassEdit",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: []
                },{
                    _BorderColor: Color.rgb(189,190,192),
                    _Extent: lively.pt(273.0,20.0),
                    _Fill: Color.rgb(204,204,204),
                    _Position: lively.pt(7.0,375.0),
                    _StyleClassNames: ["Morph","Button"],
                    className: "lively.morphic.Button",
                    droppingEnabled: false,
                    grabbingEnabled: false,
                    isPressed: false,
                    label: "Apply",
                    layout: {
                        moveHorizontal: false,
                        moveVertical: true,
                        resizeWidth: true
                    },
                    name: "CSSApplyButton",
                    sourceModule: "lively.morphic.Widgets",
                    toggle: false,
                    value: false,
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "fire", this, "onFire", {});
                },
                    onFire: function onFire() {
                      // connect(this.get("CSSCodePane"), 'savedTextString', this, 'onFire');
                      var morph = this.get("StyleEditorPane").target,
                          css = this.get("CSSCodePane").textString;
  
                      if (morph && morph.setStyleSheet) {
                          if (css.trim().length > 1) {
                              morph.setStyleSheet(css);
                              this.get("CSSCodePane").textString = morph.getStyleSheet() || '';
                          }
  
                          morph.setStyleClassNames(this.get("ClassEdit").textString.split(' '));
                          this.get("ClassEdit").textString = morph.getStyleClassNames().join(' ');
                      }
  
                      this.get("CSSCodePane").setStatusMessage('CSS applied', Color.green, 2);
                
                    },
                    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                      this.setBorderRadius(0)
                    }
                },{
                    _Align: "left",
                    _BorderColor: null,
                    _BorderStyle: "double",
                    _ClipMode: "hidden",
                    _Display: "inline",
                    _Extent: lively.pt(102.0,20.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 11,
                    _FontStyle: "normal",
                    _FontWeight: "normal",
                    _HandStyle: "default",
                    _InputAllowed: false,
                    _IsSelectable: true,
                    _LineHeight: 1,
                    _Padding: lively.rect(4,0,0,0),
                    _Position: lively.pt(6.0,348.0),
                    _TextColor: Color.rgb(64,64,64),
                    _TextDecoration: "none",
                    _TextStylingMode: false,
                    _VerticalAlign: "top",
                    allowInput: false,
                    className: "lively.morphic.Text",
                    emphasis: [[0,13,{
                        backgroundColor: Color.rgba(255,255,255,0),
                        color: Color.rgb(64,64,64),
                        fontFamily: "Arial, sans-serif",
                        fontSize: 11,
                        fontWeight: "normal",
                        italics: "normal",
                        textDecoration: "none"
                    }]],
                    eventsAreIgnored: true,
                    fixedHeight: true,
                    fixedWidth: true,
                    isLabel: true,
                    layout: {
                        moveVertical: true
                    },
                    name: "Text22",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "Classname(s):"
                },
                
                  {
                    _BorderColor: null,
                    _Extent: lively.pt(275.0,335.0),
                    _Position: lively.pt(5,6),
                    style: {
                      fontSize: lively.Config.get('defaultCodeFontSize')-1,
                      gutter: false,
                      textMode: 'css',
                      lineWrapping: false,
                      printMargin: false,
                      resizeWidth: true, resizeHeight: true
                    },
                    className: "lively.morphic.CodeEditor",
                    droppingEnabled: false,
                    grabbingEnabled: false,
                    name: "CSSCodePane",
                    sourceModule: "lively.ide.CodeEditor",
                    textString: "",
                    connectionRebuilder: function connectionRebuilder() {
                      lively.bindings.connect(this, "savedTextString", this.get("CSSApplyButton"), "onFire", {});
                    }
                }],
                tab: 1,
                getTabContainer: function getTabContainer() {
                var t = this.getTab();
                return t && t.getTabContainer && t.getTabContainer();
            }
            },{
                _BorderColor: Color.rgb(230,230,230),
                _Extent: lively.pt(286.0,400.9),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(0.0,24.0),
                className: "lively.morphic.TabPane",
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    borderSize: 13.489999999999998,
                    extentWithoutPlaceholder: lively.pt(285.0,389.9),
                    resizeHeight: true,
                    resizeWidth: true,
                    spacing: 0,
                    type: "lively.morphic.Layout.VerticalLayout"
                },
                name: "Layout - Pane",
                sourceModule: "lively.morphic.TabMorphs",
                submorphs: [{
                    _Extent: lively.pt(259.0,44.6),
                    _Fill: Color.rgb(255,255,255),
                    _Position: lively.pt(13.5,13.5),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 10.315000000000001,
                        extentWithoutPlaceholder: lively.pt(258.0,44.6),
                        resizeHeight: false,
                        resizeWidth: true,
                        spacing: 1.585,
                        type: "lively.morphic.Layout.VerticalLayout"
                    },
                    name: "LayoutGeneral",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(238.4,20.0),
                        _Fill: Color.rgba(255,255,255,0),
                        _Position: lively.pt(10.3,10.3),
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(284.0,21.0),
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.HorizontalLayout"
                        },
                        name: "Rectangle1",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _Align: "left",
                            _ClipMode: "hidden",
                            _Display: "inline",
                            _Extent: lively.pt(218.4,20.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _FontStyle: "normal",
                            _FontWeight: "normal",
                            _HandStyle: "default",
                            _InputAllowed: false,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _Padding: lively.rect(4,2,0,0),
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextDecoration: "none",
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: false,
                            className: "lively.morphic.Text",
                            emphasis: [[0,16,{
                                backgroundColor: Color.rgba(255,255,255,0),
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: "none"
                            }]],
                            eventsAreIgnored: true,
                            fixedHeight: true,
                            fixedWidth: true,
                            isLabel: true,
                            layout: {
                                resizeWidth: true
                            },
                            name: "adjustForNewBoundsLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "inform submorphs"
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(218.4,0.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            droppingEnabled: true,
                            layoutProperty: "adjustForNewBounds",
                            name: "adjustForNewBoundsCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                        var style = {},
                                                    		prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('adjustForNewBoundsLabel').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('adjustForNewBoundsLabel').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    }]
                },{
                    _BorderWidth: 1,
                    _Extent: lively.pt(259.0,32.0),
                    _Fill: Color.rgba(0,0,204,0),
                    _Position: lively.pt(13.5,58.1),
                    _StyleClassNames: ["Morph","Box","Headline"],
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 0,
                        extentWithoutPlaceholder: lively.pt(258.0,32.0),
                        resizeWidth: true,
                        spacing: 0,
                        type: "lively.morphic.Layout.HorizontalLayout"
                    },
                    name: "Rectangle3",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(259.0,29.0),
                        _Fill: Color.rgba(255,255,255,0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _FontWeight: "bold",
                        _MaxTextWidth: 120.695652,
                        _MinTextWidth: 120.695652,
                        _Padding: lively.rect(0,5,0,0),
                        _StyleClassNames: ["Morph","Text"],
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: false,
                        className: "lively.morphic.Text",
                        droppingEnabled: false,
                        emphasis: [[0,17,{
                            color: Color.rgb(64,64,64),
                            fontFamily: "Arial, sans-serif",
                            fontSize: 11,
                            fontWeight: "bold",
                            italics: "normal",
                            textDecoration: null
                        }]],
                        fixedWidth: true,
                        grabbingEnabled: false,
                        layout: {
                            resizeWidth: true
                        },
                        name: "Text5",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Layout properties"
                    }]
                },{
                    _Extent: lively.pt(259.0,132.7),
                    _Fill: Color.rgba(255,255,255,0),
                    _Position: lively.pt(13.5,90.1),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 7.9350000000000005,
                        extentWithoutPlaceholder: lively.pt(255.0,285.4),
                        resizeHeight: true,
                        resizeWidth: true,
                        spacing: 0,
                        type: "lively.morphic.Layout.HorizontalLayout"
                    },
                    name: "Rectangle9",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(78.6,116.8),
                        _Fill: Color.rgb(255,255,255),
                        _Position: lively.pt(172.5,7.9),
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(80.7,128.8),
                            resizeHeight: true,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.VerticalLayout"
                        },
                        name: "Rectangle8",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _Align: "center",
                            _Display: "inline",
                            _Extent: lively.pt(78.6,23.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _FontStyle: "normal",
                            _FontWeight: "normal",
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _StyleClassNames: ["Morph","Text","Icon"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextDecoration: "none",
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,1,{
                                backgroundColor: Color.rgba(255,255,255,0),
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: "none"
                            }]],
                            fixedWidth: true,
                            grabbingEnabled: false,
                            layout: {
                                resizeWidth: true
                            },
                            name: "HeightIcon",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "↕"
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(29.3,23.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            layout: {
                                centeredHorizontal: true
                            },
                            layoutProperty: "resizeHeight",
                            name: "resizeHeightCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                		var style = {},
                                                			prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('ResizeLabel').removeStyleClassName('CheckBoxHover')
                            this.get('HeightIcon').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('ResizeLabel').addStyleClassName('CheckBoxHover')
                            this.get('HeightIcon').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(29.3,43.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            layout: {
                                centeredHorizontal: true
                            },
                            layoutProperty: "moveVertical",
                            name: "moveVerticalCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                		var style = {},
                                                			prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('MoveLabel').removeStyleClassName('CheckBoxHover')
                            this.get('HeightIcon').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('MoveLabel').addStyleClassName('CheckBoxHover')
                            this.get('HeightIcon').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(29.3,63.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            droppingEnabled: true,
                            layout: {
                                centeredHorizontal: true
                            },
                            layoutProperty: "centeredVertical",
                            name: "centeredVerticalCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                		var style = {},
                                                			prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('CenterLabel').removeStyleClassName('CheckBoxHover')
                            this.get('HeightIcon').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('CenterLabel').addStyleClassName('CheckBoxHover')
                            this.get('HeightIcon').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(29.3,83.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            droppingEnabled: true,
                            layout: {
                                centeredHorizontal: true
                            },
                            layoutProperty: "scaleVertical",
                            name: "scaleVerticalCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                		var style = {},
                                                			prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('ScaleLabel').removeStyleClassName('CheckBoxHover')
                            this.get('HeightIcon').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('ScaleLabel').addStyleClassName('CheckBoxHover')
                            this.get('HeightIcon').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _Extent: lively.pt(78.6,116.8),
                        _Fill: Color.rgb(255,255,255),
                        _Position: lively.pt(93.9,7.9),
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        layout: {
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(314.9,364.1),
                            resizeHeight: true,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.VerticalLayout"
                        },
                        name: "Rectangle5",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _Align: "center",
                            _Display: "inline",
                            _Extent: lively.pt(78.6,23.0),
                            _Fill: Color.rgba(204,0,0,0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _FontStyle: "normal",
                            _FontWeight: "bold",
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _StyleClassNames: ["Morph","Text","Icon"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextDecoration: "none",
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,1,{
                                backgroundColor: Color.rgba(255,255,255,0),
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "bold",
                                italics: "normal",
                                textDecoration: "none"
                            }]],
                            fixedHeight: true,
                            fixedWidth: true,
                            grabbingEnabled: false,
                            layout: {
                                resizeHeight: false,
                                resizeWidth: true
                            },
                            name: "WidthIcon",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "↔"
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(29.3,23.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            layout: {
                                centeredHorizontal: true
                            },
                            layoutProperty: "resizeWidth",
                            name: "resizeWidthCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                		var style = {},
                                                			prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('ResizeLabel').removeStyleClassName('CheckBoxHover')
                            this.get('WidthIcon').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('ResizeLabel').addStyleClassName('CheckBoxHover')
                            this.get('WidthIcon').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(29.3,43.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            layout: {
                                centeredHorizontal: true
                            },
                            layoutProperty: "moveHorizontal",
                            name: "moveHorizontalCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                		var style = {},
                                                			prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('MoveLabel').removeStyleClassName('CheckBoxHover')
                            this.get('WidthIcon').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('MoveLabel').addStyleClassName('CheckBoxHover')
                            this.get('WidthIcon').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(29.3,63.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            layout: {
                                centeredHorizontal: true
                            },
                            layoutProperty: "centeredHorizontal",
                            name: "centeredHorizontalCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                		var style = {},
                                                			prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('CenterLabel').removeStyleClassName('CheckBoxHover')
                            this.get('WidthIcon').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('CenterLabel').addStyleClassName('CheckBoxHover')
                            this.get('WidthIcon').addStyleClassName('CheckBoxHover')
                        }
                        },{
                            _BorderColor: Color.rgb(204,0,0),
                            _Extent: lively.pt(20.0,20.0),
                            _Position: lively.pt(29.3,83.0),
                            active: true,
                            checked: false,
                            className: "lively.morphic.CheckBox",
                            droppingEnabled: true,
                            layout: {
                                centeredHorizontal: true
                            },
                            layoutProperty: "scaleHorizontal",
                            name: "scaleHorizontalCheckBox",
                            sourceModule: "lively.morphic.Widgets",
                            submorphs: [],
                            connectionRebuilder: function connectionRebuilder() {
                            lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                        function (bool) {
                                                		var style = {},
                                                			prop = this.sourceObj.layoutProperty;
                                                		style[prop] = bool;
                                                		return style
                                                	}});
                        },
                            onMouseOut: function onMouseOut() {
                            this.get('ScaleLabel').removeStyleClassName('CheckBoxHover')
                            this.get('WidthIcon').removeStyleClassName('CheckBoxHover')
                        },
                            onMouseOver: function onMouseOver() {
                            this.get('ScaleLabel').addStyleClassName('CheckBoxHover')
                            this.get('WidthIcon').addStyleClassName('CheckBoxHover')
                        }
                        }]
                    },{
                        _Extent: lively.pt(86.0,116.8),
                        _Fill: Color.rgb(255,255,255),
                        _Position: lively.pt(7.9,7.9),
                        className: "lively.morphic.Box",
                        droppingEnabled: true,
                        layout: {
                            adjustForNewBounds: false,
                            borderSize: 0,
                            extentWithoutPlaceholder: lively.pt(81.0,118.0),
                            resizeHeight: true,
                            resizeWidth: true,
                            spacing: 0,
                            type: "lively.morphic.Layout.VerticalLayout"
                        },
                        name: "Rectangle4",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [{
                            _Extent: lively.pt(86.0,17.0),
                            _Fill: Color.rgba(0,0,204,0),
                            _HandStyle: "default",
                            _PointerEvents: "none",
                            className: "lively.morphic.Box",
                            droppingEnabled: true,
                            eventsAreDisabled: true,
                            name: "Rectangle12",
                            sourceModule: "lively.morphic.Core",
                            submorphs: []
                        },{
                            _Align: "left",
                            _Display: "inline",
                            _Extent: lively.pt(86.0,23.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _FontWeight: "normal",
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(0.0,17.0),
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,4,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }],[4,6,{
                                backgroundColor: Color.rgba(255,255,255,0),
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            fixedWidth: true,
                            grabbingEnabled: false,
                            layout: {
                                resizeWidth: true
                            },
                            name: "ResizeLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "resize"
                        },{
                            _Align: "left",
                            _Display: "inline",
                            _Extent: lively.pt(86.0,23.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _FontStyle: "normal",
                            _FontWeight: "normal",
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(0.0,40.0),
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextDecoration: "none",
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,4,{
                                backgroundColor: Color.rgba(255,255,255,0),
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: "none"
                            }]],
                            fixedWidth: true,
                            grabbingEnabled: false,
                            layout: {
                                resizeWidth: true
                            },
                            name: "MoveLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "move"
                        },{
                            _Align: "left",
                            _Display: "inline",
                            _Extent: lively.pt(86.0,23.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(0.0,63.0),
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,5,{
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }],[5,6,{
                                backgroundColor: Color.rgba(255,255,255,0),
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: null
                            }]],
                            fixedWidth: true,
                            grabbingEnabled: false,
                            layout: {
                                resizeWidth: true
                            },
                            name: "CenterLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "center"
                        },{
                            _Align: "left",
                            _Display: "inline",
                            _Extent: lively.pt(86.0,23.0),
                            _FontFamily: "Arial, sans-serif",
                            _FontSize: 11,
                            _FontStyle: "normal",
                            _FontWeight: "normal",
                            _HandStyle: null,
                            _InputAllowed: true,
                            _IsSelectable: true,
                            _LineHeight: 1,
                            _MaxTextWidth: 120.695652,
                            _MinTextWidth: 120.695652,
                            _Padding: lively.rect(4,2,0,0),
                            _Position: lively.pt(0.0,86.0),
                            _StyleClassNames: ["Morph","Text"],
                            _TextColor: Color.rgb(64,64,64),
                            _TextDecoration: "none",
                            _TextStylingMode: false,
                            _VerticalAlign: "top",
                            allowInput: true,
                            className: "lively.morphic.Text",
                            droppingEnabled: false,
                            emphasis: [[0,5,{
                                backgroundColor: Color.rgba(255,255,255,0),
                                color: Color.rgb(64,64,64),
                                fontFamily: "Arial, sans-serif",
                                fontSize: 11,
                                fontWeight: "normal",
                                italics: "normal",
                                textDecoration: "none"
                            }]],
                            fixedWidth: true,
                            grabbingEnabled: false,
                            layout: {
                                resizeWidth: true
                            },
                            name: "ScaleLabel",
                            sourceModule: "lively.morphic.TextCore",
                            submorphs: [],
                            textString: "scale"
                        }]
                    }]
                },{
                    _BorderWidth: 1,
                    _Extent: lively.pt(259.0,32.0),
                    _Fill: Color.rgba(0,0,204,0),
                    _Position: lively.pt(13.5,222.7),
                    _StyleClassNames: ["Morph","Box","Headline"],
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 0,
                        extentWithoutPlaceholder: lively.pt(236.0,32.0),
                        resizeWidth: true,
                        spacing: 0,
                        type: "lively.morphic.Layout.HorizontalLayout"
                    },
                    name: "Rectangle10",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(259.0,29.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _FontWeight: "bold",
                        _MaxTextWidth: 120.695652,
                        _MinTextWidth: 120.695652,
                        _Padding: lively.rect(0,5,0,0),
                        _StyleClassNames: ["Morph","Text"],
                        _TextColor: Color.rgb(64,64,64),
                        _TextStylingMode: false,
                        className: "lively.morphic.Text",
                        droppingEnabled: false,
                        emphasis: [[0,8,{
                            color: Color.rgb(64,64,64),
                            fontFamily: "Arial, sans-serif",
                            fontSize: 11,
                            fontWeight: "bold",
                            italics: "normal",
                            textDecoration: null
                        }]],
                        fixedWidth: true,
                        grabbingEnabled: false,
                        layout: {
                            resizeWidth: true
                        },
                        name: "Text4",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Layouter"
                    }]
                },{
                    _ClipMode: "scroll",
                    _Extent: lively.pt(259.0,132.7),
                    _Fill: Color.rgba(255,255,255,0),
                    _Position: lively.pt(13.5,254.7),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    layout: {
                        borderSize: 11.905000000000001,
                        extentWithoutPlaceholder: lively.pt(258.0,159.1),
                        resizeHeight: true,
                        resizeWidth: true,
                        spacing: 2.645,
                        type: "lively.morphic.Layout.VerticalLayout"
                    },
                    name: "LayouterContentPane",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _ClipMode: "auto",
                        _Extent: lively.pt(235.2,20.0),
                        _Fill: Color.rgba(243,243,243,0),
                        _FontSize: 10,
                        _Position: lively.pt(11.9,11.9),
                        _StyleClassNames: ["Morph","Box","OldList","DropDownList"],
                        _StyleSheet: ".DrowDownList {\n\
                    	box-shadow: none;\n\
                    }",
                        changeTriggered: true,
                        className: "lively.morphic.DropDownList",
                        droppingEnabled: true,
                        itemList: [{
                            isListItem: true,
                            string: "none",
                            value: null
                        },{
                            isListItem: true,
                            string: "HorizontalLayout",
                            value: "lively.morphic.Layout.HorizontalLayout"
                        },{
                            isListItem: true,
                            string: "TightHorizontalLayout",
                            value: "lively.morphic.Layout.TightHorizontalLayout"
                        },{
                            isListItem: true,
                            string: "VerticalLayout",
                            value: "lively.morphic.Layout.VerticalLayout"
                        },{
                            isListItem: true,
                            string: "JournalLayout",
                            value: "lively.morphic.Layout.JournalLayout"
                        },{
                            isListItem: true,
                            string: "TileLayout",
                            value: "lively.morphic.Layout.TileLayout"
                        },{
                            isListItem: true,
                            string: "GridLayout",
                            value: "lively.morphic.Layout.GridLayout"
                        }],
                        layout: {
                            resizeWidth: true
                        },
                        name: "layouterList",
                        selectOnMove: false,
                        selectedLineNo: -1,
                        sourceModule: "lively.morphic.Lists",
                        submorphs: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setLayouterOnTargetMorph", {});
                        lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "openLayoutConfigurator", {});
                    }
                    }]
                }],
                tab: 2,
                getTabContainer: function getTabContainer() {
                var t = this.getTab();
                return t && t.getTabContainer && t.getTabContainer();
            }
            }],
            tabBar: {
                isMorphRef: true,
                path: "submorphs.0"
            },
            tabBarStrategy: "lively.morphic.TabStrategyTop",
            tabPaneExtent: lively.pt(285.0,342.6),
            addTabPane: function addTabPane(aPane) {
            $super(aPane);
            // move because of border width
            aPane.moveBy(pt(0, -1))
        },
            onResizePane: function onResizePane() {
            
        },
            submorphResized: function submorphResized() {
            
        }
        },{
            _Extent: lively.pt(286.8,25.0),
            _Fill: Color.rgba(0,0,204,0),
            _Position: lively.pt(3.0,3.0),
            className: "lively.morphic.Box",
            droppingEnabled: true,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(286.5,25.0),
                resizeWidth: true,
                spacing: 2.215,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "StyleEditorHeadline",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(189,190,192),
                _Extent: lively.pt(231.4,25.0),
                _Fill: Color.rgb(204,204,204),
                className: "lively.morphic.Button",
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                label: "no target chosen",
                layout: {
                    resizeWidth: true
                },
                list: [],
                name: "TargetName",
                padding: lively.rect(5,0,0,0),
                selection: null,
                showsMorphMenu: true,
                sourceModule: "lively.morphic.Widgets",
                style: {
                    borderColor: Color.rgb(189,190,192),
                    borderRadius: 0,
                    borderWidth: 1,
                    enableDropping: false,
                    enableGrabbing: false,
                    label: {
                        align: "center",
                        borderWidth: 0,
                        clipMode: "hidden",
                        emphasize: {
                            textShadow: {
                                color: Color.rgb(255,255,255),
                                offset: lively.pt(0.0,1.0)
                            }
                        },
                        fill: null,
                        fixedHeight: true,
                        fixedWidth: true,
                        fontSize: 10,
                        padding: lively.rect(0,3,0,0),
                        textColor: Color.rgb(0,0,0)
                    },
                    padding: lively.rect(0,3,0,0)
                },
                textString: "Carrot",
                createScenePresentation: function createScenePresentation() {
                var that = this,
                   items = this.currentMorphicScene(),
                   height = this.get('View - Pane').getExtent().y + 15,
                   bounds = new Global.Rectangle(10, this.getExtent().y, this.owner.getExtent().x - 20, height),
                   treeMorph = new lively.morphic.Tree(),
                   rect = lively.morphic.Morph.makeRectangle(bounds),
                   currentTarget = null;
                   
               treeMorph.childrenPerPage = 10000;
               treeMorph.setName("MorphSelectorTree");
               treeMorph.getLayouter().defer();
               treeMorph.setItem(items);
               treeMorph.childNodes.each(function (n) {
                   n.expand();
               })
                treeMorph.setPosition(pt(treeMorph.getPosition().x, 8))
            
               currentTarget = this.highlightCurrentTarget(treeMorph);
            
               rect.isLayoutable = false;
               rect.setBounds(bounds)
               rect.setFill(Global.Color.rgba(204,204,204,.85));
               rect.setBorderWidth(0)
               rect.beClip(true);
               rect.disableGrabbing();
               rect.disableDragging();
               rect.setBorderColor(Global.Color.rgb(150,150,150));
               rect.addMorph(treeMorph);
               rect.treeMorph = treeMorph;
               rect.currentTarget = currentTarget;
            
               return rect;
                            },
                currentMorphicScene: function currentMorphicScene() {
                var onSelect = function onSelect(tree) {
                    this.selector.updateTargetFromSelection(this.value);
                }
                var properties = {
                        editorPane: this.owner,
                        selector: this
                    }
            
                return {children: [{
                    name: 'World',
                    value: this.world(),
                    selector: this,
                    onSelect: onSelect,
                    children: this.world().submorphs.invoke('treeItemsOfMorphNames',
                        {scripts: [onSelect],
                         properties: properties,
                         showUnnamed: true}).compact()
                }]};
            },
                highlightCurrentTarget: function highlightCurrentTarget(tree) {
                var target = this.get('StyleEditorPane').target,
                    nodes = tree.childNodes,
                    highlightNode;
                    
                if (!target) {
                    return
                } else if (target.isMorph) {
                    var expandables = [target],
                        nextOwner = target,
                        currentNode
                    while (nextOwner.owner) {
                        expandables.push(nextOwner.owner)
                        nextOwner = nextOwner.owner
                    }
                    expandables.reverse().each(function (m) {
                        currentNode = nodes.detect(function (n) {
                            return n.item.value === m;
                        })
                        if (currentNode) {
                            nodes = currentNode.childNodes
                            if (!nodes && currentNode.item.children) {
                                currentNode.expand();
                                nodes = currentNode.childNodes;
                            }
                        } else {
                            return;
                        }
                    })
                    if (currentNode && currentNode.item.value === target) {
                        highlightNode = currentNode;
                    }
                } else {
                    var groupNodes = nodes.detect(function (n) {
                        return n.item.value === 'groups';
                    }).childNodes
                    highlightNode = groupNodes.detect(function (n) {
                        // group names are unique
                        return n.item.value.name === target.name;
                    })
                }
            
                if (highlightNode) {
                    this.highlightTarget(highlightNode);
                }
                return highlightNode;
            },
                highlightTarget: function highlightTarget(node) {
                node.submorphs[0].setFill(Global.Color.white.withA(0.6))
            },
                onBlur: function onBlur(evt) {
                $super(evt);
            
                // remove the scene presentation when clicked elsewhere
                var target = evt.hand.clickedOnMorph;
                if (!this.listMorph || !this.listMorph.isAncestorOf(target)) {
                    this.removeTargetChooser();
                } else {
                    this.focus();
                }
            },
                onMouseDown: function onMouseDown(evt) {
                if (evt.isCommandKey() || evt.isRightMouseButtonDown()) {
                    return $super(evt);
                }
            
                if (this.listMorph) {
                    // clicked on morph, not the list, not the list's scrollbar
                    if (evt.target === this.renderContext().shapeNode)
                        this.removeTargetChooser();
                } else {
                    this.presentTargetChooser();
                }
            },
                presentTargetChooser: function presentTargetChooser() {
                var list = this.createScenePresentation(),
                    tree = list.treeMorph,
                    target = list.currentTarget
                    
                list.setVisible(false)
                this.addMorph(list)
                this.listMorph = list
                list.focus()
            
                // need temp here, doesn't work otherwise, strange errors... Javascript WAT
                var layouting = function() {
                    list.setVisible(true)
                    if (target) {
                        var globalTransform = new lively.morphic.Similitude()
                        for (var morph = target; (morph != list) &&
                                (morph != undefined); morph = morph.owner) {
                            globalTransform.preConcatenate(morph.getTransform());
                        }
                        list.scrollRectIntoView(target.getBounds().
                                                    translatedBy(globalTransform.getTranslation()));
                        tree.getLayouter().resume();
                    }
                }
                layouting.morphicDelay(1);
            },
                removeHighlight: function removeHighlight(node) {
                node.submorphs[0].setFill(Global.Color.rgb(255,255,255))
            },
                removeTargetChooser: function removeTargetChooser() {
                if (this.listMorph) {
                    this.listMorph.remove();
                    delete this.listMorph;
                }
            },
                reset: function reset() {
                this.removeTargetChooser();
                this.setLabel('empty');
                this.applyStyle({fixedWidth: true, fixedHeight: true, borderWidth: 1, overflow: 'visible'});
            },
                setLabel: function setLabel(label) {
                this.label.setTextString(label);
                this.label.setAlign('left');
            },
                updateTargetFromOwner: function updateTargetFromOwner() {
                this.setLabel(this.owner.target);
            },
                updateTargetFromSelection: function updateTargetFromSelection(selection) {
                function update(confirmed) {
                    if (!confirmed) return;
                    this.get('StyleEditorPane').setTarget(selection);
                    this.setLabel(selection.getName() || selection.toString());
                }
                this.removeTargetChooser();
                if (this.owner.hasUnsavedChanges && this.owner.hasUnsavedChanges()) {
                    this.owner.confirmUnsavedChanges(update);
                } else {
                    update.call(this, true);
                }
            }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _Extent: lively.pt(25.0,25.0),
                _Fill: Color.rgb(204,204,204),
                _Position: lively.pt(261.8,0.0),
                _StyleClassNames: ["Morph","Button"],
                _StyleSheet: ".Image {\n\
            	width: 0px !important;\n\
            	height: 0px !important;\n\
            }",
                className: "lively.morphic.Button",
                droppingEnabled: false,
                grabbingEnabled: false,
                highlightRectangle: {
                    isMorphRef: true,
                    name: "HighlightRectangle"
                },
                isPressed: false,
                name: "CopyStyleButton",
                sourceModule: "lively.morphic.Widgets",
                style: {
                    borderColor: Color.rgb(189,190,192),
                    borderRadius: 0,
                    borderWidth: 1,
                    enableDropping: false,
                    enableGrabbing: false,
                    label: {
                        align: "center",
                        borderWidth: 0,
                        clipMode: "hidden",
                        emphasize: {
                            textShadow: {
                                color: Color.rgb(255,255,255),
                                offset: lively.pt(0.0,1.0)
                            }
                        },
                        fill: null,
                        fixedHeight: true,
                        fixedWidth: true,
                        fontSize: 10,
                        padding: lively.rect(0,3,0,0),
                        textColor: Color.rgb(0,0,0)
                    },
                    padding: lively.rect(0,3,0,0)
                },
                submorphs: [{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(17.0,17.0),
                    _HandStyle: "default",
                    _PointerEvents: "none",
                    _Position: lively.pt(5.0,4.0),
                    className: "lively.morphic.Image",
                    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds","magnets","_whenLoadedCallbacks"],
                    droppingEnabled: false,
                    eventsAreDisabled: true,
                    eventsAreIgnored: true,
                    name: "MagnifierButtonIcon",
                    sourceModule: "lively.morphic.Widgets",
                    submorphs: [],
                    url: "http://lively-web.org/core/media/halos/copy.svg"
                }],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "onFire", {});
            },
                currentTarget: function currentTarget() {
                return this.get('StyleEditorPane').target;
            },
                getHighlightRectangle: function getHighlightRectangle() {
                // delete this.highlightRectangle
                if (this.highlightRectangle) return this.highlightRectangle;
                var rect = this.highlightRectangle = lively.BuildSpec('HighlightRectangle', {
                    _BorderColor: Global.Color.rgb(204,0,0),
                    _Extent: lively.pt(474.7,129.0),
                    _Fill: Global.Color.rgb(58,0,255),
                    _Opacity: 0.3,
                    className: "lively.morphic.Box",
                    name: "HighlightRectangle",
                    bringToFront: function bringToFront() {
                        this.renderContext().morphNode.style.zIndex= 1000;
                    },
                    connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "onMouseMove", this, "updateOnMove", {});
                    },
                    morphUnderCursor: function morphUnderCursor() {
                        var that = this,
                            world = lively.morphic.World.current();
                        return world.morphsContainingPoint(world.firstHand().getPosition()).detect(
                            function(ea) {
                                return  !ea.isPlaceholder &&
                                        !ea.isHalo &&
                                        (!ea.owner || !ea.owner.isHalo) &&
                                        !ea.areEventsIgnoredOrDisabled() &&
                                        ea.isVisible &&
                                        !(ea === that);
                        });
                    },
                    update: function update(optMorphUnderCursor) {
                        var morphUnderCursor = (optMorphUnderCursor && optMorphUnderCursor.isMorph) ? optMorphUnderCursor : this.morphUnderCursor();
                        if (morphUnderCursor === this.magnifierButton ||
                                this.magnifierButton.submorphs.include(morphUnderCursor)) {
                            Global.morphToHighlight = this.magnifierButton.currentTarget();
                        } else {
                            Global.morphToHighlight = morphUnderCursor;
                        }
            
                        if (Global.morphToHighlight && Global.morphToHighlight.world()) {
                            this.setPosition(Global.morphToHighlight.getPositionInWorld());
                            this.setExtent(Global.morphToHighlight.getExtent());
                        }
                    },
                    updateOnMove: function updateOnMove() {
                        this.update();
                        this.bringToFront();
                    }
                }).createMorph();
                rect.magnifierButton = this;
                Global.connect(rect, "onMouseMove", this.getHighlightRectangle(), "updateOnMove")
                Global.connect(rect, "onMouseUp", this, "removeHighlighting")
                Global.connect(rect, "onMouseUp", this.get('StyleEditorPane'), "copySettingsToTarget",{
                    converter: function () { return this.sourceObj.morphUnderCursor(); }})
                return rect;
            },
                isHighlighting: function isHighlighting() {
                return !!this.targetHighlight;
            },
                isTracking: function isTracking() {
                return !!this.world().firstHand().highlightConnection;
            },
                onFire: function onFire() {
                var hand = lively.morphic.World.current().firstHand(),
                    highlight = this.getHighlightRectangle(),
                    that = this;
                if (this.isTracking()) {
                    this.removeHighlighting();
                } else {
                    this.world().addMorph(highlight);
                    hand.highlightConnection = Global.connect(hand, "_Position", highlight, "update");
                    highlight.bringToFront();
                    if (!this.currentTarget() || !this.currentTarget().world()) {
                        highlight.setExtent(pt(0,0));
                    }
                }
            },
                removeHighlighting: function removeHighlighting() {
                var hand = this.world().firstHand();
            
                if (this.getHighlightRectangle()) {
                    this.getHighlightRectangle().remove();
                }
            
                hand.highlightConnection && hand.highlightConnection.disconnect();
                hand.highlightConnection = null;
            },
                reset: function reset() {
                Global.disconnectAll(this.getHighlightRectangle());
            }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _Extent: lively.pt(26.0,25.0),
                _Fill: Color.rgb(204,204,204),
                _Position: lively.pt(233.6,0.0),
                _StyleClassNames: ["Morph","Button"],
                _StyleSheet: ".Image {\n\
            	width: 0px !important;\n\
            	height: 0px !important;\n\
            }",
                className: "lively.morphic.Button",
                droppingEnabled: false,
                grabbingEnabled: false,
                highlightRectangle: {
                    isMorphRef: true,
                    name: "HighlightRectangle"
                },
                isPressed: false,
                name: "MagnifierButton",
                sourceModule: "lively.morphic.Widgets",
                style: {
                    borderColor: Color.rgb(189,190,192),
                    borderRadius: 0,
                    borderWidth: 1,
                    enableDropping: false,
                    enableGrabbing: false,
                    label: {
                        align: "center",
                        borderWidth: 0,
                        clipMode: "hidden",
                        emphasize: {
                            textShadow: {
                                color: Color.rgb(255,255,255),
                                offset: lively.pt(0.0,1.0)
                            }
                        },
                        fill: null,
                        fixedHeight: true,
                        fixedWidth: true,
                        fontSize: 10,
                        padding: lively.rect(0,3,0,0),
                        textColor: Color.rgb(0,0,0)
                    },
                    padding: lively.rect(0,3,0,0)
                },
                submorphs: [{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(17.0,17.0),
                    _HandStyle: "default",
                    _PointerEvents: "none",
                    _Position: lively.pt(4.0,4.0),
                    className: "lively.morphic.Image",
                    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds","magnets","_whenLoadedCallbacks"],
                    droppingEnabled: false,
                    eventsAreDisabled: true,
                    eventsAreIgnored: true,
                    name: "MagnifierButtonIcon",
                    sourceModule: "lively.morphic.Widgets",
                    submorphs: [],
                    url: "http://lively-web.org/core/media/halos/info.svg"
                }],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "onFire", {});
            },
                currentTarget: function currentTarget() {
                return this.get('StyleEditorPane').target;
            },
                getHighlightRectangle: function getHighlightRectangle() {
                // delete this.highlightRectangle
                if (this.highlightRectangle) return this.highlightRectangle;
                var rect = this.highlightRectangle = lively.BuildSpec('HighlightRectangle', {
                    _BorderColor: Global.Color.rgb(204,0,0),
                    _Extent: lively.pt(474.7,129.0),
                    _Fill: Global.Color.rgb(58,0,255),
                    _Opacity: 0.3,
                    className: "lively.morphic.Box",
                    name: "HighlightRectangle",
                    bringToFront: function bringToFront() {
                        this.renderContext().morphNode.style.zIndex= 1000;
                    },
                    connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "onMouseMove", this, "updateOnMove", {});
                    },
                    morphUnderCursor: function morphUnderCursor() {
                        var that = this,
                            world = lively.morphic.World.current();
                        return world.morphsContainingPoint(world.firstHand().getPosition()).detect(
                            function(ea) {
                                return  !ea.isPlaceholder &&
                                        !ea.isHalo &&
                                        (!ea.owner || !ea.owner.isHalo) &&
                                        !ea.areEventsIgnoredOrDisabled() &&
                                        ea.isVisible &&
                                        !(ea === that);
                        });
                    },
                    update: function update(optMorphUnderCursor) {
                        var morphUnderCursor = (optMorphUnderCursor && optMorphUnderCursor.isMorph) ? optMorphUnderCursor : this.morphUnderCursor();
                        if (morphUnderCursor === this.magnifierButton ||
                                this.magnifierButton.submorphs.include(morphUnderCursor)) {
                            Global.morphToHighlight = this.magnifierButton.currentTarget();
                        } else {
                            Global.morphToHighlight = morphUnderCursor;
                        }
            
                        if (Global.morphToHighlight && Global.morphToHighlight.world()) {
                            this.setPosition(Global.morphToHighlight.getPositionInWorld());
                            this.setExtent(Global.morphToHighlight.getExtent());
                        }
                    },
                    updateOnMove: function updateOnMove() {
                        this.update();
                        this.bringToFront();
                    }
                }).createMorph();
                rect.magnifierButton = this;
                Global.connect(rect, "onMouseMove", this.getHighlightRectangle(), "updateOnMove")
                Global.connect(rect, "onMouseUp", this, "removeHighlighting")
                Global.connect(rect, "onMouseUp", this.get('StyleEditorPane'), "setTarget",{
                    converter: function () { return this.sourceObj.morphUnderCursor(); }})
                return rect;
            },
                isHighlighting: function isHighlighting() {
                return !!this.targetHighlight;
            },
                isTracking: function isTracking() {
                return !!this.world().firstHand().highlightConnection;
            },
                onFire: function onFire() {
                var hand = lively.morphic.World.current().firstHand(),
                    highlight = this.getHighlightRectangle(),
                    that = this;
            
                if (this.isTracking()) {
                    this.removeHighlighting();
                } else {
                    this.world().addMorph(highlight);
                    hand.highlightConnection = Global.connect(hand, "_Position", highlight, "update");
                    highlight.bringToFront();
                    if (!this.currentTarget() || !this.currentTarget().world()) {
                        highlight.setExtent(pt(0,0));
                    }
                }
            },
                onMouseOut: function onMouseOut() {
                if (this.isHighlighting()) {
                    if (!this.isTracking()) {
                        this.targetHighlight.remove();
                    }
                    delete this.targetHighlight;
                }
            },
                onMouseOver: function onMouseOver(evt) {
                var target = this.currentTarget();
                if (target && target.world() && !this.isHighlighting()) {
                    this.getHighlightRectangle().update(target);
                    this.world().addMorph(this.getHighlightRectangle());
                    this.getHighlightRectangle().bringToFront();
                    this.targetHighlight = this.getHighlightRectangle();
                }
            },
                removeHighlighting: function removeHighlighting() {
                var hand = this.world().firstHand();
            
                if (this.getHighlightRectangle()) {
                    this.getHighlightRectangle().remove();
                }
            
                hand.highlightConnection && hand.highlightConnection.disconnect();
                hand.highlightConnection = null;
            },
                reset: function reset() {
                Global.disconnectAll(this.getHighlightRectangle());
            }
            }]
        }],

        activateTabNamed: function activateTabNamed(name) {
          var c = this.getMorphNamed('TabContainer');
          var t = c.tabBar.tabs.detect(function (ea) {
            return ea.getLabel() === name;
          });
          if (t) c.activateTab(t);
        },

        addTextStylerFor: function addTextStylerFor(morph, optLabel) {
        var tabs = this.get("TabContainer").getTabBar().getTabs(),
            textTab = this.get("TabContainer").addTabLabeled(optLabel ? optLabel : 'Text');
        
        textTab.getPane().setExtent(pt(this.get('StyleEditorHeadline').getExtent().x, this.get('TabContainer').tabBar.tabs[0].pane.getExtent().y));
        textTab.submorphs.find(function(ea) { return ea.isButton }).remove();
        textTab.layout = textTab.layout || {};
        textTab.layout.resizeWidth = true;
        textTab.submorphs[0].setAlign('center');
        textTab.addScript(function getInactiveFill() {
            return Global.Color.gray.lighter();
        })
        textTab.setAppearanceStylingMode(true);
        textTab.setBorderStylingMode(true);
        textTab.getPane().setAppearanceStylingMode(true);
        textTab.getPane().setBorderStylingMode(true);
    
        textTab.label.setTextStylingMode(true);
    
        var textAttrEd = lively.BuildSpec('lively.ide.tools.TextAttributeEditor').createMorph();
        textAttrEd.setPosition(pt(0,0));
        textTab.getPane().addMorph(textAttrEd);
    
        textAttrEd.selectTextMorph(morph);
        var scroll = $world.getScroll();
     
        (function() {
        //     this.target.selectAll();
        //     this.target.focus();
            $world.scrollTo(scroll[0], scroll[1])
            
            textTab.getPane().setExtent(tabs.last().getPane().getExtent().addPt(pt(0,1)))
        }).bind(this).delay(0);
    
        this.getMorphNamed("TabContainer").activateTab(textTab);
        this.setTabExtends(true);
        // (function() { this.target.focus(); }).bind(this).delay(0);
    
    },
        adjustForNewBounds: function adjustForNewBounds() {
        $super();
        this.alignTabTexts(this.withAllSubmorphsSelect(function(ea) { return ea.isTab }));
    },
        alignTabTexts: function alignTabTexts(tabs) {
        
    },

        applyStyleConfiguration: function applyStyleConfiguration(spec) {
          // appearance
          this.getMorphNamed('StyleFillColorField').setColor(spec.fill);
          this.getMorphNamed('StyleBorderColorField').setColor(spec.borderColor);
          this.getMorphNamed('Borderdialog')
                  .getMorphNamed('borderWidthSlider').setValue(spec.borderWidth);
          this.getMorphNamed('borderRadiusSlider').setValue(spec.borderRadius);
          this.getMorphNamed('opacitySlider').setValue(spec.opacity);
          this.getMorphNamed('borderStyleList').setSelection(spec.borderStyle);
          this.getMorphNamed('ClipModeList').setSelection(spec.clipMode);
          this.setAppearanceMode(!spec.appearanceStyling);
          this.setBorderMode(!spec.borderStyling);
          this.getMorphNamed("AppearanceCheckBox").setChecked(!spec.appearanceStyling);
          this.getMorphNamed("BorderCheckBox").setChecked(!spec.borderStyling);
          this.getMorphNamed('HandStyleList').setSelectionMatching(spec.handStyle || 'auto');
          this.getMorphNamed('ToolTipInput').setTextString(spec.toolTip || "");
          // CSS
          if (!this.target || (this.target.getStyleSheet && this.target.getStyleClassNames)) {
              this.getMorphNamed("CSSCodePane").textString = spec.styleSheet || this.styleSheetTemplate(spec.styleClassNames);
              this.getMorphNamed("ClassEdit").textString = spec.styleClassNames.join(" ");
              this.getMorphNamed('CSSApplyButton').onFire();
          }
          // layout
          this.layoutProps.each(function(attr) {
      		var checkBox = this.getMorphNamed(attr + 'CheckBox');
      		checkBox.setChecked(spec[attr]);
          }, this)
          // misc
          this.getMorphNamed("AppearanceCheckBox").setChecked(!spec.appearanceStyling);
          this.getMorphNamed("BorderCheckBox").setChecked(!spec.borderStyling);
          // TODO: check if it can have css!
          this.getMorphNamed("CSSCodePane").setTextString(spec.styleSheet);
          this.getMorphNamed("ClassEdit").setTextString(spec.styleClassNames.join(" "));
          // text
          if (this.getMorphNamed('TextAttributePanel')) {
              this.getMorphNamed('TextAttributePanel').applyTextStyle(spec);
          }
          // layouter
          if (spec.layouter) {
              this.target.setLayouter(spec.layouter);
          }
          this.getMorphNamed('layouterList').setSelection(spec.layouter ? spec.layouter.displayName : "none");
          if (spec.layouter) {
              this.target.getLayouter().setBorderSize(spec.borderSize);
              this.target.getLayouter().setSpacing(spec.spacing);
          }
          if (spec.customStyleProperties && Global.Properties.own(spec.customStyleProperties).length) {
              this.createCustomStylePane(spec.customStyleProperties);
              this.get('Custom - Pane').get('CustomDialog').submorphs.each(function(panel) {
                  panel.submorphs.each(function(ea) { ea.savedTextString =  ea.getTextString()})
              })
          }
      },
        collectCustomstyleProperties: function collectCustomstyleProperties() {
        var pane = this.get('Custom - Pane'),
            spec = {};
        pane && pane.get('CustomDialog').submorphs.each(function(ea) {
            if (ea.isPanel) {
                var prop = ea.get('customLabel').getTextString();
                try {
                    spec[prop] = eval(ea.get('customInput').getTextString())
                } catch (err) {
                    spec[prop] = ea.get('customInput').getTextString()
                }
            }
        })
        return spec
    },
        copySettingsToTarget: function copySettingsToTarget(morph) {
          var spec = this.getStyleConfiguration();
          this.setTarget(morph);
          if (this.target && spec.fontFamily) {
              this.target.setFontFamily(spec.fontFamily);
          }
          this.applyStyleConfiguration(spec);
        },

        createCustomStylePane: function createCustomStylePane(customs) {
        var container = this.get('TabContainer');
        var tab = container.tabBar.addTabLabeled('Custom');
        var pane = tab.getPane();
        pane.setExtent(this.get('View - Pane').getExtent());
        tab.setAppearanceStylingMode(true)
        tab.setBorderStylingMode(true)
        pane.setAppearanceStylingMode(true)
        pane.setBorderStylingMode(true)
        tab.submorphs[0].setTextStylingMode(true)
        tab.submorphs.each(function(ea) {
            if (ea instanceof lively.morphic.Button) {
                ea.remove()
            }
        })
        container.tabBar.getMorphNamed('CreateCustomStyleButton').remove();
        container.setExtent(container.getExtent());
        container.tabBar.setExtent(container.tabBar.getExtent());
        pane.setLayouter(new lively.morphic.Layout.VerticalLayout(pane))
        pane.getLayouter().setBorderSize(14.285);
        pane.getLayouter().setSpacing(0);
        pane.addScript(function setClipMode() {
            $super('scroll');
        })
        var headline = pane.addMorph(this.createHeadline());
        var dialog = pane.addMorph(this.createDialog());
        var button = dialog.submorphs[0];
        if (customs && Global.Properties.own(customs).length > 0) {
            Global.Properties.own(customs).each(function(customName) {
                var panel = button.createNewPanel();
                panel.get('customLabel').setTextString(customName);
                panel.get('customInput').setTextString(String(customs[customName]));
            })        
        } else {
            button.doAction();
        }
        this.get('TabContainer').tabBar.setExtent(pt(this.get('StyleEditorHeadline').getExtent().x, this.get('TabContainer').tabBar.getExtent().y))
    },

        createDialog: function createDialog() {
        return lively.BuildSpec({
            _BorderColor: Global.Color.rgb(95,94,95),
            _Extent: lively.pt(259.4,71.0),
            _Position: lively.pt(14.3,41.3),
            _Visible: true,
            className: "lively.morphic.Box",
            droppingEnabled: true,
            layout: {
                borderSize: 12,
                extentWithoutPlaceholder: lively.pt(256.4,70.0),
                resizeHeight: true,
                resizeWidth: true,
                spacing: 4,
                type: "lively.morphic.Layout.VerticalLayout"
            },
            name: "CustomDialog",
            sourceModule: "lively.morphic.Core",
            submorphs: [lively.BuildSpec({
        _BorderColor: Global.Color.rgb(189,190,192),
        _BorderRadius: 5,
        _Extent: lively.pt(20.0,20.0),
        _Position: lively.pt(12.0,38.0),
        _StyleClassNames: ["Morph","Button"],
        className: "lively.morphic.Button",
        droppingEnabled: false,
        grabbingEnabled: false,
        isPressed: false,
        label: "+",
        name: "Button2",
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
            this.createNewPanel()
        },
        createNewPanel: function() {
            var panel = this.owner.addMorph(this.get('StyleEditorPane').createPanel());
            Global.connect(panel.getMorphNamed('customInput'), 'savedTextString', this.get('StyleEditorPane'), 'setTargetStyle', {converter: function() {
                var spec = {},
                    value, 
                    attr = this.sourceObj.owner.getMorphNamed('customLabel').getTextString();
                try {
                    value = eval(this.sourceObj.owner.getMorphNamed('customInput').getTextString())
                } catch (error) {
                    value = this.sourceObj.owner.getMorphNamed('customInput').getTextString()
                }
                spec[attr] = value
                return spec
            }})
            Global.connect(panel.getMorphNamed('customLabel'), 'savedTextString', this.get('StyleEditorPane'), 'updateCustomStylesOnTarget')
            Global.connect(panel, 'remove', this.get('StyleEditorPane'), 'updateCustomStylesOnTarget')
            this.owner.addMorph(this);
            return panel
        },
        onFromBuildSpecCreated: function() {
            this.setBorderStylingMode(true);
            this.setAppearanceStylingMode(true);
        },
    })]
        }).createMorph();
    },

        createHeadline: function createHeadline() {
        return lively.BuildSpec({
        _Extent: lively.pt(257.4,29.0),
        _Fill: Global.Color.rgba(0,0,204,0),
        _Position: lively.pt(14.3,274.3),
        _StyleClassNames: ["Morph","Box","Headline"],
        _StyleSheet: "/*\n\
    .Morph{\n\
       border-color: red;\n\
       background-color: gray;\n\
       border-width: 2px;\n\
    }\n\
    */",
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            borderSize: 0,
            resizeHeight: false,
            resizeWidth: true,
            spacing: 0,
            type: "lively.morphic.Layout.HorizontalLayout"
        },
        name: "Rectangle13",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _Extent: lively.pt(257.4,29.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 11,
            _FontWeight: "bold",
            _HandStyle: null,
            _InputAllowed: true,
            _IsSelectable: true,
            _MaxTextWidth: 120.695652,
            _MinTextWidth: 120.695652,
            _Padding: lively.rect(0,5,0,0),
            _StyleClassNames: ["Morph","Text","Headline"],
            _TextColor: Global.Color.rgb(64,64,64),
            _TextStylingMode: true,
            allowInput: true,
            className: "lively.morphic.Text",
            droppingEnabled: false,
            emphasis: [[0,17,{
                color: null,
                fontFamily: null,
                fontSize: null,
                fontWeight: "normal",
                textDecoration: "inherit"
            }]],
            fixedWidth: true,
            grabbingEnabled: false,
            isHeadline: true,
            layout: {
                resizeWidth: true
            },
            name: "Text5",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "Custom properties"
        }],
        retrieveStyle: function () {
                var spec = {};
                (this.customStyleProperties || []).each(function(attr) { 
                    try {
                        spec[attr] = this['get'+attr.slice(0,1).toUpperCase() + attr.slice(1)]();
                    } catch (err) {
                        alert('could not read property ' + attr);
                    }
                }, this)
                return spec;
            }
        }).createMorph();
    },

        createPanel: function createPanel() {
        // model
        var target = this.get('StyleEditorPane').target;
        if (target) {
            target.customStyleProperties = target.customStyleProperties || [];
            target.retrieveStyle = target.retrieveStyle || this.getRetrieveStyleFunction();
        }
        // view
        return lively.BuildSpec({
            _Extent: lively.pt(226.0,22.0),
            _Fill: Global.Color.rgb(255,255,255),
            _Position: lively.pt(319.5,1007.7),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "CustomPanel",
            isPanel: true,
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(113.0,22.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: true,
                _IsSelectable: true,
                halosEnabled: false,
                _TextColor: Global.Color.rgb(64,64,64),
                _TextStylingMode: true,
                _WordBreak: "break-all",
                allowInput: true,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,8,{
                    color: null,
                    fontFamily: null,
                    fontSize: null,
                    fontWeight: "normal",
                    textDecoration: "inherit"
                }]],
                eventsAreIgnored: false,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                lastDragTime: 1315407805804,
                name: 'customLabel',
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "Custom property:"
            },{
                _Extent: lively.pt(124.0,20.0),
                _Fill: Global.Color.rgb(255,255,255),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: null,
                _InputAllowed: true,
                _IsSelectable: true,
                halosEnabled: false,
                _Position: lively.pt(111.0,0.0),
                _TextColor: Global.Color.rgb(64,64,64),
                _TextStylingMode: true,
                allowInput: true,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,20,{
                    color: null,
                    fontFamily: null,
                    fontSize: null,
                    fontWeight: "normal"
                }]],
                fixedHeight: true,
                grabbingEnabled: false,
                isInputLine: true,
                name: "customInput",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "pt(0,0)",
                connectionRebuilder: function connectionRebuilder() {
            },
            }]
        }).createMorph();
    },
        defaultStyleConfiguration: function defaultStyleConfiguration() {
        return {
            fill: Global.Color.white,
            borderColor: Global.Color.black,
            borderWidth: 1,
            borderRadius: 0,
            opacity: 1,
            borderStyle: 'solid',
            clipMode: 'visible',
            // misc
            appearanceStyling: false,
            borderStyling: false,
            styleSheet: "",
            styleClassNames: [],
            layouter: null,
            handStyle: 'auto',
            toolTip: '',
            // layout
            adjustForNewBounds: false,
            resizeWidth: false,
            resizeHeight: false,
            moveVertical: false,
            moveHorizontal: false,
            centeredHorizontal: false,
            centeredVertical: false,
            scaleHorizontal: false,
            scaleVertical: false,
            fontFamily: "Arial, sans-serif",
            fontSize: 12,
            fontWeight: "normal",
            textDecoration: "none",
            textColor: Global.Color.black,
            fixedWidth: true,
            fixedHeight: false,
            padding: lively.rect(4,2,0,0),
            styleSheet: this.styleSheetTemplate()
        }
    },
        getRetrieveStyleFunction: function getRetrieveStyleFunction() {
        return function() {
            var spec = {};
            (this.customStyleProperties || []).each(function(attr) { 
                try {
                    spec[attr] = this['get'+attr.slice(0,1).toUpperCase() + attr.slice(1)]();
                } catch (err) {
                    alert('could not read property ' + attr);
                }
            }, this)
            return spec;
        }
    },
        getStyleConfiguration: function getStyleConfiguration() {
        //TODO: extensions like button etc. (this is the generalization for style editor, yay!)
        // TODO: Include position etc.
        // general style
        var style = {
            fill: this.getMorphNamed('StyleFillColorField').color,
            borderColor: this.getMorphNamed('StyleBorderColorField').color,
            borderWidth: this.getMorphNamed('Borderdialog')
                .getMorphNamed('borderWidthSlider').value,
            borderRadius: this.getMorphNamed('borderRadiusSlider').value,
            opacity: this.getMorphNamed('opacitySlider').value,
            borderStyle: this.getMorphNamed('borderStyleList').selection,
            clipMode: this.getMorphNamed('ClipModeList').selection,
            toolTip: this.getMorphNamed('ToolTipInput').savedTextString,
            handStyle: this.getMorphNamed('HandStyleList').selection
        }
    	// layout
        this.layoutProps.each(function(attr) {
    		var checkBox = this.getMorphNamed(attr + 'CheckBox');
    		if (checkBox.checked) {
    		    style[attr] = true;
    		}
        }, this)
        //text
        var textStyle = {};
        if (this.getMorphNamed('TextAttributePanel')) {
            textStyle = this.getMorphNamed('TextAttributePanel').getTargetMorphsTextStyle()
        }
        // misc
        var nonApplicableStyle = {
            appearanceStyling: !this.getMorphNamed("AppearanceCheckBox").checked,
            borderStyling: !this.getMorphNamed("BorderCheckBox").checked,
            // TODO: check if can get css!
            styleSheet:  this.getMorphNamed("CSSCodePane").textString,
            styleClassNames: this.getMorphNamed("ClassEdit").textString.split(" "),
        }
        // layouter
        if (this.getMorphNamed('layouterList').selection) {
            nonApplicableStyle['layouter'] = eval(this.getMorphNamed('layouterList').selection);
            nonApplicableStyle['borderSize'] = this.getMorphNamed('LayoutConfigurator')
                    .getMorphNamed('borderWidthSlider').value;
            nonApplicableStyle['spacing'] = this.getMorphNamed('spacingSlider').value;
        }
        // custom
        var customPane = this.getMorphNamed('Custom - Pane');
        if (this.getMorphNamed('Custom - Pane')) {
            nonApplicableStyle['customStyleProperties'] = this.collectCustomstyleProperties();
        }
        return Object.merge([style, textStyle, nonApplicableStyle])
    },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        // fix buttons
        ['TargetName', 'MagnifierButton', 'CopyStyleButton', 'CreateCustomStyleButton', 'CSSApplyButton', 'StyleFillColorField', 'StyleBorderColorField'].each(function(buttonName) {
            var button = this.get(buttonName);
            button.setBorderWidth(0)
            button.setBorderRadius(0)
        }.bind(this))
        this.get('TabContainer').tabBar.adjustTabExtends.bind(this.get('TabContainer').tabBar).delay();
        (function () {
                this.get('TabContainer').tabBar.tabs.pluck('submorphs').pluck(0).invoke('setFontSize', 11)
            }.bind(this)).delay();
        var targetNameLabel = this.get('TargetName').submorphs[0]
        targetNameLabel.setTextStylingMode(false)
        targetNameLabel.setFontSize(12)
        targetNameLabel.setFontWeight('bold')
        // [this.get('OpacitySliderVisualizer'), this.get('WidthSliderVisualizer'), this.get('RadiusSliderVisualizer'), this.get('ToolTipInput'), this.get('ClassEdit')].inkove('beInputLine')
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        var ed = this.getMorphNamed('TabContainer').activePane().submorphs.detect(function(ea) { return ea.isCodeEditor; });
        ed && ed.focus();
    },
        openLayoutConfigurator: function openLayoutConfigurator(selection) {
        this.getMorphNamed('LayouterContentPane').submorphs.select(function(ea) {
            return ea.isConfigurator
        }).invoke('remove');
        if (selection) {
            if (!this.target || !this.target.getLayouter()) {
                alert('no layout selected');
                return;
            }
            lively.PartsBin.getPart('LayoutConfigurator', 'PartsBin/Layout',
                function (sth, aPart) {
                    var configurator = aPart.targetMorph;
                    this.getMorphNamed('LayouterContentPane').addMorph(configurator);
                    configurator.addScript(function setTargetName(name) {
                        // deleting that
                    });
                    if (configurator.getLayouter()) {
                        configurator.getLayouter().setBorderSize(0)
                    }
                    configurator.setTarget(this.target.getLayouter());
                    configurator.isConfigurator = true;
                }.bind(this))
        }
    },
        removeLeftoverTabs: function removeLeftoverTabs() {
        this.get('TabContainer').tabBar.submorphs.select(function(ea) {
            return ea.isTab && 
                ea.name === 'Label' || ea.name === 'Text' || ea.name === 'Custom'
        }).invoke('closeTab')
        this.getMorphNamed('TabContainer').tabBar.addMorph(this.customStyleButton);
    },
        reset: function reset() {
          this.removeLeftoverTabs()
          this.resetTarget()
        	this.getMorphNamed('borderWidthSlider').valueScale = 20;
        	this.getMorphNamed('borderRadiusSlider').valueScale = 50;
          this.getMorphNamed('TargetName').setLabel('no target chosen')
          this.layoutProps = ['adjustForNewBounds', 'resizeWidth', 'resizeHeight', 'moveVertical', 'moveHorizontal', 'centeredHorizontal', 'centeredVertical', 'scaleHorizontal', 'scaleVertical'];
          this.applyStyleConfiguration(this.defaultStyleConfiguration());
          this.getMorphNamed('TabContainer').activateTab(this.getMorphNamed('TabContainer').tabBar.tabs[0]);
          this.owner.setExtent(this.getMinExtent());
          this.setTabExtends();
        },
        resetTarget: function resetTarget() {
        	this.target = undefined;
        },
        setAppearanceMode: function setAppearanceMode(override) {
        //alert("SetAppearance!");
        var direct = [
            "FillColorDialog",
            "FillOpacityDialog"
        ];
        var css =[
            "StyleEditorFillMsg"
        ];
    
        if (override){
            this.setMorphsVisibility(direct, css);
            this.setMorphsOpacity(direct, []);
        }
        else {
            this.setMorphsVisibility(css, []);
            this.setMorphsOpacity([], direct);
        }
    
        if (this.target) {
            if (this.target.setAppearanceStylingMode) {
                this.target.setAppearanceStylingMode(!override);
            }
        }
    
    },
        setBorderMode: function setBorderMode(override) {
        var direct =[
            "BorderColorDialog",
            "BoderWidthDialog",
            "BorderRadiusDialog",
            "BorderStyleDialog"];
        var css =["StyleEditorBorderMsg"];
    
        this.setMorphsVisibility(override ? direct : css, override ? css: []);
        this.setMorphsOpacity(override ? direct : [], override ? []: direct);
        if (this.target) {
            if (this.target.setBorderStylingMode) {
                this.target.setBorderStylingMode(!override);
            }
        }
    
    },
        setLayouterOnTargetMorph: function setLayouterOnTargetMorph(layoutClassName) {
        if (layoutClassName && layoutClassName !== 'none')
            var newLayoutClass = lively.Class.forName(layoutClassName);
    
        if (!this.target) return;
    
        var currentLayoutClass = this.target.getLayouter() &&
            lively.Class.getConstructor(this.target.getLayouter());
    
        if (currentLayoutClass === newLayoutClass) return;
    
        this.target.setLayouter(newLayoutClass && new newLayoutClass(this.target));
        this.target.applyLayout();
    },
        setMorphsOpacity: function setMorphsOpacity(show, hide) {
        show.each(function(morph){
            if (morph.isMorph) {
                morph.setOpacity(1);
                morph.enableEvents();
            }
            else {
                var theMorph = this.getMorphNamed('View - Pane')
                        .getMorphNamed(morph);
                if (theMorph) {
                    // theMorph.setOpacity(1);
                    theMorph.setOpacity(1);
                    theMorph.enableEvents();
                }
            }
        }, this);
        hide.each(function(morph){
            if (morph.isMorph) {
                morph.setOpacity(0.1);
                morph.disableEvents();
            }
            else {
                var theMorph = this.getMorphNamed('View - Pane')
                        .getMorphNamed(morph);
                if (theMorph) {
                    theMorph.setOpacity(0.1);
                    theMorph.disableEvents();
                }
            }
        }, this);
    },
        setMorphsVisibility: function setMorphsVisibility(show, hide) {
        show.each(function(morph){
            if (morph.isMorph) {
                morph.setVisible(true);
            }
            else {
                var theMorph = this.getMorphNamed('View - Pane')
                        .getMorphNamed(morph);
                if (theMorph) {
                    theMorph.setVisible(true);
                }
            }
        }, this);
        hide.each(function(morph){
            if (morph.isMorph) {
                morph.setVisible(false);
            }
            else {
                var theMorph = this.getMorphNamed('View - Pane')
                        .getMorphNamed(morph);
                if (theMorph) {
                    theMorph.setVisible(false);
                }
            }
        }, this);
    
    },
        setTabExtends: function setTabExtends(isText) {
        var bar = this.getMorphNamed("TabContainer").getTabBar()
        bar.setExtent(pt(this.get('StyleEditorHeadline').getExtent().x,bar.getExtent().y))
        bar.adjustTabExtends();
        this.alignTabTexts(bar.tabs);
    },
        setTarget: function setTarget(morph, optCopy) {
          if (this.dontUpdate || !morph) return;
          delete this.target;
          
          this.getMorphNamed('TargetName').setLabel(morph.getName() || morph.toString());
          this.removeLeftoverTabs()
          if (morph instanceof lively.morphic.Text) {
              this.addTextStylerFor(morph);
          } else if ((morph instanceof lively.morphic.Button) && morph.label) {
              this.addTextStylerFor(morph.label, 'Label');
          } else {
              this.setTabExtends();
          }
          
          this.getMorphNamed('TabContainer').tabBar.adjustTabExtends();
      
          var spec = {
              fill: morph.getFill(),
              borderColor: morph.getBorderColor(),
              borderWidth: morph.getBorderWidth(),
              borderRadius: morph.getBorderRadius(),
              opacity: morph.getOpacity(),
              borderStyle: morph.getBorderStyle(),
              clipMode: morph.getClipMode(),
              appearanceStylingMode: morph.getAppearanceStylingMode(),
              borderStylingMode: !morph.getBorderStylingMode(),
              handStyle: morph.getHandStyle(),
              toolTip: morph.getToolTip()
          }

          if (morph.getStyleSheet && morph.getStyleClassNames) {
              // check if style sheet module is loaded
              morph.getStyleSheet() && (spec.styleSheet = morph.getStyleSheet());
              morph.getStyleClassNames() && (spec.styleClassNames = morph.getStyleClassNames());
          }

        	if (morph.layout) {
              this.layoutProps.forEach(function(attr) {
                  spec[attr] = morph.layout[attr]
      	    });
          }

          if (morph.customStyleProperties) {
              if (!(morph.retrieveStyle instanceof Function)) {
                  morph.retrieveStyle = this.getRetrieveStyleFunction();
              }
              spec.customStyleProperties = morph.retrieveStyle();
          }

          if (morph instanceof lively.morphic.Text) {
              spec = Object.merge([spec, this.get('TextAttributePanel').getTargetMorphsTextStyle()]);
          }

          lively.bindings.noUpdate({sourceAttribute: "savedTextString", sourceObj: this.get("CSSCodePane")}, function() {
            this.applyStyleConfiguration(Object.merge([this.defaultStyleConfiguration(), spec]));
          }.bind(this));
        	this.target = morph;
          // layout, has to be done later because loaded from PartsBin
          var layouter = morph.getLayouter();
          this.getMorphNamed('layouterList').setSelection(layouter && layouter.constructor.type);
          this.activateTabNamed("View");
      },

        setTargetStyle: function setTargetStyle(style) {
        	// alert(JSON.stringify(style))
        	if (this.target) this.target.applyStyle(style)
        },
        setupConnections: function setupConnections() {
        // newShowMorph(this.getMorphNamed('borderWidthSlider'))
        // this.get('borderWidthSlider').attributeConnections
        // disconnectAll(this.get('borderWidthSlider'))
        //
        // newShowMorph(this.get('borderRadiusSlider'))
        // this.get('borderRadiusSlider').attributeConnections
        // disconnectAll(this.get('borderRadiusSlider'))
    
        	lively.bindings.connect(this.getMorphNamed('borderWidthSlider'), 'value',
        	this, "setTargetStyle", {
        		converter: function(v) { return {borderWidth: v} }});
    
        	lively.bindings.connect(this.getMorphNamed('borderRadiusSlider'), 'value',
        		this, "setTargetStyle", {
        		converter: function(v) { return {borderRadius: v} }});
    
        	lively.bindings.connect(this.getMorphNamed('opacitySlider'), 'value',
        		this, "setTargetStyle", {
        		converter: function(v) { return {opacity: v} }});
    
        	lively.bindings.connect(this.getMorphNamed('borderStyleList'), 'selection',
        		this, "setTargetStyle", {
        		converter: function(v) { return {borderStyle: v} }});
    
        	lively.bindings.connect(this.getMorphNamed('ClipModeList'), 'selection',
        		this, "setTargetStyle", {
        		converter: function(v) { return {clipMode: v} }});
    
                lively.bindings.connect(this.getMorphNamed('layouterList'), 'selection', this, 'setLayouter')
    
                this.layoutProps.forEach(function(attr) {
                	var checkBox = this.getMorphNamed(attr + 'CheckBox');
                	checkBox.layoutProperty = attr;
                	Global.connect(checkBox, 'checked', this,
                	"setTargetStyle", { converter:
                	function(bool) {
                		var style = {},
                			prop = this.sourceObj.layoutProperty;
                		style[prop] = bool;
                		return style
                	}})
                }, this);
    
        },
        styleSheetTemplate: function styleSheetTemplate(styleClassNames) {
        return '/*\n.' + ((styleClassNames || []).last() || 'Morph') + '{\n   border-color: red;\n   background-color: gray;\n   border-width: 2px;\n}\n*/'
    },
        updateCustomStylesOnTarget: function updateCustomStylesOnTarget() {
        var tabPane = this.getMorphNamed('Custom - Pane')
        if (this.target && tabPane) {
            this.target.customStyleProperties = tabPane.withAllSubmorphsSelect(function(ea) {
                return ea.isPanel
            }).collect(function(ea) { return ea.get('customLabel').getTextString() });
        }
    }
    }],
    titleBar: "StyleEditorPane",
    withoutLayers: "[GrabbingLayer]",
    setTarget: function setTarget(target) {
    this.get('StyleEditorPane').setTarget(target);
}
})

lively.BuildSpec("lively.ide.tools.TextAttributeEditor", {
    _Extent: lively.pt(279.5,566.4),
    _Fill: Color.rgb(255,255,255),
    _Position: lively.pt(353.7,1492.0),
    _StyleClassNames: ["Morph","Box"],
    _StyleSheet: ".Box {\n\
	border-width: 0px;\n\
}\n\
\n\
.Slider, .SliderKnob {\n\
	border-width: 1px;\n\
}\n\
\n\
.Headline {\n\
	border-width: 0px 0px 1px 0px !important;\n\
	border-color: gray !important;\n\
}\n\
\n\
.Headline .Text {\n\
	font-size: 13pt;\n\
}\n\
\n\
.CheckBoxHover span {\n\
	color: rgb(0,101,204) !important;\n\
}\n\
\n\
.DropDownList {\n\
	background: none;\n\
	border: none;\n\
}\n\
\n\
.Text {\n\
	font-size: 11pt;\n\
	color: rgb(64,64,64);\n\
	font-family: Arial;\n\
}\n\
\n\
.Button {\n\
	background-color: rgb(204,204,204) !important;\n\
	border-radius: 0px;\n\
	border-width: 0px;\n\
}\n\
\n\
.Button .Text {\n\
	font-size: 10pt;\n\
}\n\
\n\
.Button .Text span {\n\
	padding: 1px 0px 0px 0px;\n\
}\n\
\n\
.Input {\n\
	padding: 0px 0px 0px 0px;\n\
	text-align: center;\n\
}",
    className: "lively.morphic.Box",
    doNotSerialize: ["layer","withoutLayers","targetMorph"],
    draggingEnabled: false,
    droppingEnabled: true,
    grabbingEnabled: false,
    isCopyMorphRef: true,
    layout: {
        adjustForNewBounds: false,
        borderSize: 14.985000000000001,
        extentWithoutPlaceholder: lively.pt(303.7,408.2),
        resizeHeight: true,
        resizeWidth: true,
        spacing: 0,
        type: "lively.morphic.Layout.VerticalLayout"
    },
    morphRefId: 1,
    name: "TextAttributePanel",
    selectedFont: null,
    sourceModule: "lively.morphic.Core",
    submorphs: [{
        _Extent: lively.pt(249.5,29.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(15.0,15.0),
        _StyleClassNames: ["Morph","Box","Headline"],
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            borderSize: 0,
            extentWithoutPlaceholder: lively.pt(260.0,27.0),
            resizeHeight: false,
            resizeWidth: true,
            spacing: 15,
            type: "lively.morphic.Layout.HorizontalLayout"
        },
        name: "Rectangle14",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _Align: "left",
            _ClipMode: "hidden",
            _Display: "inline",
            _Extent: lively.pt(212.5,29.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 11,
            _FontStyle: "normal",
            _FontWeight: "bold",
            _HandStyle: "default",
            _InputAllowed: false,
            _IsSelectable: true,
            _LineHeight: 1,
            _Padding: lively.rect(0,5,0,0),
            _PointerEvents: "none",
            _StyleClassNames: ["Morph","Text"],
            _TextColor: Color.rgb(64,64,64),
            _TextDecoration: "none",
            _TextStylingMode: false,
            _VerticalAlign: "top",
            allowInput: false,
            className: "lively.morphic.Text",
            emphasis: [[0,8,{
                backgroundColor: Color.rgba(255,255,255,0),
                color: Color.rgb(64,64,64),
                fontFamily: "Arial, sans-serif",
                fontSize: 11,
                fontWeight: "bold",
                italics: "normal",
                textDecoration: "none"
            }]],
            eventsAreDisabled: true,
            eventsAreIgnored: true,
            fixedHeight: true,
            fixedWidth: true,
            isLabel: true,
            layout: {
                resizeWidth: true
            },
            name: "EmphasisLabel",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "Emphasis"
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(22.0,22.0),
            _Position: lively.pt(227.5,0.0),
            _Visible: true,
            active: true,
            checked: true,
            className: "lively.morphic.CheckBox",
            droppingEnabled: true,
            name: "TextCheckBox",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "updateStyle", {converter: 
        function (bool) {
                        return {cssStylingMode: !bool}
                    }});
            lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "hideOrShowCSSProperties", {});
        },
            onMouseOut: function onMouseOut() {
                    this.get('EmphasisLabel').removeStyleClassName('CheckBoxHover')
                },
            onMouseOver: function onMouseOver() {
                    this.get('EmphasisLabel').addStyleClassName('CheckBoxHover')
                }
        }]
    },{
        _Extent: lively.pt(249.5,184.7),
        _Fill: Color.rgba(0,0,204,0),
        _Position: lively.pt(15.0,44.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            adjustForNewBounds: false,
            borderSize: 15.55,
            extentWithoutPlaceholder: lively.pt(462.0,222.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 2.265,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        name: "EmphasisPane",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _Extent: lively.pt(218.4,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.6,15.6),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(112.3,29.3),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "FontColorPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _Align: "left",
                _ClipMode: "hidden",
                _Display: "inline",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _FontStyle: "normal",
                _FontWeight: "normal",
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _LineHeight: 1,
                _StyleClassNames: ["Morph","Text"],
                _StyleSheet: ".Text {\n\
            	font-size: none;\n\
            }",
                _TextColor: Color.rgb(64,64,64),
                _TextDecoration: "none",
                _TextStylingMode: false,
                _VerticalAlign: "top",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,11,{
                    backgroundColor: Color.rgba(255,255,255,0),
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: "none"
                }]],
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "fontColorLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "font color:"
            },{
                _BorderColor: Color.rgb(189,190,192),
                _Extent: lively.pt(16.0,16.0),
                _Fill: Color.rgb(0,0,0),
                _Position: lively.pt(110.0,0.0),
                _StyleClassNames: ["Morph","Button","SimpleColorField","AwesomeColorField"],
                _Visible: true,
                className: "lively.morphic.AwesomeColorField",
                color: Color.rgb(0,0,0),
                colorDisplay: {
                    isMorphRef: true,
                    path: "submorphs.0"
                },
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                layout: {
                    adjustForNewBounds: true
                },
                name: "FontColorField",
                sourceModule: "lively.morphic.ColorChooserDraft",
                submorphs: [{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Fill: Color.rgb(0,0,0),
                    _Position: lively.pt(2.0,2.0),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    grabbingEnabled: false,
                    halosEnabled: false,
                    layout: {
                        resizeHeight: true,
                        resizeWidth: true
                    },
                    sourceModule: "lively.morphic.Core",
                    submorphs: []
                }],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "color", this.get("TextAttributePanel"), "updateEmphasis", {converter: 
            function (color) {
                                return { color: color }
                            }});
            },
                onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                                        this.setAppearanceStylingMode(true)
                                        this.setBorderStylingMode(true)
                                    },
                onMouseOut: function onMouseOut() {
                this.get('fontColorLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('fontColorLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(218.4,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.6,37.8),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(233.8,37.8),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "FontBackgroundColorPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,11,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "fontBackgroundLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "background:"
            },{
                _BorderColor: Color.rgb(189,190,192),
                _Extent: lively.pt(16.0,16.0),
                _Position: lively.pt(110.0,0.0),
                _StyleClassNames: ["Morph","Button","SimpleColorField","AwesomeColorField"],
                _Visible: true,
                className: "lively.morphic.AwesomeColorField",
                color: Color.rgba(255,255,255,0),
                colorDisplay: {
                    isMorphRef: true,
                    path: "submorphs.0"
                },
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                layout: {
                    adjustForNewBounds: true
                },
                name: "BackgroundColorField",
                sourceModule: "lively.morphic.ColorChooserDraft",
                submorphs: [{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Fill: Color.rgba(255,255,255,0),
                    _Position: lively.pt(2.0,2.0),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    grabbingEnabled: false,
                    halosEnabled: false,
                    layout: {
                        resizeHeight: true,
                        resizeWidth: true
                    },
                    sourceModule: "lively.morphic.Core",
                    submorphs: []
                }],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "color", this.get("TextAttributePanel"), "updateEmphasis", {converter: 
            function (color) {
                                return { backgroundColor: color }
                            }});
            },
                onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                                        this.setAppearanceStylingMode(true)
                                        this.setBorderStylingMode(true)
                                    },
                onMouseOut: function onMouseOut() {
                this.get('fontBackgroundLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('fontBackgroundLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(218.4,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.6,60.1),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(261.0,27.0),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "WeightPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,7,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "fontWeightLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "weight:"
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(108.4,20.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(110.0,0.0),
                changeTriggered: true,
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                grabbingEnabled: false,
                itemList: ["normal","bold"],
                layout: {
                    resizeWidth: true
                },
                name: "FontWeightText",
                selectedLineNo: 0,
                selection: "normal",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                textString: "normal",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("TextAttributePanel"), "updateEmphasis", {converter: 
            function (aString) {
                                return { fontWeight: aString }
                            }});
            },
                onMouseOut: function onMouseOut() {
                this.get('fontWeightLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('fontWeightLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(218.4,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.6,82.3),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(261.0,32.0),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "DecorationPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,19.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,11,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "fontDecorationLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "decoration:"
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(108.4,20.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(110.0,0.0),
                changeTriggered: true,
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                grabbingEnabled: false,
                itemList: ["none","underline","line-through","overline","blink"],
                layout: {
                    resizeWidth: true
                },
                name: "FontDecorationText",
                selectedLineNo: 0,
                selection: "none",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                textString: "normal",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("TextAttributePanel"), "updateEmphasis", {converter: 
            function (aString) {
                                return { textDecoration: aString }
                            }});
            },
                onMouseOut: function onMouseOut() {
                this.get('fontDecorationLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('fontDecorationLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(218.4,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.6,104.6),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "FontSizePanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,5,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "fontSizeLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "size:"
            },{
                _BorderColor: Color.rgb(102,102,102),
                _BorderRadius: 6,
                _BorderWidth: 1,
                _Extent: lively.pt(71.4,12.0),
                _Position: lively.pt(110.0,4.0),
                _StyleClassNames: ["Morph","Box","Slider"],
                _Visible: true,
                className: "lively.morphic.Slider",
                droppingEnabled: true,
                layout: {
                    centeredVertical: true,
                    resizeWidth: true
                },
                name: "fontSizeSlider",
                sliderExtent: 0.1,
                sliderKnob: {
                    isMorphRef: true,
                    path: "submorphs.0"
                },
                sourceModule: "lively.morphic.Widgets",
                styleClass: ["slider_background_horizontal"],
                submorphs: [{
                    _BorderColor: Color.rgb(102,102,102),
                    _BorderRadius: 6,
                    _BorderWidth: 1,
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(7.0,0.0),
                    _Visible: true,
                    className: "lively.morphic.SliderKnob",
                    droppingEnabled: true,
                    hitPoint: lively.pt(12.7,3.9),
                    slider: {
                        isMorphRef: true,
                        name: "fontSizeSlider"
                    },
                    sourceModule: "lively.morphic.Widgets",
                    styleClass: ["slider_horizontal"],
                    submorphs: [],
                    onDrag: function onDrag(evt) {
                    $super(evt)
                    evt.stop();
                    return true
                },
                    onMouseMove: function onMouseMove(evt) {
                    $super(evt)
                    evt.stop();
                    return true;
                }
                }],
                value: 0.12,
                valueScale: 1,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
                lively.bindings.connect(this, "value", this.get("FontSizeText"), "setTextString", {converter: 
            function (val) {
                    this.targetObj.savedTextString = Math.round(val*100)
                    return Math.round(val*100)
                }});
            },
                onMouseOut: function onMouseOut() {
                this.get('fontSizeLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('fontSizeLabel').addStyleClassName('CheckBoxHover')
            }
            },{
                _Align: "left",
                _ClipMode: "hidden",
                _Display: "inline",
                _Extent: lively.pt(37.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _FontStyle: "normal",
                _FontWeight: "normal",
                _HandStyle: null,
                _InputAllowed: true,
                _IsSelectable: true,
                _LineHeight: 1,
                _MaxTextWidth: 120,
                _MinTextWidth: 120,
                _Padding: lively.rect(2,1,0,0),
                _Position: lively.pt(181.4,0.0),
                _StyleClassNames: ["Morph","Text","Input"],
                _TextColor: Color.rgb(64,64,64),
                _TextDecoration: "none",
                _TextStylingMode: false,
                _VerticalAlign: "top",
                allowInput: true,
                className: "lively.morphic.Text",
                droppingEnabled: false,
                emphasis: [[0,2,{}]],
                fixedHeight: true,
                grabbingEnabled: false,
                isCopyMorphRef: true,
                isInputLine: true,
                morphRefId: 1,
                name: "FontSizeText",
                selection: 12,
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "12",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "savedTextString", this.get("fontSizeSlider"), "setValue", {converter: 
            function (value) {
                    return parseFloat(value)/100
                }});
                lively.bindings.connect(this, "savedTextString", this.get("TextAttributePanel"), "updateEmphasis", {converter: 
            function (aString) {
                    var val = parseInt(aString);
                    // mainly to sort out 1 during typing
                    val = Math.max(val, 6)
                    return { fontSize: val }
                }});
            },
                onMouseOut: function onMouseOut() {
                this.get('fontSizeLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('fontSizeLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(218.4,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.6,126.9),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "FontFamilyPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,12,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "fontFamilyLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "font family:"
            },{
                _BorderColor: Color.rgb(189,190,192),
                _Extent: lively.pt(108.4,20.0),
                _Position: lively.pt(110.0,0.0),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                draggingEnabled: false,
                droppingEnabled: false,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isPressed: false,
                label: "Arial, sans-serif",
                layout: {
                    resizeWidth: true
                },
                list: [],
                listMorph: null,
                name: "FontChooserButton",
                sourceModule: "lively.morphic.Widgets",
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("TextAttributePanel"), "openFontBook", {});
            },
                onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                            this.setAppearanceStylingMode(true)
                            this.setBorderStylingMode(true)
                        },
                onMouseOut: function onMouseOut() {
                this.get('fontFamilyLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('fontFamilyLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(218.4,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.6,149.1),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(261.0,32.0),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "FontStylePanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,6,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "fontStyleLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "style:"
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(108.4,19.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(110.0,0.0),
                changeTriggered: true,
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                grabbingEnabled: false,
                itemList: ["normal","italic","oblique","initial","inherit"],
                layout: {
                    resizeWidth: true
                },
                name: "FontStyleText",
                selectedLineNo: 0,
                selection: "normal",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                textString: "normal",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("TextAttributePanel"), "updateEmphasis", {converter: 
            function (aString) {
                                return { fontStyle: aString }
                            }});
            },
                onMouseOut: function onMouseOut() {
                this.get('fontStyleLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('fontStyleLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        }]
    },{
        _Extent: lively.pt(249.5,29.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(15.0,228.7),
        _StyleClassNames: ["Morph","Box","Headline"],
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            borderSize: 0,
            extentWithoutPlaceholder: lively.pt(260.0,27.0),
            resizeHeight: false,
            resizeWidth: true,
            spacing: 15,
            type: "lively.morphic.Layout.HorizontalLayout"
        },
        name: "Rectangle15",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _Align: "left",
            _ClipMode: "hidden",
            _Display: "inline",
            _Extent: lively.pt(212.5,29.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 11,
            _FontStyle: "normal",
            _FontWeight: "bold",
            _HandStyle: "default",
            _InputAllowed: false,
            _IsSelectable: true,
            _LineHeight: 1,
            _Padding: lively.rect(0,5,0,0),
            _PointerEvents: "none",
            _StyleClassNames: ["Morph","Text"],
            _TextColor: Color.rgb(64,64,64),
            _TextDecoration: "none",
            _TextStylingMode: false,
            _VerticalAlign: "top",
            allowInput: false,
            className: "lively.morphic.Text",
            emphasis: [[0,4,{
                backgroundColor: Color.rgba(255,255,255,0),
                color: Color.rgb(64,64,64),
                fontFamily: "Arial, sans-serif",
                fontSize: 11,
                fontWeight: "bold",
                italics: "normal",
                textDecoration: "none"
            }]],
            eventsAreDisabled: true,
            eventsAreIgnored: true,
            fixedHeight: true,
            fixedWidth: true,
            isLabel: true,
            layout: {
                resizeWidth: true
            },
            name: "TextHeadlineLabel",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "Text"
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(22.0,22.0),
            _Position: lively.pt(227.5,0.0),
            _Visible: true,
            active: true,
            checked: true,
            className: "lively.morphic.CheckBox",
            droppingEnabled: true,
            name: "TextCheckBox2",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "updateStyle", {converter: 
        function (bool) {
                        return {cssStylingMode: !bool}
                    }});
            lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "hideOrShowCSSProperties", {});
        },
            onMouseOut: function onMouseOut() {
            this.get('TextHeadlineLabel').removeStyleClassName('CheckBoxHover')
        },
            onMouseOver: function onMouseOver() {
            this.get('TextHeadlineLabel').addStyleClassName('CheckBoxHover')
        }
        }]
    },{
        _Extent: lively.pt(249.5,293.8),
        _Fill: Color.rgba(0,0,204,0),
        _Position: lively.pt(15.0,257.7),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            adjustForNewBounds: false,
            borderSize: 14.985000000000001,
            extentWithoutPlaceholder: lively.pt(462.0,253.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 1.9800000000000002,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        name: "PureTextPanel",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.0,15.0),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "FixedWidthPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,12,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                lastDragTime: 1315407805804,
                name: "FixedWidthLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "fixed width:"
            },{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(20.0,20.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(110.0,0.0),
                active: true,
                checked: true,
                className: "lively.morphic.CheckBox",
                draggingEnabled: false,
                droppingEnabled: false,
                grabbingEnabled: false,
                name: "fixedWidthCheckBox",
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (bool) { return {fixedWidth: bool}}});
            },
                onMouseOut: function onMouseOut() {
                this.get('FixedWidthLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('FixedWidthLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.0,37.0),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "FixedHeightPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,13,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                lastDragTime: 1315407805804,
                name: "FixedHeightLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "fixed height:"
            },{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(20.0,20.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(110.0,0.0),
                active: true,
                checked: false,
                className: "lively.morphic.CheckBox",
                draggingEnabled: false,
                droppingEnabled: false,
                grabbingEnabled: false,
                name: "fixedHeightCheckBox",
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (bool) { return {fixedHeight: bool}}});
            },
                onMouseOut: function onMouseOut() {
                this.get('FixedHeightLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('FixedHeightLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.0,58.9),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "PaddingPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,8,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                lastDragTime: 1315407805804,
                name: "PaddingLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "padding:"
            },{
                _ClipMode: "hidden",
                _Extent: lively.pt(109.6,20.0),
                _Fill: Color.rgb(255,255,255),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: null,
                _InputAllowed: true,
                _IsSelectable: true,
                _Position: lively.pt(110.0,0.0),
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                allowInput: true,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,18,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                fixedHeight: true,
                grabbingEnabled: false,
                isInputLine: true,
                layout: {
                    resizeWidth: true
                },
                name: "paddingInput",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "lively.pt(4.0,2.0)",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "savedTextString", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (input) {
                                                        try {
                                                            var r = eval(input);
                                                            if (!r.constructor === lively.Rectangle)
                                                                throw new Error('Not a rectangle: ' + r)
                                                        } catch(e) {
                                                            alert('Cannot set padding: ' + e)
                                                            return;
                                                        }
                                                        return {padding: r}
                                                    
                                                    }});
            },
                onMouseOut: function onMouseOut() {
                this.get('PaddingLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('PaddingLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.0,80.9),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "AllowInputPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,12,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                lastDragTime: 1315407805804,
                name: "allowInputLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "allow input:"
            },{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(20.0,20.0),
                _Fill: Color.rgb(255,255,255),
                _PointerEvents: "auto",
                _Position: lively.pt(110.0,0.0),
                active: true,
                checked: true,
                className: "lively.morphic.CheckBox",
                draggingEnabled: false,
                droppingEnabled: false,
                eventsAreDisabled: false,
                grabbingEnabled: false,
                name: "allowInputCheckBox",
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (bool) { return {allowInput: bool}}});
            },
                onMouseOut: function onMouseOut() {
                this.get('allowInputLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('allowInputLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.0,102.9),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "SelectablePanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,11,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                lastDragTime: 1315407805804,
                name: "selectableLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "selectable:"
            },{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(20.0,20.0),
                _Fill: Color.rgb(255,255,255),
                _PointerEvents: "auto",
                _Position: lively.pt(110.0,0.0),
                active: true,
                checked: true,
                className: "lively.morphic.CheckBox",
                draggingEnabled: false,
                droppingEnabled: false,
                eventsAreDisabled: false,
                grabbingEnabled: false,
                name: "selectableCheckBox",
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (bool) { return {selectable: bool}}});
            },
                onMouseOut: function onMouseOut() {
                this.get('selectableLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('selectableLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.0,124.9),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(261.0,27.0),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "AlignPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,6,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "alignLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "align:"
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(109.6,20.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(110.0,0.0),
                changeTriggered: false,
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                grabbingEnabled: false,
                itemList: ["left","right","center","justify","initial","inherit"],
                layout: {
                    resizeWidth: true
                },
                name: "AlignText",
                selectedLineNo: 0,
                selection: "left",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                textString: "normal",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (aString) {
                                return {align: aString}
                            
                            }});
            },
                onMouseOut: function onMouseOut() {
                this.get('alignLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('alignLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.0,146.9),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(261.0,27.0),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "VerticalAlignPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,15,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "verticalAlignLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "vertical align:"
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(109.6,20.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(110.0,0.0),
                changeTriggered: true,
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                grabbingEnabled: false,
                itemList: ["baseline","sub","super","top","text-top","middle","bottom","text-bottom"],
                layout: {
                    resizeWidth: true
                },
                name: "VerticalAlignText",
                selectedLineNo: 3,
                selection: "top",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                textString: "normal",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (aString) { return {verticalAlign: aString}}});
            },
                onMouseOut: function onMouseOut() {
                this.get('verticalAlignLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('verticalAlignLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,22.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.0,168.8),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "LineHeightPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,12,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                lastDragTime: 1315407805804,
                name: "lineHeightLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "line height:"
            },{
                _BorderColor: Color.rgb(102,102,102),
                _BorderRadius: 6,
                _BorderWidth: 1,
                _Extent: lively.pt(90.6,12.0),
                _Position: lively.pt(110.0,5.0),
                _StyleClassNames: ["Morph","Box","Slider"],
                _Visible: true,
                className: "lively.morphic.Slider",
                droppingEnabled: true,
                layout: {
                    centeredVertical: true,
                    resizeWidth: true
                },
                name: "lineHeightSlider",
                sliderExtent: 0.1,
                sliderKnob: {
                    isMorphRef: true,
                    path: "submorphs.0"
                },
                sourceModule: "lively.morphic.Widgets",
                styleClass: ["slider_background_horizontal"],
                submorphs: [{
                    _BorderColor: Color.rgb(102,102,102),
                    _BorderRadius: 6,
                    _BorderWidth: 1,
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(8.0,0.0),
                    _Visible: true,
                    className: "lively.morphic.SliderKnob",
                    droppingEnabled: true,
                    hitPoint: lively.pt(34.3,9.5),
                    slider: {
                        isMorphRef: true,
                        name: "lineHeightSlider"
                    },
                    sourceModule: "lively.morphic.Widgets",
                    styleClass: ["slider_horizontal"],
                    submorphs: [],
                    onDrag: function onDrag(evt) {
                    $super(evt)
                    evt.stop();
                    return true
                },
                    onMouseMove: function onMouseMove(evt) {
                    $super(evt)
                    evt.stop();
                    return true;
                }
                }],
                value: 0.1,
                valueScale: 1,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
                lively.bindings.connect(this, "value", this.get("lineHeightInput"), "setTextString", {converter: 
            function (val) {
                    return Math.round(val*10)
                }});
            },
                onMouseOut: function onMouseOut() {
                this.get('lineHeightLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('lineHeightLabel').addStyleClassName('CheckBoxHover')
            }
            },{
                _Align: "center",
                _ClipMode: "hidden",
                _Extent: lively.pt(19.0,15.0),
                _Fill: Color.rgb(255,255,255),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: null,
                _InputAllowed: true,
                _IsSelectable: true,
                _Position: lively.pt(200.6,3.5),
                _StyleClassNames: ["Morph","Text","Input"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                allowInput: true,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,1,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal"
                }]],
                fixedHeight: true,
                grabbingEnabled: false,
                isInputLine: true,
                layout: {
                    centeredVertical: true
                },
                name: "lineHeightInput",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "1",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "textString", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (input) {
                                                        try {
                                                            var n = Number.parseFloat(input)
                                                        } catch(e) {
                                                            alert('Cannot set line height: ' + n)
                                                            return;
                                                        }
                                                        return {lineHeight: n}
                                                    
                                                    }});
                lively.bindings.connect(this, "savedTextString", this.get("lineHeightSlider"), "setValue", {converter: 
            function (value) {
                    return parseFloat(value)
                }});
            },
                onMouseOut: function onMouseOut() {
                this.get('lineHeightLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('lineHeightLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.0,192.8),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(261.0,27.0),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "DisplayPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,8,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "displayLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "display:"
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(109.6,20.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(110.0,0.0),
                changeTriggered: false,
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                grabbingEnabled: false,
                itemList: ["inline","block","flex","inline-block","inline-flex","inline-table","list-item","run-in","table","table-caption","table-header-group","table-footer-group","table-row-group","table-cell","table-column","table-row","none","initial","inherit"],
                layout: {
                    resizeWidth: true
                },
                name: "DisplayText",
                selectedLineNo: 0,
                selection: "inline",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                textString: "normal",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (aString) { return {display: aString}}});
            },
                onMouseOut: function onMouseOut() {
                this.get('displayLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('displayLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.0,214.8),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(261.0,27.0),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "WhiteSPacePanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,12,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "whiteSpaceLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "white space:"
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(109.6,20.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(110.0,0.0),
                changeTriggered: false,
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                grabbingEnabled: false,
                itemList: ["normal","nowrap","pre","pre-line","pre-wrap","initial","inherit"],
                layout: {
                    resizeWidth: true
                },
                name: "WhiteSpaceText",
                selectedLineNo: 4,
                selection: "pre-wrap",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                textString: "normal",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (aString) { return {whiteSpaceHandling: aString}}});
            },
                onMouseOut: function onMouseOut() {
                this.get('whiteSpaceLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('whiteSpaceLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _HandStyle: "default",
            _PointerEvents: "auto",
            _Position: lively.pt(15.0,236.8),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            eventsAreDisabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                extentWithoutPlaceholder: lively.pt(261.0,27.0),
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "WordBreakPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,11,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                name: "wordBreakLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "word break:"
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(109.6,20.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(110.0,0.0),
                changeTriggered: false,
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                grabbingEnabled: false,
                itemList: ["normal","break-all","hyphenate","initial","inherit"],
                layout: {
                    resizeWidth: true
                },
                name: "WordBreakText",
                selectedLineNo: 0,
                selection: "normal",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                textString: "normal",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (aString) { return {wordBreak: aString}}});
            },
                onMouseOut: function onMouseOut() {
                this.get('wordBreakLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('wordBreakLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        },{
            _Extent: lively.pt(219.6,20.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(15.0,258.8),
            className: "lively.morphic.Box",
            draggingEnabled: false,
            droppingEnabled: false,
            grabbingEnabled: false,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                spacing: 0,
                type: "lively.morphic.Layout.TightHorizontalLayout"
            },
            name: "SyntaxHighlightingPanel",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(110.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: "default",
                _InputAllowed: false,
                _IsSelectable: true,
                _PointerEvents: "auto",
                _StyleClassNames: ["Morph","Text"],
                _TextColor: Color.rgb(64,64,64),
                _TextStylingMode: false,
                _WordBreak: "break-all",
                allowInput: false,
                className: "lively.morphic.Text",
                draggingEnabled: false,
                droppingEnabled: false,
                emphasis: [[0,17,{
                    color: Color.rgb(64,64,64),
                    fontFamily: "Arial, sans-serif",
                    fontSize: 11,
                    fontWeight: "normal",
                    italics: "normal",
                    textDecoration: null
                }]],
                eventsAreDisabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                grabbingEnabled: false,
                isLabel: true,
                lastDragTime: 1315407805804,
                name: "syntaxHighlightLabel",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "syntax highlight:"
            },{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(20.0,20.0),
                _Fill: Color.rgb(255,255,255),
                _PointerEvents: "auto",
                _Position: lively.pt(110.0,0.0),
                active: true,
                checked: false,
                className: "lively.morphic.CheckBox",
                draggingEnabled: false,
                droppingEnabled: false,
                eventsAreDisabled: false,
                grabbingEnabled: false,
                name: "syntaxHighlightingCheckBox",
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get("TextAttributePanel"), "updateStyle", {converter: 
            function (bool) { return {syntaxHighlighting: bool} }});
            },
                onMouseOut: function onMouseOut() {
                this.get('syntaxHighlightLabel').removeStyleClassName('CheckBoxHover')
            },
                onMouseOver: function onMouseOver() {
                this.get('syntaxHighlightLabel').addStyleClassName('CheckBoxHover')
            }
            }]
        }]
    }],
    updateDisplay: "inline",
    updateTextStyle: "italic",
    applyTextStyle: function applyTextStyle(aSpec) {
    var spec = Object.merge([this.defaultTextStyle(), aSpec]);
    this.get('FontColorField').setColor(spec.color);
    this.get('BackgroundColorField').setColor(spec.backgroundColor);
    this.get('FontWeightText').setSelectionMatching(spec.fontWeight);
    this.get('FontDecorationText').setSelectionMatching(spec.textDecoration);
    this.get('FontSizeText').setTextString(spec.fontSize);
    this.get('fontSizeSlider').setValue(spec.fontSize/100);
    this.get('FontChooserButton').setLabel(spec.fontFamily);
    this.get('FontStyleText').setSelectionMatching(spec.fontStyle);
    this.get('fixedWidthCheckBox').setChecked(spec.fixedWidth);
    this.get('fixedHeightCheckBox').setChecked(spec.fixedHeight);
    this.get('paddingInput').setTextString(String(spec.padding));
    this.get('allowInputCheckBox').setChecked(spec.allowInput);
    this.get('selectableCheckBox').setChecked(spec.selectable);
    this.get('lineHeightInput').setTextString(spec.lineHeight);
    this.get('lineHeightSlider').setValue(spec.lineHeight/10);
    this.get('AlignText').setSelectionMatching(spec.align);
    this.get('VerticalAlignText').setSelectionMatching(spec.verticalAlign);
    this.get('DisplayText').setSelectionMatching(spec.display);
    this.get('WhiteSpaceText').setSelectionMatching(spec.whiteSpaceHandling);
    this.get('WordBreakText').setSelectionMatching(spec.wordBreak);
    this.get('syntaxHighlightingCheckBox').setChecked(spec.syntaxHighlighting);
    this.get('TextCheckBox').setChecked(!spec.cssStylingMode);
    this.get('TextCheckBox2').setChecked(!spec.cssStylingMode);
},
    connectionRebuilder: function connectionRebuilder() {
    lively.bindings.connect(this, "focusedText", this, "selectTextMorph", {});
},
    defaultTextStyle: function defaultTextStyle() {
    return {
        color: Global.Color.black,
        backgroundColor: Global.Color.white.withA(0),
        fontWeight: 'normal',
        textDecoration: 'none',
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'normal',
        fixedWidth: true,
        fixedHeight: false,
        padding: lively.pt(4,2,0,0),
        allowInput: true,
        selectable: true,
        lineHeight: 1,
        align: 'left',
        verticalAlign: 'top',
        display: 'inline',
        whiteSpaceHandling: 'pre-wrap',
        wordBreak: 'normal',
        syntaxHighlighting: false,
        cssStylingMode: false
    }
},
    getTargetMorphsTextStyle: function getTargetMorphsTextStyle() {
    var padding;
    try {
        padding = eval(this.get('paddingInput').textString)
    } catch (err) {
        alert("Couldn't read padding");
        padding = lively.rect(4,2,0,0);
    }
    return {
        color: this.get('FontColorField').color,
        backgroundColor: this.get('BackgroundColorField').color,
        fontWeight: this.get('FontWeightText').selection,
        textDecoration: this.get('FontDecorationText').selection,
        fontSize: parseInt(this.get('FontSizeText').textString),
        fontFamily: this.get('FontChooserButton').label.textString,
        fontStyle: this.get('FontStyleText').selection,
        fixedWidth: this.get('fixedWidthCheckBox').isChecked(),
        fixedHeight: this.get('fixedHeightCheckBox').isChecked(),
        padding: padding,
        allowInput: this.get('allowInputCheckBox').isChecked(),
        selectable: this.get('selectableCheckBox').isChecked(),
        lineHeight: parseInt(this.get('lineHeightInput').textString),
        align: this.get('AlignText').selection,
        verticalAlign: this.get('VerticalAlignText').selection,
        display: this.get('DisplayText').selection,
        whiteSpaceHandling: this.get('WhiteSpaceText').selection,
        wordBreak: this.get('WordBreakText').selection,
        syntaxHighlighting: this.get('syntaxHighlightingCheckBox').isChecked(),
        cssStylingMode: !this.get('TextCheckBox').isChecked
    }
},
    getTextMorphsSelectionRange: function getTextMorphsSelectionRange(morph) {
    var selRange = morph.getSelectionRange();
    if (selRange) {
        selRange = Global.Numbers.sort(selRange);
    }
    if (!selRange || selRange[0] === selRange[1]) {
        selRange = [0, morph.textString.length];
    }
    return selRange
},
    hideOrShowCSSProperties: function hideOrShowCSSProperties(bool) {
    // true ... show, false ... hide
    this.get('TextCheckBox').setChecked(bool)
    var bottom = this.get('TextCheckBox2');
    (bottom.isChecked() !== bool) && bottom.setChecked(bool)
    var panelNames = ["Align","FontFamily","FontSize","Weight","FontColor","Decoration","VerticalAlign","LineHeight","Display","WordBreak"];
    panelNames.each(function(name) {
        var m = this.get(name + 'Panel')
        m.setOpacity(bool ? 1 : 0.1)
        m[bool ? 'enableEvents' : 'disableEvents']();
    }, this)
},
    openFontBook: function openFontBook() {
    var fontList = lively.morphic.Text.Fonts.openFontBook();
    lively.bindings.connect(fontList, 'selection', this, 'updateEmphasis', {
        converter: function(itemMorph) { return { fontFamily: itemMorph.item.string} }
    });
    lively.bindings.connect(fontList, 'selection', this.get('FontChooserButton'), 'setLabel', {
      converter: function(itemMorph) { return itemMorph.item.string }  
    })
},
    reset: function reset() {
    Global.disconnectAll(this)
    Global.connect(this, 'focusedText', this, 'selectTextMorph');
    this.selectTextMorph(null);
    this.get('TextCheckBox').setChecked(true);
    this.applyTextStyle({});
    
    if (!this.hasOwnProperty('doNotSerialize'))
        this.doNotSerialize = [];
/*
this.doNotSerialize = this.doNotSerialize.uniq()
this.doNotSerialize = ['layer', 'withoutLayers', '$$focusedText', 'targetMorph']
this.onLoadFromPartsBin
this === this.constructor.prototype
this.getPartsBinMetaInfo().addRequiredModule('lively.LayerableMorphs')
this.constructor.prototype._renderContext
module('lively.LayerableMorphs').load(true)
this.submorphs.reject(function(ea) { return ea === this.get('selectedTextName') }, this).invoke('moveBy', pt(-2,0))
*/
},
    selectTextMorph: function selectTextMorph(morph) {
    if (morph && morph.isText) {
        lively.bindings.noUpdate(function() {
            var spec = {
                fixedWidth: !!morph.fixedWidth,
                fixedHeight: !!morph.fixedHeight,
                allowInput: !!morph.allowInput,
                selectable: morph.isSelectable(),
                syntaxHighlighting: morph.syntaxHighlightingWhileTyping,
                cssStylingMode: !morph.getTextStylingMode()
            };
            morph.getPadding && (spec.padding = morph.getPadding())
            morph.getDisplay() && (spec.display = morph.getDisplay());
            morph.getLineHeight() && (spec.lineHeight = morph.getLineHeight());
            morph.getAlign() && (spec.align = morph.getAlign());
            morph.getVerticalAlign() && (spec.verticalAlign = morph.getVerticalAlign());
            var styles = morph.getTextChunks().pluck('style')
            spec.fontFamily = (styles.pluck('fontFamily').compact()[0] || morph.getFontFamily());
            if (!spec.fontFamily) delete spec.fontFamily;
            spec.fontSize = (styles.pluck('fontSize').compact()[0] || morph.getFontSize());
            if (!spec.fontSize) delete spec.fontSize;
            spec.fontStyle = (styles.pluck('fontStyle').compact()[0] || morph.getFontStyle());
            if (!spec.fontStyle) delete spec.fontStyle;
            spec.fontWeight = (styles.pluck('fontWeight').compact()[0] || morph.getFontWeight());
            if (!spec.fontWeight) delete spec.fontWeight;
            spec.textDecoration = (styles.pluck('textDecoration').compact()[0] || morph.getTextDecoration());
            if (!spec.textDecoration) delete spec.textDecoration;
            spec.color = (styles.pluck('color').compact()[0] || morph.getTextColor());
            if (!spec.color) delete spec.color;
            spec.backgroundColor = styles.pluck('backgroundColor').compact()[0];
            if (!spec.backgroundColor) delete spec.backgroundColor;
            this.applyTextStyle(spec)
            this.hideOrShowCSSProperties(spec.cssStylingMode)
            this.targetMorph = morph;
        }.bind(this));        
    } else {
        delete this.targetMorph;
    }
},
    setupConnections: function setupConnections() {
// disconnectAll(this.get('FontChooserComboBox'))
    Global.connect(this.get('FontChooserButton'), 'fire', this, 'openFontBook');
    Global.connect(this.get('FontSizeText'), 'selection', this, 'updateFontSize');
    Global.connect(this.get('FontWeightText'), 'selection', this, 'updateFontWeight');
    Global.connect(this.get('FontDecorationText'), 'selection', this, 'updateFontDecoration');
    Global.connect(this.get('FontColorField'), 'color', this, 'updateFontColor');
    Global.connect(this.get('BackgroundColorField'), 'color', this, 'updateBackgroundColor')

    // connect(this.get('unselectButton'), 'fire', this, 'updateFontColor');

    Global.connect(this.get('fixedWidthCheckBox'), 'checked', this, 'updateStyle', {
            converter: function(bool) { return {fixedWidth: bool}}});

    Global.connect(this.get('fixedHeightCheckBox'), 'checked', this, 'updateStyle', {
            converter: function(bool) { return {fixedHeight: bool}}});
},
    updateEmphasis: function updateEmphasis(spec) {
    if (this.targetMorph) {
        var range = this.getTextMorphsSelectionRange(this.targetMorph);
        if (!spec.backgroundColor && range[0] === 0 && range[1] === this.targetMorph.textString.length) {
            if (spec.color) {
                spec.textColor = spec.color;
                delete spec.color;
            }
            this.updateStyle(spec);
        } else {
            if (spec.fontStyle) {
                spec.italics = spec.fontStyle;
                delete spec.fontStyle;
            }
            this.targetMorph.changeEmphasis(range[0], range[1],
                function(prevEmph, doEmph) {
                    doEmph(spec)
                });            
        }
    }
},
    updateStyle: function updateStyle(style) {
    var m = this.targetMorph;
    m && m.applyStyle(style);
}
})

}) // end of module
