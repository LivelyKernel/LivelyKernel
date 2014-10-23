module('lively.experimental.MethodFinder').requires().toRun(function() {
cop.create("MethodFinderLayer").refineObject(lively.ide.tools.CodeSearch, {
     doSearch: function(searchTerm) {
        $world.openMethodFinderFor(searchTerm)
     }
}).refineClass(lively.morphic.World, {
    openMethodFinderFor: function (searchString) {
        var toolPane = this.get('ToolTabPane');
        if (!toolPane) {
            toolPane = this.openPartItem('ToolTabPane', 'PartsBin/Dialogs');
            toolPane.openInWindow();
            toolPane.owner.name = toolPane.name +"Window";
            toolPane.owner.minExtent = pt(700,370);
            var corner = toolPane.withAllSubmorphsDetect(function (ea) {
                return ea.name == "ResizeCorner";
            });
            corner && toolPane.owner.addMorph(corner)
        }
        var part = toolPane.openMethodFinderFor(searchString)
        part.setExtent(toolPane.tabPaneExtent)
        part.owner.layout = part.owner.layout || {};
        part.owner.layout.resizeWidth = true;
        part.owner.layout.resizeHeight = true;
        part.owner.layout.adjustForNewBounds = true;
        return part;
    }
})

MethodFinderLayer.beGlobal()

}) // end of module
