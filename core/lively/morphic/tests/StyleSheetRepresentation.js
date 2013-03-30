module('lively.morphic.tests.StyleSheetRepresentation').requires('lively.morphic.StyleSheetRepresentation').toRun(function() {

TestCase.subclass('lively.morphic.tests.StyleSheetRepresentation.StyleSheetObjects',
'running', {
    setUp: function($super) {
        $super();
        this.morph = new lively.morphic.Box(new Rectangle(0,1,2,3));
        this.styleSheetObj = new lively.morphic.StyleSheet(
            [
                new lively.morphic.StyleSheetRule(
                        '.Morph',
                        [
                            new lively.morphic.StyleSheetDeclaration(
                                    'background',
                                    ['white'],
                                    null, true //important
                                ),
                            new lively.morphic.StyleSheetDeclaration(
                                    'border',
                                    ['10px', 'solid', 'purple']
                                ),
                        ]
                    ),
                new lively.morphic.StyleSheetComment(
                        '/* test */'
                    ),
            ],
            this.morph);
    }
},

'testing', {
    test01CheckContent: function() {
        var rules = this.styleSheetObj.getRules();
        this.assert(rules && Array.isArray(rules),
            'Stylesheet has no proper rules');

        var declarations = rules.first().getDeclarations();
        this.assert(declarations && Array.isArray(declarations),
            'First rule has no proper declarations');

        this.assertEquals(2, rules.length,
            'Style sheet does not have 2 rules');

        this.assertEquals(2, declarations.length,
            'First Rule does not have 2 declarations');
    },
    test02GetOriginMorph: function() {
        var rule = this.styleSheetObj.getRules().first();
        var decl = rule.getDeclarations().first();
        this.assertEquals(this.morph, rule.getOriginMorph(),
            'Origin morph of first rule is wrong');
        this.assertEquals(this.morph, decl.getOriginMorph(),
            'Origin morph of first decl is wrong');
    },
    test03GetStyleSheet: function() {
        var rule = this.styleSheetObj.getRules().first();
        var decl = rule.getDeclarations().first();
        this.assertEquals(this.styleSheetObj, rule.getStyleSheet(),
            'Stylesheet of first rule is wrong');
        this.assertEquals(this.styleSheetObj, decl.getStyleSheet(),
            'Stylesheet of first decl is wrong');
    },
    test04GetStyleSheetRule: function() {
        var rule = this.styleSheetObj.getRules().first();
        var decla = rule.getDeclarations().first(),
            declb = rule.getDeclarations().last();
        this.assertEquals(rule, decla.getRule(),
            'Rule of first decl is wrong');
        this.assertEquals(rule, declb.getRule(),
            'Rule of second decl is wrong');
    },
    test05GetText: function() {
        var text =
                '.Morph {\n'+
                '\tbackground: white !important;\n'+
                '\tborder: 10px solid purple;\n'+
                '}\n\n'+
                '/* test */';
        this.assertEquals(text, this.styleSheetObj.getText(),
            'Output of style sheet not as expected');
    }
});

}) // end of module
