// see http://peter.sh/experiments/chromium-command-line-switches/
var chromeArgs =   ["--no-process-singleton-dialog",
                    "--user-data-dir=/tmp/", "--no-first-run",
                    "--disable-default-apps",
                    //"--no-startup-window",
                    "--disable-history-quick-provider",
                    "--disable-history-url-provider",
                    "--disable-breakpad",
                    "--disable-background-mode",
                    "--disable-background-networking",
                    "--disable-preconnect", "--disabled"],
    firefoxArgs =  [];

module.exports = Config = {

    timeout: 60,
    // ------------- what system do you want to test on?
    defaultBrowser: "chrome",
    defaultNotifier: "growlnotify",
    defaultTestScript: "run_tests.js",
    defaultTestWorld: 'testing/run_tests.xhtml',

    platformConfigs: {
        "darwin": {
            "chrome": {
                path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                args: chromeArgs
            },
            "firefox": {
                path: "/Applications/Firefox.app/Contents/MacOS/firefox",
                args: firefoxArgs
            }
        },
        "linux": {
            "chrome": {
                path: "/usr/bin/chromium-browser",
                args: chromeArgs
            },
            "firefox": {
                path: "/usr/bin/firefox",
                args: firefoxArgs
            }

        }
    }
};
