module('apis.Github').requires('apis.OAuth', 'lively.Network', 'lively.net.SessionTracker').toRun(function() {

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

Object.extend(apis.Github, {

  oauth: {
    providerName: "github",
    providerLoginURL: "https://github.com/login/oauth/authorize",
    scope: ["public_repo"],
    subserverURL: "http://lively-web.org/nodejs/GithubOAuth/",
    l2lCallbackServiceSelector: "githubOauthResponse"
  },

  requestAccess: function(options, thenDo) {
    if (typeof options === "function") {
      thenDo = options;
      options = null;
    }
    return apis.OAuth.requestAccess(
      lively.lang.obj.merge(apis.Github.oauth, options), thenDo);
  },

  getLimitInfoOfReq: function(req) {
    // extract quota limit from req / webresource headers
    return req.responseHeaders ? {
      limit: Number(req.responseHeaders["x-ratelimit-limit"]),
      remaining: Number(req.responseHeaders["x-ratelimit-remaining"]),
      reset: Number(req.responseHeaders["x-ratelimit-reset"])
    } : null;
  },

  getPageInfoOfReq: function(req) {
    // extract header links from WebResource
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

    return {
      links: links,
      lastPage: lastPage || 1
    }
  },

  getPages: function(reqPath, options, thenDo) {
    // options: {cache: OBJECT},
    // see getAllIssues
    if (typeof options === "function") {
      thenDo = options;
      options = null;
    }
    options = lively.lang.obj.merge({cache: {}}, options);
    getPage(1, [], thenDo);
  
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  
    function getPage(page, results, thenDo) {
      apis.Github.doAuthenticatedRequest(reqPath,
        lively.lang.obj.merge(options, {page: page}),
        (err, result) => {
          if (err) return thenDo(err);
  
          // TO reduce the server load and makes things much more faster we
          // don't just rely on etag based cache responses from Github but use our
          // cache directly when the first page hasn't changed thus avoiding
          // requests for subsequent pages
  
          if (page === 1 && result.req.status.code() === 304 && options.cache) {
            var keyPattern = result.cacheKey.replace(/page=1.*/, "page="),
                cache = options.cache,
                cachedResult = Object.keys(cache)
                                .filter(k => k.startsWith(keyPattern))
                                .reduce((cachedResult, cacheKey) => cachedResult.concat(cache[cacheKey].data), []);
            return thenDo(null, cachedResult);
          }
  
          var pageInfo = apis.Github.getPageInfoOfReq(result.req)
          if (err) thenDo(err);
          else if (page >= pageInfo.lastPage) thenDo(null, results.concat(result.data));
          else getPage(page + 1, results.concat(result.data), thenDo);
        });
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
  },

  doAuthenticatedRequest: function(urlOrPath, options, thenDo) {
    var scopes = options.scopes || [];

    lively.lang.fun.composeAsync(
      n => apis.Github.requestAccess(scopes, n),
      (auth, n) => apis.Github.doRequest(
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

  css: {

    css: `@font-face {
	font-family: octicons-anchor;
	src: url(data:font/woff;charset=utf-8;base64,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) format('woff');
}

.github-markdown-morph {
	-ms-text-size-adjust: 100%;
	-webkit-text-size-adjust: 100%;
	color: #333;
	overflow: hidden;
	font-family: "Helvetica Neue", Helvetica, "Segoe UI", Arial, freesans, sans-serif;
	font-size: 16px;
	line-height: 1.6;
	word-wrap: break-word;
}

.github-markdown-morph a {
	background: transparent;
}

.github-markdown-morph a:active, .github-markdown-morph a:hover {
	outline: 0;
}

.github-markdown-morph strong {
	font-weight: bold;
}

.github-markdown-morph h1 {
	font-size: 2em;
	margin: 0.67em 0;
}

.github-markdown-morph img {
	border: 0;
}

.github-markdown-morph hr {
	-moz-box-sizing: content-box;
	box-sizing: content-box;
	height: 0;
}

.github-markdown-morph pre {
	overflow: auto;
}

.github-markdown-morph code, .github-markdown-morph kbd, .github-markdown-morph pre {
	font-family: monospace, monospace;
	font-size: 1em;
}

.github-markdown-morph input {
	margin: 0;
}

.github-markdown-morph html input[disabled] {
	cursor: default;
}

.github-markdown-morph input {
	line-height: normal;
}

.github-markdown-morph input[type="checkbox"] {
	-moz-box-sizing: border-box;
	box-sizing: border-box;
	padding: 0;
}

.github-markdown-morph table {
	border-collapse: collapse;
	border-spacing: 0;
}

.github-markdown-morph td, .github-markdown-morph th {
	padding: 0;
}

.github-markdown-morph * {
	-moz-box-sizing: border-box;
	box-sizing: border-box;
}

.github-markdown-morph input {
	font: 13px / 1.4 Helvetica arial freesans clean sans-serif "Segoe UI Emoji" "Segoe UI Symbol";
}

.github-markdown-morph a {
	color: #4183c4;
	text-decoration: none;
}

.github-markdown-morph a:hover, .github-markdown-morph a:focus, .github-markdown-morph a:active {
	text-decoration: underline;
}

.github-markdown-morph hr {
	height: 0;
	margin: 15px 0;
	overflow: hidden;
	background: transparent;
	border: 0;
	border-bottom: 1px solid #ddd;
}

.github-markdown-morph hr:before {
	display: table;
	content: "";
}

.github-markdown-morph hr:after {
	display: table;
	clear: both;
	content: "";
}

.github-markdown-morph h1, .github-markdown-morph h2, .github-markdown-morph h3, .github-markdown-morph h4, .github-markdown-morph h5, .github-markdown-morph h6 {
	margin-top: 15px;
	margin-bottom: 15px;
	line-height: 1.1;
}

.github-markdown-morph h1 {
	font-size: 30px;
}

.github-markdown-morph h2 {
	font-size: 21px;
}

.github-markdown-morph h3 {
	font-size: 16px;
}

.github-markdown-morph h4 {
	font-size: 14px;
}

.github-markdown-morph h5 {
	font-size: 12px;
}

.github-markdown-morph h6 {
	font-size: 11px;
}

.github-markdown-morph blockquote {
	margin: 0;
}

.github-markdown-morph ul, .github-markdown-morph ol {
	padding: 0;
	margin-top: 0;
	margin-bottom: 0;
}

.github-markdown-morph ol ol, .github-markdown-morph ul ol {
	list-style-type: lower-roman;
}

.github-markdown-morph ul ul ol, .github-markdown-morph ul ol ol, .github-markdown-morph ol ul ol, .github-markdown-morph ol ol ol {
	list-style-type: lower-alpha;
}

.github-markdown-morph dd {
	margin-left: 0;
}

.github-markdown-morph code {
	font: 12px Consolas "Liberation Mono" Menlo Courier monospace;
}

.github-markdown-morph pre {
	margin-top: 0;
	margin-bottom: 0;
	font: 12px Consolas "Liberation Mono" Menlo Courier monospace;
}

.github-markdown-morph kbd {
	background-color: #e7e7e7;
	background-image: -webkit-linear-gradient(#fefefe, #e7e7e7);
	background-image: linear-gradient(#fefefe, #e7e7e7);
	background-repeat: repeat-x;
	border-radius: 2px;
	border: 1px solid #cfcfcf;
	color: #000;
	padding: 3px 5px;
	line-height: 10px;
	font: 11px Consolas "Liberation Mono" Menlo Courier monospace;
	display: inline-block;
}

.github-markdown-morph>*:first-child {
	margin-top: 0 !important;
}

.github-markdown-morph>*:last-child {
	margin-bottom: 0 !important;
}

.github-markdown-morph .anchor {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	display: block;
	padding-right: 6px;
	padding-left: 30px;
	margin-left: -30px;
}

.github-markdown-morph .anchor:focus {
	outline: none;
}

.github-markdown-morph h1, .github-markdown-morph h2, .github-markdown-morph h3, .github-markdown-morph h4, .github-markdown-morph h5, .github-markdown-morph h6 {
	position: relative;
	margin-top: 1em;
	margin-bottom: 16px;
	font-weight: bold;
	line-height: 1.4;
}

.github-markdown-morph h1 .octicon-link, .github-markdown-morph h2 .octicon-link, .github-markdown-morph h3 .octicon-link, .github-markdown-morph h4 .octicon-link, .github-markdown-morph h5 .octicon-link, .github-markdown-morph h6 .octicon-link {
	display: none;
	color: #000;
	vertical-align: middle;
}

.github-markdown-morph h1:hover .anchor, .github-markdown-morph h2:hover .anchor, .github-markdown-morph h3:hover .anchor, .github-markdown-morph h4:hover .anchor, .github-markdown-morph h5:hover .anchor, .github-markdown-morph h6:hover .anchor {
	height: 1em;
	padding-left: 8px;
	margin-left: -30px;
	line-height: 1;
	text-decoration: none;
}

.github-markdown-morph h1:hover .anchor .octicon-link, .github-markdown-morph h2:hover .anchor .octicon-link, .github-markdown-morph h3:hover .anchor .octicon-link, .github-markdown-morph h4:hover .anchor .octicon-link, .github-markdown-morph h5:hover .anchor .octicon-link, .github-markdown-morph h6:hover .anchor .octicon-link {
	display: inline-block;
}

.github-markdown-morph h1 {
	padding-bottom: 0.3em;
	font-size: 2.25em;
	line-height: 1.2;
	border-bottom: 1px solid #eee;
}

.github-markdown-morph h2 {
	padding-bottom: 0.3em;
	font-size: 1.75em;
	line-height: 1.225;
	border-bottom: 1px solid #eee;
}

.github-markdown-morph h3 {
	font-size: 1.5em;
	line-height: 1.43;
}

.github-markdown-morph h4 {
	font-size: 1.25em;
}

.github-markdown-morph h5 {
	font-size: 1em;
}

.github-markdown-morph h6 {
	font-size: 1em;
	color: #777;
}

.github-markdown-morph p, .github-markdown-morph blockquote, .github-markdown-morph ul, .github-markdown-morph ol, .github-markdown-morph dl, .github-markdown-morph table, .github-markdown-morph pre {
	margin-top: 0;
	margin-bottom: 16px;
}

.github-markdown-morph hr {
	height: 4px;
	padding: 0;
	margin: 16px 0;
	background-color: #e7e7e7;
	border: 0 none;
}

.github-markdown-morph ul, .github-markdown-morph ol {
	padding-left: 2em;
}

.github-markdown-morph ul ul, .github-markdown-morph ul ol, .github-markdown-morph ol ol, .github-markdown-morph ol ul {
	margin-top: 0;
	margin-bottom: 0;
}

.github-markdown-morph li>p {
	margin-top: 16px;
}

.github-markdown-morph dl {
	padding: 0;
}

.github-markdown-morph dl dt {
	padding: 0;
	margin-top: 16px;
	font-size: 1em;
	font-style: italic;
	font-weight: bold;
}

.github-markdown-morph dl dd {
	padding: 0 16px;
	margin-bottom: 16px;
}

.github-markdown-morph blockquote {
	padding: 0 15px;
	color: #777;
	border-left: 4px solid #ddd;
}

.github-markdown-morph blockquote>:first-child {
	margin-top: 0;
}

.github-markdown-morph blockquote>:last-child {
	margin-bottom: 0;
}

.github-markdown-morph table {
	display: block;
	width: 100%;
	overflow: auto;
	word-break: normal;
	word-break: keep-all;
}

.github-markdown-morph table th {
	font-weight: bold;
}

.github-markdown-morph table th, .github-markdown-morph table td {
	padding: 6px 13px;
	border: 1px solid #ddd;
}

.github-markdown-morph table tr {
	background-color: #fff;
	border-top: 1px solid #ccc;
}

.github-markdown-morph table tr:nth-child(2n) {
	background-color: #f8f8f8;
}

.github-markdown-morph img {
	max-width: 100%;
	-moz-box-sizing: border-box;
	box-sizing: border-box;
}

.github-markdown-morph code {
	padding: 0;
	padding-top: 0.2em;
	padding-bottom: 0.2em;
	margin: 0;
	font-size: 85%;
	background-color: rgba(0,0,0,0.04);
	border-radius: 3px;
}

.github-markdown-morph code:before, .github-markdown-morph code:after {
	letter-spacing: -0.2em;
	content: " ";
}

.github-markdown-morph pre>code {
	padding: 0;
	margin: 0;
	font-size: 100%;
	word-break: normal;
	white-space: pre;
	background: transparent;
	border: 0;
}

.github-markdown-morph .highlight {
	margin-bottom: 16px;
}

.github-markdown-morph .highlight pre, .github-markdown-morph pre {
	padding: 16px;
	overflow: auto;
	font-size: 85%;
	line-height: 1.45;
	background-color: #f7f7f7;
	border-radius: 3px;
}

.github-markdown-morph .highlight pre {
	margin-bottom: 0;
	word-break: normal;
}

.github-markdown-morph pre {
	word-wrap: normal;
}

.github-markdown-morph pre code {
	display: inline;
	max-width: initial;
	padding: 0;
	margin: 0;
	overflow: initial;
	word-wrap: normal;
	background-color: transparent;
	border: 0;
}

.github-markdown-morph pre code:before, .github-markdown-morph pre code:after {
	content: normal;
}

.github-markdown-morph .highlight {
	background: #fff;
}

.github-markdown-morph .highlight .mf, .github-markdown-morph .highlight .mh, .github-markdown-morph .highlight .mi, .github-markdown-morph .highlight .mo, .github-markdown-morph .highlight .il, .github-markdown-morph .highlight .m {
	color: #945277;
}

.github-markdown-morph .highlight .s, .github-markdown-morph .highlight .sb, .github-markdown-morph .highlight .sc, .github-markdown-morph .highlight .sd, .github-markdown-morph .highlight .s2, .github-markdown-morph .highlight .se, .github-markdown-morph .highlight .sh, .github-markdown-morph .highlight .si, .github-markdown-morph .highlight .sx, .github-markdown-morph .highlight .s1 {
	color: #df5000;
}

.github-markdown-morph .highlight .kc, .github-markdown-morph .highlight .kd, .github-markdown-morph .highlight .kn, .github-markdown-morph .highlight .kp, .github-markdown-morph .highlight .kr, .github-markdown-morph .highlight .kt, .github-markdown-morph .highlight .k, .github-markdown-morph .highlight .o {
	font-weight: bold;
}

.github-markdown-morph .highlight .kt {
	color: #458;
}

.github-markdown-morph .highlight .c, .github-markdown-morph .highlight .cm, .github-markdown-morph .highlight .c1 {
	color: #998;
	font-style: italic;
}

.github-markdown-morph .highlight .cp, .github-markdown-morph .highlight .cs {
	color: #999;
	font-weight: bold;
}

.github-markdown-morph .highlight .cs {
	font-style: italic;
}

.github-markdown-morph .highlight .n {
	color: #333;
}

.github-markdown-morph .highlight .na, .github-markdown-morph .highlight .nv, .github-markdown-morph .highlight .vc, .github-markdown-morph .highlight .vg, .github-markdown-morph .highlight .vi {
	color: #008080;
}

.github-markdown-morph .highlight .nb {
	color: #0086B3;
}

.github-markdown-morph .highlight .nc {
	color: #458;
	font-weight: bold;
}

.github-markdown-morph .highlight .no {
	color: #094e99;
}

.github-markdown-morph .highlight .ni {
	color: #800080;
}

.github-markdown-morph .highlight .ne {
	color: #990000;
	font-weight: bold;
}

.github-markdown-morph .highlight .nf {
	color: #945277;
	font-weight: bold;
}

.github-markdown-morph .highlight .nn {
	color: #555;
}

.github-markdown-morph .highlight .nt {
	color: #000080;
}

.github-markdown-morph .highlight .err {
	color: #a61717;
	background-color: #e3d2d2;
}

.github-markdown-morph .highlight .gd {
	color: #000;
	background-color: #fdd;
}

.github-markdown-morph .highlight .gd .x {
	color: #000;
	background-color: #faa;
}

.github-markdown-morph .highlight .ge {
	font-style: italic;
}

.github-markdown-morph .highlight .gr {
	color: #aa0000;
}

.github-markdown-morph .highlight .gh {
	color: #999;
}

.github-markdown-morph .highlight .gi {
	color: #000;
	background-color: #dfd;
}

.github-markdown-morph .highlight .gi .x {
	color: #000;
	background-color: #afa;
}

.github-markdown-morph .highlight .go {
	color: #888;
}

.github-markdown-morph .highlight .gp {
	color: #555;
}

.github-markdown-morph .highlight .gs {
	font-weight: bold;
}

.github-markdown-morph .highlight .gu {
	color: #800080;
	font-weight: bold;
}

.github-markdown-morph .highlight .gt {
	color: #aa0000;
}

.github-markdown-morph .highlight .ow {
	font-weight: bold;
}

.github-markdown-morph .highlight .w {
	color: #bbb;
}

.github-markdown-morph .highlight .sr {
	color: #017936;
}

.github-markdown-morph .highlight .ss {
	color: #8b467f;
}

.github-markdown-morph .highlight .bp {
	color: #999;
}

.github-markdown-morph .highlight .gc {
	color: #999;
	background-color: #EAF2F5;
}

.github-markdown-morph .octicon {
	font: normal normal 16px octicons-anchor;
	line-height: 1;
	display: inline-block;
	text-decoration: none;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
}

.github-markdown-morph .octicon-link:before {
	content: '';
}

.github-markdown-morph .task-list-item {
	list-style-type: none;
}

.github-markdown-morph .task-list-item+.task-list-item {
	margin-top: 3px;
}

.github-markdown-morph .task-list-item input {
	float: left;
	margin: 0.3em 0 0.25em -1.6em;
	vertical-align: middle;
}

.github-markdown-morph .button {
  text-decoration: underline;
  cursor: pointer;
  font-weight: bold;
  margin: 3px;
}

`,

    ensure: function() {
      var id = "apis.Github.css-markdown";
      // document.getElementById(id).parentNode.removeChild(document.getElementById(id));
      if (!document.getElementById(id))
        XHTMLNS.ensureCSSDef(apis.Github.css.css, id);
    }
  }
});

apis.Github.Issues = {

  cachedIssueList: {},
  cachedPullRequestList: {},

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
    apis.Github.doAuthenticatedRequest(
      `/repos/${repoName}/issues/${issueNo}`,
      lively.lang.obj.merge({cache: apis.Github.Issues.cachedIssueList}, options),
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
    // apis.Github.Issues.getAllIssues("LivelyKernel/LivelyKernel", (err, pulls) => inspect(pulls))
    if (typeof options === "function") { thenDo = options; options = null; }
    options = lively.lang.obj.merge({
      cache: apis.Github.Issues.cachedIssueList,
      state: "open"
    }, options);
    apis.Github.getPages(`/repos/${repoName}/issues?state=${options.state}`, options, thenDo);
  },

  getAllPulls: function(repoName, options, thenDo) {
    // Usage:
    // apis.Github.Issues.getAllPulls("LivelyKernel/LivelyKernel", (err, pulls) => inspect(pulls))
    if (typeof options === "function") { thenDo = options; options = null; }
    options = lively.lang.obj.merge({
      cache: apis.Github.Issues.cachedPullRequestList,
      state: "open"
    }, options);

    apis.Github.getPages(`/repos/${repoName}/pulls?state=${options.state}`, options, thenDo);
  },

  getIssueComments: function(repoName, issueOrIssueNo, options, thenDo) {
    if (typeof options === "function") { thenDo = options; options = null; }
    lively.lang.obj.merge({cache: apis.Github.Issues.cachedIssueList}, options);

    var issue = typeof issueOrIssueNo === "number" ? null : issueOrIssueNo,
        no = issue ? issue.number : issueOrIssueNo,
        since = issue ? issue.created_at : new Date("01 October, 2007");

    apis.Github.doAuthenticatedRequest(
      `/repos/${repoName}/issues/${no}/comments?since=${since}`,
      lively.lang.obj.merge(options, {scopes: apis.Github.defaultScopes}),
      (err, result) => thenDo(err, result ? result.data : []));
  },

  ui: {

    cachedIssuesForUI: {},
    cachedPullsForUI: {},

    printIssueTitle: function(issue) {
      var isPr = issue.isPullRequest;
      return `#${issue.number} [${issue.state}${isPr ? " PR" : ""}] ${isPr ? "" : "   "}${issue.title} (${new Date(issue.created_at).format("yyyy-mm-dd")}, ${issue.user.login}${isPr ? ", " + issue.head.label : ""})`;
    },

    printIssue: function(issue) {
      var isPr = issue.isPullRequest;
      return `# [${issue.number}] ${issue.title}

- State: ${issue.state}
- Created: ${new Date(issue.created_at).format("yyyy-mm-dd HH:MM")}
- ${isPr ? "Author" : "Reported by"}: ${issue.user.login}
- URL: ${issue.html_url}
- Merge: ${isPr ? "[" + issue.head.label + " => " + issue.base.label + "](" + issue.html_url + "/files)\n" : ""}

${issue.body}`;
    },

    printIssueComment: function(comment) {
      return `### ${comment.user.login} ${new Date(comment.created_at).format("yyyy-mm-dd")}

${comment.body}
`;
    },

    printIssueAndComments: function(issue, comments) {
      var divider = "\n\n-----\n\n";
      return apis.Github.Issues.ui.printIssue(issue)
           + (comments.length ? divider : "")
           + comments.map(apis.Github.Issues.ui.printIssueComment)
             .join(divider)
    },

    repoOfIssue: function(issue) {
      var m = issue.url.match(/repos\/([^\/]+\/[^\/]+)\//);
      return m && m[1];
    },

    _setupMorphForGithubIssue: function(morph, issue, comments) {

      morph.addScript(function browseIssueOnGithub() {
        window.open(this.issue.html_url, "_blank");
      });

      morph.addScript(function codeEditorMenuItems() {
        return [
          ["browse issue on Github", () => this.browseIssueOnGithub()],
          ["add comment", () => this.interactivelyComment()],
          ["update", () => this.interactivelyUpdate()],
          this.issue.state === "open" ?
            ["close", () => this.interactivelyCloseIssue()] :
            ["open", () => this.interactivelyOpenIssue()],
          {isMenuItem: true, isDivider: true}
        ].concat($super());
      });

      morph.addScript(function morphMenuItems() {
        return [
          ["browse issue on Github", () => this.browseIssueOnGithub()],
          ["add comment", () => this.interactivelyComment()],
          ["update", () => this.interactivelyUpdate()],
          this.issue.state === "open" ?
            ["close", () => this.interactivelyCloseIssue()] :
            ["open", () => this.interactivelyOpenIssue()],
          {isMenuItem: true, isDivider: true}
        ].concat($super());
      });

      morph.addScript(function interactivelyComment() {
          var repo = apis.Github.Issues.ui.repoOfIssue(this.issue);
          lively.lang.fun.composeAsync(
            n => $world.editPrompt("Please add comment:",
              input => n(input && input.trim() ? null : "invalid input", input),
              {input: "...", historyId: "apis.Github.Issues.add-comment-editor"}),
            (comment, n) => apis.Github.Issues.addCommentToIssue(
              repo, this.issue.number, comment, n)
          )(err => {
            if (err) return this.showError(err);

            this.update(err => err ?
              this.showError(err) : this.setStatusMessage("Comment uploaded", Color.green))
          });
      });

      morph.addScript(function interactivelyUpdate() {
        this.setStatusMessage("Updating...");
        this.update(err => err ?
          this.showError(err) : this.setStatusMessage("Updated."));
      });

      morph.addScript(function interactivelyCloseIssue() {
        var repo = apis.Github.Issues.ui.repoOfIssue(this.issue);
        Global.apis.Github.Issues.editIssue(
          repo,
          this.issue.number, {state: "close"},
          (err) => !err && this.update())
      });

      morph.addScript(function interactivelyOpenIssue() {
        var repo = apis.Github.Issues.ui.repoOfIssue(this.issue);
        Global.apis.Github.Issues.editIssue(
          repo,
          this.issue.number, {state: "open"},
          (err) => !err && this.update())
      });

      morph.addScript(function interactivelyOpenDiff() {
        var diff = new WebResource(this.issue.diff_url).get().content;
        $world.addCodeEditor({
          title: "Diff of pull request [" + this.issue.number + "] " + this.issue.title,
          textMode: "diff",
          content: diff,
          extent: pt(600,700)
        }).getWindow().comeForward();
      });

      morph.addScript(function onKeyDown(evt) {
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

      morph.addScript(function showIssueAndComments(issue, comments) {
        this.issue = issue;
        this.issueComments = comments;
        var printed = apis.Github.Issues.ui.printIssueAndComments(issue, comments),
            title = apis.Github.Issues.ui.printIssueTitle(issue);
        this.setTextString(printed);
        this.getWindow() && this.getWindow().setTitle(title);
      });

      morph.addScript(function update(thenDo) {
        var scroll = this.getScroll();
        Global.apis.Github.Issues.ui.openIssue(
              Global.apis.Github.Issues.ui.repoOfIssue(this.issue),
              this.issue.number,
              {editor: this},
              err => {
                this.setScroll(scroll[0], scroll[1]);
                thenDo && thenDo(err);
              });
      });

      if (!morph.setStatusMessage) morph.addStatusMessageTrait();
      morph.getPartsBinMetaInfo().addRequiredModule("apis.Github");
    },

    openIssueAndCommentsWithEditor: function(editor, issue, comments, thenDo) {
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

      apis.Github.Issues.ui._setupMorphForGithubIssue(editor, issue, comments);

      thenDo && thenDo(null, editor);
    },

    openIssueAndCommentsMarkdownViewer: function(mdMorph, issue, comments, thenDo) {
      if (!mdMorph) {
        mdMorph = new lively.morphic.HtmlWrapperMorph(pt(700, 500));
        mdMorph.openInWindow();
        mdMorph.getWindow().comeForward();
        mdMorph.applyStyle({fill: Color.white, clipMode: "auto"});
      }

      apis.Github.Issues.ui._setupMorphForGithubIssue(mdMorph, issue, comments);

      mdMorph.addStyleClassName("github-markdown-morph");

      mdMorph.addScript(function renderButton(id) {
        return `<span id=${id} class="button" onclick="var morph, el = this; do { morph = lively.$(el).data('morph'); } while(!morph && (el = el.parentNode)); morph.onButtonClick(this.id);">${id}</span>`
      });

      mdMorph.addScript(function onButtonClick(id) {
          switch (id) {
            case 'comment': this.interactivelyComment(); break;
            case 'refresh': this.interactivelyUpdate(); break;
            case 'close': this.interactivelyCloseIssue(); break;
            case 'open': this.interactivelyOpenIssue(); break;
            case 'diff': this.interactivelyOpenDiff(); break;
          }
      });

      mdMorph.addScript(function showIssueAndComments(issue, comments) {
        this.issue = issue;
        this.issueComments = comments;
        var printed = Global.apis.Github.Issues.ui.printIssueAndComments(issue, comments),
            title = Global.apis.Github.Issues.ui.printIssueTitle(issue),
            buttons = "<hr>\n\n"
                    + ['refresh', 'comment', this.issue.state === "open" ? "close" : "open"].concat(this.issue.isPullRequest ? ["diff"] : [])
                      .map(this.renderButton).join(" ")
                    + "<br><br>";

        var m = module('lively.ide.codeeditor.modes.Markdown');
        if (!m.isLoaded()) m.load();
        m.runWhenLoaded(() => {
          Global.apis.Github.css.ensure()
          this.setHTML('<div style="margin-left: 7px; margin-right: 7px">' + m.compileToHTML(printed) + buttons + '</div>');
          this.focus();
        });

        this.getWindow() && this.getWindow().setTitle(title);
      });

      mdMorph.addScript(function onWindowGetsFocus() { this.focus(); });

      mdMorph.getPartsBinMetaInfo().addRequiredModule('lively.ide.codeeditor.modes.Markdown');

      thenDo && thenDo(null, mdMorph);
    },

    openIssueAndComments: function(editor, issue, comments, thenDo) {
      this.openIssueAndCommentsMarkdownViewer(editor, issue, comments,
        (err, morph) => {
          if (err) return thenDo && thenDo(err, null);
          morph.showIssueAndComments(issue, comments);
          thenDo && thenDo(null, morph)
        });
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

    showNarrower: function(issues, repoName, thenDo) {
      var cache = apis.Github.Issues.ui.cachedIssuesForUI;
      var n = lively.ide.tools.SelectionNarrowing.getNarrower({
          name: "apis.Github.all-issues-list-" + repoName,
          spec: {
              prompt: 'headings: ',
              candidates: issues.map(i => ({
                isListItem: true,
                string: apis.Github.Issues.ui.printIssueTitle(i),
                value: i
              })),
              keepInputOnReactivate: true,
              actions: [{
                  name: 'show issue',
                  exec: issue => apis.Github.Issues.ui.openIssue(null, issue)
              }, {
                  name: 'open all filtered',
                  exec: () => {
                    var issues = n.getFilteredCandidates(n.state.originalState || n.state);
                    lively.lang.arr.mapAsyncSeries(issues,
                      (issue, _, n) => apis.Github.Issues.ui.openIssue(null, issue, {}, n),
                      () => {});
                  }
              }, {
                name: 'clear cache',
                exec: () => cache[repoName] = null
              }]
          }
      });
      thenDo && thenDo(null, n);
    },

    browseIssues: function(repoName, thenDo) {
      var issueCache = apis.Github.Issues.ui.cachedIssuesForUI,
          pullsCache = apis.Github.Issues.ui.cachedPullsForUI;

      // clean ui cache
      setTimeout(() => issueCache[repoName] = null, 3*60*1000);

      var removeLoadingIndicator;
      lively.lang.fun.composeAsync(
        n => lively.ide.withLoadingIndicatorDo("loading...", (err, _, x) => (removeLoadingIndicator = x) && n(err)),
        issuesAndPullsP(),
        (issues, n) => {
          var grouped = issues.sortByKey("number").reverse().groupByKey("state"),
              issueList = (grouped.open || []).concat(grouped.closed || []);
          n(null, issueList);
        },
        (issues, n) => apis.Github.Issues.ui.showNarrower(issues, repoName, n),
        (narrower, n) => { removeLoadingIndicator(); n(null, narrower); }
      )((err, narrower) => {
        removeLoadingIndicator();
        thenDo && thenDo(err, narrower);
      });
      
      
      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      
      function issuesAndPullsP() {
        return Promise.all([
          issueCache[repoName] ? issueCache[repoName] :
            lively.lang.promise.convertCallbackFun(apis.Github.Issues.getAllIssues)(repoName, {state: "all"})
              .then(issues => issueCache[repoName] = issues),
          pullsCache[repoName] ? pullsCache[repoName] :
            lively.lang.promise.convertCallbackFun(apis.Github.Issues.getAllPulls)(repoName, {state: "all"})
              .then(pulls => pullsCache[repoName] = pulls.map(ea => (ea.isPullRequest = true) && ea))
        ]).then(issuesAndPulls => {
          const issues = issuesAndPulls[0],
                pulls = issuesAndPulls[1],
                issuesWithoutPulls = issues.filter(issue =>
                  !pulls.some(pull => issue.number === pull.number));
          return issuesWithoutPulls.concat(pulls);
        })
      }
    }
  }
}

}) // end of module
