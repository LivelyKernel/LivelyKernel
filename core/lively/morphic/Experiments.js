module('lively.morphic.Experiments').requires('cop.Layers', 'lively.morphic.Core').toRun(function() {

lively.morphic.Morph.addMethods(
'proto copy', {
    protoCopy: function() {
        var protoCreator = function() { return this };
        protoCreator.prototype = this;
        var protoObj = new protoCreator();

        protoObj.renderContextDispatch('init');
        protoObj.replaceRenderContextWith(this.renderContext().newInstance())
        protoObj.shape = lively.persistence.Serializer.newMorphicCopy(this.shape); 
        protoObj.replaceRenderContextWith(this.renderContext().newInstance())
        return protoObj;
    },
})

}) // end of module