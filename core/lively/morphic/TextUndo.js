module('lively.morphic.TextUndo').requires('lively.morphic.TextCore').toRun(function() {

// TODO general explanation of the mutation-observer-undo approach
// explain:
// "text change"
// "mutation"
// "dom change"
// "text undo"

/*
 * == What is text state?
 *
 * text content:
 *   textChunks
 *
 * Style:
 *   _WhiteSpaceHandling
 *   _FontFamily
 *   _FontSize
 *   _MaxTextWidth
 *   _MinTextWidth
 *   _MaxTextHeight
 *   _MinTextHeight
 *
 * Events:
 *   _InputAllowed
 *   allowInput
 *
 * Eval:
 *   evalEnabled
 *
 * Syntax highlighting:
 *   syntaxHighlightingWhileTyping
 *   _syntaxHighlightTimeout
 *   lastSyntaxHighlightTime
 *
 * Selection:
 *   previousSelection
 *   priorSelectionRange
 *
 * Modification / undo state:
 *   undoState
 *   charsTyped
 *   charsReplaced
 *
 * Caching:
 *   cachedTextString
 *
 * Searching:
 *    lastFindLoc
 *
 *
 * == TextChunks
 * TextChunks are used to simplify the implementation of rich text and hold the
 * string and style, as well the DOM state for text parts with the same style:
 *
 * TextChunk state:
 *   style
 *   chunkOwner
 *   debugMode
 *   chunkNode
 *
 *
 * == Text state synchronization

 * When changing the state manually (e.g. for undoing) it is important that the
 * Morphic and DOM representation remain in synch. The current assumptions about
 * the rendering can be used:
 *   - a textMorph has one textNode
 *   - the textNode as at least one <span/> node
 *   - each span node is represented by a TextChunk
 *
 * When the DOM state is changed and it is known that the DOM change leaves the
 * DOM in a well-formed (for Lively) state then it is possible to re-sync the
 * morphic representation with the DOM.
 * When the DOM state is unknown then first a normalization is necessary (see
 * e.g. #coalesceChunks).
 *
 * For DOM mutation undos we will use a mixed approach: recovering the DOM state
 * completely from DOM mutations and the changes they recorded. Resyncing the
 * TextChunks by reading the spans but not parsing the style...? Instead of
 * parsing the style we prefer to record the style on DOM mutation recording...
 * for that we have to figure out what styles (what text chunks) have changes or
 * recorsd all styles (expensive).
 */

// The lively.morphic.TextUndo.TextMutationObserverTrait is applied to
// lively.morphic.Text and provides the functionality to record text changes.
// Currently it uses calls to #prepareForTextMutationRecording that were patched
// into the lively.morphic.Text code to be initialized
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
        this.undoState = {changes: []};
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
        // undoSettings.textChunkState = this.getTextChunks().clone();
        undoSettings.textChunkState = this.getTextChunks().invoke('toPlainObject');
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
            console.error('unrecognized text change');
            // this.showMutationsExpt(mutations);
            var domChanges = lively.morphic.TextUndo.AtomicDOMChange.fromMutations(mutations, this);
            this.addUndo({
                type: 'unknownChange',
                mutations: mutations,
                mutationsString: this.showMutationsExpt(mutations),
                domChanges: domChanges,
                undo: function() {}
            });
            // this.undoState.recordingErrors.push(mutations);
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
            domChanges = lively.morphic.TextUndo.AtomicDOMChange.fromMutations(mutations, this),
            atomicChange = domChanges[0],
            chunkIndex = this.findChunkNodeIndexOf(atomicChange.target),
            chunk = this.getTextChunks()[chunkIndex];

        this.addUndo({
            type: 'textAttributeChange',
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            domChanges: domChanges,
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
            domChanges = lively.morphic.TextUndo.AtomicDOMChange.fromMutations(mutations, this),
            domChange = domChanges[0],
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
            domChanges: domChanges,
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
        var text = this,
            oldStyles = text.getChunkStyles(),
            domChanges = lively.morphic.TextUndo.AtomicDOMChange.fromMutations(mutations, this);
        this.addUndo({
            type: 'textStringChange',
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            domChanges: domChanges,
            undo: function() {
                // dom
                domChanges.invoke("undo");
                // morphic
                text.getTextChunks()[0].chunkNode = text.renderContext().textNode.childNodes[0];
                text.cachedTextString = null;
                // undo
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
        var text = this,
            nonAttributeMutations = mutations.select(function(ea) { return ea.type !== 'attributes' }),
            idx = this.findChunkNodeIndexOf(nonAttributeMutations[2].target),
            domChanges = lively.morphic.TextUndo.AtomicDOMChange.fromMutations(mutations, this);

        this.addUndo({
            type: 'chunkSplit',
            mutations: nonAttributeMutations,
            mutationsString: this.showMutationsExpt(nonAttributeMutations),
            domChanges: domChanges,
            undo: function() {
                domChanges.invoke("undo"); // dom
                text.getTextChunks().splice(idx, 2); // morphic
                text.undoState.changes = text.undoState.changes.without(this); // remove undo
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
            atStart = idx === 0,
            domChanges = lively.morphic.TextUndo.AtomicDOMChange.fromMutations(mutations, this);

        this.addUndo({
            type: 'chunkSplitAt' + (atStart ? 'Start' : 'End'),
            mutations: nonAttributeMutations,
            mutationsString: this.showMutationsExpt(nonAttributeMutations),
            domChanges: domChanges,
            undo: function() {
                domChanges.invoke('undo');
                var chunks = text.getTextChunks()
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
        var domChanges = lively.morphic.TextUndo.AtomicDOMChange.fromMutations(mutations, this);
        this.addUndo({
            type: 'chunkMerge',
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            domChanges: domChanges,
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
        var domChanges = lively.morphic.TextUndo.AtomicDOMChange.fromMutations(mutations, this),
            atStart = mutations[0].target === this.getTextChunks()[0].getChunkNode();
        this.addUndo({
            type: 'chunkMergeAt' + (atStart ? 'Start' : 'End'),
            mutations: mutations,
            mutationsString: this.showMutationsExpt(mutations),
            domChanges: domChanges,
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

// lively.morphic.TextUndo.TextUndo is created when a text change is recorded. A
// text change is a list of DOM mutations. It is parameterized with settings
// that hold the state necessary for undoing a text change as well as a
// "undoFunc" that is triggered when the undo should be executed
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


(function setupUndo() {
    if (!Config.get("textUndoEnabled")) return;
    Trait("lively.morphic.TextUndo.TextMutationObserverTrait").applyTo(lively.morphic.Text);
    console.log("Text undo enabled");
})();


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
    initialize: function(mutationRecord, textMorph) {
        this.oldValue = mutationRecord.oldValue;
        this.newValue = mutationRecord.target.textContent;
        this.target = mutationRecord.target;
        this.mutationString = textMorph ? textMorph.showMutationsExpt([mutationRecord]) : "";
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
    initialize: function(mutationRecord, textMorph) {
        var children = Array.from(mutationRecord.target.childNodes);
        this.nodeIndex = children.indexOf(mutationRecord.addedNodes[0]);
        this.addedNodes = Array.from(mutationRecord.addedNodes);
        this.target = mutationRecord.target;
        this.mutationString = textMorph ? textMorph.showMutationsExpt([mutationRecord]) : "";
    }
},
"undo / redo", {
    undo: function() {
        this.target.removeChild(this.addedNodes[0]);
    },
    redo: function() {
        this.target.insertBefore(
            this.addedNodes[0], this.target.childNodes[this.nodeIndex]);
    }
},
"debugging", {
    toString: function($super) {
        return $super() + "<" + this.addedNodes + " added at " + this.nodeIndex + '(' + this.target + ')>';
    }
});

lively.morphic.TextUndo.AtomicDOMChange.subclass("lively.morphic.TextUndo.AtomicDOMRemoveOneNodeChange",
"initializing", {
    initialize: function(mutationRecord, textMorph) {
        var children = Array.from(mutationRecord.target.childNodes);
        if (mutationRecord.previousSibling) {
            this.previousSibling = mutationRecord.previousSibling;
        } else if (mutationRecord.nextSibling) {
            this.nextSibling = mutationRecord.nextSibling;
        }
        this.removedNodes = [mutationRecord.removedNodes[0]];
        this.target = mutationRecord.target;
        this.mutationString = textMorph ? textMorph.showMutationsExpt([mutationRecord]) : "";
    }
},
"undo / redo", {
    undo: function() {
        var nextSibling = this.nextSibling || (this.previousSibling && this.previousSibling.nextSibling);
        this.target.insertBefore(this.removedNodes[0], nextSibling);
    },
    redo: function() {
        this.target.removeChild(this.removedNodes[0]);
    }
},
"debugging", {
    toString: function($super) {
        var beforeOrAfter = this.nextSibling ? "before " + this.nextSibling : "after " + this.previousSibling;
        return $super() + "<" + this.removedNodes + " removed " + beforeOrAfter + '(' + this.target + ')>';
    }
});

lively.morphic.TextUndo.AtomicDOMChange.subclass("lively.morphic.TextUndo.AtomicDOMReplaceNodesChange",
"initializing", {
    initialize: function(mutationRecord, textMorph) {
        this.removedNodes = Array.from(mutationRecord.removedNodes);
        this.addedNodes = Array.from(mutationRecord.addedNodes);
        this.target = mutationRecord.target;
        this.mutationString = textMorph ? textMorph.showMutationsExpt([mutationRecord]) : "";
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
    initialize: function(mutationRecord, textMorph) {
        this.oldValue = mutationRecord.oldValue;
        this.newValue = mutationRecord.newValue;
        this.attribute = mutationRecord.attribute;
        this.target = mutationRecord.target;
        this.mutationString = textMorph ? textMorph.showMutationsExpt([mutationRecord]) : "";
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

    from: function(mutationRecord, textMorph) {
        if (mutationRecord.type === "characterData") {
            return new lively.morphic.TextUndo.AtomicDOMCharacterDataChange(mutationRecord, textMorph);
        }
        if (mutationRecord.type === "childList" &&
            mutationRecord.addedNodes.length > 0 && mutationRecord.removedNodes.length > 0) {
            return new lively.morphic.TextUndo.AtomicDOMReplaceNodesChange(mutationRecord, textMorph);
        }
        if (mutationRecord.type === "childList" && mutationRecord.addedNodes.length === 1) {
            return new lively.morphic.TextUndo.AtomicDOMAddedOneNodeChange(mutationRecord, textMorph);
        }
        if (mutationRecord.type === "childList" && mutationRecord.removedNodes.length === 1) {
            return new lively.morphic.TextUndo.AtomicDOMRemoveOneNodeChange(mutationRecord, textMorph);
        }
        // for our StyleDOMAttributeMutation as well as for generic style mutations
        if (mutationRecord.isStyleMutation ||
            (mutationRecord.type === "attributes" && mutationRecord.attribute === "style")) {
            return new lively.morphic.TextUndo.AtomicDOMStyleChange(mutationRecord, textMorph);
        }
        debugger;
        throw new Error("mutation record of type " + mutationRecord.type + " not supported");
    },

    fromMutations: function(mutations, textMorph) {
        return mutations.collect(function(ea) { return this.from(ea, textMorph); }, this);
    }
});

}); // end of module