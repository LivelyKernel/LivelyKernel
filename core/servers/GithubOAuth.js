var url = require("url");
var https = require("https");
var fs = require("fs");
var path = require("path");

var oAuthHTML =
  "<html>\n"
+ "    <head>\n"
+ "      <title>Lively Github Login</title>\n"
+ "    </head>\n"
+ "    <body>\n"
+ "        <div>Successfully logged into Github!</div>\n"
+ "        <div id=\"close-in-message\">This window will close in 1 second</div>\n"
+ "        <script type=\"text/javascript\">\n"
+ "            setInterval(function() {\n"
+ "                var el = document.getElementById(\"close-in-message\");\n"
+ "                el.textContent = el.textContent.replace(/[0-9]+/,\n"
+ "                    function(match) { return Number(match) - 1; });\n"
+ "            }, 1000);\n"
+ "            setTimeout(close, 1*1000)\n"
+ "        </script>\n"
+ "    </body>\n"
+ "</html>\n";


var githubAccess;
(function readGithubAPIIDAndSecret() {
  if (Config.githubAPIClientId && Config.githubAPIClientSecret) {
    githubAccess = {
      clientId: Config.githubAPIClientId,
      clientSecret: Config.githubAPIClientSecret
    };
  } else {
    fs.readFile(
      path.join(process.env.WORKSPACE_LK, "core/apis/github-api.json"),
      function(err, content) {
        if (err) return;
        try { githubAccess = JSON.parse(content); }
        catch (e) { console.error(e); }
      });
  }
})();


module.exports = function(route, app) {

  app.all(route + 'oauth/callback', function handleGithubCodeRequest(req, res) {
    var query = url.parse(req.url, true).query;
    global.lastGithubAuth = query
    if (!query.state || query.state.match(/no session/)) {
      console.warn("Github oauth cannot be send to client, no l2l session!");
    } else {
      var id = query.state;
      require("./SessionTracker").SessionTracker.default().findConnection(id, function(err, connection) {
        if (err) console.warn("Github oauth cannot be send to client, no l2l connection found for session " + id);
        else connection.send({action: "githubOauthResponse", data: query})
      });
    }
    res.end(oAuthHTML);
  });

  app.post(route + "oauth/access_token", function(req, res) {
    if (!githubAccess) {
      res.status(500).end("Github API id and secret not found! Check if core/apis/github-api.json has client_id/client_secret set!");
      return;
    }
    var queryString = req.url.replace(/[^\?]+/, "")
                    + "&client_id=" + githubAccess.clientId
                    + "&client_secret=" + githubAccess.clientSecret;

    var options = {
      hostname: 'github.com',
      port: 443,
      path: '/login/oauth/access_token' + queryString,
      method: 'POST',
      headers: {"Accept": "application/json"}
    };
    
    var githubReq = https.request(options, function(githubRes)  {
      var data = "";
      githubRes.on('data', function(d)  { data += d; });
      githubRes.on('end', function()  { res.end(data); });
    });
    githubReq.end();
    githubReq.on('error', function(e) {  res.status(500).end(String(e.message || e)); });
  });

  app.get(route + 'clientId', function(req, res) {
    if (!githubAccess) {
      res.status(500).end("Github API id and secret not found! Check if core/apis/github-api.json has client_id/client_secret set!");
      return;
    }
    res.end(githubAccess.clientId);
  });
}
