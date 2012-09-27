module('lively.groups.Core').requires().toRun(function() {

Object.subclass('lively.groups.ObjectGroup', 
'properties', {
    isObjectGroup: true
},
'initializing', {
    initialize: function(name) {
        this.name = name || '';
        this.groupID =  new UUID();
    },
},
'accessing', {
    addMember: function(member) {
        member.addGroup(this);
    },
    addMembers: function(members) {
        var that = this;
        members.forEach(function (ea) {
            ea.addGroup(that)
        });
    },
    getMembers: function() {
        return lively.morphic.World.current().findGroupMembersByID(this.groupID);
    }
},
'group operations', {
    addProperty: function(name, value) {
        this.getMembers().forEach(function (ea) {
            ea[name] = value;
        });
    },
    addScript: function(funcOrString, optName) {
        var that = this;
        this.getMembers().forEach(function (ea) {
            var func = Object.addScript(ea, funcOrString, optName);
            func.setGroupID(that.groupID);
            ea.addGroup(that);
        });
    },
    perform: function(selector, args) {
        return this.getMembers().collect(function (ea) {
            try {
                return ea[selector].apply(ea, args);
            } catch(e) {
                return e;
            }
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
    getGroups: function() {
        if (!this.groups) {
            this.groups = [];
        }
        return this.groups;
    },
    findGroupMembersByID: function(groupID) {
        var result = [];
        if (this.getGroups().detect(function (ea) {
            return ea.groupID === groupID;
        })) {
            result.push(this);
        }
        this.submorphs.each(function (ea) {
            result.pushAll(ea.findGroupMembersByID(groupID));
        })
        return result;
    },
},
'prototypical scripting', {
    addScript: function(funcOrString, optName) {
        if (!funcOrString) return false;
        var func = Function.fromString(funcOrString);
        var script = func.asScriptOf(this, optName);
        script.setID(funcOrString.id);
        script.setTimestamp(funcOrString.timestamp);
        return script;
    },
});

}) // end of module