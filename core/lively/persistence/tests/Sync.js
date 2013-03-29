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
        this.assertEqualState(23, this.store.db.foo);
    },

    testCommit: function() {
        var done, writtenVal, preVal;
        this.store.db.foo = 22;
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { preVal = oldVal; return oldVal + 1; },
            callback: function(err, committed, val) { done = committed; writtenVal = val; }
        });
        this.assertEquals(22, preVal, 'val before set');
        this.assert(done, 'not committed?');
        this.assertEquals(23, this.store.db.foo);
        this.assertEquals(23, writtenVal);
    },

    testCommitCancels: function() {
        var done, written, eventualVal;
        this.store.db.foo = 22;
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { return undefined; },
            callback: function(err, committed, val) { done = true; written = committed; eventualVal = val; }
        });
        this.assert(done, 'not done?');
        this.assert(!written, 'committed?');
        this.assertEquals(22, this.store.db.foo);
        this.assertEquals(22, eventualVal);
    },

    testCommitWithConflict: function() {
        var done, written, eventualVal;
        var store = this.store;
        store.set('foo', 22);
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { if (oldVal === 22) store.set('foo', 41); return oldVal + 1; },
            callback: function(err, committed, val) { done = true; written = committed; eventualVal = val; }
        });
        this.assert(done, 'not done?');
        this.assert(written, 'not committed?');
        this.assertEquals(42, this.store.db.foo);
        this.assertEquals(42, eventualVal);
    },

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
        childHandle.subscribe({callback: function(val) { childHandleReads.push(val); }});
        this.rootHandle.set({value: {bar: {baz: 23}}});
        this.rootHandle.set({path: 'bar', value: {baz: 24}});
        this.rootHandle.commit({path: 'bar.baz', transaction: function(n) { return n+1; }});
        this.assertEqualState([23, 24, 25], childHandleReads);
    },

    testChildChange: function() {
        // return;
        var childHandle = this.rootHandle.child('bar.baz'), reads = [];
        this.rootHandle.subscribe({type: 'childChanged', callback: function(val, path) { reads.push(path); reads.push(val); }});
        childHandle.set({value: 23});
        this.assertEquals(['bar.baz', 23], reads);
    }

});

TestCase.subclass('lively.persistence.Sync.test.StoreInterface',
'running', {
    setUp: function($super) {
        $super();
        this.store = new lively.persistence.Sync.LocalStore();
    }
},
'testing', {
});

}) // end of module