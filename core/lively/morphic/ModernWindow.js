module('lively.morphic.ModernWindow').requires('lively.morphic.Widgets', 'lively.morphic.StyleSheets').toRun(function() {

lively.morphic.Morph.addMethods({
    openInModernWindow: function (optPos) {
        lively.morphic.World.current().internalAddWindow(this,
            this.name, optPos || this.getPosition());
        this.applyStyle({resizeWidth: true, resizeHeight: true});
        if (this.partsBinMetaInfo) {
            this.owner.setPartsBinMetaInfo(this.getPartsBinMetaInfo());
            this.owner.setName(this.name);
            this.owner.setTitle(this.name);
        }
    }
});

lively.morphic.World.addMethods({
    internalAddModernWindow: function (morph, title, pos, suppressReframeHandle) {
        morph.applyStyle({borderWidth: 1, borderColor: CrayonColors.iron});
        pos = pos || this.firstHand().getPosition().subPt(pt(5, 5));
        var win = this.addFramedModernMorph(morph, String(title || ""), pos, suppressReframeHandle);
        return morph;
    },
     addFramedModernMorph: function (morph, title, optLoc, optSuppressControls, suppressReframeHandle) {
        var w = this.addMorph(
            new lively.morphic.ModernWindow(morph, title || 'ModernWindow',
                                      optSuppressControls, suppressReframeHandle));
        w.setPosition(optLoc || this.positionForNewMorph(morph));
        return w;
    }
    
});

lively.morphic.Morph.subclass('lively.morphic.Window',
'appearance', {
    spacing: 4, // window border
    style: {borderWidth: 0, fill: null, borderRadius: 0, strokeOpacity: 0, adjustForNewBounds: true, enableDragging: true},
    styleSheet: "background-color: rgba(255, 255, 255, 0.6); box-shadow: 0px 0px 15px #000; border-radius: 8px;",
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
        
        this.setAppearanceStylingMode(true);
        this.setBorderStylingMode(true);
        this.setStyleSheet(this.styleSheet);
        
        return this;
    },

},'rest',
{

}
);

}) // end of module