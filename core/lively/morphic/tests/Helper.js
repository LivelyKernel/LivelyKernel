module('lively.morphic.tests.Helper').requires('lively.TestFramework', 'lively.morphic.Complete').toRun(function() {

namespace('lively.morphic.Tests'); // FIXME to be removed

TestCase.subclass('lively.morphic.tests.TestCase',
'running', {
    setUp: function($super) {
        this.morph = new lively.morphic.Morph();
        $super();
    },
    tearDown: function($super) {
        $super();
        this.removeTestWorld();
    },
},
'helper', {
    removeTestWorld: function() {
        if (this.world) {
            this.world.remove();
            this.world = null;
        }
        if (this.oldAlert)
            Global.alert = this.oldAlert;
        if (this.existingWorld) {
            this.existingWorld.displayOnCanvas(document.getElementsByTagName('body')[0]);
            lively.morphic.World.currentWorld = this.existingWorld;
            this.existingWorld = null;
        }
    },
    openMorphsInRealWorld: function() {
        this.removeTestWorld();
    },
    createWorld: function() {
        if (this.world) return; // already created
        this.existingWorld = lively.morphic.World.current();
        this.world = lively.morphic.World.createOn(document.body, new Rectangle(0,0,300,300));
        this.oldAlert = Global.alert;
        Global.alert = function (msg) { this.existingWorld.alert(String(msg)) }.bind(this)
    },
    serializeAndDeserializeWorld: function() {
        if (!this.world) {
            alert('No test world created');
            return
        }
        var json = this.world.serializeToJSON();
        this.world.remove();
        this.world = lively.morphic.World.createFromJSONOn(json, document.body);
    },

},
'assertion', {
    assertDOMState: function(expected, morph, msg) {
        this.assertNodeMatches(expected, morph.renderContext().getMorphNode(), msg);
    },
    assertNodeMatches: function(expected, node) {
        var self = this,
            fail = function fail(msg) { self.assert(false, msg) };
        if (!expected) fail('expected is null');
        if (!node) fail('node is null but should be ' + expected.tagName);
        if (expected.tagName != node.tagName) fail(expected.tagName + '!=' + node.tagName);
        if (expected.parentNode && (expected.parentNode !== node.parentNode))
            fail('parent is ' + node.parentNode + ' but should be ' + expected.parentNode);

        if (expected.textContent) {
            if (expected.textContent != node.textContent)
                fail('textContent ' + expected.textContent + ' != ' + node.textContent);
        }

        if (expected.attributes)
            Properties.forEachOwn(expected.attributes, function(key, expectedValue) {
                var actualValue = node.getAttribute(key);
                if (expectedValue instanceof RegExp) {
                    if (!expectedValue.test(actualValue))
                        fail('attribute ' + key + ' was ' + actualValue + ' and didn\'t match ' + expectedValue);
                    return
                }
                if (expectedValue != actualValue) {
                    fail('attribute ' + key + ' not ' + expectedValue + ' but ' + actualValue);
                }
            });
        if (expected.style)
            Properties.forEachOwn(expected.style, function(key, expected) {
                if (!node.style[key]) {
                    alert("Warning: " + key + " is falsy in " + node + ".style");
                }
                var actualValue = node.style[key].replace(/ /g, '');
                if (Object.isFunction(expected)) {
                    self.assert(expected.call(self, actualValue), 'value ' + actualValue + ' did no match')
                    return
                }
                if (expected != actualValue)
                    fail('style ' + key + ' not ' + expected + ' but ' + actualValue);
            });
        if (expected.childNodeLength)
            this.assertEquals(expected.childNodeLength, node.childNodes.length, 'childNode.length of ' + node)
        if (expected.childNodes)
            for (var i = 0; i < expected.childNodes.length; i++)
                this.assertNodeMatches(expected.childNodes[i], node.childNodes[i]);
    }
});

});