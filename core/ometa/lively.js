var allOMetaDependenciesLoaded = false;
var dependencies = [
    {url: Config.codeBase + 'ometa/lib.js', loadTest: function() { return typeof objectThatDelegatesTo !== 'undefined'; }},
    {url: Config.codeBase + 'ometa/ometa-base.js', loadTest: function() { return typeof OMeta !== 'undefined'; }},
    {url: Config.codeBase + 'ometa/parser.js', loadTest: function() { return typeof Parser !== 'undefined'; }},
    {url: Config.codeBase + 'ometa/ChunkParser.js', loadTest: function() { return typeof ChunkParser !== 'undefined'; }},
    {url: Config.codeBase + 'ometa/bs-ometa-compiler.js', loadTest: function() { return typeof BSOMetaParser !== 'undefined'; }},
    {url: Config.codeBase + 'ometa/bs-js-compiler.js', loadTest: function() { return typeof BSJSParser !== 'undefined'; }},
    {url: Config.codeBase + 'ometa/bs-ometa-js-compiler.js', loadTest: function() { return typeof BSOMetaJSParser !== 'undefined'; }},
    {url: Config.codeBase + 'ometa/bs-ometa-optimizer.js', loadTest: function() { return typeof BSOMetaOptimizer !== 'undefined'; }},
    {url: Config.codeBase + 'ometa/lk-parser-extensions.js', loadTest: function() { return typeof LKJSParser !== 'undefined'; }}
];

dependencies.doAndContinue(function(next, lib) {
    lively.$.getScript(lib.url);
    var interval = Global.setInterval(function() {
        if (!lib.loadTest()) return;
        console.log('..... %s loaded........', lib.url);
        Global.clearInterval(interval);
        next();
    }, 50);
}, function() { allOMetaDependenciesLoaded = true; });

module('ometa.lively').requires()
.requiresLib({loadTest: function() { return !!allOMetaDependenciesLoaded; }})
// .requiresLib({url: Config.codeBase + 'ometa/lib.js', loadTest: function() { return typeof objectThatDelegatesTo !== 'undefined'; }})
// .requiresLib({url: Config.codeBase + 'ometa/lib.js', loadTest: function() { return typeof objectThatDelegatesTo !== 'undefined'; }})
// .requiresLib({url: Config.codeBase + 'ometa/ometa-base.js', loadTest: function() { return typeof objectThatDelegatesTo !== 'undefined'; }})
// .requiresLib({url: Config.codeBase + 'ometa/bs-ometa-optimizer.js', loadTest: function() { return typeof objectThatDelegatesTo !== 'undefined'; }})
// .requiresLib({url: Config.codeBase + 'ometa/bs-js-compiler.js', loadTest: function() { return typeof objectThatDelegatesTo !== 'undefined'; }})
// .requiresLib({url: Config.codeBase + 'ometa/bs-ometa-compiler.js', loadTest: function() { return typeof objectThatDelegatesTo !== 'undefined'; }})
.toRun(function() {

// .requiresLib({url: Config.codeBase + (false && lively.useMinifiedLibs ? 'lib/ace/lively-ace.min.js' : 'lib/ace/lively-ace.js'), loadTest: function() { return typeof ace !== 'undefined';}})
// ('ometa.parser','ometa.bs-ometa-optimizer','ometa.bs-js-compiler','ometa.bs-ometa-compiler')

});
