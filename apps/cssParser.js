module('apps.cssParser').requires('lively.Network', 'lively.morphic.StyleSheetRepresentation').toRun(function(m) {

(function loadLib() {
    // FIXME load async!
    var url = URL.codeBase.withFilename('lib/cssParser.js'),
        src = url.asWebResource().beSync().get().content,

	// lib has to be adapted to suit our needs:
	// - declarations shall not be multiplied with vendor prefixes
	// - shorthands shall never be expanded
        vendorRepl = "kCSS_VENDOR_PREFIXES = {properties:[]};",
	expRepl = 'aExpandShorthands = this.expandShorthands;',
        parseRepl = 'aTryToPreserveComments, expandShorthands) {\n'
            +'this.expandShorthands = expandShorthands;',
	rewritten = '(function (){'
            + src.replace(/kCSS_VENDOR_PREFIXES([\s\S]*?)};/, vendorRepl)
                .replace('aTryToPreserveComments) {', parseRepl)
            .replace(/(?=this.preserveState\(\);[\x20\t\r\n\f]*var blocks = \[\];)/, expRepl)
            + 'this.CSSParser = CSSParser;'
            + '}).call(apps.cssParser);';
    try {
        eval(rewritten);
    } catch(e) {
        alert('CSS Parser lib failed to load because of:\n' + e);
    }
})();

Object.extend(apps.cssParser, {

    calculateCSSRuleSpecificity: function(selector) {
        /*
         * Code taken from Firebug Lite 1.4.0
         * Copyright (c) 2007, Parakey Inc.
        */
        var reSelectorTag = /(^|\s)(?:\w+)/g,
            reSelectorClass = /\.[\w\d_-]+/g,
            reSelectorId = /#[\w\d_-]+/g;

        var match = selector.match(reSelectorTag);
        var tagCount = match ? match.length : 0;

        match = selector.match(reSelectorClass);
        var classCount = match ? match.length : 0;

        match = selector.match(reSelectorId);
        var idCount = match ? match.length : 0;

        // FIXME: like that, tag count and class count can't
        // exceed 9 in one selector without distort the result
        return tagCount + 10*classCount + 100*idCount;
    },

    convertParsedStyleSheet: function(styleSheet, originMorph) {
        // Convert JSCSSP obj to our own style sheet object

        var notSupportedRuleAsComment = function(msg, rule) {
                    console.warn(msg+': '+rule.parsedCssText);
                    return new lively.morphic.StyleSheetComment(
                        '/* ' + msg + '\n'
                                + rule.parsedCssText + '\n*/'
                        );
                };

        return new lively.morphic.StyleSheet(
                styleSheet.cssRules.collect(function(rule) {
                    switch(rule.type) {
                        case 0:
                            // Rule could not be parsed
                            console.warn('CSS Error '+rule.error+': '+rule.parsedCssText);
                            return new lively.morphic.StyleSheetComment(
                                    '/* CSS Error ' + rule.error + ':\n'
                                        + rule.parsedCssText + '*/'
                                );
                        case 1:
                            return new lively.morphic.StyleSheetRule(
                                    rule.selectorText(),
                                    rule.declarations.collect(function(decl) {
                                            var vals = decl.values.collect(
                                                    function(val) {return val.value});
                                            if (apps.cssParser.isShorthand(decl.property)) {
                                                return new lively.morphic.StyleSheetShorthandDeclaration(
                                                    decl.property, vals, null, decl.priority);
                                            } else {
                                                return new lively.morphic.StyleSheetDeclaration(
                                                    decl.property, vals, null, decl.priority);
                                            }
                                        })
                                );
                        case 2:
                            return notSupportedRuleAsComment(
                                'Charset rules not supported yet, sry!', rule);
                        case 3:
                            return notSupportedRuleAsComment(
                                'Imports not supported yet, sry!', rule);
                        case 4:
                            return notSupportedRuleAsComment(
                                'Media rules not supported yet, sry!', rule);
                        case 5:
                            return new lively.morphic.StyleSheetFontFaceRule(
                                    rule.descriptors.collect(function(decl) {
                                            return new lively.morphic.StyleSheetDeclaration(
                                                    decl.property,
                                                    decl.values.collect(function(val) {
                                                            return val.value;
                                                        }),
                                                    null,
                                                    decl.priority
                                                )
                                        })
                                );
                        case 6:
                            return notSupportedRuleAsComment(
                                'Page rules not supported yet, sry!', rule);
                        case 7:
                        case 8:
                            return notSupportedRuleAsComment(
                                'Keyframe rules not supported yet, sry!', rule);
                        case 100:
                            return notSupportedRuleAsComment(
                                'Namespace rules not supported yet, sry!', rule);
                        case 101:
                            return new lively.morphic.StyleSheetComment(
                                rule.parsedCssText);
                        default:
                            return notSupportedRuleAsComment(
                                'This type of rule is not supported yet, sry!', rule);
	           }
                }),
                originMorph
            );
    },
    isShorthand: function(property) {
        var propList = apps.cssParser.getPropList();
        if (propList[property] && propList[property].shorthandFor
            && propList[property].shorthandFor.length > 0) {
            return true;
        } else {
            return false;
        }
    },


    parseShorthand: function(shorthandDeclaration) {
        var simStyleSheet = '* {' + shorthandDeclaration.getText() + ' }',
            parsedSimStyleSheet = apps.cssParser.parse(simStyleSheet,
                shorthandDeclaration.getOriginMorph(), true),
            decls = parsedSimStyleSheet.getRules().first().getDeclarations();
        if (decls && decls.length > 0) {
            return decls.collect(function(decl) {
                    decl.setRule(shorthandDeclaration.getRule());
                    return decl;
                });
        } else {
            return [shorthandDeclaration];
        }
    },

    parse: function(cssString, originMorph, expandShorthands) {
        // cssString should specifiy the css rules, e.g.
        // ".some-class { color: red; }"
        // returns the rules as javascript objects with the interface:
        // TODO define the interface

        var parser = new apps.cssParser.CSSParser(),
            parsedStyleSheet = parser.parse(cssString, false, true, expandShorthands);

        //console.log(parsedStyleSheet);
        return apps.cssParser.convertParsedStyleSheet(parsedStyleSheet, originMorph);
    },

    enhancePropList: function(orgPropList) {
        // Enhances the property list in apps.cssParser.props
        // by adding conclusive shorthands and shorthandFor
        // attributes to make it faster to use for parsing.
        var propList = {},
            markShorthands = function (property, properties) {
                    var shorthand = orgPropList[property].shorthand;
                    propList[property].shorthandFor =
                        propList[property].shorthandFor.concat(properties || []);
                    if (shorthand && orgPropList[shorthand]) {
                        if (properties) {
                            properties.push(property);
                        } else {
                            properties = [property];
                        }
                        // TODO: avoid running in circles
                        var shorthandsFor = markShorthands(shorthand, properties || []);
                        propList[property].shorthands =
                            propList[property].shorthands.concat(shorthandsFor);
                        return shorthandsFor.concat(property);
                    } else {
                        return [property];
                    }
                };

        // Prepare proplist
        for (var x in orgPropList) {
            propList[x] = {};
            propList[x].shorthands = [];
            propList[x].shorthandFor = [];
        }
        // Mark shorthands
        for (var x in orgPropList) {
            markShorthands(x);
        }
        // Make sure there are no duplicates in the shorthand attrs
        for (var x in propList) {
            propList[x].shorthands = propList[x].shorthands.uniq();
            propList[x].shorthandFor = propList[x].shorthandFor.uniq();
        }
        return propList;
    },
    getPropList: function() {
        // Returns the shorthand enhanced property list.
        // If already created return cached version
        if (apps.cssParser.enhancedPropertyList) {
            return apps.cssParser.enhancedPropertyList;
        } else {
            apps.cssParser.enhancedPropertyList = apps.cssParser.enhancePropList(
                apps.cssParser.props);
            return apps.cssParser.enhancedPropertyList;
        }
    },
    props: {
        /*
        Information to interpret and manipulate CSS properties.
        Since there are a lot of CSS properties out there, this
        is only a selection.
        Feel free to add missing properties!
        
        A property can have several value counts (i.e. the value of
        border-color could be 'black', but it could also be 'black black black blue').
        
        A value is of a certain type:
        0: Plain text (i.e. font-family; edit through text field)
        1: Number (i.e. width; edit through slider)
        2: Option (i.e. border-style; edit with drop-down box)
        3: Color (i.e. color; edit with color chooser)
        4: Shadow (i.e. box-shadow; edit with shadow dialog)
    
        Additionally, a property can also have a shorthand.
        I.e. 'border-top-color' is implicitly set by the shorthand 'border-color'
        */
        'background-color': {
            shorthand: 'background',
            values: [ // only one value for this property
            [3]]
        },
        'border': {
            values: [
            // either one value ...
            [3],
            // ... or four
            [3, 3, 3, 3]]
        },
        'border-width': {
            shorthand: 'border',
            values: [
            // either one value ...
            [1],
            // ... or four
            [1, 1, 1, 1]]
        },
        'border-bottom-width': {
            shorthand: 'border-width',
            values: [ // only one value for this property
            [1]]
        },
        'border-left-width': {
            shorthand: 'border-width',
            values: [ // only one value for this property
            [1]]
        },
        'border-top-width': {
            shorthand: 'border-width',
            values: [ // only one value for this property
            [1]]
        },
        'border-right-width': {
            shorthand: 'border-width',
            values: [ // only one value for this property
            [1]]
        },
        'border-color': {
            shorthand: 'border',
            values: [
            // either one value ...
            [3],
            // ... or four
            [3, 3, 3, 3]]
        },
        'border-top-color': {
            shorthand: 'border-color',
            values: [ // only one value for this property
            [3]]
        },
        'border-bottom-color': {
            shorthand: 'border-color',
            values: [ // only one value for this property
            [3]]
        },
        'border-left-color': {
            shorthand: 'border-color',
            values: [ // only one value for this property
            [3]]
        },
        'border-right-color': {
            shorthand: 'border-color',
            values: [ // only one value for this property
            [3]]
        },
        'border-radius': {
            values: [
            // either one value ...
            [1],
            // ... or four
            [1, 1, 1, 1]]
        },
        'color': {
            values: [ // only one value for this property
            [3]]
        }
    }


});

}); // end of module
















































































































































