module('lively.persistence.tests.PersistenceTests').requires('lively.persistence.Serializer', 'lively.TestFramework').toRun(function() {

Object.subclass('lively.persistence.tests.SmartRefTestDummy', // for testing
'default category', {
    someProperty: 23,
    m1: function() { return 99 },
    toString: function() { return 'a ' + this.constructor.name },
});


TestCase.subclass('lively.persistence.tests.ObjectGraphLinearizerTest',
'running', {
    setUp: function($super) {
        $super();
        this.sut = new ObjectGraphLinearizer();
    },
},
'testing', {
    test01RegisterObject: function() {
        var obj = {foo: 23};
        var ref = this.sut.register(obj);
        this.assertEquals(23, this.sut.getRegisteredObjectFromId(ref.id).foo);
        this.sut.cleanup()
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
            id3 = this.sut.getIdFromObject(obj3);
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
    testCDATAEndTagIsExcaped: function() {
        var str = 'Some funny string with CDATA end tag: ]]> and again ]]>',
            obj = { value: str };
        var json = this.sut.serialize(obj);
        this.assert(!json.include(']]>'), 'CDATA end tag included')
        var result = this.sut.deserialize(json)
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
})


TestCase.subclass('lively.persistence.tests.ObjectGraphLinearizerPluginTest',
'running', {
    setUp: function($super) {
        $super();
        this.serializer = new ObjectGraphLinearizer();
    },
    createAndAddDummyPlugin: function() {
        var plugin = new ObjectLinearizerPlugin();
        this.serializer.addPlugin(plugin);
        return plugin;
    },
    serializeAndDeserialize: function(obj) {
        return this.serializer.deserialize(this.serializer.serialize(obj))
    },
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
        var instance1 = new lively.persistence.tests.SmartRefTestDummy(),
            instance2 = new lively.persistence.tests.SmartRefTestDummy();
        instance1.friend = instance2;
        instance2.specialProperty = 'some string';

        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
        var result = this.serializeAndDeserialize(instance1)

        this.assertEquals(instance2.specialProperty, result.friend.specialProperty);

        this.assert(result.m1, 'deserialized does not have method');
        this.assertEquals(99, result.m1(), 'wrong method invocation result');
        lively.persistence.tests.SmartRefTestDummy.prototype.someProperty = -1; // change after serialization
        this.assertEquals(lively.persistence.tests.SmartRefTestDummy.prototype.someProperty, result.someProperty, 'proto prop');

        this.assertIdentity(lively.persistence.tests.SmartRefTestDummy, result.constructor, 'constructor 1');
        this.assertIdentity(lively.persistence.tests.SmartRefTestDummy, result.friend.constructor, 'constructor 2');
        this.assert(result instanceof lively.persistence.tests.SmartRefTestDummy, 'instanceof 1');
        this.assert(result.friend instanceof lively.persistence.tests.SmartRefTestDummy, 'instanceof 2');
    },
    testSerializeObjectSpecificLayers: function() {
        var instance1 = new lively.persistence.tests.SmartRefTestDummy()
        var layer = cop.create('TestSerializeLayersLayer');
        instance1.withLayers = [layer];

        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
        var result = this.serializeAndDeserialize(instance1)

        this.assert(result.withLayers, 'deserialized has no withLayers');
        this.assert(result.withLayers[0], 'deserialized has no reference to the layer');
        this.assert(result.withLayers[0] instanceof Layer,    'deserialized layer is layer ');
        this.assertIdentity(result.withLayers[0], instance1.withLayers[0],
            'deserialized layer is not identical with original');
    },
    testSerializeObjectSpecificWithoutLayers: function() {
        var instance1 = new lively.persistence.tests.SmartRefTestDummy()
        var layer = cop.create('TestSerializeLayersLayer');
        instance1.withoutLayers = [layer];

        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
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
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
        var result = this.serializeAndDeserialize(obj);
        this.assert(!result.foo, 'property that was supposed to be ignored was serialized');
        this.assertEquals(42, result.bar, 'property that shouldn\'t be ignored was removed');
    },
    testIgnoreOfArrayItemsShrinksArra: function() {
        var obj = {
            list: [1, 2, {ignoreMe: true}, 3]
        };
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
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
        this.serializer = ObjectGraphLinearizer.forNewLively(); // plugin creation should happen there
        var string = this.serializer.serialize(morph1),
            jso = JSON.parse(string),
            result = lively.persistence.Serializer.sourceModulesIn(jso);
        this.assertEqualState(['Global.lively.morphic.Core', 'Global.lively.morphic.Shapes', 'Global', 'Global.lively.morphic.Events'], result);
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
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
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
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
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
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
        var obj = {regexp:  /.*/i},
            result = this.serializeAndDeserialize(obj);
        this.assert(result.regexp instanceof RegExp, 'not a regular expression')
        this.assert(result.regexp.test('aab'), 'regular expression not working')
    },
    testSerializeClosure: function() {
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
        var obj = {foo: lively.Closure.fromFunction(function() { return y + 3 }, {y: 2}).recreateFunc()},
            result = this.serializeAndDeserialize(obj);
        this.assert(result.foo, 'function not deserialized')
        this.assertEquals(5, result.foo(), 'closure not working')
    },
    testClosureSerializationWithBoundThis: function() {
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
        var obj = {myName: function myName() { return this.name }.asScript(), name: 'SomeName2'};
        this.assertEquals('SomeName2', obj.myName());
        var copy = this.serializer.copy(obj);
        this.assertEquals('SomeName2', copy.myName());
        copy.name = 'Foo'
        this.assertEquals('Foo', copy.myName());
        this.assertEquals('SomeName2', obj.myName());
    },
    testSerializeChangeAndSerializeClosure: function() {
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
        var obj = {foo: function() { return 23 }.asScript()};
        var copy = this.serializer.copy(obj);
        this.assertEquals(23, copy.foo());
        (function() { return 42 }).asScriptOf(obj, 'foo');
        var copy2 = this.serializer.copy(obj);
        this.assertEquals(42, copy2.foo(), 'copy 2 deserialized wrong function');
    },

    testSerializeAndDeserializeDate: function() {
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there
        var obj = {date: new Date()},
            result = this.serializeAndDeserialize(obj);
        this.assertEquals(String(obj.date), String(result.date), 'date not correctly (de)serialized')
    },
    testDoNotSerializeWeakReferences: function() {
        this.serializer = ObjectGraphLinearizer.forLively(); // plugin creation should happen there

        var obj1 = {n: 1},
            obj2 = {n: 2, o: obj1, doWeakSerialize: ['o']},
            obj3 = {o1: obj1, o2: obj2};

        var obj2Copy = this.serializeAndDeserialize(obj2);
        this.assert(!obj2Copy.o, "weak ref was serialized");
    },
    testSerializeWeakReferencesWhenRealReferenceIsFound: function() {
        this.serializer = ObjectGraphLinearizer.forLively();

        var obj1 = {n: 1},
            obj2 = {n: 2, o: obj1, doWeakSerialize: ['o']},
            obj3 = {o1: obj1, o2: obj2};

        var result = this.serializer.serializeToJso(obj3), //this.serializeAndDeserialize(obj3);
            rootId = result.id,
            obj3Copy = result.registry[rootId],
            obj2Copy = result.registry[obj3Copy.o2.id];

        this.assert(obj2Copy.o !== undefined, "weak ref was not serialized");
    },
});

TestCase.subclass('lively.persistence.tests.RestoreTest',
'running', {
    setUp: function($super) {
        $super();
        this.sut = ObjectGraphLinearizer.forLively();
    },
},
'helper', {
    serializeAndDeserialize: function(obj) {
        return this.sut.deserialize(this.sut.serialize(obj))
    },
},
'testing', {
    test01aConnect: function() {
        var obj1 = {}, obj2 = {};
        obj1.ref = obj2;
        connect(obj1, 'x', obj2, 'y');
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
        connect(obj1, 'x', obj2, 'y', {converter: function(val) { return val + 1 }});
        var result = this.serializeAndDeserialize(obj1);
        result.x = 42
        this.assertEquals(43, result.ref.y, 'connect not serialized');
    },

    test02aCopyRelayDEPRECATED: function() {
        if (Config.isNewMorphic) return // no old models in new lively...
        var morph = new ButtonMorph(new Rectangle(0,0,100,20)),
            model = { onValueUpdate: function(val) { this.wasCalled = val }.asScript() };

        morph.manualModel = model
        morph.relayToModel(model, {Value: '!Value'});
        this.assert(!morph.manualModel.wasCalled, 'strange')
        morph.setValue(true);
        this.assert(morph.manualModel.wasCalled, 'relay connection not working')
        morph.setValue(false);
        var result = this.serializeAndDeserialize(morph);

        result.setValue(true);
        this.assert(!morph.manualModel.wasCalled, 'wrong update')
        this.assert(result.formalModel.setValue, 'formal model has no relay setter');
        this.assert(result.manualModel.wasCalled, 'relay after serialization not working')
    },
    test02bSerializePlainRecordDEPRECATED: function() {
        if (Config.isNewMorphic) return // no old models in new lively...
        var record = Record.newPlainInstance({Foo: 10}),
            result = this.serializeAndDeserialize(record);
        this.assertEquals(10, result.getFoo());
        result.setFoo(12)
        this.assertEquals(12, result.getFoo());
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
    },

});

TestCase.subclass('lively.persistence.tests.PrototypeInstanceSerializationTest',
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
        this.serializer.serialize(obj);
        var serialized = this.serializer.getRegisteredObjectFromId(0);
        this.assert(!serialized[this.plugin.constructorProperty],
                    'serialized constr for simple obj');
    },

    testDontSerializeLivelyClass: function() {
        var obj = pt(3,2);;
        this.serializer.serialize(obj);
        var serialized = this.serializer.getRegisteredObjectFromId(0);
        this.assert(!serialized[this.plugin.constructorProperty],
                    'serialized constr for Lively Point');
    }
});

}) // end of module