module('lively.ide.tools.TextEditor').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.TextEditor', {
    _Extent: pt(600, 400),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
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
        onWindowGetsFocus: function onWindowGetsFocus() {
            this.get('editor').focus();
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
                scaleHorizontal: true
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
                scaleHorizontal: true
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
            // droppingEnabled: false,
            // grabbingEnabled: false,
            label: "remove",
            layout: {
                scaleHorizontal: true
            }
        },{
            _FontFamily: "Monaco",
            className: "lively.morphic.CodeEditor",
            name: 'editor',
            evalEnabled: false,
            grabbingEnabled: false,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            sourceModule: "lively.ide.CodeEditor",
            textString: ""
        }],
    }],
    titleBar: "TextEditor",
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        var win = this,
            urlText = win.get('urlText'),
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
    },
    connectionRebuilder: function connectionRebuilder() {
        var urlText = this.get('urlText'),
            editor = this.get('editor'),
            loadButton = this.get('loadButton'),
            saveButton = this.get('saveButton'),
            removeButton = this.get('removeButton'),
            container = this.get('container');
        lively.bindings.connect(urlText, 'savedTextString', this, 'loadFile');
        lively.bindings.connect(loadButton, 'fire', this, 'loadFile');
        lively.bindings.connect(removeButton, 'fire', this, 'removeFile');
        lively.bindings.connect(saveButton, 'fire', this, 'saveFile');
        lively.bindings.connect(editor, 'savedTextString', this, 'saveFile');
        lively.bindings.connect(this, 'contentLoaded', editor, 'textString');
        lively.bindings.connect(this, 'contentLoaded', editor, 'setTextMode', {updater: function($upd) {
            var ext = this.sourceObj.getFileExtension();
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
    },
    getLocation: function getLocation(asString) {
        var string = this.get('urlText').textString;
        if (asString) return string;
        try {
            return new URL(string);
        } catch(e) {
            return string;
        }
    },
    getFileExtension: function getFileExtension() {
        return this.getLocation(true).split('.').last();
    },
    getWebResource: function getWebResource() {
        var loc = this.getLocation();
        return loc.isURL && loc.asWebResource();
    },
    loadFile: function loadFile() {
        var location = this.getLocation();
        if (location.isURL) {
            this.loadFileNetwork();
        } else {
            this.loadFileFileSystem();
        }
    },
    loadFileFileSystem: function loadFileFileSystem() {
        var self = this, path = this.getLocation(true);
        require("lively.ide.CommandLineInterface").toRun(function() {
            lively.ide.CommandLineInterface.readFile(path, function(err, content) {
                if (err) { self.message(Strings.format("Could not read file.\nError: %s", err)); return; }
                lively.bindings.signal(self, 'contentLoaded', content);
            });
        });
    },
    loadFileNetwork: function loadFileNetwork() {
        var webR = this.getWebResource();
        connect(webR, 'content', this, 'contentLoaded');
        webR.beAsync().forceUncached().get();
    },
    saveFile: function saveFile() {
        var loc = this.getLocation();
        if (loc.isURL) {
            this.saveFileNetwork();
        } else {
            this.saveFileFileSystem();
        }
    },
    saveFileFileSystem: function saveFileFileSystem() {
        var self = this, path = this.getLocation(true);
        require("lively.ide.CommandLineInterface").toRun(function() {
            lively.ide.CommandLineInterface.writeFile(path, content, function(err) {
                if (err) { self.message(Strings.format("Could not write file.\nError: %s", err)); return; }
                lively.bindings.signal(self, 'contentStored');
            });
        });        
    },
    saveFileNetwork: function saveFileNetwork() {
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
    },
    message: function(msg) { this.get('editor').setStatusMessage(m) }
});

}) // end of module