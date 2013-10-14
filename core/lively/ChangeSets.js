module('lively.ChangeSets').requires('lively.Traits').toRun(function() {

Object.extend(Global, {

    addOwnPropertyIfAbsent: function addOwnPropertyIfAbsent(target, name, value) {
        if(!Object.getOwnPropertyDescriptor(target, name))
            Object.defineProperty(target, name, {value: value});
    }

});

(function setupBaseExtensionsForCategories() {

    addOwnPropertyIfAbsent(Object.prototype, 'lvAddMethodToExistingCategory', function(method, methodName, category){});
    addOwnPropertyIfAbsent(Object.prototype, 'lvRemoveMethodFromExistingCategory', function(methodName, category){});
    addOwnPropertyIfAbsent(Object.prototype, 'lvAddCategory', function(category){});
    addOwnPropertyIfAbsent(Object.prototype, 'lvCategoriesWithMethodNamesDo', function(func){});
    
    addOwnPropertyIfAbsent(Function.prototype, 'lvAddMethodToExistingCategory', function(method, methodName, category){
            if(!this.superclass) return;
            if(this.categories[category].include(methodName)) return;
            this.categories[category].push(methodName);
        });
    addOwnPropertyIfAbsent(Function.prototype, 'lvRemoveMethodFromExistingCategory', function(methodName, category){
            if(!this.superclass) return;
            if(!this.categories[category].include(methodName)) return;
            this.categories[category].remove(methodName);
            if(this.categories[category].length == 0)
                delete this.categories[category];
        });
    addOwnPropertyIfAbsent(Function.prototype, 'lvAddCategory', function(category){
            if(!this.superclass) return;
            if(this.categories[category]) return;
            this.categories[category] = [];
        });
    addOwnPropertyIfAbsent(Function.prototype, 'lvCategoriesWithMethodNamesDo', function(func){
            if(!this.superclass) return;
            var cat = this.categories;
            Object.keys(cat).each(function(category){
                func(category, cat[category]);
            });
        });
    
    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvAddMethodToExistingCategory', function(method, methodName, category){
            if(this.categories[category][methodName]) return;
            this.categories[category][methodName] = method;
        });
    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvRemoveMethodFromExistingCategory', function(methodName, category){
            if(!this.categories[category][methodName]) return;
            delete this.categories[category][methodName];
            if(Object.keys(this.categories[category]).length == 0)
                delete this.categories[category];
        });
    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvAddCategory', function(category){
            if(this.categories[category]) return;
            this.categories[category] = {};
        });
    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvCategoriesWithMethodNamesDo', function(func){
            var cat = this.categories;
            Object.keys(cat).each(function(category){
                func(category, Object.keys(cat[category]));
            });
        });
})();

(function setupBaseExtensionsForFunctionNames() {

    addOwnPropertyIfAbsent(Function.prototype, 'lvIsConstructor', function(){
            if(this.superclass) 
                return true;
            return this.prototype && this.prototype.lvOwnFunctionNames().length > 0});

    addOwnPropertyIfAbsent(Object.prototype, 'lvOwnFunctionNames', function(){
            var names = [];
            Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
                var object;
                if (!obj.__lookupGetter__(name) && 
                    (object = obj[name]) instanceof Function &&
                    !lively.Class.isClass(object))
                        names.push(name)});
            return names});
    
    addOwnPropertyIfAbsent(Global, 'lvOwnFunctionNames', function(){
            var names = [];
            Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
                var first, object;
                if (!obj.__lookupGetter__(name) && 
                    (object = obj[name]) instanceof Function &&
                    !(object.lvIsConstructor() && (!object.name || object.name == name) &&
                    (first = name.charAt(0)) == first.toUpperCase() && first != first.toLowerCase()))
                        names.push(name)});
            return names});
    
    addOwnPropertyIfAbsent(Global, 'nonClassConstructors', function(){
            var constructors = [];
            Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
                var first, object;
                if (!obj.__lookupGetter__(name) &&
                    (object = obj[name]) instanceof Function &&
                    object.lvIsConstructor() && (!object.name || object.name == name) &&
                    (first = name.charAt(0)) == first.toUpperCase() && first != first.toLowerCase() &&
                    !lively.Class.isClass(object)) {
                        constructors.push(object);
                        if(!object.name)
                            object.lvDisplayName = name}});
            return constructors});
    
    addOwnPropertyIfAbsent(lively.Module.prototype, 'lvOwnFunctionNames', function(){
            var names = [];
            Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
                if (!obj.__lookupGetter__(name) && 
                    name != 'requires' &&
                    (object = obj[name]) instanceof Function &&
                    !lively.Class.isClass(object))
                        names.push(name)});
            return names});
})();

(function setupBaseExtensionsForContextPath() {

    addOwnPropertyIfAbsent(Object.prototype, 'lvContextPath', function(){
            if(this.constructor instanceof Function && this.constructor.prototype === this) {
                var parentPath = this.constructor.lvContextPath();
                if(parentPath)
                    return parentPath + ".prototype";
                return null;
            }
            var sampleContainedFunction;
            for (var name in this)
                if (!this.__lookupGetter__(name) && this.hasOwnProperty(name) && (sampleContainedFunction = this[name]) instanceof Function)
                    break;
            if(sampleContainedFunction && sampleContainedFunction.belongsToTrait && sampleContainedFunction.belongsToTrait.def === this)
                return sampleContainedFunction.belongsToTrait.lvContextPath() + ".def";
            return null;
        });

    ["Global", 
            "Arrays", "Grid", "Interval", "lively.ArrayProjection", "lively.Grouping",
            "Functions", "Numbers", "Objects", "Properties", "Strings", "lively.LocalStorage", "lively.Worker"].each(function(e){
                addOwnPropertyIfAbsent(lively.lookup(e), 'lvContextPath', function(){return e});
            });

    addOwnPropertyIfAbsent(Function.prototype, 'lvContextPath', function(){
            if(this.superclass && lively.lookup(this.type || this.name) === this)
                return this.type || this.name;
            if(this.belongsToTrait)
                return this.belongsToTrait.lvContextPath() + ".def." + this.displayName;
            if(this.declaredClass && this.methodName)
                return this.declaredClass + "." + this.methodName;
            if(Global[this.name] === this)
                return this.name;
            return null;
        });

    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvContextPath', function(){
            return "RealTrait.prototype.traitRegistry." + this.name;
        });

    addOwnPropertyIfAbsent(lively.Module.prototype, 'lvContextPath', function(){
            return this.namespaceIdentifier;
        });
})();


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

	},
    copy: function() {
        return new ChangeSet(this.name, true);
    }

});


Object.extend(ChangeSet, {


    
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
        return this.changeSetNames().detect(function(e) {
            return e == aName
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
    

    
    CurrentChangeSet: null

});

Object.extend(ChangeSet, {
	loadAndcheckVsSystem: function() {

		this.userStorageRoot = "LivelyChanges:" + $world.savedWorldAsURL + ":author:" + $world.getUserName();
        var defaultChangeSet = this.defaultChangeSetName();
        this.changeSetNames().each(function(e){
            var changeSet = new ChangeSet(e, true);
            if(e == defaultChangeSet)
                ChangeSet.newChanges(changeSet);
            if(!changeSet.hasErrors())
                changeSet.applyChanges();
            if(changeSet.hasErrors())
                $world.openInspectorFor(changeSet);
        })
	},
    changeSetNames: function() {
        var namesString = localStorage.getItem(this.userStorageRoot + ":changesetNames");
        if(namesString)
            return JSON.parse(namesString);
        else
            return [];
    },

    defaultChangeSetName: function() {
        return localStorage.getItem(this.userStorageRoot + ":defaultChangeSet");
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
        
        this.current().storeArray(storageArray, Date.now());
    },


    
    


    logChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp) {

        return this.current().logChange(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp);
    },

    logFirstChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame) {
debugger; 
        return this.current().logFirstChange(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame);
    },
    logFirstRemoval: function(source, contextPath, propertyName, categoryOrNil) {
 
        return this.current().logFirstRemoval(source, contextPath, propertyName, categoryOrNil);
    },


    logRemoval: function(source, contextPath, propertyName, categoryOrNil, previousChangeStamp) {
 
        return this.current().logRemoval(source, contextPath, propertyName, categoryOrNil, previousChangeStamp);
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
        if(allTimestampsString) {
            JSON.parse("["+ allTimestampsString +"]").each(function(t) {
                localStorage.removeItem(storageRoot + ":allChanges:" + t);
            });
            localStorage.removeItem(storageRoot + ":timestamps");
        }

        localStorage.setItem(storageRoot + ":defaultChangeSet", "Unnamed")
    },
    hydrateChange: function(t) {
        var changeRecord = this.getChangeRecord(t);
        changeRecord.errors = [];
        var propertyName = changeRecord.propertyName;
        if(propertyName) {
            //not a doIt
            var firstChangeStamp = changeRecord.firstChangeStamp;
            if(!firstChangeStamp) {
                //this is a first change representing an addition, nothing to check
            } else {
                var firstChangeRecord = this.getChangeRecord(firstChangeStamp);
debugger;
                if(!firstChangeRecord.firstChangeStamp) {
                    //the first change is representing an addition, nothing to check, except...
                    if(changeRecord.type == "removed")
                        //added then removed
                        return;
    				changeRecord.type = "added";
                } else {
                    //sanity check
                    if(firstChangeStamp != firstChangeRecord.firstChangeStamp) {
                        changeRecord.errors.push("Inconsistent data: first record's firstChangeStamp does not match the current record's firstChangeStamp");
                        return;
                    }
                    if(t != firstChangeStamp) {
                        changeRecord.originalContextPath = firstChangeRecord.originalContextPath;
                        changeRecord.originalPropertyName = firstChangeRecord.originalPropertyName;
                        changeRecord.originalCategory = firstChangeRecord.originalCategory;
                        changeRecord.originalSource = firstChangeRecord.originalSource;
                    }
                }
            }
        }
        return changeRecord;
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

    	var entry = {contextPath: array[1]}, 
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

                    entry.originalCategory = previous || entry.category;
                    if(entry.originalCategory !== entry.category) {
                        if(entry.category)
                            entry.type = "changed category";
                        else if(source)
                            throw new Error("Should not happen - we do not remove from category")
                    } else {
                        entry.originalSource = array[6] || source;
                        if(entry.originalSource !== source) {
                            if(source)
                                entry.type = "changed source";
                            else
                                entry.type = "removed"
                        } else {
                            entry.originalContextPath = array[7] || entry.contextPath;
                            if(entry.originalContextPath !== entry.contextPath) {
                                if(entry.contextPath)
                                    entry.type = "moved";
                                else if(source)
                                    throw new Error("Should not happen")
                            } else {
                                entry.originalPropertyName = array[8] || propertyName;
                                if(entry.originalPropertyName !== propertyName) {
                                    if(propertyName)
                                        entry.type = "changed category";
                                    else if(source)
                                        throw new Error("Should not happen")
                                } else
                                    throw new Error("Should not happen - if everything is the same, it is not a change")
                            }
                        }
                    }
				}
				if(source)
					entry.source = source;
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
    getChangeRecord: function(t) {
        var dataString = localStorage.getItem(this.userStorageRoot + ":allChanges:" + t);
        if(!dataString)
            debugger;
        return this.changeDataFromStorage(JSON.parse(dataString));
    },



    logAddition: function(contextPath, propertyName, optCategory) {

        return this.current().logAddition(contextPath, propertyName, optCategory);
    }

    
});
    
ChangeSet.addMethods(
    "actions", {

    applyChanges: function() {
        if(this.timestamps.length != this.changeRecords.length)
            throw new Error("inconsistent changeset state");
        if(this.changeRecords.length == 0) {
            alertOK("No changes to apply");
            return;
        }
            
        var self = this;
        this.changeRecords.each(function(e){
            if(e.originalContextPath) {
                try {
                    var originalContext = eval(e.originalContextPath);
                } catch(ex) {
                    e.errors.push("Failed to check changeset "+self.name+". Could not resolve the original context "+e.originalContextPath+"\n"+ex.name+": "+ex.message);
                    return;
                }
                if(e.originalPropertyName && !originalContext[e.originalPropertyName]) {debugger;
                    e.errors.push("Failed to load changeset "+self.name+". The original context "+e.originalContextPath+"\n does not have the original property name: "+e.originalPropertyName+" anymore");
                    return;
                }
                if(e.originalPropertyName && e.originalSource != originalContext[e.originalPropertyName].toString()) {
                    e.errors.push("Failed to load changeset "+self.name+". "+e.originalContextPath+"."+e.originalPropertyName+"\n does not have the same source anymore");
                    return;
                }
            }
            
            try {
                var context = eval(e.contextPath);
            } catch(ex) {
                e.errors.push("Failed evaluating context path: " + e.contextPath + "\n"+ ex.name + ": " + ex.message);
                return;
            }
            if(!e.type)
                e.type = "changed";
            switch(e.type.valueOf()) {
                case "doIt":
                    try {
                        (function() { return eval(e.source) }).call(context);
                    } catch(e) {
                        e.errors.push("Failed evaluating doit:\n" + e.source + "\in context " + e.contextPath + "\n"+ e.name + ": " + e.message);
                        return;
                    }
                    return;
                case "removed":
                    if(e.propertyName && !context[e.propertyName]) {
                        e.errors.push("Failed to remove property in changeset "+self.name+". The context "+e.contextPath+"\n does not have the property name: "+e.propertyName);
                        return;
                    }
                    delete context[e.propertyName];
                    return;
                case "added":
                    if(e.propertyName && context[e.propertyName]) {
                        e.errors.push("Failed to add property in changeset "+self.name+". The context "+e.contextPath+"\n already has the property name: "+e.propertyName);
                        return;
                    }
                    (function() { return eval("this."+e.propertyName+" = "+ e.source) }).call(context);
                    var func = function() {};
                    context[changeRecord.propertyName] = func;
                    func.timestamp = self.timestamps[i];
                    func.kindOfChange = "added";
                    func.user = $world.getUserName(); 
                    return;
                case "changed source":
                    if(e.propertyName && !context[e.propertyName]) {
                        e.errors.push("Failed to change property in changeset "+self.name+". The context "+e.contextPath+"\n does not have the property name: "+e.propertyName);
                        return;
                    }
                    if(e.source != context[e.propertyName].toString()) {debugger;
                        (function() { return eval("this."+e.propertyName+" = "+ e.source) }).call(context);
                        var func = context[e.propertyName];
                        func.timestamp = self.timestamps[i];
                        func.user = $world.getUserName(); 
                        func.kindOfChange = "changed source";
                    }
                    return;
                default:
                    throw new Error("Applying "+e.type+ " not implemented yet")
            }
        })
        
    },

    hasErrors: function() {
        return this.changeRecords.detect(function(e){e.errors.length > 0})
    },



    logAddition: function(contextPath, propertyName, optCategory) {


        //make sure this is really a new addition (within the current changeset)
        var found = false;
        this.timestamps.each(function(t){
            var changeRecord = ChangeSet.getChangeRecord(t);
            if(changeRecord.contextPath == contextPath) {
                if(changeRecord.propertyName == propertyName) {
                    if(changeRecord.type != "removed")
                        throw new Error("should not happen");
                    //it is not really a new add
                    this.removeTimestamp(t);
                    var firstChangeRecord = ChangeSet.getChangeRecord(changeRecord.firstChangeStamp);
                    if(!firstChangeRecord.firstChangeStamp)
                        //but originally it was still a new add, so it does not matter
                        return;
                    found = true;
                    return this.logFirstChange("function(){}", contextPath, propertyName, optCategory,
                        firstChangeRecord.originalCategory, firstChangeRecord.originalSource, firstChangeRecord.originalContextPath, firstChangeRecord.originalPropertyName);
                }
            }
        })
        if(found)
            return;
        var timestamp = Date.now();
        this.storeArray([null, contextPath, propertyName, null, optCategory], timestamp);
        return timestamp
    },
    removeTimestamp: function(t) {

        this.timestamps.remove(t);
        localStorage.setItem(ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
    },

    logChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp) {

        //Get the previous change
        var firstTimestamp = JSON.parse(localStorage.getItem(ChangeSet.userStorageRoot + ":allChanges:" + previousChangeStamp))[3];
        var timestamp = Date.now();
        this.storeArray([sourceOrNil, contextPath, propertyName, firstTimestamp, categoryOrNil, previousChangeStamp], timestamp);
        this.removeTimestamp(previousChangeStamp);

        var firstChangeRecord = ChangeSet.getChangeRecord(firstTimestamp);
        if( firstChangeRecord.originalSource == sourceOrNil &&
            firstChangeRecord.originalContextPath == contextPath &&
            firstChangeRecord.originalPropertyName == propertyName &&
            firstChangeRecord.originalCategory == categoryOrNil) {
                //this is not really a change, we are reverting to the original
                this.removeTimestamp(timestamp);
                return null;
            }
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
        var firstTimestamp = JSON.parse(localStorage.getItem(ChangeSet.userStorageRoot + ":allChanges:" + previousChangeStamp))[3];
        var timestamp = Date.now();
        this.storeArray([null, contextPath, propertyName, firstTimestamp, categoryOrNil, previousChangeStamp], timestamp);
        this.removeTimestamp(previousChangeStamp);

        var firstChangeRecord = ChangeSet.getChangeRecord(firstTimestamp);
        if(firstChangeRecord.type == "added")
            //this is not really a removal, we are only removing something temporarily added
            this.removeTimestamp(timestamp);
    },


    storeArray: function(array, timestamp) {

        var storageRoot = ChangeSet.userStorageRoot;
    
        //Step 1: store the actual change
        localStorage.setItem(storageRoot + ":allChanges:" + timestamp, JSON.stringify(array));

        //Step 2: mark the change in the "all storage keys"
        var allTimestampsString = localStorage.getItem(storageRoot + ":timestamps");
        if(!allTimestampsString)
            allTimestampsString = "" + timestamp;
        else
            allTimestampsString += "," + timestamp;
        localStorage.setItem(storageRoot + ":timestamps", allTimestampsString);
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
        var changesetNames = ChangeSet.changeSetNames();
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
        this.timestamps = JSON.parse(changesetTimestampsString);
        var self = this;
        this.timestamps.each(function(t){
            self.changeRecords.push(ChangeSet.hydrateChange(t));
        });
    },


    newMethod: function() {
        // enter comment here
    }



});

lively.morphic.Panel.subclass('ChangesBrowser',

// new ChangesBrowser(pt(1024, 384)).openIn($world, 'Changes Browser')

'default category', {
    buildView: function buildView() {  // this.buildView()
        this.withAllSubmorphsDo(function(m) {disconnectAll(m)});
        this.removeAllMorphs();
    
    	this.createAndArrangePanesFrom([
    		['changeSetPane', this.newListPane, new Rectangle(0, 0, 0.333, 0.25), this.changeSetPaneContents()],
    		['changePane', this.newListPane, new Rectangle(0.333, 0, 0.667, 0.25)],

    		['label1', this.newStaticTextPane, new Rectangle(0, 0.25, 0.333, 0.05), "Selected Change"],
    		['label2', this.newStaticTextPane, new Rectangle(0.333, 0.25, 0.334, 0.05), "Original Source"],
    		['label3', this.newStaticTextPane, new Rectangle(0.667, 0.25, 0.333, 0.05), "System Source"],

    		['changeContext', this.newStaticTextPane, new Rectangle(0, 0.3, 0.333, 0.05)],
    		['originalContext', this.newStaticTextPane, new Rectangle(0.333, 0.3, 0.334, 0.05)],
    		['systemContext', this.newStaticTextPane, new Rectangle(0.667, 0.3, 0.333, 0.05)],

    		['changeCategory', this.newStaticTextPane, new Rectangle(0, 0.35, 0.333, 0.05)],
    		['originalCategory', this.newStaticTextPane, new Rectangle(0.333, 0.35, 0.334, 0.05)],
    		['systemCategory', this.newStaticTextPane, new Rectangle(0.667, 0.35, 0.333, 0.05)],

    		['changeName', this.newStaticTextPane, new Rectangle(0, 0.4, 0.333, 0.05)],
    		['originalName', this.newStaticTextPane, new Rectangle(0.333, 0.4, 0.334, 0.05)],
    		['systemName', this.newStaticTextPane, new Rectangle(0.667, 0.4, 0.333, 0.05)],

    		['changeCodePane', this.newCodePane, new Rectangle(0, 0.45, 0.333, 0.55)],
    		['originalCodePane', this.newReadOnlyCodePane, new Rectangle(0.333, 0.45, 0.334, 0.55)],
    		['systemCodePane', this.newReadOnlyCodePane, new Rectangle(0.667, 0.45, 0.333, 0.55)],
    	]);
    	
    	this.label1.applyStyle({fontWeight: 'bold'});
    	this.label2.applyStyle({fontWeight: 'bold'});
    	this.label3.applyStyle({fontWeight: 'bold'});
    	
    	var self = this;
    	this.changePane.renderFunction = function(e) {
    	    var prop = "";
    	    if(self.changeSet) {
        	    var index = self.changeSet.timestamps.indexOf(e);
        	    var record = self.changeSet.changeRecords[index];
        	    if(record.type != "doIt")
        	        prop = " '" + record.propertyName + "'";
        	    return new Date(e).toUTCString() + ' ' + (record.type || "modified") + 
        	                    prop +" in " + record.contextPath;
    	    } else 
    	        return new Date(e).toUTCString();
    	};

        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        connect(this.changeSetPane, "selection", this, "setChangeSet", {});
        connect(this.changeSetPane, "getMenu", this, "getChangeSetMenu", {});
        connect(this.changePane, "selection", this, "setChange", {});
        connect(this.changePane, "getMenu", this, "getChangeMenu", {});
    
    	this.changeSetPane.setSelection(ChangeSet.defaultChangeSetName());
    },
    getChangeSetMenu: function() {
        var self = this;
        debugger;
        var items = [
                ['remove all changes from persistent storage', function() {self.removeAllChanges()}]
            ];
        var selected = this.changeSetPane.selection;
        if(!selected)
            return items;
        items.push(['refresh', function() {self.setChangeSet(selected)}]);
        if(this.changeSet)
            items.push(['publish', function() {self.publish()}]);
        return items;
    },
    publish: function() {
        var browser = new SharedChangeSetBrowser(pt(1024, 384));
        var title = 'Changeset '+ this.changeSet.name + ' from ' + $world.getUserName();
        var window = browser.openIn($world, title);
        browser.setChangeSetContents(this.changeSet.name);
        debugger;
        window.name = title;
        window.getPartsBinMetaInfo().addRequiredModule('lively.ChangeSets');
        window.copyToPartsBinWithUserRequest();
    },


    setChange: function(t) {
        if(!t) {
            this.originalCodePane.setTextString('');
            this.originalContext.setTextString('');
            this.originalCategory.setTextString('');
            this.originalName.setTextString('');
            this.systemCodePane.setTextString('');
            this.systemContext.setTextString('');
            this.systemCategory.setTextString('');
            this.systemName.setTextString('');
            this.changeCategory.setTextString('');
            this.changeName.setTextString('');
            this.changeContext.setTextString('');
            this.changeCodePane.setTextString('');
            return;
        }
        
        var changeRecord = ChangeSet.hydrateChange(t);
        if(changeRecord.type != "doIt") {
            this.originalCodePane.setTextString(changeRecord.originalSource);
            this.originalContext.setTextString(changeRecord.originalContextPath);
            this.originalCategory.setTextString(changeRecord.originalCategory);
            this.originalName.setTextString(changeRecord.originalPropertyName);
            var system, contextPath;
            try {
                system = eval(changeRecord.contextPath);
                contextPath = changeRecord.contextPath;
            } catch(e){}
            if(system === undefined)
                try {
                    system = eval(changeRecord.originalContextPath);
                    contextPath = changeRecord.originalContextPath;
                } catch(e) {}
            if(system === undefined) {
                this.systemCodePane.setTextString("//Neither the current context: "+ changeRecord.contextPath + "\n//nor the original one: "+ changeRecord.originalContextPath+"//seem to be loaded");
                this.systemContext.setTextString('');
                this.systemCategory.setTextString('');
                this.systemName.setTextString('');
            } else {
                var name;
                if(system[changeRecord.propertyName] === undefined && changeRecord.originalPropertyName && changeRecord.originalPropertyName != changeRecord.propertyName)
                    name = changeRecord.originalPropertyName;
                else
                    name = changeRecord.propertyName;
                this.systemContext.setTextString(contextPath);
                this.systemName.setTextString(name);
                this.systemCodePane.setTextString(system[name]);
                var index = contextPath.lastIndexOf('.');
                if(index != -1) {
                    var categories = eval(contextPath.substring(0, index + 1) + 'categories');
                    if(categories) {
                        var category = 'default category';
                        Object.keys(categories).each(function(e){
                            var cat = categories[e];
                            if(Object.isArray(cat)) {
                                if(cat.include(name)) {
                                    category = e;
                                    return;
                                }
                            } else if(cat[name]) {
                                category = e;
                                return;
                            }
                        });
                        if(category != 'default category')
                            this.systemCategory.setTextString(category);
                    }
                }
            }
            this.changeCategory.setTextString(changeRecord.category);
            this.changeName.setTextString(changeRecord.propertyName);
        }
        this.changeContext.setTextString(changeRecord.contextPath);
        this.changeCodePane.setTextString(changeRecord.source);
    },

    setChangeSet: function(name) {
        var storageRoot = ChangeSet.userStorageRoot;
        if(name == "-- ALL CHANGES --") {
            var allTimestampsString = localStorage.getItem(storageRoot + ":timestamps");
            if(!allTimestampsString)
                //no changes recorded yet
                return;
            this.changeSet = null;
            this.changePane.setList(JSON.parse("["+ allTimestampsString +"]"));
        } else {
            this.changeSet = new ChangeSet(name, true);
            this.changePane.setList(this.changeSet.timestamps);
        }
    },
    removeAllChanges: function() {
        $world.confirm('Are you sure you want to permanently remove all changes?', function(answer){
            answer && ChangeSet.removeAllFromPersistentStorage();
        });        
    },











    changeSetPaneContents: function() {
        return ["-- ALL CHANGES --"].concat(ChangeSet.changeSetNames());
    },


});

lively.morphic.Panel.subclass('SharedChangeSetBrowser',
'default category', {
    buildView: function buildView() {  // this.buildView()
        this.withAllSubmorphsDo(function(m) {disconnectAll(m)});
        this.removeAllMorphs();

    	this.createAndArrangePanesFrom([
    		['changePane', this.newListPane, new Rectangle(0, 0, 1, 0.25)],
    		
    		['label1', this.newStaticTextPane, new Rectangle(0, 0.25, 0.333, 0.05), "Selected Change"],
    		['label2', this.newStaticTextPane, new Rectangle(0.333, 0.25, 0.334, 0.05), "Original Source"],
    		['label3', this.newStaticTextPane, new Rectangle(0.667, 0.25, 0.333, 0.05), "System Source"],

    		['changeContext', this.newStaticTextPane, new Rectangle(0, 0.3, 0.333, 0.05)],
    		['originalContext', this.newStaticTextPane, new Rectangle(0.333, 0.3, 0.334, 0.05)],
    		['systemContext', this.newStaticTextPane, new Rectangle(0.667, 0.3, 0.333, 0.05)],

    		['changeCategory', this.newStaticTextPane, new Rectangle(0, 0.35, 0.333, 0.05)],
    		['originalCategory', this.newStaticTextPane, new Rectangle(0.333, 0.35, 0.334, 0.05)],
    		['systemCategory', this.newStaticTextPane, new Rectangle(0.667, 0.35, 0.333, 0.05)],

    		['changeName', this.newStaticTextPane, new Rectangle(0, 0.4, 0.333, 0.05)],
    		['originalName', this.newStaticTextPane, new Rectangle(0.333, 0.4, 0.334, 0.05)],
    		['systemName', this.newStaticTextPane, new Rectangle(0.667, 0.4, 0.333, 0.05)],

    		['changeCodePane', this.newCodePane, new Rectangle(0, 0.45, 0.333, 0.55)],
    		['originalCodePane', this.newReadOnlyCodePane, new Rectangle(0.333, 0.45, 0.334, 0.55)],
    		['systemCodePane', this.newReadOnlyCodePane, new Rectangle(0.667, 0.45, 0.333, 0.55)],
    	]);
    	
    	this.label1.applyStyle({fontWeight: 'bold'});
    	this.label2.applyStyle({fontWeight: 'bold'});
    	this.label3.applyStyle({fontWeight: 'bold'});
    	
    	this.changePane.renderFunction = function(e) {
    	    var prop = "";
	        if(e.type != "doIt")
    	        prop = " '" + e.propertyName + "'";
	        return (e.type || "modified") + prop + " in " + e.contextPath;
    	};

        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        connect(this.changePane, "selection", this, "setChange", {});
        connect(this.changePane, "getMenu", this, "getChangeMenu", {});
    
    },
    getChangeMenu: function() {
        var self = this;
        var selected = this.changePane.selection;
        var items = [
                ['apply all', function() {
                    self.applyAllChanges();
                    if(selected)
                        self.setChange(selected);
                    }]
            ];
        if(!selected)
            return items;
        items.push(['apply selected', function() {
                        self.applyChange(selected);
                        self.setChange(selected)}]);
        return items;
    },
    applyChange: function(changeRecord) {

        if(changeRecord.originalContextPath) {
            try {
                var originalContext = eval(changeRecord.originalContextPath);
            } catch(ex) {
                changeRecord.errors.push("Could not resolve the original context "+changeRecord.originalContextPath+"\n"+ex.name+": "+ex.message);
                return;
            }
            if(changeRecord.originalPropertyName && !originalContext[changeRecord.originalPropertyName]) {debugger;
                changeRecord.errors.push("Failed to apply change. The original context "+changeRecord.originalContextPath+"\n does not have the original property name: "+changeRecord.originalPropertyName+" anymore");
                return;
            }
            if(changeRecord.originalPropertyName && changeRecord.originalSource != originalContext[changeRecord.originalPropertyName].toString()) {
                changeRecord.errors.push("Failed to apply change. "+changeRecord.originalContextPath+"."+changeRecord.originalPropertyName+"\n does not have the same source anymore");
                return;
            }
        }
        
        try {
            var context = eval(changeRecord.contextPath);
        } catch(ex) {
            changeRecord.errors.push("Failed evaluating context path: " + changeRecord.contextPath + "\n"+ ex.name + ": " + ex.message);
            return;
        }
        if(!changeRecord.type)
            changeRecord.type = "changed";
        switch(changeRecord.type.valueOf()) {
            case "doIt":
                try {
                    (function() { return eval(changeRecord.source) }).call(context);
                } catch(e) {
                    changeRecord.errors.push("Failed evaluating doit:\n" + changeRecord.source + "\in context " + changeRecord.contextPath + "\n"+ changeRecord.name + ": " + changeRecord.message);
                    return;
                }
                ChangeSet.logDoit(changeRecord.source, changeRecord.contextPath);
                return;
            case "removed":
                if(changeRecord.propertyName && !context[changeRecord.propertyName]) {
                    changeRecord.errors.push("Failed to remove property. The context "+changeRecord.contextPath+"\n does not have the property name: "+changeRecord.propertyName);
                    return;
                }
                var func = context[changeRecord.propertyName];
                delete context[changeRecord.propertyName];
                if(func.user && func.timestamp)
                    //modified
                    ChangeSet.logRemoval(func.toString(), changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, func.timestamp);
                else
                    ChangeSet.logFirstRemoval(func.toString(), changeRecord.contextPath, changeRecord.propertyName, changeRecord.category);
                return;
            case "added":
                if(changeRecord.propertyName && context[changeRecord.propertyName]) {
                    changeRecord.errors.push("Failed to add property. The context "+changeRecord.contextPath+"\n already has the property name: "+changeRecord.propertyName);
                    return;
                }
                var func = function() {};
                context[changeRecord.propertyName] = func;
                func.timestamp = ChangeSet.logAddition(changeRecord.contextPath, changeRecord.propertyName, changeRecord.category);
                func.kindOfChange = "added";
                func.user = $world.getUserName(); 
                return;
            case "changed source":
                if(changeRecord.propertyName && !context[changeRecord.propertyName]) {
                    changeRecord.errors.push("Failed to change property. The context "+changeRecord.contextPath+"\n does not have the property name: "+changeRecord.propertyName);
                    return;
                }
                var oldFunc = context[changeRecord.propertyName];
                if(changeRecord.source != oldFunc.toString()) {debugger;
                    (function() { return eval("this."+changeRecord.propertyName+" = "+ changeRecord.source) }).call(context);
                    var func = context[changeRecord.propertyName];
                    if(oldFunc.user && oldFunc.timestamp)
                        //already modified
                        func.timestamp = ChangeSet.logChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, oldFunc.timestamp);
                    else
                        //first change
                        func.timestamp = ChangeSet.logFirstChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, null, oldFunc.toString(), null, null);
                    if(func.timestamp) {
                        func.user = $world.getUserName();
                        func.kindOfChange = "changed source";
                    }
                }
                return;
            default:
                throw new Error("Applying "+changeRecord.type+ " not implemented yet");
        }
    },
    applyAllChanges: function() {
        var self = this;
        this.changePane.getList().each(function(e){
            self.applyChange(e);
        })
    },



    setChange: function(changeRecord) {
        if(changeRecord.type != "doIt") {
            this.originalCodePane.setTextString(changeRecord.originalSource);
            this.originalContext.setTextString(changeRecord.originalContextPath);
            this.originalCategory.setTextString(changeRecord.originalCategory);
            this.originalName.setTextString(changeRecord.originalPropertyName);
            var system, contextPath;
            try {
                system = eval(changeRecord.contextPath);
                contextPath = changeRecord.contextPath;
            } catch(e){}
            if(system === undefined)
                try {
                    system = eval(changeRecord.originalContextPath);
                    contextPath = changeRecord.originalContextPath;
                } catch(e) {}
            if(system === undefined) {
                this.systemCodePane.setTextString("//Neither the current context: "+ changeRecord.contextPath + "\n//nor the original one: "+ changeRecord.originalContextPath+"//seem to be loaded");
                this.systemContext.setTextString('');
                this.systemCategory.setTextString('');
                this.systemName.setTextString('');
            } else {
                var name;
                if(system[changeRecord.propertyName] === undefined && changeRecord.originalPropertyName && changeRecord.originalPropertyName != changeRecord.propertyName)
                    name = changeRecord.originalPropertyName;
                else
                    name = changeRecord.propertyName;
                this.systemContext.setTextString(contextPath);
                this.systemName.setTextString(name);
                this.systemCodePane.setTextString(system[name]);
                var index = contextPath.lastIndexOf('.');
                if(index != -1) {
                    var categories = eval(contextPath.substring(0, index + 1) + 'categories');
                    if(categories) {
                        var category = 'default category';
                        Object.keys(categories).each(function(e){
                            var cat = categories[e];
                            if(Object.isArray(cat)) {
                                if(cat.include(name)) {
                                    category = e;
                                    return;
                                }
                            } else if(cat[name]) {
                                category = e;
                                return;
                            }
                        });
                        if(category != 'default category')
                            this.systemCategory.setTextString(category);
                    }
                }
            }
            this.changeCategory.setTextString(changeRecord.category);
            this.changeName.setTextString(changeRecord.propertyName);
        }
        this.changeContext.setTextString(changeRecord.contextPath);
        this.changeCodePane.setTextString(changeRecord.source);
    },

    setChangeSetContents: function(name) {
        this.changePane.setList(new ChangeSet(name, true).changeRecords);
    },
    onLoad: function() {
    	this.changePane.renderFunction = function(e) {
    	    var prop = "";
	        if(e.type != "doIt")
    	        prop = " '" + e.propertyName + "'";
	        return (e.type || "modified") + prop + " in " + e.contextPath;
    	};
    }


});

lively.morphic.Panel.subclass('lively.SimpleCodeBrowser',

// new lively.SimpleCodeBrowser(pt(640, 480)).openIn($world, 'Simple Code Browser')

'accessing', {
    selectedCategory: function selectedCategory() {
        var category = this.selectedFunctionKind && 
                this.selectedFunctionKind.substring(0, this.selectedFunctionKind.indexOf(' - '));
        return category == 'default category' ? null : category;
    },
},
'editing', {
},
'initializing', {
	buildView: function buildView() {  // this.buildView()
        this.withAllSubmorphsDo(function(m) {disconnectAll(m)});
        this.removeAllMorphs();
    
    	this.createAndArrangePanesFrom([
    		['functionContainerKindPane', this.newDropDownListPane, new Rectangle(0, 0, 0.5, 0.05),
    		    this.functionContainerKindPaneStaticContents()],
    		['functionContainerPane', this.newListPane, new Rectangle(0, 0.05, 0.5, 0.5)],
    		['functionKindPane', this.newDropDownListPane, new Rectangle(0.5, 0, 0.5, 0.05)],
    		['functionPane', this.newListPane, new Rectangle(0.5, 0.05, 0.5, 0.5)],
    		['codePane', this.newCodePane, new Rectangle(0, 0.55, 1, 0.45)],
    	]);
    
        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        var updater = function($upd, newValue, oldValue) {
                        var list = this.sourceObj, browser = this.targetObj;
                        browser.checkSourceNotAccidentlyDeleted(
                            function() {
                                $upd(newValue, oldValue);
                            }, function() {
                                if(oldValue)
                                    lively.bindings.noUpdate(list.setSelection.bind(list, oldValue));
                                else
                                    lively.bindings.noUpdate(list.deselectAt.bind(list, list.selectedLineNo));
                            });
                    };
        connect(this.functionContainerKindPane, "selection", this, "setFunctionContainerKind", {updater: updater});
        connect(this.functionContainerPane, "selection", this, "setFunctionContainer", {updater: updater});
        connect(this.functionContainerPane, "getMenu", this, "getFunctionContainerMenu", {});
        connect(this.functionKindPane, "selection", this, "setFunctionKind", {updater: updater});
        connect(this.functionPane, "selection", this, "setFunction", {updater: updater});
        connect(this.functionPane, "getMenu", this, "getFunctionMenu", {});
    
    	this.functionContainerKindPane.selectAt(0); //the first item in the list is the default
    }
},
'actions', {


    setFunction: function setFunction(aFunctionHolder) {
        if(!aFunctionHolder) {
            this.selectedFunctionNameInContainer = null;
            this.codePane.setTextString(''); 
            return; }
        this.selectedFunctionNameInContainer = aFunctionHolder.string;
        var annotation = "";
        if(aFunctionHolder.func.user && aFunctionHolder.func.timestamp) {
            var ts = new Date(aFunctionHolder.func.timestamp).toUTCString();
            var kindOfChange = aFunctionHolder.func.kindOfChange;
            annotation = Strings.format('// '+kindOfChange+' at %s by %s  \n', ts, aFunctionHolder.func.user);
            if(!this.codePane.inputAllowed())
                this.codePane.setInputAllowed(true);
        } else if(aFunctionHolder.func.belongsToTrait && !(this.selectedContainer instanceof RealTrait)) {
            annotation = '// This is a trait method. Please edit it in its trait: ' + aFunctionHolder.func.belongsToTrait.name;
            if(this.codePane.inputAllowed())
                this.codePane.setInputAllowed(false);
        } else if(!this.codePane.inputAllowed())
            this.codePane.setInputAllowed(true);
        var text = annotation + aFunctionHolder.func;
        this.codePane.setTextString(text);
        this.codePane.savedTextString = text;
    },
    setFunctionContainer: function setFunctionContainer(aContainer) {
        this.selectedContainer = aContainer;
        if(!aContainer) {
            this.functionKindPane.setList([]);
            return;
        }
        var categories = [];
        var staticNames = aContainer.lvOwnFunctionNames();
        if(staticNames.length > 0)
            categories.push({string: 'default category - static', names: staticNames.sort()});
        var nonStaticContainer = this.selectedContainerKind.nonStaticContainer(aContainer);
        if(nonStaticContainer) {
            var allProtoNames = nonStaticContainer.lvOwnFunctionNames();
            if(allProtoNames.length > 0) {
                aContainer.lvCategoriesWithMethodNamesDo(function(category, methodNames){
                    var names = methodNames.intersect(allProtoNames);
                    if(names.length > 0) {
                        names.each(function(n){allProtoNames.remove(n)});
                        categories.push({string: category + ' - proto', names: names.sort()});
                    }
                });
            if(allProtoNames.length > 0)
                categories.push({string: 'default category - proto', names: allProtoNames.sort()});
            }
        }
        this.functionKindPane.setList(categories);
        if(categories.length > 0)
            this.functionKindPane.selectAt(0);
    },
    setFunctionContainerKind: function setFunctionContainerKind(selection) {
        this.selectedContainerKind = selection;
        if(this.owner)
            this.owner.setTitle(this.titleFor(null));
        if(!selection) {
            this.functionContainerPane.setList([]);
            return;
        } 
        var renderFunction = selection.listRenderFunction;
        var containers = selection.containers();
        containers.sort(function(a,b) {return renderFunction(a) <= renderFunction(b) ? -1 : 1});
    
        this.functionContainerPane.renderFunction = renderFunction;
        this.functionContainerPane.setList(containers);
    },
    setFunctionKind: function setFunctionKind(aCategory) {
        var target, names;
        if(aCategory) {
            if(aCategory.string == 'default category - static')
                target = this.selectedContainer;
            else
                target = this.selectedContainerKind.nonStaticContainer(this.selectedContainer);
            this.selectedFunctionKind = aCategory.string;
            names = aCategory.names;
        } else {
            target = this.selectedContainer || Global;
            this.selectedFunctionKind = null;
            names = [];
        }
        this.functionPane.setList(names.collect(function(e){return {string: e, func: target[e]}}));
        this.codePane.doitContext = target;
        this.owner.setTitle(this.titleFor(this.selectedContainer));
        var text = "// doitContext = "+ target.lvContextPath();
        this.codePane.setTextString(text);
        this.codePane.savedTextString = text;
    },
    titleFor: function titleFor(aContainer) {
        return (aContainer && this.selectedContainerKind) ?
                this.selectedContainerKind.titleRenderFunction(aContainer) : 
                "Simple Code Browser"
    },
    reset: function reset() {  // this.reset()
        this.functionContainerKindPane.setList([])
    },






    onLoad: function onLoad() {  // this.onLoad()
        this.codePane.doSave = this.codePaneDoSave;
        this.functionContainerKindPane.setList(this.functionContainerKindPaneStaticContents());
        this.functionContainerKindPane.selectAt(0);
    },

    codePaneDoSave: function codePaneDoSave() {

        var panel = this.owner;
        var functionName = panel.selectedFunctionNameInContainer;
        if (functionName) {
            try {
                var oldFunc = this.doitContext[functionName];
                var text = this.textString;
                (function(){return eval('this.' + functionName + ' = ' + text)}).call(this.doitContext);
                alertOK('eval'); 
                if(this.savedTextString != text) {
                    var contextPath = this.doitContext.lvContextPath();
                    if(!contextPath)
                        throw new Error("Should not happen");
                    var func = this.doitContext[functionName];
                    text = func.toString();   //clean up annotations
                    var category = panel.selectedCategory();
                    if(oldFunc.user && oldFunc.timestamp)
                        //already modified
                        func.timestamp = ChangeSet.logChange(text, contextPath, functionName, category, oldFunc.timestamp);
                    else
                        //first change
                        func.timestamp =  ChangeSet.logFirstChange(text, contextPath, functionName, category, null, this.savedTextString, null, null);
                    if(func.timestamp) {
                        func.user = $world.getUserName();
                        func.kindOfChange = "changed source";
                        var ts = new Date(func.timestamp).toUTCString();
                        text = Strings.format('// '+func.kindOfChange+' at %s by %s  \n', ts, func.user) + text;
                    }
                    this.textString = text;
                    this.savedTextString = text;
                }
            } catch(e) {
                this.showError(e); 
                return null 
            }
        }
    },
    functionContainerKindPaneStaticContents: function functionContainerKindPaneStaticContents() {
        
        var self = this;
        
        return [
            {string: "loaded classes", 
                titleRenderFunction: function(e){return "Class " + (e.type || e.displayName || e.name)},
                listRenderFunction: function(e){return e.name || e.displayName || e.type},
                containers: function(){
                    return classes(true)},
                nonStaticContainer: function(e){return e.prototype}}, 
                
           {string: "loaded non-class global constructors", 
                titleRenderFunction: function(e){return e.name || e.lvDisplayName},
                listRenderFunction: function(e){return e.name || e.lvDisplayName},
                containers: function(){
                    return Global.nonClassConstructors()},
                nonStaticContainer: function(e){return e.prototype}}, 
                
            {string: "loaded modules", 
                titleRenderFunction: function(e){return "Module " + e.name()},
                listRenderFunction: function(e){return e.name()},
                containers: function(){
                    return lively.Module.getLoadedModules().select(function(e){
                        return e.functions(false).length > 0
                    })},
                nonStaticContainer: function(e){return null}}, 
                
            {string: "loaded traits", 
                titleRenderFunction: function(e){return "Trait " + e.name},
                listRenderFunction: function(e){return e.name},
                containers: function(){
                    return Global.RealTrait ? Object.values(RealTrait.prototype.traitRegistry) : []},
                nonStaticContainer: function(e){return e.def}}, 
                
            {string: "well-known global containers", 
                titleRenderFunction: function(e){return "Global object " + lvContextPath()},
                listRenderFunction: function(e){return e.lvContextPath()},
                containers: function(){
                    return [Global, Arrays, Grid, Interval, lively.ArrayProjection, lively.Grouping,
                        Functions, Numbers, Objects, Properties, Strings, lively.LocalStorage, lively.Worker]},
                nonStaticContainer: function(e){return e.prototype}}, 
                
            {string: "loaded layers", containers: function(){alert("Not implemented yet"); return []}}, 
            {string: "loaded parts", containers: function(){alert("Not implemented yet"); return []}},
            {string: "other", containers: function(){alert("Not implemented yet"); return []}}]
    },


    getFunctionContainerMenu: function getFunctionContainerMenu() {
        return [];
    },
    getFunctionMenu: function getFunctionMenu() {
        if(!this.selectedFunctionKind)
            return [];
        var self = this;
        var kind = 'property';
        if (this.selectedContainer !== Global)
            kind = 'method';
        else
            kind = 'function';
        var items = [
            ['add '+kind, function() {self.addProperty()}]
        ];

        if (this.selectedFunctionNameInContainer) {
            items.push(
                ['remove '+kind, function() {self.removeProperty()}],
                ['senders', function() {
                    $world.openMethodFinderFor(self.selectedFunctionNameInContainer, '__sender'); }],
                ['implementors', function() {
                    $world.openMethodFinderFor(self.selectedFunctionNameInContainer, '__implementor'); }]
                );
            if (this.selectedFunctionKind != 'default category - static')
                items.push(['change category', function() {self.changeCategory()}]);
            var func = this.codePane.doitContext[this.selectedFunctionNameInContainer];
            if(func.timestamp)
                items.push(['browse versions', function() {self.browseVersions(func.timestamp)}])
        }
        return items;
    },
    checkSourceNotAccidentlyDeleted: function checkSourceNotAccidentlyDeleted (confirmCallback, cancelCallback) {
        // checks if the source code has unsaved changes, only confirm
        // if it hasn't or if the user wants to discard them
        var browser = this;
        if(this.codePane.savedTextString === this.codePane.textString)
            confirmCallback.apply(browser);
        else $world.confirm('There are unsaved changes. Discard them?', function(answer){
            answer ? confirmCallback.apply(browser) : (cancelCallback && cancelCallback.apply(browser));
        });
    },


    addProperty: function addProperty() {
        var codePane = this.codePane,
            functionPane = this.functionPane,
            selectedContainer = this.selectedContainer,
            panel = this;

        this.checkSourceNotAccidentlyDeleted(function() {
            $world.editPrompt('new method name', function(functionName) {
                if(!functionName || functionName.length == 0)
                    return;
                        
                var currentNames = functionPane.getList().collect(function(e){return e.string});
                if(currentNames.include(functionName)) {
                    $world.warn('method name already in use');
                    return;
                }
    
                var contextPath = codePane.doitContext.lvContextPath();
                if(!contextPath)
                    throw new Error("Should not happen");
                var func = function() {};
                codePane.doitContext[functionName] = func;
    
                var category = panel.selectedCategory();
                if (category)
                    selectedContainer.lvAddMethodToExistingCategory(func, functionName, category);
                
                func.timestamp = ChangeSet.logAddition(contextPath, functionName, category);
                func.kindOfChange = "added";
                func.user = $world.getUserName();
    
                lively.bindings.noUpdate(panel.setFunctionContainer.bind(panel, selectedContainer));
                panel.functionKindPane.setSelectionMatching(panel.selectedFunctionKind);
                functionPane.setSelectionMatching(functionName);
            });
        });
    },




    changeCategory: function() {
        var panel = this,
            container = this.selectedContainer,
            functionName = this.selectedFunctionNameInContainer,
            func = this.codePane.doitContext[functionName],
            category = this.selectedCategory(),
            functionKindPane = this.functionKindPane;
            
        this.checkSourceNotAccidentlyDeleted(function() {
            var categories = functionKindPane.getList().collect(function(e){return e.string.substring(0, e.string.indexOf(' - '))});

            categories.remove(category);
            categories.remove('default category');  //one for static
            categories.remove('default category');  //one for proto
            
            var proceed = function(otherCategory) {
                var contextPath = panel.codePane.doitContext.lvContextPath();
                if(!contextPath)
                    throw new Error("Should not happen");
debugger;
                container.lvRemoveMethodFromExistingCategory(functionName, category);
                container.lvAddMethodToExistingCategory(func, functionName, otherCategory);
    
                if(func.user && func.timestamp)
                    //already modified
                    func.timestamp = ChangeSet.logChange(func.toString(), contextPath, functionName, otherCategory, func.timestamp);
                else {
                    //first change
                    func.timestamp = ChangeSet.logFirstChange(func.toString(), contextPath, functionName, otherCategory, category, null, null, null);
                    if(func.timestamp)
                        func.user = $world.getUserName();
                }
                func.kindOfChange = "changed category from "+ category+ " to "+otherCategory;

                lively.bindings.noUpdate(panel.setFunctionContainer.bind(panel, container));
                functionKindPane.setSelectionMatching(otherCategory + ' - proto');
                panel.functionPane.setSelectionMatching(functionName);
            }
    
            $world.listPrompt('change category to...', function(newCategory) {
                        
                if(newCategory == '<new category>')
                    $world.editPrompt('new category', function(newCategory) {
                        if(newCategory && newCategory.trim().length > 0) {
                            newCategory = newCategory.trim();
                            container.lvAddCategory(newCategory);
                            proceed(newCategory);
                        }
                    });
                else if(newCategory)
                    proceed(newCategory);
            }, categories);
        });
    },
    removeProperty: function removeProperty () {
        var functionName = this.selectedFunctionNameInContainer;
        var func = this.codePane.doitContext[functionName];
        var panel = this;

        $world.confirm('Are you sure you want to remove this method?', function(answer){
            if(!answer)
                return;
            
            var contextPath = panel.codePane.doitContext.lvContextPath();
            if(!contextPath)
                throw new Error("Should not happen");
            
            delete panel.codePane.doitContext[functionName];
    
            var category = panel.selectedCategory();
            if (category)
                panel.selectedContainer.lvRemoveMethodFromExistingCategory(functionName, category);
            
            if(func.user && func.timestamp)
                //modified
                ChangeSet.logRemoval(func.toString(), contextPath, functionName, category, func.timestamp);
            else
                ChangeSet.logFirstRemoval(func.toString(), contextPath, functionName, category);
    
            var oldFunctionKind = panel.selectedFunctionKind;
            panel.setFunctionContainer(panel.selectedContainer);
            var index = panel.functionKindPane.find(oldFunctionKind);
            if(index)
                panel.functionKindPane.selectAt(index);
        });
    },









},
'constructors', {
}
);

}) // end of module
