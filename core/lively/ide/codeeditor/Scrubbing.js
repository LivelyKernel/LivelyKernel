module('lively.ide.codeeditor.Scrubbing').requires('lively.Traits').toRun(function() {

Trait("lively.morphic.CodeEditor.Scrubbing",
"scrubbing", {

  isScrubbing: function() {
    return this.scrubbingState && this.scrubbingState.mode;
  },  

  initScrubbingState: function initScrubbingState() {
    // this.getSelection().removeAllListeners('changeSelection');
    this.enableDragging();
    this.aceEditor.setOption("dragEnabled", false);
    if (this.hasOwnProperty('doNotSerialize')) this.doNotSerialize.push("scrubbingState");
    else this.doNotSerialize = ["scrubbingState"];
    this.scrubbingState = {
      factorOffset: 30,
      clickStarted: null,
      range: null,
      startMarker: null,
      handMarker: null,
      currentToken: null,
      mode: null,
      disableSelectionHandler: null,
      updateState: {lastPos: null, lastFactor: null, lastValue: null, lastFactorChangePos: null}
    }
  
    this.setStyleSheet(".Morph.scrubbing .ace_scroller { cursor: ew-resize !important; }");
  },
  
  updateScrubbingFromEvent: function updateScrubbingFromEvent(evt) {
      return this.owner ? this.updateScrubbing(evt.getPosition()) : false;
  },
  
  updateScrubbing: function updateScrubbing(handPosition) {
      var target = this;
      var scrubbing = this.scrubbingState,
          startMarker = scrubbing.startMarker,
          handMarker = scrubbing.handMarker,
          posForHandmarker = startMarker.getGlobalTransform().inverse().transformPoint(handPosition);
  
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // morphs following the scrub
      startMarker.line.getControlPoint(1).setPos(posForHandmarker);
      handMarker.setPosition(posForHandmarker);
  
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      var lastFactor = scrubbing.updateState.lastFactor || (scrubbing.updateState.lastFactor = 1);
      var lastValue = scrubbing.updateState.lastValue || (scrubbing.updateState.lastValue = scrubbing.startValue);
      var lastFactorChangePos = scrubbing.updateState.lastFactorChangePos || (scrubbing.updateState.lastFactorChangePos = startMarker.innerBounds().center());
      var lastPos = scrubbing.updateState.lastPos || (scrubbing.updateState.lastPos = startMarker.innerBounds().center());
  
      var distFromStart = posForHandmarker.y;
      var distFromLastFactorChange = handMarker.bounds().center().subPt(lastFactorChangePos).x/10;
      var relativeDelta = handMarker.bounds().center().subPt(lastPos).x
  
      var y = distFromStart, rounding, factor;
      
      if (y < -scrubbing.factorOffset) { factor = 10; rounding = 0; }
      else if (y > scrubbing.factorOffset) { factor = .1; rounding = 1; }
      else { factor = 1; rounding = 0; }
      
      var newValueRaw = lastValue + (lastFactor*distFromLastFactorChange);
      var newValue = rounding === 1 ? Math.round(newValueRaw*10)/10 : Math.round(newValueRaw);
  
      if (factor !== lastFactor) {
        scrubbing.updateState.lastFactorChangePos = handMarker.bounds().center();
        scrubbing.updateState.lastFactor = factor;
        scrubbing.updateState.lastValue = newValue;
      }
      scrubbing.updateState.lastPos = handMarker.bounds().center();
  
      var newStart = target.scrubbingState.range.start;
      var newEnd = lively.lang.obj.clone(newStart); newEnd.column += String(newValue).length;
      var range = target.createRange(newStart, newEnd);

// show(target.getSession().getTextRange(range))
// show(""+range)
// this.getSession().doc.applyDelta
      var eventHandlers = target.aceEditor._eventRegistry.change
      target.aceEditor._eventRegistry.change = [];
      // this.getSession().doc.replace(target.scrubbingState.range, String(newValue));
      target.getSession().remove(target.scrubbingState.range)
      target.aceEditor._eventRegistry.change = eventHandlers;
      target.getSession().insert(target.scrubbingState.range.start, String(newValue));
      target.getSelection().setRange(range);
      target.scrubbingState.range = range;
  },
  
  startScrubbingOn: function startScrubbingOn(globalPos, token, mode) {
  
      var scrubbing = this.scrubbingState;
      var acePos = this.aceEditor.renderer.pixelToScreenCoordinates(globalPos.x, globalPos.y);
  
      scrubbing.currentToken = token;
      scrubbing.startValue = Number(scrubbing.currentToken.value);
      scrubbing.mode = "number";
      scrubbing.updateState = {lastFactor: null, lastValue: null, lastFactorChangePos: null, lastPos: null};
  
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // this.addStyleClassName("numeric-hover")
      var range = this.createRange({row: acePos.row, column: token.start}, {row: acePos.row, column: token.start + token.value.length});
      // show(range+"")
      // show(this.getSession().getTextRange(range))
      scrubbing.range = range;
      this.getSelection().setRange(range);
  
      var startMarker = scrubbing.startMarker;
      if (!startMarker) {
        var startMarker = scrubbing.startMarker = lively.morphic.Morph.makeEllipse(lively.rect(0,0,2,2));
        startMarker.isEpiMorph = true;
        var line = startMarker.line || lively.morphic.Morph.makeLine([pt(0,0), pt(0,0)], 2, Global.Color.black.withA(.0))
        var handMarker = scrubbing.handMarker = lively.morphic.Morph.makeEllipse(lively.rect(0,0,60,60));
        // var label = scrubbing.label = lively.morphic.Text.makeLabel("0.0", {fill: Color.gray.darker(), textColor: Color.white, extent: pt(40, 20), align: "center"});
        if (line.owner !== startMarker) startMarker.line = startMarker.addMorph(line);
        if (handMarker.owner !== startMarker) startMarker.handMarker = startMarker.addMorph(handMarker);
        // if (label.owner !== handMarker) startMarker.label = handMarker.addMorph(label);
        // label.setPositionCentered(label.owner.innerBounds().center().addXY(0, -15));
        handMarker.setStyleSheet(".Morph { cursor: ew-resize !important; }");
        handMarker.setFill(null);
  
        var l = lively.morphic.Morph.makeLine([pt(0,0), pt(0,0)], 2, Color.gray);
        startMarker.factorLine1 = startMarker.addMorph(l);
        l.label = l.addMorph(lively.morphic.Text.makeLabel("10", {fill: Color.gray.darker(), textColor: Color.white, extent: pt(40, 20), align: "center"}));
        var l = lively.morphic.Morph.makeLine([pt(0,0), pt(0,0)], 2, Color.gray);
        startMarker.factorLine2 = startMarker.addMorph(l);
        l.label = l.addMorph(lively.morphic.Text.makeLabel(".1", {fill: Color.gray.darker(), textColor: Color.white, extent: pt(40, 20), align: "center"}));
      }
  
      // if (startMarker.owner !== this) this.addMorph(startMarker);
      if (startMarker.owner !== $world) $world.addMorph(startMarker);
      startMarker.setPositionCentered(globalPos);
      this.updateScrubbing(globalPos);
  
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  
      var screenWidth = $world.visibleBounds().width;
      var origin = startMarker.worldPoint(pt(0,0));
  
      var factorLine1Left = pt(-origin.x, -scrubbing.factorOffset);
      var factorLine1Right = pt(screenWidth-origin.x, -scrubbing.factorOffset);
      var factorLine2Left = pt(-origin.x, scrubbing.factorOffset);
      var factorLine2Right = pt(screenWidth-origin.x, scrubbing.factorOffset);
      startMarker.factorLine1.getControlPoint(0).setPos(factorLine1Left);
      startMarker.factorLine1.getControlPoint(1).setPos(factorLine1Right);
      startMarker.factorLine2.getControlPoint(0).setPos(factorLine2Left);
      startMarker.factorLine2.getControlPoint(1).setPos(factorLine2Right);
  
      startMarker.factorLine1.label.align(startMarker.factorLine1.label.bounds().bottomLeft(), factorLine1Left);
      startMarker.factorLine2.label.align(startMarker.factorLine2.label.bounds().bottomLeft(), factorLine2Left);
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      scrubbing.disableSelectionHandler = function(e) {
        if (this.scrubbingState.range)
          this.getSelection().setRange(this.scrubbingState.range);
      }.bind(this);
  
      this.getSelection().on('changeSelection', scrubbing.disableSelectionHandler);
      this.getSelection().on('changeCursor', scrubbing.disableSelectionHandler);
  },
  
  stopScrubbing: function stopScrubbing() {
    var scrubbing = this.scrubbingState;
  
    scrubbing.mode = null;
    scrubbing.currentToken = null
    scrubbing.startValue = null;
  
    if (scrubbing.startMarker) scrubbing.startMarker.remove();
  
    (function() {
      this.getSelection().off('changeSelection', scrubbing.disableSelectionHandler);
      this.getSelection().off('changeCursor', scrubbing.disableSelectionHandler);
      // this.clearSelection();
      this.scrubbingState.range = null;
    }).bind(this).delay(0);
  },
  
  getNumericTokenAt: function getNumericTokenAt(globalPos) {
    var acePos1 = this.aceEditor.renderer.pixelToScreenCoordinates(globalPos.x, globalPos.y);
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

  onDrag: function onDrag(evt) {
    if (this.isScrubbing()) this.updateScrubbingFromEvent(evt);
    evt.stop();
  },
  
  onDragEnd: function onDragEnd(evt) {
    if (this.isScrubbing()) this.stopScrubbing();
  },
  
  onDragStart: function onDragStart(evt) {},
  
  onMouseMove: function onMouseMove(evt) {
    var token = this.getNumericTokenAt(evt.getPosition());
    if (token) this.addStyleClassName("scrubbing");
    else this.removeStyleClassName("scrubbing");
  },
  
  onMouseUp: function onMouseUp(evt) {
    if (this.isScrubbing()) this.stopScrubbing();
    evt.stop();
  },
  
  onMouseDown: function onMouseDown(evt) {
    if (!this.scrubbingState) this.initScrubbingState();
    var token = this.getNumericTokenAt(evt.getPosition());
    if (token) this.startScrubbingOn(evt.getPosition(), token, "number");
    return this.constructor.prototype.onMouseDown.call(this, evt);
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
