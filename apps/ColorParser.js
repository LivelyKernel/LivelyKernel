module('apps.ColorParser').requires('lively.Network').toRun(function() {

(function loadLib() {
    // FIXME... load async!
    var url = URL.codeBase.withFilename('lib/Color.js'),
        src = url.asWebResource().beSync().get().content;
    // the color parser lib installs itself in global and conflicts with our
    // color object. In order to fix this we rewrite the lib code so that it
    // uses the apps.ColorParser namespace
    var rewritten = ";(function loadColorParser(window) {"
                  + src.replace(/\n\}\)\(\);/, '\n})')
                  + ".call(apps.ColorParser);"
                  + "})(apps.ColorParser);"
    try {
        eval(rewritten);
    } catch(e) {
        alert('Color Parser lib failed to load because of:\n' + e);
    }
})();

Object.extend(apps.ColorParser, {
    getColorFromString: function(s) {
        var color = new apps.ColorParser.Color(s);
        return new Color(color.red()/255, color.green()/255, color.blue()/255, color.alpha());
    }
});


}) // end of module
