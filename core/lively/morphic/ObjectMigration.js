module('lively.morphic.ObjectMigration').requires('lively.morphic.Serialization', 'cop.Layers').toRun(function() {

Object.extend(LivelyMigrationSupport, {
    moveFileFromTo: function(sourceURL, destURL, onFinish, fixLinks, dryRun, log) {
        log = log || alertOK;

        var from = new WebResource(sourceURL).forceUncached();

        if (fixLinks) {
            log("FIX LINK NOT YET IMPLEMENTED")
        }

        new WebResource(destURL.getDirectory()).ensureExistance();

        var content = from.get().contentDocument;

        if (!dryRun) from.moveTo(destURL);

        if (! sourceURL.filename().endsWith('.xhtml')) {
            if (onFinish) onFinish()
            return
        }

        var dest = new WebResource(destURL),
            force = true;


        if (fixLinks) {

        }

        new DocLinkConverter(URL.codeBase, destURL.getDirectory()).convert(content)

        connect(dest, 'status', {
            onMove: function(status) {
            if (!status.isSuccess()) {
                alert('Could not move ' + sourceURL)
                return
            }
            alertOK(sourceURL.toString() + ' moved to ' + destURL)
            from.del()
            if (onFinish) onFinish()

        }}, 'onMove')
        if (!dryRun)
            dest.put(content)
        else
            if (onFinish) onFinish()
    },

    createWorldInfo: function(url) {
        return {
            url: url,
            fetchMetaData: function() {
                var webR = new WebResource(this.url).beAsync();
                connect(webR, 'content', this, 'extractMetaData', {
                    updater: function($upd, content) {
                    if (this.sourceObj.status.isDone()) $upd(content)} });
                webR.get();
            }.asScript(),
            extractMetaData: function(worldContent) {
                this.isLively1World = worldContent.indexOf('isNewMorphic: true') === -1;
                progressInc();
            }.asScript(),
            toString: function() {
                var string = this.url.relativePathFrom(URL.codeBase);
                if (this.isLively1World) string += ' (Lively1)';
                return string;
            }.asScript()
        }
    }
});


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
Migration Level History:
1 - world expects that dragging is enabled so that selection morph is created
2 - renamed setOverflowMode to setClipMode --> _OverflowMode --> _ClipMode
3 - [NOT YET WORKING] CSS text attribute white-space should be set to pre-line instead of pre-wrap to support text-align justify
4 - ???
5 - ???
6 - renderContextTables are no longer props of shapes/morphs, don't deserialize them
7 - No more changesets
8 - Reframe handles for windows
9 - Buttons of a window are in titleBar.buttons array
10 - lively.lang refactoring, removing lively.lang.Closure module
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

if (false && LivelyMigrationSupport.documentMigrationLevel < 1) {
    lively.bindings.callWhenNotNull(
        lively.morphic.World, 'currentWorld',
        {enableDragging: function(w) { w.enableDragging()}}, 'enableDragging');
}

if (false && LivelyMigrationSupport.documentMigrationLevel < 2) {
    cop.create('DocumentMigrationLevel2Layer')
    .refineClass(lively.morphic.Morph, {
        onrestore: function() {
            if (this._OverflowMode) {
                this._ClipMode = this._OverflowMode;
                delete this._OverflowMode;
            }
            cop.proceed();
        },
    }).beGlobal();
};

if (false && LivelyMigrationSupport.documentMigrationLevel < 3) {
    cop.create('DocumentMigrationLevel3Layer')
    .refineClass(lively.morphic.Text, {
        onrestore: function() {
            this._WhiteSpaceHandling = 'pre-line';
            cop.proceed();
        }
    }).beGlobal();
};

if (false && LivelyMigrationSupport.documentMigrationLevel < 4) {
    /// fixes the issue that after ignore events label was still shown
    cop.create('DocumentMigrationLevel4Layer')
    .refineClass(lively.morphic.Text, {
        prepareForNewRenderContext: function(ctx) {
            cop.proceed(ctx);
            if (this.eventsAreIgnored)
            this.ignoreEvents() // will set the right properties
        }
    }).beGlobal();
};

if (false && LivelyMigrationSupport.documentMigrationLevel < 5) {
    /// fixes the issue that after ignore events label was still shown
    cop.create('DocumentMigrationLevel5Layer')
    .refineClass(lively.morphic.Morph, {
        onrestore: function() {
            if (typeof this.isClip === 'boolean' && this.hasOwnProperty('isClip')) {
                delete this.isClip
            }
            cop.proceed();
        }
    }).beGlobal();
};

if (LivelyMigrationSupport.documentMigrationLevel < 6) {
    // 6 - renderContextTables are no longer props of shapes/morphs, don't deserialize them
    lively.module("lively.persistence.Serializer").runWhenLoaded(function() {
        ObjectLinearizerPlugin.subclass('IgnoreRenderContextTablePlugin', {
            ignorePropDeserialization: function(regObj, key, val) { return key === 'renderContextTable' }
        });
        lively.persistence.pluginsForLively.push(IgnoreRenderContextTablePlugin);
    });
};

if (LivelyMigrationSupport.documentMigrationLevel < 7) {
    // 7 - no more old changesets
    if (Global.Importer) {
        Importer.prototype.getBaseDocument = Importer.prototype.getBaseDocument.wrap(function(proceed) {
            var doc = proceed(),
                csNode = doc.getElementById("WorldChangeSet");
            if (csNode) csNode.parentNode.removeChild(csNode);
            return doc;
        });
    }
    lively.module("lively.morphic.Core").runWhenLoaded(function() {
        lively.morphic.World.addMethods({
            onrestore: lively.morphic.World.prototype.onrestore.wrap(function(proceed) {
                proceed();
                // remove deperecated changeSet attribute
                if (this.hasOwnProperty("changeSet")
                  && this.changeSet
                  && this.changeSet.isChangeSetReplacement) {
                    delete this.changeSet;
                }
            })
        });
    });
};

if (LivelyMigrationSupport.documentMigrationLevel < 8) {
    // 8 - reframe handles are class instances now
    lively.module("lively.morphic.Widgets").runWhenLoaded(function() {
        lively.morphic.Window.addMethods({
            onrestore: lively.morphic.Window.prototype.onrestore.wrap(function($proceed) {
                $proceed();
                [this.rightReframeHandle, this.bottomReframeHandle, this.reframeHandle].compact().invoke('remove');
                var e = this.getExtent();
                this.reframeHandle = this.addMorph(new lively.morphic.ReframeHandle('corner', pt(14,14)));
                this.rightReframeHandle = this.addMorph(new lively.morphic.ReframeHandle('right', e.withX(this.spacing)));
                this.bottomReframeHandle = this.addMorph(new lively.morphic.ReframeHandle('bottom', e.withY(this.spacing)));
                this.alignAllHandles();
            })
        });
    });
};

if (LivelyMigrationSupport.documentMigrationLevel < 9) {
    // a flexible number of window controls are now accessible 
    // via a window's titlebar's buttons property
    lively.module("lively.morphic.Widgets").runWhenLoaded(function() {
        cop.create('DocumentMigrationLevel9Layer')
        .refineClass(lively.morphic.Window, {
            onrestore: function() {        
                var widget = this.targetMorph && this.targetMorph.ownerWidget;
                
                // only migrate older windows
                if (this.titleBar.buttons) return;
                
                this.titleBar.buttons = [];
                this.titleBar.submorphs.select(function (ea) {
                    return ea.constructor.name === 'WindowControl'
                }).sortBy(function (ea) {
                    return ea.getPosition().x
                }).reverse().forEach(function (ea) {
                    this.titleBar.buttons.push(ea);
                }, this);
                
                this.menuButton = this.titleBar.menuButton;
                this.collapseButton = this.titleBar.collapseButton;
                this.closeButton = this.titleBar.closeButton;
                            
                if (widget && widget.constructor.name === 'SystemBrowser') {
                    widget.addNavigationCollapseButton();
                }
                
                this.titleBar.adjustElementPositions();
                
                cop.proceed();
            }
        }).beGlobal();
    });
}

if (Config.enableShapeGetterAndSetterRefactoringLayer) {
    // this layer will make shapes compatible that stored their properties
    // manually the new scheme for shapes is the same as for morphs, e.g.:
    // shape._Extent instead of shape.extent
    lively.module("lively.morphic.Core").runWhenLoaded(function() {
        cop.create('ShapeGetterAndSetterRefactoringLayer')
        .refineClass(lively.morphic.Shapes.Shape, {
            onrestore: function() {
                if (this.position) { this._Position = this.position; delete this.position };
                if (this.extent) { this._Extent = this.extent; delete this.extent };
                if (this.fill) { this._Fill = this.fill; delete this.fill };
                if (this.position) { this._Position = this.position; delete this.position };
                if (this.borderWidth) { this._BorderWidth = this.borderWidth; delete this.borderWidth };
                if (this.borderColor) { this._BorderColor = this.borderColor; delete this.borderColor };
                if (this.strokeOpacity) { this._StrokeOpacity = this.strokeOpacity; delete this.strokeOpacity };
                if (this.borderRadius) { this._BorderRadius = this.borderRadius; delete this.borderRadius };
                cop.proceed();
            }
        }).beGlobal();
    });
};

}) // end of module
