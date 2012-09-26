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
    },
    addMembers: function(members) {
        this.members.pushAll(members);
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

}) // end of module