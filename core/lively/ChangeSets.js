module('lively.ChangeSets').requires().toRun(function() {

Object.subclass('ChangeSet',

'initialize-release', {

	reinitialize: function() {
        //(Re)initialize the receiver to be empty
		if (!this.name)
		    throw new Error('All changeSets must be named and registered');
		this.clear();

	},

    initialize: function(aName, optDoNotStoreName) {
        if(!aName) {
            aName = ChangeSet.defaultName();
        }
        this.name = aName;
        this.changeRecords = [];
        this.timestamps = [];
	    ChangeSet.AllChangeSets.push(this);
	    if(optDoNotStoreName)
	        this.hydrate();
	    else
	        this.storeName(aName);
    },



	clear: function() {

		this.changeRecords = [];
        this.timestamps = [];
	},



	isMoribond: function() {

		return !this.name;

	},

	wither: function() {

		this.clear();
		this.name = null;

	}
});


Object.extend(ChangeSet, {

    allChangeSets: function() {
        return this.AllChangeSets;
    },
    
	assureChangeSetNamed: function(aName) {debugger;
	    var existing = this.named(aName);
	    if(existing)
	        return existing;
	    return this.basicNewChangeSet(aName);
	},

	basicNewChangeSet: function(aName) {
	    if(!aName)
	        return null;
	    var existing = this.named(aName);
	    if(existing) {
	        alert('Sorry, that name is already in use');
	        return null;
	    }
	    return new ChangeSet(aName);
	},
	existingOrNewChangeSetNamed: function(aName) {
	    var existing = this.named(aName);
	    if(existing) {
	        return existing;
	    }
	    return new ChangeSet(aName);
	},



	
	current: function() {
	    if(!this.CurrentChangeSet || this.CurrentChangeSet.isMoribond())
	        this.newChanges(this.assureChangeSetNamed(this.defaultName()));
		return this.CurrentChangeSet;
	},

	defaultName: function() {
	    return this.uniqueNameLike('Unnamed')
	},

    named: function(aName) {
        return this.AllChangeSets.detect(function(e) {
            return e.name == aName
        })
    },



    newChanges: function(aChangeSet) {
        this.CurrentChangeSet = aChangeSet;
        localStorage.setItem(this.userStorageRoot + ":defaultChangeSet", aChangeSet.name)
    },
    
    uniqueNameLike: function(aString) {
        if(!this.named(aString))
            return aString;
        for(var i= 1; i<100000; i++) {
            var trial = aString + i;
            if(!this.named(trial))
                return trial;
        }
        
    },
    
    AllChangeSets: [],
    
    CurrentChangeSet: null

});

Object.extend(ChangeSet, {
	loadAndcheckVsSystem: function() {

		var storageRoot = "LivelyChanges:" + $world.savedWorldAsURL + ":author:" + $world.getUserName();
		this.userStorageRoot = storageRoot;
        this.allTimestampsString = localStorage.getItem(storageRoot + ":timestamps");
        if(!this.allTimestampsString)
            //no changes recorded yet
            return;
        var changesetNamesString = localStorage.getItem(storageRoot + ":changesetNames");
        if(!changesetNamesString)
            //no changesets
            return;
        var defaultChangeSet = localStorage.getItem(storageRoot + ":defaultChangeSet");
        //localStorage.setItem(storageRoot + ":changesetNames", "[]")
        JSON.parse(changesetNamesString).each(function(e){
            var changeSet = new ChangeSet(e, true);
            if(e == defaultChangeSet)
                ChangeSet.newChanges(changeSet);
            if(!changeSet.hasErrors())
                changeSet.applyChanges(false);
            if(changeSet.hasErrors())
                $world.openInspectorFor(changeSet);
        })
	},
    logDoit: function(source, contextPath) {
        //do we really want to log this?
        //check if it has any potential side-effects
        var programNode = lively.ast.acorn.parse(source);
        var assignments = false, functionCalls = false, thisReferences = false;
        lively.ast.acorn.simpleWalk(programNode, {
            AssignmentExpression: function(node) { assignments = true },
            CallExpression: function(node) { functionCalls = true },
            ThisExpression: function(node) { thisReferences = true }
        });
        if(!assignments && !functionCalls)
            //should be safe to ignore
            return;
        var storageArray = [source];
        if(thisReferences)
        //otherwise no need for contextPath
            storageArray.push(contextPath);
        
        this.current().storeArray(storageArray, Date.now);
    },


    
    
    fullPathToFunctionsHolder: function(holder) {
        
        if(holder === Global)
            return "Global";
            
        if(holder instanceof Function) {
            if(holder.superclass && lively.lookup(holder.type || holder.displayName || holder.name) === holder)
                return holder.type || holder.displayName || holder.name;
                
            if(Global[holder.name] === holder)
                return holder.name;
                
            return null;
        }
        
        if(holder instanceof lively.Module)
            return holder.namespaceIdentifier;
            
        if(holder.constructor instanceof Function && holder.constructor.prototype === holder) {
            var constr = holder.constructor; debugger;
            if(constr.superclass && lively.lookup(constr.type || constr.displayName || constr.name) === constr)
                return (constr.type || constr.displayName || constr.name) + ".prototype";
                
            if(Global[constr.name] === constr)
                return constr.name + ".prototype";
                
            return null;
        }
        
        var exemplar;
        for (var name in holder)
            if (!holder.__lookupGetter__(name) && holder.hasOwnProperty(name) && (exemplar = holder[name]) instanceof Function)
                break;
        if(!exemplar)        
            return null;
        if(exemplar.belongsToTrait)
            return "RealTrait.prototype.traitRegistry." + exemplar.belongsToTrait.name + ".def";
            
        return null;

},

    logChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp) {

        return this.current().logChange(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp);
    },

    logFirstChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame) {
 
        return this.current().logFirstChange(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame);
    },

    logRemoval: function(source, contextPath, propertyName, categoryOrNil) {
 
        return this.current().logRemoval(source, contextPath, propertyName, categoryOrNil);
    },
    removeAllFromPersistentStorage: function() {// ChangeSet.removeAllFromPersistentStorage()
    
		var storageRoot = "LivelyChanges:" + $world.savedWorldAsURL + ":author:" + $world.getUserName();

        var changesetNamesString = localStorage.getItem(storageRoot + ":changesetNames"); debugger;
        if(changesetNamesString) {
            JSON.parse(changesetNamesString).each(function(n) {
                localStorage.removeItem(storageRoot + ":changesetTimestamps:" + n);
            });
            localStorage.removeItem(storageRoot + ":changesetNames");
        }

        var allTimestampsString = localStorage.getItem(storageRoot + ":timestamps");
        if(this.allTimestampsString != allTimestampsString)
            debugger;
        if(allTimestampsString) {
            JSON.parse("["+ allTimestampsString +"]").each(function(t) {
                localStorage.removeItem(storageRoot + ":allChanges:" + t);
            });
            localStorage.removeItem(storageRoot + ":timestamps");
        }
        delete this.allTimestampsString;
        
        localStorage.removeItem(storageRoot + ":defaultChangeSet")
    },



    changeDataFromStorage: function(array) {
// There are four formats for the array:
//
// 1. For doIts, there is just a two-element array: 
//   [source, contextPath]
//
// 2. For the first change representing the addition of a named property, there is a 4 or 5 element array:
//   [source, contextPath, 
//    propertyName, null, optCategory]
//
// 3. For subsequent changes of a named property, there is a 6 element array:
//   [sourceOrNil, contextPath, 
//    propertyName, firstChangeStamp, categoryOrNil,
//    previousChangeStamp]
//
// 4. For the first change representing the modification or removal of an existing named property, there is a 9 element array:
//   [sourceOrNil, contextPath, 
//    propertyName, firstChangeStamp, categoryOrNil,
//    previousCategoryOrNil,
//    previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame]

    	var entry = {contextPath: array[1] || "Global"}, 
    		source = array[0], 
    		propertyName = array[2];
    
    	if(propertyName) {
			entry.propertyName = propertyName;
			entry.category = array[4];
			var firstChangeStampOrNilIfAdd = array[3];
			if(firstChangeStampOrNilIfAdd) {
				entry.firstChangeStamp = firstChangeStampOrNilIfAdd;
    			var previous = array[5];
				if(previous && typeof previous.valueOf() == "number")
				//not a first change
					entry.previousChangeStamp = previous;
				else {
				//first change for this property
					entry.originalCategory = previous || array[4];
					entry.originalSource = array[6] || source;
					entry.originalContextPath = array[7] || array[1] || "Global";
					entry.originalPropertyName = array[8] || propertyName;
				}
				if(source) {
				//modification
					entry.source = source;
				} else {
				//removal
					entry.type = "removed";
				}
			} else {
			//addition
				entry.type = "added";
			}
		} else {
		//doIt
			entry.type = "doIt"
		}
		return entry
    },


    logAddition: function(source, contextPath, propertyName, optCategory) {

        return this.current().logAddition(source, contextPath, propertyName, optCategory);
    }

    
});
    
ChangeSet.addMethods(
    "actions", {

    applyChanges: function(logging) {
    //we call this in two modes: 
    //1. without logging, when we automatically bring back the world to its previous state  
    //   in this case, both timestamps and changeRecords are populated and apply is called at startup
    //2. with logging, when we "fileIn" this changeset in a different world
    //   in this case, timestamps have no meaning, so they are not serialized/deserialized
    //
        if(!logging && this.timestamps.length != this.changeRecords.length)
            throw new Error("inconsistent changeset state");
        if(this.changeRecords.length == 0) {
            alertOK("No changes to apply");
            return;
        }
            
        var i = -1, self = this;
        this.changeRecords.each(function(e){
            i++;
            if(e.originalContextPath) {
                try {
                    var originalContext = eval(e.originalContextPath);
                } catch(ex) {
                    self.errors.push("Failed to check changeset "+self.name+". Could not resolve the original context "+e.originalContextPath+"\n"+ex.name+": "+ex.message);
                    return;
                }
                if(e.originalPropertyName && !originalContext[e.originalPropertyName]) {debugger;
                    self.errors.push("Failed to load changeset "+self.name+". The original context "+e.originalContextPath+"\n does not have the original property name: "+e.originalPropertyName+" anymore");
                    return;
                }
                if(e.originalPropertyName && e.originalSource != originalContext[e.originalPropertyName].toString()) {
                    self.errors.push("Failed to load changeset "+self.name+". "+e.originalContextPath+"."+e.originalPropertyName+"\n does not have the same source anymore");
                    return;
                }
            }
            
            try {
                var context = eval(e.contextPath);
            } catch(ex) {
                self.errors.push("Failed evaluating context path: " + e.contextPath + "\n"+ ex.name + ": " + ex.message);
                return;
            }
            if(!e.type)
                e.type = "changed";
            switch(e.type.valueOf()) {
                case "doIt":
                    try {
                        (function() { return eval(e.source) }).call(context);
                    } catch(e) {
                        self.errors.push("Failed evaluating doit:\n" + e.source + "\in context " + e.contextPath + "\n"+ e.name + ": " + e.message);
                        return;
                    }
                    if(logging)
                        self.storeArray([e.source, e.contextPath], Date.now);
                    return;
                case "removed":
                    if(e.propertyName && !context[e.propertyName]) {
                        self.errors.push("Failed to remove property in changeset "+self.name+". The context "+e.contextPath+"\n does not have the property name: "+e.propertyName);
                        return;
                    }
                    delete context[e.propertyName];
                    if(logging)
                        self.logFirstRemoval(context[e.propertyName].toString(), e.contextPath, e.propertyName, e.category);
                    return;
                case "added":
                    if(e.propertyName && context[e.propertyName]) {
                        self.errors.push("Failed to add property in changeset "+self.name+". The context "+e.contextPath+"\n already has the property name: "+e.propertyName);
                        return;
                    }
                    (function() { return eval("this."+e.propertyName+" = "+ e.source) }).call(context);
                    var func = context[e.propertyName];
                    if(logging)
                        func.timestamp = self.logAddition(e.source, e.contextPath, e.propertyName, e.category);
                    else
                        func.timestamp = self.timestamps[i];
                    func.user = $world.getUserName(); 
                    return;
                default:
                    //should be some kind of modification (source for now)
                    if(e.propertyName && !context[e.propertyName]) {
                        self.errors.push("Failed to change property in changeset "+self.name+". The context "+e.contextPath+"\n does not have the property name: "+e.propertyName);
                        return;
                    }
                    if(e.source != context[e.propertyName].toString()) {debugger;
                        (function() { return eval("this."+e.propertyName+" = "+ e.source) }).call(context);
                        var func = context[e.propertyName];
                        if(logging)
                            func.timestamp = self.logFirstChange(e.source, e.contextPath, e.propertyName, e.category, null, context[e.propertyName].toString(), null, null);
                        else
                            func.timestamp = self.timestamps[i];
                        func.user = $world.getUserName(); 
                    }
                    return;
            }
        })
        
    },

    hasErrors: function() {
        return this.errors.length > 0;
    },



    logAddition: function(source, contextPath, propertyName, optCategory) {

        //make sure this is really a new addition (within the current changeset)
        var allChangesStorageRoot = ChangeSet.userStorageRoot + ":allChanges:";
        this.timestamps.each(function(t){
            var dataString = localStorage.getItem(allChangesStorageRoot + t);
            var changeRecord = ChangeSet.changeDataFromStorage(JSON.parse(dataString));
            if(changeRecord.contextPath == contextPath) {
                if(changeRecord.propertyName == propertyName) {
                    if(changeRecord.type != "removed")
                        throw new Error("should not happen");
                    //it is not really a new add
                    this.removeTimestamp(t);
                    return this.logFirstChange(source, contextPath, propertyName, optCategory,
                        changeRecord.originalCategory, changeRecord.originalSource, changeRecord.originalContextPath, changeRecord.originalPropertyName);
                }
            }
        })
        var timestamp = Date.now();
        this.storeArray([source, contextPath, propertyName, null, optCategory], timestamp);
        return timestamp
    },
    removeTimestamp: function(t) {

        this.timestamps.remove(t);
        localStorage.setItem(ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
    },

    logChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp) {

        //Get the previous change
        var allChangesStorageRoot = ChangeSet.userStorageRoot + ":allChanges:";
        var firstTimestamp = JSON.parse(localStorage.getItem(allChangesStorageRoot + previousChangeStamp))[3];
        var timestamp = Date.now();
        this.storeArray([sourceOrNil, contextPath, propertyName, firstTimestamp, categoryOrNil, previousChangeStamp], timestamp);
        this.removeTimestamp(previousChangeStamp);

        var firstDataString = localStorage.getItem(allChangesStorageRoot + firstTimestamp);
        var firstChangeRecord = ChangeSet.changeDataFromStorage(JSON.parse(firstDataString));
        debugger;
        if(firstChangeRecord.originalSource == sourceOrNil &&
            firstChangeRecord.originalContextPath == contextPath &&
            firstChangeRecord.originalPropertyName == propertyName &&
            firstChangeRecord.originalCategory == categoryOrNil)
            //this is not really a change, we are reverting to the original
            this.removeTimestamp(timestamp);
        return timestamp
    },

    logFirstChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame) {
 
        var timestamp = Date.now();
        this.storeArray([sourceOrNil, contextPath, propertyName, timestamp, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame], timestamp);
        return timestamp
    },
    logFirstRemoval: function(source, contextPath, propertyName, categoryOrNil) {
 
        var timestamp = Date.now();
        this.storeArray([null, contextPath, propertyName, timestamp, categoryOrNil, null, source, null, null], timestamp);
    },


    logRemoval: function(source, contextPath, propertyName, categoryOrNil, previousChangeStamp) {
 
        //Get the previous change
        var allChangesStorageRoot = ChangeSet.userStorageRoot + ":allChanges:";
        var firstTimestamp = JSON.parse(localStorage.getItem(allChangesStorageRoot + previousChangeStamp))[3];
        var timestamp = Date.now();
        this.storeArray([null, contextPath, propertyName, firstTimestamp, categoryOrNil, previousChangeStamp], timestamp);
        this.removeTimestamp(previousChangeStamp);

        var firstDataString = localStorage.getItem(allChangesStorageRoot + firstTimestamp);
        var firstChangeRecord = ChangeSet.changeDataFromStorage(JSON.parse(firstDataString));
        if(firstChangeRecord.type == "added")
            //this is not really a removal, we are only removing something temporarily added
            this.removeTimestamp(timestamp);
    },


    storeArray: function(array, timestamp) {

        var storageRoot = ChangeSet.userStorageRoot;
    
        //Step 1: store the actual change
        localStorage.setItem(storageRoot + ":allChanges:" + timestamp, JSON.stringify(array));

        //Step 2: mark the change in the "all storage keys"
        if(!ChangeSet.allTimestampsString)
            ChangeSet.allTimestampsString = "" + timestamp;
        else
            ChangeSet.allTimestampsString += "," + timestamp;
        localStorage.setItem(storageRoot + ":timestamps", ChangeSet.allTimestampsString);
debugger;
        //Step 3: mark the change in the changeset storage so that we can automatically reload
        this.timestamps.push(timestamp);
        localStorage.setItem(storageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
    },
    storeName: function() {
        
        if(!ChangeSet.userStorageRoot) {
            var username = $world.getUserName();
            var storageRoot = "LivelyChanges:" + $world.savedWorldAsURL;
            var authorsString = localStorage.getItem(storageRoot + ":authors");
            if(!authorsString)
                authorsString = "[]";
            var authors = JSON.parse(authorsString);
            if(!authors.include(username)) {
                authorsString = JSON.stringify(authors.push(username))
                localStorage.setItem(storageRoot + ":authors", authorsString);
            }
    		ChangeSet.userStorageRoot = storageRoot + ":author:" + username;
        }
        var changesetNamesString = localStorage.getItem(ChangeSet.userStorageRoot + ":changesetNames");
        if(!changesetNamesString)
            changesetNamesString = "[]";
        var changesetNames = JSON.parse(changesetNamesString);
        if(changesetNames.include(this.name))
            throw new Error("Changeset name "+ this.name+" already stored");
        changesetNames.push(this.name);
        localStorage.setItem(ChangeSet.userStorageRoot + ":changesetNames", JSON.stringify(changesetNames));
    },
	
    hydrate: function() {
        var storageRoot = ChangeSet.userStorageRoot;
        var changesetTimestampsString = localStorage.getItem(storageRoot + ":changesetTimestamps:" + this.name);
        if(!changesetTimestampsString)
            //empty changeset
            return;
        this.errors = [];
        this.timestamps = JSON.parse(changesetTimestampsString);
        var allChangesStorageRoot = storageRoot + ":allChanges:";
        var self = this;
        this.timestamps.each(function(t){
            var dataString = localStorage.getItem(allChangesStorageRoot + t);
            var changeRecord = ChangeSet.changeDataFromStorage(JSON.parse(dataString));
            var propertyName = changeRecord.propertyName;
            if(propertyName) {
                //not a doIt
                var firstChangeStamp = changeRecord.firstChangeStamp;
                if(!firstChangeStamp) {
                    //this is a first change representing an addition, nothing to check
                } else {
                    var firstDataString = localStorage.getItem(allChangesStorageRoot + firstChangeStamp);
                    var firstChangeRecord = ChangeSet.changeDataFromStorage(JSON.parse(firstDataString));
                    if(!firstChangeRecord.firstChangeStamp) {
                        //the first change is representing an addition, nothing to check, except...
                        if(changeRecord.type == "removed")
                            //added then removed
                            return;
        				changeRecord.type = "added";
                    } else {
                        //sanity check
                        if(firstChangeStamp != firstChangeRecord.firstChangeStamp) {
                            self.errors.push("Inconsistent data: first record's firstChangeStamp does not match the current record's firstChangeStamp");
                            return;
                        }
                        if(t != firstChangeStamp) {
                            if(changeRecord.contextPath != firstChangeRecord.originalContextPath)
                            //moved
                                changeRecord.originalContextPath = firstChangeRecord.originalContextPath;
                            if(changeRecord.propertyName != firstChangeRecord.originalPropertyName)
                            //renamed
                                changeRecord.originalPropertyName = firstChangeRecord.originalPropertyName;
                            if(changeRecord.category != firstChangeRecord.originalCategory)
                            //changed category
                               changeRecord.originalCategory = firstChangeRecord.originalCategory;
                            if(changeRecord.source != firstChangeRecord.originalSource)
                            //changed source
                               changeRecord.originalSource = firstChangeRecord.originalSource;
                        }
                    }
                }
            }
            self.changeRecords.push(changeRecord);
        });
    }


});

}) // end of module
