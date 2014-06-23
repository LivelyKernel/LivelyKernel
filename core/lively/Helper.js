module('lively.Helper').requires('lively.LogHelper').toRun(function() {

/*
 * Simple Stack Viewer
 */
function getStack() {
    var result = [];
    for(var caller = arguments.callee.caller; caller; caller = caller.caller) {
        if (result.indexOf(caller) != -1) {
           result.push({name: "recursive call can't be traced"});
           break;
        }
        result.push(caller);
    };
    return result;
};

function printStack() {
    function guessFunctionName(func) {
        var name = func.qualifiedMethodName && func.qualifiedMethodName();
        if (name && name !== 'anonymous') return name;
        var regExpRes = func.toString().match(/function (.+)\(/);
        return (regExpRes && regExpRes[1]) || String(func).replace(/\s+/g, ' ').truncate(50);
    }

    var string = "== Stack ==\n", stack = getStack();
    stack.shift(); // for getStack
    stack.shift(); // for printStack (me)
    return string + stack
            .map(function(func, i) { return stack.length - i + ": " + guessFunctionName(func) })
            .join('\n') + "\n==========";
};

function logStack() {
    this.console.log(printStack());
};


Object.extend(Global, {
    // DEPRECATED!!!
    range: Array.range,
    getStack: getStack,
    printStack: printStack,
    logStack: logStack
});

Object.extend(lively, {
    getStack: getStack,
    printStack: printStack
});

Object.extend(Global, {
    newFakeMouseEvent: function(point) {
        // DEPRECATED use livelymorphic.Events EventSimulator
        var rawEvent = {
            type: "mousemove",
            pageX: 100,
            pageY: 100,
            altKey: false,
            shiftKey: false,
            metaKey: false
        };
        var evt = new Event(rawEvent);
        evt.hand = lively.morphic.World.current().hands.first();
        if (point) evt.mousePoint = point;
        return evt;
    }
});


Object.subclass('lively.Helper.XMLConverter', {

    documentation: 'Converts JS -> XML and XML -> JS, not complete but works for most cases, namespace support',

    convertToJSON: function(xml) {
        return this.storeXMLDataInto(xml, {});
    },

    storeXMLDataInto: function(xml, jsObj) {
        jsObj.tagName = xml.tagName;
        jsObj.toString = function() { return jsObj.tagName };
        Array.from(xml.attributes).forEach(function(attr) { jsObj[attr.name] = attr.value; });
        if (!xml.childNodes || xml.childNodes.length === 0) return jsObj;
        jsObj.children = Array.from(xml.childNodes).collect(function(node) {
            if (node.nodeType == Global.document.CDATA_SECTION_NODE)
                return {tagName: 'cdataSection', data: node.data, toString: function() { return 'CDATA'; }};
            else if (node.nodeType == Global.document.TEXT_NODE)
                return {tagName: 'textNode', data: node.data, toString: function() { return 'TEXT'; }};
            return this.storeXMLDataInto(node, {});
        }, this);
        return jsObj;
    },

    toJSONString: function(jsObj, indent) {
        if (!indent) indent = '';
        var result = '{';
        for (var key in jsObj) {
            var value = jsObj[key];
            result += '\n\t' + indent + '"' + key + '": ';

            if (Object.isNumber(value)) {
                result += value;
            } else if (Object.isString(value)) {
                result += '"' + value + '"';
            } else if (Object.isArray(value)) {
                result += '[' + value.collect(function(item) {
                    return this.toJSONString(item, indent + '\t');
                }, this).join(', ') + ']';
            } else {
                result += this.toJSONString(value, indent + '\t');
            }

            result += ',';
        }
        result += '\n' + indent + '}';
        return result;
    },

    convertToXML: function(jsObj, nsMapping, baseDoc, nsWereDeclared) {
        if (!jsObj.tagName) {
            throw new Error('Cannot convert JS object without attribute "tagName" to XML!');
        }
        var isXMLDoc = !!baseDoc.xmlVersion;

        // deal with special nodes
        if (jsObj.tagName === 'cdataSection') {
            return isXMLDoc ?
                baseDoc.createCDATASection(jsObj.data) : baseDoc.createTextNode(jsObj.data);
        }
        if (jsObj.tagName === 'textNode') {
            return baseDoc.createTextNode(jsObj.data);
        }

        // create node
        var nsDecl = nsWereDeclared ? '' : Properties.own(nsMapping).collect(function(prefix) {
                return Strings.format('xmlns:%s="%s"', prefix, nsMapping[prefix]); }).join(' '),
            node = this.createNodeFromString(Strings.format('<%s %s/>', jsObj.tagName, nsDecl), baseDoc);

        // set attributes
        Properties.own(jsObj)
            .reject(function(key) { return key == 'tagName' || key == 'children' })
            .forEach(function(key) {
                var value = jsObj[key];
                if (key.include(':')) {
                    var prefix = key.split(':')[0];
                    var ns = nsMapping[prefix];
                    if (!ns) throw new Error('JS object includes node with tagname having a NS prefix but the NS cannot be found in the nsMapping!');
                    node.setAttributeNS(ns, key, value);
                } else {
                    node.setAttribute(key, value);
                }
            })

        // add childnodes
        jsObj.children && jsObj.children.forEach(function(childJsObj) {
            node.appendChild(this.convertToXML(childJsObj, nsMapping, baseDoc, true));
        }, this);
        return node;
    },

    createNodeFromString: function(string, baseDoc) {
        return baseDoc.adoptNode(new DOMParser().parseFromString(string, "text/xml").documentElement);
    }

});

lively.test = {

    run: function(testFuncOrFunctions, thenDo) {
        return this.basicRun({tests: testFuncOrFunctions, callback: thenDo});
    },

    runAndLog: function(testFunc) {
        var result = this.run(testFunc);
        if (result.failureList().length > 0) {
            $world.alert(result.failureList().join('\n'));
        } else {
            $world.alertOK(result.printResult());
        }
        return result;
    },

    basicRun: function(options) {
        var tests = typeof options.tests === 'function' ? [options.tests] : options.tests;
        var callback = options.callback;
        var m = lively.module('lively.TestFramework');

        m.isLoaded() || m.load(true);
        var id = Strings.newUUID().replace(/-/g, '_');
        var klass = (!!callback ? AsyncTestCase : TestCase).subclass('lively.test.Test_' + id);

        var setUp = tests.setUp || tests.detect(function(ea) { return ea.name === 'setUp'; });
        if (setUp) { klass.addMethods({setUp: setUp}); delete tests.setUp; tests.remove(setUp); }
        var tearDown = tests.tearDown || tests.detect(function(ea) { return ea.name === 'tearDown'; });
        if (tearDown) { klass.addMethods({tearDown: tearDown}); delete tests.tearDown; tests.remove(tearDown); }

        var testMethods = tests.reduce(function(methods, method, i) {
            methods['test' + (method.name || String(i)).capitalize()] = method;
            return methods;
        }, {});
        klass.addMethods(testMethods);

        var t = new klass();
        var result;
        t.runAllThenDo(null, function() {
            result = t.result;
            klass.remove();
            callback && callback(result);
        });
        return !callback ? result : undefined;
    }

}

});
