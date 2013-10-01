module('lively.morphic.tests.Lists').requires('lively.morphic.tests.Helper', 'lively.morphic.Layout').toRun(function() {

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

    testMoveItemToIndex: function() {
        var morph = this.world.addMorph(new lively.morphic.MorphList(lively.rect(0, 0, 100, 100), [
            {isListItem: true, string: 'foo', value: 23},
            {isListItem: true, string: 'baz', value: 24},
            {isListItem: true, string: 'bar', value: 25}]));
        morph.moveItemToIndex(24, 2);

        this.assertEquals(3, morph.itemList.length, 'list length')

        this.assertEquals([23, 25, 24], morph.itemList.pluck('value'), 'order of list values')

        this.assertEquals(['foo', 'bar', 'baz'], morph.submorphs.pluck('textString'),
            'order of rendered item strings (submorphs)')

        this.assertEquals(['foo', 'bar', 'baz'], morph.itemMorphs.pluck('textString'),
            'order of rendered item strings (itemMorphs)')

        var yPositions = morph.itemMorphs.invoke('getPosition').pluck('y');
        this.assert(yPositions[0] < yPositions[1], 'pos 0 and 1');
        this.assert(yPositions[1] < yPositions[2], 'pos 1 and 2');
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

AsyncTestCase.subclass('lively.morphic.tests.Lists.List', lively.morphic.tests.MorphTests.prototype,
'running', {
    setUp: function($super) {
        $super();
        // this.createWorld();
    }
},
'testing', {
    // lively.morphic.tests.Lists.MorphicList.remove()
    test01SetAndRetrieveStringItems: function() {
        var list = new lively.morphic.List(new Rectangle(0, 0, 100, 100), ['1', '2', '3']);
        this.assertEquals(['1', '2', '3'], list.itemList);
        this.assertEquals(['1', '2', '3'], list.getItemMorphs().pluck('textString'), 'rendered list 1');
        list.updateList(['foo']);
        this.assertEquals(['foo'], list.itemList);
        this.assertEquals(['foo'], list.getItemMorphs().pluck('textString'), 'rendered list 2');
        this.done();
    },

    test02SelectAtSingleSelection: function() {
        var morph = new lively.morphic.List(['first', 'second']);
        morph.selectAt(1);
        this.assertEquals('second', morph.selection, 'selection');
        var itemMorphs = morph.getItemMorphs();
        this.assert(itemMorphs[1].hasStyleClassName('selected'), 'item not rendered as selected 1');
        this.assert(!itemMorphs[0].hasStyleClassName('selected'), 'item rendered as selected 1');
        morph.selectAt(0);
        this.assertEquals('first', morph.selection, 'selection 2');
        this.assert(!itemMorphs[1].hasStyleClassName('selected'), 'item rendered as selected 2');
        this.assert(itemMorphs[0].hasStyleClassName('selected'), 'item not rendered as selected 2');
        this.done();
    },

    test03SelectListItem: function() {
        var morph = new lively.morphic.List(new Rectangle (0, 0, 100, 100));
        morph.updateList([
            {isListItem: true, string: 'foo', value: 23},
            {isListItem: true, string: 'bar', value: 24}])
        morph.selectAt(1);
        this.assertEquals(24, morph.selection);
        this.assertEquals(['foo', 'bar'], morph.getItemMorphs().pluck('textString'), 'itemmorph texts');
        this.done();
    },

    test05ListMorphKeepsSelectionHighlightOnUpdateList: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100));
        this.onTearDown(function() { list.remove(); });
        lively.morphic.World.current().addMorph(list);

        list.updateList([1,2,3]);
        list.setSelection(2);
        list.updateList([1,2,3]);

        this.assert(list.getItemMorphs()[1].hasStyleClassName('selected'), 'selection not rendered');
        this.done();
    },

    test06SetSelectionWithListItems: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
            items = [{isListItem: true, string: 'foo', value: 23}];
        list.updateList(items);
        list.setSelection(23);
        this.assertEquals(0, list.selectedLineNo);
        this.done();
    },

    testUnselectAll: function() {
        var list = new lively.morphic.List(lively.rect(0, 0, 100, 100), [1,2,3,4]);
        list.setSelection(3);
        this.assertEquals([2], list.selectedIndexes, "selectedIndexes");
        this.assertEquals(2, list.selectedLineNo, "selectedLineNo");
        var selected = list.getItemMorphs().select(function(ea) { return ea.hasStyleClassName('selected'); });
        this.assertEquals(1, selected.length, 'selection not rendered 2');
        this.assert(list.getItemMorphs()[2].hasStyleClassName('selected'), 'selection not rendered');
        list.clearSelections();
        this.assertEquals([], list.selectedIndexes, "selectedIndexes 2");
        this.assertEquals(null, list.selectedLineNo, "selectedLineNo 2");
        selected = list.getItemMorphs().invoke("hasStyleClassName", 'selected').compact();
        this.assertEquals(0, selected.length, 'selection still rendered');
        this.done();
    },

    testUpdateListOnSelectionHighlightsSelectionCorrectly: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100)),
            items = [1, 2, 3];
        this.onTearDown(function() { list.remove(); });
        lively.morphic.World.current().addMorph(list);

        list.updateList(items);
        list.setSelection(2);
        this.assertEquals(1, list.selectedLineNo);

        lively.bindings.connect(list, 'selection', list, 'onSelect');
        list.addScript(function onSelect(sel) { this.updateList(this.getList()) });

        list.setSelection(3);
        this.assertEquals(2, list.selectedLineNo);
        this.assert(list.getItemMorphs()[2].hasStyleClassName('selected'), 'selection not rendered');
        this.done();
    },

    testListScrollIndexIntoView: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 50), [1, 2, 3, 4, 5]);
        this.onTearDown(function() { list.remove(); });
        lively.morphic.World.current().addMorph(list);

        var scroll = list.getScroll(),
            expectedScroll = [0,0];
        this.assertEquals(expectedScroll, scroll, 'scroll 1');
        list.scrollIndexIntoView(4);

        scroll = list.getScroll(),
        expectedScroll = [0,(list.layout.listItemHeight * 5/*bottom*/)-list.getExtent().y];
        this.assertEquals(expectedScroll, scroll, 'scroll 2');

        // this gets delayed
        list.setSelection(2);
        this.delay(function() {
            scroll = list.getScroll();
            expectedScroll = [0,list.layout.listItemHeight * 1];
            this.assertEquals(expectedScroll, scroll, 'scroll 3');
            this.done();
        }, 0);
    }

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
});

}) // end of module