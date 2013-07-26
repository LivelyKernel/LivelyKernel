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
        // proxies are fully virtual objects: don't point to their target, but
        // refer to it by __objectID
        var proxy = Proxy({}, this.versioningProxyHandler());
        proxy.__objectID = id;
        return proxy;
    },
    versioningProxyHandler: function() {
        return {
            // first parameter of >>set: and >>get: is the proxy's target
            // but as these proxies are fully virtual, it's an empty object
            set: function(virtualTarget, name, value, receiver) {
                var targetObject;
                
                if (name === '__objectID') {
                    this[name] = value;
                    return true;
                }
                                                
                targetObject = lively.CurrentObjectTable[receiver.__objectID];
                
                
                // create a new version of both the current OT
                // and the object that gets changed
                var newObjectTable = Object.clone(lively.CurrentObjectTable.clone()),
                    newObject = Object.clone(targetObject);
                lively.Versions.push(newObjectTable);
                targetObject = newObject;
                lively.CurrentObjectTable = newObjectTable;
                lively.CurrentObjectTable[receiver.__objectID] = newObject;
                
                       
                targetObject[name] = value;
                
                return true;
            },
            get: function(virtualTarget, name, receiver) {
                var targetObject,
                    result;
                
                if (name === '__objectID') {
                    // the alias object for this proxy
                    return this[name];
                }
                                                
                targetObject = lively.CurrentObjectTable[receiver.__objectID];                
                return targetObject[name]; 
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