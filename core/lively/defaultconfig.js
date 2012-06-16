/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 * Copyright (c) 2008-2012 Robert Krahn
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * defaultconfig.js.  System default configuration.
 *
 *  Note that if a file localconfig.js can be found, it will be read
 *  immediately after this one, thus allowing any of these settings
 *  to be overridden.
 */

(function setupUserAgent(Global) {

    var webKitVersion = (function() {
        if (!window.navigator) return 0;
        var match = navigator.userAgent.match(/.*AppleWebKit\/(\d+).*/);
        return match ? parseInt(match[1]) : 0;
    })();

    var isRhino = !window.navigator || window.navigator.userAgent.indexOf("Rhino") > -1,
        isMozilla = window.navigator && window.navigator.userAgent.indexOf("Mozilla") > -1,
        isChrome = window.navigator && window.navigator.userAgent.indexOf("Chrome") > -1,
        isOpera = window.navigator && window.navigator.userAgent.indexOf("Opera") > -1,
        isIE = window.navigator && window.navigator.userAgent.indexOf("MSIE") > -1,
        fireFoxVersion = window.navigator &&
        (window.navigator.userAgent.split("Firefox/")[1] ||
         window.navigator.userAgent.split("Minefield/")[1]); // nightly

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

        isWindows: window.navigator && window.navigator.platform == "Win32",

        isLinux: window.navigator && window.navigator.platform.startsWith("Linux"),

        isTouch: window.navigator && (window.navigator.platform == "iPhone" || window.navigator.platform == "iPad" || window.navigator.platform == "iPod"),

        touchIsMouse: false

    }

})(window);


//--------------------------
// Determine runtime behavior based on UA capabilities and user choices
// (can be overriden in localconfig.js)
// --------------------------
(function savePreBootstrapConfig(Global) {
    Global.ExistingConfig = Global.Config;
})(window);

var Config = {

    _options: {},

    addOption: function(name, value, docString, group, type) {
        if (name === '_options') {
            throw new Error('Cannot set Config._options! Reserved!');
        }
        this[name] = value;
        this._options[name] = {
            doc: docString,
            type: type,
            default: value,
            group: group
        }
    },

    hasOption: function(name) {
        return !!this._options[name];
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
        var config = this, args = Array.from(arguments);
        for (var i = 0; i < args.length; i += 2) {
            var group = args[i],
                options = args[i+1];
            options.forEach(function(optionSpec) {
                optionSpec[4] = optionSpec[3]; // type, optional
                optionSpec[3] = group;
                config.addOption.apply(config, optionSpec);
            });
        }
    },

    urlQueryOverride: function() {
        var queries = document.URL.toString().toQueryParams();
        for (var name in queries) {
            if (!this.hasOption(name)) continue;
            var value = queries[name];
            if (this.get(name) === value) continue;
            console.log('Overriding lively.Config.' + name + ' with ' + value);
            this.set(name, value);
        }
    },

    loadUserConfigModule: function() {
        if (!this.get("loadUserConfig")) return;
        if (!lively.LocalStorage.isAvailable()) {
            console.warn('cannot load user config because cannot access localStorage!')
            return;
        }
        var userName = lively.LocalStorage.get('UserName');
        if (!userName || userName === "undefined") return;
        var fileName = LivelyLoader.codeBase + '../users/' + userName + "/config.js",
            config = this;
        JSLoader.loadJs(fileName, function() { config.urlQueryOverride(); });
    },

    set: function(name, value) {
        if (!this._options[name]) {
            throw new Error('Trying to set unknown option lively.Config.' + name);
        }
        return this[name] = value;
    },

    get: function(name, ignoreIfUndefinedOption) {
        if (!ignoreIfUndefinedOption && !this._options[name]) {
            throw new Error('Trying to get unknown option lively.Config.' + name);
        }
        var value = this[name];
        return typeof value === "function" ? value() : value;
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
        var url = document.URL;
        return url.substring(0, url.lastIndexOf('/') + 1);
    },

    // debugging
    allOptionNames: function() {
        return Properties.own(this)
               .pushAll(Properties.own(this._options))
               .uniq()
               .withoutAll(['_options', 'usage'])
               .reject(function(ea) { return ea.startsWith('__') });
    },

    manualOptionNames: function() {
        return this.allOptionNames()
           .withoutAll(Properties.own(this._options));
    },

    toString: function() { return 'lively.Config' },

    inspect: function() {
        // gather all groups
        var groups = {}, groupNames = [], config = this;

        config.allOptionNames().forEach(function(name) {
            var option = config._options[name],
                groupName = (option && option.group) || '- undefined group -',
                group = groups[groupName] = groups[groupName] || [],
                groupItem = [name, config.get(name, true)];
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
    },

    enableTracking: function() {
        var config = this;

        /*
         * Usage tracking for cleanup.
         * Config.unusedOptionNames() to find out never used options
         * Config.usedOptionNames() to find out where options are read/write
         * Config.manualOptionNames() to find out what options are assigned inline
         *   without using #addOption.
         */

        Object.extend(config, {

            usage: {},

            usedOptionNames: function() { return Properties.own(this.usedOptions()) },

            unusedOptionNames: function() {
                return this.allOptionNames().withoutAll(this.usedOptionNames());
            },

            usedOptions: function() {
                function printUsed() {
                    return "Config usage:\n" + Properties.own(used).collect(function(name) {
                        var usageStats = used[name],
                        readString = usageStats.read.join('\n\n'),
                        writeString = usageStats.write.join('\n\n');
                        return Strings.format('%s:\nread:\n%s\n\nwrite:\n%s',
                                              name, readString, writeString);
                    }).join('\n= = = = =\n');
                }
                var used = { toString: printUsed }
                Properties.forEachOwn(this.usage, function(name, usageStats) {
                    if (usageStats.read.length > 0 || usageStats.write.length > 0) {
                        used[name] = usageStats;
                    };
                })
                return used;
            },

            addOption: (function() {
                var proceed = config.addOption;

                return function(name, value, docString, group, type) {
                    proceed.apply(this, arguments);

                    var internalName = '__' + name,
                        usageStats = {read: [], write: []},
                    self = this;
                    this.usage[name] = usageStats;
                    this[internalName] = value;
                    this.__defineGetter__(name, function() {
                        var stack = "no stack obtained";
                        try { throw new Error() } catch(e) { stack = e.stack }
                        stack = stack.replace('Error\n', '');
                        usageStats.read.push(stack);
                        return self[internalName];
                    });
                    this.__defineSetter__(name, function(value) {
                        var stack = "no stack obtained";
                        try { throw new Error() } catch(e) { stack = e.stack }
                        stack = stack.replace('Error\n', '');
                        usageStats.write.push(stack);
                        return self[internalName] = value;
                    });
                }
            })()

        });
    }

};

(function addConfigOptions(Config, UserAgent, ExistingConfig) {

Config.addOptions(
    "cop", [
        ["copDynamicInlining", false, "Dynamically compile layered methods for improving their execution performance ."],
        ['ignoredepricatedProceed', true]
    ],

    'lively.Config', [
        ['trackUsage', false, 'to inspect how and where the Config was accessed and modified']
    ],

    'lively.Network', [
        ["proxyURL", null, "URL that acts as a proxy for network operations"],
        ["rootPath", null, "URL that points at the base directory of the current Lively installation"]
    ],

    'server.nodejs', [
        ["nodeJSURL", document.location.protocol + '//' + document.location.host + '/nodejs'],
        ["nodeJSPath", '/home/nodejs/']
    ],

    'lively.persistence', [
        ["ignoreClassNotFound", true, "if a class is not found during deserializing a place holder object can be created instead of raising an error"],
        ["silentFailOnWrapperClassNotFound", true, "DEPRECATED old serialization logic"],
        ["ignoreLoadingErrors", true],
        ["ignoreMissingModules", false],
        // This is for Persistence.js (ask Martin).
        ["keepSerializerIds", false],
        ["useOfflineStorage", false]
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
        ["suppressBalloonHelp", true],
        ["useTransformAPI", (!UserAgent.isOpera) && UserAgent.usableTransformAPI, "Use the browser's affine transforms"],
        ["useGetTransformToElement", !(UserAgent.isOpera || UserAgent.isIE || UserAgent.fireFoxVersion && (UserAgent.fireFoxVersion[0] == '2' || UserAgent.fireFoxVersion[0] == '3')), "Firefox, Opera and IE have known problems with getTransformToElement, detect it"],

        ["useDropShadow", UserAgent.usableDropShadow, "Enable drop shadows for objects (does not work well in most browsers)"],

        ["suspendScriptsOnWorldExit", true, "We haven't decided on the behavior yet, but let's be brave! This option suspends all the scripts in a world as soon as the user moves to another world.  This should really be a world-specific option."],

        ["nullMoveAfterTicks", false, "For the engine/piano demo (and any other simulation interacting with unmoving mouse) it is necessary to generate a mouseMove event after each tick set this true in localconfig if you need this behavior"],

        ["suppressWebStoreCaching", false, "Disable caching of webstore requests"],

        ["askBeforeQuit", true, "Confirm system shutdown from the user"],

        ["useShadowMorphs", true],

        ["loadSerializedSubworlds", false, "load serialized worlds instead of building them from Javascript"],

        ["personalServerPort", 8081, "where the local web server runs"],

        ["mainDelay", 0.05, "the delay set on the main() function"],

        ["useStyling", false, "whether the .style property should be used"],

        ["verboseImport", false],

        ["suppressClipboardHack", false],

        ["suppressDefaultMouseBehavior", UserAgent.canExtendBrowserObjects, "e.g. don't open standard Brwser menu on right"],

        ["resizeScreenToWorldBounds", false],

        ["changeLocationOnSaveWorldAs", false],

        ["alignToGridSpace", 10, "determins the pixels to snap to during shift dragging with mouse"],
        ["ballonHelpDelay", 1000],

        // Fabrik
        ["showFabrikComponentBox", false],
        ["showFahrenheitCelsiusExample", false],
        ["showTextListExample", false],
        ["openFabrikBrowserExample", false],
        ["showFabrikWeatherWidgetExample", false],

        // Tests
        ["loadTests", [], 'e.g. ["FabrikTest", "RecordTest", "TestFrameworkTests", "ClassTest", "LKWikiTest", "DevelopTest", "MorphTest"]'],
        ["showTesterRunner", false],
        ["serverInvokedTest", false],

        // Modules
        ["modulesBeforeChanges", ['lively.ChangeSet'], "evaluated first, even before ChangeSet of a world"],
        ["modulesBeforeWorldLoad", [], "evaluated before all changes"],
        ["modulesOnWorldLoad", [], "evaluated before ChangeSet initializer"],
        ["codeBase", Config.codeBase && Config.codeBase != '' ? Config.codeBase : Config.getDocumentDirectory()],
        ["showModuleDefStack", true, "so modules know where they were required from"],
        ["loadUserConfig", false, "for sth like jens/config.js, used in lively.bootstrap"],
        ["modulePaths", [], "root URLs of module lookup"],

        ["disableScriptCaching", false],
        ["defaultDisplayTheme", 'lively'],

        ["onWindowResizeUpdateWorldBounds", true],
        ["disableNoConsoleWarning", false],

        ["confirmNavigation", false, "don't show confirmation dialog when navigating a link"],
        ["useAltAsCommand", false, "User Platform Keys (Ctrl und Windows and Meta under Mac as command key)"],

        ["pageNavigationName", "nothing"],
        ["pageNavigationWithKeys", true, "boy, that's ugly!!!"],
        ["showPageNumber", true],

        ["useFlattenedHTMLRenderingLayer", true],
        ["useDelayedHTMLRendering", false],

        // this part is for the CodeDB extension using CouchDB
        ["couchDBURL", document.location.protocol + '//' + document.location.host + '/couchdb'],
        ["defaultCodeDB", 'code_db'],
        ["wikiRepoUrl", null],

        ["forceHTML", false],

        ["userNameURL", document.location.protocol + '//' + document.location.host + '/cgi/user.sh']
    ],

    'lively.morphic.Main', [
        ["createNewWorld", false, "if createNewWorld is true then a new WorldMorph is build while loading instead of deserializing one"]
    ],

    'lively.morphic.Examples', [
        ["skipMostExamples", false, "Quickly enable/disable most demos"],
        ["skipAllExamples", false],
        ["showGridDemo", false],
        ["showCurveExample", false],
        ["showThumbnail", false, "Additional demo configuration options"],
        ["showNetworkExamples", UserAgent.usableXmlHttpRequest, "Enables/disables network-dependent demos"],
        ["showClock", true],
        ["showStar", true],
        ["spinningStar", true],
        ["showHilbertFun", true],
        ["showPenScript", true],
        ["showTester", true],
        ["showBitmap", false],
        ["showMap", !Config.skipMostExamples && !UserAgent.isTouch],
        ["showKaleidoscope", !Config.skipMostExamples && !UserAgent.isTouch],
        ["showSampleMorphs", true],
        ["showTextSamples", true],
        ["showSystemBrowser", false],

        ["showInnerWorld", true/*!Config.skipMostExamples*/],
        ["showSlideWorld", true/*!Config.skipMostExamples*/],
        ["showDeveloperWorld", true/*!Config.skipMostExamples*/],

        ["showClipMorph", function() { return !Config.skipMostExamples}],
        ["show3DLogo", function() { return !Config.skipMostExamples}],
        ["showAsteroids", function() { return !Config.skipMostExamples && !UserAgent.isTouch}],
        ["showEngine", function() { return !Config.skipMostExamples}],
        ["showIcon", function() { return !Config.skipMostExamples}],
        ["showWeather", function() { return !Config.skipMostExamples}],
        ["showStocks", function() { return !Config.skipMostExamples}],
        ["showCanvasScape", function() { return !Config.skipMostExamples && !UserAgent.isTouch}],
        ["showRSSReader", function() { return !Config.skipMostExamples}],
        ["showSquiggle", function() { return !Config.skipMostExamples}],
        ["showWebStore", function() { return !Config.skipMostExamples || Config.browserAnyway}],
        ["showVideo", function() { return !Config.skipMostExamples && !UserAgent.isTouch}]
    ],

    'lively.morphic.Events', [
        ["useMetaAsCommand", false, "Use the meta modifier (maps to Command on the Mac) instead of alt"],
        ["showGrabHalo", false, "enable grab halo (alternative to shadow) on objects in the hand."],
        ["hideSystemCursor", !(ExistingConfig && ExistingConfig.isNewMorphic)],
        ["handleOnCapture", true],
        ["globalGrabbing", true],
        ["touchBeMouse", UserAgent.isTouch]
    ],

    'lively.morphic.Debugging', [
        ["ignoreAdvice", UserAgent.isRhino, "Ignore function logging through the prototype.js wrap mechanism rhino will give more useful exception info"],
        ["showLivelyConsole", false, "Open up our console"],
        ["debugExtras", false, "Enable advanced debugging options"]
    ],

    'lively.morphic.Text', [
        ["fontMetricsFromHTML", UserAgent.usableHTMLEnvironment, "Derive font metrics from (X)HTML"],
        ["fontMetricsFromSVG", false, "Derive font metrics from SVG"],
        ["fakeFontMetrics", !UserAgent.usableHTMLEnvironment, "Try to make up font metrics entirely (can be overriden to use the native SVG API, which rarely works)"],
        ["showMostTyping", true, "Defeat bundled type-in for better response in short strings"],
        // Until we're confident
        ["showAllTyping", true, "Defeat all bundled type-in for testing"],
        ["useSoftTabs", true],
        ["disableSyntaxHighlighting", false]
    ]
);

})(Config, UserAgent, ExistingConfig);


(function addOptionsFromPreBootstrapConfig(Global) {

    var ExistingConfig = Global.ExistingConfig;

    if (!ExistingConfig) return;

    for (var name in ExistingConfig) {
        var value = ExistingConfig[name];
        if (Config.hasOption(name)) {
            Config.set(name, value)
        } else {
            Config.addOption(name, value, null, 'pre-bootstrap config option');
        }
    }

    delete Global.ExistingConfig;

})(window);

(function addConfigToLivelyNS(Global) {
    var lively = Global.lively = Global.lively || {};
    lively.Config = Global.Config;
})(window);

(function setupTracking() {
    if (lively.Config.get('trackUsage')) {
        lively.Config.enableTracking();
    }
})();