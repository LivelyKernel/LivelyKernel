module('lively.morphic.ModernWindow').requires('lively.morphic.Widgets').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.Window',
'appearance', {
    spacing: 4, // window border

},


'documentation', {
    documentation: "Full-fledged AND good looking windows with title bar, menus, etc",
},
'initializing', {
    initialize: function($super, targetMorph, titleString, optSuppressControls) {
        $super(new lively.morphic.Shapes.Rectangle());
        this.LK2 = true; // to enable workaround in WindowMorph trait.expand

        var bounds      = targetMorph.bounds();
        bounds.width += 2 * this.spacing;
        bounds.height += 1 * this.spacing;
    
        var titleBar    = this.makeTitleBar(titleString, bounds.width, optSuppressControls);
        var titleHeight = titleBar.bounds().height - titleBar.getBorderWidth();
        this.setBounds(bounds.withHeight(bounds.height + titleHeight));
        this.targetMorph = this.addMorph(targetMorph);
        this.reframeHandle = this.addMorph(this.makeReframeHandle());
        this.alignReframeHandle();
        this.titleBar = this.addMorph(titleBar);
        this.contentOffset = pt(this.spacing, titleHeight);
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