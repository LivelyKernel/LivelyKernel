module('apis.OAuth').requires('lively.Network').toRun(function() {

Object.extend(apis.OAuth, {

  getCachedAccess: function(scope, providerName) {
    var user = $world.getCurrentUser(),
        auth = lively.lookup(providerName + ".oauth", user);
    if (auth && auth.error) {
      return new Error(auth.error_description || auth.error);
    }
    if (auth && scope) {
      var userScope = auth.scope ? auth.scope.split(",") : [];
      return scope.withoutAll(userScope).length === 0 ? auth : null;
    }
    return auth;
  },

  requestAccess: function(options, thenDo) {
    // providerName like "github"
    // providerLoginURL like ""https://github.com/login/oauth/authorize"
    // subserverURL like ""http://lively-web.org/nodejs/GithubOAuth/""
    //   subserver should implement: GET clientId, POST oauth/access_token (proxying)
    // l2lCallbackServiceSelector like "githubOauthResponse" (for l2l service, callback -> subserver -> lively)

    options = lively.lang.obj.merge({
      providerName: null,
      providerLoginURL: null,
      subserverURL: null,
      l2lCallbackServiceSelector: null,
      timeout: 30 * 1000/*ms*/,
      scope: [],
      query: {},
      popupWidth: $world.windowBounds().extent().x*1/3,
      popupHeight: $world.windowBounds().extent().y*2/3,
      popupPos: $world.windowBounds().center()
    }, options);

    var scope = options.scope,
        providerName = options.providerName,
        providerLoginURL = options.providerLoginURL,
        subserverURL = options.subserverURL,
        l2lCallbackServiceSelector = options.l2lCallbackServiceSelector || providerName + "-oauthResponse";

    return new Promise((resolve, reject) => {

      var required = ["providerName","providerLoginURL","subserverURL"],
          missing = required.detect(ea => !(ea in options));

      if (missing) {
        var err = new Error("options field " + missing + " is required");
        (typeof thenDo === "function") && thenDo(err); reject(err); return;
      }
  
      // are we logged in yet?
      var auth = apis.OAuth.getCachedAccess(scope, providerName);
      if (auth && !(auth instanceof Error)) {
        (typeof thenDo === "function") && thenDo(null, auth); resolve(auth); return;
      }
  
      var inProgressKey = providerName + "-authRequestInProgress";
      subserverURL = new URL(subserverURL);
  
      if (apis.OAuth[inProgressKey]) { // for parallel requests
        lively.bindings.once(
          apis.OAuth, providerName + '-authRequestDone',
          {callback: result => {
            var err = result && result instanceof Error ? result : null;
            (typeof thenDo === "function") && thenDo(err, result);
            err ? reject(err) : resolve(result);
          }}, 'callback');
        return;
      }
  
      apis.OAuth[inProgressKey] = true;
  
      // Uses the OAuth webflow, like https://developer.github.com/v3/oauth/#web-application-flow
      lively.lang.fun.composeAsync(
        withClientId,
        withTempCodeDo,
        requestOAuthToken,
        addAuthToUser
      )((err, auth) => {
        apis.OAuth[inProgressKey] = false;
        lively.bindings.signal(apis.OAuth, providerName + '-authRequestDone', err || auth);
        (typeof thenDo === "function") && thenDo(err, auth);
      }).then(resolve, reject);
    });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function withClientId(thenDo) {
      subserverURL.withFilename("clientId")
        .asWebResource().beAsync().get().whenDone((id, status) =>
          thenDo(status.isSuccess() ? null: new Error(String(status) + "\n" + id), id));
    }

    function withTempCodeDo(clientId, thenDo) {
      // create popup, this will trigger the oauth provider login screen.  The url we
      // pass to the provider has the sessionid of our l2l connection as state parameter.

      var s = lively.net.SessionTracker.getSession();
      if (!s || !s.isConnected()) return thenDo(new Error("lively-2-lively connection required"));

      var url = new URL(providerLoginURL).withQuery(lively.lang.obj.merge({
        client_id: clientId,
        state: s ? s.sessionId : "no session",
        scope: scope.join(",")
      }, options.query));

      var popupWidth = options.popupWidth,
          popupHeight = options.popupHeight,
          pos = options.popupPos,
          left = pos.x - popupWidth/2,
          top = pos.y - popupHeight/2,
          win = window.open(String(url), "_blank", `chrome=yes, modal=yes, toolbar=yes, scrollbars=yes, resizable=yes, centerscreen=yes, top=${top}, left=${left}, width=${popupWidth}, height=${popupHeight}`);
      waitForCallback((err, data) => thenDo && thenDo(err, data && data.code));
    }

    function requestOAuthToken(tempCode, thenDo) {
      var s = lively.net.SessionTracker.getSession();
      if (!s || !s.isConnected()) return thenDo(new Error("lively-2-lively connection required"));

      var url = subserverURL.withFilename("oauth/access_token").withQuery({
        code: tempCode,
        state: s ? s.sessionId : "no session"
      }, options.query);

      url.asWebResource().setRequestHeaders({"Accept": "application/json"}).beAsync().post()
        .whenDone((content, status) => {
          var err;
          if (!status.isSuccess()) err = new Error(status);
          else {
            try {
              var json = JSON.parse(content);
            } catch (e) {
              err = new Error("Cannot parse " + providerName + " oauth response:\n" + (content||"nothing").slice(0,300))
            }
          }
          if (json && json.error) err = new Error(json.error_description || json.error);
          thenDo(err, json);
        });
    }

    function waitForCallback(thenDo) {
      // Github will hit our subserver on /nodejs/GithubOAuth/oauth/callback with
      // the access code and provided state (session id).  From the subserver
      // handler we send the code to our Lively world via l2l using the state parameter

      var service = {};
      service[l2lCallbackServiceSelector] = function(msg, session) {
        lively.bindings.signal(apis.OAuth, providerName + '-oauthCallback', msg.data);
      }
      Object.extend(lively.net.SessionTracker.defaultActions, service);

      var timeout = options.timeout,
          data = undefined,
          con = lively.bindings.once(apis.OAuth, providerName + '-oauthCallback', function() { data = this; }, "call");

      lively.lang.fun.waitFor(timeout, () => !!data, function(err) {
        con.disconnect();
        if (err) {
          if (err.message === "timeout") err = new Error("Timeout logging in to " + providerName);
        }
        if (data && data.error) err = new Error(data.error);
        thenDo && thenDo(err, data);
      });
    }

    function addAuthToUser(auth, n) {
      var user = $world.getCurrentUser();
      if (user) {
        var attrs = {};
        attrs[providerName] = lively.lang.obj.merge(user.getAttributes()[providerName], {oauth: auth});
        user.addAttributes(attrs);
      }
      n(null, auth);
    }

  }

});


}) // end of module
