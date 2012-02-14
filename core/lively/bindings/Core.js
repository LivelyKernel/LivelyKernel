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

module('lively.bindings.Core').requires().toRun(function() {

Object.subclass('AttributeConnection',
'settings', {
	doNotSerialize: ['isActive'],
},
'initializing', {

	initialize: function(source, sourceProp, target, targetProp, spec) {
		this.init(source, sourceProp, target, targetProp, spec);
	},
	init: function(source, sourceProp, target, targetProp, spec) {
		this.sourceObj = source;
		this.sourceAttrName = sourceProp;
		this.targetObj = target;
		this.targetMethodName = targetProp;
		if (spec) {
			this.removeAfterUpdate = spec.removeAfterUpdate;
			// when converter function references objects from its environment we can't
			// serialize it. To fail as early as possible we will serialize the converter
			// already here 
			this.converter = null;
			this.converterString = spec.converter ? spec.converter.toString() : null;
			this.updater = null;
			this.updaterString = spec.updater ? spec.updater.toString() : null;
                        this.varMapping = Object.extend(spec.varMapping || {},
                            {source: source, target: target});
		}
		return this;
	},


	onSourceAndTargetRestored: function() {
		if (this.sourceObj && this.targetObj) this.connect();
	},

	copy: function(copier) {
		return AttributeConnection.fromLiteral(this.toLiteral(), copier);
	},
	fixInstanceAfterCopyingFromSite: function(name, ref, index) {
		// alert("removed connection: "  + this)
		this.disconnect()
	},


},
'accessing', {

	getTargetObj: function() { return this.targetObj },

	getSourceObj: function() { return this.sourceObj },

	getSourceAttrName: function() { return this.sourceAttrName },

	getTargetMethodName: function() { return this.targetMethodName },
	getSourceValue: function() { return this.getSourceObj()[this.getSourceAttrName()] },
	getPrivateSourceValue: function() { return this.sourceObj[this.privateAttrName(this.sourceAttrName)] },


	getConverter: function() {
		if (!this.converterString) return null;
		if (!this.converter)
			this.converter = lively.Closure.fromSource(this.converterString, this.varMapping).recreateFunc();
		return this.converter;
	},
	getUpdater: function() {
		if (!this.updaterString) return null;
		if (!this.updater)
			this.updater = lively.Closure.fromSource(this.updaterString, this.varMapping).recreateFunc();
		return this.updater;
	},

	privateAttrName: function(attrName) { return '$$' + attrName },

	activate: function() { this.isActive = true },

	deactivate: function() { this.isActive = false },

},
'connecting', {

	connect: function() {
		var existing = this.getExistingConnection()
		if (existing !== this) {
			// when existing == null just add new connection
			// when existing === this then connect was called twice or we are
			//    in deserialization. Just do nothing then.
			existing && existing.disconnect();
			this.addAttributeConnection();
		}

		// Check for existing getters that might be there and not belong to lively.bindings
		// We deal with them in addSourceObjGetterAndSetter()
		var existingSetter = this.sourceObj.__lookupSetter__(this.sourceAttrName),
			existingGetter = this.sourceObj.__lookupGetter__(this.sourceAttrName);

		// Check if a method is the source. We check both the value behind sourceAttrName and $$sourceAttrName
		// because when deserializing scripts those get currently stored in $$sourceAttrName
		// (for non-scripts it doesn't matter since those methods should be in the prototype chain)
		var methodOrValue = !existingSetter && !existingGetter &&
			(this.getSourceValue() || this.getPrivateSourceValue());

		// method connect... FIXME refactori into own class!
		if (Object.isFunction(methodOrValue)) {
			if (!methodOrValue.isWrapped)
				this.addConnectionWrapper(this.sourceObj, this.sourceAttrName, methodOrValue);
		} else { // attribute connect
			this.addSourceObjGetterAndSetter(existingGetter, existingSetter);
		}

		return this;
	},

	disconnect: function() {
		var obj = this.sourceObj;
		if (!obj.attributeConnections) return;
		obj.attributeConnections = obj.attributeConnections.reject(function(con) {
			return this.isSimilarConnection(con);
		}, this);
		var connectionsWithSameSourceAttr = obj.attributeConnections.select(function(con) {
			return this.getSourceAttrName() == con.getSourceAttrName();
		}, this);
		if (connectionsWithSameSourceAttr.length == 0)
			this.removeSourceObjGetterAndSetter();
	},

	update: function(newValue, oldValue) {
		// This method is optimized for Safari and Chrome. See tests.BindingsTest.BindingsProfiler
		// and http://lively-kernel.org/repository/webwerkstatt/draft/ModelRevised.xhtml
		// The following requirements exists:
		// - run converter with oldValue and newValue
		// - when updater is existing run converter only if update is proceeded
		// - bind is slow
		// - arguments is slow when it's items are accessed or it's converted using $A

		if (this.isActive/*this.isRecursivelyActivated()*/) return;
		var connection = this, updater = this.getUpdater(), converter = this.getConverter(),
			target = this.targetObj, propName = this.targetMethodName;
		if (!target || !propName) {
			var msg = 'Cannot update ' + this.toString(newValue) + ' because of no target (' + 
					target + ') or targetProp (' + propName+') ';
			if (this.isWeakConnection) 
                            this.disconnect()
                        console.error(msg);
                        
			// alert(msg);
			return
		}
		var targetMethod = target[propName], callOrSetTarget = function(newValue) {
				// use a function and not a method to capture this in self and so that no bind is necessary
				// and oldValue is accessible. Note that when updater calls this method arguments can be
				// more than just the new value
				if (converter) newValue = converter.call(connection, newValue, oldValue);
				var result = (typeof targetMethod === 'function') ?
					targetMethod.apply(target, arguments) :
					target[propName] = newValue;
				if (connection.removeAfterUpdate) connection.disconnect();
				return result;
			};

		try {
			this.isActive = true;
			return updater ?
				updater.call(this, callOrSetTarget, newValue, oldValue) :
				callOrSetTarget(newValue);		
		} catch(e) {
			dbgOn(Config.debugConnect);
			alert('Error when trying to update ' + this + ' with value '
				+ newValue + ':\n' + e + '\n' + e.stack);
			if (Global.lively.morphic.World && lively.morphic.World.current())
				lively.morphic.World.current().logError('AttributeConnection>>update: ' + e);
		} finally {
			this.isActive = false;
		}
	},

},
'private helper', {

	addSourceObjGetterAndSetter: function(existingGetter, existingSetter) {
		if ((existingGetter && existingGetter.isAttributeConnectionGetter) || 
			(existingSetter && existingSetter.isAttributeConnectionSetter))
				return;

		// if (existingGetter || existingSetter)
		// 	debugger

		var sourceObj = this.sourceObj,
			sourceAttrName = this.sourceAttrName,
			newAttrName = this.privateAttrName(sourceAttrName);

		if (sourceObj[newAttrName])
			console.warn('newAttrName ' + newAttrName + ' already exists. Are there already other connections?');
			
		// add new attr to the serialization ignore list
		if (!sourceObj.hasOwnProperty('doNotSerialize'))
			sourceObj.doNotSerialize = [];
		sourceObj.doNotSerialize.pushIfNotIncluded(newAttrName);

		if (!sourceObj.hasOwnProperty('doNotCopyProperties'))
			sourceObj.doNotCopyProperties = [];
		sourceObj.doNotCopyProperties.pushIfNotIncluded(newAttrName);
		
		
		if (existingGetter)
			sourceObj.__defineGetter__(newAttrName, existingGetter);
		if (existingSetter)
			sourceObj.__defineSetter__(newAttrName, existingSetter);

		// assign old value to new slot
		if (!existingGetter && !existingSetter)
			sourceObj[newAttrName] = sourceObj[sourceAttrName];

		this.sourceObj.__defineSetter__(sourceAttrName, function(newVal) {
			var oldVal = sourceObj[newAttrName];
			sourceObj[newAttrName] = newVal;
			if (sourceObj.attributeConnections === undefined)
				throw new Error('Sth wrong with sourceObj, has no attributeConnections');
			var conns = sourceObj.attributeConnections.clone();
			for (var i = 0; i < conns.length; i++) {
				var c = conns[i];
				if (c.getSourceAttrName() === sourceAttrName)
					c.update(newVal, oldVal);
			}
			return newVal;
		});
		this.sourceObj.__lookupSetter__(sourceAttrName).isAttributeConnectionSetter = true;

		this.sourceObj.__defineGetter__(this.sourceAttrName, function() {
			return sourceObj[newAttrName];
		});
		this.sourceObj.__lookupGetter__(sourceAttrName).isAttributeConnectionGetter = true;
	},

	addConnectionWrapper: function(sourceObj, methodName, origMethod) {
		if (!Object.isFunction(origMethod))
			throw new Error('addConnectionWrapper didnt get a method to wrap')

		sourceObj[this.privateAttrName(methodName)] = origMethod; // save so that it can be restored
		sourceObj[methodName] = function connectionWrapper() {
			if (this.attributeConnections === undefined)
				throw new Error('Sth wrong with this, has no attributeConnections')
			var result = this[methodName].originalFunction.apply(this, arguments);
			var conns = this.attributeConnections.clone();
			for (var i = 0; i < conns.length; i++) {
				var c = conns[i];
				if (c.getSourceAttrName() === methodName)
					result = c.update(result);
			}
			return result;
		};

		sourceObj[methodName].isWrapped = true;
		sourceObj[methodName].isConnectionWrapper = true;
		sourceObj[methodName].originalFunction = origMethod; // for getOriginal()

		// if (origMethod.hasLivelyClosure)
			// sourceObj[methodName].asScriptOf(sourceObj, methodName, {methodName: methodName});
	},

    removeSourceObjGetterAndSetter: function() {


        // delete the getter and setter and the slot were the real value was stored
        // assign the real value to the old slot
        var realAttrName = this.sourceAttrName,
            helperAttrName = this.privateAttrName(realAttrName),
            srcObj = this.sourceObj;
        
        if(srcObj.__lookupGetter__(realAttrName)) {
            delete srcObj[realAttrName];
            srcObj[realAttrName] = srcObj[helperAttrName];
            delete srcObj[helperAttrName];
        } else if(srcObj[realAttrName] && srcObj[realAttrName].isConnectionWrapper) {
            srcObj[realAttrName] = srcObj[realAttrName].originalFunction
        }

        if (srcObj.doNotSerialize && srcObj.doNotSerialize.include(helperAttrName))
            srcObj.doNotSerialize = srcObj.doNotSerialize.without(helperAttrName);
        if (srcObj.doNotCopyProperties && srcObj.doNotCopyProperties.include(helperAttrName))
            srcObj.doNotCopyProperties = srcObj.doNotCopyProperties.without(helperAttrName);
    },

	addAttributeConnection: function() {
		if (!this.sourceObj.attributeConnections)
			this.sourceObj.attributeConnections = [];
		this.sourceObj.attributeConnections.push(this);
	},

	getExistingConnection: function() {
		var conns = this.sourceObj.attributeConnections;
		if (!conns) return null;
		for (var i = 0; i < conns.length; i++)
			if (this.isSimilarConnection(conns[i]))
				return conns[i];
	},
},
'testing', {

	isRecursivelyActivated: function() {
		// is this enough? Maybe use Stack?
		return this.isActive
	},

	isSimilarConnection: function(other) {
		if (!other) return;
		if (other.constructor != this.constructor) return false;
		return this.sourceObj == other.sourceObj &&
			this.sourceAttrName == other.sourceAttrName &&
			this.targetObj == other.targetObj &&
			this.targetMethodName == other.targetMethodName;
	},
},
'debugging', {
	toString: function(optValue) {
		try {
			return Strings.format('AttributeConnection(%s.%s %s %s.%s)',
				this.getSourceObj(),
				this.getSourceAttrName(),
				optValue ? ('-->' + String(optValue) + '-->') : '-->',
				this.getTargetObj(),
				this.getTargetMethodName());
		} catch(e) {
			return '<Error in AttributeConnection>>toString>';
		}
	},
});

AttributeConnection.addMethods({
	toLiteral: function() {
		var self  = this;
		function getId(obj) {
			if (!obj) {
				console.warn('Cannot correctly serialize connections having undefined source or target objects');
				return null;
			}
			if (obj.id && Object.isFunction(obj.id))
				return obj.id();
			if (obj.nodeType && obj.getAttribute) { // is it a real node?
				var id = obj.getAttribute('id')
				if (!id) { // create a new id
					var id = 'ElementConnection--' + lively.data.Wrapper.prototype.newId();
					obj.setAttribute('id', id);
				}
				return id;
			}
			console.warn('Cannot correctly serialize connections having source or target objects that have no id: ' + self);
			return null
		}
		return {
			sourceObj: getId(this.sourceObj),
			sourceAttrName: this.sourceAttrName,
			targetObj: getId(this.targetObj),
			targetMethodName: this.targetMethodName,
			converter: this.converterString,
			updater: this.updaterString,
			removeAfterUpdate: this.removeAfterUpdate,
		};
	},
})

Object.extend(AttributeConnection, {
	fromLiteral: function(literal, importer) {
		if (!importer)
			throw new Error('AttributeConnection needs importer for resolving uris!!!');

		// just create the connection, connection not yet installed!!!
		var con = new AttributeConnection(
			null, literal.sourceAttrName, null, literal.targetMethodName, {
				updater: literal.updater,
				converter: literal.converter,
				removeAfterUpdate: literal.removeAfterUpdate,
			});

		// when target/source obj are restored asynchronly
		new AttributeConnection(con, 'sourceObj', con, 'onSourceAndTargetRestored',
			{removeAfterUpdate: true}).connect();
		new AttributeConnection(con, 'targetObj', con, 'onSourceAndTargetRestored',
			{removeAfterUpdate: true}).connect();

		function restore(id, fieldName) {
			if (!id) {
				console.warn('cannot deserialize ' + fieldName + ' when deserilaizing a lively.bindings.connect');
				return
			}
			if (id.split('--')[0] == 'ElementConnection') { // FIXME brittle!!!
				con[fieldName] = importer.canvas().ownerDocument.getElementById(id);
				return
			}
			importer.addPatchSite(con, fieldName, id);
		};

		restore(literal.sourceObj, 'sourceObj');
		restore(literal.targetObj, 'targetObj');

		return con;
	}
});
AttributeConnection.addMethods('serialization', {
	onrestore: function() {
		try {
			this.connect();
		} catch(e) {
			dbgOn(true);
			console.error('AttributeConnection>>onrestore: Cannot restore ' + this + '\n' + e);
		}
	},
});

Object.extend(lively.bindings, {

	documentation: 'connect parameters: source, sourceProp, target, targetProp, spec\n\
spec can be: {removeAfterUpdate: Boolean, converter: Function, updater: Function, varMapping: Object}',

	connect: function connect(sourceObj, attrName, targetObj, targetMethodName, specOrConverter) {
		if (Object.isFunction(specOrConverter)) {
			console.warn('Directly passing a converter function to connect() is deprecated! Use spec object instead!');
			spec = {converter: specOrConverter};
		} else {
			spec = specOrConverter;
		}
		var connection = new AttributeConnection(sourceObj, attrName, targetObj, targetMethodName, spec),
			existing = connection.getExistingConnection();
		if (existing) {
			existing.init(sourceObj, attrName, targetObj, targetMethodName, spec);
			return existing;
		}
		var result = connection.connect();
                 if (typeof sourceObj['onConnect'] == 'function') {
                    sourceObj.onConnect(attrName, targetObj, targetMethodName)
                }; 
                return result;
	},
	
	disconnect: function(sourceObj, attrName, targetObj, targetMethodName) {
		if (!sourceObj.attributeConnections) return;
 
		sourceObj.attributeConnections.select(function(con) {
			return 	con.getSourceAttrName() == attrName &&
					con.getTargetObj() === targetObj &&
					con.getTargetMethodName() == targetMethodName;
		}).forEach(function(con) { con.disconnect() });

                if (typeof sourceObj['onDisconnect'] == 'function') {
                    sourceObj.onDisconnect(attrName, targetObj, targetMethodName);
                };
	},
	
	disconnectAll: function(sourceObj) {
		if (!sourceObj.attributeConnections) return;
		while (sourceObj.attributeConnections.length > 0)
			sourceObj.attributeConnections[0].disconnect();
	},
	
	signal: function(sourceObj, attrName, newVal) {
		if (!sourceObj.attributeConnections) return;
		var oldVal = sourceObj[attrName];
		for (var i = 0; i < sourceObj.attributeConnections.length; i++) {
			var c = sourceObj.attributeConnections[i];
			if (c.getSourceAttrName() == attrName) c.update(newVal, oldVal);
		}
	},

	callWhenNotNull: function(sourceObj, sourceProp, targetObj, targetSelector) {
		// ensure that sourceObj[sourceProp] is not null, then run targetObj[targetProp]()
		if (sourceObj[sourceProp] != null)
			targetObj[targetSelector](sourceObj[sourceProp])
		else
			lively.bindings.connect(sourceObj, sourceProp, targetObj, targetSelector, {removeAfterUpdate: true})
	},
    callWhenPathNotNull: function(source, path, target, targetProp) {
        var helper = {
            key: path.pop(),
            whenDefined: function(context) {
                lively.bindings.callWhenNotNull(context, this.key, target, targetProp)
            },
        }

        while (path.length > 0)
            helper = {
                key: path.pop(),
                next: helper,
                whenDefined: function(context) {
                    lively.bindings.callWhenNotNull(context, this.key, this.next, 'whenDefined')
                }
            }

        helper.whenDefined(source);
    },

})

Object.extend(Global, {
	connect: lively.bindings.connect,
	disconnect: lively.bindings.disconnect,
	disconnectAll: lively.bindings.disconnectAll,
	signal: lively.bindings.signal,
	updateAttributeConnection: lively.bindings.signal
});
	
}); // end of module
