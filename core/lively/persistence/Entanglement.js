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
            /*
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
            
            morph.getBuildSpecProperties(props).forEach(function(key) {

                var getter, setter, defaultVal;
                // if this property is excluded or a subentanglement, skip
                if(options && excludes(key)) {
                    return;
                }
                
                if(self.propertyIsFunction(morph, key)){
                    self.entangleFunction(morph, key);
                    return;
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
            }); */
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
        //this.augmentBuildSpec(options);
        var morph = this.baseSpec.createMorph();
        this.entangleWith(morph);
        return morph;
    },
    entangleProperty: function(morph, key, getter, setter, defaultValue) {
        
        this.updateDict[morph][key] = {setter: setter};
        this.updateDict[morph][key].updater = lively.Closure.fromFunction(function(morph) {
            var val = getter(morph);
            if(self.get(key) != val) {
                self.updatingMorph = morph;
                self.set(key, val); // synchronously triggers update in all other morphs
                self.updatingMorph = undefined;
            }
        }, {getter: getter, self: this, key: key}).asFunction();
        
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
        
         /* The problem here is, that BuildSpecs do not indicate how we can listen
            for changes to a certain property. If a getter is specified, we can
            call this getter, yet this does not convey where a connection needs to
            be setup in order to monitor the change. 
            Our best bet is therefore, that once a getter is specified, we assume that 
            a corresponding set method exists that we can connect and listen to. */
        /*
        var propertyAccessName;
        if(key.startsWith('_'))
            propertyAccessName = 'set' + key.replace(/^_/, '').capitalize();
        else
            propertyAccessName = key;
        
        connect(this.entangledAttributes, key, morph, propertyAccessName, 
            {updater: function($proceed, newValue, oldValue) {
                if (this.sourceObj.currentUpdater != this.targetObj) {
                     self.withoutReverseConnectionDo(
                            this.targetObj, propertyAccessName, function() { setter(morph, self.entangledAttributes)});
                }
            }, varMapping: {propertyAccessName: propertyAccessName, setter: setter, morph: morph, self: this}});
        connect(morph, propertyAccessName , this, 'set', 
            {updater: function ($proceed, newValue, oldValue) {
                this.targetObj.currentUpdater = this.sourceObj;
                newValue = getter(morph, morph[key]);
                var res = $proceed(key, newValue);
                this.targetObj.currentUpdater = null;
                return res;
            }, varMapping: {key: key, getter: getter, morph: morph}});
        */
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
        
        /*
        connect(this.entangledAttributes, key, morph, key, 
            {updater: function($proceed, newMorphRef, oldMorphRef) {
                if (this.sourceObj.currentUpdater != this.targetObj) {
                     self.withoutReverseConnectionDo(
                            this.targetObj, key, function() {
                                var newEntanglement = lively.PropertyPath(newMorphRef.path)
                                                            .get({submorphs: self.subEntanglements});
                                // again, check if there is already a morph present, that is already
                                // synchronized by this new Entanglement. If so, we do not create 
                                // a new morph for this reference, and just reassign
                                var entangledSubmorph = morph.submorphs.find(
                                                function(m) { return newEntanglement.entangledMorphs.include(m); } );
                                if(entangledSubmorph) {
                                    morph[key] = entangledSubmorph;   
                                } else {
                                    var newSubMorph = newEntanglement.createEntangledMorph()
                                    morph.addMorph(newSubMorph);
                                    morph[key] = newSubMorph;
                                }
                            });
                }
            }, varMapping: {morph: morph, self: this, key: key}});
        
        connect(morph, key , this, 'set', 
            {updater: function ($proceed, newMorph, oldMorph) {
                this.targetObj.currentUpdater = this.sourceObj;
                // notice that we , as the buildspecs, do not support references
                // to morphs that are nested more than one indirection into the morph
                // for this the programmer has to explicitly include the attribute into
                // the buildSpec, and provide getter + setter
                var index = morph.submorphs.indexOf(newMorph);
                // in case the new morph reference is not part of immediate the morph structure
                // we do not propagate this change
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
                
                $proceed(key, { isMorphRef: true, path: 'submorphs.' + index })
                
                this.targetObj.currentUpdater = null;
            }, varMapping: {key: key, morph: morph, self: this}});
        */
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
        this.entangledMorphs.forEach(function(entangledMorph) {
            for ( var attr in this.entangledAttributes ) {
                if(this.updateDict[entangledMorph][attr]) { // property might be excluded
                    var updateTools = this.updateDict[entangledMorph][attr]
                    updateTools && updateTools.updater(entangledMorph) //  call the specific update handler
                }
            }
        }, this);
        this.subEntanglements.invoke('update');
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
        handleArrayEntanglement: function(instance, propertyName, mutationMethods, getter, setter) {
        // the array updates currently bypass the set, so it does not need
        // to specify a setter. TODO: How to enhance set, to fit into the update
        // schema of arrays?
        var self = this;
        
        if(!instance[propertyName]){
            throw Error('Can not directly access array named: ' + propertyName);
        }
        
        this.updateDict[instance][propertyName] = {};
        this.updateDict[instance][propertyName].updater = function(instance) {
            var oldArray = self.entangledAttributes[propertyName];
            var newArray = getter(instance, instance[propertyName]);
            if(oldArray != newArray)
            {
                //now determine the elements that got remove and the ones that got added
                var newObjects = newArray.filter(function(elem) { return !oldArray.includes(elem) })
                if(newObjects)
                {
                    newObjects.forEach(function(newObject) {
                        var newEnt = self.propagateArrayChange('add', newObject);
                        self.subEntanglements.push(newEnt);
                        self.entangledAttributes[propertyName].push(newEnt.baseSpec);
                    });
                } 
                var removedObjects = oldArray.filter(function(elem) { return !newArray.includes(elem) })
                if(removedObjects)
                {
                    // we removed an element, find out by determining which subEntanglement
                    // can no longer find a corresponding element inside the submorphs
                    var obsoleteEntanglements = self.subEntanglements.filter(
                        function(subEnt) { 
                            return $(instance.submorphs).filter(subEnt.entangledMorphs).length == 0 
                        });
                    obsoleteEntanglements.forEach(function(oldElem) {
                        self.propagateArrayChange('remove', oldElem, mutationMethods);
                        self.entangledAttributes[propertyName].remove(oldElem.baseSpec);
                    });
                }
            }
        }
    },
    propagateArrayChange: function(affectedMorphs, mode, element, modifiers) {
        if(mode === 'add') {
            // if the element is a primitive, we just copy it across the different entangled objects
            if(typeof element != 'object') {
                affectedMorphs.forEach(function(morph) {
                    // TODO; make sure to turn of the connections to prevent backfiring
                    modifiers.add(morph, element)
                })
            } else {
                // we assume the new element comes in the form of a buildspec
                if(!element.buildSpec)
                    throw Error("Complex objects stored in arrays must be synchronized through BuildSpecs!");
                var entanglement = element.buildSpec().createEntanglement();
                entanglement.entangleWith(element); // entangle also with the new element (maybe default?)
                affectedMorphs.forEach(function(morph) {
                    // TODO; make sure to turn of the connections to prevent backfiring
                    lively.bindings.noUpdate({sourceObj: morph, 
                                  sourceAttribute: 'addMorph' },
                                  function() { modifiers.add(morph, entanglement.createEntangledMorph()) });
                })
                return entanglement;
            }
            return;
        }
        
        if(mode === 'remove') {
            if(typeof element != 'object') {
                affectedMorphs.forEach(function(morph) {
                    modifiers.remove(morph, element)
                })
            } else {
                // trigger deletion through the responsible entanglement
                element.delete();
                this.subEntanglements.remove(element);
            }
            return;
        }
        
        throw Error("Unknown mode " + mode);
    }
    });

Object.extend(lively.persistence.Entanglement.Morph, {
    fromMorph: function(morph) { return new this().fromMorph(morph); },
    fromSpec: function(spec, ignore) { return new this().fromSpec(spec, ignore); }
    });

}) // end of module
