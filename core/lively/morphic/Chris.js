module('lively.morphic.Chris').requires().toRun(function() {
    lively.morphic.Morph.subclass('lively.morphic.labbook', 'events', {
        initialize: function($super){
            $super();
            //this.password = new lively.morphic.PasswordInput().openInWorld();
            //$morph('PasswordContainer').addMorph(this.password);
        },
        login: function(email, password){
            //alert(email);
            //alert(password);
            this.password = new lively.morphic.PasswordInput().openInWorld();
            $morph('PasswordContainer').addMorph(this.password);
            $morph('Rectangle1').applyStyle({ opacity: .20});
        }
    });    

}) // end of module