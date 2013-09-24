module('lively.presentation.Controller').requires().toRun(function() {

Object.extend(lively.presentation.Controller, {
    open: function() {
        // lively.presentation.Controller.open();
        lively.BuildSpec('lively.presentation.Controller').createMorph().openInWorldCenter().comeForward();
    }
});
    
lively.BuildSpec('lively.presentation.Controller', {
    _Extent: lively.pt(396.9,468.0),
    _Position: lively.pt(1775.0,144.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "PresentationController",
    sourceModule: "lively.morphic.Widgets",
    titleBar: "PresentationController",
    partsBinMetaInfo: {
        comment: "This object allows you to assemble your own presentations. Simply add slides to the controller and modify them accordingly. The controller allows full screen presentations. It uses SlideOverlay and TemplateSlide objects.",
        migrationLevel: 2,
        partName: "PresentationController",
        partsSpaceName: "PartsBin/Presenting/",
        requiredModules: ["lively.Presentation"]
    },
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(388.9,442.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        _ClipMode: 'hidden',
        className: "lively.morphic.Box",
        layout: {adjustForNewBounds: true, resizeHeight: true,resizeWidth: true},
        name: "PresentationControllerPane",
        slideIndex: 2,
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(145,145,145),
            _BorderWidth: 1,
            _ClipMode: "auto",
            _Extent: lively.pt(230.0,400.0),
            _Position: lively.pt(150.0,30.0),
            listItemStyle: {
                fill: null,
                borderColor: Color.gray,
                borderWidth: 1,
                fixedHeight: false,
                fixedWidth: true,
                allowInput: false,
                resizeWidth: true
            },
            layout: {
                borderSize: 3,
                resizeHeight: true,
                resizeWidth: true,
                spacing: 5,
                type: "lively.morphic.Layout.VerticalLayout"
            },
            className: "lively.morphic.MorphList",
            itemList: [],
            itemMorphs: [],
            name: "slideList",
            sourceModule: "lively.morphic.Core",
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Position: lively.pt(330.0,4.0),
            className: "lively.morphic.Button",
            label: "↑",
            name: "Button",
            padding: lively.rect(5,0,0,0),
            layout: {moveHorizontal: true},
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("slideList"), "moveUpInList", {converter: 
        function () { return this.targetObj.selection }});
        }
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Position: lively.pt(359.0,4.0),
            className: "lively.morphic.Button",
            label: "↓",
            name: "Button2",
            padding: lively.rect(5,0,0,0),
            layout: {moveHorizontal: true},
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("slideList"), "moveDownInList", {converter: 
        function () { return this.targetObj.selection }});
        }
        },{
            _BorderColor: Color.rgb(145,145,145),
            _BorderWidth: 1,
            _Extent: lively.pt(130.0,177.0),
            _Position: lively.pt(10.0,110.0),
            className: "lively.morphic.Box",
            layout: {
                borderSize: 10,
                extentWithoutPlaceholder: lively.pt(130.0,212.0),
                spacing: 3.34,
                type: "lively.morphic.Layout.VerticalLayout"
            },
            name: "LabeledBox1",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _Extent: lively.pt(98.7,19.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _MaxTextWidth: 98.65828402366867,
                _MinTextWidth: 98.65828402366867,
                _Position: lively.pt(10.0,10.0),
                className: "lively.morphic.Text",
                    emphasis: [[0,6,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                fixedWidth: true,
                name: "Text1",
                sourceModule: "lively.morphic.TextCore",
                textString: "slides"
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(110.0,20.0),
                _Position: lively.pt(10.0,30.3),
                className: "lively.morphic.Button",
                    label: "create new",
                name: "addNewSlideButton",
                padding: lively.rect(5,0,0,0),
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PresentationControllerPane"), "addNewSlide", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(110.0,20.0),
                _Position: lively.pt(10.0,53.7),
                className: "lively.morphic.Button",
                label: "add existing ",
                name: "addExistingSlideButton",
                padding: lively.rect(5,0,0,0),
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PresentationControllerPane"), "addExistingSlideInteractively", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(110.0,20.0),
                _Position: lively.pt(10.0,77.0),
                className: "lively.morphic.Button",
    
                label: "remove",
                name: "removeSlideButton",
                padding: lively.rect(5,0,0,0),
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PresentationControllerPane"), "removeSelectedSlide", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(110.0,20.0),
                _Position: lively.pt(10.0,123.7),
                className: "lively.morphic.Button",
    
                label: "collect all",
                name: "ScriptableButton3",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PresentationControllerPane"), "collectSlides", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(110.0,20.0),
                _Position: lively.pt(10.0,100),
                className: "lively.morphic.Button",
                label: "print",
                name: "ScriptableButton2",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PresentationControllerPane"), "printSlides", {});
            }
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(110.0,20.0),
                _Position: lively.pt(10.0,147.0),
                className: "lively.morphic.Button",
                label: "remove all",
                name: "ScriptableButton4",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PresentationControllerPane"), "removeAll", {});
            }
            }]
        },{
            _BorderColor: Color.rgb(146,146,146),
            _BorderWidth: 1,
            _Extent: lively.pt(130.0,73.3),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(10.0,30.0),
            className: "lively.morphic.Box",
            layout: {
                borderSize: 10,
                spacing: 15,
                type: "lively.morphic.Layout.VerticalLayout"
            },
            name: "LabeledBox2",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _Extent: lively.pt(98.7,19.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _MaxTextWidth: 98.65828402366867,
                _MinTextWidth: 98.65828402366867,
                _Position: lively.pt(10.0,10.0),
                className: "lively.morphic.Text",
                    emphasis: [[0,12,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                fixedWidth: true,
                name: "Text1",
                sourceModule: "lively.morphic.TextCore",
                textString: "presentation"
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(110.0,20.0),
                _Position: lively.pt(10.0,42.0),
                className: "lively.morphic.Button",
    
                label: "start",
                name: "startPresentationButton",
                padding: lively.rect(5,0,0,0),
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PresentationControllerPane"), "startPresentation", {});
            }
            }]
        },{
            _BorderColor: Color.rgb(145,145,145),
            _BorderWidth: 1,
            _Extent: lively.pt(130.0,130.0),
            _Position: lively.pt(10.0,300.0),
            className: "lively.morphic.Box",
            layout: {
                borderSize: 10,
                spacing: 10,
                type: "lively.morphic.Layout.VerticalLayout"
            },
            name: "LabeledBox3",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _Extent: lively.pt(98.7,19.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _MaxTextWidth: 98.65828402366867,
                _MinTextWidth: 98.65828402366867,
                _Position: lively.pt(12.2,12.2),
                className: "lively.morphic.Text",
                    emphasis: [[0,7,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                fixedWidth: true,
                name: "Text1",
                sourceModule: "lively.morphic.TextCore",
                textString: "overlay"
            },{
                _BorderColor: Color.rgb(214,214,214),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(110.0,20.0),
                _Position: lively.pt(12.2,32.6),
                className: "lively.morphic.Button",
                label: "edit",
                name: "editOverlayButton",
                padding: lively.rect(5,0,0,0),
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PresentationControllerPane"), "showOrHideSlideOverlay", {});
            }
            },{
                _ClipMode: "auto",
                _Extent: lively.pt(110.0,20.0),
                _Fill: Color.rgb(243,243,243),
                _Position: lively.pt(12.2,57.4),
                className: "lively.morphic.DropDownList",
                controller: {
                    isMorphRef: true,
                    name: "PresentationControllerPane"
                },
                itemList: [],
                name: "slideOverlayChooser",
                selectOnMove: false,
                selectedLineNo: null,
                selection: null,
                sourceModule: "lively.morphic.Core",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("PresentationControllerPane"), "setSlideOverlay", {});
            },
                onMouseDown: function onMouseDown(evt) {
                var items = this.controller.availableSlideOverlays().collect(function(ea) {
                    return {isListItem: true, string: ea.name, value: ea}
                })
                this.setList(items)
                return $super(evt);
            }
            }]
        }],
        addExistingSlideInteractively: function addExistingSlideInteractively() {
    	var slides = [], presentationController = this;
    	this.world().withAllSubmorphsDo(function(ea) {
    		if (ea.isSlideMorph) slides.push(ea);
    	})
    	var options = slides
    		.sortBy(function(ea) { return ea.name || ea.toString()})
    		.collect(function(ea) {
    			return [ea.name || ea.toString(), function() {
    				presentationController.addSlide(ea);
    			}]
    		});
    	options.push(['cancel', function() {}]);
    	lively.morphic.Menu.openAtHand('Choose slide to add', options);
    },
        addNewSlide: function addNewSlide() {
    	var slide = lively.PartsBin.getPart('TemplateSlide', 'PartsBin/Presenting');
    	this.world().firstHand().grabMorph(slide);
    },
        addSlide: function addSlide(slideMorph) {
    	var list = this.get('slideList')
    	list.addItem({isListItem: true, value: slideMorph, string: slideMorph.name || slideMorph.toString()})
    },
        availableSlideOverlays: function availableSlideOverlays() {
        var overlays = this.slideOverlay ? [this.slideOverlay] : [];
        this.world().withAllSubmorphsDo(function(ea) { ea.isSlideOverlay && overlays.push(ea) })
        return overlays.uniq();
    },
        collectSlides: function collectSlides() {
        this.get('slideList').setList([])
    
        var slides = this.gatherSlides()
    
        slides.forEach(function(ea) {
            this.addSlide(ea)
        }, this)
    	
    },
        currentSlide: function currentSlide() {
    	var list = this.get('slideList');
    	return list.getValues()[this.slideIndex];
    },
        endPresentation: function endPresentation() {
    	lively.Presentation.disablePresentationKeyBindings();
    	this.world().currentPresentationController = null;
    	this.getSlideOverlay().remove();
    	this.currentSlide().deactivate();
    },
        gatherSlides: function gatherSlides() {
        return this.world().submorphs.select(function(ea) {
            return ea instanceof lively.Presentation.PageMorph
        }).sort(function(a, b) { 
            if (Math.abs(a.getPosition().y - b.getPosition().y) < 20) {
                return a.getPosition().x - b.getPosition().x 
            }
            return a.getPosition().y - b.getPosition().y 
        })
    },
        getSlideNo: function getSlideNo() { return this.slideIndex },
        getSlideOverlay: function getSlideOverlay() {
    	if (!this.slideOverlay)
                this.setSlideOverlay(lively.PartsBin.getPart('SlideOverlay', 'PartsBin/Presenting'));
    
    	// FIXME this should be done automgically
    	var o = this.slideOverlay;
    	if (!o.renderContext().morphNode)
    		o.restoreRenderContextAfterCopy(o.renderContext());
    
    	return this.slideOverlay;
    },
        getSlides: function getSlides() {
        // this.getSlides()
        return this.get('slideList').getList().pluck('value')
    },
        gotoSlide: function gotoSlide(slideIndex) {
    	this.slideIndex = slideIndex;
    	var slide = this.currentSlide();
            slide && slide.activateWithOverlay(this.getSlideOverlay());
    	// for safaris strange beavior when switching slides with arrow keys
    	(function() { Global.scrollTo(0,0) }).delay(0.1);
    },
        nextSlide: function nextSlide() {
            this.gotoSlide(Math.min(this.numberOfSlides()-1, this.slideIndex+1))
    },
        nextStepOrSlide: function nextStepOrSlide() {
            if (this.currentSlide().moreBuildStepsForward && this.currentSlide().moreBuildStepsForward()) this.currentSlide().buildStepForward();
            else this.nextSlide();
    },
        notYetImplemented: function notYetImplemented(msg) {
    	alert('Not yet implemented');
    },
        numberOfSlides: function numberOfSlides() {
    	return this.get('slideList').getValues().length;
    },
        onLoad: function onLoad() {
        module('lively.Presentation').load();
    },
        prevSlide: function prevSlide() {
            this.gotoSlide(Math.max(0, this.slideIndex-1))
    },
        prevStepOrSlide: function prevStepOrSlide() {
            if (this.currentSlide().moreBuildStepsBackward && this.currentSlide().moreBuildStepsBackward()) this.currentSlide().buildStepBackward();
            else this.prevSlide();
    },
        printSlides: function printSlides() {
        var slides = this.get('slideList').getList().pluck('value')
        
        var divs = slides.collect(function(ea, index) {
            ea.addMorphBack(this.getSlideOverlay());
            this.getSlideOverlay().setPosition(pt(0,0))
            this.getSlideOverlay().visitSlide(ea, index);
    
            if (index == 0)
                this.getSlideOverlay().remove()
    
            var node = ea.renderContext().morphNode;
            node.style.position = 'static'
            node.style.width = ea.getExtent().x + 'px'
            node.style.height = ea.getExtent().y + 'px'
            node.style.pageBreakBefore = 'always'
    
            var oldBorder = ea.getBorderWidth();        
            ea.setBorderWidth(0)
            ea.setExtent(pt(1124.0, 768.0))
    
            var source =  Exporter.stringify(node)
    
            node.style.position = 'absolute'
            ea.setBorderWidth(oldBorder)
            ea.setExtent(pt(1024.0,768.0))
    
            return source
        }, this).join('\n')
    
        var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="content-type" content="text/html; charset=UTF-8"></head><html><body>' + divs + '</body></html>'
        var url = URL.source.withFilename(URL.source.filename().replace('.xhtml', '_print.html'))
        var wr = new WebResource(url);
        wr.put(html, 'text/xhtml');
    
        this.world().confirm("visit printed page", function(bool) {
            if (bool) window.open(url)
        })
    
    },
        removeAll: function removeAll() {
        this.get('slideList').updateList([]);
    },
        removeSelectedSlide: function removeSelectedSlide() {
    	var list = this.get('slideList'),
    		sel = list.getSelection();
    	if (!sel) return;
    	alertOK('removed ' + sel);
    	list.removeItemOrValue(sel);
    },
        removeSlide: function removeSlide() {
    	var list = this.get('slideList'),
    		sel = list.getSelection();
    	if (!sel) return;
    	list.removeItemOrValue(sel);
            // list.selectAt(0)
    },
        reset: function reset() {
    	this.slideOverlay && this.slideOverlay.remove()
    	this.slideOverlay = null;
    	this.removeAll();
        this.get('slideOverlayChooser').selection = null
        this.getPartsBinMetaInfo().addRequiredModule('lively.Presentation');
    },
        setSlideOverlay: function setSlideOverlay(overlay) {
        // this.setSlideOverlay(null)
        alert('new overlay ' + overlay)
        if (this.slideOverlay &&  this.slideOverlay.remove) {
            alert('removing ' + this.slideOverlay)
            this.slideOverlay.remove();
        }
        if (overlay instanceof lively.morphic.Morph) {
            this.slideOverlay = overlay;
            this.get('slideOverlayChooser').setList([overlay.name])
    
        } else {
            this.get('slideOverlayChooser').setList(['Choose...'])
        }
    },
        setupConnections: function setupConnections() {
    	connect(this.get('addNewSlideButton'), 'fire', this, 'addNewSlide');
    	connect(this.get('addExistingSlideButton'), 'fire', this, 'addExistingSlideInteractively');
    	connect(this.get('removeSlideButton'), 'fire', this, 'removeSelectedSlide');
    	connect(this.get('startPresentationButton'), 'fire', this, 'startPresentation');
    	connect(this.get('editOverlayButton'), 'fire', this, 'showOrHideSlideOverlay');
        connect(this.get('slideOverlayChooser'), 'selection', this, 'setSlideOverlay')
    },
        showOrHideSlideOverlay: function showOrHideSlideOverlay() {
    	var overlay = this.getSlideOverlay();
    	if (overlay.owner) {overlay.remove(); return };
    	overlay.enableEvents();
    	this.addMorph(overlay);
    	overlay.align(overlay.bounds().topLeft(), this.shape.bounds().bottomLeft());
    },
        showSlideOverlay: function showSlideOverlay() {
    	var overlay = this.addMorph(this.getSlideOverlay());
    	overlay.align(overlay.bounds().topLeft(), this.shape.bounds().bottomLeft());
    },
        startPresentation: function startPresentation() {
    	lively.Presentation.enablePresentationKeyBindings();
    	this.world().currentPresentationController = this;
    	this.world().addMorph(this.getSlideOverlay());
    	// this.getSlideOverlay().ignoreEvents();
    	this.slideIndex = -1;
    	this.nextSlide();
    }
    }]
});

}) // end of module