module('lively.morphic.MobileInterface').requires("lively.morphic.Core", "lively.Traits").toRun(function() {
    
lively.morphic.Morph.subclass('lively.morphic.BertButton',
Trait('lively.morphic.DragMoveTrait').derive({override: ['onDrag','onDragStart', 'onDragEnd']}),
'settings', {

    isEpiMorph: true,
    style: {
        enableGrabbing: false,
        enableDragging: true,
        clipMode: 'hidden',
        enableHalos: false
    },

    isBertButton: true,
    diameter: 90,
    activeFill: Color.orange.withA(.7),
    inactiveFill: Color.gray.darker().withA(.3),
    iconPath: 'media/front2.svg'
},
'initializing', {
    initialize: function($super, options) {
        if (options) {
            if (options.activeFill !== undefined) this.activeFill = options.activeFill
            if (options.inactiveFill !== undefined) this.inactiveFill = options.inactiveFill;
            if (options.diameter !== undefined) this.diameter = options.diameter;
            if (options.iconPath !== undefined) this.iconPath = options.iconPath;
            if (options.isEpiMorph !== undefined) this.isEpiMorph = options.isEpiMorph;
            if (options.halosEnabled !== undefined) this.style.enableHalos = options.halosEnabled;
        }
        $super();
        this.setShape(new lively.morphic.Shapes.Ellipse(pt(0,0)
                .extent(pt(this.diameter, this.diameter))));
        this.setOrigin(pt(this.diameter/2, this.diameter/2));
        this.setFill(this.inactiveFill);
        this.initializeIcon();
        if (this.halosEnabled) this.enableHalos();
        lively.binding.connect(this, 'onDragStart', this, 'pressStart');
        lively.binding.connect(this, 'onDragEnd', this, 'pressEnd');
        lively.binding.connect(this, 'onDrag', this, 'stayInWorld');
    },

    open: function(world) {
        if (world.isRendered()) {
            this.addToWorld(world);
        } else {
            this.loadConnection = lively.bindings.connect(world, '_isRendered', this, 'addToWorld', {
                updater: function($upd, bool) { if (bool) $upd(this.sourceObj) }});
        }
    },

    initializeIcon: function() {
        var webR = URL.codeBase.withFilename(this.iconPath).asWebResource()
        if (webR.exists() && !webR.isCollection()) {
            this.icon = this.addMorph(new lively.morphic.Image(
                pt(0,0).extent(pt(200,200)),
                Config.codeBase + this.iconPath,
                false));
            this.icon.setScale(Math.min(
                    this.getExtent().x/this.icon.getExtent().x,
                    this.getExtent().y/this.icon.getExtent().y))
            this.icon.align(this.icon.bounds().topLeft(), this.getOrigin().negated())
            this.icon.disableEvents();
            this.icon.disableDropping();                
        }
    },

    setIcon: function(iconPath) {
        if (iconPath) {
            if (this.icon && this.icon.isMorph) {
                this.icon.remove();
            }
            this.iconPath = iconPath;
            this.initializeIcon();
        }
    },

    getGrabShadow: function() { return false },

    addToWorld: function(world, optPos) {
        var aWorld = world || lively.morphic.World.current();
        if (!aWorld) return;
        if (this.loadConnection) {
            this.loadConnection.disconnect();
            delete this.loadConnection;
        }
        aWorld.addMorph(this);
        aWorld.setIsCommandButtonPressed(false);
        if (optPos) {
            this.setPosition(optPos);
        } else {
            this.align(this.bounds().bottomLeft(), aWorld.visibleBounds().bottomLeft());
        }
        this.setFixed(true);
        return this;
    }
},
'interaction', {
    wantsToBeDroppedInto: function(dropTarget) {
        return dropTarget.isWorld;
    },

    onMouseOut: function($super, evt) {
        $super(evt);
        this.setBorderWidth(0);
    },

    onMouseOver: function($super, evt) {
        $super(evt);
        if (typeof this.onBertButtonDrop == 'function' && evt.hand.draggedMorph) {
            var over = evt.hand.draggedMorph;
            if (over && over.isBertButton && over !== this) { this.highlight(over); }
        }
    },

    highlight: function(over) {
        this.setBorderWidth(10);
        this.setBorderColor(over.activeFill.withA(1));
    },

    onToggleState: function(bool) {
        // overwrite to create a non-command-bert-button
        lively.morphic.World.current().setIsCommandButtonPressed(bool);
    },

    onMouseUp: function(evt) {
        this.toggleState(false);
        if (typeof this.onBertButtonDrop === 'function') {
            this.onBertButtonDrop();
            this.setBorderWidth(0);
        }
        return false
    },

    onMouseDown: function() {
        this.toggleState(true);
        return false;
    },

    pressStart: function() {
        var world = lively.morphic.World.current();
        this.setFixed(false);
        this.setPosition(this.getPosition().addPt(world.visibleBounds().topLeft()))
    },

    toggleState: function(bool) {
        this.onToggleState(bool);
        this.setFill(bool === false ? this.inactiveFill : this.activeFill);
    },

    pressEnd: function() {
        var world = lively.morphic.World.current();
        world.addMorph(this);
        this.positionOnBorder();
        this.moveBy(pt(0,0).subPt(world.visibleBounds().topLeft()))
        this.setFixed(true);
        this.toggleState(false);
    }
},
'positioning', {

    scrollWorld: function() {
        var world = lively.morphic.World.current(),
            wb = world.visibleBounds(),
            mb = this.bounds();
        if (wb.containsRect(this.bounds())) return;
        else {
            // Shamelessly copied and adapted from lively.morphic.Morph.scrollRectIntoView
            // which cannot handle usual world scroll;
            var scrollDeltaX = 0, scrollDeltaY = 0;
            if (mb.left() < wb.left())
                scrollDeltaX = mb.left() - wb.left();
            else if (mb.right() > wb.right())
                scrollDeltaX = mb.right() - wb.right();
            if (mb.top() < wb.top())
                scrollDeltaY = mb.top() - wb.top();
            else if (mb.bottom() > wb.bottom())
                scrollDeltaY = mb.bottom() - wb.bottom();
            var scroll = world.getScroll();
            world.setScroll(scroll[0] + scrollDeltaX, scroll[1] + scrollDeltaY);
        }
    },

    stayInWorld: function() {
        this.scrollWorld();
        var vp = lively.morphic.World.current().visibleBounds().copy(),
            b = this.bounds();
        this.moveBy(pt(Math.max(0, vp.left() - b.left()),0));
        this.moveBy(pt(Math.min(0, vp.right() - b.right()),0));
        this.moveBy(pt(0, Math.max(0, vp.top() - b.top())));
        this.moveBy(pt(0, Math.min(0, vp.bottom() - b.bottom())));
    },

    hideFromWorld: function() {
        this.setFixed(false)
        this.posBeforeHide = this.getPosition()
        this.remove();
    },

    showInWorld: function() {
        this.addToWorld($world, this.posBeforeHide)
        delete this.posBeforeHide
    },

    positionOnBorder: function() {
        var vp      = lively.morphic.World.current().visibleBounds(),
            b       = this.globalBounds(),
            absMin  = function(x, y) { return Math.abs(x) < Math.abs(y) ? x : y },
            dLeft   = vp.x - b.topLeft().x,
            dRight  = vp.x + vp.width - b.bottomRight().x,
            dTop    = vp.y - b.topLeft().y,
            dBottom = vp.y + vp.height - b.bottomRight().y,
            dx      = absMin(dLeft, dRight),
            dy      = absMin(dTop, dBottom),
            moveX   = sign(dLeft) == sign(dRight) ? dx : 0,
            moveY   = sign(dTop) == sign(dBottom) ? dy : 0;
        this.moveBy(Math.abs(dx) < Math.abs(dy) ? pt(dx, moveY) : pt(moveX, dy));
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function sign(aNum) {
            return aNum < 0 ? -1 : aNum > 0 ? 1 : 0
        };
    },

    onWorldResize: function() {
        Functions.debounceNamed(this.id + '-onWorldResize', 300, this.positionOnBorder.bind(this))();
    }
});

lively.morphic.BertButton.subclass('lively.morphic.ColorPaletteButton',
'settings', {
    iconPath: 'media/arrow.png',
    isEpiMorph: false,
    defaultColors: ['black', 'white','cyan', 'magenta', 'yellow'],
    style: {enableHalos: true}
},
'interface', {

    onToggleState: function($super, bool) {
        if (bool) {
            if (this.colorButtons && this.colorButtons.length > 0) {
                this.colorButtons.invoke('showInWorld')
            } else {
                this.showDefaultColorPalette();
            }
        } else {
            this.colorButtons = $world.submorphs.select(function(ea) {
                return ea.isBertButton && ea.isColorButton;
            })
            this.colorButtons.invoke('hideFromWorld');
        }
    },

    showDefaultColorPalette: function() {
        var pos = $world.visibleBounds().topRight()
                .addPt(pt(-this.diameter/2, this.diameter/2));
        this.defaultColors.each(function(colorString) {
            var color = Global.Color[colorString];
            if (color) {
                var colorButton = new lively.morphic.ColorButton(color);
                colorButton.addToWorld($world, pos);
                pos = pos.addPt(pt(0,this.diameter + 10))
            } else {
                alert('Could not create Color '+colorString);
            }
        }.bind(this))
    },

    setCurrentPenColor: function(aColor) {
        this.inactiveFill = aColor.withA(.7);
        this.setFill(aColor.withA(.7));
    },

},
'interaction', {

    onMouseOut: function($super, evt) {
        $super(evt);
        if (evt.hand.draggedMorph) {
            var over = evt.hand.draggedMorph;
            if (over && over.isBertButton && over !== this) {
                this.setBorderWidth(10);
                this.setBorderColor(over.activeFill);
            }
        }
    }

});

lively.morphic.BertButton.subclass('lively.morphic.ColorButton',
'settings', {
    iconPath: '',
    isEpiMorph: false,
    isColorButton: true,
    style: {
        enableHalos: true
    }
},
'initialization', {
    initialize: function($super, color) {
        $super({
            inactiveFill: color,
            activeFill: color.withA(.7)
        });
    },
},
'interface', {

    onToggleState: function($super, bool) {
        if (typeof Global.DrawingCanvasMorph !== 'undefined' && bool) {
            var canvasses = $world.withAllSubmorphsSelect(function(ea) {
                return (ea instanceof Global.DrawingCanvasMorph)
                    && typeof ea.setPenColor === 'function'
            });
            canvasses.invoke('setPenColor', this.inactiveFill);
            // indicate via color palette morph
            $world.select(function(ea) {
                return ea instanceof lively.morphic.ColorPaletteButton
            }).invoke('setCurrentPenColor', this.inactiveFill);
        }
    },

    highlight: function($super, over) {
        $super(over);
        this.setBorderColor(over.inactiveFill);
        this.toMix = over.inactiveFill.withA(1);
    },

    onBertButtonDrop: function() {
        if (this.toMix) {
            this.inactiveFill = this.mixColors(this.toMix, this.inactiveFill);
            this.setFill(this.inactiveFill);
        }
        delete this.toMix
    }
},
'interaction', {
    onMouseOut: function($super, evt) {
        $super(evt);
        delete this.toMix;
    }
},
'colors', {
    mixColors: function(aRGB, bRGB) {
        var a = this.toCMYK(aRGB);
        var b = this.toCMYK(bRGB);
        return this.toRGB({
            c: (a.c + b.c) / 2,
            m: (a.m + b.m) / 2,
            y: (a.y + b.y) / 2,
            k: (a.k + b.k) / 2
        })
    },

    toCMYK: function(rgbColor) {
        var k = 1-Math.max(rgbColor.r, rgbColor.g, rgbColor.b);
        return {
            c: (1-rgbColor.r-k) / (1-k),
            m: (1-rgbColor.g-k) / (1-k),
            y: (1-rgbColor.b-k) / (1-k),
            k: k
        }
    },

    toRGB: function(cmyk) {
        return Global.Color.rgb(
                ((cmyk.c * cmyk.k) - cmyk.c - cmyk.k + 1) * 255,
                ((cmyk.m * cmyk.k) - cmyk.m - cmyk.k + 1) * 255,
                ((cmyk.y * cmyk.k) - cmyk.y - cmyk.k + 1) * 255)
    },

    setFill: function($super, aColor) {
        $super(aColor);
        if (aColor) {
            this.inactiveFill = aColor;
            this.activeFill = aColor.withA(.7);                
        }
    }
});

lively.morphic.BertButton.subclass('lively.morphic.TrashCan',
'settings', {
    iconPath: 'media/PieIcons/remove.png',
    isEpiMorph: false,
    style: {
        enableHalos: true
    }
},
'interface', {

    onToggleState: function($super, bool) {
        
    },

    onBertButtonDrop: function() {
        this.toRemove && this.toRemove.remove();
        delete this.toRemove;
    },

    highlight: function($super, over) {
        $super(over)
        if (!over.isCommandButton) {
            this.toRemove = over;
        }
    }
},
'interaction', {
    onMouseOut: function($super, evt) {
        $super(evt)
        delete this.toRemove;
    }
});

}) // end of module
