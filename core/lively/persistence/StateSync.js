module('lively.persistence.StateSync').requires('lively.persistence.Sync').toRun(function() {

Object.subclass('lively.persistence.StateSync.Handle',
/* class comment
 * A Handle is an accessor to a node in the tree a key-value database spanns. It provides 
 * direct access to its value, but also children. It knows about it's parent, if there is one.
 * 
 * Design decision made but unsure:
 *     create intermediate steps when browsing a whole path - yes,
 *         because that relieves us of book keeping when creating subsequent children, and 
 *         updating their parents, with minimal costs
 * Design Decision or Implementation pending/:
 *     How to abort a merge? -> throw "up"
 */
'settings', {
    path: lively.PropertyPath("")
},
'initializing', {
    initialize: function(store, path, parent) {
        this._parent = parent || undefined;
        this._path = lively.PropertyPath(path || this.path);
        this._children = {};
    }
},
'accessing', {

    get: function(thenDo) {
        // get the value in the database, and call thenDo with it
        // also call on every update change
        // return thenDo!!
        throw dbgOn(new Error('To be implemented from subclass'));
    },

    set: function(mergeFn, thenDo, newValue, oldValue, theCbToIgnore) {
        // looses the previous value
        // mergeFn: function(oldValue, newValue, thenDo: function(mergedValue))
        // don't call thenDo, when you want to abort the change...
        // if thenDo is called more than once, a new set process is started, which most likely will lead to calling mergeFn, if the oldValue is different from the currently saved value.
        // theCbToIgnore is an optional parameter. It is a callback which should be registered on this handle, and will not be called once the change is broadcasted back. This parameter offers a way to associate getting and setting functionality.
        throw dbgOn(new Error('To be implemented from subclass'));
    },

    update: function(values, mergeFn, thenDo, cbToIgnore) {
        // if values is a string or number or date, loose the previous value,
        // otherwise merge with current values
        this.set(function(oldVal, newVal, cb) {
            try { var keys = Object.keys(values); }
            catch (er) { var keys = false }
            mergeFn( keys ? keys.inject({}, function(last, key) { 
                    last[key] = oldVal && oldVal[key];
                    return last
                }) : oldVal, values, function(merged) {
                    if (merged === undefined) return; // has to return an object, in order to merge
                    if ( ['number', 'string'].include(typeof merged) ) cb(merged);
                    else cb(Object.merge([oldVal, merged]))
                })
        }, thenDo, undefined, undefined, cbToIgnore)
    },
    
    push: function(value, cb) {
        var length,
            self = this;
        this.update({length: 0, 0: value}, function(oldV, newV, cb) {
            length = ((oldV && oldV.length)  || 0) + 1;
            var updated = {length: length};
            updated[updated.length - 1] = value;
            cb(updated);
        }, function(err, curV) {
            cb && cb(err, self.child((length - 1).toString()), curV);
        })
    },

    drop: function(thenDo) {
        throw dbgOn(new Error('To be implemented from subclass'));
    },
},
'tree', {
    parent: function() { return this._parent },
    // check whether those are valid? make it a thenDo-function?
    child: function(path) {
        if (typeof path !== 'string') {
            if (!(path.include && path.split) && !path.normalizePath) 
                throw new Error("Unexpected argument: Neither behaves like a string, nor like a lively.PropertyPath");
            path = path.normalizePath ? path.normalizePath() : path;
        }
        if (path === "") return this
        if (path in this._children) {return this._children[path]}
        else {
            return !path.include('.') ? this._children[path] = new this.constructor(this._store, path, this) : path.split(".").reduce(function(parent, segment) {
                return parent.child(segment)
            }, this) 
        }
    },
    // children?
},
'accessing derived', {
    overwriteWith: function(value, thenDo, cbToIgnore) {
        this.set(function(oldV, newV, cb) { cb(newV) }, thenDo || function() {}, value, undefined, cbToIgnore);
    },
    fullPath: function() {
        if (this.isRoot()) return this._path
        else return this.parent().fullPath().concat(this._path)
    },
    // remove?
    
},
'testing', {
    isRoot: function() {
        return this._parent === undefined;
    },
    hasCachedChild: function(path) {
        return !!this._children[path];
    },
    isHandleForSameStoreAs: function(aHandle) {
        return aHandle._store && aHandle._store === this._store
    },
},
'debugging', {
    toString: function() {
        return 'Handle(to ' + this._path + ')'
    }
})

lively.persistence.StateSync.Handle.subclass('lively.persistence.StateSync.StoreHandle',
'initializing', {
    initialize: function($super, store, path, parent) {
        this._store = store;
        $super(store, path, parent);
        this._ignoreCbs = []
    }
},
'accessing', {
    get: function(thenDo) {
        // get the value in the database, and call thenDo with it
        // also call on every update change
        this._store.get(this.fullPath(), function(path, value) {
            thenDo(null, value)
        })
        if (!this._callbacks) {
            this._store.addSubscriber(this);
            this._callbacks = [thenDo]
        } else {
            this._callbacks.push(thenDo)
        }
        return thenDo
    },

    set: function(mergeFn, thenDo, newValue, oldValue, cbToIgnore) {
        // looses the previous value
        // only supports part of the interface in that merging has to be synchonous
        var path = this.fullPath(),
            store = this._store,
            ignoreCbs = this._ignoreCbs,
            storeCb = function(oldV, merged) {
                store.set(path, merged, {
                    precondition: {type: 'equality', value: oldV}, 
                    callback: function(err) {
                        if (err) getCb(merged)
                        else {
                            if (cbToIgnore) ignoreCbs.push({value: merged, cb: cbToIgnore})
                            thenDo(null, merged)
                        }
                },})
            },
            getCb = function(merged) {
                store.get(path, function(p, v) {
                    mergeFn(v, merged, storeCb.bind(this, v))})
            };
        if (oldValue === undefined || newValue === undefined) getCb(newValue)
        else storeCb(oldValue, newValue)
    },

    drop: function(thenDo) {
        if (!thenDo) return
        if (!this._callbacks) {
            // create error types?
            throw new Error("")
        } else {
            var cbs = this._callbacks;
            this._callbacks = cbs.reject(function(ea) { return ea === thenDo });
            if (this._callbacks.length == 0) {
                this._store.removeSubscriber(this);
                this._callbacks = undefined;
                return 0 < cbs.length
            }
            return this._callbacks.length < cbs.length
        }
    },
},
'accessing derived', {
    onValueChanged: function(value, path) {
        // Problem: if one of the callbacks changes value, calls the other ones with the old value
        // Second problem: callbacks are unordered??
        if (!! this.fullPath().relativePathTo(path) ) {
            var self = this;
            self._store.get(self.fullPath(), function(path, value) {
                self._callbacks.filter(function(ea) {
            var ignoreCb = this._ignoreCbs.detect(function(ignore) { 
                return ignore.cb === ea && Objects.equal(ignore.value, value)});
            if (ignoreCb !== undefined)
                this._ignoreCbs = this._ignoreCbs.without(ignoreCb);
            return ignoreCb === undefined
        }, self).invoke("call", undefined, null, value);
            })
        }
    },
},
'debugging', {
    toString: function() {
        try {
            return 'StoreHandle(' + Objects.inspect({path: this._path})
             + ', ' + Objects.inspect(this._store) + ')';
        } catch(e) {
            return 'StoreHandle(' + this._path + ')'
        }
    }
});

lively.persistence.StateSync.Handle.subclass('lively.persistence.StateSync.L2LHandle',
'initializing', {
    initialize: function($super, _, path, parent) {
        $super(undefined, path, parent);
        if (!path || path == "" || path._parts == [] || !parent){
            // This is a root handle. Inform the session handler.
            this.constructor.ensureCallback(this);
        }
        this._ignoreCbs = []
    }
},
'accessing', {

    get: function(thenDo) {
        // get the value in the database, and call thenDo with it
        // also call on every update change
        
        if (!this._callbacks) {
            // this._store.addSubscriber(this);
            this._callbacks = [thenDo]
        } else {
            this._callbacks.push(thenDo)
        }
        var sess = lively.net.SessionTracker.getSession();
        // TODO?: in case we dont have a session, should we try anything else?
        if (!sess) return alert("Session lost. Getting aborted.")
        sess.sendTo(sess.trackerId, 'syncGet', this.fullPath().toString(), function(msg) {
            thenDo(msg.err, msg.data)
        })
        return thenDo
    },

    set: function(mergeFn, thenDo, newV, oldV, cbToIgnore) {
        // looses the previous value
        var sess = lively.net.SessionTracker.getSession(),
            path = this.fullPath().toString(),
            self = this;
        
        function send(newValue, oldValue) {
            sess.sendTo(sess.trackerId, 'syncSet', {path: path, newValue: newValue, oldValue: oldValue}, function(msg) {
                var currentValue = msg.data.value
                if (!msg.data.successful){
                    mergeFn(currentValue, newValue, function(merged) { send(merged, currentValue)})
                } else {
                    if (cbToIgnore) self._ignoreCbs.push({value: currentValue, cb: cbToIgnore})
                    thenDo(null, currentValue)
                }
            })
        }
        if (!sess) alert("Connection not available. Setting aborted.")
        else send(newV, oldV);
    },

    drop: function(thenDo) {
        if (!thenDo) return
        if (!this._callbacks) {
            // create error types?
            throw new Error("")
        } else {
            var cbs = this._callbacks;
            this._callbacks = cbs.reject(function(ea) { return ea === thenDo });
            // if (this._callbacks.length == 0) {
            //     this._store.removeSubscriber(this);
            // }
            return this._callbacks.length < cbs.length
        }
    },
    propagateChange: function(path, value) {
        this._callbacks && this._callbacks.filter(function(ea) {
            var ignoreCb = this._ignoreCbs.detect(function(ignore) { 
                return ignore.cb === ea && Objects.equal(ignore.value, value)});
            if (ignoreCb !== undefined)
                this._ignoreCbs = this._ignoreCbs.without(ignoreCb);
            return ignoreCb === undefined
        }, this).invoke("call", undefined, null, value)
        if (path.isRoot())
            return
            // should also inform all cached children?
        var next = path.slice(0,1);
        if (this.hasCachedChild(next)) {
            this.child(next).propagateChange(path.slice(1), next.get(value))
        }
    },
},
'testing', {
    isHandleForSameStoreAs: function(aHandle) {
        // so far, all L2L Handles point to the same location on the same server
        return aHandle.constructor === this.constructor
    },
},
'debugging', {
    toString: function() {
        return 'L2LHandle(to ' + this._path + ')'
    }
});
Object.extend(lively.persistence.StateSync.L2LHandle, {
    ensureCallback: function(handle) {
        if (!lively.net.SessionTracker.defaultActions.syncValueChanged){
            this.registerL2LAction()
        }
        this.rootHandles.push(handle);
    },
    informHandles: function(changedPath, valuePath, value) {
        // path = lively.PropertyPath(path);
        this.rootHandles.forEach(function(ea) {
            debugger;
            ea.child(valuePath).propagateChange(lively.PropertyPath(changedPath), value);
        })
    },
    registerL2LAction: function() {
        var self = this;
        lively.net.SessionTracker.registerActions({
            syncValueChanged: function(msg, session) {
                // lively.persistence.StateSync.L2LHandle.informHandles
                self.informHandles(msg.data.changedPath, msg.data.valuePath, msg.data.value);
            },
        })
    },
    root: function() {
        return (this.rootHandles && this.rootHandles[0]) || new lively.persistence.StateSync.L2LHandle()
    },
    rootHandles: [],
    reset: function() {
        this.rootHandles = [];
    },
})

Trait('lively.persistence.StateSync.SynchronizedMorphMixin', 
'morphic', {
    findAndSetUniqueName: function() {
        // copies of the morph should keep the original name
        return
    },
    copy: function(stringify) {
        var copy = this.constructor.prototype.copy.call(this, stringify);
        if (!stringify) copy.synchronizationHandles = [];
        return copy
    },
    remove: function() {
        this.constructor.prototype.remove.call(this)
        this.synchronizationHandles &&
        this.synchronizationHandles.forEach(function(handle) {
            if (this.synchronizationGet)
                handle.drop(this.synchronizationGet)
        }, this)
    },
    onDropOn: function(aNewOwner) {
        this.constructor.prototype.onDropOn.call(this, aNewOwner);
        var aMorph = this;
        this.synchronizationHandles &&
        this.synchronizationHandles.forEach(function(handle) {
            this.synchronizationGet = this.synchronizationGet || (function(err, val) {
                if (val !== undefined) aMorph.mergeWithModelData(val)
            });
            handle.get(this.synchronizationGet)
        }, this)
    },
}, 'model Synchronization', {
    save: function(value, source, connection) {
        alertOK("empty save: " + value);
    },
    mergeWithModelData: function merge(someValue) {
        this.recursivelyWalk({
            text: function(functions, values) {
                if (values.string && values.timestamp && this.changeTime < values.timestamp) {
                    this.textString = this.savedTextString = values.string;
                    this.changeTime = values.timestamp;
                }
            },
            base: function(functions, values) {
                if (!Object.isObject(values)) return
                this.submorphs.forEach(function(morph) {
                    if (morph.name) {
                        // only named morphs are candidates for fields
                        if (morph.mergeWithModelData && values[morph.name])
                            morph.mergeWithModelData(values[morph.name])
                        else merge.call(morph, values[morph.name])
                    }
                });
            },
        }, someValue)
    },
    asModel: function() {
        var obj = this.recursivelyWalk({
            text: function() { 
                return {timestamp: this.changeTime || 0, string: this.textString}; }, 
            base: function(functions) {
                var obj = {};
                this.submorphs.forEach(function(morph) {
                    if (morph.getName()) {
                        // only named morphs are candidates for fields
                        if (morph.getModelData) obj[morph.name] = morph.getModelData()
                        else obj[morph.name] = functions.walk.call(morph, functions)
                    }
                });
                return obj;
            },
        })
        obj.shortString = this.toString();
        return obj
    },
    recursivelyWalk: function(functions) {
        // the general strukture here stops recursion whenever there is a match, 
        // i.e. submorphs of textmorphs a.o. are not synchronized
        functions.walk = functions.walk || arguments.callee;
        // text case (duck typing)
        if (functions.text && this.hasOwnProperty("textString") || this.__lookupGetter__("textString"))
            return functions.text.apply(this, arguments);

        // base case
        return functions.base.apply(this, arguments);
    },
})

Object.addScript(Trait("lively.persistence.StateSync.SynchronizedMorphMixin"), function connectSavingProperties(anObject, options) {
    anObject.recursivelyWalk({
        text: function(functions, syncMorph) {
            connect(this, this.isCodeEditor ? "savedTextString" : "textString", 
                    syncMorph, "save", {
                updater: function($upd, value) {
                    this.sourceObj.changeTime = Date.now();
                    $upd(value, this.sourceObj, this);
                }});
        }, 
        base: function(functions, syncMorph) {
            this.submorphs.forEach(function(morph) {
                if (morph.name)
                    functions.walk.call(morph, functions, syncMorph)
            });
        },}, anObject)
})

}) // end of module
