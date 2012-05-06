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

var UserAgent = (function() {

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

    // Determines User Agent capabilities
    return {
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

    };

})();

//--------------------------
// Determine runtime behavior based on UA capabilities and user choices
// (can be overriden in localconfig.js)
// --------------------------
var ExistingConfig;
if (Config) { ExistingConfig = Config; }

var Config = {

    _options: {},
    trackUsage: true,

    addOption: function(name, value, docString, type, group) {
        if (name === '_options') {
            throw new Error('Cannot set Config._options! Reserved!');
        }
        this[name] = value;
        this._options[name] = {doc: docString, type: type}
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
        var args = Array.from(arguments);
        for (var i = 0; i < args.length; i += 2) {
            var group = args[i],
                options = args[i+1];
            options.forEach(function(optionSpec) {
                optionSpec[4] = group;
                Config.addOption.apply(Config, optionSpec);
            }, this);
        }
    }
}

if (Config.trackUsage) {
    Object.extend(Config, {

        usage: {},

        allOptionNames: function() { return Properties.own(this._options) },
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


        addOption: function(name, value, docString, type, group) {
            if (name === '_options') { throw new Error('Cannot set Config._options! Reserved!'); }
            this._options[name] = {doc: docString, type: type}
            var internalName = '__' + name,
                usageStats = {read: [], write: []},
                self = this;
            this.usage[name] = usageStats;
            this[internalName] = value;
            this.__defineGetter__(name, function() {
                var stack;
                try { throw new Error() } catch(e) { stack = e.stack }
                usageStats.read.push(stack);
                return self[internalName];
            });
            this.__defineSetter__(name, function(value) {
                var stack;
                try { throw new Error() } catch(e) { stack = e.stack }
                usageStats.write.push(stack);
                return self[internalName] = value;
            });
        }
    });
}

Config.addOptions(
    'lively.Network', [
        ["proxyURL", null, "URL that acts as a proxy for network operations"]
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
        ["showNetworkExamples", UserAgent.usableXmlHttpRequest, "Enables/disables network-dependent demos"]
    ],
    'lively.morphic.Events', [
        ["useMetaAsCommand", false, "Use the meta modifier (maps to Command on the Mac) instead of alt"],
        ["showGrabHalo", false, "enable grab halo (alternative to shadow) on objects in the hand."]
    ],
    'lively.morphic.Debugging', [
        ["ignoreAdvice", UserAgent.isRhino, "Ignore function logging through the prototype.js wrap mechanism rhino will give more useful exception info"],
        ["showLivelyConsole", false, "Open up our console"]
    ],
    'lively.morphic.Text', [
        ["fontMetricsFromHTML", UserAgent.usableHTMLEnvironment, "Derive font metrics from (X)HTML"],
        ["fontMetricsFromSVG", false, "Derive font metrics from SVG"],
        ["fakeFontMetrics", !UserAgent.usableHTMLEnvironment, "Try to make up font metrics entirely (can be overriden to use the native SVG API, which rarely works)"]
    ],
    'lively.morphic', [
        ['shiftDragForDup', true, 'Allows easy object duplication using the Shift key'],
        ["usePieMenus", UserAgent.isTouch],
        ["suppressBalloonHelp", true],
        ["useTransformAPI", (!UserAgent.isOpera) && UserAgent.usableTransformAPI, "Use the browser's affine transforms"],
        ["useGetTransformToElement", !(UserAgent.isOpera || UserAgent.isIE || UserAgent.fireFoxVersion && (UserAgent.fireFoxVersion[0] == '2' || UserAgent.fireFoxVersion[0] == '3')), "Firefox, Opera and IE have known problems with getTransformToElement, detect it"],

        ["useDropShadow", UserAgent.usableDropShadow, "Enable drop shadows for objects (does not work well in most browsers)"],

        ["suspendScriptsOnWorldExit", true, "We haven't decided on the behavior yet, but let's be brave! This option suspends all the scripts in a world as soon as the user moves to another world.  This should really be a world-specific option."],

        ["nullMoveAfterTicks", false, "For the engine/piano demo (and any other simulation interacting with unmoving mouse) it is necessary to generate a mouseMove event after each tick set this true in localconfig if you need this behavior"],

        ["suppressWebStoreCaching", false, "Disable caching of webstore requests"],

        ["showMostTyping", true, "Defeat bundled type-in for better response in short strings"],

        ["showAllTyping", true, "Defeat all bundled type-in for testing"],  // Until we're confident


        ["askBeforeQuit", true, "Confirm system shutdown from the user"],

        ["debugExtras", false, "Enable advanced debugging options"],

        ["useShadowMorphs", true],

        ["loadSerializedSubworlds", false, "load serialized worlds instead of building them from Javascript"],

        ["personalServerPort", 8081, "where the local web server runs"],

        ["mainDelay", 0.05, "the delay set on the main() function"],

        ["useStyling", false, "whether the .style property should be used"],

        ["verboseImport", false],

        ["selfConnect", false, "some widgets self connect to a private model on startup, but it doesn't seem necessary, turn on to override"],

        ["suppressClipboardHack", false],

        ["suppressDefaultMouseBehavior", UserAgent.canExtendBrowserObjects, "e.g. don't open standard Brwser menu on right"],

        ["resizeScreenToWorldBounds", false],

        ["changeLocationOnSaveWorldAs", false]
]);

// These various overrides of the above have been moved here from main.js
//    so that they can be overridden in localconfig.js
//    at some point we should refactor this file nicely.
Config.showClock = true;
Config.showStar = true;
Config.spinningStar = true;
Config.showHilbertFun = true;
Config.showPenScript = true;
Config.showTester = true;
Config.showBitmap = false;
Config.showMap = !Config.skipMostExamples && !UserAgent.isTouch;
Config.showKaleidoscope = !Config.skipMostExamples && !UserAgent.isTouch;
Config.showSampleMorphs = true;
Config.showTextSamples = true;
Config.showSystemBrowser = false;

// More complex demos
Object.extend(Config, {
    showClipMorph: function() { return !Config.skipMostExamples},
    show3DLogo: function() { return !Config.skipMostExamples},
    showAsteroids: function() { return !Config.skipMostExamples && !UserAgent.isTouch},
    showEngine: function() { return !Config.skipMostExamples},
    showIcon: function() { return !Config.skipMostExamples},
    showWeather: function() { return !Config.skipMostExamples},
    showStocks: function() { return !Config.skipMostExamples},
    showCanvasScape: function() { return !Config.skipMostExamples && !UserAgent.isTouch},
    showRSSReader: function() { return !Config.skipMostExamples},
    showSquiggle: function() { return !Config.skipMostExamples},
    showWebStore: function() { return !Config.skipMostExamples || Config.browserAnyway},
    showVideo: function() { return !Config.skipMostExamples && !UserAgent.isTouch},
    // Worlds
    showInnerWorld: true, //!Config.skipMostExamples;
    showSlideWorld: true, //!Config.skipMostExamples;
    showDeveloperWorld: true, //!Config.skipMostExamples;
});

Object.extend(Config, {
    getDocumentDirectory: function() {
        var url = document.URL;
        return url.substring(0, url.lastIndexOf('/') + 1);
    },
});

Object.extend(Config, {
    // Morphic
    alignToGridSpace: 10, // determins the pixels to snap to during shift dragging with mouse
    ballonHelpDelay: 1000,
    silentFailOnWrapperClassNotFound: true,
    // Fabrik
    showFabrikComponentBox: false,
    showFahrenheitCelsiusExample: false,
    showTextListExample: false,
    openFabrikBrowserExample: false,
    // Tests
    loadTests: [], //e.g. ["FabrikTest", "RecordTest", "TestFrameworkTests", "ClassTest", "LKWikiTest", "DevelopTest", "MorphTest"]
    showTesterRunner: false,
    // Modules
    modulesBeforeChanges: ['lively.ChangeSet'], // evaluated first, even before ChangeSet of a world
    modulesBeforeWorldLoad: [], // evaluated before all changes
    modulesOnWorldLoad: [], // evaluated before ChangeSet initializer
    codeBase: Config.codeBase != undefined && Config.codeBase != '' ?
        Config.codeBase : Config.getDocumentDirectory(),
    disableScriptCaching: false,
    defaultDisplayTheme: 'lively',
    hideSystemCursor: !(ExistingConfig && ExistingConfig.isNewMorphic),
});

Config.onWindowResizeUpdateWorldBounds = true;
Config.disableNoConsoleWarning = false;

//    *** Minimal World Only ***
//  In spite of all the foregoing complexity, merely changing this conditional
//    to true will bypass all examples and worlds, and only create a few
//    simple morphs in a simple world.
//
//    If you copy these lines to localconfig.js you won't need
//    to alter any of the supplied Lively Kernel files.
if (false) {
    Config.showInnerWorld = false;
    Config.showDeveloperWorld = false;
    Config.showSlideWorld = false;
    Config.showOnlySimpleMorphs = true;
    Config.showStar = false;  // true to show star
    Config.spinningStar = false;  // true to enable spinning
}

Config.confirmNavigation = false; // don't show confirmation dialog when navigating a link
Config.useAltAsCommand = false; // User Platform Keys (Ctrl und Windows and Meta under Mac as command key)

Config.pageNavigationName = "nothing"
Config.pageNavigationWithKeys = true; // boy, that's ugly!!!
Config.showPageNumber = true;

Config.ignoreLoadingErrors = true

Config.touchBeMouse = UserAgent.isTouch

Config.useFlattenedHTMLRenderingLayer = true
Config.useDelayedHTMLRendering = false

// this part is for the CodeDB extension using CouchDB
Config.couchDBURL = document.location.protocol + '//' + document.location.host + '/couchdb';
Config.defaultCodeDB = 'code_db';
Config.wikiRepoUrl = null;

// this part is for the Node.JS server-side
Config.nodeJSURL = document.location.protocol + '//' + document.location.host + '/nodejs';
Config.nodeJSPath = '/home/nodejs/';

Config.serverInvokedTest = false;

Config.ignoreClassNotFound = true; // if a class is not found during deserializing a place holder object can be created instead of raising an error

Config.forceHTML = false;

Config.loadUserConfig = false; // for sth like jens/config.js, used in lively.bootstrap

// This is for Persistence.js (ask Martin).
Config.keepSerializerIds = false;
Config.useOfflineStorage = false;

Config.showModuleDefStack = true; // so modules know where they were required from

Config.debugConnect = false; // for triggering a breakpoint when an connect update throws an error

Config.userNameURL = document.location.protocol + '//' + document.location.host + '/cgi/user.sh';

Config.useSoftTabs = true;

Config.disableSyntaxHighlighting = false;

Config.handleOnCapture = true;

Config.copDynamicInlining = false;

Config.globalGrabbing = true;

Config.visualConnectEnabled = false

if (ExistingConfig) Object.extend(Config, ExistingConfig);