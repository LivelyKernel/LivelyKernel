module('lively.morphic.IPadWidgets').requires('lively.morphic.AdditionalMorphs').toRun(function() {


lively.morphic.Box.subclass('lively.morphic.TouchList',
'properties', {
    defaultExtent: pt(340,280),
    defaultItemHeight: 40,
    defaultItemGradient: new lively.morphic.LinearGradient([
        {offset: 0, color: Color.rgb(253,253,253)},
        {offset: 1, color: Color.rgb(238,238,238)}
    ], 'northSouth'),
    defaultTextColor: Color.rgb(47,47,47),
    defaultActiveGradient: new lively.morphic.LinearGradient([
        {offset: 0, color: Color.rgb(47,47,47)},
        {offset:0.5,color: Color.rgb(21,21,21)},
        {offset: 1, color: Color.rgb(0,0,0)}
    ], 'northSouth'),
    defaultActiveTextColor: Color.rgb(222,222,222),
    defaultItemBorderColor: Color.rgb(138,138,138),
},
'initializing', {
    initialize: function($super, bounds, optItems) {
        $super(bounds);
        this.itemList = [];
        this.selection = null;
        this.selectedLineNo = -1;
        this.createList();
        this.disableSelection();
        this.reset();
    },
    createList: function() {
        this.setExtent(pt(this.defaultExtent));
        return this.addMorph(this.createSubmenuContainer());
    },
    createSubmenuContainer: function() {
        var container = new lively.morphic.Box(pt(0,0).extent(this.defaultExtent));
        container.setName('SubmenuContainer');
        container.addMorph(this.createListItemContainer());
        return container;
    },
    createListItemContainer: function() {
        return new lively.morphic.ListItemContainer(rect(0,0,this.defaultExtent.x,this.defaultItemHeight))
    },
    reset: function() {
        this.disableDropping();
        this.submorphs.invoke('disableDropping');
        this.setup([]);
    },
    setup: function(itemList) {
        this.selection = null;
        this.selectedLineNo = -1;
        this.selectedMorph = null;
        this.setClipMode("hidden");
        this.titleStack = [];
        this.containerStack = [];
        var container = this.getCurrentContainer();
        this.get("SubmenuContainer").removeAllMorphs();
        this.get("SubmenuContainer").addMorph(container);
        this.currentContainer = container;
        this.get("SubmenuContainer").setPosition(pt(0,0));
        this.submenusDisabled = false;
        //world menu entries
        this.createMenuItems(itemList);
    },
},
'list interface', {
    include: function(touch){
        for(var i = 0; i < this.length; i++){
            if(this[i] === touch){
                return true;
            }
        }
        return false;
    },
    addItem: function(item) {
        var newMorph = this.createListItem(item);
        this.getCurrentContainer().addItem(newMorph);
    },
    updateSelection: function(newSelectedMorph) {
        var hasText = true;
        if(this.selectedMorph) {
            hasText = this.selectedMorph.submorphs[0];
            this.selectedMorph.setFill(this.defaultItemGradient);
            if(hasText) {
                this.selectedMorph.submorphs[0].setTextColor(this.defaultTextColor);
            }
        }
        hasText = newSelectedMorph.submorphs[0];
        if(hasText) {
            this.selection = newSelectedMorph.item.value;
            if (this.selection[1] instanceof Array && !this.submenusDisabled) {
                this.openSubMenu(this.selection);
                return;
            }
            
        } else {
            this.selection = null;
        }
        this.selectedLineNo = newSelectedMorph.index;
        this.selectedMorph = newSelectedMorph;
        this.selectedMorph.setFill(this.defaultActiveGradient);
        
        if(hasText) {
            this.selectedMorph.submorphs[0].setTextColor(this.defaultActiveTextColor);
        }
    },
    openSubMenu: function(selection) {
        (function () {
            this.titleStack.push(this.title);
            this.containerStack.push(this.getCurrentContainer());
            this.title = selection[0];
            var offset = this.getExtent().x * this.getLevel();
            var container;
            if(this.nextContainer){
                container = this.nextContainer;
                delete this.nextContainer;
            } else {
                container = this.createContainer();
            }
            container.setPosition(pt(offset, 0));
            this.get("SubmenuContainer").addMorph(container);
            this.currentContainer = container;
            this.addMenuItems(selection[1]);
            var that = this;
            this.get("SubmenuContainer").setPositionAnimated(pt(-offset, 0), 500, function(){
                that.nextContainer = that.createContainer();
            });
        }).bind(this).delay(0);
    },
    openSuperMenu: function() {
        if(this.getLevel() <= 0) {
            return;
        }
        this.title = this.titleStack.pop();
        
        var offset = this.getExtent().x * this.getLevel();

        var that = this;
        var callbackFct = function() {
            that.getCurrentContainer().remove();
            that.currentContainer = that.containerStack.pop();
        };
        this.get("SubmenuContainer").setPositionAnimated(pt(-offset, 0), 500, callbackFct);
    },
    updateList: function(items) {
        this.selection = null;
        this.selectedLineNo = -1;
        this.selectedMorph = null;
        this.setClipMode("hidden");
        this.titleStack = [];
        this.containerStack = [];
        var container = this.getCurrentContainer();
        this.get("SubmenuContainer").removeAllMorphs();
        this.get("SubmenuContainer").addMorph(container);
        this.currentContainer = container;
        this.get("SubmenuContainer").setPosition(pt(0,0));
        //world menu entries
        this.removeAllMenuItems();
        this.submenusDisabled = true;
        var that = this;
        items.forEach(function (item) {
            that.addItem({string: item, value: item, isListItem: true});
        });
    },
},
'events', {
    onTouchStart: function(evt) {
        this.getCurrentContainer().onTouchStart(evt);
    },
    onTouchMove: function(evt) {
        this.getCurrentContainer().onTouchMove(evt);
    },
    onTouchEnd: function(evt) {
        this.getCurrentContainer().onTouchEnd(evt);
    },
},
'private functions', {
    getCurrentContainer: function() {
        if(!this.currentContainer){
            this.currentContainer = this.get("SubmenuContainer").submorphs[0];
        }
        return this.currentContainer;
        },
        createMenuItems: function(items) {
        this.removeAllMenuItems();
        this.addMenuItems(items);
        },
        addMenuItems: function(items) {
        var that = this;
        items.forEach(function (item) {
            if(typeof item === "string") {
                that.addItem({string: item, value: item, isListItem: true});
            } else {
                that.addItem({string: item[0], value: item, isListItem: true});
            }
            
        });
    },
    removeAllMenuItems: function() {
        this.getCurrentContainer().removeAllMenuItems();
        while(this.containerStack.length > 0){
            this.getCurrentContainer().remove();
            this.currentContainer = containerStack.pop();
            this.currentContainer.removeAllMenuItems();
        }
        this.containerPrototype = this.createContainerPrototype();
        this.nextContainer = this.createContainer();
        this.titleStack = [];
        this.containerStack = [];
    },
    createContainerPrototype: function() {
        var container = this.getCurrentContainer().copy();
        container.removeAllMenuItems();
        return container;
    },
    createContainer: function() {
        var container = this.containerPrototype.copy();
        container.removeAllMenuItems();
        return container;
    },
    createListItem: function(item) {
        //TODO: It should take texts as well as objects to provide list interface compatability
        var textString = item.string;
        var part = new lively.morphic.ListItem(window.rect(0,0,this.getExtent().x,this.defaultItemHeight));
        part.name = "MenuItem_" + textString;
        part.item = item;
        part.applyStyle({
            fill: this.defaultItemGradient,
            resizeWidth: true,
            borderColor: this.defaultItemBorderColor,
            borderWidth: 1,
            fontSize: 14,
            textColor: this.defaultTextColor,
            fontFamily: "Helvetica, Arial, sans-serif",
            padding: Rectangle.inset(10,10),
            fontWeight: 'bold'
        });
        part.setTextString(textString);
        part.disableHalos();
        part.disableSelection();
        if (item.value[1] instanceof Array && !this.submenusDisabled) {
            var rect = new Rectangle(0,0, 15, 15),
            icon = new lively.morphic.Image(rect, "http://lively-kernel.org/repository/webwerkstatt/projects/BP2012/UI/ipadMenu/submenu.png", false);
            var xPos = part.getExtent().subPt(icon.getExtent().scaleBy(1.5)).x,
                yPos = part.getExtent().subPt(icon.getExtent()).scaleBy(0.5).y;
            icon.setPosition(pt(xPos,yPos))
            icon.disableHalos();
            icon.disableSelection();
            icon.ignoreEvents();
            part.addMorph(icon)
        }
        return part;
    },
    getLevel: function() {
        return this.titleStack.length;
    },
});

lively.morphic.Box.subclass('lively.morphic.ListItemContainer',
'properties', {
    defaultItemHeight: 40,
},
'default category', {
    isInBounds: function() {
        var yPos = Math.min(0,Math.max(-this.maxScroll, this.getPosition().y));
        var delta = this.getPosition().y-yPos;

        return Math.abs(delta)<=0.02;
    },
    onTouchEnd: function(evt) {
        var lastUpdate = new Date().valueOf();
        this.isTouched = false;
        var that = this;
        if(!this.isInBounds()) {
            this.velocity = 0;
            var yPos = Math.min(0,Math.max(-this.maxScroll, this.getPosition().y));
            this.setPositionAnimated(pt(this.getPosition().x,yPos),500)
        }
    },
    onTouchMove: function(evt) {
        evt.stop();
        var touch = evt.touches[0];
        if(touch && touch.originalDragOffset) {
            var x = this.getPosition().x;

            var delta = (touch.clientY - touch.originalDragOffset) / this.owner.owner.owner.getScale();
            this.setPositionAnimated(pt(x,touch.originalMenuOffset+delta),0);
            if(!this.isInBounds()) {
                var yPos = Math.min(0,Math.max(-this.maxScroll, this.getPosition().y));
                delta = this.getPosition().y-yPos;
                this.moveByAnimated(pt(0,-delta/2),0)
            }
            var positionDelta = touch.lastTouch - touch.clientY;
            var now = new Date().valueOf();
            var timeDelta = now - touch.lastUpdate;
            timeDelta = Math.max(1, timeDelta);
            touch.lastTouch = touch.clientY;
            touch.lastUpdate = now;
            this.velocity = positionDelta*(-10 / timeDelta);
        }
        return true;
    },
    onTouchStart: function(evt) {
        evt.stop();

        var touch = evt.touches[0];

        if(touch) {
            touch.originalDragOffset = touch.clientY;
            touch.originalMenuOffset = this.getPosition().y;

            var heightMenu = this.itemList.length * 43;
            var heightContainer = this.owner.getExtent().y;
            this.maxScroll = heightMenu - heightContainer;

            this.isTouched = true;
            this.velocity = 0;
            touch.lastTouch = touch.clientY;
            touch.lastUpdate = new Date().valueOf();
        }
        return true;
    },
    stayInBounds: function() {
        var yPos = Math.min(0,Math.max(-this.maxScroll, this.getPosition().y));
        var delta = this.getPosition().y-yPos;

        if(this.velocity*delta > 0) {
            // out of bounds and velocity is in wrong direction
            this.velocity -= delta/15;
        } else if(delta !== 0) {
            this.velocity = -delta/15;
        }
    },
    initialize: function($super, bounds) {
        $super(bounds);
        this.itemList = [];
    },
    removeAllMenuItems: function() {
        this.itemList = [];
        this.setPosition(pt(0,0));
        //TODO: invoke remove on submorphs.copy instead?
        this.submorphs.invoke("remove");
    },
    addItem: function(morph) {
        morph.disableDropping();
        this.itemList = this.itemList || [];
        morph.setPosition(pt(0,this.itemList.length*this.defaultItemHeight));
        this.itemList.push(morph);
        this.addMorph(morph);
    },
});

lively.morphic.Text.subclass('lively.morphic.ListItem',
'default category', {
    initialize: function($super, bounds) {
        $super(bounds);
    },
    onTouchStart: function(evt) {
        var touch = evt.touches[0];

        this.clickPosition = pt(touch.clientX,touch.clientY);
        this.lastClickPos = this.clickPosition;

        return false;
    },
    onTouchMove: function(evt) {
        var touch = evt.touches[0];
        
        this.lastClickPos = pt(touch.clientX,touch.clientY);

        return false;
    },
    onTouchEnd: function(evt) {
        var deltaPt = this.lastClickPos.subPt(this.clickPosition);
        var delta = deltaPt.x*deltaPt.x + deltaPt.y*deltaPt.y;
        if(delta<25) {
            //TODO: find a better way to find the related listMorph
            var listMorph = this.owner.owner.owner;

            if(listMorph && listMorph.updateSelection) {
                listMorph.updateSelection(this);
            }
        }
        return false;
    },
});

lively.morphic.Text.subclass('lively.morphic.FlapHandle', 
'properties', {
    defaultAlignment: 'left',
    style: {
        fill: Color.rgba(235,235,235,0.8),
        borderRadius: 15,
        extent: pt(100,40),
        borderWidth: 1,
        borderColor: Color.rgb(138,138,138),
        fixedHeight: true,
        fixedWidth: false,
        padding: Rectangle.inset(9,9),
        enableHalos: false,
        align: 'center',
        fontSize: 14
    },
},
'initialization', {
    initialize: function ($super, handleName, alignment) {
        $super(rect(0,0,0,0));
        this.alignment = alignment
        this.determineRotation();
        this.applyStyle(this.style);
        this.setTextString(handleName);
        return this
    },
    determineRotation: function() {
        switch (this.alignment) {
            case 'left': {
                this.style.rotation = (90).toRadians();
                break;
            };
            case 'top': {
                this.style.rotation = 0;
                break;
            };
            case 'right': {
                this.style.rotation = (90).toRadians();
                break;
            };
            case 'bottom': {
                this.style.rotation = 0;
                break;
            }
        }
        return this.style.rotation;
    }
},
'events', {
/* TODO: add alignment */
    onTouchEnd: function (evt) {
        var threshold = 10;
        if(this.owner.getFixedPosition().x < threshold - this.ownerExtent.x) {
            this.owner.setFixedPosition(pt(-this.ownerExtent.x,0));
        }
    },
    onTouchMove: function (evt) {
        var touchPosition = evt.getPosition();
        this.setNextPos(touchPosition)
        evt.stop();
        return true;
    },
    onTouchStart: function(evt) {
        this.ownerExtent = this.owner.getExtent();
        this.beginTouchPosition = evt.getPosition();
        this.beginMorphPosition = this.owner.getFixedPosition();
        evt.stop();
        return true;
    }
},
'positioning while moving', {
    setNextPos: function (touchPosition) {
        var pos = this.transformDelta(touchPosition);
        switch (this.alignment) {
            case 'left': {
                pos.x = Math.max(pos.x, -this.ownerExtent.x);
                pos.x = Math.min(pos.x, document.documentElement.clientWidth / 3 - this.ownerExtent.x);
                break;
            };
            case 'top': {
                pos.y = Math.max(pos.y, -this.ownerExtent.y);
                pos.y = Math.min(pos.y, document.documentElement.clientHeight/ 3 - this.ownerExtent.y)
                break
            };
            case 'right': {
                pos.x = Math.max(pos.x, this.ownerExtent.x);
                pos.x = Math.max(pos.x, document.documentElement.clientWidth * 2 / 3);
                break
            };
            case 'bottom': {
                pos.y = Math.max(pos.y, this.ownerExtent.y);
                pos.y = Math.max(pos.y, document.documentElement.clientHeight * 2 / 3);
                break
            }
        }
        this.owner.setFixedPosition(pos);
    },
    transformDelta: function(touchPosition) {
        var world = lively.morphic.World.current();
        var deltaToStart = ((this.alignment == 'left' || this.alignment == 'right') 
                    ? pt(this.beginTouchPosition.subPt(touchPosition).x,0) 
                    : pt(0, this.beginTouchPosition.subPt(touchPosition).y))
                .scaleBy(world.getZoomLevel());
        return this.beginMorphPosition.subPt(deltaToStart);
    }
})

lively.morphic.Morph.subclass('lively.morphic.Flap', 
'properties', {

    defaultExtent: pt(document.documentElement.clientWidth / 3, document.documentElement.clientHeight),
    style: {
        fill: Color.rgba(235,235,235,0.8)
    },
    isFlap: true,

},
'initialization', {
    initialize: function($super, name, alignment) {
        // alignment: 'left', 'right', 'top', 'bottom'
        $super(this.defaultShape());
        this.alignment = alignment;
        this.fitInWorld();
        this.setName(name+'Flap');
        this.initializeHandle(name, alignment);
        this.setFixed(true);
        this.fixedScale = 1;
        this.disableSelection();
        return this;
    },
    fitInWorld: function () {
        var world = lively.morphic.World.current();
        world.addMorph(this)
        this.determineExtent();
        this.determinePosition();
        this.applyStyle(this.style);
    },
    determinePosition: function () {
        var pos,
            world = lively.morphic.World.current();
        switch (this.alignment) {
            case 'left': {
                pos = pt(- this.style.extent.x, 0);
                break
            };
            case 'top': {
                pos = pt(0,- this.style.extent.y);
                break
            };
            case 'right': {
                pos = pt(document.documentElement.clientWidth, 0);
                break;
            };
            case 'bottom' : {
                pos = pt(0, document.documentElement.clientHeight);
                break
            }
        }
        this.style.position = pos.scaleBy(1 / world.getZoomLevel()).addPt(pt(document.body.scrollLeft, document.body.scrollTop))
        return this.style.position;
    },
    determineExtent: function () {
        var extent;
        switch (this.alignment)  {
            case 'left': case 'right': {
                extent = pt(document.documentElement.clientWidth / 3, document.documentElement.clientHeight);
                break;
            };
            case 'top': case 'bottom': {
                extent = pt(document.documentElement.clientWidth, document.documentElement.clientHeight / 3);
                break;
            };
        }
        this.style.extent = extent
        return this.style.extent;
    },
    initializeHandle: function (name, alignment) {
        this.flapHandle = new lively.morphic.FlapHandle(name, alignment);
        this.addMorph(this.flapHandle);
        this.flapHandle.setPosition(this.determineHandlePosition());
    },
    determineHandlePosition: function () {
        var pos,
            self = this,
            docEl = document.documentElement,
            flapCount = lively.morphic.World.current().submorphs.select(function (ea) {
                return ea.isFlap && ea !== self && ea.alignment == self.alignment
            }).length
        switch (this.alignment) {
            case 'left': {
                pos = pt(this.style.extent.x + this.flapHandle.getExtent().y, flapCount * this.flapHandle.getExtent().x)
                break;
            };
            case 'top': {
                pos = pt(docEl.clientWidth - (this.flapHandle.getExtent().x * (flapCount + 1)), this.getExtent().y)
                break;
            };
            case 'right': {
                pos = pt(0, docEl.clientHeight - (this.flapHandle.getExtent().x * (flapCount + 1)))
                break;
            };
            case 'bottom': {
                pos = pt(this.flapHandle.getExtent().x * flapCount, - this.flapHandle.getExtent().y);
                break;
            }
        }
        this.flapHandle.style.position = pos
        return pos;
    },
},
'content control', {
    createBackButton: function() {
        var okBtn = new lively.morphic.Button(new Rectangle(0, 0, 75, 25));
        var that = this;
            okBtn.onTap = function(evt) {
                
                that.list.enableEvents();
                that.list.unignoreEvents();

                that.stopAddingPartItemsAsync();
                that.categoryLabel.setTextString("");
                that.header.setVisible(false);

                that.categoryContainer.removeAllMorphs();
                that.list.openSuperMenu();
            };
            okBtn.setLabel("Back");
            return okBtn;
    },
    onTouchEnd: function(evt) {
        evt.stop();
        return true;
    },
    onTouchMove: function(evt) {
        evt.stop();
        return true;
    },
    onTouchStart: function(evt) {
        evt.stop();
        return true;
    },
    partsBinURL: function() {
        return new URL(Config.rootPath).withFilename('PartsBin/');
    },
    stopAddingPartItemsAsync: function() {
        this.stopSteppingScriptNamed('addPartItemAsync');
        delete this.partItemsToBeAdded;
    },
}) // end of subclass lively.morphic.Flap

lively.morphic.Flap.subclass('lively.morphic.PartsBinFlap', {
    initialize: function ($super) {
        $super('PartsBin', 'left');
        this.createPartsBin();
        return this
    },
    buttonStyle: {
        fill: Color.rgba(255,255,255,0.2),
        padding: pt(0,10)
    },

    addMorphsForPartItems: function(partItems) {
        this.partItemsToBeAdded = partItems.clone();
        delete this.lastPosition;
        this.startStepping(0, 'addPartItemAsync')
    },
    addPartItemAsync: function() {
        if (!this.partItemsToBeAdded || this.partItemsToBeAdded.length == 0) {
            this.stopAddingPartItemsAsync();
            return;
        }
        var partItem = this.partItemsToBeAdded.shift();
        var morph = partItem.asPartsBinItem();
        morph.setPosition(this.getAvailablePosition());
    
        morph.onTouchStart = function(evt){
            var touch = evt.touches[0];
            if(touch) {
                touch.partItemOffset = touch.screenX;
            }
        };
        morph.onTouchMove = function(evt){
            var touch = evt.touches[0];
            evt.hand.setPosition(evt.getPosition());
            if(touch && touch.partItemOffset) {
                var delta = (touch.screenX - touch.partItemOffset);
                if(delta > 100) {
                    var loadingMorph = $world.loadingMorph.copy();
                    loadingMorph.loadPart(this.partItem, function(part) {
                        part.setPosition($world.firstHand().getPosition());
                        $world.firstHand().grabMorph(part);
                    });
                    delete touch.partItemOffset;
                    touch.draggingCanceled = true;
                }
            }
        };
        morph.onTouchEnd = function(evt){
            evt.world.dispatchDrop(evt);
        },
        this.categoryContainer.addMorph(morph);
    },
        createCategoryContainer: function() {
        var box = new lively.morphic.Box(new Rectangle(0,0,100,10));
        var that = this;
        box.onTouchStart = function(evt) {
            evt.stop();
            var touch = evt.touches[0];
            if(touch) {
                touch.originalDragOffset = touch.screenY;
                touch.originalMenuOffset = this.getPosition().y;
            }
            return true;
        };

        box.onTouchMove = function(evt) {
            evt.stop();
            var touch = evt.touches[0];
            if(touch && touch.originalDragOffset && !touch.draggingCanceled) {
                var delta = (touch.screenY - touch.originalDragOffset);
                var pos = touch.originalMenuOffset+delta;
                pos = Math.max(-this.getExtent().y + that.getExtent().y, pos);
                pos = Math.min(35,pos);
                this.setPosition(pt(0,pos));
            }
            return true;
        };
        return box;
    },
    createCategoryLabel: function() {
        var text = new TextMorph(new Rectangle(0,0,100,10));
            text.applyStyle({
                fill: null,
                borderWidth: 0,
                fontSize: 14,
                textColor: Color.rgb(47,47,47),
                fontFamily: "Helvetica, Arial, sans-serif"
            });
            text.textString = "";
         return text;
    },
    createPartsBin: function() {
        this.list = new lively.morphic.TouchList(rect(0,0,0,0));
        var flap = this;
        this.list.setExtent(flap.getExtent());
        this.list.setPosition(pt(0,0));
        this.list.submorphs[0].setExtent(this.list.getExtent());
        flap.addMorph(this.list);

        this.header = new lively.morphic.Box(rect(0,0,10,10));
        this.header.setExtent(pt(this.getExtent().x, 35));
        this.header.setVisible(false);
        this.header.setFill(Color.rgb(255,208,157));
        flap.addMorph(this.header);


        var backBtn = this.createBackButton()
        backBtn.setExtent(pt(100,35));
        backBtn.setFill(Color.rgba(255,255,255,0.2))
        this.header.addMorph(backBtn);
        this.backBtn = backBtn;

        this.categoryLabel = this.createCategoryLabel();
        this.categoryLabel.setExtent(pt(500,35))
        this.categoryLabel.setPosition(pt(120,5));
        this.header.addMorph(this.categoryLabel);

        this.categoryContainer = this.createCategoryContainer();
        this.categoryContainer.setPosition(pt(0,0));
        this.categoryContainer.setExtent(flap.getExtent());
        flap.addMorphBack(this.categoryContainer);

        this.flap = flap;
        connect(this.list, "selection", this, "gotoCategory", {converter: function(input){ if(!input) return ""; return input[0]; }});
        

        this.updateCategoriesDictFromPartsBin();
    },
    ensureCategories: function() {
        if (!this.categories)
            this.categories = {uncategorized: 'PartsBin/'};

    },
    getAvailablePosition: function() {
        if(!this.lastPosition) { this.lastPosition = pt(155,-100); }
        
        if(this.lastPosition.x === 30) {
            this.lastPosition = this.lastPosition.addPt(pt(125, 0));
        } else {
            this.lastPosition = this.lastPosition.addPt(pt(-125, 125));
        }
        this.categoryContainer.setExtent(pt(this.getExtent().x, this.lastPosition.y+125));

        return this.lastPosition;
    },
    getURLForCategoryNamed: function(categoryName) {
        this.ensureCategories()

        var relative = this.categories[categoryName];
        if (!relative) return null;
        return URL.ensureAbsoluteCodeBaseURL(relative).withRelativePartsResolved()
    },
    gotoCategory: function(categoryName) {
        if(!categoryName) return;

        this.categoryLabel.setTextString(categoryName);
        this.list.disableEvents();
        this.list.ignoreEvents();
        this.header.setVisible(true);
        this.header.setFill(Color.gray)

        this.categoryContainer.setPosition(pt(0,35));

        var partsSpace = lively.PartsBin.partsSpaceWithURL(this.getURLForCategoryNamed(categoryName));
        connect(partsSpace, 'partItems', this, 'addMorphsForPartItems', {
        converter: function(partItemObj) { return Properties.ownValues(partItemObj) }})
        partsSpace.load(true);
    },
    onrestore: function() {
        (function(){
        
        var extent = pt(document.documentElement.clientWidth / 3, document.documentElement.clientHeight);
        this.setExtent(extent);

        this.setPosition(pt(-extent.x, 0).scaleBy(1 / $world.getZoomLevel()).addPt(pt(document.body.scrollLeft, document.body.scrollTop)));
        this.get("FlapHandle").setPosition(pt(extent.x + this.get("FlapHandle").getExtent().y, 50));
        this.setFixed(true);
        this.fixedScale = 1;
        this.createPartsBin();
        this.disableSelection();
        }).bind(this).delay(0);
    },
    updateCategoriesDictFromPartsBin: function() {
        this.ensureCategories();
        var webR = new WebResource(this.partsBinURL());
        webR.beAsync();
        var that = this;
        var callback = function(collections) {
            collections.forEach(function(dir) {
                var unescape = Global.urlUnescape || Global.unescape,
                unescaped = unescape(dir.getURL().filename()),
                name = unescaped.replace(/\/$/,"");
                that.categories[name] = that.partsBinURL().withFilename(unescaped);
            });
            that.updateCategoryList(that.categoryName);
        }
        connect(webR, 'subCollections', {cb: callback}, 'cb', {
            updater: function($upd, value) {
                if (!(this.sourceObj.status && this.sourceObj.status.isDone())) return;
                if (!value) return;
                $upd(value);
            },
        });
        webR.getSubElements();
    },
    updateCategoryList: function() {
        this.list.setup(
        Properties.own(this.categories).sortBy(function(name) { return name.toLowerCase() }).map(function(ea){ return [ea, []]; }));
    },
})

lively.morphic.Tab.subclass('lively.morphic.ObjectEditorTab',
'initialization', {
    initialize: function ($super, tabBar) {
        $super(tabBar)
        var tabBarHeight = this.tabBar.getExtent().y
        this.setExtent(pt(this.getExtent().x, tabBarHeight))
        this.closeButton.setExtent(pt(tabBarHeight, tabBarHeight))
        this.closeButton.setPosition(pt(this.getExtent().x - tabBarHeight, 0))
        return this
    }
},
'default', {
    closeTab: function($super) {
        if (this.pane.submorphs[0].getTextString() === this.originalScript) {
            $super();
        } else {
            if(confirm("Script "+this.fctScriptName+" has unsaved changes. Do you really want to close it?")) {
                $super();
            } else {
                this.getTabBar().activateTab(this);
            }
        }
    },
    updateChangedIndicator: function(newTextString) {
        if(newTextString !== this.originalScript) {
            this.label.setTextColor(Color.red);
        } else {
            this.label.setTextColor(Color.rgb(26,41,127));
        }
    },
    setOriginalScript: function(scriptText) {
        this.originalScript = scriptText;
        this.updateChangedIndicator(scriptText);
    },
    onTap: function() {
        this.getTabBar().activateTab(this);
    },
    setLabel: function($super, aString) {
        this.label.applyStyle({fixedWidth: false, fixedHeight: false});
        this.label.setWhiteSpaceHandling("nowrap");
        var out = $super(aString);
        var that = this;
        (function(){
            that.label.fit();
            var labelExtent = that.label.getExtent();
            that.setExtent(pt(labelExtent.x + 33, that.getExtent().y));
        }).delay(0);
    }
});

lively.morphic.TabContainer.subclass('lively.morphic.ObjectEditorTabContainer', {
    initialize: function($super, tabBarStrategy, optExtent, optTabBarHeight) {
        return $super(tabBarStrategy, optExtent, optTabBarHeight);
    },
    tabBarHeight: 40,
    scriptButtonStyle: {
        extent: pt(100,50),
    },


    buildModalViewFor: function(target){
        this.makeGridLayoutFor(target);
    },
    cleanUp: function() {
        this.gridContainer && this.gridContainer.remove();
    },
    getCategoriesFor: function(target) {
        var tags = Functions.own(target).collect(function (each) {
            return target[each].tags || [];
        }).flatten().uniq();
        var sortedTags = tags.sortBy(function(name) {
            return name.toLowerCase();
        });
        sortedTags.unshift('uncategorized');
        return sortedTags;
    },
    getSourceForScript: function(scriptName, target) {
            var script = target[scriptName],
            annotation = '',
            scriptSource = '',
            tagScript = '';
        if (script.timestamp && script.user)
            annotation = Strings.format('// changed at %s by %s  \n', script.timestamp, script.user);
        scriptSource = Strings.format('%s', script.getOriginal());
        return annotation + scriptSource;
    }, 
    makeButtonsFor: function(category, functions, column, target) {
        var text = new TextMorph(rect(0,0,10,10));
        text.setExtent(pt(100,20));
        text.fixedWidth = true;
        text.textString = category;
        text.gridCoords = pt(column,0);
        this.gridContainer.addMorph(text);
        var i = 1;
        var that = this;
        functions.forEach(function(ea){
            var button = new lively.morphic.Button(rect(0,0).extent(that.scriptButtonStyle.extent));
            button.applyStyle(this.scriptButtonStyle);
            button.setLabel(ea);
            button.fixedWidth = true;
            button.gridCoords = pt(column,i);
            button.tabContainer = that;
            button.fctName = ea;
            button.fctTarget = target;
            button.addScript(function onFire() {
                this.tabContainer.openTabFor(this.fctName, this.fctTarget);
            });
            button.onTouchStart = function (){};
            button.onTouchMove = function () {};
            button.onTouchEnd = function () {};
            connect(button, "fire", button, "onFire");
            that.gridContainer.addMorph(button);
            i++;
        });
        if(category === "uncategorized") {
            var button = new lively.morphic.Button(pt(0,0).extent(this.scriptButtonStyle.extent));
            button.applyStyle(this.scriptButtonStyle)
            button.fixedWidth = true;
            button.setLabel("add Script");
            button.gridCoords = pt(column,i);
            button.tabContainer = that;
            button.fctName = "newScript";
            button.fctTarget = target;
            button.addScript(function onFire() {
                this.fctTarget.addScript(function newScript(){

                });
                this.tabContainer.openTabFor(this.fctName, this.fctTarget);
            });
            button.onTouchStart = function (){};
            button.onTouchMove = function () {};
            button.onTouchEnd = function () {};
            connect(button, "fire", button, "onFire");
            that.gridContainer.addMorph(button);
            i++;
        }
    },
    makeGridContainer: function() {
        var container = new lively.morphic.Box((pt(0,this.tabBar.getExtent().y))
                    .extent(this.getExtent().subPt(pt(0,this.tabBar.getExtent().y))));
        var morph = new lively.morphic.Box(pt(0,0).extent(this.getExtent()));
        morph.setFill(Color.white);
        container.addMorph(morph);
        morph.disableGrabbing();
        container.setClipMode("hidden")
        this.addMorph(container);

        var that = this;
        morph.rebuildForNewTarget = function(newMorph) {
            that.makeGridLayoutFor(newMorph);
        };
        this.gridLayoutMorph = morph;
        connect($world, "currentlySelectedMorph", morph, "rebuildForNewTarget", {removeAfterUpdate: true});
        morph.onTouchStart = function(evt) {
                this.beginTouchPosition = evt.getPosition();
                this.beginMorphPosition = this.getPosition();
                evt.stop();
                return true;
        };
        morph.onTouchMove = function (evt) {
                var touchPosition = evt.getPosition();
                var deltaToStart = this.beginTouchPosition.subPt(touchPosition);
                deltaToStart = deltaToStart.scaleBy($world.getZoomLevel());
                var positionToSet = this.beginMorphPosition.subPt(deltaToStart);
                positionToSet.x = Math.max(-this.getExtent().subPt(this.owner.getExtent()).x, Math.min(0,positionToSet.x));
                positionToSet.y = Math.max(-this.getExtent().subPt(this.owner.getExtent()).y, Math.min(0,positionToSet.y));
                this.setPosition(positionToSet);
                evt.stop();
                return true;
        }
        morph.disableSelection();
        return morph;
    },
    makeGridLayoutFor: function(target) {
        var categories = this.getCategoriesFor(target);
        var functionNames = Functions.own(target);

        this.cleanUp();
        this.tabBar.getTabs().forEach(function(ea) {
                ea.deactivate();});

        var gridContainer = this.makeGridContainer();
        this.gridContainer = gridContainer;

        var that = this;
        var i = 0;
        categories.forEach(function(category) {
            var functionsForCategory = functionNames.select(function(functionName){
                if(((typeof target[functionName].tags === "undefined" || target[functionName].tags.length === 0) && category === "uncategorized") ||  
                    (typeof target[functionName].tags !== "undefined" && target[functionName].tags.include(category))) {
                    return functionName;
                }
            });
            that.makeButtonsFor(category, functionsForCategory, i, target);
            i++;
        });
        gridContainer.setLayouter(new lively.morphic.Layout.GridLayout(gridContainer, categories.length + 1, functionNames.length + 1));
        gridContainer.applyLayout();

    },
    onTouchEnd: function() {
        //TODO: this function should be in Events.js
    },
        openTabFor: function(scriptName, target) {
        //TODO: add name of morph
        this.setTabPaneExtent(this.getExtent().subPt(pt(0,this.tabBarHeight)));
        this.tabBar.setExtent(pt(this.tabBar.getExtent().x, this.tabBarHeight));
        var newTab = new lively.morphic.ObjectEditorTab(this.tabBar);
        newTab.setExtent(pt(newTab.getExtent().x, this.tabBarHeight))
        newTab.setLabel(scriptName+": "+target.getName());
        this.tabBar.addTab(newTab);
        disconnect($world, "currentlySelectedMorph", this.gridLayoutMorph, "rebuildForNewTarget");
        var pane = newTab.pane;
        pane.setBounds(pt(0,this.tabBarHeight).extent(this.getExtent().subPt(pt(0,this.tabBarHeight))))
        newTab.fctTarget = target;
        newTab.fctScriptName = scriptName;
        var morph = new lively.morphic.Text(rect(0,0,10,10));
        morph.setExtent(pane.getExtent());
        morph.setFontFamily("Monaco,courier");
        morph.setFontSize(9);
        morph.setClipMode("auto");
        morph.doitContext = target;
        connect(morph, "textString", morph, "highlightJavaScriptSyntax");
        connect(morph, "textString", newTab, "updateChangedIndicator");
        newTab.label.setTextColor(Color.rgb(26,41,127));
        var scriptText = this.getSourceForScript(scriptName, target);
        newTab.setOriginalScript(scriptText);
        morph.setTextString(scriptText);
        pane.addMorph(morph);
        this.tabBar.setExtent(pt(this.tabBar.getExtent().x, this.tabBarHeight))
        this.cleanUp();
    }
});

lively.morphic.Flap.subclass('lively.morphic.ObjectEditorFlap',
'properties', {
    editorPanePadding: 8,
    tabBarHeight: 40,
    buttonLabelStyle: {
        align: 'center',
        verticalAlign: 'middle',
        fontSize: 14,
        padding: Rectangle.inset(0,9),
        textColor: Color.black
    },
    buttonStyle: {
        fill: Color.rgba(255,255,255,0.2)
    },







},
'initialization', {
    initialize: function ($super) {
        $super('ObjectEditor', 'top')
        this.tabContainer = this.initializeTabContainer();
        this.nextButton = this.initializeNextButton();
        this.saveButton = this.initializeSaveButton();
        this.runButton = this.initializeRunButton();
        return this
    },
    initializeTabContainer: function () {
        var self = this,
            tabContainer = new lively.morphic.ObjectEditorTabContainer(undefined, this.getExtent(), this.tabBarHeight);
        this.tabContainer = tabContainer;
        this.addMorph(tabContainer)
        var padding = this.editorPanePadding,
            extent = this.getExtent().subPt(pt(2*padding, 2*padding))
        tabContainer.setBounds(pt(padding,padding).extent(extent))
        this.tabBar = this.initializeTabBar(tabContainer)
        tabContainer.tabBar = this.tabBar;
        tabContainer.setTabPaneExtent(tabContainer.getExtent().subPt(pt(0,self.tabBar.getExtent().y)));
        return tabContainer;
    },
    initializeTabBar: function(tabContainer) {
        var tabBar = new lively.morphic.TabBar(tabContainer);
        tabBar.setExtent(pt(this.tabContainer.getExtent().x, this.tabBarHeight));
        return this.tabContainer.addMorph(tabBar);
    },
    initializeNextButton: function () {
        var self = this,
            nextButton = new lively.morphic.Button(pt(this.tabBar.getExtent().x - this.tabBarHeight,0)
                .extent(pt(this.tabBarHeight,this.tabBarHeight)), '>>');
        nextButton.onFire = function() {
            var target = $world.currentlySelectedMorph || $world.currentHaloTarget || $world;
            self.tabContainer.buildModalViewFor(target);
            $world.ignoreHalos = false;
        };
        nextButton.onMouseDown = function() {
            $world.ignoreHalos = true;
        };
        nextButton.applyStyle(this.buttonStyle)
        nextButton.label.applyStyle(this.buttonLabelStyle)
        nextButton.normalFill = this.buttonStyle.fill
        connect(nextButton, "fire", nextButton, "onFire", {});
        nextButton.setName('nextButton')
        this.tabBar.addMorph(nextButton);
        return nextButton
    },
    initializeSaveButton: function () {
        var self = this,
            width = 100,
            saveButton = new lively.morphic.Button(pt(this.nextButton.getPosition().x-width,0)
                    .extent(pt(width, this.tabBarHeight)), 'Save');
        this.tabBar.addMorph(saveButton);
        saveButton.doSave = function() {
            var activeTab = self.tabContainer.activeTab();
            var scriptPane = activeTab.pane.submorphs[0];
            var script = Strings.format('this.addScript(%s)', scriptPane.getTextString());
            var tags = activeTab.fctTarget[activeTab.fctScriptName].tags || [];
            var saved = scriptPane.boundEval(script);

            var addScriptRegex = /function\s+([^\(]*)\(/;
            var addScriptMatches = [];
            var addScriptMatch = addScriptRegex.exec(script);
            activeTab.fctTarget[addScriptMatch[1]].setProperty("tags", tags);
            activeTab.fctScriptName = addScriptMatch[1];
            activeTab.setLabel(addScriptMatch[1]+": "+activeTab.fctTarget.getName());
            if (saved) {
                alertOK("saved script "+activeTab.fctScriptName + " for " + activeTab.fctTarget);
                activeTab.setOriginalScript(scriptPane.getTextString());
            } else {
                alert("not saved");
            };
        };
        saveButton.onTap = function() {
            this.doSave();
        };
        saveButton.applyStyle(this.buttonStyle)
        saveButton.label.applyStyle(this.buttonLabelStyle)
        saveButton.normalFill = this.buttonStyle.fill
        return saveButton
    },
    initializeRunButton: function() {
        var self = this,
            width = 100,
            runButton = new lively.morphic.Button(pt(this.saveButton.getPosition().x - width,0)
                    .extent(pt(width, this.tabBarHeight)), 'Run');
        runButton.onTap = function() {
            this.run();
        };
        runButton.run = function() {
            var activeTab = self.tabContainer.activeTab();
            var tags = activeTab.fctTarget[activeTab.fctScriptName]();
        };
        runButton.applyStyle(this.buttonStyle)
        runButton.label.applyStyle(this.buttonLabelStyle)
        runButton.normalFill = this.buttonStyle.fill
        return this.tabBar.addMorph(runButton);
    },
    setTarget: function(target) {
        this.target = target
        this.buildModalViewFor(target)
    },

    onTouchEnd: function(evt) {
        evt.stop();
        return true;
    },
},
'event handling', {
    onTouchMove: function(evt) {
        evt.stop();
        return true;
    },
    onTouchStart: function(evt) {
        evt.stop();
        return true;
    },
});



}) // end of module