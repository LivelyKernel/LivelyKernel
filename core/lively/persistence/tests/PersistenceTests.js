module('lively.persistence.tests.PersistenceTests').requires('lively.persistence.Serializer', 'lively.TestFramework').toRun(function() {

Object.subclass('lively.persistence.tests.PersistenceTests.SmartRefTestDummy', // for testing
'default category', {
    someProperty: 23,
    m1: function() { return 99 },
    toString: function() { return 'a ' + this.constructor.name }
});

TestCase.subclass('lively.persistence.tests.PersistenceTests.ObjectGraphLinearizerTest',
'running', {
    setUp: function($super) {
        $super();
        this.sut = new lively.persistence.ObjectGraphLinearizer();
    }
},
'testing', {
    test01RegisterObject: function() {
        var obj = {foo: 23};
        var ref = this.sut.register(obj);
        this.assertEquals(23, this.sut.getRegisteredObjectFromId(ref.id).foo);
        this.sut.cleanup(this.sut.registry)
        this.assert(!this.sut.getIdFromObject(obj), 'id property not removed from original objects');
    },
    test02RegisterObjectsWithReferences: function() {
        var obj1 = {foo: 23}, obj2 = {other: obj1, bar: null};
        this.sut.register(obj2);
        var id1 = this.sut.getIdFromObject(obj1), id2 = this.sut.getIdFromObject(obj2);
        var regObj1 = this.sut.getRegisteredObjectFromId(id1), regObj2 = this.sut.getRegisteredObjectFromId(id2);
        this.assertEquals(23, regObj1.foo);
        this.assertIdentity(null, regObj2.bar);
        this.assert(regObj2.other !== obj1, 'registered object points to real object!')
        this.assert(regObj2.other, 'no reference object created')
        this.assert(regObj2.other.id, 'reference object has no id')
        this.assertEquals(id1, regObj2.other.id)
    },
    test03RegisterObjectsWithArrayReferences: function() {
        var obj1 = {a: true}, obj2 = {b: true}, obj3 = {others: [obj1, [obj2], 99]};
        this.sut.register(obj3);
        var id1 = this.sut.getIdFromObject(obj1),
            id2 = this.sut.getIdFromObject(obj2),
            id3 = this.sut.getIdFromObject(obj3),
            regObj1 = this.sut.getRegisteredObjectFromId(id1),
            regObj2 = this.sut.getRegisteredObjectFromId(id2),
            regObj3 = this.sut.getRegisteredObjectFromId(id3);
        this.assert(Object.isArray(regObj3.others), 'array gone away')
        this.assert(3, regObj3.others.length, 'array strange')
        this.assertEquals(id1, regObj3.others[0].id, 'plain ref in array')
        this.assertEquals(id2, regObj3.others[1][0].id, 'nested ref in array')
        this.assertEquals(99, regObj3.others[2])
    },
    test04RegisterArray: function() {
        var obj1 = {}, obj2 = {}, arr = [obj1, obj2];
        var registeredArr = this.sut.register(arr);
        var id1 = this.sut.getIdFromObject(obj1),
            id2 = this.sut.getIdFromObject(obj2);
        this.assertEquals(id1, registeredArr[0].id, 'obj1')
        this.assertEquals(id2, registeredArr[1].id, 'obj2')
    },
    test05RegisterNumber: function() {
        this.assertEquals(3, this.sut.register(3));
    },
    test06RecreateObjectTree: function() {
        var obj1 = {foo: 23}, obj2 = {other: obj1, bar: 42};
        var id = this.sut.register(obj2).id;
        var result = this.sut.recreateFromId(id)
        this.assertEquals(42, result.bar);
        this.assertEquals(23, result.other.foo);
    },
    test07RecreateObjectTreeWithArray: function() {
        var obj1 = {foo: 23}, obj2 = {bar: 42}, obj3 = {others: [obj1, [obj2], obj1]};
        var id = this.sut.register(obj3).id;
        var result = this.sut.recreateFromId(id)
        this.assertEquals(23, result.others[0].foo, 'not resolved item 0');
        this.assertEquals(42, result.others[1][0].bar, 'not resolved item 1');
        this.assertEquals(23, result.others[2].foo, 'not resolved item 2');
        this.assertIdentity(result.others[0], result.others[2], 'not resolved identity');
    },
    test08RecreateBidirectionalRef: function() {
        var obj1 = {}, obj2 = {};
        obj1.friend = obj2;
        obj2.friend = obj1;
        var id = this.sut.register(obj1).id;
        var result = this.sut.recreateFromId(id)
        var recreated1 = result, recreated2 = result.friend;
        this.assertIdentity(recreated1, recreated2.friend);
        this.assertIdentity(recreated2, recreated1.friend);
    },
    test09SerializeAndDeserialize: function() {
        var obj1 = { value: 1 },
            obj2 = { value: 2, friend: obj1 },
            obj3 = { value: 3, friends: [obj1, obj2]};
        obj1.friend = obj3;

        var json = this.sut.serialize(obj3)
        var result = this.sut.deserialize(json)

        this.assertEquals(3, result.value);
        this.assertEquals(2, result.friends.length);
        this.assertEquals(1, result.friends[0].value);
        this.assertIdentity(result.friends[0], result.friends[1].friend);
        this.assertIdentity(result, result.friends[0].friend);
    },
    testCDATAEndTagIsNotExcaped: function() {
        // we don't need this anymore sice we moved away from XML storage
        var str = 'Some funny string with CDATA end tag: ]]> and again ]]>',
            obj = { value: str };
        var json = this.sut.serialize(obj);
        // this.assert(!json.include(']]>'), 'CDATA end tag included')
        this.assert(json.include(']]>'), 'CDATA end tag not included');
        var result = this.sut.deserialize(json);
        this.assertEquals(str, result.value);
    },
    test10IdIsStored: function() {
        this.sut.keepIds = true;
        var obj = {foo: 23},
            id = this.sut.register(obj).id,
            registeredCopy = this.sut.getRegisteredObjectFromId(id);
        this.assert(registeredCopy[this.sut.idProperty] !== undefined, 'copy has no id');
    },
    test11IdIsNotAlwaysDeleted: function() {
        this.sut.keepIds = true;
        var obj = {foo: 23},
            id = this.sut.register(obj).id,
            recreated = this.sut.recreateFromId(id);
        this.sut.cleanup(); // evil!!!!
        this.assertEquals(id, obj[this.sut.idProperty], 'orig');
        this.assertEquals(id, recreated[this.sut.idProperty], 'recreated');
    },
    test12GraceFulErrorInSerialization: function() {
        var obj = {
            get prop1() { throw new Error },
            prop2: 23
        }, serialized = this.sut.serializeToJso(obj);
        this.assertEquals(23, serialized.registry[0].prop2);
        this.assert(!serialized.registry[0].hasOwnProperty("prop1"), 'prop1 should be ignored and excluded');
    }
})


TestCase.subclass('lively.persistence.tests.PersistenceTests.ObjectGraphLinearizerPluginTest',
'running', {
    setUp: function($super) {
        $super();
        this.serializer = new lively.persistence.ObjectGraphLinearizer();
    },
    createAndAddDummyPlugin: function() {
        var plugin = new ObjectLinearizerPlugin();
        this.serializer.addPlugin(plugin);
        return plugin;
    },
    serializeAndDeserialize: function(obj) {
        return this.serializer.deserialize(this.serializer.serialize(obj))
    }
},
'testing', {
    test01RecreationPlugin: function() {
        var sut = this.createAndAddDummyPlugin(), obj = {foo: 23};
        sut.deserializeObj = function(registeredObj) { return {bar: registeredObj.foo * 2} };
        var result = this.serializeAndDeserialize(obj);
        this.assertEquals(23, result.foo);
        this.assertEquals(23*2, result.bar);
    },
    test02SerializeLivelyClassInstance: function() {
        var instance1 = new lively.persistence.tests.PersistenceTests.SmartRefTestDummy(),
            instance2 = new lively.persistence.tests.PersistenceTests.SmartRefTestDummy();
        instance1.friend = instance2;
        instance2.specialProperty = 'some string';

        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var result = this.serializeAndDeserialize(instance1)

        this.assertEquals(instance2.specialProperty, result.friend.specialProperty);

        this.assert(result.m1, 'deserialized does not have method');
        this.assertEquals(99, result.m1(), 'wrong method invocation result');
        lively.persistence.tests.PersistenceTests.SmartRefTestDummy.
            prototype.someProperty = -1; // change after serialization
        this.assertEquals(lively.persistence.tests.PersistenceTests.
            SmartRefTestDummy.prototype.someProperty, result.someProperty, 'proto prop');

        this.assertIdentity(lively.persistence.tests.PersistenceTests.SmartRefTestDummy,
            result.constructor, 'constructor 1');
        this.assertIdentity(lively.persistence.tests.PersistenceTests.SmartRefTestDummy,
            result.friend.constructor, 'constructor 2');
        this.assert(result instanceof lively.persistence.tests.PersistenceTests.SmartRefTestDummy,
            'instanceof 1');
        this.assert(result.friend instanceof lively.persistence.tests.PersistenceTests.SmartRefTestDummy,
            'instanceof 2');
    },
    testSerializeObjectSpecificLayers: function() {
        var instance1 = new lively.persistence.tests.PersistenceTests.SmartRefTestDummy()
        var layer = cop.create('TestSerializeLayersLayer');
        instance1.withLayers = [layer];

        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var result = this.serializeAndDeserialize(instance1)

        this.assert(result.withLayers, 'deserialized has no withLayers');
        this.assert(result.withLayers[0], 'deserialized has no reference to the layer');
        this.assert(result.withLayers[0] instanceof Layer,    'deserialized layer is layer ');
        this.assertIdentity(result.withLayers[0], instance1.withLayers[0],
            'deserialized layer is not identical with original');
    },
    testSerializeObjectSpecificWithoutLayers: function() {
        var instance1 = new lively.persistence.tests.PersistenceTests.SmartRefTestDummy()
        var layer = cop.create('TestSerializeLayersLayer');
        instance1.withoutLayers = [layer];

        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var result = this.serializeAndDeserialize(instance1)

        this.assert(result.withoutLayers, 'deserialized has no withLayers');
        this.assert(result.withoutLayers[0], 'deserialized has no reference to the layer');
        this.assert(result.withoutLayers[0] instanceof Layer,    'deserialized layer is layer ');
        this.assertIdentity(result.withoutLayers[0], instance1.withoutLayers[0],
            'deserialized layer is not identical with original');
    },
    test03IgnoreProps: function() {
        var obj = {
            doNotSerialize: ['foo'],
            foo: 23,
            bar: 42,
        };
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var result = this.serializeAndDeserialize(obj);
        this.assert(!result.foo, 'property that was supposed to be ignored was serialized');
        this.assertEquals(42, result.bar, 'property that shouldn\'t be ignored was removed');
    },
    testIgnoreOfArrayItemsShrinksArra: function() {
        var obj = {
            list: [1, 2, {ignoreMe: true}, 3]
        };
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var filter = new GenericFilter();
        filter.addFilter(function(obj, propName, value) { return value.ignoreMe })
        this.serializer.addPlugin(filter);
        var result = this.serializeAndDeserialize(obj);
        this.assertEqualState([1,2,3], result.list, 'ignoring props does not work');
    },

    test04FindModulesOfClasses: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0,0, 100, 100),
            morph2 = lively.morphic.Morph.makeRectangle(0,0, 50, 50);
        morph1.addMorph(morph2);
        // plugin creation should happen there
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively();
        var string = this.serializer.serialize(morph1),
            jso = JSON.parse(string),
            result = lively.persistence.Serializer.sourceModulesIn(jso);
        this.assertEquals(2, result.length, 'not the correct amount of classes recognized ' + result);
        this.assert(result.include('Global.lively.morphic.Core'), 'Global.lively.morphic.Core not included');
        this.assert(result.include('Global.lively.morphic.Shapes'), 'Global.lively.morphic.Shapes not included');
    },

    testDoNotSerializeFoundInClassHierarchy: function() {
        Object.subclass('ObjectLinearizerPluginTestClassA', { doNotSerialize: ['x'] });
        ObjectLinearizerPluginTestClassA.subclass('ObjectLinearizerPluginTestClassB', { doNotSerialize: ['y'] });
        var obj = new ObjectLinearizerPluginTestClassB(),
            sut = new DoNotSerializePlugin();
        this.assert(sut.doNotSerialize(obj, 'y'), 'y');
        this.assert(sut.doNotSerialize(obj, 'x'), 'x');
        this.assert(!sut.doNotSerialize(obj, 'foo'), 'foo');
    },
    testRaiseErrorWhenClassNotFound: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        try {
            var klass = Object.subclass('Dummy_testDontRaiseErrorWhenClassNotFound', {}),
                instance = new klass(),
                serialized = this.serializer.serialize(instance);
        } finally {
            klass.remove();
        }

        var temp = Config.ignoreClassNotFound;
        Config.ignoreClassNotFound = false;
        try {
            this.serializer.deserialize(serialized)
        } catch(e) { return } finally { Config.ignoreClassNotFound = temp }

        this.assert(false, 'No error rasied when deserializing obj without class')

    },
    testRaiseNoErrorWhenClassNotFoundWhenOverridden: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        try {
            var className = 'Dummy_testRaiseNoErrorWhenClassNotFoundWhenOverridden',
                klass = Object.subclass(className, {}),
                instance = new klass(),
                serialized = this.serializer.serialize(instance);
        } finally {
            klass.remove();
        }

        var temp = Config.ignoreClassNotFound;
        Config.ignoreClassNotFound = true;
        try {
            var result = this.serializer.deserialize(serialized)
        } finally {
            Config.ignoreClassNotFound = temp
        }
        this.assert(result.isClassPlaceHolder)
        this.assertEquals(className, result.className)


    },
    testSerializeRegexp: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var obj = {regexp:  /.*/i},
            result = this.serializeAndDeserialize(obj);
        this.assert(result.regexp instanceof RegExp, 'not a regular expression')
        this.assert(result.regexp.test('aab'), 'regular expression not working')
    },
    testSerializeClosure: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var obj = {foo: lively.Closure.fromFunction(function() { return y + 3 }, {y: 2}).recreateFunc()},
            result = this.serializeAndDeserialize(obj);
        this.assert(result.foo, 'function not deserialized')
        this.assertEquals(5, result.foo(), 'closure not working')
    },
    testClosureSerializationWithBoundThis: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var obj = {myName: function myName() { return this.name }.asScript(), name: 'SomeName2'};
        this.assertEquals('SomeName2', obj.myName());
        var copy = this.serializer.copy(obj);
        this.assertEquals('SomeName2', copy.myName());
        copy.name = 'Foo'
        this.assertEquals('Foo', copy.myName());
        this.assertEquals('SomeName2', obj.myName());
    },
    testSerializeChangeAndSerializeClosure: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var obj = {foo: function() { return 23 }.asScript()};
        var copy = this.serializer.copy(obj);
        this.assertEquals(23, copy.foo());
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        (function() { return 42 }).asScriptOf(obj, 'foo');
        var copy2 = this.serializer.copy(obj);
        this.assertEquals(42, copy2.foo(), 'copy 2 deserialized wrong function');
    },

    testSerializeAndDeserializeDate: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var obj = {date: new Date()},
            result = this.serializeAndDeserialize(obj);
        this.assertEquals(String(obj.date), String(result.date), 'date not correctly (de)serialized')
    },
    testDoNotSerializeWeakReferences: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there

        var obj1 = {n: 1},
            obj2 = {n: 2, o: obj1, doWeakSerialize: ['o']},
            obj3 = {o1: obj1, o2: obj2};

        var obj2Copy = this.serializeAndDeserialize(obj2);
        this.assert(!obj2Copy.o, "weak ref was serialized");
    },
    testSerializeWeakReferencesWhenRealReferenceIsFound: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively();

        var obj1 = {n: 1},
            obj2 = {n: 2, o: obj1, doWeakSerialize: ['o']},
            obj3 = {o1: obj1, o2: obj2};

        var result = this.serializer.serializeToJso(obj3), //this.serializeAndDeserialize(obj3);
            rootId = result.id,
            obj3Copy = result.registry[rootId],
            obj2Copy = result.registry[obj3Copy.o2.id];

        this.assert(obj2Copy.o !== undefined, "weak ref was not serialized");
    },
    testSerializeDependendConnections: function() {
        this.serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var m1 = new lively.morphic.Morph();
        var m2 = new lively.morphic.Morph();
        lively.bindings.connect(m1, 'rotation', m2, 'setRotation', {garbageCollect: false});
        var oldCount = m1.attributeConnections[0].dependendConnections.length;
        var copy = this.serializer.copy(m1);
        var newCount = copy.attributeConnections[0].dependendConnections.length;
        this.assertEquals(oldCount, newCount, 'serialization adds additional dependent connection');
    }
});


TestCase.subclass('lively.persistence.tests.PersistenceTests.AttributeConnectionGarbageCollectionPluginTest',
'testing', {

  testGarbageCollectConnectionIfNoOtherRef: function() {
    var obj1 = {}, obj2 = {};
    lively.bindings.connect(obj1, 'x', obj2, 'y');
    var copied = lively.persistence.Serializer.deserialize(
      lively.persistence.Serializer.serialize(obj1));
    this.assert(!copied.attributeConnections || !copied.attributeConnections.length,
      "connection not garbage collected");
  },

  testDontGarbageCollectConnectionIfTargetIsRefed: function() {
    var obj1 = {}, obj2 = {};
    obj1.ref = obj2;
    lively.bindings.connect(obj1, 'x', obj2, 'y');
    var copied = lively.persistence.Serializer.deserialize(
      lively.persistence.Serializer.serialize(obj1));
    this.assertIdentity(copied.ref, copied.attributeConnections[0].targetObj);
  },

  testDontGarbageCollectConnectionIfNotCollectable: function() {
    var obj1 = {}, obj2 = {};
    lively.bindings.connect(obj1, 'x', obj2, 'y', {garbageCollect: false});
    var copied = lively.persistence.Serializer.deserialize(
      lively.persistence.Serializer.serialize(obj1));
    this.assert(copied.attributeConnections[0].targetObj);
  }
});

TestCase.subclass('lively.persistence.tests.PersistenceTests.RestoreTest',
'running', {
    setUp: function($super) {
        $super();
        this.sut = lively.persistence.Serializer.createObjectGraphLinearizer();
    }
},
'helper', {
    serializeAndDeserialize: function(obj) {
        return this.sut.deserialize(this.sut.serialize(obj))
    }
},
'testing', {
    test01aConnect: function() {
        var obj1 = {}, obj2 = {};
        obj1.ref = obj2;
        lively.bindings.connect(obj1, 'x', obj2, 'y');
        obj1.x = 23;
        this.assertEquals(23, obj2.y);
        var result = this.serializeAndDeserialize(obj1);
        result.x = 42
        this.assertEquals(23, obj2.y, 'connect affects non serialized');
        this.assertEquals(42, result.ref.y, 'connect not serialized');
    },

    test01bConnectWithConverter: function() {
        var obj1 = {}, obj2 = {};
        obj1.ref = obj2;
        lively.bindings.connect(obj1, 'x', obj2, 'y', {converter: function(val) { return val + 1 }});
        var result = this.serializeAndDeserialize(obj1);
        result.x = 42
        this.assertEquals(43, result.ref.y, 'connect not serialized');
    },

    test03aSerializeMorphScript: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0,0,0)
        morph.addScript(function someScript(val) { this.val = val });
        morph.someScript(23);
        this.assertEquals(23, morph.val);
        var result = this.serializeAndDeserialize(morph);
        result.someScript(42);
        this.assertEquals(42, result.val, 'script not serialized');
    },
    test03bSerializeScript: function() {
        var obj = {foo: function(x) { this.x = x }.asScript()};
        obj.foo(2)
        this.assertEquals(2, obj.x);
        var result = this.serializeAndDeserialize(obj);
        result.foo(3);
        this.assertEquals(3, result.x, 'script not serialized');
    }

});

TestCase.subclass('lively.persistence.tests.PersistenceTests.PrototypeInstanceSerializationTest',
'helper', {
    createObj: function(constr, constrArg) {
        constr.prototype.foo = 3;
        return constrArg ? new constr(constrArg) : new constr();
    },
    createPlugin: function() {
        this.plugin = new lively.persistence.GenericConstructorPlugin();
    }
},
'running', {
    setUp: function($super) {
        $super();
        this.createPlugin();
        this.serializer = lively.persistence.Serializer.createObjectGraphLinearizer();
        this.serializer.addPlugin(this.plugin);
    },

    tearDown: function($super) {
        $super();
        if (Global.constr) delete Global.constr;
    }
},
'testing', {
    testConstructorPluginGetsConstructorName: function() {
        var obj = this.createObj(function constr() {}),
            name = this.plugin.getConstructorName(obj);
        this.assertEquals('constr', name);
    },

    testSerializeAndDeserializeSimpleInstance: function() {
        Global.constr = function constr() {};
        var obj = this.createObj(constr),
            copy = this.serializer.deserialize(this.serializer.serialize(obj));
        this.assertEquals(3, copy.foo, 'copy does not have property');
        this.assert(!copy.hasOwnProperty('foo'), 'copy does not inherit property');
        this.assertIdentity(constr, copy.constructor, 'constructor not set');
    },

    testSerializeAndDeserializeWithConstructorExpectingArgs: function() {
        Global.constr = function constr(arg) {
            if (!arg) throw new Error("need arg to create object!");
            this.bar = arg;
        };
        var obj = this.createObj(constr, 5),
            serialized = this.serializer.serialize(obj),
            copy = this.serializer.deserialize(serialized);
        this.assert(copy.foo && !copy.hasOwnProperty('foo'), 'copy does not have/inherit property');
        this.assertEquals(5, copy.bar, 'copy does not have prop set in constructor');
        this.assertIdentity(constr, copy.constructor, 'constructor not set');
    },

    testDontSerializeConstructorForSimpleObjects: function() {
        var obj = {};
        var id = this.serializer.serializeToJso(obj).id;
        var serialized = this.serializer.getRegisteredObjectFromId(id);
        this.assert(!serialized[this.plugin.constructorProperty],
                    'serialized constr for simple obj');
    },

    testDontSerializeLivelyClass: function() {
        var obj = pt(3,2);;
        var id = this.serializer.serializeToJso(obj).id;
        var serialized = this.serializer.getRegisteredObjectFromId(id);
        this.assert(!serialized[this.plugin.constructorProperty],
                    'serialized constr for Lively Point');
    }
});

lively.persistence.tests.PersistenceTests.ObjectGraphLinearizerTest.subclass('lively.persistence.tests.SerializeAsExpression',
'running', {
    setUp: function($super) {
        $super();
        this.sut.addPlugin(new lively.persistence.ExprPlugin());
    },

    assertSerializesFromExpr: function(expectedObj, expr) {
        var result = this.sut.deserializeJso({id: 0, registry: {
            '0': {
                registeredObject: {
                    __serializedExpressions__: [ "testObj" ],
                    testObj: expr
                }
            }
        }});
        this.assertEquals(expectedObj, result.testObj,
                          Strings.format('expr %s does not eval to %s',
                                         expr, expectedObj));
    },

    assertSerializesToExpr: function(expectedExpr, obj) {
        var ref = this.sut.register({testExpr: obj}),
            regObj = this.sut.getRegisteredObjectFromId(ref.id);
        this.assertEquals(expectedExpr, regObj.testExpr);
    }
},
'testing', {
    test01ToExpr: function() {
        var obj = {point: lively.pt(1,2)},
            ref = this.sut.register(obj),
            regObj = this.sut.getRegisteredObjectFromId(ref.id);
        this.assertEqualState({
            '__serializedExpressions__': ['point'],
            point: 'lively.pt(1.0,2.0)'
        }, regObj, JSON.prettyPrint(regObj));
    },

    test02ToExpr: function() {
        var regObj = {__serializedExpressions__: ['point'], point: 'lively.pt(1.0,2.0)'},
            result = this.sut.deserializeJso({id: 0, registry: {'0': {registeredObject: regObj}}});
        this.assertEquals(pt(1,2), result.point);
    },
    test03ObjectsToAndFrom: function() {
        var test = this, tests = [
            {obj: lively.pt(2,3), expr: "lively.pt(2.0,3.0)"},
            {obj: lively.rect(pt(1,2), pt(4,5)), expr: "lively.rect(1,2,3,3)"},
            {obj: Color.red, expr: 'Color.' + Color.red.toString()}
        ];
        tests.forEach(function(testData) {
            test.assertSerializesToExpr(testData.expr, testData.obj);
            test.assertSerializesFromExpr(testData.obj, testData.expr);
        });
    },
    test04SpecialPropertyCleaned: function() {
        var obj = {pos: lively.pt(1,2)};
        var serialized = this.sut.serializeToJso(obj);
        var deserialized = this.sut.deserializeJso(serialized);
        this.assert(!deserialized.hasOwnProperty('__serializedExpressions__'));
    },
    test05ExprInArray: function() {
        var obj = {arrayWithPoint: [2, 3, [lively.pt(1,2)]]};
        // First test serialized representation
        var ref = this.sut.register(obj),
            regObj = this.sut.getRegisteredObjectFromId(ref.id);
        this.assertEqualState({
            '__serializedExpressions__': ["arrayWithPoint.2.0"],
            arrayWithPoint: [2, 3, ['lively.pt(1.0,2.0)']]
        }, regObj, 'registry object: ' + JSON.prettyPrint(this.sut.registry));
        // now test if deserialization works
        var deserialized = this.sut.deserializeJso(this.sut.serializeToJso(obj));
        this.assertEqualState(obj, deserialized, 'deserialized: ' + Objects.inspect(deserialized));
    },
    test06ExprInArrayInObjInArray: function() {
        var obj = {foo: [{arrayWithPoint: [lively.pt(1,2),lively.pt(1,2),lively.pt(1,2),lively.pt(1,2)]}]},
            deserialized = this.sut.deserializeJso(this.sut.serializeToJso(obj));
        this.assertEqualState(obj, deserialized, 'deserialized: ' + Objects.inspect(deserialized));
    }
});

lively.persistence.tests.PersistenceTests.ObjectGraphLinearizerTest.subclass('lively.persistence.tests.Compaction',
'running', {
    setUp: function($super) {
        $super();
        // this.sut.addPlugin(new lively.persistence.ExprPlugin());
    },
},
'testing', {

    testDirectCompaction: function() {
      var objs = [{name: "1"}, {name: "2"}, {name: "3"}, {name: "4"}, {name: "5"}];
      objs[0].ref = objs[1];
      objs[1].ref1 = objs[2];
      objs[1].ref2 = objs[3];
      objs[2].refs = [objs[3], [objs[4]], objs[0]];

      var serializer = lively.persistence.Serializer.createObjectGraphLinearizer(),
          snapshot = serializer.serializeToJso(objs[0]),
          compacted;

      // no changes
      compacted = serializer.compactRegistry(lively.lang.obj.deepCopy(snapshot));
      this.assertEqualState(snapshot, compacted, "1");
      this.assertEquals(
          lively.lang.obj.inspect(objs[0], {maxDepth: 5}),
          lively.lang.obj.inspect(serializer.deserializeJso(compacted), {maxDepth: 5}));

      // removals
      compacted = serializer.compactRegistry(lively.lang.obj.deepCopy(snapshot), [2]);
      this.assertEqualState(["0", "1", "3", "isSimplifiedRegistry"], Object.keys(compacted.registry), "2");
      this.assertEqualState(
        {name: "1", ref: {name: "2", ref1: null, ref2: {name: "4"}}},
        serializer.deserializeJso(compacted), "2 deserialized");

      compacted = serializer.compactRegistry(lively.lang.obj.deepCopy(snapshot), [3]);
      this.assertEqualState(["0", "1", "2", "4", "isSimplifiedRegistry"], Object.keys(compacted.registry), "3");
      this.assertEqualState(
        {name: "1",ref: {name: "2",ref1: null,ref2: null}},
        serializer.deserializeJso(compacted), "2 deserialized");
    },

    testRemoveAllReferences: function() {
      var objs = [{}, {}, {}, {}, {}, {}];
      objs[0].ref = objs[1];
      objs[1].ref = objs[2];
      objs[2].ref = objs[3];
      objs[3].ref = objs[4];
      objs[4].ref = objs[5];
      objs[5].ref = objs[3];

      // There is a loop 3 -> 4 -> 5
      //                 ^---------|
      var serializer = lively.persistence.Serializer.createObjectGraphLinearizer(),
          snapshot = serializer.serializeToJso(objs[0]),
          compacted = serializer.compactRegistry(lively.lang.obj.deepCopy(snapshot), ["1"]);
      this.assertEqualState(["0", "isSimplifiedRegistry"], Object.keys(compacted.registry));

      objs[0].ref2 = objs[5];
      var serializer = lively.persistence.Serializer.createObjectGraphLinearizer(),
          snapshot = serializer.serializeToJso(objs[0]);
          compacted = serializer.compactRegistry(lively.lang.obj.deepCopy(snapshot), ["1"]);
      this.assertEqualState(["0", "3", "4", "5", "isSimplifiedRegistry"], Object.keys(compacted.registry));
    },

    testCompactionHappensWithNormalSerialization: function() {
      var objs = [{}, {}, {}, {}, {}, {}];
      objs[0].ref = objs[1];
      objs[1].ref = objs[2];
      objs[2].ref = objs[3];
      objs[3].ref = objs[4];
      objs[4].ref = objs[5];
      objs[5].ref = objs[3];

      // There is a loop 3 -> 4 -> 5
      //                 ^---------|
      var serializer = lively.persistence.Serializer.createObjectGraphLinearizer();
      var filter = new GenericFilter();
      filter.addFilter(function(obj, propName, value) { return value === objs[1]; })
      serializer.addPlugin(filter);
      var snapshot = serializer.serializeToJso(objs[0]);
      this.assertEqualState(["0", "isSimplifiedRegistry"], Object.keys(snapshot.registry));

      this.assert(!objs[1][lively.persistence.ObjectGraphLinearizer.prototype.idProperty],
        "removed object not cleaned up!");
    }
});

}) // end of module
