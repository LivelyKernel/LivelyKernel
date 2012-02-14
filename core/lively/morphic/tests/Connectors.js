module('lively.morphic.tests.Connectors').requires('lively.morphic.tests.Morphic', 'lively.morphic.Connectors').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ConnectorTest',
'assertion', {
    assertMorphIsDisconnectedFromConnector: function(morph, connector, idxOfControlPoint) {
        var ctrlPt = connector.getControlPoints()[idxOfControlPoint],
            prevCtrlPtPos = ctrlPt.getGlobalPos(),
            morphStartPos = morph.getPosition();
        try { 
            morph.moveBy(pt(10,10))
            var currentCtrlPtPos = ctrlPt.getGlobalPos();
            this.assertEquals(prevCtrlPtPos, currentCtrlPtPos, 'when morph moved connector moved also');
            this.assertEquals(0, morph.attributeConnections.length, "morph has attributeConnections");

            this.assert(!ctrlPt.connectedMagnet, 'control point still has a magnet')
        } finally {
            morph.setPosition(morphStartPos);
        }
    },
    assertConnectorMovesWithMorph: function(morph, connector, idxOfControlPoint) {
        var ctrlPt = connector.getControlPoints()[idxOfControlPoint],
            prevCtrlPtPos = ctrlPt.getGlobalPos(),
            morphStartPos = morph.getPosition();
        try { 
            morph.moveBy(pt(10,10))
            var currentCtrlPtPos = ctrlPt.getGlobalPos();
            this.assertEquals(prevCtrlPtPos.addXY(10,10), currentCtrlPtPos, 'morph did not move with connection')
            this.assert(ctrlPt.connectedMagnet, 'control point has no magnet')
        } finally {
            morph.setPosition(morphStartPos);
        }
    },

},
'testing', {
    test01getMagnets: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20);
        var magnet = morph.getMagnets()[0];
        this.assert(magnet instanceof lively.morphic.Magnet, "no magnet");
    },
    test02ConnectVertexControlPointToMorphMagnet: function() {
        var morph = lively.morphic.Morph.makeRectangle(0,0, 20, 20);
        morph.setPosition(pt(100,100))
        var magnet = morph.getMagnets()[0];   
        this.world.addMorph(morph);

        var line =  new lively.morphic.Path([pt(0,0), pt(20,100)])
        this.world.addMorph(line);

        var cp = line.getControlPoints()[0];    
        cp.setConnectedMagnet(magnet);

        this.assertIdentity(cp.getConnectedMagnet(), magnet)
        this.assertIdentity(magnet.getConnectedControlPoints()[0], cp);
        
        this.assertEquals(cp.getGlobalPos(), magnet.getGlobalPosition(), "cp did not move");
        
    },
    test03MoveMorphMovesControlPointOfConnector: function() {
        var morph = lively.morphic.Morph.makeRectangle(100,100, 20, 20),
            magnet = morph.getMagnets()[0];   
        this.world.addMorph(morph);

        var line = new lively.morphic.Path([pt(0,0), pt(20,100)])
        this.world.addMorph(line);

        var cp = line.getControlPoints()[0];
        cp.setConnectedMagnet(magnet);

        morph.moveBy(pt(10,10));
        
        this.assertEquals(cp.getGlobalPos(), magnet.getGlobalPosition(), "cp did not move");

        var owner = lively.morphic.Morph.makeRectangle(50,50, 50, 50);
        owner.addMorph(morph);
        this.world.addMorph(owner);
        owner.moveBy(pt(10,10));

        this.assertEquals(cp.getGlobalPos(), magnet.getGlobalPosition(), "cp when owner moveed did not move");
    },
    test04Disconnect: function() {
        var morph = lively.morphic.Morph.makeRectangle(100,100, 20, 20),
            magnet = morph.getMagnets()[0];   
        this.world.addMorph(morph);

        var line = new lively.morphic.Path([pt(0,0), pt(20,100)])
        this.world.addMorph(line);

        var cp = line.getControlPoints()[0];
        cp.setConnectedMagnet(magnet);
        cp.setConnectedMagnet(null);

        morph.moveBy(pt(10,10))
        this.assertMorphIsDisconnectedFromConnector(morph, line, 0)
    },
    test05InterfaceForVisualConnect: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            morph2 = lively.morphic.Morph.makeRectangle(100,100, 20, 20);
        this.world.addMorph(morph1);
        this.world.addMorph(morph2);

        var connector = morph1.createConnectorTo(morph2);
        this.assertConnectorMovesWithMorph(morph1, connector, 0);
        this.assertConnectorMovesWithMorph(morph2, connector, 1);
    },
    test06InterfaceForVisualDisconnect: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            morph2 = lively.morphic.Morph.makeRectangle(100,100, 20, 20);
        this.world.addMorph(morph1);
        this.world.addMorph(morph2);

        // move the first morph
        var connector = morph1.createConnectorTo(morph2);
        connector.disconnectFromMagnets();

        this.assertMorphIsDisconnectedFromConnector(morph1, connector, 0);
        this.assertMorphIsDisconnectedFromConnector(morph2, connector, 1);
    },
    test07ConnectionBuilderTest: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            morph2 = lively.morphic.Morph.makeRectangle(100,100, 20, 20),
            connectionBuilder = morph1.getVisualBindingsBuilderFor('name');

        var openMenuWasCalledFor = null;
        connectionBuilder.openConnectToMenu = function(morph) { openMenuWasCalledFor = morph };
        this.assertEquals('name', connectionBuilder.label.textString);
        this.world.hands[0].grabMorph(connectionBuilder);
        this.world.hands[0].dropContentsOn(morph2, {stop: Functions.Null});

        this.assert(!morph2.submorphs.include(connectionBuilder), 'connection builder still there');
        this.assertIdentity(morph2, openMenuWasCalledFor, 'openMenu not working');
    },
    test08MagnetSetNearestMagnetToControlPoint: function() {

        
        var morph1 = lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            morph2 = lively.morphic.Morph.makeRectangle(100,100, 20, 20);
        
        this.world.addMorph(morph1);
        this.world.addMorph(morph2);

        var magnetSet = new lively.morphic.MagnetSet(this.world)        
        this.assert(magnetSet.magnets.length >= 2)
        var line =  new lively.morphic.Path([pt(0,0), pt(100,100)]);
        

        var nearest = magnetSet.nearestMagnetsToControlPoint(line.getControlPoints()[1]);    
        this.assertEquals(nearest.length, 1, "what points else")
        this.assertIdentity(nearest[0].morph, morph2, "wrong morph")
    },
});

lively.morphic.tests.ConnectorTest.subclass('lively.morphic.tests.VisualBindingsTest',
'testing', {
    test01ConnectMorphNameToText: function() {
        var morph = new lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            text = new lively.morphic.Text(new Rectangle(100,0,100,20), '');
        this.world.addMorph(morph);
        this.world.addMorph(text);

        var con = lively.bindings.visualConnect(morph, 'name', text, 'textString');

        morph.setName('Foo');
        this.assertEquals('Foo', text.textString);
        
        this.assertConnectorMovesWithMorph(morph, con.getVisualConnector(), 0);
        this.assertConnectorMovesWithMorph(text, con.getVisualConnector(), 1);
    },
    test02GetListOfConnectionPoints: function() {
        var text = new lively.morphic.Text(new Rectangle(100,0,100,20), '');

        var cPoints = text.getConnectionPoints();

        this.assert(Properties.own(cPoints).include('name'), 'name not in there')
        this.assert(Properties.own(cPoints).include('textString'), 'textString not in there')
    },
    test03GetListOfTargetConnectionPoints: function() {
        var text = new lively.morphic.Text(new Rectangle(100,0,100,20), '');

        var cPoints = text.getTargetConnectionPoints();

        this.assert(Properties.own(cPoints).include('textString'), 'textString not in there')
    },
    test04DisconnectMorphNameToText: function() {
        var morph = new lively.morphic.Morph.makeRectangle(0,0, 20, 20),
            text = new lively.morphic.Text(new Rectangle(100,0,100,20), '');
        this.world.addMorph(morph);
        this.world.addMorph(text);

        var con = lively.bindings.visualConnect(morph, 'name', text, 'textString');
        con.visualDisconnect();

        morph.setName('Foo');
        this.assert('Foo' != text.textString, 'logical connection not disconnected');
        this.assertMorphIsDisconnectedFromConnector(morph, con.getVisualConnector(), 0)
    },

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MagnetTest',
'testing', {
    test01getGlobalPosition: function() {
        var morph = lively.morphic.Morph.makeRectangle(5,5, 20, 20);
        this.world.addMorph(morph)
        var magnet = new lively.morphic.Magnet(morph, pt(10,10));
        this.assertEquals(magnet.getPosition(), pt(10,10), "wrong position")
        this.assertEquals(magnet.getGlobalPosition(), pt(15,15), "wrong global position")
    },
    test02CachedGlobalPosition: function() {
        var morph = lively.morphic.Morph.makeRectangle(5,5, 20, 20);
        this.world.addMorph(morph)
        var magnet = new lively.morphic.Magnet(morph, pt(10,10));
        this.assert(magnet.getGlobalPosition(), magnet.getCachedGlobalPosition(), "cache");
        magnet.resetCachedGlobalPosition()
        this.assert(!magnet.cachedGlobalPosition, "cache is empty");
    },
    test03MagnetSet: function() {
        var magnetSet = new lively.morphic.MagnetSet()        
        var morph1 = lively.morphic.Morph.makeRectangle(5,5, 20, 20);
        this.world.addMorph(morph1)


        var morph2 = lively.morphic.Morph.makeRectangle(50,50, 20, 20);
        this.world.addMorph(morph2)

        magnetSet.gatherMagnetsIn(this.world);

        this.assertIdentity(magnetSet.nearestMagnetsTo(pt(5,5))[0].morph, morph1, "first wrong")
        this.assertIdentity(magnetSet.nearestMagnetsTo(pt(50,50))[0].morph, morph2, 'second wrong')
    },
    test04RelativeMagnet: function() {
        var morph1 = lively.morphic.Morph.makeRectangle(5,5, 20, 20);

        var relativeMagnet = new lively.morphic.RelativeMagnet(morph1, pt(0,0));

        relativeMagnet.setPosition(pt(10,10));
        morph1.setExtent(pt(40,40))
        this.assertEquals(relativeMagnet.getPosition(), pt(20,20))
    },






});

}) // end of module