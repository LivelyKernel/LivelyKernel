module('lively.ide.codeeditor.Completions').requires('lively.ide.codeeditor.ace', 'lively.Network').toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// "dynamic" completions, created by evaluating an expression and enumerating the
// properties of the resulting object
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// FIXME move this stuff into a generic JS meta interface module so that it can be
// easily reused from the server

Object.subclass('lively.ide.codeeditor.Completions.ProtocolLister',
'initializing', {
    initialize: function(textMorph) {
        this.textMorph = textMorph;
    }
},
'interface', {
    getCompletions: function(code, evalFunc) {
        var err, completions
        getCompletions(evalFunc, code, function(e, c, pre) {
            err = e, completions = {prefix: pre, completions: c}; })
        if (err) { alert(err); return {error: String(err.stack || err), prefix: '', completions: []}; }
        else return completions;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// rk 2013-10-10 I extracted the code below into a nodejs module (since this
// stuff is also useful on a server and in other contexts). Right now we have no
// good way to load nodejs modules into Lively and I inline the code here. Please
// fix soon!
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// helper
function signatureOf(name, func) {
    var source = String(func),
        match = source.match(/function\s*[a-zA-Z0-9_$]*\s*\(([^\)]*)\)/),
        params = (match && match[1]) || '';
    return name + '(' + params + ')';
}

function isClass(obj) {
    if (obj === obj
      || obj === Array
      || obj === Function
      || obj === String
      || obj === Boolean
      || obj === Date
      || obj === RegExp
      || obj === Number) return true;
    return (obj instanceof Function)
        && ((obj.superclass !== undefined)
         || (obj._superclass !== undefined));
}

function pluck(list, prop) { return list.map(function(ea) { return ea[prop]; }); }

function getObjectForCompletion(evalFunc, stringToEval, thenDo) {
    // thenDo = function(err, obj, startLetters)
    var idx = stringToEval.lastIndexOf('.'),
        startLetters = '';
    if (idx >= 0) {
        startLetters = stringToEval.slice(idx+1);
        stringToEval = stringToEval.slice(0,idx);
    } else {
        startLetters = stringToEval;
        stringToEval = 'Global';
    }
    var completions = [];
    try {
        var obj = evalFunc(stringToEval);
    } catch (e) {
        thenDo(e, null, null);
    }
    thenDo(null, obj, startLetters);
}

function propertyExtract(excludes, obj, extractor) {
    // show(''+excludes)
    return Object.getOwnPropertyNames(obj)
        .filter(function(key) { return excludes.indexOf(key) === -1; })
        .map(extractor)
        .filter(function(ea) { return !!ea; })
        .sort(function(a,b) {
            return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });
}

function getMethodsOf(excludes, obj) {
    return propertyExtract(excludes, obj, function(key) {

        if ((obj.__lookupGetter__ && obj.__lookupGetter__(key)) || typeof obj[key] !== 'function') return null;
        return {name: key, completion: signatureOf(key, obj[key])}; })
}

function getAttributesOf(excludes, obj) {
    return propertyExtract(excludes, obj, function(key) {
        if ((obj.__lookupGetter__ && !obj.__lookupGetter__(key)) && typeof obj[key] === 'function') return null;
        return {name: key, completion: key}; })
}

function getProtoChain(obj) {
    var protos = [], proto = obj;
    while (obj) { protos.push(obj); obj = obj.__proto__ }
    return protos;
}

function getDescriptorOf(originalObj, proto) {
    function shorten(s, len) {
        if (s.length > len) s = s.slice(0,len) + '...';
        return s.replace(/\n/g, '').replace(/\s+/g, ' ');
    }

    var stringified;
    try { stringified = String(originalObj); } catch (e) { stringified = "{/*...*/}"; }

    if (originalObj === proto) {
        if (typeof originalObj !== 'function') return shorten(stringified, 50);
        var funcString = stringified,
            body = shorten(funcString.slice(funcString.indexOf('{')+1, funcString.lastIndexOf('}')), 50);
        return signatureOf(originalObj.displayName || originalObj.name || 'function', originalObj) + ' {' + body + '}';
    }

    var klass = proto.hasOwnProperty('constructor') && proto.constructor;
    if (!klass) return 'prototype';
    if (typeof klass.type === 'string' && klass.type.length) return shorten(klass.type, 50);
    if (typeof klass.name === 'string' && klass.name.length) return shorten(klass.name, 50);
    return "anonymous class";
}

function getCompletionsOfObj(obj, thenDo) {
    var err, completions;
    try {
        var excludes = [];
        completions = getProtoChain(obj).map(function(proto) {
            var descr = getDescriptorOf(obj, proto),
                methodsAndAttributes = getMethodsOf(excludes, proto)
                    .concat(getAttributesOf(excludes, proto));
            excludes = excludes.concat(pluck(methodsAndAttributes, 'name'));
            return [descr, pluck(methodsAndAttributes, 'completion')];
        });
    } catch (e) { err = e; }
    thenDo(err, completions);
}

function getCompletions(evalFunc, string, thenDo) {
    // thendo = function(err, completions/*ARRAY*/)
    // eval string and for the resulting object find attributes and methods,
    // grouped by its prototype / class chain
    // if string is something like "foo().bar.baz" then treat "baz" as start
    // letters = filter for properties of foo().bar
    // ("foo().bar.baz." for props of the result of the complete string)
    getObjectForCompletion(evalFunc, string, function(err, obj, startLetters) {
        if (err) { thenDo(err); return }
        var excludes = [];
        var completions = getProtoChain(obj).map(function(proto) {
            var descr = getDescriptorOf(obj, proto),
                methodsAndAttributes = getMethodsOf(excludes, proto)
                    .concat(getAttributesOf(excludes, proto));
            excludes = excludes.concat(pluck(methodsAndAttributes, 'name'));
            return [descr, pluck(methodsAndAttributes, 'completion')];
        });
        thenDo(err, completions, startLetters);
    })
}

/*
;(function testCompletion() {
    function assertCompletions(err, completions, prefix) {
        assert(!err, 'getCompletions error: ' + err);
        assert(prefix === '', 'prefix: ' + prefix);
        assert(completions.length === 3, 'completions does not contain 3 groups ' + completions.length)
        assert(completions[2][0] === 'Object', 'last completion group is Object')
        objectCompletions = completions.slice(0,2)
        expected = [["[object Object]", ["m1(a)","m2(x)","a"]],
                    ["prototype", ["m3(a,b,c)"]]]
        assert(Objects.equals(expected, objectCompletions), 'compl not equal');
        alertOK('all good!')

    }
    function evalFunc(string) { return eval(string); }
    var code = "obj1 = {m2: function() {}, m3:function(a,b,c) {}}\n"
             + "obj2 = {a: 3, m1: function(a) {}, m2:function(x) {}, __proto__: obj1}\n"
             + "obj2."
    getCompletions(evalFunc, code, assertCompletions)
})();
*/
    },
    evalSelectionAndOpenNarrower: function() {
        var evalIt, code, editor = this.textMorph;
        editor.saveExcursion(function(reset) {
            evalIt = editor.boundEval.bind(editor);
            code = editor.getSelectionOrLineString();
            reset();
        });
        this.openNarrower(this.getCompletions(code, evalIt));
    }
},
'accessing', {

    openNarrower: function(completionSpec) {
        var completions = completionSpec.completions;
        var prefix = completionSpec.prefix;
        var ed = this.textMorph;
        var candidates = completions.reduce(function(candidates, protoGroup) {
            var protoName = protoGroup[0], completions = protoGroup[1];
            return candidates.concat(completions.map(function(completion) {
                return {
                    isListItem: true,
                    string: '[' + protoName + '] ' + completion,
                    value: complete.curry(completion)
                }
            }));
        }, []);
        function complete(completion) {
            if (prefix && prefix.length) {
                var sel = ed.aceEditor.selection;
                if (sel.isBackwards()) sel.setRange(sel.getRange(), false/*reverse*/);
                sel.clearSelection();
                var range = ed.aceEditor.find({needle: prefix, backwards: true, preventScroll: true})
                ed.replace(range, '');
            }
            var id = completion.match(/^[^\(]+/)[0];
            var needsBrackets = !lively.Class.isValidIdentifier(id);
            if (needsBrackets) {
                var range = ed.aceEditor.find({needle: '.', backwards: true, preventScroll: true})
                ed.replace(range, '');
                if (!completion.match(/^[0-9]+$/)) completion = Strings.print(completion);
                completion = '[' +  completion + ']';
            }
            ed.printObject(ed.aceEditor, completion, true);
        };
        lively.ide.tools.SelectionNarrowing.getNarrower({
            name: 'lively.morphic.Text.ProtocolLister.CompletionNarrower',
            setup: function(narrower) {
                lively.bindings.connect(narrower, 'confirmedSelection', narrower, 'remove');
                lively.bindings.connect(narrower, 'escapePressed', narrower, 'remove');
            },
            spec: {
                prompt: 'pattern: ',
                candidates: candidates,
                input: prefix || '',
                actions: [{name: 'insert completion', exec: function(candidate) { candidate(); }}]
            }
        });
    },

    createSubMenuItemForCompletion: function(completionString, optStartLetters, type) {
        var itemString = completionString;
        if (type) itemString += ' ' + type;
        var textMorph = this.textMorph;
            if (typeof(optStartLetters) !== 'undefined') {
            completionString = completionString.substring(optStartLetters.size());
        }
        return [itemString, function() {
            textMorph.focus();
            textMorph.clearSelection();
            textMorph.insertAtCursor(completionString, true);
        }];
    }

});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// completions based on ace completer objects
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Object.extend(lively.ide.codeeditor.Completions, {

    setupCompletions: function(thenDo) {
        console.log('setup code completions');

        [wordsFromFiles, installCompleter, done].doAndContinue(null, thenDo);

        var words;
        function wordsFromFiles(next) {
            var ideSupportServer = URL.nodejsBase.withFilename('IDESupportServer/indexedLivelyWords')
                .asWebResource().beAsync();
            ideSupportServer.get().withJSONWhenDone(function(json, s) {
                var err = (json && json.error) || (!s.isSuccess() && s);
                if (err) {
                    console.error('Error in ide code completion preparation: %s', s);
                } else { words = json; next(); }
            });
        }

        function installCompleter(next) {
            // 1) define completer
            lively.ide.WordCompleter = {wordsFromFiles: words};
            Object.extend(lively.ide.WordCompleter, {
                getCompletions: function(editor, session, pos, prefix, callback) {
                    if (prefix.length === 0) { callback(null, []); return }
                    var startLetter = prefix[0].toLowerCase(),
                        wordList = this.wordsFromFiles[startLetter], result = [];
                    for (var word in wordList) {
                        if (word.lastIndexOf(prefix, 0) !== 0) continue;
                        result.push({
                            name: word,
                            value: word,
                            score: wordList[word],
                            meta: "lively"
                        });
                    }
                    callback(null, result);
                }
            });
            // 2) register completer
            var langTools = lively.ide.ace.require('ace/ext/language_tools');
            langTools.addCompleter(lively.ide.WordCompleter);
            next();
        }

        function done(next) { alertOK('Word completion installed!'); next(); }
    }
});

(function setupCompletionsOnLoad() {
    (function() {
        if (UserAgent.isNodejs
         || UserAgent.isWorker
         || !lively.Config.get('computeCodeEditorCompletionsOnStartup'))
         return;
        lively.ide.codeeditor.Completions.setupCompletions();
    }).delay(3);
})();

}) // end of module
