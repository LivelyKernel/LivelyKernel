module('Tests.SmalltalkParserTest').requires('lively.TestFramework', 'lively.Ometa', 'lively.SmalltalkParser').toRun(function() {

TestCase.subclass('Tests.SmalltalkParserTest.ASTBaseTest', {

errorCb: function() {
	var test = this;
	return function() {
			OMetaSupport.handleErrorDebug.apply(Global,arguments);
			test.assert(false, 'Couldn\'t parse');
	 	}
},
setUp: function() {
	this.jsParser = LKJSParser;
	this.stParser = SmalltalkParser;
	this.js2StConverter = JS2StConverter;
},

assertNodeMatches: function(expectedSpec, node) {
	for (name in expectedSpec) {
		var expected = expectedSpec[name];
		if (Object.isFunction(expected)) continue;
		dbgOn(!node);
		var actual = node[name];
		if (!expected && !actual) return;
		switch (expected.constructor) {
			case String:
			case Boolean:
			case Number: {
				this.assertEquals(expected, actual, name + ' was expected to be ' + expected);
				continue;
			}
		};
		this.assertNodeMatches(expected, actual);
	}
},

jsAst2StAst: function(jsAst) {
	return OMetaSupport.matchWithGrammar(this.js2StConverter, "trans", jsAst, this.errorCb());
},
js2jsAst: function(src, optRule) {
	var rule = optRule || 'topLevel';
	return OMetaSupport.matchAllWithGrammar(this.jsParser, rule, src, this.errorCb());
},
js2StAst: function(jsSrcOrAst, jsParseRule) {
	jsAst = stAst = null;
	jsAst = Object.isArray(jsSrcOrAst) ? jsSrcOrAst : this.js2jsAst(jsSrcOrAst, jsParseRule);
	stAst = this.jsAst2StAst(jsAst);
	return stAst;
},

st2stAst: function(src, rule) {
	var errorcb = OMetaSupport.handleErrorDebug;
	stAst = OMetaSupport.matchAllWithGrammar(this.stParser, rule, src, errorcb);
	if (!stAst) this.assert(false, 'Could not parse: ' + src);
	return stAst;
},
st2st: function(src, rule) {
	return this.st2stAst(src, rule).toSmalltalk();
},
st2js: function(src, rule) {
	var result = this.st2stAst(src, rule);
	if (Object.isArray(result))
		return result.invoke('toJavaScript').join('');
	else
		return result.toJavaScript();
},


});

Tests.SmalltalkParserTest.ASTBaseTest.subclass('Tests.SmalltalkParserTest.SmalltalkTheParserTest', {

test01ParseUnaryMessageSend: function() {
	var src = 'x foo';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isMessage: true,
		isUnary: true,
		messageName: 'foo',
		args: null,
		receiver: {isVariable: true, name: 'x'},
	}
	this.assertNodeMatches(expected, result);
},
test02ParseBinaryMessageSend: function() {
	var src = 'x ++ 1';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isMessage: true,
		isBinary: true,
		messageName: '++',
		args: [{isLiteral: true, value: 1}],
		receiver: {name: 'x'},
	}
	this.assertNodeMatches(expected, result);
},
test03aKeywordyMessageSend: function() {
	var src = 'x foo: -42';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isMessage: true,
		isKeyword: true,
		messageName: 'foo:',
		args: [{isLiteral: true, value: -42}],
	}
	this.assertNodeMatches(expected, result);
},
test03bKeywordyMessageSend: function() {
	var src = 'x foo: 42 bar: blupf baz: 23';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isMessage: true,
		isKeyword: true,
		messageName: 'foo:bar:baz:',
		args: [
			{isLiteral: true, value: 42},
			{isVariable: true, name: 'blupf'},
			{isLiteral: true, value: 23},
		],
	}
	this.assertNodeMatches(expected, result);
},
test03cKeywordAndBinary: function() {
	var src = 'x + y foo: 1';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isKeyword: true,
		messageName: 'foo:',
		args: [{isLiteral: true, value: 1}],
		receiver: {isBinary: true},
	}
	this.assertNodeMatches(expected, result);
},
test04aChainedUnaryMessages: function() {
	var src = 'x foo bar';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isUnary: true, messageName: 'bar',
		receiver: {isUnary: true, messageName: 'foo', receiver: {isVariable: true}},
	};
	this.assertNodeMatches(expected, result);
},
test04bChainedBinaryMessages: function() {
	var src = 'x + 1 * 2';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isBinary: true,
		messageName: '*',
		args: [{value: 2}],
		receiver: {
			isBinary: true,
			messageName: '+',
			args: [{value: 1}],
			receiver: {isVariable: true}
		},
	};
	this.assertNodeMatches(expected, result);
},
test05UnaryBinaryKeywordMessage: function() {
	var src = 'x foo: 2--3 bar: 1 baz';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isKeyword: true,
		messageName: 'foo:bar:',
		receiver: {name: 'x'},
		args: [
			{isBinary: true, receiver: {value: 2}, messageName: '--', args: [{value: 3}]},
			{isUnary: true, receiver: {value: 1}, messageName: 'baz'}
		],
	};
	this.assertNodeMatches(expected, result);
},
test06aSubexpressionAndUnary: function() {
	var src = '(x + y) foo';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isUnary: true, messageName: 'foo', receiver: {isBinary: true},
	};
	this.assertNodeMatches(expected, result);
},
test06bSubexpressionAndUnary: function() {
	var src = 'x + (y foo: 1)';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isBinary: true, messageName: '+',
		args: [{isKeyword: true, messageName: 'foo:'}]
	};
	this.assertNodeMatches(expected, result);
},
test07aAssignment: function() {
	var src = 'xyz := 1';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isAssignment: true, variable: {name: 'xyz'}, value: {value: 1},
	};
	this.assertNodeMatches(expected, result);
},
test07bAssignment: function() {
	var src = 'x := yz:=1';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isAssignment: true,
		variable: {name: 'x'},
		value: {isAssignment: true, variable: {name: 'yz'}, value: {isLiteral: true}},
	};
	this.assertNodeMatches(expected, result);
},
test08aString: function() {
	var string = ' this is a string';
	var src = '\'' + string + '\'';
	var result = this.st2stAst(src, 'expression');
	var expected = {isLiteral: true, value: string};
	this.assertNodeMatches(expected, result);
},
test08bStringWithEscapedQuote: function() {
	var string = 'That\'s fun';
	var src = '\'That\'\'s fun\'';
	var result = this.st2stAst(src, 'expression');
	var expected = {isLiteral: true, value: string};
	this.assertNodeMatches(expected, result);
},
test08cEmptyString: function() {
	var src = '\'\'';
	var result = this.st2stAst(src, 'expression');
	var expected = {isLiteral: true, value: ''};
	this.assertNodeMatches(expected, result);
},
test09aParseSequence: function() {
	var src = 'x foo. x := 1+2. x + bar';
	var result = this.st2stAst(src, 'sequence');
	var expected = {
		isSequence: true,
		children: [{isUnary: true}, {isAssignment: true}, {isBinary: true}]
	};
	this.assertNodeMatches(expected, result);
},
test10aParseBlockWithoutArgs: function() {
	var src = '[1+ 3.  ]';
	var result = this.st2stAst(src, 'expression');
	var expected = { isBlock: true, sequence: {children: [{isBinary: true}]} };
	this.assertNodeMatches(expected, result);
},
test10bParseBlockWithDeclaredVariables: function() {
	var src = '[:a |  |x yz | ]';
	var result = this.st2stAst(src, 'expression');
	var expected = { declaredVars: [{name: 'x'}, {name: 'yz'}] };
	this.assertNodeMatches(expected, result);
},
test11aParseCommentsAsWithspace: function() {
	var src = ' x+ "this is a comment" yz';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isBinary: true,
		receiver: {name: 'x'},
		args: [{name: 'yz'}],
	};
	this.assertNodeMatches(expected, result);
},
test12aSmalltalkMethod: function() {
	var src = '- foo\n\
	@selector := \'xyz\'.\n\
	self.';
	var result = this.st2stAst(src, 'propertyOrMethod');
	var expected = {
		isMethod: true,
		methodName: 'foo',
		isMeta: false,
		sequence: {children: [{isAssignment: true},{isVariable: true}]}
	};
	this.assertNodeMatches(expected, result);
},
test12bBinaryMethod: function() {
	var src = '- ++ arg\n\
	self + arg.';
	var result = this.st2stAst(src, 'propertyOrMethod');
	var expected = {
		isMethod: true,
		methodName: '++',
		args: ['arg']
	};
	this.assertNodeMatches(expected, result);
},
test12cKeywordMethod: function() {
	var src = '- foo: arg1 bar:arg2\n\
	arg1 baz: arg2.';
	var result = this.st2stAst(src, 'propertyOrMethod');
	var expected = {
		isMethod: true,
		methodName: 'foo:bar:',
		args: ['arg1', 'arg2']
	};
	this.assertNodeMatches(expected, result);
},
test13aParseClass: function() {
	var src =
'<Object> \n\
- = other self foo = other.\n\
- and: aBlock\n\
	(self = true)\n\
		ifTrue: aBlock\n\
		ifFalse: [false].'
	var result = this.st2stAst(src, 'smalltalkClass');
	var expected = {
		isClass: true,
		className: {value: 'Object'},
		methods: [{methodName: '='},{methodName: 'and:'}]
	};
	this.assertNodeMatches(expected, result);
},
test13bParseClass: function() {
	var src ='<ClassA:Object>';
	var result = this.st2stAst(src, 'smalltalkClass');
	var expected = {
		isClass: true,
		className: {value: 'ClassA'},
		superclass: {name: 'Object'},
		methods: []
	};
	this.assertNodeMatches(expected, result);
},

test14aParseJsPrimitive: function() {
	var body = '{ this.bar() }';
	var src = '- foo ' + body;
	var result = this.st2stAst(src, 'propertyOrMethod');
	var expected = {
		isPrimitive: true,
		methodName: 'foo',
		primitiveBody: body
	};
	this.assertNodeMatches(expected, result);
},
test14bParseJsPrimitive: function() {
	var body = '{ (function() { 1 + 2})() }';
	var src = '- foo ' + body;
	var result = this.st2stAst(src, 'propertyOrMethod');
	var expected = {
		isPrimitive: true,
		methodName: 'foo',
		primitiveBody: body
	};
	this.assertNodeMatches(expected, result);
},
test15aCascades: function() {
	var src = 'x blupf; bla: 3';
	var result = this.st2stAst(src, 'expression');
	var expected = {
		isCascade: true,
		messages: [
			{messageName: 'blupf', receiver: {name: 'x'}},
			{messageName: 'bla:', receiver: {name: 'x'}, args: [{isLiteral: true}]},
		]
	};
	this.assertNodeMatches(expected, result);
},
test16aPropertyDefInClass: function() {
	var src = '<ClassA>\n- property1 := 1.\n+ property2 := 2.';
	var result = this.st2stAst(src, 'smalltalkClass');
	var expected = {
		isClass: true,
		properties: [
			{isMeta: false, assignment: {isAssignment: true, variable: {name: 'property1'}}},
			{isMeta: true}]
	};
	this.assertNodeMatches(expected, result);
},
test17aRecognizeReturn: function() {
	var src = '- foo\nfalse ifTrue: [^1] ifFalse: [^2].';
	var result = this.st2stAst(src, 'propertyOrMethod');
	var expected = {
		isMethod: true,
		sequence: {children: [{isKeyword: true}]}
	};
	this.assertNodeMatches(expected, result);
	var ifStmt = result.sequence.children.first();
	var return1 = ifStmt.args[0].sequence.children.first();
	var return2 = ifStmt.args[1].sequence.children.first();
	var expectedReturn1 = {isReturn: true, value: {value: 1}};
	this.assertNodeMatches(expectedReturn1, return1);
	var expectedReturn2 = {isReturn: true, value: {value: 2}};
	this.assertNodeMatches(expectedReturn2, return2);
},
test18aArrayLiteral: function() {
	var src = '#{2. 4 foo. 1+2}';
	 result = this.st2stAst(src, 'expression');
	var expected = {
		isArrayLiteral: true,
		sequence: {children: [{isLiteral: true}, {isUnary: true}, {isBinary: true}]}
	};
	this.assertNodeMatches(expected, result);
},


});

Tests.SmalltalkParserTest.ASTBaseTest.subclass('Tests.SmalltalkParserTest.StNodeToProgramStringTest', {

test01Expressions: function() {
	var originals = [
		'x foo',
		'x + 2',
		'x foo: 1 bar: x',
		'x foo: 2 + 3 + 4 foo: x foo',
		'x foo: (y bar: 1)',
		'x + (5 * 6) + (1 foo: 2)',
		'abc := 1 + 2',
		'xyz foo\n\tbar;\n\tbaz;\n\tyourself',
		'[:a :b | | x y z | 1 + 2.]',
		'\'I\'\'m here\'',
		'(x foo: 1) + @bla',
		'(x foo: 1) bla: 2',
		'(other toString: nil) + @bla',
		'#{1 + 2.3.}',
	];
	originals.forEach(function(ea) {
		var result = this.st2st(ea, 'expression');
		this.assertEquals(ea, result);
	}, this);
},

test02Sequences: function() {
	var originals = [
		'x foo.1 + 2.'
	];
	originals.forEach(function(ea) {
		var result = this.st2st(ea,'sequence');
		this.assertEquals(ea, result);
	}, this);
},

test03Class: function() {
	var src = '<ClassA:Object>\n\
\n\
- x := bla.\n\
\n\
- foo: xyz\n\
	xyz + 3.\n\
\n\
+ + foo\n\
	self ++ foo.\n\n';
	var result = this.st2st(src, 'smalltalkClass');
	this.assertEquals(src, result);
},
test04StToStResultUnequalSource: function() {
	var jsToSt = [
		['(x + 1) * 2', 'x + 1 * 2'],
	];
	jsToSt.forEach(function(stAndSt) {
		var result = this.st2st(stAndSt[0], 'expression');
		this.assertEquals(stAndSt[1], result);
	}, this);
},

});


TestCase.subclass('Tests.SmalltalkParserTest.ParseExistingSourcesTest', {
shouldRun: true,
setUp: function() {
	this.parser = SmalltalkParser;
},
parse: function(rule, src) {
	var test = this;
	var errorcb = OMetaSupport.handleErrorDebug.wrap(function() {
		dbgOn(true);
		var args = $A(arguments), proceed = args.shift();
		proceed.apply(this,args);
		test.assert(false, 'Couldn\'t parse file');
	});
	return OMetaSupport.matchAllWithGrammar(this.parser, rule, src, errorcb);
},
urls: [
	'http://clamato.net/bin/test.st',
	'http://clamato.net/examples/counter.st',
	'http://clamato.net/lib/web.st',
	'http://clamato.net/lib/browse.st',
	'http://clamato.net/lib/build.st',
	'http://clamato.net/lib/parser.st',
	'http://clamato.net/lib/peg.st',
	'http://clamato.net/lib/workspace.st'
],
testAll: function() {
	this.urls.forEach(function(url) {
		console.log('...... Parsing: ' + url);
		var content = FileDirectory.getContent(url);
		this.parse('smalltalkClasses', content);
	}, this)
},

});

// --------------------
// ----------------------------------------
// --------------------

Tests.SmalltalkParserTest.ASTBaseTest.subclass('Tests.SmalltalkParserTest.JS2StConversionTest', {
shouldRun: true,

test01aConvertTempVarGet: function() {
	var src = 'tempVar';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isVariable: true,
		name: 'tempVar'
	};
	this.assertNodeMatches(expected, result);
},
test01bConvertInstVarGet: function() {
	var src = 'this.instVar';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isVariable: true,
		isInstance: true,
		name: '@instVar'
	};
	this.assertNodeMatches(expected, result);
},
test01cGetSelfInstVarWithExpression: function() {
	var src = 'this[instVar]';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isMessage: true,
		isKeyword: true,
		messageName: 'getVar:',
		receiver: {name: 'self'},
		args: [{name: 'instVar'}],
	};
	this.assertNodeMatches(expected, result);
},
test01dGetSelfInstVarWithExpression: function() {
	var src = 'this["instVar"]';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isVariable: true,
		isInstance: true,
		name: '@instVar'
	};
	this.assertNodeMatches(expected, result);
},

test01eGetSelfInstVarWithExpression: function() {
	var src = 'x.instVar';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isMessage: true,
		isKeyword: true,
		messageName: 'getVar:',
		receiver: {name: 'x'},
		args: [{value: 'instVar'}],
	};
	this.assertNodeMatches(expected, result);
},

test01fConvertInstVarGet: function() {
	var src = 'x["instVar"]';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isMessage: true,
		isKeyword: true,
		messageName: 'getVar:',
		receiver: {name: 'x'},
		args: [{value: 'instVar'}],
	};
	this.assertNodeMatches(expected, result);
},


test02aConvertMutliArgExpression: function() {
	var src = 'foo.bar()';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isKeyword: true,
		messageName: 'bar:',
		receiver: {isVariable: true, name: 'foo'},
		args: []
	};
	this.assertNodeMatches(expected, result);
},
test02bConvertBinaryExpression: function() {
	var src = 'a + 4';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isBinary: true,
		messageName: '+',
		receiver: {isVariable: true, name: 'a'},
		args: [{isLiteral: true, value: 4}]
	};
	this.assertNodeMatches(expected, result);
},

test02cConvertMutliArgExpression: function() {
	var src = 'foo.bar(1, baz)';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isKeyword: true,
		messageName: 'bar:',
		receiver: {isVariable: true, name: 'foo'},
		args: [{isLiteral: true}, {isVariable: true}]
	};
	this.assertNodeMatches(expected, result);
},
test03aParseSimpleMethod: function() {
	// {foo: function() {}}
	var ast = ["binding", "foo", ["func", [], ["begin"]]];
	var result = this.jsAst2StAst(ast);
	var expected = {
		isMethod: true,
		methodName: 'foo:',
		args: [],
		sequence: {children: []}
	};
	this.assertNodeMatches(expected, result);
},
test03bParseSimpleMethodWithArgs: function() {
	// {foo: function(a, b) {}}
	var ast = ["binding", "foo", ["func", ["a", "b"], ["begin"]]];
	var result = this.jsAst2StAst(ast);
	var expected = {
		isMethod: true,
		methodName: 'foo:',
		args: ['a', 'b'],
		sequence: {children: []}
	};
	this.assertNodeMatches(expected, result);
},
test04aParseFunctionWithStatements: function() {
	var src = 'function() { 3 + 4; 4 + 7 }';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isBlock: true,
		sequence: {children: [
			{messageName: '+', receiver: {value: 3}, args: [{value: 4}]},
			{isMessage: true}]}
	};
	this.assertNodeMatches(expected, result);
},
test05aReturnStmtsInMethod: function() {
	var src = '{x: function() { return 2 + 3 }}';
	var result = this.js2StAst(src, 'expr');
	var expected = [{
		isMethod: true,
		sequence: {children: [{isReturn: true}]}
	}];
	this.assertNodeMatches(expected, result);
},
test06aIfStmt: function() {
	var src = 'if (1) { 1 } else { 2 }';
	var result = this.js2StAst(src, 'stmt');
	var expected = {
		isKeyword: true,
		messageName: 'ifTrue:ifFalse:',
		receiver: {value: 1},
		args: [{isBlock: true, sequence: {children: [{value: 1}]}},
					{isBlock: true, sequence: {children: [{value: 2}]}}]
		};
	this.assertNodeMatches(expected, result);
},



testXXaConvertClassWithMethod: function() {
	var src = 'Object.subclass(\'Foo\')';
	var result = this.js2StAst(src, 'expr');
	var expected = {isClass: true, className: {value: 'Foo'}};
	this.assertNodeMatches(expected, result);
},

testXXbConvertClassWithMethod: function() {
	var src = 'Object.subclass(\'Foo\', {\n x: function(a) { 1 },\ny: function() {}})';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isClass: true,
		methods: [{methodName: 'x:', args: ['a']}, {methodName: 'y:'}]};
	this.assertNodeMatches(expected, result);
},
testXXcConvertClassWithPropertiesAndMethod: function() {
	var src = 'Object.subclass(\'Foo\', {\n x: 2,\ny: \'foo\', z: function() { 1 }})';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isClass: true,
		methods: [{methodName: 'z:', args: []}],
		properties: [{variable: {name: 'x'}, value: {value: 2}}, {isAssignment: true}]
	};
	this.assertNodeMatches(expected, result);
},

testXYaConvertMethodWichCannotBeParsedToPrimitive: function() {
	 body = '{for(var i=(0);(i < (10));i++){continue}}';
	var src = 'Object.subclass(\'Foo\', { x: function(a , b) ' + body + '})';
	var result = this.js2StAst(src, 'expr');
	var expected = {
		isClass: true,
		methods: [{
			methodName: 'x',
			isPrimitive: true,
			primitiveBody: body,
			args: ['a', 'b']
		}]
	};
	this.assertNodeMatches(expected, result);
},

});

Tests.SmalltalkParserTest.ASTBaseTest.subclass('Tests.SmalltalkParserTest.St2JSConversionTest', {
shouldRun: true,
colonReplacement: '',

test01aConvertTempVarGet: function() {
	var src = 'tempVar';
	var result = this.st2js(src, 'expression');
	var expected = src;
	this.assertEquals(expected, result);
},
test02aConvertInstVar: function() {
	var src = '@instVar';
	result = this.st2js(src, 'expression');
	var expected = 'this.instVar';
	this.assertEquals(expected, result);
},
test03aConvertLiteralString: function() {
	var src = "'foo''bar'";
	var result = this.st2js(src, 'expression');
	var expected = "'foo\'bar'";
	this.assertEquals(expected, result);
},


test03bArrayLiteral: function() {
	var src = '#{1+ 2. y. 3}';
	var result = this.st2js(src, 'expression');
	var expected = '[1 + 2,y,3]';
	this.assertEquals(expected, result);
},
test03cNumberLiteral: function() {
	var src = '1 + 0.1';
	var result = this.st2js(src, 'expression');
	var expected = '1 + 0.1';
	this.assertEquals(expected, result);
},




test04aConvertAssignment: function() {
	var src = 'x := 1';
	var result = this.st2js(src, 'expression');
	var expected = 'x = 1';
	this.assertEquals(expected, result);
},
test05aConvertCascade: function() {
	var src = 'x foo; bar: 2';
	var result = this.st2js(src, 'expression');
	var expected = 'x.foo();\nx.bar_(2);\n'.replace(/_/g, this.colonReplacement);
	this.assertEquals(expected, result);
},
test05bReturnCascade: function() {
	var src = '[x foo; bar]';
	var result = this.st2js(src, 'expression');
	var expected = '(function() { x.foo();\nreturn x.bar();\n })';
	this.assertEquals(expected, result);
},

test05bConvertCascadeWithNonPrimitiveRecevier: function() {
	var src = '(1+ 2) foo; bar: 2';
	var result = this.st2js(src, 'expression');
	var expected = 'var cascadeHelper = 1 + 2;\ncascadeHelper.foo();\ncascadeHelper.bar_(2);\n'.replace(/_/g, this.colonReplacement);
	this.assertEquals(expected, result);
},

test06aConvertBinary: function() {
	var src = 'x foo';
	var result = this.st2js(src, 'expression');
	var expected = 'x.foo()';
	this.assertEquals(expected, result);
},
test06bConvertBinary: function() {
	var src = 'x + 3';
	var result = this.st2js(src, 'expression');
	var expected = 'x + 3';
	this.assertEquals(expected, result);
},
test06cConvertKeyword: function() {
	var src = 'x foo: 1 bar: y';
	var result = this.st2js(src, 'expression');
	var expected = 'x.foo_bar_(1,y)'.replace(/_/g, this.colonReplacement);;
	this.assertEquals(expected, result);
},
test07aChainedBinary: function() {
	var src = 'x + 3 * 4';
	var result = this.st2js(src, 'expression');
	var expected = '(x + 3) * 4';
	this.assertEquals(expected, result);
},
test07bChainedUnaries: function() {
	var src = 'x foo bar';
	var result = this.st2js(src, 'expression');
	var expected = 'x.foo().bar()';
	this.assertEquals(expected, result);
},
test07cChainedUnaryAndBinary: function() {
	var src = 'x foo + x bar';
	var result = this.st2js(src, 'expression');
	var expected = 'x.foo() + x.bar()';
	this.assertEquals(expected, result);
},
test07dChainedKeyword: function() {
	var src = '(x foo: 123 bar: y) baz: 2';
	var result = this.st2js(src, 'expression');
	var expected = 'x.foo_bar_(123,y).baz_(2)'.replace(/_/g, this.colonReplacement);;
	this.assertEquals(expected, result);
},
test07eChainedBinaryAndKeyword: function() {
	var src = '1 + x foo: y';
	var result = this.st2js(src, 'expression');
	var expected = '(1 + x).foo_(y)'.replace(/_/g, this.colonReplacement);;
	this.assertEquals(expected, result);
},
test07fChainedBinaryAndKeyword2: function() {
	var src = 'x foo: y + 2';
	var result = this.st2js(src, 'expression');
	var expected = 'x.foo_(y + 2)'.replace(/_/g, this.colonReplacement);;
	this.assertEquals(expected, result);
},
test08aSequence: function() {
	var src = '1 + 2. 3+4';
	var result = this.st2js(src, 'sequence');
	var expected = '1 + 2;3 + 4';
	this.assertEquals(expected, result);
},

test10aBlock: function() {
	var src = '[:a :b | | c d | 1 + 2]';
	var result = this.st2js(src, 'expression');
	var expected = '(function(a,b) { var c,d; return 1 + 2 })';
	this.assertEquals(expected, result);
},
test11aSmalltalkMethod: function() {
	var src = '- foo\n\
	@selector := \'xyz\'.\n\
	self.';
	var result = this.st2js(src, 'propertyOrMethod');
	var expected = 'foo: function() { this.selector = \'xyz\'; return self },';
	this.assertEquals(expected, result);
},
test11bProperty: function() {
	var src = '- property1 := 1.';
	var result = this.st2js(src, 'propertyOrMethod');
	var expected = 'property1: 1,';
	this.assertEquals(expected, result);
},
test11cPrimtiveMethod: function() {
	var body = '{ body; 1+2; }';
	var src = '- foo ' + body;
	var result = this.st2js(src, 'propertyOrMethod');
	var expected = 'foo: function() ' + body + ',';
	this.assertEquals(expected, result);
},
test12aClassWithOneMethod:  function () {
	var src = '<MyClass>\n- foo: x bar: y\n\t1 + 2. self foo: x + y.'
	var result = this.st2js(src, 'smalltalkClass');
	var expected = 'Object.subclass(\'MyClass\', {\nfoo_bar_: function(x,y) { 1 + 2; return self.foo_(x + y) },\n});\n'.replace(/_/g, this.colonReplacement);;
	this.assertEquals(expected, result);
},
test12bSubclass:  function () {
	var src = '<MyClass:Foo>'
	var result = this.st2js(src, 'smalltalkClass');
	var expected = 'Foo.subclass(\'MyClass\', {});\n';
	this.assertEquals(expected, result);
},
test12cClassPropertiesAndMethod: function() {
	var src = '<MyClass>\n- foo 1.\n- bar := 4.'
	var result = this.st2js(src, 'smalltalkClass');
	var expected = 'Object.subclass(\'MyClass\', {\nbar: 4,\nfoo: function() { return 1 },\n});\n';
	this.assertEquals(expected, result);
},
test12dMetaClass: function() {
	var src = '<MyClass>\n- foo 1.\n+ foo 23 * 5.\n+ bar := 4.'
	var result = this.st2js(src, 'smalltalkClass');
	var expected = 'Object.subclass(\'MyClass\', {\nfoo: function() { return 1 },\n});\nObject.extend(MyClass, {\nbar: 4,\nfoo: function() { return 23 * 5 },\n});\n';
	this.assertEquals(expected, result);
},

testXXaResultOfCollect: function() {
	var src = 'arr collect: [:ea | ea asString + 29]';
	var result = this.st2js(src, 'expression');
	var expected = 'arr.collect_((function(ea) { return ea.asString() + 29 }))'.replace(/_/g, this.colonReplacement);
	this.assertEquals(expected, result);
},
testXXbJsParserCanConsumeComplexExample: function() {
	var src = '<Class:Foo>\n-foo 1.\n- bar := 4.\n+foo: y\n\t| x | x := 1 + y. x.\n\n<SecondClass>\n- foo: x bar:y x + y';
	var js = this.st2js(src, 'smalltalkClasses');
	this.assert(this.js2jsAst(js)); // just try to parse it 
},

});

TestCase.subclass('Tests.SmalltalkParserTest.SmalltalkBrowserTest', {
/*
StFileNode(foo.st, 2 classes):0-302
Class(Literal(Object)):0-115
Method(toString(none)):31-64
Method(+(other)):67-112
Property(myProperty):10-28
Class(Literal(ClassA)):116-302
Method(helloWorld(none)):133-250
Method(printSomething(none)):253-302
*/
  dummySource: '<Object>\n\
\n\
- myProperty := \'\'.\n\
\n\
- toString\n\
    \'Some wild object\'.\n\
\n\
- + other\n\
    self toString + other to String.\n\
\n\
\n\
<ClassA:Object>\n\
\n\
- helloWorld\n\
    | string |\n\
    string := \'I\'\'m an object\'.\n\
    string := string + \'A smalltalky object!\'.\n\
    string.\n\
\n\
- printSomething\n\
    console log: self helloWorld.',
    
	setUp: function($super) {
		$super();
		var src = this.dummySource;
		this.db = new AnotherSourceDatabase();
		this.root = this.db.prepareForMockModule('foo.st', src);
		// we don't want to see alert
		// this.oldAlert = WorldMorph.prototype.alert;
		// WorldMorph.prototype.alert = Functions.Null;    
	},

	tearDown: function($super) {
		$super();
		// WorldMorph.prototype.alert = this.oldAlert;
	},

	fragmentDetect: function(block) {
		return this.root.flattened().detect(function(ea) { return block(ea) });
	},
	
	printAllIndexes: function() {
		this.root.flattened().forEach(function(ea) {
			console.log(ea.toString() + ':' + ea.startIndex + '-' + ea.stopIndex);
		})
	},

  test01ChangeMethod: function() {
    var node = this.fragmentDetect(function(ea) { return ea.methodName == 'toString'});
	var newSource = '- toString\n    \'Some object\'.';
    node.putSourceCode(newSource);
    this.assertEquals(node.startIndex, 31);
    this.assertEquals(node.stopIndex, 64-5);
	node = this.fragmentDetect(function(ea) { return ea.methodName == '+'});
    this.assertEquals(node.startIndex, 67-5);
    this.assertEquals(node.stopIndex, 112-5);
	node = this.fragmentDetect(function(ea) { return ea.className && ea.className.value == 'Object'});
	this.assertEquals(node.startIndex, 0);
	this.assertEquals(node.stopIndex, 115-5);
	node = this.fragmentDetect(function(ea) { return ea.className && ea.className.value == 'ClassA'});
	this.assertEquals(node.startIndex, 116-5);
	this.assertEquals(node.stopIndex, 302-5);
  },

test02ChangeClass: function() {
	var node = this.fragmentDetect(function(ea) { return ea.className && ea.className.value == 'Object'});
	var newSource = '<Object>\n\n- myProperty := \'\'.\n\n- toString\n    \'Some object\'.\n\n- + other\n    self toString + other to String.\n\n\n'; // same change as in test 1
    node.putSourceCode(newSource);
	this.assertEquals(node.startIndex, 0);
	this.assertEquals(node.stopIndex, 115-5);
	node = this.fragmentDetect(function(ea) { return ea.methodName == 'toString'});
    this.assertEquals(node.startIndex, 31);
    this.assertEquals(node.stopIndex, 64-5);
	node = this.fragmentDetect(function(ea) { return ea.methodName == '+'});
    this.assertEquals(node.startIndex, 67-5);
    this.assertEquals(node.stopIndex, 112-5);
	node = this.fragmentDetect(function(ea) { return ea.className && ea.className.value == 'ClassA'});
	this.assertEquals(node.startIndex, 116-5);
	this.assertEquals(node.stopIndex, 302-5);
  },

});
});