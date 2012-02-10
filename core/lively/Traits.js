module('lively.Traits').requires().toRun(function() {

Object.subclass('RealTrait',
'global state', {
	traitRegistry: {},
	isTrait: true,
},
'properties', {
	objectTraitConfig: '_traitConfig_',
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
		if (Global.lively && lively.lang && lively.lang.Namespace)
        		this.sourceModule = lively.lang.Namespace.current();
    	},
	createAnonymousTrait: function(options) {
		return RealTrait.createAnonymousTrait('Modified' + this.name, options);
	},
},
'manipulating', {
	extend: function(category, def) {
		if (!def) return;
		this.removeFromDependents();
		for (var name in def)
			if (def.hasOwnProperty(name) && Object.isFunction(def[name])) {
                                if (Global.lively && lively.lang && lively.lang.Namespace)
                                    def[name].sourceModule = lively.lang.Namespace.current();
				def[name].belongsToTrait = this;

                        }
		Object.extend(this.def, def);
		this.categories[category] = def;
		this.updateDependents();
            

		return this
	},
},
'testing', {
	equalOptions: function(a, b) {
		function equals(leftObj, rightObj) {
			if (!leftObj && !rightObj) return true;
			if (!leftObj || !rightObj) return false;
			switch (leftObj.constructor) {
				case String:
				case Boolean:
				case Boolean:
				case Number: return leftObj == rightObj;
			};
			if (leftObj.isEqualNode) return leftObj.isEqualNode(rightObj);

			var cmp = function(left, right) {
				for (var name in left) {
					if (!(left[name] instanceof Function))
						if (!equals(left[name], right[name])) return false;
				};
				return true
			};
			return cmp(leftObj, rightObj) && cmp(rightObj, leftObj);
		}
		return equals(a, b);
	},
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
	},

},
'updating', {
	updateDependents: function() {
		Properties.forEachOwn(this.extendedObjectsAndOptions.classes, function(className, options) {
			var klass = Class.forName(className);
			if (klass) this.applyToClass(klass, options) 
		}, this);
		Properties.forEachOwn(this.extendedObjectsAndOptions.traits, function(traitName, options) {
			var trait = Trait(traitName);
			if (trait) this.applyToTrait(trait, options);
		}, this);
		var objects = this.extendedObjectsAndOptions.objects || [];
		objects.forEach(function(obj) {
			if (!obj) return;
			var config = obj[this.objectTraitConfig]
			this.applyToObject(obj, config && config.options);
		}, this);
	},
	applyTo: function(obj, options) {
		options = options || this.optionsForApply;
		if (Class.isClass(obj)) return this.applyToClass(obj, options);
		if (obj.isTrait) return this.applyToTrait(obj, options);
		return this.applyToObject(obj, options);
	},
	applyToClass: function(klass, options) {
		this.removeFrom(klass.prototype);
		this.basicApplyTo(this.def, klass.prototype, options)
		this.extendedObjectsAndOptions.classes[klass.type || klass.name] = options;
		return this;
	},
	applyToTrait: function(trait, options) {
		trait.removeFromDependents();
		this.removeFrom(trait.def);
		var def = {};
		for (var name in this.def)
			if (this.def.hasOwnProperty(name) && !trait.def[name])
				def[name] = this.def[name];
		this.basicApplyTo(def, trait.def, options)
		this.extendedObjectsAndOptions.traits[trait.name] = options;
		trait.updateDependents();
		return this;
	},
	applyToObject: function(obj, options) {
		this.removeFrom(obj);
		this.basicApplyTo(this.def, obj, options)
		this.extendedObjectsAndOptions.objects.pushIfNotIncluded(obj);
		obj[this.objectTraitConfig] = {options: options};
		return this;
	},

	basicApplyTo: function(source, target, options) {
		var def = {},
			aliasing = (options && options.alias) || {},
			exclusion = (options && options.exclude) || [],
			override = (options && options.override) || [];
		for (var name in source) {
			if (!source.hasOwnProperty(name)) continue;
if (name === 'name') debugger;
			if (exclusion.include(name)) continue;
			var aliasedName = aliasing[name] || name;
			if (target[aliasedName] && !override.include(aliasedName)) continue;
			def[aliasedName] = source[name];	
		}
		Object.extend(target, def);
		return this;
	},
},
'removing', {
	remove: function() {
		this.removeFromDependents();
		delete this.traitRegistry[this.name];
	},
	removeFrom: function(obj) {
		var own = Properties.ownValues(this.def),
			props = Functions.all(obj);
		for (var i = 0; i < props.length; i++)
			if (own.include(obj[props[i]]))
				delete obj[props[i]]
	},
	removeFromDependents: function() {
		Properties.forEachOwn(this.extendedObjectsAndOptions.classes, function(className, options) {
			var klass = Class.forName(className);
			if (!klass) return;
			this.removeFrom(klass.prototype) 
		}, this);
		Properties.forEachOwn(this.extendedObjectsAndOptions.traits, function(traitName, options) {
			var trait = Trait(traitName);
			if (!trait) return;
			trait.removeFromDependents();
			this.removeFrom(trait.def);
			trait.updateDependents();
		}, this);
		var objects = this.extendedObjectsAndOptions.objects || [];
		objects.forEach(function(obj) {
			if (obj) this.removeFrom(obj);
		}, this);
	},
},
'categories', {
	getCategoryNames: function() { return Properties.own(this.categories) },
},
'debugging', {
	toString: function() { return 'Trait(\'' + this.name + '\')' },
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
	},

});

Object.extend(Global, {
	Trait: function(/*traitName, def ... */) {
		var args = $A(arguments),
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
	},
});
}) // end of module
