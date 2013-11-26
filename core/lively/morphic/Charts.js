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
        this.data = null;
        
        this.createLabel();
        this.createButton();
        this.addScript(function updateComponent() {
            // put your code here
        });
    },
    
    createLabel: function() {
        var t = new lively.morphic.Text();
        t.setTextString("DataFlowComponent");
        t.setName("DataFlowComponentLabel");
        t.setExtent(pt(140, 20));
        t.setFill(Color.gray);
        t.setBorderWidth(0);
        this.addMorph(t);
    },
    
    createButton: function() {
        var b = new lively.morphic.Button();
        connect(b, "fire", this, "update", {});
        b.setLabel("Do");
        b.setExtent(pt(100, 20));
        b.setPosition(pt(400, 230));
        this.addMorph(b);
    },
    
    update: function() {
        this.refreshData();
        this.updateComponent();
        
    },
    
    refreshData: function() {
        var morphAbove = this.getMorphAbove();
        if (morphAbove)
            this.data = morphAbove.data;
        else
            this.data = null;
    },
    
    getMorphAbove: function() {
        var parentMorph = this.owner;
        
        var allDFComponents = parentMorph.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.DataFlowComponent;
        });
        
        var closestAbove = null;
        var myPosition = this.getPosition();
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