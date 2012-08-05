module('lively.ide.tests.SyntaxHighlighting').requires('lively.morphic.tests.Helper', 'lively.ide.SyntaxHighlighting').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.ide.tests.SyntaxHighlighting.Basic',
'running', {
    setUp: function($super) {
        $super();
        this.barHighlighter = new lively.ide.SyntaxHighlighter();
        this.barHighlighter.rules = {bar: {match: /bar/g, style: {fontWeight: 'bold'}}};
    }
},
'testing', {
    test01SimpleHighlighterStylesText: function() {
        this.text = new lively.morphic.Text(new Rectangle(0,0,100,100), 'foo bar baz');
        var hl = this.barHighlighter;
        hl.styleTextMorph(this.text);
        this.checkChunks([{textString: 'foo ', style: {}},
                          {textString: 'bar', style: {fontWeight: 'bold'}},
                          {textString: ' baz', style: {}}])
    },
    test02TextHasHighlighters: function() {
        this.text = new lively.morphic.Text(new Rectangle(0,0,100,100), 'foobar');
        this.checkChunks([{textString: 'foobar', style: {}}]);

        // install highlighter obj
        this.text.syntaxHighlighters = [this.barHighlighter];
        this.text.highlightSyntax();
                this.checkChunks([{textString: 'foo'},
                          {textString: 'bar'}]);
        this.checkChunks([{textString: 'foo', style: {}},
                          {textString: 'bar', style: {fontWeight: 'bold'}}]);
     },
    test3SyntaxHighlightingCanProduceJSHighlighter: function() {
        var jsHighlighter1 = lively.ide.SyntaxHighlighter.forJS(),
            jsHighlighter2 = lively.ide.SyntaxHighlighter.forJS();
        this.assertIdentity(jsHighlighter1, jsHighlighter2, 'not identical highlighters');
     }
});

AsyncTestCase.subclass('lively.ide.tests.SyntaxHighlighting.Timing',
'running', {
    setUp: function($super) {
        $super();
        this.barHighlighter = new lively.ide.SyntaxHighlighter();
        this.barHighlighter.rules = {bar: {match: /bar/g, style: {fontWeight: 'bold'}}};
        this.barHighlighter.minDelay = 50;
        this.barHighlighter.maxDelay = 250;
        this.text = new lively.morphic.Text(new Rectangle(0,0,100,100), 'foobar');
        this.text.syntaxHighlighters = [this.barHighlighter];
    },
    checkChunks: lively.morphic.tests.MorphTests.prototype.checkChunks
},
'testing', {

    test01HighlightSyntaxAccordingToDelayLimits: function() {
        this.checkChunks([{textString: 'foobar'}]);
        this.text.enableSyntaxHighlighting();
        this.checkChunks([{textString: 'foobar'}]);

        var delay = this.text.syntaxHighlighters.pluck('minDelay').max() + 40;
        this.delay(function() {
            this.checkChunks([{textString: 'foo'}, {textString: 'bar'}],
                'enableSyntaxHighlighting not working');
            this.text.textString = 'barfoo';
            this.checkChunks([{textString: 'barfoo'}]);
        }, delay);

        this.delay(function() {
            this.checkChunks([{textString: 'bar'}, {textString: 'foo'}],
                             'syntaxHighlighting after textString change');
            this.done();
        }, delay*2);
    }

});

}) // end of module