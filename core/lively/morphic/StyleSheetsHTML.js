module('lively.morphic.StyleSheetsHTML').requires('lively.morphic.HTML', 'lively.morphic.StyleSheets').toRun(function() {

    Object.extend(lively.morphic.Morph.prototype.htmlDispatchTable, {
        setStyleSheet: 'setStyleSheetHTML',
        setStyleClassNames: 'setStyleClassNamesHTML',
        setStyleId: 'setStyleIdHTML',
    });

    lively.morphic.Morph.addMethods(
    'Stylesheets', {

        compileStyleSheet: function(rules) {
            // Takes a list of CSS rules and assembles a style
            // sheet which can be injected into the DOM.
            // If this morph is not the world, the selectors
            // are extended so the rules may not be applied
            // to morphs outside the addressed hierarchy.
            // Helper function for setStyleSheetHTML.

            var output = '';

            rules.each(function(rule) {
                    var selectors = this.splitGroupedSelector(rule.selectorText()),
                        newSelector = '';
                    for (var i = 0; i < selectors.length; i++) {
                        newSelector += this.addSelectorPrefixes(selectors[i]);
                        if (i < selectors.length - 1) {
                            newSelector += ', ';
                        }
                    }
                    output += newSelector + ' {';
                    output += '\n';
                    rule.declarations.each(function(d) {
                            output += '\t'+d.parsedCssText;
                            output += '\n';
                        });
                    output += '}\n';
                }, this);

            return output;
        },
        addSelectorPrefixes: function(selector) {
            // Doubles a selector to include its child and
            // itself and adds an attribute selector prefix.
            // Helper function for compileStyleSheet.
            
            // TODO: if first token in selector is tag or *
            // let the prefix be inserted after the tagname

            var extendedSelector = '',
                morphPrefix = '*[morphid="'+this.id+'"]',
                tokensRx = /(?:\\.|\[[\x20\t\r\n\f]*((?:\\.|[-\w]|[^\x00-\xa0])+)[\x20\t\r\n\f]*(?:([*^$|!~]?=)[\x20\t\r\n\f]*(?:(['"])((?:\\.|[^\\])*?)\3|((?:\\.|[-\w#]|[^\x00-\xa0])+)|)|)[\x20\t\r\n\f]*\]|:((?:\\.|[-\w]|[^\x00-\xa0])+)(?:\((?:(['"])((?:\\.|[^\\])*?)\7|((?:[^,]|\\,|(?:,(?=[^\[]*\]))|(?:,(?=[^\(]*\))))*))\)|)|[^\\\x20\t\r\n\f>+~])+|[\x20\t\r\n\f]*([\x20\t\r\n\f>+~])[\x20\t\r\n\f]*/g,
                tagRx = /^((?:\\.|[-\*\w]|[^\x00-\xa0])+)/,
                tokens = selector.match(tokensRx);
            
            debugger
            
            // Include the childs of the morph ...
            extendedSelector += morphPrefix;
            extendedSelector += ' ';
            extendedSelector += selector;
            extendedSelector += ', ';

            // Include the morph itself ...            
            // If first token is a tagname then put prefix after tagname
            if (tagRx.exec(tokens.first())) {
                extendedSelector += tokens.first();
                extendedSelector += morphPrefix;
                for (var i = 1; i < tokens.length; i++) {
                    extendedSelector += tokens[i];
                }
            } else {
                extendedSelector += morphPrefix;
                extendedSelector += selector;
            }

            return extendedSelector;
        },

        splitGroupedSelector: function(selector) {
            // Splits a grouped selector and returns
            // its single selectors as an array.
            // Helper function for compileStyleSheet.

            var selectorList = selector.
                    split(/[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/);
            return selectorList.collect(function(s) {
                    return s.trim();
                });
        },

        setStyleSheetHTML: function(ctx, styleSheet) {
            // Compiles the input style rules to an 
            // HTML specific style sheet and adds this
            // to the DOM.
            // Called when a new style sheet was applied to
            // the morph (i.e. through setStyleSheet) and
            // in the initHTML method of the morph.

            var styleTagId = "style-for-"+this.id,
			rules = this.processStyleSheet(styleSheet),
            compiledCss = this.compileStyleSheet(rules);

    	    if (ctx.styleNode) {
        	   $(ctx.styleNode).remove();
                }
                if (rules.length && rules.length > 0 &&
                    compiledCss && compiledCss.length &&
                    compiledCss.length > 0) {
    	           ctx.styleNode = $('<style type="text/css" id="' +
    	               styleTagId + '"></style>');
    	           ctx.styleNode.text(compiledCss);
    	           ctx.styleNode.appendTo(document.head);
    	        }
            }
    },
    'Style Classes and Ids', {
        setStyleClassNamesHTML: function(ctx) {
            var classNames = this.getStyleClassNames();
            if (classNames && classNames.length && classNames.length > 0) {
                classNames = classNames.join(' ');
                $(ctx.morphNode).attr('class', classNames);
                $(ctx.shapeNode).attr('class', classNames);
            } else {
                $(ctx.morphNode).removeAttr('class');
                $(ctx.shapeNode).removeAttr('class');
            }
        },
        setStyleIdHTML: function(ctx, id) {
            if (id && id.length && id.length > 0) {
                $(ctx.morphNode).attr('id', id);
                $(ctx.shapeNode).attr('id', id);
            } else {
                $(ctx.morphNode).removeAttr('id');
                $(ctx.shapeNode).removeAttr('id');
            }
        },
    }
    );
}
);