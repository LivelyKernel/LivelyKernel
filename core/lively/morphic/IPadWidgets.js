module('lively.morphic.IPadWidgets').requires('lively.morphic.AdditionalMorphs').toRun(function() {
lively.morphic.Box.subclass('lively.morphic.TouchList',
'properties', {
    setItemStyle: function(style) {
        // Sets the list entry style and adjusts to it.
        this.itemStyle = style
        if (style.extent) {
            this.setExtent(pt(style.extent.x, this.getExtent().y));
        }
        var container = this.getCurrentContainer();
        container.itemHeight = this.getItemStyle().extent ? this.getItemStyle().extent.y : 40;
        this.getCurrentContainer().submorphs.each(function (item) {
            item.applyStyle(style);
        })
    },
    getItemStyle: function() {
        return this.itemStyle || {};
    },

    style: {
        layout: {
            adjustForNewBounds: true,
        },
        fill: Color.rgba(255,255,255,0)
    }




},
'initializing', {
    initialize: function($super, bounds, optItems, optItemStyle) {
        /* 
        ** A TouchList only reacts on touches.
        ** optItems can be a string array or a multilevel array (see common list interface)
        ** optItemStyle styles the list entries.
        */
        $super(bounds);
        this.resetToDefaultProperties();
        this.createList();
        this.disableSelection();
        this.itemList = [];
        optItemStyle && this.setItemStyle(optItemStyle);
        this.reset();
        if (optItems) this.updateList(optItems)
        // We need to set the Extent here since updating the List changes it to the default extent
        this.setExtent(pt(bounds.width, bounds.height));
    },
    setLabel: function(string) {
        if (this.label) {
            this.label.setTextString(string)
        }
        else {
            var extent = pt(this.getExtent().x, 20)
            this.label = new lively.morphic.Text(pt(0,0).extent(extent), string);
            this.label.beLabel();
            this.label.applyStyle({
                fixedHeight: true,
                fixedWidth: true,
                extent: extent,
                align: 'center',
                layout: {
                    resizeWidth: true,
                }
            })
            var submenu = this.get('SubmenuContainer')
            submenu.setPosition(pt(0,20))
            submenu.setExtent(submenu.getExtent().subPt(pt(0,20)))
            this.addMorph(this.label)
        }
    },

    createList: function() {
        return this.addMorph(this.createSubmenuContainer());
    },
    createSubmenuContainer: function() {
        var container = new lively.morphic.Box(pt(0,this.label ? this.label.getExtent().y : 0).extent(this.getExtent()));
        container.applyStyle({
            layout: {
                resizeWidth: true,
                resizeHeight: true,
                adjustForNewBounds: true,
            }
        })
        container.setName('SubmenuContainer');
        container.addMorph(this.createListItemContainer());
        container.setClipMode('hidden')
        return container;
    },
    createListItemContainer: function() {
        var container = new lively.morphic.ListItemContainer(pt(0,0).extent(this.getExtent()));
        container.setItemHeight(this.getItemStyle().extent ? this.getItemStyle().extent.y : 40);
        return container
    },
    reset: function() {
        this.disableDropping();
        this.submorphs.invoke('disableDropping');
        this.setup([]);
    },
    setup: function(itemList) {
        this.resetToDefaultProperties()
        this.itemList = [];
        this.setClipMode("hidden");
        this.titleStack = [];
        this.containerStack = [];
        var container = this.getCurrentContainer();
        var submenu = this.get('SubmenuContainer');
        submenu.removeAllMorphs();
        submenu.addMorph(container);
        this.currentContainer = container;
        submenu.setPosition(pt(0,submenu.getPosition().y));
        this.submenusDisabled = false;
        //world menu entries
        this.createMenuItems(itemList);
    },
    resetToDefaultProperties: function() {
        if (this.allowsMultiSelection) {
            this.selection = [];
            this.selectedLineNo = [];
            this.selectedMorph = []
        }
        else {
            this.selection = null;
            this.selectedLineNo = -1;
            this.selectedMorph = null
        }
    }

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
        return newMorph
    },
    updateSelection: function(newSelectedMorph) {
        if (this.allowsMultiSelection) {
            this.updateMultiSelection(newSelectedMorph)
            return
        }
        var hasText = true;
        if(this.selectedMorph) {
            hasText = this.selectedMorph.getTextString();
            this.selectedMorph.setDeselected();
        }
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
        newSelectedMorph.setSelected();
        this.selectedMorph = newSelectedMorph;
    },


    openSubMenu: function(selection) {
        var subcontainer = this.get("SubmenuContainer");
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
        container.setPosition(pt(offset, subcontainer.getPosition().y));
        subcontainer.addMorph(container);
        this.currentContainer = container;
        this.addMenuItems(selection[1]);
        var that = this;
        subcontainer.setPositionAnimated(pt(-offset, subcontainer.getPosition().y), 500, function(){
            that.nextContainer = that.createContainer();
        });
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
        var submenu = this.get("SubmenuContainer");
        submenu.setPositionAnimated(pt(-offset, this.label? this.label.getExtent().y : 0), 500, callbackFct);
    },
    updateList: function(items) {
        this.resetToDefaultProperties();
        this.setClipMode("hidden");
        this.titleStack = [];
        this.containerStack = [];
        var container = this.getCurrentContainer();
        this.get("SubmenuContainer").removeAllMorphs();
        this.get("SubmenuContainer").addMorph(container);
        this.currentContainer = container;
        //world menu entries
        this.removeAllMenuItems();
        this.submenusDisabled = true;
        var that = this;
        items.forEach(function (item) {
            this.addItem({string: item, value: item, isListItem: true});
        }, this);
        this.itemList = items
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


    getItemFontSize: function() {
        return this.itemFontSize || 14
    },
    setItemFontSize: function(int) {
        this.itemFontSize = int;
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
        var extent = this.getItemStyle().extent || pt(this.getExtent().x,40);
        var part = new lively.morphic.ListItem(pt(0,0).extent(extent), item);
        part.applyStyle(this.getItemStyle());
        part.touchList = this;
        if (item.value[1] instanceof Array && !this.submenusDisabled) {
            part.initializeSubMenuArrow()
        }
        part.normalColor = this.getItemStyle().normalColor;
        part.normalTextColor = this.getItemStyle().normalTextColor;
        part.toggleColor = this.getItemStyle().toggleColor;
        part.toggleTextColor = this.getItemStyle().toggleTextColor;
        return part;
    },
    getLevel: function() {
        return this.titleStack.length;
    },
}, 
'multiselection', {
    allowMultiSelection: function () {
        this.allowsMultiSelection = true;
        this.resetToDefaultProperties()
    },
    updateMultiSelection: function(newSelectedMorph) {
        if (newSelectedMorph.isSelected) {
            newSelectedMorph.setDeselected();
            var idx = this.selectedMorph.indexOf(newSelectedMorph);
            this.selection.splice(idx, 1);
            this.selectedLineNo.splice(idx, 1);
            this.selectedMorph.splice(idx, 1);
        }
        else {
            newSelectedMorph.setSelected();
            this.selection.push(newSelectedMorph.item.value);
            this.selectedLineNo.push(newSelectedMorph.index);
            this.selectedMorph.push(newSelectedMorph);
        }
    },
    forbidMultiSelection: function() {
        this.allowsMultiSelection = false;
        this.resetToDefaultProperties()
    }
});
lively.morphic.TouchList.subclass('lively.morphic.CustomizableTouchList',
'initilization', {
    initialize: function($super, bounds, optItems, optStyle) {
        var returnValue = $super(bounds, optItems, optStyle),
            height = 20,
            submenu = this.get('SubmenuContainer');
        this.inputField = this.initializeInputField(height);
        this.plusButton = this.initializePlusButton(height);
        submenu.setExtent(submenu.getExtent().subPt(pt(0,20)))
        return returnValue
    },
    initializeInputField: function(height) {
        var inputField = new lively.morphic.Text(rect(height, this.getExtent().y - height, this.getExtent().x - height, height)),
            that = this;
        inputField.beInputLine()
        inputField.doSave = function () {
            that.addCustomItem();
        }
        inputField.applyStyle({
            layout: {
                moveVertical: true,
                resizeWidth: true,
                resizeHeight: false
            },
            fixedWidth: true,
            fixedHeight: true
        })
        return this.addMorph(inputField);
    },
    initializePlusButton: function(height) {
        var plusButton = new lively.morphic.Button(rect(0,this.getExtent().y - height, height, height), '+'),
            that = this;
        this.addMorph(plusButton);
        plusButton.addScript(function onFire () {
            that.addCustomItem();
        })
        connect(plusButton, 'fire', plusButton, 'onFire');
        plusButton.applyStyle({
            layout: {
                moveVertical: true,
                resizeWidth: false
            }
        })
        return plusButton
    },



},
'adding items', {
    addCustomItem: function(optString) {
        var input = optString || this.inputField.getTextString();
        if (!input)
            return
        var item = this.addItem({
            string: input,
            value: input,
            isListItem: true,
        })
        this.inputField.setTextString('')
        this.onAddCustomItem(item);
    },
    onAddCustomItem: function(item) {
        // Hook to e.g. select a new Item
    }


});
lively.morphic.Box.subclass('lively.morphic.ListItemContainer',
'properties', {
    style: {
        layout: {
            resizeWidth: true,
            resizeHeight: true
        },
    },
    getItemHeight: function() {
        return this.itemHeight || 40;
    },
    setItemHeight: function(height) {
        this.itemHeight = height;
    },


},
'scrolling', {
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

            var heightMenu = this.itemList.length * this.itemHeight;
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
},
'initilaization', {
    initialize: function($super, bounds) {
        $super(bounds);
        this.itemList = [];
    },
},
'item handling', {
    removeAllMenuItems: function() {
        this.itemList = [];
        this.setPosition(pt(0,0));
        //TODO: invoke remove on submorphs.copy instead?
        this.submorphs.invoke("remove");
    },
    addItem: function(morph) {
        morph.disableDropping();
        this.itemList = this.itemList || [];
        morph.setPosition(pt(0,this.itemList.length*this.getItemHeight()));
        this.itemList.push(morph);
        this.addMorph(morph);
    },
});

lively.morphic.Text.subclass('lively.morphic.ListItem',
'properties', {
    style: {
        fill: new lively.morphic.LinearGradient([
            {offset: 0, color: Color.rgb(253,253,253)},
            {offset: 1, color: Color.rgb(238,238,238)}
        ], 'northSouth'),
        extent: pt(100,40),
        fixedWith: true,
        fixedHeight: true,
        borderColor: Color.rgb(138,138,138),
        borderWidth: 1,
        fontSize: 14,
        textColor: Color.rgb(47,47,47),
        fontFamily: "Helvetica, Arial, sans-serif",
        padding: Rectangle.inset(10,10),
        fontWeight: 'bold',
        layout: {resizeWidth: true},
    },
    setSelected: function() {
        this.isSelected = true
        this.setTextColor(this.getToggleTextColor());
        this.setFill(this.getToggleColor());
    },
    setDeselected: function() {
        this.isSelected = false
        this.setTextColor(this.getNormalTextColor());
        this.setFill(this.getNormalColor());
    },
    getNormalColor: function() {
        return this.normalColor || new lively.morphic.LinearGradient([
            {offset: 0, color: Color.rgb(253,253,253)},
            {offset: 1, color: Color.rgb(238,238,238)}
        ], 'northSouth')
    },
    getNormalTextColor: function() {
        return this.normalTextColor || Color.rgb(47,47,47)
    },
    getToggleColor: function() {
        return this.toggleColor || new lively.morphic.LinearGradient([
            {offset: 0, color: Color.rgb(47,47,47)},
            {offset:0.5, color: Color.rgb(21,21,21)},
            {offset: 1, color: Color.rgb(0,0,0)}
        ], 'northSouth')
    },
    getToggleTextColor: function() {
        return this.toggleTextColor || Color.rgb(222,222,222)
    },
}, 'initialization', {
    initialize: function($super, bounds, item) {
        $super(bounds);
        this.setExtent(pt(bounds.width, bounds.height));
        this.disableHalos();
        this.disableSelection();
        this.name = "MenuItem_" + item.string;
        this.item = item;
        this.setTextString(item.string);
        return this
    },
    initializeSubMenuArrow: function() {
        var rect = new Rectangle(0,0, 15, 15),
        icon = new lively.morphic.Image(rect, LivelyLoader.codeBase + "media/arrow.png", false);
        var xPos = this.getExtent().subPt(icon.getExtent().scaleBy(1.5)).x,
            yPos = this.getExtent().subPt(icon.getExtent()).scaleBy(0.5).y;
        icon.setPosition(pt(xPos,yPos))
        icon.disableHalos();
        icon.disableSelection();
        icon.ignoreEvents();
        this.addMorph(icon);
    },
},
'events', {
    onTouchStart: function(evt) {
        var touch = evt.touches[0];
        this.clickPosition = pt(touch.clientX,touch.clientY);
        this.lastClickPos = this.clickPosition;
        if (!this.touchList.allowsMultiSelection)
            this.setSelected();
        return false;
    },
    onTouchMove: function(evt) {
        var touch = evt.touches[0];
        this.lastClickPos = pt(touch.clientX,touch.clientY);
        if (!this.touchList.allowsMultiSelection)
            this.setDeselected()
        return false;
    },
    onTouchEnd: function(evt) {
        if (this.touchList.allowsMultiSelection) {
            if (this.isSelected)
                this.setDeselected()
            else
                this.setSelected()
        }
        else {
            var deltaPt = this.lastClickPos.subPt(this.clickPosition);
            var delta = deltaPt.x*deltaPt.x + deltaPt.y*deltaPt.y;
            if(delta<25) {
                var listMorph = this.touchList;
                if(listMorph && listMorph.updateSelection) {
                    listMorph.updateSelection(this);
                }
                this.setDeselected()
            }
        }
        return false;
    },
});

lively.morphic.Text.subclass('lively.morphic.FlapHandle',
'properties', {
    style: {
        extent: pt(100,20),
        borderWidth: 1,
        fixedHeight: true,
        fixedWidth: false,
        padding: Rectangle.inset(9,9),
        enableHalos: false,
        align: 'center',
        fontSize: 14,
        textColor: Color.rgba(0,0,0,0)
    },
    getAlignment: function() {
        return this.alignInWorld || 'left';
    },
    setAlignment: function(align) {
        this.alignInWorld = align;
    }


},
'initialization', {
    initialize: function ($super, handleName, optAlignment) {
        $super(rect(0,0,0,0));
        optAlignment && this.setAlignment(optAlignment);
        this.determineRotation();
        this.applyStyle(Object.merge([this.style, this.determineGradient()]));
        this.setTextString('Flap       ')
        this.initializeCloseButton()
        this.disableSelection();
        return this
    },
    initializeCloseButton: function() {
        var closeButton = new lively.morphic.Button(rect(this.getExtent().x-20, 0, 20, 20), 'X'),
            that = this;
        closeButton.beFlapButton();
        closeButton.normalColor = Color.red.withA(0.5);
        closeButton.toggleColor = Color.red;
        closeButton.applyStyle({
            position: pt(this.getExtent().x-20, 5),
            extent: pt(20, 20),
            fill: Color.red.withA(0.5)
        })
        closeButton.addScript(function onFire () {
            that.owner.close()
        })
        connect(closeButton, 'fire', closeButton, 'onFire')
        closeButton.setBorderRadius(1)
        this.addMorph(closeButton);
    },

    determineRotation: function() {
        switch (this.getAlignment()) {
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
    },
    determineGradient: function() {
        var dark = Color.rgb(9,16,29)
        var bright = Color.rgb(200,200,200)
        var gradient = new lively.morphic.LinearGradient([
            {offset: 0, color: dark},
            {offset: 0.06, color: dark},
            {offset: 0.09, color: bright},
            {offset: 0.27, color: bright},
            {offset: 0.33, color: dark},
            {offset: 0.36, color: dark},
            {offset: 0.39, color: bright},
            {offset: 0.57, color: bright},
            {offset: 0.63, color: dark},
            {offset: 0.66, color: dark},
            {offset: 0.69, color: bright},
            {offset: 0.9, color: bright},
            {offset: 0.93, color: dark},
            {offset: 1, color: dark},
        ], 'northSouth')
        var borderRadius = (this.getAlignment() == 'left' || this.getAlignment() == 'bottom') ?
                "8px 8px 0px 0px" : "0px 0px 8px 8px";
        return {
            fill: gradient,
            borderRadius: borderRadius,
            borderWidth: 5,
            borderColor: dark
        }
    },

},
'events', {
    onTouchEnd: function (evt) {
        if (!this.flap.getFixedPosition()) return;
        var threshold = 10,
            pos = this.flap.getFixedPosition() || this.flap.getPositionInWorld();
        if(pos && pos.x < threshold - this.ownerExtent.x) {
            if (this.flap.getFixedPosition())
                this.flap.setFixedPosition(pt(-this.ownerExtent.x,0));
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
        this.beginMorphPosition = this.owner.getFixedPosition() || this.owner.getPosition();
        this.beginMorphPosition = this.beginMorphPosition
            //.scaleBy(lively.morphic.World.current().getZoomLevel())
        evt.stop();
        return true;
    },
    onTap: function() {
        this.flap.collapse();
    },

},
'positioning while moving', {
    setNextPos: function (touchPosition) {
        var pos = this.transformDelta(touchPosition),
            bottomRight = this.owner.getBottomRight();
        switch (this.getAlignment()) {
            case 'left': {
                pos.x = Math.max(pos.x, -this.ownerExtent.x);
                pos.x = Math.min(pos.x, bottomRight.x / 3 - this.ownerExtent.x);
                break;
            };
            case 'top': {
                pos.y = Math.max(pos.y, -this.ownerExtent.y);
                pos.y = Math.min(pos.y, bottomRight.y/ 3 - this.ownerExtent.y)
                break
            };
            case 'right': {
                pos.x = Math.max(pos.x, bottomRight.x * 2 / 3);
                pos.x = Math.min(pos.x, bottomRight.x);
                break
            };
            case 'bottom': {
                pos.y = Math.max(pos.y, bottomRight.y * 2 / 3);
                pos.y = Math.min(pos.y, bottomRight.y);
                break
            }
        }
        if (this.flap.getFixedPosition())
            this.flap.setFixedPosition(pos);
        else
            this.flap.setPosition(pos)
    },
    transformDelta: function(touchPosition) {
        var world = lively.morphic.World.current();
        var deltaToStart = ((this.getAlignment() == 'left' || this.getAlignment() == 'right')
                    ? pt(this.beginTouchPosition.subPt(touchPosition).x,0)
                    : pt(0, this.beginTouchPosition.subPt(touchPosition).y))
        if (this.flap.owner.isWorld)
            deltaToStart = deltaToStart.scaleBy(world.getZoomLevel())
        return this.beginMorphPosition.subPt(deltaToStart);
    },


})

lively.morphic.Morph.subclass('lively.morphic.Flap', 
'properties', {


    style: {
        fill: new lively.morphic.LinearGradient(
                [
                    {offset: 0, color: Color.rgb(79,87,104)},
                    {offset: 0.5, color: Color.rgb(33,43,60)},
                    {offset: 1, color: Color.rgb(9,16,29)}
                ],
                'northSouth'
            )
    },
    isFlap: true,
    setCollapsedPosition: function(pos) {
        this.collapsedPosition= pos;
    },
    getCollapsedPosition: function() {
        var pos = this.collapsedPosition,
            world = lively.morphic.World.current(),
            bottomRight = this.getBottomRight();
        if (pos)
            return pos;
        switch (this.alignment) {
            case 'left': {
                pos = pt(0,0).subPt(pt(this.getExtent().x, 0))
                break;
            };
            case 'top': {
                pos = pt(0,0).subPt(pt(0, this.getExtent().y))
                break
            };
            case 'right': {
                pos = pt(bottomRight.x, 0);
                break;
            };
            case 'bottom' : {
                pos = pt(0, bottomRight.y);
                break
            }
        }
        if (this.owner.isWorld)
            return pos.scaleBy(1 / world.getZoomLevel()).addPt(pt(document.body.scrollLeft, document.body.scrollTop))
        else
            return pos
    },},
'initialization', {
    initialize: function($super, name, alignment, optOwner) {
        // alignment: 'left', 'right', 'top', 'bottom'
        $super(this.defaultShape());
        var owner = optOwner || lively.morphic.World.current();
        owner.addMorph(this);
        this.alignment = alignment;
        this.fitInWorld();
        this.applyStyle(Object.merge([this.style,{fill: this.determineFillGradient()}]))
        this.setName(name+'Flap');
        this.flapHandle = this.initializeHandle(name, alignment);
        this.setFixed(true);
        this.fixedScale = 1;
        this.disableSelection();
        return this;
    },
    close: function() {
        disconnect(this.owner, "currentlySelectedMorph", this, "setTarget");
        this.remove()
    },



    fitInWorld: function () {
        this.determineExtent();
        this.style.position = this.determinePosition();
        this.setBorderRadius(this.determineBorderRadius());
    },
    determinePosition: function () {
        var pos,
            world = lively.morphic.World.current(),
            bottomRight = this.getBottomRight();
        switch (this.alignment) {
            case 'left': case 'top': {
                pos = pt(0, 0);
                break;
            }
            case 'right': {
                pos = pt(bottomRight.x - this.style.extent.x, 0);
                break
            }
            case 'bottom' : {
                pos = pt(0, bottomRight.y - this.style.extent.y);
                break;
            }
        }
        if (this.owner.isWorld)
            return pos.scaleBy(1 / world.getZoomLevel()).addPt(pt(document.body.scrollLeft, document.body.scrollTop))
        else
            return pos
    },
    determineExtent: function () {
        var extent,
            bottomRight = this.getBottomRight();
        switch (this.alignment)  {
            case 'left': case 'right': {
                extent = pt(bottomRight.x / 3, bottomRight.y);
                break;
            };
            case 'top': case 'bottom': {
                extent = pt(bottomRight.x, bottomRight.y / 3);
                break;
            };
        }
        this.style.extent = extent
        return this.style.extent;
    },
    determineBorderRadius: function() {
        switch (this.alignment) {
            case 'left': return "0px 8px 8px 0px";
            case 'top': return "0px 0px 8px 8px";
            case 'right': return "8px 0px 0px 8px";
            case 'bottom': return "8px 8px 0px 0px";
        }
    },
    determineFillGradient: function() {
        var direction = 'westEast';
        switch (this.alignment) {
            case 'left': {
                direction = 'eastWest';
                break
            };
            case 'top': {
                direction = 'northSouth';
                break
            };
            case 'right': {
                direction = 'westEast';
                break
            };
            case 'bottom': {
                direction = 'southNorth';
                break
            };
        }
        return new lively.morphic.LinearGradient(
                [
                    {offset: 0, color: Color.rgb(235,235,235)},
                    {offset: 0.8, color: Color.rgb(33,43,60)},
                    {offset: 1, color: Color.rgb(9,16,29)}
                ],
                direction
            )
    },


    initializeHandle: function (name, alignment) {
        var flapHandle = new lively.morphic.FlapHandle(name, alignment);
        this.flapHandle = flapHandle;
        flapHandle.flap = this;
        flapHandle.alignment = alignment;
        flapHandle.setPosition(this.determineHandlePosition());
        return this.addMorph(flapHandle);
    },
    determineHandlePosition: function () {
        var pos,
            self = this,
            bottomRight = this.getBottomRight(),
            spaceUsedByOtherFlaps = this.owner.submorphs.select(function (ea) {
                return ea.isFlap && ea !== self && ea.alignment == self.alignment
            }).reduce(function(a, b){
                return a + b.flapHandle.getExtent().x;
            }, 10),
            handleBorderOffset = 8;
        switch (this.alignment) {
            case 'left': {
                pos = pt(handleBorderOffset + this.getExtent().x + this.flapHandle.getExtent().y, spaceUsedByOtherFlaps)
                break;
            };
            case 'top': {
                pos = pt(bottomRight.x - (this.flapHandle.getExtent().x + spaceUsedByOtherFlaps), this.getExtent().y)
                break;
            };
            case 'right': {
                pos = pt(0, bottomRight.y - (this.flapHandle.getExtent().x + spaceUsedByOtherFlaps))
                break;
            };
            case 'bottom': {
                pos = pt(spaceUsedByOtherFlaps, - this.flapHandle.getExtent().y - handleBorderOffset);
                break;
            }
        }
        this.flapHandle.style.position = pos
        return pos;
    },
},
'events', {
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
    collapse: function() {
        var that = this;
        this.setFixed(false);
        var callback = function () {
            if (that.owner.isWorld)
                that.setFixed(true)
        }
        this.setPositionAnimated(this.getCollapsedPosition(), 500, callback);
    },},
'targeting', {
    setTarget: function(target) {
        this.target = target
    },
    getBottomRight: function() {
        if (this.owner.isWorld)
            return pt(document.documentElement.clientWidth, document.documentElement.clientHeight)
        else
            return this.owner.getExtent()
    }

}) // end of subclass lively.morphic.Flap

lively.morphic.Flap.subclass('lively.morphic.PartsBinFlap', 
'properties', {
    getPartsBinURL: function() {
        return new URL(Config.rootPath).withFilename('PartsBin/');
    },

}, 
'initialization', {
    initialize: function ($super) {
        $super('PartsBin', 'left');
        this.createPartsBin();
        return this
    },
    onrestore: function() {
        (function(){
            this.setPosition(this.determinePosition());
            this.setExtent(this.determineExtent());
            this.createPartsBin();
        }).bind(this).delay(0);
    },
    createPartsBin: function() {
        this.list = this.initializeCategoryList();
        this.header = this.initializeHeader();
        this.backBtn = this.createBackButton();
        this.categoryLabel = this.createCategoryLabel();
        this.categoryContainer = this.createCategoryContainer();
        this.updateCategoriesDictFromPartsBin();
    },
    initializeCategoryList: function() {
        var offset = 8,
            list = new lively.morphic.TouchList(
                pt(offset, offset).extent(this.getExtent().subPt(pt(offset*2,offset*2))),
                undefined,
                this.getListStyle());
        list.setPosition(pt(offset,offset));
        connect(list, "selection", this, "gotoCategory", {
            converter: function(input){
                if(!input) return ""; return input[0];
            }
        });
        return this.addMorph(list);
    },
    getListStyle: function() {
        return {
            textColor: Color.white,
            fill: new lively.morphic.LinearGradient([
                {offset: 0, color: Color.rgba(253,253,253,0.1)},
                {offset: 1, color: Color.rgba(238,238,238,0.1)}
            ], 'southNorth'),
            borderColor: Color.rgb(47,47,47),
            align: 'right',
            padding: rect(0,7,30,0),
            normalColor: new lively.morphic.LinearGradient([
                {offset: 0, color: Color.rgba(253,253,253,0.1)},
                {offset: 1, color: Color.rgba(238,238,238,0.1)}
            ], 'southNorth'),
            normalTextColor: Color.white,
        }
    },

    initializeHeader: function() {
        var header = new lively.morphic.Box(rect(0,0,10,10));
        header.setExtent(pt(this.getExtent().x, 35));
        header.setVisible(false);
        header.applyStyle({
            fill: null,
            borderWidth: 0,
        })
        return this.addMorph(header);
    },
    createCategoryContainer: function() {
        var extent = this.getExtent().subPt(pt(0,this.categoryLabel.getExtent().y)),
            box = new lively.morphic.Box(new Rectangle(pt(0,0).extent(extent))),
            that = this;
        box.onTouchStart = function(evt) {
            evt.stop();
            var touch = evt.touches[0];
            if(touch) {
                touch.originalDragOffset = touch.screenY;
                touch.originalMenuOffset = this.getPosition();
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
                pos = Math.min(0,pos);
                this.setPosition(pt(0,pos));
            }
            return true;
        };
        // construction: Flap containes scrollContainer contains box
        box.scrollContainer = this.createScrollContainer();
        box.scrollContainer.addMorph(box)
        return box;
    },
    createScrollContainer: function() {
        var scrollContainer = new lively.morphic.Box(new Rectangle(0,0,100,10));
        scrollContainer.setClipMode('hidden');
        return this.addMorphBack(scrollContainer);
    },

    createCategoryLabel: function() {
        var text = new TextMorph(new Rectangle(0,0,100,10));
        text.beLabel();
        text.applyStyle({
            fill: null,
            borderWidth: 0,
            fontSize: 14,
            textColor: Color.rgb(235,235,235),
            fontFamily: "Helvetica, Arial, sans-serif",
            extent: (pt(500,35)),
            position: pt(120,5),
        });
        text.textString = "";
        return this.header.addMorph(text);
    },
    createBackButton: function() {
        var button = new lively.morphic.Button(new Rectangle(0, 0, 75, 25));
        button.onTap = this.goBackToCategories.bind(this)
        button.setLabel("Back");
        button.normalColor = Color.rgba(47,47,47,0.2);
        button.toggleColor = Color.rgba(47,47,47,0.8);
        button.applyStyle({
            fill: button.normalColor,
            padding: rect(0,5,10,10),
            extent: pt(100,35),
            label: {
                textColor: Color.rgb(235,235,235),
                fontSize: 14
            },
            borderRadius: '20px 5px 5px 20px'
        })
        return this.header.addMorph(button);
    },
},
'categories', {

    ensureCategories: function() {
        if (!this.categories)
            this.categories = {uncategorized: 'PartsBin/'};
    },    
    getURLForCategoryNamed: function(categoryName) {
        this.ensureCategories();
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
        this.categoryContainer.scrollContainer.setPosition(pt(0,35));
        this.categoryContainer.scrollContainer.setExtent(this.getExtent().subPt(pt(0,35)))
        var partsSpace = lively.PartsBin.partsSpaceWithURL(
                    this.getURLForCategoryNamed(categoryName));
        connect(partsSpace, 'partItems', this, 'addMorphsForPartItems', {
            converter: function(partItemObj) {
                return Properties.ownValues(partItemObj)
            }})
        partsSpace.load(true);
    },
    updateCategoriesDictFromPartsBin: function() {
        this.ensureCategories(),
            that = this;
        var callback = function(collections) {
            // write all the categories in a 'categories' property
            collections.forEach(function(dir) {
                var unescape = Global.urlUnescape || Global.unescape,
                unescaped = unescape(dir.getURL().filename()),
                name = unescaped.replace(/\/$/,"");
                that.categories[name] = that.getPartsBinURL().withFilename(unescaped);
            });
            that.updateCategoryList();
        }
        lively.PartsBin.loadCategoriesAsync(callback);
    },
    updateCategoryList: function() {
        this.list.setup(
                Properties.own(this.categories).sortBy(function(name) {
                    return name.toLowerCase();
                }).map(function(ea){
                    return [ea, []];
                })
            );
    },
},
'part items', {
    addMorphsForPartItems: function(partItems) {
        this.partItemsToBeAdded = partItems.clone();
        delete this.lastPosition;
        this.startStepping(0, 'addPartItemAsync')
    },
    addPartItemAsync: function() {
        // TODO: Accelerate, e.g. by only loading as many parts as there can be displayed
        if (!this.partItemsToBeAdded || this.partItemsToBeAdded.length == 0) {
            this.stopAddingPartItemsAsync();
            return;
        }
        var partItem = this.partItemsToBeAdded.shift();
        var morph = this.makePartItemTouchInteractive(partItem);
        this.categoryContainer.addMorph(morph);
    },
    makePartItemTouchInteractive: function(partItem) {
        var morph = partItem.asPartsBinItem(),
            that = this;
        morph.setPosition(this.getAvailablePosition());
        morph.onTouchStart = function(evt) {
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
                    that.grabFocusedItem(this)
                    delete touch.partItemOffset;
                    touch.draggingCanceled = true;
                }
            }
        };
        morph.onTouchEnd = function(evt){
            evt.world.dispatchDrop(evt);
        };
        return morph
    },
    grabFocusedItem: function(morph) {
        var loadingMorph = lively.morphic.World.current().loadingMorph.copy();
        loadingMorph.loadPart(morph.partItem, function(part) {
            part.setPosition($world.firstHand().getPosition());
            lively.morphic.World.current().firstHand().grabMorph(part);
        });
    },


    getAvailablePosition: function() {
        // Currently parts are arranged in two columns
        if(!this.lastPosition) {
            this.lastPosition = pt(155,-100);
        };
        if(this.lastPosition.x === 30) {
            this.lastPosition = this.lastPosition.addPt(pt(125, 0));
        } else {
            this.lastPosition = this.lastPosition.addPt(pt(-125, 125));
        }
        this.categoryContainer.setExtent(pt(this.getExtent().x, this.lastPosition.y+125));
        return this.lastPosition;
    },
    stopAddingPartItemsAsync: function() {
        this.stopSteppingScriptNamed('addPartItemAsync');
        delete this.partItemsToBeAdded;
    },
},
'navigation', {
    goBackToCategories: function() {
        this.list.enableEvents();
        this.list.unignoreEvents();
        this.stopAddingPartItemsAsync();
        this.categoryLabel.setTextString("");
        this.header.setVisible(false);
        this.categoryContainer.removeAllMorphs();
        this.list.openSuperMenu();
    }

})

lively.morphic.Tab.subclass('lively.morphic.ObjectEditorTab',
'initialization', {
    initialize: function ($super, tabBar) {
        var returnValue = $super(tabBar);
        this.tabContainer = tabBar.tabContainer
        this.applyStyle({
            borderWidth: 0,
            extent: pt(100, tabBar.getExtent().y),
            position: pt(0,0)
        })
        this.tagList = this.initializeTagList();
        return returnValue
    },
    addCloseButton: function($super) {
        var returnValue = $super();
        this.closeButton.beFlapButton();
        this.closeButton.applyStyle({
            extent: pt(25,25),
            position: pt(this.getExtent().x - 25, 5),
            borderRadius: 3
        });
        return returnValue;
    },

    initializeLabel: function($super, aString) {
        var returnValue = $super(aString),
            labelHeight = this.getExtent().y;
        this.label.normalTextColor = Color.rgb(235,235,235);
        this.label.applyStyle({
            textColor: this.label.normalTextColor,
            padding: rect(0,5,0,0),
            fixedWidth: true
        });
        return this.label
    },
    initializePane: function($super, extent) {
        var returnValue = $super(extent),
            that = this;
        this.pane.applyStyle({
            fill: Color.rgba(235,235,235,0.5),
            borderWidth: 0,
            enableDragging: false,
            enableGrabbing: false,
            adjustForNewBounds: true,
            resizeWidth: true,
            resizeHeight: true
        })
        this.pane.focus();
        return returnValue
    },
    initializeTagList: function() {
        // Adds a multiselection list that allows choosing tags for scripts
        var extent = pt(100,this.pane.getExtent().y),
            list = new lively.morphic.CustomizableTouchList(
                    pt(this.pane.getExtent().x-100,0).extent(extent),
                    [],
                    {extent: pt(100,30), fontSize: 10, padding: rect(5,5,0,5)});
        list.setLabel('Tags');
        list.allowMultiSelection();
        list.onAddCustomItem = function (item) {
            this.updateSelection(item);
        };
        return this.pane.addMorph(list)
    },



},
'tagging', {

    initializeTags: function() {
        var that = this;
        this.tagList.updateList(this.getTargetTags());
        this.getFunctionTags().each(function (ea) {
            var listItem = that.tagList.currentContainer.submorphs.find(function (each) {
                    return each.item.string == ea}
                );
            that.tagList.updateSelection(listItem);
        })
    },

    getTargetTags: function() {
        var target = this.fctTarget;
        return Functions.own(target).collect(function (each) {
            return target[each].tags || [];
        }).flatten().uniq().sort();
    },
    getFunctionTags: function() {
        var target = this.fctTarget,
            scriptName = this.fctScriptName;
        if(!target[scriptName])
            return []
        return target[scriptName].tags || [];
    },



},
'tab interaction', {
    closeTab: function($super) {
        var noChanges = this.pane.textMorph.getTextString
                && (this.pane.textMorph.getTextString() === this.originalScript);
        if (noChanges) {
            $super();
        } else {
            var question = "Script "
                    +this.fctScriptName
                    +" has unsaved changes. Do you really want to close it?";
            if(confirm(question)) {
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
            this.label.setTextColor(this.label.normalTextColor);
        }
    },
    setOriginalScript: function(scriptText) {
        this.originalScript = scriptText;
        this.updateChangedIndicator(scriptText);
    },
    onTap: function() {
        this.getTabBar().activateTab(this);
    },
},
'styling', {
    setLabel: function($super, aString) {
        var returnValue = $super(aString);
        this.label.applyStyle({
            textColor: Color.white,
            position: pt(0,0),
            padding: rect(1,1,1,1),
            extent: this.getExtent().subPt(pt(25,0))
        });
        return returnValue
    },
    getActiveFill: function() {
        return Color.rgba(235,235,235,0.5)
    },
    getInactiveFill: function() {
        return Color.rgba(43,43,43,0.5)
    },
    determineLabelString: function(scriptName, target) {
        var targetDisplayName = target.isWorld ? 'World' : target.getName();
        return scriptName+":"+'\n'+targetDisplayName;
    }



});

lively.morphic.TabContainer.subclass('lively.morphic.ObjectEditorTabContainer', 
'initialization', {
    initialize: function($super, tabBarStrategy, optExtent, optTabBarHeight) {
        // Attention, overwrites super method completely
        var returnValue = $super(tabBarStrategy),
            that = this;
        if (optExtent !== undefined || optTabBarHeight !== undefined) {
            this.tabBar.remove();
            var tabBarStrategy = tabBarStrategy || new lively.morphic.TabStrategyTop();
            this.setTabBarStrategy(tabBarStrategy);
            this.tabPaneExtent = optExtent || pt(600,400);
            this.initializeTabBar(optTabBarHeight);
            var newExtent = this.getTabBarStrategy().
                calculateInitialExtent(this.tabBar, this.tabPaneExtent);
            this.setExtent(newExtent);
            tabBarStrategy.applyTo(this);
        }
        this.setBorderColor(Color.rgb(47,47,47))
        this.tabBar.setFill(Color.rgb(47,47,47))
        this.openTabs = [];
        return returnValue
    },
    initializeTabBar: function($super, optDefaultHeight) {
        var returnValue = $super();
        this.layout.resizeWidth = false;
        if (optDefaultHeight !== undefined) {
            this.tabBar.setDefaultHeight(optDefaultHeight);
            var width = this.tabBar.tabContainer.getTabBarStrategy().getTabBarWidth(this.tabBar.tabContainer)
            this.tabBar.setExtent(pt(width, this.tabBar.getDefaultHeight()));
        }
        return returnValue
    },
}, 
'script overview', {
    buildModalViewFor: function(target){
        if (this.gridContainer && this.gridContainer.owner)
            this.gridContainer.owner.remove()
        if (target)
            this.makeGridLayoutFor(target);
    },
    makeGridLayoutFor: function(target) {
        var categories = this.getCategoriesFor(target),
            functionNames = Functions.own(target);
        this.cleanUp();
        this.tabBar.getTabs().forEach(function(ea) {
            ea.deactivate();
        });
        this.gridContainer = this.makeGridContainer(Math.max(categories.length,2) * 100);
        this.buildCategoryViews(target, categories, functionNames)
        this.gridContainer.setLayouter(
                new lively.morphic.Layout.GridLayout(
                        this.gridContainer,
                        Math.max(categories.length,2),
                3))//Math.min(3,Functions.own(target).length + 2)));
        this.gridContainer.applyLayout();
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

    makeGridContainer: function (width) {
        var blocker = new lively.morphic.Box(pt(0,0).extent(this.getExtent().subPt(pt(40,0)))),
            containerX = (this.getExtent().x / 2) - (width / 2),
            container = new lively.morphic.Box(rect(containerX, 0, width, this.getExtent().y)),
            that = this;
        blocker.setName('Blocker')
        blocker.applyStyle({
            fill: Color.rgba(235,235,235,0),
            borderWidth: 0,
        });
        container.applyStyle({
            borderWidth: 0,
            fill: Color.rgba(43,43,43,0.5),
        });
        container.rebuildForNewTarget = function(newMorph) {
            that.buildModalViewFor(newMorph);
        };
        container.disableGrabbing();
        container.disableSelection();
        blocker.disableGrabbing();
        blocker.disableSelection();
        blocker.onTap = function () {
            this.remove();
        }
        this.addMorph(blocker);
        blocker.addMorph(container);
        return container
    },


    buildCategoryViews: function(target, categories, functionNames) {
        var i = 0,
            that = this,
            targetName = target.isWorld? 'World' : target.getName();
        if (categories.length < 2)
            categories.push('')
        this.gridContainer.addMorph(this.makeAddButton(target));
        this.gridContainer.addMorph(this.makeMorphLabel(targetName));
        if (functionNames.length === 0)
            return
        categories.forEach(function(category) {
            that.gridContainer.addMorph(that.makeCategoryLabel(category, i));
            that.gridContainer.addMorph(that.makeCategoryList(category, functionNames, target, i))
            i++;
        });
    },
    makeAddButton: function(target, width) {
        var button = new lively.morphic.Button(rect(0,20, width,20), "Add script");
        button.beFlapButton();
        button.applyStyle({
            extent: pt(100,30),
            fixedWidth: true,
            fill: new lively.morphic.LinearGradient(
                [
                    {offset: 0, color: Color.rgb(49,79,255)},
                    {offset: 0.59, color: Color.rgb(53,83,255)},
                    {offset: 0.63, color: Color.rgb(79,105,255)},
                    {offset: 1, color: Color.rgb(112,134,255)}
                ],
                'southNorth'
            ),
        })
        button.tabContainer = this;
        button.fctName = "newScript";
        button.fctTarget = target;
        button.addScript(function onFire() {
            this.tabContainer.openTabFor(this.fctName, this.fctTarget);
        });
        connect(button, 'fire', button, 'onFire')
        button.normalColor = button.getFill();
        button.toggleColor = Color.rgba(43,43,43,0.7);
        button.gridCoords = pt(1,0)
        return button
    },
    makeMorphLabel: function(targetName) {
        var label = new lively.morphic.Text(rect(0,0,100,20), targetName);
        label.beLabel();
        label.applyStyle({
            textColor: Color.rgb(235,235,235),
            align: 'center',
            fontSize: 11,
        })
        label.gridCoords = pt(0,0)
        return label;
    },
    makeCategoryLabel: function(category, column) {
        var label = new lively.morphic.Text(rect(0,0,100,20), category);
        label.gridCoords = pt(column, 1);
        label.applyStyle({
            fill: Color.rgba(43,43,43,0.5),
            borderWidth: 0,
            borderRadius: 3,
            textColor: Color.rgb(235,235,235),
            extent: pt(100,20)
        })
        return label
    },
    makeCategoryList: function(category, functionNames, target, column) {
        var functions = functionNames.select(function(functionName) {
                var notTagged = (typeof target[functionName].tags === "undefined")
                        || (target[functionName].tags.length === 0),
                    categoryHit = (typeof target[functionName].tags !== "undefined")
                        && (target[functionName].tags.include(category));
                if((notTagged && category === "uncategorized") || categoryHit) {
                    return functionName;
                }
            }),
            list = new lively.morphic.TouchList(
                rect(0,0,100,this.getExtent().y - 52),
                functions,
                {   extent: pt(100,30),
                    fontSize: 10,
                    padding: rect(5,0,0,5)});
        connect(list, "selection", this, "openTabFor");
        list.gridCoords = pt(column, 2);
        return list
    },
    cleanUp: function() {
        this.gridContainer && this.gridContainer.remove();
    },

}, 
'event handling', {
    onTouchEnd: function() {
        //TODO: this function should be in Events.js
    },
},
'script opening', {
    openTabFor: function(scriptName, optTarget) {
        //TODO: add name of morph
        if (!scriptName)
            return;
        var target = optTarget || this.owner.target,
            openTab = this.tabBar.submorphs.find(function (ea) {
                return ea.fctTarget === target && ea.fctScriptName === scriptName
            }),
            tab = openTab || this.buildTabView(scriptName, target);
        tab.getTabBar().activateTab(tab);
        this.gridContainer.owner.remove();
        tab.initializeTags()
        this.cleanUp();
    },
    buildTabView: function(scriptName, target) {
        var newTab = new lively.morphic.ObjectEditorTab(this.tabBar);
        newTab.setLabel(newTab.determineLabelString(scriptName, target));
        this.tabBar.addTab(newTab);
        newTab.setPosition(pt(newTab.getPosition().x,5))
        disconnect($world, "currentlySelectedMorph", this.gridContainer, "rebuildForNewTarget");
        newTab.pane.setPosition(pt(0,40));
        var textMorph = new lively.morphic.Text(rect(0,0,10,10));
        textMorph.applyStyle({
            extent: newTab.pane.getExtent().subPt(pt(100,0)),
            fontFamily: "Monaco,courier",
            fontSize: 9,
            clipMode: "auto",
        });
        newTab.pane.textMorph = textMorph;
        this.openTabs.push(newTab)
        var textMorph = newTab.pane.textMorph
        newTab.fctTarget = target;
        newTab.fctScriptName = scriptName;
        textMorph.doitContext = target;
        var textMorph = newTab.pane.textMorph;
        connect(textMorph, "textString", textMorph, "highlightJavaScriptSyntax");
        connect(textMorph, "textString", newTab, "updateChangedIndicator");
        var scriptText = this.getSourceForScript(scriptName, target);
        if (scriptName !== "newScript")
            newTab.setOriginalScript(scriptText);
        textMorph.setTextString(scriptText);
        newTab.pane.addMorph(textMorph);
        //newTab.tagList && textMorph.addMorph(newTab.tagList)
        return newTab
    },
    getSourceForScript: function(scriptName, target) {
        var script = target[scriptName],
            annotation = '',
            scriptSource = '',
            tagScript = '';
        if (script === undefined)
            script = function newScript() {

                }
        if (script.timestamp && script.user)
            annotation = Strings.format('// changed at %s by %s  \n', script.timestamp, script.user);
        scriptSource = Strings.format('%s', script.getOriginal());
        return annotation + scriptSource;
    },
});

lively.morphic.Flap.subclass('lively.morphic.ObjectEditorFlap',
'properties', {

    tabBarHeight: 40,


},
'initialization', {
    initialize: function ($super) {
        $super('ObjectEditor', 'top')
        // target is supposed to be the current selection
        connect(lively.morphic.World.current(), "currentlySelectedMorph", this, "setTarget");
        this.tabContainer = this.initializeTabContainer();
        // When opening a plain ObjectEditor, it is supposed to point to the world.
        this.target = lively.morphic.World.current();
        this.nextButton = this.initializeNextButton();
        this.saveButton = this.initializeSaveButton();
        this.deleteButton = this.initializeDeleteButton();
        this.runButton = this.initializeRunButton();
        return this
    },
    initializeTabContainer: function () {
        var self = this,
            tabContainer = new lively.morphic.ObjectEditorTabContainer(undefined, this.getExtent(), this.tabBarHeight);
        this.tabContainer = tabContainer;
        this.addMorph(tabContainer)
        var padding = 8,
            extent = this.getExtent().subPt(pt(0, 2*padding))
        tabContainer.setBounds(pt(0,padding).extent(extent))
        this.tabBar = tabContainer.tabBar;
        this.tabBar.applyStyle({
            borderWidth: 0,
            enableDragging: false,
            enableGrabbing: false,
            borderWidth: 0,
            fill: Color.rgba(47,47,47,0.7)
        })
        tabContainer.setTabPaneExtent(tabContainer.getExtent().subPt(pt(0,self.tabBar.getExtent().y)));
        connect(this, 'target', tabContainer, 'buildModalViewFor');
        return tabContainer;
    },

    initializeNextButton: function () {
        var self = this,
            nextButton = new lively.morphic.Button(pt(this.tabBar.getExtent().x - this.tabBarHeight,0)
                .extent(pt(this.tabBarHeight,this.tabBarHeight)), '>>');
        nextButton.addSctipt(function onFire () {
            var target = $world.currentlySelectedMorph || $world.currentHaloTarget || $world;
            self.tabContainer.buildModalViewFor(target);
            $world.ignoreHalos = false;
        });
        connect(nextButton, 'fire', nextButton, 'onFire');
        nextButton.onMouseDown = function() {
            $world.ignoreHalos = true;
        };
        nextButton.beFlapButton();
        nextButton.setExtent(pt(40,30))
        nextButton.setName('nextButton')
        nextButton.moveBy(pt(0,5));
        nextButton.label.applyStyle({
            padding: rect(0,5,0,0)
        })
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
            var activeTab = self.tabContainer.activeTab()
                scriptPane = activeTab.pane.textMorph,
                script = Strings.format('this.addScript(%s);', scriptPane.getTextString()),
                saved = scriptPane.boundEval(script),
                addScriptRegex = /function\s+([^\(]*)\(/,
                addScriptMatches = [],
                addScriptMatch = addScriptRegex.exec(script);
            if (activeTab.fctScriptName === "newScript")
                activeTab.fctScriptName = addScriptMatch[1]
            activeTab.fctScriptName = addScriptMatch[1];
            activeTab.fctTarget[activeTab.fctScriptName].setProperty("tags", activeTab.tagList.selection);
            activeTab.setLabel(activeTab.determineLabelString(activeTab.fctScriptName, activeTab.fctTarget));
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
        saveButton.beFlapButton();
        saveButton.moveBy(pt(0,5));
        return saveButton
    },
    initializeDeleteButton: function() {
        var self = this,
            width = 40,
            deleteButton = new lively.morphic.Button(rect(0,0,0,0), 'X');
        deleteButton.beFlapButton();
        deleteButton.applyStyle({
            position: pt(this.saveButton.getPosition().x-width,5),
            extent: pt(width, this.tabBarHeight - 10),
        })
        deleteButton.onTap = function () {
            var activeTab = self.tabContainer.activeTab();
            var deleteFunc = function () {
                delete activeTab.fctTarget[activeTab.fctScriptName]
            }
            if (confirm("Do you really want to delete " + activeTab.getLabel() + "?")) {
                deleteFunc();
                activeTab.closeTab();
            }
        }
        return this.tabBar.addMorph(deleteButton);
    },

    initializeRunButton: function() {
        var self = this,
            width = 100,
            runButton = new lively.morphic.Button(pt(this.deleteButton.getPosition().x - width,0)
                    .extent(pt(width, this.tabBarHeight)), 'Run');
        runButton.onTap = function() {
            this.run();
        };
        runButton.run = function() {
            var activeTab = self.tabContainer.activeTab();
            var tags = activeTab.fctTarget[activeTab.fctScriptName]();
        };
        runButton.beFlapButton();
        runButton.moveBy(pt(0,5));
        runButton.label.applyStyle({
            padding: rect(0,6,0,0)
        })
        return this.tabBar.addMorph(runButton);
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
    onTouchEnd: function(evt) {
        evt.stop();
        return true;
    },
});

lively.morphic.Box.subclass('lively.morphic.TextControl',
'initilization', {
    initialize: function ($super, bounds) {
        var returnValue = $super(bounds);
        this.initializeButtons();
        this.applyStyle({
            fill: Color.rgba(47,47,47,0.5),
            borderRadius: '0px 0px 5px 0px',
            layout: {
                adjustForNewBounds: true
            }
        })
        this.disableSelection();
        return returnValue
    },
    initializeButtons: function() {
        // Creates the interaction buttons according to a pattern
        // add buttons by naming them the way you name their action function in buttonTypes
        var that = this,
            i=0,
            buttonTypes = ['Do it', 'Do all', 'Print', 'Save'];
        this.setLayouter(new lively.morphic.Layout.HorizontalLayout(this));
        buttonTypes.each(function (ea) {
            var button = new lively.morphic.Button(rect(0,0,65.0,32.0), ea);
            button.beBlackButton();
            var str = ea.replace(' ', '');
            that[str+'Button'] = button;
            button.gridCoords = pt(i,0);
            button.label.setPadding(rect(5,7,0,0));
            var funcName = 'trigger'+ea.replace(' ', '')
            connect(button, 'fire', that, funcName);
            that.addMorph(button);
            button.applyStyle({
                layout: {
                    resizeWidth: true,
                    resizeHeight: true
                },
            })
            i++
        })
        this.applyLayout();
    },
},
'actions', {
    triggerDoit: function() {
        if (!this.getTarget()) return
        var textSelectionRange = this.getTextMorph().getSelectionRange();
        if (textSelectionRange) {
            this.prevSelectionRange = textSelectionRange;
            var selection = textSelectionRange;
        }
        else {
            var selection = this.prevSelectionRange;
        };
        var string = this.getTextMorph().textString;
        if (selection[0] == selection[1]) {
            // do stuff on one line
            var start = string.slice(0, selection[0]).lastIndexOf('\n') + 1,
                end = string.indexOf('\n', selection[0]);
            if (start === -1) start = 0;
            if (end === -1) end = string.length;
            selection = [start, end];
        }
        var code = this.getTextMorph().textString.slice(selection[0], selection[1]);
        this.getTextMorph().tryBoundEval(code);
        return true;
    },
    triggerDoall: function() {
        if (!this.getTarget()) return
        this.getTextMorph().evalAll();
    },
    triggerPrint: function() {
        if (!this.getTarget()) return
        var textMorph = this.getTextMorph(),
            textSelectionRange = textMorph.getSelectionRange();
        if (!textSelectionRange) {
            textMorph.focus();
            textMorph.setSelectionRange(this.prevSelectionRange[0], this.prevSelectionRange[1]);
        }
        else {
            this.prevSelectionRange = textSelectionRange;
        }
        textMorph.doPrintit();
        return true;
    },
    triggerSave: function() {
        if (!this.getTarget()) return
        this.getTextMorph().doSave();
    },
},
'accessing', {
    getTextMorph: function() {
        return this.textMorph
    },
    setTextMorph: function(morph) {
        this.textMorph = morph;
    },
    setTarget: function(morph) {
        // TODO: implement rest (updating and stuff)
        this.setTextMorph(morph)
    },
    getTarget: function() {
        return this.textMorph
    },
    fitInWorld: function() {
        var world = lively.morphic.World.current(),
            extent = pt(document.documentElement.clientWidth / 5, document.documentElement.clientHeight / 10),
            pos = pt(0, 0)
                .scaleBy(1 / world.getZoomLevel())
                .addPt(pt(document.body.scrollLeft, document.body.scrollTop));
            this.setExtent(extent);
            this.setPosition(pos);
            this.setScale(1 / world.getZoomLevel())
            this.submorphs.each(function (ea) {
                ea.label.setExtent(ea.getExtent())
            })
            this.setFixed(true);
    }


}) // end of lively.morphic.TextControl

}) // end of module