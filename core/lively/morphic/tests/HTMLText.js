module('lively.morphic.tests.HTMLText').requires('lively.morphic.tests.Helper').toRun(function() {

lively.morphic.tests.TestCase.subclass('lively.morphic.tests.HTMLText.TextAttributes',
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
        this.text = new lively.morphic.Text(new Rectangle(0,0, 400, 200));
        this.world.addMorph(this.text);
    },
},
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
        this.assertEquals('br', lastNode.tagName);
        this.text.sliceTextChunks(0,2); this.text.coalesceChunks(); // slice'n fix
        lastNode = Array.from(chunks.last().getChunkNode().childNodes).last();
        this.assertEquals('br', lastNode.tagName);
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

    testSourceToNodeCallsAlert: function(data) {
        var orgAlert = Global.alert;
        try {
            var here=false;
            alert = function() { here=true}
            var s = 'hello<badtag>bla'
            var node = lively.morphic.HTMLParser.sourceToNode(s);
            this.assert(here,"alert did not get called")
        } finally {
            Global.alert = orgAlert
        }
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

});