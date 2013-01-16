module('lively.store.tests.Interface').requires('lively.TestFramework', 'lively.store.Interface').toRun(function() {

TestCase.subclass('lively.store.tests.Interface.TestCase',
'running', {
    tearDown: function($super) {
        $super();
        lively.store.flushCache();
    }
},
'helper', {
    createWebSpy: function() {
        var spy  = this.webSpy = {
            putUrl: null, putContent: null, putCount: 0,
            getCount: 0, getUrl: null,
            deleteCount: 0, deleteUrl: null
        }
        this.spyInClass(WebResource, 'put', function(source, mimeType, options) {
            spy.putContent = source;
            spy.putUrl = this.getURL();
            spy.putCount++;
            return this;
        });
        this.spyInClass(WebResource, 'get', function() {
            this.content = spy.putContent;
            spy.getUrl = this.getURL();
            spy.getCount++;
            return this;
        });
        this.spyInClass(WebResource, 'del', function() {
            spy.deleteUrl = this.getURL();
            spy.deleteCount++;
            return this;
        });
    }
});

lively.store.tests.Interface.TestCase.subclass('lively.store.tests.Interface.ObjectStorage',
'tests', {
    test01SimpleGetAndSet: function() {
        var testObject = {storeTestObj: true},
            db = lively.store.get({id: this.currentSelector, type: 'ObjectStorage'});
        db.set("foo", testObject);
        var retrieved = db.get("foo", testObject);
        this.assertIdentity(testObject, retrieved, 'retrieved not identical to stored');
    },

    test02NamedDBs: function() {
        var testObject = {storeTestObj: true},
            db1 = lively.store.get({id: this.currentSelector, type: 'ObjectStorage'});
        db1.set("foo", testObject);
        var db2 = lively.store.get({id: this.currentSelector}),
            retrieved = db2.get("foo", testObject)
        this.assertIdentity(testObject, retrieved, 'retrieved not identical to stored');
    }
});

lively.store.tests.Interface.TestCase.subclass('lively.store.tests.Interface.FileStorage',
'running', {
    setUp: function($super) {
        $super();
        this.createWebSpy();
    }
},
'tests', {
    test01SaveAndLoadFromFile: function() {
        var url = URL.source.withFilename("foo.db"),
            db = lively.store.get({
                id: this.currentSelector, type: "FileStorage",
                url: url
            });
        db.set('xyz');
        this.assertEquals('xyz', this.webSpy.putContent);
        this.assertEquals(url, this.webSpy.putUrl);
        this.assertEquals(1, this.webSpy.putCount, "put count");
        // sync get
        var retrieved1 = db.get();
        this.assertEquals(1, this.webSpy.getCount, "get count 1");
        this.assertEquals(url, this.webSpy.getUrl);
        this.assertEquals('xyz', retrieved1);
        // get via callback
        var retrieved2;
        db.get(function(err, data) { retrieved2 = data; });
        this.assertEquals(2, this.webSpy.getCount, "get count 2");
        this.assertEquals('xyz', retrieved2);
    }
});

lively.store.tests.Interface.TestCase.subclass('lively.store.tests.Interface.CouchDBStorage',
'running', {
    setUp: function($super) {
        $super();
        this.createWebSpy();
    }
},
'tests', {
    xtest01SimpleGetAndSet: function() {
        var testObject = {val: 12345},
            dbName = this.currentSelector.toLowerCase(),
            db = lively.store.get({id: dbName, type: 'CouchDBStorage'});
        db.set("foo", testObject);
        var url = URL.nodejsBase.withFilename("couchdb/" + dbName + '/foo');
        this.assertEquals(1, this.webSpy.putCount);
        this.assertEquals(url, this.webSpy.putUrl);
        this.assertEquals(JSON.stringify(testObject), this.webSpy.putContent);
        var retrieved = db.get("foo", testObject);
        this.assertEquals(testObject.val, retrieved.val,
                          'retrieved not identical to stored ' + retrieved);
        this.assertEquals(1, this.webSpy.getCount);
        this.assertEquals(url, this.webSpy.getUrl);
    },

    test02CreateAndRemoveStore: function() {
        var dbName = this.currentSelector.toLowerCase(),
            dbURL = URL.nodejsBase.withFilename('couchdb/' + dbName + '/'),
            db = lively.store.get({id: dbName, type: 'CouchDBStorage'});
        db.ensureExistance();
        this.assertEquals(1, this.webSpy.putCount);
        this.assertEquals(dbURL, this.webSpy.putUrl);
        db.remove();
        this.assertEquals(1, this.webSpy.deleteCount);
        this.assertEquals(dbURL, this.webSpy.deleteUrl);
    }

});

}); // end of module
