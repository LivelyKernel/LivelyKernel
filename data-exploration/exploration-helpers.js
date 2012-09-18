/*
 * This code should not have any dependencies beside standard JS so that it
 * can be loaded into web workers.
 */

var $lk = {
    async: function(functions, finalFunc, nextArgs, aggregatedArgs) {
        nextArgs = nextArgs || [];
        aggregatedArgs = (aggregatedArgs || []).concat(nextArgs);
        finalFunc = finalFunc || function() {}
        var next = functions.shift();
        if (!next) { finalFunc(aggregatedArgs); return };
        nextArgs.push(function() {
            var length = arguments.length, args = new Array(length);
            while (length--) args[length] = arguments[length];
            $lk.async(functions, finalFunc, args, aggregatedArgs);
        });
        next.apply(this, nextArgs);
    }
}


var net = {
    httpRequest: function (options) {
        if (!options.url) {
            console.log("Error, httpRequest needs url");
            return;
        }
        var req = new XMLHttpRequest(),
            method = options.method || 'GET';
        function handleStateChange() {
            if (req.readyState === 4) {
                // req.status
                options.done && options.done(req);
            }
        }
        req.onreadystatechange = handleStateChange;
        req.open(method, options.url);
        req.send();
    }
}

var couchDB = {
    baseURL: "http://localhost:9001/proxy/localhost:5984/",

    getDocsPaginated: function(options, callback) {
        // options:
        // {tableName, baseQuery, pageSize, page, callback}
        var url = this.baseURL + options.dbName + '/' + options.baseQuery + "?include_docs=true";
        if (isNumber(options.pageSize)) {
            url += "&limit=" + options.pageSize;
            if (isNumber(options.page)) {
                var skip = options.page * options.pageSize;
                url += "&skip=" + options.pageSize;
            }
        }
        net.httpRequest({
            url: url,
            done: function(req) {
                var cb = callback || options.callback;
                if (req.status >= 400) {
                    console.log('Error in request %s: %s', url, req.statusText);
                    cb && cb(req.status, req);
                    return;
                }
                var result;
                try {
                    result = JSON.parse(req.responseText);
                    if (result. error) throw(result. error);
                } catch(e) {
                    console.log('Error parsing JSON %s: %s', url, req.responseText);
                    cb && cb(e, req.responseText);
                    return;
                }
                var docs = result.rows.map(function(row) { return row.doc });

                console.log("Got page " + options.page + ' ' + docs.length + ' docs ' + url);

                var cb = callback || options.callback;
                cb && cb(null, result);
            }
        });
    }
}

// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length == 0) return hash;
    for (var i = 0; i < this.length; i++) {
        var c = this.charCodeAt(i);
        hash = ((hash<<5)-hash) + c;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

var dataExploration = {
    classify: function(objList) {
        var result = {}, values = [];
        objList.forEach(function(ea) {
            var keys = Object.keys(ea),
                hash = keys.sort().join('').hashCode();
            if (!result[hash]) {
                result[hash] = {keys: keys, count: 0, objects: []}
                values.push(result[hash]);
            }
            result[hash].count++;
            result[hash].objects.push(ea);
        });
        return values;
    }
};

if (typeof lively !== undefined) {

Object.extend(Global, {
    $lk: $lk,
    couchDB: couchDB,
    dataExploration: dataExploration,
    net: net
});

module('lively.TestFramework').load(true);

TestCase.subclass('ClassifierTests',
'testing', {
    testSimpleJSONClassification: function() {
        var result = dataExploration.classify([
            {foo: 1, bar: 2}, {bar: 5, foo: 1}, {baz: {zork: 3}}]);

        this.assertEqualState(
            [{keys: ['bar', 'foo'], count: 2}, {keys: ['baz'], count: 1}], result);
    }
});

TestCase.subclass('HelperTests',
'testing', {
    testRunAsync: function() {
        var args, aggregatedArgs;
        $lk.async([function(next) { next(1,2); },
                  function(arg1, arg2, next) { args = [arg1, arg2], next(arg1 + arg2); }],
                function(allArgs) { aggregatedArgs = allArgs });
        this.assertEqualState([1,2], args, 'args');
        this.assertEqualState([1, 2, 3], aggregatedArgs, 'all args');

    }
});


}

/** Run tests

var result = new TestResult(),
    tests = [new ClassifierTests(result),
             new HelperTests(result)];
tests.forEach(function(test) { test.runAll() }); result.printResult();

*/
