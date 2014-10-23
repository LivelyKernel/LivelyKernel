module('lively.experimental.Webwerkstatt').requires().toRun(function() {

cop.create("WebwerkstattLayer").refineClass(lively.morphic.Morph,{
    onMouseMoveEntry: function (evt) {
        evt.hand.scrollFocusMorph = this; // Magnifier needs this
        return cop.proceed(evt)
    },
})

WebwerkstattLayer.beGlobal()

}) // end of module
