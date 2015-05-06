module('lively.net.CloudStorage').requires().toRun(function(thisModule) {

Object.extend(thisModule, {
    pendingRequests: {},
    
    addPendingRequest: function(req) {
        var uuid = Strings.newUUID();
        thisModule.pendingRequests[uuid] = req;
        return uuid;
    },
    
    removePendingRequest: function(uuid) {
        var returnValue = thisModule.pendingRequests[uuid];
        delete thisModule.pendingRequests[uuid];
        return returnValue;
    },
    
    sendConnectedAjaxRequest: function (url, query, req, ajaxOptions) {
        var userSuccess = ajaxOptions.success,
            userError = ajaxOptions.error;
        ajaxOptions.url = url + query + (ajaxOptions.urlArgs || "");
        req.status = {
                _fakeStatus: true,
                isSuccess: Functions.False, isDone: Functions.False, isForbidden: Functions.False,
                code: function() { return req.statusCode }};
        ajaxOptions.success = function(data, textStatus, jqXHR) {
            req.statusCode = jqXHR.statusCode().status;
            if (req.status._fakeStatus) {
                req.status.isSuccess = Functions.True;
                req.status.isDone = Functions.True;
            }
            userSuccess && userSuccess(data, textStatus, jqXHR);
            if (req.status._fakeStatus) {
                req.status = req.status // fire event for all our listeners!
            }
        };
        ajaxOptions.error = function(jqXHR, textStatus, errorThrown) {
            userError && userError(jqXHR, textStatus, errorThrown);
            req.statusCode = jqXHR.statusCode().status;
            if (req.status._fakeStatus) {
                req.status.isForbidden = (jqXHR.statusCode() == 403 ? Functions.True : Functions.False);
            }
        };
        ajaxOptions.async = ajaxOptions.async || !ajaxOptions.sync;
        ajaxOptions.xhr = function () {
            var xhr = new window.XMLHttpRequest();
            xhr.addEventListener("progress", function (evt) {
                req.progressEvent = evt;
            }, false);
            // xhr.upload && xhr.upload.addEventListener("progress", function (evt) {
            //     req.progressEvent = evt;
            // }, false);
            return xhr;
        };
        jQuery.ajax(ajaxOptions);
    }
})

}) // end of module
