module('lively.ide.tools.TextEditor').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.TextEditor', {
    _Extent: pt(600, 400),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    layout: {
        adjustForNewBounds: true
    },
    state: "expanded",
    submorphs: [{
        _BorderWidth: 1,
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        name: 'container',
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        submorphs: [{
            className: "lively.morphic.Text",
            name: 'urlText',
            _ClipMode: "hidden",
            _Fill: Color.rgb(243,243,243),
            _FontFamily: "Helvetica",
            _TextColor: Color.rgb(64,64,64),
            _WordBreak: "break-all",
            evalEnabled: false,
            fixedHeight: true,
            fixedWidth: true,
            grabbingEnabled: false,
            isInputLine: true,
            layout: {
                resizeWidth: true
            },
            textString: "http://localhost:9001/blank.html"
        },{
            className: "lively.morphic.Button",
            name: 'saveButton',
            _BorderColor: Color.rgb(189,190,192),
            _BorderWidth: 1,
            _Extent: lively.pt(300.0,30.0),
            _Position: lively.pt(0.0,30.0),
            droppingEnabled: false,
            grabbingEnabled: false,
            label: "save",
            layout: {
                resizeWidth: true
            },
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderWidth: 1,
            _Extent: lively.pt(300.0,30.0),
            _Position: lively.pt(300.0,30.0),
            className: "lively.morphic.Button",
            name: 'loadButton',
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "load",
            layout: {
                moveHorizontal: true,
                resizeWidth: false
            },
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderWidth: 1,
            _Extent: lively.pt(300.0,30.0),
            _Position: lively.pt(600.0,30.0),
            className: "lively.morphic.Button",
            name: 'removeButton',
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "remove",
            layout: {
                moveHorizontal: true,
                resizeWidth: false
            },
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false
        },{
            _FontFamily: "Monaco",
            className: "lively.morphic.CodeEditor",
            name: 'editor',
            fixedHeight: true,
            fixedWidth: true,
            grabbingEnabled: false,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            sourceModule: "lively.ide.CodeEditor",
            textString: "emtpy"
        }],
    }],
    titleBar: "TextEditor",
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.applyLayout();
    },
    getLayouter: function getLayouter() {
        return {
            onSubmorphAdded: function() {},
            onSubmorphRemoved: function() {},
            handlesSubmorphResized: function() { return false; },
            layout: function(win, submorphs) {
                if (win.inLayoutCycle) return;
                win.inLayoutCycle = true;
                var urlText = win.get('urlText'),
                    editor = win.get('editor'),
                    loadButton = win.get('loadButton'),
                    saveButton = win.get('saveButton'),
                    removeButton = win.get('removeButton'),
                    container = win.get('container');
                container.setBounds(win.innerBounds().insetByRect(lively.rect(win.contentOffset, pt(4,4))));
                urlText.setBounds(container.getExtent().withY(18).extentAsRectangle());
                var third = container.getExtent().x/3, pos = urlText.bounds().bottomLeft();
                loadButton.setBounds(pos.extent(pt(third, 22)));
                saveButton.setBounds(pos.withX(third).extent(pt(third, 22)));
                removeButton.setBounds(pos.withX(2*third).extent(pt(third, 22)));
                editor.setBounds(lively.rect(loadButton.bounds().bottomLeft(), container.innerBounds().bottomRight()));
                win.inLayoutCycle = false;
            }
        }
    },
    connectionRebuilder: function connectionRebuilder() {
        var urlText = this.get('urlText'),
            editor = this.get('editor'),
            loadButton = this.get('loadButton'),
            saveButton = this.get('saveButton'),
            removeButton = this.get('removeButton'),
            container = this.get('container');
        lively.bindings.connect(loadButton, 'fire', this, 'loadFile')
        lively.bindings.connect(removeButton, 'fire', this, 'removeFile')
        lively.bindings.connect(saveButton, 'fire', this, 'saveFile');
        lively.bindings.connect(editor, 'savedTextString', this, 'saveFile');
    },
    getWebResource: function getWebResource() {
        return new URL(this.get('urlText').textString).asWebResource();
    },
    loadFile: function loadFile() {
        var webR = this.getWebResource();
        connect(webR, 'content', this.get('editor'), 'textString');
        connect(webR, 'status', this.get('editor'), 'setTextMode', {updater: function($upd, status) {
            if (!status.isDone()) return;
            var ext = this.sourceObj.getURL().extension();
            switch(ext) {
                case "css": $upd("css"); return;
                case "diff": $upd("diff"); return;
                case "html": $upd("html"); return;
                case "js": $upd("javascript"); return;
                case "md": $upd("markdown"); return;
                case "sh": $upd("sh"); return;
                case "xml": $upd("xml"); return;
                case "svg": $upd("svg"); return;
                default: $upd("text");
            }
        }});
        webR.beAsync().forceUncached().get();
    },
    saveFile: function saveFile() {
        var webR = this.getWebResource();
        webR.statusMessage(webR.getURL() + ' saved', webR.getURL() + ' could not be saved!');
        webR.beAsync().put(this.get('editor').textString);
    },
    removeFile: function removeFile() {
        var webR = this.getWebResource();
        webR.statusMessage(webR.getURL() + ' removed', webR.getURL() + ' could not removed!');
        webR.beAsync().del();
    },
    openURL: function openURL(url) {
        this.get('urlText').textString = String(url);
        this.loadFile();
    }
});

}) // end of module