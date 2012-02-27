module('lively.bindings.tests.BindingTests').requires('lively.TestFramework', 'lively.bindings').toRun(function() {

TestCase.subclass('lively.bindings.tests.BindingTests.ConnectionTest', {

    test01SimpleConnection: function() {
        var obj1 = {x: 4};
        var obj2 = {xchanged: function(newVal) { obj2.value = newVal }};
        connect(obj1, 'x', obj2, 'xchanged');
        obj1.x = 2;
        this.assertEquals(obj2.value, 2, 'connection not working');
    },

    test02MultipleConnections: function() {
        var obj1 = {x: 4};
        var obj2 = {xchanged: function(newVal) { obj2.value = newVal }};
        var obj3 = {xchangedAgain: function(newVal) { obj3.value = newVal }};
        connect(obj1, 'x', obj2, 'xchanged');
        connect(obj1, 'x', obj3, 'xchangedAgain');
        obj1.x = 2;
        this.assertEquals(obj2.value, 2, 'connection not working obj2');
        this.assertEquals(obj3.value, 2, 'connection not working obj3');
    },

    test03RemoveConnections: function() {
        var obj1 = {x: 4};
        var obj2 = {xchanged: function(newVal) { obj2.value = newVal }};
        var obj3 = {xchangedAgain: function(newVal) { obj3.value = newVal }};
        connect(obj1, 'x', obj2, 'xchanged');
        connect(obj1, 'x', obj3, 'xchangedAgain');
        disconnect(obj1, 'x', obj2, 'xchanged');
        obj1.x = 2;
        this.assertEquals(obj2.value, null, 'obj2 not disconnected');
        this.assertEquals(obj3.value, 2, 'obj3 wrongly disconnected');
        disconnect(obj1, 'x', obj3, 'xchangedAgain');
        obj1.x = 3;
        this.assertEquals(obj3.value, 2, 'obj3 not disconnected');
        this.assert(!obj1.__lookupSetter__('x'), 'disconnect cleanup failure');
        this.assertEquals(obj1.x, 3, 'disconnect cleanup failure 2');
        this.assert(!obj1['$$x'], 'disconnect cleanup failure 3');
        this.assert(!obj1.doNotSerialize.include('$$x'), 'disconnect cleanup failure doNotSerialize');
    },

    test04BidirectionalConnect: function() {
        var obj1 = {update: function(newVal) { obj1.value = newVal }};
        var obj2 = {update: function(newVal) { obj2.value = newVal }};

        connect(obj1, 'value', obj2, 'update');
        connect(obj2, 'value', obj1, 'update');

        obj1.value = 3;
        this.assertEquals(3, obj1.value, 'obj1 not updated');
        this.assertEquals(3, obj2.value, 'obj2 not updated');
    },

    test05AttributeAttributeConnections: function() {
        var obj1 = {value: 0};
        var obj2 = {value: 1};
        connect(obj1, 'value', obj2, 'value');
        obj1.value = 3;
        this.assertEquals(3, obj2.value, 'obj2 not updated');
    },

    test06AttributeAttributeConnectionsWhenNothingDefined: function() {
        var obj1 = {};
        var obj2 = {};
        connect(obj1, 'value', obj2, 'value');
        obj1.value = 3;
        this.assertEquals(3, obj2.value, 'obj2 not updated');
    },

    test07ConnectWhenAlreadyConnected: function() {
        var obj1 = {};
        var obj2 = {};
        connect(obj1, 'value', obj2, 'value');
        connect(obj1, 'value', obj2, 'value');
        this.assertEquals(1, obj1.attributeConnections.length, 'multiple connections added');
        obj1.value = 3;
        this.assertEquals(3, obj2.value, 'obj2 not updated');
    },

    test08ManuallyUpdateConnection: function() {
        var obj1 = {};
        var obj2 = {};
        connect(obj1, 'value1', obj2, 'value2');
        updateAttributeConnection(obj1, 'value1', 3);
        this.assertEquals(3, obj2.value2, 'obj2 not updated');
    },
    
    test09Converter: function() {
        var obj1 = {};
        var obj2 = {};
        connect(obj1, 'value', obj2, 'value', {converter: function(val) { return val + 1 }});
        obj1.value = 2;
        this.assertEquals(3, obj2.value);
    },
    
    test10ErrorWhenConverterReferencesEnvironment: function() {
        var obj1 = {}, obj2 = {}, externalVal = 42;
        connect(obj1, 'value', obj2, 'value', {converter: function(val) { return val + externalVal }});
        
        // mock worlds error displaying for this test's extent, to not have errors displayed on test runs
        // try-catch directly around obj1.value does not work: error does not happen on top of this frame
        var originalSetStatusMessage = $world.setStatusMessage;
        try {
            var numberOfErrorMessages = 0;
            $world.setStatusMessage = function() {
                numberOfErrorMessages += 1;
                $world.setStatusMessage = function() {
                    numberOfErrorMessages += 1;
                    $world.setStatusMessage = originalSetStatusMessage;
                }
            }
            obj1.value = 2;
        } catch (e) {
            $world.setStatusMessage = originalSetStatusMessage;
            throw e;
        }
        
        this.assert(numberOfErrorMessages === 2, 'no error when using external val in converter');
        $world.setStatusMessage = originalSetStatusMessage; // necessary when test wasn't successful - i.e. no errors
    },

    test11NewConnectionReplacesOld: function() {
        var obj1 = {};
        var obj2 = {};
        connect(obj1, 'value', obj2, 'value', {converter: function(val) { return val + 1}});
        connect(obj1, 'value', obj2, 'value', {converter: function(val) { return val + 2}});
        obj1.value = 2
        this.assertEquals(4, obj2.value);
        this.assertEquals(1, obj1.attributeConnections.length);
    },

    test12DisconnectDoesNotRemoveAttribute: function () {
        var obj1 = {};
        var obj2 = {};
        var c = connect(obj1, 'value', obj2, 'value');
        obj1.value = 2;
        c.disconnect();
        this.assertEquals(2, obj1.value);
        this.assertEquals(2, obj2.value);
    },
    
    test13IsSimilarConnection: function () {
        var c1, c2, obj1 = {}, obj2 = {}, obj3 = {};
        c1 = connect(obj1, 'value', obj2, 'value'); c2 = connect(obj1, 'value', obj2, 'value');
        this.assert(c1.isSimilarConnection(c2), '1');
        c1 = connect(obj1, 'value', obj2, 'value', {converter: function(v) { return v + 1 }});
        c2 = connect(obj1, 'value', obj2, 'value', {converter: function(v) { return v + 2 }});
        this.assert(c1.isSimilarConnection(c2), '2');
        // ----------------------
        c1 = connect(obj1, 'value1', obj2, 'value'); c2 = connect(obj1, 'value', obj2, 'value');
        this.assert(!c1.isSimilarConnection(c2), '3');
        c1 = connect(obj1, 'value', obj2, 'value'); c2 = connect(obj1, 'value', obj3, 'value');
        this.assert(!c1.isSimilarConnection(c2), '4');
    },

    test14EinwegConnection: function () {
        var obj1 = {};
        var obj2 = {};
        connect(obj1, 'value', obj2, 'value', {converter: function(val) { return val + 1 }, removeAfterUpdate: true})
        obj1.value = 2
        this.assertEquals(3, obj2.value);
        this.assert(!obj1.attributeConnections || obj1.attributeConnections.length == 0, 'connection not removed!');
    },

    test15ProvideOldValueInConverters: function () {
        var obj1 = {value: 10};
        var obj2 = {delta: null};
        connect(obj1, 'value', obj2, 'delta', {converter: function(newValue, oldValue) {
            return newValue - oldValue
        }})
        obj1.value = 15;
        this.assertEquals(obj2.delta, 5)
    },
    
    test16Updater: function () {
        var obj1 = {x: null};
        var obj2 = {x: null};

        var c = connect(obj1, 'x', obj2, 'x',
            {updater: function($proceed, newValue, oldValue) { $proceed(newValue) }});
        obj1.x = 15;
        this.assertEquals(obj2.x, 15, 'proceed called');
        c.disconnect();

        c = connect(obj1, 'x', obj2, 'x',
            {updater: function($proceed, newValue, oldValue) { }});
        obj1.x = 3;
        this.assertEquals(obj2.x, 15, 'proceed not called');
        c.disconnect();
    },

    test17Updater: function () {
        var obj1 = {x: 42};
        var obj2 = {m: function(a, b) { obj2.a = a; obj2.b = b }};
        var c = connect(obj1, 'x', obj2, 'm',
            {updater: function($proceed, newValue, oldValue) { $proceed(newValue, oldValue) }});
        obj1.x = 15;
        this.assertEquals(obj2.a, 15);
        this.assertEquals(obj2.b, 42);
    },

    test18UpdaterAndConverter: function () {
        var obj1 = {x: null};
        var obj2 = {x: null};
        var c = connect(obj1, 'x', obj2, 'x',
            {updater: function($proceed, newValue, oldValue) { $proceed(newValue) },
            converter: function(v) { return v + 1 }});
        obj1.x = 15;
        this.assertEquals(obj2.x, 16);
    },
        
    test19NoUpdaterNoConverter: function () {
        var obj1 = {x: null};
        var obj2 = {x: null};
        var c = connect(obj1, 'x', obj2, 'x',
            {updater: function($proceed, newValue, oldValue) { this.getSourceObj().updaterWasCalled = true },
            converter: function(v) { this.getSourceObj().converterWasCalled = true; return v }});
        obj1.x = 3;
        this.assert(obj1.updaterWasCalled, 'no updater called');
        this.assert(!obj1.converterWasCalled, 'converter called');
    },
        
    test20RemoveAfterUpdateOnlyIfUpdaterProceeds: function() {
            // no proceed, no remove
        var obj1 = {};
        var obj2 = {};
        var c = connect(obj1, 'x', obj2, 'x',
            {updater: function(procced, val) { }, removeAfterUpdate: true});
        obj1.x = 2
        this.assertEquals(null, obj2.x, 'a');
        this.assertEquals(1, obj1.attributeConnections.length, 'connection removed!');
        c.disconnect();

        // proceed triggered then remove
        var c = connect(obj1, 'x', obj2, 'y',
            {updater: function($upd, val) { $upd(val) }, removeAfterUpdate: true});
        obj1.x = 2
        this.assertEquals(2, obj2.y, 'b');
        this.assert(!obj1.attributeConnections || obj1.attributeConnections.length == 0,
            'connection not removed!');
    },

    test21DualUpdate: function() {
            // no proceed, no remove
            var obj1 = {};
            var obj2 = {};
            var obj3 = {};
            var c1 = connect(obj1, 'x', obj2, 'x');
            var c2 = connect(obj1, 'x', obj3, 'x');
            obj1.x = 3;
            
            this.assertEquals(obj2.x, 3, "obj2 update broken");
            this.assertEquals(obj3.x, 3, "obj3 update broken");
            
    },
    test22ConnectTwoMethods: function() {
        var obj1 = {m1: function() { return 3 }};
        var obj2 = {m2: function(val) { return val + 2 }};
        connect(obj1, 'm1', obj2, 'm2');
        var result = obj1.m1();
        this.assertEquals(5, result, 'method connection not working');
    },
    test23ConnectTwoMethodsWithUpdater: function() {
        var obj1 = {m1: function() { return 3 }};
        var obj2 = {m2: function(val) { return val + 2 }};
        connect(obj1, 'm1', obj2, 'm2', {
            updater: function($proceed, val) {
                if (val != 3)
                    throw new Error('updater didnt get the correct value');
                return $proceed(val)
            }});
        var result = obj1.m1();
        this.assertEquals(5, result, 'method connection not working');
    },
    test24ConnectTwoMethodsTwice: function() {
        var obj1 = {m1: function() { return 3 }};
        var obj2 = {m2: function(val) { return val + 2 }};
        connect(obj1, 'm1', obj2, 'm2');
        connect(obj1, 'm1', obj2, 'm2');
        this.assert(Object.isFunction(obj1.m1), 'wrapping failed');
        var result = obj1.m1();
        this.assertEquals(5, result, 'method connection not working');
    },
    test25DoubleConnectTwoMethods: function() {
        var obj1 = {m1: function() { return 3 }},
            obj2 = {m2: function(val) { return val + 2 }},
            obj3 = {m3: function(val) { return val * 2 }},
            m1 = obj1.m1,
            con1 = connect(obj1, 'm1', obj2, 'm2'),
            con2 = connect(obj1, 'm1', obj3, 'm3'),
            result = obj1.m1();

        this.assertEquals(10, result, 'double method connection not working 1');

        con1.disconnect();
        result = obj1.m1();
        this.assertEquals(6, result, 'double method connection not working 2');

        con2.disconnect();
        result = obj1.m1();
        this.assertEquals(3, result, 'double method connection not working 3');


        var connectionsWithSameSourceAttr = obj1.attributeConnections.select(function(con) {
			return this.getSourceAttrName() == con.getSourceAttrName();
		}, this);
        this.assertEquals(connectionsWithSameSourceAttr.length, 0, 'there are others still left')

        this.assertIdentity(m1, obj1.m1, 'original method was not restored after method connection');
    },
    test26TransitiveMethodConnect: function() {
        var obj1 = {m1: function() { return 3 }},
            obj2 = {m2: function(val) { return val + 2 }},
            obj3 = {m3: function(val) { return val * 2 }},
            con1 = connect(obj1, 'm1', obj2, 'm2'),
            con2 = connect(obj2, 'm2', obj3, 'm3');

        var result = obj1.m1();
        this.assertEquals(10, result, 'double method connection not working');

        con1.disconnect();
        this.assertEquals(3, obj1.m1(), 'one method connection not working after disconnect of con1');
        this.assertEquals(6, obj2.m2(1), 'remaining connection not working');

        con2.disconnect();
        this.assertEquals(3, obj2.m2(1), 'after con2 disconnect m2');
        this.assertEquals(2, obj3.m3(1), 'after con2 disconnect m3');
    },
    test27ConnectMethodToArribute: function() {
        var obj1 = {m1: function() { return 3 }}, obj2 = {x: null};
        connect(obj1, 'm1', obj2, 'x');
        var r = obj1.m1();
        this.assertEquals(3, r, 'result not correct');
        this.assertEquals(3, obj2.x, 'connected attribute not set correctly');
    },
    test28TargetAndPropNameMissingKeepsConnectionIntact: function() {
        var obj1 = {x: null}, obj2 = {x: null},
            c = connect(obj1, 'x', obj2, 'x');
        this.assert(!c.isActive, 'conenction is active 1')
        obj1.x = 3;
        this.assertEquals(3, obj2.x, 'connected attribute not set correctly');
        this.assert(!c.isActive, 'conenction is active 2')
        c.targetObj = null;
        obj1.x = 7;
        this.assertEquals(3, obj2.x, 'connected attribute updated although target not set');
        this.assert(!c.isActive, 'conenction is active 3')
    },
    test29ConnectAndDisconnectWhenSourceHasAGetterAndSetter: function() {
        var getCount = 0,
            setCount = 0,
            obj1 = {
                get foo() { getCount++; return this._foo },
                set foo(v) { setCount++; this._foo = v }
            },
            obj2 = {bar: 9};
        // First just see if the getter setter is working
        obj1.foo = 3;
        this.assertEquals(3, obj1.foo);
        this.assertEquals(1, getCount, 'getter strange ' + getCount);
        this.assertEquals(1, setCount, 'setter strange ' + setCount);

        connect(obj1, 'foo', obj2, 'bar');
        obj1.foo = 4;
        this.assertEquals(4, obj1.foo, 'foo not updated');
        this.assertEquals(4, obj2.bar, 'bar not updated');
        // 3 because 1x get for oldValue when setting new value
        this.assertEquals(3, getCount, 'getter strange after simple connect ' + getCount);
        this.assertEquals(2, setCount, 'setter strange after simple connect ' + setCount);
     },
    test30ConnectAndDisconnectScripts: function() {
        var obj = {m1: function() { return 1}.asScript(), m2: function() { return 2 }.asScript()};
        connect(obj, 'm1', obj, 'm2');
        this.assert(2, obj.m1(), 'connect not working');
        disconnect(obj, 'm1', obj, 'm2');
        this.assert(1, obj.m1(), 'disconnect not working 1');
        this.assert(2, obj.m2(), 'disconnect not working 2');
    },
    test31MultipleConnectsShouldReturnIdenticalConnection: function() {
        var obj = {},
            c1 = connect(obj, 'foo', obj, 'barr'),
            c2 = connect(obj, 'foo', obj, 'barr');
        this.assertIdentity(c1, c2, 'connections not identical');
    },
    Xtest32MethodConnectUsesOriginalValue: function() {
        var obj = {
            setX: function(value) { this.x = value },
            setY: function(value) { this.y = value; return 'ERROR' },
            setZ: function(value) { this.z = value },
        };
        connect(obj, 'setX', obj, 'setY');
        connect(obj, 'setX', obj, 'setZ');
        obj.setX('FOO');
        this.assertEquals('FOO', obj.y);
        this.assertEquals('FOO', obj.z);
    },
    test33PassClosureValuesIntoConverterAndUpdater: function() {
        var obj = {}, z = 3;
        connect(obj, 'x', obj, 'y', {
                    converter: function(v) { return z + v }, varMapping: {z: z}});
        obj.x = 5;
        this.assertEquals(8, obj.y);
        connect(obj, 'x', obj, 'y', {
                    updater: function($upd, v) { $upd(z + v) }, varMapping: {z: z}});
        obj.x = 7;
        this.assertEquals(10, obj.y);
    },
    test34SourceAndTargetAreBound: function() {
        var obj1 = {val: 10}, obj2 = {val: 20};
        connect(obj1, 'x', obj2, 'y', {
                    converter: function(v) { return source.val + target.val }});
                obj1.x = 10;
        this.assertEquals(30, obj2.y);
    },
    test35CallWhenPathNotNull: function() {
        var obj = {onBaz: function(value) { this.baz = value }}        
        lively.bindings.callWhenPathNotNull(obj, ['foo', 'bar', 'baz'], obj, "onBaz");
        obj.foo = {};
        obj.foo.bar = {};
        obj.foo.bar.baz = 23;
        this.assertEquals(23, obj.baz);
    },

    test36onConnectHandler: function() {
        var obj1 = {value : 1};
        var obj2 = {stub : 2};
        obj1.onConnect = function(attributeName) {
            if (attributeName === "value") this.value = 33.3;
        };
        connect(obj1, "value", obj2, "stub");
        this.assertEquals(obj1.value, 33.3, "onConnect hook is not working");
    },

    test37onDisconnectHandler: function() {
        var obj1 = {value : 1};
        var obj2 = {stub : 2};
        obj1.onDisconnect = function(attrName, targetObj, targetMethodName) {
            if (targetMethodName === "stub") {
                obj1.value = 33.3;
            }
        };
        connect(obj1, "value", obj2, "stub");
        disconnect(obj1, "value", obj2, "stub");
        this.assertEquals(obj1.value, 33.3, "onDisconnect hook is not working");
    },

    test38MultipleConnectsWithRemoval: function() {
        var obj = {},
            c1 = connect(obj, 'a', obj, 'b', { removeAfterUpdate: true }),
            c2 = connect(obj, 'a', obj, 'c', { removeAfterUpdate: true });
        obj.a = 123;
        this.assertEquals(obj.b, 123, "first connection was not triggered");
        this.assertEquals(obj.c, 123, "second connection was not triggered");
    },
});

TestCase.subclass('lively.bindings.tests.BindingTests.ConnectionSerializationTest', {

    setUp: function($super) {
        $super();
        this.worldMorph = new lively.morphic.World();
        this.worldMorph.addHandMorph();
    },
        
    createAndAddMorphs: function() {
        this.textMorph1 = new lively.morphic.Text(new Rectangle(20,400, 100, 30), 'abc');
        this.textMorph2 = new lively.morphic.Text(new Rectangle(20,400, 100, 30), 'xyz');
        this.worldMorph.addMorph(this.textMorph1);
        this.worldMorph.addMorph(this.textMorph2);
    },

    doSave: function() {
        var stored = lively.persistence.Serializer.serialize(this.worldMorph), // WorldMorph is test specific
            newWorld = lively.persistence.Serializer.deserialize(stored);
        this.worldMorph = newWorld;
        this.newTextMorph1 = newWorld.submorphs[0];
        this.newTextMorph2 = newWorld.submorphs[1];
    },

    test01HelperAttributeIsNotSerialized: function() {
        this.createAndAddMorphs();

        connect(this.textMorph1, 'textString', this.textMorph2, 'textString');
        this.textMorph1.setTextString('foo');
        this.assertEquals(this.textMorph1.textString, this.textMorph2.textString, 'connect not working');

        this.doSave();

        this.assertEquals(this.newTextMorph1.textString, 'foo', 'morph serialization problem');
        this.newTextMorph1.setTextString('bar');
        this.assertEquals(this.newTextMorph1.textString, this.newTextMorph2.textString, 'connect not working after deserialization');
        // ensure that serialization has cleaned up
        var c = this.newTextMorph1.attributeConnections[0];
        var setter1 = c.__lookupSetter__('sourceObj');
        var setter2 = c.__lookupSetter__('targetObj');
        this.assert(!setter1, 'serialization cleanup failure 1');
        this.assert(!setter2, 'serialization cleanup failure 2');
    },
    
    test02ConverterIsSerialzed: function() {
        this.createAndAddMorphs();

        connect(this.textMorph1, 'textString', this.textMorph2, 'textString', {converter: function(v) { return v + 'foo' }});
        this.textMorph1.setTextString('foo');
        this.assertEquals('foofoo', this.textMorph2.textString, 'connect not working');

        this.doSave();

        this.assertEquals(this.newTextMorph1.textString, 'foo', 'morph serialization problem');
        this.newTextMorph1.setTextString('bar');
        this.assertEquals('barfoo', this.newTextMorph2.textString, 'connect not working after deserialization');
    },
    
    test03UpdaterIsSerialzed: function() {
        this.createAndAddMorphs();

        connect(this.textMorph1, 'textString', this.textMorph2, 'textString',
            {updater: function(proceed, newV, oldV) { proceed(oldV + newV) }});
        this.textMorph1.setTextString('foo');
        this.assertEquals('abcfoo', this.textMorph2.textString, 'updater not working');

        this.doSave();

        this.assertEquals(this.newTextMorph1.textString, 'foo', 'morph serialization problem');
        this.newTextMorph1.setTextString('bar');
        this.assertEquals('foobar', this.newTextMorph2.textString, 'connect not working after deserialization');
    },
    xtest04DOMNodeIsSerialized: function() {
        this.createAndAddMorphs();
        var node = XHTMLNS.create('input');
        this.worldMorph.rawNode.appendChild(node);
        connect(this.textMorph1, 'textString', node, 'value')
        this.textMorph1.setTextString('test');
        this.assertEquals('test', node.value, 'node connection not working');
        this.doSave();
        // this.assert(node.getAttribute('id'), 'node hasnt gotten any id assigned');
        var nodeAfter = this.worldMorph.rawNode.getElementsByTagName('input')[0];
        this.assert(nodeAfter, 'cannot find node in DOM')
        this.newTextMorph1.setTextString('test2');
        this.assertEquals('test2', nodeAfter.value, 'connect not working after deserialization');
    },
    test05MethodToMethodConnectionIsSerialized: function() {
        this.createAndAddMorphs();

        connect(this.textMorph1, 'getTextString', this.textMorph2, 'setTextString');
        this.textMorph1.setTextString('foo');
        this.textMorph1.getTextString(); // invoke connection
        this.assertEquals('foo', this.textMorph1.textString, 'connect not working 1');
        this.assertEquals('foo', this.textMorph2.textString, 'connect not working 2');

        this.doSave();

        this.newTextMorph1.setTextString('bar');
        this.newTextMorph1. getTextString(); // invoke connection
        this.assertEquals('bar', this.newTextMorph1.textString, 'connect not working after deserialize 1');
        this.assertEquals('bar', this.newTextMorph2.textString, 'connect not working after deserialize 2');
    },
    test06ScriptToScriptConnectionIsSerialized: function() {
        this.createAndAddMorphs();

        this.textMorph1.addScript(function someScript1() { return 1 });
        this.textMorph2.addScript(function someScript2() { return 2 });

        connect(this.textMorph1, 'someScript1', this.textMorph2, 'someScript2');

        this.assertEquals(2, this.textMorph1.someScript1(), 'connect not working')
        this.doSave();

        this.assert(this.newTextMorph1.someScript1, 'script of source was not serialized');
        this.assertEquals(2, this.newTextMorph1.someScript1(), 'connect not working after deserialization');
    },
});
Object.subclass('lively.bindings.tests.BindingTests.BindingsProfiler', {

    connectCount: 20000,

    startAndShow: function() {
        lively.bindings.connect(this, 'result', lively.morphic.World.current(), 'addTextWindow');
        this.start()
    },

    start: function() {
        var runPrefix = 'run';
        var self = this;
        var methods = Functions.all(this).select(function(name) { return name.startsWith(runPrefix) });
        var result = 'Bindings profiling ' + new Date() + '\n' + navigator.userAgent;
        var progressBar = lively.morphic.World.current().addProgressBar();
        methods.forEachShowingProgress(progressBar, function(name) {
            var time = self[name]();
            name = name.substring(runPrefix.length, name.length);
            result += '\n' + name + ':\t' + time;
        },
        function(name) { return 'running ' + name },
        function(name) { progressBar.remove(); self.result = result });
        return this
    },

    connectAndRun: function(target, targetProp, options) {
        var source = {x: null};
        var sourceProp = 'x';
        lively.bindings.connect(source, sourceProp, target, targetProp, options);

        var now = new Date();
        for (var i = 0; i < this.connectCount; i++) source.x = i
        return new Date() - now;
    },

    runSimpleConnect: function() { return this.connectAndRun({y: null}, 'y') },
    runMethodConnect: function() { return this.connectAndRun({m: function(v) { this.x = v }}, 'm') },

    runConverterConnectAttribute: function() {
        return this.connectAndRun({m: function(v) { this.x = v }}, 'm',
            {converter: function(v) { return v + 1 }});
    },

    runConverterConnectMethod: function() {
        return this.connectAndRun({y: null}, 'y', 
            {converter: function(v) { return v + 1 }});
    },

    runUpdaterConnectAttribute: function() {
        return this.connectAndRun({y: null}, 'y',
            {updater: function(upd, newV, oldV) { upd.call(this, newV, oldV) }});
    },

    runUpdaterConnectMethod: function() {
        return this.connectAndRun({m: function(v1, v2) { this.x = v1++ }}, 'm',
            {updater: function(upd, newV, oldV) { upd.call(this, newV + oldV, oldV) }});
    },

    runTextMorphConnect: function() {
        var source = new lively.morphic.Text(new Rectangle(0,0, 100, 100), '');
        var sourceProp = 'textString';
        var target = new lively.morphic.Text(new Rectangle(0,0, 100, 100), '');
        var targetProp = 'setTextString'
        lively.bindings.connect(source, sourceProp, target, targetProp);

        var now = new Date();
        for (var i = 0; i < (this.connectCount / 10); i++) source.textString = i.toString()
        return new Date() - now;
    },

    runCreateConnection: function() {
        var now = new Date()
        var source = {x: null}, target = {y: null};
        for (var i = 0; i < this.connectCount; i++)
            lively.bindings.connect(source, 'x', target, 'y');
        return new Date() - now
    },
    runSimpleMethodCall: function() {
        var now = new Date()
        var source = {m: function(v) { source.x = v; target.m(v) }}, target = {m: function(v) { target.x = v }};
        for (var i = 0; i < this.connectCount*10; i++)
            source.m(i);
        return new Date() - now
    },

});

TestCase.subclass('lively.bindings.tests.BindingTests.BindingsDuplicateTest', {

    setUp: function() {
        this.sut = lively.morphic.Morph.makeRectangle(100,100,100,50);
        this.sut.text = new lively.morphic.Text(new Rectangle(0,0,100,20));
        this.sut.addMorph(this.sut.text);

        connect(this.sut, '_Position', this.sut.text, 'textString', {
            converter: function(pos) { return String(pos) }}).update(pt(0,0));

        connect(this.sut, '_Position', this.sut.text, 'setFill', {
            converter: function(pos) { return Color.red },
            updater: function($proceed, newVal, oldVal) {
                if (newVal.x > 200) $proceed(newVal, oldVal)}
            }).update(pt(0,0));
    },

    testBindingWorks: function() {
        var p = pt(50,50);
        this.sut.setPosition(p);
        this.assertEquals(this.sut.text.textString, String(p))
    },

    testDuplicateBinding: function() {
        var p = pt(50,50);
        copy = this.sut.duplicate();
        this.assertEquals(copy.attributeConnections.length, this.sut.attributeConnections.length,
                 " number of attributes connections is broken");
        this.assert(copy.attributeConnections[1].getTargetObj(), "no source object in copy");
        this.assert(copy.attributeConnections[1].getTargetObj(), "no taget object in copy");
        this.assert(copy.text !== this.sut.text, "text object did not change");
        
        this.assertIdentity(copy.attributeConnections[1].getTargetObj(), copy.text,"no taget object in copy");
        copy.setPosition(p);
        this.assertEquals(copy.text.textString, String(p))
    },

    testAttributeConnectionsAreDuplicated: function() {
        var copy = this.sut.duplicate();
        this.assert(this.sut.attributeConnections, "original has no connections");
        this.assert(copy.attributeConnections, "copy has no connections");
        this.assert(copy.attributeConnections !== this.sut.attributeConnections, "cconnections are not copied");
    },

    testCopyHasObservers: function() {
        this.assert(this.sut.__lookupGetter__('_Position'), "original as no observer")
        var copy = this.sut.duplicate();
        this.assert(copy.__lookupGetter__('_Position'), "copy as no observer")

    },

    testUpdaterIsCopied: function() {
        this.assert(this.sut.attributeConnections[1].getUpdater(), "no update in fillConnection");
        var copy = this.sut.duplicate();
        this.assert(copy.attributeConnections[1].getUpdater(), "no update in fillConnection copy");
    },
    
    testCopyPlainObjects: function() {
        var o1 = {x: null};
        var o2 = {y: null};
        var sut = lively.bindings.connect(o1, 'x', o2, 'y');
        
        this.assert(this.sut.attributeConnections[1].getUpdater(), "no update in fillConnection");
        var copy = this.sut.duplicate();
        this.assert(copy.attributeConnections[1].getUpdater(), "no update in fillConnection copy");
    },

});
TestCase.subclass('lively.bindings.tests.BindingTests.PlugTest',
'running', {
    setUp: function($super) {
        $super();
        this.morph = lively.morphic.Morph.makeRectangle(new Rectangle(0,0, 100, 100));
    },
},
'testing', {
    test01PlugMorphToModel: function() {
        var morph = this.morph, model = {
            positionMorph: function(pos) { return pos },
            someProperty: 3,
        };
        morph.someProperty = null;
        morph.plugTo(model, {
            setPosition: "<-positionMorph",
            _Rotation: "->rotationOfMorph",
            someProperty: {dir: '<->', name: 'someProperty', options: {converter: function(x) { return x+1 }}},
        });
        this.assertEquals(pt(0,0), morph.getPosition(), 'initial pos')
        this.assertEquals(null, model.rotationOfMorph, 'initial rotationOfMorph')
        this.assertEquals(null, morph.someProperty, 'initial someProperty')

        model.someProperty = 5;
        this.assertEquals(6, morph.someProperty, 'some property set by model')
        morph.someProperty = 6;
        this.assertEquals(7, model.someProperty, 'some property set by morph')

        morph.setRotation(0.1);
        this.assertEquals(0.1, model.rotationOfMorph, 'rotationOfMorph')

        model.positionMorph(pt(10,10));
        this.assertEquals(pt(10,10), morph.getPosition(), 'positionOfMorph')
    },
});
TestCase.subclass('lively.bindings.tests.BindingTests.ConnectionJSONSerializationTest', {

    test01ObjConnectedToMethodDeserialization: function() {
        var obj1 = {m: function m(arg) { this.b = arg }.asScript()},
            obj2 = {a: 5, ref: obj1};
        connect(obj2, 'a', obj1, 'm')
        obj2.a = 12;
        this.assertEquals(12, obj2.ref.b, 'connection not working');
        var jso = lively.persistence.Serializer.serialize(obj2),
            newObj2 = lively.persistence.Serializer.deserialize(jso);
        newObj2.a = 23;
        this.assertEquals(23, newObj2.ref.b, 'connection not working after deserialization');
    },


});


}); // end of module
