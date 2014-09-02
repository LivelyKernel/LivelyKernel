module('lively.morphic.ColorChooserDraft').requires('lively.morphic.Core', 'lively.morphic.Widgets', 'lively.morphic.TextCore', 'lively.CrayonColors').toRun(function() {

lively.morphic.Box.subclass('lively.morphic.ColorChooser',
'settings', {
    defaultBounds: new Rectangle(0,0, 160, 120)
},
'initializing', {
    initialize: function($super, bounds) {
        $super(bounds || this.defaultBounds);
        this.buildColorMap();
        // this.ignoreEvents();
    },
    buildColorMap: function() {
        throw new Error('subclass responsibility')
    },
},
'color mapping', {
    colorForPos: function(pos) {
        throw new Error('subclass responsibility');
    }
});

lively.morphic.ColorChooser.subclass('lively.morphic.RGBColorChooser',
'settings', {
    colorNames: 'rgb',
    hasLabel: true
},
'initializing', {
    buildColorMap: function() {
        // copied from lively.Widgets ColorPicker
        // Slow -- should be cached as a bitmap and invalidated by layoutChanged
        // Try caching wheel as an interim measure
        var r = this.shape.getBounds().insetBy(this.getBorderWidth());
        var rh2 = r.height/2;
        var dd = 5; // grain for less resolution in output (input is still full resolution)

        //DI: This could be done with width*2 gradients, instead of width*height simple fills
        for (var x = 0; x < r.width; x += dd) {
            for (var y = 0; y < r.height; y += dd) { // lightest down to neutral
                var element = new lively.morphic.Morph.makeRectangle(new Rectangle(x + r.x, y + r.y, dd, dd));
                element.applyStyle({
                    fill: this.colorMap(x, y, rh2, this.colorWheel(r.width + 1)),
                    borderWidth: 0
                });
                element.ignoreEvents();
                this.addMorph(element);
            }
        }
    },
},
'color mapping', {
colorForPos: function(pos) {
         var r = this.shape.getBounds().insetBy(this.getBorderWidth()),
            pos = r.closestPointToPt(pos),
            rh2 = r.height/2;
        var color =  this.colorMap(pos.x, pos.y, rh2, this.colorWheel(r.width+1));
        this.hasLabel && this.ensureLabel().setTextString("color:" + color);
        return color;
    },
  ensureLabel: function() {
       if (!this.label) {
            this.label = new lively.morphic.Text(new Rectangle(0,0,160,20), "rbg", {fill: Color.white});
            this.addMorph(this.label);
            this.label.setPosition(pt(0,120));
       }
        return this.label
    },


    colorWheel: function(n) {
        if (this.colorWheelCache && this.colorWheelCache.length == n)
            return this.colorWheelCache;
        // the start of the color range should be just white for grayscale
        var whiteAmount = 5,
            whites = Array.range(1,whiteAmount).collect(function() {return Color.white})
        return this.colorWheelCache = whites.concat(Color.wheelHsb(Math.round(n-whiteAmount),338,1,1));
    },

    colorMap: function(x,y,rh2,wheel) {
        var columnHue = wheel[Math.round(x)];
        return y <= rh2 ?
            columnHue.mixedWith(Color.white, y/rh2) : // lightest down to neutral
            Color.black.mixedWith(columnHue, (y - rh2)/rh2);  // neutral down to darkest
    },
});

lively.morphic.ColorChooser.subclass('lively.morphic.CrayonColorChooser',
'settings', {
    colorNames: 'crayons',
},
'initializing', {
    buildColorMap: function() {
        var colorNames = CrayonColors.colorNames(),
            x = 8, y = 6, // like MacOS colors
            extent = this.innerBounds().extent().scaleByPt(pt(1/x, 1/y));
        for (var j = 0; j < y; j++) {
            for (var i = 0; i < x; i++) {
                var idx = j*x+i, // running offset j*x^1 + i*y^0
                    color = CrayonColors[colorNames[idx]],
                    r = extent.scaleByPt(pt(i, j)).extent(extent);
                    morph = new lively.morphic.Box(r);
                morph.applyStyle({fill: color, borderWidth: 0});
                morph.ignoreEvents();
                this.addMorph(morph);
            }
        }
    },
},
'color mapping', {
    colorForPos: function(pos) {
        var r = this.shape.getBounds().insetBy(this.getBorderWidth()),
            pos = r.closestPointToPt(pos),
            m = this.submorphs.detect(function(ea) { return ea.bounds().containsPoint(pos) });
        return m ? m.getFill() : Color.black;
    },
});
lively.morphic.ColorChooser.subclass('lively.morphic.CustomColorChooser',
'settings', {
    colorNames: 'custom',
},
'initializing', {
    initialize: function($super,bounds, colors){
        // under constructions...
        if (!colors) {
            colors = this.gatherCustomColors();
        }
        this.colors = colors;
        $super(bounds);
    },
    gatherCustomColors: function() {
        // lively.morphic.CustomColorChooser.prototype.gatherCustomColors()
        var colors = [];
        var gatherColor = function(eaColor) {
            if (eaColor && !colors.detect(function(colorSetEa) {
                return colorSetEa.equals(eaColor)}))
                colors.push(eaColor)
        }
        $world.withAllSubmorphsDo(function(ea) {
            gatherColor(ea.getBorderColor());
        })
        return colors
    },

    buildColorMap: function() {
        var x = Math.floor(Math.sqrt(this.colors.length)) + 1,
            y = x,
            extent = this.innerBounds().extent().scaleByPt(pt(1/x, 1/y));
        for (var j = 0; j < y; j++) {
            for (var i = 0; i < x; i++) {
                var idx = j*x+i, // running offset j*x^1 + i*y^0
                    color = this.colors[idx],
                    r = extent.scaleByPt(pt(i, j)).extent(extent),
                    morph = new lively.morphic.Box(r);
                morph.applyStyle({fill: color, borderWidth: 0});
                morph.ignoreEvents();
                this.addMorph(morph);
            }
        }
    },
},
'color mapping', {
    colorForPos: function(pos) {
        var r = this.shape.getBounds().insetBy(this.getBorderWidth()),
            pos = r.closestPointToPt(pos),
            m = this.submorphs.detect(function(ea) { return ea.bounds().containsPoint(pos) });
        return m ? m.getFill() : Color.black;
    },
});
lively.morphic.Text.subclass('lively.morphic.ColorChooserSwitcher',
'documentation', {
    documentation: 'used for changing the color chooser of a color field',
},
'settings', {
    style: {fixedWidth: false, fixedHeight: false, fill: Color.white},
},
'initializing', {
    initialize: function($super, colorChooser) {
        this.colorChooser = colorChooser;
        $super(new Rectangle(0,0,10,10), colorChooser.colorNames);
        this.registerForEvent('pointerMove', this, 'onMouseMove');
    },
},
'mouse events', {
    onMouseMove: function(evt) {
        this.colorField.setCurrentColorSwitcher(this)
    },
});

lively.morphic.Box.subclass('lively.morphic.ColorField',
/* example:
new lively.morphic.ColorField().openInWorld(pt(100,100))
*/
'settings', {
    doNotSerialize: ['colorSwitchers', 'currentColorSwitcher'],
    style: {
        enableDragging: true,
        enableGrabbing: false,
        fill: Color.white,
        borderWidth: 1,
        borderColor: Color.black
    }
},
'initializing', {
    initialize: function($super, optBounds) {
        $super(optBounds || new Rectangle(0,0, 40, 30));
        // initialize laziliy loaded switchers so that those are there when clicked
        this.getColorSwitchers()
    },
},
'color choosers', {
    showColorChooserAndSwitchers: function(chooser) {
        this.world().addMorph(chooser);
        chooser.align(chooser.bounds().topLeft(), this.worldPoint(this.innerBounds().bottomLeft()));
        var x = chooser.bounds().right(), y = chooser.bounds().top();
        var switchers = this.getColorSwitchers();
        switchers.forEach(function(ea) {
            ea.colorField = this;
            this.world().addMorph(ea);
            ea.align(ea.bounds().bottomRight(), pt(x, y));
            x -= ea.getExtent().x;
        }, this)
    },

},
'accessing', {
    getColorSwitchers: function() {
        // so that they are created just once
        //  this.constructor.prototype.colorSwitchers = null
        if (!this.colorSwitchers)
            this.constructor.prototype.colorSwitchers = [
                new lively.morphic.ColorChooserSwitcher(new lively.morphic.CrayonColorChooser()),
                new lively.morphic.ColorChooserSwitcher(new lively.morphic.RGBColorChooser()),
                new lively.morphic.ColorChooserSwitcher(new lively.morphic.CustomColorChooser())
                ];
        return this.colorSwitchers;
    },
    getCurrentColorChooser: function() { return this.getCurrentColorSwitcher().colorChooser },
    getCurrentColorSwitcher: function() {
        if (!this.currentColorSwitcher)
            this.constructor.prototype.currentColorSwitcher = this.getColorSwitchers()[0];
        return this.currentColorSwitcher;
    },
    setCurrentColorSwitcher: function(switcher) {
        this.constructor.prototype.currentColorSwitcher = switcher;
        this.showColorChooserAndSwitchers(switcher.colorChooser);
    },

},
'mouse events', {
    correctForDragOffset: Functions.False,

    onMouseDown: function($super, evt) {
        if (!evt.isCommandKey() && evt.isLeftMouseButtonDown()) {
            this.showColorChooserAndSwitchers(this.getCurrentColorChooser());
            return true;
        }
        return $super(evt);
    },

    onMouseUp: function($super, evt) {
        if ($super(evt)) return true;
        this. removHelperMorphs()
        return true;
    },

    onDrag: function(evt) {
        var cc = this.getCurrentColorChooser(),
            color = cc.colorForPos(cc.localize(evt.getPosition()));
        this.setFill(color);
        this.color = color;
        return true;
    },

    onDragEnd: function(evt) {
        this.removHelperMorphs();
        return true;
    },

    removHelperMorphs: function() {
        this.getColorSwitchers().forEach(function(ea) {
            ea.remove()
            ea.colorChooser.remove()
        })
    },
});

lively.morphic.Button.subclass('lively.morphic.SimpleColorField',
'init', {
    defaultBounds: new Rectangle(0,0,24,24),
    defaultColor: Color.red,
    colorDisplayOffset: 4,
    colorDisplayBorderRadius: 3,

    initialize: function($super, bounds){
        var b = bounds || this.defaultBounds;
        $super(b, '');
        var colorDisplay = new lively.morphic.Box(b.insetBy(this.colorDisplayOffset));
        this.removeAllMorphs(); // get rid of the default Text
        this.addMorph(colorDisplay);
        this.setColor(this.defaultColor);
        colorDisplay.applyStyle({borderRadius: this.colorDisplayBorderRadius, resizeWidth: true, resizeHeight: true});
        this.applyStyle({adjustForNewBounds: true});
    },
    setValue: function(bool) {
        this.value = bool;
        // buttons should fire on mouse up
        if (!bool) {
            var chooser = new lively.morphic.RGBColorChooser(),
                menu = new lively.morphic.SimpleColorMenu(chooser),
                bounds = this.globalBounds(),
                pos = pt(bounds.x, bounds.y),
                menuPos = pos.addPt(pt(0, bounds.height));
            menu.open(lively.morphic.World.current(), menuPos, false);
            menu.setCallback(this, 'setColor');
        }
    },
    getColorDisplay: function() { return this.submorphs.detect(function(ea) { return ea instanceof lively.morphic.Box; }); },
    setColor: function(color) {
        this.color = color;
        this.getColorDisplay().setFill(color);
    }

});

lively.morphic.Box.subclass('lively.morphic.SimpleColorMenu',
'settings', {
    style: {
        fill: Color.gray.lighter(3),
        borderColor: Color.gray,
        borderWidth: 1,
        borderStyle: 'outset',
        borderRadius: 4,
    },
    chooserOffset: 4,
    isEpiMorph: true,
},
'init', {
    initialize: function($super, chooser) {
        this.colorChooser = chooser || new lively.morphic.RGBColorChooser();
        this.colorChooser.hasLabel = false;
        var b = this.colorChooser.getBounds();
        $super(new Rectangle(0,0, b.width + this.chooserOffset*2 , b.height+ this.chooserOffset*2));

    },

    setCallback: function(target, callback){
        if (this.colorChooser) connect(this.colorChooser, 'currentlySelectedColor', target, callback);
    },

    open: function(parentMorph, pos, remainOnScreen, callbackTarget, callbackFunc) {
        this.setPosition(pos || pt(0,0));
        var owner = parentMorph || lively.morphic.World.current();
        this.remainOnScreen = remainOnScreen;
        if (!remainOnScreen) {
            if (owner.currentMenu) { owner.currentMenu.remove() };
            owner.currentMenu = this;
        } else {
            this.isEpiMorph = false;
        }

        owner.addMorph(this);

        this.offsetForWorld(pos);

        this.addMorph(this.colorChooser);
        this.colorChooser.setPosition(pt(this.chooserOffset,this.chooserOffset));
        this.colorChooser.disableGrabbing();
        this.colorChooser.disableDragging();
        this.colorChooser.onMouseUp = function(evt) {
              this.currentlySelectedColor = this.colorForPos(this.localize(evt.getPosition()));
              this.owner.remove();
        };
        //this.colorChooser.callback = this.chooseColor;
        //connect(this.colorChooser, 'currentlySelectedColor', this, 'choosenColor');

        return this;
    },
    choosenColor: Color.black,
    remove: function($super) {
        var w = this.world();
        if (w && w.currentMenu === this) w.currentMenu = null;
        $super();
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
}

);

lively.morphic.ColorChooser.subclass('lively.morphic.SimpleColorChooser',
'settings', {
    colorNames: 'custom',
},
'initializing', {
    initialize: function($super,bounds, colors){
        // under constructions...
        if (!colors) {
            colors = this.gatherCustomColors();
        }
        this.colors = colors;
        $super(bounds);
    },
    gatherCustomColors: function() {
        // lively.morphic.CustomColorChooser.prototype.gatherCustomColors()
        var colors = [];
        var gatherColor = function(eaColor) {
            if (eaColor && !colors.detect(function(colorSetEa) {
                return colorSetEa.equals(eaColor)}))
                colors.push(eaColor)
        }
        $world.withAllSubmorphsDo(function(ea) {
            gatherColor(ea.getBorderColor());
        })
        return colors
    },

    buildColorMap: function() {
        var x = Math.floor(Math.sqrt(this.colors.length)) + 1,
            y = x,
            extent = this.innerBounds().extent().scaleByPt(pt(1/x, 1/y));
        for (var j = 0; j < y; j++) {
            for (var i = 0; i < x; i++) {
                var idx = j*x+i, // running offset j*x^1 + i*y^0
                    color = this.colors[idx],
                    r = extent.scaleByPt(pt(i, j)).extent(extent),
                    morph = new lively.morphic.Box(r);
                morph.applyStyle({fill: color, borderWidth: 0});
                morph.ignoreEvents();
                this.addMorph(morph);
            }
        }
    }
},
'color mapping', {
    colorForPos: function(pos) {
        var r = this.shape.getBounds().insetBy(this.getBorderWidth()),
            pos = r.closestPointToPt(pos),
            m = this.submorphs.detect(function(ea) { return ea.bounds().containsPoint(pos) });
        return m ? m.getFill() : Color.black;
    }
});

lively.morphic.SimpleColorField.subclass('lively.morphic.AwesomeColorField',
'init', {
    setValue: function(bool) {
        this.value = bool;
        // buttons should fire on mouse up
        if (!bool) {
            var menu = this.world().loadPartItem('ColorPicker', 'PartsBin/Tools');
            var bounds = this.globalBounds();
            var pos = pt(bounds.x, bounds.y);
            var menuPos = pos.addPt(pt(0, bounds.height));
            menu.open(lively.morphic.World.current(), menuPos, false);
            (function(color) { menu.setColor(color); }).curry(this.color).delay(.001);
            connect(menu, 'color', this, 'setColor');
        }
    }
});

}) // end of module
