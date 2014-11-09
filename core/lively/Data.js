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

/**
 * Data.js.  Data manipulation (mostly XML).
 */

module('lively.Data').requires('lively.OldModel').toRun(function(thisModule) {

// FIX for IE9+
if (typeof XPathResult == 'undefined') {
    JSLoader.loadJs(Config.codeBase + 'lib/wgxpath.install.js', undefined, true);
    XPathEvaluator = (function () {
        return {
            createNSResolver: function(ctx) {
                if (ctx.ownerDocument) {
                    if (!ctx.ownerDocument.createNSResolver) {
                        wgxpath.install({document: ctx.ownerDocument});
                    }
                    var result = ctx.ownerDocument.createNSResolver(ctx);
                    result.__doc = ctx.ownerDocument;
                    return result;
                } else {
                    console.warn("Got a ctx without ownerDocument. Shouldn't happen!")
                    return document.createNSResolver(ctx);
                }
            },
            evaluate: function(expression, node, nsResolver, type, arg) {
                if (nsResolver.__doc) {
                    nsResolver.__doc.evaluate(expression, node, nsResolver, type, arg);
                } else {
                    console.warn("Got a nsResolver without __doc. Shouldn't happen!")
                    return document.evaluate(expression, node, nsResolver, type, arg);
                }
            }
        }
    });
    wgxpath.install();
}

if (!Global.View) Object.subclass("View");

View.subclass('Query',  {
    documentation: "Wrapper around XPath evaluation",

    xpe: Global.XPathEvaluator ? new XPathEvaluator()
         : (console.log('XPath not available') || {}),

    formals: ["+Results", // Node[]
        "-ContextNode", // where to evaluate
    ],

      initialize: function(expression, optPlug) {
            this.contextNode = null;
            this.expression = expression;
            if (optPlug) this.connectModel(optPlug);
      },

      establishContext: function(node) {
            if (this.nsResolver) return;
            var ctx = node.ownerDocument ? node.ownerDocument.documentElement : node.documentElement;
            if (ctx !== this.contextNode) {
                  this.contextNode = ctx;
                  this.nsResolver = this.xpe.createNSResolver(ctx);
            }
      },

      manualNSLookup: function() {
            this.nsResolver = function(prefix) {
                  return Namespace[prefix.toUpperCase()] || null;
            }
            return this;
      },

      updateView: function(aspect, controller) {
            var p = this.modelPlug;
            if (!p) return;
            switch (aspect) {
                  case p.getContextNode:
                  this.onContextNodeUpdate(this.getContextNode());
                  break;
            }
      },

      onContextNodeUpdate: function(node) {
            if (node instanceof Document) node = node.documentElement;
            var result = this.findAll(node, null);
            this.setResults(result);
      },

      findAll: function(node, defaultValue) {
            this.establishContext(node);
            var result = this.xpe.evaluate(this.expression, node, this.nsResolver, XPathResult.ANY_TYPE, null),
            accumulator = [],
            res = null;
            while (res = result.iterateNext()) accumulator.push(res);
            return accumulator.length > 0 || defaultValue === undefined ? accumulator : defaultValue;
      },

      findFirst: function(node) {
            this.establishContext(node);
            var result = this.xpe.evaluate(this.expression, node, this.nsResolver, XPathResult.ANY_TYPE, null);
            return result.iterateNext();
      }

});

Object.extend(Query, {
    find: function(expr, doc) {
        return new Query(expr).manualNSLookup().findFirst(doc);
    },

    findAll: function(expr, doc) {
        return new Query(expr).manualNSLookup().findAll(doc);
    }
});

Object.extend(module("lively.Data"), {
    XPathQuery: Query
});

}); // end of module
