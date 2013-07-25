module('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
TestCase.subclass('lively.tests.ObjectVersioningTests.VersioningTests',
'testing', {
    setUp: function() {
        // global reset on each test (for now)
        lively.ObjectVersioning.reset();
    },
    test01PrimitivePropertyRetrievable: function() {
        var person = lively.ObjectVersioning.makeVersionedObjectFor({});
        person.age = 24;
        this.assertEquals(person.age, 24);
    },
    test02UndefinedPropertyIsUndefined: function() {
        var place = lively.ObjectVersioning.makeVersionedObjectFor({});
        this.assert(true, place.coordinates === undefined);
    },
    test03PropertyCanBeOverwritten: function() {
        var app = lively.ObjectVersioning.makeVersionedObjectFor({});
        app.counter = 1;
        app.counter = 2;
        app.counter = 3;
        this.assertEquals(app.counter, 3);
    },
    test04ObjectPropertyRetrievable: function() {
        var person = lively.ObjectVersioning.makeVersionedObjectFor({});
        var address = lively.ObjectVersioning.makeVersionedObjectFor({
            street: 'Friedrichstraße', 
            number: '112b'
        });
        person.address = address;
        // note: person.address and address are different proxy objects...
        this.assertEquals(person.address.street, address.street);
        this.assertEquals(person.address.number, address.number);
    },
    test05CompoundPropertyRetrievable: function() {
        var graphic = lively.ObjectVersioning.makeVersionedObjectFor({});
        graphic.position = lively.ObjectVersioning.makeVersionedObjectFor({});
        graphic.position.x = 13;
        graphic.position.y = 25;
        graphic.position.x = 0;
        graphic.position.y = 0;
        this.assertEquals(graphic.position.x, 0);
        this.assertEquals(graphic.position.y, 0);
    },
    test06ChangesCanBeUndone: function() {
        var app = lively.ObjectVersioning.makeVersionedObjectFor({});
        app.counter = 1;
        app.counter = 2;
        lively.ObjectVersioning.undo();
        this.assertEquals(app.counter, 1);
    },
    test07ChangesToCompoundPropertyCanBeUndone: function() {
        var app = lively.ObjectVersioning.makeVersionedObjectFor({});
        app.view = lively.ObjectVersioning.makeVersionedObjectFor({});
        app.view.color = Color.red;
        app.view.color = Color.green;
        lively.ObjectVersioning.undo();
        this.assertEquals(app.view.color, Color.red);
    },
    test08PropertyCreationCanBeUndone: function() {
        var obj = lively.ObjectVersioning.makeVersionedObjectFor({});
        obj.isPropertyDefined = true;
        lively.ObjectVersioning.undo();
        this.assert(true, obj.isPropertyDefined === undefined);
    },
    // test05UndoneChangesCanBeRedone: function() {
    //     var address = lively.ObjectVersioning.makeVersionedObjectFor({});
    //     address.street = 'Meanstreet';
    //     address.city = 'Chicago';
    //     lively.ObjectVersioning.undo();
    //     lively.ObjectVersioning.redo();
    //     this.assertEquals(address.city, 'Chicago');
    // },
    // test06UndonePropertyAdditionCanBeRedone: function() {
    //     var address = lively.ObjectVersioning.makeVersionedObjectFor({});
    //     address.street = 'Meanstreet';
    //     address.city = 'Chicago';
    //     lively.ObjectVersioning.undo();
    //     lively.ObjectVersioning.undo();
    //     lively.ObjectVersioning.redo();
    //     this.assertEquals(address.street, 'Meanstreet');
    //     this.assert(true, address.city === undefined);
    // },
    // test09ReferenceSharedAmongObjects: function() {
    //     var client1 = lively.ObjectVersioning.makeVersionedObjectFor({}),
    //         client2 = lively.ObjectVersioning.makeVersionedObjectFor({});
    //     client1.sharedServer = lively.ObjectVersioning.makeVersionedObjectFor({});
    //     client1.sharedServer.color = Color.red;
        
    //     client2.sharedServer = client1.sharedServer;
    //     client2.sharedServer.color = Color.green;
        
    //     this.assertEquals(client1.sharedServer.color, Color.green);
    // }
    // test10VersionedObjectHasItsProperties: function() {
    //     var versionedObject = lively.ObjectVersioning.makeVersionedObjectFor({});
    //     versionedObject.firstProperty = 'erstesMerkmal';
    //     this.assertEquals(true, 'firstProperty' in versionedObject);
    // }
});
    
});