module('lively.ObjectVersioning').requires().toRun(function() {

Object.extend(lively.ObjectVersioning, {
    init: function() {
        lively.CurrentObjectTable = [];
        lively.Versions = []; // a linear history (for now)
        lively.Versions.push(lively.CurrentObjectTable);
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
                lively.Versions.push(newObjectTable);
                targetObject = newObject;
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
        var previousVersion = this.previousVersion();
        if (!previousVersion) {
            throw new TypeError('Changes can\'t be undone because there\'s no previous version.');
        }
        lively.CurrentObjectTable = previousVersion;
    },
    redo: function() {
        var followingVersion = this.followingVersion();
        if (!followingVersion) {
            throw new TypeError('Changes can\'t be undone because there\'s no more recent version.');
        }
        lively.CurrentObjectTable = this.followingVersion();
    },
    previousVersion: function() {
        var index = lively.Versions.indexOf(lively.CurrentObjectTable) - 1;
        if (index < 0) {
            return undefined;
        }
        return lively.Versions[index];
    },
    followingVersion: function() {
        var index = lively.Versions.indexOf(lively.CurrentObjectTable) + 1;
        if (index >= lively.Versions.size()) {
            return undefined;
        }
        return lively.Versions[index];
    },
});

lively.ObjectVersioning.init();

});