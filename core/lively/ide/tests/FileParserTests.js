module('lively.ide.tests.FileParserTests').requires('lively.TestFramework', 'lively.ide').toRun(function() {

TestCase.subclass('lively.ide.tests.FileParserTests.JsParserTest', {

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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.JsParserTest1', {

    testParseClass: function() {    // Object.subclass
        var src = 'Object.subclass(\'Dummy\', {\n' +
            '\tsetUp: function() { lively.ide.tests.FileParserTests.createDummyNamespace() },\n' +
            '\ttearDown: function() { lively.ide.tests.FileParserTests.removeDummyNamespace() }\n' +
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
            '\tsetUp: function() { lively.ide.tests.FileParserTests.createDummyNamespace() },\n' +
            'formals: ["Pane1Content",\n\t\t"Pane1Selection"],\n' +
            '\ttearDown: function() { lively.ide.tests.FileParserTests.removeDummyNamespace() }\n' +
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
    testParseFunction3: function() {    // function abc() {...}
        var src = 'function bar() {\n\n}'
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('functionDef');
            this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'bar');
        this.assertIdentity(descriptor.startIndex, 0);
        this.assertIdentity(descriptor.stopIndex, src.lastIndexOf('}'));
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
        var src = 'lively.ide.tests.FileParserTests.ScriptEnvironment.open = function() {};'
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('propertyDef');
        this.assert(descriptor, 'no descriptor');
        this.assertEquals(descriptor.name, 'open');
        this.assertEquals(descriptor.className, 'lively.ide.tests.FileParserTests.ScriptEnvironment');
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
        var src = 'Object.extend(lively.ide.tests.FileParserTests.ScriptEnvironment, { \nopen: function() {\n\t\t1+2\n\t}\n});';
        this.sut.src = src;
        var descriptor = this.sut.callOMeta('klassExtensionDef');
        this.assert(descriptor, 'no descriptor');
        this.assert(descriptor.name.startsWith('lively.ide.tests.FileParserTests.ScriptEnvironment'));
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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.JsParserParsesCoreTest', {

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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.JsParserTest2', {

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
        var src = '/*' + '\n' +
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
        var src = 'module(\'lively.TileScripting\').requires(\'lively.Helper\').toRun(function(lively.ide.tests.FileParserTests) {\n\nMorph.addMethods({})\n});';
        var result = this.sut.parseSource(src);

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].type, 'moduleDef');
        this.assertEquals(result[0].name, 'lively.TileScripting');
        this.assertEquals(result[0].startIndex, 0);
        this.assertEquals(result[0].stopIndex, src.length-1);
    },

	  testParseModuleAndClass: function() {
        var src = 'module(\'lively.xyz\').requires(\'abc.js\').toRun(function(lively.ide.tests.FileParserTests) {\n\Object.subclass(\'Abcdef\', {\n}); // this is a comment\n});';
        var result = this.sut.parseSource(src);

        this.assertEquals(result.length, 1);
        this.assertEquals(result[0].type, 'moduleDef');
        this.assertEquals(result[0].stopIndex, src.length-1);
    },

    testParseModuleAndUsingDef: function() { // /* ... */ || // ...
        var src = 'module(\'lively.TileScripting\').requires(\'lively/Helper.js\').toRun(function(lively.ide.tests.FileParserTests) {\n\
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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.JsParserTest3', {

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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.ContextJSParserTest', {
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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.TraitsParserTest', {
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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.MethodCategoryParseTest', {

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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.OMetaParserTest', {

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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.OMetaParserTestLKFile', {

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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.ChunkParserTest', {

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

lively.ide.tests.FileParserTests.JsParserTest.subclass('lively.ide.tests.FileParserTests.FileFragmentTest', {

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
		    lively.morphic.World.prototype.alert = this.oldAlert;
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

lively.ide.tests.FileParserTests.FileFragmentTest.subclass('lively.ide.tests.FileParserTests.FileFragmentNodeTests', {

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


}) // end of module
