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
    init: function() {
        if (!lively.CurrentObjectTable) {
            lively.CurrentObjectTable = [];
        }
        if (!lively.Versions) {
            lively.Versions = [];
        }
    },
    reset: function() {
        delete lively.CurrentObjectTable;
        delete lively.Versions;
        this.init();
    },
    makeVersionedObjectFor: function(target) {
        var id = lively.CurrentObjectTable.length;
        lively.CurrentObjectTable.push(target);
        return this.aliasFor(id);
    },
    aliasFor: function(id) {        
        // proxies are fully virtual objects and don't really reference their target
        // as the target will change (newer versions of the target are full copies):
        // the whole point of the OTs
        var proxy = Proxy({}, this.versioningProxyHandler());
        proxy.__alias = {
            isAlias: true,
            id: id
        };        
        return proxy;
    },
    versioningProxyHandler: function() {
        return {
            set: function(target, name, value, receiver) {
                var targetObject;
                
                if (name === '__alias') {
                    this[name] = value;
                    return true;
                }
                                
                targetObject = lively.CurrentObjectTable[receiver.__alias.id];
                                
                // create a new version of both the current OT
                // and the object that gets changed
                var newObjectTable = Object.clone(lively.CurrentObjectTable.clone()),
                    newObject = Object.clone(targetObject);
                targetObject = newObject;
                lively.Versions.push(lively.CurrentObjectTable);
                lively.CurrentObjectTable = newObjectTable;
                lively.CurrentObjectTable[receiver.__alias.id] = newObject;
                       
                // assumes that all non-primitive properties are proxied
                if (value.__alias) {
                    // setting an alias property
                    targetObject[name] = value.__alias;
                } else {
                    // setting a primitive property
                    targetObject[name] = value;
                }
                return true;
            },
            get: function(target, name, receiver) {
                var targetObject,
                    result;
                
                if (name === '__alias') {
                    // the alias object for this proxy
                    return this[name];
                }
                                
                targetObject = lively.CurrentObjectTable[receiver.__alias.id];                
                if (targetObject[name] && targetObject[name].isAlias) {
                    // alias property
                    return lively.ObjectVersioning.aliasFor(targetObject[name].id); 
                } else {
                    // primitive property
                    return targetObject[name];
                }
            },
        };
    },
    undo: function() {
        lively.CurrentObjectTable = lively.Versions.pop();
    },
});

lively.ObjectVersioning.init();

});