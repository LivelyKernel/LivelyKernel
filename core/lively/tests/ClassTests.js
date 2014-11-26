module('lively.tests.ClassTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.tests.ClassTests.NamespaceTest', {

    setUp: function() {
        // create namespaces
		module('testNamespace.one');
        module('testNamespace.two');
		module('testNamespace.three.threeOne');
        // create classes
        Object.subclass('testNamespace.Dummy');
        Object.subclass('testNamespace.one.Dummy');
        Object.subclass('testNamespace.three.threeOne.Dummy');
        // create functions
        testNamespace.dummyFunc = function() { return 1 };
        testNamespace.three.threeOne.dummyFunc = function() { return 2 };
    },

    tearDown: function() {
		// delete Global.testNamespace; // delete leads to errors when test is re-run?
    },

    testNamespaceIsNamespace: function() {
        this.assert(testNamespace, 'no namespace');
        this.assert(testNamespace instanceof lively.Module, 'strange namespace');
        // this.assert(testNamespace.isNamespace, 'namespace doesn\' know that it is a namespace');
    },

    testGetAllNamespaces: function() {
        var result = testNamespace.subNamespaces(false);
        this.assertEquals(result.length, 3);
        this.assert(result.include(testNamespace.one));
        this.assert(result.include(testNamespace.two));
        this.assert(result.include(testNamespace.three));
    },

    testGetAllNamespacesRecursive: function() {
        var result = testNamespace.subNamespaces(true);
        this.assertEquals(result.length, 4);
        this.assert(result.include(testNamespace.three.threeOne));
    },

    testGetAllNamespaceClasses: function() {
		var result = testNamespace.classes(false);
        this.assertEquals(result.length, 1);
        this.assert(result.include(testNamespace.Dummy));
    },

    testGetAllNamespaceClassesRecursive: function() {
        var result = testNamespace.classes(true);
        this.assertEquals(result.length, 3);
        this.assert(result.include(testNamespace.Dummy));
        this.assert(result.include(testNamespace.one.Dummy));
        this.assert(result.include(testNamespace.three.threeOne.Dummy));
    },

    testGetAllNamespaceFunctions: function() {
        var result = testNamespace.functions(false);
        this.assertEquals(result.length, 1);
        this.assert(result.include(testNamespace.dummyFunc));
    },

    testGetAllNamespaceFunctionsrecursive: function() {
        var result = testNamespace.functions(true);
        this.assertEquals(result.length, 2);
        this.assert(result.include(testNamespace.dummyFunc));
        this.assert(result.include(testNamespace.three.threeOne.dummyFunc));
    },
})

TestCase.subclass('lively.tests.ClassTests.MethodCategoryTest',
'running', {

	tearDown: function() {
		if (tests.ClassTest.Dummy)
			delete tests.ClassTest.Dummy;
	},
},
'testing', {
	testAddMethodsWorksWithCategoryString: function() {
		Object.subclass('tests.ClassTest.Dummy');
		tests.ClassTest.Dummy.addMethods('category1', { foo: function() { return 23 } });
		tests.ClassTest.Dummy.addMethods('category1', { baz: 23 });
		tests.ClassTest.Dummy.addMethods('category2', { bar: function() { return 42 } });

		var method1 = tests.ClassTest.Dummy.prototype.foo
		var method2 = tests.ClassTest.Dummy.prototype.bar
		var property1 = tests.ClassTest.Dummy.prototype.baz

		this.assert(method1, 'foo not there')
		this.assert(method2, 'bar not there')
		this.assert(property1, 'baz not there')

		this.assertEquals('category1', tests.ClassTest.Dummy.categoryNameFor('foo'));
		this.assertEquals('category1', tests.ClassTest.Dummy.categoryNameFor('baz'));
		this.assertEquals('category2', tests.ClassTest.Dummy.categoryNameFor('bar'));
	},
testAddMethodsWithMultipleCategories: function() {
		Object.subclass('tests.ClassTest.Dummy');
		tests.ClassTest.Dummy.addMethods(
			'catA', { m1: function() { return 23 } },
			'catB', { m2: function() { return 42 } });

		var m1 = tests.ClassTest.Dummy.prototype.m1
		var m2 = tests.ClassTest.Dummy.prototype.m2

		this.assert(m1, 'm1 not there')
		this.assert(m2, 'm2 not there')

		this.assertEquals('catA', tests.ClassTest.Dummy.categoryNameFor('m1'));
		this.assertEquals('catB', tests.ClassTest.Dummy.categoryNameFor('m2'));
	},


	testSubclassWorksWithCategory: function() {
		Object.subclass('tests.ClassTest.Dummy',
			'category1', { foo: function() { return 23 } }, { baz: 23 },
			'category2', { bar: function() { return 42 } }
		);

		this.assert(tests.ClassTest.Dummy, 'class not defined')

		var method1 = tests.ClassTest.Dummy.prototype.foo
		var method2 = tests.ClassTest.Dummy.prototype.bar
		var property1 = tests.ClassTest.Dummy.prototype.baz

		this.assert(method1, 'foo not there')
		this.assert(method2, 'bar not there')
		this.assert(property1, 'baz not there')

		this.assertEquals('category1', tests.ClassTest.Dummy.categoryNameFor('foo'));
		this.assertEquals('category1', tests.ClassTest.Dummy.categoryNameFor('baz'));
		this.assertEquals('category2', tests.ClassTest.Dummy.categoryNameFor('bar'));
	},

});
TestCase.subclass('lively.tests.ClassTests.ModuleRelatedClassTests',
'running', {
	setUp: function($super) {
		$super();
		this.createdClasses = [];
		this.createdModules = [];
	},
	tearDown: function($super) {
		$super();
		this.createdClasses.invoke('remove');
		this.createdModules.invoke('remove');
	},
},
'helper', {
	createModule: function(/*name, callback, ...*/) {
		var test = this,
			args = $A(arguments),
			name = args.shift(),
			m = module(name);
		m._isLoaded = true;
		this.createdModules.push(m);
		m.requires().toRun(function() {
			args.forEach(function(callback) { callback.call(test) });
		});
	},
	createDummyClass: function(no) {
		var klass = Object.subclass('tests.ClassTest.DummyClass' + no);
		this.createdClasses.push(klass);
		return klass
	},
	getDummyClass: function(no) {
		return tests.ClassTest['DummyClass' + no];
	},
},
'testing', {

	testClassKnowsItsModule: function() {
		var moduleName = 'tests.ClassTest.DummyModule1';
		this.createModule(moduleName, this.createDummyClass.curry(1));
		var klass = this.getDummyClass(1);
		this.assertEquals(module(moduleName).namespaceIdentifier, klass.sourceModule.namespaceIdentifier);
	},

	testReEvaluationDoesNotChangeSourceModule: function() {
		var moduleName = 'tests.ClassTest.DummyModule1';
		this.createModule(moduleName, this.createDummyClass.curry(1));
		var klass = this.createDummyClass(1);
		this.assertEquals(module(moduleName).namespaceIdentifier, klass.sourceModule.namespaceIdentifier);
	},

	testNestedModuleDefs: function() {
		var moduleName1 = 'tests.ClassTest.DummyModule1',
			moduleName2 = 'tests.ClassTest.DummyModule2';
		this.createModule(moduleName1,
			this.createModule.curry(moduleName2, this.createDummyClass.curry(2)),
			this.createDummyClass.curry(1));
		var klass1 = this.getDummyClass(1),
			klass2 = this.getDummyClass(2);
		this.assert(klass1, 'klass1 not set');
		this.assert(klass2, 'klass2 not set');
		var sourceModule1 = klass1.sourceModule,
			sourceModule2 = klass2.sourceModule;
		this.assert(sourceModule1, 'sourceModule1 not set');
		this.assert(sourceModule2, 'sourceModule2 not set');
		this.assertEquals(module(moduleName1).namespaceIdentifier, sourceModule1.namespaceIdentifier, '1');
		this.assertEquals(module(moduleName2).namespaceIdentifier, sourceModule2.namespaceIdentifier, '2');
	},

	testGlobalCanBeRequired: function() {
		require('Global').toRun(function() { this.works = true }.bind(this))
		this.assert(this.works);
	}

});

}) // end of module
