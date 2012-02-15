module('lively.tests.BootstrapTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.tests.BootstrapTests.WorldDataTest',
'accessing', {
	xmlDoc: function() {
var str =  '<html xmlns=\"http://www.w3.org/1999/xhtml\"> \n\
\n\
<head> <title>Lively Kernel</title> <script src=\"lively/bootstrap.js\"></script></head> \n\
<body style=\"margin:0px\"> \n\
<!-- <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\"/> --> \n\
<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:lively=\"http://www.experimentalstuff.com/Lively\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xhtml=\"http://www.w3.org/1999/xhtml\" id=\"canvas\" width=\"100%\" height=\"100%\" xml:space=\"preserve\" xmlns:xml=\"http://www.w3.org/XML/1998/namespace\" zoomAndPan=\"disable\"> \n\
<title>Lively Kernel canvas</title> \n\
\n\
<defs id=\"SystemDictionary\"></defs>\n\
\n\
<g type=\"WorldMorph\" id=\"1:WorldMorph\" transform=\"translate(0,0)\">\n\
	<rect x=\"0\" y=\"0\" width=\"2100\" height=\"1100\" fill=\"rgb(255,255,255)\"/>\n\
	<defs><code>\n\
		<doit name=\"local requirements\" automaticEval=\"true\"><![CDATA[[]]]></doit>\n\
		<doit name=\"initializer\">// this script is evaluated on world load</doit>\n\
		<doit name=\"test doit\">// just for testing</doit></code></defs> \n\
	\n\
	<g type=\"Morph\" id=\"2401:Morph\" transform=\"translate(164,351) rotate(-19.812969207763672)\">\n\
		<rect x=\"0\" y=\"0\" width=\"414\" height=\"263\" stroke-width=\"1\" stroke=\"rgb(0,0,0)\" fill=\"rgb(159,255,247)\"/>\n\
		<lively:field name=\"origin\" xmlns=\"http://www.experimentalstuff.com/Lively\" family=\"Point\"><![CDATA[{\"x\":164,\"y\":351}]]></lively:field>\n\
		<lively:field name=\"rotation\" xmlns=\"http://www.experimentalstuff.com/Lively\">-0.3458015472717285</lively:field>\n\
		<lively:field name=\"scalePoint\" xmlns=\"http://www.experimentalstuff.com/Lively\" family=\"Point\"><![CDATA[{\"x\":1,\"y\":1}]]></lively:field>\n\
	</g> \n\
</g>\n\
\n\
</svg>\n\
</body>\n\
</html>'
return stringToXML(str).ownerDocument;
	},

	jsonDoc: function() {
		var webR = new WebResource(URL.codeBase.withFilename('blank.xhtml')).get(),
			doc = webR.contentDocument;
		return doc;
	},
},
'testing', {

	testGetChangesetAndWorldFromXML: function() {
		var doc = this.xmlDoc(),
			sut = lively.Main.WorldDataAccessor.forDocument(doc),
			cs = sut.getChangeSet(),
			world = sut.getWorld();
		this.assert(cs instanceof ChangeSet, 'ChangeSet not deserialized');
		this.assertEquals(3, cs.subElements().length)
		this.assert(world instanceof WorldMorph, 'World not deserialized');
	},
	testGetChangesetAndWorldFromJSON: function() {
		var doc = this.jsonDoc(),
			sut = lively.Main.WorldDataAccessor.forDocument(doc),
			cs = sut.getChangeSet(),
			world = sut.getWorld();
		this.assert(cs instanceof ChangeSet, 'ChangeSet not deserialized');
		this.assertEquals(2, cs.subElements().length)
		this.assert(world instanceof WorldMorph, 'World not deserialized');
	},

})

}) // end of module