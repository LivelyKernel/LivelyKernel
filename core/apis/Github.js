module('apis.Github').requires('lively.Network', 'lively.net.SessionTracker').toRun(function() {

/*
usage

apis.Github.requestGithubAccess(['public_repo'], (err, token) => {
  err && show(String(err))
  show(token);
});

apis.Github.doRequest(
  "/user",
  {auth: token},
  (err, answer) => { show(err ? String(err) : answer); })

apis.Github.Issues.addCommentToIssue(
  "LivelyKernel/LivelyKernel",
  319,
  "Issues can be created via `apis.Github.createIssue(repoName, title, body, options, thenDo)`",
  (err, response) => { err && show(String(err)); show(response)})

var issue = {
  "title": "Create issues directly with the Github issue API",
  "body": "apis.Github implements Github oauth, use it for our issue pages",
  "assignee": "rksm",
  "labels": ["Github"]
}

apis.Github.doRequest(
  "/repos/LivelyKernel/LivelyKernel/issues",
  {data: issue, method: "POST", auth: token},
  (err, answer) => { err && show(String(err)); show(answer); })
*/

// apis.Github.doAuthenticatedRequest("/", {}, (err, answer) => { show(answer); })
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

  defaultScopes: ["public_repo"],

  getCachedGithubAccess: function(scopes) {
    var user = $world.getCurrentUser();
    var auth = lively.lookup("github.auth", user);
    if (auth && scopes) {
      var userScopes = auth.scope.split(",");
      if (scopes.withoutAll(userScopes).length === 0) return auth;
    }
    return auth;
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
        args = [];
    if (options.data) {
      var data = typeof options.data === "string" ?
        options.data : JSON.stringify(options.data);
      args = [data];
    }

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

  doAuthenticatedRequest: function(urlOrPath, options, thenDo) {
    var scopes = options.scopes || [];

    lively.lang.fun.composeAsync(
      n => apis.Github.requestGithubAccess(scopes, n),
      (auth, n) => apis.Github.doRequest(
        urlOrPath, lively.lang.obj.merge(options, {auth: auth}), n)
    )(thenDo);
  },


  requestGithubAccess: function(scopes, thenDo) {
    if (typeof scopes === "function") {
      thenDo = scopes;
      scopes = [];
    }

    // are we logged in yet?
    var auth = apis.Github.getCachedGithubAccess(scopes);
    if (auth) return thenDo(null, auth);

    // Uses the OAuth webflow, see https://developer.github.com/v3/oauth/#web-application-flow
    lively.lang.fun.composeAsync(
      withGithubClientId,
      withGithubTempCodeDo,
      requestGithubOAuthToken,
      addAuthToUser
    )(thenDo);

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

    function addAuthToUser(auth, n) {
      var user = $world.getCurrentUser();
      if (user) {
        user.addAttributes({github: lively.lang.obj.merge(user.getAttributes().github, {auth: auth})});
      }
      n(null, auth);
    }
  }
});

apis.Github.Issues = {

  createIssue: function(repoName, title, body, options, thenDo) {
    if (typeof options === "function") { thenDo = options; options = null; }
    options = options || {};

    var issue = {"title": title, "body": body};
    if (options.labels) issue.labels = options.labels
    if (options.assignee) issue.assignee = options.assignee

    apis.Github.doAuthenticatedRequest(
      `/repos/${repoName}/issues`,
      lively.lang.obj.merge(options, {scopes: apis.Github.defaultScopes, data: issue, method: "POST"}),
      thenDo);
  },

  getIssue: function(repoName, issueNo, options, thenDo) {
    if (typeof options === "function") { thenDo = options; options = null; }
    apis.Github.doRequest(
      `/repos/${repoName}/issues/${issueNo}`,
      lively.lang.obj.merge(options, {auth: apis.Github.getCachedGithubAccess()}),
      (err, payload) => thenDo && thenDo(err, payload && payload.data));
  },

  editIssue: function(repoName, issueNo, payload, options, thenDo) {
    // https://developer.github.com/v3/issues/#edit-an-issue
    if (typeof options === "function") { thenDo = options; options = null; }
    options = options || {};

    apis.Github.doAuthenticatedRequest(
      `/repos/${repoName}/issues/${issueNo}`,
      lively.lang.obj.merge(options, {scopes: apis.Github.defaultScopes, data: payload, method: "PATCH"}),
      thenDo);
  },

  addCommentToIssue: function(repoName, issueNumber, comment, options, thenDo) {
    if (typeof options === "function") { thenDo = options; options = null; }
    options = options || {};

    apis.Github.doAuthenticatedRequest(
      `/repos/${repoName}/issues/${issueNumber}/comments`,
      lively.lang.obj.merge(options, {scopes: apis.Github.defaultScopes, data: {body: comment}, method: "POST"}),
      thenDo);
  },

  getAllIssues: function(repoName, options, thenDo) {
    // Usage:
    // apis.Github.Issue.getAllIssues("LivelyKernel/LivelyKernel", (err, issues, limit) => { inspect(issues); })

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
        lively.lang.obj.merge(options, {auth: apis.Github.getCachedGithubAccess(), page: page}),
        (err, result) => {
          if (err) return thenDo(err);
          if (page >= result.lastPage) return thenDo(null, results.concat(result.data), result.limit);
          getIssuePage(page + 1, results.concat(result.data), thenDo);
        })
    }
  },

  getIssueComments: function(repoName, issueOrIssueNo, options, thenDo) {
    if (typeof options === "function") { thenDo = options; options = null; }
    options = options || {};

    var issue = typeof issueOrIssueNo === "number" ? null : issueOrIssueNo,
        no = issue ? issue.number : issueOrIssueNo,
        since = issue ? issue.created_at : new Date("01 October, 2007");

    apis.Github.doAuthenticatedRequest(
      `/repos/${repoName}/issues/${no}/comments?since=${since}`,
      lively.lang.obj.merge(options, {scopes: apis.Github.defaultScopes}),
      (err, result) => thenDo(err, result ? result.data : []));
  },

  ui: {

    printIssueTitle: function(issue) {
      return `#${issue.number} ${issue.title} (${issue.state}, ${new Date(issue.created_at).format("yy-mm-dd")}, ${issue.user.login})`;
    },

    printIssue: function(issue) {
      return `Issue: #${issue.number}
State: ${issue.state}
URL: ${issue.url}
Created: ${new Date(issue.created_at).format("yy-mm-dd HH:MM")} by ${issue.user.login}

${issue.body}`;
    },

    printIssueComment: function(comment) {
      return `[${comment.user.login} ${new Date(comment.created_at).format("yy-mm-dd")}]
${comment.body}`;
    },

    printIssueAndComments: function(issue, comments) {
      var divider = "\n\n-=-=-=-=-=-=-=-\n\n";
      return apis.Github.Issues.ui.printIssue(issue)
           + divider
           + comments.map(apis.Github.Issues.ui.printIssueComment)
             .join(divider)
    },

    repoOfIssue: function(issue) {
      var m = issue.url.match(/repos\/([^\/]+\/[^\/]+)\//);
      return m && m[1];
    },

    openIssueAndComments: function(editor, issue, comments, thenDo) {
      if (!editor) {
        editor = $world.addCodeEditor({
          lineWrapping: true,
          textMode: "text",
          content: "",
          title: "",
          extent: pt(600,500)
        });
        editor.getWindow().comeForward();
      }

      editor.addScript(function browseIssueOnGithub() {
        window.open(this.issue.html_url, "_blank");
      });

      editor.addScript(function codeEditorMenuItems() {
        return [
          ["browse issue on Github", () => this.browseIssueOnGithub()],
          ["add comment", () => this.interactivelyComment()],
          ["update", () => this.interactivelyUpdate()],
          {isMenuItem: true, isDivider: true}
        ].concat($super());
      });

      editor.addScript(function interactivelyComment() {
          var repo = apis.Github.Issues.ui.repoOfIssue(this.issue);
          lively.lang.fun.composeAsync(
            n => $world.editPrompt("Please add comment:",
              input => n(input.trim() ? null : "invalid input", input),
              {input: "...", historyId: "apis.Github.Issues.add-comment-editor"}),
            (comment, n) => apis.Github.Issues.addCommentToIssue(
              repo, this.issue.number, comment, n)
          )(err => err ?
            this.showError(err) :
            this.setStatusMessage("Comment uploaded", Color.green));
      });

      editor.addScript(function interactivelyUpdate() {
        this.setStatusMessage("Updating...");
        this.update(err => err ?
          this.showError(err) : this.setStatusMessage("Updated."));
      });

      editor.addScript(function onKeyDown(evt) {
        var keys = evt.getKeyString(), handled = true;
        switch (keys) {
          case 'Alt-G': this.interactivelyUpdate(); break;
          case 'Alt-C': this.interactivelyComment(); break;
          case 'Alt-B': this.browseIssueOnGithub(); break;
          default: handled = false;
        }
        if (handled) evt.stop();
        return handled;
      });

      editor.addScript(function showIssueAndComments(issue, comments) {
        this.issue = issue;
        this.issueComments = comments;
        var printed = apis.Github.Issues.ui.printIssueAndComments(issue, comments),
            title = apis.Github.Issues.ui.printIssueTitle(issue);
        this.setTextString(printed);
        this.getWindow() && this.getWindow().setTitle(title);
      });

      editor.addScript(function update(thenDo) {
        apis.Github.Issues.ui.openIssue(
              apis.Github.Issues.ui.repoOfIssue(this.issue),
              this.issue.number,
              {editor: this},
              err => thenDo && thenDo(err));
      });

      editor.getPartsBinMetaInfo().addRequiredModule("apis.Github");
      editor.showIssueAndComments(issue, comments);
      thenDo && thenDo(null, editor);
    },

    openIssue: function(repoName, issueOrIssueNo, options, thenDo) {
      if (typeof options === "function") { thenDo = options; options = null; }
      options = options || {};

      var issue = typeof issueOrIssueNo === "number" ? null : issueOrIssueNo;

      lively.lang.fun.composeAsync(
        n => issue ?
          n(null, issueOrIssueNo) :
          apis.Github.Issues.getIssue(repoName, issueOrIssueNo, options, n),
        (_issue, n) => {
          issue = _issue;
          if (!repoName) repoName = apis.Github.Issues.ui.repoOfIssue(issue);
          n(null, issue);
        },
        (issue, n) => apis.Github.Issues.getIssueComments(repoName, issue, n),
        (comments, n) => n(null, issue, comments),
        (issue, comments, n) => apis.Github.Issues.ui.openIssueAndComments(
          options.editor, issue, comments, n)
      )(thenDo);
    },

    showNarrower: function(issues, thenDo) {
      var n = lively.ide.tools.SelectionNarrowing.getNarrower({
          // name: "apis.Github.all-issues-list",
          spec: {
              prompt: 'headings: ',
              candidates: issues.map(i => ({
                isListItem: true,
                string: apis.Github.Issues.ui.printIssueTitle(i),
                value: i
              })),
              // keepInputOnReactivate: true,
              actions: [{
                  name: 'show issue',
                  exec: issue => apis.Github.Issues.ui.openIssue(null, issue)
              }]
          }
      });
      thenDo && thenDo(null, n);
    },

    browseIssues: function(repoName, thenDo) {
      lively.lang.fun.composeAsync(
        n => apis.Github.Issues.getAllIssues(repoName, {}, n),
        (issues, quota, n) => apis.Github.Issues.ui.showNarrower(issues, n)
      )(thenDo);
    }

  }
};

}) // end of module
