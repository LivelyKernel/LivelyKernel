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
});

Object.extend(lively.persistence.Entanglement.Morph, {
    fromMorph: function(morph) { return new this().fromMorph(morph); },
    fromSpec: function(spec, ignore) { return new this().fromSpec(spec, ignore); }
    });

}) // end of module
