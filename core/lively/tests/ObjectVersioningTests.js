module('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
TestCase.subclass('lively.tests.ObjectVersioning.ObjectVersioningTestCase', 
'versioning testing', {
    // shortcuts
    proxyFor: lively.ObjectVersioning.addObject.bind(lively.ObjectVersioning),
    isProxy: lively.ObjectVersioning.isProxy.bind(lively.ObjectVersioning),
    objectForProxy: lively.ObjectVersioning.getObjectForProxy.bind(lively.ObjectVersioning),
    commitVersion: lively.ObjectVersioning.commitVersion.bind(lively.ObjectVersioning),
    undo: lively.ObjectVersioning.undo.bind(lively.ObjectVersioning),
    redo: lively.ObjectVersioning.redo.bind(lively.ObjectVersioning),
    
    assertInVersion: function(func, version) {
        var a, b,
            previousVersion = lively.CurrentObjectTable;
        
        lively.CurrentObjectTable = version;
        
        this.assert(func.apply());
        
        lively.CurrentObjectTable = previousVersion;
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
            descendant = this.proxyFor(Object.create(proto));
        proto.prop = 15;
        
        this.assertEquals(descendant.prop, 15);
    },
    test07FunctionsCanBeProxied: function() {
        var func = this.proxyFor(function(a) {
            return 1;
        });
    
        this.assert(this.isProxy(func));
    },
    test08MethodApplicationWorksOnProxies: function() {
        var obj = this.proxyFor({});
        obj.prop = 24;
        obj.method = this.proxyFor(function(a) {
            return this.prop;
        });
                
        this.assert(obj.method(), 24);
    },
    test09PrototypeMethodApplication: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(Object.create(proto));
        
        descendant.prop = 24;
        proto.method = this.proxyFor(function(a) {
            return this.prop;
        });
        
        this.assert(descendant.method(), 24);
    },
    
    test10ProxyHasCorrectProperties: function() {
        var obj = this.proxyFor({});
        obj.firstProperty = 'ein merkmal';
        
        this.assert('firstProperty' in obj);
    },
    test11ProxyHasCorrectOwnProperties: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(Object.create(proto));
            
        proto.protoProp = 12;
        descendant.ownProp = 24;
        
        this.assert(descendant.hasOwnProperty('ownProp'));
        this.assert(!descendant.hasOwnProperty('protoProp'));
    },
    test12GetOwnPropertyNames: function() {
        var person = this.proxyFor({}),
            student = this.proxyFor(Object.create(person));
            
        person.age = 21;
        student.averageGrade = 2;
        student.currentSemester = 3;
        
        this.assert(Object.getOwnPropertyNames(student).include('averageGrade'));
        this.assert(Object.getOwnPropertyNames(student).include('currentSemester'));
        this.assert(!Object.getOwnPropertyNames(student).include('age'));
    },
    
    test10CommitedVersion: function() {
        var person, versionBefore;
        
        person = this.proxyFor({});
        person.age = 23;
        
        versionBefore = this.commitVersion();
        
        person.age = 24;
        person.age = 25;
        
        // in the previous version:
        this.assertInVersion(function() {return person.age === 23}, versionBefore);
        // currently:
        this.assertEquals(person.age, 25);
    },
    
    
    
    test11ChangesAfterCommitCanBeUndone: function() {
        var app = this.proxyFor({});
        app.counter = 1;
        
        this.commitVersion();
        
        app.counter = 2;
        
        this.undo();
        
        this.assertEquals(app.counter, 1);
    },
    test12ChangesToCompoundPropertyCanBeUndone: function() {
        var app = this.proxyFor({});
        app.view = this.proxyFor({});
        app.view.color = 'red';
        
        this.commitVersion();
        
        app.view.color = 'green';
        
        this.undo();
        
        this.assertEquals(app.view.color, 'red');
    },
    test13PropertyCreationCanBeUndone: function() {
        var obj = this.proxyFor({});
        
        this.commitVersion();
        
        obj.isPropertyDefined = true;
        
        this.undo();
        
        this.assert(obj.isPropertyDefined === undefined);
    },
    test14UndoneChangesCanBeRedone: function() {
        var address = this.proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        this.commitVersion();
        
        this.undo();
        this.redo();
        
        this.assertEquals(address.city, 'Chicago');
    },
    test15UndonePropertyAdditionCanBeRedone: function() {
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
});
    
});
