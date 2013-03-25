module('lively.persistence.Sync').requires().toRun(function() {

Object.subclass('lively.persistence.Sync.ObjectHandle',
"initializing", {
    initialize: function(options) {
        this.path = options.path || '';
        this.store = options.store;
        this.registry = {};
        this.localStore = {};
    }
},
'read', {
    get: function(/*[path,] callback*/) {
        var args = Array.from(arguments),
            path = Object.isString(args[0]) ? args[0] : null,
            callback = Object.isString(args[0]) ? args[1] : args[0];
        this.subscribe({once: true, path: path, callback: callback});
    },

    subscribe: function(options) {
        var fullPath = this.fullPath(options.path),
            type = options.type || 'value',
            callback = options.callback,
            once = options.once,
            store = this.store,
            registry = this.registry,
            handle = this;
        if (!fullPath || fullPath === '') fullPath = '.';
        var i = 0;
        function updateHandler(path, val) {
            if (i++ > 100) { debugger; throw new Error('Endless recursion in #subscribe ' + path); }
            if (!registry[path] || !registry[path].include(updateHandler)) return;
            callback(val);
            if (once) handle.off(fullPath, updateHandler);
            else store.addCallback(path, updateHandler);
        }
        if (!registry[fullPath]) { registry[fullPath] = []; }; registry[fullPath].push(updateHandler);
        store.get(fullPath, updateHandler) || store.addCallback(fullPath, updateHandler);
    },

    off: function(path, optCallback) {
        path = this.fullPath(path);
        if (optCallback && Object.isArray(this.registry[path])) {
            this.registry[path] = this.registry[path].without(optCallback);
            if (this.registry[path].length > 0) return;
        }
        delete this.registry[path];
    }
},
'write', {
    set: function(/*path, val, callback*/) {
        var args = Array.from(arguments),
            path = Object.isString(args[0]) && args[0],
            val = Object.isString(args[0]) ? args[1] : args[0],
            callback = Object.isString(args[0]) ? args[2] : args[1];
        this.store.set(this.fullPath(path), val, {callback: callback});
    },

    commit: function(options) {
        options.n = options.n ? options.n+1 : 1; // just for debugging
        if (options.n > 10) {
            alert('Commit endless recursion?');
            throw new Error('Commit endless recursion?');
        }
        var path = options.path,
            fullPath = this.fullPath(path),
            handle = this;
        this.get(path, function(val) {
            var newVal = options.transaction(val);
            // cancel commit?
            if (newVal === undefined) {
                options.callback(null, false, val);
                return;
            }
            handle.store.set(fullPath, newVal, {
                callback: function(err) {
                    if (err && err.type === 'precondition') handle.commit(options); 
                    else options.callback(err, !err, err ? val : newVal);
                },
                precondition: function(storeVal) {
                    // show("precondition: %o vs %o", storeVal, val);
                    return storeVal === val;
                }
            });
        });
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
        var pathAccessor = this.parsePath(path),
            normalizedPath = pathAccessor.normalizePath();
        if (options.precondition) {
            var currentVal = pathAccessor.lookup(this.db),
                preconditionOK = options.precondition(currentVal);
            if (!preconditionOK) {
                options.callback && options.callback({type: 'precondition'});
                return;
            }
        }
        if (pathAccessor.isRoot()) this.db = val;
        else pathAccessor.assign(this.db, val);
        var cbs = Object.keys(this.callbacks)
            .inject([], function(cbs, path) {
                var parsedPath = this.parsePath(path);
                if (!pathAccessor.isParentPathOf(parsedPath)) return cbs;
                var relativeVal = parsedPath.lookup(this.db);
                cbs = cbs.concat(this.callbacks[path].invoke('bind', null, path, relativeVal));
                this.callbacks[path] = [];
                return cbs;
            }, this), cb
        while ((cb = cbs.shift())) cb();
        options.callback && options.callback(null);
    },

    get: function(path, callback) {
        var accessor = this.parsePath(path),
            hasIt = accessor.isInObject(this.db);
        if (hasIt) callback(path, accessor.lookup(this.db));
        return hasIt;
    },

    addCallback: function(path, callback) {
        var normalizedPath = this.parsePath(path).normalizePath(),
            cbs = this.callbacks[normalizedPath] = this.callbacks[normalizedPath] || [];
        cbs.push(callback);
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