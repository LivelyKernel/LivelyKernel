module('lively.morphic.tests.Graphics').requires('lively.TestFramework','lively.morphic.Graphics').toRun(function() {

TestCase.subclass('lively.morphic.tests.ColorTests',
'testing', {
    testRgbHex: function() {
        this.assert(Color.rgbHex("#FFFFFF").equals(Color.white),"#FFFFFF should be white");
        this.assert(Color.rgbHex("#000000").equals(Color.black),"#000000 should be black");
    }
});

TestCase.subclass('lively.morphic.tests.RectangleTests',
'testing', {
    testCreateGrid: function() {
        this.epsilon = 0.001;
        var bounds = new Rectangle(0,0, 100, 200),
            w = 100/3, h = 200/2,
            result = bounds.grid(2,3),
            expected = [
                [new Rectangle(0  , 0, w, h),
                 new Rectangle(w  , 0, w, h),
                 new Rectangle(w*2, 0, w, h)],
                [new Rectangle(0  , h, w, h),
                 new Rectangle(w  , h, w, h),
                 new Rectangle(w*2, h, w, h)]];
        this.assertEqualState(expected, result);
    }
});

}) // end of module
