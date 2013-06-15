module('lively.ide.tools.Differ').requires('lively.ide.CommandLineInterface').toRun(function() {

lively.BuildSpec('lively.ide.tools.Differ', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(869.0,537.0),
    _Position: lively.pt(277.5,76.0),
    cameForward: false,
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
    name: "Rectangle2",
    prevDragPos: lively.pt(554.0,80.0),
    sourceModule: "lively.morphic.Widgets",
    state: "shutdown",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(859.0,509.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
        grabbingEnabled: false,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "Rectangle2",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(429.0,211.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(1.0,0.0),
            _StyleClassNames: ["Morph","CodeEditor","ace_editor","emacs-mode","ace_nobold","ace_dark","ace_multiselect","ace-twilight"],
            _TextMode: "text",
            _Theme: "twilight",
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
            grabbingEnabled: false,
            hasRobertsKeys: true,
            layout: {
                resizeHeight: false,
                resizeWidth: false,
                scaleHorizontal: true,
                scaleVertical: false
            },
            name: "a",
            sourceModule: "lively.ide.CodeEditor",
            submorphs: [],
            textString: "a",
            theme: "twilight"
        },{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(428.0,211.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(430.4,-0.0),
            _ShowGutter: false,
            _StyleClassNames: ["Morph","CodeEditor","ace_editor","emacs-mode","ace_nobold","ace_dark","ace-twilight"],
            _TextMode: "text",
            _Theme: "twilight",
            _setShowIndents: true,
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
            grabbingEnabled: false,
            hasRobertsKeys: true,
            layout: {
                resizeHeight: false,
                resizeWidth: false,
                scaleHorizontal: true,
                scaleVertical: false
            },
            name: "b",
            sourceModule: "lively.ide.CodeEditor",
            submorphs: [],
            textString: "b",
            theme: "twilight"
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(382.0,213.0),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "Diff",
            layout: {
                scaleHorizontal: true
            },
            name: "Button4",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
                            var a = this.get('a').textString,
                                b = this.get('b').textString,
                                resultText = this.get('result');
                            resultText.textString = 'Diffing...';
                            lively.ide.CommandLineInterface.diff(a, b, function(result) {
                                resultText.textString = result;
                            });
                        }
        },{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(857.0,275.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(1.0,234.0),
            _ShowGutter: false,
            _ShowInvisibles: false,
            _ShowPrintMargin: true,
            _StyleClassNames: ["Morph","CodeEditor","ace_editor","emacs-mode","ace_nobold","ace_dark","ace-twilight"],
            _TextMode: "diff",
            _Theme: "twilight",
            _setShowIndents: true,
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
            grabbingEnabled: false,
            hasRobertsKeys: true,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "result",
            sourceModule: "lively.ide.CodeEditor",
            submorphs: [],
            textMode: "diff",
            theme: "twilight"
        }],
        onKeyDown: function onKeyDown(evt) {
                if (evt.getKeyString() === 'Tab') {
                    if (this.get('a').isFocused()) this.get('b').focus()
                    else this.get('a').focus()
                    evt.stop(); return true;
                }
                return false;
            },
        onWindowGetsFocus: function onWindowGetsFocus() {
                this.get('a').focus();
            }
    }],
    titleBar: "Differ"
});
}) // end of module