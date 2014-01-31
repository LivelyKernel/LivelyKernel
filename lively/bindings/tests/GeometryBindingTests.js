module('lively.bindings.tests.GeometryBindingTests').requires('lively.morphic.tests.Morphic', 'lively.bindings.GeometryBindings').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.bindings.tests.GeometryBindingTests.GeometryBindingTest',
'testing', {
    test01ConnectToExtentOfAMorph: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {extentChanged: function(ext) { this.extent = ext }};
        lively.bindings.connect(morph, 'extent', observer, 'extentChanged');
        morph.setExtent(pt(50,50));
        this.assertEquals(pt(50,50), observer.extent);
    },
    test01aConnectExtentWithConverter: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {extentChanged: function(val) { this.val = val }},
            c = lively.bindings.connect(morph, 'extent', observer, 'extentChanged', {
                converter: function(ext) { return ext.x }});
        morph.setExtent(pt(50,50));
        this.assertEquals(50, observer.val);
        c.setConverter(function(ext) { return ext.x * 2 })
        morph.setExtent(pt(50,50));
        this.assertEquals(100, observer.val);
    },
    test02ConnectToExtentOfAWithExplicitConnectionMorph: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {extentChanged: function(ext) { this.extent = ext }};
        new lively.morphic.GeometryConnection(morph, 'extent', observer, 'extentChanged').connect();
        morph.setExtent(pt(50,50));
        this.assertEquals(pt(50,50), observer.extent);
    },
    test03MorphHasConnectionPoints: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20);

        var cPoint = morph.connections['extent'];
        this.assert(cPoint.map);
    },
    test04ConnectToPositionOfAMorph: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {positionChanged: function(pos) { this.position = pos }};
        lively.bindings.connect(morph, 'position', observer, 'positionChanged');
        morph.setPosition(pt(50,50));
        this.assertEquals(pt(50,50), observer.position);
    },

    test05TransformConnectionsCleanup: function() {
        var parent = lively.morphic.Morph.makeRectangle(10,10, 100, 100),
            morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {changed: function(source) { this.source = source }};

        parent.addMorph(morph);
        morph.setPosition(pt(50,50));

        this.assert(!parent.attributeConnections, "setup strange, parent has connections");
        var c = lively.bindings.connect(morph, 'globalTransform', observer, 'changed');
        this.assert(parent.attributeConnections.length > 0, "no new connections?");
        morph.remove();
        this.assert(!parent.attributeConnections, "garbage connections still in owner");
        c.disconnect();
        this.assert(!morph.attributeConnections,
                    "connections still in morph: " + morph.attributeConnections);
    },

    test06ConnectToGlobalPositionOfAMorph: function() {
        var parent =lively.morphic.Morph.makeRectangle(0,0, 100, 100);
        parent.setPosition(pt(10,10))

        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {transformationChange: function(source) { this.source = source }};
        parent.addMorph(morph)
        morph.setPosition(pt(50,50));

        var c = lively.bindings.connect(morph, 'globalTransform', observer, 'transformationChange');

        parent.setPosition(pt(20,20));

        this.assertEquals("translate(70px,70px)", observer.source.toString());
    },

    test07DuplicateMorphsWithTransformConnections: function() {
        var parent = lively.morphic.Morph.makeRectangle(10,10, 100, 100),
            morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {changed: function(source) { this.source = source }};
        parent.addMorph(morph);

        var c = lively.bindings.connect(morph, 'globalTransform', observer, 'changed'),
            numberOfOldConnections = morph.attributeConnections.length,
            morph2 = morph.copy();

        this.assertEquals(numberOfOldConnections, morph2.attributeConnections.length);

    },

    test08removeSourceObjGetterAndSetter: function() {
        var obj1 = {a: 3}, obj2 = {b: 3};
        var c = connect(obj1, 'a', obj2, 'b');

        this.assert(obj1['$$a'], 'no alternative prop');

        c.removeSourceObjGetterAndSetter()

        this.assert(!obj1['$$a'], 'alternative prop is still there');

        this.assertEquals(obj1.a, 3, " old prop not there" );

        c.removeSourceObjGetterAndSetter()
        this.assertEquals(obj1.a, 3, " prop is deleted" );

    },
    test09DisconnectFromPositionOfAMorph: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {setPos: function(pos) { this.pos = pos }},
            c = lively.bindings.connect(morph, 'position', observer, 'setPos');
        morph.setPosition(pt(50,50));
        this.assertEquals(pt(50,50), observer.pos, 'setup not working');
        c.disconnect();
        morph.setPosition(pt(60,60));
        this.assertEquals(pt(50,50), observer.pos, 'not disconnected');
        this.assert(!morph.attributeConnections, 'attributeConnections not empty');
    },

    test10UpdateOnConnectViaConnectionsSpec: function() {
        var obj = {x: 23, connections: {x: {updateOnConnect: true}}};
        lively.bindings.connect(obj, 'x', obj, 'y');
        this.assertEquals(obj.y, 23, "not updated in connect");
    }

});

lively.morphic.tests.MorphTests.subclass('lively.bindings.tests.GeometryBindingTests.AllOwners',
'testing', {
    test01OwnersConnect: function() {
        var m1 = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            m2 = lively.morphic.Morph.makeRectangle(5,5, 10, 10),
            owners = [],
            observer = {ownersChanged: function(newOwners) { owners = newOwners }},
            connection = lively.bindings.connect(m2, 'owners', observer, 'ownersChanged');

        this.world.addMorph(m1);
        this.assertEqualState([], owners, '1');
        this.assert(!m1.attributeConnections, '1');

        m1.addMorph(m2);
        this.assertEqualState([m1, this.world], owners, '2');
        this.assertEquals(1, m1.attributeConnections.length, '2');

        m1.remove();
        this.assertEqualState([m1], owners, '3');
        this.assertEquals(1, m1.attributeConnections.length, '3');

        this.world.addMorph(m2);
        this.assertEqualState([this.world], owners, '4');
        this.assert(!m1.attributeConnections, '4 m1 attributeConnections not removed');

        connection.disconnect();
        this.assert(!m2.attributeConnections, '5 m2 attributeConnections not removed');
    }
});


}) // end of module
