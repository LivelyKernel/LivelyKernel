module('Tests.ObjectTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('Tests.ObjectTests.ObjectPropertyOperationsTest',
'testing', {
	test01aObjectMerge: function() {
		var a = {foo: 2, m: function() { return 6}},
			b = {bar: 3, m: function() { return 7}},
			c = {foo: 4, baz: 5},
			result = Object.merge([a, b, c]);
		this.assertEquals(4, result.foo);
		this.assertEquals(3, result.bar);
		this.assertEquals(5, result.baz);
		this.assertEquals(7, result.m());
	},
	test01bArrayMerge: function() {
		var a = [1, 2, 3, 6],
			b = [4, 2, 5],
			result = Object.merge([a, b]);
		this.assertEqualState(a.concat(b), result);
	},

	test02GetAllSlotsInPropertyHierarchy: function() {
		var classA = Object.subclass('Tests.ObjectTests.ClassA', { foo: 3 }),
			classB = classA.subclass('Tests.ObjectTests.ClassB'),
			classC = classB.subclass('Tests.ObjectTests.ClassC', {foo: 4 }),
			instance = new classC();
		instance.foo = 5;
		var instance2 = Object.inherit(instance);
		instance2.foo = 6;
		try {
			var result = Object.valuesInPropertyHierarchy(instance2, 'foo');
			this.assertEqualState([3, 4, 5, 6], result);
		} finally {
			[classA, classB, classC].invoke('remove');
		}
	},
	test03MergePropertiesFromHierarchy: function() {
		var classA = Object.subclass('Tests.ObjectTests.ClassA', {style: {foo: 3, bar: 4}}),
			classB = classA.subclass('Tests.ObjectTests.ClassB', {style: {bar: 5}}),
			instance = new classB();
		instance.style = {baz: 9};
		try {
			var result = Object.mergePropertyInHierarchy(instance, 'style');
			this.assertEquals(3, result.foo);
			this.assertEquals(5, result.bar);
			this.assertEquals(9, result.baz);
		} finally {
			[classA, classB].invoke('remove');
		}
	},



})

}) // end of module