module('lively.groups.Core').requires().toRun(function() {

Object.subclass('lively.groups.ObjectGroup', 
'properties', {
    isObjectGroup: true
},
'initializing', {
    initialize: function(name) {
        this.name = name || '';
        this.groupID =  new UUID().id;
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
    },
    getScripts: function() {
        var scripts = {};
        var that = this;
        this.getMembers().each(function(ea) {
            Functions.own(ea).each(function(eaScriptName) {
                var eaScript = ea[eaScriptName]
                if (eaScript.groupID === that.groupID) {
                    scripts[eaScript.id] = eaScript
                }
            })
        })
        return Properties.values(scripts)
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
            var func = ea.addScript(funcOrString, optName);
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
        this.setProperty('id', id || new UUID().id);
    },
    setTimestamp: function(timestamp) {
        this.setProperty('timestamp', timestamp || new Date());
    },
    setGroupID: function(groupID) {
        this.setProperty('groupID', groupID);
    },
    setHistory: function(history) {
        this.setProperty('history', history || []);
    },
    getHistory: function() {
        return this.history || [];
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
    getScriptsForGroup: function(group) {
        var that = this;
        return Functions.own(this).collect(function (eaScriptname) {
            return that[eaScriptname];
        }).select(function (eaScript) {
            return eaScript.groupID == group.groupID;
        });
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
    updateGroupBehavior: function() {
        this.groups.forEach(function(eaGroup) {
            this.pullGroupChangesFrom(eaGroup);
            this.pushGroupChangesTo(eaGroup);
        }, this);
    },
    pullGroupChangesFrom: function(group) {
        group.getScripts().each(function(ea) {
            var myScript = this[ea.name];
            if (!myScript || ea.getHistory().include(myScript.id)) {
                this.addScript(ea);
            }
        }, this);
    },
    pushGroupChangesTo: function(group) {
        this.getScriptsForGroup(group).each(function (eaScript) {
            group.getMembers().each(function (eaMember) {
                var memberScript = eaMember[eaScript.name];
                if (!memberScript || eaScript.getHistory().include(memberScript.id)) {
                    eaMember.addScript(eaScript);
                }
            })
        }, this);
    },
},
'prototypical scripting', {
    addScript: function(funcOrString, optName) {
        if (!funcOrString) return false;
        var func = Function.fromString(funcOrString);
        var previousScript = this[optName || func.name];
        if (previousScript) {
            var history = previousScript.getHistory();
            if (previousScript.id) {
                history.push(previousScript.id);
            }
        }
        var script = func.asScriptOf(this, optName);
        script.setID(funcOrString.id);
        script.setTimestamp(funcOrString.timestamp);
        script.setHistory(history);
        return script;
    },
});

}) // end of module