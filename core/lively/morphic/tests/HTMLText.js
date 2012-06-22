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
    }
});

});