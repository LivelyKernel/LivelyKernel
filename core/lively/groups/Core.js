module('lively.groups.Core').requires('lively.PartsBin').toRun(function() {

Object.subclass('lively.groups.ObjectGroup', 
'properties', {
    isObjectGroup: true
},
'initializing', {
    initialize: function(name) {
        this.name = name || '';
        this.groupID =  new UUID().id;
        this.ripTokens = {};
    },
},
'accessing', {
    getName: function() {
        return this.name;
    },
    addMember: function(member) {
        member.addGroup(this);
    },
    removeMember: function(member) {
        member.removeGroup(this);
    },
    addMembers: function(members) {
        members.each(function (ea) {
            this.addMember(ea);
        }, this);
    },
    removeMembers: function(members) {
        members.each(function (ea) {
            this.removeMember(ea);
        }, this);
    },
    getMembers: function() {
        return lively.morphic.World.current().findGroupMembersByID(this.groupID);
    },
    getRipTokens: function() {
        var ripTokens = {};

        this.getMembers().each(function (eaMember) {
            var eaMemberTokens = eaMember.getGroup(this).ripTokens;

            if (eaMemberTokens) {
                Properties.all(eaMemberTokens).each(function (eaScriptTokenName) {
                    var history = eaMemberTokens[eaScriptTokenName].history;
                    if (ripTokens[eaScriptTokenName]) {
                        history = history.pushAll(ripTokens[eaScriptTokenName]).uniq();
                    }
                    ripTokens[eaScriptTokenName] = {history: history};
                }, this);
            }
        }, this);

        return ripTokens;
    },
    getScripts: function() {
        var scripts = this.getCurrentVersionsOfScripts();

        return Properties.values(scripts).select(function (eaScripts) {
            return Properties.values(eaScripts).size() == 1;
        }).collect(function (eaScripts) {
            return Properties.values(eaScripts).first();
        })
    },
    getScriptByName: function(scriptName) {
        return this.getScripts().detect(function (ea) {
            return scriptName === ea.name;
        });
    },
    getConflicts: function() {
        var scripts = this.getCurrentVersionsOfScripts();

        return Properties.values(scripts).select(function (eaScripts) {
            return Properties.values(eaScripts).size() > 1;
        }).collect(function (eaScripts) {
            return Properties.values(eaScripts);
        })
    },
    getCurrentVersionsOfScripts: function() {
        // gather all versions of the same script across group members
        var scripts = {};
        this.getMembers().each(function(ea) {
            Functions.own(ea).each(function(eaScriptName) {
                var eaScript = ea[eaScriptName]
                if (eaScript.groupID === this.groupID) {
                    if (!scripts[eaScript.name]) {
                        scripts[eaScript.name] = {}
                    }
                    scripts[eaScript.name][eaScript.id] = eaScript;
                }
            }, this);
        }, this);

        // remove all versions that are in the history of newer versions
        Properties.own(scripts).forEach(function (eaScriptname) {
            var scriptsWithSameName = scripts[eaScriptname];

            var historicalIds = Properties.values(scriptsWithSameName).collect(function (eaScript) {
                return eaScript.history;
            }).flatten().uniq();

            historicalIds.forEach(function (eaScriptID) {
                delete scriptsWithSameName[eaScriptID];
            });
        });

        return scripts;
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
    removeScript: function(scriptOrScriptname) {
        var script;
        if (scriptOrScriptname.id) {
            script = scriptOrScriptname;
        } else {
            script = this.getScripts().detect(function (ea) {
                return ea.name === scriptOrScriptname;
            }, this);

            if (!script) {
                // no script found or script is ambiguous among members
                return false;
            }
        }

        this.getMembers().each(function (ea) {
            if (ea[script.name]) {
                if (ea[script.name].id === script.id || script.history.include(ea[script.name].id))
                delete ea[script.name];
            }

            var memberGroup = ea.getGroup(this);

            var history = script.history.concat(script.id);
            if (memberGroup.ripTokens[script.name]) {
                history = history.pushAll(memberGroup.ripTokens[script.name].history).uniq();
            }
            memberGroup.ripTokens[script.name] = {history: history};
        }, this);
    },
    perform: function(selector, args) {
        return this.getMembers().collect(function (ea) {
            try {
                return ea[selector].apply(ea, args);
            } catch(e) {
                return e;
            }
        });
    },
    evaluate: function(snippet) {
        var interactiveEval = function() { return eval(snippet) };
        return this.getMembers().collect(function (ea) {
            try {
                return interactiveEval.call(ea);
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
    getGroup: function(group) {
        return this.getGroups().detect(function (eaGroup) {
            return eaGroup.groupID === group.groupID;
        }, this);
    },
    enterGroup: function(group) {
        this.addGroup(group);
    },
    removeGroup: function(group) {
        if (this.groups) {
            this.groups.remove(group);
        }

        Functions.own(this).each(function (eaName) {
            var script = this[eaName];
            if (script.groupID == group.groupID) {
                delete script.groupID;
            } 
        }, this);
    },
    leaveGroup: function(group) {
        this.removeGroup(group);
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

        var ripTokens = group.getRipTokens();

        Properties.own(ripTokens).each(function (eaScriptTokenName){
            if (this[eaScriptTokenName]) {
                var scriptToken = ripTokens[eaScriptTokenName];
                if (scriptToken.history.include(this[eaScriptTokenName].id)) {
                    delete this[eaScriptTokenName];
                    group.ripTokens[eaScriptTokenName] = scriptToken;
                }
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

        Properties.own(group.ripTokens).each(function (eaScriptTokenName) {
            group.getMembers().each(function (eaMember) {
                if (eaMember[eaScriptTokenName]) {
                    debugger;
                    var scriptToken = group.ripTokens[eaScriptTokenName];
                    if (scriptToken.history.include(eaMember[eaScriptTokenName].id)) {
                        delete eaMember[eaScriptTokenName];
                        eaMember.getGroup(group).ripTokens[eaScriptTokenName] = scriptToken;
                    }
            }
            }, this);
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
            ea.getGroups().each(function (eaGroup) {
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