module('lively.ide.tests.BrowserAddonTests').requires('lively.TestFramework', 'lively.ide', 'lively.ide.SystemCodeBrowserAddons').toRun(function() {

// Browser related tests
AsyncTestCase.subclass('lively.ide.tests.SCBAddons.HistoryTest', 
'testing', {
    setUp: function() {
        var browser = this.createBrowser(),
            root = this.createMockNode(browser, [
                this.createMockNode(browser, [
                        this.createMockNode(browser, [
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method1'),
                                    this.createMockNode(browser, [], undefined, 'method2'),
                                    this.createMockNode(browser, [], undefined, 'method3'),
                                ], undefined, '-- all --'),
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method1'),
                                    this.createMockNode(browser, [], undefined, 'method2'),
                                    this.createMockNode(browser, [], undefined, 'method3'),
                                ], undefined, 'default category'),
                        ], undefined, 'class1'),
                        this.createMockNode(browser, [
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method4'),
                                    this.createMockNode(browser, [], undefined, 'method5'),
                                ], undefined, '-- all --'),
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method4'),
                                    this.createMockNode(browser, [], undefined, 'method5'),
                                ], undefined, 'initialization'),
                        ], undefined, 'class2'),
                    ], undefined, 'file1'),
                this.createMockNode(browser, [
                        this.createMockNode(browser, [
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method6'),
                                ], undefined, '-- all --'),
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method6'),
                                ], undefined, 'default category'),
                        ], undefined, 'class3'),
                    ], undefined, 'file2'),
                this.createMockNode(browser, [
                        this.createMockNode(browser, [
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method7'),
                                    this.createMockNode(browser, [], undefined, 'method8'),
                                ], undefined, '-- all --'),
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method7'),
                                ], undefined, 'initialization'),
                            this.createMockNode(browser, [
                                    this.createMockNode(browser, [], undefined, 'method8'),
                                ], undefined, 'default category'),
                        ], undefined, 'class4'),
                        this.createMockNode(browser, [
                            this.createMockNode(browser, [], undefined, '-- all --'),
                        ], undefined, 'class5'),
                    ], undefined, 'file3'),
                ], undefined, 'root');
        browser.rootNode = function() { return root };
        browser.confirm = function(question, callback) { callback.call(this, true) }
        browser.buildView()
        this.browser = browser;
        if(! browser.history){
            new lively.ide.SCBAddons.History(browser);
        };
        this.history = browser.history;
    },

    createBrowser: function() {
        return new lively.ide.BasicBrowser();
    },

    mockNodeClass: lively.ide.BrowserNode.subclass('lively.ide.tests.SCBTests.MockNode', {
        initialize: function($super, target, browser, c) { $super(target, browser); this.children = c || [] },
        childNodes: function() { return this.children; },
        f: function() { return this.children[0]; },
        s: function() { return this.children[1]; },
        t: function() { return this.children[2]; },
    }),

    createMockNode: function(browser, children, target, name) {
        var node = new this.mockNodeClass(target, browser, children);
        if (name) {
            node.asString = function() { return this.name; }
            node.toString = function() { return '"' + this.name + '"'; };
            node.name = name
        }
        children.forEach(function(ea) { ea.parent = node });
        return node;
    },

    testHistoryRecordingMethods: function() {
        var browser = this.browser,
            rN = browser.rootNode(),
            c1all = rN.f().f().f();
        
        this.browsePath([rN.f(), rN.f().f(), c1all, 
                    c1all.f(), c1all.s(), c1all.t(), 
                    c1all.s(), c1all.f()], this.browser);
        this.done();
    },
    testHistoryRecordingClassSwitch: function() {
        var browser = this.browser,
            rN = browser.rootNode(),
            c22 = rN.f().s().s(),
            c12 = rN.f().f().s();
        
        this.browsePath([rN.f(), rN.f().s(), c22, 
                    c22.s(), c22.f(), rN.f().f(),
                    c12, c12.s()], this.browser);
        this.done();
    },
    testHistoryRecordingFileSwitch: function() {
        var browser = this.browser,
            rN = browser.rootNode(),
            f2 = rN.s(),
            f3 = rN.t(),
            c3 = f2.f(),
            c5 = f3.s();
        
        this.browsePath([f3, c5, f2, c3, c3.f(), c3.s(), c3.s().f()], this.browser);
        this.done();
    },
    testBackAcrossMethods: function() {
        var browser = this.browser,
            rN = browser.rootNode(),
            c1all = rN.f().f().f(),
            m1 = c1all.f(), m2 = c1all.s(), m3 = c1all.t();
        
        this.browsePath([rN.f(), rN.f().f(), c1all, 
                    m1, m2, m3, m2, m1], this.browser);
        this.backTo([rN.f(), rN.f().f(), c1all, m2], 1); 
        this.backTo([rN.f(), rN.f().f(), c1all, m3], 1);
        this.backTo([rN.f(), rN.f().f(), c1all], 3);
        this.done();
    },
    testBackAcrossFiles: function() {
        var browser = this.browser,
            rN = browser.rootNode(),
            f2 = rN.s(), f3 = rN.t(),
            c3 = f2.f(), c5 = f3.s();
        
        this.browsePath([f3, c5, f2, c3, c3.f(), c3.s(), c3.s().f()], this.browser);
        this.backTo([f2, c3, c3.f()], 2);
        this.backTo([f2, c3], 1);
        this.backTo([f3, c5], 2);
        this.done();
    },
    testSwitchTo: function() {
        var browser = this.browser,
            rN = browser.rootNode(),
            f3 = rN.t(), c5 = f3.s(),
            f1 = rN.f(), c1 = f1.f(), m2 = c1.f().s();
        
        this.history.switchTo(c5, 2);
        this.assertEquals(browser.getPane1Selection(), f3, 'parent not switched')
        this.assertEquals(browser.getPane2Selection(), c5, 'node not browsed')
        this.history.switchTo(m2, 4);
        this.assertEquals(browser.getPane1Selection(), f1, 'file not switched')
        this.assertEquals(browser.getPane2Selection(), c1, 'class not switched')
        this.assertEquals(browser.getPane3Selection(), c1.f(), 'protocol not switched')
        this.assertEquals(browser.getPane4Selection(), m2, 'node not browsed')
        this.done();
    },
}, 'testing helper', {
    browsePath: function(path, browser) {
        var selected = path.map(function(ea) {
            return browser.selectNode(ea);
            }, this),
            recordedHistory = this.history.history.map(function(ea) { return ea.node; })
        
        // inspect({path: path, hist: recordedHistory, selected: selected, selectedNode: browser.selectedNode()});
        this.assertEquals(selected, path, 'the path is not walked correctly');
        this.assertEquals(recordedHistory, path, 'the history is not recorded correctly');
    },
    backTo: function(selectedNodes, n){
        this.history.backInTime(n);
        this.assert(selectedNodes[0] == this.browser.getPane1Selection(), 'wrong file selected');
        this.assert(selectedNodes[1] == this.browser.getPane2Selection(), 'wrong class selected');
        this.assert(selectedNodes[2] == this.browser.getPane3Selection(), 'wrong category selected');
        this.assert(selectedNodes[3] == this.browser.getPane4Selection(), 'wrong method selected');
        this.assertEquals(selectedNodes[selectedNodes.length - 1], this.history.history[this.history.history.length - 1].node)
    },
});
}) // end of module
