/**
 * defaultconfig.js.  System default configuration. Reads config.json
 *
 * Note that if the files localconfig.json and/or localconfig.js can be found,
 * those will be read immediately after this one, thus allowing any of these settings
 * to be overridden to adapt a local Lively installation.
 */

(function ensureGlobal() {
  var _Global = typeof Global !== 'undefined' ? Global :
               (typeof window !== 'undefined' ? window :
                (typeof global !== 'undefined' ? global : this));
  _Global.Global = _Global;
})();

(function setupUserAgent(Global) {

var webKitVersion = (function() {
    if (!Global.navigator) return 0;
    var match = Global.navigator.userAgent.match(/.*AppleWebKit\/(\d+).*/);
    return match ? parseInt(match[1]) : 0;
})();

var isMozilla = Global.navigator && Global.navigator.userAgent.indexOf("Mozilla") > -1,
    isChrome = Global.navigator && Global.navigator.userAgent.indexOf("Chrome") > -1,
    isOpera = Global.navigator && Global.navigator.userAgent.indexOf("Opera") > -1,
    isIE = Global.navigator && Global.navigator.userAgent.indexOf("MSIE") > -1,
    isMobile = (Global.navigator && Global.navigator.userAgent.indexOf("Mobile") > -1) ||
        (window && window.location && window.location.search && 
        (window.location.search.indexOf('forceIsMobile=true') > 0)),
    fireFoxVersion = Global.navigator &&
    (Global.navigator.userAgent.split("Firefox/")[1] ||
     Global.navigator.userAgent.split("Minefield/")[1]); // nightly

Global.UserAgent = {
    // WebKit XMLSerializer seems to do weird things with namespaces
    usableNamespacesInSerializer: true, //webKitVersion <= 0,

    webKitVersion: webKitVersion,

    isMozilla: isMozilla,

    isChrome: isChrome,

    isOpera: isOpera,

    isIE: isIE,

    fireFoxVersion: fireFoxVersion ? fireFoxVersion.split('.') : null,

    isWindows: Global.navigator && Global.navigator.platform == "Win32",

    isLinux: Global.navigator && Global.navigator.platform.match(/^Linux/),

    isMacOS: Global.navigator && Global.navigator.platform.match(/^Mac/),

    isTouch: false,

    isMobile: isMobile,

    touchIsMouse: false,

    isNodejs: (Global.process && !!Global.process.versions.node)
            || Global.navigator.userAgent.indexOf("Node.js") !== -1,

    isWorker: typeof importScripts !== 'undefined'
}

})(Global);


(function savePreBootstrapConfig(Global) {
    Global.ExistingConfig = Global.Config;
    if (Global.ExistingConfig) {
        delete Global.ExistingConfig._options;
    }
})(Global);

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
            if (typeof option.get === 'object' && option.get.type === 'function' && option.get.code) {
                try {
                    option.get = eval("(" + option.get.code + ")\n\n//# sourceURL=lively.Config.get."+name);
                    this.__defineGetter__(name, option.get);
                } catch (e) {
                    console.error("Cannot initialize lively.Config." + name + ":\n" + e);
                }
            }
        }

        if (typeof option.set === 'object' && option.set.type === 'function' && option.set.code) {
            try {
                option.set = eval("(" + option.set.code + ")\n\n//# sourceURL=lively.Config.set."+name)
                this.__defineSetter__(name, option.set);
            } catch (e) {
                console.error("Cannot initialize lively.Config." + name + ":\n" + e);
            }
        }

        if (!type && typeof value !== 'undefined') {
            if (value instanceof RegExp) type = 'RegExp'
            else if (Array.isArray(value)) type = 'Array'
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

        if (!option.get && !option.set) this[name] = value;
        else if (!option.set) option.set(value);
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
        var config = this, args = Array.prototype.slice.call(arguments);
        for (var i = 0; i < args.length; i += 2) {
            var group = args[i], options = args[i+1];
            options.forEach(function(optionSpec) {
                if (Array.isArray(optionSpec)) {
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
        var queries = this.parseURLQuery(String(document.location.search));
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
        lively.module(userConfigModule).load(true);
        this.urlQueryOverride();
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

    toggle: function(name) { this.set(name, !this.get(name)); },

    lookup: function(name) {
        // retrieve the Config value. If its a function: don't call it.
        var spec = this._options[name];
        return spec && spec.get ? this.get(name) : this[name];
    },

    add: function(name, value) {
        var arr = this.get(name);
        if (!Array.isArray(arr)) {
            throw new Error('Trying to add to a non-array lively.Config.' + name);
        }
        this.set(name, arr.concat([value]));
    },

    parseURLQuery: function(queryString) {
        return queryString.split(/[\?\&]/).reduce(function(query, part) {
          if (!part) return query;
          var keyAndVal = decodeURIComponent(part).split("=");
          var val = keyAndVal[1];
          if (val === "true") val = true;
          else if (val === "false") val = false;
          else if (val === "null") val = null;
          else if (!isNaN(Number(val))) val = Number(val);
          query[keyAndVal[0]] = val;
          return query;
        }, {});
    },

    // helper methods
    bootstrap: function(LivelyLoader, JSLoader, PreBootstrapConfig, thenDo) {
        var Config = this;

        // 2. load core/lively/config.json
        var url = PreBootstrapConfig.codeBase + "lively/config.json";
        JSLoader.loadJSON(url, function(err, configData) {
            if (err) thenDo(err);
            else setOptionsFromConfigJSONData(configData, function(err) {
                addOptionsFromPreBootstrapConfig(PreBootstrapConfig, Config);
                // 3. load core/lively/localconfig.js(on)
                if (err) thenDo(err);
                else loadConfigCustomization(thenDo);
            });
        });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function setOptionsFromConfigJSONData(configData, next) {
            try {
                var def = Object.keys(configData).reduce(function(def, group) {
                    return def.concat([group, configData[group]]); }, []);
                Config.addOptions.apply(Config, def);
            } catch(e) { next(e, null); return; }
            next(null);
        }

        function loadConfigCustomization(thenDo) {
            loadLocalconfig(function(err) {
              setConfigOptionsFromURL(); thenDo && thenDo(); });
        }

        function loadLocalconfig(thenDo) {
            try {
                var path = Config.rootPath.replace(/\/?$/, '/') + 'core/lively/localconfig.js';
                JSLoader.loadJs(path, function(err) {
                  /*ignore the error*/
                  thenDo && thenDo(); });
            } catch(e) { console.log('localconfig.js could not be loaded.'); thenDo(e); }
        }

        function setConfigOptionsFromURL() {
            try {
                lively.Config.urlQueryOverride();
            } catch(e) { console.log('Config customization via URL query could not be applied.'); }
        }

        function addOptionsFromPreBootstrapConfig(ExistingConfig, NewConfig) {
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
        }
    },

    addConfigToLivelyNS: function() {
        var lively = Global.lively = Global.lively || {};
        lively.Config = this;
    },

    getDocumentDirectory: function() {
        // used in various places
        return JSLoader.currentDir();
    },

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
        var warn = lively.$('<div/>');
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

(function addSystemConfigOptions(Config, UserAgent) {

    var browserPrefix = (function() {
        if (UserAgent.fireFoxVersion) return 'moz';
        if (UserAgent.isIE) return 'ms';
        if (UserAgent.isOpera) return 'o';
        if (UserAgent.webKitVersion) return 'webkit';
        return '';
    })(), browserPrefixDash = browserPrefix ? '-' + browserPrefix + '-' : '';

    Config.addOptions(
        "lively.morphic.Rendering", [
            ["browserPrefix", browserPrefix, "Prefix used for accessing browser specific features."],
            ["html5CssPrefix", browserPrefixDash],
            ["html5TransformProperty", UserAgent.isOpera ? 'OTransform' : (UserAgent.fireFoxVersion ? "" : browserPrefixDash + 'transform')],
            ["html5TransformOriginProperty", UserAgent.isOpera ? 'OTransformOrigin' : (browserPrefixDash + 'transform-origin')]
        ]);

})(Global.Config, Global.UserAgent);

(function init(Config) {
    Config.addConfigToLivelyNS();
})(Global.Config);

(function exports() {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = Global.Config;
})();
