
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
                result[hash] = {keys: keys, count: 0}
                values.push(result[hash]);
            }
            result[hash].count++;
        });
        return values;
    }
};

$i = JSON.stringify;
eval("requirex('util')")
{foo: 3}

module('lively.TestFramework').load(true);

TestCase.subclass('ClassifierTests',
'testing', {
    testSimpleJSONClassification: function() {
        var result = dataExploration.classify([
            {foo: 1, bar: 2}, {bar: 5, foo: 1}, {baz: {zork: 3}}]);

        this.assertEqualState(
            [{keys: ['bar', 'foo'], count: 2}, {keys: ['baz'], count: 1}], result, inspect(result));
    }
});

}
/*

result = new TestResult()
test = new ClassifierTests(result);
test.runAll();
result.printResult()

 */