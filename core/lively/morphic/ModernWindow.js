module('lively.morphic.ModernWindow').requires('lively.morphic.Widgets').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.Window', 
'documentation', {
    documentation: "Full-fledged AND good looking windows with title bar, menus, etc",
},
'initializing', {
    initialize: function($super, targetMorph, titleString, optSuppressControls) {
        $super(new lively.morphic.Shapes.Rectangle());
        this.LK2 = true; // to enable workaround in WindowMorph trait.expand

        var bounds      = targetMorph.bounds(),
            titleBar    = this.makeTitleBar(titleString, bounds.width, optSuppressControls),
            titleHeight = titleBar.bounds().height - titleBar.getBorderWidth();
        this.setBounds(bounds.withHeight(bounds.height + titleHeight));
        this.targetMorph = this.addMorph(targetMorph);
        this.reframeHandle = this.addMorph(this.makeReframeHandle());
        this.alignReframeHandle();
        this.titleBar = this.addMorph(titleBar);
        this.contentOffset = pt(0, titleHeight);
        targetMorph.setPosition(this.contentOffset);
        // this.closeAllToDnD();

        this.collapsedTransform   = null;
        this.collapsedExtent      = null;
        this.expandedTransform    = null;
        this.expandedExtent       = null;
        this.ignoreEventsOnExpand = false;
        this.disableDropping();
        return this;
    },

},'rest',
{

}
);

}) // end of module