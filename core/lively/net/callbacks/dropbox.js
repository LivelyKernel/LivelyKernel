function onAuthCallback() {
    var authInfo = getAuthInfoFromUrl();
    var token = authInfo["access_token"],
        uuid = authInfo["state"];
    var expiry = parseInt(authInfo["expires_in"] || (48 * 60 * 60));
    setCookie(token, expiry);
    window.opener.lively.net.Dropbox.onAuthenticated(window.uuid, token, uuid, window);
}
function getAuthInfoFromUrl() {
  if (window.location.hash) {
    var authResponse = window.location.hash.substring(1);
    var authInfo = JSON.parse(
      '{"' + authResponse.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function(key, value) { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
  }
  else {
    alert("failed to receive auth token");
  }
}

function setCookie(token, expiresInSeconds) {
  var expiration = new Date();
  expiration.setTime(expiration.getTime() + expiresInSeconds * 1000);
  var cookie = "dropboxauth=" + token +"; path=/; expires=" + expiration.toUTCString();

  if (document.location.protocol.toLowerCase() == "https:") {
    cookie = cookie + ";secure";
  }

  document.cookie = cookie;
}
