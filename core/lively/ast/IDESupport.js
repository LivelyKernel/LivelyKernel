module('lively.ast.IDESupport').requires('lively.ast.StaticAnalysis', 'lively.ide.SyntaxHighlighting', 'lively.ide.BrowserFramework', 'lively.ide.FileParsing').toRun(function() {

///////////////////
// DEPRECATED!!! //
///////////////////
cop.create('AdvancedSyntaxHighlighting').refineClass(lively.morphic.Text, {
    highlightGlobals: function(target, ast) {
        ///////////////////
        // DEPRECATED!!! //
        ///////////////////
        var analyzer = new lively.ast.VariableAnalyzer(),
            globals = analyzer.findGlobalVariablesInAST(ast);
        globals.each(function(g) {
            target.emphasize(AdvancedSyntaxHighlighting.globalStyle, g.pos[0], g.pos[1]);
        });
    },
    boundEval: function(str) {
        ///////////////////
        // DEPRECATED!!! //
        ///////////////////
        if (this.specialHighlighting == "none") return cop.proceed(str);
        try {
            lively.ast.Parser.parse(str, 'topLevel');
        } catch (e) {
            var st = this.setStatus || this.displayStatus;
            if (st) st.apply(this, OMetaSupport.handleErrorDebug(e[0], e[1], e[2], e[3]));
            return null;
        }
        return cop.proceed(str);
    }
}).refineClass(lively.ide.BasicBrowser, {
    onSourceStringUpdate: function(methodString, source) {
        ///////////////////
        // DEPRECATED!!! //
        ///////////////////
        var node = this.selectedNode(),
            textMorph = this.panel.sourcePane.innerMorph();
        if (node && node.target && node.target.specialHighlighting) {
            textMorph.specialHighlighting = node.target.specialHighlighting();
        } else {
            textMorph.specialHighlighting = "none";
        }
        cop.proceed(methodString, source);
    },
}).refineClass(lively.ide.FileFragment, {
    specialHighlighting: function() {
        ///////////////////
        // DEPRECATED!!! //
        ///////////////////
        if (["klassDef", "objectDef", "klassExtensionDef", "moduleDef"].include(this.type))
            return "topLevel";
        if (this.type == "propertyDef") return "memberFragment";
        if (this.type == "categoryDef") return "categoryFragment";
        if (this.type == "traitDef") return "traitFragment";
        return "none";
    },
    reparseAndCheck: function(newSource) {
        ///////////////////
        // DEPRECATED!!! //
        ///////////////////
        try {
            var highlighting = this.specialHighlighting()
            if (highlighting != "none")
                lively.ast.Parser.parse(newSource, highlighting);
        } catch (e) {
            // e should be of form [src,rule,msg,idx]
            if (!Object.isArray(e)) return cop.proceed(newSource); // otherwise, fall back
            throw OMetaSupport.handleErrorDebug(e[0], e[1], e[2], e[3]/*src, rule, msg, idx*/);
        }
        var newFragment = cop.proceed(newSource);
        return newFragment;
    }
});

Object.extend(AdvancedSyntaxHighlighting, {
    ///////////////////
    // DEPRECATED!!! //
    ///////////////////
    errorStyle: { backgroundColor: Color.web.salmon.lighter() },
    globalStyle: { color: Color.red }
});


lively.ide.JSSyntaxHighlighter.subclass('lively.ast.JSSyntaxHighlighter',
'settings', {
    globalAnalyzer: new lively.ast.VariableAnalyzer(),
    errorStyle: { backgroundColor: Color.web.salmon.lighter() },
    globalStyle: { color: Color.red }
},
'styling', {

    stylesForGlobals: function(target) {
        var rule = target.specialHighlighting ? target.specialHighlighting : 'topLevel',
            ast = lively.ast.Parser.parse(target.textString, rule),
            globals = this.globalAnalyzer.findGlobalVariablesInAST(ast),
            style = this.globalStyle,
            globalStyles = globals.collect(function(g) {
                return [g.pos[0], g.pos[1], style]; });
        return globalStyles;
    },

    howToStyleString: function($super, string, rules, defaultStyle) {
        return $super(string, rules, defaultStyle);

        // This is the proper and more efficient way of extending the syntax
        // highlighter isntead of overwriting #styleTextMorph. Since the style
        // array currently is not merged correctly we use the less efficient
        // approach.
        // Actually we shouldn't use concat but merge the interval list.
        var intervalsWithStyle = $super(string, rules, defaultStyle);
        return intervalsWithStyle.concat(this.stylesForGlobals(string));
    },

    styleTextMorph: function($super, target) {
        // see comment in #howToStyleString
        var domChangedPass1 = $super(target);

        if (target.specialHighlighting == "none") return domChangedPass1;

        var globalStyles, domChangedPass2;
        try {
            globalStyles = this.stylesForGlobals(target);
            target.parseErrors = null;
            domChangedPass2 = target.emphasizeRanges(globalStyles);
        } catch (e) {
            target.parseErrors = [e];
            target.doNotSerialize.pushIfNotIncluded('parseErrors');
            domChangedPass2 = target.emphasize(this.errorStyle, e[3], target.textString.length);
        }
        return domChangedPass1 || domChangedPass2;
    }

});

Object.extend(lively.ast.IDESupport, {
    enable: function() {
        lively.morphic.Text.addMethods(
        'settings for syntax highlighting', {
            syntaxHighlighter: new lively.ast.JSSyntaxHighlighter()
        });
        AdvancedSyntaxHighlighting.beGlobal();
        lively.ast.IDESupport.isEnabled = true;
    },
    disable: function() {
        lively.morphic.Text.addMethods(
        'settings for syntax highlighting', {
            syntaxHighlighter: lively.ide.SyntaxHighlighter.forJS()
        });
        AdvancedSyntaxHighlighting.beNotGlobal();
        lively.ast.IDESupport.isEnabled = false;
    }
});

if (Config.get("advancedSyntaxHighlighting")) {
    lively.ast.IDESupport.enable();
}

});
