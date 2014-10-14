module('lively.morphic.tests.HTMLText').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.HTMLText.TestCase',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
        this.text = new lively.morphic.Text(new Rectangle(0,0, 400, 200));
        this.world.addMorph(this.text);
    }
});

lively.morphic.tests.HTMLText.TestCase.subclass('lively.morphic.tests.HTMLText.TextAttributes',
'testing', {
    test01RenderingTextShadow: function() {
        this.text.setTextString('eintest');
        this.text.emphasizeAll({textShadow: {offset: pt(1,1), blur: 2, color: Color.red}});
        this.checkChunks([{textString: 'eintest'}]);
        this.checkDOM([{
            tagName: 'span',
            textContent: 'eintest',
            style: {textShadow: ['rgb(204,0,0)', '1px', '1px', '2px'].join('')}
        }]);
    },

    test02ReplaceTextStringKeepsStyling: function() {
        this.text.replaceTextString('eintest');
        this.text.emphasizeAll({fontWeight: 'bold'});
        this.text.replaceTextString('foo');
        this.checkChunks([{textString: 'foo'}]);
        this.checkDOM([{
            tagName: 'span',
            textContent: 'foo',
            style: {fontWeight: 'bold'}
        }]);
    },

    test03SetInputAllowedSetsContenteditable: function() {
        var textNode = this.text.renderContext().textNode;
        this.assert(textNode.contenteditable, 'contenteditable not enabled by default');
        this.text.setInputAllowed(false);
        this.assert(!textNode.contenteditable, 'contenteditable not disabled');
    },

    test04InsertRichTextAndCopy: function() {
        this.text.textString = "Heoe!";
        this.assertEquals(this.text.copy().textString, "Heoe!");
        this.text.insertRichTextAt("y J", {color:Color.red}, 2);
        this.assertEquals(this.text.textString, "Hey Joe!", "text after insert");
        this.assertEquals(this.text.copy().textString, "Hey Joe!", "text after copy");
        this.checkDOM([{tagName: 'span', textContent: 'He', style: {}},
                       {tagName: 'span', textContent: 'y J', style: {color: 'rgb(204,0,0)'}},
                       {tagName: 'span', textContent: 'oe!', style: {}}]);
    },

    test05MergingTextChunksEnsuresLastBr: function() {
        this.text.textString = "Test";
        var chunks = this.text.getTextChunks();
        chunks.last().ensureEndsWithBr();
        var lastNode = Array.from(chunks.last().getChunkNode().childNodes).last();
        this.assertEquals('br', lastNode.tagName.toLowerCase());
        this.text.sliceTextChunks(0,2); this.text.coalesceChunks(); // slice'n fix
        lastNode = Array.from(chunks.last().getChunkNode().childNodes).last();
        this.assertEquals('br', lastNode.tagName.toLowerCase());
    },

    test06SetDoit: function() {
        this.text.setTextString('eintest');
        this.text.emphasize({doit: {code: 'Global.textDoitInvoked=true'}}, 0, 3);
        this.checkChunks(
            [{textString: 'ein', style: {doit: {
                code: "Global.textDoitInvoked=true", context: null}}},
             {textString: 'test'}]);
        var events = lively.$._data(this.text.firstTextChunk().getChunkNode(), "events");

        this.assertEquals(1, events.mouseup.length, 'no doit event handler?');

        this.text.emphasize({doit: {code: 'Global.textDoitInvoked=true'}}, 0, 3);
        events = lively.$._data(this.text.firstTextChunk().getChunkNode(), "events");
        this.assertEquals(1, events.mouseup.length, 'multiple doit event handler?');
    },

    test07OnlyOneHoverEventHandler: function() {
        this.world.addMorph(this.text);
        this.text.setTextString('xyz');
        var hoverSpec1 = {
            inAction: function() { return 1 },
            outAction: function() { return 2 }
        };
        this.text.emphasize({hover: hoverSpec1}, 0, 3);
        this.checkChunks([{
            textString: "xyz",
            style: {hover: hoverSpec1}
        }]);

        var events1 = lively.$._data(this.text.firstTextChunk().getChunkNode(), "events");
        // jQuery decides whether it implements mouseenter/leave with
        // mouseover/out or directly with mouseenter/leave
        this.assertEquals(1, (events1.mouseover || events1.mouseenter).length);
        this.assertEquals(1, (events1.mouseout || events1.mouseleave).length);

        var hoverSpec2 = {
            inAction: function() { return 3 },
            outAction: function() { return 4 }
        };
        this.text.emphasize({hover: hoverSpec2}, 0, 3);
        this.checkChunks([{
            textString: "xyz",
            style: {hover: hoverSpec2}
        }]);
        var events2 = lively.$._data(this.text.firstTextChunk().getChunkNode(), "events");
        this.assertEquals(1, (events2.mouseover || events2.mouseenter).length);
        this.assertEquals(1, (events2.mouseout || events2.mouseleave).length);
    }

});

AsyncTestCase.subclass('lively.morphic.tests.HTMLText.Extent', lively.morphic.tests.HTMLText.TestCase.prototype,
// lively.morphic.tests.HTMLText.Extent.remove()
'testing', {
    testExtentOfClippedAndFixedText: function() {
        var text = new lively.morphic.Text(lively.rect(0,0, 200, 300), 'foo');
        text.applyStyle({fontFamily: 'Courier', fontSize: 12, clipMode: 'auto',
                         fixedWidth: true, fixedHeight: true});
        this.world.addMorph(text);
        var p = text.getPadding(), borderWidth = text.getBorderWidth();
        this.assertEquals(
            pt(200,300).addXY(-p.left() - p.right() - 2*borderWidth, -p.top() - p.bottom() - 2*borderWidth),
            text.getTextExtent());
        this.done();
    },
    testComputeRealExtent: function() {
        var text = new lively.morphic.Text(lively.rect(0,0, 200, 300), 'foo');
        text.applyStyle({fontFamily: 'Courier', fontSize: 12, clipMode: 'auto',
                         fixedWidth: true, fixedHeight: true});
        text.emphasize({fontSize: 24}, 1,2);
        this.world.addMorph(text);
        var bounds = text.computeRealTextBounds();
        this.epsilon = 3;
        this.assertEqualsEpsilon(lively.rect(5,3,39,37), bounds);
        this.done();
    }
});

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.HTMLText.HtmlParserTests',
'running', {
    setUp: function($super) {
        $super();
        this.sut = lively.morphic.HTMLParser
    }
},
'testing', {
    testSanitizeHtml: function() {
        var s1 = "a<br>b"
        var r1 = this.sut.sanitizeHtml(s1)
        this.assertEquals(r1, "a<br />b")
    },
    testSanitizeHtmlReplaceAmp: function() {
        var s1 = "a&b"
        var r1 = this.sut.sanitizeHtml(s1)
        this.assertEquals(r1, "a&amp;b")
    },
    testSanitizeHtmlUnbalancedTags: function() {
        var s1 = "<span>abc",
            r1 = this.sut.sanitizeHtml(s1);
        this.assertEquals(r1, "abc");
    },

    testSourceCodeToNodeStrippedBRs: function() {
      var node = lively.morphic.HTMLParser.sourceToNode('a<br />b')
      lively.morphic.HTMLParser.sanitizeNode(node);
      this.assertEquals(node.textContent, "ab", "wrong node")

      richText = new lively.morphic.RichText(node.textContent);
      this.assertEquals(richText.textString, "ab", "wrong text string")
    },

    testSanitizeNode: function() {
        var s = "<html>\n<body>\n<!--StartFragment-->\n"
              + "<span>a\nb</span>\n"
              + "<!--EndFragment-->\n</body>\n</html>",
            node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "a\nb", "too many newlines");
    },
    testSanitizeNodeWithNewlineInSpan: function() {
        var s = '<span>a</span><span>\n</span><span>b</span>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "a\nb", "wrong newlines");
    },
    testSanitizeNodeWindowsChromeWithNewLine: function() {
        var s = '<html>\n<body>\n<!--StartFragment-->\n<span>hello\n</span><br class="Apple-interchange-newline">\n<!--EndFragment-->\n</body>\n</html>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "hello\n", "wrong newlines");
    },
    testSanitizeNodeLinuxWithMetaTag: function() {
        var s = '<meta ><span>bombs</span>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "bombs", "linux meta tag brakes it");
    },

    testSourceToNodeWithInvalidTag: function(data) {
        var node = lively.morphic.HTMLParser.sourceToNode('hello<invalidtag>bla');
        this.assert(node.innerHTML, 'hello<invalidtag>bla</invalidtag>');
    },

    testSanitizeNodeWithAmp: function() {
        var s = '<a href="http://host/p?a=1&b=2">bla</a>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "bla", "pasting with & is broken");
    },
    testSanitizeNodeWithAmp2: function() {
        var s = '<a href="http://host/p?a=1%26b=2">H&amp;M</a>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "H&M", "pasting with & is broken");
    },
    testSanitizeNodeWithLt: function() {
        var s = '1&lt;2';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "1<2", "pasting with & is broken");
    },

    testSanitizeNodeWithLt2: function() {
        var s = '<span>&lt;</span>';
        var node = lively.morphic.HTMLParser.sourceToNode(s);
        lively.morphic.HTMLParser.sanitizeNode(node);
        this.assertEquals(node.textContent, "<", "pasting with < is broken");
    }

});

lively.morphic.tests.HTMLText.TestCase.subclass('lively.morphic.tests.HTMLText.ObjectEmbedding',
'testing', {
    xtest01EmbedSimpleMorph: function() {
        var m = lively.morphic.Morph.makeRectangle(0,0,100,100),
            t = this.text;
        t.setTextString('ein test');
        t.emphasizeRanges([[3,4, {embeddedMorph: m}]]);
        // this.checkChunks([{textString: 'ein test'}]);
        this.checkDOM([
            {tagName: 'span',textContent: 'ein'},
            {tagName: 'span',childNodes: {tagName: 'div'}},
            {tagName: 'span',textContent: 'test'}]);
    }
});

});
