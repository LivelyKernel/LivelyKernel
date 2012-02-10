module('Tests.ClassTest').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('Tests.ClassTest.ClassTest', {
	
	testIsSuperclass: function() {
		TestCase.subclass('Dummy1', {});
		this.assert(Dummy1.isSubclassOf(TestCase));
		this.assert(Global["Dummy1"]);
	},
		
	testIsSuperclassDeep: function() {
		TestCase.subclass('Dummy1', {});
		Dummy1.subclass('Dummy2', {});
		this.assert(Dummy2.isSubclassOf(Dummy1));
		this.assert(Dummy2.isSubclassOf(TestCase));
	},
	
	testAllSubclasses: function() {
		TestCase.subclass('DummyClass', {}); 
		DummyClass.subclass('SubDummyClass1', {});
		this.assert(SubDummyClass1.isSubclassOf(DummyClass));
		DummyClass.subclass('SubDummyClass2', {}); 
		SubDummyClass1.subclass('SubSubDummyClass', {});
		this.assert(Class.isClass(DummyClass));	 
		this.assertEquals(DummyClass.allSubclasses().length, 3); 
		//this.assertEquals(SubDummyClass1.allSubclasses[0], SubSubDummyClass); 
	},
	
	testAllSubclassesWithNamespace: function() {
		TestCase.subclass('OtherDummyClass', {});
		namespace('lively.Dummy');
		OtherDummyClass.subclass('lively.Dummy.SubDummyClass', {});
		this.assert(lively.Dummy.SubDummyClass.isSubclassOf(OtherDummyClass), 'isSubclassOf');
		this.assertEquals(OtherDummyClass.allSubclasses().length, 1); 
	},
	
	testGetSuperClasses: function() {
	    TestCase.subclass('A', {});
		A.subclass('B', {});
		var result = A.superclasses();
		this.assertEqualState(result, [Object, TestCase, A]);
	},
	
	testSuperMethodsAreAssignedCorrectly: function() {
	    var className = 'DummyTestSuperMethods';
	    this.assert(!Global[className], 'Test already there');
		var f1 = function ($super) { 1; };
	
	    Object.subclass(className, {
            a: f1,
            b: function($super) { 2; }
        });
        var aSource = Global[className].prototype.a.toString();
        delete Global[className];
        this.assertEquals(aSource, f1.toString());
	},
	
	testSubclassingDoesNotReplaceExistingClass: function() {
		var className = 'DummyTestOverrideSubclass';
	    this.assert(!Global[className], 'Test already there');
		try {
	    
			Object.subclass(className, {
            	a: function () {return 1;},
			});
			var oldClass = Global[className];
			this.assert(oldClass, 'class is not there there');
			Object.subclass(className, {
				b: function() {return 2;},
			})
			var newClass = Global[className];
			this.assertIdentity(oldClass, newClass , 'class identity changed...');
		} finally {
			delete Global[className];
		}
	},
	
	testNewClassDefinitionOfExistingClass: function() {
		TestCase.subclass('Dummy23', { m: function() { return 1 }});
		var instance = new Dummy23();
		TestCase.subclass('Dummy23', { m: function() { return 2 }});
		this.assertEquals(instance.m(), 2);
	},
	
});

TestCase.subclass('Tests.ClassTest.NamespaceTest', {
    
    setUp: function() {
        // create namespaces
		namespace('testNamespace.one');
        namespace('testNamespace.two');
		namespace('testNamespace.three.threeOne');
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
        this.assert(testNamespace instanceof lively.lang.Namespace, 'strange namespace');
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

TestCase.subclass('Tests.ClassTest.MethodCategoryTest', 
'running', {

	tearDown: function() {
		if (Tests.ClassTest.Dummy)
			delete Tests.ClassTest.Dummy;
	},
},
'testing', {
	testAddMethodsWorksWithCategoryString: function() {
		Object.subclass('Tests.ClassTest.Dummy');
		Tests.ClassTest.Dummy.addMethods('category1', { foo: function() { return 23 } });
		Tests.ClassTest.Dummy.addMethods('category1', { baz: 23 });
		Tests.ClassTest.Dummy.addMethods('category2', { bar: function() { return 42 } });

		var method1 = Tests.ClassTest.Dummy.prototype.foo
		var method2 = Tests.ClassTest.Dummy.prototype.bar
		var property1 = Tests.ClassTest.Dummy.prototype.baz

		this.assert(method1, 'foo not there')
		this.assert(method2, 'bar not there')
		this.assert(property1, 'baz not there')

		this.assertEquals('category1', Tests.ClassTest.Dummy.categoryNameFor('foo'));
		this.assertEquals('category1', Tests.ClassTest.Dummy.categoryNameFor('baz'));
		this.assertEquals('category2', Tests.ClassTest.Dummy.categoryNameFor('bar'));
	},
testAddMethodsWithMultipleCategories: function() {
		Object.subclass('Tests.ClassTest.Dummy');
		Tests.ClassTest.Dummy.addMethods(
			'catA', { m1: function() { return 23 } },
			'catB', { m2: function() { return 42 } });

		var m1 = Tests.ClassTest.Dummy.prototype.m1
		var m2 = Tests.ClassTest.Dummy.prototype.m2

		this.assert(m1, 'm1 not there')
		this.assert(m2, 'm2 not there')

		this.assertEquals('catA', Tests.ClassTest.Dummy.categoryNameFor('m1'));
		this.assertEquals('catB', Tests.ClassTest.Dummy.categoryNameFor('m2'));
	},


	testSubclassWorksWithCategory: function() {
		Object.subclass('Tests.ClassTest.Dummy',
			'category1', { foo: function() { return 23 } }, { baz: 23 },
			'category2', { bar: function() { return 42 } }
		);

		this.assert(Tests.ClassTest.Dummy, 'class not defined')

		var method1 = Tests.ClassTest.Dummy.prototype.foo
		var method2 = Tests.ClassTest.Dummy.prototype.bar
		var property1 = Tests.ClassTest.Dummy.prototype.baz

		this.assert(method1, 'foo not there')
		this.assert(method2, 'bar not there')
		this.assert(property1, 'baz not there')

		this.assertEquals('category1', Tests.ClassTest.Dummy.categoryNameFor('foo'));
		this.assertEquals('category1', Tests.ClassTest.Dummy.categoryNameFor('baz'));
		this.assertEquals('category2', Tests.ClassTest.Dummy.categoryNameFor('bar'));
	},

});
TestCase.subclass('Tests.ClassTest.ModuleRelatedClassTests',
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
		var klass = Object.subclass('Tests.ClassTest.DummyClass' + no);
		this.createdClasses.push(klass);
		return klass
	},
	getDummyClass: function(no) {
		return Tests.ClassTest['DummyClass' + no];
	},
},
'testing', {
	testClassKnowsItsModule: function() {
		var moduleName = 'Tests.ClassTest.DummyModule1';
		this.createModule(moduleName, this.createDummyClass.curry(1));
		var klass = this.getDummyClass(1);
		this.assertEquals(module(moduleName).namespaceIdentifier, klass.sourceModule.namespaceIdentifier);
	},
	testReEvaluationDoesNotChangeSourceModule: function() {
		var moduleName = 'Tests.ClassTest.DummyModule1';
		this.createModule(moduleName, this.createDummyClass.curry(1));
		var klass = this.createDummyClass(1);
		this.assertEquals(module(moduleName).namespaceIdentifier, klass.sourceModule.namespaceIdentifier);
	},
	testNestedModuleDefs: function() {
		var moduleName1 = 'Tests.ClassTest.DummyModule1',
			moduleName2 = 'Tests.ClassTest.DummyModule2';
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
	},



});
}) // end of module