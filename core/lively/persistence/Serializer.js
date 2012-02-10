/*
 * Copyright (c) 2008-2012 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module('lively.persistence.Serializer').requires().toRun(function() {

Object.subclass('ObjectGraphLinearizer',
'settings', {
    defaultCopyDepth: 100,
    keepIds: Config.keepSerializerIds || false,
    showLog: false,
    prettyPrint: false
},
'initializing', {
    initialize: function() {
        this.idCounter = 0;
        this.registry = {};
        this.plugins = [];
        this.copyDepth = 0;
        this.path = [];
    },
    cleanup: function() {
        // remove ids from all original objects and the original objects as well as any recreated objects
        for (var id in this.registry) {
            var entry = this.registry[id];
            if (!this.keepIds && entry.originalObject)
                delete entry.originalObject[this.idProperty]
            if (!this.keepIds && entry.recreatedObject)
                delete entry.recreatedObject[this.idProperty]
            delete entry.originalObject;
            delete entry.recreatedObject;
        }
    },
},
'testing', {
    isReference: function(obj) { return obj && obj.__isSmartRef__ },
    isValueObject: function(obj) {
        if (obj == null) return true;
        if ((typeof obj !== 'object') && (typeof obj !== 'function')) return true;
        if (this.isReference(obj)) return true;
        return false
    },
},
'accessing', {
    idProperty: '__SmartId__',
    escapedCDATAEnd: '<=CDATAEND=>',
    CDATAEnd: '\]\]\>',

    newId: function() {    return this.idCounter++ },
    getIdFromObject: function(obj) {
        return obj.hasOwnProperty(this.idProperty) ? obj[this.idProperty] : undefined;
    },
    getRegisteredObjectFromSmartRef: function(smartRef) {
        return this.getRegisteredObjectFromId(this.getIdFromObject(smartRef))
    },

    getRegisteredObjectFromId: function(id) {
        return this.registry[id] && this.registry[id].registeredObject
    },
    getRecreatedObjectFromId: function(id) {
        return this.registry[id] && this.registry[id].recreatedObject
    },
    setRecreatedObject: function(object, id) {
        var registryEntry = this.registry[id];
        if (!registryEntry)
            throw new Error('Trying to set recreated object in registry but cannot find registry entry!');
        registryEntry.recreatedObject = object
    },
    getRefFromId: function(id) {
        return this.registry[id] && this.registry[id].ref;
    },
},
'plugins', {
    addPlugin: function(plugin) {
        this.plugins.push(plugin);
        plugin.setSerializer(this);
        return this;
    },
    addPlugins: function(plugins) {
        plugins.forEach(function(ea) { this.addPlugin(ea) }, this);
        return this;
    },
    somePlugin: function(methodName, args) {
        // invoke all plugins with methodName and return the first non-undefined result (or null)

        for (var i = 0; i < this.plugins.length; i++) {
            var plugin = this.plugins[i],
                pluginMethod = plugin[methodName];
            if (!pluginMethod) continue;
            var result = pluginMethod.apply(plugin, args);
            if (result) return result
        }
        return null;
    },
    letAllPlugins: function(methodName, args) {
        // invoke all plugins with methodName and args
        for (var i = 0; i < this.plugins.length; i++) {
            var plugin = this.plugins[i],
                pluginMethod = plugin[methodName];
            if (!pluginMethod) continue;
            pluginMethod.apply(plugin, args);
        }
    },
},
'object registry -- serialization', {
    register: function(obj) {
        if (this.isValueObject(obj))
            return obj;

        if (Object.isArray(obj)) {
            var result = [];
            for (var i = 0; i < obj.length; i++) {
                this.path.push(i); // for debugging
                var item = obj[i];

                if (this.somePlugin('ignoreProp', [obj, i, item])) continue;
                result.push(this.register(item));
                this.path.pop();
            }
            return result;
        }

        var id = this.addIdAndAddToRegistryIfNecessary(obj);
        return this.registry[id].ref;
    },
    addIdAndAddToRegistryIfNecessary: function(obj) {
        var id = this.getIdFromObject(obj);
        if (id === undefined) id = this.addIdToObject(obj);
        if (!this.registry[id]) this.addNewRegistryEntry(id, obj)
        return id
    },
    addNewRegistryEntry: function(id, obj) {
        // copyObjectAndRegisterReferences must be done AFTER setting the registry entry
        // to allow reference cycles
        var entry = this.createRegistryEntry(obj, null/*set registered obj later*/, id);
        this.registry[id] = entry;
        entry.registeredObject = this.copyObjectAndRegisterReferences(obj)
        return entry
    },
    createRegistryEntry: function(realObject, registeredObject, id) {
        return {
            originalObject: realObject || null,
            registeredObject: registeredObject || null, // copy of original with replaced refs
            recreatedObject: null, // new created object with patched refs
            ref: {__isSmartRef__: true, id: id},
        }
    },
    copyObjectAndRegisterReferences: function(obj) {
        if (this.copyDepth > this.defaultCopyDepth) {
            alert("Error in copyObjectAndRegisterReferences, path: " + this.path);
            throw new Error('Stack overflow while registering objects? ' + obj)
        }
        this.copyDepth++;
        var copy = {},
            source = this.somePlugin('serializeObj', [obj, copy]) || obj;
        for (var key in source) {
            if (!source.hasOwnProperty(key) || (key === this.idProperty && !this.keepIds)) continue;
            var value = source[key];
            if (this.somePlugin('ignoreProp', [source, key, value])) continue;
            this.path.push(key); // for debugging
            copy[key] = this.register(value);
            this.path.pop();
        }
        this.letAllPlugins('additionallySerialize', [source, copy]);
        this.copyDepth--;
        return copy;
    },
},
'object registry -- deserialization', {
    recreateFromId: function(id) {
        var recreated = this.getRecreatedObjectFromId(id);
        if (recreated) return recreated;

        // take the registered object (which has unresolveed references) and
        // create a new similiar object with patched references
        var registeredObj = this.getRegisteredObjectFromId(id),
            recreated = this.somePlugin('deserializeObj', [registeredObj]) || {};
        this.setRecreatedObject(recreated, id); // important to set recreated before patching refs!
        for (var key in registeredObj) {
            var value = registeredObj[key];
            if (this.somePlugin('ignorePropDeserialization', [registeredObj, key, value])) continue;
            this.path.push(key); // for debugging
            recreated[key] = this.patchObj(value);
            this.path.pop();
        };
        this.letAllPlugins('afterDeserializeObj', [recreated]);
        return recreated;
    },
    patchObj: function(obj) {
        if (this.isReference(obj))
            return this.recreateFromId(obj.id)

        if (Object.isArray(obj))
            return obj.collect(function(item, idx) {
                this.path.push(idx); // for debugging
                var result = this.patchObj(item);
                this.path.pop();
                return result;
            }, this)

        return obj;
    },
},
'serializing', {
    serialize: function(obj) {
        var time = new Date().getTime();
        var root = this.serializeToJso(obj);
        Config.lastSaveLinearizationTime = new Date().getTime() - time;
        time = new Date().getTime();
        var json = this.stringifyJSO(root);
        Config.lastSaveSerializationTime = new Date().getTime() - time;
        return json;
    },
    serializeToJso: function(obj) {
        try {
            var start = new Date();
            var ref = this.register(obj);
            this.letAllPlugins('serializationDone', [this.registry]);
            var simplifiedRegistry = this.simplifyRegistry(this.registry);
            var root = {id: ref.id, registry: simplifiedRegistry};
            this.log('Serializing done in ' + (new Date() - start) + 'ms');
            return root;
        } catch (e) {
            this.log('Cannot serialize ' + obj + ' because ' + e + '\n' + e.stack);
            return null;
        } finally {
            this.cleanup();
        }
    },
    simplifyRegistry: function(registry) {
        var simplified = {isSimplifiedRegistry: true};
        for (var id in registry)
            simplified[id] = this.getRegisteredObjectFromId(id)
        return simplified;
    },
    addIdToObject: function(obj) { return obj[this.idProperty] = this.newId() },
    stringifyJSO: function(jso) {
        var str = this.prettyPrint ? JSON.prettyPrint(jso) : JSON.stringify(jso),
            regex = new RegExp(this.CDATAEnd, 'g');
        str = str.replace(regex, this.escapedCDATAEnd);
        return str
    },
    reset: function() {
        this.registry = {};
    },
},
'deserializing',{
    deserialize: function(json) {
        var jso = this.parseJSON(json);
        return this.deserializeJso(jso);
    },
    deserializeJso: function(jsoObj) {
        var start = new Date(),
            id = jsoObj.id;
        this.registry = this.createRealRegistry(jsoObj.registry);
        var result = this.recreateFromId(id);
        this.letAllPlugins('deserializationDone');
        this.cleanup();
        this.log('Deserializing done in ' + (new Date() - start) + 'ms');
        return result;
    },
    parseJSON: function(json) {
        return this.constructor.parseJSON(json);
    },
    createRealRegistry: function(registry) {
        if (!registry.isSimplifiedRegistry) return registry;
        var realRegistry = {};
        for (var id in registry)
            realRegistry[id] = this.createRegistryEntry(null, registry[id], id);
        return realRegistry;
    },
},
'copying', {
    copy: function(obj) {
        var rawCopy = this.serializeToJso(obj);
        if (!rawCopy) throw new Error('Cannot copy ' + obj)
        return this.deserializeJso(rawCopy);
    },
},
'debugging', {
    log: function(msg) {
        if (!this.showLog) return;
        Global.lively.morphic.World && lively.morphic.World.current() ?
            lively.morphic.World.current().setStatusMessage(msg, Color.blue, 6) :
            console.log(msg);
    },
    getPath: function() { return '["' + this.path.join('"]["') + '"]' },
});

Object.extend(ObjectGraphLinearizer, {
    forLively: function() {
        return this.withPlugins([
            new DEPRECATEDScriptFilter(),
            new ClosurePlugin(),
            new RegExpPlugin(),
            new IgnoreFunctionsPlugin(),
            new ClassPlugin(),
            new LivelyWrapperPlugin(),
            new DoNotSerializePlugin(),
            new DoWeakSerializePlugin(),
            new StoreAndRestorePlugin(),
            new OldModelFilter(),
            new LayerPlugin(),
            new lively.persistence.DatePlugin()
        ]);
    },
    forLivelyCopy: function() {
        var serializer = this.forLively();
        var p = new GenericFilter();
        var world =  lively.morphic.World.current();
        p.addFilter(function(obj, prop, value) { return value === world })
        serializer.addPlugins([p]);
        return serializer;
    },
    withPlugins: function(plugins) {
        var serializer = new ObjectGraphLinearizer();
        serializer.addPlugins(plugins);
        return serializer;
    },
    allRegisteredObjectsDo: function(registryObj, func, context) {
        for (var id in registryObj) {
            var registeredObject = registryObj[id];
            if (!registryObj.isSimplifiedRegistry)
                registeredObject = registeredObject.registeredObject;
            func.call(context || Global, id, registeredObject)
        }
    },
    parseJSON: function(json) {
        if (typeof json !== 'string') return json; // already is JSO?
        var regex = new RegExp(this.prototype.escapedCDATAEnd, 'g'),
            converted = json.replace(regex, this.prototype.CDATAEnd);
        return JSON.parse(converted);
    },

});

Object.subclass('ObjectLinearizerPlugin',
'accessing', {
    getSerializer: function() { return this.serializer },
    setSerializer: function(s) { this.serializer = s },
},
'plugin interface', {
    /* interface methods that can be reimplemented by subclasses:
    serializeObj: function(original) {},
    additionallySerialize: function(original, persistentCopy) {},
    deserializeObj: function(persistentCopy) {},
    ignoreProp: function(obj, propName, value) {},
    ignorePropDeserialization: function(obj, propName, value) {},
    afterDeserializeObj: function(obj) {},
    deserializationDone: function() {},
    serializationDone: function(registry) {},
    */
});

ObjectLinearizerPlugin.subclass('ClassPlugin',
'properties', {
    isInstanceRestorer: true, // for Class.intializer
    classNameProperty: '__LivelyClassName__',
    sourceModuleNameProperty: '__SourceModuleName__',
},
'plugin interface', {
    additionallySerialize: function(original, persistentCopy) {
        this.addClassInfoIfPresent(original, persistentCopy);
    },
    deserializeObj: function(persistentCopy) {
        return this.restoreIfClassInstance(persistentCopy);
    },
    ignoreProp: function(obj, propName) {
        return propName == this.classNameProperty
    },
    ignorePropDeserialization: function(regObj, propName) {
        return this.classNameProperty === propName
    },
    afterDeserializeObj: function(obj) {
        this.removeClassInfoIfPresent(obj)
    },
},
'class info persistence', {
    addClassInfoIfPresent: function(original, persistentCopy) {
        // store class into persistentCopy if original is an instance
        if (!original || !original.constructor) return;
        var className = original.constructor.type;
        persistentCopy[this.classNameProperty] = className;
        var srcModule = original.constructor.sourceModule
        if (srcModule)
            persistentCopy[this.sourceModuleNameProperty] = srcModule.namespaceIdentifier;
    },
    restoreIfClassInstance: function(persistentCopy) {
        // if (!persistentCopy.hasOwnProperty[this.classNameProperty]) return;
        var className = persistentCopy[this.classNameProperty];
        if (!className) return;
        var klass = Class.forName(className);
        if (!klass || ! (klass instanceof Function)) {
            var msg = 'ObjectGraphLinearizer is trying to deserialize instance of ' +
                className + ' but this class cannot be found!';
            dbgOn(true);
            if (!Config.ignoreClassNotFound) throw new Error(msg);
            console.error(msg);
            lively.bindings.callWhenNotNull(lively.morphic.World, 'currentWorld', {warn: function(world) { world.alert(msg) }}, 'warn');
            return {isClassPlaceHolder: true, className: className, position: persistentCopy._Position};
        }
        return new klass(this);
    },
    removeClassInfoIfPresent: function(obj) {
        if (obj[this.classNameProperty])
            delete obj[this.classNameProperty];
    },
},
'searching', {
    sourceModulesIn: function(registryObj) {
        var moduleNames = [],
            partsBinRequiredModulesProperty = 'requiredModules',
            sourceModuleProperty = this.sourceModuleNameProperty;

        ObjectGraphLinearizer.allRegisteredObjectsDo(registryObj, function(id, value) {
            if (value[sourceModuleProperty])
                moduleNames.push(value[sourceModuleProperty]);
            if (value[partsBinRequiredModulesProperty])
                moduleNames.pushAll(value[partsBinRequiredModulesProperty]);
        })

        return moduleNames.reject(function(ea) {
            return ea.startsWith('Global.anonymous_') || ea.include('undefined') }).uniq();
    },
});

ObjectLinearizerPlugin.subclass('LayerPlugin',
'properties', {
    withLayersPropName: 'withLayers',
    withoutLayersPropName: 'withoutLayers'

},
'plugin interface', {
    additionallySerialize: function(original, persistentCopy) {
        this.serializeLayerArray(original, persistentCopy, this.withLayersPropName)
        this.serializeLayerArray(original, persistentCopy, this.withoutLayersPropName)
    },
    afterDeserializeObj: function(obj) {
        this.deserializeLayerArray(obj, this.withLayersPropName)
        this.deserializeLayerArray(obj, this.withoutLayersPropName)
    },
    ignoreProp: function(obj, propName, value) {
        return propName == this.withLayersPropName || propName == this.withoutLayersPropName;
    },
},
'helper',{
    serializeLayerArray: function(original, persistentCopy, propname) {
        var layers = original[propname]
        if (!layers || layers.length == 0) return;
        persistentCopy[propname] = layers.collect(function(ea) {
            return ea instanceof Layer ? ea.fullName() : ea })
    },
    deserializeLayerArray: function(obj, propname) {
        var layers = obj[propname];
        if (!layers || layers.length == 0) return;
        module('cop.Layers').load(true); // FIXME
        obj[propname] = layers.collect(function(ea) {
            console.log(ea)
            return Object.isString(ea) ? cop.create(ea, true) : ea;
        });
    },
});

ObjectLinearizerPlugin.subclass('StoreAndRestorePlugin',
'initializing', {
    initialize: function($super) {
        $super();
        this.restoreObjects = [];
    },
},
'plugin interface', {
    serializeObj: function(original, persistentCopy) {
        if (typeof original.onstore === 'function')
            original.onstore(persistentCopy);
    },
    afterDeserializeObj: function(obj) {
        if (typeof obj.onrestore === 'function')
            this.restoreObjects.push(obj);
    },
    deserializationDone: function() {
        this.restoreObjects.invoke('onrestore');
    },
});
ObjectLinearizerPlugin.subclass('DoNotSerializePlugin',
'testing', {
    doNotSerialize: function(obj, propName) {
        if (!obj.doNotSerialize) return false;
        var merged = Object.mergePropertyInHierarchy(obj, 'doNotSerialize');
        return merged.include(propName);
    },
},
'plugin interface', {
    ignoreProp: function(obj, propName, value) {
        return this.doNotSerialize(obj, propName);
    },
});

ObjectLinearizerPlugin.subclass('DoWeakSerializePlugin',
'initialization', {
    initialize: function($super) {
        $super();
        this.weakRefs = [];
        this.nonWeakObjs = []
    },
},
'testing', {
    doWeakSerialize: function(obj, propName) {
        if (!obj.doWeakSerialize) return false;
        var merged = Object.mergePropertyInHierarchy(obj, 'doWeakSerialize');
        return merged.include(propName);
    },
},
'plugin interface', {
    ignoreProp: function(obj, propName, value) {
        if(this.doWeakSerialize(obj, propName)){
            // remember weak reference to install it later if neccesary
            this.weakRefs.push({obj: obj, propName: propName, value: value})
            return true
        }
        return false
    },
    serializationDone: function(registry) {
        var serializer = this.getSerializer();
        this.weakRefs.forEach(function(ea) {
            var id = serializer.getIdFromObject(ea.value);
            if (id === undefined) return;
            var ownerId = serializer.getIdFromObject(ea.obj),
                persistentCopyFromOwner = serializer.getRegisteredObjectFromId(ownerId);
            persistentCopyFromOwner[ea.propName] = serializer.getRefFromId(id);
        })
    },
    additionallySerialize: function(obj, persistentCopy) {
        return;
        // 1. Save persistentCopy for future manipulation
        this.weakRefs.forEach(function(ea) {
            alertOK("ok")
            if(ea.obj === obj) {
                ea.objCopy = persistentCopy;
            }

            // we maybe reached an object, which was marked weak?
            // alertOK("all " + this.weakRefs.length)
            if (ea.value === obj) {
                // var source = this.getSerializer().register(ea.obj);
                var ref = this.getSerializer().register(ea.value);
                source[ea.propName]
                alertOK('got something:' + ea.propName + " -> " + printObject(ref))
                ea.objCopy[ea.propName] = ref

                LastEA = ea
            }
        }, this)
    },

});

ObjectLinearizerPlugin.subclass('LivelyWrapperPlugin', // for serializing lively.data.Wrappers
'names', {
    rawNodeInfoProperty: '__rawNodeInfo__',
},
'testing', {
    hasRawNode: function(obj) {
        // FIXME how to ensure that it's really a node? instanceof?
        return obj.rawNode && obj.rawNode.nodeType
    },
},
'plugin interface', {
    additionallySerialize: function(original, persistentCopy) {
        if (this.hasRawNode(original))
            this.captureRawNode(original, persistentCopy);
    },
    ignoreProp: function(obj, propName, value) {
        if (!value) return false;
        if (value.nodeType) return true; // FIXME dont serialize nodes
        if (value === Global) return true;
        return false;
    },
    afterDeserializeObj: function(obj) {
        this.restoreRawNode(obj);
    },
},
'rawNode handling', {
    captureRawNode: function(original, copy) {
        var attribs = $A(original.rawNode.attributes).collect(function(attr) {
            return {key: attr.name, value: attr.value, namespaceURI: attr.namespaceURI}
        })
        var rawNodeInfo = {
            tagName: original.rawNode.tagName,
            namespaceURI: original.rawNode.namespaceURI,
            attributes: attribs,
        };
        copy[this.rawNodeInfoProperty] = rawNodeInfo;
    },

    restoreRawNode: function(newObj) {
        var rawNodeInfo = newObj[this.rawNodeInfoProperty];
        if (!rawNodeInfo) return;
        delete newObj[this.rawNodeInfoProperty];
        var rawNode = document.createElementNS(rawNodeInfo.namespaceURI, rawNodeInfo.tagName);
        rawNodeInfo.attributes.forEach(function(attr) {
            rawNode.setAttributeNS(attr.namespaceURI, attr.key, attr.value);
        });
        newObj.rawNode = rawNode;
    },
});

ObjectLinearizerPlugin.subclass('IgnoreDOMElementsPlugin', // for serializing lively.data.Wrappers
'plugin interface', {
    ignoreProp: function(obj, propName, value) {
        if (!value) return false;
        if (value.nodeType) {
            // alert('trying to deserialize node ' + value + ' (pointer from ' + obj + '[' + propName + ']'
            // + '\n path:' + this.serializer.getPath())
            return true;
        }
        if (value === Global) {
            alert('trying to deserialize Global (pointer from ' + obj + '[' + propName + ']'
            + '\n path:' + this.serializer.getPath())
            return true;
        }
        return false;
    },
});

ObjectLinearizerPlugin.subclass('RegExpPlugin',
'accessing', {
    serializedRegExpProperty: '__regExp__',
},
'plugin interface', {
    serializeObj: function(original) {
        if (original instanceof RegExp)
            return this.serializeRegExp(original);
    },
    serializeRegExp: function(regExp) {
        var serialized = {};
        serialized[this.serializedRegExpProperty] = regExp.toString();
        return serialized;
    },

    deserializeObj: function(obj) {
        var serializedRegExp = obj[this.serializedRegExpProperty];
        if (!serializedRegExp) return null;
        delete obj[this.serializedRegExpProperty];
        try {
            return eval(serializedRegExp);
        } catch(e) {
            console.error('Cannot deserialize RegExp ' + e + '\n' + e.stack);
        }
    },
});

ObjectLinearizerPlugin.subclass('OldModelFilter',
'initializing', {
    initialize: function($super) {
        $super();
        this.relays = [];
    },
},
'plugin interface', {
    ignoreProp: function(source, propName, value) {
        // if (propName === 'formalModel') return true;
        // if (value && value.constructor && value.constructor.name.startsWith('anonymous_')) return true;
        return false;
    },
    additionallySerialize: function(original, persistentCopy) {
        var klass = original.constructor;
        // FIX for IE9+ which does not implement Function.name
        if (!klass.name) {
            var n = klass.toString().match('^function\s*([^(]*)\\(');
            klass.name = (n ? n[1].strip() : '');
        }
        if (!klass || !klass.name.startsWith('anonymous_')) return;
        ClassPlugin.prototype.removeClassInfoIfPresent(persistentCopy);
        var def = JSON.stringify(original.definition);
        def = def.replace(/[\\]/g, '')
        def = def.replace(/"+\{/g, '{')
        def = def.replace(/\}"+/g, '}')
        persistentCopy.definition = def;
        persistentCopy.isInstanceOfAnonymousClass = true;
        if (klass.superclass == Relay) {
            persistentCopy.isRelay = true;
        } else if (klass.superclass == PlainRecord) {
            persistentCopy.isPlainRecord = true;
        } else {
            alert('Cannot serialize model stuff of type ' + klass.superclass.type)
        }
    },
    afterDeserializeObj: function(obj) {
        // if (obj.isRelay) this.relays.push(obj);
    },
    deserializationDone: function() {
        // this.relays.forEach(function(relay) {
            // var def = JSON.parse(relay.definition);
        // })
    },
    deserializeObj: function(persistentCopy) {
        if (!persistentCopy.isInstanceOfAnonymousClass) return null;
        var instance;
        function createInstance(ctor, ctorMethodName, argIfAny) {
            var string = persistentCopy.definition, def;
            string = string.replace(/[\\]/g, '')
            string = string.replace(/"+\{/g, '{')
            string = string.replace(/\}"+/g, '}')
            try {
                def = JSON.parse(string);
            } catch(e) {
                console.error('Cannot correctly deserialize ' + ctor + '>>' + ctorMethodName + '\n' + e);
                def = {};
            }
            return ctor[ctorMethodName](def, argIfAny)
        }

        if (persistentCopy.isRelay) {
            var delegate = this.getSerializer().patchObj(persistentCopy.delegate);
            instance = createInstance(Relay, 'newInstance', delegate);
        }

        if (persistentCopy.isPlainRecord) {
            // debugger
            instance = createInstance(Record, 'newPlainInstance');
        }

        if (!instance) alert('Cannot serialize old model object: ' + JSON.stringify(persistentCopy))
        return instance;
    },

});


ObjectLinearizerPlugin.subclass('DEPRECATEDScriptFilter',
'accessing', {
    serializedScriptsProperty: '__serializedScripts__',
    getSerializedScriptsFrom: function(obj) {
        if (!obj.hasOwnProperty(this.serializedScriptsProperty)) return null;
        return obj[this.serializedScriptsProperty]
    },
},
'plugin interface', {
    additionallySerialize: function(original, persistentCopy) {
        var scripts = {}, found = false;
        Functions.own(original).forEach(function(funcName) {
            var func = original[funcName];
            if (!func.isSerializable) return;
            found = true;
            scripts[funcName] = func.toString();
        });
        if (!found) return;
        persistentCopy[this.serializedScriptsProperty] = scripts;
    },
    afterDeserializeObj: function(obj) {
        var scripts = this.getSerializedScriptsFrom(obj);
        if (!scripts) return;
        Properties.forEachOwn(scripts, function(scriptName, scriptSource) {
            Function.fromString(scriptSource).asScriptOf(obj, scriptName);
        })
        delete obj[this.serializedScriptsProperty];
    },
});

ObjectLinearizerPlugin.subclass('ClosurePlugin',
'initializing', {
    initialize: function($super) {
        $super();
        this.objectsMethodNamesAndClosures = [];
    },
},
'accessing', {
    serializedClosuresProperty: '__serializedLivelyClosures__',
    getSerializedClosuresFrom: function(obj) {
        return obj.hasOwnProperty(this.serializedClosuresProperty) ?
            obj[this.serializedClosuresProperty] : null;
    },
},
'plugin interface', {
    serializeObj: function(closure) { // for serializing lively.Closures
        if (!closure || !closure.isLivelyClosure || closure.hasFuncSource()) return;
        if (closure.originalFunc)
            closure.setFuncSource(closure.originalFunc.toString());
        return closure;
    },
    additionallySerialize: function(original, persistentCopy) {
        var closures = {}, found = false;
        Functions.own(original).forEach(function(funcName) {
            var func = original[funcName];
            if (!func || !func.hasLivelyClosure) return;
            found = true;
            closures[funcName] = func.livelyClosure;
        });
        if (!found) return;
        // if we found closures, serialize closures object, this will also trigger
        // ClosurePlugin>>serializeObj for those closures
        persistentCopy[this.serializedClosuresProperty] = this.getSerializer().register(closures);
    },
    afterDeserializeObj: function(obj) {
        var closures = this.getSerializedClosuresFrom(obj);
        if (!closures) return;
        Properties.forEachOwn(closures, function(name, closure) {
            // we defer the recreation of the actual function so that all of the
            // function's properties are already deserialized
            if (closure instanceof lively.Closure) {
                // obj[name] = closure.recreateFunc();
                obj.__defineSetter__(name, function(v) { delete obj[name]; obj[name] = v });
                // in case the method is accessed or called before we are done with serializing
                // everything, we do an 'early recreation'
                obj.__defineGetter__(name, function() {
                    // alert('early closure recreation ' + name)
                    return closure.recreateFunc().addToObject(obj, name);
                })
                this.objectsMethodNamesAndClosures.push({obj: obj, name: name, closure: closure});
            }
        }, this);
        delete obj[this.serializedClosuresProperty];
    },
    deserializationDone: function() {
        this.objectsMethodNamesAndClosures.forEach(function(ea) {
            ea.closure.recreateFunc().addToObject(ea.obj, ea.name);
        })
    },
});

ObjectLinearizerPlugin.subclass('IgnoreFunctionsPlugin',
'interface', {
    ignoreProp: function(obj, propName, value) {
        return value && typeof value === 'function' && !value.isLivelyClosure && !(value instanceof RegExp);
    },
});

ObjectLinearizerPlugin.subclass('lively.persistence.DatePlugin',
'interface', {
    serializeObj: function(obj, copy) {
        return obj instanceof Date ? {isSerializedDate: true, string: String(obj)} : null;
    },
    deserializeObj: function(copy) {
        return copy && copy.isSerializedDate ? new Date(copy.string): null;
    },
});

ObjectLinearizerPlugin.subclass('GenericFilter',
// example
// f = new GenericFilter()
// f.addPropertyToIgnore('owner')
//
'initializing', {
    initialize: function($super) {
        $super();
        this.ignoredClasses = [];
        this.ignoredProperties = [];
        this.filterFunctions = [];
    },
},
'plugin interface', {
    addClassToIgnore: function(klass) {
        this.ignoredClasses.push(klass.type);
    },
    addPropertyToIgnore: function(name) {
        this.ignoredProperties.push(name);
    },

    addFilter: function(filterFunction) {
        this.filterFunctions.push(filterFunction);
    },
    ignoreProp: function(obj, propName, value) {
        return this.ignoredProperties.include(propName) ||
            (value && this.ignoredClasses.include(value.constructor.type)) ||
            this.filterFunctions.any(function(func) { return func(obj, propName, value) });
    },
});

ObjectLinearizerPlugin.subclass('ConversionPlugin',
'initializing', {
    initialize: function(deserializeFunc, afterDeserializeFunc) {
        this.deserializeFunc = deserializeFunc || Functions.Null;
        this.afterDeserializeFunc = afterDeserializeFunc || Functions.Null;
        this.objectLayouts = {}
    },
},
'object layout recording', {
    addObjectLayoutOf: function(obj) {
        var cName = this.getClassName(obj),
            layout = this.objectLayouts[cName] = this.objectLayouts[cName] || {};
        if (!layout.properties) layout.properties = [];
        layout.properties = layout.properties.concat(Properties.all(obj)).uniq();
    },
    printObjectLayouts: function() {
        var str = Properties.own(this.objectLayouts).collect(function(cName) {
            return cName + '\n  ' + this.objectLayouts[cName].properties.join('\n  ')
        }, this).join('\n\n')
        return str
    },
},
'accessing', {
    getClassName: function(obj) {
        return obj[ClassPlugin.prototype.classNameProperty]
    },
},
'plugin interface', {
    afterDeserializeObj: function(obj) {
            return this.afterDeserializeFunc.call(this, obj);
        },
    deserializeObj: function(rawObj) {
        var result = this.deserializeFunc.call(this, rawObj);
        this.addObjectLayoutOf(rawObj);
        return result;
    },
},
'registry', {
    patchRegistry: function(oldRegistry, jso) {
        return new ObjectGraphLinearizer().serializeToJso(jso)
    },
    registerWithPlugins: function(obj, plugins) {
        // for object conversion when objects need to register new ones during conversion
        var serializer = this.getSerializer();
        serializer.addPlugins(plugins);
        var id = serializer.register(obj);
        serializer.plugins = serializer.plugins.withoutAll(plugins);
        return id;
    },

},
'EXAMPLES', {
    convertHPICross: function() {
JSON.prettyPrint(json)
jso = JSON.parse(json)

deserialize = function(obj) {
    var serializer = this.getSerializer();
    if (this.getClassName(obj) == 'Morph') {
        delete obj.pvtCachedTransform
        delete obj.__rawNodeInfo__
        obj._Position = obj.origin
        delete obj.origin
        obj._Rotation = obj.rotation
        delete obj.rotation
        obj._Scale = 1;
        delete obj.scalePoint
        delete obj.priorExtent
        obj.scripts = []
        obj.id = obj._livelyDataWrapperId_
        delete obj._livelyDataWrapperId_
        obj.__SourceModuleName__ = 'lively.morphic.Core'
        obj.__LivelyClassName__ = 'lively.morphic.Morph'

obj.halosEnabled = true
obj.droppingEnabled = true
    }
    if (this.getClassName(obj) == 'lively.scene.Rectangle') {
if (obj.__rawNodeInfo__) {
// var rawNodeInfo = serializer.getRegisteredObjectFromSmartRef(obj.__rawNodeInfo__)
var rawNodeInfo = obj.__rawNodeInfo__
var xAttr = rawNodeInfo.attributes.detect(function(ea) { return ea.key === 'x' })
var yAttr = rawNodeInfo.attributes.detect(function(ea) { return ea.key === 'y' })
if (xAttr && yAttr)
    obj._Position = this.registerWithPlugins(pt(Number(xAttr.value), Number(yAttr.value)), [new ClassPlugin()])
var widthAttr = rawNodeInfo.attributes.detect(function(ea) { return ea.key === 'width' })
var heightAttr = rawNodeInfo.attributes.detect(function(ea) { return ea.key === 'height' })
if (widthAttr && heightAttr )
    obj._Extent = this.registerWithPlugins(pt(Number(widthAttr.value), Number(heightAttr.value)), [new ClassPlugin()])

var attr = rawNodeInfo.attributes.detect(function(ea) { return ea.key === 'fill-opacity' })
obj._FillOpacity = attr && Number(attr.value)
var attr = rawNodeInfo.attributes.detect(function(ea) { return ea.key === 'stroke-opacity' })
obj._StrokeOpacity = attr && Number(attr.value)
var attr = rawNodeInfo.attributes.detect(function(ea) { return ea.key === 'stroke-width' })
obj._BorderWidth = attr && Number(attr.value)
}
        delete obj.__rawNodeInfo__
        obj._BorderColor = obj._stroke
        obj._Fill = obj._fill
        obj.id = obj._livelyDataWrapperId_
        delete obj._livelyDataWrapperId_
        obj.__SourceModuleName__ = 'lively.morphic.Shapes'
        obj.__LivelyClassName__ = 'lively.morphic.Shapes.Rectangle'
    }

    // return obj
}

conversionPlugin = new ConversionPlugin(deserialize)
serializer = ObjectGraphLinearizer.withPlugins([conversionPlugin])
// set id counter so new objects can be registered
serializer.idCounter = Math.max.apply(null, Properties.all(jso.registry).collect(function(prop) { return Number(prop) || -1})) + 1
convertedRawObj = serializer.deserialize(jso)
conversionPlugin.printObjectLayouts()

convertedRawObjRegistry = new ObjectGraphLinearizer().serializeToJso(convertedRawObj)
obj = ObjectGraphLinearizer.forNewLively().deserializeJso(convertedRawObjRegistry)

obj
obj.prepareForNewRenderContext(obj.renderContext())
obj.openInWorld()
    },
});

ObjectLinearizerPlugin.subclass('AttributeConnectionPlugin',
'plugin interface', {
    deserializeObj: function(persistentCopy) {
        var className = persistentCopy[ClassPlugin.prototype.classNameProperty];
        if (!className || className != 'AttributeConnection') return;
    },
});

ObjectLinearizerPlugin.subclass('CopyOnlySubmorphsPlugin',
'initializing', {
    initialize: function() {
        this.morphRefId = 0;
        this.idMorphMapping = {};
        this.root = 0;
    },
},
'copying', {
    copyAsMorphRef: function(morph) {
        var id = ++this.morphRefId;
        this.idMorphMapping[id] = morph;
        return {isCopyMorphRef: true, morphRefId: id};
    },
},
'plugin interface', {
    ignoreProp: function(obj, key, value) {
        if (!value || !this.root || !this.root.isMorph) return false;
        return value === this.root.owner;
    },
    serializeObj: function(obj) {
        // if obj is a morph and the root obj that is copied is a morph then
        // copy this object only if it is a submorph of the root obj
        // otherwise the new copy should directly reference the object
        return (!obj || !this.root || !this.root.isMorph || obj === this.root || !obj.isMorph || !obj.isSubmorphOf || obj.isSubmorphOf(this.root) || !obj.world()) ? null : this.copyAsMorphRef(obj);
    },
    deserializeObj: function(persistentCopy) {
        return persistentCopy.isCopyMorphRef ? this.idMorphMapping[persistentCopy.morphRefId] : undefined;
    },
});

ObjectLinearizerPlugin.subclass('IgnoreEpiMorphsPlugin',
'plugin interface', {
    ignoreProp: function(obj, key, value) { return value && value.isEpiMorph },
});

// (de)serialize objects that inherit stuff from a constructor function
ObjectLinearizerPlugin.subclass('lively.persistence.GenericConstructorPlugin',
'accessing', {
    constructorProperty: '__constructorName__',

    getConstructorName: function(obj) {
        return obj && obj.constructor && obj.constructor.name;
    },

    isLivelyClassInstance: function(obj) {
        return obj && obj.constructor && obj.constructor.type !== undefined;
    }
},
'plugin interface', {

    additionallySerialize: function(original, persistentCopy) {
        var name = this.getConstructorName(original);
        if (name && name !== 'Object' && !this.isLivelyClassInstance(original)) {
            persistentCopy[this.constructorProperty] = name;
            return true;
        }
        return false;
    },

    deserializeObj: function(persistentCopy) {
        var name = persistentCopy[this.constructorProperty],
            constr = name && Class.forName(name);
        if (!constr) return undefined;
        // we use a new constructor function instead of the real constructor
        // here so that we don't need to know any arguments that might be expected
        // by the original constructor. To correctly make inheritance work
        // (instanceof and .constructor) we set the prototype property of our helper
        // constructor to the real constructor.prototype
        function HelperConstructor() {};
        HelperConstructor.prototype = constr.prototype;
        return new HelperConstructor();
    }
});

Object.extend(lively.persistence.Serializer, {

    jsonWorldId: 'LivelyJSONWorld',
    changeSetElementId: 'WorldChangeSet',

    createObjectGraphLinearizer: function() {
        return Config.isNewMorphic ? ObjectGraphLinearizer.forNewLively() : ObjectGraphLinearizer.forLively()
    },

    createObjectGraphLinearizerForCopy: function() {
        return Config.isNewMorphic ? ObjectGraphLinearizer.forNewLivelyCopy() : ObjectGraphLinearizer.forLivelyCopy()
    },

    serialize: function(obj, optPlugins, optSerializer) {
        var serializer = optSerializer || this.createObjectGraphLinearizer();
        if (optPlugins) optPlugins.forEach(function(plugin) { serializer.addPlugin(plugin) });
        var json = serializer.serialize(obj);
        return json;
    },

    serializeWorld: function(world) {
        var doc = new Importer().getBaseDocument(); // FIXME
        return this.serializeWorldToDocument(world, doc);
    },

    serializeWorldToDocument: function(world, doc) {
        return this.serializeWorldToDocumentWithSerializer(world, doc, this.createObjectGraphLinearizer());
    },

    serializeWorldToDocumentWithSerializer: function(world, doc, serializer) {
        // this helper object was introduced to make the code that is browser dependent
        // (currently IE9 vs the rest) easier to read. It sould be moved to dome general DOM abstraction layer
        var domAccess = {
            getSystemDictNode: function(doc) {
                return (doc.getElementById ?
                    doc.getElementById('SystemDictionary') :
                    doc.selectSingleNode('//*[@id="SystemDictionary"]'));
            },
            createMetaNode: function(doc) {
                return UserAgent.isIE ? doc.createNode(1, 'meta', Namespace.XHTML) : XHTMLNS.create('meta')
            },
            getCSNode: function(doc, changeSet) {
                var changeSetNode;
                if (!changeSet) {
                    alert('Found no ChangeSet while serializing ' + world + '! Adding an empty CS.');
                    changeSetNode = LivelyNS.create('code');
                } else {
                    changeSetNode = cs.getXMLElement();
                }
                if (!UserAgent.isIE) return doc.importNode(changeSetNode, true);
                // mr: this is a real IE hack!
                var helperDoc = new ActiveXObject('MSXML2.DOMDocument.6.0');
                helperDoc.loadXML(new XMLSerializer().serializeToString(changeSetNode));
                return doc.importNode(helperDoc.firstChild, true);
            },
            getHeadNode: function(doc) {
                return doc.getElementsByTagName('head')[0] || doc.selectSingleNode('//*["head"=name()]');
            },
        }

        var head = domAccess.getHeadNode(doc);

        // FIXME remove previous meta elements - is this really necessary?
        //var metaElement;
        //while (metaElement = doc.getElementsByTagName('meta')[0])
        //    metaElement.parentNode.removeChild(metaElement)
        // removed 2012-01-5 fabian
        // doing this instead: remove old serialized data.. is it necessary or not?
        // we need additional meta tags for better iPad touch support, can't remove all of them..
        var metaToBeRemoved = ['LivelyMigrationLevel', 'WorldChangeSet', 'LivelyJSONWorld'];
        metaToBeRemoved.forEach(function(ea) {
            var element = doc.getElementById(ea);
            if (element) {
                element.parentNode.removeChild(element);
            }});


        // FIXME remove system dictionary
        var sysDict = domAccess.getSystemDictNode(doc);
        if (sysDict) sysDict.parentNode.removeChild(sysDict);

        // store migration level
        var migrationLevel = LivelyMigrationSupport.migrationLevel,
            migrationLevelNode = domAccess.createMetaNode(doc);
        migrationLevelNode.setAttribute('id', LivelyMigrationSupport.migrationLevelNodeId);
        migrationLevelNode.appendChild(doc.createCDATASection(migrationLevel));
        head.appendChild(migrationLevelNode);

        // serialize changeset
        var cs = world.getChangeSet(),
            csElement = domAccess.getCSNode(doc, cs),
            metaCSNode = domAccess.createMetaNode(doc);
        metaCSNode.setAttribute('id', this.changeSetElementId);
        metaCSNode.appendChild(csElement);
        head.appendChild(metaCSNode);

        // serialize world
        var json = this.serialize(world, null, serializer),
            metaWorldNode = domAccess.createMetaNode(doc);
        if (!json) throw new Error('Cannot serialize world -- serialize returned no JSON!');
        metaWorldNode.setAttribute('id', this.jsonWorldId)
        metaWorldNode.appendChild(doc.createCDATASection(json))
        head.appendChild(metaWorldNode);

        return doc;
    },
    deserialize: function(json, optDeserializer) {
        var deserializer = optDeserializer || this.createObjectGraphLinearizer();
        var obj = deserializer.deserialize(json);
        return obj;
    },

    deserializeWorldFromDocument: function(doc) {
        var worldMetaElement = doc.getElementById(this.jsonWorldId);
        if (!worldMetaElement)
            throw new Error('Cannot find JSONified world when deserializing');
        var serializer = this.createObjectGraphLinearizer(),
            json = worldMetaElement.textContent,
            world = serializer.deserialize(json);
        return world;
    },

    deserializeWorldFromJso: function(jso) {
        var serializer = this.createObjectGraphLinearizer(),
            world = serializer.deserializeJso(jso);
        return world;
    },

    deserializeChangeSetFromDocument: function(doc) {
        var csMetaElement = doc.getElementById(this.changeSetElementId);
        if (!csMetaElement)
            throw new Error('Cannot find ChangeSet meta element when deserializing');
        return ChangeSet.fromNode(csMetaElement);
    },

    sourceModulesIn: function(jso) {
        return new ClassPlugin().sourceModulesIn(jso.registry);
    },

    parseJSON: function(json) {
        return ObjectGraphLinearizer.parseJSON(json);
    },

    copyWithoutWorld: function(obj) {
        var serializer = this.createObjectGraphLinearizerForCopy(),
            dontCopyWorldPlugin = new GenericFilter();
        dontCopyWorldPlugin.addFilter(function(obj, propName, value) { return value === lively.morphic.World.current() })
        serializer.addPlugin(dontCopyWorldPlugin);
        var copy = serializer.copy(obj);
        return copy;
    },

    newMorphicCopy: function(obj) {
        var serializer = this.createObjectGraphLinearizerForCopy();
        serializer.showLog = false;
        var copyPlugin = new CopyOnlySubmorphsPlugin();
        copyPlugin.root = obj;
        serializer.addPlugin(copyPlugin);
        return serializer.copy(obj);
    },
});

Object.extend(lively.persistence, {
    getPluginsForLively: function() {
        return this.pluginsForLively.collect(function(klass) {
            return new klass();
        })
    },

    pluginsForLively: [
        StoreAndRestorePlugin,
        ClosurePlugin,
        RegExpPlugin,
        IgnoreFunctionsPlugin,
        ClassPlugin,
        IgnoreEpiMorphsPlugin,
        DoNotSerializePlugin,
        DoWeakSerializePlugin,
        IgnoreDOMElementsPlugin,
        LayerPlugin,
        lively.persistence.DatePlugin]
});

Object.extend(ObjectGraphLinearizer, {
    forNewLively: function() {
        var serializer = new ObjectGraphLinearizer();
        serializer.addPlugins(lively.persistence.getPluginsForLively());
        return serializer;
    },

    forNewLivelyCopy: function() {
        var serializer = this.forNewLively(),
            p = new GenericFilter(),
            world = lively.morphic.World.current();
        p.addFilter(function(obj, prop, value) { return value === world })
        serializer.addPlugins([p]);
        return serializer;
    }
});


// Proper namespacing
Object.extend(lively.persistence, {
    ObjectGraphLinearizer: ObjectGraphLinearizer,
    ObjectLinearizerPlugin: ObjectLinearizerPlugin,
    ClassPlugin: ClassPlugin,
    LayerPlugin: LayerPlugin,
    StoreAndRestorePlugin: StoreAndRestorePlugin,
    DoNotSerializePlugin: DoNotSerializePlugin,
    DoWeakSerializePlugin: DoWeakSerializePlugin,
    LivelyWrapperPlugin: LivelyWrapperPlugin,
    IgnoreDOMElementsPlugin: IgnoreDOMElementsPlugin,
    RegExpPlugin: RegExpPlugin,
    OldModelFilter: OldModelFilter,
    DEPRECATEDScriptFilter: DEPRECATEDScriptFilter,
    ClosurePlugin: ClosurePlugin,
    IgnoreFunctionsPlugin: IgnoreFunctionsPlugin,
    GenericFilter: GenericFilter,
    ConversionPlugin: ConversionPlugin,
    AttributeConnectionPlugin: AttributeConnectionPlugin
});

}) // end of module
