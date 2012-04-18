module('lively.morphic.Serialization').requires('lively.Network', 'lively.persistence.Serializer', 'lively.morphic.Core', 'lively.morphic.TextCore', 'lively.DOMAbstraction',  'lively.morphic.Widgets').toRun(function() {

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
    onrestore: function() {
        // FIXME this does not belong here
        // event handlers used to be serialized with each morph
        // we disabled that feature. The line below will make sure that old code works
        // if (this.eventHandler) this.eventHandler = null;
//
        // this.registerForEvents();

        // when classes of morphs during object deserialization cannot be found
        // and classPlaceHolder object is created
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
        // this.prepareForNewRenderContext(this.renderContext());
    },

    onstore: function() {},

},
'copying', {
    doNotSerialize: ['_renderContext', 'halos'],

    copy: function() {
        var copy = this.basicCopy();
        copy.withAllSubmorphsDo(function(ea) { ea.setNewId() })
        copy.prepareForNewRenderContext(this.renderContext().newInstance());
        copy.findAndSetUniqueName();
        if (typeof copy.onCopy === "function") { copy.onCopy(); }
        return copy;
    },
    basicCopy: function() {
        return lively.persistence.Serializer.newMorphicCopy(this);
    },
    restoreRenderContextAfterCopy: function(renderCtx) {
        // DEPRECATED use the function called instead
        this.prepareForNewRenderContext(renderCtx);
    },
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
    },

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
                ea.textString = ea.storedString;
            });
    },
    prepareForNewRenderContext: function($super,renderCtx) {
        $super(renderCtx);
        // FIXME cachedTextString is sued for compatiblity before rich text was implemented
        if (this.cachedTextString) {
            this.textString = this.cachedTextString;
            return;
        }
        this.getTextChunks().invoke('restoreFromCacheContent');
    },

});

lively.morphic.World.addMethods(
'serialization', {
    doNotSerialize: ['revisionOnLoad', 'clickedOnMorph', 'draggedMorph'],
    onrestore: function($super) {
        $super();
        this.registerForGlobalEvents();
    },
    interactiveSaveWorldAs: function() {
        var world = this;
        world.prompt('Please enter a relative or absolute path', function(input) {
            if (!input) return;
            var url = input.startsWith('http') ?
                new URL(input) : URL.source.withFilename(input);
            if (!new WebResource(url).exists())
                world.saveWorldAs(url)
            else
                world.confirm(url.toString() + ' already exists. Overwrite?',
                    function(answer) { answer && world.saveWorldAs(url) });
        }, URL.source.filename())
    },
    saveWorldAs: function(url, checkForOverwrites) {
        var serializer = ObjectGraphLinearizer.forNewLively();
        var doc = new Importer().getBaseDocument();
        var start = new Date().getTime();

        lively.persistence.Serializer.serializeWorldToDocumentWithSerializer(this, doc, serializer);

        // make sure that links to bootstrap.js points to the right directory
        new DocLinkConverter(URL.codeBase, url.getDirectory()).convert(doc);

        // Change page title
        var titleTag = doc.getElementsByTagName('title')[0];
        if (titleTag) titleTag.textContent = url.filename().replace('.xhtml', '');

        this.savedWorldAsURL = undefined;
        connect(this, 'savedWorldAsURL', this, 'visitNewPageAfterSaveAs', {
            updater: function($upd, v) {
                if (v && v.toString() !== URL.source.toString()) {
                    $upd(v)
                }
            }
        })

        if (URL.source.eq(url))
            timeOnNetwork = this.storeDoc(doc, url, checkForOverwrites);
        else
            this.checkIfPathExistsAndStoreDoc(doc, url, checkForOverwrites)

        Config.lastSaveTime = new Date().getTime() - start;
    },
    saveWorld: function() {
        this.saveWorldAs(URL.source, true)
    },
    visitNewPageAfterSaveAs: function(url) {
        if (!url) return;
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
        connect(webR, 'status', this, 'handleSaveStatus');
        // allow disabling async saving.
        if(!Config.forceSyncSaving) { webR = webR.beAsync(); }
        var start = new Date().getTime();
		if (this.getUserName) this.getUserName(); // cgi saves user in localStorage
        webR.put(doc, null, checkForOverwrites ? this.revisionOnLoad : null);
        Config.lastSaveTransferTime = new Date().getTime() - start;
    },
    askToOverwrite: function(url) {
        this.confirm(String(url) + ' was changed since loading it. Overwrite?',
            function(input) { if (input) this.saveWorldAs(url) }.bind(this))
    },
    handleSaveStatus: function(status) {
        if (!status.isDone()) return;
        if (status.code() === 412) {
            this.askToOverwrite(status.url);
            return;
        }
        if (status.isSuccess()) {
            this.tryToGetWorldRevision(); // update the rev used for overwrite check
            this.savedWorldAsURL =  status.url;
        } else {
            this.alert('Problem saving ' + status.url + ': ' + status)
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
    createFromJSOOn: function(jso, domElement) {
        var world = this.fromJSO(jso)
        world.displayOnCanvas(domElement)
        this.currentWorld = world;
        return world;
    },
    fromJSO: function(jso) {
        var world = lively.persistence.Serializer.deserializeWorldFromJso(jso);
        world.prepareForNewRenderContext(world.renderContext());
        return world;
    },
    fromDocument: function(doc) {
        var world = lively.persistence.Serializer.deserializeWorldFromDocument(doc),
            cs = lively.persistence.Serializer.deserializeChangeSetFromDocument(doc);
        world.setChangeSet(cs);
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

        morph.addScript(function getIFrame() {
            return this.renderContext().shapeNode;
        })

        morph.addScript(function getGlobal() {
            return this.getIFrame().contentWindow;
        })

        morph.addScript(function getWorld() {
            return this.getGlobal().lively.morphic.World.current()
        })

        morph.addScript(function reload() {
            return this.getIFrame().src = this.url;
        })

        morph.addScript(function run(func) {
            return this.getGlobal().eval('(' + func + ')();');
        })

        return morph;
    },

});

lively.morphic.TextEditor.addMethods(
'serialization', {
    onrestore: function() {
        this.loadFile.bind(this).delay(0);
    },
});

lively.morphic.Script.addMethods(
'serialization', {
    onstore: function(copy) {},
    onrestore: function() {
        this.suspended = true; // resume is triggered from morph
    },
});

}) // end of module
