Config.proxyURL = document.location.protocol + '//' + document.location.host + '/proxy';

Config.wikiRepoUrl = document.location.protocol + '//' + document.location.host +
	(document.URL.include('swa/research') ?
		'/repository/webwerkstatt/swa/research' :
		'/repository/webwerkstatt');

Config.debugExtras = false;

Config.showFabrikWeatherWidgetExample = false;

// Config.highlightSyntax = true;
// Config.usePieMenus = false;

Config.askBeforeQuit = true;

// Config.modulesOnWorldLoad = Config.modulesOnWorldLoad.concat(["cop/Layers", "tests/LayersTest"])
// Config.modulesOnWorldLoad = Config.modulesOnWorldLoad.concat(["lively.Fabrik", "lively.Presentation", "cop.Layers", 'lively.LayerableMorphs', "cop.Workspace", "lively.Graffle", "lively.Undo", "lively.TabCompletion", "lively.SyntaxHighlighting"])
Config.modulesOnWorldLoad = Config.modulesOnWorldLoad.concat(["lively.Graffle", "lively.Undo", "lively.ide.AutoCompletion", "lively.ide.SyntaxHighlighting", 'lively.Scripting'])

Config.showNetworkExamples = true


if (!Config.isNewMorphic) {
	Config.modulesOnWorldLoad.push('lively.deprecated.Helper')
}

Config.testInRealWorld = true

Config.confirmNavigation = false; 

Config.resizeScreenToWorldBounds = true;
 
Config.disableScriptCaching = true;

// document.body.style.cursor = 'none';
// document.body.style.cursor = 'url("/repository/webwerkstatt/media/nocursor.gif"), none';
// new URL(Config.codeBase).withFilename('media/nocursor.gif').withRelativePartsResolved().pathname

// document.body.style.cursor = 'wait'

Config.silentFailOnWrapperClassNotFound = true;

Config.defaultDisplayTheme = 'hpi' // 'primitive', 'turquoise', 'hpi', 'lively'

Config.disableNoConsoleWarning = true;

Config.ignoreAdvice = false;

Config.loadUserConfig = true;
Config.ChromeSVGRenderingHotfix = true;
