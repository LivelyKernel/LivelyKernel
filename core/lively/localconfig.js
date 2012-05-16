var host = document.location.host,
    protocol = document.location.protocol,
    url = document.location.toString(),
    wwPath = "/repository/webwerkstatt";


lively.Config.set('proxyURL', protocol + '//' + host + '/proxy');

lively.Config.set("wikiRepoUrl", protocol + '//' + host + (url.include('swa/research') ?
                                                    wwPath + '/swa/research' : wwPath));

lively.Config.set("debugExtras", false);

lively.Config.set("askBeforeQuit", true);
lively.Config.set("confirmNavigation", false);

lively.Config.set("showNetworkExamples", true);

lively.Config.set("resizeScreenToWorldBounds", true);

lively.Config.set("disableScriptCaching", true);

// 'primitive', 'turquoise', 'hpi', 'lively'
lively.Config.set("defaultDisplayTheme", 'hpi');

lively.Config.set("disableNoConsoleWarning", true);

lively.Config.set("ignoreAdvice", false);

lively.Config.set("loadUserConfig", true);

lively.Config.add("modulePaths", 'apps');

lively.Config.urlQueryOverride();