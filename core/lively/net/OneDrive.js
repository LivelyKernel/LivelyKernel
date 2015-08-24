module('lively.net.OneDrive').requires('lively.net.CloudStorage').toRun(function(thisModule) {
Object.extend(thisModule, {
    onAuthenticated: function(uuid, token, authWindow) {
      // odauth calls our onAuthenticated method to give us the user's auth token.
      // in this demo app we just use this as the method to drive the page logic
      var req = lively.net.CloudStorage.removePendingRequest(uuid);
      if (token) {
        if (authWindow) {
          authWindow.close();
        }
        var odurl = "https://api.onedrive.com/v1.0/drive/root" + req.path.replace(/\/$/, ""),
            odquery = "?access_token=" + token;
        lively.net.CloudStorage.sendConnectedAjaxRequest(odurl, odquery, req, req.ajax);
      } else {
        alert("Error signing in");
      }
    },
    
    create: function(path, sync) {
        var url = new URL('onedrive://' + path)
        var name = url.filename().replace("/","")
        var parentPath = url.getDirectory().pathname
        return this._request({
            path: ":" + encodeURIComponent(parentPath) + ":" + encodeURIComponent("/children"),
            ajax: {
                method: 'POST',
                sync: sync,
                contentType: 'application/json',
                data: JSON.stringify({
                    "name": name,
                    "folder": { },
                    "@name.conflictBehavior": "fail"
                })
            }
        });
    },
    del: function(path, sync) {
        return this._request({
            path: ":" + encodeURIComponent(path),
            ajax: {
                method: 'DELETE',
                sync: sync
            }
        });
    },
    get: function(path, sync) {
        // should get an item's contents
        var req = { path: ":" + encodeURIComponent(path) + ":" }
        req.ajax = {
            sync: sync,
            success: function(data) {
                if (data) {
                    var downloadUrl = data['@content.downloadUrl'];
                    ws = new WebResource(downloadUrl);
                    ws.setSync(sync)
                    connect(ws, 'content', req, 'content');
                    connect(ws, 'status', req, 'status');
                    connect(ws, 'contentDocument', req, 'contentDocument');
                    connect(ws, 'subCollections', req, 'subCollections');
                    connect(ws, 'responseHeaders', req, 'responseHeaders');
                    connect(ws, 'streamContent', req, 'streamContent');
                    connect(ws, 'readystate', req, 'readystate');
                    ws.get();
                }
            }
        };
        return this._request(req);
    },
    getSubElements: function(path, sync) {
        // should get an item's sub folders and sub files
        var req = { path: ":" + path + ":" };
        req.ajax = {
            sync: sync,
            urlArgs: "&expand=thumbnails,children(expand=thumbnails(select=large,c200x150_Crop))",
            success: function(data) {
                if (data) {
                    var children = data.children || data.value,
                        subCollections = [],
                        subDocuments = [];
                    if (children && children.length > 0) {
                        children.each(function(item) {
                            if (item.folder) {
                                subCollections.push(new WebResource("onedrive://" + 
                                    encodeURIComponent(path) + "/" + encodeURIComponent(item.name) + "/"
                                ));
                            } else {
                                subDocuments.push(new WebResource("onedrive://" + 
                                    encodeURIComponent(path) + "/" + encodeURIComponent(item.name)
                                ));
                            }
                        });
                    }
                    if (req.status._fakeStatus) {
                        req.status.isSuccess = Functions.True;
                        req.status.isDone = Functions.True;
                    }
                    req.subCollections = subCollections;
                    req.subDocuments = subDocuments;
                   
                }
            }
        }
        return this._request(req);
    },
    head: function(path, sync) {
        return this._request({
            path: ":" + encodeURIComponent(path) + ":",
            ajax: { sync: sync }
        });
    },
    put: function(path, sync, content) {
        return this._request({
            path: ":" + encodeURIComponent(path) + ":" + encodeURIComponent("/content"),
            ajax: {
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
          var name = "odauth=";
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
            debugger
          var clientId = "00000000401374A5";
          var scopes = "onedrive.readwrite wl.signin";
          var redirectUri = new URL(thisModule.uri()).getDirectory().withFilename("callbacks/onedrive.html");
          var appInfo = {
            "clientId": clientId,
            "scopes": scopes,
            "redirectUri": redirectUri
          };
          return appInfo;
        }

        function challengeForAuth() {
          var appInfo = getAppInfo();
          var url =
            "https://login.live.com/oauth20_authorize.srf" +
            "?client_id=" + appInfo.clientId +
            "&scope=" + encodeURIComponent(appInfo.scopes) +
            "&response_type=token" +
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
