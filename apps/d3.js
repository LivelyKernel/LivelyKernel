module('apps.d3').requires().toRun(function() {

(function loadD3() {
    //FIXME load async!
	jQuery.ajax({url: URL.codeBase.withFilename('lib/d3.v2.js'), async: false});
})();

}) // end of module
