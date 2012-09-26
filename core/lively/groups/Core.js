module('lively.groups.Core').requires().toRun(function() {

Object.subclass('lively.groups.ObjectGroup', 
'properties', {
    isObjectGroup: true
},
'initializing', {
    initialize: function(name) {
        this.name = name || '';
        this.groupID =  new UUID();
        this.members = [];
    },
},
'accessing', {
    addMember: function(member) {
        this.members.push(member);
        member.addGroup(this);
    },
    addMembers: function(members) {
        this.members.pushAll(members);

        var that = this;
        members.forEach(function (ea) {
            ea.addGroup(that)
        });
    },
},
'group operations', {
    addScriptToMembers: function(funcOrString, optName) {
        this.members.forEach(function (ea) {
            Object.addScript(ea, funcOrString, optName);
        });
    }
}
);
Object.extend(Function.prototype, {
    setID: function(id) {
        this.setProperty('id', id || new UUID());
    },
    setTimestamp: function(timestamp) {
        this.setProperty('timestamp', timestamp || new Date());
    },
    setGroupID: function(groupID) {
        this.setProperty('groupID', groupID);
    },
    setHistory: function(history) {
        this.setProperty('history', history);
    }
});
Object.extend(Morph.prototype, {
    addGroup: function(group) {
        if (!this.groups) {
            this.groups = [];
        }
        this.groups.push(group);
    },
    getGroups: function(group) {
        return this.groups;
    }
});

}) // end of module