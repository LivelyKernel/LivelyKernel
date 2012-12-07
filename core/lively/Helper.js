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

module('lively.Helper').requires('lively.LogHelper').toRun(function() {

/*
 * Stack Viewer when Dan's StackTracer is not available
 * FIXME rk: move this to Helper.js?
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
        var qName = func.qualifiedMethodName && func.qualifiedMethodName(),
            regExpRes = func.toString().match(/function (.+)\(/);
        return qName || (regExpRes && regExpRes[1]) || func;
    };

    var string = "== Stack ==\n",
        stack = getStack();
    stack.shift(); // for getStack
    stack.shift(); // for printStack (me)
    var indent = "";
    for (var i=0; i < stack.length; i++) {
        string += indent + i + ": " +guessFunctionName(stack[i]) + "\n";
        indent += " ";
    };
    return string;
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
        $A(xml.attributes).forEach(function(attr) { jsObj[attr.name] = attr.value    });
        if (!xml.childNodes || xml.childNodes.length === 0) return jsObj;
        jsObj.children = $A(xml.childNodes).collect(function(node) {
            if (node.nodeType == Global.document.CDATA_SECTION_NODE) {
                return {tagName: 'cdataSection', data: node.data, toString: function() { return 'CDATA'}};
            }
            if (node.nodeType == Global.document.TEXT_NODE) {
                return {tagName: 'textNode', data: node.data, toString: function() { return 'TEXT'}};
            }
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
        if (!jsObj.tagName)
            throw new Error('Cannot convert JS object without attribute "tagName" to XML!');

        // deal with special nodes
        if (jsObj.tagName === 'cdataSection')
            return baseDoc.createCDATASection(jsObj.data);
        if (jsObj.tagName === 'textNode')
            return baseDoc.createTextNode(jsObj.data);

        // create node
        var nsDecl = nsWereDeclared ? '' : Properties.own(nsMapping).collect(function(prefix) {
            return Strings.format('xmlns:%s="%s"', prefix, nsMapping[prefix])
        }).join(' ');
        var node = this.createNodeFromString(Strings.format('<%s %s/>', jsObj.tagName, nsDecl), baseDoc);

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

});