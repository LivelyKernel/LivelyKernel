module('lively.tests.ObjectVersioningTests').requires('lively.TestFramework', 'lively.ObjectVersioning').toRun(function() {
    
TestCase.subclass('lively.tests.ObjectVersioningTests.PropertyProxyTest',
'testing', {
    setUp: function() {
        // global reset on each test for now
        lively.ObjectVersioning.reset();
    },
    test01VersionedObjectPropertyRetrievable: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.versionedProperty = 14;
        this.assertEquals(versionedObject.versionedProperty, 14);
    },
    test02VersionedObjectPropertyCanBeOverwritten: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.versionedProperty = 1;
        versionedObject.versionedProperty = 2;
        versionedObject.versionedProperty = 3;
        this.assertEquals(versionedObject.versionedProperty, 3);
    },
    test03ChangesToPropertyOfVersionedObjectCanBeUndone: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.versionedProperty = 1;
        versionedObject.versionedProperty = 2;
        lively.ObjectVersioning.undo();
        this.assertEquals(versionedObject.versionedProperty, 1);
    },
    test04ChangesThatCreateAPropertyOfAVersionedObjectCanBeUndone: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.misplacedProperty = 1;
        lively.ObjectVersioning.undo();
        this.assert(true, versionedObject.misplacedProperty === undefined);
    },
    test05UndoneChangesToVersionedObjectCanBeRedone: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.versionedProperty = 'eins';
        versionedObject.versionedProperty = 'zwei';
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        this.assertEquals(versionedObject.versionedProperty, 'zwei');
    },
    test06UndonePropertyAdditionCanBeReadded: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.firstProperty = 'eins';
        versionedObject.secondProperty = 'zwei';
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.undo();
        lively.ObjectVersioning.redo();
        this.assertEquals(versionedObject.firstProperty, 'eins');
    },
    test07VersionedObjectWithVersionedObjectAsProperty: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.position = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.position.x = 13;
        versionedObject.position.y = 25;
        versionedObject.position.x = 0;
        versionedObject.position.y = 0;
        this.assertEquals(versionedObject.position.x, 0);
        this.assertEquals(versionedObject.position.y, 0);
    },
    test08ChangesToVersionedPropertyObjectCanBeUndone: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.versionedProperty = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.versionedProperty.versionedProperty = Color.red;
        versionedObject.versionedProperty.versionedProperty = Color.green;
        lively.ObjectVersioning.undo();
        this.assertEquals(versionedObject.versionedProperty.versionedProperty, Color.red);
    },
    test09ReferencesCanBeSharedAmongVersionedObjects: function() {
        var versionedObject = lively.ObjectVersioning.versioningProxyFor({}),
            anotherVersionedObject = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.shared = lively.ObjectVersioning.versioningProxyFor({});
        versionedObject.shared.color = Color.red;
        
        anotherVersionedObject.shared = versionedObject.shared;
        anotherVersionedObject.shared.color = Color.green;
        
        this.assertEquals(versionedObject.shared.color, Color.green);
    }
    // test09VersionedObjectHasItsProperties: function() {
    //     var versionedObject = lively.ObjectVersioning.versioningProxyFor({});
    //     versionedObject.firstProperty = 'erstesMerkmal';
    //     this.assertEquals(true, 'firstProperty' in versionedObject);
    // }
});
    
});