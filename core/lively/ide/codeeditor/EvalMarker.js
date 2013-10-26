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
        } catch(e) { return e;
        } finally { delete Global.marker; }
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
    }
});

(function installEvalMarkerKeyHandler() {
    lively.morphic.Events.GlobalEvents.unregister('keydown', "evalMarkerKeyHandler");
    lively.morphic.Events.GlobalEvents.register('keydown', function evalMarkerKeyHandler(evt) {
        var keys = evt.getKeyString();
        if (keys === 'Command-Shift-M' || keys === "Control-Shift-M") {
            var focused = lively.morphic.Morph.prototype.focusedMorph();
            if (!focused || !focused.isAceEditor) return false;
            focused.addOrRemoveEvalMarker(evt);
            evt.stop(); return true;
        }
        if (keys === 'Command-M' || keys === 'Control-M') {
            lively.morphic.CodeEditorEvalMarker.updateLastMarker();
            evt.stop(); return true;
        }
        return false;
    });
})();

}) // end of module