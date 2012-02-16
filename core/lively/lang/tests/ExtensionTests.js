module('lively.lang.tests.ExtensionTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.lang.tests.ExtensionTests.ObjectTest', {
    testExtendSetsDisplayName: function() {
		var obj = {};
		Object.extend(obj, {foo: function() {return "bar"}})
		this.assertEquals(obj.foo.displayName, "foo")
    },

    testExtendDoesNotOverrideExistingName: function() {
		var obj = {};
		Object.extend(obj, {foo: function myFoo() {return "bar"}})
		this.assertEquals(obj.foo.name, "myFoo", "name changed")
		this.assert(!obj.foo.displayName, "displayName is set")
    },

    testExtendDoesNotOverrideExistingDisplayName: function() {
		var obj = {};
		var f = function() {return "bar"};
		f.displayName = "myDisplayFoo"
		Object.extend(obj, {foo: f})
		this.assertEquals(obj.foo.name, "", "function has a name")
		this.assertEquals(obj.foo.displayName, "myDisplayFoo", "displayName was overridden")
    },
    
    testExtendDoesSourceModule: function() {
        var obj = {};
        var f = function() {return "bar"};
        f.displayName = "myDisplayFoo"
        Object.extend(obj, {foo: f})
        this.assert(obj.foo.sourceModule, "source module not set")
    }
});

TestCase.subclass('lively.lang.tests.ExtensionTests.ObjectsTest', {
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