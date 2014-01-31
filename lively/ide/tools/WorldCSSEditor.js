module('lively.ide.tools.WorldCSSEditor').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.WorldCSSEditor', {
    _Extent: lively.pt(364.0,334.0),
    className: "lively.morphic.Window",
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "WorldCSS",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(358.0,309.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {adjustForNewBounds: true,resizeHeight: true,resizeWidth: true},
        name: "WorldCSS",
        submorphs: [{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(130.0,21.0),
            _Position: lively.pt(218.0,277),
            className: "lively.morphic.Button",
            label: "Apply CSS",
            layout: {moveHorizontal: true,moveVertical: true},
            name: "Button",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            this.owner.applyWorldCSS();
        }
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 5,
            _BorderWidth: 11,
            _Extent: lively.pt(120.0,21.0),
            _Position: lively.pt(10.0,277),
            className: "lively.morphic.Button",
            label: "Load from file",
            layout: {
                moveVertical: true,
                scaleHorizontal: false
            },
            name: "Button1",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            var wcss= this.owner;
            this.world().prompt('Load CSS from file', function(input) {
                        if (input !== null)
                            wcss.loadFromFile(input || '');
                    }, '');
        }
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(30.0,21.0),
            _Position: lively.pt(184.0,277),
            className: "lively.morphic.Button",
            label: "⟳",
            layout: {
                moveHorizontal: true,
                moveVertical: true
            },
            name: "ReloadButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("WorldCSS"), "updateEditor", {});
        },
            doAction: function doAction() {
            this.owner.applyWorldCSS();
        }
        },{
            _AutocompletionEnabled: true,
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(337,260),
            _FontSize: 11,
            _LineWrapping: false,
            _Position: lively.pt(10.0,10.0),
            _ShowActiveLine: false,
            _ShowErrors: true,
            _ShowGutter: false,
            _ShowIndents: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _ShowWarnings: true,
            _SoftTabs: true,
            _TextMode: "css",
            _Theme: "chrome",
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "CSSCodePane",
            textMode: "css",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "savedTextString", this.get("WorldCSS"), "applyWorldCSS", {});
        }
        }],
        applyWorldCSS: function applyWorldCSS() {
        if (this.world().cssIsEnabled) {
            this.world().setStyleSheet(this.get("CSSCodePane").textString);
            this.updateEditor();
            this.get("CSSCodePane").setStatusMessage('CSS applied', Color.green, 2);
        } else {
            this.get("CSSCodePane").setStatusMessage(
                'StyleSheets module is not loaded, so CSS is not working right now.',
                Color.red, 4);
        }
    },
        loadFromFile: function loadFromFile(file) {
        if (this.world().cssIsEnabled) {
            this.world().loadStyleSheetFromFile(file);
            this.updateEditor();
        } else {
            alert('StyleSheets module is not loaded, so CSS is not working right now.');
        }
    },
        onLoad: function onLoad() {
        this.updateEditor();
    },
        reset: function reset() {
        this.get('CSSCodePane').textString = '';
        connect(this.get('CSSCodePane'), 'savedTextString', this, 'applyWorldCSS');
        connect(this.get('ReloadButton'), 'fire', this, 'updateEditor');
    },
        updateEditor: function updateEditor() {
        if (this.world().cssIsEnabled) {
            var css = this.world().getStyleSheet();
            this.get("CSSCodePane").textString =  css || '';
        } else {
            alert('StyleSheets module is not loaded, so CSS is not working right now.');
        }
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('CSSCodePane').focus();
    }
    }],
    titleBar: "WorldCSS"
})
}) // end of module