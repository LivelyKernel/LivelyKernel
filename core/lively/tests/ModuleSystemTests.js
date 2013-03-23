module('lively.tests.ModuleSystemTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.tests.ModuleSystemTests.ObjectLookupTest',
'running', {
    setUp: function() {
        delete lively.tests.ModuleSystemTests.foo;
        delete lively.tests.ModuleSystemTests.bar;
    }
},
'testing', {
    testLookupAndAssignObjectPath: function() {
        var context = lively.tests.ModuleSystemTests;
        this.assert(!context.foo, 'setup failed');
        this.assert(!context.bar, 'setup failed');
        this.assert(!lively.lookup("lively.tests.ModuleSystemTests.foo"), 'setup failed');

        var foo1 = context.foo = 'a';
        this.assertIdentity(foo1, lively.lookup("lively.tests.ModuleSystemTests.foo"), 'lookup 1');
        this.assertIdentity(foo1, lively.lookup("foo", context), 'lookup 2');

        var foo2 = 'b', assignResult = lively.assignObjectToPath(foo2, "foo", context);
        this.assertIdentity(foo2, assignResult, 'assignObjectToPath 1');
        this.assertIdentity(foo2, lively.lookup("foo", context), 'assignObjectToPath 2');
        lively.assignObjectToPath(foo1, "lively.tests.ModuleSystemTests.foo");
        this.assertIdentity(foo1, lively.lookup("foo", context), 'assignObjectToPath 3');
    }
});

TestCase.subclass('lively.tests.ModuleSystemTests.ModuleTest', {
    testGetModulesInDir: function() {
        var moduleNames, cb = URL.codeBase,
            url = cb.withFilename('foo/');
        this.mockClass(WebResource, 'getSubElements', function() {
            this.subDocuments = [cb.withFilename('foo/Foo.js').asWebResource(),
                                 cb.withFilename('foo/Bar.js').asWebResource()];
        });

        lively.Module.findAllInThenDo(url, function(modules) {
            moduleNames = modules.invoke('name');
        });
        this.assertMatches(['foo.Foo', 'foo.Bar'], moduleNames);
    },

    testGetModulesInDirWorksOnlyForDirectory: function() {
        var url = URL.codeBase.withFilename('foo');
        this.assertRaises(function() {
            lively.Module.findAllInThenDo(url, function() {});
        }, /foo is not a directory/, 'no error on non-dir URL');
    },
    testUriWithRealtivePath: function() {
        // FIXME this is for handling core in the namespace root
        var m = module('../users/robertkrahn/foo.js'),
            uri = m.uri(),
            expected = URL.root.withFilename('users/robertkrahn/foo.js').toString();
        this.assertEquals(expected, m.uri());
    },
    testRelativePathModule: function() {
        this.assertEquals(module('../users/robertkrahn/foo.js').uri(),
                          module('users/robertkrahn/foo.js').uri());
        this.assertEquals(module('users/robertkrahn/foo.js').uri(),
                          module('users.robertkrahn.foo').uri());
    },
    testToRun: function() {
        var moduleCodeExecuted = false;
        module('foo.goo').requires().toRun(function() {
            moduleCodeExecuted = true;
        });
        this.assert(moduleCodeExecuted, 'module not executed');
    },
    testRequireLib: function() {
        var moduleCodeExecuted = false,
            lib = {uri: URL.root.withFilename('foo.js'), loadTest: function() { return false; }};
        module('foo.bar').requires().requiresLib(lib).toRun(function() {
            moduleCodeExecuted = true;
        });
        this.assert(!moduleCodeExecuted, 'module prematurely executed');
    }
});

AsyncTestCase.subclass('lively.tests.ModuleSystemTests.ModuleLoad',
'running', {
    setUp: function($super) {
        this.originalJSLoader = Global.JSLoader;
        Global.JSLoader = {
            loadJs: Functions.Null,
            scriptInDOM: Functions.True
        }
        $super();
    },
    tearDown: function($super) {
        Global.JSLoader = this.originalJSLoader;
        $super();
    }
},
'testing', {

    testRequireLib: function() {
        var moduleCodeExecuted = false,
            libBazIsLoaded = false,
            loadTestCalled = 0;
        module('foo.baz')
            .requires()
            .requiresLib({
                url: Config.codeBase + 'lib/baz.js',
                loadTest: function() { loadTestCalled++; return libBazIsLoaded; }
            }).toRun(function() {
                moduleCodeExecuted = true;
            });
        this.assert(module('foo.baz').hasPendingRequirements(), 'hasPendingRequirements 1');
        this.delay(function() {
            this.assert(loadTestCalled > 1, 'load test call count');
            this.assert(!moduleCodeExecuted, 'module prematurely executed');
            this.assert(module('foo.baz').hasPendingRequirements(), 'hasPendingRequirements 2');
            libBazIsLoaded = true;
        }, 60);
        this.delay(function() {
            this.assert(moduleCodeExecuted, 'module not executed');
            this.assert(!module('foo.baz').hasPendingRequirements(), 'hasPendingRequirements 3');
            this.done();
        }, 120);
    }

});

});
