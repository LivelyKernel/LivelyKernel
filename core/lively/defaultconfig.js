/**
 * defaultconfig.js.  System default configuration.
 *
 *  Note that if a file localconfig.js can be found, it will be read
 *  immediately after this one, thus allowing any of these settings
 *  to be overridden.
 */

;(function setupUserAgent(Global) {

var webKitVersion = (function() {
    if (!Global.navigator) return 0;
    var match = Global.navigator.userAgent.match(/.*AppleWebKit\/(\d+).*/);
    return match ? parseInt(match[1]) : 0;
})();

var isRhino = !Global.navigator || Global.navigator.userAgent.indexOf("Rhino") > -1,
    isMozilla = Global.navigator && Global.navigator.userAgent.indexOf("Mozilla") > -1,
    isChrome = Global.navigator && Global.navigator.userAgent.indexOf("Chrome") > -1,
    isOpera = Global.navigator && Global.navigator.userAgent.indexOf("Opera") > -1,
    isIE = Global.navigator && Global.navigator.userAgent.indexOf("MSIE") > -1,
    fireFoxVersion = Global.navigator &&
    (Global.navigator.userAgent.split("Firefox/")[1] ||
     Global.navigator.userAgent.split("Minefield/")[1]); // nightly

Global.UserAgent = {
    // Newer versions of WebKit implement proper SVGTransform API, with
    // potentially better performance. Scratch that, lets make it more
    // predictable:
    usableTransformAPI: webKitVersion < 0, //webKitVersion >= 525,
    usableDropShadow: webKitVersion >= 525,
    canExtendBrowserObjects: !isRhino, // Error, document
    usableOwnerSVGElement: !isRhino && !isMozilla,

    // WebKit XMLSerializer seems to do weird things with namespaces
    usableNamespacesInSerializer: true, //webKitVersion <= 0,

    usableXmlHttpRequest: !isRhino,

    usableHTMLEnvironment: !isRhino,

    webKitVersion: webKitVersion,

    isRhino: isRhino,

    isMozilla: isMozilla,

    isChrome: isChrome,

    isOpera: isOpera,

    isIE: isIE,

    fireFoxVersion: fireFoxVersion ? fireFoxVersion.split('.') : null,

    isWindows: Global.navigator && Global.navigator.platform == "Win32",

    isLinux: Global.navigator && Global.navigator.platform.startsWith("Linux"),

    isMacOS: Global.navigator && Global.navigator.platform.startsWith("Mac"),

    isTouch: Global.navigator
          && (Global.navigator.platform == "iPhone"
            || Global.navigator.platform == "iPad"
            || Global.navigator.platform == "iPod"),

    touchIsMouse: false,

    isNodejs: (Global.process && !!Global.process.versions.node)
            || Global.navigator.userAgent.indexOf("Node.js") !== -1,

    isWorker: typeof importScripts !== 'undefined'
}

})(typeof Global !== 'undefined' ? Global : window);


//--------------------------
// Determine runtime behavior based on UA capabilities and user choices
// (can be overriden in localconfig.js)
// --------------------------
(function savePreBootstrapConfig() {
    Global.ExistingConfig = Global.Config;
    if (Global.ExistingConfig) {
        delete Global.ExistingConfig._options;
    }
})();

Global.Config = {

    _options: {},

    addOption: function(option) {
        // option: {name: STRING, value: OBJECT, docString: STRING, group: STRING, type: STRING, [get: FUNCTION,] [set: FUNCTION]}
        if (arguments.length > 1) { // old form of defining
            // args: name, value, docString, group, type
            return this.addOption({
                name: arguments[0],
                value: arguments[1],
                docString: arguments[2],
                group: arguments[3],
                type: arguments[4]
            });
        }
        var name = option.name, value = option.value,
            type = option.type, docString = option.docString,
            group = option.group;
        if (option.name === '_options') {
            throw new Error('Cannot set Config._options! Reserved!');
        }
        if (!option.hasOwnProperty('value') && option.get) {
            value = option.get();
        }
        if (!type && typeof value !== 'undefined') {
            if (Object.isRegExp(value)) type = 'RegExp'
            else if (Object.isArray(value)) type = 'Array'
            else if (typeof value === 'string') type = 'String'
            else if (typeof value === 'number') type = 'Number'
            else if (typeof value === 'function') type = 'Function'
        }
        this._options[name] = {
            doc: docString,
            get: option.get,
            set: option.set,
            type: type,
            default: value,
            group: group
        }
        if (!option.set) this[name] = value;
        else option.set(value);
    },

    hasOption: function(name) {
        return !!this._options[name];
    },

    hasDefaultValue: function(name) {
        var spec = this._options[name];
        return spec && spec.default === this[name];
    },

    addOptions: function(/*group - options pairs*/) {
        // - group is a string that should map to a lively namespace
        // - options are an array of arrays
        //   each sub array should at least have
        //   [0] option name
        //   [1] option value
        //   optional:
        //   [2] docString
        //   [3] type
        //   alernative: spec option as expected by addOption
        var config = this, args = Array.from(arguments);
        for (var i = 0; i < args.length; i += 2) {
            var group = args[i], options = args[i+1];
            options.forEach(function(optionSpec) {
                if (Object.isArray(optionSpec)) {
                    optionSpec[4] = optionSpec[3]; // type, optional
                    optionSpec[3] = group;
                    config.addOption.apply(config, optionSpec);
                } else {
                    if (!optionSpec.group) optionSpec.group = group;
                    config.addOption.call(config, optionSpec);
                }
            });
        }
    },

    urlQueryOverride: function() {
        if (Global.UserAgent.isNodejs) return;
        var queries = document.URL.toString().toQueryParams();
        for (var name in queries) {
            if (!this.hasOption(name)) continue;
            var value = queries[name];
            if (value === "false") value = false;
            if (this.get(name) === value) continue;
            console.log('Overriding lively.Config.' + name + ' with ' + value);
            this.set(name, value);
        }
    },

    loadUserConfigModule: function(optUsername) {
        if (!this.get("loadUserConfig")) return;
        var userName = optUsername || this.get('UserName');
        if (!userName || userName === "undefined") return;
        var userConfigModule = Strings.format('users.%s.config', userName);
        lively.require(userConfigModule).toRun(this.urlQueryOverride.bind(this));
    },

    set: function(name, value) {
        var spec = this._options[name];
        if (!spec) throw new Error('Trying to set unknown option lively.Config.' + name);
        return spec && spec.set ? spec.set.call(null, value) : (this[name] = value);
    },

    get: function(name, ignoreIfUndefinedOption) {
        var spec = this._options[name];
        if (!ignoreIfUndefinedOption && !spec) throw new Error('Trying to get unknown option lively.Config.' + name);
        return spec && spec.get ?
            spec.get.call() : (typeof this[name] === "function" ? this[name].call() : this[name]);
    },

    lookup: function(name) {
        // retrieve the Config value. If its a function: don't call it.
        var spec = this._options[name];
        return spec && spec.get ? this.get(name) : this[name];
    },

    add: function(name, value) {
        var arr = this.get(name);
        if (!Object.isArray(arr)) {
            throw new Error('Trying to add to a non-array lively.Config.' + name);
        }
        return arr.push(value);
    },

    // helper methods
    getDocumentDirectory: function() {
        // used in various places
        return JSLoader.currentDir();
    },

    location: (function setupLocation() {
        if (typeof document !== "undefined") return document.location;
        var url = JSLoader.currentDir(),
            match = url.match(/(^[^:]+:)[\/]+([^\/]+).*/),
            protocol = match[1],
            host = match[2];
        return {
            toString: function() { return url },
            valueOf: function() { return url },
            protocol: protocol,
            host: host
        }
    })(),

    // debugging
    allOptionNames: function() {
        return Properties.own(this)
               .pushAll(Properties.own(this._options))
               .uniq()
               .withoutAll(this._nonOptions)
               .reject(function(ea) { return ea.startsWith('__') || ea.startsWith('$$') });
    },

    manualOptionNames: function() {
        return this.allOptionNames()
           .withoutAll(Properties.own(this._options));
    },

    toString: function() { return 'lively.Config' },

    displayWarning: function() {
        var warn = $('<div/>');
        warn.text('Currently optimized loading is disabled. '
                 + 'It can therefore take a bit longer loading a world. '
                 + 'We will soon fix this issue.');
        warn.css({position: 'absolute',
                  left: '20px',
                  top: '20px',
                  color: 'orange',
                  'font-family': 'sans-serif',
                  "font-size": "20px"});
        warn.appendTo('body');
        setTimeout(function() { warn.remove(); }, 4000);
    },

    inspect: function() {
        // gather all groups
        var groups = {}, groupNames = [], config = this;

        config.allOptionNames().forEach(function(name) {
            var option = config._options[name],
                groupName = (option && option.group) || '- undefined group -',
                group = groups[groupName] = groups[groupName] || [],
                groupItem = [name, config.lookup(name, true)];
            if (option && option.doc) groupItem.push(option.doc);
            groupItem = groupItem.collect(function(ea) { return Strings.print(ea) });
            group.push(groupItem);
            groupNames.pushIfNotIncluded(groupName);
        });

        // print each group
        var groupStrings = groupNames.sort().collect(function(groupName) {
            var group = groups[groupName],
                options = group.sortBy(function(option) { return option[0] }),
                optionsString = options.collect(function(option) {
                    return '[' + option.join(', ') + ']' }).join(",\n    ");
            return Strings.print(groupName) + ", [\n    " + optionsString + ']';
        });

        return 'lively.Config:\n  [' + groupStrings.join(',\n\n  ') + ']';
    }

};

(function finishCoreConfigDefinition(Config) {
    // All the methods and properties defined in Config at this point are for
    // managing/reading/writing the Config itself and should not be considered as
    // Config options
    if (Config._nonOptions) return;
    var knownNoOptions = ['_nonOptions', "doNotCopyProperties", "doNotSerialize", "attributeConnections", "finishLoadingCallbacks"];
    Config._nonOptions = Object.keys(Config).concat(knownNoOptions);
})(Global.Config);

(function addConfigOptions(Config, UserAgent, ExistingConfig) {

// support for loading from blob urls, e.g. in workers
// note that workers can also get the location spec passed in as an option so
// that blob parsing shouldn't be necessary. Also, in Firefox blob parsing
// doesn't work.
if (Config.location.protocol.indexOf('blob') > -1) {
    var isEncoded = !!Config.location.pathname.match(/https?%3A/);
    var decoded = Config.location.pathname;
    if (isEncoded) decoded = decodeURIComponent(decoded);
    var urlMatch = decoded.match(/([^:]+:)\/\/([^\/]+)(.*)/);
    if (urlMatch) {
        Config.location = {
            protocol: urlMatch[1],
            host: urlMatch[2],
            pathname: urlMatch[3],
            toString: function() {
                return this.protocol + '//' + this.host + this.pathname;
            }
        }
    }
}

var host = Config.location.host,
    protocol = Config.location.protocol,
    url = Config.location.toString();

Config.addOptions(
"cop", [
    ["copDynamicInlining", false, "Dynamically compile layered methods for improving their execution performance ."],
    ['ignoredepricatedProceed', true]
],

'user', [
    {
        name: 'UserName',
        type: 'String',
        doc: 'UserName identifies the current Lively user',
        get: function() { return lively.LocalStorage.get('UserName'); },
        set: function(val) { return lively.LocalStorage.set('UserName', val ? val.replace(/ /g, '_') : val); }
    }
],

'privacy', [
    ['isPublicServer', false, "Is the lively server this world is started from considered public?"]
],

'lively.Network', [
    ["proxyURL", protocol + '//' + host + '/proxy', "URL that acts as a proxy for network operations"]
],

'server.nodejs', [
    ["nodeJSURL", Config.location.protocol + '//' + Config.location.host + '/nodejs'],
    [/*This is deprecated*/"nodeJSPath", '/home/nodejs/']
],

'lively.persistence', [
    ["ignoreClassNotFound", true, "if a class is not found during deserializing a place holder object can be created instead of raising an error"],
    ["silentFailOnWrapperClassNotFound", true, "DEPRECATED old serialization logic"],
    ["ignoreLoadingErrors", true],
    ["ignoreMissingModules", false],
    ["keepSerializerIds", false],
    ["createWorldPreview", true, "Whether to store an HTML document showing a static version of the serialized world."],
    ["manuallyCreateWorld", false, "Loads up Lively and creates a complete new world from scratch instead of using a serialized one."],
    ["removeDOMContentBeforeWorldLoad", true, "Whether to remove all the DOM child nodes of the DOM element that is used to display the World."]
],

'lively.bindings', [
    ["selfConnect", false, "DEPRECATED! some widgets self connect to a private model on startup, but it doesn't seem necessary, turn on to override"],
    ["debugConnect", false, "For triggering a breakpoint when an connect update throws an error"],
    ["visualConnectEnabled", false, "Show data-flow arrows when doing a connect using the UI."]
],

'lively.morphic', [
    ['isNewMorphic', true, 'Deprecated option, defaults to true. Used in 2011 when Lively2 was being developed.'],
    ['shiftDragForDup', true, 'Allows easy object duplication using the Shift key.'],
    ["usePieMenus", UserAgent.isTouch],
    ["useTransformAPI", (!UserAgent.isOpera) && UserAgent.usableTransformAPI, "Use the browser's affine transforms"],

    ["nullMoveAfterTicks", false, "For the engine/piano demo (and any other simulation interacting with unmoving mouse) it is necessary to generate a mouseMove event after each tick set this true in localconfig if you need this behavior"],

    ["askBeforeQuit", true, "Confirm system shutdown from the user"],

    ["useShadowMorphs", true],

    ["loadSerializedSubworlds", false, "load serialized worlds instead of building them from Javascript"],

    ["personalServerPort", 8081, "where the local web server runs"],

    ["resizeScreenToWorldBounds", false],

    ["changeLocationOnSaveWorldAs", false],
    ["showWorldSave", true],

    ["alignToGridSpace", 10, "determins the pixels to snap to during shift dragging with mouse"],

    // Tests
    ["serverInvokedTest", false],

    // Modules
    ["moduleLoadTestTimeout", 10*1000, "Timeout in ms after which to run a module load check. Make it falsy to disable the check."],
    ["modulesBeforeWorldLoad", ["lively.morphic.HTML"], "evaluated before all changes"],
    ["modulesOnWorldLoad", ["lively.ide", "lively.IPad", "lively.net.SessionTracker", "lively.net.Wiki", "lively.ChangeSets"], "evaluated before world is setup"],
    ["codeBase", Config.codeBase && Config.codeBase != '' ? Config.codeBase : Config.getDocumentDirectory()],
    ["showModuleDefStack", true, "so modules know where they were required from"],
    ["loadUserConfig", true, "for sth like jens/config.js, used in lively.bootstrap"],
    ["modulePaths", ["apps", "users"], "root URLs of module lookup"],
    ["warnIfAppcacheError", true, "In case a world is loaded without being able to reach the application cache (probably because the server cannot be reached) show a warning on world load."],

    ["disableScriptCaching", true],
    ["defaultDisplayTheme", 'lively'],

    ["onWindowResizeUpdateWorldBounds", true],
    ["disableNoConsoleWarning", true],

    ["confirmNavigation", false, "don't show confirmation dialog when navigating a link"],
    ["useAltAsCommand", false, "User Platform Keys (Ctrl und Windows and Meta under Mac as command key)"],

    ["pageNavigationName", "nothing"],
    ["pageNavigationWithKeys", true, "boy, that's ugly!!!"],
    ["showPageNumber", true],

    ["useFlattenedHTMLRenderingLayer", true],
    ["useDelayedHTMLRendering", false],

    // this part is for the CodeDB extension using CouchDB
    ["couchDBURL", Config.location.protocol + '//' + Config.location.host + '/couchdb'],
    ["defaultCodeDB", 'code_db'],
    ["wikiRepoUrl", null],

    ["forceHTML", false],

    ["lessAnnoyingWorldStatusMessages", true],
    ["maxStatusMessages", 3, "Number of statusmessages that should appear at one time on the screen."]
],

'lively.morphic.Events', [
    ["useMetaAsCommand", false, "Use the meta modifier (maps to Command on the Mac) instead of alt"],
    ["showGrabHalo", false, "enable grab halo (alternative to shadow) on objects in the hand."],
    ["hideSystemCursor", false],
    ["handleOnCapture", true],
    ["globalGrabbing", true],
    ["touchBeMouse", UserAgent.isTouch]
],

'lively.morphic.Debugging', [
    ["captureThatOnAltClick", true, 'Alt/Option click assigns morph to "that" pointer.'],
    ["ignoreAdvice", false, "Ignore function logging through the prototype.js wrap mechanism rhino will give more useful exception info"],
    ["showLivelyConsole", false, "Open up our console"],
    ["debugExtras", false, "Enable advanced debugging options"],
    ["advancedSyntaxHighlighting", true, "Enable ast-based source code highlighting and error checking"],
    ["verboseLogging", true, "Whether to make logging/alerting highly visible in the UI"],
    ["bugReportWorld", "http://lively-web.org/issues/IssueTemplate.html", "Where to report bugs"]
],

'lively.morphic.Text', [
    ["fontMetricsFromHTML", UserAgent.usableHTMLEnvironment, "Derive font metrics from (X)HTML"],
    ["fontMetricsFromSVG", false, "Derive font metrics from SVG"],
    ["fakeFontMetrics", !UserAgent.usableHTMLEnvironment, "Try to make up font metrics entirely (can be overriden to use the native SVG API, which rarely works)"],
    ["showMostTyping", true, "Defeat bundled type-in for better response in short strings"],
    // Until we're confident
    ["showAllTyping", true, "Defeat all bundled type-in for testing"],
    ["useSoftTabs", true],
    ["defaultTabSize", 4],
    ["disableSyntaxHighlighting", false],
    ["textUndoEnabled", false, "wether Lively takes care of undoing text changes or leaves it to the browser"],
    ['defaultCodeFontSize', 12, "In which pt size code appears."],
    ['defaultCodeFontFamily', "Monaco,monospace", "Code font"],
    ['autoIndent', true, "Automatically indent new lines."],
    ['useAceEditor', true, "Whether to use the ace.ajax editor for code editing."],
    ['aceDefaultTheme', 'chrome', "Ace theme to use"],
    ['aceWorkspaceTheme', 'chrome', "Ace theme to use"],
    ['aceTextEditorTheme', 'chrome', "Ace theme to use"],
    ['aceSystemCodeBrowserTheme', 'chrome', "Ace theme to use"],
    ['aceDefaultTextMode', 'javascript', "Ace text mode to use"],
    ['aceDefaultLineWrapping', true, "Wrap lines in ace?"],
    ['aceDefaultShowGutter', true, "Enables the line number gutter"],
    ['aceDefaultShowInvisibles', false, "Indicators for whitespace / non-print chars."],
    ['aceDefaultShowPrintMargin', false, "Show a vertical line at the print margin column."],
    ['aceDefaultShowIndents', true, "Indicators for indents in the beginning of lines."],
    ['aceDefaultUseJavaScriptLinter', true, "Linting JavaScript code on-the-fly"],
    ['aceDefaultShowActiveLine', false, "Current line is highlighted"],
    ['aceDefaultEnableAutocompletion', true, "Should autocompletion be enabled?"],
    ['aceDefaultAutoTriggerAutocompletion', false, "Should autocompletion be triggered when typing?"],
    ['aceDefaultShowWarnings', true, "Should autocompletion be enabled?"],
    ['aceDefaultShowErrors', true, "Show syntax errors in programming language mode?"],
    ['computeCodeEditorCompletionsOnStartup', true, 'when enabled all JS files udner core/ are read on startup nd their content is used to compute word completions'],
    ['showDoitErrorMessages', true, "When a doit eval results in an error a error message pops up."],
    ['improvedJavaScriptEval', false, "Eval that changes semantics of how object literals and if statements are evaluated."],
],

'lively.morphic.StyleSheets', [
    ["baseThemeStyleSheetURL", ((ExistingConfig && ExistingConfig.codeBase) || Config.getDocumentDirectory()) + 'styles/base_theme.css', "The base theme CSS file location"],
    ["ipadThemeStyleSheetURL", ((ExistingConfig && ExistingConfig.codeBase) || Config.getDocumentDirectory()) + 'styles/ipad_theme.css', "The ipad theme CSS file location"]
],

"lively.PartsBin", [
    ["PartCachingEnabled", true, "Whether parts are cached after they are loaded the first time"]
],

"lively.morphic.Windows", [
    ["useWindowSwitcher", true, "Use the window switcher (F5/CMD+`/CTRL+`)."]
],

"lively.ide.tools", [
    ["defaultSCBExtent", [830,515], "Size of SCB"],
    ["defaultTextEditorExtent", [670,600], "Size of TextEditor"],
    ["defaultSCBSourcePaneToListPaneRatio", 0.525, "Ratio how much vertical space the sourcePane vs. the list panes get by default in SCB."],
    ['useHistoryTracking', true, 'When loading lively.ide.SystemCodeBrowserAddons, install history browsing for all future browsers, or not.']
],

"Lively2Lively", [
    ['lively2livelyAutoStart', true, 'Whether to automatically connect to a session tracker server and enable Lively-to-Lively connections.'],
    ["lively2livelyCentral", "http://lively-web.org/nodejs/SessionTracker/", 'Central server to connect to for inter-realm Lively-to-Lively connections. Nullify to deactivate.'],
    ["lively2livelyAllowRemoteEval", true, 'Allow eval actions from other Lively worlds.'],
    ["lively2livelyEnableConnectionIndicator", true, 'Show a morph that indicates whether lively2lively is running and which provides access to collab actions.']
],

"Wiki", [
    ['showWikiToolFlap', true, 'Show tool flap that gives access to wiki tools.']
],

'lively.Worker', [
    ['lively.Worker.idleTimeOfPoolWorker', 60*1000, 'Seconds a lively.Worker that is automatically added to the worker pool is kept alive.']
],
"Changesets", [
    ['changesetsExperiment', true, 'track changes and provide a UI for a changesets-based worlkflow'],
    ['automaticChangesReplay', true, 'restore changes automatically on world load']
]
);

})(Global.Config, Global.UserAgent, Global.ExistingConfig);

(function addSystemConfigOptions(Config, UserAgent) {

    var browserPrefix = (function() {
        if (UserAgent.fireFoxVersion) return 'moz';
        if (UserAgent.isIE) return 'ms';
        if (UserAgent.isOpera) return 'o';
        if (UserAgent.webKitVersion) return 'webkit';
        return '';
    })(), browserPrefixDash = '-' + browserPrefix + '-';

    Config.addOptions(
        "lively.morphic.Rendering", [
            ["browserPrefix", browserPrefix, "Prefix used for accessing browser specific features."],
            ["html5CssPrefix", browserPrefixDash],
            ["html5TransformProperty", UserAgent.isOpera ? 'OTransform' : (browserPrefixDash + 'transform')],
            ["html5TransformOriginProperty", UserAgent.isOpera ? 'OTransformOrigin' : (browserPrefixDash + 'transform-origin')]
        ]);

})(Global.Config, Global.UserAgent);

(function addOptionsFromPreBootstrapConfig(ExistingConfig, NewConfig) {
    if (!ExistingConfig) return;
    for (var name in ExistingConfig) {
        var value = ExistingConfig[name];
        if (NewConfig.hasOption(name)) {
            NewConfig.set(name, value)
        } else {
            NewConfig.addOption(name, value, null, 'pre-bootstrap config option');
        }
    }
    delete Global.ExistingConfig;
})(Global.ExistingConfig, Global.Config);

(function addConfigToLivelyNS() {
    var lively = Global.lively = Global.lively || {};
    lively.Config = Global.Config;
})();

(function loadConfigCustomization() {
    try {
        JSLoader.loadJs(Config.codeBase + 'lively/localconfig.js', null, true);
    } catch(e) {
        console.log('localconfig.js could not be loaded.');
    }
    try {
        lively.Config.urlQueryOverride();
    } catch(e) {
        console.log('Config customization via URL query could not be applied.');
    }
})();
