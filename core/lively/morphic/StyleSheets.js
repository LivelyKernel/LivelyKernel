module('lively.morphic.StyleSheets').requires().toRun(function() {

Object.subclass("Selector",
'documentation', {
    documentation: "Sizzle port for morphic."
},
'helpers',{

},
'settings', {
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

	expando: ( "sizcache" + Math.random() ).replace( ".", "" ),

	// Regex

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace: "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding: "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier (http://www.w3.org/TR/css3-selectors/#attribute-selectors)
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier: characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	operators: "([*^$|!~]?=)",
	attributes: "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",
	pseudos: ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|((?:[^,]|\\\\,|(?:,(?=[^\\[]*\\]))|(?:,(?=[^\\(]*\\))))*))\\)|)",
	pos: ":(nth|eq|gt|lt|first|last|even|odd)(?:\\((\\d*)\\)|)(?=[^-]|$)",
	combinators: whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*",
	groups: "(?=[^\\x20\\t\\r\\n\\f])(?:\\\\.|" + attributes + "|" + pseudos.replace( 2, 7 ) + "|[^\\\\(),])+",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim: new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcombinators: new RegExp( "^" + combinators ),

	// All simple (non-comma) selectors, excluding insignifant trailing whitespace
	rgroups: new RegExp( groups + "?(?=" + whitespace + "*,|$)", "g" ),

	// A selector, or everything after leading whitespace
	// Optionally followed in either case by a ")" for terminating sub-selectors
	rselector: new RegExp( "^(?:(?!,)(?:(?:^|,)" + whitespace + "*" + groups + ")*?|" + whitespace + "*(.*?))(\\)|$)" ),

	// All combinators and selector components (attribute test, tag, pseudo, etc.), the latter appearing together when consecutive
	rtokens: new RegExp( groups.slice( 19, -6 ) + "\\x20\\t\\r\\n\\f>+~])+|" + combinators, "g" ),

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr: /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,

	rsibling: /[\x20\t\r\n\f]*[+~]/,
	rendsWithNot: /:not\($/,

	rheader: /h\d/i,
	rinputs: /input|select|textarea|button/i,

	rbackslash: /\\(?!\\)/g,

	matchExpr: {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "[-", "[-\\*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|nth|last|first)-child(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"POS": new RegExp( pos, "ig" ),
		// For use in libraries implementing .is()
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|" + pos, "i" )
	},

	classCache: {},
	cachedClasses: [],
	compilerCache: {},
	cachedSelectors: []
}


)

}) // end of module