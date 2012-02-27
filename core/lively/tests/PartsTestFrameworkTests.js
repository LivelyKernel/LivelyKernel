module('lively.tests.PartsTestFrameworkTests').requires('lively.PartsTestFramework').toRun(function() {

TestCase.subclass('lively.tests.PartsTestFrameworkTests.PartTestTest', 'testing', {

    setUp: function() {
        this.part = lively.morphic.Morph.makeRectangle(0, 0, 100, 100);
        this.part.openInWorld();
    },
    tearDown: function() {
        this.part.remove();
    },
    test01AddTestMethods: function() {
        this.part.addPartTest(function test01() {});
        this.part.addPartTest(function test02() {});
        this.part.addPartTest(function test03() {});
        this.assertEquals(Functions.own(this.part.getTestsObject()).length, 3, 
                'part under test was expected to have 3 test methods');
    },

    test02AssertTrueAndFalse: function() {
        var result;
        this.part.addPartTest(function test01AssertTrue() {
                this.assert(true, 'pass');
            });
        this.part.addPartTest(function test02AssertFalse() {
                this.assert(false, 'fail');
            });
        result = this.part.runPartTests();
        this.assertEquals(result.failed.length, 1, 'expected 1 test to fail');
        this.assertEquals(result.succeeded.length, 1, 'expected 1 test to succeed');
    },
    test03PassPartAsArgument: function() {
        var result;
        this.part.setFill(Color.blue);
        this.part.addPartTest(function test01RectangleIsBlue(aPart) {
                        this.assert(aPart.getFill().equals(Color.blue), 
                            'Rectangle was expected to be blue');
                    });
        result = this.part.runPartTests();
        this.assertEquals(result.failed.length, 0, 'expected no tests to fail');
        this.assertEquals(result.succeeded.length, 1, 'expected 1 test to succeed');
    },
    test04RemoveTestMethod: function() {
        this.part.addPartTest(function test01() {});
        this.part.addPartTest(function test02() {});
        this.part.addPartTest(function test03() {});
        this.part.removePartTest('test03');
        this.assertEquals(Functions.own(this.part.getTestsObject()).length, 2, 
                'one test method was expected to be removed');
    },
    test05CopyPartBeforeTesting: function() {
        this.part.setFill(Color.blue);
        this.part.addPartTest(function test01(aPart) {
                aPart.setFill(Color.red);
            });
        this.part.runPartTests();
        this.assert(this.part.getFill().equals(Color.blue), 'test should not have changed the original part');
    },


});

}) // end of module
