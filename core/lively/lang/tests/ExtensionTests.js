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

TestCase.subclass('lively.lang.tests.ExtensionTests.PropertiesTest',
'running', {
    setUp: function() {
        var Foo = function() {
            this.a = 1;
            this.aa = 1;
            this.b = Functions.True;    
        };
        Foo.prototype.c = 2;
        Foo.prototype.cc = 2;
        Foo.prototype.d = Functions.False;
        this.sut = new Foo();
    }
},
'testing', {
    testAll: function() {
        var expected, result;
        expected = ["a", "c"];
        result = Properties.all(this.sut, function (name, object) { 
            return name.length == 1;
        });
        this.assertMatches(expected, result);
        expected = ["aa", "cc"];
        result = Properties.all(this.sut, function (name, object) { 
            return name.length == 2;
        });
        this.assertMatches(expected, result);
    },
    testOwn: function() {
        var expected = ["a", "aa"];
        var result = Properties.own(this.sut);
        this.assertMatches(expected, result);
    },
    testAllProperties: function() {
        var expected, result;
        expected = ["a", "b", "c", "d"];
        result = Properties.allProperties(this.sut, function (object, name) { 
            return name.length == 1;
        });
        this.assertMatches(expected, result);
        expected = ["aa", "cc"];
        result = Properties.allProperties(this.sut, function (object, name) { 
            return name.length == 2;
        });
        this.assertMatches(expected, result);
    }
});


}) // end of module