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

    test02bDeselectAt: function() {
        var morph = new lively.morphic.MorphList(['first', 'second']);
        this.world.addMorph(morph);
        morph.selectAt(1);
        this.assertEquals('second', morph.selection, 'selection');
        morph.deselectAt(1);
        this.assertEquals(null, morph.selection, 'deselection');
        var itemMorphs = morph.getItemMorphs();
        this.assert(!itemMorphs[1].hasStyleClassName('selected'), 'selection css class');
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

    // test05ListMorphKeepsSelectionHighlightOnUpdateList: function() {
    //     var list = new lively.morphic.MorphList(new Rectangle (0, 0, 100, 100));
    //     this.world.addMorph(list);

    //     list.updateList([1,2,3]);
    //     list.setSelection(2);
    //     list.updateList([1,2,3]);

    //     var listItemMorphs = list.getSelectedItemMorphs();
    //     this.assertEquals(1, listItemMorphs.length, 'selection not kept?');
    //     this.assertEquals('2', listItemMorphs[0].textString, 'selected imte morph not correct?');
    // },

    test06SetSelectionWithListItems: function() {
        var list = new lively.morphic.MorphList(new Rectangle (0, 0, 100, 100)),
            items = [{isListItem: true, string: 'foo', value: 23}];
        this.world.addMorph(list);

        list.updateList(items);
        list.setSelection(23);

        this.assertEquals(0, list.selectedLineNo);
        this.done();
    },

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
    },

    testReorderingMorphsAffectsItemList: function() {
        var list = new lively.morphic.MorphList(new Rectangle(0, 0, 100, 100), ['1', '2', '3']);
        this.assertEquals(['1', '2', '3'], list.itemList);
        var itemMorph = list.getItemMorphs().last(); // 3
        this.assertEquals("3", itemMorph.textString, 'setup error?');
        itemMorph.remove();
        list.addMorph(itemMorph, list.getItemMorphs().first()/*1*/);
        this.assertEquals(['3', '1', '2'], list.getItemMorphs().pluck('textString'), 'rendered list');
        this.done()
    },

    testhasOwnListItemBehavior: function() {
        var list = new lively.morphic.MorphList(new lively.Rectangle(0, 0, 200, 100)),
            self = this;
        list.addScript(function renderFunction(listItem) {
            var string = listItem.string || String(listItem),
                morph =  new lively.morphic.Box(new lively.Rectangle(0, 0, 80, 19)),
                text = lively.morphic.Text.makeLabel(string, {
                    position: pt(0, 0),
                    extent: pt(80, 19),
                });
            morph.isListItemMorph = true;
            morph.addMorph(text);
            morph.item = listItem;
            morph.id = 0;
            return morph;
        });
        list.addItem("0");
        var clickable = list.submorphs[0].submorphs[0];
        var evt = {
            getTargetMorph: function() { return clickable },
            stop: Functions.Empty,
            isCommandKey: Functions.False,
            isShiftDown: Functions.False
        }

        // first case: the clicked item has behavior
        clickable.hasOwnListItemBehavior = true;
        list.onMouseDown(evt);
        list.onMouseUp(evt);
        this.assert(!list.selection, "no element should be selected 01")

        // second case: the whole morph wants all clicks to go to it or its submorphs
        delete clickable.hasOwnListItemBehavior;
        clickable.owner.hasOwnListItemBehavior = true;
        list.onMouseDown(evt);
        list.onMouseUp(evt);
        this.assert(!list.selection, "no element should be selected 02")

        this.done()
    },
});

AsyncTestCase.subclass('lively.morphic.tests.Lists.List',
'testing', {

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
    },

    testListResizesItsGuts: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 50), [1, 2, 3, 4, 5]);
        this.onTearDown(function() { list.remove(); });
        lively.morphic.World.current().addMorph(list);
        list.setExtent(pt(80,100));
        var expectedWidth = 80 - list.getScrollBarExtent().x;
        this.assertEquals(
            pt(expectedWidth,list.layout.listItemHeight*5+4/*magic!*/),
            list.listItemContainer.getExtent(),
            'list item container');
        this.assertEquals(
            pt(80,list.layout.listItemHeight),
            list.listItemContainer.submorphs[1].getExtent(),
            'list item');
        this.done();
    },
    testListResizeUpdatesRenderedItems: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 20), [1, 2, 3, 4, 5]);
        this.onTearDown(function() { list.remove(); });
        lively.morphic.World.current().addMorph(list);
        list.setExtent(pt(80, (list.itemList.length+1)*list.layout.listItemHeight));
        this.delay(function() {
            this.assertEquals(5,list.getItemMorphs().length,'# rendered list items');
            this.done();
        }, 100);
    },
    testSetListSignalsSelectionChangeIfItemIsNotInNewList: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), [1, 2, 3]);
        this.onTearDown(function() { list.remove(); });
        lively.morphic.World.current().addMorph(list);
        var changeCalled = 0;
        var testObj = {onSelectionChanged: function() { changeCalled++ }};
        lively.bindings.connect(list, 'selection', testObj, 'onSelectionChanged');

        list.updateList(['a', 'b', 'c']);
        this.assertEquals(0, changeCalled, 'list had no selection but change triggered');

        list.selectAt(1);
        list.updateList([1,2,3]);
        this.assertEquals(
            2/*twice: 1) selectAt, 2)setList*/,
            changeCalled, 'list had selection but no change triggered');
        this.done();
    },
    testListWithNoItemsRendersNothing: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), [1, 2, 3]);
        this.onTearDown(function() { list.remove(); });
        lively.morphic.World.current().addMorph(list);
        var renderedItems = 0;
        list.renderFunction = list.renderFunction.wrap(function(proceed, item) {
            renderedItems++; return proceed(item); })
        list.setList([]);
        this.assertEquals(0, renderedItems, 'no items should be rendered');
        var itemMorphsWithText = list
            .withAllSubmorphsDo(Functions.K)
            .filterByKey('isText')
            .select(function(ea) { return ea.textString.length; });
        this.assertEquals(0, itemMorphsWithText.length, 'no item morphs should have text');
        this.done();
    },

    testMoveItems: function() {
        var list = new lively.morphic.List(new Rectangle (0, 0, 100, 100), [1, 2, 3]);
        this.onTearDown(function() { list.remove(); });
        lively.morphic.World.current().addMorph(list);
        list.moveItemToIndex(1, 2);
        this.assertEquals([3,2,1], list.getList(), 'move not working');
        list.selectAt(1);
        this.assertEquals(2, list.getSelection(), 'sel not working');
        list.moveUpInList(2, true);
        this.assertEquals([2,3, 1], list.getList(), 'move up not working');
        this.assertEquals(2, list.getSelection(), 'sel 2 not working');
        this.done();
    },

    testSelectAll: function() {
        var list = new lively.morphic.List(lively.rect(0, 0, 100, 100), [1,2,3,4]);
        list.selectAll();
        this.assertEquals([], list.selectedIndexes, "selectedIndexes, no multi select");
        list.enableMultipleSelections();
        list.selectAll();
        this.assertEquals([0,1,2,3], list.selectedIndexes, "selectedIndexes, no multi select");
        this.done();
    },

    testAddCSSClassesToItems: function() {
        var items = [
                {isListItem: true, string: 'a', value: 1, cssClassNames: ['foo', 'bar']},
                {isListItem: true, string: 'b', value: 2, cssClassNames: ['foo', 'baz']}],
            list = new lively.morphic.List(lively.rect(0, 0, 100, 100), items);

        var cssClasses1 = list.getItemMorphs()
            .invoke('getStyleClassNames')
            .invoke('withoutAll', ['Morph', 'Text']),
            expected1 = [['foo', 'bar', 'list-item'], ['foo', 'baz', 'list-item']];
        this.assertEquals(expected1, cssClasses1, 'cssClasses 1');

        list.saveSelectAt(1)
        var cssClasses2 = list.getItemMorphs()
            .invoke('getStyleClassNames')
            .invoke('withoutAll', ['Morph', 'Text']),
            expected2 = [['foo', 'bar', 'list-item'], ['foo', 'baz', 'selected', 'list-item']];
        this.assertEquals(expected2, cssClasses2, 'cssClasses 2');

        this.done();
    },

    testKeepSelectionWhenListChanges: function() {
        var list = new lively.morphic.List(lively.rect(0, 0, 100, 100), [1,2,3,4]);
        list.saveSelectAt(1);
        this.assertEquals([2], list.getSelections(), 1);
        list.setList([1,2,3,4]);
        this.assertEquals([2], list.getSelections(), 2);
        list.saveSelectAt(3);
        list.setList([1,2,3]);
        this.assertEquals([], list.getSelections(), 3 + Objects.inspect(list.getSelections()));
        this.done();
    },

    testKeepSelectionWhenListChangesInMultiSelectionList: function() {
        var list = new lively.morphic.List(lively.rect(0, 0, 100, 100), [1,2,3,4]);
        list.enableMultipleSelections();
        list.selectAll();
        list.setList([1,2,3]);
        this.assertEquals([1,2,3], list.getSelections(), 1);
        
        list.deselectAll();
        list.saveSelectAt(2);
        list.setList([3,4,5]);
        this.assertEquals([3], list.getSelections(), 2);
        this.done();
    },

    testSetSelectionMatching: function() {
        var list = new lively.morphic.List(lively.rect(0, 0, 100, 100), ['1', '2', '344444']);
        list.setSelectionMatching("2");
        this.assertEquals("2", list.selection);
        list.setSelectionMatching(/4+/);
        this.assertEquals("344444", list.selection);
        this.done();
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
