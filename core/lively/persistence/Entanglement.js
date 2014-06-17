module('lively.persistence.Entanglement').requires('lively.persistence.BuildSpec', 'lively.persistence.Serializer', 'lively.morphic.Core').toRun(function() {
Object.subclass("lively.persistence.Entanglement.Morph", 
    "initializing", {
        initialize: function() {
            this.isEntanglement = true;
            this.entangledAttributes = {};
            this.subEntanglements = [];
            this.entangledMorphs = [];
        }
    })
}) // end of module
