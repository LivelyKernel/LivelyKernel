module('lively.morphic.tests.Graphics').requires().toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.ColorTests',
'testing', {
    testAddWorldToDoc: function() {
        var canvasNode = document.body, bounds = new Rectangle(0, 0, 100, 100),
            world = new lively.morphic.World();
        try {
            world.setBounds(bounds);
            world.displayOnCanvas(canvasNode);

            var expected = {tagName: 'div', parentNode: canvasNode, childNodes: [{tagName: 'div'}]};
            this.assertNodeMatches(expected, world.renderContext().getMorphNode());
        } finally {
            world.remove();
        }
    },
});

}) // end of module