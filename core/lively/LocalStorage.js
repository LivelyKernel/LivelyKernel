module('lively.LocalStorage').requires().toRun(function() {

 ///////////////////////////////////////////////////////////////////////////////
 // Lively Helper - lively.LocalStorage
 ///////////////////////////////////////////////////////////////////////////////

lively.LocalStorage = {
    isAvailable: function() { return Global.localStorage != undefined },
    get: function(propName) {
        if (!this.isAvailable) return null;
        return localStorage['lively' + propName];
    },
    set: function(propName, value) {
        if (!this.isAvailable) return null;
        return localStorage['lively' + propName] = value;
    }
}

}); // end of module