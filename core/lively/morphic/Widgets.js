module('lively.morphic.Widgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.Button',
'settings', {
    style: {
        enableGrabbing: false,
        enableDropping: false,
        borderColor: Color.neutral.lightGray,
        borderWidth: 1,
        borderRadius: 5,
        padding: Rectangle.inset(0,3),
        fill: new lively.morphic.LinearGradient(
            [{offset: 0, color: Color.gray.mixedWith(Color.white, 0.2)},
            {offset: 0.4, color: Color.gray.mixedWith(Color.white, 0.9)},
            {offset: 0.6, color: Color.gray.mixedWith(Color.white, 0.9)},
            {offset: 1, color: Color.gray.mixedWith(Color.white, 0.3)}],
            "NorthSouth")
    },
    labelStyle: {
        borderWidth: 0,
        fill: null,
        padding: Rectangle.inset(0,3),
        fontSize: 10,
        align: 'center',
        fixedWidth: true,
        fixedHeight: true,
        textColor: Color.black
    }
},
'initializing', {
    initialize: function($super, bounds, labelString) {
        $super(this.defaultShape());
        if (bounds) this.setBounds(bounds);

        this.value = false;
        this.toggle = false;
        this.isActive = true;
        this.normalFill = this.getFill();
        this.lighterFill = this.normalFill.lighter();
        this.setFill(this.normalFill);

        this.label = new lively.morphic.Text(this.getExtent().extentAsRectangle(), labelString);
        this.addMorph(this.label);
        this.label.beLabel(this.labelStyle);
    },
},
'accessing', {
    setLabel: function(label) {
        this.label.setTextString(label);
        this.label.setExtent(this.getExtent());
        // FIXME what about labelStyle defined in my prototype?
        this.label.applyStyle({
            align: 'center',
            fixedHeight: true,
            fixedWidth: true,
            clipMode: 'hidden',
            padding: Rectangle.inset(0,0)
        });
        return this;
    },
    getLabel: function(label) { return this.label.textString },

    setValue: function(bool) {
        this.value = bool;
        // buttons should fire on mouse up
        if (!bool || this.toggle) lively.bindings.signal(this, 'fire', bool);
        this.changeAppearanceFor(bool);
    },
    setExtent: function($super, extent) {
        // FIXME use layout! spaceFill!
        $super(extent);
        this.label && this.label.setExtent(extent)
    },
    setPadding: function(padding) { this.label && this.label.setPadding(padding) },
},
'styling', {
    changeAppearanceFor: function(value) {
        this.setFill(value ? this.lighterFill : this.normalFill);
    },
},
'events', {

    onMouseDown: function (evt) {
        if (this.isActive && evt.isLeftMouseButtonDown()
            && !this.toggle && !evt.isCommandKey()) {
            this.setValue(true);
        }
        return false;
    },
    onMouseUp: function(evt) {
        if (this.isActive && evt.isLeftMouseButtonDown()
                && !evt.isCommandKey()) {
            var newValue = this.toggle ? !this.value : false;
            this.setValue(newValue);
            return false;
        }
        return false;
    },
    simulateButtonClick: function() {
        var world = this.world() || lively.morphic.World.current(),
            hand = world.firstHand();
        function createEvent() {
            return {
                isLeftMouseButtonDown: Functions.True,
                isRightMouseButtonDown: Functions.False,
                isCommandKey: Functions.False,
                isAltDown: Functions.False,
                world: world,
                hand: hand,
                getPosition: function() { return hand.getPosition() }
            }
        }
        this.onMouseDown(createEvent());
        this.onMouseUp(createEvent());
    },
},
'menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'set label', function(evt) {
            $world.prompt('Set label', function(input) {
                if (input !== null)
                    self.setLabel(input || '');
            }, self.getLabel());
        }])
        return items;
    },
});

lively.morphic.Morph.subclass('lively.morphic.Image',
'initializing', {
    doNotSerialize: ['isLoaded'],
    initialize: function($super, bounds, url, useNativeExtent) {
        var imageShape = this.createImageShape(bounds.extent().extentAsRectangle());
        $super(imageShape);
        this.setPosition(bounds.topLeft());
        this.setImageURL(url);
        if (useNativeExtent) connect(imageShape, 'isLoaded', this, 'setNativeExtent', {removeAfterUpdate: true});
        else connect(imageShape, 'isLoaded', this, 'setExtent', {removeAfterUpdate: true, converter: function() { return this.targetObj.getExtent() }});
    },
    createImageShape: function(bounds, url) {
        return new lively.morphic.Shapes.Image(bounds, url);
    },
},
'accessing', {
    setImageURL: function(url) { return this.shape.setImageURL(url) },
    getImageURL: function() { return this.shape.getImageURL() },
    getNativeExtent: function() { return this.shape.getNativeExtent() },
    setNativeExtent: function() {
        var ext = this.getNativeExtent();
        if (ext.x < 10) ext.x = 10;
        if (ext.y < 10) ext.y = 10;
        return this.setExtent(ext);
    },
},
'halos', {
    getHaloClasses: function($super) {
        return $super().concat([lively.morphic.SetImageURLHalo]);
    },
},
'menu', {
    morphMenuItems: function($super) {
        var items = $super();
        items.push(['set to original extent', this.setNativeExtent.bind(this)]);
        items.push(['inline image data', this.convertToBase64.bind(this)]);
        return items;
    },
},
'inline image', {
    convertToBase64: function() {
        var urlString = this.getImageURL();

        var type = urlString.substring(urlString.lastIndexOf('.') + 1, urlString.length)
        if (type == 'jpg') type = 'jpeg'
        if (!['gif', 'jpeg', 'png', 'tiff'].include(type)) type = 'gif'

        if (false && Global.btoa) {
            // FIXME actually this should work but the encoding result is wrong...
            // maybe the binary image content is not loaded correctly because of encoding?
            urlString = URL.makeProxied(urlString);
            var content = new WebResource(urlString).get(null, 'image/' + type).content

            var fixedContent = content.replace(/./g, function(m) {
                return String.fromCharCode(m.charCodeAt(0) & 0xff);
            });
            var encoded = btoa(fixedContent);
            this.setImageURL('data:image/' + type + ';base64,' + encoded);
        } else {
            if (!urlString.startsWith('http'))
                urlString = URL.source.getDirectory().withFilename(urlString).toString()
            require('server.nodejs.WebInterface').toRun(function() { // FIXME
                var encoded = this.encodeOnServer(urlString)
                if (!encoded || encoded == '')
                    lively.morphic.World.current().alert('Cannot convert image with url ' + urlString + ' to base64');
                else
                    this.setImageURL('data:image/' + type + ';base64,' + encoded);
            }.bind(this));
        }
    },
    encodeOnServer: function(urlString) {
        var cmd = 'curl --silent "' + urlString + '" | openssl base64'
        var result = new CommandLineServerInterface().beSync().runCommand(cmd).result;
        return result && result.stdout ? result.stdout : '';
    },
});
Object.extend(lively.morphic.Image, {
    fromURL: function(url, optBounds) {
        var bounds = optBounds || new Rectangle(0,0, 100, 100);
        return new lively.morphic.Image(bounds, url, optBounds == undefined)
    },
});
lively.morphic.Morph.subclass('lively.morphic.CheckBox',
'properties', {
    connections: {
        setChecked: {}
    }
},
'initializing', {
    initialize: function($super, isChecked) {
        $super(this.createShape());
        this.setChecked(isChecked);
    },
    createShape: function() {
        var node = XHTMLNS.create('input');
        node.type = 'checkbox';
        return new lively.morphic.Shapes.External(node);
    },
},
'accessing', {
    setChecked: function(bool) {
        this.checked = bool;
        this.renderContext().shapeNode.checked = bool;
        return bool;
    },
},
'testing', {
    isChecked: function() {
        return this.checked;
    },
},
'event handling', {


    onClick: function(evt) {
        // for halos/menus
         if (evt.isCommandKey() || !evt.isLeftMouseButtonDown()) {
            evt.stop()
            return true;
        }
        // we do it ourselves
        this.setChecked(!this.isChecked())
        // evt.stop();
         return true;
     },


},
'serialization', {
    prepareForNewRenderContext: function ($super, renderCtx) {
        $super(renderCtx);
        // FIXME what about connections to this.isChecked?
        // they would be updated here...
        this.setChecked(this.isChecked());
    },
});
lively.morphic.Box.subclass('lively.morphic.ProgressBar',
'settings', {
    style: {
        fill: Color.white, borderColor: Color.rgb(170,170,170), borderWidth: 1, borderRadius: 5,
        adjustForNewBounds: true,
        clipMode: 'hidden', // so that sharp borders of progress do not stick out
    },
    progressStyle: {
        scaleHorizontal: true,
        scaleVertical: true,
        borderColor: Color.rgb(170,170,170),
        borderWidth: 1,
        borderRadius: "5px 0px 0px 5px",
        fill: new lively.morphic.LinearGradient([
            {offset: 0, color: Color.rgb(223,223,223)},
            {offset: 1, color: Color.rgb(204,204,204)}]),
        clipMode: 'hidden', // for label
    },
    labelStyle: {
        fontSize: 11,
        fixedWidth: true,
        fixedHeight: false,
        clipMode: 'hidden',
        align: 'center',
    },
},
'initializing', {
    initialize: function($super, bounds) {
        bounds = bounds || new Rectangle(0,0, 200,22);
        $super(bounds);
        this.createProgressMorph();
        this.createLabel();
        this.value = 0;
    },
    createProgressMorph: function() {
        var bounds = this.innerBounds();
        this.progressMorph = this.addMorph(lively.morphic.Morph.makeRectangle(bounds.withWidth(0)));
        this.progressMorph.applyStyle(this.progressStyle);
        this.progressMorph.ignoreEvents();
    },
    createLabel: function() {
        this.labelBlack = lively.morphic.Text.makeLabel('', Object.extend({textColor: Color.black, centeredVertical: true, scaleHorizontal: true}, this.labelStyle));
        this.labelWhite = lively.morphic.Text.makeLabel('', Object.extend({textColor: Color.white}, this.labelStyle));

        this.addMorphBack(this.labelBlack);
        this.progressMorph.addMorph(this.labelWhite);

        this.labelBlack.ignoreEvents();
        this.labelWhite.ignoreEvents();

        connect(this.labelBlack, 'extent', this.labelWhite, 'setExtent')
        connect(this.labelBlack, 'position', this.labelWhite, 'setPosition')
        this.labelBlack.setBounds(this.innerBounds());
        this.labelBlack.fit();
    },


},
'accessing', {
    getValue: function() { return this.value },
    setValue: function(v) { this.updateBar(v); return this.value = v },
    setLabel: function(string) {
        this.labelBlack.textString = string;
        this.labelWhite.textString = string;
    },

},
'updating', {
    updateBar: function(value) {
	var maxExt = this.getExtent();
        // this.progressMorph.setPosition(pt(1,1));
        this.progressMorph.setExtent(pt(Math.floor(maxExt.x * value), maxExt.y));
    },
});

lively.morphic.Text.subclass('lively.morphic.FrameRateMorph', {

    initialize: function($super, shape) {
        // Steps at maximum speed, and gathers stats on ticks per sec and max latency
        $super(shape);
        this.setTextString('FrameRateMorph')
        this.reset(new Date());
    },

    reset: function(date) {
        this.lastTick = date.getSeconds();
        this.lastMS = date.getTime();
        this.stepsSinceTick = 0;
        this.maxLatency = 0;
    },

    nextStep: function() {
        var date = new Date();
        this.stepsSinceTick++;
        var nowMS = date.getTime();
        this.maxLatency = Math.max(this.maxLatency, nowMS - this.lastMS);
        this.lastMS = nowMS;
        var nowTick = date.getSeconds();
        if (nowTick != this.lastTick) {
            this.lastTick = nowTick;
            var ms = (1000 / Math.max(this. stepsSinceTick,1)).roundTo(1);
            this.setTextString(this.stepsSinceTick + " frames/sec (" + ms + "ms avg),\nmax latency " + this.maxLatency + " ms.");
            this.reset(date);
        }
    },

    startSteppingScripts: function() { this.startStepping(1, 'nextStep'); }

});

lively.morphic.Box.subclass('lively.morphic.Menu',
'settings', {
    style: {
        fill: Color.gray.lighter(3),
        borderColor: Color.gray.lighter(),
        borderWidth: 1,
        borderStyle: 'outset',
        borderRadius: 4,
        opacity: 0.95,
    },
    isEpiMorph: true,
},
'initializing', {
    initialize: function($super, title, items) {
        $super(new Rectangle(0,0, 120, 10));
        this.items = [];
        this.itemMorphs = [];

        if (title) this.setupTitle(title);
        if (items) this.addItems(items);
    },
    setupTitle: function(title) {
        if (this.title) this.title.remove()
        this.title = new lively.morphic.Text(
            new Rectangle(0,0, this.getExtent().x, 25),
            String(title).truncate(26)).beLabel({
                borderRadius: this.getBorderRadius(),
                borderColor: this.getBorderColor(),
                borderWidth: 0,
                fill: new lively.morphic.LinearGradient([{offset: 0, color: Color.white},
                                                         {offset: 1, color: Color.gray}]),
                textColor: CrayonColors.lead,
                clipMode: 'hidden',
                fixedWidth: false,
                fixedHeight: true,
                borderColor: Color.gray.lighter(2),
                borderWidth: 1,
                borderStyle: 'outset',
                borderRadius: 4,
                padding: Rectangle.inset(5,5,5,5),
                emphasize: {fontWeight: 'bold'}
            });
        this.title.align(this.title.bounds().bottomLeft(), pt(0,0));
        this.addMorph(this.title);
        this.fitToItems()
    },
},
'opening', {
    openIn: function(parentMorph, pos, remainOnScreen, captionIfAny) {
        this.setPosition(pos || pt(0,0));

        if (captionIfAny) { this.setupTitle(captionIfAny) };

        var owner = parentMorph || lively.morphic.World.current();
        this.remainOnScreen = remainOnScreen;
        if (!remainOnScreen) {
            if (owner.currentMenu) { owner.currentMenu.remove() };
            owner.currentMenu = this;
        } else {
            this.isEpiMorph = false;
        }

        owner.addMorph(this);
        this.fitToItems();

        this.offsetForWorld(pos);
        // delayed because of fitToItems
        // currently this is deactivated because the initial bounds are correct
        // for our current usage
        // this.offsetForWorld.curry(pos).bind(this).delay(0);

        return this;
    },
},
'removing', {
    remove: function($super) {
        var w = this.world();
        if (w && w.currentMenu === this) w.currentMenu = null;
        $super();
    },
},
'item management', {
    removeAllItems: function() {
        this.items = [];
        this.itemMorphs = [];
        this.submorphs.without(this.title).invoke('remove');
    },

    createMenuItems: function(items) {
        function createItem(string, value, idx, callback, callback2) {
            return {
                isMenuItem: true,
                isListItem: true,
                string: string,
                value: value,
                idx: idx,
                onClickCallback: callback,
                onMouseOverCallback: callback2,
            }
        }
        var result = [], self = this;
        items.forEach(function(item, i) {
            if (item.isMenuItem) { item.idx = i; result.push(item); return };
            // item = [name, callback]
            if (Object.isArray(item) && Object.isFunction(item[1])) {
                result.push(createItem(String(item[0]), item[0], i, item[1]))
                return;
            }
            // item = [name, target, methodName, args...]
            if (Object.isArray(item) && Object.isString(item[2])) {
                result.push(createItem(String(item[0]), item[0], i, function(evt) {
                    var receiver = item[1],
                        method = receiver[item[2]],
                        args = item.slice(3);
                    method.apply(receiver, args) }))
                return;
            }
            // sub menu item = [name, [sub elements]]
            if (Object.isArray(item) && Object.isArray(item[1])) {
                var name = item[0], subItems = item[1];
                result.push(createItem(name, name, i, null, function(evt) {
                    self.openSubMenu(evt, name, subItems) }));
                return;
            }
            // item = "some string"
            result.push(createItem(String(item), item, i, function() { alert('clicked ' + self.idx) }));
        });
        return result;
    },

    addItems: function(items) {
        this.removeAllItems();
        this.items = this.createMenuItems(items);
        var y = 0, x = 0, self = this;

        this.items.forEach(function(item) {
            var itemHeight = 23,
                itemMorph = new lively.morphic.Text(
                    new Rectangle(0, y, this.getExtent().x, itemHeight), item.string);
            this.itemMorphs.push(this.addMorph(itemMorph));
            itemMorph.applyStyle({
                clipMode: 'hidden',
                fixedHeight: true,
                fixedWidth: false,
                borderWidth: 0,
                fill: null,
                handStyle: 'default',
                enableGrabbing: false,
                allowInput: false,
                fontSize: 10.5,
                padding: Rectangle.inset(4,4) });
            itemMorph.setPadding(Rectangle.inset(3,2));
            itemMorph.onMouseUp = function(evt) {
                  if((evt.world.clickedOnMorph !== itemMorph)
                    && (Date.now() - evt.world.clickedOnMorphTime < 500))
                    return false; // only a click
                // FIXME $super
                lively.morphic.Morph.prototype.onMouseUp(evt);
                //if (!evt.isLeftMouseButtonDown()) return false;
                item.onClickCallback && item.onClickCallback(evt);
                if (!self.remainOnScreen) self.remove(); // remove the menu
                evt.stop();
                return true;
            }


            itemMorph.registerForEvent('mouseover', itemMorph, 'onMouseOver');
            itemMorph.onMouseOver = function(evt) {
                itemMorph.owner.itemMorphs.invoke('setFill', null);
                itemMorph.owner.itemMorphs.invoke('setTextColor', Color.black);
                itemMorph.applyStyle({
                    fill: new lively.morphic.LinearGradient([
                        {offset: 0, color: Color.rgb(100,131,248)},
                        {offset: 1, color: Color.rgb(34,85,245)}]),
                    textColor: Color.white,
                    borderRadius: 4
                })
                self.overItemMorph = itemMorph;
                self.removeSubMenu()
                item.onMouseOverCallback && item.onMouseOverCallback(evt);
                evt.stop();
                return true;
            };
            itemMorph.addScript(function onMouseWheel(evt) {
                return false; // to allow scrolling
            })
            itemMorph.addScript(function onSelectStart(evt) {
                return false; // to allow scrolling
            })
            y += itemHeight;
            x = Math.max(x, itemMorph.getTextExtent().x);
        }, this)
        // this.setExtent(pt(this.getExtent().x, y))
        if (this.title) y += this.title.bounds().height;
        this.setExtent(pt(x, y));
    },
    addItems2: function() {
/* use list morph for items...
        var listMorph = new lively.morphic.List(new Rectangle(0,0, 200, 0), this.items);
        listMorph.applyStyle({clipMode: 'visible', fill: Color.white})
        listMorph.addScript(function onMouseOver(evt) {
            // just highlight
            var idx = this.renderContextDispatch('getItemIndexFromEvent', evt);
            this.renderContextDispatch('selectAt', idx);
            var item = this.itemList[idx];
            this.owner.removeSubMenu()
            this.owner.overItemMorph = this;
            if (item && item.onMouseOverCallback) item.onMouseOverCallback(evt);
            evt.stop()
            return true;
        })
        listMorph.addScript(function onMouseDown(evt) {
            if (!$super(evt)) return false;
            var item = this.itemList[this.selectedLineNo];
            if (item && item.onClickCallback) item.onClickCallback(evt);
            this.owner.remove();
            evt.stop();
            return true;
        })
        this.addMorph(listMorph);
(function() { listMorph.setExtent(listMorph.getListExtent()); }).delay(0);
// lively.bindings.callWhenNotNull(
    // this, 'owner',
    // {fit: function() { alert(listMorph.getListExtent()); listMorph.setExtent(listMorph.getListExtent()); }}, 'fit');

        return;
*/
    },
},
'sub menu', {
    openSubMenu: function(evt, name, items) {
        var m = new lively.morphic.Menu(null, items);
        this.addMorph(m);
        m.fitToItems()
        this.subMenu = m;
        m.ownerMenu = this;

        // we do this twice because effect of fitToItems is delayed
        m.offsetForOwnerMenu();
        m.offsetForOwnerMenu.bind(m).delay(0);

        return m;
    },
    removeSubMenu: function() { if (this.subMenu) { var m = this.subMenu; m.ownerMenu = null; this.subMenu = null; m.remove() } },
    removeOwnerMenu: function() { if (this.ownerMenu) { var m = this.ownerMenu; this.ownerMenu = null; m.remove() } },
},
'removal', {
    remove: function($super) {
        $super();
        this.removeSubMenu();
        this.removeOwnerMenu();
    },
},
'bounds calculation', {
    moveBoundsForVisibility: function(menuBounds, visibleBounds) {
        var offsetX = 0,
            offsetY = 0;
        Global.lastMenuBounds = menuBounds;

        if (menuBounds.right() > visibleBounds.right())
            offsetX = -1 * (menuBounds.right() - visibleBounds.right());

        var overlapLeft = menuBounds.left() + offsetX;
        if (overlapLeft < 0)
            offsetX += -overlapLeft;

        if (menuBounds.bottom() > visibleBounds.bottom()) {
            offsetY = -1 * (menuBounds.bottom() - visibleBounds.bottom());
            // so that hand is not directly over menu, does not work when
            // menu is in the bottom right corner
            offsetX += 1;
        }
        var overlapTop = menuBounds.top() + offsetY;
        if (overlapTop < 0)
            offsetY += -overlapTop;

        return menuBounds.translatedBy(pt(offsetX, offsetY));
    },
    moveSubMenuBoundsForVisibility: function(subMenuBnds, mainMenuItemBnds, visibleBounds, direction) {
        // subMenuBnds is bounds to  be transformed, mainMenuItemBnds is the bounds of the menu
        // item that caused the submenu to appear, visbleBounds is the bounds that the submenu
        // should fit into, when there are multiple submenus force one direction with forceDirection
        if (!direction) {
            direction = mainMenuItemBnds.right() + subMenuBnds.width > visibleBounds.right() ?
                'left' : 'right';
        }
        var extent = subMenuBnds.extent();
        if (direction === 'left') {
            subMenuBnds = mainMenuItemBnds.topLeft().addXY(-extent.x, 0).extent(extent);
        } else {
            subMenuBnds = mainMenuItemBnds.topRight().extent(extent);
        }

        if (subMenuBnds.bottom() > visibleBounds.bottom()) {
            var deltaY = -1 * (subMenuBnds.bottom() - visibleBounds.bottom());
            subMenuBnds = subMenuBnds.translatedBy(pt(0, deltaY));
        }

        // if it overlaps at the top move the bounds so that it aligns woitht he top
        if (subMenuBnds.top() < visibleBounds.top()) {
            var deltaY = visibleBounds.top() - subMenuBnds.top();
            subMenuBnds = subMenuBnds.translatedBy(pt(0, deltaY));
        }

        return subMenuBnds;
    },

    offsetForWorld: function(pos) {
        var bounds = this.innerBounds().translatedBy(pos);
        if (this.title) {
            bounds = bounds.withTopLeft(bounds.topLeft().addXY(0, this.title.getExtent().y));
        }
        if (this.owner.visibleBounds) {
            bounds = this.moveBoundsForVisibility(bounds, this.owner.visibleBounds());
        }
        this.setBounds(bounds);
    },

    offsetForOwnerMenu: function() {
        var owner = this.ownerMenu,
            visibleBounds = this.world().visibleBounds(),
            localVisibleBounds = owner.getTransform().inverse().transformRectToRect(visibleBounds),
            newBounds = this.moveSubMenuBoundsForVisibility(
                this.innerBounds(),
                owner.overItemMorph ? owner.overItemMorph.bounds() : new Rectangle(0,0,0,0),
                localVisibleBounds);
        this.setBounds(newBounds);
    },

    fitToItems: function() {
        var offset = 10,
            morphs = this.itemMorphs;
        if (this.title) morphs = morphs.concat([this.title]);
        var widths = morphs.invoke('getTextExtent').pluck('x');
        var width = Math.max.apply(Global, widths) + offset;
        var newExtent = this.getExtent().withX(width);
        this.setExtent(newExtent);
        morphs.forEach(function(ea) { ea.setExtent(ea.getExtent().withX(newExtent.x)) })
    }

});

Object.extend(lively.morphic.Menu, {
    openAtHand: function(title, items) {
        return this.openAt(lively.morphic.World.current().firstHand().getPosition(), title, items);
    },
    openAt: function(pos, title, items) {
        var menu = new lively.morphic.Menu(title, items);
        return menu.openIn(lively.morphic.World.current(), pos, false);
    },
});


lively.morphic.Morph.addMethods(
'menu', {
    enableMorphMenu: function() {
        this.showsMorphMenu = true;
    },
    disableMorphMenu: function() { this.showsMorphMenu = false },
    openMorphMenuAt: function(pos) {
        return lively.morphic.Menu.openAt(pos, this.name || this.toString(), this.morphMenuItems());
    },
    showMorphMenu: function(evt) {
        this.openMorphMenuAt(evt.getPosition());
        evt.stop();
        return true;
    },
    morphMenuItems: function() {
        var self = this, items = [];
        items.push([
            'publish', function(evt) {
            self.copyToPartsBinWithUserRequest();
        }])
        items.push(['open in window', this.openInWindow.bind(this)]);

        // Drilling into scene to addMorph or get a halo
        var morphs = this.world().morphsContainingPoint(this.worldPoint(pt(0,0)))
            .reject(function(ea) { return ea === self})
            .reject(function(ea) { return ea === $world})
        var self = this;
        items.push(["add morph to...", morphs.collect(function(ea) {
                return [ea, function() { ea.addMorph(self)}]
        })])
        items.push(["get halo on...", morphs.collect(function(ea) {
                return [ea, function(evt) { ea.toggleHalos(evt)}]
        })])
        // Connections Scripting Support
        if (this.attributeConnections && this.attributeConnections.length > 0) {
            items.push(["connections", this.attributeConnections.collect(function(ea) {
                    return [ea, [["disconnect", function() {
                        alertOK("disconnecting " + ea)
                        ea.disconnect()}]]]
            })])
        }

        if (this.grabbingEnabled || this.grabbingEnabled == undefined) {
            items.push(["disable grabbing", this.disableGrabbing.bind(this)])
        } else {
            items.push(["enable grabbing", this.enableGrabbing.bind(this)])
        }

        if (this.submorphs.length > 0) {
            if (this.isLocked()) {
                items.push(["unlock parts", this.unlock.bind(this)])
            } else {
                items.push(["lock parts", this.lock.bind(this)])
            }
        }

        if (false) {
        items.push(["enable internal selections", function() {
            Trait('SelectionMorphTrait').applyTo(self, {override: ['onDrag', 'onDragStart', 'onDragEnd']});
            self.enableDragging();
        }])
        }

        if (this.reset)
            items.push(['reset', this.reset.bind(this)])
        return items;
    },
    getWindow: function() {
        if (this.isWorld) {
            return null;
        }
        if (this.isWindow) {
            return this;
        }
        if (this.owner) {
            return this.owner.getWindow();
        }
        return null;
    },




});
lively.morphic.Text.addMethods(
'menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            (this.evalEnabled ? '[X]' : '[  ]') + ' eval',
            function() { self.evalEnabled = !self.evalEnabled }
        ]);
        items.push([
            (this.syntaxHighlightingWhileTyping ? '[X]' : '[  ]') + ' syntax highlighting',
            function() { self.syntaxHighlightingWhileTyping ?
                self.disableSyntaxHighlighting() : self.enableSyntaxHighlighting() }
        ]);
        items.push([
            'convert to annotation',
            function() {
                var part = $world.openPartItem('AnnotationPin', 'PartsBin/Documentation');
                part.setPosition(self.getPosition());
                part.createAnnotationFromText(self);
                self.remove();
            }
        ]);
        items.push([
            (self.isInChunkDebugMode() ? 'disable' : 'enable') + ' text chunk debugging',
            function() { self.setChunkDebugMode(!self.isInChunkDebugMode()) }]);
        return items;
    },

});


lively.morphic.World.addMethods(
'tools', {
    loadPartItem: function(partName, optPartspaceName) {
        var optPartspaceName = optPartspaceName || 'PartsBin/NewWorld';
        var part = lively.PartsBin.getPart(partName, optPartspaceName);
        if (!part) 
        	return;
        if (part.onCreateFromPartsBin) part.onCreateFromPartsBin();
        return part;
    },
    openPartItem: function(partName, optPartspaceName) {
        var part = this.loadPartItem(partName, optPartspaceName);
        part.openInWorld(pt(0,0))
        part.align(part.bounds().center(), this.visibleBounds().center());
        return part;
    },
    openPartsBin: function(evt) {
        return this.openPartItem('PartsBinBrowser', 'PartsBin/Tools');
    },
    openInspectorFor: function(object, evt) {
        var part = this.openPartItem('Explorer', 'PartsBin/Tools');
        part.explore(object);
        return part;
    },
    openStyleEditorFor: function(morph, evt) {
        var editor = this.openPartItem('StyleEditor', 'PartsBin/Tools');
        editor.setTarget(morph);
        var globalPos = morph.owner.getGlobalTransform().transformPoint(
                morph.bounds().bottomLeft());
        editor.align(editor.bounds().topLeft(),globalPos);
        return editor;
    },
    openObjectEditor: function() {
        return this.openPartItem('ObjectEditor', 'PartsBin/Tools');
    },
    openObjectEditorFor: function(morph) {
        var part = this.openObjectEditor();
        part.setTarget(morph);
        return part;
    },
    openMethodFinder: function() {
        return this.openPartItem('MethodFinder', 'PartsBin/Tools');
    },
    openMethodFinderFor: function(searchString) {
        var toolPane = this.get('ToolTabPane');
        if (!toolPane) {
            toolPane = this.openPartItem('ToolTabPane', 'PartsBin/Dialogs'); 
            toolPane.openInWindow()
            toolPane.owner.name = toolPane.name +"Window"
        }
        var part = toolPane.openMethodFinderFor(searchString)
        return part;
    },
    openVersionViewer: function(evt) {
        return this.openPartItem('VersionViewer', 'PartsBin/Wiki');
    },
    openTestRunner: function() {
        var m = this.openPartItem('TestRunner', 'PartsBin/Tools');
        m.align(m.bounds().topCenter().addPt(pt(0,-20)), this.visibleBounds().topCenter());
        return m
    },
    openClassBrowserFor: function(searchString) {
        var part = this.openPartItem('ClassBrowser', 'PartsBin/Tools');
        part.targetMorph.searchClass(searchString);
        return part;
    },
    openPublishPartDialogFor: function(morph) {
        /*var part = this.openPartItem('PublishPartDialog', 'PartsBin/Dialogs');
        part.targetMorph.setTarget(morph);
        return part;*/
        var publishDialog = this.loadPartItem('PublishPartDialog', 'PartsBin/Dialogs');
        var metaInfo = morph.getPartsBinMetaInfo();
        publishDialog.targetMorph.setTarget(morph);
        if (morph.isCurrentPartsBinVersion()) {
            publishDialog.openInWorldCenter();
        }
        else {
            $world.confirm(metaInfo.partsSpaceName
                + metaInfo.partName
                + " was changed since loading it. Overwrite?", function (answer) {
                    answer && publishDialog.openInWorldCenter();
                })
        }
        return publishDialog;
    },
    openConnectDocumentation: function() {
        return this.openPartItem('HowConnectWorks', 'PartsBin/Documentation');
    },
    openShortcutDocumentation: function() {
        return this.openPartItem('HelpfulShortcuts', 'PartsBin/Documentation');
    },
    openPartsBinDocumentation: function() {
        return this.openPartItem('LivelysPartsBin', 'PartsBin/Documentation');
    },
    openSystemBrowser: function(evt) {
        var world = this,
            browser;
        require('lively.ide.SystemCodeBrowser').toRun(function() {
            browser = new lively.ide.SystemBrowser();
            browser.openIn(world);

            var lastOpened = lively.ide.SourceControl.registeredBrowsers.last();
            lastOpened && browser.setTargetURL(lastOpened.targetURL)
        });
        return browser;
    },
    browseCode: function(objectName, methodName, sourceModuleName) {
        // find code and browse it
        require('lively.ide.SystemCodeBrowser').toRun(function() {
           lively.ide.browse(objectName, methodName, sourceModuleName)
        });
    },

    openWorkspace: function(evt) {
        var text = this.addTextWindow({title: 'Workspace',
            content: 'nothing', syntaxHighlighting: true})
        text.accessibleInInactiveWindow = true;
        text.setFontFamily('Monaco,monospace');
        return text;
    },
    openAboutBox: function() {
        var text = this.addTextWindow({title: 'About Lively Kernel'});
        text.owner.setExtent(pt(390, 105));
        var webR = new WebResource(new URL(Config.rootPath));
        var licenseURL = 'http://lively-kernel.org/license/index.html';
        var headRevision = webR.getHeadRevision().headRevision;
        var repositoryString = 'Repository: ' + Config.rootPath;
        var revisionString = '\n\nRevision: ' + headRevision;
        var licenseString = '\n\nLicense: ' + licenseURL;
        text.setTextString(repositoryString + revisionString + licenseString);
        text.changeEmphasis('Repository: '.length, repositoryString.length + 1, function(emph, doEmph) {
            doEmph({uri: Config.rootPath});
        });
        text.changeEmphasis(repositoryString.length + revisionString.length + '\n\nLicense: '.length, repositoryString.length + revisionString.length + licenseString.length + 1, function(emph, doEmph) {
            doEmph({uri: licenseURL});
        });
        text.setSelectionRange(0,0)
        return text;
    }
},
'menu', {
    morphMenuPartsBinItems: function() {
        var partSpaceName = 'PartsBin/NewWorld'
        var partSpace = lively.PartsBin.partsSpaceNamed(partSpaceName);
        partSpace.load()
        return partSpace.getPartNames().sort().collect(function(ea) { return [ea, function() {
            var part = lively.PartsBin.getPart(ea, partSpaceName)
            lively.morphic.World.current().firstHand().addMorph(part)
        }]})
    },
    morphMenuDefaultPartsItems: function() {
        var items = [],
            partNames = ["Rectangle", "Ellipse", "Image", "Text", 'Line'].sort();

        items.pushAll(partNames.collect(function(ea) { return [ea, function() {
            var partSpaceName = 'PartsBin/Basic',
                part = lively.PartsBin.getPart(ea, partSpaceName);
			      if (!part) return;
            lively.morphic.World.current().firstHand().grabMorph(part);
        }]}))


        partNames = ["List", "Slider", "ScriptableButton", "Button"].sort()
        items.pushAll(partNames.collect(function(ea) { return [ea, function() {
            var partSpaceName = 'PartsBin/Inputs',
                part = lively.PartsBin.getPart(ea, partSpaceName);
			      if (!part) return;
            lively.morphic.World.current().firstHand().grabMorph(part);
        }]}))

        return items;
    },

    debuggingMenuItems: function(world) {
        var items = [
            ['reset world scale', this.resetScale.bind(this)],
            ['reset title bars', this.resetAllTitleBars.bind(this)],
            ['reset button labels', this.resetAllButtonLabels.bind(this)],
            ['World serialization info', function() {
                require('lively.persistence.Debugging').toRun(function() {
                    var json = lively.persistence.Serializer.serialize(world),
                        printer = lively.persistence.Debugging.Helper.listObjects(json);
                    world.addTextWindow(printer.toString());
                })}]];

        // method tracing items
        function disableGlobalTracing() {
            // FIXME better to move this functionality into lively.Tracing
            var controller = $morph("TracingController");
            if (controller) {
                controller.stopTrace();
            } else {
                lively.Tracing.stopGlobalDebugging();
            }
        }
        var tracersInstalled = lively.Tracing && lively.Tracing.stackTracingEnabled,
            globalTracingEnabled = tracersInstalled && lively.Tracing.globalTracingEnabled;
        if (tracersInstalled) {
            items.push(["Remove trace wrappers", function() {
                if (globalTracingEnabled) disableGlobalTracing();
                lively.Tracing.uninstallStackTracers();
            }]);

            if (!globalTracingEnabled) {
                items.push(['Start global tracing', function() {
                    lively.Tracing.startGlobalTracing()
                }]);
                items.push(['Start global debugging', function() {
                    require('lively.ast.Morphic').toRun(function() {
                        lively.Tracing.startGlobalDebugging()
                    });
                }]);
            }
        } else {
            items.push(['Prepare system for tracing/debugging', function() {
                require("lively.Tracing").toRun(function() {
                    lively.Tracing.installStackTracers();
                });
            }]);
        }
        if (Global.DebugScriptsLayer && DebugScriptsLayer.isGlobal()) {
            items.push(['[X] Debug Morphic Scripts', function() {
                DebugScriptsLayer.beNotGlobal()
            }]);
        } else {
            items.push(['[  ] Debug Morphic Scripts', function() {
                require('lively.ast.Morphic').toRun(function() {
                    DebugScriptsLayer.beGlobal()
                });
            }]);
        }
        return items;
    },

    morphMenuItems: function() {
        var world = this;
        var items = [
            ['PartsBin', this.openPartsBin.bind(this)],
            ['Parts', this.morphMenuDefaultPartsItems()],
            ['Tools', [
                ['Workspace', this.openWorkspace.bind(this)],
		['System Code Browser', this.openSystemBrowser.bind(this)],
                ['Object Editor', this.openObjectEditor.bind(this)],
                ['Test Runner', this.openTestRunner.bind(this)],
                ['Method Finder', this.openMethodFinder.bind(this)],
                ['Text Editor', function() { new lively.morphic.TextEditor().openIn(world) }]
            ]],
            ['Preferences', [
                ['set username', this.askForUserName.bind(this)],
                ['set extent', this.askForNewWorldExtent.bind(this)]]
            ],
            ['Debugging', this.debuggingMenuItems(world)],
            ['Wiki', [
                ['about this wiki', this.openAboutBox.bind(this)],
                ['view versions of this world', this.openVersionViewer.bind(this)],
                ['download world', function() {
                    require('lively.persistence.StandAlonePackaging').toRun(function() {
                        lively.persistence.StandAlonePackaging.packageCurrentWorld();
                    });
                }],
                ['upload world to Dropbox', function() {
                    require('apps.Dropbox').toRun(function() {
                        DropboxAPI.uploadArchivedWorld();
                    });
                }],
                ['delete world', this.interactiveDeleteWorldOnServer.bind(this)]
            ]],
            ['Documentation', [
                ["on short cuts", this.openShortcutDocumentation.bind(this)],
                ["on connect data bindings", this.openConnectDocumentation.bind(this)],
				        ["on Lively's PartsBin", this.openPartsBinDocumentation.bind(this)],
                ["more...", function() { window.open(Config.rootPath + 'documentation/'); }]
            ]],
            ['save world as ...', this.interactiveSaveWorldAs.bind(this)],
            ['save world', this.saveWorld.bind(this)]
        ];
        return items;
    }
},
'positioning', {
    positionForNewMorph: function (newMorph, relatedMorph) {
        // this should be much smarter than the following:
        if (relatedMorph)
            return relatedMorph.bounds().topLeft().addPt(pt(5, 0));
        var pos = this.firstHand().getPosition();
        if (!newMorph) return pos;
        var viewRect = this.visibleBounds().insetBy(80),
            newMorphBounds = pos.extent(newMorph.getExtent());

        // newShowRect(viewRect)
        return viewRect.containsRect(newMorphBounds) ?
            pos : viewRect.center().subPt(newMorphBounds.extent().scaleBy(0.5));
    },
},
'windows', {
    addFramedMorph: function(morph, title, optLoc, optSuppressControls) {
        var w = this.addMorph(new lively.morphic.Window(morph, title || 'Window', optSuppressControls));
        w.setPosition(optLoc || this.positionForNewMorph(morph));
        return w;
    },

    addTextWindow: function(spec) {
        // FIXME: typecheck the spec
        if (Object.isString(spec.valueOf())) spec = {content: spec}; // convenience
        var extent = spec.extent || pt(500, 200),
            textMorph = new lively.morphic.Text(extent.extentAsRectangle(), spec.content || ""),
            pane = this.internalAddWindow(textMorph, spec.title, spec.position);
        textMorph.applyStyle({
            clipMode: 'auto',
            fixedWidth: true, fixedHeight: true,
            resizeWidth: true, resizeHeight: true,
            syntaxHighlighting: spec.syntaxHighlighting,
            padding: Rectangle.inset(4,2)});
        return pane;
    },

    internalAddWindow: function(morph, title, pos) {
        morph.applyStyle({borderWidth: 1, borderColor: CrayonColors.iron});
        pos = pos || this.firstHand().getPosition().subPt(pt(5, 5));
        var win = this.addFramedMorph(morph, String(title || ""), pos);
        return morph;
    },
},
'dialogs', {
    openDialog: function(dialog) {
        var activeWindow = $world.getActiveWindow() || $world,
            visibleBounds = this.visibleBounds(),
            blockee = activeWindow.targetMorph || $world,
            pointOfAlign = activeWindow.targetMorph ? 
                blockee.getShape().getBounds().topRight() :        
                this.visibleBounds().center(),
            window = dialog.openIn(this, pt(0,0)),
            d,
            transparentMorph,
            blockMorph;
        window.align(window.owner.localize(window.bounds().center()), visibleBounds.center());
        window.focus();
        d = dialog
        if (!activeWindow) return d;

        blockMorph = lively.morphic.Morph.makeRectangle(blockee.bounds());
        blockMorph.applyStyle({
            fill: null,
            borderWidth: 0,
        });
        transparentMorph = lively.morphic.Morph.makeRectangle(blockMorph.getShape().getBounds());
        blockMorph.addMorph(transparentMorph);
        transparentMorph.applyStyle({
            fill: Color.black,
            opacity: 0.5,
        });
        
        blockMorph.addMorph(d.panel);
        d.panel.align(d.panel.bounds().topRight(), pointOfAlign);

        activeWindow.addMorph(blockMorph);
        connect(d.panel, 'remove', blockMorph, 'remove');
        return dialog;
    },
    confirm: function (message, callback) {
        return this.openDialog(new lively.morphic.ConfirmDialog(message, callback));
    },
    prompt: function (message, callback, defaultInput) {
        return this.openDialog(new lively.morphic.PromptDialog(message, callback, defaultInput))
    },
    editPrompt: function (message, callback, defaultInput) {
        return this.openDialog(new lively.morphic.EditDialog(message, callback, defaultInput))
    }
},
'progress bar', {
    addProgressBar: function(optPt, optLabel) {
        var progressBar = new lively.morphic.ProgressBar(),
            center = optPt || this.visibleBounds().center();
        this.addMorph(progressBar);
        progressBar.align(progressBar.bounds().center(), center);
        progressBar.setLabel(optLabel || '');
        progressBar.ignoreEvents();
        return progressBar
    },
},
'preferences', {
    askForUserName: function() {
        var world = this;
        this.prompt("Please, give your username", function(name) {
            if (name) {
                alertOK("setting username to: " + name)
                world.setCurrentUser(name);
            } else {
                alertOK("removing username")
                world.setCurrentUser(undefined);
            }
        })
    },
    askForNewWorldExtent: function() {
        var world = this;
        this.prompt("Please, give new world extent", function(str) {
            if (!str) return;
            var newExtent;
            try {
                newExtent = eval(str);
            } catch(e) {
                alert("could not eval: " + str)
            };
            if (! (newExtent instanceof lively.Point)) {
                alert("" + newExtent + " " + "is not a proper extent")
                return
            }
            alert("set world extent to " +  newExtent);
            world.setExtent(newExtent)
        }, this.getExtent())
    },
    setCurrentUser: function(username) {
        this.currentUser = username;
        if (lively.LocalStorage)
            lively.LocalStorage.set('UserName', username);
    },
},
'morph selection', {
    withSelectedMorphsDo: function(func, context) {
        // FIXME currently it is the halo target...
        if (!this.currentHaloTarget) return;
        func.call(context || Global, this.currentHaloTarget);
    },
},
'debugging', {
    resetAllScales: function() {
        this.withAllSubmorphsDo(function(ea) {
            ea.setScale(1);
        })
    },
	resetScale: function () {
		this.setScale(1);
		this.firstHand().setScale(1)
	},
	resetAllTitleBars: function() {
        this.submorphs.select(function(ea) {
            return ea instanceof lively.morphic.Window
        }).invoke('resetTitleBar')
    },
    resetAllButtonLabels: function() {
        this.withAllSubmorphsDo(function(ea) {
            if (ea instanceof lively.morphic.Button) {
                // doppelt haellt besser ;) (old german proverb)
                ea.setLabel(ea.getLabel());
                ea.setLabel(ea.getLabel());
            }
        })
    },
},
'wiki', {
    interactiveDeleteWorldOnServer: function() {
        var url = URL.source;
        this.world().confirm('Do you really want to delete ' + url.filename() + '?',
            function(answer) {
                if (!answer) return;
                new WebResource(URL.source)
                    .statusMessage('Removed ' + url, 'Error removing ' + url, true)
                    .del();
            })
    },
    getActiveWindow: function() {
        return this.world().submorphs.detect(function (ea) {
            return ea.isWindow && ea.highlighted
        });
    }
});

lively.morphic.List.addMethods(
'documentation', {
    connections: {
        selection: {},
        itemList: {},
        selectedLineNo: {}
    },
},
'settings', {
    style: {borderColor: Color.black, borderWidth: 0, fill: Color.gray.lighter().lighter(), clipMode: 'auto', fontFamily: 'Helvetica', fontSize: 10},
    selectionColor: Color.green.lighter(),
    isList: true,
},
'initializing', {
    initialize: function($super, bounds, optItems) {
        $super(bounds);
        this.itemList = [];
        this.selection = null;
        this.selectedLineNo = -1;
        if (optItems) this.updateList(optItems);
    },
},
'accessing', {
    setExtent: function($super, extent) {
        $super(extent);
        this.resizeList();
    },
    getListExtent: function() { return this.renderContextDispatch('getListExtent') },


},
'list interface', {
    getMenu: function() { /*FIXME actually menu items*/ return [] },
    updateList: function(items) {
        if (!items) items = [];
        this.itemList = items;
        var that = this;
        var itemStrings = items.collect(function(ea) { return that.renderFunction(ea); });
        this.renderContextDispatch('updateListContent', itemStrings);
    },
    addItem: function(item) {
        this.updateList(this.itemList.concat([item]));
    },

    selectAt: function(idx) {
        if (!this.isMultipleSelectionList)
            this.clearSelections();
        this.renderContextDispatch('selectAllAt', [idx]);
        this.updateSelectionAndLineNoProperties(idx);
    },
    deselectAt: function(idx) { this.renderContextDispatch('deselectAt', idx) },

    updateSelectionAndLineNoProperties: function(selectionIdx) {
        var item = this.itemList[selectionIdx];
        this.selectedLineNo = selectionIdx;
        this.selection = item && (item.value !== undefined) ? item.value : item;
    },

    setList: function(items) { return this.updateList(items) },
    getList: function() { return this.itemList },
    getValues: function() {
        return this.getList().collect(function(ea) { return ea.isListItem ? ea. value : ea})
    },

    setSelection: function(sel) {
        this.selectAt(this.find(sel));
    },
    getSelection: function() { return this.selection },
    getItem: function(value) {
        return this.itemList[this.find(value)];
    },
    removeItemOrValue: function(itemOrValue) {
        var idx = this.find(itemOrValue), item = this.itemList[idx];
        this.updateList(this.itemList.without(item));
        return item;
    },

    getSelectedItem: function() {
        return this.selection && this.selection.isListItem ? this.itemList[this.selectedLineNo] : this.selection;
    },
    moveUpInList: function(itemOrValue) {
        if (!itemOrValue) return;
        var idx = this.find(itemOrValue);
        if (idx === undefined) return;
        this.changeListPosition(idx, idx-1);
    },
    moveDownInList: function(itemOrValue) {
        if (!itemOrValue) return;
        var idx = this.find(itemOrValue);
        if (idx === undefined) return;
        this.changeListPosition(idx, idx+1);
    },
    clearSelections: function() { this.renderContextDispatch('clearSelections') },

},
'private list functions', {
    changeListPosition: function(oldIdx, newIdx) {
        var item = this.itemList[oldIdx];
        this.itemList.removeAt(oldIdx);
        this.itemList.pushAt(item, newIdx);
        this.updateList(this.itemList);
        this.selectAt(newIdx);
    },
    resizeList: function(idx) {
        this.renderContextDispatch('resizeList');
    },
    find: function(itemOrValue) {
        // returns the index in this.itemList
        for (var i = 0; i < this.itemList.length; i++) {
            var val = this.itemList[i];
            if (val === itemOrValue || (val && val.isListItem && val.value === itemOrValue))
                return i
        }
    },

},
'styling', {
    applyStyle: function($super, spec) {
        $super(spec);
        if (spec.fontFamily !== undefined) this.setFontFamily(spec.fontFamily);
        if (spec.fontSize !== undefined) this.setFontSize(spec.fontSize);
    },
    setFontSize: function(fontSize) { return  this.morphicSetter('FontSize', fontSize) },
    getFontSize: function() { return  this.morphicGetter('FontSize') || 10 },
    setFontFamily: function(fontFamily) { return  this.morphicSetter('FontFamily', fontFamily) },
    getFontFamily: function() { return this.morphicSetter('FontFamily') || 'Helvetica' },
},
'multiple selection support', {
    enableMultipleSelections: function() {
        this.isMultipleSelectionList = true;
        this.renderContextDispatch('enableMultipleSelections');
    },
    getSelectedItems: function() {
        var items = this.itemList;
        return this.getSelectedIndexes().collect(function(i) { return items[i] });
    },
    getSelectedIndexes: function() { return this.renderContextDispatch('getSelectedIndexes') },

    getSelections: function() {
        return this.getSelectedItems().collect(function(ea) {return ea.isListItem ? ea.value : ea})
    },
    setSelections: function(arr) {
        var indexes = arr.collect(function(ea) { return this.find(ea) }, this);
        this.selectAllAt(indexes);
    },
    setSelectionMatching: function(string) {
        for (var i = 0; i < this.itemList.length; i++) {
            var itemString = this.itemList[i].string || String(this.itemList[i]);
            if (string == itemString)
                this.selectAt(i);
        }
    },
    selectAllAt: function(indexes) {
        this.renderContextDispatch('selectAllAt', indexes)
    },
    renderFunction: function(anObject) {
        return anObject.string || String(anObject);
    },

});
lively.morphic.DropDownList.addMethods(
'initializing', {
    initialize: function($super, bounds, optItems) {
        $super(bounds, optItems);
    },
});

lively.morphic.Button.subclass("lively.morphic.WindowControl",
'documentation', {
    documentation: "Event handling for Window morphs",
},
'settings and state', {
    style: {borderWidth: 0, strokeOpacity: 0, padding: Rectangle.inset(0,2), accessibleInInactiveWindow: true},
    connections: ['HelpText', 'fire'],
},
'initializing', {
    initialize: function($super, bnds, inset, labelString, labelOffset) {
        $super(bnds, labelString)
        this.label.applyStyle({fontSize: 8})
    },
});

lively.morphic.Box.subclass("lively.morphic.TitleBar", Trait('TitleBarMorph'),
'documentation', {
    documentation: "Title bar for lively.morphic.Window",
},
'properties', {
    controlSpacing: 3,
    barHeight: 22,
    shortBarHeight: 15,
    accessibleInInactiveWindow: true,
    style: {
        fill: new lively.morphic.LinearGradient(
            [{offset: 0, color: Color.white},
            {offset: 1, color: Color.gray.mixedWith(Color.black, 0.8)}]),
        strokeOpacity: 1,
        borderRadius: "8px 8px 0px 0px",
        borderWidth: 1,
        borderColor: Color.darkGray,
        adjustForNewBounds: true,
        resizeWidth: true,
    },
    labelStyle: {borderRadius: 0, padding: Rectangle.inset(0,0), fill: null, fontSize: 10, align: 'center', clipMode: 'hidden', fixedWidth: true, fixedHeight: true, resizeWidth: true},
},
'intitializing', {
    initialize: function($super, headline, windowWidth, windowMorph, optSuppressControls) {
        if (optSuppressControls)  {  // for dialog boxes
            this.suppressControls = true;
            this.barHeight = this.shortBarHeight;
        }
        var bounds = new Rectangle(0, 0, windowWidth, this.barHeight);

        $super(bounds);

        // this.ignoreEvents();
        this.windowMorph = windowMorph;

        // Note: Layout of submorphs happens in adjustForNewBounds (q.v.)
        var label;
        if (headline instanceof lively.morphic.Text) {
            label = headline;
        } else if (headline != null) { // String
            label = lively.morphic.Text.makeLabel(headline, this.labelStyle);
        }
        this.label = this.addMorph(label);

        if (!this.suppressControls) {
            var cell = new Rectangle(0, 0, this.barHeight-5, this.barHeight-5);

            this.closeButton = this.addMorph(
                new lively.morphic.WindowControl(cell, this.controlSpacing, "X", pt(-4,-6)));
            this.closeButton.applyStyle({moveHorizontal: true});
            //this.closeButton.linkToStyles('titleBar_closeButton');
            this.menuButton = this.addMorph(
                new lively.morphic.WindowControl(cell, this.controlSpacing, "M", pt(-5,-6)));
            //this.menuButton.linkToStyles('titleBar_menuButton');
            this.collapseButton = this.addMorph(
                new lively.morphic.WindowControl(cell, this.controlSpacing, "–", pt(-3,-6)));
            this.collapseButton.applyStyle({moveHorizontal: true});
            //this.collapseButton.linkToStyles('titleBar_collapseButton');

            this.connectButtons(windowMorph);
        }
        // This will align the buttons and label properly
        this.adjustForNewBounds();
        this.adjustForNewBounds();
    },

},
'label', {
    setTitle: function(string) {
        this.label.setTextString(string);
        this.adjustForNewBounds()
    },
},
'layouting', {
    adjustForNewBounds: function($super) {
        $super();
        var innerBounds = this.innerBounds();
        var sp = this.controlSpacing;
        var loc = this.innerBounds().topLeft().addXY(sp, sp);
        var l0 = loc;
        var dx = pt(this.barHeight - sp, 0);
        if (this.menuButton) {
            this.menuButton.setPosition(loc);
            loc = loc.addPt(dx);
        }
        if (this.label) {
            var start = this.menuButton ? this.menuButton.bounds().topRight() : pt(0,0),
                end = this.collapseButton ? this.collapseButton.bounds().bottomLeft() : innerBounds.bottomRight();
            this.label.setBounds(rect(start, end))
        }
        if (this.closeButton) {
            loc = this.innerBounds().topRight().addXY(
                -sp-this.closeButton.shape.getBounds().width, sp);
            this.closeButton.setPosition(loc);
            loc = loc.subPt(dx);
        }
        if (this.collapseButton) {
            this.collapseButton.setPosition(loc);
            //loc = loc.subPt(dx);
        };

/*        var style = this.styleNamed("titleBar");
        var w = style.borderWidth || 1;
        var r = style.borderRadius || 3;
        this.contentMorph.setBounds(new Rectangle(w/2, w/2, innerBounds.width, this.barHeight + r));*/
    },
    lookCollapsedOrNot: function(collapsed) {
        this.applyStyle({borderRadius: collapsed ? "8px 8px 8px 8px" : "8px 8px 0px 0px"});
    },



},
'event handling', {
    onMouseDown: function (evt) {
        //Functions.False,
        // TODO: refactor to evt.hand.clickedOnMorph when everything else is ready for it
        evt.world.clickedOnMorph = this.windowMorph;
    },
    onMouseUp: Functions.False,
});

lively.morphic.Morph.subclass('lively.morphic.Window', Trait('WindowMorph'),
'documentation', {
    documentation: "Full-fledged windows with title bar, menus, etc",
},
'settings and state', {
    state: 'expanded',
    style: {borderWidth: 0, fill: null, borderRadius: 0, strokeOpacity: 0, adjustForNewBounds: true, enableDragging: true},
    isWindow: true,
    isCollapsed: function() { return this.state === 'collapsed' },

},
'initializing', {
    initialize: function($super, targetMorph, titleString, optSuppressControls) {
        $super(new lively.morphic.Shapes.Rectangle());
        this.LK2 = true; // to enable workaround in WindowMorph trait.expand

        var bounds = targetMorph.bounds();
        var titleBar = this.makeTitleBar(titleString, bounds.width, optSuppressControls)
            titleHeight = titleBar.bounds().height - titleBar.getBorderWidth();
        this.setBounds(bounds.withHeight(bounds.height + titleHeight));
        this.targetMorph = this.addMorph(targetMorph);
        this.titleBar = this.addMorph(titleBar);
        //this.contentOffset = pt(0, titleHeight - titleBar.getBorderWidth()/2); // FIXME: hack
        this.contentOffset = pt(0, titleHeight);
        targetMorph.setPosition(this.contentOffset);
        // this.closeAllToDnD();

        this.collapsedTransform = null;
        this.collapsedExtent = null;
        this.expandedTransform = null;
        this.expandedExtent = null;
        this.ignoreEventsOnExpand = false;

        return this;
    },

},
'window behavior', {
    makeTitleBar: function(titleString, width, optSuppressControls) {
        // Overridden in TabbedPanelMorph
        return new lively.morphic.TitleBar(titleString, width, this, optSuppressControls);
    },
    getBounds: function($super) {
        if (this.titleBar && this.isCollapsed()) {
            var titleBarTranslation = this.titleBar.getGlobalTransform().getTranslation();
            return this.titleBar.bounds().translatedBy(titleBarTranslation);
        }
        return $super();
    },
    initiateShutdown: function() {
        if (this.isShutdown()) return;
        if (this.onShutdown) this.onShutdown();
        this.remove();
        this.state = 'shutdown'; // no one will ever know...
        return true;
    },
    resetTitleBar: function() {
        oldTitleBar = this.titleBar
        this.titleBar.remove()
        this.titleBar = this.makeTitleBar(oldTitleBar.label.textString, this.getExtent().x)
        this.addMorph(this.titleBar);
    },

},
'menu', {
    showTargetMorphMenu: function() {
        var target;
        if (this.targetMorph) {
            target = this.targetMorph;
        } else {
            target = this;
        }
        target.openMorphMenuAt(this.getGlobalTransform().transformPoint(pt(0,0)));
    },
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'set title', function(evt) {
            $world.prompt('Enter new title', function(input) {
                if (input || input == '') self.setTitle(input)
            }, self.getTitle())
        }])
        return items;
    },
},
'mouse event handling', {
    highlight: function(trueForLight) {
        this.highlighted = trueForLight;
        var fill = this.titleBar.getStyle().fill || this.titleBar.getFill(),
            newFill = trueForLight ? fill.lighter(2) : fill;
        this.titleBar.setFill(newFill);
    },
    isInFront: function() { return this.owner && this.owner.topMorph() === this },

    comeForward: function() {
        // adds the window before each other morph in owner
        // this resets the scroll in HTML, fix for now -- gather before and set it afterwards
        if (this.isInFront()) return; // already at front
        var textsAndLists = [], scrolls = [];
        this.withAllSubmorphsDo(function(ea) {
            if (!ea.isList && !ea.isText) return;
            textsAndLists.push(ea);
            scrolls.push(ea.getScroll());
        });
        this.owner.addMorphFront(this); // come forward
        (function() {
        textsAndLists.forEach(function(ea, i) { ea.setScroll(scrolls[i][0], scrolls[i][1]) });
        this.targetMorph && this.targetMorph.onWindowGetsFocus && this.targetMorph.onWindowGetsFocus();
        }).delay(0)
    },

    onMouseDown: function(evt) {
        var wasInFront = this.isInFront();
        this.highlight(true);
        this.comeForward();
        if (!wasInFront) {
            this.world().submorphs.forEach(function(ea) {
                ea !== this && ea.isWindow && ea.highlight(false);
            }, this)
            if (this.morphsContainingPoint(evt.getPosition()).detect(function(ea) {
                return ea.accessibleInInactiveWindow || true }))
                    return false; // was: $super(evt);

            this.cameForward = true; // for stopping the up as well
            evt.world.clickedOnMorph = null; // dont initiate drag
            evt.stop(); // so that text, lists that are automatically doing things are not modified
            return true;
        } else {
            this.highlight(true);
            this.comeForward();
            return false; // was: $super(evt);
        }
    },
    onMouseUp: function(evt) {
        if (this.cameForward) {
            this.cameForward = false
            evt.stop();
            return true;
        }
        return false;
    },
    onDragStart: function(evt) {
        this.prevDragPos = evt.getPosition();
        return true;
    },
    onDrag: function(evt) {
        var movedBy = evt.getPosition().subPt(this.prevDragPos);
        this.prevDragPos = evt.getPosition();
        this.moveBy(movedBy);
        return true;
    },
},
'debugging', {
    toString: function($super) {
        return $super() + ' ' + (this.titleBar ? this.titleBar.getTitle() : '');
    },
},
'removing', {
    remove: function($super) {
        // should trigger remove of submorphs but remove is also usedelsewhere (grab)
        // this.targetMorph && this.targetMorph.remove();
        return $super();
    },
},
'collapsing', {
    collapse: function() {
        if (this.isCollapsed()) return;
        this.expandedTransform = this.getTransform();
        this.expandedExtent = this.getExtent();
        this.expandedPosition = this.getPosition();
        this.targetMorph.onWindowCollapse && this.targetMorph.onWindowCollapse();
        this.targetMorph.remove();
        this.helperMorphs = this.submorphs.withoutAll([this.targetMorph, this.titleBar]);
        this.helperMorphs.invoke('remove');
        if(this.titleBar.lookCollapsedOrNot) this.titleBar.lookCollapsedOrNot(true);
        var finCollapse = function () {
            this.state = 'collapsed';  // Set it now so setExtent works right
            if (this.collapsedTransform) this.setTransform(this.collapsedTransform);
            if (this.collapsedExtent) this.setExtent(this.collapsedExtent);
            if (this.collapsedPosition) this.setPosition(this.collapsedPosition);
            this.shape.setBounds(this.titleBar.bounds());
        }.bind(this);
        if (this.collapsedPosition && this.collapsedPosition.dist(this.getPosition()) > 100)
            this.animatedInterpolateTo(this.collapsedPosition, 5, 50, finCollapse);
        else finCollapse();
    },
    expand: function() {
        if (!this.isCollapsed()) return;
        this.collapsedTransform = this.getTransform();
        this.collapsedExtent = this.innerBounds().extent();
        this.collapsedPosition = this.getPosition();
        var finExpand = function () {
            this.state = 'expanded';
            if (this.expandedTransform)
                this.setTransform(this.expandedTransform);
            if (this.expandedExtent) {
                this.setExtent(this.expandedExtent);
            }
            if (this.expandedPosition) {
                this.setPosition(this.expandedPosition);
            }

            this.addMorph(this.targetMorph);

            this.helperMorphs.forEach(function(ea) {
                this.addMorph(ea)
            }, this);

            // Bring this window forward if it wasn't already
            this.owner && this.owner.addMorphFront(this);
            this.targetMorph.onWindowExpand && this.targetMorph.onWindowExpand();
        }.bind(this);
        if (this.expandedPosition && this.expandedPosition.dist(this.getPosition()) > 100)
            this.animatedInterpolateTo(this.expandedPosition, 5, 50, finExpand);
        else finExpand();
        if(this.titleBar.lookCollapsedOrNot) this.titleBar.lookCollapsedOrNot(false);
    },

});


Object.subclass('lively.morphic.App',
'properties', {
    initialViewExtent: pt(350, 200),
},
'initializing', {
    buildView: function(extent) {
        throw new Error('buildView not implemented!')
    },
},
'accessing', {
    getInitialViewExtent: function(world, hint) {
        return hint || this.initialViewExtent;
    },
},
'opening', {
    openIn: function(world, pos) {
        var view = this.buildView(this.getInitialViewExtent(world));
        view.ownerApp = this; // for debugging
        this.view = view;
        if (pos) view.setPosition(pos);
        if (world.currentScene) world = world.currentScene;
        return world.addMorph(view);
    },
    open: function() {
        return this.openIn(lively.morphic.World.current());
    },

},
'removing', {
    removeTopLevel: function() {
        if (this.view) this.view.remove();
    },
});

lively.morphic.App.subclass('lively.morphic.AbstractDialog',
'documentation', {
    connections: ['result'],
},
'properties', {
    initialViewExtent: pt(300, 90),
    inset: 4,
},
'initializing', {
    initialize: function(message, callback) {
        this.result = null;
        this.message = message || '?';
        if (callback) this.setCallback(callback);
    },
    buildPanel: function(bounds) {
        this.panel = new lively.morphic.Box(bounds);
        this.panel.applyStyle({
            fill: Color.rgb(210,210,210),
            borderColor: Color.gray.darker(),
            borderWidth: 1,
            adjustForNewBounds: true, // layouting
            lock: true,
        });
        this.panel.disableDragging();
        this.panel.disableGrabbing();
    },
    buildLabel: function() {
        var bounds = new Rectangle(this.inset, this.inset, this.panel.getExtent().x - 2*this.inset, 18);
        this.label = this.panel.addMorph(new lively.morphic.Text(bounds, this.message));
        this.label.beLabel({fill: Color.white, fixedHeight: true, fixedWidth: false, padding: Rectangle.inset(0,0)});
// FIXME ugly hack for wide dialogs
(function fit() {
    this.label.fit();
    var labelWidth = this.label.getExtent().x, panelExtent = this.panel.getExtent();
    if (labelWidth > panelExtent.x)
        this.panel.setExtent(panelExtent.withX(labelWidth))
}).bind(this).delay(0);
        this.label.disableDragging();
        this.label.disableGrabbing();
    },
    buildCancelButton: function() {
        var bounds = new Rectangle(0,0, 60, 30),
            btn = new lively.morphic.Button(bounds, 'Cancel');
        btn.align(btn.bounds().bottomRight().addXY(this.inset, this.inset), this.panel.innerBounds().bottomRight())
        btn.applyStyle({moveHorizontal: true, moveVertical: true, padding: rect(pt(0,6),pt(0,6))})
        this.cancelButton = this.panel.addMorph(btn);
        lively.bindings.connect(btn, 'fire', this, 'removeTopLevel')
    },
    buildOKButton: function() {
        var bounds = new Rectangle(0,0, 60, 30),
            btn = new lively.morphic.Button(bounds, 'OK');
        btn.align(btn.bounds().bottomRight().addXY(this.inset, 0), this.cancelButton.bounds().bottomLeft())
        btn.applyStyle({moveHorizontal: true, moveVertical: true, padding: rect(pt(0,6),pt(0,6))})
        this.okButton = this.panel.addMorph(btn);
        lively.bindings.connect(btn, 'fire', this, 'removeTopLevel')
    },
    buildView: function(extent) {
        this.buildPanel(extent.extentAsRectangle());
        this.buildLabel();
        this.buildCancelButton();
        this.buildOKButton();
        return this.panel;
    },
},
'callbacks', {
    setCallback: function(func) {
        this.callback = func;
        connect(this, 'result', this, 'triggerCallback')
    },
    triggerCallback: function(resultBool) {
        this.removeTopLevel();
        if (this.callback) this.callback(resultBool);
    },
});

lively.morphic.AbstractDialog.subclass('lively.morphic.ConfirmDialog',
'properties', {
    initialViewExtent: pt(260, 70),
},
'initializing', {
    buildView: function($super, extent) {
        var panel = $super(extent);

        lively.bindings.connect(this.cancelButton, 'fire', this, 'result', {
            converter: function() { return false }});
        lively.bindings.connect(this.okButton, 'fire', this, 'result', {
            converter: function() { return true }});
        lively.bindings.connect(panel, 'onEscPressed', this, 'result', {
            converter: function() { return false }});
        lively.bindings.connect(panel, 'onEnterPressed', this, 'result', {
            converter: function() { return true }});

        return panel;
    },
});

lively.morphic.AbstractDialog.subclass('lively.morphic.PromptDialog',
// new lively.morphic.PromptDialog('Test', function(input) { alert(input) }).open()
'initializing', {
    initialize: function($super, label, callback, defaultInput) {
        $super(label, callback, defaultInput);
        this.defaultInput = defaultInput;
    },
    buildTextInput: function(bounds) {
        var input = new lively.morphic.Text(this.label.bounds().insetByPt(pt(this.label.getPosition().x * 2, 0)), this.defaultInput || '');
        input.align(input.getPosition(), this.label.bounds().bottomLeft().addPt(pt(0,5)));
        input.beInputLine({fixedWidth: true});
		input.disableDragging();
		input.disableGrabbing();
        connect(input, 'savedTextString', this, 'result');
        connect(input, 'onEscPressed', this, 'result', {converter: function() { return null } });
        connect(this.panel, 'onEscPressed', this, 'result', {converter: function() { return null}});
        // addScript is a bit of a hack because the function in addScript
        // doesn't close over "input", apparently...
        this.panel.addScript(function onEnterPressed(evt) {
            evt.stop();
        });
        connect(this.panel, 'onEnterPressed', input, 'doSave', {converter: function(arg) { return arg } });
        this.inputText = this.panel.addMorph(input);
    },

    buildView: function($super, extent) {
        var panel = $super(extent);
        this.buildTextInput();

        lively.bindings.connect(this.cancelButton, 'fire', this, 'result', {
            converter: function() { return null }});
        lively.bindings.connect(this.okButton, 'fire', this.inputText, 'doSave')

        return panel;
    },

},
'opening', {
    openIn: function($super, owner, pos) {
        var view = $super(owner, pos);
        // delayed because selectAll will scroll the world on text focus
        // sometimes the final pos of the dialog is different to the pos here
        // so dialog will open at wrong place, focus, world scrolls to the top,
        // dialog is moved and out of frame
        this.inputText.selectAll.bind(this.inputText).delay(0);
        return view;
    },
});
lively.morphic.AbstractDialog.subclass('lively.morphic.EditDialog',
// new lively.morphic.PromptDialog('Test', function(input) { alert(input) }).open()
'initializing', {
    initialize: function($super, label, callback, defaultInput) {
        $super(label, callback, defaultInput);
        this.defaultInput = defaultInput;
    },
    buildTextInput: function() {
        var input = new lively.morphic.Text(this.label.bounds(), this.defaultInput || '')
            .applyStyle({resizeWidth: true, resizeHeight: true, clipMode: 'auto'});
        input.align(input.getPosition(), this.label.bounds().bottomLeft());
        connect(input, 'savedTextString', this, 'result');
        this.inputText = this.panel.addMorph(input);
    },

    buildView: function($super, extent) {
        var panel = $super(extent);
        this.buildTextInput();

        lively.bindings.connect(this.cancelButton, 'fire', this, 'result', {
            converter: function() { return null }});
        lively.bindings.connect(this.okButton, 'fire', this.inputText, 'doSave')

        panel.setExtent(pt(400,200))

        return panel;
    },

},
'opening', {
    openIn: function($super, owner, pos) {
        var view = $super(owner, pos);
        // delayed because selectAll will scroll the world on text focus
        // sometimes the final pos of the dialog is different to the pos here
        // so dialog will open at wrong place, focus, world scrolls to the top,
        // dialog is moved and out of frame
        this.inputText.selectAll.bind(this.inputText).delay(0);
        return view;
    },
});


lively.morphic.App.subclass('lively.morphic.WindowedApp',
'opening', {
    openIn: function(world, pos) {
        var view = this.buildView(this.getInitialViewExtent(world)),
            window = world.addFramedMorph(view, this.defaultTitle);
        if (world.currentScene) world.currentScene.addMorph(window); // FIXME
        view.ownerApp = this; // for debugging
        this.view = window;
        return window;
    },
});


// COPIED from Widgets.js SelectionMorph
lively.morphic.Box.subclass('lively.morphic.Selection',
'documentation', {
    documentation: 'selection "tray" object that allows multiple objects to be moved and otherwise manipulated simultaneously',
},
'settings', {
    style: {fill: null, borderWidth: 1, borderColor: Color.darkGray},
    isEpiMorph: true,
    doNotRemove: true,
    propagate: true,
    isSelection: true,

},
'initializing', {
    initialize: function($super, initialBounds) {
        $super(initialBounds);
        this.applyStyle(this.style);
        this.selectedMorphs = [];

    },
},
'propagation', {
    withoutPropagationDo: function(func) {
        // emulate COP
        this.propagate = false;
        func()
        this.propagate = true;
    },
    isPropagating: function() {
        return this.propagate
    },
},
'menu', {
    morphMenuItems: function($super) {
        var items = $super();
        if (this.selectedMorphs.length === 1) {
            var self = this;
            items.push(["open ObjectEditor for selection", function(){
                $world.openObjectEditorFor(self.selectedMorphs[0])
            }])
        }
        items.push(["align vertically", this.alignVertically.bind(this)]);
        items.push(["space vertically", this.spaceVertically.bind(this)]);
        items.push(["align horizontally", this.alignHorizontally.bind(this)]);
        items.push(["space horizontally", this.spaceHorizontally.bind(this)]);

        if (this.selectedMorphs.length == 1) {
            items.push(["ungroup", this.unGroup.bind(this)]);
        } else {
            items.push(["group", this.makeGroup.bind(this)]);
        }

        // items.push(["align to grid...", this.alignToGrid.bind(this)]);

        return items;
    },
},
'copying', {
    copy: function($super) {
        this.isEpiMorph = false;
        try { return this.addSelectionWhile($super) } finally { this.isEpiMorph = true }
    },
},
'selection handling', {
    addSelectionWhile: function(func) {
        // certain operations require selected morphs to be added to selection frame
        // e.g. for transformations or copying
        // use this method to add them for certain operations
        var world = this.world();
        if (!world || !this.isPropagating()) return func();

        for (var i = 0; i < this.selectedMorphs.length; i++)
            this.addMorph(this.selectedMorphs[i]);
        try { return func() } finally {
            for (var i = 0; i < this.selectedMorphs.length; i++)
                this.world().addMorph(this.selectedMorphs[i]);
        }
    },
},
'removing', {
    remove: function() {
        if (this.isPropagating())
            this.selectedMorphs.invoke('remove');
        this.removeOnlyIt();
    },
    removeOnlyIt: function() {
        if ( this.myWorld == null ) {
            this.myWorld = this.world();
        }
        // this.myWorld.currentSelection = null;
        Class.getSuperPrototype(this).remove.call(this);
    },
},
'accessing', {
    world: function($super) {
        return $super() || this.owner || this.myWorld
    },
    setBorderWidth: function($super, width) {
        if (!this.selectedMorphs  || !this.isPropagating())  $super(width);
        else this.selectedMorphs.invoke('withAllSubmorphsDo',
            function(ea) { ea.setBorderWidth(width)});
    },

    setFill: function($super, color) {
        if (!this.selectedMorphs || !this.isPropagating())
            $super(color);
        else this.selectedMorphs.invoke('withAllSubmorphsDo',
            function(ea) { ea.setFill(color)});
    },

    setBorderColor: function($super, color) {
        if (!this.selectedMorphs || !this.isPropagating())  $super(color);
        else this.selectedMorphs.invoke('withAllSubmorphsDo',
            function(ea) { ea.setBorderColor(color)});
    },

    shapeRoundEdgesBy: function($super, r) {
        if (!this.selectedMorphs  || !this.isPropagating()) $super(r);
        else this.selectedMorphs.forEach(
            function(m) { if (m.shape.roundEdgesBy) m.shapeRoundEdgesBy(r); });
    },

    setFillOpacity: function($super, op) {
        if (!this.selectedMorphs  || !this.isPropagating())  $super(op);
        else this.selectedMorphs.invoke('withAllSubmorphsDo',
            function(ea) { ea.setFillOpacity(op)});
    },

    setStrokeOpacity: function($super, op) {
        if (!this.selectedMorphs  || !this.isPropagating()) $super(op);
        else this.selectedMorphs.invoke('callOnAllSubmorphs',
            function(ea) { ea.setStrokeOpacity(op)});
    },

    setTextColor: function(c) {
        if (!this.selectedMorphs  || !this.isPropagating()) return;
        this.selectedMorphs.forEach( function(m) { if (m.setTextColor) m.setTextColor(c); });
    },

    setFontSize: function(c) {
        if (!this.selectedMorphs  || !this.isPropagating()) return;
        this.selectedMorphs.forEach( function(m) { if (m.setFontSize) m.setFontSize(c); });
    },

    setFontFamily: function(c) {
        if (!this.selectedMorphs  || !this.isPropagating()) return;
        this.selectedMorphs.forEach( function(m) { if (m.setFontFamily) m.setFontFamily(c); });
    },

    setRotation: function($super, theta) {
        this.addSelectionWhile($super.curry(theta));
    },

    setScale: function($super, scale) {
        this.addSelectionWhile($super.curry(scale));
    },
    adjustOrigin: function($super, origin) {
        this.withoutPropagationDo(function() {
            return $super(origin)
        });
    },



},
'aligning', {
    // Note: the next four methods should be removed after we have gridding, i think (DI)
    alignVertically: function() {
        // Align all morphs to same left x as the top one.
//console.log("this=" + Object.inspect(this)); if(true) return;
        var morphs = this.selectedMorphs.slice(0).sort(function(m,n) {return m.getPosition().y - n.getPosition().y});
        var minX = morphs[0].getPosition().x;    // align to left x of top morph
        morphs.forEach(function(m) { m.setPosition(pt(minX,m.getPosition().y)) });
    },

    alignHorizontally: function() {
        var minY = 9999;
        this.selectedMorphs.forEach(function(m) { minY = Math.min(minY, m.getPosition().y); });
        this.selectedMorphs.forEach(function(m) { m.setPosition(pt(m.getPosition().x, minY)) });
    },

    spaceVertically: function() {
        // Sort the morphs vertically
        var morphs = this.selectedMorphs.clone().sort(function(m,n) {return m.getPosition().y - n.getPosition().y});
        // Align all morphs to same left x as the top one.
        var minX = morphs[0].getPosition().x;
        var minY = morphs[0].getPosition().y;
        // Compute maxY and sumOfHeights
        var maxY = minY;
        var sumOfHeights = 0;
        morphs.forEach(function(m) {
            var ht = m.innerBounds().height;
            sumOfHeights += ht;
            maxY = Math.max(maxY, m.getPosition().y + ht);
        });
        // Now spread them out to fit old top and bottom with even spacing between
        var separation = (maxY - minY - sumOfHeights)/Math.max(this.selectedMorphs.length - 1, 1);
        var y = minY;
        morphs.forEach(function(m) {
            m.setPosition(pt(minX, y));
            y += m.innerBounds().height + separation;
        });
    },

    spaceHorizontally: function() {
        // Sort the morphs vertically
        var morphs = this.selectedMorphs.clone().sort(function(m, n) {
            return m.getPosition().x - n.getPosition().x;
        });
        // Align all morphs to same left x as the top one.
        var minX = morphs[0].getPosition().x;
        var minY = morphs[0].getPosition().y;
        // Compute maxX and sumOfWidths
        var maxX = minY;
        var sumOfWidths = 0;
        morphs.forEach(function(m) {
            var wid = m.innerBounds().width;
            sumOfWidths += wid;
            maxX = Math.max(maxX, m.getPosition().x + wid);
        }); // Now spread them out to fit old top and bottom with even spacing between
        var separation = (maxX - minX - sumOfWidths)/Math.max(this.selectedMorphs.length - 1, 1);
        var x = minX;
        morphs.forEach(function(m) {
            m.setPosition(pt(x, minY));
            x += m.innerBounds().width + separation;
        });
    },
},
'grabbing', {
    grabByHand: function(hand) {
        this.withoutPropagationDo(function() {
            hand.addMorph(this)
        }.bind(this))
        for (var i = 0; i < this.selectedMorphs.length; i++) {
            // alert("grab " + this.selectedMorphs[i])
            this.addMorph(this.selectedMorphs[i]);
        }


    },
    dropOn: function(morph) {
        // alert("drop " + this + " on " + morph)
        // morph.addMorph(this)
        for (var i = 0; i < this.selectedMorphs.length; i++) {
            morph.addMorph(this.selectedMorphs[i]);
        }
        this.removeSelecitonIndicators();
        this.removeOnlyIt();
    },

},
'geometry', {
    moveBy: function($super, delta) {
        // Jens: I would like to express this in a layer...
        if (this.isPropagating()) {
            for (var i = 0; i < this.selectedMorphs.length; i++ )
                this.selectedMorphs[i].moveBy(delta);
        }
        $super(delta);
    },
    setPosition: function($super, pos) {
        var delta = pos.subPt(this.getPosition())
        // Jens: I would like to express this in a layer...
        if (this.isPropagating() && this.selectedMorphs) {
            for (var i = 0; i < this.selectedMorphs.length; i++ ) {
                // alertOK("set pos move " + printStack())
                this.selectedMorphs[i].moveBy(delta);
            }
        }
        $super(pos);
    },

},
'world', {
    reset: function() {
        this.selectedMorphs = [];
        this.setRotation(0)
        this.setScale(1)
        this.removeOnlyIt();
        this.removeSelecitonIndicators();
        this.adjustOrigin(pt(0,0));
    },

    selectMorphs: function(selectedMorphs) {
        this.owner.selectionMorph.selectedMorphs = selectedMorphs

// finding pos, starting with max values
        var topLeft = this.bounds().bottomRight();
        var bottomRight = this.bounds().topLeft();
        var self = this;

        this.removeSelecitonIndicators();
        selectedMorphs.forEach(function(ea) {
            var innerBounds = ea.getTransform().inverse().
                transformRectToRect(ea.bounds().insetBy(-4));
            var bounds = ea.getTransform().transformRectToRect(innerBounds);
            topLeft = bounds.topLeft().minPt(topLeft);
            bottomRight = bounds.bottomRight().maxPt(bottomRight);

            var selectionIndicator =
                new lively.morphic.Morph.makeRectangle(innerBounds);
            selectionIndicator.name = 'Selection of ' + ea
            selectionIndicator.isEpiMorph = true;
            selectionIndicator.isSelectionIndicator = true;
            selectionIndicator.applyStyle({
                fill: null, borderWidth: 4,
                strokeOpacity: 0.5, borderColor: Color.green})
            ea.addMorph(selectionIndicator);
            self.selectionIndicators.push(selectionIndicator);
        })
    this.withoutPropagationDo(function() {
        this.setPosition(topLeft);
        this.setExtent(bottomRight.subPt(topLeft));
        // this.adjustOrigin(this.getExtent().scaleBy(0.5))
    }.bind(this))

    },

    removeSelecitonIndicators: function() {
        if (this.selectionIndicators)
            this.selectionIndicators.invoke('remove');
        this.selectionIndicators = [];
    },
  makeGroup: function() {
        if (!this.selectedMorphs) return;
        var group = new lively.morphic.Box(this.bounds());
        group.isGroup = true;
        this.owner.addMorph(group);
        this.selectedMorphs.forEach(function(ea) {
            group.addMorph(ea)
        })
        this.selectMorphs([group])
    },
    unGroup: function() {
        if (!this.selectedMorphs || this.selectedMorphs.length !== 1) return;
        var group =  this.selectedMorphs[0]
        var all = group.submorphs
        group.submorphs.forEach(function(ea) {
            this.owner.addMorph(ea)
        }.bind(this))
        this.selectMorphs(all)
    },


});
Trait('SelectionMorphTrait',
'selection', {
    getSelectedMorphs: function() {
        return this.selectionMorph.selectedMorphs
    },

    onDragStart: function(evt) {
        if (evt.isRightMouseButtonDown()) {
            return; // no selection with right mouse button (fbo 2011-09-13)
        }

        this.resetSelection()
        if (this.selectionMorph.owner !== this)
            this.addMorph(this.selectionMorph);

        var pos = this.localize(evt.getPosition());
        this.selectionMorph.withoutPropagationDo(function() {
            this.selectionMorph.setPosition(pos)
            this.selectionMorph.setExtent(pt(1, 1))
            this.selectionMorph.initialPosition = pos;
        }.bind(this))
    },
    onDrag: function(evt) {
        if(!this.selectionMorph) return

        var p1 = this.localize(evt.getPosition()),
            p2 = this.selectionMorph.initialPosition;

        // alert("p1" + p1 +  " p2" + p2)
        var topLeft = pt(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y))
        var bottomRight = pt(Math.max(p1.x, p2.x), Math.max(p1.y, p2.y))


        this.selectionMorph.setPosition(topLeft);
        this.selectionMorph.setExtent(bottomRight.subPt(topLeft));
    },
    onDragEnd: function(evt) {
        var self = this;
        if (!self.selectionMorph) return;
        var selectionBounds = self.selectionMorph.bounds();
        var selectedMorphs  = this.submorphs
            .reject(function(ea){
                return ea === self || ea.isEpiMorph || ea instanceof lively.morphic.HandMorph
            })
            .select(function(m) {
                return selectionBounds.containsRect(m.bounds())})
            .reverse()

        this.selectionMorph.selectedMorphs = selectedMorphs;
        if (selectedMorphs.length == 0) {
            this.selectionMorph.removeOnlyIt();
            return
        }

        this.selectionMorph.selectMorphs(selectedMorphs);

        this.selectionMorph.showHalos()

    },

    resetSelection: function() {
        if (!this.selectionMorph || !this.selectionMorph.isSelection)
            this.selectionMorph = new lively.morphic.Selection(new Rectangle(0,0,0,0))
        this.selectionMorph.reset();
    },
})
.applyTo(lively.morphic.World, {override: ['onDrag', 'onDragStart', 'onDragEnd']});

lively.morphic.WindowedApp.subclass('lively.morphic.TextEditor',
'settings', {
    defaultTitle: 'TextEditor',
    initialViewExtent: pt(900, 800),
},
'initializing', {
    buildView: function(extent) {
        var panel = lively.morphic.Morph.makeRectangle(0,0, extent.x, extent.y)
            .applyStyle({
                fill: Color.gray.lighter(2),
                resizeWidth: true,
                resizeHeight: true,
                adjustForNewBounds: true});

        var bounds;
        bounds = new Rectangle(0,0, extent.x, 30);
        var urlText = new lively.morphic.Text(bounds, URL.source.toString())
            .beInputLine({resizeWidth: true, fixedWidth: true, padding: Rectangle.inset(5,5)})
        panel.urlText = panel.addMorph(urlText);
        connect(urlText, 'savedTextString', this, 'setCurrentURL');
        connect(this, 'currentURL', this, 'loadFile');

        bounds = new Rectangle(0, bounds.height, extent.x/3, 30);
        var saveBtn = new lively.morphic.Button(bounds, 'save');
        saveBtn.applyStyle({resizeWidth: true})
        panel.addMorph(saveBtn);
        connect(saveBtn, 'fire', this, 'saveFile');

        bounds = rect(bounds.topRight(), bounds.bottomRight().addXY(extent.x/3, 0));
        var loadBtn = new lively.morphic.Button(bounds, 'load')
        loadBtn.applyStyle({resizeWidth: false, moveHorizontal: true})
        panel.addMorph(loadBtn);
        connect(loadBtn, 'fire', this, 'setCurrentURL', {converter: function() {
            // FIXME
            this.targetObj.panel.urlText.cachedTextString = null
            return this.targetObj.panel.urlText.textString }});

        bounds = rect(bounds.topRight(), bounds.bottomRight().addXY(extent.x/3, 0));
        var removeBtn = new lively.morphic.Button(bounds, 'remove')
        removeBtn.applyStyle({resizeWidth: false, moveHorizontal: true})
        panel.addMorph(removeBtn)
        connect(removeBtn, 'fire', this, 'removeFile');

        bounds = rect(pt(0, bounds.maxY()), panel.bounds().bottomRight());
        var contentMorph = new lively.morphic.Text(bounds, 'emtpy')
            .applyStyle({
                clipMode: 'scroll',
                fixedHeight: true,
                fontFamily: 'Monaco',
                fontSize: 10,
                resizeWidth: true,
                resizeHeight: true,
                padding: Rectangle.inset(5,5)});
        panel.contentMorph = panel.addMorph(contentMorph);
        connect(contentMorph, 'savedTextString', this, 'saveFile');

        this.panel = panel;
        return panel;
    },
},
'network', {
    setCurrentURL: function(urlString) {
        this.currentURL = new URL(urlString);
        alert(this.currentURL);
    },
    createWebResource: function() { return new WebResource(this.getURL()) },
    getURL: function() { return new URL(this.currentURL || this.panel.urlText.textString) },
},
'helper', {
    showAsLoading: function(bool) {
        if (!bool) {
            this.loadingScreen && this.loadingScreen.remove();
            this.loadingScreen = null;
        } else {
            if (this.loadingScreen) return;
            var morph = lively.morphic.Morph.makeRectangle(this.panel.contentMorph.bounds());
            morph.applyStyle({fill: Color.gray.withA(0.6)});
            this.loadingScreen = this.panel.addMorph(morph);
        }
    },
},
'file functions', {
    getEditorContent: function() { return this.panel.contentMorph.textString },
    saveFile: function() {
        var webR = this.createWebResource();
        webR
            .beAsync()
            .createProgressBar()
            .statusMessage('Successfully saved ' + webR.getURL(), 'Error saving ' + webR.getURL(), true)
            .put(this.getEditorContent());
    },
    loadFile: function() {
        var res = this.createWebResource().forceUncached();
        this.showAsLoading(true);
        connect(res, 'status', this, 'showAsLoading', {updater: function($upd, status) {$upd(false)}});
        connect(res, 'content', this, 'finishLoading', {updater: function($upd, content) {
            $upd(this.sourceObj) }});
        res.beAsync().get();

    },
    finishLoading: function(res) {
        if (res.isExisting) {
            this.panel.contentMorph.setTextString(res.content);
            return
        } else if (res.getURL().isLeaf()) {
            this.askToCreateFile(res);
        } else {
            alert('Cannot open/create document at ' + res.getURL());
        }
    },

    askToCreateFile: function(webResource) {
        var question = 'No file ' + webResource.getURL() + ' exists...! Create it?';
        this.panel.world().confirm(question, function(input) {
            if (!input) return;
            webResource.statusMessage(
                'Successfully created ' + webResource.getURL().filename(),
                'Cannot create ' + webResource.getURL().filename(), true)
            webResource.put('empty file');
            this.loadFile();
        }.bind(this));
    },
    removeFile: function() {
        var webR = this.createWebResource();
        if (!webR.exists()) return;
        webR.statusMessage('Successfully deleted','Error deleting', true).del();
    },
},
'interface', {
    load: function(url) {
        this.panel.urlText.textString = url;
        this.panel.urlText.doSave();
    },
});

module('lively.ide'); // so that the namespace is defined even if ide is not loaded

Object.extend(lively.ide, {
    openFile: function(url) {
        if (!String(url).startsWith('http')) url = URL.codeBase.withFilename(url);
        var textEditor = new lively.morphic.TextEditor()
        textEditor.open()
        textEditor.load(url);
    },
});



lively.morphic.Box.subclass('lively.morphic.HorizontalDivider', Trait('HorizontalDividerTrait'),
'settings', {
    style: {fill: Color.gray, enableDragging: true},
},
'initializing', {
    initialize: function($super, bounds) {
        $super(bounds);
        this.fixed = [];
        this.scalingBelow = [];
        this.scalingAbove = [];
        this.minHeight = 20;
        this.pointerConnection = null;
    },
},
'mouse events', {
    onDragStart: function(evt) {
        this.oldPoint = evt.getPosition();
        return true;
    },
    onDrag: function(evt) {
        var p1 = this.oldPoint,
            p2 = evt.getPosition(),
            deltaY = p2.y - p1.y;
        this.oldPoint = p2;
        this.movedVerticallyBy(deltaY);
        return true;
    },
});

lively.morphic.Box.subclass('lively.morphic.Slider', Trait('SliderMorphTrait'),
'settings', {
    style: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        borderRadius: 6,
        fill: Styles.sliderBackgroundGradient(Color.gray, "NorthSouth")
    },
    connections: {
        value: {}}
},
'initializing', {
    initialize: function($super, initialBounds, scaleIfAny) {
        $super(initialBounds);
        connect(this, 'value', this, 'adjustSliderParts')
        this.setValue(0);
        this.setSliderExtent(0.1);
        this.valueScale = (scaleIfAny === undefined) ? 1.0 : scaleIfAny;
        this.sliderKnob = this.addMorph(new lively.morphic.SliderKnob(new Rectangle(0, 0, this.mss, this.mss), this));
        this.setupFill();
        this.adjustSliderParts()
    },
},
'accessing', {
    getValue: function() { return this.value },

    setValue: function(value) { return this.value = value },

    getSliderExtent: function() { return this.sliderExtent },

    setSliderExtent: function(value) {
        this.sliderExtent = value
        this.adjustSliderParts();
        return value;
    },
    setExtent: function($super, value) {
        $super(value);
        this.adjustSliderParts();
        return value;
    },

},
'mouse events', {
    onMouseDown: function(evt) {

        // FIXME: a lot of this is handled in Morph>>onMouseDown. remove.
        if (!evt.isLeftMouseButtonDown() || evt.isCommandKey()) return false;

        var handPos = this.localize(evt.getPosition());

        if (this.sliderKnob.bounds().containsPoint(handPos)) return false; // knob handles move

        var inc = this.getSliderExtent(),
            newValue = this.getValue(),
            delta = handPos.subPt(this.sliderKnob.bounds().center());
        if (this.vertical() ? delta.y > 0 : delta.x > 0) newValue += inc;
        else newValue -= inc;

        if (isNaN(newValue)) newValue = 0;
        this.setScaledValue(this.clipValue(newValue));

        return true;
    },
})

// FIXME move somewhere else
lively.morphic.Box.subclass('lively.morphic.SliderKnob',
'settings', {
    style: {borderColor: Color.black, borderWidth: 1, fill: Color.gray, enableDragging: true},
    dragTriggerDistance: 0,
},
'initializing', {
    initialize: function($super, initialBounds, slider) {
        $super(initialBounds);
        this.slider = slider;
    },
},
'mouse events', {
    onDragStart: function($super, evt) {
        this.hitPoint = evt.getPosition();
        return true;
    },
    onDrag: function($super, evt) {
        // the hitpoint is the offset that make the slider move smooth
        if (!this.hitPoint) return; // we were not clicked on...

        // Compute the value from a new mouse point, and emit it
        var delta = evt.getPosition().subPt(this.hitPoint),
            p = this.bounds().topLeft().addPt(delta),
            bnds = this.slider.innerBounds(),
            ext = this.slider.getSliderExtent();

        this.hitPoint = evt.getPosition()
        if (this.slider.vertical()) {
            // thickness of elevator in pixels
            var elevPix = Math.max(ext*bnds.height,this.slider.mss),
                newValue = p.y / (bnds.height-elevPix);
        } else {
            // thickness of elevator in pixels
            var elevPix = Math.max(ext*bnds.width,this.slider.mss),
                newValue =  p.x / (bnds.width-elevPix);
        }

        if (isNaN(newValue)) newValue = 0;
        this.slider.setScaledValue(this.slider.clipValue(newValue));
    },
    onDragEnd: function($super, evt) { return $super(evt) },
    onMouseDown: function(evt) {
        return true;
    },


});
Object.extend(Array.prototype, {
    asListItemArray: function() {
        return this.collect(function(ea) {
            return {isListItem: true, string: ea.toString(), value: ea};
        });
    },
})

}) // end of module
