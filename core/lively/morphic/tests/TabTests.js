module('lively.morphic.tests.TabTests').requires('lively.morphic.tests.Morphic').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.TabTests.TabTests',
'running', {
    setUp: function($super) {
        $super();
        this.tabContainer = new lively.morphic.TabContainer();
        this.tabContainer.openInWorld();
    },
    tearDown: function($super) {
        $super();
        this.tabContainer.remove();
    },
},
'testing', {
    test01AddTabLabeledAddsTabToTabBar: function() {
        this.assertEquals(this.tabContainer.getTabBar().tabs.length, 0, 'setup failed');
        var t = this.tabContainer.addTabLabeled('New Tab');
        this.assertEquals(this.tabContainer.getTabBar().tabs.length, 1, 'tab should have been added to TabBar');
    },
    test02AddTabLabeledAddsTabMorphToContainer: function() {
        this.assertEquals(this.tabContainer.getTabBar().submorphs.length, 0, 'setup failed');
        var newTab = this.tabContainer.addTabLabeled('New Tab');
        this.assertEquals(this.tabContainer.getTabBar().submorphs.length, 1, 'tab is not a submorph of container\'s TabBar');
    },
    test03ChangeTabStrategyChangesExtent: function() {
        var extent = this.tabContainer.getExtent(),
            tabBarExtent = this.tabContainer.getTabBar().getExtent();
        // default strategy is 'top', we'll switch to 'hide'
        this.tabContainer.setTabBarStrategy(new lively.morphic.TabStrategyHide());
        this.assertEquals(this.tabContainer.getExtent().y, extent.y-tabBarExtent.y, 'TabContainer extent did not shrink when hiding tab bar');
    },
    test04GetActiveTab: function() {
        var bar = this.tabContainer.getTabBar(),
            t1 = this.tabContainer.addTabLabeled('Tab1'),
            t2 = this.tabContainer.addTabLabeled('Tab2');
        bar.activateTab(t1);
        bar.activateTab(t2);
        this.assert(t2.isActive, 't2 not active');
        this.assert(!t1.isActive, 't1 is active?');
        this.assertEquals(t2.getPane(), this.tabContainer.topSubmorph());
        this.assertEquals(t2, this.tabContainer.activeTab());
        this.assertEquals(t2.getPane(), this.tabContainer.activePane());
    },



});

}) // end of module