module('lively.PartCaching').requires('cop.Layers', 'lively.LayerableMorphs', 'lively.PartsBin').toRun(function() {

lively.PartCaching.setupCache = function() {
    lively.PartCache = {
        cache: {},
        normalizeFileName: function(name) {
            // sometimes name ends with /, sometimes not,
            // doesn't matter for the file system, but for the cache
            return name[name.length - 1] === '/' ? name.substring(0, name.length - 1) : name;
        },
        getPart: function(partName, optPartsSpaceName) {
            optPartsSpaceName = this.normalizeFileName(optPartsSpaceName)
            var part;
            if (optPartsSpaceName) {
                if (this.cache[optPartsSpaceName]) {
                    part = this.cache[optPartsSpaceName][partName];
                }
            } else {
                part = this.cache[partName];
            }
            return part && part.json && part.metaInfo && part;
        },
        ensurePartObject: function(partName, optPartsSpaceName) {
            optPartsSpaceName = this.normalizeFileName(optPartsSpaceName);
            if (optPartsSpaceName) {
                if (!this.cache[optPartsSpaceName]) {
                    this.cache[optPartsSpaceName] = {};
                }
                if (!this.cache[optPartsSpaceName][partName]) {
                    this.cache[optPartsSpaceName][partName] = {};
                }
            } else if (!this.cache[partName]) {
                this.cache[partName] = {};
            }
        },
        setPartJSON: function(partName, optPartsSpaceName, json) {
            optPartsSpaceName = this.normalizeFileName(optPartsSpaceName);
            this.ensurePartObject(partName, optPartsSpaceName);
            if (optPartsSpaceName) {
                this.cache[optPartsSpaceName][partName].json = json;
            } else {
                this.cache[partName].json = json;
            }
        },
        setPartMetaInfo: function(partName, optPartsSpaceName, metaInfo) {
            optPartsSpaceName = this.normalizeFileName(optPartsSpaceName);
            this.ensurePartObject(partName, optPartsSpaceName);
            if (optPartsSpaceName) {
                this.cache[optPartsSpaceName][partName].metaInfo = metaInfo;
            } else {
                this.cache[partName].metaInfo = metaInfo;
            }
        },
        invalidCachedVersion: function(partName, optPartsSpaceName) {
            optPartsSpaceName = this.normalizeFileName(optPartsSpaceName);

            if (!this.getPart(partName, optPartsSpaceName))
                return; // wasn't cached

            if (optPartsSpaceName) {
                this.cache[optPartsSpaceName][partName] = {};
            } else {
                this.cache[partName] = {};
            }
        },
        clearCache: function() {
            Properties.own(this.cache).forEach((function (each) {
                delete this.cache[each];
            }).bind(this));
        }
    };
};

cop.create('PartCachingLayer').refineClass(lively.PartsBin.PartItem, {
    loadPart: function(isAsync, optCached, rev) {
        var cachedPart = lively.PartCache.getPart(this.name, this.partsSpaceName);
        if (!cachedPart) {
            return cop.proceed(isAsync, optCached, rev);
        } else {
            this.setPartFromJSON(cachedPart.json, cachedPart.metaInfo, rev);
            return this;
        }
    }
});

cop.create('PartCachingControlsLayer')
.refineClass(lively.PartsBin.PartItem, {
    cachePartJSON: function(json) {
        lively.PartCache.setPartJSON(this.name, this.partsSpaceName, json);
    },
    cachePartMetaInfo: function(metaInfo) {
        lively.PartCache.setPartMetaInfo(this.name, this.partsSpaceName, metaInfo);
    },
    uploadPart: function() {
        lively.PartCache.invalidCachedVersion(this.name, this.partsSpaceName);
        return cop.proceed();
    },
    loadPart: function(isAsync, optCached, rev) {
        connect(this, 'json', this, 'cachePartJSON');
        connect(this, 'loadedMetaInfo', this, 'cachePartMetaInfo');
        return cop.proceed(isAsync, optCached, rev);
    }
})
.refineClass(lively.morphic.World, {
    morphMenuItems: function () {
        var items = cop.proceed();
        for(var i = 0; i < items.length; i++) {
            if (items[i][0] === "Preferences") {
                if (Config.PartCachingEnabled) {
                    items[i][1].push(['disable part caching', function() { Config.PartCachingEnabled = false }]);
                } else {
                    items[i][1].push(['enable part caching', function() {
                        Config.PartCachingEnabled = true;
                        lively.PartCache.clearCache();
                    }]);
                }
            }
            if (items[i][0] === "Debugging") {
                if (Config.PartCachingEnabled) {
                    items[i][1].splice(4, 0, ['clear part cache', function() { lively.PartCache.clearCache(); }]);
                }
            }
        }
        return items;
    },
    loadPartItem: function (partName, optPartspaceName) {
        var layers = Config.PartCachingEnabled ? [PartCachingLayer] : [],
            result;
        cop.withLayers(layers, function() {result = cop.proceed(partName, optPartspaceName)});
        return result;
    }
})


Config.PartCachingEnabled = true; // default
lively.PartCaching.setupCache();
PartCachingControlsLayer.beGlobal();

}) // end of module