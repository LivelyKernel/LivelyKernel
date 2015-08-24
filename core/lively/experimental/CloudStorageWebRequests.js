module('lively.experimental.CloudStorageWebRequests').requires('cop.Layers', 'lively.Network', 'lively.ide.SourceDatabase', 'lively.net.OneDrive', 'lively.net.Dropbox').toRun(function() {

cop.create("CloudStorageWebRequestsLayer").refineClass(URL, {
    get splitter() {
        return new RegExp('^(http|https|file|dropbox|onedrive)://([^/:]*)(:([0-9]+))?(/.*)?$');
    }
}).refineObject(URL, {
    ensureAbsoluteRootPathURL: function (urlString) {
        return /^(http|file|dropbox|onedrive).*/.test(urlString) ?
            new URL(urlString) :
            new URL(Config.rootPath).withRelativePath(urlString);
    },
    ensureAbsoluteCodeBaseURL: function(urlString) {
        return /^(http|file|dropbox|onedrive).*/.test(urlString) ?
            new URL(urlString) :
            URL.codeBase.withRelativePath(urlString);
    },
    ensureAbsoluteURL: function(urlString) {
        return /^(http|file|dropbox|onedrive).*/.test(urlString) ?
        new URL(urlString) :
        URL.source.notSvnVersioned().getDirectory().withRelativePath(urlString);
    },
}).refineClass(WebResource, {
    initialize: function(url) {
        switch (new URL(url).protocol) {
            case "dropbox":
            case "onedrive":
                this.setWithLayers([CloudStorageWebRequestCloudDriveLayer]);
                break;
        }
        return cop.proceed.apply(this, arguments);
    }
}).refineClass(AnotherSourceDatabase, {
    mapURLToRelativeModulePaths: function(url) {
        if (url.protocol === "onedrive" || url.protocol === "dropbox") {
            return url.protocol +
                    (decodeURIComponent(url.hostname) + url.pathname).replace("//", "/").replace(/\/$/, "");
        } else {
            return cop.proceed.apply(this, arguments);
        }
    },
    // TODO: merge below with master
    interestingLKFilesAndDirs: function(url) {
        var webR = new WebResource(url).beSync().getSubElements(),
            fileURLs = webR.subDocuments.invoke("getURL"),
            dirURLs = webR.subCollections.invoke("getURL");
        return [dirURLs, fileURLs.map(this.mapURLToRelativeModulePaths.bind(this))
                       .filter(this.canBeDisplayedInSCB.bind(this)).uniq()];
    },
}).refineClass(lively.ide.SourceControlNode, {
    // TODO: merge below with master
    locationChanged: function() {
        var url = this.browser.getTargetURL();
        this.browser.selectNothing();

        try {
            var filesAndDirs = this.target.interestingLKFilesAndDirs(url);
            this.allFiles = filesAndDirs[1];
            this.subNamespacePaths = filesAndDirs[0];
        } catch (e) {
            // can happen when a restored browser from a world that has been moved
            // uses a now incorrect relative URL
            this.statusMessage('Cannot get files for code browser with url '
                + url + ' error ' + e, Color.red, 6);
            // show(e.stack)
            this.allFiles = [];
            this.subNamespacePaths = [];
        }

        // FIXME remove the inconsistency of "core" files
        var isUrlRootOfRepository = this.browser.codeBaseUrlString() == String(url);
        this.parentNamespacePath = isUrlRootOfRepository ? null : url.withFilename('../');
    }
}).refineClass(lively.ide.ModuleWrapper, {
    fileURL: function() {
        var m = this.module().name().match(/^(onedrive|dropbox)\./);
        if (m) {
            return new URL(this.moduleName().replace(m[1], m[1] + "://").replace(".", "/") + "." + this.type())
        } else {
            return cop.proceed.apply(this, arguments);
        }
    }
}).refineClass(lively.ide.SystemBrowser, {
    // XXX: Replaces entire method for a one-line addition to the items array :(
    openLocationPaneMenu: function() {
        var button = this.panel.locationPaneMenuButton;
        var self = this;
        var items = [
            ['Your directory', function() {self.switchToLocalCodebase()}],
            ['Your OneDrive', function() {self.setTargetURL(new URL("onedrive:///"))}],
            ['Your Dropbox', function() {self.setTargetURL(new URL("dropbox:///"))}],
            ['Lively code base', function() {self.switchToLivelyCodebase()}]];
        var menu = new lively.morphic.Menu('Location ...', items);
        var menuBtnTopLeft = button.bounds().topLeft();
        var menuTopLeft = menuBtnTopLeft.subPt(pt(menu.bounds().width, 0));

        menu.openIn(
            lively.morphic.World.current(),
            button.getGlobalTransform().transformPoint(pt(0-menu.bounds().width, 0)),
            false);
    }
}).refineClass(lively.store.ObjectRepository, {
    getRecords: function (querySpec, thenDo)  {
        if (("" + this.repoURL).match(/^dropbox|onedrive/)) {
            // do nothing, becaus there is nothing to
            var result = [{rev: null, date: new Date()}] // #Mock #TODO #JensLincke
            thenDo && thenDo(null, result)
            return result
        } else {
            return cop.proceed.apply(this, arguments)
        }
    }
}).refineClass(lively.PartsBin.PartsSpace, {
    load: function(async) {
        var webR = new WebResource(this.getURL()).noProxy();
        if (async) webR.beAsync();
        // ask for the files of a directory and update so that the partItems correspond to the files found
        connect(webR, 'subDocuments', this, 'setPartItemsFromURLList', {
            converter: function(webResources) { return webResources ? webResources.invoke('getURL') : [] }})
        webR.getSubElements();
        return this;
    }
}).refineClass(lively.PartsBin.PartItem, {
    loadPartMetaInfo: function (isAsync, rev) {
        // alertOK("load meta info " + isAsync + " " + rev)
        if (!isAsync || !rev) {
            var webR = new WebResource(this.getMetaInfoURL()).beSync();
            webR.whenDone(function(content, status) {
                if (webR.status.isSuccess()) {
                    var metaInfo = lively.persistence.Serializer.deserialize(webR.content);
                    metaInfo.lastModifiedDate = webR.lastModified;
                    this.loadedMetaInfo = metaInfo;
                } else {
                    throw new Error("could not get MetaInfo: " +  status)
                }
            }.bind(this))
            if (isAsync) webR.beAsync()
            webR.forceUncached().get();
            
            return this;
        }

        var url = this.getMetaInfoURL(),
            root = this.guessRootForURL(url),
            path = url.relativePathFrom(root),
            self = this,
            query = !!rev ? {
                paths: [path],
                attributes: ['content', 'date'],
                version: rev,
                limit: 1
            } : {
                paths: [path],
                attributes: ['content', 'date'],
                newest: true,
                limit: 1
            };

        new lively.store.ObjectRepository(root).getRecords(query, function(err, rows) {
            if (err) { show(err); self.loadedMetaInfo = null; return; }
            if (rows[0].content) {
                var metaInfo = lively.persistence.Serializer.deserialize(rows[0].content)
                metaInfo.lastModifiedDate = new Date(rows[0].date);
                self.loadedMetaInfo = metaInfo;
            } else {
                throw new Error("No meta data found for: " + JSON.prettyPrint(query))
            }
        });
    },
    setPartFromJSON: function(json, metaInfo, rev) {
        // alertOK("load part from json " )
        var part = this.deserializePart(json, metaInfo);
        part.partsBinMetaInfo.revisionOnLoad = rev;
        part.partsBinMetaInfo.lastModifiedDate = metaInfo.lastModifiedDate;
        this.setPart(part);
    },
    load: function (isAsync, rev) {

        if(!isAsync || !rev){
            // alertOK("load " +isAsync + " " + rev)
            var webR = new WebResource(this.getFileURL()).noProxy().forceUncached();
            if (isAsync) webR.beAsync();
            webR.whenDone(function(json, status) {
                // alertOK("loaded " +json )
                if (status.isSuccess()) { 
                    this.json = json 
                    this.lastModifiedDate = webR.lastModified;
                    return 
                }
                if (status.isDone()) {
                    throw new Error("could not load " + webR.getURL() + ": " +status)
                }
            }.bind(this));
            webR.get();
            return this;
        }

        var url = this.getFileURL(),
            root = this.guessRootForURL(url),
            path = url.relativePathFrom(root),
            self = this,
            query = !!rev || rev === 0 ? {
                    paths: [path],
                    attributes: ['content'],
                    version: rev,
                    limit: 1
                } : {
                    paths: [path],
                    attributes: ['content'],
                    newest: true,
                    limit: 1
                };

        new lively.store.ObjectRepository(root).getRecords(query, function(err, rows) {
            if (err) { show(err); self.json = null; return; }
            self.json = rows[0].content;
        });
        return this;
    },
    loadPart: function(isAsync, optCached, rev, cb) {
        // alertOK("load part " )
        if (optCached) { this.setPartFromJSON(this.json); return this; }

        // a revisionOnLoad should always be set! If no PartsBinMetaInfo can
        // be found, the revisionOnLoad is computed via the webresource
        if (rev != null) {
            this.rev = rev;
        } else if (this.loadPartVersions && this.loadPartVersions().partVersions && this.loadPartVersions().partVersions.length > 0) {
            this.rev = this.loadPartVersions().partVersions.first().rev;
        } else {
            this.rev = new WebResource(this.getFileURL()).getHeadRevision().headRevision;
        }

        // ensure that setPartFromJSON is only called when both json and
        // metaInfo are there.
        var loadTrigger = {
            item: this,
            rev: this.rev,
            triggerSetPart: function() {
                this.item.setPartFromJSON(this.json, this.metaInfo, this.rev);
            },
            jsonLoaded: function(json) {
                // alertOK("json loaded")
                this.json = json;
                if (this.metaInfo === undefined) return;
                this.triggerSetPart();
            },
            metaInfoLoaded: function(metaInfo) {
                // alertOK("metainfo loaded")
                try {
                    this.metaInfo = metaInfo;
                    if (!this.json) return;
                    this.triggerSetPart();
                } catch(e) {
                    console.log('Error on setPartFromJSON: ' + e)
                }
            },
            triggerCallback: cb ? Functions.once(cb.curry(null)) : Functions.Null,
        }
        lively.bindings.connect(this, 'json', loadTrigger, 'jsonLoaded', {removeAfterUpdate: true});
        lively.bindings.connect(this, 'loadedMetaInfo', loadTrigger, 'metaInfoLoaded', {removeAfterUpdate: true});
        lively.bindings.connect(this, 'part', loadTrigger, 'triggerCallback', {removeAfterUpdate: true});
        this.load(isAsync, rev);
        this.loadPartMetaInfo(isAsync, rev);
        return this;
    }
}).refineObject(lively.PartsBin, {
    getPartsBinURLs: function() {
        var urls =  cop.proceed.apply(this, arguments);
        urls.push(new URL("dropbox:///Lively/PartsBin/"));  
        urls.push(new URL("onedrive:///Lively/PartsBin/"));  
        return urls
    }
}).beGlobal();

WebResource.addMethods(LayerableObjectTrait);
WebResource.prototype.lookupLayersIn = [];

cop.create("CloudStorageWebRequestCloudDriveLayer").refineClass(WebResource, {
    plugWebResource: function(source, dest) {
        dest.status = source.status;
        dest.content = source.content;
        dest.contentDocument = source.contentDocument;
        dest.responseHeaders = source.responseHeaders;
        dest.streamContent = source.streamContent;
        dest.readystate = source.readystate;
        dest.subCollections = source.subCollections;
        dest.subDocuments = source.subDocuments;
        connect(source, 'content', dest, 'content');
        connect(source, 'status', dest, 'status');
        connect(source, 'contentDocument', dest, 'contentDocument');
        connect(source, 'responseHeaders', dest, 'responseHeaders');
        connect(source, 'streamContent', dest, 'streamContent');
        connect(source, 'readystate', dest, 'readystate');
        connect(source, 'subCollections', dest, 'subCollections');
        connect(source, 'subDocuments', dest, 'subDocuments');
    },
    request: function(method, optContent) {
        var object;
        switch(this.getURL().protocol) {
            case "onedrive":
                object = lively.net.OneDrive; break;
            case "dropbox":
                object = lively.net.Dropbox; break;
            default:
                throw "shouldn't be here!"
        }
        var answer = object[method](
            (decodeURIComponent(this.getURL().hostname) + this.getURL().pathname).replace("//", "/"),
            this.isSync(),
            optContent
        );
        this.plugWebResource(answer, this)
        return this;
    },
    create: function() { 
        return this.request("create") },
    get: function() { 
        return this.request("get") },
    getSubElements: function() { 
        return this.request("getSubElements") },
    put: function(content) { 
        return this.request("put", content) },
    del: function() { 
        return this.request("del") },
    post: function(data) { 
        return this.request("post", data) },
    head: function() { 
        return this.request("head") },
});

}) // end of module
