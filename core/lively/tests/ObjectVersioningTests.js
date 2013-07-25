module('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
TestCase.subclass('lively.tests.ObjectVersioningTests.VersioningTests',
'testing', {
    setUp: function() {
        // global reset on each test (for now)
        lively.ObjectVersioning.reset();
    },
    test01proxyCreation: function() {
        var target = {},
            proxy = lively.ObjectVersioning.wrap(target);
        this.assertEquals(lively.ObjectVersioning.unwrap(proxy), target);
    },
    test02PrimitivePropertyRetrievable: function() {
        var person = lively.ObjectVersioning.wrap({});
        person.age = 24;
        this.assertEquals(person.age, 24);
    },
    test03PropertyCanBeOverwritten: function() {
        var app = lively.ObjectVersioning.wrap({});
        app.counter = 1;
        app.counter = 2;
        app.counter = 3;
        this.assertEquals(app.counter, 3);
    },
    test04ObjectPropertyRetrievable: function() {
        var person = lively.ObjectVersioning.wrap({});
        var address = lively.ObjectVersioning.wrap({street: 'Friedrichstraße', number: '112b'});
        person.address = address;
        this.assertEquals(person.address, address);
    },
    test05CompoundPropertyRetrievable: function() {
        var graphic = lively.ObjectVersioning.wrap({});
        graphic.position = lively.ObjectVersioning.wrap({});
        graphic.position.x = 13;
        graphic.position.y = 25;
        graphic.position.x = 0;
        graphic.position.y = 0;
        this.assertEquals(graphic.position.x, 0);
        this.assertEquals(graphic.position.y, 0);
    },
    // test03ChangesCanBeUndone: function() {
    //     var app = lively.ObjectVersioning.wrap({});
    //     app.counter = 1;
    //     app.counter = 2;
    //     lively.ObjectVersioning.undo();
    //     this.assertEquals(app.counter, 1);
    // },
    // test04PropertyCreationCanBeUndone: function() {
    //     var obj = lively.ObjectVersioning.wrap({});
    //     obj.isPropertyDefined = true;
    //     lively.ObjectVersioning.undo();
    //     this.assert(true, obj.isPropertyDefined === undefined);
    // },
    // test05UndoneChangesCanBeRedone: function() {
    //     var address = lively.ObjectVersioning.wrap({});
    //     address.street = 'Meanstreet';
    //     address.city = 'Chicago';
    //     lively.ObjectVersioning.undo();
    //     lively.ObjectVersioning.redo();
    //     this.assertEquals(address.city, 'Chicago');
    // },
    // test06UndonePropertyAdditionCanBeRedone: function() {
    //     var address = lively.ObjectVersioning.wrap({});
    //     address.street = 'Meanstreet';
    //     address.city = 'Chicago';
    //     lively.ObjectVersioning.undo();
    //     lively.ObjectVersioning.undo();
    //     lively.ObjectVersioning.redo();
    //     this.assertEquals(address.street, 'Meanstreet');
    //     this.assert(true, address.city === undefined);
    // },

    // test08ChangesToCompoundPropertyCanBeUndone: function() {
    //     var app = lively.ObjectVersioning.wrap({});
    //     app.view = lively.ObjectVersioning.wrap({});
    //     app.view.color = Color.red;
    //     app.view.color = Color.green;
    //     lively.ObjectVersioning.undo();
    //     this.assertEquals(app.view.color, Color.red);
    // },
    // test09ReferenceSharedAmongObjects: function() {
    //     var client1 = lively.ObjectVersioning.wrap({}),
    //         client2 = lively.ObjectVersioning.wrap({});
    //     client1.sharedServer = lively.ObjectVersioning.wrap({});
    //     client1.sharedServer.color = Color.red;
        
    //     client2.sharedServer = client1.sharedServer;
    //     client2.sharedServer.color = Color.green;
        
    //     this.assertEquals(client1.sharedServer.color, Color.green);
    // }
    // test10VersionedObjectHasItsProperties: function() {
    //     var versionedObject = lively.ObjectVersioning.wrap({});
    //     versionedObject.firstProperty = 'erstesMerkmal';
    //     this.assertEquals(true, 'firstProperty' in versionedObject);
    // }
});
    
});