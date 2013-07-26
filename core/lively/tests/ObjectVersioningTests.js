module('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
TestCase.subclass('lively.tests.ObjectVersioning.ObjectVersioningTestCase', 
'versioning testing', {
    proxyFor: lively.ObjectVersioning.addObject.bind(lively.ObjectVersioning),
    isProxy: lively.ObjectVersioning.isProxy.bind(lively.ObjectVersioning),
    objectForProxy: lively.ObjectVersioning.getObjectForProxy.bind(lively.ObjectVersioning),
    commitVersion: lively.ObjectVersioning.commitVersion.bind(lively.ObjectVersioning),
    undo: lively.ObjectVersioning.undo.bind(lively.ObjectVersioning),
    redo: lively.ObjectVersioning.redo.bind(lively.ObjectVersioning),
    
    assertEqualsInVersion: function(a, b, version) {
        // TODO: no good idea how to do this, yet...
        
        // more specifically, no idea how parameters should be passed in a way
        // that they can get be fully evaluated in the context of the previous version
        
        // example: this.assertEqualsInVersion(person.age, 24, aVersion) in a way that both
        // personProxy->person and ageProxy->age can be resolved using aVersion
        
        // then subclass this test case instead
    },
    
}
);

lively.tests.ObjectVersioning.ObjectVersioningTestCase.subclass(
'lively.tests.ObjectVersioningTests.VersioningTests',
'testing', {
    setUp: function() {
        // global reset on each test (for now)
        lively.ObjectVersioning.init();
    },
    test01ProxyCreation: function() {
        var object = this.proxyFor({});
        
        this.assert(this.isProxy(object));
    },
    test02ProxyRetrievesPrimitiveProperty: function() {
        var person = this.proxyFor({});
        person.age = 24;
        
        this.assertEquals(person.age, 24);
    },
    test03ProxyRetrievesNonPrimitiveProperty: function() {
        var person = this.proxyFor({});
        person.address = this.proxyFor({
            street: 'Friedrichstraße', 
            number: '112b'
        });
        
        this.assertEquals(person.address.street, 'Friedrichstraße');
        this.assertEquals(person.address.number, '112b');
    },
    test04ProxyIdentity: function() {
        var person = this.proxyFor({}),
            roomMate = this.proxyFor({});
        
        person.address = this.proxyFor({
                street: 'Wrangelstraße', 
                number: '24'
            });
        
        roomMate.address = person.address;
        
        this.assert(this.isProxy(person.address));
        this.assert(this.isProxy(roomMate.address));
        this.assertEquals(person.address, roomMate.address);
    },
    test05ProxyReturnsUndefinedForUndefinedProperties: function() {
        var place = this.proxyFor({});
        
        this.assert(place.coordinates === undefined);
    },
    test06ProtoLookupWorksOnProxies: function() {
        var proto = this.proxyFor({}),
            descendant;
        proto.prop = 15;
        descendant = this.proxyFor(Object.create(proto));
        
        this.assertEquals(proto.prop, 15);
        this.assertEquals(descendant.prop, 15);
    },
    test07CommitedVersionDoesntChange: function() {
        var person, versionBefore, previousVersionOfPerson;
        
        person = this.proxyFor({});
        person.age = 23;
        
        versionBefore = this.commitVersion();
        
        person.age = 24;
        person.age = 25;
        
        // in the previous version
        // TODO: provide some way of this.assertEqualsInVersion(...)
        previousVersionOfPerson = this. objectForProxy(person, versionBefore);
        this.assertEquals(previousVersionOfPerson.age, 23);
        
        // currently
        this.assertEquals(person.age, 25);
    },
    test08ChangesAfterCommitCanBeUndone: function() {
        var app = this.proxyFor({});
        app.counter = 1;
        
        this.commitVersion();
        
        app.counter = 2;
        
        this.undo();
        
        this.assertEquals(app.counter, 1);
    },
    test09ChangesToCompoundPropertyCanBeUndone: function() {
        var app = this.proxyFor({});
        app.view = this.proxyFor({});
        app.view.color = 'red';
        
        this.commitVersion();
        
        app.view.color = 'green';
        
        this.undo();
        
        this.assertEquals(app.view.color, 'red');
    },
    test10PropertyCreationCanBeUndone: function() {
        var obj = this.proxyFor({});
        
        this.commitVersion();
        
        obj.isPropertyDefined = true;
        
        this.undo();
        
        this.assert(obj.isPropertyDefined === undefined);
    },
    test11UndoneChangesCanBeRedone: function() {
        var address = this.proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        this.commitVersion();
        
        this.undo();
        this.redo();
        
        this.assertEquals(address.city, 'Chicago');
    },
    test12UndonePropertyAdditionCanBeRedone: function() {
        var address = this.proxyFor({});
        this.commitVersion();
        address.street = 'Meanstreet';
        this.commitVersion();
        address.city = 'Chicago';
        
        this.undo();
        this.undo();
        this.redo();
        
        this.assertEquals(address.street, 'Meanstreet');
        this.assert(address.city === undefined);
    },
    // testXYVersionedObjectHasItsProperties: function() {
    //     var versionedObject = this.proxyFor({});
    //     versionedObject.firstProperty = 'erstesMerkmal';
    //     this.assertEquals(true, 'firstProperty' in versionedObject);
    // }
});
    
});
