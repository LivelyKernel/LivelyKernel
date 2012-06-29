module('lively.morphic.TextUndo').requires('lively.morphic.TextCore', 'lively.morphic.tests.Helper').toRun(function() {

Object.subclass('lively.morphic.TextUndo.TextUndo',
'initializing', {
    initialize: function(settings) {
        this.type = 'unknown';
        this.text = settings.text;
        this.undoFunc = settings.undo;
        delete settings.undo;
        Object.extend(this, settings);
    }
},
'undoing', {
    undo: function() {
        var text = this.text;
        if (this.undoFunc) {
            text.undoState.undoInProgress = true;
            this.undoFunc();
        }
    }
},
'debugging', {
    toString: function() {
        return 'TextUndo<' + this.type + '>';
    }
});

Object.extend(lively.morphic.TextUndo.TextUndo, {
    forText: function(text, settings) {
        if (!settings.text) settings.text = text;
        return new this(settings);
    }
});

Trait("lively.morphic.TextUndo.TextMutationObserverTrait", {
    onLoad: function() {
        if (this.prepareForTextMutationRecording) this.prepareForTextMutationRecording();
    },
    prepareForTextMutationRecording: function() {
        if (this.undoState) { return; }
        if (!lively.morphic.Events.MutationObserver) {
            console.error('Trying to enable undo but no MutationObserver was found');
            return;
        }
        this.doNotSerialize = ['undoState'];
        this.undoState = {
            changes: [],
            recordingErrors: []
        };
        this.observeTextChangesExpt();
LastMutations = [];
basicUndos = this.undoState.changes;
    },
    observeTextChangesExpt: function() {
        var self = this,
            textNode = this.renderContext().textNode,
            observer = new lively.morphic.Events.MutationObserver(function(mutations, observer) {
                return self.onTextChangeExpt(mutations, observer); });
        observer.observe(textNode, {
            characterData: true,
            characterDataOldValue: true,
            attributes: true,
            attributeOldValue: true,
            subtree: true,
            childList: true
        });
    },
    onTextChangeExpt: function(mutations, observer) {
        if (this.isLabel || this.syntaxHighlightingWhileTyping) { return; }
        var time = Date.now();
        if (500 < (time - this.undoState.lastRecordingTime)) { return; }
        if (this.undoState.undoInProgress) {
            // when doing undo itself we don't want to record mutations
            this.undoState.undoInProgress = false;
            return;
        }
        // alert('onTextChangeExpt ' + mutations);
LastMutations.push(mutations);
        try {
            this.recordBasicUndo(mutations);
        } catch(e) {
            debugger
            console.error("undo error " + e);
            // this.showMutationsExpt(mutations);
            // Trait("lively.morphic.TextUndo.TextMutationObserverTrait").removeFrom(this.constructor);
            // Trait("lively.morphic.TextUndo.TextMutationObserverTrait").removeFrom(this);
        }
        // alert('onTextChangeExpt end');
    },
    // ---------- recording mutations ------------
    addUndo: function(undoSettings) {
        var undo = lively.morphic.TextUndo.TextUndo.forText(this, undoSettings);
        this.undoState.changes.push(undo);
    },
    recordBasicUndo: function(mutations) {
        mutations = this.normalizeMutations(mutations);
        if (!mutations || mutations.length == 0) return;
        if (this.isUnimportant(mutations)) { return };

        // this.showMutationsExpt(mutations);

        if (this.isTextAttributeChange(mutations)) {
            this.recordTextAttributeChange(mutations);
        } else if (this.isChunkTextStringChange(mutations)) {
            this.recordChunkTextStringChange(mutations);
        } else if (this.isSetTextStringChange(mutations)) {
            this.recordSetTextStringChange(mutations);
        } else if (this.isChunkSplit(mutations)) {
            this.recordChunkSplit(mutations);
        } else if (this.isChunkSplitAtBorder(mutations)) {
            this.recordChunkSplitAtBorder(mutations);
        } else if (this.isChunkMerge(mutations)) {
            this.recordChunkMerge(mutations);
        } else if (this.isChunkMergeAtBorder(mutations)) {
            this.recordChunkMergeAtBorder(mutations);
        } else {
            debugger;
            console.error('unrecognized text change');
            // this.showMutationsExpt(mutations);
            this.undoState.recordingErrors.push(mutations);
        }
    },
    normalizeMutations: function(mutations) {
        var complexMutation = null,
            normalizedMutations = [],
            rawMutation;
        for (var i = 0, len = mutations.length; i < len; i++) {
            rawMutation = mutations[i];
            if (rawMutation.type === "attributes") {
                if (rawMutation.attributeName === "contenteditable") continue;
                if (complexMutation && complexMutation.consumes(rawMutation)) {
                    continue;
                }
                complexMutation = lively.morphic.TextUndo.DOMAttributeMutation.from(rawMutation);
                normalizedMutations.push(complexMutation);
                continue;
            }
            normalizedMutations.push(rawMutation);
        }
        return normalizedMutations.reject(function(ea) {
            return ea.isUnchanged && ea.isUnchanged(); });
    },

    isUnimportant: function(mutations) {
        return mutations.all(function(ea) {
            return ea.isUnimportant && ea.isUnimportant();
        });
    },

    // text attribute changes
    isTextAttributeChange: function(mutations) {
        return mutations.length === 1 && mutations[0].isStyleMutation;
    },
    recordTextAttributeChange: function(mutations) {
        var text = this,
            styleMutation = mutations[0],
            atomicChange = lively.morphic.TextUndo.AtomicDOMChange.from(styleMutation),
            chunkIndex = this.findChunkNodeIndexOf(atomicChange.target),
            chunk = this.getTextChunks()[chunkIndex];

        this.addUndo({
            type: 'textAttributeChange',
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            undo: function() {
                // DOM level:
                atomicChange.undo();
                // morphic level:
                styleMutation.styleChangesDo(function(key, oldValue, newValue) {
                    // key in form: text-weight
                    // transform into JS name: textWeight
                    // for style setter into: setTextWeight
                    var setterName = ('set-' + key).camelize();

                    // /^\s*[0-9]/.test(" 000")

                    if (chunk.style[setterName]) {
                        chunk.style[setterName](oldValue);
                    }

                    text.undoState.changes = text.undoState.changes.without(this);
                });
            }
        });
    },

    // changing textString
    isChunkTextStringChange: function(mutations) {
        if (mutations.length !== 1) return false;
        if (mutations[0].type === 'characterData') return true;
        if (mutations[0].type === 'childList') return Object.isNumber(this.findChunkNodeIndexOf(mutations[0].target));
        return false;
    },
    recordChunkTextStringChange: function(mutations) {
        // mutations record the changes of textNodes of chunk nodes
        // 1. remember the index of the chunk that was changed
        // 2. remember the index of the textNode that was changed (childNode of chunkNode)
        var text = this,
            textMutation = mutations[0],
            domChange = lively.morphic.TextUndo.AtomicDOMChange.from(textMutation),
            textNode = textMutation.target,
            chunkNodeIndex = this.findChunkNodeIndexOfTextNode(textNode),
            chunkNode = this.getTextChunks()[chunkNodeIndex].getChunkNode();
            // index of text in chunk node
            // textNodeIndex = Array.from(chunkNode.childNodes).indexOf(textNode),
            // prevTextString = mutations[0].oldValue || mutations[0].removedNodes[0].textContent;
        this.addUndo({
            type: 'textChunkChange',
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            // chunkNodeIndex: chunkNodeIndex,
            // prevTextString: prevTextString,
            undo: function() {
                domChange.undo();
                debugger
                text.cachedTextString = null;

                // check
                var foundChunkNode = text.getTextChunks()[chunkNodeIndex].getChunkNode();
                lively.assert(foundChunkNode === chunkNode, "text undo: chunkNode changed");
                // chunkNode.childNodes[textNodeIndex].textContent = this.prevTextString;
                text.undoState.changes = text.undoState.changes.without(this);
            }
        });
    },

    isInsertTextNodesChange: function(mutations) {
        var i = 0, chunks = this.getTextChunks();

    },

    isSetTextStringChange: function(mutations) {
        var i = 0, chunks = this.getTextChunks();
        // set textString only leaves one chunk
        if (chunks.length !== 1) return false;

        // at least one removed chunk mutation
        while (mutations[i].type === 'childList'
             && mutations[i].removedNodes.length > 0
             && mutations[i].removedNodes[0].tagName === "span") { i++; }
        if (i === 0) return false;

        // the only chunk node is added
        if (mutations[i].type !== "childList"
          || mutations[i].addedNodes[0] !== chunks[0].getChunkNode()) { return false; }

        // last mutation should be added text node to first chunk
        if (mutations.last().type !== "childList"
          || !Object.isNumber(this.findChunkNodeIndexOfTextNode(mutations.last().addedNodes[0]))) { return false }

        return true;
    },
    recordSetTextStringChange: function(mutations) {
        var i = 0, oldContent = '', text = this;
        // gather the strings from the removed chunks
        while (mutations[i].removedNodes.length > 0 && mutations[i].removedNodes[0].tagName === "span") {
            for (var j = 0, len = mutations[i].removedNodes.length; j < len; j++) {
                oldContent += mutations[i].removedNodes[j].textContent;
            }
            i++;
        }
        this.addUndo({
            type: 'textStringChange',
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            undo: function() {
                // FIXME does not reset style!
                text.textString = oldContent;
                text.undoState.changes = text.undoState.changes.without(this);
            }
        });
    },
    // split
    isChunkSplit: function(mutations) {
        var nonAttributeMutations = mutations.select(function(ea) { return ea.type !== 'attributes' });
        return nonAttributeMutations.length === 4
               && nonAttributeMutations[0].type === 'childList'
               && nonAttributeMutations[0].target.parentNode === this.renderContext().textNode;
    },
    recordChunkSplit: function(mutations) {
        var text = this;
        mutations = mutations.select(function(ea) { return ea.type !== 'attributes' });
        this.addUndo({
            type: 'chunkSplit',
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            splittedChunkNodeIndex: this.findChunkNodeIndexOf(mutations[2].target),
            toString: function() { return this.type },
            undo: function() {
                var idx = this.splittedChunkNodeIndex,
                    chunks = text.getTextChunks();
                chunks[idx-1].textString += chunks[idx].textString + chunks[idx+1].textString;
                chunks[idx].remove();
                chunks[idx+1].remove();
                chunks.splice(idx, 2);
                text.undoState.changes = text.undoState.changes.without(this);
            }
        });
    },
    isChunkSplitAtBorder: function(mutations) {
        var groups = mutations.groupBy(function(ea) { return ea.type === 'attributes' }),
            attributeMutations = groups['true'],
            nonAttributeMutations = groups['false'];
        return nonAttributeMutations
            && nonAttributeMutations.length === 2
            && nonAttributeMutations[0].type === 'childList'
            && nonAttributeMutations[0].target.parentNode === this.renderContext().textNode;
    },
    recordChunkSplitAtBorder: function(mutations) {
        var groups = mutations.groupBy(function(ea) { return ea.type === 'attributes' }),
            attributeMutations = groups['true'],
            nonAttributeMutations = groups['false'];
        var text = this,
            addedNode = attributeMutations.length === 1 ? mutations[1].addedNodes[0] : mutations[0].target,
            idx = this.findChunkNodeIndexOf(addedNode),
            atStart = idx === 0;
        mutations = nonAttributeMutations;
        this.addUndo({
            type: 'chunkSplitAt' + (atStart ? 'Start' : 'End'),
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            splittedChunkNodeIndex: idx,
            undo: function() {
                var idx = this.splittedChunkNodeIndex,
                    chunks = text.getTextChunks();
                if (atStart) {
                    chunks[idx+1].textString = chunks[idx].textString + chunks[idx+1].textString;
                } else {
                    chunks[idx-1].textString += chunks[idx].textString;
                }
                chunks[idx].remove();
                chunks.splice(idx, 1);
                text.undoState.changes = text.undoState.changes.without(this);
            }
        });
    },
    // merge
    isChunkMerge: function(mutations) {
        var nonAttributeMutations = mutations.select(function(ea) { return ea.type !== 'attributes' });
        return nonAttributeMutations.length === 4
               && nonAttributeMutations[0].type === 'childList'
               && nonAttributeMutations[0].target === this.renderContext().textNode;
    },
    recordChunkMerge: function(mutations) {
        mutations = mutations.select(function(ea) { return ea.type !== 'attributes' });
        this.addUndo({
            type: 'chunkMerge',
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            mergedChunkNodeIndex: this.findChunkNodeIndexOf(mutations[1].target),
            chunkTextStrings: [mutations[1].removedNodes[0].textContent,
                               mutations[0].target.textContent,
                               mutations[2].removedNodes[0].textContent]
        });
    },
    isChunkMergeAtBorder: function(mutations) {
        var groups = mutations.groupBy(function(ea) { return ea.type === 'attributes' }),
            attributeMutations = groups['true'],
            nonAttributeMutations = groups['false'];
        return nonAttributeMutations
            && nonAttributeMutations.length === 2
            && nonAttributeMutations[0].type === 'childList'
            && nonAttributeMutations[0].target === this.renderContext().textNode;
    },
    recordChunkMergeAtBorder: function(mutations) {
        mutations = mutations.select(function(ea) { return ea.type !== 'attributes' });
        var atStart = mutations[0].target === this.get;
        this.addUndo({
            type: 'chunkMergeAt' + (atStart ? 'Start' : 'End'),
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            mergedChunkNodeIndex: this.findChunkNodeIndexOf(mutations[1].target),
            chunkTextStrings: [mutations[1].removedNodes[0].textContent,
                               mutations[0].removedNodes[0].textContent]
        });
    },

    findChunkNodeIndexOfTextNode: function(textNode) {
        return textNode && this.findChunkNodeIndexOf(textNode.parentNode);
    },

    findChunkNodeIndexOf: function(node) {
        if (!node) return null;
        var n, chunk = this.getTextChunks().detect(function(chunk, i) {
            n = i;
            return node === chunk.getChunkNode();
        });
        return chunk && n;
    },

    // ----------- reporting ----------------
    showMutationsExpt: function(mutations) {
        var msg;
        try {
            msg = mutations.collect(function(m, i) {
                return this.printMutation(m, i);
            }, this).join('\n');
        } catch(e) {
            msg = String(e);
        }
        console.log(msg);
        // var t = this.get('mutations');
        // if (t) {
        //     t.textString = msg + '\n==========\n' + t.textString;
        // }
        return msg;
    },

    printMutation: function(m, i) {
        var msg = (i + 1) + ' (' + m.type + '):';
        return msg + this['print' + Strings.camelCaseString(m.type) + 'Mutation'](m, i);
    },

    printChildListMutation: function(m, i) {
        var msg = '\n\t' + this.printNode(m.target) + ' changed',
            addedNodeStrings = Array.from(m.addedNodes).collect(function(node) {
                return this.printNode(node);
            }, this);
        if (addedNodeStrings.length > 0 ) {
            msg += '\n\taddedNodes:\n\t\t' + addedNodeStrings.join('\n\t\t');
        }
        var removedNodeStrings = Array.from(m.removedNodes).collect(function(node) {
            return this.printNode(node);
        }, this);
        if (removedNodeStrings.length > 0 ) {
            msg += '\n\tremovedNodes:\n\t\t' + removedNodeStrings.join('\n\t\t');
        }
        if (m.nextSibling) {
            msg += '\n\tnextSibling: ' + this.printNode(m.nextSibling);
        }
        if (m.previousSibling) {
            msg += '\n\tpreviousSibling: ' + this.printNode(m.previousSibling);
        }
        return msg;
    },
    printCharacterDataMutation: function(m, i) {
        return '\n\t' + this.printNode(m.target) + ' changed'
             + '\n\tnewValue:' + m.target.textContent
             + '\n\toldValue:' + m.oldValue;
    },
    printAttributesMutation: function(m, i) {
        return '\n\t' + this.printNode(m.target) + ' changed'
             + '\n\tattribute: ' + m.attributeName
             + '\n\tnewValue: "' + m.target.attributes[m.attributeName].value + '"'
             + '\n\toldValue: "' + m.oldValue + '"';
    },
    printNode: function(node) {
        if (this.renderContext().textNode === node) {
            return 'textNode';
        } else if (Object.isNumber(this.findChunkNodeIndexOf(node))) {
            return 'chunkNode[' + this.findChunkNodeIndexOf(node) + ']';
        } else if (Object.isNumber(this.findChunkNodeIndexOfTextNode(node))) {
            var chunkIndex = this.findChunkNodeIndexOf(node.parentNode),
                chunkNode = this.getTextChunks()[chunkIndex].getChunkNode(),
                textNodeIndex = Array.from(chunkNode.childNodes).indexOf(node);
            if (textNodeIndex === -1) textNodeIndex = "?";
            return Strings.format('chunkNode[%s].textNode[%s]',
                                  this.findChunkNodeIndexOfTextNode(node),
                                  textNodeIndex);
        } else {
            return 'unknown node: (' + node.nodeName + '): ' + Exporter.stringify(node);
        }
    },

    // text interface
    undo: function() {
        var lastChange = this.undoState.changes.last();
        lastChange && lastChange.undo();
    }

});

Object.subclass("lively.morphic.TextUndo.DOMAttributeMutation",
'initializing', {
    initialize: function(mutation) {
        this.type = mutation.type;
        this.attribute = mutation.attributeName;
        this.mutation = mutation;
        this.oldValue = mutation.oldValue;
        this.newValue = mutation.target.attributes[mutation.attributeName].value;
        this.target = mutation.target;
        this.attributeName = mutation.attributeName;
    },

    consumes: function(mutation) {
        if (mutation.target === this.target && mutation.attributeName === this.attributeName) {
            this.newValue = mutation.target.attributes[mutation.attributeName].value;
            return this;
        }
        return null;
    }

},
'testing', {
    isUnchanged: function() {
        // FIXME if for example order of CSS attrs changes we need a more
        // complex check
        return this.oldValue === this.newValue;
    }
});

lively.morphic.TextUndo.DOMAttributeMutation.subclass("lively.morphic.TextUndo.StyleDOMAttributeMutation",
'settings', {
    isStyleMutation: true
},
'initializing', {
    consumes: function($super, mutation) {
        var result = $super(mutation);
        if (result) {
            delete this.newStyle;
        }
        return result;
    }
},
'style handling', {

    parseStyleString: function(string) {
        var obj = {};
        string = string || '';
        string.split(';').forEach(function(subStr) {
            var splitted = subStr.split(':'),
                key = Strings.removeSurroundingWhitespaces(splitted[0]),
                val = splitted[1] ? Strings.removeSurroundingWhitespaces(splitted[1]) : '';
            if (key && key != '') obj[key] = val;
        });
        return obj;
    },

    compareStyles: function(style1, style2) {
        var diff = {_keys: []},
            stylesDiffer = false,
            keys = Properties.own(style1).concat(Properties.own(style2)).uniq();
        keys.forEach(function(key) {
            if (style1[key] != style2[key]) {
                stylesDiffer = true;
                diff[key] = {a: style1[key], b: style2[key]};
                diff._keys.push(key);
            }
        });
        return stylesDiffer ? diff : null;
    },

    stylesEqual: function(style1, style2) {
        return !this.compareStyles(style1, style2);
    },

    getOldStyle: function() {
        return this.oldStyle = this.oldStyle || this.parseStyleString(this.oldValue);
    },

    getNewStyle: function() {
        return this.newStyle = this.newStyle || this.parseStyleString(this.newValue);
    },

    getDiff: function() {
        return this.compareStyles(this.getOldStyle(), this.getNewStyle());
    },

    styleChangesDo: function(iterator, context) {
        var diff = this.getDiff();
        if (!diff) return;
        Properties.forEachOwn(this.getDiff(), function(key, diff) {
            if (key === "_keys") return;
            iterator.call(this, key, diff.a, diff.b);
        }, context);
    }

},
'testing', {

    isUnchanged: function() {
        // FIXME if for example order of CSS attrs changes we need a more
        // complex check
        return this.stylesEqual(this.getOldStyle(), this.getNewStyle());
    },

    getChangedStyleNames: function() {
        var diff = this.getDiff();
        return diff ? diff._keys : [];
    },

    isUnchanged: function() {
        return this.getChangedStyleNames().withoutAll(["max-width", "min-width"]).length === 0;
    }

});

Object.extend(lively.morphic.TextUndo.DOMAttributeMutation, {
    from: function(rawMutation) {
        if (!rawMutation.type === "attributes") {
            return null;
        }
        if (rawMutation.attributeName === "style") {
            return new lively.morphic.TextUndo.StyleDOMAttributeMutation(rawMutation);
        }
        return new lively.morphic.TextUndo.DOMAttributeMutation(rawMutation);
    }
});

Object.subclass("lively.morphic.TextUndo.DOMMutation", {

});

Object.extend(lively.morphic.TextUndo.DOMMutation, {
    mutationsFromObserveEvent: function(rawMutations) {
        var result = [];
        rawMutations.forEach(function(rawMutation) {
            if (!result.any(function(domMutation) { return domMutation.consumes(rawMutation) })) {
                result.push(new lively.morphic.TextUndo.DOMMutation(rawMutation));
            }
        });
        return result;
    }
});

(function setupUndo() {
    if (!Config.get("textUndoEnabled")) return;
    Trait("lively.morphic.TextUndo.TextMutationObserverTrait").applyTo(lively.morphic.Text);
    console.log("Text undo enabled");
})();

AsyncTestCase.subclass('lively.morphic.TextUndo.TextMutationUndoTest',
// if (Global.TextMutationUndoTest) TextMutationUndoTest.remove();
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
            this.assertEquals(2, undoState.changes.length);
            this.assertEqualState({fontWeight: 'bold'}, this.text.getEmphasisAt(0));
            this.assertEqualState(2, this.text.getTextChunks().length);
            undoState.changes.last().undo();
            this.assertEqualState({}, this.text.getEmphasisAt(0));
            this.assertEquals(1, this.text.getTextChunks().length);
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
            this.assertEqualState({}, this.text.getEmphasisAt(2));
            this.assertEquals(1, this.text.getTextChunks().length);
            this.assertEquals('abc', this.text.textString);
            this.done();
        }, 0);
    },

    test05SetTextStringUndo: function() {
        var undoState = this.text.undoState;
        this.text.setTextString('foo');
        this.delay(function() {
            this.assertEquals(0, undoState.recordingErrors.length, 'errors recording set textString');
            this.assertEquals(1, undoState.changes.length, 'no change recorded for set textString');
            undoState.changes.last().undo();
            this.assertEquals('test', this.text.textString);
            this.done();
        }, 0);
    }
});

AsyncTestCase.subclass('TextUndoTest',
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

TestCase.subclass("lively.morphic.TextUndo.StyleDOMAttributeMutationTest",
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


Object.subclass("lively.morphic.TextUndo.AtomicDOMChange",
"undo / redo", {
    undo: function() {},
    redo: function() {}
},
"debugging", {
    toString: function() { return this.constructor.name; }
});

lively.morphic.TextUndo.AtomicDOMChange.subclass("lively.morphic.TextUndo.AtomicDOMCharacterDataChange",
"initializing", {
    initialize: function(mutationRecord) {
        this.oldValue = mutationRecord.oldValue;
        this.newValue = mutationRecord.target.textContent;
        this.target = mutationRecord.target;
    }
},
"undo / redo", {
    undo: function() {
        this.target.textContent = this.oldValue;
    },
    redo: function() {
        this.target.textContent = this.newValue;
    }
},
"debugging", {
    toString: function($super) {
        return $super() + "<" + this.oldValue + " => " + this.newValue + '(' + this.target + ')>';
    }
});

lively.morphic.TextUndo.AtomicDOMChange.subclass("lively.morphic.TextUndo.AtomicDOMAddedOneNodeChange",
"initializing", {
    initialize: function(mutationRecord) {
        var children = Array.from(mutationRecord.target.childNodes);
        this.nodeIndex = children.indexOf(mutationRecord.addedNodes[0]);
        this.addedNode = mutationRecord.addedNodes[0];
        this.target = mutationRecord.target;
    }
},
"undo / redo", {
    undo: function() {
        this.target.removeChild(this.addedNode);
    },
    redo: function() {
        this.target.insertBefore(
            this.addedNode, this.target.childNodes[this.nodeIndex]);
    }
},
"debugging", {
    toString: function($super) {
        return $super() + "<" + this.addedNode + " added at " + this.insetIndex + '(' + this.target + ')>';
    }
});

lively.morphic.TextUndo.AtomicDOMChange.subclass("lively.morphic.TextUndo.AtomicDOMRemoveOneNodeChange",
"initializing", {
    initialize: function(mutationRecord) {
        var children = Array.from(mutationRecord.target.childNodes);
        if (mutationRecord.previousSibling) {
            this.previousSibling = mutationRecord.previousSibling;
        } else if (mutationRecord.nextSibling) {
            this.nextSibling = mutationRecord.nextSibling;
        }
        this.removedNodes = [mutationRecord.removedNodes[0]];
        this.target = mutationRecord.target;
    }
},
"undo / redo", {
    undo: function() {
        this.target.insertBefore(this.removedNodes[0], this.nextSibling || this.previousSibling.nextSibling);
    },
    redo: function() {
        this.target.removeChild(this.removedNodes[0]);
    }
},
"debugging", {
    toString: function($super) {
        var beforeOrAfter = this.nextSibling ? "before " + this.nextSibling : "after " + this.previousSibling;
        return $super() + "<" + this.removedNode + " removed " + beforeOrAfter + '(' + this.target + ')>';
    }
});

lively.morphic.TextUndo.AtomicDOMChange.subclass("lively.morphic.TextUndo.AtomicDOMReplaceNodesChange",
"initializing", {
    initialize: function(mutationRecord) {
        this.removedNodes = Array.from(mutationRecord.removedNodes);
        this.addedNodes = Array.from(mutationRecord.addedNodes);
        this.target = mutationRecord.target;
    }
},
"undo / redo", {
    undo: function() {
        var firstAddedNode = this.addedNodes[0];
        this.removedNodes.forEach(function(ea) {
            this.target.insertBefore(ea, firstAddedNode);
        }, this);
        this.addedNodes.forEach(function(ea) {
            this.target.removeChild(ea);
        }, this);
    },
    redo: function() {
        var firstRemovedNode = this.removedNodes[0];
        this.addedNodes.forEach(function(ea) {
            this.target.insertBefore(ea, firstRemovedNode);
        }, this);
        this.removedNodes.forEach(function(ea) {
            this.target.removeChild(ea);
        }, this);
    }
},
"debugging", {
    toString: function($super) {
        return $super() + "<" + this.removedNode + " => " + this.addedNodes + ' (' + this.target + ')>';
    }
});

lively.morphic.TextUndo.AtomicDOMChange.subclass("lively.morphic.TextUndo.AtomicDOMStyleChange",
"initializing", {
    initialize: function(mutationRecord) {
        this.oldValue = mutationRecord.oldValue;
        this.newValue = mutationRecord.newValue;
        this.attribute = mutationRecord.attribute;
        this.target = mutationRecord.target;
    }
},
"undo / redo", {
    undo: function() {
        this.target.setAttribute(this.attribute, this.oldValue);
    },
    redo: function() {
        this.target.setAttribute(this.attribute, this.newValue);
    }
},
"debugging", {
    toString: function($super) {
        return $super() + "<" + this.oldValue + " => " + this.newValue + ' (' + this.target + ')>';
    }
});

Object.extend(lively.morphic.TextUndo.AtomicDOMChange, {
    from: function(mutationRecord) {
        if (mutationRecord.type === "characterData") {
            return new lively.morphic.TextUndo.AtomicDOMCharacterDataChange(mutationRecord);
        }
        if (mutationRecord.type === "childList" &&
            mutationRecord.addedNodes.length > 0 && mutationRecord.removedNodes.length > 0) {
            return new lively.morphic.TextUndo.AtomicDOMReplaceNodesChange(mutationRecord);
        }
        if (mutationRecord.type === "childList" && mutationRecord.addedNodes.length === 1) {
            return new lively.morphic.TextUndo.AtomicDOMAddedOneNodeChange(mutationRecord);
        }
        if (mutationRecord.type === "childList" && mutationRecord.removedNodes.length === 1) {
            return new lively.morphic.TextUndo.AtomicDOMRemoveOneNodeChange(mutationRecord);
        }
        // for our StyleDOMAttributeMutation
        if (mutationRecord.isStyleMutation) {
            return new lively.morphic.TextUndo.AtomicDOMStyleChange(mutationRecord);
        }
        // for generic style mutations
        if (mutationRecord.type === "attributes" && mutationRecord.attribute === "style") {
            return new lively.morphic.TextUndo.AtomicDOMStyleChange(mutationRecord);
        }
        throw new Error("mutation record of type " + mutationRecord.type + " not supported");
    }
});

TestCase.subclass("lively.morphic.TextUndo.AtomicDOMChangeTest",
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
        this.assertIdentity(this.childNode2, atomicDOMChange.addedNode);
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

// AsyncTestCase.subclass('lively.morphic.TextUndo.TextUndo.DOMMutationTest',
// // if (Global.TextMutationUndoTest) TextMutationUndoTest.remove();
// 'running', {
//     setUp: function($super) {
//         this.$node = lively.$('<div/>').appendTo('body');
//         var recordedMutations = this.recordedMutations = [];
//         var observer = new lively.morphic.Events.MutationObserver(function(mutations, observer) {
//             recordedMutations.push(lively.morphic.TextUndo.DOMMutation.mutationsFromObserveEvent(mutations));
//         });
//         observer.observe(this.$node[0], {
//             characterData: true,
//             characterDataOldValue: true,
//             attributes: true,
//             attributeOldValue: true,
//             subtree: true,
//             childList: true
//         });
//     },
//     tearDown: function() {
//         this.$node.remove();
//     },
//     shouldRun: false
// },
// 'testing', {
//     test01AddSpan: function() {

//     }
// });

}); // end of module