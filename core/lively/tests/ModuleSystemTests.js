module('lively.tests.ModuleSystemTests').requires('lively.TestFramework').toRun(function() {

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
    newMethod: function() {
        // enter comment here
    }



});

TestCase.subclass('lively.tests.ModuleSystemTests.LoaderTest', {

	shouldRun: false,

	files: ['test1.js', 'test2.js', 'test3.js'],

	tearDown: function() {
	    this.files.each(function(ea) { LoaderTest[ea] = false });
	},

	testLoadScriptsWithAction: function() {
	    var test = this;
	    var whenDone = function() {
            console.log('----------------------------- WhenDone run ------------------------------------');

            // argghh testing is hard because of tearDown!
            // if (!Loader['test1.js']) throw new Error('whenDoneAction run before loading test1.js');
            // test.assert(Loader['test1.js'], 'whenDoneAction run before loading test1.js');
            // test.assert(Loader['test2.js'], 'whenDoneAction run before loading test2.js');
            // test.assert(Loader['test3.js'], 'whenDoneAction run before loading test3.js');
	    };

	    Loader.loadScripts(this.files, whenDone)
	}

});

});