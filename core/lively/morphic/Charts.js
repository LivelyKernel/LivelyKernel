module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.ide.CodeEditor', 'lively.morphic.Widgets').toRun(function() {

lively.morphic.Path.subclass("lively.morphic.DataFlowArrow", {
    
    initialize: function($super, aMorph, directionPt) {
        this.componentMorph = aMorph;
        var arrowHeight = 10, arrowBase = 20;
        this.isLayoutable = false;
        var controlPoints;
        this.directionPt = directionPt;
        if (directionPt.y == 1)
            controlPoints = [pt(000, 000), pt(2 * arrowBase, 000), pt(arrowBase, arrowHeight), pt(000, 000)];
        else
            controlPoints = [pt(000, 000), pt(arrowHeight, arrowBase), pt(0, 2 * arrowBase), pt(000, 000)];
        
        $super(controlPoints);
        this.setBorderColor(Color.rgba(0, 0, 0, 0));
        this.deactivate();
        this.positionAtMorph();
    },
    
    toggle: function() {
        if(!this.activated)
            this.activate();
        else
            this.deactivate();
    },
    
    positionAtMorph: function() {
        var aMorph = this.componentMorph;
        var extent = aMorph.getExtent();
        
        var offsetX, offsetY;
        
        if (this.directionPt.x == 1)
            offsetX = extent.x;
        else
            offsetX = (extent.x - this.getExtent().x) / 2;
        
        if (this.directionPt.y == 1)
            offsetY = extent.y;
        else
            offsetY = (extent.y - this.getExtent().y) / 2;
        
        this.setPosition(pt(offsetX, offsetY));
        aMorph.addMorph(this);
    },
    
    activate: function() {
        this.activated = true;
        this.componentMorph.propagationEnabled = true;
        this.setFill(Color.rgbHex("77D88B"));
    },
    
    deactivate: function() {
        this.activated = false;
        this.componentMorph.propagationEnabled = false;
        this.setFill(Color.rgbHex("D8d8d8"));
    },
    
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown()) {
            this.toggle();
            
            if(this.activated) {
                this.createComponentWithOffset();
            }
        }
    },
    
    createComponentWithOffset: function() {
        var directionPt = this.directionPt;
        var newComponent = $world.loadPartItem('ScriptFlowComponent', 'PartsBin/BP2013H2');
        var extent =  this.componentMorph.getExtent();
        var offset = pt(
            (extent.x + 20) * directionPt.x,
            (extent.y + 20) * directionPt.y
        );
        
        newComponent.setPosition(
            this.componentMorph.getPosition().addPt(offset)
        );
        
        // TODO
        new lively.morphic.DataFlowArrow(newComponent, pt(0,1));
        new lively.morphic.DataFlowArrow(newComponent, pt(1,0));
        
        $world.addMorph(newComponent);
        newComponent.triggerLayouting();
    }
});

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
    
} );

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
            try {
                return eval(__evalStatement);
            } catch (e) {
                return eval(__evalStatement);
            }
        };
        
        try {
            var result = interactiveEval.call(ctx);
            if (localStorage.getItem("LivelyChangesets:" + location.pathname))
                ChangeSet.logDoit(str, ctx.lvContextPath());
            return result;
        } catch(e) {throw e}
        
    },
        
    onChanged: function() {
        if (!this.isValid())
            return;
        
        var newSession =  this.aceEditor.getSession().toString();
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
    },
    
    doit: function(printResult, editor) {
        var text = this.getSelectionMaybeInComment(),
            result = this.tryBoundEval(text);
        if (printResult) { this.printObject(editor, result); return; }
        
        // if (result && result instanceof Error && lively.Config.get('showDoitErrorMessages') && this.world()) {
        //     this.world().alert(String(result));
        // }
        
        var sel = this.getSelection();
        if (sel && sel.isEmpty()) sel.selectLine();
        return result;
    },
    
    onKeyUp: function(evt) {
        var _this = evt.getTargetMorph();
        _this.onChanged.apply(_this, arguments);
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
    
    
} );

lively.morphic.Morph.subclass("lively.morphic.DataFlowComponent", {
    initialize: function($super) {
        $super();
        this.setExtent(pt(500, 250));
        this.setFill(Color.gray);
        this.propagationEnabled = true;
        this.data = null;
        
        this.createLabel();
        this.createButton();
        this.addScript(function updateComponent() {
            // put your code here
        });
        
        this.bottomArrow = new lively.morphic.DataFlowArrow(this, pt(1, 0));
        this.rightArrow = new lively.morphic.DataFlowArrow(this, pt(0, 1));
    },
    
    calculateSnappingPosition: function() {
        // snap to the grid
        var pos = this.getPositionInWorld();
        var offsetX = 0;
        var offsetY = 0;
        
        // Find the nearest fitting snapping point
        if (pos.x % this.gridWidth > this.gridWidth / 2) {
            offsetX = this.gridWidth;
        }
        if (pos.y % this.gridWidth > this.gridWidth / 2) {
            offsetY = this.gridWidth;
        }
        return pt(Math.floor(pos.x/this.gridWidth)*this.gridWidth + offsetX,Math.floor(pos.y/this.gridWidth)*this.gridWidth + offsetY);
    },
    
    addPreviewMorph: function() {
        // adds the preview morph directly behind the component
        morph = new lively.morphic.Box(rect(0,0,0,0));
        morph.setName("PreviewMorph");
        morph.setPosition(this.getPositionInWorld());
        morph.setExtent(this.getExtent());
        morph.setBorderWidth(1);
        morph.setBorderColor(Color.black);
        morph.setBorderStyle('dashed');
        // morph.setFill(Color.blue);
        $world.addMorph(morph,this);
    },
    
    removePreviewMorph: function() {
        $morph("PreviewMorph").remove();
    },
    
    onResizeStart: function() {
        this.addPreviewMorph();
        this.setOpacity(0.7);
    },
    
    onResizeEnd: function() {
        var newExtent = this.calculateSnappingExtent();
        this.setExtent(newExtent);
        this.removePreviewMorph();
        this.setOpacity(1);
    },
    
    onDragStart: function($super, evt) {
        $super(evt);
        this.addPreviewMorph();
        this.setOpacity(0.7);
    },
    
    onDragEnd: function($super, evt) {
        $super(evt);
        // positioning is done in onDropOn
        this.removePreviewMorph();
        this.setOpacity(1);
    },
    
    gridWidth: 50,
    
    remove: function($super) {
        $super();
        this.triggerLayouting();
    },
    
    wantsDroppedMorph: function($super, morphToDrop) {
        if (morphToDrop instanceof lively.morphic.DataFlowComponent) {
            return false;
        }
        return $super(morphToDrop);
    },
    
    onDrag: function($super) {
        $super();
        var previewPos = this.calculateSnappingPosition();
        $morph("PreviewMorph").setPosition(previewPos);
        this.triggerLayouting();
    },
    
    onDropOn: function($super, aMorph) {
        $super();
        if (aMorph == $world) {
            var newpos = this.calculateSnappingPosition();
            this.setPosition(newpos);
        }
        this.triggerLayouting();
        this.notify();
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
            this.setFill(Color.gray);
        } catch (e) {

            this.setFill(Color.rgb(210, 172, 172));
            if (!e.alreadyThrown){
                this.throwError(e);
            }
            return;
        }
        
        if (this.propagationEnabled){
            var _this = this;
            if (promise && typeof promise.done == "function") {
                promise.done(function() {
                    _this.notifyNextComponent();
                });
            } else {
                this.notifyNextComponent();
            }
        }
    },
    
    notifyNextComponent: function() {
        var nextComponent = this.getMorphInDirection(pt(0,1));
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
    calculateSnappingExtent: function() {
        var oldExtent = this.getExtent();
        var offsetX = 0;
        var offsetY = 0;
        
        // Find the nearest fitting snapping extent
        if (oldExtent.x % this.gridWidth > this.gridWidth / 2) {
            offsetX = this.gridWidth;
        }
        if (oldExtent.y % this.gridWidth > this.gridWidth / 2) {
            offsetY = this.gridWidth;
        }
        
        var x = Math.floor(oldExtent.x / this.gridWidth) * this.gridWidth + offsetX;
        var y = Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY;
        return pt(x,y);
    },

    
    refreshData: function() {
        var morphAbove = this.getMorphInDirection(pt(0,-1));
        if (morphAbove)
            this.data = morphAbove.data;
        else
            this.data = null;
    },
    
    getMorphInDirection: function(direction, point) {
        // direction should be a vector, where x is the horizontal and y is the vertical direction
        // (-1,0) would be the left morph, (0,1) the bottom morph
        // diagonal requests return null
        
        var horizontalDir = direction.x;
        var verticalDir = direction.y;
        
        if (Math.abs(horizontalDir) == Math.abs(verticalDir)) {
            // diagonal or (0,0) requested
            return null;
        }
        
        var parentMorph = $world;
        
        var allDFComponents = parentMorph.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.DataFlowComponent;
        });
        
        
        var closestMorph = null;
        
        if (verticalDir != 0) {
            // search in vertical direction

            // choose the top middle point as myPosition as default
            var myPosition = point || this.getPositionInWorld().addPt(pt(this.getExtent().x / 2, 0));
            allDFComponents.forEach(function(el) {
                if (el == this)
                    return;
                
                var elPosition = el.getPositionInWorld();
                
                // check for the nearest DF component straight above or below myPosition
                if (-verticalDir * elPosition.y < -verticalDir * myPosition.y &&
                    elPosition.x <= myPosition.x && elPosition.x + el.getExtent().x >= myPosition.x)
                    
                    if (closestMorph == null || -verticalDir * elPosition.y > -verticalDir * closestMorph.getPositionInWorld().y)
                        closestMorph = el;
            });
        } else {
            // search in horizontal direction
            
            // choose the right middle point as myPosition as default
            var myPosition = point || this.getPositionInWorld().addPt(pt(this.getExtent().x, this.getExtent().y / 2));
            allDFComponents.forEach(function(el) {
                if (el == this)
                    return;
                
                var elPosition = el.getPositionInWorld();
                
                // check for the nearest DF component straight above or below myPosition
                if (-horizontalDir * elPosition.x < -horizontalDir * myPosition.x &&
                    elPosition.y <= myPosition.y && elPosition.y + el.getExtent().y >= myPosition.y)
                    
                    if (closestMorph == null || -horizontalDir * elPosition.x > -horizontalDir * closestMorph.getPositionInWorld().x)
                        closestMorph = el;
            });
        }

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
    
    onCreateFromPartsBin: function() {
        // Maybe some useful stuff could be done here.
        // To not forget the function's name, it's still in here. ;)
        debugger;
    },
    
    setExtent: function($super, newExtent) {
        $super(newExtent);
        this.adjustForNewBounds();
        
        var previewExtent = this.calculateSnappingExtent();
        $morph("PreviewMorph").setExtent(previewExtent);
        
        var errorText = this.getSubmorphsByAttribute("name", "ErrorText");
        if (errorText.length) {
            errorText[0].setExtent(pt(this.getExtent().x - 150, errorText[0].getExtent().y));
        }
        
        var codeEditor = this.getSubmorphsByAttribute("shouldResize", true);
        if (codeEditor.length) {
            codeEditor[0].setExtent(pt(newExtent.x-25,newExtent.y-70));
        }
    },
    
    throwError: function(error) {
        throw error;
    }
});
}) // end of module
