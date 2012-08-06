module('lively.ide.SyntaxHighlighting').requires('lively.morphic', 'lively.ide.BrowserFramework').toRun(function() {

Object.subclass("lively.ide.SyntaxHighlighter",
'settings', {
    charLimit: null,
    minDelay: 100,
    maxDelay: 10000,
    defaultStyle: {color: Color.black, backgroundColor: null},
    rules: {}
},
'styling', {

    howToStyleString: function(string, rules, defaultStyle) {
        // converts a highlighter regexp rule like
        // {match: /bar/g, style: {color: 'blue'}}
        // into intervals with styles for string. If rule = the rule above then calling
        // text.howToStyleString('foo bar baz', [rule], {})
        // returns [[0,4, {}], [4,7, {color: blue}], [7, 11, {}]]
        var slices = [];
        for (var ruleName in rules) {
            if (!rules.hasOwnProperty(ruleName)) continue;
            var rule = rules[ruleName],
                m, re = rule.match, counter = 0;
            while ((m = re.exec(string))) {
                if (!m || !m[0]) continue;
                if (++counter > 9999) throw new Error('endless loop?');
                var from = m.index, to = m.index + m[0].length;
                slices.push([from, to, rule.style]);
            }
        }
        return Interval.intervalsInRangeDo(0, string.length, slices, function(slice, isNew) {
            if (isNew) { slice[2] = defaultStyle }; return slice;
        });
    },

    styleTextMorph: function(target) {
        // take highlighter rules and apply them to target's textString. As a result
        // of that we get text ranges and styles that cab be used to emphasize text
        // interval in target . Return true if styling the text has changed the DOM,
        // false otherwise (see #emphasizeRanges).
        var rulesForString = this.howToStyleString(
                target.textString, this.rules, this.defaultStyle);
        // rulesForString should be sorted!!!
        return target.emphasizeRanges(Interval.sort(rulesForString));
    }

});

lively.ide.SyntaxHighlighter.subclass('lively.ide.JSSyntaxHighlighter',
'settings', {
    minDelay: 300, // ms
    charLimit: 6000,
    rules: {
        // based on http://code.google.com/p/jquery-chili-js/ regex and colors
        num: {
            match: /\b[+-]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?\b/g,
            style: {color: Color.web.blue, backgroundColor: null}
        },
        reg_exp: {
            match: /\/[^\/\\\n]*(?:\\.[^\/\\\n]*)*\/[gim]*/g,
            style: {color: Color.web.maroon, backgroundColor: null}
        },
        brace: {
            match: /[\{\}]/g,
            style: {color: Color.web.green, backgroundColor: null}
        },
        statement: {
            match: /\b(with|while|var|try|throw|switch|return|if|for|finally|else|do|default|continue|const|catch|case|break)\b/g,
            style: {color: Color.web.navy, backgroundColor: null}
        },
        object: {
            match: /\b(String|RegExp|Object|Number|Math|Function|Date|Boolean|Array)\b/g,
            style: {color: Color.web.deeppink, backgroundColor: null}
        },
        superclassOrLayer: {
            match: /([A-Za-z.]+)(?=\.(subclass|refineClass|addMethods|extend))/g,
            style: {color: Color.web.navy, backgroundColor: null}
        },
        methodName: {
            match: /([A-Za-z0-9_$]+:)/g,   // (?= function)
            style: {color: Color.web.darkred, backgroundColor: null}
        },
        lively: {
            match: /\b(subclass|refineClass|addMethods|extend)\b/g,
            style: {color: Color.web.gray, backgroundColor: null}
        },
        error: {
            match: /\b(URIError|TypeError|SyntaxError|ReferenceError|RangeError|EvalError|Error)\b/g,
            style: {color: Color.web.coral, backgroundColor: null}
        },
        property: {
            match: /\b(undefined|arguments|NaN|Infinity)\b/g,
            style: {color: Color.web.purple, backgroundColor: null}
        },
        operator: {
            match: /\b(void|typeof|this|new|instanceof|in|function|delete)\b/g,
            style: {color: Color.web.darkblue, backgroundColor: null}
        },
        string: {
            match: /(?:\'[^\'\\\n]*(?:\\.[^\'\\\n]*)*\')|(?:\"[^\"\\\n]*(?:\\.[^\"\\\n]*)*\")/g,
            style: {color: Color.web.teal, backgroundColor: null}
        },
        ml_comment: {
            match: /\/\*[^*]*\*+(?:[^\/][^*]*\*+)*\//g,
            style: {color: Color.web.gray, backgroundColor: null}
        },
        sl_comment: {
              match: /\/\/.*/g,
              style: {color: Color.web.green, backgroundColor: null}
        },
        trailingWhitespace: {
            match: /[ \t]+[\n\r]/g,
            style: {backgroundColor: Color.yellow.withA(0.4)}
        }
    }
});

lively.ide.SyntaxHighlighter.subclass('lively.ide.LaTeXSyntaxHighlighter',
'settings', {
    rules: {
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

Object.extend(lively.ide.SyntaxHighlighter, {
    forJS: function() {
        // js highlighter has no state, so simply reuse on instance
        return this._jsHighlighter = this._jsHighlighter || new lively.ide.JSSyntaxHighlighter();
    }
});

lively.morphic.Text.addMethods(
'syntax highlighter settings', {
    syntaxHighlighter: lively.ide.SyntaxHighlighter.forJS()
});

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

Object.extend(Global, {
    SyntaxHighlighter: lively.ide.SyntaxHighlighter
});


}) // end of module