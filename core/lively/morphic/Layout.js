module('lively.morphic.Layout').requires('lively.morphic.Core', 'lively.morphic.Widgets'/*for Window*/ /*, 'apps.dwarfcassowary.js.DwarfCassowary'*/).toRun(function() {

lively.morphic.Morph.addMethods(
'layouting', {
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
            if (!spec) continue;
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

    setLayouter: function(aLayouter) {
        if (!this.layout) {
            this.layout = {};
        }
        this.layout.layouter = aLayouter;
        //this.adjustForNewBounds();
    },

    getLayouter: function() {
        if (!this.layout) {
            return undefined;
        }
        return this.layout.layouter;
    },
    getMinWidth: function() {
        if (!this.layout || this.layout.resizeWidth == false || this.layout.resizeWidth == undefined) {
            return this.getExtent().x;
        }
        if (this.getLayouter()) {
            return this.getLayouter().getMinWidth(this, this.getLayoutableSubmorphs());
        } else {
            return 0;
        }
    },
    getMinHeight: function() {
        if (!this.layout || this.layout.resizeHeight == false || this.layout.resizeHeight == undefined) {
            return this.getExtent().y;
        }
        if (this.getLayouter()) {
            return this.getLayouter().getMinHeight(this, this.getLayoutableSubmorphs());
        } else {
            return 0;
        }
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
        if (!layouter) {
            return;
        }
        layouter.layout(this, this.getLayoutableSubmorphs());
    },


    setPositionTopLeft: function(pos) {
        var topLeft = this.getBounds().topLeft(),
            nx, ny,
            cx, cy;
	      nx = pos.x;
	      ny = pos.y;
	      cx = this.getPosition().x;
	      cy = this.getPosition().y;
	      this.setPosition(pt(
	          nx + cx - topLeft.x,
            ny + cy - topLeft.y));
    },

    getLayoutableSubmorphs: function() {
        return this.submorphs.reject(function(ea) {
            return (ea.isEpiMorph || ea.isBeingDragged);
        });
    },

    getPositionInWorld: function() {
        // renamed to make absolutely sure it does not collide with Magnet>>getGlobalPosition..
        return this.getGlobalTransform().transformPoint(pt(0,0).subPt(this.getOrigin()));
    },
    obtainPlaceholder: function() {
        if (this.placeholder) {
            return this.placeholder
        }
        this.placeholder = this.createPlaceholder();
        return this.placeholder;
    },

    createPlaceholder: function() {
        this.placeholder = this.copy();
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
        if (!this.placeholder) return;
        var owner = this.placeholder.owner;
        this.placeholder.remove();
        delete this.placeholder;

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

});

Object.subclass('lively.morphic.Layout.Layout',
'default category', {
    layout: function(container, submorphs) {
        if (container.isInLayoutCycle) {
            return;
        }
        container.isInLayoutCycle = true;
        this.basicLayout(container, this.orderedSubmorphs(submorphs));
        container.isInLayoutCycle = false;
    },

    basicLayout: function(container, submorphs) {
        alert('calling abstract method lively.morphic.Layout.layout()');
    },

    getMinWidth: function(container, submorphs) {
        alert('getMinWidth on abstract Layout');
        return 0;
    },

    getBorderSize: function() {
        if (!this.borderSize && this.borderSize != 0) {
            this.borderSize = 10;
        }
        return this.borderSize;
    },

    getSpacing: function() {
        if (!this.spacing && this.spacing != 0) {
            this.spacing = 15;
        }
        return this.spacing;
    },

    handlesSubmorphResized: function() {
        return false;
    },
    onSubmorphAdded: function(aMorph, aSubmorph, allSubmorphs) {
        aMorph.applyLayout();
    },

    onSubmorphResized: function(aMorph, aSubmorph, allSubmorphs) {
        // by default, Layout behavior does not react to this
    },
    onSubmorphRemoved: function(aMorph, aSubmorph, allSubmorphs) {
        aMorph.applyLayout();
    },

    getMinHeight: function(container, submorphs) {
            alert('getMinHeight on abstract Layout');
            return 0;
        },

    isJournalLayout: function() {
        return false;
    },

    setBorderSize: function(value) {
        this.borderSize = value;
        if (this.getContainer()) {
            this.getContainer().applyLayout();
        }
    },
    setContainer: function(aMorph) {
        // allows me to navigate to the container I belong to
        // todo: refactor layout, basicLayout, ...
        // I need this so LayoutConfigurator can instantly relayout me
        this.container = aMorph;
        aMorph.applyLayout();
    },
    getContainer: function() {
        return this.container;
    },

    initialize: function(container) {
        this.defaultBorderSize = 10;
        this.defaultSpacing = 15;
        this.borderSize = 10;
        this.spacing = 15;
        if (container) {
            this.setContainer(container);
        }
    },
    orderedSubmorphs: function(submorphs) {
        return submorphs.reject(function(ea) {
            return ea.isEpiMorph
        }).sortBy(this.layoutOrder);
    },
    layoutOrder: function(aMorph) {
        // helps orderdSubmorphs order my morphs
        alert('warning: layoutOrder on abstract Layout');
        return aMorph.id;
    },


    setSpacing: function(value) {
        this.spacing = value;
        if (this.getContainer()) {
            this.getContainer().applyLayout();
        }
    },

},
'debugging', {
    toString: function() { return 'a ' + this.constructor.type },
    displaysPlaceholders: function() {
        // does the layout class show placeholders when dragging a submorphs?
        return false;
    },
    showPlaceholderFor: function(aMorph, anEvent) {
        if (!this.container ||  !this.container.droppingEnabled) {
            return;
        }
        var localPos = this.container.getGlobalTransform().
            inverse().transformPoint(anEvent.getPosition()); //.addPt(aMorph.getPosition());
        var placeholder = aMorph.obtainPlaceholder();
        if (!placeholder.isSubmorphOf(this.container)) {
            this.container.insertPlaceholder(placeholder);
        }
        placeholder.setPosition(localPos);
        this.container.applyLayout();
    },
    removeAllPlaceholders: function() {
        if (!this.container) { return; }
        this.container.submorphs.select(function(ea) { return ea.isPlaceholder; }).
            forEach(function(ea) { ea.remove(); });
    },

});

lively.morphic.Layout.Layout.subclass('lively.morphic.Layout.HorizontalLayout',
'default category', {

    basicLayout: function(container, submorphs) {
        var extent = container.getExtent(),
            width = extent.x,
            height = extent.y,
            borderWidth = this.getBorderSize(),
            spacing = this.getSpacing(),
            childHeight = height - 2*borderWidth,
            fixedChildrenWidth = submorphs.reduce(function (s, e) {
                return (!e.layout || !e.layout.resizeWidth) ? s + e.getExtent().x : s }, 0),
            varChildren = submorphs.select(function(e) {
                return e.layout && e.layout.resizeWidth; }),
            varChildrenCount = varChildren.size(),
            varChildrenWidth = extent.x - fixedChildrenWidth
                             - (submorphs.size() - 1) * spacing - 2 * borderWidth,
            varChildWidth = varChildrenWidth / varChildrenCount;

        varChildren.forEach(function (each) {
            if (each.getMinWidth() > varChildWidth) {
                varChildrenWidth -= each.getMinWidth();
                varChildrenCount -= 1;
            }
        });

        varChildWidth = varChildrenWidth / varChildrenCount;

        var minWidth = this.getMinWidth(container, submorphs),
            minHeight = this.getMinHeight(container, submorphs);
        if (width < minWidth || height < minHeight) {
            if (width < minWidth) width = minWidth;
            if (extent.y < minHeight) height = minHeight;
            container.setExtent(pt(width, height));
        }

        submorphs.reduce(function (x, morph) {
            morph.setPositionTopLeft(pt(x, borderWidth));
            var newWidth = morph.getExtent().x,
                newHeight = (morph.layout != undefined && morph.layout.resizeHeight == true) ?
                childHeight :
                morph.getExtent().y;
            if (morph.layout && morph.layout.resizeWidth) newWidth = varChildWidth;
            morph.setExtent(pt(newWidth, newHeight));
            return x + morph.getExtent().x + spacing;
        }, borderWidth);
    },

        getMinWidth: function(container, submorphs) {

            return 2 * this.getBorderSize() +
                (submorphs.size()-1) * this.getSpacing() +
                submorphs.reduce(function (s, e)
		    {if (e.layout == undefined || e.layout.resizeWidth == false || e.layout.resizeWidth == undefined)
		        {return s + e.getExtent().x;}
	            else
                        {return s + e.getMinWidth();}}, 0);

        },
	getMinHeight: function(container, submorphs) {
            return 2 * this.getBorderSize() +
                submorphs.reduce(function(h, morph)
		    {if (morph.getMinHeight() > h)
			{return morph.getMinHeight();}
		    else
			{return h;}}, 0);
        },
    handlesSubmorphResized: function() {
        return false;
    },

	layoutOrder: function(aMorph) {
		return aMorph.getCenter().x;
    },
    displaysPlaceholders: function() {
        return true;
    },




});

lively.morphic.Layout.HorizontalLayout.subclass('lively.morphic.Layout.TightHorizontalLayout',
'default category', {
    handlesSubmorphResized: function() {return true;},
    onSubmorphResized: function(aMorph, aSubmorph, allSubmorphs) {
        //if (aMorph.isInLayoutCycle) return;
        //this.layout(aMorph, allSubmorphs);
        var minHeight = this.getMinHeight(aMorph, allSubmorphs);
        if (aMorph.getExtent().y != minHeight) {
            aMorph.setExtent(pt(aMorph.getExtent().x, minHeight));
        }
    },
    basicLayout: function($super, container, submorphs) {
        // this type of layout does not allow Texts to be dynamically resized
        submorphs.forEach(function(each) {
                if (typeof each["growOrShrinkToFit"] == 'function') {
                    if (each.layout && each.layout.resizeHeight) {
                        each.layout.resizeHeight = false;
                    }
                    each.growOrShrinkToFit();
                }
            });

        $super(container, submorphs);
        var minHeight = this.getMinHeight(container, submorphs);
        if (container.getExtent().y != minHeight) {
            container.setExtent(pt(container.getExtent().x, minHeight));
        }
    },


});
lively.morphic.Layout.Layout.subclass('lively.morphic.Layout.VerticalLayout',
'default category', {

    basicLayout: function(container, submorphs) {
        var extent = container.getExtent();
        var width = extent.x;
        var height = extent.y;
        var borderWidth = this.getBorderSize();
        var spacing = this.getSpacing();
        var childWidth = width - 2*borderWidth;

        var fixedChildrenHeight = submorphs.reduce(function(s, e) {
            return !e.layout || !e.layout.resizeHeight ?
                s + e.getExtent().y : s;
        }, 0);

        var varChildren = submorphs.select(function(e) {
                return e.layout && e.layout.resizeHeight; }),
            varChildrenCount = varChildren.size();

        var varChildrenHeight = extent.y -
            fixedChildrenHeight -
            (submorphs.size() - 1) * spacing -
            2 * borderWidth;

        var varChildHeight = varChildrenHeight / varChildrenCount;
        varChildren.forEach(function (each) {
            if (each.getMinHeight() > varChildHeight) {
                varChildrenHeight -= each.getMinHeight();
                varChildrenCount -= 1;
            }
        });
        varChildHeight = varChildrenHeight / varChildrenCount;

        var minWidth = this.getMinWidth(container, submorphs);
        var minHeight = this.getMinHeight(container, submorphs);
        if (width < minWidth || height < minHeight) {
            if (width < minWidth) width = minWidth;
            if (extent.y < minHeight) height = minHeight;
            container.setExtent(pt(width, height));
        }

        submorphs.reduce(function (y, morph) {
            morph.setPositionTopLeft(pt(borderWidth, y));
            var newHeight = morph.getExtent().y;
            var newWidth = (morph.layout && morph.layout.resizeWidth == true) ?
                childWidth :
                morph.getExtent().x;
            if (morph.layout && morph.layout.resizeHeight) {
                newHeight = varChildHeight;
            }
            morph.setExtent(pt(newWidth, newHeight));
            return y + morph.getExtent().y + spacing;
        }, borderWidth);
    },

	getMinHeight: function(container, submorphs) {

            return 2 * this.getBorderSize() +
                (submorphs.size()-1) * this.getSpacing() +
                submorphs.reduce(function (s, e)
		    {if (e.layout == undefined || e.layout.resizeHeight == false || e.layout.resizeHeight == undefined)
		        {return s + e.getExtent().y;}
	            else
		        {return s + e.getMinHeight();}}, 0);

        },
	getMinWidth: function(container, submorphs) {
            return 2 * this.getBorderSize() +
                submorphs.reduce(function(w, morph)
		    {if (morph.getMinWidth() > w)
			{return morph.getMinWidth();}
		    else
			{return w;}}, 0);
        },

        getEffectiveHeight: function(container, submorphs) {
            return 2 * this.getBorderSize() +
                (submorphs.size()-1) * this.getSpacing() +
                submorphs.reduce(function (s, e) {
                    return s + e.getExtent().y}, 0);
        },
	layoutOrder: function(aMorph) {
		//return aMorph.getCenter().y;
                return aMorph.getPosition().y;
    },
    displaysPlaceholders: function() {
        return true;
    },

});

lively.morphic.Layout.VerticalLayout.subclass('lively.morphic.Layout.JournalLayout',
'default category', {

    basicLayout: function($super, container, submorphs) {
        // only fixed sized submorphs are allowed in this layout
        submorphs.forEach(function(each) {
            if (each.layout && each.layout.resizeHeight) {
                each.layout.resizeHeight = false;
            }
            if (typeof each["growOrShrinkToFit"] == 'function') {
                each.growOrShrinkToFit();
            }
        });
        $super(container, submorphs);
        if (this.getEffectiveHeight(container, submorphs) != container.getExtent().y) {
            container.setExtent(
                pt(container.getExtent().x,
                this.getEffectiveHeight(container, submorphs)));
        }
    },

    isJournalLayout: function () {
        return true;
    },
    handlesSubmorphResized: function() {
        return true;
    },
    onSubmorphResized: function(aMorph, aSubmorph, allSubmorphs) {
        var effectiveHeight = this.getEffectiveHeight(aMorph, allSubmorphs);
        if (aMorph.getExtent().y != effectiveHeight) {
            aMorph.setExtent(pt(aMorph.getExtent().x, effectiveHeight));
        }
    },

    displaysPlaceholders: Functions.True

});


lively.morphic.Layout.Layout.subclass('lively.morphic.Layout.GridLayout',
'properties', {
    defaultRowHeight: 50,
    defaultColWidth: 100
},
'default category', {

    basicLayout: function(container, submorphs) {
        var filteredSubmorphs = submorphs.filter(function(ea) { return !ea.isPlaceholder;});
        this.removeOldPlaceholders();
        this.initializePlaceholders();
        this.fillWithPlaceholders(container, filteredSubmorphs);
        this.adjustRowAndColSizes();
        this.adjustPositions();
    },
    fillWithPlaceholders: function(container, submorphs) {
        var submorphIndex = 0;
        var that = this;
        submorphs.forEach(function(ea) {
            if (ea.gridCoords) {
                if (ea.gridCoords.y >= that.numRows || ea.gridCoords.x >= that.numCols) {
                    return;}
                that.rows[ea.gridCoords.y][ea.gridCoords.x] = ea;
                submorphIndex++;}
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

    initialize: function(container, numberOfColumns, numberOfRows) {
        this.numCols = numberOfColumns;
        this.numRows = numberOfRows;
        this.morphsAdded = 0;
        this.rows = [];
        if (container) this.setContainer(container);
    },
    initializePlaceholders: function() {
        this.rows = [];
        for (var y = 0; y < this.numRows; y++) {
            var row = []
            for (var x = 0; x < this.numCols; x++) {
                //fill owner with placeholders
                var m = new lively.morphic.Layout.GridLayoutPlaceholder(x, y);
                row.push(m);
            }
            this.rows.push(row);
        }
    },
    getColWidth: function(columnIndex) {
        var cellsInCol = this.rows.map(function(ea) { return ea[columnIndex]; });
        return cellsInCol.reduce(function(s, ea) {return Math.max(ea.getExtent().x, s);}, 0);
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
    },
});

lively.morphic.Morph.subclass('lively.morphic.Layout.GridLayoutPlaceholder',
'settings', {
    style: {
        borderWidth: 1,
        borderColor: Color.white,
        fill: Color.gray,
        extent: pt(100,50)
    },
    isPlaceHolder: true
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
    },













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
            2 * this.getBorderSize();
    },
    getMinHeight: function(container, submorphs) {
        return submorphs.reduce(function(s, e) {
            return (e.getExtent().y > s) ? e.getExtent().y : s; }, 0) +
            2 * this.getBorderSize();
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
            previousRowHeight = this.getSpacing(),
            i = 0;

        while (i < submorphs.length) {
            var submorphExtent = submorphs[i].getExtent();
            if (currentRowWidth + submorphExtent.x <= width) {
                submorphs[i].setPosition(pt(
                        currentRowWidth + this.getSpacing(),
                        previousRowHeight));
                currentRowHeight = Math.max(currentRowHeight, submorphExtent.y);
                currentRowWidth += this.getSpacing() + submorphExtent.x;
                i++;
            } else {
                previousRowHeight += this.getSpacing() + currentRowHeight;
                currentRowWidth = currentRowHeight = 0;
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

}); // end of module
