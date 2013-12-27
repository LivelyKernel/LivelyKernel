module('lively.persistence.BuildSpec').requires("lively.morphic.Widgets", "lively.morphic.Serialization", "lively.morphic.AdditionalMorphs", "lively.morphic.Lists").toRun(function() {

Object.subclass('lively.persistence.SpecObject',
'properties', {
    isSpecObject: true,
    isInstanceRestorer: true // so the class knows not to initialize anything
},
'initializing', {

    initialize: function() {
        this.attributeStore = {};
    },

    fromMorph: function(morph) {
        // iterates through properties of morph and creates a JS object for
        // recording the state of the morph. This JS object will not store an
        // arbitrary JS object representation as the
        // lively.persistence.Serializer does but a Morphic-specific
        // representation that captures only relevant Morph attributes. However,
        // this version tries to be as flexible as possible.
        // Note that certain attributes such as submorphs are handled
        // specifically with, other attributes such as functions and
        // serializeExpr are stored as they are, the rest is simply stringified
        // (plain toString, no deep graph traversal)
        this.setClass(morph.constructor);
        var props = Object.mergePropertyInHierarchy(morph, "buildSpecProperties");
        morph.getBuildSpecProperties(props).forEach(function(key) {
            var attr = props[key] || {};
            if (!morph.hasOwnProperty(key) && !attr.getter) return;
            var value = morph[key];
            if (attr.getter) value = attr.getter(morph, value);
            // don't record values that are the same as their default
            if (attr.hasOwnProperty("defaultValue") && Objects.equal(attr.defaultValue, value)) { return; }
            if (Object.isFunction(value)) {
                // pass
            } else if (value && Object.isFunction(value.serializeExpr)) {
                // pass
            } else if (value && value.isMorph) {
                var morphRef = {isMorphRef: true};
                if (value.name) {
                    morphRef.name = value.name;
                    value = morphRef;
                } else if (morph.submorphs.include(value)) {
                    var idx = morph.submorphs.indexOf(value);
                    morphRef.path = 'submorphs.' + idx;
                    value = morphRef;
                } else {
                    console.warn('Cannot add morph ' + key + ' to buildspec');
                    return;
                }
            } else {
                try { JSON.stringify(value); } catch(e) { value = Strings.print(value); }
            }
            this.set(key, value);
        }, this);
        this.setSubmorphs(morph, props);
        this.setConnections(morph);
        if (morph.onBuildSpecCreated) morph.onBuildSpecCreated(this.attributeStore);
        return this;
    },

    fromPlainObject: function(object) {
        var spec = this.attributeStore = Object.extend({}, object);
        if (spec.submorphs) {
            spec.submorphs = spec.submorphs.map(function(ea) {
                return ea.isSpecObject ? ea : lively.persistence.SpecObject.fromPlainObject(ea); });
        }
        return this;
    },

    customize: function(spec) {
        var newStore = {}
        Object.extend(newStore, this.attributeStore);
        Object.extend(newStore, spec);
        return this.constructor.fromPlainObject(newStore);
    },

    fromString: function(string) {
        try {
            return this.fromPlainObject(eval('(' + string + ')'));
        } catch(e) { return e; }
    }

},
'accessing', {
    setClass: function(klass) {
        // records class of object and its sourceModule name
        this.attributeStore.className = klass.type || klass.name;
        var sourceModule = klass.sourceModule;
        if (sourceModule && sourceModule !== Global && Object.isFunction(sourceModule.name)) {
            this.attributeStore.sourceModule = sourceModule.name();
        }
    },

    setSubmorphs: function(morph, properties) {
        var submorphs = morph.submorphs;
        if (properties.submorphs && properties.submorphs.filter) {
            submorphs = properties.submorphs.filter(morph, submorphs);
        }
        submorphs.length && this.set("submorphs", submorphs.invoke("buildSpec"));
    },

    setConnections: function(sourceObj) {
        if (!sourceObj.attributeConnections || sourceObj.attributeConnections.length === 0) return;
        var rebuilderFunc = this.generateConnectionsRebuilder(sourceObj, sourceObj.attributeConnections);
        this.set("connectionRebuilder", rebuilderFunc);
    },

    set: function(key, value) {
        if (value === undefined) delete this.attributeStore[key];
        else this.attributeStore[key] = value;
    }
},
'connections', {
    generateConnectionsRebuilder: function(sourceObj, connections) {
        var template = '(function connectionRebuilder() {\n    %SOURCE%\n})';
        function generateFailFunction(err) {
            var errStr = Strings.print(err).replace(/\n/g, '\n    //');
            return eval(template.replace('%SOURCE', "// failed with:\n" + errStr));
        }
        function generateGetObjectCode(obj) {
            if (!obj) return null;
            // 1) this
            if (sourceObj === obj) return 'this';
            // 2) lookup by name
            if (obj.name) return 'this.get("' + obj.name +'")';
            // 3) lookup owner chain
            var ownerIdx = sourceObj.ownerChain().indexOf(obj);
            if (ownerIdx > -1) return 'this' + '.owner'.times(ownerIdx+1);
            // fail
            return null;
        }
        var sourceGetterCode = generateGetObjectCode(sourceObj);
        if (!sourceGetterCode) {
            return generateFailFunction('cannot access sourceObj ' + sourceObj);
        }
        var code = connections.map(function(c) {
            var targetObject = c.getTargetObj(),
                targetGetterCode = generateGetObjectCode(targetObject);
            if (!targetGetterCode) {
                return '// failed to generate rebuild code for ' + String(c);
            }
            var optConfig = [];
            if (c.converterString) { optConfig.push("converter: \n" + c.converterString); }
        	if (c.updaterString) { optConfig.push("updater: \n" + c.updaterString);}
        	return Strings.format('lively.bindings.connect(%s, "%s", %s, "%s", {%s});',
        			              sourceGetterCode,
        			              c.getSourceAttrName(),
        			              targetGetterCode,
        			              c.getTargetMethodName(),
        			              optConfig.join(','));
        }).join("\n    ");
        try { return eval(template.replace(/%SOURCE%/, code)); } catch(e) {
            return generateFailFunction(e);
        }
    }

},
'morphic', {

    createMorph: function(options, depth) {
        // Creates a new morph and iterates through properties of spec. The
        // properties are added to the morph. Certain "special" properties such
        // as the connections, submorphs, etc. are handled specifically
        var object = this.attributeStore;
        options = options || {connectionRebuilders: [], morphRefRebuilders: []};
        depth = depth || 0;

        var sourceMod = object.sourceModule && lively.module(object.sourceModule);
        if (sourceMod && !sourceMod.isLoaded()) sourceMod.load(true);

        // helper for assigning retrieving attribute values of instance
        function set(key, val, buildSpecAttr) {
            // buildSpec #recreate
            if (buildSpecAttr && buildSpecAttr.recreate) {
                buildSpecAttr.recreate(instance, object, key, val); return; }
            // scripts
            if (Object.isFunction(val) && val.name) { instance.addScript(val, key); return; }
            // morphRef
            if (val && val.isMorphRef) {
                val.name && options.morphRefRebuilders.push(function() {
                    instance[key] = instance.get(val.name); });
                val.path && options.morphRefRebuilders.push(function() {
                    instance[key] = lively.PropertyPath(val.path).get(instance); });
                return;
            }
            if (!key.startsWith('_')) {
                // This is a bit of test balloon I'm sending up to see if something breaks.
                // This does fix the issue with multiple inspectors's divider affecting each other.
                instance[key] = (val && Array.isArray(val)) ? val.clone() : val
                return;
            }
            // normal attributes
            var setter = instance['set' + key.replace(/^_/, '').capitalize()];
            // _Attributes
            if (Object.isFunction(setter)) { setter.call(instance, val); }
        }

        // create new morph instance and initialize
        var klass = lively.lookup(object.className);
        if (!klass || !Object.isFunction(klass)) return null;
        var instance = new klass(this);

        // buildSpecProperties on object level need to be at instance before
        // other attributes are assigned
        if (object.buildSpecProperties) { instance.buildSpecProperties = object.buildSpecProperties; }

        // object specific buildspec settings:
        var buildSpecProps = Object.mergePropertyInHierarchy(instance, "buildSpecProperties");

        // watchers for debugging
        var watchers = Object.keys(buildSpecProps).select(function(key) { return buildSpecProps[key] && buildSpecProps[key].hasOwnProperty('watch'); });
        watchers.forEach(function(key) {
            var watchSpec = buildSpecProps[key].watch;
            lively.PropertyPath(key).watch(Object.extend(watchSpec, {target: instance}));
        });

        // initialize morph
        if (instance.isMorph) {
            instance.submorphs = [];
            instance.scripts = [];
            instance.shape = instance.defaultShape();
            instance.prepareForNewRenderContext(instance.defaultRenderContext());
            instance.setNewId();
            instance.applyStyle(instance.getStyle());
        }

        // add properties we have in buildSpec
        var recordedKeys = Object.keys(object).withoutAll(['className', 'sourceModule', 'submorphs', 'connectionRebuilder', 'buildSpecProperties']);
        recordedKeys.forEach(function(key) { set(key, object[key], buildSpecProps[key]); });

        // add default values
        var defaults = Object.keys(buildSpecProps).select(function(key) { return buildSpecProps[key].hasOwnProperty('defaultValue'); });
        defaults.withoutAll(recordedKeys).forEach(function(key) {
            set(key, buildSpecProps[key].defaultValue, buildSpecProps[key]);
        });

        // add submorphs
        if (object.submorphs) {
            object.submorphs.forEach(function(ea, i) {
                var submorph = ea.createMorph(options, depth + 1);
                if (submorph) instance.addMorph(submorph);
            });
        }

        if (instance.hasOwnProperty("style")) instance.applyStyle(instance.style);

        // add connections
        if (object.connectionRebuilder) {
            options.connectionRebuilders.push(function() { object.connectionRebuilder.call(instance); });
        }
        // Defer reinitialization of connections until morph hierarchy is
        // rebuild. This allows to use morphic name lookup for finding
        // references of connections
        if (depth === 0) {
            options.connectionRebuilders.invoke('call', null);
            options.morphRefRebuilders.invoke('call', null);
            instance.withAllSubmorphsDo(function(ea) { ea.onFromBuildSpecCreated(); });
        }

        return instance;
    }

},
'removal', {
    remove: function() {
        lively.persistence.BuildSpec.Registry.remove(this);
    }
},
'stringification', {

    stringify: function() {
        return Objects.inspect(this.attributeStore, {printFunctionSource: true, indent: '    '});
    },

    serializeExpr: function() {
        var isTopLevel = !lively.persistence.BuildSpec.inRecursivePrint;
        lively.persistence.BuildSpec.inRecursivePrint = true;
        try {
            var string = this.stringify();
            if (!isTopLevel) return string.split('\n').join('\n    ');
            var name = lively.persistence.BuildSpec.Registry.nameForSpec(this);
            if (name) string = '"' + name + '", ' + string;
            return "lively.BuildSpec(" + string + ')';
        } finally {
            if (isTopLevel) delete lively.persistence.BuildSpec.inRecursivePrint;
        }
    },

    toString: function() {
        return this.serializeExpr();
    }

});

Object.extend(lively.persistence.SpecObject, {
    fromMorph: function(morph) { return new this().fromMorph(morph); },
    fromPlainObject: function(object) { return new this().fromPlainObject(object); },
    fromString: function(string) { return new this().fromString(string); }
});

Object.subclass('lively.persistence.SpecObjectRegistry',
'accessing', {
    get: function(name) { return this[name]; },
    set: function(name, spec) { return this[name] = spec; },
    nameForSpec: function(spec) {
        return Properties.nameFor(this, spec);
    },
    remove: function(spec) {
        var name = this.nameForSpec(spec);
        if (name) delete this[name];
    }
},
'testing', {
    has: function(name) { return !!this.get(name); }
});

Object.extend(lively, {
    BuildSpec: function(/*[name], specObj*/) {
        // name is optional for registering the specObj
        // specObj can be a plain JS object or an instance of SpecObject
        var name = Object.isString(arguments[0]) && arguments[0],
            specObj = name ? arguments[1] : arguments[0],
            registry = lively.persistence.BuildSpec.Registry;
        // just lookup
        if (name && !specObj) return registry.get(name);
        specObj = !specObj ?
            new lively.persistence.SpecObject() :
            (specObj.isSpecObject ? specObj : lively.persistence.SpecObject.fromPlainObject(specObj));
        return name ? registry.set(name, specObj) : specObj;
    }
});

Object.extend(lively.persistence.BuildSpec, {
    Registry: new lively.persistence.SpecObjectRegistry()
});


(function loadBuildSpecMorphExtensions() {
    module('lively.persistence.BuildSpecMorphExtensions').load();
})();

}) // end of moduled of module
