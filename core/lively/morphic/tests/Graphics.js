module('lively.morphic.tests.Graphics').requires().toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.ColorTests',
'testing', {
    testRgbHex: function() {
        this.assert(new Color(1,1,1).equals(Color.rgbHex("#FFFFFF")),"#FFFFFF should be white");
        this.assert(new Color(0,0,0).equals(Color.rgbHex("#000000")),"#000000 should be black");        
    },
});

}) // end of module