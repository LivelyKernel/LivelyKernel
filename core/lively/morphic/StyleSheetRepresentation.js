module('lively.morphic.StyleSheetRepresentation').requires().toRun(function() {

Object.subclass('lively.morphic.StyleSheet',
'init', {
    isStyleSheet: true,
    initialize: function(rules, originMorph) {
        this.setRules(rules);
        this.setOriginMorph(originMorph);
    }
},
'Getter', {
    getText: function() {
        // Returns the CSS formated text of the style sheet
        return this.rules.reduce(function(prev, rule, i, rules) {
                // Add two newlines after each rule, except the last
                return prev + rule.getText()
                    + (i < rules.length - 1 ? '\n\n' : '');
            }, '');
    },
    getRules: function() {
        return this.rules;
    },
    getOriginMorph: function() {
        return this.originMorph;
    }
},
'Setter', {
    setRules: function(rules) {
        this.rules = rules || [];
        this.rules.each(function(rule) {
                rule.setStyleSheet(this);
            }, this);
    },
    setOriginMorph: function(morph) {
        this.originMorph = morph;
    }
}
);

Object.subclass('lively.morphic.StyleSheetRule',
'init', {
    isStyleSheetRule: true,
    initialize: function(selector, declarations, styleSheet) {
        this.setDeclarations(declarations);
        this.setStyleSheet(styleSheet);
        this.setSelector(selector);
    }
},
'Getter', {
    getDeclarations: function() {
        return this.declarations.clone();
    },
    getStyleSheet: function() {
        return this.styleSheet;
    },
    getOriginMorph: function() {
        return this.styleSheet ? this.styleSheet.getOriginMorph() : null;
    },
    getSelector: function() {
        return this.selector;
    },
    getText: function() {
        // Returns the CSS formated text of the rule
        var result = '';
        result += this.selector;
        result += '{\n';
        this.declarations.each(function(decl) {
                result += '\t' + decl.getText() + '\n';
            });
        result += '}';
        return result;
    }
},
'Setter', {
    setDeclarations: function(declarations) {
        this.declarations = declarations || [];
        this.declarations.each(function(decl) {
                decl.setRule(this);
            }, this);
    },
    setStyleSheet: function(styleSheet) {
        this.styleSheet = styleSheet;
    },
    setSelector: function(selector) {
        this.selector = selector || '';
    }
}
);

lively.morphic.StyleSheetRule.subclass('lively.morphic.StyleSheetComment',
'init', {
    isStyleSheetComment: true,
    initialize: function($super, comment, styleSheet) {
        this.setComment(comment);
        $super('', [], styleSheet);
    }
},
'Getter', {
    getText: function() {
        return this.comment;
    }
},
'Setter', {
    setComment: function(comment) {
        this.comment = comment || '\n';
    }
}
);

lively.morphic.StyleSheetRule.subclass('lively.morphic.StyleSheetFontFaceRule',
'init', {
    isStyleSheetFontFaceRule: true,
    initialize: function($super, declarations, styleSheet) {
        $super('', declarations, styleSheet);
    }
},
'Getter', {
    getText: function() {
        // Returns the CSS formated text of the rule
        var result = '';
        result += '@font-face {\n';
        this.declarations.each(function(decl) {
                result += '\t' + decl.getText() + '\n';
            });
        result += '}';
        return result;
    }
},
'Setter', {
    setComment: function(comment) {
        this.comment = comment || '\n';
    }
}
);

Object.subclass('lively.morphic.StyleSheetDeclaration',
'init', {
    isStyleSheetDeclaration: true,
    initialize: function(property, values, rule, priority) {
        this.setValues(values);
        this.setRule(rule);
        this.setProperty(property);
        this.setPriority(priority);
    }
},
'Getter', {
    getValues: function() {
        return this.values.clone();
    },
    getStyleSheet: function() {
        return this.rule ? this.rule.getStyleSheet() : null;
    },
    getRule: function() {
        return this.rule;
    },
    getOriginMorph: function() {
        return this.getStyleSheet() ? this.getStyleSheet().getOriginMorph() : null;
    },
    getProperty: function() {
        return this.property;
    },
    getPriority: function() {
        return this.priority;
    },
    getText: function() {
        // Returns the CSS formated text of the style declaration (i.e. 'property: values;')
        var result = '';
        result += this.property;
        result += ':';
        this.values.each(function(value) {
                result += ' ' + value;
            });
        if (this.getPriority()) {
            result += ' !important';
        }
        result += ';';
        return result;
    }
},
'Setter', {
    setValues: function(values) {
        this.values = values || [];
    },
    setRule: function(rule) {
        this.rule = rule;
    },
    setProperty: function(property) {
        this.property = property || '';
    },
    setPriority: function(priority) {
        this.priority = priority || false;
    }
}
);

}) // end of module