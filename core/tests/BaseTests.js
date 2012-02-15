module('tests.BaseTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('tests.BaseTests.PointTest', {
    
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

TestCase.subclass('tests.BaseTests.ObjectsTest', {
	testTypeStringOf: function() {
		this.assertEquals(Objects.typeStringOf('some string'), 'String');
		this.assertEquals(Objects.typeStringOf(0), 'Number');
		this.assertEquals(Objects.typeStringOf(null), 'null');
		this.assertEquals(Objects.typeStringOf(undefined), 'undefined');
		this.assertEquals(Objects.typeStringOf([]), 'Array');
		this.assertEquals(Objects.typeStringOf({a: 2}), 'Object');
		this.assertEquals(Objects.typeStringOf(new lively.morphic.Morph()), 'Morph');
	},
	testShortPrintStringOf: function() {
		this.assertEquals(Objects.shortPrintStringOf([1,2]), '[...]', 'filled arrays should be displayed as [...]');
		this.assertEquals(Objects.shortPrintStringOf([]), '[]', 'empty arrays should be displayed as []');
		this.assertEquals(Objects.shortPrintStringOf(0), '0', 'numbers should be displayed as values');
		this.assertEquals(Objects.shortPrintStringOf(new lively.morphic.Morph()), 'Morph', 'short typestring of a morph is still Morph');
	},
	testIsMutableType: function() {
		this.assert(Objects.isMutableType([1,2]), 'arrays are mutable');
		this.assert(Objects.isMutableType({}), 'empty objects are mutable');
		this.assert(Objects.isMutableType(new lively.morphic.Morph()), 'complex objects are mutable');
		this.assert(!Objects.isMutableType(2), 'numbers are immutable');
	},
	testSafeToString: function() {
		this.assertEquals(Objects.safeToString(null), 'null');
		this.assertEquals(Objects.safeToString(undefined), 'undefined');
		this.assertEquals(Objects.safeToString(2), '2');
	}
});


}) // end of module