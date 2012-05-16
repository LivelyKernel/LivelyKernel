module('lively.morphic.Chris').requires().toRun(function() {
    lively.morphic.Morph.subclass('lively.morphic.Chrisbutton', 'events', {
        initialize: function($super){
            $super();
        },
        alertMe: function(text){
            alert(text + ' I Should See This  xxxx');
        }
    });    

}) // end of module