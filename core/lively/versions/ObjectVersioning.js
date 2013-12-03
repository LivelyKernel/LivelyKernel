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

Object.extend(Object, {
    isProxy: function(obj) { return !!obj && !!obj.isProxy && obj.isProxy() },
    isRegExp: function (obj) {
        if (Object(obj).isProxy()) {
            return obj.proxyTarget() instanceof RegExp;
        } else {
            return obj instanceof RegExp;
        }
    },
    
    // there's no trap for the instanceOf operator. instead it always
    // works directly on the proxy's original target (dummyTarget for our
    // fully virtual object-proxies, but the proto-chain can also change).
    
    // further, a function's prototype property is proxied, whereas the
    // __proto__-chain of an object doesn't contain any proxies.. that is,
    // we also couldn't use the instanceof operator on a target that has been
    // resolved at runtime
    instanceOf: function(obj, type) {
        var realObj, 
            realType = type;
        
        realObj = Object.isProxy(obj) ? obj.proxyTarget() : obj;
        
        if (Object.isProxy(type.prototype)) {
            realType = function() {};
            realType.prototype = type.prototype.proxyTarget();
        }
        
        return realObj instanceof realType;
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
    'Worker',
    'XMLSerializer'
];

lively.ArrayIterators = [Array.prototype.forEach, Array.prototype.every, Array.prototype.some, Array.prototype.filter, Array.prototype.map, Array.prototype.reduce, Array.prototype.reduceRight];

Object.extend(lively.versions.ObjectVersioning, {
    versioningProxyHandler: function(target) {
        return {
            // the versioning proxies are virtual. so, the first parameter to
            // all traps, the actual proxy target, is an empty
            // object/function/array, only there to get typeof checks right,
            // and shouldn't be touched. to reflect this, we use dummyTarget as
            // parameter name
            
            __targetVersions: (function() {
                var versions = {};
                
                versions[lively.CurrentVersion.ID] = target;
                
                return versions;
            })(),
            
            // === helpers ===
            isProxy: function() { return true },
            proxyTarget: function() { return this.targetObject() },
            
            targetObject: function() {
                var version = lively.CurrentVersion,
                    targetObject;
                
                while(!targetObject && version) {
                    targetObject = this.__targetVersions[version.ID];
                    version = version.previousVersion;
                }
                
                return targetObject;
            },
            ensureProxied: function(obj) {
                var livelyOV = lively.versions.ObjectVersioning;
                
                if (!livelyOV.isPrimitiveObject(obj) &&
                    !Object.isProxy(obj) &&
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
                             proxyAncestor.proxyTarget()) {
                        
                        // TODO: fix the proxyTarget's prototype chain in this
                        // case...
                        throw new Error('proxy-proto-chain inconsistent to ' +
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
            copyObjectForCurrentVersion: function(targetObject) {
                var newObject = Object.clone(targetObject);
                
                // copy non-enumerable properties explicitly
                Object.defineProperty(newObject, '__protoProxy', {
                    value: targetObject.__protoProxy,
                    writable: true,
                });
                
                this.__targetVersions[lively.CurrentVersion.ID] = newObject;
                
                return newObject;
            },
            shouldObjectBeCopiedFirst: function(propertyName) {
                return !this.__targetVersions[lively.CurrentVersion.ID] &&
                    propertyName !== 'displayName' &&
                    propertyName !== 'sourceModule';
            },
            
            // === proxy handler traps ===
            set: function(dummyTarget, name, value, receiver) {
                var targetObject, newObject, setter;
                
                targetObject = this.targetObject();
                
                // copy-on-write: create and work on a new version of the target
                // when target was commited with a previous version
                if (this.shouldObjectBeCopiedFirst(name)) {
                    targetObject =
                        this.copyObjectForCurrentVersion(targetObject);
                }
                
                // special cases
                if (name === '__proto__') {
                    if (Object.isProxy(value)) {
                        
                        Object.defineProperty(targetObject, '__protoProxy', {
                            value: value,
                            writable: true
                        });
                        targetObject.__proto__ = value.proxyTarget();
                    } else {
                        Object.defineProperty(targetObject, '__protoProxy', {
                            value: null,
                            writable: true
                        });
                        targetObject.__proto__ = value;
                    }
                    return true;
                }
                if (name === 'onreadystatechange' && Object.isProxy(value) &&
                    targetObject.constructor.name === 'XMLHttpRequest') {
                    value = value.proxyTarget();
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
                if (name === 'isProxy') {
                    return this.isProxy;
                }
                if (name === 'proxyTarget') {
                    return this.proxyTarget.bind(this);
                }
                
                targetObject = this.targetObject();
                
                // special cases
                if (name === '__proto__') {
                    if (targetObject.__protoProxy) {
                        return targetObject.__protoProxy;
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
                    
                    return getter.call(receiver);
                }
                
                // default handling
                if (({}).hasOwnProperty.call(targetObject, name)) {
                    result = targetObject[name];
                } else {
                    if (targetObject.__protoProxy === null) {
                        var proto = targetObject.__proto__;
                    } else {
                        var proto = targetObject.__protoProxy;
                    }
                    result = proto ? proto[name] : undefined;
                }
                
                return this.ensureProxied(result);
            },
            apply: function(dummyTarget, suppliedThisArg, suppliedArgs) {
                var result,
                    thisArg = suppliedThisArg,
                    targetObject = suppliedThisArg,
                    args = suppliedArgs,
                    func = this.targetObject();
                
                // when aFunc is Function.prototype.apply or .call, normalize
                // the arguments as we apply the function below, removing the
                // apply-meta level here to not have to repeat handling of
                // special cases ([native code] and stuff)
                if (func === Function.prototype.apply ||
                      func === Function.prototype.call) {
                    
                    (function normalizeArguments(originalFunc, originalArgs) {
                        func = thisArg.proxyTarget();
                    
                        thisArg = originalArgs[0];
                        targetObject = originalArgs[0];
                    
                        if (originalFunc === Function.prototype.apply) {
                            args = originalArgs[1];
                        } else {
                            args = originalArgs.slice(1);
                        }
                    
                        if (args && !Object.isArray(args)) {
                            args = Array.prototype.slice.call(args);
                        }
                    
                        if (func === Function.prototype.apply ||
                            func === Function.prototype.call) {
                            normalizeArguments(func, args);
                        }
                    })(func, args);
                }
                
                // some primitive code can't handle proxies,
                // therefore we unwrap the target and arguments.
                // note: [native code] also (at least) results from printing
                // functions that are not actually native/host functions, but
                // have been boiund (aFunc.bind()) to some thisArg..
                // note 2: anArray.concat and aDate.toString are patched by
                // reflect.js and thus doesn't match [native code].
                // exceptions:
                //  * don't unwrap arguments to anArray.indexOf, because
                //    lively.proxyFor(obj) !== obj
                //  * don't unwrap arguments to iteration methods, which
                //    even might include a this-context

                if ((func.toString().include('{ [native code] }') &&
                    func !== Array.prototype.indexOf &&
                    !lively.ArrayIterators.include(func)) ||
                    
                    (func === Array.prototype.concat ||
                    func === Function.prototype.toString ||
                    func === Date.prototype.toString)
                ) {
                    
                    if (thisArg && thisArg.isProxy()) {
                        targetObject = thisArg.proxyTarget();
                    }
                    
                    // UNWRAP THE ARGUMENTS: deeply or not?
                    // some functions expect objects with properties or
                    // arrays with some elements, which both can be proxied
                    // and wouldn't be unproxied when we just unwrap a single
                    // level (each argument)... however, we don't want to unwrap
                    // everything (because we neither want to modify objects
                    // permanently nor copy every object or array passed to
                    // [native code])
                    if (func === Worker.prototype.postMessage ||
                        func === JSON.stringify) {
                        // WebWorker get some option objects which can't have
                        // proxied properties. otherwise:
                        // DOM Exception 25, DATA_CLONE_ERR
                        
                        args = this.unwrapDeeply(args);
                        
                    } else {
                        args = args && args.map(function(each) {
                            return (each && each.isProxy()) ?
                                 each.proxyTarget() : each;
                        })
                    }
                    
                    // TODO: check-up the arguments, except for array iterators
                    if (thisArg && thisArg.isProxy()) {
                        this.checkProtoChains(thisArg, thisArg.proxyTarget());
                    }
                }
                
                try {
                    result = func.apply(targetObject, args);
                } catch (e) {
                    // FIXME: temporary to ease debugging - remove this later
                    
                    // don't debug the following error, as that error might
                    // occur when trying the first of two XPath query
                    // alternatives and is then caught immediately..
                    if (e.message !== 'An attempt was made to create or ' +
                        'change an object in a way which is incorrect with ' +
                        'regard to namespaces.') {
                        
                        debugger;
                        
                        // result = func.apply(targetObject, args);
                    }
                    
                    
                    throw e;
                }
                
                return this.ensureProxied(result);
            },
            construct: function(dummyTarget, args) {
                var OriginalConstructor = this.targetObject(),
                    name = OriginalConstructor.name,
                    proto = OriginalConstructor.prototype,
                    newInstance, constructorReturnValue;
                
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
                    
                    Object.defineProperty(newInstance, '__protoProxy', {
                        value: null,
                        writable: true
                    });
                    
                    return this.ensureProxied(newInstance);
                }
                
                // we don't use a new-operator on the OriginalConstructor as
                // the prototype of a function will be proxied and would, thus,
                // return an object with a proxy as actual prototype, which it
                // shouldn't have (prototype-traps + no __proto__ assignments)
                
                newInstance = lively.createObject(proto);
                newInstance.constructor = OriginalConstructor;
                constructorReturnValue =
                    OriginalConstructor.apply(newInstance, args);
                
                // note: newInstance is proxied as lively.createObject returns
                // a proxy, whereas we can't be sure for another return value,
                // which has to be returned instead when there is one
                
                return constructorReturnValue ?
                    lively.proxyFor(constructorReturnValue) : newInstance;
            },
            getPrototypeOf: function(dummyTarget) {
                var protoProxy = this.targetObject().__protoProxy;
                
                if (protoProxy) {
                    return protoProxy;
                } else {
                    return Object.getPrototypeOf(this.targetObject());
                }
            },
            has: function(dummyTarget, name) {
                var targetObject = this.targetObject();
                if (({}).hasOwnProperty.call(targetObject, name)) {
                    return true;
                } else {
                    if (targetObject.__protoProxy === null) {
                        var proto = targetObject.__proto__;
                    } else {
                        var proto = targetObject.__protoProxy;
                    }
                    return proto ? name in proto : false;
                }
            },
            hasOwn: function(dummyTarget, name) {
                return ({}).hasOwnProperty.call(this.targetObject(), name);
            },
            getOwnPropertyNames: function(dummyTarget) {
                return Object.getOwnPropertyNames(this.targetObject());
            },
            enumerate: function(dummyTarget) {
                var targetObject = this.targetObject(),
                    enumerableProps = [],
                    nextAncestor;
                
                for (var prop in targetObject) {
                    enumerableProps.push(prop);
                }
                
                nextAncestor = targetObject.__protoProxy ? targetObject.__protoProxy.proxyTarget() : null;
                while (nextAncestor) {
                    for (var prop in nextAncestor) {
                        if (!enumerableProps.include(prop))
                            enumerableProps.push(prop);
                    }
                    nextAncestor = nextAncestor.__protoProxy ? nextAncestor.__protoProxy.proxyTarget() : null;
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
        if (!lively.CurrentVersion) {
            lively.CurrentVersion = {
                ID: 0,
                previousVersion: null,
                nextVersion: null
            };
        }
        if (!lively.ProxyTable) {
            lively.ProxyTable = new WeakMap();
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
                prototype = proto.proxyTarget();
                instance = create.call(null, prototype, propertiesObject);
                
                Object.defineProperty(instance, '__protoProxy', {
                    value: proto,
                    writable: true
                });
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
        var proto, protoProxy, handler, proxy;
        
        if (lively.isPrimitiveObject(target)) {
            throw new TypeError('Primitive objects shouldn\'t be proxied');
        }
        
        if (this.isRootPrototype(target)) {
            // don't touch root prototypes
            throw new Error('Root prototypes shouldn\'t be proxied');
        }
        
        if (Object.isProxy(target)) {
            return target;
        }
        
        if (lively.ProxyTable.has(target)) {
            return lively.ProxyTable.get(target);
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
        
        if (target.__protoProxy === undefined) {
            proto = Object.getPrototypeOf(target);
            if (proto && !(this.isRootPrototype(proto))) {
                
                if (proto.isProxy()) {
                    // when proxies are used as prototypes, the prototype can't
                    // be changed later on. see >>wrapObjectCreate, which
                    // prohibits proxies from becoming prototypes
                    
                    throw new Error('Proxies shouldn\'t be the prototypes of' +
                        'objects');
                }
                
                protoProxy = this.proxyFor(proto);
                
            } else {
                protoProxy = null;
            }
            
            // set __protoProxy as not enumerable and not configurable
            Object.defineProperty(target, '__protoProxy', {
                value: protoProxy,
                writable: true
            });
        }
        
        handler = this.versioningProxyHandler(target);
        
        proxy = new Proxy(this.dummyTargetFor(target), handler, true);
        
        lively.ProxyTable.set(target, proxy);
        
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
            dummyTarget = [];
        } else {
            dummyTarget = {};
        }
        
        return dummyTarget;
    },
    isPrimitiveObject: function(obj) {
        return obj !== Object(obj);
    },
    isRootPrototype: function(obj) {
        var roots = [Object.prototype, Function.prototype, Array.prototype];
        return roots.include(obj)
    },
    hasUnproxiedPrototype: function(obj) {
        return obj.prototype && !Object.isProxy(obj.prototype) &&
            !lively.GlobalObjectsToWrap.include(obj.name) &&
            !this.isRootPrototype(obj.prototype)
    },
    commitVersion: function() {
        var previousVersion = lively.CurrentVersion,
            newVersion;
        
        newVersion = {
            ID: previousVersion.ID + 1,
            previousVersion: previousVersion,
            nextVersion: null
        };
        
        previousVersion.nextVersion = newVersion;
        
        lively.CurrentVersion = newVersion;
        
        return previousVersion; 
    },
    undo: function() {
        var previousVersion = this.previousVersion();
        if (!previousVersion) {
            throw new Error('Can\'t undo: No previous version.');
        }
        lively.CurrentVersion = previousVersion;
    },
    redo: function() {
        var followingVersion = this.followingVersion();
        if (!followingVersion) {
            throw new Error('Can\'t redo: No next version.');
        }
        lively.CurrentVersion = this.followingVersion();
    },
    previousVersion: function() {
        return lively.CurrentVersion.previousVersion;
    },
    followingVersion: function() {
       return lively.CurrentVersion.nextVersion;
    },
    start: function() {
        this.init();
        
        lively.versions.ObjectVersioning.isActive = true;
        
        // Module System + Class System (Base.js)
        this.patchBaseCode();
        
        this.proxyBuiltInObjectsGlobally();
    },
    proxyBuiltInObjectsGlobally: function() {
        
        // Note: we can only proxy global objects globally, when such Objects
        // are not used in code that is loaded before the Object Versioning
        // code and also not in the Object Versioning code itself
        
        Worker = lively.proxyFor(Worker);
        
    },
    patchBuiltInFunctions: function() {
        
        // 'aString'.match(regExp): regExp can't be a proxy
        var originalStringMatch = String.prototype.match;
        String.prototype.match = function match(regexp) {
            var exp = Object.isProxy(regexp) ?
                regexp.proxyTarget() : regexp;
            return originalStringMatch.call(this, exp);
        };
        
        // 'aString'.search(regExp): regExp can't be a proxy
        var originalStringSearch = String.prototype.match;
        String.prototype.search = function search(regexp) {
            var regularExp = Object.isProxy(regexp) ?
                regexp.proxyTarget() : regexp;
            return originalStringSearch.call(this, regularExp);
        };
        
        // 'aString'.replace(first, ..): first can't be a proxy
        var originalStringReplace = String.prototype.replace;
        String.prototype.replace = function replace(first, second, third) {
            var goodFirst = Object.isProxy(first) ?
                first.proxyTarget() : first;
            return originalStringReplace.call(this, goodFirst, second, third);
        };
        
        // 'aString'.split(separator, ..): separator can't be a proxy
        var originalStringSplit = String.prototype.split;
        String.prototype.split = function replace(first, second) {
            var goodFirst = Object.isProxy(first) ?
                first.proxyTarget() : first;
            return originalStringSplit.call(this, goodFirst, second);
        };
        
    },
    patchBaseCode: function() {
        // patches for bootstrap.js:
        Object.extend(JSLoader, {
            runCode: function(code, url) {
                var sources = code;
                
                if (lively.transformSource) {
                    try {
                        sources = lively.transformSource(code);
                    } catch (e) {
                        throw new Error('Versioning: Couldn\'t transform code '
                            + ' from ' + url + ', Error: ' + e);
                    }
                }
                
                Global.eval(sources, url);
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
lively.commitVersion = livelyOV.commitVersion.bind(livelyOV);
lively.undo = livelyOV.undo.bind(livelyOV);
lively.redo = livelyOV.redo.bind(livelyOV);
lively.isPrimitiveObject = livelyOV.isPrimitiveObject.bind(livelyOV);
lively.transformSource = livelyOV.transformSource.bind(livelyOV);

// start
lively.versions.ObjectVersioning.init();
});
