lively.LocalStorage = {
    isAvailable: function() { return typeof localStorage !== 'undefined' },
    get: function(propName) {
        if (!this.isAvailable()) return null;
        return localStorage['lively' + propName];
    },
    set: function(propName, value) {
        if (!this.isAvailable()) return null;
        return localStorage['lively' + propName] = value;
    }
}
