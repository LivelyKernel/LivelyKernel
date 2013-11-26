module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.morphic.Widgets').toRun(function() {

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
        this.setExtent(pt(500, 250));
        this.setFill(Color.gray);
        
        // TODO
        this.dataInput = null;
        this.dataOutput = null;
        
        //this.createLabel();
        this.createButton();
    },
    
    createLabel: function() {
        var t = new lively.morphic.Text();
        t.setTextString("DataFlowComponent");
        t.setName("DataFlowComponentLabel");
        this.addMorph(t);
    },
    
    createButton: function() {
        var b = new lively.morphic.Button();
        b.addScript(function update() { console.log("update") });
        connect(b, "fire", b, "update", {});
        b.setLabel("Update");
        b.setExtent(pt(100, 20));
        
        this.addMorph(b);
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