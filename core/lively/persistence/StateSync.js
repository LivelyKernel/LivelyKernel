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
        }, function(error, curV) {
            cb && cb(error, self.child((length - 1).toString()), curV);
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

Object.extend(lively.persistence.StateSync.Handle, {
});

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
                    callback: function(error) {
                        if (error) getCb(merged)
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
            throw new Error("Can not drop callback that is not there.")
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
            thenDo(msg.error, msg.data)
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
            throw new Error("Can not drop callback that is not there.")
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
        // alert("We got a new value for " + changedPath + ": " + value)
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

// Although there is the ability to have more than one synchronizationHandle, for the time being we assume there is exactly one, and the DB morph should be refactored so that that assumption is true
Trait('lively.persistence.StateSync.SynchronizedMorphMixin', 
'morphic', {
    findAndSetUniqueName: function() {
        // copies of the morph should keep the original name
        return
    },
    copy: function(stringify) {
        var copy = this.constructor.prototype.copy.call(this, stringify);
        if (!stringify) {
            delete copy.synchronizationHandles;
            delete copy.noSave;
            delete copy.synchronizationGet;
            delete copy.changeTime;
            delete copy.form;
            copy.setName(this.getName());
        }
        return copy;
    },
    onOwnerChanged: function(newOwner) {
        this.constructor.prototype.onOwnerChanged.call(this, newOwner)
        if (!this.synchronizationHandles) return
        if (newOwner == null || this.world() == null) {
            // removed and should therefore stop synchronizing
            this.synchronizationHandles.forEach(function(handle) {
                if (this.synchronizationGet)
                    try {
                        handle.drop(this.synchronizationGet)
                        this.form.handle.drop(this.form.cb);
                    } catch(e){
                        debugger;
                        if (e.message !== "Can not drop callback that is not there.") throw e;
                    }
            }, this);
        } else {
            // (re-)added and should therefore start getting updates again
            var aMorph = this;
            this.synchronizationGet = this.synchronizationGet || (function(error, val) {
                if (val !== undefined) aMorph.mergeWithModelData(val)
            });
            this.synchronizationHandles.forEach(function(handle) {
                handle.get(this.synchronizationGet)
            }, this);
            this.form.handle.get(this.form.cb);
        }
    },
}, 'model Synchronization', {
    save: function(value, source, connection) {
        if (this.noSave) return;
        this.changeTime = Date.now();
        var model = this.asModel();
        this.synchronizationHandles &&
        this.synchronizationHandles.forEach(function(handle) {
            handle.overwriteWith(model, function(error, val) {  }, this.synchronizationGet)
        })
    },
    mergeWithModelData: function merge(someValue) {
        this.noSave = true;
        if (this.changeTime && this.changeTime > someValue.changeTime)
            return alertOK("Change ignored due to never changes in this world.");
        this.recursivelyWalk({
            text: function(functions, values) {
                if (values.string && this.textString !== values.string) {
                    this.textString = this.savedTextString = values.string;
                }
            },
            base: function(functions, values) {
                if (!Object.isObject(values)) return
                this.submorphs.forEach(function(morph) {
                    if (morph.name) {
                        // only named morphs are candidates for fields
                        if (morph.mergeWithModelData && values[morph.name])
                            morph.mergeWithModelData(values[morph.name])
                        else functions.walk.call(morph, functions, values[morph.name])
                    }
                });
            },
        }, someValue)
        this.noSave = false;
    },
    asModel: function() {
        var obj = this.recursivelyWalk({
            text: function() { 
                return {string: this.textString}; }, 
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
        obj.changeTime = this.changeTime || 0;
        return obj
    },
    recursivelyWalk: function(functions) {
        functions.walk = functions.walk || arguments.callee;
        // text case (duck typing)
        if (functions.text && (this.hasOwnProperty("textString") || this.__lookupGetter__("textString")))
            return functions.text.apply(this, arguments);

        // base case
        return functions.base.apply(this, arguments);
    },
}, 'form synchronization', {
    saveForm: function() {
        if (!this.form || this.synchronizationHandles.length < 1) return alert("No form to save, or no place to save it to.")
        // the copy neither has synchronization handles, nor injected behavior
        var copy = this.copy(false),
            self = this,
            trait = Trait("lively.persistence.StateSync.SynchronizedMorphMixin"),
            confirmed = true, register = false;
        
        var newFormJSON = lively.persistence.Serializer.serialize(copy);

        // now update all other versions of this form
        this.form.handle.set(function(old, newV, thenDo) {
            if (self.form.json !== "" && confirm("There seem to have been changes to the form elsewhere. Are you sure you want to overwrite those changes?")) {
                self.form.json = old;
                thenDo(newV);
            } else {
                confirmed = false
            }
        }, function(error, v) {
            if (confirmed)
                self.form.json = v;
        }, newFormJSON, this.form.json, this.form.cb)
    },
    // addMorph: function(aMorph, other) {
    //     var result = this.constructor.prototype.addMorph.call(this, aMorph, other);
    //     if (aMorph.owner == this && !aMorph.isPlaceholder) this.saveForm();
    //     return result;
    // },
})

Object.addScript(Trait("lively.persistence.StateSync.SynchronizedMorphMixin"), 
function connectSavingProperties(anObject, options) {
    // if there is another implementation of save, don't connect to it, rely on the user to do the connecting.
    if ((options && options.forceConnecting) || anObject.hasOwnProperty("save")) return;
    anObject.recursivelyWalk({
        text: function(functions, syncMorph) {
            connect(this, this.isCodeEditor ? "savedTextString" : "textString", 
                    syncMorph, "save", {
                updater: function($upd, value) {
                    this.sourceObj.changeTime = Date.now();
                    if (typeof this.targetObj[this.targetMethodName] == "function")
                        $upd(value, this.sourceObj, this);
                }});
        }, 
        base: function(functions, syncMorph) {
            this.submorphs.forEach(function(morph) {
                if (morph.name)
                    if (morph.connectTo)
                        morph.connectTo(syncMorph, "save", {
                            updater: function($upd, value) {
                                this.sourceObj.changeTime = Date.now();
                                if (typeof this.targetObj[this.targetMethodName] == "function")
                                    $upd(value, this.sourceObj, this);
                        }});
                    else functions.walk.call(morph, functions, syncMorph)
            });
        },}, anObject)
})
Object.addScript(Trait("lively.persistence.StateSync.SynchronizedMorphMixin"), 
function openMorphFor(modelPath, rootHandle, noMorphCb) {
    var path = lively.PropertyPath(modelPath),
        name = path.parts()[path.parts().length - 2],
        trait = this;
    
    var formHandle = rootHandle.child(path).parent().child(".form");
    // FIXME: a hack to get the stored value exactly once
    formHandle.set(function(formJSON, _, __) {
        if (formJSON === "" || formJSON === undefined) return noMorphCb(modelPath);
        var part = lively.persistence.Serializer.deserialize(formJSON),
            handle = rootHandle.child(modelPath);
        part.setName(name);
        trait.mixInto(part, handle, false);
        part.setPosition(pt(0, 0))
        part.openInHand();
    }, Functions.Empty)
});

Object.addScript(Trait("lively.persistence.StateSync.SynchronizedMorphMixin"), 
function mixInto(aMorph, morphHandle, saveForm) {
    if (!aMorph.name) 
        throw new Error("Any morph being synchronized has to have a name.");
    if (!morphHandle)
        throw new Error("Can not synchronize Morph whithout knowing where it is synchronized.");
    var formHandle = (morphHandle.isRoot()
        ? morphHandle.child(aMorph.name)
        : morphHandle.parent())
            .child(".form");

    // 1 apply the mixin
    this.mixin().applyTo(aMorph);
    this.connectSavingProperties(aMorph);
    
    aMorph.form = {
        json: "", 
        cb: this.formUpdate.bind(this, aMorph),
        handle: formHandle};
    aMorph.synchronizationHandles = aMorph.synchronizationHandle || [];

    // 2 ensure there is a handle
    var thenDoFirst = function(err, handle) {
        if (err) throw new Error("Synchronization failed: " + err);
        
        if (!aMorph.synchronizationHandles.include(handle))
            aMorph.synchronizationHandles.push(handle);
        
        // 3 synchronize it
        if (aMorph.owner)
            aMorph.onOwnerChanged(aMorph.owner);
        
        // 4 save the form
        if (saveForm) aMorph.saveForm && aMorph.saveForm();

    };
    if (morphHandle.isRoot())
        morphHandle.child(aMorph.name).push(aMorph.asModel(), thenDoFirst);
    else
        thenDoFirst(null, morphHandle)
    
});

Object.addScript(Trait("lively.persistence.StateSync.SynchronizedMorphMixin"), 
function formUpdate(me, error, value) {
    if (error) return alert(error);
    if (value === me.form.json) return;
    if (value === undefined) return; //throw new Error("Can not deserialize " + value);
    if (me.synchronizationHandles.length < 1)
        throw new Error("It makes no sense to update the form of something which is not synchronized.");
    var newMe = lively.persistence.Serializer.deserialize(value);
    newMe.setName(me.getName());
    newMe.synchronizationHandles = me.synchronizationHandles;
    this.mixInto(newMe, me.synchronizationHandles[0], false);
    newMe.form.json = value;
    if (me.owner) {
        newMe.setPosition(me.getPosition());
        me.owner.addMorph(newMe, me);
        newMe.setPosition(me.getPosition());
        me.remove();
    }
    // me.setPosition(me.getPosition().addXY(newMe.getExtent().x, 0));
});

}) // end of module
