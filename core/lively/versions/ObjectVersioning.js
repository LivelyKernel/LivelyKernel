module('lively.versions.ObjectVersioning').requires('lively.versions.SourceTransformations').toRun(function() {
    
Object.extend(lively.versions.ObjectVersioning, {
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
                return lively.versions.ObjectVersioning.getObjectByID(id);
            },
            ensureProxied: function(obj) {
                var livelyOV = lively.versions.ObjectVersioning;
                
                if (!livelyOV.isProxy(obj) && !livelyOV.isPrimitiveObject(obj)) {
                    return lively.versions.ObjectVersioning.proxyFor(obj);
                } else {
                    return obj;
                }
            },
            lookupInObjAndProtoChainWhile: function (obj, lookup,
                         whileCondition) {
                var result = lookup(obj),
                    proto = this.getObjectByID(obj.__protoID) || obj.__proto__;
                
                if (whileCondition(result) && proto) {
                    result = this.lookupInObjAndProtoChainWhile(
                        proto,
                        lookup,
                        whileCondition
                    );
                }
                return result;
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
                        targetObject.__proto__ = lively.objectFor(value);
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
                var result, nextAncestor, proto,
                    targetObject = this.targetObject();;
                
                // proxy meta-information
                if (name === '__objectID') {
                    return this.__objectID;
                }
                if (name === '__isProxy') {
                    return true;
                }
               
                if (name === '__proto__') {
                    if (targetObject.__protoID) {
                        return lively.ProxyTable[targetObject.__protoID];
                    } else {
                        proto = targetObject.__proto__;
                        return lively.isPrimitiveObject(proto) ? proto :
                                lively.proxyFor(proto);
                    }
                }
                
                result = this.lookupInObjAndProtoChainWhile(
                    targetObject,
                    function(obj) {
                        if (({}).hasOwnProperty.call(obj, name)) {
                            return obj[name];
                        } else {
                            return undefined;
                        }
                    },
                    function(result) { return result === undefined }
                );
                
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
            apply: function(virtualTarget, thisArg, args) {
                var result,
                    method = this.targetObject(),
                    targetObject = thisArg;
                
                // workaround for legacy setters and getters
                if (method.name === '__defineSetter__' ||
                    method.name === '__defineGetter__' ||
                    method.name === '__lookupSetter__' ||
                    method.name === '__lookupGetter__') {
                    
                    result = method.apply(targetObject, [args[0],
                            lively.objectFor(args[1])]);
                    return this.ensureProxied(result);
                }
                
                // workaround to have functions print with their function bodies
                if (Object.isFunction(thisArg) && 
                        lively.isProxy(thisArg) &&
                        !thisArg.__protoID ) {
                    // can't test if thisArg.name === 'toString' because the
                    // function might be wrapped (in harmony-reflect shim)
                    targetObject = lively.objectFor(thisArg);
                }
                
                // TODO: unwrapping might be necessary at other boundaries as
                // well, not just for DOM nodes
                if (thisArg && lively.isProxy(thisArg) &&
                        method.toString().include(' { [native code] }')) {
                    
                    // DOM Nodes
                    if (lively.objectFor(thisArg).nodeName) {
                        targetObject = lively.objectFor(thisArg);
                        this.checkProtoChains(targetObject, thisArg);
                    }
                    
                    // RegExp
                    if (Object.isRegExp(lively.objectFor(thisArg))) {
                        targetObject = lively.objectFor(thisArg);
                        this.checkProtoChains(targetObject, thisArg);
                    }
                    
                    // array.concat
                    if (method.name === 'concat' &&
                        Object.isArray(lively.objectFor(thisArg))) {
                        
                        targetObject = lively.objectFor(thisArg);
                        args = args.map(function(each) {
                            return lively.isProxy(each) ?
                                 lively.objectFor(each) : each;
                        })
                        
                        this.checkProtoChains(targetObject, thisArg);
                    }
                    
                }
                
                result = method.apply(targetObject, args);
                
                return this.ensureProxied(result);
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
                return this.lookupInObjAndProtoChainWhile(
                    this.targetObject(),
                    function(obj) {
                        return ({}).hasOwnProperty.call(obj, name);
                    },
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
        var create = Object.create;
        
        var wrappedCreate = function(proto, propertiesObject) {
            // when proxies are used as prototypes of objects, the prototypes
            // of these objects can't be changed. seems related to:
            // http://github.com/tvcutsem/harmony-reflect/issues/18
            var instance,
                prototype = proto;
            
            if (lively.isProxy(proto)) {
                
                // FIXME: this comment relevant??
                // can't just un-proxy the proxied prototype and pass it to the
                // original Object.create, because the prototype itself might
                // have a prototype only available via __protoID (and that's
                // thus available when the prototype is proxied)
                
                prototype = lively.objectFor(proto);
                instance = create.call(null, prototype, propertiesObject);
                instance.__protoID = proto.__objectID;
                
                return instance;
            } else {
                return create.call(null, prototype, propertiesObject);
            }
        }
        lively.originalObjectCreate = create;
        lively.create = wrappedCreate;
        Object.create = lively.create;
    },
    proxyFor: function(target) {        
        // proxies are fully virtual objects: they don't point to their target, 
        // but refer to their target only via their __objectID-property,
        // through lively.CurrentObjectTable
        var proto, protoID, virtualTarget, objectID, proxy;
        
        // FIXME: is it really a problem to add them? also see below for when
        // root prototypes are prototypes... if it's necessary, then add all
        // root prototypes
        if (target === Function.prototype) {
            throw new Error('root prototypes should not be inserted!!');
        }
        
        if (this.isProxy(target)) 
            throw new TypeError('Proxies shouldn\'t be inserted into the ' +                    'object tables');
         
        if (lively.isPrimitiveObject(target)) {
            throw new TypeError('Primitive objects shouldn\'t be wrapped');
        }
        
        // TODO: hasBeenProxiedBefore() (+ move up to isProxy)
        if (({}).hasOwnProperty.apply(target, ['__objectID']))
            return this.getProxyByID(target.__objectID);
        
        // FIXME: add a Object.isFunction(target)
        if (target.prototype && !this.isProxy(target.prototype)) {
            // some function's have prototypes, which get used when calling
            // constructors and in the construct-trap. note that some built-in
            // functions don't have prototypes
            target.prototype = this.proxyFor(target.prototype);
        }
        
        virtualTarget = this.virtualTargetFor(target);
        
        if (target.__protoID === undefined) {
            proto = Object.getPrototypeOf(target);
            if (proto && !([Object.prototype, Function.prototype,
                    Array.prototype].include(proto))) {
                
                if (this.isProxy(proto)) {
                    // when proxies are used as prototypes, the prototype can't
                    // be changed later on. see >>wrapObjectCreate, which
                    // prohibits proxies from becoming prototypes
                    // otherwise we could do: protoID = proto.__objectID;
                    
                    throw new Error('Proxies shouldn\'t be the prototypes of' +
                        'objects');
                }
                
                protoID = this.proxyFor(proto).__objectID;
            } else {
                // FIXME: is this necessary? or can root prototypes just be
                // added to the Object tables as well

                protoID = null;
            }
            
            // set __protoID as not enumerable and not configurable
            Object.defineProperty(target, '__protoID', {
                writable: true,
                value: protoID
            });
        }
        
        objectID = lively.CurrentObjectTable.length;
        
        // set __objectID as not enumerable, not configurable, and not writable
        // for both the target and the virtualTarget (spec consistency check)
        lively.CurrentObjectTable.push(target);
        Object.defineProperty(target, '__objectID', {
            value: objectID
        });
        Object.defineProperty(virtualTarget, '__objectID', {
            value: objectID
        });
        
        proxy = Proxy(virtualTarget,
                this.versioningProxyHandler(target.__objectID));
        lively.ProxyTable[objectID] = proxy;
        
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
            
        } else if (Object.isArray(actualTarget)) {
            virtualTarget = []
        } else {
            virtualTarget = {};
        }
        
        return virtualTarget;
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
        this.wrapEval();
        this.wrapNativeFunctions();
        this.wrapGlobalObjects();
        
        Object.extend(Function.prototype, {
            newClassConstructor : function() {
                return lively.proxyFor(function() { });
            }
        })
        
    },
    wrapEval: function() {
        var originalEval = eval;
        eval = function(code) {
            var transformedCode = lively.versions.ObjectVersioning.transformSource(code);
            return originalEval(transformedCode);
        }
        this.originalEval = originalEval;
    },
    wrapNativeFunctions: function() {
        var originalStringMatch = String.prototype.match;
        String.prototype.match = function(regexp) {
            var exp = lively.isProxy(regexp) ?
                lively.objectFor(regexp) : regexp;
            return originalStringMatch.call(this, exp);
        }
    },
    wrapGlobalObjects: function() {
        // TODO: built-in functions that create new objects
        // have to return proxies for the new objects. examples:
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
        return lively.versions.SourceTransformations.transformSource(source, {beautify: true});
    }
});

var livelyOV = lively.versions.ObjectVersioning;

// shortcuts
lively.proxyFor = livelyOV.proxyFor.bind(livelyOV);
lively.objectFor = livelyOV.getObjectForProxy.bind(livelyOV);
lively.isProxy = livelyOV.isProxy.bind(livelyOV);
lively.isPrimitiveObject = livelyOV.isPrimitiveObject.bind(livelyOV);

// start
lively.versions.ObjectVersioning.init();
});
