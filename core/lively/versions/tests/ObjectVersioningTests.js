module('lively.versions.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.versions.ObjectVersioning').toRun(function() {

TestCase.subclass('lively.versions.tests.TestCase', 
'versioning shortcuts', {
    proxyFor: function(target) {
        return lively.versions.ObjectVersioning.proxyFor(target);
    },
    objectFor: function(proxy) {
        return lively.versions.ObjectVersioning.getObjectForProxy(proxy);
    },
    isProxy: function(obj) {
        return lively.versions.ObjectVersioning.isProxy(obj);
    },
    commitVersion: function() {
        return lively.versions.ObjectVersioning.commitVersion();
    },
    undo: function() {
        lively.versions.ObjectVersioning.undo();
    },
    redo: function() {
        lively.versions.ObjectVersioning.redo();
    },
    transform: function(source) {
        return lively.versions.ObjectVersioning.transformSource(source);
    },
}, 
'testing', {
    assertInVersion: function(func, version) {
        var a, b,
            previousVersion = lively.CurrentObjectTable;
        
        lively.CurrentObjectTable = version;
        
        this.assert(func.apply());
        
        lively.CurrentObjectTable = previousVersion;
    },
});

lively.versions.tests.TestCase.subclass(
'lively.versions.tests.ObjectVersioningTests.ProxyObjectTests',
// these test cases more or less resemble a spec for the proxies:
// proxies should be transparent, they should behave just like regular objects
'testing', {
    test01ProxyCreation: function() {
        var proxy = this.proxyFor({});
        
        this.assert(this.isProxy(proxy));
    },
    test02ProxyResolvesToObjectViaObjectTable: function() {
        var object = {},
            proxy = this.proxyFor(object);
        
        this.assertEquals(this.objectFor(proxy), object);
    },
    test03ProxyRetrievesPrimitiveProperty: function() {
        var obj = {},
            proxy = this.proxyFor(obj);
            
        obj.age = 24;
        
        this.assertEquals(proxy.age, 24);
    },
    test04ProxyCanWritePrimitiveProperty: function() {
        var obj = {},
            proxy = this.proxyFor(obj);
            
        proxy.age = 24;
        
        this.assertEquals(obj.age, 24);
    },
    test05ProxyRetrievesNonPrimitiveProperty: function() {
        var personProxy = this.proxyFor({age : 24}),
            address = {
                street: 'Friedrichstraße', 
                number: '112b'
            },
            addressProxy = this.proxyFor(address);
            
        personProxy.address = addressProxy;
        
        this.assert(this.isProxy(personProxy.address));
        this.assertEquals(this.objectFor(personProxy.address), address);
    },
    test06ProxiesGetPassedByReference: function() {
        var person = this.proxyFor({}),
            roomMate = this.proxyFor({});
        
        person.address = this.proxyFor({
                street: 'Wrangelstraße', 
                number: '24'
            });
        
        roomMate.address = person.address;
        
        this.assertIdentity(person.address, roomMate.address);
    },
    test07ProxiesReturnUndefinedForNotDefinedProperties: function() {
        var place = this.proxyFor({});
        
        this.assert(place.coordinates === undefined);
    },
    test08FunctionsCanBeProxied: function() {
        var func = this.proxyFor(function funcName(a) {
            return 1;
        });
    
        this.assert(this.isProxy(func));
        this.assertEquals(func.name, 'funcName');
    },
    test09ArraysCanBeProxied: function() {
        var arr = this.proxyFor([]);
        
        arr[0] = this.proxyFor({});
        
        this.assert(this.isProxy(arr));
        this.assert(this.isProxy(arr[0]));
    },
    test10ProxiedMethodCanBeApplied: function() {
        var obj = this.proxyFor({prop: 24});

        obj.method = this.proxyFor(function(a) {
            return this.prop;
        });
        
        this.assert(obj.method(), 24);
    },
    test11ProxiedAnonymousFunctionCanBeApplied: function() {
        var func = this.proxyFor(function() {return 123});
        
        this.assertEquals(func(), 123);
    },
    test12ProxiesAlwaysReturnProxies: function() {
        var obj = {
                prop: {}, 
                method: function() {return {}}
            },
            proxy = this.proxyFor(obj);
            
        this.assert(this.isProxy(proxy.prop));
        this.assert(this.isProxy(proxy.method))
    },
    test13ProxiedConstructorReturnsProxiedInstance: function() {
        var ProxiedConstructor = this.proxyFor(function (name, age) {
                this.name = name;
                this.age = age;
                this.isPerson = true;
            }),
            aPerson = new ProxiedConstructor('Joe', '19');
        
        this.assert(this.isProxy(aPerson));
        this.assert(aPerson.isPerson)
        this.assertEquals(aPerson.name, 'Joe');
        this.assertEquals(aPerson.age, 19);
    },
    test14PrototypeCanBeAProxy: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(lively.create(proto));
        
        this.assertEquals(Object.getPrototypeOf(descendant), proto);
        this.assertEquals(descendant.__proto__, proto);
        this.assert(this.isProxy(Object.getPrototypeOf(descendant)));
    },
    test15PrototypeOfProxyCanBeChanged: function() {
        var originalPrototype = this.proxyFor({v: 1}),
            otherPrototype = this.proxyFor({v: 2}),
            descendant = this.proxyFor(lively.create(originalPrototype));
        
        descendant.__proto__ = otherPrototype;
        
        this.assertEquals(Object.getPrototypeOf(descendant), otherPrototype);
        this.assertEquals(descendant.__proto__, otherPrototype);
        this.assertEquals(descendant.v, 2);
    },
    test16ProtoLookupWorksOnProxies: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(lively.create(proto));
        proto.prop = 15;
                
        this.assertEquals(descendant.prop, 15);
    },
    test17MethodFromPrototypeIsAppliedCorrectly: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(lively.create(proto));
        
        proto.prop = 1;
        proto.method = this.proxyFor(function(a) {
            return this.prop;
        });
        this.assert(descendant.method(), 1);
        
        descendant.prop = 2;
        this.assert(descendant.method(), 2);
    },
    test18ObjCanOverwriteInheritedProperty: function() {
        var obj = this.proxyFor({a: 2}),
            subObj = this.proxyFor(lively.create(obj));
        
        subObj.a = 5;
        
        this.assertEquals(obj.a, 2);
        this.assertEquals(subObj.a, 5);
    },
    test19MethodCanBeAddedToPrototypeOfConstructor: function() {
        var instance,
            NewType = this.proxyFor(function() {
                this.prop = 12;
            });
        
        NewType.prototype.getProp = this.proxyFor(function() {
            return this.prop;
        });
        
        instance = new NewType();
        
        this.assertEquals(instance.constructor, NewType);
        this.assertEquals(instance.__proto__, NewType.prototype);
        this.assertEquals(instance.prop, 12);
        this.assert(this.isProxy(instance.getProp));
        this.assertEquals(instance.getProp(), 12);
    },
    test20ConstructorWithProxiedPrototypeProperty: function() {
        var prototype = this.proxyFor({protoProp: 'p'}),
            Constructor = this.proxyFor(function C(parameter){
                this.constructorProp = 'c';
                this.argument = parameter;
            }),
            instance;
        
        Constructor.prototype = prototype;
        instance = new Constructor('a');
        
        this.assertEquals(instance.protoProp, 'p');
        this.assertEquals(instance.constructorProp, 'c');
        this.assertEquals(instance.argument, 'a');
    },
    test21ProxyHasCorrectProperties: function() {
        var proto = this.proxyFor({protoProp: 1}),
            descendant = this.proxyFor(lively.create(proto));
        descendant.ownProp = 2;
        
        this.assert('protoProp' in descendant);
        this.assert('ownProp' in descendant);
        this.assert(!('neverDefinedProperty' in descendant));
    },
    test22ProxyHasCorrectOwnProperties: function() {
        var proto = this.proxyFor({}),
            descendant = this.proxyFor(lively.create(proto));
            
        proto.protoProp = 12;
        descendant.ownProp = 24;
        
        this.assert(descendant.hasOwnProperty('ownProp'));
        this.assert(!descendant.hasOwnProperty('protoProp'));
    },
    test23GetOwnPropertyNames: function() {
        var person = this.proxyFor({}),
            student = this.proxyFor(lively.create(person)),
            ownProps;
            
        person.age = 21;
        student.avgGrade = 2;
        student.semester = 3;
        
        ownProps = Object.getOwnPropertyNames(student);
        this.assertEquals(['avgGrade', 'semester'].intersect(ownProps).length, 2);
    },
    test24PropertyEnumerationWorks: function() {
        var proto = {a:1, b:2, c:3},
            obj = this.proxyFor(lively.create(proto)),
            enumeratedProps = [];
        
        obj.d = 4;
        obj.e = 5;
        obj.f = 6;
        
        for (var prop in obj) {
            enumeratedProps.push(prop);
        }

        this.assert(['a','b','c','d', 'e', 'f'].intersect(enumeratedProps).length === 6);
    },
    test25CorrectObjectKeys: function() {
        var proto = {a:1, b:2, c:3},
            obj = this.proxyFor(lively.create(proto));
        
        obj.d = 4;
        obj.e = 5;
        obj.f = 6;
        
        this.assert(['d', 'e', 'f'].intersect(Object.keys(obj)).length === 3);
    },
    test26ProxiedObjectsCanBeFrozen: function() {
        var obj = {},
            proxy = this.proxyFor(obj);
            
        this.assertEquals(Object.isFrozen(proxy), false);
                
        Object.freeze(proxy);
        
        this.assert(Object.isFrozen(proxy));
        this.assert(Object.isFrozen(obj));
    },
    test27ProxiedObjectsCanBeSealed: function() {
        var obj = {},
            proxy = this.proxyFor(obj);
            
        this.assertEquals(Object.isSealed(proxy), false);
            
        Object.seal(proxy);
        
        this.assert(Object.isSealed(proxy));
        this.assert(Object.isSealed(obj));
    },
    test28ExtensionsToProxiedObjectsCanBePrevented: function() {
        var obj = {},
            proxy = this.proxyFor(obj);
            
        this.assert(Object.isExtensible(proxy));
            
        Object.preventExtensions(proxy);
        
        this.assertEquals(Object.isExtensible(proxy), false);
        this.assertEquals(Object.isExtensible(obj), false);
    },
    test29FunctionIsPrintedWithFunctionParamtersAndBody: function() {
        // which is helpful during debugging and necessary for
        // how lively's $super-calls work
        var func = this.proxyFor(function addition($super, a, b) {
                return $super(a, b);
            }),
            expectedOutput = 'function addition($super, a, b) {\n' +
            '                return $super(a, b);\n' +
            '            }';
        
        this.assertEquals(func.toString(), expectedOutput);
    },
    test30DefineTriggerAndLookupPropertySetter__deprecatedVariant: function() {
        var obj = this.proxyFor({});
        
        obj.__defineSetter__('aProp', this.proxyFor(function(val) {
           this.anotherProp = val * 2;
        }));
        obj.aProp = 5;
        
        this.assertEquals(obj.anotherProp, 10);
        this.assert(Object.isFunction(obj.__lookupSetter__('aProp')));
    },
    test31DefineTriggerAndLookupPropertyGetter__deprecatedVariant: function() {
        var obj = this.proxyFor({anotherProp: 5});
        
        obj.__defineGetter__('aProp', this.proxyFor(function(val) {
           return this.anotherProp;
        }));
        
        this.assertEquals(obj.aProp, 5);
        this.assert(Object.isFunction(obj.__lookupGetter__('aProp')));
    },
    test32DefineOrLookupGetterOrSetterStuff: function() {
        var obj = this.proxyFor({set aProp(val) {this.anotherProp = val * 2}});
        
        obj.aProp = 5;
        
        this.assertEquals(obj.anotherProp, 10);
    }
});
    
lively.versions.tests.TestCase.subclass(
'lively.versions.tests.ObjectVersioningTests.VersionsTests',
'testing', {
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
    test08UndoingAChangeOfProto: function() {
        var originalPrototype = this.proxyFor({
                method: this.proxyFor(function() {return 1}),
            }),
            otherPrototype = this.proxyFor({
                method: this.proxyFor(function() {return 2}),
            }),
            descendant = this.proxyFor({});
        
        this.commitVersion();
        
        descendant.__proto__ = originalPrototype;
        
        this.commitVersion();
        
        descendant.__proto__ = otherPrototype;
        
        this.undo();
        
        this.assertEquals(Object.getPrototypeOf(descendant), originalPrototype);
        this.assertEquals(descendant.method(), 1);
        
        this.undo();
        
        this.assertEquals(Object.getPrototypeOf(descendant), Object.prototype);
        this.assert(!descendant.method);
    },
});

lively.versions.tests.TestCase.subclass(
'lively.versions.tests.ObjectVersioningTests.SourceTransformationTests',
'testing',{
    test01ObjectLiterals: function() {
        var input = 'var obj = {};',
            expectedOutput = 'var obj = lively.versions.ObjectVersioning.proxyFor({});';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test02ArrayLiterals: function() {
       var input = 'var arr = [];',
            expectedOutput = 'var arr = lively.versions.ObjectVersioning.proxyFor([]);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test03FunctionExpression: function() {
        var input =
            'var funcVariable = function() {\n' +
            '   return 12;\n' +
            '};';
        var expectedOutput =
            'var funcVariable = lively.versions.ObjectVersioning.proxyFor(function() {\n' +
            '    return 12;\n' +
            '});';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test04NamedFunctionExpression: function() {
        var input =
            'var funcVariable = function funcName() {\n' +
            '   return 12;\n' +
            '};';
        var expectedOutput =
            'var funcVariable = lively.versions.ObjectVersioning.proxyFor(function funcName() {\n' +
            '    return 12;\n' +
            '});';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test05FunctionDeclaration: function() {
        // here, the input is a function declaration, which would make the function's
        // accessible in the declaration's parent's scope by its name, so we need to
        // make the function explicitly accessible using a variable when we wrap the
        // function declaration into our proxy function, because passing the declaration
        // as argument to another function makes the function literal a function
        // expression
                
        var input =
            'function funcName() {\n' +
            '   return 12;\n' +
            '};';
        var expectedOutput =
            'var funcName = lively.versions.ObjectVersioning.proxyFor(function funcName() {\n' +
            '    return 12;\n' +
            '});\n\n';
        
        this.assertEquals(this.transform(input), expectedOutput);
   },
   test06IndicatesFailureOnSyntaxError: function() {
       var incorrectInput = '{ problem: "object misses a comma" before: "second property"';
       
       this.assertRaises((function() {
           this.transform(incorrectInput);
        }).bind(this));
   },
   test07BiggerExample: function() {
        var input = 
            "var joe = {\n" +
            "    name: 'Joe',\n" +
            "    age: 25,\n" +
            "    address: {\n" +
            "        street: 'Mainstr. 20',\n" +
            "        zipCode: '12125'\n" +
            "    },\n" +
            "    friends: [],\n" +
            "    becomeFriendsWith: function(otherPerson) {\n" +
            "        this.friends.push(otherPerson.name);\n" +
            "    },\n" +
            "    isFriendOf: function(otherPerson) {\n" +
            "        return this.friends.include(otherPerson.name);\n" +
            "    }\n" +
            "}";
    var expectedOutput = 
        'var joe = lively.versions.ObjectVersioning.proxyFor({\n' +
        '    name: "Joe",\n' +
        '    age: 25,\n' +
        '    address: lively.versions.ObjectVersioning.proxyFor({\n' +
        '        street: "Mainstr. 20",\n' +
        '        zipCode: "12125"\n' +
        '    }),\n' +
        '    friends: lively.versions.ObjectVersioning.proxyFor([]),\n' +
        '    becomeFriendsWith: lively.versions.ObjectVersioning.proxyFor(function(otherPerson) {\n' +
        '        this.friends.push(otherPerson.name);\n' +
        '    }),\n' +
        '    isFriendOf: lively.versions.ObjectVersioning.proxyFor(function(otherPerson) {\n' +
        '        return this.friends.include(otherPerson.name);\n' +
        '    })\n' +
        '});';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test08GenerateSourceWithMapping: function() {
        var input = 'var obj = {};',
            expectedOutput = 'var obj=lively.versions.ObjectVersioning.proxyFor({});\n' +
                '//@ sourceMappingURL=data:application/json;charset=utf-8;base64,' +
                'eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbImV2YWwgYXQgcnVud' +
                'GltZSJdLCJuYW1lcyI6WyJvYmoiXSwibWFwcGluZ3MiOiJBQUFBLEdBQUlBIiwic2' +
                '91cmNlc0NvbnRlbnQiOlsidmFyIG9iaiA9IHt9OyJdfQ==',
            output = lively.versions.SourceTransformations.generateCodeFromSource(input);
        
        this.assertEquals(output, expectedOutput);
    }
});

});
