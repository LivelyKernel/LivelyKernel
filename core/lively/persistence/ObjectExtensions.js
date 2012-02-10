/*
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

module('lively.persistence.ObjectExtensions').requires('lively.Core', 'lively.scene', 'lively.Widgets', 'lively.ide').toRun(function() {

// morphic stuff
Morph.addMethods('serialization', {
	onrestore: function() {
		this.restoreShapeRelation();
		this.restoreSubMorphRelation();
	},

	restoreShapeRelation: function() {
		// shape relation
		if (!this.rawNode || !this.shape.rawNode) {
			console.warn('No rawNode when trying to restore for ' + this);
			return
		}
		this.rawNode.appendChild(this.shape.rawNode);
	},

	restoreSubMorphRelation: function() {
		if (!this.submorphs) { this.submorphs = []; return }
		this.submorphs.forEach(function(subMorph) {
			if (!subMorph.rawNode) {
				debugger
				console.error('No rawNode when trying to restore for submorph' + subMorph)
				return
			}
			this.rawNode.appendChild(subMorph.rawNode)
		}, this)
	},

})

TextMorph.addMethods('serialization', {

	doNotSerialize: lively.morphic.Text.prototype.doNotSerialize.concat(['undoHistory']),

	onrestore: function($super) {
		$super();
		if (this.rawNode && this.textContent.rawNode) {
			this.rawNode.appendChild(this.textContent.rawNode);
			if (!this.font)
				this.font = lively.Text.Font.forFamily(this.fontFamily, this.fontSize)
			this.setNullSelectionAt(0);
			this.changed();
		}
		this.initializeTransientState();
	},
})

lively.morphic.World.addMethods('serialization', {
	onrestore: function($super) {
		$super()
		this.hands = [];
		this.scheduledActions = [];

		var scripts = [];
		this.mainLoopFunc = this.doOneCycle.bind(this).logErrors('Main Loop');
		this.withAllSubmorphsDo(function() {
			if (this.activeScripts && this.activeScripts.length > 0)
				scripts = scripts.concat(this.activeScripts);
		})
		scripts.forEach(function(s) { s && s.start(this); }, this);

		this.restoreUserName();
	},

	restoreUserName: function() {
		if (lively.LocalStorage.isAvailable())
			this.setCurrentUser(lively.LocalStorage.get('UserName'));
	},
});
ClipMorph.addMethods('serialization', {
	onrestore: function($super) {
		$super()
		this.setupClipNode();
	},
});

ImageMorph.addMethods('serialization', {
	onrestore: function($super) {
		$super()
		if (this.image && this.image.rawNode)
			this.addNonMorph(this.image.rawNode);
	},
});

lively.paint.Gradient.addMethods('serialization', {
	onrestore: function() {
		this.initializeNode();
	},
});
lively.ide.SystemBrowser.addMethods('serialization', {
	onrestore: function() {
		if (this.panel) this.panel.onDeserialize.bind(this.panel).delay(0);
	},
});
lively.ide.LocalCodeBrowser.addMethods('serialization', {
	onrestore: function() {
		lively.bindings.callWhenNotNull(lively.morphic.World, 'currentWorld', this, 'initializeFromDeserializedWorld');
	},
	initializeFromDeserializedWorld: function(world) {
		this._rootNode = null;
		this.changeSet = world.getChangeSet();
		// FIXME
		this.setPane1Content([])
		this.setPane2Content([])
		this.setPane3Content([])
		this.start();
	},
});

}) // end of module