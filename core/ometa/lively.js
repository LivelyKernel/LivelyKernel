// FIXME rk 2013-04-26
// we need the right order of libs to be loaded, this should eventually be
// supported by lively.Module>>requireLib
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
    JSLoader.loadJs(lib.url);
    var interval = Global.setInterval(function() {
        if (!lib.loadTest()) return;
        Global.clearInterval(interval);
        next();
    }, 50);
}, function() { allOMetaDependenciesLoaded = true; });

module('ometa.lively').requires()
.requiresLib({loadTest: function() { return !!allOMetaDependenciesLoaded; }})
.toRun(function() {

});
