module('lively.net.Wiki').requires().toRun(function() {

(function openWikiToolFlap() {
    lively.whenLoaded(function(world) {
        if (!Config.showWikiToolFlap) return;
        require('lively.net.tools.Wiki').toRun(function() {
            lively.BuildSpec('lively.wiki.ToolFlap').createMorph().openInWorld();
        });
    });
})();

}) // end of module