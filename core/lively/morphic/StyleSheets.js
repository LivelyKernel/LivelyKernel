module('lively.morphic.StyleSheets').requires('apps.cssParser').toRun(function() {

lively.morphic.Morph.addMethods(
'Style sheet getters and setters',{
    setStyleSheet: function(styleSheet) {
        var rules = this.processStyleSheet(styleSheet);
        return this.morphicSetter('StyleSheet', rules);
    }  
},

'Style sheet interpretation', {
    processStyleSheet: function(styleSheet) {
        // Extracts the CSS rules out of a style sheet and
        // copies matching rules into the morph's submorphs.
        // Returns the rules as an array.

        var sizzle = new lively.morphic.Sizzle(),
            styleSheetRules = apps.cssParser.parse(styleSheet);

        // get rid of the old rules in all submorphs
        this.withAllSubmorphsDo(function(morph){
                if (morph.styleSheetRules) {
                    morph.styleSheetRules =
                        morph.styleSheetRules.filter(function(rule){
                            return (rule.originMorph !== this);
                        },this);
                }
            }, this);

        if (styleSheetRules) {
            styleSheetRules.each(function(rule){
                if (rule.type === 1) {
                    rule.originMorph = this;
                    sizzle.select(rule.selectorText(), this).each(function(morph){
                        if (!morph.styleSheetRules) {
                            morph.styleSheetRules = [];
                        }
                        morph.styleSheetRules.push(rule);
                    }, this);
                }
            }, this);

            if (!this.styleSheetRules) {this.styleSheetRules = [];}

            return styleSheetRules;
        }
    },
    getStyleSheetDeclarations: function(){
        // Returns the morph's aggregated style declarations
        // from all applicable css rules.
        //
        // Comes as an object with property names as keys
        // and the respective declaration objects as values.
        //
        // i.e. {'background-color': <declaration>, 'border-width': <declaration>}

        var aggregatedStyle = {},
            rules,
            result = [];

        // sort the rules for specificity
        rules = this.sortStyleSheetRules();

        // iterate over the ordered rules
        for (var i = 0; i < this.styleSheetRules.length; i++) {
            var rule = this.styleSheetRules[i];
            rule.declarations.each(function(decl){
                if (aggregatedStyle[decl.property] &&
                    aggregatedStyle[decl.property].priority &&
                    !decl.priority) {
                    // if the declaration is more '!important' than
                    // the more specific one, do not override
                } else {
                    // otherwise override declarations from less specific rules
                    aggregatedStyle[decl.property] = decl;
                }
            });
        }
        for (var x in aggregatedStyle) {
            result.push(aggregatedStyle[x]);
        }
        return result;
    },
    sortStyleSheetRules: function() {
        // Returns an array of all rules matching to
        // the morph, sorted by their specificity (low to high).
        var thisMorph = this;

        return this.styleSheetRules.sort(function(a, b) {
                if (a.originMorph !== b.originMorph) {
                    // child's css is more specific than parent's
                    return b.originMorph.isAncestorOf(a.originMorph);
                } else {
                    return (thisMorph.getStyleSheetRuleSpecificity(a) >
                        thisMorph.getStyleSheetRuleSpecificity(b));
                }
            });
    },
    getStyleSheetRuleSpecificity: function(rule) {
        // check if it is a grouped selector
        if (rule.selectorText().indexOf(",") != -1) {
            var selectors = rule.selectorText().split(","),
                maxSpecificity = -1,
                sizzle = new lively.morphic.Sizzle(),
                sel, spec, mostSpecificSelector;

            // loop over all selectors in the group
            for (var j = 0, len = selectors.length; j < len; j++)
            {
                sel = selectors[j];

                // find if the selector matches the element
                if (sizzle.select(sel, this, null, [this]).length == 1)
                {
                    spec = apps.cssParser.calculateCSSRuleSpecificity(sel);

                    // find the most specific selector that macthes the element
                    if (spec > maxSpecificity)
                    {
                        maxSpecificity = spec;
                        mostSpecificSelector = sel;
                    }
                }
            }
            return maxSpecificity;
        } else {
            return apps.cssParser.calculateCSSRuleSpecificity(rule.selectorText());
        }
    }


},
'Morph selection', {
    getSubmorphById: function(id, optIdAttributeName) {
        if (this[optIdAttributeName || 'id'] == id){
            return this;
        } else {
            for (var i = 0; i < this.submorphs.length; i++) {
                var m = this.submorphs[i],
                    hit = m.getSubmorphById(id);
                if (hit) {
                    return hit;
                }
            }
            return null;
        }
    },
    getSubmorphsByClassName: function(classNames) {
        var resultMorphs = [];
        
        this.withAllSubmorphsDo(function(morph){
            if (morph.isOfClass(classNames)) {
                resultMorphs.push(morph);
            }
        });
        
        return resultMorphs;
    },
    getSubmorphsByAttribute: function(attr, value, optCaseInsensitive) {
        var resultMorphs = [],
            val = optCaseInsensitive ? (value + '').toLowerCase() : (value + '');

        this.withAllSubmorphsDo(function(morph) {
            var a = morph[attr];
            if (a) {
                    if (value == null) {
                        resultMorphs.push(morph);
                    }
                    a +='';

                    if (optCaseInsensitive) {
                        a = a.toLowerCase();
                    }

                    if (a === val ){
                        resultMorphs.push(morph);
                    }
                }

        });

        return resultMorphs;

    },
    getSubmorphsByTagName: function(tag, optTagNameAttribute) {
        var resultMorphs = [],
            tagNameAttr = optTagNameAttribute || 'tagName',
            selectAll = (tag.trim() === '*');
        tag = tag.toLowerCase();

        this.withAllSubmorphsDo(function(morph){
                var thisTagName = morph[tagNameAttr];
                if (selectAll) {
                    resultMorphs.push(morph);
                } else if (thisTagName) {
                    thisTagName +='';

                    thisTagName = thisTagName .toLowerCase();

                    if (thisTagName === tag){
                        resultMorphs.push(morph);
                    }
                }
            });

        return resultMorphs;
    },
    
    getAttribute: function(attr) {
        return this[attr];    
    },
    
    getAttributeNode: function(attr) {
        return { value : this.getAttribute(attr) };
    },
    
    get previousSibling() { 
        return this.getPreviousSibling();
    },
    
    getPreviousSibling: function() {
        
        if (!this.owner || !this.owner.submorphs || this.owner.submorphs.length <= 1) {
            return null;
        } else {
            var i = 0,
                pos;
            while (this.owner.submorphs[i]) {
                if (this.owner.submorphs[i] === this) {
                    pos = i;
		      
		  break;
                }
                i++;
            }

            if (pos >=0 && this.owner.submorphs[pos - 1]) {
                return this.owner.submorphs[pos - 1];
            }
        }
    },
    getNextSibling: function() {
        
        if (!this.owner || !this.owner.submorphs || this.owner.submorphs.length <= 1) {
            return null;
        } else {
            var i = 0,
                pos;
            while (this.owner.submorphs[i]) {
                if (this.owner.submorphs[i] === this) {
                    pos = i;
                    break;
                }
				i++;
            }

            if (pos >=0 && this.owner.submorphs[pos + 1]) {
                return this.owner.submorphs[pos + 1];
            }
        }
    },
},
'Morph class names', {
    getClassNames: function() {
        var classNames = [];

        if (this.classNames) {
            classNames = classNames.concat(this.classNames);
        }
        // add real class types to the classnames too
        var type = this.constructor;
        while (type != Object) {
            classNames.unshift(type.name);
            type = type.superclass;
        }

        // each class has to be in the return array only once
        return this.makeUniqueClassNamesList(classNames);
    },
    isOfClass: function(className) {
        // Tests if a morph has a specific class.
        // Argument can be a single class name or a
        // string containing multiple classnames
        // separated by blanks.

        var classNames = className.toLowerCase().split(/[\s,]+/),
            morphClasses = this.getClassNames() || [];

        // Generate a RegExp for each className
        classNames = classNames.collect(function(c) {
                return this.makeClassNameRegExp(c);
            }, this);

        for (var i = 0; i < classNames.length; i++) {
            var innerLoopRet = false;
            for (var j = 0; j < morphClasses.length; j++) {
                if (classNames[i].test(morphClasses[j])){
                        innerLoopRet = true;
                        continue;
                    }
            }
            if (!innerLoopRet) {
                return false;
            }
        }
        return true;
    },
    addClassName: function(className) {
        var classNames = this.classNames || [];
        if (className) {
            if (Array.isArray(className) ){
                classNames = classNames.concat(className);
            } else {
                classNames.push(className);
            }
            this.setClassNames(classNames);
        }
    },
    removeClassName: function(className) {
        var pattern = this.makeClassNameRegExp(className),
            newClassList = [],
            result = false;
        if (this.classNames && Array.isArray(this.classNames)) {
            this.classNames.each(function (c){
                    if (pattern.test(c)) {
                        result = true;
                    } else {
                        newClassList.push(c);
                    }
                });
            this.setClassNames(newClassList);
        } else {
            return false;
        }
    },
    
    setClassNames: function(classNames) {
        if (classNames && Array.isArray(classNames) && classNames.length > 0) {
            this.classNames = this.makeUniqueClassNamesList(classNames);
        } else {
            delete this.classNames;
        }
    },
    makeUniqueClassNamesList: function(classNames) {
        var uniqueClassNames = [];
        classNames.each(function(c){
                var name = this.makeClassNameRegExp(c),
                    notInListYet = true;
                uniqueClassNames.each(function(u) {
                        if (name.test(u)) {
                            notInListYet = false;
                        }
                    });
                if (notInListYet) {
                    uniqueClassNames.push(c);
                }
            }, this);
        return uniqueClassNames;
    },
    makeClassNameRegExp: function(className) {
        return new RegExp( "(^|[\\x20\\t\\r\\n\\f])" +
                className + "([\\x20\\t\\r\\n\\f]|$)", "i" );
    },
    
}
    
);

Object.subclass("lively.morphic.Sizzle",
'documentation', {
    documentation: "Sizzle port for morphic."
},
'init',{
    initialize: function(){
        this.setupSelectors();
	this.setupRegexs();
    },
	
},
'settings', {
    
    tagNameAttr: 'tagName',
    nameAttr: 'name',
    
    caching: false,
    
    cachedruns: null,
	dirruns: null,
	sortOrder: null,
	siblingCheck: null,
	assertGetIdNotName: null,

	document: null, //window.document,
	docElem: null, //document.documentElement,

	strundefined: 'undefined',
	hasDuplicate: false,
	baseHasDuplicate: true,
	done: 0,
	slice: [].slice,
	push: [].push,

	

	classCache: {},
	cachedClasses: [],
	compilerCache: {},
	cachedSelectors: [],

	// Regex
	
	setupRegexs: function(){
		this.expando = ( "sizcache" + Math.random() ).replace( ".", "" );

		// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
		this.whitespace= "[\\x20\\t\\r\\n\\f]";
		// http://www.w3.org/TR/css3-syntax/#characters
		this.characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+";
		// Loosely modeled on CSS identifier characters
		// An unquoted value should be a CSS identifier (http://www.w3.org/TR/css3-selectors/#attribute-selectors)
		// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
		this.identifier = this.characterEncoding.replace( "w", "w#" );
		// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
		this.operators= "([*^$|!~]?=)";
		this.attributes= "\\[" + this.whitespace + "*(" + this.characterEncoding + ")" + this.whitespace +
			"*(?:" + this.operators + this.whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + this.identifier + ")|)|)" + this.whitespace + "*\\]";
		this.pseudos= ":(" + this.characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|((?:[^,]|\\\\,|(?:,(?=[^\\[]*\\]))|(?:,(?=[^\\(]*\\))))*))\\)|)";
		this.pos= ":(nth|eq|gt|lt|first|last|even|odd)(?:\\((\\d*)\\)|)(?=[^-]|$)";
		this.combinators= this.whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + this.whitespace + "*";
		this.groups= "(?=[^\\x20\\t\\r\\n\\f])(?:\\\\.|" + this.attributes + "|" + this.pseudos.replace( 2, 7 ) + "|[^\\\\(),])+";
		
		// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
		this.rtrim= new RegExp( "^" + this.whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + this.whitespace + "+$", "g" );

		this.rcombinators= new RegExp( "^" + this.combinators );

		// All simple (non-comma) selectors, excluding insignifant trailing whitespace
		this.rgroups= new RegExp( this.groups + "?(?=" + this.whitespace + "*,|$)", "g" );

		// A selector, or everything after leading whitespace
		// Optionally followed in either case by a ")" for terminating sub-selectors
		this.rselector= new RegExp( "^(?:(?!,)(?:(?:^|,)" + this.whitespace + "*" + this.groups + ")*?|" + this.whitespace + "*(.*?))(\\)|$)" );

		// All combinators and selector components (attribute test, tag, pseudo, etc.), the latter appearing together when consecutive
		this.rtokens= new RegExp( this.groups.slice( 19, -6 ) + "\\x20\\t\\r\\n\\f>+~])+|" + this.combinators, "g" );

		// Easily-parseable/retrievable ID or TAG or CLASS selectors
		this.rquickExpr= /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/;

		this.rsibling= /[\x20\t\r\n\f]*[+~]/;
		this.rendsWithNot= /:not\($/;

		this.rheader= /h\d/i;
		this.rinputs= /input|select|textarea|button/i;

		this.rbackslash= /\\(?!\\)/g;
			
		this.matchExpr= {
			"ID": new RegExp( "^#(" + this.characterEncoding + ")" ),
			"CLASS": new RegExp( "^\\.(" + this.characterEncoding + ")" ),
			"NAME": new RegExp( "^\\[name=['\"]?(" + this.characterEncoding + ")['\"]?\\]" ),
			"TAG": new RegExp( "^(" + this.characterEncoding.replace( "[-", "[-\\*" ) + ")" ),
			"ATTR": new RegExp( "^" + this.attributes ),
			"PSEUDO": new RegExp( "^" + this.pseudos ),
			"CHILD": new RegExp( "^:(only|nth|last|first)-child(?:\\(" + this.whitespace +
				"*(even|odd|(([+-]|)(\\d*)n|)" + this.whitespace + "*(?:([+-]|)" + this.whitespace +
				"*(\\d+)|))" + this.whitespace + "*\\)|)", "i" ),
			"POS": new RegExp( this.pos, "ig" ),
			// For use in libraries implementing .is()
			"needsContext": new RegExp( "^" + this.whitespace + "*[>+~]|" + this.pos, "i" )
		};

	},
},

'selection',
{
	setupSelectors: function(){
		this.selectors = {

		// Can be adjusted by the user
		cacheLength: 50,


		order: [ "ID", "CLASS", "TAG", "NAME" ],

		attrHandle: {},

		find: {
		    
		    "CLASS": function( className, context, xml ) {
		        
		          if     ( typeof context.getSubmorphsByClassName !== this.strundefined && !xml ) {
			         return context.getSubmorphsByClassName( className );
		              } 
		      },
		
		    "NAME": function( name, context ) {
            		if ( typeof context.getSubmorphsByAttribute!== this.strundefined ) {
			     return context.getSubmorphsByAttribute( this.nameAttr, name );
		          }
	               },
			"ID": this.assertGetIdNotName ?
				function( id, context, xml ) {
					if ( typeof context.getSubmorphById !== this.strundefined && !xml ) {
						var m = context.getSubmorphById( id );
						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document #6963
						return m && m.owner ? [m] : [];
					}
				} :
				function( id, context, xml ) {
					if ( typeof context.getSubmorphById!== this.strundefined && !xml ) {
						var m = context.getSubmorphById( id );

						return m ?
							m.id === id || typeof m.getAttributeNode !== this.strundefined && m.getAttributeNode("id").value === id ?
								[m] :
								undefined :
							[];
					}
				},

			"TAG": this.assertTagNameNoComments ?
				function( tag, context ) {
					if ( typeof context.getSubmorphsByTagName !== this.strundefined ) {
						return context.getSubmorphsByTagName(tag);
					}
				} :
				function( tag, context ) {
					var results = context.getSubmorphsByTagName( tag);

					// Filter out possible comments
					if ( tag === "*" ) {
						var elem,
							tmp = [],
							i = 0;

						for ( ; (elem = results[i]); i++ ) {
							if ( elem.isMorph ) {
								tmp.push( elem );
							}
						}

						return tmp;
					}
					return results;
				}
		},

		relative: {
			">": { dir: "owner", first: true },
			" ": { dir: "owner" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		},

		preFilter: {
			"ATTR": function( match ) {
				match[1] = match[1].replace( this.rbackslash, "" );

				// Move the given value to this.matchExpr[3] whether quoted or unquoted
				match[3] = ( match[4] || match[5] || "" ).replace( this.rbackslash, "" );

				if ( match[2] === "~=" ) {
					match[3] = " " + match[3] + " ";
				}

				return match.slice( 0, 4 );
			},

			"CHILD": function( match ) {
				/* matches from matchExpr.CHILD
					1 type (only|nth|...)
					2 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
					3 xn-component of xn+y argument ([+-]?\d*n|)
					4 sign of xn-component
					5 x of xn-component
					6 sign of y-component
					7 y of y-component
				*/
				match[1] = match[1].toLowerCase();

				if ( match[1] === "nth" ) {
					// nth-child requires argument
					if ( !match[2] ) {
						this.error( match[0] );
					}

					// numeric x and y parameters for Expr.filter.CHILD
					// remember that false/true cast respectively to 0/1
					match[3] = +( match[3] ? match[4] + (match[5] || 1) : 2 * ( match[2] === "even" || match[2] === "odd" ) );
					match[4] = +( ( match[6] + match[7] ) || match[2] === "odd" );

				// other types prohibit arguments
				} else if ( match[2] ) {
					this.error( match[0] );
				}

				return match;
			},

			"PSEUDO": function( match ) {
				var argument,
					unquoted = match[4];
				if ( this.matchExpr["CHILD"].test( match[0] ) ) {
					return null;
				}

				// Relinquish our claim on characters in `unquoted` from a closing parenthesis on
				if ( unquoted && (argument = this.rselector.exec( unquoted )) && argument.pop() ) {

					match[0] = match[0].slice( 0, argument[0].length - unquoted.length - 1 );
					unquoted = argument[0].slice( 0, -1 );
				}

				// Quoted or unquoted, we have the full argument
				// Return only captures needed by the pseudo filter method (type and argument)
				match.splice( 2, 3, unquoted || match[3] );
				return match;
			}
		},

		filter: {
			"ID": this.assertGetIdNotName ?
				function( id ) {
					id = id.replace( this.rbackslash, "" );
					return function( elem ) {
						return elem.getAttribute("id") === id;
					};
				} :
				function( id ) {
					id = id.replace( this.rbackslash, "" );
					return function( elem ) {
						var node = typeof elem.getAttributeNode !== this.strundefined && elem.getAttributeNode("id");
						return node && node.value === id;
					};
				},

			"TAG": function( nodeName ) {
				if ( nodeName === "*" ) {
					return function() { return true; };
				}
				nodeName = nodeName.replace( this.rbackslash, "" ).toLowerCase();

				return function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
			},

			"CLASS": function( className ) {
				var pattern = this.classCache[ className ];
				if ( !pattern ) {
					pattern = this.classCache[ className ] = new RegExp( "(^|" + this.whitespace + ")" + className + "(" + this.whitespace + "|$)", "i" );
					this.cachedClasses.push( className );
					// Avoid too large of a cache
					if ( this.cachedClasses.length > this.cacheLength ) {
						delete this.classCache[ this.cachedClasses.shift() ];
					}
				}
				return function( elem ) {
					return pattern.test( elem.getClassNames().join(' ') || "" );
				};
			},

			"ATTR": function( name, operator, check ) {

				if ( !operator ) {
					return function( elem ) {
						return this.attr( elem, name ) != null;
					};
				}

				return function( elem ) {
					var result = this.attr( elem, name ),
						value = result + "";

					if ( result == null ) {
						return operator === "!=";
					}

					switch ( operator ) {
						case "=":
							return value === check;
						case "!=":
							return value !== check;
						case "^=":
							return check && value.indexOf( check ) === 0;
						case "*=":
							return check && value.indexOf( check ) > -1;
						case "$=":
							return check && value.substr( value.length - check.length ) === check;
						case "~=":
							return ( " " + value + " " ).indexOf( check ) > -1;
						case "|=":
							return value === check || value.substr( 0, check.length + 1 ) === check + "-";
					}
				};
			},

			"CHILD": function( type, argument, first, last ) {

				if ( type === "nth" ) {
				        
					var doneName = this.done++;

					return function( elem ) {
						var parent, diff,
							count = 0,
							node = elem;

						if ( first === 1 && last === 0 ) {
							return true;
						}

						parent = elem.owner;

						if ( parent && (parent[ this.expando ] !== doneName || !elem.sizset) ) {
							for ( node = parent.submorphs.first(); node; node = node.getNextSibling()) {
								if ( node.isMorph ) {
									node.sizset = ++count;
									if ( node === elem ) {
										break;
									}
								}
							}

							parent[ this.expando ] = doneName;
						}

						diff = elem.sizset - last;

						if ( first === 0 ) {
							return diff === 0;

						} else {
							return ( diff % first === 0 && diff / first >= 0 );
						}
					};
				}

				return function( elem ) {
					var node = elem;

					switch ( type ) {
						case "only":
						    //debugger
						case "first":
							while ( (node = node.getPreviousSibling()) ) {
								if ( node && node.isMorph ) {
									return false;
								}
							}

							if ( type === "first" ) {
								return true;
							}

							node = elem;

							/* falls through */
						case "last":
							while ( (node = node.getNextSibling()) ) {
								if (node && node.isMorph ) {
									return false;
								}
							}

							return true;
					}
				};
			},

			"PSEUDO": function( pseudo, argument, context, xml ) {
				// pseudo-class names are case-insensitive
				// http://www.w3.org/TR/selectors/#pseudo-classes
				// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
				
				var fn = this.selectors.pseudos[ pseudo ] || this.selectors.pseudos[ pseudo.toLowerCase()];

				if ( !fn ) {
					this.error( "unsupported pseudo: " + pseudo );
				}

				// The user may set fn.sizzleFilter to indicate
				// that arguments are needed to create the filter function
				// just as Sizzle does
				if ( !fn.sizzleFilter ) {
					return fn;
				}

				return fn.call(this, argument, context, xml );
			}
		},

		pseudos: {
			"not": this.markFunction(function( selector, context, xml ) {
				// Trim the selector passed to compile
				// to avoid treating leading and trailing
				// spaces as combinators
				var matcher = this.compile( selector.replace( this.rtrim, "$1" ), context, xml );
				return function( elem ) {
					return !matcher.call(this, elem, context);
				};
			}),

			"enabled": function( elem ) {
				return elem.disabled === false;
			},

			"disabled": function( elem ) {
				return elem.disabled === true;
			},

			"checked": function( elem ) {
				// In CSS3, :checked should return both checked and selected elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				var nodeName = elem.nodeName.toLowerCase();
				return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
			},

			"selected": function( elem ) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if ( elem.owner ) {
					elem.owner.selectedIndex;
				}

				return elem.selected === true;
			},

			"parent": function( elem ) {
				return !this.pseudos["empty"]( elem );
			},

			"empty": function( elem ) {
				// http://www.w3.org/TR/selectors/#empty-pseudo
				// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
				//   not comment, processing instructions, or others
				// Thanks to Diego Perini for the nodeName shortcut
				//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
				if (elem.submorphs && elem.submorphs.length > 0){
					return false;
				} else {
					return true;
				}
				
				/*
				var nodeType;
				elem = elem.firstChild;
				while ( elem ) {
					if ( elem.nodeName > "@" || (nodeType = elem.nodeType) === 3 || nodeType === 4 ) {
						return false;
					}
					elem = elem.nextSibling;
				}
				return true;
				*/
			},

			"contains": this.markFunction(function( text ) {
				return function( elem ) {
					return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
				};
			}),

			"has": this.markFunction(function( selector ) {
				return function( elem ) {
					return this.select( selector, elem ).length > 0;
				};
			}),

			"header": function( elem ) {
				return this.rheader.test( elem.nodeName );
			},

			"text": function( elem ) {
				var type, attr;
				// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
				// use getAttribute instead to test this case
				return elem.nodeName.toLowerCase() === "input" &&
					(type = elem.type) === "text" &&
					( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === type );
			},

			// Input types
			"radio": this.createInputFunction("radio"),
			"checkbox": this.createInputFunction("checkbox"),
			"file": this.createInputFunction("file"),
			"password": this.createInputFunction("password"),
			"image": this.createInputFunction("image"),

			"submit": this.createButtonFunction("submit"),
			"reset": this.createButtonFunction("reset"),

			"button": function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},

			"input": function( elem ) {
				return this.rinputs.test( elem.nodeName );
			},

			"focus": function( elem ) {
				var doc = elem.ownerDocument;
				return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href);
			},

			"active": function( elem ) {
				return elem === elem.ownerDocument.activeElement;
			}
		},

		setFilters: {
			"first": function( elements, argument, not ) {
				return not ? elements.slice( 1 ) : [ elements[0] ];
			},

			"last": function( elements, argument, not ) {
				var elem = elements.pop();
				return not ? elements : [ elem ];
			},

			"even": function( elements, argument, not ) {
				var results = [],
					i = not ? 1 : 0,
					len = elements.length;
				for ( ; i < len; i = i + 2 ) {
					results.push( elements[i] );
				}
				return results;
			},

			"odd": function( elements, argument, not ) {
				var results = [],
					i = not ? 0 : 1,
					len = elements.length;
				for ( ; i < len; i = i + 2 ) {
					results.push( elements[i] );
				}
				return results;
			},

			"lt": function( elements, argument, not ) {
				return not ? elements.slice( +argument ) : elements.slice( 0, +argument );
			},

			"gt": function( elements, argument, not ) {
				return not ? elements.slice( 0, +argument + 1 ) : elements.slice( +argument + 1 );
			},

			"eq": function( elements, argument, not ) {
				var elem = elements.splice( +argument, 1 );
				return not ? elements : elem;
			}
		}
    }
    },
    
    select: function( selector, context, results, seed ) {

	results = results || [];
	context = context || $world;
        
        /*
        // Different to normal selection in HTML, we want the context
        // to be included in the search field.
        // Thus, to keep the Sizzle algorithm as untouched as possible,
        // the context is set to the world, while the searchfield is
        // represented by the 'seed'.
        if (context.isMorph && !seed) {
            seed = [];
            context.withAllSubmorphsDo(function(m){seed.push(m)});
            context = context.world();
        }
        */
	var match, elem, xml, m,
		nodeType = (context.isWorld) ? 9 : 1;

	if ( !selector || typeof selector !== "string" ) {
	   return results;
	}

	if (!seed ) {
		if ( (match = this.rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getSubmorphById(m);
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.owner) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.world() && (elem = context.world().getSubmorphById( m )) &&
						this.contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				this.push.apply( results, this.slice.call(context.getSubmorphsByTagName(selector), 0) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && context.getSubmorphsByClassName ) {
				this.push.apply( results, this.slice.call(context.getSubmorphsByClassName ( m ), 0) );
				return results;
			}
		}
	}

	// All others
	return this.uberselect( selector, context, results, seed, xml );
    },
	
	
    uberselect: function( selector, context, results, seed) {
	// Remove excessive whitespace
	
	selector = selector.replace( this.rtrim, "$1" );
	var elements, matcher, i, len, elem, token,
		type, findContext, notTokens,
		match = selector.match( this.rgroups ),
		tokens = selector.match( this.rtokens ),
		contextNodeType = (context.isWorld) ? 9 : 1;

	// POS handling
	if ( this.matchExpr["POS"].test(selector) ) {
		return this.handlePOS( selector, context, results, seed, match );
	}

	if ( seed ) {
		elements = this.slice.call( seed, 0 );

	// To maintain document order, only narrow the
	// set if there is one group
	} else if ( match && match.length === 1 ) {

		// Take a shortcut and set the context if the root selector is an ID
		if ( tokens.length > 1 && contextNodeType === 9 &&
				(match = this.matchExpr["ID"].exec( tokens[0] )) ) {

			context = this.selectors.find["ID"].call(this, match[1], context)[0];
			if ( !context ) {
				return results;
			}

			selector = selector.slice( tokens.shift().length );
		}

		findContext = ( (match = this.rsibling.exec( tokens[0] )) && !match.index && context.owner ) || context;

		// Get the last token, excluding :not
		notTokens = tokens.pop();
		token = notTokens.split(":not")[0];

		for ( i = 0, len = this.selectors.order.length; i < len; i++ ) {
			type = this.selectors.order[i];

			if ( (match = this.matchExpr[ type ].exec( token )) ) {
				elements = this.selectors.find[ type ].call(this, (match[1] || "").replace( this.rbackslash, "" ), findContext);

				if ( elements == null ) {
					continue;
				}

				if ( token === notTokens ) {
					selector = selector.slice( 0, selector.length - notTokens.length ) +
						token.replace( this.matchExpr[ type ], "" );

					if ( !selector ) {
						this.push.apply( results, this.slice.call(elements, 0) );
					}
				}
				break;
			}
		}
	}

	// Only loop over the given elements once
	// If selector is empty, we're already done
	if ( selector ) {
		matcher = this.compile( selector, context);
		this.dirruns = matcher.dirruns++;

		if ( elements == null ) {
			elements = this.selectors.find["TAG"].call(this, "*", (this.rsibling.test( selector ) && context.owner) || context );
		}
		for ( i = 0; (elem = elements[i]); i++ ) {
		    
			this.cachedruns = matcher.runs++;
			if ( matcher.call(this, elem, context) ) {
				results.push( elem );
			}
		}
	}

	return results;
    },
    attr: function( elem, name ) {
	var attr,
		xml = false;
        /*
	if ( !xml ) {
		name = name.toLowerCase();
	}
	*/
	if ( this.selectors.attrHandle[ name ] ) {
		return this.selectors.attrHandle[ name ]( elem );
	}
	
	// just give back the attr value in morphic ...
	return elem[name];
	
	/*
	if ( this.assertAttributes || xml ) {
		return elem[name];
	}
	attr = elem[name];
	return attr ?
		typeof elem[ name ] === "boolean" ?
			elem[ name ] ? name : null :
			attr.specified ? attr.value : null :
		null;
	*/
    },
    error: function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
    },
	
    getText: function( elem ) {
		/**
		* Utility function for retrieving the text value of an array of DOM nodes
		* @param {Array|Element} elem
		*/
		
		// normal morphs usually don't have something like 'text', 
		// text morphs return their textString attribute
		return elem.textString || '';
		
		/*
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;

		if ( nodeType ) {
			if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
				// Use textContent for elements
				// innerText usage removed for consistency of new lines (see #11153)
				if ( typeof elem.textContent === "string" ) {
					return elem.textContent;
				} else {
					// Traverse its children
					for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
						ret += this.getText( elem );
					}
				}
			} else if ( nodeType === 3 || nodeType === 4 ) {
				return elem.nodeValue;
			}
			// Do not include comment or processing instruction nodes
		} else {

			// If no nodeType, this is expected to be an array
			for ( ; (node = elem[i]); i++ ) {
				// Do not traverse comment nodes
				ret += this.getText( node );
			}
		}
		return ret;
		*/
	},
    
},
'tokenizing and matching',{
    tokenize: function( selector, context, xml ) {
        var tokens, soFar, type,
            groups = [],
            i = 0,

            // Catch obvious selector issues: terminal ")"; nonempty fallback match
            // rselector never fails to match *something*
            match = this.rselector.exec( selector ),
            matched = !match.pop() && !match.pop(),
            selectorGroups = matched && selector.match( this.rgroups ) || [""],

            preFilters = this.selectors.preFilter,
            filters = this.selectors.filter,
            checkContext = !xml && context !== document;

        for ( ; (soFar = selectorGroups[i]) != null && matched; i++ ) {
            groups.push( tokens = [] );

            // Need to make sure we're within a narrower context if necessary
            // Adding a descendant combinator will generate what is needed
            if ( checkContext ) {
                soFar = " " + soFar;
            }

            while ( soFar ) {
                matched = false;

                // Combinators
                if ( (match = this.rcombinators.exec( soFar )) ) {
                    soFar = soFar.slice( match[0].length );

                    // Cast descendant combinators to space
                    matched = tokens.push({ part: match.pop().replace( this.trim, " " ), captures: match });
                }

                // Filters
                for ( type in filters ) {
                    if ( (match = this.matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
                        (match = preFilters[ type ].call(this, match, context, xml )) ) ) {

                        soFar = soFar.slice( match.shift().length );
                        matched = tokens.push({ part: type, captures: match });
                    }
                }

                if ( !matched ) {
                    break;
                }
            }
        }

        if ( !matched ) {
            this.error( selector );
        }

        return groups;
    },

    addCombinator: function( matcher, combinator, context, firstCombinator) {
        var dir = combinator.dir,
            doneName = this.done++;
        
        if ( !matcher ) {
            // If there is no matcher to check, check against the context
            matcher = function( elem ) {
                return elem === context;
            };
        }
        if (combinator.first) {
            if (firstCombinator) {
                return function( elem, context ) {
                    if  ( matcher.call(this, elem, context ) ) {
                                    return elem;
                    }
                    while ( (elem = elem[ dir ]) ) {
                        if ( elem.isMorph ) {
                            return matcher.call(this, elem, context ) && elem;
                        }
                    }
                }
            } else {
                return function( elem, context ) {
                    while ( (elem = elem[ dir ]) ) {
                        if ( elem.isMorph ) {
                            return matcher.call(this, elem, context ) && elem;
                        }
                    }
                }
            }
        } else {
            if (firstCombinator) {
                // First combinator in selector should include context
                // (different in morphic than in HTML).
                return function( elem, context ) {
                    var cache,
                        dirkey = doneName + "." + this.dirruns,
                        cachedkey = dirkey + "." + this.cachedruns;

                    if  ( matcher.call(this, elem, context ) ) {
                                    if (this.caching) {
                                        elem.sizset = true;
                                    }
                                    return elem;
                    }

                    while ( (elem = elem[ dir ]) ) {
                        if ( elem.isMorph ) {
                            if ( (cache = elem[ this.expando ]) === cachedkey ) {
                                return elem.sizset;
                            } else if ( typeof cache === "string" && cache.indexOf(dirkey) === 0 ) {
                                if ( elem.sizset ) {
                                    return elem;
                                }
                            } else {
                                if (this.caching) {
                                    elem[ this.expando ] = cachedkey;
                                }
                                if ( matcher.call(this, elem, context ) ) {
                                    if (this.caching) {
                                        elem.sizset = true;
                                    }
                                    return elem;
                                }
                                if (this.caching) {
                                    elem.sizset = false;
                                }
                            }
                        }
                    }
                };

            } else {
                return function( elem, context ) {
                    var cache,
                        dirkey = doneName + "." + this.dirruns,
                        cachedkey = dirkey + "." + this.cachedruns;

                    while ( (elem = elem[ dir ]) ) {
                        if ( elem.isMorph ) {
                            if ( (cache = elem[ this.expando ]) === cachedkey ) {
                                return elem.sizset;
                            } else if ( typeof cache === "string" && cache.indexOf(dirkey) === 0 ) {
                                if ( elem.sizset ) {
                                    return elem;
                                }
                            } else {
                                if (this.caching) {
                                    elem[ this.expando ] = cachedkey;
                                }
                                if ( matcher.call(this, elem, context ) ) {
                                    if (this.caching) {
                                        elem.sizset = true;
                                    }
                                    return elem;
                                }
                                if (this.caching) {
                                    elem.sizset = false;
                                }
                            }
                        }
                    }
                };

            }
        }

    },

    addMatcher: function( higher, deeper ) {
        return higher ?
            function( elem, context ) {
                var result = deeper.call(this, elem, context );
                return result && higher.call(this, result === true ? elem : result, context );
            } :
            deeper;
    },

    // ["TAG", ">", "ID", " ", "CLASS"]
    matcherFromTokens: function( tokens, context, xml ) {
        var token, matcher,
            i = 0,
            firstCombinator = true;

        for ( ; (token = tokens[i]); i++ ) {
            if ( this.selectors.relative[ token.part ] ) {
                matcher = this.addCombinator( matcher,
                    this.selectors.relative[ token.part ],
                    context,
                    firstCombinator);
            } else {
                token.captures.push( context, xml );
                matcher = this.addMatcher( matcher, this.selectors.filter[ token.part ].apply( this, token.captures ) );
            }
            firstCombinator = false;
        }

        return matcher;
    },

    matcherFromGroupMatchers: function( matchers ) {
        return function( elem, context ) {
            var matcher,
                j = 0;
            for ( ; (matcher = matchers[j]); j++ ) {
                if ( matcher.call(this, elem, context) ) {
                    return true;
                }
            }
            return false;
        };
    },
    
    compile: function( selector, context, xml ) {
        var tokens, group, i,
            cached = this.compilerCache[ selector ];

        // Return a cached group function if already generated (context dependent)
        if ( this.caching && cached && cached.context === context ) {
            return cached;
        }

        // Generate a function of recursive functions that can be used to check each element
        group = this.tokenize( selector, context, xml );
        for ( i = 0; (tokens = group[i]); i++ ) {
            group[i] = this.matcherFromTokens( tokens, context, xml );
        }

        // Cache the compiled function
        cached = this.compilerCache[ selector ] = this.matcherFromGroupMatchers( group );
        cached.context = context;
        cached.runs = cached.dirruns = 0;
        this.cachedSelectors.push( selector );
        // Ensure only the most recent are cached
        if ( this.cachedSelectors.length > this.selectors.cacheLength ) {
            delete this.compilerCache[ this.cachedSelectors.shift() ];
        }
        return cached;
    },

    matches: function( expr, elements ) {
        return this.select( expr, null, null, elements );
    },

    matchesSelector: function( elem, expr ) {
        return this.select( expr, null, null, [ elem ] ).length > 0;
    },
    
    contains: function(a,b){
            while ( (b = b.owner) ) {
                if ( b === a ) {
                    return true;
                }
            }
            return false;

    },

},
'multiple contexts and POS',{
    multipleContexts: function( selector, contexts, results, seed ) {
        var i = 0,
            len = contexts.length;
        for ( ; i < len; i++ ) {
            this.select( selector, contexts[i], results, seed );
        }
    },

    handlePOSGroup: function( selector, posfilter, argument, contexts, seed, not ) {
        var results,
            fn = this.selectors.setFilters[ posfilter.toLowerCase() ];

        if ( !fn ) {
            this.error( posfilter );
        }

        if ( selector || !(results = seed) ) {
            this.multipleContexts( selector || "*", contexts, (results = []), seed );
        }

        return results.length > 0 ? fn( results, argument, not ) : [];
    },

    handlePOS: function( selector, context, results, seed, groups ) {
        var match, not, anchor, ret, elements, currentContexts, part, lastIndex,
            i = 0,
            len = groups.length,
            rpos = this.matchExpr["POS"],
            // This is generated here in case matchExpr["POS"] is extended
            rposgroups = new RegExp( "^" + rpos.source + "(?!" + this.whitespace + ")", "i" ),
            // This is for making sure non-participating
            // matching groups are represented cross-browser (IE6-8)
            setUndefined = function() {
                var i = 1,
                    len = arguments.length - 2;
                for ( ; i < len; i++ ) {
                    if ( arguments[i] === undefined ) {
                        this.matchExpr[i] = undefined;
                    }
                }
            };

        for ( ; i < len; i++ ) {
            // Reset regex index to 0
            rpos.exec("");
            selector = groups[i];
            ret = [];
            anchor = 0;
            elements = seed;
            while ( (match = rpos.exec( selector )) ) {
                lastIndex = rpos.lastIndex = match.index + this.matchExpr[0].length;
                if ( lastIndex > anchor ) {
                    part = selector.slice( anchor, match.index );
                    anchor = lastIndex;
                    currentContexts = [ context ];

                    if ( this.rcombinators.test(part) ) {
                        if ( elements ) {
                            currentContexts = elements;
                        }
                        elements = seed;
                    }

                    if ( (not = this.rendsWithNot.test( part )) ) {
                        part = part.slice( 0, -5 ).replace( this.rcombinators, "$&*" );
                    }

                    if ( match.length > 1 ) {
                        this.matchExpr[0].replace( rposgroups, setUndefined );
                    }
                    elements = this.handlePOSGroup( part, this.matchExpr[1], this.matchExpr[2], currentContexts, elements, not );
                }
            }

            if ( elements ) {
                ret = ret.concat( elements );

                if ( (part = selector.slice( anchor )) && part !== ")" ) {
                    if ( this.rcombinators.test(part) ) {
                        this.multipleContexts( part, ret, results, seed );
                    } else {
                        this.select( part, context, results, seed ? seed.concat(elements) : elements );
                    }
                } else {
                    this.push.apply( results, ret );
                }
            } else {
                this.select( selector, context, results, seed );
            }
        }

        // Do not sort if this is a single filter
        return len === 1 ? results : this.uniqueSort( results );
    }
},

'helpers',{
        // Mark a function for use in filtering
	markFunction: function( fn ) {
		fn.sizzleFilter = true;
		return fn;
	},

	// Returns a function to use in pseudos for input types
	createInputFunction: function( type ) {
		return function( elem ) {
			// Check the input's nodeName and type
			return elem.nodeName.toLowerCase() === "input" && elem.type === type;
		};
	},

	// Returns a function to use in pseudos for buttons
	createButtonFunction: function( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && elem.type === type;
		};
	},


},

'sort order', {
    sortOrder: function(a,b){
		// The nodes are identical, we can exit early
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Fallback to using sourceIndex (in IE) if it's available on both nodes
		} else if ( a.sourceIndex && b.sourceIndex ) {
			return a.sourceIndex - b.sourceIndex;
		}

		var al, bl,
			ap = [],
			bp = [],
			aup = a.owner,
			bup = b.owner,
			cur = aup;

		// If the nodes are siblings (or identical) we can do a quick check
		if ( aup === bup ) {
			return siblingCheck( a, b );

		// If no parents were found then the nodes are disconnected
		} else if ( !aup ) {
			return -1;

		} else if ( !bup ) {
			return 1;
		}

		// Otherwise they're somewhere else in the tree so we need
		// to build up a full list of the parentNodes for comparison
		while ( cur ) {
			ap.unshift( cur );
			cur = cur.owner;
		}

		cur = bup;

		while ( cur ) {
			bp.unshift( cur );
			cur = cur.owner;
		}

		al = ap.length;
		bl = bp.length;

		// Start walking down the tree looking for a discrepancy
		for ( var i = 0; i < al && i < bl; i++ ) {
			if ( ap[i] !== bp[i] ) {
				return siblingCheck( ap[i], bp[i] );
			}
		}

		// We ended someplace up the tree so do a sibling check
		return i === al ?
			siblingCheck( a, bp[i], -1 ) :
			siblingCheck( ap[i], b, 1 );
	},

    siblingCheck: function( a, b, ret ) {
		if ( a === b ) {
			return ret;
		}

		var cur = a.getNextSibling();

		while ( cur ) {
			if ( cur === b ) {
				return -1;
			}

			cur = cur.getNextSibling();
		}

		return 1;
    },


    uniqueSort: function( results ) {
        // Document sorting and removing duplicates
	var elem,
		i = 1;

	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			for ( ; (elem = results[i]); i++ ) {
				if ( elem === results[ i - 1 ] ) {
					results.splice( i--, 1 );
				}
			}
		}
	}

	return results;
    }
    
}

);




})