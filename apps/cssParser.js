module('apps.cssParser').requires('lively.Network', 'lively.morphic.StyleSheetRepresentation').toRun(function(m) {

(function loadLib() {
    // FIXME load async!
    var url = URL.codeBase.withFilename('lib/cssParser.js'),
        src = url.asWebResource().beSync().get().content,

	// lib has to be adapted to suit our needs:
	// - declarations shall not be multiplied with vendor prefixes
	// - shorthands shall never be expanded
        vendorRepl = "kCSS_VENDOR_PREFIXES = {properties:[]};",
	expRepl = 'aExpandShorthands = false;',
	rewritten = '(function (){'
            + src.replace(/kCSS_VENDOR_PREFIXES([\s\S]*?)};/, vendorRepl)
            .replace(/(?=this.preserveState\(\);[\x20\t\r\n\f]*var blocks = \[\];)/, expRepl)
            + 'this.CSSParser = CSSParser;'
            + '}).call(apps.cssParser);';
    try {
        eval(rewritten);
    } catch(e) {
        alert('CSS Parser lib failed to load because of:\n' + e);
    }
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

    convertParsedStyleSheet: function(styleSheet, originMorph) {
        // Convert JSCSSP obj to our own style sheet object
        return new lively.morphic.StyleSheet(
                styleSheet.cssRules.collect(function(rule) {
                    if (rule.type === 0) {
                        // Rule could not be parsed
                        console.warn('CSS Error '+rule.error+': '+rule.parsedCssText);
                        return new lively.morphic.StyleSheetComment(
                                '/* CSS Error ' + rule.error + ':\n'
                                    + rule.parsedCssText + '*/'
                            );
	           } else {
                        return new lively.morphic.StyleSheetRule(
                                rule.selectorText(),
                                rule.declarations.collect(function(decl) {
                                        return new lively.morphic.StyleSheetDeclaration(
                                                decl.property,
                                                decl.values.collect(function(val) {
                                                        return val.value;
                                                    }),
                                                null,
                                                decl.priority
                                            )
                                    })
                            );
	           }
                }),
                originMorph
            );
    },

    parse: function(cssString, originMorph) {
        // cssString should specifiy the css rules, e.g.
        // ".some-class { color: red; }"
        // returns the rules as javascript objects with the interface:
        // TODO define the interface

        var parser = new apps.cssParser.CSSParser(),
            parsedStyleSheet = parser.parse(cssString, false, true);

        return this.convertParsedStyleSheet(parsedStyleSheet, originMorph);

        /*
        debugger
        console.log(this.convertParsedStyleSheet(parsedStyleSheet));

        if (parsedStyleSheet) {

            parsedStyleSheet.cssRules.each(function(rule) {
	           if (rule.type === 0) {
	               console.warn('CSS Error '+rule.error+': '+rule.parsedCssText);
	           } else if (rule.declarations) {
	               rule.declarations.each(function(decl){
	                   decl.rule = rule;
	               });
	           }
                });
            return parsedStyleSheet;

            console.log(parsedStyleSheet.cssRules);
            return parsedStyleSheet.cssRules.select(function(rule) {
					return rule.type === 1;
            })
        }
        else return [];
        */

    },

});

}); // end of module
