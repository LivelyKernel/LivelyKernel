module('lively.store.test.Interface').requires('lively.TestFramework', 'lively.store.Interface').toRun(function() {

TestCase.subclass('lively.store.test.Interface.Fundamentals',
'tests', {
    test01SimpleGetAndSet: function() {
        var testObject = {storeTestObj: true},
            db = lively.store.createDB('test01SimpleGetAndSetDB');
        db.set("foo", testObject);
        var retrieved = db.get("foo", testObject);
        this.assertIdentity(testObject, retrieved, 'retrieved not identical to stored');
    }
});

}); // end of module