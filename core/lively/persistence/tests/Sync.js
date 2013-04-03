module('lively.persistence.tests.Sync').requires('lively.TestFramework', 'lively.persistence.Sync').toRun(function() {

TestCase.subclass('lively.persistence.Sync.test.ObjectHandleInterface',
'running', {
    setUp: function($super) {
        $super();
        this.store = new lively.persistence.Sync.LocalStore();
        this.rootHandle = new lively.persistence.Sync.ObjectHandle({store: this.store});
    }
},
'testing', {

    testChildFullPath: function() {
        var barHandle = this.rootHandle.child('foo.bar');
        this.assertEquals("foo.bar", barHandle.path.toString(), 'path creation');
    },

    testChildAccess: function() {
        var barHandle = this.rootHandle.child('bar'), barVal;
        this.rootHandle.set({value: {bar: 23}});
        barHandle.get({callback: function(val) { barVal = val; }});
        this.assertEquals(23, barVal);
    },

    testParentChangesTriggerChildEvents: function() {
        var childHandle = this.rootHandle.child('bar.baz'),
            childHandleReads = [];
        childHandle.subscribe({callback: function(val, path) { childHandleReads.push([val, path]); }});
        this.rootHandle.set({value: {bar: {baz: 23}}});
        this.rootHandle.set({path: 'bar', value: {baz: 24}});
        this.rootHandle.commit({path: 'bar.baz', transaction: function(n) { return n+1; }});
        this.assertEquals([[23, 'bar.baz'], [24, 'bar.baz'], [25, 'bar.baz']], childHandleReads);
    },

    testChildChange: function() {
        // return;
        var childHandle = this.rootHandle.child('bar.baz'), reads = [];
        this.rootHandle.subscribe({type: 'childChanged', callback: function(val, path) { reads.push([val, path]); }});
        childHandle.set({value: 23});
        this.assertEquals([[23, 'bar.baz']], reads);
    }

});

TestCase.subclass('lively.persistence.Sync.test.StoreAccess',
'running', {
    setUp: function($super) {
        $super();
        this.store = new lively.persistence.Sync.LocalStore();
        this.rootHandle = new lively.persistence.Sync.ObjectHandle({store: this.store});
    }
},
'testing', {

    testGetValue: function() {
        this.store.set('foo', 23);
        var result = [];
        this.rootHandle.get({path: 'foo', callback: function(val) { result.push(val); }});
        this.assertEqualState([23], result);
    },

    testGetNonExistantValue: function() {
        var result = [];
        this.rootHandle.get({path: 'foo', callback: function(val) { result.push(val); }});
        this.assertEqualState([undefined], result);
        this.assertEqualState([], Object.keys(this.rootHandle.callbackRegistry));
    },

    testGetRoot: function() {
        this.store.set('foo', 23);
        var result;
        this.rootHandle.get({callback: function(val) { result = val; }});
        this.assertEqualState({foo: 23}, result);
    },

    testetTwice: function() {
        var result1 = [], result2 = [];
        this.store.set('foo', 23);
        this.rootHandle.get({path: 'foo', callback: function(val) { result1.push(val); }});
        this.rootHandle.get({path: 'foo', callback: function(val) { result2.push(val); }});
        this.assertEqualState([23], result1);
        this.assertEqualState([23], result2);
        this.store.set('foo', 23);
        this.assertEqualState([23], result1);
        this.assertEqualState([23], result2);
    },

    testSubscribe: function() {
        var result = [];
        this.store.set('foo', 23);
        this.rootHandle.subscribe({path: 'foo', callback: function(val) { result.push(val); }});
        this.assertEqualState([], result);
        this.store.set('foo', 42);
        this.assertEqualState([42], result);
    },

    testSubscribeUnsubscribe: function() {
        var result = [];
        this.store.set('foo', 23);
        this.rootHandle.subscribe({path: 'foo', callback: function(val) { result.push(val); }});
        this.assertEquals(this.rootHandle.callbackRegistry.foo[0].constructor, this.store.callbacks.foo[0].constructor);
        this.assertEqualState([], result);
        this.rootHandle.unsubscribe({path: 'foo'});
        this.store.set('foo', 23);
        this.assertEqualState([], result);
        this.assertEqualState(this.rootHandle.callbackRegistry, {});
        // this.assertEqualState(0, Object.keys(this.store.callbacks).length, 'store callbacks');
    },

    testSet: function() {
        var done;
        this.rootHandle.set({path: 'foo', value: 23, callback: function(err) { done = true }});
        this.assert(done, 'not done?');
        var instore; this.store.get('foo', function(_, val) { instore = val });
        this.assertEqualState(23, instore);
    },

    testCommit: function() {
        var done, writtenVal, preVal;
        this.store.set('foo', 22);
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { preVal = oldVal; return oldVal + 1; },
            callback: function(err, committed, val) { done = committed; writtenVal = val; }
        });
        this.assertEquals(22, preVal, 'val before set');
        this.assert(done, 'not committed?');
        var actual; this.store.get('foo', function(_, v) { actual = v; });
        this.assertEquals(23, actual);
        this.assertEquals(23, writtenVal);
    },

    testCommitCancels: function() {
        var done, written, eventualVal;
        this.store.set('foo', 22);
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { return undefined; },
            callback: function(err, committed, val) { done = true; written = committed; eventualVal = val; }
        });
        this.assert(done, 'not done?');
        this.assert(!written, 'committed?');
        var actual; this.store.get('foo', function(_, v) { actual = v; });
        this.assertEquals(22, actual);
        this.assertEquals(22, eventualVal);
    },

    testCommitWithConflict: function() {
        var done, written, eventualVal, transactionCalls = 0;
        var store = this.store;
        store.set('foo', 22);
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { transactionCalls++; if (oldVal === 22) store.set('foo', 41); return oldVal + 1; },
            callback: function(err, committed, val) { done = true; written = committed; eventualVal = val; }
        });
        this.assert(done, 'not done?');
        this.assert(written, 'not committed?');
        this.assertEquals(2, transactionCalls, 'transactionCall count');
        var actual; this.store.get('foo', function(_, v) { actual = v; });
        this.assertEquals(42, actual);
        this.assertEquals(42, eventualVal);
    }
});

TestCase.subclass('lively.persistence.Sync.test.RemoteStore',
'running', {
    setUp: function($super) {
        $super();
        this.url = new URL(Config.nodeJSURL).asDirectory().withFilename('Store/' + this.currentSelector + '/');
        this.store = new lively.persistence.Sync.RemoteStore(this.url);
        this.rootHandle = new lively.persistence.Sync.ObjectHandle({store: this.store});
    }
},
'testing', {
    testUploadSomeSimpleData: function() {
        this.rootHandle.set({value: {foo: {bar: 23}}});
        var serverContent = this.store.url.asWebResource().get().content;
        this.assertEqualState('{"foo":{"bar":23}}', serverContent);
    },

    testRunStoreTests: function() {
        var test = new lively.persistence.Sync.test.StoreAccess(),
            tests = test.allTestSelectors();
        tests.forEach(function(testName) {
            this[testName] = test[testName];
            this.runTest(testName);
        }, this);
    }
});

}) // end of module