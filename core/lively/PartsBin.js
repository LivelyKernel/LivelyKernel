var reqs = Config.isNewMorphic ? [] : ['lively.oldCore.Morphs']; // FIXME

module('lively.PartsBin').requires(['lively.Traits'].concat(reqs)).toRun(function() {

Object.subclass('lively.PartsBin.PartItem',
'initializing', {
    initialize: function($super, partOrName, partsSpaceName) {
        this.partsSpaceName = partsSpaceName
        if (Object.isString(partOrName)) {
            this.name = partOrName;
            this.part = null;
        } else {
            this.name = partOrName.name;
            this.part = partOrName;
        }
        this.json = null;
    },

},
'accessing', {
    getLogoURL: function() {
        return this.getPartsSpace().getURL().withFilename(this.escapedName() + ".svg")
    },
    getHTMLLogoURL: function() {
        return this.getPartsSpace().getURL().withFilename(this.escapedName() + ".html")
    },

    getFileURL: function() {
        /*return this.getPartsSpace().getURL().withFilename(this.name + ".json")*/

        var partName;
        // the fileURL is computed with the partName stored in the PartsBinMetaInfo, if possible
        if (this.part && this.part.getPartsBinMetaInfo()) {
            partName = this.part.getPartsBinMetaInfo().partName
        }
        else {
            partName = this.name;
        }
        return this.getPartsSpace().getURL().withFilename(this.escapePartName(partName) + ".json")
    },
    getMetaInfoURL: function() {
        return this.getPartsSpace().getURL().withFilename(this.escapedName() + ".metainfo")
    },

    getPartsSpace: function() {
        return lively.PartsBin.partsSpaceNamed(this.partsSpaceName);
    },

    setPartFromJSON: function(json, metaInfo, rev) {
        var part = this.deserializePart(json, metaInfo);    
        part.partsBinMetaInfo.revisionOnLoad = rev;
        this.setPart(part);
    },

    setPart: function(part) {
        this.part = part;
    },
    getMetaInfo: function() {
        // metaInfo of part is always taken before local meta info or parts item
        if (this.part)
            return this.part.getPartsBinMetaInfo();
        if (this.loadedMetaInfo)
            return this.loadedMetaInfo;
        return this.loadPart().part.getPartsBinMetaInfo()
    },



},
'naming', {
    makeUpPartName: function() {
        if ($morph(this.targetName)){
            var i = 2
            while($morph(this.targetName + i)) { i++}
            return this.targetName + i;
        } else {
            return this.targetName;
        }
    },
    escapePartName: function(partName) {
        return encodeURI(partName);
    },
    escapedName: function() {
        return this.escapePartName(this.name);
    },


},
'serialization', {
    getSerializer: function() {
        return Config.isNewMorphic ? 
            ObjectGraphLinearizer.forNewLivelyCopy() : 
            ObjectGraphLinearizer.forLivelyCopy();
    },
    deserializePart: function(json, optMetaInfo) {
        // FIXME cleanup
        var jso = JSON.parse(json),
            modulesForDeserialization = lively.persistence.Serializer.sourceModulesIn(jso);
        if (optMetaInfo) {
            modulesForDeserialization.pushAll(optMetaInfo.getRequiredModules());
            var objLevel = optMetaInfo.migrationLevel,
                docLevel =  LivelyMigrationSupport.documentMigrationLevel;
            if (objLevel && objLevel < docLevel) {
                Array.range(objLevel + 1, docLevel).forEach(function(i) {
                    var layer = Global['DocumentMigrationLevel' + i + 'Layer'];
                    layer && layer.beGlobal();
                })
            }
        }
        modulesForDeserialization.forEach(function(ea) { var m = module(ea); if (m != Global && !m.isLoaded()) m.load(true) });

        var serializer = this.getSerializer(),
            part = serializer.deserializeJso(jso),
            metaInfo = optMetaInfo || part.getPartsBinMetaInfo(),
            requiredModules = metaInfo.getRequiredModules();

        // ensure
        metaInfo.setPartsSpace(this.getPartsSpace());

        requiredModules.forEach(function(ea) { var m = module(ea); if (m != Global && !m.isLoaded()) m.load(true) });

        if (Config.isNewMorphic)
            part.withAllSubmorphsDo(function(ea) { ea.setNewId(); });
        else
            part.withAllSubmorphsDo(function() { if (typeof this.setNewId == 'function') this.setNewId(); });

        part.setPartsBinMetaInfo(metaInfo);

        this.runAfterDeserializationHooks(part);

        return part;
    },
    runAfterDeserializationHooks: function(part) {
        if (part.findAndSetUniqueName)
            part.findAndSetUniqueName();

        if (part.onLoadFromPartsBin)
            part.onLoadFromPartsBin();
    },

    serializePart: function(part) {
        var json, svgLogo, oldPos = part.getPosition();
        part.setPosition(pt(0,0));

        // so that we dont have to remove the part (this could trigger side effects)
        var ignoreOwnerPlugin = new GenericFilter();
        ignoreOwnerPlugin.addFilter(function(obj, propName) {
            return obj === part && propName === 'owner';
        });
        var serializer = this.getSerializer();
        serializer.addPlugin(ignoreOwnerPlugin);
        try {
            json = serializer.serialize(part);
            htmlLogo = part.asHTMLLogo();
        } catch(e){
            throw e 
        } finally {
            part.setPosition(oldPos);
            // for fixing the bug that parts are shown in the world 
            // origin after copying them to the partsbin
            if (part.owner) part.owner.addMorph(part); 
        }
        return {
            json: json,
            htmlLogo: htmlLogo,
            metaInfo: this.serializeMetaInfo(part.getPartsBinMetaInfo())
        };
    },
    serializeMetaInfo: function(metaInfo) {
        try {
            var metaInfoJSON = this.getSerializer().serialize(metaInfo);
        } catch(e){
            throw e 
        }
        return metaInfoJSON;
    },


},
'upload and download', {
    load: function(isAsync, rev) {
        var webR = new WebResource(this.getFileURL()).forceUncached();
        if (isAsync) webR.beAsync();
        connect(webR, 'content', this, 'json', {updater: function($upd, json) {
            if (!this.sourceObj.status.isSuccess()) return $upd(null);
            if (!this.sourceObj.status.isDone()) return;
            $upd(json);
        }});
        webR.get(rev);
        return this;
    },
    loadPart: function(isAsync, optCached, rev) {
        if (optCached) {
            this.setPartFromJSON(this.json);
            return this;
        }

        // a revisionOnLoad should always be set! If no PartsBinMetaInfo can be found, the revisionOnLoad is computed via the webresource
        if (rev) {
            this.rev = rev
        }
        else if (this.loadPartVersions && this.loadPartVersions().partVersions) {
            this.rev = this.loadPartVersions().partVersions.first().rev
        }
        else {
            var webR = new WebResource(this.getFileURL());
            this.rev = webR && webR.exists() && webR.getVersions().versions && webR.getVersions().versions.first().rev
        };

        // ensure that setPartFromJSON is only called when both json and metaInfo are there.
        var loadTrigger = {
            item: this,
            rev: this.rev,
            triggerSetPart: function() {
                this.item.setPartFromJSON(this.json, this.metaInfo, this.rev);
            },
            jsonLoaded: function(json) {
                this.json = json;
                if (this.metaInfo === undefined) return;
                this.triggerSetPart();
            },
            metaInfoLoaded: function(metaInfo) {
            try {
                this.metaInfo = metaInfo;
                if (!this.json) return;
                this.triggerSetPart();
            } catch(e) {
                console.log('Error on setPartFromJSON: ' + e)
            }
            },
        }
        connect(this, 'json', loadTrigger, 'jsonLoaded', {removeAfterUpdate: true});
        connect(this, 'loadedMetaInfo', loadTrigger, 'metaInfoLoaded', {removeAfterUpdate: true});
        
        this.load(isAsync, rev);
        this.loadPartMetaInfo(isAsync, rev)

        return this;
    },


    loadPartVersions: function(isAsync) {
        var webR = new WebResource(this.getFileURL());
        if (isAsync) webR.beAsync();        
        connect(webR, 'versions', this, 'partVersions');
        webR.getVersions();
        return this;
    },
    loadPartMetaInfo: function(isAsync, rev) {
        var webR = new WebResource(this.getMetaInfoURL());
        if (isAsync) webR.beAsync();        
        connect(webR, 'content', this, 'loadedMetaInfo', {updater: function($upd, json) {
            if (!this.sourceObj.status.isSuccess()) return $upd(null);
            if (!this.sourceObj.status.isDone()) return;
            $upd(lively.persistence.Serializer.deserialize(json));
        }});
        webR.forceUncached().get();
        return this;
    },

    loadRevision: function(isAsync, rev) {
        return this.loadPart(isAsync, undefined, rev)
    },

    copyToPartsSpace: function(partsSpace) {
        var newItem = partsSpace.getPartItemNamed(this.name);
        partsSpace.setPartItem(newItem);
        newItem.copyFilesFrom(this);
        return newItem;
    },
    moveToPartsSpace: function(partsSpace) {
        var newItem = this.copyToPartsSpace(partsSpace);
        this.del();
        return newItem;
    },
    del: function() {
        this.getPartsSpace().removePartItemNamed(this.name);
        new WebResource(this.getLogoURL()).beAsync().del();
        new WebResource(this.getHTMLLogoURL()).beAsync().del();    
        new WebResource(this.getFileURL()).beAsync().del();
        new WebResource(this.getMetaInfoURL()).beAsync().del();
    },
    uploadPart: function(checkForOverwrite) {
        if (!this.part) {
            alert('Cannot upload part item ' + this.name + ' because there is no part!')
            return;
        }

        this.part.getPartsBinMetaInfo().setPartsSpace(this.getPartsSpace());
        var name = this.part.name,
            serialized = this.serializePart(this.part);
        
        var webR = new WebResource(this.getFileURL())
            .beAsync()
            .createProgressBar('Uploading ' + name);

        connect(webR, 'status', this, 'handleSaveStatus');
        var rev = this.part.getPartsBinMetaInfo().revisionOnLoad;

        webR.put(serialized.json, null, checkForOverwrite? rev : null);
        new WebResource(this.getHTMLLogoURL()).beAsync().put(serialized.htmlLogo, null, checkForOverwrite? rev : null);
        new WebResource(this.getMetaInfoURL()).beAsync().put(serialized.metaInfo, null, checkForOverwrite? rev : null);
    },
    copyFilesFrom: function(otherItem) {
        new WebResource(otherItem.getFileURL()).copyTo(this.getFileURL());
        new WebResource(otherItem.getHTMLLogoURL()).copyTo(this.getHTMLLogoURL());
        new WebResource(otherItem.getMetaInfoURL()).copyTo(this.getMetaInfoURL());
        alertOK('Copying from ' + otherItem + ' to ' + this + ' done');
    },

    uploadMetaInfoOnly: function(isAsync) {
        var metaInfo = this.getMetaInfo();
        if (!metaInfo) {
            alert('Cannot access metaInfo for uploading if part item ' + this.name)
            return;
        }
        var json = this.serializeMetaInfo(metaInfo)
        var webR = new WebResource(this.getMetaInfoURL());
        if (isAsync) webR.beAsync()
        webR.statusMessage('Updated metaInfo of ' + this.name, 'Problem uploading metaInfo of ' + this.name).put(json);
    },
    getHeadRevision: function() {
        var webR = new WebResource(this.getFileURL());
        return webR.getHeadRevision().headRevision;
    },
    isInPartsBin: function() {
        //if there is a PartsBin representation, this returns true. If a Part was deleted from PartsBin, but an artifact of is published, this returns false
        return (new WebResource(this.getFileURL())).exists()
    },
    handleSaveStatus: function(status) {
        // handles the request for overwrite on header 412
        if (!status.isDone()) return;
        if (status.code() === 412) {
            if (status.url.asWebResource().exists())
                this.askToOverwrite(status.url);
            else {
                alertOK("New part "+status.url+" is being stored.");
                this.uploadPart();
            }
            return;
        }
        if (status.isSuccess()) {
            alertOK("Successfully saved "+status.url+" in PartsBin.")
            this.updateRevisionOnLoad();
            if ($world.publishPartDialog) {
                $world.publishPartDialog.remove();
                delete $world.publishPartDialog;
            }
        } else {
            this.alert('Problem saving ' + status.url + ': ' + status)
        }
    },
    updateRevisionOnLoad: function() {
        // the revisionOnLoad in PartsBinMetaInfo is updated on publishing.
        var webR = new WebResource(this.getFileURL()),
            rev = webR.getHeadRevision().headRevision;
        this.part.getPartsBinMetaInfo && (this.part.getPartsBinMetaInfo().revisionOnLoad = rev);
    },

    askToOverwrite: function(url) {
        var self = this;
        $world.confirm(String(url) + ' was changed since loading it. Overwrite?', 
            function (answer) {
                answer && self.uploadPart()
            })
    },






},
'converting', {
    asPartsBinItem: function() {
        var klass = Config.isNewMorphic ? lively.morphic.PartsBinItem : lively.Scripting.PartPinItem;
        return new klass(this.getPartsSpace().getURL(), this.name, this)
    },
},
'debugging', {
    toString: function() {
        return 'PartsItem(' + this.name + ',' + this.getPartsSpace() + ')';
    },


});

Object.subclass('lively.PartsBin.PartsBinMetaInfo',
'initializing', {
    initialize: function() {
        this.partName = ''
        this.requiredModules = [];
    },
},
'accessing', {

    setURL: function(url) {
        var name = lively.PartsBin.partsSpaceWithURL(url.getDirectory()).getName();
        this.setPartsSpaceName(name);
    },

    getName: function() { return this.partName },

    getPartsSpaceURL: function() { return this.getPartsSpace().getURL() },
    setPartsSpaceName: function(name) { this.partsSpaceName = name },
    getPartsSpaceName: function() { return this.partsSpaceName || 'PartsBin/' },
    setPartsSpace: function(partsSpace) { this.setPartsSpaceName(partsSpace.getName()) },
    getPartsSpace: function() { return lively.PartsBin.partsSpaceNamed(this.partsSpaceName) },
    getComment: function() { return this.comment },
    setComment: function(comment) { return this.comment = comment },


    addRequiredModule: function(moduleName) {
        if (!this.requiredModules) this.requiredModules = [];
        this.requiredModules.push(moduleName);
    },
    getRequiredModules: function() { return this.requiredModules || [] },

},
'debugging', {
    toString: function() {
        return 'MetaInfo(' + this.partsSpaceName + this.partName + ')'
    },
});

Object.subclass('lively.PartsBin.PartsSpace',
'documentation', {
    documentation: 'A Namespace for parts of the parts bin. Usually points to a URL (directory) with serialized parts. Parts are morphs or might also be real objects. PartItems are wrapper for Parts used here in the PartsSpace.',
},
'initializing', {
    initialize: function(name) {
        this.name = name;
        this.clearCache();
    },
    createPartItemNamed: function(name) {
        return new lively.PartsBin.PartItem(name, this.name);
    },
    clearCache: function() { this.partItems = {} },




},
'accessing', {
    getPartNames: function() {
        return Properties.own(this.partItems);
    },
    getPartItemNamed: function(name) {
        if (!this.partItems[name])
            this.partItems[name] = this.createPartItemNamed(name);
        if (this.partItems[name].getPartsSpace().getName() !== this.getName())
            alert('Part item points to another PartsSpace it is actually in!')
        return this.partItems[name]
    },
    setPartItem: function(partItem) {
        return this.partItems[partItem.name] = partItem;
    },

    removePartItemNamed: function(name) {
        delete this.partItems[name];
    },


    getURL: function() { return URL.ensureAbsoluteRootPathURL(encodeURI(this.name)).asDirectory() },
    getPartItems: function() {
        return Properties.ownValues(this.partItems);
    },
    setPartItemsFromURLList: function(listOfUrls) {
        // listOfUrls are urls of serialized parts
        var names = listOfUrls
            .invoke('filename')
            .select(function(ea){ return  ea.match(/(.+)\.json$/)})
            .collect(function(ea){ return ea.replace(".json", "")});
        var items = {};
        names.forEach(function(name) { items[name] = this.createPartItemNamed(name) }, this);
        this.partItems = items;
    },
    getName: function() { return this.name },
},
'loading', {
    load: function(async) {
        var webR = new WebResource(this.getURL());
        if (async) webR.beAsync();
        // ask for the files of a directory and update so that the partItems correspond to the files found
        connect(webR, 'subDocuments', this, 'setPartItemsFromURLList', {
            converter: function(webResources) { return webResources.invoke('getURL') }})
        webR.getSubElements();
        return this;
    },
    ensureExistance: function() {
        var webR = new WebResource(this.getURL());
        if (!webR.exists()) webR.ensureExistance();
    },
},
'debugging', {
    toString: function() { return this.constructor.name + '(' + this.name + ')' },
});

Object.extend(lively.PartsBin, {
    partSpaces: {},
    addPartsSpace: function(space) {
        this.partSpaces[space.name] = space;
    },
    removePartsSpace: function(name) {
        delete this.partSpaces[name];
    },
    partsSpaceNamed: function(name) {
        if (!this.partSpaces[name])
            this.addPartsSpaceNamed(name);
        return this.partSpaces[name];
    },
    partsSpaceWithURL: function(url) {
        var rootPath = new URL(Config.rootPath),
            name = url.isIn(rootPath) ? 
                url.relativePathFrom(rootPath) : 
                url.toString();
        return this.partsSpaceNamed(name);
    },

    addPartsSpaceNamed: function(name) {
        var space = new lively.PartsBin.PartsSpace(name);
        this.addPartsSpace(space);
        return space;
    },
    getPart: function(partName, optPartsSpaceName) {
        var partItem = this.getPartItem(partName, optPartsSpaceName);
        return partItem ? partItem.loadPart().part : null;
    },
    getPartItem: function(partName, optPartsSpaceName) {
        // PartsBin -> PartsSpace -> PartItem -> Part
        var partsSpaceName = optPartsSpaceName || 'PartsBin',
            partsSpace = this.partsSpaceNamed(partsSpaceName),
            partItem = partsSpace.getPartItemNamed(partName);
        return partItem;
    },
    leftOverMetaInfos: function(partsBinBaseURL) {
// lively.PartsBin.leftOverMetaInfos().collect(function(ea) { return new WebResource(ea) }).invoke('del')
        partsBinBaseURL = partsBinBaseURL || URL.codeBase.withFilename('PartsBin')
        var dirs = new WebResource(partsBinBaseURL).getSubElements().subCollections;

        var metainfosToRemove = [];
        dirs.forEach(function(dir) {
            var urls = dir.getSubElements().subDocuments.invoke('getURL')
            var metainfos = urls.select(function(ea) { return ea.filename().endsWith('.metainfo') })
            metainfosToRemove.pushAll(metainfos.reject(function(metaInfoURL) {
                var jsonURL = metaInfoURL.toString().replace('.metainfo', '.json');
                return urls.detect(function(url) { return url.toString() === jsonURL })
            }))
        })

        return metainfosToRemove
    },

});

Trait('lively.PartsBin.PartTrait', { 
    copyToPartsBin: function(optPartsSpaceNamed) {
        if (!this.name) {
            alert('cannot copy to partsBin without a name');
            return;
        }

        // FIXME uuuuuuugly
        // copyToPartsBin is sometimes called from menus and
        // the argument we get is an event --- fixe that!!!!
        if (optPartsSpaceNamed && Object.isString(optPartsSpaceNamed))
            this.getPartsBinMetaInfo().setPartsSpaceName(optPartsSpaceNamed);

        if (this.getPartsBinMetaInfo().partsSpaceName &&         
            !this.getPartsBinMetaInfo().partsSpaceName.startsWith("PartsBin")) {
                alertOK("resetting partsSpaceName of " + this)
                delete this.getPartsBinMetaInfo().partsSpaceName
        }

        this.getPartsBinMetaInfo().migrationLevel = LivelyMigrationSupport.migrationLevel;
        this.getPartsBinMetaInfo().partName = this.name;
        
        this.getPartItem().uploadPart(true);
    },
    copyToPartsBinWithUserRequest: function() {
        this.world().openPublishPartDialogFor(this)
    },

    copyToMyPartsBin: function() {
        // FIXME this code was not yet refactored to work with the new PartsSpace/PartItem model
        var userName = lively.LocalStorage.get('UserName');
        if (!userName) throw Error('Cannot copyToMyPartsBin without userName')
    
        var userDir = URL.codeBase.withFilename(userName + '/MyPartsBin/');
        var wr = new WebResource(userDir);
        if (!wr.exists()) {
            alert("created " + userDir)
             wr.create();
        }

        var partsBinUrl = URL.codeBase.withFilename(userName +  '/MyPartsBin/');
        wr = new WebResource(partsBinUrl);
        if (!wr.exists()) {
            alert("created " + partsBinUrl)
            wr.create();
        }

        this.copyToPartsBinUrl(partsBinUrl);
    },

    interactiveCopyToMyPartsBin: function() {
        if (!lively.LocalStorage.get('UserName'));
            this.world().askForUserName();
        if (!this.name) {
            this.world().promt('cannot copy to partsBin without a name', function(name) {
                if (name == this.toString()) {
                    alert('Cannot copy '+this.toString() + 'to MyPartsBin without a name ');
                    return;
                }
                this.name = name;
                this.copyToMyPartsBin()
            }.bind(this), this.toString())
        } else {
            this.copyToMyPartsBin()
        }
    },

    copyToPartsBinUrl: function(partsBinURL) {
        var partsSpace = lively.PartsBin.partsSpaceWithURL(partsBinURL);
        this.copyToPartsSpace(partsSpace);
    },
    copyToPartsSpace: function(partsSpace) {
        this.getPartsBinMetaInfo().setPartsSpace(partsSpace)
        this.getPartItem().uploadPart();
    },

    getPartsBinMetaInfo: function() {
        if (!this.partsBinMetaInfo) {
            this.partsBinMetaInfo = new lively.PartsBin.PartsBinMetaInfo();
            this.partsBinMetaInfo.partName = this.getName();
        }
        if (!(this.partsBinMetaInfo instanceof lively.PartsBin.PartsBinMetaInfo)) {
            var oldMetaInfo = this.partsBinMetaInfo;
            this.partsBinMetaInfo = new lively.PartsBin.PartsBinMetaInfo();
            this.partsBinMetaInfo.partName = this.getName();
            Properties.forEachOwn(oldMetaInfo, function(key, value) {
                this.partsBinMetaInfo[key] = value;
            }, this)
        }
        return this.partsBinMetaInfo
    },
    setPartsBinMetaInfo: function(metaInfo) {
        return this.partsBinMetaInfo = metaInfo;
    },

    getPartItem: function() {
        return new lively.PartsBin.PartItem(this, this.getPartsBinMetaInfo().getPartsSpaceName())
    },

    asSVGLogo: function() {
        var oldPos = this.getPosition();
        this.setPosition(pt(0,0))
        var logoMorph = this.asLogo()
        this.setPosition(oldPos)
        // width="2000pt" height="2000pt"
        return '<?xml version="1.0" encoding="UTF-8"?>\n'+
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '+
        'xmlns:ev="http://www.w3.org/2001/xml-events" version="1.1" baseProfile="full" >\n' +
            Exporter.stringify(logoMorph.rawNode) + 
        '</svg>';
    },
    asHTMLLogo: function() {
        return '<html><body>please implement</body></html>'
    },




});


}) // end of module