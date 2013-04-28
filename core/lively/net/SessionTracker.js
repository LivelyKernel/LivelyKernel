module('lively.net.SessionTracker').requires().toRun(function() {

Object.extend(lively.net.SessionTracker, {
    // basic networking
    baseURL: URL.create(Config.nodeJSURL + '/').withFilename('SessionTracker/'),
    getWebResource: function(subServiceName) {
        var url = this.baseURL;
        if (subServiceName) url = url.withFilename(subServiceName);
        return url.asWebResource();
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // test support. Since the session tracker has global state
    // we put it into a sandbox mode when running the tests
    useSandbox: function() {
        var webR = this.getWebResource('sandbox').beSync();
        webR.post(JSON.stringify({start: true}), 'application/json');
        lively.assert(webR.status.isSuccess(), 'Could not set lively.net.SessionTracker into sandbox mode?');
    },
    removeSandbox: function() {
        var webR = this.getWebResource('sandbox').beSync();
        webR.post(JSON.stringify({stop: true}), 'application/json');
        lively.assert(webR.status.isSuccess(), 'Could not release lively.net.SessionTracker sandbox mode?');
    }
});

}) // end of module