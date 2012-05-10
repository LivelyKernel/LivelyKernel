module('lively.morphic.SAPCommonWidgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPCellFormatter',
'default category', {
    initialize: function($super) {
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,500,500)));
        this.grid;
        this.toolBar;
        this.lstCategory = null;
        this.ddlDecimalPlaces = null;
        this.ddlCurrencySymbol = null;
        this.txtCategory = null;
        this.txtDecimalPlaces = null;
        this.txtSymbol = null;
        this.txtType = null;
        this.chkUseThousand=null;
        this.txtNegatvieNumbers
        this.txtUseThousand=null;
        this.arrCurrency=[];
        this.buildCurrencyList();
        this.initializeLayout();
    },
    setCategory: function() {
        
    },
    buildCurrencyList: function() {
        this.arrCurrency=[];
        var oCurrency={};
        
        oCurrency.value= "USD";
        oCurrency.symbol="$";
        oCurrency.string= "United States Dollar";
        oCurrency.bFront=true;
        oCurrency.isListItem=true;
        this.arrCurrency.push(oCurrency);
        oCurrency={};
        oCurrency.value= "EUR";
        oCurrency.symbol="€";
        oCurrency.string= "Euro";
        oCurrency.bFront=true;
        this.arrCurrency.push(oCurrency);
        oCurrency={};
        oCurrency.value = "JPY";
        oCurrency.symbol="¥";
        oCurrency.string= "Japan, Yen";
        oCurrency.bFront=true;
        oCurrency.isListItem=true;
        this.arrCurrency.push(oCurrency);
        oCurrency={};
        oCurrency.value= "GBP";
        oCurrency.symbol="£";
        oCurrency.string= "Britain (United Kingdom), Pounds";
        oCurrency.bFront=true;
        oCurrency.isListItem=true;
        this.arrCurrency.push(oCurrency);
        oCurrency={};
        oCurrency.value= "AUD";
        oCurrency.symbol="$";
        oCurrency.string = "Australia, Dollars";
        oCurrency.bFront=true;
        oCurrency.isListItem=true;
        this.arrCurrency.push(oCurrency);
    },
    initializeLayout: function() {
        var nX = 150;
        var nY = 25;
        var nGap = 5;
        var nXGap = 150;
        var nHeight=25;
        this.setFill(Color.rgb(255,255,255));
   
        this.txtCategory=new lively.morphic.Text(new Rectangle(0 ,0, 100, nHeight),'Category:');
        this.txtCategory.applyStyle({borderWidth: 0, strokeOpacity: 0, fill: null})
        
        this.txtDecimalPlaces=new lively.morphic.Text(new Rectangle(nX ,nY, 120, nHeight),'Decimal Places:');
        this.txtDecimalPlaces.applyStyle({borderWidth: 0, fill: null});
        this.txtType=new lively.morphic.Text(new Rectangle(nX ,nY, 120, nHeight),'Type:');
        this.txtType.applyStyle({borderWidth: 0, fill: null});
        this.txtType.setVisible(false);

        this.ddlDecimalPlaces = new lively.morphic.DropDownList(new Rectangle(nX+nXGap, nY, 37, 23), ['0', '1', '2','3','4','5','6','7','8']);
        
        this.txtSymbol = new lively.morphic.Text(new Rectangle(nX ,nY+nHeight+nGap, 100, nHeight),'Symbol:');
        this.txtSymbol.applyStyle({borderWidth: 0, strokeOpacity: 0, fill: null});
        this.chkUseThousand = new lively.morphic.CheckBox();
        this.chkUseThousand.setPosition(pt(nX,nY+nHeight+nGap));
        this.txtUseThousand = new lively.morphic.Text(new Rectangle(nX+50 ,nY+nHeight+nGap, 150, nHeight),'Use 1000 Separator(,)');
        this.txtUseThousand.applyStyle({borderWidth: 0, strokeOpacity: 0, fill: null});

        this.ddlCurrencySymbol = new lively.morphic.DropDownList(new Rectangle(nX+nXGap, nY+nHeight+nGap, 200, 23), this.arrCurrency);

        this.txtNegatvieNumbers=new lively.morphic.Text(new Rectangle(nX ,nY+2*nHeight+2*nGap, 135, nHeight),'Negative numbers:');
        this.txtNegatvieNumbers.applyStyle({borderWidth: 0, strokeOpacity: 0, fill: null})

       

        this.lstCategory = new lively.morphic.List(new Rectangle(0, 25, nX-20 , 200), ['Number', 'Currency', 'Percentage','Data','Time']);
        this.lstCategory.disableGrabbing();

        
        //this.ddlDecimalPlaces = new lively.morphic.DropDownList(new Rectangle(0, 25, 37, 23), [{isListItem: true,string:"1",value:'one'}]);
        

        this.addMorph(this.txtUseThousand);
        this.addMorph(this.chkUseThousand);
        this.addMorph(this.txtType);
        this.addMorph(this.txtCategory);
        this.addMorph(this.txtSymbol);
        this.addMorph(this.txtDecimalPlaces);
        this.addMorph(this.txtNegatvieNumbers);
        this.addMorph(this.lstCategory);
        this.addMorph(this.ddlDecimalPlaces );
        this.addMorph(this.ddlCurrencySymbol );
    }
});
lively.morphic.Morph.subclass('lively.morphic.SAPListView',
'default category', {
    initialize: function($super,nWidth,nHeight,nSelectedValue,arrData,oReturnCall) {
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,nWidth,nHeight)));
        this.applyStyle({borderColor: Color.black, borderWidth: 2, fill: Color.white});
        this.setClipMode({x: 'hidden', y: 'scroll'}); 
        this.disableGrabbing();
        this.returnCall = oReturnCall;
        this.selectedValue = nSelectedValue;
        this.selectedItem=null;
        this.arrData = arrData;
        var offset = pt(0,0);
        debugger;
        this.arrData.forEach(function(item) {
		var text = new lively.morphic.Text(offset.extent(pt(this.getExtent().x-25,20)), item.string);
                text.item = item;
		text.applyStyle({fill: null,textColor:item.textColor, borderWidth:0, fixedHeight: false, fixedWidth: true, allowInput: false});
                if (item.value.toUpperCase()==this.selectedValue.toUpperCase()){
                    this.selectedItem = text;
                    text.setFill(Color.rgb(240, 171, 0));
                }
		text.ignoreEvents();
		this.addMorph(text);
		text.fit();
		offset = text.bounds().bottomLeft()
	}, this);
    },
//calls from external: to highlight
    setDefaultItem: function(sItemValue) {
        var oSubMorphs = this.submorphs;
        this.selectedItem=null;
        this.selectedValue="";
	for (var i = 0; i < oSubMorphs.length; i++) {
            if (oSubMorphs[i].item.value.toUpperCase()==sItemValue.toUpperCase()){
                oSubMorphs[i].setFill(Color.rgb(240, 171, 0));
                this.selectedItem = oSubMorphs[i];
                this.selectedValue = this.selectedItem.item.value;
            }else{
                oSubMorphs[i].setFill(null);
            }
	
	}
    },
    onMouseDown: function($super, evt) {
        $super(evt);
        if (evt.isCommandKey() || !evt.isLeftMouseButtonDown()) return $super(evt);
        var scroll = this.getScroll();
	this.selectItem(this.localize(evt.getPosition()).addXY(scroll[0], scroll[1]));
    },
    selectItem: function(pos) {
        var oSubMorphs = this.submorphs, selected;
	for (var i = 0; i < oSubMorphs.length; i++) {
	   if (oSubMorphs[i].bounds().containsPoint(pos)) selected = oSubMorphs[i];
	}

	if (selected) {
            for (var i = 0; i < oSubMorphs.length; i++) {
	       oSubMorphs[i].setFill(null);
            }
	    selected.setFill(Color.rgb(240, 171, 0));
	    this.selectedItem= selected;
             
            if (this.returnCall){
                this.returnCall(this.selectedItem);
            }
	}
    },
    
});
lively.morphic.Morph.subclass('lively.morphic.SAPFontPicker',
'default category', {
    initialize: function($super,selectedFont,oReturnCall) {
        this.selectedFont = selectedFont;
        this.returnCall = oReturnCall;
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,200,500)));
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