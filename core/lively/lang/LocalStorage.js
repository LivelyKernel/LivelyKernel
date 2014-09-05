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

            // create default store with auto increment
            self.ensureObjectStore('default', { autoIncrement: true });

            if (optUpgradeFunc instanceof Function)
                optUpgradeFunc(db);

            if (event.oldVersion == 0)
                console.info('DB created');
            // else
            //     console.info('DB upgraded');
        };
    },

    ensureObjectStore: function(storeName, options, callback) {
        var db = this.currentDB,
            dbStores = Array.from(db.objectStoreNames);
        if (!dbStores.include(storeName)) {
            options = options || { autoIncrement: true };
            try {
                var objectStore = db.createObjectStore(storeName, options);
                callback && callback(null)
            } catch (e) {
                // most likely not in DB upgrade => trigger upgrade
                this.ensureDatabase(db.version + 1, function(db) {
                    db.createObjectStore(storeName, options);
                }, callback);
            }
        } else if (callback instanceof Function)
            return callback(null);
    },

    set: function(key, value, callback, optStore) {
        if (!this.isAvailable()) return callback && callback(new Error('IndexedDB is not available.'));

        optStore = optStore || 'default';
        Functions.composeAsync(
            this.ensureDatabase.bind(this, undefined, undefined),
            this.ensureObjectStore.bind(this, optStore, null),
            this.has.bind(this, key),
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

        optStore = optStore || 'default';
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
            throw new Error('You need to provide a callback to retrieve a value!');
        if (!this.isAvailable()) return callback(new Error('IndexedDB is not available.'));

        optStore = optStore || 'default';
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

        optStore = optStore || 'default';
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
    }

}
