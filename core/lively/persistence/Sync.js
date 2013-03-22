module('lively.persistence.Sync').requires().toRun(function() {

Object.subclass('lively.persistence.Sync.ObjectHandle',
"initializing", {
    initialize: function(options) {
        this.basePath = options.basePath || '';
        this.store = options.store;
        this.registry = {};
        this.localStore = {};
    }
},
'read', {
    get: function(path, callback) {
        this.subscribe(path, callback, true);
    },
    
    subscribe: function(path, callback, once) {
        var store = this.store, registry = this.registry;
        var i = 0;
        function updateHandler(path, val) {
            if (i++ > 100) { debugger; throw new Error('Endless recursion in #subscribe'); }
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
    set: function(path, val, callback) {
        this.store.set(path, val, {callback: callback});
    },
    
    commit: function(path, updateFunc, callback) {
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
                precondition: function() {
                    var storeVal = handle.store[path];
                    return storeVal === val;
                }
            });
        });
    }
},
'server communication', {},
'updating', {},
'debugging', {
    toString: function() {
        return 'ObjectHandle(' + Objects.inspect({name: this.basePath})
             + ', ' + Objects.inspect(this.localStore) + ')';
    }
});

Object.subclass('lively.persistence.Sync.LocalStore',
'properties', {
    callbacks: {}
},
'accessing', {

    set: function(path, val, options) {
        options = options || {}, preconditionOK = true;
        if (options.precondition) {
            var preconditionOK = options.precondition();
            if (!preconditionOK) {
                options.callback && options.callback({type: 'precondition'});
                return;
            }
        }
        this[path] = val;
        var cbs = this.callbacks[path] || [];
        this.callbacks[path] = [];
        while (cbs && (cb = cbs.shift())) cb(path, val);
        options.callback && options.callback(null);
    },
    
    get: function(path, callback) {
        var hasIt = this.has(path);
        if (hasIt) callback(path, this[path]);
        return hasIt;
    },

    addCallback: function(path, callback) {
        var cbs = this.callbacks[path] = this.callbacks[path] || [];
        cbs.push(callback);
    }
},
'testing', {

    has: function(path) {
        return !!this.hasOwnProperty(path);
    }

});

}) // end of module