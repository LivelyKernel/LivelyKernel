module('lively.ide.FileBrowsing').requires('lively.ide.BrowserFramework').toRun(function() {

Widget.subclass('lively.ide.FileBrowsing.Browser',
'settings', {
    initialViewExtent: pt(520, 450),
    allPaneNames: ['Pane1', 'Pane2'],
    panelSpec: [
            ['Pane1', newDragnDropListPane, new Rectangle(0, 0, 0.5, 0.44)],
            ['Pane2', newDragnDropListPane, new Rectangle(0.5, 0, 0.5, 0.44)],
            ['midResizer', function(bnds) { 
                    return new HorizontalDivider(bnds) }, new Rectangle(0, 0.44, 1, 0.01)],
            ['sourcePane', newTextPane, new Rectangle(0, 0.45, 1, 0.49)],
        ],
},
'initializing', {
    buildView: function(extent) {
        var panel = PanelMorph.makePanedPanel(extent, this.panelSpec);
        
        // setup resizers
        this.allPaneNames.collect(function(name) {
            panel.midResizer.addScalingAbove(panel[name]);
        });
        panel.midResizer.addScalingBelow(panel.sourcePane)

        panel.Pane1.innerMorph().plugTo(this, {selection: '->pane1Selection', updateList: '<-pane1Items'});
        panel.Pane2.innerMorph().plugTo(this, {selection: '->pane2Selection', updateList: '<-pane2Items'});

        this.panel = panel;
        return panel;
    },
},
'accessing', {
    rootNode: function() {
        return new lively.ide.FileBrowsing.RootNode(URL.source);
    },
});
Object.subclass('lively.ide.FileBrowsing.RootNode',
'default category', {
    m1: function() {},
});

}) // end of module