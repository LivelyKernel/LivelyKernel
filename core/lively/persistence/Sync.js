module('lively.persistence.Sync').requires().toRun(function() {

Object.subclass('lively.persistence.Sync.ObjectHandle',
"initializing", {
    initialize: function(options) {
        this.path = options.path || '';
        this.store = options.store;
        this.callbackRegistry = {};
        this.localStore = {};
    }
},
'read', {
    get: function(options) {
        // options: {path: STRING, callback: FUNCTION}
        this.store.get(this.fullPath(options.path), function(path, val) { options.callback(val); });
    },

    subscribe: function(options) {
        var fullPath = this.fullPath(options.path),
            type = options.type || 'value',
            callback = options.callback,
            registry = this.callbackRegistry,
            handle = this;
        if (!fullPath || fullPath === '') fullPath = '.';
        var i = 0;
        function updateHandler(path, val) {
            if (i++ > 100) { debugger; throw new Error('Endless recursion in #subscribe ' + path); }
            // if (!registry[path] || !registry[path].include(updateHandler)) {
            //     return; /*in case of an unsubscribe*/}
            callback(val);
            handle.store.addCallback(path, updateHandler);
        }
        if (!registry[fullPath]) { registry[fullPath] = []; }; registry[fullPath].push(updateHandler);
        handle.store.addCallback(fullPath, updateHandler);
    },

    unsubscribe: function(options) {
        // options: {
        //   [path: STRING,]
        //   currently not supported: [callback: FUNCTION] -- the specific callback to unsubscribe
        // }
        var path = options.path, paths = [path],
            store = this.store, registry = this.callbackRegistry;
        if (!path) { paths = Object.keys(registry); }
        paths.forEach(function(p) { 
            p = this.fullPath(p);
            registry[p] && registry[p].forEach(function(cb) { store.removeCallback(p, cb); });
            delete registry[p];
        }, this);
    }
},
'write', {
    set: function(options) {
        // options: {path: STRING, callback: FUNCTION, value: OBJECT}
        this.store.set(this.fullPath(options.path), options.value, {callback: options.callback});
    },

    commit: function(options) {
        options.n = options.n ? options.n+1 : 1; // just for debugging
        if (options.n > 10) { throw new Error(show('Commit endless recursion?')); }
        var path = options.path,
            fullPath = this.fullPath(path),
            handle = this;
        function withValueDo(val) {
            var newVal = options.transaction(val);
            // cancel commit?
            if (newVal === undefined) { options.callback(null, false, val); return; }
            handle.store.set(fullPath, newVal, {
                callback: function(err) {
                    if (err && err.type === 'precondition') handle.commit(options); 
                    else options.callback && options.callback(err, !err, err ? val : newVal);
                },
                precondition: function(storeVal) {
                    // show("precondition: %o vs %o", storeVal, val);
                    return storeVal === val;
                }
            });
        }
        this.get({path: path, callback: withValueDo});
    }
},
'handle hierarchy', {
    child: function(path) {
        return new this.constructor({path: this.fullPath(path), store: this.store});
    }
},
'path helpers', {
    fullPath: function(path) {
        var result = [this.path, path].select(function(ea) {
            return ea && ea.length > 0; }).join('.');
        return result === '' ? '.' : result;
    }
},
'debugging', {
    toString: function() {
        return 'ObjectHandle(' + Objects.inspect({name: this.path})
             + ', ' + Objects.inspect(this.localStore) + ')';
    }
});

Object.subclass('lively.persistence.Sync.LocalStore',
'properties', {
    callbacks: null
},
'initializing', {
    initialize: function() {
        this.db = {};
        this.callbacks = {};
    }
},
'accessing', {

    set: function(path, val, options) {
        options = options || {};
        var parsePath = this.parsePath, changedPath = parsePath(path),
            callbacks = this.callbacks, db = this.db;
        // 1: checking precondition
        if (options.precondition) {
            var currentVal = changedPath.lookup(db),
                preconditionOK = options.precondition(currentVal);
            if (!preconditionOK) {
                options.callback && options.callback({type: 'precondition'});
                return;
            }
        }
        // 2: setting the value in storage
        if (changedPath.isRoot()) this.db = db = val; else changedPath.assign(db, val);
        // 3: Informing subscribers
        var cbs = Object.keys(callbacks).inject([], function(cbs, path) {
            var cbPath = parsePath(path);
            if (!changedPath.isParentPathOf(cbPath)) return cbs;
            var relativeVal = cbPath.lookup(db),
                boundCbs = callbacks[path].invoke('bind', null, path, relativeVal);
            callbacks[path] = [];
            return cbs.concat(boundCbs);
        }), cb;
        while ((cb = cbs.shift())) cb();
        options.callback && options.callback(null);
    },

    get: function(path, callback) {
        callback(path, this.parsePath(path).lookup(this.db));
    },

    addCallback: function(path, callback) {
        var normalizedPath = this.parsePath(path).normalizePath(),
            cbs = this.callbacks[normalizedPath] = this.callbacks[normalizedPath] || [];
        cbs.push(callback);
    },
    
    removeCallback: function(path, callback) {
        var normalizedPath = this.parsePath(path).normalizePath();
        if (!this.callbacks[normalizedPath]) return;
        this.callbacks[normalizedPath] = this.callbacks[normalizedPath].without(callback);
    }
},
'path access', {
    parsePath: function(path) {
        if (path && path.isPathAccessor) return path;
        var parts = [];
        if (Object.isString(path) && path !== '' && path !== '.') {
            parts = path.split('.');
        } else if (Object.isArray(path)) {
            parts = path.clone();
        }
        var parse = this.parsePath;
        return Object.extend(parts, {
            isPathAccessor: true,
            normalizePath: function() {
                // FIXME: define normalization
                return path;
            },
            isRoot: function(obj) { return parts.length === 0; },
            isInObject: function(obj) {
                if (this.isRoot()) return true;
                var parent = this.lookupParent(obj);
                return parent && parent.hasOwnProperty(parts.last());
            },
            isParentPathOf: function(otherPath) {
                otherPath = otherPath && otherPath.isPathAccessor ? otherPath : parse(otherPath);
                return this.intersect(otherPath).length === this.length;
            },
            relativePathTo: function(otherPath) {
                otherPath = otherPath && otherPath.isPathAccessor ? otherPath : parse(otherPath);
                return this.isParentPathOf(otherPath) ? parse(otherPath.slice(this.length)) : undefined;
            },
            assign: function(obj, val) {
                if (this.isRoot()) return undefined;
                var parent = this.lookupParent(obj);
                if (!parent) return undefined;
                return parent[parts.last()] = val;
            },
            lookupParent: function(obj) {
                if (this.isRoot()) return undefined;
                var last = parts.pop(), parent = this.lookup(obj);
                parts.push(last);
                return parent;
            },
            lookup: function(obj) {
                return parts.inject(obj, function(current, pathPart) {
                    return current ? current[pathPart] : current; });
            },
            toString: function() {
                return 'lively.Path("' + this.normalizePath() + '")';
            } 
        });
    },
    relativeChangedValue: function(path, value) {
        return this.parsePath(path).lookup(value);
    }
},
'testing', {
    has: function(path) { return this.parsePath(path).isInObject(this.db); }
});

}) // end of module