module('lively.morphic.tests.Morphic').requires('lively.morphic.tests.Helper', 'lively.morphic.Layout').toRun(function() {
    
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.ListMorphTests',
'testing', {
    test01SetAndRetrieveStringItems: function() {
        var list = new lively.morphic.List(new Rectangle(0, 0, 100, 100), ['1', '2', '3']);
        this.assertEqualState(['1', '2', '3'], list.itemList);
        list.updateList(['foo']);
        this.assertEqualState(['foo'], list.itemList);
    },

    test02SelectAt: function() {
        var morph = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['first']);
        this.world.addMorph(morph);
        morph.selectAt(0);

        this.assertEquals('first', morph.selection);
        // var morphNode = morph.renderContext().getMorphNode();
        // this.doMouseEvent({type: 'mousedown', pos: pt(10,8), target: morphNode, button: 0});
    },

    test03SelectListItem: function() {
        var morph = new lively.morphic.List(new Rectangle (0, 0, 100, 100));
        this.world.addMorph(morph);
        morph.updateList([
            {isListItem: true, string: 'foo', value: 23},
            {isListItem: true, string: 'bar', value: 24}])
        morph.selectAt(1);
        this.assertEquals(24, morph.selection);
    },

    test04ListMorphBoundsOnCreationInHTML: function() {
        var owner = lively.morphic.Morph.makeRectangle(0,0,10,10),
            list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['1', '2', '3']);

        owner.addMorph(list)
        this.world.addMorph(owner);

        // FIXME depends on HTML
        this.assert(list.renderContext().listNode.clientHeight > 0, 'list node height is wrong')
    },

    test05ListMorphKeepsSelectionHighlightOnUpdateList: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100));
        this.world.addMorph(list);

        list.updateList([1,2,3]);
        list.setSelection(2);
        list.updateList([1,2,3]);

        var expected = {
            tagName: 'option',
            // attributes: {selected: true} // for some reason this does not work..
        };
        this.assertNodeMatches(expected, list.renderContext().subNodes[1]);
        this.assert(list.renderContext().subNodes[1].selected, 'not selected');
    },

    test06SetSelectionWithListItems: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
            items = [{isListItem: true, string: 'foo', value: 23}];
        this.world.addMorph(list);

        list.updateList(items);
        list.setSelection(23);

        this.assertEquals(0, list.selectedLineNo);
    },

    testAddMorphDuplicatesListsBug: function() {
        var list = new lively.morphic.List(new Rectangle(0,0,100,100), [1,2,3]),
            rect = lively.morphic.Morph.makeRectangle(0,0,100,100);

        this.world.addMorph(list);
        this.world.addMorph(rect);
        rect.addMorph(list);

        this.assert(!this.world.submorphs.include(list), 'list in world submorphs')
        this.assert(rect.submorphs.include(list), 'list not in rect submorphs')
    },

    testUpdateListOnSelectionHighlightsSelectionCorrectly: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
            items = [1, 2, 3];
        this.world.addMorph(list);

        list.updateList(items);
        list.setSelection(2);
        this.assertEquals(1, list.selectedLineNo);

        connect(list, 'selection', list, 'onSelect')
        list.addScript(function onSelect(sel) { this.updateList(this.getList()) });

        list.setSelection(3);
        this.assertEquals(2, list.selectedLineNo);
        // FIXME implementation & HTML specific
        var isSelected = list.renderContext().subNodes[2].selected;
        this.assert(isSelected !== '', 'highlight wrong')
    },

    testNoDoubleSelectionWhenClickedInList: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
            counter = {count: 0, selected: function() { this.count++ }},
            items = [1, 2, 3];
        this.world.addMorph(list);
        list.updateList(items);
        list.setSelection(2);

        lively.bindings.connect(list, 'selection', counter, 'selected')
        list.onMouseUp({isLeftMouseButtonDown: Functions.True,
                        target: list.renderContext().subNodes[2]})
        list.onChange({});
        this.assertEquals(1, counter.count, 'selection triggered too often');
    }

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.MultipleSelectionListTests',
'testing', {
    test01GetSelections: function() {
        var list = new lively.morphic.List(new Rectangle(0, 0, 100, 100), ['1', '2', '3']);
        this.world.addMorph(list)
        list.setSelection('2');
        this.assertEqualState(['2'], list.getSelections());
    },

    test02TurnOnMultipleSelectionMode: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['1', '2', '3']);
        this.world.addMorph(list)
        list.enableMultipleSelections();
        list.setSelections(['1','3'])
        this.assertEqualState(['1', '3'], list.getSelections());
    },

    test03SetSelection: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['1', '2', '3']);
        list.enableMultipleSelections();
        list.setSelection('1')
        list.setSelection('3')
        list.setSelection(null)
        this.assertEqualState(['1', '3'], list.getSelections());
        list.clearSelections();
        this.assertEqualState([], list.getSelections());
    },

});

AsyncTestCase.subclass('lively.morphic.tests.Lists.MorphicList', lively.morphic.tests.MorphTests.prototype,
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
    }
},
'testing', {
    // lively.morphic.tests.Lists.MorphicList.remove()
    test01SetAndRetrieveStringItems: function() {
        var list = new lively.morphic.MorphList(new Rectangle(0, 0, 100, 100), ['1', '2', '3']);
        this.assertEquals(['1', '2', '3'], list.itemList);
        this.waitFor(function() { return list.isRendered(); }, 10, function() {
            this.assertEquals(['1', '2', '3'], list.getItemMorphs().pluck('textString'), 'rendered list 1');
            list.updateList(['foo']);
            this.assertEquals(['foo'], list.itemList);
            this.assertEquals(['foo'], list.getItemMorphs().pluck('textString'), 'rendered list 2');
            this.done();
        });
    },

    test02SelectAt: function() {
        var morph = new lively.morphic.MorphList(['first', 'second']);
        this.world.addMorph(morph);
        morph.selectAt(1);
        this.assertEquals('second', morph.selection, 'selection');
        var itemMorphs = morph.getItemMorphs();
        this.assert(itemMorphs[1].hasStyleClassName('selected'), 'selection css class');
        this.assert(!itemMorphs[0].hasStyleClassName('selected'), 'unselection css class');
        this.done();
    },

    test03SelectListItem: function() {
        var morph = new lively.morphic.List(new Rectangle (0, 0, 100, 100));
        this.world.addMorph(morph);
        morph.updateList([
            {isListItem: true, string: 'foo', value: 23},
            {isListItem: true, string: 'bar', value: 24}])
        morph.selectAt(1);
        this.assertEquals(24, morph.selection);
        this.done();
    },

    // test04ListMorphBoundsOnCreationInHTML: function() {
    //     var owner = lively.morphic.Morph.makeRectangle(0,0,10,10),
    //         list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), ['1', '2', '3']);

    //     owner.addMorph(list)
    //     this.world.addMorph(owner);

    //     // FIXME depends on HTML
    //     this.assert(list.renderContext().listNode.clientHeight > 0, 'list node height is wrong')
    // },

    // test05ListMorphKeepsSelectionHighlightOnUpdateList: function() {
    //     var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100));
    //     this.world.addMorph(list);

    //     list.updateList([1,2,3]);
    //     list.setSelection(2);
    //     list.updateList([1,2,3]);

    //     var expected = {
    //         tagName: 'option',
    //         // attributes: {selected: true} // for some reason this does not work..
    //     };
    //     this.assertNodeMatches(expected, list.renderContext().subNodes[1]);
    //     this.assert(list.renderContext().subNodes[1].selected, 'not selected');
    // },

    // test06SetSelectionWithListItems: function() {
    //     var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
    //         items = [{isListItem: true, string: 'foo', value: 23}];
    //     this.world.addMorph(list);

    //     list.updateList(items);
    //     list.setSelection(23);

    //     this.assertEquals(0, list.selectedLineNo);
    // },

    // testAddMorphDuplicatesListsBug: function() {
    //     var list = new lively.morphic.List(new Rectangle(0,0,100,100), [1,2,3]),
    //         rect = lively.morphic.Morph.makeRectangle(0,0,100,100);

    //     this.world.addMorph(list);
    //     this.world.addMorph(rect);
    //     rect.addMorph(list);

    //     this.assert(!this.world.submorphs.include(list), 'list in world submorphs')
    //     this.assert(rect.submorphs.include(list), 'list not in rect submorphs')
    // },

    // testUpdateListOnSelectionHighlightsSelectionCorrectly: function() {
    //     var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
    //         items = [1, 2, 3];
    //     this.world.addMorph(list);

    //     list.updateList(items);
    //     list.setSelection(2);
    //     this.assertEquals(1, list.selectedLineNo);

    //     connect(list, 'selection', list, 'onSelect')
    //     list.addScript(function onSelect(sel) { this.updateList(this.getList()) });

    //     list.setSelection(3);
    //     this.assertEquals(2, list.selectedLineNo);
    //     // FIXME implementation & HTML specific
    //     var isSelected = list.renderContext().subNodes[2].selected;
    //     this.assert(isSelected !== '', 'highlight wrong')
    // },

    // testNoDoubleSelectionWhenClickedInList: function() {
    //     var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
    //         counter = {count: 0, selected: function() { this.count++ }},
    //         items = [1, 2, 3];
    //     this.world.addMorph(list);
    //     list.updateList(items);
    //     list.setSelection(2);

    //     lively.bindings.connect(list, 'selection', counter, 'selected')
    //     list.onMouseUp({isLeftMouseButtonDown: Functions.True,
    //                     target: list.renderContext().subNodes[2]})
    //     list.onChange({});
    //     this.assertEquals(1, counter.count, 'selection triggered too often');
    // }
    testAddedMorphEndsUpInListItems: function() {
        var list = new lively.morphic.MorphList(new Rectangle(0, 0, 100, 100), ['1', '2', '3']);
        this.assertEquals(['1', '2', '3'], list.itemList);
        // 1) adding a morph should extend the list
        var text1 = new lively.morphic.Text(rect(0,0,20,20), '4');
        list.addMorph(text1);
        this.assertEquals(['1', '2', '3', '4'], list.getItemMorphs().pluck('textString'), 'rendered list 1');
        this.assertMatches(['1', '2', '3', {isListItem: true, string: '4', value: text1}], list.itemList, 'itemList 1');
        // 2) adding a morph with an item propo should use this prop at the listitem spce
        var text2 = new lively.morphic.Text(rect(0,0,20,20), 'five');
        text2.item = {isListItem: true, string: '5', value: 'fünf'}
        list.addMorph(text2);
        this.assertEquals(['1', '2', '3', '4', 'five'], list.getItemMorphs().pluck('textString'), 'rendered list 2');
        this.assertMatches(['1', '2', '3', {isListItem: true, string: '4', value: text1}, text2.item], list.itemList, 'itemList 2');
        // 3) removing affects the list
        text2.remove();
        this.assertEquals(['1', '2', '3', '4'], list.getItemMorphs().pluck('textString'), 'rendered list 3');
        this.assertMatches(['1', '2', '3', {isListItem: true, string: '4', value: text1}], list.itemList, 'itemList 3');
        this.done();
    }
});

}) // end of module