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


module('lively.ChangeSet').requires('lively.DOMAbstraction').toRun(function() {
// ===========================================================================
// Change/ChangeSet and lkml handling
// ===========================================================================
Object.subclass('Change',
'documentation', {
	documentation: 'Wraps around XML elements which represent code entities',
},
'settings', {
	doNotSerialize: ['xmlElement'],
},
'initialization', {
	initialize: function(xmlElement) {
		this.xmlElement = xmlElement;
	},
},
'testing', {
	isInitializer: Functions.False,
	isWorldRequirementsList: Functions.False,
	eq: function(other) {
		if (!other) return false;
		if (this.constructor != other.constructor) return false;
		if (this == other) return true;
		return this.getXMLElement().isEqualNode(other.getXMLElement());
	},
},
'accessing', {
	getXMLElement: function() { return this.xmlElement },

	setXMLElement: function(newElement) {
		var p = this.getXMLElement().parentNode,
			oldElement = this.getXMLElement();
		this.xmlElement = newElement;
		if (!p) return;
		if (p.ownerDocument)
			newElement = p.ownerDocument.adoptNode(newElement);
		p.insertBefore(newElement, oldElement);
		p.removeChild(oldElement);
	},

	getParser: function() { return AnotherCodeMarkupParser.instance },

	getAttributeNamed: function(name, optXmlElement) {
		var element = optXmlElement || this.xmlElement;
                if (!element) return null;
		var attr = element.getAttributeNS(null, name);
		// if (!attr) console.warn("no " + name + " for" + Exporter.stringify(element));
		return attr;
	},

	setAttributeNamed: function(name, value) {
		var element = this.xmlElement;
		element.setAttributeNS(null, name, value);
	},

	getName: function() { return this.getAttributeNamed('name') },

	setName: function(newName) {
		this.getXMLElement().setAttributeNS(null, 'name', newName);
	},

	getDefinition: function() { return this.xmlElement.textContent },

	setDefinition: function(src) {
		this.xmlElement.textContent = ''; // fix for old change elements that were not using CDATA
		var cdata = this.getOrCreateCDATANode();
		cdata.data = src;
	},

	getOrCreateCDATANode: function() {
		var e = this.getXMLElement(),
			cdataType = e.CDATA_SECTION_NODE;
		for (var i = 0; i < e.childNodes.length; i++)
			if (e.childNodes[i].nodeType == cdataType)
				return e.childNodes[i]
		var cdata = NodeFactory.createCDATA();
		this.getXMLElement().appendChild(cdata);
		return cdata;
	},

	addSubElement: function(change, insertBeforeChange) {
		var doc = this.xmlElement.ownerDocument;
		var newElem = doc ? doc.importNode(change.getXMLElement(), true) : change.getXMLElement();
		if (insertBeforeChange)
			this.xmlElement.insertBefore(newElem, insertBeforeChange.getXMLElement())
		else
			this.xmlElement.appendChild(newElem);
		change.xmlElement = newElem;
		return change;
	},

	addSubElements: function(elems) { elems.forEach(function(ea) { this.addSubElement(ea) }, this) },

	subElements: function() {
		return [];
	},

	subElementNamed: function(name) {
		var elems = this.subElements();
		for (var i = 0; i < elems.length; i++)
			if (elems[i].getName() == name) return elems[i];
	},

	parent: function() { return  new ClassChange(this.getXMLElement().parentNode) },

},
'evaluation', {
	disableAutomaticEval: function() {
		this.getXMLElement().setAttributeNS(null, 'automaticEval', 'false');
	},
	enableAutomaticEval: function() {
		this.getXMLElement().setAttributeNS(null, 'automaticEval', 'true');
	},
	automaticEvalEnabled: function() {
		return this.getAttributeNamed('automaticEval') != 'false';
	},

	evaluate: function() {
		throw dbgOn(new Error('Overwrite me'));
	},
},
'removing', {
	remove: function() {
		var elem = this.xmlElement;
		if (!elem.parentNode) return;
		elem.parentNode.removeChild(elem);
	},
},
'conversion', {
	asJs: function() {
		throw new Error('Subclass resbonsibility -- not implemented in ' + this.constructor.type);
	},
},
'debugging', {
    toString: function() {
		var message = this.constructor.type + ' named ' + this.getName();
		message += ' -- subelems: ' + this.subElements().length;
		return message;
	},

    inspect: function() {
    	try { return this.toString() } catch (err) { return "#<inspect error: " + err + ">" }
	},
},
'file fragment compatibility', {
	flattened: function() {
        return this.subElements().inject([this], function(all, ea) { return all.concat(ea.flattened()) });
    },
	getSourceCode: function() { return this.getDefinition() },
	getSourceCodeWithoutSubElements: function() {
	// duplication! ide.FileFragment.prototype.getSourceCodeWithoutSubElements
		var completeSrc = this.getSourceCode();
		return this.subElements().inject(completeSrc, function(src, ea) {
			var elemSrc = ea.getSourceCode();
			var start = src.indexOf(elemSrc);
			var end = elemSrc.length-1 + start;
			return src.substring(0,start) + src.substring(end+1);
		});
    },
	putSourceCode: function() { throw new Error('Not yet, sorry!') },
	getSourceControl: null/*ide.FileFragment.prototype.getSourceControl*/,
	sourceCodeWithout: function(childFrag) {
	// duplication! ide.FileFragment.prototype.sourceCodeWithout
		if (!this.flattened().any(function(ea) {return ea.eq(childFrag)}))
			throw dbgOn(new Error('Fragment' + childFrag + ' isn\'t in my (' + this + ') subelements!'));
		var mySource = this.getSourceCode();
		var childSource = childFrag.getSourceCode();
		var start = childFrag.startIndex - this.startIndex;
		if (start === -1) throw dbgOn(new Error('Cannot find source of ' + childFrag));
		var end = start + childSource.length;
		var newSource = mySource.slice(0, start) + mySource.slice(end);
		return newSource;
	},
	getFileString: function() { throw new Error('Not yet, sorry!') },
});
Object.extend(Change, {
	initializerName: 'initializer',
	worldRequirementsListName: 'local requirements',
	fromJS: function(src) { return new JsParser().parseNonFile(src).asChange() },
});

// Let Change act as a FileFragment for use in browser

Change.subclass('ChangeSet',
'initializing', {

	initialize: function(optName) {
		// Keep track of an ordered list of Changes
		this.xmlElement = null;
		this.name = optName || '';
	},

	initializeFromWorldNode: function(node) {
		if (!node)
			throw dbgOn(new Error('Couldn\'t initialize ChangeSet'));
		if (node.localName !== 'defs')
			node = this.findOrCreateDefNodeOfWorld(node);
		return this.initializeFromNode(node);
	},

	initializeFromNode: function(node) {
		if (!this.reconstructFrom(node))
			this.addHookTo(node);
		return this;
	},

	initializeFromFile: function(fileName, fileString) {
		if (!fileString) {
			var url = fileName.startsWith('http') ? new URL(fileName) : URL.codeBase.withFilename(fileName);
			fileString = new WebResource(url).get().content;
		}
		return this.initializeFromString(fileString);
	},

	initializeFromString: function(str) {
		var doc = new DOMParser().parseFromString(str, "text/xml");
		if (!this.reconstructFrom(doc))
			throw dbgOn(new Error('Couldn\'t create ChangeSet from ' + str));
		return this;
	},

	reconstructFrom: function(node) {
		if (!node) return false;
		var codeNodes = $A(node.childNodes).select(function(node) { return node.localName == 'code' });
		if (codeNodes.length == 0) return false;
		if (codeNodes.length > 1)
			console.warn('multiple code nodes in ' + node);
		this.xmlElement = codeNodes[codeNodes.length-1];
		return true;
	},

	addHookTo: function(defNode) {
		$A(defNode.childNodes).forEach(function(node) {
			if (node.localName == 'code') defNode.removeChild(node);
		});
		this.xmlElement = this.xmlElement || LivelyNS.create("code");
		try {
			defNode.appendChild(this.xmlElement);
		} catch(e) {
			// the xmlElement may have originated from another document, in
			// such a case we have to import the node into the defNode's
			// ownerDocument first. Otherwise, forward error.
			if (e.code == DOMException.WRONG_DOCUMENT_ERR)
				defNode.appendChild(defNode.ownerDocument.importNode(this.xmlElement, true));
			else throw e;
		}
	},

	findOrCreateDefNodeOfWorld: function(doc) {
		// FIXME !!!
		if (doc.getAttribute && (doc.getAttribute('type') || doc.getAttribute('lively:type')) == "WorldMorph" ) {
			var worldNode = doc,
				defNode = $A(worldNode.childNodes).detect(function(node) { return node.localName == 'defs' });
			if (!defNode) {
				defNode = NodeFactory.create('defs');
				worldNode.appendChild(defNode);
			}
			return defNode
		}
		var rootElement = doc.documentElement ? doc.documentElement : doc.ownerDocument.documentElement,
			defNodeQuery1 = '//*[@lively:type="WorldMorph"]/*[local-name()="defs"]',
			defNodeQuery2 = '//*[@type="WorldMorph"]/*[local-name()="defs"]',
			defNode = Query.find(defNodeQuery1, rootElement) || Query.find(defNodeQuery2, rootElement);
		if (defNode) return defNode;
		var worldNodeQuery1 = '//*[@lively:type="WorldMorph"]',
			worldNodeQuery2 = '//*[@type="WorldMorph"]',
			worldNode = rootElement.getAttribute('type') == 'WorldMorph' ? rootElement :
				Query.find(worldNodeQuery1, rootElement) || Query.find(worldNodeQuery2, rootElement);

		defNode = NodeFactory.create('defs');

		if (worldNode) {
			worldNode.appendChild(defNode); // null Namespace?
		} else {
			console.warn('Cannot find worldNode when creating ChangeSet');
		}

		return defNode;
	},

},
'subelements', {

	addChange: function(change) {
		this.addSubElement(change);
	},

	subElements: function() {
		var parser = this.getParser();
                if (!this.xmlElement) return [];
		return $A(this.xmlElement.childNodes)
			.collect(function(ea) { return parser.createChange(ea) })
			.reject(function(ea) { return !ea });
	},

	removeChangeNamed: function(name) {
		var change = this.subElementNamed(name);
		if (!change) return null;
		change.remove();
		return change;
	},

	removeChangeAt: function(i) {
		var changes = this.subElements();
		if (!(i in changes)) return null;
		var change = changes[i];
		change.remove();
		return change;
	},

	remove: function() {
		this.subElements().invoke('remove');
	},

	addOrChangeElementNamed: function(name, source) {
		var prev = this.subElementNamed(name);
		if (prev) { prev.setDefinition(source); return }
		this.addChange(DoitChange.create(source, name));
	},

},
'evaluation', {

	evaluate: function() {
		this.subElements().forEach(function(item) { item.evaluate() });
	},

},
'SimpleBrowser support', {
	// used in SimpleBrowser, lively.Tools. No changes are recorded yet...
	logChange: function(spec) {},
},
'system startup, initializer and world requirements', {

	getInitializer: function() {
		var elems = this.subElements();
		for (var i = 0; i < elems.length; i++)
			if (elems[i].isInitializer()) return elems[i];
	},

	getWorldRequirementsList: function() {
		var elems = this.subElements();
		for (var i = 0; i < elems.length; i++)
			if (elems[i].isWorldRequirementsList()) return elems[i];
	},

	ensureHasInitializeScript: function() {
		if (this.getInitializer()) return;
		var content = '// this script is evaluated on world load';
		this.addOrChangeElementNamed(Change.initializerName, content);
	},

	ensureHasWorldRequirements: function() {
		if (this.getWorldRequirementsList()) return;
		var content = '// An array of module names that is loaded on world load\n[]';
		this.addSubElement(
			DoitChange.create(content, Change.worldRequirementsListName),
			this.getInitializer()); // insert before initializer
	},

	evaluateAllButInitializer: function() {
		var changes = this.subElements();
		for (var i = 0; i < changes.length; i++) {
			var change = changes[i];
			if (!change.isWorldRequirementsList() &&
				!change.isInitializer() &&
				change.automaticEvalEnabled())
					change.evaluate();
		}
	},

	evaluateInitializer: function() {
		var initializerDoit = this.getInitializer();
		if (initializerDoit) initializerDoit.evaluate();
	},

	evaluateWorldRequirements: function() {
		var requirementsDoit = this.getWorldRequirementsList();
		if (!requirementsDoit) return;
		var list = requirementsDoit.evaluate();
		if (Object.isArray(list))
			Config.modulesBeforeWorldLoad = Config.modulesBeforeWorldLoad.concat(list);
	},

	ensureCompatibility: function() {
		var ps = this.subElementNamed('postscript');
		if (!ps) return;
		ps.setName(Change.initializerName);
	},

	addWorldRequirement: function(moduleName) {
		var list = this.getWorldRequirementsList().evaluate();
		if (!list.include(moduleName))
			list.push(moduleName);
		this.getWorldRequirementsList().setDefinition(JSON.serialize(list))
	},

	removeWorldRequirement: function(moduleName) {
		var list = this.getWorldRequirementsList().evaluate();
		if (list.include(moduleName)) {
			list = list.reject(function(ea){ return ea == moduleName})
			this.getWorldRequirementsList().setDefinition(JSON.serialize(list))
		}
	},
    hasWorldRequirement: function(moduleName) {
        var list = this.getWorldRequirementsList().evaluate();
        return list.include(moduleName)
    },

	moduleNamesInNamespace: function(namespaceName){
		// ChangeSet.current().moduleNamesInNamespace('apps')
		var dir = new WebResource(URL.codeBase.withFilename(namespaceName +'/'))
		var fileNames = dir.getSubElements().subDocuments.collect(function(file) {
			return file.getURL().filename()
		}).select(function(ea){return ea.endsWith(".js")});
		var fullModuleNames = fileNames.collect(function(ea) {
			return namespaceName + "." + ea.match(/(.+)\.js/)[1] });
		return fullModuleNames
	}
});
Object.extend(ChangeSet, {

	fromWorld: function(worldOrNode) {
		if (Config.isNewMorphic && lively.morphic && worldOrNode instanceof lively.morphic.World)
			return worldOrNode.getChangeSet();
		var node = worldOrNode instanceof lively.morphic.World ?
			worldOrNode.getDefsNode() :
			worldOrNode;
		var cs = new ChangeSet('Local code').initializeFromWorldNode(node);
		cs.ensureCompatibility();
		cs.ensureHasInitializeScript();
		cs.ensureHasWorldRequirements();
		return cs;
	},

	fromNode: function(node) {
		return new ChangeSet('Local code').initializeFromNode(node);
	},

	fromFile: function(fileName, fileString) {
		return new ChangeSet(fileName).initializeFromFile(fileName, fileString);
	},

	current: function() {
		// Return the changeSet associated with the current world
		var worldOrNode = lively.morphic.World.current() || new Importer().canvasContent(Global.document)[0];
		return ChangeSet.fromWorld(worldOrNode);
	},

});


Change.subclass('ClassChange',
'testing', {
	isClassChange: true,
},
'accessing', {
	getSuperclassName: function() {
		return this.getAttributeNamed('super');
	},
	subElements: function() {
		// memorize?
		var parser = this.getParser();
                if (!this.xmlElement) return [];
		return $A(this.xmlElement.childNodes)
			.collect(function(ea) { return parser.createChange(ea) })
			.reject(function(ea) { return !ea })
	},


	getProtoChanges: function() {
		return this.subElements().select(function(ea) { return ea.isProtoChange });
	},
	getStaticChanges: function() {
		return this.subElements().select(function(ea) { return ea.isStaticChange });
	},
	getCategories: function() {
		return this.subElements()
			.collect(function(change) { return change.getCategoryName() })
			.uniq()
			.collect(function(name) { return MethodCategoryChange.createFromClassChange(this, name) }, this);
	},
	definitionWithNewCategory: function(oldCategoryName, newCategorySrc) {
		// when a category changes it must change ther definition of its class
		var defs = this.getCategories().collect(function(category) {
			return category.getName() === oldCategoryName ? newCategorySrc : category.asJs();
		});
		var def = this.getDefinitionWithBody(defs.join(',\n'));
		return def;
	},
	getDefinitionWithBody: function(bodyStr) {
		return Strings.format('%s.subclass(\'%s\'%s);',
			this.getSuperclassName(), this.getName(), bodyStr ? (',\n' + bodyStr) : '');
	},


},
'evaluation', {
	evaluate: function() {
		try {
			var superClassName = this.getSuperclassName();
			if (!Class.forName(superClassName))
				throw new Error('Could not find class ' + superClassName);
			var className = this.getName();
			if (Class.forName(className))
				console.warn('Class ' + className + ' already defined! Evaluating class change regardless');
			var src = Strings.format('%s.subclass(\'%s\')', superClassName, className),
				klass = eval(src);
			this.getStaticChanges().concat(this.getProtoChanges()).forEach(function(ea) { ea.evaluate() });
			return klass;
		} catch(e) {
			console.error(e);
			throw e;
		}
	},
},
'conversion', {
	asJs: function(depth) {
		depth = depth || '';
		var body = this.subElements().length == 0 ? null : this.getCategories().invoke('asJs', depth).join(',\n')
		return this.getDefinitionWithBody(body);
	},
});

Object.extend(ClassChange, {

	isResponsibleFor: function(xmlElement) { return xmlElement.localName === 'class' },

	create: function(name, superClassName) {
		var element = LivelyNS.create('class');
		element.setAttributeNS(null, 'name', name);
		element.setAttributeNS(null, 'super', superClassName);
		var change = new ClassChange(element);
		change.enableAutomaticEval();
		return change;
	},

});

Change.subclass('ProtoChange',
'testing', {
	isProtoChange: true,
},
'accessing', {
	getClassName: function() {
		return this.getAttributeNamed('className')
			|| this.getAttributeNamed('name', this.xmlElement.parentNode);
	},
	getCategoryName: function() {
		return this.getAttributeNamed('category') || 'default category';
	},
},
'evaluation', {
	evaluate: function() {
		try {
			var className = this.getClassName();
			var klass = Class.forName(className);
			if (!klass) new Error('Could not find class of proto change ' + this.getName());
			var src = Strings.format('%s.addMethods({%s: %s})', className, this.getName(), this.getDefinition());
			eval(src);
			return klass.prototype[this.getName()];
		} catch(e) {
			console.error(e);
			throw e;
		}
	},
},
'conversion', {
	asJs: function(depth) { // FIXME duplication with StaticChange
		depth = depth || '';
		var body = this.getDefinition();
		// body = body.replace(/\s+(.*)/, '$1');
		return depth + this.getName() + ': ' + body + ',';
	},
});


Object.extend(ProtoChange, {

	isResponsibleFor: function(xmlElement) { return xmlElement.localName === 'proto' },

	create: function(name, source, optClassName, optCategoryName) {
		var element = LivelyNS.create('proto');
		element.setAttributeNS(null, 'name', name);
		element.setAttributeNS(null, 'category', optCategoryName);
		if (optClassName) element.setAttributeNS(null, 'className', optClassName);
		var change = new ProtoChange(element);
		change.setDefinition(source || '');
		change.enableAutomaticEval();
		return change;
	},

});

Change.subclass('StaticChange',
'testing', {
	isStaticChange: true,
},
'accessing', {
	getClassName: function() { // duplication with protoChange
		return this.getAttributeNamed('name', this.xmlElement.parentNode);
	},
	getCategoryName: ProtoChange.prototype.getCategoryName,
},
'evaluation', {
	evaluate: function() {
		try {
			var className = this.getClassName(),
				klass = Class.forName(className);
			if (!klass) throw dbgOn(new Error('Could not find class of static change' + this.getName()));
			var src = Strings.format('Object.extend(%s, {%s: %s})', className, this.getName(), this.getDefinition());
			eval(src);
			return klass[this.getName()];
		} catch(e) {
			console.error(e);
			throw e;
		}
	},
},
'conversion', {
	asJs: function(depth) { // FIXME duplication with ProtoChange
		depth = depth || '';
		var body = this.getDefinition();
		// body = body.replace(/\s+(.*)/, '$1');
		return depth + this.getName() + ': ' + body + ',';
	},
});

Object.extend(StaticChange, {

	isResponsibleFor: function(xmlElement) { return xmlElement.localName === 'static' },

	create: function(name, source, optClassName, optCategoryName) { // duplication with proto!!!
		var element = LivelyNS.create('static');
		element.setAttributeNS(null, 'name', name);
		element.setAttributeNS(null, 'category', optCategoryName);
		if (optClassName) element.setAttributeNS(null, 'className', optClassName);
		var change = new ProtoChange(element);
		change.setDefinition(source);
		change.enableAutomaticEval();
		return change;
	},

});
Change.subclass('MethodCategoryChange',
'initializing', {
	initialize: function($super, classXmlElement, categoryName) {
		$super(classXmlElement);
		this.categoryName = categoryName;
	},
},
'comparing', {
	eq: function($super, other) { return $super(other) && other.getName() == this.getName() },
},
'accessing', {
	getClassChange: function() { return new ClassChange(this.getXMLElement()) },
	getName: function() { return this.categoryName },
	setName: function(name) { this.categoryName = name },
	subElements: function() {
		return this.getClassChange().subElements().select(function(ea) {
			return ea.getCategoryName() === this.getName();
		}, this);
	},
	getDefinition: function(depth) {
		depth = depth || '';
		var str = '\'' + this.getName() + '\', {\n';
		str += this.subElements().invoke('asJs', depth + '\t').join('\n');
		str += '\n}'
		return str;
	},
	setDefinition: function(src) {
		var nameMatch = src.match(/\'([^\']+)\'|\"([^\"]+)\"/),
			name = (nameMatch && (nameMatch[1] || nameMatch[2])) || 'COULD NOT PARSE NAME!';
		this.setName(name);
		var classChange = this.getClassChange(),
			newClassDef = classChange.definitionWithNewCategory(src, this.getName()),
			newClassChange = Change.fromJS(newClassDef);
		if (!newClassChange) throw new Error('Could not parse ' + src);
		this.setXMLElement(newClassChange.getXMLElement());
	},
},
'evaluation', {
	evaluate: function() { this.getClassChange().evaluate() },
},
'removing', {
	remove: function() { this.subElements().invoke('remove') },
},
'conversion', {
	asJs: function(depth) { return this.getDefinition(depth) },
});
Object.extend(MethodCategoryChange, {
	isResponsibleFor: function() { return false },
	createFromClassChange: function(classChange, name) {
		return new this(classChange.getXMLElement(), name);
	},
});

Change.subclass('DoitChange',
'testing', {
	isDoitChange: true,
	isInitializer: function() { return this.getName() === Change.initializerName },
	isWorldRequirementsList: function() { return  this.getName() === Change.worldRequirementsListName },
},
'evaluation', {
	evaluate: function() {
		try {
			var result = eval(this.getDefinition())
		} catch(e) {
			dbgOn(true);
			console.error('DoitChange error: ' + this.getName() + ': ' + e);
			return undefined;
		}
		return result;
	},
});

Object.extend(DoitChange, {

	isResponsibleFor: function(xmlElement) { return xmlElement.localName === 'doit' },

	create: function(source, optName) {
		var element = LivelyNS.create('doit');
		element.setAttributeNS(null, 'name', optName || 'aDoit');
		var doit = new DoitChange(element);
		doit.setDefinition(source || '');
		doit.enableAutomaticEval();
		return doit;
	},

});

Object.subclass('AnotherCodeMarkupParser',
'settings', {
	changeClasses: Change.allSubclasses().without(ChangeSet),
},
'initialization', {
	initialize: function() {
		this.files = {};
	},
},
'change creation', {
	createChange: function(xmlElement) {
		if (xmlElement.nodeType == NodeFactory.TextType() || xmlElement.nodeType == NodeFactory.CDATAType())
			return null;
		for (var i = 0; i < this.changeClasses.length; i++) {
			var klass = this.changeClasses[i];
			if (klass.isResponsibleFor(xmlElement))
				return new klass(xmlElement);
		}
		debugger;
		console.warn(
			'Found no Change class for ' + Exporter.stringify(xmlElement).replace(/\n|\r/, ' ') +
			'tag name: ' + xmlElement.localName);
		return null;
	},
},
'helper', {
	getDocumentOf: function(url) { /*helper*/
		url = new URL(url);
		var existing = this.files[url.toString()];
		if (existing) return existing;
		var webR = new WebResource(url).beSync().get("application/xml");
		return webR.contentDocument || new DOMParser().parseFromString(webR.content, "application/xml");
	},
});
Object.extend(AnotherCodeMarkupParser, {
	instance: new AnotherCodeMarkupParser(),
});

//
// extensions for world load support
//



}); // end of module
