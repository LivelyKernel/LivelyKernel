module('apps.StyleSheetVisualization').requires('lively.morphic.StyleSheets', 'lively.morphic.Core').toRun(function() {

lively.morphic.Morph.addMethods(
'Get Rules Data', {
    shorthands: {
        'background' : [
            'background-color',
            'background-image',
            'background-repeat',
            'background-position'
        ],
        'margin' : [
            'margin-top',
            'margin-bottom',
            'margin-left',
            'margin-right'
        ],
        'padding' : [
            'padding-top',
            'padding-bottom',
            'padding-left',
            'padding-right'
        ],
        'border-color' : [
            'border-top-color',
            'border-right-color',
            'border-bottom-color',
            'border-left-color'
        ],
        'border-style' : [
            'border-top-style',
            'border-right-style',
            'border-bottom-style',
            'border-left-style'
        ],
        'border-width' : [
            'border-top-width',
            'border-right-width',
            'border-bottom-width',
            'border-left-width'
        ],
        'border-left' : [
            'border-left-width',
            'border-left-style',
            'border-left-color'
        ],
        'border-bottom' : [
            'border-bottom-width',
            'border-bottom-style',
            'border-bottom-color'
        ],
        'border-top' : [
            'border-top-width',
            'border-top-style',
            'border-top-color'
        ],
        'border-right' : [
            'border-right-width',
            'border-right-style',
            'border-right-color'
        ],
        'border' : [
            'border-width',
            'border-style',
            'border-color'
        ],
        'outline' : [
            'outline-width',
            'outline-style',
            'outline-color'
        ],
        'cue' : [
            'cue-before',
            'cue-after'
        ],
        'pause' : [
            'pause-before',
            'pause-after'
        ],
        'font' : [
            'font-style',
            'font-variant', 
            'font-weight', 
            'font-size',
            'line-height', 
            'font-family' 
        ],
        'list-style' : [
            'list-style-type',
            'list-style-image',
            'list-style-position'
        ]
    },
    getAllStyleSheetDeclarations: function() {
        // Returns all of the morph's style declarations, overridden or not,
        // from all applicable css rules.
        //
        // Comes as an Array.

        var aggregatedStyle = {},
            rules = this.getMatchingStyleSheetRules(),
            result = [];

        // iterate over the ordered rules
        rules.each(function(rule) {
            var aggregatedStyleForRule = {},
                ruleDeclarations = [];
            rule.declarations.each(function(decl){
                if (aggregatedStyleForRule[decl.property] &&
                    aggregatedStyleForRule[decl.property].priority &&
                    !decl.priority) {
                    // if the declaration is more '!important' than
                    // the more specific one, do not override
                } else {
                    // otherwise override declarations from less specific rules
                    aggregatedStyleForRule[decl.property] = decl;
                }
            });
            for (var x in aggregatedStyleForRule) {
                ruleDeclarations.push(aggregatedStyleForRule[x]);
            }
            ruleDeclarations.declarations.each(function(decl){
                if (aggregatedStyle[decl.property] &&
                    aggregatedStyle[decl.property].priority &&
                    !decl.priority) {
                    // if the declaration is more '!important' than
                    // the more specific one, do not override
                    aggregatedStyle[decl.property]
                } else {
                    // otherwise override declarations from less specific rules
                    result.push(decl);
                }

            });
        });
        for (var x in aggregatedStyle) {
            result.push(aggregatedStyle[x]);
        }
        return result;
    }
});

}) // end of module