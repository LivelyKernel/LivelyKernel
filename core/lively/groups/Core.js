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
        var that = this;
        this.members.forEach(function (ea) {
            var func = Object.addScript(ea, funcOrString, optName);
            func.setGroupID(that.groupID);
            ea.addGroup(that);
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
lively.morphic.Morph.addMethods(
'object groups', {
    addGroup: function(group) {
        if (!this.groups) {
            this.groups = [];
        }
        if (!this.groups.include(group)) {
            this.groups.push(group);
        }
    },
    getGroups: function(group) {
        return this.groups;
    }
});

}) // end of module