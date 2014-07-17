module('lively.persistence.tests.Entanglement').requires('lively.persistence.Entanglement', 'lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.persistence.tests.Entanglement.Morphic',
'testing', {
        test01CreateEntangledMorph: function() {
        // Specs can generate entangled Morphs that are synchronized to the spec
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.foo = 23;
        var entangled = m.buildSpec().createEntanglement().createEntangledMorph();
        
        this.assertEquals(lively.morphic.Box, entangled.constructor);
        this.assertEquals(23, entangled.foo);
        this.assertEquals(lively.rect(0,0,100,100), entangled.bounds());
    },

    test02EntanglementPropagatesAmongMorphs: function() {
        // 2 morphs entangled with the same spec are effectively hold in sync
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.foo = 42;
        m.bar = true;
        var entanglement = lively.persistence.Entanglement.Morph.fromMorph(m);
        
        var m1 = entanglement.createEntangledMorph();
        var m2 = entanglement.createEntangledMorph();
        
        m1.foo = 0;
        m2.bar = false;
        
        entanglement.update();
        
        this.assertEquals(m1.foo, m2.foo);
        this.assertEquals(m1.bar, m2.bar);
        this.assertEquals(entanglement.get('foo'), 0);
        this.assertEquals(entanglement.get('bar'), false);
        
    },
    test03EntanglesAlsoDefaultProperties: function() {
        // enter comment here
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var spec = new lively.morphic.Box(lively.rect(0,0,100,100)).buildSpec();
        var entanglement = lively.persistence.Entanglement.Morph.fromSpec(spec);
        
        entanglement.entangleWith(m);
        entanglement.set('_Fill', Color.red);
        this.assertEquals(m.getFill(), Color.red);
        m.setFill(Color.green);
        entanglement.update();
        this.assertEquals(m.getFill(), Color.green);
        this.assertEquals(entanglement.get('_Fill'), Color.green);
    },
    test04ExcludesPropertiesFromEntanglement: function() {
        // a user can define which properties to sync and which one not to sync
        // when a entangled morph is created
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.foo = 42;
        m.bar = 'Meaning of Life';
        var entanglement = lively.persistence.Entanglement.Morph.fromMorph(m);
        var m0 = entanglement.createEntangledMorph(); //baseline
        var m1 = entanglement.createEntangledMorph({excludes: ['foo', 'setPosition']});
        var m2 = entanglement.createEntangledMorph({excludes: ['bar']});
        
        m0.foo = 0;
        m0.bar= 'Salmon Mousse'
        
        entanglement.update();
        
        this.assertEquals(m1.foo, 42); //should have ignored foo = 0
        this.assertEquals(m1.bar, 'Salmon Mousse');
        
        this.assertEquals(m2.bar, 'Meaning of Life'); 
        this.assertEquals(m2.foo, 0);
        
        // also properties changed via getter may be ignored
        m0.setPosition(pt(42))
        
        entanglement.update();
        
        this.assertEquals(m1.getPosition() != m0.getPosition(), true);
        this.assertEquals(m2.getPosition(), m0.getPosition());
        
    },
    test05EntangleExternalMorphWithSpec: function() {
        // Morphs corresponding to the same prototype that a spec
        // describes can be entangled with a spec for synchronization
        // later on, even when they are not created from this spec directly
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var spec = new lively.morphic.Box(lively.rect(0,0,100,100)).buildSpec();
        
        var entanglement = lively.persistence.Entanglement.Morph.fromSpec(spec);
        entanglement.entangleWith(m);
        m.setExtent(pt(42, 42));
        entanglement.update();
        this.assertEquals(entanglement.get('_Extent'), m.getExtent());
        
        entanglement.set('droppingEnabled', false);
        this.assertEquals(m.droppingEnabled, entanglement.get('droppingEnabled'));
    },
    test06SpecSyncsToEntangledMorph: function() {
        // change in spec -> change in Morph
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.foo = 23;
        
        var entanglement = lively.persistence.Entanglement.Morph.fromMorph(m),
            entangled = entanglement.createEntangledMorph();
            
        entanglement.set('foo', 42);
        this.assertEquals(entangled.foo, entanglement.get('foo'));
        entanglement.set('_Extent', pt(42, 42));
        this.assertEquals(entangled.getExtent(), entanglement.get('_Extent'));
    },
    test11DisconnectsFromEntangledMorph: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100)),
            entanglement = lively.persistence.Entanglement.Morph.fromMorph(m),
            entangled = entanglement.createEntangledMorph();
        
        entanglement.disconnectMorph(entangled);
        this.assertEquals(entangled.attributeConnections, null);
        this.assertEquals(entanglement.entangledMorphs[entangled], null);
    },
    test10RefinesEntanglement: function() {
        // change in morph -> change in spec
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var b = new lively.morphic.Box(lively.rect(0,0,42,42));
        m.addMorph(b);
        m.foo = b;
        
        var entanglement = lively.persistence.Entanglement.Morph.fromMorph(m);
        var e1 = entanglement.createEntangledMorph({excludes: ['setPosition']});
        var e2 = entanglement.createEntangledMorph({excludes: [{foo: ['setFill']}, 'setPosition']});
            
        e2.foo.setFill(Color.blue);
        e1.foo.setPosition(pt(42));
        e1.foo.setFill(Color.red);
        
        entanglement.update();
        
        this.assertEquals(e2.foo.getPosition(), pt(42));
        this.assertEquals(e2.foo.getFill(), Color.blue);
        this.assertEquals(e2.foo.getFill() != entanglement.get('foo').get('_Fill'), true);
    },

    test09ClearAllEntanglements: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var entanglement = lively.persistence.Entanglement.Morph.fromMorph(m);
        var e1 = entanglement.createEntangledMorph();
        var e2 = entanglement.createEntangledMorph();
        this.assertEquals(entanglement.entangledMorphs.length, 2);
        entanglement.clearAllEntanglements();
        this.assertEquals(entanglement.entangledMorphs.length, 0);
        //also disconnects all connections!
        this.assertEquals(entanglement.entangledAttributes.attributeConnections, undefined);
    },


    test08EntanglesReferencedSubmorphs: function() {
        // changes in submorphs -> change in subentanglements
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var b = new lively.morphic.Box(lively.rect(0,0,42,42));
        m.addMorph(b);
        m.foo = b;
        
        var entanglement = lively.persistence.Entanglement.Morph.fromMorph(m),
            e1 = entanglement.createEntangledMorph();
            e2 = entanglement.createEntangledMorph();
            
        e1.foo.setFill(Color.red);
        
        entanglement.update();
        
        this.assertEquals(e1.foo.getFill(), entanglement.get('foo').get('_Fill'));
        this.assertEquals(e2.foo.getFill(), Color.red);
    },
    test12EntanglesSubmorphs: function() {
        // changes in submorphs -> change in subentanglements
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var b = new lively.morphic.Box(lively.rect(0,0,42,42));
        b.setName('sub1');
        m.addMorph(b);
        
        var entanglement = lively.persistence.Entanglement.Morph.fromMorph(m),
            e1 = entanglement.createEntangledMorph();
            e2 = entanglement.createEntangledMorph();
            
        e1.get('sub1').setFill(Color.red);
        this.assertEquals(e1.get('sub1').getFill(), entanglement.get('sub1').get('_Fill'));
        this.assertEquals(e2.get('sub1').getFill(), Color.red);
    },
    test13TracksRemovalOfSubmorphs: function() {
        
        // we can use this test to show off an advanced handling of the submorph array
        // by providing getter and setter to the buildspec. Here the getter and setter
        // objects will refer to observer objects that monitor changes inside the
        // submorph array and propagate changes as nessecary.
        
        var m = new lively.morphic.Box(new Rectangle(0,0,42,42));
        var m1 = new lively.morphic.Box(new Rectangle(0,0,42,42));
        var m2 = new lively.morphic.Box(new Rectangle(0,0,42,42));
        
        m1.setName('Hänsel');
        m2.setName('Gretel')
        
        m.addMorph(m1);
        m.addMorph(m2);
        
        var entanglement = m.buildSpec().createEntanglement();
        var c1 = entanglement.createEntangledMorph();
        var c2 = entanglement.createEntangledMorph();

        this.assertEquals(c1.submorphs.length, 2);
        c1.removeMorph(c1.submorphs.find(function(each) { return each.getName() == 'Gretel' }));
        entanglement.update();
        //submorphs is removed in all other entangled morphs
        this.assertEquals(c2.submorphs.find(function(each) { return each.getName() == 'Gretel' }), undefined);
    },
    test16ChangesSubEntanglementsAccordingly: function() {
        var m = new lively.morphic.Box(new Rectangle(0,0,42,42));
        var h = new lively.morphic.Box(new Rectangle(0,0,42,42));
        var g = new lively.morphic.Box(new Rectangle(0,0,42,42));
        
        h.setName('Hänsel');
        g.setName('Gretel')
        
        m.addMorph(h);
        
        var entanglement = m.buildSpec().createEntanglement();
        var c1 = entanglement.createEntangledMorph();
        var c2 = entanglement.createEntangledMorph();
        
        this.assertEquals(entanglement.subEntanglements.length, 1);
        c1.addMorph(g);
        entanglement.update();
        this.assertEquals(entanglement.subEntanglements.length, 2);
        this.assertEquals(c1.submorphs.length, 2)
        this.assertEquals(c2.submorphs.length, 2)
        c2.removeMorph(c2.get('Gretel'));
        entanglement.update();
        this.assertEquals(entanglement.subEntanglements.length, 1);
        this.assertEquals(c1.submorphs.length, 1)
        this.assertEquals(c2.submorphs.length, 1)
        c1.removeMorph(c1.get('Hänsel'));
        entanglement.update();
        this.assertEquals(entanglement.subEntanglements.length, 0);
        this.assertEquals(c1.submorphs.length, 0)
        this.assertEquals(c2.submorphs.length, 0)
    },


    test18tracksAddingOfMethods: function() {
        var m = new lively.morphic.Box(new Rectangle(0,0,42,42));
        var entanglement = m.buildSpec().createEntanglement();
        var m1 = entanglement.createEntangledMorph();
        var m2 = entanglement.createEntangledMorph();
        
        this.assertEquals(m2.hello == undefined, true);
        
        function hello() { return 'Hello World!'}
        entanglement.addMethod('hello', hello);
        
        this.assertEquals(m2.hello != undefined, true);
        this.assertEquals(entanglement.get('hello') != undefined, true);
        
    },



    test17tracksRemovingOfMethods: function() {
        // this is very difficult to implement. Probably not possible.
        // We instead refrain to method changes only through the entanglement interfact
        var m = new lively.morphic.Box(new Rectangle(0,0,42,42));
        function hello() { return 'Hello World!'}
        m.addScript(hello);
        var entanglement = m.buildSpec().createEntanglement();
        var m1 = entanglement.createEntangledMorph();
        var m2 = entanglement.createEntangledMorph();
        
        entanglement.deleteMethod('hello');
        
        this.assertEquals(m2.hello == undefined, true);
        
    },

    test15TracksAdditionOfSubmorphs: function() {
        var m = new lively.morphic.Box(new Rectangle(0,0,42,42));
        var m1 = new lively.morphic.Box(new Rectangle(0,0,42,42));
        var m2 = new lively.morphic.Box(new Rectangle(0,0,42,42));
        
        m1.setName('Hänsel');
        m2.setName('Gretel')
        
        m.addMorph(m1);
        
        var entanglement = m.buildSpec().createEntanglement();
        var c1 = entanglement.createEntangledMorph();
        var c2 = entanglement.createEntangledMorph();
        this.assertEquals(c1.submorphs.length, 1);
        c1.addMorph(m2);
        entanglement.update();
        //submorph is add in all other entangled morphs
        this.assertEquals(c2.submorphs.find(function(each) { return each.getName() == 'Gretel' }) != undefined, true);
    },



    test14TracksChangesThroughPublicMethods: function() {
        // in addition to exclusions, we can define how array changes
        // should be tracked
    },


    test07EntangledMorphSyncsToSpec: function() {
        // change in morph -> change in spec
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        m.foo = 23;
        
        var entanglement = lively.persistence.Entanglement.Morph.fromMorph(m),
            entangled = entanglement.createEntangledMorph();
            
        entangled.foo = 42;
        entanglement.update();
        this.assertEquals(entangled.foo, entanglement.get('foo'));
        entangled.setExtent(pt(42, 42));
        entanglement.update();
        this.assertEquals(entangled.getExtent(), entanglement.get('_Extent'));
    }
}
);
lively.morphic.tests.MorphTests.subclass('lively.persistence.tests.Entanglement.Regression',
'regression', {
    test02getWithSubProperties: function() {
        // set can be called with both an array of arguments and a tuple
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var b = new lively.morphic.Box(lively.rect(0,0,42,42));
        m.addMorph(b);
        m.foo = b;
        var e = lively.persistence.Entanglement.Morph.fromMorph(m);
        e.get('foo').set('_Fill', Color.blue);
        this.assertEquals(e.get('foo').get('_Fill'), Color.blue);
    },
    test03DoesNotConnectPropertiesMoreThanOnce: function() {
        var b = new lively.morphic.Box(lively.rect(0,0,42,42));
        var e = b.buildSpec().createEntanglement();
        var m = e.createEntangledMorph();
        var conns = m.attributeConnections;
        var connsNames = conns.map(function(conn) { return conn.sourceAttrName });
        this.assertEquals(connsNames.every(function(conn) {return connsNames.lastIndexOf(conn) == connsNames.indexOf(conn)}), true);
    },
    test04DealsWithNonReferencedWrapperMorphs: function() {
        // Often submorphs are packed into unnamed and unreferenced Box
        // containers, to allow things like layouting etc. 
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var wrapper = new lively.morphic.Box(lively.rect(0,0,42,42));
        var b = new lively.morphic.Box(lively.rect(0,0,13,13));
        
        b.setName('b');
        wrapper.addMorph(b);
        m.addMorph(wrapper);
        
        var entanglement = m.buildSpec().createEntanglement();
        var m1 = entanglement.createEntangledMorph({excludes: [{b: ['setFill']}]});
        var m2 = entanglement.createEntangledMorph();

        this.assertEquals(m1.get('b') != undefined, true);
        m2.get('b').setFill(Color.red);
        this.assertEquals(m2.get('b').getFill() == entanglement.get('b').get('_Fill'), true);
        this.assertEquals(m1.get('b').getFill() != m2.get('b').getFill(), true);
    },
    test05PreservesShapeForEllipse: function() {
        // enter comment here
        var ellipse = lively.morphic.Morph.makeEllipse(new Rectangle(0,0,42,42));
        
        
    },
    test01getOfSubEntangelement: function() {
        var m = new lively.morphic.Box(lively.rect(0,0,100,100));
        var b = new lively.morphic.Box(lively.rect(0,0,42,42));
        m.addMorph(b);
        m.foo = b;
        var e = m.buildSpec().createEntanglement();
        this.assertEquals(e.get('foo').isEntanglement, true);
        this.assertEquals(e.get('lol'), undefined);
    },


}
);}) // end of module
