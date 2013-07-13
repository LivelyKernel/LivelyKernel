module('lively.tests.ToolsTests').requires('lively.TestFramework', 'lively.ide', 'tests.SerializationTests').toRun(function() {

var tests = lively.tests;

Object.extend(tests.ToolsTests, {
	createDummyNamespace: function() {
		console.assert(!tests.ToolsTests['testNS'], 'testNS already existing');
		// creating 5 namespaces-    namespace('testNS.one', tests.ToolsTests);    namespace('testNS.two', tests.ToolsTests);
		module('tests.ToolsTests.testNS.three.threeOne');
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

TestCase.subclass('lively.tests.ToolsTests.ModuleWrapperTest', {

	testCreateWrapper: function() {
		var sut = lively.ide.ModuleWrapper.forFile('foobar.js');
		this.assertEquals(sut.moduleName(), 'foobar');
		this.assertEquals(sut.type(), 'js');
		var sut = lively.ide.ModuleWrapper.forFile('lively/parser.ometa');
		this.assertEquals(sut.moduleName(), 'lively.parser');
		this.assertEquals(sut.fileName(), 'lively/parser.ometa');
		this.assertEquals(sut.type(), 'ometa');
	}

});

TestCase.subclass('lively.tests.ToolsTests.KeyboardTest', {

    shouldRun: false,

    testStartKeyWatcher: function() {
		var keyWatcher = lively.morphic.Morph.makeRectangle(0,0,100,20);
		keyWatcher.setFill(Color.red);

		var label = new lively.morphic.Text(keyWatcher.bounds().translatedBy(0,50));
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
        lively.morphic.World.current().hands.first().setKeyboardFocus(keyWatcher);
    },
});

TestCase.subclass('lively.tests.ToolsTests.MouseEventTest', {
	shouldRun: false,
	testMouseEvents: function() {
		var mouseWatcher = lively.morphic.Morph.makeRectangle(0,0,100,20);
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
		lively.morphic.World.current().hands.first().setKeyboardFocus(mouseWatcher);
	},
});

TestCase.subclass('lively.tests.ToolsTests.ChromeErrorStackParserTest',
'tests', {
	testParseErrorStackLine: function() {
		var line = "    at lively.morphic.Text.<anonymous> (http://www.lively-kernel.org/repository/webwerkstatt/lively/ide/SyntaxHighlighting.js?fx1291814980471:347:20)"

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
	}

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
	}

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
	}
});

}) // end of module
