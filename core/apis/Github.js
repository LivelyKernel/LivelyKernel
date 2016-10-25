module('apis.Github').requires('apis.OAuth', 'lively.Network', 'lively.net.SessionTracker').toRun(function () {

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
    subserverURL: "https://lively-web.org/nodejs/GithubOAuth/",
    l2lCallbackServiceSelector: "githubOauthResponse"
  },

  requestAccess: function requestAccess(options, thenDo) {
    if (typeof options === "function") {
      thenDo = options;
      options = null;
    }
    return apis.OAuth.requestAccess(lively.lang.obj.merge(apis.Github.oauth, options), thenDo);
  },

  getLimitInfoOfReq: function getLimitInfoOfReq(req) {
    // extract quota limit from req / webresource headers
    return req.responseHeaders ? {
      limit: Number(req.responseHeaders["x-ratelimit-limit"]),
      remaining: Number(req.responseHeaders["x-ratelimit-remaining"]),
      reset: Number(req.responseHeaders["x-ratelimit-reset"])
    } : null;
  },

  getPageInfoOfReq: function getPageInfoOfReq(req) {
    // extract header links from WebResource
    var links = (lively.PropertyPath("responseHeaders.link").get(req) || "").split(",").map(function (ea) {
      if (!ea) return null;
      var linkParts = ea.split(";").invoke("trim");
      return {
        url: new URL(linkParts[0].replace(/^<|>$/g, "")),
        rel: linkParts[1].match(/rel="([^"]+)"/)[1]
      };
    }).compact();

    var lastLink = links.detect(function (ea) {
      return ea.rel === "last";
    }),
        lastPage = lastLink && Number(lastLink.url.getQuery().page);

    return {
      links: links,
      lastPage: lastPage || 1
    };
  },

  getPages: function getPages(reqPath, options, thenDo) {
    // options: {cache: OBJECT},
    // see getAllIssues
    if (typeof options === "function") {
      thenDo = options;
      options = null;
    }
    options = lively.lang.obj.merge({ cache: {} }, options);
    var isLoggedIn = lively.lookup("github.oauth", $world.getCurrentUser().getAttributes()) || options && options.auth,
        method = isLoggedIn ? 'doAuthenticatedRequest' : 'doRequest';

    getPage(1, [], thenDo);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function getPage(page, results, thenDo) {
      apis.Github[method](reqPath, lively.lang.obj.merge(options, { page: page }), function (err, result) {
        if (err) return thenDo(err);

        // TO reduce the server load and makes things much more faster we
        // don't just rely on etag based cache responses from Github but use our
        // cache directly when the first page hasn't changed thus avoiding
        // requests for subsequent pages

        if (page === 1 && result.req.status.code() === 304 && options.cache) {
          var keyPattern = result.cacheKey.replace(/page=1.*/, "page="),
              cache = options.cache,
              cachedResult = Object.keys(cache).filter(function (k) {
            return k.startsWith(keyPattern);
          }).reduce(function (cachedResult, cacheKey) {
            return cachedResult.concat(cache[cacheKey].data);
          }, []);
          return thenDo(null, cachedResult);
        }

        var pageInfo = apis.Github.getPageInfoOfReq(result.req);
        if (err) thenDo(err);else if (page >= pageInfo.lastPage) thenDo(null, results.concat(result.data));else getPage(page + 1, results.concat(result.data), thenDo);
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
      } catch (e) {
        return thenDo(e);
      }
    } else {
      url = urlOrPath;
    }

    if (options.hasOwnProperty("page")) {
      url = url.withQuery(lively.lang.obj.merge(url.getQuery(), { page: options.page }));
    }

    var req = url.asWebResource().noProxy().beAsync();

    // auth
    var accessToken;
    if (options.auth && options.auth.access_token) {
      var accessToken = options.auth.access_token;
      req.setRequestHeaders({ "Authorization": "token " + accessToken });
    }

    // cache? set etag!
    var cacheKey = (accessToken || "notauthenticated") + "-" + url,
        cached = options.cache && options.cache[cacheKey],
        etag = cached && cached.req && cached.req.responseHeaders.etag,
        updateCache = options.cache && (options.hasOwnProperty("updateCache") ? options.updateCache : true);
    etag && req.setRequestHeaders({ "if-none-match": etag });

    // send the request
    var method = (options.method || "GET").toLowerCase(),
        args = [];
    if (options.data) {
      var data = typeof options.data === "string" ? options.data : JSON.stringify(options.data);
      args = [data];
    }

    req[method].apply(req, args).whenDone(function (content, status) {
      if (status.code() >= 400) return thenDo(status, content);

      // cached?
      if (status.code() === 304) {
        cached.req = req;
        return thenDo(null, cached);
      }

      var json;
      try {
        json = JSON.parse(content);
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

  doAuthenticatedRequest: function doAuthenticatedRequest(urlOrPath, options, thenDo) {
    var scopes = options.scopes || [];
    return apis.Github.requestAccess(scopes).then(function (auth) {
      return new Promise(function (resolve, reject) {
        return apis.Github.doRequest(urlOrPath, lively.lang.obj.merge(options, { auth: auth }), function (err, payload) {
          return err ? reject(err) : resolve(payload);
        });
      });
    }).then(function (payload) {
      return thenDo && thenDo(null, payload);
    }).catch(function (err) {
      if (err.code && err.code() === 401) {
        // reset access token cache
        var user = $world.getCurrentUser();
        user.setAttributes(lively.lang.obj.merge(user.github, { auth: null }));
      }
      thenDo && thenDo(err, null);
    });
  },

  css: {

    css: '@font-face {\n\tfont-family: octicons-anchor;\n\tsrc: url(data:font/woff;charset=utf-8;base64,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) format(\'woff\');\n}\n\n.github-markdown-morph {\n\t-ms-text-size-adjust: 100%;\n\t-webkit-text-size-adjust: 100%;\n\tcolor: #333;\n\toverflow: hidden;\n\tfont-family: "Helvetica Neue", Helvetica, "Segoe UI", Arial, freesans, sans-serif;\n\tfont-size: 16px;\n\tline-height: 1.6;\n\tword-wrap: break-word;\n}\n\n.github-markdown-morph a {\n\tbackground: transparent;\n}\n\n.github-markdown-morph a:active, .github-markdown-morph a:hover {\n\toutline: 0;\n}\n\n.github-markdown-morph strong {\n\tfont-weight: bold;\n}\n\n.github-markdown-morph h1 {\n\tfont-size: 2em;\n\tmargin: 0.67em 0;\n}\n\n.github-markdown-morph img {\n\tborder: 0;\n}\n\n.github-markdown-morph hr {\n\t-moz-box-sizing: content-box;\n\tbox-sizing: content-box;\n\theight: 0;\n}\n\n.github-markdown-morph pre {\n\toverflow: auto;\n}\n\n.github-markdown-morph code, .github-markdown-morph kbd, .github-markdown-morph pre {\n\tfont-family: monospace, monospace;\n\tfont-size: 1em;\n}\n\n.github-markdown-morph input {\n\tmargin: 0;\n}\n\n.github-markdown-morph html input[disabled] {\n\tcursor: default;\n}\n\n.github-markdown-morph input {\n\tline-height: normal;\n}\n\n.github-markdown-morph input[type="checkbox"] {\n\t-moz-box-sizing: border-box;\n\tbox-sizing: border-box;\n\tpadding: 0;\n}\n\n.github-markdown-morph table {\n\tborder-collapse: collapse;\n\tborder-spacing: 0;\n}\n\n.github-markdown-morph td, .github-markdown-morph th {\n\tpadding: 0;\n}\n\n.github-markdown-morph * {\n\t-moz-box-sizing: border-box;\n\tbox-sizing: border-box;\n}\n\n.github-markdown-morph input {\n\tfont: 13px / 1.4 Helvetica arial freesans clean sans-serif "Segoe UI Emoji" "Segoe UI Symbol";\n}\n\n.github-markdown-morph a {\n\tcolor: #4183c4;\n\ttext-decoration: none;\n}\n\n.github-markdown-morph a:hover, .github-markdown-morph a:focus, .github-markdown-morph a:active {\n\ttext-decoration: underline;\n}\n\n.github-markdown-morph hr {\n\theight: 0;\n\tmargin: 15px 0;\n\toverflow: hidden;\n\tbackground: transparent;\n\tborder: 0;\n\tborder-bottom: 1px solid #ddd;\n}\n\n.github-markdown-morph hr:before {\n\tdisplay: table;\n\tcontent: "";\n}\n\n.github-markdown-morph hr:after {\n\tdisplay: table;\n\tclear: both;\n\tcontent: "";\n}\n\n.github-markdown-morph h1, .github-markdown-morph h2, .github-markdown-morph h3, .github-markdown-morph h4, .github-markdown-morph h5, .github-markdown-morph h6 {\n\tmargin-top: 15px;\n\tmargin-bottom: 15px;\n\tline-height: 1.1;\n}\n\n.github-markdown-morph h1 {\n\tfont-size: 30px;\n}\n\n.github-markdown-morph h2 {\n\tfont-size: 21px;\n}\n\n.github-markdown-morph h3 {\n\tfont-size: 16px;\n}\n\n.github-markdown-morph h4 {\n\tfont-size: 14px;\n}\n\n.github-markdown-morph h5 {\n\tfont-size: 12px;\n}\n\n.github-markdown-morph h6 {\n\tfont-size: 11px;\n}\n\n.github-markdown-morph blockquote {\n\tmargin: 0;\n}\n\n.github-markdown-morph ul, .github-markdown-morph ol {\n\tpadding: 0;\n\tmargin-top: 0;\n\tmargin-bottom: 0;\n}\n\n.github-markdown-morph ol ol, .github-markdown-morph ul ol {\n\tlist-style-type: lower-roman;\n}\n\n.github-markdown-morph ul ul ol, .github-markdown-morph ul ol ol, .github-markdown-morph ol ul ol, .github-markdown-morph ol ol ol {\n\tlist-style-type: lower-alpha;\n}\n\n.github-markdown-morph dd {\n\tmargin-left: 0;\n}\n\n.github-markdown-morph code {\n\tfont: 12px Consolas "Liberation Mono" Menlo Courier monospace;\n}\n\n.github-markdown-morph pre {\n\tmargin-top: 0;\n\tmargin-bottom: 0;\n\tfont: 12px Consolas "Liberation Mono" Menlo Courier monospace;\n}\n\n.github-markdown-morph kbd {\n\tbackground-color: #e7e7e7;\n\tbackground-image: -webkit-linear-gradient(#fefefe, #e7e7e7);\n\tbackground-image: linear-gradient(#fefefe, #e7e7e7);\n\tbackground-repeat: repeat-x;\n\tborder-radius: 2px;\n\tborder: 1px solid #cfcfcf;\n\tcolor: #000;\n\tpadding: 3px 5px;\n\tline-height: 10px;\n\tfont: 11px Consolas "Liberation Mono" Menlo Courier monospace;\n\tdisplay: inline-block;\n}\n\n.github-markdown-morph>*:first-child {\n\tmargin-top: 0 !important;\n}\n\n.github-markdown-morph>*:last-child {\n\tmargin-bottom: 0 !important;\n}\n\n.github-markdown-morph .anchor {\n\tposition: absolute;\n\ttop: 0;\n\tbottom: 0;\n\tleft: 0;\n\tdisplay: block;\n\tpadding-right: 6px;\n\tpadding-left: 30px;\n\tmargin-left: -30px;\n}\n\n.github-markdown-morph .anchor:focus {\n\toutline: none;\n}\n\n.github-markdown-morph h1, .github-markdown-morph h2, .github-markdown-morph h3, .github-markdown-morph h4, .github-markdown-morph h5, .github-markdown-morph h6 {\n\tposition: relative;\n\tmargin-top: 1em;\n\tmargin-bottom: 16px;\n\tfont-weight: bold;\n\tline-height: 1.4;\n}\n\n.github-markdown-morph h1 .octicon-link, .github-markdown-morph h2 .octicon-link, .github-markdown-morph h3 .octicon-link, .github-markdown-morph h4 .octicon-link, .github-markdown-morph h5 .octicon-link, .github-markdown-morph h6 .octicon-link {\n\tdisplay: none;\n\tcolor: #000;\n\tvertical-align: middle;\n}\n\n.github-markdown-morph h1:hover .anchor, .github-markdown-morph h2:hover .anchor, .github-markdown-morph h3:hover .anchor, .github-markdown-morph h4:hover .anchor, .github-markdown-morph h5:hover .anchor, .github-markdown-morph h6:hover .anchor {\n\theight: 1em;\n\tpadding-left: 8px;\n\tmargin-left: -30px;\n\tline-height: 1;\n\ttext-decoration: none;\n}\n\n.github-markdown-morph h1:hover .anchor .octicon-link, .github-markdown-morph h2:hover .anchor .octicon-link, .github-markdown-morph h3:hover .anchor .octicon-link, .github-markdown-morph h4:hover .anchor .octicon-link, .github-markdown-morph h5:hover .anchor .octicon-link, .github-markdown-morph h6:hover .anchor .octicon-link {\n\tdisplay: inline-block;\n}\n\n.github-markdown-morph h1 {\n\tpadding-bottom: 0.3em;\n\tfont-size: 2.25em;\n\tline-height: 1.2;\n\tborder-bottom: 1px solid #eee;\n}\n\n.github-markdown-morph h2 {\n\tpadding-bottom: 0.3em;\n\tfont-size: 1.75em;\n\tline-height: 1.225;\n\tborder-bottom: 1px solid #eee;\n}\n\n.github-markdown-morph h3 {\n\tfont-size: 1.5em;\n\tline-height: 1.43;\n}\n\n.github-markdown-morph h4 {\n\tfont-size: 1.25em;\n}\n\n.github-markdown-morph h5 {\n\tfont-size: 1em;\n}\n\n.github-markdown-morph h6 {\n\tfont-size: 1em;\n\tcolor: #777;\n}\n\n.github-markdown-morph p, .github-markdown-morph blockquote, .github-markdown-morph ul, .github-markdown-morph ol, .github-markdown-morph dl, .github-markdown-morph table, .github-markdown-morph pre {\n\tmargin-top: 0;\n\tmargin-bottom: 16px;\n}\n\n.github-markdown-morph hr {\n\theight: 4px;\n\tpadding: 0;\n\tmargin: 16px 0;\n\tbackground-color: #e7e7e7;\n\tborder: 0 none;\n}\n\n.github-markdown-morph ul, .github-markdown-morph ol {\n\tpadding-left: 2em;\n}\n\n.github-markdown-morph ul ul, .github-markdown-morph ul ol, .github-markdown-morph ol ol, .github-markdown-morph ol ul {\n\tmargin-top: 0;\n\tmargin-bottom: 0;\n}\n\n.github-markdown-morph li>p {\n\tmargin-top: 16px;\n}\n\n.github-markdown-morph dl {\n\tpadding: 0;\n}\n\n.github-markdown-morph dl dt {\n\tpadding: 0;\n\tmargin-top: 16px;\n\tfont-size: 1em;\n\tfont-style: italic;\n\tfont-weight: bold;\n}\n\n.github-markdown-morph dl dd {\n\tpadding: 0 16px;\n\tmargin-bottom: 16px;\n}\n\n.github-markdown-morph blockquote {\n\tpadding: 0 15px;\n\tcolor: #777;\n\tborder-left: 4px solid #ddd;\n}\n\n.github-markdown-morph blockquote>:first-child {\n\tmargin-top: 0;\n}\n\n.github-markdown-morph blockquote>:last-child {\n\tmargin-bottom: 0;\n}\n\n.github-markdown-morph table {\n\tdisplay: block;\n\twidth: 100%;\n\toverflow: auto;\n\tword-break: normal;\n\tword-break: keep-all;\n}\n\n.github-markdown-morph table th {\n\tfont-weight: bold;\n}\n\n.github-markdown-morph table th, .github-markdown-morph table td {\n\tpadding: 6px 13px;\n\tborder: 1px solid #ddd;\n}\n\n.github-markdown-morph table tr {\n\tbackground-color: #fff;\n\tborder-top: 1px solid #ccc;\n}\n\n.github-markdown-morph table tr:nth-child(2n) {\n\tbackground-color: #f8f8f8;\n}\n\n.github-markdown-morph img {\n\tmax-width: 100%;\n\t-moz-box-sizing: border-box;\n\tbox-sizing: border-box;\n}\n\n.github-markdown-morph code {\n\tpadding: 0;\n\tpadding-top: 0.2em;\n\tpadding-bottom: 0.2em;\n\tmargin: 0;\n\tfont-size: 85%;\n\tbackground-color: rgba(0,0,0,0.04);\n\tborder-radius: 3px;\n}\n\n.github-markdown-morph code:before, .github-markdown-morph code:after {\n\tletter-spacing: -0.2em;\n\tcontent: " ";\n}\n\n.github-markdown-morph pre>code {\n\tpadding: 0;\n\tmargin: 0;\n\tfont-size: 100%;\n\tword-break: normal;\n\twhite-space: pre;\n\tbackground: transparent;\n\tborder: 0;\n}\n\n.github-markdown-morph .highlight {\n\tmargin-bottom: 16px;\n}\n\n.github-markdown-morph .highlight pre, .github-markdown-morph pre {\n\tpadding: 16px;\n\toverflow: auto;\n\tfont-size: 85%;\n\tline-height: 1.45;\n\tbackground-color: #f7f7f7;\n\tborder-radius: 3px;\n}\n\n.github-markdown-morph .highlight pre {\n\tmargin-bottom: 0;\n\tword-break: normal;\n}\n\n.github-markdown-morph pre {\n\tword-wrap: normal;\n}\n\n.github-markdown-morph pre code {\n\tdisplay: inline;\n\tmax-width: initial;\n\tpadding: 0;\n\tmargin: 0;\n\toverflow: initial;\n\tword-wrap: normal;\n\tbackground-color: transparent;\n\tborder: 0;\n}\n\n.github-markdown-morph pre code:before, .github-markdown-morph pre code:after {\n\tcontent: normal;\n}\n\n.github-markdown-morph .highlight {\n\tbackground: #fff;\n}\n\n.github-markdown-morph .highlight .mf, .github-markdown-morph .highlight .mh, .github-markdown-morph .highlight .mi, .github-markdown-morph .highlight .mo, .github-markdown-morph .highlight .il, .github-markdown-morph .highlight .m {\n\tcolor: #945277;\n}\n\n.github-markdown-morph .highlight .s, .github-markdown-morph .highlight .sb, .github-markdown-morph .highlight .sc, .github-markdown-morph .highlight .sd, .github-markdown-morph .highlight .s2, .github-markdown-morph .highlight .se, .github-markdown-morph .highlight .sh, .github-markdown-morph .highlight .si, .github-markdown-morph .highlight .sx, .github-markdown-morph .highlight .s1 {\n\tcolor: #df5000;\n}\n\n.github-markdown-morph .highlight .kc, .github-markdown-morph .highlight .kd, .github-markdown-morph .highlight .kn, .github-markdown-morph .highlight .kp, .github-markdown-morph .highlight .kr, .github-markdown-morph .highlight .kt, .github-markdown-morph .highlight .k, .github-markdown-morph .highlight .o {\n\tfont-weight: bold;\n}\n\n.github-markdown-morph .highlight .kt {\n\tcolor: #458;\n}\n\n.github-markdown-morph .highlight .c, .github-markdown-morph .highlight .cm, .github-markdown-morph .highlight .c1 {\n\tcolor: #998;\n\tfont-style: italic;\n}\n\n.github-markdown-morph .highlight .cp, .github-markdown-morph .highlight .cs {\n\tcolor: #999;\n\tfont-weight: bold;\n}\n\n.github-markdown-morph .highlight .cs {\n\tfont-style: italic;\n}\n\n.github-markdown-morph .highlight .n {\n\tcolor: #333;\n}\n\n.github-markdown-morph .highlight .na, .github-markdown-morph .highlight .nv, .github-markdown-morph .highlight .vc, .github-markdown-morph .highlight .vg, .github-markdown-morph .highlight .vi {\n\tcolor: #008080;\n}\n\n.github-markdown-morph .highlight .nb {\n\tcolor: #0086B3;\n}\n\n.github-markdown-morph .highlight .nc {\n\tcolor: #458;\n\tfont-weight: bold;\n}\n\n.github-markdown-morph .highlight .no {\n\tcolor: #094e99;\n}\n\n.github-markdown-morph .highlight .ni {\n\tcolor: #800080;\n}\n\n.github-markdown-morph .highlight .ne {\n\tcolor: #990000;\n\tfont-weight: bold;\n}\n\n.github-markdown-morph .highlight .nf {\n\tcolor: #945277;\n\tfont-weight: bold;\n}\n\n.github-markdown-morph .highlight .nn {\n\tcolor: #555;\n}\n\n.github-markdown-morph .highlight .nt {\n\tcolor: #000080;\n}\n\n.github-markdown-morph .highlight .err {\n\tcolor: #a61717;\n\tbackground-color: #e3d2d2;\n}\n\n.github-markdown-morph .highlight .gd {\n\tcolor: #000;\n\tbackground-color: #fdd;\n}\n\n.github-markdown-morph .highlight .gd .x {\n\tcolor: #000;\n\tbackground-color: #faa;\n}\n\n.github-markdown-morph .highlight .ge {\n\tfont-style: italic;\n}\n\n.github-markdown-morph .highlight .gr {\n\tcolor: #aa0000;\n}\n\n.github-markdown-morph .highlight .gh {\n\tcolor: #999;\n}\n\n.github-markdown-morph .highlight .gi {\n\tcolor: #000;\n\tbackground-color: #dfd;\n}\n\n.github-markdown-morph .highlight .gi .x {\n\tcolor: #000;\n\tbackground-color: #afa;\n}\n\n.github-markdown-morph .highlight .go {\n\tcolor: #888;\n}\n\n.github-markdown-morph .highlight .gp {\n\tcolor: #555;\n}\n\n.github-markdown-morph .highlight .gs {\n\tfont-weight: bold;\n}\n\n.github-markdown-morph .highlight .gu {\n\tcolor: #800080;\n\tfont-weight: bold;\n}\n\n.github-markdown-morph .highlight .gt {\n\tcolor: #aa0000;\n}\n\n.github-markdown-morph .highlight .ow {\n\tfont-weight: bold;\n}\n\n.github-markdown-morph .highlight .w {\n\tcolor: #bbb;\n}\n\n.github-markdown-morph .highlight .sr {\n\tcolor: #017936;\n}\n\n.github-markdown-morph .highlight .ss {\n\tcolor: #8b467f;\n}\n\n.github-markdown-morph .highlight .bp {\n\tcolor: #999;\n}\n\n.github-markdown-morph .highlight .gc {\n\tcolor: #999;\n\tbackground-color: #EAF2F5;\n}\n\n.github-markdown-morph .octicon {\n\tfont: normal normal 16px octicons-anchor;\n\tline-height: 1;\n\tdisplay: inline-block;\n\ttext-decoration: none;\n\t-webkit-font-smoothing: antialiased;\n\t-moz-osx-font-smoothing: grayscale;\n\t-webkit-user-select: none;\n\t-moz-user-select: none;\n\t-ms-user-select: none;\n\tuser-select: none;\n}\n\n.github-markdown-morph .octicon-link:before {\n\tcontent: \'\';\n}\n\n.github-markdown-morph .task-list-item {\n\tlist-style-type: none;\n}\n\n.github-markdown-morph .task-list-item+.task-list-item {\n\tmargin-top: 3px;\n}\n\n.github-markdown-morph .task-list-item input {\n\tfloat: left;\n\tmargin: 0.3em 0 0.25em -1.6em;\n\tvertical-align: middle;\n}\n\n.github-markdown-morph .button {\n  text-decoration: underline;\n  cursor: pointer;\n  font-weight: bold;\n  margin: 3px;\n}\n\n',

    ensure: function ensure() {
      var id = "apis.Github.css-markdown";
      // document.getElementById(id).parentNode.removeChild(document.getElementById(id));
      if (!document.getElementById(id)) XHTMLNS.ensureCSSDef(apis.Github.css.css, id);
    }
  }
});

apis.Github.Issues = {

  cachedIssueList: {},
  cachedPullRequestList: {},

  createIssue: function createIssue(repoName, title, body, options, thenDo) {
    if (typeof options === "function") {
      thenDo = options;options = null;
    }
    options = options || {};

    var issue = { "title": title, "body": body };
    if (options.labels) issue.labels = options.labels;
    if (options.assignee) issue.assignee = options.assignee;

    apis.Github.doAuthenticatedRequest('/repos/' + repoName + '/issues', lively.lang.obj.merge(options, { scopes: apis.Github.defaultScopes, data: issue, method: "POST" }), thenDo);
  },

  getIssue: function getIssue(repoName, issueNo, options, thenDo) {
    if (typeof options === "function") {
      thenDo = options;options = null;
    }
    var isLoggedIn = lively.lookup("github.oauth", $world.getCurrentUser().getAttributes()) || options && options.auth,
        method = isLoggedIn ? 'doAuthenticatedRequest' : 'doRequest';
    apis.Github[method]('/repos/' + repoName + '/issues/' + issueNo, lively.lang.obj.merge({ cache: apis.Github.Issues.cachedIssueList }, options), function (err, payload) {
      return thenDo && thenDo(err, payload && payload.data);
    });
  },

  editIssue: function editIssue(repoName, issueNo, payload, options, thenDo) {
    // https://developer.github.com/v3/issues/#edit-an-issue
    if (typeof options === "function") {
      thenDo = options;options = null;
    }
    options = options || {};

    apis.Github.doAuthenticatedRequest('/repos/' + repoName + '/issues/' + issueNo, lively.lang.obj.merge(options, { scopes: apis.Github.defaultScopes, data: payload, method: "PATCH" }), thenDo);
  },

  addCommentToIssue: function addCommentToIssue(repoName, issueNumber, comment, options, thenDo) {
    if (typeof options === "function") {
      thenDo = options;options = null;
    }
    options = options || {};

    apis.Github.doAuthenticatedRequest('/repos/' + repoName + '/issues/' + issueNumber + '/comments', lively.lang.obj.merge(options, { scopes: apis.Github.defaultScopes, data: { body: comment }, method: "POST" }), thenDo);
  },

  getAllIssues: function getAllIssues(repoName, options, thenDo) {
    // Usage:
    // apis.Github.Issues.getAllIssues("LivelyKernel/LivelyKernel", (err, pulls) => inspect(pulls))
    if (typeof options === "function") {
      thenDo = options;options = null;
    }
    options = lively.lang.obj.merge({
      cache: apis.Github.Issues.cachedIssueList,
      state: "open"
    }, options);
    apis.Github.getPages('/repos/' + repoName + '/issues?state=' + options.state, options, thenDo);
  },

  getAllPulls: function getAllPulls(repoName, options, thenDo) {
    // Usage:
    // apis.Github.Issues.getAllPulls("LivelyKernel/LivelyKernel", (err, pulls) => inspect(pulls))
    if (typeof options === "function") {
      thenDo = options;options = null;
    }
    options = lively.lang.obj.merge({
      cache: apis.Github.Issues.cachedPullRequestList,
      state: "open"
    }, options);

    apis.Github.getPages('/repos/' + repoName + '/pulls?state=' + options.state, options, thenDo);
  },

  getIssueComments: function getIssueComments(repoName, issueOrIssueNo, options, thenDo) {
    if (typeof options === "function") {
      thenDo = options;options = null;
    }
    lively.lang.obj.merge({ cache: apis.Github.Issues.cachedIssueList }, options);

    var issue = typeof issueOrIssueNo === "number" ? null : issueOrIssueNo,
        no = issue ? issue.number : issueOrIssueNo,
        since = issue ? issue.created_at : new Date("01 October, 2007");

    var isLoggedIn = lively.lookup("github.oauth", $world.getCurrentUser().getAttributes()) || options && options.auth,
        method = isLoggedIn ? 'doAuthenticatedRequest' : 'doRequest';

    apis.Github[method]('/repos/' + repoName + '/issues/' + no + '/comments?since=' + since, lively.lang.obj.merge(options, { scopes: apis.Github.defaultScopes }), function (err, result) {
      return thenDo(err, result ? result.data : []);
    });
  },

  ui: {

    cachedIssuesForUI: {},
    cachedPullsForUI: {},

    printIssueTitle: function printIssueTitle(issue) {
      var isPr = issue.isPullRequest;
      return '#' + issue.number + ' [' + issue.state + (isPr ? " PR" : "") + '] ' + (isPr ? "" : "   ") + issue.title + ' (' + new Date(issue.created_at).format("yyyy-mm-dd") + ', ' + issue.user.login + (isPr ? ", " + issue.head.label : "") + ')';
    },

    printIssue: function printIssue(issue) {
      var isPr = issue.isPullRequest;
      return '# [' + issue.number + '] ' + issue.title + '\n\n- State: ' + issue.state + '\n- Created: ' + new Date(issue.created_at).format("yyyy-mm-dd HH:MM") + '\n- ' + (isPr ? "Author" : "Reported by") + ': ' + issue.user.login + '\n- URL: ' + issue.html_url + '\n- Merge: ' + (isPr ? "[" + issue.head.label + " => " + issue.base.label + "](" + issue.html_url + "/files)\n" : "") + '\n\n' + issue.body;
    },

    printIssueComment: function printIssueComment(comment) {
      return '### ' + comment.user.login + ' ' + new Date(comment.created_at).format("yyyy-mm-dd") + '\n\n' + comment.body + '\n';
    },

    printIssueAndComments: function printIssueAndComments(issue, comments) {
      var divider = "\n\n-----\n\n";
      return apis.Github.Issues.ui.printIssue(issue) + (comments.length ? divider : "") + comments.map(apis.Github.Issues.ui.printIssueComment).join(divider);
    },

    repoOfIssue: function repoOfIssue(issue) {
      var m = issue.url.match(/repos\/([^\/]+\/[^\/]+)\//);
      return m && m[1];
    },

    _setupMorphForGithubIssue: function _setupMorphForGithubIssue(morph, issue, comments) {

      morph.addScript(function browseIssueOnGithub() {
        window.open(this.issue.html_url, "_blank");
      });

      morph.addScript(function codeEditorMenuItems() {
        return [["browse issue on Github", function () {
          this.browseIssueOnGithub();
        }], ["add comment", function () {
          this.interactivelyComment();
        }], ["update", function () {
          this.interactivelyUpdate();
        }], this.issue.state === "open" ? ["close", function () {
          this.interactivelyCloseIssue();
        }] : ["open", function () {
          this.interactivelyOpenIssue();
        }], { isMenuItem: true, isDivider: true }].concat($super());
      });

      morph.addScript(function morphMenuItems() {
        return [["browse issue on Github", function () {
          this.browseIssueOnGithub();
        }], ["add comment", function () {
          this.interactivelyComment();
        }], ["update", function () {
          this.interactivelyUpdate();
        }], this.issue.state === "open" ? ["close", function () {
          this.interactivelyCloseIssue();
        }] : ["open", function () {
          this.interactivelyOpenIssue();
        }], { isMenuItem: true, isDivider: true }].concat($super());
      });

      morph.addScript(function interactivelyComment() {
        var repo = apis.Github.Issues.ui.repoOfIssue(this.issue);
        lively.lang.fun.composeAsync(function (n) {
          return $world.editPrompt("Please add comment:", function (input) {
            return n(input && input.trim() ? null : 'invalid input', input);
          }, { input: "...", historyId: "apis.Github.Issues.add-comment-editor" });
        }, function (comment, n) {
          return apis.Github.Issues.addCommentToIssue(repo, this.issue.number, comment, n);
        })(function (err) {
          if (err) return this.showError(err);

          this.update(function (err) {
            return err ? this.showError(err) : this.setStatusMessage('Comment uploaded', Color.green);
          });
        });
      });

      morph.addScript(function interactivelyUpdate() {
        this.setStatusMessage("Updating...");
        this.update(function (err) {
          return err ? this.showError(err) : this.setStatusMessage('Updated.');
        });
      });

      morph.addScript(function interactivelyCloseIssue() {
        var repo = apis.Github.Issues.ui.repoOfIssue(this.issue);
        Global.apis.Github.Issues.editIssue(repo, this.issue.number, { state: "close" }, function (err) {
          return !err && this.update();
        });
      });

      morph.addScript(function interactivelyOpenIssue() {
        var repo = apis.Github.Issues.ui.repoOfIssue(this.issue);
        Global.apis.Github.Issues.editIssue(repo, this.issue.number, { state: "open" }, function (err) {
          return !err && this.update();
        });
      });

      morph.addScript(function interactivelyOpenDiff() {
        var diff = new WebResource(this.issue.diff_url).get().content;
        $world.addCodeEditor({
          title: "Diff of pull request [" + this.issue.number + "] " + this.issue.title,
          textMode: "diff",
          content: diff,
          extent: pt(600, 700)
        }).getWindow().comeForward();
      });

      morph.addScript(function onKeyDown(evt) {
        var keys = evt.getKeyString(),
            handled = true;
        switch (keys) {
          case 'Alt-G':
            this.interactivelyUpdate();break;
          case 'Alt-C':
            this.interactivelyComment();break;
          case 'Alt-B':
            this.browseIssueOnGithub();break;
          default:
            handled = false;
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
        Global.apis.Github.Issues.ui.openIssue(Global.apis.Github.Issues.ui.repoOfIssue(this.issue), this.issue.number, { editor: this }, function (err) {
          this.setScroll(scroll[0], scroll[1]);
          thenDo && thenDo(err);
        });
      });

      if (!morph.setStatusMessage) morph.addStatusMessageTrait();
      morph.getPartsBinMetaInfo().addRequiredModule("apis.Github");
    },

    openIssueAndCommentsWithEditor: function openIssueAndCommentsWithEditor(editor, issue, comments, thenDo) {
      if (!editor) {
        editor = $world.addCodeEditor({
          lineWrapping: true,
          textMode: "text",
          content: "",
          title: "",
          extent: pt(600, 500)
        });
        editor.getWindow().comeForward();
      }

      apis.Github.Issues.ui._setupMorphForGithubIssue(editor, issue, comments);

      thenDo && thenDo(null, editor);
    },

    openIssueAndCommentsMarkdownViewer: function openIssueAndCommentsMarkdownViewer(mdMorph, issue, comments, thenDo) {
      if (!mdMorph) {
        mdMorph = new lively.morphic.HtmlWrapperMorph(pt(700, 500));
        mdMorph.openInWindow();
        mdMorph.getWindow().comeForward();
        mdMorph.applyStyle({ fill: Color.white, clipMode: "auto" });
      }

      apis.Github.Issues.ui._setupMorphForGithubIssue(mdMorph, issue, comments);

      mdMorph.addStyleClassName("github-markdown-morph");

      mdMorph.addScript(function renderButton(id) {
        return '<span id=' + id + ' class="button" onclick="var morph, el = this; do { morph = lively.$(el).data(\'morph\'); } while(!morph && (el = el.parentNode)); morph.onButtonClick(this.id);">' + id + '</span>';
      });

      mdMorph.addScript(function onButtonClick(id) {
        switch (id) {
          case 'comment':
            this.interactivelyComment();break;
          case 'refresh':
            this.interactivelyUpdate();break;
          case 'close':
            this.interactivelyCloseIssue();break;
          case 'open':
            this.interactivelyOpenIssue();break;
          case 'diff':
            this.interactivelyOpenDiff();break;
        }
      });

      mdMorph.addScript(function showIssueAndComments(issue, comments) {
        this.issue = issue;
        this.issueComments = comments;
        var printed = Global.apis.Github.Issues.ui.printIssueAndComments(issue, comments),
            title = Global.apis.Github.Issues.ui.printIssueTitle(issue),
            buttons = "<hr>\n\n" + ['refresh', 'comment', this.issue.state === "open" ? "close" : "open"].concat(this.issue.isPullRequest ? ["diff"] : []).map(this.renderButton).join(" ") + "<br><br>";

        var m = module('lively.ide.codeeditor.modes.Markdown');
        if (!m.isLoaded()) m.load();
        m.runWhenLoaded(function () {
          Global.apis.Github.css.ensure();
          this.setHTML('<div style="margin-left: 7px; margin-right: 7px">' + m.compileToHTML(printed) + buttons + '</div>');
          this.focus();
        });

        this.getWindow() && this.getWindow().setTitle(title);
      });

      mdMorph.addScript(function onWindowGetsFocus() {
        this.focus();
      });

      mdMorph.getPartsBinMetaInfo().addRequiredModule('lively.ide.codeeditor.modes.Markdown');

      thenDo && thenDo(null, mdMorph);
    },

    openIssueAndComments: function openIssueAndComments(editor, issue, comments, thenDo) {
      this.openIssueAndCommentsMarkdownViewer(editor, issue, comments, function (err, morph) {
        if (err) return thenDo && thenDo(err, null);
        morph.showIssueAndComments(issue, comments);
        thenDo && thenDo(null, morph);
      });
    },

    openIssue: function openIssue(repoName, issueOrIssueNo, options, thenDo) {
      if (typeof options === "function") {
        thenDo = options;options = null;
      }
      options = options || {};

      var issue = typeof issueOrIssueNo === "number" ? null : issueOrIssueNo;

      lively.lang.fun.composeAsync(function (n) {
        return issue ? n(null, issueOrIssueNo) : apis.Github.Issues.getIssue(repoName, issueOrIssueNo, options, n);
      }, function (_issue, n) {
        issue = _issue;
        if (!repoName) repoName = apis.Github.Issues.ui.repoOfIssue(issue);
        n(null, issue);
      }, function (issue, n) {
        return apis.Github.Issues.getIssueComments(repoName, issue, n);
      }, function (comments, n) {
        return n(null, issue, comments);
      }, function (issue, comments, n) {
        return apis.Github.Issues.ui.openIssueAndComments(options.editor, issue, comments, n);
      })(thenDo);
    },

    showNarrower: function showNarrower(issues, repoName, thenDo) {
      var cache = apis.Github.Issues.ui.cachedIssuesForUI;
      var n = lively.ide.tools.SelectionNarrowing.getNarrower({
        name: "apis.Github.all-issues-list-" + repoName,
        spec: {
          prompt: 'headings: ',
          candidates: issues.map(function (i) {
            return {
              isListItem: true,
              string: apis.Github.Issues.ui.printIssueTitle(i),
              value: i
            };
          }),
          keepInputOnReactivate: true,
          actions: [{
            name: 'show issue',
            exec: function exec(issue) {
              return apis.Github.Issues.ui.openIssue(null, issue);
            }
          }, {
            name: 'open all filtered',
            exec: function exec() {
              var issues = n.getFilteredCandidates(n.state.originalState || n.state);
              lively.lang.arr.mapAsyncSeries(issues, function (issue, _, n) {
                return apis.Github.Issues.ui.openIssue(null, issue, {}, n);
              }, function () {});
            }
          }, {
            name: 'clear cache',
            exec: function exec() {
              return cache[repoName] = null;
            }
          }]
        }
      });
      thenDo && thenDo(null, n);
    },

    browseIssues: function browseIssues(repoName, thenDo) {
      var issueCache = apis.Github.Issues.ui.cachedIssuesForUI,
          pullsCache = apis.Github.Issues.ui.cachedPullsForUI;

      // clean ui cache
      setTimeout(function () {
        return issueCache[repoName] = null;
      }, 3 * 60 * 1000);

      var removeLoadingIndicator;
      lively.lang.fun.composeAsync(function (n) {
        return lively.ide.withLoadingIndicatorDo("loading...", function (err, _, x) {
          return (removeLoadingIndicator = x) && n(err);
        });
      }, issuesAndPullsP(), function (issues, n) {
        var grouped = issues.sortByKey("number").reverse().groupByKey("state"),
            issueList = (grouped.open || []).concat(grouped.closed || []);
        n(null, issueList);
      }, function (issues, n) {
        return apis.Github.Issues.ui.showNarrower(issues, repoName, n);
      }, function (narrower, n) {
        removeLoadingIndicator();n(null, narrower);
      })(function (err, narrower) {
        removeLoadingIndicator();
        thenDo && thenDo(err, narrower);
      });

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      function issuesAndPullsP() {
        return Promise.all([issueCache[repoName] ? issueCache[repoName] : lively.lang.promise.convertCallbackFun(apis.Github.Issues.getAllIssues)(repoName, { state: "all" }).then(function (issues) {
          return issueCache[repoName] = issues;
        }), pullsCache[repoName] ? pullsCache[repoName] : lively.lang.promise.convertCallbackFun(apis.Github.Issues.getAllPulls)(repoName, { state: "all" }).then(function (pulls) {
          return pullsCache[repoName] = pulls.map(function (ea) {
            return (ea.isPullRequest = true) && ea;
          });
        })]).then(function (issuesAndPulls) {
          var issues = issuesAndPulls[0],
              pulls = issuesAndPulls[1],
              issuesWithoutPulls = issues.filter(function (issue) {
            return !pulls.some(function (pull) {
              return issue.number === pull.number;
            });
          });
          return issuesWithoutPulls.concat(pulls);
        });
      }
    }
  }
};

}); // end of module
