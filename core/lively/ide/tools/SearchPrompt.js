module('lively.ide.tools.SearchPrompt').requires('lively.ide.tools.CommandLine').toRun(function() {

lively.BuildSpec("lively.ide.tools.SearchPrompt", {
    _BorderColor: Color.rgb(123,116,116),
    _BorderRadius: 6,
    _BorderWidth: 1,
    _Extent: lively.pt(280.0,82.0),
    _Fill: Color.rgba(255,255,255,0.8),
    className: "lively.morphic.Box",
    doNotSerialize: ["codeEditor"],
    layout: { adjustForNewBounds: true, resizeHeight: true, resizeWidth: true },
    name: "SearchPrompt",
    submorphs: [
        lively.BuildSpec('lively.ide.tools.CommandLine').customize({
            _BorderColor: Color.rgb(133,133,133),
            _BorderStyle: "inset",
            _BorderWidth: 1.5,
            _Extent: lively.pt(256.5,20.5),
            _Fill: Color.rgba(255,20,20,0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(10.0,26.0),
            _ShowActiveLine: false,
            _ShowErrors: false,
            _ShowGutter: false,
            _ShowIndents: false,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _ShowWarnings: false,
            _SoftTabs: true,
            _TextMode: "text",
            layout: { resizeWidth: true },
            name: "searchInput",
            theme: "textmate"}), {
        _Align: "left",
        _ClipMode: "hidden",
        _Extent: lively.pt(129.0,21.0),
        _FontFamily: "Arial, sans-serif",
        _FontSize: 10,
        _HandStyle: "default",
        _InputAllowed: false,
        _Padding: lively.rect(5,5,0,0),
        _Position: lively.pt(8.0,3.0),
        _WhiteSpaceHandling: "pre",
        allowInput: false,
        className: "lively.morphic.Text",
        eventsAreIgnored: true,
        isLabel: true,
        layout: { moveHorizontal: true, resizeWidth: false },
        name: "Text",
        sourceModule: "lively.morphic.TextCore",
        textString: "Enter search term:"
    },{
        _BorderColor: Color.rgb(189,190,192),
        _BorderRadius: 5,
        _BorderWidth: 1,
        _Extent: lively.pt(60.0,20.0),
        _Position: lively.pt(210.0,55.0),
        className: "lively.morphic.Button",
        isPressed: false,
        label: "Next",
        layout: {
            moveHorizontal: true
        },
        name: "nextButton",
        pinSpecs: [{
            accessor: "fire",
            location: 1.5,
            modality: "output",
            pinName: "fire",
            type: "Boolean"
        }],
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this.get("SearchPrompt"), "searchForward", {});
    },
    },{
        _Align: "left",
        _Extent: lively.pt(114.0,19.0),
        _FontFamily: "Arial, sans-serif",
        _HandStyle: "default",
        _InputAllowed: false,
        _Padding: lively.rect(5,5,0,0),
        _Position: lively.pt(25.0,51),
        _WhiteSpaceHandling: "pre",
        allowInput: false,
        className: "lively.morphic.Text",
        eventsAreIgnored: true,
        isLabel: true,
        name: "Text1",
        submorphs: [{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(12.0,12.0),
            _Position: lively.pt(-17.0,3.0),
            checked: false,
            className: "lively.morphic.CheckBox",
            droppingEnabled: true,
            name: "reCheckBox",
            sourceModule: "lively.morphic.Widgets"
        }],
        textString: "regexp"
    },{
        _BorderColor: Color.rgb(189,190,192),
        _BorderRadius: 5,
        _BorderWidth: 1,
        _Extent: lively.pt(60.0,20.0),
        _Position: lively.pt(145.0,55.0),
        className: "lively.morphic.Button",
        isPressed: false,
        label: "Prev",
        layout: {moveHorizontal: true
        },
        name: "prevButton",
        pinSpecs: [{
            accessor: "fire",
            location: 1.5,
            modality: "output",
            pinName: "fire",
            type: "Boolean"
        }],
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this.get("SearchPrompt"), "searchBackward", {});
    },
    }, {
        _BorderColor: Color.rgb(189,190,192),
        _BorderRadius: 5,
        _BorderWidth: 1,
        _Extent: lively.pt(60.0,20.0),
        _Position: lively.pt(80.0,55.0),
        className: "lively.morphic.Button",
        isPressed: false,
        label: "Occur",
        layout: {moveHorizontal: true
        },
        name: "prevButton",
        pinSpecs: [{
            accessor: "fire",
            location: 1.5,
            modality: "output",
            pinName: "fire",
            type: "Boolean"
        }],
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this.get("SearchPrompt"), "enableOccur", {});
    },
    },{
        _BorderColor: Color.rgb(189,190,192),
        _BorderRadius: 5,
        _BorderWidth: 1,
        _Extent: lively.pt(16.0,18.0),
        _Position: lively.pt(235.0,5.0),
        className: "lively.morphic.Button",
        label: "✔",
        name: "WindowControl",
        sourceModule: "lively.morphic.Widgets",
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this, "onFire", {});
    },
        onFire: function onFire() {
        this.owner.endSearch();
    }
    }, {
        _BorderColor: Color.rgb(189,190,192),
        _BorderRadius: 5,
        _BorderWidth: 1,
        _Extent: lively.pt(16.0,18.0),
        _Position: lively.pt(255.0,5.0),
        className: "lively.morphic.Button",
        label: "X",
        name: "WindowControl",
        sourceModule: "lively.morphic.Widgets",
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this, "onFire", {});
    },
        onFire: function onFire() {
        this.owner.cancelSearch();
    }
    }],
    cancelSearch: function cancelSearch() {
        // end search and jump back to start pos
        if (this.startRange) {
            this.codeEditor.setSelectionRangeAce(this.startRange);
        }
        this.endSearch();
},
    endSearch: function endSearch() {
    this.codeEditor && this.codeEditor.focus();
    this.codeEditor = null;
    this.startRange = null;
    this.remove();
},
    codeEditorCheck: function codeEditorCheck() {
    if (this.codeEditor) return true;
    this.world().alert('SearchPrompt has no code editor!');
    return false
},
    enableOccur: function enableOccur() {
        var occurStartCommand = lively.ide.ace.require("ace/commands/occur_commands").occurStartCommand;
        var oop = lively.ide.ace.require("ace/lib/oop");
        var codeEditor = this.codeEditor;
        var ed = codeEditor.aceEditor;
        ed.$search.$options.needle = this.getSearchTerm();
        ed.$search.$assembleRegExp(ed.$search.$options);
        var searchOpts = oop.mixin({}, ed.$search.$options);
        this.endSearch();
        occurStartCommand.exec(ed, searchOpts);
        ed.once('mousedown', function() {
            var cmds = ed.getKeyboardHandler().commands;
            if (!cmds.occuraccept) return;
            setTimeout(function() {
                cmds.occuraccept.exec(ed);
                var sel = ed.session.selection
                sel.clearSelection(); sel.selectLine(); sel.selectLeft();
            },500);
        })
    },

    getSearchTerm: function getSearchTerm() {
    if (!this.codeEditorCheck()) return;
    var e = this.codeEditor;
    var input = this.get('searchInput');
    var text = input.textString;
    var asRe = this.get('reCheckBox').isChecked();
    return asRe ? new RegExp(text, 'ig') : text;
},
    onKeyDown: function onKeyDown(evt) {
    var keys = evt.getKeyString();
    switch (keys) {
        case 'Control-F': case 'Command-F':
            /*do nothing*/ evt.stop(); return true;
        case 'Control-G': case 'Command-G':
        case 'Enter': case 'F3':
            this.searchForward(); evt.stop(); return true;
        case 'Control-Shift-G': case 'Command-Shift-G':
        case 'Shift-Enter': case "Shift-F3":
            this.searchBackward(); evt.stop(); return true;
        case 'Escape': case 'Esc': this.endSearch(); evt.stop(); return true;
        default:
            return $super(evt);
    }
},
    openForCodeEditor: function openForCodeEditor(ed) {
    this.openInWorld();
    this.align(this.bounds().topRight(), ed.globalBounds().topRight());
    this.get('searchInput').focus();
    this.get('searchInput').focus();
    var searchTerm = ed.getCurrentSearchTerm();
    this.get('searchInput').textString = Object.isRegExp(searchTerm) ?
        searchTerm = searchTerm.source : searchTerm;
    this.setCodeEditor(ed);
},
    reset: function reset() {
    this.doNotSerialize = ['codeEditor', 'startRange'];
    this.codeEditor = null;
    this.get('searchInput').textString = '';
    lively.bindings.connect(this.get('prevButton'), 'fire', this, 'searchBackward');
    lively.bindings.connect(this.get('nextButton'), 'fire', this, 'searchForward');
},
    searchBackward: function searchBackward() {
    if (!this.codeEditorCheck()) return;
    var e = this.codeEditor;
    var needle = this.getSearchTerm();
    e.find({
        needle: needle,
        backwards: true,
        preventScroll: false,
        skipCurrent: true,
        wrap: true,
        animate: true
    });
},
    searchForward: function searchForward() {
    if (!this.codeEditorCheck()) return;
    var e = this.codeEditor;
    var needle = this.getSearchTerm();
    e.find({
        needle: needle,
        backwards: false,
        preventScroll: false,
        skipCurrent: true,
        wrap: true,
        animate: true
    });
},
    setCodeEditor: function setCodeEditor(ed) {
    this.codeEditor = ed;
    this.startRange = ed.getSelectionRangeAce();
},
onFromBuildSpecCreated: function onFromBuildSpecCreated() {
    $super();
    this.get("searchInput").commandHistory = lively.ide.tools.CommandLine.getHistory("lively.ide.tools.SearchPrompt");
}
})

}) // end of module