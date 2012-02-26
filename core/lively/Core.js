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

module('lively.Core').requires('lively.scene', 'lively.DOMAbstraction', 'lively.oldCore.Events', 'lively.oldCore.Misc', 'lively.OldModel', 'lively.oldCore.Morphs', 'lively.oldCore.Layout', 'lively.oldCore.Hacks').toRun(function() {

if (Config.isNewMorphic) throw new Error('lively.Core loaded with NewMorphic!!!!!!')

/* Code loader. Appends file to DOM. */
Object.extend(Global, {
    Loader: JSLoader //new ScriptLoader(),
});

// test which checks if all modules are loaded
(function testModuleLoad() {
    var modules = Global.subNamespaces(true).select(function(ea) { return ea.wasDefined });
    modules
        .select(function(ea) { return ea.hasPendingRequirements() })
        .forEach(function(ea) {
			var msg = Strings.format('%s has unloaded requirements: %s',
				ea.uri(), ea.pendingRequirementNames());
			console.warn(msg); 
		 });
    console.log('Module load check done. ' + modules.length + ' modules loaded.');
}).delay(10);

console.log('loaded Core.js');

}); // end of module