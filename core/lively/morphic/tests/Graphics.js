module('lively.morphic.tests.Graphics').requires('lively.TestFramework','lively.morphic.Graphics').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.ColorTests',
'testing', {
    testRgbHex: function() {
        this.assert(Color.rgbHex("#FFFFFF").equals(Color.white),"#FFFFFF should be white");
        this.assert(Color.rgbHex("#000000").equals(Color.black),"#000000 should be black");
    },
});

}) // end of module