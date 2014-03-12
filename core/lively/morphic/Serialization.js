module('lively.morphic.Serialization').requires('lively.Network', 'lively.persistence.Serializer', 'lively.morphic.Core', 'lively.morphic.TextCore', 'lively.DOMAbstraction', 'lively.morphic.Widgets').toRun(function() {

// All objects that have an eval'ble toString representation
Trait('lively.morphic.Serialization.ToStringIsSerializerExpressionTrait',
'serialization', {
    serializeExpr: function() { return this.toString() }
})
.applyTo(lively.Point)
.applyTo(lively.Rectangle);

Color.addMethods(
'serialization', {
    serializeExpr: function() { return 'Color.' + this.toString(); }
});

Date.addMethods(
'serialization', {
    serializeExpr: function() { return 'new Date(' + Strings.print(this.toString()) + ')'; }
});

URL.addMethods(
'serialization', {
    serializeExpr: function() { return 'URL.create("' + this.toString() + '")'; }
});

lively.morphic.RadialGradient.addMethods(
'serialization', {
    serializeExpr: function() {
        return Strings.format('lively.morphic.Gradient.create(%s)',
            Objects.inspect({type: 'radial', stops: this.stops, focus: this.focus}));
    }
});
lively.morphic.LinearGradient.addMethods(
'serialization', {
    serializeExpr: function() {
        return Strings.format('lively.morphic.Gradient.create(%s)',
            Objects.inspect({type: 'linear', stops: this.stops, vector: this.vector}));
    }
});

lively.morphic.Shapes.Shape.addMethods(
'copying', {
    doNotSerialize: ['_renderContext']
});

lively.morphic.EventHandler.addMethods(
'serialization', {
    doNotSerialize: ['dispatchTable'],
    onrestore: function() {
        this.dispatchTable = {}
    }
});

lively.morphic.Morph.addMethods(
'serialization', {

    doNotSerialize: ['_renderContext', 'halos', '_isRendered', 'priorExtent', 'cachedBounds'],

    onrestore: function() {
        // when classes of morphs during object deserialization cannot be found
        // a classPlaceHolder object is created
        // we will create a morph for a classPlaceHolder so that the system will run
        if (!this.submorphs) return;
        for (var i = 0; i < this.submorphs.length; i++) {
            var obj = this.submorphs[i];
            if (obj.isClassPlaceHolder) {
                var errorMorph = new lively.morphic.Box((obj.position || pt(0,0)).extent(pt(200,200)));
                errorMorph.isErrorMorph = true;
                // so this object will be stripped from future serializations
                errorMorph.isEpiMorph = true;
                errorMorph.setFill(Color.red);
                errorMorph.classPlaceHolder = obj;
                this.submorphs[i] = errorMorph;
            }
        }
    },

    onstore: function() {}

},
'copying', {

    copy: function(stringified) {
        var copy = this.basicCopy();
        copy.withAllSubmorphsDo(function(ea) { ea.setNewId() })
        copy.prepareForNewRenderContext(this.renderContext().newInstance());
        copy.findAndSetUniqueName();
        copy.disconnectObsoleteControlPoints();
        if (typeof copy.onCopy === "function") { copy.onCopy(); }
        return stringified ? lively.persistence.Serializer.serialize(copy) : copy;
    },
    basicCopy: function() {
        return lively.persistence.Serializer.copy(this);
    },
    fastBulkCopy: function(amount) {
        var original = this;
        var attributesNeedCopy = ["submorphs", "shape", "derivationIds", "scripts"];
        var newMorphs = [];
        var extendedCopies = [];
        for (var i = 0; i < amount; i++) {
            extendedCopies.push(jQuery.extend({}, original));
        }

        for (var i = 0; i < amount; i++) {
            copy = extendedCopies[i];

            attributesNeedCopy.each(function(attr) {
                var currentAttributeValue = original[attr];
                if (Object.isArray(currentAttributeValue)) {
                    // copy each element of the array
                    var originalArray = currentAttributeValue;
                    var newArray = [];
                    for (var i = 0; i < originalArray.length; i++) {
                        newArray.push(jQuery.extend({}, originalArray[i]));
                    }
                    copy[attr] = newArray;
                } else {
                    // just copy the attribute
                    copy[attr] = jQuery.extend({}, currentAttributeValue);
                }
            })

            copy.withAllSubmorphsDo(function(ea) { ea.setNewId() })
            copy.prepareForNewRenderContext(this.renderContext().newInstance());
            copy.findAndSetUniqueName();
            copy.disconnectObsoleteControlPoints();
            if (typeof copy.onCopy === "function") { copy.onCopy(); }


            newMorphs.push(copy)
        }

        return newMorphs;
    },    
    restoreRenderContextAfterCopy: function(renderCtx) {
        // DEPRECATED use the function called instead
        this.prepareForNewRenderContext(renderCtx);
    },
    disconnectObsoleteControlPoints: function() {
        // disconnect obsolete control points that were created during copying
        // e.g. when a line was connected to a rectangle, and only the
        // rectangle was copied
        if (!this.magnets) return;
        this.magnets.forEach(function(eaMagnet) {
            if (!eaMagnet.connectedControlPoints) return;
            eaMagnet.connectedControlPoints.forEach(function(eaCP) {
                if (!eaCP.morph.controlPoints.include(eaCP)) {
                    eaMagnet.removeConnectedControlPoint(eaCP);
                }
            });
        });
    }
},
'serialization', {
    serializeToJSON: function() {
        var serializer = ObjectGraphLinearizer.forNewLively();
        serializer.showLog = false;
        return serializer.serialize(this);
    },
    onLoadFromPartsBin: function() {
        this.prepareForNewRenderContext(this.renderContext());
    },
},
'nameing', {
    findUniqueNameSimilarTo: function(name) {
        var existingNames = [];
        lively.morphic.World.current().withAllSubmorphsDo(function(ea) {
            ea.name && existingNames.push(ea.name);
        });
        if (!existingNames.include(name)) return name;
        var noRegex = /(.*?)([0-9]*)$/,
            noMatch = name.match(/(.*?)([0-9]*)$/),
            no = Number((noMatch && noMatch[2]) || 1),
            nameWithNoNumber = (noMatch && noMatch[1]) || name;
        while(existingNames.include(nameWithNoNumber + no)) no++;
        return nameWithNoNumber + no;
    },
    findAndSetUniqueName: function() {
        this.setName(this.findUniqueNameSimilarTo(this.name || this.constructor.name));
    }
});

Object.extend(lively.morphic.Morph, {
    deserialize: function(json, options) {
        // FIXME this is a first step for a cleanup / abstraction of the
        // serializarion logic of Parts
        options = options || {};
        function loadModules(modules) {
            modules.forEach(function(ea) {
                var m = module(ea); if (m != Global && !m.isLoaded()) m.load(true); });
        }
        var jso = Object.isString(json) ? JSON.parse(json) : json,
            modulesForDeserialization = lively.persistence.Serializer.sourceModulesIn(jso),
            metainfo = options.metainfo;
        if (metainfo) {
            modulesForDeserialization.pushAll(metainfo.getRequiredModules());
            var objLevel = metainfo.migrationLevel,
                docLevel =  LivelyMigrationSupport.documentMigrationLevel;
            if (objLevel && objLevel < docLevel) {
                Array.range(objLevel + 1, docLevel).forEach(function(i) {
                    var layer = Global['DocumentMigrationLevel' + i + 'Layer'];
                    layer && layer.beGlobal();
                });
            }
        }
        loadModules(modulesForDeserialization);
        var serializer = options.serializer || ObjectGraphLinearizer.forNewLivelyCopy(),
            morph = serializer.deserializeJso(jso),
            metaInfo = metainfo || morph.getPartsBinMetaInfo(),
            requiredModules = metaInfo.getRequiredModules().withoutAll(modulesForDeserialization);
        loadModules(requiredModules);
        return morph;
    }
});

lively.morphic.Text.addMethods(
'serialization', {
    doNotSerialize: ['charsTyped'],
    onstore: function($super) {
        $super();
        this.fixChunks();
        // is really the whole text stored?
        var chunks = this.getTextChunks(),
            chunkText = chunks.pluck('textString').join('');
        if (chunkText != this.textString) {
            console.warn('Text bug: text of text chunks != text in morph');
            this.cachedTextString = this.textString; // use old method
        } else {
            delete this.cachedTextString;
        }
        this.getTextChunks().invoke('cacheContent');
    },
    onrestore: function($super) {
        $super();
        this.charsTyped = '';
        var chunks = this.getTextChunks();
        chunks.forEach(function(ea) {
            if (ea.storedString) ea.textString = ea.storedString;
        });
    },
    prepareForNewRenderContext: function($super,renderCtx) {
        $super(renderCtx);
        // FIXME cachedTextString is used for compatiblity before rich text was implemented
        if (this.cachedTextString) {
            this.renderContextDispatch('updateText', this.cachedTextString);
        } else {
            this.getTextChunks().forEach(function(ea) { ea.restoreFromCacheContent(); });
        }
    }

});

lively.morphic.World.addMethods(
'serialization', {
    doNotSerialize: ["_lastZoomAttemptDelta","cachedWindowBounds","clickedOnMorph",
                     "clickedOnMorphTime","currentHaloTarget","currentMenu","draggedMorph",
                     "lastAlert","loadingMorph","revisionOnLoad","savedWorldAsURL","scrollOffset",
                     "statusMessages","worldMenuOpened"],

    onrestore: function($super) {
        $super();
        if (!this.firstHand()) this.addHandMorph();
        this.restoreFixedMorphs.bind(this).delay(0);
        this.getLastModificationDate();
    },

    interactiveSaveWorldAs: function() {
        var world = this;
        world.prompt('Please enter a relative or absolute path', function(input) {
            if (!input) return;
            var url = input.startsWith('http') ?
                new URL(input) : URL.source.withFilename(input);
            if (!new WebResource(url).exists()) {
                world.saveWorldAs(url, true);
            } else {
                world.confirm(url.toString() + ' already exists. Overwrite?',
                              function(answer) { answer && world.saveWorldAs(url, true); });
            }
        }, URL.source.filename())
    },

    saveWorldAs: function (url, checkForOverwrites, bootstrapModuleURL) {
        // FIXME: this should go somewhere else or actually not be necessary at
        // all... cleanup, removing junk css defs
        lively.morphic.StyleSheets.removeStylesForMorphsNotIn(this);

        // Step 1: Get serialized representation of the world
        var serializer = lively.persistence.ObjectGraphLinearizer.forNewLively(),
            json = serializer.serialize(this, null, serializer);

        // Step 2: Create a new document
        bootstrapModuleURL = bootstrapModuleURL ?
            new URL(bootstrapModuleURL) :
            new URL(module("lively.bootstrap").uri()).withoutTimemachinePath();
        var preview = this.asHTMLLogo({asXML: false, asFragment: true}),
            title = this.name || url.filename().replace(/\.x?html$/, ''),
            bootstrapFile = bootstrapModuleURL.relativePathFrom(url),
            css = $("head style").toArray().map(function(el) {
                return {css: el.textContent, id: el.getAttribute('id')}; }),
            metaTags = this.getMetaTags(),
            linkTags = this.getLinkTags(),
            docSpec = {
                title: title,
                metaTags: metaTags,
                linkTags: linkTags,
                migrationLevel: LivelyMigrationSupport.migrationLevel,
                serializedWorld: json,
                html: preview,
                styleSheets: css,
                externalScripts: [bootstrapFile]
            },
            doc = lively.persistence.HTMLDocBuilder.documentForWorldSerialization(docSpec);

        this.savedWorldAsURL = undefined;
        lively.bindings.connect(this, 'savedWorldAsURL', this, 'visitNewPageAfterSaveAs', {
            updater: function($upd, v) {
                if (v && v.toString() !== URL.source.toString()) { $upd(v); }
            }
        })

        if (!URL.source.eqDomain(url)/*WebDAV stuff usually won't work cross domain*/ || URL.source.eq(url)) {
            this.storeDoc(doc, url, checkForOverwrites);
        } else {
            this.checkIfPathExistsAndStoreDoc(doc, url, checkForOverwrites);
        }
    },

    saveWorld: function() {
        this.saveWorldAs(URL.source, true)
    },

    visitNewPageAfterSaveAs: function(url) {
        if (!url) return;
        if (url.toString().indexOf("autosave") >= 0) return;
        this.confirm("visit " + url + "?", function(yes) {
            if (yes)
                window.open(url.toString());
        });
    },
    checkIfPathExistsAndStoreDoc: function(doc, url, checkForOverwrites) {
        var dirWebR = new WebResource(url.getDirectory());
        if (dirWebR.exists()) { this.storeDoc(doc, url, checkForOverwrites); return };

        this.confirm('Directory ' + dirWebR.getURL() + ' does not exist! Create it?', function(answer) {
            if (!answer) return;
            connect(dirWebR, 'status', this, 'setStatusMessage', {
                updater: function($upd, status) {
                    if (!status.isDone()) return;
                    if (!status.isSuccess()) $upd(status, Color.green)
                    else $upd(status, Color.red)
                }
            })
            dirWebR.ensureExistance();
            this.storeDoc(doc, url, false/*no check if dir !exists*/);
        }.bind(this))
    },
    storeDoc: function (doc, url, checkForOverwrites) {
        var webR = new WebResource(url);
        webR.createProgressBar('Saving...');
        connect(webR, 'status', this, 'handleSaveStatus', {updater: function($upd, status) {
            $upd(status, this.sourceObj); // pass in WebResource as well
        }});
        if (!Config.forceSyncSaving) { // optional asynchronous save
            webR = webR.beAsync();
        }
        var putOptions = {};
        if (checkForOverwrites) {
            if (this.lastModified) putOptions.ifUnmodifiedSince = this.lastModified;
            else if (this.revisionOnLoad) putOptions.requiredSVNRevision = this.revisionOnLoad;
        }
        webR.put(doc, null, putOptions);
    },
    askToOverwrite: function(url) {
        this.confirm(String(url) + ' was changed since loading it. Overwrite?',
            function(input) { if (input) this.saveWorldAs(url, false) }.bind(this))
    },
    handleSaveStatus: function(status, webR) {
        if (!status.isDone()) return;
        if (status.code() === 412) {
            this.askToOverwrite(status.url);
            return;
        }
        if (status.isSuccess()) {
             // update the rev used for overwrite check
            this.tryToGetWorldRevision();
            this.getLastModificationDate(webR);
            this.savedWorldAsURL =  status.url;
            lively.bindings.signal(this, 'savingDone', status.url);
            Config.get('showWorldSave') && this.alertOK('World successfully saved');
        } else {
            Config.get('showWorldSave') && this.alert('Problem saving ' + status.url + ': ' + status);
        }
    },
    getLastModificationDate: function(webR) {
        if (webR && webR.lastModified) {
            this.lastModified = webR.lastModified;
        } else {
            webR = new WebResource(URL.source);
            lively.bindings.connect(webR, 'lastModified', this, 'lastModified');
            webR.beAsync().get();
        }
    },
    tryToGetWorldRevision: function() {
        var webR = new WebResource(URL.source);
        connect(webR, 'headRevision', this, 'revisionOnLoad');
        webR.beAsync().getHeadRevision();
    },
    getServerRevision: function() {
        return new WebResource(URL.source).getHeadRevision().headRevision;
    },
    getCurrentAndServerVersion: function() {
        return [this.revisionOnLoad, this.getServerRevision()]
    }
});

Object.extend(lively.morphic.World, {
    createFromJSONOn: function(json, domElement) {
        return this.createFromJSOOn(JSON.parse(json), domElement);
    },
    createFromJSOOn: function(jso, domElementOrDocument) {
        var world = this.fromJSO(jso),
            isDoc = !domElementOrDocument.ownerDocument;
        if (isDoc) world.displayOnDocument(domElementOrDocument);
        else world.displayOnElement(domElementOrDocument);
        this.registerWorld(world)
        return world;
    },
    fromJSO: function(jso) {
        var world = lively.persistence.Serializer.deserializeWorldFromJso(jso);
        world.prepareForNewRenderContext(world.renderContext());
        return world;
    },
    fromDocument: function(doc) {
        var world = lively.persistence.Serializer.deserializeWorldFromDocument(doc);
        world.prepareForNewRenderContext(world.renderContext());
        return world;
    },

    loadInIFrame: function(url, bounds) {
        url = new URL(url); //.withQuery({dontBootstrap: true});
        function createIFrame(url, bounds) {
            // document.body.style.position = 'absolute'
            var iframe = XHTMLNS.create('iframe');
            // iframe.style.position = 'relative'
            iframe.style.top = bounds.top() + 'px';
            iframe.style.left = bounds.left() + 'px';
            iframe.style.width = bounds.width + 'px';
            iframe.style.height = bounds.height + 'px';
            iframe.src = url.toString();
            return iframe;
        };

        var iFrame = createIFrame(url, bounds || new Rectangle(0,0, 800,300)),
            shape = new lively.morphic.Shapes.External(iFrame),
            morph = new lively.morphic.Morph(shape);

        morph.url = url;
        morph.setStyleClassNames(['selectable']);

        morph.addScript(function makeEditorEvalInIframe(editor) {
            editor.iframe = this;
            editor.addScript(function boundEval(__evalStatement) {
                var ctx = this.getDoitContext() || this,
                    __evalStatement = lively.ast.acorn.transformReturnLastStatement(__evalStatement),
                    interactiveEval = new Function(__evalStatement);
                return this.iframe.run(interactiveEval);
            });
            editor.addScript(function getDoitContext() { return this.iframe.getGlobal(); });
        });

        morph.addScript(function morphMenuItems() {
            var target = this;
            return $super().concat([
                ['Reload', function() { target.reload(); }],
                ['Open workspace', function() {
                    var workspace = $world.addCodeEditor({title: String(target.url)});
                    target.makeEditorEvalInIframe(workspace);
                }],
                ['Edit page', function() {
                    module('lively.ide.tools.TextEditor').load(true);
                    var textEd = lively.BuildSpec('lively.ide.tools.TextEditor').createMorph().openInWorldCenter();
                    target.makeEditorEvalInIframe(textEd.get('editor'));
                    textEd.openURL(target.url);
                    lively.bindings.connect(textEd, 'contentStored', target, 'reload');
                }]
            ]);
        });

        morph.addScript(function getIFrame() {
            return this.renderContext().shapeNode;
        });

        morph.addScript(function getGlobal() {
            return this.getIFrame().contentWindow;
        });

        morph.addScript(function getWorld() {
            return this.getGlobal().lively.morphic.World.current()
        });

        morph.addScript(function reload() {
            return this.getIFrame().src = this.url;
        });

        morph.addScript(function run(func) {
            return this.getGlobal().eval('(' + func + ')();');
        });

        return morph;
    },

    loadInIFrameWithWindow: function(url, bounds) {
        var iframe = this.loadInIFrame(url, bounds && bounds.extent().extentAsRectangle());
        return iframe.openInWindow({pos: bounds && bounds.topLeft(), title: String(iframe.url)});
    }
});

lively.morphic.Script.addMethods(
'serialization', {
    doNotSerialize: ['currentTimeout'],
    onstore: function(copy) {},
    onrestore: function() {
        this.suspended = true; // resume is triggered from morph
    },
});

lively.morphic.HandMorph.addMethods(
'serialization', {
    doNotSerialize: ['internalClickedOnMorph']
});

}) // end of module
