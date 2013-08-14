module('lively.versions.ObjectVersioning').requires('lively.versions.UglifyTransformer').toRun(function() {
    
Object.extend(lively.versions.ObjectVersioning, {
    versioningProxyHandler: function() {
        return {
            // these proxies are fully virtual, so the first parameter to all 
            // traps is an empty object and shouldn't be touched
            
            // __objectID can be resolved via global object table
            __objectID: null,
            
            // === helpers ===
            targetObject: function() {
                return lively.CurrentObjectTable[this.__objectID];
            },
            proxyNonPrimitiveObjects: function(obj) {
                var result = obj;
                
                if (!lively.versions.ObjectVersioning.isProxy(obj)) {
                    if (!lively.versions.ObjectVersioning.isPrimitiveObject(obj)) {
                        result = lively.versions.ObjectVersioning.proxy(obj);
                    }
                }
                
                return result;
            },
            
            // === proxy handler traps ===
            set: function(virtualTarget, name, value, receiver) {
                var targetObject,
                    newObject;
                
                // proxy meta-information
                if (name === '__objectID') {
                    this[name] = value;
                    return true;
                }
                                
                targetObject = lively.versions.ObjectVersioning.getObjectForProxy(receiver);
                
                // copy-on-first-write objects commited in previous versions
                if (Object.isFrozen(targetObject)) {
                    newObject = Object.clone(targetObject);
                    lively.versions.ObjectVersioning.setObjectForProxy(newObject, receiver);
                    targetObject = newObject;
                }
                       
                targetObject[name] = value;
                
                return true;
            },
            get: function(virtualTarget, name, receiver) {
                var targetObject,
                    result;
                
                // proxy meta-information
                if (name === '__objectID') {
                    return this.__objectID;
                }
                
                targetObject = lively.versions.ObjectVersioning.getObjectForProxy(receiver);                
                result = targetObject[name];
                return this.proxyNonPrimitiveObjects(result); 
            },
            apply: function(virtualTarget, thisArg, args) {
                var result,
                    OV = lively.versions.ObjectVersioning,
                    method = this.targetObject(),
                    targetObject = OV.isProxy(thisArg) ? OV.getObjectForProxy(thisArg) : thisArg;
                
                result = method.apply(targetObject, args);
                return this.proxyNonPrimitiveObjects(result);
            },
            construct: function(virtualTarget, args) {
                var OriginalConstructor = this.targetObject(),
                    newInstance;
                    
                // the following workaround is necessary as it's not possible
                // to supply a variable number of arguments to a constructor
                function ConstructorWrapper() {
                    return OriginalConstructor.apply(this, args);
                }
                ConstructorWrapper.prototype = OriginalConstructor.prototype;
                newInstance = new ConstructorWrapper();
                
                return lively.versions.ObjectVersioning.proxy(newInstance);
            },
            has: function(virtualTarget, name) {
                // proxy meta-information
                if (name === '__objectID') {
                    return true;
                }
                
                return name in this.targetObject();
            },
            hasOwn: function(virtualTarget, name) {
                // proxy meta-information
                if (name === '__objectID') {
                    return true;
                }
                
                return this.targetObject().hasOwnProperty(name);
            },
            getOwnPropertyNames: function(virtualTarget) {
                return Object.getOwnPropertyNames(this.targetObject());
            },
            freeze: function(virtualTarget) {
                // freeze the virtual target as well, as required by the spec
                Object.freeze(virtualTarget);
                
                return Object.freeze(this.targetObject());
            },
            isFrozen: function(virtualTarget) {
                return Object.isFrozen(this.targetObject());
            },
            seal: function(virtualTarget) {
                // seal the virtual target as well, as required by the spec
                Object.seal(virtualTarget);
                
                return Object.seal(this.targetObject());
            },
            isSealed: function(virtualTarget) {
                return Object.isSealed(this.targetObject());
            },
            preventExtensions: function(virtualTarget) {
                // prevent extensions to the virtual target as well, as
                // required by the spec
                Object.preventExtensions(virtualTarget);
                
                return Object.preventExtensions(this.targetObject());
            },
            isExtensible: function(virtualTarget) {
                return Object.isExtensible(this.targetObject());
            },
            getPrototypeOf: function(virtualTarget) {
                return Object.getPrototypeOf(this.targetObject());
            },
            enumerate: function(virtualTarget) {
                var targetObject = this.targetObject(),
                    enumerableProps = [];
                    
                for (var prop in targetObject) {
                    enumerableProps.push(prop);
                }
                
                return enumerableProps;
            },
            keys: function(virtualTarget) {
                return Object.keys(this.targetObject());
            }
        };
    }
});

Object.extend(lively.versions.ObjectVersioning, {
    init: function() {
        lively.CurrentObjectTable = [];
        lively.Versions = []; // a linear history (for now)
        
        lively.Versions.push(lively.CurrentObjectTable);
    },
    proxy: function(target) {        
        // proxies are fully virtual objects: they don't point to their target, 
        // but refer to it by __objectID
        var id, proxy, virtualTarget;
        
        if (this.isProxy(target)) {
            throw new TypeError('Proxies shouldn\'t be inserted into the object tables');
        }
        
        if (target !== Object(target)) {
            throw new TypeError('Primitive objects shouldn\'t be wrapped');
        }
        
        lively.CurrentObjectTable.push(target);
        
        // only proxies for functions do trap function application
        virtualTarget = Object.isFunction(target) ? function() {} : {};
        
        proxy = Proxy(virtualTarget, this.versioningProxyHandler());
        id = lively.CurrentObjectTable.length - 1;
        proxy.__objectID = id;
        
        return proxy;
    },
    getObjectForProxy: function(proxy, optObjectTable) {
        var objectTable = optObjectTable || lively.CurrentObjectTable;
        
        return objectTable[proxy.__objectID];
    },
    setObjectForProxy: function(target, proxy, optObjectTable) {
        var objectTable = optObjectTable || lively.CurrentObjectTable;
        objectTable[proxy.__objectID] = target;
    },
    isProxy: function(obj) {
        if (!obj) {
            return false;
        }
        
        return ({}).hasOwnProperty.call(obj, '__objectID');
    },
    isPrimitiveObject: function(obj) {
        return obj !== Object(obj);
    },
    commitVersion: function() {
        var previousVersion,
            nextVersion;
        
        previousVersion = lively.CurrentObjectTable;
        nextVersion = Object.clone(lively.CurrentObjectTable);
        lively.Versions.push(nextVersion);
        
        // freeze all objects as previous versions shouldn't change,
        // so objects need to be copied on write in following versions
        // however: using Object.freeze() for this has the drawback that
        // objects frozen elsewhere can be written again in following versions
        nextVersion.forEach(function (ea) {
            Object.freeze(ea);
        })
                
        lively.CurrentObjectTable = nextVersion;
        
        return previousVersion; 
    },
    undo: function() {
        var previousVersion = this.previousVersion();
        if (!previousVersion) {
            throw new Error('Can\'t undo: No previous version.');
        }
        lively.CurrentObjectTable = previousVersion;
    },
    redo: function() {
        var followingVersion = this.followingVersion();
        if (!followingVersion) {
            throw new Error('Can\'t redo: No next version.');
        }
        lively.CurrentObjectTable = this.followingVersion();
    },
    previousVersion: function() {
        var index = lively.Versions.indexOf(lively.CurrentObjectTable) - 1;
        if (index < 0) {
            return undefined;
        }
        return lively.Versions[index];
    },
    followingVersion: function() {
        var index = lively.Versions.indexOf(lively.CurrentObjectTable) + 1;
        if (index >= lively.Versions.size()) {
            return undefined;
        }
        return lively.Versions[index];
    },
    start: function() {
        this.init();
        this.wrapEval();
        this.wrapGlobalObjects();
    },
    wrapEval: function() {
        var originalEval = eval;
        eval = function(code) {
            var transformedCode = lively.versions.ObjectVersioning.transformSource(code);
            return originalEval(transformedCode);
        }
    },
    wrapGlobalObjects: function() {
        // TODO: built-in functions that create new objects
        // have to return proxies for the new objects, e.g.

        // Object.create()
        // JSON.parse()
        // Array methods: concat(), slice(), map(), filter()...
        // Date constructor and parse() and UTC()
        // and other global objects in Global / window

        // just proxying every global object doesn't work (reloads, bookmarks..)
        
        // Properties.all(Global).forEach((function(ea) {
        //     if (this.isProxy(Global[ea]) ||
        //         this.isPrimitiveObject(Global[ea])) 
        //             return;
        //
        //     Global[ea] = this.proxy(Global[ea]);
        // }).bind(this));

        Object.create = this.proxy(Object.create);
        JSON.parse = this.proxy(JSON.parse);
    },
});

Object.extend(lively.versions.ObjectVersioning, {
    transformSource: function(source) {
        return lively.versions.UglifyTransformer.transformSource(source);
    }
});

lively.versions.ObjectVersioning.init();

});