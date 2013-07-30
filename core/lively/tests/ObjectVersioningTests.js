module('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
TestCase.subclass('lively.tests.ObjectVersioningTests.ObjectVersioningTestCase', 
'versioning testing', {
    // shortcuts
    proxyFor: lively.ObjectVersioning.proxy.bind(lively.ObjectVersioning),
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

lively.tests.ObjectVersioningTests.ObjectVersioningTestCase.subclass(
'lively.tests.ObjectVersioningTests.ProxyTests',
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
    test08ArraysCanBeProxied: function() {
        var arr = this.proxyFor([]);
        
        arr[0] = this.proxyFor({});
        
        this.assert(this.isProxy(arr));
        this.assert(this.isProxy(arr[0]));
    },
    test09MethodApplicationWorksOnProxies: function() {
        var obj = this.proxyFor({});
        obj.prop = 24;
        obj.method = this.proxyFor(function(a) {
            return this.prop;
        });
                
        this.assert(obj.method(), 24);
    },
    test10MethodFromPrototypeIsAppliedCorrectly: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(Object.create(proto));
        
        proto.prop = 1;
        descendant.prop = 2;
        proto.method = this.proxyFor(function(a) {
            return this.prop;
        });
        
        this.assert(descendant.method(), 2);
    },
    test11ProxyHasCorrectProperties: function() {
        var obj = this.proxyFor({});
        obj.firstProperty = 'ein merkmal';
        
        this.assert('firstProperty' in obj);
    },
    test12ProxyHasCorrectOwnProperties: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(Object.create(proto));
            
        proto.protoProp = 12;
        descendant.ownProp = 24;
        
        this.assert(descendant.hasOwnProperty('ownProp'));
        this.assertEquals(descendant.hasOwnProperty('protoProp'), false);
    },
    test13GetOwnPropertyNames: function() {
        var person = this.proxyFor({}),
            student = this.proxyFor(Object.create(person));
            
        person.age = 21;
        student.averageGrade = 2;
        student.currentSemester = 3;
        
        this.assert(Object.getOwnPropertyNames(student).include('averageGrade'));
        this.assert(Object.getOwnPropertyNames(student).include('currentSemester'));
        this.assertEquals(Object.getOwnPropertyNames(student).include('age'), false);
    },
    test14ProxiedObjectsCanBeFrozen: function() {
        var obj = {},
            proxy = this.proxyFor(obj);
            
        this.assertEquals(Object.isFrozen(proxy), false);
                
        Object.freeze(proxy);
        
        this.assert(Object.isFrozen(proxy));
        this.assert(Object.isFrozen(obj));
    },
    test15ProxiedObjectsCanBeSealed: function() {
        var obj = {},
            proxy = this.proxyFor(obj);
            
        this.assertEquals(Object.isSealed(proxy), false);
            
        Object.seal(proxy);
        
        this.assert(Object.isSealed(proxy));
        this.assert(Object.isSealed(obj));
    },
    test16ExtensionsToProxiedObjectsCanBePrevented: function() {
        var obj = {},
            proxy = this.proxyFor(obj);
            
        this.assert(Object.isExtensible(proxy));
            
        Object.preventExtensions(proxy);
        
        this.assertEquals(Object.isExtensible(proxy), false);
        this.assertEquals(Object.isExtensible(obj), false);
    },
    test17GetPrototypeOfProxy: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(Object.create(proto));
            
        this.assertEquals(Object.getPrototypeOf(descendant), proto);
    },
    test18ProxiedConstructorReturnsProxiedInstance: function() {
        var NewType = function () {this.prop = 3},
            ProxiedConstructor = this.proxyFor(NewType),
            newInstance = new ProxiedConstructor();
                
        this.assert(this.isProxy(newInstance));
        this.assertEquals(newInstance.prop, 3);
    },
    
    // === PENDING ===
    // 
    // TODO: __proto__ slot is not working with proxies correctly
    //       see the following broken test case for details
    // 
    // test17ProxiesCanBePrototypes: function() {
    //     var proto = {a:3},
    //         protoProxy = this.proxyFor({a:3}),
    //         descendantObj = Object.create(proto);
    //     
    //     this.assertEquals(descendantObj.__proto__ === proto);
    //     this.assertEquals(descendantObj.__proto__ === protoProxy);
    //     this.assert(this.isProxy(descendantObj.__proto__));
    //     
    //     // all of the above assertions currently fail, however, the following doesn't fail:
    //     this.assertEquals(descendantObj.a, 3);
    //     
    //     // while __proto__ doesn't return the correct object it appears 
    //     // proto lookup still works correctly... :-/
    //     
    //     // // normally, without proxies, the example would look like this
    //     proto = {a:3};
    //     descendantObj = Object.create(proto);
    //     this.assertEquals(descendantObj.__proto__, proto); // correct assertion
    // },
    // test17PrototypeOfProxyCanBeChanged: function() {
    //     var originalPrototype = this.proxyFor({}),
    //         otherPrototype = this.proxyFor({}),
    //         descendant = this.proxyFor(Object.create(originalPrototype));
    //     
    //     originalPrototype.method = this.proxyFor(function() {return 1});
    //     otherPrototype.method = this.proxyFor(function() {return 2});
    //                             
    //     descendant.__proto__ = otherPrototype;
    //     
    //     // this.assertEquals(Object.getPrototypeOf(descendant), otherPrototype);
    //     this.assertEquals(descendant.method(), 2);
    // },
});
    
lively.tests.ObjectVersioningTests.ObjectVersioningTestCase.subclass(
'lively.tests.ObjectVersioningTests.VersionsTests',
'testing', {
    setUp: function() {
        // global reset on each test (for now)
        lively.ObjectVersioning.init();
    },
    test01CommitedVersion: function() {
        var person, versionBefore;
        
        person = this.proxyFor({});
        person.age = 23;
        
        versionBefore = this.commitVersion();
        
        person.age = 24;
        person.age = 25;
        
        // in the previous version:
        this.assertInVersion(function() {return person.age === 23}, versionBefore);
        // currently:
        this.assertInVersion(function() {return person.age === 25}, lively.CurrentObjectTable);
    },
    test02VersionsOfAnArray: function() {
        var arr, versionBefore;
        
        arr = this.proxyFor([]);
        
        arr[0] = 1;
        
        versionBefore = this.commitVersion();
        
        arr[0] = 2;
        arr[1] = 2;
                
        // in the previous version:
        this.assertInVersion(function() {return arr[0] === 1}, versionBefore);
        this.assertInVersion(function() {return arr[1] === undefined}, versionBefore);
        // currently:
        this.assertInVersion(function() {return arr[0] === 2}, lively.CurrentObjectTable);
        this.assertInVersion(function() {return arr[1] === 2}, lively.CurrentObjectTable);
    },
    test03ChangesAfterCommitCanBeUndone: function() {
        var app = this.proxyFor({});
        app.counter = 1;
        
        this.commitVersion();
        
        app.counter = 2;
        
        this.undo();
        
        this.assertEquals(app.counter, 1);
    },
    test04ChangesToCompoundPropertyCanBeUndone: function() {
        var app = this.proxyFor({});
        app.view = this.proxyFor({});
        app.view.color = 'red';
        
        this.commitVersion();
        
        app.view.color = 'green';
        
        this.undo();
        
        this.assertEquals(app.view.color, 'red');
    },
    test05PropertyCreationCanBeUndone: function() {
        var obj = this.proxyFor({});
        
        this.commitVersion();
        
        obj.isPropertyDefined = true;
        
        this.undo();
        
        this.assert(obj.isPropertyDefined === undefined);
    },
    test06UndoneChangesCanBeRedone: function() {
        var address = this.proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        this.commitVersion();
        
        this.undo();
        this.redo();
        
        this.assertEquals(address.city, 'Chicago');
    },
    test07UndonePropertyAdditionCanBeRedone: function() {
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
    
    // === PENDING ===
    // 
    // TODO: first fix the pending __proto__ test cases of ProxyTests
    //
    // test07ChangingPrototypeUndone: function() {
    //     var originalPrototype = this.proxyFor({}),
    //         otherPrototype = this.proxyFor({}),
    //         descendant = this.proxyFor(Object.create(originalPrototype));
    //     
    //     this.commitVersion();
    //     
    //     descendant.__proto__ = otherPrototype;
    //     
    //     this.undo();
    //     
    //     this.assertEquals(Object.getPrototypeOf(descendant), originalPrototype);
    // },
    // test08UndoingPrototypeChangeIsEffective: function() {
    //     var originalPrototype = this.proxyFor({}),
    //         otherPrototype = this.proxyFor({}),
    //         descendant = this.proxyFor(Object.create(originalPrototype));
    //     
    //     originalPrototype.method = this.proxyFor(function() {return 1});
    //     otherPrototype.method = this.proxyFor(function() {return 2});
    //     
    //     this.commitVersion();
    //     
    //     descendant.__proto__ = otherPrototype;
    //             
    //     this.undo();
    //     
    //     this.assertEquals(descendant.method(), 1);
    // },
});

TestCase.subclass('lively.tests.ObjectVersioningTests.SourceTransformationTests',
'helpers',{
    transform: function(source) {
        return lively.ObjectVersioning.transformSource(source);
    }
},
'testing',{
   test01ObjectLiterals: function() {
        var input = 'var obj = {}',
            expectedOutput = 'var obj = lively.ObjectVersioning.proxy({})';
        
        this.assertEquals(this.transform(input), expectedOutput);
   },
   test02ArrayLiterals: function() {
       var input = 'var arr = []',
            expectedOutput = 'var arr = lively.ObjectVersioning.proxy([])';
        
        this.assertEquals(this.transform(input), expectedOutput);
   },
   test03FunctionLiteral: function() {
       var input = 'var func = function() {\nreturn 12;\n}',
            expectedOutput = 'var func = lively.ObjectVersioning.proxy(function() {\nreturn 12\n})';
                
        this.assertEquals(this.transform(input), expectedOutput);
   }
});

});
