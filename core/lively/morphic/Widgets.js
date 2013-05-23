module('lively.morphic.Widgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.morphic.TextCore', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.Button',
'settings', {
    isButton: true,

    normalColor: Color.rgbHex('#DDDDDD'),
    toggleColor: Color.rgb(171,215,248),
    disabledColor: Color.rgbHex('#DDDDDD'),
    normalTextColor: Color.black,
    disabledTextColor: Color.rgbHex('#999999'),

    style: {
        enableGrabbing: false,
        enableDropping: false,
        borderColor: Color.neutral.lightGray,
        borderWidth: 1,
        borderRadius: 5,
        padding: Rectangle.inset(0,3),

        label: {
            borderWidth: 0,
            fill: null,
            padding: Rectangle.inset(0,3),
            fontSize: 10,
            align: 'center',
            fixedWidth: true,
            fixedHeight: true,
            textColor: Color.black,
            clipMode: 'hidden',
            emphasize: {textShadow: {offset: pt(0,1), color: Color.white}},
            allowInput: false
        }
    }
},
'initializing', {
    initialize: function($super, bounds, labelString) {
        $super(this.defaultShape());
        if (bounds) this.setBounds(bounds);

        this.value = false;
        this.toggle = false;
        this.isActive = true;

        this.changeAppearanceFor(false, false);

        this.ensureLabel(labelString);

        this.setAppearanceStylingMode(true);
        this.setBorderStylingMode(true);
    },
    ensureLabel: function(labelString) {
        if (!this.label) {
            this.label = new lively.morphic.Text(this.getExtent().extentAsRectangle(), labelString);
        } else {
            this.label.setBounds(this.getExtent().extentAsRectangle());
            this.label.textString = labelString;
        }
        if (this.label.owner !== this) {
            this.addMorph(this.label);
        }
        this.label.beLabel(this.style.label);
        this.label.setTextStylingMode(true);
        this.label.disableEvents();
        return this.label;
    },


},
'accessing', {
    setLabel: function(label) {
        this.label.setTextString(label);
        this.label.setExtent(this.getExtent());
        this.label.applyStyle(this.style.label);
        return this;
    },
    getLabel: function(label) { return this.label.textString },
    setActive: function(bool) {
        this.isActive = bool;
        this.updateAppearance();
    },
    setValue: function(bool) {
        this.value = bool;
        // buttons should fire on mouse up
        if (!bool || this.toggle) lively.bindings.signal(this, 'fire', bool);
    },
    setExtent: function($super, extent) {
        // FIXME use layout! spaceFill!
        $super(extent);
        this.label && this.label.setExtent(extent)
    },
    setPadding: function(padding) { this.label && this.label.setPadding(padding); },
    setToggle: function(optBool) {
        this.toggle = (optBool === undefined)? true : optBool;
        return this.toggle
    }
},
'styling', {
    updateAppearance: function(){
        this.changeAppearanceFor(this.isPressed, this.value);
    },
    changeAppearanceFor: function(pressed, toggled) {
        if (this.isActive) {
            this.removeStyleClassName('disabled');
            var isToggled = toggled || this.value;
            if (isToggled) {
                this.addStyleClassName('toggled');
            } else {
                this.removeStyleClassName('toggled');
            }
            if (pressed) {
                this.addStyleClassName('pressed');
            } else {
                this.removeStyleClassName('pressed');
            }
            if (this.style && this.style.label && this.style.label.padding) {
                var labelPadding = pressed ? this.style.label.padding.withY(this.style.label.padding.y+1):this.style.label.padding;
                this.setPadding(labelPadding);
            }
            if (this.label)
                this.label.setExtent(this.getExtent())
        } else {
            this.addStyleClassName('disabled');
            this.removeStyleClassName('toggled');
            this.removeStyleClassName('pressed');
        }
    },

    applyStyle: function($super, spec) {
        if (spec.label && this.label) {
            this.label.applyStyle(spec.label);
        }
        return $super(spec);
    },

    generateFillWith: function(color, shade, upperCenter, lowerCenter, bottomShade){
        return new lively.morphic.LinearGradient(
            [{offset: 0, color: color.mixedWith(shade, 0.2)},
            {offset: upperCenter || 0.3, color: color},
            {offset: lowerCenter || 0.7, color: color},
            {offset: 1, color: color.mixedWith(bottomShade|| shade, 0.2)}],
            "NorthSouth");
    }

},
'events', {
    isValidEvent: function(evt) {
        if (!this.isActive) return false;
        if (evt.isLeftMouseButtonDown() && !evt.isCommandKey()) return true;
        if (evt.isKeyboardEvent && evt.keyCode === Event.KEY_RETURN) return true;
        return false;
    },

    onMouseOut: function (evt) {
        this.isPressed && this.changeAppearanceFor(false);
    },

    onMouseOver: function (evt) {
        if (evt.isLeftMouseButtonDown()) {
            this.isPressed && this.changeAppearanceFor(true);
        } else {
            this.isPressed = false;
        }
    },

    onMouseDown: function (evt) {
        if (this.isValidEvent(evt) && this.isActive) {
            this.activate();
        }
        return false;
    },

    onMouseUp: function(evt) {
        if (this.isValidEvent(evt) && this.isPressed) {
            this.deactivate();
        }
        return false;
    },
    onKeyDown: function(evt) {
        if (this.isValidEvent(evt) && this.isActive) {
            this.activate();
        }
        return false;
    },
    onKeyUp: function(evt) {
        if (this.isValidEvent(evt) && this.isPressed) {
            this.deactivate();
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
    activate: function() {
        this.isPressed = true;
        this.changeAppearanceFor(true);
    },
    deactivate: function() {
        var newValue = this.toggle ? !this.value : false;
        this.setValue(newValue);
        this.changeAppearanceFor(false);
        this.isPressed = false;
    }

},
'menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'Set label', function(evt) {
            $world.prompt('Set label', function(input) {
                if (input !== null)
                    self.setLabel(input || '');
            }, self.getLabel());
        }])
        return items;
    }
});


lively.morphic.Button.subclass('lively.morphic.ImageButton',
'initializing', {
    initialize: function($super, bounds, url) {
         //if (bounds) this.setBounds(bounds);
        $super(bounds, '');

        this.image = new lively.morphic.Image(this.getExtent().extentAsRectangle(), url, true);
        this.addMorph(this.image);
        this.image.ignoreEvents();
        this.image.disableHalos();
    },
},
'accessing', {
    setImage: function(url) {
        this.image.setImageURL(url);
        return this;
    },
    getImage: function() { return this.image.getImageURL() },

    setImageOffset: function(padding) { this.image && this.image.setPosition(padding) },
},
'menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'Set image', function(evt) {
            $world.prompt('Set image URL', function(input) {
                if (input !== null)
                    self.setImage(input || '');
            }, self.getImage());
        }])
        return items;
    },
});

lively.morphic.ImageButton.subclass('lively.morphic.ImageOptionButton',
'buttonstuff', {

    setValue: function(bool) {
        this.value = bool;
        this.changeAppearanceFor(bool);
    },

    onMouseDown: function (evt) {
        if (this.isActive && evt.isLeftMouseButtonDown()
            && !this.value && !evt.isCommandKey()) {
            this.changeAppearanceFor(true);
        }
    },

    onMouseUp: function(evt) {
        if (this.isActive && evt.isLeftMouseButtonDown()
                && !evt.isCommandKey() && !this.value && this.otherButtons) {

            this.setValue(true);
            this.otherButtons.each(function(btn){btn.setValue(false);});
            return false;
        }
        return false;
    },

    setOtherButtons: function(morphs) {
        var otherButtons = [];
        if (morphs.first()) { // if the list is empty, apply the empty list
            if (morphs.first().toUpperCase) { // if the list contains strings, get the morphs first
                var t = this;
                morphs.each(function(btn){
                    var a = t.get(btn);
                    a && a.setOtherButtons && otherButtons.push(a);
                });
            } else {
                otherButtons = morphs;
            }
        }
        this.otherButtons = otherButtons;
    },

});


lively.morphic.Morph.subclass('lively.morphic.Image',
'initializing', {
    initialize: function($super, bounds, url, useNativeExtent) {
        var imageShape = this.defaultShape(bounds.extent().extentAsRectangle(), url);
        $super(imageShape);
        this.setPosition(bounds.topLeft());
        this.setImageURL(url, useNativeExtent);
    },
    defaultShape: function(bounds, url) {
        url = url || '';
        return new lively.morphic.Shapes.Image(bounds, url);
    }
},
'accessing', {
    setImageURL: function(url, useNativeExtent) {
        if (!url) return null;
        if (useNativeExtent) {
            connect(this.shape, 'isLoaded', this, 'setNativeExtent',
                    {removeAfterUpdate: true});
        } else {
            connect(this.shape, 'isLoaded', this, 'setExtent',
                    {removeAfterUpdate: true, converter: function() {
                        return this.targetObj.getExtent(); }});
        }
        return this.shape.setImageURL(url);
    },
    getImageURL: function() { return this.shape.getImageURL() },
    getNativeExtent: function() { return this.shape.getNativeExtent() },
    setNativeExtent: function() {
        var ext = this.getNativeExtent();
        // FIXME magic numbers
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
'keyboard events', {
    onKeyPress: function($super, evt) {
        // The extent of iages should can be changed by using the + and - key
        var key = evt.getKeyChar();

        switch (key) {
            case "-": {
                this.setExtent(this.getExtent().scaleBy(0.8))
                return true;
            }
            case "+": {
                this.setExtent(this.getExtent().scaleBy(1.1))
                return true;
            }
        }
        return $super(evt)
    }
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
        var cmd = 'curl --silent "' + urlString + '" | openssl base64',
            result = new CommandLineServerInterface().beSync().runCommand(cmd).result;
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
        $super(this.defaultShape());
        this.setChecked(isChecked);
    },
    defaultShape: function() {
        // FIXME: render context dependent
        var node = XHTMLNS.create('input');
        node.type = 'checkbox';
        return new lively.morphic.Shapes.External(node);
    }
},
'accessing', {
    setChecked: function(bool) {
        // FIXME: render context dependent
        this.checked = bool;
        this.renderContext().shapeNode.checked = bool;
        return bool;
    }
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
        this.setChecked(!this.isChecked());
        return true;
     },
},
'serialization', {
    prepareForNewRenderContext: function ($super, renderCtx) {
        $super(renderCtx);
        // FIXME what about connections to this.isChecked?
        // they would be updated here...
        this.setChecked(this.isChecked());
    }
});

lively.morphic.Morph.subclass('lively.morphic.PasswordInput',
'initializing', {
    initialize: function($super, isChecked) {
        $super(this.createShape());
    },
    createShape: function() {
        var node = XHTMLNS.create('input');
        node.type = 'password';
        node.className = 'visibleSelection';
        return new lively.morphic.Shapes.External(node);
    },
},
'accessing', {
    set value(string) {
        // FIXME move to lively.morphic.HTML
        var inputNode = this.renderContext().shapeNode;
        if (inputNode) {
            inputNode.value = string;
        }

        lively.bindings.signal(this, 'value', string);
        return string;
    },
    get value() {
        // FIXME move to lively.morphic.HTML
        var inputNode = this.renderContext().shapeNode;
        return inputNode ? inputNode.value : '';
    }
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
        this.progressMorph.setExtent(pt(Math.floor(maxExt.x * value), maxExt.y));
    }
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
        opacity: 0.95
    },
    isEpiMorph: true,
    isMenu: true,
    removeOnMouseOut: false
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
    }
},
'mouse events', {
    onMouseOut: function() {
        if (this.removeOnMouseOut) {
            this.remove()
        };
        return this.removeOnMouseOut;
    }
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
        this.fitToItems.bind(this).delay(0);

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
        function createItem(string, value, idx, callback, callback2, isSubMenu) {
            return {
                isMenuItem: true,
                isListItem: true,
                isSubMenu: isSubMenu,
                string: string,
                value: value,
                idx: idx,
                onClickCallback: callback,
                onMouseOverCallback: callback2
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
                    self.openSubMenu(evt, name, subItems) }, true));
                return;
            }

            // [name, {getItems: function() { return submenu items }}]
            if (Object.isArray(item) && Object.isObject(item[1])) {
                var name = item[0], spec = item[1];
                if (Object.isFunction(spec.condition)) {
                    if (!spec.condition()) return;
                }
                if (Object.isFunction(spec.getItems)) {
                    result.push(createItem(name, name, i, null, function(evt) {
                        self.openSubMenu(evt, name, spec.getItems()) }, true));
                }
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
        var y = 0, x = 0;
        this.items.forEach(function(item) {
            var itemMorph = new lively.morphic.MenuItem(item);
            this.itemMorphs.push(this.addMorph(itemMorph));
            itemMorph.setPosition(pt(0, y));
            y += itemMorph.getExtent().y;
            x = Math.max(x, itemMorph.getExtent().x);
        }, this);
        if (this.title) y += this.title.bounds().height;
        this.setExtent(pt(x, y));
    }
},
'sub menu', {
    openSubMenu: function(evt, name, items) {
        var m = new lively.morphic.Menu(null, items);
        this.addMorph(m);
        m.fitToItems.bind(m).delay(0);
        this.subMenu = m;
        m.ownerMenu = this;

        // delayed so we can use the real text extent
        (function() {
            if (!m.ownerMenu) return; // we might have removed that submenu already again
            m.offsetForOwnerMenu();
            m.setVisible(true);
        }).delay(0);

        return m;
    },
    removeSubMenu: function() {
        if (!this.subMenu) return;
        var m = this.subMenu;
        m.ownerMenu = null;
        this.subMenu = null;
        m.remove();
    },
    removeOwnerMenu: function() {
        if (!this.ownerMenu) return;
        var m = this.ownerMenu;
        this.ownerMenu = null;
        m.remove();
    },
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
            localVisibleBounds = owner.getGlobalTransform().inverse().transformRectToRect(visibleBounds),
            newBounds = this.moveSubMenuBoundsForVisibility(
                this.innerBounds(),
                owner.overItemMorph ? owner.overItemMorph.bounds() : new Rectangle(0,0,0,0),
                localVisibleBounds);
        this.setBounds(newBounds);
    },

    fitToItems: function() {
        var offset = 10 + 20,
            morphs = this.itemMorphs;
        if (this.title) morphs = morphs.concat([this.title]);
        var widths = morphs.invoke('getTextExtent').pluck('x'),
            width = Math.max.apply(Global, widths) + offset,
            newExtent = this.getExtent().withX(width);
        this.setExtent(newExtent);
        morphs.forEach(function(ea) {
            ea.setExtent(ea.getExtent().withX(newExtent.x));
            if (ea.submorphs.length > 0) {
                var arrow = ea.submorphs.first();
                arrow.setPosition(arrow.getPosition().withX(newExtent.x-17));
            }
        })
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


lively.morphic.Text.subclass("lively.morphic.MenuItem",
'settings', {
    style: {
        clipMode: 'hidden',
        fixedHeight: true,
        fixedWidth: false,
        borderWidth: 0,
        fill: null,
        handStyle: 'default',
        enableGrabbing: false,
        allowInput: false,
        fontSize: 10.5,
        padding: Rectangle.inset(3,2),
        textColor: Config.get('textColor') || Color.black
    },
    defaultTextColor: Config.get('textColor') || Color.black
},
'initializing', {
    initialize: function($super, item) {
        $super(new Rectangle(0,0, 100, 23), item.string);
        this.item = item;
        if (item.isSubMenu) this.addArrowMorph();
    },

    addArrowMorph: function() {
        var extent = this.getExtent(),
            arrowMorph = new lively.morphic.Text(
                new Rectangle(0, 0, 10, extent.y), "▶");
        arrowMorph.setPosition(pt(extent.x, 0));
        arrowMorph.applyStyle(this.getStyle());
        this.arrow = this.addMorph(arrowMorph);
    }
},
'mouse events', {
    onMouseUp: function($super, evt) {
        if (evt.world.clickedOnMorph !== this && (Date.now() - evt.world.clickedOnMorphTime < 500)) {
            return false; // only a click
        }
        $super(evt);
        this.item.onClickCallback && this.item.onClickCallback(evt);
        if (!this.owner.remainOnScreen) this.owner.remove(); // remove the menu
        evt.stop();
        return true;
    },

    onMouseOver: function(evt) {
        if (this.isSelected) return true;
        this.select();
        this.item.onMouseOverCallback && this.item.onMouseOverCallback(evt);
        evt.stop();
        return true;
    },

    onMouseWheel: function(evt) {
        return false; // to allow scrolling
    },

    onSelectStart: function(evt) {
        return false; // to allow scrolling
    },

    select: function(evt) {
        this.isSelected = true;
        this.owner.itemMorphs.without(this).invoke('deselect');
        this.applyStyle({
            fill: new lively.morphic.LinearGradient([
                {offset: 0, color: Color.rgb(100,131,248)},
                {offset: 1, color: Color.rgb(34,85,245)}]),
            textColor: Color.white,
            borderRadius: 4
        });

        // if the item is a submenu, set its textColor to white
        var arrow = this.submorphs.first();
        if (arrow) {
            arrow.applyStyle({textColor: Color.white});
        }

        this.owner.overItemMorph = this;
        this.owner.removeSubMenu();
        return true;
    },

    deselect: function(evt) {
        this.isSelected = false;
        this.applyStyle({fill: null, textColor: this.defaultTextColor});
        if (this.arrow) {
            this.arrow.applyStyle({textColor: this.defaultTextColor});
        }
    }

});

lively.morphic.Morph.addMethods(
'menu', {
    enableMorphMenu: function() {
        this.showsMorphMenu = true;
    },
    disableMorphMenu: function() { this.showsMorphMenu = false },
    openMorphMenuAt: function(pos, itemFilter) {
        itemFilter = Object.isFunction(itemFilter) ? itemFilter : Functions.K;
        return lively.morphic.Menu.openAt(pos, this.name || this.toString(),
                                          itemFilter(this.morphMenuItems()));
    },
    showMorphMenu: function(evt) {
        var pos = evt ? evt.getPosition() : this.firstHand().getPosition();
        evt && evt.stop();
        this.openMorphMenuAt(pos);
        return true;
    },
    morphMenuItems: function() {
        var self = this,
            world = this.world(),
            items = [];

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // partsbin related
        items.push(['Publish', function(evt) { self.copyToPartsBinWithUserRequest(); }]);
        if (this.reset) {
            [].pushAt
            var idx=-1; items.detect(function(item, i) { idx = i; return item[0] === 'Publish'; });
            idx > -1 && items.pushAt(['Reset', this.reset.bind(this)], idx+1);
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // morphic hierarchy / windows
        items.push(['Open in...', [
            ['Window', function(evt) { self.openInWindow(evt.mousePoint); }],
            ['Flap...', ['top', 'right', 'bottom', 'left'].map(function(align) {
                return [align, function(evt) {
                    require('lively.morphic.MorphAddons').toRun(function() {
                        self.openInFlap(align); }); }]; })]
        ]]);

        // Drilling into scene to addMorph or get a halo
        // whew... this is expensive...
        function menuItemsForMorphsBeneathMe(itemCallback) {
            var morphs = world.morphsContainingPoint(self.worldPoint(pt(0,0)));
            morphs.pop(); // remove world
            var selfInList = morphs.indexOf(self);
            // remove self and other morphs over self (the menu)
            morphs = morphs.slice(selfInList + 1);
            return morphs.collect(function(ea) { return [String(ea), itemCallback.bind(this, ea)]; });
        }

        items.push(["Add morph to...", {
            getItems: menuItemsForMorphsBeneathMe.bind(this,  function(morph) { morph.addMorph(self) })
        }]);

        items.push(["Get halo on...", {
            getItems: menuItemsForMorphsBeneathMe.bind(this,  function(morph, evt) { morph.toggleHalos(evt); })
        }]);

        if (this.owner && this.owner.submorphs.length > 1) {
            var arrange = [];
            arrange.push(["Bring to front", function(){self.bringToFront()}]);
            arrange.push(["Send to back", function(){self.sendToBack()}]);
            items.push(["Arrange morph", arrange]);
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // stepping scripts
        var steppingItems = [];

        if (this.startSteppingScripts) {
            steppingItems.push(["Start stepping", function(){self.startSteppingScripts()}])
        }
        if (this.scripts.length != 0) {
            steppingItems.push(["Stop stepping", function(){self.stopStepping()}])
        }
        if (steppingItems.length != 0) {
            items.push(["Stepping", steppingItems])
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // lively bindings
        items.push(["Connections...", {
            getConnections: function() {
                if (!this.connections) {
                    this.connections = !self.attributeConnections ? [] :
                        self.attributeConnections
                            // rk: come on, this is a mess!
                            .reject(function(ea) { return ea.dependedBy }) // Meta connection
                            .reject(function(ea) { return ea.targetMethodName == 'alignToMagnet'}) // Meta connection
                }
                return this.connections;
            },
            condition: function() {
                return this.getConnections().length > 0;
            },
            getItems: function() {
                return this.getConnections()
                    .collect(function(ea) {
                        var s = ea.sourceAttrName + " -> " + ea.targetObj  + "." + ea.targetMethodName
                        return [s, [
                            ["Disconnect", function() { alertOK("disconnecting " + ea); ea.disconnect(); }],
                            ["Edit converter", function() { var window = lively.bindings.editConnection(ea); }],
                            ["Show", function() { lively.bindings.showConnection(ea); }],
                            ["Hide", function() { if (ea.visualConnector) ea.visualConnector.remove(); }]]];
                    });
            }
        }]);

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // morphic properties
        var morphicMenuItems = ['Morphic properties', []];
        items.push(morphicMenuItems);
        ['grabbing', 'dragging', 'dropping', 'halos'].forEach(function(propName) {
            if (self[propName + 'Enabled'] || self[propName + 'Enabled'] == undefined) {
                morphicMenuItems[1].push(["Disable " + propName.capitalize(), self['disable' + propName.capitalize()].bind(self)]);
            } else {
                morphicMenuItems[1].push(["Enable " + propName.capitalize(), self['enable' + propName.capitalize()].bind(self)]);
            }

        })

        if (this.submorphs.length > 0) {
            if (this.isLocked()) {
                morphicMenuItems[1].push(["Unlock parts", this.unlock.bind(this)])
            } else {
                morphicMenuItems[1].push(["Lock parts", this.lock.bind(this)])
            }
        }

        if (this.isFixed) {
            morphicMenuItems[1].push(["set unfixed", function() {
                self.setFixed(false);
            }]);
        } else {
            morphicMenuItems[1].push(["set fixed", function() {
                self.setFixed(true);
            }]);
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // left over...
        if (false) { // rk 12-06-22: what is this for???
            items.push(["Enable internal selections", function() {
                Trait('SelectionMorphTrait').applyTo(self, {override: ['onDrag', 'onDragStart', 'onDragEnd']});
                self.enableDragging();
            }])
        }

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
    isInInactiveWindow: function() {
        var win = this.getWindow();
        return win ? !win.isActive() : false;
    },

},
'modal dialog', {
    beModal: function(optBackgroundColor) {
        /*
         *   Makes a morph 'modal' by adding a backpane to the world
         *   which is not removed as long as the morph is still there.
         *
         *   Usage:
         *
         *   morph.beModal(Color.gray);
         *
         *  Enjoy
         */
        if (this.backPanel) {
            this.removeBackPanel();
        }

        function createBackPanel(extent) {
            var backPanel = new lively.morphic.Box(extent.extentAsRectangle()),
                style = {enableGrabbing: false, enableDragging: false};
            if (optBackgroundColor) style.fill = optBackgroundColor;
            backPanel.applyStyle(style).ignoreEvents();
            return backPanel;
        }

        this.addScript(function removeBackPanel() {
            this.backPanel && this.backPanel.remove && this.backPanel.remove();
            delete this.backPanel;
            delete this.removeBackPanel;
            delete this.remove;
        });

        this.addScript(function remove() {
            if (this.backPanelCanBeRemoved) this.removeBackPanel();
            return $super();
        });

        this.backPanel = createBackPanel(this.owner.getExtent());
        this.owner.addMorph(this.backPanel);
        this.backPanel.bringToFront();
        this.backPanelCanBeRemoved = false;
        this.bringToFront();
        this.backPanelCanBeRemoved = true;
    }
});

lively.morphic.Text.addMethods(
'menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super(), textItems = ['Text...'];
        textItems.push([[
            (self.inputAllowed() ? '[X]' : '[  ]') + ' input allowed',
            function() { self.setInputAllowed(!self.inputAllowed()); }
        ], [
            (self.evalEnabled ? '[X]' : '[  ]') + ' eval',
            function() { self.evalEnabled = !self.evalEnabled }
        ], [
            (self.syntaxHighlightingWhileTyping ? '[X]' : '[  ]') + ' syntax highlighting',
            function() { self.syntaxHighlightingWhileTyping ?
                self.disableSyntaxHighlighting() : self.enableSyntaxHighlighting() }
        ], [
            'convert to annotation',
            function() {
                var part = $world.openPartItem('AnnotationPin', 'PartsBin/Documentation');
                part.setPosition(self.getPosition());
                part.createAnnotationFromText(self);
                self.remove();
            }
        ], [
            'debugging', [
                [(self.isInChunkDebugMode() ? 'disable' : 'enable') + ' text chunk debugging',
                 function() { self.setChunkDebugMode(!self.isInChunkDebugMode()) }],
                ['open text inspector', function() {
                    var inspector = $world.openPartItem('TextInspector', 'PartsBin/Debugging');
                    inspector.targetMorph.findAndConnectMorph(self);
                }]
            ]]
        ]);
        items.push(textItems);
        return items;
    },

});


lively.morphic.World.addMethods(
'tools', {
    loadPartItem: function(partName, optPartspaceName) {
        var optPartspaceName = optPartspaceName || 'PartsBin/NewWorld',
            part = lively.PartsBin.getPart(partName, optPartspaceName);
        if (!part) return;
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
        var part = this.openPartItem("ObjectInspector", 'PartsBin/Tools');
        part.inspect(object);
        return part;
    },
    openStyleEditorFor: function(morph, evt) {
        module('lively.ide.tools.StyleEditor').load(true);
        var styleEditorWindow = lively.BuildSpec('lively.ide.tools.StyleEditor').createMorph().openInWorld();
        styleEditorWindow.setTarget(morph);
        var alignPos = morph.getGlobalTransform().transformPoint(morph.innerBounds().bottomLeft()),
            edBounds = styleEditorWindow.innerBounds(),
            visibleBounds = this.visibleBounds();
        if (visibleBounds.containsRect(edBounds.translatedBy(alignPos))) {
            styleEditorWindow.setPosition(alignPos);
        } else {
            styleEditorWindow.setPositionCentered(visibleBounds.center());
        }
        return styleEditorWindow;
    },
    openObjectEditor: function() {
        module('lively.ide.tools.ObjectEditor').load(true);
        return lively.BuildSpec('lively.ide.tools.ObjectEditor').createMorph().openInWorldCenter();
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
            toolPane.openInWindow();
            toolPane.owner.name = toolPane.name +"Window";
            toolPane.owner.minExtent = pt(700,370);
            var corner = toolPane.withAllSubmorphsDetect(function (ea) {
                return ea.name == "ResizeCorner";
            });
            corner && toolPane.owner.addMorph(corner)
        }
        var part = toolPane.openMethodFinderFor(searchString)
        part.setExtent(toolPane.tabPaneExtent)
        part.owner.layout = part.owner.layout || {};
        part.owner.layout.resizeWidth = true;
        part.owner.layout.resizeHeight = true;
        part.owner.layout.adjustForNewBounds = true;
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
                var publishDialog = this.loadPartItem('PublishPartDialog', 'PartsBin/Dialogs');
        var metaInfo = morph.getPartsBinMetaInfo();
        publishDialog.targetMorph.setTarget(morph);
        publishDialog.openInWorldCenter();
        $world.publishPartDialog = publishDialog;
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
    browseCode: function(/*args*/) {
        // find code and browse it
        // args can be objectName, methodName, sourceModuleName
        // see lively.ide.browse for more options
        var args = Array.from(arguments);
        require('lively.ide.SystemCodeBrowser').toRun(function() {
           lively.ide.browse.apply(lively.ide, args);
        });
    },

    openWorkspace: function(evt) {
        var text = this.addTextWindow({title: 'Workspace',
            content: '3 + 4', syntaxHighlighting: true})
        text.accessibleInInactiveWindow = true;
        text.setFontFamily('Monaco,monospace');
        text.selectAll();
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
    },
    openBootstrapParts: function() {
        // load the bootstrap part from webwerkstat
        // this part can fetch all his friends :-)
        var oldRootPath = Config.rootPath
        try {
            Config.rootPath = 'http://lively-kernel.org/repository/webwerkstatt/'
            this.openPartItem("BootstrapParts", "PartsBin/Tools")
        } finally {
            Config.rootPath = oldRootPath
        }
    },
    openSystemConsole: function() {
        return this.openPartItem('SystemConsole', 'PartsBin/Tools');
    },

    openBuildSpecEditor: function() {
        require('lively.ide.tools.BuildSpecEditor').toRun(function() {
          var win = lively.BuildSpec('lively.ide.tools.BuildSpecEditor').createMorph();
          win.openInWorld();
          win.align(win.bounds().center(), win.world().visibleBounds().center());
        });
    },

    openSubserverViewer: function() {
        require('lively.ide.tools.SubserverViewer').toRun(function() {
          var win = lively.BuildSpec('lively.ide.tools.SubserverViewer').createMorph();
          win.openInWorld();
          win.align(win.bounds().center(), win.world().visibleBounds().center());
        });
    },

    openServerWorkspace: function() {
        require('lively.ide.tools.ServerWorkspace').toRun(function() {
          var win = lively.BuildSpec('lively.ide.tools.ServerWorkspace').createMorph();
          win.openInWorld();
          win.align(win.bounds().center(), win.world().visibleBounds().center());
        });
    },
    openOMetaWorkspace: function() {
        return this.openPartItem('OMetaWorkspace', 'core/lively/ide/tools/');
    },

    openGitControl: function() {
        return this.openPartItem('GitControl', 'core/lively/ide/tools/');
    },


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


        partNames = ["List", "Slider", "Button"].sort()
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
            ['Reset world scale', this.resetScale.bind(this)],
            ['Check app cache', this.checkApplicationCache.bind(this)],
            ['World serialization info', function() {
                require('lively.persistence.Debugging').toRun(function() {
                    var json = lively.persistence.Serializer.serialize(world),
                        printer = lively.persistence.Debugging.Helper.listObjects(json);
                    world.addTextWindow(printer.toString());
                })}]];

        // world requirements
        var worldRequirements = world.getWorldRequirements(),
            removeRequirement = function(name) {
                world.removeWorldRequirement(name);
                alertOK(name + ' is not loaded at startup anymore');
            },
            menuItems = worldRequirements.collect(function(name) {
                return [name, [['Remove', removeRequirement.curry(name)]]];
            });
        items.push(['Requirements', menuItems]);

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
        if (Global.DebugMethodsLayer && DebugMethodsLayer.isGlobal()) {
            items.push(['[X] Debug Methods', function() {
                DebugMethodsLayer.beNotGlobal()
            }]);
        } else {
            items.push(['[  ] Debug Methods', function() {
                require('lively.ast.Morphic').toRun(function() {
                    DebugMethodsLayer.beGlobal()
                });
            }]);
        }
        if (module('lively.ast.IDESupport').isEnabled) {
            items.push(['[X] Advanced Syntax Highlighting', function() {
                require('lively.ast.IDESupport').toRun(function() {
                    lively.ast.IDESupport.disable();
                });
            }]);
        } else {
            items.push(['[  ] Advanced Syntax Highlighting', function() {
                require('lively.ast.IDESupport').toRun(function() {
                    lively.ast.IDESupport.enable();
                })
            }]);
        }
        if (Global.AutoIndentLayer && AutoIndentLayer.isGlobal()) {
            items.push(['[X] Auto Indent', function() {
                AutoIndentLayer.beNotGlobal();
            }]);
        } else {
            items.push(['[  ] Auto Indent', function() {
                require('users.cschuster.AutoIndent').toRun(function() {
                    AutoIndentLayer.beGlobal();
                });
            }]);
        }
        if (localStorage['Config_quickLoad'] == "false") {
            items.push(['[  ] Quick Load', function() {
                localStorage['Config_quickLoad'] = "true"
            }]);
        } else {
            items.push(['[X] Quick Load', function() {
                localStorage['Config_quickLoad'] = "false";
            }]);
        }
        if (localStorage['Config_CopyAndPaste'] == "false") {
            items.push(['[  ] Copy And Paste', function() {
                localStorage['Config_CopyAndPaste'] = "true"
                module('lively.experimental.CopyAndPaste').load(true)
                ClipboardLayer.beGlobal()
            }]);
        } else {
            items.push(['[X] Copy And Paste', function() {
                localStorage['Config_CopyAndPaste'] = "false";
                ClipboardLayer.beNotGlobal()
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
                ['BuildSpecEditor', this.openBuildSpecEditor.bind(this)],
                ['Test Runner', this.openTestRunner.bind(this)],
                ['Method Finder', this.openMethodFinder.bind(this)],
                ['Text Editor', function() { require('lively.ide').toRun(function() { lively.ide.openFile(URL.source.toString()); }); }],
                ['System Console', this.openSystemConsole.bind(this)],
                ['OMeta Workspace', this.openOMetaWorkspace.bind(this)],
                ['SubserverViewer', this.openSubserverViewer.bind(this)],
                ['ServerWorkspace', this.openServerWorkspace.bind(this)],
                ['GitControl', this.openGitControl.bind(this)]
            ]],
            ['Stepping', [
                ['Start stepping',  function() { world.submorphs.each(
                        function(ea) {ea.startSteppingScripts && ea.startSteppingScripts()})}],
                ['Stop stepping', function() { world.submorphs.each(
                        function(ea) {ea.stopStepping && ea.stopStepping()})}],
            ]],
            ['Preferences', [
                ['Set username', this.askForUserName.bind(this)],
                ['My user config', this.showUserConfig.bind(this)],
                ['Set extent', this.askForNewWorldExtent.bind(this)],
                ['Set background color', this.askForNewBackgroundColor.bind(this)]]
            ],
            ['Debugging', this.debuggingMenuItems(world)],
            ['Wiki', [
                ['Lively2Lively Inspector', function() {
                    require('lively.net.tools.Lively2Lively').toRun(function() {
                       lively.BuildSpec('lively.net.tools.Lively2LivelyInspector').createMorph().openInWorldCenter();
                    });
                }],
                // ['About this wiki', this.openAboutBox.bind(this)],
                // ['Bootstrap parts from webwerkstatt', this.openBootstrapParts.bind(this)],
                // ['View versions of this world', this.openVersionViewer.bind(this)],
                ['Download world', function() {
                    require('lively.persistence.StandAlonePackaging').toRun(function() {
                        lively.persistence.StandAlonePackaging.packageCurrentWorld();
                    });
                }],
                ['Delete world', this.interactiveDeleteWorldOnServer.bind(this)]
            ]],
            ['Documentation', [
                ["On short cuts", this.openShortcutDocumentation.bind(this)],
                ["On connect data bindings", this.openConnectDocumentation.bind(this)],
                ["On Lively's PartsBin", this.openPartsBinDocumentation.bind(this)],
                ["More ...", function() { window.open(Config.rootPath + 'documentation/'); }]
            ]],
            ['Save world as ...', this.interactiveSaveWorldAs.bind(this), 'synchron'],
            ['Save world', this.saveWorld.bind(this), 'synchron']
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
    addFramedMorph: function(morph, title, optLoc, optSuppressControls, suppressReframeHandle) {
        var w = this.addMorph(new lively.morphic.Window(morph, title || 'Window', optSuppressControls, suppressReframeHandle));
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
            padding: Rectangle.inset(4,2),
            fontSize: Config.get('defaultCodeFontSize')
        });
        return pane;
    },

    internalAddWindow: function(morph, title, pos, suppressReframeHandle) {
        morph.applyStyle({borderWidth: 1, borderColor: CrayonColors.iron});
        pos = pos || this.firstHand().getPosition().subPt(pt(5, 5));
        var win = this.addFramedMorph(morph, String(title || ""), pos, suppressReframeHandle);
        return morph;
    },
    addModal: function(morph, optModalOwner) {
        // add morph inside the world or in a window (if one currently is
        // marked active) so that the rest of the world/window is grayed out
        // and blocked.
        var modalOwner = optModalOwner || this,
            modalBounds = modalOwner.innerBounds(),
            blockMorph = lively.morphic.Morph.makeRectangle(modalBounds),
            transparentMorph = lively.morphic.Morph.makeRectangle(blockMorph.innerBounds());
        blockMorph.isEpiMorph = true;
        blockMorph.applyStyle({
            fill: null,
            borderWidth: 0,
            enableGrabbing: false,
            enableDragging: false
        });
        transparentMorph.applyStyle({
            fill: Color.black,
            opacity: 0.5,
            enableGrabbing: false,
            enableDragging: false
        });
        transparentMorph.isEpiMorph = true;
        blockMorph.addMorph(transparentMorph);
        if (modalOwner.modalMorph) modalOwner.modalMorph.remove();
        blockMorph.addMorph(morph);
        var alignBounds = modalOwner.visibleBounds ?
            modalOwner.visibleBounds() : modalOwner.innerBounds();
        morph.align(morph.bounds().center(), alignBounds.center());
        modalOwner.modalMorph = modalOwner.addMorph(blockMorph);
        lively.bindings.connect(morph, 'remove', blockMorph, 'remove');
        morph.focus();
        return morph;
    },

},
'dialogs', {
    openDialog: function(dialog) {
        var focusedMorph = lively.morphic.Morph.focusedMorph(),
            win = this.getActiveWindow();
        dialog.openIn(this, this.visibleBounds().topLeft(), focusedMorph);
        this.addModal(dialog.panel, win ? win.targetMorph : this);
        return dialog;
    },
    confirm: function (message, callback) {
        return this.openDialog(new lively.morphic.ConfirmDialog(message, callback));
    },
    prompt: function (message, callback, defaultInput) {
        return this.openDialog(new lively.morphic.PromptDialog(message, callback, defaultInput))
    },
    listPrompt: function (message, callback, list, defaultInput, optExtent) {
        /*
        $world.listPrompt('test', alert, [1,2,3,4], 3, pt(400,300);
        */
        var listPrompt = lively.BuildSpec('lively.morphic.ConfirmList').createMorph();
        listPrompt.promptFor({
            prompt: message,
            list: list,
            selection: defaultInput,
            extent: optExtent
        });
        lively.bindings.connect(listPrompt, 'result', {cb: callback}, 'cb');
        return this.addModal(listPrompt);
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
    askForUserNameInList: function(names) {
        var world = this, current = world.getUserName();
        return world.listPrompt(
            'Please select your username.',
            function(name) {
                if (name) {
                    alertOK("setting username to: " + name);
                } else {
                    alert("unknown user!");
                }
                    world.setCurrentUser(name);
            },
            names, current,
            pt(300,200));
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
    askForNewBackgroundColor: function() {
        var world = this,
            oldColor = this.getFill();
        if(! (oldColor instanceof Color)){
            oldColor = Color.rgb(255,255,255);
        }
        this.prompt("Please, give new world background color", function(str) {
            if (!str) return;
            var newColor;
            try {
                newColor = eval(str);
            } catch(e) {
                alert("could not eval: " + str)
            };
            if (! (newColor instanceof Color)) {
                alert("" + newColor + " " + "is not a proper Color")
                return
            }
            alert("set world background color " +  newColor);
            world.setFill(newColor)
        }, "Color." + oldColor)
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
    checkApplicationCache: function() {
        var cache = lively.ApplicationCache,
            pBar = this.addProgressBar(null, 'app cache'),
            handlers = {    
                onProgress: function(progress) {
                    pBar && pBar.setValue(progress.evt.loaded/progress.evt.total);
                },
                done: function(progress) {
                    disconnect(cache, 'progress', handlers, 'onProgress');
                    disconnect(cache, 'noupdate', handlers, 'done');
                    disconnect(cache, 'updateready', handlers, 'done');
                    pBar && pBar.remove(); }
            }
        connect(cache, 'progress', handlers, 'onProgress');
        connect(cache, 'noupdate', handlers, 'done');
        connect(cache, 'updaetready', handlers, 'done');
        cache.update();
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
    getActiveWindow: function () {
        for (var i = this.submorphs.length-1; i >= 0; i--) {
            var morph = this.submorphs[i];
            if (morph.isWindow && morph.isActive()) return morph;
        }
        return null;
    },
    closeActiveWindow: function() {
        var win = this.getActiveWindow();
        win && win.initiateShutdown();
        return !!win;
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
    style: {
        borderColor: Color.black,
        borderWidth: 0,
        fill: Color.gray.lighter().lighter(),
        clipMode: 'auto',
        fontFamily: 'Helvetica',
        fontSize: 10,
        enableGrabbing: false
    },
    selectionColor: Color.green.lighter(),
    isList: true
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
    getListExtent: function() { return this.renderContextDispatch('getListExtent') }
},
'list interface', {
    getMenu: function() { /*FIXME actually menu items*/ return [] },
    updateList: function(items) {
        if (!items) items = [];
        this.itemList = items;
        var that = this,
            itemStrings = items.collect(function(ea) { return that.renderFunction(ea); });
        this.renderContextDispatch('updateListContent', itemStrings);
    },
    addItem: function(item) {
        this.updateList(this.itemList.concat([item]));
    },

    selectAt: function(idx) {
        if (!this.isMultipleSelectionList) this.clearSelections();
        this.renderContextDispatch('selectAllAt', [idx]);
        this.updateSelectionAndLineNoProperties(idx);
    },
    saveSelectAt: function(idx) {
        this.selectAt(Math.max(0, Math.min(this.itemList.length-1, idx)));
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
        return this.selection && this.selection.isListItem ?
            this.selection : this.itemList[this.selectedLineNo];
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
    clearSelections: function() { this.renderContextDispatch('clearSelections') }

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
        return this.renderContextDispatch('resizeList');
    },
    find: function(itemOrValue) {
        // returns the index in this.itemList
        for (var i = 0; i < this.itemList.length; i++) {
            var val = this.itemList[i];
            if (val === itemOrValue || (val && val.isListItem && val.value === itemOrValue)) {
                return i;
            }
        }
        // return -1?
        return undefined;
    }

},
'styling', {
    applyStyle: function($super, spec) {
        if (spec.fontFamily !== undefined) this.setFontFamily(spec.fontFamily);
        if (spec.fontSize !== undefined) this.setFontSize(spec.fontSize);
        return $super(spec);
    },
    setFontSize: function(fontSize) { return  this.morphicSetter('FontSize', fontSize) },
    getFontSize: function() { return  this.morphicGetter('FontSize') || 10 },
    setFontFamily: function(fontFamily) { return  this.morphicSetter('FontFamily', fontFamily) },
    getFontFamily: function() { return this.morphicSetter('FontFamily') || 'Helvetica' }
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

    getSelectedIndexes: function() { return this.renderContextDispatch('getSelectedIndexes'); },

    getSelections: function() {
        return this.getSelectedItems().collect(function(ea) { return ea.isListItem ? ea.value : ea; })
    },
    setSelections: function(arr) {
        var indexes = arr.collect(function(ea) { return this.find(ea) }, this);
        this.selectAllAt(indexes);
    },
    setSelectionMatching: function(string) {
        for (var i = 0; i < this.itemList.length; i++) {
            var itemString = this.itemList[i].string || String(this.itemList[i]);
            if (string == itemString) this.selectAt(i);
        }
    },
    selectAllAt: function(indexes) {
        this.renderContextDispatch('selectAllAt', indexes)
    },

    renderFunction: function(anObject) {
        return anObject.string || String(anObject);
    }

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
        if (labelOffset) {
            this.label.setPosition(this.label.getPosition().addPt(labelOffset));
        }
        this.setAppearanceStylingMode(true);
        this.setBorderStylingMode(true);
    },
});

lively.morphic.Box.subclass("lively.morphic.TitleBar",
'documentation', {
    documentation: "Title bar for lively.morphic.Window",
},
'properties', {
    controlSpacing: 3,
    barHeight: 22,
    shortBarHeight: 15,
    accessibleInInactiveWindow: true,
    style: {
        adjustForNewBounds: true,
        resizeWidth: true
    },
    labelStyle: {
        padding: Rectangle.inset(0,0),
        fixedWidth: true,
        fixedHeight: true,
        resizeWidth: true,
        allowInput: false
    }
},
'intitializing', {
    initialize: function($super, headline, windowWidth, windowMorph, optSuppressControls) {
        if (optSuppressControls)  {  // for dialog boxes
            this.suppressControls = true;
            this.barHeight = this.shortBarHeight;
        }
        var bounds = new Rectangle(0, 0, windowWidth, this.barHeight);

        $super(bounds);

        this.windowMorph = windowMorph;

        // Note: Layout of submorphs happens in adjustForNewBounds (q.v.)
        var label;
        if (headline instanceof lively.morphic.Text) {
            label = headline;
        } else if (headline != null) { // String
            label = lively.morphic.Text.makeLabel(headline, this.labelStyle);
        }
        this.label = this.addMorph(label);
        this.label.addStyleClassName('window-title');
        this.label.setTextStylingMode(true);

        if (!this.suppressControls) {
            var cell = new Rectangle(0, 0, this.barHeight-5, this.barHeight-5);

            this.closeButton = this.addMorph(
                new lively.morphic.WindowControl(cell, this.controlSpacing, "X", pt(0,-1)));
            this.closeButton.applyStyle({moveHorizontal: true});
            this.closeButton.addStyleClassName('close');

            this.menuButton = this.addMorph(
                new lively.morphic.WindowControl(cell, this.controlSpacing, "M", pt(0,0)));

            this.collapseButton = this.addMorph(
                new lively.morphic.WindowControl(cell, this.controlSpacing, "–", pt(0,1)));
            this.collapseButton.applyStyle({moveHorizontal: true});


            this.connectButtons(windowMorph);
        }
        // This will align the buttons and label properly
        this.adjustForNewBounds();

        this.disableDropping();
        this.setAppearanceStylingMode(true);
        this.setBorderStylingMode(true);
    },

    connectButtons: function(w) {
        if (this.suppressControls) return;
        this.closeButton.plugTo(w, {getHelpText: '->getCloseHelp', fire: '->initiateShutdown'});
        this.menuButton.plugTo(w, {getHelpText: '->getMenuHelp', fire: '->showTargetMorphMenu'});
        this.collapseButton.plugTo(w, {getHelpText: '->getCollapseHelp', fire: '->toggleCollapse'});
    }

},
'label', {
    setTitle: function(string) {
        this.label.replaceTextString(string);
        this.adjustForNewBounds();
    },

    getTitle: function(string) { return this.label.textString }
},
'layouting', {
    adjustForNewBounds: function($super) {
        $super();
        var innerBounds = this.innerBounds(),
            sp = this.controlSpacing,
            loc = this.innerBounds().topLeft().addXY(sp, sp),
            l0 = loc,
            dx = pt(this.barHeight - sp, 0);
        if (this.menuButton) {
            this.menuButton.setPosition(loc);
            loc = loc.addPt(dx);
        }
        if (this.closeButton) {
            loc = this.innerBounds().topRight().addXY(
                -sp-this.closeButton.shape.getBounds().width, sp);
            this.closeButton.setPosition(loc);
            loc = loc.subPt(dx);
        }
        if (this.collapseButton) {
            this.collapseButton.setPosition(loc);
        };
        if (this.label) {
            var start = this.menuButton ? this.menuButton.bounds().topRight() : pt(0,0),
                end = this.collapseButton ? this.collapseButton.bounds().bottomLeft() : innerBounds.bottomRight();
            this.label.setBounds(rect(start, end));
        }

/*        var style = this.styleNamed("titleBar");
        var w = style.borderWidth || 1;
        var r = style.borderRadius || 3;
        this.contentMorph.setBounds(new Rectangle(w/2, w/2, innerBounds.width, this.barHeight + r));*/
    },

    lookCollapsedOrNot: function(collapsed) {
        this.applyStyle({borderRadius: collapsed ? "8px 8px 8px 8px" : "8px 8px 0px 0px"});
    }

},
'event handling', {
    onMouseDown: function (evt) {
        //Functions.False,
        // TODO: refactor to evt.hand.clickedOnMorph when everything else is ready for it
        evt.world.clickedOnMorph = this.windowMorph;
    },
    onMouseUp: Functions.False
});

lively.morphic.Morph.subclass('lively.morphic.Window', Trait('lively.morphic.DragMoveTrait').derive({override: ['onDrag','onDragStart', 'onDragEnd']}),
'documentation', {
    documentation: "Full-fledged windows with title bar, menus, etc"
},
'settings and state', {
    state: 'expanded',
    spacing: 4, // window border
    minWidth: 200,
    minHeight: 100,
    debugMode: false,
    style: {
        borderWidth: false,
        fill: null,
        borderRadius: false,
        strokeOpacity: false,
        adjustForNewBounds: true,
        enableDragging: true
    },
    isWindow: true,
    isCollapsed: function() { return this.state === 'collapsed'; }
},
'initializing', {
    initialize: function($super, targetMorph, titleString, optSuppressControls) {
        $super(new lively.morphic.Shapes.Rectangle());
        var bounds = targetMorph.bounds(),
            spacing = this.spacing;
        bounds.width += 2 * spacing;
        bounds.height += 1 * spacing;
        var titleBar = this.makeTitleBar(titleString, bounds.width, optSuppressControls),
            titleHeight = titleBar.bounds().height - titleBar.getBorderWidth();
        this.setBounds(bounds.withHeight(bounds.height + titleHeight));
        this.makeReframeHandles();

        this.titleBar             = this.addMorph(titleBar);
        this.contentOffset        = pt(spacing, titleHeight);
        this.collapsedTransform   = null;
        this.collapsedExtent      = null;
        this.expandedTransform    = null;
        this.expandedExtent       = null;
        this.ignoreEventsOnExpand = false;
        this.disableDropping();

        this.setAppearanceStylingMode(true);
        this.setBorderStylingMode(true);
        this.targetMorph = this.addMorph(targetMorph);
        this.targetMorph.setPosition(this.contentOffset);
    },

    makeReframeHandles: function() {
        // create three reframe handles (bottom, right, and bottom-right) and align them to the window
        var e = this.getExtent();
        this.reframeHandle = this.addMorph(new lively.morphic.ReframeHandle('corner', pt(14,14)));
        this.rightReframeHandle = this.addMorph(new lively.morphic.ReframeHandle('right', e.withX(this.spacing)));
        this.bottomReframeHandle = this.addMorph(new lively.morphic.ReframeHandle('bottom', e.withY(this.spacing)));
        this.alignAllHandles();
    },

    makeTitleBar: function(titleString, width, optSuppressControls) {
        // Overridden in TabbedPanelMorph
        return new lively.morphic.TitleBar(titleString, width, this, optSuppressControls);
    },

    resetTitleBar: function() {
        var oldTitleBar = this.titleBar;
        oldTitleBar.remove();
        this.titleBar = this.makeTitleBar(oldTitleBar.label.textString, this.getExtent().x);
        this.addMorph(this.titleBar);
    },
},
'window behavior', {

    initiateShutdown: function() {
        if (this.isShutdown()) return null;
        var owner = this.owner;
        if (this.onShutdown) this.onShutdown();
        this.remove();
        var morphBelow = owner.topMorph();
        if (morphBelow && morphBelow.isWindow) {
            var scroll = owner.getScrollOffset && owner.getScrollOffset();
            morphBelow.comeForward();
            if (scroll) owner.setScroll(scroll.x, scroll.y);
        }
        this.state = 'shutdown'; // no one will ever know...
        return true;
    },

    isShutdown: function() { return this.state === 'shutdown' }

},
'accessing', {
    setTitle: function(string) { this.titleBar.setTitle(string) },
    getTitle: function() { return this.titleBar.getTitle() },

    getBounds: function($super) {
        if (this.titleBar && this.isCollapsed()) {
            var titleBarTranslation = this.titleBar.getGlobalTransform().getTranslation();
            return this.titleBar.bounds().translatedBy(titleBarTranslation);
        }
        return $super();
    }
},
'reframe handles', {

    removeHalos: function($super, optWorld) {
        // Sadly, this doesn't get called when click away from halo
        // Need to patch World.removeHalosFor, or refactor so it calls this
        this.alignAllHandles();
        $super(optWorld);
    },

    alignAllHandles: function() {
        if (this.isCollapsed()) return;
        this.reframeHandle && this.reframeHandle.alignWithWindow();
        this.bottomReframeHandle && this.bottomReframeHandle.alignWithWindow();
        this.rightReframeHandle && this.rightReframeHandle.alignWithWindow();
    }

},
'menu', {
    showTargetMorphMenu: function() {
        var target = this.targetMorph || this, itemFilter;
        if (this.targetMorph) {
            var self = this;
            itemFilter = function (items) {
                items[0] = ['Publish window', function(evt) {
                    self.copyToPartsBinWithUserRequest();
                }];
                // set fixed support
                var fixItem = items.find(function (ea) {
                    return ea[0] == "set fixed" || ea[0] == "set unfixed" });
                if (fixItem) {
                    if (self.isFixed) {
                        fixItem[0] = "set unfixed";
                        fixItem[1] = function() {
                            self.setFixed(false);
                        }
                    } else {
                        fixItem[0] = "set fixed"
                        fixItem[1] = function() {
                            self.setFixed(true);
                        }
                    }
                }
                items[1] = ['Set window title', function(evt) {
                    self.world().prompt('Set window title', function(input) {
                        if (input !== null) self.titleBar.setTitle(input || '');
                    }, self.titleBar.getTitle());
                }];
                return items;
            }
        }
        target.openMorphMenuAt(this.getGlobalTransform().transformPoint(pt(0,0)), itemFilter);
    },
    morphMenuItems: function($super) {
        var self = this, world = this.world(), items = $super();
        items[0] = ['Publish window', function(evt) { self.copyToPartsBinWithUserRequest(); }];
        items.push([
            'Set title', function(evt) {
                world.prompt('Enter new title', function(input) {
                    if (input || input == '') self.setTitle(input);
                }, self.getTitle()); }]);
        return items;
    }
},
'mouse event handling', {
    highlight: function(trueForLight) {
        this.highlighted = trueForLight;
        if (trueForLight) {
            this.addStyleClassName('highlighted');
        } else {
            this.removeStyleClassName('highlighted');
        }
    },

    isInFront: function() { return this.owner && this.owner.topMorph() === this },
    isActive: function() {
        return this.isInFront() && this.world() && this.highlighted;
    },

    comeForward: function() {
        // adds the window before each other morph in owner
        // this resets the scroll in HTML, fix for now -- gather before and set it afterwards
        // step 1: highlight me and remove highlight from other windows
        if (!this.isActive()) {
            this.world().submorphs.forEach(function(ea) {
                ea !== this && ea.isWindow && ea.highlight(false); }, this);
            this.highlight(true);
        }

        var inner = this.targetMorph,
            callGetsFocus = inner && !!inner.onWindowGetsFocus;
        if (this.isInFront()) { if (callGetsFocus) { inner.onWindowGetsFocus(this); }; return; }

        // step 2: make me the frontmost morph of the world
        var scrolledMorphs = [], scrolls = [];
        this.withAllSubmorphsDo(function(ea) {
            var scroll = ea.getScroll();
            if (!scroll[0] && !scroll[1]) return;
            scrolledMorphs.push(ea); scrolls.push(scroll);
        });
        this.owner.addMorphFront(this); // come forward
        this.alignAllHandles();
        (function() {
            scrolledMorphs.forEach(function(ea, i) { ea.setScroll(scrolls[i][0], scrolls[i][1]) });
            if (callGetsFocus) { inner.onWindowGetsFocus(this); }
        }).bind(this).delay(0);
    },

    onMouseDown: function(evt) {
        var wasInFront = this.isActive();
        if (wasInFront) return false; // was: $super(evt);
        this.comeForward();
        // rk 2013-04-27: disable accessibleInInactiveWindow test for now
        // this test is not used and windows seem to work fine without it
        // the code for that feature was:
        // if (this.morphsContainingPoint(evt.getPosition()).detect(function(ea) {
        //     return ea.accessibleInInactiveWindow || true })) return false;
        // this.cameForward = true; // for stopping the up as well
        // evt.world.clickedOnMorph = null; // dont initiate drag, FIXME, global state!
        // evt.stop(); // so that text, lists that are automatically doing things are not modified
        // return true;
        this.cameForward = true; // for stopping the up as well
        return false;
    },
    onMouseUp: function(evt) {
        if (!this.cameForward) return false;
        this.cameForward = false;
        return false;
    },

    wantsToBeDroppedInto: function(dropTarget) {
        return dropTarget.isWorld;
    }
},
'debugging', {
    toString: function($super) {
        return $super() + ' ' + (this.titleBar ? this.titleBar.getTitle() : '');
    }
},
'removing', {
    remove: function($super) {
        // should trigger remove of submorphs but remove is also usedelsewhere (grab)
        // this.targetMorph && this.targetMorph.remove();
        return $super();
    }
},
'collapsing', {
    toggleCollapse: function() {
        return this.isCollapsed() ? this.expand() : this.collapse();
    },
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
    }

});

lively.morphic.Box.subclass('lively.morphic.ReframeHandle',
'initializing', {
    initialize: function($super, type, extent) {
        // type is either "bottom" or "right" or "corner"
        // FIXME refactor this into subclasses?
        $super(extent.extentAsRectangle());
        this.type = type;
        this.addStyleClassName('reframe-handle ' + type);
    }
},
'event handling', {

    onDragStart: function($super, evt) {
        this.startDragPos = evt.getPosition();
        this.originalTargetExtent = this.owner.getExtent();
        evt.stop(); return true;
    },

    onDrag: function($super, evt) {
        var moveDelta = evt.getPosition().subPt(this.startDragPos);
        if (this.type === 'bottom') { moveDelta.x = 0; }
        if (this.type === 'right') { moveDelta.y = 0; }
        var newExtent = this.originalTargetExtent.addPt(moveDelta);
        if (newExtent.x < this.owner.minWidth) newExtent.x = this.owner.minWidth;
        if (newExtent.y < this.owner.minHeight) newExtent.y = this.owner.minHeight;
        this.owner.setExtent(newExtent);
        evt.stop(); return true;
    },

    onDragEnd: function($super, evt) {
        delete this.originalTargetExtent;
        delete this.startDragPos;
        this.owner.alignAllHandles();
        evt.stop(); return true;
    }
},
'alignment', {
    alignWithWindow: function() {
        this.bringToFront();
        var window = this.owner,
            windowExtent = window.getExtent(),
            handleExtent = this.getExtent(),
            handleBounds = this.bounds();
        if (this.type === 'corner') {
            this.align(handleBounds.bottomRight(), windowExtent);
        }
        if (this.type === 'bottom') {
            var newExtent = handleExtent.withX(windowExtent.x - window.reframeHandle.getExtent().x);
            this.setExtent(newExtent);
            this.align(handleBounds.bottomLeft(), windowExtent.withX(0));
        }
        if (this.type === 'right') {
            var newExtent = handleExtent.withY(windowExtent.y - window.reframeHandle.getExtent().y);
            this.setExtent(newExtent);
            this.align(handleBounds.topRight(), windowExtent.withY(0));
        }
    }
});

Object.subclass('lively.morphic.App',
'properties', {
    initialViewExtent: pt(350, 200)
},
'initializing', {
    buildView: function(extent) {
        throw new Error('buildView not implemented!');
    }
},
'accessing', {
    getInitialViewExtent: function(world, hint) {
        return hint || this.initialViewExtent;
    }
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
    }

},
'removing', {
    removeTopLevel: function() {
        if (this.view) this.view.remove();
    }
});

lively.morphic.App.subclass('lively.morphic.AbstractDialog',
'documentation', {
    connections: ['result']
},
'properties', {
    doNotSerialize: ['lastFocusedMorph'],
    initialViewExtent: pt(300, 90),
    inset: 4
},
'initializing', {
    initialize: function(message, callback) {
        this.result = null;
        this.message = message || '?';
        if (callback) this.setCallback(callback);
    },

    openIn: function($super, owner, pos) {
        this.lastFocusedMorph = lively.morphic.Morph.focusedMorph();
        return $super(owner, pos);
    },

    buildPanel: function(bounds) {
        this.panel = new lively.morphic.Box(bounds);
        this.panel.applyStyle({
            fill: Color.rgb(210,210,210),
            borderColor: Color.gray.darker(),
            borderWidth: 1,
            adjustForNewBounds: true, // layouting
            enableGrabbing: false,
            enableDragging: false,
            lock: true
        });
    },

    buildLabel: function() {
        var bounds = new Rectangle(this.inset, this.inset,
                                   this.panel.getExtent().x - 2*this.inset, 18);
        this.label = new lively.morphic.Text(bounds, this.message).beLabel({
            fill: Color.white,
            fixedHeight: false,
            fixedWidth: false,
            padding: Rectangle.inset(0,0),
            enableGrabbing: false,
            enableDragging: false
        });
        this.panel.addMorph(this.label);

        // FIXME ugly hack for wide dialogs:
        // wait until dialog opens and text is rendered so that we can
        // determine its extent
        (function fit() {
            this.label.fit();
            var labelExtent = this.label.getExtent(),
                panelExtent = this.panel.getExtent();
            if (labelExtent.x > panelExtent.x) {
                panelExtent = panelExtent.withX(labelExtent.x + 2*this.inset);
            }
            if (labelExtent.y > bounds.height) {
                var morphsBelowLabel = this.panel.submorphs.without(this.label).select(function(ea) {
                        return ea.bounds().top() >= bounds.bottom(); }),
                    diff = labelExtent.y - bounds.height;
                panelExtent = panelExtent.addXY(0, diff);
            }
            this.panel.setExtent(panelExtent);
        }).bind(this).delay(0);
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
        if (this.lastFocusedMorph) this.lastFocusedMorph.focus();
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
            converter: function() { return false; }});
        lively.bindings.connect(this.okButton, 'fire', this, 'result', {
            converter: function() { return true; }});
        lively.bindings.connect(panel, 'onEscPressed', this, 'result', {
            converter: function(evt) { Global.event && Global.event.stop(); return false; }});
        lively.bindings.connect(panel, 'onEnterPressed', this, 'result', {
            converter: function(evt) { Global.event && Global.event.stop(); return true; }});

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
    }
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
    }
});

// COPIED from Widgets.js SelectionMorph
lively.morphic.Box.subclass('lively.morphic.Selection',
'documentation', {
    documentation: 'selection "tray" object that allows multiple objects to be moved and otherwise manipulated simultaneously'
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
        this.setBorderStylingMode(true);
        this.setAppearanceStylingMode(true);
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

        items.push(["align to grid...", this.alignToGrid.bind(this)]);

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
    alignToGrid: function() {
        this.selectedMorphs.forEach(function(ea) {
            ea.setPosition(ea.getPosition().roundTo(10));
        });
    }

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
        var topLeft = this.bounds().bottomRight(),
            bottomRight = this.bounds().topLeft(),
            self = this;

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
            selectionIndicator.setBorderStylingMode(true);
            selectionIndicator.setAppearanceStylingMode(true);
            selectionIndicator.addStyleClassName('selection-indicator');
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
            group.addMorph(ea); });
        this.selectMorphs([group]);
        return group;
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

},
'keyboard events', {

    doKeyCopy: function() {
        if (!this.selectedMorphs.length) return;
        var copies = this.selectedMorphs.invoke('copy'),
            carrier = lively.morphic.Morph.makeRectangle(0,0,1,1);
        carrier.isMorphClipboardCarrier = true;
        copies.forEach(function(ea) {
            carrier.addMorph(ea);
            ea.setPosition(this.localize(ea.getPosition()));
        }, this);
        carrier.doKeyCopy();
    }

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

        var pos = this.localize(this.eventStartPos || evt.getPosition());
        this.selectionMorph.withoutPropagationDo(function() {
            this.selectionMorph.setPosition(pos)
            this.selectionMorph.setExtent(pt(1, 1))
            this.selectionMorph.initialPosition = pos;
        }.bind(this))

    },
    onDrag: function(evt) {
        if (!this.selectionMorph) return
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

module('lively.ide'); // so that the namespace is defined even if ide is not loaded

Object.extend(lively.ide, {
    openFile: function(url) {
        require('lively.ide.tools.TextEditor').toRun(function() {
            var editor = lively.BuildSpec('lively.ide.tools.TextEditor').createMorph();
            if (url) {
                if (!String(url).startsWith('http')) url = URL.codeBase.withFilename(url);
                editor.openURL(url);
            }
            editor.openInWorld($world.positionForNewMorph(editor)).comeForward();
        });
    }
});


lively.morphic.Box.subclass('lively.morphic.HorizontalDivider',
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

    correctForDragOffset: Functions.False
},
'internal slider logic', {

    divideRelativeToParent: function(ratio) {
        // 0 <= ratio <= 1. Set divider so that it divides its owner by ration.
        // |--------|          |--------|           |<======>|
        // |        |          |        |           |        |
        // |        |          |        |           |        |
        // |<======>|   = 0.5  |        |   = 1     |        |   = 0
        // |        |          |        |           |        |
        // |        |          |        |           |        |
        // |--------|          |<======>|           |--------|
        if (!this.owner || !Object.isNumber(ratio) || ratio < 0 || ratio > 1) return;
        var ownerHeight = this.owner.getExtent().y - this.getExtent().y;
        if (ownerHeight < 0) return;
        var currentRatio = this.getRelativeDivide(),
            deltaRation = ratio - currentRatio,
            deltaY = ownerHeight * deltaRation;
        this.movedVerticallyBy(deltaY);
    },

    getRelativeDivide: function(ratio) {
        var bounds = this.bounds(),
            myTop = bounds.top(),
            myHeight = bounds.height,
            ownerHeight = this.owner.getExtent().y - myHeight;
        if (ownerHeight < 0) return NaN;
        return myTop / ownerHeight;
    },

    movedVerticallyBy: function(deltaY) {
        if (!this.resizeIsSave(deltaY)) return;

        var morphsForPosChange = this.fixed.concat(this.scalingBelow);
        morphsForPosChange.forEach(function(m) {
            var pos = m.getPosition();
            m.setPosition(pt(pos.x, pos.y + deltaY));
        });
        this.scalingAbove.forEach(function(m) {
            var ext = m.getExtent();
            m.setExtent(pt(ext.x, ext.y + deltaY));
        });
        this.scalingBelow.forEach(function(m) {
            var ext = m.getExtent();
            m.setExtent(pt(ext.x, ext.y - deltaY));
        });
        this.setPosition(this.getPosition().addPt(pt(0, deltaY)));
    },

    resizeIsSave: function(deltaY) {
        return this.scalingAbove.all(function(m) { return (m.getExtent().y + deltaY) >= this.minHeight }, this)
            && this.scalingBelow.all(function(m) { return (m.getExtent().y - deltaY) >= this.minHeight }, this);
    },

    addFixed: function(m) { if (!this.fixed.include(m)) this.fixed.push(m) },

    addScalingAbove: function(m) { this.scalingAbove.push(m) },

    addScalingBelow: function(m) {  this.scalingBelow.push(m) }
});

lively.morphic.Box.subclass('lively.morphic.Slider',
'settings', {
    style: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        borderRadius: 6,
        fill: Styles.sliderBackgroundGradient(Color.gray, "NorthSouth")
    },
    connections: {
        value: {}
    },
    mss: 12,  // "minimum slider size"
    isSlider: true
},
'initializing', {
    initialize: function($super, initialBounds, scaleIfAny) {
        $super(initialBounds);
        connect(this, 'value', this, 'adjustSliderParts');
        this.setValue(0);
        this.setSliderExtent(0.1);
        this.valueScale = (scaleIfAny === undefined) ? 1.0 : scaleIfAny;
        this.sliderKnob = this.addMorph(
            new lively.morphic.SliderKnob(new Rectangle(0, 0, this.mss, this.mss), this));
        this.adjustSliderParts();
        this.sliderKnob.setAppearanceStylingMode(true);
        this.sliderKnob.setBorderStylingMode(true);
        this.setAppearanceStylingMode(true);
        this.setBorderStylingMode(true);
    },
},
'accessing', {
    getValue: function() { return this.value },

    setValue: function(value) { return this.value = value },

    getScaledValue: function() {
        return (this.getValue() || 0) / this.valueScale; // FIXME remove 0
    },

    setScaledValue: function(value) {
        return this.setValue(value * this.valueScale);
    },

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
    }

},
'slider logic', {
      vertical: function() {
            var bnds = this.shape.bounds();
            return bnds.height > bnds.width;
      },
      clipValue: function(val) {
            return Math.min(1.0,Math.max(0,0,val.roundTo(0.0001)));
      }
},
'layouting', {
    adjustSliderParts: function() {
        if (!this.sliderKnob) return;

        // This method adjusts the slider for changes in value as well as geometry
        var val = this.getScaledValue(),
            bnds = this.shape.bounds(),
            ext = this.getSliderExtent();


        if (this.vertical()) { // more vertical...
            var elevPix = Math.max(ext*bnds.height, this.mss), // thickness of elevator in pixels
                topLeft = pt(0, (bnds.height - elevPix)*val),
                sliderExt = pt(bnds.width, elevPix);
        } else { // more horizontal...
            var elevPix = Math.max(ext*bnds.width, this.mss), // thickness of elevator in pixels
                topLeft = pt((bnds.width - elevPix)*val, 0),
                sliderExt = pt(elevPix, bnds.height);
        }
        this.sliderKnob.setBounds(bnds.topLeft().addPt(topLeft).extent(sliderExt));
        this.adjustFill();
    },
    adjustFill: function() {this.setupFill();},

    setupFill: function() {
        if (this.vertical()) {
            this.addStyleClassName('vertical');
        } else {
            this.removeStyleClassName('vertical');
        }
    }
})

// FIXME move somewhere else
lively.morphic.Box.subclass('lively.morphic.SliderKnob',
'settings', {
    style: {borderColor: Color.black, borderWidth: 1, fill: Color.gray, enableDragging: true},
    dragTriggerDistance: 0,
    isSliderKnob: true
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
    }
})

lively.morphic.Box.subclass('lively.morphic.Tree',
'documentation', {
    example: function() {
        var tree = new lively.morphic.Tree();
        tree.openInHand();
        tree.setItem({
            name: "root",
            children: [
                {name: "item 1", children: [{name: "subitem"}]},
                {name: "item 2"}]
        });
    }
},
'initializing', {
    initialize: function($super, item, optParent, optDragAndDrop) {
        this.item = item;
        this.parent = optParent;
        this.depth = this.parent ? this.parent.depth + 1 : 0;
        $super(pt(0, 0).extent(pt(300,20)));
        this.initializeLayout();
        this.disableDragging();
        if (!optDragAndDrop && !(this.parent && this.parent.dragAndDrop)) {
            this.disableDropping();
            this.disableGrabbing();
        } else {
            this.dragAndDrop = true;
        }
        if (item) this.setItem(item);
    },

    initializeLayout: function() {
        this.setFill(Color.white);
        this.setBorderWidth(0);
        this.setBorderColor(Color.black);
        if (!this.layout) this.layout = {};
        this.layout.resizeWidth = true;
        this.setLayouter(new lively.morphic.Layout.TreeLayout(this));
    },

    initializeNode: function() {
        var bounds = pt(0,0).extent(pt(200,20));
        var node = new lively.morphic.Box(bounds);
        node.ignoreEvents();
        if (!node.layout) node.layout = {};
        node.layout.resizeWidth = true;
        var layouter = new lively.morphic.Layout.HorizontalLayout(node);
        layouter.setSpacing(5);
        layouter.setBorderSize(0);
        node.setLayouter(layouter);
        if (!node.layout) node.layout = {};
        node.layout.resizeWidth = true;
        this.icon = node.addMorph(this.createIcon());
        this.label = node.addMorph(this.createLabel());
        this.node = this.addMorph(node);
    }
},
"accessing", {
    getRootTree: function() {
        return this.parent? this.parent.getRootTree() : this;
    },
    setItem: function(item) {
        this.layoutAfter(function() {
            this.item = item;
            lively.bindings.connect(item, "changed", this, "update");
            this.submorphs.invoke("remove");
            this.childNodes = null;
            if (!item.name) {
                if (item.children) this.expand();
            } else {
                this.initializeNode();
            }
        });
    }
},
'updating', {
    update: function() {
        this.updateItem(this.item);
    },
    updateItem: function(item) {
        if (this.item !== item) {
            var oldItem = this.item;
            if (oldItem) {
                lively.bindings.disconnect(oldItem, "changed", this, "update");
            }
            this.item = item;
            if (item == null) { this.remove(); return; }
            lively.bindings.connect(item, "changed", this, "update");
        } else {
            if (item.onUpdate) item.onUpdate(this);
        }
        if (this.childNodes) {
            if (item.onUpdateChildren) item.onUpdateChildren(this);
            this.updateChildren();
        }
        this.updateNode();
    },
    updateNode: function() {
        if (this.node) {
            this.updateIcon();
            this.updateLabel();
        }
    },
    updateIcon: function() {
        var str = this.item.children ? "►" : "";
        if (this.childNodes) str = "▼";
        if (this.icon.textString !== str) this.icon.textString = str;
    },
    updateLabel: function() {
        var str = this.item.name, changed = false;
        if (this.item.description) str += "  " + this.item.description;
        if (this.label.textString !== str) {
            this.label.textString = this.item.name;
            if (this.item.description) {
                var gray = {color: Color.web.darkgray};
                this.label.appendRichText("  " + this.item.description, gray);
            }
            changed = true;
        }
        if (this.item.style && this.item.style !== this.label.oldStyle) {
            this.label.firstTextChunk().styleText(this.item.style);
            this.label.oldStyle = this.item.style;
            changed = true;
        }
        var isSelected = this.label.getFill() !== null;
        if (isSelected && !this.item.isSelected)
            this.label.setFill(null);
        if (!isSelected && this.item.isSelected)
            this.label.setFill(Color.rgb(218, 218, 218));
        if (changed) this.label.fit();
    },
    updateChildren: function() {
        if (!this.childNodes) return;
        var oldChildren = this.childNodes.map(function(n) { return n.item; });
        var toRemove = oldChildren.withoutAll(this.item.children);
        for (var i = 0; i < this.childNodes.length; i++) {
            var node = this.childNodes[i];
            if (toRemove.include(node.item)) {
                node.remove();
                this.childNodes.removeAt(i--);
            }
        }
        var pageSize = this.childrenPerPage ? this.childrenPerPage : 100;
        var currentInterval = Math.ceil(this.childNodes.length / pageSize) * pageSize;
        currentInterval = Math.max(currentInterval , 100);
        var numChildren = this.item.children ? this.item.children.length : 0;
        var childrenToShow = Math.min(numChildren, currentInterval);
        for (var j = 0; j < childrenToShow; j++) {
            var item = this.item.children[j];
            if (this.childNodes.length > j && this.childNodes[j].item === item) {
                this.childNodes[j].update();
            } else {
                var newNode = this.createNodeBefore(item, this.childNodes[j]);
                this.childNodes.pushAt(newNode, j);
            }
        }
        if (!this.item.children) delete this.childNodes;
    }
},
'creating', {
    createIcon: function() {
        var bounds = pt(0, 0).extent(pt(10, 20));
        var str = this.item.children ? "►" : "";
        var icon = new lively.morphic.Text(bounds, str);
        icon.setBorderWidth(0);
        icon.setFill(null);
        icon.disableDragging();
        icon.disableGrabbing();
        icon.setInputAllowed(false);
        icon.setHandStyle('default');
        icon.setAlign("right");
        icon.addScript(function onMouseDown(evt) {
            if (this.owner.owner.item.children && evt.isLeftMouseButtonDown()) {
                this.owner.owner.toggle();
            }
        });
        return icon;
    },
    createLabel: function() {
        var bounds = pt(0, 0).extent(pt(100, 20));
        var label = new lively.morphic.Text(bounds);
        label.setBorderWidth(0);
        label.setFill(null);
        label.disableDragging();
        label.disableGrabbing();
        label.setInputAllowed(false);
        label.setHandStyle('default');
        label.setWhiteSpaceHandling('pre');
        label.setFixedWidth(false);
        label.setFixedHeight(true);
        label.addScript(function onMouseDown(evt) {
            if (evt.isLeftMouseButtonDown() && this.owner.owner.item.onSelect) {
                this.owner.owner.getRootTree().select(this.owner.owner);
            }
        });
        if (this.item.isSelected) {
            label.setFill(Color.rgb(218, 218, 218));
        }
        label.textString = this.item.name;
        if (this.item.style) {
            label.emphasizeAll(this.item.style);
            label.oldStyle = this.item.style;
        }
        if (this.item.description) {
            var gray = {color: Color.web.darkgray};
            label.appendRichText('  ' + this.item.description, gray);
        }
        return label;
    },
    createNodeBefore: function(item, optOtherNode) {
        var node = new lively.morphic.Tree(item, this);
        node.childrenPerPage = this.childrenPerPage;
        this.addMorph(node, optOtherNode);
        return node;
    },
},
'tree', {
    isChild: function() {
        return this.parent && this.parent.node;
    },
    showChildren: function() {
        var that = this;
        this.childNodes = [];
        if (!this.item.children) return;
        this.showMoreChildren();
    },
    showMoreChildren: function() {
        this.layoutAfter(function() {
            var childrenToShow = this.item.children.slice(
                this.childNodes.length,
                this.childNodes.length + (this.childrenPerPage ? this.childrenPerPage : 100));
            if (this.showMoreNode) this.showMoreNode.remove();
            this.showMoreNode = null;
            var start = this.childNodes.length === 0 ? this : this.childNodes.last();
            childrenToShow.each(function(currentItem) {
                var node = this.createNodeBefore(currentItem);
                this.childNodes.push(node);
            }, this);
            if (this.childNodes.length < this.item.children.length) {
                var more = {name: "", description: "[show more]",
                            onSelect: this.showMoreChildren.bind(this)};
                this.showMoreNode = this.createNodeBefore(more);
            }
        });
    },
    expand: function() {
        if (!this.item.children || this.childNodes) return;
        this.layoutAfter(function () {
            if (this.item.onExpand) this.item.onExpand(this);
            if (this.icon) this.icon.setTextString("▼");
            this.showChildren();
        })
    },
    expandAll: function() {
        this.withAllTreesDo(function(tree) {
            tree.expand();
        });
    },
    collapse: function() {
        if (!this.item.children || !this.childNodes) return;
        this.layoutAfter(function() {
            if (this.item.onCollapse) this.item.onCollapse(this.item);
            if (this.icon) this.icon.setTextString("►");
            if (this.childNodes) this.childNodes.invoke("remove");
            this.childNodes = null;
            if (this.showMoreNode) this.showMoreNode.remove();
            this.showMoreNode = null;
        });
    },
    toggle: function() {
        this.childNodes ? this.collapse() : this.expand();
    },
    select: function(tree) {
        this.withAllTreesDo(function(t) {
            if (t.item.isSelected) {
                delete t.item.isSelected;
                t.label.setFill(null);
            }
        });
        if (tree) {
            tree.label.setFill(Color.rgb(218, 218, 218));
            tree.item.isSelected = true;
            tree.item.onSelect(tree);
        }
    },
    layoutAfter: function(callback) {
        try {
            this.getLayouter().defer();
            callback.call(this);
        } finally {
            this.getLayouter().resume();
        }
    }
},
'editing', {
    edit: function() { console.warn('editing tree node label not supported yet'); },
    editDescription: function() {
        this.label.textString = this.item.name + (this.item.description ? "  " : "");
        this.label.growOrShrinkToFit();
        var bounds = pt(0,0).extent(pt(160, 20));
        var edit = new lively.morphic.Text(bounds, this.item.description);
        edit.isInputLine = true;
        edit.setClipMode("hidden");
        edit.setFixedHeight(true);
        edit.setFixedWidth(true);
        edit.setBorderWidth(0);
        edit.onEnterPressed = edit.onEscPressed;
        this.node.addMorph(edit);
        edit.growOrShrinkToFit();
        edit.onBlur = function() { this.finishEditingDescription(edit); }.bind(this);
        (function() { edit.focus(); edit.selectAll(); }).delay(0);
    },
    finishEditingDescription: function(edit) {
        if (this.item.onEdit) this.item.onEdit(edit.textString);
        edit.remove();
        this.updateLabel();
    }
},
'enumerating', {
    withAllTreesDo: function(iter, context, depth) {
        // only iterates through expanded childNodes, not necessarily through
        // all item children! See #withAllItemsDo
        if (!depth) depth = 0;
        var result = iter.call(context || Global, this, depth);
        if (!this.childNodes) return [result];
        return [result].concat(
            this.childNodes.invoke("withAllTreesDo", iter, context, depth + 1));
    },

    withAllItemsDo: function(iter, context) {
        function visitItem(item, depth) {
            var result = iter.call(context || Global, item, depth);
            if (!item.children) return [result];
            return item.children.inject([result], function(all, ea) {
                return all.concat(visitItem(ea, depth + 1)); });
        }
        return this.item && visitItem(this.item, 0);
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

(function setupPromptList() {
    require('lively.persistence.BuildSpec').toRun(function() {
        lively.BuildSpec('lively.morphic.ConfirmList', {
            _BorderColor: Color.rgb(102,102,102),
            _BorderWidth: 1,
            _Extent: lively.pt(300.0,90.0),
            _Fill: Color.rgb(210,210,210),
            _Position: lively.pt(610.0,6.0),
            className: "lively.morphic.Box",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            draggingEnabled: false,
            grabbingEnabled: false,
            layout: {
                adjustForNewBounds: true
            },
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                name: 'Label',
                textString: 'Label...',
                _ClipMode: "hidden",
                _Extent: lively.pt(292.0,18.0),
                _Position: lively.pt(3,3),
                _FontFamily: "Helvetica",
                _TextColor: Color.rgb(64,64,64),
                className: "lively.morphic.Text",
                isLabel: true,
                sourceModule: "lively.morphic.TextCore"
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderWidth: 1,
                _Extent: lively.pt(55.0,22.0),
                className: "lively.morphic.Button",
                name: 'CancelButton',
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                label: "Cancel",
                layout: {
                    moveHorizontal: true,
                    moveVertical: true
                },
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                toggle: false,
                value: false
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderWidth: 1,
                _Extent: lively.pt(40.0,22.0),
                className: "lively.morphic.Button",
                name: 'OKButton',
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                label: "OK",
                layout: {
                    moveHorizontal: true,
                    moveVertical: true
                }
            }, {
                className: "lively.morphic.List",
                name: "target",
                _ClipMode: "auto",
                _Extent: lively.pt(100.0,100.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                grabbingEnabled: false,
                itemList: [1,2,3]
            }],
            getSelectedItems: function getSelectedItems() {
                var target = this.get('target');
                return target.selection;
            },
            connectionRebuilder: function connectionRebuilder() {
                var target = this.get('target'),
                    cancelBtn = this.get('CancelButton'),
                    okBtn = this.get('OKButton');
                lively.bindings.connect(okBtn, 'fire', this, 'result', {
                    converter: function() { return this.targetObj.getSelectedItems(); }});
                lively.bindings.connect(cancelBtn, 'fire', this, 'result', {
                    converter: function() { return false }});
                lively.bindings.connect(this, 'onEscPressed', this, 'result', {
                    converter: function() { return false }});
                lively.bindings.connect(this, 'onEnterPressed', this, 'result', {
                    converter: function() { return this.targetObj.getSelectedItems(); }});
                lively.bindings.connect(this, 'result', this, 'remove');
            },
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                $super();
                this.applyLayout();
            },
            promptFor: function promptFor(options) {
                this.get('Label').setTextString(options.prompt);
                if (options.list) this.get('target').setList(options.list);
                if (options.selection) this.get('target').setSelection(options.selection);
                if (options.extent) this.setExtent(options.extent);
                this.get('Label').fit();
                this.applyLayout()
            },
            getLayouter: function getLayouter() {
                return {
                    onSubmorphAdded: function() {},
                    handlesSubmorphResized: function() { return false; },
                    layout: function(container, submorphs) {
                        if (container.inLayoutCycle) return;
                        container.inLayoutCycle = true;
                        var target = container.get('target'),
                            label = container.get('Label'),
                            cancelBtn = container.get('CancelButton'),
                            okBtn = container.get('OKButton');
                        cancelBtn.align(cancelBtn.bounds().bottomRight(), container.innerBounds().bottomRight().addXY(-4, -4))
                        okBtn.align(okBtn.bounds().bottomRight(), cancelBtn.bounds().bottomLeft().addXY(-5, 0));

                        target.setBounds(lively.rect(label.bounds().bottomLeft(), cancelBtn.bounds().topRight()));
                        label.setExtent(label.getExtent().withX(container.getExtent().x-4));
                        container.inLayoutCycle = false;
                    }
                }
            }
        });
    });
})();

}) // end of module
