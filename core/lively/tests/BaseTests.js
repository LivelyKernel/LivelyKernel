module('lively.tests.BaseTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.tests.BaseTests.PointTest', {
    
    testGriddedBy: function() {
        var p = pt(12, 26)
        var p2 = p.griddedBy(pt(5,5))
        this.assertEqualState(p2, pt(10,25))
    },
    testSubPtForArgumentErrors: function() {
        try {
            pt(12, 42).subPt(23, 32);
            this.assert(false, "subPt should check for non-point arguments");
        } catch (e) { }
        try {
            var p = pt(12, 42).subPt({x: 12, y: 42});
            this.assertEquals(p.toString(), pt(0,0).toString(), "subPt failed");
        } catch (e) { 
            this.assert(false, "subPt should not throw exception: " + e.message);
        }
    },
    testAddPtForArgumentErrors: function() {
        try {
            pt(12, 42).addPt(23, 32);
            this.assert(false, "addPt should check for non-point arguments");
        } catch (e) { }

        try {
            var p = pt(12, 42).addPt({x: 12, y: 42});
            this.assertEquals(p.toString(), pt(24,84).toString(), "subPt failed");
        } catch (e) { 
            this.assert(false, "subPt should not throw exception: " + e.message);
        }
    },
});

}) // end of module