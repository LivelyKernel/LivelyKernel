ObjectVersioning = {
    versioningProxyHandler: function(objectID) {
        return {
            // the versioning proxies are fully virtual. so, the first
            // parameter to all traps, the actual proxy target, should be an
            // empty object and shouldn't be touched (except when required by
            // the spec's consistency checks)
            
            // __objectID can be resolved via global object table
            __objectID: objectID,
            
            // === helpers ===
            targetObject: function() {
                return this.getObjectByID(this.__objectID);
            },
            getObjectByID: function(id) {
                return ObjectVersioning.getObjectByID(id);
            },
            ensureNonPrimitiveObjectIsProxied: function(obj) {
                if (!ObjectVersioning.isProxy(obj) &&
                        !ObjectVersioning.isPrimitiveObject(obj)) {
                    return ObjectVersioning.proxyFor(obj);
                } else {
                    return obj;
                }
            },
            lookupInObjAndProtoChainWhile: function (obj, lookup,
                         whileCondition) {
                var result = lookup(obj),
                    proto = this.getObjectByID(obj.__protoID);
                
                if (whileCondition(result) && proto) {
                    result = this.lookupInObjAndProtoChainWhile(
                        proto,
                        lookup,
                        whileCondition
                    );
                }
                return result;
            },
            
            // === proxy handler traps ===
            set: function(virtualTarget, name, value, receiver) {
                var targetObject,
                    newObject;
                
                targetObject = this.targetObject();
                
                // targetObject was commited in previous version (copy-on-write)
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
                
                result = this.lookupInObjAndProtoChainWhile(
                    targetObject,
                    function(obj) { return obj[name] },
                    function(result) { return result === undefined }
                );
                
                return this.ensureNonPrimitiveObjectIsProxied(result);
            },
            apply: function(virtualTarget, thisArg, args) {
                var result,
                    method = this.targetObject(),
                    targetObject = thisArg;
                
                // workaround to have functions print with their function bodies
                if (Object.isFunction(thisArg) && !thisArg.__protoID &&
                        ObjectVersioning.isProxy(thisArg)) {
                    // can't test if thisArg.name === 'toString' because the
                    // function might be wrapped (in harmony-reflect shim)
                    targetObject = ObjectVersioning.objectFor(thisArg);
                }
                
                result = method.apply(targetObject, args);
                
                return this.ensureNonPrimitiveObjectIsProxied(result);
            },
            construct: function(virtualTarget, args) {
                var OriginalConstructor = this.targetObject(),
                    newInstance;
                
                newInstance = ObjectVersioning.proxyFor({
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
                return this.lookupInObjAndProtoChainWhile(
                    this.targetObject(),
                    function(obj) { return name in obj },
                    function(result) { return !result }
                );
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
                // also freeze the virtual target (required by the spec)
                Object.freeze(virtualTarget);
                
                return Object.freeze(this.targetObject());
            },
            isFrozen: function(virtualTarget) {
                return Object.isFrozen(this.targetObject());
            },
            seal: function(virtualTarget) {
                // also seal the virtual target (required by the spec)
                Object.seal(virtualTarget);
                
                return Object.seal(this.targetObject());
            },
            isSealed: function(virtualTarget) {
                return Object.isSealed(this.targetObject());
            },
            preventExtensions: function(virtualTarget) {
                // also prevent extensions to the virtual target (required by
                // the spec)
                Object.preventExtensions(virtualTarget);
                
                return Object.preventExtensions(this.targetObject());
            },
            isExtensible: function(virtualTarget) {
                return Object.isExtensible(this.targetObject());
            },
        };
    },
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
            // when proxies are used as prototypes of objects, the prototypes of these objects
            // can't be changed. seems related to:
            // http://github.com/tvcutsem/harmony-reflect/issues/18
            var instance;
            
            if (ObjectVersioning.isProxy(proto)) {
                // can't just un-proxy the proxied prototype and pass it to the
                // original Object.create, because the prototype itself might
                // have a prototype only available via __protoID (and that's
                // thus available when the prototype is proxied)
                instance = {__protoID: proto.__objectID};
            } else {
                instance = lively.origObjectCreate.apply(null, arguments);
            }
            return instance;
        }
        lively.create = wrappedCreate;
        Object.create = lively.create;
    },
    proxyFor: function(target) {        
        // proxies are fully virtual objects: they don't point to their target, 
        // but refer to their target only via their __objectID-property,
        // through lively.CurrentObjectTable
        var proto, protoID, virtualTarget, proxy;
        
        if (target === Function.prototype) {throw new Error('root prototypes should not be inserted!!');}
        
        if (this.isProxy(target)) 
            throw new TypeError('Proxies shouldn\'t be inserted into the object tables');
            
        if (target !== Object(target)) 
            throw new TypeError('Primitive objects shouldn\'t be wrapped');
        
        if (target.__objectID !== undefined)
            return this.getProxyByID(target.__objectID);
        
        if (target.prototype && !this.isProxy(target.prototype)) {
            // some function's have prototypes, which get used when calling
            // constructors and in the construct-trap. note that some built-in
            // functions don't have prototypes
            target.prototype = this.proxyFor(target.prototype);
        }
        
        virtualTarget = this.virtualTargetFor(target);
        
        if (target.__protoID === undefined) {
            proto = Object.getPrototypeOf(target);
            if (proto && !([Object.prototype, Function.prototype, Array.prototype].include(proto))) {
                if (this.isProxy(proto)) {
                    // this should currently not happen, because when proxies
                    // are used as prototypes, the prototype can't be changed
                    // later on and we, therefore, actively prevent proxies from
                    // being used as prototypes, see this>>wrapObjectCreate
                    protoID = proto.__objectID;
                } else {
                    protoID = this.proxyFor(proto).__objectID;
                }
                target.__proto__ = Object.prototype;
            } else {
                // the prototype is one of the root prototypes
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
        var targetExpression,
            virtualTarget;
        
        // only proxies for functions trigger a trap on function application
        if (Object.isFunction(actualTarget)) {
            // function names are non-configurable and non-writable properties,
            // which the proxy spec requires to be returned consistently from
            // traps. that is, matching the actual proxy target
            
            targetExpression = 'virtualTarget = function ' + actualTarget.name
                    + '() {}';
            virtualTarget = this.originalEval ?
                this.originalEval(targetExpression) : eval(targetExpression);
            
        } else {
            virtualTarget = {};
        }
        
        return virtualTarget;
    },
    proxyForRootPrototype: function() {
        if (!ObjectVersioning.ProxyForObjectPrototype) {
            ObjectVersioning.ProxyForObjectPrototype = ObjectVersioning.proxyFor(Object.prototype);
        }
        return ObjectVersioning.ProxyForObjectPrototype;
    },
    objectFor: function(proxy, optObjectTable) {
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
        return !!obj && !!obj.__isProxy;
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
        
        // freeze all objects as the objects of previous versions shouldn't
        // change. frozen objects get copied when they are changed in following
        // versions. however: using Object.freeze() for this has the
        // disadvantage that objects frozen elsewhere can be written again in
        // following versions, once they got copied
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
            var transformedCode = ObjectVersioning.transformSource(code);
            return originalEval(transformedCode);
        }
        this.originalEval = originalEval;
    },
    wrapGlobalObjects: function() {
        // TODO: built-in functions that create new objects
        // have to return proxies for the new objects. examples:
        // Object.create()
        // JSON.parse()
        // Array methods: concat(), slice(), map(), filter()...
        // Date constructor and parse() and UTC()
        // and other global objects in Global / window
        
        JSON = this.proxyFor(JSON);
        Object.create = this.proxyFor(Object.create);
    },
    transformSource: function(source) {
        return ObjectVersioningSourceTransformations.transformSource(source, {beautify: true});
    }
};

// start
ObjectVersioning.init();
