module('lively.ide.SyntaxHighlighting').requires('lively.morphic', 'lively.ide.BrowserFramework').toRun(function() {

Object.subclass("SyntaxHighlighter", {

});

Object.extend(SyntaxHighlighter, {
    JavaScriptRules: {
        // based on http://code.google.com/p/jquery-chili-js/ regex and colors
        num: {
            match: /\b[+-]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?\b/g,
            style: {color: Color.web.blue}
        },
        reg_exp: {
            match: /\/[^\/\\\n]*(?:\\.[^\/\\\n]*)*\/[gim]*/g,
            style: {color: Color.web.maroon}
        },
        brace: {
            match: /[\{\}]/g,
            style: {color: Color.web.green}
        },
        statement: {
            match: /\b(with|while|var|try|throw|switch|return|if|for|finally|else|do|default|continue|const|catch|case|break)\b/g,
            style: {color: Color.web.navy}
        },
        object: {
            match: /\b(String|RegExp|Object|Number|Math|Function|Date|Boolean|Array)\b/g,
            style: {color: Color.web.deeppink}
        },
        superclassOrLayer: {
            match: /([A-Za-z.]+)(?=\.(subclass|refineClass|addMethods|extend))/g,
            style: {color: Color.web.navy}
        },
        methodName: {
            match: /([A-Za-z0-9_$]+:)/g,   // (?= function)
            style: {color: Color.web.darkred}
        },
        lively: {
            match: /\b(subclass|refineClass|addMethods|extend)\b/g,
            style: {color: Color.web.gray}
        },
        error: {
            match: /\b(URIError|TypeError|SyntaxError|ReferenceError|RangeError|EvalError|Error)\b/g,
            style: {color: Color.web.coral}
        },
        property: {
            match: /\b(undefined|arguments|NaN|Infinity)\b/g,
            style: {color: Color.web.purple}
        },
        operator: {
            match: /\b(void|typeof|this|new|instanceof|in|function|delete)\b/g,
            style: {color: Color.web.darkblue}
        },
        string: {
            match: /(?:\'[^\'\\\n]*(?:\\.[^\'\\\n]*)*\')|(?:\"[^\"\\\n]*(?:\\.[^\"\\\n]*)*\")/g,
            style: {color: Color.web.teal}
        },
        ml_comment: {
            match: /\/\*[^*]*\*+(?:[^\/][^*]*\*+)*\//g,
            style: {color: Color.web.gray}
        },
        sl_comment: {
              match: /\/\/.*/g,
              style: {color: Color.web.green}
        },
        trailingWhitespace: {
            match: /[ \t]+[\n\r]/g,
            style: {backgroundColor: Color.yellow.withA(0.4)}
        }
    },
    LaTeXRules: {
        num: {
            match: /\b[+-]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?\b/g,
            style: {color: Color.web.blue}
        },
        brace: {
            match: /[\{\}]/g,
            style: {color: Color.web.deeppink}
        },
        braceContents: {
            match: /\{([^\}]+)\}/g,
            style: {color: Color.black, fontStyle: 'italic'}
        },
        parameters: {
            match: /\[[^\]]+\]/g,
            style: {color: Color.web.mediumvioletred}
        },
        command: {
            match: /\\[^{\s\[]+/g,
            style: {color: Color.web.sandybrown}
        },
        string: {
            match: /(?:\'[^\'\\\n]*(?:\\.[^\'\\\n]*)*\')|(?:\"[^\"\\\n]*(?:\\.[^\"\\\n]*)*\")/g,
            style: {color: Color.web.teal}
        },
        comment: {
            match: /[^\\]%[^\n]+/g,
            style: {color: Color.web.green}
        }
    }
});

lively.morphic.Text.addMethods(
'syntax highlighting', {
    syntaxHighlightingCharLimit: 8000,
    syntaxHighlightingMinDelay: 300,
    syntaxHighlightingMaxDelay: 10000,

    highlightJavaScriptSyntax: function() {
        // FIXME use defaultconfig
        if (URL.source && URL.source.toString().include('disableSyntaxHighlighting=true')) return false;
        if (!this.renderContext().textNode) return false; // FIXME
        var length = this.textString.length;
        if (length > this.syntaxHighlightingCharLimit) return false;
        Global.clearTimeout(this._syntaxHighlightTimeout);
        var self = this;
        function later() {
            self._syntaxHighlightTimeout = null;
            var start = Date.now();
            self.highlightSyntaxFromTo(0, self.textString.length,
                                       SyntaxHighlighter.JavaScriptRules);
            self.lastSyntaxHighlightTime = Date.now() - start;
        };
        if (this.lastSyntaxHighlightTime >= 0) {
            var time = this.lastSyntaxHighlightTime * 2;
            time = Math.max(this.syntaxHighlightingMinDelay, time);
            time = Math.min(this.syntaxHighlightingMaxDelay, time);
            this._syntaxHighlightTimeout = Global.setTimeout(later, time);
        } else {
            later();
        }
        return true;
    },

    applyHighlighterRules: function(target, highlighterRules) {
        for (var ruleName in highlighterRules) {
            if (!highlighterRules.hasOwnProperty(ruleName)) continue;
            var rule = highlighterRules[ruleName];
            target.emphasizeRegex(rule.match, rule.style)
        }
    },

    highlightSyntaxFromTo: function(from, to, highlighterRules) {
        var selRange = this.getSelectionRange(),
            scroll = this.getScroll();
        // this.emphasize({color: Color.black}, from, to);
        this.applyHighlighterRules(this, highlighterRules);
        selRange && this.setSelectionRange(selRange[0], selRange[1]);
        scroll && this.setScroll(scroll[0], scroll[1]);
    },

    highlightLaTeXSyntax: function() {
        // FIXME use defaultconfig
        if (URL.source && URL.source.toString().include('disableSyntaxHighlighting=true')) return;
        if (!this.renderContext().textNode) return; // FIXME
        var later = function() {
            this._syntaxHighlightTimeout = null;
            this.highlightSyntaxFromTo(0, this.textString.length,
                SyntaxHighlighter.LaTeXRules);
        }.bind(this);
        clearTimeout(this._syntaxHighlightTimeout);
        this._syntaxHighlightTimeout = setTimeout(later, 300);
    }

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