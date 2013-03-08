module('lively.persistence.BuildSpec').requires("lively.morphic.Serialization", "lively.ide.CodeEditor").toRun(function() {

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
        morph.getBuildSpecProperties().forEach(function(key) {
            var attr = props[key] || {};
            if (!morph.hasOwnProperty(key) && !attr.getter) return;
            var value = morph[key];
            if (attr.getter) value = attr.getter(morph, value);
            if (Object.isFunction(value)) {
                // pass
            } else if (value && Object.isFunction(value.serializeExpr)) {
                // pass
            } else {
                try { JSON.stringify(value); } catch(e) { value = Strings.print(value); }
            }
            this.set(key, value);
        }, this);
        this.setSubmorphs(morph);
        this.setConnections(morph);
        return this;
    },

    fromPlainObject: function(object) {
        var spec = this.attributeStore = Object.extend({}, object);
        if (spec.submorphs) {
            spec.submorphs = spec.submorphs.map(function(ea) {
                return lively.persistence.SpecObject.fromPlainObject(ea); });
        }
        return this;
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

    setSubmorphs: function(morph) {
        this.set("submorphs", morph.submorphs.invoke("buildSpec"));
    },

    setConnections: function(sourceObj) {
        if (!sourceObj.attributeConnections) return;
        var rebuilderFunc = this.generateConnectionsRebuilder(sourceObj, sourceObj.attributeConnections);
        this.set("connectionRebuilder", rebuilderFunc);
    },

    set: function(key, value) {
        this.attributeStore[key] = value;
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
        options = options || {connectionRebuilders: []};
        depth = depth || 0;
        var klass = Class.forName(object.className);
        if (!klass || !Object.isFunction(klass)) return null;
        var instance = new klass(this);
        if (instance.isMorph) {
            instance.submorphs = [];
            instance.scripts = [];
            instance.shape = instance.defaultShape();
            instance.prepareForNewRenderContext(instance.defaultRenderContext());
            instance.setNewId();
            instance.applyStyle(instance.getStyle());
        }
        var specialAttributes = Object.mergePropertyInHierarchy(instance, "buildSpecProperties");
        Object.keys(object).withoutAll(['className', 'sourceModule', 'submorphs', 'connectionRebuilder']).forEach(function(key) {
            if (specialAttributes[key] && specialAttributes[key].recreate) {
                instance[key] = specialAttributes[key].recreate(instance, object);
                return;
            }
            var specVal = object[key];
            if (!key.startsWith('_')) {
                instance[key] = specVal;
                return;
            }
            var setter = instance['set' + key.replace(/^_/, '').capitalize()];
            if (Object.isFunction(setter)) {
                setter.call(instance, specVal);
            }
        });
        if (object.submorphs) {
            object.submorphs.forEach(function(ea, i) {
                var submorph = ea.createMorph(options, depth + 1);
                if (submorph) instance.addMorph(submorph);
            });
        }
        if (object.connectionRebuilder) {
            options.connectionRebuilders.push(function() { object.connectionRebuilder.call(instance); });
        }
        // Defer reinitialization of connections until morph hierarchy is
        // rebuild. This allows to use morphic name lookup for finding
        // references of connections
        if (depth === 0) {
            options.connectionRebuilders.invoke('call', null);
            instance.withAllSubmorphsDo(function(ea) { ea.onFromBuildSpecCreated(); });
        }
        return instance;
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

lively.morphic.Morph.addMethods(
'UI builder', {

    buildSpecProperties: {
        name: {},
        doNotSerialize: {getter: function(morph, val) { return val && val.reject(function(ea) { return !Object.isString(ea) || ea.startsWith('$$'); }) }},
        doNotCopyProperties: {getter: function(morph, val) { return val && val.reject(function(ea) { return !Object.isString(ea) || ea.startsWith('$$'); }) }},
        grabbingEnabled: {},
        droppingEnabled: {},
        halosEnabled: {},
        showsHalos: {},
        _ClipMode: {},
        _StyleSheet: {getter: function(morph, val) { return !val || Object.isString(val) ? val : val.getText(); }},
        _StyleClassNames: {},
        _Position: {},
        _Extent: {getter: function(morph) { return morph.getExtent(); }},
        _Fill: {getter: function(morph) { return morph.getFill(); }},
        _BorderColor: {getter: function(morph) { return morph.getBorderColor(); }},
        _BorderWidth: {getter: function(morph) { return morph.getBorderWidth(); }},
        _BorderStyle: {getter: function(morph) { return morph.getBorderStyle(); }},
        _Rotation: {},
        _Scale: {},
        // excludes:
        submorphs: {exclude: true},
        scripts: {exclude: true},
        id: {exclude: true},
        shape: {exclude: true},
        registeredForMouseEvents: {exclude: true},
        partsBinMetaInfo: {exclude: true},
        eventHandler: {exclude: true},
        derivationIds: {exclude: true},
        partTests: {exclude: true},
        moved: {exclude: true},
        _renderContext: {exclude: true},
        _isRendered: {exclude: true},
        owner: {exclude: true},
        cachedBounds: {exclude: true},
        isBeingDragged: {exclude: true},
        halos: {exclude: true},
        priorExtent: {exclude: true},
        distanceToDragEvent: {exclude: true},
        prevScroll: {exclude: true},
        _PreviousBorderWidth: {exclude: true},
        attributeConnections: {exclude: true}
    },

    getBuildSpecProperties: function() {
        var rawProps = Object.mergePropertyInHierarchy(this, "buildSpecProperties"),
            props = Object.keys(rawProps).groupBy(function(key) {
                return rawProps[key].exclude ? 'excludes' : 'includes'; }),
            scripts = Functions.own(this).select(function(sel) {
                return this[sel].hasLivelyClosure; }, this),
            ownProps = Properties.own(this)
                       .withoutAll(props.excludes)
                       .reject(function(key) { return key.startsWith('$$'); });
        return props.includes.concat(ownProps).concat(scripts).uniq();
    },

    buildSpec: function() {
        return lively.persistence.SpecObject.fromMorph(this);
    },

    onFromBuildSpecCreated: Functions.Null
});

lively.morphic.List.addMethods(
'UI builder', {
    buildSpecProperties: {
        itemList: {},
        _FontSize: {},
        changeTriggered: {exlude: true}
    }
});

lively.morphic.Text.addMethods(
'UI builder', {

    buildSpecProperties: {
        _FontSize: {},
        fixedWidth: {},
        fixedHeight: {},
        allowsInput: {},
        _FontFamily: {},
        _MaxTextWidth: {},
        _MaxTextHeight: {},
        textColor: {},
        _FontSize: {},
        _Padding: {},
        _WhiteSpaceHandling: {},
        _MinTextWidth: {},
        _MinTextHeight: {},
        _WordBreak: {},
        // excludes:
        cachedTextString: {exclude: true},
        savedTextString: {exclude: true},
        charsReplaced: {exclude: true},
        charsTyped: {exclude: true},
        lastFindLoc: {exclude: true},
        parseErrors: {exclude: true},
        textChunks: {exclude: true},
        priorSelectionRange: {exclude: true},
        undoSelectionRange: {exclude: true}
    }

});

lively.morphic.CodeEditor.addMethods(
'UI builder', {
    buildSpecProperties: {
        textString: {getter: function(morph) { return morph.textString }},
        theme: {
            getter: function(morph) { return morph.getTheme(); },
            recreate: function(morph, spec) { morph.setTheme(spec.theme); }
        },
        textMode: {
            getter: function(morph) { return morph.getTextMode(); },
            recreate: function(morph, spec) { morph.setTextMode(spec.textMode); }
        },
        // excludes
        _isFocused: {exclude: true},
        savedTextString: {exclude: true},
        aceEditor: {exclude: true}
    }
});

lively.morphic.Button.addMethods(
'UI builder', {
    buildSpecProperties: {
        isActive: {},
        label: {
            getter: function(morph, val) { return val.textString || ''; },
            recreate: function(instance, spec) { return instance.ensureLabel(spec.label); }
        }
    }
});

Object.extend(lively.morphic.Morph, {
    fromSpec: function(object) {
        return lively.persistence.SpecObject.fromPlainObject(object).createMorph();
    },

    fromSpecString: function(string) {
        return lively.persistence.SpecObject.fromString(object).createMorph();
    }
});

}) // end of moduled of module
