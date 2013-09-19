module('lively.persistence.BuildSpec').requires("lively.morphic.Widgets", "lively.morphic.Serialization", "lively.morphic.AdditionalMorphs").toRun(function() {

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
        return this.fromPlainObject(Object.extend(Object.extend({}, this.attributeStore), spec));
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
        this.set("submorphs", submorphs.invoke("buildSpec"));
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
        var watchers = Object.keys(buildSpecProps).select(function(key) { return buildSpecProps[key] && buildSpecProps[key].watch; });
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
        grabbingEnabled: {defaultValue: undefined},
        draggingEnabled: {defaultValue: undefined},
        droppingEnabled: {defaultValue: undefined},
        halosEnabled: {defaultValue: true},
        _ClipMode: {defaultValue: 'visible'},
        _StyleSheet: {getter: function(morph, val) { return !val || Object.isString(val) ? val : val.getText(); }},
        _StyleClassNames: {},
        _Position: {defaultValue: lively.pt(0.0,0.0)},
        _Extent: {getter: function(morph) { return morph.getExtent(); }},
        _Fill: {defaultValue: null, getter: function(morph) { return morph.getFill(); }},
        _BorderColor: {defaultValue: Color.rgb(0,0,0), getter: function(morph) { return morph.getBorderColor(); }},
        _BorderWidth: {defaultValue: 0, getter: function(morph) { return morph.getBorderWidth(); }},
        _BorderStyle: {defaultValue: 'solid', getter: function(morph) { return morph.getBorderStyle(); }},
        _BorderRadius: {defaultValue: 0, getter: function(morph) { return morph.getBorderRadius(); }},
        _Opacity: {defaultValue: 1, getter: function(morph) { return morph.getOpacity(); }},
        _Rotation: {defaultValue: 0},
        _Scale: {defaultValue: 1},
        // excludes:
        submorphs: {exclude: true},
        showsHalos: {exclude: true},
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
        attributeConnections: {exclude: true},
        isLockOwner: {exclude: true},
        isInLayoutCycle: {exclude: true},
        modalMorph: {exclude: true},
        currentMenu: {exclude: true},
        layout: {
            defaultValue: {},
            getter: function(morph, val) {
                // FIXME this code should go into the layouter!
                var result = {};
                if (!val) return result;
                if (Object.isString(val)) { return val; }
                    Properties.forEachOwn(val, function(name, prop) {
                    if (name === "layouter" && prop.constructor) {
                        result.type = prop.constructor.type;
                        result.borderSize = prop.borderSize;
                        result.spacing = prop.spacing;
                        return;
                    }
                    result[name] = prop;
                });
                return result;
            },
            recreate: function(instance, spec) {
                var layout = instance.layout = {};
                if (!spec.layout) return;
                var layouterKlassName = Object.isString(spec.layout) ? spec.layout : spec.layout.type;
                if (layouterKlassName) {
                    var layouterKlass = lively.lookup(layouterKlassName);
                    layout.layouter = new layouterKlass();
                    layout.layouter.spacing = spec.layout.spacing;
                    layout.layouter.borderSize = spec.layout.borderSize;
                }
                var excludes = ['type', 'borderSize', 'spacing']
                Properties.forEachOwn(spec.layout, function(name, prop) {
                    if (!excludes.include(name)) layout[name] = prop; });
            }
        }
    },

    getBuildSpecProperties: function(rawProps) {
        rawProps = rawProps || Object.mergePropertyInHierarchy(this, "buildSpecProperties");
        var props = Object.keys(rawProps).groupBy(function(key) {
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
        changeTriggered: {exclude: true}
    }
});

lively.morphic.MorphList.addMethods(
'UI builder', {
    buildSpecProperties: {
        itemList: {}
    }
});

lively.morphic.Text.addMethods(
'UI builder', {

    buildSpecProperties: {
        textString: {
            defaultValue: '',
            getter: function(morph, val) { return val || '' },
            recreate: function(instance, spec) {
                instance.textString = spec.textString;
                // important: emphasis after textString!
                if (spec.emphasis) instance.emphasizeRanges(spec.emphasis);
            }
        },
        emphasis: {
            getter: function(morph, val) {
                var styles = morph.getChunkStyles(),
                    ranges = morph.getChunkRanges();
                return ranges.collect(function(range, i) {
                        return [range[0], range[1], styles[i].asSpec()]; });
            },
            recreate: function(instance, spec) { /*see textString*/ }
        },
        isLabel: {defaultValue: false, recreate: function(instance, spec) { if (spec.isLabel) instance.beLabel(); }},
        _FontSize: {defaultValue: 10},
        fixedWidth: {defaultValue: false},
        fixedHeight: {defaultValue: false},
        allowsInput: {defaultValue: true},
        _FontFamily: {defaultValue: 'Arial'},
        _MaxTextWidth: {defaultValue: null},
        _MaxTextHeight: {defaultValue: null},
        textColor: {defaultValue: Color.rgb(0,0,0)},
        _Padding: {defaultValue: lively.Rectangle.inset(0)},
        _WhiteSpaceHandling: {defaultValue: "pre-wrap"},
        _MinTextWidth: {defaultValue: null},
        _MinTextHeight: {defaultValue: null},
        _WordBreak: {defaultValue: 'normal'},
        // excludes:
        cachedTextString: {exclude: true},
        savedTextString: {exclude: true},
        charsReplaced: {exclude: true},
        charsTyped: {exclude: true},
        lastFindLoc: {exclude: true},
        parseErrors: {exclude: true},
        textChunks: {exclude: true},
        priorSelectionRange: {exclude: true},
        previousSelection: {exclude: true},
        undoSelectionRange: {exclude: true}
    }

});

(function setupCodeEditor() {
    require('lively.ide.CodeEditor').toRun(function() {
        lively.morphic.CodeEditor.addMethods(
            'UI builder', {
                buildSpecProperties: {
                    textString: {defaultValue: '', getter: function(morph) { return morph.textString }},
                    theme: {
                        defaultValue: 'chrome',
                        getter: function(morph) { return morph.getTheme(); },
                        recreate: function(morph, spec) { morph.setTheme(spec.theme); }
                    },
                    textMode: {
                        defaultValue: 'text',
                        getter: function(morph) { return morph.getTextMode(); },
                        recreate: function(morph, spec) { morph.setTextMode(spec.textMode); }
                    },
                    // excludes
                    _isFocused: {exclude: true},
                    savedTextString: {exclude: true},
                    aceEditor: {exclude: true}
                }
            });
    });
})();

lively.morphic.Button.addMethods(
'UI builder', {
    buildSpecProperties: {
        submorphs: {
            exclude: true,
            filter: function(morph, submorphs) { return submorphs.without(morph.label); }
        },
        isActive: {defaultValue: true},
        label: {
            defaultValue: '',
            getter: function(morph, val) { return val.textString || ''; },
            recreate: function(instance, spec) { instance.ensureLabel(spec.label); }
        },
        style: {defaultValue: lively.morphic.Button.prototype.style}
    }
});

lively.morphic.Window.addMethods(
'UI builder', {
    buildSpecProperties: {
        submorphs: {
            exclude: true,
            filter: function(morph, submorphs) {
                var handles = [morph.reframeHandle, morph.bottomReframeHandle, morph.rightReframeHandle];
                return submorphs.withoutAll(handles).without(morph.titleBar);
            }
        },
        titleBar: {
            getter: function(morph, val) { return val ? val.getTitle() : ''; },
            recreate: function(instance, spec) { instance.titleBar = instance.makeTitleBar(spec.titleBar, instance.getExtent().x); }
        },
        grabbingEnabled: {defaultValue: false},
        reframeHandle: {exclude: true},
        bottomReframeHandle: {exclude: true},
        rightReframeHandle: {exclude: true},
        targetMorph: {exclude: true}
    },

    onFromBuildSpecCreated: function($super) {
        $super();
        this.makeReframeHandles();
        this.addMorph(this.titleBar);
        this.targetMorph = this.submorphs[0];
    }

});

lively.morphic.List.addMethods(
'buildspec', {
    onFromBuildSpecCreated: function() {
        this.setList(this.itemList || []);
    }
});

lively.morphic.MorphList.addMethods(
'buildspec', {
    onFromBuildSpecCreated: function() {
        this.setList(this.itemList || []);
    }
});

lively.morphic.Tree.addMethods(
'buildSpec', {
    buildSpecProperties: {
        childNodes: {exclude: true},
        icon: {exclude: true},
        isInLayoutCycle: false,
        item: {exclude: true},
        label: {exclude: true},
        node: {exclude: true}
    },

    onBuildSpecCreated: function(buildSpec) {
        if (this.item && Object.isFunction(this.item.serializeExpr)) {
            buildSpec.item = item;
        }
    },

    onFromBuildSpecCreated: function() {
        this.initializeLayout();
        this.disableDragging();
        this.setItem(this.item || {name: "tree with no item"});
    }
});
lively.morphic.Image.addMethods(
'buildSpec', {
    buildSpecProperties: {
        url: {getter: function(morph) { return morph.getImageURL(); }},
        useNativeExtent: {defaultValue: false}
    },

    onFromBuildSpecCreated: function() {
        this.setImageURL(this.url, this.useNativeExtent);
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

lively.morphic.TabBar.addMethods(
'UI builder', {
    buildSpecProperties: {
        tabContainer: {exclude: true},
        tabs: {exclude: true}
    },
    onFromBuildSpecCreated: function($super) {
        $super();
        this.tabContainer = this.owner;
        this.tabs = this.submorphs.clone();
    }
});
lively.morphic.TabContainer.addMethods(
'UI builder', {
    buildSpecProperties: {
        tabBarStrategy: {
            getter: function(morph, val) { return morph.tabBarStrategy.constructor.type; },
            recreate: function(instance, spec) { instance.tabBarStrategy = new (lively.lookup(spec.tabBarStrategy))(); }
        }
    },
    onFromBuildSpecCreated: function($super) {
        $super();
        this.tabBar = this.submorphs.detect(function(ea) { return ea.isTabBar; });
    }
});
lively.morphic.Tab.addMethods(
'UI builder', {
    buildSpecProperties: {
        label: {
            defaultValue: '',
            getter: function(morph, val) { return val.textString || ''; },
            exclude: true
        },
        pane: { // index of the pane in tabContainer.submorphs
            defaultValue: -1,
            getter: function(morph, val) { 
                return morph.tabContainer.submorphs.indexOf(val); }
        },
        tabBar: {exclude: true},
        tabContainer: {exclude: true}
    },
    onFromBuildSpecCreated: function($super) {
        $super();
        this.tabContainer = this.ownerChain().detect(function(ea) { return ea.isTabContainer; });
        this.pane = this.tabContainer.submorphs[this.pane];
        this.tabBar = this.tabContainer.tabBar
        this.initializeLabel(this.label); 
    }
});
lively.morphic.TabPane.addMethods(
'UI builder', {
    buildSpecProperties: {
        tab: { // index of the tab in tabBar.submorphs
            defaultValue: -1,
            getter: function(morph, val) { return morph.tabBar.submorphs.indexOf(val); }
        },
        tabContainer: {exclude: true},
        tabBar: {exclude: true}
    },
    onFromBuildSpecCreated: function($super) {
        $super();
        this.tabContainer = this.ownerChain().detect(function(ea) { return ea.isTabContainer; })
        this.tabBar = this.tabContainer.getTabBar();
        this.tab = this.tabBar.submorphs[this.tab];
    }
});
lively.morphic.Slider.addMethods(
'UI builder', {
    onFromBuildSpecCreated: function($super) {
        $super();
        this.sliderKnob = this.submorphs.detect(function(ea) { return ea.isSliderKnob; });
    }
});
lively.morphic.SliderKnob.addMethods(
'UI builder', {
    onFromBuildSpecCreated: function($super) {
        $super();
        this.slider = this.ownerChain().detect(function(ea) { return ea.isSlider; });
    }
});

lively.morphic.HorizontalDivider.addMethods(
'buildSpec', {
    buildSpecProperties: {
        scalingAbove: {defaultValue: []},
        scalingBelow: {defaultValue: []}
    }
});

}) // end of moduled of module
