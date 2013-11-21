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

lively.morphic.Morph.subclass("lively.morphic.DataFlowComponent", {
    initialize: function($super) {
        $super();
        this.setExtent(pt(100, 100));
        this.setFill(Color.black);
        
        // TODO
        this.dataInput = null;
        this.dataOutput = null;
    },
    
    update: function() {
        var morphAbove = this.getMorphAbove();
        
        if (morphAbove) {
            this.dataInput = morphAbove.dataOutput;
            this.updateComponent();
        }
    },
    
    updateComponent: function() {
        // subclass responsibility
    },
    
    getMorphAbove: function() {
        var parentMorph = this.owner;
        
        var allDFComponents = parentMorph.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.DataFlowComponent;
        });
        
        var closestAbove = null;
        console.log(this);
        var myPosition = this.getPosition();
        console.log("test");
        allDFComponents.forEach(function(el) {
            if (el == this)
                return;
            
            var elPosition = el.getPosition();
            
            if (elPosition.y < myPosition.y)
                if (closestAbove == null || elPosition.y > closestAbove.getPosition().y)
                    closestAbove = el;
        });

        return closestAbove;
        
    }
    
});
}) // end of module