module('lively.morphic.tests.Graphics').requires('lively.morphic.Graphics').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.ColorTests',
'testing', {
    testRgbHex: function() {
        this.assert(Color.rgbHex("#FFFFFF").equals(new Color(1,1,1)),"#FFFFFF should be white");
        this.assert(Color.rgbHex("#000000 ").equals(new Color(0,0,0)),"#000000 should be black");        
    },
});

}) // end of module