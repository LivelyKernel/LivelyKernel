module('lively.morphic.HTMLExperiments').requires('lively.morphic.HTML').toRun(function() {

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.NullShape',
'documentation', {
    documentation: 'a shape that does not get rendered and acts as a proxy to the morph itself',
}
);

}) // end of module