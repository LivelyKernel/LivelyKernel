module('lively.store.Interface').requires('lively.Network').toRun(function() {

Object.extend(lively.store, {
    cachedStorageAccessors: {},
    get: function(spec) {
        if (this.cachedStorageAccessors[spec.id]) {
            return this.cachedStorageAccessors[spec.id];
        }
        if (!spec.type) {
            throw new Error('Storage type must be specified!');
        }
        var storageClass = lively.store[spec.type];
        if (!storageClass) {
            throw new Error('No such storage type ' + spec.type);
        }
        var storage = new storageClass(spec);
        return this.cachedStorageAccessors[spec.id] = storage;
    },

    flushCache: function() {
        this.cachedStorageAccessors = {};
    }
});

Object.subclass('lively.store.ObjectStorage',
'initializing', {
    initialize: function(spec) {
        this.stored = {}
    }
},
'accessing', {
    set: function(key, value) {
        this.stored[key] = value;
    },

    get: function(key) {
        return this.stored[key];
    }
});

Object.subclass('lively.store.FileStorage',
'initializing', {
    initialize: function(spec) {
        this.url = spec.url;
    }
},
'accessing', {
    set: function(data) {
        var webR = new WebResource(this.url);
        webR.put(data);
    },

    get: function(optCb) {
        var webR = new WebResource(this.url),
            result = webR.get().content;
        if (optCb) optCb(null, result);
        return result;
    }
});

Object.subclass('lively.store.CouchDBStorage',
'initializing', {
    initialize: function(spec) {
        var reqPath = 'couchdb/' + spec.id + '/'; // id = db name
        this.couchdbURL = URL.nodejsBase.withFilename(reqPath);
    }
},
'accessing', {
    set: function(key, value) {
        var webR = this.couchdbURL.withFilename(key).asWebResource();
        webR.put(JSON.stringify(value), 'application/json');
    },

    get: function(key, optCb) {
        var webR = this.couchdbURL.withFilename(key).asWebResource(),
            data = webR.get().content;
        try { return JSON.parse(data); } catch(e) { return {error: e}}
    },

    ensureExistance: function() {
        this.couchdbURL.asWebResource().put();
    },

    remove: function() {
        this.couchdbURL.asWebResource().del();
    }
});

Object.subclass("lively.store.ObjectRepository",
"initializing", {

    initialize: function(url) {
        this.repoURL;
    }

},
"accessing", {

    getServerInterfaceURL: function() {
        return URL.nodejsBase.withFilename("ObjectRepositoryServer/");
    }

},
"querying", {

    getRecords: function(querySpec, thenDo)  {
        // new lively.store.ObjectRepository().getRecords()
        var res = this.getServerInterfaceURL().withQuery({getRecords: encodeURIComponent(JSON.stringify(querySpec))}).asWebResource();
        if (thenDo != null) {
            res.withJSONWhenDone(function(json, status) {
                thenDo(status.isSuccess() ? null : status, json); }).beAsync().get();
            return this;
        } else {
            var content = res.beSync().get().content;
            if (!res.status.isSuccess())
                throw new Error(content);
            var json;
            try { json = JSON.parse(content); } catch(e) { json = {error: e} }
            return json;
        }
    }

});

}); // end of module
