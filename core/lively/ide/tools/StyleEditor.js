module('lively.ide.tools.StyleEditor').requires('lively.morphic.Widgets').toRun(function() {

lively.BuildSpec('lively.ide.tools.StyleEditor', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(331.0,486.0),
    _Position: lively.pt(833.0,102.0),
    cameForward: true,
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(4.0,22.0),
    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
    draggingEnabled: true,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "StyleEditorPane",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(319.8,455.4),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        _Scale: 1.01,
        className: "lively.morphic.Box",
        doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
        droppingEnabled: true,
        isCopyMorphRef: true,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        layoutProps: ["adjustForNewBounds","resizeWidth","resizeHeight","moveVertical","moveHorizontal","centeredHorizontal","centeredVertical","scaleHorizontal","scaleVertical"],
        morphRefId: 1,
        name: "StyleEditorPane",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _Align: "center",
            _BorderColor: Color.rgb(95,94,95),
            _BorderRadius: 4.8100000000000005,
            _BorderWidth: 1.6280000000000001,
            _Extent: lively.pt(300.9,23.3),
            _Fill: Color.rgb(238,238,238),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 12,
            _MaxTextWidth: 282.66991886377764,
            _MinTextWidth: 282.66991886377764,
            _Position: lively.pt(10.0,10.0),
            className: "lively.morphic.Text",
            doNotSerialize: ["charsTyped"],
            dontUpdate: false,
            emphasis: [[0,4,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            fixedWidth: true,
            isCopyMorphRef: true,
            layout: {
                adjustForNewBounds: false,
                resizeWidth: true
            },
            morphRefId: 1,
            name: "TargetName",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
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
            _Scale: 0.9900990099009901,
            className: "lively.morphic.TabContainer",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            droppingEnabled: true,
            isInLayoutCycle: false,
            layout: {},
            name: "TabContainer",
            resizedPanes: ["FC64DDA5-337B-4D6D-A80C-9A51D6F02390","B20DEDBC-7052-4FC8-9B99-35CDF81783BB","90DE5048-6FD2-49DA-9A69-4738E538B397","CB0EFC9C-18D6-4132-B300-ECFBA536F5FD","D8DBBF38-C7DB-4162-93A5-0FFE2FB50C00","18FEBB49-5B0F-437A-850A-C327B83E4AE0"],
            sourceModule: "lively.morphic.AdditionalMorphs",
            submorphs: [{
                _BorderColor: Color.rgb(204,204,204),
                _Extent: lively.pt(300.0,30.0),
                adjustedTabSizes: true,
                className: "lively.morphic.TabBar",
                doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
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
                    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
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
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,10,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
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
                    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
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
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,3,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
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
                    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
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
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,6,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        evalEnabled: false,
                        eventsAreDisabled: true,
                        eventsAreIgnored: true,
                        fixedHeight: true,
                        fixedWidth: true,
                        isLabel: true,
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Layout"
                    }],
                    tabBarOffset: 196
                }]
            },{
                _BorderColor: Color.rgb(204,204,204),
                _BorderWidth: 1.332,
                _Extent: lively.pt(300.0,360.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(0.0,30.0),
                className: "lively.morphic.TabPane",
                doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
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
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,18,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text10",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "adjustForNewBounds"
                },{
                    _Extent: lively.pt(64.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,40.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,11,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text11",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "resizeWidth"
                },{
                    _Extent: lively.pt(69.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,60.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,12,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text12",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "resizeHeight"
                },{
                    _Extent: lively.pt(71.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,80.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,12,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text13",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "moveVertical"
                },{
                    _Extent: lively.pt(86.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,100.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,14,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text14",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "moveHorizontal"
                },{
                    _Extent: lively.pt(104.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,120.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,18,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text15",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "centeredHorizontal"
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,20.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
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
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,40.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
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
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,60.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
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
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,80.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
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
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,100.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
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
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,120.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
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
                }
                },{
                    _Extent: lively.pt(89.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,140.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,16,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text16",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "centeredVertical"
                },{
                    _Extent: lively.pt(85.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,160.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,15,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text17",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "scaleHorizontal"
                },{
                    _Extent: lively.pt(70.0,15.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 9,
                    _Position: lively.pt(20.0,180.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,13,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text18",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "scaleVertical"
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,140.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
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
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,160.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
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
                }
                },{
                    _BorderColor: Color.rgb(204,0,0),
                    _Extent: lively.pt(12.0,12.0),
                    _Position: lively.pt(170.0,180.0),
                    _Scale: 1.01,
                    className: "lively.morphic.CheckBox",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
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
                }
                },{
                    _ClipMode: "auto",
                    _Extent: lively.pt(148.1,23.0),
                    _Fill: Color.rgb(243,243,243),
                    _Position: lively.pt(20.0,220.0),
                    _Scale: 1.01,
                    className: "lively.morphic.DropDownList",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
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
                    }],
                    name: "layouterList",
                    selectOnMove: false,
                    selectedLineNo: 0,
                    selection: null,
                    sourceModule: "lively.morphic.Core",
                    submorphs: [],
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setLayouter", {});
                },
                    setup: function setup() {
                    var layoutClasses = [lively.morphic.Layout.HorizontalLayout,
                            lively.morphic.Layout.TightHorizontalLayout,
                            lively.morphic.Layout.VerticalLayout,
                            lively.morphic.Layout.JournalLayout];
                
                    var items = layoutClasses.collect(function(ea) {
                            return {isListItem: true, string: ea.name, value: ea.type} 
                    });
                
                    items.unshift({isListItem: true, string: 'none', value: null})
                    this.setList(items)
                }
                },{
                    _BorderColor: Color.rgb(214,214,214),
                    _BorderRadius: 5,
                    _BorderWidth: 1,
                    _Extent: lively.pt(258.4,23.8),
                    _Fill: lively.morphic.Gradient.create({
                  stops: [{
                    color: Color.rgb(245,245,245),
                    offset: 0
                  },{
                    color: Color.rgb(221,221,221),
                    offset: 0.3
                  },{
                    color: Color.rgb(221,221,221),
                    offset: 0.7
                  },{
                    color: Color.rgb(204,204,204),
                    offset: 1
                  }],
                  type: "linear",
                  vector: lively.rect(0,0,0,1)
                }),
                    _Position: lively.pt(20.0,260.0),
                    _Scale: 1.01,
                    className: "lively.morphic.Button",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    isPressed: false,
                    label: "Configure Layout",
                    lighterFill: lively.morphic.Gradient.create({
                  stops: [{
                    color: Color.rgb(250,250,250),
                    offset: 0
                  },{
                    color: Color.rgb(232,232,232),
                    offset: 0.4
                  },{
                    color: Color.rgb(232,232,232),
                    offset: 0.6
                  },{
                    color: Color.rgb(248,248,248),
                    offset: 1
                  }],
                  type: "linear",
                  vector: lively.rect(0,0,0,1)
                }),
                    name: "layoutConfigButton",
                    normalFill: lively.morphic.Gradient.create({
                  stops: [{
                    color: Color.rgb(245,245,245),
                    offset: 0
                  },{
                    color: Color.rgb(209,209,209),
                    offset: 0.4
                  },{
                    color: Color.rgb(209,209,209),
                    offset: 0.6
                  },{
                    color: Color.rgb(240,240,240),
                    offset: 1
                  }],
                  type: "linear",
                  vector: lively.rect(0,0,0,1)
                }),
                    padding: lively.rect(5,0,0,0),
                    showsMorphMenu: true,
                    sourceModule: "lively.morphic.Widgets",
                    submorphs: [],
                    toggle: false,
                    value: false,
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "fire", this.get("StyleEditorPane"), "openLayoutConfigurator", {});
                }
                }],
                tab: 2
            },{
                _BorderColor: Color.rgb(204,204,204),
                _BorderWidth: 1.1840000000000002,
                _Extent: lively.pt(300.0,360.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(0.0,30.0),
                className: "lively.morphic.TabPane",
                doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true
                },
                name: "CSS - Pane",
                sourceModule: "lively.morphic.AdditionalMorphs",
                submorphs: [{
                    _BorderColor: Color.rgb(204,204,204),
                    _BorderWidth: 1.4800000000000002,
                    _ClipMode: "auto",
                    _Extent: lively.pt(280.0,280.0),
                    _Fill: Color.rgb(235,235,235),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 8,
                    _MaxTextWidth: 254.04000000000002,
                    _MinTextWidth: 254.04000000000002,
                    _Padding: lively.rect(5,5,0,0),
                    _Position: lively.pt(10.0,10.0),
                    _WordBreak: "break-all",
                    className: "lively.morphic.Text",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    emphasis: [[0,0,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    fixedHeight: true,
                    fixedWidth: true,
                    name: "CSSCodePane",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "savedTextString", this.get("CSSApplyButton"), "onFire", {});
                }
                },{
                    _BorderColor: Color.rgb(204,204,204),
                    _BorderStyle: "double",
                    _BorderWidth: 1.4800000000000002,
                    _Extent: lively.pt(200.0,21.0),
                    _Fill: Color.rgb(235,235,235),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 8,
                    _MaxTextWidth: 174.04,
                    _MinTextWidth: 174.04,
                    _Padding: lively.rect(5,5,0,0),
                    _Position: lively.pt(90.0,300.0),
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,10,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    fixedWidth: true,
                    name: "ClassEdit",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "Morph Text"
                },{
                    _BorderColor: Color.rgb(214,214,214),
                    _BorderRadius: 5.2,
                    _BorderWidth: 1.1840000000000002,
                    _Extent: lively.pt(110.0,20.0),
                    _Fill: lively.morphic.Gradient.create({
                  stops: [{
                    color: Color.rgb(245,245,245),
                    offset: 0
                  },{
                    color: Color.rgb(221,221,221),
                    offset: 0.3
                  },{
                    color: Color.rgb(221,221,221),
                    offset: 0.7
                  },{
                    color: Color.rgb(204,204,204),
                    offset: 1
                  }],
                  type: "linear",
                  vector: lively.rect(0,0,0,1)
                }),
                    _Position: lively.pt(180.0,330.0),
                    _Scale: 0.999890661012608,
                    className: "lively.morphic.Button",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    isPressed: false,
                    label: "Apply",
                    lighterFill: lively.morphic.Gradient.create({
                  stops: [{
                    color: Color.rgb(250,250,250),
                    offset: 0
                  },{
                    color: Color.rgb(232,232,232),
                    offset: 0.4
                  },{
                    color: Color.rgb(232,232,232),
                    offset: 0.6
                  },{
                    color: Color.rgb(248,248,248),
                    offset: 1
                  }],
                  type: "linear",
                  vector: lively.rect(0,0,0,1)
                }),
                    name: "CSSApplyButton",
                    normalFill: lively.morphic.Gradient.create({
                  stops: [{
                    color: Color.rgb(245,245,245),
                    offset: 0
                  },{
                    color: Color.rgb(209,209,209),
                    offset: 0.4
                  },{
                    color: Color.rgb(209,209,209),
                    offset: 0.6
                  },{
                    color: Color.rgb(240,240,240),
                    offset: 1
                  }],
                  type: "linear",
                  vector: lively.rect(0,0,0,1)
                }),
                    sourceModule: "lively.morphic.Widgets",
                    submorphs: [],
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
                    _BorderWidth: 1.4800000000000002,
                    _Extent: lively.pt(75.0,17.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 8,
                    _Padding: lively.rect(5,5,0,0),
                    _Position: lively.pt(10.0,300.0),
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,13,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    name: "Text22",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
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
                doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true
                },
                name: "Appearance - Pane",
                sourceModule: "lively.morphic.AdditionalMorphs",
                submorphs: [{
                    _BorderColor: Color.rgb(95,94,95),
                    _BorderRadius: 7.400000000000001,
                    _Extent: lively.pt(275.5,173.4),
                    _Position: lively.pt(0.0,120.0),
                    _Scale: 0.9899907534778297,
                    className: "lively.morphic.Box",
                    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                    droppingEnabled: true,
                    name: "Rectangle1",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(93.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _MaxTextWidth: 92.99198798397993,
                        _MinTextWidth: 92.99198798397993,
                        _Position: lively.pt(20.0,70.0),
                        _Scale: 1.0202115488976824,
                        _Visible: true,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,5,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorBorderWidthLabel",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Width"
                    },{
                        _Extent: lively.pt(95.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _MaxTextWidth: 94.99198798397993,
                        _MinTextWidth: 94.99198798397993,
                        _Position: lively.pt(20.0,100.0),
                        _Scale: 1.0202115488976824,
                        _Visible: true,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,7,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorBorderRadiusLabel",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Radius "
                    },{
                        _Extent: lively.pt(95.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _MaxTextWidth: 94.99198798397993,
                        _MinTextWidth: 94.99198798397993,
                        _Position: lively.pt(20.0,130.0),
                        _Scale: 1.0202115488976824,
                        _Visible: true,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,6,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorBorderStyleLabel",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Style "
                    },{
                        _BorderColor: Color.rgb(102,102,102),
                        _BorderRadius: 6,
                        _BorderWidth: 1,
                        _Extent: lively.pt(150.0,16.0),
                        _Fill: lively.morphic.Gradient.create({
                      stops: [{
                        color: Color.rgb(204,204,204),
                        offset: 0
                      },{
                        color: Color.rgb(240,240,240),
                        offset: 0.4
                      },{
                        color: Color.rgb(245,245,245),
                        offset: 1
                      }],
                      type: "linear",
                      vector: lively.rect(0,0,0,1)
                    }),
                        _Position: lively.pt(100.0,70.0),
                        _Scale: 1.0202115488976824,
                        _Visible: true,
                        className: "lively.morphic.Slider",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
                        droppingEnabled: true,
                        name: "borderWidthSlider",
                        sliderExtent: 0.1,
                        sliderKnob: "<lively.morphic.SliderKnob#32A45...>",
                        sourceModule: "lively.morphic.Widgets",
                        styleClass: ["slider_background_horizontal"],
                        submorphs: [{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(15.0,16.0),
                            _Fill: lively.morphic.Gradient.create({
                          stops: [{
                            color: Color.rgb(196,211,221),
                            offset: 0
                          },{
                            color: Color.rgb(137,167,187),
                            offset: 0.5
                          },{
                            color: Color.rgb(96,130,153),
                            offset: 1
                          }],
                          type: "linear",
                          vector: lively.rect(0,0,0,1)
                        }),
                            __layered_draggingEnabled__: true,
                            className: "lively.morphic.SliderKnob",
                            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                            droppingEnabled: true,
                            hitPoint: lively.pt(298.0,651.0),
                            slider: "<lively.morphic.Slider#AB731... - borderWidthSlider>",
                            sourceModule: "lively.morphic.Widgets",
                            styleClass: ["slider_horizontal"],
                            submorphs: []
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
                        _Fill: lively.morphic.Gradient.create({
                      stops: [{
                        color: Color.rgb(204,204,204),
                        offset: 0
                      },{
                        color: Color.rgb(240,240,240),
                        offset: 0.4
                      },{
                        color: Color.rgb(245,245,245),
                        offset: 1
                      }],
                      type: "linear",
                      vector: lively.rect(0,0,0,1)
                    }),
                        _Position: lively.pt(100.0,100.0),
                        _Scale: 1.0202115488976824,
                        _Visible: true,
                        className: "lively.morphic.Slider",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
                        droppingEnabled: true,
                        name: "borderRadiusSlider",
                        sliderExtent: 0.1,
                        sliderKnob: "<lively.morphic.SliderKnob#4F885...>",
                        sourceModule: "lively.morphic.Widgets",
                        styleClass: ["slider_background_horizontal"],
                        submorphs: [{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(15.0,16.0),
                            _Fill: lively.morphic.Gradient.create({
                          stops: [{
                            color: Color.rgb(196,211,221),
                            offset: 0
                          },{
                            color: Color.rgb(137,167,187),
                            offset: 0.5
                          },{
                            color: Color.rgb(96,130,153),
                            offset: 1
                          }],
                          type: "linear",
                          vector: lively.rect(0,0,0,1)
                        }),
                            __layered_draggingEnabled__: true,
                            className: "lively.morphic.SliderKnob",
                            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                            droppingEnabled: true,
                            hitPoint: lively.pt(828.0,410.0),
                            slider: "<lively.morphic.Slider#2DA0E... - borderRadiusSlider>",
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
                    }
                    },{
                        _Extent: lively.pt(85.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _MaxTextWidth: 85,
                        _MinTextWidth: 85,
                        _Position: lively.pt(20.0,10.0),
                        _Scale: 1.0120783653693806,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,6,{
                            fontWeight: "bold",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "Text2",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Border"
                    },{
                        _Extent: lively.pt(93.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _MaxTextWidth: 92.99198798397993,
                        _MinTextWidth: 92.99198798397993,
                        _Position: lively.pt(20.0,40.0),
                        _Scale: 1.0284100916674896,
                        _Visible: true,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,5,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorBorderColorLabel",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Color"
                    },{
                        _Extent: lively.pt(238.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _MaxTextWidth: 238.04543304423882,
                        _MinTextWidth: 238.04543304423882,
                        _Position: lively.pt(20.0,70.0),
                        _Scale: 1.0120783653693808,
                        _Visible: false,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,34,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorBorderMsg",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Border is styled through CSS only\n\
                    "
                    },{
                        _BorderColor: Color.rgb(189,190,192),
                        _BorderRadius: 5,
                        _BorderWidth: 1,
                        _Extent: lively.pt(40.0,30.0),
                        _Fill: lively.morphic.Gradient.create({
                      stops: [{
                        color: Color.rgb(245,245,245),
                        offset: 0
                      },{
                        color: Color.rgb(221,221,221),
                        offset: 0.3
                      },{
                        color: Color.rgb(221,221,221),
                        offset: 0.7
                      },{
                        color: Color.rgb(204,204,204),
                        offset: 1
                      }],
                      type: "linear",
                      vector: lively.rect(0,0,0,1)
                    }),
                        _Position: lively.pt(100.0,34.0),
                        _Scale: 1.0101104444531506,
                        _Visible: true,
                        className: "lively.morphic.AwesomeColorField",
                        color: Color.rgb(0,0,0),
                        colorDisplay: "<lively.morphic.Box#E1A30...>",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
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
                            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                            droppingEnabled: true,
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
                        lively.bindings.connect(this, "color", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (fill) { return {borderColor: fill} }});
                    }
                    },{
                        _ClipMode: "auto",
                        _Extent: lively.pt(150.0,21.0),
                        _Fill: Color.rgb(243,243,243),
                        _Position: lively.pt(100.0,130.0),
                        _Scale: 1.0202115488976822,
                        _Visible: true,
                        className: "lively.morphic.DropDownList",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
                        droppingEnabled: true,
                        itemList: ["solid","hidden","dotted","dashed","double","groove","ridge","inset","outset"],
                        name: "borderStyleList",
                        selectOnMove: false,
                        selectedLineNo: 0,
                        selection: "solid",
                        sourceModule: "lively.morphic.Core",
                        submorphs: [],
                        valueScale: 1,
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (v) { return {borderStyle: v} }});
                    }
                    },{
                        _BorderColor: Color.rgb(204,0,0),
                        _Extent: lively.pt(12.0,12.0),
                        _Position: lively.pt(250.0,10.0),
                        _Scale: 1.01,
                        checked: true,
                        className: "lively.morphic.CheckBox",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
                        droppingEnabled: true,
                        name: "BorderCheckBox",
                        sourceModule: "lively.morphic.Widgets",
                        submorphs: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setBorderMode", {});
                    }
                    }]
                },{
                    _BorderColor: Color.rgb(95,94,95),
                    _BorderRadius: 7.400000000000001,
                    _Extent: lively.pt(272.2,110.9),
                    _Position: lively.pt(0.0,10.0),
                    className: "lively.morphic.Box",
                    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                    droppingEnabled: true,
                    name: "Filldialog",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [{
                        _Extent: lively.pt(63.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: "11",
                        _MaxTextWidth: 62.991987983979925,
                        _MinTextWidth: 62.991987983979925,
                        _Position: lively.pt(20.0,70.0),
                        _Scale: 1.0080361203307941,
                        _Visible: true,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,7,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorOpacityLabel",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Opacity"
                    },{
                        _BorderColor: Color.rgb(102,102,102),
                        _BorderRadius: 6,
                        _BorderWidth: 1,
                        _Extent: lively.pt(150.0,16.0),
                        _Fill: lively.morphic.Gradient.create({
                      stops: [{
                        color: Color.rgb(204,204,204),
                        offset: 0
                      },{
                        color: Color.rgb(240,240,240),
                        offset: 0.4
                      },{
                        color: Color.rgb(245,245,245),
                        offset: 1
                      }],
                      type: "linear",
                      vector: lively.rect(0,0,0,1)
                    }),
                        _Position: lively.pt(100.0,70.0),
                        _Scale: 1.0080361203307941,
                        _Visible: true,
                        className: "lively.morphic.Slider",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
                        droppingEnabled: true,
                        name: "opacitySlider",
                        sliderExtent: 0.1,
                        sliderKnob: "<lively.morphic.SliderKnob#645B1...>",
                        sourceModule: "lively.morphic.Widgets",
                        styleClass: ["slider_background_horizontal"],
                        submorphs: [{
                            _BorderColor: Color.rgb(102,102,102),
                            _BorderRadius: 6,
                            _BorderWidth: 1,
                            _Extent: lively.pt(15.0,16.0),
                            _Fill: lively.morphic.Gradient.create({
                          stops: [{
                            color: Color.rgb(196,211,221),
                            offset: 0
                          },{
                            color: Color.rgb(137,167,187),
                            offset: 0.5
                          },{
                            color: Color.rgb(96,130,153),
                            offset: 1
                          }],
                          type: "linear",
                          vector: lively.rect(0,0,0,1)
                        }),
                            _Position: lively.pt(135.0,0.0),
                            __layered_draggingEnabled__: true,
                            className: "lively.morphic.SliderKnob",
                            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                            droppingEnabled: true,
                            hitPoint: lively.pt(981.0,273.0),
                            slider: "<lively.morphic.Slider#F3855... - opacitySlider>",
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
                    }
                    },{
                        _Extent: lively.pt(85.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _MaxTextWidth: 85,
                        _MinTextWidth: 85,
                        _Position: lively.pt(20.0,10.0),
                        _Scale: 1.0040100200350563,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,4,{
                            fontWeight: "bold",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "Text1",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Fill"
                    },{
                        _Extent: lively.pt(85.0,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _MaxTextWidth: 85,
                        _MinTextWidth: 85,
                        _Position: lively.pt(20.0,40.0),
                        _Scale: 1.0080361203307944,
                        _Visible: true,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,6,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorFillColorLabel",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Color\n\
                    "
                    },{
                        _Extent: lively.pt(219.1,19.0),
                        _FontFamily: "Arial, sans-serif",
                        _FontSize: 11,
                        _MaxTextWidth: 219.12131912021988,
                        _MinTextWidth: 219.12131912021988,
                        _Position: lively.pt(20.0,40.0),
                        _Scale: 1.0040100200350566,
                        _Visible: false,
                        className: "lively.morphic.Text",
                        doNotSerialize: ["charsTyped"],
                        emphasis: [[0,32,{
                            fontWeight: "normal",
                            italics: "normal"
                        }]],
                        fixedWidth: true,
                        name: "StyleEditorFillMsg",
                        sourceModule: "lively.morphic.TextCore",
                        submorphs: [],
                        textString: "Fill is styled through CSS only\n\
                    "
                    },{
                        _BorderColor: Color.rgb(189,190,192),
                        _BorderRadius: 5,
                        _BorderWidth: 1,
                        _Extent: lively.pt(40.0,30.0),
                        _Fill: lively.morphic.Gradient.create({
                      stops: [{
                        color: Color.rgb(245,245,245),
                        offset: 0
                      },{
                        color: Color.rgb(221,221,221),
                        offset: 0.3
                      },{
                        color: Color.rgb(221,221,221),
                        offset: 0.7
                      },{
                        color: Color.rgb(204,204,204),
                        offset: 1
                      }],
                      type: "linear",
                      vector: lively.rect(0,0,0,1)
                    }),
                        _Position: lively.pt(100.0,34.0),
                        _Visible: true,
                        className: "lively.morphic.AwesomeColorField",
                        color: null,
                        colorDisplay: "<lively.morphic.Box#16081...>",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
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
                            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                            droppingEnabled: true,
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
                        lively.bindings.connect(this, "color", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                    function (fill) { return {fill: fill} }});
                    }
                    },{
                        _BorderColor: Color.rgb(204,0,0),
                        _Extent: lively.pt(12.0,12.0),
                        _Position: lively.pt(250.0,10.0),
                        _Scale: 0.998001,
                        checked: true,
                        className: "lively.morphic.CheckBox",
                        doNotCopyProperties: [],
                        doNotSerialize: [],
                        droppingEnabled: true,
                        name: "AppearanceCheckBox",
                        sourceModule: "lively.morphic.Widgets",
                        submorphs: [],
                        connectionRebuilder: function connectionRebuilder() {
                        lively.bindings.connect(this, "checked", this.get("StyleEditorPane"), "setAppearanceMode", {});
                    }
                    }]
                },{
                    _Extent: lively.pt(139.0,19.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: 11,
                    _MaxTextWidth: 139.00590495096034,
                    _MinTextWidth: 139.00590495096034,
                    _Position: lively.pt(20.0,290.0),
                    _Scale: 0.999890661012608,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,4,{
                        fontWeight: "bold",
                        italics: "normal"
                    }]],
                    fixedWidth: true,
                    name: "Text3",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "Misc"
                },{
                    _ClipMode: "auto",
                    _Extent: lively.pt(150.0,21.0),
                    _Fill: Color.rgb(243,243,243),
                    _Position: lively.pt(100.0,320.0),
                    _Scale: 1.02,
                    _Visible: true,
                    className: "lively.morphic.DropDownList",
                    doNotCopyProperties: [],
                    doNotSerialize: [],
                    droppingEnabled: true,
                    itemList: ["visible","hidden","scroll","auto","inherit"],
                    name: "ClipModeList",
                    selectOnMove: false,
                    selectedLineNo: 0,
                    selection: "visible",
                    sourceModule: "lively.morphic.Core",
                    submorphs: [],
                    valueScale: 1,
                    connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "selection", this.get("StyleEditorPane"), "setTargetStyle", {converter: 
                function (v) { return {clipMode: v} }});
                }
                },{
                    _Extent: lively.pt(95.0,19.0),
                    _FontFamily: "Arial, sans-serif",
                    _FontSize: "11",
                    _MaxTextWidth: 94.99198798397993,
                    _MinTextWidth: 94.99198798397993,
                    _Position: lively.pt(20.0,320.0),
                    _Scale: 1.02,
                    _Visible: true,
                    className: "lively.morphic.Text",
                    doNotSerialize: ["charsTyped"],
                    emphasis: [[0,9,{
                        fontWeight: "normal",
                        italics: "normal"
                    }]],
                    fixedWidth: true,
                    name: "Text9",
                    sourceModule: "lively.morphic.TextCore",
                    submorphs: [],
                    textString: "Clip mode"
                }],
                tab: 0
            }],
            tabBar: "<lively.morphic.TabBar#81648...>",
            tabBarStrategy: "lively.morphic.TabStrategyTop",
            tabPaneExtent: lively.pt(300.0,300.0)
        }],
        withLayers: "[[ScriptListUpdateLayer]]",
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
            var newLayoutClass = Class.forName(layoutClassName);
    
        if (!this.target) return;
    
        var currentLayoutClass = this.target.getLayouter() && 
            Class.getConstructor(this.target.getLayouter());
    
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
    withoutLayers: "[[GrabbingLayer]]",
    setTarget: function setTarget(target) {
    this.get('StyleEditorPane').setTarget(target);
}
});
}) // end of module