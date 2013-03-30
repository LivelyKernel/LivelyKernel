module('lively.morphic.tests.TextUndoTests').requires('lively.morphic.TextUndo', 'lively.morphic.tests.Helper').toRun(function() {

if (!Config.get("textUndoEnabled")) return;

// These tests are testing the change creation from DOM mutations and
// the undo features based upon that directly. For tests of the
// morphic level see lively.morphic.tests.TextUndoTests.TextUndoTest
AsyncTestCase.subclass('lively.morphic.tests.TextUndoTests.TextMutationUndoTest',
'running', {
    setUp: function($super) {
        this.text = new lively.morphic.Text(new Rectangle(0,0, 100,100), "test");
        this.text.openInWorld();
        if (!Config.get("textUndoEnabled")) {
            Trait("lively.morphic.TextUndo.TextMutationObserverTrait").applyTo(lively.morphic.Text);
            this.text.prepareForTextMutationRecording();
        }
    },
    tearDown: function() {
        this.text.remove();
        if (!Config.get("textUndoEnabled")) {
            Trait("lively.morphic.TextUndo.TextMutationObserverTrait").removeFrom(lively.morphic.Text);
        }
    }
},
'testing', {
    test01TextStringMutationUndo: function() {
        var undoState = this.text.undoState;
        this.assertEquals(0, undoState.changes.length);
        this.delay(function() {
            this.text.firstTextChunk().getChunkNode().childNodes[0].textContent = 'test1';
            this.text.cachedTextString = null;
        }, 0);
        this.delay(function() {
            this.text.firstTextChunk().getChunkNode().childNodes[0].textContent = 'test2';
            this.text.cachedTextString = null;
        }, 0);
        this.delay(function() {
            this.assertEquals(2, undoState.changes.length);
            var mutation = undoState.changes.last();
            this.assertEquals(mutation.isTextChange);
            mutation.undo();
            this.assertEquals('test1', this.text.textString);
            this.assert(undoState.undoInProgress, 'undo in progress is not signaled');
        }, 0);
        this.delay(function() {
            this.assertEquals(1, undoState.changes.length);
            this.assert(!undoState.undoInProgress, 'undo still in progress');
            this.done();
        }, 0);
    },

    test02BoldUndo: function() {
        var undoState = this.text.undoState;
        this.text.firstTextChunk().getChunkNode().childNodes[0].textContent = 'abc';
        this.text.cachedTextString = null;
        this.delay(function() {
            this.text.emphasize({fontWeight: 'bold'}, 1, 2);
        }, 0);
        this.delay(function() {
            this.assertEquals(2, undoState.changes.length);
            this.assertEqualState({fontWeight: 'bold'}, this.text.getEmphasisAt(1));
            this.assertEqualState(3, this.text.getTextChunks().length);
            undoState.changes.last().undo();
            this.assertEqualState({}, this.text.getEmphasisAt(1));
            this.assertEquals(1, this.text.getTextChunks().length);
            this.assertEquals('abc', this.text.textString);
            this.done();
        }, 0);
    },

    test03ChunkSplitStartUndo: function() {
        var undoState = this.text.undoState;
        this.text.firstTextChunk().getChunkNode().childNodes[0].textContent = 'abc';
        this.text.cachedTextString = null;
        this.delay(function() {
            this.text.emphasize({fontWeight: 'bold'}, 0, 1);
        }, 0);
        this.delay(function() {
            this.assertEquals(2, undoState.changes.length, 'no of changes before undo');
            this.assertEqualState({fontWeight: 'bold'}, this.text.getEmphasisAt(0));
            this.assertEqualState(2, this.text.getTextChunks().length, 'no of text chunks before undo');
            undoState.changes.last().undo();
            this.assertEquals(1, this.text.renderContext().textNode.childNodes.length, 'textNode child count');
            this.assertEquals('', this.text.getTextChunks()[0].getChunkNode().style.fontWeight, 'chunk style');
            this.assertEqualState({}, this.text.getEmphasisAt(0), 'emph after undo');
            this.assertEquals(1, this.text.getTextChunks().length, 'no of text chunks after undo');
            this.assertEquals('abc', this.text.textString);
            this.done();
        }, 0);
    },

    test04ChunkSplitEndUndo: function() {
        var undoState = this.text.undoState;
        this.text.firstTextChunk().getChunkNode().childNodes[0].textContent = 'abc';
        this.text.cachedTextString = null;
        this.delay(function() {
            this.text.emphasize({fontWeight: 'bold'}, 2, 3);
        }, 0);
        this.delay(function() {
            this.assertEquals(2, undoState.changes.length);
            this.assertEqualState({fontWeight: 'bold'}, this.text.getEmphasisAt(2));
            this.assertEqualState(2, this.text.getTextChunks().length);
            undoState.changes.last().undo();
            this.assertEqualState({}, this.text.getEmphasisAt(2), 'emph after undo');
            this.assertEquals(1, this.text.getTextChunks().length);
            this.assertEquals('abc', this.text.textString);
            this.done();
        }, 0);
    },

    test05SetTextStringUndo: function() {
        var undoState = this.text.undoState;
        this.text.setTextString('foo');
        this.delay(function() {
            this.assertEquals(1, undoState.changes.length, 'no change recorded for set textString');
            undoState.changes.last().undo();
            this.assertEquals('test', this.text.textString);
            this.done();
        }, 0);
    }
});

// These tests are testing undo (and partially change recording) at
// the text morph level
AsyncTestCase.subclass('lively.morphic.tests.TextUndoTests.TextUndoTest',
'running', {
    setUp: function($super) {
        this.text = new lively.morphic.Text(new Rectangle(0,0, 100,100), "test");
        this.text.openInWorld();
    },
    tearDown: function() {
        this.text.remove();
    },
    shouldRun: Config.textUndoEnabled
},
'testing', {
    test01SimpleTextUndo: function() {
        this.text.setTextString('Foo');
        this.delay(function() { this.text.textString = 'Bar' }, 0);
        this.delay(function() {
            this.text.undo();
            this.assertEquals('Foo', this.text.textString, 'undo 1');
            this.done();
        }, 0);
    },

    test02UndoStyle: function() {
        this.text.textString = 'Foo';
        this.text.emphasizeAll({fontWeight: 'bold'});
        this.delay(function() {
            this.text.emphasizeAll({fontWeight: 'normal' });
        }, 0);
        this.delay(function() {
            this.text.undo();
            this.assertEquals('Foo', this.text.textString);
            this.assertEquals(this.text.getTextChunks()[0].getChunkNode().style.fontWeight, "bold", "chunk node style");
            var emph = this.text.getEmphasisAt(0);
            this.assertEqualState({fontWeight: 'bold'}, emph);
            this.done();
        }, 0);
    },

    xtest03UndoListEmpty: function() {
        this.text.textString = 'Bar';
        this.delay(function() {
            this.text.undo();
            this.text.undo();
            this.text.undo();
            this.text.undo();
            this.assertEquals(1, this.text.undoState.idx);
            this.assertEquals('test', this.text.textString);
            this.done();
        }, 0);
    },

    xtest04TruncateUndoHistory: function() {
        var length;
        this.text.textString = 'Bar';
        this.delay(function() { this.text.textString = 'Foo' }, 0);
        this.delay(function() {
            this.assertEquals(3, this.text.undoState.undos.length);
            length = this.text.undoState.undos.length;
            this.text.undo();
            this.assertEquals(3, this.text.undoState.undos.length,
                'undos truncated with simple undo');
            // now make a change that should truncate undos:
            this.text.textString = 'Baz';
        }, 10);
        this.delay(function() {
            this.assertEquals(3, this.text.undoState.undos.length,
                'undos not truncated on change after undo');
            this.done();
        }, 20);
    },

    xtest05UndoRestoresSelection: function() {
        this.text.textString = 'Foo';
        this.text.setSelectionRange(1,2);
        this.delay(function() { this.text.textString = 'Bar' }, 0);
        this.delay(function() {
            this.text.undo();
            this.assertEquals('Foo', this.text.textString);
            var sel = this.text.getSelectionRange();
            this.assertMatches([1,2], sel);
            this.done();
        }, 0);
    },

    xtest06maxUndos: function() {
        this.text.undoState.maxUndos = 2;
        this.text.textString = 'Foo';
        this.delay(function() { this.text.textString = 'Bar' }, 0);
        this.delay(function() {
            this.assertEquals(2, this.text.undoState.undos.length);
            this.done();
        }, 0);
    }
});

// test for gathering multiple style mutations and create an own mutation from that
TestCase.subclass("lively.morphic.tests.TextUndoTests.StyleDOMAttributeMutationTest",
'running', {
    setUp: function($super) {
        $super();
        this.target = {attributes: {style: {value: ""}}};
        var baseStyleMutation = {
            type: "attributes",
            attributeName: 'style',
            oldValue: "position: absolute; left: 3px; top: 4px",
            target: this.target
        }
        this.mutations = [
            Object.protoCopy(baseStyleMutation),
            Object.protoCopy(baseStyleMutation)];
    }
},
'testing', {
    test01Creation: function() {
        var result = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]);
        this.assert(result.isStyleMutation, "not a style mutation");
    },

    test02EqualStyles: function() {
        var styleDiffer = lively.morphic.TextUndo.StyleDOMAttributeMutation.prototype,
            style1 = styleDiffer.parseStyleString("position: absolute; left: 3px; top: 4px"),
            style2 = styleDiffer.parseStyleString("position: absolute; top: 4px; left: 3px;"),
            result = styleDiffer.stylesEqual(style1, style2);
        this.assert(result, "styles are not recognized as equal");
    },

    test03UnEqualStyles: function() {
        var styleDiffer = lively.morphic.TextUndo.StyleDOMAttributeMutation.prototype,
            style1 = styleDiffer.parseStyleString("position: absolute; left: 3px; top: 4px"),
            style2 = styleDiffer.parseStyleString("position: absolute; top: 5px; left: 3px;"),
            result = styleDiffer.stylesEqual(style1, style2);
        this.assert(!result, "styles are not recognized as unequal");
    },

    test03aStyleDiff: function() {
        var styleDiffer = lively.morphic.TextUndo.StyleDOMAttributeMutation.prototype,
            style1 = styleDiffer.parseStyleString("position: absolute; left: 3px; top: 4px"),
            style2 = styleDiffer.parseStyleString("position: absolute; top: 5px; left: 3px;"),
            result = styleDiffer.compareStyles(style1, style2);
        this.assertEquals('4px', result.top.a, "did not recognize first diff value");
        this.assertEquals('5px', result.top.b, "did not recognize second diff value");
    },

    test04IsUnchanged: function() {
        this.target.attributes.style.value = this.mutations[0].oldValue;
        var result = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]);
        this.assert(result.isUnchanged(), "should be unchanged");
    },

    test05IsNotUnchanged: function() {
        this.mutations[0].oldValue = "";
        this.target.attributes.style.value = "position: absolute; left: 3px; top: 4px";
        var result = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]);
        this.assert(!result.isUnchanged(), "should not be unchanged");
    },

    test06ConsumesAndIsUnchanged: function() {
        var result = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]);
        this.target.attributes.style.value = "position: absolute; top: 4px; left: 3px;"
        result.consumes(this.mutations[1]);
        this.assert(result.isUnchanged(), "should be unchanged");
    },

    test07ConsumesAndIsNotUnchanged: function() {
        var result = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]);
        this.target.attributes.style.value = "position: absolute; top: 5px; left: 3px;"
        result.consumes(this.mutations[1]);
        this.assert(!result.isUnchanged(), "should not be unchanged");
        this.assertMatches(["top"], result.getChangedStyleNames(), "style diff");
    },

    test08aDiffAttributesChanged: function() {
        this.target.attributes.style.value = "position: absolute; top: 10px; left: 11px;";
        var styleMutation = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]),
            diff = styleMutation.getDiff();
        delete diff._keys;
        this.assertEqualState({top: {a: "4px",
                                     b: "10px"},
                               left: {a: "3px",
                                      b: "11px"}}, diff, "diff");
    },

    test08bDiffAttributesRemoved: function() {
        this.target.attributes.style.value = "position: absolute; left: 3px;";
        var styleMutation = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]),
            diff = styleMutation.getDiff();
        delete diff._keys;
        this.assertEqualState({top: {a: "4px", b: undefined}}, diff, "diff");
    },

    test08cDiffAttributesAdded: function() {
        this.target.attributes.style.value = "position: absolute; top: 4px; left: 3px; bottom: 0px";
        var styleMutation = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]),
            diff = styleMutation.getDiff();
        delete diff._keys;
        this.assertEqualState({bottom: {a: undefined, b: "0px"}}, diff, "diff");
    },

    test09StyleChangesDo: function() {
        this.target.attributes.style.value = "position: relative;"
        var styleMutation = lively.morphic.TextUndo.DOMAttributeMutation.from(this.mutations[0]),
            keys = [], oldValues = [], newValues = [];
        styleMutation.styleChangesDo(function(key, oldValue, newValue) {
            keys.push(key); oldValues.push(oldValue); newValues.push(newValue);
        });
        this.assertEqualState(["position", "left",    "top"], keys, "keys");
        this.assertEqualState(["absolute", "3px",     "4px"], oldValues, "oldValues");
        this.assertEqualState(["relative", undefined, undefined], newValues, "newValues");
    }
});

// test for mutation interface "AtomicDOMChange" that provides an
// interface and extended functionality for DOM mutations
TestCase.subclass("lively.morphic.tests.TextUndoTests.AtomicDOMChangeTest",
'helper', {
    createTargetAndChildNodes: function(n) {
        var childNodes = [],
            target = {childNodes: childNodes},
            nodeProto = {
                toString: function() { return "child " + this.n; },
                get nextSibling() { return target.childNodes[target.childNodes.indexOf(this)+1]; }
            };
        this.target = target;
        Array.range(1, n).forEach(function(i) {
            childNodes.push(Object.extend(Object.protoCopy(nodeProto), {n: i}));
            this['childNode' + i] = childNodes.last();
        }, this);
    }
},
'assertions', {
    assertRemoves: function(spec) {
        var test = this, removeCalled = 0, removedNodes = [];
        this.spy(spec.parent, "removeChild", function(node) {
            var index = spec.parent.childNodes.indexOf(node);
            test.assert(index > -1, '#removeChild called with node not in childNode');
            spec.parent.childNodes.splice(index, 1);
            removeCalled++; removedNodes.push(node);
        });
        spec.action.call(this);
        this.assertEquals(spec.removedNodes.length, removeCalled, 'remove called: ' + removeCalled);
        this.assertEqualState(spec.removedNodes, removedNodes, 'remove called with: ' + removedNodes);
    },

    assertInserts: function(spec) {
        var insertCalled = 0, insertedNodes = [], insertIndex;
        this.spy(spec.parent, "insertBefore", function(node, beforeNode) {
            var beforeIndex = spec.parent.childNodes.indexOf(beforeNode);
            if (beforeIndex ===  -1) beforeIndex = spec.parent.childNodes.length;
            if (insertIndex === undefined) insertIndex = beforeIndex;
            spec.parent.childNodes.splice(beforeIndex, 0, node);
            insertCalled++; insertedNodes.push(node);
        });
        spec.action.call(this);
        this.assertEquals(spec.insertedNodes.length, insertCalled, "inserted " + insertCalled);
        this.assertEqualState(spec.insertedNodes, insertedNodes, "inserted node: " + insertedNodes);
        this.assertEquals(spec.insertIndex, insertIndex, "inserted index: " + insertIndex);
    },

    assertReplace: function(spec) {
        this.assertInserts(Object.extend(Object.protoCopy(spec), {
            action: function(test) { this.assertRemoves(spec); }
        }));
    },

    assertAttributeChanged: function(spec) {
        var callCount = 0, attrName, value;
        this.spy(spec.target, "setAttribute", function(thisAttrName, thisValue) {
            callCount++; attrName = thisAttrName; value = thisValue;
        });
        spec.action.call(this);
        this.assertEquals(1, callCount, 'call count');
        this.assertEquals(spec.value, value, 'value');
        this.assertEquals(spec.attributeName, attrName, 'attribute name');
    }
},
'testing', {
    test01CharacterDataRecordAndUndo: function() {
        this.createTargetAndChildNodes(3);
        this.target.textContent = "foo";
        var mutation = {
                type: "characterData",
                oldValue: "bar",
                target: this.target
            },
            atomicDOMChange = lively.morphic.TextUndo.AtomicDOMChange.from(mutation);

        this.assertEquals("bar", atomicDOMChange.oldValue);
        this.assertEquals("foo", atomicDOMChange.newValue);
        this.assertIdentity(this.target, atomicDOMChange.target);

        atomicDOMChange.undo();
        this.assertEquals("bar", this.target.textContent);

        atomicDOMChange.redo();
        this.assertEquals("foo", this.target.textContent);
    },

    test02SingleAddedNote: function() {
        this.createTargetAndChildNodes(3);
        var mutation = {
                type: "childList",
                removedNodes: [],
                addedNodes: [this.childNode2],
                target: this.target
            },
            atomicDOMChange = lively.morphic.TextUndo.AtomicDOMChange.from(mutation);

        this.assertEquals(1, atomicDOMChange.nodeIndex);
        this.assertIdentity(this.childNode2, atomicDOMChange.addedNodes[0]);
        this.assertIdentity(this.target, atomicDOMChange.target);

        this.assertRemoves({
            parent: this.target, removedNodes: [this.childNode2],
            action: function() { atomicDOMChange.undo(); }
        });

        this.assertInserts({
            parent: this.target, insertedNodes: [this.childNode2], insertIndex: 1,
            action: function() { atomicDOMChange.redo(); }
        });
    },

    test03aSingleRemovedNodeWithPreviousSibling: function() {
        this.createTargetAndChildNodes(3);
        this.target.childNodes = [this.childNode1, this.childNode3];
        var mutation = {
                type: "childList",
                addedNodes: [],
                removedNodes: [this.childNode2],
                target: this.target,
                previousSibling: this.childNode1
            },
            atomicDOMChange = lively.morphic.TextUndo.AtomicDOMChange.from(mutation);

        this.assertMatches([this.childNode2], atomicDOMChange.removedNodes);
        this.assertIdentity(this.target, atomicDOMChange.target);

        this.assertInserts({
            parent: this.target, insertedNodes: [this.childNode2], insertIndex: 1,
            action: function() { atomicDOMChange.undo(); }
        });

        this.assertRemoves({
            parent: this.target, removedNodes: [this.childNode2],
            action: function() { atomicDOMChange.redo(); }
        });
    },

    test03bSingleRemovedNodeWithNextSibling: function() {
        this.createTargetAndChildNodes(3);
        this.target.childNodes = [this.childNode1, this.childNode3];
        var mutation = {
                type: "childList",
                addedNodes: [],
                removedNodes: [this.childNode2],
                target: this.target,
                nextSibling: this.childNode3
            },
            atomicDOMChange = lively.morphic.TextUndo.AtomicDOMChange.from(mutation);

        this.assertEqualState([this.childNode2], atomicDOMChange.removedNodes);
        this.assertIdentity(this.target, atomicDOMChange.target);
        this.assertInserts({
            parent: this.target, insertedNodes: [this.childNode2], insertIndex: 1,
            action: function() { atomicDOMChange.undo(); }
        });

        this.assertRemoves({
            parent: this.target, removedNodes: [this.childNode2],
            action: function() { atomicDOMChange.redo(); }
        });
    },

    test04aReplacedNode: function() {
        this.createTargetAndChildNodes(3);
        this.target.childNodes = [this.childNode2, this.childNode3];
        var mutation = {
                type: "childList",
                addedNodes: [this.childNode2],
                removedNodes: [this.childNode1],
                target: this.target
            },
            atomicDOMChange = lively.morphic.TextUndo.AtomicDOMChange.from(mutation);

        this.assertEqualState([this.childNode2], atomicDOMChange.addedNodes, 'addedNode');
        this.assertEqualState([this.childNode1], atomicDOMChange.removedNodes, 'removedNode');
        this.assertIdentity(this.target, atomicDOMChange.target, 'target');

        this.assertReplace({
            parent: this.target,
            insertedNodes: [this.childNode1], insertIndex: 0, removedNodes: [this.childNode2],
            action: function() { atomicDOMChange.undo(); }
        });

        this.assertReplace({
            parent: this.target,
            insertedNodes: [this.childNode2], insertIndex: 0, removedNodes: [this.childNode1],
            action: function() { atomicDOMChange.redo(); }
        });
    },

    test04bReplacedMultipleNodes: function() {
        this.createTargetAndChildNodes(5);
        this.target.childNodes = [this.childNode4, this.childNode5];
        var mutation = {
                type: "childList",
                addedNodes: [this.childNode5],
                removedNodes: [this.childNode1, this.childNode2, this.childNode3],
                target: this.target
            },
            atomicDOMChange = lively.morphic.TextUndo.AtomicDOMChange.from(mutation);

        this.assertEqualState([this.childNode5], atomicDOMChange.addedNodes, 'addedNode');
        this.assertEqualState([this.childNode1, this.childNode2, this.childNode3], atomicDOMChange.removedNodes, 'removedNode');
        this.assertIdentity(this.target, atomicDOMChange.target, 'target');

        this.assertReplace({
            parent: this.target, insertedNodes: [this.childNode1, this.childNode2, this.childNode3],
            insertIndex: 1, removedNodes: [this.childNode5],
            action: function() { atomicDOMChange.undo(); }
        });

        this.assertReplace({
            parent: this.target, insertedNodes: [this.childNode5],
            insertIndex: 1, removedNodes: [this.childNode1, this.childNode2, this.childNode3],
            action: function() { atomicDOMChange.redo(); }
        });
    },

    test05StyleChangeRecordAndUndo: function() {
        this.createTargetAndChildNodes(3);
        var mutation = {
                type: "attributes",
                attribute: "style",
                newValue: "font-weight: bold; text-decoration: underline; outline: none; ",
                oldValue: "text-decoration: none; font-weight: bold; outline: none; ",
                target: this.childNode1
            },
            atomicDOMChange = lively.morphic.TextUndo.AtomicDOMChange.from(mutation);

        this.assertEquals('style', atomicDOMChange.attribute);
        this.assertIdentity(this.childNode1, atomicDOMChange.target);

        this.assertAttributeChanged({
            target: this.childNode1,
            attributeName: "style",
            value: "text-decoration: none; font-weight: bold; outline: none; ",
            action: function() { atomicDOMChange.undo(); }
        });

        this.assertAttributeChanged({
            target: this.childNode1,
            attributeName: "style",
            value: "font-weight: bold; text-decoration: underline; outline: none; ",
            action: function() { atomicDOMChange.redo(); }
        });

    },

    test06StyleDOMAttributeMutationRecordAndUndo: function() {
        this.createTargetAndChildNodes(3);
        this.target.attributes = {style: {value: "font-weight: bold; text-decoration: underline; outline: none; "}};
        var mutation = new lively.morphic.TextUndo.StyleDOMAttributeMutation({
                type: "attributes",
                attributeName: "style",
                oldValue: "text-decoration: none; font-weight: bold; outline: none; ",
                target: this.target
            }),
            atomicDOMChange = lively.morphic.TextUndo.AtomicDOMChange.from(mutation);

        this.assertEquals('style', atomicDOMChange.attribute);
        this.assertIdentity(this.target, atomicDOMChange.target);

        this.assertAttributeChanged({
            target: this.target,
            attributeName: "style",
            value: "text-decoration: none; font-weight: bold; outline: none; ",
            action: function() { atomicDOMChange.undo(); }
        });

        this.assertAttributeChanged({
            target: this.target,
            attributeName: "style",
            value: "font-weight: bold; text-decoration: underline; outline: none; ",
            action: function() { atomicDOMChange.redo(); }
        });

    }

});

}) // end of module
