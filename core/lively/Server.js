module("lively.Server").requires("lively.Network").toRun(function() {

// Note: this is not the actual server, just a interface for talking to it

Object.extend(lively.Server, {

  logThrottleTimeout: 500/*ms*/,
  logThrottleQueue: [],
  logThrottleCallbacks: [],

  logThrottled: function(msgSpecs, options, thenDo) {
    // lively.Server.logThrottled("fooooo")
    
    if (typeof options === "function") {
      thenDo = options; options = null;
    }

    var s = lively.Server;
    if (Array.isArray(msgSpecs)) s.logThrottleQueue.pushAll(msgSpecs);
    else s.logThrottleQueue.push(msgSpecs);
    thenDo && s.logThrottleCallbacks.push(thenDo);

    lively.lang.fun.throttleNamed(
      "lively.Server.logThrottled",
      (options && options.timeout) || lively.Server.logThrottleTimeout,
      () => {
        var cbs = s.logThrottleCallbacks;
        s.log(s.logThrottleQueue, options, (err) =>
          cbs.forEach(ea => ea.call(null, err)));
        s.logThrottleQueue = [];
        s.logThrottleCallbacks = [];
      })();
  },

  log: function(msgSpecs, options, thenDo) {
    // lively.Server.log(["test", {message: "errrrrr", type: "error"}])
    if (typeof msgSpecs === "string") msgSpecs = [msgSpecs];
    var logStmts = msgSpecs.map(ea => {
      var msg = typeof ea === "string" ? ea : ea.message,
          type = typeof ea === "string" ? "log" : (ea.type || "log"),
          stmt = lively.lang.string.format("console.%s('%s');", type, msg);
      return stmt;
    }).join("");
    return lively.Server.serverHTTPEval(logStmts, options, thenDo);
  },

  serverHTTPEval: function(code, options, thenDo) {
    if (typeof options === "function") {
      thenDo = options; options = null;
    }
    options = lively.lang.obj.merge({sync: false}, options);

    var webR = URL.nodejsBase.withFilename("NodeJSEvalServer/").asWebResource();
    if (!options.sync) webR.beAsync();
    thenDo && webR.whenDone((_, status) => {
      thenDo(status.isSuccess() ? null : status); });
    return webR.post(code);
  },

  enableSendingConsoleLogsToServer: function(opts) {
    opts = lively.lang.obj.merge({timeout: this.logThrottleTimeout}, opts);

    if (lively.Server._consoleWrapper)
      return lively.Server._consoleWrapper;

    function serverLogProxy(type) {
      return function(/*args*/) {
        var msg;
        try {
          msg = "[BROWSER-" + type.toUpperCase() + "] "
              + lively.lang.string.format.apply(lively.lang.string, arguments);
        } catch (e) { msg = arguments[0]; }
        lively.Server.logThrottled(msg, opts);
      }
    }
    
    var c = lively.Server._consoleWrapper = {
      log: serverLogProxy("log"),
      warn: serverLogProxy("warn"),
      error: serverLogProxy("error"),
    }

    console.addConsumer(c);
    return c;
  },

  disableSendingConsoleLogsToServer: function() {
    if (lively.Server._consoleWrapper) {
      console.removeConsumer(lively.Server._consoleWrapper);
      lively.Server._consoleWrapper = null;
    }
  }

});

});
