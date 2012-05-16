module('lively.morphic.Chris').requires().toRun(function() {

    lively.morphic.Morph.subclass('ButtonMethods', 'Buttons', {
        initialize: function($super) {
            $super();
        }
        alertMe: function(){
            alert('hello world');
            alert(this.getTextString());
        }
    });

}) // end of module