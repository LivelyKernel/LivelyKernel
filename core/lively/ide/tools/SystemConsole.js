module('lively.ide.tools.SystemConsole').requires('lively.persistence.BuildSpec').toRun(function() {

lively.ide.tools.SystemConsole.ConsoleWrapperFunctions = {

  install: function install(target, _console, _window) {
      this.installConsoleWrapper(target, _console);
      this.installErrorCapture(target, _window);
  },
  
  installConsoleWrapper: function installConsoleWrapper(target, console) {
      var c = console || Global.console;
      if (!c.addConsumer) this.prepareConsole(c);
  
      target.warn = this.wrapperFunc(target, 'warn');
      target.error = this.wrapperFunc(target, 'error');
      target.log = this.wrapperFunc(target, 'log');
  
      if (c.consumers && !c.consumers.include(target)) c.addConsumer(target);
  },
  
  
  installErrorCapture: function installErrorCapture(target, _window) {
      if (!_window) _window = window;
      // window.removeEventListener('error', errorHandler)
  
      if (target._errorHandler) return;
  
      target._errorHandler = (function errorHandler(errEvent, url, lineNumber, column, errorObj) {
          var err = errEvent.error || errEvent;
          if (err.stack) {
              var string = String(err.stack)
              console.error("%s", string.replace(/\n/g, ''));
          } else if (err.message) {
              console.error(err.message);
          } else console.error("%s  %s:%s", err, url, lineNumber);
      });
  
      _window.addEventListener('error', target._errorHandler);
  },
  
  prepareConsole: function prepareConsole(platformConsole) {
      var required = ['log', 'group', 'groupEnd', 'warn', 'assert', 'error'];
      function emptyFunc() {}
  
      for (var i = 0; i < required.length; i++) {
          if (!platformConsole[required[i]]) platformConsole[required[i]] = emptyFunc;
      }
  
      var consumers = platformConsole.consumers = [];
      platformConsole.wasWrapped = false;
  
      function addWrappers() {
          if (platformConsole.wasWrapped) return;
  
          var props = [];
          for (var name in platformConsole) props.push(name);
  
          for (var i = 0; i < props.length; i++) {
              (function(name) {
                  var func = platformConsole[name];
                  platformConsole['$' + name] = func;
                  if (typeof func !== 'function') return;
                  platformConsole[name] = function(/*arguments*/) {
                      func.apply(platformConsole, arguments);
                      for (var i = 0; i < consumers.length; i++) {
                          var consumerFunc = consumers[i][name];
                          if (consumerFunc) {
                              consumerFunc.apply(consumers[i], arguments);
                          }
                      }
                  };
              })(props[i]);
          }
          platformConsole.wasWrapped = true;
      }
  
      function removeWrappers() {
          for (var name in platformConsole) {
              if (name[0] !== '$') continue;
              var realName = name.substring(1, name.length);
              platformConsole[realName] = platformConsole[name];
              delete platformConsole[name];
          }
      }
  
      platformConsole.removeWrappers = removeWrappers;
      platformConsole.addWrappers = addWrappers;
  
      platformConsole.addConsumer = function(c) {
          if (consumers.indexOf(c === -1)) {
              addWrappers();
              consumers.push(c);
          }
      };
  
      platformConsole.removeConsumer = function(c) {
          var idx = consumers.indexOf(c);
          if (idx >= 0) consumers.splice(idx, 1);
          if (consumers.length === 0) removeWrappers();
      };
  
  },
  
  uninstall: function uninstall(target) {
      this.uninstallConsoleWrapper(target);
      this.uninstallErrorCapture(target);
  },
  
  uninstallConsoleWrapper: function uninstallConsoleWrapper(target) {
      console.consumers.remove(target);
  },
  
  uninstallErrorCapture: function uninstallErrorCapture(target) {
      if (!target._errorHandler) return;
      window.removeEventListener('error', target._errorHandler);
      delete target._errorHandler;
  },
  
  wrapperFunc: function wrapperFunc(target, type) {
    return function consoleWrapper(/*args*/) {
      var string = String(arguments[0]);
      for (var i = 1; i < arguments.length; i++) {
          var idx = string.indexOf('%s');
          if (idx > -1) string = string.slice(0,idx) + String(arguments[i]) + string.slice(idx+2);
      }
      // this === target !
      this.onLogMessage(type, string);
    }
  
  }
}


lively.BuildSpec("lively.ide.tools.LogMessages", {
  className: "lively.morphic.Window",
  contentOffset: lively.pt(3.0,22.0),
  draggingEnabled: true,
  droppingEnabled: false,
  _Extent: lively.pt(623.3,330.0),
  layout: { adjustForNewBounds: true },
  name: "LogMessages",
  submorphs: [{
      _BorderColor: Color.rgb(95,94,95),
      _Extent: lively.pt(617.0,305.0),
      _Fill: Color.rgb(255,255,255),
      _Position: lively.pt(3.0,22.0),
      className: "lively.morphic.Box",
      droppingEnabled: false,
      layout: {
          adjustForNewBounds: true,
          resizeHeight: true,
          resizeWidth: true
      },
      maxMessages: "256KB",
      maxSize: 262144,
      name: "LogMessages",
      submorphs: [{
          _BorderColor: Color.rgb(95,94,95),
          _Extent: lively.pt(617.0,285.0),
          _FontSize: 10,
          _LineWrapping: false,
          _ShowActiveLine: false,
          _ShowGutter: false,
          _StyleSheet: ".Morph .ace_log {\n\
      	color: #333;\n\
      }\n\
      \n\
      .Morph .ace_error {\n\
      	color: red;\n\
      }\n\
      \n\
      .Morph .ace_warning {\n\
      	color: orange;\n\
      }",
          _TabSize: 2,
          _TextMode: "log",
          _Theme: "chrome",
          allowInput: false,
          className: "lively.morphic.CodeEditor",
          droppingEnabled: false,
          grabbingEnabled: false,
          layout: { resizeHeight: true, resizeWidth: true },
          name: "logText",
          textMode: "log",
          textString: ""
      },{
          _Extent: lively.pt(72.3,18.5),
          _Fill: Color.rgb(255,255,255),
          _Position: lively.pt(544.0,285.0),
          className: "lively.morphic.Box",
          grabbingEnabled: false,
          layout: {
              adjustForNewBounds: true,
              borderSize: 0.265,
              extentWithoutPlaceholder: lively.pt(100.0,18.0),
              moveHorizontal: true,
              moveVertical: true,
              resizeWidth: false,
              spacing: 5,
              type: "lively.morphic.Layout.TightHorizontalLayout"
          },
          name: "FollowLogCheckBox",
          sourceModule: "lively.morphic.Core",
          submorphs: [{
              _BorderColor: Color.rgb(204,0,0),
              _Extent: lively.pt(12.0,18.0),
              _Position: lively.pt(0.3,0.3),
              active: true,
              checked: true,
              className: "lively.morphic.CheckBox",
              name: "CheckBox",
              sourceModule: "lively.morphic.Widgets",
              connectionRebuilder: function connectionRebuilder() {
              lively.bindings.connect(this, "checked", this.get("FollowLogCheckBox"), "signalChecked", {});
          }
          },{
              _Extent: lively.pt(55.0,14.0),
              _FontFamily: "Arial, sans-serif",
              _FontSize: 8,
              _HandStyle: "default",
              _InputAllowed: false,
              _MaxTextWidth: 120.695652,
              _MinTextWidth: 120.695652,
              _Padding: lively.rect(4,2,0,0),
              _Position: lively.pt(17.0,0.3),
              _TextColor: Color.rgb(0,0,0),
              allowInput: false,
              className: "lively.morphic.Text",
              fixedHeight: true,
              fixedWidth: true,
              grabbingEnabled: false,
              layout: {
                  resizeWidth: true
              },
              name: "Label",
              textString: "follow log"
          }],
          isChecked: function isChecked() {
        return this.get("CheckBox").isChecked();
      },
          onMouseDown: function onMouseDown(evt) {
        if (evt.getTargetMorph() == this.get("CheckBox")) return false;
        if (evt.getTargetMorph() == this.get("Label") && this.get("Label").inputAllowed()) return false;
      
        this.setChecked(!this.isChecked());
        evt.stop(); return true;
      },
          ondMouseDown: function ondMouseDown(evt) {
        if (evt.getTargetMorph() !== this.get("CheckBox")) {
          this.setChecked(!this.isChecked());
          evt.stop(); return true;
        }
        return false;
      },
          reset: function reset() {
        this.connections = {checked: {}};
        lively.bindings.connect(this.get("CheckBox"), 'checked', this, 'signalChecked');
      },
          setChecked: function setChecked(bool) {
        return this.get("CheckBox").setChecked(bool);
      },
          setLabel: function setLabel(string) {
          this.get('Label').setTextString(string);
      },
          signalChecked: function signalChecked(val) {
        lively.bindings.signal(this, 'checked', val);
      }
      },{
          _BorderColor: Color.rgb(189,190,192),
          _BorderRadius: 5,
          _BorderWidth: 1,
          _Extent: lively.pt(60.0,20.0),
          _Position: lively.pt(422.0,285.0),
          className: "lively.morphic.Button",
          droppingEnabled: false,
          grabbingEnabled: false,
          isPressed: false,
          label: "clear",
          layout: {
              moveHorizontal: true,
              moveVertical: true
          },
          name: "Button1",
          connectionRebuilder: function connectionRebuilder() {
          lively.bindings.connect(this, "fire", this, "doAction", {});
      },
          doAction: function doAction() {
          this.get("LogMessages").clear();
      }
      },{
          _BorderColor: Color.rgb(189,190,192),
          _BorderRadius: 5,
          _BorderWidth: 1,
          _Extent: lively.pt(60.0,20.0),
          _Position: lively.pt(481.0,285.0),
          className: "lively.morphic.Button",
          droppingEnabled: false,
          grabbingEnabled: false,
          label: "reattach",
          layout: {
              moveHorizontal: true,
              moveVertical: true
          },
          name: "Button2",
          connectionRebuilder: function connectionRebuilder() {
              lively.bindings.connect(this, "fire", this, "doAction", {});
          },

          doAction: function doAction() {
              this.owner.clear();
              this.owner.uninstall();
              this.owner.install();
          }
      }],

      clear: function clear() {
          this.get("logText").textString="";
          this.get("logText").withAceDo(function(ed) {
            ed.session.getUndoManager().reset();
          })
      },


      onWindowGetsFocus: function onWindowGetsFocus() {
          this.world() && this.focus();
      },

      reset: function reset() {
        this.maxSize = Math.pow(2,18) // 256KB
        this.get("logText").textString = "";
    
        this.uninstall();
        this.clear();
        this.getWindow().setTitle('Log Messages');
        this.getWindow().name = "LogMessages";
        
        this.get("logText").setInputAllowed(false);
      },

      onLoad: function onLoad() {
        this.get("FollowLogCheckBox").setChecked(true);
        this.clear();
        this.install();
      },

      onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.onLoad()
      },

      install: function install(_console, _window) {
        lively.ide.tools.SystemConsole.ConsoleWrapperFunctions.install(this);
      },

      onOwnerChanged: function onOwnerChanged(newOwner) {
        var self = this;
        lively.lang.fun.debounceNamed(this.id+"onOwnerChanged", 300, function() {
          self[self.world() ? 'install' : 'uninstall']();
        })();
      },

      uninstall: function uninstall() {
        lively.ide.tools.SystemConsole.ConsoleWrapperFunctions.uninstall(this)
      },
      
      onLogMessage: function onLogMessage(type, msg) {
        this.get("logText").textString += lively.lang.string.format(
          "[%s] %s\n", type, msg)
        if (this.get("FollowLogCheckBox").isChecked()) {
          var self = this;
          lively.lang.fun.debounceNamed(this.id+"scroll", 200, function() {
            self.get("logText").withAceDo(function(ed) {
              ed.gotoLine(ed.session.getLength(), 0, true); });
          })();
        }
      }
  }],
  titleBar: "Log Messages",
});

Object.extend(lively.ide.tools.SystemConsole, {

    openInContext: function(globalContext) {
        var win = lively.BuildSpec('lively.ide.tools.LogMessages')
            .createMorph().openInWorld($world.positionForNewMorph()).comeForward();
        win.targetMorph.reset();
        win.targetMorph.install(globalContext.console, globalContext);
        return win;
    },

    open: function() {
        return lively.BuildSpec('lively.ide.tools.LogMessages')
            .createMorph().openInWorld($world.positionForNewMorph()).comeForward();
    }
});

}) // end of module
