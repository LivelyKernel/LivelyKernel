module('lively.persistence.BuildSpec').requires("lively.morphic.Serialization").toRun(function() {

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
        if (sourceModule && sourceModule.name() !== Global) {
            spec.sourceModule = sourceModule.name();
        }
        morph.buildSpecProperties().forEach(function(key) {
            var attr = morph.buildSpecIncludeProperties[key] || {};
            if (!morph.hasOwnProperty(key) && !attr.getter) return;
            var value = morph[key];
            if (attr.getter) value = attr.getter(morph);
            if (attr.transform) value = attr.transform(morph, value);
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
        return spec;
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
        Object.keys(spec).withoutAll(['className', 'sourceModule', 'submorphs']).forEach(function(key) {
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
                                 "halos", "priorExtent", "distanceToDragEvent"],

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

    buildSpecIncludeProperties: {
        name: {},
        doNotSerialize: {},
        doNotCopyProperties: {},
        grabbingEnabled: {},
        droppingEnabled: {},
        halosEnabled: {},
        showsHalos: {},
        _ClipMode: {},
        _StyleSheet: {transform: function(morph, val) { return Object.isString(val) ? val : val.getText(); }},
        _StyleClassNames: {},
        _Position: {},
        _Extent: {getter: function(morph) { return morph.getExtent(); }},
        _Rotation: {},
        _Scale: {},
        itemList: {},
        grabbingEnabled: {},
        _FontSize: {},
        isActive: {},
        label: {},
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
        _WordBreak: {}
    },

    buildSpecProperties: function() {
        var scripts = Functions.own(this).select(function(sel) {
            return this[sel].hasLivelyClosure; }, this),
            ownProps = Properties.own(this)
                       .withoutAll(this.buildSpecExcludeProperties)
                       .reject(function(key) { return key.startsWith('$$'); });
        return [].concat(Object.keys(this.buildSpecIncludeProperties))
               .concat(ownProps)
               .concat(scripts);
    },

    buildSpec: function(builder) {
        builder = builder || new lively.persistence.SpecBuilder();
        return builder.build(this);
    },

    printBuildSpec: function() {
        return lively.persistence.SpecBuilder.stringify(this.buildSpec());
    }
});

Object.extend(lively.morphic.Morph, {
    fromSpec: function(spec) {
        return lively.persistence.MorphBuilder.specToMorph(spec);
    }
});

}) // end of module