module('lively.morphic.Compat').requires('lively.morphic.CompatLayer').toRun(function() {

Object.extend(Global, {
    alert: function(msg) { console.warn('ALERT: ' + msg) },
    alertOK: function(msg) { console.log('ALERTOK: ' + msg) },
});

NewMorphicCompatLayer.beGlobal();

// Object.extend(Global, {
    // Morph: lively.morphic.Morph,
    // BoxMorph: lively.morphic.Box,
    // TextMorph: lively.morphic.Text,
    // WorldMorph: lively.morphic.World,
    // ButtonMorph: lively.morphic.Button,
// });
// 
// namespace('lively.scene');
// 
// Object.extend(lively.scene, {
    // Rectangle: lively.morphic.Shapes.Rectangle,
// });
// 
// namespace('lively.Text');

}) // end of module