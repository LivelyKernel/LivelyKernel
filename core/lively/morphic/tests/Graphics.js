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
    },

    testLineTo: function() {
        var r1 = lively.rect(0,0, 10, 10),
            r2 = lively.rect(20,5, 10, 10),
            line = r1.lineTo(r2);
        this.assertEquals(pt(10,6.25).lineTo(pt(20,8.75)), line);
    }
});

TestCase.subclass('lively.morphic.tests.Line',
'testing', {

    testLineCreationAndEquality: function() {
        var line1 = pt(10,10).lineTo(pt(20,20)),
            line2 = new lively.Line(pt(10,10), pt(20,20)),
            line3 = new lively.Line(pt(10,10), pt(23,20));
        this.assertEquals(line1, line2, 'line1 = line2');
        this.assertEquals(line2, line1, 'line2 = line1');
        this.assert(!line1.equals(line3), 'line1 = line3');
        this.assert(!line3.equals(line2), 'line3 = line2');
    },

    testLinesFromRect: function() {
        var r = new lively.Rectangle(10, 10, 10, 10),
            top = pt(10,10).lineTo(pt(20,10)),
            bottom = pt(10,20).lineTo(pt(20,20)),
            left = pt(10,10).lineTo(pt(10,20)),
            right = pt(20,10).lineTo(pt(20,20));
        this.assertEquals(top, r.topEdge(), "top");
        this.assertEquals(bottom, r.bottomEdge(), "bottom");
        this.assertEquals(left, r.leftEdge(), "left");
        this.assertEquals(right, r.rightEdge(), "right");
    },

    testPointOnLine: function() {
        var line = pt(10,10).lineTo(pt(20,20)),
            p1 = pt(12, 12),
            p2 = pt(21,21),
            p3 = pt(16,12);
        this.assert(line.includesPoint(p1), "p1");
        this.assert(line.includesPoint(p1, true), "p1 unconstrained");
        this.assert(!line.includesPoint(p2), "p2");
        this.assert(line.includesPoint(p2, true), "p2 unconstrained");
        this.assert(!line.includesPoint(p3), "p3");
        this.assert(!line.includesPoint(p3, true), "p3 unconstrained");
    },

    testLineIntersection: function() {
        var line1 = pt(10,10).lineTo(pt(20,20)),
            line2 = pt(20,10).lineTo(pt(10,20));
        this.assertEquals(pt(15,15), line1.intersection(line2), 'line1 x line2');
        this.assertEquals(pt(15,15), line2.intersection(line1), 'line1 x line2');
    },

    testIntersectionUnconstrained: function() {
        var line1 = pt(10,10).lineTo(pt(11,11)),
            line2 = pt(20,10).lineTo(pt(10,20));
        this.assertEquals(pt(15,15), line1.intersection(line2, {constrained: true}),
                          'unconstrained');
        this.assertEquals(null, line1.intersection(line2), 'constrained');
    },

    testLineIntersectionParrallel: function() {
        var line1 = pt(10,10).lineTo(pt(20,20)),
            line2 = pt(20,10).lineTo(pt(30,20));
        this.assert(!line1.intersection(line2), 'line1 x line2');
    },

    testSampleNPointsAlongLine: function() {
        var line = pt(10,10).lineTo(pt(20,20));
        this.assertEquals(
            [pt(10,10), pt(12,12), pt(14,14), pt(16,16), pt(18,18), pt(20,20)],
            line.sampleN(5));
    },

    testSampleSpacedPointsAlongLine: function() {
        var line = pt(10,10).lineTo(pt(20,10));
        line.length()
        this.assertEquals(
            [pt(10,10), pt(12,10), pt(14,10), pt(16,10), pt(18,10), pt(20,10)],
            line.sample(2)); // step length: 2
    },

    testLineRectangleIntersection1: function() {
        var r, line, result;
        // two points crossing
        r = new lively.Rectangle(0,0, 20, 20);
        line = pt(5,0).lineTo(pt(15,20));
        result = r.lineIntersection(line);
        this.assertEquals([pt(5,0), pt(15,20)], result);

        // one point
        line = r.center().lineTo(r.bottomCenter());
        result = r.lineIntersection(line);
        this.assertEquals([pt(10, 20)], result);
    }

});

}) // end of module
