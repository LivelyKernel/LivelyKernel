module('lively.morphic.tests.ScriptingSupport').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.morphic.tests.ScriptingSupport.Morph',
'testing', {

    test01Get: function() {
        var morph = new lively.morphic.Morph(),
            content = new lively.morphic.Morph(),
            thrown = false;
        morph.toString = function() {
            return this.get("content").text;
        };
        morph.addMorph(content);
        content.setName('content');
        content.text = "foo bar baz";
        this.assert(morph.toString() === "foo bar baz", "toString implementation did not work");
        content.remove();
        try {
            morph.toString()
            this.assert(false, "No error raised.")
        } catch (e) {
            this.assert(e.message == "'get' failed due to a stack overflow. The most likely source of the problem is using 'get' as part of toString, because 'get' calls 'getBreadthFirstUpwards', which calls 'toString' on this. Try using 'getMorphNamed' instead, which only searches in this' children.", "wrong error thrown")
        }
    },

    test02GetSupportsRegexp: function() {
        var morph = new lively.morphic.Morph(),
            content = new lively.morphic.Morph();
        morph.addMorph(content);
        content.setName('content');
        this.assertIdentity(content, morph.get(/ent$/));
        this.assert(!morph.get(/^ent/));
    },

    test03GenerateMorphGetExpressions: function() {
      var m1 = new lively.morphic.Morph(),
          m2 = new lively.morphic.Morph(),
          m3 = new lively.morphic.Morph(),
          m4 = new lively.morphic.Morph(),
          m5 = new lively.morphic.Morph(),
          m6 = new lively.morphic.Morph(),
          m7 = new lively.morphic.Morph();
      $world.addMorph(m1);
      $world.addMorph(m2);
      m1.name = "some-morph";
      m2.name = "some-morph";

      $world.addMorph(m3);
      m3.addMorph(m4);
      m4.addMorph(m5);
      m3.addMorph(m6);
      m3.addMorph(m7);

      m3.name = "m3";
      m4.name = "m4";
      m5.name = "m5";
      m6.name = "m6";
      m7.name = "m7";

      this.onTearDown(function() { m1.remove(); m2.remove(); m3.remove(); });

      this.assertEquals('$morph("some-morph")', m1.generateReferenceExpression());
      this.assertEquals(lively.lang.string.format('$world.getMorphById("%s")', m2.id), m2.generateReferenceExpression());

      this.assertEquals('$morph("m3")', m3.generateReferenceExpression());
      this.assertEquals('$morph("m3").get("m4")', m4.generateReferenceExpression());
      this.assertEquals('$morph("m3").get("m4").get("m5")', m5.generateReferenceExpression());

      this.assertEquals("this", m2.generateReferenceExpression({fromMorph: m2}));
      this.assertEquals('$morph("m3").get("m7")', m7.generateReferenceExpression({fromMorph: m5}));
    }
})

}) // end of module
