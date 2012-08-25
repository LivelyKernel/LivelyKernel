module('lively.morphic.StyleSheetsHTML').requires('lively.morphic.HTML').toRun(function() {

    Object.extend(lively.morphic.Morph.prototype.htmlDispatchTable, {
        
    });
    lively.morphic.Morph.addMethods(
    'RegExp', {
        /*
	whitespace : "[\\x20\\t\\r\\n\\f]",
	characterEncoding : "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",
	identifier : characterEncoding.replace( "w", "w#" ),

	operators : "([*^$|!~]?=)",
	attributes : "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",
	pseudos : ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|((?:[^,]|\\\\,|(?:,(?=[^\\[]*\\]))|(?:,(?=[^\\(]*\\))))*))\\)|)",
	pos : ":(nth|eq|gt|lt|first|last|even|odd)(?:\\((\\d*)\\)|)(?=[^-]|$)",
	combinators : whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*",
	groups = "(?=[^\\x20\\t\\r\\n\\f])(?:\\\\.|" + attributes + "|" + pseudos.replace( 2, 7 ) + "|[^\\\\(),])+",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcombinators = new RegExp( "^" + combinators ),

	// All simple (non-comma) selectors, excluding insignifant trailing whitespace
	rgroups = new RegExp( groups + "?(?=" + whitespace + "*,|$)", "g" ),

	// A selector, or everything after leading whitespace
	// Optionally followed in either case by a ")" for terminating sub-selectors
	rselector = new RegExp( "^(?:(?!,)(?:(?:^|,)" + whitespace + "*" + groups + ")*?|" + whitespace + "*(.*?))(\\)|$)" ),

	// All combinators and selector components (attribute test, tag, pseudo, etc.), the latter appearing together when consecutive
	rtokens = new RegExp( groups.slice( 19, -6 ) + "\\x20\\t\\r\\n\\f>+~])+|" + combinators, "g" ),

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,

	rsibling = /[\x20\t\r\n\f]*[+~]/,
	rendsWithNot = /:not\($/,

	rheader = /h\d/i,
	rinputs = /input|select|textarea|button/i,

	rbackslash = /\\(?!\\)/g,
    
        */
        
    },
    
        'stylesheets', {
            setStyleSheet: function(value) {
                this.shape.setStyleSheet(value);
            },
            getDomId: function() {
                // TODO: dont forget to trim the result!
                
            },
            generateAncestorPrefixString: function() {
                var ancestorPrefix = '';
                if (!this.isWorld) {
                    var m = this;
                    while ((m = m.owner)) {
                        ancestorPrefix = '*[morphid="'+this.id+'"]' +
                            ((ancestorPrefix.length > 0) ?
                            (' '+ancestorPrefix) : '');
                    }
                }
                return ancestorPrefix;
            },
            compileStyleSheet: function(rules) {
                // Takes a list of css rules and assembles a style
                // sheet which can be injected into the DOM.
                // If this morph is not the world, the selectors
                // are extended so the rules may not be applied
                // to morphs outside the addressed hierarchy.
                var output = '',
                    ancestorPrefixId = this.generateAncestorPrefixString(),
                    morphPrefixId = '*[morphid="'+this.id+'"]';

                rules.each(function(rule) {
                        var selectors = this.splitGroupedSelector(rule),
                            newSelector = '';
                        for (var i = 0; i < selectors.length; i++) {
                            newSelector += this.addSelectorPrefixes(selectors[i]);
                            if (i < selectors.length - 1) {
                                newSelector += ', ';
                            }
                        }
                        output += newSelector + '{';
                        output += '\n';
                        rule.declarations.each(function(d) {
                                
                            });
                        
                        
                    }, this);
            },
    addSelectorPrefixes: function(selector, ancestorPrefix, morphPrefix) {
        var extendedSelector = '';
        
        // Include the childs of the morph ...
        extendedSelector += morphPrefix;
        extendedSelector += ' ';
        extendedSelector += selector;

        // Include the morph itself ...
        extendedSelector += ', ';
        extendedSelector += morphPrefix;
        extendedSelector += selector;

        return extendedSelector;
    },

    splitGroupedSelector: function(selector) {
        var selectorList = selector.
            split(/[\x20\t\r\n\f]*,[\x20\t\r\n\f]*/);
        return selectorList.collect(function(s) {
                return s.trim();
            });
    },

            
        },
        'HTML DOM', {
            setStyleSheetHTML: function(ctx, styleSheet) {
                var morphId = ctx.shapeNode && ctx.shapeNode.id;
                if (!morphId) {
                    //console.log('Warning, morph has no shape node or shape node was not given any id.');
                    return;
                }

                var styleTagId = "style-for-"+morphId;

        	if (ctx.styleNode) {
        	   $(ctx.styleNode).remove();
                }
                if (styleSheet && styleSheet.length > 1) {

            	    //console.log("Setting CSS for shape "+morphId+" to "+value);
                    var specificCss = "#"+morphId+" { "+styleSheet+" }";

                    // syntax fixes for the sap gold reflection css
                    specificCss = specificCss.replace(/[\s]*=[\s]*/g,"=");
                    specificCss = specificCss.replace(/alpha[\s]*\([\s]*opacity[\s]*\:/g,"alpha(opacity=");
                    specificCss = specificCss.replace(".dev-datepicker/jQuery",".dev-datepicker.jQuery");


                    if (less) {
                        new less.Parser().parse(specificCss, function(e, tree) {
                            //console.log(e);
                            specificCss = tree.toCSS();
                        });
                        console.log(specificCss);
                    }


        	        ctx.styleNode = $('<style type="text/css" id="' + styleTagId + '"></style>');
        	        ctx.styleNode.text(specificCss);
        	        ctx.styleNode.appendTo(document.head);

                } else {
                    delete this._StyleSheet;
                }
                
            }
        }
    )
}) // end of module()