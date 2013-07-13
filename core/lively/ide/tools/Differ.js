module('lively.ide.tools.Differ').requires('lively.persistence.BuildSpec', 'lively.ide.CommandLineInterface').toRun(function() {

lively.BuildSpec('lively.ide.tools.Differ', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(869.0,537.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    layout: {adjustForNewBounds: true},
    name: "TextDiffer",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(859.0,509.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        grabbingEnabled: false,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        submorphs: [{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(429.0,211.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(1.0,0.0),
            _TextMode: "text",
            _ShowGutter: false,
            _Theme: "twilight",
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            grabbingEnabled: false,
            layout: {
                resizeHeight: false,
                resizeWidth: false,
                scaleHorizontal: true,
                scaleVertical: false
            },
            name: "a",
            sourceModule: "lively.ide.CodeEditor",
            theme: 'twilight',
            textString: "a"
        }, {
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(428.0,211.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(430.4,-0.0),
            _ShowGutter: false,
            _TextMode: "text",
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            grabbingEnabled: false,
            layout: {resizeHeight: false,resizeWidth: false,scaleHorizontal: true,scaleVertical: false},
            name: "b",
            sourceModule: "lively.ide.CodeEditor",
            theme: 'twilight',
            textString: "b",
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(382.0,213.0),
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "Diff",
            layout: {scaleHorizontal: true},
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
            _TextMode: "diff",
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            grabbingEnabled: false,
            layout: {resizeHeight: true,resizeWidth: true},
            name: "result",
            sourceModule: "lively.ide.CodeEditor",
            theme: 'twilight',
            textMode: "diff"
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
                var toFocus, a = this.get('a'), b = this.get('b'), result = this.get('result');
                if (a.textString === "a") toFocus = a;
                else if (b.textString === "b") toFocus = b;
                else toFocus = result;
                toFocus.focus();
            }
    }],
    titleBar: "Differ"
});

}) // end of module