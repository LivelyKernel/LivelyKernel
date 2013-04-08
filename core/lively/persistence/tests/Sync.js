module('lively.persistence.tests.Sync').requires('lively.TestFramework', 'lively.persistence.Sync').toRun(function() {

TestCase.subclass('lively.persistence.Sync.test.ObjectHandleInterface',
'running', {
    setUp: function($super) {
        $super();
        this.store = new lively.persistence.Sync.LocalStore();
        this.rootHandle = this.store.getHandle();
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
        childHandle.subscribe();
        childHandle.onValueChanged = function(val, path) { childHandleReads.push([val, path]); }
        this.rootHandle.set({value: {bar: {baz: 23}}});
        this.rootHandle.set({path: 'bar', value: {baz: 24}});
        this.rootHandle.commit({path: 'bar.baz', transaction: function(n) { return n+1; }});
        this.assertEquals([[23, 'bar.baz'], [24, 'bar.baz'], [25, 'bar.baz']], childHandleReads);
    },

    testChildChange: function() {
        var childHandle = this.rootHandle.child('bar.baz'), reads = [];
        childHandle.subscribe();
        childHandle.onValueChanged = function(val, path) { reads.push([val, path]); }
        childHandle.set({value: 23});
        this.assertEquals([[23, 'bar.baz']], reads);
    },

    testConnect: function() {
        var obj = {};
        this.rootHandle.subscribe();
        connect(this.rootHandle, 'valueAndPath', obj, 'result');
        this.store.set('foo', 1);
        var expected = {value: 1, path: lively.PropertyPath('foo')};
        this.assertEqualState(expected, obj.result, 'value connection not working');
        disconnect(this.rootHandle, 'valueAndPath', obj, 'result');
        this.store.set('foo', 2);
        this.assertEqualState(expected, obj.result, 'value disconnect not working');
    },

    testIdIsAddedToObjectsButNotValues: function() {
        this.rootHandle.set({value: {foo: {bar: 3}}});
        // this.rootHandle.subscribe({type: 'childChanged', callback: function(val, path) { reads.push([val, path]); }});
        // childHandle.set({value: 23});
        // this.assertEquals([[23, 'bar.baz']], reads);
    }

});

AsyncTestCase.subclass('lively.persistence.Sync.test.StoreAccess',
'running', {
    setUp: function($super) {
        $super();
        this.store = new lively.persistence.Sync.LocalStore();
        this.rootHandle = this.store.getHandle();
    }
},
'testing', {

    testGetValue: function() {
        this.store.set('foo', 23);
        this.rootHandle.get({path: 'foo', callback: function(val) {
            this.assertEqualState(23, val);
            this.done();
        }.bind(this)});
    },

    testGetNonExistantValue: function() {
        this.rootHandle.get({path: 'foo', callback: function(val) {
            this.assertIdentity(undefined, val);
            this.assertEqualState([], Object.keys(this.rootHandle.callbackRegistry));
            this.done();
        }.bind(this)});
    },

    testGetRoot: function() {
        this.store.set('foo', 23);
        this.rootHandle.get({callback: function(val) {
            this.assertEqualState({foo: 23}, val);
            this.done();
        }.bind(this)});
    },

    testetTwice: function() {
        var result1 = [], result2 = [];
        this.store.set('foo', 23);
        this.rootHandle.get({path: 'foo', callback: function(val) { result1.push(val); }});
        this.rootHandle.get({path: 'foo', callback: function(val) { result2.push(val); }});
        this.delay(function() {
            this.assertEqualState([23], result1);
            this.assertEqualState([23], result2);
            this.store.set('foo', 23);
            this.delay(function() {
                this.assertEqualState([23], result1);
                this.assertEqualState([23], result2);
                this.done();
            }, 20);
        }, 20);
    },

    testAddSubscriber: function() {
        var result = [];
        this.rootHandle.onValueChanged = function(val, path) { result.pushAll([val, 'foo']) }
        this.store.set('foo', 23);
        this.rootHandle.subscribe();
        this.delay(function() {
            this.rootHandle.unsubscribe();
            this.store.set('foo', 99);
            this.delay(function() {
                this.assertEquals([42, 'foo'], result);
                this.done();
            });
        });
        this.store.set('foo', 42);
    },

    testSet: function() {
        this.rootHandle.set({path: 'foo', value: 23, callback: function(err) {
            this.store.get('foo', function(_, val) {
                this.assertEqualState(23, val);
                this.done();
            }.bind(this));
        }.bind(this)});
    },

    testCommit: function() {
        var preVal;
        this.store.set('foo', 22);
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { preVal = oldVal; return oldVal + 1; },
            callback: function(err, committed, val) {
                this.assertEquals(22, preVal, 'val before set');
                this.assert(committed, 'not committed?');
                this.assertEquals(23, val);
                this.store.get('foo', function(_, v) {
                    this.done();
                    this.assertEquals(23, v);
                }.bind(this));
            }.bind(this)
        });
    },

    testCommitCancels: function() {
        var done, written, eventualVal;
        this.store.set('foo', 22);
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { return undefined; },
            callback: function(err, committed, val) {
                this.assert(!committed, 'committed?');
                this.assertEquals(22, val);
                this.store.get('foo', function(_, v) {
                    this.assertEquals(22, v);
                    this.done();
                }.bind(this));
            }.bind(this)
        });
    },

    testCommitToUnsetValueSucceeds: function() {
        var transactionCalls = 0, store = this.store;
        // store.set('foo', 22);
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { transactionCalls++; return 23; },
            callback: function(err, committed, val) {
                this.assert(committed, 'committed?');
                this.assertEquals(1, transactionCalls, 'transactionCall count');
                this.assertEquals(23, val);
                this.store.get('foo', function(_, v) {
                    this.assertEquals(23, v);
                    this.done();
                }.bind(this));
            }.bind(this)
        });
    },

    testCommitWithConflict: function() {
        // by default equality to previous value is tested
        var transactionCalls = 0, store = this.store;
        store.set('foo', 22);
        this.rootHandle.commit({
            path: 'foo',
            transaction: function(oldVal) { transactionCalls++; if (oldVal === 22) store.set('foo', 41); return oldVal + 1; },
            callback: function(err, committed, val) {
                this.assert(!committed, 'committed?');
                this.assertEquals(1, transactionCalls, 'transactionCall count');
                this.assertEquals(22, val);
                this.rootHandle.commit({
                    path: 'foo',
                    transaction: function(oldVal) { transactionCalls++; return oldVal + 1; },
                    callback: function(err, committed, val) {
                        this.assert(committed, 'not committed?');
                        this.assertEquals(2, transactionCalls, 'transactionCall count');
                        this.assertEquals(42, val);
                        this.store.get('foo', function(_, v) {
                            this.assertEquals(42, v);
                            this.done();
                        }.bind(this));
                    }.bind(this)
                });
            }.bind(this)
        });
    },

    testCommitWithId: function() {
        var transactionCalls = 0, store = this.store;
        store.set('foo', {value: 1, id: 1});
        this.rootHandle.commit({
            path: 'foo',
            precondition: {id: '2'},
            transaction: function(oldVal) { transactionCalls++; return {id: 3}; },
            callback: function(err, committed, val) {
                this.assert(!committed, 'committed?');
                this.assertEquals(1, transactionCalls, 'transactionCall count');
                this.rootHandle.commit({
                    path: 'foo',
                    precondition: {id: '1'},
                    transaction: function(oldVal) { transactionCalls++; return {id: 3}; },
                    callback: function(err, committed, val) {
                        this.assert(committed, 'not committed? ');
                        this.assertEquals(2, transactionCalls, 'transactionCall count');
                        this.assertEqualState({id: 3}, val, 'eventual value');
                        this.done();
                    }.bind(this)
                });
            }.bind(this)
        });
    },

    testCommitWithValue: function() {
        this.store.set('foo', 2);
        this.rootHandle.commit({
            path: '',
            value: {foo: 3},
            callback: function(err, committed, val) {
                this.assert(committed, 'not committed? ');
                this.assertEqualState({foo: 3}, val, 'eventual value');
                this.store.get('foo', function(_, val) {
                    this.assertEquals(3, val, 'store val');
                    this.done();
                }.bind(this));
            }.bind(this)
        });
    }

});

AsyncTestCase.subclass('lively.persistence.Sync.test.RemoteStore',
'running', {
    setUp: function($super) {
        $super();
        this.url = new URL(Config.nodeJSURL).asDirectory().withFilename('Store/' + this.currentSelector + '/');
        this.store = new lively.persistence.Sync.RemoteStore(this.currentSelector);
        this.rootHandle = this.store.getHandle();
    },

    tearDown: function($super) {
        $super();
        this.store.disablePolling();
    }
},
'testing', {
    testUploadSomeSimpleData: function() {
        this.assertEquals(this.url, this.store.getURL());
        this.rootHandle.set({value: {foo: {bar: 23}}});
        this.delay(function() {
            var serverContent = this.store.getWebResource().get().content;
            this.assertEqualState('{"foo":{"bar":23}}', serverContent);
            this.done();
        }, 20);
    },

    testRemoteChangesAreReceived: function() {
        var callbackCalls = 0;
        this.store.enablePolling({interval: 200});
        this.rootHandle.subscribe();
        this.rootHandle.onValueChanged = function(val, path) {
            callbackCalls++;
            this.assertEqualState({foo: 42}, val);
        }.bind(this);
        this.store.getWebResource().put(JSON.stringify({data: {foo: 42}}), 'application/json');
        this.delay(function() {
            this.assertEquals(1, callbackCalls, 'callback call count');
            this.done();
        }, 900);
    },

    testRemoteAndLocalUpdatesAreNotDuplicated: function() {
        var store1 = new lively.persistence.Sync.RemoteStore(this.currentSelector),
            store2 = new lively.persistence.Sync.RemoteStore(this.currentSelector),
            handle1 = store1.getHandle(),
            handle2 = store2.getHandle();
            callbackCallsHandle1 = 0, callbackCallsHandle2 = 0;
        this.delay(function() {
            store1.disablePolling();
            store2.disablePolling();
            this.assertEquals(1, callbackCallsHandle1, 'callback1 call count');
            this.assertEquals(1, callbackCallsHandle2, 'callback2 call count');
            this.done();
        }, 300);

        store1.enablePolling({interval: 100});
        store2.enablePolling({interval: 100});
        handle1.subscribe();
        handle1.onValueChanged = function(val, path) { callbackCallsHandle1++; }
        handle2.subscribe();
        handle2.onValueChanged = function(val, path) { callbackCallsHandle2++; }
        store1.set('foo', 23);
    },

    testRunStoreTests: function() {
        this._maxWaitDelay = 5000;
        var test = new lively.persistence.Sync.test.StoreAccess(),
            sels = test.allTestSelectors(),
            tests = this.createTests(sels);
        sels.forEach(function(testName, i) { tests[i][testName] = test[testName]; });
        this.runAll(null, function() { this.done(); }.bind(this), tests);
    }

});

}) // end of module