module('lively.ide.codeeditor.EvalMarker').requires('lively.morphic.Events').toRun(function() {

Object.subclass('lively.morphic.CodeEditorEvalMarker',
'initialization', {

    initialize: function(codeEditor, range) {
        this.annotation = codeEditor.addFloatingAnnotation(range);
        this.originalExpression = this.annotation.getTextString();
    },

    detach: function() {
        this.stopContinousEval();
        this.restoreText();
        this.annotation.detach();
        return this;
    },

    attach: function() { this.annotation.attach(); return this; },
    restoreText: function() {
        if (this.getTextString() !== this.getOriginalExpression())
            this.annotation.replace(this.getOriginalExpression());
    }
},
'accessing', {
    get textString() { return this.getTextString(); },
    set textString(string) { return this.annotation.replace(string); },

    getTextString: function() {
        return this.annotation.getTextString();
    },
    getOriginalExpression: function() {
        return this.originalExpression;
    }
},
'evaluation', {
    evaluateOriginalExpression: function() {
        console.log('EvalMarker evaluating %s' + this.getOriginalExpression());
        var ed = this.annotation.editor;
        try {
            Global.marker = this;
            return ed.boundEval(this.getOriginalExpression() || '');
        } catch(e) { return e; }
          finally { delete Global.marker; }
    },

    evalAndInsert: function() {
        var self = this, delay = this.annotation.editor.evalMarkerDelay;
        function doEval() {
            var result = self.evaluateOriginalExpression();
            self.annotation.replace(String(result));
            return result;
        }
        return delay ? doEval.delay(delay/1000) : doEval();
    },

    stopContinousEval: function() {
        Global.clearInterval(this.stepInterval);
        delete this.stepInterval;
    },

    startContinousEval: function(time) {
        this.stopContinousEval();
        var ed = this.annotation.editor;
        this.stepInterval = Global.setInterval(this.evalAndInsert.bind(this), time || 500);
    },

    doesContinousEval: function() { return !!this.stepInterval; }
});

Object.extend(lively.morphic.CodeEditorEvalMarker, {

    updateLastMarker: function() {
        this.currentMarker && this.currentMarker.evalAndInsert();
    },

    setCurrentMarker: function(editor, range) {
        if (this.currentMarker) this.currentMarker.detach();
        return this.currentMarker = new this(editor, range);
    },

    menuItemsFor: function(codeEditor) {
      var world = codeEditor.world();
      var items = [];

      items.push(['Mark / unmark expression (Command-Shift-M)', function() {
        codeEditor.addEvalMarker();
        codeEditor.focus();
      }]);

      items.push(['Remove eval marker', function() {
        codeEditor.removeEvalMarker();
        delete lively.morphic.CodeEditorEvalMarker.currentMarker;
        codeEditor.focus();
      }]);

      var marker = lively.morphic.CodeEditorEvalMarker.currentMarker;
      if (marker) {
          items.unshift(["Re-eval (Command-M)", function() { marker.evalAndInsert(); codeEditor.focus(); }]);
          if (marker.doesContinousEval()) {
              items.push(['Disable eval interval', function() {
                  marker.stopContinousEval();
                  codeEditor.focus();
              }]);
          } else {
              items.push(['Set eval interval', function() {
                  world.prompt('Please enter the interval time in milliseconds', function(input) {
                      input = Number(input);
                      marker.startContinousEval(input);
                      codeEditor.evalMarkerDelay = input || null;
                      codeEditor.focus();
                  }, '200');
              }]);
          }
      }

      return items;
    },
});

(function installEvalMarkerKeyHandler() {

    if (!lively.Config.get("evalMarkersEnabled")) return;

    lively.ide.commands.addCommand("lively.ide.codeeditor.eval-marker-toggle", {
      description: "[eval marker] add or remove for selection",
      isActive: lively.ide.commands.helper.codeEditorActive,
      exec: function() {
        var editor = lively.ide.commands.helper.focusedMorph();
        if (lively.morphic.CodeEditorEvalMarker.currentMarker) {
          editor.removeEvalMarker();
          lively.morphic.CodeEditorEvalMarker.currentMarker = null;
        } else { editor.addEvalMarker(); }
        return true;
      }
    });

    lively.ide.commands.addCommand("lively.ide.codeeditor.eval-marker-add", {
      description: "[eval marker] add for selection",
      isActive: lively.ide.commands.helper.codeEditorActive,
      exec: function() {
        var editor = lively.ide.commands.helper.focusedMorph();
        editor.addEvalMarker();
        return true;
      }
    });

    lively.ide.commands.addCommand("lively.ide.codeeditor.eval-marker-remove", {
      description: "[eval marker] remove",
      isActive: lively.ide.commands.helper.codeEditorActive,
      exec: function() {
        var editor = lively.ide.commands.helper.focusedMorph();
        editor.removeEvalMarker();
        return true;
      }
    });

    lively.ide.commands.addCommand("lively.ide.codeeditor.eval-marker-update", {
      description: "[eval marker] re-evaluate existing eval markers",
      isActive: lively.ide.commands.helper.codeEditorActive,
      exec: function() {
        lively.morphic.CodeEditorEvalMarker.updateLastMarker();
        return true;
      }
    });

    lively.ide.commands.addKeyBinding("lively.ide.codeeditor.eval-marker-toggle", {mac: "cmd-shift-M", win: "ctrl-shift-M"});
    lively.ide.commands.addKeyBinding("lively.ide.codeeditor.eval-marker-update", {mac: "cmd-M", win: "ctrl-M"});

    // lively.morphic.Events.GlobalEvents.unregister('keydown', "evalMarkerKeyHandler");
    // lively.morphic.Events.GlobalEvents.register('keydown', function evalMarkerKeyHandler(evt) {
    //     var keys = evt.getKeyString();
    //     if (keys === 'Command-Shift-M' || keys === "Control-Shift-M") {
    //         var focused = lively.morphic.Morph.prototype.focusedMorph();
    //         if (!focused || !focused.isAceEditor) return false;
    //         focused.addOrRemoveEvalMarker(evt);
    //         evt.stop(); return true;
    //     }
    //     if (keys === 'Command-M' || keys === 'Control-M') {
    //         lively.morphic.CodeEditorEvalMarker.updateLastMarker();
    //         evt.stop(); return true;
    //     }
    //     return false;
    // });
})();

}) // end of module
