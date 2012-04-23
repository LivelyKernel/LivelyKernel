module('lively.morphic.ScriptingSupport').requires('lively.morphic.Core', 'lively.PartsBin', 'lively.morphic.Connectors').toRun(function() {

lively.morphic.Morph.addMethods(
'naming', {
    setName: function(name) { this.name = name },
    getName: function() { return this.name },
    get: function (name) {
        // search below, search siblings, search upwards
        return this.getMorphNamed(name) || this.getBreadthFirstUpwards(name);
    },
    getMorphNamed: function (name) {
        if (name == "") return null;
        if (!this.submorphs) return null;
        for (var i = 0; i < this.submorphs.length; i++) {
            var morph = this.submorphs[i];
            if (morph.getName() === name || morph.toString() === name) return morph;
        }
        for (var i = 0; i < this.submorphs.length; i++)  {
            var morph = this.submorphs[i].getMorphNamed(name);
            if (morph) return morph;
        }
        return null;
    },
    getBreadthFirstUpwards: function (name) {
        if (this.getName() === name || this.toString() === name) return this;
        var owner = this.owner;
        if (!owner) return null;
        for (var i = 0; i < owner.submorphs.length; i++) {
            var morph = owner.submorphs[i];
            if (morph === this) continue;
            if (morph.getName() === name || morph.toString() === name) return morph;
            var foundInMorph = morph.getMorphNamed(name);
            if (foundInMorph) return foundInMorph;
        }
        return this.owner.getBreadthFirstUpwards(name);
    },
},
'conversion', {
    asSVGLogo: function() {
        var oldPos = this.getPosition();
        var logoMorph = this.copy();
        logoMorph.setPosition(pt(0,0))
        logoMorph.renderWithSVG();
        logoMorph.remove(); // FIXME worlds are automatically added to DOM
        svgNode = logoMorph.renderContext().morphNode;
        return '<?xml version="1.0" encoding="UTF-8"?>\n'+
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '+
        'xmlns:ev="http://www.w3.org/2001/xml-events" version="1.1" baseProfile="full" >\n' +
            Exporter.stringify(svgNode) +
        '</svg>';
    },
    logoHTMLString: function () {
        return Exporter.stringify(this.renderContext().morphNode);
    },
    asHTMLLogo: function () {
        var oldPos = this.getPosition(),
            oldScale = this.getScale(),
            bounds = this.bounds();

        try {
            this.setScale(85 / Math.max(bounds.width, bounds.height)*oldScale);

            this.align(this.bounds().topLeft(), pt(5,5));
            var html = this.logoHTMLString();
            // patch properties so they work on all browsers...
            html = html.replace(/(-webkit|-moz|-o)(-transform[^;]+;)/g, '-webkit$2 -moz$2 -o$2');
            html ='<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"> <body>'
                + html + '</body></html>';
            return html;
        } finally {
            this.setScale(oldScale);
            this.setPosition(oldPos);
        }
    },

    asLogo: function() {
        var src = this.asSVGLogo(),
            svgNode = stringToXML(world.asSVGLogo()),
            shape = new lively.morphic.Shapes.External(svgNode),
            morph = new lively.morphic.Morph(shape);
        return morph;
    },

},
'connection points', {
    getConnectionPoints: function() {
        return Object.mergePropertyInHierarchy(this, 'connections');
    },
    getTargetConnectionPoints: function() {
        return this.getConnectionPoints();
    },

});

lively.morphic.Box.subclass('lively.morphic.PartsBinItem',
'settings', {
    defaultExtent: pt(100,100),
    style: {enableDragging: true, accessibleInInactiveWindow: true},
},
'initializing', {
    initialize: function($super, partsBinURL, targetName, partItem) {
        $super(pt(0,0).extent(this.defaultExtent));
        this.applyStyle({fill: Color.lightGray, borderColor: Color.black, borderRadius: 6});
        this.partsBinURL = partsBinURL
        this.targetName = targetName;
        this.partItem = partItem;
        this.setupLogo();
        this.disableDropping();
        if(typeof this.disableSelection === "function") {
            this.disableSelection();
        } 
        
    },

    setupLogo: function() {
        this.setupHTMLLogo();
        this.setupLogoLabel();
    },
    setupSVGLogo: function() {
        var logoURL = this.partItem.getLogoURL(),
            logoSVG = new lively.morphic.Image(new Rectangle(3,3,94,94), logoURL.withQuery({time: new Date().getTime()}).toString());
        logoSVG.applyStyle({fill: null})
        logoSVG.ignoreEvents();
        this.addMorph(logoSVG);
        return logoSVG
    },
    setupHTMLLogo: function() {
        var url = this.partItem.getHTMLLogoURL(),
            item = this,
            morphSetup = {htmlSourceToMorph: function(source) {
                source = source.replace(/.*\<body\>/, "").replace(/\<\/body\>.*/, "");
                var node = XHTMLNS.create('div');
                node.innerHTML = source;
                var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(node));
                morph.ignoreEvents();

                morph.setBounds(new Rectangle(3,3,94,94));
                item.addMorphBack(morph);
            }};
        var webR = new WebResource(url).forceUncached();
        connect(webR, 'content', morphSetup, 'htmlSourceToMorph', {updater: function($upd, source) {
            var status = this.sourceObj.status;
            if (status && status.isDone() && status.isSuccess()) $upd(source) }});
        webR.beAsync().get()
    },
    setupLogoLabel: function() {
        var nameLabel = new lively.morphic.Text(
            new Rectangle(10,10,40,10),
            this.targetName.truncate(18)).beLabel({
                fill: Color.white,
                fontSize: 8,
                align: 'center',
                fixedWidth: false,
                fixedHeight: false,
                opacity: 0.8,
                borderRadius: 2,
                borderWidth: 0,
                borderColor: Color.black,
                padding: Rectangle.inset(5,2, 5,0)
            });
        this.addMorph(nameLabel);
        nameLabel.setVisible(false);

        // FIXME!!!
        (function() {
            nameLabel.setVisible(true);
            nameLabel.fit();
            nameLabel.align(
                nameLabel.bounds().bottomCenter(),
                this.innerBounds().bottomCenter().addXY(0, -4));
        }.bind(this)).delay(0.1)
    },



},
'selection', {
    showAsSelected: function() {
        this.owner.selectPartItem && this.owner.selectPartItem(this);
        this.isSelected = true;
        this.applyStyle({borderWidth: 3, borderColor: Color.red})
    },
    showAsNotSelected: function() {
        this.isSelected = false;
        this.applyStyle({borderWidth: 0});
    },
},
'naming', {

},
'mouse events', {
    onMouseDown: function(evt) {
        // FIXME: super calls will always return false. needed?
        if (UserAgent.isTouch) {
            this.startLoadingPart('openLoadedPartCentered')
            return false;
        }
        if (evt.isLeftMouseButtonDown());
            this.showAsSelected();
        return true;
    },
    onDragStart: function($super, evt) {
        if (!this.partItem) {
            alert('Cannot load Part because found no PartItem');
            return;
        }
// FIXME duplication with PartsBinBrowser open
        // FIXME put somewhere else
        this.startLoadingPart('openLoadedPartsBinItem')
        return true
    },
    onDragEnd: function($super, evt) {
        var target = evt.world.morphsContainingPoint(evt.getPosition()).detect(function(ea) { return ea.droppingEnabled });
        if (target)
            evt.hand.dropContentsOn(target, evt)
        return $super(evt);
    },


},
'server interaction', {
    deleteOnServer: function() {
        if (this.partItem) this.partItem.del();
        else alert('Cannot delete')
    },
    interactiveDeleteOnServer: function() {
        this.world().confirm("really delete " + this.targetName + " in PartsBin?", function(answer) {
            if (answer) {
                this.deleteOnServer();
                this.remove();
                alertOK("deleted " + this.targetName + " in " + this.partsBinURL);
            }
        }.bind(this))
    },
},
'loading', {
    openLoadedPartsBinItem: function(partMorph) {
        // FIXME duplication with PartsBinBrowser open
        lively.morphic.World.current().firstHand().grabMorph(partMorph, null);
        partMorph.setPosition(pt(0,0));
        if(partMorph.onCreateFromPartsBin) partMorph.onCreateFromPartsBin();
    },
    openLoadedPartCentered: function(partMorph) {
        partMorph.openInWorld();
        partMorph.align(partMorph.bounds().center(), lively.morphic.World.current().visibleBounds().center())
    },
    startLoadingPart: function(actionOnLoad) {
        var waitRect = lively.morphic.Morph.makeRectangle(this.getExtent().extentAsRectangle());
        waitRect.applyStyle({fill: Color.gray, fillOpacity: 0.6})
        this.addMorph(waitRect);
        connect(this.partItem, 'part', waitRect, 'remove');
        connect(this.partItem, 'part', this, actionOnLoad);

        this.partItem.loadPart(true);
    }
});

Trait('lively.PartsBin.PartTrait').applyTo(lively.morphic.Morph);

Object.extend(Global, {
    $morph: function getMorphNamedShortcut(name) {
        return Config.isNewMorphic ?
            lively.morphic.World.current().getMorphNamed(name) :
            WorldMorph.current().getMorphNamed(name);
    },
    get $world() { return lively.morphic.World.current() },
    $m: function getMorphWrappedObject(name){

        var morph = $morph(name)
        if(!morph || !morph.wrappedObject) return undefined
        return morph.wrappedObject()
    },
    $part: function getPartItem(partName, partSpaceName) {
        return $world.loadPartItem(partName, partSpaceName);
    },
});
Trait('lively.morphic.DraggableBehavior',
'dragging and dropping', {
    onDragEnd: function(evt) {
        evt.hand.removeAllMorphs();
        var target = evt.world.morphsContainingPoint(evt.getPosition()).first();
        this.tryToApplyTo(target)
    },

    onDragStart: function(evt) {
        var pos = this.owner.localize(evt.getPosition())
        this.icon = this.copy();
        this.icon.moveBy(pos.negated())
        evt.hand.grabMorph(this.icon);
    },
    dropOn: function(target) {
        // called when the hand drops its carried morphs
        var applied = this.tryToApplyTo(target)
        if (applied) this.remove()
        else target.addMorph(this);
    },

    tryToApplyTo: function(target) {
        // don't apply to world etc
        if (!this.applyTo) throw new Error('Implement applyTo');
        if (target === this.world()) {
            alert('found no target to apply behavior to!')
            return false;
        }
        this.applyTo(target)
        return true
    },
})



lively.morphic.Morph.addMethods(

'style', {
    getCustomStyle: function() {
        return {
            fill: this.getFill(),
            fillOpacity: this.getFillOpacity(),
            borderColor: this.getBorderColor(),
            borderRadius: this.getBorderRadius(),
            borderWidth: this.getBorderWidth(),
            strokeOpacity: this.getStrokeOpacity(),
        }
    },
    applyCustomStyle: function(style) {
        this.applyStyle(style)
    },
}, 'geometry', {

    moveForwardBy: function (amount) {
        var nose = pt(1,0)
        var dir = nose.matrixTransformDirection(this.getTransform()).normalized();
        this.moveBy(dir.scaleBy(amount))
    },
    turnBy: function (angle) {
        this.setRotation(this.getRotation() + angle.toRadians())
    }
})

lively.morphic.Text.addMethods({
	getCustomStyle: function($super) {
		var superStyle = $super();
		Object.extend(superStyle, {
			textColor: this.getTextColor(),
			fontSize: this.getFontSize(),
			fontFamily: this.getFontFamily(),
		})
		return superStyle
	},
	applyCustomStyle: function($super, style) {
		$super(style);
		if (style.fontFamily)
			this.setFontFamily(style.fontFamily)
	},
})

lively.morphic.Box.subclass('lively.morphic.DraggableBehaviorMorph',
'properties', {
    draggingEnabled: true,
    style: {fill: Color.gray, borderRadius: 6}
},
'initialize', {
    initialize: function($super) {
        $super(new Rectangle(0,0,60,30));
        this.preview = new lively.morphic.Text(new Rectangle(0,0,100,25), "Style")
        this.preview.setScale(0.5)
        this.addMorph(this.preview);
        this.preview.setPosition(pt(5,5))
        this.preview.ignoreEvents();
        this.setClipMode('hidden');
    },
    copyStyleFrom: function(morph) {
        this.styleObject = morph.getCustomStyle();
        this.preview.applyStyle(this.styleObject)
    },

},'style', {
    applyTo: function(morph) {
        alertOK("apply style to" + morph)
        morph.applyStyle(this.styleObject);
    },
});

Trait('lively.morphic.DraggableBehavior').applyTo(lively.morphic.DraggableBehaviorMorph,
    {override: ['onDragStart', 'onDragEnd', 'dropOn']})
});

Object.extend(Function.prototype, {
    printMethodsAsScripts: function() {
        // for classes that should be converted to PartsBin objects
        var methods = [],
            methodStartRegex = /^\s*function\s*[^\(]*\((\$super,?\s*)?/;
        for (var name in this.prototype) {
            if (!this.prototype.hasOwnProperty(name) || !Object.isFunction(this.prototype[name]))
                continue;
            if (name === 'constructor') continue;
            var method = this.prototype[name],
                string = String(method);
            string = string.replace(methodStartRegex, 'this.addScript(function ' + name + '(')
            string += ')';
            methods.push(string);
        }
        return methods.join('\n\n');
    },
});// end of module
