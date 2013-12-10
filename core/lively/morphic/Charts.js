module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.ide.CodeEditor', 'lively.morphic.Widgets').toRun(function() {

lively.morphic.Morph.subclass("lively.morphic.LinearLayout", {
    
    initialize: function($super,h,w) {
        $super();
        this.setFill(Color.white);
        this.setExtent(pt(w, h));
        this.OFFSET = 20;
        this.currentX = this.OFFSET;
    },
    
    addElement: function(element){
        element.setPosition(pt(this.currentX, this.getExtent().y - element.getExtent().y));
        this.currentX = this.currentX + element.getExtent().x + this.OFFSET;
        this.addMorph(element);
        return this.currentX;
    },
    
    clear: function(){
        this.currentX = this.OFFSET;
        this.removeAllMorphs();
    }
    
} )

lively.morphic.CodeEditor.subclass('lively.morphic.DataFlowCodeEditor',
{
    initialize: function($super) {
        $super();
        this.disableGutter();
    },
    
    boundEval: function(codeStr) {
        
        var ctx = this.getDoitContext() || this;
        ctx.refreshData();
        
        var __evalStatement = "(function() {var data = ctx.data; str = eval(codeStr); ctx.data = data; return str;}).call(ctx);"
        
        // see also $super
        
        // Evaluate the string argument in a context in which "this" is
        // determined by the reuslt of #getDoitContext
        var str,
        interactiveEval = function() {
            try { return eval(__evalStatement)} catch (e) { return eval(__evalStatement) }
        };
        
        try {
            var result = interactiveEval.call(ctx);
            if (localStorage.getItem("LivelyChangesets:" + location.pathname))
                ChangeSet.logDoit(str, ctx.lvContextPath());
            return result;
        } catch(e) {throw e}
        
    },
    
    onKeyUp: function(evt) {
        var _this = evt.getTargetMorph();
        _this.onChanged.apply(_this, arguments);
    },
    
    onChanged: function() {
        if (!this.isValid())
            return;
        
        
        var newSession =  this.aceEditor.getSession().toString();
        console.log("newSession", newSession);
        debugger;
        if (this.oldSession) {
            if (this.oldSession == newSession)
                return;
        }
        this.oldSession = newSession;
        
        var ownerChain = this.ownerChain();
    
        for (var i = 0; i < ownerChain.length; i++) {
            if (ownerChain[i] instanceof lively.morphic.DataFlowComponent){
                ownerChain[i].onComponentChanged();
                break;
            }
        }
    },
    
    isValid: function() {
        var str = this.getSession();
        try {
            eval("throw 0;" + str);
        } catch (e) {
            if (e === 0)
                return true;
        }
        return false;
    }

});
lively.morphic.Morph.subclass("lively.morphic.BarChart", {
    initialize: function($super) {
        $super();
        this.setExtent(pt(500,500));
        this.setFill(Color.blue);
        this.linearLayout = new lively.morphic.LinearLayout(500,500);
        this.addMorph(this.linearLayout);
        this.data = [4,6,2,7,1];
        this.draw(this.data);
    },
    
    draw: function(data){
        var WIDTH = 20, MARGIN_TOP=10;
        this.linearLayout.clear();
        
        var max = Object.values(data).max();
        for (var element in data) {
            if (data.hasOwnProperty(element)) {
                var rect = new lively.morphic.Morph.makeRectangle(0,0,WIDTH,data[element]/max*this.linearLayout.getExtent().y-MARGIN_TOP);
                rect.setFill(Color.blue);
                rect.setBorderWidth(0);
                var text = new lively.morphic.Text();
                text.setTextString(element);
                text.setExtent(pt(50, 20));
                text.setFill(Color.gray);
                text.setBorderWidth(0);
                text.setPosition(pt(text.getPosition().x-rect.getExtent().x/2,
                    text.getPosition().y+rect.getExtent().y));
                rect.addMorph(text);
                this.linearLayout.addElement(rect);
            }
        }
    },
    
    
} )

lively.morphic.Morph.subclass("lively.morphic.DataFlowComponent", {
    initialize: function($super) {
        debugger;
        $super();
        this.setExtent(pt(500, 250));
        this.setFill(Color.gray);
        this.data = null;
        
        this.createLabel();
        this.createButton();
        // this.openInWindow();
        this.addScript(function updateComponent() {
            // put your code here
        });
    },
    
    onDrag: function($super) {
        $super();
        this.triggerLayouting();
    },
    
    onDropOn: function($super, aMorph) {
        $super();
        this.triggerLayouting();
    },
    
    triggerLayouting: function() {
        var layouts = $world.submorphs.select(function(ea) {
            return ea.isDataFlowAlignment && ea.isDataFlowAlignment();
        }, this);
        layouts.each(function(ea) {
            ea.layoutWorld();
        })
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
        var promise;
        try {
            promise = this.updateComponent();
            
            console.log("after updateComponent: ", this.data);
            this.setFill(Color.gray);
        } catch (e) {
            this.setFill(Color.red);
            if (!e.alreadyThrown){
                throw e;
            }
            return;
        }
    
        var _this = this;
        if (promise && typeof promise.done == "function") {
            promise.done(function() {
                _this.notifyNextComponent();
            });
        } else {
            console.log("data before notify: ", this.data);
            this.notifyNextComponent();
        }
            
    },
    
    notifyNextComponent: function() {
        var nextComponent = this.getMorphInDirection(-1);
        if (nextComponent){
            nextComponent.notify();
        }
    },
    
    notify: function() {
        this.update();
    },
    
    onComponentChanged: function() {
        var wait = 1000;
        var now = new Date;
        
        var _this = this;
        var doIt = function() {
            _this.notify();
            _this.previous = now;
        }
        
        if (!this.previous) {
            doIt();
            return;
        }
        
        var previous = this.previous;
        
        var remaining = wait - (now - previous);
        
        if (remaining <= 0) {
            doIt();
        } else {
            // setTimeout and check that we only have one at a time
            if (!this.currentTimeout){
                this.currentTimeout = setTimeout(function() {
                    doIt();
                    _this.currentTimeout = null;
                }, remaining);
            }
        }
    },
    
    refreshData: function() {
        var morphAbove = this.getMorphInDirection(1);
        if (morphAbove)
            this.data = morphAbove.data;
        else
            this.data = null;
    },
    
    getMorphInDirection: function(direction, point) {
        // direction should be 1 or -1 for above or below
        
        var parentMorph = $world;
        
        var allDFComponents = parentMorph.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.DataFlowComponent;
        });
        
        var closestMorph = null;

        // choose the top middle point as myPosition as default
        var myPosition = point || this.getPositionInWorld().addPt(pt(this.getExtent().x / 2, 0));
        allDFComponents.forEach(function(el) {
            if (el == this)
                return;
            
            var elPosition = el.getPositionInWorld();
            
            // check for the nearest DF component straight above or below myPosition
            if (direction * elPosition.y < direction * myPosition.y &&
                elPosition.x <= myPosition.x && elPosition.x + el.getExtent().x >= myPosition.x)
                
                if (closestMorph == null || direction * elPosition.y > direction * closestMorph.getPositionInWorld().y)
                    closestMorph = el;
        });

        return closestMorph;
        
    },
    adjustForNewBounds: function() {
        // resizeVertical, resizeHorizontal, moveVertical, moveHorizontal

        if (this.getLayouter()) {
            this.applyLayout();
            return;
        }

        var newExtent = this.getShape().getBounds().extent();
        if (!this.priorExtent) {
            this.priorExtent = newExtent;
            return;
        }

        var scalePt = newExtent.scaleByPt(this.priorExtent.invertedSafely()),
            diff = newExtent.subPt(this.priorExtent);

        for (var i = 0; i < this.submorphs.length; i++) {
            var morph = this.submorphs[i], spec = morph.layout;
            if (!spec) continue;
            var moveX = 0, moveY = 0, resizeX = 0, resizeY = 0;

            if (spec.centeredHorizontal)
                moveX = this.innerBounds().center().x - morph.bounds().center().x;
            if (spec.centeredVertical)
                moveY = this.innerBounds().center().y - morph.bounds().center().y;

            if (spec.moveHorizontal) moveX = diff.x;
            if (spec.moveVertical) moveY = diff.y;
            if (spec.resizeWidth) resizeX = diff.x;
            if (spec.resizeHeight) resizeY = diff.y;

            if (spec.scaleHorizontal || spec.scaleVertical) {
                var morphScale = pt(
                    spec.scaleHorizontal ? scalePt.x : 1,
                    spec.scaleVertical ? scalePt.y : 1);
                morph.setPosition(morph.getPosition().scaleByPt(morphScale));
                morph.setExtent(morph.getExtent().scaleByPt(morphScale));
            }

            if (moveX || moveY) morph.moveBy(pt(moveX, moveY));
            if (resizeX || resizeY) morph.setExtent(morph.getExtent().addXY(resizeX, resizeY));
        }

        this.priorExtent = newExtent;
    },
    setExtent: function($super, newExtent) {
        var oldExtent = this.getExtent();
        $super(newExtent);
        this.adjustForNewBounds();
        var button = this.get("DoButton");
        button.setPosition(button.getPosition().addPt(newExtent.subPt(oldExtent)));
    }
});
}) // end of module