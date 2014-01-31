/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


module('lively.Ometa').requires('lively.Network', 'ometa.lively').toRun(function() {

/*
    An OMeta Workspace like http://www.cs.ucla.edu/~awarth/ometa/.
    Uses Alessandro Warth OMeta-js 2 to evalute text.
*/
Object.subclass('OMetaSupport');

Object.extend(OMetaSupport, {

    ometaGrammarDir: URL.codeBase,

    fromFile: function(fileName) {
        var src = OMetaSupport.fileContent(fileName),
            grammar = OMetaSupport.ometaEval(src);
        return grammar;
    },

    translateAndWrite: function(sourceFileName, destFileName, additionalRequirements) {
        var requirementsString = additionalRequirements ? ",'" + additionalRequirements.join("','") + "'" : "",
            str = Strings.format('module(\'%s\').requires(\'ometa.lively\'%s).toRun(function() {\n%s\n});',
                                 destFileName.replace(/\.js$/, '').replace(/\//g, '.'),
                                 requirementsString,
                                 OMetaSupport.translateToJs(OMetaSupport.fileContent(sourceFileName)));
        OMetaSupport.writeGrammar(destFileName, str);
        lively.morphic.World.current().setStatusMessage(
            Strings.format('Successfully compiled OMeta grammar %s to %s', sourceFileName, destFileName),
            Color.green, 3);
    },
    translate: function(source, additionalRequirements, destFileName) {
        destFileName = destFileName || 'anonymousOMetaModule';
        var requirementsString = additionalRequirements ? ",'" + additionalRequirements.join("','") + "'" : "",
            str = Strings.format('module(\'%s\').requires(\'ometa.lively\'%s).toRun(function() {\n%s\n});',
                                 destFileName.replace(/\.js$/, '').replace(/\//g, '.'),
                                 requirementsString,
                                 OMetaSupport.translateToJs(source));
        lively.morphic.World.current().setStatusMessage(
            Strings.format('Successfully compiled OMeta grammar %s', source.truncate(300)),
            Color.green, 3);
        return str;
    },


    ometaEval: function(src) {
        var jsSrc = OMetaSupport.translateToJs(src);
        return eval(jsSrc);
    },

    translateToJs: function(src) {
        var ometaSrc = OMetaSupport.matchAllWithGrammar(BSOMetaJSParser, "topLevel", src);
        if (!ometaSrc) throw new Error('Problem in translateToJs: Cannot create OMeta Ast from source');
        var jsSrc = OMetaSupport.matchWithGrammar(BSOMetaJSTranslator, "trans", ometaSrc);
        return jsSrc;
    },

    matchAllWithGrammar: function(grammar, rule, src, errorHandling) {
        // errorHandling can be undefined or a callback or true (own error handle is used)
        var errorFunc;
        if (!errorHandling) errorFunc = OMetaSupport.handleErrorDebug;
        else if (errorHandling instanceof Function) errorFunc = errorHandling
        else errorFunc = OMetaSupport.handleErrorDebug;
        return grammar.matchAll(src, rule, null, errorFunc.curry(src, rule));
    },

    matchWithGrammar: function(grammar, rule, src, errorHandling) {
        // errorHandling can be undefined or a callback or true (own error handle is used)
        var errorFunc;
        if (!errorHandling) errorFunc = OMetaSupport.handleErrorDebug;
        else if (errorHandling instanceof Function) errorFunc = errorHandling
        else errorFunc = OMetaSupport.handleErrorDebug;
        return grammar.match(src, rule, null, errorFunc.curry(src, rule));
    },

    handleErrorDebug: function(src, rule, grammarInstance, errorIndex) {
        var charsBefore = 500,
            charsAfter = 250,
            msg = 'OMeta Error -- ' + rule + '\n',
            startIndex = Math.max(0, errorIndex - charsBefore),
            stopIndex = Math.min(src.length, errorIndex + charsAfter);

        //console.log('Last twenty Rules: ' + grammarInstance._ruleStack && grammarInstance._ruleStack.slice(grammarInstance._ruleStack.length-20));
        msg += src.constructor === Array ?
            'src = [' + src.toString() + ']' :
            src.substring(startIndex, errorIndex) + '<--Error-->' + src.substring(errorIndex, stopIndex);
        console.log(msg);
        return msg;
    },

    handleError: function(src, rule, grammarInstance, errorIndex) {},

    fileContent: function(fileName) {
        var url = URL.root.withFilename(fileName);
        return new WebResource(url).get().content;
    },

    writeGrammar: function(fileName, src) {
        var url = URL.root.withFilename(fileName);
        return new WebResource(url).put(src);
    }
});

});
