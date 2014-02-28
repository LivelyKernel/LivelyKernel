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
        this._children = [];
    }
},
'accessing', {

    get: function(thenDo) {
        // get the value in the database, and call thenDo with it
        // also call on every update change
        // return thenDo!!
        throw dbgOn(new Error('To be implemented from subclass'));
    },

    set: function(mergeFn, thenDo, newValue, oldValue) {
        // looses the previous value
        // mergeFn: function(oldValue, newValue, thenDo: function(mergedValue))
        // don't call thenDo, when you want to abort the change...
        // if thenDo is called more than once, a new set process is started, which most likely will lead to calling mergeFn, if the oldValue is different from the currently saved value.
        throw dbgOn(new Error('To be implemented from subclass'));
    },

    update: function(values, mergeFn, thenDo) {
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
        }, thenDo)
    },
    
    push: function(value, cb) {
        var length,
            self = this;
        this.update({length: 0, 0: value}, function(oldV, newV) {
            length = ((oldV && oldV.length)  || 0) + 1
            var updated = {length: length};
            updated[updated.length - 1] = value
            return updated
        }, function(err, curV) {
            cb && cb(err, self.child((length - 1).toString()), curV)
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
    overwriteWith: function(value, thenDo) {
        this.set(function(oldV, newV, cb) { cb(newV) }, thenDo || function() {}, value);
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

    set: function(mergeFn, thenDo, newValue, oldValue) {
        // looses the previous value
        // only supports part of the interface in that merging has to be synchonous
        var path = this.fullPath(),
            store = this._store,
            storeCb = function(oldV, merged) {
                store.set(path, merged, {
                    precondition: {type: 'equality', value: oldV}, 
                    callback: function(err) {
                        if (err) getCb(merged)
                        else thenDo(null, merged)
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
        if (!! this._path.relativePathTo(path) ) {
            var self = this;
            self._store.get(self.fullPath(), function(path, value) {
                self._callbacks.invoke("call", undefined, null, value);
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

    set: function(mergeFn, thenDo, newV, oldV) {
        // looses the previous value
        var sess = lively.net.SessionTracker.getSession(),
            path = this.fullPath().toString();
        
        function send(newValue, oldValue) {
            sess.sendTo(sess.trackerId, 'syncSet', {path: path, newValue: newValue, oldValue: oldValue}, function(msg) {
                var knownOldValue = msg.data.value
                if (!msg.data.successful){
                    mergeFn(knownOldValue, newValue, function(merged) { send(merged, knownOldValue)})
                } else {
                    thenDo(null, knownOldValue)
                }
            })
        }
        if (!sess) alert("Connection not available. Setting aborted.")
        else send(newV, oldV);
    },

    drop: function(thenDo) {
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
        this._callbacks && this._callbacks.invoke("call", undefined, null, value)
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

}) // end of module
