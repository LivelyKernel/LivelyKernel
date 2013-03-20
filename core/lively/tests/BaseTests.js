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
    }
});

TestCase.subclass('lively.tests.BaseTests.StringsFormatTableTest', {

    testPrintTable: function() {
        var testData = [
            {expected: 'a b c',
             input: [['a', 'b', 'c']]},
            {expected: 'a b c\nd e f',
             input: [['a', 'b', 'c'], ['d', 'e', 'f']]},
            {expected: 'aaa b c\nd   e f',
             input: [['aaa', 'b', 'c'], ['d', 'e', 'f']]},
            {expected: 'a|b|c',
             input: [['a', 'b', 'c']],
             options: {separator: "|"}},
            {expected: 'a   b c\nd eee f',
             input: [['a', 'b', 'c'], ['d', 'eee', 'f']],
             options: {align: "right"}},
            {expected: 'a   b c\nd eee f',
             input: [['a', 'b', 'c'], ['d', 'eee', 'f']],
             options: {align: "right"}},
            {expected: 'a   b c  \nd eee fff',
             input: [['a', 'b', 'c '], ['d', 'eee', 'fff']],
             options: {align: ["left", "right", "left"]}}];
        testData.forEach(function(data, i) {
            debugger
            this.assertEquals(data.expected,
                              Strings.printTable(data.input, data.options),
                              'for ' + i + ' ' + data.input);
        }, this);
    }

});

}) // end of module
