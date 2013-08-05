module('lively.versions.ObjectVersioning').requires('lively.ast.Parser').toRun(function() {

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
        
        // only functions trap function application
        virtualTarget = Object.isFunction(target) ? function() {} : {};
        
        proxy = Proxy(virtualTarget, this.versioningProxyHandler());
        id = lively.CurrentObjectTable.length - 1;
                
        proxy.__objectID = id;
        return proxy;
    },
    isProxy: function(obj) {
        if (!obj) {
            return false;
        }
        
        return ({}).hasOwnProperty.call(obj, '__objectID');
    },
    getObjectForProxy: function(proxy, optObjectTable) {
        var objectTable = optObjectTable || lively.CurrentObjectTable;
        
        return objectTable[proxy.__objectID];
    },
    setObjectForProxy: function(target, proxy, optObjectTable) {
        var objectTable = optObjectTable || lively.CurrentObjectTable;
        objectTable[proxy.__objectID] = target;
    },
    versioningProxyHandler: function() {
        return {
            // these proxies are fully virtual, so the first parameter to all 
            // traps is an empty object and shouldn't be touched
            
            // === meta info ===
            __objectID: null, // points via global object table to the target object
            
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
            
            // === traps ===
            set: function(virtualTarget, name, value, receiver) {
                var targetObject,
                    newObject;
                
                // proxy meta-information
                if (name === '__objectID') {
                    this[name] = value;
                    return true;
                }
                                
                targetObject = lively.versions.ObjectVersioning.getObjectForProxy(receiver);
                
                // copy-on-first-write when object is commited in previous version
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
                var OriginalContructor = this.targetObject(),
                    newInstance;
                    
                // workaround as it's not possible to supply a variable
                // number of arguments to a constructor, an alternative
                // to this approach is constructing the constructor call
                // in a string and to pass that call to eval()
                function ConstructorWrapper() {
                    return OriginalContructor.apply(this, args);
                }
                ConstructorWrapper.prototype = OriginalContructor.prototype;
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
                // must freeze (virtual) target as well (required by the proxy specification)
                Object.freeze(virtualTarget);
                
                return Object.freeze(this.targetObject());
            },
            isFrozen: function(virtualTarget) {
                return Object.isFrozen(this.targetObject());
            },
            seal: function(virtualTarget) {
                // must seal (virtual) target as well (required by the proxy specification)
                Object.seal(virtualTarget);
                
                return Object.seal(this.targetObject());
            },
            isSealed: function(virtualTarget) {
                return Object.isSealed(this.targetObject());
            },
            preventExtensions: function(virtualTarget) {
                // must prevent extensions to the  (virtual) target as well 
                // (required by the proxy specification)
                Object.preventExtensions(virtualTarget);
                
                return Object.preventExtensions(this.targetObject());
            },
            isExtensible: function(virtualTarget) {
                return Object.isExtensible(this.targetObject());
            },
            getPrototypeOf: function(virtualTarget) {
                return Object.getPrototypeOf(this.targetObject());
            }
        };
    },
    commitVersion: function() {
        var previousVersion,
            nextVersion;
        
        previousVersion = lively.CurrentObjectTable;
        nextVersion = Object.clone(lively.CurrentObjectTable);
        lively.Versions.push(nextVersion);
        
        // freeze all objects as previous versions shouldn't change,
        // so objects need to be copied on (first) write
        // however: using Object.freeze() for this has the drawback that frozen objects
        // can be written again in the next version...
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
    isPrimitiveObject: function(obj) {
        return obj !== Object(obj);
    },
    transformSource: function(source) {
        var ast = lively.ast.Parser.parse(source);
                
        ast.replaceNodesMatching(
            function(node) {
                return node.isObjectLiteral || node.isArrayLiteral || node.isFunction;
            },
            function(node) {
                var fn = new lively.ast.Variable(node.pos, "lively.versions.ObjectVersioning.proxy");
                return new lively.ast.Call(node.pos, fn, [node]);
            }
        );
        
        return ast.asJS();
    },
    wrapEval: function() {
        var originalEval = eval;
        eval = function(code) {
            var transformedCode = lively.versions.ObjectVersioning.transformSource(code);
            return originalEval(transformedCode);
        }
    },
    wrapGlobalObjects: function() {
        Properties.all(Global).forEach((function(ea) {
            if (this.isProxy(Global[ea]) || this.isPrimitiveObject(Global[ea])) return;
            
            Global[ea] = this.proxy(Global[ea]);
        }).bind(this));
    },
    start: function() {
        this.init();
        this.wrapEval();
        this.wrapGlobalObjects();
    }
});
lively.versions.ObjectVersioning.init();

});