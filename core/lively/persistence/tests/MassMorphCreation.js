module('lively.persistence.tests.MassMorphCreation').requires('lively.persistence.MassMorphCreation', 'lively.morphic.tests.Helper').toRun(function() {

TestCase.subclass('lively.persistence.tests.MassMorphCreation.Test',
'testing', {
    test01CreateMultipleMorphsFunc: function() {
        var morphs = lively.morphic.Morph.createN(2, function() {
            var morph = lively.morphic.Morph.makeRectangle(0,0, 100, 100);
            morph.setFill(Color.red);
            return morph;
        });

        this.assertEquals(2, morphs.length, 'Not 2 morphs created');

        // morph and shape objects
        var m1 = morphs[0],
            shape1 = m1.getShape(),
            m2 = morphs[1],
            shape2 = m2.getShape();

        this.assert(m1 !== m2, 'morphs are identical?!');
        this.assert(shape1 !== shape2, 'shapes are identical?!');

        // morphic render state
        this.assertIdentity(m1.renderContext(), shape1.renderContext(), 'ctx 1');
        this.assertIdentity(m2.renderContext(), shape2.renderContext(), 'ctx 2');

        // DOM state
        var morphNode1 = m1.renderContext().morphNode,
            shapeNode1 = m1.renderContext().shapeNode,
            morphNode2 = m2.renderContext().morphNode,
            shapeNode2 = m2.renderContext().shapeNode;

        this.assert(morphNode1 !== morphNode2, 'morph nodes are identical?!');
        this.assert(shapeNode1 !== shapeNode2, 'morph nodes are identical?!');
        this.assert(shapeNode1.style !== shapeNode2, 'morph nodes are identical?!');

        this.assertEquals("rgb(204, 0, 0)", shapeNode1.style.backgroundColor,
                          'CSS color 1');

        this.assertEquals("rgb(204, 0, 0)", shapeNode2.style.backgroundColor,
                          'CSS color 2');
    }
});

}) // end of module