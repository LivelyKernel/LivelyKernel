module('lively.persistence.tests.MorphicState').requires('lively.persistence.MorphicState', 'lively.TestFramework').toRun(function() {

TestCase.subclass("lively.persistence.tests.MorphicState.Test",
"running", {
  
  setUp: function() {
    this.removePlayground = true;
    this.playground = this.makePlayground();
  },

  tearDown: function() {
    if (this.removePlayground && this.playground)
      this.playground.remove();
  },

  makePlayground: function() {
    var playground = lively.PartsBin.getPart("Rectangle", "PartsBin/Basic");

    playground.addScript(function reset() {
      this.name = "playground";
      this.removeAllMorphs();
    
      this.setFill(Global.Color.white);
      this.setExtent(pt(450,300));
      var m;
    
      m = lively.PartsBin.getPart("Rectangle", "PartsBin/Basic");
      this.addMorph(m);
      m.applyStyle({position: pt(20,20), fill: Global.Color.gray.lighter(), name: "rect1"});
    
    
      m = lively.PartsBin.getPart("Rectangle", "PartsBin/Basic");
      this.addMorph(m);
      m.applyStyle({position: pt(140,120), fill: Global.Color.gray.lighter(), name: "rect2", extent: pt(200,150)});
    
      m = lively.PartsBin.getPart("Rectangle", "PartsBin/Basic");
      this.get("rect2").addMorph(m);
      m.applyStyle({position: pt(10,10), fill: Global.Color.gray, name: "rect3"});
    
      m = lively.PartsBin.getPart("Pen", "PartsBin/Basic");
      this.addMorph(m);
      m.applyStyle({position: pt(300,10), name: "pen"});
    });

    playground.reset();
    playground.openInWorld();

    return playground;
  }
},
"testing", {


  testCaptureAndApply: function() {
    var test = this;
    var playground = this.playground;

    // check if just re-applying the state doesn't change anthing
    var step = "1";
    assertInitialState(step);
    var state1 = lively.persistence.MorphicState.captureMorphicState(playground);
    lively.persistence.MorphicState.applyMorphicState(playground, state1);
    assertInitialState(step + "-end");
    $world.alertOK(step + " OK");
    
    // let's move stuff
    var step = "2";
    playground.get("rect1").moveBy(pt(10,10))
    assertState1(step);
    var state2 = lively.persistence.MorphicState.captureMorphicState(playground);
    lively.persistence.MorphicState.applyMorphicState(playground, state2);
    assertState1(step + "-end");
    $world.alertOK(step + " OK");
    
    // got back
    var step = "3";
    lively.persistence.MorphicState.applyMorphicState(playground, state1);
    assertInitialState(step);
    $world.alertOK(step + " OK");
    
    // morph removal
    var step = 4;
    playground.get("rect2").remove();
    test.assert(lively.lang.arr.equals(["rect1", "pen"], playground.submorphs.pluck("name")), step + " submorphs initial");
    var state3 = lively.persistence.MorphicState.captureMorphicState(playground);
    lively.persistence.MorphicState.applyMorphicState(playground, state1);
    test.assert(lively.lang.arr.equals(["rect1", "rect2", "pen"], playground.submorphs.pluck("name")), step + " submorphs state 1");
    lively.persistence.MorphicState.applyMorphicState(playground, state3);
    test.assert(lively.lang.arr.equals(["rect1", "pen"], playground.submorphs.pluck("name")), step + " submorphs state 3");
    lively.persistence.MorphicState.applyMorphicState(playground, state1);
    test.assert(lively.lang.arr.equals(["rect1", "rect2", "pen"], playground.submorphs.pluck("name")), step + " submorphs state 3");
    $world.alertOK(step + " OK");
    
    // pen
    var step = 5;
    var pen = playground.get("pen");
    pen.reset(pt(0,0));
    pen.showingAllMoves = true;
    pen.go(100);
    pen.turn(45);
    pen.go(100);
    pen.turn(-45);
    pen.go(100);
    var state4 = lively.persistence.MorphicState.captureMorphicState(playground);
    test.assert(pen.lineInProgress === playground.submorphs.last(), step + ": line not drawn");
    lively.persistence.MorphicState.applyMorphicState(playground, state1);
    test.assert(!pen.lineInProgress.owner, step + ": line not removed");
    lively.persistence.MorphicState.applyMorphicState(playground, state4);
    test.assert(pen.lineInProgress === playground.submorphs.last(), step + ": line not recreated");
    
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    
    function assertInitialState(msg) {
      msg = msg || "";
      test.assert(lively.rect(20,20,100,100)  .equals(playground.get("rect1").getBounds()), msg + " rect1");
      test.assert(lively.rect(140,120,200,150).equals(playground.get("rect2").getBounds()), msg + " rect2");
      test.assert(lively.rect(10,10,100,100)  .equals(playground.get("rect3").getBounds()), msg + " rect3");
      test.assert(lively.pt(300.0,10.0)       .equals(playground.get("pen").getPosition()), msg + " pen");
      test.assert(lively.lang.arr.equals(["rect1", "rect2","pen"], playground.submorphs.pluck("name")), msg + " submorphs");
    }
    
    function assertState1(msg) {
      msg = msg || "";
      test.assert(lively.rect(30,30,100,100)  .equals(playground.get("rect1").getBounds()), msg + " rect1");
      test.assert(lively.rect(140,120,200,150).equals(playground.get("rect2").getBounds()), msg + " rect2");
      test.assert(lively.rect(10,10,100,100)  .equals(playground.get("rect3").getBounds()), msg + " rect3");
      test.assert(lively.pt(300.0,10.0)       .equals(playground.get("pen").getPosition()), msg + " pen");
      test.assert(lively.lang.arr.equals(["rect1", "rect2","pen"], playground.submorphs.pluck("name")), msg + " submorphs");
    }

  }  
})


}) // end of module
