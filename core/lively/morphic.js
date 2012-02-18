var reqs = Config.isNewMorphic ? ['lively.morphic.Complete', 'lively.morphic.CompatLayer'] : ['lively.Core', 'lively.Widgets', 'lively.NewMorphicCompat']
console.log('loading lively.morphic with ' + reqs)

module('lively.morphic').requires(reqs).toRun(function() {

}) // end of module