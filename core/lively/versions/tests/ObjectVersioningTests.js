module('lively.versions.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.versions.ObjectVersioning').toRun(function() {

TestCase.subclass('lively.versions.tests.ObjectVersioningTests.ProxyObjectTests',
// these test cases verify that the versioning proxies behave just like
// ordinary objects
'testing', {
    test01ProxyCreation: function() {
        var proxy = lively.proxyFor({});
        
        this.assert(proxy.isProxy());
    },
    test02ProxyResolvesToObjectViaObjectTable: function() {
        var object = {},
            proxy = lively.proxyFor(object);
        
        this.assertEquals(proxy.proxyTarget(), object);
    },
    test03ProxyRetrievesPrimitiveProperty: function() {
        var obj = {},
            proxy = lively.proxyFor(obj);
            
        obj.age = 24;
        
        this.assertEquals(proxy.age, 24);
    },
    test04ProxyCanWritePrimitiveProperty: function() {
        var obj = {},
            proxy = lively.proxyFor(obj);
            
        proxy.age = 24;
        
        this.assertEquals(obj.age, 24);
    },
    test05ProxyRetrievesNonPrimitiveProperty: function() {
        var personProxy = lively.proxyFor({age : 24}),
            address = {
                street: 'Friedrichstraße', 
                number: '112b'
            },
            addressProxy = lively.proxyFor(address);
            
        personProxy.address = addressProxy;
        
        this.assert(personProxy.address.isProxy());
        this.assertEquals(personProxy.address.proxyTarget(), address);
    },
    test06ProxiesGetPassedByReference: function() {
        var person = lively.proxyFor({}),
            roomMate = lively.proxyFor({});
        
        person.address = lively.proxyFor({
                street: 'Wrangelstraße', 
                number: '24'
            });
        
        roomMate.address = person.address;
        
        this.assertIdentity(person.address, roomMate.address);
    },
    test07ArraysCanBeProxied: function() {
        var arr = lively.proxyFor([]);
        
        arr[0] = lively.proxyFor({});
        
        this.assert(arr.isProxy());
        this.assert(arr[0].isProxy());
    },
    test08ProxiesReturnUndefinedForNotDefinedProperties: function() {
        var place = lively.proxyFor({});
        
        this.assert(place.coordinates === undefined);
    },
    test09RegularExpressionsCanBeProxied: function() {
        var regExp = lively.proxyFor(/\/\.\//);
        
        this.assert(regExp.isProxy());
        this.assert(Object.isRegExp(regExp));
    },
    test10FunctionsCanBeProxied: function() {
        var func = lively.proxyFor(function() {});
        
        this.assert(func.isProxy());
    },
    test11ProxiedFunctionsHaveCorrectName: function() {
        var func = lively.proxyFor(function funcName() {});
        
        this.assertEquals(func.name, 'funcName');
    },
    test12ProxiedMethodCanBeApplied: function() {
        var obj = lively.proxyFor({prop: 24});

        obj.method = lively.proxyFor(function(a) {
            return this.prop;
        });
        
        this.assert(obj.method(), 24);
    },
    test13ProxiedAnonymousFunctionCanBeApplied: function() {
        var func = lively.proxyFor(function() {return 123});
        
        this.assertEquals(func(), 123);
    },
    test14ProxiesAlwaysReturnProxies: function() {
        var obj = {
                prop: {}, 
                method: function() {return {}}
            },
            proxy = lively.proxyFor(obj);
            
        this.assert(proxy.prop.isProxy());
        this.assert(proxy.method.isProxy())
    },
    test15ProxiedConstructorReturnsProxiedInstance: function() {
        var ProxiedConstructor = lively.proxyFor(function (name, age) {
                this.name = name;
                this.age = age;
                this.isPerson = true;
            }),
            aPerson = new ProxiedConstructor('Joe', '19');
        
        this.assert(aPerson.isProxy());
        this.assert(aPerson.isPerson);
        this.assertEquals(aPerson.name, 'Joe');
        this.assertEquals(aPerson.age, 19);
    },
    test16ConstructorReturnsReturnValue: function() {
        var anObject = lively.proxyFor({}),
            aClass = lively.proxyFor(function() { return anObject });
        
        this.assertEquals(new aClass(), anObject);
    },
    test17PrototypeCanBeAProxy: function() {
        var proto = lively.proxyFor({}),
            descendant = lively.createObject(proto);
        
        this.assertEquals(Object.getPrototypeOf(descendant), proto);
        this.assertEquals(descendant.__proto__, proto);
        this.assert(Object.getPrototypeOf(descendant).isProxy());
    },
    test18PrototypeOfProxyCanBeChanged: function() {
        var originalPrototype = lively.proxyFor({v: 1}),
            otherPrototype = lively.proxyFor({v: 2}),
            descendant = lively.createObject(originalPrototype);
        
        descendant.__proto__ = otherPrototype;
        
        this.assertEquals(Object.getPrototypeOf(descendant), otherPrototype);
        this.assertEquals(descendant.__proto__, otherPrototype);
        this.assertEquals(descendant.v, 2);
    },
    test19ProtoLookupWorksOnProxies: function() {
        var proto = lively.proxyFor({}),
            descendant = lively.createObject(proto);
        proto.prop = 15;
                
        this.assertEquals(descendant.prop, 15);
    },
    test20MethodFromPrototypeIsAppliedCorrectly: function() {
        var proto = lively.proxyFor({}),
            descendant = lively.createObject(proto);
        
        proto.prop = 1;
        proto.method = lively.proxyFor(function(a) {
            return this.prop;
        });
        this.assert(descendant.method(), 1);
        
        descendant.prop = 2;
        this.assert(descendant.method(), 2);
    },
    test21ObjCanOverwriteInheritedProperty: function() {
        var obj = lively.proxyFor({a: 2}),
            subObj = lively.createObject(obj);
        
        subObj.a = 5;
        
        this.assertEquals(obj.a, 2);
        this.assertEquals(subObj.a, 5);
    },
    test22MethodCanBeAddedToPrototypeOfConstructor: function() {
        var instance,
            NewType = lively.proxyFor(function() {
                this.prop = 12;
            });
        
        NewType.prototype.getProp = lively.proxyFor(function() {
            return this.prop;
        });
        
        instance = new NewType();
        
        this.assertEquals(instance.constructor, NewType);
        this.assertEquals(instance.__proto__, NewType.prototype);
        this.assertEquals(instance.prop, 12);
        this.assert(instance.getProp.isProxy());
        this.assertEquals(instance.getProp(), 12);
    },
    test23ConstructorWithProxiedPrototypeProperty: function() {
        var prototype = lively.proxyFor({protoProp: 'p'}),
            Constructor = lively.proxyFor(function C(parameter){
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
    test24ProxyHasCorrectProperties: function() {
        var proto = lively.proxyFor({protoProp: 1}),
            descendant = lively.createObject(proto);
        descendant.ownProp = 2;
        
        this.assert('protoProp' in descendant);
        this.assert('ownProp' in descendant);
        this.assert(!('neverDefinedProperty' in descendant));
    },
    test25ProxyHasCorrectOwnProperties: function() {
        var proto = lively.proxyFor({}),
            descendant = lively.createObject(proto);
        
        this.assert(descendant.__proto__ === proto);
        this.assert(descendant.__proto__.__proto__ === Object.prototype);
        
        proto.protoProp = 12;
        descendant.ownProp = 24;
        
        this.assert(descendant.hasOwnProperty('ownProp'));
        this.assert(!descendant.hasOwnProperty('protoProp'));
    },
    test26GetOwnPropertyNames: function() {
        var person = lively.proxyFor({}),
            student = lively.createObject(person),
            ownProps;
            
        person.age = 21;
        student.avgGrade = 2;
        student.semester = 3;
        
        ownProps = Object.getOwnPropertyNames(student);
        this.assertEquals(['avgGrade', 'semester'].intersect(ownProps).length, 2);
    },
    test27PropertyEnumerationWorks: function() {
        var proto = {a:1, b:2, c:3},
            obj = lively.createObject(proto),
            enumeratedProps = [];
        
        obj.d = 4;
        obj.e = 5;
        obj.f = 6;
        
        for (var prop in obj) {
            enumeratedProps.push(prop);
        }

        this.assert(['a','b','c','d', 'e', 'f'].intersect(enumeratedProps).length === 6);
    },
    test28CorrectObjectKeys: function() {
        var proto = {a:1, b:2, c:3},
            obj = lively.createObject(proto);
        
        obj.d = 4;
        obj.e = 5;
        obj.f = 6;
        
        this.assert(['d', 'e', 'f'].intersect(Object.keys(obj)).length === 3);
    },
    test29ProxiedObjectsCanBeFrozen: function() {
        var obj = {},
            proxy = lively.proxyFor(obj);
            
        this.assertEquals(Object.isFrozen(proxy), false);
                
        Object.freeze(proxy);
        
        this.assert(Object.isFrozen(proxy));
        this.assert(Object.isFrozen(obj));
    },
    test30ProxiedObjectsCanBeSealed: function() {
        var obj = {},
            proxy = lively.proxyFor(obj);
            
        this.assertEquals(Object.isSealed(proxy), false);
            
        Object.seal(proxy);
        
        this.assert(Object.isSealed(proxy));
        this.assert(Object.isSealed(obj));
    },
    test31ExtensionsToProxiedObjectsCanBePrevented: function() {
        var obj = {},
            proxy = lively.proxyFor(obj);
            
        this.assert(Object.isExtensible(proxy));
            
        Object.preventExtensions(proxy);
        
        this.assertEquals(Object.isExtensible(proxy), false);
        this.assertEquals(Object.isExtensible(obj), false);
    }
});

TestCase.subclass('lively.versions.tests.ObjectVersioningTests.ProxiesMeetNativeCodeTests',
'testing', {
    test01FunctionIsPrintedWithFunctionParamtersAndBody: function() {
        // which is helpful during debugging and necessary for
        // how lively's $super-calls work
        var func = lively.proxyFor(function addition($super, a, b) {
                return $super(a, b);
            }),
            expectedOutput = 'function addition($super, a, b) {\n' +
            '                return $super(a, b);\n' +
            '            }';
        
        this.assertEquals(func.toString(), expectedOutput);
    },
    test02DefineSetter__deprecatedVariant: function() {
        var obj = lively.proxyFor({});
        
        obj.__defineSetter__('aProp', lively.proxyFor(function(val) {
           this.anotherProp = val * 2;
        }));
        obj.aProp = 5;
        
        this.assertEquals(obj.anotherProp, 10);
        this.assert(Object.isFunction(obj.__lookupSetter__('aProp')));
    },
    test03DeleteDefinedSetter__deprecatedVariant: function() {
        var obj = lively.proxyFor({});
        
        obj.__defineSetter__('aProp', lively.proxyFor(function(val) {
           this.anotherProp = val * 2;
        }));
        delete obj['aProp'];
        
        this.assertEquals(obj.__lookupSetter__('aProp'));
    },
    test04DefineGetter__deprecatedVariant: function() {
        var obj = lively.proxyFor({anotherProp: 5});
        
        obj.__defineGetter__('aProp', lively.proxyFor(function(val) {
           return this.anotherProp;
        }));
        
        this.assertEquals(obj.aProp, 5);
        this.assert(Object.isFunction(obj.__lookupGetter__('aProp')));
    },
    test05DefineGetterViaDefineProperty: function() {
        var obj = lively.proxyFor({age: 1});
        
        Object.defineProperty(obj, 'age', lively.proxyFor({
            get: lively.proxyFor(function() {return 2})
        }));
        
        this.assertEquals(obj.age, 2);
    },
    test06DeleteProperty: function() {
        var obj = lively.proxyFor({age: 1});
        
        delete obj.age;
        
        this.assertEquals(obj.age, undefined);
    },
    test07StringReplaceWorksWithProxiedRegExp: function() {
        var string = "ace/./editor",
            result = string.
                replace(lively.proxyFor(/\/\.\//), "/").
                replace(lively.proxyFor(/[^\/]+\/\.\.\//), "");
        
        this.assertEquals(result, "ace/editor");
    },
    test08ArrayIndexOfWorksOnProxies: function() {
        var element1 = lively.proxyFor({}),
            element2 = lively.proxyFor({}),
            array = lively.proxyFor([element1, element2]);
        
        this.assert(array.indexOf(element2) === 1);
    }
});

TestCase.subclass('lively.versions.tests.ObjectVersioningTests.VersionsTests',
'helpers', {
    assertInVersion: function(func, version) {
        var previousVersion = lively.CurrentVersion;
        
        lively.CurrentVersion = version;
        
        this.assert(func.apply());
        
        lively.CurrentVersion = previousVersion;
    },
},
'testing', {
    test01VersionsOfObject: function() {
        var person, versionBefore;
        
        person = lively.proxyFor({});
        person.age = 23;
        
        versionBefore = lively.commitVersion();
        
        person.age = 24;
        person.age = 25;
        
        // in the previous version:
        this.assertInVersion(function() {return person.age === 23}, versionBefore);
        // currently:
        this.assertInVersion(function() {return person.age === 25}, lively.CurrentVersion);
    },
    test02aVersionsOfAnArray_DirectAccess: function() {
        var arr, versionBefore;
        
        arr = lively.proxyFor([]);
        
        arr[0] = 1;
        
        versionBefore = lively.commitVersion();
        
        arr[0] = 2;
        arr[1] = 2;
                
        // in the previous version:
        this.assertInVersion(function() {return arr[0] === 1}, versionBefore);
        this.assertInVersion(function() {return arr[1] === undefined}, versionBefore);
        // currently:
        this.assertInVersion(function() {return arr[0] === 2}, lively.CurrentVersion);
        this.assertInVersion(function() {return arr[1] === 2}, lively.CurrentVersion);
    },
    test02bVersionsOfAnArray_ModifyingMethod: function() {
        var arr, versionBefore;
        
        arr = lively.proxyFor([]);
        
        arr[0] = 1;
        
        versionBefore = lively.commitVersion();
        
        arr.push(2);
        
        lively.versions.ObjectVersioning.undo();
        
        this.assertEquals(arr.length, 1);
        this.assert(arr[1] === undefined);
    },
    test03aChangesCanBeUndone: function() {
        var app = lively.proxyFor({});
        app.counter = 1;
        
        lively.commitVersion();
        
        app.counter = 2;
        
        lively.versions.ObjectVersioning.undo();
        
        this.assertEquals(app.counter, 1);
    },
    test03bChangesCanBeUndone: function() {
        var app = lively.proxyFor({});
        app.view = lively.proxyFor({});
        app.view.color = 'red';
        
        lively.commitVersion();
        
        app.view.color = 'green';
        
        lively.versions.ObjectVersioning.undo();
        
        this.assertEquals(app.view.color, 'red');
    },
    test03cChangesCanBeUndone: function() {
        var obj = lively.proxyFor({});
        
        lively.commitVersion();
        
        obj.isPropertyDefined = true;
        
        lively.versions.ObjectVersioning.undo();
        
        this.assert(obj.isPropertyDefined === undefined);
    },
    test04aUndoneChangesCanBeRedone: function() {
        var address = lively.proxyFor({});
        address.street = 'Meanstreet';
        address.city = 'Chicago';
        
        lively.commitVersion();
        
        lively.versions.ObjectVersioning.undo();
        lively.versions.ObjectVersioning.redo();
        
        this.assertEquals(address.city, 'Chicago');
    },
    test04bUndoneChangesCanBeRedone: function() {
        var address = lively.proxyFor({});
        lively.commitVersion();
        address.street = 'Meanstreet';
        lively.commitVersion();
        address.city = 'Chicago';
        
        lively.versions.ObjectVersioning.undo();
        lively.versions.ObjectVersioning.undo();
        lively.versions.ObjectVersioning.redo();
        
        this.assertEquals(address.street, 'Meanstreet');
        this.assert(address.city === undefined);
    },
    test05PrototypeChangeCanBeUndone: function() {
        var originalPrototype = lively.proxyFor({
                method: lively.proxyFor(function() {return 1}),
            }),
            otherPrototype = lively.proxyFor({
                method: lively.proxyFor(function() {return 2}),
            }),
            descendant = lively.proxyFor({});
        
        lively.commitVersion();
        
        descendant.__proto__ = originalPrototype;
        
        lively.commitVersion();
        
        descendant.__proto__ = otherPrototype;
        
        lively.versions.ObjectVersioning.undo();
        
        this.assertEquals(Object.getPrototypeOf(descendant), originalPrototype);
        this.assertEquals(descendant.method(), 1);
        
        lively.versions.ObjectVersioning.undo();
        
        this.assertEquals(Object.getPrototypeOf(descendant), Object.prototype);
        this.assert(!descendant.method);
    },
});
TestCase.subclass(
'lively.versions.tests.ObjectVersioningTests.ObjectAccessTransformationTests',
'helpers', {
    transform: function(source) {
        return lively.versions.SourceTransformations.transformObjectAccess(source);
    },
},
'testing', {
    test01Get: function() {
        var input = 'var obj = {}; obj.foo;',
            expectedOutput = 
            'var obj = {};\n' +
            '\n' + 
            'obj.__OV__get(\"foo\");';
        
        this.assertEquals(this.transform(input), expectedOutput);
        },
    test02ObjectFunctionApply: function() {
        var input = 'var obj = {}; obj.foo();',
            expectedOutput = 
            'var obj = {};\n' +
            '\n' + 
            'obj.__OV__getAndApply(\"foo\");';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test03ObjectFunctionApplyWithArgs: function() {
        var input = 'var obj = {}; obj.foo(5, \"bar\");', 
            expectedOutput = 
            'var obj = {};\n' +
            '\n' + 
            'obj.__OV__getAndApply(\"foo\", 5, \"bar\");';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test04FunctionApply: function() {
        var input = 'var func = function() {}; func();',
            expectedOutput = 
            'var func = function() {};\n' +
            '\n' + 
            'func.__OV__apply();';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test05FunctionApplyWithArgs: function() {
        var input = 'var func = function() {}; func(5, \"bar\");',
            expectedOutput = 
            'var func = function() {};\n' +
            '\n' + 
            'func.__OV__apply(5, \"bar\");';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },




}); 

TestCase.subclass('lively.versions.tests.ObjectVersioningTests.ExtensionTests',
'testing', {
    test01ObjectInstanceOf_NullValues: function() {
        this.assert(!Object.instanceOf(undefined, Object));
        this.assert(!Object.instanceOf(null, Object));
    },
    test02ObjectInstanceOf_PrimitiveValues: function() {
        this.assert(!Object.instanceOf(15, Object));
        this.assert(!Object.instanceOf('what type?', Object));
    },
    test03ObjectInstanceOf_TwoObjects: function() {
        var Type = function () {},
            instance = new Type();
        
        this.assert(Object.instanceOf(instance, Type));
    },
    test04ObjectInstanceOf_TwoProxies: function() {
        var Type = lively.proxyFor(function () {}),
            instance = new Type();
        
        this.assert(Object.instanceOf(instance, Type));
    },
    test05ObjectInstanceOf_OnlyInstanceProxied: function() {
        var Type = function () {},
            instance = lively.proxyFor(new Type());
        
        this.assert(Object.instanceOf(instance, Type));
    },
    test06ObjectInstanceOf_OnlyTypePrototypeProxied: function() {
        var Type = function () {},
            proto = {},
            instance;
        
        Type.prototype = proto;
        instance = new Type()
        
        Type.prototype = lively.proxyFor(proto);
        
        this.assert(Object.instanceOf(instance, Type));
    },
});

TestCase.subclass(
'lively.versions.tests.ObjectVersioningTests.SourceTransformationTests',
'helpers', {
    transform: function(source) {
        return lively.versions.SourceTransformations.transformObjectCreation(source);
    },
},
'testing', {
    test01ObjectLiterals: function() {
        var input = 'var obj = {};',
            expectedOutput = 'var obj = lively.proxyFor({});';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test02ArrayLiterals: function() {
       var input = 'var arr = [];',
            expectedOutput = 'var arr = lively.proxyFor([]);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test03ArrayLiterals: function() {
       var input = 'var regExp = /(?:)/;',
            expectedOutput = 'var regExp = lively.proxyFor(/(?:)/);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test04FunctionExpression: function() {
        var input =
            'var funcVariable = function() {\n' +
            '   return 12;\n' +
            '};';
        var expectedOutput =
            'var funcVariable = lively.proxyFor(function() {\n' +
            '    return 12;\n' +
            '});';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test05NamedFunctionExpression: function() {
        var input =
            'var funcVariable = function funcName() {\n' +
            '   return 12;\n' +
            '};';
        var expectedOutput =
            'var funcVariable = lively.proxyFor(function funcName() {\n' +
            '    return 12;\n' +
            '});';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test06FunctionDeclaration: function() {
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
            'var funcName = lively.proxyFor(function funcName() {\n' +
            '    return 12;\n' +
            '});\n\n';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test07FunctionDeclarationHoisting: function() {
        var input =
            'funcName();\n' +
            'function funcName() {\n' +
            '   return 12;\n' +
            '};';
        var expectedOutput =
            'var funcName = lively.proxyFor(function funcName() {\n' +
            '    return 12;\n' +
            '});\n' +
            '\n' +
            'funcName();\n\n';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test08FunctionDeclarationHoistingInAFunction: function() {
        var input =
            '(function() {\n' +
            '    funcName();\n' +
            '\n' +
            '    function funcName() {\n' +
            '        return 12;\n' +
            '    }\n' +
            '})();';
        var expectedOutput =
            'lively.proxyFor(function() {\n' +
            '    var funcName = lively.proxyFor(function funcName() {\n' +
            '        return 12;\n' +
            '    });\n' +
            '    funcName();\n' +
            '})();';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test09TransformsDefinePropertyCorrectly: function() {
        var input =
            'Object.defineProperty(obj, \"age\", {\n' +
            '    get: function() {\n' +
            '        return 2;\n' +
            '    }\n' +
            '});';
        var expectedOutput =
            'lively.proxyFor(Object).defineProperty(obj, \"age\", lively.proxyFor({\n' +
            '    get: lively.proxyFor(function get() {\n' +
            '        return 2;\n' +
            '    })\n' +
            '}));';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test10TransformsAccessorInObjectLiteralToDefinePropertyCall: function() {
        var input =
        'obj = {\n' +
        '    age: 2,\n' +
        '    set value(string) {\n' +
        '        this._value = string;\n' +
        '    },\n' +
        '    get value() {\n' +
        '        return this._value;\n' +
        '    }\n' +
        '}'
        
        var expectedOutput =
        'obj = function() {\n' +
        '    var newObject = lively.proxyFor({\n' +
        '        age: 2\n' +
        '    });\n' +
        '    Object.defineProperty(newObject, "value", {\n' +
        '        get: lively.proxyFor(function value() {\n' +
        '            return this._value;\n' +
        '        }),\n' +
        '        set: lively.proxyFor(function value(string) {\n' +
        '            this._value = string;\n' +
        '        }),\n' +
        '        enumerable: true,\n' +
        '        configurable: true\n' +
        '    });\n' +
        '    return newObject;\n' +
        '}();'
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test11TransformInstanceofOperator: function() {
        var input = 'obj instanceof Type;',
            expectedOutput = 'Object.instanceOf(obj, Type);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test12TransformObject: function() {
        var input = 'xy === Object;',
            expectedOutput = 'xy === lively.proxyFor(Object);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test13TransformObjectCreate: function() {
        var input = 'var o = Object.create(null);',
            expectedOutput = 'var o = lively.proxyFor(Object).create(null);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test14TransformEval: function() {
        var input = 'eval(\"some string argument\");',
            expectedOutput = 'eval(lively.transformSource(\"some string argument\"));';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test15TransformGlobalEval: function() {
        var input = 'Global.eval(\"some string argument\");',
            expectedOutput = 'lively.proxyFor(Global).eval(lively.transformSource(\"some string argument\"));';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test16TransformWindowEval: function() {
        var input = 'window.eval(\"some string argument\");',
            expectedOutput = 'lively.proxyFor(window).eval(lively.transformSource(\"some string argument\"));';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test17TransformSetTimeout: function() {
        var input = 'setTimeout(\"alert(1)\", 10);',
            expectedOutput = 'lively.setTimeout(\"alert(1)\", 10);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test18TransformWindowSetTimeout: function() {
        var input = 'window.setTimeout(\"alert(1)\", 10);',
            expectedOutput = 'lively.setTimeout(\"alert(1)\", 10);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test19TransformGlobalSetTimeout: function() {
        var input = 'Global.setTimeout(\"alert(1)\", 10);',
            expectedOutput = 'lively.setTimeout(\"alert(1)\", 10);';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
    test20IndicatesFailureOnSyntaxError: function() {
        var incorrectInput = '{ problem: "object misses a comma" before: "second property"';
       
        this.assertRaises((function() {
            this.transform(incorrectInput);
        }).bind(this));
    },
    test21GenerateSourceWithMapping: function() {
        var input = 'var obj = {};',
            expectedOutput = 'var obj=lively.proxyFor({});\n' +
                '//@ sourceMappingURL=data:application/json;charset=utf-8;base64,' +
                'eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbImV2YWwgYXQgcnVud' +
                'GltZSJdLCJuYW1lcyI6WyJvYmoiXSwibWFwcGluZ3MiOiJBQUFBLEdBQUlBIiwic2' +
                '91cmNlc0NvbnRlbnQiOlsidmFyIG9iaiA9IHt9OyJdfQ==',
            output = lively.versions.SourceTransformations.generateCodeFromSource(input);
        
        this.assertEquals(output, expectedOutput);
    },
    test22BiggerExample: function() {
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
        'var joe = lively.proxyFor({\n' +
        '    name: "Joe",\n' +
        '    age: 25,\n' +
        '    address: lively.proxyFor({\n' +
        '        street: "Mainstr. 20",\n' +
        '        zipCode: "12125"\n' +
        '    }),\n' +
        '    friends: lively.proxyFor([]),\n' +
        '    becomeFriendsWith: lively.proxyFor(function becomeFriendsWith(otherPerson) {\n' +
        '        this.friends.push(otherPerson.name);\n' +
        '    }),\n' +
        '    isFriendOf: lively.proxyFor(function isFriendOf(otherPerson) {\n' +
        '        return this.friends.include(otherPerson.name);\n' +
        '    })\n' +
        '});';
        
        this.assertEquals(this.transform(input), expectedOutput);
    },
});

});
