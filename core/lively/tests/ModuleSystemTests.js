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
    },

    testLookupPathWithBrackets: function() {
        var context = {foo: ['a', 'b', {c: 55}], 'zork-foo': {x: 3}};
        this.assertIdentity(context.foo[2].c, lively.lookup('foo[2].c', context), '1');
        this.assertIdentity(context.foo[2].c, lively.lookup('foo["2"].c', context), '2');
        this.assertIdentity(context.foo[2].c, lively.lookup('foo[\'2\'].c', context), '3');
        this.assertIdentity(context.foo[2], lively.lookup('foo[2]', context), '4');
        this.assertIdentity(context['zork-foo'].x, lively.lookup('["zork-foo"].x', context), '5');
        this.assertIdentity(context['zork-foo'].x, lively.lookup('["zork-foo"]["x"]', context), '6');
    },

    testParseObjectPath: function() {
        var test = this,
            paths = [{expected: ['foo', '0'], string: 'foo[0]'},
                     {expected: ['foo', '2', 'c'], string: 'foo[2].c'},
                     {expected: ['foo', '2', 'c'], string: 'foo[2]["c"]'},
                     {expected: ['foo', '2', 'c'], string: 'foo[2][c]'},
                     {expected: ['foo'], string: 'foo'},
                     {expected: ['bar', 'zork-foo'], string: 'bar["zork-foo"]'},
                     {expected: ['bar', 'zork-foo'], string: 'bar[zork-foo]'},
                     {expected: ['x-y'], string: '[x-y]'},
                     {expected: ['foo', 'bar'], string: 'foo.bar'},
                     {expected: ['f.o.o\\"]', 'x'], string: '["f.o.o\\"]"].x'}];

        function assertSplits(expected, string, result) {
            test.assertEquals(expected, result,
                Strings.format('didn\'t split %s into\n%s but\n%s',
                    string, Strings.print(expected), Strings.print(result)));
        }

        paths.forEach(function(test) {
            assertSplits(test.expected, test.string, lively.parsePath(test.string));
        });
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
        module('foo.goo').remove();
        module('foo.goo').requires().toRun(function() {
            moduleCodeExecuted = true;
        });
        this.assert(moduleCodeExecuted, 'module not executed');
    },

    testRequireLib: function() {
        module('foo.bar').remove();
        var moduleCodeExecuted = false,
            lib = {uri: URL.root.withFilename('foo.js'), loadTest: function() { return false; }};
        module('foo.bar').requires().requiresLib(lib).toRun(function() {
            moduleCodeExecuted = true;
        });
        this.assert(!moduleCodeExecuted, 'module prematurely executed');
    },

    testModuleNamesSupportUnicodeChars: function() {
        this.assertEquals("Global.users.foo.config", module('users.foo.config').namespaceIdentifier);
        this.assertEquals("Global.users.föö.config", module('users.föö.config').namespaceIdentifier);
    },

    testModuleNameWithDot: function() {
        var m = module("foo\\.bar.baz");
        this.assert(m !== lively.module("foo.bar.baz"), "interpreted as foo.bar.baz");
        this.assertEquals(m.uri(), URL.codeBase.withFilename("foo.bar/baz.js").toString(),"modulename -> uri conversion");
        
        // the other way around
        this.assertEquals("Global.foo\\.bar.baz", lively.module("foo.bar/baz.js").namespaceIdentifier);
    }
});

AsyncTestCase.subclass('lively.tests.ModuleSystemTests.ModuleLoad',
'running', {
    setUp: function($super) {
        this.originalJSLoader = Global.JSLoader;
        Global.JSLoader = {
            loadJs: Functions.Null,
            isLoading: Functions.True,
            removeAllScriptsThatLinkTo: Functions.Null
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
        module('foo.baz').remove();
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
        }, 620);
    },

    testRequireLibSync: function() {
        var moduleCodeExecuted = false, libBazIsLoaded = false, libLoadCalled = 0, loadTestCalled = 0;
        module('foo.baz')
            .requires()
            .requiresLib({
                url: Config.codeBase + 'lib/baz.js',
                loadTest: function() { loadTestCalled++; return true;/*for sync loading the return value doesn't matter*/ },
                sync: true
            }).toRun(function() {
                moduleCodeExecuted = true;
            });
        module('foo.baz').load(true); // sync load
        // this.assertEquals(1, libLoadCalled, 'libLoad call count ' + libLoadCalled);
        this.assertEquals(0, loadTestCalled, 'loadTest call count ' + loadTestCalled);
        this.assert(moduleCodeExecuted, 'module body not loaded');
        this.assert(module('foo.baz').isLoaded(), 'module not loaded')
        this.done();
    },

    testRunAfterLoad: function() {
        var loadLogger = [];
        lively.module('foo.baz').remove();
        lively.module('foo.baz').runWhenLoaded(function() {debugger; loadLogger.push('whenLoaded callback'); });
        this.delay(function() {
            this.assertEquals([], loadLogger, 'no load before');
            this.assert(!module('foo.baz').isLoaded(), 'module already loaded?!');
            lively.module('foo.baz').requires().toRun(function() { loadLogger.push('module body'); });
        }, 20);
        this.delay(function() {
            this.assertEquals(['module body', 'whenLoaded callback'], loadLogger, 'after load callback not run');
            this.done();
        }, 60);
    }

});

});
