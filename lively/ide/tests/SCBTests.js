module('lively.ide.tests.SCBTests').requires('lively.TestFramework', 'lively.ide').toRun(function() {

// Browser related tests
AsyncTestCase.subclass('lively.ide.tests.SCBTests.SystemBrowserTests', {

	setUp: function() {
        var browser = this.createBrowser(),
            root = this.createMockNode(browser);
        browser.rootNode = function() { return root };
        browser.confirm = function(question, callback) { callback.call(this, true) }
        this.browser = browser;
    },

    createBrowser: function() {
        return new lively.ide.BasicBrowser();
    },

    mockNodeClass: lively.ide.BrowserNode.subclass('lively.ide.tests.SCBTests.MockNode', {
        initialize: function($super, target, browser, c) { $super(target, browser); this.children = c || [] },
        childNodes: function() { return this.children; }
    }),

    createMockNode: function(browser, children, target, name) {
        var node = new this.mockNodeClass(target, browser, children);
        if (name) node.asString = function() { return name; }
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
        this.done();
    },

    testFilterChildNodes: function() {
        var browser = this.browser;
        var node1 = this.createMockNode(browser);
        var node2 = this.createMockNode(browser);
        node1.shouldAppear = true; node2.shouldAppear = false;
        browser.rootNode().children = [node1, node2];
        var testFilterClass = lively.ide.NodeFilter.subclass('lively.tests.ToolsTest.TestFilter', {
              apply: function(nodes) { return nodes.select(function(ea) {return ea.shouldAppear}) }
        });
        var result = browser.filterChildNodesOf(browser.rootNode(), [new testFilterClass()]);
        this.assertEquals(result.length, 1);
            this.assertIdentity(result[0], node1);
            this.done();
    },

    testUninstallFilter: function() {
        var browser = this.browser;
        browser.installFilterInPane(new lively.ide.NodeFilter(), 'Pane1');
        this.assert(browser.getPane1Filters().length > 0);
        browser.uninstallFiltersMatching(function(filter) { 
            return filter instanceof lively.ide.NodeFilter 
        }, 'Pane1');
        this.assertEquals(browser.getPane1Filters().length, 0);
        this.done();
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
        this.done();
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
        this.done();
    }

});

lively.ide.tests.SCBTests.SystemBrowserTests.subclass('lively.ide.tests.SCBTests.BrowserNodeTest',
'running', {
    createBrowser: function() {
        return new lively.ide.SystemBrowser();
    },

    buildTestSource: function() {
        // create and parse the source into filefragments
        var src = "\n\Object.subclass('Foo',\n"
            + "'catA', {\n"
            + "    m1: function() { return 23 },\n"
            + "    m2: function() {},\n"
            + "},\n"
            + "'catB', {\n"
            + "    m3: function() { return 42},\n"
            + "});\n"
            + "\n"
            + "Foo.addMethods('catC',{\n"
            + "    m4: function() {},\n"
            + "});";
        
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
        root.locationChanged = function() {};
        root.target = this.db;
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
    }
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
        this.done();
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
        this.done();
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
        this.done();
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
        this.done();
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
        this.done();
    },

    testAddClassCommand: function() {
        this.buildTestSource();
        var browser = this.browser;
        browser.buildView();
        var inited = false;
        browser.panel.sourcePane.withAceDo(function() { inited = true; });
        this.waitFor(function() { return !!inited }, 10, function() {
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
            var code = newClassFragment.getSourceCode();
            this.assert(code.startsWith('Object.subclass(\'' + className + '\','),
                    'source code of new class is strange: ' + code);

            // var newNode = browser.selectedNode();
            // this.assertEquals(newClassFragment, newNode.target,
            //                   'browser hasn\'t selected the new class');
            this.done();
        });
    },

    testAddMethodCommand: function() {
        this.buildTestSource();
        var browser = this.browser;
        browser.buildView()
        var inited = false;
        browser.panel.sourcePane.withAceDo(function() { inited = true; });
        this.waitFor(function() { return !!inited }, 10, function() {
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
            var code = newMethodFragment.getSourceCode();
            this.assert(code.match(new RegExp('\s*' + methodName + ': function')),
                          'source code of new method is strange: ' + code);

            // var newNode = browser.selectedNode();
            // this.assertEquals(newMethodFragment, newNode.target,
            //                   'browser hasn\'t selected the new method');
            this.done();
        });
    },

    testBrowseIt: function() {
        this.buildTestSource();
        var browser = this.browser;
        browser.buildView()

        this.m1.basicBrowseIt({browser: browser})

        this.assertEquals(browser.nodesInPane('Pane4').length, 3);
        this.assertIdentity(this.m1, browser.nodesInPane('Pane4')[0].target);
        this.done();
    },

    testBrowserKnowsCurrentModule: function() {
        if (Global.Foo) Foo.remove();
        this.buildTestSource();
        this.browser.buildView()
        this.browser.selectNodeNamed('dummySource.js');
        this.browser.selectNodeNamed('Foo');
        this.assertIdentity(module('dummySource'), this.browser.getSelectedModule());
        var n = this.browser.selectedNode();
        n.evalSource(n.sourceString());
        this.assert(Global.Foo, 'Class Foo could not be evaled');
        this.assertIdentity(Foo.sourceModule, module('dummySource'));
        this.done();
    },

    testNextNode: function() {
        this.buildTestSource();
        this.browser.buildView();
        this.browser.inPaneSelectNodeNamed('Pane1', 'dummySource.js');
        this.browser.inPaneSelectNodeNamed('Pane2', 'Foo');
        this.browser.inPaneSelectNodeNamed('Pane4', 'm2');
        var node = this.browser.selectedNode();
        this.assertIdentity(this.m3, node.nextNode().target);
        this.done();
    },

    testMethodChangeKeepsSelection: function() {
        this.buildTestSource();
        var browser = this.browser;
        browser.buildView();
        var inited = false;
        browser.panel.sourcePane.withAceDo(function() { inited = true; });
        this.waitFor(function() { return !!inited }, 10, function() {
            browser.inPaneSelectNodeNamed('Pane1', 'dummySource.js');
            browser.inPaneSelectNodeNamed('Pane2', 'Foo');
            browser.inPaneSelectNodeNamed('Pane4', 'm1');
            browser.allChanged();
            // make sure list has
            this.assertEquals('m1',
                browser.panel.Pane4.selection.target.name,
                'Pane4 list does not have the right selection');
            this.done();
        });
    }
});

TestCase.subclass('lively.ide.tests.SCBTests.AddMethodCommand',
'running', {
    setUp: function($super) {
        $super();
        var browser = {},
            cmd = new lively.ide.AddMethodToFileFragmentCommand(browser);
        this.sut = cmd;

        // nodes
        var prevNode = {target: {}}, newNode = {};
        this.mock(prevNode.target, 'addSibling', function(src) { return newNode });
        this.mock(prevNode.target, 'getSourceCode', function() { return '' });
        this.mock(prevNode.target, 'putSourceCode', function(str) { });
        this.mock(prevNode, 'nextNode', function() { return prevNode._nextNode });
        this.mock(prevNode.target, 'nextElement', function() { return prevNode._nextNode && prevNode._nextNode.target });
        this.mock(prevNode, 'getSiblingWithTarget', function(target) { return prevNode._nextNode && prevNode._nextNode.target === target && prevNode._nextNode });
        this.prevNode = prevNode;
        this.newNode = newNode;

        // browser methods
        this.mock(browser, 'allChanged');
        this.mock(browser, 'selectStringInSourcePane');
        this.mock(browser, 'selectNodeMatching');
    }
},
'testing', {
    testAddNoCommaIfCommaAlreadyExisting: function() {
        var prevSource = "foo: 3,", called;
        this.mock(this.prevNode.target, 'getSourceCode', function() { return prevSource });
        this.mock(this.prevNode.target, 'putSourceCode', function(str) { called = true });
        this.sut.interactiveAddTo(this.prevNode);
        this.assert(!called, 'putSourceCode called');
    },

    testAddNoCommaWhenNoNextNodeExists: function() {
        var newSrc;
        this.mock(this.prevNode.target, 'addSibling', function(src) { newSrc = src; });
        this.sut.interactiveAddTo(this.prevNode);
        this.assert(!newSrc.endsWith(','), ', added to new source ' + newSrc);
    }
});

TestCase.subclass('lively.tests.ToolsTests.LivelyIdeBrowse',
'testing', {

    shouldRun: true,

    testLivelyIdeBrowse: function() {
        var sut = lively.ide.browse("lively.morphic.Morph", "onMouseDown", "lively.morphic.Events");

        this.assert(sut, "could not open browser")
        try {
            this.assertEquals(sut.targetURL, URL.codeBase + "lively/morphic/")

            this.assert(sut.pane1Selection, "no selection in Pane1")
            this.assertEquals(sut.pane1Selection.asString(), "Events.js")

            this.assert(sut.pane2Selection, "no selection in Pane2")
            this.assertEquals(sut.pane2Selection.asString(), "Morph (extension)")

            // this.assertEquals(sut.pane3Selection.asString(), "event handling")
            this.assertEquals(sut.pane4Selection.asString(), "onMouseDown (proto)")
        } finally {
            if (sut) sut.view.remove() // close window
        }
    }

});

TestCase.subclass('lively.ide.tests.ModuleWrapper',
'running', {

    setUp: function($super) {
        $super();
    },

    tearDown: function($super) {
        $super();
        delete lively.ide.sourceDB().modules['from/modulewrapper/test.js'];
    }

},
'helper', {
    prepareForSetSource: function(options) {
        var webRInspector = {
            getHeadRevCallCount: 0,
            getCallCount: 0,
            putCallCount: 0,
            putReqRevs: [],
            putIfUnmodifiedSinceDates: [],
            lastWebR: null,
            lastPutSource: null,
            getContent: (options && options.initialContent) || null,
            getContentLastModified: (options && options.lastModified) || null,
            currentRev: 1,
            triggerDoneState: function(options) {
                if (options.lastModified) this.lastWebR.lastModified = options.lastModified;
                this.lastWebR.status = {
                    isDone: Functions.True,
                    isSuccess: function() { return options.code < 400 },
                    code: function() { return options.code }
                };
            }
        }

        this.spyInClass(WebResource, 'put', function(source, mimeType, options) {
            webRInspector.putCallCount++;
            webRInspector.lastWebR = this;
            webRInspector.putReqRevs.push(options && options.requiredSVNRevision);
            webRInspector.putIfUnmodifiedSinceDates.push(options && options.ifUnmodifiedSince);
            webRInspector.lastPutSource = source;
        });

        this.spyInClass(WebResource, 'getHeadRevision', function() {
            webRInspector.getHeadRevCallCount++;
            this.headRevision = ++webRInspector.currentRev;
        });

        this.spyInClass(WebResource, 'get', function() {
            webRInspector.lastWebR = this;
            webRInspector.getCallCount++;
            this.content = webRInspector.getContent;
            if (webRInspector.getContentLastModified)
                this.lastModified = webRInspector.getContentLastModified;
            return this;
        });

// (new Date()).valueOf() + 1
        return webRInspector;
    }
},
'testing', {

    testCreateForNonSource: function() {
        var src = 'var x = 3',
            sut = new AnotherSourceDatabase().addVirtualModule(null, src, 'js');
        this.assertEquals(src, sut.getSource());
        this.assertEquals(src, sut.getSourceUncached());
        this.assertEquals('js', sut.type());
        var otherSrc = 'Foo + 3 + 2;';
        sut.setSource(otherSrc);
        this.assertEquals(otherSrc, sut.getSource());
    },

    testPipelineSetSourceRequests: function() {
        var date1 = new Date(),
            date2 = new Date(date1.valueOf() + 1000),
            webRInspector = this.prepareForSetSource({initialContent: 'code', lastModified: date1});
        var moduleWrapper = lively.ide.sourceDB().addModule('from/modulewrapper/test.js');

        // two request but the second doesn't run
        moduleWrapper.setSource('code2', false, true);
        moduleWrapper.setSource('code3', false, true);
        this.assertEquals(1, webRInspector.putCallCount, 'double setSource results in two puts');
        this.assertEquals(webRInspector.lastPutSource, 'code2', 'content for first request not ok');
        this.assertEqualState([date1], webRInspector.putIfUnmodifiedSinceDates, 'unmod dates');

        // answer the first one

        webRInspector.triggerDoneState({code: 204, lastModified: date2});

        this.assertEquals(2, webRInspector.putCallCount, 'no second put after responding to first');
        this.assertEquals(webRInspector.lastPutSource, 'code3', 'content for second request not ok');

        this.assertEqualState([date1, date2], webRInspector.putIfUnmodifiedSinceDates, 'unmod dates 2');
    },

    testCancelQueuedRequestsWhenOverwriteDenied: function() {
        var date = new Date(),
            webRInspector = this.prepareForSetSource({initialContent: 'code', lastModified: date});
        var moduleWrapper = lively.ide.sourceDB().addModule('from/modulewrapper/test.js');

        // two request but the second doesn't run
        moduleWrapper.setSource('code2', false, true);
        moduleWrapper.setSource('code3', false, true);

        this.spyInClass(lively.morphic.World, 'confirm', function(q, cb) { cb(false); });
        webRInspector.triggerDoneState({code: 412});

        this.assertEquals(1, webRInspector.putCallCount, 'second put after responding to first');
        this.assertEquals(webRInspector.lastPutSource, 'code2', 'content not ok');
        this.assertMatches([date], webRInspector.putIfUnmodifiedSinceDates,
                           'required rev of second PUT not OK');
        this.assertEquals(0, moduleWrapper.queuedRequests.length, 'queuedRequests not cleared');
    },

    testRunQueuedSetSourceAfterOverwriteConfirm: function() {
        var date1 = new Date(),
            date2 = new Date(date1.valueOf() + 1000),
            webRInspector = this.prepareForSetSource({initialContent: 'code', lastModified: date1});
        var moduleWrapper = lively.ide.sourceDB().addModule('from/modulewrapper/test.js');

        // two request but the second doesn't run
        moduleWrapper.setSource('code2', false, true);
        moduleWrapper.setSource('code3', false, true);

        this.assertEquals(1, webRInspector.putCallCount, 'second put after responding to first');
        this.assertEquals(webRInspector.lastPutSource, 'code2', 'content not ok');
        this.assertMatches([date1], webRInspector.putIfUnmodifiedSinceDates,
                           'required date of first PUT not OK');

        // first setSource done:
        this.spyInClass(lively.morphic.World, 'confirm', function(q, cb) { cb(true); });
        webRInspector.triggerDoneState({code: 412});

        this.assertEquals(2, webRInspector.putCallCount,
                          'no second put after confirming overwrite');
        this.assertEquals(webRInspector.lastPutSource, 'code3',
                          'overwrite setSource call should use new source');
        this.assertMatches([date1], webRInspector.putIfUnmodifiedSinceDates,
                           'overwrite should not add a ifUnmodifiedSince date');

        // overwrite done and there shouldn't the queued request should be gone
        webRInspector.triggerDoneState({code: 204, lastModified: date2});
        this.assertEquals(2, webRInspector.putCallCount, 'there was yet another put');
        this.assertEquals(0, moduleWrapper.queuedRequests.length, 'queuedRequests not empty');
        this.assertEquals(date2, moduleWrapper.lastModifiedDate,
                          'lastModifiedDate no ok after 2. put');
    }

});

});
