var util = require('util');
var async = require('async');
var fs = require('fs');
var path = require('path');
var d = require('domain').create();

d.on('error', function(err) {
    console.log('NodeJSEvalServer error: ', err.stack || err);
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// provide a global lively object that provides accessors to useful stuff
// delete global.lively
if (typeof lively === "undefined") global.lively = {}
global.lv = lively;
util._extend(lively, {
    i: function(obj, depth, showAll) { return util.inspect(obj, showAll, typeof depth === 'number' ? depth : 0); },
    show: function(obj, depth, showAll) { console.log(lv.i(obj,depth,showAll)); },
    path: path,
    util: util,
    dir: process.env.WORKSPACE_LK,
    values: function(obj) { return Object.keys(obj).map(function(key) { return obj[key]; }); }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// completion code

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
        if (obj.__lookupGetter__(key) || typeof obj[key] !== 'function') return null;
        return {name: key, completion: signatureOf(key, obj[key])}; })
}

function getAttributesOf(excludes, obj) {
    return propertyExtract(excludes, obj, function(key) {
        if (!obj.__lookupGetter__(key) && typeof obj[key] === 'function') return null;
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

    if (originalObj === proto) {
        if (typeof originalObj !== 'function') return shorten(originalObj.toString(), 50);
        var funcString = originalObj.toString(),
            body = shorten(funcString.slice(funcString.indexOf('{')+1, funcString.lastIndexOf('}')), 50);
        return signatureOf(originalObj.displayName || originalObj.name || 'function', originalObj) + ' {' + body + '}';
    }

    var klass = proto.hasOwnProperty('constructor') && proto.constructor;
    if (!klass) return 'prototype';
    if (typeof klass.type === 'string' && klass.type.length) return shorten(klass.type, 50);
    if (typeof klass.name === 'string' && klass.name.length) return shorten(klass.name, 50);
    return "anonymous class";
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
(function testCompletion() {
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
// end of completion code
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// exports
module.exports = d.bind(function(route, app, subserver) {
    app.post(route, function(req, res) {
        var data = '';
        req.on('data', function(d) { data += d.toString() });
        req.on('end', function() {
            d.run(function() {
                try {
                    res.end(String(eval(data)));
                } catch(e) {
                    res.status(400).end(String(e));
                }
            })
        });
    });

    app.post(route+'completions', function(req, res) {
        // req should contain json {string: STRING}
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        if (!req.body || !req.body.string) {
            res.status(400).end('payload {string: STRING} expected');
            return;
        }
        getCompletions(function(code) { return eval(code); }, req.body.string, function(err, completions, startLetters) {
            if (err) res.status(400).end(String(err));
            else res.json({completions: completions, prefix: startLetters}).end();
        });
    });

    app.post(route+'async', function(req, res) {
        // req should contain json {
        //   code: STRING,
        //    [timeout: NUMBER,]
        //    [callback: STRING]}
        // if callback is null just eval code and return the
        // stringified result. if callback is defined do not return result
        // immediatelly. instead the evaluated code is expected to invoke
        // global[callback](resultString) itself. This way the user can decide
        // when the evaluation is finished and what to send back. Times out after
        // timeout milliseconds
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var code = req.body && req.body.code,
            callbackName = req.body && req.body.callback,
            timeout = (req.body && req.body.timeout) || 500,
            resultSend = false, evalError = false, evalResult;
        d.run(doEval);
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        function finishEval() {
            if (evalError || !callbackName) { sendResult(evalResult); return; }
            setTimeout(function() {
                if (resultSend) return;
                var msg = util.format('Async eval of %s timed out', code.slice(0,40));
                console.log(msg);
                sendResult(msg);
            }, timeout);
        }
        function sendResult(result) {
            resultSend = true;
            if (callbackName) delete global[callbackName];
            if (evalError) res.status(400);
            try {
                res.send(String(result)).end();
            } catch(e) {
                res.status(500).end(String(e))
            }
        }
        function doEval() {
            try {
                if (callbackName) global[callbackName] = sendResult;
                evalResult = eval(code);
            } catch(e) {
                evalResult = e;
                evalError = true;
            }
            finishEval();
        }
    });

    app.get(route + 'lively-javascript-extensions', function(req, res) {
        // can be triggered from a non lilvey page, e.g. via a bookmark to load
        // the default lively object/function/array helpers so that you have a
        // more civilised interface to work with... :)

        var lvDir = process.env.WORKSPACE_LK, files = [
            path.join(lvDir, "core/lively/lang/Object.js"),
            path.join(lvDir, "core/lively/lang/Function.js"),
            path.join(lvDir, "core/lively/lang/String.js"),
            path.join(lvDir, "core/lively/lang/Array.js"),
            path.join(lvDir, "core/lively/lang/Number.js"),
            path.join(lvDir, "core/lively/lang/Date.js"),
            path.join(lvDir, "core/lively/lang/Worker.js")];

        async.map(files, fs.readFile, function(err, contents) {
           if (err) { res.status(500).end(String(err)); return; }
           res.header('content-type', 'application/javascript');
           res.end(contents.join('\n'));
       });

    })
})
