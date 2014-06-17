module('lively.persistence.Entanglement').requires('lively.persistence.BuildSpec', 'lively.persistence.Serializer', 'lively.morphic.Core').toRun(function() {

Object.subclass("lively.persistence.Entanglement.Morph", 
    "initializing", {
        initialize: function() {
            this.isEntanglement = true;
            this.entangledAttributes = {};
            this.subEntanglements = [];
            this.entangledMorphs = [];
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
            
            // we have been named, we should set our identifier to our name
            // the priority of setting the identifier is behaving as follows:
            // weakest <-> strongest: 1.) has no reference at all 2.) has a specified name 3.) has a direct reference
            if(spec.attributeStore.name)
                this.identifier = spec.attributeStore.name;
            
            // entangle all the 'primitive' attributes
            for (var attr in spec.attributeStore) {
                this.entangledAttributes[attr] = spec.attributeStore[attr];
            }
            
            // submorph refs give rise to subentanglements
            this.subEntanglements = [];
            for (var attr in this.entangledAttributes) {
                var v = this.entangledAttributes[attr];
                if (v && v.isMorphRef) {
                    var subSpec, subEnt;
                    if(v.path){
                        subSpec = lively.PropertyPath(v.path).get(this.entangledAttributes);
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
            if(this.entangledAttributes[key] == undefined) {
                // if the morph does not reference the property directly, it may still be found by name
                var m = this.subEntanglements.find(function(subEnt) { return subEnt.entangledAttributes.name } );
                if(!m){
                    //if we still havent found a value mapped to the key, we continue with the get call in all
                    // the sub entanglements
                    m = this.subEntanglements.select(function(subEnt) { return subEnt.get(key) != undefined});
                    if(m.length > 1)
                        throw Error('Ambigous key \"' + key + '\"!');
                    else
                        return m.first().get(key);
                } else {
                    return m;
                }
            }
            if (this.entangledAttributes[key].isMorphRef){
                // could still be a morph ref
                return lively.PropertyPath(this.entangledAttributes[key].path).get({submorphs: this.subEntanglements});
            } else {
                return this.entangledAttributes[key];
            }
        },
        set: function(key, value) {
            // set can also be supplied withthe arguments passed as an array
            if(Array.isArray(key)){
                this.set(key[0], key[1]);
            } else {
                // we only track changes to the object structure via the public interface of an object
                // or to the buildSpecProperties of an object
                if(this.subEntanglements[key])
                    return; 
                if(this.entangledAttributes[key] != value)
                    this.entangledAttributes[key] = value;
            }
        },
        entanglesProp: function(propName) {
            var props = Object.mergePropertyInHierarchy(this.baseSpec.createMorph(), 'buildSpecProperties');
            if(typeof(propName) == 'string' && propName.startsWith('set'))
                propName = propName.replace('set', '_');
            return propName in props;
        }
},
    "entangling", {
        entangleWith: function(morph, options) {
            var self = this;
            // make sure the classes are the same
            if(!this.entangledAttributes.className === morph.constructor) 
                throw TypeError("Can not entangle to a different kind of Morph!");
            
            this.entangledMorphs.push(morph);
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
                // if this property is excluded or a subentanglement, skip
                if(options && excludes(key)) {
                    return;
                }
                
                if(props[key])
                    var getter = props[key].getter || morph['get' + key.replace(/^_/, '').capitalize()]
                if(!key.startsWith('_') || !getter) {
                    self.entanglePublicProperty(morph, key);
                } else {
                    self.entanglePrivateProperty(morph, key, getter);
                }
            });
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
    entanglePrivateProperty: function(morph, key, getter) {
        // the mapping has been modified by the buildspec (_Attributes)
        // find the corresponding setter in the instance
        var setter = 'set' + key.replace(/^_/, '').capitalize();

        if(!this.entangledAttributes[key]) {
            //also make sure to use the getter method here
            getter = getter.bind(morph);
            this.entangledAttributes[key] = getter(morph);
        } else {
            //force the values in the entanglement onto the morph
            morph[setter]((this.entangledAttributes[key]));
        }
        // FIXME: setter arguments not caught by connection
        // HACK: return value of getter inside converter
        connect(morph, setter, this, 'set', 
                    {updater: function ($proceed, newValue, oldValue) {
                                this.targetObj.currentUpdater = this.sourceObj;
                                var res = $proceed([key, this.sourceObj[setter.replace('set', 'get')]()], oldValue);
                                this.targetObj.currentUpdater = null;
                                return res;
                                }, 
                     varMapping: {key: key, setter: setter}});
        connect(this.entangledAttributes, key, morph, setter, 
                    {updater: function($proceed, newValue, oldValue) {
                        var res;
                        if (this.sourceObj.currentUpdater != this.targetObj) {
                            // to make sure that the updated does not cause a backfire,
                            // temporarily disable the connection pointing back
                            var reverseConn = this.targetObj.attributeConnections.find(
                                function(conn) {
                                    return conn.targetObj === self && conn.sourceAttrName === setter; 
                                });
                            lively.bindings.noUpdate({sourceObj: reverseConn && reverseConn.sourceObj, 
                                                      sourceAttribute: reverseConn && reverseConn.sourceAttrName }, 
                                                      function() {res = $proceed(newValue, oldValue);});
                        }
                        return res;
                    }, varMapping: {setter: setter, self: this}});
    },
    disconnectMorph: function(morph) {
        morph.attributeConnections && morph.attributeConnections.forEach(function(conn) {
           conn.disconnect(); 
        });
        this.entangledAttributes.attributeConnections 
        && this.entangledAttributes.attributeConnections.forEach(
            function(conn) { if(conn.targetObj == morph) conn.disconnect(); });
    },
    clearAllEntanglements: function() {
        var self = this;
        var toRemove = this.entangledMorphs.pop();
        while(toRemove) {
            this.disconnectMorph(toRemove);
            toRemove = this.entangledMorphs.pop();
        }
    },
    entanglePublicProperty: function(morph, key) {
        if (morph[key] && Object.isFunction(morph[key]))
            return;
        if(!this.entangledAttributes[key])
            this.entangledAttributes[key] = morph[key]; //default value has already been set
        // connect changes on morph to entanglement
        connect(morph, key, this, 'set', 
                {updater: function($proceed, newValue, oldValue) { 
                    window.currentUpdater = this.sourceObj;
                    var res = $proceed([key, newValue], oldValue); 
                    window.currentUpdater = null;
                    return res;
                }, varMapping: {key: key }});
        // connect changes received in entanglement to entangled morphs
        connect(this.entangledAttributes, key, morph, key,
                {updater: function($proceed, newValue, oldValue) {
                    if (window.currentUpdater != this.targetObj) {
                        // to make sure that the updated does not cause a backfire,
                        // temporarily disable the connection pointing back
                        var reverseConn = this.targetObj.attributeConnections.find(
                            function(conn) {
                                return conn.targetObj === self && conn.sourceAttrName === key; 
                            });
                        lively.bindings.noUpdate({sourceObj: reverseConn.sourceObj, 
                                                  sourceAttribute: reverseConn.sourceAttrName },
                            function() {$proceed(newValue, oldValue);});
                        }
                    }, 
                varMapping: {key: key, self: this}});
    }
    });

Object.extend(lively.persistence.Entanglement.Morph, {
    fromMorph: function(morph) { return new this().fromMorph(morph); },
    fromSpec: function(spec, ignore) { return new this().fromSpec(spec, ignore); }
    });

}) // end of module
