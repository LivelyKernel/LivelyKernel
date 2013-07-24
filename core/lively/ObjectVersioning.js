module('lively.ObjectVersioning').requires().toRun(function() {
        
    Object.subclass('lively.ObjectVersioning.ObjectVersionManager', 
    'initialization', {
        initialize: function() {
            this.currentObjectTable = {};
            this.history = []; // linear history, for now
            this.history.push(this.currentObjectTable);
        }
    },
    'object table handling', {
        newObjectTableFrom: function(oldObjectTable) {
            return Object.create(oldObjectTable);
        },
        write: function(name, value) {
            var newObjectTable = this.newObjectTableFrom(this.currentObjectTable);
            newObjectTable[name] = value;
            this.history.push(newObjectTable);
            this.currentObjectTable = newObjectTable;
        },
        read: function(name) {
            return this.currentObjectTable[name];
        },
        previousTableVersion: function() {
            var index = this.history.indexOf(this.currentObjectTable) - 1;
            if (index < 0) {
                return undefined;
            }
            return this.history[index];
        },
        followingTableVersion: function() {
            var index = this.history.indexOf(this.currentObjectTable) + 1;
            if (index === this.history.size()) {
                return undefined;
            }
            return this.history[index];
        },
        undo: function() {
            var previousVersion = this.previousTableVersion();
            if (!previousVersion) {
                throw new TypeError("No changes can't be undone");
            }
            this.currentObjectTable = previousVersion;
        },
        redo: function() {
            var followingVersion = this.followingTableVersion();
            if (!followingVersion) {
                throw new TypeError("No changes can't be redone");
            }
            this.currentObjectTable = followingVersion;
        }
    });
        
    Object.extend(lively.ObjectVersioning, {
        versionedObjectProxyHandler: function() {
            return {
                set: function(target, name, value, receiver) {
                    if (!this[name]) {
                        this[name] = new UUID().id;
                    }
                    lively.VersionManager.write([this[name]], value);
                    return true;
                },
                get: function(target, name, receiver) {
                    if (this[name]) {
                        return lively.VersionManager.read([this[name]]);
                    } else {
                        return undefined;
                    }
                },
            };
        },
        createVersionedObject: function() {
            return Proxy({}, this.versionedObjectProxyHandler());
        },
        start: function() {
            if (!lively.VersionManager) {
                lively.VersionManager = new lively.ObjectVersioning.ObjectVersionManager();
            }
        },
        reset: function() {
            delete lively.VersionManager;
            this.start();
        }
    });
    
    lively.ObjectVersioning.start();
});