module('lively.persistence.Sync').requires().toRun(function() {

Object.subclass('lively.persistence.Sync.ObjectHandle',
"settings", {
    connections: {}
},
"initializing", {
    initialize: function(options) {
        this.path = lively.PropertyPath(options.path || '');
        this.store = options.store;
        this.callbackRegistry = {};
        this.localStore = {};
    }
},
'read', {
    get: function(options) {
        // options: {path: STRING, callback: FUNCTION}
        this.store.get(this.path.concat(options.path), function(path, val) { options.callback(val); });
    },

    subscribe: function() { this.store.addSubscriber(this); },

    unsubscribe: function() { this.store.removeSubscriber(this); },

    onValueChanged: function(value, path) {
        lively.bindings.signal(this, 'value', value);
        lively.bindings.signal(this, 'valueAndPath', {value: value, path: path});
    }

},
'write', {
    set: function(options) {
        // options: {path: STRING, callback: FUNCTION, value: OBJECT}
        this.store.set(this.path.concat(options.path), options.value, {callback: options.callback});
    },

    commit: function(options) {
        // options: {
        //   [path: STRING || lively.PropertyPath,] -- path (relative to
        //     this.basePath to modify.
        //   transaction: FUNCTION(OBJECT) -> OBJECT, -- transaction function is
        //     called 1+ times. It receives the currentl object at path and
        //     should return the object that should be set at path. If it
        //     returns undefined the transaction is canceled.
        //  [precondition: OBJECT] -- the precondition send to and evaluated by
        //  the store. Currently supported:
        //    - {type: 'equality', value: OBJECT}.
        //    - {type: 'id', id: STRING}.
        // }
        options.n = options.n === undefined ? 0 : options.n+1; // just for debugging
        if (options.n > 10) { throw new Error(show('Commit endless recursion?')); }
        var precondition = options.precondition || {type: 'equality'},
            path = options.path,
            fullPath = this.path.concat(path),
            store = this.store;
        function withValueDo(val) {
            if (precondition.id) precondition.type = 'id';
            if (precondition.type === 'equality' && !precondition.value) precondition.value = val;
            var newVal;
            if (options.value) {
                newVal = options.value;
            } else if (options.transaction) {
                newVal = options.transaction(val, options.n);
            }
            if (newVal === undefined) { options.callback(null, false, val); return; }
            store.set(fullPath, newVal, {
                callback: function(err) {
                    options.callback && options.callback(err, !err, err ? val : newVal);
                },
                precondition: precondition
            });
        }
        this.get({path: path, callback: withValueDo});
    }
},
'handle hierarchy', {
    child: function(path) {
        return new this.constructor({path: this.path.concat(path), store: this.store});
    }
},
'debugging', {
    toString: function() {
        return 'ObjectHandle(' + Objects.inspect({path: this.path})
             + ', ' + Objects.inspect(this.localStore) + ')';
    }
});

Object.subclass('lively.persistence.Sync.LocalStore',
'initializing', {
    initialize: function() {
        this.db = {};
        this.subscribers = [];
    }
},
'accessing', {

    getHandle: function(path) {
        return new lively.persistence.Sync.ObjectHandle({path: path, store: this})
    },

    set: function(path, val, options) {
        path = lively.PropertyPath(path);
        options = options || {};
        var db = this.db, precondition = options.precondition;
        // 1: checking precondition
        var err = this.checkPrecondition(path, options.precondition);
        if (err) { options.callback && options.callback(err); return; }
        // 2: setting the value in storage
        if (path.isRoot()) this.db = db = val; else path.set(db, val);
        options.callback && options.callback(null);
        // 3: Informing subscribers
        this.informSubscribers(path, val, options);
    },

    checkPrecondition: function(path, precondition) {
        var db = this.db, err = {type: 'precondition'};
        if (!precondition || !path.isIn(db)) return null;
        var currentVal = path.get(db);
        if (precondition.type === 'equality') {
            return Objects.equal(precondition.value, currentVal) ? null : Object.extend(err, {message: 'equality mismatch'});
        } else if (precondition.type === 'id') {
            if (!currentVal || !currentVal.hasOwnProperty('id')) return null;
            var valId = String(currentVal.id),
                expectedId = String(precondition.id);
            return valId === expectedId ? null : Object.extend(err, {
                message: 'id mismatch, expected: '
                        + expectedId + ' actual: ' + valId
            });
        }
        return null;
    },

    get: function(path, callback) {
        path = lively.PropertyPath(path);
        callback(path, path.get(this.db));
    },

    addSubscriber: function(handle) {
        this.subscribers.pushIfNotIncluded(handle);
    },
    removeSubscriber: function(handle) {
        this.subscribers = this.subscribers.without(handle);
    },

    informSubscribers: function(path, value, options) {
        path = lively.PropertyPath(path);
        this.subscribers.forEach(function(handle) {
            if (path.isParentPathOf(handle.path)) {
                var relativeVal = path.relativePathTo(handle.path).get(value);
                handle.onValueChanged(relativeVal, handle.path);
            } else if (handle.path.isParentPathOf(path)) {
                handle.onValueChanged(value, path);
            }
        });
    }
});

lively.persistence.Sync.LocalStore.subclass('lively.persistence.Sync.LocalAsyncStore',
'initializing', {
    initialize: function($super, randTimeInterval) {
        $super();
        this.randomTime = Numbers.random.curry(randTimeInterval[0], randTimeInterval[1]);
    }
},
'accessing', {

    set: function($super, path, val, options) {
        $super.curry(path, val, options).delay(this.randomTime()/1000);
    },

    get: function($super, path, callback) {
        $super.curry(path, callback).delay(this.randomTime()/1000);
    },

    addCallback: function($super, path, callback) {
        var randTime = this.randomTime()/1000;
        $super(path, callback.wrap(function(proceed) {
            var args = Array.from(arguments).slice(1);
            (function() { proceed.apply(null, args); }).delay(randTime);
        }));
    },

    removeCallback: function(path, callback) {
        if (!this.callbacks[path]) return;
        var matching = this.callbacks[path].select(function(cb) { return cb.getOriginal() === callback; });
        this.callbacks[path] = this.callbacks[path].withoutAll(matching);
    }
});

lively.persistence.Sync.LocalStore.subclass('lively.persistence.Sync.RemoteStore',
'initializing', {
    initialize: function($super, name) {
        $super();
        this.id = Strings.newUUID();
        this.name = name;
        this.debug = false;
        this.pollingProcess = null;
        this.lastFetchUpdateTime = null;
    }
},
'network', {
    getURL: function(path) {
        path = String(path || '').replace(/\./g, '/');
        var baseURL = new URL(Config.nodeJSURL).asDirectory().withFilename('Store/');
        return baseURL.withFilename(this.name + '/' + path);
    },
    getWebResource: function(path) { return this.getURL(path).asWebResource(); }
},
'updates', {
    enablePolling: function(options) {
        this.disablePolling();
        var msecs = (options && options.interval) || 5000; // secs
        this.pollingProcess = Global.setInterval(this.fetchRemoteUpdates.bind(this), msecs);
    },

    disablePolling: function() {
        if (!this.pollingProcess) return;
        Global.clearInterval(this.pollingProcess);
        this.pollingProcess = null;
    },

    fetchRemoteUpdates: function() {
        var store = this,
            webR = this.getURL().withQuery({"clientId": this.id, "changes-since": this.lastFetchUpdateTime}).asWebResource().beSync().get(),
            s = webR.status,
            err = s.isSuccess() ? null : s.code() + ' ' + s.transport.responseText,
            result;
        if (!err) {
            try {
                result = JSON.parse(webR.content);
                err = result.error;
            } catch(e) { err = e; }
        }
        if (err) { lively.morphic.show(err); return; }
        store.lastFetchUpdateTime = result.endTime;
        result.changes.pluck('path')
            .map(function(p) { return lively.PropertyPath(store.name).relativePathTo(p); }).compact()
            .forEach(function(path) {
                // show('informing %s about %s', store.id, path)
                store.get(path, function(_, val) { store.informSubscribers(path, val); }); });
    }
},
'accessing', {

    set: function($super, path, val, options) {
        path = lively.PropertyPath(path);
        options = options || {};
        var webR = this.getWebResource(path).beSync();
        if (this.debug) {
            show('sending ' + JSON.stringify(val));
            connect(webR, 'status', lively.morphic, 'show', {updater: function($upd, val) {
                if (val && val.isDone()) $upd("%s: %o", val, val.transport.responseText);
            }});
        }
        webR.put(JSON.stringify({data: val, precondition: options.precondition, clientId: this.id}), 'application/json');
        var status = webR.status,
            err = status.isSuccess() ? null : {message: status.transport.responseText}
        if (status.code() === 412) err.type = 'precondition';
        options.callback && options.callback(err);
        if (!err) this.informSubscribers(path, val, options);
    },

    get: function($super, path, callback) {
        path = lively.PropertyPath(path);
        var webR = this.getWebResource(path).beSync();
        connect(webR, 'content', {cb: callback.curry(path), debug: this.debug}, 'cb', {
            converter: function(val) {
                if (this.targetObj.debug) show('%s (%s)', val);
                return val ? JSON.parse(val) : undefined;
            }
        });
        webR.get();
    }

});
lively.persistence.Sync.LocalStore.subclass('lively.persistence.Sync.DAVStore',
'initializing', {
    initialize: function($super, davRootURL) {
        $super();
        this.debug = false;
        this.id = Strings.newUUID();
        this.davRootURL = davRootURL;
    }
},
'network', {
    getURL: function(path, extension) {
        path = String(path || '').replace(/\./g, '/');
        if (extension) path += '.' + extension;
        return this.davRootURL.withFilename(path);
    },
    getWebResource: function(path, extension) { return this.getURL(path, extension).asWebResource(); },

    ensureDirectoriesExist: function(path, thenDo) {
        // 1: to not issue requests repeatedly for the same urls on tree sets
        //    we cache ensureDirectory urls. #set is supposed to flush that
        //    cache when set op finished
        this.directoriesEnsured = this.directoriesEnsured || [];
        if (this.directoriesEnsured.any(function(ea) { return ea.equal(path); })) { thenDo(); return }
        this.directoriesEnsured.push(path);
        // 2: get all directory urls between (including) davRootURL,
        //    davRootURL + path[0], davRootURL + path[0] + ... + path[n]
        var debug = this.debug,
            urls = path.parts().inject([this.davRootURL], function(urls, ea, i) {
                return urls.concat([urls[i].withFilename(ea + '/')]); });
        // 3: asynchronously check if url exist. If not, create it.
        debug && show('urls to ensure: %s', urls);
        urls.doAndContinue(function(next, url) {
            debug && show('url to ensure: %s', url);
            var webR = url.asWebResource().beAsync();
            function ensureDir(status) {
                if (!status.isDone()) return;
                if (status.isSuccess()) { debug && show('ensuredir: %s exists', status.url); next(); return; }
                lively.bindings.disconnectAll(webR);
                lively.bindings.connect(webR, 'status', {cb: next}, 'cb', {updater: function($upd, status) {
                    if (!status.isDone()) return;
                    debug && show('ensuredir: %s %ssuccessfully created', status.url, status.isSuccess() ? '' : 'not ');
                    $upd(status);
                }, varMapping: {debug: debug}});
                webR.create();
            }
            lively.bindings.connect(webR, 'status', {cb: ensureDir}, 'cb')
            webR.head();
        }, thenDo.bind(this));
    }

},
'accessing', {

    set: function($super, path, val, options) {
        // path: path to file or directory as JS path without extension.
        // val:
        //   - file: {extension: STRING, content: STRING}
        //   - dir: keys with file specs are files in dir, other objects are
        //          interpreted as subdirs
        // --------------
        path = lively.PropertyPath(path);
        options = options || {};
        if (!options.depth) options.depth = 0;
        // --------------
        var setDone = function(err) {
            if (options.depth === 0) delete this.directoriesEnsured;
            options.callback && options.callback(err);
        }.bind(this);
        // --------------
        if (val && val.content && val.extension) {
            // write file
            var webR = this.getWebResource(path, val.extension).beAsync();
            this.ensureDirectoriesExist(path.slice(0,-1), function() {
                lively.bindings.connect(webR, 'status', {cb: function(status) {
                    if (!status.isDone()) return;
                    setDone(status.isSuccess() ? null : {message: status.transport.responseText});
                }}, 'cb');
                webR.put(val.content);
            });
        } else if (val) {
            // write dir with subdirs/files
            this.ensureDirectoriesExist(path, function() {
                var subPaths = Properties.own(val), errors = [];
                subPaths.clone().forEach(function(name) {
                    this.set(path.concat(name), val[name], {
                        callback: function(err) {
                            subPaths.remove(name);
                            if (err) errors.push({path: path.concat(name), err: err});
                            if (subPaths.length === 0) setDone(errors.length === 0 ? null : errors);
                        },
                        depth: options.depth + 1
                    });
                }, this);
            });
        } else {
            lively.log('DAVStore cannot set %o to %s', val, path);
        }
    },

    get: function($super, path, callback) {
        // path = lively.PropertyPath(path);
        // var webR = this.getWebResource(path).beSync();
        // connect(webR, 'content', {cb: callback.curry(path), debug: this.debug}, 'cb', {
        //     converter: function(val) {
        //         if (this.targetObj.debug) show('%s (%s)', val);
        //         return val ? JSON.parse(val) : undefined;
        //     }
        // });
        // webR.get();
    }

});

}) // end of module