var host = document.location.host,
    protocol = document.location.protocol,
    url = document.location.toString(),
    wwPath = "/repository/webwerkstatt";


lively.Config.set('proxyURL', protocol + '//' + host + '/proxy');

// FIXME webwerkstatt specfic
lively.Config.set("wikiRepoUrl", protocol + '//' + host + (url.include('swa/research') ?
                                                    wwPath + '/swa/research' : wwPath));

lively.Config.set("debugExtras", false);
lively.Config.set("verboseLogging", true);

// FIXME what from both options is used???
lively.Config.set("askBeforeQuit", true);
lively.Config.set("confirmNavigation", false);

lively.Config.set("resizeScreenToWorldBounds", true);

lively.Config.set("disableScriptCaching", true);

// 'primitive', 'turquoise', 'hpi', 'lively'
lively.Config.set("defaultDisplayTheme", 'hpi');

lively.Config.set("disableNoConsoleWarning", true);

lively.Config.set("ignoreAdvice", false);

lively.Config.add("modulePaths", 'apps');

// FIXME: load those modules depending on the main render engine that should
// be used
lively.Config.add("modulesBeforeWorldLoad", 'lively.morphic.HTML');

// Config.set("textUndoEnabled", document.URL.indexOf('textUndoEnabled=false') === -1);
if (lively.Config.get("textUndoEnabled")) {
    lively.Config.add("modulesBeforeWorldLoad", 'lively.morphic.TextUndo');
}

lively.Config.add("modulesOnWorldLoad", 'lively.ide');

lively.Config.add("modulesOnWorldLoad", 'lively.morphic.GlobalLogger');

lively.Config.set("loadUserConfig", true);

lively.Config.urlQueryOverride();
