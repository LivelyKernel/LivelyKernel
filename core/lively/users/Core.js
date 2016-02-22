module('lively.users.Core').requires('lively.Network').toRun(function() {

Object.subclass("lively.users.UserDB",
"initialization", {
  initialize: function(name) {
    this.name = name;
  },
  ensureOnServer: function(thenDo) {
    thenDo && thenDo()
  },
});

Object.extend(lively.users.UserDB, {
  dbs: {},
  ensure: function(name, thenDo) {
    var db = lively.users.UserDB.dbs[name] || (lively.users.UserDB.dbs[name]  = new lively.users.UserDB(name));
  },
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Object.subclass("lively.users.User",
"state", {
  name: "unknown_user",
  email: null,
  loggedIn: false,
  groups: [],
  authRules : []
},
"initialization", {

  initialize: function(name, email, groups) {
    if (!name) throw new Error("Cannot create a user without a name!");
    this.name = String(name);
    if (email) this.email = email;
    this.groups = groups || [];
    this.authRules = [];
  }

},
"testing", {
  isUnknownUser: function() { return this.name === "unknown_user"; },

  equals: function(other) {
    return other instanceof lively.users.User && other.name === this.name;
  }
},
"authentication", {

  serverLogin: function(worldName, thenDo) {
    var user = this;
    var data = {
        username: user.name,
        email: user.email,
        currentWorld: worldName && String(worldName)
    };
    URL.root.withFilename('login').asWebResource().beAsync()
      .post(JSON.stringify(data), 'application/json')
      .withJSONWhenDone(function(creds, status) {
        var err;
        if (!status.isSuccess()) err = new Error("Failed reqesting /login: " + status);
        if (!err && creds) {
          user.loggedIn = true;
          if (creds.username && creds.username !== user.name) {
              err = lively.lang.string.format("User login: User %s tried to login byt server /login returned %s as a name", user.name, creds.username);
          } else if (creds.group) {
            user.groups = user.groups.without(creds.group);
            user.groups.unshift(creds.group);
          } else if (creds.email) {
            user.email = creds.email;
          }
        }
        thenDo && thenDo(err, user);
      });
  }

},
"authorization", {

  addRule: function(rule) {
    var func = null;

    if (typeof rule === "function") func = rule;
    else if (rule.type === "Function") func = lively.lang.VM.syncEval(rule.rule).value;
    else if (rule.type === "RegExp") {
      var context = {user: this},
          // To replace something like ${user.name} with the actual value
          reString = rule.rule.replace(/\$\{([^\}]+)}/g, function(_, match) { return lively.PropertyPath(match.trim()).get(context); }),
          re = new RegExp(reString);
      func = function reRule(url) { return !!url.fullPath().match(re); };
    }

    if (func instanceof Error) console.error("%s>>addRule: Error " + func);
    else if (func) this.authRules.push(func);
    else console.warn("%s>>addRule: Unknown rule " + rule);

  },

  canWriteWorld: function(worldPathOrURL, cb) {
    var url = worldPathOrURL, user = this, answer = {value: false};

    // ensure that worldPathOrURL is a URL
    if (!url.isURL) {
      if (!String(worldPathOrURL).startsWith("http")) {
        url = URL.root.withFilename(url.replace(/^\//, ""));
      } else {
        var msg = "Invalid path or url: " + url;
        console.warn(msg);
        cb && cb(new Error(msg), answer);
        return answer;
      }
    }

    // 1. Try global rules
    try {
      var globalRules = lively.Config.get("globalPermissions");
      for (var i = 0; i < globalRules.length; i++) {
        var ruleFunc = globalRules[i];
        var result = ruleFunc.call(Global, url, user);
        if (!result || typeof result === "boolean") result = {value: result};
        else if (!result.value) result = {value: result};
        if (result.value) { answer = result; break; }
      }
    } catch (e) {
      console.error("Global auth rule failed: " + e);
      answer.error = e;
      cb && cb(e, answer);
      return answer;
    }
    // 2. user's rules
    if (!answer.value) {
      try {
        for (var i = 0; i < this.authRules.length; i++) {
          var ruleFunc = this.authRules[i];
          var result = ruleFunc.call(user, url);
          if (!result || typeof result === "boolean") result = {value: result};
          else if (!result.value) result = {value: result}
          if (result.value) { answer = result; break; }
        }
      } catch (e) {
        console.error("Auth rule failed: " + e);
        answer.error = e;
        cb && cb(e, answer);
        return answer;
      }
    }

    cb && cb(null, answer);
    return answer;
  },
},
"custom user attributes", {

  reservedAttributes: ["name","email","loggedIn","groups","authRules"],

  attributesStorageKey: function() { return "user-attributes-" + this.name; },

  addAttributes: function(attributes) {
    this.setAttributes(lively.lang.obj.merge(this.getAttributes(), attributes));
    return this;
  },

  setAttributes: function(attributes, dontSave) {
    var toDelete = Object.keys(this.getAttributes()).withoutAll(Object.keys(attributes));
    // FIXME: Fat Arrow Expression not yet supported in Safari (MR)
    toDelete.forEach(function(k) { delete this[k]; }, this);
    lively.lang.obj.extend(this, attributes);
    !dontSave && this.saveAttributes();
    return this;
  },

  getAttributes: function() {
    // FIXME: Fat Arrow Expression not yet supported in Safari (MR)
    var self = this;
    return Object.keys(this).withoutAll(this.reservedAttributes).reduce(function(attrs, k) {
      attrs[k] = self[k];
      return attrs;
    }, {});
  },

  saveAttributes: function() {
    var attributesJson = JSON.stringify(this.getAttributes());
    lively.LocalStorage.set(this.attributesStorageKey(), attributesJson);
  },

  loadAttributes: function() {
    var loaded = lively.LocalStorage.get(this.attributesStorageKey());
    if (loaded) {
      try { this.setAttributes(JSON.parse(loaded), true); } catch (e) {}
    }
  },

  clearAttributes: function() {
    this.setAttributes({});
    lively.LocalStorage.remove("user-attributes-" + this.name);
  }

},
"debugging", {
  toString: function() { return "<User " + this.name + ">"; }
});

Object.extend(lively.users.User, {

  defaultPermissions: [
    {type: "RegExp", rule: "users/${user.name}/.*"},
    {type: "Function", rule: String(function(url) { 
      return {redirect: true, value: URL.root.withFilename("users/" + this.name + "/" + url.filename())}; })}
  ],

  named: function(name) {
    var user = new lively.users.User(name),
        permissions = (lively.Config.userPermissions || {})[name] || []
          .concat(lively.users.User.defaultPermissions);
    permissions.forEach(function(rule) { user.addRule(rule); });
    user.loadAttributes();
    return user;
  },

  unknown: function() { return lively.users.User.named("unknown_user"); }
});

Object.extend(lively.users, {
  GlobalRules: {
    addRule: function(rule) {
      if (!lively.Config._globalPermissions) lively.Config._globalPermissions = [];
      lively.Config._globalPermissions.pushIfNotIncluded(rule);
    },

    removeRule: function(ruleOrName) {
      if (!lively.Config._globalPermissions) return;
      if (typeof ruleOrName === "string") {
        lively.Config._globalPermissions = lively.Config._globalPermissions.filter(
          function(rule) { return rule.name !== ruleOrName; });
      } else {
        lively.Config._globalPermissions.remove(ruleOrName);
      }
    }

  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

(function extendWorldMorph() {
module("lively.morphic.Core").runWhenLoaded(function() {

lively.morphic.World.addMethods(
"users", {
  getCurrentUser: function() {
    var name = String($world.getUserName(true));
    if (name === 'null' || name === 'undefined' || name === 'unknown_user') name = null;
    return name ? lively.users.User.named(name) : lively.users.User.unknown();
  }
})
  
});
})();

}) // end of module
