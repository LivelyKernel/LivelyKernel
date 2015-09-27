module('lively.morphic.Scrubbing').requires('lively.Traits').toRun(function() {

Trait("lively.morphic.Scrubbing",
"scrubbing", {

  isScrubbing: function() {
    return this.scrubbingState && this.scrubbingState.mode;
  },

  initScrubbingState: function(options) {
    this.enableDragging();

    if (this.hasOwnProperty('doNotSerialize')) this.doNotSerialize.push("scrubbingState");
    else this.doNotSerialize = ["scrubbingState"];

    this.scrubbingState = lively.lang.obj.merge({
      dragSensitivity: 0.1, // moving the hand 10px changes the value by 1
      initialFactor: 1, // multiplicator
      factorOffset: 30, // pixel dist for the x10, x100, ... lines
      startMarker: null,
      handMarker: null,
      mode: null,
      updateState: {lastPos: null, lastFactor: null, lastValue: null, lastFactorChangePos: null}
    }, options);

  },

  updateScrubbing: function(evt) {
      var handPosition = evt.getPosition(),
          scrubbing = this.scrubbingState,
          startMarker = scrubbing.startMarker,
          handMarker = scrubbing.handMarker,
          posForHandmarker = startMarker.getGlobalTransform().inverse().transformPoint(handPosition);

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // morphs following the scrub
      handMarker.setPosition(posForHandmarker);

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      // the scrubbing state
      var initialFactor = scrubbing.initialFactor,
          dragSensitivity = scrubbing.dragSensitivity,
          lastFactor = scrubbing.updateState.lastFactor || (scrubbing.updateState.lastFactor = initialFactor),
          lastValue = scrubbing.updateState.lastValue || (scrubbing.updateState.lastValue = scrubbing.startValue),
          lastFactorChangePos = scrubbing.updateState.lastFactorChangePos || (scrubbing.updateState.lastFactorChangePos = startMarker.innerBounds().center()),
          lastPos = scrubbing.updateState.lastPos || (scrubbing.updateState.lastPos = startMarker.innerBounds().center()),
          distFromStart = posForHandmarker.y,
          distFromLastFactorChange = handMarker.bounds().center().subPt(lastFactorChangePos).x * dragSensitivity,
          relativeDelta = handMarker.bounds().center().subPt(lastPos).x,
          y = distFromStart, factor;

      if (y <= -scrubbing.factorOffset) { factor = initialFactor*10; }
      else if (y >= scrubbing.factorOffset) { factor = initialFactor*.1; }
      else { factor = initialFactor; }
      // there can be some annoying floating issues creak in...
      factor = lively.lang.num.roundTo(factor, 0.00000001);

      var newValueRaw = lastValue + (lastFactor*distFromLastFactorChange),
          newValue = lively.lang.num.roundTo(newValueRaw, lastFactor >= 1 ? 1 : lastFactor);

      if (factor !== lastFactor) {
        scrubbing.updateState.lastFactorChangePos = handMarker.bounds().center();
        scrubbing.updateState.lastFactor = factor;
        scrubbing.updateState.lastValue = newValue;
      }
      scrubbing.updateState.lastPos = handMarker.bounds().center();

      this.onScrubbingUpdate(evt, scrubbing, newValue);
  },

  startScrubbing: function(evt, startValue, mode) {
      var globalPos = evt.getPosition();
      var scrubbing = this.scrubbingState;
      scrubbing.startValue = startValue;
      scrubbing.mode = "number";
      scrubbing.updateState = {lastFactor: null, lastValue: null, lastFactorChangePos: null, lastPos: null};

      var startMarker = scrubbing.startMarker;
      if (!startMarker) {
        var startMarker = scrubbing.startMarker = lively.morphic.Morph.makeEllipse(lively.rect(0,0,2,2));
        startMarker.isEpiMorph = true;
        var handMarker = scrubbing.handMarker = lively.morphic.Morph.makeEllipse(lively.rect(0,0,60,60));
        // var label = scrubbing.label = lively.morphic.Text.makeLabel("0.0", {fill: Color.gray.darker(), textColor: Color.white, extent: pt(40, 20), align: "center"});
        if (handMarker.owner !== startMarker) startMarker.handMarker = startMarker.addMorph(handMarker);
        // if (label.owner !== handMarker) startMarker.label = handMarker.addMorph(label);
        // label.setPositionCentered(label.owner.innerBounds().center().addXY(0, -15));
        handMarker.setStyleSheet(".Morph { cursor: ew-resize !important; }");
        handMarker.setFill(null);

        var l = lively.morphic.Morph.makeLine([pt(0,0), pt(0,0)], 2, Color.gray);
        startMarker.factorLine1 = startMarker.addMorph(l);
        l.label = l.addMorph(lively.morphic.Text.makeLabel(String(lively.lang.num.roundTo(scrubbing.initialFactor * 10, 0.00000001)), {fill: Color.gray.darker(), textColor: Color.white, extent: pt(40, 20), align: "center"}));
        var l = lively.morphic.Morph.makeLine([pt(0,0), pt(0,0)], 2, Color.gray);
        startMarker.factorLine2 = startMarker.addMorph(l);
        l.label = l.addMorph(lively.morphic.Text.makeLabel(String(lively.lang.num.roundTo(scrubbing.initialFactor * 0.1, 0.0000001)), {fill: Color.gray.darker(), textColor: Color.white, extent: pt(40, 20), align: "center"}));
      }

      // if (startMarker.owner !== this) this.addMorph(startMarker);
      if (startMarker.owner !== $world) $world.addMorph(startMarker);
      startMarker.setPositionCentered(globalPos);

      this.onScrubbingStart(evt, scrubbing);
      this.updateScrubbing(evt);

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
  },

  stopScrubbing: function(evt) {
    var scrubbing = this.scrubbingState;

    scrubbing.mode = null;
    scrubbing.startValue = null;

    if (scrubbing.startMarker) scrubbing.startMarker.remove();

    this.onScrubbingEnd(evt, scrubbing);
  }

},
"events", {

  onDrag: function onDrag(evt) {
    if (this.isScrubbing()) this.updateScrubbing(evt);
    evt.stop();
  },

  onDragEnd: function onDragEnd(evt) {
    if (this.isScrubbing()) this.stopScrubbing(evt);
  },

  onDragStart: function onDragStart(evt) {
    var val = this.getScrubbingStartValue(evt.getPosition());
    var mode = this.getScrubbingMode(evt.getPosition());
    if (!mode) return false;
    if (mode === "number" && (!Object.isNumber(val) || isNaN(val))) return false;
    this.startScrubbing(evt, val, mode);
    return true;
  }

},
"morphic integration", {

  onScrubbingStart: function(evt, scrubbingState) {},
  onScrubbingEnd: function(evt, scrubbingState) {},

  onScrubbingUpdate: function(evt, scrubbingState, newValue) {
    throw new Error("Implement onScrubbingUpdate for your morph!");
  },

  getScrubbingStartValue: function(position) {
    // can be  overriden
    return 0;
  },

  getScrubbingMode: function(position) {
    // can be  overriden
    return "number";
  }
});

function scrubbingExample() {
  // scrubbingExample();
  var morph = lively.BuildSpec({
      _Extent: lively.pt(50,50),
      _Fill: Color.red,
      className: "lively.morphic.Box",
      grabbingEnabled: false,
      layout: { adjustForNewBounds: true },
      name: "ScrubbingExample",
      submorphs: [{
          className: "lively.morphic.Text",
          _Extent: lively.pt(27.7,28.0),
          _Position: lively.pt(20,10),
          _TextColor: Color.white,
          grabbingEnabled: false,
          _IsSelectable: false,
          layout: { centeredHorizontal: true, centeredVertical: true, resizeWidth: false },
          name: "text",
          textString: "0"
      }],
  
      getScrubbingStartValue: function getScrubbingStartValue() {
        return Number(this.get("text").textString);
      },
  
      reset: function reset() {
          // this.get("text").showHalos();
          this.disableGrabbing();
          this.get("text").ignoreEvents();
          Global.Trait("lively.morphic.Scrubbing").applyTo(this, {
            override: ["onDrag", "onDragEnd", "onDragStart"]
          });
          this.initScrubbingState();
      },
  
      updateMorphWithNewScrubValue: function updateMorphWithNewScrubValue(value) {
          this.get("text").textString = String(value);
      }
  }).createMorph();
  
  morph.openInWorldCenter();
  morph.reset();
  morph.applyLayout();
}

}) // end of module
