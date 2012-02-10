module('Tests.ModuleSystemTests').requires('lively.TestFramework').toRun(function() {

    
TestCase.subclass('LoaderTest', {
	
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

console.log('ModuleSystemTests.js loaded');

});