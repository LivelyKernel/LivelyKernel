module('lively.IPad').requires().toRun(function() {

    if(UserAgent.isTouch) {
        module('lively.Touch').load(true);
        //DoubleTapSelection.beGlobal();
        module('lively.morphic.IPadWidgets').load(true);
        return;
    }

}) // end of module
