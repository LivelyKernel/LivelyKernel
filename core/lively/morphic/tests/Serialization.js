module('lively.morphic.tests.Serialization').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.WorldSerialization',
'testing', {
    test01SerializeSimpleWorld: function() {
        this.createWorld();
        var m1 = lively.morphic.Morph.makeRectangle(0,0, 100, 100);
        this.world.addMorph(m1);
        m1.setName('SomeMorph');
        var json = lively.persistence.Serializer.serialize(this.world)
        this.world.remove();
        this.world = lively.morphic.World.createFromJSONOn(json, document.body);
        this.assertEquals(2, this.world.submorphs.length) // m1 and hand;
        this.assert(this.world.get('SomeMorph'), 'does not find morph with name from m1');
        this.assert(m1 !== this.world.submorphs[1], 'morphs are identical!!!');
    }
});

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.DocumentSerialization',
'testing', {
    testCreateHTMLDocumentForWorldSerialization: function() {
        var spec = {
                title: 'fooWorld',
                migrationLevel: 99,
                serializedWorld: 'barf',
                externalStyleSheets: ["foo.css"],
                externalScripts: ['bar/baz.js']
            },
            result = lively.persistence.Serializer.documentForWorldSerialization(spec),
            doc = lively.$(result),
            worldScript = doc.find('body script#' + spec.title);
        // world elem
        this.assert(1, worldScript.length, 'no world script element');
        this.assertEquals(spec.migrationLevel, worldScript.attr('data-migrationLevel'));
        this.assertEquals(spec.serializedWorld, worldScript.text());

        // title
        this.assertEquals(spec.title, doc.find('head title').text());
        // other stuff
        this.assertEquals(1, doc.find('link[href="foo.css"]').length, 'no external css element');
        this.assertEquals(1, doc.find('script[src="bar/baz.js"]').length, 'no external js element');
        this.assert(worldScript.index() > doc.find('script[src="bar/baz.js"]').index(),
                    'external js not before world script');
    }
});

}); // end of module
