module('lively.persistence.StateSync').requires('lively.persistence.Sync').toRun(function() {

Object.subclass('lively.persistence.StateSync.StoreHandle',
/* class comment
 * A Handle is an accessor to a node in the tree a key-value database spanns. It provides 
 * direct access to its value, but also children. It knows about it's parent, if there is one.
 * 
 * Design decision made but unsure:
 *     create intermediate steps when browsing a whole path - yes,
 *         because that relieves us of book keeping when creating subsequent children, and 
 *         updating their parents, with minimal costs
 * Design Decision pending:
 *     allow pushing (and on to the root node)?
 */
'settings', {
    path: lively.PropertyPath("")
},
'initializing', {
    initialize: function(store, path, parent) {
        this._store = store;
        this._parent = parent || undefined;
        this._path = lively.PropertyPath(path || '');
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
        this._store.getHandle("").commit({
            path: this.fullPath(), 
            transaction: function(oldVal) {
                return mergeFn(oldVal, newValue)
            }, callback: function(err, truthErr, currentVal) {
                thenDo(err, currentVal)
            },})
    },

    update: function(values, mergeFn, thenDo) {
        // if values is a string or number or date, loose the previous value,
        // otherwise merge with current values
        this._store.getHandle("").commit({path: this.fullPath(), transaction: function(oldVal) {
            try { var keys = Object.keys(values); }
            catch (er) { var keys = false }
            var newVal = mergeFn( keys ? keys.inject({}, function(last, key) { 
                    last[key] = oldVal[key];
                    return last
                }) : oldVal, values)
            if (!newVal) return; // has to return an object, in order to merge
            if ( ['number', 'string'].include(typeof newVal) ) return newVal;
            return Object.merge([oldVal, newVal])
        }, callback: function(err, truthErr, currentVal) {
            thenDo(err, currentVal)
        },})
    },
    
    push: function(value) {
        this.update(null, function(oldV, newV) {
            var updated = {length: currentValue.length + 1 || 1};
            updated[updated.length - 1] = value
            return updated
        })
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
                return false
            } else {
                return this._callbacks.length < cbs.length
            }
        }
    },
},
'tree', {
    parent: function() { return this._parent },
    // check whether those are valid? make it a thenDo-function?
    child: function(path) {
        return path.split(".").reduce(function(parent, segment) {
            return new parent.constructor(parent._store, segment, parent)
        }, this) },
    // children?
},
'accessing derived', {
    overwriteWith: function(value, thenDo) {
        this.set(function(oldV, newV) { return newV; }, thenDo || function() {}, value);
    },
    fullPath: function() {
        if (this.isRoot()) return this._path
        else return this.parent().fullPath().concat(this._path)
    },
    // remove?
    
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
'testing', {
    isRoot: function() {
        return this._parent === undefined;
    },
    isHandleForSameStoreAs: function(aHandle) {
        return aHandle._store && aHandle._store === this._store
    },
},
'debugging', {
    toString: function() {
        return 'ObjectHandle(' + Objects.inspect({path: this._path})
             + ', ' + Objects.inspect(this._store) + ')';
    }
});


}) // end of module
