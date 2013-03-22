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
        var path = this.fullPath(options.path),
            callback = options.callback,
            once = options.once,
            store = this.store,
            registry = this.registry;
        if (!path || path === '') path = '.';
        var i = 0;
        function updateHandler(path, val) {
            if (i++ > 100) { debugger; throw new Error('Endless recursion in #subscribe ' + path); }
            if (!registry[path] || !registry[path].include(updateHandler)) return;
            callback(val);
            if (!once) store.addCallback(path, updateHandler);
        }
        if (!registry[path]) { registry[path] = []; }; registry[path].push(updateHandler);
        store.get(path, updateHandler) || store.addCallback(path, updateHandler);
    },

    off: function(path) {
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

    commit: function(path, updateFunc, callback) {
        path = this.fullPath(path);
        var handle = this;
        this.get(path, function(val) {
            var newVal = updateFunc(val);
            // cancel commit?
            if (newVal === undefined) {
                callback(null, false, val);
                return;
            }
            handle.store.set(path, newVal, {
                callback: function(err) {
                    if (err && err.type === 'precondition') {
                        handle.commit(path, updateFunc, callback);
                        return;
                    }
                    callback(err, !err, err ? val : newVal);
                },
                precondition: function(storeVal) {
                    return storeVal === val;
                }
            });
        });
    }
},
'handle hierarchy', {
    child: function(path) {
        alert("childPath:" + this.fullPath(path))
        alert("childPath:" + path)
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
    callbacks: {}
},
'initializing', {
    initialize: function() {
        this.db = {};
    }
},
'accessing', {

    set: function(path, val, options) {
        options = options || {};
        if (options.precondition) {
            var currentVal = path === '.' ? this.db : this.db[path];
            var preconditionOK = options.precondition(currentVal);
            if (!preconditionOK) {
                options.callback && options.callback({type: 'precondition'});
                return;
            }
        }
        if (!path || path === '' || path === '.') this.db = val;
        else this.db[path] = val;
        var cbs = this.callbacks[path] || [], cb;
        this.callbacks[path] = [];
        while (cbs && (cb = cbs.shift())) cb(path, val);
        options.callback && options.callback(null);
    },

    get: function(path, callback) {
        var hasIt = this.has(path);
        var val = path === '.' ? this.db : this.db[path];
        if (hasIt) callback(path, val);
        return hasIt;
    },

    addCallback: function(path, callback) {
        var cbs = this.callbacks[path] = this.callbacks[path] || [];
        cbs.push(callback);
    }
},
'testing', {

    has: function(path) {
        return !path || path === '' || path === '.' ? true : !!this.db.hasOwnProperty(path);
    }

});

}) // end of module