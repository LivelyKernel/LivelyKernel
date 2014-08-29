lively.LocalStorage = {

    isAvailable: function() {
        try {
            return typeof localStorage !== 'undefined';
        } catch(e) {
            // SecurityError may happen if localStorage was disabled
            return false;
        }
    },

    get: function(propName) {
        if (!this.isAvailable()) return null;
        return localStorage.getItem('lively' + propName);
    },

    set: function(propName, value) {
        if (!this.isAvailable()) return null;
        return localStorage.setItem('lively' + propName, value);
    },

    remove: function(propName) {
        if (this.isAvailable())
            localStorage.removeItem('lively' + propName);
    },

    keys: function() {
        if (!this.isAvailable()) return [];
        // LocalStorage does not have a proper way to get all the items
        return Object.getOwnPropertyNames(localStorage).
            select(function(key) { return key.startsWith('lively'); }).
            map(function(key) { return key.substr(6); });
    }

}
