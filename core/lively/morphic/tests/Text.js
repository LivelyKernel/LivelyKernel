module('lively.morphic.tests.Text').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.Text.TextMorphTests',
'testing', {
    test01TextMorphHTML: function() {
        var m = new lively.morphic.Text()
        this.world.addMorph(m);
        m.setTextString('Foo');
        var expected = {
            tagName: 'div',
            childNodes: [
                {tagName: 'div', childNodes: [ // shape
                    {tagName: 'div', textContent: 'Foo'}] // text node
                }
            ]};
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
    },

    test02TextMorphSVG: function() {
        var m = new lively.morphic.Text()
        this.world.addMorph(m);
        m.renderUsing(new lively.morphic.SVG.RenderContext())
        m.setTextString('Foo');
        var expected = {
            tagName: 'g',
            childNodes: [
                {tagName: 'rect'}, // shape
                {tagName: 'text', textContent: 'Foo'} // text node
            ]};
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
    },

    test03TextStringIsConnectable: function() {
        var m = new lively.morphic.Text()
        this.world.addMorph(m);
        var resultObj = {result: null};
        connect(m, 'textString', resultObj, 'result');
        m.setTextString('Foo');
        this.assertEquals('Foo', resultObj.result);
    },

    test04GrowToFit: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 10, 20));
        this.world.addMorph(m);
        m.setTextString('a really long string longer than 10px')
        m.applyStyle({fixedWidth: false});
        this.assert(m.getExtent().x > 10, 'did not grow to fit text ' + m.bounds().width);
    },

    test04bFitReallyShrinksMorphinHTML: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 200));
        this.world.addMorph(m);
        m.setTextString('short')
        m.applyStyle({fixedWidth: false});
        m.fit();
        this.assert(m.getExtent().x < 100, 'did not shrink to fit text');
    },

    test05SetSelectionRange: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('123\t567\n9');
        m.focus();
        m.setSelectionRange(0,1);
        this.assertEquals('1', m.selectionString());
        m.setSelectionRange(0,3);
        this.assertEquals('123', m.selectionString());
        m.setSelectionRange(-99,m.textString.length+10);
        this.assertEquals('123\t567\n9', m.selectionString());
    },

    test05bSetSelectionRangeRightToLeft: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('123\t567\n9');
        m.focus();
        m.setSelectionRange(3, 0);
        this.assertEquals('123', m.selectionString());
        this.assertEqualState([3,0], m.getSelectionRange());
    },

    test05cCorrectNewlinesInSelection: function() {
        // added 2012-01-06. Firefox Selection>>toString replaces \n with ' '
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('This\nis\na\ntest');
        m.setSelectionRange(0,9);
        this.assert(m.textString.indexOf(m.selectionString()) != -1);
    },

    test06ModifySelectedLinesInsertsAtCorrectPosition: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('This\nis\na\ntest');
        m.setSelectionRange(0,9);
        this.assertEquals('This\nis\na', m.selectionString())
        m.modifySelectedLines(function(ea) { return '+' + ea });
        this.assertEquals('+This\n+is\n+a\ntest', m.textString);
    },

    test07aSplitText: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('This is a test');
        m.setSelectionRange(10,10);

        m.splitText();

        var newText = this.world.submorphs[this.world.submorphs.indexOf(m)+1]
        this.assert(newText.isText && newText !== m, 'no text created');
        this.assertEquals(m, newText.splittedFrom, 'spittedFrom field no correct');
        this.assertEquals('test', newText.textString, 'spittedFrom string');
        this.assertEquals('This is a ', m.textString, 'former text string not OK');
        this.assert(newText.bounds().top() > m.bounds().bottom(), 'not below old text');
    },

    test07bMergeText: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.setTextString('This is a test');
        m.setSelectionRange(10,10);
        var splitted = m.splitText();
        splitted.emphasizeAll({fontWeight: 'bold'});
        splitted.mergeText();

        this.assert(!splitted.owner, 'splitted not removed');
        this.assertEquals('This is a test', m.textString, 'spittedFrom string');
        this.assertMatches({fontWeight: 'bold'}, m.getEmphasisAt(11))
    },

    test08CopyTextWithConnection: function() {
        // issue 285
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20), "");
        connect(m, 'textString', m, 'someOtherField')
        var copy = m.duplicate()
        this.assert(copy.textString == '', 'copy is broken')
    },

    test09TextStringOfTextOutsideSceneGraphIsSerialized: function() {
        var m = new lively.morphic.Morph(),
            s,
            d;
        m.hiddenTextMorph = new lively.morphic.Text();
        m.hiddenTextMorph.textString = 'Hello';

        s = lively.persistence.Serializer.serialize(m);
        d = lively.persistence.Serializer.deserialize(s);
        this.assertEquals(d.hiddenTextMorph.textString, 'Hello', 'serialization of removed text should preserve its contents');
    },

    test10PasteIntoEmptyTextEnsuresSelection: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.world.addMorph(m);
        m.textString = '';
        m.onPaste({
            clipboardData: {
                getData: function(type) { return type === "text/plain" ? "foo" : false; }
            },
            stop: function() {}
        });
        this.assertEquals(m.textString, "foo", "string was not pasted into empty text");
    },

    test11SetAllowInput: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0, 100, 20));
        this.assert(m.inputAllowed(), 'inputAllows == true is not default');
        m.setInputAllowed(false);
        this.assert(!m.inputAllowed(), 'setInputAllowed not working');
    },

    test12CleanVarDeclaration: function() {
        var text = new lively.morphic.Text(),
            cleaner = text.varDeclCleaner(),
            lines = ['    var x = this.text();', 'var bla = this.bar.foo()'],
            expected = ['    var x = this.text(),', '        bla = this.bar.foo();'],
            result = [cleaner(lines[0], 0, lines), cleaner(lines[1], 1, lines)];
        this.assertEqualState(expected, result);

    }

});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.Text.TextMorphRichTextTests',
'running', {
    setUp: function($super) {
        $super();
        this.text = new lively.morphic.Text(new Rectangle(0,0, 400, 200));
        this.world.addMorph(this.text);
    },
},
'testing', {
    test01MorphHasTextChunk: function() {
        var chunks = this.text.getTextChunks();
        this.assertEquals(1, chunks.length);
        this.assertEquals('', chunks[0].textString);
        chunks[0].textString = 'foo';
        this.assertEquals('foo', this.text.textString);
        this.checkDOM([{tagName: 'span', textContent: 'foo'}])
    },

    test02MorphHasTextChunkWhenTextStringIsSet: function() {
        this.text.textString = 'foo'
        var chunks = this.text.getTextChunks();
        this.assertEquals(1, chunks.length);
        this.assertEquals('foo', chunks[0].textString);
        this.checkDOM([{tagName: 'span', textContent: 'foo'}])
    },

    test03aSplitAndJoinTextChunks: function() {
        this.text.setTextString('eintest');
        var chunk = this.text.firstTextChunk(),
            after = chunk.splitAfter(3);
        this.assertEquals('test', after.textString, 'after string');
        this.assertEquals('ein', chunk.textString, 'chunk string');
        this.assertEquals(2, this.text.getTextChunks().length);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'test'}])

        chunk.joinWithNext();
        this.assertEquals('eintest', chunk.textString);
        this.assertEquals(1, this.text.getTextChunks().length);
        this.checkDOM([{tagName: 'span', textContent: 'eintest'}]);

        var before = chunk.splitBefore(3);
        this.assertEquals('ein', before.textString, 'before string');
        this.assertEquals(2, this.text.getTextChunks().length);
    },

    test03bCoalesceChunks: function() {
        this.text.setTextString('test');
        this.text.firstTextChunk().splitAfter(2);
        this.text.coalesceChunks();
        this.assertEquals(1, this.text.getTextChunks().length);
        this.checkDOM([{tagName: 'span', textContent: 'test', style: {fontWeight: ''}}]);
    },

    test03bCoalesceChunksOfZeroLength: function() {
        this.text.setTextString('test');
        this.text.emphasizeAll({fontWeight: 'bold'});
        this.text.sliceTextChunks(2,2);
        this.text.coalesceChunks();
        this.assertEquals(1, this.text.getTextChunks().length);
    },

    test03bCoalesceChunksOfZeroLengthThatHasDifferentStyle: function() {
        this.text.setTextString('test');
        this.text.sliceTextChunks(2,2);
        this.text.getTextChunks()[0].styleText({fontWeight: 'bold'});
        this.text.getTextChunks()[2].styleText({fontWeight: 'bold'});
        this.assertEquals(3, this.text.getTextChunks().length);
        this.text.coalesceChunks();
        this.assertEquals(1, this.text.getTextChunks().length);
    },

    test03cSplitAtFrontAndBack: function() {
        this.text.setTextString('a');
        var after = this.text.firstTextChunk().splitAfter(1);
        this.assertEquals('', after.textString, 'splitAfter');
        var before = this.text.firstTextChunk().splitBefore(0);
        this.assertEquals('', before.textString, 'splitBefore');
        this.assertEquals(3, this.text.getTextChunks().length);
    },

    test03cSplitCanFixRanges: function() {
        this.text.setTextString('hello');
        var rangesBefore = this.text.getChunkRanges();
        this.text.firstTextChunk().splitAfter(1, rangesBefore);
        var rangesAfter = this.text.getChunkRanges();
        this.assertEqualState(rangesAfter, rangesBefore);
        this.assertEqualState([[0,1], [1,5]], rangesBefore);
    },

    test03cSplittedChunkGetsStyle: function() {
        this.text.setTextString('abcdef');
        var chunk = this.text.firstTextChunk();
        chunk.style.setFontWeight('bold');
        var after = this.text.firstTextChunk().splitAfter(3);
        this.assertEquals('bold', after.style.getFontWeight());
    },

    test04SliceTextChunksSimple: function() {
        this.text.setTextString('eintest');
        var sliced = this.text.sliceTextChunks(0,3);
        this.assertEquals(1, sliced.length, 'sliced not oke');
        this.assertEquals(2, this.text.getTextChunks().length);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'test'}])
    },

    test04SliceTextChunks: function() {
        this.text.setTextString('eintest');
        var chunk = this.text.firstTextChunk();
        chunk.splitAfter(3);
        var sliced = this.text.sliceTextChunks(2,6);
        this.assertEquals(4, this.text.getTextChunks().length);
        this.checkDOM([
            {tagName: 'span', textContent: 'ei'},
            {tagName: 'span', textContent: 'n'},
            {tagName: 'span', textContent: 'tes'},
            {tagName: 'span', textContent: 't'}])
    },

    test04SliceTextChunksAgain: function() {
        this.text.setTextString('abc');
        var sliced = this.text.sliceTextChunks(1,2);
        this.assertEquals(1, sliced.length, 'first');
        sliced = this.text.sliceTextChunks(1,2);
        this.assertEquals(1, sliced.length, 'second');
    },

    test05StyleChunk: function() {
        this.text.setTextString('test');
        var chunk = this.text.firstTextChunk();
        chunk.styleText({fontWeight: 'bold'});
        this.checkDOM([{tagName: 'span', style: {fontWeight: 'bold'}}]);
    },

    test06MakeTextBold: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0, 3);
        this.checkChunks(
            [{textString: 'ein'},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },

    test07MakeTextBoldThenUnbold: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0, 2);
        this.text.emphasize({fontWeight: 'normal'}, 0, 2);
        this.checkDOM([{tagName: 'span', textContent: 'eintest'}])
    },

    test08ToggleBoldnessComplete: function() {
        this.text.setTextString('eintest');
        this.text.toggleBoldness(1, 6);
        this.checkDOM([
            {tagName: 'span', textContent: 'e'},
            {tagName: 'span', textContent: 'intes'},
            {tagName: 'span', textContent: 't'}])
        this.text.toggleBoldness(1, 6);
        this.checkDOM([{tagName: 'span', textContent: 'eintest'}])
    },

    test09ChunksAreSerializable: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0, 3);
        this.text.name = 'testText';
        this.serializeAndDeserializeWorld();
        this.text = this.world.get('testText');
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])

    },

    test10ConvertSelectionRangeForEmphasis: function() {
        // the indexes used by text selection are currently different
        // to those used for emphasizing the text
        var testValues = [
            {sel: [0,0], emph: [0,0]},
            {sel: [0,7], emph: [0,7]},
            {sel: [1,1], emph: [1,1]},
            {sel: [2,0], emph: [0,2]},
            {sel: [8,0], emph: [0, 8]},
            {sel: [4,7], emph: [4,7]}];
        testValues.forEach(function(selAndEmph) {
            this.assertEqualState(
                selAndEmph.emph,
                this.text.convertSelectionRangeForEmphasis(selAndEmph.sel),
                'sel conversion of ' + selAndEmph.sel);
        }, this)
    },

    test11ToggleBoldnessWithChunkWithMultipleTextNodes: function() {
        this.text.setTextString('eintest');
        this.text.setNullSelectionAt(3);
        this.text.insertAtCursor('foo');
        this.assertEquals('einfootest', this.text.textString, 'insert')
        this.checkDOM([
            {tagName: 'span', textContent: 'einfootest', childNodes: [
                {tagName: undefined, textContent: 'ein'},
                {tagName: undefined, textContent: 'foo'},
                {tagName: undefined, textContent: 'test'},
                {tagName: 'br', textContent: ''}
            ]}
        ])

        this.text.toggleBoldness(1, 9);
        this.checkDOM([
            {tagName: 'span', textContent: 'e', childNodes: [{textContent: 'e'}]},
            {tagName: 'span', textContent: 'infootes', childNodes: [{textContent: 'infootes'}]},
            {tagName: 'span', textContent: 't', childNodes: [{textContent: 't'},
                                                             {tagName: 'br', textContent: ''}]}
        ])
    },

    test11aFixChunksThatChangesDOMShouldKeepSelection: function() {
        this.text.setTextString('eintest');
        // add a text outside of chunks manually
        this.text.renderContext().textNode.appendChild(document.createTextNode('test'))
        this.text.setSelectionRange(2,5);
        this.text.fixChunks();
        this.checkDOM([
            {tagName: 'span', textContent: 'eintesttest', childNodes: [
                {tagName: undefined, textContent: 'eintesttest'},
                {tagName: 'br', textContent: ''}
            ]}
        ]);
        var range = this.text.getSelectionRange();
        this.assert(range, 'no selection range after fixChunks!');
        this.assertMatches([2, 5], range); // Inconsistency with selection ranges?
    },

    test11bFixChunksThatDoesNothingShouldKeepSelection: function() {
        this.text.setTextString('eintest');
        this.text.setSelectionRange(2,5);
        this.text.fixChunks();
        this.checkDOM([
            {tagName: 'span', textContent: 'eintest', childNodes: [
                {tagName: undefined, textContent: 'eintest'},
                {tagName: 'br', textContent: ''}
            ]}
        ]);
        var range = this.text.getSelectionRange();
        this.assert(range, 'no selection range after fixChunks!');
        this.assertMatches([2, 5], range);
    },

    test12GetAndSetSelectionRangeHaveEqualValues: function() {
        this.text.setTextString('eintest');
        this.text.setSelectionRange(1, 6)
        this.assertEquals('intes', this.text.selectionString());
        this.assertMatches([1,6], this.text.getSelectionRange());
    },

    test13InsertedTextBetweenChunksIsAssimilated: function() {
        // certain actions like native spell checking can add text and other DOM elements
        // between our chunk elements (spans)
        // this should be recognized and additional text appended to some chunk
        this.text.setTextString('abcdef');
        this.text.emphasize({fontWeight: 'bold'}, 0, 3);

        var chunks = this.text.getTextChunks();
        this.assertEquals(2, chunks.length, 'test preparation: chunks not OK')

        var newNode = XHTMLNS.create('b')
        newNode.textContent = 'foo';

        this.text.renderContext().textNode.insertBefore(newNode, chunks[1].getChunkNode());

        this.text.fixChunks();

        this.checkDOM([
            {tagName: 'span', textContent: 'abcfoo'},
            {tagName: 'span', textContent: 'def'},
        ])
    },

    test14GetEmphasisAt: function() {
        // certain actions like native spell checking can add text and other DOM elements
        // between our chunk elements (spans)
        // this should be recognized and additional text appended to some chunk
        this.text.setTextString('abcdef');
        this.text.emphasize({fontWeight: 'bold'}, 1, 3);

        var emph, expected = ['normal', 'bold', 'bold', 'normal']
        expected.forEach(function(expectedFontWeight, i) {
            var emph = this.text.getEmphasisAt(i)
            this.assertEquals(expectedFontWeight, emph.getFontWeight(), i);
        }, this);
    },

    test15aGetChunkAndLocalIndex: function() {
        this.text.setTextString('abcdef');
        this.text.sliceTextChunks(1,3);
        this.checkDOM([
            {tagName: 'span', textContent: 'a'},
            {tagName: 'span', textContent: 'bc'},
            {tagName: 'span', textContent: 'def'}
        ]);

        var chunks = this.text.getTextChunks(), result;

        result = this.text.getChunkAndLocalIndex(0);
        this.assertEquals(chunks[0], result[0]); // test for chunk
        this.assertEquals(0, result[1]); // test for local index

        result = this.text.getChunkAndLocalIndex(1); // if chunks ends at idx we extend it
        this.assertEquals(chunks[0], result[0])
        this.assertEquals(1, result[1])

        result = this.text.getChunkAndLocalIndex(2);
        this.assertEquals(chunks[1], result[0])
        this.assertEquals(1, result[1])

        result = this.text.getChunkAndLocalIndex(1, true);
        this.assertEquals(chunks[1], result[0])
        this.assertEquals(0, result[1])
    },

    test15bGetChunkAndLocalIndexWithExisitingRanges: function() {
        this.text.setTextString('abcdef');
        this.text.sliceTextChunks(1,3);
        this.checkDOM([
            {tagName: 'span', textContent: 'a'},
            {tagName: 'span', textContent: 'bc'},
            {tagName: 'span', textContent: 'def'}
        ]);
        var ranges = this.text.getChunkRanges(), chunks = this.text.getTextChunks(), result;

        result = this.text.getChunkAndLocalIndex(0, false, ranges);
        this.assertEquals(chunks[0], result[0]); // test for chunk
        this.assertEquals(0, result[1]); // test for local index

        // if chunks ends at idx we extend it
        result = this.text.getChunkAndLocalIndex(1, false, ranges);
        this.assertEquals(chunks[0], result[0])
        this.assertEquals(1, result[1])

        result = this.text.getChunkAndLocalIndex(2, false, ranges);
        this.assertEquals(chunks[1], result[0])
        this.assertEquals(1, result[1])

        result = this.text.getChunkAndLocalIndex(1, true, ranges);
        this.assertEquals(chunks[1], result[0])
        this.assertEquals(0, result[1])
    },

    test16AddLink: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({uri: 'http://foo.com'}, 0, 3);
        this.checkChunks(
            [{textString: 'ein', style: {uri: 'http://foo.com'}},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {textDecoration: 'underline'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },

    test17AddLinkMakeBoldThenUnbold: function() {
        this.text.setTextString('eintest');

        this.text.emphasize({uri: 'test'}, 3, 7)
        this.text.emphasize({fontWeight: 'bold'}, 0, 4)
        this.text.emphasize({fontWeight: 'normal'}, 0, 4)

        this.checkChunks(
            [{textString: 'ein'},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'test', style: {textDecoration: 'underline'}}])
    },

    test18LinkifiedChunkShouldKeepLinkWhenTextStringChanges: function() {
        this.text.setTextString('foo');
        this.text.emphasize({uri: 'test'}, 0, 3);

        this.text.firstTextChunk().textString = 'bar'

        this.checkChunks([{textString: 'bar', style: {uri: 'test'}}])

        this.checkDOM([{
            tagName: 'span',
            textContent: 'bar',
            style: {textDecoration: 'underline'}
        }])
    },

    test19FixChunksShouldRemoveElements: function() {
        this.text.setTextString('eintest');

        // this happens when pasting rich text on windows, for now remove RT attributes
        var elem = XHTMLNS.create('a');
        elem.href = 'http://foo.com';
        elem.textContent = 'test';

        this.text.firstTextChunk().getChunkNode().appendChild(elem);

        this.text.fixChunks()
        this.checkDOM([
            {tagName: 'span', textContent: 'eintesttest',
                // childNodes: [{tagName: undefined, textContent: 'eintesttest'}]
            },
        ])
    },

    test20HandleSplittedSpanNodes: function() {
        // this happens when pasting normal text on windows
        // the span node of a chunk is splitted in two parts and the pasted text
        // is inserted inbetween
        var textNode = this.text.renderContext().textNode;
        this.text.setTextString('ac');

        var span = XHTMLNS.create('span');
        span.textContent = 'a';
        textNode.insertBefore(span, this.text.firstTextChunk().getChunkNode());

        var text = NodeFactory.createText('b');
        textNode.insertBefore(text, this.text.firstTextChunk().getChunkNode());

        this.text.firstTextChunk().textString = 'c';

        this.text.fixChunks();

        this.checkDOM([{tagName: 'span', textContent: 'abc'}]);
    },

    test21HandleSplittedSpanNodesAndTextAttributes: function() {
        // this happens when pasting normal text on windows
        // the span node of a chunk is splitted in two parts and the pasted text
        // is inserted inbetween
        var textNode = this.text.renderContext().textNode;
        this.text.setTextString('abc');

        this.text.emphasize({fontWeight: 'bold'}, 1,3);
        var chunks = this.text.getTextChunks();

        var span = XHTMLNS.create('span');
        span.textContent = 'b';
        textNode.insertBefore(span, chunks.last().getChunkNode());
        // abbc

        var text = NodeFactory.createText('x');
        textNode.insertBefore(text, chunks.last().getChunkNode());
        // abxbc

        chunks.last().textString = 'c';
        // abxc

        this.text.fixChunks();

        this.checkDOM([
            {tagName: 'span', textContent: 'abx'},
            {tagName: 'span', textContent: 'c', style: {fontWeight: 'bold'}}]);
    },

    test22ReclaimRemovedSpanNodesOnPaste: function() {
        // this happens when pasting normal text on Mac OS after a chunk
        // the span node of the chunk that is pasted into is removed and the chunkNode
        // has no parent anymore. The abandoned chunkNode should reclaim its old text + the isnerted

        // add new content
        var textNode = this.text.renderContext().textNode;
        this.text.setTextString('foo\n\nbar\n\nbaz');

        this.text.emphasize({fontWeight: 'bold'}, 0,3);
        this.text.emphasize({fontWeight: 'bold'}, 10,13);
        var chunks = this.text.getTextChunks();

        // remove middle chunk node
        var n = chunks[1].getChunkNode();
        n.parentNode.removeChild(n);

        var text = NodeFactory.createText('\n\nbar zurp\n\n');
        textNode.insertBefore(text, chunks[2].getChunkNode());

        this.assertEquals('foo\n\nbar zurp\n\nbaz',textNode.textContent, 'setup not successful')

        this.text.fixChunks();

        this.checkDOM([
            {tagName: 'span', textContent: 'foo', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: '\n\nbar zurp\n\n', style: {fontWeight: ''}},
            {tagName: 'span', textContent: 'baz', style: {fontWeight: 'bold'}}]);

    },

    test23ReclaimRemovedChunkNodeAndReapplyTextAttributes: function() {
        // this happens when pasting normal text on Mac OS in attributed text (e.g. bold)
        // Chrome tries to complete render the span itself, e.g. using <b>
        // the chunkNode is removed but the chunk still exists
        // this tests if the chunk can reclaim the text and set it's attributes again
        var textNode = this.text.renderContext().textNode;
        this.text.setTextString('foo\nbar');

        this.text.emphasize({fontWeight: 'bold'}, 4,7);
        var chunks = this.text.getTextChunks();

        // remove last chunk node
        var n = chunks[1].getChunkNode();
        n.parentNode.removeChild(n);

        var b = XHTMLNS.create('b');
        b.textContent = 'morebar'
        textNode.appendChild(b);

        this.assertEquals('foo\nmorebar', textNode.textContent, 'setup not successful')

        this.text.fixChunks();

        this.checkDOM([
            {tagName: 'span', textContent: 'foo\n', style: {fontWeight: ''}},
            {tagName: 'span', textContent: 'morebar', style: {fontWeight: 'bold'}}]);
    },

    test22EmphasizeRegex: function() {
        this.text.setTextString("a1b2c");
        this.text.emphasizeRegex(/[0-9]/g, {color: Color.red});
        this.checkChunks([
            {textString: 'a', style: {color: null}},
            {textString: '1', style: {color: Color.red}},
            {textString: 'b', style: {color: null}},
            {textString: '2', style: {color: Color.red}},
            {textString: 'c', style: {color: null}}
        ])
    },

    test24aInsertTextChunksAtEnd: function() {
        this.text.setTextString('ein');
        this.text.setNullSelectionAt(3);
        var chunk = new lively.morphic.TextChunk('test')

        this.text.insertTextChunksAtCursor([chunk], true, true);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'test'}
        ])
    },

    test24bInsertTextChunksInside: function() {
        this.text.setTextString('eintest');
        this.text.setNullSelectionAt(3);
        var chunk = new lively.morphic.TextChunk('foo')

        this.text.insertTextChunksAtCursor([chunk], true, true);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein'},
            {tagName: 'span', textContent: 'foo'},
            {tagName: 'span', textContent: 'test'}
        ])
    },

    test25SlicingTextChunksWithRangeWithLengthZero: function() {
        this.text.setTextString('ein');
        var newChunk = this.text.sliceTextChunks(3,3);
        this.assertEquals(2, this.text.textChunks.length);
        this.assertIdentity(newChunk[0], this.text.textChunks.last());
        // do it again, it should not change anything
        this.text.sliceTextChunks(3,3);
        this.assertEquals(2, this.text.textChunks.length);
    },

    test26aUnEmphasize: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0,3)
        this.text.unEmphasize(0,7);
        this.checkChunks([{textString: 'eintest'}]);
        this.checkDOM(
            [{tagName: 'span', textContent: 'eintest', style: {fontWeight: ''}}]);
    },

    test26bUnEmphasizePart: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({fontWeight: 'bold'}, 0,3)
        this.text.setSelectionRange(1,3);
        this.text.unEmphasizeSelection();
        var selRange = this.text.getSelectionRange();
        this.assertMatches([1,3], selRange)
        this.checkChunks(
            [{textString: 'e'},
            {textString: 'intest'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'e', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'intest', style: {fontWeight: ''}}])
    },

    test26cRemoveDoit: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({doit: {code: 'alert(1)'}}, 0,3);
        this.text.emphasize({doit: null}, 1,4);
        this.checkChunks(
            [{textString: 'e'},
            {textString: 'intest'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'e', style: {color: 'rgb(0,100,0)'}},
            {tagName: 'span', textContent: 'intest', style: {color: 'inherit'}}])
    },

    test27aInsertStringAt: function() {
        this.text.setTextString('some text');
        this.text.toggleBoldness(2,4);
        this.text.insertTextStringAt(4, ' more');

        this.checkChunks(
            [{textString: 'so'},
            {textString: 'me more', style: {fontWeight: 'bold'}},
            {textString: ' text'}]);
    },

    test28aEmphasizeRanges: function() {
        this.text.setTextString('some text');
        this.text.emphasizeRanges([
            [0,4, {fontWeight: 'bold'}],
            [5,9, {textDecoration: 'underline'}]]);
        this.checkChunks([
            {textString: 'some', style: {fontWeight: 'bold'}},
            {textString: ' ', style: {}},
            {textString: 'text', style: {textDecoration: 'underline'}}]);
    },

    test28bEmphasizeRangesWithPrexistingStyle: function() {
        this.text.setTextString('some text');
        this.text.emphasize({textDecoration: 'underline'}, 0, 4);
        this.text.emphasizeRanges([[0,4, {fontWeight: 'bold'}]]);
        this.checkChunks([
            {textString: 'some', style: {fontWeight: 'bold', textDecoration: 'underline'}},
            {textString: ' text', style: {}}]);
    }

});

lively.morphic.tests.Text.TextMorphRichTextTests.subclass('lively.morphic.tests.Text.RichTextTests',
'testing', {
    test01CreateRichText: function() {
        var rt = new lively.morphic.RichText('test');
        this.text.setRichText(rt);
        this.assertEquals('test', this.text.textString)
    },

    test02GetRichText: function() {
        this.text.textString = 'test';
        var rt = this.text.getRichText();
        this.assertEquals('test', rt.textString)
    },

    test03EmphasizeRichText: function() {
        var rt = new lively.morphic.RichText('eintest');
        rt.emphasize({fontWeight: 'bold'}, 0,3);
        this.assertEquals(2, rt.textChunks.length, 'chunks not created in rich text')
        this.text.setRichText(rt);
        this.checkChunks(
            [{textString: 'ein'},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },

    test04InsertInText: function() {
        var rt = new lively.morphic.RichText('foo');
        rt.emphasize({fontWeight: 'bold'}, 0,3);
        this.text.setTextString('einxtest');
        this.text.setSelectionRange(3,4);
        rt.replaceSelectionInMorph(this.text)
        this.checkChunks(
            [{textString: 'ein'},
            {textString: 'foo'},
            {textString: 'test'}])
        this.checkDOM([
            {tagName: 'span', textContent: 'ein', style: {fontWeight: ''}},
            {tagName: 'span', textContent: 'foo', style: {fontWeight: 'bold'}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: ''}}])
    },

    test05GetRichText: function() {
        this.text.textString = 'test';
        this.text.emphasizeAll({fontWeight: 'bold'});
        var rt = this.text.getRichText();
        this.checkChunks([{textString: 'test', style: {fontWeight: 'bold'}}], rt)
    },

    test05bGetRichTextFromTo: function() {
        this.text.textString = 'test';
        this.text.emphasizeAll({fontWeight: 'bold'});
        var rt = this.text.getRichTextFromTo(2, 4);
        this.checkChunks([{textString: 'te', style: {fontWeight: 'bold'}}], this.text)
        this.checkChunks([{textString: 'st', style: {fontWeight: 'bold'}}], rt)
    },

    xtest06Serialization: function() {
        this.text.textString = 'test';
        var rt = this.text.getRichText(),
            copy = lively.persistence.Serializer.newMorphicCopy(rt);
        this.assertEquals('test', copy.textString);
    }
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.Text.RichText2Tests',
'testing', {

    test01CreateFromMorph: function() {
        var m = new lively.morphic.Text(new Rectangle(0,0,100,100), 'eintest');
        m.emphasize({fontWeight: 'bold'}, 0, 3);
        var rt = m.getRichText2();
        this.assertEquals('eintest', rt.textString);
        var expectedEmphs = [{fontWeight: 'bold'}, {fontWeight: 'bold'}, {fontWeight: 'bold'},
                            {},{},{},{}];
        this.assertEqualOwnState(expectedEmphs, rt.getTextEmphasis());
    },

    test02SetIntoText: function() {
        var rt = new lively.morphic.RichText2('aab', [{fontWeight: 'bold'},
                                                      {fontWeight: 'bold'},
                                                      {}]),
            m = new lively.morphic.Text(new Rectangle(0,0,100,100));
        m.setRichText2(rt);
        this.assertEquals('aab', m.textString, 'string');
        var expectedEmph1 = {fontWeight: 'bold'}, expectedEmph2 = {};
        this.assertEqualOwnState(expectedEmph1, m.getEmphasisAt(0), 'emph1');
        this.assertEqualOwnState(expectedEmph1, m.getEmphasisAt(1), 'emph2');
        this.assertEqualOwnState(expectedEmph2, m.getEmphasisAt(2), 'emph3');
    }
});

lively.morphic.tests.Text.TextMorphRichTextTests.subclass('lively.morphic.tests.Text.Paste',
'data', {
    richTextPasteData: '<meta charset="utf-8">'
                     + '<span class="Apple-style-span" style="border-collapse: separate; color: rgb(0, 0, 0); font-family: Times; font-style: normal; font-variant: normal; font-weight: normal; letter-spacing: normal; line-height: normal; orphans: 2; text-align: -webkit-auto; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-border-horizontal-spacing: 0px; -webkit-border-vertical-spacing: 0px; -webkit-text-decorations-in-effect: none; -webkit-text-size-adjust: auto; -webkit-text-stroke-width: 0px; font-size: medium; ">'
                     +   '<span class="Apple-style-span" style="font-family: Arial, sans-serif; font-size: 19px; white-space: pre-wrap; orphans: 2">'
                     +     '<span style="text-decoration: none; ">ein </span>'
                     +     '<span style="text-decoration: none; font-weight: bold; ">test</span>'
                     +   '</span>'
                     + '</span>',
    createPasteEvent: function(spec) {
        return {
            clipboardData: {
                getData: function(mimeType) {
                    if (mimeType === 'text/html') { return spec.html }
                    if (mimeType === 'text/plain') { return spec.text }
                    return null;
                }
            },
            stop: Functions.Null
        }
    }
},
"testing", {

    test01RichTestCreationFromPaste: function() {
        var pastedText = this.richTextPasteData,
            rt = lively.morphic.HTMLParser.pastedHTMLToRichText(pastedText);
        this.assertEquals(2, rt.textChunks.length);
        this.assertEquals('ein ', rt.textChunks[0].textString);
        this.assertEquals('test', rt.textChunks[1].textString);
        this.assertEquals('normal', rt.textChunks[0].style.getFontWeight());
        this.assertEquals('bold', rt.textChunks[1].style.getFontWeight());
    },

    test02PasteResultPlacedInTextMorph: function() {
        this.text.textString = '';
        var pasteEvent = this.createPasteEvent({text: 'ein text', html: this.richTextPasteData})
        this.text.onPaste(pasteEvent);
        this.assertEquals('ein test', this.text.textString, 'string not ok');
        this.checkChunks([
            {textString: 'ein ', style: {}},
            {textString: 'test', style: {fontWeight: 'bold'}}]);
        this.checkDOM([
            {tagName: 'span', textContent: 'ein ', style: {fontWeight: ''}},
            {tagName: 'span', textContent: 'test', style: {fontWeight: 'bold'}}]);
    },

    test03ExtractStyles: function() {
        var node = lively.morphic.HTMLParser.sourceToNode(this.richTextPasteData);
        lively.morphic.HTMLParser.sanitizeNode(node);
        var intervals = lively.morphic.HTMLParser.createIntervalsWithStyle(
                node, {styles: [], styleStart: 0, intervals: []}),
            expected = [[0, 4, {textDecoration: 'none'}],
                        [4, 8, {textDecoration: 'none', fontWeight: 'bold'}]];
        this.assertEqualState(expected, intervals);
    }
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.Text.LayoutTests',
'running', {
    setUp: function($super) {
        $super();
        this.text = new lively.morphic.Text(new Rectangle(0,0,100,100), '')
            .applyStyle({
                padding: new Rectangle(0,0,0,0),
                borderWidth: 0,
                fontSize: 10,
                fontFamily: 'monospace',
                fixedWidth: false, fixedHeight: false
            });
        this.world.addMorph(this.text);
    },
},
'testing', {
    test01ComputVisibleTextBounds: function() {
        this.assertEquals(this.text.innerBounds(), this.text.visibleTextBounds());
        this.text.applyStyle({padding: Rectangle.inset(2,2)});
        this.assertEquals(this.text.innerBounds().insetBy(2), this.text.visibleTextBounds());

        // FIXME: text bounds are not correct at the moment, not specified

        // IMO: in contrast to other morphs the border of a text should not grow inwards, i.e. should not decrease extent and font size of a text.
        // i especially don't want to resize text after i added a border.

        // this.text.applyStyle({borderWidth: 3});
        // this.assertEquals(this.text.innerBounds().insetBy(2+3), this.text.visibleTextBounds());
    },
    test02ExtentIsNotChangedWhenPaddingIsSet: function() {
        this.text.setPadding(Rectangle.inset(2,2));
        this.assertEquals(this.text.getExtent(), this.text.getScrollExtent(), 'visible extent not equal to logical extent');
    },

    test03FixedWidthForcesLineBreaks: function() {
        this.epsilon = 4;
        this.text.applyStyle({fontFamily: 'Courier', fontSize: 12,
                              fixedWidth: false, fixedHeight: false});
        this.text.setTextString('aaa');
        this.assertEqualsEpsilon(pt(30, 18), this.text.getTextExtent(), 'setup does not work');
        this.text.applyStyle({fixedWidth: true});
        this.text.setExtent(pt(20,15));
        // text's span is 16 then, but text itself 20
        this.assertEqualsEpsilon(pt(20, 36), this.text.getTextExtent(), 'no line break');
    },

    test03aFixedWidthCssProperties: function() {
        this.text.setTextString('aaa');
        this.text.applyStyle({fixedWidth: true, fixedHeight: false});
        this.text.setExtent(pt(20,15));
        var expected = {
            tagName: 'div', // world morph
            childNodes: [
                {tagName: 'div', childNodes: [ // world shape
                    {tagName: 'div',
                     childNodes: [{tagName: 'span'}],
                     style: {minWidth: function(val) { return val.test(/calc\(100%-)/)}}} // m and its shape
                ]}
            ]};

        this.assertNodeMatches(expected, this.text.renderContext().getMorphNode());
    },

    test04FixedWidthIncreasesTextExtent: function() {
        this.epsilon = 2;
        this.text.applyStyle({fontFamily: 'Courier', fontSize: 12,
                              fixedWidth: false, fixedHeight: false});
        this.text.setTextString('aaa');

        this.text.fit();

        this.assertEqualsEpsilon(pt(30, 18), this.text.getTextExtent(), 'hmm setup does not work');
        this.text.applyStyle({fixedWidth: true});
        this.text.setExtent(pt(40,15))
        this.assertEqualsEpsilon(pt(40, 18), this.text.getTextExtent(), "text extent didn't grow");
    },

    test05FillWithBigAndThenWithSmallTextResizesTextBounds: function() {
        this.epsilon = 2;
        this.text.applyStyle({fontFamily: 'Courier', fontSize: 12,
                              fixedWidth: true, fixedHeight: false,
                              clipMode: 'visible'});
        // actually should not be neccessary, but this is the feature we want to implement...
        this.text.setExtent(pt(50,50));
        this.text.textString = 'aaa';
        this.assertEqualsEpsilon(pt(50,18), this.text.getTextExtent(), 'hmm setup does not work');

        // make text big, should grow vertically
        this.text.setTextString('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        this.assertEquals(this.text.getTextExtent().x, 50.0,
                          'text should not have grown horizontally');
        this.assert(this.text.getTextExtent().y >= 75.0,
                    'text should have grown vertically (actual height: ' +
                    this.text.getTextExtent().y +
                    '), was expected to be at least 75.0');

        // make text small, vertical extent should shrink
        this.text.textString = 'aaa';
        this.assertEqualsEpsilon(pt(50,18), this.text.getTextExtent(),
                                 'text extent did not shrink');
    }

});

TestCase.subclass("lively.morphic.tests.Text.TextEmphasis",
'assertion', {
    createAndTestForEquality: function(emphSpec1, emphSpec2) {
        var emph1 = new lively.morphic.TextEmphasis(emphSpec1),
            emph2 = new lively.morphic.TextEmphasis(emphSpec2);
        return [emph1.equals(emph2), emph1, emph2];
    },
    assertTextEmphasisEquals: function(emphSpec1, emphSpec2) {
        var result = this.createAndTestForEquality(emphSpec1, emphSpec2);
        this.assert(result[0], result[1] + ' vs. ' + result[2]);
    },
    assertTextEmphasisUnEquals: function(emphSpec1, emphSpec2) {
        var result = this.createAndTestForEquality(emphSpec1, emphSpec2);
        this.assert(!result[0], result[1] + ' vs. ' + result[2]);
    }
},
'testing', {
    testEqual: function() {
        var testTable = [
            [{color: Color.red}, {color: Color.red}],
            [{color: Color.red}, {color: Color.rgba(204,0,0,1)}],
            [{backgroundColor: Color.red}, {backgroundColor: Color.rgba(204,0,0,1)}],
            [{isNullStyle: true}, {isNullStyle: true}],
            [{fontWeight: 'normal'}, {}],
            [{}, {foobarbaz: Color.green}]
        ];

       testTable.forEach(function(spec) {
           this.assertTextEmphasisEquals(spec[0], spec[1]);
       }, this);
    },

    testUnEqual: function() {
        var testTable = [
            [{}, {isNullStyle: true}],
            [{color: Color.red}, {color: Color.green}]
        ];

       testTable.forEach(function(spec) {
           this.assertTextEmphasisUnEquals(spec[0], spec[1]);
       }, this);
    },

    testInclude: function() {
        var emph = new lively.morphic.TextEmphasis({color: Color.red, fontWeight: 'bold'});
        this.assert(emph.include(emph), 'itself');
        this.assert(
            emph.include(new lively.morphic.TextEmphasis({color: Color.rgba(204,0,0,1)})),
            "similar emph");
        this.assert(emph.include({color: Color.red}, "object"))
        this.assert(emph.include({color: Color.rgba(204,0,0,1)}), "similar object")
        this.assert(emph.include({}), "empty object");
    },

    testDoesNotInclude: function() {
        var emph = new lively.morphic.TextEmphasis({color: Color.red, fontWeight: 'bold'});
        this.assert(
            !emph.include(new lively.morphic.TextEmphasis({color: Color.rgba(204,204,0,1)})),
            "emph with different prop value");
        this.assert(!emph.include({color: Color.green}, 'object with other prop'));
        this.assert(!emph.include({backgroundColor: Color.green}), 'no such prop is exist');
    },

    testAppliesOnlyWhitelistedAttributes: function() {
        var emph = new lively.morphic.TextEmphasis({color: Color.red, orphans: '2'}),
            htmlNode = {style: {}, setAttributeNS: function() {}};
        emph.applyToHTML(htmlNode);
        this.assertEquals(Color.red.toString(), htmlNode.style.color, 'no color');
        this.assert(!htmlNode.style.orphans, 'applied unwanted attr');
        this.assert(!emph.orphans, 'unwanted attr in emph');
    }
});

AsyncTestCase.subclass("lively.morphic.tests.Text.HoverActions",
'running', {
    setUp: function($super) {
        $super();
        this.actionQueue = lively.morphic.TextEmphasis.hoverActions;
    },
    tearDown: function() {
        if (this.morph) this.morph.remove();
    }
},
'testing', {
    test01EnterAndLeave: function() {
        var output = [];
        this.actionQueue.enter(function() { output.push('in') }, 1);
        this.actionQueue.leave(function() { output.push('out') }, 1);
        this.delay(function() {
            this.assertEqualState(['in', 'out'], output);
            this.done();
        }, 0);
    },

    test02EnterLeaveEnterInSameContext: function() {
        var output = [];
        this.actionQueue.enter(function() { output.push('in') }, 1);
        this.actionQueue.leave(function() { output.push('out') }, 1);
        this.actionQueue.enter(function() { output.push('in') }, 1);
        this.delay(function() {
            this.assertEqualState(['in'], output);
            this.done();
        }, 0);
    },

    test03EnterLeaveEnterLeaveInSameContext: function() {
        var output = [];
        this.actionQueue.enter(function() { output.push('in') }, 1);
        this.actionQueue.leave(function() { output.push('out') }, 1);
        this.actionQueue.enter(function() { output.push('in') }, 1);
        this.actionQueue.leave(function() { output.push('out') }, 1);
        this.delay(function() {
            this.assertEqualState(['in', 'out'], output);
            this.done();
        }, 0);
    },

    test04EnterLeaveInContext1AndEnterInContext2: function() {
        var output = [];
        this.actionQueue.enter(function() { output.push('in1') }, 1);
        this.actionQueue.leave(function() { output.push('out1') }, 1);
        this.actionQueue.enter(function() { output.push('in2') }, 2);
        this.delay(function() {
            this.assertEqualState(['in1', 'out1', 'in2'], output);
            this.done();
        }, 0);
    },

    test05EnterLeaveInContext1AndEnterLeaveInContext2: function() {
        var output = [];
        this.actionQueue.enter(function() { output.push('in1') }, 1);
        this.actionQueue.leave(function() { output.push('out1') }, 1);
        this.actionQueue.enter(function() { output.push('in2') }, 2);
        this.actionQueue.leave(function() { output.push('out2') }, 2);
        this.delay(function() {
            this.assertEqualState(['in1', 'out1', 'in2', 'out2'], output);
            this.done();
        }, 0);
    },

    test06InvokeHover: function() {
        var morph = new lively.morphic.Text(rect(0,0,100,100), "xyz");
        lively.morphic.World.current().addMorph(morph);
        morph.emphasizeAll({hover: {
            inAction: function() { this.x = 1 },
            outAction: (function() { this.x = x }).asScript({x: 2})
        }});

        // NOTE! jQuery event triggering is async!
        $(morph.firstTextChunk().getChunkNode()).trigger('mouseenter');
        this.delay(function() {
            this.assertEquals(1, morph.x);
            $(morph.firstTextChunk().getChunkNode()).trigger('mouseleave');
        }, 0);
        this.delay(function() {
            this.assertEquals(2, morph.x);
            this.done();
        }, 20);
    }

});

});