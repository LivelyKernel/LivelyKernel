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
    isTextEditor: true,
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
            sourceNameForEval: function sourceNameForEval() {
                return this.getWindow().getLocation(true/*asstring*/);
            },

            boundEvalImproved: function boundEvalImproved(__evalStatement, __evalOptions) {
              return this.owner.owner.livelyRuntimeWithProjectDo(function(err, proj) {
                if (!proj) return $super(__evalStatement, __evalOptions);
                return $super(__evalStatement, lively.lang.obj.merge(__evalOptions, {varRecorderName: "__lvVarRecorder", topLevelVarRecorder: proj.state, dontTransform: []}))
              });
            },

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
        lively.bindings.connect(this, 'contentLoaded', editor, 'setTabSize',
          {updater: function($upd) { this.sourceObj.get('editor').guessAndSetTabSize(); }});

        lively.bindings.connect(this, 'contentLoaded', editor, 'guessAndSetTextMode',
          {updater: function($upd) { $upd(this.sourceObj.get('editor').getTextMode()); }});
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
        (function() {
          editor.withAceDo(function(ed) {
            ed.moveCursorTo(line, 0);
            ed.centerSelection();
          });
        }).delay(0);
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
            cwd = lively.shell.cwd(),
            self = this;
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
            if (err) { self.message(Strings.format("Could not read file.\nError: %s", err)); return; }
            lively.lang.fun.debounceNamed(self.id + "-debounce-contentLoaded", 300, function() {
              lively.bindings.signal(self, 'contentLoaded', cmd.getStdout());
              self.livelyRuntimeUpdateDoitContext();
            })();
        });
    },
    loadFileNetwork: function loadFileNetwork() {
        var webR = this.getWebResource();
        lively.bindings.connect(webR, 'content', this, 'contentLoaded', {
          updater: function($upd) {
            var sourceObj = this.sourceObj, targetObj = this.targetObj;
            lively.lang.fun.debounceNamed(targetObj.id + "-debounce-contentLoaded-net", 100, function() {
              targetObj.livelyRuntimeUpdateDoitContext();
              $upd(sourceObj.content);
            })();
          }
        });
        webR.beAsync().forceUncached().get();
    },

    saveFile: function saveFile(thenDo) {
        var loc = this.getLocation(),
            selector = loc.isURL ? "saveFileNetwork" : "saveFileFileSystem",
            self = this;
        lively.lang.fun.composeAsync(
            function(next) {
                self[selector](function(err) {
                    if (!err) {
                        self.message(String(loc) + ' saved', Color.green);
                        lively.bindings.signal(self, 'contentStored');
                        next();
                    } else {
                        self.message(Strings.format("Could not save.\nError: %s", err), Color.red);
                        next(err);
                    }
                });
            },
            function(next) { self.livelyRuntimeSignalChange(); next(); }
        )(thenDo);
    },

    saveFileFileSystem: function saveFileFileSystem(thenDo) {
        var path = lively.shell.makeAbsolute(this.getLocation(true)),
            content = this.get('editor').textString;
        lively.ide.CommandLineInterface.writeFile(path, {content: content}, function(cmd) {
            var err = cmd.getCode() && cmd.getStderr();
            thenDo && thenDo(err ? new Error(err) : null);
        }.bind(this));
    },

    saveFileNetwork: function saveFileNetwork(thenDo) {
        var ed = this, webR = this.getWebResource();
        webR.beAsync().noProxy().put(this.get('editor').textString)
            .whenDone(function(_, status) {
                thenDo && thenDo(status.isSuccess() ?
                    null : new Error(String(status))); });
    },

    updateWindowTitle: function updateWindowTitle() {
        var location = this.getLocation();
        this.setTitle(String(location));
    },

    removeFile: function removeFile() {
      var loc = this.getLocation();
      if (loc.isURL) {
        var webR = this.getWebResource()
          .statusMessage(webR.getURL() + ' removed', webR.getURL() + ' could not removed!')
          .beAsync().del();
      } else {
        var ed = this.get('editor');
        lively.shell.rm(loc, function(err) {
          ed.setStatusMessage(
            err ? loc + "could not be deleted:\n" + (err.stack || err) : loc + " was deleted",
            err ? Color.red : Color.green,
            err ? 5 : undefined); });
      }
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
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // lively.lang.Runtime:

    livelyRuntimeUpdateDoitContext: function livelyRuntimeUpdateDoitContext(thenDo) {
      var rt = lively.lang.Path("lively.lang.Runtime").get(Global);
      if (!rt || !lively.Config.get("lively.lang.Runtime.active")) return typeof thenDo === "function" && thenDo(null, null);
      var editor = this.get("editor");
      lively.lang.Runtime.findProjectForResource(String(this.getLocation()), function(err, proj) {
        editor.doitContext = proj ?
          (proj.doitContext || (proj.getDoitContext && proj.getDoitContext(proj))) :
          null;
        typeof thenDo === "function" && thenDo();
      });
    },

    livelyRuntimeWithProjectDo: function livelyRuntimeWithProjectDo(doFunc) {
      var rt = lively.lang.Path("lively.lang.Runtime").get(Global);
      if (!rt || !lively.Config.get("lively.lang.Runtime.active")) return doFunc(null,null);
      return lively.lang.Runtime.findProjectForResource(this.getLocation(), doFunc);
    },

    livelyRuntimeSignalChange: function livelyRuntimeSignalChange(thenDo) {
      var rt = lively.lang.Path("lively.lang.Runtime").get(Global);
      if (!rt || lively.Config.get("lively.lang.Runtime.active")) return thenDo(null, null);
      var loc = this.getLocation(),
          self = this;;
      lively.lang.fun.composeAsync(
        function(n) { lively.shell.cwd(n); },
        function(cwd, n) {
          lively.lang.Runtime.resourceChanged(
            String(loc), self.get("editor").textString, cwd, n);
        },
        function(n) { self.livelyRuntimeUpdateDoitContext(n); }
      )(function(err) {
        if (err && !String(err).match(/no project.*found/i)) self.get("editor").showError(err);
        thenDo && thenDo(err);
      });
    },
});

}) // end of module