module('lively.morphic.Widgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.morphic.TextCore', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.Button',
'settings', {

    isButton: true,

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
        if (labelString) this.ensureLabel(labelString);

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
    }

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

    onKeyDown: function($super, evt) {
        if (this.isValidEvent(evt) && this.isActive) {
            this.activate(); evt.stop(); return true;
        }
        return $super(evt);
    },

    onKeyUp: function($super, evt) {
        if (this.isValidEvent(evt) && this.isPressed) {
            this.deactivate(); evt.stop(); return true;
        }
        return $super(evt);
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
'properties', {
    isImage: true
},
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
        this.shape.isLoaded = false;
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

    whenLoaded: function(cb) {
        if (this.shape && this.shape.isLoaded) { cb.call(this); return this; }
        if (this._whenLoadedCallbacks) {
            this._whenLoadedCallbacks.push(cb);
            return this;
        }
        this.doNotSerialize = (this.doNotSerialize || []);
        this.doNotSerialize.pushIfNotIncluded('_whenLoadedCallbacks');
        this._whenLoadedCallbacks = [cb];
        var self = this;
        function whenLoaded() {
            var cbs = self._whenLoadedCallbacks;
            delete self._whenLoadedCallbacks;
            var cb; while (cbs && (cb = cbs.shift())) cb.bind(self).delay(0);
        }
        lively.bindings.connect(this.shape, 'isLoaded', {run: whenLoaded}, 'run', {
            removeAfterUpdate: true});
        return this;
    }

},
'halos', {
    getHaloClasses: function($super) {
        return $super().concat([lively.morphic.SetImageURLHalo]);
    },
},
'menu', {
    morphMenuItems: function($super) {
        var items = $super();
        items.push(['open as canvas morph', function() { lively.morphic.CanvasMorph.fromImageMorph(this).openInHand(); }.bind(this)]);
        items.push(['set to original extent', this.setNativeExtent.bind(this)]);
        items.push(['resample image to fit bounds', this.resampleImageToFitBounds.bind(this)]);
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
        var urlString = this.getImageURL(),
            type = urlString.substring(urlString.lastIndexOf('.') + 1, urlString.length);
        if (type == 'jpg') type = 'jpeg';
        if (!['gif', 'jpeg', 'png', 'tiff'].include(type)) type = 'gif';
        if (false && Global.btoa) {
            // FIXME actually this should work but the encoding result is wrong...
            // maybe the binary image content is not loaded correctly because of encoding?
            urlString = URL.makeProxied(urlString);
            var content = new WebResource(urlString).get(null, 'image/' + type).content,
                fixedContent = content.replace(/./g, function(m) {
                    return String.fromCharCode(m.charCodeAt(0) & 0xff);
                }),
                encoded = btoa(fixedContent);
            this.setImageURL('data:image/' + type + ';base64,' + encoded);
        } else {
            var image = this;
            if (!urlString.startsWith('http')) {
                urlString = URL.source.getDirectory().withFilename(urlString).toString();
            }
            lively.require('lively.ide.CommandLineInterface').toRun(function() { // FIXME
                var cmd = 'curl --silent "' + urlString + '" | openssl base64'
                lively.ide.CommandLineInterface.exec(cmd, function(cmd) {
                    image.setImageURL('data:image/' + type + ';base64,' + cmd.getStdout());
                });
            });
        }
    },

    resampleImageToFitBounds: function() {
        var ext = this.getExtent();
        var canvasMorph = new lively.morphic.CanvasMorph(ext);
        canvasMorph.getContext().drawImage(this.renderContext().imgNode, 0, 0, ext.x, ext.y);
        canvasMorph.adaptCanvasSizeHTML(canvasMorph.renderContext(), canvasMorph.getExtent(), ext);
        this.setImageURL(canvasMorph.toDataURI(), true);
    }

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
        checked: {}
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
        var self = this;
        this.checked = bool;
        function setDOMState() {
            self.renderContext().shapeNode.checked = bool;
        }
        if (this.isRendered()) setDOMState()
        else this.whenOpenedInWorld(setDOMState)
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

lively.morphic.Morph.subclass('lively.morphic.FileInput',
'properties', {
    connections: {
        selectedFile: {}
    }
},
'initializing', {
    initialize: function($super) {
        $super(this.createShape());
        this.setExtent(lively.pt(200, 20));
        this.doNotSerialize.pushIfNotIncluded("selectedFile");
    },
    createShape: function() {
        var node = XHTMLNS.create('input');
        node.type = 'file';
        return new lively.morphic.Shapes.External(node);
    },
},
'events', {
    onChange: function(evt) {
        var fileList = evt.target.files;
        for (var i = 0, f; f = fileList[i]; i++)
            this.selectedFile = f;  // fire connection
    },
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
    getFocusNodeHTML: function(ctx) {
        return ctx.shapeNode;
    }
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
    },
    doSave: function() {
        lively.bindings.signal(this, 'savedValue', this.value);
    }
},
"key events handling", {
    onKeyDown: function(evt) {
        var keys = evt.getKeyString();
        if (keys ===  'Enter' || keys ===  'Command+S' || keys ===  'Constrol+S') {
            this.doSave();
            evt.stop(); return true;
        }
        return false;
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
        fill: Color.white,
        borderColor: Color.gray.lighter(),
        borderWidth: 1,
        borderRadius: 4,
        opacity: 0.95,
        clipMode: 'visible'
    },

    paddingLeft: 20,
    isEpiMorph: true,
    isMenu: true,
    removeOnMouseOut: false

},
'initializing', {
    initialize: function($super, title, items) {
        $super(new Rectangle(0,0, 20, 10));
        this.items = [];
        this.itemMorphs = [];
        this.setStyleClass('Menu');

        if (title) this.setupTitle(title);
        if (items) this.addItems(items);
    },
    setupTitle: function(title) {
        if (this.title) this.title.remove()
        this.title = new lively.morphic.Text(
            new Rectangle(0,0, this.getExtent().x, 25),
            String(title).truncate(26)).beLabel({
                borderWidth: 0,
                clipMode: 'hidden',
                fixedWidth: false,
                fixedHeight: true,
                padding: Rectangle.inset(20,5,5,5),
                fontWeight: 'bold',
            });
        this.addMorph(this.title);
    }
},
'mouse events', {

    onMouseOver: function($super, evt) {
        // this logic is to ensure that if this is a submenu and the selected
        // item morph of the owner has chnaged but the user is still hovering over
        // me the item morph which selected me will be reselected.
        // (deselecting my item morph can happen when quickly swooping over menus)

        if (this.mouseHoveredBefore || this.subMenu) return $super();
        var owner = this.ownerMenu, myItemInOwner = this.ownerItemMorph;

        (function() {
            var w = this.world();
            var handInMe = w && this.fullContainsWorldPoint(w.hand().getPosition());
            if(!handInMe && owner && myItemInOwner !== owner.overItemMorph) {
                owner.removeSubMenu();
                return;
            }
            if (handInMe && owner && myItemInOwner && !myItemInOwner.isSelected) {
                owner.overItemMorph && owner.overItemMorph.deselect();
                myItemInOwner.select();
            }
            this.mouseHoveredBefore = true;
        }).bind(this).delay(0.3);
        // evt.stop();
        return $super(evt);
    },

    onMouseOut: function(evt) {
        this.mouseHoveredBefore = false;
        if (evt.getTargetMorph().isAncestorOf(this)) return false;
        if (this.removeOnMouseOut) this.remove();
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
            if (owner.currentMenu && owner.currentMenu !== this) { owner.currentMenu.remove() };
            owner.currentMenu = this;
        } else {
            this.isEpiMorph = false;
        }

        owner.addMorph(this);
        this.fitToItems.bind(this).delay(0);

        // this.offsetForWorld(pos);
        // delayed because of fitToItems
        // currently this is deactivated because the initial bounds are correct
        // for our current usage
        this.offsetForWorld.curry(pos).bind(this).delay(0);

        return this;
    }

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
        var y = this.yStartForItems(), x = 0;

        this.items.forEach(function(item) {
            var itemMorph = new lively.morphic.MenuItem(item);
            this.itemMorphs.push(this.addMorph(itemMorph));
            itemMorph.setPosition(pt(0, y));
            y += itemMorph.getExtent().y;
            x = Math.max(x, itemMorph.getExtent().x);
        }, this);
        this.setExtent(pt(x, y));
    }
},
'sub menu', {

    openSubMenu: function(evt, name, items) {
        var itemMorph = this.overItemMorph;

        var m = new lively.morphic.Menu(null, items);
        m.ownerItemMorph = itemMorph;

        // only open a new submenu after a certain delay to reduce the
        // impression of "flickering" menus and to be less annoying when trying to
        // move over a menu and leaving the bounds of the item morph that opened it
        this.openingSubMenuProcess && Global.clearTimeout(this.openingSubMenuProcess);
        this.openingSubMenuProcess = Global.setTimeout(function() {

            if (!itemMorph.isSelected) return;
            var existingSubMenu = this.subMenu;

            if (existingSubMenu) {
                if (existingSubMenu.ownerItemMorph === itemMorph) return;
                if (this.morphsContainingPoint(this.world().hand().getPosition()).include(existingSubMenu)) {
                    return;
                }
                this.removeSubMenu();
            }

            this.addMorph(m);
            m.setVisible(false); //To avoid flickering
            m.fitToItems.bind(m).delay(0);
            this.subMenu = m;
            m.ownerMenu = this;
            var evtTarget = evt.getTargetMorph();
            if (evtTarget.isMenuItemMorph) m.ownerItemMorph = this.overItemMorph;

            // delayed so we can use the real text extent
            (function() {
                if (!m.ownerMenu) return; // we might have removed that submenu already again
                m.offsetForOwnerMenu();
                m.setVisible(true);
                m.ownerMenu.setClipMode('visible');
            }).delay(0);
        }.bind(this), .2*1000);

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
    }
},
'removal', {
    remove: function($super) {
        if (this.owner && this.owner.currentMenu === this) this.owner.currentMenu = null;
        $super();
        this.removeSubMenu();
        this.removeOwnerMenu();
    }
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
        if (this.owner.visibleBounds) {
            var worldBounds = this.owner.visibleBounds();
            bounds = this.clipForVisibility(
                this.moveBoundsForVisibility(bounds, worldBounds),
                worldBounds);
        }
        this.setBounds(bounds);
    },

    yStartForItems: function() {
        return this.title ? this.title.getExtent().y : 0
    },

    offsetForOwnerMenu: function() {
        var owner = this.ownerMenu,
            visibleBounds = this.world().visibleBounds(),
            localVisibleBounds = owner.getGlobalTransform().inverse().transformRectToRect(visibleBounds),
            newBounds = this.clipForVisibility(
                this.moveSubMenuBoundsForVisibility(
                    this.innerBounds(),
                    owner.overItemMorph ? owner.overItemMorph.bounds() : new Rectangle(0,0,0,0),
                    localVisibleBounds), visibleBounds);
        this.setBounds(newBounds);
    },

    clipForVisibility: function(bounds, worldBounds) {
        bounds = bounds || this.bounds();
        worldBounds = worldBounds || this.world().visibleBounds();
        var globalBounds = this.owner.getTransform().transformRectToRect(bounds),
            overlapping = !worldBounds.containsRect(globalBounds.insetBy(5));
        if (overlapping) {
            bounds = bounds.withExtent(pt(this.getScrollBarExtent().x + 5 + bounds.width, worldBounds.height));
            this.beClip('auto');
        }
        return bounds;
    },

    fitToItems: function() {
        var paddingLeft = (new lively.morphic.MenuItem({})).getPadding().left(),
            offset = 10 + 20,
            morphs = this.itemMorphs;
        if (this.title) morphs = morphs.concat([this.title]);

        var widths = morphs.invoke('getTextExtent').pluck('x'),
            width = Math.max.apply(Global, widths) + offset + paddingLeft,
            newExtent = this.getExtent().withX(width);
        this.setExtent(newExtent);

        morphs.forEach(function(ea) {
            ea.setExtent(ea.getExtent().withX(newExtent.x));
            if (ea.submorphs.length > 0) {
                var arrow = ea.submorphs.first();
                arrow.setPosition(arrow.getPosition().withX(newExtent.x-17 - paddingLeft));
            }
        });

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
    isMenuItemMorph: true,
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
        padding: Rectangle.inset(20,3),
        textColor: Config.get('textColor') || Color.black,
        whiteSpaceHandling: 'nowrap'
    },
    defaultTextColor: Config.get('textColor') || Color.black
},
'initializing', {
    initialize: function($super, item) {
        $super(new Rectangle(0,0, 20, 23), item.string);
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

    onMouseOver: function(evt) {
        // Selects a new menu option
        this.owner.overItemMorph = this;
        this.owner.itemMorphs.without(this).invoke('deselect');
        if (this.isSelected) return false;
        this.select();
        this.item.onMouseOverCallback && this.item.onMouseOverCallback(evt);
        evt.stop();
        return true;
    },

    onMouseUp: function($super, evt) {
        if (evt.hand.clickedOnMorph !== this && (Date.now() - evt.hand.clickedOnMorphTime < 500)) {
            return false; // only a click
        }
        $super(evt);
        this.item.onClickCallback && this.item.onClickCallback(evt);
        if (!this.owner.remainOnScreen) this.owner.remove(); // remove the menu
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
        this.applyStyle({
            fill: new lively.morphic.LinearGradient([
                {offset: 0, color: Color.rgb(43, 88, 255)},
                {offset: 1, color: Color.rgb(42, 87, 192)}]),
            textColor: Color.white,
            borderRadius: 4
        });

        // if the item is a submenu, set its textColor to white
        var arrow = this.submorphs.first();
        if (arrow) {
            arrow.applyStyle({textColor: Color.white});
        }

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
    createMorphMenu: function(itemFilter) {
        itemFilter = Object.isFunction(itemFilter) ? itemFilter : Functions.K;
        return new lively.morphic.Menu(this.name || this.toString(),
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

        items.push(['Select all submorphs', function(evt) { self.world().setSelectedMorphs(self.submorphs.clone()); }]);

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // morphic hierarchy / windows
        items.push(['Open in...', [
            ['Window', function(evt) { self.openInWindow(evt.mousePoint); }]
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
        var connectionNames = Properties.own(this.getConnectionPoints());
        items.push(["Connect ...", connectionNames.collect(function(name) {
                return [name, function() {
                    var builder = self.getVisualBindingsBuilderFor(name);
                    builder.openInHand();
                    builder.setPosition(pt(0,0));
                }]
            }).concat([['Custom ...', function() {
                world.prompt('Name of custom connection start?', function(name) {
                    if (!name) return;
                    var builder = self.getVisualBindingsBuilderFor(name);
                    builder.openInHand();
                    builder.setPosition(pt(0,0));
                });
            }]])
        ]);

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
        morphicMenuItems[1].push(['display serialization info', function() {
                require('lively.persistence.Debugging').toRun(function() {
                    var json = self.copy(true),
                        printer = lively.persistence.Debugging.Helper.listObjects(json);
                    var text = world.addTextWindow({content: printer.toString(),
                        extent: pt(600, 200),
                        title: 'Objects in this world'});
                    text.setFontFamily('Monaco,monospace');
                    text.setFontSize(10);
                })}]);
        ['grabbing', 'dragging', 'dropping', 'halos'].forEach(function(propName) {
            if (self[propName + 'Enabled'] || self[propName + 'Enabled'] == undefined) {
                morphicMenuItems[1].push(["Disable " + propName.capitalize(), self['disable' + propName.capitalize()].bind(self)]);
            } else {
                morphicMenuItems[1].push(["Enable " + propName.capitalize(), self['enable' + propName.capitalize()].bind(self)]);
            }

        });

        if (this.submorphs.length > 0) {
            if (this.isLocked()) {
                morphicMenuItems[1].push(["Unlock parts", this.unlock.bind(this)])
            } else {
                morphicMenuItems[1].push(["Lock parts", this.lock.bind(this)])
            }
        }

        if (this.hasFixedPosition()) {
            morphicMenuItems[1].push(["set unfixed", function() {
                self.disableFixedPositioning();
            }]);
        } else {
            morphicMenuItems[1].push(["set fixed", function() {
                self.enableFixedPositioning()
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
        var self = this;
        var items = $super();
        var self = this, textItems = ['Text...'];
        textItems.push([[
            (self.inputAllowed() ? '[X]' : '[  ]') + ' input allowed',
            function() { self.setInputAllowed(!self.inputAllowed()); }
        ], [
            (self.isInputLine ? '[X]' : '[  ]') + ' Return Key accepts value',
            function() { self.beInputLine(!self.isInputLine);
                        self.isInputLine = !self.isInputLine;}
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

        items.push(['markup edit', self.openRichTextSpecEditor.bind(self)]);

        return items;
    },

});


lively.morphic.World.addMethods(
'tools', {
    loadPartItem: function(partName, optPartspaceName, cb) {
        var optPartspaceName = optPartspaceName || 'PartsBin/NewWorld',
            part = lively.PartsBin.getPart(partName, optPartspaceName, cb ? function(err, part) {
                if (part && part.onCreateFromPartsBin) part.onCreateFromPartsBin();
                cb(err, part)
            } : undefined);
        if (!part) {debugger;
            return;
        }
        if (part.onCreateFromPartsBin) part.onCreateFromPartsBin();
        return part;
    },
    openPartItem: function(partName, optPartspaceName) {
        var part = this.loadPartItem(partName, optPartspaceName);
        part.openInWorld(pt(0,0))
        part.align(part.bounds().center(), this.visibleBounds().center());
        var win = part.getWindow();
        if (win) win.comeForward();
        return part;
    },
    openPartsBin: function() {
        lively.require('lively.morphic.tools.PartsBin').toRun(function() {
            lively.BuildSpec('lively.morphic.tools.PartsBin').createMorph().
                openInWorldCenter().comeForward();
        });
    },
    openEntanglementInspectorFor: function(object, evt) {
        var e = object.buildSpec().createEntanglement();
        e.postEntangle(object);
        return e.visualize();
    },

    openInspectorFor: function(object) {
        lively.require('lively.ide.tools.Inspector').toRun(function() {
            lively.BuildSpec('lively.ide.tools.Inspector').createMorph().openInWorldCenter().
                comeForward().inspect(object);
        });
    },

    openStyleEditorFor: function(morph, evt) {
        var self = this;
        lively.require('lively.ide.tools.StyleEditor').toRun(function() {
            var styleEditorWindow = lively.BuildSpec('lively.ide.tools.StyleEditor').createMorph().
                    openInWorld();
            styleEditorWindow.setTarget(morph);
            var alignPos = morph.getGlobalTransform().transformPoint(morph.innerBounds().bottomLeft()),
                edBounds = styleEditorWindow.innerBounds(),
                visibleBounds = self.visibleBounds();
            if (visibleBounds.containsRect(edBounds.translatedBy(alignPos))) {
                styleEditorWindow.setPosition(alignPos);
            } else {
                styleEditorWindow.setPositionCentered(visibleBounds.center());
            }
            if (lively.Config.get('useAceEditor')) {
                var oldEditor = styleEditorWindow.get("CSSCodePane"),
                    newEditor = new lively.morphic.CodeEditor(oldEditor.bounds(), oldEditor.textString);
                newEditor.applyStyle({
                    fontSize: lively.Config.get('defaultCodeFontSize')-1,
                    gutter: false,
                    textMode: 'css',
                    lineWrapping: false,
                    printMargin: false,
                    resizeWidth: true, resizeHeight: true
                });
                lively.bindings.connect(newEditor, "savedTextString", oldEditor.get("CSSApplyButton"), "onFire");
                newEditor.replaceTextMorph(oldEditor);
            }
            styleEditorWindow.comeForward();
        });
    },

    openObjectEditor: function(whenDone) {
        lively.require('lively.ide.tools.ObjectEditor').toRun(function() {
            var editor = lively.BuildSpec('lively.ide.tools.ObjectEditor').createMorph().
                    openInWorldCenter().comeForward();
            whenDone instanceof Function && whenDone(editor);
        });
    },
    openTerminal: function() {
        require('lively.ide.commands.default').toRun(function() {
            lively.ide.commands.exec('lively.ide.execShellCommandInWindow') });
    },
    openObjectEditorFor: function(morph, whenDone) {
        this.openObjectEditor(function(objectEditor) {
            var textMorph = objectEditor.get('ObjectEditorScriptPane');
            objectEditor.setTarget(morph);
            if (!lively.Config.get('useAceEditor') || textMorph.isAceEditor) return objectEditor;
            // This whole thing needs some serious cleanup
            // FIXME!!!
            objectEditor.withAllSubmorphsDo(function(ea) { ea.setScale(1) });
            // replace the normal text morph of the object editor with a
            // CodeEditor
            var owner = textMorph.owner,
                textString = textMorph.textString,
                bounds = textMorph.bounds(),
                name = textMorph.getName(),
                objectEditorPane = textMorph.objectEditorPane,
                scripts = textMorph.scripts,
                codeMorph = new lively.morphic.CodeEditor(bounds, textString || '');

            lively.bindings.connect(codeMorph, 'textString',
                                    owner.get('ChangeIndicator'), 'indicateUnsavedChanges');
            codeMorph.setName(name);
            codeMorph.objectEditorPane = objectEditorPane;
            codeMorph.applyStyle({resizeWidth: true, resizeHeight: true});
            codeMorph.accessibleInInactiveWindow = true;

            Functions.own(textMorph).forEach(function(scriptName) {
                textMorph[scriptName].asScriptOf(codeMorph);
            });

            codeMorph.addScript(function displayStatus(msg, color, delay) {
                if (!this.statusMorph) {
                    this.statusMorph = new lively.morphic.Text(pt(100,25).extentAsRectangle());
                    this.statusMorph.applyStyle({borderWidth: 1, strokeOpacity: 0, borderColor: Color.gray});
                    this.statusMorph.setFill(this.owner.getFill());
                    this.statusMorph.setFontSize(11);
                    this.statusMorph.setAlign('center');
                    this.statusMorph.setVerticalAlign('center');
                }
                this.statusMorph.setTextString(msg);
                this.statusMorph.centerAt(this.innerBounds().center());
                this.statusMorph.setTextColor(color || Color.black);
                this.addMorph(this.statusMorph);
                (function() { this.statusMorph.remove() }).bind(this).delay(delay || 2);
            });

            objectEditor.targetMorph.addScript(function onWindowGetsFocus() {
                this.get('ObjectEditorScriptPane').focus();
            });

            objectEditor.addScript(function onKeyDown(evt) {
                var sig = evt.getKeyString(),
                    scriptList = this.get('ObjectEditorScriptList'),
                    sourcePane = this.get('ObjectEditorScriptPane');
                switch(sig) {
                    case 'F1': scriptList.focus(); evt.stop(); return true;
                    case 'F2': sourcePane.focus(); evt.stop(); return true;
                    default: $super(evt);
                }
            });

            owner.addMorphBack(codeMorph);
            lively.bindings.disconnectAll(textMorph);
            textMorph.remove();
            owner.reset();
            objectEditor.comeForward();
            whenDone instanceof Function && whenDone(objectEditor);
        });
    },

    openMethodFinder: function() {
        this.prompt("find implementors: ", function(s) {
            if (!s) { alertOK('nothing to search...'); return; }
            this.openMethodFinderFor(s, '__implementor');
        }.bind(this));
    },

    openReferencingMethodFinder: function () {
        this.prompt("find source: ", function(s) {
            if (!s) { alertOK('nothing to search...'); return; }
            this.openMethodFinderFor(s);
        }.bind(this));
    },

    openMethodFinderFor: function(searchString, searchType) {
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
        var part = toolPane.openMethodFinderFor(searchString.strip(), searchType)
        part.setExtent(toolPane.tabPaneExtent)
        part.owner.layout = part.owner.layout || {};
        part.owner.layout.resizeWidth = true;
        part.owner.layout.resizeHeight = true;
        part.owner.layout.adjustForNewBounds = true;
        return part;
    },

    openVersionViewer: function(path) {
       require('lively.net.tools.Wiki').toRun(function() {
           var versionViewer = lively.BuildSpec('lively.wiki.VersionViewer').createMorph().openInWorldCenter().comeForward();
           var relPath = path ?
               (URL.isURL(path) ? new URL(path).relativePathFrom(URL.root) : path) :
               URL.source.relativePathFrom(URL.root);
           versionViewer.setAndSelectPath(relPath);
        });
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
        var self = this;
        lively.require('lively.morphic.tools.PublishPartDialog').toRun(function() {
            var publishDialog = lively.BuildSpec('lively.morphic.tools.PublishPartDialog').createMorph(),
                metaInfo = morph.getPartsBinMetaInfo();
            publishDialog.openInWorldCenter();
            publishDialog.targetMorph.setTarget(morph);
            self.publishPartDialog = publishDialog;
        });
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
            browser.openIn(world).comeForward();
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

    openWorkspace: function (evt) {
        lively.ide.commands.exec('lively.ide.openWorkspace');
    },

    openTextWindow: function(evt) {
        var editor;
        if (lively.Config.get('useAceEditor')) {
            editor = this.addCodeEditor({
                title: "Text Window",
                content: "3 + 4",
                syntaxHighlighting: true,
                textMode: 'text',
                extent: lively.Point.fromTuple(lively.Config.get("defaultWorkspaceExtent")),
                theme: lively.Config.get("aceWorkspaceTheme"),
                lineWrapping: lively.Config.get("aceDefaultLineWrapping")
            });
        } else {
            editor = this.addTextWindow({title: 'Workspace',
                content: '3 + 4', syntaxHighlighting: true})
            editor.accessibleInInactiveWindow = true;
            editor.setFontFamily('Monaco,monospace');
        }
        editor.owner.comeForward();
        editor.selectAll();
        return editor;
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
        lively.ide.commands.exec("lively.ide.openSystemConsole");
    },

    openBuildSpecEditor: function() {
        require('lively.ide.tools.BuildSpecEditor').toRun(function() {
            lively.BuildSpec('lively.ide.tools.BuildSpecEditor').createMorph().openInWorldCenter().comeForward();
        });
    },

    openSubserverViewer: function(doFunc) {
        // usage:
        //   $world.openSubserverViewer(function(err, viewer) { viewer.targetMorph.selectServer("ClojureServer"); });
        lively.require('lively.ide.tools.SubserverViewer').toRun(function() {
            var subserver = lively.BuildSpec('lively.ide.tools.SubserverViewer').createMorph().openInWorldCenter().comeForward();
            Object.isFunction(doFunc) && doFunc(null, subserver);
        });
    },

    openServerWorkspace: function() {
        require('lively.ide.tools.ServerWorkspace').toRun(function() {
            lively.BuildSpec('lively.ide.tools.ServerWorkspace').createMorph().openInWorldCenter().comeForward();
        });
    },
    openOMetaWorkspace: function() {
        return this.openPartItem('OMetaWorkspace', 'core/lively/ide/tools/');
    },

    openGitControl: function() {
        return this.openPartItem('GitControl', 'core/lively/ide/tools/');
    },

    openFileTree: function() {
        lively.ide.commands.exec('lively.ide.openDirViewer');
    },

    openPresentationController: function() {
        require('lively.presentation.Controller').toRun(function() {
            lively.presentation.Controller.open()
        });
    },

    bugReport: function() {
        window.open(lively.Config.get('bugReportWorld'));
    },

    addCodeEditor: function(options) {
        options = Object.isString(options) ? {content: options} : (options || {}); // convenience
        var bounds = (options.extent || lively.pt(500, 200)).extentAsRectangle(),
            title = options.title || 'Code editor',
            editor = new lively.morphic.CodeEditor(bounds, options.content || ''),
            pane = this.internalAddWindow(editor, options.title, options.position);
        if (Object.isString(options.position)) delete options.position;
        editor.applyStyle({resizeWidth: true, resizeHeight: true, gutter: false});
        editor.accessibleInInactiveWindow = true;
        if (options.hasOwnProperty("evalEnabled")) editor.evalEnabled = options.evalEnabled;
        editor.applyStyle(options);
        editor.focus();
        return pane;
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
                    var text = world.addTextWindow({content: printer.toString(),
                        extent: pt(600, 250),
                        title: 'Objects in this world'});
                    text.setFontFamily('Monaco,monospace');
                    text.setFontSize(9);
                })}]];

        items.push(["Show connectors", function() {
            world.submorphs.forEach(function(ea) {
                if (ea.isPath && ea.con) ea.owner.addMorph(ea);
            }); }
        ]);

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
            }
        } else {
            items.push(['Prepare system for tracing/debugging', function() {
                require("lively.Tracing").toRun(function() {
                    lively.Tracing.installStackTracers();
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
            ['Search', [
                ['for Code', function() { lively.ide.commands.byName["lively.ide.codeSearch"].exec(); }]
            ]],
            ['Tools', [
                ['Workspace', this.openWorkspace.bind(this)],
                ['System Code Browser', this.openSystemBrowser.bind(this)],
                ['Object Editor', this.openObjectEditor.bind(this)],
                ['Test Runner', this.openTestRunner.bind(this)],
                ['Text Editor', function() { lively.require('lively.ide').toRun(function() { lively.ide.openFile(URL.source.toString()); }); }],
                ['System Console', this.openSystemConsole.bind(this)],
                ['Subserver Viewer', this.openSubserverViewer.bind(this)],
                ['Server Workspace', this.openServerWorkspace.bind(this)],
                ['Terminal', this.openTerminal.bind(this)],
                ['File tree', this.openFileTree.bind(this)],
                ['Git Control', this.openGitControl.bind(this)]
            ]],
            ['Stepping', [
                ['Start stepping',  function() { world.submorphs.each(
                        function(ea) {ea.startSteppingScripts && ea.startSteppingScripts()})}],
                ['Stop stepping', function() { world.submorphs.each(
                        function(ea) {ea.stopStepping && ea.stopStepping()})}],
            ]],
            ['Preferences', [
                ['Show login info', function() {
                    lively.require("lively.net.Wiki").toRun(function() { lively.net.Wiki.showLoginInfo(); })
                }],
                ['My user config', this.showUserConfig.bind(this)],
                ['Preferences', this.openPreferences.bind(this)],
                ['Set world extent', this.askForNewWorldExtent.bind(this)],
                ['Set background color', this.askForNewBackgroundColor.bind(this)],
                ['Set grid spacing', function() { lively.ide.commands.exec("lively.morphic.Morph.setGridSpacing") }]]
            ],
            ['Debugging', this.debuggingMenuItems(world)],
            ['Wiki', [
                // ['About this wiki', this.openAboutBox.bind(this)],
                // ['Bootstrap parts from webwerkstatt', this.openBootstrapParts.bind(this)],
                ['View versions of this world', this.openVersionViewer.bind(this, URL.source)],
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
                ["More ...", function() { window.open('http://lively-web.org/documentation/'); }]
            ]],
            ['Report a bug', this.bugReport.bind(this)],
            ['Run command...', function() { lively.ide.commands.exec('lively.ide.commands.execute'); }],
            ['Save world as ...', this.interactiveSaveWorldAs.bind(this), 'synchron'],
            ['Save world', this.saveWorld.bind(this), 'synchron']
        ];

        return items;
    },
    openExactReferencesMethodFinder: function() {
        this.prompt("find Senders: ", function(s) {
            if (!s) { alertOK('nothing to search...'); return; }
            this.openMethodFinderFor(s, '__sender');
        }.bind(this));
    }

},
'positioning', {
    positionForNewMorph: function (newMorph, relatedMorph) {
        // this should be much smarter than the following:
        if (relatedMorph)
            return relatedMorph.bounds().topLeft().addPt(pt(5, 0));
        var pos = this.firstHand().getPosition();
        if (!newMorph) return pos;
        var viewRect = this.visibleBounds().insetBy(5),
            newMorphBounds = pos.extent(newMorph.getExtent());
        return viewRect.translateForInclusion(newMorphBounds).topLeft();
    },
},
'windows', {
    addFramedMorph: function(morph, title, optLoc, optSuppressControls, suppressReframeHandle) {
        var w = this.addMorph(new lively.morphic.Window(morph, title || 'Window', optSuppressControls, suppressReframeHandle));
        if (Object.isString(optLoc)) {
            w.align(w.bounds()[optLoc](), this.visibleBounds()[optLoc]());
        } else {
            optLoc && w.setPosition(optLoc);
            w.setPosition(this.positionForNewMorph(w));
        }
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
        morph.applyStyle({borderColor: CrayonColors.iron});
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
        blockMorph.isModalMorph = true;
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
        blockMorph.modalTarget = morph;
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
        this.addModal(dialog.panel, win && !win.isCollapsed() ? win : this);
        return dialog;
    },

    confirm: function (message, callback, buttons) {
        return this.openDialog(new lively.morphic.ConfirmDialog(message, callback, buttons));
    },

    inform: function(message, callback) {
        return this.openDialog(new lively.morphic.InformDialog(message, callback));
    },

    prompt: function(message, callback, defaultInputOrOptions) {
        // options = {
        //   input: STRING, -- optional, prefilled input string
        //   historyId: STRING -- id to identify the input history for this prompt
        // }
        return this.openDialog(new lively.morphic.PromptDialog(message, callback, defaultInputOrOptions))
    },

    passwordPrompt: function(message, callback, options) {
        return this.openDialog(new lively.morphic.PasswordPromptDialog(message, callback, options));
    },

    listPrompt: function(message, callback, list, defaultInput, optExtent) {
        // $world.listPrompt('test', alert, [1,2,3,4], 3, pt(400,300));
        var self = this;
        lively.require('lively.morphic.tools.ConfirmList').toRun(function() {
            var listPrompt = lively.BuildSpec('lively.morphic.tools.ConfirmList').createMorph();
            listPrompt.promptFor({
                prompt: message,
                list: list,
                selection: defaultInput,
                extent: optExtent
            });
            (function() { listPrompt.get('target').focus(); }).delay(0);
            lively.bindings.connect(listPrompt, 'result', {cb: callback}, 'cb');
            return self.addModal(listPrompt);
        });
    },

    editPrompt: function(message, callback, defaultInputOrOptions) {
        return this.openDialog(new lively.morphic.EditDialog(message, callback, defaultInputOrOptions))
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

    addLoadingIndicator: function(labelText, thenDo) {
        var container = lively.newMorph({extent: pt(100,50), style: {fill: Color.white, borderWidth: 1, borderColor: Color.gray}});
        container.setLayouter({type: 'vertical'});
        var spinningWheel = $world.loadPartItem("ProgressIndicator", "PartsBin/Widgets");
        spinningWheel.applyStyle({centeredHorizontal: true});
        var label = new lively.morphic.Text(lively.rect(0,0,5,5), labelText);
        label.applyStyle({align: 'center', whiteSpaceHandling: 'pre', fixedHeight: false, fixedWidth: false, fill: null, borderWidth: 0})

        container.addMorph(spinningWheel);
        container.addMorph(label);
        container.openInWorldCenter();
        container.setVisible(false);

        label.fitThenDo(function() {
            container.setExtent(container.bounds().extent().addXY(0, 0));
            container.openInWorldCenter();
            container.setVisible(true);
            container.applyLayout()
        });

        thenDo && thenDo(null, container);
    },
},
'morph selection', {
    withSelectedMorphsDo: function(func, context) {
        // FIXME currently it is the halo target...
        if (!this.currentHaloTarget) return;
        func.call(context || Global, this.currentHaloTarget);
    }
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
    },
    activateTopMostWindow: function() {
        var morphBelow = this.topMorph();
        if (morphBelow && morphBelow.isWindow) {
            var scroll = this.getScrollOffset && this.getScrollOffset();
            morphBelow.comeForward();
            if (scroll) this.setScroll(scroll.x, scroll.y);
        }
    }

});

lively.morphic.Button.subclass("lively.morphic.WindowControl",
'documentation', {
    documentation: "Event handling for Window morphs",
},
'settings and state', {
    style: {
        borderWidth: 0,
        strokeOpacity: 0,
        padding: lively.rect(0,0,0,0),
        accessibleInInactiveWindow: true
    },
    connections: ['HelpText', 'fire'],
},
'initializing', {
    initialize: function($super, bnds, inset, labelString, labelOffset/*deprecated*/) {
        $super(bnds, labelString)
        this.label.setPadding(lively.rect(0,0,0,0));
        this.label.setExtent(this.getExtent());
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
    initialize: function($super, headline, windowWidth, windowMorph) {
        var bounds = new Rectangle(0, 0, windowWidth, this.barHeight);
        $super(bounds);

        this.windowMorph = windowMorph;
        this.buttons = [];

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

        this.disableDropping();
        this.setAppearanceStylingMode(true);
        this.setBorderStylingMode(true);
    },
    createNewButton: function(label, optLabelOffset, optWidth) {
        var length = this.barHeight - 5,
            extent = lively.pt(optWidth || length, length);
        var button = this.addMorph(
                new lively.morphic.WindowControl(
                        lively.rect(lively.pt(0, 0), extent),
                        this.controlSpacing,
                        label,
                        optLabelOffset || pt(0,0)));
        return button;
    },
    addNewButton: function(label, optLabelOffset, optWidth) {
        var pos = this.buttons.size();
        return this.addNewButtonAt(pos, label, optLabelOffset, optWidth);
    },
    addNewButtonAt: function(pos, label, optLabelOffset, optWidth) {
        var button = this.createNewButton(label, optLabelOffset, optWidth);
        this.buttons.pushAt(button, pos);
        this.adjustElementPositions();
        return button;
    },
},
'label', {
    setTitle: function(string) {
        this.label.replaceTextString(string);
    },

    getTitle: function(string) { return this.label.textString }
},
'layouting', {
    adjustElementPositions: function() {
        var innerBounds = this.innerBounds(),
            sp = this.controlSpacing;

        var buttonLocation = this.innerBounds().topRight().subXY(sp, -sp);

        this.buttons.forEach(function(ea) {
            buttonLocation = buttonLocation.subXY(ea.shape.getBounds().width, 0);
            ea.setPosition(buttonLocation);
            buttonLocation = buttonLocation.subXY(sp, 0)
        });

        if (this.label) {
            var start = this.innerBounds().topLeft().addXY(sp, sp),
                end = lively.pt(buttonLocation.x,
                        innerBounds.bottomRight().y).subXY(sp, sp);
            this.label.setBounds(rect(start, end));
        }
    },
    adjustForNewBounds: function() {
        this.adjustElementPositions();
    },
    lookCollapsedOrNot: function(collapsed) {
        this.applyStyle({borderRadius: collapsed ? "8px 8px 8px 8px" : "8px 8px 0px 0px"});
    }

},
'event handling', {
    onMouseDown: function (evt) {
        //Functions.False,
        // TODO: refactor to evt.hand.clickedOnMorph when everything else is ready for it
        evt.hand.clickedOnMorph = this.windowMorph;
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
    spacing: 3, // window border
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
    isCollapsed: function() { return this.state === 'collapsed'; },
    doNotSerialize: ['highlighted', 'cameForward']
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
        var titleBar = new lively.morphic.TitleBar(titleString, width, this);
        if (optSuppressControls) return titleBar;

        this.closeButton = titleBar.addNewButton("X", pt(0,-1));
        this.closeButton.addStyleClassName('close');
        this.collapseButton = titleBar.addNewButton("–", pt(0,1));
        this.menuButton = titleBar.addNewButton("Menu", null, 40);

        connect(this.closeButton, 'fire', this, 'initiateShutdown');
        connect(this.menuButton, 'fire', this, 'showTargetMorphMenu');
        connect(this.collapseButton, 'fire', this, 'toggleCollapse');

        return titleBar;
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
        var shutdownCallback = function() {
            this.signalShutdown;
            var owner = this.owner;
            this.remove(); // this will be removed from the owner and it will loose its owner
            if (owner.activateTopMostWindow) owner.activateTopMostWindow();
        }.bind(this);

        if (this.targetMorph && this.targetMorph.ifOkToShutdownDo) {
            this.targetMorph.ifOkToShutdownDo(shutdownCallback);
        } else {
            shutdownCallback();
        }
    },
    signalShutdown: function() {
        if (this.onShutdown) this.onShutdown();
        if (this.targetMorph && this.targetMorph.onShutdown) this.targetMorph.onShutdown();
    }


},
'accessing', {
    setTitle: function(string) { this.titleBar.setTitle(string) },
    getTitle: function() { return this.titleBar.getTitle() },
    setExtent: function($super, newExtent) {
        $super(newExtent);
        this.alignAllHandles();
    },


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
        var handles = [this.reframeHandle, this.bottomReframeHandle, this.rightReframeHandle];
        handles.forEach(function (each) {
            if (each && each.owner) {
                each.alignWithWindow();
            }
        })
    }

},
'menu', {
    showTargetMorphMenu: function() {

        var target = this.targetMorph || this, itemFilter;

        if (this.targetMorph) {
            var self = this;
            itemFilter = function (items) {

                var publishItem = items.detect(function(item) { return item[0] === "Publish"; });
                if (publishItem) publishItem[1] = function (evt) { self.copyToPartsBinWithUserRequest(); }

                var toRemove = items.detect(function(ea) { return ea[0].match(/select all submorphs/i); });
                items.removeAt(items.indexOf(toRemove));

                items.splice(1, 0, ['Set window title', function(evt) {
                    self.world().prompt('Set window title', function(input) {
                        if (input !== null) self.titleBar.setTitle(input || '');
                    }, self.titleBar.getTitle());
                }]);

                items.splice(2, 0, ['Resize...', ["reset","fullscreen","left","center","right","top","bottom"].map(function(how) {
                    return [how, function() { lively.ide.commands.exec('lively.ide.resizeWindow', how, self)}];
                })]);

                var browser = self.targetMorph.ownerWidget;
                if (browser && browser.morphMenuItems) {
                    items.pushAll(browser.morphMenuItems());
                }
                return items;
            }
        }

        var menu = target.createMorphMenu(itemFilter),
            menuBtnTopLeft = this.menuButton.bounds().topLeft(),
            menuTopLeft = menuBtnTopLeft.subPt(pt(menu.bounds().width, 0));

        menu.openIn(
            lively.morphic.World.current(),
            this.getGlobalTransform().transformPoint(menuTopLeft),
            false);

    },
    morphMenuItems: function($super) {
        var self = this, world = this.world(), items = $super();
        items.push(['Resize...', ["reset","full","left","center","right","top","bottom"].map(function(how) {
            return [how, function() { lively.ide.commands.exec('lively.ide.resizeWindow', how)}];
        })]);
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

        var inner = this.targetMorph, callGetsFocus = inner && !!inner.onWindowGetsFocus;
        if (this.isActive()) { callGetsFocus && inner.onWindowGetsFocus(this); return this; }

        // step 2: make me the frontmost morph of the world
        var scrolledMorphs = [], scrolls = [];
        this.withAllSubmorphsDo(function(ea) {
            var scroll = ea.getScroll();
            if (!scroll[0] && !scroll[1]) return this;
            scrolledMorphs.push(ea); scrolls.push(scroll);
        });
        this.owner.addMorphFront(this); // come forward
        this.alignAllHandles();
        (function() {
            scrolledMorphs.forEach(function(ea, i) { ea.setScroll(scrolls[i][0], scrolls[i][1]) });
            if (callGetsFocus) { inner.onWindowGetsFocus(this); }
        }).bind(this).delay(0);
        return this;
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
    computeOptimalCollapsedExtent: function(prevCollapsedExtent) {
        var win = this;
        // cut off the label if it's bigger than that
        var maxLabelExtent = lively.pt(350,20);
        // padding around the window contents
        var border = win.contentOffset.x
        // how big is the label really? Compute its upper right point
        var labelExtent = win.titleBar.label.computeRealTextBounds().extent();
        var labelExtentMin = labelExtent.minPt(maxLabelExtent);
        var labelBounds = labelExtentMin.extentAsRectangle();
        var labelTopRight = labelExtentMin.withY(border);
        // compute the unified bounds of the titlebar buttons and "put" it right
        // next to the label. This plus some spacing is the boudns we really
        // need to display the titlebar
        var buttonBounds = win.titleBar.buttons.invoke('bounds')
        var leftMostButtonPosX = buttonBounds.pluck('x').min();
        var buttonOffset = pt(leftMostButtonPosX,0);
        var offset = buttonOffset.negated().addPt(labelTopRight);
        var buttonBoundsShiftedLeft = buttonBounds.reduce(function(akk, ea) {
            return akk.union(ea.translatedBy(offset)); }, rect(0,0,0,0));
        return buttonBoundsShiftedLeft.extent().addXY(20,0);
    },
    toggleCollapse: function() {
        return this.isCollapsed() ? this.expand() : this.collapse();
    },
    collapse: function() {
        if (this.isCollapsed()) return;
        this.targetMorph.onWindowCollapse && this.targetMorph.onWindowCollapse();
        this.expandedTransform = this.getTransform();
        this.expandedExtent = this.getExtent();
        this.expandedPosition = this.getPosition();
        this.targetMorph.remove();
        this.helperMorphs = this.submorphs.withoutAll([this.targetMorph, this.titleBar]);
        this.helperMorphs.invoke('remove');
        this.collapsedExtent = this.computeOptimalCollapsedExtent(this.collapsedExtent);
        if (this.titleBar.lookCollapsedOrNot) this.titleBar.lookCollapsedOrNot(true);
        var self = this;
        function finCollapse() {
            self.state = 'collapsed';  // Set it now so setExtent works right
            if (self.collapsedTransform) self.setTransform(self.collapsedTransform);
            if (self.collapsedExtent) self.setExtent(self.collapsedExtent);
            if (self.collapsedPosition) self.setPosition(self.collapsedPosition);
            self.shape.setBounds(self.titleBar.bounds());
        }
        this.withCSSTransitionForAllSubmorphsDo(finCollapse, 250, function() {});
    },

    expand: function() {
        if (!this.isCollapsed()) return;
        this.collapsedTransform = this.getTransform();
        this.collapsedExtent = this.innerBounds().extent();
        this.collapsedPosition = this.getPosition();
        if (this.titleBar.lookCollapsedOrNot) this.titleBar.lookCollapsedOrNot(false);
        var self = this;
        function finExpand() {
            self.state = 'expanded';
            if (self.expandedTransform) self.setTransform(self.expandedTransform);
            if (self.expandedExtent) self.setExtent(self.expandedExtent);
            if (self.expandedPosition) self.setPosition(self.expandedPosition);
            self.helperMorphs.forEach(function(ea) { self.addMorph(ea); });
            self.addMorph(self.targetMorph);
        }
        this.withCSSTransitionForAllSubmorphsDo(finExpand, 250, function() {
            self.comeForward();
            self.targetMorph.onWindowExpand && self.targetMorph.onWindowExpand();
        });
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
        var style = {};
        if (this.type === 'right' || this.type === 'corner') { style.moveHorizontal = true; }
        if (this.type === 'bottom' || this.type === 'corner') { style.moveVertical = true; }
        this.applyStyle(style);
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
    getInitialViewExtent: function(hint) {
        return hint || this.initialViewExtent;
    }
},
'opening', {
    openIn: function(world, pos) {
        var view = this.buildView(this.getInitialViewExtent());
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

    initialViewExtent: lively.pt(300, 90),

    inset: 4

},
'initializing', {

    initialize: function(message, callback) {
        this.result = null;
        this.message = message || '?';
        if (callback) this.setCallback(callback);
        this.buttons = ['Ok', 'Cancel'];
    },

    openIn: function($super, owner, pos, focusedMorph) {
        this.lastFocusedMorph = focusedMorph || lively.morphic.Morph.focusedMorph();
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
        this.panel.addScript(function focus() {
            if (this.focusTarget) this.focusTarget.focus();
            else $super();
        });
    },

    buildLabel: function() {
        var bounds = new lively.Rectangle(
            this.inset, this.inset, this.panel.getExtent().x - 2*this.inset, 18);
        this.label = new lively.morphic.Text(bounds, this.message).beLabel({
            fill: Color.white,
            fixedHeight: false, fixedWidth: false,
            padding: Rectangle.inset(0,0),
            enableGrabbing: false, enableDragging: false});
        this.panel.addMorph(this.label);

        // FIXME ugly hack for wide dialogs:
        // wait until dialog opens and text is rendered so that we can
        // determine its extent
        this.label.fit();
        (function fit() {
        this.label.cachedBounds=null
            var labelBoundsFit = this.label.bounds(),
                origPanelExtent = this.panel.getExtent(),
                panelExtent = origPanelExtent;
            if (labelBoundsFit.width > panelExtent.x) {
                panelExtent = panelExtent.withX(labelBoundsFit.width + 2*this.inset);
            }
            if (labelBoundsFit.height > bounds.height) {
                var morphsBelowLabel = this.panel.submorphs.without(this.label).select(function(ea) {
                        return ea.bounds().top() <= labelBoundsFit.bottom(); }),
                    diff = labelBoundsFit.height - bounds.height;
                morphsBelowLabel.invoke('moveBy', panelExtent.subPt(origPanelExtent));
                panelExtent = panelExtent.addXY(0, diff);
            }
            this.panel.setExtent(panelExtent);
            this.panel.moveBy(panelExtent.subPt(origPanelExtent).scaleBy(0.5).negated());
        }).bind(this).delay(0);
    },

    buildButton: function(title, place, total) {
        place = Object.isNumber(place) ? place : 0;
        var mult = (this.buttons.length) - place - 1,
            bounds = new Rectangle(0,0, 75, 30),
            btn = new lively.morphic.Button(bounds, title),
            btnWidth = btn.bounds().width + this.inset;
        btn.align(btn.bounds().bottomRight().addXY(this.inset, this.inset), this.panel.innerBounds().bottomRight().subXY(btnWidth * mult, 0));
        btn.applyStyle({
            moveHorizontal: true,
            moveVertical: true
        });
        lively.bindings.connect(btn, 'fire', this, 'removeTopLevel');
        return this.panel.addMorph(btn);
    },

    buildView: function(extent) {
        this.buildPanel(extent.extentAsRectangle());
        this.buildLabel();
        this.buttons.each(function(title, idx) {
            var btn = this.buildButton(title, idx);
            btn.idx = idx;
            if (title == 'Ok')
                this.okButton = btn;
            else if (title == 'Cancel')
                this.cancelButton = btn;
            else
                lively.bindings.connect(btn, 'fire', this, 'result', {
                    converter: function() { return source.idx; }});
        }, this);
        return this.panel;
    }

},
'view', {
    focus: function() { this.panel.focus(); }
},
'callbacks', {
    setCallback: function(func) {
        var self = this;
        // ensure invocation only once
        this.callbackCount = 0;
        this.callback = function() {
            self.callbackCount++;
            func.apply(null, arguments);
        };
        lively.bindings.connect(this, 'result', this, 'triggerCallback');
    },
    triggerCallback: function(resultBool) {
        var nextFocus = this.lastFocusedMorph,
            modal = this.panel.ownerChain().detect(function(ea) { return ea.isModalMorph; }),
            modalOwner = modal && modal.owner;
        this.removeTopLevel();
        if (this.callback && this.callbackCount === 0) this.callback(resultBool);
        // when multiple dialogs are chained: test whether there is a new modal
        // morph after this dialog was closed. If so, remember the original morph
        // that was focused (this.lastFocusedMorph), focus the new dialog and pass
        // the lastFocusedMorph along. Otherwise just focus on lastFocusedMorph.
        var modalTarget = modalOwner && modalOwner.modalMorph && modalOwner.modalMorph.modalTarget;
        if (modalTarget && modalTarget != this.panel) {
            if (modalTarget.ownerApp) modalTarget.ownerApp.lastFocusedMorph = this.lastFocusedMorph;
            nextFocus = modalTarget;
        }
        if (nextFocus) nextFocus.focus.bind(nextFocus).delay(0);
    }
});

lively.morphic.AbstractDialog.subclass('lively.morphic.ConfirmDialog',
'properties', {

    initialViewExtent: lively.pt(260, 70),

},
'initializing', {

    initialize: function($super, message, callback, buttons) {
        $super(message, callback);
        if (Object.isArray(buttons))
            this.buttons = buttons;
    },

    buildView: function($super, extent) {
        var panel = $super(extent);

        if (this.cancelButton)
            lively.bindings.connect(this.cancelButton, 'fire', this, 'result', {
                converter: function() { return false; }});
        if (this.okButton)
            lively.bindings.connect(this.okButton, 'fire', this, 'result', {
                converter: function() { return true; }});

        lively.bindings.connect(panel, 'onEscPressed', this, 'result', {
            converter: function(evt) { Global.event && Global.event.stop(); return false; }});
        lively.bindings.connect(panel, 'onEnterPressed', this, 'result', {
            converter: function(evt) { Global.event && Global.event.stop(); return true; }});
        return panel;
    }

});

lively.morphic.AbstractDialog.subclass('lively.morphic.InformDialog',
'properties', {

    initialViewExtent: lively.pt(260, 70),

},
'initializing', {

    initialize: function($super, message, callback) {
        $super(message, callback);
        this.buttons = ['Ok'];
    },

    buildView: function($super, extent) {
        var panel = $super(extent);
        lively.bindings.connect(this.okButton, 'fire', this, 'result', {
            converter: function() { return true; }});
        lively.bindings.connect(panel, 'onEscPressed', this, 'result', {
            converter: function(evt) { Global.event && Global.event.stop(); return false; }});
        lively.bindings.connect(panel, 'onEnterPressed', this, 'result', {
            converter: function(evt) { Global.event && Global.event.stop(); return true; }});
        return panel;
    }

});

lively.morphic.AbstractDialog.subclass('lively.morphic.PromptDialog',
// new lively.morphic.PromptDialog('Test', function(input) { alert(input) }).open()
'properties', {

    initialViewExtent: lively.pt(580, 90),

},
'initializing', {

    initialize: function($super, label, callback, defaultInputOrOptions) {
        $super(label, callback);
        var options;
        switch (typeof defaultInputOrOptions) {
            case 'object': options = defaultInputOrOptions; break;
            case 'undefined': options = {input: ''}; break;
            default: options = {input: defaultInputOrOptions ? String(defaultInputOrOptions) : ''}
        }
        this.options = options;
    },

    buildTextInput: function(bounds) {
        var self = this;
        lively.require('lively.ide.tools.CommandLine').toRun(function() {
            var opt = self.options || {},
                histId = opt.historyId,
                input = lively.ide.tools.CommandLine.get(histId);
            input.setBounds(self.label.bounds().insetByPt(pt(self.label.getPosition().x * 2, 0)));
            input.align(input.getPosition(), self.label.bounds().bottomLeft().addPt(pt(0,5)));
            lively.bindings.connect(input, 'savedTextString', self, 'result');
            lively.bindings.connect(input, 'onEscPressed', self, 'result', {converter: function() { return null } });
            lively.bindings.connect(self.panel, 'onEscPressed', self, 'result', {converter: function() { return null}});
            input.applyStyle({resizeWidth: true, moveVertical: true});
            self.inputText = self.panel.focusTarget = self.panel.addMorph(input);
            input.textString = opt.input || '';
        });
    },

    buildView: function($super, extent) {
        var panel = $super(extent);
        this.buildTextInput();

        lively.bindings.connect(this.cancelButton, 'fire', this, 'result', {
            converter: function() { return null; }});
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
        this.inputText.focus();
        this.inputText.selectAll.bind(this.inputText).delay(0);
        return view;
    },
});

lively.morphic.AbstractDialog.subclass('lively.morphic.PasswordPromptDialog',
// new lively.morphic.PromptDialog('Test', function(input) { alert(input) }).open()
'initializing', {
    initialize: function($super, label, callback, defaultInput) {
        $super(label, callback, defaultInput);
        this.defaultInput = defaultInput;
    },
    buildPasswordInput: function(bounds) {
        var input = new lively.morphic.PasswordInput();
        input.setBounds(this.label.bounds().insetByPt(pt(this.label.getPosition().x * 2, 0)));
        input.align(input.getPosition(), this.label.bounds().bottomLeft().addPt(pt(0,5)));
        lively.bindings.connect(input, 'savedValue', this, 'result');
        lively.bindings.connect(input, 'onEscPressed', this, 'result', {converter: function() { return null } });
        lively.bindings.connect(this.panel, 'onEscPressed', this, 'result', {converter: function() { return null}});
        input.applyStyle({resizeWidth: true, moveVertical: true});
        this.inputText = this.panel.focusTarget = this.panel.addMorph(input);
    },

    buildView: function($super, extent) {
        var panel = $super(extent);
        this.buildPasswordInput();

        lively.bindings.connect(this.cancelButton, 'fire', this, 'result', {
            converter: function() { return null; }});
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
        this.inputText.focus();
        return view;
    }
});

lively.morphic.AbstractDialog.subclass('lively.morphic.EditDialog',
// new lively.morphic.PromptDialog('Test', function(input) { alert(input) }).open()
'initializing', {
    initialize: function($super, label, callback, defaultInputOrOptions) {
        this.options = Object.isObject(defaultInputOrOptions) ? defaultInputOrOptions : {};
        var defaultInput = (Object.isString(defaultInputOrOptions) && defaultInputOrOptions)
                        || this.options.input || null;
        $super(label, callback, defaultInput);
        this.defaultInput = defaultInput;
    },
    buildTextInput: function() {
        var bounds = rect(this.label.bounds().bottomLeft(), this.cancelButton.bounds().topRight()).insetBy(5),
            input = lively.ide.newCodeEditor(bounds, this.defaultInput || '').applyStyle({
                    resizeWidth: true, moveVertical: true,
                    gutter: false, lineWrapping: true,
                    borderWidth: 1, borderColor: Color.gray.lighter(),
                    textMode: this.options.textMode || 'text'
                });
        input.evalEnabled = false;
        input.setBounds(bounds);
        this.inputText = this.panel.focusTarget = this.panel.addMorph(input);
        input.focus.bind(input).delay(0);
        lively.bindings.connect(input, 'savedTextString', this, 'result');
        var histId = this.options.historyId;
        if (!histId) return;
        lively.bindings.connect(this, 'result', this, 'saveHistory');
        var hists = lively.morphic.EditDialog.histories || (lively.morphic.EditDialog.histories = {});
        var hist = hists[histId] || (hists[histId] = {items: [], max: 30, index: 0});
        input.commandHistory = hist;
        input.addScript(function onKeyDown(evt) {
            switch (evt.getKeyString()) {
                case 'Alt-H': this.browseHistory(); evt.stop(); return true;
                default: return $super(evt);
            }
        });
        input.addScript(function browseHistory() {
            var items = this.commandHistory.items.map(function(ea) {
                return {isListItem: true, value:ea, string: ea.replace(/\n/g, ' ').truncate(50)}
            }).reverse();;
            lively.ide.tools.SelectionNarrowing.chooseOne(items, function(err, string) {
                Object.isString(string) && (this.textString = string);
                this.focus.bind(this).delay(0);
            }.bind(this));
        });
    },

    buildView: function($super, extent) {
        var panel = $super(pt(400,200));
        this.buildTextInput();
        lively.bindings.connect(this.cancelButton, 'fire', this, 'result', {
            converter: function() { return null; }});
        lively.bindings.connect(this.okButton, 'fire', this.inputText, 'doSave');
        ['inputText', 'okButton', 'cancelButton'].forEach(function(prop) {
            this.panel[prop] = this[prop];
        }, this);
        this.panel.addScript(function onKeyDown(evt) {
            var keys = evt.getKeyString();
            if (keys === 'Command-Enter' || keys === 'Control-Enter') {
                this.inputText.doSave();
                evt.stop(); return true;
            }
            if (keys === 'Esc') {
                this.cancelButton.simulateButtonClick()
                evt.stop(); return true;
            }
            if (keys === 'Tab') {
                var focusOrder = [this.inputText, this.okButton, this.cancelButton]
                var focused = lively.morphic.Morph.focusedMorph();
                var idx = (focusOrder.indexOf(focused) + 1) % 3;
                focusOrder[idx].focus();
                focusOrder[idx].show();
                evt.stop(); return true;
            }
            return false;
        });
        return panel;
    }
},
"history", {
    saveHistory: function(string) {
        if (!string) return;
        var histId = this.options.historyId;
        if (!histId) return;
        var hists = lively.morphic.EditDialog.histories;
        if (!hists) return;
        var hist = hists[histId];
        if (!hist || !hist.items || hist.items.last() === string) return;
        hist.items.push(string);
    }
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
        var view = this.buildView(this.getInitialViewExtent()),
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
    isSelection: true
},
'initializing', {

    initialize: function($super, initialBounds) {
        this.selectedMorphs = [];
        this.selectionIndicators = [];
        $super(initialBounds);
        this.applyStyle(this.style);
        this.setBorderStylingMode(true);
        this.setAppearanceStylingMode(true);
    }

},
'propagation', {

    withoutPropagationDo: function(func) {
        this.propagate = false;
        try { func.call(this); } finally { this.propagate = true; }
    },

    isPropagating: function() { return !!this.propagate; },
},
'menu', {
    morphMenuItems: function($super) {
        var items = $super();
        if (this.selectedMorphs.length === 1) {
            var self = this;
            items.push(["open ObjectEditor for selection", function() {
                $world.openObjectEditorFor(self.selectedMorphs[0]);
            }]);
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
        var selOwner = this.owner, copied;
        try { copied = this.addSelectionWhile($super); } finally { this.isEpiMorph = true }
        this.reset();
        this.selectMorphs(copied.selectedMorphs.clone());
        copied.reset();
        return this;
    },
},
'selection handling', {

    addSelectionWhile: function(func) {
        // certain operations require selected morphs to be added to selection frame
        // e.g. for transformations or copying
        // use this method to add them for certain operations
        var world = this.world();
        if (!world || !this.isPropagating()) return func();

        var owners = [];
        for (var i = 0; i < this.selectedMorphs.length; i++) {
            owners[i] = this.selectedMorphs[i].owner;
            this.addMorph(this.selectedMorphs[i]);
        }
        try { return func() } finally {
            for (var i = 0; i < this.selectedMorphs.length; i++)
                owners[i].addMorph(this.selectedMorphs[i]);
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
        if (this.myWorld == null) {
            this.myWorld = this.world();
        }
        lively.Class.getSuperPrototype(this).remove.call(this);
    }
},
'accessing', {

    world: function($super) {
        return $super() || this.owner || this.myWorld
    }

},
'isolating effects', {

    adaptBorders: function($super) {
        return this.withoutPropagationDo($super);
    },

    adjustOrigin: function($super, origin) {
        this.withoutPropagationDo(function() { return $super(origin); });
    }

},
'propagating effects -- morphic', {

    setBorderWidth: function($super, width) {
        if (!this.selectedMorphs  || !this.isPropagating()) $super(width);
        else this.applyStyle({fillOpacity: width});
    },

    setFill: function($super, color) {
        if (!this.selectedMorphs || !this.isPropagating())
            $super(color);
        else this.applyStyle({fill: color});
    },

    setBorderColor: function($super, color) {
        if (!this.selectedMorphs || !this.isPropagating())  $super(color);
        else this.applyStyle({borderColor: color});
    },

    shapeRoundEdgesBy: function($super, r) {
        if (!this.selectedMorphs  || !this.isPropagating()) $super(r);
        else this.selectedMorphs.forEach(
            function(m) { if (m.shape.roundEdgesBy) m.shapeRoundEdgesBy(r); });
    },

    setFillOpacity: function($super, op) {
        if (!this.selectedMorphs  || !this.isPropagating()) $super(op);
        else this.applyStyle({fillOpacity: op});
    },

    setStrokeOpacity: function($super, op) {
        if (!this.selectedMorphs  || !this.isPropagating()) $super(op);
        else this.applyStyle({strokeOpacity: op});
    },

    applyStyle: function($super, style) {
        if (!this.selectedMorphs  || !this.isPropagating()) $super(style);
        else this.selectedMorphs.invoke('applyStyle', style);
    }

},
'propagating effects -- text', {

    setFixedWidth:         function($super, val) { this.applyStyle({fixedWidth: val}); },
    setFixedHeight:        function($super, val) { this.applyStyle({fixedHeight: val}); },
    setFontFamily:         function($super, val) { this.applyStyle({fontFamily: val}); },
    setFontSize:           function($super, val) { this.applyStyle({fontSize: val}); },
    setTextColor:          function($super, val) { this.applyStyle({textColor: val}); },
    setFontWeight:         function($super, val) { this.applyStyle({fontWeight: val}); },
    setFontStyle:          function($super, val) { this.applyStyle({fontStyle: val}); },
    setTextDecoration:     function($super, val) { this.applyStyle({textDecoration: val}); },
    setPadding:            function($super, val) { this.applyStyle({padding: val}); },
    setAlign:              function($super, val) { this.applyStyle({align: val}); },
    setVerticalAlign:      function($super, val) { this.applyStyle({verticalAlign: val}); },
    setLineHeight:         function($super, val) { this.applyStyle({lineHeight: val}); },
    setDisplay:            function($super, val) { this.applyStyle({display: val}); },
    setWhiteSpaceHandling: function($super, val) { this.applyStyle({whiteSpaceHandling: val}); },
    setWordBreak:          function($super, val) { this.applyStyle({wordBreak: val}); },
    setTextStylingMode:    function($super, val) { this.applyStyle({cssStylingMode: val}); }

},
'transformation', {

    setRotation: function($super, theta) {
        this.addSelectionWhile($super.curry(theta));
    },

    setScale: function($super, scale) {
        this.addSelectionWhile($super.curry(scale));
    }

},
'aligning', {

    alignVertically: function() {
        // Align all morphs to same left x as the top one.
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
        var morphs = this.selectedMorphs.clone().sort(function(m,n) { return m.bounds().top() - n.bounds().top(); });
        // Align all morphs to same left x as the top one.
        var minX = morphs[0].bounds().left();
        var minY = morphs[0].bounds().top();
        // Compute maxY and sumOfHeights
        var sumOfHeights = 0;
        var maxY = morphs.reduce(function(maxY, m) {
            var ht = m.innerBounds().height;
            sumOfHeights += ht;
            return Math.max(maxY, m.bounds().bottom());
        }, minY);
        // Now spread them out to fit old top and bottom with even spacing between
        var separation = Math.max(0, (maxY - minY - sumOfHeights)/Math.max(this.selectedMorphs.length - 1, 1));
        var y = minY;
        morphs.forEach(function(m) {
            m.setPosition(pt(m.getPosition().x, y));
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
        var sumOfWidths = 0;
        var maxX = morphs.reduce(function(maxX, m) {
            var wid = m.innerBounds().width;
            sumOfWidths += wid;
            return Math.max(maxX, m.getPosition().x + wid);
        }, minX); // Now spread them out to fit old top and bottom with even spacing between
        var separation = Math.max(0, (maxX - minX - sumOfWidths)/Math.max(this.selectedMorphs.length - 1, 1));
        var x = minX;
        morphs.forEach(function(m) {
            m.setPosition(pt(x, m.getPosition().y));
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
            hand.addMorph(this);
            for (var i = 0; i < this.selectedMorphs.length; i++) {
                hand.addMorph(this.selectedMorphs[i]);
            }
        })
    },

    dropOn: function(morph) {
        this.withoutPropagationDo(function() {
            morph.world().addMorph(this);
            for (var i = 0; i < this.selectedMorphs.length; i++) {
                morph.addMorph(this.selectedMorphs[i]);
            }
            this.fitSelectionIndicators();
            this.owner.addMorphFront(this);
        });
    }

},
'geometry', {

    moveBy: function($super, delta) {
        if (this.isPropagating() && this.selectedMorphs.length) {
            this.withoutPropagationDo(function() {
                this.selectedMorphs.invoke('moveBy', delta);
            });
            this.fitSelectionIndicators();
        } else $super(delta);
    },

    setPosition: function($super, pos) {
        if (this.isPropagating() && this.selectedMorphs.length) {
            var delta = pos.subPt(this.getPosition());
            this.moveBy(delta)
        } else $super(pos);
        return pos;
    },

    setExtent: function($super, ext) {
        if (this.isPropagating() && this.selectedMorphs.length) {
            this.selectedMorphs.invoke('resizeBy', ext.subPt(this.getExtent()));
            this.fitSelectionIndicators();
        } else $super(ext);
        return ext;
    }

},
'world', {
    reset: function() {
        this.selectedMorphs = [];
        this.setRotation(0);
        this.setScale(1);
        this.removeSelectionIndicators();
        this.adjustOrigin(pt(0,0));
        this.setExtent(pt(0,0));
        this.submorphs.invoke('remove');
    },

    selectMorphs: function(selectedMorphs) {
        if (!this.owner) lively.morphic.World.current().addMorph(this);
        this.selectedMorphs = selectedMorphs;
        // add selection indicators for all selected morphs
        this.removeSelectionIndicators();
        selectedMorphs.forEach(function(ea) {
            var selectionIndicator = lively.morphic.Morph.makeRectangle(0,0,10,10);
            this.withoutPropagationDo(function() {
                selectionIndicator.name = 'Selection of ' + ea;
                selectionIndicator.isEpiMorph = true;
                selectionIndicator.isSelectionIndicator = true;
                selectionIndicator.setBorderStylingMode(true);
                selectionIndicator.setAppearanceStylingMode(true);
                selectionIndicator.addStyleClassName('selection-indicator');
                ea.addMorph(selectionIndicator);
            });
            this.selectionIndicators.push(selectionIndicator);
        }, this);

        this.fitSelectionIndicators();
    },

    fitSelectionIndicators: function() {
        // resize selection morphs so that it fits selection indicators
        if (!this.selectionIndicators.length) return;
        this.withoutPropagationDo(function() {
            this.selectionIndicators.forEach(function(ea) {
                if (!ea.owner) return;
                var bounds = ea.owner.innerBounds();
                // var bounds = ea.owner.getTransform().inverse().transformRectToRect(ea.owner.bounds());
                ea.setBounds(bounds.insetBy(-4));
            });
            var bnds = this.selectionIndicators.invoke('globalBounds'),
                selBounds = bnds.reduce(function(bounds, selIndicatorBounds) {
                    return bounds.union(selIndicatorBounds); });
             this.setBounds(selBounds);
        });
    },

    removeSelectionIndicators: function() {
        if (this.selectionIndicators)
            this.selectionIndicators.invoke('remove');
        this.selectionIndicators.clear();
    },

    makeGroup: function() {
        if (!this.selectedMorphs) return;
        var group = new lively.morphic.Box(this.bounds());
        group.isGroup = true;
        this.owner.addMorph(group);
        this.selectedMorphs.forEach(function(ea) {
            group.addMorph(ea);
        });
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
    }

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
    setSelectedMorphs: function(morphs) {
        if (!morphs || morphs.length === 0) { this.resetSelection(); return; }
        if (!this.selectionMorph) this.resetSelection();
        this.selectionMorph.selectMorphs(morphs);
        this.selectionMorph.showHalos();
        return morphs;
    },
    hasSelection: function() {
        return this.selectionMorph && !!this.selectionMorph.owner;
    },

    onDragStart: function(evt) {
        if (evt.isRightMouseButtonDown()) {
            return; // no selection with right mouse button (fbo 2011-09-13)
        }

        this.resetSelection()
        this.addMorphFront(this.selectionMorph);

        var pos = this.localize(evt.hand.eventStartPos || evt.getPosition());
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

        this.selectionMorph.setBounds(lively.rect(topLeft, bottomRight));
    },
    onDragEnd: function(evt) {
        var self = this;
        if (!self.selectionMorph) return;
        var selectionBounds = self.selectionMorph.bounds();
        var selectedMorphs  = this.submorphs
            .reject(function(ea){
                return ea === self || ea.isEpiMorph || ea instanceof lively.morphic.HandMorph;
            })
            .select(function(m) { return selectionBounds.containsRect(m.bounds()); })
            .reverse();

        this.selectionMorph.selectedMorphs = selectedMorphs;
        if (selectedMorphs.length == 0) {
            this.selectionMorph.removeOnlyIt();
            this.selectionMorph.reset();
            return
        }

        this.selectionMorph.selectMorphs(selectedMorphs);

        this.selectionMorph.showHalos()

    },

    resetSelection: function() {
        if (!this.selectionMorph || !this.selectionMorph.isSelection)
            this.selectionMorph = new lively.morphic.Selection(new lively.Rectangle(0,0,0,0))
        else this.selectionMorph.removeOnlyIt();
        this.selectionMorph.reset();
    }
})
.applyTo(lively.morphic.World, {override: ['onDrag', 'onDragStart', 'onDragEnd']});

module('lively.ide'); // so that the namespace is defined even if ide is not loaded

Object.extend(lively.ide, {
    openFile: function (url, whenDone) {
        lively.require('lively.ide.tools.TextEditor').toRun(function() {
            var editor = lively.BuildSpec('lively.ide.tools.TextEditor').createMorph();
            if (url) {
                if (String(url).match(/^(\/|.:\\)/)) {
                    // absolute local path
                } else if (!String(url).startsWith('http')) {
                    url = URL.root.withFilename(url).withRelativePartsResolved();
                }
                editor.openURL(url);
            }
            editor.openInWorld($world.positionForNewMorph(editor)).comeForward();
            typeof whenDone === 'function' && whenDone(editor);
        });
    },

    openFileAsEDITOR: function (file, whenEditDone) {
        lively.ide.openFile(file, function(editor) {
            editor.closeVetoed = false;
            editor.wasStored = false;

            lively.bindings.connect(editor, 'contentStored', whenEditDone, 'call', {
                updater: function($upd) {
                    var editor = this.sourceObj;
                    editor.wasStored = true;
                    editor.initiateShutdown();
                    $upd(null,null, "saved");
                }
            });

            editor.onOwnerChanged = function(owner) {
                if (this.wasStored) return;
                this.closeVetoed = !!owner;
                if (!this.wasStored && !this.closeVetoed) whenEditDone(null, 'aborted');
            };
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
        return this.scalingAbove.all(function(m) { return (m.getExtent().y + deltaY) >= this.minHeight; }, this)
            && this.scalingBelow.all(function(m) { return (m.getExtent().y - deltaY) >= this.minHeight; }, this);
    },

    addFixed: function(m) { if (!this.fixed.include(m)) this.fixed.push(m); },

    addScalingAbove: function(m) { this.scalingAbove.push(m); },

    addScalingBelow: function(m) { this.scalingBelow.push(m); }

});

lively.morphic.Box.subclass('lively.morphic.VerticalDivider',
'settings', {

    style: { fill: Color.gray, enableDragging: true },

},
'initializing', {

    initialize: function($super, bounds) {
        $super(bounds);
        this.fixed = [];
        this.scalingLeft = [];
        this.scalingRight = [];
        this.minWidth = 20;
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
            deltaX = p2.x - p1.x;
        this.oldPoint = p2;
        this.movedHorizontallyBy(deltaX);
        return true;
    },

    correctForDragOffset: Functions.False

},
'internal slider logic', {

    divideRelativeToParent: function(ratio) {
        // 0 <= ratio <= 1. Set divider so that it divides its owner by ration.
        // |-------|          |-------|           |<=====>|
        // |   ^   |          |       ^           ^       |
        // |   |   |          |       |           |       |
        // |   |   |  = 0.5   |       |  = 1      |       |  = 0
        // |   |   |          |       |           |       |
        // |   v   |          |       v           v       |
        // |-------|          |-------|           |-------|
        if (!this.owner || !Object.isNumber(ratio) || ratio < 0 || ratio > 1) return;
        var ownerWidth = this.owner.getExtent().x - this.getExtent().x;
        if (ownerWidth < 0) return;
        var currentRatio = this.getRelativeDivide(),
            deltaRation = ratio - currentRatio,
            deltaX = ownerWidth * deltaRation;
        this.movedHorizontallyBy(deltaX);
    },

    getRelativeDivide: function(ratio) {
        var bounds = this.bounds(),
            myLeft = bounds.left(),
            myWidth = bounds.width,
            ownerWidth = this.owner.getExtent().x - myWidth;
        if (ownerWidth < 0) return NaN;
        return myLeft / ownerWidth;
    },

    movedHorizontallyBy: function(deltaX) {
        if (!this.resizeIsSave(deltaX)) return;

        var morphsForPosChange = this.fixed.concat(this.scalingRight);
        morphsForPosChange.forEach(function(m) {
            var pos = m.getPosition();
            m.setPosition(pt(pos.x + deltaX, pos.y));
        });
        this.scalingLeft.forEach(function(m) {
            var ext = m.getExtent();
            m.setExtent(pt(ext.x + deltaX, ext.y));
        });
        this.scalingRight.forEach(function(m) {
            var ext = m.getExtent();
            m.setExtent(pt(ext.x - deltaX, ext.y));
        });
        this.setPosition(this.getPosition().addPt(pt(deltaX, 0)));
    },

    resizeIsSave: function(deltaX) {
        return this.scalingLeft.all(function(m) { return (m.getExtent().x + deltaX) >= this.minWidth; }, this)
            && this.scalingRight.all(function(m) { return (m.getExtent().x - deltaX) >= this.minWidth; }, this);
    },

    addFixed: function(m) { if (!this.fixed.include(m)) this.fixed.push(m); },

    addScalingLeft: function(m) { this.scalingLeft.push(m); },

    addScalingRight: function(m) { this.scalingRight.push(m); }

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
        lively.bindings.connect(this, 'value', this, 'adjustSliderParts');
        this.setValue(0);
        this.setSliderExtent(0.1);
        this.valueScale = (scaleIfAny === undefined) ? 1.0 : scaleIfAny;
        this.sliderKnob = this.addMorph(
            new lively.morphic.SliderKnob(new lively.Rectangle(0, 0, this.mss, this.mss), this));
        this.adjustSliderParts();
        this.sliderKnob.setAppearanceStylingMode(true);
        this.sliderKnob.setBorderStylingMode(true);
        this.setAppearanceStylingMode(true);
        this.setBorderStylingMode(true);
    }
},
'accessing', {
    getValue: function() { return this.value },

    setValue: function(value) { return this.value = value },

    getScaledValue: function() {
        var v = (this.getValue() || 0); // FIXME remove 0
        if (Object.isNumber(this.min) && Object.isNumber(this.max)) {
            return (v-this.min)/(this.max-this.min);
        } else {
            return v / this.valueScale;
        }
    },

    setScaledValue: function(value) {
        if (Object.isNumber(this.min) && Object.isNumber(this.max)) {
            return this.setValue((this.max-this.min)*value + this.min);
        } else {
            return this.setValue(value * this.valueScale);
        }
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
        if (!this.innerBounds().containsPoint(handPos)) return false; // don't involve, eg, pins

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
                topLeft = pt(0, Math.round((bnds.height - elevPix)*val)),  // ael: round to prevent artifacts
                sliderExt = pt(bnds.width, elevPix);
        } else { // more horizontal...
            var elevPix = Math.max(ext*bnds.width, this.mss), // thickness of elevator in pixels
                topLeft = pt(Math.round((bnds.width - elevPix)*val), 0),  // ael: as above
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
'mouse events', {
    onDragStart: function($super, evt) {
        this.hitPoint = this.owner.localize(evt.getPosition());
        return true;
    },
    onDrag: function($super, evt) {
        // the hitpoint is the offset that make the slider move smooth
        if (!this.hitPoint) return; // we were not clicked on...

        var slider = this.owner;

        // Compute the value from a new mouse point, and emit it
        var delta = slider.localize(evt.getPosition()).subPt(this.hitPoint),
            p = this.bounds().topLeft().addPt(delta),
            bnds = slider.innerBounds(),
            ext = slider.getSliderExtent();

        if (slider.vertical()) {
            // thickness of elevator in pixels
            var elevPix = Math.max(ext*bnds.height,slider.mss),
                newValue = p.y / (bnds.height-elevPix);
        } else {
            // thickness of elevator in pixels
            var elevPix = Math.max(ext*bnds.width,slider.mss),
                newValue =  p.x / (bnds.width-elevPix);
        }

        if (isNaN(newValue)) newValue = 0;
        var prevVal = slider.getScaledValue(this);
        var newVal = slider.setScaledValue(slider.clipValue(newValue), this);
        if (+newVal != +prevVal) this.hitPoint = slider.localize(evt.getPosition());
    },
    onDragEnd: function($super, evt) { return $super(evt) },
    onMouseDown: function(evt) { return true; }

});

lively.morphic.Box.subclass('lively.morphic.Tree',
'properties', {
    isTree: true,
    outsideOf: function(bounds) {
        // we only consider something to be outside of the bounds, 
        // if it is more than 100 px BELOW the wrappers borders
        return !bounds.insetByPt(pt(0, -200)).intersects(this.globalBounds());
    },
},
'documentation', {
    example: function() {
        var tree = new lively.morphic.Tree();
        var image = new lively.morphic.Image.fromURL('http://emoji.fileformat.info/gemoji/warning.png');
        image.setExtent(pt(24,24));
        tree.openInHand();
        tree.setItem({
            name: "root",
            description: "root of all evil", 
            isEditable: true, 
            children: [
                {name: "item 1", children: [{name: "subitem", style: {color: Color.red}}]},
                {name: "item 2", description: "description", isEditable: true, submorphs: [image]}]
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
        if (item) 
        {
            this.setItem(item);
        }
        if(!this.parent) 
            this.initializeWrapping();
    },

    initializeWrapping: function() {
            // do some futher wrapping, to make the optional search bar work
            var wrapper = new lively.morphic.Box(this.getBounds());
            wrapper.setPosition(this.getPosition())
            wrapper.setClipMode('scroll');
            wrapper.setLayouter({type: 'vertical'});
            wrapper.layout.resizeHeight = true;
            wrapper.layout.resizeWidth = true;
            var snapper = new lively.morphic.Box(this.getBounds())
            snapper.setLayouter({type: 'vertical'});
            snapper.getLayouter().setSpacing(0);
            snapper.getLayouter().setBorderSize(0);
            snapper.layout.resizeHeight = true;
            snapper.layout.resizeWidth = true;
            snapper.layout.informSubmorphs = true;
            var container = this.owner;
            wrapper.addMorph(this);
            snapper.addMorph(wrapper);
            if(container) { 
                container.addMorph(snapper);
                snapper.setPosition(pt(0))
                snapper.setExtent(container.getExtent());
                container.setClipMode('hidden');
            }
            wrapper.setPosition(pt(0))
            this.setPosition(pt(0))
            this.snapper = snapper;
            this.wrapper = wrapper;
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
        // FIXME: Create an actual Layout that supports this ordering
        layouter.layoutOrder = function(m) {
            return this.container.submorphs.indexOf(m);
        }
        node.setLayouter(layouter);
        this.icon = node.addMorph(this.createIcon());
        this.label = node.addMorph(this.createLabel());
        if (this.item.isEditable)
            this.editButton = node.addMorph(this.createEditButton());
        if (this.item.isInspectable)
            this.inspectButton = node.addMorph(this.createInspectButton());
        if (this.item.submorphs)
            this.item.submorphs.forEach(function(submorph) {
                node.addMorph(submorph);
            });
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
            this.submorphs.without(this.searchBar).invoke("remove");
            this.childNodes = null;
        });
        
        if (!item.name) {
            if (item.children) this.expand();
        } else {
            this.initializeNode();
            this.updateChildren();
        }
    },

    getSelection: function() {
        var sel = this.getSelectedTree();
        return sel && sel.item;
    },
    getSelectedTree: function() {
        return this.withAllTreesDetect(function(tree) {
            return tree.item.isSelected; });
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
    updateView: function(scrollingBounds, updateFunction) {
        Functions.debounce(1000, update, false).bind(this)();
        function update() {
            if(this.childNodes) { 
                this.childNodes.filter(function(tree) { 
                    return !tree.outsideOf(scrollingBounds) 
                                }).map(function(tree) { 
                                   updateFunction(tree);
                                   tree.updateView(scrollingBounds, updateFunction);
                                });
            }
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
            var br = this.item.emphasizeName;
            if (br) {
                this.label.emphasizeRanges([[br[0],br[1], {fontWeight: 'bold', color: Color.tangerine}]])
            }
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
        //if (changed){ 
            this.label.fit();
            this.node.applyLayout();
        //}
    },
    updateChildrenDefault: function() {
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
        currentInterval = Math.max(currentInterval , pageSize);
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
    },
    updateChildren: function() {
        if(this.searchTerm) {
            this.searchFor(this.searchTerm);
            this.updateChildrenShallow();
        } else {
            this.updateChildrenDefault();
        }
    },
    updateChildrenShallow: function() {
        this.updateNode();
        this.childNodes && this.childNodes.invoke('updateChildrenShallow');
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
        var br = this.item.emphasizeName;
        if (br) {
            label.emphasizeRanges([[br[0],br[1], {fontWeight: 'bold', color: Color.tangerine}]])
        }
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

    createSearchBar: function(target) {
        this.target = target;
        if(!this.snapper)
            this.initializeWrapping();
        this.searchBar = this.getSearchBarSpec().createMorph();            
        this.snapper.addMorph(this.searchBar, this.wrapper);
        connect(this.searchBar.get('SearchField'), 'textString', this, 'searchFor');
    },

    createMoreEntry: function(hiddenChildren) {
        var item = {name: hiddenChildren.length + ' more'}
        var moreButton = this.moreButtonSpec().createMorph();

        connect(moreButton, 'fire', this, 'showHidden', {updater: function() {
            var parent = tree.withAllTreesDetect(function(t) { return t.item == item }).parent;
            hidden.forEach(function(child) {
                parent.item.children.splice(parent.item.children.indexOf(item), 0, child)
            });
            parent.item.children.remove(item);
            parent.update();
            button.remove();
            parent.collapse();
            parent.expand();
        }, varMapping: {item: item, tree: this, hidden: hiddenChildren, button: moreButton}});
        
        item.submorphs = [moreButton]
        item.mapsTo = function() { return false }
        return item;
    },

    createInspectButton: function() {
        // create a button, that triggers a custom inspection for the respective item
        var button = new lively.morphic.Button();
        button.setExtent(pt(22,22));
        button.setLabel('+');
        button.label.setFontSize(13);
        connect(button, "fire", this.item, "onInspect", {});
        return button;
    },
    createEditButton: function() {
        // create a button that triggers the editing mode ✎
        var button = new lively.morphic.Button();
        this.isEditing = false;
        button.setExtent(pt(22,22));
        button.setBorderStyle('hidden');
        button.setBorderStylingMode(false);
        button.setFill(Color.rgba(0,0,0,0));
        button.setAppearanceStylingMode(false);
        button.label.setFillOpacity(0);
        button.setLabel('✎');
        button.label.setFontSize(13);
        connect(button, "fire", this, "toggleEdit", {});
        return button;
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
            childrenToShow.each(function(currentItem) {
                var node = this.createNodeBefore(currentItem);
                this.childNodes.push(node);
            }, this);
            if (this.childNodes.length < this.item.children.length) {
                var more = {name: Strings.format("[... show more (%s total)]",
                                    this.item.children.length),
                            style: {color: Color.web.darkgray},
                            onSelect: this.showMoreChildren.bind(this)};
                this.showMoreNode = this.createNodeBefore(more);
            }
        });
    },
    expand: function(treeOwnerBounds) {
        if (!this.item.children || this.childNodes) return;
        if(treeOwnerBounds && this.outsideOf(treeOwnerBounds)) {
            return;
        }

        this.layoutAfter(function () {
            if (this.item.onExpand) this.item.onExpand(this);
            if (this.icon) this.icon.setTextString("▼");
            this.showChildren();
        })
        this.childNodes.forEach(function(tree) {
            tree.label.fit();
            tree.node.applyLayout();
        });
    },
    expandAll: function(scrollingMorph) {
        var boundingBox = scrollingMorph.globalBounds();
        connect(scrollingMorph, 'onScroll', this, 'updateView', 
                    {converter: function() { return boundingBox }, 
                     varMapping: { boundingBox: boundingBox }}); 
        this.withAllTreesDo(function(tree) {
            tree.expandFully = true;
            tree.expand(boundingBox);
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
    visibleChildNodes: function() {
        var bounds = this.getWrapperBounds()
        return this.childNodes.select(function(tree) { 
                    return !tree.outsideOf(bounds); });
    },
    getWrapperBounds: function() {
        return this.getRootTree().wrapper.globalBounds();
    },

    fitToOwner: function () {
        if(this.owner) {
            this.setExtent(pt(this.owner.getExtent().x, this.getExtent().y));
            this.setPosition(pt(0));
        }
    },
    select: function(tree) {
        var unselectedTrees = [];
        this.withAllTreesDo(function(t) {
            if (t.item.isSelected) {
                delete t.item.isSelected;
                t.label.setFill(null);
                unselectedTrees.push(t);
            }
        });
        if (tree && !unselectedTrees.include(tree)) {
            tree.label.setFill(Color.rgb(218, 218, 218));
            tree.item.isSelected = true;
            tree.item.onSelect(tree);
            return true;
        }
    },
    layoutAfter: function(callback) {
        var layouter = this.getLayouter();
        try {
            layouter && layouter.defer();
            callback.call(this);
        } finally {
            layouter && layouter.resume();
            this.getRootTree().applyLayout();
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
        this.node.addMorph(edit, this.editButton);
        edit.growOrShrinkToFit();
        (function() { edit.focus(); edit.selectAll(); }).delay(0);
        return edit;
    },
    finishEditingDescription: function(edit) {
        if (this.item.onEdit) this.item.onEdit(edit.textString);
        this.updateLabel();
        edit.remove();
    },
    toggleEdit: function() {
        if (!this.editing) {
            this.editButton.setLabel('✓');
            this.editing = this.editDescription();
        } else {
            this.editing = this.finishEditingDescription(this.editing);
            this.editButton.setLabel('✎');
        }
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
    },
    withAllTreesDetect: function(iter, context, depth) {
        // only iterates through expanded childNodes, not necessarily through
        // all item children! See #withAllItemsDo
        if (!depth) depth = 0;
        if (iter.call(context || Global, this, depth))
            return this;
        var children = this.childNodes;
        if (!children) return undefined;
        for (var i = 0, len = children.length; i < len; i++) {
            var detectedChild = children[i].withAllTreesDetect(iter, context, depth + 1);
            if(detectedChild)
                return detectedChild;
        }
        return undefined;
    },

},
'event handling', {

    onMouseDown: function(evt) {
        this.focus();
        if (!evt.isRightMouseButtonDown()) return false;
        // delayed because when owner is a window and comes forward the window
        // would be also in front of the new menu
        var items = this.getMenu();
        if (items.length > 0) lively.morphic.Menu.openAt.curry(
            evt.getPosition(), null, items).delay(0.1);
        evt.stop(); return true;
    },


},
'morph menu', {
    getMenu: function() { /*FIXME actually menu items*/ return []; } 
},
'search', {
    searchTargetForTerm: function(target, term) {
        var hit = false;
        var i;
        if(target.searchFunction){
            // if a custom search function is supplied, use that
            i = target.searchFunction(term)
        } else {
            // inspect name and description
            i = target.name.match(new RegExp(term, 'i'));
        }
        if(i) {
            i = i.index;
            target.emphasizeRange = [i, i + term.length];
            hit = true;
        } else {
            target.emphasizeRange = undefined;
        }

        if(target.children && target.children.length > 0){
            target.children.forEach(function(child) { 
                var s = this.searchTargetForTerm(child, term);
                if(s) {
                    hit = true;
                }
            }, this);
        }

        target.inSearchResult = hit;
        return hit;
    }   ,

    searchFor: function(term) {
        this.collapse()
        this.searchTerm = term;
        this.label.unEmphasizeAll();
        this.searchTargetForTerm(this.item, term);
        Functions.debounce(100, this.renderSearchView, false).bind(this)();
        this.viewUpdater = connect(this.wrapper, 'onScroll', this, 'updateView', {updater: function($proceed) { 
                    $proceed(self.getWrapperBounds(), function(tree) {
                                if(!tree.childNodes) {
                                    tree.renderSearchView();
                                    self.updateChildrenShallow();
                                }
                            });
                    }, varMapping: {self: this}})
    },
    renderSearchView: function() {
        if(this.item.inSearchResult && this.item.emphasizeRange){
            // render the node accordingly to highlight the searchterm
            this.label.emphasizeRanges([[this.item.emphasizeRange[0],
                                         this.item.emphasizeRange[1],
                                         {fontWeight: 'bold', color: Color.tangerine}]]);
        }
        if(this.item.children && this.item.children.length > 0) {
            if (this.item.onExpand) this.item.onExpand(this);
            if (this.icon) this.icon.setTextString("▼");
            this.item.children.filter(function(item) { return item.inSearchResult })
                                .each(function(item) { 
                                this.childNodes = this.childNodes || [];
                                var child = this.childNodes.find(function(t) { return t.item == item });
                                if(!child) {
                                    var child = this.createNodeBefore(item)
                                    this.childNodes.push(child);
                                }}, this);
            var currentlyVisible = this.visibleChildNodes()
            var i = 0;
            while(i < currentlyVisible.length) {
                currentlyVisible[i].renderSearchView(); i++;
                currentlyVisible = this.visibleChildNodes();
            }
            this.updateChildrenShallow();
        }
    },
    moreButtonSpec: function() {
        return lively.BuildSpec({
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 50,
                _BorderWidth: 3.0719999999999996,
                _Extent: lively.pt(23.0,20.0),
                _Fill: Color.rgba(204,0,0,0),
                _Position: lively.pt(204.0,161.0),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: false,
                grabbingEnabled: false,
                isPressed: false,
                label: "+",
                name: "Button",
                pinSpecs: [{
                    accessor: "fire",
                    location: 1.5,
                    modality: "output",
                    pinName: "fire",
                    type: "Boolean"
                }],
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "doAction", {});
            },
                doAction: function doAction() {
                
            }
        })
    },
    pruneSearchResults: function(resultTree) {
        if(!resultTree || !resultTree.children)
            return resultTree;
        var branches = resultTree.children.filter(function (item) { return item.children && !item.isMoreNode });
        var leaves = resultTree.children.withoutAll(branches);
        if(leaves.length > 5) {
            var moreEntry = this.createMoreEntry(leaves.slice(5));
            leaves = leaves.slice(0, 5);
            leaves.push(moreEntry);
        } 
        branches = branches.map(function(branch) {
                return this.pruneSearchResults(branch);
            }, this);
        resultTree.children = leaves.concat(branches);
        return resultTree;
    },
    exitSearch: function() {
        this.searchBar.remove();
        this.searchTerm = undefined;
        this.viewUpdater && this.viewUpdater.disconnect(); // we might not have entered a query at all
        this.setItem(this.target);
        // TODO: preserve expansion from before the search
    },
    getSearchBarSpec: function() {
        return lively.BuildSpec({
    _Extent: lively.pt(450.0,31.0),
    _Fill: Color.rgba(171,171,171,0),
    _StyleClassNames: ["Morph","Box"],
    _StyleSheet: ".Morph {\n\
}",
    className: "lively.morphic.Box",
    doNotCopyProperties: [],
    doNotSerialize: [],
    droppingEnabled: true,
    layout: {
        borderSize: 4.505,
        resizeHeight: false,
        resizeWidth: true,
        spacing: 4.77,
        type: "lively.morphic.Layout.HorizontalLayout"
    },
    name: "SearchBar",
    sourceModule: "lively.morphic.Core",
    submorphs: [{
        _BorderColor: Color.rgb(182,182,182),
        _BorderRadius: 22.2,
        _BorderWidth: 2.516,
        _Extent: lively.pt(441.0,29.0),
        _Fill: Color.rgb(255,255,255),
        _FontFamily: "Arial, sans-serif",
        _HandStyle: null,
        _InputAllowed: true,
        _MaxTextWidth: 120.695652,
        _MinTextWidth: 120.695652,
        _Padding: lively.rect(6,4,0,0),
        _Position: lively.pt(4.5,1.5),
        _StyleClassNames: ["Morph","Text"],
        _StyleSheet: ".Morph {\n\
    }",
        _TextColor: Color.rgb(165,165,165),
        allowInput: true,
        className: "lively.morphic.Text",
        doNotCopyProperties: [],
        doNotSerialize: [],
        droppingEnabled: false,
        emphasis: [[0,13,{}]],
        fixedWidth: true,
        grabbingEnabled: false,
        layout: {
            resizeWidth: true,
            scaleHorizontal: true
        },
        name: "SearchField",
        sourceModule: "lively.morphic.TextCore",
        submorphs: [],
        textString: "Search for...",
        connectionRebuilder: function connectionRebuilder() {
        // failed to generate rebuild code for AttributeConnection(<lively.morphic.Text#F2418... - SearchField>.textString --> null.searchFor)
        lively.bindings.connect(this, "textString", this.get("tree-view"), "searchFor", {});
    }
    }],
    toggleIndicator: function toggleIndicator() {}
});

}
});

}); // end of module
