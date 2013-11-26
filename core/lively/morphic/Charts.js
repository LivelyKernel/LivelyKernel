module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.morphic.Widgets').toRun(function() {

lively.morphic.Morph.subclass("lively.morphic.LinearLayout", {
    
    initialize: function($super,h,w) {
        $super();
        this.setFill(Color.white);
        this.setExtent(pt(w, h));
        this.OFFSET = 10;
        this.currentX = this.OFFSET;
    },
    
    addElement: function(element){
        element.setPosition(pt(this.currentX, this.getExtent().y - element.getExtent().y));
        this.currentX = this.currentX + element.getExtent().x + this.OFFSET;
        this.addMorph(element);
        return this.currentX;
    }
} )

lively.morphic.Morph.subclass("lively.morphic.BarChart", {
    initialize: function($super) {
        $super();
        alert(10);
        this.setExtent(pt(500,500));
        this.setFill(Color.blue);
        this.linearLayout = new lively.morphic.LinearLayout(500,500);
        this.addMorph(this.linearLayout);
        this.data = [4,6,2,7,1];
        this.draw(this.data);
    },
    
    draw: function(data){
        var WIDTH,SPACE = 10;
        for (var i = 0; i < data.length; i++) {
            var rect = new lively.morphic.Morph.makeRectangle(0,0,WIDTH,100*data[i]);
            rect.setFill(Color.grey);
            this.linearLayout.addElement(rect);
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
    
    getMorphAbove: function(point) {
        var parentMorph = this.owner;
        
        var allDFComponents = parentMorph.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.DataFlowComponent;
        });
        
        var closestAbove = null;

        // choose the top middle point as myPosition as default
        var myPosition = point || this.getPosition().addPt(pt(this.getExtent().x / 2, 0));
        allDFComponents.forEach(function(el) {
            if (el == this)
                return;
            
            var elPosition = el.getPosition();
            
            // check for the nearest DF component straight above myPosition
            if (elPosition.y < myPosition.y && elPosition.x < myPosition.x && elPosition.x + el.getExtent().x > myPosition.x)
                if (closestAbove == null || elPosition.y > closestAbove.getPosition().y)
                    closestAbove = el;
        });

        return closestAbove;
        
    }
});
}) // end of module