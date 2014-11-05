module('lively.morphic.tests.Tree').requires("lively.TestFramework", "lively.morphic.Widgets").toRun(function() {

AsyncTestCase.subclass("lively.morphic.tests.Tree.Test",
"testing", {

    testCreateSimpleTree: function() {
        var tree = new lively.morphic.Tree();
        var image = lively.morphic.Image.fromURL('http://emoji.fileformat.info/gemoji/warning.png', lively.rect(0,0,12,12));
        tree.openInWorld();

        this.onTearDown(function() { tree.remove(); });

        tree.setItem({
            name: "root",
            description: "root of all evil",
            isEditable: true,
            children: [
                {name: "item 1", children: [{name: "subitem", style: {color: Color.red}}]},
                {name: "item 2", description: "description", isEditable: true, submorphs: [image]}]
        });

        tree.expand()

        var trees = tree.withAllSubmorphsSelect(function(ea) { return ea.isTree; });
        this.assertEquals(trees[0], tree, "trees[0]");
        this.assertEquals(trees[1].item.name, "item 1", "trees[1]");
        this.assertEquals(trees[2].item.name, "item 2", "trees[2]");
        this.assertEquals(trees[2].submorphs[0].submorphs.grep("Image")[0].getImageURL(), "http://emoji.fileformat.info/gemoji/warning.png", 'image');

        this.done();
    },

    testTreeWithCustomItemMorph: function() {
        this.onTearDown(function() { tree.remove(); });

        var tree = new lively.morphic.Tree();
        tree.openInWorld();
        var itemMorph1 = lively.newMorph({extent: pt(200,100), style: {fill: Color.green}});
        var itemMorph2 = lively.newMorph({extent: pt(200,100), style: {fill: Color.blue}});
        tree.setItem({name: "root", children: [
          {name: "has own morph", morph: itemMorph1},
          {name: "has own morph 2", morph: itemMorph2}]});

        tree.expand()

        var trees = tree.withAllSubmorphsSelect(function(ea) { return ea.isTree; });
        this.assertEquals(trees[0], tree, "trees[0]");

        this.assertEquals(trees[1].submorphs[0], itemMorph1, "trees[1] itemMorph");
        this.assertEquals(trees[2].submorphs[0], itemMorph2, "trees[2] itemMorph");

        this.done();
    },

    testReplaceItemMorph: function() {
        this.onTearDown(function() {
          tree.remove();
          });

        var tree = new lively.morphic.Tree();
        tree.openInWorld();
        var itemMorph1 = lively.newMorph({extent: pt(200,100), style: {fill: Color.green}});
        var itemMorph2 = lively.newMorph({extent: pt(100,50), style: {fill: Color.blue}});

        tree.setItem({name: "root", children: [
          {name: "has own morph", morph: itemMorph1},
          {name: "'nother", description: "fooooo"}]});

        itemMorph1.addScript(function onMouseDown(evt) {
          item.morph = other; lively.bindings.signal(item, 'changed');
        }, null, {item: tree.item.children[0], other: itemMorph2});

        itemMorph2.addScript(function onMouseDown(evt) {
          item.morph = other; lively.bindings.signal(item, 'changed');
        }, null, {item: tree.item.children[0], other: itemMorph1});

        tree.expand()
        var trees = tree.withAllSubmorphsSelect(function(ea) { return ea.isTree; });

        this.assertEquals(trees[1].submorphs[0], itemMorph1, "trees[1] itemMorph");

        tree.item.children[0].morph = itemMorph2;
        lively.bindings.signal(tree.item.children[0], 'changed');

        this.assertEquals(trees[1].submorphs[0], itemMorph2, "trees[1] itemMorph");
        this.done();
    }
});

}) // end of module
