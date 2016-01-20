module('apis.Github').requires('lively.Network', 'lively.net.SessionTracker').toRun(function() {

// apis.Github.doRequest("/", {auth: token}, (err, answer) => { show(answer); })
// {
//   authorizations_url: "https://api.github.com/authorizations",
//   code_search_url: "https://api.github.com/search/code?q={query}{&page,per_page,sort,order}",
//   current_user_authorizations_html_url: "https://github.com/settings/connections/applications{/client_id}",
//   current_user_repositories_url: "https://api.github.com/user/repos{?type,page,per_page,sort}",
//   current_user_url: "https://api.github.com/user",
//   emails_url: "https://api.github.com/user/emails",
//   emojis_url: "https://api.github.com/emojis",
//   events_url: "https://api.github.com/events",
//   feeds_url: "https://api.github.com/feeds",
//   followers_url: "https://api.github.com/user/followers",
//   following_url: "https://api.github.com/user/following{/target}",
//   gists_url: "https://api.github.com/gists{/gist_id}",
//   hub_url: "https://api.github.com/hub",
//   issue_search_url: "https://api.github.com/search/issues?q={query}{&page,per_page,sort,order}",
//   issues_url: "https://api.github.com/issues",
//   keys_url: "https://api.github.com/user/keys",
//   notifications_url: "https://api.github.com/notifications",
//   organization_repositories_url: "https://api.github.com/orgs/{org}/repos{?type,page,per_page,sort}",
//   organization_url: "https://api.github.com/orgs/{org}",
//   public_gists_url: "https://api.github.com/gists/public",
//   rate_limit_url: "https://api.github.com/rate_limit",
//   repository_search_url: "https://api.github.com/search/repositories?q={query}{&page,per_page,sort,order}",
//   repository_url: "https://api.github.com/repos/{owner}/{repo}",
//   starred_gists_url: "https://api.github.com/gists/starred",
//   starred_url: "https://api.github.com/user/starred{/owner}{/repo}",
//   team_url: "https://api.github.com/teams",
//   user_organizations_url: "https://api.github.com/user/orgs",
//   user_repositories_url: "https://api.github.com/users/{user}/repos{?type,page,per_page,sort}",
//   user_search_url: "https://api.github.com/search/users?q={query}{&page,per_page,sort,order}",
//   user_url: "https://api.github.com/users/{user}"
// }

Object.extend(lively.net.SessionTracker.defaultActions, {

  githubOauthResponse: function(msg, session) {
    lively.bindings.signal(apis.Github, 'oauthResponse', msg.data);
  }
});

Object.extend(apis.Github, {

  createIssue: function(repoName, title, body, options, thenDo) {
    if (typeof options === "function") {
      thenDo = options;
      options = null;
    }

    options = options || {};
    var issue = {"title": title, "body": body};
    if (options.labels) issue.labels = options.labels
    if (options.assignee) issue.assignee = options.assignee
    
    lively.lang.fun.composeAsync(
      n => apis.Github.requestGithubAccess(['public_repo'], n),
      (auth, n) =>
        apis.Github.doRequest(
          `/repos/${repoName}/issues`,
          lively.lang.obj.merge(options, {data: issue, method: "POST", auth: auth}), n)
    )(thenDo);
  },

  getAllIssues: function(repoName, options, thenDo) {
    // Usage:
    // getAllIssues("LivelyKernel/LivelyKernel", (err, issues, limit) => { inspect(issues); })
    
    if (typeof options === "function") {
      thenDo = options;
      options = null;
    }

    options = options || {};

    var url = new URL(`https://api.github.com/repos/${repoName}/issues`);
    getIssuePage(1, [], thenDo);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function getIssuePage(page, results, thenDo) {
      apis.Github.doRequest(
        url.pathname,
        lively.lang.obj.merge(options, {page: page}),
        (err, result) => {
          if (err) return thenDo(err);
          if (page >= result.lastPage) return thenDo(null, results.concat(result.data), result.limit);
          getIssuePage(page + 1, results.concat(result.data), thenDo);
        })
    }
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

    if (options.auth && options.auth.access_token) {
      req.setRequestHeaders({
        "Authorization": "token " + options.auth.access_token
      });
    }

    var method = (options.method || "GET").toLowerCase(),
        args = [options.data].compact();

    req[method].apply(req, args).withJSONWhenDone((json, status) => {
      var links = (lively.PropertyPath("responseHeaders.link").get(req) || "").split(",")
        .map(ea => {
          if (!ea) return null;
          var linkParts = ea.split(";").invoke("trim");
          return {
            url: new URL(linkParts[0].replace(/^<|>$/g, "")),
            rel: linkParts[1].match(/rel="([^"]+)"/)[1]
          }
        }).compact();

      var lastLink = links.detect(ea => ea.rel === "last"),
          lastPage = lastLink && Number(lastLink.url.getQuery().page);

      thenDo(status.isSuccess() ? null : status, {
        responseHeaders: req.responseHeaders,
        links: links,
        lastPage: lastPage || 1,
        limit: req.responseHeaders && {
          limit: Number(req.responseHeaders["x-ratelimit-limit"]),
          remaining: Number(req.responseHeaders["x-ratelimit-remaining"]),
          reset: Number(req.responseHeaders["x-ratelimit-reset"])
        },
        data: json
      });
    });
  },
  
  requestGithubAccess: function(scopes, thenDo) {
    if (typeof scopes === "function") {
      thenDo = scopes;
      scopes = [];
    }

    // Uses the OAuth webflow, see https://developer.github.com/v3/oauth/#web-application-flow
    lively.lang.fun.composeAsync(
      withGithubClientId,
      withGithubTempCodeDo,
      requestGithubOAuthToken
    )(thenDo)
  
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-    
  
    function withGithubClientId(thenDo) {
      URL.nodejsBase.withFilename("GithubOAuth/clientId")
        .asWebResource().beAsync().get().whenDone((id, status) =>
          thenDo(status.isSuccess() ? null: new Error(String(status) + "\n" + id), id));
    }
    
    function requestGithubOAuthToken(tempCode, thenDo) {
      var s = lively.net.SessionTracker.getSession();
      if (!s || !s.isConnected()) return thenDo(new Error("lively-2-lively connection required"));
    
      var url = URL.nodejsBase.withFilename("GithubOAuth/oauth/access_token").withQuery({
        code: tempCode,
        state: s ? s.sessionId : "no session"
      });
      url.asWebResource().beAsync().post()
        .withJSONWhenDone((json, status) => thenDo(status.isSuccess() ? null : status, json));
    }
  
    function withGithubTempCodeDo(clientId, thenDo) {
      // create popup for Github, this will trigger the Github login.  The url we
      // pass to Github has the sessionid of our l2l connection asstate parameter.
    
      var s = lively.net.SessionTracker.getSession();
      if (!s || !s.isConnected()) return thenDo(new Error("lively-2-lively connection required"));
    
      var url = new URL("https://github.com/login/oauth/authorize").withQuery({
        client_id: clientId,
        state: s ? s.sessionId : "no session",
        scope: scopes.join(",")
      });
      
      
    var popupWidth = 500,
        popupHeight = 650,
        pos = $world.windowBounds().center(),
        left = pos.x - popupWidth/2,
        top = pos.y - popupHeight/2,
        win = window.open(String(url), "_blank", `chrome=yes, modal=yes, toolbar=yes, scrollbars=yes, resizable=yes, centerscreen=yes, top=${top}, left=${left}, width=${popupWidth}, height=${popupHeight}`);

    
      waitForGithubCall((err, data) => thenDo && thenDo(err, data && data.code));
    }
  
    function waitForGithubCall(thenDo) {
      // Github will hit our subserver on /nodejs/GithubOAuth/oauth/callback with
      // the access code and provided state (session id).  From the subserver
      // handler we send the code to our Lively world via l2l using the state parameter
      var timeout = 30 * 1000/*secs*/,
          data = undefined;
    
      var con = lively.bindings.once(apis.Github, 'oauthResponse', function() { data = this; }, "call");
    
      lively.lang.fun.waitFor(timeout, () => !!data, function(err) {
        con.disconnect();
        if (err) {
          if (err.message === "timeout") err = new Error("Timeout logging in to Github");
        }
        if (data && data.error) err = new Error(data.error);
        thenDo && thenDo(err, data);
      });
    }
  
  }
});

}) // end of module
