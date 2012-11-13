module('lively.experimental.CopyAndPaste').requires('cop.Layers').toRun(function() {

cop.create("ClipboardLayer").refineClass(lively.morphic.World, {
    onPasteFromClipboard: function(evt) {
        if (evt === this.lastEvt) return; // hack
        this.lastEvt = evt;
        evt.stop()
        var data = evt.clipboardData.getData("text/plain")
        var partItem = new lively.PartsBin.PartItem("anonymous")
        try {
            var part = partItem.deserializePart(data)
        } catch(e) {
            alertOK("could not paste (deserialization error)")
            return false
        }
        if (this.pastePositionInWorld) {
            part.setPosition(this.pastePositionInWorld)
        }
        // paste the next morph a little more to the bottom right
        this.pastePositionInWorld = part.getPosition().addPt(pt(20,20))
        part.openInWorld()
        if (part.isCopyAndPasteGroup) {
            part.submorphs.forEach(function(ea) {
                this.addMorph(ea)
            }, this);
            part.remove();
        }
        return true
    },
    onCutToClipboard: function(evt) {
        var morphs = this.onCopyToClipboard(evt)
        if (morphs) {
            morphs.invoke('remove');
            this.selectionMorph.remove();
        }
    },
    onCopyToClipboard: function(evt) {
        // return morphs that were successfully copied
        // nameclash with onCopy
        if (evt === this.lastEvt) return; // hack
        this.lastEvt = evt;
        evt.stop()

        if (!this.selectionMorph || !this.selectionMorph.selectedMorphs 
            || this.selectionMorph.selectedMorphs.length == 0) {
            return // nothing to copy
        }
        var morphs = this.selectionMorph.selectedMorphs;
        // if there are many objects, temporarly group them
        if (this.selectionMorph.selectedMorphs.length > 1) {
            var g = this.selectionMorph.makeGroup()
            g.isCopyAndPasteGroup = true;
            var grouped = true;
        }
        var content  = this.selectionMorph.selectedMorphs[0]
        // so that we dont have to remove the part (this could trigger side effects)
        var ignoreOwnerPlugin = new GenericFilter();
        ignoreOwnerPlugin.addFilter(function(obj, propName) {
            return obj === content && propName === 'owner';
        });
        var serializer = ObjectGraphLinearizer.forNewLivelyCopy();
        serializer.addPlugin(ignoreOwnerPlugin);
        try {
            var json = serializer.serialize(content);
            var htmlLogo = content.asHTMLLogo();
        } catch(e){
            alertOK("could not copy:" + e )
        } finally {
            if (content.owner) content.owner.addMorph(content);
            if (grouped) {
                this.selectionMorph.unGroup();
                content.remove()
            }
        }
        evt.clipboardData.setData("text/html", htmlLogo)
        evt.clipboardData.setData("text/plain", json)
        return morphs
    },
    
    isFocused: function() {
        // override isFocused because, world acts only if it is in focus
        if (this.textFocusTarget)
            return cop.proceed() || this.textFocusTarget.isFocused()
        return cop.proceed()
    },

    ensureTextFocusTarget: function() {
        // A world seems to have problems taking the focus for copy and paste
        // so we have an alternative target, like in the days of the clipboard hack
        // $world.textFocusTarget.remove(); delete $world.textFocusTarget
        if (!this.textFocusTarget) {
            // this.textFocusTarget = new TextMorph(new Rectangle(0,0,20,20),"");
            this.textFocusTarget = new TextMorph(new Rectangle(0,0,3,3),"");
            this.textFocusTarget.setOpacity(0)
            this.textFocusTarget.disableEvents();
            this.textFocusTarget.registerForEvent('copy', this, 'onCopyToClipboard', true);
            this.textFocusTarget.registerForEvent('cut', this, 'onCutToClipboard', true);
            this.textFocusTarget.registerForEvent('paste', this, 'onPasteFromClipboard', true);

            // the worlds wants the  normal keyboard too..
            // var t = this.textFocusTarget;
            // t.registerForEvent('keydown', this, 'onKeyDown', true);
            // t.registerForEvent('keyup', this, 'onKeyUp', true);
            // t.registerForEvent('keypress', this, 'onKeyPress', true);


            this.textFocusTarget.isEpiMorph = true;
            this.addMorph(this.textFocusTarget);
        }
        return this.textFocusTarget
    },

    onMouseUp: function(evt) {
        var result =  cop.proceed(evt);
        // only clicks on the world itself
        if (this.renderContext().shapeNode !== evt.toElement) return;

        this.ensureTextFocusTarget()

        if (!this.selectionMorph || !this.selectionMorph.owner) {
            this.textFocusTarget.focus()
            this.pastePositionInWorld = evt.mousePoint

        }
        // this.textFocusTarget.focus.bind(this.textFocusTarget).delay(0.1);
        return result
    },
}).refineClass(lively.morphic.Selection, {
    selectMorphs: function(morphs) {
        cop.proceed(morphs);
        // alertOK("selectMorphs")
        var m = this.world().ensureTextFocusTarget()
        m.focus.bind(m).delay(0.5); // hack, who is taking the focus...
    },
})

ClipboardLayer.beNotGlobal()
ClipboardLayer.beGlobal()







}) // end of module