module('lively.ide.tools.TextEditor').requires('lively.persistence.BuildSpec').toRun(function() {

// currently used for filesystem read/write
module("lively.ide.CommandLineInterface").load();

var defaultExtent = lively.Config.defaultTextEditorExtent,
    extent = pt(defaultExtent[0], defaultExtent[1]) || pt(500, 400);

lively.BuildSpec('lively.ide.tools.TextEditor', {
    _Extent: extent,
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    state: "expanded",
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
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
            if (!this.lastFocused) this.lastFocused = this.get('editor');
            this.lastFocused.focus();
        },
        submorphs: [
        lively.BuildSpec('lively.ide.tools.CommandLine').customize({
            _Extent: extent.withY(18),
            clearOnInput: false,
            name: 'urlText',
            layout: {resizeWidth: true},
            focus: function focus() {
                var win = this.getWindow();
                win && win.targetMorph && (win.targetMorph.lastFocused = this);
                return $super();
            }
        }), {
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
            _FontFamily: "Monaco,monospace",
            className: "lively.morphic.CodeEditor",
            name: 'editor',
            evalEnabled: false,
            grabbingEnabled: false,
            theme: Config.get("aceTextEditorTheme"),
            layout: {resizeHeight: true,resizeWidth: true},
            sourceModule: "lively.ide.CodeEditor",
            textString: "",
            focus: function focus() {
                var win = this.getWindow();
                win && win.targetMorph && (win.targetMorph.lastFocused = this);
                return $super();
            }
        }]
    }],
    titleBar: "TextEditor",
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        var win = this,
            editor = win.get('editor'),
            loadButton = win.get('loadButton'),
            saveButton = win.get('saveButton'),
            removeButton = win.get('removeButton'),
            container = win.get('container'),
            urlText = this.get('urlText');
        container.setBounds(win.innerBounds().insetByRect(lively.rect(win.contentOffset, pt(4,4))));
        urlText.setBounds(container.getExtent().withY(18).extentAsRectangle());
        var third = container.getExtent().x/3, pos = pt(0,18);
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
        lively.bindings.connect(this, 'contentStored', this, 'updateWindowTitle');
        lively.bindings.connect(this, 'contentLoaded', editor, 'textString');
        lively.bindings.connect(this, 'contentLoaded', this, 'gotoLocationLine');
        lively.bindings.connect(this, 'contentLoaded', this, 'updateWindowTitle');
        lively.bindings.connect(this, 'contentLoaded', editor, 'setTextMode', {updater: function($upd) {
            var ext = this.sourceObj.getFileExtension().toLowerCase();
            switch(ext) {
                case "r": $upd("r"); return;
                case "css": $upd("css"); return;
                case "diff": $upd("diff"); return;
                case "xhtml": case "html": $upd("html"); return;
                case "js": $upd("javascript"); return;
                case "markdown": case "md": $upd("markdown"); return;
                case "sh": $upd("sh"); return;
                case "xml": $upd("xml"); return;
                case "svg": $upd("svg"); return;
                case "lisp": case "el": $upd("lisp"); return;
                case "clj": $upd("clojure"); return;
                case "cabal": case "hs": $upd("haskell"); return;
                default: $upd("text");
            }
        }});
    },
    getLine: function getLine() {
        var string = this.get('urlText').textString,
            match = string.match(/:([0-9]+)$/);
        return match && Number(match[1]);
    },
    gotoLocationLine: function gotoLocationLine() {
        var line = this.getLine();
        if (!line) return;
        var editor = this.get('editor');
        editor.scrollToRow(line);
        editor.setCursorPosition(pt(0, line-1));
    },
    getLocation: function getLocation(asString) {
        var string = this.get('urlText').textString;
        string = string.replace(/:[0-9]+$/, '');
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
        if (this.getLocation().isURL) {
            this.loadFileNetwork();
        } else {
            this.loadFileFileSystem();
        }
    },
    loadFileFileSystem: function loadFileFileSystem() {
        var path = this.getLocation(true),
            cwd = lively.shell.cwd();
        // if (path.indexOf(cwd) === 0) {
        //     path = path.slice(cwd.length);
        //     if (path[0] === '/' || path[0] === '\\') path = path.slice(1);
        //     var urlText = this.get('urlText');
        //     lively.bindings.noUpdate(function() {
        //         urlText.textString = path;
        //     });
        // }
        lively.ide.CommandLineInterface.readFile(path, {}, function(cmd) {
            var err = cmd.getCode() && cmd.getStderr();
            if (err) { this.message(Strings.format("Could not read file.\nError: %s", err)); return; }
            lively.bindings.signal(this, 'contentLoaded', cmd.getStdout());
        }.bind(this));
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
        var path = lively.shell.makeAbsolute(this.getLocation(true)),
            content = this.get('editor').textString;
        lively.ide.CommandLineInterface.writeFile(path, {content: content}, function(cmd) {
            var err = cmd.getCode() && cmd.getStderr();
            if (err) { this.message(Strings.format("Could not write file.\nError: %s", err), Color.red); return; }
            this.message("File saved successfully.", Color.green);
            lively.bindings.signal(this, 'contentStored');
        }.bind(this));
    },
    saveFileNetwork: function saveFileNetwork() {
        var ed = this;
        var webR = this.getWebResource();
        webR.beAsync().noProxy().put(this.get('editor').textString).whenDone(function(_, status) {
            if (status.isSuccess()) {
                lively.bindings.signal(ed, 'contentStored');
                ed.message(webR.getURL() + ' saved', Color.green);
            } else {
                ed.message('Not saved: ' + status, Color.red);
            }
        });
    },
    updateWindowTitle: function updateWindowTitle() {
        var location = this.getLocation();
        this.setTitle(String(location));
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
    message: function message(/*msg, color, ...*/) { var ed = this.get('editor'); ed.setStatusMessage.apply(ed,arguments); },
    onKeyDown: function onKeyDown(evt) {
        if (this.showsHalos) return $super(evt);
        var sig = evt.getKeyString();
        switch(sig) {
            case 'Alt-Up': case 'F1': this.get('urlText').focus(); evt.stop(); return true;
            case 'Alt-Down': case 'F2': this.get('editor').focus(); evt.stop(); return true;
            case "Command-U": 
                $world.confirm('Revert input / reload file?', function(input) {
                    if (!input) { alertOK('Revert canceled'); return; }
                    this.loadFile();
                }.bind(this));
                evt.stop(); return true;
            default: return $super(evt);        
        }
    }
});

}) // end of module