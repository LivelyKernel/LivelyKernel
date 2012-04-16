module('lively.tests.CanvasImageTest').requires('lively.TestFramework', 'lively.Helper', 'lively.LocalStorage').toRun(function() {

TestCase.subclass('lively.tests.CanvasImageTestSuite', {

	toXML: function(string) {
		return new DOMParser().parseFromString(string, "text/xml").documentElement;
	},

	
});



}); // end of module