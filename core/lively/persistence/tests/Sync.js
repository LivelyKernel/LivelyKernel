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
        this.rootHandle.get('foo', function(val) { result.push(val); });
        this.assertEqualState([23], result);
    },


    testGetWhenAvailable: function() {
        var result = [];
        this.rootHandle.get('foo', function(val) { result.push(val); });
        this.assertEqualState([], result);
        this.store.set('foo', 23);
        this.assertEqualState([23], result);
    },

    testetTwice: function() {
        var result1 = [], result2 = [];
        this.rootHandle.get('foo', function(val) { result1.push(val); });
        this.rootHandle.get('foo', function(val) { result2.push(val); });
        this.store.set('foo', 23);
        this.assertEqualState([23], result1);
        this.assertEqualState([23], result2);
        this.store.set('foo', 24);
        this.assertEqualState([23], result1);
        this.assertEqualState([23], result2);
    },

    testOn: function() {
        var result = [];
        this.store.set('foo', 23);
        this.rootHandle.subscribe('foo', function(val) { result.push(val); });
        this.assertEqualState([23], result);
        this.store.set('foo', 42);
        this.assertEqualState([23, 42], result);
    },

    testOnOff: function() {
        var result = [];
        this.store.set('foo', 23);
        this.rootHandle.subscribe('foo', function(val) { result.push(val); });
        this.assertEqualState([23], result);
        this.rootHandle.off('foo');
        this.store.set('foo', 42);
        this.assertEqualState([23], result);
    },

    testSet: function() {
        var done;
        this.rootHandle.set('foo', 23, function(err) { done = true });
        this.assert(done, 'not done?');
        this.assertEqualState(23, this.store.foo);
    },

    testCommit: function() {
        var done, writtenVal, preVal;
        this.store.foo = 22;
        this.rootHandle.commit(
            'foo',
            function(oldVal) { preVal = oldVal; return oldVal + 1; },
            function(err, committed, val) { done = committed; writtenVal = val; });
        this.assertEquals(22, preVal, 'val before set');
        this.assert(done, 'not committed?');
        this.assertEquals(23, this.store.foo);
        this.assertEquals(23, writtenVal);
    },

    testCommitCancels: function() {
        var done, written, eventualVal;
        this.store.foo = 22;
        this.rootHandle.commit(
            'foo',
            function(oldVal) { return undefined; },
            function(err, committed, val) { done = true; written = committed; eventualVal = val; });
        this.assert(done, 'not done?');
        this.assert(!written, 'committed?');
        this.assertEquals(22, this.store.foo);
        this.assertEquals(22, eventualVal);
    },

    testCommitWithConflict: function() {
        var done, written, eventualVal;
        var store = this.store;
        store.set('foo', 22);
        this.rootHandle.commit(
            'foo',
            function(oldVal) { if (oldVal === 22) store.set('foo', 41); return oldVal + 1; },
            function(err, committed, val) { done = true; written = committed; eventualVal = val; });
        this.assert(done, 'not done?');
        this.assert(written, 'not committed?');
        this.assertEquals(42, this.store.foo);
        this.assertEquals(42, eventualVal);
    },

    testChildAccess: function() {}

});

}) // end of module