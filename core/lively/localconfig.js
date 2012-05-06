var host = document.location.host,
    protocol = document.location.protocol,
    url = document.location.toString(),
    wwPath = "/repository/webwerkstatt";


Config.set('proxyURL', protocol + '//' + host + '/proxy');

Config.set("wikiRepoUrl", protocol + '//' + host + (url.include('swa/research') ?
                                               wwPath + '/swa/research' : wwPath));

Config.set("debugExtras", false);

Config.set("askBeforeQuit", true);
Config.set("confirmNavigation", false);

Config.set("showNetworkExamples", true);

Config.set("testInRealWorld", true);

Config.set("resizeScreenToWorldBounds", true);

Config.set("disableScriptCaching", true);

// 'primitive', 'turquoise', 'hpi', 'lively'
Config.set("defaultDisplayTheme", 'hpi');

Config.set("disableNoConsoleWarning", true);

Config.set("ignoreAdvice", false);

Config.set("loadUserConfig", true);

Config.set("ChromeSVGRenderingHotfix", true);

Config.add("modulePaths", 'apps');