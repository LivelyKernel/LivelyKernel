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

(function installLivelyLangGlobals() {
  var isNodejs = typeof UserAgent !== "undefined" && UserAgent.isNodejs;
  var livelyLang = isNodejs ? require("lively.lang") : lively.lang;
  if (isNodejs) {
    if (!global.lively) global.lively = {};
    global.lively.lang = livelyLang;
  }
  livelyLang.deprecatedLivelyPatches();
})();

(function defineFunctionPrototypeName() {
  if (Function.prototype.name === undefined) {
      Function.prototype.__defineGetter__("name", function () {
        // TODO: find a better method, this is just a heuristic
        if (this.displayName) {
            var splitted = this.displayName.split(".");
            return splitted[splitted.length - 1];
        }
      	var md = String(this).match(/function\s+(.*)\s*\(\s*/);
  	    return md ? md[1] : "Empty";
      });
  }
})();

Object.extend(Global, {
    dbgOn: function dbgOn(cond, optMessage) {
        if (cond && optMessage) console.warn(optMessage);
        if (cond) debugger;
        // also call as: throw dbgOn(new Error(....))
        return cond;
    },
    assert: function assert(value, message) {
        if (value) { return; }
        // capture the stack
        var stack;
        try { throw new Error() } catch(e) { stack = e.stack || '' };
        alert('Assertion failed' + (message ? ': ' + message : '!') + '\n' + stack);
    }
});
