module('lively.IPad').requires().toRun(function() {

    if (UserAgent.isTouch) {
        lively.require('lively.Touch', 'lively.morphic.IPadWidgets').toRun(function() {
            // DoubleTapSelection.beGlobal();
        });
    }

}) // end of module
