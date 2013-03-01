module('lively.persistence.BuildSpec').requires("lively.morphic.Serialization").toRun(function() {

Object.subclass('lively.persistence.MorphSpecBuilder',
'properties', {
    isInstanceRestorer: true, // so the class knows not ot initialize anything
    ignorePropList: ["submorphs", "scripts", "id", "shape", "registeredForMouseEvents", "partsBinMetaInfo", "eventHandler", "derivationIds", "partTests", "moved", "_renderContext", "_isRendered", "owner", "cachedBounds", "isBeingDragged", "halos", "priorExtent", "distanceToDragEvent"],

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

    morphProps: {
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
    }

},
'spec construction', {
    build: function(morph, depth) {        
        depth = depth || 0;
        var spec = {};
        spec.className = morph.constructor.type;
        var sourceModule = morph.constructor.sourceModule;
        if (sourceModule && sourceModule.name() !== Global) {
            spec.sourceModule = sourceModule.name();
        }
        var scripts = Functions.own(morph).select(function(sel) {
            return morph[sel].hasLivelyClosure; }),
            propsForSpec = [].concat(Object.keys(this.morphProps))
                .concat(Properties.own(morph).withoutAll(this.ignorePropList))
                .concat(scripts);
        propsForSpec.forEach(function(key) {
            var attr = this.morphProps[key] || {};
            if (!morph.hasOwnProperty(key) && !attr.getter) return;
            value = morph[key];
            if (attr.getter) value = attr.getter(morph);
            if (attr.transform) value = attr.transform(morph, value);
            if (Object.isFunction(value)) {
                value = '<function>' + value.toString();
            } else if (value && Object.isFunction(value.serializeExpr)) {
                value = '<eval>' + value.serializeExpr();
            } else {
                try { JSON.stringify(value); } catch(e) { value = Strings.print(value); }
            }
            spec[key] = value;
        }, this);
        spec.submorphs = morph.submorphs.map(function(ea) {
            return this.build(ea, depth + 1); }, this);
        return spec;
    },
    
    createMorph: function(spec) {
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
            if (typeof specVal === 'string') {
                if (specVal.startsWith('<eval>')) {
                    try {
                        specVal = Global.eval(specVal.replace(/^<eval>/, ''));
                    } catch(e) { specVal = String(e); }
                } else if (specVal.startsWith('<function>')) {
                    try {
                        var func = Global.eval('(' + specVal.replace(/^<function>/, '') + ')');
                        instance.addScript(func);
                        return;
                    } catch(e) { specVal = String(e); }
                }
            }
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

Object.extend(lively.persistence.MorphSpecBuilder, {
    morphToSpec: function(morph) {
        return new this().build(morph);
    },
    
    specToMorph: function(spec) {
        return new this().createMorph(spec);
    }
});

lively.morphic.Morph.addMethods(
'UI builder', {
    buildSpec: function() {
        return lively.persistence.MorphSpecBuilder.morphToSpec(this);
    }
});

Object.extend(lively.morphic.Morph, {
    fromSpec: function(spec) {
        return lively.persistence.MorphSpecBuilder.specToMorph(spec);
    }
});

}) // end of module