module('lively.persistence.tests.TraitPersistenceTests').requires('lively.persistence.Serializer', 'lively.tests.TraitTests').toRun(function() {


lively.tests.TraitsTests.BaseTest.subclass('lively.persistence.tests.TraitPersistenceTests.SerializeObjectsTest',
'running', {
    setUp: function($super) {
        $super();
        this.serializer = ObjectGraphLinearizer.forNewLively();
    },
    // createAndAddDummyPlugin: function() {
    //     var plugin = new ObjectLinearizerPlugin();
    //     this.serializer.addPlugin(plugin);
    //     return plugin;
    // },
    serializeAndDeserialize: function(obj) {
        return this.serializer.deserialize(this.serializer.serialize(obj))
    }
},
'testing', {

    test01SerializedObjectRemembersTrait: function() {
        this.removeTraitAfterwards('Foo');
        var obj = {};
        Global.halt = true;
        Trait('Foo', { foo: function() { return 2 } }).applyToObject(obj);

        this.assertEquals(2, obj.foo(), 'setup not working');
        var copy = this.serializeAndDeserialize(obj);
        this.assert(Object.isFunction(copy.foo), 'trait method not in copy');
        this.assertEquals(2, copy.foo(), 'trait method not working');
    }

});

}) // end of module