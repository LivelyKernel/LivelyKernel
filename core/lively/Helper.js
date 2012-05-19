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

Object.extend(Global, {
	// DEPRECATED!!!
	range: Array.range,
});

Object.extend(Global, {
	newFakeMouseEvent: function(point) {
		var rawEvent = {type: "mousemove", pageX: 100, pageY: 100, altKey: false, shiftKey: false, metaKey: false}; 
var evt = new Event(rawEvent);
    evt.hand = lively.morphic.World.current().hands.first();
    if (point) evt.mousePoint = point;
    return evt;
},
});


Object.subclass('lively.Helper.XMLConverter', {

	documentation: 'Converts JS -> XML and XML -> JS, not complete but works for most cases, namespace support',
	
	convertToJSON: function(xml) {
		return this.storeXMLDataInto(xml, {});
	},

	storeXMLDataInto: function(xml, jsObj) {
		jsObj.tagName = xml.tagName;
		jsObj.toString = function() { return jsObj.tagName };
		$A(xml.attributes).forEach(function(attr) { jsObj[attr.name] = attr.value	});
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
			result = '{';
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
	},

});

Object.extend(Global, {
	showThenHide: function(morph, duration) {
		duration = duration || 3;
		morph.openInWorld();
		if (duration) // FIXME use scheduler
			(function() { morph.remove() }).delay(duration);
	},

	// highlight some point on the screen
	showPt: function(/*pos or x,y, duration, extent*/) {
		var args = $A(arguments);
		// pos either specified using point object or two numbers
		var pos = args[0].constructor == lively.Point ?
			args.shift() :
			pt(args.shift(), args.shift());
		var duration = args.shift();
		var extent = args.shift() || pt(12,12);
		
		
		var b = new BoxMorph(extent.extentAsRectangle());
		b.align(b.getCenter(), pos);
		b.applyStyle({fill: Color.red});
		b.ignoreEvents();
		
		showThenHide(b, duration);
		return b;
	},
	
	showRect: function(rect, duration) {
		var b = new BoxMorph(rect);
		b.applyStyle({borderColor: Color.red, borderWidth: 2, fill: null});
		b.ignoreEvents();
		showThenHide(b, duration);
		return b
	},

    showMorph: function(morph) {
        showRect(morph.getGlobalTransform().transformRectToRect(morph.shape.bounds()))
    },

	showConnection: function(c, duration) {
		var m1 = c.getSourceObj();
		var m2 = c.getTargetObj();

		if (m1.isConnectionVisualization || m2.isConnectionVisualization) return; // don't show yourself...
		if (!(m1 instanceof Morph)) return;
		if (!(m2 instanceof Morph)) return;

		var morph  = Morph.makeConnector(pt(100,100), pt(200,200));
		morph.isConnectionVisualization = true;

		if (duration) showThenHide(morph, duration);
		else morph.openInWorld();
		
		morph.setBorderWidth(2);
		morph.setBorderColor(Color.red);
		morph.arrowHead.head.setFill(Color.red);
		morph.arrowHead.head.setBorderColor(Color.red);

		var labelStyle = {fill: Color.white, textColor: Color.red};

		morph.connectMorphs(m1, m2)
		var startLabel = new lively.morphic.Text(new Rectangle(0,0, 100,30), c.getSourceAttrName()).beLabel();
		startLabel.applyStyle(labelStyle);
		morph.addMorph(startLabel);
		morph.startLabel = startLabel;

		var endLabel = new lively.morphic.Text(new Rectangle(0,0, 100,30), c.getTargetMethodName()).beLabel();
		endLabel.applyStyle(labelStyle);
		morph.addMorph(endLabel);
		morph.endLabel = endLabel;

		if (c.converterString) {
			var middleLabel = new lively.morphic.Text(new Rectangle(0,0, 100,30), c.converterString).beLabel();
			middleLabel.applyStyle(labelStyle);
			morph.addMorph(middleLabel);
			morph.middleLabel = middleLabel;
		}
		
		morph.addScript(function updateLabelPositions() {
			this.startLabel.setPosition(this.getStartPos());
			this.endLabel.setPosition(this.getEndPos());
			if (this.middleLabel)	this.middleLabel.setPosition(this.getRelativePoint(0.5));
		});

		connect(morph, 'geometryChanged', morph, 'updateLabelPositions');
		
		morph.toggleLineStyle();	

		return morph
	},

	showConnections: function(obj) {
		if (!obj.attributeConnections) return;
		for (var i = 0; i < obj.attributeConnections.length; i++)
			showConnection(obj.attributeConnections[i]);
	},
	hideAllConnections: function(morph) {
		morph.withAllSubmorphsDo(function() {
			if (this.isConnectionVisualization) this.remove();
		});
	},



});

});