module('lively.net.Dropbox').requires('lively.net.CloudStorage').toRun(function(thisModule) {
Object.extend(thisModule, {
    onAuthenticated: function(uuid, token, state, authWindow) {
        // odauth calls our onAuthenticated method to give us the user's auth token.
        // in this demo app we just use this as the method to drive the page logic
        var req = lively.net.CloudStorage.removePendingRequest(uuid);
        if (state && state !== uuid) throw "Invalid state! CSRF!";
        if (token) {
        if (authWindow) {
          authWindow.close();
        }
        var odurl = "https://" + (req.subdomain || "api") + ".dropbox.com/1/" +
                    req.type + req.path.replace(/\/$/, ""),
            odquery = "?access_token=" + token,
            userSuccess = req.ajax.success;
        req.ajax.success = function (data, textStatus, jqXHR) {
            userSuccess && userSuccess(data, textStatus, jqXHR);
            if (!req.content) {
                req.content = jqXHR.responseText;
            }
        }
            lively.net.CloudStorage.sendConnectedAjaxRequest(odurl, odquery, req, req.ajax);
        } else {
            alert("Error signing in");
        }
    },

    create: function(path, sync) {
        return this._request({
            type: "fileops",
            path: "/create_folder",
            ajax: {
                method: 'POST',
                sync: sync,
                data: jQuery.param({root: 'dropbox', path: path})
            }
        });
    },
    del: function(path, sync) {
        return this._request({
            type: "fileops",
            path: "/delete",
            ajax: {
                method: 'POST',
                sync: sync,
                data: jQuery.param({root: 'dropbox', path: path})
            }
        });
    },
    get: function(path, sync) {
        return this._request({
            subdomain: 'api-content',
            type: 'files/auto',
            path: encodeURIComponent(path),
            ajax: { sync: sync }
        });
    },
    getSubElements: function(path, sync) {
        // should get an item's sub folders and sub files
        var req = {
            type: 'metadata/auto',
            path: encodeURIComponent(path)
        };
        req.ajax = {
            sync: sync,
            urlArgs: "&list=true",
            contentType: 'text/plain',
            error: function(jqXHR, textStatus, errorThrown) {
                // Strange...
                if (jqXHR.status >= 200 && jqXHR.status <= 299) {
                    var data = JSON.parse(jqXHR.responseText);
                    req.ajax.success(data, "OK", jqXHR);
                    delete req.status._fakeStatus;
                }
            },
            success: function(data) {
                if (data) {
                    var children = data.contents,
                        subCollections = [],
                        subDocuments = [];
                    if (children && children.length > 0) {
                        children.each(function(item) {
                            var name = item.path.replace(/\/$/, "").split("/").pop();
                            if (item.is_dir) {
                                subCollections.push(new WebResource("dropbox://" +
                                    path + "/" + encodeURIComponent(name) + "/"));
                            } else {
                                subDocuments.push(new WebResource("dropbox://" +
                                    path + "/" + encodeURIComponent(name)));
                            }
                        });
                    }
                    if (req.status._fakeStatus) {
                        req.status.isSuccess = Functions.True;
                        req.status.isDone = Functions.True;
                    }
                    req.subCollections = subCollections;
                    req.subDocuments = subDocuments;
                    if (req.status._fakeStatus) {
                        req.status = req.status // fire event for all our listeners!
                    }
                }
            }
        }
        return this._request(req);
    },
    head: function(path, sync) {
        return this._request({
            type: 'metadata/auto',
            path: encodeURIComponent(path),
            ajax: { sync: sync, urlArgs: "&list=false" }
        });
    },
    put: function(path, sync, content) {
        return this._request({
            subdomain: 'api-content',
            type: 'files_put/auto',
            path: encodeURIComponent(path),
            ajax: {
                urlArgs: "&overwrite=true&autorename=false",
                method: "PUT",
                sync: sync,
                data: content
            }
        });
    },
    post: function(path) { throw "Not implemented" },

    _request: function(req) {
        var uuid = lively.net.CloudStorage.addPendingRequest(req);
        odauth();
        return req;
        
        function odauth() {
          ensureHttps();
          var token = getTokenFromCookie();
          if (token) {
            thisModule.onAuthenticated(uuid, token);
          } else {
            challengeForAuth();
          }
        }

        function ensureHttps() {
          if (window.location.protocol != "https:") {
            window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
          }
        }
        
        function getTokenFromCookie() {
          var cookies = document.cookie
          var name = "dropboxauth=";
          var start = cookies.indexOf(name);
          if (start >= 0) {
            start += name.length;
            var end = cookies.indexOf(';', start);
            if (end < 0) {
              end = cookies.length;
            }
            else {
              var postCookie = cookies.substring(end);
            }
        
            var value = cookies.substring(start, end);
            return value;
          }
        
          return "";
        }
        
        function getAppInfo() {
          var clientId = "1774dvkirby4490";
          var redirectUri = new URL(thisModule.uri()).getDirectory().withFilename("callbacks/dropbox.html");
          var appInfo = {
            "clientId": clientId,
            "redirectUri": redirectUri
          };
          return appInfo;
        }

        function challengeForAuth() {
          var appInfo = getAppInfo();
          var url =
            "https://www.dropbox.com/1/oauth2/authorize" +
            "?client_id=" + appInfo.clientId +
            "&response_type=token" +
            "&state=" + uuid +
            "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);
          popup(url);
        }
        
        function popup(url) {
          var width = 525,
              height = 525,
              screenX = window.screenX,
              screenY = window.screenY,
              outerWidth = window.outerWidth,
              outerHeight = window.outerHeight;
        
          var left = screenX + Math.max(outerWidth - width, 0) / 2;
          var top = screenY + Math.max(outerHeight - height, 0) / 2;
        
          var features = [
                      "width=" + width,
                      "height=" + height,
                      "top=" + top,
                      "left=" + left,
                      "status=no",
                      "resizable=yes",
                      "toolbar=no",
                      "menubar=no",
                      "scrollbars=yes"];
          var popup = window.open(url, "oauth", features.join(","));
          if (!popup) {
            alert("failed to pop up auth window");
          }
          popup.uuid = lively.net.CloudStorage.addPendingRequest(req);
          popup.focus();
        }
    }
});
}) // end of module
