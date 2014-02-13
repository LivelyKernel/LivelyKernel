module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.ide.CodeEditor', 'lively.morphic.Widgets', 'cop.Layers').toRun(function() {

lively.morphic.Path.subclass("lively.morphic.Charts.Arrow", {
    
    initialize: function($super, aMorph, positionX) {
        this.componentMorph = aMorph;
        var arrowHeight = 10, arrowBase = 20;
        this.isLayoutable = false;
        var controlPoints = [pt(0, 0), pt(2 * arrowBase, 0), pt(arrowBase, arrowHeight), pt(0, 0)];
        
        $super(controlPoints);
        this.setBorderColor(Color.rgb(94,94,94));
        this.positionAtMorph(positionX);
        this.setBorderWidth(0);
        this.deactivate();
    },
    
    getTipPosition: function() {
        return this.getPositionInWorld().addPt(pt(this.getExtent().x / 2, this.getExtent().y));
    },
    
    isActive: function() {
        return this.activated;
    },
    
    toggle: function() {
        if(!this.activated)
            this.activate();
        else
            this.deactivate();
    },
    remove: function($super) {
        
        this.componentMorph.removeArrowFromArray(this);
        $super();
    },

    showContextMenu: function(position) {
        var _this = this;
        
        var componentNames = ["ScriptFlowComponent", "FanOut", "FanIn", "JsonViewer", "LinearLayoutViewer", "PrototypeComponent", "JsonFetcher", "FreeLayout", "Table"];
        
        var contextItems = componentNames.map(function(ea) {
            return [ea, function() {
                _this.activate();
                _this.createComponent(ea);
                _this.componentMorph.notifyNextComponent();
            }];
        });
        
        var menu = new lively.morphic.Menu("Add new data flow component", contextItems);
        menu.openIn($world, position);
    },

    newMethod: function() {
        // enter comment here
    },

    
    positionAtMorph: function(positionX) {
        var aMorph = this.componentMorph;
        var extent = aMorph.getExtent();
        
        var offsetX = (extent.x - this.getExtent().x) / 2;
        var offsetY = extent.y;
        
        this.setPosition(pt(positionX || offsetX, offsetY));
        aMorph.addMorph(this);
        
        // Since addMorph removes the morph and adds it on the new owner,
        // remove is called on the arrow once. There it is also removed
        // from the componentMorph's arrows-array and needs to be pushed again.
        if (aMorph.arrows) {
            aMorph.arrows.push(this);
        }
    },
    
    activate: function() {
        this.activated = true;
        this.setFill(Color.rgb(94,94,94));
        this.componentMorph.onArrowActivated(this);
    },
    
    deactivate: function() {
        this.activated = false;
        this.setFillOpacity(0);
        this.setBorderWidth(1);
        this.componentMorph.onArrowDeactivated(this);
    },
    
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown()) {
            this.toggle();
        } else if (e.isRightMouseButtonDown()) {
            this.showContextMenu(e.scaledPos);
        }
    },
    
    createComponent: function(componentName) {
        var newComponent = $world.loadPartItem(componentName, 'PartsBin/BP2013H2');
        var extent =  this.componentMorph.getExtent();
        var offset = pt(0,extent.y + newComponent.componentOffset);
        
        var newPosition = this.componentMorph.getPosition().addPt(offset);
        newComponent.setPosition(newPosition);

        var componentBelow = this.componentMorph.getComponentInDirectionFrom(1, this.getTipPosition());
        if (componentBelow) {
            componentBelow.move(newComponent.getExtent().y + newComponent.componentOffset, newPosition.y + newComponent.getExtent().y);
        }
        
        $world.addMorph(newComponent);
        this.componentMorph.refreshConnectionLines();
    }
});

lively.morphic.Path.subclass("lively.morphic.Charts.Line", {
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown()) {
            this.openDataInspector(e.getPosition());
        }
    },
    
    remove: function($super) {
        if (this.viewer) {
            this.viewer.getWindow().remove();
        }
        $super();
    },
    
    openDataInspector: function(evtPosition) {
        
        var inspector = $world.loadPartItem('DataInspector', 'PartsBin/BP2013H2');
        inspector.openInHand();
        inspector.setSource(this.from);
        
        this.viewerLine = new lively.morphic.Path([evtPosition, evtPosition]);
        
        var circle = lively.morphic.Morph.makeEllipse(new Rectangle(evtPosition.x-6, evtPosition.y-6, 12, 12));
        circle.setBorderWidth(2);
        circle.setBorderColor(Color.black);
        circle.setFill(Color.rgb(94,94,94));
        
        this.viewerLine.addMorph(circle);
        
        var converter = function(pos) {
            return pos.addPt(pt(190,120));
        }
        
        $world.addMorph(this.viewerLine);
        this.viewerLine.setName('Line' + inspector);
        connect(inspector, '_Position', this.viewerLine.getControlPoints().last(), 'setPos', converter);
        this.viewerLine.setBorderColor(Color.rgb(94,94,94));
        inspector.update();
        
        this.viewer = inspector;
    },
    
    notifyViewer: function() {
        if (this.viewer) {
            this.viewer.update();
        }
    },
    
    onMouseOver: function() {
        this.setBorderWidth(5);
    },
    
    onMouseOut: function() {
        this.setBorderWidth(1);
    }, 
    
    initialize: function($super, vertices, from) {
        $super(vertices);    
        this.setBorderColor(Color.rgb(94,94,94));
        this.from = from;
    },
    
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Component", {
    initialize: function($super) {
        $super();

        var arrow = new lively.morphic.Charts.Arrow(this);
        this.arrows = [arrow];
        
        this.setExtent(pt(500, 250));
        this.setFill(this.backgroundColor);
        this.setBorderColor(this.borderColor);
        this.setBorderWidth(3);
        this.propagationEnabled = true;
        this.data = null;
        
        this.createLabel();
        this.createErrorText();
        this.createMinimizer();
        this.createContainer();

        this.layout = {adjustForNewBounds: true};
    },
    
    updateComponent : function(){
        //this should be overwritten by subclass    
    },
    
    getComponentInDirection : function($super, direction) {
        var components = this.getComponentsInDirection(direction);

        if (components.length) {
            components.sort(function (a, b) {
                if (direction == -1){
                    return b.getPosition().y - a.getPosition().y
                } else return a.getPosition().y - b.getPosition().y
            })
            return components[0];
        }
        return null;
    },
    
    getComponentsInDirection : function($super, direction) {
        var components = [];
        var pxInterval = 100;
        
        // choose upper left corner as point
        var currentPoint = this.getPositionInWorld();

        var rightBoundary = this.getPositionInWorld().x + this.getExtent().x;
        while (currentPoint.x < rightBoundary) {
            
            var component = this.getComponentInDirectionFrom(direction, currentPoint)
    
            if (component) {
                components.pushIfNotIncluded(component);
            }
            
            currentPoint = currentPoint.addPt(pt(pxInterval, 0));
        }
    
        return components;
    },
    
    backgroundColor: Color.rgb(207,225,229),
    borderColor: Color.rgb(94,94,94),
    createContainer: function() {
        var container = new lively.morphic.Box(new rect(0,0,10,10));
        container.setBorderWidth(3);
        container.setFill(this.backgroundColor);
        container.setBorderColor(this.borderColor);
        container.setName("Container");
        this.addMorph(container);
        container.setPosition(pt(0,50));
        container.setExtent(pt(this.getExtent().x,this.getExtent().y-50));
        container.layout = {
              adjustForNewBounds: true,
              resizeHeight: true,
              resizeWidth: true
            };
    },

    errorColor: Color.rgb(210, 172, 172),
    
    notifyNeighborsOfDragStart: function() {
        this.neighbors = [];
        var neighbor;
        
        var _this = this;
        this.arrows.each(function(arrow){
            if (arrow.isActive()) {
                neighbor = _this.getComponentInDirection(1, arrow.getTipPosition());
                if (neighbor) {
                    _this.neighbors.push(neighbor);
                }
            }
        });
    },
    
    drawConnectionLine: function(arrow) {
        var target = this.getComponentInDirectionFrom(1, arrow.getTipPosition());
        
        if (target && arrow.isActive()) {
            // found component to send data to, so draw connection
            
            arrow.target = target;
            
            var from = pt(arrow.getExtent().x/2,arrow.getExtent().y);
            var to = pt(from.x, target.getPositionInWorld().y - arrow.getTipPosition().y + arrow.getExtent().y);
            arrow.connectionLine = new lively.morphic.Charts.Line([from, to], this);
            arrow.connectionLine.setBorderStyle('dotted');
            arrow.addMorph(arrow.connectionLine);
        }
    },
    

    
    drawAllConnectionLines: function() {
        var _this = this;
        this.arrows.each(function(ea) {
            _this.drawConnectionLine(ea);
        });
    },
    

    
    refreshConnectionLines: function() {
        this.removeAllConnectionLines();
        this.drawAllConnectionLines();
    },
    
    removeConnectionLine: function(arrow) {
        if (arrow.connectionLine) {
            arrow.target = null;
            arrow.connectionLine.remove();
            arrow.connectionLine = null;
        }
    },
    

    
    removeAllConnectionLines: function() {
        var _this = this;
        this.arrows.each(function(ea) {
            _this.removeConnectionLine(ea);
        });
    },
    

    
    notifyNeighborsOfDragEnd: function() {
        var neighbor;
        
        var _this = this;
        this.arrows.each(function (arrow){
            neighbor = _this.getComponentInDirection(1, arrow.getPositionInWorld());
            if (neighbor) {
                neighbor.notify();
            }
            
            _this.neighbors.invoke("notify");
        });
    },
    
    onArrowActivated: function(arrow) {
        this.drawConnectionLine(arrow);
        this.update();
    },
    
    onArrowDeactivated: function(arrow) {
        var component = this.getComponentInDirectionFrom(1, arrow.getPositionInWorld());

        this.removeConnectionLine(arrow);
       
        if (component) {
            component.notify();
        }
    },
    

    

    

    
    calculateSnappingPosition: function() {
        // snap to position below component above, if there is one
        var componentAbove = this.getComponentInDirection(-1, this.globalBounds().topCenter().addPt(pt(0, -50)));

        if (componentAbove && !componentAbove.isMerger()) {
            // snap below component above
            var posBelowComponent = componentAbove.getPosition().addPt(pt(0,componentAbove.getExtent().y + this.componentOffset));
            var snappingThreshold = 200;
            if (this.getPositionInWorld().y < posBelowComponent.y + snappingThreshold) {
                // snap directly below component above
                return posBelowComponent;
            }
            // snap into column of component above
            var yGrid = this.calculateSnappingPositionInGrid().y;
            return pt(posBelowComponent.x, yGrid);
        } else {
            return this.calculateSnappingPositionInGrid();
        }
    },
    
    calculateSnappingPositionInGrid: function() {
        var pos = this.getPositionInWorld();
        var offset = pt(0, 0);
        
        // Find the nearest fitting snapping point
        var remainder = pt(pos.x % this.gridWidth, pos.y % this.gridWidth);
        if (remainder.x > this.gridWidth / 2) {
            offset.x = this.gridWidth;
        }
        if (remainder.y > this.gridWidth / 2) {
            offset.y = this.gridWidth;
        }
        return pos.subPt(remainder).addPt(offset);
    },
    
    remove: function($super) {
        
        $super();
        this.onClose();
    },
    
    addPreviewMorph: function() {
        var morph = $morph("PreviewMorph" + this);
        if (!morph) {
            // adds the preview morph directly behind the component
            var morph = new lively.morphic.Box(rect(0,0,0,0));
            morph.setName("PreviewMorph" + this);
            morph.setBorderWidth(1);
            morph.setBorderColor(Color.black);
            morph.setBorderStyle('dashed');
            $world.addMorph(morph,this);
        }
        morph.setPosition(this.getPositionInWorld());
        morph.setExtent(this.getExtent());
        this.previewAdded = true;
    },
    
    removePreviewMorph: function() {
        if (this.previewAdded) {
            $morph("PreviewMorph" + this).remove();
            this.previewAdded = false;
        } else {
            assert($morph("PreviewMorph" + this) === null, "previewAdded was false, but previewMorph was still found!");
        }
    },
    

    
    onResizeEnd: function() {
        var newExtent = this.calculateSnappingExtent(true);
        this.setExtent(newExtent, this.resizingFrom);
        this.drawAllConnectionLines();
        this.removePreviewMorph();
        this.setOpacity(1);
    },
    onResizeStart: function() {
        this.removeAllConnectionLines();
        this.addPreviewMorph();
        this.setOpacity(0.7);
    },

    
    onDragStart: function($super, evt) {
        this.wasDragged = true;
        $super(evt);
        this.removeAllConnectionLines();
        
        // Save the upper neighbor, so that it can be notified to redraw
        // its connection lines. It can not be notified at the moment, since
        // since we are still below it. Notification is done in onDropOn.

        this.savedUpperNeighbors = this.getComponentsInDirection(-1);
        
        this.addPreviewMorph();
        this.setOpacity(0.7);
        this.notifyNeighborsOfDragStart();
        
        // take the dragged component out of the layout
        var componentsBelow = this.getComponentsInDirection(1);
        var _this = this;
        componentsBelow.each(function (c) {
            c.move(-_this.getExtent().y - _this.componentOffset);
        });
        
        // save cached position for the automatic layouting
        this.getAllComponents().each(function (ea) {
            ea.cachedPosition = ea.getPosition();
        });
        
        // trigger this once to avoid flickering
        this.onDrag();
    },
    
    onDragEnd: function($super, evt) {
        $super(evt);
        // positioning is done in onDropOn
        
        this.removePreviewMorph();
        this.setOpacity(1);
        
        this.getAllComponents().each(function (ea) {
            ea.cachedPosition = null;
        });
    },
    
    onClose: function() {
        // only do this if the component is really removed
        // it is temporarily removed while dragging..
        if (!this.wasDragged) {
            var _this = this;

            var componentsBelow = this.getComponentsInDirection(1);
            var componentsAbove = this.getComponentsInDirection(-1);
            
            componentsBelow.each(function (c) {
                c.move(-_this.getExtent().y - _this.componentOffset);
            });

            componentsAbove.each(function (c){
                c.refreshConnectionLines();
            });

            this.notifyNextComponent();
        }
    },
    
    gridWidth: 20,
    
    componentOffset: 20,
    
    isMerger: function() {
        return false;
    },
    
    wantsDroppedMorph: function($super, morphToDrop) {
        if (morphToDrop instanceof lively.morphic.Charts.Component) {
            return false;
        }
        return $super(morphToDrop);
    },
    wantsToBeDroppedInto: function($super, target) {
        var ownerChain = target.ownerChain();

        // find owner which is Charts.Component
        for (var i = 0; i < ownerChain.length; i++) {
            var proto = Object.getPrototypeOf(ownerChain[i]);
            while (proto != null) {
                if (proto == lively.morphic.Charts.Component.prototype)
                    return false;
                proto = Object.getPrototypeOf(proto);
            }
        }

        return $super(target);
    },

    removeArrowFromArray: function(arrow) {
        
        var index = this.arrows.indexOf(arrow);
        if (index > -1) {
            this.arrows.splice(index, 1);
        }
    },

    realignAllComponents : function() {
        var previewMorph = $morph("PreviewMorph" + this);
        
        // reset the position of all components
        var all = this.getAllComponents();
        all.each(function (ea) {
            ea.setPosition(ea.getCachedPosition());
        })

        var componentsBelow = this.getComponentsInDirection(1);
        var componentsAbove = this.getComponentsInDirection(-1);
        var componentsToMove = [];

        // select all components the preview intersects
        componentsToMove = componentsAbove.concat(componentsBelow).filter(function (c) {
            return (c && previewMorph.globalBounds().intersects(c.innerBounds().translatedBy(c.getPosition())))
        });

        // move the components
        componentsToMove.each(function (c) {
            var distanceBelow = previewMorph.getBounds().bottom() + c.componentOffset - c.getPosition().y;
            c.move(distanceBelow, previewMorph.getBounds().bottom());
        });
    },

    move: function(y, aggregatedY) {
        var componentsBelow = this.getComponentsInDirection(1);
        var componentsAbove = this.getComponentsInDirection(-1);
        var _this = this, distanceToMove;
        if (y > 0) {
            distanceToMove = (aggregatedY + this.componentOffset) - this.getPosition().y;
            if (distanceToMove > 0) {
                // move all components below
                // also pass the aggregatedY as we first propagate the move before actually
                // updating the positions (otherwise getComponentsInDirection won't work)
                componentsBelow.each(function (ea) {
                    ea.move(distanceToMove, pt(_this.getPosition().x, aggregatedY + _this.componentOffset).addPt(pt(0, _this.getExtent().y)).y)
                });
                this.setPosition(this.getPosition().addPt(pt(0, distanceToMove)));
            }
        } else if (y < 0) {
            distanceToMove = y;
            // determine how far we can actually move to the top
            // if we can't move for the full y, take the furthest that is possible
            componentsAbove.each(function (ea) {
                distanceToMove = Math.max(distanceToMove, ea.getPosition().y + ea.getExtent().y + _this.componentOffset -  _this.getPosition().y);
            });
            // update the position accordingly and move the components below to the top as well
            this.setPosition(_this.getPosition().addPt(pt(0, distanceToMove)));
            componentsBelow.each(function (ea) {
                ea.move(distanceToMove)
            });
        }
    },

    getAllComponents: function() {
        return $world.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.Charts.Component;
        });
    },

    createErrorText: function() {
        var t = new lively.morphic.Text();
        t.setTextString("");
        t.setName("ErrorText");
        t.setExtent(pt(240, 20));
        t.setPosition(pt(200, 10));
        t.setFontSize(10);
        t.setFillOpacity(0);
        t.setBorderWidth(0);
        t.layout = {resizeWidth: true};
        this.addMorph(t);
    },

    createMinimizer: function() {
        var minimizer = new lively.morphic.Charts.Minimizer();
        minimizer.setPosition(pt(this.getExtent().x - 60, 10));
        minimizer.layout = {moveHorizontal: true}
        this.addMorph(minimizer);
    },

    
    
    onDrag: function($super) {
        $super();
        var previewMorph = $morph("PreviewMorph" + this);
        var previewPos = this.calculateSnappingPosition();
        var previewExtent = this.calculateSnappingExtent();
        previewMorph.setPosition(previewPos);
        previewMorph.setExtent(previewExtent);

        this.realignAllComponents();
    },
    
    onDropOn: function($super, aMorph) {
        $super();
        if (aMorph == $world) {
            var newpos = this.calculateSnappingPosition();
            var newext = this.calculateSnappingExtent();
            this.setPosition(newpos);
            this.setExtent(newext);
        }

        var componentsAbove = this.getComponentsInDirection(-1);
        componentsAbove.concat(this.savedUpperNeighbors).each(function (neighbor) {
            neighbor.refreshConnectionLines();
        });
        this.savedUpperNeighbors = null;

        this.drawAllConnectionLines();
        this.notifyNeighborsOfDragEnd();
        this.notify();
        this.wasDragged = false;
    },


    

    
    createLabel: function() {
        var t = new lively.morphic.Text();
        t.setTextString("DataFlowComponent");
        t.setName("Description");
        t.setExtent(pt(160, 20));
        t.setPosition(pt(10, 10));
        t.setFontSize(12);
        t.setFillOpacity(0);
        t.setBorderWidth(0);
        this.addMorph(t);
    },
    

    
    update: function() {
        this.refreshData();

        var promise;
        try {
            promise = this.updateComponent();
            this.setFill(this.backgroundColor); 
        } catch (e) {
            this.setFill(this.errorColor);
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
        
        if (this.called>1000){
            return;
        }
        this.called = (this.called || 0)+1;
        var _this = this;
        setTimeout(function(){
            _this.called = 0;
        },10000);
        console.log(this.called);
        
        this.arrows.each(function (arrow){
            if (arrow.isActive()) {
                if (arrow.connectionLine) {
                    arrow.connectionLine.notifyViewer();
                }
                
                var dependentComponent = _this.getComponentInDirectionFrom(1, arrow.getPositionInWorld());
                if (dependentComponent) {
                    dependentComponent.notify();
                }
            }  
        });
        if (this.arrows.length == 0){
            //alert("Component has no arrows.");
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
    calculateSnappingExtent: function(ignoreComponentAbove) {

        var componentAbove = this.getComponentInDirection(-1);
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

        if (componentAbove && !ignoreComponentAbove && !componentAbove.isMerger()) {
            // calculate extent depending on the extent of some other component
            return pt(componentAbove.getExtent().x, Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY);
        } else {
            // calculate new extent depending on raster
            var x = Math.floor(oldExtent.x / this.gridWidth) * this.gridWidth + offsetX;
            var y = Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY;
            return pt(x,y);
        }
    },

    
    refreshData: function() {
        var componentAbove = this.getComponentInDirection(-1);
        if (componentAbove){
            this.data = componentAbove.getData(this);
        } else {
            this.data = null;
        }
    },
    
    getComponentInDirectionFrom: function(direction, point) {
        // direction should be an int, which indicates the vertical direction
        // -1 is up and 1 is down

        var allComponents = this.getAllComponents();
        var closestComponent = null;

        // choose the top middle point as myPosition as default
        var myPosition = point || this.globalBounds().topCenter();
        var _this = this;
        allComponents.forEach(function(el) {
            if (el == _this || el.isBeingDragged)
                return;
            
            var elPosition = el.getPositionInWorld();
            
            // check for the nearest component straight above or below myPosition
            if (-direction * elPosition.y <= -direction * myPosition.y &&
                elPosition.x <= myPosition.x && elPosition.x + el.getExtent().x >= myPosition.x) {
                
                if (closestComponent == null || -direction * elPosition.y > -direction * closestComponent.getPositionInWorld().y)
                    closestComponent = el;
            }
        });
        return closestComponent;
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
        var _this = this;
        setTimeout(function () {
            if ($world.firstHand().isPressed()) {
                _this.onDragStart({hand: $world.firstHand()});
                $world.draggedMorph = _this;
            }
        }, 10);
    },
    
    setExtent: function($super, newExtent) {
        var oldExtent = this.getExtent();
        $super(newExtent);
        
        if (!this.isMerger()) {
            this.arrows.each(function (arrow){
                 arrow.positionAtMorph();
            });
        }

        this.adjustForNewBounds();
        
        // Before added to the world, we don't want to inform other components of changing extent
        if (this.owner) {
            var _this = this;
            var componentsBelow = this.getComponentsInDirection(1);
            componentsBelow.each(function (c) {
                c.move(newExtent.y - oldExtent.y, _this.getPosition().y + newExtent.y);
            });
        }
        
        var previewMorph = $morph("PreviewMorph" + this);
        if (previewMorph) {
            var previewExtent = this.calculateSnappingExtent(true);
            previewMorph.setExtent(previewExtent);
        }
    },
    throwError: function(error) {
        var text = this.get("ErrorText");
        text.setTextString(error.toString());
        text.error = error;
        error.alreadyThrown = true;
        throw error;
    },
    

    

    
    getData : function(target){
        
        var arrowToTarget = this.arrows.detect(function (arrow){
            var arrowX =  arrow.getTipPosition().x;
            return target.getPosition().x <= arrowX &&
                arrowX <= target.getPosition().x + target.getExtent().x;
        });
        if (arrowToTarget && arrowToTarget.isActive()) {
            return this.data;
        }
        return null;
    },

    getCachedPosition : function() {
        // cached position for automatic layouting
        return this.cachedPosition || this.getPosition();
    },
    
    migrateFrom : function(oldComponent){
        $world.addMorph(this);
        this.setExtent(oldComponent.getExtent());
        this.setPosition(oldComponent.getPosition());
        this.arrows = oldComponent.arrows;
        this.propagationEnabled = oldComponent.propagationEnabled;
        this.data = oldComponent.data;
        
        this.migrateFromPart(oldComponent);
        oldComponent.remove();
    },
    migrateFromPart: function(oldComponent) {
        // this should be overwritten by subclass or part
    }

});


lively.morphic.Charts.Component.subclass("lively.morphic.Charts.LinearLayout", {
    
    initialize: function($super) {
        $super();
        var description = this.getSubmorphsByAttribute("name","Description")[0];
        description.setTextString("LinearLayoutViewer");
        var layout = new lively.morphic.Morph();
        layout.setFill(Color.white);
        this.OFFSET = 20;
        this.currentX = layout.OFFSET;
        layout.setName("LinearLayout");
        var container = this.getSubmorphsByAttribute("name","Container")[0];
        container.addMorph(layout);
        layout.setExtent(pt(container.getExtent().x-6,container.getExtent().y-6));
        layout.setPosition(pt(3,3));
        layout.layout = {
            resizeHeight: true,
            resizeWidth: true
        }
    },
    
    addElement: function(element){
        var layout = this.getSubmorphsByAttribute("name","LinearLayout")[0];
        var morph = element.morph.duplicate();
        morph.setPosition(pt(this.currentX, layout.getExtent().y - morph.getExtent().y));
        this.currentX = this.currentX + morph.getExtent().x + this.OFFSET;
        layout.addMorph(morph);
    },
    
    clear: function(){
        var layout = this.getSubmorphsByAttribute("name","LinearLayout")[0];
        this.currentX = this.OFFSET;
        layout.removeAllMorphs();
    },
    
    updateComponent: function() {
        // create linear layout containing rects from data
        var bar;
        this.clear();
        for (bar in this.data) {
            if (this.data.hasOwnProperty(bar)) {
                this.addElement(this.data[bar]);
            }
        }
    }
} );
cop.create('FixLoadingLayer').refineClass(lively.morphic.Layout.TileLayout, {
    basicLayout: function(container, submorphs) {
        try {
        var result = cop.proceed(container, submorphs);
        } catch(e){
            console.log("Error during layout: " + e);
            return null;
        }
        return result;
    }}
).beGlobal();

lively.morphic.Charts.Component.subclass("lively.morphic.Charts.FreeLayout", {
    
    initialize: function($super) {
        $super();
        var description = this.getSubmorphsByAttribute("name","Description")[0];
        description.setTextString("FreeLayout");
        var layout = new lively.morphic.Morph();
        layout.setFill(Color.white);
        layout.setName("Canvas");
        var container = this.getSubmorphsByAttribute("name","Container")[0];
        container.addMorph(layout);
        layout.setExtent(pt(container.getExtent().x-6,container.getExtent().y-6));
        layout.setPosition(pt(3,3));
        layout.layout = {
            resizeHeight: true,
            resizeWidth: true
        };
    },
    
    updateComponent: function(){
        // create linear layout containing rects from data
        var morph = new lively.morphic.Box(new rect(0,0,10,10));
        this.clear();
        var _this = this;
        this.data.each(function(datum){
            _this.addElement(datum,morph);
        })
        var layout = this.getSubmorphsByAttribute("name","Canvas")[0];
        layout.addMorph(morph);
    },
    
    addElement: function(element, container){
        var morph = element.morph.duplicate()
        container.addMorph(morph);
    },

    scale: function() {
        var margin = 15;
        var canvas = this.getSubmorphsByAttribute("name","Canvas").first();
        var ownWidth = canvas.getExtent().x - margin;
        var ownHeight = canvas.getExtent().y - margin;
        var maxX = 1;
        var maxY = 1;
        
        canvas.submorphs.forEach(function(morph) {
            var x = morph.getBounds().right();
            var y = morph.getBounds().bottom();
            
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        });
        
        var scaleFactor = Math.min(ownWidth/maxX, ownHeight/maxY);
        
        canvas.submorphs.forEach(function(morph) {
            var x = morph.getPosition().x * scaleFactor;
            var y = morph.getPosition().y * scaleFactor;
            
            morph.setPosition(pt(x,y));
        });
        
    },

    onResizeEnd: function($super) {        
        $super();
        this.scale();
    },
    
    clear: function(){
        var layout = this.getSubmorphsByAttribute("name","Canvas")[0];
        layout.removeAllMorphs();
    }
    
} );

lively.morphic.CodeEditor.subclass('lively.morphic.Charts.CodeEditor',
{
    initialize: function($super) {
        $super();
        this.disableGutter();
    },
    
    boundEval: function(codeStr) {
        var ctx = this.getDoitContext() || this;
        ctx.refreshData();
        
        var __evalStatement = "(function() {var arrangeOnPath = " + this.arrangeOnPath + "; var createConnection = " + this.createConnection + "; var data = ctx.data; str = eval(codeStr); ctx.data = data; return str;}).call(ctx);"
        
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

        // find owner which is Charts.Component as the CodeEditor could be nested deep inside it
        for (var i = 0; i < ownerChain.length; i++) {       
            if (ownerChain[i] instanceof lively.morphic.Charts.Component){
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
        
        var sel = this.getSelection();
        if (sel && sel.isEmpty()) sel.selectLine();
        return result;
    },
    
    onKeyUp: function(evt) {
        // deliver CodeEditor context to onChanged
        var _this = evt.getTargetMorph();
        _this.onChanged.apply(_this, arguments);
    },
    
    arrangeOnPath: function(path, entity) {
    	var morphs = entity.pluck("morph");
	
    	if (!morphs.length)
    	    return;
    	
    	// determine overall length of the path
    	var length = path.reduce(function (sum, cur, i, all) {
    		if (i > 0)
    			return sum + cur.dist(all[i - 1]);
    		else
    			return sum;
    	}, 0);
      
        var distance;
        if (path[0].equals(path[path.length - 1])) {
            // path is closed, leave space between last and first element
    	    distance = length / (morphs.length);
        } else {
            // path is open, distribute elements evenly from start to end
            distance = length / (morphs.length - 1);
        }
        
        // set position of first morph and remove it from the array
        morphs[0].setPosition(path[0]);
        morphs.splice(0, 1);
    
    	var curPt = path[0];
    	var curPathIndex = 1;
    
    	morphs.each( function (morph, index) {
    		var distanceToTravel = distance;
    		while (distanceToTravel) {
    			var pieceLength = curPt.dist(path[curPathIndex]);
    			if (pieceLength >= distanceToTravel || index == morphs.length - 1) {
    				var direction = path[curPathIndex].subPt(curPt);
    				curPt = curPt.addPt(direction.normalized().scaleBy(distanceToTravel));
    				morph.setPosition(curPt);
    				distanceToTravel = 0;
    			} else {
    				curPt = path[curPathIndex];
    				curPathIndex++;
    				distanceToTravel -= pieceLength;
    			}
    		}
    	})
    },
    createConnection: function (entity1, entity2, connections) {
        connections.each( function (conn) {
            conn.morph.setEnd = function (point) {this.setVertices([pt(0, 0), point.subPt(this.getPosition())])};
            // var from = conn["get" + entity1]();
            // var to = conn["get" + entity2]();
            var from = conn[entity1];
            var to = conn[entity2];
            if (to.morph && from.morph) {
                connect(from.morph, "position", conn.morph, "setPosition", {});
                connect(to.morph, "position", conn.morph, "setEnd", {});
            }
        });
    }

});

lively.morphic.Charts.Component.subclass('lively.morphic.Charts.Prototype',
'default category', {
    
    throwError: function(e) {
        var text = this.get("ErrorText");
        text.setTextString(e.toString());
        text.error = e;
        e.alreadyThrown = true;
        throw e;
    },
    
    updateComponent : function($super) {
        var _this = this;
        c = this.get("CodeEditor");
        
        var text = this.get("ErrorText");
        text.setTextString("");
        text.error = null;
        
        if (this.data) {
            var prototypeMorph = this.get("PrototypeMorph");
            
            (function attachListener() {
                if (prototypeMorph.__isListenedTo == true)
                    return;
                prototypeMorph.__isListenedTo = true;
                
                var methods = ["setExtent", "setFill", "setRotation"];
                
                methods.each(function(ea) {
                   var oldFn = prototypeMorph[ea];
                   
                   prototypeMorph[ea] = function() {
                       oldFn.apply(prototypeMorph, arguments);
                       _this.update();
                   }
                });
            })();
            
            if (prototypeMorph) {
                var mappingFunction;
                eval("mappingFunction = " + c.getTextString());
                
                this.data = this.data.map(function(ea) {
                    var prototypeInstance = prototypeMorph.copy();
                    mappingFunction(prototypeInstance, ea);
                    // ensure that each datum is a object (primitives will get wrapped here)
                    ea = ({}).valueOf.call(ea);
                    ea.morph = prototypeInstance;
                    return ea;
                });
            } else {
                alert("No morph with name 'PrototypeMorph' found");
            }
        }
    },
    
    initialize : function($super){
        $super();
        this.getSubmorphsByAttribute("name","Description")[0].setTextString("Prototype Component");
        var container = this.getSubmorphsByAttribute("name","Container")[0];
        
        var codeEditor = new lively.morphic.Charts.CodeEditor();
        codeEditor.setName("CodeEditor");
        codeEditor.setPosition(pt(3,3));
        codeEditor.setTextString("// Use the data, Luke! \nfunction map(morph, datum) {\n\tvar e = morph.getExtent(); \n\tmorph.setExtent(pt(e.x, datum * 100\n))}");
        codeEditor.setExtent(pt(container.getExtent().x-150,container.getExtent().y-6));
        codeEditor.layout = {resizeWidth: true, resizeHeight: true};
        container.addMorph(codeEditor);
        
        var prototypeMorph = new lively.morphic.Box(new rect(0,0,100,100));
        prototypeMorph.setFill(Color.blue);
        prototypeMorph.setName("PrototypeMorph");
        prototypeMorph.layout = {moveHorizontal: true, moveVertical: true};
        container.addMorph(prototypeMorph);
        prototypeMorph.setPosition(pt(container.getExtent().x-125,container.getExtent().y-150));
    },
    
    migrateFromPart: function(oldComponent) {
        var newCodeEditor = this.getSubmorphsByAttribute("name","CodeEditor");
        var oldCodeEditor = oldComponent.getSubmorphsByAttribute("name","CodeEditor");
        if (newCodeEditor.size() > 0 && oldCodeEditor.size() > 0){
            newCodeEditor = newCodeEditor[0];
            oldCodeEditor = oldCodeEditor[0];
            newCodeEditor.setTextString(oldCodeEditor.getTextString());
        }
        var newPrototype = this.getSubmorphsByAttribute("name","PrototypeMorph");
        var oldPrototype = oldComponent.getSubmorphsByAttribute("name","PrototypeMorph");
        var container = this.getSubmorphsByAttribute("name","Container");
        
        if (newPrototype.size() > 0 ){
            newPrototype[0].remove();
            oldPrototype = oldPrototype[0];
            container = container[0];
            
            container.addMorph(oldPrototype);
        }
    }
});
lively.morphic.Charts.Component.subclass('lively.morphic.Charts.Table', {
    
    initialize : function($super){
        $super();
        this.getSubmorphsByAttribute("name","Description")[0].setTextString("Table");
        
        this.table = this.clearTable();
         
        this.rows = 0;
        this.columns = 0;
        //this.cellWidth = 80;
    },
    
    createTable : function(row, column) {
        var spec = {};
        spec.showColHeads = true;
        spec.showRowHeads = false;
        this.columns = column;
        this.rows = row;
            
        var table = new lively.morphic.DataGrid(row, column, spec);
        this.table.defaultCellWidth = this.defaultCellWidth;
        //set gridmode of table cells to hidden
        table.rows.each(function(row){
            row.each(function(ea){
                ea.setClipMode("hidden");
            });
        });
        
        return table;
    },
    
    updateTable : function(){
        var container = this.getSubmorphsByAttribute("name","Container")[0];
        container.submorphs.invoke("remove");
        this.table.setClipMode("scroll");
        container.addMorph(this.table);
        this.table.setPosition(pt(3,3));
        this.table.setExtent(container.getExtent().subPt(pt(6,6)));
        this.table.layout = {resizeWidth: true, resizeHeight: true};
    },
    
    updateComponent : function(){
        if (!this.data) {
            this.clearTable();
            return;
        }
        
        if (!(this.data.first() instanceof Array)){
            var attributes = [];
            this.data.each(function(ea){
                var key;
                for ( key in ea){
                    if (attributes.indexOf(key) == -1)
                        attributes.push(key);
                }
            })
            this.table = this.createTable(attributes.length,this.data.length+1);
            this.table.setColNames(attributes);
        } else {
            this.table = this.createTable(this.data[0].length,this.data.length+1);
        }
        
        var _this = this;
        this.data.each(function (ea,col){
            if (ea instanceof Array) {
                ea.each(function (el,row){
                    _this.table.atPut(row,col,el.toString())
                });
            } else {
                attributes.each(function (attr,row){
                    var content = ea[attr];
                    if (!content) 
                        content = "-";
                    _this.table.atPut(row,col,content);
                });
            }
            
        });
        this.updateTable();
    },
    
    clearTable : function() {
        this.table = this.createTable(0,0);
        this.updateTable();
    },
    
    onDoubleClick : function() {
        this.updateCellWidth();
    },
    
    onClick : function() {
       
    },
    
    updateCellWidth : function(){
        if(!this.table) return;
        
        var table = this.table;
        var activeCell = table.rows[table.getActiveRowIndex()][table.getActiveColIndex()];
        var oldWidth = activeCell.getExtent().x;
        var newWidth = activeCell.getTextString().length*10;
        var index = table.getActiveColIndex();
        table.setColWidth(index,newWidth);
        var diff = (activeCell.getExtent().x-oldWidth);

        //move all column right of index
        for (var j = index+1; j<table.rows[0].length;j++ )
            for (var i = 0; i < table.rows.length; i++) {
                var curCell = table.rows[i][j];
                var pos = curCell.getPosition();
                curCell.setPosition(pt(pos.x+diff,pos.y));
            }
    },
    
});
lively.morphic.Charts.Component.subclass('lively.morphic.Charts.Script',
'default category', {
    
    initialize : function($super){
        $super();
        this.getSubmorphsByAttribute("name","Description")[0].setTextString("Script");
        var container = this.getSubmorphsByAttribute("name","Container")[0];
        
        var codeEditor = new lively.morphic.Charts.CodeEditor();
        codeEditor.setPosition(pt(3,3));
        codeEditor.setTextString("// Use the data, Luke!");
        codeEditor.setName("CodeEditor");
        codeEditor.setExtent(pt(container.getExtent().x-6,container.getExtent().y-6));
        codeEditor.layout = {resizeWidth: true, resizeHeight: true};
        container.addMorph(codeEditor);
    },
    
    updateComponent: function() {
        var c = this.getSubmorphsByAttribute("name","CodeEditor")[0];
        c.doitContext = this;
        
        if (!c.getSelectionRangeAce())
            return;
        
        var text = this.get("ErrorText");
        text.setTextString("");
        text.error = null;
        
        var returnValue = c.evalAll();
        
        if (returnValue instanceof Error) {
            this.throwError(returnValue);
        }
    },
    
    migrateFromPart: function(oldComponent) {
        var newCodeEditor = this.getSubmorphsByAttribute("name","CodeEditor");
        var oldCodeEditor = oldComponent.getSubmorphsByAttribute("name","CodeEditor");
        if (newCodeEditor.size() > 0 && oldCodeEditor.size() > 0){
            newCodeEditor = newCodeEditor[0];
            oldCodeEditor = oldCodeEditor[0];
            newCodeEditor.setTextString(oldCodeEditor.getTextString());
        }
    }
});

lively.morphic.Charts.Component.subclass('lively.morphic.Charts.Fan',
'default category', {
    
    initialize : function($super){
        $super();
        //delete Minimizer
        var minimizer = this.getSubmorphsByAttribute("name","Minimizer");
        if (minimizer.length)
        {
            minimizer[0].remove();
        }
        //delete container
        var container = this.getSubmorphsByAttribute("name","Container");
        if (container.length)
        {
            container[0].remove();
        }
    },

    updateComponent: function() {
        // do nothing
    },

    calculateSnappingPosition: function() {
        var componentsAbove = this.getComponentsInDirection(-1);
        var componentAbove;
        if (componentsAbove.length > 0)
            componentAbove = componentsAbove.first();

        if (componentAbove && !componentAbove.isMerger()) {
            // snap below component above
            var posBelowComponent = componentAbove.getPosition().addPt(pt(0,componentAbove.getExtent().y + this.componentOffset));
            var snappingThreshold = 200;
            if (this.getPositionInWorld().y < posBelowComponent.y + snappingThreshold) {
                // snap directly below component above
                return posBelowComponent;
            }
            // snap into column of component above
            var yGrid = this.calculateSnappingPositionInGrid().y;
            return pt(posBelowComponent.x, yGrid);
        } else {
            return this.calculateSnappingPositionInGrid();
        }
    },

    calculateSnappingExtent: function(ignoreComponentAbove) {
        
        var componentsAbove = this.getComponentsInDirection(-1);
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
        
        if (componentsAbove.length > 0  && !ignoreComponentAbove) {
            // calculate extent depending on the extent of some other component
            
            if (componentsAbove.length == 1) {
                width = componentsAbove[0].getExtent().x;
            } else {
                var componentXes = componentsAbove.map(function(ea) { return ea.getPosition().x });
                var width = componentXes.max() - componentXes.min();
                width += componentsAbove.last().getExtent().x;
                width = Math.max(100, width);
            }
            return pt(width, Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY);
        } else {
            // calculate new extent depending on raster
            var x = Math.floor(oldExtent.x / this.gridWidth) * this.gridWidth + offsetX;
            var y = Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY;
            return pt(x,y);
        }
    },

    isMerger: function() {
        return true;
    },
});

lively.morphic.Charts.Fan.subclass('lively.morphic.Charts.FanIn',
'default category', {

    initialize : function($super){
        $super();
        var label = this.getSubmorphsByAttribute("name","Description")[0];
        label.setTextString("FanIn");
        this.setExtent(pt(this.getExtent().x,50));
    },

    refreshData: function() {
        this.data = null;
    
        var componentsAbove = this.getComponentsInDirection(-1);
        for (var i = 0; i < componentsAbove.length; i++) {
            this.data = this.data || [];
            this.data.push(componentsAbove[i].getData(this));
        }
    },
});
lively.morphic.Charts.Fan.subclass('lively.morphic.Charts.FanOut',
'default category', {
    
    initialize : function($super){
        $super();

        //delete arrow
        this.arrows[0].remove();
        this.arrows.clear();

        var label = this.getSubmorphsByAttribute("name","Description")[0];
        label.setTextString("FanOut");
        this.setExtent(pt(this.getExtent().x,50));
    },
    refreshData: function() {
        this.data = null;

        // take the first component to the top
        // if there are multiple ones take the first from the left
        var componentsAbove = this.getComponentInDirection(-1);
        if (componentsAbove)
            this.data = componentsAbove.getData(this);
    },

    
    getData : function(target){
        var arrowToTarget = this.arrows.detect(function (arrow){
            var arrowX =  arrow.getTipPosition().x;
            return target.getPosition().x <= arrowX &&
                arrowX <= target.getPosition().x + target.getExtent().x;
        });
        
        if (!arrowToTarget){
            //create new arrow for this target
            var offset = this.getPosition().x;
            var positionX = target.getExtent().x / 2 + target.getPosition().x - 20 - offset;
            var newArrow = new lively.morphic.Charts.Arrow(this, positionX);
            newArrow.activate();
            return this.data;
        }
        
        if (arrowToTarget.isActive()) {
            return this.data;
        }
        
        return null;
    }
});
lively.morphic.Morph.subclass("lively.morphic.Charts.Minimizer",
{
    initialize: function($super) {
        $super();
        this.setFillOpacity(0);
        this.setExtent(pt(50, 43));
        this.setName("Minimizer");
        var vertices = [pt(10,13), pt(25,25), pt(40,13)];
        this.addMorph(new lively.morphic.Path(vertices));
        this.submorphs[0].disableEvents();
    },
    
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown() && !e.isCtrlDown()) {
            var isMinimized = this.owner.getExtent().y == 60;
            if (isMinimized) {
                this.owner.setExtent(pt(this.owner.getExtent().x, this.oldY), true);
                var container = this.owner.getSubmorphsByAttribute("name","Container");
                if (container.length > 0){
                    container[0].setVisible(true);
                }
            }
            else {
                this.oldY = this.owner.getExtent().y;
                var container = this.owner.getSubmorphsByAttribute("name","Container");
                if (container.length > 0){
                    container[0].setVisible(false);
                }
                this.owner.setExtent(pt(this.owner.getExtent().x, 60), true);
            }
        }
    }
});
Object.subclass('lively.morphic.Charts.EntityFactory',
'default category', {

    initialize: function($super) { },

    createEntityTypeFromList : function(entityTypeName, list, identityFunction) {

        var createEntityTypeFromList, _makeEntityType, _addBackReferencesTo, __extractEntityTypeFromList;

        createEntityTypeFromList = function(entityTypeName, list, identityFunction) {
          return _makeEntityType(entityTypeName, list);
        };

        __extractEntityFromAttribute = function (entityTypeName, identityFunction, sourceName) {
          return this.extractEntityFromList(entityTypeName, identityFunction, sourceName, true);
        };

        __extractEntityTypeFromList = function (entityTypeName, identityFunction, sourceListName, noArray) {
            var isFunction = function (functionToCheck) {
               var getType = {};
               return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
            };

          if (!isFunction(identityFunction)) {
              var attr = identityFunction;

              identityFunction = function(ea) { return ea[attr] };
          }

          var currentEntityType = this;
          var allNewEntities = {};

          var _getOrAdd = function(file) {
              var id = identityFunction(file);
              if (allNewEntities[id])
                  return allNewEntities[id];
              else {
                  allNewEntities[id] = file;
                  return file;
              }
          };

          currentEntityType.getAll().each(function(eachCurrentEntity) {
            var newEntities;
            if (noArray) {
              eachNewEntity = eachCurrentEntity[sourceListName];
              // replace the reference in the array to avoid multiple objects for the same entity
              eachCurrentEntity[sourceListName] = _getOrAdd(eachNewEntity);
              currentEntityType._addBackReferencesTo(eachNewEntity, eachCurrentEntity);
            } else {
              newEntities = eachCurrentEntity[sourceListName];
              newEntities.each(function(eachNewEntity, index) {
                eachNewEntity = _getOrAdd(eachNewEntity);
                // replace the reference in the array to avoid multiple objects for the same entity
                newEntities[index] = eachNewEntity;
                currentEntityType._addBackReferencesTo(eachNewEntity, eachCurrentEntity);
              });
            }
              

            

          });
    
          // convert to array
          allNewEntities = Properties.own(allNewEntities).map(function(key) {return allNewEntities[key]})

          return _makeEntityType(entityTypeName, allNewEntities);
        };

        _makeEntityType = function(entityTypeName, list) {

          var Entity = {
            items : list,
            entityTypeName : entityTypeName,
            itemsProto : {}
          };

          var proto = {
            extractEntityFromList : __extractEntityTypeFromList,
            extractEntityFromAttribute : __extractEntityFromAttribute,
            _addBackReferencesTo : _addBackReferencesTo,
            getAll : function() { return Entity.items }
          };

          Entity.__proto__ = proto;

          Entity.setIdentityAttribute = function(attributeGetter) {

            Entity.items = Entity.getAll().uniqBy(function(a, b) { return attributeGetter(a) == attributeGetter(b) });

            // Entity.getIdentity = ... ?

            return Entity.items;
          };

          Entity.mapTo = function() {
            console.warn("yet to implement");
          }

          return Entity;
        };

        _addBackReferencesTo = function(entity, reference) {

          var attribute = "referencing" + this.entityTypeName + "s";

          if (!entity[attribute])
            entity[attribute] = [];

          entity[attribute].push(reference);

          Object.defineProperty(entity, attribute, {
            enumerable: false,
            writable: true
          });

          entity["get" + this.entityTypeName + "s"] = function() {
            return this[attribute];
          };

          return entity;
        };

        return _makeEntityType(entityTypeName, list);
    },



});



}) // end of module
