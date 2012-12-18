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
                styleSheets: ["foo.css", 'div {\n\tborder: 1px solid red\n}'],
                externalScripts: ['bar/baz.js'],
                html: '<div id="div1"><div id="div2"/></div>'
            },
            result = lively.persistence.HTMLDocBuilder.documentForWorldSerialization(spec),
            doc = lively.$(result),
            worldScript = doc.find('body script#' + spec.title);

        // world elem
        this.assert(1, worldScript.length, 'no world script element');
        this.assertEquals(spec.migrationLevel, worldScript.attr('data-migrationLevel'));
        this.assertEquals(spec.serializedWorld, worldScript.text());
        this.assertEquals('text/x-lively-world', worldScript.attr('type'));

        // title
        this.assertEquals(spec.title, doc.find('head title').text());

        // css
        this.assertEquals(1, doc.find('link[href="foo.css"]').length, 'no external css element');
        this.assertEquals(1, doc.find('style').length, 'no embedded css element');
        this.assertEquals('div {\n\tborder: 1px solid red\n}',
                          doc.find('style').text(), 'embedded css not OK');

        // scripts
        this.assertEquals(1, doc.find('script[src="bar/baz.js"]').length, 'no external js element');
        this.assert(worldScript.index() > doc.find('script[src="bar/baz.js"]').index(),
                    'external js not before world script');

        // html
        this.assertEquals(1, doc.find('body > #div1').length, 'html not inserted');
    }
});

}); // end of module
