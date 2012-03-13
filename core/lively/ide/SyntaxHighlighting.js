module('lively.ide.SyntaxHighlighting').requires(['lively.morphic', 'lively.ide.BrowserFramework'].concat(Config.isNewMorphic ?  [] : ['lively.deprecated.SyntaxHighlighting'])).toRun(function() {

Object.subclass("SyntaxHighlighter", {

});

Object.extend(SyntaxHighlighter, {
    JavaScriptRules: {
        // based on http://code.google.com/p/jquery-chili-js/ regex and colors
        num: { 
              match: /\b[+-]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?\b/g
            , style: {color: Color.web.blue}
        },
        reg_exp: { 
              match: /\/[^\/\\\n]*(?:\\.[^\/\\\n]*)*\/[gim]*/g
            , style: {color: Color.web.maroon}
        },
        brace: { 
              match: /[\{\}]/g
            , style: {color: Color.web.green}
        },
        statement: { 
              match: /\b(with|while|var|try|throw|switch|return|if|for|finally|else|do|default|continue|const|catch|case|break)\b/g
            , style: {color: Color.web.navy}
        },
        object: { 
              match: /\b(String|RegExp|Object|Number|Math|Function|Date|Boolean|Array)\b/g
            , style: {color: Color.web.deeppink}
        },
        superclassOrLayer: { 
              match: /([A-Za-z.]+)(?=\.(subclass|refineClass|addMethods|extend))/g
            , style: {color: Color.web.navy}
        },
        methodName: { 
              match: /([A-Za-z0-9_$]+:)/g   // (?= function)
            , style: {color: Color.web.darkred}
        },
        lively: { 
              match: /\b(subclass|refineClass|addMethods|extend)\b/g
            , style: {color: Color.web.gray}
        },
        error: { 
              match: /\b(URIError|TypeError|SyntaxError|ReferenceError|RangeError|EvalError|Error)\b/g
            , style: {color: Color.web.coral}
        },
        property: { 
              match: /\b(undefined|arguments|NaN|Infinity)\b/g
            , style: {color: Color.web.purple}
        },
        'function': { 
              match: /\b(parseInt|parseFloat|isNaN|isFinite|eval|encodeURIComponent|encodeURI|decodeURIComponent|decodeURI)\b/g
            , style: {color: Color.web.olive}
        },
        operator: {
              match: /\b(void|typeof|this|new|instanceof|in|function|delete)\b/g
            , style: {color: Color.web.darkblue}
        },
        string: { 
              match: /(?:\'[^\'\\\n]*(?:\\.[^\'\\\n]*)*\')|(?:\"[^\"\\\n]*(?:\\.[^\"\\\n]*)*\")/g
            , style: {color: Color.web.teal}
        },
        ml_comment: { 
              match: /\/\*[^*]*\*+(?:[^\/][^*]*\*+)*\//g
            , style: {color: Color.web.gray}
        }
        , sl_comment: { 
              match: /\/\/.*/g
            , style: {color: Color.web.green}
        }
    },
    LaTeXRules: {
        num: { 
              match: /\b[+-]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?\b/g
            , style: {color: Color.web.blue}
        },
        brace: { 
              match: /[\{\}]/g,
              style: {color: Color.web.deeppink}
        },
        braceContents: { 
              match: /\{([^\}]+)\}/g,
              style: {fontStyle: 'italic'}
        },
        parameters: { 
              match: /\[[^\]]+\]/g
            , style: {color: Color.web.mediumvioletred}
        },
        command: { 
              match: /\\[^{\s\[]+/g
            , style: {color: Color.web.sandybrown}
        },
        string: { 
              match: /(?:\'[^\'\\\n]*(?:\\.[^\'\\\n]*)*\')|(?:\"[^\"\\\n]*(?:\\.[^\"\\\n]*)*\")/g
            , style: {color: Color.web.teal}
        },
        comment: { 
              match: /[^\\]%[^\n]+/g,
                style: {color: Color.web.green}
        },
    }
    
});

if (!Config.isNewMorphic) return;

lively.morphic.Text.addMethods(
'syntax highlighting', {
    syntaxHighlightingCharLimit: 4000,
    highlightJavaScriptSyntax: function() {
        // FIXME use defaultconfig
        if (URL.source && URL.source.toString().include('disableSyntaxHighlighting=true')) return;
        if (!this.renderContext().textNode) return; // FIXME
        var length = this.textString.length;

        if (length > this.syntaxHighlightingCharLimit) return;
        var currentMs = Date.now();
        if (this.lastSyntaxHighlightTime && (currentMs-this.lastSyntaxHighlightTime < 300)) return;
        this.lastSyntaxHighlightTime = currentMs;
        this.highlightSyntaxFromTo(0, length, SyntaxHighlighter.JavaScriptRules);
    },

    highlightSyntaxFromTo: function(from, to, highlighterRules) {
        var selRange = this.getSelectionRange(),
            scroll = this.getScroll();
        if (false) {
            this.emphasize({color: Color.black, fontWeight: 'normal'}, from, to);
            for (var ruleName in highlighterRules) {
                if (!highlighterRules.hasOwnProperty(ruleName)) continue;
                var rule = highlighterRules[ruleName];
                this.emphasizeRegex(rule.match, rule.style)
            }
        } else {
            var rt = new lively.morphic.RichText(this.textString);
            for (var ruleName in highlighterRules) {
                if (!highlighterRules.hasOwnProperty(ruleName)) continue;
                var rule = highlighterRules[ruleName];
                rt.emphasizeRegex(rule.match, rule.style)
            }
            this.setRichText(rt)
        }
        selRange && this.setSelectionRange(selRange[0], selRange[1]);
        scroll && this.setScroll(scroll[0], scroll[1]);
    },
    highlightLaTeXSyntax: function() {
        // FIXME use defaultconfig
        if (URL.source && URL.source.toString().include('disableSyntaxHighlighting=true')) return;
        if (!this.renderContext().textNode) return; // FIXME
        var length = this.textString.length;

        // if (length > 10000) return;
        var currentMs = Date.now();
        if (this.lastSyntaxHighlightTime && (currentMs-this.lastSyntaxHighlightTime < 300)) return;
        this.lastSyntaxHighlightTime = currentMs;
        this.highlightSyntaxFromTo(0, length, SyntaxHighlighter.LaTeXRules);
    },

})

cop.create("SyntaxHighlightLayer")
.refineClass(lively.ide.BasicBrowser, {

    hightlightSourcePane: function() {
        // alertOK('higlight')
        var m = this.panel.sourcePane.innerMorph();
        if (m.textString.length < 10000) {
            try {
                // var time = Functions.timeToRun(function(){m.highlightJavaScriptSyntax()});
                //m.highlightJavaScriptSyntax();
            } catch (er) {
                console.log("Error during Syntax Highligthing " + er)
            }
            m.setFontFamily('Courier')
        }
        // alertOK('Browser Syntax Highligth ' +time+ "ms", Color.blue, 3)
    },

    onPane2SelectionUpdate: function(node) {
        cop.proceed(node);
        this.hightlightSourcePane();
    },

    onPane4SelectionUpdate: function(node) {
        cop.proceed(node);
        this.hightlightSourcePane();
    },

    buildView: function(extent) {
        var morph = cop.proceed(extent)
        // this.panel.sourcePane.innerMorph().setWithLayers([BrowserSyntaxHighlightLayer])
        return morph
    }
});




}) // end of module