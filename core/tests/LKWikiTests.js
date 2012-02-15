module('tests.LKWikiTests').requires('lively.TestFramework', 'lively.LKWiki', 'tests.SerializationTests').toRun(function(thisModule, testModule, wikiModule) {

thisModule.createPropfindResponse = function(filename, partOfRepoUrl, revisionNumber) {
	/* e.g. fileName = 'abc', partOfRepoUrl = '/testsvn/repo1/' revisionNumber = 74 */
	var xmlString = '<?xml version="1.0" encoding="utf-8"?>' +
		'<D:multistatus xmlns:D="DAV:">' +
		'<D:response xmlns:S="http://subversion.tigris.org/xmlns/svn/" ' + 
		 	'xmlns:C="http://subversion.tigris.org/xmlns/custom/" ' +
			' xmlns:V="http://subversion.tigris.org/xmlns/dav/" ' + 
			'xmlns:lp1="DAV:" xmlns:lp3="http://subversion.tigris.org/xmlns/dav/" ' + 
			'xmlns:lp2="http://apache.org/dav/props/">' +
		'<D:href>'+ partOfRepoUrl + filename + '</D:href>' + 
		'<D:propstat>' + '<D:prop>' + '<lp1:resourcetype/>' +
		'<lp1:getcontentlength>11</lp1:getcontentlength>' +
		'<lp1:getcontenttype>text/xml; charset="utf-8"</lp1:getcontenttype>' +
		'<lp1:getetag>"' + revisionNumber + '//' + filename + '"</lp1:getetag>' +
		'<lp1:creationdate>2008-08-12T17:55:30.184069Z</lp1:creationdate>' +
		'<lp1:getlastmodified>Wed, 12 Aug 2008 17:55:30 GMT</lp1:getlastmodified>' +
		'<lp1:checked-in><D:href>' + partOfRepoUrl + '!svn/ver/' + revisionNumber + '/' + filename + '</D:href></lp1:checked-in>' +
		'<lp1:version-controlled-configuration><D:href>' + partOfRepoUrl + '!svn/vcc/default</D:href></lp1:version-controlled-configuration>' +
		'<lp1:version-name>' + revisionNumber + '</lp1:version-name>' +
		'<lp1:auto-version>DAV:checkout-checkin</lp1:auto-version>' +
		'<lp3:baseline-relative-path>' + filename + '</lp3:baseline-relative-path>' +
		'<lp3:md5-checksum>96c15c2bb2921193bf290df8cd85e2ba</lp3:md5-checksum>' +
		'<lp3:repository-uuid>356c892c-17b4-4da3-8f97-36f2baa338bc</lp3:repository-uuid>' +
		'<lp3:deadprop-count>0</lp3:deadprop-count>' +
		'<D:supportedlock>' + '<D:lockentry>' +
		'<D:lockscope><D:exclusive/></D:lockscope>' + '<D:locktype><D:write/></D:locktype>' +
		'</D:lockentry>' + '</D:supportedlock>' + '<D:lockdiscovery/>' +
		'</D:prop>' + '<D:status>HTTP/1.1 200 OK</D:status>' + '</D:propstat>' +
		'</D:response>' + '</D:multistatus>';
	return new DOMParser().parseFromString(xmlString, "text/xml")
};

thisModule.createReportResponse = function() {
	var xmlString = '<?xml version="1.0" encoding="utf-8"?>' +
		'<S:log-report xmlns:S="svn:" xmlns:D="DAV:">' +
		'<S:log-item>' +
			'<D:version-name>75</D:version-name>' +
			'<D:comment>Autoversioning commit:  a non-deltaV client made a change to /abc</D:comment>' +
			'<S:revprop name="svn:autoversioned">*</S:revprop>' +
			'<S:date>2008-08-08T23:03:01.342813Z</S:date>' +
			'<S:modified-path>/abc</S:modified-path>' +
		'</S:log-item>' +
		'<S:log-item>' +
			'<D:version-name>18</D:version-name>' +
			'<D:comment></D:comment>' +
			'<S:date>2008-08-08T22:37:07.441511Z</S:date>' +
			'<S:added-path>/abc</S:added-path>' +
		'</S:log-item>' +
	'</S:log-report>';
	return new DOMParser().parseFromString(xmlString, "text/xml")
};

TestCase.subclass('tests.LKWikiTests.SVNResourceTest', {
	
	setUp: function() {
		/* Mock the NetRequest: save NetRequest */
		this.oldNetRequest = NetRequest;
		/* Create the mock */
		NetRequest.subclass('tests.LKWikiTests.MockNetRequest', {
			onReadyStateChange: function() {
				this.setModelValue('setStatus', this.getStatus());
				this.setModelValue('setResponseText', this.getResponseText());
				this.setModelValue('setResponseXML', this.getResponseXML());
			},
			request: function(method, url, content) {
			    return this;
			}
		});
		/* Replace the original NetRequest with the Mock*/
		NetRequest = thisModule.MockNetRequest;
		
		var wikiUrl = URL.proxy.toString() + 'wiki';
		var completeUrl = wikiUrl + '/directory/file123';
		this.svnResource = new SVNResource(wikiUrl,
		        Record.newPlainInstance({URL: completeUrl, HeadRevision: null, ContentText: null, Metadata: null}));
	},
	
	testGetLocalUrl: function() {
		var localUrl = 'local';
		var wikiUrl = 'http://path/to/svn/repo';
		this.svnResource = new SVNResource(wikiUrl, Record.newPlainInstance({URL: wikiUrl + '/' + localUrl}));
		var result = this.svnResource.getLocalUrl();
		this.assertEquals(result, localUrl);
	},
	
	testFetchHeadRevision: function() {
		var rev = 29;
		var wasRequested = false;
		var test = this;
		thisModule.MockNetRequest.prototype.request = function(method, url, content) {
			test.assertEquals(method, 'PROPFIND');
			test.assertEquals(url, test.svnResource.getURL());
			wasRequested = true;
			this.onReadyStateChange();
			return this;
		};
		thisModule.MockNetRequest.prototype.getResponseXML = function() {
			return thisModule.createPropfindResponse(test.svnResource.getLocalUrl(), '/change/me!/', rev);
		};
		
		this.svnResource.fetchHeadRevision();
		
		this.assert(wasRequested, 'request() should be called');
		this.assertEquals(rev, this.svnResource.getHeadRevision());
	},
	
	testFetchFileContent: function() {
		var rev = 29;
		var wasRequested = false;
		var expectedContent = 'someContent';
		var correctRequestUrl = this.svnResource.repoUrl + '/!svn/bc/' + rev + '/' + this.svnResource.getLocalUrl();
		var test = this;
		thisModule.MockNetRequest.prototype.request = function(method, url, content) {
			test.assertEquals(method, 'GET');
			test.assertEquals(url, correctRequestUrl);
			wasRequested = true;
			this.onReadyStateChange();
			return this;
		};
		thisModule.MockNetRequest.prototype.getResponseText = function() {
			return expectedContent;
		};
		
		this.svnResource.fetch(true, null, rev);
		
		this.assert(wasRequested, 'request() should be called');
		this.assertEquals(expectedContent, this.svnResource.getContentText());
	},
	
	testFetchMetadata: function() {
		var startRev = 76;
		var wasRequested = false;
		var expectedRequestContent =  '<S:log-report xmlns:S="svn:" xmlns:D="DAV:">' + '<S:start-revision>76</S:start-revision>' + '<S:end-revision>0</S:end-revision>' + '<S:discover-changed-paths/>' + '<S:path></S:path>' + '<S:all-revprops/>' + '</S:log-report>';
		var expectedData = [{rev: 75, date: new Date(2008, 7, 8, 23, 3, 1), author: '(no author)'},
							{rev: 18, date: new Date(2008, 7, 8, 22, 37, 7), author: '(no author)'}];
		var test = this;
		thisModule.MockNetRequest.prototype.request = function(method, url, content) {
			test.assertEquals(method, 'REPORT');
			test.assertEquals(url, test.svnResource.getURL());
			test.assertEquals(content, expectedRequestContent);
			wasRequested = true;
			this.onReadyStateChange();
			return this;
		};
		thisModule.MockNetRequest.prototype.getResponseXML = function() {
			console.log('MockNetRequest.getResponseXML() called');
			return thisModule.createReportResponse();
		};
		
		this.svnResource.fetchMetadata(true, null, startRev);
		this.assert(wasRequested, 'request() should be called');
		var result = this.svnResource.getMetadata();
		this.assertEquals(expectedData[0].rev, result[0].rev, 'Metadata is not correct');
		this.assertEquals(expectedData[0].date.toString(), result[0].date.toString(), 'Metadata is not correct');
		this.assertEquals(expectedData[0].author, result[0].author, 'Metadata is not correct');
		this.assertEquals(expectedData[1].rev, result[1].rev, 'Metadata is not correct');
		this.assertEquals(expectedData[1].date.toString(), result[1].date.toString(), 'Metadata is not correct');
		this.assertEquals(expectedData[1].author, result[1].author, 'Metadata is not correct');
	},
	
    // testListDirectory: function() {
    //     var theUrl = 'http://localhost/livelyBranch/proxy/wiki/test/';
    //     this.svnResource = new SVNResource('http://localhost/livelyBranch/proxy/wiki',
    //          Record.newPlainInstance({URL: theUrl, ContentText: null}));
    //     var contentText = '<html><head><title>repo1 - Revision 268: /test</title></head>' + 
    //         '<body>' +
    //         '<h2>repo1 - Revision 268: /test</h2>' + 
    //         '<ul>'
    //           '<li><a href="../">..</a></li>' + 
    //           '<li><a href="a.js">Contributions.js</a></li>' +
    //           '<li><a href="abc.js">Core.js</a></li>' +
    //           '<li><a href="demo1.xhtml">demo1.xhtml</a></li>' +
    //           '<li><a href="folder1/">folder1/</a></li>' +
    //          '</ul>' +
    //          '<hr noshade><em>Powered by <a href="http://subversion.tigris.org/">Subversion</a> version 1.5.1 (r32289).</em>'
    //         '</body></html>';
    //  var expected = [url + 'a.js', url + 'abc.js', url + 'demo1.xhtml', url + 'folder1/'];
    //  thisModule.MockNetRequest.prototype.request = function(method, url, content) {
    //      test.assertEquals(method, 'GET');
    //      test.assertEquals(theUrl, url);
    //      wasRequested = true;
    //      this.onReadyStateChange();
    //      return this;
    //  };
    //  thisModule.MockNetRequest.prototype.getResponseText = function() {
    //      return contentText;
    //  };
    //  
    //  this.svnResource.fetch(true);
    //  this.assert(wasRequested, 'request() should be called');
    // },
	
	tearDown: function() {
		NetRequest = this.oldNetRequest;
	}
});

TestCase.subclass('tests.LKWikiTests.SVNVersionInfoTest', {
    testParseUTCDate: function() {
        var sut = new SVNVersionInfo({rev: 0, date: '', author: null});
        var dateString = '2008-08-08T23:03:01.342813Z';
        var result = sut.parseUTCDateString(dateString);
        var expected = new Date(2008, 8, 8, 23, 3, 1);
        this.assertEqualState(expected, result, 'date parsing not correct');
    },
    
    testToString: function() {
        var sut = new SVNVersionInfo({rev: 75, date: '2008-08-08T23:03:01.342813Z', author: null});
		this.assert(sut.toString().match(/(no author).*Fri Aug 08 2008, Revision 75/));

        // see SVNVersionInfo.toString()
        // this.assert(sut.toString().orig === sut, 'vers info string has not pointer to original');
    },

testSerializeToNode: function() {
	var sut = new SVNVersionInfo({rev: 75, date: '2008-08-08T23:03:01.342813Z', author: 'test', url: new URL('http://path/to/nowhere'), change: 'modified'});
	var newSVNInfo = eval(sut.toExpression());
	this.assertEqualState(sut, newSVNInfo);
},
});

TestCase.subclass('tests.LKWikiTests.WikiNavigatorTest', {
    
	shouldRun: false, // WikiNavigator already makes request on creation...
	
    testIsActiveForWikiUrls: function() {
        var nav = new WikiNavigator('http://localhost/lively/proxy/wiki/test.xhtml');
        this.assert(nav.isActive(), 'Navigator did not recognize wiki url');
        var nav = new WikiNavigator('http://localhost/lively/index.xhtml');
        this.assert(!nav.isActive(), 'Navigator did not recognize non-wiki url');
    },
    
    testRecognizeAndModifiesBaselineURIs: function() {
        var url1 = 'http://localhost/lively/proxy/wiki/test.xhtml';
        var nav = new WikiNavigator(url1);
        this.assertEquals(nav.model.getURL(), url1, "Modified url1");
        
        var url2 = 'http://localhost/livelyBranch/proxy/wiki/!svn/bc/187/test/index.xhtml';
        var expectedUrl2 = 'http://localhost/livelyBranch/proxy/wiki/test/index.xhtml';
        nav = new WikiNavigator(url2);
        this.assertEquals(nav.model.getURL(), expectedUrl2, "Could not modify url2");
    },
     
    // Tests are doing real stuff and work only when current url is correct
    // (something like *proxy/wiki/*xhtml)
    setUp: function() {
        //this.nav = new WikiNavigator(URL.source.toString());
        this.nav = new WikiNavigator('http://localhost/livelyBranch/proxy/wiki/test/blabla');
        WikiNavigator.current = this.nav;
    },
    
    // testFindVersions: function() {
    //     var wasCalled = false;
    //     this.nav.model.setVersions = this.nav.model.setVersions.wrap(function(proceed, list) {
    //         wasCalled = true;
    //         proceed(list); 
    //     });
    //     // execute
    //     this.nav.findVersions();
    //     this.assert(wasCalled, "setversions was not triggered");
    //     this.assert(this.nav.model.getVersions().length > 0, "cannot read versions from: " + this.nav.model.getURL());
    // },
    // 
    // testWikiWorldExists: function() {
    //     this.nav = new WikiNavigator('http://localhost/livelyBranch/proxy/wiki/abc');
    //     this.assert(this.nav.worldExists(), 'did not found abc');
    //     this.nav = new WikiNavigator('http://localhost/livelyBranch/proxy/wiki/IdoNOTexists');
    //     this.assert(!this.nav.worldExists(), 'notified false existence');
    // }
});

TestCase.subclass('tests.LKWikiTests.InteractiveAuthorizationTest', {

	shouldRun: false,

	documentation: 'Implements interactive tests for testing authorization server settings.',

	baseUrl: URL.source.getDirectory(), //new URL('http://localhost/testsvn/repo1/test/'),

	runAll: function(optTestRunner) {
	    var startTime = (new Date()).getTime();
		this.runList = this.allTestSelectors();
		this.runTest(this.runList.shift(), optTestRunner);
		//this.result.setTimeToRun(this.name(), (new Date()).getTime() - startTime);
	},

	runTest: function($super, selector, optTestRunner) { // to make tests run asynch
		var test = this;
		var cb = function() {
			var cb2 = function() {
				$super(selector);
				optTestRunner && optTestRunner.setResultOf(test);
				if (test.runList && test.runList.length > 0) 
					test.runTest(test.runList.shift(), optTestRunner);
			};
			test.login(cb2);
		};
		console.log('Running test '  + selector);
//		cb();
		WorldMorph.current().confirm('Running test ' + selector + '. Please login.', cb);
	},

	login: function(callback) { // interactive test, lez the user login, then run callback
		var test = this;
		var cb = function() {
			console.log('----- Logged in for ' + test.currentSelector);
			callback && callback();
		}
		this.tryPut('auth', true, cb, '');
	},

	logout: function() {
		this.tryPut('logout', false, function() {console.log('----- Logged out')}, '');
	},

	makeResource: function(url, optCallback) {
		var test = this;
		var resource = new Resource(Record.newPlainInstance({URL: url.toString(), ContentText: null}));
		resource.setRequestStatus = function(status) {
			console.log('got status: ' + status.code());
			if (status.exception)
				WorldMorph.current().alert("exception " + status.exception + " accessing\n" + url);
			if (status.code() == 401) test.wasAllowed = false;
			else test.wasAllowed = true;
			optCallback && optCallback();
		};
		return resource;
	},

	tryPut: function(filename, notSync, optCallback, optContent) {
		// if optContent is undefined just write the original contents of the resource
		var url = this.baseUrl.withFilename(filename);
		var content = optContent ?
			optContent :
			this.makeResource(url).fetch(true).getResponseText();
		this.wasAllowed = null;
		this.makeResource(url, optCallback).store(content, !notSync);
	},
	
	cleanup: function() {
		var cb = function() {
			var dir = new FileDirectory(this.baseUrl);
			['123test123.xhtml', 'livelyTest.xhtml', 'non-test.xhtml', 'livelyTest.js'].forEach(function(ea) {
				dir.deleteFileNamed(ea);
			});
		}.bind(this);
		this.login(cb);
	},


	tearDown: function() {
		this.logout();
	},

	testLogout: function() {
		this.logout();
		this.tryPut('auth', false, null, '');
		this.assert(this.wasAllowed === false, 'logout isn\'t working');
	},

/*	testUserWriteAcess: function() {
		this.tryPut('123test123.xhtml');
		this.assert(this.wasAllowed === true, 'xhtml');
		// not allowed
		this.tryPut('index.xhtml');
		this.assert(this.wasAllowed === false, 'index');
		this.tryPut('example.xhtml');
		this.assert(this.wasAllowed === false, 'example');
		this.login(); this.tryPut('livelyTest.xhtml');
		this.assert(this.wasAllowed === false, 'lively*');
		this.login(); this.tryPut('non-test.xhtml');
		this.assert(this.wasAllowed === false, 'non-*xhtml');
		this.login(); this.tryPut('Core.js');
		this.assert(this.wasAllowed === false, 'js');
		this.login(); this.tryPut('livelyTest.js');
		this.assert(this.wasAllowed === false, 'lively*js');
	}, */

	testUserWriteAcess1: function() {
		this.tryPut('123test123.xhtml');
		this.assert(this.wasAllowed === true, 'xhtml');
	},

	testUserWriteAcess2: function() {
		this.tryPut('index.xhtml');
		this.assert(this.wasAllowed === false, 'index');
	},

	testUserWriteAcess3: function() {
		this.tryPut('example.xhtml');
		this.assert(this.wasAllowed === false, 'example');
	},

	testUserWriteAcess4: function() {
		this.tryPut('livelyTest.xhtml');
		this.assert(this.wasAllowed === false, 'lively*');
	},

	testUserWriteAcess5: function() {
		this.tryPut('non-test.xhtml');
		this.assert(this.wasAllowed === false, 'non-*xhtml');
	},

	testUserWriteAcess6: function() {
		this.tryPut('Core.js');
		this.assert(this.wasAllowed === false, 'js');
	},

	testUserWriteAcess7: function() {
		this.tryPut('livelyTest.js');
		this.assert(this.wasAllowed === false, 'lively*js');
	},

	testAdminWriteAccess: function() {
		this.tryPut('index.xhtml');
		this.assert(this.wasAllowed === true);
		this.tryPut('example.xhtml');
		this.assert(this.wasAllowed === true);
		this.tryPut('livelyTest.xhtml');
		this.assert(this.wasAllowed === true);
		this.tryPut('non-test.xhtml');
		this.assert(this.wasAllowed === true);
		this.tryPut('Core.js');
		this.assert(this.wasAllowed === true);
	},

});
TestCase.subclass('tests.LKWikiTests.WikiNetworkAnalyzerTest', {

	sampleDocument: function() {
		return stringToXML('<?xml version="1.0" encoding="utf-8"?>' + '\n' +
'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"' + '\n' +
'"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' + '\n' + '\n' +
'<html xmlns="http://www.w3.org/1999/xhtml">' + '\n' + '\n' +
'<head> <title>Sun Labs Lively Kernel</title> </head>' + '\n' +
'<body style="margin:0px">' + '\n' +
'<!-- <link rel="stylesheet" type="text/css" href="style.css"/> -->' + '\n' +
'<svg id="canvas" width="100%" height="100%"' + '\n' +
'     xmlns="http://www.w3.org/2000/svg" ' + '\n' +
'     xmlns:lively="http://www.experimentalstuff.com/Lively"' + '\n' +
'     xmlns:xlink="http://www.w3.org/1999/xlink"' + '\n' +
'     xmlns:xhtml="http://www.w3.org/1999/xhtml"' + '\n' +
'     xml:space="preserve"' + '\n' +
'     zoomAndPan="disable">' + '\n' +
'<title>Lively Kernel canvas</title>' + '\n' +
'<defs>' + '\n' + '\n' +
'</defs>' + '\n' + '\n' +
'<field name="textStyle"><![CDATA[{"runs":[33,18,13,33,17,15,18,20,17,17,16,16,8,14,8,19],"values":[' + '\n' +
'{},{"color":"blue","link":"http://livelykernel.sunlabs.com/repository/non-existing/test1.xhtml"},' + '\n' +
'{},{"color":"blue","link":"http://livelykernel.sunlabs.com/repository/non-existing/test1.xhtml"},' +
'{},{"color":"blue","link":"test2.xhtml"},' + '\n' +
'{},{"color":"blue","link":"http://livelykernel.sunlabs.com/"}]}]]></field>' + '\n' + '\n' +
'<field name="url" family="URL"><![CDATA[{"protocol":"http:","hostname":"livelykernel.sunlabs.com","pathname":"/repository/non-existing/test3.xhtml","constructor":null,"splitter":null,"pathSplitter":null,"initialize":null,"inspect":null,"toString":null,"fullPath":null,"isLeaf":null,"dirname":null,"filename":null,"getDirectory":null,"withPath":null,"withRelativePath":null,"withFilename":null,"toQueryString":null,"withQuery":null,"withoutQuery":null,"eq":null,"relativePathFrom":null,"svnWorkspacePath":null,"svnVersioned":null,"notSvnVersioned":null,"toLiteral":null}]]></field>' + '\n' + '\n' +
'</svg>' + '\n' + '\n' +
'</body>' + '\n' +
'</html>');
	},

setUp: function() {
	this.doc = this.sampleDocument();
	this.repoUrl = new URL("http://livelykernel.sunlabs.com/repository/non-existing/");
	this.linksOfSampleDoc = [this.createWorldProxyFor(this.repoUrl.withFilename('test1.xhtml')),
										this.createWorldProxyFor(URL.source.withFilename('test2.xhtml')),
										this.createWorldProxyFor(this.repoUrl.withFilename('test3.xhtml'))];
},
tearDown: function($super) {
	$super(); WikiNetworkAnalyzer.instances = []
},


createWorldProxyFor: function(url) {
	return new WikiWorldProxy(url, this.repoUrl);
},
logReport: function() {
	return stringToXML('<?xml version="1.0" encoding="utf-8"?>' + '\n' +
'<S:log-report xmlns:S="svn:" xmlns:D="DAV:">' + '\n' +

'<S:log-item>' + '\n' +
'<D:version-name>358</D:version-name>' + '\n' +
'<D:comment>Autoversioning commit:  a non-deltaV client made a change to' + '\n' +
'/folder1/f1.txt</D:comment>' + '\n' +
'<D:creator-displayname>robert</D:creator-displayname>' + '\n' +
'<S:date>2008-09-12T13:32:18.491198Z</S:date>' + '\n' +
'<S:added-path>/folder1/f1.txt</S:added-path>' + '\n' +
'</S:log-item>' + '\n' +

'<S:log-item>' + '\n' +
'<D:version-name>357</D:version-name>' + '\n' +
'<D:comment>Autoversioning commit:  a non-deltaV client made a change to' + '\n' +
'/folder1/f2.txt</D:comment>' + '\n' +
'<D:creator-displayname>robert</D:creator-displayname>' + '\n' +
'<S:date>2008-09-12T13:32:18.364685Z</S:date>' + '\n' +
'<S:added-path>/folder1/f2.txt</S:added-path>' + '\n' +
'</S:log-item>' + '\n' +

'<S:log-item>' + '\n' +
'<D:version-name>356</D:version-name>' + '\n' +
'<D:comment>Autoversioning commit:  a non-deltaV client made a change to' + '\n' +
'/folder1/f1.txt</D:comment>' + '\n' +
'<D:creator-displayname>robert</D:creator-displayname>' + '\n' +
'<S:date>2008-09-12T13:32:18.232343Z</S:date>' + '\n' +
'<S:added-path>/folder1/f1.txt</S:added-path>' + '\n' +

'</S:log-report>');
},
logReport2: function() {
	return stringToXML('<?xml version="1.0" encoding="utf-8"?>' + '\n' +
'<S:log-report xmlns:S="svn:" xmlns:D="DAV:">' + '\n' +

'<S:log-item>' + '\n' +
'<D:version-name>401</D:version-name>' + '\n' +
'<D:comment>Autoversioning commit:  a non-deltaV client made a change to' + '\n' +
'/folder1/f1.txt</D:comment>' + '\n' +
'<D:creator-displayname>robert</D:creator-displayname>' + '\n' +
'<S:date>2008-09-12T13:32:18.491198Z</S:date>' + '\n' +
'<S:added-path>/folder1/f2.txt</S:added-path>' + '\n' +
'</S:log-item>' + '\n' +

'<S:log-item>' + '\n' +
'<D:version-name>402</D:version-name>' + '\n' +
'<D:comment>Autoversioning commit:  a non-deltaV client made a change to' + '\n' +
'/folder1/f2.txt</D:comment>' + '\n' +
'<D:creator-displayname>robert</D:creator-displayname>' + '\n' +
'<S:date>2008-09-12T13:32:18.364685Z</S:date>' + '\n' +
'<S:added-path>/folder1/f2.txt</S:added-path>' + '\n' +
'</S:log-item>' + '\n' +

'</S:log-report>');
},
useMockResource: function(analyzer, config) {
	analyzer.makeSVNResource = analyzer.constructor.prototype.makeSVNResource.wrap(function(proceed, repoUrl, url) {
		var r = proceed(repoUrl, url);
		r.fetchHeadRevision = function() { r.getModel().setHeadRevision(config.headRevision) };
		r.fetchMetadata = function() { r.pvtScanLogReportForVersionInfos(config.metadata) };
		return r;
	})
},




testExtractLinks: function() {
	doc = this.sampleDocument();
	var expected = this.linksOfSampleDoc.collect(function(ea) {return ea.getURL() });
	var sut = new WikiNetworkAnalyzer(this.repoUrl);
	var result = sut.extractLinksFromDocument(doc);
	this.assertEquals(result.length, expected.length);
	this.assertEqualState(result, expected);
},



testAddLinks: function() {
	var worldProxy = this.createWorldProxyFor('bla');
	var sut = new WikiNetworkAnalyzer(this.repoUrl);
	this.assertEquals(worldProxy.getLinks().length, 0);
	sut.addLinksOfWorld(worldProxy, this.sampleDocument());
	this.assertEquals(sut.worldProxies.length, this.linksOfSampleDoc.length + 1);
	this.assertEqualState(
		this.linksOfSampleDoc.collect(function(ea) {return ea.localName()}),
		worldProxy.getLinks().collect(function(ea) {return ea.localName()}));
},
testScanLogAndCreateProxies: function() {
	var sut = new WikiNetworkAnalyzer(this.repoUrl);
	this.useMockResource(sut, {headRevision: 400, metadata: this.logReport()});
	this.assertEquals(sut.getWorldProxies().length, 0, 'Proxies exsiting?');
	sut.fetchProxies();
	this.assertEquals(sut.getWorldProxies().length, 2, 'Couldn\'t create proxies?');
	var wp1 = sut.getWorldProxies().detect(function(ea) { return ea.localName() == 'f1.txt' });
	var wp2 = sut.getWorldProxies().detect(function(ea) { return ea.localName() == 'f2.txt' })
	this.assertEquals(wp1.getVersions().length, 2);
	this.assertEquals(wp2.getVersions().length, 1);
},
testAppendLogInformation: function() {
	var sut = new WikiNetworkAnalyzer(this.repoUrl);
	this.useMockResource(sut, {headRevision: 400, metadata: this.logReport()});
	sut.fetchProxies();
	sut.fetchProxies(); // dont add doubled
	var wp1 = sut.getWorldProxies().detect(function(ea) { return ea.localName() == 'f1.txt' });
	var wp2 = sut.getWorldProxies().detect(function(ea) { return ea.localName() == 'f2.txt' })
	this.assertEquals(wp1.getVersions().length, 2);
	this.assertEquals(wp2.getVersions().length, 1);
	this.useMockResource(sut, {headRevision: 415, metadata: this.logReport2()});
	sut.fetchProxies();
	this.assertEquals(wp2.getVersions().length, 3);
},




});
tests.SerializationTests.SerializationBaseTestCase.subclass('tests.LKWikiTests.WikiWorldProxyTest', {

createProxy: function(spec) {
	var url = new URL('http://dummy');
	var p = new WikiWorldProxy(url.withFilename('test'), url);
	for (name in spec)
		p[name] = spec[name];
	return p;
},

findCodeNodeIn: function(doc) {
	return new Query('.//*[@lively:type="WorldMorph"]/*[local-name()="defs"]/lively:code').manualNSLookup().findFirst(doc);
},

addChangeSetToWorld: function() {
	var world = this.worldMorph;
	var cs = ChangeSet.fromWorld(world);
	var change = DoitChange.create('dummy');
	cs.addChange(change);
	// test if it works
	var codeElement = this.findCodeNodeIn(this.dom);
	this.assert(codeElement.childNodes.length > 0,
		'Error in Setup: Cannot install ChangeSet in DummyWorld');
	return cs;
},
testRetrieveChangeSet: function() {
	var cs = this.addChangeSetToWorld();
	var sut = this.createProxy({getDocument: function() { return this.dom }.bind(this)});
	var result = sut.getChangeSet();
	this.assert(cs.eq(result));
},
testConstructDocumentOfChangeSet: function() {
	var cs = this.addChangeSetToWorld();
	cs.xmlElement = stringToXML(Exporter.stringify(cs.xmlElement));
	cs.addChange(DoitChange.create('test'));
	var sut = this.createProxy({getDocument: function() { return this.dom }.bind(this)});
	var result = sut.getDocumentOfChangeSet(cs);
	this.assertEquals(
		Exporter.stringify(cs.xmlElement),
		Exporter.stringify(this.findCodeNodeIn(result)),
		'documents not equal? Got change CS into new doc?');
},



});

TestCase.subclass('tests.LKWikiTests.SerializerTest', {

	testSerializeAndDeserializeBasicObjects: function() {
		var basic = {
			'Number(3)': 				3,
			'Number(3.4)': 			3.4,
			'String("bla")': 			'bla',
			'[]': 								[],
			'[Number(1000)]': 	[1000],
			'ExpressionSerializer.object={}':									{},
			'ExpressionSerializer.object={"a":Number(1),}':			{a:1},
			'ExpressionSerializer.object={"a+2":Number(3),}': 	{"a+2": 3},
			'ExpressionSerializer.func=function a() {}': 				function a() {},
		};
		var sut = new ExpressionSerializer();
		for (var expr in basic) {
			if (!basic.hasOwnProperty(expr)) continue; // ignore Object extensions
			this.assertEquals(sut.serialize(basic[expr]), expr, 'serializing ' + expr);
		}
		for (var expr in basic) {
			if (!basic.hasOwnProperty(expr)) continue; // ignore Object extensions
			if (Object.isFunction(basic[expr]))
				this.assertEquals(eval(expr).toString(), basic[expr].toString(), 'deserializing ' + expr);
			else
				this.assertEqualState(eval(expr), basic[expr], 'deserializing ' + expr);
		}
	},

	testSerializeURL: function() {
		var url = new URL('http://path/to/nowhere');
		var result = eval(url.toExpression());
		this.assert(url.eq(result), 'new url (' + result + ') does not equal old one');
	},
});

TestCase.subclass('tests.LKWikiTests.WikiPatcherTest', {
    
    unpatchedSrc: '<title>Lively Kernel canvas</title>\n' +
        '<defs>\n' +
            '<script type="text/ecmascript" xlink:href="JSON.js"/>\n' +
            '<script type="text/ecmascript" xlink:href="miniprototype.js"/>',
            
    patchedSrc: '<title>Lively Kernel canvas</title>\n' +
                '<defs>\n'+
                    '<script type="text/ecmascript" xlink:href="http://url/to/jsSrces/!svn/bc/1000/JSON.js"/>\n' +
                    '<script type="text/ecmascript" xlink:href="http://url/to/jsSrces/!svn/bc/1000/miniprototype.js"/>',
                    
    setUp: function() {
        var url = 'http://url/to/jsSrces/';
        this.sut = new WikiPatcher(url);
    },
    
    testRewriteXHTMLSimpple: function() {
        var revision = 1000;
        var result = this.sut.patchSrc(this.unpatchedSrc, 1000);
        this.assertEquals(result, this.patchedSrc);
    },
    
    testPatchPatchedSrc: function() {
        var revision = 1000;
        var result = this.sut.patchSrc(this.patchedSrc, 1000);
        this.assertEquals(result, this.patchedSrc);
    },
    
    testUnPatchSrc: function() {
        var revision = 1000;
        var result = this.sut.unpatchSrc(this.patchedSrc);
        this.assertEquals(result, this.unpatchedSrc);
    }
})
    
thisModule.exampleSVNResource = function() {
	var repoUrl = URL.proxy.toString() + 'wiki';
	var url = repoUrl + '/abc';
	var res = new SVNResource(repoUrl, Record.newPlainInstance({URL: url}));
	res.store('this is new content which was written from exampleSVNResource()');
	res.fetchHeadRevision();
	res.fetchMetadata();
	res.fetch();
	exampleResource = res;
};

//exampleSVNResource();

thisModule.printExampleSVNResource = function() {
	console.log(exampleResource.getModelValue('getHeadRevision'));
	console.log(exampleResource.getModelValue('getContentText'));
	var metadata = exampleResource.getModelValue('getMetadata');
	console.log((metadata[0]).rev);
	console.log((metadata[0]).date);
	$A(metadata).each(function(ea) {
		console.log(ea.rev + '    ' + ea.date);
	});
};

thisModule.endlessLoop = function() {
	var endLoop = false;
	Global.setTimeout(function() {endLoop = true}, 1);
	var i = 0;
	
	while (!endLoop) {
		i += 1;
		console.log(i);
	};
	
};

});