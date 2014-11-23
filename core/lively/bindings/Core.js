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
    doNotSerialize: ['isActive', 'converter', 'updater']
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
        this.varMapping = {source: source, target: target};
        if (spec) {
            if (spec.removeAfterUpdate) this.removeAfterUpdate = true;
            if (spec.forceAttributeConnection) this.forceAttributeConnection = true;
            // when converter function references objects from its environment
            // we can't serialize it. To fail as early as possible we will
            // serialize the converter / updater already in the setters
            if (spec.converter) this.setConverter(spec.converter);
            if (spec.updater) this.setUpdater(spec.updater);
            if (spec.varMapping) {
                this.varMapping = Object.extend(spec.varMapping, this.varMapping);
            }
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
        this.disconnect();
    },

    clone: function() {
        //rk 2012-10-09: What is the reason to have clone AND copy?!
        var con = new this.constructor(
            this.getSourceObj(), this.getSourceAttrName(),
            this.getTargetObj(), this.getTargetMethodName(),
            this.getSpec());
        if (this.dependedBy) con.dependedBy = this.dependedBy;
        return con;
    }

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

    setConverter: function(funcOrSource) {
        delete this.converter;
        return this.converterString = funcOrSource ? String(funcOrSource) : null;
    },

    getUpdater: function() {
        if (!this.updaterString) return null;
        if (!this.updater) {
            this.updater = lively.Closure.fromSource(this.updaterString, this.varMapping).recreateFunc();
        }
        return this.updater;
    },

    setUpdater: function(funcOrSource) {
        delete this.updater;
        return this.updaterString = funcOrSource ? String(funcOrSource) : null;
    },

    getSpec: function() {
        var spec = {};
        if (this.updaterString) spec.updater = this.getUpdater();
        if (this.converterString) spec.converter = this.getConverter();
        if (this.removeAfterUpdate) spec.removeAfterUpdate = true;
        if (this.forceAttributeConnection) spec.forceAttributeConnection = true;
        return spec;
    },

    resetSpec: function() {
        delete this.removeAfterUpdate;
        delete this.forceAttributeConnection;
        delete this.converter;
        delete this.converterString;
        delete this.updater;
        delete this.updaterString;
    },

    privateAttrName: function(attrName) { return '$$' + attrName },

    activate: function() { this.isActive = true },

    deactivate: function() { delete this.isActive; }

},
'connecting', {

    connect: function() {
        var existing = this.getExistingConnection()
        if (existing !== this) {
            // when existing == null just add new connection when
            // existing === this then connect was called twice or we are in
            // deserialization. Just do nothing then.
            existing && existing.disconnect();
            this.addAttributeConnection();
        }

        // Check for existing getters that might be there and not belong to
        // lively.bindings We deal with them in addSourceObjGetterAndSetter()
        var existingSetter = this.sourceObj.__lookupSetter__(this.sourceAttrName),
            existingGetter = this.sourceObj.__lookupGetter__(this.sourceAttrName);

        // Check if a method is the source. We check both the value behind
        // sourceAttrName and $$sourceAttrName because when deserializing
        // scripts those get currently stored in $$sourceAttrName (for
        // non-scripts it doesn't matter since those methods should be in the
        // prototype chain)
        var methodOrValue = !existingSetter && !existingGetter &&
            (this.getSourceValue() || this.getPrivateSourceValue());

        // method connect... FIXME refactori into own class!
        if (Object.isFunction(methodOrValue) && !this.forceAttributeConnection) {
            if (!methodOrValue.isWrapped) {
                this.addConnectionWrapper(this.sourceObj, this.sourceAttrName, methodOrValue);
            }
        } else { // attribute connect
            this.addSourceObjGetterAndSetter(existingGetter, existingSetter);
        }

        return this;
    },

    disconnect: function() {
        var obj = this.sourceObj;
        if (!obj || !obj.attributeConnections) return this.removeSourceObjGetterAndSetter();
        obj.attributeConnections = obj.attributeConnections.reject(function(con) {
            return this.isSimilarConnection(con);
        }, this);
        var connectionsWithSameSourceAttr = obj.attributeConnections.select(function(con) {
            return this.getSourceAttrName() == con.getSourceAttrName();
        }, this);
        if (obj.attributeConnections.length == 0) {
            delete obj.attributeConnections;
        }
        if (connectionsWithSameSourceAttr.length == 0) {
            this.removeSourceObjGetterAndSetter();
        }
        return null;
    },

    update: function (newValue, oldValue) {
        // This method is optimized for Safari and Chrome.
        // See lively.bindings.tests.BindingTests.BindingsProfiler
        // The following requirements exists:
        // - Complete Customization of control (how often, if at all, binding
        //   should be activated, parameters passed, delay,... )
        // - run converter with oldValue and newValue
        // - when updater is existing run converter only if update is proceeded
        // - bind is slow
        // - arguments is slow when it's items are accessed or it's converted
        //   using Array.from. Note 2014-02-10: We currently need to modify the
        //   argument array for allowing conversion.

        if (this.isActive/*this.isRecursivelyActivated()*/) return null;
        var connection = this, updater = this.getUpdater(), converter = this.getConverter(),
            target = this.targetObj, propName = this.targetMethodName;
        if (!target || !propName) {
            var msg = 'Cannot update ' + this.toString(newValue)
                    + ' because of no target ('
                    + target + ') or targetProp (' + propName+') ';
            if (this.isWeakConnection) { this.disconnect(); }
            console.error(msg);

            return null;
        }
        var targetMethod = target[propName], callOrSetTarget = function(newValue, oldValue) {
            // use a function and not a method to capture this in self and so
            // that no bind is necessary and oldValue is accessible. Note that
            // when updater calls this method arguments can be more than just
            // the new value
            var args = Array.from(arguments);
            if (converter) {
                newValue = converter.call(connection, newValue, oldValue);
                args[0] = newValue;
            }
            var result = (typeof targetMethod === 'function') ?
                targetMethod.apply(target, args) :
                target[propName] = newValue;
            if (connection.removeAfterUpdate) connection.disconnect();
            return result;
        };

        try {
            this.isActive = true;
            return updater ?
                updater.call(this, callOrSetTarget, newValue, oldValue) :
                callOrSetTarget(newValue, oldValue);
        } catch(e) {
            // FIXME: checks should not be scatter all over the code
            if (lively.Config.get('loadRewrittenCode') && e.unwindException)
                throw e.unwindException;
            dbgOn(Config.debugConnect);
            var world = Global.lively &&
                lively.morphic.World &&
                lively.morphic.World.current();
            if (world) {
                world.logError(e, 'AttributeConnection>>update: ');
            } else {
                alert('Error when trying to update ' + this + ' with value '
                     + newValue + ':\n' + e + '\n' + e.stack);
            }
        } finally {
            delete this.isActive;
        }

        return null;
    }

},
'private helper', {

    addSourceObjGetterAndSetter: function(existingGetter, existingSetter) {
        if ((existingGetter && existingGetter.isAttributeConnectionGetter) ||
            (existingSetter && existingSetter.isAttributeConnectionSetter)) {
            return;
        }

        var sourceObj = this.sourceObj,
            sourceAttrName = this.sourceAttrName,
            newAttrName = this.privateAttrName(sourceAttrName);

        if (sourceObj[newAttrName]) {
            console.warn('newAttrName ' + newAttrName + ' already exists.' +
                         'Are there already other connections?');
        }

        // add new attr to the serialization ignore list
        if (!sourceObj.hasOwnProperty('doNotSerialize')) sourceObj.doNotSerialize = [];
        sourceObj.doNotSerialize.pushIfNotIncluded(newAttrName);

        if (!sourceObj.hasOwnProperty('doNotCopyProperties')) sourceObj.doNotCopyProperties = [];
        sourceObj.doNotCopyProperties.pushIfNotIncluded(newAttrName);

        if (existingGetter)
            sourceObj.__defineGetter__(newAttrName, existingGetter);
        if (existingSetter)
            sourceObj.__defineSetter__(newAttrName, existingSetter);

        // assign old value to new slot
        if (!existingGetter && !existingSetter && sourceObj.hasOwnProperty(sourceAttrName))
            sourceObj[newAttrName] = sourceObj[sourceAttrName];

        this.sourceObj.__defineSetter__(sourceAttrName, function(newVal) {
            var oldVal = sourceObj[newAttrName];
            sourceObj[newAttrName] = newVal;
            if (sourceObj.attributeConnections === undefined) {
                console.error('Sth wrong with sourceObj, has no attributeConnections');
                return null;
            }
            var conns = sourceObj.attributeConnections.clone();
            for (var i = 0; i < conns.length; i++) {
                var c = conns[i];
                if (c && c.getSourceAttrName() === sourceAttrName) {
                    c.update(newVal, oldVal);
                }
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
        if (!Object.isFunction(origMethod)) {
            throw new Error('addConnectionWrapper didnt get a method to wrap');
        }

        // save so that it can be restored
        sourceObj[this.privateAttrName(methodName)] = origMethod;
        sourceObj[methodName] = function connectionWrapper() {
            if (this.attributeConnections === undefined)
                throw new Error('Sth wrong with this, has no attributeConnections')
            var conns = this.attributeConnections.clone(),
                result = this[methodName].originalFunction.apply(this, arguments);
            for (var i = 0, len = conns.length; i < len; i++) {
                var c = conns[i];
                if (c.getSourceAttrName() === methodName) result = c.update(result);
            }
            return result;
        };

        sourceObj[methodName].isWrapped = true;
        sourceObj[methodName].isConnectionWrapper = true;
        sourceObj[methodName].originalFunction = origMethod; // for getOriginal()
    },

    removeSourceObjGetterAndSetter: function() {
        // delete the getter and setter and the slot were the real value was stored
        // assign the real value to the old slot
        var realAttrName = this.sourceAttrName,
            helperAttrName = this.privateAttrName(realAttrName),
            srcObj = this.sourceObj;

        if (!srcObj) return;

        if (srcObj.__lookupGetter__(realAttrName)) {
            delete srcObj[realAttrName];
            srcObj[realAttrName] = srcObj[helperAttrName];
            delete srcObj[helperAttrName];
        } else if(srcObj[realAttrName] && srcObj[realAttrName].isConnectionWrapper) {
            srcObj[realAttrName] = srcObj[realAttrName].originalFunction
        }

        if (srcObj.doNotSerialize && srcObj.doNotSerialize.include(helperAttrName)) {
            srcObj.doNotSerialize = srcObj.doNotSerialize.without(helperAttrName);
            if (srcObj.doNotSerialize.length == 0) delete srcObj.doNotSerialize;
        }

        if (srcObj.doNotCopyProperties && srcObj.doNotCopyProperties.include(helperAttrName)) {
            srcObj.doNotCopyProperties = srcObj.doNotCopyProperties.without(helperAttrName);
            if (srcObj.doNotCopyProperties.length == 0) delete srcObj.doNotCopyProperties;
        }
    },

    addAttributeConnection: function() {
        if (!this.sourceObj.attributeConnections)
            this.sourceObj.attributeConnections = [];
        this.sourceObj.attributeConnections.push(this);
    },

    getExistingConnection: function() {
        var conns = this.sourceObj && this.sourceObj.attributeConnections;
        if (!conns) return null;
        for (var i = 0, len = conns.length; i < len; i++) {
            if (this.isSimilarConnection(conns[i])) return conns[i];
        }
        return null;
    }

},
'testing', {

    isRecursivelyActivated: function() {
        // is this enough? Maybe use Stack?
        return this.isActive
    },

    isSimilarConnection: function(other) {
        if (!other) return false;
        if (other.constructor != this.constructor) return false;
        return this.sourceObj == other.sourceObj &&
            this.sourceAttrName == other.sourceAttrName &&
            this.targetObj == other.targetObj &&
            this.targetMethodName == other.targetMethodName;
    }
},
'debugging', {
    toString: function(optValue) {
        try {
            return Strings.format(
                'AttributeConnection(%s.%s %s %s.%s)',
                this.getSourceObj(),
                this.getSourceAttrName(),
                optValue ? ('-->' + String(optValue) + '-->') : '-->',
                this.getTargetObj(),
                this.getTargetMethodName());
        } catch(e) {
            return '<Error in AttributeConnection>>toString>';
        }
    }
});

AttributeConnection.addMethods({
    toLiteral: function() {
        var self  = this;
        function getId(obj) {
            if (!obj) {
                console.warn('Cannot correctly serialize connections having '
                            + 'undefined source or target objects');
                return null;
            }
            if (obj.id && Object.isFunction(obj.id))
                return obj.id();
            if (obj.nodeType && obj.getAttribute) { // is it a real node?
                var id = obj.getAttribute('id')
                if (!id) { // create a new id
                    id = 'ElementConnection--' + Date.now();
                    obj.setAttribute('id', id);
                }
                return id;
            }
            console.warn('Cannot correctly serialize connections having '
                        + 'source or target objects that have no id: ' + self);
            return null
        }
        var literal = {
            sourceObj: getId(this.sourceObj),
            sourceAttrName: this.sourceAttrName,
            targetObj: getId(this.targetObj),
            targetMethodName: this.targetMethodName
        };
        if (this.converterString) literal.converter = this.converterString;
        if (this.updaterString) literal.updater = this.updaterString;
        if (this.removeAfterUpdate) literal.removeAfterUpdate = true;
        if (this.forceAttributeConnection) literal.forceAttributeConnection = true;
        return literal;
    }
})

Object.extend(AttributeConnection, {
    fromLiteral: function(literal, importer) {
        if (!importer)
            throw new Error('AttributeConnection needs importer for resolving uris!!!');

        // just create the connection, connection not yet installed!!!
        var con = new AttributeConnection(
            null, literal.sourceAttrName, null, literal.targetMethodName, literal);

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
            if (!this.sourceObj) { throw new Error("Restoring AttributeConnection, but lost its source."); }
            this.connect();
        } catch(e) {
            dbgOn(true);
            console.error('AttributeConnection>>onrestore: Cannot restore ' + this + '\n' + e);
        }
    },
});

Object.extend(lively.bindings, {

    documentation: 'connect parameters: source, sourceProp, target, targetProp, spec\n'
                 + 'spec can be: {\n'
                 + '  removeAfterUpdate: Boolean,\n'
                 + '  forceAttributeConnection: Boolean,\n'
                 + '  converter: Function,\n'
                 + '  updater: Function,\n'
                 + '  varMapping: Object\n'
                 + '}',

    connect: function connect(sourceObj, attrName, targetObj, targetMethodName, specOrConverter) {
        // 1: determine what kind of connection to create. Default is
        //    AttributeConnection but source.connections/
        //    source.getConnectionPoints can specify different settings
        var connectionPoints = (sourceObj.getConnectionPoints && sourceObj.getConnectionPoints())
                            || (sourceObj.connections),
            connectionPoint = connectionPoints && connectionPoints[attrName],
            klass = (connectionPoint && connectionPoint.map && lively.morphic && lively.morphic.GeometryConnection)
                 || (connectionPoint && connectionPoint.connectionClassType && lively.Class.forName(connectionPoint.connectionClassType))
                 || AttributeConnection,
            spec;

        // 2: connection settings: converter/updater/...
        if (Object.isFunction(specOrConverter)) {
            console.warn('Directly passing a converter function to connect() '
                         + 'is deprecated! Use spec object instead!');
            spec = {converter: specOrConverter};
        } else {
            spec = specOrConverter;
        }

        // 3: does a similar connection exist? Yes: update it with new specs,
        //    no: create new connection
        var connection = new klass(sourceObj, attrName, targetObj, targetMethodName, spec),
            existing = connection.getExistingConnection();
        if (existing) {
            existing.resetSpec();
            existing.init(sourceObj, attrName, targetObj, targetMethodName, spec);
            return existing;
        }
        var result = connection.connect();

        // 4: notify source object if it has a #onConnect method
        if (Object.isFunction(sourceObj.onConnect)) {
            sourceObj.onConnect(attrName, targetObj, targetMethodName)
        }

        // 5: If wanted updated the connection right now
        if (connectionPoint && connectionPoint.updateOnConnect) {
            connection.update(sourceObj[attrName]);
        }
        return result;
    },

    disconnect: function(sourceObj, attrName, targetObj, targetMethodName) {
        if (!sourceObj.attributeConnections) return;

        sourceObj.attributeConnections.clone().forEach(function(con) {
            if (con.getSourceAttrName() == attrName
            &&  con.getTargetObj() === targetObj
            &&  con.getTargetMethodName() == targetMethodName) con.disconnect(); });

        if (typeof sourceObj['onDisconnect'] == 'function') {
            sourceObj.onDisconnect(attrName, targetObj, targetMethodName);
        };
    },

    disconnectAll: function(sourceObj) {
        while (sourceObj.attributeConnections && sourceObj.attributeConnections.length > 0) {
            sourceObj.attributeConnections[0].disconnect();
        }
    },

    once: function(sourceObj, attrName, targetObj, targetMethodName, spec) {
        spec = spec || {};
        spec.removeAfterUpdate = true;
        return lively.bindings.connect(sourceObj, attrName, targetObj, targetMethodName, spec);
    },

    signal: function(sourceObj, attrName, newVal) {
        var connections = sourceObj.attributeConnections;
        if (!connections) return;
        var oldVal = sourceObj[attrName];
        for (var i = 0, len = connections.length; i < len; i++) {
            var c = connections[i];
            if (c.getSourceAttrName() == attrName) c.update(newVal, oldVal);
        }
    },

    callWhenNotNull: function(sourceObj, sourceProp, targetObj, targetSelector) {
        // ensure that sourceObj[sourceProp] is not null, then run targetObj[targetProp]()
        if (sourceObj[sourceProp] != null) {
            targetObj[targetSelector](sourceObj[sourceProp]);
        } else {
            lively.bindings.connect(
                sourceObj, sourceProp, targetObj, targetSelector,
                {removeAfterUpdate: true});
        }
    },

    callWhenPathNotNull: function(source, path, target, targetProp) {
        var helper = {
            key: path.pop(),
            whenDefined: function(context) {
                lively.bindings.callWhenNotNull(context, this.key, target, targetProp)
            }
        }

        while (path.length > 0) {
            helper = {
                key: path.pop(),
                next: helper,
                whenDefined: function(context) {
                    lively.bindings.callWhenNotNull(context, this.key, this.next, 'whenDefined')
                }
            }
        }

        helper.whenDefined(source);
    },

    noUpdate: function(noUpdateSpec, func) {
        var globalNoUpdate = false, result;
        if (!func && Object.isFunction(noUpdateSpec)) {
            func = noUpdateSpec; globalNoUpdate = true; }
        if (globalNoUpdate) { // rather a hack for now
            var proto = lively.bindings.AttributeConnection.prototype;
            if (!proto.isActive) proto.isActive = 0;
            proto.isActive++;
            try {
                result = func();
            } finally {
                proto.isActive--;
                if (proto.isActive <= 0) proto.isActive;
            }
        } else {
            var obj = noUpdateSpec.sourceObj,
                attr = noUpdateSpec.sourceAttribute,
                targetObj = noUpdateSpec.targetObj,
                targetAttr = noUpdateSpec.targetAttribute,
                filter = targetObj && targetAttr ?
                    function(ea) { return ea.getSourceAttrName() === attr
                                       && targetObj === ea.getTargetObj()
                                       && targetAttr === ea.getTargetMethodName(); }:
                    function(ea) { return ea.getSourceAttrName() === attr; },
                conns = obj.attributeConnections.select(filter);
            conns.invoke('activate');
            try {
                result = func();
            } finally {
                conns.invoke('deactivate');
            }
        }
        return result;
    },

    // moving classes into Namespace
    AttributeConnection: AttributeConnection

});

Object.extend(Global, {
    connect: lively.bindings.connect,
    disconnect: lively.bindings.disconnect,
    disconnectAll: lively.bindings.disconnectAll,
    signal: lively.bindings.signal,
    updateAttributeConnection: lively.bindings.signal
});

}); // end of module
