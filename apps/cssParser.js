module('apps.cssParser').requires('lively.Network').toRun(function(m) {

(function loadLib() {
    // FIXME load async!
    jQuery.ajax({url: URL.codeBase.withFilename('lib/cssParser.js'), async: false});
})();

Object.extend(apps.cssParser, {

    calculateCSSRuleSpecificity: function(selector) {
        /*
         * Code taken from Firebug Lite 1.4.0
         * Copyright (c) 2007, Parakey Inc.
        */
        var reSelectorTag = /(^|\s)(?:\w+)/g,
            reSelectorClass = /\.[\w\d_-]+/g,
            reSelectorId = /#[\w\d_-]+/g;

        var match = selector.match(reSelectorTag);
        var tagCount = match ? match.length : 0;

        match = selector.match(reSelectorClass);
        var classCount = match ? match.length : 0;

        match = selector.match(reSelectorId);
        var idCount = match ? match.length : 0;

        // FIXME: like that, tag count and class count can't
        // exceed 9 in one selector without distort the result
        return tagCount + 10*classCount + 100*idCount;
    },

    parse: function(cssString) {
        // cssString should specifiy the css rules, e.g.
        // ".some-class { color: red; }"
        // returns the rules as javascript objects with the interface:
        // TODO define the interface
        var parser = new CSSParser(),
            parsedStyleSheet = parser.parse(cssString, false, true);

        if (!parsedStyleSheet) return [];

        console.log(parsedStyleSheet.cssRules);
        return parsedStyleSheet.cssRules/*.collect(function(rule) {
            return {
                selectorText: rule.selectorText(),
                declarations: rule.declarations.collect(function(decl){
                    return {
                        valueText: decl.valueText.trim(),
                        property: decl.property
                    }
                })

            };
        })*/;
    }
});

}); // end of module