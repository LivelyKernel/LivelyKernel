module('lively.morphic.ColorChooserDraft').requires('lively.morphic.Core', 'lively.morphic.TextCore', 'lively.CrayonColors').toRun(function() {

lively.morphic.Box.subclass('lively.morphic.ColorChooser',
'settings', {
    defaultBounds: new Rectangle(0,0, 160, 120),
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
    },
});
lively.morphic.ColorChooser.subclass('lively.morphic.RGBColorChooser',
'settings', {
    colorNames: 'rgb',
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
        this.ensureLabel().setTextString("color:" + color)
        return color
    },
  ensureLabel: function() {
       if (!this.label) {
            this.label = new lively.morphic.Text(new Rectangle(0,0,160,20), "rbg", {fill: Color.white});
            this.addMorph(this.label);
            this.label.setPosition(pt(0,120))        
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
        this.registerForEvent('mouseMove', this, 'onMouseMove');
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
    style: {enableDragging: true, fill: Color.white, borderWidth: 1, borderColor: Color.black},
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
    onMouseDown: function($super, evt) {
        if ($super(evt)) return true;
        if (!evt.isCommandKey() && evt.isLeftMouseButtonDown())
            this.showColorChooserAndSwitchers(this.getCurrentColorChooser());
        return true;
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
}) // end of moduleeee