module('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
var proxyFor = lively.ObjectVersioning.addObject.bind(lively.ObjectVersioning),
    isProxy = lively.ObjectVersioning.isProxy.bind(lively.ObjectVersioning);
    
TestCase.subclass('lively.tests.ObjectVersioningTests.VersioningTests',
'testing', {
    setUp: function() {
        // global reset on each test (for now)
        lively.ObjectVersioning.init();
    },
    test01ProxyCreation: function() {
        var object = proxyFor({});
        
        this.assert(true, isProxy(object));
    },
    test02ProxyRetrievesPrimitiveProperty: function() {
        var person = proxyFor({});
        person.age = 24;
        
        this.assertEquals(person.age, 24);
    },
    test03ProxyRetrievesNonPrimitiveProperty: function() {
        var person = proxyFor({});
        person.address = proxyFor({
            street: 'Friedrichstraße', 
            number: '112b'
        });
        
        this.assertEquals(person.address.street, 'Friedrichstraße');
        this.assertEquals(person.address.number, '112b');
    },
    test04ProxyIdentity: function() {
        var person = proxyFor({}),
            roomMate = proxyFor({});
        
        person.address = proxyFor({
                street: 'Wrangelstraße', 
                number: '24'
            });
        
        roomMate.address = person.address;
        
        this.assert(true, isProxy(person.address));
        this.assert(true, isProxy(roomMate.address));
        this.assertEquals(person.address, roomMate.address);
    },
    test05ProxyReturnsUndefinedForUndefinedProperties: function() {
        var place = proxyFor({});
        
        this.assert(true, place.coordinates === undefined);
    },
    test06ProtoLookupWorksOnProxies: function() {
        var proto = proxyFor({}),
            descendant;
        proto.prop = 15;
        descendant = proxyFor(Object.create(proto));
        
        this.assertEquals(proto.prop, 15);
        this.assertEquals(descendant.prop, 15);
    },
    test07ChangesCanBeUndone: function() {
        var app = proxyFor({});
        app.counter = 1;
        app.counter = 2;
        
        lively.ObjectVersioning.undo();
        
        this.assertEquals(app.counter, 1);
    },
    test08ChangesToCompoundPropertyCanBeUndone: function() {
        var app = proxyFor({});
        app.view = proxyFor({});
        app.view.color = 'red';
        app.view.color = 'green';
        
        lively.ObjectVersioning.undo();
        
        this.assertEquals(app.view.color, 'red');
    },
    test09PropertyCreationCanBeUndone: function() {
        var obj = proxyFor({});
        obj.isPropertyDefined = true;
        
        lively.ObjectVersioning.undo();
        
        this.assert(true, obj.isPropertyDefined === undefined);
    },
    test10UndoneChangesCanBeRedone: function() {
        var address = proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        
        this.assertEquals(address.city, 'Chicago');
    },
    test11UndonePropertyAdditionCanBeRedone: function() {
        var address = proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        
        this.assertEquals(address.street, 'Meanstreet');
        this.assert(true, address.city === undefined);
    }
    // test10VersionedObjectHasItsProperties: function() {
    //     var versionedObject = proxyFor({});
    //     versionedObject.firstProperty = 'erstesMerkmal';
    //     this.assertEquals(true, 'firstProperty' in versionedObject);
    // }
});
    
});odule('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
var proxyFor = lively.ObjectVersioning.addObject.bind(lively.ObjectVersioning),
    isProxy = lively.ObjectVersioning.isProxy.bind(lively.ObjectVersioning);
    
TestCase.subclass('lively.tests.ObjectVersioningTests.VersioningTests',
'testing', {
    setUp: function() {
        // global reset on each test (for now)
        lively.ObjectVersioning.init();
    },
    test01ProxyCreation: function() {
        var object = proxyFor({});
        
        this.assert(true, isProxy(object));
    },
    test02PrimitiveProperty: function() {
        var person = proxyFor({});
        person.age = 24;
        
        this.assertEquals(person.age, 24);
    },
    test04ProxyHoldsProxy: function() {
        var person = proxyFor({});
        var address = proxyFor({
            street: 'Friedrichstraße', 
            number: '112b'
        });
        person.address = address;
        
        this.assert(true, isProxy(person.address));
        
        this.assertEquals(person.address, address);
        this.assertEquals(person.address.street, address.street);
        this.assertEquals(person.address.number, address.number);
    },
    test05UndefinedPropertyIsUndefined: function() {
        var place = proxyFor({});
        
        this.assert(true, place.coordinates === undefined);
    },
    test05ChangesCanBeUndone: function() {
        var app = proxyFor({});
        app.counter = 1;
        app.counter = 2;
        
        lively.ObjectVersioning.undo();
        
        this.assertEquals(app.counter, 1);
    },
    test06ChangesToCompoundPropertyCanBeUndone: function() {
        var app = proxyFor({});
        app.view = proxyFor({});
        app.view.color = Color.red;
        app.view.color = Color.green;
        
        lively.ObjectVersioning.undo();
        
        this.assertEquals(app.view.color, Color.red);
    },
    test07PropertyCreationCanBeUndone: function() {
        var obj = proxyFor({});
        obj.isPropertyDefined = true;
        
        lively.ObjectVersioning.undo();
        
        this.assert(true, obj.isPropertyDefined === undefined);
    },
    test08UndoneChangesCanBeRedone: function() {
        var address = proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        
        this.assertEquals(address.city, 'Chicago');
    },
    test09UndonePropertyAdditionCanBeRedone: function() {
        var address = proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        
        this.assertEquals(address.street, 'Meanstreet');
        this.assert(true, address.city === undefined);
    },
    test10ReferenceSharedAmongObjects: function() {
        var client1 = proxyFor({}),
            client2 = proxyFor({});
        client1.sharedServer = proxyFor({});
        client1.sharedServer.color = Color.red;
        
        client2.sharedServer = client1.sharedServer;
        client2.sharedServer.color = Color.green;
        
        this.assertEquals(client1.sharedServer.color, Color.green);
    },
    test11ProtoLookup: function() {
        var proto = proxyFor({}),
            descendant;
        proto.prop = 15;
        descendant = proxyFor(Object.create(proto));
        
        this.assertEquals(proto.prop, 15);
        this.assertEquals(descendant.prop, 15);
    },
    test12ProtoLookup: function() {
        var proto = proxyFor({}),
            descendant;
        proto.prop = 1;
        descendant = proxyFor(Object.create(proto));
        descendant.prop = 2;
        
        this.assertEquals(proto.prop, 1);
        this.assertEquals(descendant.prop, 2);
    },
    test13ProxyIdentity: function() {
        var client1 = proxyFor({}),
            client2 = proxyFor({});
        client1.sharedServer = proxyFor({});
        client2.sharedServer = client1.sharedServer;
        
        this.assertEquals(client1.sharedServer, client2.sharedServer);
    }
    // test10VersionedObjectHasItsProperties: function() {
    //     var versionedObject = proxyFor({});
    //     versionedObject.firstProperty = 'erstesMerkmal';
    //     this.assertEquals(true, 'firstProperty' in versionedObject);
    // }
});
    
});odule('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
var proxyFor = lively.ObjectVersioning.addObject.bind(lively.ObjectVersioning),
    isProxy = lively.ObjectVersioning.isProxy.bind(lively.ObjectVersioning);
    
TestCase.subclass('lively.tests.ObjectVersioningTests.VersioningTests',
'testing', {
    setUp: function() {
        // global reset on each test (for now)
        lively.ObjectVersioning.init();
    },
    test01ProxyCreation: function() {
        var object = proxyFor({});
        
        this.assert(true, isProxy(object));
    },
    test01PrimitivePropertyRetrievable: function() {
        var person = proxyFor({});
        person.age = 24;
        
        this.assertEquals(person.age, 24);
    },
    test02UndefinedPropertyIsUndefined: function() {
        var place = proxyFor({});
        
        this.assert(true, place.coordinates === undefined);
    },
    test03PropertyCanBeOverwritten: function() {
        var app = proxyFor({});
        app.counter = 1;
        app.counter = 2;
        app.counter = 3;
        
        this.assertEquals(app.counter, 3);
    },
    test04ObjectPropertyRetrievable: function() {
        var person = proxyFor({});
        var address = proxyFor({
            street: 'Friedrichstraße', 
            number: '112b'
        });
        person.address = address;
        // note: person.address and address are different proxy objects...
        
        this.assertEquals(person.address.street, address.street);
        this.assertEquals(person.address.number, address.number);
    },
    test05ChangesCanBeUndone: function() {
        var app = proxyFor({});
        app.counter = 1;
        app.counter = 2;
        
        lively.ObjectVersioning.undo();
        
        this.assertEquals(app.counter, 1);
    },
    test06ChangesToCompoundPropertyCanBeUndone: function() {
        var app = proxyFor({});
        app.view = proxyFor({});
        app.view.color = Color.red;
        app.view.color = Color.green;
        
        lively.ObjectVersioning.undo();
        
        this.assertEquals(app.view.color, Color.red);
    },
    test07PropertyCreationCanBeUndone: function() {
        var obj = proxyFor({});
        obj.isPropertyDefined = true;
        
        lively.ObjectVersioning.undo();
        
        this.assert(true, obj.isPropertyDefined === undefined);
    },
    test08UndoneChangesCanBeRedone: function() {
        var address = proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        
        this.assertEquals(address.city, 'Chicago');
    },
    test09UndonePropertyAdditionCanBeRedone: function() {
        var address = proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        
        this.assertEquals(address.street, 'Meanstreet');
        this.assert(true, address.city === undefined);
    },
    test10ReferenceSharedAmongObjects: function() {
        var client1 = proxyFor({}),
            client2 = proxyFor({});
        client1.sharedServer = proxyFor({});
        client1.sharedServer.color = Color.red;
        
        client2.sharedServer = client1.sharedServer;
        client2.sharedServer.color = Color.green;
        
        this.assertEquals(client1.sharedServer.color, Color.green);
    },
    test11ProtoLookup: function() {
        var proto = proxyFor({}),
            descendant;
        proto.prop = 15;
        descendant = proxyFor(Object.create(proto));
        
        this.assertEquals(proto.prop, 15);
        this.assertEquals(descendant.prop, 15);
    },
    test12ProtoLookup: function() {
        var proto = proxyFor({}),
            descendant;
        proto.prop = 1;
        descendant = proxyFor(Object.create(proto));
        descendant.prop = 2;
        
        this.assertEquals(proto.prop, 1);
        this.assertEquals(descendant.prop, 2);
    },
    test13ProxyIdentity: function() {
        var client1 = proxyFor({}),
            client2 = proxyFor({});
        client1.sharedServer = proxyFor({});
        client2.sharedServer = client1.sharedServer;
        
        this.assertEquals(client1.sharedServer, client2.sharedServer);
    }
    // test10VersionedObjectHasItsProperties: function() {
    //     var versionedObject = proxyFor({});
    //     versionedObject.firstProperty = 'erstesMerkmal';
    //     this.assertEquals(true, 'firstProperty' in versionedObject);
    // }
});
    
});