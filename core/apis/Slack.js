module('apis.Slack').requires('apis.OAuth', 'lively.Network', 'lively.net.SessionTracker').toRun(function() {

Object.extend(apis.Slack, {

  oauth: {
    providerName: "slack-cdglabs",
    providerLoginURL: "https://slack.com/oauth/authorize",
    scope: ["client"],
    query: {
      redirect_uri: "https://lively-web.org/nodejs/SlackServer/oauth/callback",
      team: "cdglabs"
    },
    subserverURL: "https://lively-web.org/nodejs/SlackServer/",
    l2lCallbackServiceSelector: "slackOauthResponse"
  },

  requestAccess: function(options, thenDo) {
    if (typeof options === "function") {
      thenDo = options;
      options = null;
    }
    return apis.OAuth.requestAccess(
      lively.lang.obj.merge(apis.Slack.oauth, options), thenDo);
  },

  doAuthenticatedRequest: function(urlOrPath, options, thenDo) {
    var scopes = options.scopes || [];

    lively.lang.fun.composeAsync(
      n => apis.Slack.requestAccess(scopes, n),
      (auth, n) => apis.Slack.doRequest(
        urlOrPath, lively.lang.obj.merge(options, {auth: auth}), n)
    )((err, payload) => {
      if (err && err.code && err.code() === 401) {
        // reset access token cache
        var user = $world.getCurrentUser();
        user.setAttributes(lively.lang.obj.merge(user.github, {auth: null}));
      }

      thenDo && thenDo(err, payload)
    });
  },
  
  doRequest: function doRequest(urlOrPath, options, thenDo) {
    // options = {auth: {access_token, scope, token_type}}

    options = options || {};

    var url;
    if (typeof urlOrPath === "string") {
      try {
        url = new URL("https://api.github.com").withPath(urlOrPath);
      } catch (e) { return thenDo(e); }
    } else {
      url = urlOrPath;
    }

    if (options.hasOwnProperty("page")) {
      url = url.withQuery(lively.lang.obj.merge(url.getQuery(), {page: options.page}));
    }

    var req = url.asWebResource().noProxy().beAsync();

    // auth
    var accessToken;
    if (options.auth && options.auth.access_token) {
      var accessToken = options.auth.access_token;
      req.setRequestHeaders({"Authorization": "token " + accessToken});
    }

    // cache? set etag!
    var cacheKey = (accessToken || "notauthenticated") + "-" + url,
        cached = options.cache && options.cache[cacheKey],
        etag = cached && cached.req && cached.req.responseHeaders.etag,
        updateCache = options.cache
          && (options.hasOwnProperty("updateCache") ? options.updateCache : true);
    etag && req.setRequestHeaders({"if-none-match": etag});

    // send the request
    var method = (options.method || "GET").toLowerCase(),
        args = [];
    if (options.data) {
      var data = typeof options.data === "string" ?
        options.data : JSON.stringify(options.data);
      args = [data];
    }

    req[method].apply(req, args).whenDone((content, status) => {
      if (status.code() >= 400) return thenDo(status, content);

      // cached?
      if (status.code() === 304) {
        cached.req = req;
        return thenDo(null, cached);
      }

      var json;
      try {
        json = JSON.parse(content)
      } catch (e) {
        return thenDo(new Error("Error parsing Github response:\n" + e + "\n" + content));
      }

      var payloadAndMetaData = {
        req: req,
        data: json,
        cache: options.cache,
        cacheKey: cacheKey
      };

      if (updateCache) options.cache[cacheKey] = payloadAndMetaData;

      thenDo(null, payloadAndMetaData);
    });
  }

});


}) // end of module
