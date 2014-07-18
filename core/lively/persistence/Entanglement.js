module('lively.persistence.Entanglement').requires('lively.persistence.BuildSpec', 'lively.persistence.Serializer', 'lively.morphic.Core', 'lively.ide.tools.EntanglementInspector').toRun(function() {

Object.subclass("lively.persistence.Entanglement.Morph", 
    "initializing", {
        initialize: function() {
            this.isEntanglement = true;
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
            this.baseSpec = spec;
            var morph = this.baseSpec.createMorph();
            
            // we have been named, we should set our identifier to our name
            // the priority of setting the identifier is behaving as follows:
            // weakest <-> strongest: 1.) has no reference at all 2.) has a specified name 3.) has a direct reference
            if(spec.attributeStore.name)
                this.identifier = spec.attributeStore.name;
                
            var props = Object.mergePropertyInHierarchy(morph, "buildSpecProperties");
                
            // entangle all the 'primitive' attributes
            morph.getBuildSpecProperties(props).forEach(function(attr) {
                this.entangledAttributes[attr] = this.baseSpec.attributeStore[attr];
                if(!this.entangledAttributes[attr]) {
                    this.entangledAttributes[attr] = props[attr] && props[attr].defaultValue;
                }
            }, this);
            
            // submorph refs give rise to subentanglements
            this.subEntanglements = [];
            for (var attr in this.entangledAttributes) {
                var v = this.entangledAttributes[attr];
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
                        this.subEntanglements.push(subEnt);
                    }
                }
            }
            // finally create subEntanglements for all the 'anonymous' submorphs
            submorphs && submorphs
                .withoutAll(alreadyEntangled)
                .forEach(function(subSpec) {
                    self.subEntanglements.push(MorphEntanglement.fromSpec(subSpec, alreadyEntangled))
                })
            return this;
        }
    },
    "accessing", {
        get: function(key) {
            if(!(key in this.entangledAttributes)) {
                // if the morph does not reference the property directly, it may still be found by name
                var m = this.subEntanglements.find(function(subEnt) { 
                            return subEnt.entangledAttributes.name == key} 
                        );
                if(!m){
                    //if we still havent found a value mapped to the key, we continue with the get call in all
                    // the sub entanglements
                    m = this.subEntanglements.select(function(subEnt) { return subEnt.get(key) != undefined});
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
            if (this.entangledAttributes[key] && this.entangledAttributes[key].isMorphRef){
                if(this.entangledAttributes[key].path) {
                    return lively.PropertyPath(this.entangledAttributes[key].path)
                                 .get({submorphs: this.subEntanglements});
                } else {
                    // morph ref works by name lookup:
                    var name = this.entangledAttributes[key].name
                    return this.subEntanglements.find(function(subEnt) { 
                            return subEnt.entangledAttributes.name == name});
                }
            } else {
                return this.entangledAttributes[key];
            }
        },
        set: function(key, value) {
            if(this.subEntanglements[key])
                return; // subEntanglement reference change handled by morphref entanglement
            if(!this.entangledAttributes.hasOwnProperty(key)){
                // when we create a new property, expand the entanglement
            }
            if(this.entangledAttributes[key] != value)
                this.entangledAttributes[key] = value;
            // propagate new value among all morphs except the updating one
            this.entangledMorphs.without(this.updatingMorph).forEach(function(entangledMorph) {
                if(this.updateDict[entangledMorph][key])
                    this.updateDict[entangledMorph][key].setter(entangledMorph, this.entangledAttributes)
            }, this);
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
        delete this.baseSpec.attributeStore[methodName];
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
            // make sure the classes are the same
            if(!this.entangledAttributes.className === morph.constructor) 
                throw TypeError("Can not entangle to a different kind of Morph!");
            
            // prepare a dictionary that defines the appropriate update call on that entangled morph
            var props = Object.mergePropertyInHierarchy(morph, "buildSpecProperties");
            
            var excludes = function(key) {
                if(key.startsWith('_')){
                    // we also exlude when the user supplies us
                    // only with the corresponding setter
                    return options.include(key) || 
                           options.include('set' + key.replace(/^_/, '').capitalize())
                }
                return options.include(key)
            }
            
            this.updateDict[morph] = {};
            
            morph.getBuildSpecProperties(props).forEach(function(key) {

                var getter, setter, defaultVal;
                // if this property is excluded or a subentanglement, skip
                if(options && excludes(key)) {
                    return;
                }
                
                if(self.propertyIsFunction(morph, key)){
                    return; // we only change functions through the entanglement itself
                }
                
                if(props[key]) {
                    getter = props[key].getter;
                    setter = props[key].recreate;
                    defaultVal = props[key].defaultValue;
                }
                if(!setter) {
                    setter = morph['set' + key.replace(/^_/, '').capitalize()];
                    if(!setter) { 
                        setter = function(m, e) { m[key] = e[key]};
                    } else {
                        var boundSetter = setter.bind(morph);
                        setter = function(m, e) { return boundSetter(e[key]) };
                    }
                }
                if(!getter) {
                    getter = morph['get' + key.replace(/^_/, '').capitalize()];
                    if(!getter)
                        getter = function(m) { return m[key] };
                    else
                        getter = getter.bind(morph);
                }
                
                // EXPERIMENTAL: Array handling
                
                if(props[key] && props[key].tracker) {
                    self.handleArrayEntanglement(morph, key, props[key].tracker, getter, setter);
                } else {
                    self.entangleProperty(morph, key, getter, setter, defaultVal);
                }
            });
            
            this.entangledMorphs.push(morph);
    },
    entangleFunction: function(morph, functionName) {
        // all entanglement is currently handled by the addMethod/deleteMethod implementations
    },

    createEntangledMorph: function(options) {
        // we first augment out buildSpec, by wrapping each
        // subbuildspec.createMorph with an entangleWith call
        // that also makes sure that the correct exclusions are applied
        // we could also: 1 -> wrap all buildSpec objects inside Entanglement Objects.
        // Or just 2 -> completely do the creation of morphs by ourselves...
        options = options || []
        options = options.excludes || options; // is this really necessary..? clarity maybe
        this.augmentBuildSpec(options);
        var morph = this.baseSpec.createMorph();
        return morph;
    },
    entangleProperty: function(morph, key, getter, setter, defaultValue) {
        
        if(!this.entangledAttributes[key]) {
            this.entangledAttributes[key] = defaultValue || getter(morph, morph[key]);
        } else {
            if(this.entangledAttributes[key].isMorphRef) {
                //this.entangleMorphRef(morph, key);
                return;
            } else {
                setter(morph, this.entangledAttributes);
            }
        }
        
        this.updateDict[morph][key] = {setter: setter};
        this.updateDict[morph][key].updater = lively.Closure.fromFunction(function(morph) {
            var val = getter(morph);
            if(self.get(key) != val) {
                self.updatingMorph = morph;
                self.set(key, val); // synchronously triggers update in all other morphs
                self.updatingMorph = undefined;
            }
        }, {getter: getter, self: this, key: key}).asFunction();
    },
    entangleMorphRef: function(morph, key, getter, setter) {
            /* the actual behavior of an entanglement when creating a buildspec are complex.
                The programmer should define the actual procedure of replacing parts in
                his morph structure through the getter/ setter in the buildSpec.
                If these are not provided we create some default behavior. */
              
        var self = this;
        this.updateDict[morph][key] = {};
        
        this.updateDict[morph][key].updater = function(entangledMorph) {
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
        var toRemove = this.entangledMorphs.pop();
        while(toRemove) {
            this.disconnectMorph(toRemove);
            toRemove = this.entangledMorphs.pop();
        }
    },

    },
    "private", {
        augmentBuildSpec: function(options) {
            var self = this;
            if(!self.originalCreationFn)
                self.originalCreationFn = this.baseSpec.createMorph;
            var exclusions = options.select(function(each) { return typeof(each) === 'string' }) || [];
            var remainingExclusions = options.select(function(each) { return !self.entanglesProp(each)}) || [];
            this.baseSpec.createMorph = function() {
                var m = self.originalCreationFn.apply(self.baseSpec, arguments)
                self.entangleWith(m, exclusions);
                return m;
            };
            if(this.subEntanglements) {
                this.subEntanglements.forEach(function(subEnt) {
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
        this.subEntanglements.invoke('update');
        // it is curcial to first perform updates within the sub entanglements
        // so that we can differentiate more easily between recently added and recently changed
        // sub entanglements
        this.entangledMorphs.forEach(function(entangledMorph) {
            for ( var attr in this.entangledAttributes ) {
                if(this.updateDict[entangledMorph][attr]) { // property might be excluded
                    var updateTools = this.updateDict[entangledMorph][attr]
                    updateTools && updateTools.updater(entangledMorph) //  call the specific update handler
                }
            }
        }, this);
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
    entangles: function(morph) {
        return this.entangledMorphs.include(morph);
    },
    delete: function() {
        //FIXME: Do not alter the morph, that has triggered the whole removal
        
        // removeAll entangled morphs without
        this.entangledMorphs.forEach(function(entangled) { entangled.remove() })
        
        // disconnect from morphs
        this.entangledMorphs.forEach(function(entangled) { this.disconnectMorph(entangled); }, this);
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
        
        this.updateDict[instance][propertyName] = {};
        this.updateDict[instance][propertyName].updater = lively.Closure.fromFunction(function(instance) {
            var oldArray = self.entangledAttributes[propertyName];
            var newArray = getter(instance, instance[propertyName]);
            
            if(oldArray.toString() == newArray.toString()) return; // nothing to update
            
            this.updatingMorph = instance;
            
            if(oldArray.any(function(obj) { return obj.isSpecObject }))
                self.handleSubentanglementArray(oldArray, newArray, propertyName, modifiers, instance);
            else
                self.handleObjectArray(oldArray, newArray, propertyName, modifiers);
                
            this.updatingMorph = undefined;
        }, {self: self, instance: instance, getter: getter, setter: setter, 
            modifiers: modifiers, propertyName: propertyName}).asFunction();
    },
    propagateArrayChange: function(mode, element, modifiers) {
        var affectedMorphs = this.entangledMorphs.without(this.updatingMorph);
        if(mode === 'add') {
            // if the element is a primitive, we just copy it across the different entangled objects
            if(typeof element != 'object') {
                // element is a primitive
                affectedMorphs.forEach(function(morph) {
                    modifiers.add(morph, element)
                })
            } else {
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
                // element is entangled and can be removed by calling delete() on entanglement
                element.delete();
            }
            return;
        }
        
        throw Error("Unknown mode " + mode);
    },
    handleSubentanglementArray: function(newArray, oldArray, propertyName, modifiers, instance) {
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
    },
    getAllSubObjectsFor: function(instance) {
        // currently onlt all submorphs, but might be a combination
        // of several collections in the future
        return instance.submorphs;
    },

    handleObjectArray: function(oldArray, newArray, propertyName, modifiers) {
        //now determine the elements that got remove and the ones that got added
        var newObjects = $(newArray).not(oldArray).get();
        if(newObjects)
        {
            newObjects.forEach(function(newObject) {
                this.entangledAttributes[propertyName].push(newObject);
                this.propagateArrayChange('add', newObject, modifiers); 
            }, this);
        } 
        var removedObjects = $(oldArray).not(newArray).get();
        if(removedObjects)
        {
            removedObjects.forEach(function(oldObject) {
                this.entangledAttributes[propertyName].remove(oldObject);
                this.propagateArrayChange('remove', oldObject, modifiers);
            }, this);
        }
    }
    });

Object.extend(lively.persistence.Entanglement.Morph, {
    fromMorph: function(morph) { return new this().fromMorph(morph); },
    fromSpec: function(spec, ignore) { return new this().fromSpec(spec, ignore); }
    });

}) // end of module
