module('lively.ChangeSets').requires('lively.Traits', 'lively.persistence.BuildSpec', 'lively.morphic.MorphAddons').requiresLib({url: Config.codeBase + 'lib/jsdiff/jsdiff.js', loadTest: function() { return typeof JsDiff !== 'undefined'; }}).toRun(function() {

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
            if(this.constructor instanceof Function && this.constructor.prototype === this)
                return this.constructor;
            var sampleMethod; 
            var keys = Object.keys(this);
            for (var name, i=0; i<keys.length; i++)
                if (!this.__lookupGetter__(name = keys[i]) && (sampleMethod = this[name]) instanceof Function && 
                    (sampleMethod.belongsToTrait && sampleMethod.belongsToTrait.def === this || 
                    sampleMethod.declaredClass && sampleMethod.methodName && sampleMethod.declaredClass.prototype === this))
                        return sampleMethod.belongsToTrait ? sampleMethod.belongsToTrait : sampleMethod.declaredClass;
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
    addOwnPropertyIfAbsent(Function.prototype, 'lvCategoriesContainer', function(){return null});

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
    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvCategoriesContainer', function(){return null});

    addOwnPropertyIfAbsent(lively.Module.prototype, 'lvCategoriesContainer', function(){return null});

    addOwnPropertyIfAbsent(Layer.prototype, 'lvCategoriesContainer', function(){return null});

    addOwnPropertyIfAbsent(lively.persistence.SpecObject.prototype, 'lvCategoriesContainer', function(){return null});
})();

(function setupBaseExtensionsForFunctionNames() {

    addOwnPropertyIfAbsent(Function.prototype, 'lvIsConstructor', function(){
        if(this.superclass) 
            return true;
        if(this.originalFunction)
            return this.getOriginal().lvIsConstructor();
        return this.prototype && (Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
                    return name != 'lvContextPath' && name != 'caller' && name != 'originalFunction' &&
                            !obj.__lookupGetter__(name) && obj[name] instanceof Function}
                ).length > 0 || Object.getOwnPropertyNames(this.prototype).length > 1)});   //one of them is 'constructor'

    addOwnPropertyIfAbsent(Object.prototype, 'lvOwnFunctionNames', function(){
        return Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
            var object;
            return !obj.__lookupGetter__(name) && 
                name != 'lvContextPath' && 
                name != 'lvOwnFunctionNames' && 
                (object = obj[name]) instanceof Function &&
                !object.lvIsConstructor()})});
    
    addOwnPropertyIfAbsent(Global, 'lvOwnFunctionNames', function(){
        return Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
            var object;
            return !obj.__lookupGetter__(name) && 
                name != 'requires' && 
                name != 'lvContextPath' && 
                name != 'lvOwnFunctionNames' && 
                (object = obj[name]) instanceof Function &&
                !object.lvIsConstructor()})});
    
    addOwnPropertyIfAbsent(lively.Module.prototype, 'lvOwnFunctionNames', function(){
        return Properties.allOwnPropertiesOrFunctions(this, function(obj, name) {
            var object;
            return !obj.__lookupGetter__(name) && 
                name != 'requires' && 
                (object = obj[name]) instanceof Function &&
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
            var sampleMethod; 
            var keys = Object.keys(this);
            for (var name, i=0; i<keys.length; i++)
                if (!this.__lookupGetter__(name = keys[i]) && (sampleMethod = this[name]) instanceof Function && 
                    (sampleMethod.belongsToTrait && sampleMethod.belongsToTrait.def === this || 
                    sampleMethod.declaredClass && sampleMethod.methodName && sampleMethod.declaredClass.prototype === this ||
                    sampleMethod.displayName && sampleMethod.displayName.startsWith('layered ')))
                        return sampleMethod.belongsToTrait ? sampleMethod.belongsToTrait.lvContextPath() + ".def" :
                                (sampleMethod.declaredClass ? sampleMethod.declaredClass + ".prototype" :
                                layeredFunctionContainers().detect(function(e){return e === this}, this).lvContextPath());
            return null;
        });

    ["Global", "console", "location"].each(function(e){
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
            if(Global[this.lvDisplayName] === this)
                return this.lvDisplayName;
            if(this === Function.prototype)
                return "Function.prototype"
            return null;
        });

    addOwnPropertyIfAbsent(RealTrait.prototype, 'lvContextPath', function(){
            if(this === RealTrait.prototype)
                return 'RealTrait.prototype';
            return "RealTrait.prototype.traitRegistry['" + this.name + "']";
        });

    addOwnPropertyIfAbsent(lively.persistence.SpecObject.prototype, 'lvContextPath', function(){
            if(this === lively.persistence.SpecObject.prototype)
                return 'lively.persistence.SpecObject.prototype';
            return 'lively.persistence.BuildSpec.Registry["' + Properties.nameFor(lively.persistence.BuildSpec.Registry, this) + '"]';
        });

    Object.keys(lively.ide.commands.byName).each(function(e){
            var path = 'lively.ide.commands.byName["' + e + '"]';
            addOwnPropertyIfAbsent(lively.ide.commands.byName[e], 'lvContextPath', function(){return path});
        });

    addOwnPropertyIfAbsent(lively.Module.prototype, 'lvContextPath', function(){
            if(this === lively.Module.prototype)
                return 'lively.Module.prototype';
            return this.name();
        });
        
    addOwnPropertyIfAbsent(Layer.prototype, 'lvContextPath', function(){
            if(this === Layer.prototype)
                return 'Layer.prototype';
            var identifier = this.namespaceName, globalIdStart = 'Global.';
            if (identifier.startsWith(globalIdStart)) {
                identifier = identifier.substring(globalIdStart.length);
            } else if (identifier == 'Global')
                return this.name;
            return identifier + '.' + this.name;
        });
})();

Object.subclass('lively.ChangeSet',
'initialize-release', {

	reinitialize: function() {
        //(Re)initialize the receiver to be empty
		if (!this.name)
		    throw new Error('All changeSets must be named and registered');
		this.clear();

	},

    initialize: function(aName, optDoNotStoreName) {
        if(!aName) {
		    throw new Error('All changeSets must be named and registered');
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

    copy: function() {
        return new lively.ChangeSet(this.name, true);
    }

});


Object.extend(lively.ChangeSet, {

	existingOrNewChangeSetNamed: function(aName) {
	    var existing = this.named(aName);
	    if(existing)
	        return existing;
	    return new lively.ChangeSet(aName);
	},

	current: function() {
	    if(!this.CurrentChangeSet)
	        this.newChanges(new this(this.defaultName()));
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
        var changesetNames = this.changeSetNames();
        if(!changesetNames.include(aChangeSet.name)) {
            changesetNames.push(aChangeSet.name);
            localStorage.setItem(this.userStorageRoot + ":changesetNames", JSON.stringify(changesetNames));
        }
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

Object.extend(lively.ChangeSet, {

	loadAndcheckVsSystem: function() {
	    
	    var changeSet = this.CurrentChangeSet;
	    if(!changeSet)	        return;
        if(!changeSet.hasErrors())
            changeSet.applyChanges();
        if(changeSet.hasErrors())
            alert("Some of the changes in your current changeset could not be applied.\nOpen the changes browser for details");
	},
    initialize: function() {

		this.userStorageRoot = "LivelyChanges:" + location.pathname + ":author:" + $world.getUserName();
		var storedNameForDefaultChangeSet = this.defaultChangeSetName();
		if(!storedNameForDefaultChangeSet)
		    return;
        var changeSet = new lively.ChangeSet(storedNameForDefaultChangeSet, true);
        this.newChanges(changeSet);
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
debugger;
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

    removeAllFromPersistentStorage: function() {// lively.ChangeSet.removeAllFromPersistentStorage()
    
		var storageRoot = "LivelyChanges:" + location.pathname + ":author:" + $world.getUserName();

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
                changeRecord.errors.push("Failed to apply; "+changeRecord.originalContextPath+" does not have the  property '"+changeRecord.originalPropertyName+"' anymore");
                return;
            }
            if(changeRecord.originalPropertyName && changeRecord.originalSource != originalContext[changeRecord.originalPropertyName].toString()) {
                changeRecord.errors.push("Failed to apply; "+changeRecord.originalContextPath+"."+changeRecord.originalPropertyName+" does not have the original source anymore");
                return;
            }
            if(changeRecord.originalCategory) {
                var originalContainer = originalContext.lvCategoriesContainer();
                if(changeRecord.originalCategory != originalContainer.lvCategoryForMethod(changeRecord.originalPropertyName))
{
    debugger;
                    changeRecord.errors.push("Failed to apply; "+changeRecord.originalContextPath+"."+changeRecord.originalPropertyName+" does not have the category '"+changeRecord.originalCategory+"' anymore");
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
                return;
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
        switch(changeRecord.type) {
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
                        changeRecord.errors.push("Failed to add property. "+changeRecord.contextPath+" already has the property '"+changeRecord.propertyName+"' and it is different from what we are trying to add");
                    return;
                }
                if(!existingTimestamp)
                    timestamp = this.logAddition(changeRecord.source, changeRecord.contextPath, changeRecord.propertyName, changeRecord.category);
                kindOfChange = "added";
                break;
            case "moved":
                if(oldFunc) {
                    if(oldFunc.toString() != changeRecord.source)
                        changeRecord.errors.push("Failed to move property. "+changeRecord.contextPath+" already has the property '"+changeRecord.propertyName+"' and it is different from what we are trying to move there");
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
                        changeRecord.errors.push("Failed to rename property. "+changeRecord.contextPath+" already has the target property '"+changeRecord.propertyName+"' and it is different from what we are trying to set");
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
                    changeRecord.errors.push("Failed to change source. "+changeRecord.contextPath+" does not have the property '"+changeRecord.propertyName+"'");
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
                    changeRecord.errors.push("Failed to change category. "+changeRecord.contextPath+" does not have the property '"+changeRecord.propertyName+"'");
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
            debugger;
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
            if(firstChangeRecord.type == "added") {
                if(changeRecord.type == "removed" || changeRecord.type == "added")
                    return changeRecord;
                if(firstChangeRecord.contextPath !== changeRecord.contextPath)
                    changeRecord.type = "moved";    //this may also include renamed, changed category and changed source
                else if(firstChangeRecord.propertyName !== changeRecord.propertyName)
                    changeRecord.type = "renamed";  //this may also include changed category and changed source
                else if(firstChangeRecord.source !== changeRecord.source)
                    changeRecord.type = "changed source";  //this may also include changed category
                else if(firstChangeRecord.category !== changeRecord.category &&
                    (firstChangeRecord.category || changeRecord.category)) {
                        changeRecord.type = "changed category";
                } else
                    changeRecord.type = "added";
                return changeRecord;
            }
            changeRecord.originalContextPath = firstChangeRecord.originalContextPath;
            changeRecord.originalPropertyName = firstChangeRecord.originalPropertyName;
            changeRecord.originalCategory = firstChangeRecord.originalCategory;
            changeRecord.originalSource = firstChangeRecord.originalSource;
        }
                
        if(changeRecord.type == "removed" || changeRecord.type == "added")
            return changeRecord;
        if(changeRecord.originalContextPath !== changeRecord.contextPath)
            changeRecord.type = "moved";    //this may also include renamed, changed category and changed source
        else if(changeRecord.originalPropertyName !== changeRecord.propertyName)
            changeRecord.type = "renamed";  //this may also include changed category and changed source
        else if(changeRecord.originalSource !== changeRecord.source)
            changeRecord.type = "changed source";  //this may also include changed category
        else if(changeRecord.originalCategory !== changeRecord.category &&
            (changeRecord.originalCategory || changeRecord.category))
                changeRecord.type = "changed category";
        else
            throw new Error("invalid change");
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
			entry.category = array[3] === 'default category' ? null : array[3];
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
			entry.originalCategory = previous === 'default category' ? null: previous;
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
    
lively.ChangeSet.addMethods(
    "actions", {

    applyChanges: function() {
        if(this.timestamps.length != this.changeRecords.length) {
            alert("inconsistent changeset state");
            return;
        }
        if(this.changeRecords.length == 0) {
            alertOK("No changes to apply");
            return;
        }
            
        for (var i=0; i<this.timestamps.length; i++) {
            try {
                lively.ChangeSet.applyChange(this.changeRecords[i], this.timestamps[i]);
            } catch(e) {
                this.changeRecords[i].errors.push("Unexpected error " + e.name + ": " + e.message);
            }
        }
        if(!this.hasErrors())
            alertOK("Changes succesfully applied");

    },

    hasErrors: function() {
        return this.changeRecords.detect(function(e){ return e.errors.length > 0})
    },
    
    addChange: function(t) {
        this.timestamps.push(t);
        this.changeRecords.push(lively.ChangeSet.hydrateChange(t));
    },

    logAddition: function(source, contextPath, propertyName, optCategory) {

        //make sure this is really a new addition (within the current changeset)
        var replacedRemoval;
        this.timestamps.slice().reverse().each(function(t){
            var changeRecord = lively.ChangeSet.getChangeRecord(t);
            if( changeRecord.contextPath == contextPath &&
                changeRecord.propertyName == propertyName &&
                changeRecord.type === "removed") {
                    //it is not really a new add
                    this.removeTimestamp(t);
                    if(changeRecord.firstChangeStamp) {
                        replacedRemoval = this.logChange(source, contextPath, propertyName, optCategory, changeRecord.previousChangeStamp);
                    } else
                        replacedRemoval = this.logFirstChange(source, contextPath, propertyName, optCategory,
                        changeRecord.originalCategory, changeRecord.originalSource, changeRecord.originalContextPath, changeRecord.originalPropertyName);
                    return;
            }
        })
        if(replacedRemoval)
            return replacedRemoval;
        var timestamp = lively.ChangeSet.nextTimestamp();
        var array = [source, contextPath, propertyName];
        if(optCategory)
            array.push(optCategory);[]
        this.storeArray(array, timestamp);
        return timestamp
    },

    removeTimestamp: function(t) {

        this.timestamps.remove(t);
        localStorage.setItem(lively.ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
    },

    logChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousChangeStamp) {

        //Get the previous change
        var previousChangeRecord = lively.ChangeSet.hydrateChange(previousChangeStamp);
        var firstTimestamp = previousChangeRecord.firstChangeStamp || previousChangeStamp;
        var timestamp = lively.ChangeSet.nextTimestamp();
        this.storeArray([sourceOrNil, contextPath, propertyName, categoryOrNil, firstTimestamp, previousChangeStamp], timestamp);
        if(previousChangeRecord.type === "changed source" || previousChangeRecord.type === "changed category")
            this.removeTimestamp(previousChangeStamp);

        if( previousChangeRecord.originalSource == sourceOrNil &&
            previousChangeRecord.originalContextPath == contextPath &&
            previousChangeRecord.originalPropertyName == propertyName &&
            (previousChangeRecord.originalCategory == categoryOrNil || !previousChangeRecord.originalCategory && !categoryOrNil)) {
                //this is not really a change, we are reverting to the original
                this.timestamps = this.timestamps.reject(function(t){
                    var changeRecord = lively.ChangeSet.getChangeRecord(t);
                    return changeRecord.contextPath == contextPath &&
                        changeRecord.propertyName == propertyName})
                localStorage.setItem(lively.ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
                return null;
        } else if(!previousChangeRecord.originalSource) {
            //first record is an addition
            var firstChangeRecord = lively.ChangeSet.getChangeRecord(firstTimestamp);
            if(firstChangeRecord.type !== "added")
                throw new Error("Should not happen");
            if( firstChangeRecord.source == sourceOrNil &&
                firstChangeRecord.contextPath == contextPath &&
                firstChangeRecord.propertyName == propertyName &&
                (firstChangeRecord.category == categoryOrNil || !firstChangeRecord.category && !categoryOrNil)) {
                    //this is not really a change, we are reverting to the initial
                    this.timestamps = this.timestamps.reject(function(t){
                        var changeRecord = lively.ChangeSet.getChangeRecord(t);
                        return changeRecord.contextPath == contextPath &&
                            changeRecord.propertyName == propertyName &&
                            t !== firstTimestamp})
                    localStorage.setItem(lively.ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
                    return null;
            }            
        }
        return timestamp
    },

    logFirstChange: function(sourceOrNil, contextPath, propertyName, categoryOrNil, previousCategoryOrNil, previousSourceOrNilIfSame, previousContextPathOrNilIfSame, previousPropertyNameOrNilIfSame) {
 
        var timestamp = lively.ChangeSet.nextTimestamp();
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
 
        this.storeArray([null, contextPath, propertyName, categoryOrNil, null, source], lively.ChangeSet.nextTimestamp());
    },

    logRemoval: function(contextPath, propertyName, categoryOrNil, previousChangeStamp) {
 
        //Get the previous change
        var previousChangeRecord = lively.ChangeSet.getChangeRecord(previousChangeStamp);
        var firstTimestamp = previousChangeRecord.firstChangeStamp || previousChangeStamp;
        var timestamp = lively.ChangeSet.nextTimestamp();
        this.storeArray([null, contextPath, propertyName, categoryOrNil, firstTimestamp, previousChangeStamp], timestamp);
        this.removeTimestamp(previousChangeStamp);

        var firstChangeRecord = firstTimestamp === previousChangeStamp ? previousChangeRecord : lively.ChangeSet.getChangeRecord(firstTimestamp);
        if(firstChangeRecord.type == "added" && this.timestamps.indexOf(timestamp) > -1)
            //this is not really a removal, we are only removing something temporarily added
            this.removeTimestamp(timestamp);
    },


    storeArray: function(array, timestamp) {

        lively.ChangeSet.storeArray(array, timestamp);

        this.addTimestamp(timestamp);
    },

    storeName: function() {
        
        if(!lively.ChangeSet.userStorageRoot) {
            var username = $world.getUserName();
            var storageRoot = "LivelyChanges:" + location.pathname;
            var authorsString = localStorage.getItem(storageRoot + ":authors");
            if(!authorsString)
                authorsString = "[]";
            var authors = JSON.parse(authorsString);
            if(!authors.include(username)) {
                authorsString = JSON.stringify(authors.push(username))
                localStorage.setItem(storageRoot + ":authors", authorsString);
            }
    		lively.ChangeSet.userStorageRoot = storageRoot + ":author:" + username;
        }
        var changesetNames = lively.ChangeSet.changeSetNames();
        if(changesetNames.include(this.name))
            throw new Error("Changeset name "+ this.name+" already stored");
        changesetNames.push(this.name);
        localStorage.setItem(lively.ChangeSet.userStorageRoot + ":changesetNames", JSON.stringify(changesetNames));
    },

    reorderTimestamp: function(index, newIndex) {

        var ts = this.timestamps.splice(index, 1)[0];
        this.timestamps.splice(newIndex, 0, ts);
        localStorage.setItem(lively.ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
    },

    addTimestamp: function(t) {

        this.timestamps.push(t);
        localStorage.setItem(lively.ChangeSet.userStorageRoot + ":changesetTimestamps:" + this.name, JSON.stringify(this.timestamps));
    },

    hydrate: function() {
        var storageRoot = lively.ChangeSet.userStorageRoot;
        var changesetTimestampsString = localStorage.getItem(storageRoot + ":changesetTimestamps:" + this.name);
        if(!changesetTimestampsString)
            //empty changeset
            return;
        this.timestamps = JSON.parse(changesetTimestampsString);
        var self = this;
        this.timestamps.each(function(t){
            self.changeRecords.push(lively.ChangeSet.hydrateChange(t));
        });
    }

});

lively.morphic.Panel.subclass('lively.ide.ChangesBrowser',

// new lively.ide.ChangesBrowser(pt(1024, 384)).openIn($world, 'Changes Browser')

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
        	    return record.errors.length > 0 ? '!!! ' + record.errors[0] : new Date(e).toUTCString() + ' ' + record.type + 
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
    
    	this.changeSetPane.setSelection(lively.ChangeSet.defaultChangeSetName());
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
            this.nextChangeVsOriginalImpl = new lively.ide.Differator(this.changeCodePane, this.originalCodePane, style, style, extra);
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
            this.nextOriginalVsSystemImpl = new lively.ide.Differator(this.originalCodePane, this.systemCodePane, style, style, extra);
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
            this.nextSystemVsChangeImpl = new lively.ide.Differator(this.systemCodePane, this.changeCodePane, style, style, extra);
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
        items.push(['refresh', function() {
            if(self.changeSet)
                self.changeSet.clear();
            self.setChangeSet(selected)}]);
        if(this.changeSet)
            items.push(['publish', function() {self.publish()}]);
        return items;
    },
    publish: function() {
        var browser = new lively.ide.SharedChangeSetBrowser(pt(1024, 384));
        var title = this.changeSet.name + '_' + $world.getUserName();
        var window = browser.openIn($world, title);
        browser.setChangeSetContents(this.changeSet.name);
        window.name = title;
        var info = window.getPartsBinMetaInfo();
        info.addRequiredModule('lively.ChangeSets');
        info.partsSpaceName = 'PartsBin/Changesets';
        info.comment = 'A shared set of code changes'; 
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
        
        var changeRecord = lively.ChangeSet.hydrateChange(t);
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
                if(changeRecord.originalContextPath) {
                    contextPath = changeRecord.originalContextPath;
                    system = lively.lookup(changeRecord.originalContextPath);
                }
            }
            if(!system) {
                this.systemCodePane.setTextString("//Neither the current context: "+ changeRecord.contextPath + "\n//nor the original one: "+ changeRecord.originalContextPath+"\n//seem to be loaded");
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
                this.systemCategory.setTextString(category || null);
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
    	this.setActive(this.originalVsSystemButton, false);
    	this.setActive(this.systemVsChangeButton, false);
    	this.setActive(this.changeVsOriginalButton, false);
    	if(!name)
    	    return;
        var storageRoot = lively.ChangeSet.userStorageRoot;
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
            if(name === lively.ChangeSet.current().name)
                this.changeSet = lively.ChangeSet.current();
            if(this.changeSet.name !== name || this.changeSet.timestamps.length === 0)
                this.changeSet = new lively.ChangeSet(name, true);
            var oldTimestamp = this.changePane.selection;
            this.changePane.setList(this.changeSet.timestamps.concat([]));
            if(oldTimestamp && this.changePane.selection == oldTimestamp)
                this.setChange(oldTimestamp);
        }
    },

    getChangeMenu: function() {
        var selected = this.changePane.selection;
        var items = [];
        if(!this.changeSet) {
            if(selected) {
                var changeSet = new lively.ChangeSet(lively.ChangeSet.defaultChangeSetName(), true);
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
                        lively.ChangeSet.applyChange(changeRecords[timestamps.indexOf(e)], e);
                    })
                    if(selected)
                        self.setChange(selected);
                    }]);
        if(!selected)
            return items;
        items.push(
            ['apply selected', function() {
                lively.ChangeSet.applyChange(changeRecords[timestamps.indexOf(selected)], selected);
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
                lively.ChangeSet.removeAllFromPersistentStorage();
                self.changeSetPane.setList(["-- ALL CHANGES --"]);
            	self.setChangeSet("-- ALL CHANGES --");
            }
        });        
    },

    changeSetPaneContents: function() {
        return ["-- ALL CHANGES --"].concat(lively.ChangeSet.changeSetNames());
    },


});

lively.morphic.Panel.subclass('lively.ide.SharedChangeSetBrowser',
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
                        lively.ChangeSet.applyChange(selected);
                        self.setChange(selected)}]);
        return items;
    },

    applyAllChanges: function() {
        var self = this;
        this.changePane.getList().each(function(e){
            lively.ChangeSet.applyChange(e);
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
                if(changeRecord.originalContextPath) {
                    contextPath = changeRecord.originalContextPath;
                    system = lively.lookup(changeRecord.originalContextPath);
                }
            }
            if(!system) {
                this.systemCodePane.setTextString("//Neither the current context: "+ changeRecord.contextPath + "\n//nor the original one: "+ changeRecord.originalContextPath+"\n//seem to be loaded");
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
            this.changeCategory.setTextString(changeRecord.category || null);
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
        this.changePane.setList(new lively.ChangeSet(name, true).changeRecords);
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

lively.morphic.Panel.subclass('lively.ide.SimpleCodeBrowser',

// new lively.SimpleCodeBrowser(pt(640, 480)).openIn($world, 'Simple Code Browser')

'accessing', {
    selectedCategory: function selectedCategory() {
        if(this.selectedFunctionKind == '-- all --  proto')
            return null;
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
        this.codePane.doSave = this.codePaneDoSave;
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


    setFunction: function setFunction(aFunctionName) {
        this.selectedFunctionNameInContainer = aFunctionName;
        if(!aFunctionName) {
            this.codePane.setTextString(''); 
            this.codePane.savedTextString = '';
            return; }
        var text = printInContext(aFunctionName, this.codePane.doitContext);
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
            var allProtoNames = nonStaticContainer.lvOwnFunctionNames().sort();
            if(allProtoNames.length > 0) {
                categories.push({string: '-- all --  proto', names: allProtoNames.slice()});
                aContainer.lvCategoriesWithMethodNamesDo(function(category, methodNames){
                    var names = methodNames.intersect(allProtoNames);
                    if(names.length > 0) {
                        names.each(function(n){allProtoNames.remove(n)});
                        categories.push({string: category + ' - proto', names: names});
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
                        categories.push({string: 'default category - proto', names: allProtoNames});
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
        this.functionPane.setList(names);
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

                    func.timestamp = lively.ChangeSet.logAddition(superclassName + ".subclass('" + className + "', 'default category', {initialize: " + Functions.Empty + "})", contextPath, shortName);
                    func.kindOfChange = "added";
                    func.user = $world.getUserName();

                    contextPath = contextPath === "Global" ? shortName : contextPath + "." + shortName;
                    
                    var toString = func.toString;
                    toString.timestamp = lively.ChangeSet.logAddition(toString.toString(), contextPath, "toString");
                    toString.user = func.user;
                    toString.kindOfChange = "added";

                    var initialize = func.prototype.initialize;
                    initialize.timestamp = lively.ChangeSet.logAddition(initialize.toString(), contextPath + ".prototype", "initialize");
                    initialize.user = func.user;
                    initialize.kindOfChange = "added";

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
        var current = lively.ChangeSet.getChangeRecord(timestamp);
        var propertyName = current.propertyName;
        current.string = new Date(timestamp).toUTCString() + ' (current)';
        var versions = [current];
        var firstChangeStamp = current.firstChangeStamp;
        if(firstChangeStamp) {
            var firstChangeRecord = lively.ChangeSet.getChangeRecord(firstChangeStamp);
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
            changeRecord = lively.ChangeSet.getChangeRecord(t);
            changeRecord.string = new Date(t).toUTCString();
            versions.push(changeRecord);
            t = changeRecord.previousChangeStamp;
        }
        if(previouslyInTheSystem)
            versions.push(previouslyInTheSystem);

        var browser = new lively.ide.VersionsBrowser(pt(640, 384));
        var window = browser.openIn($world, propertyName + ' versions ');
        browser.setContents(versions);
        browser.codeBrowser = this;
    },
    browseDifferences: function() {
        var selections = this.functionPane.getSelectedItems();
        var browser = new lively.ide.FunctionComparer(pt(1024, 384));
        browser.openIn($world, 'Browse differences');
        var context = this.codePane.doitContext;
        browser.setContents(selections.collect(function(e){
            return {string: e, context: context}
        }));
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
                (function(){eval(text)}).call(this.doitContext);
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
                        func.timestamp = lively.ChangeSet.logChange(text, contextPath, functionName, category, oldFunc.timestamp);
                    else
                        //first change
                        func.timestamp =  lively.ChangeSet.logFirstChange(text, contextPath, functionName, category, null, oldFunc.toString(), null, null);
                    if(func.timestamp) {
                        func.user = $world.getUserName();
                        func.kindOfChange = "changed source";
                    }
                    func.sourceModule = oldFunc.sourceModule
                    this.savedTextString = this.textString;
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
            {string: "classes", 
                titleRenderFunction: function(e){return "Class " + (e.type || e.name)},
                listRenderFunction: function(e){return e.name || e.type},
                containers: function(){return allClasses(true)},
                nonStaticContainer: function(e){return e.prototype}}, 
                
           {string: "non-class global constructors", 
                titleRenderFunction: function(e){return e.name || e.lvDisplayName},
                listRenderFunction: function(e){return e.name || e.lvDisplayName},
                containers: function(){return nonClassConstructors(true)},
                nonStaticContainer: function(e){return e.prototype}}, 
                
            {string: "traits", 
                titleRenderFunction: function(e){return "Trait " + e.name},
                listRenderFunction: function(e){return e.name},
                containers: function(){
                    return Global.RealTrait ? Object.values(RealTrait.prototype.traitRegistry) : []},
                nonStaticContainer: function(e){return e.def}}, 
                
            {string: "modules", 
                titleRenderFunction: function(e){return "Module " + e.name()},
                listRenderFunction: function(e){return e.name()},
                containers: function(){
                    return subNamespaces(true).select(function(e){
                        return !e.isAnonymous() && e.lvOwnFunctionNames().length > 0
                    })},
                nonStaticContainer: function(e){return null}}, 
                
            {string: "build specs", 
                titleRenderFunction: function(e){
                    var name = lively.persistence.BuildSpec.Registry.nameForSpec(e);
                    return 'lively.BuildSpec(' + (name ? '"' + name + '", ' : '') + '{className: ' + e.attributeStore.className + '})';
                    },
                listRenderFunction: function(e){return e.string},
                containers: function(){return instantiatedBuildSpecsAndSubmorphsWithPaths()},
                nonStaticContainer: function(e){return e.attributeStore}}, 
                
           {string: "commands", 
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
                
            {string: "layers", 
                titleRenderFunction: function(e){
                    return "Layer  " + e.lvContextPath() + "  applied to  " + e._layered_object.lvContextPath()},
                listRenderFunction: function(e){
                    var parts = e.lvContextPath().split("[");
                    return lively.lookup(parts[0]).name + "[" + parts[1]},
                containers: function(){return layeredFunctionContainers()},
                nonStaticContainer: function(e){return null}},
                
            {string: "plain JavaScript objects", 
                titleRenderFunction: function(e){return "PJO " + e.lvContextPath()},
                listRenderFunction: function(e){return e.lvContextPath()},
                containers: function(){return PJOs(true)},
                nonStaticContainer: function(e){return null}},
                
            {string: "well-known global containers", 
                titleRenderFunction: function(e){return "Global object " + e.lvContextPath()},
                listRenderFunction: function(e){return e.lvContextPath()},
                containers: function(){
                    return [Global, console, location]},
                nonStaticContainer: function(e){return null}} 
        ]
    },

    getFunctionContainerMenu: function getFunctionContainerMenu() {
        if(this.selectedContainerKind.string != "classes")
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
        if(this.functionPane.isMultipleSelectionList)
            items.push(
                ['disable multiple select', function() {
                    self.functionPane.allowDeselectClick = false;
                    self.functionPane.isMultipleSelectionList = false;}]
                );
        else
            items.push(
                ['enable multiple select', function() {
                    self.functionPane.allowDeselectClick = true;
                    self.functionPane.isMultipleSelectionList = true}]
                );

        if (this.selectedFunctionNameInContainer) {
            items.push(
                ['move to...', function() {self.moveProperty()}],
                ['remove', function() {self.removeProperty()}],
                ['rename as... ', function() {self.renameProperty()}],
                ['senders', function() {
                    openFunctionList('senders', self.selectedFunctionNameInContainer, true); 
                    }],
                ['implementors', function() {
                    openFunctionList('implementors', self.selectedFunctionNameInContainer); }]
                );
            if (this.selectedFunctionKind != 'default category - static')
                items.push(['change category', function() {self.changeCategory()}]);
            var func = this.codePane.doitContext[this.selectedFunctionNameInContainer];
            if(func.timestamp)
                items.push(['browse versions', function() {self.browseVersions(func.timestamp)}])
        } else if(this.functionPane.getSelectedIndexes().length == 2)
            items.push(
                ['browse differences', function() {self.browseDifferences()}]
                );
        
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
                else
                    selectedContainer.lvRemoveMethodFromExistingCategory(functionName, 'default category');
               
                if(func.user && func.timestamp)
                    //already modified
                    func.timestamp = lively.ChangeSet.logChange(func.toString(), newContextPath, functionName, category, func.timestamp);
                else
                    //first change
                    func.timestamp =  lively.ChangeSet.logFirstChange(func.toString(), newContextPath, functionName, category, category, null, contextPath);
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
            panel = this,
            context = codePane.doitContext;

        var functionName = this.selectedFunctionNameInContainer;
        if (functionName)
            var currentModule = context[functionName].sourceModule;
        if(!currentModule) {
            var funcWithSource = functionPane.getList().detect(function(e){return context[e].sourceModule});
            if (funcWithSource)
                currentModule = funcWithSource.sourceModule;
        }
            
        this.checkSourceNotAccidentlyDeleted(function() {
            $world.editPrompt('new method name', function(functionName) {
                if(!functionName || functionName.trim().length == 0)
                    return;
                functionName = functionName.trim();
                
                var currentNames = functionPane.getList().collect(function(e){return e});
                if(currentNames.include(functionName)) {
                    $world.alert('method name already in use');
                    return;
                }
    
                var contextPath = context.lvContextPath();
                if(!contextPath)
                    throw new Error("Should not happen");
                var func = function() {};
                context[functionName] = func;
    
                var category = panel.selectedCategory();
                if (category)
                    selectedContainer.lvAddMethodToExistingCategory(func, functionName, category);
                
                func.timestamp = lively.ChangeSet.logAddition("function(){}", contextPath, functionName, category);
                func.kindOfChange = "added";
                func.user = $world.getUserName();
                func.sourceModule = currentModule;
                if(panel.selectedContainerKind.string == 'classes' && panel.selectedFunctionKind != 'default category - static') {
                    func.declaredClass = panel.selectedContainer.lvContextPath();
                    func.methodName = functionName;
                }
    
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
                        
                var currentNames = functionPane.getList().collect(function(e){return e});
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
                else
                    selectedContainer.lvRemoveMethodFromExistingCategory(functionName, 'default category');
                
                if(func.user && func.timestamp)
                    //already modified
                    func.timestamp = lively.ChangeSet.logChange(func.toString(), contextPath, functionName, category, func.timestamp);
                else
                    //first change
                    func.timestamp =  lively.ChangeSet.logFirstChange(func.toString(), contextPath, functionName, category, category, null, null, oldFunctionName);
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
            categories.remove('');
            categories.remove('default category');  //one for static
            categories.remove('default category');  //one for proto
            categories.unshift('<new category>');
            
            var proceed = function(otherCategory) {
                var contextPath = panel.codePane.doitContext.lvContextPath();
                if(!contextPath)
                    throw new Error("Should not happen");
                if(category)
                    container.lvRemoveMethodFromExistingCategory(functionName, category);
                else
                    container.lvRemoveMethodFromExistingCategory(functionName, 'default category');
                container.lvAddMethodToExistingCategory(func, functionName, otherCategory);
    
                if(func.user && func.timestamp)
                    //already modified
                    func.timestamp = lively.ChangeSet.logChange(func.toString(), contextPath, functionName, otherCategory, func.timestamp);
                else {
                    //first change
                    func.timestamp = lively.ChangeSet.logFirstChange(func.toString(), contextPath, functionName, otherCategory, category, null, null, null);
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
            else
                selectedContainer.lvRemoveMethodFromExistingCategory(functionName, 'default category');
            
            if(func.user && func.timestamp)
                //modified
                lively.ChangeSet.logRemoval(contextPath, functionName, category, func.timestamp);
            else
                lively.ChangeSet.logFirstRemoval(func.toString(), contextPath, functionName, category);
    
            panel.setFunctionContainer(selectedContainer);          //recompute the categories' contents
            panel.functionKindPane.setSelectionMatching(panel.selectedFunctionKind);                //reselect current category
        });
    }
}
);

lively.morphic.Panel.subclass('lively.ide.VersionsBrowser',
'default category', {
    buildView: function buildView() {  // this.buildView()
        this.withAllSubmorphsDo(function(m) {disconnectAll(m)});
        this.removeAllMorphs();

    	this.createAndArrangePanesFrom([
    		['changePane', this.newListPane, new Rectangle(0, 0, 1, 0.3)],
    		['codePane', this.newCodePane, new Rectangle(0, 0.3, 1, 0.7)],
    	]);
    	
        this.changePane.allowDeselectClick = true;
        this.changePane.noSingleSelectionIfMultipleSelected = true;
        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        connect(this.changePane, "selection", this, "setVersion", {});
        connect(this.changePane, "getMenu", this, "getChangeMenu", {});

    },
    getChangeMenu: function() {
        var self = this;
        var selected = this.changePane.selection;
        var items = [];
        if(selected && !selected.string.endsWith(' (current)'))
            items.push(
                ['revert current source to selected', this.revertCurrentSourceToSelected.bind(this) ]
            );
        if(this.changePane.isMultipleSelectionList)
            items.push(
                ['disable multiple select', function() {self.changePane.isMultipleSelectionList = false}]
                );
        else
            items.push(
                ['enable multiple select', function() {self.changePane.isMultipleSelectionList = true}]
                );
        if(this.changePane.getSelectedIndexes().length == 2)
            items.push(
                ['browse differences', function() {self.browseDifferences()}]
                );
        return items;
    },
    setVersion: function(selected) {
        if(selected)
            this.codePane.setTextString(selected.source);
        else
            this.codePane.setTextString('');
    },
    browseDifferences: function() {
        var selections = this.changePane.getSelectedItems();
        var holders = [];
        selections.each(function(e){
            if (e.string.lastIndexOf(' (current)') > -1) {
                if(holders.length > 0)
                    holders.unshift({func: e.source, string: e.propertyName + " " + e.string, context: lively.lookup(e.contextPath)});
                else
                    holders.push({func: e.source, string: e.propertyName + " " + e.string, context: lively.lookup(e.contextPath)});
            } else
                holders.push({func: e.source, string: e.propertyName + " " + e.string});
            });

        var browser = new lively.ide.FunctionComparer(pt(1024, 384));
        browser.openIn($world, 'Browse differences');
        browser.setContents(holders);
        browser.codeBrowser = this;
    },

    revertCurrentSourceToSelected: function() {
        var changes = this.changePane.getList();
        var selected = this.changePane.selection;
        var current = changes[0];
        if(selected.source == current.source) {
            alertOK("The current source and the source of the selected version are the same");
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
        func.timestamp = lively.ChangeSet.logChange(selected.source, current.contextPath, current.propertyName, current.category, oldFunc.timestamp);
        if(func.timestamp) {
            var newChange = lively.ChangeSet.getChangeRecord(func.timestamp);
            newChange.string = new Date(func.timestamp).toUTCString() + ' (current)';
            func.user = $world.getUserName();
            func.kindOfChange = "changed source";
            changes.unshift(newChange);
        }
        current.string = current.string.substring(0, current.string.lastIndexOf(' (current)'));

        this.changePane.setList(changes);
        this.codeBrowser.functionKindPane.setSelectionMatching(this.codeBrowser.selectedFunctionKind);
        this.codeBrowser.functionPane.setSelectionMatching(current.propertyName);
    },

    setContents: function(list) {
        this.changePane.setList(list);
        this.changePane.selectAt(0);
    },
});

Object.subclass('lively.ide.Differator',
'default category', {

    initialize: function(text1, text2, styleSpec1, styleSpec2, optExtraTexts) {
        var differ = new JsDiff.Diff();
        var string1 = text1.textString;
        var string2 = text2.textString;
        var whitespace = {};
        whitespace[string1] = [[],[]];
        whitespace[string2] = [[],[]];
        differ.tokenize = function(input) {
            var strings = [];
            lively.ast.acorn.tokens(input).each(function(token){
                if(token.type == "whitespace"){
                    whitespace[input][0].push(token.start);
                    whitespace[input][1].push(token.value.length);
                }
                strings.push(input.substring(token.start, token.end).valueOf());     //Diff uses === for comparison
            })
            return strings;
        }
        var diffList = differ.diff(string1, string2);
        var index1 = 0, index2 = 0;
        var desynchronizations = [];
        diffList.each(function(e) {
            var i;
            var previous = desynchronizations.last();
            if (e.added) {
                if(whitespace[string2][1][whitespace[string2][0].indexOf(index2)] == e.value.length)
                    index2 += e.value.length;
                else
                    if (previous && !previous.ranges[1])
                        //We condense a removal followed by an addition into a single change;
                        //if something changed, we want to show it simultaneously on both sides 
                        previous.ranges[1] = [index2, index2 += e.value.length, styleSpec2];
                    else if (previous && 
                            whitespace[string2][1][whitespace[string2][0].indexOf(previous.ranges[1][1])]
                            == index2 - previous.ranges[1][1])
                        //We condense an addition followed by common whitespace followed by addition
                        //into a single addition
                        previous.ranges[1][1] = index2 = index2 + e.value.length;
                    else
                        desynchronizations.push(
                            {targets: [text1, text2],
                            ranges: [undefined, [index2, index2 += e.value.length, styleSpec2]]});
            }
            if (e.removed) {
                if(whitespace[string1][1][whitespace[string1][0].indexOf(index1)] == e.value.length)
                    index1 += e.value.length;
                else
                    if (previous && !previous.ranges[0])
                        //We condense an addition followed by a removal into a single change;
                        //if something changed, we want to show it simultaneously on both sides
                        previous.ranges[0] = [index1, index1 += e.value.length, styleSpec1];
                    else if (previous && 
                            whitespace[string1][1][whitespace[string1][0].indexOf(previous.ranges[0][1])]
                            == index1 - previous.ranges[0][1])
                        //We condense a removal followed by common whitespace followed by a removal
                        //into a single removal
                        previous.ranges[0][1] = index1 = index1 + e.value.length;
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
    
lively.morphic.Panel.subclass('lively.ide.FunctionComparer',
'default category', {
    buildView: function buildView() {  // this.buildView()
        this.withAllSubmorphsDo(function(m) {disconnectAll(m)});
        this.removeAllMorphs();

    	this.createAndArrangePanesFrom([
    		['name1', this.newStaticTextPane, new Rectangle(0, 0, 0.4, 0.05)],
    		['diffButton', this.newButton, new Rectangle(0.4, 0, 0.2, 0.05), "Next diff"],
    		['name2', this.newStaticTextPane, new Rectangle(0.6, 0, 0.4, 0.05)],

    		['codePane1', this.newCodePane, new Rectangle(0, 0.05, 0.5, 0.95)],
    		['codePane2', this.newCodePane, new Rectangle(0.5, 0.05, 0.5, 0.95)],
    	]);
    	
        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        connect(this.diffButton, "fire", this, "nextDifference", {});
    
    },
    nextDifference: function() {
        if(!this.nextDiffImpl) {
            var style = {fontWeight: 'bold', color: Color.red};
            this.nextDiffImpl = new lively.ide.Differator(this.codePane1, this.codePane2, style, style);
        }
        this.nextDiffImpl.next();
    },


    setContents: function(list, optTitleRoot) {
        var i = 1;
        var title = optTitleRoot || '';
        list.each(function(aHolder){
            var codePane = this['codePane' + i++];
            var context = aHolder.context;
            codePane.doitContext = context;
            title += (context ? context.lvContextPath() + '.' : '') + aHolder.string + (title ? '' : '     vs.     ');
            var text = aHolder.func || printInContext(aHolder.string, context);
            codePane.setTextString(text);
            codePane.savedTextString = text;
            this['name' + (i - 1)].setTextString(aHolder.string);
        }, this)
        this.owner.setTitle(title);
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

lively.morphic.Panel.subclass('lively.ide.FunctionListBrowser',
'default category', {
    buildView: function buildView() {  // this.buildView()
        this.withAllSubmorphsDo(function(m) {disconnectAll(m)});
        this.removeAllMorphs();

    	this.createAndArrangePanesFrom([
    		['functionPane', this.newListPane, new Rectangle(0, 0, 1, 0.3)],
    		['codePane', this.newCodePane, new Rectangle(0, 0.3, 1, 0.7)],
    	]);
    	
        if(this.cycleThroughResults) {
            this.functionPane.textOnMouseDown = function onMouseDown(evt) {
                            if (this.owner.owner.allowDeselectClick) {
                                this.setIsSelected(!this.selected);
                            } else if (!this.selected) {
                                this.setIsSelected(true);
                            } else {
                                this.owner.owner.owner.cycle();
                            }
                            evt.stop(); return true;
                        };
        }
        this.functionPane.noSingleSelectionIfMultipleSelected = true;
        this.applyStyle({adjustForNewBounds: true, fill: Color.gray});
    
        connect(this.functionPane, "selection", this, "setFunction", {});
        connect(this.functionPane, "getMenu", this, "getFunctionMenu", {});

    },
    getFunctionMenu: function() {
        var self = this;
        var functionPane = this.functionPane;
        var items = [];
        if(functionPane.isMultipleSelectionList)
            items.push(
                ['disable multiple select', function() {
                    functionPane.allowDeselectClick = false;
                    functionPane.isMultipleSelectionList = false;}]
                );
        else
            items.push(
                ['enable multiple select', function() {
                    functionPane.allowDeselectClick = true;
                    functionPane.isMultipleSelectionList = true;}]
                );

        if (functionPane.selection)
            items.push(
                ['senders', function() {
                    openFunctionList('senders', functionPane.selection.name, true); 
                    }],
                ['implementors', function() {
                    openFunctionList('implementors', functionPane.selection.name); }]
                );
        if(functionPane.getSelectedIndexes().length == 2)
            items.push(
                ['browse differences', function() {self.browseDifferences()}]
                );
        return items;
    },
    setFunction: function(selected) {
        if(this.cycleImpl) {
            this.cycleImpl.reset();
            delete this.cycleImpl;
        }
        if(selected) {
            this.codePane.setTextString(printInContext(selected.name, selected.context));
            this.codePane.doitContext = selected.context;
            if(this.cycleThroughResults)
                this.cycle();
        } else {
            this.codePane.setTextString('');
            this.codePane.doitContext = null;
        }
    },
    initialize: function($super, bounds, cycleThroughResults) {
        $super(bounds);
        this.cycleThroughResults = cycleThroughResults;
    },

    cycle: function() {
        if(!this.cycleImpl) {
            var style = {fontWeight: 'bold', color: Color.red};
            this.cycleImpl = new lively.ide.ReferencesCycler(this.codePane, this.owner.getTitle().split(/\s/).last(), style);
        }
        this.cycleImpl.next();
    },

    browseDifferences: function() {
        var browser = new lively.ide.FunctionComparer(pt(1024, 384));
        browser.openIn($world, 'Browse differences');
        browser.setContents(this.functionPane.getSelectedItems().collect(function(e){
            return {context: e.context, string: e.name}
        }));
        browser.codeBrowser = this;
    },


    setContents: function(list) {
        this.functionPane.setList(list);
    },
});

Object.subclass('lively.ide.ReferencesCycler',
'default category', {

    initialize: function(text, reference) {
        this.text = text;
        var source = text.textString;
        var options = {
            Literal: function(node) {if(node.value == reference) 
                references.push([node.start, node.end]); }
        }
        if(reference.indexOf('.') > -1 || reference.indexOf('[') > -1) {
            options.MemberExpression = function(node) { if(source.substring(node.start, node.end) == reference) 
                references.push([node.start, node.end]); };
        } else {
            options.MemberExpression = function(node) { if(node.property.name == reference)
                references.push([node.property.start, node.property.end]); };
            if(reference in Global)
                options.Expression = function(node) {if(node.type == "Identifier" && node.name == reference) 
                references.push([node.start, node.end]); };
        }
        var references = [];
		lively.ast.acorn.simpleWalk(lively.ast.acorn.parse(source), options);
        this.references = references;
        this.cursor = -1;
    },
    next: function() {
        if(this.references.length == 0)
            return;
        this.cursor++;
        if(this.cursor > 0 && this.cursor == this.references.length)
            this.cursor = 0;
        this.setSelection();
    },
    setSelection: function() {
        if(this.cursor < 0)
            return;
        var range = this.references[this.cursor];
        this.text.setSelectionRange(range[0], range[1]);
        this.text.scrollSelectionIntoView();
    },
    removeEmphasis: function() {
        if(this.cursor < 0)
            return;
        this.text.unEmphasizeAll();
    },
    reset: function() {
        this.removeEmphasis();
        this.cursor = -1;
    }

}
);

Object.extend(Global, {

    nonClassConstructors: function(recursive) {
        var result = [];
        Object.getOwnPropertyNames(this).each(function(name) {
            var object, pjo, methods;
            if (!this.__lookupGetter__(name))
                if ((object = this[name]) instanceof Function &&
                    this.constructor !== object &&
                    !lively.Class.isClass(object) &&
                    object.lvIsConstructor()) {
                        result.push(object);
                        var contextPath = object.lvContextPath();
                        if(!contextPath) {
                            addOwnPropertyIfAbsent(object, 'lvDisplayName', name);
                            contextPath = name;
                        }
                        if(!object.prototype)
                            debugger;
                        var protoContextPath = object.prototype.lvContextPath();
                        if(!protoContextPath)
                            addOwnPropertyIfAbsent(object.prototype, 'lvContextPath', function(){return contextPath + ".prototype";})
                }
                else if((pjo = this[name]) instanceof Object && pjo !== Global && 
                        pjo !== this.constructor && !(pjo instanceof lively.Module)) {
                    var parentPath = name;
                    Object.getOwnPropertyNames(pjo).each(function(name) {
                        var object;
                        if (!pjo.__lookupGetter__(name) &&
                            (object = pjo[name]) instanceof Function &&
                            pjo.constructor !== object &&
                            !lively.Class.isClass(object) &&
                            object.lvIsConstructor()) {
                                result.push(object);
                                var contextPath = object.lvContextPath();
                                var path = parentPath + "." + name;
                                if(!contextPath) {
                                    if(!object.name)
                                        addOwnPropertyIfAbsent(object, 'lvDisplayName', name);
                                    else if(object.name != name )
                                        debugger;
                                    addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return path});
                                    contextPath = path;
                                }
                                var protoContextPath = object.prototype.lvContextPath();
                                if(!protoContextPath)
                                    addOwnPropertyIfAbsent(object.prototype, 'lvContextPath', function(){return contextPath + ".prototype";})}})}
        }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.nonClassConstructors(true)) }).uniq();
    },
    allClasses: function(recursive) {
        var result = [];
        Object.getOwnPropertyNames(this).each(function(name) {
            var object, pjo, methods;
            if (!this.__lookupGetter__(name))
                if ((object = this[name]) instanceof Function &&
                    lively.Class.isClass(object) &&
                    (object.type || object.name) == name) {
                        result.push(object)
                } else if((pjo = this[name]) instanceof Object && pjo !== Global && 
                        pjo !== this.constructor && !(pjo instanceof lively.Module)) {
                    var parentPath = name;
                    Object.getOwnPropertyNames(pjo).each(function(name) {
                        var object;
                        if (!pjo.__lookupGetter__(name) &&
                            (object = pjo[name]) instanceof Function &&
                            lively.Class.isClass(object) &&
                            (object.type || object.name) == parentPath + "." + name) {
                                result.push(object)}})}
        }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.allClasses(true)) }).uniq();
    },

    layers: function (recursive) {
        var result = [];
        Object.keys(this).each(function(name) {
            var object;
            if (!this.__lookupGetter__(name) &&
                (object = this[name]) instanceof Layer) 
                    result.push(object);
        }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.layers(true)) });
    },
    printInContext: function(aFunctionName, context) {
        var contextPath = context.lvContextPath()
        var annotation = "// doitContext = " + contextPath + "\n";
        var func = context[aFunctionName];
        if(func.user && func.timestamp) {
            var ts = new Date(func.timestamp).toUTCString();
            var kindOfChange = func.kindOfChange || 'changed';
            annotation += Strings.format('// '+kindOfChange+' at %s by %s  \n', ts, func.user);
        } else if(func.belongsToTrait && func.displayName &&
                (func.displayName != aFunctionName || func.belongsToTrait.def !== context))
            func = func.belongsToTrait.lvContextPath() + ".def." + func.displayName;
        else if(func.declaredClass && func.methodName && 
                (func.methodName != aFunctionName || func.declaredClass + ".prototype" != contextPath))
            func = func.declaredClass + ".prototype." + func.methodName;
        else if(func.name && func.name != aFunctionName && 
                !context.__lookupGetter__(func.name) && func === context[func.name])
            func = contextPath + "." + func.name;
        else if(func.displayName && func.displayName != aFunctionName && 
                !context.__lookupGetter__(func.displayName) && func === context[func.displayName])
            func = contextPath + "." + func.displayName;
        return annotation + "this." + aFunctionName + " = " + func;
    },



    PJOs: function (recursive) {
        var result = [];
        Object.getOwnPropertyNames(this).each(function(name) {
            var object, methods;
            if (!this.__lookupGetter__(name) &&
                (object = this[name]) instanceof Object &&
                object.constructor === Object &&
                (methods = object.lvOwnFunctionNames()).length > 0 &&
                methods.indexOf("constructor") == -1) {
                    result.push(object);
                    if(!object.hasOwnProperty('lvContextPath'))
                        addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return name;})}
        }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.PJOs(true)) }).uniq();
    },


    knownFunctionContainers: function() {
        var known = subNamespaces(true).select(function(e){return !e.isAnonymous()}).concat(Object.values(lively.ide.commands.byName)).concat([Global, console, location]).concat(layeredFunctionContainers()).concat(PJOs(true));
        
        allClasses(true).concat(nonClassConstructors(true)).each(function(e){
            known.push(e); if(e.prototype) known.push(e.prototype)});
        
        instantiatedBuildSpecsAndSubmorphsWithPaths().each(function(e){if(e.value.attributeStore) known.push(e.value.attributeStore)});
        
        Object.values(RealTrait.prototype.traitRegistry).each(function(e){known.push(e.def)});
        
        morphFunctionContainers().each(function(e){known.push(e.value)});
        
        return known
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
                if(!container.hasOwnProperty('lvContextPath')) {
                    var path = layer.lvContextPath() + "[" + key + "]";
                    addOwnPropertyIfAbsent(container, 'lvContextPath', function(){return path;});
                }
            })
        });
        return result;
    },

    allImplementors: function() {
        var implementors = [];
        var names = [];
        knownFunctionContainers().each(function(e){
            e.lvOwnFunctionNames().each(function(n){
                var index = names.indexOf(n);
                if(index == -1) {
                    names.push(n);
                    implementors.push({name: n, contexts: [e]})
                } else
                    implementors[index].contexts.push(e)
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
                if( prop instanceof Function && !prop.lvIsConstructor() && 
                    (name != 'caller' || !(this instanceof Function)))
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
        var re;
        var wildcardIndex = searchString.indexOf('*');
        if(wildcardIndex >= 0) {
            var queryPattern = searchString.replace(/\*/g, '\\w*');
            if(wildcardIndex !== 0) {
                queryPattern = '\\b' + queryPattern;
            }
            if(searchString.lastIndexOf('*') != searchString.length - 1) {
                queryPattern = queryPattern + '\\b';
            }
            re = new RegExp(queryPattern, 'i');
        } else
            re = new RegExp('\\b' + searchString + '\\b');
        var containers = [];
        knownFunctionContainers().each(function(e){
            var names = e.lvOwnFunctionNames().select(function(n){
                return n.match(re);
            });
            if(names.length > 0)
                containers.push({context: e, names: names});
        });
        return containers
    },
    openFunctionList: function(kind, searchString, cycleThroughResults) {
        var browser = new lively.ide.FunctionListBrowser(pt(640, 480), cycleThroughResults);
        browser.openIn($world, kind + ' of ' + searchString);
        var searchResults = Global[kind](searchString);
        var sortList = [];
        searchResults.each(function(e){
            sortList.push({key: e.context.lvContextPath(), value: e})
        });
        sortList.sort(function compare(a, b){
            if(a.key < b.key) return -1;
            if(a.key > b.key) return 1;
            return 0;
        })
        var list = [];
        sortList.each(function(e){
            var value = e.value;
            var context = value.context;
            var key = e.key;
            value.names.sort().each(function(n){
                list.push({string: key + "." + n, context: context, name: n})
            })
        })
        browser.setContents(list);
    },

    
    senders: function(searchString) {
        // senders("f")
        var source;
        var foundMarker = new Object();
        var options = {
            MemberExpression: function(node) { if(node.property.name == searchString) throw foundMarker; },
            Literal: function(node) {if(node.value == searchString) throw foundMarker; }
        }
        var preceding;
        if(searchString in Global) {
            options.Expression = function(node) {if(node.type == "Identifier" && node.name == searchString) throw foundMarker; };
            preceding = '\\b';
        } else
            preceding = '["\'.]';

        var re = new RegExp(preceding + searchString + '\\b'); 
        var containers = [];
        knownFunctionContainers().each(function(e){
            var names = e.lvOwnFunctionNames().select(function(n){
                var f = e[n];
                source = f.toString();
                if (source.match(re) && !source.endsWith("{ [native code] }")) {
                    var programNode = lively.ast.acorn.parse("var f = " + source);
                    try { lively.ast.acorn.simpleWalk(programNode, options); }
                    catch(t) { 
                        if(t === foundMarker) return true;
                        throw t;
                    }
                }
                return false;
            });
            if(names.length > 0) {
                containers.push({context: e, names: names})
            }
        });
        return containers
    },
    references: function(searchString) {
        // references("whitespace[input][0].push")
        if(!searchString || !searchString.trim())
            return [];
        searchString = searchString.trim();
        var source, options, re;
        var foundMarker = new Object();
        var preamble = "var f = ";
        var options = {
            Literal: function(node) {if(node.value == searchString) throw foundMarker; }
        }
        if(searchString.indexOf('.') > -1 || searchString.indexOf('[') > -1) {
            options.MemberExpression = function(node) { if(source.substring(node.start - preamble.length, node.end - preamble.length) == searchString) throw foundMarker; };
            re = new RegExp('\\b' + searchString.regExpEscape() + '\\b');
        } else {
            options.MemberExpression = function(node) { if(node.property.name == searchString) throw foundMarker; };
            var preceding;
            if(searchString in Global) {
                options.Expression = function(node) {if(node.type == "Identifier" && node.name == searchString) throw foundMarker; };
                preceding = '\\b';
            } else
                preceding = '["\'.]';

            re = new RegExp(preceding + searchString.regExpEscape() + '\\b'); 
        }
        var containers = [];
        knownFunctionContainers().each(function(e){
            var names = e.lvOwnFunctionNames().select(function(n){
                var f = e[n];
                source = f.toString();
                if (source.match(re) && !source.endsWith("{ [native code] }")) {
                    var programNode = lively.ast.acorn.parse(preamble + source);
                    try { lively.ast.acorn.simpleWalk(programNode, options); }
                    catch(t) { 
                        if(t === foundMarker) return true;
                        throw t;
                    }
                }
                return false;
            });
            if(names.length > 0) {
                containers.push({context: e, names: names})
            }
        });
        return containers
    }
    });
    
lively.Module.addMethods("iterating", {
    nonClassConstructors: function(recursive) {
        var result = [];
        var thisPath = this.name();
        Object.getOwnPropertyNames(this).each(function(name) {
            var object, pjo, methods;
            if (!this.__lookupGetter__(name))
                if ((object = this[name]) instanceof Function &&
                    this.constructor !== object &&
                    !lively.Class.isClass(object) &&
                    object.lvIsConstructor()) {
                        result.push(object);
                        var contextPath = object.lvContextPath();
                        var path = thisPath + "." + name;
                        if(!contextPath) {
                            if(!object.name)
                                addOwnPropertyIfAbsent(object, 'lvDisplayName', name);
                            else if(object.name != name )
                                debugger;
                            addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return path});
                            contextPath = path;
                        }
                        var protoContextPath = object.prototype.lvContextPath();
                        if(!protoContextPath)
                            addOwnPropertyIfAbsent(object.prototype, 'lvContextPath', function(){return contextPath + ".prototype";})
                } else if((pjo = this[name]) instanceof Object && pjo !== Global && pjo !== this &&
                        pjo !== this.constructor && !(pjo instanceof lively.Module)) {
                    var parentPath = thisPath + "." + name;
                    Object.getOwnPropertyNames(pjo).each(function(name) {
                        var object;
                        if (!pjo.__lookupGetter__(name) &&
                            (object = pjo[name]) instanceof Function &&
                            pjo.constructor !== object &&
                            !lively.Class.isClass(object) &&
                            object.lvIsConstructor()) {
                                result.push(object);
                                var contextPath = object.lvContextPath();
                                var path = parentPath + "." + name;
                                if(!contextPath) {
                                    if(!object.name)
                                        addOwnPropertyIfAbsent(object, 'lvDisplayName', name);
                                    else if(object.name != name )
                                        debugger;
                                    addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return path});
                                    contextPath = path;
                                }
                                var protoContextPath = object.prototype.lvContextPath();
                                if(!protoContextPath)
                                    addOwnPropertyIfAbsent(object.prototype, 'lvContextPath', function(){return contextPath + ".prototype";})}})}
        }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.nonClassConstructors(true)) }).uniq();
    },
    PJOs: function(recursive) {
        var result = [];
        var thisPath = this.name();
        Object.getOwnPropertyNames(this).each(function(name) {
            var object, methods;
            if (!this.__lookupGetter__(name) &&
                (object = this[name]) instanceof Object &&
                object.constructor === Object &&
                (methods = object.lvOwnFunctionNames()).length > 0 &&
                methods.indexOf("constructor") == -1) {
                    result.push(object);
                    if(!object.hasOwnProperty('lvContextPath')) {
                        var path = thisPath + "." + name;
                        addOwnPropertyIfAbsent(object, 'lvContextPath', function(){return path})}}
        }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.PJOs(true)) });
    },
    allClasses: function(recursive) {
        var result = [];
        var thisPath = this.name();
        Object.getOwnPropertyNames(this).each(function(name) {
            var object, pjo, methods;
            if (!this.__lookupGetter__(name))
                if ((object = this[name]) instanceof Function &&
                    lively.Class.isClass(object) &&
                    (object.type || object.name) == thisPath + "." + name) {
                        result.push(object)
                } else if((pjo = this[name]) instanceof Object && pjo !== Global && pjo !== this &&
                        pjo !== this.constructor && !(pjo instanceof lively.Module)) {
                    var parentPath = thisPath + "." + name;
                    Object.getOwnPropertyNames(pjo).each(function(name) {
                        var object;
                        if (!pjo.__lookupGetter__(name) &&
                            (object = pjo[name]) instanceof Function &&
                            lively.Class.isClass(object) &&
                            (object.type || object.name) == parentPath + "." + name) {
                                result.push(object)}})}
        }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.allClasses(true)) }).uniq();
    },


    layers: function (recursive) {
        var result = [];
        Object.keys(this).each(function(name) {
            var object;
            if (!this.__lookupGetter__(name) &&
                (object = this[name]) instanceof Layer)
                    result.push(object);
        }, this);
        if (!recursive) return result;
        return this.subNamespaces().inject(result, function(result, ns) {
            return result.concat(ns.layers(true)) });
    }
    });

lively.BuildSpec("ChangesetsFlap", {
    _FixedPosition: true,
    _BorderRadius: 20,
    _Extent: lively.pt(130.0,30.0),
    _Fill: Color.rgba(255,255,255,0.8),
    _HandStyle: "pointer",
    className: "lively.morphic.Box",
    currentMenu: null,
    doNotSerialize: ["currentMenu"],
    droppingEnabled: true,
    grabbingEnabled: false,
    isEpiMorph: true,
    menu: null,
    name: "ChangesetsFlap",
    style: {zIndex: 997},
    statusText: {isMorphRef: true,name: "statusText"},
    submorphs: [{
        _Align: "center",
        _ClipMode: "hidden",
        _Extent: lively.pt(87.0,20.0),
        _FontFamily: "Helvetica",
        _HandStyle: "pointer",
        _InputAllowed: false,
        _Position: lively.pt(21.5,12.0),
        allowInput: false,
        className: "lively.morphic.Text",
        evalEnabled: false,
        eventsAreIgnored: true,
        fixedHeight: true,
        fixedWidth: true,
        isLabel: true,
        name: "statusText",
        sourceModule: "lively.morphic.TextCore",
        textString: "Changesets"
    }],
    alignInWorld: function alignInWorld() {
    this.world().cachedWindowBounds = null;
    var topRight = pt(this.world().visibleBounds().width-(40+3*130),-10);
    this.setPosition(topRight);
    this.alignSubmorphs();
},
alignSubmorphs: function alignSubmorphs() {
    this.statusText.align(this.statusText.bounds().center(), this.innerBounds().bottomCenter().addXY(0,-8));
    this.menu && this.menu.align(
        this.menu.bounds().bottomCenter(),
        this.innerBounds().bottomCenter().addXY(2, -8-20));
},
    collapse: function collapse() {
    // this.collapse()
    this.withCSSTransitionForAllSubmorphsDo(function() {
        this.setExtent(lively.pt(130.0,30.0));
        this.alignSubmorphs();
    }, 500, function() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
    });
},
    expand: function expand() {
    var self = this;
    var items = [];
    var world = $world;
    var y;
    if(localStorage.getItem("LivelyChangesets:" +  $world.getUserName() + ":" + location.pathname) === "off" || !world.getUserName()) {
        items.push(
            ['Turn changesets on', function(){
                if(world.getUserName()) {
                    localStorage.setItem("LivelyChangesets:" +  $world.getUserName() + ":" + location.pathname, "on");
                    lively.ChangeSet.initialize();
                } else
                    world.prompt("Please enter your username", function(name) {
                        if (name && name.length > 0) {
                            world.setCurrentUser(name);
                            localStorage.setItem("LivelyChangesets:" +  name + ":" + location.pathname, "on");
                            lively.ChangeSet.initialize();
                            alertOK("set username to: " + name);
                        } else {
                            alertOK("removing username")
                            world.setCurrentUser(undefined);
                        }
                    }, world.getUserName(true));
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                self.collapse();
                }]
        );
        y = 23*1;
    } else {
        items.push(
            ['Turn changesets off', function(){
                localStorage.setItem("LivelyChangesets:" +  $world.getUserName() + ":" + location.pathname, "off");
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                self.collapse();
                }],
            ["Open changes browser", function(){
                new lively.ide.ChangesBrowser(pt(1024, 384)).openIn(world, 'Changes Browser');
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                self.collapse();
                }],
            ["Open simple code browser", function(){
                new lively.ide.SimpleCodeBrowser(pt(640, 480)).openIn(world, 'Simple Code Browser');
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                self.collapse();
                }]
        );
        y = 23*3;
    }
    this.menu = new lively.morphic.Menu(null, items);
    this.menu.openIn(this, pt(0,0), false);
    this.menu.setBounds(lively.rect(0,-66,130,y));
    this.withCSSTransitionForAllSubmorphsDo(function() {
        this.setExtent(pt(140, 46+y));
        this.alignSubmorphs();
    }, 500, function() {});
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.onLoad();
    },
    onLoad: function onLoad() {
    // this.startStepping(5*1000, 'update');
    this.whenOpenedInWorld(function() {
        this.alignInWorld(); });
    this.openInWorld();
    this.statusText.setHandStyle('pointer');
    this.isEpiMorph = true;
},
    onMouseDown: function onMouseDown(evt) {
    if (evt.getTargetMorph() !== this.statusText && evt.getTargetMorph() !== this) return false;
    if (this.menu) this.collapse();
    else this.expand();
    evt.stop(); return true;
},
    onWorldResize: function onWorldResize() {
    this.alignInWorld();
},
    reset: function reset() {
    this.setExtent(lively.pt(100.0,30.0));
    this.statusText = lively.morphic.Text.makeLabel('Changesets', {align: 'center', textColor: Color.rgb(33,33,33), fill: null});
    // this.statusText = this.get('statusText')
    this.addMorph(this.statusText);
    this.statusText.name = 'statusText'
    this.setFixed(true);
    this.isEpiMorph = true;
    this.setHandStyle('pointer');
    this.statusText.setHandStyle('pointer');
//    this.startStepping(5*1000, 'update');
    this.grabbingEnabled = false;
    this.lock();
    this.doNotSerialize = ['currentMenu']
    this.currentMenu = null;
    this.buildSpec();
},
    session: function session() {
    return lively.net.SessionTracker.getSession();
}
});

(function openChangesetsFlap() {
    lively.whenLoaded(function(world) {
        if (Config.changesetsExperiment)
            lively.BuildSpec('ChangesetsFlap').createMorph().openInWorld();
    });
})();


(function loadChangeSets() {
    lively.whenLoaded(function(world) {
        if (Config.changesetsExperiment && world.getUserName() && 
            localStorage.getItem("LivelyChangesets:" +  world.getUserName() + ":" + location.pathname) !== "off") {
                lively.ChangeSet.initialize();
                if (Config.automaticChangesReplay)
                    lively.ChangeSet.loadAndcheckVsSystem();
            }
    });
}).delay(location.hostname === 'localhost' ? 3 : 13);

}) // end of module
