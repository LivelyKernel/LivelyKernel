module('lively.morphic.tests.ScriptingSupport').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.morphic.tests.ScriptingSupport.Morph', 'testing', {
    test01get: function() {
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
})

}) // end of module
