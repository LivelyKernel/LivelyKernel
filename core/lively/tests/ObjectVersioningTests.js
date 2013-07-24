module('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
TestCase.subclass('lively.tests.ObjectVersioningTests.PropertyProxyTest',
'testing', {
    setUp: function() {
        // global reset on each test for now
        lively.ObjectVersioning.reset();
    },
    test01PropertyRetrievable: function() {
        var person = lively.ObjectVersioning.versioningProxyFor({});
        person.age = 24;
        this.assertEquals(person.age, 24);
    },
    test02PropertyCanBeOverwritten: function() {
        var app = lively.ObjectVersioning.versioningProxyFor({});
        app.counter = 1;
        app.counter = 2;
        app.counter = 3;
        this.assertEquals(app.counter, 3);
    },
    test03ChangesCanBeUndone: function() {
        var app = lively.ObjectVersioning.versioningProxyFor({});
        app.counter = 1;
        app.counter = 2;
        lively.ObjectVersioning.undo();
        this.assertEquals(app.counter, 1);
    },
    test04PropertyCreationCanBeUndone: function() {
        var obj = lively.ObjectVersioning.versioningProxyFor({});
        obj.isPropertyDefined = true;
        lively.ObjectVersioning.undo();
        this.assert(true, obj.isPropertyDefined === undefined);
    },
    test05UndoneChangesCanBeRedone: function() {
        var address = lively.ObjectVersioning.versioningProxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        this.assertEquals(address.city, 'Chicago');
    },
    test06UndonePropertyAdditionCanBeRedone: function() {
        var address = lively.ObjectVersioning.versioningProxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        this.assertEquals(address.street, 'Meanstreet');
        this.assert(true, address.city === undefined);
    },
    test07CompoundPropertyRetrievable: function() {
        var graphic = lively.ObjectVersioning.versioningProxyFor({});
        graphic.position = lively.ObjectVersioning.versioningProxyFor({});
        graphic.position.x = 13;
        graphic.position.y = 25;
        graphic.position.x = 0;
        graphic.position.y = 0;
        this.assertEquals(graphic.position.x, 0);
        this.assertEquals(graphic.position.y, 0);
    },
    test08ChangesToCompoundPropertyCanBeUndone: function() {
        var app = lively.ObjectVersioning.versioningProxyFor({});
        app.view = lively.ObjectVersioning.versioningProxyFor({});
        app.view.color = Color.red;
        app.view.color = Color.green;
        lively.ObjectVersioning.undo();
        this.assertEquals(app.view.color, Color.red);
    },
    test09ReferenceSharedAmongObjects: function() {
        var client1 = lively.ObjectVersioning.versioningProxyFor({}),
            client2 = lively.ObjectVersioning.versioningProxyFor({});
        client1.sharedServer = lively.ObjectVersioning.versioningProxyFor({});
        client1.sharedServer.color = Color.red;
        
        client2.sharedServer = client1.sharedServer;
        client2.sharedServer.color = Color.green;
        
        this.assertEquals(client1.sharedServer.color, Color.green);
    }
    // test10VersionedObjectHasItsProperties: function() {
    //     var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
    //     versionedObject.firstProperty = 'erstesMerkmal';
    //     this.assertEquals(true, 'firstProperty' in versionedObject);
    // }
});
    
});