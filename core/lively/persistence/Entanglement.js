module('lively.persistence.Entanglement').requires('lively.persistence.BuildSpec', 'lively.persistence.Serializer', 'lively.morphic.Core', 'lively.ide.tools.EntanglementInspector').toRun(function() {

Object.subclass("lively.persistence.Entanglement.Morph", 
    "initializing", {
        initialize: function() {
            this.isEntanglement = true;
            this.unsafeSubObjects = []; // list of all attributes, that are not safely entangled
            this.updateDict = {}; // stores the specific update behavior for each entangled morph
            this.entangledAttributes = {}; // seperate store for the synchronized attribute values
            this.subEntanglements = []; // collection of subentanglements, usually corresponds to all submorphs
            this.entangledMorphs = []; // collection of all entangled morphs, that we walk through every update()
        }
    },
    "creation", {
        fromMorph: function(morph) {
            return this.fromSpec(morph.buildSpec());
        },
        fromSpec: function(spec, alreadyEntangled) {
            var MorphEntanglement = lively.persistence.Entanglement.Morph,
                submorphs = spec.attributeStore.submorphs,
                self = this;
            alreadyEntangled = alreadyEntangled || [];
            alreadyEntangled.push(spec);
            self.baseSpec = spec;
            // suppress the setup of connections, as we render this morph out of context just to inspect
            // its morphical structure
            var connectionRebuilder = spec.attributeStore.connectionRebuilder;
            delete spec.attributeStore['connectionRebuilder'];
            var morph = self.baseSpec.createMorph();
            spec.set('connectionRebuilder', connectionRebuilder);
            
            // we have been named, we should set our identifier to our name
            // the priority of setting the identifier is behaving as follows:
            // weakest <-> strongest: 1.) has no reference at all 2.) has a specified name 3.) has a direct reference
            if(spec.attributeStore.name)
                self.identifier = spec.attributeStore.name;
                
            var props = Object.mergePropertyInHierarchy(morph, "buildSpecProperties");
            // entangle all the 'primitive' attributes
            morph.getBuildSpecProperties(props).forEach(function(attr) {
                self.entangledAttributes[attr] = self.baseSpec.attributeStore[attr];
                if(!self.entangledAttributes[attr]) {
                    self.entangledAttributes[attr] = props[attr] && props[attr].defaultValue;
                }
                if(!self.coversData(attr)) {
                    self.unsafeSubObjects.push(attr);
                }
            });
            
            // submorph refs give rise to subentanglements
            self.subEntanglements = [];
            for (var attr in self.entangledAttributes) {
                var v = self.entangledAttributes[attr];
                if (v && v.isMorphRef) {
                    var subSpec, subEnt;
                    if(v.path){
                        subSpec = lively.PropertyPath(v.path).get({submorphs: submorphs});
                    }
                    if(!subSpec && (v.name && submorphs)){
                        subSpec = submorphs.find(function(subspec) {
                                    return subspec.attributeStore.name === v.name
                                });
                    }
                    if(subSpec) {
                        if(alreadyEntangled.include(subSpec)){
                            continue;
                        }
                        subEnt = MorphEntanglement.fromSpec(subSpec, alreadyEntangled);
                        subEnt.identifier = attr;
                        self.subEntanglements.push(subEnt);
                    }
                }
            }
            // finally create subEntanglements for all the 'anonymous' submorphs
            submorphs && submorphs
                .withoutAll(alreadyEntangled)
                .forEach(function(subSpec) {
                    self.subEntanglements.push(MorphEntanglement.fromSpec(subSpec, alreadyEntangled))
                })
            return self;
        },
    coversData: function(attributeName) {
        return !this.entangledAttributes[attributeName] ||
                this.nonSpecableValues().include(this.entangledAttributes[attributeName].constructor.name)
    }
    },
    "accessing", {
        get: function(key) {
            var self = this;
            if(!(key in self.entangledAttributes)) {
                // if the morph does not reference the property directly, it may still be found by name
                var m = self.subEntanglements.find(function(subEnt) { 
                            return subEnt.entangledAttributes.name == key} 
                        );
                if(!m){
                    //if we still havent found a value mapped to the key, we continue with the get call in all
                    // the sub entanglements
                    m = self.subEntanglements.select(function(subEnt) { return subEnt.get(key) != undefined});
                    if(m.length > 1)
                        throw Error('Ambigous key \"' + key + '\"!');
                    if(m.length > 0)
                        return m.first().get(key);
                    else
                        return undefined;
                } else {
                    return m;
                }
            }
            if (self.entangledAttributes[key] && self.entangledAttributes[key].isMorphRef){
                if(self.entangledAttributes[key].path) {
                    return lively.PropertyPath(self.entangledAttributes[key].path)
                                 .get({submorphs: self.subEntanglements});
                } else {
                    // morph ref works by name lookup:
                    var name = self.entangledAttributes[key].name
                    return self.subEntanglements.find(function(subEnt) { 
                            return subEnt.entangledAttributes.name == name});
                }
            } else {
                return self.entangledAttributes[key];
            }
        },
        set: function(key, value) {
            var self = this;
            
            if(self.subEntanglements[key])
                return;
            if(self.entangledAttributes[key] != value)
                self.entangledAttributes[key] = value;
            
            this.propagate(key, value, this.updatingMorph);
            this.baseSpec.set(key, value);
        },

    visualize: function() {
        var inspector = lively.BuildSpec('lively.ide.tools.EntanglementInspector').createMorph().openInWorldCenter();
        inspector.visualize(this);
    },
    addMethod: function(methodName, method) {
        this.entangledMorphs.forEach(function(morph) {
            morph.addScript(method, methodName);
        });
        this.set(methodName, method);
    },

    deleteMethod: function(methodName) {
        delete this.entangledAttributes[methodName];
        this.entangledMorphs.forEach(function(morph) {
            delete morph[methodName];
        });
    },
        entanglesProp: function(propName) {
            var props = this.getBuildSpecProperties();
            if(typeof(propName) == 'string' && propName.startsWith('set'))
                propName = propName.replace('set', '_');
            return props.include(propName);
        }
},
    "entangling", {
        entangleWith: function(morph, options) {
            var self = this;
            var props = Object.mergePropertyInHierarchy(morph, "buildSpecProperties");
            
            if(!self.entangledAttributes.className === morph.constructor) 
                throw TypeError("Can not entangle to a different kind of Morph!");
            
            self.updateDict[morph.id] = {};
            
            morph.getBuildSpecProperties(props).forEach(function(key) {

                var getter, setter, defaultVal;
                
                if(self.excludesProperty(options, morph, key))
                    return;
                    
                getter = self.extractGetter(morph, props, key);
                setter = self.extractSetter(morph, props, key);
                
                if(props[key] && props[key].tracker) {
                    self.handleArrayEntanglement(morph, key, props[key].tracker, getter, setter);
                } else {
                    self.entangleProperty(morph, key, getter, setter, defaultVal);
                }
            });
            
            this.entangledMorphs.push(morph);
    },
    extractSetter: function(morph, attributeProperties, attributeName) {
        var setter;
        
        if(attributeProperties[attributeName])
            setter = attributeProperties[attributeName].setter;
        if(!setter) {
            setter = morph['set' + attributeName.replace(/^_/, '').capitalize()];
            if(!setter) { 
                setter = function(m, e) { m[attributeName] = e[attributeName]};
            } else {
                var boundSetter = setter.bind(morph);
                setter = function(m, e) { return boundSetter(e[attributeName]) };
            }
        }
        
        return setter;
    },

    extractGetter: function(morph, attributeProperties, attributeName) {
        var getter;
        
        if(attributeProperties[attributeName])
            getter = attributeProperties[attributeName].getter;
        if(!getter) {
            getter = morph['get' + attributeName.replace(/^_/, '').capitalize()];
            if(!getter)
                getter = function(m) { return m[attributeName] };
            else
                getter = getter.bind(morph);
        }
        
        return getter;
    },
    excludesProperty: function(options, morph, key) {
        /* A property is excluded if it is either:
            
            1. A function, which are only managed through
                the editing of code in the Entanglement/Object 
                Editor respectively.
                
            2. The options are explicitly excluding the property
                from being entangled. */
        
        if(this.propertyIsFunction(morph, key))
            return true;
            
        if(!options)
            return false;
        
        if(key.startsWith('_'))
            return options.include(key) || options.include('set' + key.replace(/^_/, '').capitalize());
            
        return options.include(key);
    },
    postEntangle: function(morph, options) {
        /* Temporal implementation of an entanglement, where
           a morph that has been constructed outside of the 
           entanglement, is introduced to the synchronization.
           
           Currently we try to infer a mapping of sub-entanglements
           to submorphs based on the assumption that the ordering
           of both is still the same. 
           
           TODO: Implement a seperate EntanglementMapper Object, that 
                 encapsulates the management of this mapping */
                 
        this.entangleWith(morph, options);
        if(this.subEntanglements) {
            for ( var i = 0; i < this.subEntanglements.length; i++ ) {
                this.subEntanglements[i].postEntangle(morph.submorphs[i]);
            }
        }
    },
    updatePropertyOn: function(morph, propertyName, value) {
        /* perform the actual change of a property value,
           by looking up the required setter for that morph */
           
        if(this.updateDict[morph.id][propertyName].setter)
            this.updateDict[morph.id][propertyName].setter(morph, this.entangledAttributes)
        else
            throw Error("Can not find update rules for morph: " + morph.id);
       
    },

    propagate: function(propertyName, value, updatingMorph) {
        /* set the new value for the specific property on all
           entangled morphs, except the one who cause the update */
           
        var self = this;
        function updatableMorph(m) { 
            return self.updateDict[m.id][propertyName]; 
        };
        self.entangledMorphs
            .without(updatingMorph)
            .filter(updatableMorph)
            .forEach(function(entangledMorph) {
                self.updatePropertyOn(entangledMorph, propertyName, value);
            });
    },
    entangleFunction: function(morph, functionName) {
        // all entanglement is currently handled by the addMethod/deleteMethod implementations
    },

    createEntangledMorph: function(options) {
        options = this.parseOpts(options);
        this.augmentBuildSpec(options);
        var morph = this.baseSpec.createMorph();
        this.restoreBuildSpec();
        return morph;
    },
    parseOpts: function(options) {
        options = options || []
        options = options.excludes || options;
        options.concat(this.unsafeSubObjects);
        return options;
    },
    entangleProperty: function(morph, key, getter, setter, defaultValue) {
        var self = this;
        if(!self.entangledAttributes[key]) {
            self.entangledAttributes[key] = defaultValue || getter(morph, morph[key]);
        } else {
            if(self.entangledAttributes[key].isMorphRef) {
                alertOK('skipping: ' + key);
                return;
            } else {
                setter(morph, self.entangledAttributes);
            }
        }
        
        self.updateDict[morph.id][key] = {setter: setter};
        self.updateDict[morph.id][key].updater = lively.Closure.fromFunction(function(morph) {
            var val = getter(morph, morph[key]);
            if(self.get(key) != val) {
                self.updatingMorph = morph;
                self.set(key, val); // synchronously triggers update in all other morphs
                self.updatingMorph = undefined;
            }
        }, {getter: getter, self: self, key: key}).asFunction();
    },
    entangleMorphRef: function(morph, key, getter, setter) {
            /* the actual behavior of an entanglement when creating a buildspec are complex.
                The programmer should define the actual procedure of replacing parts in
                his morph structure through the getter/ setter in the buildSpec.
                If these are not provided we create some default behavior. */
              
        var self = this;
		
        self.updateDict[morph.id][key] = {};        
        self.updateDict[morph.id][key].updater = function(entangledMorph) {
            // determine what morphs have been added to the entangledMorph, namely the
            // ones that are entangled by neither of the existing subEntanglements
            var newMorph = entangledMorph.submorphs.find(function(morph) {
                return !self.subEntanglements.any(function(subEnt) {  subEnt.entangles(morph) });
            });
            var index = morph.submorphs.indexOf(newMorph);
            if(index == -1) {
                alertOK('Entanglements will currently not synchronize changes to Morph references,'
                        + 'that reference external Morphs or Morphs that are referenced through more than one indirection!\n'
                        + 'Please add the new morph to your Structure first before referencing it!')
                return;
            }
            // it might be that this 'new' morph has already recieved
            // an updated entanglement through another reference
            // so check if there is already an entanglement handling him
            if(!(self.subEntanglements[index] 
                 && self.subEntanglements[index].entangledMorphs.include(newMorph)))
            {
                var newSubEntanglement = newMorph.buildSpec().createEntanglement()
                newSubEntanglement.entangleWith(newMorph);
                self.subEntanglements[index] = newSubEntanglement;
            }
        }
    },


    disconnectMorph: function(morph) {
        morph.attributeConnections && morph.attributeConnections.forEach(function(conn) {
           conn.disconnect(); 
        });
        this.entangledAttributes.attributeConnections 
        && this.entangledAttributes.attributeConnections.forEach(
            function(conn) { if(conn.targetObj == morph) conn.disconnect(); });
        this.entangledMorphs.remove(morph);
    },
    clearAllEntanglements: function() {
        var self = this;
        var toRemove = self.entangledMorphs.pop();
        while(toRemove) {
            self.disconnectMorph(toRemove);
            toRemove = self.entangledMorphs.pop();
        }
    },

    },
    "private", {
        augmentBuildSpec: function(options) {
            var self = this;
            if(!self.originalCreationFn)
                self.originalCreationFn = self.baseSpec.createMorph;
            var exclusions = options.select(function(each) { return typeof(each) === 'string' }) || [];
            var remainingExclusions = options.select(function(each) { return !self.entanglesProp(each)}) || [];
            self.baseSpec.createMorph = function() {
                var m = self.originalCreationFn.apply(self.baseSpec, arguments)
                self.entangleWith(m, exclusions);
                return m;
            };
            if(self.subEntanglements) {
                self.subEntanglements.forEach(function(subEnt) {
                    var subExclusions = self.findExclusionsFor(subEnt, options)
                    // remaining exclusions have been checked for uniqueness, so we are fine
                    if(subExclusions)
                        remainingExclusions = remainingExclusions.concat(subExclusions);
                    subEnt.augmentBuildSpec(remainingExclusions); 
                });
            }
    },
    update: function() {
        // check for changes in any entangled morph, and apply these to
        // entanglement. The application of changes automaticaly triggers
        // the propagation of new values among all entangled morphs
        var self = this;
        self.subEntanglements.invoke('update');
        // it is curcial to first perform updates within the sub entanglements
        // so that we can differentiate more easily between recently added and recently changed
        // sub entanglements
        self.entangledMorphs.forEach(function(entangledMorph) {
            for ( var attr in self.entangledAttributes ) {
                if(self.updateDict[entangledMorph.id][attr]) { // property might be excluded
                    var updateTools = self.updateDict[entangledMorph.id][attr]
                    updateTools && updateTools.updater(entangledMorph) //  call the specific update handler
                }
            }
        });
    },
    findExclusionsFor: function(subEnt, options) {
        var exclusions = options.find(function(each) { 
                        return typeof(each) == 'object' && each[subEnt.identifier]
                    });
        return exclusions && exclusions[subEnt.identifier];
    },


    withoutReverseConnectionDo: function(target, key, action) {
        var self = this;
        var reverseConn = target.attributeConnections
                                .find(
                                    function(conn) {
                                        return conn.targetObj === self 
                                               && conn.sourceAttrName === key; 
                                    });
        
        lively.bindings.noUpdate({sourceObj: reverseConn.sourceObj, 
                                  sourceAttribute: reverseConn.sourceAttrName },
                                  action);
    },
    restoreBuildSpec: function() {
        this.baseSpec.createMorph = this.originalCreationFn.bind(this.baseSpec);
    },
    nonSpecableValues: function() {
        // this list may change in the future, but these are all
        // the values, that can be entered 'directly' through an interface.
        // if we provide more means to directly create and inspect more
        // kinds of objects, this list may be extended in the future
        
        return ['Boolean', 'String', 'Number', 'Point', 'Color', 'Array'];
    },
    entangles: function(morph) {
        return this.entangledMorphs.include(morph);
    },
    delete: function() {
        var self = this;
        self.entangledMorphs.forEach(function(entangled) { 
                var hand = entangled.hand();
                if(!(hand && !hand.submorphs.include(entangled)))
                    entangled.remove(); })
        self.entangledMorphs.forEach(function(entangled) { self.disconnectMorph(entangled); });
    },
    getBuildSpecProperties: function() {
        var m = this.baseSpec.createMorph();
        var props = Object.mergePropertyInHierarchy(m, 'buildSpecProperties');
        return m.getBuildSpecProperties(props);
    },

    propertyIsFunction: function(morph, key) {
        return morph[key] && Object.isFunction(morph[key])
    }
    },
    "arrays",
    {
        handleArrayEntanglement: function(instance, propertyName, modifiers, getter, setter) {
        // the array updates currently bypass the set, so it does not need
        // to specify a setter. TODO: How to enhance set, to fit into the update
        // schema of arrays?
        var self = this;
        
        if(!instance[propertyName]){
            throw Error('Can not directly access array named: ' + propertyName);
        }
        
        self.updateDict[instance.id][propertyName] = {};
        self.updateDict[instance.id][propertyName].updater = lively.Closure.fromFunction(function(instance) {
            var oldArray = self.entangledAttributes[propertyName] || [];
            var newArray = getter(instance, instance[propertyName]);
            
            if(oldArray.toString() == newArray.toString()) return; // nothing to update
            
            self.updatingMorph = instance;
            
            if(oldArray.any(function(obj) { return obj.isSpecObject }) || 
               newArray.any(function(obj) { return obj.isSpecObject }) )
                self.handleSubentanglementArray(oldArray, newArray, propertyName, modifiers, instance);
            else
                self.handleObjectArray(oldArray, newArray, propertyName, modifiers);
				
            self.updatingMorph = undefined;

        }, {self: self, instance: instance, getter: getter, setter: setter, 
            modifiers: modifiers, propertyName: propertyName}).asFunction();
    },
    propagateArrayChange: function(mode, element, modifiers) {
        var affectedMorphs = this.entangledMorphs.without(this.updatingMorph);
        if(mode === 'add') {
            if(typeof element != 'object') {
                // element is a primitive
                affectedMorphs.forEach(function(morph) {
                    modifiers.add(morph, element)
                })
            } else {
                alertOK('morph added!')
                // we assume the element provides a buildSpec
                if(!element.buildSpec)
                    throw Error("Complex objects stored in arrays must be synchronized through BuildSpecs!");
                var entanglement = element.buildSpec().createEntanglement();
                entanglement.entangleWith(element); // entangle also with the new element (maybe default?)
                affectedMorphs.forEach(function(morph) {
                    modifiers.add(morph, entanglement.createEntangledMorph());
                })
                return entanglement;
            }
            return;
        }
        
        if(mode === 'remove') {
            if(typeof element != 'object') {
                // element is a primitive
                affectedMorphs.forEach(function(morph) {
                    modifiers.remove(morph, element)
                })
            } else {
                alertOK('morph removed!')
                // element is entangled and can be removed by calling delete() on entanglement
                element.delete();
            }
            return;
        }
        
        throw Error("Unknown mode " + mode);
    },
    handleSubentanglementArray: function(oldArray, newArray, propertyName, modifiers, instance) {
        //in case the array contain sub-entanglements, we can no longer
        // determine changes through the identy of the elements we can
        // retreive thruogh the getter/setter of the array, as new spec
        // objects will be generated on the fly
        // instead we check out current entanglements, and determine which
        // can no longer find a morph inside this submorph, and which
        // morphs are not yet covered by a subEntanglement
        var self = this;
        // to save ourselves from unnessecary checks, we compare the hashes of old
        // and new array. If they are the same, we can assume that nothing has changed
        self.entangledAttributes[propertyName] = newArray; // wo dont actually need to store this
        self.baseSpec.set(propertyName, newArray);
        
        var newSubMorphs = self.getAllSubObjectsFor(instance).select(
                                    function(obj) { return self.subEntanglements.any(
                                        function(subEnt) { return subEnt.entangles(obj) }) == false });
        var removedSubEntanglements = self.subEntanglements.select(
                                    function(subEnt) { return self.getAllSubObjectsFor(instance).any(
                                        function(obj) { return subEnt.entangles(obj) }) ==  false});
        
        // if the hash has changed, this can also be due to a change in a subEntanglemnets
        // without a adding or removal taking place. We therefore deterime all the new and
        // old subMorphs by checking our sub entanglemnets

        newSubMorphs.forEach(function(morph) {
            var entanglement = self.propagateArrayChange('add', morph, modifiers);
            self.subEntanglements.push(entanglement);
        });
        
        removedSubEntanglements.forEach(function(entanglement) {
            self.subEntanglements.remove(entanglement);
            self.propagateArrayChange('remove', entanglement);
        });
        
        if(newSubMorphs.length > 0 || removedSubEntanglements.length > 0)
            self.onSubEntanglementsChanged(newArray);
    },
    onSubEntanglementsChanged: function(newSubEntanglements) {
        // custom code that should be executed when our subEntanglement is changed
        return newSubEntanglements
    },
    getAllSubObjectsFor: function(instance) {
        // currently onlt all submorphs, but might be a combination
        // of several collections in the future
        return instance.submorphs;
    },

    handleObjectArray: function(oldArray, newArray, propertyName, modifiers) {
        //now determine the elements that got remove and the ones that got added

        var self = this;

        var newObjects = $(newArray).not(oldArray).get();
        if(newObjects)
        {
            newObjects.forEach(function(newObject) {D
                self.entangledAttributes[propertyName].push(newObject);
                self.propagateArrayChange('add', newObject, modifiers); 
            });
        } 
        var removedObjects = $(oldArray).not(newArray).get();
        if(removedObjects)
        {
            removedObjects.forEach(function(oldObject) {
                self.entangledAttributes[propertyName].remove(oldObject);
                self.propagateArrayChange('remove', oldObject, modifiers);
            });
        }
    }
    });

Object.extend(lively.persistence.Entanglement.Morph, {
    fromMorph: function(morph) { return new this().fromMorph(morph); },
    fromSpec: function(spec, ignore) { return new this().fromSpec(spec, ignore); }
    });

}) // end of module
