module('lively.morphic.Charts').requires().toRun(function() {

lively.morphic.Morph.subclass("lively.morphic.BarChart", {
    initialize: function($super) {
        $super();
        this.setExtent(pt(500, 500));
        this.setFill(Color.black);
        data = [4,6,2,7,1];
        this.draw(data);
    },
    
    draw: function(data){
        WIDTH = 50; SPACE = 8;
        for (var i = 0; i < data.length; i++) {
            rect = new lively.morphic.Morph.makeRectangle((WIDTH+SPACE)*i,0,WIDTH,100*data[i]);
            rect.setFill(Color.grey);
            this.addMorph(rect);
        }
    },
    
    
} )

}) // end of module