module('lively.ChangeSets').requires('lively.Traits').requiresLib({url: Config.codeBase + 'lib/jsdiff/jsdiff.js', loadTest: function() { return typeof JsDiff !== 'undefined'; }}).toRun(function() {

Object.extend(Global, {

    addOwnPropertyIfAbsent: function addOwnPropertyIfAbsent(target, name, value) {
        if(!Object.getOwnPropertyDescriptor(target, name))
            Object.defineProperty(target, name, {value: value});
    }
});

(function setupBaseExtensionsForCategories() {

    addOwnPropertyIfAbsent(Object.prototype, 'lvAddMethodToExistingCategory', function(method, methodName, category){});
    addOwnPropertyIfAbsent(Object.prototype, 'lvRemoveMethodFromExistingCategory', function(methodName, category){});
    addOwnPropertyIfAbsent(Object.prototype, 'lvAddCategoryIfAbsent', function(category){});
    addOwnPropertyIfAbsent(Object.prototype, 'lvCategoriesWithMethodNamesDo', function(func){});
    addOwnPropertyIfAbsent(Object.prototype, 'lvCategoryForMethod', function(methodName){});
    addOwnPropertyIfAbsent(Object.prototype, 'lvCategoriesContainer', function(){
            if(this.constructor instanceof Function && this.constructor.prototype === this
              && this.constructor.superclass)
                return this.constructor;
            var sampleContainedFunction;
            for (var name in this)
                if (!this.__lookupGetter__(name) && this.hasOwnProperty(name) && (sampleContainedFunction = this[name]) instanceof Function)
                    break;
            if(sampleContainedFunction && sampleContainedFunction.belongsToTrait && sampleContainedFunction.belongsToTrait.def === this)
                return sampleContainedFunction.belongsToTrait;
            return null;
    });
    
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
    addOwnPropertyIfAbsent(Function.prototype, 'lvAddCategoryIfAbsent', function(category){
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
    addOwnPropertyIfAbsent(Function.prototype, 'lvCategoryForMethod', function(methodName){
            if(!this.superclass) return;
            var cat = this.categories;
            return Object.keys(cat).detect(function(category){
                return cat[category].include(methodName);
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
    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvAddCategoryIfAbsent', function(category){
            if(this.categories[category]) return;
            this.categories[category] = {};
        });
    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvCategoriesWithMethodNamesDo', function(func){
            var cat = this.categories;
            Object.keys(cat).each(function(category){
                func(category, Object.keys(cat[category]));
            });
        });
    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvCategoryForMethod', function(methodName){
            var cat = this.categories;
            return Object.keys(cat).detect(function(category){
                return cat[category][methodName];
            });
        });
})();

(function setupBaseExtensionsForFunctionNames() {

    addOwnPropertyIfAbsent(Function.prototype, 'lvIsConstructor', function(){
        if(this.superclass) 
            return true;
        return Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
                    return name != 'lvContextPath' && name != 'caller' && !obj.__lookupGetter__(name) && obj[name] instanceof Function}).length > 0 ||
                this.prototype && Object.getOwnPropertyNames(this.prototype).length > 1});   //one of them is 'constructor'

    addOwnPropertyIfAbsent(Object.prototype, 'lvOwnFunctionNames', function(){
        return Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
            var object;
            return !obj.__lookupGetter__(name) && 
                name != 'lvContextPath' && 
                name != 'lvOwnFunctionNames' && 
                (object = obj[name]) instanceof Function &&
                (!object.name || object.name == name) &&
                !lively.Class.isClass(object)})});
    
    addOwnPropertyIfAbsent(Global, 'lvOwnFunctionNames', function(){
        return Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
            var object;
            return !obj.__lookupGetter__(name) && 
                name != 'requires' && 
                name != 'lvContextPath' && 
                name != 'lvOwnFunctionNames' && 
                (object = obj[name]) instanceof Function &&
                (!object.name || object.name == name) &&
                !object.lvIsConstructor()})});
    
    addOwnPropertyIfAbsent(lively.Module.prototype, 'lvOwnFunctionNames', function(){
        return Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
            var object;
            return !obj.__lookupGetter__(name) && 
                name != 'requires' && 
                (object = obj[name]) instanceof Function &&
                (!object.name || object.name == name) &&
                !object.lvIsConstructor()})});
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
            var keys = Object.keys(this);
            keys.__proto__ = null;
            for (var name in keys)
                if (!this.__lookupGetter__(name) && (sampleContainedFunction = this[name]) instanceof Function)
                    break;
            if(!sampleContainedFunction)
                return null;
            if(sampleContainedFunction.belongsToTrait && sampleContainedFunction.belongsToTrait.def === this)
                return sampleContainedFunction.belongsToTrait.lvContextPath() + ".def";
            return null;
        });

    ["Global", "Intl.Collator", "Intl.DateTimeFormat", "Intl.NumberFormat", "console", "location",
            "Arrays", "Grid", "Interval", "JSON", "Math", "lively.ArrayProjection",
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

    addOwnPropertyIfAbsent(lively.persistence.SpecObject.prototype, 'lvContextPath', function(){
            return 'lively.persistence.BuildSpec.Registry["' + Properties.nameFor(lively.persistence.BuildSpec.Registry, this) + '"]';
        });

    addOwnPropertyIfAbsent(lively.Module.prototype, 'lvContextPath', function(){
            return this.name();
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


    
	assureChangeSetNamed: function(aName) {
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
            return e == aName;
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

		this.userStorageRoot = "LivelyChanges:" + location.origin + location.pathname + ":author:" + $world.getUserName();
		var storedNameForDefaultChangeSet = this.defaultChangeSetName();
		if(!storedNameForDefaultChangeSet)
		    return;
        var changeSet = new ChangeSet(storedNameForDefaultChangeSet, true);
        this.newChanges(changeSet);
        var changesetNames = this.changeSetNames();
        if(!changesetNames.include(storedNameForDefaultChangeSet)) {
            changesetNames.push(storedNameForDefaultChangeSet);
            localStorage.setItem(this.userStorageRoot + ":changesetNames", JSON.stringify(changesetNames));
        }
        if(!changeSet.hasErrors() && Config.automaticChangesReplay)
            changeSet.applyChanges();
        if(changeSet.hasErrors())
            $world.openInspectorFor(changeSet);
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

        var storageArray = [source];
        //check if it has any 'this' references
        var programNode = lively.ast.acorn.parse(source);
        var thisReferences = false;
        lively.ast.acorn.simpleWalk(programNode, {
            ThisExpression: function(node) { thisReferences = true }
        });
        if(thisReferences)
            //otherwise no need for contextPath
            if(contextPath)
                storageArray.push(contextPath);
            else
                //we need a context path, but there is none
                return;
        this.storeArray(storageArray, this.nextTimestamp());
    },


    
    


    logChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp) {

        return this.current().logChange(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp);
    },

    logFirstChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame) {

        return this.current().logFirstChange(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame);
    },
    logFirstRemoval: function(source, contextPath, propertyName, categoryOrNil) {
 
        this.current().logFirstRemoval(source, contextPath, propertyName, categoryOrNil);
    },


    logRemoval: function(contextPath, propertyName, categoryOrNil, previousChangeStamp) {
 
        this.current().logRemoval(contextPath, propertyName, categoryOrNil, previousChangeStamp);
    },
    removeAllFromPersistentStorage: function() {// ChangeSet.removeAllFromPersistentStorage()
    
		var storageRoot = "LivelyChanges:" + location.origin + location.pathname + ":author:" + $world.getUserName();

        var changesetNamesString = localStorage.getItem(storageRoot + ":changesetNames");
        if(changesetNamesString) {
            JSON.parse(changesetNamesString).each(function(n) {
                localStorage.removeItem(storageRoot + ":changesetTimestamps:" + n);
            });
            localStorage.removeItem(storageRoot + ":changesetNames");
        }

        var allTimestampsString = localStorage.getItem(storageRoot + ":timestamps");
        if(allTimestampsString) {
            var timestamps;
            try {
                timestamps = JSON.parse("["+ allTimestampsString +"]");
            } catch(e) {
                timestamps = allTimestampsString.split(",");
            }
            
            timestamps.each(function(t) {
                localStorage.removeItem(storageRoot + ":allChanges:" + t);
            });
            localStorage.removeItem(storageRoot + ":timestamps");
        }
    },
    storeArray: function(array, timestamp) {

        //Step 1: store the actual change
        localStorage.setItem(this.userStorageRoot + ":allChanges:" + timestamp, JSON.stringify(array));

        //Step 2: mark the change in the "all storage keys"
        var allTimestampsString = localStorage.getItem(this.userStorageRoot + ":timestamps");
        if(!allTimestampsString)
            allTimestampsString = "" + timestamp;
        else
            allTimestampsString += "," + timestamp;
        localStorage.setItem(this.userStorageRoot + ":timestamps", allTimestampsString);

    },

    nextTimestamp: function() {
        var current = performance.now();
        while(current == performance.now());
        return lively.ChangeSets.createTime.getTime() + performance.now();
    },

    applyChange: function(changeRecord, existingTimestamp) {

        if(changeRecord.originalContextPath) {
            var originalContext = lively.lookup(changeRecord.originalContextPath);
            if(!originalContext) {
                changeRecord.errors.push("Could not resolve the original context "+changeRecord.originalContextPath);
                return;
            }
            if(changeRecord.originalPropertyName && !originalContext[changeRecord.originalPropertyName]) {
                changeRecord.errors.push("Failed to apply change. The original context "+changeRecord.originalContextPath+"\n does not have the original property named '"+changeRecord.originalPropertyName+"' anymore");
                return;
            }
            if(changeRecord.originalPropertyName && changeRecord.originalSource != originalContext[changeRecord.originalPropertyName].toString()) {
                changeRecord.errors.push("Failed to apply change. "+changeRecord.originalContextPath+"."+changeRecord.originalPropertyName+"\n does not have the original source anymore");
                return;
            }
            if(changeRecord.originalCategory) {
                var originalContainer = originalContext.lvCategoriesContainer();
                if(changeRecord.originalCategory != originalContainer.lvCategoryForMethod(changeRecord.originalPropertyName))
{
                    changeRecord.errors.push("Failed to apply change. "+changeRecord.originalContextPath+"."+changeRecord.originalPropertyName+"\n does not have the original category "+changeRecord.originalCategory+" anymore");
                    return;
                }
            }
        }
        
        var context = changeRecord.contextPath && lively.lookup(changeRecord.contextPath);
        if(changeRecord.type == "doIt") {
            try {
                (function() { eval(changeRecord.source) }).call(context);
            } catch(e) {
                changeRecord.errors.push("Failed evaluating doit:\n" + changeRecord.source + "\in context " + changeRecord.contextPath + "\n"+ e.name + ": " + e.message);
            }
            if(!existingTimestamp)
                this.logDoit(changeRecord.source, changeRecord.contextPath);
            return;
        }
        if(!context) {
            changeRecord.errors.push("Failed evaluating context path: " + changeRecord.contextPath);
            return;
        }
        var kindOfChange, 
            timestamp,
            oldFunc = context[changeRecord.propertyName];
        switch(changeRecord.type.valueOf()) {
            case "removed":
                delete context[changeRecord.propertyName];
                if(!existingTimestamp)
                    if(oldFunc.user && oldFunc.timestamp)
                        //modified
                        this.logRemoval(changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, oldFunc.timestamp);
                    else
                        this.logFirstRemoval(changeRecord.originalSource, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category);
                return;
            case "added":
                if(oldFunc) {
                    if(oldFunc.toString() != changeRecord.source)
                        changeRecord.errors.push("Failed to add property. The context "+changeRecord.contextPath+"\n already has the property named "+changeRecord.propertyName+" and it is different from what we are trying to add");
                    return;
                }
                if(!existingTimestamp)
                    timestamp = this.logAddition(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category);
                kindOfChange = "added";
                break;
            case "moved":
                if(oldFunc) {
                    if(oldFunc.toString() != changeRecord.source)
                        changeRecord.errors.push("Failed to move property. The target context "+changeRecord.contextPath+"\n already has the property named "+changeRecord.propertyName+" and it is different from what we are trying to move there");
                    return;
                }
                kindOfChange = "moved from "+changeRecord.originalContextPath;
                if(!existingTimestamp) {
                    var sourceOldFunc = originalContext[changeRecord.originalPropertyName];
                    if(sourceOldFunc.user && sourceOldFunc.timestamp)
                        //already modified
                        timestamp = this.logChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, sourceOldFunc.timestamp);
                    else
                        //first change
                        timestamp = this.logFirstChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, changeRecord.originalCategory, changeRecord.originalSource, changeRecord.originalContext, changeRecord.originalPropertyName);
                }
                delete originalContext[changeRecord.originalPropertyName];
                break;
            case "renamed":
                if(oldFunc) {
                    if(oldFunc.toString() != changeRecord.source)
                        changeRecord.errors.push("Failed to rename property. The context "+changeRecord.contextPath+"\n already has the target property named "+changeRecord.propertyName+" and it is different from what we are trying to set there");
                    return;
                }
                kindOfChange = "renamed from "+changeRecord.originalPropertyName;
                if(!existingTimestamp) {
                    var sourceOldFunc = context[changeRecord.originalPropertyName];
                    if(sourceOldFunc.user && sourceOldFunc.timestamp)
                        //already modified
                        timestamp = this.logChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, sourceOldFunc.timestamp);
                    else
                        //first change
                        timestamp = this.logFirstChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, changeRecord.originalCategory, changeRecord.originalSource, null, changeRecord.originalPropertyName);
                }
                delete context[changeRecord.originalPropertyName];
                break;
            case "changed source":
                if(!oldFunc) {
                    changeRecord.errors.push("Failed to change source. The context "+changeRecord.contextPath+"\n does not have the property named "+changeRecord.propertyName);
                    return;
                }
                kindOfChange = "changed source";
                if(!existingTimestamp)
                    if(oldFunc.user && oldFunc.timestamp)
                        //already modified
                        timestamp = this.logChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, oldFunc.timestamp);
                    else
                        //first change
                        timestamp = this.logFirstChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, changeRecord.originalCategory, changeRecord.originalSource, null, null);
                break;
            case "changed category":
                if(!oldFunc) {
                    changeRecord.errors.push("Failed to change category. The context "+changeRecord.contextPath+"\n does not have the property named "+changeRecord.propertyName);
                    return;
                }
                kindOfChange = "changed category from "+changeRecord.originalCategory+" to "+changeRecord.category;
                if(!existingTimestamp)
                    if(oldFunc.user && oldFunc.timestamp)
                        //already modified
                        timestamp = this.logChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, oldFunc.timestamp);
                    else
                        //first change
                        timestamp = this.logFirstChange(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category, changeRecord.originalCategory, null, null, null);
                break;
            default:
                throw new Error("Applying "+changeRecord.type+ " not implemented yet");
            }
            if(!oldFunc || changeRecord.source != oldFunc.toString())
                (function() { eval("this."+changeRecord.propertyName+" = "+ changeRecord.source) }).call(context);
            var func = context[changeRecord.propertyName];
            func.kindOfChange = kindOfChange;
            func.user = $world.getUserName(); 

            if(changeRecord.category && changeRecord.category != changeRecord.originalCategory) {
                var container = context.lvCategoriesContainer();
                if(changeRecord.originalCategory) {
                    var originalContainer = container;
                    if(context !== originalContext)
                        originalContainer = originalContext.lvCategoriesContainer();
                    if(originalContainer)
                        originalContainer.lvRemoveMethodFromExistingCategory(changeRecord.originalPropertyName, changeRecord.originalCategory);
                }
                if(container) {
                    container.lvAddCategoryIfAbsent(changeRecord.category);
                    container.lvAddMethodToExistingCategory(func, changeRecord.propertyName, changeRecord.category);
                }
            }
            if(!existingTimestamp) {
                if(timestamp)
                    func.timestamp = timestamp;
            } else
                func.timestamp = existingTimestamp;
    },

    hydrateChange: function(t) {
        var changeRecord = this.getChangeRecord(t);
        changeRecord.errors = [];
        if(changeRecord.type == "doIt")
            return changeRecord;

        var firstChangeStamp = changeRecord.firstChangeStamp;
        if(firstChangeStamp) {
            //this is not a first change
            var firstChangeRecord = this.getChangeRecord(firstChangeStamp);
			if(firstChangeRecord.type == "added")
                if(changeRecord.type == "removed")
                    //added then removed, not a "real" change
                    return null;
                else {
                    changeRecord.type = "added";    //this may also include added to category
                    return changeRecord;
                }
            changeRecord.originalContextPath = firstChangeRecord.originalContextPath;
            changeRecord.originalPropertyName = firstChangeRecord.originalPropertyName;
            changeRecord.originalCategory = firstChangeRecord.originalCategory;
            changeRecord.originalSource = firstChangeRecord.originalSource;
        }
                
        if(changeRecord.type == "removed" || changeRecord.type == "added")
            return changeRecord;
        if(changeRecord.originalContextPath !== changeRecord.contextPath) {
            changeRecord.type = "moved";    //this may also include renamed, changed category and changed source
            return changeRecord;
        }
        if(changeRecord.originalPropertyName !== changeRecord.propertyName) {
            changeRecord.type = "renamed";  //this may also include changed category and changed source
            return changeRecord;
        }
        if(changeRecord.originalSource !== changeRecord.source) {
            changeRecord.type = "changed source";  //this may also include changed category
            return changeRecord;
        }
        if(changeRecord.originalCategory !== changeRecord.category) {
            changeRecord.type = "changed category";
        }
        return changeRecord;
    },




    changeDataFromStorage: function(array) {
// There are four main formats for the array. The first 4 elements in each of them, when present, represent the same aspect:
//
// 1. For doIts, there is a 1 or 2 element array: 
//   [source, optContextPath]
//
// 2. For the first change representing the addition of a named property, there is a 3 or 4 element array:
//   [source, contextPath, 
//    propertyName, optCategory]
//
// 3. For subsequent changes of a named property, there is a 6 element array:
//   [sourceOrNil, contextPath, 
//    propertyName, categoryOrNil, 
//    firstChangeStamp, previousChangeStamp]
//      - sourceOrNil being null means removal
//
// 4. For the first change of an existing named property, there is a 5 to 8 element array:
//   [sourceOrNil, contextPath, 
//    propertyName, category, 
//    originalCategory, originalSourceOrNilIfSame, originalContextPathOrNilIfSame, originalPropertyNameOrNilIfSame]
//      - sourceOrNil being null means removal

    	var entry = {source: array[0], contextPath: array[1]}, 
    		propertyName = array[2];
    
    	if(propertyName) {
			entry.propertyName = propertyName;
			if(!entry.source)
                entry.type = "removed";
			entry.category = array[3];
			var previous = array[4];
			if(previous && typeof previous.valueOf() == "number") {
				//not a first change
				entry.firstChangeStamp = previous;
				entry.previousChangeStamp = array[5];
				return entry;
			} else if(array.length < 5) {
    			//addition
				entry.type = "added";
				return entry;
			}
			entry.originalCategory = previous;
			entry.originalSource = array[5] || entry.source;
			entry.originalContextPath = array[6] || array[1] || "Global";
			entry.originalPropertyName = array[7] || propertyName;
		} else {
		//doIt
			entry.type = "doIt"
		}
		return entry;
    },
    getChangeRecord: function(t) {
        var dataString = localStorage.getItem(this.userStorageRoot + ":allChanges:" + t);
        if(!dataString)
            debugger;
        return this.changeDataFromStorage(JSON.parse(dataString));
    },



    logAddition: function(source, contextPath, propertyName, optCategory) {

        return this.current().logAddition(source, contextPath, propertyName, optCategory);
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
            
        for (var i=0; i<this.timestamps.length; i++)
            ChangeSet.applyChange(this.changeRecords[i], this.timestamps[i]);
        if(!this.hasErrors())
            alertOK("Changes succesfully applied")
        
    },

    hasErrors: function() {
        return this.changeRecords.detect(function(e){e.errors.length > 0})
    },
    addChange: function(t) {
        this.timestamps.push(t);
        this.changeRecords.push(ChangeSet.hydrateChange(t));
    },




    logAddition: function(source, contextPath, propertyName, optCategory) {


        //make sure this is really a new addition (within the current changeset)
        var replacedRemoval;
        this.timestamps.each(function(t){
            var changeRecord = ChangeSet.getChangeRecord(t);
            if(changeRecord.contextPath == contextPath) {
                if(changeRecord.propertyName == propertyName) {
                    if(changeRecord.type != "removed")
                        throw new Error("should not happen");
                    //it is not really a new add
                    this.removeTimestamp(t);
                    var firstChangeRecord = ChangeSet.getChangeRecord(changeRecord.firstChangeStamp);
                    replacedRemoval = this.logFirstChange(source, contextPath, propertyName, optCategory,
                        firstChangeRecord.originalCategory, firstChangeRecord.originalSource, firstChangeRecord.originalContextPath, firstChangeRecord.originalPropertyName);
                    return;
                }
            }
        })
        if(replacedRemoval)
            return replacedRemoval;
        var timestamp = ChangeSet.nextTimestamp();
        var array = [source, contextPath, propertyName];
        if(optCategory)
            array.push(optCategory);
        this.storeArray(array, timestamp);
        return timestamp
    },
    removeTimestamp: function(t) {

        this.timestamps.remove(t);
        localStorage.setItem(ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
    },

    logChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp) {

        //Get the previous change
        var previousChangeRecord = ChangeSet.getChangeRecord(previousChangeStamp);
        var firstTimestamp = previousChangeRecord.firstChangeStamp || previousChangeStamp;
        var timestamp = ChangeSet.nextTimestamp();
        this.storeArray([sourceOrNil, contextPath, propertyName, categoryOrNil, firstTimestamp, previousChangeStamp], timestamp);
        this.removeTimestamp(previousChangeStamp);

        if( previousChangeRecord.originalSource == sourceOrNil &&
            previousChangeRecord.originalContextPath == contextPath &&
            previousChangeRecord.originalPropertyName == propertyName &&
            previousChangeRecord.originalCategory == categoryOrNil) {
                //this is not really a change, we are reverting to the original
                this.removeTimestamp(timestamp);
                return null;
            }
        return timestamp
    },

    logFirstChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame) {
 
        var timestamp = ChangeSet.nextTimestamp();
        var array = [sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil];
        if(previousSourceOrNilIfSame && sourceOrNil != previousSourceOrNilIfSame) {
            array.push(previousSourceOrNilIfSame);
            if(previousContextPathOrNilIfSame && contextPath != previousContextPathOrNilIfSame) {
                array.push(previousContextPathOrNilIfSame);
                if(previousPropertyNameOrNilIfSame && propertyName != previousPropertyNameOrNilIfSame)
                    array.push(previousPropertyNameOrNilIfSame);
            } else
                if(previousPropertyNameOrNilIfSame && propertyName != previousPropertyNameOrNilIfSame)
                    array.push(null, previousPropertyNameOrNilIfSame);
        } else 
            if(previousContextPathOrNilIfSame && contextPath != previousContextPathOrNilIfSame) {
                array.push(null, previousContextPathOrNilIfSame);
                if(previousPropertyNameOrNilIfSame && propertyName != previousPropertyNameOrNilIfSame)
                    array.push(previousPropertyNameOrNilIfSame);
            } else
                if(previousPropertyNameOrNilIfSame && propertyName != previousPropertyNameOrNilIfSame)
                    array.push(null, null, previousPropertyNameOrNilIfSame);
        this.storeArray(array, timestamp);
        return timestamp
    },
    logFirstRemoval: function(source, contextPath, propertyName, categoryOrNil) {
 
        this.storeArray([null, contextPath, propertyName, categoryOrNil, null, source], ChangeSet.nextTimestamp());
    },


    logRemoval: function(contextPath, propertyName, categoryOrNil, previousChangeStamp) {
 
        //Get the previous change
        var previousChangeRecord = ChangeSet.getChangeRecord(previousChangeStamp);
        var firstTimestamp = previousChangeRecord.firstChangeStamp || previousChangeStamp;
        var timestamp = ChangeSet.nextTimestamp();
        this.storeArray([null, contextPath, propertyName, categoryOrNil, firstTimestamp, previousChangeStamp], timestamp);
        this.removeTimestamp(previousChangeStamp);

        var firstChangeRecord = firstTimestamp === previousChangeStamp ? previousChangeRecord : ChangeSet.getChangeRecord(firstTimestamp);
        if(firstChangeRecord.type == "added")
            //this is not really a removal, we are only removing something temporarily added
            this.removeTimestamp(timestamp);
    },


    storeArray: function(array, timestamp) {

        ChangeSet.storeArray(array, timestamp);

        this.addTimestamp(timestamp);
    },
    storeName: function() {
        
        if(!ChangeSet.userStorageRoot) {
            var username = $world.getUserName();
            var storageRoot = "LivelyChanges:" + location.origin + location.pathname;
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
    reorderTimestamp: function(index, newIndex) {

        var ts = this.timestamps.splice(index, 1)[0];
        this.timestamps.splice(newIndex, 0, ts);
        localStorage.setItem(ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
    },

    addTimestamp: function(t) {

        this.timestamps.push(t);
        localStorage.setItem(ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
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

    		['changeLabel', this.newStaticTextPane, new Rectangle(0, 0.25, 0.167, 0.05), "Selected Change"],
    		['changeVsOriginalButton', this.newButton, new Rectangle(0.167, 0.25, 0.166, 0.05), "Next diff vs Original"],
    		['originalLabel', this.newStaticTextPane, new Rectangle(0.333, 0.25, 0.167, 0.05), "Original Source"],
    		['originalVsSystemButton', this.newButton, new Rectangle(0.5, 0.25, 0.167, 0.05), "Next diff vs System"],
    		['systemlLabel', this.newStaticTextPane, new Rectangle(0.667, 0.25, 0.167, 0.05), "System Source"],
    		['systemVsChangeButton', this.newButton, new Rectangle(0.834, 0.25, 0.166, 0.05), "Next diff vs Selected"],

    		['changeContextLabel', this.newStaticTextPane, new Rectangle(0, 0.3, 0.083, 0.05), "Context:"],
    		['changeContext', this.newStaticTextPane, new Rectangle(0.083, 0.3, 0.25, 0.05)],
    		['originalContextLabel', this.newStaticTextPane, new Rectangle(0.333, 0.3, 0.083, 0.05), "Context:"],
    		['originalContext', this.newStaticTextPane, new Rectangle(0.416, 0.3, 0.251, 0.05)],
    		['systemContextLabel', this.newStaticTextPane, new Rectangle(0.667, 0.3, 0.083, 0.05), "Context:"],
    		['systemContext', this.newStaticTextPane, new Rectangle(0.75, 0.3, 0.25, 0.05)],

    		['changeCategoryLabel', this.newStaticTextPane, new Rectangle(0, 0.35, 0.083, 0.05), "Category:"],
    		['changeCategory', this.newStaticTextPane, new Rectangle(0.083, 0.35, 0.25, 0.05)],
    		['originalCategoryLabel', this.newStaticTextPane, new Rectangle(0.333, 0.35, 0.083, 0.05), "Category:"],
    		['originalCategory', this.newStaticTextPane, new Rectangle(0.416, 0.35, 0.251, 0.05)],
    		['systemCategoryLabel', this.newStaticTextPane, new Rectangle(0.667, 0.35, 0.083, 0.05), "Category:"],
    		['systemCategory', this.newStaticTextPane, new Rectangle(0.75, 0.35, 0.25, 0.05)],

    		['changeNameLabel', this.newStaticTextPane, new Rectangle(0, 0.4, 0.083, 0.05), "Name:"],
    		['changeName', this.newStaticTextPane, new Rectangle(0.083, 0.4, 0.25, 0.05)],
    		['originalNameLabel', this.newStaticTextPane, new Rectangle(0.333, 0.4, 0.083, 0.05), "Name:"],
    		['originalName', this.newStaticTextPane, new Rectangle(0.416, 0.4, 0.251, 0.05)],
    		['systemNameLabel', this.newStaticTextPane, new Rectangle(0.667, 0.4, 0.083, 0.05), "Name:"],
    		['systemName', this.newStaticTextPane, new Rectangle(0.75, 0.4, 0.25, 0.05)],

    		['changeCodePane', this.newCodePane, new Rectangle(0, 0.45, 0.333, 0.55)],
    		['originalCodePane', this.newReadOnlyCodePane, new Rectangle(0.333, 0.45, 0.334, 0.55)],
    		['systemCodePane', this.newReadOnlyCodePane, new Rectangle(0.667, 0.45, 0.333, 0.55)],
    	]);
    	
    	this.changeLabel.applyStyle({fontWeight: 'bold'});
    	this.originalLabel.applyStyle({fontWeight: 'bold'});
    	this.systemlLabel.applyStyle({fontWeight: 'bold'});
    	
    	this.setActive(this.originalVsSystemButton, false);
    	this.setActive(this.systemVsChangeButton, false);
    	this.setActive(this.changeVsOriginalButton, false);

    	var self = this;
    	this.changePane.renderFunction = function(e) {
    	    var prop = "";
    	    if(self.changeSet) {
        	    var index = self.changeSet.timestamps.indexOf(e);
        	    var record = self.changeSet.changeRecords[index];
        	    if(record.type != "doIt")
        	        prop = " '" + record.propertyName + "'";
        	    return new Date(e).toUTCString() + ' ' + record.type + 
        	                    prop +" in " + record.contextPath;
    	    } else 
    	        return new Date(e).toUTCString();
    	};

        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        connect(this.changeSetPane, "selection", this, "setChangeSet", {});
        connect(this.changeSetPane, "getMenu", this, "getChangeSetMenu", {});
        connect(this.changePane, "selection", this, "setChange", {});
        connect(this.changePane, "getMenu", this, "getChangeMenu", {});
        connect(this.originalVsSystemButton, "fire", this, "nextOriginalVsSystem", {});
        connect(this.systemVsChangeButton, "fire", this, "nextSystemVsChange", {});
        connect(this.changeVsOriginalButton, "fire", this, "nextChangeVsOriginal", {});
    
    	this.changeSetPane.setSelection(ChangeSet.defaultChangeSetName());
    },
    nextChangeVsOriginal: function() {
        if(this.nextOriginalVsSystemImpl) {
            this.nextOriginalVsSystemImpl.reset();
            delete this.nextOriginalVsSystemImpl;
        }
        if(this.nextSystemVsChangeImpl) {
            this.nextSystemVsChangeImpl.reset();
            delete this.nextSystemVsChangeImpl;
        }
        if(!this.nextChangeVsOriginalImpl) {
            var style = {fontWeight: 'bold', color: Color.red};
            var extra = [
                [this.changeContext, this.originalContext],
                [this.changeCategory, this.originalCategory],
                [this.changeName, this.originalName]
                ];
            this.nextChangeVsOriginalImpl = new Differator(this.changeCodePane, this.originalCodePane, style, style, extra);
        }
        this.nextChangeVsOriginalImpl.next();
    },
    nextOriginalVsSystem: function() {
        if(this.nextChangeVsOriginalImpl) {
            this.nextChangeVsOriginalImpl.reset();
            delete this.nextChangeVsOriginalImpl;
        }
        if(this.nextSystemVsChangeImpl) {
            this.nextSystemVsChangeImpl.reset();
            delete this.nextSystemVsChangeImpl;
        }
        if(!this.nextOriginalVsSystemImpl) {
            var style = {fontWeight: 'bold', color: Color.red};
            var extra = [
                [this.originalContext, this.systemContext],
                [this.originalCategory, this.systemCategory],
                [this.originalName, this.systemName]
                ];
            this.nextOriginalVsSystemImpl = new Differator(this.originalCodePane, this.systemCodePane, style, style, extra);
        }
        this.nextOriginalVsSystemImpl.next();
    },
    nextSystemVsChange: function() {
        if(this.nextOriginalVsSystemImpl) {
            this.nextOriginalVsSystemImpl.reset();
            delete this.nextOriginalVsSystemImpl;
        }
        if(this.nextChangeVsOriginalImpl) {
            this.nextChangeVsOriginalImpl.reset();
            delete this.nextChangeVsOriginalImpl;
        }
        if(!this.nextSystemVsChangeImpl) {
            var style = {fontWeight: 'bold', color: Color.red};
            var extra = [
                [this.systemContext, this.changeContext],
                [this.systemCategory, this.changeCategory],
                [this.systemName, this.changeName]
                ];
            this.nextSystemVsChangeImpl = new Differator(this.systemCodePane, this.changeCodePane, style, style, extra);
        }
        this.nextSystemVsChangeImpl.next();
    },



    getChangeSetMenu: function() {
        var self = this;
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
        window.name = title;
        window.getPartsBinMetaInfo().addRequiredModule('lively.ChangeSets');
        window.copyToPartsBinWithUserRequest();
    },
    moveUp: function(t) {
        var i = this.changeSet.timestamps.indexOf(t);
        var record = this.changeSet.changeRecords.splice(i, 1)[0];
        this.changeSet.changeRecords.splice(i-1, 0, record);
        this.changeSet.reorderTimestamp(i, i-1);
        this.changePane.setList(this.changeSet.timestamps.concat([]));
    },
    moveDown: function(t) {
        var i = this.changeSet.timestamps.indexOf(t);
        var record = this.changeSet.changeRecords.splice(i, 1)[0];
        this.changeSet.changeRecords.splice(i+1, 0, record);
        this.changeSet.reorderTimestamp(i, i+1);
        this.changePane.setList(this.changeSet.timestamps.concat([]));
    },




    setChange: function(t) {
        delete this.nextOriginalVsSystemImpl;
        delete this.nextSystemVsChangeImpl;
        delete this.nextChangeVsOriginalImpl;
        if(!t) {
            this.originalCodePane.setTextString('');
            this.originalContext.setTextString('');
            this.originalCategory.setTextString('');
            this.originalName.setTextString('');
            this.systemCodePane.setTextString('');
            this.systemContext.setTextString('');
            this.systemCategory.setTextString('');
            this.systemName.setTextString('');
            this.changeCodePane.setTextString('');
            this.changeContext.setTextString('');
            this.changeCategory.setTextString('');
            this.changeName.setTextString('');
        	this.setActive(this.originalVsSystemButton, false);
        	this.setActive(this.systemVsChangeButton, false);
        	this.setActive(this.changeVsOriginalButton, false);
            return;
        }
        
        var changeRecord = ChangeSet.hydrateChange(t);
        if(changeRecord.type != "doIt") {
            this.originalCodePane.setTextString(changeRecord.originalSource);
            this.originalContext.setTextString(changeRecord.originalContextPath);
            this.originalCategory.setTextString(changeRecord.originalCategory);
            this.originalName.setTextString(changeRecord.originalPropertyName);
            this.setActive(this.changeVsOriginalButton, changeRecord.originalSource && changeRecord.source);
            var system, 
                contextPath = changeRecord.contextPath;
            system = lively.lookup(contextPath);
            if(!system) {
                contextPath = changeRecord.originalContextPath;
                system = lively.lookup(contextPath);
            }
            if(!system) {
                this.systemCodePane.setTextString("//Neither the current context: "+ changeRecord.contextPath + "\n//nor the original one: "+ changeRecord.originalContextPath+"//seem to be loaded");
                this.systemContext.setTextString('');
                this.systemCategory.setTextString('');
                this.systemName.setTextString('');
            	this.setActive(this.originalVsSystemButton, false);
            	this.setActive(this.systemVsChangeButton, false);
            } else {
                var name;
                if(system[changeRecord.propertyName] === undefined && changeRecord.originalPropertyName && changeRecord.originalPropertyName != changeRecord.propertyName)
                    name = changeRecord.originalPropertyName;
                else
                    name = changeRecord.propertyName;
                this.systemContext.setTextString(contextPath);
                this.systemName.setTextString(name);
                this.systemCodePane.setTextString(system[name]);

                var category,
                    systemContainer = system.lvCategoriesContainer();
                if(systemContainer)
                    category = systemContainer.lvCategoryForMethod(name);
                this.systemCategory.setTextString(category);
                this.setActive(this.originalVsSystemButton, system[name] && changeRecord.originalSource);
                this.setActive(this.systemVsChangeButton, system[name] && changeRecord.source);
            }
            this.changeCategory.setTextString(changeRecord.category);
            this.changeName.setTextString(changeRecord.propertyName);
        } else {
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
        	this.setActive(this.originalVsSystemButton, false);
        	this.setActive(this.systemVsChangeButton, false);
        	this.setActive(this.changeVsOriginalButton, false);
        }
        this.changeContext.setTextString(changeRecord.contextPath);
        this.changeCodePane.setTextString(changeRecord.source);
    },

    setChangeSet: function(name) {
        var storageRoot = ChangeSet.userStorageRoot;
    	this.setActive(this.originalVsSystemButton, false);
    	this.setActive(this.systemVsChangeButton, false);
    	this.setActive(this.changeVsOriginalButton, false);
        if(name == "-- ALL CHANGES --") {
            this.changeSet = null;
            var allTimestampsString = localStorage.getItem(storageRoot + ":timestamps");
            if(!allTimestampsString) {
                //no changes recorded yet
                this.changePane.setList([]);
                return;
            }
            this.changePane.setList(JSON.parse("["+ allTimestampsString +"]"));
        } else {
            this.changeSet = new ChangeSet(name, true);
            this.changePane.setList(this.changeSet.timestamps.concat([]));
        }
    },






    getChangeMenu: function() {
        var selected = this.changePane.selection;
        var items = [];
        if(!this.changeSet) {
            if(selected) {
                var changeSet = new ChangeSet(ChangeSet.defaultChangeSetName(), true);
                if(changeSet.timestamps.include(selected))
                    return items;
                else
                    return [
                            ['add to default changeset', function() {
                                changeSet.addTimestamp(selected)}]
                        ];
            }
            return items;
        }
        var self = this;
        var timestamps = this.changeSet.timestamps;
        var changeRecords = this.changeSet.changeRecords;
        if(timestamps.length > 1)
            items.push(
                ['apply all', function() {
                    self.changePane.getList().each(function(e){
                        ChangeSet.applyChange(changeRecords[timestamps.indexOf(e)], e);
                    })
                    if(selected)
                        self.setChange(selected);
                    }]);
        if(!selected)
            return items;
        items.push(
            ['apply selected', function() {
                ChangeSet.applyChange(changeRecords[timestamps.indexOf(selected)], selected);
                self.setChange(selected)}]);
        if(timestamps.indexOf(selected) < timestamps.length - 1)
            items.push(
                ['move down', function() {
                    self.moveDown(selected)}]);
        if(timestamps.indexOf(selected) > 0)
            items.push(
                ['move up', function() {
                    self.moveUp(selected)}]);
        items.push(
            ['remove', function() {
                self.removeFromChangeSet(selected)}]
        );
        return items;
    },


    removeFromChangeSet: function(t) {
        this.changeSet.changeRecords.removeAt(this.changeSet.timestamps.indexOf(t));
        this.changeSet.removeTimestamp(t);
        this.changePane.setList(this.changeSet.timestamps.concat([]));
    },




    removeAllChanges: function() {
        var self = this;
        $world.confirm('Are you sure you want to permanently remove all changes?', function(answer){
            if(answer) {
                ChangeSet.removeAllFromPersistentStorage();
                self.changeSetPane.setList(["-- ALL CHANGES --"]);
            	self.setChangeSet("-- ALL CHANGES --");
            }
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
    		
    		['changeLabel', this.newStaticTextPane, new Rectangle(0, 0.25, 0.333, 0.05), "Selected Change"],
    		['originalLabel', this.newStaticTextPane, new Rectangle(0.333, 0.25, 0.334, 0.05), "Original Source"],
    		['systemlLabel', this.newStaticTextPane, new Rectangle(0.667, 0.25, 0.333, 0.05), "System Source"],

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
    	
    	this.changeLabel.applyStyle({fontWeight: 'bold'});
    	this.originalLabel.applyStyle({fontWeight: 'bold'});
    	this.systemlLabel.applyStyle({fontWeight: 'bold'});
    	
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
                        ChangeSet.applyChange(selected);
                        self.setChange(selected)}]);
        return items;
    },

    applyAllChanges: function() {
        var self = this;
        this.changePane.getList().each(function(e){
            ChangeSet.applyChange(e);
        })
    },



    setChange: function(changeRecord) {
        if(changeRecord.type != "doIt") {
            this.originalCodePane.setTextString(changeRecord.originalSource);
            this.originalContext.setTextString(changeRecord.originalContextPath);
            this.originalCategory.setTextString(changeRecord.originalCategory);
            this.originalName.setTextString(changeRecord.originalPropertyName);
            var system, 
                contextPath = changeRecord.contextPath;
            system = lively.lookup(contextPath);
            if(!system) {
                contextPath = changeRecord.originalContextPath;
                system = lively.lookup(contextPath);
            }
            if(!system) {
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

                var category,
                    systemContainer = system.lvCategoriesContainer();
                if(systemContainer)
                    category = systemContainer.lvCategoryForMethod(name);
                this.systemCategory.setTextString(category);
            }
            this.changeCategory.setTextString(changeRecord.category);
            this.changeName.setTextString(changeRecord.propertyName);
        } else {
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
	        return e.type  + prop + " in " + e.contextPath;
    	};
    }


});

lively.morphic.Panel.subclass('lively.SimpleCodeBrowser',

// new lively.SimpleCodeBrowser(pt(640, 480)).openIn($world, 'Simple Code Browser')

'accessing', {
    selectedCategory: function selectedCategory() {
        var category = this.selectedFunctionKind && 
                this.selectedFunctionKind.substring(0, this.selectedFunctionKind.indexOf(' - '));
                
        var categoriesContainer = this.codePane.doitContext.lvCategoriesContainer();
        if(categoriesContainer && categoriesContainer.categories[category])
            return category;
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
        this.codePane.doSave = this.codePaneDoSave;
        this.functionPane.enableMultipleSelections();
        this.functionPane.allowDeselectClick = true;
        this.functionPane.noSingleSelectionIfMultipleSelected = true;
        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        var updater = function($upd, newValue, oldValue) {
                        var list = this.sourceObj, browser = this.targetObj;
                        browser.checkSourceNotAccidentlyDeleted(
                            function confirmCallback() {
                                $upd(newValue, oldValue);
                            }, 
                            function cancelCallback() {
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
            this.codePane.savedTextString = '';
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
        debugger;
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
                if(allProtoNames.length > 0) {
                    var defaultCategory = categories.detect(function(e){
                        return e.string == 'default category - proto';
                    })
                    if(defaultCategory) {
                        defaultCategory.names = defaultCategory.names.concat(allProtoNames);
                        defaultCategory.names.sort();
                    } else
                        categories.push({string: 'default category - proto', names: allProtoNames.sort()});
                }
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
    addClass: function addClass() {
        var classesPane = this.functionContainerPane,
            panel = this;

        this.checkSourceNotAccidentlyDeleted(function() {
            $world.editPrompt('new (fully qualified) class name', function(className) {
                if(!className || className.trim().length == 0)
                    return;
                className = className.trim();
                
                var currentNames = classesPane.getList().collect(function(e){return e.type || e.name});
                if(currentNames.include(className)) {
                    $world.alert('class name already in use');
                    return;
                }
    
                $world.editPrompt('fully qualified superclass name', function(superclassName) {
                    if(!superclassName || superclassName.trim().length == 0)
                        return;
                    superclassName = superclassName.trim();
                    
                    if(!currentNames.include(superclassName)) {
                        $world.alert('superclass ' + superclassName + ' does not exist or is not loaded');
                        return;
                    }
        
                    var targetScope = lively.Class.namespaceFor(className);
                    var contextPath = targetScope.lvContextPath();
                    if(!contextPath)
                        throw new Error("Should not happen");
                    var func = lively.lookup(superclassName).subclass(className, 'default category', {initialize: Functions.Empty});
                    var shortName = lively.Class.unqualifiedNameFor(className);

                    func.timestamp = ChangeSet.logAddition(superclassName + ".subclass('" + className + "', 'default category', {initialize: " + Functions.Empty + "})", contextPath, shortName);
                    ChangeSet.logAddition(Functions.Empty.toString(), contextPath + "." + shortName + ".prototype", "initialize");
                    func.kindOfChange = "added";
                    func.user = $world.getUserName();
        
                    panel.setFunctionContainerKind(panel.selectedContainerKind);
                    classesPane.setSelectionMatching(shortName);
                });
            });
        });
    },

    newDropDownListPane: function newDropDownListPane(extent, optItems) {
        var list = new lively.morphic.DropDownList(extent, optItems);
        list.applyStyle({scaleProportional: true});
        list.onBlur = function(evt){};
        return list;
    },

    browseVersions: function(timestamp) {

        var current = ChangeSet.getChangeRecord(timestamp);
        var propertyName = current.propertyName;
        current.string = new Date(timestamp).toUTCString() + ' (current)';
        var versions = [current];
        var firstChangeStamp = current.firstChangeStamp;
        if(firstChangeStamp) {
            var firstChangeRecord = ChangeSet.getChangeRecord(firstChangeStamp);
            if(firstChangeRecord.type != "added") {
                var previouslyInTheSystem = {string: 'previously in the system'};
                previouslyInTheSystem.contextPath = firstChangeRecord.originalContextPath;
                previouslyInTheSystem.propertyName = firstChangeRecord.originalPropertyName;
                previouslyInTheSystem.category = firstChangeRecord.originalCategory;
                previouslyInTheSystem.source = firstChangeRecord.originalSource;
            }
        }
        var t = current.previousChangeStamp;
        var changeRecord = current;
        while(t) {
            changeRecord = ChangeSet.getChangeRecord(t);
            changeRecord.string = new Date(t).toUTCString();
            versions.push(changeRecord);
            t = changeRecord.previousChangeStamp;
        }
        if(previouslyInTheSystem)
            versions.push(previouslyInTheSystem);

        var browser = new VersionsBrowser(pt(1024, 384));
        var window = browser.openIn($world, propertyName + ' versions ');
        browser.setContents(versions);
        browser.setVersion1(current);
        browser.codeBrowser = this;
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
                (function(){eval('this.' + functionName + ' = ' + text)}).call(this.doitContext);
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
                    }
                    this.setTextString(this.savedTextString);
                    panel.functionKindPane.setSelectionMatching(panel.selectedFunctionKind);
                    panel.functionPane.setSelectionMatching(functionName);
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
                titleRenderFunction: function(e){return "Class " + (e.type || e.name)},
                listRenderFunction: function(e){return e.name || e.type},
                containers: function(){return classes(true)},
                nonStaticContainer: function(e){return e.prototype}}, 
                
           {string: "loaded non-class global constructors", 
                titleRenderFunction: function(e){return e.name || e.lvDisplayName},
                listRenderFunction: function(e){return e.name || e.lvDisplayName},
                containers: function(){return nonClassConstructors(true)},
                nonStaticContainer: function(e){return e.prototype}}, 
                
            {string: "loaded traits", 
                titleRenderFunction: function(e){return "Trait " + e.name},
                listRenderFunction: function(e){return e.name},
                containers: function(){
                    return Global.RealTrait ? Object.values(RealTrait.prototype.traitRegistry) : []},
                nonStaticContainer: function(e){return e.def}}, 
                
            {string: "loaded modules", 
                titleRenderFunction: function(e){return "Module " + e.name()},
                listRenderFunction: function(e){return e.name()},
                containers: function(){
                    return subNamespaces(true).select(function(e){
                        return !e.isAnonymous() && e.lvOwnFunctionNames().length > 0
                    })},
                nonStaticContainer: function(e){return null}}, 
                
            {string: "loaded build specs", 
                titleRenderFunction: function(e){
                    var name = lively.persistence.BuildSpec.Registry.nameForSpec(e);
                    return 'lively.BuildSpec(' + (name ? '"' + name + '", ' : '') + '{className: ' + e.attributeStore.className + '})';
                    },
                listRenderFunction: function(e){return e.string},
                containers: function(){return instantiatedBuildSpecsAndSubmorphsWithPaths()},
                nonStaticContainer: function(e){return e.attributeStore}}, 
                
           {string: "loaded commands", 
                titleRenderFunction: function(e){
                    var key = Properties.nameFor(lively.ide.commands.byName, e)
                    var binding = lively.ide.commands.getKeyboardBindings()[key];
                    if(binding && typeof binding.valueOf() != "string") {
                        if (navigator.appVersion.indexOf("Win")!=-1)
                            binding = binding.win;
                        else if (navigator.appVersion.indexOf("Mac")!=-1)
                            binding = binding.mac;
                    }
                    if(binding)
                        binding = binding.replace("-s-", "-shift-");
                    return e.description + (binding ? "      (" + binding + ")" : "")},
                listRenderFunction: function(e){ return Properties.nameFor(lively.ide.commands.byName, e)},
                containers: function(){return Object.values(lively.ide.commands.byName)},
                nonStaticContainer: function(e){return null}}, 
                
            {string: "loaded layers", 
                titleRenderFunction: function(e){return "Layer " + e.lvContextPath()},
                listRenderFunction: function(e){
                    var parts = e.lvContextPath().split("[");
                    return lively.lookup(parts[0]).name + "[" + parts[1]},
                containers: function(){return layeredFunctionContainers()},
                nonStaticContainer: function(e){return null}},
                
            {string: "well-known global containers", 
                titleRenderFunction: function(e){return "Global object " + e.lvContextPath()},
                listRenderFunction: function(e){return e.lvContextPath()},
                containers: function(){
                    return [Global, Arrays, Grid, Interval, JSON, Math, lively.ArrayProjection, console, location, 
                        Functions, Numbers, Objects, Properties, Strings, lively.LocalStorage, lively.Worker]},
                nonStaticContainer: function(e){return null}} 
        ]
    },


    getFunctionContainerMenu: function getFunctionContainerMenu() {
        if(this.selectedContainerKind.string != "loaded classes")
            return [];
        var self = this;
        return [
            ['add class', function() {self.addClass()}]
        ];
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
                ['move to...', function() {self.moveProperty()}],
                ['remove', function() {self.removeProperty()}],
                ['rename as... ', function() {self.renameProperty()}],
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
    moveProperty: function addProperty() {
        var codePane = this.codePane,
            context = codePane.doitContext,
            functionPane = this.functionPane,
            functionName = this.selectedFunctionNameInContainer,
            selectedContainer = this.selectedContainer,
            panel = this;

        this.checkSourceNotAccidentlyDeleted(function() {
            $world.editPrompt('new container name', function(containerName) {
                if(!containerName || containerName.trim().length == 0)
                    return;
                containerName = containerName.trim();
                var newContext = lively.lookup(containerName);
                if(!newContext) {
                    $world.alert('Cannot resolve new container name '+ containerName);
                    return;
                }
                        
                var currentNames = newContext.lvOwnFunctionNames();
                if(currentNames.include(functionName)) {
                    $world.alert('method name already exists in target container');
                    return;
                }
    
                var newContextPath = newContext.lvContextPath();
                if(!newContextPath)
                    throw new Error("Should not happen");
                var contextPath = context.lvContextPath();
                if(!contextPath)
                    throw new Error("Should not happen");
                var func = context[functionName];
                newContext[functionName] = func;
                delete context[functionName];
    
                var category = panel.selectedCategory();
                if (category) {
                    selectedContainer.lvRemoveMethodFromExistingCategory(functionName, category);
                    var newContainer = newContext.lvCategoriesContainer();
                    if(newContainer) {
                        newContainer.lvAddCategoryIfAbsent(category);
                        newContainer.lvAddMethodToExistingCategory(func, functionName, category);
                    }
                }
                
                if(func.user && func.timestamp)
                    //already modified
                    func.timestamp = ChangeSet.logChange(func.toString(), newContextPath, functionName, category, func.timestamp);
                else
                    //first change
                    func.timestamp =  ChangeSet.logFirstChange(func.toString(), newContextPath, functionName, category, category, null, contextPath);
                if(func.timestamp) {
                    func.user = $world.getUserName();
                    func.kindOfChange = "moved";
                }
    
                panel.setFunctionContainer(selectedContainer);          //recompute the categories' contents
                panel.functionKindPane.setSelectionMatching(panel.selectedFunctionKind);
            });
        });
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
                if(!functionName || functionName.trim().length == 0)
                    return;
                functionName = functionName.trim();
                
                var currentNames = functionPane.getList().collect(function(e){return e.string});
                if(currentNames.include(functionName)) {
                    $world.alert('method name already in use');
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
                
                func.timestamp = ChangeSet.logAddition("function(){}", contextPath, functionName, category);
                func.kindOfChange = "added";
                func.user = $world.getUserName();
    
                lively.bindings.noUpdate(panel.setFunctionContainer.bind(panel, selectedContainer));
                panel.functionKindPane.setSelectionMatching(panel.selectedFunctionKind);
                functionPane.setSelectionMatching(functionName);
            });
        });
    },
    renameProperty: function addProperty() {
        var context = this.codePane.doitContext,
            oldFunctionName = this.selectedFunctionNameInContainer,
            func = context[oldFunctionName],
            functionPane = this.functionPane,
            selectedContainer = this.selectedContainer,
            panel = this;

        this.checkSourceNotAccidentlyDeleted(function() {
            $world.editPrompt('new method name', function(functionName) {
                if(!functionName || functionName.trim().length == 0)
                    return;
                functionName = functionName.trim();
                        
                var currentNames = functionPane.getList().collect(function(e){return e.string});
                if(currentNames.include(functionName)) {
                    $world.alert('method name already in use');
                    return;
                }
                var contextPath = context.lvContextPath();
                if(!contextPath)
                    throw new Error("Should not happen");
                if(func.name == oldFunctionName)
                    func.name = functionName;
                context[functionName] = func;
                delete context[oldFunctionName];
    
                var category = panel.selectedCategory();
                if (category) {
                    selectedContainer.lvRemoveMethodFromExistingCategory(oldFunctionName, category);
                    selectedContainer.lvAddMethodToExistingCategory(func, functionName, category);
                }
                
                if(func.user && func.timestamp)
                    //already modified
                    func.timestamp = ChangeSet.logChange(func.toString(), contextPath, functionName, category, func.timestamp);
                else
                    //first change
                    func.timestamp =  ChangeSet.logFirstChange(func.toString(), contextPath, functionName, category, category, null, null, oldFunctionName);
                if(func.timestamp) {
                    func.user = $world.getUserName();
                    func.kindOfChange = "renamed";
                }
                
                lively.bindings.noUpdate(panel.setFunctionContainer.bind(panel, selectedContainer));    //recompute the categories' contents
                panel.functionKindPane.setSelectionMatching(panel.selectedFunctionKind);                //reselect current category
                functionPane.setSelectionMatching(functionName);                                        //reselect current function
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
            categories.unshift('<new category>');
            
            var proceed = function(otherCategory) {
                var contextPath = panel.codePane.doitContext.lvContextPath();
                if(!contextPath)
                    throw new Error("Should not happen");
                if(category)
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

                panel.setFunctionContainer(container);
                functionKindPane.setSelectionMatching(otherCategory + ' - proto');
                panel.functionPane.setSelectionMatching(functionName);
            }
    
            $world.listPrompt('change category to...', function(newCategory) {
                        
                if(newCategory == '<new category>')
                    $world.editPrompt('new category', function(newCategory) {
                        if(newCategory && newCategory.trim().length > 0) {
                            newCategory = newCategory.trim();
                            container.lvAddCategoryIfAbsent(newCategory);
                            proceed(newCategory);
                        }
                    });
                else if(newCategory)
                    proceed(newCategory);
            }, categories);
        });
    },
    removeProperty: function removeProperty () {
        var functionName = this.selectedFunctionNameInContainer,
            context = this.codePane.doitContext,
            func = context[functionName],
            selectedContainer = this.selectedContainer,
            panel = this;

        $world.confirm('Are you sure you want to remove this method?', function(answer){
            if(!answer)
                return;
            
            var contextPath = context.lvContextPath();
            if(!contextPath)
                throw new Error("Should not happen");
            
            delete context[functionName];
    
            var category = panel.selectedCategory();
            if (category)
                selectedContainer.lvRemoveMethodFromExistingCategory(functionName, category);
            
            if(func.user && func.timestamp)
                //modified
                ChangeSet.logRemoval(contextPath, functionName, category, func.timestamp);
            else
                ChangeSet.logFirstRemoval(func.toString(), contextPath, functionName, category);
    
            panel.setFunctionContainer(selectedContainer);          //recompute the categories' contents
            panel.functionKindPane.setSelectionMatching(panel.selectedFunctionKind);                //reselect current category
        });
    }
}
);

lively.morphic.Panel.subclass('VersionsBrowser',
'default category', {
    buildView: function buildView() {  // this.buildView()
        this.withAllSubmorphsDo(function(m) {disconnectAll(m)});
        this.removeAllMorphs();

    	this.createAndArrangePanesFrom([
    		['changePane', this.newListPane, new Rectangle(0, 0, 1, 0.35)],
    		
    		['timestamp1', this.newStaticTextPane, new Rectangle(0, 0.35, 0.4, 0.05)],
    		['diffButton', this.newButton, new Rectangle(0.4, 0.35, 0.2, 0.05), "Next diff"],
    		['timestamp2', this.newStaticTextPane, new Rectangle(0.6, 0.35, 0.4, 0.05)],

    		['codePane1', this.newCodePane, new Rectangle(0, 0.4, 0.5, 0.6)],
    		['codePane2', this.newReadOnlyCodePane, new Rectangle(0.5, 0.4, 0.5, 0.6)],
    	]);
    	
    	this.setActive(this.diffButton, false);
        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        connect(this.changePane, "selection", this, "setVersion2", {});
        connect(this.changePane, "getMenu", this, "getChangeMenu", {});
        connect(this.diffButton, "fire", this, "nextDiff", {});
    
    },
    getChangeMenu: function() {
        var self = this;
        var selected = this.changePane.selection;
        if(!selected)
            return [];
        var items = [
            ['show selected in left code pane', function() {
                self.setVersion1(selected)}],
            ['show selected in right code pane', function() {
                self.setVersion2(selected)}]
        ];
        if(!selected.string.endsWith(' (current)'))
            items.push(
                ['revert current source to selected', this.revertCurrentSourceToSelected.bind(this) ]
            );
        return items;
    },
    setVersion1: function(selected) {
        if(this.nextDiffImpl) {
            this.nextDiffImpl.reset();
            delete this.nextDiffImpl;
        }
        this.setActive(this.diffButton, this.timestamp2.textString != selected.string);
        this.timestamp1.setTextString(selected.string);
        this.codePane1.setTextString(selected.source);
    },
    nextDiff: function() {
        if(!this.nextDiffImpl) {
            var style = {fontWeight: 'bold', color: Color.red};
            this.nextDiffImpl = new Differator(this.codePane1, this.codePane2, style, style);
        }
        this.nextDiffImpl.next();
    },


    revertCurrentSourceToSelected: function() {
        var changes = this.changePane.getList();
        var selected = this.changePane.selection;
        var current = changes[0];
        if(selected.source == current.source) {
            alertOK("The current source and the one of the selected version are the same");
            return;
        }
        var oldFunc = lively.lookup(current.contextPath + '.' + current.propertyName);
        try {
            eval(current.contextPath + '.' + current.propertyName + ' = ' + selected.source);
        } catch(e) {
            $world.logError(e);
            return;
        }
        var func = lively.lookup(current.contextPath + '.' + current.propertyName);
        func.timestamp = ChangeSet.logChange(selected.source, current.contextPath, current.propertyName, current.category, oldFunc.timestamp);
        if(func.timestamp) {
            var newChange = ChangeSet.getChangeRecord(func.timestamp);
            newChange.string = new Date(func.timestamp).toUTCString() + ' (current)';
            func.user = $world.getUserName();
            func.kindOfChange = "changed source";
            changes.unshift(newChange);
        }
        var newCurrentString = current.string.substring(0, current.string.lastIndexOf(' (current)'));
        if(this.timestamp1.textString == current.string)
            this.timestamp1.setTextString(newCurrentString);
        if(this.timestamp2.textString == current.string)
            this.timestamp2.setTextString(newCurrentString);
        current.string = newCurrentString;

        this.changePane.setList(changes);
        this.codeBrowser.functionKindPane.setSelectionMatching(this.codeBrowser.selectedFunctionKind);
        this.codeBrowser.functionPane.setSelectionMatching(current.propertyName);
    },

    setContents: function(list) {
        this.changePane.setList(list);
    },
    setVersion2: function(selected) {
        if(this.nextDiffImpl) {
            this.nextDiffImpl.reset();
            delete this.nextDiffImpl;
        }
        this.setActive(this.diffButton, this.timestamp1.textString != selected.string);
        this.timestamp2.setTextString(selected.string);
        this.codePane2.setTextString(selected.source);
    }
});

Object.subclass('Differator',
'default category', {

    initialize: function(text1, text2, styleSpec1, styleSpec2, optExtraTexts) {
        var differ = new JsDiff.Diff();
        var string1 = text1.textString;
        var string2 = text2.textString;
        var whitespace = {};
        whitespace[string1] = [];
        whitespace[string2] = [];
        differ.tokenize = function(input) {
            var strings = [];
            lively.ast.acorn.tokens(input).each(function(token){
                if(token.type == "whitespace")
                    whitespace[input].push([token.start, token.value.length]);
                strings.push(input.substring(token.start, token.end).valueOf());     //Diff uses === for comparison
            })
            return strings;
        }
        var diffList = differ.diff(string1, string2);
        var index1 = 0, index2 = 0;
        var desynchronizations = [];
        diffList.each(function(e) {
            var previous = desynchronizations.last();
            if (e.added) {
                if(whitespace[string2][0].include(index2) && whitespace[string2][1] == e.value.length)
                    index2 += e.value.length;
                else
                    if (previous && !previous.ranges[1])
                        //We condense a removal followed by an addition into a single change;
                        //if something changed, we want to show it simultaneously on both sides 
                        previous.ranges[1] = [index2, index2 += e.value.length, styleSpec2];
                    else
                        desynchronizations.push(
                            {targets: [text1, text2],
                            ranges: [undefined, [index2, index2 += e.value.length, styleSpec2]]});
            }
            if (e.removed) {
                if(whitespace[string1][0].include(index1) && whitespace[string1][1] == e.value.length)
                    index1 += e.value.length;
                else
                    if (previous && !previous.ranges[0])
                        //We condense an addition followed by a removal into a single change;
                        //if something changed, we want to show it simultaneously on both sides
                        previous.ranges[0] = [index1, index1 += e.value.length, styleSpec1];
                    else
                        desynchronizations.push(
                            {targets: [text1, text2],
                            ranges: [[index1, index1 += e.value.length, styleSpec1], undefined]});
            }
            if (!e.added && !e.removed) {
                index1 += e.value.length;
                index2 += e.value.length;
            }
        });
        if(optExtraTexts) {
            optExtraTexts.each(function(e){
                if(e[0].textString != e[1].textString)
                    desynchronizations.push(
                        {targets: [e[0], e[1]],
                        ranges: [[0, e[0].textString.length, styleSpec1], [0, e[1].textString.length, styleSpec2]]});
            })
        }
        this.desynchronizations = desynchronizations;
        this.cursor = -1;
    },
    next: function() {
        if(this.desynchronizations.length == 0)
            return;
        this.removeEmphasis();
        this.cursor++;
        if(this.cursor > 0 && this.cursor == this.desynchronizations.length)
            this.cursor = 0;
        this.setEmphasis();
    },
    setEmphasis: function() {
        if(this.cursor < 0)
            return;
        var rangesAndTargets = this.desynchronizations[this.cursor];
        var ranges = rangesAndTargets.ranges;
        var targets = rangesAndTargets.targets;
        if (ranges[0]) 
            targets[0].emphasizeRanges([ranges[0]]);
        if (ranges[1]) 
            targets[1].emphasizeRanges([ranges[1]]);
    },

    removeEmphasis: function() {
        if(this.cursor < 0)
            return;
        var targets = this.desynchronizations[this.cursor].targets;
        targets[0].unEmphasizeAll();
        targets[1].unEmphasizeAll();
    },

    reset: function() {
        this.removeEmphasis();
        this.cursor = -1;
    }



}
);
    
lively.morphic.Panel.subclass('FunctionComparer',
'default category', {
    buildView: function buildView() {  // this.buildView()
        this.withAllSubmorphsDo(function(m) {disconnectAll(m)});
        this.removeAllMorphs();

    	this.createAndArrangePanesFrom([
    		['timestamp1', this.newStaticTextPane, new Rectangle(0, 0, 0.4, 0.05)],
    		['diffButton', this.newButton, new Rectangle(0.4, 0, 0.2, 0.05), "Next diff"],
    		['timestamp2', this.newStaticTextPane, new Rectangle(0.6, 0, 0.4, 0.05)],

    		['codePane1', this.newCodePane, new Rectangle(0, 0.05, 0.5, 0.6)],
    		['codePane2', this.newReadOnlyCodePane, new Rectangle(0.5, 0.05, 0.5, 0.6)],
    	]);
    	
    	this.setActive(this.diffButton, false);
        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        connect(this.diffButton, "fire", this, "nextDifference", {});
    
    },
    nextDifference: function() {
        if(!this.nextDiffImpl) {
            var style = {fontWeight: 'bold', color: Color.red};
            this.nextDiffImpl = new Differator(this.codePane1, this.codePane2, style, style);
        }
        this.nextDiffImpl.next();
    },


    setContents: function(list) {
    },
});

lively.morphic.Morph.addMethods("iterating", {
    gatherWithPath: function(array, rootContextPath, parentPath, indexPath) {

        var myPath;
        if(this.name)
            myPath = 
                parentPath ? parentPath.split('.')[0] + '.'  + this.name : this.name;
        else
            myPath = (parentPath ? parentPath : rootContextPath) + '.submorphs[' + indexPath.split('.').last() + ']';
            
        array.push({string: myPath, value: this});
        var contextPath = rootContextPath;
        if(this.name)
            contextPath += (parentPath ? ".get('" + parentPath.split('.')[0] + "').get('" : ".get('") + this.name + "')";
        else
            indexPath.split('.').each(function(i){
                contextPath += '.submorphs[' + i + ']';
            })
        addOwnPropertyIfAbsent(this, 'lvContextPath', function(){return contextPath});

        if(!this.submorphs)
            return;
            
        for (var i = 0; i < this.submorphs.length; i++)
            this.submorphs[i].gatherWithPath(array, rootContextPath, myPath, (indexPath ? indexPath + '.' : '') + i);
    },
});

lively.persistence.SpecObject.addMethods("iterating", {
    gatherWithPath: function(array, rootContextPath, parentPath, indexPath) {

        var props = this.attributeStore;
        var myPath;
        if(props.name)
            myPath = 
                parentPath ? parentPath.split('.')[0] + '.'  + props.name : props.name;
        else
            myPath = parentPath + '.submorphs[' + indexPath.split('.').last() + ']';
            
        array.push({string: myPath, value: this});
        var contextPath = rootContextPath;
        if(indexPath) {
            indexPath.split('.').each(function(i){
                contextPath += '.attributeStore.submorphs[' + i + ']';
            })
            addOwnPropertyIfAbsent(this, 'lvContextPath', function(){return contextPath});
        }
        addOwnPropertyIfAbsent(props, 'lvContextPath', function(){return contextPath + '.attributeStore'});

        if(!props.submorphs)
            return;
            
        for (var i = 0; i < props.submorphs.length; i++)
            props.submorphs[i].gatherWithPath(array, rootContextPath, myPath, (indexPath? indexPath + '.' : '') + i);
    },
});

Object.extend(Global, {

    nonClassConstructors: function(recursive) {
        Intl.Collator.lvDisplayName = "Collator";
        Intl.DateTimeFormat.lvDisplayName = "DateTimeFormat";
        Intl.NumberFormat.lvDisplayName = "NumberFormat";
        var result = [Intl.Collator, Intl.DateTimeFormat, Intl.NumberFormat];
        Object.getOwnPropertyNames(this).each(function(name) {
            var object;
            if (!this.__lookupGetter__(name) &&
                (object = this[name]) instanceof Function &&
                (!object.name || object.name == name) &&
                !lively.Class.isClass(object) &&
                object.lvIsConstructor()) {
                    result.push(object);
                    if(!object.lvContextPath())
                        addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return name;});
                    if(!object.prototype.lvContextPath())
                        addOwnPropertyIfAbsent(object.prototype, 'lvContextPath', function(){return name + ".prototype";});
                    if(!object.name)
                        object.lvDisplayName = name}}, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.nonClassConstructors(true)) }).uniq();
    },
    layers: function (recursive) {
        var result = [];
        Object.keys(this).each(function(name) {
            var object;
            if (!this.__lookupGetter__(name) &&
                (object = this[name]) instanceof Layer) {
                    result.push(object);
                    if(!object.lvContextPath())
                        addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return name;});
                    }}, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.layers(true)) });
    },

    knownFunctionContainers: function() {
        var known = subNamespaces(true).select(function(e){return !e.isAnonymous()}).concat(Object.values(lively.ide.commands.byName)).concat([Global, Arrays, Grid, Interval, JSON, Math, lively.ArrayProjection, console, location, Functions, Numbers, Objects, Properties, Strings, lively.LocalStorage, lively.Worker]).concat(layeredFunctionContainers());
        
        classes(true).concat(nonClassConstructors(true)).each(function(e){
            known.push(e); if(e.prototype) known.push(e.prototype)});
        
        instantiatedBuildSpecsAndSubmorphsWithPaths().each(function(e){if(e.attributeStore) known.push(e.attributeStore)});
        
        Object.values(RealTrait.prototype.traitRegistry).each(function(e){known.push(e.def)});
        
        return known.concat(morphFunctionContainers())
    },
    morphFunctionContainers: function() {

        var list = []; 
        var submorphs = $world.submorphs;
        for (var i = 0; i < submorphs.length; i++)
            submorphs[i].gatherWithPath(list, "$world", null, "" + i);
        return list.select(function(e){return e.value.lvOwnFunctionNames().length > 0});
    },

    layeredFunctionContainers: function() {
        var result = [];
        layers(true).each(function(layer){
            Object.keys(layer).each(function(key){
                if(key - 0 != key)  //not a number
                    return;
                var container = layer[key];
                result.push(container);
                if(!container.lvContextPath()) {
                    var path = layer.lvContextPath() + "[" + key + "]";
                    addOwnPropertyIfAbsent(container, 'lvContextPath', function(){return path;});
                }
            })
        });
        return result;
    },

    allImplementors: function() {
        var implementors = {};
        var objectProtoNames = Object.getOwnPropertyNames(Object.prototype);
        knownFunctionContainers().each(function(e){
            e.lvOwnFunctionNames().each(function(n){
                if(objectProtoNames.indexOf(n) == -1) {
                    var existing = implementors[n];
                    if(existing)
                        existing.push(e);
                    else
                        implementors[n] = [e];
                }
            })
        });
        return implementors
    },


    allFunctionContainers: function() {
        var result = [];
        var allFunctions = function(visited) {
            var keys = Object.getOwnPropertyNames(this), l = keys.length, functionContainer = false;
            for(var i=0; i<l; i++) {
                var name = keys[i];
                if(name == 'lvContextPath' || name == 'lvOwnFunctionNames' || name == 'constructor') continue;
                var prop = null;
                try {
                    var d = Object.getOwnPropertyDescriptor(this, name);
                    if(d && !d.get) prop = this[name];
                } catch(e){}
                if( prop instanceof Function && (!prop.name || prop.name == name || prop.methodName == name) && 
                    !prop.lvIsConstructor() && (name != 'caller' || !(this instanceof Function)))
                        functionContainer = true;
                if((prop instanceof Function && !prop.isWrapper || typeof prop == "object" && prop && !(prop instanceof Boolean || prop instanceof Number || prop instanceof String || prop instanceof Date || prop instanceof RegExp || prop instanceof MimeTypeArray || prop instanceof MimeType || prop instanceof Plugin)) && visited.indexOf(prop) === -1) {
                    visited.push(prop);
                    try {
                        var localResult = allFunctions.call(prop, visited);
                        if(localResult)
                            return name + "." + localResult;
                        }
                    catch(e){return name}
                }
            }
            if(functionContainer)
                result.push(this);
        }
        allFunctions.call(this, []);
        return result;
    },



    instantiatedPublishedParts: function() {
        var result = [];
        $world.submorphs.each(function(e){
            var info = e.getPartsBinMetaInfo();
            if(info.partsSpaceName && info.partName)
                result.push(e);
        });
        return result;
    },
    instantiatedPublishedPartsAndSubmorphsWithPaths: function () {

        var list = []; 
        $world.submorphs.each(function(e){
            var info = e.getPartsBinMetaInfo();
            if(info.partsSpaceName && info.partName) {
                var myParentPath = info.partsSpaceName;
                if(myParentPath.charAt(myParentPath.length - 1) == '/')
                    myParentPath += info.partName;
                else
                    myParentPath += '/' + info.partName;
                e.gatherWithPath(list, myParentPath);
            }
        });
        return list;
    },


    instantiatedBuildSpecsAndSubmorphsWithPaths: function () {

        var list = []; 
        Properties.ownValues(lively.persistence.BuildSpec.Registry).each(function(e){
            e.gatherWithPath(list, e.lvContextPath());
        });
        return list;
    },
    implementors: function(searchString) {
        var queryPattern, re;
        var wildcardIndex = searchString.indexOf('*');
        if(wildcardIndex >= 0) {
            queryPattern = searchString.replace(/\*/g, '\\w*');
            if(wildcardIndex !== 0) {
                queryPattern = '\\b' + queryPattern;
            }
            if(searchString.lastIndexOf('*') != searchString.length - 1) {
                queryPattern = queryPattern + '\\b';
            }
        }
        re = new RegExp(queryPattern, 'i');
        var names = [];
        var containers = [];
        knownFunctionContainers().each(function(e){
            e.lvOwnFunctionNames().each(function(n){
                if(n.match(re)) {
                    var index = names.indexOf(n);
                    if(index == -1) {
                        names.push(n);
                        containers.push([e]);
                    } else 
                        containers[index].push(e);
                }
            })
        });
        return {names: names, containers: containers}
    },
    
    senders: function(searchString) {
        // senders("match")
        var queryPattern = '\\b' + searchString + '\\b';
        var re = new RegExp(queryPattern);
        var gre = new RegExp(queryPattern, 'g');
        var names = [];
        var containers = [];
        knownFunctionContainers().each(function(e){
            e.lvOwnFunctionNames().each(function(n){
                var f = e[n];
                if (!f || !f.getOriginal) return;
                var source = String(f.getOriginal())
                if (source.match(re) && (searchString != n || source.match(gre).length > 1)) {
                    var programNode = lively.ast.acorn.parse("var f = " + source);
                    var matched = false;
                    lively.ast.acorn.simpleWalk(programNode, {
                        MemberExpression: function(node) { if(source[node.end - 8] != "." && node.property.name == searchString) matched = true; },
                        Identifier: function(node) { if(source[node.end - 8] != "." && node.name == searchString) matched = true; }
                    });
                    if(!matched) return;
                    var index = names.indexOf(n);
                    if(index == -1) {
                        names.push(n);
                        containers.push([e]);
                    } else 
                        containers[index].push(e);
                }
            })
        });
        return {names: names, containers: containers}
    }
    });
    
lively.Module.addMethods("iterating", {
    nonClassConstructors: function(recursive) {
        var result = [];
        Object.getOwnPropertyNames(this).each(function(name) {
            if(name == 'nonClassConstructors') debugger;
            var object;
            if (!this.__lookupGetter__(name) &&
                (object = this[name]) instanceof Function &&
                (!object.name || object.name == name) &&
                !lively.Class.isClass(object) &&
                object.lvIsConstructor()) {
                    result.push(object);
                    var path = this.name() + "." + name;
                    if(!object.lvContextPath())
                        addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return path});
                    if(!object.prototype.lvContextPath())
                        addOwnPropertyIfAbsent(object.prototype, 'lvContextPath', function(){return path + ".prototype";});
                    if(!object.name)
                        object.lvDisplayName = name}}, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.nonClassConstructors(true)) }).uniq();
    },
    layers: function (recursive) {
        var result = [];
        Object.keys(this).each(function(name) {
            var object;
            if (!this.__lookupGetter__(name) &&
                (object = this[name]) instanceof Layer) {
                    result.push(object);
                    if(!object.lvContextPath()) {
                        var path = this.name() + "." + name;
                        addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return path});
                    }}}, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.layers(true)) });
    }});

}) // end of module
































































