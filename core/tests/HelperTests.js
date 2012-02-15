module('tests.HelperTests').requires('lively.TestFramework', 'lively.Helper').toRun(function() {

TestCase.subclass('tests.HelperTests.XMLConverterTest', {

	toXML: function(string) {
		return new DOMParser().parseFromString(string, "text/xml").documentElement;
	},

	setUp: function($super) {
		$super();
		this.sut = new lively.Helper.XMLConverter();
	},

	test01XMLNodeToJSON: function() {
		var xml = this.toXML('<test/>');
		var result = this.sut.convertToJSON(xml);
		this.assert(result.tagName, 'test');
		this.assertEquals(Properties.all(result).length, 1);
	},

	test02XMLNodeWithAttributesToJSON: function() {
		var xml = this.toXML('<test id="23" x="foobar" />');
		var result = this.sut.convertToJSON(xml);
		this.assertEquals(result.id, '23');
		this.assertEquals(result.x, 'foobar');
	},

	test03XMLNodeWithAttributesAndChildrenToJSON: function() {
		var xml = this.toXML('<test x="foo"><test2/><test3 abc="def"/></test>');
		var result = this.sut.convertToJSON(xml);
		this.assertEquals(result.children.length, 2);
		this.assertEquals(result.children[0].tagName, 'test2');
		this.assertEquals(result.children[1].abc, 'def');
	},

	test03CDATAAndText: function() {
		var xml = this.toXML('<test><![CDATA[foobar\]\]\> baz</test>');
		var result = this.sut.convertToJSON(xml);
		this.assertEquals(result.children[0].tagName, 'cdataSection');
		this.assertEquals(result.children[0].data, 'foobar');
		this.assertEquals(result.children[1].tagName, 'textNode');
		this.assertEquals(result.children[1].data, ' baz');
	},

	test04JStoXML: function() {
		var jsObj = {tagName: 'script', type: 'foo', 'xlink:href': 'foo.js'};
		var nsMapping = {xlink: Namespace.XLINK};
		var result = this.sut.convertToXML(jsObj, nsMapping, Global.document);
		this.assertEquals(result.tagName, 'script');
		this.assertEquals(result.getAttribute('type'), 'foo');
		this.assertEquals(result.getAttributeNS(Namespace.XLINK, 'href'), 'foo.js');
	},

	test05JStoXMLWithChildNodesAndTextContent: function() {
		var jsObj = {
			tagName: 'foo',
			children: [{
				tagName: 'bar',
				children: [{
					tagName: 'textNode',
					data: 'Hello '
				}, {
					tagName: 'cdataSection',
					data: 'World'
				}]
			}]
		};
		var nsMapping = {};
		var result = this.sut.convertToXML(jsObj, nsMapping, Global.document);
		this.assertEquals(result.tagName, 'foo');
		this.assertEquals(result.childNodes.length, 1);
		this.assertEquals(result.childNodes[0].childNodes.length, 2);
		this.assertEquals(result.childNodes[0].textContent, 'Hello World');
	},

});

}); // end of module