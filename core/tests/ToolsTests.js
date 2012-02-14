module('tests.ToolsTests').requires('lively.TestFramework', 'lively.Tools', 'lively.ide', 'tests.SerializationTests', 'lively.ide.AutoCompletion').toRun(function() {

Object.extend(tests.ToolsTests, {
	createDummyNamespace: function() {
		console.assert(!tests.ToolsTests['testNS'], 'testNS already existing');
		// creating 5 namespaces-    namespace('testNS.one', tests.ToolsTests);    namespace('testNS.two', tests.ToolsTests);
		namespace('testNS.three.threeOne', tests.ToolsTests);
		// create classes
		Object.subclass(tests.ToolsTests.namespaceIdentifier + '.testNS.Dummy', { method1: function() { 1 } });
		Object.subclass(tests.ToolsTests.namespaceIdentifier + '.testNS.one.Dummy');
		Object.subclass(tests.ToolsTests.namespaceIdentifier + '.testNS.three.threeOne.Dummy');
		// create functions
		tests.ToolsTests.testNS.dummyFunc = function() { return 1 };
		tests.ToolsTests.testNS.three.threeOne.dummyFunc = function() { return 2 };
	},
	removeDummyNamespace: function() { delete tests.ToolsTests['testNS']  },
});


// Browser related tests
TestCase.subclass('tests.ToolsTests.SystemBrowserTests', {

	setUp: function() {
		var browser = this.createBrowser();
		var root = this.createMockNode(browser);
		browser.rootNode = function() { return root };
		this.browser = browser;
	},

	createBrowser: function() {
		return new lively.ide.BasicBrowser();
	},

	mockNodeClass: lively.ide.BrowserNode.subclass('tests.ToolsTests.MockNode', {
			initialize: function($super, target, browser, c) { $super(target, browser); this.children = c || [] },
			childNodes: function() { return this.children; }
		}),
		
	createMockNode: function(browser, children, target, name) {
		var node = new this.mockNodeClass(target, browser, children);
		if (name)
			node.asString = function() { return name}
		return node;
	},

	testSelectNodeInFirstPane: function() {
		lively.ide.startSourceControl();
		var browser = this.browser;
		var node1 = this.createMockNode(browser);
		var node2 = this.createMockNode(browser);
		browser.rootNode().children = [node1, node2];
		browser.buildView();
		this.assertEquals(browser.nodesInPane('Pane1').length, 2);
		browser.selectNode(node1);
		this.assertIdentity(node1, browser.selectedNode());
	},

	testFilterChildNodes: function() {
		var browser = this.browser;
		var node1 = this.createMockNode(browser);
		var node2 = this.createMockNode(browser);
		node1.shouldAppear = true; node2.shouldAppear = false;
		browser.rootNode().children = [node1, node2];
		var testFilterClass = lively.ide.NodeFilter.subclass('tests.ToolsTest.TestFilter', {
			apply: function(nodes) { return nodes.select(function(ea) {return ea.shouldAppear}) }
		});
		var result = browser.filterChildNodesOf(browser.rootNode(), [new testFilterClass()]);
		this.assertEquals(result.length, 1);
		this.assertIdentity(result[0], node1);
	},

	testUninstallFilter: function() {
		var browser = this.browser;
		browser.installFilter(new lively.ide.NodeFilter(), 'Pane1');
		this.assert(browser.getPane1Filters().length > 0);
		browser.uninstallFilters(function(filter) { return filter instanceof lively.ide.NodeFilter }, 'Pane1')
		this.assertEquals(browser.getPane1Filters().length, 0);
	},

	testSortFilter: function() {
		var filter = new lively.ide.SortFilter();
		var n1 = this.createMockNode(null, null, null, 'c');
		var n2 = this.createMockNode(null, null, null, 'a');
		var n3 = this.createMockNode(null, null, null, 'b');
		var result = filter.apply([n1, n2, n3]);
		this.assertEquals(result.length, 3);
		this.assertIdentity(result[0], n2);
		this.assertIdentity(result[1], n3);
		this.assertIdentity(result[2], n1);
	},
testBrowserFourthPane: function() {
	var browser = this.browser;

	var n4 = this.createMockNode(browser, [], null, 'd');
	var n3 = this.createMockNode(browser, [n4], null, 'c');
	var n2 = this.createMockNode(browser, [n3], null, 'b');
	var n1 = this.createMockNode(browser, [n2], null, 'a');
	
	browser.rootNode().children = [n1];

	var m = browser.buildView();
	
	browser.selectNode(n1);
	browser.selectNode(n2);
	browser.selectNode(n3);

	// m.openInWorld()

	this.assertEquals(browser.nodesInPane('Pane4').length, 1);	
	this.assertIdentity(n4, browser.nodesInPane('Pane4')[0]);
},
    newMethod: function() {
        // enter comment here
    },





});
tests.ToolsTests.SystemBrowserTests.subclass('tests.ToolsTests.BrowserNodeTest',
'running', {
	createBrowser: function() {
		// FIXME
		return new lively.ide.SystemBrowser();
	},

	buildTestSource: function() {
		// create and parse the source into filefragments
		var src = "\n\Object.subclass('Foo',\n\
'catA', {\n\
	m1: function() { return 23 },\n\
	m2: function() {},\n\
},\n\
'catB', {\n\
	m3: function() { return 42},\n\
});\n\
\n\
Foo.addMethods('catC',{\n\
	m4: function() {},\n\
});"

		this.db = new AnotherSourceDatabase();
		var rootFragment = this.db.prepareForMockModule('dummySource.js', src);

		this.klassDef = rootFragment.subElements()[1]
		this.m1 = this.klassDef.subElements()[0];
		this.m2 = this.klassDef.subElements()[1];
		this.m3 = this.klassDef.subElements()[2];
		this.klassExtensionDef = rootFragment.subElements()[3]
		this.m4 = this.klassExtensionDef.subElements()[0];

		this.fileFragment = rootFragment;

		// setup browser
		var completeFFNode = new lively.ide.CompleteFileFragmentNode(
			this.fileFragment, this.browser, null, this.fileFragment.name)
		var root = this.createMockNode(this.browser, [completeFFNode]);
		this.browser.rootNode =  function() { return root };
	},
	buildCopTestSource: function() {
		// create and parse the source into filefragments
		var src = "cop.create(\"testLayer\")"

		this.db = new AnotherSourceDatabase();
		var rootFragment = this.db.prepareForMockModule('dummyCopSource.js', src);

		this.fileFragment = rootFragment;

		// setup browser
		var completeFFNode = new lively.ide.CompleteFileFragmentNode(
			this.fileFragment, this.browser, null, this.fileFragment.name)
		var root = this.createMockNode(this.browser, [completeFFNode]);

		this.copNode = completeFFNode.childNodes()[0];

		this.browser.rootNode =  function() { return root };
	},



},
'testing', {

	testCopFragmentWholeLayerEvaluate: function() {
		this.browser.buildView();
		this.buildCopTestSource();
		var node = this.copNode;
		var klass = Object.subclass('CopBrowserNodeDummy');
		var src = 'cop.create("testLayer").refineClass(CopBrowserNodeDummy, { m: function() { return 23 } });'
		node.newSource(src);
		withLayers([testLayer], function() {
			this.assertEquals(23, new klass().m());
		}.bind(this))		
	},
	testCopFragmentPartialClassEvaluate: function() {
		this.browser.buildView();
		this.buildCopTestSource();
		var node = this.copNode;
		var klass = Object.subclass('CopBrowserNodeDummy');
		var src = 'cop.create("testLayer").refineClass(CopBrowserNodeDummy, { m: function() { return 23 } });'
		node.newSource(src);
		this.assertEquals(1, node.childNodes().length);
		var klassNode = node.childNodes()[0];
		klassNode.newSource('.refineClass(CopBrowserNodeDummy, { m: function() { return 42 } })')
		withLayers([testLayer], function() {
			this.assertEquals(42, new klass().m(), 'klass not did not evaluate');
		}.bind(this))		
	},
	testCopFragmentMethodEvaluate: function() {
		this.browser.buildView();
		this.buildCopTestSource();
		var node = this.copNode;
		var klass = Object.subclass('CopBrowserNodeDummy');
		var src = 'cop.create("testLayer").refineClass(CopBrowserNodeDummy, {\nm: function() { return 23 }\n});'
		node.newSource(src);
		var methodNode = node.childNodes()[0].childNodes()[0];
		methodNode.newSource('m: function() { return 42 }')
		withLayers([testLayer], function() {
			this.assertEquals(42, new klass().m(), 'method not did not evaluate');
		}.bind(this))		
	},



	testCreateCategoriesFromClassDef: function() {
		this.buildTestSource();
		var browser = this.browser;
		
		var completeFFNode = browser.rootNode().childNodes().first();
		this.assertEquals(2, completeFFNode.childNodes().length);
		var classNode = completeFFNode.childNodes().first();

		this.assertEquals(3, classNode.childNodes().length);
		this.assertEquals('-- all --', classNode.childNodes()[0].getName());
		this.assertEquals('catA', classNode.childNodes()[1].getName());
		this.assertEquals('catB', classNode.childNodes()[2].getName());

		this.assertEquals(3, classNode.childNodes()[0].childNodes().length);
		this.assertEquals(2, classNode.childNodes()[1].childNodes().length);
		this.assertEquals(1, classNode.childNodes()[2].childNodes().length);
		
		var methodNodes = classNode.childNodes()[1].childNodes()
		this.assertEquals('m1', methodNodes[0].getName());
		this.assertEquals('m2', methodNodes[1].getName());

	},
	testCreateCategoriesFromAddMethodDef: function() {
		this.buildTestSource();
		var browser = this.browser;
		// browser.buildView()

		var completeFFNode = browser.rootNode().childNodes().first();
		this.assertEquals(2, completeFFNode.childNodes().length);
		var addMethodNode = completeFFNode.childNodes()[1];

		this.assertEquals(2, addMethodNode.childNodes().length);
		this.assertEquals('-- all --', addMethodNode.childNodes()[0].getName());
		this.assertEquals('catC', addMethodNode.childNodes()[1].getName());

		// category childs
		this.assertEquals(1, addMethodNode.childNodes()[0].childNodes().length);
		this.assertEquals(1, addMethodNode.childNodes()[1].childNodes().length);
		
		var methodNodes = addMethodNode.childNodes()[1].childNodes()
		this.assertEquals('m4', methodNodes[0].getName());

	},


	testAddClassCommand: function() {
		this.buildTestSource();
		var browser = this.browser;
		browser.buildView()

		browser.inPaneSelectNodeNamed('Pane1', 'dummySource.js');
		var commands = browser.commandMenuSpec('Pane2'),
			commandSpec = commands.detect(function(spec) { return spec[0] == 'add class' });
		this.assert(commandSpec && Object.isFunction(commandSpec[1]), 'Cannot find add class command');

		var className = 'MyClass';
		this.answerPromptsDuring(commandSpec[1]);

		var newClassFragment = this.fileFragment.subElements().detect(function(ff) {
			return ff.getName() == className;
		});

		this.assert(newClassFragment, 'new class not created');
		this.assert(newClassFragment.getSourceCode().startsWith('Object.subclass(\'' + className + '\','),
			'source code of new class is strange');

		// var newNode = browser.selectedNode();
		// this.assertEquals(newClassFragment, newNode.target, 'browser hasn\'t selected the new class');
	},

	testAddMethodCommand: function() {
		this.buildTestSource();
		var browser = this.browser;
		browser.buildView()

		browser.inPaneSelectNodeNamed('Pane1', 'dummySource.js');
		browser.inPaneSelectNodeNamed('Pane2', 'Foo');
		var commands = browser.commandMenuSpec('Pane4');
		var commandSpec = commands.detect(function(spec) { return spec[0] == 'add method' });
		this.assert(commandSpec && Object.isFunction(commandSpec[1]), 'Cannot find add method command');

		var methodName = 'newMethod';
		this.answerPromptsDuring(commandSpec[1]);

		var newMethodFragment = this.fileFragment.flattened().detect(function(ff) {
			return ff.getName() == methodName;
		});

		this.assert(newMethodFragment, 'new class not created');
		this.assert(newMethodFragment.getSourceCode().startsWith(methodName + ': function() {'),
			'source code of new method is strange');

		// var newNode = browser.selectedNode();
		// this.assertEquals(newMethodFragment, newNode.target, 'browser hasn\'t selected the new method');
	},


	testBrowseIt: function() {
		this.buildTestSource();
		var browser = this.browser;
		browser.buildView()

		this.m1.basicBrowseIt(browser)	

		this.assertEquals(browser.nodesInPane('Pane4').length, 3);	
		this.assertIdentity(this.m1, browser.nodesInPane('Pane4')[0].target);
	},
	testBrowserKnowsCurrentModule: function() {
		if (Global.Foo) Foo.remove();
		this.buildTestSource();
		this.browser.buildView()
		this.browser.selectNodeNamed('dummySource.js');
		this.browser.selectNodeNamed('Foo');
		var n  = this.browser.selectedNode();
		n.evalSource(n.sourceString());
		this.assert(Global.Foo, 'Class Foo could not be evaled');
		this.assertIdentity(Foo.sourceModule, module('dummySource'));
	},




});

TestCase.subclass('tests.ToolsTests.FileParserTest', {

    setUp: function() {
	this.sut = new FileParser();
	this.sut.verbose = false;
    },
    
    testParseClassDef: function() {
	var source = "Object.subclass('Test', {});"
	this.sut.parseFile('1', 0, source, null/*db*/, 'scan', null/*search_str*/)
	this.assertEquals(this.sut.changeList.length, 1);
	this.assertEquals(this.sut.changeList.first().name, 'Test');
	this.assertEquals(this.sut.changeList.first().type, 'classDef');
    },
    
    testScanModuleDef: function() {
	var source = "module('bla.blupf').requires('blupf.bla').toRun({\nObject.subclass('Test', {\n});\n\n});"
	this.sut.parseFile('2', 0, source, null/*db*/, 'scan', null/*search_str*/)
	this.assertEquals(this.sut.changeList.length, 2);
	this.assertEquals(this.sut.changeList[0].type, 'moduleDef');
    },
    
    testScanFunctionDef01: function() {
	var source = "module('bla.blupf').requires('blupf.bla').toRun({\nfunction abc(a,b,c) {\n return 1+2;\n};\nObject.subclass('Test', {\n});\n\n});"
	this.sut.parseFile('3', 0, source, null/*db*/, 'scan', null/*search_str*/)
	this.assertEquals(this.sut.changeList.length, 3);
	this.assertEquals(this.sut.changeList[1].type, 'functionDef');
    },
    
    testScanFunctionDef02: function() {
        var source = "module('bla.blupf').requires('blupf.bla').toRun({\nvar abc = function(a,b,c) {\n return 1+2;\n};\nObject.subclass('Test', {\n});\n\n});"
        this.sut.parseFile('4', 0, source, null/*db*/, 'scan', null/*search_str*/)
        this.assertEquals(this.sut.changeList.length, 3);
        this.assertEquals(this.sut.changeList[1].type, 'functionDef');
    },
    
    testScanFunctionDefInDB: function() {
        var source = "function abc(a,b,c) {\n return 1+2;\n};"
        var db = new SourceDatabase();
        this.sut.parseFile('5', 0, source, db, 'import', null/*search_str*/)
        this.assertEquals(this.sut.changeList.length, 1);
        this.assertEquals(this.sut.changeList[0].type, 'functionDef');
    }
    
});

TestCase.subclass('tests.ToolsTests.JsParserTest', {
    
    setUp: function() {
        this.sut = new JsParser();
    },
    
    assertSubDescriptorsAreValid: function(descr) {
        for (var i = 0; i < descr.length; i++) {
            if (descr[i].subElements()) this.assertSubDescriptorsAreValid(descr[i].subElements());
            if (!descr[i+1]) continue;
            console.log(descr[i].name + ':' + descr[i].startIndex + '-' + descr[i].stopIndex + '<->' + descr[i+1].name + ':' + descr[i+1].startIndex + '-' + descr[i+1].stopIndex);
            this.assert(descr[i].stopIndex < descr[i+1].startIndex,
                'descrs conflict: ' + descr[i].type + ' ' + descr[i].name + ' <----> ' + descr[i+1].type + ' ' + descr[i+1].name);
            
        }        
    },
    
    assertDescriptorsAreValid: function(descr) {
        for (var i = 0; i < descr.length; i++) {
            if (descr[i].subElements()) this.assertSubDescriptorsAreValid(descr[i].subElements());
            if (!descr[i+1]) continue;
            console.log(descr[i].name + ':' + descr[i].startIndex + '-' + descr[i].stopIndex + '<->' + descr[i+1].name + ':' + descr[i+1].startIndex + '-' + descr[i+1].stopIndex);
            this.assertEquals(descr[i].stopIndex, descr[i+1].startIndex - 1,
                'descrs conflict: ' + descr[i].type + ' ' + descr[i].name + ' <----> ' + descr[i+1].type + ' ' + descr[i+1].name);
        }
    },

	srcFromLinesOfFile: function(fileName, startLine, endLine) {
		// for testing parsing parts of files
		// returns a substring of the file begining with first character if startLine and last Character of endLine
		// var db = lively.ide.startSourceControl();
		var src = new WebResource(URL.codeBase.withFilename('lively/' + fileName)).get().content
        // var src = db.getCachedText(fileName);
		var lines = src.split('\n');
		endLine = Math.min(endLine, lines.length-1);
		// get the ptrs
		var start = JsParser.prototype.ptrOfLine(lines, startLine);
		var end = JsParser.prototype.ptrOfLine(lines, endLine) + lines[endLine-1].length-1;
		return src.slice(start, end);
	}
});

tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.JsParserTest1', {
    
    testParseClass: function() {    // Object.subclass
        var src = 'Object.subclass(\'Dummy\', {\n' +
                  '\tsetUp: function() { tests.ToolsTests.createDummyNamespace() },\n' +
                  '\ttearDown: function() { tests.ToolsTests.removeDummyNamespace() }\n' +
                  '})';
        this.sut.src = src;
        var descriptor = this.sut.parseClass();
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'Dummy');
        this.assertEquals(descriptor.superclassName, 'Object');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
        this.assertDescriptorsAreValid([descriptor]);
    },
    
    testParseClassWithTrait: function() {   // Object.subclass
        var src = 'lively.xyz.ABC.TheClass.subclass(\'CodeMarkupParser\', ViewTrait, {\n' +
            'formals: ["CodeDocument", "CodeText", "URL"],\n\n' +
            'initialize: function(url) {\n\n}\n\n});'
        this.sut.src = src;
        var descriptor = this.sut.parseClass();
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'CodeMarkupParser');
        this.assertEquals(descriptor.superclassName, 'lively.xyz.ABC.TheClass');
        this.assertEquals(descriptor.traits[0], 'ViewTrait');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
        this.assertEquals(descriptor.subElements().length, 2);
        this.assertDescriptorsAreValid([descriptor]);
    },
    testParseClassWithRealTrait: function() {   // Object.subclass
        var src = 'lively.xyz.ABC.TheClass.subclass(\'SomeClass\', Trait(\'SomeTrait\'), {});'
        this.sut.src = src;
        var descriptor = this.sut.parseClass();
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'SomeClass');
        this.assertEquals(descriptor.superclassName, 'lively.xyz.ABC.TheClass');
        this.assertEquals(descriptor.traits[0], 'SomeTrait');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
        this.assertDescriptorsAreValid([descriptor]);
    },
    testParseClassWithRealTrait2: function() {   // Object.subclass
        var src = 'lively.xyz.ABC.TheClass.subclass(\'SomeClass\', Trait(\'SomeTrait\'));'
        this.sut.src = src;
        var descriptor = this.sut.parseClass();
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'SomeClass');
        this.assertEquals(descriptor.superclassName, 'lively.xyz.ABC.TheClass');
        this.assertEquals(descriptor.traits[0], 'SomeTrait');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
        this.assertDescriptorsAreValid([descriptor]);
    },


testParseEmptyClass: function() {   // Object.subclass
        var src = 'Object.subclass(\'Foo\',  {\n\n\n});'
        this.sut.src = src;
        var descriptor = this.sut.parseClass();
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'Foo');
        this.assertEquals(descriptor.superclassName, 'Object');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
        this.assertEquals(descriptor.subElements().length, 0);
        this.assertDescriptorsAreValid([descriptor]);
    },

    
    testParseSimpleSubclassing: function() {
        var src = 'Wrapper.subclass(\'lively.scene.Node\');';
        this.sut.src = src;
        var descriptor = this.sut.parseClass();
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'lively.scene.Node');
        this.assertEquals(descriptor.superclassName, 'Wrapper');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
        this.assertEquals(descriptor.subElements().length, 0);
    },
    
    testParseClassAndMethods: function() {  // Object.subclass
        var src = 'Object.subclass(\'Dummy\', {\n' +
                  '\tsetUp: function() { tests.ToolsTests.createDummyNamespace() },\n' +
                  'formals: ["Pane1Content",\n\t\t"Pane1Selection"],\n' +
                  '\ttearDown: function() { tests.ToolsTests.removeDummyNamespace() }\n' +
                  '})';
        this.sut.src = src;
        var descriptor = this.sut.parseClass();
        this.assert(descriptor, 'no descriptor');
        
        var dscr = descriptor.subElements();
        this.assertEquals(dscr.length, 3);
        this.assertEquals(dscr[0].name, 'setUp');
        this.assertIdentity(dscr[0].startIndex, src.indexOf('\tsetUp'));
        this.assertIdentity(dscr[0].stopIndex, src.indexOf(',\nformals'));
        this.assertEquals(dscr[1].name, 'formals');
        this.assertIdentity(dscr[1].startIndex, src.indexOf('formals:'));
        this.assertIdentity(dscr[1].stopIndex, src.indexOf(',\n\ttearDown'));
        this.assertEquals(dscr[2].name, 'tearDown');
        this.assertIdentity(dscr[2].startIndex, src.indexOf('\ttearDown'));
        this.assertIdentity(dscr[2].stopIndex, src.lastIndexOf('\n\})'));
        this.assertDescriptorsAreValid([descriptor]);
    },
    
    testParseMethod1: function() {   // xxx: function()...,
        var src = 'testMethod_8: function($super,a,b) { function abc(a) {\n\t1+2;\n}; }';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'testMethod_8');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
    },
    
    testParseMethod2: function() {   // xxx: function()...,
        var src = 'onEnter: function() {},';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'onEnter');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
    },
    
    testParseMethod3: function() {   // xxx: function()...,
        var src = 'setShape: function(newShape) {\n\tthis.internalSetShape(newShape);\n}.wrap(Morph.onLayoutChange(\'shape\')),';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'setShape');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
    },

    testParseMethodWithComment: function() {
    		var src = 'm1: function() { /*\{*/ }';
            this.sut.src = src;
            var descriptor = this.sut.callOMeta('propertyDef');
			this.assert(descriptor, 'no descriptor');
            this.assertEquals(descriptor.name, 'm1');
            this.assertIdentity(descriptor.startIndex, 0);
            this.assertIdentity(descriptor.stopIndex, src.length - 1);
    },
    
    testParseProperty: function() { // xxx: yyy,
        var src = 'initialViewExtent: pt(400,250),';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'initialViewExtent');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(','));
    },

    testParseObject: function() {   // var object = {...};
        var src = 'var Converter = {\n'+
            '\tdocumentation: "singleton used to parse DOM attribute values into JS values",\n\n\n\n' +
            'toBoolean: function toBoolean(string) {\n' +
        	'return string && string == \'true\';\n}\n\n};';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('objectDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'Converter');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'));
        this.assertEquals(descriptor.subElements().length, 2);
		this.assert(descriptor.subElements()[0].isStatic(), 'non static subelem');
        this.assertDescriptorsAreValid([descriptor]);
    },
    
    testParseFunction1: function() {    // function abc() {...};
        var src = 'function equals(leftObj, rightObj) {\n\t\treturn cmp(leftObj, rightObj);\n\t};'
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('functionDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'equals');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'));
    },
    
    testParseFunction2: function() {    // var abc = function() {...};
        var src = 'var equals = function(leftObj, rightObj) {\n\t\treturn cmp(leftObj, rightObj);\n\t};'
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('functionDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'equals');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'));
    },
    
    testParseExecutedFunction: function() { // (function() {...});
        var src = '(function testModuleLoad() {\n\t\tvar modules = Global.subNamespaces(true);\n\t}).delay(5);';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('functionDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'testModuleLoad');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'));
    },
    
    testParseStaticFunctions: function() {  // Klass.method = function() {...};
        var src = 'tests.ToolsTests.ScriptEnvironment.open = function() {};'
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'open');
        this.assertEquals(descriptor.className, 'tests.ToolsTests.ScriptEnvironment');
		this.assert(descriptor.isStatic());
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'));
        this.assertDescriptorsAreValid([descriptor]);
    },

	testExtensionSubElementsAreStaticProperties: function() {
		var src = 'Object.extend(Bla, {\nm1: function() {\n 1+2\n },\n x: 1\n});';
		this.sut.src = src;
        var descriptor = this.sut.callOMeta('klassExtensionDef');
		this.assertEquals(descriptor.subElements()[0].name, 'm1');
		this.assert(descriptor.subElements()[0].isStatic, 'not static!');
	},
    
    testParseMethodModification: function() {   // Klass.protoype.method = function() {...};
        var src = 'Morph.prototype.morphMenu = Morph.prototype.morphMenu.wrap(function(proceed, evt) {  });';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'morphMenu');
        this.assertEquals(descriptor.className, 'Morph');
		this.assert(!descriptor.isStatic());
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'));
        this.assertDescriptorsAreValid([descriptor]);
    },
    
    testParseClassExtension01: function() { // Object.extend(...);
        var src = 'Object.extend(tests.ToolsTests.ScriptEnvironment, { \nopen: function() {\n\t\t1+2\n\t}\n});';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('klassExtensionDef');
        this.assert(descriptor, 'no descriptor');
        this.assert(descriptor.name.startsWith('tests.ToolsTests.ScriptEnvironment'));
        this.assertEquals(descriptor.subElements().length, 1);
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'));
        this.assertDescriptorsAreValid([descriptor]);
    },
    
    testParseClassExtension02: function() { // Klass.addMethods(...); || Klass.addProperties(...);
        var src = 'Morph.addMethods({\n\ngetStyleClass: function() {\n\treturn this.styleClass;\n},});';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('klassExtensionDef');
        this.assert(descriptor, 'no descriptor');
        this.assert(descriptor.name.startsWith('Morph'));
        this.assertEquals(descriptor.subElements().length, 1);
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'));
        this.assertDescriptorsAreValid([descriptor]);
    },
    
    testParseComment: function() { // /* ... */ || // ...
        var src = '   /*\n * bla bla bla\n *\n */';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('comment');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.type, 'comment');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf('/'));
        this.assertDescriptorsAreValid([descriptor]);
    },
            
    xtestFileContent: function() {
        var src = '// Bla\n// ===\n\nnamespace(\'lively.data\');\n\nObject.subclass(\'lively.data.Wrapper\', { });\n\n';
        this.sut.src = src;
        var all = this.sut.callOMeta('fileContent');
        this.assertEquals(all.length, 6);
    },
	testParseClassWithURLProperty: function() {
		
        var src = 'Object.subclass(\'Dummy\', {\n' +
                  '\turl: \'http://www.lively-kernel.org/trac\',\n' +
                  '})';
        this.sut.src = src;
        var descriptor = this.sut.parseClass();
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'Dummy');
        this.assertEquals(descriptor.superclassName, 'Object');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.length - 1);
        this.assertDescriptorsAreValid([descriptor]);
    },

        
});

tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.JsParserParsesCoreTest', {
            
	shouldRun: false,
	
    test01ParseCoreAlternativ: function() {
        // var url = URL.source.withFilename('Core.js');
        // var result = this.sut.parseFileFromUrl(url);
        var db = new SourceDatabase();
        var src = db.getCachedText('Core.js');
        var result = this.sut.parseSource(src);
        this.assert(result && !result.isError)
        // this.assertDescriptorsAreValid(result);
    },



});

tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.JsParserTest2', {

   	testFindLinNo: function() {
        var str = 'abc\ndef123\n\n\nxyz\n';
        var lines = str.split(/[\n\r]/);
        this.assertEquals(this.sut.findLineNo(lines, 0), 1);
        this.assertEquals(this.sut.findLineNo(lines, 2), 1);
        this.assertEquals(this.sut.findLineNo(lines, 3), 1);
        this.assertEquals(this.sut.findLineNo(lines, 4), 2);
        this.assertEquals(this.sut.findLineNo(lines, 10), 2);
        this.assertEquals(this.sut.findLineNo(lines, 11), 3);
        this.assertEquals(this.sut.findLineNo(lines, 14), 5);
        this.assertEquals(this.sut.findLineNo(lines, 16), 5);
    },
    
    testParseCompleteSource: function() {
        var src = '// Bla\n// ===\n\nnamespace(\'lively.data\');\n\nObject.subclass(\'lively.data.Wrapper\', { });\n\n';
        var result = this.sut.parseSource(src);
        this.assertEquals(result.length, 5);
    },
    
    testOverlappingIndices: function() {
        var src =   
                    '/*' + '\n' +
                    ' * Copyright ï¿½ 2006-2008 Sun Microsystems, Inc.' + '\n' +
                    ' * All rights reserved.  Use is subject to license terms.' + '\n' +
                    ' * This distribution may include materials developed by third parties.' + '\n' +
                    ' *  ' + '\n' +
                    ' * Sun, Sun Microsystems, the Sun logo, Java and JavaScript are trademarks' + '\n' +
                    ' * or registered trademarks of Sun Microsystems, Inc. in the U.S. and' + '\n' +
                    ' * other countries.' + '\n' +
                    ' */ ' + '\n' +
                    '\n' +
                    '/**' + '\n' +
                    '* Core.js.  This file contains the core system definition' + '\n' +
                    '* as well as the core Morphic graphics framework. ' + '\n' +
                    '*/' + '\n' + '\n' + '\n' +
                    '/* Code loader. Appends file to DOM. */' + '\n' +
                    'var Loader = {' + '\n' +
                    '\n' +
                    '     loadJs: function(url, onLoadCb, embedSerializable) {' + '\n' +
                    '\n' +
                    '         if (document.getElementById(url)) return;' + '\n' +
                    '\n' +
                    '         var script = document.createElement(\'script\');' + '\n' +
                    '         script.id = url;' + '\n' +
                    '         script.type = \'text/javascript\';' + '\n' +
                    '         script.src = url;' + '\n' +
                    '         var node = document.getElementsByTagName(embedSerializable ? "defs" : "script")[0];' + '\n' +
                    '         if (onLoadCb) script.onload = onLoadCb;' + '\n' +
                    '         node.appendChild(script);' + '\n' +
                    '     },' + '\n' +
                    '\n' +
                    '     scriptInDOM: function(url) {' + '\n' +
                    '         if (document.getElementById(url)) return true;' + '\n' +
                    '         var preloaded = document.getElementsByTagName(\'defs\')[0].childNodes;' + '\n' +
                    '         for (var i = 0; i < preloaded.length; i++)' + '\n' +
                    '             if (preloaded[i].getAttribute &&' + '\n' +
                    '                     preloaded[i].getAttribute(\'xlink:href\') &&' + '\n' +
                    '                         url.endsWith(preloaded[i].getAttribute(\'xlink:href\')))' + '\n' +
                    '                             return true' + '\n' +
                    '         return false;' + '\n' +
                    '     }' + '\n' +
                    '};';

        var result = this.sut.parseSource(src);
        this.assertDescriptorsAreValid(result);
    },
    
    testFailingKlass: function() { // scene.js 841
        var src = 'this.PathElement.subclass(\'lively.scene.MoveTo\', {\n\
    charCode: \'M\',\n\n\
    initialize: function(x, y) {\n\
    this.x = x;\n\
    this.y = y;\n\
    },\n\n\
    allocateRawNode: function(rawPathNode) {\n\
    this.rawNode = rawPathNode.createSVGPathSegMovetoAbs(this.x, this.y);\n\
    return this.rawNode;\n\
    },\n\n\
    controlPoints: function() {\n\
    return [pt(this.x, this.y)];\n\
    },\n\n\n\n});';
        var result = this.sut.parseSource(src);
        this.assert(result.length = 1); // FIXME
        this.assertEquals(result.last().type, 'klassDef');
        this.assertDescriptorsAreValid(result);
    },
    
    testFailingKlassExtension1: function() { // Core 1899 and before
        var src = '\n// Morph bindings to its parent, world, canvas, etc.' + '\n' +
        'Morph.addMethods({' + '\n' + '\n' +
            '   world: function() {' + '\n' +
        	'   return this.owner ? this.owner.world() : null;' + '\n' +
            '},' + '\n' + '\n' +
            '// Morph coordinate transformation functions' + '\n' + '\n' +
            '// SVG has transform so renamed to getTransform()' + '\n' +
            'getTransform: function() {' + '\n' +
        	'    if (this.pvtCachedTransform) return this.pvtCachedTransform;\n}' + '\n' + '\n' +
        	'});';
        var result = this.sut.parseSource(src);
        this.assert(result.length >= 1); // FIXME
        this.assertEquals(result.last().type, 'klassExtensionDef');
        this.assertDescriptorsAreValid(result);
    },
    
    testFailingKlassExtension2: function() { // Base 1945
        var src = 'Object.extend(Color, {' + '\n' +
        '    darkGray: Color.gray.darker(),' + '\n' +
        '    lightGray: Color.gray.lighter(),' + '\n' +
        '    veryLightGray: Color.gray.lighter().lighter(),' + '\n' +
        '    turquoise: Color.rgb(0, 240, 255),' + '\n' +
        '    //    brown: Color.rgb(182, 67, 0),' + '\n' +
        '    //    red: Color.rgb(255, 0, 0),' + '\n' +
        '    orange: Color.rgb(255, 153, 0),' + '\n' +
        '    //    yellow: Color.rgb(204, 255, 0),' + '\n' +
        '    //    limeGreen: Color.rgb(51, 255, 0),' + '\n' +
        '    //    green: Color.rgb(0, 255, 102),' + '\n' +
        '    //    cyan: Color.rgb(0, 255, 255),' + '\n' +
        '    //    blue: Color.rgb(0, 102, 255),' + '\n' +
        '    //    purple: Color.rgb(131, 0, 201),' + '\n' +
        '    //    magenta: Color.rgb(204, 0, 255),' + '\n' +
        '    //    pink: Color.rgb(255, 30, 153),' + '\n' +
        '    primary: {' + '\n' +
        '	// Sun palette' + '\n' +
        '	blue: Color.rgb(0x53, 0x82, 0xA1),' + '\n' +
        '	orange: Color.rgb(0xef, 0x6f, 0x00),' + '\n' +
        '	green: Color.rgb(0xb2, 0xbc, 00),' + '\n' +
        '	yellow: Color.rgb(0xff, 0xc7, 0x26)' + '\n' +
        '    },' + '\n' +
        '' + '\n' +
        '    secondary: {' + '\n' +
        '	blue: Color.rgb(0x35, 0x55, 0x6b),' + '\n' +
        '	orange: Color.rgb(0xc0, 0x66, 0x00),' + '\n' +
        '	green: Color.rgb(0x7f, 0x79, 0x00),' + '\n' +
        '	yellow: Color.rgb(0xc6, 0x92, 0x00)' + '\n' +
        '    },' + '\n' +
        '' + '\n' +
        '    neutral: {' + '\n' +
        '	lightGray: Color.rgb(0xbd, 0xbe, 0xc0),' + '\n' +
        '	gray: Color.rgb(0x80, 0x72, 0x77)' + '\n' +
        '    }' + '\n});';
        var result = this.sut.callOMeta('klassExtensionDef', src);
        this.assertEquals(result.type, 'klassExtensionDef');
    },
    
    testFailingKlassExtension3: function() {
        var src = 'Morph.addMethods(\{\})\}\)';
        var result = this.sut.callOMeta('klassExtensionDef', src);
        this.assertEquals(result.type, 'klassExtensionDef');
    },
    
    testFailingPropertyDef: function() {
        var src = 'neutral: \{'  + '\n' +
    	'lightGray: Color.rgb(0xbd, 0xbe, 0xc0),'  + '\n' +
    	'gray: Color.rgb(0x80, 0x72, 0x77)' + '\n' + '\},';
    	var result = this.sut.callOMeta('propertyDef', src);
		this.assert(!result.isStatic());
        this.assertEquals(result.type, 'propertyDef');
    },
    
    testFailingUsing: function() { // from Main.js
        var src = '/**\n\
* Main.js.  System startup and demo loading.\n\
*/\n\
using(lively.lang.Execution).run(function(exec) {\n\
main.logCompletion("main").delay(Config.mainDelay);\n\
}.logCompletion("Main.js"));';
        var result = this.sut.parseSource(src);
        this.assertEquals(result.length, 2);
        this.assertEquals(result[1].type, 'usingDef');
        this.assertEquals(result[1].stopIndex, src.length-1);
        this.assertEquals(result[1].subElements().length, 1);
    },
    
testParseModuledef: function() {
        var src = 'module(\'lively.TileScripting\').requires(\'lively.Helper\').toRun(function(tests.ToolsTests) {\n\nMorph.addMethods({})\n});';
        var result = this.sut.parseSource(src);

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].type, 'moduleDef');
        this.assertEquals(result[0].name, 'lively.TileScripting');
        this.assertEquals(result[0].startIndex, 0);
        this.assertEquals(result[0].stopIndex, src.length-1);
    },
    
	testParseModuleAndClass: function() {
        var src = 'module(\'lively.xyz\').requires(\'abc.js\').toRun(function(tests.ToolsTests) {\n\Object.subclass(\'Abcdef\', {\n}); // this is a comment\n});';
        var result = this.sut.parseSource(src);

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].type, 'moduleDef');
        this.assertEquals(result[0].stopIndex, src.length-1);
    },

    testParseModuleAndUsingDef: function() { // /* ... */ || // ...
        var src = 'module(\'lively.TileScripting\').requires(\'lively/Helper.js\').toRun(function(tests.ToolsTests) {\n\
using().run(function() {\nMorph.addMethods({})\n})\n});';
        var result = this.sut.parseSource(src);
        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].type, 'moduleDef');
        this.assertEquals(result[0].subElements().length, 1);
        this.assertEquals(result[0].subElements()[0].type, 'usingDef');
    },

	testFailingProperty: function() { // multiline properties
		var src = 'documentation: \'Extended FileParser\' +\n\t\t\t\'bla\','
		var result = this.sut.callOMeta('propertyDef', src);
        this.assertEquals(result.type, 'propertyDef');
		this.assert(!result.isStatic());
		this.assertEquals(result.stopIndex, src.length-1);
    },

	testParseError: function() { // unequal number of curly bracktes
		var src = 'Object.subclass(\'ClassAEdited\', \{';
		var result = this.sut.parseSource(src);
		// y = result;
		// FIXME currently Object.subclass is parsed as unknown --> create 'keywords' in parser
		// this.assertEquals(result.length, 1); 
        this.assert(result[1].isError, 'no Error');
    },
testFailingRegex: function() {
	//var src = "toSmalltalk: function() {\nreturn Object.isString(this.value) ? '\\'' + this.value.replace(/'/g, '\'\'') + '\'' : this.value;\n},";
	var src = "toSmalltalk: function() { return /'/ },";
	var result = this.sut.callOMeta('propertyDef', src);
	this.assert(result, 'not recognized');
	this.assertEquals(result.name, 'toSmalltalk');
	this.assertIdentity(result.startIndex, 0);
	this.assertIdentity(result.stopIndex, src.length - 1);
},

	testParseGetter: function() {   // xxx: function()...,
        var src = 'get foo() { return 23 },';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'foo');
    },
	testParseSetter: function() {   // xxx: function()...,
        var src = 'set foo(val) { this._val = val + 42 },';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'foo');
    },
testParseKlassWithTwoTraits: function() {
		var src = 'X.subclass(\'Y\', Trait1, Trait2, {\n' +
				'	m1: function(),\n' +
				'});'
		this.sut.src = src;
		var descriptor = this.sut.parseClass();
		this.assert(descriptor, 'no descriptor');

		this.assertEquals('Y', descriptor.name);
		this.assertEquals('Trait1', descriptor.traits[0]);
		this.assertEquals('Trait2', descriptor.traits[1]);
		this.assertDescriptorsAreValid([descriptor]);		
},
	testParseFailingMethodWithComment: function() {
        var src =
			// '    /**\n' +
			// '     * override b/c of parent treatement\n' +
			// '     */\n' +
			'    relativize: function(pt) { \n' +
			'        return 3;\n' +
			'    },'

        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'relativize');
	},


});

tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.JsParserTest3', {

	shouldRun: false,
	
	documentation: 'Tests which directly access LK files. Tests are quite brittle because they will fail when th eline numbers of the used files change.',
    
    testParseWorldMorph: function() {    // Object.subclass
		// Class definition of Morph
		var src = this.srcFromLinesOfFile('Core.js', 4463, 5640 + 1);
        var descriptor = this.sut.callOMeta('klassDef', src);
        this.assertEquals(descriptor.type, 'klassDef');
    },
    
/*    testParseOldFileParser: function() {
		// Class definition of FileParser
		var src = this.srcFromLinesOfFile('Tools.js', 1223, 1481);
        var descriptor = this.sut.callOMeta('klassDef', src);
        this.assertEquals(descriptor.type, 'klassDef');
    },
    
    testParseTest: function() {
        var src = 'xyz: function() { \'\}\' },'
        var descriptor = this.sut.callOMeta('propertyDef', src);
 this.assertEquals(descriptor.type, 'propertyDef');
        this.assertEquals(descriptor.stopIndex, src.length-1);
    },
    
    testParseTestKlass: function() {
		// Class definition of JsParserTest1
		var src = this.srcFromLinesOfFile('tests/ToolsTests.js', 134, 367);
        var descriptor = this.sut.callOMeta('klassDef', src);
        this.assertEquals(descriptor.type, 'klassDef');
    },

	testParseFailingAddMethods: function() {
		// addMethods of Morph
		var src = this.srcFromLinesOfFile('Core.js', 3056, 3084);
		var descriptor = this.sut.callOMeta('klassExtensionDef', src);
		this.assertEquals(descriptor.type, 'klassExtensionDef');
	},

	testParseSelectionMorph: function() {
		// Widget.js -- SelectionMorph
		var src = this.srcFromLinesOfFile('Widgets.js', 465, 688);
		var descriptor = this.sut.callOMeta('klassDef', src);
		this.assertEquals(descriptor.type, 'klassDef');
	},

	testParseHandMorph: function() {
		// Core.js -- HandMorph
		//var src = this.srcFromLinesOfFile('Core.js', 4345, 4875);
		var src = 'Morph.subclass("HandMorph", {\ndocumentation: "abc\'s defs",\n});';
		var descriptor = this.sut.callOMeta('klassDef', src);
		this.assertEquals(descriptor.type, 'klassDef');
	},
*/

});
tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.ContextJSParserTest', {
	test01ParseSimpleLayerDef: function() {
	var src = 'cop.create("TestLayer");';
	this.sut.src = src;
	var descriptor = this.sut.callOMeta("copDef");
	this.assert(descriptor, 'no descriptor');
	this.assertEquals(descriptor.name, 'TestLayer');
    },
test02ParseCopAsFile: function() {
	var src = 'cop.create("TestLayer");';
	var result = this.sut.parseSource(src);
	this.assertEquals(result.length, 1);
	this.assertEquals(result[0].type, 'copDef');
	this.assertEquals(result[0].subElements().length, 0);
},
test03ParseCopSubElements: function() {
	var src = 'cop.create("TestLayer")\n\t.refineClass(Foo);';
	this.sut.src = src;
	var descriptor = this.sut.callOMeta("copDef");
	this.assertEquals(descriptor.subElements().length, 1);
	this.assertEquals(descriptor.subElements()[0].name, 'Foo');
},
test04ParseCopSubElements2: function() {
	var src = '.refineObject(Foo, {m1: function() {},\n\t\tm2: function() {},})';
	this.sut.src = src;
	var descriptor = this.sut.callOMeta("copSubElement");
	this.assertEquals(descriptor.name, 'Foo');
	this.assertEquals(descriptor.subElements().length, 2);
	this.assertEquals(descriptor.subElements()[0].name, 'm1');
	this.assertEquals(descriptor.subElements()[1].name, 'm2');
},
test05ParseBeGlobal: function() {
	var src = '.beGlobal()';
	this.sut.src = src;
	var descriptor = this.sut.callOMeta("copSubElement");
	this.assertEquals(descriptor.name, 'beGlobal()');
},




});
tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.TraitsParserTest', {
	test01ParseSimpleTraitDef: function() {
		var src = 'Trait(\'Foo\');';
		this.sut.src = src;
		var descriptor = this.sut.callOMeta("traitDef");
		this.assert(descriptor, 'no descriptor');
		this.assertEquals(descriptor.name, 'Foo');
    },
	test02ParseTraitAsFile: function() {
		var src = 'Trait(\'Foo\');';
		var result = this.sut.parseSource(src);
		this.assertEquals(result.length, 1);
		this.assertEquals(result[0].type, 'traitDef');
		this.assertEquals(result[0].subElements().length, 0);
	},
	test03ParseTraitSubElements: function() {
		var src = 'Trait("Foo",\n {a: 1,})';
		this.sut.src = src;
		var descriptor = this.sut.callOMeta("traitDef");
		this.assertEquals(descriptor.subElements().length, 1);
	},
	test04ParseTraitWithMethodCategories: function() {
		var src = 'Trait("Foo",\n \'test1\', {\na: 1,\nb: 2\n},\n\'test2\', {\nc: 3\n})';
		this.sut.src = src;
		var descriptor = this.sut.callOMeta("traitDef");
		this.assertEquals(descriptor.subElements().length, 3);
	},

	test05ParseApplyTo: function() {
		var src = '.applyTo(Bar, {exclude: ["x"],})';
		this.sut.src = src;
		var descriptor = this.sut.callOMeta("traitSubElement");
		this.assertEquals(descriptor.name, ' -> Bar');
		this.assertEquals(descriptor.subElements().length, 1);
	},

});
tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.MethodCategoryParseTest', {

	test01ParseAddMethodsWithCategory: function() {
		this.sut.debugMode = true
		var src = 'Foo.addMethods(\'categoryA\', { foo: function() { return 23 }, });';
		this.sut.src = src;
		var descriptor = this.sut.callOMeta('klassExtensionDef');
		this.assert(descriptor, 'no descriptor');
		this.assert('Foo', descriptor.name);
		this.assertEquals(descriptor.subElements().length, 1);
		this.assertIdentity(descriptor.startIndex, 0);
		this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'), 'stopIndex wrong');
		this.assertDescriptorsAreValid([descriptor]);
		var methodDescriptor = descriptor.subElements()[0];
		this.assertEquals('foo', methodDescriptor.name);

		this.assertEquals('categoryA', methodDescriptor.category.getName());
		this.assertEquals(methodDescriptor.category.startIndex, 15);
		this.assertEquals(methodDescriptor.category.stopIndex, 61);
		// this.assertEquals('\'categoryA\', { foo: function() { return 23 }, }',
			// methodDescriptor.category.getSourceCode());

		this.assertEquals(1, descriptor.categories.length);
    },
test02ParseSubclassWithCategory: function() {
		this.sut.debugMode = true
		var src = 'Object.subclass(\'Foo\', \'categoryA\', { foo: function() { return 23 }, }, \'categoryB\', { foo2: function() { return 42 }, });';
		this.sut.src = src;
		var descriptor = this.sut.callOMeta('klassDef');
		this.assert(descriptor, 'no descriptor');
		this.assert('Foo', descriptor.name);
		this.assertEquals(descriptor.subElements().length, 2);
		this.assertIdentity(descriptor.startIndex, 0);
		this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'), 'stopIndex wrong');
		this.assertDescriptorsAreValid([descriptor]);

		var methodDescriptor = descriptor.subElements()[0];
		this.assertEquals('foo', methodDescriptor.name);
		this.assertEquals('categoryA', methodDescriptor.category.getName());

		methodDescriptor = descriptor.subElements()[1];
		this.assertEquals('foo2', methodDescriptor.name);
		this.assertEquals('categoryB', methodDescriptor.category.getName());
    },
test03RecognizeCategoriesAsFileFragments: function() {
		this.sut.debugMode = true
		var src = 'Object.subclass(\'Foo\', \'categoryA\', { m1: function() {},  m2: function() {}, });';
		this.sut.src = src;
		var descriptor = this.sut.callOMeta('klassDef');
		this.assert(descriptor, 'no descriptor');
		this.assert('Foo', descriptor.name);
		this.assertEquals(descriptor.subElements().length, 2);
		this.assertIdentity(descriptor.startIndex, 0);
		this.assertIdentity(descriptor.stopIndex, src.lastIndexOf(';'), 'stopIndex wrong');
		this.assertDescriptorsAreValid([descriptor]);

		this.assertEquals(1, descriptor.categories.length);
		// var categoryDescriptor = descriptor.categories()[0];

    },



});

tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.OMetaParserTest', {

	documentation: 'For testing parsing of OMeta grammar definitions themselves',

	setUp: function() {
		this.sut = new OMetaParser();
	},

	testParseBasicGrammar: function() {
		var src = 'ometa LKFileParser <: Parser {}';
        var result = this.sut.callOMeta('ometaDef', src);
        this.assertEquals(result.name, 'LKFileParser');
        this.assertEquals(result.superclassName, 'Parser');
        this.assertIdentity(result.startIndex, 0);
        this.assertIdentity(result.stopIndex, src.length - 1);
	},

	testParseBasicGrammarWithoutInheritance: function() {
		var src = 'ometa LKFileParser {}';
        var result = this.sut.callOMeta('ometaDef', src);
        this.assertEquals(result.name, 'LKFileParser');
	},

	testParseBasicGrammarWithRules: function() {
		var src = 'ometa LKFileParser {\n' +
			'rule1 = abc,\n' +
			'rule2 :x = xyz,\n' +
			'rule3 = abcxyz -> { 1+2 }\n' +
			'}';
        var result = this.sut.parseSource(src);
        this.assertEquals(result[0].name, 'LKFileParser');
		var sub = result[0].subElements();
		this.assertEquals(sub.length, 3);
		this.assertEquals(sub[0].name, 'rule1');
		this.assertEquals(sub[0].type, 'ometaRuleDef');
		this.assertEquals(sub[1].name, 'rule2');
		this.assertEquals(sub[2].name, 'rule3');
	},

	testParseRule: function() {
		var src = 'abc :x :y = seq(\'123\') \'1\'	-> {bla},'
        var result = this.sut.callOMeta('ometaRuleDef', src);
        this.assertEquals(result.name, 'abc');
		this.assertEqualState(result.parameters, ['x', 'y']);
		/*this.assertEqualState(result.ometaPart, ' seq(\'123\') \'1\'	');
		this.assertEqualState(result.jsPart, ' {bla}');*/
		this.assertIdentity(result.type, 'ometaRuleDef');
        this.assertIdentity(result.startIndex, 0);
        this.assertIdentity(result.stopIndex, src.length - 1);
	},

	testParseRule2: function() {
		var src = 'x = abc -> 1\n\t\|xyz -> 2,';
        var result = this.sut.callOMeta('ometaRuleDef', src);
        this.assertEquals(result.name, 'x');
        this.assertIdentity(result.startIndex, 0);
        this.assertIdentity(result.stopIndex, src.length - 1);
	},

	testParseRule3: function() {
		var src = 'x = abc';
        var result = this.sut.callOMeta('ometaRuleDef', src);
        this.assertEquals(result.name, 'x');
        this.assertIdentity(result.startIndex, 0);
        this.assertIdentity(result.stopIndex, src.length - 1);
	},

	testParseRule4: function() {
		var src = 'x -> 2,';
        var result = this.sut.callOMeta('ometaRuleDef', src);
        this.assertEquals(result.name, 'x');
        this.assertIdentity(result.startIndex, 0);
        this.assertIdentity(result.stopIndex, src.length - 1);
	},

});

tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.OMetaParserTestLKFile', {
	
	shouldRun: false,
	
	setUp: function() {
		this.sut = new OMetaParser();
	},

	testParseLKFileParserTxt: function() {
		var fn = 'LKFileParser.txt';
		var src = this.srcFromLinesOfFile(fn, 0, 9999);
		var result = this.sut.parseSource(src, {fileName: fn});
		//new ChangeList(fn, null, result).openIn(WorldMorph.current());
    },
});

tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.ChunkParserTest', {

	setUp: function($super) {
		$super();
		this.ometaParser = this.sut.ometaParser;
		this.chunkParser = Object.delegated(ChunkParser, {});
		this.debugFunction = function(src, grammarInstance, errorIndex) {
			var startIndex = Math.max(0, errorIndex - 100);
        	var stopIndex = Math.min(src.length, errorIndex + 100);
        	var str = src.substring(startIndex, errorIndex) + '<--Error-->' + src.substring(errorIndex, stopIndex);
			console.log(str);
		}
	},

	testParseChunkWithComment: function() {
		var src = '{/* abc */}'; // '{/}';
		var p = this.ometaParser;
		var result = p.matchAll(src, 'chunk', ['{', '}'], this.debugFunction.curry(src));
		this.assert(result, 'couldn\'t parse');
		this.assertEquals(result.length, src.length);
	},

	testParseChunkWithComment2: function() {
		var src = '{// abc\n }';
		var p = this.ometaParser;
		var result = p.matchAll(src, 'chunk', ['{', '}'], this.debugFunction.curry(src));
		this.assert(result, 'couldn\'t parse');	
		this.assertEquals(result.length, src.length);
	},

	testParseChunkWithString: function() {
		var src = '{\'bl\{a\'}';
		var p = this.ometaParser;
		var result = p.matchAll(src, 'chunk', ['{', '}'], this.debugFunction.curry(src));
		this.assert(result, 'couldn\'t parse');
		this.assertEquals(result.length, src.length);
	},

	testParseChunkWithString2: function() {
		var src = "'a\\'b'";
		var p = this.ometaParser;
		var result = p.matchAll(src, 'chunk', ['\'', '\''], this.debugFunction.curry(src));
		this.assert(result, 'couldn\'t parse');
		this.assertEquals(result.length, src.length);
	},

	XtestParseChunkWithTwoSlashes: function() {
		// FIXME annoying bug
		// how to decide if it is a regular expression or a / operator
		// when we don't have a parse tree? Is it possible at all?
		var src = "{  x / 3+ ' / ' }";
		var p = this.ometaParser;
		var result = p.matchAll(src, 'chunk', ['{', '}'], this.debugFunction.curry(src));
		this.assert(result, 'couldn\'t parse');
		this.assertEquals(result.length, src.length);
	},

});

tests.ToolsTests.JsParserTest.subclass('tests.ToolsTests.FileFragmentTest', {

	setUp: function() {
		this.jsParser = new JsParser();
		// we don't want to see alert
		this.oldAlert = WorldMorph.prototype.alert;
		WorldMorph.prototype.alert = Functions.Null;

		this.setUpSource();
	},
	setUpSource: function() {
		/* creates:
		moduleDef: foo.js (0-277 in foo.js, starting at line 1, 4 subElements)
		klassDef: ClassA (55-123 in foo.js, starting at line 2, 1 subElements)
		propertyDef (proto): m1 (82-119 in foo.js, starting at line 3, 0 subElements)
		propertyDef (static): m3 (124-155 in foo.js, starting at line 8, 0 subElements)
		functionDef: abc (156-179 in foo.js, starting at line 9, 0 subElements)
		klassDef: ClassB (180-257 in foo.js, starting at line 10, 2 subElements)
		propertyDef (proto): m2 (209-230 in foo.js, starting at line 11, 0 subElements)
		propertyDef (proto): m3 (232-253 in foo.js, starting at line 12, 0 subElements)
		*/
		this.db = new AnotherSourceDatabase();
		this.src = 'module(\'foo.js\').requires(\'bar.js\').toRun(function() {\n' +
			'Object.subclass(\'ClassA\', {\n\tm1: function(a) {\n\t\ta*15;\n\t\t2+3;\n\t},\n});\n' +
			'ClassA.m3 = function() { 123 };\n' +
			'function abc() { 1+2 };\n' +
			'ClassA.subclass(\'ClassB\', {\n\tm2: function(a) { 3 },\nm3: function(b) { 4 }\n});\n' +
			'}); // end of module';
		this.root = this.db.prepareForMockModule('foo.js', this.src);
	},

	setUpAlternateSource: function() {
	    var src = 'Object.subclass("Dummy1", {});\n'+
	        'Object.subclass("Dummy", {\ntest1: 1,\ntest2: 2,\n\ntest2: 2,\n});';
		this.db = new AnotherSourceDatabase();
		this.root = this.db.prepareForMockModule('foo2.js', src);
		this.src = src;
	},

	setUpAlternateSource2: function() {
		var src = 'module(\'foo.js\').requires(\'bar.js\').toRun(function() {\n' +
		'/*\n' +
		' * my comment\n' +
		' */\n'+
		'\n' +
		'// ClassA is so important\n' +
		'// foo bar\n' +
		'Object.subclass(\'ClassA\', {\n\n' +
		'\tm1: function(a) {\n\t\ta*15;\n\t\t2+3;\n\t},\n});\n\n' +
		'}); // end of module';
		this.db = new AnotherSourceDatabase();
		this.root = this.db.prepareForMockModule('foo.js', src);
		this.src = src;
	},
   
	tearDown: function($super) {
		$super();
		WorldMorph.prototype.alert = this.oldAlert;
	},

	fragmentNamed: function(name, optFilter) {
		return this.root.flattened().detect(function(ea) {
			var select = ea.name == name;
			if (optFilter)
				select = select && optFilter(ea)
			return select;
		});
	},

	testCorrectNumberOfFragments: function() {
		this.assertEquals(this.root.type, 'moduleDef');
		this.assertEquals(this.root.flattened().length, 8);
	},

	testFragmentsOfOwnFile: function() {
		var classFragment = this.fragmentNamed('ClassA');
		this.assertEquals(classFragment.fragmentsOfOwnFile().length, 8-1);
	},

	testPutNewSource: function() {
		var classFragment = this.fragmentNamed('ClassA');
		classFragment.putSourceCode('Object.subclass(\'ClassA\', { //thisHas17Chars\n\tm1: function(a) {\n\t\ta*15;\n\t\t2+3;\n\t}\n});\n');
		this.assertEquals(classFragment.startIndex, 55, 'classFrag1 start');
		this.assertEquals(classFragment.stopIndex, 123+17, 'classFrag1 stop');
		this.assertEquals(classFragment.subElements().length, 1);
		this.assertEquals(classFragment.subElements()[0].startIndex, 82, 'method1 start');
		this.assertEquals(classFragment.subElements()[0].stopIndex, 119+17, 'method1 stop');
		var otherClassFragment = this.fragmentNamed('ClassB');
		this.assertEquals(otherClassFragment.startIndex, 180+17, 'classFrag2 start');
		this.assertEquals(otherClassFragment.stopIndex, 257+17, 'classFrag2 stop');
		this.assertEquals(this.root.stopIndex, 277+17, 'root stop');
		// this.assertEquals(this.root.subElements()[0].stopIndex, 277+17);
	},

	testGetSourceCodeWithoutSubElements: function() {
		var fragment = this.fragmentNamed('ClassB');
		this.assert(fragment, 'no fragment found');
		var expected =  'ClassA.subclass(\'ClassB\', {\n\n});\n';
		this.assertEquals(fragment.getSourceCodeWithoutSubElements(), expected);
	},

	testRenameClass: function() {
		var fragment = this.fragmentNamed('ClassA');
		var newName = 'ClassARenamed';
		fragment.putSourceCode('Object.subclass(\'' + newName + '\', {\n\tm1: function(a) {\n\t\ta*15;\n\t\t2+3;\n\t}\n});\n');
		this.assertEquals(fragment.name, newName);
		var foundAgain = this.fragmentNamed(newName);
		this.assertIdentity(foundAgain, fragment);
		var old = this.fragmentNamed('ClassA');
		this.assert(!old, 'old fragment still exisiting!');
	},

	testSourceWithErrorsWillNotBeSaved: function() {
		var fragment = this.fragmentNamed('ClassA');
		var newName = 'ClassAEdited';
		fragment.putSourceCode('Object.subclass(\'' + newName + '\', \{\n');

		this.assert(!this.db.getCachedText('foo.js').include('ClassAEdited'))
	},

	testReparse: function() {
		var fragment = this.fragmentNamed('ClassA');
		var result = fragment.reparse(fragment.getSourceCode());
		this.assertEquals(fragment.type, result.type);
		this.assertEquals(fragment.name, result.name);
		this.assertEquals(fragment.stopIndex, result.stopIndex);
		this.assertEquals(fragment.startIndex, result.startIndex);
		this.assertEquals(fragment.subElements().length, result.subElements().length);
	},

	testReparseCompleteFileFrag: function() {
		var src = '\nfunction abc() { 1+2 }\n\n';
		var fileName = 'bar.js';
		var frag = new lively.ide.FileFragment(fileName, 'completeFileDef', 0, src.length-1, fileName, [], this.db);
		this.db.modules[fileName] = lively.ide.ModuleWrapper.forFile(fileName);
		var result = frag.reparse(src);
		this.assertEquals(frag.type, result.type);
		this.assert(result.subElements().length > 0);
		this.assertEquals(result.stopIndex, src.length-1);
	},

	testPutNewSourceWithChangingCompleteFileFrag: function() {
		var oldSrc = '\nfunction abc() { 1+2 }\n\n';
		var fileName = 'bar.js';		
		var frag = this.db.addModule(fileName, oldSrc).ast();
		var newSrc = 'module(\'bar.js\').requires().toRun({function() {' + oldSrc + '});';
		frag.putSourceCode(newSrc);
		this.assertEquals(frag.type, 'moduleDef');
	},

	TODOtestReparseWithError: function() {
		// TODO make this work
		/*
		var fragment = this.fragmentNamed('ClassA');
		var newSrc = 'Object.subclass(\'ClassAEdited\', \{\n';
		var result = fragment.reparse(newSrc);
		dbgOn(true)
		this.assert(result.isError, 'no errorFileFrag');
		*/
	},

	testBuildNewSourceString: function() {
		var fragment = this.fragmentNamed('ClassA');
		var newString = 'Object.subclass(\'ClassXYZ\', {});\n';
		var result = fragment.buildNewFileString(newString);
		var expected = 'module(\'foo.js\').requires(\'bar.js\').toRun(function() {\n' +
		'Object.subclass(\'ClassXYZ\', {});\n' +
		'ClassA.m3 = function() { 123 };\n' +
		'function abc() { 1+2 };\n' +
		'ClassA.subclass(\'ClassB\', {\n\tm2: function(a) { 3 },\nm3: function(b) { 4 }\n});\n' +
		'}); // end of module';
		this.assertEquals(expected, result);
	},

	testSourceCodeWithout: function() {
		var fragment = this.fragmentNamed('m1');
		var owner = this.fragmentNamed('ClassA');
		var result = owner.sourceCodeWithout(fragment);
		var expected = 'Object.subclass(\'ClassA\', {\n\n});\n';
		this.assertEquals(expected, result);
	},

	testRemoveFragment: function() {
		var fragment = this.fragmentNamed('ClassA');
		var src = fragment.getSourceCode();
		var expectedLength = fragment.getFileString().length - fragment.getSourceCode().length;
		fragment.remove();
		this.assert(!this.root.flattened().include(fragment), 'root still includes fragment');
		var fileString = this.db.getCachedText('foo.js');
		this.assert(!fileString.include(src), 'filestring includes fragments sourceCode');
		this.assertEquals(expectedLength, fileString.length, 'strange length');
	},

	testAddSibling: function() {
		var classFragment = this.fragmentNamed('ClassA');
		var oldNoOfSubelements = classFragment.findOwnerFragment().subElements().length;
		var src = 'Object.subclass(\'ClassC\', {});\n'
		var newClassFragment = classFragment.addSibling(src);
		this.assertEquals(newClassFragment.getSourceCode(), src);
		this.assertEquals(newClassFragment.startIndex, classFragment.stopIndex+1, 'newcCassFrag1 start');
		var newNoOfSubelements = newClassFragment.findOwnerFragment().subElements().length;
		this.assertEquals(oldNoOfSubelements, newNoOfSubelements-1, 'no of subelems');
	},
	testAddSibling2: function() {
		var fragment = this.fragmentNamed('m2');
		var next = this.fragmentNamed('m1');
		var owner = this.fragmentNamed('ClassA');
		var expectedLength = owner.getFileString().length + fragment.getSourceCode().length;
		next.addSibling(fragment.getSourceCode());
		var string = owner.getFileString();
		this.assertEquals(expectedLength+2, string.length, 'strange length');
		this.assertEquals(owner.subElements().length, 2);
		this.assertEquals(owner.subElements()[1].getSourceCode(), fragment.getSourceCode());
	},
	testFindOwnerWhenSubelementsChange: function() {
		var fragment = this.fragmentNamed('m1');
		var owner = this.fragmentNamed('ClassA');
		this.assertEquals(fragment.findOwnerFragment(), owner, 1);
		owner.reparse(owner.getSourceCode());
		this.assertEquals(fragment.findOwnerFragment(), owner, 2);
	},

	testFindOwnerWithSimilarFragment: function() {
		this.setUpAlternateSource();
		var fragment = this.fragmentNamed('Dummy');
		this.assertEquals(fragment.subElements().length, 3);
		var f1 = fragment.subElements()[1];
		var f2 = fragment.subElements()[2];
		this.assertEquals(f1.getSourceCode(), f2.getSourceCode());
		this.assertEquals(f1.startIndex, 68, 1); this.assertEquals(f1.stopIndex, 76, 2);
		this.assertEquals(f2.startIndex, 79, 3); this.assertEquals(f2.stopIndex, 87, 4);

		this.assertEquals(fragment.sourceCodeWithout(f2), 'Object.subclass("Dummy", {\ntest1: 1,\ntest2: 2,\n\n\n});');
		this.assertEquals(fragment.sourceCodeWithout(f1), 'Object.subclass("Dummy", {\ntest1: 1,\n\n\ntest2: 2,\n});');
	},

	testMoveFragment: function() {
		this.setUpAlternateSource();
		var o = this.fragmentNamed('Dummy');
		var f = o.subElements()[2];
		f.moveTo(o.subElements()[0].startIndex);
		var newO = this.fragmentNamed('Dummy');
		this.assertEquals(f.getSourceCode(), newO.subElements()[0].getSourceCode(), 1);
		this.assertEquals(f.getSourceCode(), 'test2: 2,', 2);
		//this.assert(newO.eq(o), 6);
		this.assert(f.findOwnerFragment().eq(newO), 3);
		this.assert(f.eq(newO.subElements()[0]), 4);
		this.assertEquals(newO.getSourceCode(), 'Object.subclass("Dummy", {\ntest2: 2,test1: 1,\ntest2: 2,\n\n\n});', 5);
	},

	testMoveFragment2: function() {
		this.setUpAlternateSource();
		var targetIndex = this.src.indexOf('}'); // Dummy1
		var f = this.fragmentNamed('test2'); // first one
		f.moveTo(targetIndex);
		this.assertEquals(f.getSourceCode(), 'test2: 2,', 1);
		this.assertEquals(f.getFileString(), 'Object.subclass("Dummy1", {test2: 2,});\n'+
		'Object.subclass("Dummy", {\ntest1: 1,\n\n\ntest2: 2,\n});');
	},

	testEq1: function() {
		var f = this.fragmentNamed('m2');
		this.assert(f.eq(f), 1);
		var f1 = this.jsParser.parseNonFile('m2: function() { bla bla }');
		var f2 = this.jsParser.parseNonFile('m2: function() { bla bla }');
		this.assert(f1.eq(f2), 2);
		f1.type = 'unknown';
		this.assert(!f1.eq(f2), 3);
		f1.type = f2.type;
		f1._fallbackSrc = 'x' + f1._fallbackSrc;
		this.assert(!f1.eq(f2), 4);
		f1._fallbackSrc = f2._fallbackSrc;
		f1.startIndex++;
		this.assert(!f1.eq(f2), 5);
	},
	testFindPrevFragment: function() {
		this.setUpAlternateSource2();
		var def = this.fragmentNamed('ClassA');
		var prev = def.prevElement();
		this.assertEquals('comment', prev.type);
	},
	testGetComment: function() {
		this.setUpAlternateSource2();
		var def = this.fragmentNamed('ClassA');
		var comment = def.getComment();
		this.assertEquals('// ClassA is so important\n// foo bar\n', comment);
	},
	testGetSubElementAtLine: function() {
		this.setUpSource();

		var element = this.root.getSubElementAtLine(5, 10);

		this.assert(element, 'no element found');

		this.assertEquals(element.name, "m1", 'wrong name');

	},
	testGetSubElementAtIndex: function() {
		this.setUpSource();

		var element = this.root.getSubElementAtIndex(90, 5);

		this.assert(element, 'no element found');

		this.assertEquals(element.name, "m1", 'wrong name');

	},

	testGetOwnerNamePathRoot: function() {
		this.setUpSource();

		var path = this.root.getOwnerNamePath();
		this.assertEquals(path.length , 1, 'root path length wrong');
		this.assertEquals(path[0] , "foo.js", 'root name wrong');

	},
	testGetOwnerNamePathOfMethod: function() {
		this.setUpSource();

		var m1Node = this.root.getSubElementAtLine(5, 10);
		var path = m1Node.getOwnerNamePath();

		this.assertEquals(path.length , 3, 'root path length wrong');
		this.assertEquals(path[0] , "foo.js", 'root name wrong');
		this.assertEquals(path[1] , "ClassA", 'class name wrong');
		this.assertEquals(path[2] , "m1", 'class name wrong');
	},
	testCharsUpToLineInString: function() {
		var string = "12345\n12345\n12345\n12345\n";
		this.setUpSource()
		var fileFragment = this.root;

		this.assertEquals(fileFragment.charsUpToLineInString(string, 0), 0, "wrong chars for line 0")
		this.assertEquals(fileFragment.charsUpToLineInString(string, 1), 6, "wrong chars for line 1")
		this.assertEquals(fileFragment.charsUpToLineInString(string, 2), 12, "wrong chars for line 2")
		this.assertEquals(fileFragment.charsUpToLineInString(string, 3), 18, "wrong chars for line 3")
		this.assertEquals(fileFragment.charsUpToLineInString(string, 4), 24, "wrong chars for line 4")
		this.assertEquals(fileFragment.charsUpToLineInString(string, 5), 25, "wrong chars for line 5")
		this.assertEquals(fileFragment.charsUpToLineInString(string, 10), 25, "wrong chars for line 10")
	},
	testCharsUpToLine: function() {
		this.setUpSource()
		var fileFragment = this.root;

		this.assertEquals(fileFragment.charsUpToLine(0), 0, "wrong... for 0")
		this.assertEquals(fileFragment.charsUpToLine(5), 110, "wrong...")
	},

});

tests.ToolsTests.FileFragmentTest.subclass('tests.ToolsTests.FileFragmentNodeTests', {

	shouldRun: false,

	setUp: function($super) {
		$super();
		this.browser = {};
	},

	testFragmentsOfNodesDiffer: function() {
		/* just use updating via registered browsers, no need for hasCurrentSource
		var class1Frag = this.fragmentNamed('ClassA');
		var node1 = new lively.ide.ClassFragmentNode(class1Frag, this.browser);
		node1.sourceString(); // 'show' node1
		var class2Frag = this.fragmentNamed('ClassB');
		var node2 = new lively.ide.ClassFragmentNode(class2Frag, this.browser);
		node2.sourceString(); // 'show' node2
		this.assert(node1.hasCurrentSource(), 'node1 hasCurrentSource');
		this.assert(node2.hasCurrentSource(), 'node2 hasCurrentSource');
		node1.newSource('Object.subclass(\'ClassA\', {});\n');
		this.assert(node1.hasCurrentSource(), 'node1 hasCurrentSource 2');
		this.assert(!node2.hasCurrentSource(), 'node2 hasCurrentSource 2');
		*/
	},
});

TestCase.subclass('tests.ToolsTests.ChangesTests',
'running', {

	setUp: function() {
		this.parser = new AnotherCodeMarkupParser();
		this.cleanUpItems = [];
	},

	tearDown: function() {
		this.cleanUpItems.forEach(function(ea) { Class.deleteObjectNamed(ea) });
	},
},
'testing', {
	testEquals: function() {
		var c1 = DoitChange.create('1+2'),
			c2 = DoitChange.create('1+2');
		this.assert(c1.eq(c2), 'changes not equal');
	},

	testCreateProtoMethodChange: function() {
		var xml = stringToXML('<proto name="m1"><![CDATA[function(color) { 1+ 2 }]]></proto>'),
			change = this.parser.createChange(xml);
		this.assert(change.isProtoChange);
		this.assertEquals(change.getName(), 'm1');
		this.assertEquals(change.getDefinition(), 'function(color) { 1+ 2 }');
	},

	testCreateClassChange: function() {
		var xml = stringToXML('<class name="lively.Test" super="Object"></class>'),
			change = this.parser.createChange(xml);
		this.assert(change.isClassChange);
		this.assertEquals(change.getName(), 'lively.Test');
		this.assertEquals(change.getSuperclassName(), 'Object');
	},

	testCreateClassChangeWithSubElems: function() {
		var xml = stringToXML('<class name="lively.Test" super="Object"><proto name="m1"><![CDATA[function() {xyz}]]></proto></class>'),
			change = this.parser.createChange(xml),
			sub = change.getProtoChanges();
		this.assertEquals(sub.length, 1);
		var pChange = sub.first();
		this.assertEquals(pChange.getName(), 'm1');
	},

	testEvaluateMethodChangeWithNonExistingClass1: function() {
		var xml = stringToXML('<proto name="m1"><![CDATA[function(color) { 1+ 2 }]]></proto>'),
			change = this.parser.createChange(xml);
		this.assert(change.evaluate, 'no eval func');
		try { change.evaluate(); } catch(e) { return }
		this.assert(false, 'could evaluate proto method without class');
	},

	testEvaluateMethodChangeWithNonExistingClass2: function() {
		var xml = stringToXML('<class name="lively.Test" super="Object"><proto name="m1"><![CDATA[function() {xyz}]]></proto></class>'),
			change = this.parser.createChange(xml).getProtoChanges().first();
		this.assert(change.evaluate, 'no eval func');
		try { change.evaluate(); } catch(e) { return }
		this.assert(false, 'could evaluate proto method without exisiting class in system');
	},

	testEvaluateMethodWithClassInSystem: function() {
		var className = 'tests.ToolsTests.DummyForChangeTests1';
		this.cleanUpItems.push(className);
		Object.subclass(className);
		var xml = stringToXML('<class name="' + className +'" super="Object"><proto name="m1"><![CDATA[function() {1+2}]]></proto></class>'),
			change = this.parser.createChange(xml).getProtoChanges().first(),
			m = change.evaluate();
		this.assert(m instanceof Function);
		this.assert(Class.forName(className).functionNames().include('m1'), 'no function');
	},

	testEvaluateClassChange: function() {
		var className = 'tests.ToolsTests.DummyForChangeTests2';
		this.cleanUpItems.push(className);
		var xml = stringToXML('<class name="'+ className +'" super="Object"><proto name="m1"><![CDATA[function() {1+2}]]></proto></class>'),
			change = this.parser.createChange(xml),
			klass = change.evaluate();
		this.assert(klass && Class.isClass(klass));
		this.assert(klass.functionNames().include('m1'), 'no function');
	},

	testEvalauteClassChangeWithStaticElem: function() {
		var className = 'tests.ToolsTests.DummyForChangeTests3';
		this.cleanUpItems.push(className);
		var xml = stringToXML('<class name="'+ className +'" super="Object"><proto name="m1"><![CDATA[function() {1+2}]]></proto><static name="staticM1"><![CDATA[function(xyz) { 1+1 }]]></static></class>'),
			change = this.parser.createChange(xml),
			klass = change.evaluate();
		this.assert(klass.functionNames().include('m1'), 'no proto function');
		this.assert(klass['staticM1'] instanceof Function, 'no static function');
	},

	testLoadPenLkml: function() {
		delete Global['Pen'];
		ChangeSet.fromFile('tests/testRessources/Pen.lkml').evaluate();
		this.assert(Global['Pen']);
	},

	testDoit: function() {
		var objName = 'tests.ToolsTests.DummyObj';
		this.cleanUpItems.push(objName);
		var xml = stringToXML('<doit><![CDATA[' + objName + ' = {test: 1}; 1+2;]]></doit>'),
			change = this.parser.createChange(xml);
		this.assert(!Class.forName(objName), 'TestObj already exists');
		this.assert(change.isDoitChange);
		this.assertEquals(change.evaluate(), 3);
		this.assert(Class.forName(objName), 'TestObj not created');
	},

	testCreateProtoChange: function() {
		var name = 'test',
			src = 'function() { 1+ 2 }',
			className = 'lively.Dummy',
			change = ProtoChange.create(name, src, className);
		this.assertEquals(change.getName(), name);
		this.assertEquals(change.getDefinition(), src);
		this.assertEquals(change.getClassName(), className);
	},

	testSetNewDoitDef: function() {
		var oldSrc = '1+2+3',
			newSrc = '4+5+6',
			change = DoitChange.create(oldSrc);
		this.assertEquals(change.getDefinition(), oldSrc);
		change.setDefinition(newSrc);
		this.assertEquals(change.getDefinition(), newSrc);
	},
	testSetXMLElement: function() {
		// ensure that ne is placed at the same pos as old
		var classChange = ClassChange.create('TestClass', 'Object'),
			proto1 = new ProtoChange.create('test1', '123'),
			proto2 = new ProtoChange.create('test2', '456');
		classChange.addSubElements([proto1, proto2]);
		var proto3 = new ProtoChange.create('test3', '789');
		proto1.setXMLElement(proto3.getXMLElement());
		this.assertEquals(proto1.getDefinition(), '789', 'def is wrong');
		this.assertIdentity(classChange.subElements()[0].getName(), 'test3', 'proto1 not at old pos');
	},
	testSetNewName: function() {
		var change = DoitChange.create('123');
		this.assertEquals(change.getName(), 'aDoit');
		change.setName('myDoit');
		this.assertEquals(change.getName(), 'myDoit');
	},
	testChangeHasCDATASection: function() {
		var name = 'testChangeHasCDATASection_doit',
			source = '4+1',
			doit = DoitChange.create(source, name),
			element = doit.getXMLElement();
		this.assertEquals(source, element.textContent);
		this.assertEquals(1, element.childNodes.length);
		this.assertEquals(element.CDATA_SECTION_NODE, element.childNodes[0].nodeType, 'node type');
	},
	testMethodChangeHasCategory: function() {
		var xml = stringToXML('<proto name="m1"><![CDATA[function() { return 1 }]]></proto>'),
			change = this.parser.createChange(xml);
		this.assertEquals(change.getCategoryName(), 'default category');

		xml = stringToXML('<static name="m2"><![CDATA[function() { }]]></proto>'),
		change = this.parser.createChange(xml);
		this.assertEquals(change.getCategoryName(), 'default category');

		xml = stringToXML('<proto name="m3" category="foo"><![CDATA[function() { return 2 }]]></proto>'),
		change = this.parser.createChange(xml);
		this.assertEquals(change.getCategoryName(), 'foo');
	},
	testChangeOfMethodCategoryChangesClass: function() {
		var source = 'Object.subclass("ClassA",\n"category x", {\n\tmethod: function() { return 1 },\n});',
			classChange = Change.fromJS(source),
			methodCatChange = classChange.getCategories()[0],
			newDef = '"category x", {\n\tmethod: function() { return 2 },\n}';
		methodCatChange.setDefinition(newDef);
		var newClassChange = methodCatChange.getClassChange();
		this.assertEquals(1, newClassChange.subElements().length, 'subelements of class change are strange')
		var methodChange = newClassChange.subElements()[0];
		this.assert(/return 2/.test(methodChange.getDefinition()), 'def not changed');
	},



});

tests.ToolsTests.FileFragmentTest.subclass('tests.ToolsTests.ChangesConversionTest',
'running', {
	setUp: function($super) {
		$super();
		this.jsParser = new JsParser();
		this.changesParser = new AnotherCodeMarkupParser();
	},
},
'testing', {
	testConvertClassFFToChange: function() {
		var frag = this.fragmentNamed('ClassA'), change = frag.asChange();
		this.assert(change.isClassChange, 'is not a class change');
		this.assertEquals(change.subElements().length, 1, 'subelements?');
		this.assert(change.subElements()[0].isProtoChange, 'subelements[0]?');
		this.assertEquals(change.subElements()[0].getName(), 'm1', 'subelements[0] name?');
	},
	testConvertMethodFFToProtoChange: function() {
		var f = this.fragmentNamed('m1');
		this.assertEquals(f.type, 'propertyDef');
		var result = f.asChange();
		this.assert(result.isProtoChange, 'no protoChange');
		this.assertEquals(result.getDefinition(), 'function(a) {\n\t\ta*15;\n\t\t2+3;\n\t}');
	},
	testPropertyFFToChange: function() {
		var s = 'initialStyle: {borderWidth: 0, fillOpacity: .5, fill: Color.veryLightGray},',
			c = Change.fromJS(s);
		this.assertEquals(c.asJs(), s);
	},

	testProtoChangeAsJs: function() {
		var protoC = ProtoChange.create('test', 'function(a,b) {\n 1+2}', 'Dummy'),
			result = protoC.asJs();
		this.assertEquals(result, 'test: function(a,b) {\n 1+2},');
		var newChange = Change.fromJS(result);
		// FIXME assert sth?
	},
	testClassChangeAsJs: function() {
		var classC = ClassChange.create('TestClass', 'SuperTestClass'),
			result = classC.asJs();
		this.assertEquals(result, 'SuperTestClass.subclass(\'TestClass\');');
		var protoC1 = ProtoChange.create('test1', 'function() {1}', 'TestClass', 'foo'),
			protoC2 = ProtoChange.create('test2', 'function() {2}', 'TestClass', 'foo');
		classC.addSubElements([protoC1, protoC2]);
		result = classC.asJs();
		var expected = "SuperTestClass.subclass(\'TestClass\',\n'foo', {\n" +
			'\ttest1: function() {1},\n\ttest2: function() {2},\n});'
		this.assertEquals(expected, result);
		var newChange = Change.fromJS(result);
		this.assertEquals(newChange.subElements().length, 2);
	},
	testClassWithCategoryAsJs: function() {
		var source = 'Object.subclass(\'ClassA\',\n\'category x\', {\n\tmethod: function() { return 1 },\n});',
			change = Change.fromJS(source);
		this.assertMatches(['category x'], change.getCategories().invoke('getName'));
		this.assertEquals(source, change.asJs());
	},


});

TestCase.subclass('tests.ToolsTests.ModuleWrapperTest', {
	
	testCreateWrapper: function() {
		var sut = lively.ide.ModuleWrapper.forFile('foobar.js');
		this.assertEquals(sut.moduleName(), 'foobar');
		this.assertEquals(sut.type(), 'js');
		var sut = lively.ide.ModuleWrapper.forFile('lively/parser.ometa');
		this.assertEquals(sut.moduleName(), 'lively.parser');
		this.assertEquals(sut.fileName(), 'lively/parser.ometa');
		this.assertEquals(sut.type(), 'ometa');
	},
	
});

tests.SerializationTests.SerializationBaseTestCase.subclass('tests.ToolsTests.ChangeSetTests',
'running', {

	setUp: function($super) {
		$super();
		this.parser = new AnotherCodeMarkupParser();
		this.cleanUpItems = [];
	},

	tearDown: function($super) {
		$super();
		this.cleanUpItems.forEach(function(ea) { Class.deleteObjectNamed(ea) });
	},
},
'testing', {
	testEquals: function() {
		var cs1 = ChangeSet.fromWorld(this.worldMorph);
		cs1.addChange(DoitChange.create('1+2'));
		var cs2 = ChangeSet.fromWorld(this.worldMorph);
		this.assert(cs1.eq(cs2), 'changes not equal');
	},

	testAddChangeSetToWorldPlusReconstruct: function() {
		var world = this.worldMorph,
			cs = ChangeSet.fromWorld(world);
		this.assert(cs.xmlElement, 'no xmlElement');
		this.assertIdentity(world.getDefsNode().getElementsByTagName('code')[0], cs.xmlElement);
		var cs2 = ChangeSet.fromWorld(world);
		this.assertIdentity(world.getDefsNode().getElementsByTagName('code')[0], cs2.xmlElement);
		this.assertIdentity(world.getDefsNode().getElementsByTagName('code')[0], cs.xmlElement);
	},

	testAddChangesToChangeSet: function() {
		var cs = ChangeSet.fromWorld(this.worldMorph),
			xml = stringToXML('<class name="lively.Test" super="Object"></class>'),
			change = this.parser.createChange(xml),
			length = cs.subElements().length;
		cs.addChange(change);
		var result = cs.subElements();
		this.assertEquals(result.length, length+1);
		this.assert(result.last().isClassChange);
		this.assertEquals(result.last().getName(), change.getName());
	},

	testAddedChangeSetGetsSerialized: function() {
		var world = this.worldMorph,
			cs = ChangeSet.fromWorld(world);
			xml = stringToXML('<class name="lively.Test" super="Object"></class>'), // create change
			change = this.parser.createChange(xml);
		cs.addChange(change);
		// serialize a bit
		var doc = Exporter.shrinkWrapMorph(world),
			worldNode = doc.getElementById(world.id()),
			codeNode = worldNode.getElementsByTagName('code')[0];
		this.assert(codeNode, 'node codeNode');
		this.assert(codeNode.childNodes.length > 1);
		var newChange = this.parser.createChange($A(codeNode.childNodes).last());
		this.assert(newChange);
		this.assertEquals(newChange.getName(), change.getName());
	},

	testSerializeAndDeserializeChangeSet: function() {
		var world = this.worldMorph,
			cs = ChangeSet.fromWorld(world),
			xml = stringToXML('<class name="lively.Test" super="Object"></class>'), // create change
			change = this.parser.createChange(xml);
		cs.addChange(change);
		var length = cs.subElements().length,
			doc = Exporter.shrinkWrapMorph(world), // serialize a bit
			newWorld = new Importer().loadWorldContents(doc),
			newCs = ChangeSet.fromWorld(newWorld);
		this.assertEquals(newCs.subElements().length, length);
		this.assertEquals(newCs.subElements().last().getName(), change.getName());
	},

	testEvalChangeSet: function() {
		var className = 'tests.ToolsTests.DummyForChangeTests4';
		this.cleanUpItems.push(className);
		var xml = stringToXML('<class name="'+ className +'" super="Object"><proto name="m1"><![CDATA[function() {1+2}]]></proto></class>'),
			change = this.parser.createChange(xml),
			cs = ChangeSet.fromWorld(this.worldMorph);
		cs.addChange(change);
		cs.evaluate();
		var klass = Class.forName(className);
		this.assert(klass && Class.isClass(klass), 'no class?');
		this.assert(klass.functionNames().include('m1'), 'no function');
	},

	testRemoveNamedChanges: function() {
		var change = DoitChange.create('1+2');
		this.assertEquals(change.getName(), 'aDoit', 'change has no name');
		var cs = ChangeSet.fromWorld(this.worldMorph);
		var length = cs.subElements().length;
		cs.addChange(change);
		cs.removeChangeNamed('aDoit');
		this.assertEquals(cs.subElements().length, length);
	},

	testRemoveChangeAtIndex: function() {
		var change = DoitChange.create('1+2');
		this.assertEquals(change.getName(), 'aDoit', 'change has no name');
		var cs = ChangeSet.fromWorld(this.worldMorph);
		var length = cs.subElements().length;
		cs.addChange(change);
		cs.removeChangeAt(cs.subElements().length - 1);
		this.assertEquals(cs.subElements().length, length);
	},

	testRemoveAllChanges: function() {
		var change = DoitChange.create('1+2');
		this.assertEquals(change.getName(), 'aDoit', 'change has no name');
		var cs = ChangeSet.fromWorld(this.worldMorph);
		cs.addChange(change);
		change = DoitChange.create('3+4');
		cs.addChange(change);
		cs.remove();
		this.assertEquals(cs.subElements().length, 0);
	},

	testStartUpEvaluating: function() {
		tests.ToolsTests.ChangeSetTests.doit1WasRun = false;
		tests.ToolsTests.ChangeSetTests.doit2WasRun = false;
		tests.ToolsTests.ChangeSetTests.initializerWasRun = false;
		var newChange1 = DoitChange.create('tests.ToolsTests.ChangeSetTests.doit1WasRun = true');
		var newChange2 = DoitChange.create('tests.ToolsTests.ChangeSetTests.doit2WasRun = true');
		var cs = ChangeSet.fromWorld(this.worldMorph);
		cs.addSubElements([newChange1, newChange2]);
		var init = cs.getInitializer();
		init.setDefinition('tests.ToolsTests.ChangeSetTests.initializerWasRun = true');
		cs.evaluateAllButInitializer();
		this.assert(tests.ToolsTests.ChangeSetTests.doit1WasRun, 'doit1');
		this.assert(tests.ToolsTests.ChangeSetTests.doit2WasRun, 'doit2');
		this.assert(!tests.ToolsTests.ChangeSetTests.initializerWasRun, 'init 1');
		cs.evaluateInitializer();
		this.assert(tests.ToolsTests.ChangeSetTests.initializerWasRun, 'init 2');
	},
	testStartUpEvaluatingWithDisabledChanges: function() {
		tests.ToolsTests.ChangeSetTests.doit1WasRun = false;
		tests.ToolsTests.ChangeSetTests.doit2WasRun = false;
		var newChange1 = DoitChange.create('tests.ToolsTests.ChangeSetTests.doit1WasRun = true');
		var newChange2 = DoitChange.create('tests.ToolsTests.ChangeSetTests.doit2WasRun = true');
		newChange2.disableAutomaticEval();
		var cs = ChangeSet.fromWorld(this.worldMorph);
		cs.addSubElements([newChange1, newChange2]);
		cs.evaluateAllButInitializer();
		this.assert(tests.ToolsTests.ChangeSetTests.doit1WasRun, 'doit1');
		this.assert(!tests.ToolsTests.ChangeSetTests.doit2WasRun, 'doit2');
	},

	xtestReal: function() {
		var src1 = 'var extent = pt(200,200);\n\
var pos = WorldMorph.current().getExtent().scaleBy(0.5).subPt(extent.scaleBy(0.5));\n\
var m = new BoxMorph(pos.extent(extent));\n\
m.openInWorld();';
		var c1 = DoitChange.create(src1);
		var src2 = 'WorldMorph.current().submorphs.last().setFill(Color.red)';
		var c2 = DoitChange.create(src2);
		var cs = ChangeSet.current();
		cs.addChange(c1);
		cs.addChange(c2);
	},
	
	testModuleNamesInNamespace: function() {
		var sut = ChangeSet.fromWorld(this.worldMorph), list = sut.moduleNamesInNamespace('apps');
		this.assert(list.length > 0, "nothing founds");
	},

	testAddAndRemoveWorldRequirement: function() {
		var sut = ChangeSet.fromWorld(this.worldMorph),
			list = sut.getWorldRequirementsList().evaluate();
		this.assertEquals(list.length, 0, "list is not empty") 

		sut.addWorldRequirement('lively.TestFramework')
		list = sut.getWorldRequirementsList().evaluate();
		this.assertEquals(list.length, 1, "add failed") 

		sut.removeWorldRequirement('lively.TestFramework')
		list = sut.getWorldRequirementsList().evaluate();
		this.assertEquals(list.length, 0, "remove failed") 
	},
	
});

TestCase.subclass('tests.ToolsTests.KeyboardTest', {
    
    shouldRun: false,
    
    testStartKeyWatcher: function() {
		var keyWatcher = Morph.makeRectangle(0,0,100,20);
		keyWatcher.setFill(Color.red);
  
		var label = new TextMorph(keyWatcher.bounds().translatedBy(0,50));
        label.takesKeyboardFocus = Functions.False;
        label.onKeyDown = Functions.False;
        label.onKeyPress = Functions.False;

        keyWatcher.addMorph(label);
        keyWatcher.takesKeyboardFocus = Functions.True;
        keyWatcher.onKeyDown = function(evt) {
            console.log('PRESS');
            if (evt.rawEvent.ctrlKey) console.log('Ctrl key pressed');
            label.setTextString(evt.getKeyChar() + '---' + evt.getKeyCode());
        }
        
        keyWatcher.openInWorld();
        WorldMorph.current().hands.first().setKeyboardFocus(keyWatcher);
    },
});
    
TestCase.subclass('tests.ToolsTests.MouseEventTest', {
	shouldRun: false,
	testMouseEvents: function() {
		var mouseWatcher = Morph.makeRectangle(0,0,100,20);
		mouseWatcher.setFill(Color.red);

		mouseWatcher.takesMouseFocus = Functions.True;
		mouseWatcher.handlesMouseDown = Functions.True;
		mouseWatcher.onMouseDown = function(evt) {
			console.log('CLICK');
			console.log(evt.rawEvent.button)
			if (evt.rawEvent.ctrlKey) console.log('Ctrl key pressed');
			evt.stop();
		}

		mouseWatcher.openInWorld();
		WorldMorph.current().hands.first().setKeyboardFocus(mouseWatcher);
	},
});

TestCase.subclass('tests.ToolsTests.TabCompletionTest', {

	testAllSymbols: function() {
		this.assert(lively.ide.AutoCompletion.TabCompletion.allSymbols().length > 1000)
	},

	testAllSymbolsAreUnique: function() {
		var all = lively.ide.AutoCompletion.TabCompletion.allSymbols(true),
			uniq = all.clone().uniq();
		this.assertEquals(all.length, uniq.length, "not unique");
	},
	
	testExtractLocalSymbols: function() {
		var text = "abc abbc\nabbd\tabbe",
			all = lively.ide.AutoCompletion.TabCompletion.extractLocalSymbols(text)
		this.assert(all.length == 4, "wrong lenth")
	},

});

TestCase.subclass('tests.ToolsTests.TabCompletionLayerTest',
'helper', {
	createText: function(string) {
		var sut = new TextMorph(new Rectangle(0,0,100,100), string);
		sut.setWithLayers([TabCompletionLayer]);
		return sut
	},
},
'testing', {
	testTabCompletionChoicesForLastWord: function() {
		var string = "\nfunc\nNextLine\n"
		var sut = this.createText(string);
		sut.setSelectionRange(string.indexOf("\nNextLine"), 0);
		var coices = sut.tabCompletionChoicesForLastWord("func");
		this.assert(coices.length > 0);
	},

	testTabCompletionChoicesForLastWord: function() {
		var string = "\nfunc\nNextLine\n"
		var sut = this.createText(string);
		sut.setSelectionRange(string.indexOf("\nNextLine"), 0);
		// this.assertEquals(sut.tabCompletionForLastWord("func", false), "function");
	},
});

TestCase.subclass('tests.ToolsTests.ChromeErrorStackParserTest',
'tests', {
	testParseErrorStackLine: function() {
		var line = "    at TextMorph.<anonymous> (http://www.lively-kernel.org/repository/webwerkstatt/lively/ide/SyntaxHighlighting.js?fx1291814980471:347:20)"

		var errorParser = new lively.ide.ChromeErrorParser();
		
		var result = errorParser.parseStackLine(line)
		this.assert(result, "no result");
		this.assert(result.url, "no url");
		this.assert(!result.url.include("?"), "url contains ?");
		this.assert(result.sourceID, "no sourceID");
		this.assert(result.line, "no line");
		this.assert(result.linePosition, "no linePosition");

	},
	testParseErrorStack: function() {
		var errorStackString = this.errorStackString();
		
		var errorParser = new lively.ide.ChromeErrorParser();
		var result = errorParser.parseErrorStack(errorStackString)
		
		this.assert(result, "no result");
		this.assertEquals(result.length, 10,  "no result");
		this.assert(parseInt(result[0].line) > 0, "wrong line number");

	},
	testFileFragmentList: function() {
		var errorStackString = this.errorStackString();
		var errorParser = new lively.ide.ChromeErrorParser();
		var result = errorParser.fileFragmentList(errorStackString)				
		this.assert(result, "no result")

		this.assert(result[0] instanceof lively.ide.FileFragment, "no filefragment")
		
	},

	errorStackString: function() {
		try {
			pt("hallo").toString()
		} catch(e) {
			if (!e.stack)
				throw new Error('These browser does not support .stack in rrrors')
			return  e.stack.toString()
		}
		this.assert(false, "not error")
	},

	testErrorStackViewer: function() {
		var w = new lively.ide.ErrorStackViewer();
		w.setErrorStack(this.errorStackString())
	},






});
TestCase.subclass('tests.ToolsTests.CombinedModulesFileParserTest',
'default category', {
	setUp: function() {
		this.sut = new lively.ide.CombinedModulesFileParser();
	},

	testLinesOfString: function() {
		var s = "a\nb\nc";
		var lines = this.sut.linesOfString(s);
		this.assertEquals(lines.length, 3)
	},
	testCharPosOfLine: function() {
		var s = "a\nb\nc";
		var lines = this.sut.linesOfString(s);
		
		this.assertEquals(this.sut.charPosOfLine(lines, 0), 0 , "0,0")
		this.assertEquals(this.sut.charPosOfLine(lines, 1), 2 , "1,0")
		this.assertEquals(this.sut.charPosOfLine(lines, 2), 4 , "2,0")
	},
	testLineOfCharPos: function() {
		var s = "a\nb\nc";
		var lines = this.sut.linesOfString(s);
		
		this.assertEquals(this.sut.lineOfCharPos(lines, 0), 0 , "0,0")
		this.assertEquals(this.sut.lineOfCharPos(lines, 2), 1 , "1,0")
		this.assertEquals(this.sut.lineOfCharPos(lines, 4), 2 , "2,0")
	},
	testParseCombinedModulesString: function() {
		var fileOffsets = this.sut.parseCombinedModulesString(this.sut.getCombinedModulesContent());
		this.assert(fileOffsets.length > 0, 'no fileOffsets')
	},
	testModuleForCombinedLineRef: function() {

		var result = this.sut.moduleForCombinedLineRef(this.sut.getCombinedModulesContent(), 16291);
		
		this.assert(result.file, 'no file')
		this.assert(result.file, 'no offset')

	},
	testTransformFileLineAndCharPosReferenceSimple: function() {
		var simple =  {file: "cop/Layers.js", line: 49, charPos: 33};
		var simpleTrans = this.sut.transformFileLineAndCharPosReference(simple);
		this.assertEquals(simple.file, simpleTrans.file, "normal modules did get transformed")
		this.assertEquals(simple.line, simpleTrans.line, "normal modules did get transformed")
	},
	testTransformFileLineAndCharPosReferenceCombined: function() {
		// TODOD should we generate the numbers from the real error? 
		// try {
		//     var o = {};
		//     o.foo()
		// } catch(error) {
		//     LastError = error
		// }
 
		var obj =  {file: "generated/combinedModules.js", line: 16291, charPos: 3};
		var objTrans = this.sut.transformFileLineAndCharPosReference(obj);
		this.assert(obj.file != objTrans.file, "object did not get transformed")
		this.assert(obj.line != objTrans.line, "object line did not get transformed")
	},


});
TestCase.subclass('tests.ToolsTests.SimpleBrowserTest',
'testing', {
	testBrowseAndModifyClockMorph: function() {
		// small test to see if it works

		// first load livel.Examples so ClockMorph is there
		module('lively.Examples').load(true);

		// create a browser instance and open its view
		var browser = new SimpleBrowser(),
			panel = browser.open().targetMorph;

		// is ClcckMorph in the class list?
		var classList = panel.leftPane.innerMorph();
		this.assert(classList.itemList.include('ClockMorph'), 'ClockMorph not found');

		// select ClcckMorph. Is setHands in the method list?
		classList.select('ClockMorph')
		var methodList = panel.rightPane.innerMorph();
		this.assert(methodList.itemList.include('setHands'), 'setHands not found');

		// select setHands. Does the source look right?
		methodList.select('setHands')
		var methodMorph = panel.bottomPane.innerMorph();
		methodMorph.editMenuItems
		methodSource = methodMorph.textString
		this.assert(methodSource.include('setRotation(second'), 'method source is wrong');

		// now make a little modification and save
		var modifiedMethodSource = methodSource.replace('n(second', 'n(-second');
		methodMorph.setTextString(modifiedMethodSource)
		methodMorph.doSave()

		// select again. If the change we evaluated was successful it should now
		// appear in the method source
		methodList.select('setHands')
		this.assert(methodMorph.textString.include('setRotation(-second'), 'source not modified');

		// remove it, we're done
		panel.owner.remove();
	},
});
TestCase.subclass('tests.ToolsTests.LivelyIdeBrowse',
'default category', {

    testLivelyIdeBrowse: function() {    
        var sut = lively.ide.browse("lively.morphic.Morph", "onMouseDown", "lively.morphic.Events");    
       
        this.assert(sut, "could not open browser")   
        try {
            this.assertEquals(sut.targetURL, URL.codeBase + "lively/morphic/")

            this.assert(sut.pane1Selection, "no selection in Pane1")
            this.assertEquals(sut.pane1Selection.asString(), "Events.js")

            this.assert(sut.pane2Selection, "no selection in Pane2")
            this.assertEquals(sut.pane2Selection.asString(), "lively.morphic.Morph (extension)")

            // this.assertEquals(sut.pane3Selection.asString(), "event handling")
            this.assertEquals(sut.pane4Selection.asString(), "onMouseDown (proto)")
        } finally {
            if(sut) sut.view.remove() // close window
        }    
    }
});

}) // end of module