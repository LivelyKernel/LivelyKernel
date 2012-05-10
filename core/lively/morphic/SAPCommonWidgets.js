module('lively.morphic.SAPCommonWidgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPCellFormatter',
'default category', {
    initialize: function($super) {
        $super(new lively.morphic.Shapes.Rectangle(new Rectangle(0,0,500,500)));
        this.selectedCategory = "Number";
        this.selectedSymbol="USD";
        this.selectedDecimalPlaces = 2;
        this.grid;
        this.toolBar;
        this.lstCategory = null;
        this.lstNegativePlaces=null;
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
        this.arrCategory=[];
        this.arrNegativeNumber=[];
        this.arrNegativeCurrencyNumber=[];
        this.buildListItems();
        this.initializeLayout();
    },
    lstCategory_onChange: function() {
        var sValue = this.lstCategory.getSelectedItem();
        this.selectedCategory = sValue;

        this.ddlDecimalPlaces.setVisible(false);
        this.ddlCurrencySymbol.setVisible(false);
        this.txtDecimalPlaces.setVisible(false);
        this.txtSymbol.setVisible(false);
        this.txtType.setVisible(false);
        this.chkUseThousand.setVisible(false);
        this.txtNegatvieNumbers.setVisible(false);
        this.txtUseThousand.setVisible(false);
        this.lstNegativePlaces.setVisible(false);


        switch(this.selectedCategory){
            case "Number": 
                this.ddlDecimalPlaces.setVisible(true);
                this.txtDecimalPlaces.setVisible(true);
                this.chkUseThousand.setVisible(true);
                this.txtUseThousand.setVisible(true);
                this.txtNegatvieNumbers.setVisible(true);
                this.lstNegativePlaces.setVisible(true);
                break;
            case "Currency":  
                this.ddlDecimalPlaces.setVisible(true);
                this.txtDecimalPlaces.setVisible(true);
                this.txtSymbol.setVisible(true);
                this.ddlCurrencySymbol.setVisible(true);
                this.txtNegatvieNumbers.setVisible(true);
                this.lstNegativePlaces.setVisible(true);
                break;
            case "Date":
                this.txtType.setVisible(true);
                break;
            case "Time":
  
                break;
            case "Percentage":
                this.ddlDecimalPlaces.setVisible(true);
                this.txtDecimalPlaces.setVisible(true);
                break;
            default:
    
        }
    },
    ddlCurrencySymbol_onChange: function(){
        var sValue = this.ddlCurrencySymbol.getSelectedItem();
        this.selectedSymbol = sValue;
        debugger;
    },
    setCategory: function(nIndex) {
        this.lstCategory.setSelection(nIndex);
    },
    buildListItems: function() {
        this.arrCurrency=[];
        this.arrCategory=[];
        this.arrNegativeNumber=[];
        //'Number', 'Currency', 'Percentage','Date','Time'
        var oItem={};
        oItem.value= "Number";
        oItem.string= "Number";
        oItem.isListItem=true;
        this.arrCategory.push(oItem);

        oItem={};
        oItem.value= "Currency";
        oItem.string= "Currency";
        oItem.isListItem=true;
        this.arrCategory.push(oItem);

        oItem={};
        oItem.value= "Date";
        oItem.string= "Date";
        oItem.isListItem=true;
        this.arrCategory.push(oItem);

        oItem={};
        oItem.value= "Time";
        oItem.string= "Time";
        oItem.isListItem=true;
        this.arrCategory.push(oItem);

        oItem={};
        oItem.value= "Percentage";
        oItem.string= "Percentage";
        oItem.isListItem=true;
        this.arrCategory.push(oItem);

    //Currency Symbol
        oItem={};
        oItem.value= "USD";
        oItem.symbol="$";
        oItem.string= "United States Dollar";
        oItem.bFront=true;
        oItem.isListItem=true;
        this.arrCurrency.push(oItem);
        oItem={};
        oItem.value= "EUR";
        oItem.symbol="€";
        oItem.string= "Euro";
        oItem.bFront=true;
        this.arrCurrency.push(oItem);
        oItem={};
        oItem.value = "JPY";
        oItem.symbol="￥";
        oItem.string= "Japan, Yen";
        oItem.bFront=true;
        oItem.isListItem=true;
        this.arrCurrency.push(oItem);
        oItem={};
        oItem.value= "GBP";
        oItem.symbol="￡";
        oItem.string= "Britain (United Kingdom), Pounds";
        oItem.bFront=true;
        oItem.isListItem=true;
        this.arrCurrency.push(oItem);
        oItem={};
        oItem.value= "AUD";
        oItem.symbol="$";
        oItem.string = "Australia, Dollars";
        oItem.bFront=true;
        oItem.isListItem=true;
        this.arrCurrency.push(oItem);

        //for number
        oItem={};
        oItem.value= 0;
        oItem.string= "-1,234.10";
        oItem.isListItem=true;
        oItem.textColor=Color.black;
        this.arrNegativeNumber.push(oItem);

        oItem={};
        oItem.value= 1;
        oItem.string= "1,234.10";
        oItem.isListItem=true;
        oItem.textColor=Color.red;
        this.arrNegativeNumber.push(oItem);

        oItem={};
        oItem.value= 2;
        oItem.string= "(1,234.10)";
        oItem.isListItem=true;
        oItem.textColor=Color.black;
        this.arrNegativeNumber.push(oItem);

        oItem={};
        oItem.value= 4;
        oItem.string= "(1,234.10)";
        oItem.isListItem=true;
        oItem.textColor=Color.red;
        this.arrNegativeNumber.push(oItem);

        //for currency
        oItem={};
        oItem.value= 0;
        oItem.string= "-$1,234.10";
        oItem.isListItem=true;
        oItem.textColor=Color.black;
        this.arrNegativeCurrencyNumber.push(oItem);

        oItem={};
        oItem.value= 1;
        oItem.string= "$1,234.10";
        oItem.isListItem=true;
        oItem.textColor=Color.red;
        this.arrNegativeCurrencyNumber.push(oItem);

        oItem={};
        oItem.value= 2;
        oItem.string= "($1,234.10)";
        oItem.isListItem=true;
        oItem.textColor=Color.black;
        this.arrNegativeCurrencyNumber.push(oItem);

        oItem={};
        oItem.value= 4;
        oItem.string= "($1,234.10)";
        oItem.isListItem=true;
        oItem.textColor=Color.red;
        this.arrNegativeCurrencyNumber.push(oItem);
    },
    initializeLayout: function() {
        var nX = 150;
        var nY = 25;
        var nGap = 1;
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
        this.ddlDecimalPlaces .setSelection(this.selectedDecimalPlaces);
        
        this.txtSymbol = new lively.morphic.Text(new Rectangle(nX ,nY+nHeight+nGap, 100, nHeight),'Symbol:');
        this.txtSymbol.applyStyle({borderWidth: 0, strokeOpacity: 0, fill: null});
        this.chkUseThousand = new lively.morphic.CheckBox();
        this.chkUseThousand.setPosition(pt(nX,nY+nHeight+nGap));
        this.chkUseThousand.setVisible(false);

        this.txtUseThousand = new lively.morphic.Text(new Rectangle(nX+50 ,nY+nHeight+nGap, 150, nHeight),'Use 1000 Separator(,)');
        this.txtUseThousand.applyStyle({borderWidth: 0, strokeOpacity: 0, fill: null});
        this.txtUseThousand.setVisible(false);

        this.ddlCurrencySymbol = new lively.morphic.DropDownList(new Rectangle(nX+nXGap, nY+nHeight+nGap, 200, 23), this.arrCurrency);
        this.ddlCurrencySymbol.setSelection(this.selectedSymbol);

        this.txtNegatvieNumbers=new lively.morphic.Text(new Rectangle(nX ,nY+2*nHeight+2*nGap, 135, nHeight),'Negative numbers:');
        this.txtNegatvieNumbers.applyStyle({borderWidth: 0, strokeOpacity: 0, fill: null})

        this.lstCategory = new lively.morphic.List(new Rectangle(0, 25, nX-20 , 200), this.arrCategory);
        this.lstCategory.setSelection(this.selectedCategory);
        this.lstCategory.setSelection(0);


        this.lstCategory.disableGrabbing();

        this.lstNegativePlaces= new lively.morphic.SAPListView(351,116,0,this.arrNegativeNumber);
        this.lstNegativePlaces.setPosition(pt(nX, nY+3*nHeight+2*nGap));

        

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
        this.addMorph(this.lstNegativePlaces);
        

        connect(this.lstCategory, "selection", this, "lstCategory_onChange", {});
        connect(this.ddlCurrencySymbol, "onChange", this, "ddlCurrencySymbol_onChange", {});

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
        this.setList();
        
    },
    setDefaultItem: function(sItemValue) {
        var oSubMorphs = this.submorphs;
        this.selectedItem=null;
        this.selectedValue="";
	for (var i = 0; i < oSubMorphs.length; i++) {
            if (oSubMorphs[i].item.value.toString().toUpperCase()==sItemValue.toString().toUpperCase()){
                oSubMorphs[i].setFill(Color.rgb(240, 171, 0));
                this.selectedItem = oSubMorphs[i];
                this.selectedValue = this.selectedItem.item.value;
            }else{
                oSubMorphs[i].setFill(null);
            }
	
	}
    },
    setList: function() {
        var offset = pt(0,0);
        this.arrData.forEach(function(item) {
		var text = new lively.morphic.Text(offset.extent(pt(this.getExtent().x-21,20)), item.string);
                text.item = item;
		text.applyStyle({fill: null,textColor:item.textColor, borderWidth:0, fixedHeight: false, fixedWidth: true, allowInput: false});
                if (item.value.toString().toUpperCase()==this.selectedValue.toString().toUpperCase()){
                    this.selectedItem = text;
                    text.setFill(Color.rgb(240, 171, 0));
                }
		text.ignoreEvents();
		this.addMorph(text);
		text.fit();
		offset = text.bounds().bottomLeft();
	}, this);
    },
    updateList: function(nSelectedValue,arrData) {
        this.removeAllMorphs();
        this.arrData=arrData;
        this.setList();
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