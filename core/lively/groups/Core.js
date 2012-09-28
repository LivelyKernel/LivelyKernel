module('lively.groups.Core').requires('lively.PartsBin').toRun(function() {

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
        members.each(function (ea) {
            this.addMember(ea);
        }, this);
    },
    getMembers: function() {
        return lively.morphic.World.current().findGroupMembersByID(this.groupID);
    },
    getScripts: function() {
        var scripts = {};
        var that = this;

        // gather all versions of the same script across group members
        this.getMembers().each(function(ea) {
            Functions.own(ea).each(function(eaScriptName) {
                var eaScript = ea[eaScriptName]
                if (eaScript.groupID === that.groupID) {
                    if (!scripts[eaScript.name]) {
                        scripts[eaScript.name] = {}
                    }
                    scripts[eaScript.name][eaScript.id] = eaScript;
                }
            })
        })

        // remove all versions that are in the history of newer versions
        Properties.own(scripts).forEach(function (eaScriptname) {
            var scriptsWithSameName = scripts[eaScriptname];

            var historicalIds = Properties.values(scriptsWithSameName).collect(function (eaScript) {
                return eaScript.history;
            }).flatten().uniq();

            historicalIds.forEach(function (eaScriptID) {
                delete scriptsWithSameName[eaScriptID];
            });

            if (Properties.values(scriptsWithSameName).size() > 1) throw 'group script conflict';
        });

        return Properties.values(scripts).collect(function (eaScripts) {
            return Properties.values(eaScripts).first();
        })
    }
},
'group operations', {
    addProperty: function(name, value) {
        this.getMembers().forEach(function (ea) {
            ea[name] = value;
        });
    },
    addScript: function(funcOrString, optName) {
        var script;
        this.getMembers().each(function (ea) {
            if (!script) {
                script = ea.addScript(funcOrString, optName);
            } else {
                script = ea.addScript(script, optName);
            }
            script.setGroupID(this.groupID);
            ea.addGroup(this);
        }, this);
        return script;
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
        alertOK('updating group behavior for' + this);
        this.getGroups().forEach(function(eaGroup) {
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
        var history = [];
        if (previousScript) {
             history = previousScript.getHistory().concat(previousScript.id);
        }
        var script = func.asScriptOf(this, optName);
        script.setID(funcOrString.id);
        script.setTimestamp(funcOrString.timestamp);
        script.setHistory(history);
        return script;
    },
});

lively.morphic.World.addMethods(
'object groups', {
    allObjectGroups: function() {
        var groups = {};
        this.withAllSubmorphsDo(function (ea) {
            ea.groups.each(function (eaGroup) {
                if (!eaGroup) debugger;
                if (!eaGroup.groupID) debugger;
                groups[eaGroup.groupID] = eaGroup;
            })
        })
        return Properties.values(groups);
    }
}
);
cop.create('GroupSupportLayer').refineClass(lively.PartsBin.PartItem, {
    setPart: function(part) {
        cop.proceed(part);
        part.updateGroupBehavior();
        return part;
    },
});
GroupSupportLayer.beGlobal();

}) // end of module