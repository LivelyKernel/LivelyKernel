module('lively.net.tools.RemoteProject').requires('lively.net.tools.Functions').toRun(function() {


/*
1. Add something like
<script type="text/javascript" src="http://lively-web.org/users/robertkrahn/node-lively2lively/lively2lively-browserified.js?name=my-project-name&baseURL=http://lively-web.org&autoload=true"></script></style>
to your webpage.
Replace "my-project-name" with something unique

2. Then you can use these helpers to remote-dev your project

lively.net.tools.RemoteProject.installCSSHelpers("tour-gallery-editor", err => show(err ? String(err) : "css helpers installed"))
lively.net.tools.RemoteProject.updateCSS("tour-gallery-editor", "body { background-color: yellow; }", err => show(err ? err : "css updated"))
lively.net.tools.RemoteProject.reloadProjectPage("tour-gallery-editor");
lively.net.tools.RemoteProject.inProjectEval("tour-gallery-editor", "1+2", show.curry('%s %o'));
*/

Object.extend(lively.net.tools.RemoteProject, {

  withProjectConnectionsDo: function(projectName, doFunc, thenDo) {
    var s = lively.net.SessionTracker.getSession();
    s && lively.net.tools.Functions.withSessionsDo(s, function(err, sessions) {
      lively.lang.arr.mapAsync(
        sessions.filter(ea => ea.user === projectName),
        {},
        (con, _, n) => {
          if (doFunc.length > 1) doFunc(con, n)
          else { doFunc(con); n(); };
        },
        (err, results) => thenDo && thenDo(err, results.compact()));
    });
  },

  inProjectEval: function(projectName, code, thenDo) {
    var s = lively.net.SessionTracker.getSession();
    lively.net.tools.RemoteProject.withProjectConnectionsDo(projectName,
      (con, next) => s.remoteEval(con.id, code,
        (err, answer) => {
          var ignore = err && err.data && err.data.error && err.data.error.match(/Failure finding target connection/);
          next(null, ignore ? null : lively.lang.obj.merge({con: con}, answer.data))
        }),
      thenDo);
  },

  reloadProjectPage: function(projectName) {
    lively.net.tools.RemoteProject.inProjectEval(projectName, "location.reload()",
      err => show(err ? String(err) : "reloaded"));
  },

  installCSSHelpers: function(projectName, thenDo) {
    var s = lively.net.SessionTracker.getSession(),
        code = lively.lang.fun.extractBody(remoteCode);
    lively.net.tools.RemoteProject.inProjectEval(projectName, code, err => thenDo(err));
    
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function remoteCode() {
      function ensureCSSDef(string, id) {
        var node = document.getElementById(id);
        return node ?
          setCSSDef(string, node) :
          addCSSDef(string, id);
      }
    
      function addCSSDef(string, id) {
        var def = newCSSDef(string, id)
        document.getElementsByTagName('head')[0].appendChild(def);
        return def;
      }
    
      function setCSSDef(cssDefString, node) {
        lively.lang.arr.from(node.childNodes).forEach(function(c) {
          node.removeChild(c); });
        var rules = document.createTextNode(cssDefString);
        if (node.styleSheet) node.styleSheet.cssText = rules.nodeValue
        else node.appendChild(rules);
        return node;
      }
    
      function newCSSDef (string, id) {
        var style = document.createElement('style');
        style.type = 'text/css';
        if (id) style.setAttribute('id', id);
        return setCSSDef(string, style);
      }
    
      lively.lang.fun.waitFor(
        () => lively.lang.Path("lv.l2l.session").get(window),
        () => {
          window.lv.l2l.session.addActions({
            updateCSS: function(msg, con) {
              ensureCSSDef(msg.data.css, msg.data.node);
              con.answer(msg, "OK");
            }
          });
        });
    }
  },

  updateCSS: function(projectName, css, cssId, thenDo) {
    if (typeof cssId === "function") {
      thenDo = cssId; cssId = null;
    }
    cssId = cssId || "lively-remote-project-css";

    var s = lively.net.SessionTracker.getSession();
    sendCSS(err => {
      if (!err) return thenDo && thenDo(null);
      if (err.data && err.data.error === "messageNotUnderstood") {
        return lively.net.tools.RemoteProject.installCSSHelpers(projectName,
          err => err ? thenDo && thenDo() : sendCSS(thenDo));
      }
      thenDo && thenDo(err);
    });
    
    function sendCSS(thenDo) {
      lively.net.tools.RemoteProject.withProjectConnectionsDo(projectName,
        (con, next) => s.sendTo(con.id, "updateCSS", {node: cssId, css: css}, (err, answer) => {
          var ignoreError = err && err.data && err.data.error && err.data.error.match(/Failure finding target connection/);
          next(ignoreError ? null : err);
        }), err => thenDo && thenDo(err));
    }
  }

});

}) // end of module
