module('lively.morphic.MobileInterface').requires('users.robertkrahn.Canvas', 'lively.persistence.BuildSpec').toRun(function() {
lively.morphic.World.addMethods(
    'overwrite',{
        addMorph: function ($super, morph, optMorphBefore) {
            // my first hand is almost the topmost morph
            var r = $super(morph, optMorphBefore);
            this.hands.forEach(function(hand) {
                $super(hand);
            })
            return r;
        }
    }
)

module('lively.morphic.ScriptingSupport').runWhenLoaded(function() {
    lively.morphic.PartsBinItem.addMethods({
        onDragStart: function ($super, evt) {
            if (!this.partItem) {
                alert('Cannot load Part because found no PartItem');
                return false;
            }
            // FIXME duplication with PartsBinBrowser open
            // FIXME put somewhere else
            this.startLoadingPart('openLoadedPartsBinItem', evt.hand)
            return true;
        },
        startLoadingPart: function (actionOnLoad, aHand) {
            var waitRect = lively.morphic.Morph.makeRectangle(this.getExtent().extentAsRectangle());
            waitRect.applyStyle({fill: Color.gray, fillOpacity: 0.6})
            this.addMorph(waitRect);
            this.partItem.goToHand = aHand;
            connect(this.partItem, 'part', waitRect, 'remove');
            connect(this.partItem, 'part', this, actionOnLoad);
    
            this.partItem.loadPart(true);
        },
        openLoadedPartsBinItem: function(partMorph) {
            // FIXME duplication with PartsBinBrowser open
            (this.partItem.goToHand || lively.morphic.World.current().firstHand()).grabMorph(partMorph, null);
            partMorph.setPosition(pt(0,0));
            if (partMorph.onCreateFromPartsBin) partMorph.onCreateFromPartsBin();
        }    
    })  
})
   
    
lively.morphic.Morph.subclass('lively.morphic.BertButton', Trait('lively.morphic.DragMoveTrait').derive({override: ['onDrag','onDragStart', 'onDragEnd']}),
    'settings', {
        isEpiMorph: true,
        style: {
            enableGrabbing: false,
            enableDragging: true,
            clipMode: 'hidden',
            enableHalos: false
        },
        isMobileInterface: true,
        isBertButton: true,
        diameter: 90,
        activeFill: Color.orange.withA(.7),
        inactiveFill: Color.gray.darker().withA(.3),
        iconPath: 'media/livelyIcon.svg'
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
            lively.bindings.connect(this, 'onDragStart', this, 'pressStart');
            lively.bindings.connect(this, 'onDragEnd', this, 'pressEnd');
            lively.bindings.connect(this, 'onDrag', this, 'stayInWorld');
        },
        open: function(world) {
            if (world.isRendered()) {
                this.addToWorld(world);
            } else {
                this.loadConnection = lively.bindings.connect(world, '_isRendered', this, 'addToWorld', {
                    updater: function($upd, bool) {
                        if (bool) $upd(this.sourceObj)
                    }
                });
            }
        },
    onLoad: function() {
        if (this.owner && this.owner.isWorld) {
            this.positionOnLoad();
        } else {
            lively.bindings.connect(this, 'owner', this, 'positionOnLoad', {
                updater: function($upd, newValue, oldValue) {
                    if (newValue && newValue.isWorld) {
                        $upd(newValue);
                    }
                },
                removeAfterUpdate: true
            })
        }
    },
    positionOnLoad: function() {
        (function () {
            this.setFixed(false);
            this.positionOnBorder();
            this.moveBy(pt(0,0).subPt($world.visibleBounds().topLeft()))
            this.setFixed(true);
        }.bind(this)).delay(0)

    },
        initializeIcon: function() {
            var webR = (new URL(Config.codeBase + this.iconPath)).asWebResource()
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


        getGrabShadow: function() {
            return false
        },
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
            if (over && over.isBertButton && over !== this) {
                this.highlight(over);
            }
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
            return false
        },
        pressStart: function() {
            var world = lively.morphic.World.current();
            this.setFixed(false);
            this.setPosition(this.getPosition().addPt(world.visibleBounds().topLeft()))
            if (!UserAgent.isMobile) {
                this.gotDragged = true;
            }
        },
        toggleState: function(bool) {
            if (UserAgent.isMobile) {
                this.onToggleState(bool);
                this.setFill(bool === false ? this.inactiveFill : this.activeFill);
            } else if (bool === false) {
                if (this.gotDragged) {
                    delete this.gotDragged
                } else {
                    if (this.isToggled) {
                        this.onToggleState(false);
                        delete this.isToggled;
                        this.setFill(this.inactiveFill);
                    } else {
                        this.onToggleState(true);
                        this.isToggled = true;
                        this.setFill(this.activeFill);
                    }
                }
            }
        },
        pressEnd: function() {
            var world = lively.morphic.World.current();
            world.addMorph(this);
            this.positionOnBorder();
            this.moveBy(pt(0,0).subPt(world.visibleBounds().topLeft()))
            this.setFixed(true);
            this.toggleState(false);
        },
    },
    'positioning', {
        scrollWorld: function() {
            var world = lively.morphic.World.current(),
                wb = world.visibleBounds(),
                mb = this.bounds();
            if (wb.containsRect(this.bounds())) { return }
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
            var vp = lively.morphic.World.current().visibleBounds(),
                b = this.globalBounds();
            var absMin = function(x, y) { return Math.abs(x) < Math.abs(y) ? x : y };
            var dLeft = vp.x - b.topLeft().x,
                dRight = vp.x + vp.width - b.bottomRight().x,
                dTop = vp.y - b.topLeft().y,
                dBottom = vp.y + vp.height - b.bottomRight().y;
            var dx = absMin(dLeft, dRight),
                dy = absMin(dTop, dBottom);
            var sign = function(aNum) {
                return aNum < 0 ? -1 : aNum > 0 ? 1 : 0
            };
            var moveX = sign(dLeft) == sign(dRight) ? dx : 0,
                moveY = sign(dTop) == sign(dBottom) ? dy : 0;
            this.moveBy(Math.abs(dx) < Math.abs(dy) ? pt(dx, moveY) : pt(moveX, dy));
        },
        onWorldResize: function() {
            Functions.debounceNamed(this.id + '-onWorldResize', 300, this.positionOnBorder.bind(this))();
        },
    }
)

lively.morphic.BertButton.subclass('lively.morphic.ColorPaletteButton',
    'settings', {
        iconPath: 'media/bertbuttons/palette.svg',
        isEpiMorph: false,
        defaultColors: ['black', 'white','cyan', 'magenta', 'yellow'],
        style: {
            enableHalos: true
        }
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

    }, 'interaction', {
        onMouseOut: function($super, evt) {
            $super(evt);
            if (evt.hand.draggedMorph) {
                var over = evt.hand.draggedMorph;
                if (over && over.isBertButton && over !== this) {
                    this.setBorderWidth(10);
                    this.setBorderColor(over.activeFill);
                }
            }
        },
    }
)

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
                $world.submorphs.select(function(ea) {
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
        },
    },
    'interaction', {
        onMouseOut: function($super, evt) {
            $super(evt);
            delete this.toMix;
        },
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
        },
    }
)

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
        },
    }
)

lively.BuildSpec("CanvasFlap", {
    isMobileInterface: true,
    _BorderWidth: 1,
    _Extent: lively.pt(1351.0,805.0),
    _Fill: Color.rgba(255,255,255,0),
    _Position: lively.pt(0.0,0.0),
    _FixedPosition: true,
    __layered_droppingEnabled__: true,
    className: "lively.morphic.Box",
    draggingEnabled: true,
    droppingEnabled: true,
    grabbingEnabled: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "CanvasFlap",
    sourceModule: "lively.morphic.Core",
    submorphs: [{
        _BorderWidth: 1,
        _Extent: lively.pt(1351.0,30.0),
        _Fill: Color.rgba(102,102,102,0.3),
        _HandStyle: "default",
        _PointerEvents: "none",
        _Position: lively.pt(0.0,775.0),
        __layered_droppingEnabled__: true,
        className: "lively.morphic.Box",
        droppingEnabled: true,
        grabbingEnabled: false,
        eventsAreDisabled: true,
        layout: {
            moveVertical: true,
            resizeWidth: true
        },
        name: "CanvasFlapHandle",
        sourceModule: "lively.morphic.Core",
        submorphs: [],
        withoutLayers: []
    }],
    onFromBuildSpecCreated: function() {
        var canvas = $world.loadPartItem('DrawingCanvasMorph', 'PartsBin/Astrid/');
        this.addMorph(canvas);
        canvas.setBounds(pt(0,0).extent(this.getExtent().subPt(pt(0,30))));
        canvas.clear()
        canvas.setName('CanvasFlapCanvas')
        Trait('lively.morphic.DragMoveTrait').applyTo(this, {override: ['onDrag','onDragStart', 'onDragEnd']})
        this.resizeWithWorld();
        connect(this, 'onDragEnd', this, 'onDragEndAction');
        connect(this, 'onDragStart', this, 'onDragStartAction');
        this.isExpanded = true;
    },
    withoutLayers: ["GrabbingLayer"],
    onWorldResize: function onWorldResize() {
        Functions.debounceNamed(this.id + '-onWorldResize', 300, this.resizeWithWorld.bind(this))();
    },
    resizeWithWorld: function resizeWithWorld() {
        this.setExtent($world.visibleBounds().extent())
    },
    setPosition: function setPosition(aPos) {
        var x = $world.visibleBounds().x,
            y = aPos.y;
        // not too far up
        if (y < $world.visibleBounds().y) {
            y = Math.max(y, this.minPosition().y);
        }
        // not too far down
        if (y > $world.visibleBounds().y) {
            y = Math.min(y, $world.visibleBounds().y);
        }
        // $super((pt(x, y)));
        $super((pt(x-$world.getScroll()[0], y-$world.getScroll()[1])));
    },
    wantsToBeDroppedInto: function wantsToBeDroppedInto(dropTarget) {
        return dropTarget.isWorld
    },
    minPosition: function() {
        return $world.visibleBounds().topLeft().subPt(pt(0, this.getExtent().y - 30));
    },
    onDragEndAction: function(evt) {
        var offset = 10,
            minY = this.minPosition().y;
        if (this.getPosition().y > (minY + offset)) {
            this.expandedPosition = this.getPosition();
        }
        this.wasDragged = true;
    },
    onDragStartAction: function(evt) {
        this.wasDragged = false;
    },
    onClick: function(evt) {
        if (evt.hand.world().morphsContainingPoint(evt.getPosition())
                .include(this.getMorphNamed('CanvasFlapHandle'))) {
            if (!this.wasDragged) {
                if (!this.expandedPosition || this.getPosition().equals(this.expandedPosition)) {
                    this.expandedPosition = this.getPosition();
                    this.withCSSTransitionDo(
                        this.setPosition.bind(this, this.minPosition()), 500)
                } else {
                    this.withCSSTransitionDo(
                        this.setPosition.bind(this, this.expandedPosition), 500)
                } 
            }
        }
        delete this.wasDragged;
    },
})}) // end of module
