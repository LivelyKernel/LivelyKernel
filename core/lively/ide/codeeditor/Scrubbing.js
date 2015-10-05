module('lively.ide.codeeditor.Scrubbing').requires('lively.morphic.Scrubbing').toRun(function() {

Trait("lively.morphic.CodeEditor.Scrubbing", Trait("lively.morphic.Scrubbing").def,
"scrubbing", {

  initScrubbingState: function() {
    Trait("lively.morphic.Scrubbing").def.initScrubbingState.call(this, {
      range: null,
      currentToken: null,
      disableSelectionHandler: null
    });

    this.withAceDo(function(ed) {
      ed.setOption("dragEnabled", false);
    });
    this.setStyleSheet(".Morph.scrubbing .ace_scroller { cursor: ew-resize !important; }");
  },

  onScrubbingStart: function(evt, scrubbing) {
      var viewPort = document.body.getBoundingClientRect();
      var globalPos = evt.getPosition();
      var acePos = this.aceEditor.renderer.pixelToScreenCoordinates(
        globalPos.x+viewPort.left,
        globalPos.y+viewPort.top);

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      var token = this.getNumericTokenAt(evt.getPosition());
      var range = this.createRange({row: acePos.row, column: token.start}, {row: acePos.row, column: token.start + token.value.length});
      scrubbing.range = range;
      this.getSelection().setRange(range);

      this.getSelection().off('changeSelection', scrubbing.disableSelectionHandler);
      this.getSelection().off('changeCursor', scrubbing.disableSelectionHandler);
      scrubbing.disableSelectionHandler = function(e) {
        if (this.scrubbingState.range)
          this.getSelection().setRange(this.scrubbingState.range);
      }.bind(this);

      this.getSelection().on('changeSelection', scrubbing.disableSelectionHandler);
      this.getSelection().on('changeCursor', scrubbing.disableSelectionHandler);
  },

  onScrubbingEnd: function(evt, scrubbing) {
    scrubbing.currentToken = null;
    (function() {
      this.getSelection().off('changeSelection', scrubbing.disableSelectionHandler);
      this.getSelection().off('changeCursor', scrubbing.disableSelectionHandler);
      // this.clearSelection();
      scrubbing.range = null;
    }).bind(this).delay(0);
  },

  onScrubbingUpdate: function(evt, scrubbing, newValue) {
      var target = this;
      var newStart = scrubbing.range.start;
      var newEnd = lively.lang.obj.clone(newStart); newEnd.column += String(newValue).length;
      var range = target.createRange(newStart, newEnd);
      var eventHandlers = target.aceEditor._eventRegistry.change
      target.aceEditor._eventRegistry.change = [];
      // this.getSession().doc.replace(scrubbing.range, String(newValue));
      target.getSession().remove(scrubbing.range)
      target.aceEditor._eventRegistry.change = eventHandlers;
      target.getSession().insert(scrubbing.range.start, String(newValue));
      target.getSelection().setRange(range);
      scrubbing.range = range;
  },

  getNumericTokenAt: function(globalPos) {
    var viewPort = document.body.getBoundingClientRect();
    var acePos1 = this.aceEditor.renderer.pixelToScreenCoordinates(
      globalPos.x+viewPort.left,
      globalPos.y+viewPort.top);
    var acePos2 = {column: acePos1.column-1, row: acePos1.row};
    var acePos3 = {column: acePos1.column+1, row: acePos1.row};
    var tokens = [this.tokenAt(acePos1), this.tokenAt(acePos2), this.tokenAt(acePos3)];
    if (tokens[0] && tokens[0].type === 'constant.numeric') return tokens[0];
    if (tokens[1] && tokens[1].type === 'constant.numeric') return tokens[1];
    if (tokens[2] && tokens[2].type === 'constant.numeric') return tokens[2];
    return null;
  }

},
"events", {

  onMouseMove: function(evt) {
    var token = this.getNumericTokenAt(evt.getPosition());
    if (token) this.addStyleClassName("scrubbing");
    else this.removeStyleClassName("scrubbing");
  },

  getScrubbingStartValue: function(pos) {
    var token = this.getNumericTokenAt(pos),
        n = token && Number(token.value);
    return n && !isNaN(n) ? n : null;
  }

});

Object.extend(lively.ide.codeeditor.Scrubbing, {

  enableInCodeEditor: function(codeEditor) {
    // lively.ide.codeeditor.Scrubbing.enableInCodeEditor(that);
    Trait("lively.morphic.CodeEditor.Scrubbing").applyTo(codeEditor, {
      override: ["onDrag", "onDragEnd", "onDragStart", "onMouseMove", "onMouseUp", "onMouseDown"]
    })
    codeEditor.initScrubbingState();
  },

  disableInCodeEditor: function(codeEditor) {
    Trait("lively.morphic.CodeEditor.Scrubbing").removeFrom(codeEditor);
  }
});

}) // end of module
