module('lively.persistence.Sync').requires().toRun(function() {

Object.subclass('lively.persistence.Sync.ObjectHandle',
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

    subscribe: function(options) {
        var fullPath = this.path.concat(options.path),
            type = options.type || 'value',
            callback = options.callback,
            registry = this.callbackRegistry,
            handle = this;
        var i = 0;
        function updateHandler(path, val) {
            if (i++ > 100) { debugger; throw new Error('Endless recursion in #subscribe ' + path); }
            // if (!registry[path] || !registry[path].include(updateHandler)) {
            //     return; /*in case of an unsubscribe*/}
            callback(val, lively.PropertyPath(path));
            handle.store.addCallback(fullPath, updateHandler);
        }
        if (!registry[fullPath]) { registry[fullPath] = []; }; registry[fullPath].push(updateHandler);
        handle.store.addCallback(fullPath, updateHandler);
    },

    unsubscribe: function(options) {
        // options: {
        //   [path: STRING,]
        //   currently not supported: [callback: FUNCTION] -- the specific callback to unsubscribe
        // }
        var path = options && options.path,
            store = this.store, registry = this.callbackRegistry,
            paths = path ? [this.path.concat(path)] : Object.keys(registry);
        paths.forEach(function(p) {
            registry[p] && registry[p].forEach(function(cb) { store.removeCallback(p, cb); });
            delete registry[p];
        });
    }
},
'write', {
    set: function(options) {
        // options: {path: STRING, callback: FUNCTION, value: OBJECT}
        this.store.set(this.path.concat(options.path), options.value, {callback: options.callback});
    },

    commit: function(options) {
        options.n = options.n === undefined ? 0 : options.n+1; // just for debugging
        if (options.n > 10) { throw new Error(show('Commit endless recursion?')); }
        var path = options.path,
            fullPath = this.path.concat(path),
            handle = this;
        function withValueDo(val) {
            var newVal = options.transaction(val, options.n);
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
        path = lively.PropertyPath(path);
        options = options || {};
        var callbacks = this.callbacks, db = this.db;
        // 1: checking precondition
        if (options.precondition) {
            var currentVal = path.get(db),
                preconditionOK = options.precondition(currentVal);
            if (!preconditionOK) {
                options.callback && options.callback({type: 'precondition'});
                return;
            }
        }
        // 2: setting the value in storage
        if (path.isRoot()) this.db = db = val; else path.set(db, val);
        // 3: Informing subscribers
        var cbs = Object.keys(callbacks).inject([], function(cbs, cbPath) {
            var cbPath = lively.PropertyPath(cbPath);
            if (path.isParentPathOf(cbPath)) {
                var relativeVal = cbPath.get(db),
                    boundCbs = callbacks[cbPath].invoke('bind', null, cbPath, relativeVal);
                cbs = cbs.concat(boundCbs);
            } else if (cbPath.isParentPathOf(path)) {
                var boundCbs = callbacks[cbPath].invoke('bind', null, path, val);
                cbs = cbs.concat(boundCbs);
            }
            callbacks[cbPath] = [];
            return cbs;
        }), cb;
        while ((cb = cbs.shift())) cb();
        options.callback && options.callback(null);
    },

    get: function(path, callback) {
        path = lively.PropertyPath(path);
        callback(path, path.get(this.db));
    },

    addCallback: function(path, callback) {
        this.callbacks[path] = (this.callbacks[path] || []).concat([callback]);
    },

    removeCallback: function(path, callback) {
        if (!this.callbacks[path]) return;
        this.callbacks[path] = this.callbacks[path].without(callback);
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

}) // end of module