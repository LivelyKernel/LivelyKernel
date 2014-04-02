module('lively.morphic.TabMorphs').requires('lively.morphic.Core').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.TabContainer',
'documentation', {
    example: function() {
        var c = new lively.morphic.TabContainer();
        c.tabBar.addTabLabeled('1');
        c.activePane().addMorph(lively.newMorph({style: {fill: Color.red}}))
        c.tabBar.addTabLabeled('2');
        c.activePane().addMorph(lively.newMorph({style: {fill: Color.green}}))
        c.setExtent(pt(300,200))
        c.openInWorld();
        return c;
    }
},
'settings', {
    style: {
        borderWidth: 1,
        borderColor: Color.gray,
        adjustForNewBounds: true
    },
    isTabContainer: true
},
'initializing', {

    initialize: function($super, optTabBarStrategy) {
        $super();
        var tabBarStrategy = optTabBarStrategy || new lively.morphic.TabStrategyTop();
        this.setTabBarStrategy(tabBarStrategy);
        this.tabPaneExtent = pt(600,400);
        this.initializeTabBar();
        var newExtent = this.getTabBarStrategy().
            calculateInitialExtent(this.tabBar, this.tabPaneExtent);
        this.setExtent(newExtent);
        tabBarStrategy.applyTo(this);
    },

    initializeTabBar: function() {
        this.tabBar = new lively.morphic.TabBar(this);
        this.addMorph(this.tabBar);
    },
    getTabBarStrategy: function() {
        if (!this.tabBarStrategy) alert('TabContainer does not have a tab bar strategy');
        return this.tabBarStrategy;
    },
    setTabBarStrategy: function(aStrategy) {
        this.tabBarStrategy = aStrategy;
        aStrategy.applyTo(this);
    },

    getTabPaneExtent: function() {
        return this.tabPaneExtent;
    },
    setTabPaneExtent: function(aPoint) {
        this.tabPaneExtent = aPoint;
    },

    addTabLabeled: function(aString) {
        return this.tabBar.addTabLabeled(aString);
    },
    getTabBar: function() {
        return this.tabBar;
    },
    getTabByName: function(aString) {
        return this.getTabBar().getTabByName(aString);
    },
    getTabNames: function() {
        return this.getTabBar().getTabs().map(function(ea) { return ea.getName(); });
    },

    addTabPane: function(aTabPane) {
        aTabPane.layout = aTabPane.layout || {};
        aTabPane.layout.adjustForNewBounds = true;
        this.addMorph(aTabPane);
        this.getTabBarStrategy().
            adjustPanePositionInContainer(aTabPane, this);
    },
    onResizePane: function(aPoint) {
        this.setTabPaneExtent(aPoint);
        this.getTabBar().adjustTabSizes(aPoint);
        this.setExtent(this.getTabBarStrategy().
            containerExtent(aPoint, this.getTabBar().getExtent()));
        this.getTabBarStrategy().adjustTabBar(this.getTabBar(), aPoint);
    },
    activateTab: function(aTab) {
        this.getTabBar().activateTab(aTab);
    },
    morphMenuItems: function($super) {
        var self = this, items = $super();
        var otherContainers = this.world().withAllSubmorphsSelect(function(ea) { return ea.isTabContainer; });

        items.push(['adopt tab', otherContainers.map(function (container) {
                return [container.toString(), container.getTabNames().map(function (tabName) {
                        return [tabName, function(evt) {
                                self.adoptTabFromContainer(container.getTabByName(tabName), container);
                            }];
                    })];
            }
        )]);

        items.push([
            'Tab Bar Strategy', [
                ['Top', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyTop());}],
                ['Left', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyLeft());}],
                ['Bottom', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyBottom());}],
                ['Right', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyRight());}],
                ['Hide', function() {
                    self.setTabBarStrategy(new lively.morphic.TabStrategyHide());}]
            ]
        ]);
        return items;
    },

    adoptTabFromContainer: function(aTab, aContainer) {
        if (aTab.constructor.name == 'String') {
            aTab = aContainer.getTabByName('Bar');
        }
        aContainer.getTabBar().removeTab(aTab);
        this.getTabBar().addTab(aTab);
    },

    panes: function() {
        return this.getTabBar().getTabs().invoke('getPane');
    },

    activeTab: function() {
        return this.getTabBar().getTabs().detect(function(ea) { return ea.isActive });
    },

    activePane: function() {
        return this.activeTab().getPane();
    },
    adjustForNewBounds: function($super) {
        // resizedPanes holds a list that can be checked against endless recursion while setting the extent of the TabPanes
        $super();
        delete(this.resizedPanes);
    },

});

lively.morphic.Morph.subclass('lively.morphic.TabBar',
'settings', {
    style: {
        fill: Color.gray,
        borderWidth: 1,
        borderColor: Color.gray,
        enableDragging: false,
        enableGrabbing: false
    },
    isTabBar: true
},
'initializing', {

    initialize: function($super, tabContainer) {
        $super();
        this.tabContainer = tabContainer;
        var width = tabContainer.getTabBarStrategy().getTabBarWidth(tabContainer);
        this.setExtent(pt(width, this.getDefaultHeight()));
        this.tabs = [];
    }

},
'accessing', {
    getDefaultHeight: function() {
        return this.defaultHeight || 30;
    },
    setDefaultHeight: function(height) {
        this.defaultHeight = height;
    },


    getTabs: function() {
        return this.tabs;
    },

    addTab: function(aTab) {
        this.tabs.push(aTab);
        aTab.addTo(this);
        this.rearrangeTabs();
        this.adjustTabSizes(this.getTabContainer().getTabPaneExtent());
        this.activateTab(aTab);
        return aTab;
    },

    addTabLabeled: function(aLabelString) {
        var tab = new lively.morphic.Tab(this);
        tab.setLabel(aLabelString);
        return this.addTab(tab);
    },

    removeTab: function(aTab) {
        if (aTab.isActive) {
            var idx = this.getTabs().indexOf(aTab);
            var newActive = (idx == this.getTabs().length - 1)
                ? this.getTabs()[idx - 1]
                : this.getTabs()[idx + 1];
            if (newActive) this.activateTab(newActive);
        }
        aTab.getPane().remove();
        aTab.remove();
        this.unregisterTab(aTab);
    },

    getTabContainer: function() {
        return this.tabContainer;
    }
},
'tab handling', {

    unregisterTab: function(aTab) {
        this.tabs = this.tabs.without(aTab);
        this.rearrangeTabs();
    },

    rearrangeTabs: function() {
        var offset = 0;
        this.getTabs().forEach(function(ea) {
            ea.setTabBarOffset(offset);
            offset = ea.getNextTabBarOffset();
        });
    },

    getTabByName: function(aString) {
        // alternative implementation: in TabStrategyHide>>adjustTabBar
        //   do not set TabBar extent to pt(0,0) but call remove. In this case,
        //   we would need a different lookup here:
        //aTab = this.getTabs().detect(function (ea) { return aTab === ea.getName(); });
        return this.get(aString);
    },

    activateTab: function(aTab) {
        this.getTabs().invoke('deactivate');
        if (Object.isString(aTab)) aTab = this.getTabByName(aTab);
        aTab.activate();
    },

    deactivateTab: function(aTab) {
        aTab.deactivate();
    }
},
'menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'add tab', function(evt) {
            self.addTabLabeled('New Tab');
        }])
        return items;
    },
},
'layouting', {

    onResizePane: function(initiator, newExtent, deltaX) {
        // Tabs call this method when their pane's extent has changed.
        // All other tabs in the group will be resized accordingly.

        alert("TODO implement TabBar>>onResizePane using container's strategy");

        /*this.moveBy(pt(deltaX, 0));
        this.getTabs().forEach(function(ea) {
            ea.isInLayoutCycle = true;
            //ea.moveBy(pt(deltaX, 0));
            ea.resizePane(newExtent);
            delete ea.isInLayoutCycle;});
        this.getTabs().without(initiator).forEach(function(ea) {
            var pos = ea.pane.getPosition();
            ea.pane.setPosition(pt(pos.x - deltaX, pos.y));});
        var bounds = initiator.getBounds();
        this.setExtent(pt(this.getExtent().x, bounds.bottomRight().subPt(bounds.topLeft()).y ));*/
    },

    adjustTabSizes: function(aPoint) {
        if (!this.adjustedTabSizes) {
            var self = this;
            this.getTabs().forEach(function(ea) {
                self.adjustedTabSizes = true;
                ea.getPane().adjustToNewContainerSize(aPoint);
            });
        }
        this.setExtent(this.getTabContainer().getTabBarStrategy().
            tabBarExtent(this.getTabContainer()));

    }

});

lively.morphic.Morph.subclass('lively.morphic.Tab',
'settings', {
    isTab: true
},
'initializing', {

    initialize: function($super, tabBar) {
        $super();
        this.tabBar = tabBar;
        this.tabBarOffset = 0;
        this.setFill(this.getInactiveFill());
        this.setBorderWidth(1);
        this.setBorderColor(Color.gray);
        this.layout = {adjustForNewBounds: true};
        this.initializePane(this.getTabContainer().getTabPaneExtent());
        this.initializeLabel('Tab');
        this.draggingEnabled = this.grabbingEnabled = false;
        var labelExtent = this.label.getExtent();
        this.setExtent(pt(labelExtent.x + 10, labelExtent.y + 10));
        this.setClipMode('hidden');
        this.addCloseButton();
    },

    initializePane: function(extent) {
        this.pane = new lively.morphic.TabPane(this, extent);
    },

    initializeLabel: function(aString) {
        var labelHeight = 20;
        this.label = new lively.morphic.Text(new Rectangle(0, 0, 80, labelHeight));
        this.label.applyStyle({fixedWidth: false, fixedHeight: false});
        this.setLabel(aString);
        this.label.fit();
        this.label.setPosition(pt(5, 5));
        this.label.beLabel();
        this.label.disableEvents();
        this.addMorph(this.label);
    },

    addCloseButton: function() {
        var closer = new lively.morphic.Button,
            padding = 5,
            extent = this.getExtent().y - (padding *2)
        closer.setLabel("X")
        closer.label.fit();
        closer.setExtent(pt(extent,extent))
        this.addMorph(closer)
        closer.setPosition(pt(this.getExtent().x - extent - padding,padding))
        closer.layout = {moveHorizontal: true};
        connect(closer, "fire", this, "closeTab", {});
        this.closeButton = closer;
        return this;
    }

},
'accessing', {

    getTabContainer: function() {
        return this.getTabBar().getTabContainer();
    },
    setLabel: function(aString) {
        this.label.textString = aString;
        this.label.fit();
        this.setName(aString);
        this.getPane().setName(aString + ' - Pane');
        var extraSpace = this.closeButton ? 30 : 10;
        this.setExtent(pt(this.label.getExtent().x + extraSpace, this.label.getExtent().y + 10));
        this.getTabBar().rearrangeTabs();
        this.setToolTip(aString);
    },
    getLabel: function() {
        return this.label.textString;
    },
    getTabBar: function() {
        return this.tabBar;
    },
    setTabBar: function(aTabBar) {
        this.tabBar = aTabBar;
    },
    getPane: function() {
        return this.pane;
    },
},
'events', {
    onMouseDown: function(evt) {
        this.getTabBar().activateTab(this);
    },
    resizePane: function(newExtent) {
        this.pane.isInResizeCycle = true;
        this.pane.setExtent(newExtent);
        delete this.pane.isInResizeCycle;
    }
},
'morph menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'set label', function(evt) {
                $world.prompt('Set label', function(input) {
                    if (input !== null)
                        self.setLabel(input || '');
                }, self.getLabel());
            }]);
        items.push([
            'remove tab', function(evt) {
                self.getTabBar().removeTab(self);
            }]);
        return items;
    },
},
'tabbing', {
    remove: function($super) {
        if (!this.isInActivationCycle && this.getTabBar()) {
            // In order to activate a tab, we call remove and then addMorph.
            // In that case, we don't want to remove it permanently.
            this.getTabBar().unregisterTab(this);
        }
        $super();
    },
    addTo: function(aTabBar) {
        var container = aTabBar.getTabContainer(),
            pane = this.getPane();
        this.setTabBar(aTabBar);
        aTabBar.addMorph(this);
        container.addTabPane(pane);
    },
    getNextTabBarOffset: function() {
        return this.tabBarOffset + this.getExtent().x;
    },
    setTabBarOffset: function(anInteger) {
        this.tabBarOffset = anInteger;
        var position = this.getPosition();
        this.setPosition(pt(anInteger, position.y));
    },
    activate: function() {
        var that = this;
        this.isInActivationCycle = true;
        this.getPane().remove();
        this.getTabContainer().addTabPane(this.getPane());
        this.setFill(this.getActiveFill());
        this.label.applyStyle({fontWeight:'bold'});
        this.label.fit();
        delete this.isInActivationCycle;
        this.isActive = true;
        this.getPane().onActivate();
    },
    deactivate: function() {
        this.setFill(this.getInactiveFill());
        this.label.applyStyle({fontWeight:null});
        this.label.fit();
        this.isActive = false;
    },
    getActiveFill: function() { return Color.white; },
    getInactiveFill: function() { return Color.gray; },

    closeTab: function() {
        var toolPane = this.owner.owner;
        this.owner.removeTab(this);
        if(toolPane.tabBar.getTabs().length == 0) {
            if (toolPane.owner instanceof lively.morphic.Window)
                toolPane.owner.remove();
        }
    }
});

lively.morphic.Morph.subclass('lively.morphic.TabPane',
'settings', {
    style: {
        fill: Color.white,
        borderWidth: 1,
        borderColor: Color.gray,
        enableDragging: false,
        enableGrabbing: false,
        adjustForNewBounds: true,
        resizeWidth: true,
        resizeHeight: true
    },
    isTabPane: true
},
'initializing', {

    initialize: function($super, tab, extent) {
        $super();
        this.tab = tab;
        this.tabBar = tab.getTabBar();
        this.setExtent(extent);
    },
    getTab: function() {
        return this.tab;
    },
    getTabContainer: function() {
        var t = this.getTab();
        return t && t.getTabContainer();
    },
    activateTab: function(aTab) {
        // convenience: allow my submorphs to call
        // this.owner.activateTab(...) to navigate
        this.getTabContainer().activateTab(aTab);
    },

    setExtent: function($super, aPoint) {
        $super(aPoint);
        var container = this.getTabContainer();
        if (!container) return aPoint;
        this.adjustClipping(aPoint);
        container.resizedPanes = container.resizedPanes || new Array();
        // TODO refactor: either resizedPanes list or isInResizeCycle, not both!
        if (container.resizedPanes.indexOf(this.id) < 0) {
            container.resizedPanes.push(this.id);
            if (!this.isInResizeCycle) {
                container.onResizePane(aPoint);
            }
        }
        return aPoint;
    },

    remove: function($super) {
        $super();
        var tab = this.getTab();
        if (!tab.isInActivationCycle) {
            this.tab.remove();
        }
    },
    adjustToNewContainerSize: function(aPoint) {
        this.isInResizeCycle = true;
        this.setExtent(aPoint);
        delete this.isInResizeCycle;
    },
    onActivate: function() {
        // hook for applications
    },
    adjustClipping: function(aPoint) {
        // The subBounds are recomputed, because the cached bounds (this.getBounds()) are
        // cropped if we already are in scroll mode, and wrong if one of our submorphs
        // moved due to a setPosition call
        var tfm = this.getTransform(),
            bounds = this.innerBounds();

        bounds = tfm.transformRectToRect(bounds);
        var subBounds = this.submorphBounds(tfm);

        var sbBr = subBounds && subBounds.bottomRight(),
            thisBr = bounds.bottomRight();
        if (subBounds && !sbBr.leqPt(thisBr)) {
            this.setClipMode({
                x: sbBr.x > thisBr.x ? 'scroll': 'visible',
                y: sbBr.y > thisBr.y ? 'scroll': 'visible'});
        } else {
            this.setClipMode('visible');
        }
    },

    addMorph: function($super, aMorph) {
        var returnValue = $super(aMorph);
        this.adjustClipping(this.getExtent());
        return returnValue
    },

    removeMorph: function($super, aMorph) {
        $super(aMorph);
        this.adjustClipping(this.getExtent());
    }

});

Object.subclass('lively.morphic.TabStrategyAbstract',
'default category', {

    applyTo: function(aContainer) {
        var that = this,
            tabBar = aContainer.getTabBar();
        if (!tabBar) { // tabBar might not exist, e.g. when calling from TabContainer>>initialize
            return;
        }
        var tabs = tabBar.getTabs(),
            tabPanes = tabs.map(function(ea) { return ea.getPane(); }),
            paneExtent = aContainer.getTabPaneExtent();
        this.adjustTabBar(tabBar, paneExtent);
        tabBar.setExtent(this.tabBarExtent(aContainer));
        tabPanes.forEach(function(ea) {
            that.adjustPanePositionInContainer(ea, aContainer); });
        aContainer.setExtent(this.containerExtent(paneExtent, tabBar.getExtent()));
    },

    adjustTabBar: function(aTabBar, paneExtent) {
        throw "TabStrategyAbstract>>adjustTabBar: subclassResponsibility";
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
         throw "TabStrategyAbstract>>calculateInitialExtent: subclassResponsibility";
    },

    getTabBarWidth: function(aContainer) {
         throw "TabStrategyAbstract>>getTabBarWidth: subclassResponsibility";
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
         throw "TabStrategyAbstract>>adjustPanePositionInContainer: subclassResponsibility";
    },

    tabBarExtent: function(aContainer) {
         throw "TabStrategyAbstract>>tabBarExtent: subclassResponsibility";
    },

    containerExtent: function(paneExtent, tabBarExtent) {
         throw "TabStrategyAbstract>>containerExtent: subclassResponsibility";
    },

});

lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyTop',
'default category', {

    adjustTabBar: function(aTabBar) {
        aTabBar.setPosition(pt(0,0));
        aTabBar.setRotation(0);
        aTabBar.layout = {adjustForNewBounds: true, resizeWidth: true};
        aTabBar.setExtent(pt(aTabBar.getTabContainer().getTabPaneExtent().x, aTabBar.getDefaultHeight()));
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        var tabBarExtent = tabBar.getExtent();
        return pt(Math.max(tabBarExtent.x, tabPaneExtent.x),
                  tabBarExtent.y + tabPaneExtent.y);
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().x;
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(
            0,
            aTabContainer.getTabBar().getExtent().y));
    },

    tabBarExtent: function(aContainer) {
        return pt(aContainer.getTabPaneExtent().x, aContainer.getTabBar().getDefaultHeight());
    },

    containerExtent: function(paneExtent, tabBarExtent) {
        return pt(paneExtent.x, tabBarExtent.y + paneExtent.y);
    }

});

lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyRight',
'default category', {

    adjustTabBar: function(aTabBar) {
        var barExtent = pt(aTabBar.getExtent(), aTabBar.getDefaultHeight());
        aTabBar.setExtent(barExtent);
        aTabBar.setPosition(pt(
            aTabBar.getTabContainer().getTabPaneExtent().x + barExtent.y,
            0));
        aTabBar.setRotation(Math.PI/2);
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        var tabBarExtent = tabBar.getExtent();
        return pt(  tabBarExtent.y + tabPaneExtent.x,
                    tabPaneExtent.y);
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().y;
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(0, 0));
    },

    tabBarExtent: function(aContainer) {
        return pt(aContainer.getTabPaneExtent().y, aContainer.getTabBar().getDefaultHeight());
    },

    containerExtent: function(paneExtent, tabBarExtent) {
        return pt(paneExtent.x + tabBarExtent.y, paneExtent.y);
    }

});

lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyBottom',
'default category', {

    adjustTabBar: function(aTabBar) {
        aTabBar.setPosition(pt(0, aTabBar.getTabContainer().getTabPaneExtent().y));
        aTabBar.setRotation(0);
        aTabBar.layout = {adjustForNewBounds: true, resizeWidth: true};
        aTabBar.setExtent(pt(aTabBar.getExtent().x, aTabBar.getDefaultHeight()));
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        var tabBarExtent = tabBar.getExtent();
        return pt(  Math.max(tabBarExtent.x, tabPaneExtent.x),
                    tabBarExtent.y + tabPaneExtent.y);
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().x;
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(0, 0));
    },


    tabBarExtent: function(aContainer) {
        return pt(aContainer.getTabPaneExtent().x, aContainer.getTabBar().getDefaultHeight());
    },
    containerExtent: function(paneExtent, tabBarExtent) {
        return pt(paneExtent.x, tabBarExtent.y + paneExtent.y);
    }

});

lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyLeft',
'default category', {

    adjustTabBar: function(aTabBar) {
        var barExtent = pt(aTabBar.getExtent().x, aTabBar.getDefaultHeight());
        aTabBar.setExtent(barExtent);
        aTabBar.setPosition(pt(
            0,
            aTabBar.getTabContainer().getTabPaneExtent().y));
        aTabBar.setRotation(3*Math.PI/2);
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        var tabBarExtent = tabBar.getExtent();
        return pt(  tabBarExtent.y + tabPaneExtent.x,
                    tabPaneExtent.y);
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().y;
    },
    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(
            aTabPane.getTab().getTabBar().getExtent().y,
            0));
    },

    tabBarExtent: function(aContainer) {
        return pt(aContainer.getTabPaneExtent().y, aContainer.getTabBar().getDefaultHeight());
    },

    containerExtent: function(paneExtent, tabBarExtent) {
        return pt(paneExtent.x + tabBarExtent.y, paneExtent.y);
    }

});

lively.morphic.TabStrategyAbstract.subclass('lively.morphic.TabStrategyHide',
'default category', {
   adjustTabBar: function(aTabBar) {
        aTabBar.setExtent(pt(0,0));
        aTabBar.setPosition(pt(0,0));
    },

    calculateInitialExtent: function(tabBar, tabPaneExtent) {
        return tabPaneExtent;
    },

    getTabBarWidth: function(aContainer) {
        return aContainer.getTabPaneExtent().x; // dummy
    },

    adjustPanePositionInContainer: function(aTabPane, aTabContainer) {
        aTabPane.setPosition(pt(0, 0));
    },

    tabBarExtent: function(aContainer) {
        return pt(0, 0); // dummy
    },

    containerExtent: function(paneExtent, tabBarExtent) {
        return paneExtent;
    }

});

}) // end of module
