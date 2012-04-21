module('lively.morphic.CompatLayer').requires('lively.morphic.Core', 'cop.Layers').toRun(function() {

Object.subclass('lively.morphic.Compat.Text',
'initializing', {
    initialize: function(string) {
        this.string = string;
    },
})

cop.create('NewMorphicCompatLayer')
.refineObject(Global, {
    get Morph() { return lively.morphic.Morph },
    get BoxMorph() { return lively.morphic.Box },
    get TextMorph() { return lively.morphic.Text },
    get WorldMorph() { return lively.morphic.World },
    get ButtonMorph() { return lively.morphic.Button },
    get PanelMorph() { return lively.morphic.Panel },
    get HorizontalDivider() { return lively.morphic.HorizontalDivider },
    get SliderMorph() { return lively.morphic.Slider },
    get MenuMorph() { return lively.morphic.Menu },
    get ImageMorph() { return lively.morphic.Image },
    get ContainerMorph() { return lively.morphic.Morph },

    get TextSelectionMorph() { return lively.morphic.Morph },
    get Widget() { return lively.morphic.WindowedApp },

    get newTextPane() {
        return function(initialBounds, defaultText) {
            var text = new lively.morphic.Text(initialBounds.extent().extentAsRectangle(), defaultText);
            text.applyStyle({clipMode: 'scroll', fixedWidth: true, fixedHeight: true})
            return text
        }
    },
    get newDragnDropListPane() {
        return function(initialBounds, suppressSelectionOnUpdate) {
            return new lively.morphic.List(initialBounds, ['-----'])
        }
    },
})
.refineObject(lively, {
    get scene() { return {
        Text: lively.morphic.Shapes.Rectangle,
        Similitude: lively.morphic.Similitude,
        Group: lively.morphic.Shapes.Rectangle,
        Rectangle: lively.morphic.Shapes.Rectangle} },
    get Text() { return {Text: lively.morphic.Compat.Text, isLoaded: Functions.True} },
    get paint() { return {
        RadialGradient: lively.morphic.RadialGradient,
        LinearGradient: lively.morphic.LinearGradient,
        Stop: Object}},
});

}) // end of module