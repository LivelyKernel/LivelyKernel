module('lively.morphic.HTMLExperiments').requires('lively.morphic.HTML').toRun(function() {

lively.morphic.Shapes.Shape.subclass('lively.morphic.Shapes.NullShape',
'documentation', {
    documentation: 'a shape that wraps an arbitrary HTML element',
}
);

}) // end of module