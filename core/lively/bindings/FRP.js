module('lively.bindings.FRP').requires('lively.bindings.FRPCore', 'lively.persistence.Serializer', 'lively.morphic').toRun(function() {

lively.morphic.Morph.addMethods({
    openFRPInspector: function() {
        var inspectorWindow = $world.openPartItem('FRPInspector', 'PartsBin/Tools');
        var inspector = inspectorWindow.get("FRPInspector");
        inspector.setTarget(this);
    },
    frpConnect: function(fromProp, targetName, targetProp) {
        if (!this.frpConnections) {
            this.frpConnections = {};
        }
        if (!this.frpConnections[fromProp]) {
            this.frpConnections[fromProp] = [];
        }
        var connections = this.frpConnections[fromProp];
        var hasIt = connections.detect(function(c) {
            return c.targetName === targetName && c.targetProp === targetProp;
        });
        if (!hasIt) {
            var c = new lively.bindings.FRP.FRPConnection().connectTo(targetName, targetProp);
            connections.push(c);
        }
    },
    frpDisconnect: function(fromProp, targetName, targetProp) {
        if (!this.frpConnections) {
            return;
        }
        if (!this.frpConnections[fromProp]) {
            return;
        }
        var connections = this.frpConnections[fromProp];
        var hasIt = connections.detect(function(c) {
            return c.targetName === targetName && c.targetProp === targetProp;
        });
        if (hasIt) {
            connections.remove(hasIt);
        }
    }
});

ObjectLinearizerPlugin.subclass('lively.bindings.FRP.EventStreamPlugin',
'interface', {
    serializeObj: function(obj) {
        if (!this.isEventStream(obj)) {
            return null;
        }
        return {
            isSerializedStream: true,
            type: obj.type,
            owner: obj.owner,
            currentValue: (obj.isContinuous ? obj.currentValue : undefined),
            isContinuous: obj.isContinuous,
            code: obj.code,
            streamName: obj.streamName
        };
    },
    deserializeObj: function(copy) {
        if (!copy || !copy.isSerializedStream) return null;
        return copy.type === "value" ?
            new lively.bindings.FRPCore.EventStream().value(copy.currentValue) :
            (copy.type === "userEvent" ?
                new lively.bindings.FRPCore.EventStream().userEvent()
                    : lively.bindings.FRPCore.EventStream.fromString(copy.code));
    },
    afterDeserializeObj: function (obj) {
        if (this.isEventStream(obj)) {
            if (obj.owner) {
                return obj.installTo(obj.owner, obj.streamName);
            }
            delete this.isSerializedStream;
        }
        return null;
    }
},
'private', {
    isEventStream: function(obj) {
        return obj instanceof lively.bindings.FRPCore.EventStream;
    }
});

if (lively.persistence.pluginsForLively.indexOf(lively.bindings.FRP.EventStreamPlugin) < 0) {
    lively.persistence.pluginsForLively.push(lively.bindings.FRP.EventStreamPlugin);
}

Object.subclass('lively.bindings.FRP.FRPConnection',
'connecting', {
    connectTo: function(targetName, targetProp) {
        this.targetName = targetName;
        this.targetProp = targetProp;
        return this;
    },
    update: function (newValue, srcObj, maybeTime) {
        var target = typeof this.targetName === "string" ? srcObj.get(this.targetName) : this.targetName;
        if (target) {
            var strm = target[this.targetProp];
            if (strm && this.isEventStream(strm)) {
                strm.frpSet(newValue, maybeTime);
            }
        }
    },
    isEventStream: function(v) {
        return v instanceof lively.bindings.FRPCore.EventStream;
    }
});

}) // end of module