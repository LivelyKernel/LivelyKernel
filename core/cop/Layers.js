/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
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


// Non-Lively Compatibility
if (!window.module) {
    module = function() {
        return {
            requires: function() {return this},
            toRun: function(func) {
                func()
            }
        }
    }
    Config = {};
    cop = {};
    Global = window;



Object.extend(Function.prototype, {

	defaultCategoryName: 'default category',

	subclass: function(/*... */) {
		// Main method of the LK class system.

		// {className} is the name of the new class constructor which this method synthesizes
		// and binds to {className} in the Global namespace.
		// Remaining arguments are (inline) properties and methods to be copied into the prototype
		// of the newly created constructor.

		// modified from prototype.js

		var args = $A(arguments),
			className = args.shift(),
			targetScope = Global,
			shortName = null;

		if (className) {
			targetScope = Class.namespaceFor(className);
			shortName = Class.unqualifiedNameFor(className);
		}  else {
			shortName = "anonymous_" + (Class.anonymousCounter++);
			className = shortName;
		}

		var klass;
		if (className && targetScope[shortName] && (targetScope[shortName].superclass === this)) {
			// preserve the class to allow using the subclass construct in interactive development
			klass = targetScope[shortName];
		} else {
			klass = Class.newInitializer(shortName);
			klass.superclass = this;
			var protoclass = function() { }; // that's the constructor of the new prototype object
			protoclass.prototype = this.prototype;
			klass.prototype = new protoclass();
			klass.prototype.constructor = klass;
			klass.prototype.constructor.type = className; // KP: .name would be better but js ignores .name on anonymous functions
			klass.prototype.constructor.displayName = className; // for debugging, because name can not be assigned
			if (className) targetScope[shortName] = klass; // otherwise it's anonymous

			// remember the module that contains the class def
			if (Global.lively && lively.lang && lively.lang.Namespace)
				klass.sourceModule = lively.lang.Namespace.current();
		};

		// the remaining args should be category strings or source objects
		this.addMethods.apply(klass, args);

		if (!klass.prototype.initialize)
			klass.prototype.initialize = function () {};

		return klass;
	},
});

}

/*
 * COP Layers for JavaScript
 */

module('cop.Layers').requires().toRun(function(thisModule) {

/* Private Helpers for Development */

Config.ignoredepricatedProceed = true;

var log_layer_code = false;
var log = function log(string) { if(log_layer_code) console.log(string); };

/*
 * Private State
 */

Object.extend(cop, {
    dynamicInlining: Config.copDynamicInlining && !document.URL.include('noDynamicInlining'),
    staticInlining: false,
    proceedStack: [],
    GlobalLayers: [],
// hack, to work around absence of identity dictionaries in JavaScript
// we could perhaps limit ourselfs to layer only those objects that respond to object.id()
// because working with objects is a serialization problem in itself, perhaps we should restrict ourself in working with classes
// So classes have names and names can be used as keys in dictionaries :-)
    object_id_counter: 0,
});

/*
 * Private Methods
 */
Object.extend(cop, {

    // for debbuggin ContextJS itself
    withLogLayerCode: function(func) {
        try {
            var old  = log_layer_code;
            log_layer_code = true;
            func();
        } finally {
            log_layer_code = old;
        }
    },

    getLayerDefinitionForObject: function(layer, object) {
        // log("cop.getLayerDefinitionForObject(" + layer + "," + object +")")
        if (!layer || !object) return;
        var result = layer[object._layer_object_id];
        return result ? result : cop.getLayerDefinitionForObject(layer, object.prototype);
    },


    ensurePartialLayer: function(layer, object) {
        if (!layer)
            throw new Error("in ensurePartialLayer: layer is nil");
        if (!object.hasOwnProperty("_layer_object_id"))
            object._layer_object_id = cop.object_id_counter++;
        if (!layer[object._layer_object_id])
            layer[object._layer_object_id] = {_layered_object: object};
        return layer[object._layer_object_id];
    },

    layerMethod: function(layer, object,  property, func) {
        cop.ensurePartialLayer(layer, object)[property] = func;
        func.displayName = "layered " + layer.name + " " + (object.constructor ? (object.constructor.type + "$"): "") + property;
        cop.makeFunctionLayerAware(object, property);
    },

    layerGetterMethod: function(layer, object, property, getter) {
        cop.ensurePartialLayer(layer, object).__defineGetter__(property, getter);
    },

    layerSetterMethod: function(layer, object, property, setter) {
        cop.ensurePartialLayer(layer, object).__defineSetter__(property, setter);
    },

    layerProperty: function(layer, object,  property, defs) {
        var getter = defs.__lookupGetter__(property);
        if (getter) cop.layerGetterMethod(layer, object, property, getter);

        var setter = defs.__lookupSetter__(property);
        if (setter) cop.layerSetterMethod(layer, object, property, setter);

        if (getter || setter) cop.makePropertyLayerAware(object, property);
        else cop.layerMethod(layer, object,  property, defs[property]);
    },

    layerPropertyWithShadow: function(layer, object, property) {
        // shadowing does not work with current implementation
        // see the shadow tests in LayersTest
        var defs = {},
            baseValue = object[property],
            layeredPropName = "_layered_" + layer.getName() + "_" + property;
        defs.__defineGetter__(property, function layeredGetter() {
            return this[layeredPropName] === undefined ? cop.proceed() : this[layeredPropName];
        }.binds({layeredPropName: layeredPropName, baseValue: baseValue}));
        defs.__defineSetter__(property, function layeredSetter(v) {
            this[layeredPropName] = v;
        }.binds({layeredPropName: layeredPropName}));
        cop.layerProperty(layer, object, property, defs);
    },

    computeLayersFor: function Layers$computeLayersFor(obj) {
        return obj && obj.activeLayers ? obj.activeLayers(cop.currentLayers) : cop.currentLayers();
    },

    composeLayers: function(stack) {
        var result = cop.GlobalLayers.clone();
        for (var i = 0; i < stack.length; i++) {
            var current = stack[i];
            if (current.withLayers)
                result = result.withoutAll(current.withLayers).concat(current.withLayers)
            else if (current.withoutLayers)
                result = result.withoutAll(current.withoutLayers);
        }
        return result;
    },

    currentLayers: function() {
        if (cop.LayerStack.length == 0)
            throw new Error("The default layer is missing");

        // NON OPTIMIZED VERSION FOR STATE BASED LAYER ACTIVATION
        var current = cop.LayerStack.last();
        if (!current.composition || (cop.dynamicInlining && !current.composition.hash)) {
            current.composition = cop.composeLayers(cop.LayerStack);
            if (cop.dynamicInlining)
                current.composition.hash = cop.computeHashForLayers(current.composition);
        }

        return current.composition;
    },

    // clear cached layer compositions
    invalidateLayerComposition: function() {
        cop.LayerStack.forEach(function(ea) { ea.composition = null });
    },

    resetLayerStack: function() {
        cop.LayerStack = [{
            isStatic: true,
            toString: function() { return "BaseLayer" },
            composition: null
        }];
        cop.invalidateLayerComposition();
    },

    lookupLayeredFunctionForObject: function(self, layer, function_name, methodType, n) {
        if (!layer) return undefined;
        // we have to look for layer defintions in self, self.prototype,
        // ... there may be layered methods in a subclass of "obj"
        var layered_function,
            layer_definition_for_object = cop.getLayerDefinitionForObject(layer, self);
        if (layer_definition_for_object) {
            // log("  found layer definitions for object");
            // TODO: optional proceed goes here....
            if (methodType == 'getter') {
                layered_function = layer_definition_for_object.__lookupGetter__(function_name);
            } else if (methodType == 'setter'){
                layered_function = layer_definition_for_object.__lookupSetter__(function_name);
            } else {
                if (layer_definition_for_object.hasOwnProperty(function_name))
                    layered_function = layer_definition_for_object[function_name];
            }
        }
        if (!layered_function) {
            // try the superclass hierachy
            // log("look for superclass of: " + self.constructor)
            var superclass = self.constructor.superclass;
            if (superclass) {
                foundClass = superclass;
                // log("layered function is not found in this partial method, lookup for my prototype?")
                return cop.lookupLayeredFunctionForObject(superclass.prototype, layer, function_name, methodType);
            } else {
                // log("obj has not prototype")
            }
        }
        return layered_function;
    },

    pvtMakeFunctionOrPropertyLayerAware: function(obj, slotName, baseValue, type) {
        // install in obj[slotName] a cop wrapper that weaves partial methods
        // into real method (baseValue)

        if (baseValue.isLayerAware) return;

        if (cop.staticInlining)
            return cop.makeSlotLayerAwareWithStaticInlining(obj, slotName, baseValue, type)

        if (cop.dynamicInlining)
            return cop.makeSlotLayerAwareWithDynamicInlining(obj, slotName, baseValue, type)

        cop.makeSlotLayerAwareWithNormalLookup(obj, slotName, baseValue, type);
    },
    makeSlotLayerAwareWithNormalLookup: function(obj, slotName, baseValue, type) {
        var wrapped_function = function() {
            var composition = new cop.PartialLayerComposition(
                this, obj, slotName, baseValue, type);
            cop.proceedStack.push(composition);
            try {
                return cop.proceed.apply(this, arguments);
            } finally {
                cop.proceedStack.pop()
            };
        };
        wrapped_function.isLayerAware = true;
        // this is more declarative outside of COP context
        wrapped_function.isContextJSWrapper = true;

        // For wrapped_function.getOriginal()
        wrapped_function.originalFunction = baseValue;

        if (type == "getter") {
            obj.__defineGetter__(slotName, wrapped_function);
        } else if (type == "setter") {
            obj.__defineSetter__(slotName, wrapped_function);
        } else {
            obj[slotName] = wrapped_function;
        }
    },

    makeFunctionLayerAware: function(base_obj, function_name) {
            if (!base_obj) throw new Error("can't layer an non existent object");

            /* ensure base function */
            var base_function = base_obj[function_name];
            if (!base_function) {
                // console.log("WARNING can't layer an non existent function" + function_name +" , so do nothing")
                // return;
                base_function = Functions.Null;
            };
            cop.pvtMakeFunctionOrPropertyLayerAware(base_obj, function_name, base_function)
    },

    makePropertyLayerAware: function(baseObj, property) {
        if (!baseObj) throw new Error("can't layer an non existent object");

        // ensure base getter and setter
        var getter = baseObj.__lookupGetter__(property),
            propName = "__layered_" + property + "__";
        if (!getter) {
            // does not work when dealing with classes and instances...
            baseObj[propName] = baseObj[property]; // take over old value
            getter = function() { return this[propName] }.binds({propName: propName});
            baseObj.__defineGetter__(property, getter);
        };
        var setter = baseObj.__lookupSetter__(property);
        if (!setter) {
            setter = function(value) { return this[propName] = value }.binds({propName: propName});
            baseObj.__defineSetter__(property, setter);
        };

        cop.pvtMakeFunctionOrPropertyLayerAware(baseObj, property, getter, 'getter');
        cop.pvtMakeFunctionOrPropertyLayerAware(baseObj, property, setter, 'setter');
    },
    makeFunctionLayerUnaware: function(base_obj, function_name) {
            if (!base_obj)
                throw new Error("need object to makeFunctionLayerUnaware");

            var prevFunction;
            var currentFunction = base_obj[function_name];

            if (currentFunction === undefined)
                return; // nothing to do here


            while (typeof currentFunction.originalFunction == 'function' &&
                !currentFunction.isLayerAware) {

                var prevFunction = currentFunction;
                currentFunction = currentFunction.originalFunction
            }

            if (!(currentFunction.isLayerAware))
                return; // nothing to do here

            var originalFunction = currentFunction.originalFunction

            if (!(originalFunction instanceof Function))
                throw new Error("makeFunctionLayerUnaware Error: no orignal function");

            if (prevFunction instanceof Function) {
                prevFunction.originalFunction = originalFunction
            } else {
                base_obj[function_name] = originalFunction
            }
    },

    uninstallLayersInObject: function(object) {
        Functions.own(object).forEach(function(ea){
            cop.makeFunctionLayerUnaware(object, ea)
        })
    },

    // cop.uninstallLayersInAllClasses()
    uninstallLayersInAllClasses: function() {

        Global.classes(true).forEach(function(ea) {
            cop.uninstallLayersInObject(ea.prototype)
        })
    },

    allLayers: function(optObject) {
        // does not really return all layers... layers in namespaces are not found!
        // therefore you can query all layers in an optObject
        return Object.values(optObject || Global).select(function(ea) { return ea instanceof Layer})
    }
});

/* PUPLIC COP  Layer Definition */
Object.extend(cop, {
    // creates a named global layer
    create: function(name, silent) {
        var context = Class.namespaceFor(name),
            layerName = Class.unqualifiedNameFor(name);
        return context[layerName] = cop.basicCreate(layerName, context);
    },
    basicCreate: function(layerName, context) {
        context = context || Global;
        return context[layerName] || new Layer(layerName, context.namespaceIdentifier);
    },


    // DEPRICATED
    layer: function(name) {
        console.log("SyntaxDepricated: cop.layer(... use cop.create(")
        return cop.create(name, true);
    },

    // DEPRICATED
    createLayer: function(name) {
        console.log("SyntaxDepricated: cop.createLayer(... use cop.create(")
        return cop.create(name, false);
    },

    // Layering objects may be a garbage collection problem, because the layers keep strong reference to the objects
    layerObject: function(layer, object, defs) {
        // log("cop.layerObject");
        Object.keys(defs).forEach(function(function_name) {
            // log(" layer property: " + function_name);
            cop.layerProperty(layer, object, function_name, defs);
        });
    },

    // layer around only the class methods
    layerClass: function(layer, classObject, defs) {
        cop.layerObject(layer, classObject.prototype, defs);
    },

    // layer around class methods and all subclass methods
    // (might be related to Aspect oriented programming)
    layerClassAndSubclasses: function(layer, classObject, defs) {
        // log("layerClassAndSubclasses");
        cop.layerClass(layer, classObject, defs);

        // and now wrap all overriden methods...
        classObject.allSubclasses().forEach(function(eaClass) {
            // log("make m1 layer aware in " + eaClass)
            var obj = eaClass.prototype;
            Object.keys(defs).forEach(function(eaFunctionName) {
                if (obj.hasOwnProperty(eaFunctionName)) {
                    if (obj[eaFunctionName] instanceof Function) {
                        cop.makeFunctionLayerAware(obj, eaFunctionName);
                    } else {
                        // to be tested...
                        // cop.makePropertyLayerAware(eaClass.prototype, m1)
                    }
                };
            });
        });
    },

    /* Layer Activation */
    withLayers: function withLayers(layers, func) {
        cop.LayerStack.push({withLayers: layers});
        // console.log("callee: " + cop.withLayers.caller)
        try {
            return func();
        } finally {
            cop.LayerStack.pop();
        }
    },

    withoutLayers: function withoutLayers(layers, func) {
        cop.LayerStack.push({withoutLayers: layers});
        try {
            return func();
        } finally {
            cop.LayerStack.pop();
        }
    },


    /* Global Layer Activation */
    enableLayer: function(layer) {
        if (cop.GlobalLayers.include(layer)) return;
        cop.GlobalLayers.push(layer);
        cop.invalidateLayerComposition();
    },

    disableLayer: function(layer) {
        var idx = cop.GlobalLayers.indexOf(layer)
        if (idx < 0) return;
        cop.GlobalLayers.removeAt(idx);
        cop.invalidateLayerComposition();
    },

    proceed: function(/* arguments */) {
        // COP Proceed Function
        var composition = cop.proceedStack.last();
        if (!composition) {
            console.log('ContextJS: no composition to proceed (stack is empty) ')
            return
        };

        // TODO use index instead of shifiting?
        if (composition.partialMethodIndex == undefined)
            composition.partialMethodIndex = composition.partialMethods.length - 1;

        var index = composition.partialMethodIndex;
        var partialMethod = composition.partialMethods[index];
        if (!partialMethod) {
            if (!partialMethod) throw new COPError('no partialMethod to proceed')
        } else {
            try {
                composition.partialMethodIndex  = index - 1;
                if (!Config.ignoredepricatedProceed && partialMethod.toString().match(/^[\t ]*function ?\(\$?proceed/)) {
                    var args = $A(arguments);
                    args.unshift(cop.proceed);
                    var msg = "proceed in arguments list in " + composition.functionName
                    if (Config.throwErrorOnDepricated) throw new Error("DEPRICATED ERROR: " + msg);
                    if (Config.logDepricated) {
                        // console.log("source: " + partialMethod.toString())
                        console.log("DEPRICATED WARNING: " + msg);
                    }
                    var result = partialMethod.apply(composition.object, args);
                } else {
                    var result = partialMethod.apply(composition.object, arguments);
                }

            } finally {
                composition.partialMethodIndex = index
            }
            return result
        }
    }
})


// Mark old ContextJS API as Depricated
var markNamespaceEntryAsDepricated = function(newNamespace, newName, oldNamespace, oldName) {
    oldNamespace[oldName] = newNamespace[newName].wrap(function(proceed) {
        if (Config.throwErrorOnDepricated) throw new Error("DEPRICATED ERROR: " + oldName + " is depricated");
        if (Config.logDepricated) console.log("DEPRICATED WARNING: " + oldName + " is depricated");
        var args = $A(arguments);
        args.shift();
        return proceed.apply(this, args);
    });
};

markNamespaceEntryAsDepricated(cop, "enableLayer", Global,  "enableLayer");
markNamespaceEntryAsDepricated(cop, "disableLayer", Global,  "disableLayer");
markNamespaceEntryAsDepricated(cop, "withLayers", Global,  "withLayers");
markNamespaceEntryAsDepricated(cop, "withoutLayers", Global,  "withoutLayers");
markNamespaceEntryAsDepricated(cop, "createLayer", Global,  "createLayer");
markNamespaceEntryAsDepricated(cop, "layerObject", Global,  "layerObject");
markNamespaceEntryAsDepricated(cop, "layerClass", Global,  "layerClass");
markNamespaceEntryAsDepricated(cop, "layerClassAndSubclasses", Global,  "layerClassAndSubclasses");

// Class Definitions

// TODO How to make this independend from the Lively Kernel class system?
Object.subclass("Layer",
'initializing', {
    initialize: function(name, namespaceName) {
        this.name = name;
        this.namespaceName = namespaceName || 'Global';

        if (Global.lively && lively.lang && lively.lang.Namespace)
            this.sourceModule = lively.lang.Namespace.current();
    },
},
'accessing', {
    getName: function() { return this.name },
    fullName: function() { return this.namespaceName + '.' + this.getName() },
    layeredObjects: function() {
        return Properties.own(this)
            .collect(function(ea) {return this[ea] && this[ea]._layered_object}, this)
            .select(function(ea) {return ea})
    },
    layeredClasses: function() {
        return this.layeredObjects()
            .collect(function(ea) { return ea.constructor })
            .select(function(ea) {return Class.isClass(ea) })
    },



},
'testing', {
    isGlobal: function() { return cop.GlobalLayers.include(this) },
},
'removing', {
    remove: function() {
        if (this.isGlobal()) this.beNotGlobal();
        var ns = module(this.namespaceName);
        delete ns[this.name];
    },
},
'layer installation',     {
    layerClass: function(classObj, methods) {
        cop.layerClass(this, classObj, methods);
        return this;
    },

    layerObject: function(obj, methods) {
        cop.layerObject(this, obj, methods);
        return this;
    },
    refineClass: function(classObj, methods) {
        cop.layerClass(this, classObj, methods);
        return this
    },

    refineObject: function(obj, methods) {
        cop.layerObject(this, obj, methods);
        return this
    },

    unrefineObject: function(obj) {
        var id = obj._layer_object_id;
        if (id !== undefined)
            delete this[id]
    },

    unrefineClass: function(classObj) {
        this.unrefineObject(classObj.prototype)
    },
},
'layer activation', {
    beGlobal: function() {
        cop.enableLayer(this);
        return this;
    },

    beNotGlobal: function() {
        cop.disableLayer(this);
        return this;
    },
},
'debugging', {
    toString: function() { return this.getName() },
},
'deprecated serialization', {
    toLiteral: function() {
        if (!this.name)
            console.warn("Layer: Can not serialize without a name!");
        return {
            name: this.name
        };
    },
});

// Lively Kernel Literal Serialization
Object.extend(Layer, {
    fromLiteral: function(literal) {
        // console.log("Deserializing Layer Activation from: " + literal.name)
        return cop.create(literal.name, false);
    }
});

/* Example implementation of a layerable object */
Object.extend(Global, {LayerableObjectTrait: {}});
Object.extend(LayerableObjectTrait, {
    activeLayers: function() {
        var result = {withLayers: [], withoutLayers: []};
        this.dynamicLayers(result);
        this.structuralLayers(result)
        this.globalLayers(result)
        return result.withLayers
    },

    collectWithLayersIn: function(layers, result) {
        for (var i = 0; i < layers.length; i++) {
            var ea = layers[i]
            if ((result.withLayers.indexOf(ea) === -1) && (result.withoutLayers.indexOf(ea) === -1))
                result.withLayers.unshift(ea)
        };
    },

    collectWithoutLayersIn: function(layers, result) {
        for (var i = 0; i < layers.length; i++) {
            var ea = layers[i]
            if ((result.withoutLayers.indexOf(ea) === -1))
                result.withoutLayers.push(ea)
        };
    },

    dynamicLayers: function(result) {
        // optimized version, that does not use closures and recursion
        var stack = cop.LayerStack;
        // top down, ignore bottom element
        for (var j = stack.length - 1; j > 0; j--) {
            var current = stack[j];
            if (current.withLayers)
                this.collectWithLayersIn(current.withLayers, result);
            if (current.withoutLayers)
                this.collectWithoutLayersIn(current.withoutLayers, result);
        }
        return result
    },

    structuralLayers: function(result) {
        var allLayers = result.withLayers,
            allWithoutLayers = result.withoutLayers,
            obj = this;

        // go ownerchain backward and gather all layer activations and deactivations
        while (obj) {
            // don't use accessor methods because of speed... (not measured yet)
            if (obj.withLayers)
                this.collectWithLayersIn(obj.withLayers, result);
            if (obj.withoutLayers)
                this.collectWithoutLayersIn(obj.withoutLayers, result);

            // recurse, stop if owner is undefined
            obj = obj.owner
        }
        return result;
    },

    globalLayers: function(result) {
        this.collectWithLayersIn(cop.GlobalLayers, result);
        return result
    },

    setWithLayers: function(layers) { this.withLayers = layers },

    addWithLayer: function(layer) {
        var layers = this.getWithLayers();
        if (!layers.include(layer)) this.setWithLayers(layers.concat([layer]))
    },

    removeWithLayer: function(layer) {
        var layers = this.getWithLayers();
        if (layers.include(layer)) this.setWithLayers(layers.without(layer));
    },
    addWithoutLayer: function(layer) {
        var layers = this.getWithoutLayers();
        if (!layers.include(layer)) this.setWithoutLayers(layers.concat([layer]))
    },
    removeWithoutLayer: function(layer) {
        var layers = this.getWithoutLayers();
        this.setWithoutLayers(layers.without(layer));
    },



    setWithoutLayers: function(layers) { this.withoutLayers = layers },

    getWithLayers: function(layers) { return this.withLayers || [] },

    getWithoutLayers: function(layers) { return this.withoutLayers || [] },
});

Object.subclass("LayerableObject", LayerableObjectTrait);

Object.subclass('COPError', {
    initialize: function(msg) {
        this.msg = msg
    },
    toString: function() { return "COP Error: " + this.msg },
});

Object.subclass("cop.PartialLayerComposition", {
    initialize: function(obj,  prototypeObject, functionName, baseFunction, methodType) {
        this.partialMethods = [baseFunction];
        var layers = cop.computeLayersFor(obj);
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i],
                partialMethod = cop.lookupLayeredFunctionForObject(
                    obj, layer, functionName, methodType);
            if (partialMethod) this.partialMethods.push(partialMethod);
        };
        this.object = obj;
        this.prototypeObject = prototypeObject;
        this.functionName = functionName;
    }
})

// DEPRICATED Syntactic Sugar: Layer in Class

/*
 * extend the subclassing behavior of Lively Kernel to allow fo Layer-In-Class constructs
 */
Object.extend(Function.prototype, {
    subclass: Object.subclass.wrap(function(proceed) {
        var args = $A(arguments);
        args.shift();
        var layeredMethods = [];

        for (var i=1; i < args.length; i++) {
            var methods = args[i];
            if (Object.isString(methods)) continue; // if it's a category
            Object.keys(methods).forEach(function(ea) {
                var m = ea.match(/([A-Za-z0-9]+)\$([A-Za-z0-9]*)/);
                if (m) {
                    var getter = methods.__lookupGetter__(m[0]);
                    var setter = methods.__lookupSetter__(m[0]);
                    layeredMethods.push({layerName: m[1], methodName: m[2], methodBody: methods[ea],
                        getterMethod: getter, setterMethod: setter});
                    delete methods[ea];
                };
            });
        };
        var klass =  proceed.apply(this, args);
        layeredMethods.forEach(function(ea){
            // log("layer property " + ea.methodName + " in " + ea.layerName);
            var layer = Global[ea.layerName];
            if (!layer) throw new Error("could not find layer: " + ea.layerName);
            if (ea.getterMethod || ea.setterMethod) {
                if (ea.getterMethod) {
                    cop.layerGetterMethod(layer, klass.prototype, ea.methodName, ea.getterMethod);
                };
                if (ea.setterMethod) {
                    cop.layerSetterMethod(layer, klass.prototype, ea.methodName, ea.setterMethod);
                };
                cop.makePropertyLayerAware(klass.prototype, ea.methodName);
            } else {
                // log("layer method " + ea.methodName + " in " + ea.layerName);
                cop.layerMethod(layer, klass.prototype, ea.methodName, ea.methodBody);
            }
        });
        return klass;
    })
});

cop.resetLayerStack();

if (cop.dynamicInlining)
    module('cop.Flatten').load(true);

});
