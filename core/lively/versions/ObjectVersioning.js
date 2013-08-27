module('lively.versions.ObjectVersioning').requires('lively.versions.UglifyTransformer').toRun(function() {
    
Object.extend(lively.versions.ObjectVersioning, {
    versioningProxyHandler: function(objectID) {
        return {
            // our proxies are fully virtual. so the first parameter to all
            // traps, the actual proxy target, should be an empty object
            // that shouldn't be touched
            
            // __objectID can be resolved via global object table
            __objectID: objectID,
            
            // === helpers ===
            targetObject: function() {
                return this.getObjectByID(this.__objectID);
            },
            getObjectByID: function(id) {
                return lively.versions.ObjectVersioning.getObjectByID(id);
            },
            ensureNonPrimitiveObjectIsProxied: function(obj) {
                var result = obj;
                
                if (!lively.versions.ObjectVersioning.isProxy(obj)) {
                    if (!lively.versions.ObjectVersioning.isPrimitiveObject(obj)) {
                        result = lively.versions.ObjectVersioning.proxyFor(obj);
                    }
                }
                
                return result;
            },
            
            // === proxy handler traps ===
            set: function(virtualTarget, name, value, receiver) {
                var targetObject,
                    newObject;
                
                targetObject = this.targetObject();
                
                // copy-on-first-write objects commited in previous versions
                if (Object.isFrozen(targetObject)) {
                    newObject = Object.clone(targetObject);
                    lively.CurrentObjectTable[this.__objectID] = newObject;
                    targetObject = newObject;
                }
                
                if (name === '__proto__') {
                    if (value && value.__objectID) {
                        targetObject.__protoID = value.__objectID;
                    } else {
                        targetObject.__protoID = null;
                        targetObject.__proto__ = value;
                    }
                    return true;
                }
                       
                targetObject[name] = value;
                
                return true;
            },
            get: function(virtualTarget, name, receiver) {
                var targetObject, result, nextAncestor;
                
                // proxy meta-information
                if (name === '__isProxy') {
                    return true;
                }
                if (name === '__objectID') {
                    return this.__objectID;
                }
                
                targetObject = this.targetObject();
                if (name === '__proto__') {
                    if (targetObject.__protoID) {
                        return lively.ProxyTable[targetObject.__protoID];
                    } else {
                        return targetObject.__proto__;
                    }
                }
                
                result = targetObject[name];
                
                if (result === undefined) {
                    nextAncestor = this.getObjectByID(targetObject.__protoID);
                    while (result === undefined && nextAncestor) {
                        result = nextAncestor[name];
                        nextAncestor = nextAncestor.__protoID ? 
                            this.getObjectByID(nextAncestor.__protoID) : 
                            null;
                    }
                }
                
                return this.ensureNonPrimitiveObjectIsProxied(result);
            },
            apply: function(virtualTarget, thisArg, args) {
                var result,
                    OV = lively.versions.ObjectVersioning,
                    method = this.targetObject(),
                    targetObject = thisArg;
                
                result = method.apply(targetObject, args);
                
                return this.ensureNonPrimitiveObjectIsProxied(result);
            },
            construct: function(virtualTarget, args) {
                var OriginalConstructor = this.targetObject(),
                    newInstance;
                
                newInstance = lively.proxyFor({
                    __protoID: OriginalConstructor.prototype.__objectID
                });
                newInstance.constructor = OriginalConstructor;
                
                OriginalConstructor.apply(newInstance, args);
                
                return newInstance;
            },
            getPrototypeOf: function(virtualTarget) {
                var protoID = this.targetObject().__protoID;
                if (protoID) {
                    return lively.ProxyTable[protoID];
                } else {
                    return Object.getPrototypeOf(this.targetObject());
                }
            },
            has: function(virtualTarget, name) {
                var result, targetObject, protoID, nextAncestor;
                
                targetObject = this.targetObject();
                
                result = (name in targetObject);
                
                // FIXME: pretty similar in how proto-lookup is done in the get-trap
                if (!result) {
                    protoID = targetObject.__protoID
                    nextAncestor = protoID ? this.getObjectByID(protoID) : null;
                    while (!result && nextAncestor) {
                        result = (name in nextAncestor);
                        nextAncestor = nextAncestor.__protoID ? 
                            this.getObjectByID(nextAncestor.__protoID) : 
                            null;
                    }
                }
                
                return result;
            },
            hasOwn: function(virtualTarget, name) {
                return ({}).hasOwnProperty.call(this.targetObject(), name);
            },
            getOwnPropertyNames: function(virtualTarget) {
                return Object.getOwnPropertyNames(this.targetObject());
            },
            enumerate: function(virtualTarget) {
                var targetObject = this.targetObject(),
                    enumerableProps = [],
                    nextAncestor,
                    protoID;
                    
                for (var prop in targetObject) {
                    enumerableProps.push(prop);
                }
                
                protoID = targetObject.__protoID;
                nextAncestor = protoID ? this.getObjectByID(protoID) : null;
                while (nextAncestor) {
                    for (var prop in nextAncestor) {
                        if (!enumerableProps.include(prop))
                            enumerableProps.push(prop);
                    }
                    nextAncestor = nextAncestor.__protoID ? 
                        this.getObjectByID(nextAncestor.__protoID) : 
                        null;
                }
                
                return enumerableProps;
            },
            keys: function(virtualTarget) {
                return Object.keys(this.targetObject());
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
        };
    }
});

Object.extend(lively.versions.ObjectVersioning, {
    init: function() {
        if (!lively.CurrentObjectTable) {
            lively.CurrentObjectTable = [];
        }
        if (!lively.ProxyTable) {
            lively.ProxyTable = [];
        }
        if (!lively.create) {
            this.wrapObjectCreate();
        }
    },
    wrapObjectCreate: function() {
        lively.origObjectCreate = Object.create
        
        var wrappedCreate = function(proto) {
            // when proxied are used as prototypes, the prototypes can't be changed.
            // seems related to: http://github.com/tvcutsem/harmony-reflect/issues/18
            if (lively.isProxy(proto)) {
                return lively.origObjectCreate({
                    __realPrototypeObjectID: proto.__objectID
                });
            } else {
                return lively.origObjectCreate.apply(null, arguments);
            }
        }
        // Object.create = wrappedCreate;
        lively.create = wrappedCreate;
    },
    proxyFor: function(target) {        
        // proxies are fully virtual objects: they don't point to their target, 
        // but refer to it by their __objectID through lively.CurrentObjectTable
        var proto, protoID, virtualTarget, proxy;
        
        if (target === Function.prototype) {throw new Error('root prototypes should not be inserted!!');}
        
        if (this.isProxy(target)) 
            throw new TypeError('Proxies shouldn\'t be inserted into the object tables');
            
        if (target !== Object(target)) 
            throw new TypeError('Primitive objects shouldn\'t be wrapped');
        
        if (target.__objectID !== undefined)
            return this.getProxyByID(target.__objectID);
        
        if (target.prototype) {
            // some function's have prototypes, which get used when calling
            // constructors and in the construct-trap,
            // note that some built-in functions don't have prototypes
            target.prototype = this.proxyFor(target.prototype);
        }
        
        virtualTarget = this.virtualTargetFor(target);
        
        if (target.__protoID === undefined) {
            proto = Object.getPrototypeOf(target);
            if (proto && !([Object.prototype, Function.prototype, Array.prototype].include(proto))) {
                if (this.isProxy(proto)) {
                    // this should currently not happen, because when proxies
                    // are used as prototypes, the prototype can't be changed
                    // later on. so we actively need to prevent proxies from
                    // being used as prototypes, see this>>wrapObjectCreate
                    protoID = proto.__objectID;
                } else if (proto.__realPrototypeObjectID !== undefined) {
                    protoID = proto.__realPrototypeObjectID;
                } else {
                    protoID = this.proxyFor(proto).__objectID;
                }
                target.__proto__ = Object.prototype;
            } else {
                // proto is a root prototype
                protoID = null;
            }
            
            // set __protoID as not enumerable and not configurable
            Object.defineProperty(target, '__protoID', {
                writable: true,
                value: protoID
            });
        }
        
        // set __objectID as not enumerable, not configurable, and not writable
        // for both the target and the virtualTarget (spec consistency check)
        Object.defineProperty(target, '__objectID', {
            value: lively.CurrentObjectTable.length
        });
        Object.defineProperty(virtualTarget, '__objectID', {
            value: lively.CurrentObjectTable.length
        });
        
        lively.CurrentObjectTable.push(target);
        
        proxy = Proxy(virtualTarget, this.versioningProxyHandler(target.__objectID));
        lively.ProxyTable[target.__objectID] = proxy;
        
        return proxy;
    },
    virtualTargetFor: function(actualTarget) {
        var virtualTarget;
        
        // only proxies for functions do trap function application
        if (Object.isFunction(actualTarget)) {
            // function names are non-configurable, non-writable properties,
            // and the proxy spec requires such the values to be returned
            // consistently from the get-trap, that is, matching the actual
            // proxy target
            virtualTarget = eval('virtualTarget = function ' + actualTarget.name + '() {}');
        } else {
            virtualTarget = {};
        }
        
        return virtualTarget;
    },
    proxyForRootPrototype: function() {
        if (!lively.versions.ObjectVersioning.ProxyForObjectPrototype) {
            lively.versions.ObjectVersioning.ProxyForObjectPrototype = lively.proxyFor(Object.prototype);
        }
        return lively.versions.ObjectVersioning.ProxyForObjectPrototype;
    },
    getObjectForProxy: function(proxy, optObjectTable) {
        var id = proxy.__objectID;
        
        if (id === undefined) {
            return undefined;
        }
        
        return this.getObjectByID(id, optObjectTable);
    },
    getObjectByID: function(id, optObjectTable) {
        var objectTable = optObjectTable || lively.CurrentObjectTable;
        
        return objectTable[id];
    },
    getProxyByID: function(id) {
        return lively.ProxyTable[id];
    },
    setObjectForProxy: function(target, proxy, optObjectTable) {
        var objectTable = optObjectTable || lively.CurrentObjectTable;
        objectTable[proxy.__objectID] = target;
    },
    isProxy: function(obj) {
        if (!obj) {
            // primitive falsy values can't be proxied
            return false;
        }
        
        // coerce to boolean
        return !!obj.__isProxy;
    },
    isPrimitiveObject: function(obj) {
        return obj !== Object(obj);
    },
    commitVersion: function() {
        var previousVersion;
        
        previousVersion = lively.CurrentObjectTable;
        lively.CurrentObjectTable = Object.clone(lively.CurrentObjectTable);
        lively.CurrentObjectTable.previousVersion = previousVersion;
        previousVersion.nextVersion = lively.CurrentObjectTable;
        
        // freeze all objects as previous versions shouldn't change,
        // so objects need to be copied on write in following versions
        // however: using Object.freeze() for this has the drawback that
        // objects frozen elsewhere can be written again in following versions
        lively.CurrentObjectTable.forEach(function (ea) {
            Object.freeze(ea);
        })
        
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
        return lively.CurrentObjectTable.previousVersion;
    },
    followingVersion: function() {
       return lively.CurrentObjectTable.nextVersion;
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

        Object.create = this.proxyFor(Object.create);
        JSON.parse = this.proxyFor(JSON.parse);
    },
});

Object.extend(lively.versions.ObjectVersioning, {
    transformSource: function(source) {
        return lively.versions.UglifyTransformer.transformSource(source, {beautify: true});
    }
});

// lively OV shortcuts
var livelyOV = lively.versions.ObjectVersioning;
lively.proxyFor = livelyOV.proxyFor.bind(livelyOV);
lively.objectFor = livelyOV.getObjectForProxy.bind(livelyOV);
lively.isProxy = livelyOV.isProxy.bind(livelyOV);

// start
lively.versions.ObjectVersioning.init();

});
