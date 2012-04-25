module('lively.morphic.SAPAdditionalWidgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPFontPicker',
'default category', {
    initialize: function($super) {
        $super();
        this.setFill(Color.rgb(223, 227, 232));
        this.setBorderColor(Color.rgb(177,181,186));
        this.setExtent(lively.pt(200,500));
        this.oList;
        this.initializeData();
    },
    initializeData: function($super) {
        this.oList = new lively.morphic.List(new Rectangle(0, 0, 100, 100), []);
        this.oList.disableGrabbing();
        this.addMorph(this.oList);
        
    },
    addToGrid: function(aGrid) {
        this.grid = aGrid;
        this.grid.addMorph(this);
    },
    availableFonts: function(fontNames) {
        var testText = 'CmmwwmmwwmmwwmmL',
		parent = document.body,
		span = XHTMLNS.create('span');
	span.textContent = testText;
	span.style.fontSize = '72px';
	parent.appendChild(span);
	var defaultWidth = span.offsetWidth, defaultHeight = span.offsetHeight;
	var availableFonts = fontNames.select(function(fontName) {
		try {
			if (Global.getComputedStyle(span).fontFamily == fontName) return true;
			span.style.fontFamily = fontName;
			var available = defaultWidth !== span.offsetWidth || defaultHeight !== span.offsetHeight;
			return available;
		} catch(e) { return false }
	})
	parent.removeChild(span)
	return availableFonts;
    },
    getKnownFonts: function(fontNames) {
       
    }
});

}) // end of module