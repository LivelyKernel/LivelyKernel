module('lively.groups.GroupSupport').requires().toRun(function() {

lively.morphic.World.addMethods(
'tools', {
    openGroupEditor: function() {
        return this.openPartItem('GroupEditor', 'PartsBin/Tools');
    },
    openGroupEditorFor: function(groupOrArray) {
        var group = groupOrArray.isObjectGroup ? groupOrArray : 
            new lively.groups.ObjectGroup('', groupOrArray);
        var part = this.openGroupEditor();
        part.setTarget(group);
        return part;
    },
});

cop.create('GroupSupportLayer')
.refineClass(lively.PartsBin.PartItem, {
    setPart: function(part) {
        cop.proceed(part);
        part.updateGroupBehavior();
        return part;
    },
})
.refineClass(lively.morphic.Selection, {
      morphMenuItems: function() {
          var items = cop.proceed(),
              that = this;
          items.push(["open GroupEditor for selection", function(){
              $world.openGroupEditorFor(that.selectedMorphs);
          }]);
          return items;
      }
})
GroupSupportLayer.beGlobal();

}) // end of module