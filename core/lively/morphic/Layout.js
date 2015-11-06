module('lively.morphic.Layout').requires('lively.morphic.Core', 'lively.morphic.Widgets'/*for Window*/ /*, 'apps.dwarfcassowary.js.DwarfCassowary'*/).toRun(function() {

lively.morphic.Morph.addMethods(
'layouting', {
    // if you want a specific morph not be layouted (morph being part of a layout,
    // set this to false)
    isLayoutable: true,

    noLayoutDuring: function(func) {
        var orig = this.isInLayoutCycle, self = this;
        function enableLayouting() { self.isInLayoutCycle = orig; }
        this.isInLayoutCycle = false;
        try {
            return func.length ? func.call(this, enableLayouting) : func.call(this);
        } finally { if (!func.length) enableLayouting(); }
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
            if (!spec || morph.isInLayoutCycle) continue;
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

    setLayouter: function(layouter) {
        if (!this.layout) {
            this.layout = {};
        }
        if (layouter && !(layouter instanceof lively.morphic.Layout.Layout) && layouter.type) {
            var klass;
            switch (layouter.type) {
                case 'vertical': klass = lively.morphic.Layout.VerticalLayout; break;
                case 'horizontal': klass = lively.morphic.Layout.HorizontalLayout; break;
                case 'tiling': klass = lively.morphic.Layout.TileLayout; break;
                default: klass = lively.morphic.Layout.TileLayout; break;
            }
            var l = new klass(this);
            l.setBorderSize(layouter.border || 3);
            l.setSpacing(layouter.spacing || 3);
            layouter = l;
        }
        this.layout.layouter = layouter;
    },

    getLayouter: function() {
        return this.layout ? this.layout.layouter: undefined;
    },

    getMinWidth: function() {
        if (!this.doesResize('width')) return this.getExtent().x;
        if (!this.getLayouter()) return 0;
        if (lively.morphic.Layout.widthClipHidden(this)) return 0;
        return this.getLayouter().getMinWidth(this, this.getLayoutableSubmorphs());
    },

    getMinHeight: function() {
        if (!this.doesResize('height')) return this.getExtent().y;
        if (!this.getLayouter()) return 0;
        if (lively.morphic.Layout.heightClipHidden(this)) return 0;
        return this.getLayouter().getMinHeight(this, this.getLayoutableSubmorphs());
    },

    submorphResized: function(aSubmorph) {
        // my submorph aSubmorph has changed its size
        var layouter = this.getLayouter();
        if (layouter && layouter.handlesSubmorphResized()) {
            layouter.onSubmorphResized(this, aSubmorph, this.getLayoutableSubmorphs());
        }
    },
    submorphDragged: function(aMorph, evt) {
        // this is very generic code called in the lively.morphic.Events
        // maybe this code should go elsewhere?
        this.applyLayout();
    },
    applyLayout: function() {
        var layouter = this.getLayouter();
        layouter && layouter.layout(this, this.getLayoutableSubmorphs());
    },

    setPositionTopLeft: function(pos) {
          this.setPosition(this.getOrigin().addPt(pos));
    },
    setPositionCentered: function(pos) {
        this.setPosition(pos.subPt(this.innerBounds().center()));
    },

    getLayoutableSubmorphs: function() {
        // reject is damn slow..., optimize it!
        return this.submorphs.select(function (m) {
            return !m.isEpiMorph && !m.isBeingDragged && m.isLayoutable
        })
    },

    getPositionInWorld: function() {
        // renamed to make absolutely sure it does not collide with Magnet>>getGlobalPosition..
        return this.getGlobalTransform().transformPoint(pt(0,0).subPt(this.getOrigin()));
    },

    obtainPlaceholder: function(forMorph) {
        return this.placeholder || (this.placeholder = this.createPlaceholder());
    },

    createPlaceholder: function() {
        // use grab shadow as placeholder; or fall back to normal morphic copy
        this.placeholder = this.getGrabShadow() || this.copy();
        this.placeholder.isBeingDragged = false;
        this.placeholder.isPlaceholder = true;
        this.placeholder.ignoreEvents();
        this.placeholder.applyStyle({
            fill: Color.gray,
            borderWidth: 0,
            enableDropping: false
        });
        return this.placeholder;
    },

    destroyPlaceholder: function() {
        var placeholder = this.placeholder;
        if (!placeholder) return;
        delete this.placeholder;
        var owner = placeholder.owner;
        placeholder.remove();
        if (owner && owner.layout && owner.layout.extentWithoutPlaceholder) {
            owner.setExtent(owner.layout.extentWithoutPlaceholder);
        }
    },

    getLayoutConstraintInfo: function() {
        if (!this.layout) {
            return undefined;
        }
        return this.layout.constraintInfo;
    },

    setLayoutConstraintInfo: function(constraintInfo) {
        if (!this.layout) {
            this.layout = {};
        }
        this.layout.constraintInfo = constraintInfo;
    },

    insertPlaceholder: function(placeholder) {
        this.layout.extentWithoutPlaceholder = this.getExtent();
        this.addMorph(placeholder);
    },

    getMaxVisibleWidth: function() {
        if (this.owner) {
            if (this.owner.getClipMode() == 'scroll') {
                return this.owner.getExtent().x;
            }
        }
        return this.getExtent().x;
    },
    doesResize: function(optDirection) {
        if (typeof(optDirection) === 'string') {
            if (optDirection.capitalize() === 'Width')
                return this.layout && this.layout.resizeWidth
            if (optDirection.capitalize() === 'Height')
                return this.layout && this.layout.resizeHeight
        }
        return this.layout && this.layout.resizeWidth && this.layout.resizeHeight
    },
    getInheritedClipMode: function() {
        var clipMode = lively.morphic.Layout.translateClipMode(this.getClipMode()),
            x = clipMode.x,
            y = clipMode.y;
        if (clipMode.x === 'inherit') {
            x = (this.owner) ? this.owner.getInheritedClipMode() : undefined;
        }
        if (clipMode.y === 'inherit') {
            y = (this.owner) ? this.owner.getInheritedClipMode() : undefined;
        }
        if (x === y) return x
        else return ({x: x, y: y})
    }

});

Object.subclass('lively.morphic.Layout.Layout',
'initializing', {

    initialize: function(container) {
        this.defaultBorderSize = this.borderSize = 10;
        this.defaultSpacing = this.spacing = 15;
        container && this.setContainer(container);
    }

},
'testing', {
  
    isJournalLayout: function() {
        return false;
    }

},
'layouting', {

    layout: function(container, submorphs) {
        if (container.isInLayoutCycle) return;
        container.isInLayoutCycle = true;
        try {
            this.basicLayout(container, this.orderedSubmorphs(submorphs));
        } finally { container.isInLayoutCycle = false; }
    },

    basicLayout: function(container, submorphs) {
        alert('calling abstract method lively.morphic.Layout.layout()');
    },

    calcFlexChildSpace: function(submorphs, extent) {
        var that = this,
            flexChildren = this.getFlexibleChildren(submorphs),
            flexChildrenCount = flexChildren.size(),
            flexChildrenSpace = this.calcFlexChildrenSpace(submorphs, flexChildrenCount, extent),
            flexChildSpace = flexChildrenSpace / flexChildrenCount;
        flexChildren.forEach(function (each) {
            var minSpace = that.getMinSpaceFor(each);
            if (minSpace > flexChildSpace) {
                flexChildrenSpace -= minSpace;
                flexChildrenCount -= 1;
                flexChildSpace = flexChildrenSpace / flexChildrenCount;
            }
        });
        return flexChildrenSpace / flexChildrenCount;
    },

    keepContainerAtMinimumSize: function(container, submorphs) {
        var extent = container.getExtent(),
            width = extent.x,
            height = extent.y,
            minWidth = this.getMinWidth(container, submorphs),
            minHeight = this.getMinHeight(container, submorphs);
        if (width !== minWidth || height !== minHeight) {
            var clipPolicy = lively.morphic.Layout.translateClipMode(container.getInheritedClipMode());
            width = lively.morphic.Layout.calcActualLength(width, minWidth, clipPolicy.x);
            height = lively.morphic.Layout.calcActualLength(height, minHeight, clipPolicy.y);
            container.setExtent(pt(width, height));
        }
    },

    onSubmorphAdded: function(aMorph, aSubmorph, allSubmorphs) { aMorph.applyLayout(); },

    onSubmorphResized: function(aMorph, aSubmorph, allSubmorphs) {
        if (this.handlesSubmorphResized()) this.adjustExtent(aMorph, allSubmorphs);
    },

    adjustExtent: function(container, submorphs) {
        var clipmode = container.getClipMode(),
            height = lively.morphic.Layout.heightClipHidden(container) ?
                container.getExtent().y :
                Math.max(this.getMinHeight(container, submorphs), container.getExtent().y),
            width = lively.morphic.Layout.widthClipHidden(container) ?
                container.getExtent().x :
                Math.max(this.getMinWidth(container, submorphs), container.getExtent().x);
        container.setExtent(pt(width, height));
    },

    onSubmorphRemoved: function(aMorph, aSubmorph, allSubmorphs) { aMorph.applyLayout(); },

    orderedSubmorphs: function(submorphs) {
        return submorphs
            .reject(function(ea) { return ea.isEpiMorph; })
            .sortBy(this.layoutOrder, this);
    },

    layoutOrder: function(aMorph) {
        // helps orderdSubmorphs order my morphs
        alert('warning: layoutOrder on abstract Layout');
        return aMorph.id;
    }
},
'accessors', {
  
    setContainer: function(aMorph) {
        // allows me to navigate to the container I belong to
        // todo: refactor layout, basicLayout, ...
        // I need this so LayoutConfigurator can instantly relayout me
        this.container = aMorph;
        aMorph.setLayouter(this);
        aMorph.applyLayout();
    },

    getContainer: function() {
        return this.container;
    },

    handlesSubmorphResized: function() { return !!this.resizeWithSubmorphs; },

    setHandlesSubmorphResized: function(bool) { this.resizeWithSubmorphs = bool },

    setSpacing: function(value) {
        this.spacing = value;
        if (this.getContainer()) this.getContainer().applyLayout();
    },

    getSpacing: function() {
        if (!this.spacing && this.spacing != 0) this.spacing = 15;
        return this.spacing;
    },

    setBorderSize: function(value) {
        this.borderSize = value;
        if (this.getContainer()) this.getContainer().applyLayout();
    },

    getMinHeight: function(container, submorphs) {
        alert('getMinHeight on abstract Layout');
        return 0;
    },

    getMinWidth: function(container, submorphs) {
        alert('getMinWidth on abstract Layout');
        return 0;
    },

    verticalBorderSpace: function() {
        return this.getBorderSize("top") + this.getBorderSize("bottom");
    },

    horizontalBorderSpace: function() {
        return this.getBorderSize("left") + this.getBorderSize("right");
    },

    getBorderSize: function(direction) {
        if (!direction) return this.getBorderSize("left");
        if (Object.isNumber(this.borderSize)) return this.borderSize;
        if (!this.borderSize) return this.borderSize = 10;
        return this.borderSize[direction];
    },

    getEffectiveExtent: function() {
        alert('calling abstract method lively.morphic.Layout.layout()');
    }

},
'placeholders', {

    displaysPlaceholders: function() {
        // does the layout class show placeholders when dragging a submorphs?
        return false;
    },

    showPlaceholderFor: function(morph, evt) {
        if (!this.container || !this.container.droppingEnabled) return;

        var placeholder = morph.obtainPlaceholder(this.container);
        if (!placeholder) return null;

        if (placeholder.owner !== this.container) {
          this.container.insertPlaceholder(placeholder);
        }

        var localPos = this.container
              .getGlobalTransform().inverse()
              .transformPoint(evt.getPosition());
        placeholder.setPosition(localPos);
        this.container.applyLayout();
    },

    removeAllPlaceholders: function() {
        this.container && this.container.submorphs
            .filterByKey('isPlaceholder').invoke("remove");
    }

},
'debugging', {
    toString: function() { return 'a ' + this.constructor.type }
});
Object.extend(lively.morphic.Layout, {
    translateClipMode: function(clipMode) {
        if (typeof(clipMode) === 'string') clipMode = {x: clipMode, y: clipMode};
        return clipMode
    },
    isHiddenClipMode: function(string) {
        return ['hidden', 'scroll', 'auto'].include(string)
    },
    calcActualLength: function(length, minimumLength, clipPolicy) {
        return length < minimumLength && !lively.morphic.Layout.isHiddenClipMode(clipPolicy) ?
            minimumLength : length;
    },
    widthClipHidden: function(morph) {
        var clipPolicy = lively.morphic.Layout.translateClipMode(morph.getInheritedClipMode());
        return this.isHiddenClipMode(clipPolicy.x)
    },
    heightClipHidden: function(morph) {
        var clipPolicy = lively.morphic.Layout.translateClipMode(morph.getInheritedClipMode());
        return this.isHiddenClipMode(clipPolicy.y)
    },

});

lively.morphic.Layout.Layout.subclass('lively.morphic.Layout.HorizontalLayout',
'default category', {

    basicLayout: function(container, submorphs) {
        this.keepContainerAtMinimumSize(container, submorphs);
        this.resizeFlexibleChildren(submorphs, container.getExtent());
    },

    resizeFlexibleChildren: function(submorphs, containerExtent) {
        var spacing = this.getSpacing(),
            flexChildWidth = this.calcFlexChildSpace(submorphs, containerExtent),
            borderSizeTop = this.getBorderSize("top"),
            childHeight = containerExtent.y - this.verticalBorderSpace();
        submorphs.reduce(function (x, morph) {
            var newWidth = morph.doesResize('width') ? flexChildWidth : morph.getExtent().x,
                newHeight = morph.doesResize('height') ? childHeight : morph.getExtent().y,
                topMargin = borderSizeTop;
            if (morph.layout && morph.layout.centeredVertical) {
                topMargin += (childHeight - morph.getExtent().y) / 2;
            }
            morph.setPositionTopLeft(pt(x, topMargin));
            var newExtent = lively.pt(newWidth, newHeight);
            if (!morph.getExtent().equals(newExtent)) {
                morph.setExtent(newExtent);
            }
            return x + morph.getExtent().x + spacing;
        }, this.getBorderSize("left"));
    },

    getFlexibleChildren: function(submorphs) {
        return submorphs.select(function(e) {
            return e.doesResize('width'); });
    },

    getMinSpaceFor: function(morph) {
        return morph.getMinWidth();
    },

    calcFlexChildrenSpace: function(submorphs, flexChildrenCount, containerExtent) {
        var spaceForSpacing = (submorphs.size() - 1) * this.getSpacing(),
            spaceForBorder = this.horizontalBorderSpace(),
            fixedChildrenWidth = submorphs.reduce(function (s, e) {
                return e.doesResize('width') ? s : s + e.getExtent().x }, 0);
        return containerExtent.x - fixedChildrenWidth - spaceForSpacing - spaceForBorder;
    },

    getMinWidth: function(container, submorphs) {
        var borderSpace = this.horizontalBorderSpace(),
            spacingSpace = (submorphs.size()-1) * this.getSpacing(),
            submorphSpace = submorphs.reduce(function (s, e) {
                return e.doesResize('width') ?  s + e.getMinWidth() : s + e.getExtent().x;
            }, 0);
        return borderSpace + spacingSpace + submorphSpace
    },

    getMinHeight: function(container, submorphs) {
        return this.verticalBorderSpace() +
            submorphs.reduce(function(h, morph) {
                return morph.getMinHeight() > h ? morph.getMinHeight() : h; }, 0);
    },

    layoutOrder: function(aMorph) {
        return aMorph.bounds().left();
    },

    displaysPlaceholders: function() {
        return true;
    },

    getEffectiveExtent: function(submorphs) {
        var v_submorphSpace = Math.max.apply(this, submorphs.collect(function (ea) {
                return !ea.doesResize('height') ? ea.getExtent().y : 0})),
            v_borderSpace = this.verticalBorderSpace(),
            h_borderSpace = this.horizontalBorderSpace(),
            h_spacingSpace = (submorphs.size()-1) * this.getSpacing(),
            h_submorphSpace = submorphs.reduce(function (s, e) {
                    return s + e.getExtent().x;}, 0);
        return pt(h_borderSpace + h_spacingSpace + h_submorphSpace, v_submorphSpace + v_borderSpace)
    }

});

lively.morphic.Layout.HorizontalLayout.subclass('lively.morphic.Layout.TightHorizontalLayout',
'default category', {
    handlesSubmorphResized: function() {
        return true;
    },

    basicLayout: function($super, container, submorphs) {
        this.preventTextsFromResizing(submorphs)
        $super(container, submorphs);
        this.adjustExtent(container, submorphs);
    },
    preventTextsFromResizing: function(submorphs) {
        submorphs.forEach(function(each) {
                if (typeof each["growOrShrinkToFit"] == 'function') {
                    if (each.layout && each.layout.resizeHeight) {
                        each.layout.resizeHeight = false;
                    }
                    each.growOrShrinkToFit();
                }
            });
    },

    adjustExtent: function(aMorph, allSubmorphs) {
        var minHeight = this.getMinHeight(aMorph, allSubmorphs);
        if (aMorph.getExtent().y != minHeight) {
            aMorph.setExtent(pt(aMorph.getExtent().x, minHeight));
        }
    }



});
lively.morphic.Layout.Layout.subclass('lively.morphic.Layout.VerticalLayout',
'default category', {
    basicLayout: function(container, submorphs) {
        this.keepContainerAtMinimumSize(container, submorphs);
        this.resizeFlexibleChildren(submorphs, container.getExtent());
    },
    resizeFlexibleChildren: function(submorphs, containerExtent) {
        var spacing = this.getSpacing(),
            flexChildHeight = this.calcFlexChildSpace(submorphs, containerExtent),
            borderSizeLeft = this.getBorderSize("left"),
            childWidth = containerExtent.x - this.horizontalBorderSpace();
        submorphs.reduce(function (y, morph) {
            var newHeight = morph.doesResize('height') ? flexChildHeight : morph.getExtent().y,
                newWidth = morph.doesResize('width') ? childWidth : morph.getExtent().x,
                leftMargin = borderSizeLeft;
            if (morph.layout && morph.layout.centeredHorizontal) {
                leftMargin += (childWidth - morph.getExtent().x) / 2;
            }
            morph.align(morph.bounds().topLeft(), pt(leftMargin, y));
            var newExtent = lively.pt(newWidth, newHeight);
            if (!morph.getExtent().equals(newExtent)) morph.setExtent(newExtent);
            return morph.bounds().bottom() + spacing;
        }, this.getBorderSize("top"));
    },

    getFlexibleChildren: function(submorphs) {
        return submorphs.select(function(e) { return e.doesResize('height') });
    },

    getMinSpaceFor: function(morph) { return morph.getMinHeight(); },

    calcFlexChildrenSpace: function(submorphs, flexChildrenCount, containerExtent) {
        var spaceForSpacing = (submorphs.size() - 1) * this.getSpacing(),
            spaceForBorder = this.verticalBorderSpace(),
            fixedChildrenHeight = submorphs.reduce(function (s, e) {
                return e.doesResize('height') ? s : s + e.getExtent().y }, 0);
        return containerExtent.y - fixedChildrenHeight - spaceForSpacing - spaceForBorder;
    },

    getMinHeight: function(container, submorphs) {
        var borderSpace = this.verticalBorderSpace(),
            spacingSpace = (submorphs.size()-1) * this.getSpacing(),
            submorphSpace = submorphs.reduce(function (s, e) {
                return e.doesResize('height') ? s + e.getMinHeight() : s + e.getExtent().y; }, 0);
        return borderSpace + spacingSpace + submorphSpace;
    },

    getMinWidth: function(container, submorphs) {
        return this.horizontalBorderSpace() +
            submorphs.reduce(function(w, morph) {
                return morph.getMinWidth() > w ? morph.getMinWidth() : w; }, 0);
    },

    layoutOrder: function(aMorph) {
        return aMorph.bounds().top()
             + this.verticalBorderSpace()
             + aMorph.owner ? aMorph.owner.submorphs.indexOf(aMorph) : 0;
     },

    getEffectiveExtent: function(submorphs) {
        var h_submorphSpace = Math.max.apply(this,submorphs.collect(function (ea) {
                return !ea.doesResize('width') ? ea.getExtent().x : 0})),
            h_borderSpace = this.horizontalBorderSpace(),
            v_borderSpace = this.verticalBorderSpace(),
            v_spacingSpace = (submorphs.size()-1) * this.getSpacing(),
            v_submorphSpace = submorphs.reduce(function (s, e) {
                    return s + e.getExtent().y;}, 0);
        return pt(h_submorphSpace + h_borderSpace, v_borderSpace + v_spacingSpace + v_submorphSpace)
    },

    displaysPlaceholders: function() { return true; }
});

lively.morphic.Layout.VerticalLayout.subclass('lively.morphic.Layout.VerticalScrollerLayout',
'default category', {
    keepContainerAtMinimumSize: function() {
        // The VerticalScrollerLayout does not keep the container at a minimum size.
    }

});

lively.morphic.Layout.VerticalLayout.subclass('lively.morphic.Layout.JournalLayout',
'default category', {

    basicLayout: function($super, container, submorphs) {
        if (!container.isRendered()) return;
        this.ensureOnlyFixedSubmorphs(submorphs);
        $super(container, submorphs);
        this.adjustExtent(container, submorphs);
    },

    ensureOnlyFixedSubmorphs: function(submorphs) {
        submorphs.forEach(function(each) {
            var l = each.layout;
            if (l && l.resizeHeight) l.resizeHeight = false;
            if (l && (l.resizeHeight || l.resizeWidth) && typeof each["growOrShrinkToFit"] == 'function')
                each.growOrShrinkToFit();
        });
    },

    isJournalLayout: function () { return true; },
    handlesSubmorphResized: function() { return true; },

    layoutOrder: function(aMorph) { return aMorph.bounds().top(); },

    displaysPlaceholders: Functions.True,

    adjustExtent: function(aMorph, allSubmorphs) {
        // if I resize with my submorphs, this will have an effect on my width only
        var minHeight = this.getMinHeight(aMorph, allSubmorphs);
        if (aMorph.getExtent().y != minHeight) {
            aMorph.setExtent(pt(aMorph.getExtent().x, minHeight));
        }
    },

    onSubmorphAdded: function($super, newOwner, morph, newOwnerSubmorphs) {
        if (morph.placeholder) {
            morph.setPosition(morph.placeholder.getPosition()
                .subPt(pt(0,1))) // position slightly above entry below
        };
        $super(newOwner, morph, newOwnerSubmorphs);
    }
});


lively.morphic.Layout.Layout.subclass('lively.morphic.Layout.GridLayout',
'properties', {
    defaultRowHeight: 50,
    defaultColWidth: 100
},
'initializing', {

    initialize: function(container, numberOfColumns, numberOfRows) {
        this.numCols = numberOfColumns;
        this.numRows = numberOfRows;
        this.morphsAdded = 0;
        this.rows = [];
        if (container) {
            this.setContainer(container);
        }
    },

    initializePlaceholders: function() {
        this.rows = this.rows || [];
        for (var y = 0; y < this.numRows; y++) {
            var row = this.rows[y] || [];
            for (var x = 0; x < this.numCols; x++) {
                // fill owner with placeholders if ncessary
                if (row[x]) continue;
                var m = new lively.morphic.Layout.GridLayoutPlaceholder(x, y);
                row[x] = m;
            }
            this.rows[y] = row;
        }
    },

},
'default category', {

    basicLayout: function(container, submorphs) {
        if (!container.isRendered()) return;
        var filteredSubmorphs = submorphs.filter(function(ea) { return !ea.isPlaceholder; });
        this.removeOldPlaceholders();
        this.initializePlaceholders();
        this.fillWithPlaceholders(container, filteredSubmorphs);
        this.adjustRowAndColSizes();
        this.adjustPositions();
    },

    fillWithPlaceholders: function(container, submorphs) {
        var submorphIndex = 0,
            that = this;
        submorphs.forEach(function(ea) {
            if (!ea.gridCoords) return;
            if (ea.gridCoords.y >= that.numRows || ea.gridCoords.x >= that.numCols) {
                return;
            }
            that.rows[ea.gridCoords.y][ea.gridCoords.x] = ea;
            submorphIndex++;
        });

        for (var y = 0; y < this.numRows; y++) {
            for (var x = 0; x < this.numCols; x++) {
                if (!this.rows[y][x].isPlaceholder) {
                    // this position has already been filled in the above loop
                } else if (submorphIndex <= submorphs.length - 1) {
                    this.rows[y][x] = submorphs[submorphIndex];
                    this.rows[y][x].gridCoords = pt(x,y);
                    submorphIndex++;
                } else {
                    // put a placeholder into container if we run out of submorphs
                    this.rows[y][x].gridCoords = pt(x,y);
                    container.addMorph(this.rows[y][x]);
                }
            }
        }
    },

    onSubmorphResized: function(aMorph, aSubmorph, allSubmorphs) {
        var gridCoords = aSubmorph.gridCoords,
            subExtent = aSubmorph.getExtent();

        if (aMorph.isInLayoutCycle) { return; }
        aMorph.isInLayoutCycle = true;
        if (aSubmorph.gridCoords) {
            for (var x = 0; x < this.numCols; x++) {
                var curCell = this.rows[gridCoords.y][x];
                curCell.setExtent(pt(curCell.getExtent().x, subExtent.y));
            }
            for (var y = 0; y < this.numRows; y++) {
                var curCell = this.rows[y][gridCoords.x];
                curCell.setExtent(pt(subExtent.x, curCell.getExtent().y));
            }
        }
        aMorph.isInLayoutCycle = false;
        aMorph.applyLayout();
    },

    onSubmorphRemoved: function($super, aMorph, aSubmorph, allSubmorphs) {
        if (aSubmorph.gridCoords) {
            delete aSubmorph.gridCoords;
        }
        $super(aMorph, aSubmorph, allSubmorphs);
    },

    handlesSubmorphResized: function() {
        return true;
    },

    layoutOrder: function(aMorph) {
        // something we need to think about!
          return aMorph.getCenter().x;
    },

    getColWidth: function(columnIndex) {
        var cellsInCol = this.rows.map(function(ea) { return ea[columnIndex]; });
        return cellsInCol.reduce(function(s, ea) { return Math.max(ea.getExtent().x, s); }, 0);
    },
    getRowHeight: function(rowIndex) {
        return this.rows[rowIndex].reduce(function(s, ea) {
            return Math.max(ea.getExtent().y, s); }, 0);
    },
    adjustRowAndColSizes: function() {
        this.colWidths = [];
        this.rowHeights = [];
        var x, y;
        for (x = 0; x < this.numCols; x++) {
            this.colWidths.push(this.getColWidth(x));
        }
        for (y = 0; y < this.numRows; y++) {
            var curRowHeight = this.getRowHeight(y);
            for (x = 0; x < this.numCols; x++) {
                this.rows[y][x].setExtent(pt(this.colWidths[x], curRowHeight));
            }
            this.rowHeights.push(curRowHeight);
        }

    },
    adjustPositions: function() {
        // this.rowHeights and this.colWidths are cached in adjustRowAndColSizes
        var distanceToTop = 0,
            distanceToLeft = 0;
        for (var y = 0; y < this.numRows; y++) {
            distanceToLeft = 0;
            for (var x = 0; x < this.numCols; x++) {
                this.rows[y][x].setPosition(pt(distanceToLeft, distanceToTop));
                distanceToLeft += this.colWidths[x];
            }
            distanceToTop += this.rowHeights[y];
        }
    },


    removeOldPlaceholders: function() {
        this.getContainer().submorphs.forEach(function(ea) {
            ea.isPlaceholder && ea.remove(); });
    }

});

lively.morphic.Morph.subclass('lively.morphic.Layout.GridLayoutPlaceholder',
'settings', {
    style: {
        borderWidth: 1,
        borderColor: Color.white,
        fill: Color.gray,
        extent: pt(100,50)
    },
    isPlaceholder: true
},
'default category', {
    initialize: function($super, x, y) {
        $super();
        this.layout = {resizeWidth: true, resizeHeight: true};
        this.gridCoords = pt(x, y);
    },
    addMorph: function($super, aMorph) {
        aMorph.gridCoords = this.gridCoords;
        this.gridCoords = undefined;
        var owner = this.owner;
        owner.addMorph(aMorph);
        owner.applyLayout();
        this.remove();
    },

});

lively.morphic.Layout.Layout.subclass('lively.morphic.Layout.ConstraintLayout',
'default category', {
    initialize: function($super, container) {
        $super(container);
        this.constraints = [];
        var containerExtent = this.getContainer().getExtent();
        this.extent = {};
        this.extent.x = new ClVariable(containerExtent.x);
        this.extent.y = new ClVariable(containerExtent.y);
        this.isUpAndRunning = true;
    },
    basicLayout: function(container, submorphs) {
        if (!this.isUpAndRunning) {
            return;
        }
        var solver = new ClSimplexSolver();
        this.constraints.forEach(function(ea) {
            solver.addConstraint(ea);
        });
        solver.addEditVar(this.extent.x);
        solver.addEditVar(this.extent.y);
        submorphs.forEach(function(ea) {
            var ci = ea.getLayoutConstraintInfo();
            solver.
                addStay(ci.extent.x).
                addStay(ci.extent.y).
                addStay(ci.position.x).
                addStay(ci.position.y);
        });

        solver.beginEdit();
        var extent = this.getContainer().getExtent();
        solver.suggestValue(this.extent.x, extent.x);
        solver.suggestValue(this.extent.y, extent.y);
        solver.resolve();
        submorphs.forEach(function(ea) { ea.getLayoutConstraintInfo().updateThisMorph(); });
    },


    handlesSubmorphResized: function() {
        return true;
    },

    onSubmorphRemoved: function($super, aMorph, aSubmorph, allSubmorphs) {
        aSubmorph.setLayoutConstraintInfo(undefined);
        $super(aMorph, aSubmorph, allSubmorphs);

        // TODO what happens to constraints that include variables from old layout info?
    },
    onSubmorphAdded: function($super, aMorph, aSubmorph, allSubmorphs) {
        var layoutInfo = new lively.morphic.Layout.ConstraintLayoutInfo(aSubmorph);
        aSubmorph.setLayoutConstraintInfo(layoutInfo);
        $super(aMorph, aSubmorph, allSubmorphs);
    },
    onSubmorphResized: function(aMorph, aSubmorph, allSubmorphs) {
        aMorph.applyLayout();
        // TODO two entry points for applyLayout: resize submorph or resize container
    },

    addConstraint: function(aConstraint) {
        this.constraints.push(aConstraint);
    }

});

Object.subclass('lively.morphic.Layout.ConstraintLayoutInfo',
'default category', {
    initialize: function(aMorph) { //, aSolver) {
        this.setMorph(aMorph);
        var extent = aMorph.getExtent(),
            position = aMorph.getPosition();
        this.position = {
            x: new ClVariable(position.x),
            y: new ClVariable(position.y)
        };
        this.extent = {
            x: new ClVariable(extent.x),
            y: new ClVariable(extent.y)
        };
    },

    setMorph: function(aMorph) {
        this.morph = aMorph;
    },
    getMorph: function() {
        return this.morph;
    },

    updateThisMorph: function() {
        var morph = this.getMorph();
        var newExtent = pt(
            this.extent.x.value(),
            this.extent.y.value())
        //alert('updateThisMorph ' + this.getMorph().getExtent() + ' -> ' + newExtent);
        morph.setExtent(newExtent);
        morph.setPosition(pt(
            this.position.x.value(),
            this.position.y.value()));
    },

});

lively.morphic.Layout.Layout.subclass('lively.morphic.Layout.TileLayout',
'default category', {
    initialize: function($super, aContainer) {
        $super(aContainer);
    },
    getMinWidth: function(container, submorphs) {
        return submorphs.reduce(function(s, e) {
            return (e.getExtent().x > s) ? e.getExtent().x : s; }, 0) +
            this.getBorderSize("left") + this.getBorderSize("right");
    },
    getMinHeight: function(container, submorphs) {
        return submorphs.reduce(function(s, e) {
            return (e.getExtent().y > s) ? e.getExtent().y : s; }, 0) +
            this.getBorderSize("top") + this.getBorderSize("bottom");
    },

    handlesSubmorphResized: function() {
        return true;
    },
    onSubmorphResized: function(aMorph, aSubmorph, allSubmorphs) {
        aMorph.applyLayout();
    },
    basicLayout: function(container, submorphs) {
        var width = this.getOptimalWidth(container, submorphs),
            currentRowHeight = 0,
            currentRowWidth = 0,
            spacing = this.getSpacing(),
            previousRowHeight = spacing,
            i = 0, rowSwitch = true;

        while (i < submorphs.length) {
            var submorphExtent = submorphs[i].getExtent();
            if (rowSwitch || currentRowWidth + submorphExtent.x + 2*spacing <= width) {
                rowSwitch = false;
                submorphs[i].setPosition(pt(
                        currentRowWidth + spacing,
                        previousRowHeight));
                currentRowHeight = Math.max(currentRowHeight, submorphExtent.y);
                currentRowWidth += spacing + submorphExtent.x;
                i++;
            } else {
                previousRowHeight += spacing + currentRowHeight;
                currentRowWidth = currentRowHeight = 0;
                rowSwitch = true;
            }
        }
    },
    getOptimalWidth: function(container, submorphs) {
        var width = container.getMaxVisibleWidth(),
            maxSubmorphWidth = this.getMinWidth(container, submorphs); // includes border size
        return Math.max(width, maxSubmorphWidth);
    },
    layoutOrder: function(aMorph) {
        var pos = aMorph.getPosition();
        // the following creates a drop zone that is 15 pixels tall.
        // allows for horizontal reordering.
        return (pos.y - pos.y % 15) * 1000000 + pos.x;
    },
    displaysPlaceholders: function() {
        return true;
    },

});

lively.morphic.Layout.JournalLayout.subclass("lively.morphic.Layout.TreeLayout",
'settings', {
    resizeWithSubmorphs: true
},
'initializing', {
    initialize: function($super, container) {
        $super(container);
        this.spacing = 0;
        var indent = this.container.isChild() ? 16 : 0;
        this.borderSize = {top: 0, right: 0, bottom: 0, left: indent};
        this.displaysPlaceholders = Functions.False;
        this.isDefered = false;
    }
},
'layouting', {
    orderedSubmorphs: function(submorphs) {
        return submorphs.reject(function(ea) {
            return ea.isEpiMorph || !ea.isLayoutable;
        });
    }
},
'updating', {
    defer: function() {
        this.isDefered = true;
        if (this.container.owner instanceof lively.morphic.Tree) {
            this.container.owner.getLayouter().defer();
        }
    },
    resume: function() {
        this.isDefered = false;
        var indent = this.container.isChild() ? 16 : 0;
        this.borderSize = {top: 0, right: 0, bottom: 0, left: indent};
        this.layout(this.container, this.container.submorphs);
        if (this.container.owner instanceof lively.morphic.Tree) {
            this.container.owner.getLayouter().resume();
        }
    },
    getMinWidth: function(container, submorphs) {
        return this.container.getRootTree().depth * 10;
    },
    layoutOrder: function(morph) {
        return this.container.submorphs.indexOf(morph);
    },
    onSubmorphAdded: function($super, aMorph, aSubmorph, allSubmorphs) {
        if (!this.isDefered) $super(aMorph, aSubmorph, allSubmorphs);
    },
    onSubmorphResized: function($super, aMorph, aSubmorph, allSubmorphs) {
        if (!this.isDefered) $super(aMorph, aSubmorph, allSubmorphs);
    },
    onSubmorphRemoved: function($super, aMorph, aSubmorph, allSubmorphs) {
        if (!this.isDefered) $super(aMorph, aSubmorph, allSubmorphs);
    }
});

lively.morphic.Layout.VerticalLayout.subclass('lively.morphic.Layout.AccordionLayout', {
    initialize: function($super, container) {
        $super(container);
        this.setBorderSize(1);
        this.setSpacing(0);
    },
    handlesSubmorphResized: function() {
        return true;
    },
    onSubmorphResized: function(container, submorph, submorphs) {
        this.layout(container, submorphs);
    },
    orderedSubmorphs: function(submorphs) {
        return submorphs.reject(function(ea) {
            return ea.isEpiMorph;
        });
    }
});

lively.morphic.Layout.Layout.subclass("lively.morphic.Layout.SimpleGridLayout",
"initializing", {
  initialize: function($super, container, nrows, ncols)  {
    this.nrows = nrows;
    this.ncols = ncols;
    $super(container);
  }
},
"testing", {
  displaysPlaceholders: function() {
    return true;
  }
},
"grid", {

  grid: function(container) {
    return container.innerBounds().grid(this.nrows, this.ncols);
  }

},
"morph hierarchy", {

  cellsDo: function(container, submorphs, doFunc) {
    // doFunc is called with 1. cell bounds 2. list if morphs in cell, 3. i 4. j
    var subm = submorphs.rejectByKey("isEpiMorph");
    var grid = this.grid(container) || [];

    return lively.lang.grid.map(grid, function(bounds, i, j) {
      var inside = subm.filter(function(m) {
        return bounds.containsPoint(m.bounds().center());
      });
      subm = subm.withoutAll(inside);
      return doFunc.call(null, bounds, inside, i, j);
    });
  },

  orderedSubmorphs: function(submorphs) {
    return this.cellsDo(this.container, submorphs || [],
      function(bounds, morphsInCell, i, j) { return morphsInCell; }).flatten();
  }

},
"layouting", {

  basicLayout: function(container, submorphs) {
    this.cellsDo(container, submorphs,
      function(bounds, morphsInCell, i, j) {
        if (!morphsInCell.length) return;
        morphsInCell.forEach(function(m) { m.setBounds(bounds); })
    });
  }

});

}); // end of module
