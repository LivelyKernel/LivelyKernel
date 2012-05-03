module('lively.tests.TraitTests').requires('lively.TestFramework', 'lively.Traits').toRun(function() {


TestCase.subclass('lively.tests.TraitsTests.BaseTest',
'running', {
	  setUp: function() {
		    this.traitsToRemove = [];
		    this.createDummyClasses();
	  },

	  tearDown: function() {
		    this.removeDummyClasses();
		    this.traitsToRemove.forEach(function(name) {
			      Trait(name).remove(name);
		    });
	  },

},
'trait handling', {
	  removeTraitAfterwards: function(traitName) {
		    this.traitsToRemove.push(traitName);
	  },

},
'test classes', {
	  createDummyClasses: function() {
		    this.dummyA = Object.subclass('lively.tests.TraitsTests.DummyA', {
			      a: 4,
			      m1: function() { return this.m2() + 3 },
			      m2: function() { return this.a },
		    });
		    this.dummyB = this.dummyA.subclass('lively.tests.TraitsTests.DummyB', {
			      m1: function($super) { return $super() + 2 },
			      m3: function($super) { return 99 },
		    });
	  },

	  removeDummyClasses: function() {
		    this.dummyA.remove();
		    this.dummyB.remove();
	  },
});

lively.tests.TraitsTests.BaseTest.subclass('lively.tests.TraitsTests.TraitCreation',
'testing', {
	  testCreateTraitNamed: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {a: function() { }});
		    this.assert(Object.isFunction(trait.def.a), 'no method a in trait');
		    this.assertIdentity(trait, Trait('Foo'), 'no trait identity');
		    trait.remove();
		    this.assert(trait !== Trait('Foo'), 'trait not removed');
	  },

	  testCreateTraitWithMethodCategories: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', 'test', {a: function() { }});
		    this.assert(Object.isFunction(trait.def.a), 'no method a in trait');
		    this.assertEqualState(trait.getCategoryNames(), ['test'], 'categories wrong');
	  },

	  testTraitAddedToClass: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {b: function() { return 2 }, m1: function() { return 33 }});
		    trait.applyTo(this.dummyA);
		    var obj = new this.dummyA();
		    this.assert(Object.isFunction(obj.b), 'no trait method b in obj');
		    this.assertEquals(2, obj.b());
		    this.assertEquals(7, obj.m1(), 'Original method overwritten');
	  },

	  testTraitAddedToClassOverwritesPropertiesInPrototypeChain: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {m2: function() {return 33}, m3: function() {return 22}});
		    trait.applyTo(this.dummyB);
		    var obj = new this.dummyB();

		    this.assertEquals(99, obj.m3(), 'own method overwritten');
		    this.assertEquals(4, obj.m2(), 'method in prototype chain overwritten');
	  },

	  testTraitInClassDef: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {b: function() { return 2 }, m1: function() { return 33 }});
		    this.dummyA = Object.subclass('DummyClassForTraitTest', trait, { m1: function() { return 7 }})
		    var obj = new this.dummyA();
		    this.assert(Object.isFunction(obj.b), 'no trait method b in obj');
		    this.assertEquals(2, obj.b());
		    this.assertEquals(7, obj.m1(), 'Original method overwritten');
	  },

	  testTraitInClassDefAliased: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {m1: function() { return 33 }});
		    this.dummyA = Object.subclass('DummyClassForTraitTest', trait.derive({alias: {m1: 'newM1'}}), { m1: function() { return 7 }})
		    var obj = new this.dummyA();
		    this.assertEquals(33, obj.newM1());
		    this.assertEquals(7, obj.m1(), 'Original method overwritten');
		    Trait('Foo', {m1: function() { return 32 }});
		    this.assertEquals(32, obj.newM1());
	  },

	  testTraitInClassDefWithOverride: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {m1: function() { return 33 }});
		    this.dummyA = Object.subclass('DummyClassForTraitTest', trait.derive({override: ['m1']}), { m1: function() { return 7 }})
		    var obj = new this.dummyA();
		    this.assertEquals(33, obj.m1(), 'Original method not overwritten');
	  },

	  testAliasing: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {b: function() { return 2 }});
		    trait.applyTo(this.dummyA, {alias: {b: 'c'}});
		    var obj = new this.dummyA();
		    this.assert(!obj.b, 'trait method not renamed 1');
		    this.assert(Object.isFunction(obj.c), 'trait method not renamed 2');
		    this.assertEquals(2, obj.c());
	  },

	  testAliasingAndExclusion: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {b: function() { return 2 }, c: function() { return 3 }});
		    trait.applyTo(this.dummyA, {alias: {b: 'c'}, exclude: ['c']});
		    var obj = new this.dummyA();
		    this.assert(!obj.b, 'trait method not renamed 1');
		    this.assert(Object.isFunction(obj.c), 'trait method not renamed 2');
		    this.assertEquals(2, obj.c());
	  },

	  testExplicitOverride: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {m1: function() { return 33 }});
		    trait.applyTo(this.dummyA, {override: ['m1']});
		    var obj = new this.dummyA();
		    this.assertEquals(33, obj.m1());
	  },

	  testClassUpdated: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {b: function() { return 2 }});
		    trait.applyTo(this.dummyA);
		    var obj = new this.dummyA();
		    this.assertEquals(2, obj.b());
		    Trait('Foo', {b: function() { return 4 }, d: function() { return 3 }});
		    this.assertEquals(3, obj.d());
		    this.assertEquals(4, obj.b());
	  },

	  testExtendTrait: function() {
		    this.removeTraitAfterwards('Foo');
		    this.removeTraitAfterwards('Bar');
		    var trait1 = Trait('Foo', {b: function() { return 2 }}),
			      trait2 = Trait('Bar', {b: function() { return 3 }, c: function() { return 4 }});
		    trait2.applyTo(trait1);
		    trait1.applyTo(this.dummyA);
		    var obj = new this.dummyA();
		    this.assertEquals(2, obj.b());
		    this.assertEquals(4, obj.c());
		    trait2 = Trait('Bar', {c: function() { return 5 }});
		    this.assertEquals(5, obj.c());
	  },

	  testRemoveFrom: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {b: function() { return 2 }});
		    trait.applyTo(this.dummyA);
		    trait.removeFrom(this.dummyA.prototype);
		    this.assert(!this.dummyA.prototype.b, 'not removed');
	  },

	  testIdentityOfDerivedTraitsWithSameOptions: function() {
		    this.removeTraitAfterwards('Foo');
		    var trait = Trait('Foo', {a: 4, m1: function() { return 33 }}),
			      derived1 = trait.derive({alias: {m1: 'newM1'}, exclude: ['a']}),
			      derived2 = trait.derive({alias: {m1: 'newM1'}, exclude: ['a']}),
			      derived3 = trait.derive({alias: {m1: 'newM1'}}),
			      derived4 = trait.derive({alias: {m1: 'newM2'}, exclude: ['a']});
		    this.assertIdentity(derived1, derived2, 'derived1 !== derived2')
		    this.assert(derived1 !== derived3, 'derived1 === derived3')
		    this.assert(derived1 !== derived4, 'derived1 === derived4')
	  },

	  testEqualOptions: function() {
		    var options1 = {alias: {m1: 'newM1'}, exclude: ['a']},
			      options2 = {alias: {m1: 'newM1'}, exclude: ['a']},
			      options3 = {alias: {m1: 'newM1'}},
			      options4 = {alias: {m1: 'newM2'}, exclude: ['a']};
		    this.assert(RealTrait.prototype.equalOptions(options1, options1), 'options1 !== options1')
		    this.assert(RealTrait.prototype.equalOptions(options1, options2), 'options1 !== options2')
		    this.assert(!RealTrait.prototype.equalOptions(options1, options3), 'options1 == options3')
		    this.assert(!RealTrait.prototype.equalOptions(options1, options4), 'options1 == options4')
	  },

    testSourceModule: function() {
        this.removeTraitAfterwards('Foo');
	      var trait = Trait('Foo', {b: function() { return 2 }});
        this.assert(trait.sourceModule, "trait has no source module");
        this.assert(trait.def.b.sourceModule, "trait function has no source module");
    },

});

lively.tests.TraitsTests.BaseTest.subclass('lively.tests.TraitsTests.ObjectTraits',
'testing', {

    testApplyTrait: function() {
        this.removeTraitAfterwards('Foo');
		    var obj = {foo: function() { return 23 }},
			      trait = Trait('Foo', {a: function() { return 99 }});
		    trait.applyTo(obj);
		    this.assert(obj.a, 'trait was not applied to object');
		    this.assertEquals(99, obj.a());
	  },

	  testUpdateTrait: function() {
        this.removeTraitAfterwards('Foo');
		    var obj = {foo: function() { return 23}},
			      trait = Trait('Foo', {a: function() { return 99 }});
		    trait.applyTo(obj);
		    this.assert(obj.a, 'trait was not applied to object');
		    Trait('Foo', {a: function() { return 77 }});
		    this.assertEquals(77, obj.a());
	  },

    testApplyTwoTraits: function() {
        this.removeTraitAfterwards('Foo');
        this.removeTraitAfterwards('Bar');
        var obj = {},
			      trait1 = Trait('Foo', {a: function() { return 99 }}),
			      trait2 = Trait('Bar', {b: function() { return 77 }});
		    trait1.applyTo(obj);
		    trait2.applyTo(obj);
		    this.assert(obj.a, 'trait1 was not applied to object');
		    this.assert(obj.b, 'trait2 was not applied to object');
    },

    testApplyTwoTraitsWithOptions: function() {
        this.removeTraitAfterwards('Foo');
        this.removeTraitAfterwards('Bar');
        var obj = {},
			      trait1 = Trait('Foo', {a: function() { return 99 }}),
			      trait2 = Trait('Bar', {a: function() { return 77 }});
		    trait1.applyTo(obj, {alias: {a: 'c'}});
		    trait2.applyTo(obj, {alias: {a: 'd'}});
		    this.assert(!obj.a, 'trait1 was not correctly applied to object (aliasing failed)');
		    this.assert(obj.c, 'trait1 was not applied to object');
		    this.assert(obj.d, 'trait2 was not applied to object');
        this.assertEquals(99, obj.c(), 'trait1 method result not ok');
		    this.assertEquals(77, obj.d(), 'trait2 method result not ok');
		    Trait('Foo', {a: function() { return 22 }});
		    Trait('Bar', {a: function() { return 11 }});
        this.assertEquals(22, obj.c(), 'trait1 method result after update not ok');
        this.assertEquals(11, obj.d(), 'trait2 method result after update not ok');
    }
});

}) // end of module