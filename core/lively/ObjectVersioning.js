module('lively.ObjectVersioning').requires().toRun(function() {
        
// Object.subclass('lively.ObjectVersioning.ObjectVersioner', 
// 'initialization', {
//     initialize: function() {
//         this.currentVersion = {};
//         this.versionHistory = []; // linear versionHistory, for now
//         this.versionHistory.push(this.currentVersion);
//     }
// },
// 'version handling', {
//     nextVersion: function() {
//         this.currentVersion = Object.create(this.currentVersion);
//         this.versionHistory.push(this.currentVersion);
//     },
//     write: function(key, value) {
//         this.nextVersion();
//         this.currentVersion[key] = value;
//     },
//     read: function(key) {
//         return this.currentVersion[key];
//     },
//     previousVersion: function() {
//         var index = this.versionHistory.indexOf(this.currentVersion) - 1;
//         if (index < 0) {
//             return undefined;
//         }
//         return this.versionHistory[index];
//     },
//     followingVersion: function() {
//         var index = this.versionHistory.indexOf(this.currentVersion) + 1;
//         if (index === this.versionHistory.size()) {
//             return undefined;
//         }
//         return this.versionHistory[index];
//     },
//     undo: function() {
//         var previousVersion = this.previousVersion();
//         if (!previousVersion) {
//             throw new TypeError("No changes can't be undone");
//         }
//         this.currentVersion = previousVersion;
//     },
//     redo: function() {
//         var followingVersion = this.followingVersion();
//         if (!followingVersion) {
//             throw new TypeError("No changes can't be redone");
//         }
//         this.currentVersion = followingVersion;
//     },
// });

Object.extend(lively.ObjectVersioning, {
    proxyMetaProperties: ['__alias', '__target'],
    init: function() {
        if (!lively.currentObjectTable) {
            lively.currentObjectTable = [];
        }
    },
    reset: function() {
        delete lively.currentObjectTable;
        this.init();
    },
    wrap: function(target) {
        var proxy = Proxy(target, this.versioningProxyHandler());
        lively.currentObjectTable.push(proxy);
        proxy.__target = target;
        proxy.__alias = {
            isAlias: true,
            id: lively.currentObjectTable.length - 1
        };        
        return proxy;
    },
    unwrap: function(proxy){
        return proxy.__target;
    },
    versioningProxyHandler: function() {
        return {
            set: function(target, name, value, receiver) {
                
                if (lively.ObjectVersioning.proxyMetaProperties.include(name)) {
                    this[name] = value;
                    return true;
                }
                                                
                if (value.__alias) {
                    // proxied object
                    target[name] = value.__alias;
                } else {
                    // primitive object
                    target[name] = value;
                }
                return true;
            },
            get: function(target, name, receiver) {
                
                if (lively.ObjectVersioning.proxyMetaProperties.include(name)) {
                    return this[name];
                }
                                
                if (target[name].isAlias) {
                    // alias property
                    return lively.currentObjectTable[target[name].id];
                } else {
                    // primitive object
                    return target[name];
                }
            },
        };
    },

    // undo: function() {
    //     this.activeVersioner.undo();
    // },
    // redo: function() {
    //     this.activeVersioner.redo();
    // },
    // write: function(key, value) {
    //     this.activeVersioner.write(key, value);
    // },
    // read: function(key) {
    //     return this.activeVersioner.read(key);
    // },
});

lively.ObjectVersioning.init();

});