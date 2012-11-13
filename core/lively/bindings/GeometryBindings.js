module('lively.bindings.GeometryBindings').requires('cop.Layers', 'lively.morphic.Core', 'lively.bindings.Core', 'lively.morphic.TextCore', 'lively.morphic.Widgets').toRun(function() {

AttributeConnection.subclass('lively.morphic.GeometryConnection',
'dependents', {
    addDependConnection: function(c) {
        c.dependedBy = this;
        if (!this.dependendConnections) this.dependendConnections = [];
        this.dependendConnections.pushIfNotIncluded(c);
    },

    removeDependConnection: function(c) {
        c.disconnect();
        if (!this.dependendConnections) return;
        this.dependendConnections.remove(c);
        if (this.dependendConnections.length === 0) delete this.dependendConnections;
    },

    clone: function($super) {
        var con = $super();
        if (this.dependendConnections) {
            con.dependendConnections = this.dependendConnections.clone();
        }
        return con;
    }
},
'connecting', {
    ensureExistence: function() {
        // duplication with $super
        var existing = this.getExistingConnection();
        if (existing !== this) {
            // when existing == null just add new connection
            // when existing === this then connect was called twice or we are
            //    in deserialization. Just do nothing then.
            existing && existing.disconnect();
            this.addAttributeConnection();
        }
    },

    connect: function() {
        this.ensureExistence();
        var connectionSpec = Object.mergePropertyInHierarchy(
                this.sourceObj, 'connections')[this.sourceAttrName],
            path = connectionSpec.map.split("."),
            newSourceAttr = path.pop(),
            newSourceObj = this.sourceObj;

        // resolve the path by walking the attributes
        if (!newSourceAttr) throw new Error(this.constructor.type
                                           + ' cannot connect from '
                                           + this.sourceAttrName);
        path.forEach(function(ea) {
            newSourceObj = newSourceObj[ea];
            if (!newSourceObj) throw new Error(this.constructor.type
                                              + ' cannot walk path '
                                              + ea + ' for ' + this);
        })

        var c = lively.bindings.connect(
            newSourceObj, newSourceAttr, this.targetObj, this.targetMethodName, this.getSpec());
        this.addDependConnection(c);

        lively.bindings.connect(this, 'converterString', c, 'setConverter');
        lively.bindings.connect(this, 'updaterString', c, 'setUpdater');
        lively.bindings.connect(this, 'varMapping', c, 'varMapping');

        return this;
    },

    disconnect: function($super) {
        $super();
        if (!this.dependendConnections) return;
        var self = this;
        this.dependendConnections.forEach(function(ea) {
            self.removeDependConnection(ea);
        })
    }
});


lively.morphic.GeometryConnection.subclass('lively.morphic.OwnersConnection',
'accessing', {
    withAllOwnersDo: function(startMorph, func) {
        if (!startMorph) return;
        ([startMorph]).concat(startMorph.ownerChain().without(startMorph.world())).forEach(func);
    }
},
'updating', {
    signalOwnersChanged: function() {
        this.update(this.sourceObj.ownerChain());
    },

    updateOwners: function(oldAndNewOwnerPair) {
        var self = this,
            oldOwner = oldAndNewOwnerPair[1],
            newOwner = oldAndNewOwnerPair[0];

        if (oldOwner === newOwner) return;

        this.withAllOwnersDo(oldOwner, function(ea) {
            self.removeDependConnectionFrom(ea);
        });

        this.withAllOwnersDo(newOwner, function(ea) {
            self.addDependConnectionsTo(ea);
        });

        this.signalOwnersChanged();
    }

},
'connecting', {

    addDependConnectionsTo: function(morph) {
        this.addDependConnection(
            lively.bindings.connect(morph, 'owner', this, 'updateOwners', {
                converter: function(newOwner, oldOwner) { return [newOwner, oldOwner]; }}));
    },

    removeDependConnectionFrom: function(morph) {
        if (!morph.attributeConnections) return;
        var self = this;
        morph.attributeConnections.forEach(function(ea) {
            if (ea.dependedBy === self) self.removeDependConnection(ea);
        });
    },

    connect: function() {
        this.ensureExistence();
        var self = this;
        this.withAllOwnersDo(this.sourceObj, function(ea) {
            self.addDependConnectionsTo(ea);
        });
        return this;
    }

});

lively.morphic.OwnersConnection.subclass('lively.morphic.GeometryTransformConnection',
'connecting', {

    signalOwnersChanged: function() {},

    signalTransformationChanged: function() {
        var trans = this.sourceObj.getGlobalTransform()
        if (String(trans) == String(this.oldTransform)) return;
        this.update(trans, this.oldTransform);
        this.oldTransform = trans;
    },

    addDependConnectionsTo: function($super, morph) {
        $super(morph);
        this.addDependConnection(
            lively.bindings.connect(morph, '_Position', this, 'signalTransformationChanged'));
        this.addDependConnection(
            lively.bindings.connect(morph, '_Scale', this, 'signalTransformationChanged'));
        this.addDependConnection(
            lively.bindings.connect(morph, '_Rotation', this, 'signalTransformationChanged'));
    }

});

lively.morphic.Morph.addMethods(
'bindings', {
    connections: {
        owners: {
            connectionClassType: 'lively.morphic.OwnersConnection'
        },
        name: {},
        position: { map: '_Position'},
        rotation: { map: '_Rotation'},
        scale: { map: '_Scale'},
        setScale: {},

        borderWidth: { map: 'shape._BorderWidth'},
        borderColor: { map: 'shape._BorderColor'},

        fill: { map: 'shape._Fill'},

        extent: { map: 'shape._Extent'},

        globalTransform: {
            connectionClassType: 'lively.morphic.GeometryTransformConnection'
        }
    }
});

lively.morphic.Text.addMethods(
'bindings', {
    connections: {
        textString: {},
        savedTextString: {}
    }
});

lively.morphic.Button.addMethods(
'bindings', {
    connections: {
        fire: {}
    }
});

Object.extend(lively.bindings, {
    basicConnect: lively.bindings.connect,
    connect: function(sourceObj, attrName, targetObj, targetMethodName, specOrConverter) {
        var proceed = this.basicConnect.bind(this, sourceObj, attrName,
                                             targetObj, targetMethodName,
                                             specOrConverter);

        if (!sourceObj.connections) return proceed();

        var connectionPoint = (sourceObj.getConnectionPoints && sourceObj.getConnectionPoints()[attrName]) || sourceObj.connections[attrName];
        if (!connectionPoint) return proceed();
        var klass = (connectionPoint.map && lively.morphic.GeometryConnection)
                 || (connectionPoint.connectionClassType && Class.forName(connectionPoint.connectionClassType))
                 || AttributeConnection;
        var connection = new klass(sourceObj, attrName,
                                   targetObj, targetMethodName,
                                   specOrConverter).connect();
        if (connectionPoint.updateOnConnect) {
            connection.update(sourceObj[attrName]);
        }
        return connection;
    }
});

// connect is not late bound, so we have to reinitialize it
Object.extend(Global, {
    connect: lively.bindings.connect.bind(lively.bindings)
});

}) // end of module
