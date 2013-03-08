module('lively.persistence.BuildSpec').requires("lively.morphic.Serialization", "lively.ide.CodeEditor").toRun(function() {

Object.subclass('lively.persistence.SpecBuilder',
'spec construction', {
    build: function(morph) {
        // iterates through properties of morph and creates a spec object for
        // recording the state of the morph. This spec object will not store an
        // arbitrary JS object representation as the
        // lively.persistence.Serializer does but a Morphic-specific
        // representation that captures only relevant Morph attributes. However,
        // this version tries to be as flexible as possible.
        // Note that certain attributes such as submorphs are handled
        // specifically with, other attributes such as functions and
        // serializeExpr are stored as they are, the rest is simply stringified
        // (plain toString, no deep graph traversal)
        var builder = this, spec = {};
        spec.className = morph.constructor.type;
        var sourceModule = morph.constructor.sourceModule;
        if (sourceModule && sourceModule !== Global && Object.isFunction(sourceModule.name)) {
            spec.sourceModule = sourceModule.name();
        }
        var includeProps = Object.mergePropertyInHierarchy(morph, "buildSpecIncludeProperties");
        morph.getBuildSpecProperties().forEach(function(key) {
            if (key === '_Fill') debugger
            var attr = includeProps[key] || {};
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
            spec[key] = value;
        });
        spec.submorphs = morph.submorphs.map(function(ea) { return ea.buildSpec(builder); });
        if (morph.attributeConnections) {
            spec.connectionRebuilder = this.generateConnectionRebuilder(morph, morph.attributeConnections);
        }
        return spec;
    },

    generateConnectionRebuilder: function(sourceObj, connections) {
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

});

Object.extend(lively.persistence.SpecBuilder, {
    stringify: function(spec) {
        return Objects.inspect(spec, {printFunctionSource: true});
    }
});

Object.subclass('lively.persistence.MorphBuilder',
'properties', {
    isInstanceRestorer: true // so the class knows not ot initialize anything
},
'building', {
    createMorph: function(spec, options, depth) {
        // Creates a new morph and iterates through properties of spec. The
        // properties are added to the morph. Certain "special" properties such
        // as the connections, submorphs, etc. are handled specifically
        options = options || {connectionRebuilders: []};
        depth = depth || 0;
        var klass = Class.forName(spec.className);
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
        var specialAttributes = Object.mergePropertyInHierarchy(instance, "buildSpecIncludeProperties");
        Object.keys(spec).withoutAll(['className', 'sourceModule', 'submorphs', 'connectionRebuilder']).forEach(function(key) {
            if (specialAttributes[key] && specialAttributes[key].recreate) {
                instance[key] = specialAttributes[key].recreate(instance, spec);
                return;
            }
            var specVal = spec[key];
            if (!key.startsWith('_')) {
                instance[key] = specVal;
                return;
            }
            var setter = instance['set' + key.replace(/^_/, '').capitalize()];
            if (Object.isFunction(setter)) {
                setter.call(instance, specVal);
            }
        });
        if (spec.submorphs) {
            spec.submorphs.forEach(function(ea) {
                var submorph = this.createMorph(ea, options, depth + 1);
                if (submorph) instance.addMorph(submorph);
            }, this);
        }
        if (spec.connectionRebuilder) {
            options.connectionRebuilders.push(function() { spec.connectionRebuilder.call(instance); });
        }
        // Defer reinitialization of connections until morph hierarchy is
        // rebuild. This allows to use morphic name lookup for finding
        // references of connections
        if (depth === 0) {
            options.connectionRebuilders.invoke('call', null);
            instance.withAllSubmorphsDo(function(ea) { ea.onBuildSpecDone(); });
        }
        return instance;
    }
});

Object.extend(lively.persistence.MorphBuilder, {
    specToMorph: function(spec) {
        return new this().createMorph(spec);
    }
});

lively.morphic.Morph.addMethods(
'UI builder', {

    buildSpecExcludeProperties: ["submorphs", "scripts", "id", "shape",
                                 "registeredForMouseEvents", "partsBinMetaInfo",
                                 "eventHandler", "derivationIds", "partTests",
                                 "moved", "_renderContext", "_isRendered",
                                 "owner", "cachedBounds", "isBeingDragged",
                                 "halos", "priorExtent", "distanceToDragEvent",
                                 "prevScroll", "_PreviousBorderWidth",
                                 "attributeConnections"],

    //morphProps = ["name",
    //              "doNotSerialize", "doNotCopyProperties",
    //              "grabbingEnabled", "droppingEnabled", "halosEnabled", "showsHalos",
    //              "_ClipMode",
    //              "_StyleSheet", "_StyleClassNames",
    //              "_Position", "_Extent", "_Rotation", "_Scale",
    //              // list:
    //              "itemList", "grabbingEnabled", "_FontSize",
    //              // button
    //              "isActive", "label",
    //              // text
    //              "fixedWidth", "fixedHeight", "allowsInput", "_FontFamily", "_MaxTextWidth",
    //              "_MaxTextHeight", "textColor",  "_FontSize", "_Padding", "_WhiteSpaceHandling",
    //              "_MinTextWidth", "_MinTextHeight", "_WordBreak"]
    //
    //'{\n' + morphProps.map(function(ea) { return ea + ': {}'}).join(',\n') + '}'

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

    buildSpec: function(builder) {
        builder = builder || new lively.persistence.SpecBuilder();
        return builder.build(this);
    },

    printBuildSpec: function() {
        return lively.persistence.SpecBuilder.stringify(this.buildSpec());
    },

    onBuildSpecDone: Functions.Null
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
    fromSpec: function(spec) {
        return lively.persistence.MorphBuilder.specToMorph(spec);
    },

    fromSpecString: function(string) {
        var spec;
        try { spec = eval('(' + string + ')'); } catch(e) { return e; }
        return this.fromSpec(spec);
    }
});

}) // end of moduled of module
