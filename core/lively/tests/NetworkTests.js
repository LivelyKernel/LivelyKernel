module('lively.tests.NetworkTests').requires('lively.TestFramework').toRun(function() {
    
TestCase.subclass('lively.tests.NetworkTests.URLTest', {
    
    testEnsureAbsoluteURL1: function() {
        var urlString = 'http://livelykernel.sunlabs.com/repository/lively-wiki/index.xhtml';
        var result = URL.ensureAbsoluteURL(urlString);
        this.assertEquals(urlString, result.toString());
        
        urlString = 'http://localhost/lively/index.xhtml';
        result = URL.ensureAbsoluteURL(urlString);
        this.assertEquals(urlString, result.toString());
    },
    
    testEnsureAbsoluteURL2: function() {
        var urlString = 'index.xhtml';
        var result = URL.ensureAbsoluteURL(urlString);
        var expected = URL.source.getDirectory().toString() + urlString;
        this.assertEquals(expected, result.toString());
    },

    testEnsureAbsoluteURL3: function() {
        var urlString = 'bla/http/blupf.xhtml';
        var result = URL.ensureAbsoluteURL(urlString);
        var expected = URL.source.getDirectory().toString() + urlString;
        this.assertEquals(expected, result.toString());
    },

    testRemoveRelativeParts: function() {
        var urlString = 'http://foo.com/bar/../baz/';
        var result = new URL(urlString).withRelativePartsResolved();
        var expected = 'http://foo.com/baz/';
        this.assertEquals(expected, result.toString());
    },
    
    testRemoveRelativeParts2: function() {
        var urlString = 'http://localhost/webwerkstatt/projects/HTML5/presentation100720/../../../';
        var result = new URL(urlString).withRelativePartsResolved();
        var expected = 'http://localhost/webwerkstatt/';
        this.assertEquals(expected, result.toString());
    },

    testRemoveRelativeParts3: function() {
        var urlString = 'http://localhost/foo//bar';
        var result = new URL(urlString).withRelativePartsResolved();
        var expected = 'http://localhost/foo/bar';
        this.assertEquals(expected, result.toString());
    },

    testRemoveRelativeParts4: function() {
        var urlString = 'http://localhost/foo/./bar';
        var result = new URL(urlString).withRelativePartsResolved();
        var expected = 'http://localhost/foo/bar';
        this.assertEquals(expected, result.toString());
    },

    testRelativePathFrom1: function() {
        var expected = 'test/bar/baz';
        
        var url1 = new URL('http://www.foo.org/test/bar/baz');
        var url2 = new URL('http://www.foo.org/');
        var result = url1.relativePathFrom(url2);
        this.assertEquals(expected, result.toString());
        
        url2 = new URL('http://foo.org/');
        result = url1.relativePathFrom(url2);
        this.assertEquals(expected, result.toString());
        
        try {
            url2 = new URL('http://foo.com/');
            result = url1.relativePathFrom(url2);
        } catch (e) { return; }
        this.assert(false, 'error expected');
    },

    testRelativePathFrom2: function() {
        var expected = '../test/bar/baz';
        
        var url1 = new URL('http://www.foo.org/test/bar/baz');
        var url2 = new URL('http://www.foo.org/bar/');
        var result = url1.relativePathFrom(url2);
        this.assertEquals(expected, result.toString());

        expected = '../../bar/';
        result = url2.relativePathFrom(url1);
        this.assertEquals(expected, result.toString());
    },
    testRelativePathFrom3Identity: function() {
        var url = new URL('http://www.foo.org/bar/'),
            result = url.relativePathFrom(url);
        this.assertEquals('', result.toString());
    },

    
    testMakeProxy: function() {
        var originalProxy = URL.proxy;
        URL.proxy = new URL('http://foo.com/proxy/');
        
        try { // FIXME            
            // normal behavior
            var result = URL.makeProxied('http://bar.com/');
            var expected = 'http://foo.com/proxy/bar.com/';
            this.assertEquals(expected, result.toString());

            // normal behavior with port        
            result = URL.makeProxied('http://bar.com:1234/');
            expected = 'http://foo.com/proxy/bar.com:1234/';
            this.assertEquals(expected, result.toString());

            // normal behavior, same URL and another port        
            result = URL.makeProxied('http://foo.com:1234/');
            expected = 'http://foo.com/proxy/foo.com:1234/';
            this.assertEquals(expected, result.toString());

            // don't proxy yourself
            result = URL.makeProxied(URL.proxy);
            this.assertEquals(URL.proxy.toString(), result.toString());
        
            // don't proxy yourself 2
            result = URL.makeProxied('http://www.foo.com/proxy/');
            this.assertEquals(URL.proxy.toString(), result.toString());
        } finally {
            URL.proxy = originalProxy;
        }
    },
    testAsDirectory: function() {
        var url = new URL('http://foo.com/bar/');
        this.assertEquals('http://foo.com/bar/', url.asDirectory().toString());
        url = new URL('http://foo.com/bar');
        this.assertEquals('http://foo.com/bar/', url.asDirectory().toString());
        url = new URL('http://foo.com/bar?foo=bar');
        this.assertEquals('http://foo.com/bar/', url.asDirectory().toString());
    },
    testIsIn: function() {
        var url1, url2;
        url1 = new URL('http://foo.com/bar/');
        url2 = new URL('http://foo.com/bar/baz');
        this.assert(url2.isIn(url1), 'isIn not woring');
        
        url1 = new URL('http://bar.com/bar/');
        url2 = new URL('http://www.foo.com/bar/baz');
        this.assert(!url2.isIn(url1), 'isIn does not recognize differing URLS');

        url1 = new URL('http://foo.com/bar/');
        url2 = new URL('http://www.foo.com/bar/baz');
        this.assert(url2.isIn(url1), 'www url not recognized');
    },


    
});

TestCase.subclass('lively.tests.NetworkTests.WebResourceTest',
'settings', {
    shouldRun: !Config.serverInvokedTest,
},
'helper', {
    plainTextString: 'this is a test\nfoo\nbar',

    xmlString: ['<foo xmlns="http:\/\/www.lively-kernel.org\/fooNS" xmlns:bazNS="http:\/\/www.lively-kernel.org\/fooNS">',
        '<bar name="test1"/>',
        '<bar name="test2">',
        '    <bazNS:baz name="test3"/>',
        '</bar>',
    '</foo>'].join('\n'),

    writeFile: function(url, content) {
        new WebResource(url).put(content);
    },

    removeFile: function(url) {
        new WebResource(url).del();
    },
    isWebDAVEnvironment: function() {
        return URL.source.normalizedHostname() !== 'localhost';
    },
  
},
'running', {
    setUp: function($super) {
        $super();
        var url = URL.source.getDirectory().withFilename('WebResourceTestDir/');
        this.dir = new WebResource(url);
        if (!this.dir.exists()) this.dir.create();

        this.plainTextFileURL = url.withFilename('TextFileForWebResourceTest.txt');
        this.xmlFileURL = url.withFilename('XMLFileForWebResourceTest.xml');

        this.writeFile(this.plainTextFileURL, this.plainTextString);
        this.writeFile(this.xmlFileURL, this.xmlString);
    },

    tearDown: function($super) {
        $super();
        this.dir.del();
    },
},
'testing', {
    testGet: function() {
        var sut = new WebResource(this.plainTextFileURL);
        this.assertEquals(this.plainTextString, sut.get().content);
        this.assert(sut.status.isSuccess());

        var resultXML = new WebResource(this.xmlFileURL).get().contentDocument;
        this.assertEquals(this.xmlString, Exporter.stringify(resultXML));
    },

    testPut: function() {
        var sut = new WebResource(this.plainTextFileURL);
        sut.put('test');
        this.assert(sut.status.isSuccess());
        this.assertEquals('test', sut.get().content);
    },

    testDel: function() {
        var sut = new WebResource(this.plainTextFileURL);
        sut.del();
        this.assert(sut.status.isSuccess());
        this.assert(!sut.get().isExisting);
    },

    testSubElements: function() {
        var subDir = new WebResource(this.dir.getURL().withFilename('foo/'));
        subDir.create();
        this.dir.getSubElements();
        this.assertEquals(1, this.dir.subCollections.length);
        this.assertEquals(2, this.dir.subDocuments.length);
    },

    testExists: function() {
        var sut = new WebResource(this.plainTextFileURL);
        sut.get();
        this.assert(sut.status.isSuccess());
        this.assert(sut.isExisting);
        this.assert(sut.exists());

        sut = new WebResource(this.plainTextFileURL + 'abc');
        this.assert(!sut.exists());
    },

    testCopy: function() {
        var url2 = this.plainTextFileURL.withFilename('copiedFile.txt'),
            other = new WebResource(url2),
            sut = new WebResource(this.plainTextFileURL);
        sut.copyTo(url2);
        this.assert(sut.status.isSuccess());
        this.assert(other.exists());
        this.assertEquals(sut.get().content, other.get().content);
    },
    testCopyAndGetVersion: function() {
        if (!this.isWebDAVEnvironment()) return;
        var url2 = this.plainTextFileURL.withFilename('copiedFile.txt'),
            other = new WebResource(url2),
            sut = new WebResource(this.plainTextFileURL);
        sut.copyTo(url2);
        var versions = other.getVersions().versions;
        this.assertEquals(2, versions.length);
        this.assert(versions[0].rev > versions[1].rev, 'second not the older verions');
        this.assertEquals(sut.get().content, other.get(versions[1].rev).content);
    },


    testGetVersions: function() {
        if (!this.isWebDAVEnvironment()) return;
        var sut = new WebResource(this.plainTextFileURL);
        sut.getVersions();
        this.assert(sut.headRevision);
        this.assertEquals(1, sut.versions.length);
    },
    
    testGetWithVersion: function() {
        if (!this.isWebDAVEnvironment()) return;
        this.writeFile(this.plainTextFileURL, 'new version of file');
        var sut = new WebResource(this.plainTextFileURL);
        var versions = sut.getVersions().versions;
        this.assertEquals(2, versions.length);
        var rev = versions[0].rev;
        this.assert(this.plainTextString, sut.get(rev).content);
    },
    
    testGetHeadRevision: function() {
        if (!this.isWebDAVEnvironment()) return;
        var sut = new WebResource(this.plainTextFileURL);
        var rev1 = sut.getHeadRevision().headRevision;
        sut.put('new version of file');
        var rev2 = sut.getHeadRevision().headRevision;
        this.assert(rev1< rev2);
    },

    testGetResponseHeaders: function() {
        var sut = new WebResource(this.plainTextFileURL);
        sut.get();
        this.assertEquals(typeof sut.responseHeaders, 'object', 'Response headers were not defined.');
        this.assertEquals(sut.responseHeaders['Content-Type'], 'text/plain', 'No response header "Content-Type" with  value "text/plain" was found!');
    },

    testEnsureExistance: function() {
        var url = this.dir.getURL().withFilename('foo/bar/baz/'),
            webR = new WebResource(url);
        webR.ensureExistance();
        this.assert(webR.exists(), 'ensure existance did not work');
    },

    testInitWithURL: function() {
        this.plainTextFileURL.port = 1234;
        this.assert(this.plainTextFileURL.toString().indexOf(':1234/') != -1, 'Port was not set correctly');

        var sut = new WebResource(this.plainTextFileURL);
        this.assert(this.plainTextFileURL, sut.getURL(), 'Given URL and used URL are not the same');
    },
}); 
});