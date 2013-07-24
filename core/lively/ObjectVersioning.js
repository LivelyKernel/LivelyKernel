module('lively.ObjectVersioning').requires().toRun(function() {
        
Object.subclass('lively.ObjectVersioning.ObjectVersioner', 
'initialization', {
    initialize: function() {
        this.currentVersion = {};
        this.versionHistory = []; // linear versionHistory, for now
        this.versionHistory.push(this.currentVersion);
    }
},
'version handling', {
    nextVersion: function() {
        this.currentVersion = Object.create(this.currentVersion);
        this.versionHistory.push(this.currentVersion);
    },
    write: function(key, value) {
        this.nextVersion();
        this.currentVersion[key] = value;
    },
    read: function(key) {
        return this.currentVersion[key];
    },
    previousVersion: function() {
        var index = this.versionHistory.indexOf(this.currentVersion) - 1;
        if (index < 0) {
            return undefined;
        }
        return this.versionHistory[index];
    },
    followingVersion: function() {
        var index = this.versionHistory.indexOf(this.currentVersion) + 1;
        if (index === this.versionHistory.size()) {
            return undefined;
        }
        return this.versionHistory[index];
    },
    undo: function() {
        var previousVersion = this.previousVersion();
        if (!previousVersion) {
            throw new TypeError("No changes can't be undone");
        }
        this.currentVersion = previousVersion;
    },
    redo: function() {
        var followingVersion = this.followingVersion();
        if (!followingVersion) {
            throw new TypeError("No changes can't be redone");
        }
        this.currentVersion = followingVersion;
    },
});

Object.extend(lively.ObjectVersioning, {
    init: function() {
        if (!this.activeVersioner) {
            this.activeVersioner = new lively.ObjectVersioning.ObjectVersioner();
        }
    },
    reset: function() {
        delete this.activeVersioner;
        this.init();
    },
    undo: function() {
        this.activeVersioner.undo();
    },
    redo: function() {
        this.activeVersioner.redo();
    },
    versioningProxyFor: function(target) {
        return Proxy(target, this.versioningProxyHandler());
    },
    write: function(key, value) {
        this.activeVersioner.write(key, value);
    },
    read: function(key) {
        return this.activeVersioner.read(key);
    },
    versioningProxyHandler: function() {
        return {
            set: function(target, name, value, receiver) {
                if (!this[name]) {
                    this[name] = new UUID().id;
                }
                lively.ObjectVersioning.write(this[name], value);
                return true;
            },
            get: function(target, name, receiver) {
                if (this[name]) {
                    return lively.ObjectVersioning.read(this[name]);
                } else {
                    return undefined;
                }
            },
        };
    },
});

lively.ObjectVersioning.init();

});