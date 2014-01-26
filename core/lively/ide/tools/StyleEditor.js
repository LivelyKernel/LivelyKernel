module('lively.ide.tools.StyleEditor').requires('lively.persistence.BuildSpec', 'lively.morphic.Widgets').toRun(function() {

lively.BuildSpec('lively.ide.tools.StyleEditor', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(331.0,486.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    layout: { adjustForNewBounds: true },
    name: "StyleEditorPane",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(319.8,455.4),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        isCopyMorphRef: true,
        layout: { adjustForNewBounds: true, resizeHeight: true, resizeWidth: true },
        layoutProps: ["adjustForNewBounds","resizeWidth","resizeHeight","moveVertical","moveHorizontal","centeredHorizontal","centeredVertical","scaleHorizontal","scaleVertical"],
        morphRefId: 1,
        name: "StyleEditorPane",
        submorphs: [{
            _Align: "center",
            _BorderColor: Color.rgb(95,94,95),
            _Extent: lively.pt(300.9,23.3),
            _Fill: Color.rgb(238,238,238),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 12,
            _Position: lively.pt(10.0,10.0),
            className: "lively.morphic.Text",
            dontUpdate: false,
            fixedWidth: true,
            isCopyMorphRef: true,
            layout: { adjustForNewBounds: false, resizeWidth: true },
            morphRefId: 1,
            name: "TargetName",
            textString: "Text",
            onChange: function onChange() {
            
            var morph = this.get(this.textString);
            if (morph) {
                this.setFill(Color.rgbHex("#EEE"));
            
                    this.owner.setTarget(morph);
        
            }
            else {
                this.setFill(Color.red);
            }
            
        }
        },{
            _BorderColor: Color.rgb(204,204,204),
            _Extent: lively.pt(300.0,330.0),
            _Position: lively.pt(10.0,50.0),
            className: "lively.morphic.TabContainer",
            layout: {},
            name: "TabContainer",
            resizedPanes: ["FC64DDA5-337B-4D6D-A80C-9A51D6F02390","B20DEDBC-7052-4FC8-9B99-35CDF81783BB","90DE5048-6FD2-49DA-9A69-4738E538B397","CB0EFC9C-18D6-4132-B300-ECFBA536F5FD","D8DBBF38-C7DB-4162-93A5-0FFE2FB50C00","18FEBB49-5B0F-437A-850A-C327B83E4AE0"],
            sourceModule: "lively.morphic.AdditionalMorphs",
            submorphs: [{
                _BorderColor: Color.rgb(204,204,204),
                _Extent: lively.pt(300.0,30.0),
                adjustedTabSizes: true,
                className: "lively.morphic.TabBar",
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    resizeWidth: true
                },
                sourceModule: "lively.morphic.AdditionalMorphs",
                submorphs: [{
                    _BorderColor: Color.rgb(204,204,204),
                    _BorderWidth: 1,
                    _Extent: lively.pt(98.0,30.0),
                    _Fill: Color.rgb(255,255,255),
                    className: "lively.morphic.Tab",
                    droppingEnabled: true,
                    isActive: true,
                    name: "Appearance",
                    pane: 3,
                    sourceModule: "lively.morphic.AdditionalMorphs",
                    submorphs: [{
                        _ClipMode: "hidden",
                        _Extent: lively.pt(81.0,20.0),
                        _FontFamily: "Helvetica",
                        _FontWeight: "bold",
                        _HandStyle: "default",
                        _PointerEvents: "none",
                        _Position: lively.pt(5.0,5.0),
                        _WordBreak: "break-all",
                        allowInput: false,
                        className: "lively.morphic.Text",
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        textString: "Appearance"
                    }],
                    tabBarOffset: 0
                },{
                    _BorderColor: Color.rgb(204,204,204),
                    _BorderWidth: 1,
                    _Extent: lively.pt(98.0,30.0),
                    _Fill: Color.rgb(204,204,204),
                    _Position: lively.pt(98.0,0.0),
                    className: "lively.morphic.Tab",
                    droppingEnabled: true,
                    isActive: false,
                    name: "CSS",
                    pane: 2,
                    sourceModule: "lively.morphic.AdditionalMorphs",
                    submorphs: [{
                        _ClipMode: "hidden",
                        _Extent: lively.pt(35.0,20.0),
                        _FontFamily: "Helvetica",
                        _FontWeight: null,
                        _HandStyle: "default",
                        _PointerEvents: "none",
                        _Position: lively.pt(5.0,5.0),
                        _WordBreak: "break-all",
                        allowInput: false,
                        className: "lively.morphic.Text",
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        textString: "CSS"
                    }],
                    tabBarOffset: 98
                },{
                    _BorderColor: Color.rgb(204,204,204),
                    _BorderWidth: 1,
                    _Extent: lively.pt(98.0,30.0),
                    _Fill: Color.rgb(204,204,204),
                    _Position: lively.pt(196.0,0.0),
                    className: "lively.morphic.Tab",
                    droppingEnabled: true,
                    isActive: false,
                    name: "Layout",
                    pane: 1,
                    sourceModule: "lively.morphic.AdditionalMorphs",
                    submorphs: [{
                        _ClipMode: "hidden",
                        _Extent: lively.pt(47.0,20.0),
                        _FontFamily: "Helvetica",
                        _FontWeight: null,
                        _HandStyle: "default",
                        _PointerEvents: "none",
                        _Position: lively.pt(5.0,5.0),
                        _WordBreak: "break-all",
                        allowInput: false,
                        className: "lively.morphic.Text",
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        textString: "Layout"
                    }],
                    tabBarOffset: 196
                }]
            },{
                _BorderColor: Color.rgb(204,204,204),
                _Extent: lively.pt(300.0,360.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(0.0,30.0),
                className: "lively.morphic.TabPane",
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    resizeHeight: true,
                    resizeWidth: true
                },
                name: "Layout - Pane",
                sourceModule: "lively.morphic.AdditionalMorphs",
                submorphs: [{
                    _Extent: lively.pt(118.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,20.0),
                    className: "lively.morphic.Text",
                    name: "Text10",
                    textString: "adjustForNewBounds"
                },{
                    _Extent: lively.pt(64.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,40.0),
                    className: "lively.morphic.Text",
                    name: "Text11",
                    textString: "resizeWidth"
                },{
                    _Extent: lively.pt(69.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,60.0),
                    className: "lively.morphic.Text",
                    name: "Text12",
                    textString: "resizeHeight"
                },{
                    _Extent: lively.pt(71.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,80.0),
                    className: "lively.morphic.Text",
                    name: "Text13",
                    textString: "moveVertical"
                },{
                    _Extent: lively.pt(86.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,100.0),
                    className: "lively.morphic.Text",
                    name: "Text14",
                    textString: "moveHorizontal"
                },{
                    _Extent: lively.pt(104.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,120.0),
                    className: "lively.morphic.Text",
                    name: "Text15",
                    textString: "centeredHorizontal"
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,20.0),
                    className: "lively.morphic.CheckBox",
                    droppingEnabled: true,
                    layoutProperty: "adjustForNewBounds",
                    name: "adjustForNewBoundsCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                                var style = {},
                            		prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,40.0),
                    className: "lively.morphic.CheckBox",
                    layoutProperty: "resizeWidth",
                    name: "resizeWidthCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                        		var style = {},
                        			prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,60.0),
                    className: "lively.morphic.CheckBox",
                    layoutProperty: "resizeHeight",
                    name: "resizeHeightCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                        		var style = {},
                        			prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,80.0),
                    className: "lively.morphic.CheckBox",
                    layoutProperty: "moveVertical",
                    name: "moveVerticalCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                        		var style = {},
                        			prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,100.0),
                    className: "lively.morphic.CheckBox",
                    layoutProperty: "moveHorizontal",
                    name: "moveHorizontalCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                        		var style = {},
                        			prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,120.0),
                    className: "lively.morphic.CheckBox",
                    layoutProperty: "centeredHorizontal",
                    name: "centeredHorizontalCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                        		var style = {},
                        			prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _Extent: lively.pt(89.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,140.0),
                    className: "lively.morphic.Text",
                    name: "Text16",
                    textString: "centeredVertical"
                },{
                    _Extent: lively.pt(85.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,160.0),
                    className: "lively.morphic.Text",
                    name: "Text17",
                    textString: "scaleHorizontal"
                },{
                    _Extent: lively.pt(70.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,180.0),
                    className: "lively.morphic.Text",
                    name: "Text18",
                    textString: "scaleVertical"
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,140.0),
                    className: "lively.morphic.CheckBox",
                    droppingEnabled: true,
                    layoutProperty: "centeredVertical",
                    name: "centeredVerticalCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                        		var style = {},
                        			prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,160.0),
                    className: "lively.morphic.CheckBox",
                    droppingEnabled: true,
                    layoutProperty: "scaleHorizontal",
                    name: "scaleHorizontalCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                        		var style = {},
                        			prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,180.0),
                    className: "lively.morphic.CheckBox",
                    droppingEnabled: true,
                    layoutProperty: "scaleVertical",
                    name: "scaleVerticalCheckBox",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (bool) {
                        		var style = {},
                        			prop = this.sourceObj.layoutProperty;
                        		style[prop] = bool;
                        		return style
                        	}});
                }
                },{
                    _ClipMode: "auto",
                    _Extent: lively.pt(148.1,23.0),
                    _Fill: Color.rgb(243,243,243),
                    _Position: lively.pt(20.0,220.0),
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
                    }, {
                        isListItem: true,
                        string: "GridLayout",
                        value: "lively.morphic.Layout.GridLayout"
                    }],
                    name: "layouterList",
                    selectOnMove: false,
                    selectedLineNo: 0,
                    selection: null,
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setLayouter", {});
                }
                },{
                    _BorderColor: Color.rgb(214,214,214),
                    _BorderRadius: 5,
                    _BorderWidth: 1,
                    _Extent: lively.pt(258.4,23.8),
                    _Position: lively.pt(20.0,260.0),
                    className: "lively.morphic.Button",
                    label: "Configure Layout",
                    name: "layoutConfigButton",
                    padding: lively.rect(5,0,0,0),
                    showsMorphMenu: true,
                    sourceModule: "lively.morphic.Widgets",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "fire", this.get("StyleEditorPane"), "openLayoutConfigurator", {});
                }
                }],
                tab: 2
            },{
                _BorderColor: Color.rgb(204,204,204),
                _Extent: lively.pt(300.0,360.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(0.0,30.0),
                className: "lively.morphic.TabPane",
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true
                },
                name: "CSS - Pane",
                sourceModule: "lively.morphic.AdditionalMorphs",
                submorphs: [{
                    _BorderColor: Color.rgb(204,204,204),
                    _ClipMode: "auto",
                    _Extent: lively.pt(280.0,280.0),
                    _Fill: Color.rgb(235,235,235),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 8,
                    _Padding: lively.rect(5,5,0,0),
                    _Position: lively.pt(10.0,10.0),
                    _WordBreak: "break-all",
                    className: "lively.morphic.Text",
                    emphasis: [[0,0,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    fixedHeight: true,
                    fixedWidth: true,
                    name: "CSSCodePane",
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "savedTextString", this.get("CSSApplyButton"), "onFire", {});
                }
                },{
                    _BorderColor: Color.rgb(204,204,204),
                    _BorderStyle: "double",
                    _Extent: lively.pt(200.0,21.0),
                    _Fill: Color.rgb(235,235,235),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 8,
                    _Padding: lively.rect(5,5,0,0),
                    _Position: lively.pt(90.0,300.0),
                    className: "lively.morphic.Text",
    
                    emphasis: [[0,10,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    fixedWidth: true,
                    name: "ClassEdit",
                    textString: "Morph Text"
                },{
                    _BorderColor: Color.rgb(214,214,214),
                    _BorderRadius: 5.2,
                    _Extent: lively.pt(110.0,20.0),
                    _Position: lively.pt(180.0,330.0),
                    className: "lively.morphic.Button",
                    isPressed: false,
                    label: "Apply",
                    name: "CSSApplyButton",
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
                
                }
                },{
                    _BorderColor: null,
                    _BorderStyle: "double",
                    _Extent: lively.pt(75.0,17.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 8,
                    _Padding: lively.rect(5,5,0,0),
                    _Position: lively.pt(10.0,300.0),
                    className: "lively.morphic.Text",
                    name: "Text22",
                    textString: "Classname(s):"
                }],
                tab: 1
            },{
                _BorderColor: Color.rgb(204,204,204),
                _BorderWidth: 1,
                _Extent: lively.pt(300.0,360.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(0.0,30.0),
                className: "lively.morphic.TabPane",
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true
                },
                name: "Appearance - Pane",
                sourceModule: "lively.morphic.AdditionalMorphs",
                submorphs: [{
                    _BorderColor: Color.rgb(95,94,95),
                    _Extent: lively.pt(275.5,173.4),
                    _Position: lively.pt(0.0,120.0),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    name: "Rectangle1",
                    submorphs: [{
                        _Extent: lively.pt(93.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _Position: lively.pt(20.0,70.0),
                        _Visible: true,
                        className: "lively.morphic.Text",
                        fixedWidth: true,
                        name: "StyleEditorBorderWidthLabel",
                        textString: "Width"
                    },{
                        _Extent: lively.pt(95.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _Position: lively.pt(20.0,100.0),
                        _Visible: true,
                        className: "lively.morphic.Text",
                        fixedWidth: true,
                        name: "StyleEditorBorderRadiusLabel",
                        textString: "Radius"
                    },{
                        _Extent: lively.pt(95.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _Position: lively.pt(20.0,130.0),
                        _Visible: true,
                        className: "lively.morphic.Text",
                        fixedWidth: true,
                        name: "StyleEditorBorderStyleLabel",
                        textString: "Style"
                    },{
                        _BorderColor: Color.rgb(102,102,102),
                        _BorderRadius: 6,
                        _BorderWidth: 1,
                        _Extent: lively.pt(150.0,16.0),
                        _Position: lively.pt(100.0,70.0),
                        _Visible: true,
                        className: "lively.morphic.Slider",
                        droppingEnabled: true,
                        name: "borderWidthSlider",
                        sliderExtent: 0.1,
                        sliderKnob: "<lively.morphic.SliderKnob#9873D...>",
                        styleClass: ["slider_background_horizontal"],
                        submorphs: [{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(15.0,16.0),
                            __layered_draggingEnabled__: true,
                            className: "lively.morphic.SliderKnob",
                            droppingEnabled: true,
                            hitPoint: lively.pt(298.0,651.0),
                            slider: "<lively.morphic.Slider#01C57... - borderWidthSlider>",
                            styleClass: ["slider_horizontal"],
                        }],
                        value: 0,
                        valueScale: 20,
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
                        lively.bindings.connect(this, "value", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (v) { return {borderWidth: v} }});
                    }
                    },{
                        _BorderColor: Color.rgb(102,102,102),
                        _BorderRadius: 6,
                        _BorderWidth: 1,
                        _Extent: lively.pt(150.0,16.0),
                        _Position: lively.pt(100.0,100.0),
                        _Visible: true,
                        className: "lively.morphic.Slider",
                        droppingEnabled: true,
                        name: "borderRadiusSlider",
                        sliderExtent: 0.1,
                        sliderKnob: "<lively.morphic.SliderKnob#F7D8E...>",
                        styleClass: ["slider_background_horizontal"],
                        submorphs: [{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(15.0,16.0),
                            __layered_draggingEnabled__: true,
                            className: "lively.morphic.SliderKnob",
                            droppingEnabled: true,
                            hitPoint: lively.pt(828.0,410.0),
                            slider: "<lively.morphic.Slider#3642F... - borderRadiusSlider>",
                            styleClass: ["slider_horizontal"],
                        }],
                        value: 0,
                        valueScale: 50,
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
                        lively.bindings.connect(this, "value", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (v) { return {borderRadius: v} }});
                    }
                    },{
                        _Extent: lively.pt(85.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _Position: lively.pt(20.0,10.0),
                        className: "lively.morphic.Text",
                        fixedWidth: true,
                        name: "Text2",
                        textString: "Border"
                    },{
                        _Extent: lively.pt(93.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _Position: lively.pt(20.0,40.0),
                        _Visible: true,
                        className: "lively.morphic.Text",
                        fixedWidth: true,
                        name: "StyleEditorBorderColorLabel",
                        textString: "Color"
                    },{
                        _Extent: lively.pt(238.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _Position: lively.pt(20.0,70.0),
                        _Visible: false,
                        className: "lively.morphic.Text",
        
                        emphasis: [[0,34,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorBorderMsg",
                        textString: "Border is styled through CSS only\n\
                    "
                    },{
                        _BorderColor: Color.rgb(189,190,192),
                        _BorderRadius: 5,
                        _BorderWidth: 1,
                        _Extent: lively.pt(40.0,30.0),
                        _Position: lively.pt(100.0,34.0),
                        _Visible: true,
                        className: "lively.morphic.AwesomeColorField",
                        color: Color.rgb(0,0,0),
                        colorDisplay: "<lively.morphic.Box#23C97...>",
                        isPressed: false,
                        layout: {
                            adjustForNewBounds: true
                        },
                        name: "StyleBorderColorField",
                        sourceModule: "lively.morphic.ColorChooserDraft",
                        submorphs: [{
                            _BorderColor: Color.rgb(204,0,0),
                            _BorderRadius: 3,
                            _Extent: lively.pt(32.0,22.0),
                            _Fill: Color.rgb(0,0,0),
                            _Position: lively.pt(4.0,4.0),
                            className: "lively.morphic.Box",
                            droppingEnabled: true,
                            halosEnabled: false,
                            layout: {
                                resizeHeight: true,
                                resizeWidth: true
                            },
                        }],
                        toggle: false,
                        value: false,
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "color", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (fill) { return {borderColor: fill} }});
                    }
                    },{
                        _ClipMode: "auto",
                        _Extent: lively.pt(150.0,21.0),
                        _Fill: Color.rgb(243,243,243),
                        _Position: lively.pt(100.0,130.0),
                        _Visible: true,
                        className: "lively.morphic.DropDownList",
                        droppingEnabled: true,
                        itemList: ["solid","hidden","dotted","dashed","double","groove","ridge","inset","outset"],
                        name: "borderStyleList",
                        selectOnMove: false,
                        selectedLineNo: 0,
                        selection: "solid",
                        valueScale: 1,
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (v) { return {borderStyle: v} }});
                    }
                    },{
                        _BorderColor: Color.rgb(204,0,0),
                        _Extent: lively.pt(12.0,12.0),
                        _Position: lively.pt(250.0,10.0),
                        checked: true,
                        className: "lively.morphic.CheckBox",
                        droppingEnabled: true,
                        name: "BorderCheckBox",
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setBorderMode", {});
                    }
                    }]
                },{
                    _BorderColor: Color.rgb(95,94,95),
                    _Extent: lively.pt(272.2,110.9),
                    _Position: lively.pt(0.0,10.0),
                    className: "lively.morphic.Box",
                    droppingEnabled: true,
                    name: "Filldialog",
                    submorphs: [{
                        _Extent: lively.pt(63.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _Position: lively.pt(20.0,70.0),
                        _Visible: true,
                        className: "lively.morphic.Text",
        
                        emphasis: [[0,7,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorOpacityLabel",
                        textString: "Opacity"
                    },{
                        _BorderColor: Color.rgb(102,102,102),
                        _BorderRadius: 6,
                        _BorderWidth: 1,
                        _Extent: lively.pt(150.0,16.0),
                        _Position: lively.pt(100.0,70.0),
                        _Visible: true,
                        className: "lively.morphic.Slider",
                        droppingEnabled: true,
                        name: "opacitySlider",
                        sliderExtent: 0.1,
                        sliderKnob: "<lively.morphic.SliderKnob#CA9B5...>",
                        styleClass: ["slider_background_horizontal"],
                        submorphs: [{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(15.0,16.0),
                            _Position: lively.pt(135.0,0.0),
                            __layered_draggingEnabled__: true,
                            className: "lively.morphic.SliderKnob",
                            droppingEnabled: true,
                            hitPoint: lively.pt(981.0,273.0),
                            slider: "<lively.morphic.Slider#788A4... - opacitySlider>",
                            styleClass: ["slider_horizontal"],
                        }],
                        value: 1,
                        valueScale: 1,
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "value", this, "adjustSliderParts", {});
                        lively.bindings.connect(this, "value", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (v) { return {opacity: v} }});
                    }
                    },{
                        _Extent: lively.pt(85.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _Position: lively.pt(20.0,10.0),
                        className: "lively.morphic.Text",
        
                        emphasis: [[0,4,{
                            fontWeight: "bold",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "Text1",
                        textString: "Fill"
                    },{
                        _Extent: lively.pt(85.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _Position: lively.pt(20.0,40.0),
                        _Visible: true,
                        className: "lively.morphic.Text",
        
                        emphasis: [[0,6,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorFillColorLabel",
                        textString: "Color\n\
                    "
                    },{
                        _Extent: lively.pt(219.1,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _Position: lively.pt(20.0,40.0),
                        _Visible: false,
                        className: "lively.morphic.Text",
        
                        emphasis: [[0,32,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorFillMsg",
                        textString: "Fill is styled through CSS only\n\
                    "
                    },{
                        _BorderColor: Color.rgb(189,190,192),
                        _BorderRadius: 5,
                        _BorderWidth: 1,
                        _Extent: lively.pt(40.0,30.0),
                        _Position: lively.pt(100.0,34.0),
                        _Visible: true,
                        className: "lively.morphic.AwesomeColorField",
                        color: null,
                        colorDisplay: "<lively.morphic.Box#3B2AB...>",
                        isPressed: false,
                        layout: {
                            adjustForNewBounds: true
                        },
                        name: "StyleFillColorField",
                        sourceModule: "lively.morphic.ColorChooserDraft",
                        submorphs: [{
                            _BorderColor: Color.rgb(204,0,0),
                            _BorderRadius: 3,
                            _Extent: lively.pt(32.0,22.0),
                            _Position: lively.pt(4.0,4.0),
                            className: "lively.morphic.Box",
                            droppingEnabled: true,
                            halosEnabled: false,
                            layout: {
                                resizeHeight: true,
                                resizeWidth: true
                            },
                        }],
                        toggle: false,
                        value: false,
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "color", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (fill) { return {fill: fill} }});
                    }
                    },{
                        _BorderColor: Color.rgb(204,0,0),
                        _Extent: lively.pt(12.0,12.0),
                        _Position: lively.pt(250.0,10.0),
                        checked: true,
                        className: "lively.morphic.CheckBox",
                        droppingEnabled: true,
                        name: "AppearanceCheckBox",
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setAppearanceMode", {});
                    }
                    }]
                },{
                    _Extent: lively.pt(139.0,19.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 11,
                    _Position: lively.pt(20.0,290.0),
                    className: "lively.morphic.Text",
    
                    emphasis: [[0,4,{
                        fontWeight: "bold",
                        italics: "normal"
                    }]],
                    fixedWidth: true,
                    name: "Text3",
                    textString: "Misc"
                },{
                    _ClipMode: "auto",
                    _Extent: lively.pt(150.0,21.0),
                    _Fill: Color.rgb(243,243,243),
                    _Position: lively.pt(100.0,320.0),
                    _Visible: true,
                    className: "lively.morphic.DropDownList",
                    droppingEnabled: true,
                    itemList: ["visible","hidden","scroll","auto","inherit"],
                    name: "ClipModeList",
                    selectOnMove: false,
                    selectedLineNo: 0,
                    selection: "visible",
                    valueScale: 1,
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (v) { return {clipMode: v} }});
                }
                },{
                    _Extent: lively.pt(95.0,19.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: "11",
                    _Position: lively.pt(20.0,320.0),
                    _Visible: true,
                    className: "lively.morphic.Text",
                    emphasis: [[0,9,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    fixedWidth: true,
                    name: "Text9",
                    textString: "Clip mode"
                }],
                tab: 0
            }],
            tabBar: "<lively.morphic.TabBar#F909A...>",
            tabBarStrategy: "lively.morphic.TabStrategyTop",
            tabPaneExtent: lively.pt(300.0,300.0)
        }],
        openLayoutConfigurator: function openLayoutConfigurator() {
        if (!this.target.getLayouter()) {
            alert('no layout selected');
            return;
        }
        var configurator = lively.PartsBin.getPart('LayoutConfigurator', 'PartsBin/Layout');
        configurator.openInWorld();
        configurator.align(
            configurator.bounds().center(), this.world().visibleBounds().center())
        configurator.setTarget(this.target.getLayouter());
    },
        reset: function reset() {
    	this.get('borderWidthSlider').valueScale = 20
    	this.get('borderRadiusSlider').valueScale = 50
            this.get('layouterList').setSelection(null)
            this.layoutProps = ['adjustForNewBounds', 'resizeWidth', 'resizeHeight', 'moveVertical', 'moveHorizontal', 'centeredHorizontal', 'centeredVertical', 'scaleHorizontal', 'scaleVertical'];
            this.resetTarget()
    },
        resetTarget: function resetTarget() {
    	this.target = undefined;
    },
        setAppearanceMode: function setAppearanceMode(override) {
        //alert("SetAppearance!");
        
        if (this.target) {
        
        var direct =[
            "StyleEditorFillColorLabel",
            "StyleEditorOpacityLabel",
            "StyleFillColorField",
            "opacitySlider"
        ];
        var css =[
            "StyleEditorFillMsg"
        ];
    
        if (override){
            this.setMorphsVisibility(direct, css);
        }
        else {
            this.setMorphsVisibility(css, direct);
        }
        
        if (this.target.setAppearanceStylingMode) {
            this.target.setAppearanceStylingMode(!override);
        }
        }
    
    },
        setBorderMode: function setBorderMode(override) {
        
        if (this.target) {
            
        var direct =[
            "StyleEditorBorderColorLabel",
            "StyleEditorBorderWidthLabel",
            "StyleEditorBorderRadiusLabel",
            "StyleEditorBorderStyleLabel",
            "StyleBorderColorField",
            "borderRadiusSlider",
            "borderWidthSlider",
            "borderStyleList"
        ];
        var css =[
            "StyleEditorBorderMsg"
        ];
    
        if (override){
            this.setMorphsVisibility(direct, css);
        }
        else {
            this.setMorphsVisibility(css, direct);
        }
        
        if (this.target.setBorderStylingMode) {
            this.target.setBorderStylingMode(!override);
        }
        }
        
    },
        setLayouter: function setLayouter(layoutClassName) {
        if (layoutClassName && layoutClassName !== 'none')
            var newLayoutClass = lively.Class.forName(layoutClassName);
    
        if (!this.target) return;
    
        var currentLayoutClass = this.target.getLayouter() && 
            lively.Class.getConstructor(this.target.getLayouter());
    
        if (currentLayoutClass === newLayoutClass) return;
    
        this.target.setLayouter(newLayoutClass && new newLayoutClass(this.target));
        this.target.applyLayout();
    },
        setMorphsVisibility: function setMorphsVisibility(show, hide) {
        show.each(function(morph){
            if (morph.isMorph) {
                morph.setVisible(true);
            }
            else {
                var theMorph = this.get(morph);
                theMorph && theMorph.setVisible(true);
            }
        }, this);
        hide.each(function(morph){
            if (morph.isMorph) {
                morph.setVisible(false);
            }
            else {
                var theMorph = this.get(morph);
                theMorph && theMorph.setVisible(false);
            }
        }, this);
    
    },
        setTarget: function setTarget(morph) {
            if (this.dontUpdate || !morph) return;
    	this.target = morph;
    	this.get('StyleFillColorField').setColor(morph.getFill());	
    	this.get('StyleBorderColorField').setColor(morph.getBorderColor());
    
    	this.get('borderWidthSlider').setValue(morph.getBorderWidth());
    
    	this.get('borderRadiusSlider').setValue(morph.getBorderRadius());
    
            this.get('opacitySlider').setValue(morph.getOpacity());
    
            this.get('borderStyleList').setSelection(morph.getBorderStyle());
    
            this.get('ClipModeList').setSelection(morph.getClipMode());
    
            var layouter = morph.getLayouter();
            this.get('layouterList').setSelection(layouter && layouter.constructor.type);
    
            if (morph.getStyleSheet && morph.getStyleClassNames) {
                // check if style sheet module is loaded
                this.get("CSSCodePane").textString = morph.getStyleSheet() || '';
    
                this.get("ClassEdit").textString = morph.getStyleClassNames().join(" ");
    
                this.get("AppearanceCheckBox").setChecked(!morph.getAppearanceStylingMode());
                this.get("BorderCheckBox").setChecked(!morph.getBorderStylingMode());
            } else {
                this.get("AppearanceCheckBox").remove();
                this.get("BorderCheckBox").remove();
                 this.get("TabContainer").tabBar.tabs.splice(1,1);
                this.get("TabContainer").tabBar.get('CSS').remove();
                
            }
    
            this.get('TargetName').textString = morph.name;
    
    	// layout
    	var layout = morph.layout;
    	if (layout) {
                this.layoutProps.forEach(function(attr) {
    		var checkBox = this.get(attr + 'CheckBox');
    		checkBox.setChecked(layout[attr])
    	   }, this);
            }
            
    
    
    },
        setTargetStyle: function setTargetStyle(style) {
    	// alert(JSON.stringify(style))
    	if (this.target) this.target.applyStyle(style)
    },
        setupConnections: function setupConnections() {
    // newShowMorph(this.get('borderWidthSlider'))
    // this.get('borderWidthSlider').attributeConnections
    // disconnectAll(this.get('borderWidthSlider'))
    // 
    // newShowMorph(this.get('borderRadiusSlider'))
    // this.get('borderRadiusSlider').attributeConnections
    // disconnectAll(this.get('borderRadiusSlider'))
    
    
    	connect(this.get('borderWidthSlider'), 'value',
    	this, "setTargetStyle", {
    		converter: function(v) { return {borderWidth: v} }});
    
    	connect(this.get('borderRadiusSlider'), 'value',
    		this, "setTargetStyle", {
    		converter: function(v) { return {borderRadius: v} }});
    
    	connect(this.get('opacitySlider'), 'value',
    		this, "setTargetStyle", {
    		converter: function(v) { return {opacity: v} }});
    
    	connect(this.get('borderStyleList'), 'selection',
    		this, "setTargetStyle", {
    		converter: function(v) { return {borderStyle: v} }});
    		
    	connect(this.get('ClipModeList'), 'selection',
    		this, "setTargetStyle", {
    		converter: function(v) { return {clipMode: v} }});
    
            connect(this.get('layouterList'), 'selection', this, 'setLayouter')
    
            this.layoutProps.forEach(function(attr) {
            	var checkBox = this.get(attr + 'CheckBox');
            	checkBox.layoutProperty = attr;
            	connect(checkBox, 'checked', this,
            	"setTargetStyle", { converter:
            	function(bool) {
            		var style = {},
            			prop = this.sourceObj.layoutProperty;
            		style[prop] = bool;
            		return style
            	}})
            }, this);
    
    }
    }],
    titleBar: "StyleEditorPane",
    setTarget: function setTarget(target) {
    this.get('StyleEditorPane').setTarget(target);
}
})

}) // end of module
