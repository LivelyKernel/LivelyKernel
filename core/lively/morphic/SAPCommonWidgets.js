module('lively.morphic.SAPCommonWidgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPCellFormatter',
'default category', {
    initialize: function($super) {
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,500,500)));
        this.grid;
        this.toolBar;
        this.initializeLayout();
        this.lstCategory = null;
    },
     initializeLayout: function() {
        //var oTextCategory = new lively.morphic.Text(new Rectangle(0,0, 100, 30), 'Category');
        var oTextCategory =new lively.morphic.Text(pt(0,0).extent(pt(100,30)),'Category');
        oTextCategory.applyStyle({borderWidth: 0, strokeOpacity: 0, fill: null})
        this.lstCategory = new lively.morphic.List(new Rectangle(0, 30, 130, 200), ['Number', 'Currency', 'Percentage','Data','Time']);
        this.lstCategory.disableGrabbing();
        this.addMorph(oTextCategory );
        this.addMorph(this.lstCategory);
    }
});

lively.morphic.Morph.subclass('lively.morphic.SAPFontPicker',
'default category', {
    initialize: function($super,selectedFont,oReturnCall) {
        this.selectedFont = selectedFont;
        this.returnCall = oReturnCall
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,200,500)))
        this.applyStyle({borderColor: Color.black, borderWidth: 2, fill: Color.white});
        this.setClipMode({x: 'hidden', y: 'scroll'}); 
        this.disableGrabbing();
 
        var fonts = this.availableFonts(this.getKnownFonts());
	var offset = pt(0,0);
 
	fonts.forEach(function(font) {
		var text = new lively.morphic.Text(offset.extent(pt(this.getExtent().x-25,20)), font);
		text.applyStyle({fill: null, borderWidth:0, fontFamily: font, fixedHeight: false, fixedWidth: true, allowInput: false});
                if (font.toUpperCase()==this.selectedFont.toUpperCase()){
                    text.setFill(Color.rgb(240, 171, 0));
                }
		text.ignoreEvents();
		this.addMorph(text);
		text.fit();
		offset = text.bounds().bottomLeft()
	}, this);

    },
    //calls from external: to highlight
    setDefaultFont: function(sFontName) {
        var fontMorphs = this.submorphs;
        this.selectedFont="";
	for (var i = 0; i < fontMorphs.length; i++) {
            if (fontMorphs[i].getTextString().toUpperCase()==sFontName.toUpperCase()){
                fontMorphs[i].setFill(Color.rgb(240, 171, 0));
                this.selectedFont = fontMorphs[i].getTextString();
                //break;
            }else{
                fontMorphs[i].setFill(null);
            }
	
	}
    },
    onMouseDown: function($super, evt) {
        $super(evt);
         console.log("SAPFontList.onMouseDown");
        
        if (evt.isCommandKey() || !evt.isLeftMouseButtonDown()) return $super(evt);
        var scroll = this.getScroll();
	this.selectFont(this.localize(evt.getPosition()).addXY(scroll[0], scroll[1]));
       
        
    },
    selectFont: function(pos) {
        var fontMorphs = this.submorphs, selected;
	for (var i = 0; i < fontMorphs.length; i++) {
	   if (fontMorphs[i].bounds().containsPoint(pos)) selected = fontMorphs[i];
	}

	if (selected) {
            for (var i = 0; i < fontMorphs.length; i++) {
	       fontMorphs[i].setFill(null);
            }
	    selected.setFill(Color.rgb(240, 171, 0));
	    this.selectedFont = selected.textString;
             
            if (this.returnCall){
                this.returnCall(this.selectedFont);
            }
        
            console.log(this.selectedFont)
	}
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
       return ['academy engraved let',
		'algerian',
		'amaze',
		'arial',
		'arial black',
		'balthazar',
		'bart',
		'bimini',
		'comic sans ms',
		'book antiqua',
		'bookman old style',
		'braggadocio',
		'britannic bold',
		'brush script mt',
                'Calibri',
		'century gothic',
		'century schoolbook',
		'chasm',
		'chicago',
		'colonna mt',
		'comic sans ms',
		'commercialscript bt',
		'coolsville ',
		'courier',
		'courier new',
		'cursive',
		'dayton',
		'desdemona',
		'fantasy',
		'flat brush ',
		'footlight mt light ',
		'futurablack bt',
		'futuralight bt',
		'garamond',
		'gaze',
		'geneva',
		'georgia',
		'geotype tt',
		'helterskelter',
		'helvetica',
		'herman',
		'highlight let',
		'impact',
		'jester',
		'joan',
		'john handy let',
		'jokerman let',
		'kelt',
		'kids',
		'kino mt',
		'la bamba let',
		'lithograph',
		'lucida console',
		'map symbols',
		'marlett',
		'matteroffact',
		'matisse itc ',
		'matura mt script capitals',
		'mekanik let',
		'monaco ',
		'monospace',
		'monotype sorts',
		'ms linedraw',
		'new york',
		'olddreadfulno7 bt',
		'orange let',
		'palatino ',
		'playbill',
		'pump demi bold let',
		'puppylike',
		'roland',
		'sans-serif',
		'scripts',
		'scruff let',
		'serif',
		'short hand',
		'signs normal',
		'simplex',
		'simpson',
		'stylus bt',
		'superfrench',
		'surfer',
		'swis721 bt',
		'swis721 blkoul bt',
		'symap',
		'symbol',
		'tahoma',
		'technic',
		'tempus sans itc',
		'terk ',
		'times',
		'times new roman',
		'trebuchet ms',
		'trendy',
		'txt',
		'verdana',
		'victorian let',
		'vineta bt',
		'vivian',
		'webdings',
		'wingdings',
		'western ',
		'westminster',
		'westwood let',
		'wide latin',
		'zapfellipt bt',
		// these are for linux
		'URW Chancery L',
		'URW Gothic L',
		'Century Schoolbook L',
		'URW Bookman L',
		'URW Palladio L',
		'Nimbus Mono L',
		'Nimbus Sans L',
		'Nimbus Roman No',
		'DejaVu Sans',
		'DejaVu Sans Mono',
		'DejaVu Serif',
		'DejaVu Sans Light',
		'Bitstream Charter',
		'DejaVu Sans Condensed',
		'DejaVu Serif Condensed',
		//'Courier ',
		'Liberation Mono',
		'Liberation Serif',
		'FreeSerif',
		'Liberation Sans',
		'FreeMono',
		'FreeSans',
		//'Arial',
		//'Courier New',
		'Times New Roman',
		'Verdana',
		'Lohit Bengali',
		'Lohit Gujarati',
		'Lohit Punjabi',
		'Lohit Tamil',
		'UnDotum',
		'Georgia',
		'Trebuchet MS',
		//'Arial Black',
		//'Impact',
		'Andale Mono',
		'Bitstream Vera Sans Mono',
		'Comic Sans MS',
		'Bitstream Vera Sans',
		'Waree'].uniq().sort();
    }
});
/*
lively.morphic.Morph.subclass('lively.morphic.SAPFontPicker',
'default category', {
    initialize: function($super,oReturnCall) {
        $super();
        this.returnCall = oReturnCall;
        this.setFill(Color.rgb(223, 227, 232));
        this.setBorderColor(Color.rgb(177,181,186));
        this.setExtent(lively.pt(200,500));
        this.oList;
        this.initializeData();
    },
    initializeData: function($super) {
        this.oList = new lively.morphic.SAPFontList(this.returnCall);
        this.addMorph(this.oList);
    }
    
});
*/

}) // end of module