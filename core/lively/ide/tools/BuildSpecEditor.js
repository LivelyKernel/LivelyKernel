module('lively.ide.tools.BuildSpecEditor').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.BuildSpecEditor', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(810.0,536.0),
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(4.0,22.0),
    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
    draggingEnabled: true,
    droppingEnabled: false,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "Window",
    prevDragPos: lively.pt(4029.0,92.0),
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(802.0,507.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
        lastCreatedMorph: "<lively.morphic.Box#D7074... - someMorph>",
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "BuildSpecBuilder",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(597.0,496.0),
            _FontSize: 12,
            _Position: lively.pt(8.0,6.0),
            _StyleSheet: "#ace-editor {\n\
            position: absolute;\n\
            top: 0;\n\
        	bottom: 0;\n\
        	left: 0;\n\
        	right: 0;\n\
        	font-family: Monaco,monospace;\n\
        }",
            _TextMode: "javascript",
            _Theme: "twilight",
            accessibleInInactiveWindow: true,
            aceTextModeName: "javascript",
            aceThemeName: "chrome",
            className: "lively.morphic.CodeEditor",
            doNotCopyProperties: [],
            doNotSerialize: [],
            grabbingEnabled: false,
            layout: {
                resizeHeight: false,
                resizeWidth: true
            },
            name: "Spec",
            sourceModule: "lively.ide.CodeEditor",
            submorphs: [],
            textMode: "javascript",
            textString: "return lively.BuildSpec({\n\
            className: \"lively.morphic.Box\",\n\
            name: \"someMorph\",\n\
            _BorderColor: Color.rgb(158,158,158),\n\
            _BorderStyle: \"dashed\",\n\
            _BorderWidth: 4,\n\
            _Extent: pt(100,100),\n\
            _Fill: Color.rgb(255,255,255),\n\
            layout: {adjustForNewBounds: true},\n\
            submorphs: [{\n\
                className: \"lively.morphic.Text\",\n\
                name: \"nameText\",\n\
                _Position: pt(15,40),\n\
                _Extent: lively.pt(30, 16),\n\
                _FontFamily: \"Arial, sans-serif\",\n\
                _FontSize: 10,\n\
                fixedWidth: false,\n\
                layout: {centeredHorizontal: true,moveVertical: true, scaleHorizontal: false}\n\
            }],\n\
            connectionRebuilder: function connectionRebuilder() {\n\
                connect(this, \"name\", this.get(\"nameText\"), \"textString\");\n\
                connect(this.get(\"nameText\"), \"savedTextString\", this, \"name\");\n\
            },\n\
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {\n\
                lively.morphic.show(\'Successfully created %s!\', this);\n\
                lively.bindings.signal(this, \'name\', this.name);\n\
            }\n\
        });",
            theme: "twilight",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "savedTextString", this.get("BuildSpecBuilder"), "createSpecMorph", {});
            // failed to generate rebuild code for AttributeConnection(<lively.morphic.CodeEditor#4D056... - Spec>.name --> null.textString)
        }
        },{
            _BorderColor: Color.rgb(158,158,158),
            _BorderStyle: "dashed",
            _BorderWidth: 4,
            _Extent: lively.pt(100.0,100.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(613.0,6.0),
            className: "lively.morphic.Box",
            doNotCopyProperties: [],
            doNotSerialize: [],
            layout: {
                adjustForNewBounds: true
            },
            name: "someMorph",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _Extent: lively.pt(68.0,16.0),
                _FontFamily: "Arial, sans-serif",
                _HandStyle: null,
                _InputAllowed: true,
                _Position: lively.pt(15.0,40.0),
                _TextColor: Color.rgb(64,64,64),
                allowInput: true,
                className: "lively.morphic.Text",
                doNotCopyProperties: [],
                doNotSerialize: [],
                emphasis: [[0,9,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                layout: {
                    centeredHorizontal: true,
                    moveVertical: true,
                    scaleHorizontal: false
                },
                name: "nameText",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "someMorph",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "savedTextString", this.get("someMorph"), "name", {});
            }
            }],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "name", this.get("nameText"), "textString", {});
        },
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                lively.morphic.show('Successfully created %s!', this);
                lively.bindings.signal(this, 'name', this.name);
            }
        }],
        createSpecMorph: function createSpecMorph(specSource) {
        if (this.lastCreatedMorph && this.lastCreatedMorph.remove) {
            this.lastCreatedMorph.remove();
        }
        var morph;
        try {
            var spec = eval(';(function() {\n' + specSource + '\n})();');
            morph = lively.BuildSpec(spec).createMorph();
        } catch(e) {
            morph = lively.BuildSpec({
                className: 'lively.morphic.Text',
                _Extent: pt(300,200),
                _TextColor: Color.red,
                _FontSize: 16,
                textString: String(e)
            }).createMorph();
        }
        this.lastCreatedMorph = this.addMorph(morph);
        morph.align(
            morph.bounds().topLeft(),
            this.get('Spec').bounds().topRight().addXY(5, 0));
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('Spec').focus();
    }
    }],
    titleBar: "BuildSpecBuilder",
    withoutLayers: "[[GrabbingLayer]]"
});

}) // end of module