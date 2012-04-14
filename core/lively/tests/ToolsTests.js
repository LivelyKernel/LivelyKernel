module('lively.tests.ToolsTests').requires(
    'lively.TestFramework',
    'lively.ide',
    'tests.SerializationTests',
    'lively.ide.AutoCompletion').toRun(function() {

var tests = lively.tests;

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

TestCase.subclass('lively.ide.tests.FileParserTests.FileParserTest', {

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

TestCase.subclass('lively.tests.ToolsTests.ChangesTests',
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
		var className = 'lively.tests.ToolsTests.DummyForChangeTests1';
		this.cleanUpItems.push(className);
		Object.subclass(className);
		var xml = stringToXML('<class name="' + className +'" super="Object"><proto name="m1"><![CDATA[function() {1+2}]]></proto></class>'),
			change = this.parser.createChange(xml).getProtoChanges().first(),
			m = change.evaluate();
		this.assert(m instanceof Function);
		this.assert(Class.forName(className).functionNames().include('m1'), 'no function');
	},

	testEvaluateClassChange: function() {
		var className = 'lively.tests.ToolsTests.DummyForChangeTests2';
		this.cleanUpItems.push(className);
		var xml = stringToXML('<class name="'+ className +'" super="Object"><proto name="m1"><![CDATA[function() {1+2}]]></proto></class>'),
			change = this.parser.createChange(xml),
			klass = change.evaluate();
		this.assert(klass && Class.isClass(klass));
		this.assert(klass.functionNames().include('m1'), 'no function');
	},

	testEvalauteClassChangeWithStaticElem: function() {
		var className = 'lively.tests.ToolsTests.DummyForChangeTests3';
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
		var objName = 'lively.tests.ToolsTests.DummyObj';
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

tests.ToolsTests.FileFragmentTest.subclass('lively.tests.ToolsTests.ChangesConversionTest',
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

TestCase.subclass('lively.tests.ToolsTests.ModuleWrapperTest', {

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

tests.SerializationTests.SerializationBaseTestCase.subclass('lively.tests.ToolsTests.ChangeSetTests',
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
		var className = 'lively.tests.ToolsTests.DummyForChangeTests4';
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
		var newChange1 = DoitChange.create('lively.tests.ToolsTests.ChangeSetTests.doit1WasRun = true');
		var newChange2 = DoitChange.create('lively.tests.ToolsTests.ChangeSetTests.doit2WasRun = true');
		var cs = ChangeSet.fromWorld(this.worldMorph);
		cs.addSubElements([newChange1, newChange2]);
		var init = cs.getInitializer();
		init.setDefinition('lively.tests.ToolsTests.ChangeSetTests.initializerWasRun = true');
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
		var newChange1 = DoitChange.create('lively.tests.ToolsTests.ChangeSetTests.doit1WasRun = true');
		var newChange2 = DoitChange.create('lively.tests.ToolsTests.ChangeSetTests.doit2WasRun = true');
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

TestCase.subclass('lively.tests.ToolsTests.KeyboardTest', {

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

TestCase.subclass('lively.tests.ToolsTests.MouseEventTest', {
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

TestCase.subclass('lively.tests.ToolsTests.TabCompletionTest', {

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

TestCase.subclass('lively.tests.ToolsTests.TabCompletionLayerTest',
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

TestCase.subclass('lively.tests.ToolsTests.ChromeErrorStackParserTest',
'tests', {
	testParseErrorStackLine: function() {
		var line = "    at TextMorph.<anonymous> (http://www.lively-kernel.org/repository/webwerkstatt/lively/ide/SyntaxHighlighting.js?fx1291814980471:347:20)"

		var errorParser = new lively.ide.ErrorViewer.ChromeErrorParser();

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

		var errorParser = new lively.ide.ErrorViewer.ChromeErrorParser();
		var result = errorParser.parseErrorStack(errorStackString)

		this.assert(result, "no result");
		this.assertEquals(result.length, 10,  "no result");
		this.assert(parseInt(result[0].line) > 0, "wrong line number");

	},
	testFileFragmentList: function() {
		var errorStackString = this.errorStackString();
		var errorParser = new lively.ide.ErrorViewer.ChromeErrorParser();
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
		var w = new lively.ide.ErrorViewer.ErrorStackViewer();
		w.setErrorStack(this.errorStackString())
	},

});

TestCase.subclass('lively.tests.ToolsTests.CombinedModulesFileParserTest',
'default category', {
	setUp: function() {
		this.sut = new lively.ide.ErrorViewer.CombinedModulesFileParser();
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

TestCase.subclass('lively.tests.ToolsTests.SimpleBrowserTest',
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

}) // end of module
