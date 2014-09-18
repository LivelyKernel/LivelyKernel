lively.LocalStorage = {

    isAvailable: function() {
        try {
            return typeof localStorage !== 'undefined';
        } catch(e) {
            // SecurityError may happen if localStorage was disabled
            return false;
        }
    },

    get: function(propName) {
        if (!this.isAvailable()) return null;
        return localStorage.getItem('lively' + propName);
    },

    set: function(propName, value) {
        if (!this.isAvailable()) return null;
        return localStorage.setItem('lively' + propName, value);
    },

    remove: function(propName) {
        if (this.isAvailable())
            localStorage.removeItem('lively' + propName);
    },

    keys: function() {
        if (!this.isAvailable()) return [];
        // LocalStorage does not have a proper way to get all the items
        return Object.getOwnPropertyNames(localStorage).
            select(function(key) { return key.startsWith('lively'); }).
            map(function(key) { return key.substr(6); });
    }

}

// Easy to use interface for IndexedDB
// Mostly a key-value store like LocalStorage but with no size restrictions
// Auto-upgrade of DB once the schema is changed (e.g. stores are added)
lively.IndexedDB = {

    directInterface: window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
    defaultStoreName: 'default',
    currentDB: null,

    isAvailable: function() {
        // SecurityError does not seem to happen if IndexedDB was disabled
        return typeof this.directInterface !== 'undefined';
    },

    ensureDatabase: function(optVersion, optUpgradeFunc, callback) {
        if (this.currentDB) {
            if ((optVersion == undefined) || (optVersion <= this.currentDB.version)) {
                if (callback instanceof Function)
                    return callback(null);
            } else {
                this.currentDB.close();
                this.currentDB = null;
            }
        }

        var self = this,
            request = optVersion == undefined ? this.directInterface.open('LivelyDatabase') :
                        this.directInterface.open('LivelyDatabase', optVersion);
        request.onerror = function(event) {
            callback && callback(event.target.error);
        };
        request.onsuccess = function(event) {
            self.currentDB = event.target.result;
            callback && callback(null);
        };
        // may be called when new db is created or version is upgraded
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            self.currentDB = db;

            // create default store(s) with auto increment
            var defaultStores = lively.Config.get('defaultIndexedDBStores') || [self.defaultStoreName];
            defaultStores.forEach(function(storeName) {
                self.ensureObjectStore(storeName, { autoIncrement: true });
            });

            if (optUpgradeFunc instanceof Function)
                optUpgradeFunc(db);

            if (event.oldVersion == 0)
                console.info('DB created');
            // else
            //     console.info('DB upgraded');
        };
    },

    ensureObjectStore: function(store, options, callback) {
        options = options || { autoIncrement: true };
        this.hasStore(store, function(err, exists) {
            if (exists) return callback && callback(null);
            var db = this.currentDB;
            try {
                var objectStore = db.createObjectStore(store, options);
                callback && callback(null);
            } catch (e) {
                // most likely not in DB upgrade => trigger upgrade
                this.ensureDatabase(db.version + 1, function(db) {
                    db.createObjectStore(store, options);
                }, callback);
            }
        }.bind(this));
    },

    set: function(key, value, callback, optStore) {
        if (!this.isAvailable()) return callback && callback(new Error('IndexedDB is not available.'));

        optStore = optStore || this.defaultStoreName;
        Functions.composeAsync(
            this.ensureDatabase.bind(this, undefined, undefined),
            this.ensureObjectStore.bind(this, optStore, null),
            function(next) {
                this.has(key, next, optStore);
            }.bind(this),
            function (exists, next) {
                if (!exists) return next();

                this.remove(key, next);
            }.bind(this),
            function writeValue(next) {
                var transaction = this.currentDB.transaction(optStore, 'readwrite').
                        objectStore(optStore).add(value, key);
                transaction.onsuccess = function(event) {
                    next(null, event.target.result); // should be key
                };
                transaction.onerror = function(event) {
                    next(event.target.error);
                };
            }.bind(this)
        )(callback);
    },

    get: function(key, callback, optStore) {
        if (!(callback instanceof Function))
            throw new Error('You need to provide a callback to retrieve a value!');
        if (!this.isAvailable()) return callback(new Error('IndexedDB is not available.'));

        optStore = optStore || this.defaultStoreName;
        Functions.composeAsync(
            this.ensureDatabase.bind(this, undefined, undefined),
            this.ensureObjectStore.bind(this, optStore, null),
            function(next) {
                var transaction = this.currentDB.transaction(optStore, 'readwrite').
                        objectStore(optStore).get(key);
                transaction.onsuccess = function(event) {
                    next(null, event.target.result);
                };
                transaction.onerror = function(event) {
                    next(event.target.error);
                };
            }.bind(this)
        )(callback);

    },

    has: function(key, callback, optStore) {
        if (!(callback instanceof Function))
            throw new Error('You need to provide a callback to see if a key exists!');
        if (!this.isAvailable()) return callback(new Error('IndexedDB is not available.'));

        optStore = optStore || this.defaultStoreName;
        Functions.composeAsync(
            this.ensureDatabase.bind(this, undefined, undefined),
            this.ensureObjectStore.bind(this, optStore, null),
            function(next) {
                var transaction = this.currentDB.transaction(optStore, 'readwrite').
                        objectStore(optStore).count(key);
                transaction.onsuccess = function(event) {
                    next(null, event.target.result > 0);
                };
                transaction.onerror = function(event) {
                    next(event.target.error);
                };
            }.bind(this)
        )(callback);
    },

    remove: function(key, callback, optStore) {
        if (!this.isAvailable()) return callback && callback(new Error('IndexedDB is not available.'));

        optStore = optStore || this.defaultStoreName;
        Functions.composeAsync(
            this.ensureDatabase.bind(this, undefined, undefined),
            this.ensureObjectStore.bind(this, optStore, null),
            function(next) {
                var transaction = this.currentDB.transaction(optStore, 'readwrite').
                        objectStore(optStore).delete(key);
                transaction.onsuccess = function(event) {
                    next(null);
                };
                transaction.onerror = function(event) {
                    next(event.target.error);
                };
            }.bind(this)
        )(callback);
    },

    hasStore: function(store, callback) {
        if (!(callback instanceof Function))
            throw new Error('You need to provide a callback to see if a store exists!');
        if (!this.isAvailable()) return callback(new Error('IndexedDB is not available.'));

        Functions.composeAsync(
            this.ensureDatabase.bind(this, undefined, undefined),
            function(next) {
                var stores = Array.from(this.currentDB.objectStoreNames);
                next(null, stores.include(store));
            }.bind(this)
        )(callback);
    },

    clear: function(callback, optStore) {
        if (!this.isAvailable()) return callback && callback(new Error('IndexedDB is not available.'));

        optStore = optStore || this.defaultStoreName;
        Functions.composeAsync(
            this.ensureDatabase.bind(this, undefined, undefined),
            function(next) {
                var transaction = this.currentDB.transaction(optStore, 'readwrite').
                        objectStore(optStore).clear();
                transaction.onsuccess = function(event) {
                    next(null);
                };
                transaction.onerror = function(event) {
                    next(event.target.error);
                };
            }.bind(this)
        )(callback);
    },

    removeStore: function(store, callback) {
        if (!this.isAvailable()) return callback && callback(new Error('IndexedDB is not available.'));

        Functions.composeAsync(
            this.ensureDatabase.bind(this, undefined, undefined),
            this.hasStore.bind(this, store),
            function(exists, next) {
                if (!exists) next(null);

                var db = this.currentDB;
                try {
                    var objectStore = db.deleteObjectStore(store);
                    next(null);
                } catch (e) {
                    // most likely not in DB upgrade => trigger upgrade
                    this.ensureDatabase(db.version + 1, function(db) {
                        db.deleteObjectStore(store);
                    }, next);
                }
            }.bind(this)
        )(callback);
    }

}
