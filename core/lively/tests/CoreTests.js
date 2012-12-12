module('lively.tests.CoreTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.tests.CoreTests.DocLinkConversionTest', {

	exampleDoc: function() {
        var docString = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" '
                      + '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n'
                      + '\n'
                      + '<html xmlns="http://www.w3.org/1999/xhtml">\n'
                      + '<head>\n'
                      + '<title>Developer\'s Journal - Lively HTML</title>\n'
                      + '</head>\n'
                      + '\n'
                      + '<body style="margin:0px">\n'
                      + '\n'
                      + '<svg xmlns="http://www.w3.org/2000/svg" '
                      +   'xmlns:lively="http://www.experimentalstuff.com/Lively" '
                      +   'xmlns:xlink="http://www.w3.org/1999/xlink" '
                      +   'xmlns:xhtml="http://www.w3.org/1999/xhtml" '
                      +   'id="canvas" width="100%" height="100%" xml:space="preserve" '
                      +   'xmlns:xml="http://www.w3.org/XML/1998/namespace" '
                      +   'zoomAndPan="disable">\n'
                      + '<title>Lively Kernel canvas</title>\n'
                      + '<defs>\n'
                      + '<script type="text/ecmascript" xlink:href="../../lively/JSON.js"/>\n'
                      + '<script name="codeBase">'
                      +   '<![CDATA[Config.codeBase=Config.getDocumentDirectory()'
                      +   '+\'../../\'\]\]></script>\n'
                      + '<script name="codeBase"><![CDATA[Config.codeBase='
                      +   'Config.getDocumentDirectory()+"../../"\]\]></script>\n'
                      + '<script type="text/ecmascript" '
                      +   'xlink:href="../../lively/localconfig.js"/>\n'
                      + '<script type="text/ecmascript" '
                      +   'xlink:href="../../lively/Base.js"/>\n'
                      + '</defs>\n'
                      + '\n'
                      + '\n'
                      + '<defs id="SystemDictionary"></defs>\n'
                      + '<g type="lively.morphic.World" id="1:lively.morphic.World" '
                      +   'transform="translate(0,0)"></g></svg>\n'
                      + '\n'
                      + '</body>\n'
                      + '</html>';
		return stringToXML(docString);
	},

	test01ConvertDepth: function() {
		var d = this.exampleDoc(),
            codeBase = 'http://www.lively-kernel.org/repository/webwerkstatt/',
            toDir = 'http://lively-kernel.org/repository/webwerkstatt/draft/',
            sut = new DocLinkConverter(codeBase, toDir),
            newDoc = sut.convert(d),
            scripts = Array.from(newDoc.getElementsByTagName('script'));

		this.assertEquals(4, scripts.length, 'remove the duplicate');
		this.assertEquals('core/lively/JSON.js', scripts[0].getAttribute('xlink:href'));
		this.assertEquals('Config.codeBase=Config.getDocumentDirectory()+\'\'',
                          scripts[1].textContent);
		this.assertEquals('core/lively/localconfig.js', scripts[2].getAttribute('xlink:href'));
	},

	test02ConvertPath: function() {
		var codeBase = 'http://www.lively-kernel.org/repository/webwerkstatt/',
            toDir = 'http://www.lively-kernel.org/repository/webwerkstatt/draft/',
            sut = new DocLinkConverter(codeBase, toDir),
            expected = 'core/lively/JSON.js',
            result = sut.convertPath('lively/JSON.js');
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
		this.assertEquals('core/lively/', result);
		toDir = 'http://www.foo.org/bar/baz/xxx/xxx/';
		result = sut.relativeLivelyPathFrom(codeBase, toDir);
		this.assertEquals('../../core/lively/', result);
		toDir = codeBase;
		result = sut.relativeLivelyPathFrom(codeBase, toDir);
		this.assertEquals('core/lively/', result);
	},

	test04ExtractFilename: function() {
		var sut = new DocLinkConverter('http://foo', 'http://foo/bar'),
            url = 'xxx/a/y/lively/a?_-0009c.js',
            result = sut.extractFilename(url);
		this.assertEquals('a?_-0009c.js', result);
		url = 'abc.js'
		result = sut.extractFilename(url);
		this.assertEquals('abc.js', result);
	},

	test05CreateCodeBaseDef: function() {
		var sut = new DocLinkConverter('http://foo', 'http://foo/bar'),
            result = sut.createCodeBaseDef('../../');
		this.assertEquals('Config.codeBase=Config.getDocumentDirectory()+\'../../\'', result);
	},
	test06ConvertDifferentDomains: function() {
		var d = this.exampleDoc(),
            codeBase = 'http://www.lively-kernel.org/repository/webwerkstatt/',
            toDir = 'http://www.new-host.com/path1/path2/',
            sut = new DocLinkConverter(codeBase, toDir),
            newDoc = sut.convert(d),
            scripts = Array.from(newDoc.getElementsByTagName('script'));

		this.assertEquals(codeBase + 'core/lively/JSON.js',
                          scripts[0].getAttribute('xlink:href'));
		this.assertEquals(codeBase + 'core/lively/localconfig.js',
                          scripts[2].getAttribute('xlink:href'));
	}

});

}) // end of module