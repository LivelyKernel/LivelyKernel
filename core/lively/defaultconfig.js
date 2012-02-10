/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc. 
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
        var match = navigator.userAgent.match(/.*AppleWebKit\/(\d+).*/) 
        return match ? parseInt(match[1]) : 0;
    })();

    var isRhino = !window.navigator || window.navigator.userAgent.indexOf("Rhino") > -1;
    var isMozilla = window.navigator && window.navigator.userAgent.indexOf("Mozilla") > -1;
    var isChrome = window.navigator && window.navigator.userAgent.indexOf("Chrome") > -1;
    var isOpera = window.navigator && window.navigator.userAgent.indexOf("Opera") > -1;
    var isIE = window.navigator && window.navigator.userAgent.indexOf("MSIE") > -1;
    var fireFoxVersion = window.navigator && window.navigator.userAgent.split("Firefox/")[1]; // may be undefined
    if (fireFoxVersion == null)
    fireFoxVersion = window.navigator && window.navigator.userAgent.split("Minefield/")[1];

    // Determines User Agent capabilities
    return {
        // Newer versions of WebKit implement proper SVGTransform API,
        // with potentially better performance. Scratch that, lets make it more predictable:
        usableTransformAPI: (webKitVersion < 0), //webKitVersion >= 525,
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
//  iPhone/iPad support...
// Here is a first cut at iPad touch/mouse compatibility
//  set usePieMenus = true since we can't use modifier keys on clicks
// In touch mode [only get mouseDown events]
//        if down/up with little movement, then set drag mode (touchIsMouse = true)
//    In drag mode
//        if down/up with little movement, then set touch mode
//    detect both of these in WoldMorph showPieMenu
//    Indicate touch mode by pentagonal blue cursor
//    Indicate drag mode by regular arrow, but bigger for iPad
//--------------------------
// Following iPhone/iPad code borrowed from...
//    http://rossboucher.com/2008/08/19/iphone-touch-events-in-javascript/
// UserAgent.touchHandler = function(event) {
//     var first = event.changedTouches[0],
//         type = "";
//     switch(event.type) {  
//         case "touchstart": type = "mousedown"; break;
//         case "touchmove":  type = "mousemove"; break;        
//         case "touchend":   type = "mouseup"; break;
//         default: return;
//     }
// 
//     //initMouseEvent(type, canBubble, cancelable, view, clickCount, 
//     //           screenX, screenY, clientX, clientY, ctrlKey, 
//     //           altKey, shiftKey, metaKey, button, relatedTarget);
//     var simulatedEvent = document.createEvent("MouseEvent");
//     simulatedEvent.initMouseEvent(type, true, true, window, 1, 
//                               first.screenX, first.screenY, 
//                               first.clientX, first.clientY, false, 
//                               false, false, false, 0/*left*/, null);
//     first.target.dispatchEvent(simulatedEvent);
//     event.preventDefault();
// };
// UserAgent.touchBeMouse = function (evt) {
//     if (this.touchIsMouse) return;
//     this.touchIsMouse = true;
//     if (evt) evt.hand.lookNormal();  // indicate mouse mode
//     document.addEventListener("touchstart", this.touchHandler, true);
//     document.addEventListener("touchmove", this.touchHandler, true);
//     document.addEventListener("touchend", this.touchHandler, true);
//     document.addEventListener("touchcancel", this.touchHandler, true); 
// };
// UserAgent.touchBeTouch = function (evt) {
//     if (!this.touchIsMouse) return;
//     this.touchIsMouse = false;
//     if (evt) evt.hand.lookTouchy();  // Indicate touch mode (pan / zoom)
//     document.removeEventListener("touchstart", this.touchHandler, true);
//     document.removeEventListener("touchmove", this.touchHandler, true);
//     document.removeEventListener("touchend", this.touchHandler, true);
//     document.removeEventListener("touchcancel", this.touchHandler, true); 
// };
// if (UserAgent.isTouch) UserAgent.touchBeMouse();


//--------------------------
// Determine runtime behavior based on UA capabilities and user choices (override in localconfig.js)
//--------------------------
if (Config) {
    var ExistingConfig = Config;
}
var Config = {}

Object.extend(Config, {

    // Allows easy object duplication using the Shift key
    shiftDragForDup: true,
    
    // URL that acts as a proxy for network operations 
    proxyURL: null,

    // if createNewWorld is true then a new WorldMorph is build while loading
    // instead of deserializing one
    createNewWorld: false,

    // Quickly enable/disable most demos
    skipMostExamples: false,
    skipAllExamples:  false,
    showCurveExample: false,
    showGridDemo: false,
    
    // Additional demo configuration options 
    showThumbnail: false,
    suppressBalloonHelp: true,
    usePieMenus: UserAgent.isTouch,
    
    // Enables/disables network-dependent demos
    showNetworkExamples: UserAgent.usableXmlHttpRequest,

    // Ignore function logging through the prototype.js wrap mechanism
    // rhino will give more useful exception info 
    ignoreAdvice: UserAgent.isRhino,

    // Derive font metrics from (X)HTML
    fontMetricsFromHTML: UserAgent.usableHTMLEnvironment,

    // Derive font metrics from SVG
    fontMetricsFromSVG: false,

    // Try to make up font metrics entirely (can be overriden to use the native SVG API, which rarely works)
    fakeFontMetrics: !UserAgent.usableHTMLEnvironment,

    // Use the browser's affine transforms
    useTransformAPI: (!UserAgent.isOpera) && UserAgent.usableTransformAPI, 

    // Firefox, Opera and IE have known problems with getTransformToElement, detect it
    useGetTransformToElement: !(UserAgent.isOpera || UserAgent.isIE ||
    UserAgent.fireFoxVersion && (UserAgent.fireFoxVersion[0] == '2' || UserAgent.fireFoxVersion[0] == '3')),

    // Enable drop shadows for objects (does not work well in most browsers)
    useDropShadow: UserAgent.usableDropShadow,

    // We haven't decided on the behavior yet, but let's be brave!
    // This option suspends all the scripts in a world as soon as
    // the user moves to another world.  This should really be a
    // world-specific option.
    suspendScriptsOnWorldExit: true,

    // For the engine/piano demo (and any other simulation interacting with unmoving mouse)
    // it is necessary to generate a mouseMove event after each tick
    // set this true in localconfig if you need this behavior 
    nullMoveAfterTicks: false,

    // Open up our console
    showLivelyConsole: false,

    // Disable caching of webstore requests
    suppressWebStoreCaching: false,

    // Defeat bundled type-in for better response in short strings
    showMostTyping: true,

    // Defeat all bundled type-in for testing
    showAllTyping: true,  // Until we're confident

    // Use the meta modifier (maps to Command on the Mac) instead of alt
    useMetaAsCommand: false,

    // Confirm system shutdown from the user
    askBeforeQuit: true,
    
    // Enable advanced debugging options
    debugExtras: false,

    // enable grab halo (alternative to shadow) on objects in the hand.
    showGrabHalo: false,
    useShadowMorphs: true,

    // load serialized worlds instead of building them from Javascript
    loadSerializedSubworlds: false,  //*** temporary avoidance of a failure

    // where the local web server runs
    // FIXME: parse /trunk/source/server/brazil.config to figure out the port?
    personalServerPort: 8081,

    // the delay set on the main() function
    mainDelay: 0.05,

    // whether the .style property should be used
    useStyling: false,

    verboseImport: false,

    // some widgets self connect to a private model on startup, but it doesn't
    // seem necessary, turn on to override
    selfConnect: false,
    suppressClipboardHack: false,

    // e.g. don't open standard Brwser menu on right
    suppressDefaultMouseBehavior: UserAgent.canExtendBrowserObjects,

    resizeScreenToWorldBounds: false,

    changeLocationOnSaveWorldAs: false,
});

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
    // Wiki
    showWikiNavigator: true,
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

if (ExistingConfig) Object.extend(Config, ExistingConfig);