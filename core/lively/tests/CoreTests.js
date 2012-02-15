module('lively.tests.CoreTests').requires('lively.TestFramework').toRun(function() {


/**
 * @class ConnectModelTest
 * Tests for understanding Record, Relay and View Behavior
 */
TestCase.subclass('lively.tests.CoreTests.ConnectModelTest', {

    testAddObserver: function() {
        var formalModel = Record.newPlainInstance({MyValue: "Hello World"});
        var view = new View();
        var countUpdate = 0;
        
        view.onViewValueUpdate = function() {
           countUpdate = countUpdate + 1;
        };
        
        formalModel.addObserver(view, {MyValue: '!ViewValue'});
        
        this.assertEquals(countUpdate, 0, "onMyTextUpdate was called prematurely");        
        formalModel.setMyValue("once");        
        this.assertEquals(countUpdate, 1, "onMyTextUpdate was not called");        
        
        var observers = formalModel["MyValue$observers"]
        this.assertEquals(observers.length, 1, "wrong number of registered observers");
        
    },
    
    testNotifyObserversOf: function() {
		var formalModel1 = Record.newPlainInstance({MyValue1: "Hello World 1"});
		var formalModel2 = Record.newPlainInstance({MyValue2: "Hello World 2"});

        formalModel1.addObserver(formalModel2, {MyValue1: '=setMyValue2'}); 

		// no kickstart here...
		//this.assertEquals(formalModel1.getMyValue1(), formalModel2.getMyValue2(), "value was not updated initialy");

		var value = "Hallo Welt";
		formalModel1.setMyValue1(value);
		this.assertEquals(formalModel2.getMyValue2(), value, "value2 was not update after setting value1");
	},

    testCyclicNotifyObserversOf: function() {
		var formalModel1 = Record.newPlainInstance({MyValue1: "Hello World 1"});
		var formalModel2 = Record.newPlainInstance({MyValue2: "Hello World 2"});

        formalModel1.addObserver(formalModel2, {MyValue1: '=setMyValue2'}); 
		formalModel2.addObserver(formalModel1, {MyValue2: '=setMyValue1'});

		// no kickstart here...
		//this.assertEquals(formalModel1.getMyValue1(), formalModel2.getMyValue2(), "value was not updated initialy");

		var value = "Hallo Welt";
		formalModel1.setMyValue1(value);
		this.assertEquals(formalModel2.getMyValue2(), value, "value2 was not update after setting value1");
	},

});

TestCase.subclass('lively.tests.CoreTests.TestModel', {

	testSetterSource: function() {
		var calls = 0; var test = this;
		var m1 = Record.newPlainInstance({MyValue: 0});
		var m2 = Record.newPlainInstance({MyValue: 1});
		var obj = {onOtherValueUpdate: function(v, source) { test.localFunc(v, source) }};
		Object.extend(obj, ViewTrait);
		obj.relayToModel(m1, {OtherValue: "MyValue"});
		obj.relayToModel(m2, {OtherValue: "MyValue"});

		this.localFunc = function(v, source) { calls++; test.assertIdentity(m1, source) };
		m1.setMyValue(2);
		this.localFunc = function(v, source) { calls++; test.assertIdentity(m2, source) };
		m2.setMyValue(3);
		this.assertEquals(calls, 2);
	},
	
	testNodeRecord: function() {
		var rec = Record.newNodeInstance({Foo: null});
		this.assert(rec.Foo$Element, "DOM node is missing");
		var string = "HelloString";
		rec.setFoo(string);
		this.assert(rec.getFoo(), string, "string as node content is broken")
		var obj = {bar: "hello", isJSONConformant: true};
		rec.setFoo(obj);
		this.assert(rec.Foo$Element, "DOM node for obj is missing");
		this.assert(rec.getFoo(), "no foo")
		this.assert(rec.getFoo().bar, "no foo bar")
	},
	
	testStoreReferenceInNodeRecord: function() {
			var rec = Record.newNodeInstance({Foo: null});
			var widget = new Widget();
			rec.setFoo(widget);
			this.assertIdentity(rec.getFoo(), widget);
	},
	

	testSetRecordFieldWithWrapper: function() {
		var rec = Record.newNodeInstance();
		var widget = new Widget();
		rec.setRecordField("Foo", widget);
		this.assertIdentity(rec["Foo$Element"], widget);
	},
	
	testConverter: function() {
		var value = {bar: "Hello", isJSONConformant: true};
		var node = Converter.encodeProperty("Foo", value);
		this.assert(node, "no node");
	},

	testConvertArray: function() {
		var value = ["Hello"];
		var node = Converter.encodeProperty("Foo", value);
		this.assert(node, "no node");
		this.assertEquals(node.textContent, '["Hello"]');
	},

	testConvertArrayWithReference: function() {
		var ref = new Widget();
		var value = ["Hello", ref];
		var node = Converter.encodeProperty("Foo", value);
		this.assert(node, "no node");
		this.assertEquals(node.textContent, '["Hello","url(#' +ref.id()+')"]');
	},
	
	testConvertArrayWithReferenceBack: function() {
		var ref = new Widget();
		var value = ["Hello", ref];
		var node = Converter.encodeProperty("Foo", value);
		
	},
	
	xtestConvertWrapper: function() {
		var rec = Record.newNodeInstance({Foo: null});
		var ref = new DummyCopierObject();
		var node = Converter.encodeProperty("Foo", ref);
		this.assert(node, "no node");
	},


});


lively.data.Wrapper.subclass('DummyCopierObject', {

	doNotCopyProperties: ['id', 'rawNode', 'child', 'children'],

	initialize: function() {
		this.a = "Hello";
		this.b = 23;
		this.rawNode =  NodeFactory.create("g");
		this.setId(this.newId());
	},
	
	copyFrom: function($super, copier, other) {
		$super(copier, other);
		this.setId(this.newId());
		copier.addMapping(other.id(), this);
		
		this.a = other.a;
		this.b = other.b;
		this.shallowChild = other.shallowChild;
		
		copier.smartCopyProperty("child", this, other);	
		copier.smartCopyProperty("children", this, other);
	debugger	
		copier.copyProperties(this, other);

		return this;
	},
});	

TestCase.subclass('lively.tests.CoreTests.CopierTest', {
	
	createObjectStructure: function() {
		var objects = {
			obj1: new DummyCopierObject(),
			obj2: new DummyCopierObject(),
			obj3: new DummyCopierObject(),
		}
		objects.obj1.child = objects.obj2;
		objects.obj1.children = [objects.obj2, objects.obj3];
		return objects
	},
	
	testSimpleCopy: function() {
		var obj = new DummyCopierObject();
		var copy = obj.copy(new Copier());
		this.assertIdentity(obj.a, copy.a);
		this.assertIdentity(obj.b, copy.b);
	},
	
	testShallowCopy: function() {
		var obj = new DummyCopierObject();
		var obj2 = new DummyCopierObject();
		obj.shallowChild = obj2;
		var copy = obj.copy(new Copier());
		this.assertIdentity(copy.shallowChild, obj2, "copy.shallowChild is not obj2");
	},
	
	
	testSmartCopy: function() {
		var obj = new DummyCopierObject();
		var obj2 = new DummyCopierObject();
		obj.child = obj2;
		
		var copy = new DummyCopierObject();
		var copier = new Copier();
		this.assert(copier.lookup(obj2.id()) === undefined, "lookup found a false positive...");
		copier.smartCopyProperty("child", copy, obj);		
		this.assert(copy.child !== obj2, "copy.child is obj2");
		this.assert(copy.child.id() !== obj2.id(), "copy.child.id() is obj2.id()");

	},
testLookupOrCopy: function() {

	var obj = new DummyCopierObject();
	var copier = new Copier();

	this.assert(copier.lookup(obj) === undefined, "false positive in lookup");

	var copy = copier.lookUpOrCopy(obj);

	copier.finish()

	this.assert(obj, "no copy")

	this.assert(obj !== copy, "copy is original")
	this.assert(obj.id() !== copy.id(), "copy id is original id")

},


	testNestedCopy: function() {
		var objects = this.createObjectStructure();
		var copy = objects.obj1.copy(new Copier());
		
		this.assert(copy.child !== objects.obj2, "copy.child is obj2");
		this.assert(copy.child.id() !== objects.obj2.id(), "copy.child.id() is obj2.id()");

		this.assert(copy.children.first().id() === copy.child.id(), "obj2 got copied twice");
		this.assert(copy.children[1].id() !== objects.obj1.children[1].id(), "obj3 in collection stayed the same");
	},

	testCopyArray: function() {
		var objects = this.createObjectStructure();
		objects.obj1.customarray = [objects.obj2, objects.obj3, "Hello", this];
		var copy = objects.obj1.copy(new Copier());
		this.assert(copy.customarray, "array got not copied");
		this.assert(objects.obj1.customarray !== copy.customarray, "array stayed the same ");
		this.assert(objects.obj1.customarray[0] !== copy.customarray[0], "array[0] stayed the same");

	},

	testCyclicCopy: function() {
		var obj = new DummyCopierObject();
		var obj2 = new DummyCopierObject();
		var obj3 = new DummyCopierObject();
		obj.child = obj2;
		obj.child.child = obj; // cycle
		obj.children = [obj2, obj3]; // 2. cycle
		
		var copy = obj.copy(new Copier());
		
		this.assert(copy.child !== obj2, "copy.child is obj2");
		this.assert(copy.child.id() !== obj2.id(), "copy.child.id() is obj2.id()");

		this.assert(copy.children.first().id() === copy.child.id(), "obj2 got copied twice");
		this.assert(copy.children[1].id() !== obj.children[1].id(), "obj3 in collection stayed the same");

		this.assert(copy.child.child.id() === copy.id(), "obj cycle got copied wrong");

		// this.assert(copy.children[2].id() === copy.id(), "obj cycle 2 got copied wrong");
	},
	
	testCopyNodeRecord: function() {
		var record  =  Record.newNodeInstance({FooBar: ""});
		record.addField("DynField");
		record.setFooBar("Hello");
		record.setDynField("Tada");
		var copier = new Copier()
		var copy = record.copy(copier);
		this.assert(copy.getFooBar && copy.setFooBar, "getter and setter got lost");
		this.assertEquals(record.getFooBar(), copy.getFooBar(), "values are not copied");
		this.assertEquals(record.getDynField(), copy.getDynField(), "dyn values are not copied");
		this.assert(copier.lookup(record.id()), " model is not registered in copier");
	},
	
	testCopyRelay: function() {
		var record  =  Record.newNodeInstance({FooBar: ""});
		record.setFooBar("Hello");
		var relay = record.newRelay({FooBar: "Foo"});
		this.assert(relay instanceof Relay, "relay is no Relay");
		this.assert(relay.copy , "relay has no copy function");
		var copy = relay.copy(new Copier());
		this.assert(copy !== relay, "relay and copy are identical");
		this.assert(copy.delegatee === relay.delegatee, "relay.delegatee and copy.delegatee are not identical");
	},
	
	testCopyTextMorphWithRelay: function() {
		var model  =  Record.newNodeInstance({FooBar: ""}),
			morph = new TextMorph(new Rectangle(0, 0, 0, 0));
		morph.connectModel(model.newRelay({Text: "FooBar"}));
debugger
		var copier = new Copier(),
			modelCopy = model.copy(copier),
			morphCopy = morph.copy(copier);
		this.assert(morphCopy.formalModel, " morph copy has no formalModel");
		this.assertIdentity(morphCopy.getModel(), modelCopy, "morphCopy model (" + morphCopy.formalModel + ") is not modelCopy ");
		
		this.assert(morphCopy.getActualModel().id() != morph.getActualModel().id(), "copy model has same id");
		
		// this.assertEquals(morph.rawNode.childNodes.length, morphCopy.rawNode.childNodes.length, "number of raw childNodes changed");

		// this.assert(morphCopy.rawNode.childNodes.length == morph.rawNode.childNodes.length, "morphCopy.rawNode.childNodes got messed up");
	
	},

	testCopyTextMorph: function() {
		var morph = new TextMorph(new Rectangle(0, 0, 0, 0));
		var morphCopy = morph.copy(new Copier());
		// we don't copy selection any more...
		// this.assertEquals(morphCopy.rawNode.childNodes.length, morph.rawNode.childNodes.length, "morphCopy.rawNode.childNodes got messed up");		
	},

	testCopyClipMorph: function() {
		var clipMorph = new ClipMorph(new Rectangle(10, 10, 50, 50));
		var morph = Morph.makeRectangle(new Rectangle(25, 25, 100, 100));
		clipMorph.addMorph(morph);
		var clipCopy = clipMorph.copy(new Copier());
		var morphCopy = clipCopy.submorphs[0];
		this.assert(clipCopy.clip !== clipMorph.clip, "clip is the same");
		this.assert(clipCopy.clip.rawNode, "clip has no rawNode");
		
	},

	testMorphWithSubnode: function() {
		var morph = Morph.makeRectangle(new Rectangle(0, 0, 10, 10));
		morph.innerMorph = Morph.makeRectangle(new Rectangle(0, 0, 10, 10));
		morph.addMorph(morph.innerMorph);
		var morphCopy = morph.copy(new Copier());
		this.assert(morphCopy.rawNode.childNodes.length == morph.rawNode.childNodes.length, "morphCopy.rawNode.childNodes got messed up");
	},
	
	testCopyTwoObjectsWithSameCopier: function() {
		var objects = {
			obj1: new DummyCopierObject(),
			obj2: new DummyCopierObject(), 
			foreign: new DummyCopierObject(), 	
		};
		objects.obj1.other = objects.obj2;
		objects.obj2.other = objects.obj1;
	
		objects.obj1.foreign = objects.foreign;

		var copier = new Copier();
		var copy1 = objects.obj1.copy(copier);
		var copy2 = objects.obj2.copy(copier);
		copier.patchReferences();
		
		this.assert(copy1.other === copy2, "copy1 broken");
		this.assert(copy2.other === copy1, "copy2 broken");
		
		this.assert(copy1.foreign === objects.foreign, "foreign broken");	
	},

	testCopyNullProperty: function() {
		var sut = new Copier();
		var original = {p: null};
		var copy = {};
		sut.copyProperty("p", copy, original);
		this.assertIdentity(copy.p, null)
	},
	
	testCopyPointerEvents: function() {
		var sut = Morph.makeRectangle(0,0,100,100);
		this.assert(sut.getTrait("pointer-events") !== "none", "sut setup broken")
		sut.setTrait("pointer-events", "none");
		var copy = sut.duplicate()
		this.assertEquals(copy.getTrait("pointer-events"), "none")
	},
	
});
TestCase.subclass('lively.tests.CoreTests.ClipboardCopierTest',
'default category', {
	testCopyMorphsAsXMLString: function() {

		var sut = new ClipboardCopier()
		m1 = Morph.makeRectangle(0,0,100,100).applyStyle({fill: Color.red});
		m2 = Morph.makeRectangle(0,0,100,100).applyStyle({fill: Color.yellow});
		m1.other = m2;
		m2.other = m1;
		var xmlString = sut.copyMorphsAsXMLString([m1,m2]);

		

	},
});


TestCase.subclass("lively.tests.CoreTests.CopyMorphTest", {

	testMorphCustomAttribut: function() {
		var morph = Morph.makeRectangle(new Rectangle(0, 0, 10, 10));
		morph.customString = "Hello";
		morph.customObject = { a: "Hello", b: 4};
		morph.customArray = ["Hello", morph.customObject, 3];
		morph.name = "testMorphCustomAttributMorph"
		var morphCopy = morph.copy(new Copier());
		this.assertEquals(morphCopy.customString, morph.customString, " customString broken");
		this.assertEquals(morphCopy.customObject.a, "Hello", " customObject broken");
		this.assertEquals(morphCopy.customArray.length, 3, " customArray broken");
	},
})
	



TestCase.subclass("lively.tests.CoreTests.EncodeWrapperJSONTest", {

	setUp: function() {
		this.ref = WorldMorph.current();
		this.value = [this.ref];
	},
		
	testEncodeWrapper: function() {
		this.string = JSON.serialize(this.value, Converter.wrapperAndNodeEncodeFilter)
		this.assertEquals(this.string, '["url(#' + WorldMorph.current().id() + ')"]', "url does not match")
	},
	
	testDecodeWrapper: function() {
		this.string = JSON.serialize(this.value, Converter.wrapperAndNodeEncodeFilter)
		this.value2 = JSON.unserialize(this.string, Converter.wrapperAndNodeDecodeFilter)
		this.assertIdentity(this.value2[0], this.ref, "ref is not identical")
	},

	testDecodeWrapperComplex: function() {
		this.value = [3, [this.ref, 4, {bla: this.ref}]]
		this.string = JSON.serialize(this.value, Converter.wrapperAndNodeEncodeFilter)
		this.value2 = JSON.unserialize(this.string, Converter.wrapperAndNodeDecodeFilter)
	},

	testResolveUriToObject: function() {
		var root = Morph.makeRectangle(new Rectangle(0,0,500,500));
		var child =  Morph.makeRectangle(new Rectangle(0,0,100,100));
		root.addMorph(child);
		this.assertIdentity(root.resolveUriToObject(child.id()), child, "relove is broken")
	},
	
	// known to fail ... 
	XtestStoreReferenceInRecordField: function() {
		var ref = WorldMorph.current();
		var record = Record.newNodeInstance({Foo: null, Bar: null});
		record.setBar([3, ref]);
		this.assertIdentity(record.getBar()[1], ref, "deep referencing in node records is broken")
	},	
	
});

TestCase.subclass('lively.tests.CoreTests.DocLinkConversionTest', {

	exampleDoc: function() {
		return stringToXML(
		'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n' + 
		'\n' + 
		'<html xmlns="http://www.w3.org/1999/xhtml">\n' + 
		'<head>\n' + 
		'<title>Developer\'s Journal - Lively HTML</title>\n' + 
		'</head>\n' + 
		'\n' + 
		'<body style="margin:0px">\n' + 
		'\n' + 
		'<svg xmlns="http://www.w3.org/2000/svg" xmlns:lively="http://www.experimentalstuff.com/Lively" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xhtml="http://www.w3.org/1999/xhtml" id="canvas" width="100%" height="100%" xml:space="preserve" xmlns:xml="http://www.w3.org/XML/1998/namespace" zoomAndPan="disable">\n' + 
		'<title>Lively Kernel canvas</title>\n' + 
		'<defs>\n' + 
		'<script type="text/ecmascript" xlink:href="../../lively/JSON.js"/>\n' + 
		'<script name="codeBase"><![CDATA[Config.codeBase=Config.getDocumentDirectory()+\'../../\'\]\]></script>\n' + 
		'<script name="codeBase"><![CDATA[Config.codeBase=Config.getDocumentDirectory()+"../../"\]\]></script>\n' + 
		'<script type="text/ecmascript" xlink:href="../../lively/localconfig.js"/>\n' + 
		'<script type="text/ecmascript" xlink:href="../../lively/Base.js"/>\n' + 
		'</defs>\n' + 
		'\n' + 
		'\n' + 
		'<defs id="SystemDictionary"></defs>\n' + 
		'<g type="WorldMorph" id="1:WorldMorph" transform="translate(0,0)"></g></svg>\n' + 
		'\n' + 
		'</body>\n' + 
		'</html>');
	},

	test01ConvertDepth: function() {
		var d = this.exampleDoc();
		var codeBase = 'http://www.lively-kernel.org/repository/webwerkstatt/';
		var toDir = 'http://lively-kernel.org/repository/webwerkstatt/draft/';
		var sut = new DocLinkConverter(codeBase, toDir);
		var newDoc = sut.convert(d);
		var scripts = $A(newDoc.getElementsByTagName('script'));

		this.assertEquals(4, scripts.length); 'remove the duplicate'
		this.assertEquals('../lively/JSON.js', scripts[0].getAttribute('xlink:href'));
		this.assertEquals('Config.codeBase=Config.getDocumentDirectory()+\'../\'', scripts[1].textContent);
		this.assertEquals('../lively/localconfig.js', scripts[2].getAttribute('xlink:href'));
	},

	test02ConvertPath: function() {
		var codeBase = 'http://www.lively-kernel.org/repository/webwerkstatt/';
		var toDir = 'http://www.lively-kernel.org/repository/webwerkstatt/draft/';
		var sut = new DocLinkConverter(codeBase, toDir);
		var expected = '../lively/JSON.js'
		var result = sut.convertPath('lively/JSON.js');
		this.assertEquals(expected, result);
		result = sut.convertPath('../lively/JSON.js');
		this.assertEquals(expected, result);
		result = sut.convertPath('../../lively/JSON.js');
		this.assertEquals(expected, result);
		result = sut.convertPath('JSON.js');
		this.assertEquals(expected, result);
	},

	test03ComputeRelativePathFromBase: function() {
		var codeBase = 'http://foo.org/bar/',
			toDir = 'http://www.foo.org/bar/baz/',
			sut = new DocLinkConverter(codeBase, toDir),
			result = sut.relativeLivelyPathFrom(codeBase, toDir);
		this.assertEquals('../lively/', result);
		toDir = 'http://www.foo.org/bar/baz/xxx/xxx/';
		result = sut.relativeLivelyPathFrom(codeBase, toDir);
		this.assertEquals('../../../lively/', result);
		toDir = codeBase;
		result = sut.relativeLivelyPathFrom(codeBase, toDir);
		this.assertEquals('lively/', result);
	},

	test04ExtractFilename: function() {
		var sut = new DocLinkConverter('http://foo', 'http://foo/bar');
		var url = 'xxx/a/y/lively/a?_-0009c.js'
		var result = sut.extractFilename(url);
		this.assertEquals('a?_-0009c.js', result);
		url = 'abc.js'
		result = sut.extractFilename(url);
		this.assertEquals('abc.js', result);
	},

	test05CreateCodeBaseDef: function() {
		var sut = new DocLinkConverter('http://foo', 'http://foo/bar');
		var result = sut.createCodeBaseDef('../../');
		this.assertEquals('Config.codeBase=Config.getDocumentDirectory()+\'../../\'', result);
	},
	test06ConvertDifferentDomains: function() {
		var d = this.exampleDoc();
		var codeBase = 'http://www.lively-kernel.org/repository/webwerkstatt/';
		var toDir = 'http://www.new-host.com/path1/path2/';
		var sut = new DocLinkConverter(codeBase, toDir);
		var newDoc = sut.convert(d);
		var scripts = $A(newDoc.getElementsByTagName('script'));

		this.assertEquals(codeBase + 'lively/JSON.js', scripts[0].getAttribute('xlink:href'));
		this.assertEquals(codeBase + 'lively/localconfig.js', scripts[2].getAttribute('xlink:href'));
	},


});
TestCase.subclass('LoaderTest',
'running', {
	setUp: function() {
		this.sut = Loader;
	},
	getRelativeURLtoBootstrap: function() {
		return $A(this.sut.getScripts())
			.collect(function(el) { return el.getAttributeNS(Namespace.XLINK, 'href') })
			.detect(function(urlString) { return urlString.endsWith('bootstrap.js') })
	},

},
'tests', {
	testAbsoluteCanBeLoaded: function() {
		var sut = Loader;
		this.assert(sut.scriptInDOM(Config.codeBase + 'lively/Main.js'), 'absolute lively.Main cannot be found');
		this.assert(sut.scriptInDOM(Config.codeBase + 'lively/Main.js?123456'), 'absolute lively.Main with query cannot be found');
		this.assert(sut.scriptInDOM(lively.Main.uri()), 'absolute lively.Main cannot be found 2');

		this.assert(!sut.scriptInDOM(Config.codeBase + 'foobarbaz/Main.js'), 'absolute non existing module URL is recognized as loaded');
	},
	testRelativeURLs: function() {
		var url = this.getRelativeURLtoMain();
		this.assert(this.sut.scriptInDOM(url), 'cannot reslve relative url for loaded module');
	},
	xtestMakeAbsolute: function() {
		var expected = URL.codeBase.withFilename('lively/bootstrap.js');
		var mainURL = this.getRelativeURLtoBootstrap();
		this.assert(mainURL, 'Cannot setup test because cannot find bootstrap url element');

		this.assertEquals(expected, this.sut.makeAbsolute(mainURL));
		this.assertEquals(expected, this.sut.makeAbsolute(Config.codeBase + 'lively/foo/../Main.js'));
	},
});

console.log('loaded CoreTest.js');

}) // end of module