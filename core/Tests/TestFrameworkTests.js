module('Tests.TestFrameworkTests').requires('lively.TestFramework').toRun(function() {

/* These tests are used for testing the test framework itself
TestCase, TestResult, TestSuite, and AsyncTestCase are tested */

/**
 * @class TestTestCase
 * Tests the TestCase class
 */
TestCase.subclass('Tests.TestFrameworkTests.TestCaseTest', {
	  setUp: function() {
		    this.setUpWasRun = true;
	  },

	  testWasRun: function() {
		    this.wasRun = true;
	  },

	  testAssertFails: function() {
        try {
            this.assert(false, 'This should fail');
        } catch(e) {
            return;
        };
        // Not really tests the assert...
        this.assert(false);
	  },

	  testRunSetUp: function() {
	      this.log(this.setUpWasRun);
	      this.assert(this.setUpWasRun, 'setUp method was not invoked');
	  },

	  testAssertFailsNot: function() {
		    this.assert(true, 'This should not fail');
    },

    testAssertEqualFails: function() {
        try {
            this.assertEquals(3,4, 'This should fail');
	      } catch(e) {
	          return;
	      };
	      this.assert(false);
	  },

    testAssertEqualFailsNot: function() {
		    this.assertEquals(3,3, 'This should not fail');
	  },

    testAssertIndentityFails: function() {
            try {
                var o1 = {};
                var o2 = {};
                this.assertIdentity(o1,o2, 'This should fail');
	          } catch(e) {
	              return;
	          };
	      this.assert(false);
	  },

    testAssertEqualIdentityNot: function() {
        var o = {};
		    this.assertEquals(o,o, 'This should not fail');
	  },

	  testAssertEqualState: function() {
		    this.assertEqualState({a: 123, b: 'xyz'}, {a: 123, b: 'xyz'});
	  },

	  testAssertEqualStateFails: function() {
		    try {
			      this.assertEqualState([], [{a: 123, b: 'xyz'}]);
		    } catch(e) {
			      if (e.isAssertion) return;
		    };
		        this.assert(false, 'State of objects are not equal!');
	  },

	  testTearDown: function() {
        var counter = 0;
        // Use a existing DummyClass...!
        TestCase.subclass('DummyTearDownTestCase', {
            test1: function() {},
            test2: function() {},
            tearDown: function() {counter += 1},
        });
        new DummyTearDownTestCase().runAll();
        this.assertEquals(counter, 2);
	  },

	  testDonCatchErrors: function() {
        TestCase.subclass('DummyTestCatchError', {
            test1: function() {throw Error},
        });
        try {
            new DummyTestCatchError().runAll();
            this.assert(false, "should not get here");
        } catch (e) {
            this.assert(true, "should get here")
        };
	  },

	  testDonRunTestsInTestClassesWhichDoNotWant: function() {
        var notCalled = true;
        // Use a existing DummyClass...!
        TestCase.subclass('DummyDontRunTestCase', {
            shouldRun: false,
            test1: function() { notCalled = false },
        });
        new DummyDontRunTestCase().runAll();
        this.assert(notCalled);
        new DummyDontRunTestCase().runTest('test1');
        this.assert(notCalled);
	  },

	  testTestSelectorsDontIncludeInherit: function() {
        var notCalled = true;
        // Use a existing DummyClass...!
        TestCase.subclass('Dummy1', { test1: function() {} });
        Dummy1.subclass('Dummy2', { test2: function() {} });
        this.assertEqualState(new Dummy2().allTestSelectors(), ['test2']);
	  }

});

/**
 * @class TestResultTest
 */
TestCase.subclass('Tests.TestFrameworkTests.TestResultTest', {
	  setUp: function() {
        TestCase.subclass('DummyTestCase', {
            testGreen1: function() {this.assert(true);},
	          testGreen2: function() {},
	          testRed: function() { this.assert(false, 'dummyMessage'); }
        });
        TestCase.subclass('DummyTestCase1', { testGreenTest1: function() { this.assert(true); } });
        TestCase.subclass('DummyTestCase2', { testGreenTest2: function() { this.assert(true); } });
        TestCase.subclass('DummyTestCase3', { testRedTest1: function() { this.assert(false); } });
        this.dummyTestCase = new DummyTestCase();
	  },

    tearDown: function() {
        delete Global.DummyTestCase;
        delete Global.DummyTestCase1;
        delete Global.DummyTestCase2;
        delete Global.DummyTestCase3;
    },

    testDummyIsThere: function() {
        this.assert(this.dummyTestCase);
    },

    testResultForOneSucceedingTest: function() {
        var greenTestSel = 'testGreen1';
        this.dummyTestCase.runTest(greenTestSel);
        var result = this.dummyTestCase.result;
        this.assertEquals(result.runs(), 1);
        this.assertEquals(result.succeeded.first().selector, greenTestSel);
        this.assertEquals(result.succeeded.first().classname, 'DummyTestCase');
    },

    testResultForTwoSucceedingTest: function() {
        this.dummyTestCase.runTest('testGreen1');
        this.dummyTestCase.runTest('testGreen2');;
        this.assertEquals(this.dummyTestCase.result.runs(), 2);
    },

    testResultForFailingTest: function() {
        var redTestSel = 'testRed';
        this.dummyTestCase.runTest(redTestSel);
        var result = this.dummyTestCase.result;
        this.assertEquals(this.dummyTestCase.result.runs(), 1);
        this.assertEquals(result.failed.first().selector, redTestSel);
        this.assertEquals(result.failed.first().classname, 'DummyTestCase');
    },

    testStringRepresentation: function() {
        this.dummyTestCase.runAll();
        var result = this.dummyTestCase.result;
        this.assert(result.shortResult().startsWith('Tests run: 3 -- Tests failed: 1 -- Time:'));
        this.assertEquals(result.failureList().length, 1);
        this.assert(result.toString(), "toString failed");
        this.assert(result.printResult(), "printResult failed");
    }

});

/**
 * @class TestSuiteTest
 */
// Todo: implement async testing to be able to test that
// TestCase.subclass('TestSuiteTest', {
//  testRunAll: function() {
//      ts = new TestSuite();
//      ts.setTestCases([DummyTestCase1, DummyTestCase2, DummyTestCase3]);
//      ts.runAll();
//      this.assertEquals(ts.result.runs(), 3, 'result');
//  }
// });

TestCase.subclass('Tests.TestFrameworkTests.RememberStackTest', {

	shouldRun: false,

	a: function(a, b, c) {
		this.assert(false);
	},

	b: function(parameter) {
		throw new Error();
	},

	dummyTest: function() {
		console.log("dummy: " + getCurrentContext());
		this.a(1, 2, 3);
	},

	myFailure: function() {
		this.a(1, 2, 3, ['a', 'b', 'c']);
	},

    // testError: function() {
    //         new FabrikComponent().buildView();
    //          this.a(1, 2, ['a', 'b', 'c']);
    //     },

	myError: function() {
		this.b(1);
	},

	// testOpenStackViewer: function() {
	// 	Config.debugExtras = true;
	// 	var result = this.debugTest("testError");
	// 	new StackViewer(this, result.err.stack).openIn(WorldMorph.current(), pt(1,1));
	// 	Config.debugExtras = false;
	// },

	testReturnCurrentContextWhenFail: function() {
		var testCase = new this.constructor();
		var originalSource = testCase.a.toString();
		//root = Function.trace(this.dummyTest());
		var error = testCase.debugTest("dummyTest");

		this.assert(error.err.stack, "Failed to capture currentContext into assertion.stack");
		this.assertEquals(error.err.stack.caller.method.qualifiedMethodName(), "RememberStackTest.a");

		this.assert(testCase.a.toString() == originalSource, "Functions are not unwrapped");
	},

	testGetArgumentNames: function() {
		var errorStackViewer = new ErrorStackViewer();
		var result = errorStackViewer.getArgumentNames(this.a.toString());
		this.assertEquals(result.length, 3);
		this.assertEquals(result[0], 'a');
		this.assertEquals(result[1], 'b');
		this.assertEquals(result[2], 'c');
	},

	testGetArgumentNames2: function() {
		var errorStackViewer = new ErrorStackViewer();
		var result = errorStackViewer.getArgumentNames(this.myError.toString());
		this.assertEquals(result.length, 0);
	},

	testGetArgumentValueNamePairs: function() {
		var testCase = new this.constructor();
		var testResult = testCase.debugTest("myError");

		var errorStackViewer = new ErrorStackViewer();
		var result = errorStackViewer.getArgumentValueNamePairs(testResult.err.stack);
		this.assertEquals(result.length, 1);
		this.assertEquals(result[0], 'parameter: 1');
	},

	testGetArgumentValueNamePairsForMethodWithUnnamedParameters: function() {
		var testCase = new this.constructor();
		var testResult = testCase.debugTest("myFailure");

		var errorStackViewer = new ErrorStackViewer();
		// testResult.err.stack is the assertion, so use caller
		var result = errorStackViewer.getArgumentValueNamePairs(testResult.err.stack.caller);
		console.log('Result: ' + result);
		this.assertEquals(result.length, 4);
		this.assertEquals(result[0], 'a: 1');
	},

	testGetArgumentValueNamePairsForMethodWithUnnamedParameters: function() {
		var testCase = new this.constructor();
		var testResult = testCase.debugTest("myError");

		var errorStackViewer = new ErrorStackViewer();
		// testResult.err.stack is the assertion, so use caller
		var result = errorStackViewer.getArgumentValueNamePairs(testResult.err.stack.caller);
			console.log('Result: ' + result);
		this.assertEquals(result.length, 0);
	}
});


TestCase.subclass('Tests.TestFrameworkTests.ErrorStackViewerTest', {

	shouldRun: false,

	setUp: function() {
		this.viewer = new ErrorStackViewer();
	},

	testExtractArgumentString: function() {
		this.assertEquals(this.viewer.extractArgumentString("function () { }"), "");
		this.assertEquals(this.viewer.extractArgumentString("function (a, b) { }"), "a, b");
		this.assertEquals(this.viewer.extractArgumentString("function foobar (a, b) { }"), "a, b");
	}
});

Object.subclass('StackDummy', {

	a: function(parameter) {
	    console.log("a callee: " + arguments.callee)
	    console.log("a callee.caller: " + arguments.callee.caller)
	    console.log("a callee.caller.caller: " + arguments.callee.caller.caller)
	    console.log("a callee.caller.caller.caller: " + arguments.callee.caller.caller.caller)
        return parameter + 1;
	},

	b: function(parameter) {
        return this.a(parameter) + 1
	},

	c: function(parameter) {
        return this.b(parameter) + 1
	},

	d: function(parameter) {
        return this.c(parameter) + 1
	},
});

function stackTestFunctions(){

function a(parameter) {
    for(p in arguments.callee.caller){
        this.console.log("P:" + p)
    };
    // logStack();
    return arguments;
};

function b(parameter) {
    return a(1,2,3)
};

c = function(parameter) {
    return b()
};

d = function(parameter) {
    return c()
};

function dummyRecurse(a) {
    if (a < 0 ) {
        // logStack();
        return 1
    } else {
        return dummyRecurse(a - 1) * a
    }
};
} //stackTestFunctions


TestCase.subclass('Tests.TestFrameworkTests.NativeStackTest', {

    shouldRun: true,

    testGetStack: function() {
        var stack = getStack();
        this.assert(stack.length > 1);

    },



    tearDown: function() {
        if(this.window) this.window.remove();
    },
});


AsyncTestCase.subclass('Tests.TestFrameworkTests.AsyncTestCaseTest', {
    // Tests if
    //   - synchronous tests are run before asynchronous tests
    //   - asynchronous tests are run only when earlier tests
    //     (both sync adn async) are marked as done

	runAll: function($super, statusUpdateFunc, whenDoneFunc) {
		// yeah, it's ugly
		Global.test1Called = false;
		Global.test2AsyncCalled = false;
		Global.test3Called = false;

		$super(statusUpdateFunc, whenDoneFunc);
	},

	tearDown: function() {
		this.tearDownCalled = true
	},

    test1: function() {
		Global.test1Called = true;
		this.assert(!Global.test2AsyncCalled, 'test2Async already called');
		this.done();
	},

    test2Async: function() {
		this.delay(function() {
			Global.test2AsyncCalled = true;
			this.assert(Global.test1Called, 'test1 was not called');
			this.assert(!Global.test3Called, 'test3 was already called');
			this.assert(!this.tearDownCalled, 'tearDown was already called');
			this.done();
		}, 800);
	},

    test3: function() {
      Global.test3Called = true;
      this.assert(Global.test2AsyncCalled, 'test2AsyncCalled was not called');
      this.done();
    },

  });


console.log('loaded TestFrameworkTests.js');

}) // end of module