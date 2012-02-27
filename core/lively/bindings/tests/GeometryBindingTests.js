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
    test05TransformConnectionsTheGarbageOut: function() {

        var parent =lively.morphic.Morph.makeRectangle(0,0, 100, 100); 
        parent.setPosition(pt(10,10))

        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {transformationChange: function(source) { this.source = source }};

        parent.addMorph(morph)
        morph.setPosition(pt(50,50));

        var numberOfOldConnections = (parent.attributeConnections || []).length;
        var c =  lively.bindings.connect(morph, 'globalTransform', observer, 'transformationChange');

        this.assert((parent.attributeConnections || []).length > numberOfOldConnections, 
            "no new connections?")
        morph.remove();
        this.assertEquals((parent.attributeConnections || []).length, 
            numberOfOldConnections, "garbage is still there")        
    },
    test06ConnectToGlobalPositionOfAMorph: function() {
        var parent =lively.morphic.Morph.makeRectangle(0,0, 100, 100); 
        parent.setPosition(pt(10,10))

        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {transformationChange: function(source) { this.source = source }};
        parent.addMorph(morph)
        morph.setPosition(pt(50,50));

        var c =  lively.bindings.connect(morph, 'globalTransform', observer, 'transformationChange');

        parent.setPosition(pt(20,20));

        this.assert(observer.source);
            
    },

    test07DuplicateMorphsWithTransformConnections: function() {
        var parent =lively.morphic.Morph.makeRectangle(0,0, 100, 100); 
        parent.setPosition(pt(10,10))

        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            observer = {transformationChange: function(source) { this.source = source }};
        parent.addMorph(morph)

        var c =  lively.bindings.connect(morph, 'globalTransform', 
            observer, 'transformationChange');

        var numberOfOldConnections = morph.attributeConnections.length;

        var morph2 = morph.copy();

        this.assert(morph2.attributeConnections.length = numberOfOldConnections)

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
        this.assertEquals(0, morph.attributeConnections.length, 'attributeConnections not empty');
    },

});


}) // end of module
