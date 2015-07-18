module('lively.Traits').requires().toRun(function() {

Object.subclass('RealTrait',
'global state', {
    traitRegistry: {},
    isTrait: true
},
'properties', {
    objectTraitConfig: '_traitConfig_'
},
'initializing', {
    initialize: function(name, optionsForApply) {
        if (!name || !Object.isString(name)) throw new Error('Trait needs a name!')
        this.name = name;
        this.def = {};
        this.optionsForApply = optionsForApply || {};
        this.categories = {};
        this.extendedObjectsAndOptions = {classes: {}, traits: {}, objects: []};
        this.traitRegistry[name] = this;

        // remember the module that contains the class def
        if (Global.lively && lively.Module && lively.Module.current)
            this.sourceModule = lively.Module.current();
    },
    createAnonymousTrait: function(options) {
        return RealTrait.createAnonymousTrait('Modified' + this.name, options);
    }
},
'accessing', {

    optionsConfForObj: function(obj) {
        var confs = this.extendedObjectsAndOptions.objects;
        return confs.detect(function(conf) { return conf.object === obj }) || {object: obj};
    },

    optionsConfForClass: function(klass) {
        var name = klass.type || klass.name;
        return name ? this.extendedObjectsAndOptions.classes[name] : null;
    },

    getOriginalMethodFor: function(objOrClass, methodName) {
        var conf = this.optionsConfForClass(objOrClass) || this.optionsConfForObj(objOrClass);
        return conf && conf.originalMethods ? conf.originalMethods[methodName] : null;
    }

},
'manipulating', {

    extend: function(category, def) {
        if (!def) return null;
        this.removeFromDependents(true);
        for (var name in def) {
            if (!def.hasOwnProperty(name) || !Object.isFunction(def[name])) continue;
            if (Global.lively && lively.Module && lively.Module.current) {
                def[name].sourceModule = lively.Module.current();
            }
            def[name].belongsToTrait = this;
        }
        Object.extend(this.def, def);
        this.categories[category] = def;
        this.updateDependents();

        return this;
    },

    mixin: function() {
        var mixinTrait = this.derive({});

        mixinTrait.applyToClass = (function(applyToClass, klass, options) {
            if (!klass.mixinClass) {
                var cls = klass.superclass.subclass();
                klass.superclass = cls;
                klass.prototype.__proto__ = cls.prototype;
                klass.mixinClass = cls;
                var methods = {};
                Functions.own(klass.prototype).each(function(n) {
                    methods[n] = klass.prototype[n].getOriginal();
                });
                klass.addMethods(methods);
            }
            applyToClass.call(this, klass.mixinClass, options);
        }).curry(mixinTrait.applyToClass);

        mixinTrait.applyToObject = function(obj, options) {
            // FIXME duplications with base applyToObject
            var conf = this.optionsConfForObj(obj);
            conf.options = options;
            this.extendedObjectsAndOptions.objects.pushIfNotIncluded(conf);

            var methods = Object.extend({}, this.def);
            methods._mixinProto = this;
            methods.__proto__ = obj.__proto__;
            obj.__proto__ = methods;
            return this;
        };

        mixinTrait.removeFromObjects = function() {
            var objConfs = this.extendedObjectsAndOptions.objects;
            objConfs && objConfs.forEach(function(conf) {
                if (!conf.object) return;
                for (var prev = conf.object, p = prev.__proto__;
                     !!p && !!p.__proto__;
                     prev = p, p = p.__proto__) {
                    if (p._mixinProto === this) prev.__proto__ = p.__proto__;
                }
            }, this);
        };

        
        return mixinTrait;
    }
},
'testing', {
    equalOptions: function(a, b) {
        function equals(leftObj, rightObj) {
            if (!leftObj && !rightObj) return true;
            if (!leftObj || !rightObj) return false;
            switch (leftObj.constructor) {
                case String:
                case Boolean:
                case Number: return leftObj == rightObj;
            };
            if (leftObj.isEqualNode) return leftObj.isEqualNode(rightObj);

            var cmp = function(left, right) {
                for (var name in left) {
                    if (Object.isFunction(left[name])) continue;
                    if (equals(left[name], right[name])) continue;
                    return false;
                };
                return true;
            };
            return cmp(leftObj, rightObj) && cmp(rightObj, leftObj);
        }
        return equals(a, b);
    }
},
'derive', {
    derive: function(options) {
        var derivedTrait = this.findDerivedTrait(options);
        if (derivedTrait) return derivedTrait;
        derivedTrait = this.createAnonymousTrait(options);
        this.applyTo(derivedTrait, options);
        return derivedTrait;
    },
    findDerivedTrait: function(options) {
        var extTraits = this.extendedObjectsAndOptions.traits;
        for (var name in extTraits) {
            if (!extTraits.hasOwnProperty(name)) continue;
            var extTraitOptions = extTraits[name];
            if (this.equalOptions(options, extTraitOptions)) return Trait(name)
        }
        return null;
    }

},
'updating', {
    updateDependents: function() {
        Properties.forEachOwn(this.extendedObjectsAndOptions.classes, function(className, options) {
            var klass = lively.Class.forName(className);
            if (klass) this.applyToClass(klass, options)
        }, this);
        Properties.forEachOwn(this.extendedObjectsAndOptions.traits, function(traitName, options) {
            var trait = Trait(traitName);
            if (trait) this.applyToTrait(trait, options);
        }, this);
        var objectConfs = this.extendedObjectsAndOptions.objects;
        objectConfs.forEach(function(conf) {
            if (!conf.object) return;
            var options = conf.options;
            this.applyToObject(conf.object, options);
        }, this);
    },
    applyTo: function(obj, options) {
        options = options || this.optionsForApply;
        // Fix wrong usage of override
        if (Object.isString(options.override)) options.override = [options.override];
        if (lively.Class.isClass(obj)) return this.applyToClass(obj, options);
        if (obj.isTrait) return this.applyToTrait(obj, options);
        return this.applyToObject(obj, options);
    },
    applyToClass: function(klass, options) {
        var originalMethods = options.originalMethods;
        if (!originalMethods) originalMethods = options.originalMethods = {};
        if (options.override) {
            options.override.forEach(function(ea) {
                if (klass.prototype[ea]) originalMethods[ea] = klass.prototype[ea];
            });
        }
        this.removeFrom(klass);
        this.basicApplyTo(this.def, klass.prototype, options)
        this.extendedObjectsAndOptions.classes[klass.type || klass.name] = options;
        return this;
    },
    applyToTrait: function(trait, options) {
        trait.removeFromDependents(true);
        this.removeFrom(trait.def);
        var def = {};
        for (var name in this.def){
            if (this.def.hasOwnProperty(name) && !trait.def[name]) {
                def[name] = this.def[name];
            }
        }
        this.basicApplyTo(def, trait.def, options);
        this.extendedObjectsAndOptions.traits[trait.name] = options;
        trait.updateDependents();
        return this;
    },

    applyToObject: function(obj, options) {
        this.removeFrom(obj);
        this.basicApplyTo(this.def, obj, options);

        // we store a hash {object: obj, options: options} in
        // extendedObjectsAndOptions.objects for updating.
        var conf = this.optionsConfForObj(obj);
        conf.options = options;
        this.extendedObjectsAndOptions.objects.pushIfNotIncluded(conf);

        // We also store the trait name and options in the object
        // itself for serialization
        var myName = this.name,
            traitsList = obj[this.objectTraitConfig] || [];
        // FIXME
        // obj[this.objectTraitConfig] on old objects is not a list, ignore it
        if (!Object.isArray(traitsList)) traitsList = [];
        var objTraitOptions = traitsList.detect(function(ea) { return ea.traitName === myName });
        if (objTraitOptions) {
            objTraitOptions.options = options;
        } else {
            traitsList.push({traitName: this.name, options: options});
            obj[this.objectTraitConfig] = traitsList;
        }
        return this;
    },

    basicApplyTo: function(source, target, options) {
        var def = {},
            aliasing = (options && options.alias) || {},
            exclusion = (options && options.exclude) || [],
            override = (options && options.override) || [];
        for (var name in source) {
            if (!source.hasOwnProperty(name)) continue;
            if (exclusion.include(name)) continue;
            var aliasedName = aliasing[name] || name;
            if (target[aliasedName] && !override.include(aliasedName)) continue;
            def[aliasedName] = source[name];
        }
        Object.extend(target, def);
        return this;
    }
},
'removing', {

    remove: function() {
        this.removeFromDependents();
        delete this.traitRegistry[this.name];
    },

    removeFrom: function(obj, options, keepReference) {
        var originalObj = obj;
        if (lively.Class.isClass(obj)) {
            obj = obj.prototype;
            options = options || this.optionsConfForClass(originalObj);
        } else if (obj.isTrait) {
            obj = obj.def;
        } else {
            options = options || this.optionsConfForObj(originalObj);
        }

        var own = Properties.ownValues(this.def),
            props = Functions.all(obj),
            originalMethods = (options && options.originalMethods) || {};
        for (var i = 0; i < props.length; i++) {
            var name = props[i];
            // FIXME what about aliased methods?
            if (!own.include(obj[name])) continue;
            if (obj[name].belongsToTrait === this && originalMethods[name]) {
                obj[name] = originalMethods[name];
                delete originalMethods[name];
            } else {
                delete obj[name];
            }
        }

        if (!keepReference)
            this.removeReference(originalObj);
    },

    removeFromDependents: function(keepReference) {
        this.removeFromClasses(keepReference);
        this.removeFromTraits(keepReference);
        this.removeFromObjects(keepReference);
    },

    removeFromClasses: function(keepReference) {
        Properties.forEachOwn(this.extendedObjectsAndOptions.classes, function(className, options) {
            var klass = lively.Class.forName(className);
            if (!klass) return;
            this.removeFrom(klass, options, keepReference);
        }, this);
    },

    removeFromTraits: function(keepReference) {
        Properties.forEachOwn(this.extendedObjectsAndOptions.traits, function(traitName, options) {
            var trait = Trait(traitName);
            if (!trait) return;
            trait.removeFromDependents(true);
            this.removeFrom(trait.def, null, keepReference);
            trait.updateDependents();
        }, this);
    },

    removeFromObjects: function(keepReference) {
        var objConfs = this.extendedObjectsAndOptions.objects;
        objConfs && objConfs.forEach(function(conf) {
            if (conf.object)
                this.removeFrom(conf.object, null, keepReference);
        }, this);
    },

    removeReference: function(obj) {
        var position;

        if (lively.Class.isClass(obj)) {
            delete this.extendedObjectsAndOptions.classes[obj.type || obj.name];
        } else if (obj.isTrait) {
            delete this.extendedObjectsAndOptions.traits[obj.name];
        } else if (Object.isArray(obj[this.objectTraitConfig])) {
            position = this.extendedObjectsAndOptions.objects.pluck('object').indexOf(obj);
            if (position >= 0) {
                this.extendedObjectsAndOptions.objects.removeAt(position);
                position = obj[this.objectTraitConfig].pluck('traitName').indexOf(this.name);
                if (position >= 0)
                    obj[this.objectTraitConfig].removeAt(position);
            }
        }
    }

},
'categories', {
    getCategoryNames: function() { return Properties.own(this.categories) }
},
'debugging', {
    toString: function() { return 'Trait(\'' + this.name + '\')' }
});

Object.extend(RealTrait, {
    named: function(name, options) {
        return this.prototype.traitRegistry[name] || new RealTrait(name, options);
    },
    createAnonymousTrait: function(baseName, options) {
        var counter = 0, name;
        do {
            name = baseName + counter;
            counter++;
        } while(this.prototype.traitRegistry[name] != undefined);
        return this.named(name, options);
    }
});

Object.extend(Global, {

    Trait: function(/*traitName, def ... */) {
        var args = Array.from(arguments),
            traitName = args.shift(),
            trait = RealTrait.named(traitName),
            category = ' default category';
        for (var i = 0; i < args.length; i++) {
            if (Object.isString(args[i])) {
                category = args[i];
            } else {
                trait.extend(category, args[i]);
            }
        }
        return trait;
    }

});

Object.extend(lively.Traits, {
    traitConfsOfObject: function(obj) {
        return obj[RealTrait.prototype.objectTraitConfig];
    }
});

}) // end of module
