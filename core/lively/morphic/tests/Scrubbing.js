module('lively.morphic.tests.Scrubbing').requires('lively.TestFramework', "lively.morphic.Scrubbing").toRun(function() {

TestCase.subclass('lively.morphic.tests.Scrubbing.Test',
"testing", {

  test01JustScrubIt: function() {
    var m = lively.morphic.Morph.makeRectangle(0,0,10,10)
    m.log = [];

    Trait("lively.morphic.Scrubbing").applyTo(m)
    m.addScript(function updateMorphWithNewScrubValue(val) { this.log.push(val); });

    m.initScrubbingState({initialFactor: .1, factorOffset: 15});

    this.onTearDown(function() { m.stopScrubbing(); });

    this.assert(!m.isScrubbing(),  "isScrubbing");

    m.startScrubbing(pt(0,0), 0, "number");
    m.updateScrubbing(pt(0, 0));
    m.updateScrubbing(pt(5, 0));
    m.updateScrubbing(pt(15, 0));
    m.updateScrubbing(pt(25, 0));
    m.updateScrubbing(pt(25, 15));
    m.updateScrubbing(pt(35, 15));
    this.assert(m.isScrubbing(),  "isScrubbing 2");
    m.stopScrubbing();
    this.assert(!m.isScrubbing(),  "isScrubbing 3");

    var expected = [0,0,0.1,0.2,0.3,0.3,0.31];
    this.assertEqualState(expected, m.log);
  },  
});

}) // end of module
