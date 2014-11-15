var isNodejs = typeof UserAgent !== "undefined" && UserAgent.isNodejs;
var livelyLang = isNodejs ? require("lively.lang") : Global.jsext;
livelyLang.deprecatedLivelyPatches();
