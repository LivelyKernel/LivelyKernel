module('lively.versions.ObjectVersioning').requires('lively.versions.SourceTransformations').toRun(function() {
    
Object.defineProperty(Object.prototype, 'isProxy', {
    value: function() {
        return false
    },
    writable: true
});

Object.extend(Object, {
    instanceOf: function(obj, type) {
        var realObj, realPrototype, FakeConstructor;
        
        if (!obj.isProxy() && (!type.prototype || !type.prototype.isProxy())) {
            return obj instanceof type
        }
        
        realObj = obj.isProxy() ? obj.proxyTarget : obj;
        realPrototype = type.prototype.isProxy() ?
            type.prototype.proxyTarget : type.prototype;
        
        FakeConstructor = function() {};
        FakeConstructor.prototype = realPrototype;
        
        return realObj instanceof FakeConstructor;
    }
});

Object.extend(lively.versions.ObjectVersioning, {
    versioningProxyHandler: function(objectID) {
        return {
            // the versioning proxies are fully virtual. so, the first
            // parameter to all traps, the actual proxy target, should be an
            // empty object and shouldn't be touched (except when required by
            // the spec's consistency checks), to reflect this it's named
            // dummyTarget
            
            // __objectID can be resolved via global object table
            __objectID: objectID,
            
            // === helpers ===
            isProxy: function() { return true },
            
            targetObject: function() {
                return this.getObjectByID(this.__objectID);
            },
            getObjectByID: function(id) {
                return lively.versions.ObjectVersioning.getObjectByID(id);
            },
            ensureProxied: function(obj) {
                var livelyOV = lively.versions.ObjectVersioning;
                
                if (!livelyOV.isPrimitiveObject(obj) &&
                    !obj.isProxy() &&
                    !livelyOV.isRootPrototype(obj)) {
                    return lively.proxyFor(obj);
                 } else {
                    return obj;
                }
            },
            checkProtoChains: function(proxyTarget, proxy) {
                var targetAncestor = proxyTarget.__proto__,
                    proxyAncestor = proxy.__proto__;
                
                while(targetAncestor) {
                    if (!targetAncestor ===
                             lively.objectFor(proxyAncestor)) {
                        
                        // TODO: fix the proxyTarget's prototype chain in this
                        // case...
                        throw new Error('__protoID chain inconsistent to ' +
                            'the object\'s actual prototype chain');
                    }
                    targetAncestor = targetAncestor.__proto__;
                    proxyAncestor = proxyAncestor.__proto__;
                }
            },
            
            // === proxy handler traps ===
            set: function(dummyTarget, name, value, receiver) {
                var targetObject,
                    newObject;
                
                targetObject = this.targetObject();
                
                // targetObject was commited in previous version (copy-on-write)
                if (Object.isFrozen(targetObject)) {
                    newObject = Object.clone(targetObject);
                    newObject.__protoID = targetObject.__protoID;
                    lively.CurrentObjectTable[this.__objectID] = newObject;
                    targetObject = newObject;
                }
                
                if (name === '__proto__') {
                    if (value && value.isProxy()) {
                        targetObject.__protoID = value.__objectID;
                        targetObject.__proto__ = lively.objectFor(value);
                    } else {
                        targetObject.__protoID = null;
                        targetObject.__proto__ = value;
                    }
                    return true;
                }
                
                if (name === 'onreadystatechange' && value.isProxy() &&
                    targetObject.constructor.name === 'XMLHttpRequest') {
                    value = value.proxyTarget;
                }
                       
                targetObject[name] = value;
                
                return true;
            },
            get: function(dummyTarget, name, receiver) {
                var result, nextAncestor, proto, targetObject,
                    OV = lively.versions.ObjectVersioning;
                
                // proxy meta-information
                if (name === '__objectID') {
                    return this.__objectID;
                }
                if (name === 'isProxy') {
                    return this.isProxy;
                }
                if (name === 'proxyTarget') {
                    return this.targetObject();
                }
                
                targetObject = this.targetObject();
                
                // special handling
                if (name === '__proto__') {
                    if (targetObject.__protoID) {
                        return lively.ProxyTable[targetObject.__protoID];
                    } else {
                        proto = targetObject.__proto__;
                        if (lively.isPrimitiveObject(proto) ||
                            OV.isRootPrototype(proto)) {
                                return proto;
                            } else {
                                return lively.proxyFor(proto);
                            }
                    }
                }
                if (name === 'prototype' && Object.isFunction(targetObject)) {
                    // prototype is already proxied or a root prototype
                    return targetObject.prototype;
                }
                
                // default handling
                if (({}).hasOwnProperty.call(targetObject, name)) {
                    result = targetObject[name];
                } else {
                    if (targetObject.__protoID === null) {
                        var proto = targetObject.__proto__;
                    } else {
                        var proto = lively.ProxyTable[targetObject.__protoID];
                    }
                    result = proto ? proto[name] : undefined;
                }
                
                // workaround for legacy setters and getters:
                // not sure why, but the apply-trap otherwise uses the
                // wrong targetObject for these functions
                if (name === '__defineSetter__' ||
                    name === '__defineGetter__' ||
                    name === '__lookupSetter__' ||
                    name === '__lookupGetter__') {
                    
                    result = result.bind(targetObject);
                }
                
                return this.ensureProxied(result);
            },
            apply: function(dummyTarget, thisArg, args) {
                var result,
                    method = this.targetObject(),
                    targetObject = thisArg;
                
                // workaround to have functions print with their function bodies
                if (Object.isFunction(thisArg) && 
                        thisArg.isProxy() &&
                        !thisArg.__protoID) {
                    // can't test if thisArg.name === 'toString' because the
                    // function might be wrapped (in harmony-reflect shim)
                    targetObject = lively.objectFor(thisArg);
                }
                
                // some primitive code can't handle proxies
                if (thisArg && thisArg.isProxy() &&
                    method.toString().include('{ [native code] }')) {
                    
                    targetObject = lively.objectFor(thisArg);
                    args = args.map(function(each) {
                        return (each && each.isProxy()) ?
                             lively.objectFor(each) : each;
                    })
                    
                    this.checkProtoChains(targetObject, thisArg);
                }
                // concat would be handled by the exception above, however it's
                // patched by reflect.js and thus doesn't match [native code]
                if (thisArg && thisArg.isProxy() && Array.isArray(thisArg) &&
                    method.name === 'concat') {
                    targetObject = lively.objectFor(thisArg);
                }
                
                result = method.apply(targetObject, args);
                
                return this.ensureProxied(result);
            },
            construct: function(dummyTarget, args) {
                var OriginalConstructor = this.targetObject(),
                    proto = OriginalConstructor.prototype,
                    newInstance;
                
                if (OriginalConstructor.name === 'XMLHttpRequest') {
                    newInstance = new OriginalConstructor();
                    newInstance.__protoID =
                        OriginalConstructor.prototype.__objectID;
                    return this.ensureProxied(newInstance);
                }
                
                newInstance = lively.createObject(proto);
                newInstance.constructor = OriginalConstructor;
                OriginalConstructor.apply(newInstance, args);
                
                // newInstance is proxied as lively.createObject returns a proxy
                return newInstance;
            },
            getPrototypeOf: function(dummyTarget) {
                var protoID = this.targetObject().__protoID;
                
                if (protoID) {
                    return lively.ProxyTable[protoID];
                } else {
                    return Object.getPrototypeOf(this.targetObject());
                }
            },
            has: function(dummyTarget, name) {
                var targetObject = this.targetObject();
                if (({}).hasOwnProperty.call(targetObject, name)) {
                    return true;
                } else {
                    if (targetObject.__protoID === null) {
                        var proto = targetObject.__proto__;
                    } else {
                        var proto = lively.ProxyTable[targetObject.__protoID];
                    }
                    return proto ? name in proto : false;
                }
            },
            hasOwn: function(dummyTarget, name) {
                return ({}).hasOwnProperty.call(this.targetObject(), name);
            },
            getOwnPropertyNames: function(dummyTarget) {
                return Object.getOwnPropertyNames(this.targetObject()).
                    reject(function(ea) {return ea === '__objectID'});
            },
            enumerate: function(dummyTarget) {
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
            keys: function(dummyTarget) {
                return Object.keys(this.targetObject());
            },
            freeze: function(dummyTarget) {
                // // also freeze the virtual target (required by the spec)
                // Object.freeze(dummyTarget);
                
                return Object.freeze(this.targetObject());
            },
            isFrozen: function(dummyTarget) {
                return Object.isFrozen(this.targetObject());
            },
            seal: function(dummyTarget) {
                // // also seal the virtual target (required by the spec)
                // Object.seal(dummyTarget);
                
                return Object.seal(this.targetObject());
            },
            isSealed: function(dummyTarget) {
                return Object.isSealed(this.targetObject());
            },
            preventExtensions: function(dummyTarget) {
                // // spec consistency requirement
                // Object.preventExtensions(dummyTarget);
                
                return Object.preventExtensions(this.targetObject());
            },
            isExtensible: function(dummyTarget) {
                return Object.isExtensible(this.targetObject());
            },
            defineProperty: function(dummyTarget, name, desc) {
                // // spec consistency requirement
                // Object.defineProperty.apply(null, arguments);
                
                Object.defineProperty(this.targetObject(), name, desc);
                
                return true;
            },
            deleteProperty: function(dummyTarget, name) {
                delete this.targetObject()[name];
            }
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
        if (!lively.createObject) {
            this.wrapObjectCreate();
        }
    },
    wrapObjectCreate: function() {
        var create = Object.create;
        
        var wrappedCreate = function(proto, propertiesObject) {
            // when proxies are used as prototypes of objects, the prototypes
            // of these objects can't be changed. seems related to:
            // http://github.com/tvcutsem/harmony-reflect/issues/18
            var instance,
                prototype = proto;
            
            if (proto && proto.isProxy()) {
                prototype = lively.objectFor(proto);
                instance = create.call(null, prototype, propertiesObject);
                instance.__protoID = proto.__objectID;
            } else {
                instance = create.call(null, prototype, propertiesObject);
            }
            return instance;
        }
        
        lively.originalObjectCreate = create;
        
        Object.create = wrappedCreate;
        
        // for running tests without source transformations
        lively.createObject = function() {
            return lively.proxyFor(wrappedCreate.apply(null, arguments));
        };
        
    },
    proxyFor: function(target) {        
        // proxies are fully virtual objects: they don't point to their target, 
        // but refer to their target only via their __objectID-property,
        // through lively.CurrentObjectTable
        var proto, protoID, objectID, handler, proxy;
        
        if (lively.isPrimitiveObject(target)) {
            throw new TypeError('Primitive objects shouldn\'t be wrapped');
        }
        
        if (this.isRootPrototype(target)) {
            // don't touch root prototypes (i.e. add __objectID)
            throw new Error('root prototypes should not be inserted!!');
        }
        
        if (target.isProxy()) {
            throw new TypeError('Proxies shouldn\'t be inserted into the ' +                    'object tables');
        }
        
        if (this.objectHasBeenProxiedBefore(target)) {
            return this.getProxyByID(target.__objectID);
        }
        
        // functions might get used as constructors and then the prototype
        // property gets used as prototype for the new objects (__proto__).
        // therefore, the prototype of a function is used, might get
        // manipulated, and needs to be looked up via ID just like other
        // properties will be as well. however, this does assume that functions
        // that get proxied once are _never_ used as constructors after
        // unwrapping them.
        if (Object.isFunction(target) && target.prototype &&
            !target.prototype.isProxy() &&
            !this.isRootPrototype(target.prototype)) {
            
            target.prototype = lively.proxyFor(target.prototype);
        }
        
        if (target.__protoID === undefined) {
            proto = Object.getPrototypeOf(target);
            if (proto && !(this.isRootPrototype(proto))) {
                
                if (proto.isProxy()) {
                    // when proxies are used as prototypes, the prototype can't
                    // be changed later on. see >>wrapObjectCreate, which
                    // prohibits proxies from becoming prototypes
                    // otherwise we could do: protoID = proto.__objectID;
                    
                    throw new Error('Proxies shouldn\'t be the prototypes of' +
                        'objects');
                }
                
                protoID = this.proxyFor(proto).__objectID;
            } else {
                protoID = null;
            }
            
            // set __protoID as not enumerable and not configurable
            Object.defineProperty(target, '__protoID', {
                value: protoID,
                writable: true,
                // enumerable: true
            });
        }
        
        objectID = lively.CurrentObjectTable.length;
        
        // set __objectID as not enumerable, not configurable, and not writable
        // for both the target and the dummyTarget (spec consistency check)
        lively.CurrentObjectTable.push(target);
        
        Object.defineProperty(target, '__objectID', {
            value: objectID
        });
        
        handler = this.versioningProxyHandler(target.__objectID);
        proxy = Proxy(this.dummyTargetFor(target), handler, true);
        
        lively.ProxyTable[objectID] = proxy;
        
        return proxy;
    },
    dummyTargetFor: function(actualTarget) {
        var targetExpression,
            dummyTarget;
        
        // only proxies for functions trigger a trap on function application
        if (Object.isFunction(actualTarget)) {
            // function names are non-configurable and non-writable properties,
            // which the proxy spec requires to be returned consistently from
            // traps. that is, matching the actual proxy target
            
            targetExpression = 'dummyTarget = function ' + actualTarget.name
                    + '() {}';
            dummyTarget = this.originalEval ?
                this.originalEval(targetExpression) : eval(targetExpression);
            
        } else if (Object.isArray(actualTarget)) {
            dummyTarget = []
        } else {
            dummyTarget = {};
        }
        
        return dummyTarget;
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
    isPrimitiveObject: function(obj) {
        return obj !== Object(obj);
    },
    isRootPrototype: function(obj) {
        var roots = [Object.prototype, Function.prototype, Array.prototype];
        return roots.include(obj)
    },
    objectHasBeenProxiedBefore: function(obj) {
        return ({}).hasOwnProperty.apply(obj, ['__objectID']);
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
        });
        
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
        
        this.patchNativeFunctions();
        
        this.patchBaseCode();
    },
    patchNativeFunctions: function() {
        
        // 'aString'.match(regExp): regExp can't be a proxy
        var originalStringMatch = String.prototype.match;
        String.prototype.match = function(regexp) {
            var exp = regexp && regexp.isProxy() ?
                lively.objectFor(regexp) : regexp;
            return originalStringMatch.call(this, exp);
        }
        
    },
    wrapNativeObjects: function() {
        // built-in functions that create new objects
        // have to return proxies for the new objects. examples:
        
        // TODO:
        // Date, Global, window
        
        // handled in source transformations: Object, JSON, XMLHttpRequest
    },
    patchBaseCode: function() {
        // patches for bootstrap.js:
        Object.extend(JSLoader, {
            runCode: function(code, url) {
                if (lively.transformSource) {
                    Global.eval(lively.transformSource(code), url);
                } else {
                    Global.eval(code, url);
                }
            }
        });
        
        // patches for Base.js:
        Object.extend(Function.prototype, {
            protoClassConstructor : function() {
                return lively.proxyFor(function() { });
            }
        });
        
        Object.extend(lively.Class, {
            newInitializer: function(name) {
                return eval(lively.transformSource(lively.Class.initializerTemplate.replace(/CLASS/g, name) + ";" + name));
            },
        });
    }
});

Object.extend(lively.versions.ObjectVersioning, {
    transformSource: function(source) {
        return lively.versions.SourceTransformations.transformSource(source, {beautify: true});
    }
});

var livelyOV = lively.versions.ObjectVersioning;

// shortcuts
lively.proxyFor = livelyOV.proxyFor.bind(livelyOV);
lively.objectFor = livelyOV.getObjectForProxy.bind(livelyOV);
lively.commitVersion = livelyOV.commitVersion.bind(livelyOV);
lively.undo = livelyOV.undo.bind(livelyOV);
lively.redo = livelyOV.redo.bind(livelyOV);
lively.isPrimitiveObject = livelyOV.isPrimitiveObject.bind(livelyOV);
lively.transformSource = livelyOV.transformSource.bind(livelyOV);

// start
lively.versions.ObjectVersioning.init();
});
