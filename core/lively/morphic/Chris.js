module('lively.morphic.Chris').requires().toRun(function() {

    lively.morphic.Morph.subclass('lively.morphic.Buttons', 'events', {
        initialize: function($super){
            $super();
        },
        alertMe: function(){
            alert('hello world');
        }
    });    

}) // end of module