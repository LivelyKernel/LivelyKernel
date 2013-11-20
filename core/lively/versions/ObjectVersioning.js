module('lively.versions.ObjectVersioning').requires('lively.versions.SourceTransformations').toRun(function() {
    
Object.defineProperty(Object.prototype, 'isProxy', {
    value: function() {
        return false;
    },
    writable: true
});
// for convenience: to have autocompletion in dev tools
Object.defineProperty(Object.prototype, 'proxyTarget', {
    value: function() {
        return undefined;
    },
    writable: true
});

Object.isRegExp = function (object) {
    if (!lively.isPrimitiveObject(object) && object.isProxy()) {
        return object.proxyTarget().proxyTarget() instanceof RegExp;
    } else {
        return object instanceof RegExp;
    }
}

Object.extend(Object, {
    instanceOf: function(obj, type) {
        var realObj, realPrototype, FakeConstructor;
        
        if (!obj.isProxy() && (!type.prototype || !type.prototype.isProxy())) {
            return obj instanceof type;
        }
        
        realObj = obj.isProxy() ? obj.proxyTarget() : obj;
        realPrototype = type.prototype.isProxy() ?
            type.prototype.proxyTarget() : type.prototype;
        
        FakeConstructor = function() {};
        FakeConstructor.prototype = realPrototype;
        
        return realObj instanceof FakeConstructor;
    }
});

// native and host objects (Constructors) that create new
// objects, which should be proxied
lively.GlobalObjectsToWrap = [
    // native objects:
    // http://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
    
    // Global Objects - General-purpose constructors
    'Array',
    'Boolean',
    'Date',
    'Function',
    'Iterator',
    'Number',
    'Object',
    'RegExp',
    'String',
    'ParallelArray',
    
    // Global Objects - Typed array constructors
    'ArrayBuffer',
    'DataView',
    'Float32Array',
    'Float64Array',
    'Int16Array',
    'Int32Array',
    'Int8Array',
    'Uint16Array',
    'Uint32Array',
    'Uint8Array',
    'Uint8ClampedArray',
    
    // Global Objects - Others
    'JSON',
    'Math',
    'Intl',
    
    // NOTE: 
    // - errors unproxied for now
    // - eval handled elsewhere and other Non-constructor functions seem not
    // to create objects
    
    // the Global object itself
    'Global',
    'window',
    
    // TODO: also check host objects:
    // http://developer.mozilla.org/en-US/docs/Web/API
    'document',
    'XMLHttpRequest',
    'Worker'
    
];

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
            proxyTarget: function() { return this.targetObject() },
            
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
            checkProtoChains: function(proxy, proxyTarget) {
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
            unwrapArrayDeeply: function(array) {
                var newArray = [];
                
                array.forEach((function(each, idx) {
                    newArray[idx] = this.unwrapDeeply(each);
                }).bind(this));
                
                return newArray;
            },
            unwrapObjectDeeply: function(obj) {
                var newObject = {};
                
                // including vs. excluding inherited props?
                for (var name in obj) {
                    newObject[name] = this.unwrapDeeply(obj[name]);
                }
                
                return newObject;
            },
            unwrapDeeply: function(obj) {
                
                if (lively.isPrimitiveObject(obj)) {
                    return obj;
                }
                if (Object.isArray(obj)) {
                    return this.unwrapArrayDeeply(obj);
                }
                if (Object.isObject(obj)) {
                    return this.unwrapObjectDeeply(obj);
                }
                
                if (Object.isFunction(obj)) {
                    // TODO: what about functions?
                    debugger;
                    throw new Error('not yet implemented...')
                }
                
                // TODO: what kind of objects did we miss? :D
                throw new Error('not yet implemented...')
                
            },
            wasObjectPreviouslyCommited: function(obj, propertyName) {
                // subsequentely cloning the object might result in setting the
                // properties 'sourceModule' and 'displayName' on obj, leading
                // consequentely to an infinite recursion
                
                return obj.__versionID !== lively.CurrentObjectTable.ID &&
                    propertyName !== 'displayName' &&
                    propertyName !== 'sourceModule';
            },
            copyObjectForCurrentVersion: function(targetObject) {
                var newObject = Object.clone(targetObject);
                
                // copy non-enumerable versioning properties explicitly
                newObject.__protoID = targetObject.__protoID;
                newObject.__objectID = targetObject.__objectID;
                newObject.__versionID = lively.CurrentObjectTable.ID;
                
                lively.CurrentObjectTable[this.__objectID] = newObject;
                
                return newObject;
            },
            
            // === proxy handler traps ===
            set: function(dummyTarget, name, value, receiver) {
                var targetObject, newObject, setter;
                
                targetObject = this.targetObject();
                
                // copy-on-write: create and work on a new version of the target
                // when target was commited with a previous version
                if (this.wasObjectPreviouslyCommited(targetObject)) {
                    targetObject =
                        this.copyObjectForCurrentVersion(targetObject);
                }
                
                // special cases
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
                    value = lively.objectFor(value);
                }
                
                descriptor =
                    Object.getOwnPropertyDescriptor(targetObject, name);
                setter = (descriptor && descriptor.set) ||
                    Object.prototype.__lookupSetter__.call(targetObject, name);
                if (setter) {
                    // setting the slot triggers an accessor function, in which
                    // case the target should be proxied
                    
                    setter.call(receiver, value);
                    
                    return true;
                }
                
                // default handling
                targetObject[name] = value;
                
                return true;
            },
            get: function(dummyTarget, name, receiver) {
                var result, nextAncestor, proto, targetObject,
                    descriptor, getter, OV = lively.versions.ObjectVersioning;
                
                // proxy meta-information
                if (name === '__objectID') {
                    return this.__objectID;
                }
                if (name === 'isProxy') {
                    return this.isProxy;
                }
                if (name === 'proxyTarget') {
                    return this.proxyTarget.bind(this);
                }
                
                targetObject = this.targetObject();
                
                // special cases
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
                
                descriptor =
                    Object.getOwnPropertyDescriptor(targetObject, name);
                getter = (descriptor && descriptor.get) ||
                    Object.prototype.__lookupGetter__.call(targetObject, name);
                if (getter) {
                    // getting the slot triggers an accessor function, in which
                    // case the target should be proxied
                    
                    return getter.call(receiver);;
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
                
                return this.ensureProxied(result);
            },
            apply: function(dummyTarget, thisArg, args) {
                var result,
                    func = this.targetObject(),
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
                if (func.toString().include('{ [native code] }') &&
                    !(func === Function.prototype.apply ||
                      func === Function.prototype.call) &&
                      !(func === Array.prototype.indexOf)) {
                    
                    if (thisArg && thisArg.isProxy()) {
                        targetObject = lively.objectFor(thisArg);
                    }

                    if (func.name === 'postMessage' &&
                        targetObject instanceof Worker) {
                        // WebWorker get some option objects which can't have
                        // proxied properties. otherwise:
                        // DOM Exception 25, DATA_CLONE_ERR
                        
                        args = this.unwrapDeeply(args);
                        
                    } else {
                        args = args.map(function(each) {
                            return (each && each.isProxy()) ?
                                 lively.objectFor(each) : each;
                        })
                    }
                    
                    // TODO: do we also need to check-up the prototype chains of the arguments?
                    if (thisArg) {
                        this.checkProtoChains(thisArg, thisArg.proxyTarget());
                    }
                }
                // concat would be handled by the exception above, however it's
                // patched by reflect.js and thus doesn't match [native code]
                if (thisArg && thisArg.isProxy() && Array.isArray(thisArg) &&
                    func.name === 'concat') {
                    targetObject = lively.objectFor(thisArg);
                }
                
                result = func.apply(targetObject, args);
                
                return this.ensureProxied(result);
            },
            construct: function(dummyTarget, args) {
                var OriginalConstructor = this.targetObject(),
                    name = OriginalConstructor.name,
                    proto = OriginalConstructor.prototype,
                    newInstance;
                
                if (lively.GlobalObjectsToWrap.include(name)) {
                    // new-operator seems necessary for constructing new
                    // instances of built-in constructors. and using them
                    // shouldn't be problematic as the prototype chains of
                    // built-in objects isn't expected to change
                    
                    newInstance = eval('new OriginalConstructor(' +
                        args.map(function(ea, idx) {
                            return 'args[' + idx + ']'
                        }).reduce(function (prev, current){
                            return prev ? prev + ', ' + current : current
                        }, '') + ')');
                    
                    newInstance.__protoID = null;
                    
                    return this.ensureProxied(newInstance);
                }
                
                // we don't use a new-operator on the OriginalConstructor as
                // the prototype of a function is proxied and would, thus,
                // result in an object that has a proxy as actual prototype,
                // which it shouldn't (prototype-traps + no __proto__
                // assignments)
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
                var targetObject = this.targetObject();
                return delete targetObject[name];
            }
        };
    }
});

Object.extend(lively.versions.ObjectVersioning, {
    init: function() {
        if (!lively.CurrentObjectTable) {
            lively.CurrentObjectTable = [];
            lively.CurrentObjectTable.ID = 0;
        }
        if (!lively.ProxyTable) {
            lively.ProxyTable = [];
        }
        if (!lively.createObject) {
            this.wrapObjectCreate();
        }
        
        this.patchBuiltInFunctions();
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
                
                if (!proto) {
                    instance.isProxy = Object.prototype.isProxy;
                }
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
        var proto, protoID, objectID, versionID, handler, proxy;
        
        if (lively.isPrimitiveObject(target)) {
            throw new TypeError('Primitive objects shouldn\'t be proxied');
        }
        
        if (this.isRootPrototype(target)) {
            // don't touch root prototypes (i.e. add __objectID)
            throw new Error('Root prototypes shouldn\'t be proxied');
        }
        
        if (target.isProxy()) {
            return target;
        }
        
        if (this.hasObjectBeenProxiedBefore(target)) {
            return this.getProxyByID(target.__objectID);
        }
        
        // functions might get used as constructors and then the prototype
        // property gets used as prototype for the new objects (__proto__).
        // therefore, the prototype of a function is used, might get
        // manipulated, and needs to be looked up via ID just like other
        // properties will be as well. however, this does assume that functions
        // that get proxied once are _never_ used as constructors after
        // unwrapping them.
        if (Object.isFunction(target) && this.hasUnproxiedPrototype(target)) {
            
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
            });
        }
        
        objectID = lively.CurrentObjectTable.length;
        versionID = lively.CurrentObjectTable.ID;
        
        // set __objectID and __versionID as not enumerable, not configurable, and not writable properties
        Object.defineProperty(target, '__objectID', {
            value: objectID
        });
        Object.defineProperty(target, '__versionID', {
            value: versionID
        });
        
        lively.CurrentObjectTable.push(target);
        
        handler = this.versioningProxyHandler(objectID);
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
    hasObjectBeenProxiedBefore: function(obj) {
        return ({}).hasOwnProperty.apply(obj, ['__objectID']);
    },
    hasUnproxiedPrototype: function(obj) {
        return obj.prototype &&
            !obj.prototype.isProxy() &&
            !lively.GlobalObjectsToWrap.include(obj.name) &&
            !this.isRootPrototype(obj.prototype)
    },
    commitVersion: function() {
        var previousVersion;
        
        previousVersion = lively.CurrentObjectTable;
        lively.CurrentObjectTable = Object.clone(lively.CurrentObjectTable);
        lively.CurrentObjectTable.ID = previousVersion.ID + 1;
        lively.CurrentObjectTable.previousVersion = previousVersion;
        previousVersion.nextVersion = lively.CurrentObjectTable;
        
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
        
        // Module System + Class System (Base.js)
        this.patchBaseCode();
        
        // Worker.js is loaded before OV code,
        // but neither lang stuff nor Base stuff nor OV stuff depends on it...
        Worker = lively.proxyFor(Worker);
        
    },
    patchBuiltInFunctions: function() {
        
        // 'aString'.match(regExp): regExp can't be a proxy
        var originalStringMatch = String.prototype.match;
        String.prototype.match = function match(regexp) {
            var exp = regexp && regexp.isProxy() ?
                regexp.proxyTarget() : regexp;
            return originalStringMatch.call(this, exp);
        };
        
        // 'aString'.search(regExp): regExp can't be a proxy
        var originalStringSearch = String.prototype.match;
        String.prototype.search = function search(regexp) {
            var regularExp = regexp && regexp.isProxy() ?
                regexp.proxyTarget() : regexp;
            return originalStringSearch.call(this, regularExp);
        };
        
        // 'aString'.replace(first, ..): first can't be a proxy
        var originalStringReplace = String.prototype.replace;
        String.prototype.replace = function replace(first, second, third) {
            var goodFirst = (first && first.isProxy()) ?
                first.proxyTarget() : first;
            return originalStringReplace.call(this, goodFirst, second, third);
        };
        
        // 'aString'.split(separator, ..): separator can't be a proxy
        var originalStringSplit = String.prototype.split;
        String.prototype.split = function replace(first, second) {
            var goodFirst = (first && first.isProxy()) ?
                first.proxyTarget() : first;
            return originalStringSplit.call(this, goodFirst, second);
        };
        
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
