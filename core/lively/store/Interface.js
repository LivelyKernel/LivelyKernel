module('lively.store.Interface').requires().toRun(function() {

Object.extend(lively.store, {
    createDB: function(name) {
        return new lively.store.DB(name);
    }
});

Object.subclass('lively.store.DB',
'initializing', {
    initialize: function(name) {
        this.stored = {}
    }
},
'accessing', {
    set: function(key, value) {
        this.stored[key] = value;
    },

    get: function(key) {
        return this.stored[key];
    }
});

}); // end of module