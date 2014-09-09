module('lively.tests.HelperTests').requires('lively.TestFramework', 'lively.Helper').toRun(function() {

TestCase.subclass('lively.tests.HelperTests.XMLConverterTest',
'helper', {

	toXML: function(string) {
		return new DOMParser().parseFromString(string, "text/xml").documentElement;
	}

},
'running', {

	setUp: function($super) {
		$super();
		this.sut = new lively.Helper.XMLConverter();
	}

},
'testing', {

	test01XMLNodeToJSON: function() {
		var xml = this.toXML('<test/>');
		var result = this.sut.convertToJSON(xml);
		this.assert(result.tagName, 'test');
		this.assertEquals(Properties.all(result).length, 1);
	},

	test02XMLNodeWithAttributesToJSON: function() {
		var xml = this.toXML('<test id="23" x="foobar" />');
		var result = this.sut.convertToJSON(xml);
		this.assertEquals(result.id, '23');
		this.assertEquals(result.x, 'foobar');
	},

	test03XMLNodeWithAttributesAndChildrenToJSON: function() {
		var xml = this.toXML('<test x="foo"><test2/><test3 abc="def"/></test>');
		var result = this.sut.convertToJSON(xml);
		this.assertEquals(result.children.length, 2);
		this.assertEquals(result.children[0].tagName, 'test2');
		this.assertEquals(result.children[1].abc, 'def');
	},

	test03CDATAAndText: function() {
		var xml = this.toXML('<test><![CDATA[foobar\]\]\> baz</test>');
		var result = this.sut.convertToJSON(xml);
		this.assertEquals(result.children[0].tagName, 'cdataSection');
		this.assertEquals(result.children[0].data, 'foobar');
		this.assertEquals(result.children[1].tagName, 'textNode');
		this.assertEquals(result.children[1].data, ' baz');
	},

	test04JStoXML: function() {
		var jsObj = {tagName: 'script', type: 'foo', 'xlink:href': 'foo.js'};
		var nsMapping = {xlink: Namespace.XLINK};
		var result = this.sut.convertToXML(jsObj, nsMapping, Global.document);
		this.assertEquals(result.tagName, 'script');
		this.assertEquals(result.getAttribute('type'), 'foo');
		this.assertEquals(result.getAttributeNS(Namespace.XLINK, 'href'), 'foo.js');
	},

	test05JStoXMLWithChildNodesAndTextContent: function() {
		var jsObj = {
			tagName: 'foo',
			children: [{
				tagName: 'bar',
				children: [{
					tagName: 'textNode',
					data: 'Hello '
				}, {
					tagName: 'cdataSection',
					data: 'World'
				}]
			}]
		};
		var nsMapping = {};
		var result = this.sut.convertToXML(jsObj, nsMapping, Global.document);
		this.assertEquals(result.tagName, 'foo');
		this.assertEquals(result.childNodes.length, 1);
		this.assertEquals(result.childNodes[0].childNodes.length, 2);
		this.assertEquals(result.childNodes[0].textContent, 'Hello World');
	}

});

TestCase.subclass('lively.tests.HelperTests.LocalStorageTests',
'running', {

    setUp: function() {
        this['__test__'] = lively.LocalStorage.get('__test__');
    },

    tearDown: function() {
        lively.LocalStorage.set('__test__', this['__test__']);
    }

},
'testing', {

    test01LocalStorageAvailability: function() {
        try {
            this.assertEquals(window.localStorage != undefined, lively.LocalStorage.isAvailable());
        } catch (e) {
            // Accessing window.localStorage may lead to SecurityError
            this.assert(true);
        }
    },

    test02LocalStorageValues: function() {
        if (!lively.LocalStorage.isAvailable())
            return this.assert(true);

        lively.LocalStorage.set('__test__', 22.2);
        this.assertEquals(lively.LocalStorage.get('__test__'), 22.2);
    },

    test03LocalStorageRemove: function() {
        if (!lively.LocalStorage.isAvailable())
            return this.assert(true);

        lively.LocalStorage.remove('__test__');
        this.assertEquals(lively.LocalStorage.get('__test__'), null);
    },

    test04LocalStorageKeys: function() {
        if (!lively.LocalStorage.isAvailable())
            return this.assert(true);

        lively.LocalStorage.remove('__test__');
        this.assert(!lively.LocalStorage.keys().include('__test__'));
        lively.LocalStorage.set('__test__', 123);
        this.assert(lively.LocalStorage.keys().include('__test__'));
    }

});

AsyncTestCase.subclass('lively.tests.HelperTests.IndexedDBTests',
'initialize', {

    initialize: function($super, testResult, testSelector) {
        $super(testResult, testSelector);
        this._maxWaitDelay = 5000; // extend the async wait time, IndexedDB can be slooooow
    }

},
'running', {

    testKey: 'test_9U3bQPVMb8hOVZgevYqTVZUu7CdlKZ7AAbnpbAHU',
    altStore: 'test_123_store',

    setUp: function() {
        this.openedDB = lively.IndexedDB.currentDB;
        lively.IndexedDB.currentDB = null;
    },

    tearDown: function() {
        lively.IndexedDB.currentDB = this.openedDB;
    }

},
'testing', {

    test01IndexedDBAvailability: function() {
        this.assertEquals(window.indexedDB != undefined, lively.IndexedDB.isAvailable());
        this.done();
    },

    test02OpenDatabase: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        this.assert(lively.IndexedDB.currentDB == null);
        lively.IndexedDB.ensureDatabase(null, null, function(err) {
            this.assert(err == undefined);
            this.assert(lively.IndexedDB.currentDB != null);
            this.done();
        }.bind(this));
    },

    test03StoreValue: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        var testValue = 'TEST value';
        lively.IndexedDB.set(this.testKey, testValue, function(err, key) {
            this.assert(err == undefined);
            this.assert(key == this.testKey);
            lively.IndexedDB.get(key, function(err, value) {
                this.assert(err == undefined);
                this.assert(value == testValue);
                lively.IndexedDB.remove(this.testKey, function(err) {
                    this.assert(err == undefined);
                    this.done();
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },

    test04ReplaceValue: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        var testValue = 'TEST value';
        lively.IndexedDB.set(this.testKey, testValue, function(err, key) {
            this.assert(err == undefined);
            this.assert(key == this.testKey);
            testValue = 'new TEST(value)';
            lively.IndexedDB.set(this.testKey, testValue, function(err, key) {
                this.assert(err == undefined);
                this.assert(key == this.testKey);
                lively.IndexedDB.get(key, function(err, value) {
                    this.assert(err == undefined);
                    this.assert(value == testValue);
                    lively.IndexedDB.remove(this.testKey, function(err) {
                        this.assert(err == undefined);
                        this.done();
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },

    test05CheckForKey: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        var testValue = 'TEST value';
        lively.IndexedDB.set(this.testKey, testValue, function(err, key) {
            this.assert(err == undefined);
            this.assert(key == this.testKey);
            lively.IndexedDB.has(key, function(err, exists) {
                this.assert(err == undefined);
                this.assert(exists);
                lively.IndexedDB.remove(this.testKey, function(err) {
                    this.assert(err == undefined);
                    lively.IndexedDB.has(this.testKey, function(err, exists) {
                        this.assert(err == undefined);
                        this.assert(!exists);
                        this.done();
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },

    test06OpenAltStore: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        lively.IndexedDB.ensureObjectStore(this.altStore, null, function(err) {
            this.assert(err == undefined);
            var stores = Array.from(lively.IndexedDB.currentDB.objectStoreNames);
            this.assert(stores.include(this.altStore));
            lively.IndexedDB.hasStore(this.altStore, function(err, exists) {
                this.assert(err == undefined);
                this.assert(exists);
                this.done();
            }.bind(this));
        }.bind(this));
    },

    test07StoreValueInAltStore: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        var testValue = 'TEST value';
        lively.IndexedDB.set(this.testKey, testValue, function(err, key) {
            this.assert(err == undefined);
            this.assert(key == this.testKey);
            lively.IndexedDB.has(key, function(err, exists) {  // check default store
                this.assert(err == undefined);
                this.assert(!exists);
                lively.IndexedDB.get(key, function(err, value) {
                    this.assert(err == undefined);
                    this.assert(value == testValue);
                    lively.IndexedDB.remove(this.testKey, function(err) {
                        this.assert(err == undefined);
                        this.done();
                    }.bind(this), this.altStore);
                }.bind(this), this.altStore);
            }.bind(this));
        }.bind(this), this.altStore);
    },

    test08CheckForKeyInAltStore: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        var testValue = 'TEST value';
        lively.IndexedDB.set(this.testKey, testValue, function(err, key) {
            this.assert(err == undefined);
            this.assert(key == this.testKey);
            lively.IndexedDB.has(key, function(err, exists) { // check default store
                this.assert(err == undefined);
                this.assert(!exists);
                lively.IndexedDB.has(key, function(err, exists) {
                    this.assert(err == undefined);
                    this.assert(exists);
                    lively.IndexedDB.remove(this.testKey, function(err) {
                        this.assert(err == undefined);
                        lively.IndexedDB.has(this.testKey, function(err, exists) {
                            this.assert(err == undefined);
                            this.assert(!exists);
                            this.done();
                        }.bind(this), this.altStore);
                    }.bind(this), this.altStore);
                }.bind(this), this.altStore);
            }.bind(this));
        }.bind(this), this.altStore);
    },

    test09ClearStore: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        var testValue = 'TEST value';
        lively.IndexedDB.set(this.testKey, testValue, function(err, key) {
            this.assert(err == undefined);
            this.assert(key == this.testKey);
            lively.IndexedDB.has(key, function(err, exists) {
                this.assert(err == undefined);
                this.assert(exists);
                lively.IndexedDB.clear(function(err) {
                    this.assert(err == undefined);
                    lively.IndexedDB.has(this.testKey, function(err, exists) {
                        this.assert(err == undefined);
                        this.assert(!exists);
                        this.done();
                    }.bind(this), this.altStore);
                }.bind(this), this.altStore);
            }.bind(this), this.altStore);
        }.bind(this), this.altStore);
    },

    test10RemoveStore: function() {
        if (!lively.IndexedDB.isAvailable())
            return this.assert(true) || this.done();

        lively.IndexedDB.ensureObjectStore(this.altStore, null, function(err) {
            this.assert(err == undefined);
            lively.IndexedDB.hasStore(this.altStore, function(err, exists) {
                this.assert(err == undefined);
                this.assert(exists);
                lively.IndexedDB.removeStore(this.altStore, function(err) {
                    this.assert(err == undefined);
                    lively.IndexedDB.hasStore(this.altStore, function(err, exists) {
                        this.assert(err == undefined);
                        this.assert(!exists);
                        this.done();
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }

});

}); // end of module
