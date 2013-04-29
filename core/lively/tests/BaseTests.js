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
            this.assertEquals(data.expected,
                              Strings.printTable(data.input, data.options),
                              'for ' + i + ' ' + data.input);
        }, this);
    }

});

TestCase.subclass('lively.tests.BaseTests.StringsMD5Test', {

    testMD5: function() {
        // test suite from RFC 1321
        var testData = [
             {input: '',
             expected: 'd41d8cd98f00b204e9800998ecf8427e'},
            {input: 'a',
             expected: '0cc175b9c0f1b6a831c399e269772661'},
            {input: 'abc',
             expected: '900150983cd24fb0d6963f7d28e17f72'},
            {input: 'message digest',
             expected: 'f96b697d7cb7938d525a2f31aaf161d0'},
            {input: 'abcdefghijklmnopqrstuvwxyz',
             expected: 'c3fcd3d76192e4007dfb496cca67e13b'},
            {input: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
             expected: 'd174ab98d277d9f5a5611c2c9f419d9f'},
            {input: '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
             expected: '57edf4a22be3c955ac49da2e2107b67a'}
        ];
        testData.forEach(function(data, i) {
            this.assertEquals(data.expected, Strings.md5(data.input));
        }, this);
    }
});
}) // end of module
